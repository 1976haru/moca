# MOCA 파일 구조 기준 문서

## 수정 가이드 — 협업자용

| 수정하려는 것 | 파일 위치 | 비고 |
|---|---|---|
| 메인 카테고리 카드 | `core/hub.js` | 카드 추가/수정 |
| 상단 바 (날씨/AI상태/UCH) | `core/uch.js` | 날씨·AI 상태·언어 |
| 소개/Q&A | `core/about.js` | MOCA 소개 페이지 |
| 어린이 모드 | `core/kids.js` | 어린이 전용 UI |
| 가이드 | `core/guide.js` | 사용 가이드 |
| 설정 | `core/settings.js` | API 키·환경설정 |
| 보관함/트렌드/A·B/공유 | `core/library.js` | 콘텐츠 관리 |
| 브레드크럼 | `core/breadcrumb.js` | 네비게이션 경로 |
| 온보딩/추천 | `core/onboarding.js` | 첫 방문 안내 |
| **숏츠 스튜디오 단계 로직** | `modules/studio/*.js` | 핵심 파이프라인 |
| **숏츠 진입/껍데기** | `engines/shorts/index.html` | 60줄 껍데기만 |
| **대본 생성기** | `engines/script/index.html` | 독립 엔진 |
| 수익형/공공기관 등 | `engines/*/index.html` | 각 독립 엔진 |

> ⚠️ **index.html은 직접 수정하지 마세요** — div 컨테이너만 있습니다.

> ℹ️ engines/profit, public, edu, trans, smb, psy 는 이미 독립 디렉토리로 분리됨.
> index.html 내 `*Detail.hide` div들(`monetizeDetail` → profit, `publicDetail`, `eduDetail`, `transDetail`, `smbDetail`, `psyDetail`)은
> 카드 클릭 시 해당 `engines/<name>/index.html`로 이동하는 **리다이렉트 스텁**일 뿐,
> 실제 UI는 각 `engines/<name>/index.html`에 있음.

---

## 숏츠 스튜디오 파이프라인

engines/shorts/index.html → ../../modules/studio/*.js 로드

| 탭 | 역할 | 실제 파일 |
|---|---|---|
| 0 대시보드 | 채널·모드 선택 | modules/studio/dashboard.js |
| 1 대본 생성 | 훅 A/B → 씬 분리 | modules/studio/s1-script-step.js |
| 2 이미지·소스 | 이미지 프롬프트·영상소스 | modules/studio/s3-source-tabs.js |
| 3 음성·BGM | TTS 생성·BGM 매칭 | modules/studio/s2-voice-step.js |
| 4 편집 | 리훅·루프엔딩·사운드FX | modules/studio/s4-edit.js |
| 5 최종검수·출력 | 품질검사·패키지 다운로드 | modules/studio/s5-upload-v2.js |

허브 카드 수정 → core/hub.js (index.html 직접 수정 금지)

---

## 단계별 함수명 매핑

| 단계 | 함수명 | 파일 |
|---|---|---|
| 0 대시보드 | `_studioDashboard()` | dashboard.js |
| 1 대본 생성 | `_studioS1Step()` | s1-script-step.js |
| 2 이미지·영상 소스 | `_studioS3Source()` | s3-source-tabs.js |
| 3 음성·BGM | `_studioS2Step()` | s2-voice-step.js |
| 4 편집·미리보기 | `_studioS4Edit()` | s4-edit.js |
| 5 최종검수·출력 | `_studioS5Upload()` | s5-upload-v2.js |

---

## 데이터 경로 통일 (studioGet)

```javascript
studioGet('script')   // proj.scriptText || proj.script
studioGet('scenes')   // proj.scenes || proj.s3.scenes || proj.sources.images
studioGet('voice')    // proj.voice || proj.s4
studioGet('thumb')    // proj.thumbUrl || proj.s3.thumbUrl
studioGet('edit')     // proj.edit || localStorage moca_s4_edit
```

---

## CSS 변수 (공통 디자인 토큰)

```css
--pink:   #ef6fab
--purple: #9181ff
--line:   #f0e8ef
--text:   #2b2430
--sub:    #9b8a93
```

---

## 개발 원칙

### 파일 규칙

- 파일 1개 = 1000줄 이하 유지
- 설계·기획 → Claude 대화 / 코드 수정·생성 → Claude Code
- 함수 네이밍: 스텝 접두어 사용 (s1_, s2_, s3_, s4_, s5_)

### Git 커밋 컨벤션

- feat: 새 기능 / fix: 버그 / docs: 문서 / refactor: 구조 개선

### 브라우저 테스트 체크리스트

1. 시크릿 창 → 1976haru.github.io/moca/engines/shorts/index.html
2. 0~5단계 탭 클릭 → 각 화면 렌더링 확인
3. F12 콘솔 에러 없음 확인

---

## 모듈 현황

줄 수 대신 상태로 관리합니다. 코드 변경 시 상태(✅/🚧/❌)만 업데이트하세요.

| 파일 | 역할 | 상태 |
|---|---|---|
| modules/studio/dashboard.js | 채널·모드 선택 | ✅ 완료 |
| modules/studio/s1-script-step.js | 대본 생성·훅 A/B | ✅ 완료 |
| modules/studio/s2-voice-step.js | TTS·BGM 매칭 | ✅ 완료 |
| modules/studio/s3-source-tabs.js | 이미지·소스 탭 | ✅ 완료 |
| modules/studio/s4-edit.js | 편집·리훅·사운드FX | ✅ 완료 |
| modules/studio/s5-upload-v2.js | 최종검수·출력 | ✅ 완료 |
| studio-quality.js | 품질관리 시스템 | ✅ 완료 |
| s2-voice-quality.js | 음성 품질 강화 | ✅ 완료 |
| s3-video-tools.js | 영상 프롬프트 | ✅ 완료 |
| engines/script/js/script-music.js | 노래강화 5탭 | ✅ 완료 |
| core/intent-system.js | 이미지 의도 고정 | 🚧 진행중 |
| s5 품질 대시보드 연결 | 통합 품질 대시보드 | 🚧 진행중 |

> 새 파일 추가 시 이 표에 행 추가. 줄 수는 기록하지 않습니다.
