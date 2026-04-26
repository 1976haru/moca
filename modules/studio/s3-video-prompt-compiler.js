/* ================================================
   modules/studio/s3-video-prompt-compiler.js
   Step 2 — 레퍼런스 + 스타일 기반 영상 프롬프트 컴파일러

   * compileReferenceVideoPrompt(scene, refAnalysis, opts)
       opts: { styleId, modifiers:{comic, emotional, fastCut, safeArea}, sceneIndex, totalScenes }
       반환: { prompt, motionSummary, cameraCue, sfxCue, captionSafeArea }
   * compileAllReferenceVideoPrompts(scenes, refAnalysis, opts) — 일괄
   * 의존: s3-video-reference-style.js (V_REF_STYLE / _vrsPickVerb)
   ================================================ */
(function(){
  'use strict';

  var DEFAULT_STYLE = 'realperson';

  /* ── pacing → camera/cut 어휘 ── */
  function _pacingCameraCue(pacing) {
    var p = String(pacing || '').toLowerCase();
    if (p.indexOf('빠른') >= 0 || p.indexOf('fast') >= 0) return 'rapid cut rhythm, snappy camera transitions, dynamic motion';
    if (p.indexOf('중간') >= 0 || p.indexOf('mid') >= 0) return 'balanced cuts, comfortable camera movement';
    return 'measured pacing, deliberate camera moves';
  }

  /* ── retention device → 화면/표정 강화 ── */
  function _retentionEmphasis(devices) {
    if (!Array.isArray(devices) || !devices.length) return '';
    var keys = devices.join(' ').toLowerCase();
    var bits = [];
    if (/zoom|줌/.test(keys))    bits.push('quick zoom-in for impact');
    if (/표정|expression|reaction/.test(keys)) bits.push('exaggerated facial reactions');
    if (/반전|twist/.test(keys)) bits.push('a sudden visual twist mid-scene');
    if (/cta/.test(keys))        bits.push('clear visual cue toward call-to-action');
    if (/repeat|반복/.test(keys))bits.push('repeated motif for memorability');
    return bits.join(', ');
  }

  /* ── soundStyle → sfx cue ── */
  function _sfxCueFor(soundStyle, role, sceneIndex) {
    var s = String(soundStyle || '').toLowerCase();
    if (role === '훅' || sceneIndex === 0) {
      if (/whoosh|swoosh/.test(s)) return 'whoosh sfx';
      return 'attention-grabbing whoosh sfx';
    }
    if (role === 'CTA') return 'subtle ding/notification sfx';
    if (/comic|코믹|funny/.test(s)) return 'comedic boing or pop sfx';
    if (/emotion|감동/.test(s))     return 'soft piano hit, warm reverb tail';
    if (/news|뉴스/.test(s))        return 'subtle news-style transition sfx';
    return '';
  }

  /* ── role → 동작 의도 ── */
  function _intentForRole(role, hookIntent) {
    var r = String(role || '').toLowerCase();
    if (r.indexOf('훅') >= 0 || r === 'hook') {
      return hookIntent || 'immediately grab attention with a strong visual gesture';
    }
    if (r.indexOf('cta') >= 0) return 'clearly direct the viewer to engage (subscribe/like)';
    if (r.indexOf('핵심') >= 0 || r === 'core') return 'highlight the key information with strong visual emphasis';
    if (r.indexOf('전개') >= 0 || r === 'develop') return 'progress the story with clear visual change';
    if (r.indexOf('설명') >= 0 || r === 'explain') return 'show the explanation visually, support narration';
    return 'show the scene clearly with engaging visual';
  }

  /* ── modifier 토큰 ── */
  function _modifierTokens(modifiers) {
    var m = modifiers || {};
    var bits = [];
    if (m.comic)     bits.push('comedic timing, exaggerated reactions, playful energy');
    if (m.emotional) bits.push('warm emotional tone, soft cinematic lighting, intimate framing');
    if (m.fastCut)   bits.push('fast cut rhythm, quick camera moves, energetic pacing');
    if (m.safeArea)  bits.push('keep the lower 25% empty for Korean subtitles, subject upper-centered');
    return bits.join('. ');
  }

  /* ── 메인 ── */
  function compileReferenceVideoPrompt(scene, refAnalysis, opts) {
    opts = opts || {};
    var styleId    = opts.styleId || DEFAULT_STYLE;
    var modifiers  = opts.modifiers || {};
    var sceneIndex = (opts.sceneIndex != null) ? opts.sceneIndex : (scene && scene.sceneIndex) || 0;
    var ref        = refAnalysis || {};
    var styleDef   = (window.V_REF_STYLE && window.V_REF_STYLE[styleId]) || (window.V_REF_STYLE && window.V_REF_STYLE.none) || {};
    var verb       = (typeof window._vrsPickVerb === 'function') ? window._vrsPickVerb(styleId, sceneIndex) : 'moving';

    /* 씬 데이터 정규화 */
    var role     = scene.role || (sceneIndex === 0 ? '훅' : '');
    var visual   = String(scene.visualDescription || scene.visual || '').trim();
    var narration= String(scene.narration || scene.text || '').trim();
    var caption  = String(scene.caption || '').trim();
    var motionPref = String(scene.motionStyle || '').trim();
    var soundCueRaw= String(scene.soundCue || '').trim();
    var hookIntent = String(scene.hookIntent || '').trim();

    /* 1) Subject + action */
    var subject = styleDef.subject || 'a subject';
    var actionDesc = visual || narration || (verb + ' in scene');
    var subjectAction = subject + ' ' + verb + ' — ' + actionDesc;

    /* 2) Expression */
    var expression = styleDef.expression || '';

    /* 3) Camera */
    var pacingCue = _pacingCameraCue(ref.pacing);
    var camera = styleDef.camera + (pacingCue ? '; ' + pacingCue : '');
    if (motionPref) camera = motionPref + '; ' + camera;

    /* 4) Background / props */
    var background = styleDef.background || '';

    /* 5) Retention emphasis */
    var emphasis = _retentionEmphasis(ref.retentionDevices);

    /* 6) Intent / hook */
    var intent = _intentForRole(role, hookIntent || ref.hookPattern);

    /* 7) SFX cue */
    var sfx = soundCueRaw || _sfxCueFor(ref.soundStyle, role, sceneIndex);

    /* 8) Modifier 추가 */
    var modText = _modifierTokens(modifiers);

    /* 9) 안전영역 — caption style 또는 modifier.safeArea 시 */
    var captionStyleHint = String(ref.captionStyle || '').toLowerCase();
    var hasCaption = !!caption || /자막|caption|subtitle/.test(captionStyleHint);
    var safeArea = (modifiers.safeArea || hasCaption) ?
      'Keep the lower 25% empty for Korean subtitles. Subject framed in upper-center.' : '';

    /* ── 조립 ── */
    var parts = [];
    parts.push(subjectAction + '.');
    if (expression) parts.push(expression + '.');
    parts.push(camera + '.');
    if (background) parts.push(background + '.');
    if (emphasis)   parts.push(emphasis + '.');
    parts.push(intent + '.');
    parts.push('9:16 vertical short-form video, 2~5 seconds clip.');
    if (sfx)      parts.push('Sound cue: ' + sfx + '.');
    if (safeArea) parts.push(safeArea);
    if (modText)  parts.push(modText + '.');
    parts.push(styleDef.polish + '. No on-screen text overlay (subtitles are added separately).');

    var prompt = parts.filter(Boolean).join(' ');

    return {
      prompt:           prompt,
      motionSummary:    verb + ' — ' + (visual || narration).slice(0, 80),
      cameraCue:        (motionPref ? motionPref + '; ' : '') + (pacingCue || styleDef.camera),
      sfxCue:           sfx,
      captionSafeArea:  !!safeArea,
    };
  }
  window.compileReferenceVideoPrompt = compileReferenceVideoPrompt;

  /* ── 일괄 ── */
  function compileAllReferenceVideoPrompts(scenes, refAnalysis, opts) {
    if (!Array.isArray(scenes)) return [];
    return scenes.map(function(sc, i){
      return compileReferenceVideoPrompt(sc, refAnalysis, Object.assign({}, opts, { sceneIndex: i, totalScenes: scenes.length }));
    });
  }
  window.compileAllReferenceVideoPrompts = compileAllReferenceVideoPrompts;
})();
