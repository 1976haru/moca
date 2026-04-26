/* ================================================
   modules/settings/api-recommendation-engine.js
   API 추천 엔진 v2 — 티어 기반 메타 + 스택 프리셋
   * 절대 금액 하드코딩 금지 — priceTier 라벨로 관리
   * 기존 api-recommendations.js 와 병행 — getProviderMeta /
     getRecommendedStack / applyStackPreset / getProviderKeyStatus 신규
   ================================================ */
(function(){
  'use strict';

  /* ════════════════════════════════════════════════
     1) Provider 메타 — 7 카테고리 × 티어 라벨
     priceTier:   free / low / medium / medium-high / high / premium
     qualityTier: basic / good / high / premium
     speedTier:   slow / medium / high
     ════════════════════════════════════════════════ */
  const META = {
    script: {
      openai:     { label:'OpenAI (GPT)',  legacyKey:'uc_openai_key',  priceTier:'medium',      qualityTier:'high',    speedTier:'high',  strengths:['숏츠 대본','JSON 구조화','자동화','제목/메타데이터'], bestFor:['shorts','structured-output','metadata','ab-test'], weakFor:['아주 긴 감성 문체는 Claude 대비 약함'] },
      claude:     { label:'Claude',         legacyKey:'uc_claude_key',  priceTier:'medium-high', qualityTier:'premium', speedTier:'medium',strengths:['긴 글','감성 대본','블로그','뉴스레터','격식체'], bestFor:['emotional','blog','newsletter','public','longform'], weakFor:['JSON 자동화는 OpenAI 대비 약함'] },
      gemini:     { label:'Google Gemini',  legacyKey:'uc_gemini_key',  priceTier:'low',         qualityTier:'good',    speedTier:'high',  strengths:['저비용','대량 초안','번역','다국어'], bestFor:['translate','bulk','mass-draft'], weakFor:['감성 문체는 Claude 대비 약함'] },
      perplexity: { label:'Perplexity',     legacyKey:'uc_perplexity_key',priceTier:'medium',    qualityTier:'high',    speedTier:'high',  strengths:['웹 검색 기반 사실 확인','뉴스/리서치'], bestFor:['research','factcheck','news'], weakFor:['창작 문체 약함'] },
    },
    image: {
      dalle3:      { label:'DALL-E 3 / GPT Image', legacyKey:'uc_openai_key',  priceTier:'high',     qualityTier:'high',    speedTier:'medium',strengths:['고품질','텍스트 이해','썸네일'], bestFor:['thumbnail','keyShot','info'], weakFor:['대량 비싸짐'] },
      dalle2:      { label:'DALL-E 2',             legacyKey:'uc_openai_key',  priceTier:'low',      qualityTier:'basic',   speedTier:'high',  strengths:['저비용 대량'], bestFor:['bulk','draft'], weakFor:['품질 낮음'] },
      flux:        { label:'Flux',                 legacyKey:'uc_flux_key',    priceTier:'medium',   qualityTier:'high',    speedTier:'medium',strengths:['시드 고정','감성','캐릭터 일관성'], bestFor:['emotional','keyShot','characterConsistency'], weakFor:[] },
      stable:      { label:'Stable Diffusion',     legacyKey:'uc_sd_key',      priceTier:'low',      qualityTier:'good',    speedTier:'medium',strengths:['저비용','커스터마이즈'], bestFor:['bulk','custom'], weakFor:[] },
      geminiImagen:{ label:'Gemini Imagen',        legacyKey:'uc_gemini_key',  priceTier:'low',      qualityTier:'good',    speedTier:'high',  strengths:['무료 한도','속도'], bestFor:['bulk','draft'], weakFor:['세부 제어 약함'] },
      minimax:     { label:'MiniMax',              legacyKey:'uc_minimax_key', priceTier:'medium',   qualityTier:'good',    speedTier:'medium',strengths:['영상 특화'], bestFor:['videoSource'], weakFor:[] },
      ideogram:    { label:'Ideogram',             legacyKey:'uc_ideogram_key',priceTier:'medium',   qualityTier:'high',    speedTier:'medium',strengths:['텍스트 표현','썸네일'], bestFor:['thumbnail','typography'], weakFor:[] },
    },
    stock: {
      pexels:   { label:'Pexels',   legacyKey:'uc_pexels_key',  priceTier:'free', qualityTier:'good', speedTier:'high', strengths:['무료 상업용','월 25K 호출','이미지·영상'], bestFor:['bulk','sceneFiller','sceneStock'], weakFor:['스타일 한정'] },
      pixabay:  { label:'Pixabay',  legacyKey:'uc_pixabay_key', priceTier:'free', qualityTier:'good', speedTier:'high', strengths:['무료','무제한'], bestFor:['bulk','sceneStock'], weakFor:['일관성 낮음'] },
      unsplash: { label:'Unsplash', legacyKey:'uc_unsplash_key',priceTier:'free', qualityTier:'high', speedTier:'high', strengths:['고품질 사진','감성'], bestFor:['emotional','blog','keyShot'], weakFor:['상업용 라이선스 확인 필요'] },
    },
    voice: {
      elevenlabs:{ label:'ElevenLabs',  legacyKey:'uc_eleven_key',     priceTier:'high',   qualityTier:'premium', speedTier:'high',  strengths:['감정','캐릭터','한국어 자연스러움'], bestFor:['emotional','senior','premium','characterVoice'], weakFor:['비싸짐'] },
      openaiTts: { label:'OpenAI TTS',   legacyKey:'uc_openai_key',     priceTier:'low',    qualityTier:'high',    speedTier:'high',  strengths:['저비용','명료','대량','다국어'], bestFor:['info','bulk','balanced'], weakFor:[] },
      googleTts: { label:'Google TTS',   legacyKey:'uc_google_key',     priceTier:'low',    qualityTier:'good',    speedTier:'high',  strengths:['다국어','무료 한도'], bestFor:['info','multilingual'], weakFor:[] },
      nijivoice: { label:'Nijivoice',    legacyKey:'uc_nijivoice_key',  priceTier:'medium', qualityTier:'high',    speedTier:'medium',strengths:['일본어','캐릭터성','억양'], bestFor:['japanese','characterVoice'], weakFor:[] },
      azureTts:  { label:'Azure TTS',    legacyKey:'uc_azure_key',      priceTier:'low',    qualityTier:'high',    speedTier:'high',  strengths:['엔터프라이즈','다국어'], bestFor:['info','bulk','enterprise'], weakFor:[] },
      clova:     { label:'Clova Voice',  legacyKey:'uc_clova_key',      priceTier:'low',    qualityTier:'high',    speedTier:'high',  strengths:['한국어','시니어 자연스러움'], bestFor:['korean','senior'], weakFor:[] },
    },
    video: {
      creatomate:{ label:'Creatomate',    legacyKey:'uc_creatomate_key', priceTier:'medium', qualityTier:'good',    speedTier:'high',  strengths:['템플릿','자동 조립','대량'], bestFor:['shortsAssembly','bulk','template'], weakFor:[] },
      invideo:   { label:'InVideo',       legacyKey:'',                  priceTier:'low',    qualityTier:'good',    speedTier:'high',  strengths:['템플릿','수동 연동'], bestFor:['template','quickEdit'], weakFor:[] },
      runway:    { label:'Runway ML',     legacyKey:'uc_runway_key',     priceTier:'premium',qualityTier:'premium', speedTier:'medium',strengths:['시네마틱','Gen-3','고품질'], bestFor:['premium','keyShot','cinematic'], weakFor:['비용 매우 큼'] },
      pika:      { label:'Pika',          legacyKey:'uc_pika_key',       priceTier:'medium', qualityTier:'high',    speedTier:'high',  strengths:['모션','애니','이미지→영상'], bestFor:['imageToVideo','motion','keyShot'], weakFor:[] },
      luma:      { label:'Luma',          legacyKey:'uc_luma_key',       priceTier:'medium', qualityTier:'high',    speedTier:'medium',strengths:['자연 모션','루프'], bestFor:['imageToVideo','natural'], weakFor:[] },
      minimaxVid:{ label:'MiniMax Video', legacyKey:'uc_minimax_key',    priceTier:'medium', qualityTier:'good',    speedTier:'medium',strengths:['아시아 인물','감성'], bestFor:['imageToVideo','asian'], weakFor:[] },
      heygen:    { label:'HeyGen',        legacyKey:'uc_heygen_key',     priceTier:'high',   qualityTier:'high',    speedTier:'medium',strengths:['아바타','립싱크'], bestFor:['avatar','talkingHead'], weakFor:[] },
    },
    music: {
      suno:        { label:'Suno',                  legacyKey:'uc_suno_key', priceTier:'medium', qualityTier:'high', speedTier:'high', strengths:['프롬프트 기반 곡','가사 매칭'], bestFor:['song','musicContent','lyrics'], weakFor:[] },
      udio:        { label:'Udio',                  legacyKey:'uc_udio_key', priceTier:'medium', qualityTier:'high', speedTier:'medium',strengths:['고품질 보컬','창작 음악'], bestFor:['premiumSong','musicContent'], weakFor:[] },
      freeBgm:     { label:'무료 BGM',               legacyKey:'',            priceTier:'free',   qualityTier:'good', speedTier:'high', strengths:['저작권 관리 쉬움','저비용'], bestFor:['bgm','bulkShorts'], weakFor:[] },
      sunoPrompt:  { label:'Suno 복사용 프롬프트',     legacyKey:'',            priceTier:'low',    qualityTier:'high', speedTier:'high', strengths:['가사·음원 프롬프트','복붙 워크플로우'], bestFor:['songContent','lyrics','musicPrompt'], weakFor:[] },
    },
    upload: {
      youtube:   { label:'YouTube Data',     legacyKey:'uc_youtube_key',   priceTier:'free', qualityTier:'high', speedTier:'high', strengths:['OAuth','자동업로드','메타'], bestFor:['youtube'], weakFor:[] },
      tiktok:    { label:'TikTok',           legacyKey:'uc_tiktok_key',    priceTier:'free', qualityTier:'high', speedTier:'high', strengths:['OAuth','숏폼'], bestFor:['tiktok'], weakFor:[] },
      instagram: { label:'Instagram Graph',  legacyKey:'uc_instagram_key', priceTier:'free', qualityTier:'high', speedTier:'high', strengths:['릴스','비즈니스'], bestFor:['reels'], weakFor:[] },
      facebook:  { label:'Facebook Pages',   legacyKey:'uc_facebook_key',  priceTier:'free', qualityTier:'good', speedTier:'high', strengths:['페이지 게시'], bestFor:['social'], weakFor:[] },
      naverBlog: { label:'Naver Blog',       legacyKey:'uc_naver_key',     priceTier:'free', qualityTier:'good', speedTier:'medium',strengths:['한국어 블로그'], bestFor:['blogKr'], weakFor:[] },
      threads:   { label:'Threads',          legacyKey:'uc_threads_key',   priceTier:'free', qualityTier:'good', speedTier:'high', strengths:['텍스트 단문'], bestFor:['social','text'], weakFor:[] },
    },
  };
  window.MOCA_PROVIDER_META = META;

  /* ════════════════════════════════════════════════
     2) 추천 스택 프리셋 (6개)
     ════════════════════════════════════════════════ */
  const STACKS = {
    shortsBudget: {
      label: '숏츠 자동화 — 가성비',
      description: '대량 숏츠 제작용 저비용 기본 조합',
      stack: {
        script: ['openai','gemini','claude'],
        image:  ['pexels','geminiImagen','stable','flux'],
        voice:  ['openaiTts','elevenlabs','nijivoice'],
        video:  ['creatomate','invideo','pika'],
        music:  ['freeBgm','sunoPrompt'],
      },
      preference: { script:'balanced', image:'budget', voice:'balanced', video:'budget', music:'budget' },
      reason: '대량 생성에서는 이미지·영상 비용이 가장 크므로 스톡/저비용 이미지와 템플릿 렌더링을 우선합니다.',
    },
    seniorEmotionPremium: {
      label: '시니어 감동 — 품질 우선',
      description: '감정선과 음성 품질이 중요한 시니어 콘텐츠용',
      stack: {
        script: ['claude','openai','gemini'],
        image:  ['flux','dalle3','geminiImagen'],
        voice:  ['elevenlabs','openaiTts','nijivoice'],
        video:  ['creatomate','runway','pika'],
        music:  ['sunoPrompt','freeBgm'],
      },
      preference: { script:'quality', image:'quality', voice:'quality', video:'balanced', music:'quality' },
      reason: '감동 콘텐츠는 문체와 음성 표현이 중요하므로 Claude와 ElevenLabs를 우선 추천합니다.',
    },
    japaneseSenior: {
      label: '일본 시니어 채널',
      description: '일본어 음성, 쇼와 감성, 엔카/J-POP 콘텐츠에 적합',
      stack: {
        script: ['claude','gemini','openai'],
        image:  ['flux','pexels','geminiImagen'],
        voice:  ['nijivoice','elevenlabs','openaiTts'],
        video:  ['creatomate','pika','runway'],
        music:  ['sunoPrompt','udio'],
      },
      preference: { script:'quality', image:'balanced', voice:'quality', video:'balanced', music:'quality' },
      reason: '일본어 콘텐츠는 언어 자연스러움과 정서가 중요하므로 Nijivoice와 Claude/Gemini 조합을 우선합니다.',
    },
    monetizationContent: {
      label: '수익화 콘텐츠 + 콘텐츠 빌더',
      description: '블로그, 뉴스레터, 전자책, 제휴 콘텐츠용',
      stack: {
        script: ['claude','openai','gemini'],
        image:  ['pexels','ideogram','flux'],
        voice:  ['openaiTts','elevenlabs'],
        video:  ['creatomate'],
        music:  ['freeBgm'],
      },
      preference: { script:'quality', image:'budget', voice:'balanced', video:'budget', music:'budget' },
      reason: '긴 글 구성과 문체 유지가 중요하므로 Claude를 우선하고, 이미지는 스톡과 썸네일용 Ideogram을 추천합니다.',
    },
    smallBusiness: {
      label: '소상공인 패키지',
      description: '상세페이지, 메뉴판, 카드뉴스, 홍보글, 숏폼용',
      stack: {
        script: ['openai','claude','gemini'],
        image:  ['pexels','flux','ideogram'],
        voice:  ['openaiTts','elevenlabs'],
        video:  ['creatomate','invideo'],
        music:  ['freeBgm'],
      },
      preference: { script:'balanced', image:'budget', voice:'balanced', video:'budget', music:'budget' },
      reason: '소상공인은 빠른 결과물과 비용 효율이 중요하므로 OpenAI, 스톡 이미지, Creatomate 조합이 현실적입니다.',
    },
    publicInstitution: {
      label: '공공기관 패키지',
      description: '공지문, 보도자료, 카드뉴스, FAQ, 민원 안내용',
      stack: {
        script: ['claude','openai','gemini'],
        image:  ['pexels','ideogram','geminiImagen'],
        voice:  ['openaiTts','elevenlabs'],
        video:  ['creatomate'],
        music:  ['freeBgm'],
      },
      preference: { script:'quality', image:'budget', voice:'balanced', video:'budget', music:'budget' },
      reason: '공공기관은 신뢰성, 문체, 검수 가능성이 중요하므로 Claude/OpenAI와 안정적인 스톡/카드뉴스 이미지를 추천합니다.',
    },
  };
  window.MOCA_RECOMMENDED_STACKS = STACKS;

  /* ════════════════════════════════════════════════
     3) Helpers
     ════════════════════════════════════════════════ */
  function getProviderMeta(category, providerId) {
    return (META[category] && META[category][providerId]) || null;
  }
  window.getProviderMeta = getProviderMeta;

  function getRecommendedStack(presetId) {
    return STACKS[presetId] || null;
  }
  window.getRecommendedStack = getRecommendedStack;

  function getProviderKeyStatus(category, providerId) {
    var m = getProviderMeta(category, providerId);
    if (!m) return { ok:false, label:'정보 없음' };
    if (!m.legacyKey) return { ok:true,  label:'🆓 키 불필요' };
    try {
      var v = localStorage.getItem(m.legacyKey);
      if (v && v.length > 6) return { ok:true,  label:'✅ 저장됨' };
      return                 { ok:false, label:'⚠️ 키 없음' };
    } catch(_) { return { ok:false, label:'?' }; }
  }
  window.getProviderKeyStatus = getProviderKeyStatus;

  /* ── apiPreference 저장 (모드별 가중치) ── */
  const PREF_KEY = 'moca_api_preference_v1';
  function getApiPreference() {
    try {
      var v = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
      return Object.assign({ script:'balanced', image:'budget', voice:'balanced', video:'budget', music:'budget' }, v || {});
    } catch(_) { return { script:'balanced', image:'budget', voice:'balanced', video:'budget', music:'budget' }; }
  }
  function setApiPreference(category, mode) {
    if (!['budget','balanced','quality','speed','premium','bulk'].includes(mode)) return false;
    var cur = getApiPreference();
    if (category === 'all') { ['script','image','voice','video','music'].forEach(function(c){ cur[c] = mode; }); }
    else cur[category] = mode;
    try { localStorage.setItem(PREF_KEY, JSON.stringify(cur)); return true; } catch(_) { return false; }
  }
  window.getApiPreference = getApiPreference;
  window.setApiPreference = setApiPreference;

  /* ── 스택 프리셋 적용 — preference + STUDIO.project 에 1순위 자동 채택 ── */
  function applyStackPreset(presetId, opts) {
    opts = opts || {};
    var s = STACKS[presetId]; if (!s) return false;
    /* 1) preference 저장 */
    Object.keys(s.preference || {}).forEach(function(c){ setApiPreference(c, s.preference[c]); });
    /* 2) STUDIO.project 에 1순위 적재 */
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    proj.s1 = proj.s1 || {}; proj.s2 = proj.s2 || {}; proj.s3 = proj.s3 || {}; proj.s4 = proj.s4 || {};
    if (s.stack.script && s.stack.script[0]) proj.s1.scriptProvider = s.stack.script[0];
    if (s.stack.voice  && s.stack.voice[0])  proj.s2.voiceProvider  = s.stack.voice[0];
    if (s.stack.image  && s.stack.image[0])  proj.s3.imageProvider  = s.stack.image[0];
    if (s.stack.video  && s.stack.video[0])  proj.s4.videoProvider  = s.stack.video[0];
    if (s.stack.music  && s.stack.music[0])  proj.musicProvider     = s.stack.music[0];
    proj.appliedStackPreset = presetId;
    if (typeof window.studioSave === 'function') window.studioSave();
    if (opts.toast !== false && typeof ucShowToast === 'function') {
      ucShowToast('✅ ' + s.label + ' 프리셋 적용됨', 'success');
    }
    /* 3) 추천 카드 갱신 */
    if (typeof window.renderStudio === 'function') window.renderStudio();
    return true;
  }
  window.applyStackPreset = applyStackPreset;

  /* ════════════════════════════════════════════════
     4) 콘텐츠 종류별 추천 (단계 UI 가 호출)
     getApiRecommendations(category, taskKey) →
       [{ rank, providerId, label, reason, priceTier, qualityTier,
          speedTier, strengths, bestFor, hasKey }]
     ════════════════════════════════════════════════ */
  function getApiRecommendations(category, taskKey, opts) {
    opts = opts || {};
    /* 1) 명시 프리셋 우선 */
    var presetId = opts.presetId || (window.STUDIO && window.STUDIO.project && window.STUDIO.project.appliedStackPreset);
    var preset   = presetId ? STACKS[presetId] : null;
    if (preset && preset.stack[category]) {
      var ids = preset.stack[category];
      return ids.map(function(pid, i){
        var m = getProviderMeta(category, pid) || { label: pid };
        var status = getProviderKeyStatus(category, pid);
        return {
          rank: i + 1, providerId: pid,
          label: m.label || pid, reason: preset.reason || '',
          priceTier: m.priceTier, qualityTier: m.qualityTier, speedTier: m.speedTier,
          strengths: m.strengths || [], bestFor: m.bestFor || [],
          hasKey: status.ok, keyLabel: status.label,
        };
      });
    }
    /* 2) 호환 — 기존 api-recommendations.js 의 큐레이션 사용 */
    if (typeof window.MOCA_TASK_RECOMMENDATIONS !== 'undefined' && window.MOCA_TASK_RECOMMENDATIONS[category]) {
      var legacy = window.MOCA_TASK_RECOMMENDATIONS[category];
      var task = legacy[taskKey] || legacy[Object.keys(legacy)[0]];
      if (task) {
        return (task.recommended || []).map(function(pid, i){
          /* legacy id → 신규 META id 매핑 */
          var idMap = { stable:'stable', geminiImg:'geminiImagen' };
          var nid = idMap[pid] || pid;
          var m = getProviderMeta(category, nid) || { label: pid };
          var status = getProviderKeyStatus(category, nid);
          return {
            rank: i + 1, providerId: nid,
            label: m.label || pid, reason: task.reason,
            priceTier: m.priceTier, qualityTier: m.qualityTier, speedTier: m.speedTier,
            strengths: m.strengths || [], bestFor: m.bestFor || [],
            hasKey: status.ok, keyLabel: status.label,
          };
        });
      }
    }
    /* 3) fallback — META 의 첫 3개 */
    var keys = Object.keys(META[category] || {}).slice(0, 3);
    return keys.map(function(pid, i){
      var m = META[category][pid];
      var status = getProviderKeyStatus(category, pid);
      return {
        rank: i + 1, providerId: pid,
        label: m.label, reason: '', priceTier: m.priceTier,
        qualityTier: m.qualityTier, speedTier: m.speedTier,
        strengths: m.strengths || [], bestFor: m.bestFor || [],
        hasKey: status.ok, keyLabel: status.label,
      };
    });
  }
  /* getApiRecommendations 는 기존 api-recommendations.js 가 이미 정의했을 수 있음 —
     덮어쓰기 안 하고 새 이름으로도 노출 */
  window.getApiRecommendationsV2 = getApiRecommendations;
  if (!window.getApiRecommendations || window.getApiRecommendations.length < 2) {
    window.getApiRecommendations = getApiRecommendations;
  }

  /* ════════════════════════════════════════════════
     5) 비용 경고 정책 (이미지·영상)
     ════════════════════════════════════════════════ */
  function isHighCostTier(tier) { return tier === 'high' || tier === 'premium'; }
  function warnHighCostUsage(category, providerIds) {
    var costly = providerIds.filter(function(pid){
      var m = getProviderMeta(category, pid);
      return m && isHighCostTier(m.priceTier);
    });
    if (costly.length === providerIds.length && providerIds.length > 1) {
      return {
        warn: true,
        message: category === 'image'
          ? '⚠️ 모든 씬에 고비용 이미지 API를 사용 중입니다. 비용 절감을 위해 일반 씬은 저비용 API, 핵심컷만 고품질 API 사용을 권장합니다.'
          : '⚠️ 모든 씬을 AI 영상으로 변환하면 비용이 크게 증가합니다. 기본은 템플릿 조립, 핵심 장면만 AI 영상화를 권장합니다.',
      };
    }
    return { warn: false };
  }
  window.warnHighCostUsage = warnHighCostUsage;

  /* ── 라벨 헬퍼 ── */
  function priceTierLabel(t) { return ({free:'무료', low:'저비용', medium:'중간', 'medium-high':'중간↑', high:'고비용', premium:'프리미엄'})[t] || t || '?'; }
  function qualityTierLabel(t){ return ({basic:'기본', good:'좋음', high:'높음', premium:'최상'})[t] || t || '?'; }
  function speedTierLabel(t)  { return ({slow:'느림', medium:'보통', high:'빠름'})[t] || t || '?'; }
  window.priceTierLabel   = priceTierLabel;
  window.qualityTierLabel = qualityTierLabel;
  window.speedTierLabel   = speedTierLabel;
})();
