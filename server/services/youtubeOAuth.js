/* ================================================
   server/services/youtubeOAuth.js
   Google OAuth + YouTube Data API captions (권한 있는 영상만)
   ================================================ */
'use strict';

let google;
try { google = require('googleapis').google; } catch (_) { google = null; }

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.force-ssl', /* captions list/download */
  'https://www.googleapis.com/auth/youtube.readonly',
];

function isConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && google);
}

function _client() {
  if (!google) throw new Error('googleapis 모듈 미설치 — npm install 을 실행하세요.');
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT || 'http://localhost:3001/api/youtube/oauth/callback'
  );
}

function getAuthUrl() {
  const auth = _client();
  return auth.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

async function exchangeCode(code) {
  const auth = _client();
  const { tokens } = await auth.getToken(code);
  return tokens;
}

function _authedClient(accessToken) {
  const auth = _client();
  auth.setCredentials({ access_token: accessToken });
  return auth;
}

async function listCaptions(accessToken, videoId) {
  const auth = _authedClient(accessToken);
  const youtube = google.youtube({ version: 'v3', auth });
  const r = await youtube.captions.list({ part: ['snippet'], videoId });
  return (r.data.items || []).map(it => ({
    id:       it.id,
    language: it.snippet && it.snippet.language,
    name:     it.snippet && it.snippet.name,
    trackKind:it.snippet && it.snippet.trackKind,
    isDraft:  it.snippet && it.snippet.isDraft,
    isAutoSynced: it.snippet && it.snippet.isAutoSynced,
  }));
}

async function downloadCaption(accessToken, captionId, format) {
  const auth = _authedClient(accessToken);
  const youtube = google.youtube({ version: 'v3', auth });
  /* tfmt: srt | vtt */
  const r = await youtube.captions.download(
    { id: captionId, tfmt: format === 'vtt' ? 'vtt' : 'srt' },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(r.data);
}

module.exports = {
  isConfigured,
  getAuthUrl,
  exchangeCode,
  listCaptions,
  downloadCaption,
};
