/* ================================================
   modules/studio/s2-voice-data.js
   STEP 3 음성 카탈로그 — 성별·연령·스타일 다양화

   * 후보 카드 데이터 + 장르별 추천 매핑
   * 각 후보: { id, label, provider, voiceId, gender, age, style, lang, desc, cost }
     - provider: EL(ElevenLabs) | OA(OpenAI TTS) | NJ(Nijivoice) | SS(브라우저 fallback)
     - voiceId: 실제 provider 측 voice id (TTS 호출에 사용)
     - gender: female | male | neutral
     - age:    young | middle | senior
     - cost:   free | low | medium | high
   * 모든 장르(emotional·info·humor·drama·senior·knowledge·news·comic·
     dialog·public·japanese)에 최소 6개 후보 + 성별 균형(♀2+ ♂2+ 중성1+ 시니어1+)
   ================================================ */
(function(){
  'use strict';

  /* ── 음성 카탈로그 (provider 별 모든 알려진 voice) ── */
  var V2_VOICE_CATALOG = [
    /* ─ ElevenLabs (KO/JA 모두 multilingual_v2 가능) ─ */
    { id:'el_rachel',  label:'Rachel',  provider:'EL', voiceId:'21m00Tcm4TlvDq8ikWAM', gender:'female',  age:'young',  style:'narrator', desc:'따뜻한 여성 내레이터', cost:'medium' },
    { id:'el_bella',   label:'Bella',   provider:'EL', voiceId:'EXAVITQu4vr4xnSDxMaL', gender:'female',  age:'young',  style:'soft',     desc:'부드러운 감성 톤',     cost:'medium' },
    { id:'el_domi',    label:'Domi',    provider:'EL', voiceId:'AZnzlk1XvdvUeBnXmlld', gender:'female',  age:'young',  style:'strong',   desc:'강하고 명확한 여성',   cost:'medium' },
    { id:'el_freya',   label:'Freya',   provider:'EL', voiceId:'jsCqWAovK2LkecY7zXl4', gender:'female',  age:'young',  style:'bright',   desc:'밝고 경쾌한 여성',     cost:'medium' },
    { id:'el_serena',  label:'Serena',  provider:'EL', voiceId:'pMsXgVXv3BLzUgSXRplE', gender:'female',  age:'middle', style:'pleasant', desc:'편안한 중년 여성',     cost:'medium' },
    { id:'el_dorothy', label:'Dorothy', provider:'EL', voiceId:'ThT5KcBeYPX3keUQqHPh', gender:'female',  age:'middle', style:'narrator', desc:'영국식 친근한 톤',     cost:'medium' },
    { id:'el_grace',   label:'Grace',   provider:'EL', voiceId:'oWAxZDx7w5VEj9dCyTzz', gender:'female',  age:'young',  style:'sweet',    desc:'달콤한 여성 톤',       cost:'medium' },
    { id:'el_nicole',  label:'Nicole',  provider:'EL', voiceId:'piTKgcLEGmPE4e6mEKli', gender:'female',  age:'young',  style:'whisper',  desc:'속삭이는 여성 ASMR',   cost:'medium' },

    { id:'el_adam',    label:'Adam',    provider:'EL', voiceId:'pNInz6obpgDQGcFmaJgB', gender:'male',    age:'middle', style:'deep',     desc:'깊고 신뢰감 있는 남성', cost:'medium' },
    { id:'el_antoni',  label:'Antoni',  provider:'EL', voiceId:'ErXwobaYiN019PkySvjV', gender:'male',    age:'young',  style:'narrator', desc:'표준적 남성 내레이터', cost:'medium' },
    { id:'el_arnold',  label:'Arnold',  provider:'EL', voiceId:'VR6AewLTigWG4xSOukaG', gender:'male',    age:'middle', style:'crisp',    desc:'또렷한 중년 남성',     cost:'medium' },
    { id:'el_josh',    label:'Josh',    provider:'EL', voiceId:'TxGEqnHWrfWFTfGW9XjX', gender:'male',    age:'young',  style:'deep',     desc:'젊은 깊은 남성',       cost:'medium' },
    { id:'el_sam',     label:'Sam',     provider:'EL', voiceId:'yoZ06aMxZJJ28mfd3POQ', gender:'male',    age:'young',  style:'raspy',    desc:'거친 톤의 청년 남성', cost:'medium' },
    { id:'el_charlie', label:'Charlie', provider:'EL', voiceId:'IKne3meq5aSn9XLyUdCD', gender:'male',    age:'middle', style:'casual',   desc:'편안한 호주식 남성',   cost:'medium' },
    { id:'el_daniel',  label:'Daniel',  provider:'EL', voiceId:'onwK4e9ZLuTAKqWW03F9', gender:'male',    age:'middle', style:'news',     desc:'영국식 뉴스 앵커',     cost:'medium' },
    { id:'el_fin',     label:'Fin',     provider:'EL', voiceId:'D38z5RcWu1voky8WS1ja', gender:'male',    age:'senior', style:'wise',     desc:'시니어 남성·관록',     cost:'medium' },

    /* ─ OpenAI TTS (6 voice — 모든 언어 호환) ─ */
    { id:'oa_alloy',   label:'Alloy',   provider:'OA', voiceId:'alloy',   gender:'neutral', age:'middle', style:'balanced', desc:'중성적 균형 톤',      cost:'low' },
    { id:'oa_echo',    label:'Echo',    provider:'OA', voiceId:'echo',    gender:'male',    age:'middle', style:'clear',    desc:'명료한 중년 남성',     cost:'low' },
    { id:'oa_fable',   label:'Fable',   provider:'OA', voiceId:'fable',   gender:'male',    age:'middle', style:'story',    desc:'영국식 스토리텔러',    cost:'low' },
    { id:'oa_onyx',    label:'Onyx',    provider:'OA', voiceId:'onyx',    gender:'male',    age:'middle', style:'deep',     desc:'깊고 묵직한 남성',     cost:'low' },
    { id:'oa_nova',    label:'Nova',    provider:'OA', voiceId:'nova',    gender:'female',  age:'young',  style:'bright',   desc:'밝고 친근한 여성',     cost:'low' },
    { id:'oa_shimmer', label:'Shimmer', provider:'OA', voiceId:'shimmer', gender:'female',  age:'middle', style:'soft',     desc:'부드러운 중년 여성',   cost:'low' },

    /* ─ Nijivoice (대표 음성 — 실제 voice_id 는 사용자가 통합설정에서 입력 가능) ─ */
    { id:'nj_haruka',   label:'Haruka',   provider:'NJ', voiceId:'haruka',   gender:'female', age:'middle', style:'narrator', desc:'시니어 감성 일본어',  cost:'medium' },
    { id:'nj_yuki',     label:'Yuki',     provider:'NJ', voiceId:'yuki',     gender:'female', age:'young',  style:'bright',   desc:'활기찬 일본어 여성',   cost:'medium' },
    { id:'nj_sachiko',  label:'Sachiko',  provider:'NJ', voiceId:'sachiko',  gender:'female', age:'senior', style:'wise',     desc:'시니어 일본어 여성',   cost:'medium' },
    { id:'nj_kenji',    label:'Kenji',    provider:'NJ', voiceId:'kenji',    gender:'male',   age:'middle', style:'news',     desc:'일본어 뉴스 앵커',     cost:'medium' },
    { id:'nj_takeshi',  label:'Takeshi',  provider:'NJ', voiceId:'takeshi',  gender:'male',   age:'middle', style:'deep',     desc:'드라마틱 일본어 남성', cost:'medium' },
    { id:'nj_hiroshi',  label:'Hiroshi',  provider:'NJ', voiceId:'hiroshi',  gender:'male',   age:'senior', style:'wise',     desc:'관록의 시니어 남성',   cost:'medium' },

    /* ─ 브라우저 SpeechSynthesis (fallback / free) ─ */
    { id:'ss_ko_f',     label:'한국어 여성', provider:'SS', voiceId:'ko-KR-f', gender:'female',  age:'young',  style:'system', desc:'브라우저 기본 (무료)', cost:'free' },
    { id:'ss_ko_m',     label:'한국어 남성', provider:'SS', voiceId:'ko-KR-m', gender:'male',    age:'young',  style:'system', desc:'브라우저 기본 (무료)', cost:'free' },
    { id:'ss_ja_f',     label:'日本語 女性', provider:'SS', voiceId:'ja-JP-f', gender:'female',  age:'young',  style:'system', desc:'브라우저 기본 (무료)', cost:'free' },
    { id:'ss_ja_m',     label:'日本語 男性', provider:'SS', voiceId:'ja-JP-m', gender:'male',    age:'young',  style:'system', desc:'브라우저 기본 (무료)', cost:'free' },
  ];

  /* ── 카탈로그 인덱스 (id → 객체) ── */
  var V2_VOICE_BY_ID = (function(){
    var m = {};
    V2_VOICE_CATALOG.forEach(function(v){ m[v.id] = v; });
    return m;
  })();

  /* ── 장르 × 언어 → 추천 후보 id 목록 (성별 균형 보장) ──
     각 그룹 ≥ 6개, ♀≥2 ♂≥2 (가능하면 중성·시니어 포함) */
  var V2_VOICE_RECOMMEND = {
    /* 감동 — 따뜻함 + 시니어 톤 */
    emotional: {
      ko: ['el_rachel','el_bella','el_serena','el_adam','el_antoni','el_fin'],
      ja: ['nj_haruka','nj_sachiko','oa_shimmer','nj_takeshi','nj_hiroshi','oa_onyx'],
    },
    /* 정보 — 신뢰감 + 명확 */
    info: {
      ko: ['el_adam','el_arnold','el_daniel','el_dorothy','oa_nova','oa_alloy'],
      ja: ['nj_kenji','oa_echo','oa_fable','nj_haruka','oa_nova','oa_alloy'],
    },
    /* 유머 — 밝고 경쾌 */
    humor: {
      ko: ['el_freya','el_grace','oa_nova','el_sam','el_charlie','oa_alloy'],
      ja: ['nj_yuki','oa_nova','oa_shimmer','nj_kenji','oa_echo','oa_fable'],
    },
    /* 드라마 — 깊고 묵직 */
    drama: {
      ko: ['el_josh','el_adam','el_arnold','el_domi','el_serena','oa_onyx'],
      ja: ['nj_takeshi','nj_hiroshi','oa_onyx','nj_sachiko','oa_shimmer','oa_fable'],
    },
    /* 시니어 — 친숙·관록 */
    senior: {
      ko: ['el_serena','el_dorothy','el_fin','el_arnold','oa_shimmer','oa_echo'],
      ja: ['nj_sachiko','nj_hiroshi','nj_haruka','oa_shimmer','oa_onyx','oa_fable'],
    },
    /* 지식·교양 — 다큐형 */
    knowledge: {
      ko: ['el_adam','el_daniel','el_dorothy','oa_fable','oa_alloy','oa_echo'],
      ja: ['nj_kenji','oa_fable','oa_echo','nj_haruka','oa_nova','oa_alloy'],
    },
    /* 뉴스 — 앵커 톤 */
    news: {
      ko: ['el_daniel','el_arnold','el_dorothy','oa_echo','oa_nova','oa_alloy'],
      ja: ['nj_kenji','oa_echo','oa_fable','oa_nova','nj_takeshi','oa_alloy'],
    },
    /* 코믹 — 캐릭터·과장 */
    comic: {
      ko: ['el_grace','el_sam','el_freya','el_charlie','oa_nova','oa_alloy'],
      ja: ['nj_yuki','nj_kenji','oa_nova','oa_echo','oa_shimmer','oa_alloy'],
    },
    /* 티키타카·대화 */
    dialog: {
      ko: ['el_freya','el_charlie','el_grace','el_antoni','oa_nova','oa_echo'],
      ja: ['nj_yuki','nj_kenji','oa_nova','oa_echo','oa_shimmer','oa_fable'],
    },
    /* 공공·소상공인 */
    public: {
      ko: ['el_dorothy','el_daniel','oa_alloy','oa_echo','el_serena','el_arnold'],
      ja: ['nj_haruka','nj_kenji','oa_alloy','oa_echo','oa_shimmer','oa_fable'],
    },
    /* 일본어 전용 */
    japanese: {
      ko: ['nj_haruka','nj_kenji','oa_nova','oa_echo','oa_shimmer','oa_alloy'],
      ja: ['nj_haruka','nj_yuki','nj_sachiko','nj_kenji','nj_takeshi','nj_hiroshi'],
    },
  };

  /* ── 사용자가 카탈로그 외 voice_id 를 직접 입력하는 경우 ── */
  function _v2BuildCustomCandidate(provider, voiceId, label) {
    var prov = String(provider || 'OA').toUpperCase();
    return {
      id:       'custom_' + prov + '_' + voiceId,
      label:    label || voiceId,
      provider: prov,
      voiceId:  voiceId,
      gender:   'neutral',
      age:      'middle',
      style:    'custom',
      desc:     '직접 입력한 voice_id',
      cost:     'medium',
      _custom:  true,
    };
  }

  /* ── 후보 id → 카탈로그 객체 (custom 도 처리) ── */
  function _v2GetCandidateById(id) {
    if (!id) return null;
    if (V2_VOICE_BY_ID[id]) return V2_VOICE_BY_ID[id];
    /* custom_<PROV>_<voiceId> 형태 파싱 */
    var m = String(id).match(/^custom_([A-Z]+)_(.+)$/);
    if (m) return _v2BuildCustomCandidate(m[1], m[2]);
    return null;
  }

  /* ── 장르 → 추천 후보 객체 배열 (langKey: 'ko' | 'ja') ── */
  function _v2GetRecommendCandidates(style, langKey) {
    var rec = V2_VOICE_RECOMMEND[style] || V2_VOICE_RECOMMEND.emotional;
    var ids = (rec[langKey] || []).slice();
    return ids.map(_v2GetCandidateById).filter(Boolean);
  }

  /* ── provider id (UI '음성 API') → 카탈로그 prov 약어 ── */
  function _v2ProvAbbr(apiId) {
    var v = String(apiId || '').toLowerCase();
    if (v === 'elevenlabs' || v === 'eleven') return 'EL';
    if (v === 'openai' || v === 'openai_tts' || v === 'openaitts') return 'OA';
    if (v === 'nijivoice' || v === 'niji') return 'NJ';
    if (v === 'system' || v === 'browser' || v === 'speechsynthesis') return 'SS';
    return 'OA';
  }

  /* ── 카탈로그 prov 약어 → _s2DispatchTts 가 받는 provider id ── */
  function _v2DispatchProvider(prov) {
    var p = String(prov || '').toUpperCase();
    if (p === 'EL') return 'elevenlabs';
    if (p === 'NJ') return 'nijivoice';
    if (p === 'SS') return 'system';
    return 'openaiTts';
  }

  /* ── 장르 라벨 (UI 표시용) ── */
  var V2_STYLE_LABEL = {
    emotional:'감동', info:'정보', humor:'유머', drama:'드라마',
    senior:'시니어', knowledge:'지식', news:'뉴스', comic:'코믹',
    dialog:'티키타카', public:'공공·소상공인', japanese:'일본어',
  };

  /* ── 성별 / 연령 / 비용 라벨 (UI 표시용) ── */
  var V2_GENDER_LABEL = { female:'♀ 여성', male:'♂ 남성', neutral:'⊙ 중성' };
  var V2_AGE_LABEL    = { young:'청년', middle:'중년', senior:'시니어' };
  var V2_COST_LABEL   = { free:'🆓 무료', low:'💵 저렴', medium:'💵💵 보통', high:'💵💵💵 비쌈' };

  /* ── 전역 노출 ── */
  window.V2_VOICE_CATALOG       = V2_VOICE_CATALOG;
  window.V2_VOICE_BY_ID         = V2_VOICE_BY_ID;
  window.V2_VOICE_RECOMMEND     = V2_VOICE_RECOMMEND;
  window.V2_STYLE_LABEL         = V2_STYLE_LABEL;
  window.V2_GENDER_LABEL        = V2_GENDER_LABEL;
  window.V2_AGE_LABEL           = V2_AGE_LABEL;
  window.V2_COST_LABEL          = V2_COST_LABEL;
  window._v2GetCandidateById    = _v2GetCandidateById;
  window._v2GetRecommendCandidates = _v2GetRecommendCandidates;
  window._v2BuildCustomCandidate= _v2BuildCustomCandidate;
  window._v2ProvAbbr            = _v2ProvAbbr;
  window._v2DispatchProvider    = _v2DispatchProvider;
})();
