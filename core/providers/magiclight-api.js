/* ================================================
   core/providers/magiclight-api.js
   Magiclight 영상 provider 어댑터 — 실험적

   * 공식 API endpoint / 인증 방식이 코드에 반영되기 전에는
     dry-run mode 로만 동작 (payload preview).
   * 사용자가 통합 API 설정 'video.magiclight' 에 baseUrl + endpoints
     를 입력해야 실제 fetch 활성.
   * 보안: API key 원문은 console / alert / DOM 노출 금지.
   ================================================ */
(function(){
  'use strict';

  /* ── endpoint 기본값 — 모두 비워둠. 사용자가 통합 설정에서 입력 ── */
  var MAGICLIGHT_DEFAULT_ENDPOINTS = {
    health:               '',  /* 예: GET /health */
    createStoryVideo:     '',  /* 예: POST /v1/jobs/story */
    createTextToVideo:    '',  /* 예: POST /v1/jobs/text-to-video */
    createImageToVideo:   '',  /* 예: POST /v1/jobs/image-to-video */
    getJob:               '',  /* 예: GET  /v1/jobs/{id} */
    cancelJob:            '',  /* 예: POST /v1/jobs/{id}/cancel */
  };

  /* ────────────────────────────────────────
     설정 읽기 — 통합 store 우선, legacy fallback
     ──────────────────────────────────────── */
  function getMagiclightProviderConfig() {
    var cfg = { apiKey:'', baseUrl:'', endpoints:{}, authHeader:'Bearer', source:'(none)' };
    if (typeof window.getApiProvider === 'function') {
      var prov = window.getApiProvider('video', 'magiclight');
      if (prov && prov.apiKey) {
        cfg.apiKey   = prov.apiKey;
        cfg.baseUrl  = prov.baseUrl   || '';
        cfg.endpoints= Object.assign({}, MAGICLIGHT_DEFAULT_ENDPOINTS, prov.endpoints || {});
        cfg.authHeader = prov.authHeader || 'Bearer';
        cfg.source = 'unified-store';
        return cfg;
      }
    }
    /* legacy localStorage */
    var lk = localStorage.getItem('uc_magiclight_key') || '';
    if (lk) {
      cfg.apiKey  = lk;
      cfg.baseUrl = localStorage.getItem('uc_magiclight_base') || '';
      cfg.source  = 'legacy';
      cfg.endpoints = Object.assign({}, MAGICLIGHT_DEFAULT_ENDPOINTS);
    }
    return cfg;
  }
  window.getMagiclightProviderConfig = getMagiclightProviderConfig;

  function _ready() {
    var c = getMagiclightProviderConfig();
    return !!c.apiKey;
  }
  function _endpointsConfigured(cfg) {
    cfg = cfg || getMagiclightProviderConfig();
    /* 최소 createTextToVideo + getJob + baseUrl 이 있어야 실호출 가능 */
    return !!(cfg.baseUrl && (cfg.endpoints.createTextToVideo || cfg.endpoints.createStoryVideo || cfg.endpoints.createImageToVideo) && cfg.endpoints.getJob);
  }
  window._magiclightEndpointsConfigured = _endpointsConfigured;

  /* ── auth header 적용 ── */
  function _authHeaders(cfg) {
    var h = { 'Content-Type':'application/json', 'Accept':'application/json' };
    if (!cfg || !cfg.apiKey) return h;
    var t = String(cfg.authHeader || 'Bearer').toLowerCase();
    if (t === 'bearer')  h['Authorization'] = 'Bearer ' + cfg.apiKey;
    else if (t === 'x-api-key') h['x-api-key'] = cfg.apiKey;
    else if (t === 'apikey')    h['Apikey']    = cfg.apiKey;
    else h['Authorization'] = 'Bearer ' + cfg.apiKey;
    return h;
  }

  /* ────────────────────────────────────────
     연결 테스트 — health endpoint 호출 (없으면 endpoint 미설정 안내)
     ──────────────────────────────────────── */
  async function testMagiclightConnection() {
    var cfg = getMagiclightProviderConfig();
    if (!cfg.apiKey) return { ok:false, reason:'API 키 없음' };
    if (!cfg.baseUrl) return { ok:false, reason:'Base URL 미설정 — 통합 API 설정에서 입력' };
    if (!cfg.endpoints.health) return { ok:false, reason:'health endpoint 미설정 (공식 문서 확인 필요)', dryRun:true };
    try {
      var url = cfg.baseUrl.replace(/\/$/,'') + '/' + String(cfg.endpoints.health).replace(/^\//,'');
      var r = await fetch(url, { method:'GET', headers: _authHeaders(cfg) });
      try { console.debug('[magiclight] health status:', r.status); } catch(_) {}
      return { ok: r.ok, status: r.status };
    } catch(e) {
      return { ok:false, reason: e && e.message || String(e) };
    }
  }
  window.testMagiclightConnection = testMagiclightConnection;

  /* ────────────────────────────────────────
     payload 빌더 — 모드별 + project 데이터에서
     ──────────────────────────────────────── */
  function buildMagiclightPayloadFromProject(mode, sceneIndex) {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s1 = proj.s1 || {}, s3 = proj.s3 || {};
    var aspect = '9:16';
    var lang = proj.lang || 'ko';
    var style = proj.style || s1.style || 'general';

    if (mode === 'story_to_video') {
      var scenes = (typeof window.resolveStudioScenes === 'function') ? window.resolveStudioScenes() : (proj.scenes || []);
      return {
        mode: 'story_to_video',
        title: s1.topic || proj.topic || proj.title || '',
        topic: s1.topic || proj.topic || '',
        scriptText: proj.scriptText || s1.scriptKo || '',
        scenes: scenes.map(function(sc){
          return {
            sceneIndex: sc.sceneIndex,
            sceneNumber: sc.sceneNumber,
            role: sc.role || '',
            narration: sc.narration || '',
            visualDescription: sc.visualDescription || '',
          };
        }),
        style: style,
        language: lang,
        aspectRatio: aspect,
        durationSec: proj.lengthSec || 60,
        captions: true,
        voice: false,
        music: false,
        meta: { source: 'shorts-studio', step: 's4-magiclight' },
      };
    }
    if (mode === 'scene_text_to_video') {
      var scenes2 = (typeof window.resolveStudioScenes === 'function') ? window.resolveStudioScenes() : (proj.scenes || []);
      var sc = scenes2[sceneIndex] || null;
      if (!sc) return null;
      var scenePrompt = (s3.scenePrompts && s3.scenePrompts[sceneIndex]) || {};
      var videoPrompt = sc.videoPrompt || scenePrompt.videoPrompt || (s3.videoPrompts && s3.videoPrompts[sceneIndex]) || sc.imagePrompt || sc.visualDescription || sc.narration || '';
      return {
        mode: 'scene_text_to_video',
        sceneIndex: sceneIndex,
        sceneNumber: sc.sceneNumber,
        videoPrompt: videoPrompt,
        caption: sc.caption || scenePrompt.caption || '',
        visualDescription: sc.visualDescription || '',
        motionStyle: sc.motionStyle || scenePrompt.motionStyle || '',
        sfxCue: sc.soundCue || scenePrompt.sfxCue || '',
        captionSafeArea: scenePrompt.captionSafeArea !== false,
        style: style,
        language: lang,
        aspectRatio: aspect,
        durationSec: 5,
        meta: { source: 'shorts-studio', step: 's4-magiclight', sceneRole: sc.role || '' },
      };
    }
    if (mode === 'image_to_video') {
      var scenes3 = (typeof window.resolveStudioScenes === 'function') ? window.resolveStudioScenes() : (proj.scenes || []);
      var sc3 = scenes3[sceneIndex] || null;
      if (!sc3) return null;
      var slot = (s3.imagesV3 && s3.imagesV3[sceneIndex]) || {};
      var img  = (slot.adopted && (slot.candidates || []).find(function(c){ return c.id === slot.adopted; })) || slot.selectedCandidate;
      var imgUrl = img ? (img.fullUrl || img.url || img.previewUrl || img.thumbUrl) : '';
      var motionPrompt = sc3.motionStyle || (s3.scenePrompts && s3.scenePrompts[sceneIndex] && s3.scenePrompts[sceneIndex].motionStyle) || 'subtle parallax with gentle camera move';
      return {
        mode: 'image_to_video',
        sceneIndex: sceneIndex,
        sceneNumber: sc3.sceneNumber,
        imageUrl: imgUrl,
        videoPrompt: sc3.videoPrompt || '',
        motionPrompt: motionPrompt,
        cameraMotion: 'gentle pan',
        aspectRatio: aspect,
        durationSec: 5,
        meta: { source: 'shorts-studio', step: 's4-magiclight', sceneRole: sc3.role || '' },
      };
    }
    return null;
  }
  window.buildMagiclightPayloadFromProject = buildMagiclightPayloadFromProject;

  /* ────────────────────────────────────────
     create job — endpoint 미설정 시 dry-run
     ──────────────────────────────────────── */
  async function createMagiclightJob(payload, options) {
    options = options || {};
    var cfg = getMagiclightProviderConfig();
    var dryRun = !!options.dryRun;
    if (!cfg.apiKey) {
      return { ok:false, dryRun:true, reason:'API 키 없음 — 통합 API 설정에서 등록해주세요.', payload: payload };
    }
    if (!_endpointsConfigured(cfg) || dryRun) {
      try { console.debug('[magiclight] dry-run mode — endpoint 미설정 또는 dryRun 옵션'); } catch(_) {}
      return { ok:false, dryRun:true, reason:'Magiclight API endpoint 가 설정되지 않았습니다. 공식 API 문서를 확인한 뒤 통합 API 설정에서 Base URL/endpoint 를 입력해주세요.', payload: payload };
    }
    var ep = (payload && payload.mode === 'story_to_video') ? cfg.endpoints.createStoryVideo
           : (payload && payload.mode === 'image_to_video') ? cfg.endpoints.createImageToVideo
           : cfg.endpoints.createTextToVideo;
    if (!ep) return { ok:false, reason:'해당 모드 endpoint 미설정', payload: payload };
    try {
      var url = cfg.baseUrl.replace(/\/$/,'') + '/' + String(ep).replace(/^\//,'');
      var r = await fetch(url, {
        method:'POST', headers: _authHeaders(cfg), body: JSON.stringify(payload),
      });
      var data = null; try { data = await r.json(); } catch(_) {}
      try {
        console.debug('[magiclight] provider ready:', !!cfg.apiKey);
        console.debug('[magiclight] mode:', payload && payload.mode);
        console.debug('[magiclight] job id exists:', !!(data && (data.jobId || data.id || data.job_id)));
      } catch(_) {}
      if (!r.ok) return { ok:false, status:r.status, reason: (data && (data.message || data.error)) || ('HTTP '+r.status), payload: payload };
      return { ok:true, jobId: (data && (data.jobId || data.id || data.job_id)) || '', raw: data };
    } catch(e) {
      return { ok:false, reason: e && e.message || String(e), payload: payload };
    }
  }
  window.createMagiclightJob = createMagiclightJob;

  /* ────────────────────────────────────────
     poll / get / cancel
     ──────────────────────────────────────── */
  async function getMagiclightJobResult(jobId) {
    var cfg = getMagiclightProviderConfig();
    if (!cfg.apiKey || !cfg.baseUrl || !cfg.endpoints.getJob) {
      return { ok:false, dryRun:true, reason:'getJob endpoint 미설정' };
    }
    if (!jobId) return { ok:false, reason:'jobId 없음' };
    var url = cfg.baseUrl.replace(/\/$/,'') + '/' + String(cfg.endpoints.getJob).replace('{id}', encodeURIComponent(jobId)).replace(/^\//,'');
    try {
      var r = await fetch(url, { method:'GET', headers: _authHeaders(cfg) });
      var data = null; try { data = await r.json(); } catch(_) {}
      if (!r.ok) return { ok:false, status:r.status, reason:(data && (data.message||data.error))||('HTTP '+r.status) };
      return { ok:true, raw: data, normalized: normalizeMagiclightResult(data) };
    } catch(e) { return { ok:false, reason: e && e.message || String(e) }; }
  }
  window.getMagiclightJobResult = getMagiclightJobResult;

  async function pollMagiclightJob(jobId, options) {
    options = options || {};
    var maxAttempts = options.maxAttempts || 30;
    var intervalMs  = options.intervalMs  || 4000;
    for (var i = 0; i < maxAttempts; i++) {
      var res = await getMagiclightJobResult(jobId);
      if (!res.ok) return res;
      var st = res.normalized && res.normalized.status;
      if (st === 'succeeded' || st === 'failed' || st === 'cancelled') return res;
      if (typeof options.onTick === 'function') options.onTick(i, res);
      await new Promise(function(r){ setTimeout(r, intervalMs); });
    }
    return { ok:false, reason:'polling timeout', timedOut:true };
  }
  window.pollMagiclightJob = pollMagiclightJob;

  async function cancelMagiclightJob(jobId) {
    var cfg = getMagiclightProviderConfig();
    if (!cfg.apiKey || !cfg.baseUrl || !cfg.endpoints.cancelJob) {
      return { ok:false, dryRun:true, reason:'cancelJob endpoint 미설정' };
    }
    var url = cfg.baseUrl.replace(/\/$/,'') + '/' + String(cfg.endpoints.cancelJob).replace('{id}', encodeURIComponent(jobId)).replace(/^\//,'');
    try {
      var r = await fetch(url, { method:'POST', headers: _authHeaders(cfg) });
      return { ok: r.ok, status: r.status };
    } catch(e) { return { ok:false, reason: e && e.message || String(e) }; }
  }
  window.cancelMagiclightJob = cancelMagiclightJob;

  /* ────────────────────────────────────────
     normalize — 다양한 응답 형태 대응
     ──────────────────────────────────────── */
  function normalizeMagiclightResult(raw) {
    if (!raw || typeof raw !== 'object') return { status:'unknown' };
    var status = String(raw.status || raw.state || '').toLowerCase();
    if (status === 'queued' || status === 'pending') status = 'queued';
    else if (status === 'running' || status === 'processing' || status === 'in_progress') status = 'running';
    else if (status === 'succeeded' || status === 'success' || status === 'completed' || status === 'done') status = 'succeeded';
    else if (status === 'failed' || status === 'error') status = 'failed';
    else if (status === 'cancelled' || status === 'canceled') status = 'cancelled';
    var out = raw.output || raw.result || raw.data || {};
    var videoUrl = out.videoUrl || out.video_url || out.url || raw.videoUrl || raw.video_url || '';
    var thumbUrl = out.thumbUrl || out.thumb_url || out.posterUrl || out.poster_url || '';
    var width    = out.width || raw.width || 0;
    var height   = out.height || raw.height || 0;
    var dur      = out.durationSec || out.duration_sec || out.duration || raw.duration || 0;
    var credits  = raw.creditsUsed || raw.credits_used || raw.creditEstimate || raw.credit_estimate || null;
    return {
      status:      status || 'unknown',
      videoUrl:    videoUrl,
      thumbUrl:    thumbUrl,
      width:       width,
      height:      height,
      durationSec: dur,
      creditsUsed: credits,
      provider:    'magiclight',
    };
  }
  window.normalizeMagiclightResult = normalizeMagiclightResult;
})();
