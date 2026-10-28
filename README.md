<div align="center">

# hee-terminal-render

### A clearer terminal. A better workflow.

**Claude Code를 위한 우리 팀의 터미널 렌더링 환경**

코드와 변경 내역은 선명하게, 표와 다이어그램은 구조적으로.<br>
읽기부터 복사와 공유까지, 하나의 작업 흐름으로 연결합니다.

<p>
  <a href="https://github.com/jojunhee125/hee-terminal-render"><img src="https://img.shields.io/badge/Claude_Code-Terminal_Renderer-cba6f7?style=flat-square" alt="Claude Code Terminal Renderer"></a>
  <img src="https://img.shields.io/badge/Time_Zone-Asia%2FSeoul-89b4fa?style=flat-square" alt="기본 시간대 Asia/Seoul">
  <img src="https://img.shields.io/badge/Defaults-Korean-a6e3a1?style=flat-square" alt="한국어 안내 기본 설정">
</p>

[빠른 시작](#quick-start) · [기능 살펴보기](#features) · [테마](#themes) · [설정](#configuration) · [운영 가이드](#operations)

</div>

---

<table>
<tr>
<td width="33%" valign="top">
<h3>Read</h3>
코드 구문 강조, 구조화된 표, 다이어그램과 diff 카드로 답변의 핵심을 구분합니다.
</td>
<td width="33%" valign="top">
<h3>Track</h3>
경과 시간, 도구 실행, 서브에이전트와 작업 단계를 진행 패널에서 확인합니다.
</td>
<td width="33%" valign="top">
<h3>Share</h3>
코드, 일반 텍스트, TSV 표를 용도에 맞게 복사해 다음 작업으로 이어 갑니다.
</td>
</tr>
</table>

<a id="themes"></a>
## 하나의 작업 환경, 다양한 색상

어두운 테마 11종, 밝은 테마 5종과 무채색 `mono`를 제공합니다. 제목, 표, 코드, 차트와 변경 내역에 선택한 팔레트를 일관되게 적용합니다.

<p align="center">
  <img src="docs/themes.png" alt="어두운 테마 11종과 밝은 테마 5종의 렌더링 비교" width="100%">
</p>

<p align="center"><sub>테마별 렌더링 예시 · 화면 스타일은 개별 옵션으로 조정할 수 있습니다.</sub></p>

| Dark | Light | Adaptive |
| --- | --- | --- |
| `catppuccin-mocha` · `dracula` · `nord` · `tokyo-night` | `catppuccin-latte` · `gruvbox-light` | `mono` — 색상 없이 굵기와 명암으로 구분 |
| `gruvbox-dark` · `rose-pine` · `everforest` · `github-dark` | `rose-pine-dawn` · `github-light` | `random` — 선택·재로딩 시 어두운 테마 무작위 적용 |
| `one-dark` · `solarized-dark` · `neon` | `solarized-light` | 기본 테마: `catppuccin-mocha` |

```text
/prismantis theme nord
/prismantis theme github-light
/prismantis theme random
```

<a id="quick-start"></a>
## Quick start

Claude Code 대화창에서 다음 명령을 순서대로 실행합니다.

```text
/plugin marketplace add https://github.com/jojunhee125/hee-terminal-render.git
/plugin install prismantis@hee-terminal-render
/reload-plugins
```

이어서 데모로 렌더링을 확인하고, 설정 화면에서 스타일을 선택합니다.

```text
/prismantis demo
/prismantis setup
```

> [!NOTE]
> **설치 식별자** — 마켓플레이스 이름은 `hee-terminal-render`, 현재 플러그인 내부 이름은 `prismantis`입니다. 설치에는 `prismantis@hee-terminal-render`를, 대화창 명령에는 `/prismantis`를 사용합니다.
>
> **호환성** — Claude Code 플러그인·렌더링 모드 지원이 필요합니다. 저장소 CI는 `2.1.287`과 최신 버전을 검사하도록 구성되어 있습니다. 다른 마켓플레이스의 동명 플러그인은 `/plugin`에서 비활성화하거나 제거한 뒤 사용합니다.

<a id="features"></a>
## 터미널 안에서 완성되는 작업 흐름

### 01 / Code & changes

언어별 구문 강조와 복사 버튼으로 코드를 읽고 가져다 쓰기 쉽게 만듭니다. 일반 코드 블록은 줄 번호와 왼쪽 여백을 기본으로 끄고, 긴 코드도 접지 않습니다. 파일 수정 내역은 별도의 diff 카드에 추가·삭제 줄과 변경된 부분을 구분해 표시합니다.

<p align="center">
  <img src="docs/diff/card.png" alt="추가·삭제 줄과 변경된 구문을 강조한 diff 카드" width="820">
</p>

<p align="center"><sub>Diff 카드 예시 · 일반 코드 블록의 줄 번호 설정과는 별개입니다.</sub></p>

### 02 / Tables & diagrams

마크다운 표의 헤더, 테두리, 숫자와 정렬을 구분하고, Mermaid 블록을 터미널 다이어그램으로 표현합니다.

| 표현할 내용 | 지원 형식 |
| --- | --- |
| 구조와 관계 | 흐름도 · 시퀀스 · 상태 · 클래스 · ER 다이어그램 |
| 수치와 비교 | 막대 · 선 · 원형 차트 |
| 일정과 순서 | 간트 차트 |
| 데이터 정리 | 마크다운 표 · TSV 복사 |

### 03 / Progress & context

진행 패널에는 경과 시간, 실행 중인 도구, 도구 실행 횟수, 서브에이전트와 할 일 단계를 표시합니다. 전체 화면에서는 옆 패널을, 그 외에는 입력창 위 영역을 사용하며 턴 종료 후에는 요약 한 줄로 줄어듭니다.

질문과 턴 종료 시각은 기본적으로 **한국 시간 · 24시간 형식**으로 표시합니다. 모델에 전달하는 렌더링 안내문도 한국어를 기본으로 사용합니다.

### 04 / Copy & share

복사할 대상과 붙여 넣을 곳에 맞게 형식을 선택합니다.

| 가져갈 내용 | 대화창 명령 | 활용 |
| --- | --- | --- |
| 답변 원문 | `/prismantis copy` | 마크다운 문서에 붙여 넣기 |
| 공유용 답변 | `/prismantis copy plain` | 마크다운 기호를 정리해 메신저·문서에 공유 |
| 마지막 코드 블록 | `/prismantis copy code` | 편집기·터미널에 붙여 넣기 |
| 마지막 표 | `/prismantis copy table` | TSV 형식으로 스프레드시트에 붙여 넣기 |

> [!TIP]
> 답변의 **복사 버튼**은 기본적으로 공유용 텍스트를 복사합니다. `/prismantis copy` 명령은 마크다운 원문을 복사하므로 용도에 따라 구분해 사용하세요.

<details>
<summary><strong>HTML·PNG 복사와 원격 접속 환경</strong></summary>

| 기능 | 지원 환경 | 조건 |
| --- | --- | --- |
| HTML 표 복사 | 로컬 Windows · macOS · Linux 터미널 | Linux는 CopyQ 실행 필요 |
| PNG 이미지 복사 | 로컬 Windows · macOS 터미널 | 표시된 표·다이어그램·차트를 이미지로 복사 |
| SSH에서 텍스트 복사 | 터미널의 클립보드 전달 설정에 따라 동작 | `copy plain`, `copy code`, `copy table` 명령 사용 |

원격 세션에서는 로컬 전용 HTML·PNG 복사 버튼이 표시되지 않습니다.

</details>

<a id="configuration"></a>
## 팀 기본값과 개인 설정

기본 구성은 **한국 시간, 한국어 안내, 복사하기 편한 코드, 작업 진행 표시**에 맞춰져 있습니다. `/prismantis setup`에서 미리보기를 보며 스타일을 고르거나, `/config`에서 개별 옵션을 변경합니다.

| 영역 | 기본 구성 | 설정 키 |
| --- | --- | --- |
| 테마 | Catppuccin Mocha | `theme` |
| 코드 | 줄 번호 없음 · 왼쪽 여백 없음 · 접기 없음 | `codeLineNumbers` · `codeIndent` · `codeFold` |
| 답변 복사 버튼 | 공유용 일반 텍스트 | `replyCopy` |
| 시각 | 24시간 · Asia/Seoul | `clock` · `clockZone` |
| 내부 안내문 | 한국어 | `hintLanguage` |
| 작업 진행 | 진행 패널 활성화 | `progressPane` |
| 변경 내역 | Diff 카드 | `diffStyle` |

<details>
<summary><strong>주요 옵션과 기본값 펼쳐 보기</strong></summary>

| 옵션 | 기본값 | 설명 |
| --- | --- | --- |
| `enabled` | `true` | 렌더링 활성화 |
| `theme` | `catppuccin-mocha` | 색상 팔레트 |
| `headingStyle` | `banner` | 제목 스타일 |
| `tableStyle` | `box` | 표 스타일 |
| `promptStyle` | `bubble` | 질문 스타일 |
| `codeLineNumbers` | `false` | 일반 코드 블록 줄 번호 |
| `codeIndent` | `false` | 일반 코드 블록 왼쪽 여백 |
| `codeFold` | `off` | 긴 코드 접기 |
| `replyCopy` | `plain` | 답변 복사 버튼의 형식 |
| `copyButtons` | `true` | 복사 버튼 표시 |
| `copyButtonStyle` | `inline` | 복사 버튼 스타일 |
| `clock` | `24h` | 시각 표시 형식 |
| `clockZone` | `Asia/Seoul` | 표시 시간대 |
| `hintLanguage` | `ko` | 모델에 전달하는 렌더링 안내문의 언어 |
| `progressPane` | `true` | 작업 진행 패널 |
| `toolRows` | `true` | 도구 실행 행 표시 |
| `toolStyle` | `chat` | 도구 실행 행 스타일 |
| `toolOutput` | `full` | 도구 출력 범위; `quiet`로 축소 가능 |
| `taskStyle` | `checks` | 작업 목록 스타일 |
| `diffStyle` | `card` | 변경 내역 스타일 |
| `pieStyle` | `round` | 원형 차트 스타일 |
| `mermaid` | `true` | Mermaid 렌더링 |
| `latex` | `false` | 수식 이미지 렌더링 |

전체 옵션, 허용 값과 색상 설정은 [플러그인 설정 정의](.claude-plugin/plugin.json)의 `userConfig`를 참고합니다.

</details>

<details>
<summary><strong>명령어 빠른 참조</strong></summary>

| 명령 | 동작 |
| --- | --- |
| `/prismantis` | 도움말 |
| `/prismantis demo` | 기능 데모 |
| `/prismantis setup` | 스타일 선택과 미리보기 |
| `/prismantis theme <name>` | 테마 변경 |
| `/prismantis copy [plain\|code\|table]` | 마지막 답변 또는 해당 블록 복사 |
| `/config` | 개별 옵션 변경 |
| `/reload-plugins` | 현재 세션의 플러그인 다시 불러오기 |

</details>

<a id="operations"></a>
## 운영 가이드

### 업데이트

일반 터미널에서 마켓플레이스와 플러그인을 순서대로 업데이트합니다.

```sh
claude plugin marketplace update hee-terminal-render
claude plugin update prismantis@hee-terminal-render
```

열려 있는 Claude Code 세션에는 각각 다시 불러오기가 필요합니다.

```text
/reload-plugins
```

### 비활성화와 제거

잠시 기본 화면으로 돌아가려면 `/config`에서 `enabled`를 끕니다. 제거하려면 일반 터미널에서 실행합니다.

```sh
claude plugin uninstall prismantis@hee-terminal-render
```

<details>
<summary><strong>문제 해결과 표시 환경의 제한</strong></summary>

| 증상 또는 환경 | 확인할 내용 |
| --- | --- |
| 설치·업데이트가 반영되지 않음 | 해당 세션에서 `/reload-plugins` 실행 |
| 복사 버튼 클릭이 어려움 | `/prismantis copy plain`, `copy code`, `copy table` 사용 |
| 큰 코드·표가 기본 텍스트로 표시됨 | Claude Code의 20,000 노드 렌더링 상한에 걸릴 수 있음 |
| 수식이 텍스트로 표시됨 | `ratex-render` 별도 설치와 `latex` 활성화 필요 |
| 수식 이미지 렌더링 | kitty·Ghostty의 이미지 기능 필요; tmux 미지원 |

문제 보고에는 Claude Code 버전, 운영체제, 터미널, SSH·tmux 사용 여부와 재현 방법을 포함해 주세요.

</details>

<details>
<summary><strong>저장소 구조</strong></summary>

```text
hee-terminal-render/
├── .claude-plugin/   플러그인·마켓플레이스 정보와 사용자 옵션
├── hooks/            렌더링·테마·복사·시각·진행 패널
├── tests/            기능·회귀 테스트와 스냅샷
├── scripts/          빌드·스냅샷·성능 측정 도구
├── docs/             화면 자료·예제·변경 기록
├── types/            플러그인 타입 정의
└── codex/            별도 생성되는 연동 산출물
```

개발·검증 절차는 [AGENTS.md](AGENTS.md)를 참고합니다.

</details>

---

<div align="center">

**hee-terminal-render**<br>
<sub>우리의 Claude Code 작업 환경을 위한 터미널 렌더링.</sub>

[문제 보고 · 개선 제안](https://github.com/jojunhee125/hee-terminal-render/issues)

</div>
