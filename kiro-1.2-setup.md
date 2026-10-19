# Kiro IDE 1.2 이후 권장 구성

> **대상 버전:** Kiro IDE 1.2 이상 (1.3.x 포함)
> 출처: [Kiro IDE Changelog](https://kiro.dev/changelog/ide/),
> [Permissions](https://kiro.dev/docs/ide/whats-new-v1/permissions/)

IDE 1.0 시절에는 Kiro의 부족한 부분을 steering 규칙과 hooks로 많이 보완했습니다.
1.2부터는 그 상당수를 Kiro가 스스로 잘 처리해서, 이 저장소도 꼭 필요한 것만 남기고
정리했습니다. 이 문서는 지금 권장하는 사용 방식과 그 이유를 설명합니다.

## 목차

1. 한눈에 보기
2. 세션은 Default로
3. Workflows (IDE 1.2)
4. 권한: 사용자 레벨 전체 허용
5. 정리한 규칙과 hooks

## 1. 한눈에 보기

| 항목 | 권장 | 관련 파일 |
|------|------|-----------|
| 세션 | Default(Vibe) + 작업 전 문답 | `.kiro/steering/default-as-spec-workflow.md` |
| 백그라운드 작업 | Workflows, 끊기면 직접 이어서 수행 | `.kiro/steering/workflow-fallback-rules.md` |
| 권한 | 사용자 레벨에서 전체 허용 | `~/.kiro/settings/permissions.yaml` |
| 기타 규칙 | 한국어 존댓말, 턴 상태 표시, `~` 취소선 방지 | `.kiro/steering/` |
| hooks | 수록하지 않음 | 없음 |

## 2. 세션은 Default로

Spec 세션은 requirements / design / tasks 세 문서를 단계마다 합의하며 진행합니다.
신중하지만 작은 작업에도 무겁고, 실제로는 단계 경계가 애매한 경우가 많습니다.
그래서 **Default 세션을 기본**으로 쓰고, `default-as-spec-workflow.md` 규칙으로
Spec의 장점만 가져옵니다.

- 코드를 바꾸는 작업이면 시작 전에 질문을 묶어 문답하고, 요구사항을 확정한 뒤 진행
- 작업 후 `.kiro/specs/{spec명}/`에 `requirements.md`(문답 결과)와
  `changes.md`(적용 내용)를 남김
- 사용자는 이 두 문서로 무엇을 합의했고 무엇이 바뀌었는지 확인
- 단순 질문, 한 줄 수정, "그냥 바로 해줘" 같은 요청에는 적용하지 않음

각 세션 진행 방식의 비교는 [kiro-workflows.md](kiro-workflows.md)를 참고하세요.

## 3. Workflows (IDE 1.2)

Workflows는 여러 단계로 된 계획을 **백그라운드에서** 실행하는 기능입니다. 단계마다
별도 에이전트 세션이 돌고, 그동안 원래 채팅에서는 계속 대화할 수 있습니다.
세션 시작 시 고르는 Spec / Plan 같은 "워크플로"와는 다른 기능입니다.

- **켜기:** 기본값은 꺼짐입니다. Agent Focus의 Workspace Configuration에서 켜거나
  Settings에서 `kiroAgent.workflows.enabled`를 켠 뒤 새 채팅을 시작합니다.
- **진행 확인:** 채팅 위 Workflows 영역에서 단계별 진행을 보고, 일시정지·재개·중지할
  수 있습니다.
- **레시피:** 재사용할 실행 정의는 `.kiro/workflows/`에 둡니다. 1.3부터는 채팅에서
  `/workflow-run`으로 저장된 레시피를 골라 바로 시작할 수 있습니다.

### 끊겼을 때: `workflow-fallback-rules.md`

백그라운드 실행은 가끔 실패하거나 중간에 멈춥니다. 이때 Kiro가 "다시 실행할까요?"
라고 묻고 기다리면 작업이 그대로 멈춥니다. 이 규칙은 그런 경우 **남은 작업을 현재
세션에서 바로 직접 이어서** 하게 합니다.

- 끊김으로 보는 경우: 실행 호출 실패, 단계 error, run이 failed / aborted로 종료,
  알림 없이 진행이 멈춤
- 질문 대기(warning)로 멈춘 것은 끊김이 아님
- 끝난 단계는 다시 하지 않고 남은 부분부터 진행
- 전환 사실은 한 줄로만 알림

## 4. 권한: 사용자 레벨 전체 허용

IDE 1.0부터 권한은 capability 기반 규칙으로 동작하고, 규칙에 없는 동작은 매번
승인을 묻습니다. 명령마다 승인 버튼을 누르는 게 번거롭다면, 사용자 레벨 파일에
아래 한 줄짜리 규칙을 두면 됩니다.

`C:\Users\{사용자}\.kiro\settings\permissions.yaml`

```yaml
rules:
  - capability: all
    effect: allow
```

- `all`은 셸 명령만이 아니라 파일 읽기·쓰기, 웹 조회, MCP 호출 등 **모든 capability**를
  뜻합니다.
- 사용자 레벨에 두므로 이 PC의 모든 프로젝트에 적용됩니다.
- 범위와 상관없이 **가장 제한적인 효과가 이깁니다**(deny > ask > allow). 특정 동작만
  막고 싶으면 같은 파일이나 워크스페이스 규칙에 `deny`를 추가하면 됩니다.

전체 허용이어도 아래는 여전히 확인을 받습니다(IDE 1.2).

- agent, Hook, Power 파일과 `.kiro/workflows/` 레시피를 에이전트가 수정할 때
- 신뢰하지 않은 워크스페이스에서 Kiro 설정을 바꾸거나 명령을 실행할 때

> **주의:** 전체 허용은 편한 대신 잘못된 명령도 묻지 않고 실행됩니다. 개인 PC나
> 신뢰하는 프로젝트에서 쓰고, 공용·운영 환경에서는 쓰지 마세요. 1.3의 Command
> sandbox를 켜면 셸 명령의 파일·네트워크 접근 범위를 함께 제한할 수 있습니다.

규칙 파일의 저장 위치와 형식은 [command-permission-policy.md](command-permission-policy.md)를
참고하세요.

## 5. 정리한 규칙과 hooks

아래 항목은 1.2 환경에서 별도 규칙 없이도 잘 동작해서 수록하지 않습니다. 필요하면
git 이력에서 되살려 쓸 수 있습니다.

| 항목 | 하던 일 | 수록하지 않는 이유 |
|------|---------|-------------------|
| `long-markdown-doc-rules` + `markdown-chunk-guard` hook | 긴 `.md`를 청크로 나눠 작성 | 긴 문서도 잘림 없이 작성됨 |
| `powershell-rules` + `no-workspace-scripts` hook | 스크립트 파일 없이 실행, PSReadLine 에코 방지 | 명령이 설정한 터미널 프로필에서 안정적으로 실행됨 |
| `context-budget-rules` + `context-budget-guard` hook | 대용량 파일 통째 읽기·광역 검색 방지 | 범위 읽기와 대화 압축(compaction)이 기본 동작 |
| `dead-code-cleanup-rules`, `clean-final-state-rules` + `post-task-cleanup-check` hook | 작업 후 미사용 코드·이력 주석 점검 | 기본 동작으로 충분하고, 매번 강제하면 부담이 큼 |
| `guide-routing-rules` + `.kiro/guides/` | 키워드로 통합 가이드 자동 참조 | steering `inclusion: auto`와 Skills가 같은 일을 기본으로 함 |
| `subagent-fallback-rules` | 서브에이전트 위임 실패 시 직접 수행 | `workflow-fallback-rules`로 대체 |

반복 작업 방법론을 다시 두고 싶다면, 별도 라우팅 규칙 대신 `inclusion: auto`
steering이나 `.kiro/skills/`를 쓰는 것을 권장합니다. inclusion 모드는
[steering.md](steering.md)에 정리되어 있습니다.
