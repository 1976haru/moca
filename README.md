# MOCA — 통합 콘텐츠 생성기

> AI 기반 콘텐츠 자동 생성 플랫폼 (한국·일본 시니어 채널 특화)

배포: [1976haru.github.io/moca](https://1976haru.github.io/moca)

---

## 빠른 시작

```bash
# 로컬 개발 서버
npm install
npm run dev        # localhost:3000

# 코드 검사
npm run check      # JS 문법 체크
npm run lint       # ESLint
npm run format     # Prettier 포맷팅
```

---

## 프로젝트 구조

```
moca/
├── index.html              허브/라우터 (카드 클릭 → engines/* 이동)
│
├── engines/                독립 실행 가능한 전용 페이지
│   ├── script/             대본 생성기
│   ├── shorts/             자동숏츠 스튜디오 (껍데기)
│   ├── media/              미디어 엔진
│   ├── profit/             블로그·뉴스레터·웹툰·SNS·전자책·랜딩
│   ├── public/             공공기관 문서
│   ├── ppt/                PPT 슬라이드
│   ├── bench/              유튜브 벤치마킹
│   ├── edu/                학습/교육
│   ├── trans/              번역/통역
│   ├── smb/                소상공인 패키지
│   ├── psy/                심리/운세
│   ├── library/            내 보관함
│   ├── trend/              트렌드 분석
│   ├── ab/                 A/B 비교
│   └── share/              공유 센터
│
├── modules/                엔진에서 로드하는 기능 로직
│   ├── studio/             자동숏츠 단계별 로직
│   │   ├── index.js        공통 상수·음성 데이터
│   │   ├── s1-script.js    STEP1 대본
│   │   ├── s2-voice.js     STEP2 음성·BGM
│   │   ├── s3-image.js     STEP3 이미지
│   │   ├── s3-reuse.js     이미지 절약
│   │   ├── s3-stock.js     스톡 검색
│   │   ├── s4-edit.js      STEP4 편집
│   │   └── s5-upload.js    STEP5 업로드
│   ├── profit/             수익형 콘텐츠 로직
│   ├── smb/                소상공인 로직
│   ├── edu/                교육 로직
│   ├── trans/              번역 로직
│   ├── psy/                심리 로직
│   ├── public/             공공기관 로직
│   └── media/              미디어 바·콤보
│
├── core/                   허브 + 엔진 공통 JS
│   ├── hub.js              카드 렌더링·라우팅
│   ├── settings.js         설정 (AI·비용·테마)
│   ├── profile.js          프로필 시스템
│   ├── library.js          보관함
│   ├── ab.js               A/B 비교
│   ├── share.js            공유
│   ├── about.js            소개·QnA
│   ├── kids.js             어린이 모드
│   ├── guide.js            가이드 모드
│   ├── bench.js            벤치마킹
│   ├── onboarding.js       온보딩·추천
│   ├── ppt.js              PPT 빌더
│   ├── pkg.js              PKG 패키지
│   ├── nav.js              네비게이션
│   ├── uch.js              상단바 UCH
│   ├── breadcrumb.js       브레드크럼·FAB
│   └── init.js             초기화
│
├── shared/                 공통 CSS·UI
│   ├── style.css           전역 스타일
│   ├── ui.css              UI 컴포넌트
│   ├── ui.js               UI 헬퍼 함수
│   └── api-settings.js     API 통합 설정
│
├── config/
│   └── providers.js        AI 제공자 설정
│
├── ARCHITECTURE.md         구조 기준 문서 (필독)
└── package.json            개발 도구 설정
```

---

## 핵심 구조 원칙

| 레이어 | 역할 | 직접 접근 |
|--------|------|----------|
| `index.html` | 허브·라우터만 | ✅ |
| `engines/*` | 전용 페이지 껍데기 | ✅ URL 직접 가능 |
| `modules/*` | 단계별 기능 로직 | ❌ 엔진에서만 로드 |
| `core/*` | 공통 JS | ❌ 직접 접근 불가 |

> 자세한 구조 기준은 [ARCHITECTURE.md](./ARCHITECTURE.md) 참고

---

## 자동숏츠 구조

```
index.html
  └─ 카드 클릭 → engines/shorts/index.html

engines/shorts/index.html    페이지 껍데기 (탭·스테퍼)
  └─ modules/studio/*.js     단계별 실제 로직
```

**⚠️ 절대 하지 말 것:**
- `index.html`에 자동숏츠 로직 직접 작성
- `engines/shorts/`에 비즈니스 로직 인라인
- `modules/studio/`를 index.html에서 직접 로드

---

## 대본 생성기 구조

```
engines/script/index.html    페이지 껍데기
  └─ engines/script/js/      8개 분리된 JS 모듈
       ├─ script-common.js   공통 상수·헬퍼
       ├─ script-api.js      AI 호출
       ├─ script-gen.js      대본 생성·배치·트렌드
       ├─ script-lyric.js    가사 시스템
       ├─ script-x.js        지식·드라마·유머
       ├─ script-hub.js      스토리·허브·음악
       ├─ script-senior.js   시니어·채널
       └─ script-refine.js   refine·UI 헬퍼
```

---

## CSS 변수

```css
--pink:   #ef6fab   /* 메인 포인트 */
--purple: #9181ff   /* 서브 포인트 */
--line:   #f0e8ef   /* 구분선 */
```

---

## 개발 원칙

```
코드 수정  → Claude Code 터미널
설계·지시  → Claude 대화
코드 검수  → ChatGPT 정적 분석
결과 확인  → VSCode + 브라우저
```

---

## 파일 크기 기준

| 상태 | 기준 | 조치 |
|------|------|------|
| 정상 | ~1,000줄 이하 | 유지 |
| 검토 | 1,000~1,500줄 | 분리 계획 수립 |
| 분리 필요 | 1,500줄 초과 | 즉시 분리 |

---

## 지원 AI

| 제공자 | 용도 |
|--------|------|
| Claude (Anthropic) | 대본·콘텐츠 생성 |
| OpenAI GPT | 대본·이미지(DALL-E) |
| Gemini (Google) | 검색·정보 |
| ElevenLabs | 음성 합성 |
| Nijivoice | 일본어 음성 |

---

*MOCA — Made with Claude Code*
