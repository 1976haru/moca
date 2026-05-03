/* ================================================
   shared/api-settings-store.js
   통합 API 키 저장소 + legacy 마이그레이션
   * localStorage key: moca_api_settings_v1
   * 구조: { script: { openai: { apiKey, baseUrl, model, enabled } }, ... }
   * 7 그룹: script / image / stock / voice / video / music / upload
   * uc_*_key (legacy) 는 1회 자동 마이그레이션 — 원본은 보존
   * 보안: console 에 API 키 값 출력 금지
   ================================================ */
(function(){
  'use strict';

  const STORE_KEY = 'moca_api_settings_v1';

  /* ── group/provider → legacy uc_*_key 매핑 (마이그레이션용) ── */
  const LEGACY_MAP = {
    script: {
      openai:     'uc_openai_key',
      claude:     'uc_claude_key',
      gemini:     'uc_gemini_key',
      perplexity: 'uc_perplexity_key',
    },
    image: {
      dalle3:       'uc_openai_key',  /* OpenAI 키 공유 */
      openai_img:   'uc_openai_key',
      flux:         'uc_flux_key',
      sd:           'uc_sd_key',
      gemini_imagen:'uc_gemini_key',  /* Gemini 키 공유 */
      minimax:      'uc_minimax_key',
      ideogram:     'uc_ideogram_key',
    },
    stock: {
      pexels:   'uc_pexels_key',
      pixabay:  'uc_pixabay_key',
      unsplash: 'uc_unsplash_key',
    },
    voice: {
      elevenlabs: 'uc_eleven_key',
      openai_tts: 'uc_openai_key',
      google_tts: 'uc_google_key',
      azure_tts:  'uc_azure_key',
      nijivoice:  'uc_nijivoice_key',
      clova:      'uc_clova_key',
    },
    video: {
      shotstack:    'uc_shotstack_key',
      creatomate:   'uc_creatomate_key',
      heygen:       'uc_heygen_key',
      runway:       'uc_runway_key',
      pika:         'uc_pika_key',
      luma:         'uc_luma_key',
      minimax_video:'uc_minimax_key',
      magiclight:   'uc_magiclight_key',
    },
    music: {
      suno: 'uc_suno_key',
      udio: 'uc_udio_key',
    },
    upload: {
      youtube:        'uc_youtube_key',
      youtubeDataApi: 'uc_youtube_key',  /* 별칭 — youtube 와 동일 키 공유 (메타데이터 조회용) */
      tiktok:         'uc_tiktok_key',
      instagram:      'uc_instagram_key',
      facebook:       'uc_facebook_key',
      naver_blog:     'uc_naver_key',
      threads:        'uc_threads_key',
    },
  };
  window.MOCA_API_LEGACY_MAP = LEGACY_MAP;

  /* ════════════════════════════════════════════════
     1) load / save
     ════════════════════════════════════════════════ */
  function loadApiSettings() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return {};
      var v = JSON.parse(raw);
      return (v && typeof v === 'object') ? v : {};
    } catch(_) { return {}; }
  }
  function saveApiSettings(settings) {
    if (!settings || typeof settings !== 'object') return false;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(settings));
      return true;
    } catch(_) { return false; }
  }
  window.loadApiSettings = loadApiSettings;
  window.saveApiSettings = saveApiSettings;

  /* ════════════════════════════════════════════════
     2) provider 단위 read/write
     ════════════════════════════════════════════════ */
  function getApiProvider(group, provider) {
    var s = loadApiSettings();
    return (s[group] && s[group][provider]) ? Object.assign({}, s[group][provider]) : null;
  }
  function setApiProvider(group, provider, data) {
    if (!group || !provider) return false;
    var s = loadApiSettings();
    s[group] = s[group] || {};
    var cur = s[group][provider] || {};
    s[group][provider] = Object.assign({}, cur, data || {});
    /* enabled 가 명시 안 되어 있으면 키가 들어오면 true */
    if (s[group][provider].enabled == null) {
      s[group][provider].enabled = !!s[group][provider].apiKey;
    }
    return saveApiSettings(s);
  }
  function deleteApiProvider(group, provider) {
    var s = loadApiSettings();
    if (s[group] && s[group][provider]) {
      delete s[group][provider];
      return saveApiSettings(s);
    }
    return true;
  }
  function hasApiKey(group, provider) {
    var p = getApiProvider(group, provider);
    if (p && p.apiKey && String(p.apiKey).length > 4) return true;
    /* legacy fallback */
    var lk = LEGACY_MAP[group] && LEGACY_MAP[group][provider];
    if (lk) {
      try {
        var v = localStorage.getItem(lk);
        return !!(v && v.length > 4);
      } catch(_) { return false; }
    }
    return false;
  }
  window.getApiProvider    = getApiProvider;
  window.setApiProvider    = setApiProvider;
  window.deleteApiProvider = deleteApiProvider;
  window.hasApiKey         = hasApiKey;

  /* legacy 키만 빠르게 조회 (read-only) */
  function getApiKey(group, provider) {
    var p = getApiProvider(group, provider);
    if (p && p.apiKey) return p.apiKey;
    var lk = LEGACY_MAP[group] && LEGACY_MAP[group][provider];
    if (lk) {
      try { return localStorage.getItem(lk) || ''; } catch(_) { return ''; }
    }
    return '';
  }
  window.mocaGetApiKey = getApiKey;

  /* ════════════════════════════════════════════════
     3) legacy 마이그레이션 — 1회만 (원본 보존)
     ════════════════════════════════════════════════ */
  function migrateLegacyApiKeys() {
    var s = loadApiSettings();
    var migrated = 0;
    Object.keys(LEGACY_MAP).forEach(function(group){
      Object.keys(LEGACY_MAP[group]).forEach(function(provider){
        var lk = LEGACY_MAP[group][provider];
        if (!lk) return;
        var v = '';
        try { v = localStorage.getItem(lk) || ''; } catch(_) {}
        if (!v || v.length < 4) return;
        s[group] = s[group] || {};
        var cur = s[group][provider] || {};
        if (!cur.apiKey) {
          cur.apiKey  = v;
          cur.enabled = true;
          cur.migratedFromLegacy = lk;
          s[group][provider] = cur;
          migrated++;
        }
      });
    });
    if (migrated > 0) saveApiSettings(s);
    return migrated;
  }
  window.migrateLegacyApiKeys = migrateLegacyApiKeys;

  /* ════════════════════════════════════════════════
     4) 모달 열기 (탭 인자 전달)
     ════════════════════════════════════════════════ */
  window.openApiSettingsModal = function(group) {
    if (group) window._mocaApiActiveTab = group;
    if (typeof window.renderApiSettings === 'function') {
      var ex = document.getElementById('api-settings-overlay');
      if (ex) ex.remove();
      window.renderApiSettings();
    }
  };

  /* ════════════════════════════════════════════════
     5) 자동 마이그레이션 — 페이지 로드 시 1회
     ════════════════════════════════════════════════ */
  function _autoMigrate() {
    try {
      var n = migrateLegacyApiKeys();
      if (n > 0) {
        /* 보안: 키 값은 절대 출력하지 않음. 개수만 흔적 남김 */
        try { sessionStorage.setItem('moca_api_migration_done', String(Date.now())); } catch(_) {}
      }
    } catch(_) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _autoMigrate);
  else _autoMigrate();
})();
