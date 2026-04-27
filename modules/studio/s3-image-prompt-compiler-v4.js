/* ================================================
   modules/studio/s3-image-prompt-compiler-v4.js
   ⭐ v4 이미지 프롬프트 컴파일러
   * window.compileImagePromptV4(scene, sceneIndex, projectContext, options)
   * window.compileImagePromptsV4All(projectContext)
   * sceneIntent + projectProfile + grammar 를 결정적으로 합성한 영어 프롬프트
   * 한국어 raw 가 prompt 본문에 들어가지 않도록 분리
   * 9:16 / safe area / no text / mustNotGenericize 강제
   * Provider 별 미세 조정 (dalle3, flux, ideogram, gemini, stability)
   ================================================ */
(function(){
  'use strict';

  var FORBIDDEN_STUDIOS = /(ghibli|studio\s*ghibli|pixar|disney|miyazaki|jojo|makoto\s*shinkai|naoko\s*takeuchi)/ig;
  var FORBIDDEN_ARTISTS = /(in the style of\s+\w+\s+\w+)/ig;

  function _stripStudios(s){
    return String(s||'').replace(FORBIDDEN_STUDIOS, '').replace(FORBIDDEN_ARTISTS, '').replace(/\s{2,}/g,' ').trim();
  }
  function _stripKorean(s){
    return String(s||'').replace(/[ㄱ-ㆎ가-힣]+/g, '').replace(/\s{2,}/g,' ').trim();
  }
  function _has(re, s){ return re.test(String(s||'')); }

  /* aspect/safe area helper — projectProfile 또는 STUDIO 에서 가져옴 */
  function _aspectStrings(profile){
    var ratio = (profile && profile.aspectRatio) || '9:16';
    var top   = (profile && profile.subtitleSafeTopPct) || 15;
    var bot   = (profile && profile.subtitleSafeBottomPct) || 25;
    if (ratio === '16:9') {
      return { ratio:'16:9 horizontal',
               framing:'cinematic wide composition, subject placed thoughtfully',
               safeArea:'subtitle-safe lower area kept clear' };
    }
    if (ratio === '1:1') {
      return { ratio:'1:1 square',
               framing:'centered focal point, balanced negative space',
               safeArea:'card-news friendly composition with margin' };
    }
    if (ratio === '4:5') {
      return { ratio:'4:5 vertical',
               framing:'card-news friendly vertical composition',
               safeArea:'top and bottom safe area for caption' };
    }
    return { ratio:'9:16 vertical',
             framing:'portrait composition, full vertical frame, subject balanced',
             safeArea:'top '+top+'% and bottom '+bot+'% kept clear for caption safe area' };
  }

  /* mustShow 직렬화 — 객체/행동/감정/환경 묶어서 자연어로 */
  function _serializeEvidence(intent){
    var parts = [];
    if (intent.mustShowObjects && intent.mustShowObjects.length) {
      parts.push('must show: ' + intent.mustShowObjects.slice(0, 4).join(', '));
    }
    if (intent.mustShowActions && intent.mustShowActions.length) {
      parts.push('clear action: ' + intent.mustShowActions.slice(0, 3).join(', '));
    }
    if (intent.mustShowEmotion && intent.mustShowEmotion.length) {
      parts.push('emotion: ' + intent.mustShowEmotion.slice(0, 2).join(', '));
    }
    if (intent.mustShowEnvironment && intent.mustShowEnvironment.length) {
      parts.push('environment: ' + intent.mustShowEnvironment.slice(0, 2).join(', '));
    }
    return parts.join('; ');
  }

  /* subject 직렬화 — count/age/gender/relationship/wardrobe/continuityAnchor 통합 */
  function _serializeSubject(intent){
    var bits = [];
    if (intent.subjectCount === 2 && intent.relationship) {
      bits.push(intent.relationship);
    } else if (intent.subjectCount >= 2) {
      bits.push(intent.subjectCount + ' people: ' + intent.subject);
    } else {
      bits.push(intent.subject);
    }
    if (intent.age)            bits.push(intent.age);
    if (intent.wardrobe)       bits.push('wearing ' + intent.wardrobe);
    if (intent.continuityAnchor && !bits.join(' ').toLowerCase().includes(intent.continuityAnchor.toLowerCase())) {
      bits.push('(continuity anchor: ' + intent.continuityAnchor + ')');
    }
    return bits.join(', ');
  }

  /* avoidList 직렬화 (프롬프트 본문 내 negative-style hint) */
  function _serializeAvoid(intent){
    if (!intent.avoidList || !intent.avoidList.length) return '';
    return 'avoid: ' + intent.avoidList.slice(0, 4).join('; ');
  }

  /* provider 별 머리글 — 짧은 prefix */
  function _providerPrefix(providerId, grammar){
    var hint = (grammar && grammar.providerHints && grammar.providerHints[providerId]) || '';
    if (providerId === 'ideogram') {
      return (hint || 'editorial illustration') + ', crisp shapes, no rendered text inside the image';
    }
    if (providerId === 'flux' || providerId === 'sd' || providerId === 'stable' || providerId === 'stableDiffusion') {
      return hint || 'photorealistic film still';
    }
    if (providerId === 'gemini' || providerId === 'geminiImg' || providerId === 'geminiImagen') {
      return hint || 'photorealistic detailed scene';
    }
    if (providerId === 'dalle2') {
      return hint || 'simple photorealistic scene (low complexity)';
    }
    return hint || 'cinematic photorealistic scene';
  }

  /* negative — base + grammar + role + provider */
  var BASE_NEGATIVE = [
    'no rendered text in image', 'no watermark', 'no logo',
    'no celebrity likeness', 'no signature', 'no trademark',
    'no extra fingers, no extra limbs', 'no distorted hands',
    'no exaggerated emotion', 'no medical horror'
  ];
  function _buildNegative(profile, grammar, intent, providerId){
    var neg = BASE_NEGATIVE.slice();
    (grammar && grammar.negativeAdditions || []).forEach(function(n){ if (neg.indexOf(n) === -1) neg.push(n); });
    (profile && profile.tabooElements || []).forEach(function(n){ if (neg.indexOf(n) === -1) neg.push(n); });
    if (intent && intent.avoidList) {
      intent.avoidList.forEach(function(n){ if (neg.indexOf(n) === -1) neg.push(n); });
    }
    if (providerId === 'dalle2') {
      neg.push('avoid complex multi-subject framing — DALL-E 2 simplification');
    }
    /* mustNotGenericize → negative 측에도 명시 */
    if (profile && profile.mustNotGenericize) {
      profile.mustNotGenericize.forEach(function(n){ if (neg.indexOf(n) === -1) neg.push(n); });
    }
    return neg;
  }

  /* ════════════════════════════════════════════════
     main: compileImagePromptV4
     ════════════════════════════════════════════════ */
  function compileImagePromptV4(scene, sceneIndex, projectContext, options){
    options = options || {};
    var project = projectContext || (window.s3GetProjectSafe ? window.s3GetProjectSafe() : {});

    /* 1) projectProfile */
    var profile = options.projectProfile;
    if (!profile && typeof window.analyzeProjectProfileV4 === 'function') {
      profile = window.analyzeProjectProfileV4(project);
    }
    if (!profile) profile = {};

    /* 2) scene */
    if (!scene) {
      var scenes = (typeof window.s3GetResolvedScenesSafe === 'function')
        ? window.s3GetResolvedScenesSafe() : [];
      scene = scenes[sceneIndex] || {};
      var allTotal = scenes.length;
      scene._total = allTotal;
    }

    /* 3) sceneIntent */
    var intent = options.sceneIntent;
    if (!intent && typeof window.analyzeSceneIntentV4 === 'function') {
      var totalScenes = (scene._total) || (window.s3GetResolvedScenesSafe ? window.s3GetResolvedScenesSafe().length : 5);
      intent = window.analyzeSceneIntentV4(scene, profile, sceneIndex, totalScenes);
    }
    if (!intent) intent = {};

    /* 4) grammar */
    var grammar = options.grammar;
    if (!grammar && typeof window.buildGenreVisualGrammarV4 === 'function') {
      grammar = window.buildGenreVisualGrammarV4(profile, intent);
    }
    if (!grammar) grammar = { styleHints:[], framingRules:'', motionRules:'', forbiddenPatterns:[] };

    /* 5) provider */
    var providerId = options.providerId
                  || (typeof window.getSelectedImageProviderId === 'function' ? window.getSelectedImageProviderId() : 'dalle3');

    /* 6) compose */
    var asp = _aspectStrings(profile);
    var subject = _serializeSubject(intent);
    var actionPhrase = (intent.mustShowActions && intent.mustShowActions[0]) || (intent.visualGoal || 'a clear practical scene grounded in script');
    var evidence = _serializeEvidence(intent);
    var avoidStr = _serializeAvoid(intent);

    var parts = [];
    parts.push(_providerPrefix(providerId, grammar));
    parts.push(grammar.styleHints.join(', '));
    if (subject) parts.push(subject);
    parts.push(actionPhrase);
    if (evidence) parts.push(evidence);
    if (intent.location)  parts.push('location: ' + intent.location);
    if (intent.timeOfDay) parts.push(intent.timeOfDay);
    parts.push('camera: ' + (intent.cameraPriority || (grammar.cameraGrammar)));
    parts.push('framing: ' + grammar.framingRules);
    parts.push('lighting: ' + grammar.lightingGrammar);
    parts.push('composition: ' + grammar.composition);
    parts.push('expression: ' + grammar.expressionRange);
    parts.push(asp.framing);
    parts.push(asp.safeArea);
    parts.push(asp.ratio);
    if (avoidStr) parts.push(avoidStr);
    parts.push('no text overlay, no watermark, high quality, photo-real where applicable');

    var body = parts.filter(Boolean).join(', ');
    body = _stripStudios(body);
    body = _stripKorean(body);

    /* forbiddenPatterns 적용 — grammar.forbiddenPatterns 매치 시 제거 */
    (grammar.forbiddenPatterns || []).forEach(function(re){
      body = body.replace(re, '').replace(/\s{2,}/g,' ').trim();
    });

    var negative = _buildNegative(profile, grammar, intent, providerId);

    return {
      sceneIndex:    sceneIndex,
      role:          intent.role || '',
      prompt:        body,
      negative:      negative,
      intent:        intent,
      profile:       profile,
      grammar:       grammar,
      providerId:    providerId,
      mustShow:      [].concat(intent.mustShowObjects || [], intent.mustShowActions || [],
                                intent.mustShowEmotion || [], intent.mustShowEnvironment || []),
      aspectMode:    profile.aspectMode || 'shorts',
      version:       'v4'
    };
  }
  window.compileImagePromptV4 = compileImagePromptV4;

  /* ════════════════════════════════════════════════
     compileImagePromptsV4All — 전체 컴파일 + STUDIO 저장 + 점수
     ════════════════════════════════════════════════ */
  function compileImagePromptsV4All(projectContext){
    var project = projectContext || (window.s3GetProjectSafe ? window.s3GetProjectSafe() : {});
    var profile = (typeof window.analyzeProjectProfileV4 === 'function')
      ? window.analyzeProjectProfileV4(project) : {};
    var intents = (typeof window.analyzeAllSceneIntentsV4 === 'function')
      ? window.analyzeAllSceneIntentsV4(profile)
      : ((window.s3GetResolvedScenesSafe ? window.s3GetResolvedScenesSafe() : []).map(function(_, i){ return { sceneIndex:i, role:'' }; }));
    var scenes = (typeof window.s3GetResolvedScenesSafe === 'function')
      ? window.s3GetResolvedScenesSafe() : [];
    if (!scenes.length) return { count:0, compiled:[] };

    var providerId = (typeof window.getSelectedImageProviderId === 'function')
      ? window.getSelectedImageProviderId() : 'dalle3';

    var compiled = scenes.map(function(sc, i){
      var intent = intents[i] || (typeof window.analyzeSceneIntentV4 === 'function'
        ? window.analyzeSceneIntentV4(sc, profile, i, scenes.length) : null);
      return compileImagePromptV4(sc, i, project, {
        projectProfile: profile, sceneIntent: intent, providerId: providerId
      });
    });

    /* STUDIO 저장 */
    var s3 = (window.s3GetS3Safe ? window.s3GetS3Safe() : (project.s3 = project.s3 || {}));
    s3.imagePrompts  = compiled.map(function(c){ return c.prompt; });
    s3.prompts       = compiled.map(function(c){ return c.prompt; });
    s3.scenePrompts  = s3.scenePrompts || [];
    compiled.forEach(function(c, i){
      s3.scenePrompts[i] = Object.assign({}, s3.scenePrompts[i] || {}, {
        prompt:                c.prompt,
        promptCompiled:        c.prompt,
        negative:              c.negative,
        intent:                c.intent,
        sceneIntentV4:         c.intent,
        visualIntentV31:       c.intent,
        imagePromptV4:         c.prompt,
        imagePromptV31:        c.prompt,
        imagePrompt:           c.prompt,
        promptCompilerVersion: 'v4'
      });
    });
    s3.imagesV3 = s3.imagesV3 || {};
    compiled.forEach(function(c, i){
      var slot = s3.imagesV3[i] || {};
      slot.prompt          = c.prompt;
      slot.promptCompiled  = c.prompt;
      slot.negative        = c.negative;
      slot.promptCompilerVersion = 'v4';
      s3.imagesV3[i] = slot;
    });
    s3.promptCompiler = { version:'v4', lastRunAt: Date.now(), enabled: true };
    if (typeof window.studioSave === 'function') { try { window.studioSave(); } catch(_){} }
    return { count: compiled.length, compiled: compiled, profile: profile };
  }
  window.compileImagePromptsV4All = compileImagePromptsV4All;
})();
