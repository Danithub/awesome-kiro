# Kiro IDE 1.2 기준 저장소 정리 요구사항

## 배경
- 저장소의 규칙·hooks가 Kiro IDE 1.0 기준으로 작성되어 있음.
- IDE 1.2 이후에는 상당수를 Kiro가 별도 규칙 없이 처리하므로 꼭 필요한 것만 남김.

## 문답 요약 (Q&A)
- Q1: Workflow가 끊기면 다시 실행할지, 직접 수행할지 / A1: 현재 세션에서 직접 이어서 수행.
- Q2: `default-as-spec-workflow`를 간소화할지 / A2: 현재 상태 그대로 유지.
- Q3: 나머지 규칙 처리 / A3: `chat-turn-management` 유지. 확인 필요·삭제 권장 항목은 모두 삭제.
- Q4: `command-permission-policy.md`, `kiro-mcp-setup.md` 갱신 여부 / A4: 그대로 둠.
- Q5: 사용자 레벨 `permissions.yaml` 전체 허용(`capability: all`) / A5: 유용하므로 문서화.

## 요구사항
1. hooks 4개와 `.kiro/hooks/`, `hooks.md` 삭제.
2. steering 삭제: long-markdown-doc, powershell, context-budget, dead-code-cleanup,
   clean-final-state, guide-routing. `.kiro/guides/`와 `guides.md`도 삭제.
3. `subagent-fallback-rules`를 Workflows 기준 `workflow-fallback-rules`로 대체.
4. 유지: language, chat-turn-management, tilde-strikethrough, default-as-spec-workflow.
5. IDE 1.2 이후 권장 구성을 설명하는 신규 문서 작성(Default 세션, Workflows,
   전체 허용 권한, 정리한 항목과 이유).
6. README, steering.md, kiro-workflows.md를 변경 사항에 맞게 갱신.

## 범위 밖 (Out of scope)
- `command-permission-policy.md`, `kiro-mcp-setup.md`, `.kiro/mcp/` 내용 수정.
- 사용자 PC의 `permissions.yaml` 변경.
