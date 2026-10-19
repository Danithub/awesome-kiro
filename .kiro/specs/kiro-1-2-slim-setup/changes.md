# Kiro IDE 1.2 기준 저장소 정리 적용 내용

## 변경 요약
- 1.0 시절 보완용 규칙과 hooks를 걷어내고, Workflow 폴백 규칙을 새로 두었으며,
  1.2 이후 권장 구성 문서를 추가함.

## 변경 파일
- 삭제: `.kiro/hooks/` 4개 파일과 폴더, `.kiro/guides/sample-guide.md`와 폴더,
  `hooks.md`, `guides.md`
- 삭제: `.kiro/steering/` 중 long-markdown-doc-rules, powershell-rules,
  context-budget-rules, dead-code-cleanup-rules, clean-final-state-rules,
  guide-routing-rules, subagent-fallback-rules
- 추가: `.kiro/steering/workflow-fallback-rules.md`
- 추가: `kiro-1.2-setup.md`
- 수정: `.kiro/steering/default-as-spec-workflow.md`: 삭제된 long-markdown-doc-rules 참조 제거
- 수정: `steering.md`: 규칙 목록 갱신, `inclusion: auto` 모드 추가
- 수정: `README.md`: 구조·문서 표·적용 방법 갱신, 워크스페이스 Trust 안내 추가
- 수정: `kiro-workflows.md`: 세션 진행 방식과 1.2 Workflows 구분 안내 추가

## 상세 변경 내용
- `workflow-fallback-rules.md`: 끊김 판단 기준(호출 실패, error, failed/aborted,
  진행 멈춤), warning은 제외, `inspect_workflow`로 완료 단계 확인 후 남은 부분부터 직접 수행.
- `kiro-1.2-setup.md`: 한눈에 보기, Default 세션, Workflows와 폴백, 사용자 레벨
  전체 허용 권한(주의사항 포함), 정리한 항목과 이유.

## 검증
- 문서 저장소라 빌드·테스트 없음.
- 삭제된 파일을 가리키는 링크가 남지 않았는지 grep으로 확인(신규 문서의 정리 표만 해당).

## 남은 작업 / 후속
- 커밋은 하지 않음.
