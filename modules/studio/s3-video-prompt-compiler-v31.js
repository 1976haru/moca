/* ================================================
   modules/studio/s3-video-prompt-compiler-v31.js
   ⭐ 영상 프롬프트 compiler v3.1
   * window.compileVideoPromptV31(scene, sceneIndex, projectContext)
   * window.compileVideoPromptsV31All(projectContext)
   * static shot / fade / warm smile 반복 방지
   * duration / camera motion / subject motion / lighting / continuity 명시
   * 9:16 vertical, no text overlay, no watermark, no celebrity likeness 강제
   ================================================ */
(function(){
  'use strict';

  /* duration: 씬 시간이 있으면 그것, 없으면 기본 4s */
  function _durationFromScene(scene){
    var t = String((scene && (scene.time || scene.duration)) || '');
    var m = t.match(/(\d+)\s*[~\-]?\s*(\d+)?\s*초/);
    if (m) {
      var a = +m[1], b = +(m[2]||0);
      var d = b ? Math.max(2, b - a) : Math.max(2, a);
      return Math.min(d, 8);
    }
    return 4;
  }

  /* role 별 카메라 모션 — static 반복 방지 */
  function _cameraMotion(role, mustShow){
    var msFlat = (mustShow || []).join(' ').toLowerCase();
    if (/stairs|handrail/.test(msFlat))                     return 'slow handheld follow tilting down';
    if (/scale/.test(msFlat))                               return 'slow tilt-down to the readout';
    if (/heat pack|knee/.test(msFlat))                      return 'gentle dolly-in to the knee area';
    if (/elevator|ramp/.test(msFlat))                       return 'subtle dolly forward toward the entrance';
    if (/photograph|letter/.test(msFlat))                   return 'slow dolly-in to the held object';
    if (role === 'hook')      return 'slow push-in revealing the situation';
    if (role === 'cta')       return 'gentle pull-out ending on the call to action';
    if (role === 'reveal_or_solution') return 'slow rise-and-reveal';
    if (role === 'reversal')  return 'whip transition between two contrasting moments';
    return 'slow dolly-in';
  }

  function _subjectMotion(intent){
    if (!intent) return 'subtle natural movement';
    if (intent.mustShow && intent.mustShow.length) {
      var ms = intent.mustShow[0];
      if (/knee|stairs/.test(ms))   return 'careful step-by-step movement';
      if (/scale/.test(ms))         return 'small weight-shift on the scale';
      if (/heat pack/.test(ms))     return 'placing the pack and exhaling';
      if (/photograph|letter/.test(ms)) return 'fingertip moves across the surface';
      if (/phone/.test(ms))         return 'lifting the phone to the ear';
      if (/handrail/.test(ms))      return 'hand sliding along the rail';
    }
    if (/regret/.test(intent.emotion||''))   return 'eyes lower briefly';
    if (/relief/.test(intent.emotion||''))   return 'shoulders relax with a deep breath';
    if (/determined/.test(intent.emotion||'')) return 'steady gaze, slight forward step';
    return 'subtle natural movement';
  }

  function _lightingHint(project){
    var s3 = (project && project.s3) || {};
    if (s3.lighting) return s3.lighting + ' lighting';
    return 'soft natural daylight, warm and realistic';
  }

  function compileVideoPromptV31(scene, sceneIndex, projectContext){
    var project = projectContext || (window.s3GetProjectSafe ? window.s3GetProjectSafe() : {});
    if (!scene) {
      var scenes = (typeof window.s3GetResolvedScenesSafe === 'function')
        ? window.s3GetResolvedScenesSafe() : [];
      scene = scenes[sceneIndex] || {};
    }
    var intent = (typeof window.s3ParseSceneVisualIntentV31 === 'function')
      ? window.s3ParseSceneVisualIntentV31(scene, sceneIndex, project)
      : { subject:'an adult', mustShow:[], visualActionEn:'', emotion:'', camera:'', location:'', role:'' };

    var actionEn = intent.visualActionEn;
    if (!actionEn || /^[\sㄱ-ㆎ가-힣]+$/.test(actionEn)) {
      if (typeof window.s3TranslateVisualActionToEnglish === 'function') {
        actionEn = window.s3TranslateVisualActionToEnglish(intent.visualActionKo, intent, project) || '';
      }
    }
    if (!actionEn) actionEn = 'a clear practical scene relevant to the topic';

    var dur     = _durationFromScene(scene);
    var camMo   = _cameraMotion(intent.role, intent.mustShow);
    var subjMo  = _subjectMotion(intent);
    var light   = _lightingHint(project);
    var locStr  = intent.location ? (', ' + intent.location) : '';
    var emoStr  = intent.emotion ? (', ' + intent.emotion) : '';

    var prompt = [
      'duration: ' + dur + 's',
      '9:16 vertical short-form video',
      intent.subject || 'an adult relevant to the topic',
      actionEn + locStr + emoStr,
      'subject motion: ' + subjMo,
      'camera motion: ' + camMo,
      light,
      'continuous shot, no jump cuts, no fade, no static talking-head',
      'no text overlay, no watermark, no celebrity likeness',
      'realistic natural performance, high quality'
    ].filter(Boolean).join(', ');

    return {
      sceneIndex:  sceneIndex,
      role:        intent.role || '',
      prompt:      prompt,
      duration:    dur,
      cameraMotion:camMo,
      subjectMotion:subjMo,
      intent:      intent,
      version:     'v3.1'
    };
  }
  window.compileVideoPromptV31 = compileVideoPromptV31;

  function compileVideoPromptsV31All(projectContext){
    var project = projectContext || (window.s3GetProjectSafe ? window.s3GetProjectSafe() : {});
    var scenes = (typeof window.s3GetResolvedScenesSafe === 'function')
      ? window.s3GetResolvedScenesSafe() : [];
    if (!scenes.length) return { count:0, compiled:[] };
    var compiled = scenes.map(function(sc, i){ return compileVideoPromptV31(sc, i, project); });
    var s3 = (window.s3GetS3Safe ? window.s3GetS3Safe() : (project.s3 = project.s3 || {}));
    s3.videoPrompts = compiled.map(function(c){ return c.prompt; });
    s3.scenePrompts = s3.scenePrompts || [];
    compiled.forEach(function(c, i){
      s3.scenePrompts[i] = Object.assign({}, s3.scenePrompts[i] || {}, {
        videoPromptV31: c.prompt,
        videoPrompt:    c.prompt,
        promptCompilerVersion: 'v3.1'
      });
    });
    s3.imagesV3 = s3.imagesV3 || {};
    compiled.forEach(function(c, i){
      var slot = s3.imagesV3[i] || {};
      slot.videoPrompt          = c.prompt;
      slot.videoPromptCompiled  = c.prompt;
      s3.imagesV3[i] = slot;
    });
    if (typeof window.studioSave === 'function') { try { window.studioSave(); } catch(_){} }
    return { count: compiled.length, compiled: compiled };
  }
  window.compileVideoPromptsV31All = compileVideoPromptsV31All;
})();
