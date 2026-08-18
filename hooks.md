# hooks

steering이 "항상 참고하는 규칙"이라면, hooks는 **특정 이벤트 시점에만** 동작해
그때 필요한 규칙을 주입하거나 명령을 실행하는 자동화입니다. 이 저장소에 수록된
hooks 목록과 steering과의 구분 기준을 정리한 문서입니다.

> 이 문서는 개념 설명용 참고 자료입니다. 실제 훅 파일은 `.kiro/hooks/*.json`에
> 있으며, `.kiro/`를 프로젝트에 복사하면 그대로 적용됩니다.

## 목차
- [수록된 hooks](#수록된-hooks)
- [steering과 hooks의 구분](#steering과-hooks의-구분)

## 수록된 hooks

`.kiro/hooks/` 폴더에 아래 훅들이 들어 있습니다.

| 파일 | 트리거 | 목적 |
|------|--------|------|
| `context-budget-guard.json` | PreToolUse(읽기/검색 도구) | 대용량 파일 통째 읽기·광역 검색을 막아 컨텍스트 폭증 방지 |
| `markdown-chunk-guard.json` | PreToolUse(fs_write/fs_append) | 긴 `.md` 작성 시 청크 상한선을 지키도록 상기 |
| `no-workspace-scripts.json` | PostFileCreate(.ps1/.py) | 워크스페이스에 스크립트 파일이 생기면 파일 없는 실행으로 유도 |
| `post-task-cleanup-check.json` | PostTaskExec | spec 태스크 완료 직후 미사용 코드 삭제 검사(dead-code-cleanup)와 최종 상태 작성(clean-final-state) 규칙을 실행하도록 유도 |

## steering과 hooks의 구분

항상 적용되는 규칙은 steering이 자연스럽고, 특정 도구/파일 이벤트에 국한된
규칙만 hooks로 둡니다. 예를 들어 턴 상태 표시나 guide 라우팅은 매 턴 필요하므로
steering으로 두고, "특정 도구를 쓰기 직전"에만 필요한 가드는 hooks로 둡니다.

- **steering**: 매 응답(또는 특정 파일 열람 시)마다 항상 참고 → 컨벤션·말투·작업 방식
- **hooks**: PreToolUse / PostFileCreate 등 이벤트가 발생한 순간에만 동작 → 국소 가드·자동 실행

steering 규칙의 상세 목록은 [steering.md](steering.md)를 참고하세요.
