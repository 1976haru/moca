/* ================================================
   server/index.js
   영상 리믹스 스튜디오 import API — Express 진입점
   * /api/health            서버 상태 + 사용 가능 기능
   * /api/youtube/*         메타 / OAuth / captions
   * /api/remix/*           transcribe / keyframes
   * 환경변수가 없으면 해당 endpoint 는 503 + 명확한 에러로 응답 (crash 안 함)
   ================================================ */
'use strict';

const path    = require('path');
const fs      = require('fs');
const express = require('express');
const cors    = require('cors');

const youtubeRoute = require('./routes/youtube');
const remixRoute   = require('./routes/remix');

const app  = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

/* ── CORS — ALLOWED_ORIGINS 환경변수의 콤마구분 목록 (없으면 전체 허용) ── */
const allowed = String(process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || !allowed.length) return cb(null, true);
    cb(null, allowed.includes(origin));
  },
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

/* ── 정적 파일 — 생성된 keyframe 이미지 ── */
const FRAMES_DIR = process.env.FRAMES_DIR || path.join(__dirname, '_tmp_frames');
try { fs.mkdirSync(FRAMES_DIR, { recursive: true }); } catch (_) {}
app.use('/static/frames', express.static(FRAMES_DIR, { maxAge: '1h' }));

/* ── 헬스 체크 ── */
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'moca-remix-api',
    time: new Date().toISOString(),
    version: '0.1.0',
    features: {
      youtubeMeta:               true, /* oEmbed 는 항상 동작 */
      youtubePublicTranscript:   true, /* 실험 기능 — captionTracks 보조 추출. 영상별 성공률 다름 */
      youtubeCaptionsOAuth:      !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      mp4Transcribe:             true, /* 키 없으면 stub 모드 */
      mp4TranscribeReal:         !!(process.env.OPENAI_API_KEY || process.env.DAGLO_API_KEY),
      sttWhisper:                !!process.env.OPENAI_API_KEY,
      sttDaglo:                  !!process.env.DAGLO_API_KEY,
      keyframes:                 true, /* ffmpeg-static 사용 */
    },
    transcribeMode: process.env.DAGLO_API_KEY ? 'daglo'
                  : process.env.OPENAI_API_KEY ? 'whisper'
                  : 'stub',
  });
});

/* ── 라우트 마운트 ── */
app.use('/api/youtube', youtubeRoute);
app.use('/api/remix',   remixRoute);

/* ── 404 ── */
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, error: 'NOT_FOUND', message: '엔드포인트를 찾을 수 없습니다: ' + req.path });
});

/* ── 글로벌 에러 핸들러 (조용한 실패 금지) ── */
app.use((err, req, res, _next) => {
  console.error('[server error]', err && err.stack || err);
  res.status(err.status || 500).json({
    ok: false,
    error: err.code || 'INTERNAL_ERROR',
    message: err.message || '서버 내부 오류',
  });
});

app.listen(PORT, () => {
  console.log('[moca-remix-api] listening on http://localhost:' + PORT);
  console.log('[moca-remix-api] features:', {
    youtubeOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    transcribe:   process.env.OPENAI_API_KEY ? 'whisper' : 'stub',
  });
});

module.exports = app;
