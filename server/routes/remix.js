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

/* ── /api/remix/transcribe ── */
router.post('/transcribe', upload.single('video'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'NO_FILE',
        message: 'multipart/form-data 의 "video" 필드에 파일이 필요합니다.' });
    }
    const language = String(req.body.language || process.env.WHISPER_LANGUAGE || '').trim() || undefined;
    const result = await transcribeSvc.run(req.file.path, { language });
    _cleanup(req.file);
    res.json({ ok: true, ...result });
  } catch (e) {
    _cleanup(req.file);
    if (e.code === 'NO_OPENAI_KEY') {
      /* stub fallback 도 실패한 경우만 — 일반적으로 stub 은 항상 성공 */
      return res.status(503).json({ ok: false, error: 'STT_NOT_CONFIGURED',
        message: '음성 인식이 설정되지 않았습니다. OPENAI_API_KEY 환경변수를 설정하거나, 자막 파일을 직접 업로드하세요.' });
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
