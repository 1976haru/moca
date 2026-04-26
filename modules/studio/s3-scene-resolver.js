/* ================================================
   modules/studio/s3-scene-resolver.js
   ⭐ Step 2 단일 씬 resolver — 상단 씬별 소스 현황과
      스톡 검색 드롭다운이 동일한 씬 목록을 보장한다.

   * resolveStudioScenes() — 8단계 fallback (s1.scenes → ... → script marker)
   * getScenePrompt(idx, mediaType) — image/video 별 9단계 prompt 우선순위
   * 반환 항목 모두 sourcePath 디버그 정보 포함
   * 다른 모듈은 이 두 함수만 호출하면 같은 결과를 얻는다.
   ================================================ */
(function(){
  'use strict';

  /* ── 역할 추정 라벨 ── */
  var ROLE_LABEL = {
    hook:'훅', intro:'인트로', explain:'설명', detail:'설명',
    core:'핵심', main:'핵심', develop:'전개', develop2:'전개',
    cta:'CTA', summary:'정리', outro:'정리',
  };

  function _coerceText(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v.trim();
    if (Array.isArray(v)) return v.join(' ').trim();
    if (typeof v === 'object' && v.text) return String(v.text).trim();
    return String(v).trim();
  }

  function _firstNonEmpty(arr) {
    for (var i = 0; i < arr.length; i++) {
      var v = _coerceText(arr[i]);
      if (v) return v;
    }
    return '';
  }

  /* ── 1) 씬 raw 목록 + sourcePath ── */
  function _resolveRawScenes() {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s1 = proj.s1 || {}, s2 = proj.s2 || {}, s3 = proj.s3 || {};

    /* a) s1.scenes — 가장 정통 */
    if (s1.scenes && s1.scenes.length) return { src: s1.scenes, path: 's1.scenes' };
    /* b) s1.sceneList */
    if (s1.sceneList && s1.sceneList.length) return { src: s1.sceneList, path: 's1.sceneList' };
    /* c) STUDIO.project.scenes (legacy) */
    if (proj.scenes && proj.scenes.length) return { src: proj.scenes, path: 'project.scenes' };
    /* d) s3.scenes (compiler 결과) */
    if (s3.scenes && s3.scenes.length) return { src: s3.scenes, path: 's3.scenes' };
    /* e) s3.scenePrompts 길이 기반 — synth 씬 */
    if (s3.scenePrompts && s3.scenePrompts.length) {
      return {
        src: s3.scenePrompts.map(function(p, i){
          var compiled = (p && (p.promptCompiled || p.prompt || p.text)) || '';
          return { sceneNumber: i+1, _synth: true, promptCompiled: compiled };
        }),
        path: 's3.scenePrompts'
      };
    }
    /* f) s3.imagePrompts 길이 기반 — 핵심 fallback (현재 사용자 케이스) */
    if (s3.imagePrompts && s3.imagePrompts.length) {
      return {
        src: s3.imagePrompts.map(function(p, i){
          return { sceneNumber: i+1, _synth: true, imagePrompt: _coerceText(p) };
        }),
        path: 's3.imagePrompts'
      };
    }
    /* g) s3.prompts (legacy 별칭) */
    if (s3.prompts && s3.prompts.length) {
      return {
        src: s3.prompts.map(function(p, i){
          return { sceneNumber: i+1, _synth: true, imagePrompt: _coerceText(p) };
        }),
        path: 's3.prompts'
      };
    }
    /* h) s3.imagesV3 키 기반 */
    if (s3.imagesV3 && Object.keys(s3.imagesV3).length) {
      var keys = Object.keys(s3.imagesV3).map(Number).filter(function(n){return !isNaN(n);}).sort(function(a,b){return a-b;});
      if (keys.length) {
        return {
          src: keys.map(function(k){
            var slot = s3.imagesV3[k] || {};
            return {
              sceneNumber: k+1, _synth: true,
              imagePrompt: _coerceText(slot.promptCompiled || slot.prompt || ''),
            };
          }),
          path: 's3.imagesV3'
        };
      }
    }
    /* i) script 텍스트 scene marker 파싱 */
    var raw = s2.scriptKo || s2.scriptJa || proj.scriptText || proj.script || '';
    if (raw) {
      var marker = /(?:^|\n)\s*(?:씬|scene|SCENE|シーン)\s*\d+/g;
      var m = raw.match(marker);
      if (m && m.length >= 2) {
        return {
          src: m.map(function(_, i){ return { sceneNumber: i+1, _synth:true }; }),
          path: 'script.markers'
        };
      }
    }
    return { src: [], path: 'none' };
  }

  /* ── 역할 추정 (idx + total + 기존 role) ── */
  function _inferRole(idx, total, sceneRole) {
    var existing = (sceneRole || '').toLowerCase().trim();
    if (existing && ROLE_LABEL[existing]) return { role: existing, label: ROLE_LABEL[existing] };
    if (existing) return { role: existing, label: existing };
    if (idx === 0) return { role: 'hook', label: '훅' };
    if (idx === total - 1) return { role: 'cta', label: 'CTA' };
    if (total >= 5 && idx === Math.floor(total / 2)) return { role: 'core', label: '핵심' };
    if (idx === 1) return { role: 'explain', label: '설명' };
    return { role: 'develop', label: '전개' };
  }

  /* ════════════════════════════════════════════════
     resolveStudioScenes() — 단일 진입점
     ════════════════════════════════════════════════ */
  function resolveStudioScenes() {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s3 = proj.s3 || {};
    var resolved = _resolveRawScenes();
    var raw = resolved.src;
    var total = raw.length;
    if (!total) {
      try { console.debug('[scene-resolver] scenes count: 0 — no source'); } catch(_) {}
      return [];
    }
    try {
      console.debug('[scene-resolver] scenes count:', total);
      console.debug('[scene-resolver] source:', resolved.path);
    } catch(_) {}

    return raw.map(function(sc, i){
      sc = sc || {};
      var roleInfo = _inferRole(i, total, sc.role || sc.sceneRole);
      var sceneNumber = sc.sceneNumber || sc.no || sc.number || (i + 1);

      /* prompt cascade — 카탈로그 + V3 결합 */
      var imgFromV3  = (s3.imagesV3 && s3.imagesV3[i]) || {};
      var imgPrompt = _firstNonEmpty([
        sc.imagePrompt,
        sc.image_prompt,
        sc.imgPrompt,
        s3.imagePrompts && s3.imagePrompts[i],
        s3.prompts && s3.prompts[i],
        imgFromV3.promptCompiled,
        imgFromV3.prompt,
        s3.scenePrompts && s3.scenePrompts[i] && (s3.scenePrompts[i].promptCompiled || s3.scenePrompts[i].prompt || s3.scenePrompts[i].text),
      ]);
      var vidPrompt = _firstNonEmpty([
        sc.videoPrompt,
        sc.video_prompt,
        s3.videoPrompts && s3.videoPrompts[i],
        s3.videosV3 && s3.videosV3[i] && (s3.videosV3[i].promptCompiled || s3.videosV3[i].prompt),
        imgFromV3.videoPromptCompiled,
      ]);
      var compiled = _firstNonEmpty([
        sc.promptCompiled,
        s3.scenePrompts && s3.scenePrompts[i] && s3.scenePrompts[i].promptCompiled,
        imgFromV3.promptCompiled,
      ]);

      var narration = _firstNonEmpty([
        sc.narration, sc.narration_kr, sc.lines, sc.line,
        sc.script, sc.text, sc.caption, sc.desc, sc.description,
      ]);
      var visual = _firstNonEmpty([
        sc.visualDescription, sc.visual_description, sc.visual,
        sc.scene_description, sc.sceneDesc,
      ]);
      var title = _firstNonEmpty([sc.title, sc.label, sc.name]) || ('씬 ' + sceneNumber);

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
        sourcePath:        resolved.path + (sc._synth ? ' (synth)' : ''),
      };
    });
  }

  /* ════════════════════════════════════════════════
     getScenePrompt(sceneIndex, mediaType)
     image: 9단계 / video: 6단계 + topic fallback
     반환: { prompt, source }
     ════════════════════════════════════════════════ */
  function getScenePrompt(sceneIndex, mediaType) {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var scenes = resolveStudioScenes();
    var scene = scenes[sceneIndex] || null;
    var s3 = proj.s3 || {};
    var topic = (proj.s1 && proj.s1.topic) || proj.topic || '';

    if (!scene) {
      try { console.debug('[scene-resolver] no scene at index', sceneIndex); } catch(_) {}
      return { prompt:'', source:'(no scene)' };
    }

    var cascade = [];
    if (mediaType === 'video') {
      cascade = [
        ['scene.videoPrompt',                 scene.videoPrompt],
        ['s3.videoPrompts['+sceneIndex+']',   s3.videoPrompts && s3.videoPrompts[sceneIndex]],
        ['s3.videosV3['+sceneIndex+'].promptCompiled', s3.videosV3 && s3.videosV3[sceneIndex] && (s3.videosV3[sceneIndex].promptCompiled || s3.videosV3[sceneIndex].prompt)],
        ['scene.visualDescription',           scene.visualDescription],
        ['scene.narration',                   scene.narration],
        ['proj.topic',                        topic],
      ];
    } else {
      cascade = [
        ['scene.imagePrompt',                 scene.imagePrompt],
        ['scene.promptCompiled',              scene.promptCompiled],
        ['s3.scenePrompts['+sceneIndex+'].promptCompiled', s3.scenePrompts && s3.scenePrompts[sceneIndex] && (s3.scenePrompts[sceneIndex].promptCompiled || s3.scenePrompts[sceneIndex].prompt || s3.scenePrompts[sceneIndex].text)],
        ['s3.imagePrompts['+sceneIndex+']',   s3.imagePrompts && s3.imagePrompts[sceneIndex]],
        ['s3.prompts['+sceneIndex+']',        s3.prompts && s3.prompts[sceneIndex]],
        ['s3.imagesV3['+sceneIndex+'].promptCompiled', s3.imagesV3 && s3.imagesV3[sceneIndex] && (s3.imagesV3[sceneIndex].promptCompiled || s3.imagesV3[sceneIndex].prompt)],
        ['scene.visualDescription',           scene.visualDescription],
        ['scene.narration',                   scene.narration],
        ['proj.topic',                        topic],
      ];
    }
    for (var i = 0; i < cascade.length; i++) {
      var src = cascade[i][0];
      var v = _coerceText(cascade[i][1]);
      if (v) {
        try { console.debug('[scene-resolver] prompt source:', src); } catch(_) {}
        return { prompt: v, source: src };
      }
    }
    try { console.debug('[scene-resolver] no prompt — all sources empty'); } catch(_) {}
    return { prompt:'', source:'(empty cascade)' };
  }

  /* 전역 노출 */
  window.resolveStudioScenes = resolveStudioScenes;
  window.getScenePrompt       = getScenePrompt;
})();
