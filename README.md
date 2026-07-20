# awesome-kiro

Kiro CLI / Kiro IDE를 사용하면서 쌓은 **재사용 가능한 설정과 규칙**을 모아둔
저장소입니다. 여러 환경(회사 PC, 개인 PC 등)에서 내려받아 바로 적용하는 것을
목표로 합니다.

현재는 **steering 규칙 / hooks / guides**와, Kiro의 설정·사용법을 설명하는
**참고 문서**로 구성되며, 앞으로 MCP 설정 / 스니펫 / 사용 팁 등을 함께 관리할
예정입니다.

수록물은 성격이 두 가지입니다. **Kiro가 읽어 동작에 반영하는 자산**(규칙·훅·
가이드)은 `.kiro/` 아래에 있어 **폴더째 복사하면 바로 적용**됩니다. 반면 **참고
문서**는 Kiro 동작에는 관여하지 않고 개념·설정을 풀어 설명하는 자료라, 저장소
최상단에 따로 둡니다.

```
awesome-kiro/
├─ command-permission-policy.md   # 설정을 설명하는 참고 문서 (동작에 미반영)
└─ .kiro/                         # Kiro가 읽어 동작에 반영하는 자산
   ├─ steering/   # 항상(또는 조건부) 참고하는 규칙
   ├─ hooks/      # 특정 이벤트에 실행되는 훅
   └─ guides/     # 필요 시 참고하는 통합 가이드(manual)
```

## 목차
- [steering이란](#steering이란)
- [수록된 steering 규칙](#수록된-steering-규칙)
- [수록된 hooks](#수록된-hooks)
- [guides 폴더](#guides-폴더)
- [참고 문서](#참고-문서)
- [적용 방법](#적용-방법)
- [inclusion 모드](#inclusion-모드)
- [커스터마이즈](#커스터마이즈)
- [라이선스](#라이선스)

## steering이란

steering은 Kiro가 응답할 때 **항상(또는 특정 조건에서) 함께 참고하는 규칙/맥락
문서**입니다. 프로젝트의 `.kiro/steering/*.md` 에 두면, 코딩 컨벤션·말투·작업
방식 등을 매 대화마다 반복해 설명하지 않아도 Kiro가 알아서 따릅니다.

각 파일 상단의 front-matter(`inclusion`)로 적용 범위를 정합니다. 자세한 내용은
아래 [inclusion 모드](#inclusion-모드)를 참고하세요.

## 수록된 steering 규칙

`.kiro/steering/` 폴더에 아래 규칙들이 들어 있습니다.

| 파일 | 목적 |
|------|------|
| `language-rules.md` | Kiro가 항상 한국어 존댓말로 답변하도록 강제 |
| `chat-turn-management.md` | 매 응답 말미에 "턴 상태"를 표시하고, 적정 시점에 새 채팅 전환을 안내 |
| `long-markdown-doc-rules.md` | 긴 `.md`(requirements/design/tasks) 생성 시 청크 단위로 나눠 잘림·실패 방지 |
| `powershell-rules.md` | 스크립트를 워크스페이스에 파일로 남기지 않고 실행(인라인/stdin/EncodedCommand) |
| `subagent-fallback-rules.md` | 서브에이전트 위임이 실패/취소되면 멈추지 말고 직접 수행 |
| `guide-routing-rules.md` | 요청에 특정 키워드가 나오면 `.kiro/guides/`의 해당 통합 가이드를 자동으로 참고 |
| `tilde-strikethrough-rules.md` | 범위표기 `~`가 마크다운 취소선으로 오작동하는 문제 방지 |

## 수록된 hooks

`.kiro/hooks/` 폴더에는 아래 훅들이 들어 있습니다. steering이 "항상 참고하는 규칙"
이라면, hooks는 **특정 이벤트 시점에만** 동작해 그때 필요한 규칙을 주입합니다.

| 파일 | 트리거 | 목적 |
|------|--------|------|
| `context-budget-guard.json` | PreToolUse(읽기/검색 도구) | 대용량 파일 통째 읽기·광역 검색을 막아 컨텍스트 폭증 방지 |
| `markdown-chunk-guard.json` | PreToolUse(fs_write/fs_append) | 긴 `.md` 작성 시 청크 상한선을 지키도록 상기 |
| `no-workspace-scripts.json` | PostFileCreate(.ps1/.py) | 워크스페이스에 스크립트 파일이 생기면 파일 없는 실행으로 유도 |

> 항상 적용되는 규칙은 steering이 자연스럽고, 특정 도구/파일 이벤트에 국한된
> 규칙만 hooks로 둡니다. (예: 턴 상태 표시·guide 라우팅은 매 턴 필요하므로 steering)

## guides 폴더

`.kiro/guides/` 폴더에는 반복되는 유형의 작업(특정 API 패턴, 화면 변경 패턴 등)의 **공통
방법론을 모아둔 통합 가이드**를 둡니다. 이 문서들은 평소엔 로드하지 않도록
`inclusion: manual`로 두고, 필요할 때만 참고합니다.

| 파일 | 목적 |
|------|------|
| `sample-guide.md` | 통합 가이드의 형식·작성법을 보여주는 샘플 템플릿 |

- **작성법**: `.kiro/guides/sample-guide.md`의 골격(핵심 원칙 / 패턴 분류 / 표준 계약 /
  정확성 속성 / 검증 전략 / 체크리스트)을 복사해 채웁니다.
- **불러오기**: 채팅에서 `#guide-name`으로 직접 참고하거나,
  `guide-routing-rules.md`의 키워드 매핑에 등록해 관련 작업 시 자동으로 참고되게 합니다.
- **공개 주의**: 회사/제품 고유 정보(실제 패키지명·화면 ID·테이블명·계정 등)는 넣지 말고
  일반화하거나 플레이스홀더로 대체하세요.

## 참고 문서

`.kiro/` 아래 자산이 Kiro 동작에 반영되는 것과 달리, 저장소 **최상단**의 참고
문서는 Kiro가 읽지 않습니다. 설정이나 개념을 이해하는 데 도움을 주는 **설명용
자료**로, 어떤 규칙을 강제하는 대신 "이건 이렇게 동작한다"를 풀어 놓은 문서입니다.

| 파일 | 목적 |
|------|------|
| `command-permission-policy.md` | 터미널 명령 자동 실행 허용 정책이 어디에 저장·적용되는지 설명 |

- **guides와의 차이**: guides(`.kiro/guides/`)는 `inclusion: manual`이라도 필요할 때
  **Kiro가 불러 참고**하는 자산입니다. 반면 참고 문서는 Kiro가 전혀 읽지 않는 순수
  설명 자료라, `.kiro/` 밖(저장소 최상단)에 둡니다.
- **사용법**: 프로젝트에 복사할 필요 없이, 저장소에서 그대로 읽으면 됩니다.

## 적용 방법

### 1) 내려받기
```
git clone https://github.com/<사용자명>/awesome-kiro.git
```
또는 저장소 페이지의 **Code → Download ZIP** 후 압축 해제.

### 2) 프로젝트에 복사
가장 간단한 방법은 이 저장소의 `.kiro/` 폴더를 통째로 적용할 프로젝트 루트에
복사하는 것입니다. steering / hooks / guides가 한 번에 적용됩니다.

```
<프로젝트>/.kiro/steering/...
<프로젝트>/.kiro/hooks/...
<프로젝트>/.kiro/guides/...
```

필요한 것만 쓰고 싶다면 원하는 파일만 같은 하위 경로로 골라 복사해도 됩니다.

```
<프로젝트>/.kiro/steering/language-rules.md
<프로젝트>/.kiro/hooks/markdown-chunk-guard.json
...
```

### 3) 적용 확인
- **Kiro IDE:** steering/hooks 파일을 두면 자동 인식됩니다. 필요 시 창을 새로고침하세요.
- **Kiro CLI:** 프로젝트 루트에서 실행하면 `.kiro/`를 읽어 규칙을 반영합니다.

> 전역으로 항상 쓰고 싶은 규칙은 프로젝트가 아닌 사용자 레벨(`~/.kiro/steering/`)에
> 두면 모든 프로젝트에 적용됩니다.

## inclusion 모드

각 steering 파일 상단의 front-matter로 적용 범위를 조절합니다.

```markdown
---
inclusion: always
---
```

| 모드 | 동작 | 설정 예 |
|------|------|---------|
| `always` | 모든 응답에 항상 포함 (기본) | `inclusion: always` |
| `fileMatch` | 특정 파일을 열 때만 포함 | `inclusion: fileMatch` + `fileMatchPattern: 'README*'` |
| `manual` | 채팅에서 `#`로 직접 참조할 때만 포함 | `inclusion: manual` |

환경마다 필요 규칙이 다르면, 공유용 저장소에는 `manual`로 두고 각 프로젝트에서
필요한 것만 `always`로 바꿔 쓰는 방식도 좋습니다.

## 커스터마이즈

- 규칙은 그대로 쓰기보다 **팀/개인 상황에 맞게 수정**해 사용하세요.
  (예: `language-rules.md`의 언어를 영어로, 턴 한도 수치 조정 등)
- 새 규칙을 추가할 때는 `.kiro/steering/`에 `주제-rules.md` 형태로 파일을 만들고,
  이 README의 표에 한 줄 추가하면 됩니다.
- 참고 문서를 추가할 때는 저장소 최상단에 `주제.md`로 만들고, 위
  [참고 문서](#참고-문서) 표에 한 줄 추가하세요. (Kiro 동작에 반영되는 자산이
  아니므로 `.kiro/`에 넣지 않습니다.)
- 규칙은 짧고 명확할수록 잘 지켜집니다. 하나의 파일에는 하나의 관심사만 담는 것을
  권장합니다.

## 라이선스

MIT License. 자유롭게 사용·수정·재배포할 수 있습니다.
