# awesome-kiro

Kiro CLI / Kiro IDE를 사용하면서 쌓은 **재사용 가능한 설정과 규칙**을 모아둔
저장소입니다. 여러 환경(회사 PC, 개인 PC 등)에서 내려받아 바로 적용하는 것을
목표로 합니다.

현재는 **steering 규칙** 모음으로 시작하며, 앞으로 hooks / MCP 설정 / 스니펫 /
사용 팁 등을 함께 관리할 예정입니다.

## 목차
- [steering이란](#steering이란)
- [수록된 steering 규칙](#수록된-steering-규칙)
- [guides 폴더](#guides-폴더)
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

`steering/` 폴더에 아래 규칙들이 들어 있습니다.

| 파일 | 목적 |
|------|------|
| `language-rules.md` | Kiro가 항상 한국어 존댓말로 답변하도록 강제 |
| `chat-turn-management.md` | 매 응답 말미에 "턴 상태"를 표시하고, 적정 시점에 새 채팅 전환을 안내 |
| `long-markdown-doc-rules.md` | 긴 `.md`(requirements/design/tasks) 생성 시 청크 단위로 나눠 잘림·실패 방지 |
| `powershell-rules.md` | 스크립트를 워크스페이스에 파일로 남기지 않고 실행(인라인/stdin/EncodedCommand) |
| `subagent-fallback-rules.md` | 서브에이전트 위임이 실패/취소되면 멈추지 말고 직접 수행 |
| `guide-routing-rules.md` | 요청에 특정 키워드가 나오면 `guides/`의 해당 통합 가이드를 자동으로 참고 |
| `tilde-strikethrough-rules.md` | 범위표기 `~`가 마크다운 취소선으로 오작동하는 문제 방지 |

## guides 폴더

`guides/` 폴더에는 반복되는 유형의 작업(특정 API 패턴, 화면 변경 패턴 등)의 **공통
방법론을 모아둔 통합 가이드**를 둡니다. 이 문서들은 평소엔 로드하지 않도록
`inclusion: manual`로 두고, 필요할 때만 참고합니다.

| 파일 | 목적 |
|------|------|
| `sample-guide.md` | 통합 가이드의 형식·작성법을 보여주는 샘플 템플릿 |

- **작성법**: `guides/sample-guide.md`의 골격(핵심 원칙 / 패턴 분류 / 표준 계약 /
  정확성 속성 / 검증 전략 / 체크리스트)을 복사해 채웁니다.
- **불러오기**: 채팅에서 `#guide-name`으로 직접 참고하거나,
  `guide-routing-rules.md`의 키워드 매핑에 등록해 관련 작업 시 자동으로 참고되게 합니다.
- **공개 주의**: 회사/제품 고유 정보(실제 패키지명·화면 ID·테이블명·계정 등)는 넣지 말고
  일반화하거나 플레이스홀더로 대체하세요.

## 적용 방법

### 1) 내려받기
```
git clone https://github.com/<사용자명>/awesome-kiro.git
```
또는 저장소 페이지의 **Code → Download ZIP** 후 압축 해제.

### 2) 프로젝트에 복사
원하는 규칙 `.md` 파일을 적용할 프로젝트의 `.kiro/steering/` 폴더로 복사합니다.

```
<프로젝트>/.kiro/steering/language-rules.md
<프로젝트>/.kiro/steering/powershell-rules.md
...
```

### 3) 적용 확인
- **Kiro IDE:** steering 파일을 두면 자동 인식됩니다. 필요 시 창을 새로고침하세요.
- **Kiro CLI:** 프로젝트 루트에서 실행하면 `.kiro/steering/`를 읽어 규칙을 반영합니다.

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
- 새 규칙을 추가할 때는 `steering/`에 `주제-rules.md` 형태로 파일을 만들고,
  이 README의 표에 한 줄 추가하면 됩니다.
- 규칙은 짧고 명확할수록 잘 지켜집니다. 하나의 파일에는 하나의 관심사만 담는 것을
  권장합니다.

## 라이선스

MIT License. 자유롭게 사용·수정·재배포할 수 있습니다.
