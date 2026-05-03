/* ================================================
   server/routes/remix.js
   MP4 transcribe + keyframes (사용자 업로드 영상 전용)
   ================================================ */
'use strict';

const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const os       = require('os');
const router   = express.Router();
const transcribeSvc = require('../services/transcribe');
const keyframesSvc  = require('../services/keyframes');

/* multer — 임시 파일 디스크 저장. 100MB limit. */
const TMP_DIR = path.join(os.tmpdir(), 'moca-remix-uploads');
try { fs.mkdirSync(TMP_DIR, { recursive: true }); } catch (_) {}
const upload = multer({
  dest: TMP_DIR,
  limits: { fileSize: 100 * 1024 * 1024 },
});

function _cleanup(file) {
  if (!file || !file.path) return;
  fs.unlink(file.path, () => {});
}

/* ── /api/remix/transcribe ──
     입력: multipart/form-data
       - video|audio|file: MP4/WebM/MP3/WAV/M4A 파일 (사용자 권한 영상)
       - language:  (선택) 'ko', 'ja', 'en' 등
       - provider:  (선택) 'auto' | 'whisper' | 'daglo'
     출력: { ok, language, durationSec, segments:[{startSec,endSec,text}], source, provider } */
router.post('/transcribe', upload.any(), async (req, res, next) => {
  /* multer.any() — 'video', 'audio', 'file' 등 어느 필드명이든 첫 파일 사용 */
  const file = (req.files || []).find(f => /^(video|audio|file)$/i.test(f.fieldname)) || (req.files || [])[0];
  try {
    if (!file) {
      return res.status(400).json({ ok: false, error: 'NO_FILE',
        message: 'multipart/form-data 의 "video" / "audio" / "file" 필드에 파일이 필요합니다.' });
    }
    const language = String(req.body.language || process.env.WHISPER_LANGUAGE || '').trim() || undefined;
    const provider = String(req.body.provider || 'auto').trim().toLowerCase();
    const result = await transcribeSvc.run(file.path, { language, provider });
    _cleanup(file);
    res.json({ ok: true, ...result });
  } catch (e) {
    _cleanup(file);
    if (e.code === 'NO_DAGLO_KEY') {
      return res.status(503).json({ ok: false, error: 'STT_NOT_CONFIGURED',
        message: '음성 인식(Daglo)이 설정되지 않았습니다. DAGLO_API_KEY 환경변수를 설정하거나, provider=whisper 또는 provider=auto 로 다시 시도하세요.' });
    }
    if (e.code === 'NO_OPENAI_KEY') {
      return res.status(503).json({ ok: false, error: 'STT_NOT_CONFIGURED',
        message: '음성 인식(Whisper)이 설정되지 않았습니다. OPENAI_API_KEY 환경변수를 설정하거나, provider=daglo 로 다시 시도하세요.' });
    }
    if (e.code === 'DAGLO_AUTH_FAIL') {
      return res.status(401).json({ ok: false, error: 'STT_AUTH_FAIL',
        message: 'Daglo 인증 실패 — DAGLO_API_KEY 를 확인하세요.' });
    }
    if (e.code === 'DAGLO_HTTP_FAIL' || e.code === 'DAGLO_PARSE_FAIL' || e.code === 'DAGLO_NETWORK_FAIL') {
      return res.status(502).json({ ok: false, error: 'STT_PROVIDER_FAIL',
        message: 'Daglo 호출 실패: ' + (e.message || '') });
    }
    next(e);
  }
});

/* ── /api/remix/keyframes ──
   입력: multipart/form-data
     - video: mp4 파일
     - scenes: JSON string [{ sceneIndex, startSec, endSec }]
   출력: { ok, frames: [{ sceneIndex, startSec, imageUrl }] } */
router.post('/keyframes', upload.single('video'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'NO_FILE',
        message: 'multipart/form-data 의 "video" 필드에 파일이 필요합니다.' });
    }
    let scenes;
    try { scenes = JSON.parse(req.body.scenes || '[]'); }
    catch (e) {
      _cleanup(req.file);
      return res.status(400).json({ ok: false, error: 'INVALID_SCENES',
        message: 'scenes 필드는 JSON 배열이어야 합니다.' });
    }
    if (!Array.isArray(scenes) || !scenes.length) {
      _cleanup(req.file);
      return res.status(400).json({ ok: false, error: 'EMPTY_SCENES',
        message: 'scenes 배열이 비어있습니다.' });
    }
    const baseUrl = String(process.env.PUBLIC_BASE_URL || ('http://localhost:' + (process.env.PORT || 3001))).replace(/\/$/, '');
    const framesDir = process.env.FRAMES_DIR || path.join(__dirname, '..', '_tmp_frames');
    const frames = await keyframesSvc.extract(req.file.path, scenes, { framesDir, baseUrl });
    _cleanup(req.file);
    res.json({ ok: true, frames });
  } catch (e) {
    _cleanup(req.file);
    if (e.code === 'FFMPEG_FAIL') {
      return res.status(500).json({ ok: false, error: 'KEYFRAME_FAIL',
        message: '프레임 추출에 실패했습니다. 자막 기반으로 계속 진행할 수 있습니다.' });
    }
    next(e);
  }
});

module.exports = router;
