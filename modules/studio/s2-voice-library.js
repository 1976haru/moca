/* ================================================
   modules/studio/s2-voice-library.js
   Step 3 음성 — 사용자가 만든 음성/프리셋 라이브러리

   * localStorage 'moca_voice_lab_v1'
     {
       savedElevenlabs: [ { provider:'elevenlabs', voiceId, voiceName, voiceDescription, source:'voice_design', createdAt, ... } ],
       openaiPresets:   [ { provider:'openai', voiceId(base), instructions, voiceName, source:'instructions_preset', createdAt, ... } ],
       lastEdit:        { ... }   // in-progress draft
     }
   * 통합 후보 카탈로그 (V2_VOICE_CATALOG) 와 동일 schema 로 변환:
     vlbAsCandidates() — 수동 picker / 자동 추천 카드에 그대로 노출 가능
   ================================================ */
(function(){
  'use strict';

  var KEY = 'moca_voice_lab_v1';

  function _load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return { savedElevenlabs:[], openaiPresets:[], lastEdit:null };
      var v = JSON.parse(raw);
      if (!v || typeof v !== 'object') return { savedElevenlabs:[], openaiPresets:[], lastEdit:null };
      v.savedElevenlabs = Array.isArray(v.savedElevenlabs) ? v.savedElevenlabs : [];
      v.openaiPresets   = Array.isArray(v.openaiPresets)   ? v.openaiPresets   : [];
      return v;
    } catch(_) { return { savedElevenlabs:[], openaiPresets:[], lastEdit:null }; }
  }
  function _save(v) {
    try { localStorage.setItem(KEY, JSON.stringify(v || {})); return true; } catch(_) { return false; }
  }

  function vlbGet() { return _load(); }

  function vlbAddElevenlabsVoice(voice) {
    if (!voice || !voice.voiceId) return false;
    var lib = _load();
    /* 중복 voiceId 제거 */
    lib.savedElevenlabs = lib.savedElevenlabs.filter(function(v){ return v.voiceId !== voice.voiceId; });
    lib.savedElevenlabs.unshift(Object.assign({}, voice, {
      provider:'elevenlabs', source:'voice_design', createdAt: voice.createdAt || new Date().toISOString(),
    }));
    return _save(lib);
  }
  function vlbAddOpenAiPreset(preset) {
    if (!preset || !preset.voiceId) return false;
    var lib = _load();
    var key = preset.voiceId + '::' + (preset.instructions || '').slice(0, 80);
    lib.openaiPresets = lib.openaiPresets.filter(function(v){
      return (v.voiceId + '::' + (v.instructions || '').slice(0, 80)) !== key;
    });
    lib.openaiPresets.unshift(Object.assign({}, preset, {
      provider:'openai', source:'instructions_preset', createdAt: preset.createdAt || new Date().toISOString(),
    }));
    return _save(lib);
  }
  function vlbRemove(provider, id) {
    var lib = _load();
    if (provider === 'elevenlabs') {
      lib.savedElevenlabs = lib.savedElevenlabs.filter(function(v){ return v.voiceId !== id; });
    } else if (provider === 'openai') {
      lib.openaiPresets = lib.openaiPresets.filter(function(v){
        return (v.voiceId + '::' + (v.instructions||'').slice(0, 80)) !== id;
      });
    }
    return _save(lib);
  }
  function vlbSaveDraft(draft) {
    var lib = _load();
    lib.lastEdit = draft || null;
    _save(lib);
  }
  function vlbGetDraft() { return _load().lastEdit; }

  /* ── 카탈로그 candidate schema 로 변환 ── */
  function vlbAsCandidates() {
    var lib = _load();
    var list = [];
    lib.savedElevenlabs.forEach(function(v){
      list.push({
        id:               'lab_el_' + v.voiceId,
        displayName:      v.voiceName || ('내 EL 음성 ' + v.voiceId.slice(0,6)),
        provider:         'elevenlabs',
        voiceId:          v.voiceId,
        model:            'eleven_multilingual_v2',
        voiceToneGender:  v.voiceToneGender || 'unknown',
        ageTone:          v.ageTone || 'unknown',
        languageSupport:  ['multi'],
        styleTags:        (v.styleTags && v.styleTags.length) ? v.styleTags : ['custom','voice_design'],
        previewStrategy:  'provider_tts_sample',
        previewUrl:       '',
        isVerified:       true,
        source:           'voice_design',
        voiceDescription: v.voiceDescription || '',
        _libRecord:       v,
      });
    });
    lib.openaiPresets.forEach(function(p){
      list.push({
        id:               'lab_oa_' + p.voiceId + '_' + (p.createdAt || '').slice(0,16),
        displayName:      p.voiceName || ('내 OA 프리셋 (' + p.voiceId + ')'),
        provider:         'openai',
        voiceId:          p.voiceId,
        model:            p.model || 'gpt-4o-mini-tts',
        voiceToneGender:  p.voiceToneGender || 'unknown',
        ageTone:          p.ageTone || 'unknown',
        languageSupport:  ['multi'],
        styleTags:        (p.styleTags && p.styleTags.length) ? p.styleTags : ['custom','instructions_preset'],
        previewStrategy:  'provider_tts_sample',
        previewUrl:       '',
        isVerified:       true,
        source:           'instructions_preset',
        instructions:     p.instructions || '',
        _libRecord:       p,
      });
    });
    return list;
  }

  /* 전역 노출 */
  window.vlbGet                 = vlbGet;
  window.vlbAddElevenlabsVoice  = vlbAddElevenlabsVoice;
  window.vlbAddOpenAiPreset     = vlbAddOpenAiPreset;
  window.vlbRemove              = vlbRemove;
  window.vlbSaveDraft           = vlbSaveDraft;
  window.vlbGetDraft            = vlbGetDraft;
  window.vlbAsCandidates        = vlbAsCandidates;
})();
