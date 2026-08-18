# Kiro로 읽기 전용 MCP 서버 붙이기 (프롬프트 가이드)

이 문서는 **Kiro에게 프롬프트를 시켜서** 사내/개인 DB에 붙는 **조회 전용
(read-only) MCP 서버**를 만들고 등록하는 과정을, 다른 사용자가 **프롬프트만
복붙**해 자기 로컬에 재현할 수 있도록 정리한 참고 문서입니다.

예시는 Oracle 기준이지만 접근 방식(프롬프트 흐름, 안전장치 설계, 등록 함정)은
다른 DB/도구에도 그대로 응용됩니다. 실제 구현 예시는
`.kiro/mcp/oracle-readonly/`에 함께 들어 있습니다.

> 이 문서는 Kiro 동작에 반영되는 자산이 아니라 **설명용 참고 문서**입니다
> (`command-permission-policy.md`, `kiro-workflows.md`와 같은 계층).

## 목차
- [0. 전제와 준비물](#0-전제와-준비물)
- [1. MCP와 Kiro 등록의 핵심](#1-mcp와-kiro-등록의-핵심)
- [2. Part A — 프롬프트로 서버 붙이기](#2-part-a--프롬프트로-서버-붙이기)
- [3. Part B — 붙인 뒤 활용하기](#3-part-b--붙인-뒤-활용하기)
- [4. 크리덴셜 / 보안 원칙](#4-크리덴셜--보안-원칙)
- [5. 함정 요약](#5-함정-요약)
- [6. 도입 체크리스트](#6-도입-체크리스트)
- [7. 예시 구현 (.kiro/mcp/oracle-readonly)](#7-예시-구현-kiromcporacle-readonly)

## 0. 전제와 준비물

프롬프트를 넣기 전에 아래를 손에 준비해 두면 대화가 매끄럽습니다.

- **런타임**: Node.js(권장) 또는 Python. 프로젝트에 `package.json`이 없어도
  서버는 독립 실행되므로 무방합니다.
- **접속 정보**: DB 호스트/포트, SID 또는 서비스명, 계정/비밀번호.
  사내는 보통 `jdbc.properties`(dev/local/prod 프로파일)에 들어 있습니다.
- **보안 원칙**: 크리덴셜은 소스/공유 설정에 **하드코딩 금지**. 환경변수 또는
  로컬 설정으로만 주입.
- **권한 경계**: `.kiro/settings/`는 워크스페이스 보안 규칙상 에이전트가 직접
  쓰지 못할 수 있습니다. 그럴 땐 Kiro가 만든 파일을 **사용자가 직접 배치**합니다.

> 아래 프롬프트의 `<...>` 부분만 본인 값으로 바꾸면 됩니다. 값이 애매하면
> "내 프로젝트에서 찾아줘"라고 Kiro에게 맡겨도 됩니다.

## 1. MCP와 Kiro 등록의 핵심

MCP(Model Context Protocol)는 Kiro 같은 에이전트가 **외부 도구/데이터에 붙는
표준 방식**입니다. 로컬에서는 보통 **stdio 전송**으로, Kiro가 서버 프로세스를
띄우고 stdin/stdout으로 JSON-RPC를 주고받습니다.

등록 시 자주 걸리는 두 가지 함정을 먼저 알아두세요.

- **함정 1 — 파일 위치/이름**: Kiro는 루트 `.mcp.json`이 아니라
  **`.kiro/settings/mcp.json`** 을 읽습니다. 파일명도 점 없는 `mcp.json`이어야
  합니다(`.mcp.json`은 인식 안 됨).
- **함정 2 — stdout 오염**: stdio 서버에서 stdout은 JSON-RPC 전용 채널입니다.
  `console.log`로 로그를 찍으면 프로토콜이 깨집니다. **로그는 반드시 stderr로.**

> 사용자 레벨(`~/.kiro/settings/mcp.json`)에 두면 모든 프로젝트에서 쓸 수 있고,
> 워크스페이스 레벨에 두면 그 프로젝트에만 적용됩니다.

## 2. Part A — 프롬프트로 서버 붙이기

아래 5단계 프롬프트를 순서대로 Kiro(Vibe 세션)에 붙여넣으면 됩니다. 각 단계가
끝나면 Kiro가 결과를 보여주고 다음 단계로 이어집니다.

### Step 0 — 사전 정보 수집

```text
내 프로젝트에 읽기 전용(SELECT only) DB MCP 서버를 붙이려고 해.
시작 전에 아래를 조사해서 표로 정리해줘.
1) 이 프로젝트의 DB 접속 정보 위치(jdbc.properties 등)와 dev 프로파일의
   URL/계정 (비밀번호는 마스킹).
2) 설치된 런타임 버전(node -v, python --version).
3) JDBC URL을 분석해서 host/port와, SID(콜론) 방식인지 service(슬래시)
   방식인지 판별해줘. log4jdbc 같은 래퍼 접두어가 있으면 제거한 실제 URL도.
아직 파일은 만들지 말고 조사 결과만 보여줘.
```

### Step 1 — 서버 생성

```text
조사 결과를 바탕으로 .kiro/mcp/oracle-readonly/ 아래에 stdio 방식의 읽기 전용
Oracle MCP 서버를 만들어줘. 조건:
- 런타임은 Node.js. 의존성은 oracledb 와 @modelcontextprotocol/sdk 만 사용.
- SDK는 low-level Server API + JSON Schema로 작성(zod 의존성 없이).
- 도구 3종: run_query(sql), list_tables(owner?), describe_table(table_name, owner?).
  각 도구에 에이전트가 이해할 description을 붙여줘.
- 크리덴셜은 하드코딩 금지. ORACLE_USER/ORACLE_PASSWORD/ORACLE_DSN 환경변수를
  우선 쓰고, 없으면 jdbc.properties(dev 프로파일)를 파싱하는 fallback으로.
- JDBC URL 파서는 log4jdbc 접두어 제거 + SID/service 구분해서 DSN을 구성.
- 로그는 stdout이 아니라 stderr로만. package.json도 같이 만들어줘.
```

### Step 2 — 안전장치 + 테스트

```text
이제 읽기 전용 안전장치를 다층으로 넣고 테스트를 만들어줘.
- SELECT/WITH로 시작하는 단일 문장만 허용.
- 주석(-- , /* */) 제거 후 금지 키워드 차단(INSERT/UPDATE/DELETE/MERGE/DROP/
  ALTER/CREATE/TRUNCATE/GRANT/REVOKE/COMMIT/ROLLBACK/EXECUTE/CALL/BEGIN/DECLARE).
- 세미콜론 다중문 차단(맨 끝 1개만 허용), 결과 행 상한 100, 쿼리 타임아웃 30초.
- 검증 함수는 export 하고 main()은 직접 실행 시에만 기동하도록 가드해서
  단위 테스트가 가능하게 해줘.
- test-validation.mjs(가드/URL 파서 단위테스트, DB 불필요)와
  test-mcp-client.mjs(stdio로 서버를 띄워 도구를 호출하는 e2e)도 만들어줘.
- server.js에 --test-connection CLI 모드도 추가해줘.
다 만들고 node test-validation.mjs 까지 돌려서 결과 보여줘.
```

### Step 3 — Kiro에 등록

```text
서버를 Kiro에 등록할 수 있게 준비해줘.
- .kiro/mcp/oracle-readonly/mcp.json.example 템플릿을 만들어줘(크리덴셜/경로는 플레이스홀더).
  command=node, args=[".kiro/mcp/oracle-readonly/server.js"], env로 접속정보,
  autoApprove는 list_tables/describe_table만(run_query 제외).
- 그리고 .kiro/settings/mcp.json 에 넣을 최종 내용을 보여줘.
  (이 폴더는 보안상 네가 직접 못 쓸 수 있으니, 그러면 내가 직접 배치할 수 있게
   "이 파일을 이 경로에 이 이름으로 저장" 지침을 알려줘.)
```

> Kiro가 `.kiro/settings/`에 쓰지 못한다고 하면, 보안 가드를 우회하려 하지 말고
> Kiro가 보여준 내용을 **직접** `.kiro/settings/mcp.json`으로 저장하세요.

### Step 4 — 접속 트러블슈팅 (Thin -> Thick)

Node `oracledb`는 기본이 순수 JS **Thin 모드**입니다. 구형 비밀번호 verifier를
쓰는 계정은 Thin 로그인이 거부될 수 있습니다.

```text
node server.js --test-connection 을 돌렸더니 아래 에러가 났어.
"NJS-116: password verifier type 0x... is not supported ... in Thin mode"
원인을 설명하고, 코드 수정 없이 Thick 모드로 붙는 방법을 알려줘.
- 시스템에 설치된 Oracle Instant Client 경로를 찾아줘.
- ORACLE_CLIENT_LIB_DIR 환경변수로 그 경로를 주면 Thick 모드로 전환되도록
  서버가 이미 대응돼 있는지 확인하고, 안 돼 있으면 그 분기만 추가해줘.
- 단, 특정 폴더 경로를 소스나 공유 설정(mcp.json.example)에 하드코딩하진 마.
  경로는 각 개발자가 env로 지정하는 방식으로.
```

> 근본 해결은 DBA가 계정 비밀번호를 Thin 호환 verifier로 재설정하는 것입니다.
> 그전까지는 Instant Client(Thick)가 사실상 필수입니다.

## 3. Part B — 붙인 뒤 활용하기

등록이 끝나면 Kiro 채팅에서 자연어로 도구를 부릅니다. Kiro가 알아서
`list_tables` / `describe_table` / `run_query`를 호출합니다.

**스키마 탐색**
```text
oracle-readonly로 현재 스키마의 테이블 목록을 보여줘. 그중 주문 관련 테이블이
뭔지 이름으로 추측해서 describe_table로 컬럼 구조까지 정리해줘.
```

**데이터 기반 질의**
```text
oracle-readonly로 최근 한 달 주문 건수를 상태별로 집계하는 SELECT를 만들어
실행하고, 결과를 표로 보여줘. (읽기 전용이니 SELECT만)
```

**개발 중 실데이터 참조**
```text
지금 작성 중인 이 매퍼(XML)의 쿼리가 반환하는 컬럼과 실제 테이블 컬럼이
맞는지 describe_table로 대조해줘. 불일치가 있으면 알려줘.
```

**활용 팁**

- `run_query`는 매 호출 승인이 뜨도록 두는 게 안전합니다. 조회가 잦은
  `list_tables` / `describe_table`만 autoApprove로 편하게 쓰세요.
- 스키마 파악을 자주 한다면, describe 결과를 steering이나 메모로 정리해 두면
  이후 대화에서 반복 조회를 줄일 수 있습니다.
- 결과가 100행에서 잘리면(상한), 집계/필터 SELECT로 좁혀 다시 물어보세요.

## 4. 크리덴셜 / 보안 원칙

- 크리덴셜은 **소스/공유 설정에 하드코딩 금지**. 환경변수(`ORACLE_*`) 우선,
  없으면 로컬 `jdbc.properties` 파싱 fallback.
- 공유 저장소에는 **값이 빠진 템플릿**(`.kiro/mcp/oracle-readonly/mcp.json.example`)
  만 커밋하고, 실제 값이 담긴 `.kiro/settings/mcp.json`은 커밋하지 않습니다
  (gitignore 권장).
- Instant Client 경로처럼 **개발자마다 다른 값**은 팀 설정에 박지 말고 각자 env로.
- 서버는 **읽기 전용**이 원칙: 쓰기 키워드는 코드 레벨에서 차단하고, DB 계정도
  가능하면 SELECT 권한만 가진 조회 전용 계정을 쓰세요.

## 5. 함정 요약

| 함정 | 내용 | 대응 |
|------|------|------|
| JDBC URL 파싱 | log4jdbc 래퍼, SID(콜론) vs Service(슬래시) 혼동 | 래퍼 제거 후 콜론/슬래시로 DSN 구성 |
| Thin 로그인 거부 | 구형 verifier에서 `NJS-116` | Instant Client + `ORACLE_CLIENT_LIB_DIR`로 Thick 전환 |
| stdout 오염 | `console.log`가 JSON-RPC 채널을 깨뜨림 | 로그는 stderr 전용 |
| 등록 파일 위치 | 루트 `.mcp.json`은 인식 안 됨 | `.kiro/settings/mcp.json`(점 없는 이름) |
| 쓰기 권한 경계 | `.kiro/settings/`에 에이전트가 못 씀 | 우회 말고 사용자가 직접 배치 |
| 안전장치 우회 | 주석/다중문으로 쓰기 숨기기 | 주석 제거 + 단일문 강제 + 키워드 차단 |

## 6. 도입 체크리스트

- [ ] Step 0로 접속 정보/런타임/URL 형식(SID vs Service)을 먼저 확정했는가
- [ ] 크리덴셜을 소스/공유 설정에 하드코딩하지 않았는가(env / properties)
- [ ] 읽기 전용 가드(단일문 + 주석 제거 + 키워드 차단 + 행 상한)를 넣었는가
- [ ] 로그를 stderr로만 보냈는가(stdout 오염 없음)
- [ ] `node test-validation.mjs`로 가드/파서를 검증했는가
- [ ] Thin 실패 시 `ORACLE_CLIENT_LIB_DIR`로 Thick 전환을 확인했는가
- [ ] `.kiro/settings/mcp.json`(정확한 위치/이름)에 등록했는가
- [ ] `run_query`는 autoApprove에서 제외했는가
- [ ] 실제 IDE에서 `list_tables` / `run_query`가 동작하는지 확인했는가

## 7. 예시 구현 (.kiro/mcp/oracle-readonly)

이 저장소의 `.kiro/mcp/` 폴더에는 위 프롬프트로 만들 수 있는 **MCP 서버의 예시
구현**이 들어 있습니다. stdio 방식으로 로컬에서 실행되며, Kiro가 프로세스를 띄워
도구를 호출합니다.

| 폴더 | 목적 |
|------|------|
| `oracle-readonly/` | Oracle DB를 조회 전용(SELECT only)으로 붙이는 읽기 전용 MCP 서버 예시 |

- **도입 방법**: 위 Part A의 **복붙용 프롬프트**로 본인 DB에 맞게 Kiro가
  생성/등록하도록 하는 것을 권장합니다.
- **등록**: Kiro는 `.kiro/settings/mcp.json`을 읽습니다.
  `.kiro/mcp/oracle-readonly/mcp.json.example`을 참고해 크리덴셜/경로를 채운 뒤 그
  위치에 배치하세요.
- **공개 주의**: 실제 접속 정보(호스트/계정/스키마/경로)는 넣지 말고 환경변수나
  로컬 설정으로만 주입합니다.
