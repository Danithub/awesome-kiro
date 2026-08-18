#!/usr/bin/env node
// Read-only Oracle MCP server (generalized example)
// stdio transport. stdout is the JSON-RPC channel -> logs go to stderr only.

"use strict";

const fs = require("fs");
const path = require("path");
const oracledb = require("oracledb");

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");

// --- logging: stderr only (stdout is reserved for JSON-RPC) -----------------
function logErr(...args) {
  process.stderr.write("[oracle-readonly] " + args.join(" ") + "\n");
}

// --- config ------------------------------------------------------------------
const MAX_ROWS = Number(process.env.ORACLE_MAX_ROWS || 100);
const QUERY_TIMEOUT_MS = Number(process.env.ORACLE_QUERY_TIMEOUT_MS || 30000);

// --- JDBC URL parsing --------------------------------------------------------
// Converts a JDBC URL into an oracledb connectString.
// Handles the log4jdbc wrapper prefix and SID (":") vs service name ("/").
//   jdbc:log4jdbc:oracle:thin:@HOST:PORT:SID       -> SID form
//   jdbc:oracle:thin:@HOST:PORT/SERVICE            -> service-name form
function jdbcUrlToConnectString(rawUrl) {
  if (!rawUrl) return null;
  let url = String(rawUrl).trim();
  url = url.replace(/^jdbc:log4jdbc:/i, "jdbc:"); // drop SQL-logging wrapper
  const m = url.match(/^jdbc:oracle:thin:@(.+)$/i);
  const body = m ? m[1] : url.replace(/^@/, "");

  // service-name style: HOST:PORT/SERVICE
  const slash = body.match(/^([^:/]+):(\d+)\/(.+)$/);
  if (slash) {
    const [, host, port, service] = slash;
    return `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${host})(PORT=${port}))` +
      `(CONNECT_DATA=(SERVICE_NAME=${service})))`;
  }
  // SID style: HOST:PORT:SID
  const colon = body.match(/^([^:/]+):(\d+):(.+)$/);
  if (colon) {
    const [, host, port, sid] = colon;
    return `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${host})(PORT=${port}))` +
      `(CONNECT_DATA=(SID=${sid})))`;
  }
  return body; // assume already an Easy Connect / descriptor string
}

// --- credential loading ------------------------------------------------------
// Priority: environment variables first, then a jdbc.properties fallback.
// Nothing is ever hard-coded in source.
function parseJdbcProperties(filePath, profile) {
  const text = fs.readFileSync(filePath, "utf8");
  const props = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    props[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  const pfx = profile ? profile + "." : "";
  return {
    user: props[pfx + "jdbc.username"] || props["jdbc.username"],
    password: props[pfx + "jdbc.password"] || props["jdbc.password"],
    url: props[pfx + "jdbc.url"] || props["jdbc.url"],
  };
}

function loadCredentials() {
  let user = process.env.ORACLE_USER;
  let password = process.env.ORACLE_PASSWORD;
  let connectString = process.env.ORACLE_DSN;

  if ((!user || !password || !connectString) && process.env.ORACLE_JDBC_PROPERTIES) {
    const file = process.env.ORACLE_JDBC_PROPERTIES;
    const profile = process.env.ORACLE_JDBC_PROFILE || "dev";
    try {
      const p = parseJdbcProperties(file, profile);
      user = user || p.user;
      password = password || p.password;
      connectString = connectString || jdbcUrlToConnectString(p.url);
    } catch (e) {
      logErr("failed to read jdbc.properties:", e.message);
    }
  }
  if (!user || !password || !connectString) {
    throw new Error(
      "Missing credentials. Set ORACLE_USER / ORACLE_PASSWORD / ORACLE_DSN " +
      "or ORACLE_JDBC_PROPERTIES."
    );
  }
  return { user, password, connectString };
}

// --- read-only guard ---------------------------------------------------------
const FORBIDDEN = [
  "INSERT", "UPDATE", "DELETE", "MERGE", "DROP", "ALTER", "CREATE",
  "TRUNCATE", "GRANT", "REVOKE", "COMMIT", "ROLLBACK", "SAVEPOINT",
  "EXECUTE", "CALL", "BEGIN", "DECLARE", "LOCK", "FLASHBACK",
];

function stripComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ") // /* block */
    .replace(/--[^\n]*/g, " ");        // -- line
}

// Throws on anything that is not a single SELECT / WITH statement.
function validateReadOnlyQuery(rawSql) {
  if (!rawSql || !rawSql.trim()) throw new Error("Empty query.");
  const cleaned = stripComments(rawSql).trim();

  // allow at most one trailing semicolon (no multi-statement)
  const body = cleaned.replace(/;\s*$/, "");
  if (body.includes(";")) throw new Error("Multiple statements are not allowed.");

  if (!/^(SELECT|WITH)\b/i.test(body)) {
    throw new Error("Only SELECT / WITH queries are allowed.");
  }
  const upper = body.toUpperCase();
  for (const kw of FORBIDDEN) {
    if (new RegExp("\\b" + kw + "\\b").test(upper)) {
      throw new Error(`Forbidden keyword detected: ${kw}`);
    }
  }
  return body;
}

// --- oracle connection -------------------------------------------------------
let pool = null;

// Enable Thick mode when an Instant Client dir is provided. Required for DBs
// whose account uses an old password verifier (e.g. NJS-116 in Thin mode).
function initThickModeIfConfigured() {
  const libDir = process.env.ORACLE_CLIENT_LIB_DIR;
  if (libDir) {
    try {
      oracledb.initOracleClient({ libDir });
      logErr("Thick mode enabled, libDir=", libDir);
    } catch (e) {
      logErr("initOracleClient failed (staying Thin):", e.message);
    }
  }
}

async function getPool() {
  if (pool) return pool;
  const { user, password, connectString } = loadCredentials();
  pool = await oracledb.createPool({
    user, password, connectString, poolMin: 0, poolMax: 4, poolIncrement: 1,
  });
  return pool;
}

async function runSql(sql) {
  const p = await getPool();
  const conn = await p.getConnection();
  try {
    const result = await conn.execute(sql, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      maxRows: MAX_ROWS + 1, // fetch one extra to detect truncation
      callTimeout: QUERY_TIMEOUT_MS,
    });
    return result;
  } finally {
    await conn.close();
  }
}

// --- result formatting -------------------------------------------------------
function formatTable(columns, rows) {
  if (!rows.length) return "(0 rows)";
  const widths = columns.map((c) =>
    Math.max(c.length, ...rows.map((r) => String(r[c] ?? "").length))
  );
  const line = (cells) =>
    cells.map((v, i) => String(v).padEnd(widths[i])).join(" | ");
  const header = line(columns);
  const sep = widths.map((w) => "-".repeat(w)).join("-+-");
  const body = rows.map((r) => line(columns.map((c) => r[c] ?? "")));
  return [header, sep, ...body].join("\n");
}

function toolResult(text, isError = false) {
  return { content: [{ type: "text", text }], isError };
}

// --- tool implementations ----------------------------------------------------
async function toolRunQuery(sql) {
  const safe = validateReadOnlyQuery(sql);
  const result = await runSql(safe);
  const cols = result.metaData.map((m) => m.name);
  let rows = result.rows || [];
  let note = "";
  if (rows.length > MAX_ROWS) {
    rows = rows.slice(0, MAX_ROWS);
    note = `\n\n(truncated to ${MAX_ROWS} rows)`;
  }
  return toolResult(formatTable(cols, rows) + `\n\n${rows.length} row(s)` + note);
}

async function toolListTables(owner) {
  const sql = owner
    ? `SELECT owner, table_name FROM all_tables WHERE owner = UPPER(:o)
       ORDER BY table_name`
    : `SELECT table_name FROM user_tables ORDER BY table_name`;
  const p = await getPool();
  const conn = await p.getConnection();
  try {
    const r = await conn.execute(sql, owner ? { o: owner } : [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: MAX_ROWS + 1,
    });
    const cols = r.metaData.map((m) => m.name);
    let rows = r.rows || [];
    const note = rows.length > MAX_ROWS ? `\n\n(truncated to ${MAX_ROWS} rows)` : "";
    rows = rows.slice(0, MAX_ROWS);
    return toolResult(formatTable(cols, rows) + note);
  } finally {
    await conn.close();
  }
}

async function toolDescribeTable(tableName, owner) {
  const sql = owner
    ? `SELECT column_name, data_type, data_length, nullable
       FROM all_tab_columns WHERE table_name = UPPER(:t) AND owner = UPPER(:o)
       ORDER BY column_id`
    : `SELECT column_name, data_type, data_length, nullable
       FROM user_tab_columns WHERE table_name = UPPER(:t)
       ORDER BY column_id`;
  const binds = owner ? { t: tableName, o: owner } : { t: tableName };
  const p = await getPool();
  const conn = await p.getConnection();
  try {
    const r = await conn.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: 1000,
    });
    const cols = r.metaData.map((m) => m.name);
    return toolResult(formatTable(cols, r.rows || []));
  } finally {
    await conn.close();
  }
}

// --- MCP tool definitions (JSON Schema; no zod dependency) -------------------
const TOOLS = [
  {
    name: "run_query",
    description:
      "Run a single read-only SQL query (SELECT / WITH only) against the " +
      "Oracle DB and return the result as a text table. Writes are rejected.",
    inputSchema: {
      type: "object",
      properties: { sql: { type: "string", description: "A single SELECT/WITH statement." } },
      required: ["sql"],
    },
  },
  {
    name: "list_tables",
    description:
      "List tables. Without 'owner' it lists the current schema (USER_TABLES); " +
      "with 'owner' it lists ALL_TABLES for that schema.",
    inputSchema: {
      type: "object",
      properties: { owner: { type: "string", description: "Optional schema/owner name." } },
    },
  },
  {
    name: "describe_table",
    description:
      "Describe a table's columns (name, type, length, nullable). " +
      "Optionally scoped to an owner.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "Table name." },
        owner: { type: "string", description: "Optional schema/owner name." },
      },
      required: ["table_name"],
    },
  },
];

// --- server wiring -----------------------------------------------------------
function buildServer() {
  const server = new Server(
    { name: "oracle-readonly", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args = {} } = req.params;
    try {
      if (name === "run_query") return await toolRunQuery(args.sql);
      if (name === "list_tables") return await toolListTables(args.owner);
      if (name === "describe_table")
        return await toolDescribeTable(args.table_name, args.owner);
      return toolResult(`Unknown tool: ${name}`, true);
    } catch (e) {
      return toolResult(`Error: ${e.message}`, true);
    }
  });

  return server;
}

// --- entrypoints -------------------------------------------------------------
async function testConnection() {
  initThickModeIfConfigured();
  const p = await getPool();
  const conn = await p.getConnection();
  try {
    const r = await conn.execute(
      `SELECT sys_context('USERENV','DB_NAME') AS db_name,
              sys_context('USERENV','SESSION_USER') AS session_user
       FROM dual`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const cols = r.metaData.map((m) => m.name);
    process.stderr.write(formatTable(cols, r.rows) + "\n");
  } finally {
    await conn.close();
    await pool.close(0);
  }
}

async function main() {
  if (process.argv.includes("--test-connection")) {
    await testConnection();
    return;
  }
  initThickModeIfConfigured();
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logErr("oracle-readonly MCP server started (stdio).");
}

// Only auto-start when run directly, so tests can import the helpers.
if (require.main === module) {
  main().catch((e) => {
    logErr("fatal:", e.message);
    process.exit(1);
  });
}

module.exports = {
  jdbcUrlToConnectString,
  stripComments,
  validateReadOnlyQuery,
  parseJdbcProperties,
  formatTable,
  TOOLS,
};
