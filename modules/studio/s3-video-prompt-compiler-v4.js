/* ================================================
   modules/studio/s3-video-prompt-compiler-v4.js
   ⭐ v4 영상 프롬프트 컴파일러
   * window.compileVideoPromptV4(scene, sceneIndex, projectContext, options)
   * window.compileVideoPromptsV4All(projectContext)
   * sceneIntent + grammar + role 기반의 결정적 영상 프롬프트
   * static shot / fade / warm smile 반복 방지
   * duration / camera motion / subject motion / lighting / continuity 명시
   * 9:16 / no text / no watermark / no celebrity 강제
   ================================================ */
(function(){
  'use strict';

  function _has(re, s){ return re.test(String(s||'')); }

  function _durationFromIntent(intent, scene){
    if (intent && intent.endSec && intent.startSec != null) {
      var d = Math.max(2, intent.endSec - intent.startSec);
      return Math.min(d, 8);
    }
    var t = String((scene && (scene.time || scene.duration)) || '');
    var m = t.match(/(\d+)\s*[~\-–]?\s*(\d+)?\s*초/);
    if (m) {
      var a = +m[1], b = +(m[2]||0);
      var d2 = b ? Math.max(2, b - a) : Math.max(2, a);
      return Math.min(d2, 8);
    }
    return 4;
  }

  /* role + grammar → camera motion */
  function _cameraMotion(intent, grammar){
    var role = (intent && intent.role) || 'conflict_or_core';
    var props = (intent && intent.mustShowObjects || []).join(' ').toLowerCase();
    if (/staircase|handrail/.test(props))     return 'slow handheld follow tilting down the staircase';
    if (/scale/.test(props))                   return 'slow tilt-down to the scale readout';
    if (/heat pack|knee/.test(props))          return 'gentle dolly-in to the body part action';
    if (/blood pressure/.test(props))          return 'slow push-in framing the inflating cuff and readout';
    if (/elevator|ramp/.test(props))           return 'subtle dolly forward toward the entrance';
    if (/photograph|letter/.test(props))       return 'slow dolly-in to the held object';
    if (role === 'hook')                       return 'slow push-in revealing the situation';
    if (role === 'cta')                        return 'gentle pull-out ending on the call to action';
    if (role === 'reveal_or_solution')         return 'slow rise-and-reveal toward the resolution';
    if (role === 'setup')                      return 'establishing slow pan across the place';
    return (grammar && grammar.cameraGrammar) ? ('motion based on ' + grammar.cameraGrammar) : 'slow dolly-in';
  }

  function _subjectMotion(intent, grammar){
    if (intent && intent.motionPriority) return intent.motionPriority;
    var ms = (intent && intent.mustShowActions || []).join(' ').toLowerCase();
    if (/climbing stairs/.test(ms))           return 'careful step-by-step climb on the stairs';
    if (/stepping on the scale/.test(ms))     return 'small weight-shift on the scale, eyes follow the readout';
    if (/answering the phone/.test(ms))       return 'lifting the phone to the ear and gentle nod';
    if (/measuring blood pressure/.test(ms))  return 'cuff inflates, eyes follow the readout';
    if (/tapping the save button/.test(ms))   return 'thumb taps the save button confidently';
    var emo = (intent && intent.mustShowEmotion || []).join(' ').toLowerCase();
    if (/regret/.test(emo))           return 'eyes lower briefly, soft exhale';
    if (/relief/.test(emo))           return 'shoulders relax with a deep breath';
    if (/determined/.test(emo))       return 'steady gaze, slight forward step';
    if (/surprise/.test(emo))         return 'shoulders lift, eyebrows raise';
    return 'subtle natural goal-driven movement';
  }

  function _lightingHint(profile, grammar){
    if (profile && profile.lighting) return profile.lighting + ' lighting';
    return (grammar && grammar.lightingGrammar) || 'soft natural daylight, warm and realistic';
  }

  function compileVideoPromptV4(scene, sceneIndex, projectContext, options){
    options = options || {};
    var project = projectContext || (window.s3GetProjectSafe ? window.s3GetProjectSafe() : {});
    var profile = options.projectProfile || (typeof window.analyzeProjectProfileV4 === 'function' ? window.analyzeProjectProfileV4(project) : {});
    if (!scene) {
      var scenes = (typeof window.s3GetResolvedScenesSafe === 'function') ? window.s3GetResolvedScenesSafe() : [];
      scene = scenes[sceneIndex] || {};
      scene._total = scenes.length;
    }
    var intent = options.sceneIntent;
    if (!intent && typeof window.analyzeSceneIntentV4 === 'function') {
      var totalScenes = (scene._total) || (window.s3GetResolvedScenesSafe ? window.s3GetResolvedScenesSafe().length : 5);
      intent = window.analyzeSceneIntentV4(scene, profile, sceneIndex, totalScenes);
    }
    if (!intent) intent = {};
    var grammar = options.grammar || (typeof window.buildGenreVisualGrammarV4 === 'function'
      ? window.buildGenreVisualGrammarV4(profile, intent) : { cameraGrammar:'medium shot', lightingGrammar:'soft natural', motionRules:'natural movement' });

    var dur     = _durationFromIntent(intent, scene);
    var camMo   = _cameraMotion(intent, grammar);
    var subjMo  = _subjectMotion(intent, grammar);
    var light   = _lightingHint(profile, grammar);

    var subjectBit = '';
    if (intent.subjectCount === 2 && intent.relationship) subjectBit = intent.relationship;
    else if (intent.subject) subjectBit = intent.subject;
    if (intent.age) subjectBit += ', ' + intent.age;
    if (intent.wardrobe) subjectBit += ', wearing ' + intent.wardrobe;

    var actionBit = (intent.mustShowActions && intent.mustShowActions[0]) || (intent.visualGoal || 'a clear practical scene grounded in script');
    var locBit  = intent.location ? (', ' + intent.location) : '';
    var emoBit  = (intent.mustShowEmotion && intent.mustShowEmotion[0]) ? (', ' + intent.mustShowEmotion[0]) : '';
    var propsBit = (intent.mustShowObjects && intent.mustShowObjects.length)
      ? (', show: ' + intent.mustShowObjects.slice(0, 3).join(', '))
      : '';

    var prompt = [
      'duration: ' + dur + 's',
      (profile.aspectRatio || '9:16') + ' vertical short-form video',
      subjectBit || 'a specific subject grounded in script',
      actionBit + locBit + emoBit + propsBit,
      'subject motion: ' + subjMo,
      'camera motion: ' + camMo,
      'framing: ' + (grammar.framingRules || 'subject clearly readable'),
      'lighting: ' + light,
      'expression: ' + (grammar.expressionRange || 'authentic and grounded'),
      'continuous shot, no jump cuts, no fade, no static talking-head',
      'no text overlay, no watermark, no celebrity likeness',
      'realistic natural performance, high quality'
    ].filter(Boolean).join(', ');

    return {
      sceneIndex:    sceneIndex,
      role:          intent.role || '',
      prompt:        prompt,
      duration:      dur,
      cameraMotion:  camMo,
      subjectMotion: subjMo,
      intent:        intent,
      profile:       profile,
      grammar:       grammar,
      version:       'v4'
    };
  }
  window.compileVideoPromptV4 = compileVideoPromptV4;

  function compileVideoPromptsV4All(projectContext){
    var project = projectContext || (window.s3GetProjectSafe ? window.s3GetProjectSafe() : {});
    var profile = (typeof window.analyzeProjectProfileV4 === 'function') ? window.analyzeProjectProfileV4(project) : {};
    var scenes = (typeof window.s3GetResolvedScenesSafe === 'function') ? window.s3GetResolvedScenesSafe() : [];
    if (!scenes.length) return { count:0, compiled:[] };
    var intents = (typeof window.analyzeAllSceneIntentsV4 === 'function') ? window.analyzeAllSceneIntentsV4(profile) : [];
    var compiled = scenes.map(function(sc, i){
      var intent = intents[i];
      return compileVideoPromptV4(sc, i, project, { projectProfile: profile, sceneIntent: intent });
    });
    var s3 = (window.s3GetS3Safe ? window.s3GetS3Safe() : (project.s3 = project.s3 || {}));
    s3.videoPrompts = compiled.map(function(c){ return c.prompt; });
    s3.scenePrompts = s3.scenePrompts || [];
    compiled.forEach(function(c, i){
      s3.scenePrompts[i] = Object.assign({}, s3.scenePrompts[i] || {}, {
        videoPromptV4:  c.prompt,
        videoPromptV31: c.prompt,
        videoPrompt:    c.prompt,
        promptCompilerVersion: 'v4'
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
    return { count: compiled.length, compiled: compiled, profile: profile };
  }
  window.compileVideoPromptsV4All = compileVideoPromptsV4All;
})();
