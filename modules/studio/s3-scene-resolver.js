/* ================================================
   modules/studio/s3-scene-resolver.js
   ⭐ Step 2 단일 씬 resolver v2 — 16단계 cascade + longest-array fallback

   * resolveStudioScenes() — 모든 알려진 씬 저장 위치를 길이 측정 후
     가장 신뢰도 높은 소스를 선택. 마지막 fallback 으로 가장 긴 배열 사용
   * 문자열/객체/혼합 입력 모두 정규화 (normalizeSceneArray)
   * getScenePrompt(idx, mediaType) — image 9단계 / video 6단계
   * getSceneByIndex / getSceneCount / getSceneLabel / getSceneRole
   * console.debug 만 사용. API 키·시크릿 절대 노출 금지.
   ================================================ */
(function(){
  'use strict';

  /* ── 역할 라벨 ── */
  var ROLE_LABEL = {
    hook:'훅', intro:'인트로', explain:'설명', detail:'설명',
    core:'핵심', main:'핵심', develop:'전개', develop2:'전개',
    cta:'CTA', summary:'정리', outro:'정리', resolve:'해결',
  };

  /* ── 텍스트 강제 변환 ── */
  function _coerceText(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v.trim();
    if (Array.isArray(v)) return v.map(_coerceText).filter(Boolean).join(' ').trim();
    if (typeof v === 'object') {
      return _coerceText(v.text || v.content || v.value || '');
    }
    return String(v).trim();
  }

  function _firstNonEmpty(arr) {
    for (var i = 0; i < arr.length; i++) {
      var v = _coerceText(arr[i]);
      if (v) return v;
    }
    return '';
  }

  function _len(v) {
    if (Array.isArray(v)) return v.length;
    if (v && typeof v === 'object') return Object.keys(v).length;
    return 0;
  }

  /* ════════════════════════════════════════════════
     normalizeSceneArray — string/object/혼합 → scene 객체 배열
     - string                → { imagePrompt }
     - { promptCompiled }    → { promptCompiled, imagePrompt:promptCompiled }
     - { prompt }            → { imagePrompt:prompt }
     - { imagePrompt }       → { imagePrompt }
     - { videoPrompt }       → { videoPrompt }
     - { narration_kr|narration|text } → { narration }
     - { visual_description|visualDescription } → { visualDescription }
     ════════════════════════════════════════════════ */
  function normalizeSceneArray(input, sourcePath) {
    if (!input) return [];
    /* imagesV3 객체 → 키 기준 배열 */
    var arr;
    if (Array.isArray(input)) {
      arr = input;
    } else if (typeof input === 'object') {
      var keys = Object.keys(input).map(Number).filter(function(n){return !isNaN(n);}).sort(function(a,b){return a-b;});
      arr = keys.map(function(k){ return input[k]; });
    } else {
      return [];
    }

    return arr.map(function(item, i){
      if (item == null) item = {};
      if (typeof item === 'string') {
        return { sceneNumber: i+1, imagePrompt: item.trim(), _synth:true, _from:sourcePath };
      }
      if (typeof item !== 'object') {
        return { sceneNumber: i+1, imagePrompt: String(item), _synth:true, _from:sourcePath };
      }
      var n = {
        sceneNumber: item.sceneNumber || item.no || item.number || (i+1),
        title:       item.title || item.label || item.name || '',
        role:        item.role || item.sceneRole || '',
        narration:   _firstNonEmpty([item.narration, item.narration_kr, item.narrationKo,
                                     item.text, item.script, item.lines, item.line,
                                     item.caption, item.desc, item.description]),
        visualDescription: _firstNonEmpty([item.visualDescription, item.visual_description,
                                          item.visual, item.scene_description, item.sceneDesc]),
        imagePrompt: _firstNonEmpty([item.imagePrompt, item.image_prompt, item.imgPrompt,
                                     item.prompt_en, item.prompt, item.promptKo]),
        videoPrompt: _firstNonEmpty([item.videoPrompt, item.video_prompt, item.vidPrompt]),
        promptCompiled: _firstNonEmpty([item.promptCompiled, item.compiled, item.compiledPrompt]),
        _from: sourcePath,
        raw: item,
      };
      /* promptCompiled 만 있고 imagePrompt 없으면 imagePrompt 로 채움 */
      if (!n.imagePrompt && n.promptCompiled) n.imagePrompt = n.promptCompiled;
      return n;
    });
  }
  window.normalizeSceneArray = normalizeSceneArray;

  /* ════════════════════════════════════════════════
     _gatherCandidateSources — 모든 알려진 위치의 길이 측정
     ════════════════════════════════════════════════ */
  function _gatherCandidateSources() {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s1 = proj.s1 || {}, s2 = proj.s2 || {}, s3 = proj.s3 || {};

    /* localStorage draft (현재 프로젝트) — proj 가 비어 있을 때 fallback */
    var lsProj = null;
    try {
      var pid = proj.id || proj.projectId;
      if (pid) {
        var raw = localStorage.getItem('uc_studio_project_' + pid);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && parsed.project) lsProj = parsed.project;
          else lsProj = parsed;
        }
      }
    } catch(_) { lsProj = null; }
    var lsS1 = (lsProj && lsProj.s1) || {};
    var lsS3 = (lsProj && lsProj.s3) || {};

    /* 모든 후보 (이름 → raw 데이터) */
    var candidates = [
      { path:'s1.scenes',                    data: s1.scenes },
      { path:'s1.sceneList',                 data: s1.sceneList },
      { path:'s1.result.scenes',             data: s1.result && s1.result.scenes },
      { path:'s1.draft.scenes',              data: s1.draft && s1.draft.scenes },
      { path:'s1.output.scenes',             data: s1.output && s1.output.scenes },
      { path:'s1.generated.scenes',          data: s1.generated && s1.generated.scenes },
      { path:'s3.scenes',                    data: s3.scenes },
      { path:'s3.scenePrompts',              data: s3.scenePrompts },
      { path:'s3.imagePrompts',              data: s3.imagePrompts },
      { path:'s3.prompts',                   data: s3.prompts },
      { path:'s3.imagesV3',                  data: s3.imagesV3 },
      { path:'s3.sourceStatus.scenes',       data: s3.sourceStatus && s3.sourceStatus.scenes },
      { path:'project.scenes',               data: proj.scenes },
      { path:'project.scriptScenes',         data: proj.scriptScenes },
      { path:'project.imagePrompts',         data: proj.imagePrompts },
      { path:'s1.imagePrompts',              data: s1.imagePrompts },
      /* localStorage 복구 */
      { path:'ls.s1.scenes',                 data: lsS1.scenes },
      { path:'ls.s3.imagePrompts',           data: lsS3.imagePrompts },
      { path:'ls.s3.prompts',                data: lsS3.prompts },
      { path:'ls.s3.scenePrompts',           data: lsS3.scenePrompts },
      { path:'ls.project.scenes',            data: lsProj && lsProj.scenes },
    ];
    /* 길이/존재 dump */
    var lengths = {};
    candidates.forEach(function(c){ lengths[c.path] = _len(c.data); });
    try { console.debug('[scene-resolver] all candidate lengths:', lengths); } catch(_) {}

    /* 우선순위 우선 필터 — 정확한 scene array 우선 */
    var primaryOrder = ['s1.scenes','s1.sceneList','s1.result.scenes','s1.draft.scenes',
                        's1.output.scenes','s1.generated.scenes','s3.scenes','project.scenes',
                        'project.scriptScenes','ls.s1.scenes','ls.project.scenes'];
    var promptOrder  = ['s3.scenePrompts','s3.imagePrompts','s3.prompts','project.imagePrompts',
                        's1.imagePrompts','s3.imagesV3','ls.s3.scenePrompts','ls.s3.imagePrompts','ls.s3.prompts'];

    function pick(orderList) {
      for (var i = 0; i < orderList.length; i++) {
        var c = candidates.find(function(x){ return x.path === orderList[i]; });
        if (c && _len(c.data) > 0) return c;
      }
      return null;
    }
    var chosen = pick(primaryOrder) || pick(promptOrder);
    /* 마지막 fallback — 가장 긴 배열 */
    if (!chosen) {
      var sorted = candidates.slice().sort(function(a,b){ return _len(b.data) - _len(a.data); });
      if (sorted.length && _len(sorted[0].data) > 0) chosen = sorted[0];
    }
    /* 그래도 없으면 script marker 파싱 시도 */
    if (!chosen) {
      var scriptRaw = s2.scriptKo || s2.scriptJa || proj.scriptText || proj.script || '';
      if (scriptRaw) {
        var marker = /(?:^|\n)\s*(?:씬|scene|SCENE|シーン)\s*\d+/g;
        var m = scriptRaw.match(marker);
        if (m && m.length >= 2) {
          chosen = { path:'script.markers', data: m.map(function(_, i){ return { sceneNumber:i+1 }; }) };
        }
      }
    }
    return chosen; /* { path, data } | null */
  }

  /* ── 역할 추정 ── */
  function _inferRole(idx, total, sceneRole) {
    var existing = (sceneRole || '').toLowerCase().trim();
    if (existing && ROLE_LABEL[existing]) return { role: existing, label: ROLE_LABEL[existing] };
    if (existing) return { role: existing, label: existing };
    if (idx === 0) return { role: 'hook', label: '훅' };
    if (idx === total - 1) return { role: 'cta', label: 'CTA' };
    if (idx === 1) return { role: 'explain', label: '설명' };
    if (idx === 2) return { role: 'core', label: '핵심' };
    return { role: 'develop', label: '전개' };
  }

  /* ════════════════════════════════════════════════
     resolveStudioScenes — 단일 진입점
     ════════════════════════════════════════════════ */
  function resolveStudioScenes() {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s3 = proj.s3 || {};
    var chosen = _gatherCandidateSources();
    if (!chosen || !_len(chosen.data)) {
      try { console.debug('[scene-resolver] resolved scenes:', 0, '(no source)'); } catch(_) {}
      return [];
    }
    try { console.debug('[scene-resolver] selected source:', chosen.path); } catch(_) {}

    /* 1) chosen 을 정규화 */
    var rawScenes = normalizeSceneArray(chosen.data, chosen.path);

    /* 2) 다른 보조 소스로 prompt/narration 보강 (cross-fill) */
    var s1            = proj.s1 || {};
    var s3ImgPrompts   = s3.imagePrompts || [];
    var s3Prompts      = s3.prompts || [];
    var s3ScenePrompts = s3.scenePrompts || [];
    var s3VideoPrompts = s3.videoPrompts || [];
    var s3ImagesV3     = s3.imagesV3 || {};
    var s1ImgPrompts   = s1.imagePrompts || [];
    var projImgPrompts = proj.imagePrompts || [];

    var fillCounts = { scene_inline:0, scenePrompts:0, s3_imagePrompts:0, s3_prompts:0,
                       s1_imagePrompts:0, proj_imagePrompts:0, imagesV3:0, none:0 };

    var total = rawScenes.length;
    var resolved = rawScenes.map(function(sc, i){
      var roleInfo = _inferRole(i, total, sc.role);
      var sceneNumber = sc.sceneNumber || (i + 1);

      var imgFromV3  = s3ImagesV3[i] || s3ImagesV3[String(i)] || {};

      /* 추적 가능한 cascade — fillCounts 에 어느 소스가 채웠는지 누적 */
      var imgPrompt = '', imgFrom = 'none';
      var pickList = [
        ['scene_inline',     sc.imagePrompt || sc.promptCompiled],
        ['scenePrompts',     s3ScenePrompts[i] && (s3ScenePrompts[i].promptCompiled || s3ScenePrompts[i].prompt || s3ScenePrompts[i].text)],
        ['s3_imagePrompts',  s3ImgPrompts[i]],
        ['s3_prompts',       s3Prompts[i]],
        ['s1_imagePrompts',  s1ImgPrompts[i]],
        ['proj_imagePrompts',projImgPrompts[i]],
        ['imagesV3',         imgFromV3.promptCompiled || imgFromV3.prompt],
      ];
      for (var pi = 0; pi < pickList.length; pi++) {
        var v = _coerceText(pickList[pi][1]);
        if (v) { imgPrompt = v; imgFrom = pickList[pi][0]; break; }
      }
      fillCounts[imgFrom] = (fillCounts[imgFrom] || 0) + 1;

      var vidPrompt = _firstNonEmpty([
        sc.videoPrompt,
        s3VideoPrompts[i],
        imgFromV3.videoPromptCompiled,
        imgFromV3.videoPrompt,
      ]);
      var compiled = _firstNonEmpty([
        sc.promptCompiled,
        s3ScenePrompts[i] && s3ScenePrompts[i].promptCompiled,
        imgFromV3.promptCompiled,
      ]);
      var narration = _firstNonEmpty([sc.narration]);
      var visual    = _firstNonEmpty([sc.visualDescription]);
      var title     = sc.title || ('씬 ' + sceneNumber);

      return {
        sceneIndex:        i,
        sceneNumber:       sceneNumber,
        label:             '씬 ' + sceneNumber + (roleInfo.label ? ' - ' + roleInfo.label : ''),
        role:              roleInfo.role,
        roleLabel:         roleInfo.label,
        title:             title,
        narration:         narration,
        visualDescription: visual,
        imagePrompt:       imgPrompt,
        videoPrompt:       vidPrompt,
        promptCompiled:    compiled,
        sourcePath:        sc._from + (sc._synth ? ' (synth)' : ''),
        raw:               sc.raw || sc,
      };
    });

    try {
      console.debug('[scene-resolver] resolved scenes:', resolved.length, 'from', chosen.path);
      console.debug('[scene-resolver] imgPrompt fill sources:', fillCounts);
    } catch(_) {}
    return resolved;
  }

  /* ════════════════════════════════════════════════
     getScenePrompt(sceneIndex, mediaType)
     image 9단계 / video 6단계 — sourcePath 디버그 포함
     ════════════════════════════════════════════════ */
  function getScenePrompt(sceneIndex, mediaType) {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s3 = proj.s3 || {};
    var topic = (proj.s1 && proj.s1.topic) || proj.topic || '';
    var scenes = resolveStudioScenes();
    var scene = scenes[sceneIndex] || null;
    if (!scene) {
      try { console.debug('[scene-resolver] no scene at index', sceneIndex); } catch(_) {}
      return { prompt:'', source:'(no scene)' };
    }
    var imgFromV3 = (s3.imagesV3 && (s3.imagesV3[sceneIndex] || s3.imagesV3[String(sceneIndex)])) || {};

    var s1 = proj.s1 || {};
    var cascade = (mediaType === 'video') ? [
      ['scene.videoPrompt',                                    scene.videoPrompt],
      ['s3.videoPrompts['+sceneIndex+']',                      s3.videoPrompts && s3.videoPrompts[sceneIndex]],
      ['s3.imagesV3['+sceneIndex+'].videoPromptCompiled',      imgFromV3.videoPromptCompiled || imgFromV3.videoPrompt],
      ['scene.visualDescription',                              scene.visualDescription],
      ['scene.narration',                                      scene.narration],
      ['proj.topic',                                           topic],
    ] : [
      ['scene.imagePrompt',                                    scene.imagePrompt],
      ['scene.promptCompiled',                                 scene.promptCompiled],
      ['s3.scenePrompts['+sceneIndex+'].promptCompiled',       s3.scenePrompts && s3.scenePrompts[sceneIndex] && (s3.scenePrompts[sceneIndex].promptCompiled || s3.scenePrompts[sceneIndex].prompt || s3.scenePrompts[sceneIndex].text)],
      ['s3.imagePrompts['+sceneIndex+']',                      s3.imagePrompts && s3.imagePrompts[sceneIndex]],
      ['s3.prompts['+sceneIndex+']',                           s3.prompts && s3.prompts[sceneIndex]],
      ['s1.imagePrompts['+sceneIndex+']',                      s1.imagePrompts && s1.imagePrompts[sceneIndex]],
      ['proj.imagePrompts['+sceneIndex+']',                    proj.imagePrompts && proj.imagePrompts[sceneIndex]],
      ['s3.imagesV3['+sceneIndex+'].promptCompiled',           imgFromV3.promptCompiled || imgFromV3.prompt],
      ['scene.visualDescription',                              scene.visualDescription],
      ['scene.narration',                                      scene.narration],
      ['proj.topic',                                           topic],
    ];
    for (var i = 0; i < cascade.length; i++) {
      var src = cascade[i][0];
      var v = _coerceText(cascade[i][1]);
      if (v) {
        try { console.debug('[stock-query] sourcePath:', src); } catch(_) {}
        return { prompt: v, source: src };
      }
    }
    try { console.debug('[scene-resolver] no prompt — all sources empty for scene', sceneIndex); } catch(_) {}
    return { prompt:'', source:'(empty cascade)' };
  }

  /* ── 보조 helper ── */
  function getSceneByIndex(idx) {
    var scenes = resolveStudioScenes();
    return scenes[idx] || null;
  }
  function getSceneCount() {
    return resolveStudioScenes().length;
  }
  function getSceneLabel(idx) {
    var sc = getSceneByIndex(idx);
    return sc ? sc.label : ('씬 ' + (idx+1));
  }
  function getSceneRole(idx) {
    var sc = getSceneByIndex(idx);
    return sc ? sc.roleLabel : '';
  }

  /* 전역 노출 */
  window.resolveStudioScenes = resolveStudioScenes;
  window.getScenePrompt       = getScenePrompt;
  window.getSceneByIndex      = getSceneByIndex;
  window.getSceneCount        = getSceneCount;
  window.getSceneLabel        = getSceneLabel;
  window.getSceneRole         = getSceneRole;
})();
