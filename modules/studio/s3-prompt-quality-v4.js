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
    if (!key) return { score: Math.round(max * 0.4), max: max, note:'대본 요약 부재 — 기본 점수' };
    var tokens = key.replace(/[ㄱ-ㆎ가-힣぀-ヿ]+/g, ' ')
                    .replace(/[^a-z0-9\s]/g, ' ')
                    .split(/\s+/).filter(function(w){ return w.length >= 4; });
    if (!tokens.length) {
      /* 한국어/일본어 대본 — 영어 token 매칭이 본질적으로 불가능하므로 다음 신호로
         의도 반영을 측정. cap 없음 (대본 의도가 evidence 로 prompt 에 충분히
         반영되면 영어 대본과 동일 max 가능). 단 GENERIC_PHRASES 안전망은
         scorePromptQualityV4 에서 -10 페널티로 별도 적용. */
      var evidenceAll = [].concat(
        (intent && intent.mustShowObjects)     || [],
        (intent && intent.mustShowActions)     || [],
        (intent && intent.mustShowEmotion)     || [],
        (intent && intent.mustShowEnvironment) || []
      );
      var evidenceHits = evidenceAll.filter(function(x){
        var t = x.toLowerCase().split(' ')[0];
        return t && s.indexOf(t) >= 0;
      }).length;
      var evidenceRatio = evidenceAll.length ? (evidenceHits / Math.min(evidenceAll.length, 6)) : 0;

      var narrEn = String((intent && intent.narrativeGoal) || intent && intent.visualGoal || '').toLowerCase();
      var narrTokens = narrEn ? narrEn.split(/\s+/).filter(function(w){ return w.length >= 4; }) : [];
      var narrHits = narrTokens.filter(function(t){ return s.indexOf(t) >= 0; }).length;
      var narrRatio = narrTokens.length ? (narrHits / Math.min(narrTokens.length, 6)) : 0;

      /* 가중 평균: evidence 70% + narrativeGoal 30%. baseline 30% (대본 미파싱
         케이스 보호). evidence 가 절반 이상이면 비례적으로 max 까지 도달. */
      var combined = evidenceRatio * 0.7 + narrRatio * 0.3;
      var sc0 = Math.round(_clamp(0.3 + combined * 0.7, 0, 1) * max);
      return { score: sc0, max: max, note:'한국어/일본어 대본 — evidence ' + evidenceHits + '/' + evidenceAll.length + ' + narrativeGoal 결합' };
    }
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
    hook:               [/strong focal|tight close-up|tension|curiosity|focal point|attention shift/i, /\[opening hook shot\]/i],
    setup:              [/establishing|wide-medium|relationship.*place|relationship and place|context/i, /\[establishing setup shot\]/i],
    conflict_or_core:   [/insert close-up|must show|clear action|core problem|evidence/i, /\[core evidence shot\]/i],
    reveal_or_solution: [/resolving action|push-in|rise-and-reveal|payoff|unmistakable|resolution/i, /\[resolution action shot\]/i],
    cta:                [/hand reaching|hand extends|hand reach|action surface|call to action|invite|CTA action/i, /\[cta action shot\]/i],
  };
  /* CTA 는 hand/product action 이 없으면 강한 감점 (실제 행동 컷 강제) */
  function _scoreRoleAccuracy(prompt, intent){
    var max = 20;
    var role = (intent && intent.role) || '';
    var checks = ROLE_KEYWORDS[role];
    if (!checks) return { score: Math.round(max * 0.6), max: max, note:'role 미설정 — 기본 점수' };
    var hits = checks.filter(function(re){ return re.test(prompt); }).length;
    var sc = hits >= 2 ? max : (hits >= 1 ? Math.round(max * 0.75) : Math.round(max * 0.3));
    /* CTA 강제 — hand/reach/extend/product 없으면 -8 */
    if (role === 'cta' && !/hand|reach|extend|product|tap|press|button|extending|pointing/i.test(prompt)) {
      sc -= 8;
    }
    /* hook 강제 — tight close-up/tension/focal 없으면 -4 */
    if (role === 'hook' && !/tight close-up|tension|focal|attention shift|focal point|curiosity/i.test(prompt)) {
      sc -= 4;
    }
    /* reveal — resolving / payoff / unmistakable 없으면 -4 */
    if (role === 'reveal_or_solution' && !/resolving|payoff|unmistakable|resolution|push-in|rise-and-reveal/i.test(prompt)) {
      sc -= 4;
    }
    return { score: _clamp(sc, 0, max), max: max, note: hits + ' role 키워드 매칭 (' + role + ')' };
  }

  /* ════════════════════════════════════════════════
     3. visual specificity (0~25)
     who/what/where/how 가 prompt 안에 언급되었는가
     ════════════════════════════════════════════════ */
  /* generic placeholder phrase 들 — v4 prompt 에 들어오면 안 되는 문구.
     매칭 시 specificity / evidence 감점. */
  var GENERIC_PHRASES = /(an? adult relevant to the topic|a specific adult character grounded|middle-aged adult|adult relevant to the script context|a clear practical scene grounded|a clear practical scene relevant|a specific subject grounded|meaningful object that evokes|family memory|warm dining table|old book|stock[- ]photo styled|generic\s+(senior|elderly|adult)\s+portrait|generic portrait)/i;

  function _scoreSpecificity(prompt, intent){
    var max = 25;
    var s = String(prompt || '').toLowerCase();
    var sc = 0; var notes = [];
    /* who — intent.subject 의 첫 토큰이 prompt 에 들어오면 full 점수.
       특별 케이스: 'person interacting with X' 처럼 mustShow 기반 phrase 면 X 가
       prompt 에 있어야 의미 있는 매칭. 'person|adult|character' 일반어만 단독 매칭되면
       부분 점수. 단, ethnicity (Korean/Japanese) 또는 age/relationship 이 함께
       prompt 에 있으면 가산. */
    var subjFirst = intent && intent.subject ? intent.subject.toLowerCase().split(/[, ]/)[0] : '';
    var subjFull  = intent && intent.subject ? intent.subject.toLowerCase() : '';
    var hasEthnicity = /\b(korean|japanese|chinese|asian)\b/i.test(s);
    var hasAge       = /\bin (their|his|her) [2-9]0s\b/i.test(s);
    var hasRelation  = /\b(couple|mother|father|grandmother|grandfather|grandparent|grandchild|son|daughter|parent and child|owner|nurse|doctor|patient|neighbor|friends?|two friends|two subjects|two people|two diners|both subjects)\b/i.test(s);

    /* prompt 본문에 'person interacting with X' 가 직접 들어있는지도 검사 —
       intent.subject 가 빈 값이지만 _serializeSubject 가 phrase 를 만들었을 때 대응 */
    var promptInteractMatch = s.match(/person interacting with ([a-z][\w-]+)/);
    if (subjFirst && subjFirst.length >= 3 && s.indexOf(subjFirst) >= 0 && !/person|adult|character/.test(subjFirst)) {
      sc += 7; notes.push('who: ✓ (' + subjFirst + ')');
    } else if (subjFull && /^person interacting with /.test(subjFull)) {
      /* mustShow 기반 phrase — 매칭 대상은 object 명사. */
      var objWord = subjFull.replace('person interacting with ','').split(/[ ,(]/)[0];
      if (objWord && s.indexOf(objWord) >= 0) { sc += 6; notes.push('who: mustShow 기반 ✓'); }
      else                                     { sc += 3; notes.push('who: mustShow phrase 약함'); }
    } else if (promptInteractMatch && promptInteractMatch[1]) {
      /* intent.subject 비어있어도 prompt 본문에 'person interacting with X' 가 있으면
         X 가 prompt 에서 다시 등장하는지 확인 — must-show 와 직접 연결되어 있다는 신호 */
      var objW = promptInteractMatch[1];
      var occurrences = s.split(objW).length - 1;
      if (occurrences >= 2) { sc += 6; notes.push('who: prompt 내 must-show 연결 ✓ (' + objW + ')'); }
      else                  { sc += 4; notes.push('who: prompt phrase 약함 (' + objW + ')'); }
    } else if (hasEthnicity || hasAge || hasRelation) {
      /* 명시적 ethnicity / age / relationship 가 있으면 일반어 매칭이라도 4pts */
      sc += 4; notes.push('who: ethnicity/age/relationship ✓');
    } else if (/person|adult|senior|elder|customer|owner|child|citizen|couple|parent|character|animal/i.test(s)) {
      sc += 2; notes.push('who: 일반화 — 약한 매칭');
    } else { notes.push('who: ✗'); }
    /* what (action) — action verb 또는 'show: ' / 'clear action: ' / 'must show: ' 같은
       evidence phrase 가 있으면 'what' 충족 */
    var actionVerbs = /(holding|sitting|extending|standing|walking|stepping|reaching|inspecting|placing|pressing|filling|reading|making|looking|pointing|nodding|smiling|breathing|wiping|arranging|greeting|navigating|drinking|demonstrating|tapping|climbing|lifting|measuring|hugging|writing|bouncing|tilting|interacting|crying|waving|answering)/i;
    var evidencePhrase = /(must show:|clear action:|show:\s)/i;
    if (actionVerbs.test(s) || evidencePhrase.test(s)) { sc += 7; notes.push('what: ✓'); }
    else { notes.push('what: ✗'); }
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
    /* GENERIC 표현 강한 감점 — middle-aged adult / old book / warm dining table 등 */
    if (GENERIC_PHRASES.test(s)) {
      sc -= 12; notes.push('generic placeholder 감점');
    }
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
    var s = String(prompt || '').toLowerCase();
    /* must-show 가 0 개일 때 baseline. video prompt 에 명시적 motion arc
       (reaction beat / alternating / hand gesture / punchline) 가 있으면
       baseline 을 max*0.2 → max*0.45 로 상향 (코믹/티키타카처럼 narration
       이 짧고 evidence 추출이 어려운 시나리오 보호). */
    if (!all.length) {
      var hasArc = /reaction beat|alternating|quick cut|back-and-forth|hand gesture|hand reaching|expression flips|punchline|payoff/i.test(s);
      var base = Math.round(max * (hasArc ? 0.45 : 0.2));
      if (GENERIC_PHRASES.test(s)) base = Math.max(0, base - 4);
      return { score: base, max: max, note:'대본에서 must-show 추출 0개' + (hasArc ? ' — motion arc 보강 baseline' : ' — baseline') };
    }
    var hits = all.filter(function(x){
      var token = x.toLowerCase().split(' ')[0];
      return token && s.indexOf(token) >= 0;
    }).length;
    var ratio = hits / Math.min(all.length, 6);
    var sc = Math.round(_clamp(ratio, 0, 1) * max);
    /* generic placeholder 가 prompt 에 있으면 evidence 도 -4 (must-show 가 있어도 generic 으로 희석되면 감점) */
    if (GENERIC_PHRASES.test(s)) sc = _clamp(sc - 4, 0, max);
    return { score: sc, max: max, note: hits + '/' + Math.min(all.length,6) + ' must-show 반영' + (GENERIC_PHRASES.test(s) ? ' (generic 감점)' : '') };
  }

  /* ════════════════════════════════════════════════
     5. differentiation from others (0~20)
     intent.differentiationHints 가 prompt 에 있고, prompt 가 너무 일반적이지 않은가
     ════════════════════════════════════════════════ */
  function _scoreDifferentiation(prompt, intent, options){
    var max = 20;
    var s = String(prompt || '').toLowerCase();
    var sc = 0; var notes = [];
    /* unique hints 점수 — motion arc 가 있으면 인접 씬과 구분되는 timing 신호로 인정 */
    var hints = (intent && intent.differentiationHints) || [];
    var hasArcD = /reaction beat|alternating|quick cut|back-and-forth|hand gesture|expression flips|punchline|payoff/i.test(s);
    if (hints.length) {
      var matched = hints.filter(function(h){ return s.indexOf(h.toLowerCase().split(' ')[0]) >= 0; }).length;
      var pts = Math.round((matched / hints.length) * 12);
      if (hasArcD) pts = Math.max(pts, 8);
      sc += pts;
      notes.push('unique evidence: ' + matched + '/' + hints.length + (hasArcD ? ' (+motion arc)' : ''));
    } else {
      sc += hasArcD ? 10 : 6;
      notes.push('unique hints 없음 — ' + (hasArcD ? 'motion arc 인정' : '보수 점수'));
    }
    /* generic 표현 페널티 — 강화. 정확한 BAD 예시 phrase 도 매칭 */
    if (GENERIC_PHRASES.test(s)) {
      sc -= 10; notes.push('generic placeholder 감점');
    } else {
      sc += 4; notes.push('generic 표현 회피 ✓');
    }
    /* role 라벨 prefix 가 있으면 differentiation +2 — 씬간 시각적 구분 강화 */
    if (/^\[(opening hook shot|establishing setup shot|core evidence shot|resolution action shot|cta action shot|scene shot)\]/i.test(s)) {
      sc += 2; notes.push('role 라벨 prefix ✓');
    }
    /* 다른 씬과 동일한 prompt 방지 (options.allPrompts 와 비교) — 첫 80자 + 첫 120자 두 단계 비교 */
    if (options && Array.isArray(options.allPrompts)) {
      var others = options.allPrompts.filter(function(p, i){ return i !== (intent && intent.sceneIndex); });
      var verySimilar = others.some(function(p){
        if (!p || !s) return false;
        var p2 = p.toLowerCase();
        if (p2.length < 40 || s.length < 40) return false;
        return p2.slice(0, 80) === s.slice(0, 80) || p2.slice(0, 120) === s.slice(0, 120);
      });
      if (verySimilar) { sc -= 8; notes.push('인접 씬과 매우 유사 감점'); }
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
    /* forbiddenPatterns 위배 — 단, prompt 본문에 'no {pattern}' 같은 부정 컨텍스트는
       위배가 아님 (예: 'no monolog framing', 'no single subject only').
       각 패턴마다 매칭 위치 앞 6자에 'no ' 가 있는지 확인. */
    var violated = (grammar && grammar.forbiddenPatterns || []).some(function(re){
      var flags = (re.flags || '').replace('g','') + 'g';
      var globalRe = new RegExp(re.source, flags);
      var m;
      while ((m = globalRe.exec(s)) !== null) {
        var before = s.slice(Math.max(0, m.index - 6), m.index).toLowerCase();
        if (!/\bno\s+$/.test(before)) return true; /* 부정형 아니면 진짜 위배 */
        if (m.index === globalRe.lastIndex) globalRe.lastIndex++;
      }
      return false;
    });
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
      /* static/fade/warm smile — 'no static' / 'no fade' 같은 부정형은 제외.
         (?<!no\s)/(?<!no )/ negative lookbehind 로 부정 컨텍스트 필터링 */
      var hasStaticBad = /(?<!no\s)(static (?:shot|talking)|fade (?:in|out)|warm smile)/i.test(s);
      if (hasStaticBad) { sc -= 4; notes.push('static/fade 반복 감점'); }
      else              { sc += 3; notes.push('정적 표현 회피'); }
      /* 코믹/티키타카/동물애니 video timing 보정 — reaction beat / alternating /
         quick cut / hand gesture / expression flip 같은 영상 timing 키워드가
         있으면 video 문법이 더 풍부하다고 판정. cap 은 +2 (max 안 넘김). */
      var timingHits = 0;
      if (/reaction beat/i.test(s))        timingHits++;
      if (/alternating|quick cut|back-and-forth/i.test(s))   timingHits++;
      if (/hand gesture|hands meet|hand reaching/i.test(s))  timingHits++;
      if (/expression flips|expression flip/i.test(s))       timingHits++;
      if (/punchline|payoff/i.test(s))     timingHits++;
      if (timingHits >= 3) { sc = Math.min(max, sc + 2); notes.push('video timing arc ✓ ('+timingHits+' 키워드)'); }
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
    /* provider 페널티 (DALL-E 2 은 v4 권장 아님 — fallback 전용) */
    if (providerId === 'dalle2') total = Math.max(0, total - 12);
    /* 전역 generic placeholder hard guard — prompt 본문에 generic 표현이 있으면
       150 통과 직전에서 막을 수 있도록 추가 -10. 컴파일러가 이미 막아야 하지만
       legacy fallback 으로 떨어진 경우의 안전망. */
    if (GENERIC_PHRASES.test(String(prompt || ''))) total = Math.max(0, total - 10);

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

    /* 동물 의인화 장르 전용 힌트 — s1-animal-character.js 가 노출.
       missing 항목 1개당 -3 (max -15) 페널티. 메시지는 사용자 친화 형식으로 표시. */
    if (profile && profile.genre === 'animal_anime' && typeof window._acQualityHints === 'function') {
      try {
        var miss = window._acQualityHints(prompt, type) || [];
        if (miss.length) {
          var penalty = Math.min(15, miss.length * 3);
          total = Math.max(0, total - penalty);
          pass = total >= 150;
          tier = _tierFor(total);
          miss.slice(0, 4).forEach(function(code){
            var msg = (typeof window._acQualityMessage === 'function')
              ? window._acQualityMessage(code) : code;
            issues.push('🐹 동물 의인화: ' + msg);
          });
        } else {
          strengths.push('동물 의인화 일관성·구체성 ✓');
        }
      } catch (_) {}
    }

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
