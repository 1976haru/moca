/* ================================================
   modules/studio/s1-youtube-remix-adapter.js
   유튜브 레퍼런스 리믹스 — 각색·번역 어댑터
   * 4 모드: subtitle_only / partial_rewrite / structure_only / full_recreate
   * 씬 단위 재각색 / 일본어·한국어 자막 변환 / 짧게·코믹·감동 변형
   * AI(APIAdapter) 우선, 실패 시 결정적 휴리스틱 fallback
   ================================================ */
(function(){
  'use strict';

  /* ── AI 호출 wrapper ── */
  async function _aiCall(system, prompt, maxTokens) {
    if (typeof window.APIAdapter !== 'undefined' &&
        typeof window.APIAdapter.callWithFallback === 'function') {
      return await window.APIAdapter.callWithFallback(system, prompt, {
        maxTokens: maxTokens || 1200,
        featureId: 's1-youtube-remix',
      });
    }
    throw new Error('APIAdapter 미로드');
  }
  function _stripJsonFence(txt) {
    var s = String(txt || '').trim();
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    return s;
  }

  /* ════════════════════════════════════════════════
     1) 자막 번역 — 일본어 / 한국어 / 한일 동시
     ════════════════════════════════════════════════ */
  async function translateCaption(text, targetLang, opts) {
    opts = opts || {};
    var src = String(text || '').trim();
    if (!src) return '';
    /* AI 시도 */
    try {
      var sys = '당신은 쇼츠 자막 번역가입니다. 직역하지 말고 자연스러운 ' +
        (targetLang === 'ja' ? '일본어' : '한국어') +
        ' 쇼츠 자막체로 변환하세요. 1~2줄, 화면에 들어갈 정도로 짧게. ' +
        (opts.seniorTone ? '일본 시니어가 읽기 편한 부드럽고 정중한 표현 사용. ' : '') +
        '결과는 자막 텍스트만 출력 (따옴표·설명 금지).';
      var prompt = '원본 자막:\n' + src + '\n\n' +
        (opts.context ? '맥락: ' + opts.context + '\n\n' : '') +
        '→ ' + (targetLang === 'ja' ? '자연스러운 일본어 쇼츠 자막 (한 줄 또는 두 줄):' :
                                       '자연스러운 한국어 쇼츠 자막 (한 줄 또는 두 줄):');
      var raw = await _aiCall(sys, prompt, 200);
      var out = _stripJsonFence(raw).split('\n').slice(0, 2).join('\n').trim();
      if (out) return out;
    } catch(_) {}
    /* fallback — 원본 그대로 (한국어 입력일 가능성) */
    return src;
  }

  /* ════════════════════════════════════════════════
     2) 단일 씬 각색 — 톤/길이/언어 변형
     variant: 'natural' | 'shorter' | 'comic' | 'emotional' |
              'ja_only' | 'ko_only' | 'senior'
     ════════════════════════════════════════════════ */
  async function adaptSceneTone(scene, variant, opts) {
    opts = opts || {};
    var base = scene.adaptedNarration || scene.original || '';
    if (!base) return scene;
    var instr = ({
      natural:   '더 자연스러운 한국어 쇼츠 대사로 다듬으세요.',
      shorter:   '핵심만 남기고 더 짧게 (한 호흡으로 읽을 수 있도록).',
      comic:     '가볍고 코믹한 톤으로 (과장 OK). 마지막에 살짝 반전.',
      emotional: '감정 자극·공감 톤으로. 시청자가 "내 얘기 같다" 느끼게.',
      ja_only:   '자연스러운 일본어 쇼츠 자막체로 변환 (한국어 출력 금지). 1~2줄.',
      ko_only:   '자연스러운 한국어 쇼츠 자막체로 다듬으세요. 1~2줄.',
      senior:    '일본 시니어가 듣기 편한 부드럽고 정중한 톤으로.',
    })[variant] || '더 자연스럽게 다듬으세요.';

    try {
      var sys = '당신은 숏츠 대본 작가입니다. 원본 문장을 그대로 복사하지 말고 ' +
        '의미는 유지하되 표현·어순·단어를 새로 구성하세요. ' +
        '결과 텍스트만 출력 (따옴표·설명 금지).';
      var prompt = '원본 자막/대사:\n' + (scene.original || '') + '\n\n' +
        '현재 각색본:\n' + base + '\n\n' +
        (opts.newTopic ? '새 주제 컨텍스트: ' + opts.newTopic + '\n' : '') +
        (opts.role ? '씬 역할: ' + opts.role + '\n' : '') +
        '\n지시: ' + instr + '\n\n결과:';
      var raw = await _aiCall(sys, prompt, 300);
      var out = _stripJsonFence(raw).trim();
      if (out) {
        var next = Object.assign({}, scene);
        if (variant === 'ja_only')      next.captionJa = out;
        else if (variant === 'ko_only') next.captionKo = out;
        else                            next.adaptedNarration = out;
        if (variant === 'shorter' || variant === 'comic' || variant === 'emotional' ||
            variant === 'natural' || variant === 'senior') {
          next.adaptedCaption = _toCaption(out);
        }
        return next;
      }
    } catch(_) {}
    return scene;
  }

  /* ════════════════════════════════════════════════
     3) 전체 씬 각색 — 모드별 동작
     mode: 'subtitle_only' | 'partial_rewrite' | 'structure_only' | 'full_recreate'
     ════════════════════════════════════════════════ */
  async function adaptAllScenes(originalScenes, mode, opts) {
    opts = opts || {};
    var scenes = (originalScenes || []).map(function(sc){ return Object.assign({}, sc); });
    if (!scenes.length) return scenes;

    if (mode === 'subtitle_only') return await _modeSubtitleOnly(scenes, opts);
    if (mode === 'partial_rewrite') return await _modePartialRewrite(scenes, opts);
    if (mode === 'structure_only') return await _modeStructureOnly(scenes, opts);
    if (mode === 'full_recreate') return await _modeFullRecreate(scenes, opts);
    return await _modePartialRewrite(scenes, opts);
  }

  /* ── 모드 1: 자막만 번역/변경 ── */
  async function _modeSubtitleOnly(scenes, opts) {
    var lang = opts.captionLang || 'both'; /* ko / ja / both */
    for (var i = 0; i < scenes.length; i++) {
      var sc = scenes[i];
      var src = sc.original || '';
      if (!src) continue;
      if (lang === 'ko' || lang === 'both') {
        sc.captionKo = await translateCaption(src, 'ko', { context: opts.newTopic });
      }
      if (lang === 'ja' || lang === 'both') {
        sc.captionJa = await translateCaption(src, 'ja', { context: opts.newTopic, seniorTone: opts.seniorTone });
      }
      sc.captionBoth = [sc.captionKo, sc.captionJa].filter(Boolean).join('\n');
      sc.adaptedNarration = sc.captionKo || sc.original;
      sc.adaptedCaption   = _toCaption(sc.captionKo || sc.original);
      sc.visualDescription = sc.visualDescription || _seedVisual(sc, opts);
    }
    _fillPrompts(scenes, opts);
    return scenes;
  }

  /* ── 모드 2: 대본 일부 각색 ── */
  async function _modePartialRewrite(scenes, opts) {
    try {
      var arr = await _aiBulkAdapt(scenes, 'partial', opts);
      if (arr && arr.length === scenes.length) {
        for (var i = 0; i < scenes.length; i++) {
          scenes[i].adaptedNarration = arr[i].adaptedNarration || _heuristicRewrite(scenes[i].original, opts);
          scenes[i].adaptedCaption   = arr[i].adaptedCaption   || _toCaption(scenes[i].adaptedNarration);
          scenes[i].visualDescription = arr[i].visualDescription || _seedVisual(scenes[i], opts);
        }
        _fillPrompts(scenes, opts);
        return scenes;
      }
    } catch(_) {}
    /* fallback */
    for (var j = 0; j < scenes.length; j++) {
      scenes[j].adaptedNarration = _heuristicRewrite(scenes[j].original, opts);
      scenes[j].adaptedCaption   = _toCaption(scenes[j].adaptedNarration);
      scenes[j].visualDescription = _seedVisual(scenes[j], opts);
    }
    _fillPrompts(scenes, opts);
    return scenes;
  }

  /* ── 모드 3: 구조만 참고 — 새 주제로 새 대사 ── */
  async function _modeStructureOnly(scenes, opts) {
    try {
      var arr = await _aiBulkAdapt(scenes, 'structure', opts);
      if (arr && arr.length === scenes.length) {
        for (var i = 0; i < scenes.length; i++) {
          scenes[i].adaptedNarration = arr[i].adaptedNarration || _structureFallback(scenes[i], opts);
          scenes[i].adaptedCaption   = arr[i].adaptedCaption   || _toCaption(scenes[i].adaptedNarration);
          scenes[i].visualDescription = arr[i].visualDescription || _seedVisual(scenes[i], opts);
        }
        _fillPrompts(scenes, opts);
        return scenes;
      }
    } catch(_) {}
    for (var j = 0; j < scenes.length; j++) {
      scenes[j].adaptedNarration = _structureFallback(scenes[j], opts);
      scenes[j].adaptedCaption   = _toCaption(scenes[j].adaptedNarration);
      scenes[j].visualDescription = _seedVisual(scenes[j], opts);
    }
    _fillPrompts(scenes, opts);
    return scenes;
  }

  /* ── 모드 4: 완전 재창작 — 씬 수만 유지 ── */
  async function _modeFullRecreate(scenes, opts) {
    try {
      var arr = await _aiBulkAdapt(scenes, 'recreate', opts);
      if (arr && arr.length >= scenes.length) {
        for (var i = 0; i < scenes.length; i++) {
          var a = arr[i] || {};
          scenes[i].adaptedNarration = a.adaptedNarration || _structureFallback(scenes[i], opts);
          scenes[i].adaptedCaption   = a.adaptedCaption   || _toCaption(scenes[i].adaptedNarration);
          scenes[i].visualDescription = a.visualDescription || _seedVisual(scenes[i], opts);
        }
        _fillPrompts(scenes, opts);
        return scenes;
      }
    } catch(_) {}
    for (var j = 0; j < scenes.length; j++) {
      scenes[j].adaptedNarration = _structureFallback(scenes[j], opts);
      scenes[j].adaptedCaption   = _toCaption(scenes[j].adaptedNarration);
      scenes[j].visualDescription = _seedVisual(scenes[j], opts);
    }
    _fillPrompts(scenes, opts);
    return scenes;
  }

  /* ── AI 일괄 각색 ── */
  async function _aiBulkAdapt(scenes, modeKey, opts) {
    var modeInstr = ({
      partial:   '원본 의미는 유지하되 말투/표현/어순을 내 채널 스타일로 다시 쓰세요. 원본 문장을 그대로 복사하지 마세요.',
      structure: '원본의 훅·전개·CTA 구조만 참고해, 새 주제(' + (opts.newTopic || '') + ')로 새 대사를 만드세요. 원본 단어·문장 사용 금지.',
      recreate:  '원본의 장점만 참고해, 새 주제(' + (opts.newTopic || '') + ')로 완전히 새로운 대사·화면을 만드세요.',
    })[modeKey] || '자연스럽게 각색하세요.';

    var sys = '당신은 숏츠 리믹스 작가입니다. 주어진 원본 씬 배열을 바탕으로, ' +
      '각 씬마다 adaptedNarration / adaptedCaption / visualDescription 을 생성하세요. ' +
      '원본 문장을 5단어 이상 연속 복사하지 마세요. JSON 배열만 출력.';
    var ctx = scenes.map(function(sc, i){
      return {
        i: i + 1,
        role: sc.roleLabel || sc.role || '',
        time: sc.timeRange || '',
        original: (sc.original || '').slice(0, 200),
        keep: sc.keepNote || '',
        avoid: sc.avoidNote || '',
      };
    });
    var prompt = '새 주제: ' + (opts.newTopic || '(원본 주제 유지)') + '\n' +
      '스타일: ' + (opts.style || '시니어 친화') + '\n' +
      '대상: ' + (opts.audience || '일본 시니어') + '\n' +
      '캡션 언어: ' + (opts.captionLang || 'both') + '\n\n' +
      '지시: ' + modeInstr + '\n\n' +
      '원본 씬:\n' + JSON.stringify(ctx).slice(0, 3500) + '\n\n' +
      'JSON 배열만 출력 (씬 ' + scenes.length + '개):\n' +
      '[ { "sceneNumber":1, "adaptedNarration":"새 한국어 대사", "adaptedCaption":"강조 자막 (≤14자)", ' +
      '"visualDescription":"화면 묘사 (배경/인물/액션)" }, ... ]';
    var raw = await _aiCall(sys, prompt, 2500);
    var s = _stripJsonFence(raw);
    var m = s.match(/\[[\s\S]*\]/);
    if (!m) throw new Error('JSON 배열을 찾지 못함');
    var arr = JSON.parse(m[0]);
    if (!Array.isArray(arr)) throw new Error('배열이 아님');
    return arr;
  }

  /* ── 휴리스틱 — 한국어 표현 변형 ── */
  function _heuristicRewrite(text, opts) {
    var src = String(text || '').trim();
    if (!src) return '';
    var prefix = (opts && opts.style === 'comic') ? '잠깐, ' :
                 (opts && opts.style === 'emotional') ? '사실은 말이죠, ' :
                 (opts && opts.style === 'senior') ? '여러분, ' : '';
    var body = src
      .replace(/입니다\.?$/, '이에요.')
      .replace(/합니다\.?$/, '해요.')
      .replace(/것입니다/g, '거예요')
      .replace(/그러나/g, '하지만')
      .replace(/때문에/g, '이라서');
    return (prefix + body).slice(0, 200);
  }
  function _structureFallback(scene, opts) {
    var topic = (opts && opts.newTopic) || '오늘의 주제';
    var roleLabel = scene.roleLabel || scene.role || '';
    if (scene.role === 'hook')   return '잠깐만요, ' + topic + ' 이야기 들어보셨어요?';
    if (scene.role === 'setup')  return topic + ', 사실 알고 보면 이렇습니다.';
    if (scene.role === 'reveal') return '핵심은 바로 이거예요 — ' + topic + '.';
    if (scene.role === 'cta')    return '도움이 됐다면 구독 부탁드려요.';
    return roleLabel + ' — ' + topic + ' 관련 새 대사.';
  }
  function _toCaption(text) {
    var s = String(text || '').trim();
    if (!s) return '';
    return s.length <= 14 ? s : s.slice(0, 14);
  }
  function _seedVisual(scene, opts) {
    var role = scene.roleLabel || scene.role || '';
    var topic = (opts && opts.newTopic) || '주제';
    var shot  = scene.shotTypeLabel || '인물';
    return shot + ' 중심 화면, ' + role + ' 장면 — ' + topic + ' 시각 묘사';
  }

  /* ── 이미지·영상 prompt seed (v4 컴파일러가 덮어씀) ── */
  function _fillPrompts(scenes, opts) {
    var styleHint = ({
      comic:     'bright pop colors, comedic energy',
      info:      'clean realistic photography, infographic-friendly',
      senior:    'warm soft tones, senior-friendly composition',
      emotional: 'warm cinematic lighting, emotional mood',
      animation: 'flat 2d animation style, friendly characters',
      animal:    'cute animal character illustration',
    })[opts && opts.style] || 'clean realistic photography';
    scenes.forEach(function(sc){
      var seed = sc.visualDescription || sc.adaptedNarration || sc.original || '';
      if (!sc.imagePrompt) {
        sc.imagePrompt = seed + ' — ' + styleHint + ', 9:16 vertical, no text overlay, subtitle-safe composition';
      }
      if (!sc.videoPrompt) {
        sc.videoPrompt = seed + ' — short clip 3~5s, 9:16 vertical, smooth motion, no text';
      }
    });
  }

  window.YT_REMIX_ADAPTER = {
    translateCaption: translateCaption,
    adaptSceneTone:   adaptSceneTone,
    adaptAllScenes:   adaptAllScenes,
  };
})();
