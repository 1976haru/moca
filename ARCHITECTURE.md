# MOCA 아키텍처 가이드

> 이 문서는 MOCA 프로젝트의 파일 구조 기준을 정의합니다.  
> 새 기능 추가 또는 리팩터링 시 반드시 이 기준을 따라주세요.

---

## 핵심 원칙

```
index.html     허브/라우터만  → 카드 클릭 시 engines/* 로 이동
engines/*      페이지 껍데기  → 독립 실행 가능한 전용 화면
modules/*      기능 로직      → 엔진에서 로드하는 단계별 JS
core/*         공통 JS       → 허브 + 엔진 모두에서 공유
shared/*       공통 CSS/UI   → 스타일·컴포넌트
```

---

## 계층별 역할

### `index.html` — 허브/라우터
- 카드 그리드 렌더링만 담당
- 기능 로직 없음
- 클릭 → `engines/xxx/index.html` redirect
- 로드하는 JS: `core/hub.js`, `core/nav.js` 등 허브 전용만

```html
<!-- 올바른 예 -->
<button onclick="location.href='engines/shorts/index.html'">자동숏츠</button>

<!-- 잘못된 예 — index.html에 기능 로직 넣지 않기 -->
<button onclick="wzOpen('general')">자동숏츠</button>
```

---

### `engines/xxx/index.html` — 페이지 껍데기
- URL로 직접 접근 가능한 독립 페이지
- HTML 구조 + 탭 라우팅만 담당
- 실제 로직은 `modules/*` 에서 로드

| 엔진 | 역할 |
|------|------|
| `engines/shorts/` | 자동숏츠 전용 스튜디오 |
| `engines/script/` | 대본 생성기 |
| `engines/media/`  | 미디어 엔진 (음성·이미지·영상) |

```html
<!-- engines/shorts/index.html 예시 -->
<script src="../../modules/studio/index.js"></script>
<script src="../../modules/studio/s1-script.js"></script>
<script src="../../modules/studio/s2-voice.js"></script>
```

---

### `modules/xxx/*.js` — 기능 로직
- 특정 엔진에 종속된 단계별 로직
- 직접 URL 접근 불가, 항상 엔진에서 로드
- 1000줄 이하로 유지 (초과 시 중분류 분리)

| 모듈 | 역할 | 로드하는 엔진 |
|------|------|-------------|
| `modules/studio/` | 자동숏츠 6단계 로직 | `engines/shorts/` |
| `modules/profit/` | 블로그·웹툰·SNS 빌더 | `engines/profit/` |
| `modules/smb/`    | 소상공인·지원금 | `engines/smb/` |
| `modules/edu/`    | 학습·교육 | `engines/edu/` |
| `modules/trans/`  | 번역 | `engines/trans/` |
| `modules/psy/`    | 심리·운세 | `engines/psy/` |
| `modules/public/` | 공공기관 문서 | `engines/public/` |
| `modules/media/`  | 미디어 바·콤보 | `engines/media/` |

---

### `core/*.js` — 공통 JS
- `index.html` + 모든 `engines/*` 에서 공유
- 허브 UI, 설정, 프로필, 라이브러리 등

| 파일 | 역할 |
|------|------|
| `core/hub.js` | 카드 렌더링·라우팅 |
| `core/settings.js` | 설정 탭 |
| `core/profile.js` | 프로필 시스템 |
| `core/library.js` | 보관함 |
| `core/ab.js` | A/B 비교 |
| `core/share.js` | 공유 |
| `core/about.js` | 소개·QnA |
| `core/kids.js` | 어린이 모드 |
| `core/guide.js` | 가이드 모드 |
| `core/bench.js` | 벤치마킹 |
| `core/onboarding.js` | 온보딩·추천 |
| `core/ppt.js` | PPT 빌더 |
| `core/pkg.js` | PKG 패키지 |
| `core/nav.js` | 네비게이션 |
| `core/uch.js` | 상단바 UCH |
| `core/breadcrumb.js` | 브레드크럼·FAB |
| `core/init.js` | 초기화 |

---

### `shared/*` — 공통 CSS/UI
| 파일 | 역할 |
|------|------|
| `shared/style.css` | 전역 스타일 |
| `shared/ui.css` | UI 컴포넌트 |
| `shared/ui.js` | UI 헬퍼 함수 |
| `shared/api-settings.js` | API 통합설정 |

---

## 자동숏츠 구조 상세

```
index.html
  └─ 카드 클릭 → location.href = 'engines/shorts/index.html'

engines/shorts/index.html       ← 껍데기 (탭·스테퍼 HTML)
  └─ modules/studio/index.js    ← 공통 상수·음성 데이터
  └─ modules/studio/s1-script.js ← STEP1 대본
  └─ modules/studio/s2-voice.js  ← STEP2 음성·BGM
  └─ modules/studio/s3-image.js  ← STEP3 이미지
  └─ modules/studio/s3-reuse.js  ← 이미지 절약
  └─ modules/studio/s3-stock.js  ← 스톡 검색
  └─ modules/studio/s4-edit.js   ← STEP4 편집
  └─ modules/studio/s5-upload.js ← STEP5 업로드
```

**기준:**
- `engines/shorts/` = 화면 껍데기, URL 진입점
- `modules/studio/` = 단계별 실제 로직
- 이 둘을 절대 섞지 않는다

---

## 파일 크기 기준

| 기준 | 조치 |
|------|------|
| 1,000줄 이하 | 정상 |
| 1,000~2,000줄 | 역할별 중분류 분리 검토 |
| 2,000줄 초과 | 반드시 분리 |

---

## 개발 플로우

```
새 기능 추가 시:
  1. engines/xxx/ 에 HTML 껍데기 생성
  2. modules/xxx/ 에 JS 로직 작성
  3. index.html 에 카드 추가 (redirect만)
  4. core/ 에는 여러 엔진이 공유하는 것만

잘못된 예:
  ❌ index.html 에 기능 로직 직접 작성
  ❌ engines/ HTML 에 비즈니스 로직 인라인
  ❌ modules/ 파일 2000줄 초과 방치
```

---

## 협업 규칙

```
코드 수정  = Claude Code 터미널
설계·지시  = Claude (이 창)
코드 검수  = ChatGPT 정적 분석
결과 확인  = VSCode + 브라우저

CSS 변수:
  --pink:   #ef6fab
  --purple: #9181ff
  --line:   #f0e8ef
```

---

*최종 업데이트: 2026-04*
