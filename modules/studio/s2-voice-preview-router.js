/* ================================================
   modules/studio/s2-voice-preview-router.js
   STEP 3 음성 — 미리듣기 router

   * previewVoice(candidate, opts) — provider 별 명시적 routing
       - elevenlabs : previewUrl > TTS sample > "키 없음" 안내 (silent fallback 금지)
       - openai     : TTS sample (캐시) — voiceId 가 없으면 안내
       - browser    : SpeechSynthesis (lang/voiceId 매칭, 명시적 fallback)
   * 캐시 key:  provider + ':' + voiceId + ':' + lang + ':' + textHash
   * 각 후보별로 다른 voiceId/lang 이면 다른 cache 항목 → 모두 같은 음성 재생되는 문제 차단
   * 보안: API 키를 console / DOM 에 절대 노출 금지.
   ================================================ */
(function(){
  'use strict';

  var _CACHE = Object.create(null);     /* { key: blobUrl } */
  var _CURRENT_AUDIO = null;
  var _CURRENT_UTTER = null;

  var SAMPLE_TEXT = {
    ko: '안녕하세요. 이 목소리로 영상을 제작합니다.',
    ja: 'こんにちは。この声で動画を作成します。',
  };

  function _hashText(s) {
    s = String(s || '');
    var h = 0;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(36);
  }

  function _toast(msg, kind) {
    if (typeof window.ucShowToast === 'function') window.ucShowToast(msg, kind || 'info');
    else try { console.debug('[voice-preview]', msg); } catch(_) {}
  }

  function _stop() {
    try {
      if (_CURRENT_AUDIO) { _CURRENT_AUDIO.pause(); _CURRENT_AUDIO = null; }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      _CURRENT_UTTER = null;
    } catch(_) {}
  }
  window._v2PreviewStop = _stop;

  function _normLang(l) {
    if (typeof window._v2NormLang === 'function') return window._v2NormLang(l);
    var x = String(l || '').toLowerCase();
    if (x === 'ja' || x === 'jp') return 'ja';
    return 'ko';
  }

  function _cacheKey(provider, voiceId, lang, text) {
    return provider + ':' + (voiceId || 'no_voice') + ':' + lang + ':' + _hashText(text);
  }

  function _playUrl(url) {
    return new Promise(function(resolve, reject){
      try {
        var audio = new Audio(url);
        _CURRENT_AUDIO = audio;
        audio.onended = function(){ resolve(); };
        audio.onerror = function(e){ reject(e); };
        audio.play().catch(reject);
      } catch(e) { reject(e); }
    });
  }

  /* ── ElevenLabs key — 통합 store voice.elevenlabs (스크립트 그룹 사용 금지) ── */
  function _getElKey() {
    if (typeof window.getApiProvider === 'function') {
      var p = window.getApiProvider('voice', 'elevenlabs');
      if (p && p.apiKey && p.apiKey.length > 4) return p.apiKey;
    }
    if (typeof window.ucGetApiKey === 'function') {
      var k = window.ucGetApiKey('elevenlabs');
      if (k && k.length > 4) return k;
    }
    var lk = localStorage.getItem('uc_eleven_key') || '';
    return (lk && lk.length > 4) ? lk : '';
  }

  /* OpenAI key — voice.openai_tts → script.openai (공유 fallback) */
  function _getOaKey() {
    if (typeof window.getApiProvider === 'function') {
      var p = window.getApiProvider('voice', 'openai_tts');
      if (p && p.apiKey && p.apiKey.length > 4) return p.apiKey;
      var sc = window.getApiProvider('script', 'openai');
      if (sc && sc.apiKey && sc.apiKey.length > 4) return sc.apiKey;
    }
    if (typeof window.ucGetApiKey === 'function') {
      var k = window.ucGetApiKey('openai_tts') || window.ucGetApiKey('openai');
      if (k && k.length > 4) return k;
    }
    var lk = localStorage.getItem('uc_openai_key') || '';
    return (lk && lk.length > 4) ? lk : '';
  }

  /* ── ElevenLabs preview (provider TTS sample) ── */
  async function _previewElevenLabs(candidate, lang, text) {
    if (!candidate.voiceId) {
      _toast('⚠️ voiceId 가 없어 ElevenLabs 미리듣기를 할 수 없습니다.', 'warn');
      return;
    }
    /* 1) preview_url (V2_EL_VOICES 가 갖고 있을 수 있음) */
    if (candidate.previewUrl) {
      try { return await _playUrl(candidate.previewUrl); }
      catch(_) { /* preview_url 실패 → TTS sample */ }
    }
    var key = _getElKey();
    if (!key) {
      _toast('⚠️ ElevenLabs API 키가 없습니다. 통합 API 설정에서 등록해주세요.', 'warn');
      return;
    }
    var cKey = _cacheKey('elevenlabs', candidate.voiceId, lang, text);
    if (_CACHE[cKey]) return _playUrl(_CACHE[cKey]);
    try { console.debug('[voice-preview] cacheKey:', cKey); } catch(_) {}
    var url = 'https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(candidate.voiceId);
    var r = await fetch(url, {
      method:'POST',
      headers:{ 'xi-api-key': key, 'Content-Type':'application/json', 'Accept':'audio/mpeg' },
      body: JSON.stringify({
        text: text,
        model_id: candidate.model || 'eleven_multilingual_v2',
        voice_settings: { stability:0.5, similarity_boost:0.75 },
      }),
    });
    if (!r.ok) throw new Error('ElevenLabs preview HTTP ' + r.status);
    var blob = await r.blob();
    var blobUrl = URL.createObjectURL(blob);
    _CACHE[cKey] = blobUrl;
    return _playUrl(blobUrl);
  }

  /* ── OpenAI preview (TTS sample) ── */
  async function _previewOpenAI(candidate, lang, text) {
    if (!candidate.voiceId) {
      _toast('⚠️ voiceId 가 없어 OpenAI 미리듣기를 할 수 없습니다.', 'warn');
      return;
    }
    var key = _getOaKey();
    if (!key) {
      _toast('⚠️ OpenAI API 키가 없습니다. 통합 API 설정에서 등록해주세요.', 'warn');
      return;
    }
    var cKey = _cacheKey('openai', candidate.voiceId, lang, text);
    if (_CACHE[cKey]) return _playUrl(_CACHE[cKey]);
    try { console.debug('[voice-preview] cacheKey:', cKey); } catch(_) {}
    var r = await fetch('https://api.openai.com/v1/audio/speech', {
      method:'POST',
      headers:{ 'Authorization':'Bearer '+key, 'Content-Type':'application/json' },
      body: JSON.stringify({ model: candidate.model || 'tts-1', input:text, voice:candidate.voiceId }),
    });
    if (!r.ok) throw new Error('OpenAI preview HTTP ' + r.status);
    var blob = await r.blob();
    var blobUrl = URL.createObjectURL(blob);
    _CACHE[cKey] = blobUrl;
    return _playUrl(blobUrl);
  }

  /* ── Browser fallback — voiceId 가 ko-KR-male/female / ja-JP-male/female 에 매칭 ── */
  function _previewBrowser(candidate, lang, text) {
    if (typeof window.speechSynthesis === 'undefined' ||
        typeof window.SpeechSynthesisUtterance === 'undefined') {
      _toast('⚠️ 브라우저가 SpeechSynthesis 를 지원하지 않습니다.', 'warn');
      return;
    }
    var u = new SpeechSynthesisUtterance(text);
    u.lang  = (lang === 'ja') ? 'ja-JP' : 'ko-KR';
    u.rate  = 1.0; u.pitch = 1.0; u.volume = 1.0;
    /* 톤 매칭 시도 — voices() 중 lang prefix + 이름에 male/female/man/woman/南 매칭 */
    var voices = window.speechSynthesis.getVoices() || [];
    var langPrefix = u.lang.slice(0,2).toLowerCase();
    var wantMale = /male|man|남|男/i;
    var wantFemale = /female|woman|여|女/i;
    var prefer = candidate.voiceToneGender;
    var matchByName = voices.filter(function(v){
      if (!v.lang || v.lang.slice(0,2).toLowerCase() !== langPrefix) return false;
      if (prefer === 'male_tone' && wantMale.test(v.name)) return true;
      if (prefer === 'female_tone' && wantFemale.test(v.name)) return true;
      return false;
    });
    var matchByLang = voices.filter(function(v){
      return v.lang && v.lang.slice(0,2).toLowerCase() === langPrefix;
    });
    var pick = matchByName[0] || matchByLang[0];
    if (pick) u.voice = pick;
    _CURRENT_UTTER = u;
    window.speechSynthesis.speak(u);
    _toast('🔊 브라우저 대체 음성으로 재생합니다.', 'info');
  }

  /* ════════════════════════════════════════════════
     메인 — previewVoice(candidate, opts)
     opts: { lang, text }
     ════════════════════════════════════════════════ */
  window.previewVoice = async function(candidate, opts) {
    if (!candidate) return;
    _stop();
    opts = opts || {};
    var lang = _normLang(opts.lang || (candidate.languageSupport && candidate.languageSupport[0]) || 'ko');
    if (lang === 'multi' || lang === 'unknown') lang = 'ko';
    var text = opts.text || SAMPLE_TEXT[lang] || SAMPLE_TEXT.ko;

    /* provider 정규화 — s2-voice-step 에서는 이미 풀네임이지만, manual picker /
       api-status 등 다른 호출 경로가 'EL'/'OA'/'NJ'/'SS' 같은 단축 코드를 보낼
       수 있어 여기서 한 번 더 매핑한다. */
    var rawProv = String(candidate.provider || '').toLowerCase();
    var PROVIDER_ALIAS = { el:'elevenlabs', oa:'openai', nj:'browser', ss:'browser', openai_tts:'openai' };
    var prov = PROVIDER_ALIAS[rawProv] || rawProv;
    try {
      console.debug('[voice-preview] provider:', prov);
      console.debug('[voice-preview] voiceId exists:', !!candidate.voiceId);
      console.debug('[voice-preview] strategy:', candidate.previewStrategy || '-');
    } catch(_) {}

    try {
      if (prov === 'elevenlabs')   await _previewElevenLabs(candidate, lang, text);
      else if (prov === 'openai')  await _previewOpenAI(candidate, lang, text);
      else if (prov === 'browser') _previewBrowser(candidate, lang, text);
      else {
        _toast('⚠️ 알 수 없는 provider: ' + prov, 'warn');
      }
    } catch (e) {
      try { console.debug('[voice-preview] error:', e && e.message || e); } catch(_) {}
      _toast('❌ 미리듣기 실패: ' + (e && e.message || e), 'error');
    }
  };

  /* 페이지 떠날 때 정지 */
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', _stop);
  }
})();
