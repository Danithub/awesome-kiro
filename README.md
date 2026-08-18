# awesome-kiro

Kiro CLI / Kiro IDE를 쓰면서 쌓은 **재사용 가능한 설정과 규칙**을 모아둔
저장소입니다. 여러 환경(회사 PC, 개인 PC 등)에서 내려받아 바로 적용하는 것을
목표로 합니다.

수록물은 두 가지 성격입니다.

- **Kiro가 읽어 동작에 반영하는 자산**(steering 규칙 · hooks · guides · MCP 서버
  예시): `.kiro/` 아래에 있어 **폴더째 복사하면 바로 적용**됩니다.
- **참고 문서**: Kiro 동작에는 관여하지 않고 개념·설정·사용법을 풀어 설명하는
  자료로, 저장소 최상단에 둡니다.

각 기능의 상세 내용은 아래 [문서](#문서) 표의 개별 문서에 정리되어 있습니다. 이
README는 저장소 전체를 훑는 안내만 담습니다.

## 구조

```
awesome-kiro/
├─ README.md                      # 저장소 개요 (이 문서)
├─ steering.md                    # steering 개념·규칙 목록·inclusion 모드
├─ hooks.md                       # hooks 개념·훅 목록
├─ guides.md                      # guides 개념·작성법
├─ kiro-workflows.md              # Kiro 워크플로 총정리
├─ kiro-mcp-setup.md              # 읽기 전용 MCP 서버 붙이기 안내
├─ command-permission-policy.md   # 명령 자동 실행 허용 정책 설명
└─ .kiro/                         # Kiro가 읽어 동작에 반영하는 자산
   ├─ steering/   # 항상(또는 조건부) 참고하는 규칙
   ├─ hooks/      # 특정 이벤트에 실행되는 훅
   ├─ guides/     # 필요 시 참고하는 통합 가이드(manual)
   └─ mcp/        # MCP 서버 예시 구현(oracle-readonly 등)
```

## 문서

기능별 상세 설명은 각 문서에 정리되어 있습니다.

| 문서 | 내용 |
|------|------|
| [steering.md](steering.md) | steering이란, 수록된 규칙 목록, inclusion 모드 |
| [hooks.md](hooks.md) | hooks란, 수록된 훅 목록, steering과의 구분 |
| [guides.md](guides.md) | guides란, 수록된 가이드, 작성법·불러오기 |
| [kiro-workflows.md](kiro-workflows.md) | Default / Spec / Plan / Bug Fix / Quick Spec 워크플로 총정리 |
| [kiro-mcp-setup.md](kiro-mcp-setup.md) | 읽기 전용(read-only) MCP 서버를 프롬프트로 만들어 붙이는 방법 |
| [command-permission-policy.md](command-permission-policy.md) | 터미널 명령 자동 실행 허용 정책이 저장·적용되는 위치 |

> steering / hooks / guides의 실제 자산은 `.kiro/` 아래에 있고, 위 최상단 문서는
> 그 개념과 목록을 설명하는 참고용입니다.

## 적용 방법

1. **내려받기** — `git clone https://github.com/<사용자명>/awesome-kiro.git`
   또는 저장소 페이지의 **Code → Download ZIP**.
2. **복사** — 이 저장소의 `.kiro/` 폴더를 적용할 프로젝트 루트에 통째로 복사하면
   steering / hooks / guides / mcp 예시가 한 번에 적용됩니다. 필요한 파일만 같은
   하위 경로로 골라 복사해도 됩니다.
3. **확인** — Kiro IDE는 파일을 두면 자동 인식합니다(필요 시 창 새로고침). Kiro
   CLI는 프로젝트 루트에서 실행하면 `.kiro/`를 읽어 반영합니다.

> 모든 프로젝트에 항상 적용하려면 프로젝트가 아닌 사용자 레벨
> (`~/.kiro/steering/` 등)에 두세요.

## 커스터마이즈

- 규칙은 그대로 쓰기보다 **팀/개인 상황에 맞게 수정**해 사용하세요(예: 언어를
  영어로, 턴 한도 수치 조정 등).
- 새 규칙·훅·가이드를 추가할 때는 `.kiro/`의 해당 폴더에 파일을 만들고, 짝이 되는
  문서([steering.md](steering.md) / [hooks.md](hooks.md) / [guides.md](guides.md))의
  표에 한 줄 추가하세요.
- 규칙은 짧고 명확할수록 잘 지켜집니다. 한 파일에는 하나의 관심사만 담기를
  권장합니다.

## 라이선스

MIT License. 자유롭게 사용·수정·재배포할 수 있습니다. 자세한 내용은
[LICENSE](LICENSE)를 참고하세요.
