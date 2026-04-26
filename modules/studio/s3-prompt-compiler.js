/* ================================================
   modules/studio/s3-prompt-compiler.js
   장르 + 씬 역할 + 추출 엔티티 → 이미지/영상 프롬프트 컴파일
   * 결정적(deterministic) 컴파일 — AI 호출 없음
     (AI 호출은 s3-image.js studioS3AutoPrompt 가 별도로 사용)
   * 9:16 vertical · no text overlay 강제
   ================================================ */
(function(){
  'use strict';

  /* ════════════════════════════════════════════════
     1) 텍스트 → 시각 엔티티 추출 (heuristic)
     ════════════════════════════════════════════════ */
  function extractEntities(scene, scriptText, genre) {
    var role = (scene && scene.role) || 'core';
    var lines = (scene && scene.lines && scene.lines.join(' ')) || (scene && scene.desc) || '';
    var combined = (lines + ' ' + (scriptText || '')).toLowerCase();

    /* 인물 — keyword 기반 */
    var subject = '';
    if (/부모|어머니|아버지|엄마|아빠|어머님|아버님|親|母|父|お母さん|お父さん/.test(combined)) {
      subject = 'middle-aged or elderly Korean adult child and elderly parent';
    } else if (/할머니|할아버지|시니어|노인|어르신|シニア|高齢/.test(combined)) {
      subject = 'elderly Korean or Japanese person';
    } else if (/사장|점주|손님|가게|매장|お店|店長|お客様/.test(combined)) {
      subject = 'small business owner and customer';
    } else if (/시민|민원|공무원|신청|安心|窓口/.test(combined)) {
      subject = 'citizen at a public service desk';
    } else if (/아이|학생|자녀|子供|学生/.test(combined)) {
      subject = 'parent and child';
    } else if (/연인|커플|부부|友達|彼女|彼氏/.test(combined)) {
      subject = 'two people in close relationship';
    } else {
      /* 장르 default */
      subject = (genre === 'senior') ? 'elderly Korean or Japanese person'
              : (genre === 'smb')    ? 'small business owner at the shop'
              : (genre === 'public') ? 'citizen receiving guidance'
              : (genre === 'music')  ? 'a person feeling the song'
              : 'a person reflecting on the moment';
    }

    /* 장소 */
    var location = '';
    if (/집|식탁|거실|방|家|リビング|ダイニング/.test(combined)) location = 'warm home interior';
    else if (/병원|진료|입원|病院|診察/.test(combined)) location = 'quiet hospital corridor';
    else if (/학교|교실|学校/.test(combined)) location = 'school corridor';
    else if (/카페|커피|cafe/.test(combined)) location = 'cozy cafe';
    else if (/공원|길|거리|駅|公園|路地/.test(combined)) location = 'evening street or park';
    else if (/사무실|회사|オフィス|会社/.test(combined)) location = 'small modest office';
    else if (/매장|가게|상점|お店/.test(combined)) location = 'small neighborhood shop';
    else if (/주민센터|구청|관공서|役所/.test(combined)) location = 'public service office';
    else if (/무대|콘서트|stage|live/.test(combined)) location = 'small intimate stage with mood lighting';
    else {
      location = (genre === 'senior')   ? 'warm korean home interior'
              : (genre === 'smb')      ? 'small neighborhood shop'
              : (genre === 'public')   ? 'public service desk'
              : (genre === 'music')    ? 'nostalgic night street'
              : 'soft natural setting';
    }

    /* 핵심 소품 */
    var keyObject = '';
    if (/사진|앨범|写真|アルバム/.test(combined))     keyObject = 'old framed family photograph';
    else if (/전화|핸드폰|電話|スマホ/.test(combined))  keyObject = 'phone on the table';
    else if (/편지|메모|手紙|メモ/.test(combined))      keyObject = 'handwritten letter';
    else if (/돈|지갑|お金|財布/.test(combined))         keyObject = 'wallet or coins';
    else if (/식사|밥|음식|食事/.test(combined))         keyObject = 'simple home-cooked meal';
    else if (/약|약봉지|薬/.test(combined))              keyObject = 'medication packet';
    else if (/안내|서류|書類/.test(combined))            keyObject = 'application form on a desk';
    else if (/제품|상품|商品/.test(combined))            keyObject = 'the featured product';
    else if (/마이크|기타|악기|ギター|マイク/.test(combined)) keyObject = 'microphone and warm stage light';
    else                                                  keyObject = 'a meaningful everyday object';

    /* 행동 */
    var action = '';
    if (role === 'hook')   action = 'a moment that immediately raises a question or feeling';
    else if (role === 'cta') action = 'reaching for a phone, tapping save, or making a call';
    else if (/기다|待/.test(combined))      action = 'quietly waiting';
    else if (/돌아|思い出/.test(combined))  action = 'looking back at a memory';
    else if (/말하|話/.test(combined))      action = 'gently speaking to someone';
    else if (/들어|聞/.test(combined))      action = 'listening attentively';
    else                                    action = 'engaging with the key object thoughtfully';

    /* 감정 */
    var emotion = '';
    if (/후회|미안|残念|悔/.test(combined))           emotion = 'subtle regret, restrained';
    else if (/감사|고마|感謝|ありがと/.test(combined)) emotion = 'quiet gratitude';
    else if (/외로|寂し|ひとり/.test(combined))         emotion = 'gentle loneliness, not exaggerated';
    else if (/기쁨|행복|嬉|幸せ/.test(combined))        emotion = 'soft contentment';
    else if (/걱정|불안|心配|不安/.test(combined))      emotion = 'concerned but composed';
    else if (genre === 'comedy' || genre === 'tikitaka') emotion = 'expressive but tasteful';
    else if (genre === 'info' || genre === 'public')     emotion = 'calm and clear';
    else                                                  emotion = 'reflective';

    /* 시각 은유 */
    var metaphor = '';
    if (genre === 'emotion')      metaphor = 'empty seat, returning light';
    else if (genre === 'senior')  metaphor = 'unchanged daily routine, gentle hands';
    else if (genre === 'smb')     metaphor = 'before-and-after of the shop or product';
    else if (genre === 'music')   metaphor = 'visual rhythm of light and shadow';
    else if (genre === 'tikitaka') metaphor = 'left-vs-right contrast of choice';
    else                          metaphor = '';

    return {
      role: role,
      subject: subject,
      location: location,
      keyObject: keyObject,
      action: action,
      emotion: emotion,
      metaphor: metaphor,
    };
  }
  window.s3ExtractEntities = extractEntities;

  /* ════════════════════════════════════════════════
     2) 이미지 프롬프트 컴파일 — 9블록 구조
     ════════════════════════════════════════════════ */
  function compileImagePrompt(scene, opts) {
    opts = opts || {};
    var genre  = (typeof window.s3ResolveProfileKey === 'function')
                  ? window.s3ResolveProfileKey(opts.genre || 'emotion') : (opts.genre || 'emotion');
    var prof   = (typeof window.s3GetVisualProfile === 'function')
                  ? window.s3GetVisualProfile(genre) : null;
    var roleH  = (scene && scene.roleHint) ||
                 (typeof window.s3GetRoleHint === 'function' ? window.s3GetRoleHint((scene||{}).role) : { composition:'medium shot', action:'show the scene' });

    var ent = extractEntities(scene, opts.scriptText || '', genre);

    var composition = roleH.composition || 'medium shot';
    var lighting    = (prof && prof.lighting) || 'soft natural light';
    var mood        = (prof && prof.mood)     || 'warm';
    var style       = (prof && prof.defaultStyle) || 'realistic cinematic';
    var imgStrategy = (prof && prof.imageStrategy && prof.imageStrategy[(scene && scene.index) % prof.imageStrategy.length]) || '';

    /* 9블록 — 사람이 읽을 수 있는 라인별 출력 */
    var blocks = [
      '[Subject] '     + ent.subject,
      '[Context] '     + (opts.context || (genre + ' short-form, ' + (scene && scene.label ? scene.label : '') + ', ' + (scene && scene.time ? scene.time : ''))).replace(/,\s*,/g,',').replace(/,\s*$/,''),
      '[Location] '    + ent.location,
      '[Action] '      + (roleH.action ? (roleH.action + ' — ' + ent.action) : ent.action),
      '[Emotion] '     + ent.emotion,
      '[Key Object] '  + ent.keyObject + (imgStrategy ? '; visual hint: ' + imgStrategy : ''),
      '[Composition] ' + composition,
      '[Lighting] '    + lighting + ', ' + mood + ' mood',
      '[Style] '       + style + ', 9:16 vertical, portrait composition, full vertical frame, no text overlay, high quality',
    ];
    if (ent.metaphor) blocks.splice(6, 0, '[Metaphor] ' + ent.metaphor);

    /* 금지 항목은 별도 — Negative 라인으로 */
    var forbid = (prof && prof.forbidden && prof.forbidden.length) ? prof.forbidden.join(', ') : '';
    if (forbid) blocks.push('[Negative] ' + forbid + ', no text overlay, no watermark, no subtitles');
    else        blocks.push('[Negative] no text overlay, no watermark, no subtitles');

    return blocks.join('\n');
  }
  window.s3CompileImagePrompt = compileImagePrompt;

  /* ════════════════════════════════════════════════
     3) 영상 프롬프트 컴파일 — 10블록 구조
        (image prompt 와는 다른 표현 — movement/camera/transition)
     ════════════════════════════════════════════════ */
  function compileVideoPrompt(scene, opts) {
    opts = opts || {};
    var genre  = (typeof window.s3ResolveProfileKey === 'function')
                  ? window.s3ResolveProfileKey(opts.genre || 'emotion') : (opts.genre || 'emotion');
    var prof   = (typeof window.s3GetVisualProfile === 'function')
                  ? window.s3GetVisualProfile(genre) : null;
    var ent = extractEntities(scene, opts.scriptText || '', genre);
    var role = (scene && scene.role) || 'core';

    /* 길이 추정 — 씬 시간이 있으면 사용 */
    var dur = _parseSecFromTime((scene && scene.time) || '') || _defaultDurForRole(role);

    var camMove   = _videoStrategyPick(prof, scene && scene.index, /^(slow|gentle|cinematic|drift|push|pull|pan|tilt|hold|static)/i)
                  || ((prof && prof.videoStrategy && prof.videoStrategy[0]) || 'slow push-in');
    var subjectMv = _subjectMoveForRole(role, ent);
    var emoTrans  = _emotionTransitionForRole(role, ent);
    var focusShft = _focusShiftForRole(role, ent);
    var pacing    = _pacingForGenre(genre);
    var openFrame = 'opens with ' + ent.subject + ' at ' + ent.location + ', ' + ent.keyObject + ' visible in frame';
    var style     = (prof && prof.defaultStyle) || 'realistic cinematic';

    var blocks = [
      '[Duration] ~' + dur + ' seconds',
      '[Opening frame] ' + openFrame,
      '[Subject movement] ' + subjectMv,
      '[Camera movement] ' + camMove,
      '[Emotional transition] ' + emoTrans,
      '[Focus shift] ' + focusShft,
      '[Pacing] ' + pacing,
      '[Style] ' + style,
      '[Format] vertical 9:16',
      '[Negative] no text overlay, no subtitles burned in, no watermark, no logo',
    ];
    return blocks.join('\n');
  }
  window.s3CompileVideoPrompt = compileVideoPrompt;

  /* ── helpers ── */
  function _parseSecFromTime(t) {
    if (!t) return 0;
    var m = String(t).match(/(\d+)\s*~\s*(\d+)/);
    if (m) return Math.max(2, parseInt(m[2],10) - parseInt(m[1],10));
    var m2 = String(t).match(/(\d+)/);
    return m2 ? parseInt(m2[1],10) : 0;
  }
  function _defaultDurForRole(role) {
    return role === 'hook' ? 3 : role === 'cta' ? 5 : 7;
  }
  function _videoStrategyPick(prof, idx, regex) {
    if (!prof || !prof.videoStrategy) return '';
    for (var i = 0; i < prof.videoStrategy.length; i++) {
      var pos = (idx || 0) + i;
      var s = prof.videoStrategy[pos % prof.videoStrategy.length];
      if (regex.test(s)) return s;
    }
    return '';
  }
  function _subjectMoveForRole(role, ent) {
    if (role === 'hook')        return ent.subject + ' enters the frame or turns toward camera';
    if (role === 'cta')         return ent.subject + ' reaches for the key object, hand fills the frame';
    if (role === 'reversal')    return ent.subject + ' shifts posture or reveals an unexpected expression';
    if (role === 'reveal_or_solution') return ent.subject + ' looks up, expression softens';
    return ent.subject + ' performs ' + ent.action + ' subtly';
  }
  function _emotionTransitionForRole(role, ent) {
    if (role === 'hook')   return 'curiosity → emotional pull';
    if (role === 'cta')    return ent.emotion + ' → quiet resolve';
    if (role === 'reversal')           return 'surprise → understanding';
    if (role === 'reveal_or_solution') return 'tension → relief';
    return ent.emotion + ', evolving subtly';
  }
  function _focusShiftForRole(role, ent) {
    if (role === 'hook')   return 'wide subject → close-up on the key object';
    if (role === 'cta')    return 'face → hand or device';
    return 'face → ' + ent.keyObject;
  }
  function _pacingForGenre(g) {
    if (g === 'emotion' || g === 'senior' || g === 'shortDrama') return 'slow, breathing pauses';
    if (g === 'comedy' || g === 'tikitaka')                       return 'quick, timing-driven cuts';
    if (g === 'info' || g === 'public')                           return 'calm, steady';
    if (g === 'music')                                             return 'rhythm-aware drift';
    if (g === 'smb')                                               return 'clean, commercial';
    return 'measured';
  }

  /* ════════════════════════════════════════════════
     4) 일괄 컴파일 — 모든 씬에 대해 imagePrompts/videoPrompts
     ════════════════════════════════════════════════ */
  function compileAllForProject(opts) {
    opts = opts || {};
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s1 = proj.s1 || {};
    var s3 = proj.s3 || {};
    var genre = opts.genre || s1.genre || s1.style || proj.style || 'emotion';
    var scriptText = opts.scriptText
      || (proj.s2 && (proj.s2.scriptKo || proj.s2.scriptJa))
      || proj.scriptText || '';

    /* 씬 수 동기화 */
    var sync = (typeof window.s3SyncImagePromptCount === 'function')
      ? window.s3SyncImagePromptCount(proj, opts.mode)
      : { count: (s3.scenes||[]).length, sceneCount: (s3.scenes||[]).length, groups: null, mode: 'same-as-scenes' };

    /* role 부여 */
    var rawScenes = s3.scenes || [];
    var annotated = (typeof window.s3AnnotateScenesWithRoles === 'function')
      ? window.s3AnnotateScenesWithRoles(rawScenes, sync.sceneCount)
      : rawScenes;

    /* compact 묶기인 경우 — 그룹별로 합쳐 1개의 가상 씬 만들기 */
    var workScenes;
    if (sync.mode === 'compact-3' && sync.groups) {
      workScenes = sync.groups.map(function(g, gi){
        var first = annotated[g[0]] || {};
        var combined = Object.assign({}, first);
        combined.label = '묶음 ' + (gi + 1);
        combined.lines = g.flatMap(function(srcIdx){ return (annotated[srcIdx] && annotated[srcIdx].lines) || []; });
        combined.desc  = g.map(function(srcIdx){ return (annotated[srcIdx] && annotated[srcIdx].desc) || ''; }).filter(Boolean).join(' / ');
        combined.index = gi;
        return combined;
      });
    } else {
      workScenes = annotated;
    }

    var imagePrompts = workScenes.map(function(sc){
      return compileImagePrompt(sc, { genre: genre, scriptText: scriptText });
    });
    var videoPrompts = workScenes.map(function(sc){
      return compileVideoPrompt(sc, { genre: genre, scriptText: scriptText });
    });

    return {
      count: sync.count,
      mode:  sync.mode,
      sceneCount: sync.sceneCount,
      groups: sync.groups,
      imagePrompts: imagePrompts,
      videoPrompts: videoPrompts,
      scenes: workScenes,
      genre: genre,
    };
  }
  window.s3CompileAllForProject = compileAllForProject;

  /* ════════════════════════════════════════════════
     5) 결과를 STUDIO.project 에 저장 (UI 새로고침용)
     ════════════════════════════════════════════════ */
  function applyCompiledToProject(compiled, opts) {
    opts = opts || {};
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    proj.s1 = proj.s1 || {};
    proj.s3 = proj.s3 || {};
    /* 정답 source — s3 에 둠. s1 에는 호환용 사본 */
    proj.s3.imagePrompts     = compiled.imagePrompts.slice();
    proj.s3.videoPrompts     = compiled.videoPrompts.slice();
    proj.s3.prompts          = compiled.imagePrompts.slice(); /* 기존 textarea 호환 */
    proj.s1.imagePrompts     = compiled.imagePrompts.slice();
    proj.s1.videoPrompts     = compiled.videoPrompts.slice();
    proj.s1.sceneCount       = compiled.sceneCount;
    proj.s1.imagePromptMode  = compiled.mode;
    if (typeof window.studioSave === 'function') window.studioSave();
    if (opts.rerender !== false && typeof window.renderStudio === 'function') {
      window.renderStudio();
    }
  }
  window.s3ApplyCompiledToProject = applyCompiledToProject;
})();
