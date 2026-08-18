# oracle-readonly MCP 서버 (예시)

Oracle DB를 **조회 전용(SELECT only)** 으로 붙이는 stdio 방식 MCP 서버의
일반화된 예시입니다. 실제 접속 정보(호스트/계정/스키마/경로)는 모두
플레이스홀더이며, 환경변수 또는 `jdbc.properties`로 주입합니다.

> 이 폴더는 "이렇게 생겼다"를 보여주는 참고 구현입니다. 그대로 복사해 쓰기보다,
> 상위 문서 `kiro-mcp-setup.md`의 프롬프트로 **본인 DB에 맞게 Kiro가 생성/수정**
> 하도록 하는 것을 권장합니다.

## 목차
- [구성 파일](#구성-파일)
- [제공 도구](#제공-도구)
- [읽기 전용 안전장치](#읽기-전용-안전장치)
- [설치](#설치)
- [환경변수](#환경변수)
- [실행 / 테스트](#실행--테스트)
- [Thin vs Thick 모드](#thin-vs-thick-모드)
- [Kiro 등록](#kiro-등록)

## 구성 파일

| 파일 | 역할 |
|------|------|
| `server.js` | 서버 본체(도구 3종 + 읽기 전용 가드 + 접속) |
| `package.json` | 의존성(`oracledb`, `@modelcontextprotocol/sdk`) |
| `test-validation.mjs` | 가드/URL 파서 단위 테스트(DB 불필요) |
| `test-mcp-client.mjs` | stdio로 서버를 띄워 도구를 호출하는 e2e 테스트(DB 필요) |
| `mcp.json.example` | Kiro 등록 템플릿(크리덴셜/경로 제외). `.kiro/settings/mcp.json`에 채워 배치 |

## 제공 도구

| 도구 | 설명 |
|------|------|
| `run_query(sql)` | 단일 SELECT/WITH만 실행, 결과를 텍스트 표로 반환 |
| `list_tables(owner?)` | owner 없으면 현재 스키마, 있으면 해당 스키마 테이블 목록 |
| `describe_table(table_name, owner?)` | 컬럼명/타입/길이/NULL 여부 |

## 읽기 전용 안전장치

- SELECT / WITH로 시작하는 **단일 문장만** 허용
- 주석(`--`, `/* */`) 제거 후 금지 키워드 차단(INSERT/UPDATE/DELETE/MERGE/DROP/
  ALTER/CREATE/TRUNCATE/GRANT/REVOKE/COMMIT/ROLLBACK/EXECUTE/CALL/BEGIN/DECLARE 등)
- 세미콜론 다중문 차단(맨 끝 세미콜론 1개만 허용)
- 결과 행 상한(기본 100) / 쿼리 타임아웃(기본 30초)
- 로그는 **stderr 전용**(stdout은 JSON-RPC 채널이라 오염 금지)

## 설치

```
cd .kiro/mcp/oracle-readonly
npm install
```

> `oracledb` 설치 중 install-script 경고가 떠도 Thin/Thick 동작에는 보통 영향이
> 없습니다(바이너리는 존재). 사내 npm 프록시/레지스트리 환경이면 그에 맞게 설정하세요.

## 환경변수

크리덴셜은 **소스에 하드코딩하지 않습니다.** 아래 우선순위로 읽습니다.

| 변수 | 필수 | 설명 |
|------|------|------|
| `ORACLE_USER` | ○ | 접속 계정 |
| `ORACLE_PASSWORD` | ○ | 비밀번호 |
| `ORACLE_DSN` | ○ | connectString(디스크립터 또는 Easy Connect) |
| `ORACLE_JDBC_PROPERTIES` | △ | 위 3개 대신 jdbc.properties 경로로 fallback |
| `ORACLE_JDBC_PROFILE` | △ | 프로퍼티 프로파일(기본 `dev`) |
| `ORACLE_CLIENT_LIB_DIR` | △ | Instant Client 경로(지정 시 Thick 모드) |
| `ORACLE_MAX_ROWS` | △ | 결과 행 상한(기본 100) |
| `ORACLE_QUERY_TIMEOUT_MS` | △ | 쿼리 타임아웃(기본 30000) |

## 실행 / 테스트

```
# 가드/파서 단위 테스트 (DB 불필요)
node test-validation.mjs

# 접속 왕복 확인 (DB 필요)
node server.js --test-connection

# MCP 프로토콜 e2e (DB 필요)
node test-mcp-client.mjs
```

## Thin vs Thick 모드

- `oracledb`는 기본이 **Thin 모드**(순수 JS, Instant Client 불필요)입니다.
- 계정 비밀번호 verifier가 구형이면 Thin 로그인이 거부될 수 있습니다:
  `NJS-116: password verifier type ... is not supported ... in Thin mode`.
- 이때는 **Instant Client를 설치**하고 `ORACLE_CLIENT_LIB_DIR`로 경로를 지정해
  **Thick 모드**로 전환하면 접속됩니다. (경로는 개발자마다 다르므로 팀 공유 설정에
  하드코딩하지 말고 각자 env로 지정)
- 근본 해결은 DBA가 계정 비밀번호를 Thin 호환 verifier로 재설정하는 것입니다.

## Kiro 등록

- Kiro는 루트 `.mcp.json`이 아니라 **`.kiro/settings/mcp.json`** 을 읽습니다.
  (파일명도 점 없는 `mcp.json`)
- 등록 예시는 같은 폴더의 `mcp.json.example`을 참고하세요.
- `list_tables` / `describe_table`만 autoApprove, `run_query`는 매 호출 승인 권장.
