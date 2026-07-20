---
inclusion: always
---

# Script Execution Rules (.ps1, .py) — No Workspace Files

## 0. 핵심 원칙
- 목표는 "삭제를 잘 하는 것"이 아니라 **워크스페이스에 스크립트 파일이 아예
  생기지 않게 하는 것**입니다.
- "코드가 기니까 파일을 만든다"는 전제를 **버립니다.** 긴 코드도 아래 방법으로
  파일 없이 실행할 수 있습니다.
- 실행 순서(우선순위): 1) 인라인 → 2) stdin 파이핑 → 3) EncodedCommand →
  4) (최후의 수단) OS 임시폴더. 위 방법이 될 때까지는 절대 다음 단계로 내려가지
  않습니다.

## 1. 짧은 코드 → 인라인 실행
- PowerShell: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "코드"`
- Python: `python -c "코드"`

## 2. 긴 코드 → stdin 파이핑 (파일 생성 금지, 최우선)
여러 줄/긴 코드도 **파일을 만들지 않고** stdin으로 흘려보내 실행합니다.

- Python (PowerShell here-string을 stdin으로 전달):
  ```
  powershell -NoProfile -ExecutionPolicy Bypass -Command "@'
  print('여러 줄')
  for i in range(3):
      print(i)
  '@ | python -"
  ```
- PowerShell 스크립트 자체를 stdin으로:
  ```
  powershell -NoProfile -ExecutionPolicy Bypass -Command "@'
  Get-ChildItem
  Write-Host 'done'
  '@ | powershell -NoProfile -Command -"
  ```
- 여기서 `python -` / `powershell ... -` 의 `-` 는 "stdin에서 코드를 읽으라"는
  의미이며, 이 방식은 디스크에 어떤 스크립트 파일도 남기지 않습니다.

## 3. 복잡한 PowerShell → -EncodedCommand (Base64, 파일 없음)
따옴표/특수문자가 많아 인라인이 깨질 때 사용합니다.

```
powershell -NoProfile -Command "$c = @'
Write-Host 'complex $ \" chars ok'
'@; $b=[Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($c)); powershell -NoProfile -EncodedCommand $b"
```
- 스크립트를 Base64로 인코딩해 인자로 넘기므로 파일이 전혀 생기지 않고,
  이스케이프 문제도 사라집니다.

## 4. (최후의 수단) 파일이 불가피할 때 → OS 임시폴더에만
1~3번으로 도저히 안 될 만큼 코드가 방대한 경우에만 사용합니다.

- **워크스페이스(프로젝트 폴더)에는 절대 생성 금지.** 오직 `%TEMP%`
  (예: `%TEMP%\kiro_run_<랜덤>.py`)에만 만듭니다.
- 이유: OS 임시폴더는 git/프로젝트를 오염시키지 않고, OS가 주기적으로 정리하므로
  잔여 파일 문제가 없습니다.
- 예:
  ```
  powershell -NoProfile -Command "$f=Join-Path $env:TEMP ('kiro_'+[guid]::NewGuid().ToString('N')+'.py'); Set-Content $f 'print(123)'; python $f"
  ```
- 이렇게 만든 임시파일도 **즉시 강제 삭제하려 하지 않습니다.** Windows 파일 잠금
  때문에 실행 직후 삭제 시도는 세션을 멈출 수 있습니다. `%TEMP%`에 두면 OS가
  정리하므로 그대로 두고 다음 작업으로 넘어갑니다.

## 5. 금지 사항 (Anti-patterns)
- 🚫 테스트/실행 목적으로 **워크스페이스에** `.ps1`/`.py` 파일 생성
- 🚫 "코드가 기니까"를 이유로 1~3번을 건너뛰고 바로 파일 생성
- 🚫 방금 실행한 스크립트 파일을 `delete_file`/`Remove-Item`으로 즉시 삭제 (잠금)

## 6. 셸 출력 깨짐(PSReadLine 에코) 방지

- **증상:** 명령을 실행하면 입력 줄이 한 글자씩 자라며 같은 줄이 수십 번 중복
  출력된다. (실제 결과는 그 아래 정상 출력되지만, 중복 에코가 컨텍스트를 폭증시킴)
- **원인:** 명령을 입력받는 **상주 PowerShell 호스트**에 PSReadLine이 로드돼 있어,
  타이핑되는 입력 줄을 매 글자 다시 그리기 때문. 캡처 스트림에서는 이 재렌더링이
  겹쳐지지 않고 텍스트로 그대로 쌓인다.
- **잘못된 처방(효과 없음):** 명령어 안에서 자식 셸에 `-NoProfile -NonInteractive`를
  줘도 소용없다. 바깥 호스트가 아니라 자식 프로세스만 건드리므로 입력 줄 에코는
  그대로 발생한다. (실측으로 확인됨)
- **해결(세션당 1회):** 셸에서 첫 명령으로 아래를 실행한다. execute_pwsh가 같은
  터미널을 재사용하므로, 한 번 언로드하면 이후 명령은 깨끗하게 출력된다.
  ```
  Remove-Module PSReadLine -ErrorAction SilentlyContinue
  ```
- **근본 해결:** 통합 터미널 자체를 `powershell -NoProfile`로 기동하면 PSReadLine이
  로드되지 않아 언로드조차 필요 없다. (IDE 터미널 설정 수준의 조치)
