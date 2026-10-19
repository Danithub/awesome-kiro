# steering 규칙

Kiro가 응답할 때 **항상(또는 특정 조건에서) 함께 참고하는 규칙/맥락 문서**인
steering의 개념과, 이 저장소에 수록된 규칙 목록, 적용 범위를 정하는 `inclusion`
모드를 정리한 문서입니다.

> 이 문서는 개념 설명용 참고 자료입니다. 실제 규칙 파일은 `.kiro/steering/*.md`에
> 있으며, `.kiro/`를 프로젝트에 복사하면 그대로 적용됩니다.

## 목차
- [steering이란](#steering이란)
- [수록된 steering 규칙](#수록된-steering-규칙)
- [inclusion 모드](#inclusion-모드)

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
| `tilde-strikethrough-rules.md` | 범위표기 `~`가 마크다운 취소선으로 오작동하는 문제 방지 |
| `default-as-spec-workflow.md` | default(Vibe) 세션도 Spec처럼 "작업 전 문답 -> 작업 -> 산출물 정리(requirements/changes)" 흐름을 따르게 유도 |
| `workflow-fallback-rules.md` | 백그라운드 Workflow 실행이 끊기면 되묻지 않고 남은 작업을 현재 세션에서 직접 이어서 수행 |

IDE 1.2 이후에는 대용량 파일 읽기, 긴 문서 작성, 스크립트 실행 같은 동작을 Kiro가
별도 규칙 없이도 안정적으로 처리해서, 관련 규칙과 hooks는 수록하지 않습니다.
자세한 배경은 [kiro-1.2-setup.md](kiro-1.2-setup.md)를 참고하세요.

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
| `manual` | 채팅에서 `#`나 `/` 슬래시 명령으로 직접 부를 때만 포함 | `inclusion: manual` |
| `auto` | 요청이 `description`과 맞으면 자동으로 포함 (`/`로도 호출 가능) | `inclusion: auto` + `name` + `description` |

환경마다 필요 규칙이 다르면, 공유용 저장소에는 `manual`로 두고 각 프로젝트에서
필요한 것만 `always`로 바꿔 쓰는 방식도 좋습니다.
