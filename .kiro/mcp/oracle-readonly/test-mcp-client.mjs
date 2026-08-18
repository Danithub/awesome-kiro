// End-to-end test: launch server.js over stdio as a real MCP client,
// list tools, and exercise each tool. Requires a live DB + credentials
// (same env vars the server uses). Run: node test-mcp-client.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["server.js"],
  // env is inherited so ORACLE_* / ORACLE_CLIENT_LIB_DIR pass through.
  env: process.env,
});

const client = new Client({ name: "e2e-test", version: "1.0.0" }, {});

function textOf(res) {
  return (res.content || []).map((c) => c.text).join("\n");
}

async function main() {
  await client.connect(transport);

  const { tools } = await client.listTools();
  console.log("tools:", tools.map((t) => t.name).join(", "));

  const tbls = await client.callTool({ name: "list_tables", arguments: {} });
  console.log("\n[list_tables]\n" + textOf(tbls).split("\n").slice(0, 6).join("\n"));

  const q = await client.callTool({
    name: "run_query",
    arguments: { sql: "SELECT table_name FROM user_tables WHERE ROWNUM <= 5" },
  });
  console.log("\n[run_query]\n" + textOf(q));

  // must be rejected by the read-only guard (isError: true)
  const bad = await client.callTool({
    name: "run_query",
    arguments: { sql: "UPDATE dual SET dummy = 'Y'" },
  });
  console.log("\n[blocked write] isError =", bad.isError, "->", textOf(bad));

  await client.close();
  if (!bad.isError) { console.error("FAIL: write was not blocked"); process.exit(1); }
  console.log("\nE2E OK");
}

main().catch((e) => { console.error("E2E FAIL:", e); process.exit(1); });
