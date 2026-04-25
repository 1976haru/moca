# MOCA - 통합 콘텐츠 생성기

배포: https://1976haru.github.io/moca

## 로컬 실행

```bash
npm run dev   # http://localhost:3000
```

> Node.js 없이도 동작합니다.
> `npm run dev` 는 CORS 없이 로컬 파일 간 통신이 필요할 때 사용.

## 개발 명령어

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 로컬 서버 (포트 3000) |
| `npm run lint` | 코드 스타일 검사 |
| `npm run format` | 코드 자동 정렬 |
| `npm run check` | lint + format 통합 검사 |

## 폴더 구조

```
index.html          <- 허브 진입점 (직접 수정 금지)
engines/            <- 각 기능별 독립 UI
  shorts/           <- 숏츠 전용 화면
  profit / public / edu / trans / smb / psy
modules/studio/     <- 숏츠 단계 로직 (s1~s5)
core/               <- API 어댑터, 공통 유틸
assets/             <- 공통 CSS
config/             <- AI 프로바이더 설정
```

자세한 구조 -> ARCHITECTURE.md
