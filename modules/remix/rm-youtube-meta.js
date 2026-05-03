/* ================================================
   modules/remix/rm-youtube-meta.js
   영상 리믹스 스튜디오 — YouTube Data API v3 메타데이터 조회

   * 통합 API 설정의 YouTube Data API v3 키로 videos.list 호출
   * 키 우선순위:
       1) moca_api_settings_v1.upload.youtubeDataApi.apiKey  (사양 명시 위치)
       2) moca_api_settings_v1.upload.youtube.apiKey         (기존 구조 호환)
       3) uc_youtube_key (legacy)
   * 응답: { ok, videoId, title, description, channelTitle, duration, durationSec, thumbnailUrl }
   * 실패 시 명시적 에러 코드:
       NO_KEY · INVALID_URL · NOT_FOUND · QUOTA · API_ERROR · NETWORK_FAIL

   captions.list / captions.download 는 API 키만으로 동작하지 않습니다.
   본 모듈은 OAuth 가 필요한 자막 흐름을 호출하지 않으며,
   안내용 stub 함수만 노출합니다 (실제 OAuth 호출은 RM_SERVER 가 담당).
   ================================================ */
(function(){
  'use strict';

  var STORE_KEY  = 'moca_api_settings_v1';
  var LEGACY_KEY = 'uc_youtube_key';
  var META_ENDPOINT = 'https://www.googleapis.com/youtube/v3/videos';

  /* ── 키 조회 ── */
  function _readStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return {};
      var v = JSON.parse(raw);
      return (v && typeof v === 'object') ? v : {};
    } catch(_) { return {}; }
  }
  function getApiKey() {
    var s = _readStore();
    var up = s.upload || {};
    if (up.youtubeDataApi && up.youtubeDataApi.apiKey) return String(up.youtubeDataApi.apiKey);
    if (up.youtube        && up.youtube.apiKey)        return String(up.youtube.apiKey);
    try {
      var legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy && legacy.length > 4) return legacy;
    } catch(_) {}
    return '';
  }
  function hasApiKey() {
    var k = getApiKey();
    return !!(k && k.length > 4);
  }

  /* ── videoId 추출 (다른 모듈과 공유) ── */
  function extractVideoId(url) {
    if (window.RM_SOURCE && typeof window.RM_SOURCE.extractVideoId === 'function') {
      return window.RM_SOURCE.extractVideoId(url);
    }
    var s = String(url || '').trim();
    var m;
    m = s.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);          if (m) return m[1];
    m = s.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/);if (m) return m[1];
    m = s.match(/[?&]v=([A-Za-z0-9_-]{6,})/);                if (m) return m[1];
    m = s.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/); if (m) return m[1];
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
    return '';
  }

  /* ── ISO 8601 duration → 초 + "M:SS" 표기 ── */
  function _parseIsoDuration(iso) {
    var m = String(iso || '').match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (!m) return { sec: 0, label: '' };
    var d = parseInt(m[1] || '0', 10);
    var h = parseInt(m[2] || '0', 10);
    var min = parseInt(m[3] || '0', 10);
    var s = parseInt(m[4] || '0', 10);
    var sec = d * 86400 + h * 3600 + min * 60 + s;
    var label;
    if (h > 0) {
      label = h + ':' + (min < 10 ? '0' + min : min) + ':' + (s < 10 ? '0' + s : s);
    } else {
      label = min + ':' + (s < 10 ? '0' + s : s);
    }
    return { sec: sec, label: label };
  }

  /* ── 썸네일 best-effort 선택 (high → medium → default) ── */
  function _pickThumb(thumbs) {
    if (!thumbs || typeof thumbs !== 'object') return '';
    var t = thumbs.maxres || thumbs.standard || thumbs.high || thumbs.medium || thumbs.default;
    return (t && t.url) ? t.url : '';
  }

  function _ok(obj)  { return Object.assign({ ok: true }, obj || {}); }
  function _err(code, message, extra) {
    return Object.assign({ ok: false, error: code, message: message }, extra || {});
  }

  /* ── 🔑 메인: getYouTubeVideoMeta(url) ──
       * url 또는 videoId 모두 허용
       * 본 함수는 키 원문을 콘솔/에러에 출력하지 않음 (보안) */
  async function getYouTubeVideoMeta(url) {
    var videoId = extractVideoId(url);
    if (!videoId) return _err('INVALID_URL', '유튜브 URL 에서 videoId 를 찾지 못했습니다.');

    var key = getApiKey();
    if (!key) return _err('NO_KEY',
      'YouTube Data API v3 키가 설정되지 않았습니다. ' +
      '설정 → API 통합 설정 → 업로드·배포 → YouTube Data API v3 에서 키를 입력하세요.');

    var ep = META_ENDPOINT +
      '?part=snippet,contentDetails' +
      '&id=' + encodeURIComponent(videoId) +
      '&key=' + encodeURIComponent(key);

    var r;
    try {
      r = await fetch(ep, { method: 'GET' });
    } catch (e) {
      return _err('NETWORK_FAIL',
        'YouTube Data API 호출에 실패했습니다 (' + (e && e.message || 'unknown') + '). ' +
        '네트워크/CORS 상태를 확인하세요.');
    }

    var j = null;
    try { j = await r.json(); } catch(_) { j = null; }

    if (!r.ok) {
      var apiErr = j && j.error || {};
      var reason = (apiErr.errors && apiErr.errors[0] && apiErr.errors[0].reason) || '';
      var msg    = apiErr.message || ('HTTP ' + r.status);
      if (r.status === 403 && /quota/i.test(reason + ' ' + msg)) {
        return _err('QUOTA', '일일 할당량을 초과했습니다. 내일 자동 리셋되거나 콘솔에서 할당량 증가를 신청하세요.', { httpStatus: r.status, reason: reason });
      }
      return _err('API_ERROR', msg, { httpStatus: r.status, reason: reason });
    }

    var items = (j && j.items) || [];
    if (!items.length) {
      return _err('NOT_FOUND',
        '영상을 찾을 수 없습니다 (videoId: ' + videoId + '). 비공개·삭제·지역 제한 영상일 수 있습니다.');
    }

    var it = items[0];
    var snip = it.snippet || {};
    var det  = it.contentDetails || {};
    var dur  = _parseIsoDuration(det.duration || '');

    return _ok({
      videoId:      videoId,
      title:        snip.title || '',
      description:  snip.description || '',
      channelTitle: snip.channelTitle || '',
      publishedAt:  snip.publishedAt || '',
      thumbnailUrl: _pickThumb(snip.thumbnails) ||
                    'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg',
      duration:     dur.label,
      durationSec:  dur.sec,
      durationIso:  det.duration || '',
    });
  }

  /* ════════════════════════════════════════════════
     OAuth 영역 — 본 모듈은 호출하지 않음 (안내용 stub)
     실제 흐름은 modules/remix/rm-server-client.js 의
     RM_SERVER.oauthStartUrl / captionsList / captionsDownload 사용.
     ════════════════════════════════════════════════ */
  function _oauthHint() {
    return 'API 키만으로는 자막 다운로드가 불가합니다. ' +
           '자체 서버에 GOOGLE_CLIENT_ID/SECRET 을 설정하고 ' +
           '서버 자동 가져오기 모드의 "🔐 Google 로그인" 을 사용하세요.';
  }
  function startYouTubeOAuth() {
    if (window.RM_SERVER && typeof window.RM_SERVER.oauthStartUrl === 'function') {
      var u = window.RM_SERVER.oauthStartUrl();
      if (u) return _ok({ startUrl: u });
    }
    return _err('OAUTH_NOT_CONFIGURED',
      '서버 OAuth 가 설정되지 않았습니다. ' + _oauthHint());
  }
  async function listYouTubeCaptions(videoId) {
    if (!window.RM_SERVER || typeof window.RM_SERVER.captionsList !== 'function') {
      return _err('OAUTH_NOT_CONFIGURED', _oauthHint());
    }
    if (!window.RM_SERVER.getToken || !window.RM_SERVER.getToken()) {
      return _err('NO_TOKEN', '먼저 OAuth 로그인을 완료하세요. ' + _oauthHint());
    }
    return await window.RM_SERVER.captionsList(videoId);
  }
  async function downloadYouTubeCaption(captionId, format) {
    if (!window.RM_SERVER || typeof window.RM_SERVER.captionsDownload !== 'function') {
      return _err('OAUTH_NOT_CONFIGURED', _oauthHint());
    }
    if (!window.RM_SERVER.getToken || !window.RM_SERVER.getToken()) {
      return _err('NO_TOKEN', '먼저 OAuth 로그인을 완료하세요. ' + _oauthHint());
    }
    return await window.RM_SERVER.captionsDownload(captionId, format || 'srt');
  }

  /* ── 사용자 친화 메시지 ── */
  var ERROR_MESSAGES = {
    NO_KEY:               'YouTube Data API v3 키 미설정. 설정에서 입력해 주세요.',
    INVALID_URL:          '유튜브 URL 에서 videoId 를 추출할 수 없습니다.',
    NOT_FOUND:            '영상을 찾을 수 없습니다 (비공개/삭제/지역 제한 가능).',
    QUOTA:                '일일 할당량을 초과했습니다. 내일 또는 콘솔에서 할당량 증액 후 재시도하세요.',
    API_ERROR:            'YouTube Data API 호출이 실패했습니다.',
    NETWORK_FAIL:         '네트워크 오류로 YouTube Data API 에 연결할 수 없습니다.',
    OAUTH_NOT_CONFIGURED: 'OAuth 가 설정되지 않았습니다. 서버 자동 가져오기에서 Google 로그인을 진행하세요.',
    NO_TOKEN:             'OAuth 토큰이 없습니다. Google 로그인을 먼저 완료하세요.',
  };
  function friendlyMessage(result) {
    if (!result || result.ok) return '';
    if (result.message) return result.message;
    return ERROR_MESSAGES[result.error] || ('알 수 없는 오류 (' + (result.error || 'UNKNOWN') + ')');
  }

  window.RM_YT_META = {
    /* config */
    getApiKey:           getApiKey,        /* ⚠️ 키 원문 반환 — UI 노출 금지, fetch 헤더에서만 사용 */
    hasApiKey:           hasApiKey,
    extractVideoId:      extractVideoId,
    /* meta */
    getYouTubeVideoMeta: getYouTubeVideoMeta,
    /* oauth (stub — 실제 흐름은 RM_SERVER) */
    startYouTubeOAuth:   startYouTubeOAuth,
    listYouTubeCaptions: listYouTubeCaptions,
    downloadYouTubeCaption: downloadYouTubeCaption,
    /* helpers */
    friendlyMessage:     friendlyMessage,
  };
})();
