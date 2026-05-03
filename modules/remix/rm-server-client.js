/* ================================================
   modules/remix/rm-server-client.js
   영상 리믹스 스튜디오 — 서버 자동 가져오기 클라이언트
   * REMIX_API_BASE_URL 을 localStorage 에 저장 / 읽기
   * 헬스체크, YouTube meta, OAuth, captions list/download,
     MP4 transcribe, keyframes 호출
   * 모든 호출은 명시적 에러 객체를 반환 (조용한 실패 금지)
   ================================================ */
(function(){
  'use strict';

  var LS_KEY     = 'moca_remix_api_base_url';
  var LS_TOKEN   = 'moca_remix_yt_oauth_token';

  function _get() {
    try { return localStorage.getItem(LS_KEY) || ''; } catch(_){ return ''; }
  }
  function _set(url) {
    try {
      if (url) localStorage.setItem(LS_KEY, String(url).replace(/\/$/, ''));
      else localStorage.removeItem(LS_KEY);
    } catch(_){}
  }
  function _token() {
    try { return localStorage.getItem(LS_TOKEN) || ''; } catch(_){ return ''; }
  }
  function _setToken(tok) {
    try {
      if (tok) localStorage.setItem(LS_TOKEN, String(tok));
      else localStorage.removeItem(LS_TOKEN);
    } catch(_){}
  }

  function getBaseUrl()   { return _get(); }
  function setBaseUrl(u)  { _set(u); }
  function clearBaseUrl() { _set(''); }
  function getToken()     { return _token(); }
  function setToken(t)    { _setToken(t); }
  function clearToken()   { _setToken(''); }

  function _ok(json) { return Object.assign({ ok: true }, json || {}); }
  function _err(code, message, extra) {
    return Object.assign({ ok: false, error: code, message: message }, extra || {});
  }

  async function _call(pathname, opts) {
    var base = _get();
    if (!base) return _err('NO_SERVER',
      '서버 자동 가져오기를 사용하려면 REMIX_API_BASE_URL 설정이 필요합니다. ' +
      '서버 자동 가져오기 카드에서 API 서버 주소를 입력하세요.');
    opts = opts || {};
    try {
      var r = await fetch(base + pathname, opts);
      var ct = r.headers && r.headers.get && r.headers.get('content-type') || '';
      if (ct.indexOf('application/json') >= 0) {
        var j = await r.json();
        if (!r.ok || (j && j.ok === false)) {
          return Object.assign({ ok: false }, j || {},
            j && j.error ? {} : { error: 'HTTP_' + r.status, message: 'HTTP ' + r.status });
        }
        return Object.assign({ ok: true }, j || {});
      }
      var txt = await r.text();
      if (!r.ok) return _err('HTTP_' + r.status, txt.slice(0, 200) || ('HTTP ' + r.status));
      return _ok({ text: txt });
    } catch (e) {
      return _err('NETWORK_FAIL',
        '서버에 연결하지 못했습니다 (' + (e && e.message || 'unknown') + '). API 서버 주소와 CORS 설정을 확인하세요.');
    }
  }

  /* ── /api/health ── */
  async function health() {
    var r = await _call('/api/health');
    return r;
  }

  /* ── /api/youtube/meta ── */
  async function youtubeMeta(url) {
    if (!url) return _err('NO_URL', '유튜브 링크를 입력하세요.');
    return await _call('/api/youtube/meta?url=' + encodeURIComponent(url));
  }

  /* ── /api/youtube/public-transcript ──
     ⚠️ 실험 기능: 공개 영상에서만 가능하며, 영상별로 성공률이 다릅니다.
     실패 시 자막 붙여넣기 / SRT 업로드 / MP4 STT 로 fallback 하세요. */
  async function publicTranscript(url, language) {
    if (!url) return _err('NO_URL', '유튜브 링크를 입력하세요.');
    var qs = '/api/youtube/public-transcript?url=' + encodeURIComponent(url);
    if (language) qs += '&language=' + encodeURIComponent(language);
    return await _call(qs);
  }

  /* ── OAuth ── */
  function oauthStartUrl() {
    var base = _get();
    if (!base) return '';
    return base + '/api/youtube/oauth/start';
  }
  /* postMessage 로 토큰 받기 — popup 창에서 oauth/callback 이 보냄 */
  function listenForOAuthToken(timeoutMs) {
    return new Promise(function(resolve, reject) {
      var done = false;
      function _onMsg(ev) {
        var d = ev && ev.data;
        if (!d || d.type !== 'moca-yt-oauth') return;
        done = true;
        window.removeEventListener('message', _onMsg);
        if (d.tokens && d.tokens.access_token) {
          _setToken(d.tokens.access_token);
          resolve(d.tokens);
        } else {
          reject(new Error('access_token 없음'));
        }
      }
      window.addEventListener('message', _onMsg);
      setTimeout(function(){
        if (done) return;
        window.removeEventListener('message', _onMsg);
        reject(new Error('OAuth 응답 타임아웃 (' + (timeoutMs||60000)/1000 + '초)'));
      }, timeoutMs || 60000);
    });
  }
  async function captionsList(videoId) {
    var tok = _token();
    if (!tok) return _err('NO_TOKEN', '먼저 Google 로그인을 완료하세요.');
    return await _call('/api/youtube/captions/list?videoId=' + encodeURIComponent(videoId), {
      headers: { 'Authorization': 'Bearer ' + tok },
    });
  }
  async function captionsDownload(captionId, format) {
    var tok = _token();
    if (!tok) return _err('NO_TOKEN', '먼저 Google 로그인을 완료하세요.');
    var base = _get();
    if (!base) return _err('NO_SERVER', '서버 주소 미설정.');
    try {
      var r = await fetch(base + '/api/youtube/captions/download?captionId=' +
        encodeURIComponent(captionId) + '&format=' + (format || 'srt'),
        { headers: { 'Authorization': 'Bearer ' + tok } });
      if (!r.ok) {
        var j;
        try { j = await r.json(); } catch(_){ j = null; }
        return Object.assign({ ok: false }, j || {},
          j && j.error ? {} : { error: 'HTTP_' + r.status, message: 'HTTP ' + r.status });
      }
      var text = await r.text();
      return _ok({ text: text, format: format || 'srt' });
    } catch (e) {
      return _err('NETWORK_FAIL', e && e.message || 'unknown');
    }
  }

  /* ── /api/remix/transcribe (multipart) ── */
  async function transcribe(file, opts) {
    var base = _get();
    if (!base) return _err('NO_SERVER', '서버 주소 미설정.');
    if (!file) return _err('NO_FILE', '업로드할 파일이 없습니다.');
    var fd = new FormData();
    fd.append('video', file, file.name || 'video.mp4');
    if (opts && opts.language) fd.append('language', opts.language);
    try {
      var r = await fetch(base + '/api/remix/transcribe', { method: 'POST', body: fd });
      var j;
      try { j = await r.json(); } catch(_){ j = null; }
      if (!r.ok || !j || j.ok === false) {
        return Object.assign({ ok: false }, j || {},
          j && j.error ? {} : { error: 'HTTP_' + r.status, message: 'HTTP ' + r.status });
      }
      return Object.assign({ ok: true }, j);
    } catch (e) {
      return _err('NETWORK_FAIL', e && e.message || 'unknown');
    }
  }

  /* ── /api/remix/keyframes (multipart) ── */
  async function keyframes(file, scenes) {
    var base = _get();
    if (!base) return _err('NO_SERVER', '서버 주소 미설정.');
    if (!file) return _err('NO_FILE', '업로드할 파일이 없습니다.');
    if (!Array.isArray(scenes) || !scenes.length) {
      return _err('NO_SCENES', '프레임 추출할 씬이 없습니다.');
    }
    var fd = new FormData();
    fd.append('video', file, file.name || 'video.mp4');
    fd.append('scenes', JSON.stringify(scenes.map(function(s, i){
      return { sceneIndex: s.sceneIndex != null ? s.sceneIndex : i,
               startSec: s.startSec || 0, endSec: s.endSec || (s.startSec||0) + 4 };
    })));
    try {
      var r = await fetch(base + '/api/remix/keyframes', { method: 'POST', body: fd });
      var j;
      try { j = await r.json(); } catch(_){ j = null; }
      if (!r.ok || !j || j.ok === false) {
        return Object.assign({ ok: false }, j || {},
          j && j.error ? {} : { error: 'HTTP_' + r.status, message: 'HTTP ' + r.status });
      }
      return Object.assign({ ok: true }, j);
    } catch (e) {
      return _err('NETWORK_FAIL', e && e.message || 'unknown');
    }
  }

  /* ── 명시적 에러 → 사용자 친화 메시지 매핑 ── */
  var ERROR_MESSAGES = {
    NO_SERVER:           '서버 자동 가져오기를 사용하려면 REMIX_API_BASE_URL 설정이 필요합니다.',
    NETWORK_FAIL:        '서버 자동 가져오기를 위한 서버에 연결하지 못했습니다. 주소와 CORS 설정을 확인하세요.',
    NO_TOKEN:            '먼저 Google OAuth 로그인을 완료하세요.',
    OAUTH_NOT_CONFIGURED:'서버에 OAuth 설정이 없습니다. (GOOGLE_CLIENT_ID/SECRET)',
    NO_PERMISSION:       '이 영상의 자막을 가져올 권한이 없습니다. 본인 영상이거나 자막 접근 권한이 있는 영상만 자동 가져오기가 가능합니다.',
    STT_NOT_CONFIGURED:  '음성 인식이 설정되지 않았습니다. 자막 파일을 직접 업로드할 수 있습니다.',
    KEYFRAME_FAIL:       '프레임 추출에 실패했습니다. 자막 기반으로 계속 진행할 수 있습니다.',
    INVALID_URL:         '유튜브 URL 에서 videoId 를 찾지 못했습니다.',
    NO_FILE:             '업로드할 파일이 필요합니다.',
    /* 공개 자막 보조 추출 — 실험 기능 */
    NO_PUBLIC_CAPTIONS:    '이 영상에서 공개 자막을 찾지 못했습니다. 자막/대본을 직접 붙여넣거나 SRT/TXT 파일을 업로드하세요.',
    CAPTION_TRACK_NOT_FOUND:'요청한 언어의 자막 트랙이 없습니다.',
    CAPTION_FETCH_BLOCKED:  '자막 트랙 접근이 차단되었습니다. 시간을 두고 다시 시도하거나 다른 fallback 을 사용하세요.',
    PARSE_FAILED:           '자막을 받았지만 파싱에 실패했습니다.',
    POLICY_RESTRICTED:      '재생 제한 영상이라 공개 자막을 추출할 수 없습니다.',
    VIDEO_NOT_FOUND:        '영상을 찾을 수 없습니다 (비공개·삭제·지역 제한 가능).',
  };
  function friendlyMessage(result) {
    if (!result || result.ok) return '';
    if (result.message) return result.message;
    return ERROR_MESSAGES[result.error] || ('알 수 없는 오류 (' + (result.error || 'UNKNOWN') + ')');
  }

  window.RM_SERVER = {
    /* config */
    getBaseUrl:   getBaseUrl,
    setBaseUrl:   setBaseUrl,
    clearBaseUrl: clearBaseUrl,
    getToken:     getToken,
    setToken:     setToken,
    clearToken:   clearToken,
    /* api */
    health:           health,
    youtubeMeta:      youtubeMeta,
    publicTranscript: publicTranscript,
    oauthStartUrl:    oauthStartUrl,
    listenForOAuthToken: listenForOAuthToken,
    captionsList:     captionsList,
    captionsDownload: captionsDownload,
    transcribe:       transcribe,
    keyframes:        keyframes,
    /* helpers */
    friendlyMessage:  friendlyMessage,
  };
})();
