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

---

## 숏츠 스튜디오 파이프라인
