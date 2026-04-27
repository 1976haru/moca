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

  /* ════════════════════════════════════════════════
     장르별 모션 arc — 코믹/티키타카/동물애니 영상은 단순 상황 묘사가
     아니라 [start pose → action beat → reaction → camera move →
     prop motion → punchline payoff] 6단계 시퀀스를 강제.
     다른 장르는 빈 문자열 반환 → 기존 subject/camera motion 그대로.
     ════════════════════════════════════════════════ */
  function _genreMotionArc(intent, profile, grammar){
    var genre = (profile && profile.genre) || '';
    if (genre !== 'comic' && genre !== 'tikitaka' && genre !== 'animal_anime') return '';

    var role  = intent && intent.role || 'conflict_or_core';
    var prop  = (intent.mustShowObjects   && intent.mustShowObjects[0])   || '';
    var act   = (intent.mustShowActions   && intent.mustShowActions[0])   || '';
    var emo   = (intent.mustShowEmotion   && intent.mustShowEmotion[0])   || '';
    var anchor= (intent.continuityAnchor)
              || (profile && profile.continuityCharacters && profile.continuityCharacters[0])
              || '';

    var startPose, actionBeat, reactionChange, cameraMove, propMotion, payoff;

    if (genre === 'comic') {
      startPose      = anchor ? (anchor + ' standing in neutral pose, deadpan expression') : 'subject in neutral standing pose, deadpan expression';
      actionBeat     = act ? (act + ' deliberately') : (prop ? ('reaching for ' + prop + ' deliberately') : 'making a confident exaggerated gesture');
      reactionChange = emo ? ('expression flips to ' + emo) : 'expression flips from neutral to wide-eyed astonishment';
      cameraMove     = (role === 'hook') ? 'quick whip-pan landing on the punchline'
                     : (role === 'cta')  ? 'pull-out revealing both subjects mid-laugh'
                     :                     'snappy push-in onto the reaction face';
      propMotion     = prop ? (prop + ' lifts or shifts visibly with the beat') : 'a single comedic prop tilts or wobbles with the beat';
      payoff         = (role === 'cta') ? 'final freeze on a comedic peak frame, hand framing the punchline'
                     :                    'snap freeze on the comedic payoff frame';
    } else if (genre === 'tikitaka') {
      startPose      = 'two subjects clearly framed on opposite sides, alert and engaged';
      actionBeat     = act ? ('subject A initiates: ' + act) : 'subject A initiates with a strong claim gesture';
      reactionChange = emo ? ('subject B counters with ' + emo + ' reaction') : 'subject B counters with a smug raised eyebrow';
      cameraMove     = 'over-shoulder reverse cut between A and B, then split-frame two-shot';
      propMotion     = prop ? (prop + ' moves between A and B with the rhythm') : 'a representative prop passes between A and B with the rhythm';
      payoff         = (role === 'cta') ? 'both subjects laugh together, shoulders touching, hand reaching toward camera'
                     : (role === 'reveal_or_solution') ? 'both subjects pause, then nod in unison toward the resolution'
                     : 'rapid alternating reactions ending on a held mutual look';
    } else { /* animal_anime */
      startPose      = 'animal character relaxed in starting pose, ears soft, body still';
      actionBeat     = act ? (act + ' with bouncy timing') : (prop ? ('engaging with ' + prop + ' with bouncy timing') : 'small bounce forward toward the camera');
      reactionChange = emo ? ('expression shifts to ' + emo) : 'expression shifts to wide-eyed playful curiosity';
      cameraMove     = (role === 'hook') ? 'low-angle dolly-in following the bounce'
                     : (role === 'cta')  ? 'gentle pull-out framing the paw or extended muzzle toward camera'
                     :                     'low-angle follow with soft head-tilt parallax';
      propMotion     = prop ? (prop + ' bounces or rolls in sync with the character') : 'tail wags or paw lifts in sync with the beat';
      payoff         = (role === 'cta') ? 'paw extends toward camera with a head-tilt — clear CTA invitation'
                     :                    'final beat lands on a head-tilt or tail-wag punchline';
    }

    return [
      'start pose: ' + startPose,
      'action beat: ' + actionBeat,
      'reaction change: ' + reactionChange,
      'camera movement: ' + cameraMove,
      'prop or body motion: ' + propMotion,
      'punchline / payoff motion: ' + payoff
    ].join('; ');
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
    var arc     = _genreMotionArc(intent, profile, grammar); /* 코믹/티키타카/동물애니 6단계 시퀀스 */

    /* subject — empty 일 때 보강 우선순위:
       1) continuityCharacters / continuityAnchor
       2) mustShow 기반 의미 phrase
       3) 의미있는 topic fragment 가 있으면 topic+role
       (generic placeholder 금지) */
    var subjBase = '';
    if (intent.subjectCount === 2 && intent.relationship) subjBase = intent.relationship;
    else if (intent.subject)                              subjBase = intent.subject;
    if (!subjBase) {
      subjBase = (profile && profile.continuityCharacters && profile.continuityCharacters[0]) || intent.continuityAnchor || '';
    }
    if (!subjBase) {
      var obj = (intent.mustShowObjects   || [])[0] || '';
      var emo = (intent.mustShowEmotion   || [])[0] || '';
      var act = (intent.mustShowActions   || [])[0] || '';
      var env = (intent.mustShowEnvironment || [])[0] || '';
      if (obj)        subjBase = 'person interacting with ' + obj + (emo ? ' (' + emo + ')' : '');
      else if (act)   subjBase = 'person ' + act + (env ? ' in ' + env : '');
      else if (env)   subjBase = 'person within ' + env;
    }
    if (!subjBase) {
      var topicRaw = (profile && profile.topic) ? String(profile.topic) : '';
      var stripped = topicRaw.replace(/[ㄱ-ㆎ가-힣぀-ヿ]+/g,'').replace(/[^a-zA-Z0-9 ]+/g,' ').replace(/\s{2,}/g,' ').trim();
      var hasWord = stripped && stripped.split(/\s+/).some(function(w){ return w.length >= 4; });
      var topic = (hasWord || stripped.length >= 6) ? stripped : '';
      var role  = intent.role || 'core';
      var roleLbl = ({hook:'hook', setup:'setup', conflict_or_core:'core', reveal_or_solution:'resolution', cta:'CTA'})[role] || role;
      subjBase = topic
        ? ('person whose action drives the ' + roleLbl + ' beat of "' + topic + '"')
        : ('person whose action drives the ' + roleLbl + ' beat');
    }
    var subjectBit = subjBase;
    if (intent.age) subjectBit += ', ' + intent.age;
    if (intent.wardrobe) subjectBit += ', wearing ' + intent.wardrobe;

    /* action — generic fallback 제거. visualGoal 폴백 까지만, 이후 role 별 강제 보강 */
    var rawAction = (intent.mustShowActions && intent.mustShowActions[0]) || intent.visualGoal || '';
    var actionBit;
    if (intent.role === 'cta') {
      var hasHand = /hand|reach|extend|product|tap|press|button|extending|pointing/i.test(rawAction);
      if (!hasHand) {
        var obj = (intent.mustShowObjects && intent.mustShowObjects[0]) || 'the actionable surface';
        actionBit = 'a hand reaching toward ' + obj + ' (CTA action)' + (rawAction ? ', ' + rawAction : '');
      } else { actionBit = rawAction; }
    } else if (intent.role === 'hook') {
      var hasTension = /tight close-up|tension|focal|attention shift|focal point/i.test(rawAction);
      actionBit = hasTension ? rawAction : ('tight close-up creating immediate curiosity' + (rawAction ? ', ' + rawAction : ''));
    } else if (intent.role === 'reveal_or_solution') {
      var hasResolve = /resolution|payoff|push-in|rise-and-reveal|resolve|unmistakable|improvement|solution/i.test(rawAction);
      actionBit = hasResolve ? rawAction : ((rawAction ? rawAction + ', ' : '') + 'with unmistakable resolving action body language');
    } else {
      actionBit = rawAction;
    }
    var locBit  = intent.location ? (', ' + intent.location) : '';
    var emoBit  = (intent.mustShowEmotion && intent.mustShowEmotion[0]) ? (', ' + intent.mustShowEmotion[0]) : '';
    var propsBit = (intent.mustShowObjects && intent.mustShowObjects.length)
      ? (', must show: ' + intent.mustShowObjects.slice(0, 3).join(', '))
      : '';
    var roleTag = '[' + (({
      hook:'OPENING HOOK SHOT', setup:'ESTABLISHING SETUP SHOT',
      conflict_or_core:'CORE EVIDENCE SHOT', reveal_or_solution:'RESOLUTION ACTION SHOT',
      cta:'CTA ACTION SHOT'
    })[intent.role || ''] || 'SCENE SHOT') + ']';

    /* genre style hints — image compiler 와 동일하게 video 에도 포함시켜
       genreFidelity 점수 누락 방지 + 영상 톤이 장르에 맞도록 */
    var styleHintsStr = (grammar && grammar.styleHints && grammar.styleHints.length)
      ? grammar.styleHints.slice(0, 3).join(', ') : '';

    var prompt = [
      roleTag,
      'duration: ' + dur + 's',
      (profile.aspectRatio || '9:16') + ' vertical short-form video',
      styleHintsStr,
      subjectBit,
      actionBit ? (actionBit + locBit + emoBit + propsBit) : (locBit + emoBit + propsBit).replace(/^,\s*/, ''),
      'subject motion: ' + subjMo,
      'camera motion: ' + camMo,
      arc, /* 코믹/티키타카/동물애니 6단계 시퀀스. 다른 장르는 빈 문자열 → filter(Boolean) 으로 제거 */
      'framing: ' + (grammar.framingRules || 'subject clearly readable'),
      'lighting: ' + light,
      'composition: ' + (grammar.composition || 'subject clearly readable'),
      'expression: ' + (grammar.expressionRange || 'authentic and grounded'),
      'continuous shot, no jump cuts, no fade, no static talking-head',
      'subtitle safe area: top ' + ((profile && profile.subtitleSafeTopPct) || 15) + '% and bottom ' + ((profile && profile.subtitleSafeBottomPct) || 25) + '% kept clear',
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
