/* ================================================
   modules/studio/s2-voice-instructions-openai.js
   OpenAI TTS instructions 어댑터

   * voInsPreview(baseVoiceId, instructions, sampleText) — 미리듣기
       gpt-4o-mini-tts 가 instructions 를 지원 (있으면 사용)
       지원 안 되는 모델은 instructions 무시 + 안내
   * voInsListBaseVoices() — alloy/echo/fable/onyx/nova/shimmer
   ================================================ */
(function(){
  'use strict';

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

  /* base voice (앱 카탈로그와 동기화) */
  function voInsListBaseVoices() {
    return (window.OPENAI_TTS_VOICES || []).map(function(v){
      return {
        voiceId: v.voiceId, displayName: v.displayName,
        voiceToneGender: v.voiceToneGender, ageTone: v.ageTone,
        styleTags: v.styleTags || [],
      };
    });
  }
  window.voInsListBaseVoices = voInsListBaseVoices;

  /* preview / TTS 호출 — instructions 지원 모델 우선 */
  async function voInsCallTts(baseVoiceId, instructions, text, opts) {
    opts = opts || {};
    var key = _getOaKey();
    if (!key) throw new Error('OpenAI 키 없음 — 통합 API 설정에서 등록해주세요.');
    if (!baseVoiceId) throw new Error('base voice 가 선택되지 않았습니다.');
    if (!text) text = '안녕하세요.';

    var hasInstr = !!(instructions && String(instructions).trim());
    var model = hasInstr ? (opts.model || 'gpt-4o-mini-tts') : (opts.model || 'tts-1');
    var body = { model: model, input: text, voice: baseVoiceId };
    if (hasInstr) body.instructions = String(instructions).trim();
    if (opts.speed) body.speed = parseFloat(opts.speed);

    try {
      console.debug('[voice-lab] provider:', 'openai');
      console.debug('[voice-lab] source:', 'instructions_preset');
      console.debug('[voice-lab] model:', model, 'voice:', baseVoiceId, 'hasInstr:', hasInstr);
    } catch(_) {}

    var r = await fetch('https://api.openai.com/v1/audio/speech', {
      method:'POST',
      headers:{ 'Authorization':'Bearer '+key, 'Content-Type':'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      /* gpt-4o-mini-tts 미지원 키/계정이면 tts-1 로 fallback */
      if (hasInstr && r.status === 404) {
        try { console.debug('[voice-lab] instructions model unavailable — fallback tts-1'); } catch(_) {}
        var b2 = { model: 'tts-1', input: text, voice: baseVoiceId };
        var r2 = await fetch('https://api.openai.com/v1/audio/speech', {
          method:'POST',
          headers:{ 'Authorization':'Bearer '+key, 'Content-Type':'application/json' },
          body: JSON.stringify(b2),
        });
        if (!r2.ok) throw new Error('OpenAI TTS HTTP ' + r2.status);
        var blob2 = await r2.blob();
        return { url: URL.createObjectURL(blob2), instructionsApplied: false };
      }
      throw new Error('OpenAI TTS HTTP ' + r.status);
    }
    var blob = await r.blob();
    return { url: URL.createObjectURL(blob), instructionsApplied: hasInstr };
  }
  window.voInsCallTts = voInsCallTts;

  /* preview 캐시 (provider+voiceId+instructions+textHash) — 자체 cache */
  var _PREV_CACHE = Object.create(null);
  function _hash(s) {
    s = String(s || ''); var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h<<5)-h+s.charCodeAt(i))|0;
    return Math.abs(h).toString(36);
  }
  async function voInsPreview(baseVoiceId, instructions, text) {
    var key = 'oaIns:' + baseVoiceId + ':' + _hash(instructions) + ':' + _hash(text);
    if (_PREV_CACHE[key]) {
      try {
        var audio = new Audio(_PREV_CACHE[key].url);
        audio.play().catch(function(){});
        return _PREV_CACHE[key];
      } catch(_) {}
    }
    var res = await voInsCallTts(baseVoiceId, instructions, text);
    _PREV_CACHE[key] = res;
    try {
      var audio2 = new Audio(res.url);
      audio2.play().catch(function(){});
    } catch(_) {}
    return res;
  }
  window.voInsPreview = voInsPreview;
})();
