/* ================================================
   server/routes/youtube.js
   YouTube 메타 + OAuth + captions
   ================================================ */
'use strict';

const express = require('express');
const router  = express.Router();
const oauthSvc = require('../services/youtubeOAuth');

/* ── videoId 파싱 ── */
function _extractVideoId(url) {
  if (!url) return '';
  const s = String(url).trim();
  let m;
  m = s.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);            if (m) return m[1];
  m = s.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/); if (m) return m[1];
  m = s.match(/[?&]v=([A-Za-z0-9_-]{6,})/);                  if (m) return m[1];
  m = s.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/);   if (m) return m[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  return '';
}

/* ── /api/youtube/meta?url= ── */
router.get('/meta', async (req, res, next) => {
  try {
    const url = String(req.query.url || '').trim();
    const videoId = _extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ ok: false, error: 'INVALID_URL',
        message: '유튜브 URL 에서 videoId 를 찾지 못했습니다.' });
    }
    /* oEmbed — 키 없이 동작 (cross-origin 이라 서버에서 호출) */
    const oeUrl = 'https://www.youtube.com/oembed?url=' +
      encodeURIComponent('https://www.youtube.com/watch?v=' + videoId) + '&format=json';
    let meta = { videoId, title: '', author: '', thumbnailUrl: 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg' };
    try {
      const r = await fetch(oeUrl);
      if (r.ok) {
        const j = await r.json();
        if (j.title)         meta.title        = j.title;
        if (j.author_name)   meta.author       = j.author_name;
        if (j.thumbnail_url) meta.thumbnailUrl = j.thumbnail_url;
      }
    } catch (_) { /* oEmbed 실패해도 기본 thumbnail 로 진행 */ }
    res.json({ ok: true, source: 'youtube', ...meta });
  } catch (e) { next(e); }
});

/* ── OAuth 로그인 시작 ── */
router.get('/oauth/start', (req, res) => {
  if (!oauthSvc.isConfigured()) {
    return res.status(503).json({ ok: false, error: 'OAUTH_NOT_CONFIGURED',
      message: 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET 환경변수가 설정되지 않았습니다.' });
  }
  try {
    const url = oauthSvc.getAuthUrl();
    res.redirect(url);
  } catch (e) {
    res.status(500).json({ ok: false, error: 'OAUTH_URL_FAILED', message: e.message });
  }
});

/* ── OAuth callback ── */
router.get('/oauth/callback', async (req, res) => {
  if (!oauthSvc.isConfigured()) {
    return res.status(503).send('OAuth not configured.');
  }
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing ?code');
  try {
    const tokens = await oauthSvc.exchangeCode(String(code));
    /* 프론트로 토큰 전달 — 실제 운영에서는 cookie/session 권장 */
    res.send(
      '<!doctype html><meta charset="utf-8"><title>OAuth 완료</title>' +
      '<script>try { window.opener && window.opener.postMessage({ type:"moca-yt-oauth", tokens:' +
      JSON.stringify(tokens) + ' }, "*"); window.close(); } catch(_){}</script>' +
      '<p>인증이 완료되었습니다. 이 창은 자동으로 닫힙니다.</p>'
    );
  } catch (e) {
    res.status(500).send('OAuth callback failed: ' + e.message);
  }
});

/* ── captions list — 권한 있는 영상만 ── */
router.get('/captions/list', async (req, res, next) => {
  try {
    if (!oauthSvc.isConfigured()) {
      return res.status(503).json({ ok: false, error: 'OAUTH_NOT_CONFIGURED',
        message: 'OAuth 미설정. GOOGLE_CLIENT_ID/SECRET 필요.' });
    }
    const accessToken = req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '');
    if (!accessToken) {
      return res.status(401).json({ ok: false, error: 'NO_TOKEN',
        message: 'Authorization: Bearer <access_token> 헤더가 필요합니다. /api/youtube/oauth/start 로 로그인 후 받은 토큰을 사용하세요.' });
    }
    const videoId = String(req.query.videoId || '').trim();
    if (!videoId) return res.status(400).json({ ok: false, error: 'NO_VIDEO_ID', message: 'videoId 가 필요합니다.' });
    const list = await oauthSvc.listCaptions(accessToken, videoId);
    res.json({ ok: true, videoId, captions: list });
  } catch (e) {
    if (e.response && e.response.status === 403) {
      return res.status(403).json({ ok: false, error: 'NO_PERMISSION',
        message: '이 영상의 자막을 가져올 권한이 없습니다. 본인 영상이거나 자막 접근 권한이 있는 영상만 자동 가져오기가 가능합니다.' });
    }
    next(e);
  }
});

/* ── captions download — SRT/VTT/TXT 포맷 변환 ── */
router.get('/captions/download', async (req, res, next) => {
  try {
    if (!oauthSvc.isConfigured()) {
      return res.status(503).json({ ok: false, error: 'OAUTH_NOT_CONFIGURED',
        message: 'OAuth 미설정.' });
    }
    const accessToken = req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '');
    if (!accessToken) return res.status(401).json({ ok: false, error: 'NO_TOKEN', message: 'Authorization Bearer 토큰 필요.' });
    const captionId = String(req.query.captionId || '').trim();
    if (!captionId) return res.status(400).json({ ok: false, error: 'NO_CAPTION_ID', message: 'captionId 필요.' });
    const format = (String(req.query.format || 'srt').toLowerCase() === 'vtt') ? 'vtt' : 'srt';
    const buf = await oauthSvc.downloadCaption(accessToken, captionId, format);
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(buf);
  } catch (e) {
    if (e.response && (e.response.status === 403 || e.response.status === 401)) {
      return res.status(e.response.status).json({ ok: false, error: 'NO_PERMISSION',
        message: '이 자막을 다운로드할 권한이 없습니다.' });
    }
    next(e);
  }
});

module.exports = router;
