/* ============================================================
   통합 콘텐츠 생성기 · 공급자(Provider) 설정
   ─────────────────────────────────────────────────────────────
   각 기능(텍스트·이미지·음성·음악·영상)마다 기본 공급자와
   교체 가능한 후보 공급자를 미리 정의해 두었습니다.

   [교체 방법]
   1) 아래 PROVIDERS.<기능>.default 값을 원하는 공급자 키로 변경.
      예) 이미지 생성을 Stability AI로 바꾸려면
          PROVIDERS.image.default = 'stability';
   2) 새로운 공급자를 추가하려면 PROVIDERS.<기능>.options 에
      { key, name, endpoint, model, notes } 형태로 항목을 추가한 뒤
      core/api-adapter.js (또는 해당 엔진 모듈)에서 호출 함수를 등록.
   3) 런타임에서 교체하려면 ProviderConfig.setDefault('image','stability')
      를 호출. localStorage 에 저장되어 새로고침 후에도 유지됩니다.
   ============================================================ */

(function(global){
  'use strict';

  /* ─── 언어 설정 ──────────────────────────────────────────────
     앱 UI·프롬프트·결과물에 사용할 언어 목록과 기본값입니다.
     추가 언어가 필요하면 LANGUAGES.supported 배열에 항목을 추가.
     ──────────────────────────────────────────────────────────── */
  const LANGUAGES = {
    default: 'ko',
    supported: [
      { code:'ko', label:'한국어', localeTag:'ko-KR', ttsLocale:'ko-KR' },
      { code:'ja', label:'日本語', localeTag:'ja-JP', ttsLocale:'ja-JP' },
      { code:'en', label:'English', localeTag:'en-US', ttsLocale:'en-US' }
    ],
    // 이중 언어 동시 생성 시 기본 조합 (한국어 + 일본어)
    bilingualPair: ['ko','ja']
  };

  /* ─── 기능별 공급자 정의 ───────────────────────────────────── */
  const PROVIDERS = {

    /* ① 텍스트 생성 (대본·글·분석)
       기본: Claude Sonnet 4. OpenAI/Gemini 로 교체 가능.
       ─ 교체하려면 default 값을 'openai' 또는 'gemini' 로 변경. */
    text: {
      default: 'claude',
      options: {
        claude: {
          key:'claude',
          name:'Anthropic Claude',
          endpoint:'https://api.anthropic.com/v1/messages',
          model:'claude-sonnet-4-5',
          modelOptions:['claude-sonnet-4-5','claude-haiku-4-5-20251001'],
          apiKeyStorage:'uc_claude_key',
          notes:'기본 텍스트 엔진. 한국어/일본어 품질 우수.'
        },
        openai: {
          key:'openai',
          name:'OpenAI GPT',
          endpoint:'https://api.openai.com/v1/chat/completions',
          model:'gpt-4o',
          modelOptions:['gpt-4o','gpt-4o-mini'],
          apiKeyStorage:'uc_openai_key',
          notes:'빠르고 저렴한 대안. 이미지 생성과도 결합 가능.'
        },
        gemini: {
          key:'gemini',
          name:'Google Gemini',
          endpoint:'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
          model:'gemini-2.0-flash',
          modelOptions:['gemini-2.0-flash','gemini-2.5-pro-exp-03-25'],
          apiKeyStorage:'uc_gemini_key',
          notes:'무료 티어 제공. 긴 컨텍스트 유리.'
        },
        minimax: {
          key:'minimax',
          name:'MiniMax',
          endpoint:'https://api.minimax.chat/v1/text/chatcompletion_v2',
          model:'abab6.5s-chat',
          modelOptions:['abab6.5s-chat','abab6.5-chat'],
          apiKeyStorage:'uc_minimax_key',
          notes:'중국어·동아시아권 다국어(한/중/일) 표현 특화. 긴 문서 이해에도 강함.'
        }
      }
    },

    /* ② 이미지 생성 (썸네일·장면·일러스트)
       기본: OpenAI (DALL·E 3 / gpt-image-1).
       ─ 다른 공급자로 교체: PROVIDERS.image.default = 'stability' 등. */
    image: {
      default: 'openai',
      options: {
        openai: {
          key:'openai',
          name:'OpenAI Images',
          endpoint:'https://api.openai.com/v1/images/generations',
          model:'gpt-image-1',
          modelOptions:['gpt-image-1','dall-e-3'],
          apiKeyStorage:'uc_openai_key',
          notes:'텍스트 엔진과 키 공유 가능. 한글 프롬프트 OK.'
        },
        stability: {
          key:'stability',
          name:'Stability AI',
          endpoint:'https://api.stability.ai/v2beta/stable-image/generate/core',
          model:'stable-image-core',
          apiKeyStorage:'uc_stability_key',
          notes:'사진풍·일러스트 자연스러움. 저렴한 대안.'
        },
        gemini: {
          key:'gemini',
          name:'Gemini Imagen',
          endpoint:'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImage',
          model:'imagen-3.0-generate-002',
          apiKeyStorage:'uc_gemini_key',
          notes:'Gemini API 키로 이미지도 생성.'
        }
      }
    },

    /* ③ 음성 TTS (대본 → 음성 파일)
       기본: ElevenLabs. OpenAI TTS / Google Cloud TTS 로 교체 가능.
       ─ 교체 예: PROVIDERS.tts.default = 'openai'; */
    tts: {
      default: 'elevenlabs',
      options: {
        elevenlabs: {
          key:'elevenlabs',
          name:'ElevenLabs',
          endpoint:'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}',
          model:'eleven_multilingual_v2',
          apiKeyStorage:'uc_elevenlabs_key',
          notes:'자연스러운 한국어/일본어 음성. 감정 표현 우수. ' +
                '💡 ElevenLabs에서 일본어 지원 음성을 선택하세요 (예: Yuki, Aria 등).'
        },
        openai: {
          key:'openai',
          name:'OpenAI TTS',
          endpoint:'https://api.openai.com/v1/audio/speech',
          model:'tts-1-hd',
          modelOptions:['tts-1','tts-1-hd'],
          voiceOptions:['alloy','echo','fable','onyx','nova','shimmer'],
          apiKeyStorage:'uc_openai_key',
          notes:'저렴·빠름. 보이스 선택지는 6종.'
        },
        google: {
          key:'google',
          name:'Google Cloud TTS',
          endpoint:'https://texttospeech.googleapis.com/v1/text:synthesize',
          model:'ko-KR-Neural2-A',
          apiKeyStorage:'uc_google_tts_key',
          notes:'한국어 Neural2 품질 우수. 일본어도 지원.'
        }
      }
    },

    /* ④ 음악 생성 (BGM·가사 기반 음원)
       기본: Suno. Udio / Mubert 로 교체 가능. */
    music: {
      default: 'suno',
      options: {
        suno: {
          key:'suno',
          name:'Suno AI',
          endpoint:'https://api.suno.ai/v1/songs',
          model:'chirp-v4',
          apiKeyStorage:'uc_suno_key',
          notes:'가사+스타일 지정 가능. 일본어 발음 자연스러움.'
        },
        udio: {
          key:'udio',
          name:'Udio',
          endpoint:'https://api.udio.com/v1/generate',
          model:'udio-v1',
          apiKeyStorage:'uc_udio_key',
          notes:'고품질 음원 생성. 레퍼런스 스타일 반영 강함.'
        },
        mubert: {
          key:'mubert',
          name:'Mubert',
          endpoint:'https://api-b2b.mubert.com/v2/TTMGenerate',
          model:'mubert-pro',
          apiKeyStorage:'uc_mubert_key',
          notes:'저작권 걱정 없는 BGM 생성에 적합.'
        }
      }
    },

    /* ⑤ 영상 생성 (장면·쇼츠 조립)
       기본: InVideo. Runway / Pika 로 교체 가능. */
    video: {
      default: 'invideo',
      options: {
        invideo: {
          key:'invideo',
          name:'InVideo AI',
          endpoint:'https://api.invideo.ai/v2/videos',
          model:'invideo-ai-v2',
          apiKeyStorage:'uc_invideo_key',
          notes:'대본 → 장면 자동 매칭. 쇼츠·롱폼 모두 지원.'
        },
        runway: {
          key:'runway',
          name:'Runway Gen-3',
          endpoint:'https://api.runwayml.com/v1/image_to_video',
          model:'gen3a_turbo',
          apiKeyStorage:'uc_runway_key',
          notes:'짧은 영상 생성 품질 우수. 시네마틱 톤.'
        },
        pika: {
          key:'pika',
          name:'Pika Labs',
          endpoint:'https://api.pika.art/v1/generate',
          model:'pika-1.5',
          apiKeyStorage:'uc_pika_key',
          notes:'캐릭터·애니메이션 스타일 강점.'
        }
      }
    }
  };

  /* ─── 기능별 최적 AI 조합 (전문가 추천 기본값) ───────────────
     텍스트: feature 이름 → { provider, model, label, reason }
     이미지: 스타일 → { provider, model, label, reason }
     음성  : 용도 → { provider, voice, speed, label, reason }
     값은 코드 하드코딩이 기본. 사용자가 변경하면 localStorage 저장.
     변경값이 없으면 항상 여기 정의된 기본값을 사용.
     ──────────────────────────────────────────────────────── */
  const DEFAULT_PROVIDERS = {
    script:           { provider:'claude', model:'claude-sonnet-4-5',          label:'🟣 Claude Sonnet', reason:'한일 최고' },
    blog:             { provider:'claude', model:'claude-sonnet-4-5',          label:'🟣 Claude Sonnet', reason:'카피 최고' },
    official:         { provider:'claude', model:'claude-sonnet-4-5',          label:'🟣 Claude Sonnet', reason:'격식체 최고' },
    small_business:   { provider:'claude', model:'claude-sonnet-4-5',          label:'🟣 Claude Sonnet', reason:'카피 최고' },
    translate_ko_ja:  { provider:'claude', model:'claude-sonnet-4-5',          label:'🟣 Claude Sonnet', reason:'뉘앙스 최고' },
    translate_ko_en:  { provider:'openai', model:'gpt-4o',                     label:'🟢 GPT-4o',        reason:'영어 최고' },
    learning:         { provider:'claude', model:'claude-haiku-4-5-20251001',  label:'🟣 Claude Haiku',  reason:'빠름+안전' },
    kids:             { provider:'claude', model:'claude-haiku-4-5-20251001',  label:'🟣 Claude Haiku',  reason:'안전+귀여움' },
    psychology:       { provider:'claude', model:'claude-sonnet-4-5',          label:'🟣 Claude Sonnet', reason:'감성 최고' },
    auto_shorts:      { provider:'claude', model:'claude-sonnet-4-5',          label:'🟣 Claude Sonnet', reason:'한일동시최고' },
    summary:          { provider:'gemini', model:'gemini-2.0-flash',           label:'🔵 Gemini Flash',  reason:'빠름+저렴' }
  };

  const DEFAULT_IMAGE_PROVIDERS = {
    ghibli:       { provider:'ideogram', model:'ideogram-v2',    label:'Ideogram', reason:'지브리풍 + 텍스트삽입 무료' },
    realistic:    { provider:'dalle3',   model:'dall-e-3',       label:'DALL-E 3', reason:'실사 품질 최고' },
    disney:       { provider:'dalle3',   model:'dall-e-3',       label:'DALL-E 3', reason:'캐릭터 일관성 최고' },
    thumbnail:    { provider:'ideogram', model:'ideogram-v2',    label:'Ideogram', reason:'텍스트 포함 이미지 최강' },
    countryballs: { provider:'dalle3',   model:'dall-e-3',       label:'DALL-E 3', reason:'국기 캐릭터 정확도 최고' },
    webtoon:      { provider:'ideogram', model:'ideogram-v2',    label:'Ideogram', reason:'만화체 무료 생성' }
  };

  const DEFAULT_TTS_PROVIDERS = {
    ko_emotional:  { provider:'elevenlabs', voice:'Rachel',   speed:0.9,  label:'ElevenLabs Rachel', reason:'따뜻하고 감동적인 목소리' },
    ko_general:    { provider:'openai',     voice:'nova',     speed:1.0,  label:'OpenAI Nova',        reason:'저렴+자연' },
    ja_general:    { provider:'nijivoice',  voice:'default',  speed:1.0,  label:'Nijivoice',          reason:'일본어 목소리 특화' },
    tiki_taka_a:   { provider:'elevenlabs', voice:'Rachel',   speed:1.0,  label:'ElevenLabs Rachel',  reason:'밝은 목소리' },
    tiki_taka_b:   { provider:'elevenlabs', voice:'Domi',     speed:1.0,  label:'ElevenLabs Domi',    reason:'차분한 목소리' },
    kids:          { provider:'openai',     voice:'shimmer',  speed:1.0,  label:'OpenAI Shimmer',     reason:'귀여운 목소리' }
  };

  const DEFAULT_BGM_PRESETS = {
    fun:       { style:'업비트 펀', suno_prompt:'upbeat fun background music, cheerful, energetic, no lyrics', volume:0.20 },
    knowledge: { style:'Lo-fi 집중', suno_prompt:'lofi hip hop, study music, calm, focused, no lyrics',         volume:0.12 },
    drama:     { style:'오케스트라 긴장감', suno_prompt:'cinematic orchestral, dramatic tension, epic, no lyrics', volume:0.18 }
  };

  /* ─── 스타일 → 이미지 공급자 추천 매핑 ──────────────────── */
  const IMAGE_STYLE_HINTS = {
    realistic:    '💡 DALL-E 3 추천',
    ghibli:       '💡 Ideogram 추천 (무료)',
    disney:       '💡 DALL-E 3 추천',
    webtoon:      '💡 Ideogram 추천 (무료)',
    thumbnail:    '💡 Ideogram 추천 (텍스트 포함)',
    countryballs: '💡 DALL-E 3 추천'
  };

  /* ─── 단가표 (USD) · 1달러 = 1,350원 자동환산 ─────────── */
  const COST_RATES = {
    // 텍스트 (USD / 1M tokens)
    text: {
      'claude-sonnet-4-5':         { input:3,     output:15,  label:'Claude Sonnet' },
      'claude-haiku-4-5-20251001': { input:0.25,  output:1.25,label:'Claude Haiku'  },
      'gpt-4o':                    { input:5,     output:15,  label:'GPT-4o'        },
      'gpt-4o-mini':               { input:0.15,  output:0.60,label:'GPT-4o-mini'   },
      'gemini-2.0-flash':          { input:0.075, output:0.30,label:'Gemini Flash'  }
    },
    // 이미지 (USD / 장)
    image: {
      'dall-e-3':    { perImage:0.04, label:'DALL-E 3'  },
      'gpt-image-1': { perImage:0.04, label:'GPT Image' },
      'ideogram-v2': { perImage:0,    label:'Ideogram (무료)' }
    },
    // 음성 (USD / 1,000 chars)
    tts: {
      elevenlabs: { perKChar:0.30,  label:'ElevenLabs' },
      openai:     { perKChar:0.015, label:'OpenAI TTS' },
      nijivoice:  { perKChar:null,  label:'Nijivoice (별도 요금)' }
    },
    fxDefault: 1350
  };

  /* ─── 헬퍼 함수 ───────────────────────────────────────────── */

  const STORAGE_PREFIX = 'uc_provider_default_'; // 예: uc_provider_default_image
  const FEATURE_PREFIX = 'uc_feat_default_';     // 예: uc_feat_default_text_script

  /** 현재 선택된 기본 공급자 반환 (localStorage 우선). */
  function getDefault(feature){
    if(!PROVIDERS[feature]) return null;
    const saved = localStorage.getItem(STORAGE_PREFIX + feature);
    return saved || PROVIDERS[feature].default;
  }

  /** 기본 공급자 교체 (새로고침 후에도 유지). */
  function setDefault(feature, providerKey){
    if(!PROVIDERS[feature]) throw new Error('알 수 없는 기능: '+feature);
    if(!PROVIDERS[feature].options[providerKey])
      throw new Error(`"${feature}" 기능에 "${providerKey}" 공급자가 없습니다.`);
    localStorage.setItem(STORAGE_PREFIX + feature, providerKey);
  }

  /** 현재 선택된 공급자의 설정 객체 반환. */
  function getActive(feature){
    const key = getDefault(feature);
    return PROVIDERS[feature]?.options[key] || null;
  }

  /** 해당 기능의 공급자 후보 목록 반환. */
  function listOptions(feature){
    return Object.values(PROVIDERS[feature]?.options || {});
  }

  /** 언어 설정 조회. */
  function getLanguage(code){
    return LANGUAGES.supported.find(l => l.code === code) || null;
  }

  /* ─── 기능별 기본값 헬퍼 ──────────────────────────────────
     category: 'text' | 'image' | 'tts' | 'bgm'
     feature : 'script'·'ghibli'·'ko_emotional' 등
     localStorage 에 사용자 오버라이드가 있으면 병합해서 반환.
     없으면 순수 하드코딩 기본값. */
  function _defaultsOf(category){
    if(category==='text')  return DEFAULT_PROVIDERS;
    if(category==='image') return DEFAULT_IMAGE_PROVIDERS;
    if(category==='tts')   return DEFAULT_TTS_PROVIDERS;
    if(category==='bgm')   return DEFAULT_BGM_PRESETS;
    return null;
  }

  function getFeatureDefault(category, feature){
    const bank = _defaultsOf(category);
    if(!bank || !bank[feature]) return null;
    const base = Object.assign({}, bank[feature]);
    try{
      const raw = localStorage.getItem(FEATURE_PREFIX + category + '_' + feature);
      if(raw){
        const saved = JSON.parse(raw);
        if(saved && typeof saved==='object') Object.assign(base, saved);
      }
    }catch(_){}
    return base;
  }

  function setFeatureDefault(category, feature, cfg){
    if(!_defaultsOf(category)?.[feature]) throw new Error('알 수 없는 기능: '+category+'.'+feature);
    localStorage.setItem(FEATURE_PREFIX + category + '_' + feature, JSON.stringify(cfg||{}));
  }

  function clearFeatureDefault(category, feature){
    if(feature){
      localStorage.removeItem(FEATURE_PREFIX + category + '_' + feature);
      return;
    }
    // 카테고리 전체 초기화
    const bank = _defaultsOf(category) || {};
    Object.keys(bank).forEach(k => localStorage.removeItem(FEATURE_PREFIX + category + '_' + k));
  }

  function listFeatureDefaults(category){
    const bank = _defaultsOf(category);
    if(!bank) return [];
    return Object.keys(bank).map(feature => ({
      feature,
      config: getFeatureDefault(category, feature)
    }));
  }

  /** 이미지 스타일 선택 시 표시할 추천 문구 반환. */
  function recommendImageProvider(style){
    return IMAGE_STYLE_HINTS[style] || '';
  }

  /** 비용 추정 (KRW). inputTokens/outputTokens 는 텍스트용. */
  function estimateCostKRW(params){
    const fx = COST_RATES.fxDefault;
    if(!params) return 0;
    if(params.category==='text'){
      const r = COST_RATES.text[params.model]; if(!r) return 0;
      const usd = (params.inputTokens||0)/1e6 * r.input + (params.outputTokens||0)/1e6 * r.output;
      return Math.round(usd * fx);
    }
    if(params.category==='image'){
      const r = COST_RATES.image[params.model] || COST_RATES.image['dall-e-3'];
      return Math.round((r.perImage||0) * (params.count||1) * fx);
    }
    if(params.category==='tts'){
      const r = COST_RATES.tts[params.provider]; if(!r || r.perKChar==null) return 0;
      return Math.round(r.perKChar * ((params.chars||0)/1000) * fx);
    }
    return 0;
  }

  /* ─── 외부 노출 ───────────────────────────────────────────── */
  const ProviderConfig = {
    LANGUAGES,
    PROVIDERS,
    DEFAULT_PROVIDERS,
    DEFAULT_IMAGE_PROVIDERS,
    DEFAULT_TTS_PROVIDERS,
    DEFAULT_BGM_PRESETS,
    IMAGE_STYLE_HINTS,
    COST_RATES,
    getDefault,
    setDefault,
    getActive,
    listOptions,
    getLanguage,
    getFeatureDefault,
    setFeatureDefault,
    clearFeatureDefault,
    listFeatureDefaults,
    recommendImageProvider,
    estimateCostKRW
  };

  global.ProviderConfig = ProviderConfig;
  if(typeof module !== 'undefined' && module.exports) module.exports = ProviderConfig;

})(typeof window !== 'undefined' ? window : globalThis);
