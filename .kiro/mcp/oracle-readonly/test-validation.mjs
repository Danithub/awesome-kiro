// Unit tests for the read-only guard and JDBC URL parser.
// Run: node test-validation.mjs   (no DB connection required)
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  validateReadOnlyQuery,
  jdbcUrlToConnectString,
} = require("./server.js");

let pass = 0;
let fail = 0;

function ok(name, cond) {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}`); }
}

function allowed(sql) {
  try { validateReadOnlyQuery(sql); return true; } catch { return false; }
}

// --- allowed queries ---------------------------------------------------------
ok("simple SELECT", allowed("SELECT * FROM emp"));
ok("lowercase select", allowed("select 1 from dual"));
ok("WITH cte", allowed("WITH t AS (SELECT 1 x FROM dual) SELECT * FROM t"));
ok("trailing semicolon", allowed("SELECT 1 FROM dual;"));
ok("leading whitespace", allowed("   SELECT 1 FROM dual"));
ok("line comment then select", allowed("-- note\nSELECT 1 FROM dual"));
ok("block comment then select", allowed("/* c */ SELECT 1 FROM dual"));
ok("column named update_date", allowed("SELECT update_date FROM t"));

// --- blocked queries ---------------------------------------------------------
ok("block UPDATE", !allowed("UPDATE emp SET sal = 0"));
ok("block DELETE", !allowed("DELETE FROM emp"));
ok("block INSERT", !allowed("INSERT INTO emp VALUES (1)"));
ok("block DROP", !allowed("DROP TABLE emp"));
ok("block ALTER", !allowed("ALTER TABLE emp ADD c NUMBER"));
ok("block TRUNCATE", !allowed("TRUNCATE TABLE emp"));
ok("block MERGE", !allowed("MERGE INTO a USING b ON (1=1)"));
ok("block GRANT", !allowed("GRANT SELECT ON emp TO x"));
ok("block PLSQL begin", !allowed("BEGIN NULL; END;"));
ok("block DECLARE", !allowed("DECLARE x NUMBER; BEGIN NULL; END;"));
ok("block multi-statement", !allowed("SELECT 1 FROM dual; DROP TABLE emp"));
ok("block hidden update via comment", !allowed("SELECT 1/* */,x FROM t;UPDATE t SET a=1"));
ok("block empty", !allowed("   "));

// --- JDBC URL parsing --------------------------------------------------------
const sid = jdbcUrlToConnectString(
  "jdbc:log4jdbc:oracle:thin:@db.example.com:1521:ORCLSID"
);
ok("log4jdbc wrapper stripped + SID", /\(SID=ORCLSID\)/.test(sid));
ok("SID has host", /\(HOST=db\.example\.com\)/.test(sid));

const svc = jdbcUrlToConnectString(
  "jdbc:oracle:thin:@db.example.com:1521/ORCLPDB"
);
ok("service-name form", /\(SERVICE_NAME=ORCLPDB\)/.test(svc));

// --- summary -----------------------------------------------------------------
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
