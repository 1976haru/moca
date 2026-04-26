/* ================================================
   modules/studio/s2-voice-data.js
   STEP 3 음성 카탈로그 v2 — 톤 기반 메타데이터 + previewStrategy

   * 후보 객체 schema (단정형 표현 금지 — 청감 톤으로 표시):
     {
       id, displayName,
       provider: 'elevenlabs' | 'openai' | 'browser',
       voiceId,
       model:                 // 선택: 'eleven_multilingual_v2' / 'tts-1'
       voiceToneGender:       // 'male_tone' | 'female_tone' | 'neutral_tone' | 'unknown'
       ageTone:               // 'young' | 'adult' | 'mature' | 'senior' | 'unknown'
       languageSupport:       // ['ko','ja','multi','unknown']
       styleTags:             // ['calm','warm','bright','documentary','news','emotional','comic','senior_friendly','narration','energetic']
       previewStrategy:       // 'provider_preview_url' | 'provider_tts_sample' | 'browser_fallback'
       previewUrl:            // 미리듣기 URL (있으면)
       isVerified:            // provider API 또는 검증된 registry 면 true
       source:                // 'provider_api' | 'registry' | 'manual' | 'fallback'
     }
   * ElevenLabs voiceId 는 공개 catalog 의 검증된 ID 만 등록.
     metadata 가 단정 어려우면 voiceToneGender:'unknown' / ageTone:'unknown' 으로 표시.
   ================================================ */
(function(){
  'use strict';

  /* ── ElevenLabs (공식 voice 라이브러리에서 검증된 ID — provider API 응답으로 추후 보강) ── */
  var EL = function(id, voiceId, name, gender, age, tags) {
    return {
      id:               'el_' + id,
      displayName:      name,
      provider:         'elevenlabs',
      voiceId:          voiceId,
      model:            'eleven_multilingual_v2',
      voiceToneGender:  gender,    /* male_tone / female_tone / unknown */
      ageTone:          age,       /* young / adult / mature / senior / unknown */
      languageSupport:  ['multi'], /* multilingual_v2 — ko/ja 둘 다 가능 */
      styleTags:        tags || [],
      previewStrategy:  'provider_tts_sample', /* preview_url 이 있으면 router 가 우선 사용 */
      previewUrl:       '',
      isVerified:       true,
      source:           'registry',
    };
  };

  /* ── OpenAI TTS preset registry (공식 6 voices) ── */
  var OPENAI_TTS_VOICES = [
    {
      id:'oa_alloy', displayName:'Alloy', provider:'openai', voiceId:'alloy', model:'tts-1',
      voiceToneGender:'neutral_tone', ageTone:'adult', languageSupport:['multi'],
      styleTags:['balanced','clear'], previewStrategy:'provider_tts_sample',
      previewUrl:'', isVerified:true, source:'registry',
    },
    {
      id:'oa_echo', displayName:'Echo', provider:'openai', voiceId:'echo', model:'tts-1',
      voiceToneGender:'male_tone', ageTone:'adult', languageSupport:['multi'],
      styleTags:['clear','narration'], previewStrategy:'provider_tts_sample',
      previewUrl:'', isVerified:true, source:'registry',
    },
    {
      id:'oa_fable', displayName:'Fable', provider:'openai', voiceId:'fable', model:'tts-1',
      voiceToneGender:'male_tone', ageTone:'adult', languageSupport:['multi'],
      styleTags:['narration','documentary','warm'], previewStrategy:'provider_tts_sample',
      previewUrl:'', isVerified:true, source:'registry',
    },
    {
      id:'oa_onyx', displayName:'Onyx', provider:'openai', voiceId:'onyx', model:'tts-1',
      voiceToneGender:'male_tone', ageTone:'mature', languageSupport:['multi'],
      styleTags:['calm','deep'], previewStrategy:'provider_tts_sample',
      previewUrl:'', isVerified:true, source:'registry',
    },
    {
      id:'oa_nova', displayName:'Nova', provider:'openai', voiceId:'nova', model:'tts-1',
      voiceToneGender:'female_tone', ageTone:'young', languageSupport:['multi'],
      styleTags:['bright','friendly'], previewStrategy:'provider_tts_sample',
      previewUrl:'', isVerified:true, source:'registry',
    },
    {
      id:'oa_shimmer', displayName:'Shimmer', provider:'openai', voiceId:'shimmer', model:'tts-1',
      voiceToneGender:'female_tone', ageTone:'adult', languageSupport:['multi'],
      styleTags:['soft','warm'], previewStrategy:'provider_tts_sample',
      previewUrl:'', isVerified:true, source:'registry',
    },
  ];
  window.OPENAI_TTS_VOICES = OPENAI_TTS_VOICES;

  /* ── Browser SpeechSynthesis fallback (모든 후보가 같은 음성으로 떨어지지 않게
        ko/ja × 톤별로 명시적으로 등록 — router 가 lang 별 system voice 매칭) ── */
  var BROWSER_VOICES = [
    { id:'sys_ko_f', displayName:'한국어 시스템 (여성톤)', provider:'browser', voiceId:'ko-KR-female',
      voiceToneGender:'female_tone', ageTone:'unknown', languageSupport:['ko'],
      styleTags:['system','fallback'], previewStrategy:'browser_fallback', previewUrl:'',
      isVerified:false, source:'fallback' },
    { id:'sys_ko_m', displayName:'한국어 시스템 (남성톤)', provider:'browser', voiceId:'ko-KR-male',
      voiceToneGender:'male_tone', ageTone:'unknown', languageSupport:['ko'],
      styleTags:['system','fallback'], previewStrategy:'browser_fallback', previewUrl:'',
      isVerified:false, source:'fallback' },
    { id:'sys_ja_f', displayName:'日本語 시스템 (여성톤)', provider:'browser', voiceId:'ja-JP-female',
      voiceToneGender:'female_tone', ageTone:'unknown', languageSupport:['ja'],
      styleTags:['system','fallback'], previewStrategy:'browser_fallback', previewUrl:'',
      isVerified:false, source:'fallback' },
    { id:'sys_ja_m', displayName:'日本語 시스템 (남성톤)', provider:'browser', voiceId:'ja-JP-male',
      voiceToneGender:'male_tone', ageTone:'unknown', languageSupport:['ja'],
      styleTags:['system','fallback'], previewStrategy:'browser_fallback', previewUrl:'',
      isVerified:false, source:'fallback' },
  ];

  /* ── ElevenLabs catalog — voice_id 와 청감 톤은 공식 voice library 표기 따름.
        provider API 로 받은 V2_EL_VOICES 가 있으면 그 값으로 보강함. ── */
  var ELEVENLABS_REGISTRY = [
    EL('rachel',  '21m00Tcm4TlvDq8ikWAM', 'Rachel',  'female_tone', 'young',  ['narration','warm']),
    EL('bella',   'EXAVITQu4vr4xnSDxMaL', 'Bella',   'female_tone', 'young',  ['soft','warm']),
    EL('domi',    'AZnzlk1XvdvUeBnXmlld', 'Domi',    'female_tone', 'young',  ['energetic','strong']),
    EL('freya',   'jsCqWAovK2LkecY7zXl4', 'Freya',   'female_tone', 'young',  ['bright']),
    EL('serena',  'pMsXgVXv3BLzUgSXRplE', 'Serena',  'female_tone', 'mature', ['calm','warm']),
    EL('dorothy', 'ThT5KcBeYPX3keUQqHPh', 'Dorothy', 'female_tone', 'mature', ['narration']),
    EL('grace',   'oWAxZDx7w5VEj9dCyTzz', 'Grace',   'female_tone', 'young',  ['bright','warm']),
    EL('nicole',  'piTKgcLEGmPE4e6mEKli', 'Nicole',  'female_tone', 'young',  ['soft']),
    /* 남성톤 */
    EL('adam',    'pNInz6obpgDQGcFmaJgB', 'Adam',    'male_tone',   'mature', ['calm','documentary']),
    EL('antoni',  'ErXwobaYiN019PkySvjV', 'Antoni',  'male_tone',   'adult',  ['narration']),
    EL('arnold',  'VR6AewLTigWG4xSOukaG', 'Arnold',  'male_tone',   'mature', ['clear']),
    EL('josh',    'TxGEqnHWrfWFTfGW9XjX', 'Josh',    'male_tone',   'adult',  ['deep']),
    EL('sam',     'yoZ06aMxZJJ28mfd3POQ', 'Sam',     'male_tone',   'adult',  ['energetic']),
    EL('charlie', 'IKne3meq5aSn9XLyUdCD', 'Charlie', 'male_tone',   'adult',  ['casual']),
    EL('daniel',  'onwK4e9ZLuTAKqWW03F9', 'Daniel',  'male_tone',   'mature', ['news','clear']),
    EL('fin',     'D38z5RcWu1voky8WS1ja', 'Fin',     'male_tone',   'senior', ['calm','senior_friendly']),
  ];

  /* ── 통합 카탈로그 ── */
  var V2_VOICE_CATALOG = ELEVENLABS_REGISTRY.concat(OPENAI_TTS_VOICES).concat(BROWSER_VOICES);
  var V2_VOICE_BY_ID = {};
  V2_VOICE_CATALOG.forEach(function(v){ V2_VOICE_BY_ID[v.id] = v; });

  /* ── 장르(추천 키) × 언어 → 후보 id 풀 ──
     성별 균형 보장 (female_tone≥2, male_tone≥2, neutral≥1 — 가능 시 senior 포함) */
  var V2_VOICE_RECOMMEND = {
    /* 일반 감동 */
    emotional: {
      ko: ['el_rachel','el_serena','el_bella','el_adam','el_antoni','el_fin','oa_nova','oa_onyx','oa_alloy'],
      ja: ['el_serena','el_dorothy','el_adam','el_antoni','oa_nova','oa_shimmer','oa_onyx','oa_echo','oa_alloy'],
    },
    /* 시니어 (senior 채널) — calm, mature, senior_friendly */
    senior: {
      ko: ['el_serena','el_dorothy','el_fin','el_adam','el_arnold','oa_shimmer','oa_onyx','oa_echo','oa_alloy'],
      ja: ['el_serena','el_dorothy','el_fin','el_adam','el_arnold','oa_shimmer','oa_onyx','oa_fable','oa_alloy'],
    },
    /* 정보 */
    info: {
      ko: ['el_adam','el_arnold','el_daniel','el_dorothy','oa_nova','oa_alloy','oa_echo','el_antoni'],
      ja: ['el_adam','el_arnold','el_daniel','oa_echo','oa_fable','el_dorothy','oa_nova','oa_alloy'],
    },
    /* 코믹 */
    comic: {
      ko: ['el_freya','el_grace','el_sam','el_charlie','oa_nova','oa_alloy','el_domi'],
      ja: ['el_freya','el_grace','el_sam','el_charlie','oa_nova','oa_alloy','el_antoni'],
    },
    /* 드라마 */
    drama: {
      ko: ['el_josh','el_adam','el_arnold','el_serena','el_domi','oa_onyx','oa_shimmer'],
      ja: ['el_josh','el_adam','el_arnold','el_serena','oa_onyx','oa_fable','oa_shimmer'],
    },
    /* 지식·교양·잡학·명언 */
    knowledge: {
      ko: ['el_adam','el_daniel','el_dorothy','oa_fable','oa_alloy','oa_echo','el_arnold'],
      ja: ['el_adam','el_daniel','oa_fable','oa_echo','oa_alloy','el_dorothy','el_arnold'],
    },
    /* 뉴스 */
    news: {
      ko: ['el_daniel','el_arnold','el_dorothy','oa_echo','oa_nova','oa_alloy'],
      ja: ['el_daniel','el_arnold','oa_echo','oa_fable','oa_nova','oa_alloy'],
    },
    /* 티키타카·대화 */
    dialog: {
      ko: ['el_freya','el_charlie','el_grace','el_antoni','oa_nova','oa_echo','el_sam'],
      ja: ['el_freya','el_charlie','el_grace','el_antoni','oa_nova','oa_echo','el_sam'],
    },
    /* 공공·소상공인 */
    public: {
      ko: ['el_dorothy','el_daniel','el_serena','el_arnold','oa_alloy','oa_echo'],
      ja: ['el_dorothy','el_daniel','el_serena','el_arnold','oa_alloy','oa_echo'],
    },
    /* 일본어 전용 (system + multilingual) */
    japanese: {
      ko: ['el_serena','el_adam','oa_nova','oa_echo','oa_shimmer','oa_alloy'],
      ja: ['el_serena','el_dorothy','el_adam','el_antoni','oa_nova','oa_shimmer','oa_echo','oa_fable','sys_ja_f','sys_ja_m'],
    },
  };

  /* ── 라벨 (한국어) ── */
  var V2_GENDER_LABEL = {
    female_tone:'♀ 여성톤', male_tone:'♂ 남성톤',
    neutral_tone:'⊙ 중성톤', unknown:'· 톤 미확인',
  };
  var V2_AGE_LABEL = {
    young:'청년', adult:'성인', mature:'중년',
    senior:'시니어', unknown:'미확인',
  };
  var V2_LANG_LABEL = { ko:'🇰🇷 한국어', ja:'🇯🇵 일본어', multi:'🌐 다국어', unknown:'· 언어 미확인' };
  var V2_PROVIDER_LABEL = {
    elevenlabs:'ElevenLabs', openai:'OpenAI', browser:'브라우저 대체',
  };

  /* ── 사용자 정의 voiceId — 직접 입력용 ── */
  function _v2BuildCustomCandidate(provider, voiceId, label) {
    var prov = String(provider || 'openai').toLowerCase();
    if (prov === 'eleven') prov = 'elevenlabs';
    return {
      id:               'custom_' + prov + '_' + voiceId,
      displayName:      label || voiceId,
      provider:         prov,
      voiceId:          voiceId,
      model:            prov === 'elevenlabs' ? 'eleven_multilingual_v2' : 'tts-1',
      voiceToneGender:  'unknown',
      ageTone:          'unknown',
      languageSupport:  ['unknown'],
      styleTags:        ['custom'],
      previewStrategy:  'provider_tts_sample',
      previewUrl:       '',
      isVerified:       false,
      source:           'manual',
    };
  }

  /* ── id → 후보 객체 (custom + lab 포함) ── */
  function _v2GetCandidateById(id) {
    if (!id) return null;
    if (V2_VOICE_BY_ID[id]) return V2_VOICE_BY_ID[id];
    /* 원격 ElevenLabs voice 캐시 */
    var remote = (window.V2_EL_VOICES || []).find(function(v){ return v.id === id; });
    if (remote) return remote;
    /* lab 라이브러리 (사용자가 만든 EL 음성 / OA instructions 프리셋) */
    if (typeof window.vlbAsCandidates === 'function') {
      var lab = window.vlbAsCandidates();
      var labMatch = lab.find(function(v){ return v.id === id; });
      if (labMatch) return labMatch;
    }
    var m = String(id).match(/^custom_([a-z]+)_(.+)$/i);
    if (m) return _v2BuildCustomCandidate(m[1], m[2]);
    return null;
  }

  /* ── 추천 후보 — profile 우선, 없으면 style key 그대로 ── */
  function _v2GetRecommendCandidates(styleOrKey, langKey) {
    var key = styleOrKey;
    var pool = V2_VOICE_RECOMMEND[key] || V2_VOICE_RECOMMEND.emotional;
    var ids = (pool[langKey] || pool.ko || []).slice();
    var list = ids.map(_v2GetCandidateById).filter(Boolean);

    /* 성별 균형 보강 — 모두 같은 성별이면 다른 톤을 주입 */
    var gCount = { male_tone:0, female_tone:0, neutral_tone:0, unknown:0 };
    list.forEach(function(c){ gCount[c.voiceToneGender] = (gCount[c.voiceToneGender]||0)+1; });
    if (gCount.male_tone < 2 || gCount.female_tone < 2) {
      var injected = V2_VOICE_CATALOG.filter(function(c){
        return c.provider !== 'browser' && list.indexOf(c) < 0
            && ((gCount.male_tone   < 2 && c.voiceToneGender === 'male_tone')
             || (gCount.female_tone < 2 && c.voiceToneGender === 'female_tone'));
      }).slice(0, 4);
      list = list.concat(injected);
      injected.forEach(function(c){ gCount[c.voiceToneGender] = (gCount[c.voiceToneGender]||0)+1; });
    }
    return list;
  }

  /* ── 추천 키 mapping helper (profile-resolver 미로드 시 fallback) ── */
  function _v2RecKeyFromStyle(style) {
    if (typeof window.profileToRecommendKey === 'function') {
      try { return window.profileToRecommendKey(window.resolveContentProfile && window.resolveContentProfile()); }
      catch(_) {}
    }
    var s = String(style || '').toLowerCase();
    if (V2_VOICE_RECOMMEND[s]) return s;
    if (s === 'tikitaka') return 'dialog';
    if (s === 'trivia' || s === 'saying') return 'knowledge';
    return 'emotional';
  }

  /* 전역 노출 */
  window.V2_VOICE_CATALOG          = V2_VOICE_CATALOG;
  window.V2_VOICE_BY_ID            = V2_VOICE_BY_ID;
  window.V2_VOICE_RECOMMEND        = V2_VOICE_RECOMMEND;
  window.V2_GENDER_LABEL           = V2_GENDER_LABEL;
  window.V2_AGE_LABEL              = V2_AGE_LABEL;
  window.V2_LANG_LABEL             = V2_LANG_LABEL;
  window.V2_PROVIDER_LABEL         = V2_PROVIDER_LABEL;
  window._v2GetCandidateById       = _v2GetCandidateById;
  window._v2GetRecommendCandidates = _v2GetRecommendCandidates;
  window._v2BuildCustomCandidate   = _v2BuildCustomCandidate;
  window._v2RecKeyFromStyle        = _v2RecKeyFromStyle;
  /* 호환 — 이전 picker 가 사용 */
  window.V2_COST_LABEL             = window.V2_COST_LABEL || { free:'🆓 무료', low:'💵 저렴', medium:'💵💵 보통', high:'💵💵💵 비쌈' };
  window._v2ProvAbbr = function(p){
    var v = String(p || '').toLowerCase();
    if (v === 'elevenlabs' || v === 'eleven') return 'EL';
    if (v === 'openai' || v === 'openaitts' || v === 'openai_tts') return 'OA';
    if (v === 'browser' || v === 'system') return 'SS';
    return 'OA';
  };
  window._v2DispatchProvider = function(prov){
    var p = String(prov || '').toLowerCase();
    if (p === 'elevenlabs' || p === 'eleven' || p === 'el') return 'elevenlabs';
    if (p === 'browser' || p === 'system' || p === 'ss') return 'system';
    return 'openaiTts';
  };
})();
