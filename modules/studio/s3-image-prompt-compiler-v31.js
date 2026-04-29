/* ================================================
   modules/studio/s3-image-prompt-compiler-v31.js
   ⭐ 이미지 프롬프트 compiler v3.1
   * AI 호출 없는 결정적 컴파일 (rule-based)
   * window.compileImagePromptV31(scene, sceneIndex, projectContext)
   * window.compileImagePromptsV31All(projectContext)
   * 한국어 visualActionKo 가 본문에 그대로 들어가지 않게 visualActionEn 만 사용
   * 특정 스튜디오명(Ghibli/Pixar/Disney 등) 자동 삽입 금지
   * 9:16 vertical + caption safe area + no text overlay 강제
   * mustShow ≥ 2개 보장 (충분치 않으면 negative-only 보강)
   ================================================ */
(function(){
  'use strict';

  var FORBIDDEN_STUDIOS = /(ghibli|studio\s*ghibli|pixar|disney|miyazaki|jojo|makoto\s*shinkai|naoko\s*takeuchi)/ig;
  var FORBIDDEN_ARTISTS = /(in the style of\s+\w+\s+\w+)/ig; /* 임의 작가 스타일 — 제거 */

  /* 일반 negative — 모든 씬 공통 */
  var BASE_NEGATIVE = [
    'no rendered text in image', 'no watermark', 'no logo',
    'no celebrity likeness', 'no signature',
    'no extra fingers, no extra limbs', 'no distorted hands',
    'no exaggerated emotion', 'no medical horror'
  ];

  function _stripStudios(s){
    return String(s||'').replace(FORBIDDEN_STUDIOS, '').replace(FORBIDDEN_ARTISTS, '').replace(/\s{2,}/g,' ').trim();
  }

  function _aspectStrings(mode){
    if (mode === 'longform' || mode === 'thumbnail') {
      return { ratio:'16:9 horizontal', framing:'cinematic wide composition', safeArea:'subtitle-safe lower area' };
    }
    if (mode === 'cardnews')  return { ratio:'1:1 square', framing:'centered focal point', safeArea:'card-news-friendly composition' };
    if (mode === 'cardnews45')return { ratio:'4:5 vertical', framing:'card-news-friendly composition', safeArea:'top and bottom safe area for caption' };
    return { ratio:'9:16 vertical', framing:'portrait composition, full vertical frame, subject centered',
             safeArea:'top 15% and bottom 25% kept clear for caption safe area' };
  }

  /* style hints — characterMode/styleMode 우선, 없으면 사실적 권장 */
  function _styleHints(project, scene){
    var s1 = (project && project.s1) || {};
    var s3 = (project && project.s3) || {};
    var artStyle = s3.artStyle || '';
    var hints = [];
    /* hardcoded 스튜디오명 자동 삽입 금지 — 사용자가 직접 art chip 을 골랐을 때만 사용 */
    if (artStyle && !/ghibli|pixar|disney/.test(String(artStyle))) {
      hints.push(artStyle + ' style');
    }
    if (s3.lighting) hints.push(s3.lighting + ' lighting');
    /* 장르별 톤 */
    var genre = String(s1.genre || s1.style || project.style || '').toLowerCase();
    if (/senior|시니어|건강/.test(genre))     hints.push('warm natural cinematic photography');
    else if (/info|잡학|정보/.test(genre))    hints.push('clean instructional documentary photography');
    else if (/wisdom|명언/.test(genre))       hints.push('minimal symbolic still life with negative space');
    else if (/music|가사/.test(genre))        hints.push('cinematic stage photography with mood lighting');
    else if (/comic|유머/.test(genre))        hints.push('expressive natural photography');
    else                                      hints.push('high quality cinematic photography');
    return hints;
  }

  /* role 기본 카메라 */
  function _defaultCamera(role){
    if (role === 'hook') return 'medium shot with strong focal point';
    if (role === 'cta')  return 'close-up of hand reaching for action';
    if (role === 'core' || role === 'core_cause') return 'medium shot revealing clear action';
    if (role === 'reveal_or_solution') return 'cinematic medium close-up showing improvement';
    return 'stable medium shot';
  }

  /* mustShow 텍스트 빌드 */
  function _formatMustShow(list){
    if (!list || !list.length) return '';
    var arr = list.slice(0, 4); /* 너무 많으면 prompt 가 노이즈 */
    return 'must show ' + arr.join(', ');
  }

  /* 한국어 잔존 검사 — 한글이 본문에 들어가면 제거 */
  function _stripKorean(s){
    return String(s||'').replace(/[ㄱ-ㆎ가-힣]+/g, '').replace(/\s{2,}/g,' ').trim();
  }

  /* ════════════════════════════════════════════════
     핵심: compileImagePromptV31
     ════════════════════════════════════════════════ */
  function compileImagePromptV31(scene, sceneIndex, projectContext){
    var project = projectContext || (window.s3GetProjectSafe ? window.s3GetProjectSafe() : {});
    if (!scene) {
      var scenes = (typeof window.s3GetResolvedScenesSafe === 'function')
        ? window.s3GetResolvedScenesSafe() : [];
      scene = scenes[sceneIndex] || {};
    }

    /* 1) intent 파싱 — fallback subject 는 v4 GENERIC_PHRASES 에 걸리지 않도록 구체적으로. */
    var intent = (typeof window.s3ParseSceneVisualIntentV31 === 'function')
      ? window.s3ParseSceneVisualIntentV31(scene, sceneIndex, project) : {
          subject:'a person whose hands are clearly engaged with the central object of the scene',
          mustShow:[],
          visualActionKo:'', visualActionEn:'', emotion:'', camera:'', location:''
        };

    /* 2) action 보장 — translator 한 번 더 호출해 안전 fallback */
    var actionEn = intent.visualActionEn;
    if (!actionEn || /^[가-힣\s]+$/.test(actionEn)) {
      if (typeof window.s3TranslateVisualActionToEnglish === 'function') {
        actionEn = window.s3TranslateVisualActionToEnglish(intent.visualActionKo, intent, project) || '';
      }
    }
    if (!actionEn) actionEn = 'a clear practical scene relevant to the topic';

    /* 3) aspect / safe area */
    var mode = (typeof window.s3DetectAspectMode === 'function')
      ? window.s3DetectAspectMode(project) : 'shorts';
    var asp = _aspectStrings(mode);

    /* 4) parts 구성 — 순서 = visual style → subject → action → mustShow → location → emotion → camera → safeArea → ratio */
    var styleHints = _styleHints(project, scene);
    var parts = [];
    parts.push(styleHints.join(', '));
    if (intent.subject) parts.push(intent.subject);
    parts.push(actionEn);
    var ms = _formatMustShow(intent.mustShow);
    if (ms) parts.push(ms);
    if (intent.location) parts.push(intent.location);
    if (intent.emotion)  parts.push(intent.emotion);
    parts.push(intent.camera || _defaultCamera(intent.role));
    parts.push(asp.framing);
    parts.push(asp.safeArea);
    parts.push(asp.ratio);
    parts.push('no text overlay');
    parts.push('high quality');

    var body = parts.filter(Boolean).join(', ');
    body = _stripStudios(body);
    body = _stripKorean(body);

    /* 5) negative */
    var negative = BASE_NEGATIVE.slice();
    if (intent.mustShow && intent.mustShow.length === 0) {
      negative.push('avoid generic senior portrait without context');
    }

    return {
      sceneIndex:    sceneIndex,
      role:          intent.role || '',
      prompt:        body,
      negative:      negative,
      intent:        intent,
      visualActionKo:intent.visualActionKo,
      visualActionEn:actionEn,
      mustShow:      intent.mustShow,
      aspectMode:    mode,
      version:       'v3.1'
    };
  }
  window.compileImagePromptV31 = compileImagePromptV31;

  /* 전체 씬 컴파일 + STUDIO 저장 */
  function compileImagePromptsV31All(projectContext){
    var project = projectContext || (window.s3GetProjectSafe ? window.s3GetProjectSafe() : {});
    var scenes = (typeof window.s3GetResolvedScenesSafe === 'function')
      ? window.s3GetResolvedScenesSafe() : [];
    if (!scenes.length) {
      try { console.debug('[v31] no scenes to compile'); } catch(_){}
      return { count: 0, compiled: [] };
    }
    var compiled = scenes.map(function(sc, i){
      return compileImagePromptV31(sc, i, project);
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
        visualIntentV31:       c.intent,
        imagePromptV31:        c.prompt,
        imagePrompt:           c.prompt,
        promptCompilerVersion: 'v3.1'
      });
    });
    s3.imagesV3 = s3.imagesV3 || {};
    compiled.forEach(function(c, i){
      var slot = s3.imagesV3[i] || {};
      slot.prompt          = c.prompt;
      slot.promptCompiled  = c.prompt;
      slot.negative        = c.negative;
      slot.promptCompilerVersion = 'v3.1';
      s3.imagesV3[i] = slot;
    });
    s3.promptCompiler = { version:'v3.1', lastRunAt: Date.now(), enabled: true };
    if (typeof window.studioSave === 'function') { try { window.studioSave(); } catch(_){} }
    return { count: compiled.length, compiled: compiled };
  }
  window.compileImagePromptsV31All = compileImagePromptsV31All;
})();
