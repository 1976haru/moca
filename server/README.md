# MOCA Remix Studio API

영상 리믹스 스튜디오의 서버 자동 가져오기 백엔드. GitHub Pages 정적 프론트엔드만으로는
처리할 수 없는 작업 — YouTube OAuth captions, MP4 음성 인식 (Whisper), ffmpeg 기반
프레임 추출 — 을 담당합니다.

## 엔드포인트

| Method | Path | 설명 | 필요 환경변수 |
|---|---|---|---|
| GET | `/api/health` | 서버 상태 + 사용 가능 기능 | — |
| GET | `/api/youtube/meta?url=` | 영상 제목/썸네일 (oEmbed) | — |
| GET | `/api/youtube/public-transcript?url=` | 🅰 공개 자막 보조 추출 (실험) | — |
| GET | `/api/youtube/transcript?url=&mode=public` | 위와 동일 (alias) | — |
| GET | `/api/youtube/oauth/start` | 🅱 Google 로그인 시작 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| GET | `/api/youtube/oauth/callback` | OAuth 콜백 | (위와 동일) |
| GET | `/api/youtube/captions/list?videoId=` | 🅱 권한 있는 영상의 자막 목록 | OAuth + Bearer 토큰 |
| GET | `/api/youtube/captions/download?captionId=&format=srt|vtt` | 🅱 자막 다운로드 | OAuth + Bearer 토큰 |
| POST | `/api/remix/transcribe` (multipart `video`) | MP4 → 자막 segments | (선택) `OPENAI_API_KEY` |
| POST | `/api/remix/keyframes` (multipart `video` + `scenes` JSON) | scene midSec 프레임 추출 | — (ffmpeg-static 포함) |

> 🅰 **공개 자막 보조 추출 (`/api/youtube/public-transcript`)** — 영상 파일/오디오를 다운로드하지 않고
> 자막 텍스트 트랙만 시도하는 **실험 기능**입니다. 영상별로 성공률이 다르며 실패할 수 있습니다.
> 추출 시도 순서: ① watch 페이지 HTML → `ytInitialPlayerResponse.captions` → captionTracks
> ② baseUrl 호출 (XML/SRV3) ③ timedtext endpoint 직접 시도. 언어 우선순위는 ko → ja → en.
> 실패 시 명확한 error code 반환: `INVALID_URL` · `VIDEO_NOT_FOUND` · `NO_PUBLIC_CAPTIONS` ·
> `CAPTION_TRACK_NOT_FOUND` · `CAPTION_FETCH_BLOCKED` · `NETWORK_FAIL` · `PARSE_FAILED` ·
> `POLICY_RESTRICTED`. 프론트엔드는 실패 시 자막 붙여넣기 / SRT 업로드 / MP4 STT 로 fallback.
>
> 🅱 **OAuth captions API** 는 본인/권한 있는 영상에만 사용. 정확하고 안정적이지만 OAuth 셋업 필요.

환경변수가 없으면 해당 endpoint 는 `503 + {ok:false, error, message}` 로 명확히 응답합니다.
서버는 절대 silent fail 하지 않습니다.

## 로컬 실행

```bash
cd server
cp .env.example .env       # 필요한 키만 채워주세요
npm install
npm start                  # 또는 npm run dev (--watch)
```

기본 포트: `3001`. 헬스체크: <http://localhost:3001/api/health>

## 배포 (예: Render)

1. Render 대시보드 → New + Web Service → 이 GitHub 레포 연결
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment Variables:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (선택 — OAuth 자막)
   - `GOOGLE_OAUTH_REDIRECT` = `https://your-render-app.onrender.com/api/youtube/oauth/callback`
   - `OPENAI_API_KEY` (선택 — Whisper STT)
   - `ALLOWED_ORIGINS` = `https://1976haru.github.io` (또는 빈 칸 = 전체 허용)
   - `PUBLIC_BASE_URL` = `https://your-render-app.onrender.com`

다른 PaaS (Railway, Fly.io, Vercel Functions) 도 동일 패턴.

## 프론트 연결

영상 리믹스 스튜디오 → "☁️ 서버 자동 가져오기" 카드 → API 서버 주소 입력 → 연결 테스트.
주소는 `localStorage['moca_remix_api_base_url']` 에 저장됩니다.

## OAuth 셋업 (Google Cloud Console)

1. <https://console.cloud.google.com/apis/credentials> → OAuth 2.0 클라이언트 ID 생성
2. Application type: **Web application**
3. Authorized redirect URIs: `<서버주소>/api/youtube/oauth/callback`
4. YouTube Data API v3 활성화: <https://console.cloud.google.com/apis/library/youtube.googleapis.com>
5. 발급된 Client ID / Secret 을 `.env` 에 입력

⚠️ YouTube `captions.download` API 는 영상 소유자 본인 또는 자막 접근 권한이 있는 영상만
허용됩니다. 권한 없는 영상은 403 응답 — 사용자 친화 메시지로 변환됩니다.

## 개발 모드 (stub)

환경변수 없이도 다음은 동작합니다:
- `/api/health` → 사용 가능 기능 표시
- `/api/youtube/meta` → oEmbed
- `/api/remix/transcribe` → **stub 자막** (5초 단위 placeholder, ffprobe 로 길이만 측정)
- `/api/remix/keyframes` → ffmpeg-static 으로 실제 프레임 추출

이 stub 모드는 프론트 흐름 테스트에 사용하세요. 실제 자막 인식이 필요하면 OpenAI API 키를
설정합니다.
