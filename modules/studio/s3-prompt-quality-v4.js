/* ================================================
   modules/studio/s3-prompt-quality-v4.js
   ⭐ v4 프롬프트 품질 평가 — 8개 항목, 총 180점, 150 통과
   * window.scorePromptQualityV4(promptBundle, options)
       → { total, pass, tier, breakdown:{...}, issues:[], strengths:[] }
   * window.explainPromptScoreV4(scoreResult)
       → user-readable 설명 텍스트 (HTML safe)
   * window.s3ScoreAllAndStoreV4()
       → 모든 씬 점수 적재, differentiation 글로벌 계산 포함
   * window.s3GetProviderQualityWarningV4(providerId, type)
       → DALL-E 2 / unsupported provider 경고

   채점 항목:
     1. script intent fidelity        (0~40)
     2. scene role accuracy           (0~20)
     3. visual specificity            (0~25)
     4. must-show evidence coverage   (0~20)
     5. differentiation from others   (0~20)
     6. genre fidelity                (0~20)
     7. image/video suitability       (0~15)
     8. continuity & production ready (0~20)
     -------------------------------------
     총                                (0~180)
     150 ↑ pass, 130~149 needs improve, 0~129 recompile
   ================================================ */
(function(){
  'use strict';

  var TIERS = [
    { min:165, label:'우수',     color:'#1a7a5a', bg:'#effbf7' },
    { min:150, label:'통과',     color:'#2a6db8', bg:'#eaf3fb' },
    { min:130, label:'개선 필요',color:'#a05a00', bg:'#fff7e6' },
    { min:  0, label:'재컴파일', color:'#c0392b', bg:'#fff1f1' },
  ];
  function _tierFor(score){
    for (var i = 0; i < TIERS.length; i++) if (score >= TIERS[i].min) return TIERS[i];
    return TIERS[TIERS.length - 1];
  }
  function _has(re, s){ return re.test(String(s||'')); }
  function _clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

  /* ════════════════════════════════════════════════
     1. script intent fidelity (0~40)
     keyMessage / narrativeGoal 단어 중 prompt에 등장한 비율
     ════════════════════════════════════════════════ */
  function _scoreIntentFidelity(prompt, intent){
    var max = 40;
    var s = String(prompt || '').toLowerCase();
    var key = String((intent && (intent.keyMessage || intent.summary)) || '').toLowerCase();
    if (!key) return { score: max * 0.5, max: max, note:'대본 요약 부재 — 기본 점수' };
    var tokens = key.replace(/[ㄱ-ㆎ가-힣぀-ヿ]+/g, ' ')
                    .replace(/[^a-z0-9\s]/g, ' ')
                    .split(/\s+/).filter(function(w){ return w.length >= 4; });
    if (!tokens.length) {
      /* 한국어/일본어만 — narrativeGoal 영어 fallback */
      var narrEn = String((intent && intent.narrativeGoal) || '').toLowerCase();
      if (narrEn) tokens = narrEn.split(/\s+/).filter(function(w){ return w.length >= 4; });
    }
    if (!tokens.length) return { score: max * 0.6, max: max, note:'영어 토큰 부족 — 보수적 점수' };
    var hits = tokens.filter(function(t){ return s.indexOf(t) >= 0; }).length;
    var ratio = hits / Math.min(tokens.length, 6);
    var sc = Math.round(_clamp(ratio, 0, 1) * max);
    return { score: sc, max: max, note: hits + '/' + Math.min(tokens.length,6) + ' 핵심 단어 매칭' };
  }

  /* ════════════════════════════════════════════════
     2. scene role accuracy (0~20)
     role 별 framing/composition 키워드 매칭
     ════════════════════════════════════════════════ */
  var ROLE_KEYWORDS = {
    hook:               [/strong focal|tight close-up|tension|curiosity|focal point|attention shift/i],
    setup:              [/establishing|wide-medium|relationship.*place|relationship and place|context/i],
    conflict_or_core:   [/insert close-up|must show|clear action|core problem|evidence/i],
    reveal_or_solution: [/resolving action|push-in|rise-and-reveal|payoff|unmistakable/i],
    cta:                [/hand reaching|hand extends|action surface|call to action|invite/i],
  };
  function _scoreRoleAccuracy(prompt, intent){
    var max = 20;
    var role = (intent && intent.role) || '';
    var checks = ROLE_KEYWORDS[role];
    if (!checks) return { score: max * 0.6, max: max, note:'role 미설정 — 기본 점수' };
    var hits = checks.filter(function(re){ return re.test(prompt); }).length;
    var sc = hits >= 1 ? max : Math.round(max * 0.4);
    return { score: sc, max: max, note: hits + ' role 키워드 매칭 (' + role + ')' };
  }

  /* ════════════════════════════════════════════════
     3. visual specificity (0~25)
     who/what/where/how 가 prompt 안에 언급되었는가
     ════════════════════════════════════════════════ */
  function _scoreSpecificity(prompt, intent){
    var max = 25;
    var s = String(prompt || '').toLowerCase();
    var sc = 0; var notes = [];
    /* who */
    if (intent && intent.subject && s.indexOf(intent.subject.toLowerCase().split(',')[0]) >= 0) {
      sc += 7; notes.push('who: ✓');
    } else if (/person|adult|senior|elder|customer|owner|child|citizen|couple|parent|character|animal/i.test(s)) {
      sc += 5; notes.push('who: 일반화');
    } else { notes.push('who: ✗'); }
    /* what (action) */
    var actionVerbs = /(holding|sitting|extending|standing|walking|stepping|reaching|inspecting|placing|pressing|filling|reading|making|looking|pointing|nodding|smiling|breathing|wiping|arranging|greeting|navigating|drinking|demonstrating|tapping|climbing|lifting|measuring|hugging|writing|bouncing|tilting)/i;
    if (actionVerbs.test(s)) { sc += 7; notes.push('what: ✓'); } else { notes.push('what: ✗'); }
    /* where */
    if ((intent && intent.location && s.indexOf(intent.location.toLowerCase().split(' ')[0]) >= 0) ||
        /home|hospital|park|street|office|shop|cafe|market|kitchen|staircase|tatami|veranda/i.test(s)) {
      sc += 6; notes.push('where: ✓');
    } else { notes.push('where: ✗'); }
    /* how (camera/lighting) */
    if (/close-up|medium shot|wide shot|over-shoulder|two-shot|insert|push-in|pull-out|dolly|tilt/i.test(s) &&
        /lighting|daylight|warm|cool|natural light/i.test(s)) {
      sc += 5; notes.push('how: ✓');
    } else if (/close-up|medium shot|lighting/i.test(s)) {
      sc += 3; notes.push('how: 부분');
    } else { notes.push('how: ✗'); }
    return { score: _clamp(sc, 0, max), max: max, note: notes.join(', ') };
  }

  /* ════════════════════════════════════════════════
     4. must-show evidence coverage (0~20)
     intent.mustShow* 항목들이 prompt 본문에 얼마나 반영되었는가
     ════════════════════════════════════════════════ */
  function _scoreEvidenceCoverage(prompt, intent){
    var max = 20;
    var all = [].concat(
      (intent && intent.mustShowObjects)     || [],
      (intent && intent.mustShowActions)     || [],
      (intent && intent.mustShowEmotion)     || [],
      (intent && intent.mustShowEnvironment) || []
    );
    if (!all.length) return { score: max * 0.4, max: max, note:'대본에서 must-show 추출 0개' };
    var s = String(prompt || '').toLowerCase();
    var hits = all.filter(function(x){
      var token = x.toLowerCase().split(' ')[0];
      return token && s.indexOf(token) >= 0;
    }).length;
    var ratio = hits / Math.min(all.length, 6);
    var sc = Math.round(_clamp(ratio, 0, 1) * max);
    return { score: sc, max: max, note: hits + '/' + Math.min(all.length,6) + ' must-show 반영' };
  }

  /* ════════════════════════════════════════════════
     5. differentiation from others (0~20)
     intent.differentiationHints 가 prompt 에 있고, prompt 가 너무 일반적이지 않은가
     ════════════════════════════════════════════════ */
  function _scoreDifferentiation(prompt, intent, options){
    var max = 20;
    var s = String(prompt || '').toLowerCase();
    var sc = 0; var notes = [];
    /* unique hints 점수 */
    var hints = (intent && intent.differentiationHints) || [];
    if (hints.length) {
      var matched = hints.filter(function(h){ return s.indexOf(h.toLowerCase().split(' ')[0]) >= 0; }).length;
      sc += Math.round((matched / hints.length) * 12);
      notes.push('unique evidence: ' + matched + '/' + hints.length);
    } else {
      sc += 6; notes.push('unique hints 없음 — 보수 점수');
    }
    /* generic 표현 페널티 */
    if (/generic\s+(senior|elderly|adult)\s+portrait|stock photo|ordinary scene|generic portrait|adult relevant to the topic/i.test(s)) {
      sc -= 8; notes.push('generic portrait 표현 감점');
    } else {
      sc += 4; notes.push('generic 표현 회피 ✓');
    }
    /* 다른 씬과 동일한 prompt 방지 (options.allPrompts 와 비교) */
    if (options && Array.isArray(options.allPrompts)) {
      var others = options.allPrompts.filter(function(p, i){ return i !== (intent && intent.sceneIndex); });
      var verySimilar = others.some(function(p){
        if (!p || !s) return false;
        var p2 = p.toLowerCase();
        if (p2.length < 40 || s.length < 40) return false;
        /* 첫 80자 일치 시 동일 */
        return p2.slice(0, 80) === s.slice(0, 80);
      });
      if (verySimilar) { sc -= 6; notes.push('인접 씬과 매우 유사 감점'); }
      else             { sc += 4; notes.push('씬간 차별화 ✓'); }
    }
    return { score: _clamp(sc, 0, max), max: max, note: notes.join(', ') };
  }

  /* ════════════════════════════════════════════════
     6. genre fidelity (0~20)
     grammar.styleHints 키워드가 prompt 에 들어왔는가
     ════════════════════════════════════════════════ */
  function _scoreGenreFidelity(prompt, profile, grammar){
    var max = 20;
    var s = String(prompt || '').toLowerCase();
    var sc = 0; var notes = [];
    if (grammar && grammar.styleHints && grammar.styleHints.length) {
      var firstHint = grammar.styleHints[0].toLowerCase().split(',')[0].split(' ')[0];
      if (firstHint && s.indexOf(firstHint) >= 0) {
        sc += 10; notes.push('style hint 매칭');
      } else {
        sc += 4; notes.push('style hint 부분');
      }
    }
    /* forbiddenPatterns 위배 */
    var violated = (grammar && grammar.forbiddenPatterns || []).some(function(re){ return re.test(s); });
    if (violated) { sc -= 5; notes.push('forbidden 패턴 매칭 감점'); }
    else          { sc += 5; notes.push('forbidden 회피 ✓'); }
    /* genre-specific evidence */
    var genre = profile && profile.genre;
    if (genre === 'tikitaka' && !/two|over-shoulder|two-shot|reverse/i.test(s))  { sc -= 4; notes.push('티키타카인데 2인 framing 부재'); }
    if (genre === 'animal_anime' && /photographic|photo-real/i.test(s))         { sc -= 4; notes.push('동물애니인데 사진톤'); }
    if (genre === 'comic' && /somber|grief|tragic|gloomy/i.test(s))             { sc -= 4; notes.push('코믹인데 진중 톤'); }
    if (genre === 'wisdom' && /crowd|busy market|chaos/i.test(s))               { sc -= 4; notes.push('명언인데 복잡한 구도'); }
    if (genre === 'info' && /surreal metaphor|dreamy/i.test(s))                  { sc -= 4; notes.push('정보형인데 추상 비유'); }
    if (sc > 0) sc += 5; /* baseline genre keyword 보너스 */
    return { score: _clamp(sc, 0, max), max: max, note: notes.join(', ') };
  }

  /* ════════════════════════════════════════════════
     7. image/video suitability (0~15)
     image 면 framing/safe area, video 면 duration/camera motion/subject motion
     ════════════════════════════════════════════════ */
  function _scoreSuitability(prompt, type){
    var max = 15;
    var s = String(prompt || '');
    var sc = 0; var notes = [];
    if (type === 'video') {
      if (_has(/duration:\s*\d/i, s))   { sc += 4; notes.push('duration ✓'); } else { notes.push('duration ✗'); }
      if (_has(/camera motion/i, s))    { sc += 4; notes.push('camera motion ✓'); } else { notes.push('camera motion ✗'); }
      if (_has(/subject motion/i, s))   { sc += 4; notes.push('subject motion ✓'); } else { notes.push('subject motion ✗'); }
      if (_has(/static (shot|talking)|fade (in|out)|warm smile/i, s)) { sc -= 4; notes.push('static/fade 반복 감점'); }
      else { sc += 3; notes.push('정적 표현 회피'); }
    } else {
      if (_has(/9:16|portrait composition|cinematic wide|centered focal point|card-news/i, s)) { sc += 5; notes.push('framing ✓'); } else { notes.push('framing ✗'); }
      if (_has(/safe area|caption safe|safe-area/i, s)) { sc += 5; notes.push('safe area ✓'); } else { notes.push('safe area ✗'); }
      if (_has(/no text overlay/i, s)) { sc += 3; notes.push('no text overlay ✓'); }
      if (_has(/lighting/i, s)) { sc += 2; notes.push('lighting ✓'); }
    }
    return { score: _clamp(sc, 0, max), max: max, note: notes.join(', ') };
  }

  /* ════════════════════════════════════════════════
     8. continuity & production readiness (0~20)
     9:16 / safe area / continuity anchor / no text / no watermark / no celeb
     ════════════════════════════════════════════════ */
  function _scoreContinuity(prompt, profile, intent){
    var max = 20;
    var s = String(prompt || '');
    var sc = 0; var notes = [];
    if (_has(/9:16|16:9|1:1|4:5/i, s))         { sc += 4; notes.push('aspect ratio ✓'); } else { notes.push('aspect ✗'); }
    if (_has(/safe area|caption safe|safe-area/i, s)) { sc += 3; notes.push('safe area ✓'); } else { notes.push('safe area ✗'); }
    if (_has(/no text overlay/i, s))           { sc += 3; notes.push('no text ✓'); } else { notes.push('no text ✗'); }
    if (_has(/no watermark/i, s))              { sc += 2; notes.push('no watermark ✓'); } else { notes.push('no watermark ✗'); }
    if (_has(/no celebrity/i, s))              { sc += 1; notes.push('no celebrity ✓'); }
    if (_has(/[ㄱ-ㆎ가-힣]/, s))                { sc -= 5; notes.push('한국어 잔존 감점'); }
    if (_has(/(ghibli|pixar|disney|miyazaki)/i, s)) { sc -= 4; notes.push('스튜디오명 누출 감점'); }
    if (intent && intent.continuityAnchor && s.toLowerCase().indexOf(intent.continuityAnchor.toLowerCase().split(' ')[0]) >= 0) {
      sc += 4; notes.push('continuity anchor ✓');
    } else if (intent && intent.continuityAnchor) {
      sc += 1; notes.push('continuity anchor 미반영');
    }
    if (_has(/high quality|hi[- ]?res/i, s)) { sc += 3; notes.push('quality keyword ✓'); }
    return { score: _clamp(sc, 0, max), max: max, note: notes.join(', ') };
  }

  /* ════════════════════════════════════════════════
     main: scorePromptQualityV4
     promptBundle = {
       prompt, type:'image'|'video', intent, profile, grammar,
       providerId, allPrompts (선택)
     }
     ════════════════════════════════════════════════ */
  function scorePromptQualityV4(promptBundle, options){
    options = options || {};
    var b = promptBundle || {};
    var prompt = b.prompt || '';
    var type   = b.type || 'image';
    var intent = b.intent || {};
    var profile= b.profile || {};
    var grammar= b.grammar || {};
    var providerId = b.providerId || '';
    var allPrompts = b.allPrompts || options.allPrompts || null;

    var f1 = _scoreIntentFidelity(prompt, intent);
    var f2 = _scoreRoleAccuracy(prompt, intent);
    var f3 = _scoreSpecificity(prompt, intent);
    var f4 = _scoreEvidenceCoverage(prompt, intent);
    var f5 = _scoreDifferentiation(prompt, intent, { allPrompts: allPrompts });
    var f6 = _scoreGenreFidelity(prompt, profile, grammar);
    var f7 = _scoreSuitability(prompt, type);
    var f8 = _scoreContinuity(prompt, profile, intent);

    var total = f1.score + f2.score + f3.score + f4.score + f5.score + f6.score + f7.score + f8.score;
    /* provider 페널티 (DALL-E 2 은 v4 권장 아님) */
    if (providerId === 'dalle2') total = Math.max(0, total - 8);

    var pass = total >= 150;
    var tier = _tierFor(total);

    var issues = [];
    var strengths = [];
    if (f1.score < f1.max * 0.6) issues.push('대본 의도 반영 부족 — ' + f1.note);
    else                          strengths.push('대본 의도 반영 ✓');
    if (f2.score < f2.max * 0.6) issues.push('씬 role 적합도 낮음 — ' + f2.note);
    if (f3.score < f3.max * 0.6) issues.push('시각적 구체성 부족 — ' + f3.note);
    else                          strengths.push('구체성 ✓ (' + f3.note + ')');
    if (f4.score < f4.max * 0.5) issues.push('must-show 누락 — ' + f4.note);
    else                          strengths.push('must-show 반영 ✓ (' + f4.note + ')');
    if (f5.score < f5.max * 0.5) issues.push('다른 씬과 차별화 부족 — ' + f5.note);
    if (f6.score < f6.max * 0.6) issues.push('장르 적합도 미흡 — ' + f6.note);
    else                          strengths.push('장르 적합 ✓');
    if (f7.score < f7.max * 0.6) issues.push((type === 'video' ? '영상' : '이미지') + ' 문법 미흡 — ' + f7.note);
    if (f8.score < f8.max * 0.6) issues.push('연속성/제작 조건 미흡 — ' + f8.note);
    else                          strengths.push('제작 조건 ✓');

    return {
      total:    total,
      max:      180,
      pass:     pass,
      tier:     tier,
      type:     type,
      providerId: providerId,
      breakdown: {
        intentFidelity:   f1,
        roleAccuracy:     f2,
        specificity:      f3,
        evidenceCoverage: f4,
        differentiation:  f5,
        genreFidelity:    f6,
        suitability:      f7,
        continuity:       f8
      },
      issues:    issues.slice(0, 6),
      strengths: strengths.slice(0, 5),
      version:   'v4'
    };
  }
  window.scorePromptQualityV4 = scorePromptQualityV4;

  /* ════════════════════════════════════════════════
     explainPromptScoreV4 — 사용자 친화 텍스트
     ════════════════════════════════════════════════ */
  function explainPromptScoreV4(scoreResult){
    var r = scoreResult || {};
    var b = r.breakdown || {};
    function _line(label, item, max){
      var s = (item && item.score != null) ? item.score : 0;
      var m = (item && item.max != null) ? item.max : max;
      var note = (item && item.note) ? (' — ' + item.note) : '';
      return label + ': ' + s + '/' + m + note;
    }
    return [
      '총점 ' + (r.total || 0) + '/180 (' + (r.pass ? '통과' : '미통과') + ' · ' + ((r.tier && r.tier.label) || '') + ')',
      _line('1) 대본 의도 반영',  b.intentFidelity,   40),
      _line('2) 씬 role 적합도',   b.roleAccuracy,     20),
      _line('3) 시각적 구체성',    b.specificity,      25),
      _line('4) must-show 반영',   b.evidenceCoverage, 20),
      _line('5) 씬간 차별화',      b.differentiation,  20),
      _line('6) 장르 적합도',      b.genreFidelity,    20),
      _line('7) 이미지/영상 문법', b.suitability,      15),
      _line('8) 연속성/제작 조건', b.continuity,       20),
      '',
      r.issues && r.issues.length ? '⚠️ 개선 사유:' : '',
    ].concat((r.issues || []).map(function(x){ return '  - ' + x; }))
     .concat([(r.strengths && r.strengths.length) ? '✅ 강점:' : ''])
     .concat((r.strengths || []).map(function(x){ return '  - ' + x; }))
     .filter(function(x){ return x !== null && x !== undefined; })
     .join('\n');
  }
  window.explainPromptScoreV4 = explainPromptScoreV4;

  /* ════════════════════════════════════════════════
     s3ScoreAllAndStoreV4 — STUDIO 에 v4 점수 적재
     ════════════════════════════════════════════════ */
  function s3ScoreAllAndStoreV4(){
    var project = (window.s3GetProjectSafe ? window.s3GetProjectSafe() : {});
    var profile = (typeof window.analyzeProjectProfileV4 === 'function') ? window.analyzeProjectProfileV4(project) : {};
    var scenes = (typeof window.s3GetResolvedScenesSafe === 'function') ? window.s3GetResolvedScenesSafe() : [];
    if (!scenes.length) return null;
    var s3 = (window.s3GetS3Safe ? window.s3GetS3Safe() : (project.s3 = project.s3 || {}));
    var providerId = (typeof window.getSelectedImageProviderId === 'function') ? window.getSelectedImageProviderId() : 'dalle3';
    var intents = (typeof window.analyzeAllSceneIntentsV4 === 'function') ? window.analyzeAllSceneIntentsV4(profile) : [];
    var imagePrompts = s3.imagePrompts || [];
    var videoPrompts = s3.videoPrompts || [];
    var allImage = imagePrompts.slice();
    var imageScores = [], videoScores = [];
    scenes.forEach(function(sc, i){
      var intent = intents[i] || {};
      var grammar = (typeof window.buildGenreVisualGrammarV4 === 'function')
        ? window.buildGenreVisualGrammarV4(profile, intent) : {};
      imageScores[i] = scorePromptQualityV4({
        prompt: imagePrompts[i] || '', type:'image', intent: intent, profile: profile, grammar: grammar,
        providerId: providerId, allPrompts: allImage
      });
      videoScores[i] = scorePromptQualityV4({
        prompt: videoPrompts[i] || '', type:'video', intent: intent, profile: profile, grammar: grammar,
        providerId: providerId
      });
    });
    s3.promptQualityV4 = {
      version:'v4', image: imageScores, video: videoScores, lastRunAt: Date.now(),
      profile: profile
    };
    /* legacy 호환 — promptQuality 도 갱신 (v3.1 score 폴백 형태) */
    s3.promptQuality = s3.promptQuality || {};
    s3.promptQuality.imageV4 = imageScores;
    s3.promptQuality.videoV4 = videoScores;
    if (typeof window.studioSave === 'function') { try { window.studioSave(); } catch(_){} }
    return s3.promptQualityV4;
  }
  window.s3ScoreAllAndStoreV4 = s3ScoreAllAndStoreV4;

  /* ════════════════════════════════════════════════
     provider 품질 경고 (v4)
     ════════════════════════════════════════════════ */
  function s3GetProviderQualityWarningV4(providerId, type){
    type = type || 'image';
    var REG = window.S3_IMAGE_PROVIDER_REGISTRY || {};
    var cfg = REG[providerId] || REG[String(providerId).toLowerCase()] || null;

    if (providerId === 'dalle2') {
      return {
        tier: 'legacy_fallback',
        message: 'DALL-E 2 는 v4 권장 provider 가 아닙니다 — 저비용 테스트나 fallback 으로만 사용하세요. ' +
                 '대본 의도 반영·세로 쇼츠 구도·사실적 인물 표현은 최신 모델이 우수합니다.',
        recommend: ['dalle3', 'flux', 'geminiImagen', 'ideogram']
      };
    }
    if (providerId === 'minimax' && type === 'image') {
      return {
        tier: 'unsupported',
        message: 'MiniMax 는 영상 전용 provider 입니다 — 이미지 탭에서는 다른 provider 를 선택하세요.',
        recommend: ['dalle3', 'flux', 'geminiImagen']
      };
    }
    if (cfg && cfg.image === false && type === 'image') {
      return {
        tier: 'unsupported',
        message: cfg.label + ' 는 이미지 생성을 지원하지 않습니다. 다른 image provider 를 선택하세요.',
        recommend: ['dalle3', 'flux', 'geminiImagen']
      };
    }
    return null;
  }
  window.s3GetProviderQualityWarningV4 = s3GetProviderQualityWarningV4;
})();
