/* ================================================
   modules/studio/s3-image-generation-router.js
   씬 이미지 생성 단일 라우터
   * window.generateSceneImage(sceneIndex, options)
       - 전체 이미지 생성 / 씬 모달 AI 생성이 모두 이 함수로 통일
   * window.generateImageWithProvider(providerId, prompt, options)
       - provider 별 어댑터 분기 + getApiProvider('image', id) 키 조회
   * provider id 정규화: dalle3/dalle2/flux/sd/stable/gemini/geminiImg/
                          geminiImagen/minimax/ideogram
   * MiniMax 는 이미지 capability false (영상 전용) — 호출 차단
   * 결과: STUDIO.project.s3.imagesV3[sceneIndex] 의 candidates 에 push,
           legacy s3.images / s3.adopted 동기화
   * 상태: imagesV3[sceneIndex].status = 'idle'|'generating'|'done'|'failed'
           lastError, lastErrorAt, lastGeneratedAt, provider
   ================================================ */
(function(){
  'use strict';

  /* ── provider 레지스트리 ───────────────────────────
     storeId  : getApiProvider('image', storeId) 로 통합 store 조회
     altStoreId: 동의어 (예: dalle3 ↔ openai_img, gemini ↔ gemini_imagen)
     legacyKey : localStorage uc_*_key 폴백
     image     : 이미지 생성 capability
     video     : 영상 생성 capability (참고용)
     adapter   : 호출할 어댑터 식별자
     model     : OpenAI 어댑터 model 이름
     label     : UI 표기용
  */
  /* priceKRW: 1장당 예상 KRW (UI 표시·비용 추산용 기본값).
     ProviderConfig.COST_RATES.image 의 USD 단가가 있으면 그것을 우선해서 환산.
     badge: UI 카드 라벨. note: 보조 설명. */
  var REGISTRY = {
    dalle3: {
      label:'DALL-E 3', adapter:'openai_image', model:'dall-e-3',
      storeId:'openai_img', altStoreId:'dalle3', legacyKey:'uc_openai_key',
      image:true, video:false, priceKRW:40, badge:'고품질', qualityTier:'premium', sortOrder:10
    },
    dalle2: {
      label:'DALL-E 2', adapter:'openai_image', model:'dall-e-2',
      storeId:'openai_img', altStoreId:'dalle2', legacyKey:'uc_openai_key',
      image:true, video:false, priceKRW:8, badge:'저비용 fallback', qualityTier:'legacy_fallback', sortOrder:90,
      note:'v4 권장 아님 — 저비용 테스트나 fallback 용도로만 사용하세요. 9:16 정사각 변환·세부 표현은 최신 모델이 우수합니다.'
    },
    flux: {
      label:'Flux', adapter:'flux',
      storeId:'flux', legacyKey:'uc_flux_key',
      image:true, video:false, priceKRW:15, badge:'시드고정', qualityTier:'premium', sortOrder:20
    },
    sd: {
      label:'Stable Diffusion', adapter:'stability',
      storeId:'sd', legacyKey:'uc_sd_key',
      image:true, video:false, priceKRW:3, badge:'최저가', qualityTier:'standard', sortOrder:40
    },
    stable: {
      label:'Stable Diffusion', adapter:'stability',
      storeId:'sd', legacyKey:'uc_sd_key',
      image:true, video:false, priceKRW:3, badge:'최저가', alias:'sd'
    },
    stableDiffusion: {
      label:'Stable Diffusion', adapter:'stability',
      storeId:'sd', legacyKey:'uc_sd_key',
      image:true, video:false, priceKRW:3, badge:'최저가', alias:'sd'
    },
    gemini: {
      label:'Gemini Imagen', adapter:'gemini_imagen',
      storeId:'gemini_imagen', altStoreId:'gemini', legacyKey:'uc_gemini_key',
      image:true, video:false, priceKRW:0, badge:'Gemini키', qualityTier:'premium', sortOrder:30
    },
    geminiImg: {
      label:'Gemini Imagen', adapter:'gemini_imagen',
      storeId:'gemini_imagen', altStoreId:'gemini', legacyKey:'uc_gemini_key',
      image:true, video:false, priceKRW:0, badge:'Gemini키', alias:'gemini'
    },
    geminiImagen: {
      label:'Gemini Imagen', adapter:'gemini_imagen',
      storeId:'gemini_imagen', altStoreId:'gemini', legacyKey:'uc_gemini_key',
      image:true, video:false, priceKRW:0, badge:'Gemini키', alias:'gemini'
    },
    minimax: {
      label:'MiniMax', adapter:'minimax_image_unsupported',
      storeId:'minimax', legacyKey:'uc_minimax_key',
      image:false, video:true, priceKRW:10, badge:'영상특화', qualityTier:'video_only', sortOrder:80,
      note:'MiniMax 이미지 adapter 미구현 — 영상 생성 전용 provider 입니다.'
    },
    ideogram: {
      label:'Ideogram', adapter:'ideogram',
      storeId:'ideogram', legacyKey:'uc_ideogram_key',
      image:true, video:false, priceKRW:20, badge:'텍스트↑', qualityTier:'premium', sortOrder:25
    }
  };
  window.S3_IMAGE_PROVIDER_REGISTRY = REGISTRY;

  /* ── 가격 산정 — ProviderConfig.COST_RATES 가 있으면 그쪽 USD 단가 환산값 우선,
     없으면 REGISTRY 의 priceKRW 사용. UI 표시·예상비용에 모두 사용. */
  function _imagePriceKRW(providerId){
    var cfg = REGISTRY[providerId];
    if (!cfg) return 0;
    try {
      var rates = window.ProviderConfig && window.ProviderConfig.COST_RATES;
      if (rates && rates.image && cfg.model && rates.image[cfg.model]) {
        var fx  = rates.fxDefault || 1350;
        var per = rates.image[cfg.model].perImage || 0;
        return Math.round(per * fx);
      }
    } catch(_) {}
    return cfg.priceKRW || 0;
  }
  window.s3GetImageProviderPriceKRW = _imagePriceKRW;

  /* ── 이미지 생성 가능한 (별칭 제외) provider 카드 목록 — UI 빌더용 ──
     sortOrder 오름차순. premium 먼저, legacy_fallback (DALL-E 2) 마지막 */
  function _listImageProviders(){
    return Object.keys(REGISTRY).filter(function(id){
      var cfg = REGISTRY[id];
      return cfg && cfg.image !== false && !cfg.alias;
    }).map(function(id){
      var cfg = REGISTRY[id];
      var price = _imagePriceKRW(id);
      return {
        id: id, label: cfg.label,
        priceKRW: price,
        priceLabel: price === 0 ? '무료' : ('₩' + price + '/장'),
        badge: cfg.badge || '',
        note:  cfg.note  || '',
        qualityTier: cfg.qualityTier || 'standard',
        sortOrder:   cfg.sortOrder != null ? cfg.sortOrder : 50,
        legacyKey: cfg.legacyKey || ''
      };
    }).sort(function(a, b){ return a.sortOrder - b.sortOrder; });
  }
  window.s3ListImageProviders = _listImageProviders;

  /* DALL-E 2 가 default 로 선택되어 있고 키가 있으면 dalle3 로 자동 승격하는 헬퍼.
     사용자가 명시적으로 dalle2 선택한 경우는 변경하지 않음 — 호출부 책임. */
  function _suggestUpgradeFromDalle2(){
    var s3 = (window.STUDIO && window.STUDIO.project && window.STUDIO.project.s3) || {};
    if (s3.api !== 'dalle2') return null;
    /* dalle3 또는 flux 등 키 존재시 권장 */
    var alts = ['dalle3','flux','geminiImagen','ideogram'];
    for (var i = 0; i < alts.length; i++) {
      try {
        if (typeof window.s3HasImageProviderKey === 'function' && window.s3HasImageProviderKey(alts[i])) return alts[i];
      } catch(_) {}
    }
    return null;
  }
  window.s3SuggestUpgradeFromDalle2 = _suggestUpgradeFromDalle2;

  function _resolveCfg(providerId){
    if (!providerId) return null;
    if (REGISTRY[providerId]) return REGISTRY[providerId];
    /* 별칭/대소문자 정규화 */
    var lc = String(providerId).toLowerCase();
    if (REGISTRY[lc]) return REGISTRY[lc];
    return null;
  }
  window.s3ResolveImageProviderConfig = _resolveCfg;

  function _proj(){ return (window.STUDIO && window.STUDIO.project) || {}; }
  function _s3(){ var p = _proj(); p.s3 = p.s3 || {}; return p.s3; }

  /* ── 현재 선택된 image provider id ── */
  function getSelectedImageProviderId(){
    var s3 = _s3();
    var p = _proj();
    return s3.imageProvider || s3.api || s3.selectedImageProvider ||
           (p.appliedStackPreset && p.appliedStackPreset.imageProvider) ||
           'dalle3';
  }
  window.getSelectedImageProviderId = getSelectedImageProviderId;

  /* ── provider 별 API 키 — getApiProvider('image', id) 우선 ── */
  function _getKey(providerId){
    var cfg = _resolveCfg(providerId);
    if (!cfg) return '';
    /* 1) 통합 store */
    if (typeof window.getApiProvider === 'function') {
      var p = window.getApiProvider('image', cfg.storeId);
      if (p && p.apiKey && String(p.apiKey).length > 4) return String(p.apiKey).trim();
      if (cfg.altStoreId) {
        var p2 = window.getApiProvider('image', cfg.altStoreId);
        if (p2 && p2.apiKey && String(p2.apiKey).length > 4) return String(p2.apiKey).trim();
      }
      /* 공유 키 — script.openai / script.gemini 도 폴백 */
      if (cfg.legacyKey === 'uc_openai_key') {
        var so = window.getApiProvider('script', 'openai');
        if (so && so.apiKey && so.apiKey.length > 4) return String(so.apiKey).trim();
      }
      if (cfg.legacyKey === 'uc_gemini_key') {
        var sg = window.getApiProvider('script', 'gemini');
        if (sg && sg.apiKey && sg.apiKey.length > 4) return String(sg.apiKey).trim();
      }
    }
    /* 2) APIAdapter (script provider 키 통합) */
    if (window.APIAdapter && typeof window.APIAdapter.getApiKey === 'function') {
      if (cfg.legacyKey === 'uc_openai_key') {
        var k1 = window.APIAdapter.getApiKey('openai');
        if (k1 && k1.length > 4) return k1.trim();
      }
      if (cfg.legacyKey === 'uc_gemini_key') {
        var k2 = window.APIAdapter.getApiKey('gemini');
        if (k2 && k2.length > 4) return k2.trim();
      }
    }
    /* 3) legacy uc_*_key */
    try {
      var lk = localStorage.getItem(cfg.legacyKey);
      if (lk && lk.trim().length > 4) return lk.trim();
    } catch(_) {}
    return '';
  }
  window.s3GetImageApiKey = _getKey;

  function s3HasImageProviderKey(providerId){
    return !!_getKey(providerId);
  }
  /* s3-image-keys.js 가 이미 window.s3HasImageApiKey 를 정의했지만,
     router 의 정규화된 판정도 별도로 노출 */
  window.s3HasImageProviderKey = s3HasImageProviderKey;

  /* ── 프롬프트 우선순위 ──
     1) 모달 textarea 라이브 값  (s3d-prompt-INDEX)
     2) 카드 textarea 라이브 값   (s3-prompt-INDEX)
     3) imagesV3[i].prompt
     4) s3.imagePrompts[i]
     5) s3.prompts[i]
     6) scene.imagePrompt / visual_description / prompt
  */
  function _readPrompt(sceneIndex){
    var s3 = _s3();
    try {
      var de = document.getElementById('s3d-prompt-' + sceneIndex);
      if (de && de.value && de.value.trim()) return de.value.trim();
    } catch(_){}
    try {
      var ce = document.getElementById('s3-prompt-' + sceneIndex);
      if (ce && ce.value && ce.value.trim()) return ce.value.trim();
    } catch(_){}
    var slot = (s3.imagesV3 || {})[sceneIndex];
    if (slot && slot.prompt && String(slot.prompt).trim()) return String(slot.prompt).trim();
    if ((s3.imagePrompts||[])[sceneIndex])  return String(s3.imagePrompts[sceneIndex]).trim();
    if ((s3.prompts||[])[sceneIndex])       return String(s3.prompts[sceneIndex]).trim();
    var sc = (s3.scenes||[])[sceneIndex] || {};
    return String(sc.imagePrompt || sc.visual_description || sc.prompt_en || sc.prompt || '').trim();
  }

  /* ── 슬롯 status 갱신 ── */
  function _setStatus(sceneIndex, patch){
    var s3 = _s3();
    s3.imagesV3 = s3.imagesV3 || {};
    var slot = s3.imagesV3[sceneIndex] || {
      prompt:'', selectedCandidateId:'', skipped:false, candidates:[],
      transform:{ fit:'contain', scale:1, offsetX:0, offsetY:0, cropPreset:'center' }
    };
    Object.keys(patch).forEach(function(k){ slot[k] = patch[k]; });
    s3.imagesV3[sceneIndex] = slot;
    if (typeof window.studioSave === 'function') { try { window.studioSave(); } catch(_){} }
    /* drawer 가 열려 있으면 부분 새로고침 */
    if (typeof window.s3RefreshDetail === 'function' && window._s3OpenSceneIdx === sceneIndex) {
      try { window.s3RefreshDetail(sceneIndex); } catch(_){}
    }
  }
  window.s3SetSceneImageStatus = _setStatus;

  /* ── 토스트/알림 helper ── */
  function _toast(msg, kind){
    if (typeof window.ucShowToast === 'function') {
      try { window.ucShowToast(msg, kind || 'info'); } catch(_){}
    }
  }
  function _err(sceneIndex, msg){
    _toast('❌ 씬 ' + (sceneIndex+1) + ' 이미지 생성 실패: ' + msg, 'error');
  }

  /* ════════════════════════════════════════════════
     Adapters
     ════════════════════════════════════════════════ */

  /* 사이즈를 OpenAI 가 허용하는 값으로 보정 */
  function _normalizeOpenAISize(model, size){
    var sizeStr = (size && size.w && size.h) ? (size.w + 'x' + size.h) : '1024x1024';
    if (model === 'dall-e-2') {
      var allowed2 = ['256x256','512x512','1024x1024'];
      if (allowed2.indexOf(sizeStr) === -1) sizeStr = '1024x1024';
      return sizeStr;
    }
    /* dall-e-3 */
    var allowed3 = ['1024x1024','1024x1792','1792x1024'];
    if (allowed3.indexOf(sizeStr) === -1) {
      if (size.h > size.w)      sizeStr = '1024x1792';
      else if (size.w > size.h) sizeStr = '1792x1024';
      else                      sizeStr = '1024x1024';
    }
    return sizeStr;
  }

  async function _adapterOpenAI(providerId, prompt, opts){
    var cfg = _resolveCfg(providerId);
    var sizeStr = _normalizeOpenAISize(cfg.model, opts.size || {});
    var dims = sizeStr.split('x').map(Number);
    var res = await fetch('https://api.openai.com/v1/images/generations', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + opts.apiKey
      },
      body: JSON.stringify({
        model:  cfg.model,
        prompt: prompt,
        n:      1,
        size:   sizeStr
      })
    });
    var d = null;
    try { d = await res.json(); } catch(_) {}
    if (!res.ok) {
      throw new Error((d && d.error && d.error.message) || ('HTTP ' + res.status));
    }
    var url = d && d.data && d.data[0] && d.data[0].url;
    var b64 = d && d.data && d.data[0] && d.data[0].b64_json;
    if (!url && b64) url = 'data:image/png;base64,' + b64;
    if (!url) throw new Error('OpenAI 응답에 image URL 이 없습니다');
    return { provider: providerId, url: url, width: dims[0], height: dims[1] };
  }

  async function _adapterGeminiImagen(providerId, prompt, opts){
    var aspectRatio = (typeof window.s3GetAspectRatio === 'function')
      ? window.s3GetAspectRatio(opts.aspectMode || 'shorts')
      : '9:16';
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=' +
              encodeURIComponent(opts.apiKey);
    var body = {
      instances: [{ prompt: prompt }],
      parameters: { sampleCount: 1, aspectRatio: aspectRatio }
    };
    var res = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    var d = null;
    try { d = await res.json(); } catch(_) {}
    if (!res.ok) {
      throw new Error((d && d.error && d.error.message) || ('HTTP ' + res.status));
    }
    var pred = d && d.predictions && d.predictions[0];
    var b64  = pred && (pred.bytesBase64Encoded || pred.image && pred.image.bytesBase64Encoded);
    if (!b64) throw new Error('Gemini Imagen 응답에 이미지가 없습니다');
    return {
      provider: providerId,
      url: 'data:image/png;base64,' + b64,
      b64: b64,
      width: (opts.size && opts.size.w) || 0,
      height:(opts.size && opts.size.h) || 0
    };
  }

  async function _adapterFlux(providerId, prompt, opts){
    var size = opts.size || { w:768, h:1344 };
    /* Black Forest Labs (BFL) — Flux 1.1 Pro 비동기 API:
       POST https://api.bfl.ai/v1/flux-pro-1.1
       headers: x-key, accept */
    var submit = await fetch('https://api.bfl.ai/v1/flux-pro-1.1', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-key': opts.apiKey,
        'accept':'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        width:  size.w,
        height: size.h,
        prompt_upsampling: false,
        safety_tolerance:  2,
        output_format:     'png'
      })
    });
    var sd = null;
    try { sd = await submit.json(); } catch(_) {}
    if (!submit.ok) {
      var em = (sd && (sd.detail || sd.message)) || ('HTTP ' + submit.status);
      throw new Error('Flux: ' + em);
    }
    var taskId  = sd && (sd.id || sd.task_id);
    var pollUrl = sd && (sd.polling_url || sd.result_url);
    if (!pollUrl && !taskId) throw new Error('Flux 응답에 polling_url / id 가 없습니다');

    /* 최대 30초 폴링 */
    for (var i = 0; i < 20; i++) {
      await new Promise(function(r){ setTimeout(r, 1500); });
      var pollEndpoint = pollUrl
        ? pollUrl
        : ('https://api.bfl.ai/v1/get_result?id=' + encodeURIComponent(taskId));
      var pr = await fetch(pollEndpoint, {
        headers:{ 'x-key': opts.apiKey, 'accept':'application/json' }
      });
      var pd = null;
      try { pd = await pr.json(); } catch(_) {}
      var status = pd && (pd.status || pd.state) || '';
      if (status === 'Ready' || status === 'COMPLETED' || status === 'completed') {
        var rUrl = pd && pd.result && (pd.result.sample || pd.result.image_url || pd.result.url);
        if (rUrl) return { provider: providerId, url: rUrl, width: size.w, height: size.h };
        throw new Error('Flux 결과에 url 이 없습니다');
      }
      if (status === 'Error' || status === 'Failed' || status === 'Content Moderated') {
        throw new Error('Flux: ' + status);
      }
    }
    throw new Error('Flux 응답 대기 시간 초과');
  }

  async function _adapterStability(providerId, prompt, opts){
    /* Stability AI — Stable Image Core (multipart/form-data) */
    var aspectRatio = (typeof window.s3GetAspectRatio === 'function')
      ? window.s3GetAspectRatio(opts.aspectMode || 'shorts')
      : '9:16';
    var fd = new FormData();
    fd.append('prompt', prompt);
    fd.append('aspect_ratio', aspectRatio);
    fd.append('output_format', 'png');
    var res = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
      method:'POST',
      headers:{
        'Authorization':'Bearer ' + opts.apiKey,
        'Accept':'image/*'
      },
      body: fd
    });
    if (!res.ok) {
      var et = '';
      try { et = await res.text(); } catch(_) {}
      throw new Error('Stability: ' + (et || ('HTTP ' + res.status)).slice(0, 220));
    }
    var blob = await res.blob();
    var dataUrl = await new Promise(function(resolve, reject){
      var r = new FileReader();
      r.onload  = function(){ resolve(r.result); };
      r.onerror = function(e){ reject(e); };
      r.readAsDataURL(blob);
    });
    return {
      provider: providerId, url: dataUrl,
      width: (opts.size && opts.size.w) || 0,
      height:(opts.size && opts.size.h) || 0
    };
  }

  async function _adapterIdeogram(providerId, prompt, opts){
    /* Ideogram API V1 — POST https://api.ideogram.ai/generate
       headers: Api-Key, Content-Type */
    var ratio = (typeof window.s3GetAspectRatio === 'function')
      ? window.s3GetAspectRatio(opts.aspectMode || 'shorts')
      : '9:16';
    var aspectMap = {
      '9:16':'ASPECT_9_16', '16:9':'ASPECT_16_9',
      '1:1':'ASPECT_1_1',   '4:5':'ASPECT_4_5'
    };
    var aspect = aspectMap[ratio] || 'ASPECT_9_16';
    var res = await fetch('https://api.ideogram.ai/generate', {
      method:'POST',
      headers:{
        'Api-Key': opts.apiKey,
        'Content-Type':'application/json'
      },
      body: JSON.stringify({
        image_request: {
          prompt: prompt,
          aspect_ratio: aspect,
          model: 'V_2',
          magic_prompt_option: 'AUTO'
        }
      })
    });
    var d = null;
    try { d = await res.json(); } catch(_) {}
    if (!res.ok) {
      throw new Error((d && (d.error || d.message)) || ('HTTP ' + res.status));
    }
    var rUrl = d && d.data && d.data[0] && d.data[0].url;
    if (!rUrl) throw new Error('Ideogram 응답에 image url 이 없습니다');
    return {
      provider: providerId, url: rUrl,
      width: (opts.size && opts.size.w) || 0,
      height:(opts.size && opts.size.h) || 0
    };
  }

  async function _adapterMinimaxImageUnsupported(providerId){
    throw new Error('MiniMax 이미지 adapter 가 아직 구현되지 않았습니다. ' +
                    'MiniMax 는 영상 생성 전용입니다 — 이미지 탭에서는 다른 provider 를 선택하세요.');
  }

  async function generateImageWithProvider(providerId, prompt, opts){
    opts = opts || {};
    var cfg = _resolveCfg(providerId);
    if (!cfg) throw new Error('알 수 없는 이미지 provider: ' + providerId);
    if (cfg.image === false) {
      throw new Error(cfg.label + ' 는 이미지 생성을 지원하지 않습니다 (' + (cfg.note||'') + ')');
    }
    var key = opts.apiKey || _getKey(providerId);
    if (!key) throw new Error(cfg.label + ' API 키가 없습니다');
    opts.apiKey = key;

    if (cfg.adapter === 'openai_image')              return _adapterOpenAI(providerId, prompt, opts);
    if (cfg.adapter === 'gemini_imagen')             return _adapterGeminiImagen(providerId, prompt, opts);
    if (cfg.adapter === 'flux')                      return _adapterFlux(providerId, prompt, opts);
    if (cfg.adapter === 'stability')                 return _adapterStability(providerId, prompt, opts);
    if (cfg.adapter === 'ideogram')                  return _adapterIdeogram(providerId, prompt, opts);
    if (cfg.adapter === 'minimax_image_unsupported') return _adapterMinimaxImageUnsupported(providerId);
    throw new Error('이 provider 의 이미지 adapter 가 구현되지 않았습니다: ' + providerId);
  }
  window.generateImageWithProvider = generateImageWithProvider;

  /* ════════════════════════════════════════════════
     단일 라우터 — generateSceneImage(sceneIndex, options)
     ════════════════════════════════════════════════ */
  async function generateSceneImage(sceneIndex, options){
    options = options || {};
    sceneIndex = +sceneIndex;
    if (!Number.isInteger(sceneIndex) || sceneIndex < 0) {
      _toast('❌ sceneIndex 가 유효하지 않습니다', 'error');
      return null;
    }

    if (typeof window.s3NormalizeImageState === 'function') {
      try { window.s3NormalizeImageState(); } catch(_){}
    }
    var s3 = _s3();

    var providerId = options.providerId || getSelectedImageProviderId();
    var cfg = _resolveCfg(providerId);
    /* 보드/보드추천이 'sd' 대신 'stable' 을 저장한 경우 등 정규화된 cfg 를 따름 */
    try { console.debug('[image-gen] sceneIndex:', sceneIndex, '· provider:', providerId, '· source:', options.source||'card'); } catch(_){}
    if (!cfg) {
      _err(sceneIndex, '알 수 없는 provider: ' + providerId);
      _setStatus(sceneIndex, { status:'failed', lastError:'unknown-provider', lastErrorAt: Date.now() });
      return null;
    }
    if (cfg.image === false) {
      _err(sceneIndex, cfg.label + ' 는 이미지 생성을 지원하지 않습니다 (영상 전용)');
      _setStatus(sceneIndex, { status:'failed', provider: providerId,
                               lastError:'image-not-supported', lastErrorAt: Date.now() });
      return null;
    }

    var key = _getKey(providerId);
    try { console.debug('[image-gen] apiKey present:', !!key); } catch(_){}
    if (!key) {
      _setStatus(sceneIndex, { status:'failed', provider: providerId,
                               lastError:'no-api-key', lastErrorAt: Date.now() });
      var msg = cfg.label + ' API 키가 없습니다.\n통합 API 설정(이미지 탭) 을 열까요?';
      if (typeof confirm === 'function' && confirm(msg)) {
        if (typeof window.openApiSettingsModal === 'function') {
          window.openApiSettingsModal('image');
        }
      }
      return null;
    }

    var prompt = _readPrompt(sceneIndex);
    try { console.debug('[image-gen] prompt exists:', !!prompt); } catch(_){}
    if (!prompt) {
      /* 가능한 경우 자동 컴파일 시도 */
      if (typeof window.compileImagePromptV2 === 'function') {
        try { await window.compileImagePromptV2(sceneIndex); prompt = _readPrompt(sceneIndex); } catch(_){}
      } else if (typeof window.s3PromptCompileScene === 'function') {
        try { await window.s3PromptCompileScene(sceneIndex, 'image'); prompt = _readPrompt(sceneIndex); } catch(_){}
      }
    }
    if (!prompt) {
      _err(sceneIndex, '이미지 프롬프트가 없습니다. 먼저 프롬프트를 생성하거나 대본을 확인해주세요.');
      _setStatus(sceneIndex, { status:'failed', provider: providerId,
                               lastError:'no-prompt', lastErrorAt: Date.now() });
      return null;
    }

    /* 비율 키워드 자동 주입 + 화풍/조명 추가 */
    var mode = (typeof window.s3DetectAspectMode === 'function') ? window.s3DetectAspectMode() : 'shorts';
    if (typeof window.s3InjectAspectIntoPrompt === 'function') {
      prompt = window.s3InjectAspectIntoPrompt(prompt, mode);
    }
    var fullPrompt = prompt;
    if (s3.artStyle) fullPrompt += ', ' + s3.artStyle + ' style';
    if (s3.lighting) fullPrompt += ', ' + s3.lighting + ' lighting';
    if (!/high quality/i.test(fullPrompt)) fullPrompt += ', high quality';

    var size = (typeof window.s3GetImageSize === 'function')
      ? window.s3GetImageSize(mode, providerId)
      : { w: 1024, h: 1024, ratio: '1:1' };

    _setStatus(sceneIndex, { status:'generating', provider: providerId, lastError:null });
    _toast('⏳ 씬 ' + (sceneIndex+1) + ' 이미지 생성 중 (' + cfg.label + ')...', 'info');

    try {
      var result = await generateImageWithProvider(providerId, fullPrompt, {
        size: size, aspectMode: mode, ratio: (size && size.ratio) || '',
        apiKey: key
      });
      if (!result || !result.url) throw new Error('생성 결과가 비어있습니다');

      /* candidates 에 push, legacy s3.images / s3.adopted 동기화 */
      if (typeof window.s3AddCandidate === 'function') {
        window.s3AddCandidate(sceneIndex, result.url, {
          provider: providerId,
          aspectRatio: (size && size.ratio) || s3.aspectRatio || '',
          width:  result.width  || size.w || 0,
          height: result.height || size.h || 0
        });
      } else {
        s3.images  = s3.images  || []; s3.images[sceneIndex]  = result.url;
        s3.adopted = s3.adopted || []; s3.adopted[sceneIndex] = true;
      }

      /* 슬롯의 prompt 도 보존 (다음 호출 우선순위에 사용) */
      _setStatus(sceneIndex, {
        status:'done', provider: providerId,
        lastGeneratedAt: Date.now(), lastError: null,
        prompt: prompt
      });
      try { console.debug('[image-gen] result url present:', !!result.url); } catch(_){}
      _toast('✅ 씬 ' + (sceneIndex+1) + ' 이미지 생성 완료', 'success');

      /* 보드 + 모달 모두 갱신 */
      if (options.source !== 'bulk') {
        if (typeof window.renderStudio === 'function') {
          try { window.renderStudio(); } catch(_){}
        }
      }
      if (typeof window.s3RefreshDetail === 'function' && window._s3OpenSceneIdx === sceneIndex) {
        try { window.s3RefreshDetail(sceneIndex); } catch(_){}
      }
      return result;
    } catch (err) {
      var emsg = (err && err.message) ? err.message : String(err);
      try { console.debug('[image-gen] error:', emsg); } catch(_){}
      _setStatus(sceneIndex, { status:'failed', provider: providerId,
                               lastError: emsg, lastErrorAt: Date.now() });
      _err(sceneIndex, emsg);
      return null;
    }
  }
  window.generateSceneImage = generateSceneImage;

  /* ── 보드의 모달 AI 생성 위임 binding (다중 등록 방지) ── */
  function _bindDelegated(){
    if (window.__s3SceneGenerateBound) return;
    window.__s3SceneGenerateBound = true;
    document.addEventListener('click', function(e){
      var btn = e.target && e.target.closest && e.target.closest('[data-s3-scene-generate]');
      if (!btn) return;
      var idx = Number(btn.getAttribute('data-scene-index'));
      if (!Number.isInteger(idx) || idx < 0) return;
      e.preventDefault();
      generateSceneImage(idx, { source:'modal' });
    }, false);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _bindDelegated);
  } else {
    _bindDelegated();
  }
})();
