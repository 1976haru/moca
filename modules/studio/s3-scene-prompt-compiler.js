/* ================================================
   modules/studio/s3-scene-prompt-compiler.js
   숏츠 스튜디오 — 범용 Scene Visual Prompt Compiler (1/2)
   * 11 장르 × scene role × intent 기반 프롬프트 자동 생성
   * generic portrait only 방지 — action/props/location 강제
   * 씬 수 = 프롬프트 수
   * 기존 s3-prompt-compiler.js 와 병행 — opt-in 구조
   ================================================ */
(function(){
  'use strict';

  /* ════════════════════════════════════════════════
     1) 11 장르 × visual strategy
     ════════════════════════════════════════════════ */
  const STRATEGIES = {
    'senior-health': {
      label:'시니어 건강·운동',
      goal:'하루 운동, 자세, 사물 사용 등 행동 중심 장면',
      keywords:['knee','exercise','chair','stretch','walk','posture','daily routine','safe movement'],
      props:['sturdy chair','yoga mat','walking stick','water bottle','towel','rubber band'],
      locations:['warm home interior','small living room','park bench','community center'],
      framings:['medium shot','wide shot showing posture','over-the-shoulder of action'],
      emotions:['focused calm','quiet confidence','gentle effort'],
      defaultSubject:'senior person carefully doing a practical home exercise',
      avoid:['generic elderly portrait only','hospital horror','medical fear','exaggerated pain'],
    },
    'senior-emotion': {
      label:'시니어 감동·가족·후회',
      goal:'관계, 감정, 공간, 기억이 보이는 장면',
      keywords:['family photo','phone','dining table','empty chair','holiday','letter'],
      props:['old framed family photograph','phone on table','empty seat','tea cup','cardigan'],
      locations:['warm home dining table','quiet living room','sunset window','old hometown street'],
      framings:['close-up of hands holding object','medium shot of person at table','over-the-shoulder'],
      emotions:['restrained regret','quiet warmth','reconciliation','nostalgia'],
      defaultSubject:'a person at a dining table holding an old framed family photograph, restrained emotion visible on their face',
      avoid:['random elderly close-up only','funeral mood','hospital scene','excessive crying'],
    },
    'general-info': {
      label:'잡학·상식·정보형',
      goal:'사물·비교·과정 중심으로 궁금증을 시각적으로 설명',
      keywords:['object','before after','compare','step-by-step','demonstration'],
      props:['the featured object','two contrasting items','simple tool','everyday item'],
      locations:['clean desk surface','minimal studio table','everyday counter'],
      framings:['top-down product shot','clean medium shot','split-frame compare'],
      emotions:['curiosity','clarity','calm explanation'],
      defaultSubject:'a clear object-centered demonstration showing a single concept',
      avoid:['random face close-up','abstract background only','rendered text in image'],
    },
    'wisdom': {
      label:'명언·사자성어·철학',
      goal:'상징·여백·은유가 느껴지는 미니멀 장면',
      keywords:['path','mountain','sunrise','book','ink','lantern','calm landscape'],
      props:['old book','ink brush','empty wooden chair','lantern','single candle'],
      locations:['quiet mountain path at sunrise','minimal study room','foggy field'],
      framings:['wide minimal landscape','negative space composition','symbolic still life'],
      emotions:['serenity','contemplation','quiet wisdom'],
      defaultSubject:'a symbolic minimal scene with negative space conveying wisdom',
      avoid:['rendered quote text','crowded composition','random people','meme aesthetic'],
    },
    'tikitaka': {
      label:'티키타카·A vs B',
      goal:'좌/우 분할 또는 두 인물 대비 — 비교·반응 중심',
      keywords:['vs','two choices','reaction','split','contrast'],
      props:['two contrasting items side by side','two cups','two phones','left vs right setup'],
      locations:['neutral split background','clean studio with two zones'],
      framings:['split-screen feel','side-by-side composition','two-shot reaction'],
      emotions:['playful contrast','witty surprise','obvious difference'],
      defaultSubject:'a clear A vs B side-by-side scene showing two contrasting choices',
      avoid:['actual rendered text in image','only one side visible','unclear comparison'],
    },
    'comic': {
      label:'코믹·유머',
      goal:'표정·반전·어색한 순간이 보이는 코믹 연출',
      keywords:['funny','reaction','silly','awkward','timing'],
      props:['exaggerated prop','small comic object','speech-bubble-friendly empty space (no text)'],
      locations:['bright everyday setting','playful kitchen','colorful living room'],
      framings:['quick reaction shot','small zoom on face','comic pause framing'],
      emotions:['expressive surprise','playful smirk','tasteful awkwardness'],
      defaultSubject:'an expressive character reacting to a small everyday surprise',
      avoid:['mean-spirited mockery','stereotyping a group','offensive imagery'],
    },
    'drama': {
      label:'드라마·갈등·관계',
      goal:'갈등 상황, 인물 거리감, 영화적 조명',
      keywords:['conflict','door','hospital','tension','reveal'],
      props:['door slightly open','old photograph','phone ringing','empty seat at table'],
      locations:['dim hallway','dining table at night','rainy street','cinematic interior'],
      framings:['cinematic push-in','over-the-shoulder','dramatic two-shot'],
      emotions:['tension','quiet anger','realization','reconciliation arc'],
      defaultSubject:'a cinematic interior scene with two people at emotional distance',
      avoid:['over-the-top melodrama','violent imagery','sexual content'],
    },
    'music': {
      label:'가사·음원·노래',
      goal:'음악 분위기·무대·시대감',
      keywords:['stage','microphone','vintage cassette','night street','spotlight','album art mood'],
      props:['microphone','old cassette tape','vinyl record','guitar','stage spotlight'],
      locations:['intimate stage','nostalgic night street','small studio booth'],
      framings:['low-angle stage shot','silhouette against light','medium performer shot'],
      emotions:['lyrical emotion','melancholy','romantic warmth','quiet performance'],
      defaultSubject:'a singer in an intimate stage setting under warm spotlight',
      avoid:['imitating real artist','copying real album cover','rendered song lyrics'],
    },
    'public': {
      label:'공공기관·정책 안내',
      goal:'신뢰감 있는 정보 전달 장면',
      keywords:['citizen','application form','public office','desk','queue','consultation'],
      props:['application form','public service desk','printed brochure','clean signage area (no text)'],
      locations:['public service office','community center desk','clean info kiosk'],
      framings:['stable medium shot','clean documentary framing','over-the-shoulder of consultation'],
      emotions:['calm trust','clear guidance','reassurance'],
      defaultSubject:'a citizen receiving clear guidance at a public service desk',
      avoid:['exaggerated emotion','political imagery','fear-mongering','ambiguous procedure'],
    },
    'smb': {
      label:'소상공인 홍보',
      goal:'상품·매장·CTA 장면',
      keywords:['shop','product','customer','menu','seasonal item','local atmosphere'],
      props:['featured product on counter','clean menu board (no readable text)','cup','small shop sign area'],
      locations:['warm small shop interior','neighborhood cafe','local restaurant counter'],
      framings:['product close-up','customer-owner two-shot','wide cozy interior'],
      emotions:['friendly welcome','local warmth','trustworthy small business'],
      defaultSubject:'a friendly small shop owner serving a customer with the featured product',
      avoid:['fake brand logos','illegible text-heavy signs','random unrelated portraits'],
    },
    'how-to': {
      label:'정보·튜토리얼·방법',
      goal:'손동작·과정·도구 중심 단계 설명',
      keywords:['hands','steps','tool','how-to','demonstration','setup'],
      props:['hands using a tool','step indicator visual','workspace items'],
      locations:['clean workspace','simple home counter','tutorial-friendly studio'],
      framings:['top-down hands shot','medium step-by-step framing','isolated tool close-up'],
      emotions:['clear focus','helpful pace'],
      defaultSubject:'hands clearly demonstrating one step of a practical method',
      avoid:['random face only','cluttered background','rendered captions'],
    },
  };
  window.S3SC_STRATEGIES = STRATEGIES;

  /* genre alias 매핑 — STUDIO.project.s1.style/genre 와 호환 */
  const ALIAS = {
    senior:'senior-health', seniorHealth:'senior-health', '시니어건강':'senior-health',
    emotion:'senior-emotion', emotional:'senior-emotion', '감동':'senior-emotion',
    info:'general-info', knowledge:'general-info', '잡학':'general-info', '상식':'general-info',
    wisdom:'wisdom', '명언':'wisdom', '사자성어':'wisdom', philosophy:'wisdom',
    tikitaka:'tikitaka', '티키타카':'tikitaka',
    humor:'comic', comedy:'comic', '코믹':'comic', '유머':'comic',
    drama:'drama', shortDrama:'drama', '드라마':'drama',
    music:'music', lyrics:'music', '가사':'music', '음원':'music',
    publicReport:'public', publicInst:'public', '공공':'public', '공공기관':'public',
    smb:'smb', smallBiz:'smb', '소상공인':'smb',
    howto:'how-to', tutorial:'how-to', '튜토리얼':'how-to',
  };
  function _resolveGenre(key) {
    if (!key) return 'general-info';
    if (STRATEGIES[key]) return key;
    return ALIAS[key] || 'general-info';
  }
  window.s3SCResolveGenre = _resolveGenre;

  /* ════════════════════════════════════════════════
     2) Scene role 템플릿
     ════════════════════════════════════════════════ */
  const ROLE_RULES = {
    hook: {
      label:'훅', framing:'attention-grabbing close-up or dramatic framing',
      action:'a striking situation that immediately raises a question',
    },
    setup: {
      label:'셋업', framing:'medium shot establishing context',
      action:'introducing the situation calmly',
    },
    explanation: {
      label:'설명', framing:'medium shot, instructional framing',
      action:'demonstrating a method or principle with hands and props',
    },
    core: {
      label:'핵심', framing:'medium shot focused on the key action',
      action:'performing the central action with the result visible',
    },
    contrast: {
      label:'대비/반전', framing:'split-frame or side-by-side comparison',
      action:'showing before/after or A vs B clearly',
    },
    reveal: {
      label:'반전', framing:'reveal-frame, change in subject posture',
      action:'showing the unexpected truth',
    },
    cta: {
      label:'CTA', framing:'action-oriented frame with hand or device visible',
      action:'reaching for the phone, tapping save, making a call',
    },
    conclusion: {
      label:'결론', framing:'wider conclusive frame',
      action:'wrapping the story visually',
    },
  };
  window.S3SC_ROLE_RULES = ROLE_RULES;

  /* ════════════════════════════════════════════════
     3) Visual intent 추출 — 대본/씬 텍스트 → {action, props, location, emotion, framing, subject}
     ════════════════════════════════════════════════ */
  function extractIntent(scene, scriptText, genreKey) {
    var g = _resolveGenre(genreKey);
    var strat = STRATEGIES[g];
    var role = (scene && scene.role) || 'core';
    var roleRule = ROLE_RULES[role] || ROLE_RULES.core;
    var combined = ((scene && (scene.lines && scene.lines.join(' ') || scene.desc || scene.label)) || '') + ' ' + (scriptText || '');
    var lower = combined.toLowerCase();

    /* subject — 스크립트 내 키워드로 우선 추출 */
    var subject = '';
    if (/부모|어머니|아버지|親|母|父/.test(combined)) subject = 'an adult son or daughter holding a phone, hesitating over an old framed photograph of an elderly parent';
    else if (/할머니|할아버지|시니어|어르신|老人|シニア/.test(combined)) subject = 'a respectful senior person';
    else if (/사장|점주|손님|가게|매장|お店|店長/.test(combined)) subject = 'a small business owner with a customer';
    else if (/시민|민원|공무원|市民|窓口/.test(combined)) subject = 'a citizen at a public service desk';
    else if (/학생|아이|선생|生徒|学生/.test(combined)) subject = 'a student in a learning context';
    else if (/연인|커플|恋人/.test(combined))            subject = 'two people in a quiet relationship moment';
    else                                                   subject = strat.defaultSubject;

    /* action — role 우선, 키워드로 보강 */
    var action = roleRule.action;
    if (/운동|체조|스트레치|exercise|stretch/.test(lower))   action = 'doing a practical exercise with safe form';
    else if (/통화|전화|call|phone/.test(lower))             action = 'making or receiving a phone call thoughtfully';
    else if (/요리|음식|cook|cooking|food/.test(lower))      action = 'preparing or sharing a simple meal';
    else if (/공부|학습|study|learn/.test(lower))            action = 'studying or demonstrating a method';
    else if (/구매|판매|buy|sell|sale/.test(lower))          action = 'a customer-owner exchange around the product';
    else if (/신청|접수|apply|submit/.test(lower))           action = 'submitting or reviewing an application form';
    else if (/대비|비교|차이|vs|compare/.test(lower))         action = 'showing a clear A vs B contrast';

    /* location — 장르 default + 키워드 override */
    var location = strat.locations[0];
    if (/집|식탁|거실|home|living/.test(lower))               location = 'warm home interior';
    else if (/병원|진료|hospital/.test(lower))                location = 'quiet clinic corridor (only if essential)';
    else if (/거리|길|street|road/.test(lower))               location = 'evening neighborhood street';
    else if (/공원|park/.test(lower))                          location = 'small neighborhood park';
    else if (/사무실|office/.test(lower))                     location = 'small modest office';
    else if (/상점|매장|cafe|shop|store/.test(lower))         location = 'small neighborhood shop';
    else if (/관공서|시청|구청/.test(lower))                 location = 'public service office';
    else if (/무대|stage|stage light/.test(lower))            location = 'small intimate stage';

    /* keyObject / props — 스크립트 키워드 우선 */
    var props = [];
    var lookup = [
      [/사진|アルバム/, 'old framed family photograph'],
      [/전화|スマホ/, 'phone on the table'],
      [/편지|手紙/,   'handwritten letter'],
      [/약|薬/,        'medication packet'],
      [/지팡이|cane/,  'walking stick'],
      [/의자|chair/,   'sturdy wooden chair'],
      [/책|book/,      'old book'],
      [/안경|glasses/, 'reading glasses'],
      [/꽃|flower/,    'small bouquet'],
      [/카세트|cassette/,'vintage cassette tape'],
      [/지도|map/,     'paper map'],
      [/신청서|form/,  'application form'],
    ];
    lookup.forEach(function(pair){ if (pair[0].test(combined)) props.push(pair[1]); });
    if (!props.length) props = strat.props.slice(0, 2);
    /* generic portrait 방지 — 항상 최소 1개 props 보장 */
    if (props.length === 0) props.push(strat.props[0] || 'a meaningful everyday object');

    /* emotion */
    var emotion = strat.emotions[0];
    if (/후회|미안|regret/.test(lower))         emotion = 'restrained regret';
    else if (/감사|고마|gratitude/.test(lower)) emotion = 'quiet gratitude';
    else if (/외로|lonely/.test(lower))          emotion = 'gentle loneliness, not exaggerated';
    else if (/걱정|worried/.test(lower))         emotion = 'concerned but composed';
    else if (/기쁨|happy|joy/.test(lower))       emotion = 'soft contentment';
    else if (/놀람|surprise/.test(lower))        emotion = 'expressive surprise';

    /* framing — role 우선, 장르 보강 */
    var framing = roleRule.framing;
    if (g === 'tikitaka') framing = 'split-screen side-by-side composition';
    if (g === 'wisdom')   framing = 'wide minimal composition with negative space';
    if (g === 'how-to')   framing = 'top-down hands-on framing';

    return {
      genre: g, role: role, subject: subject, action: action, location: location,
      props: props, emotion: emotion, framing: framing, strategyLabel: strat.label,
    };
  }
  window.s3SCExtractIntent = extractIntent;

  /* ════════════════════════════════════════════════
     4) 프롬프트 컴파일 — intent → English prompt + negative
     ════════════════════════════════════════════════ */
  function compileScenePrompt(scene, ctx) {
    ctx = ctx || {};
    var genreKey = ctx.genre || ctx.style || 'general-info';
    var script   = ctx.scriptText || '';
    var aspectMode = ctx.aspectMode || (typeof window.s3DetectAspectMode === 'function' ? window.s3DetectAspectMode() : 'shorts');
    var aspectKw = (aspectMode === 'longform' || aspectMode === 'thumbnail')
      ? '16:9 horizontal, cinematic wide composition'
      : (aspectMode === 'cardnews') ? 'square 1:1 composition'
      : (aspectMode === 'cardnews45') ? '4:5 vertical composition'
      : '9:16 vertical, portrait composition, full vertical frame';

    var intent = extractIntent(scene, script, genreKey);
    var strat  = STRATEGIES[intent.genre];

    /* English prompt — comma-separated, 짧은 문장 위주 */
    var parts = [];
    parts.push(intent.subject);
    parts.push(intent.action);
    parts.push('at ' + intent.location);
    parts.push('with ' + intent.props.join(' and '));
    parts.push(intent.emotion + ' mood');
    parts.push(intent.framing);
    parts.push(strat.goal);
    parts.push('realistic photography, ' + aspectKw);
    parts.push('subject centered, no rendered text in image, no watermark');

    var prompt = parts.filter(Boolean).join(', ');

    /* Negative prompt — 장르별 avoid + 공통 */
    var avoidList = (strat.avoid || []).slice();
    avoidList.push('rendered text', 'watermark', 'logo', 'subtitles burned in', 'fake brand');
    /* portrait-only 방지 */
    avoidList.push('generic portrait close-up only with no context');
    var negative = avoidList.join(', ');

    return {
      prompt: prompt,
      negative: negative,
      intent: intent,
      aspectMode: aspectMode,
    };
  }
  window.s3SCCompilePrompt = compileScenePrompt;

  /* ════════════════════════════════════════════════
     5) 7항목 점수 — action/props/location/role/genre/anti-portrait/uniqueness
     ════════════════════════════════════════════════ */
  function scoreScenePrompt(prompt, intent, allPrompts) {
    var p = String(prompt || '').toLowerCase();
    var checks = {
      hasAction:       /(doing|holding|walking|sitting|reaching|making|preparing|exercising|stretching|reading|talking|listening|opening|using|cooking|writing|engag|demonstrat|reach|tap|call|review|submit|exchange|show|perform)/i.test(p) ? 5 : 1,
      hasProps:        intent && intent.props && intent.props.length && intent.props.some(function(x){ return p.indexOf(String(x).split(' ')[0].toLowerCase()) >= 0; }) ? 5 : 1,
      hasLocation:     intent && intent.location && p.indexOf(intent.location.split(' ')[0].toLowerCase()) >= 0 ? 5 : 1,
      hasRole:         intent && intent.role ? 5 : 2,
      hasGenre:        intent && intent.genre ? 5 : 2,
      antiPortrait:    /(generic portrait|close-?up only)/i.test(p) ? 0 : 5,
      uniqueness:      _uniquenessScore(prompt, allPrompts),
    };
    /* portrait 추가 감점 — 본문에 face/portrait/headshot 만 있고 action/props 없을 때 */
    var hasNoun = /(person|elderly|adult|customer|owner|child|student|citizen|singer)/i.test(p);
    var hasContext = /(at|with|holding|sitting|using|in front of|near)/i.test(p);
    if (hasNoun && !hasContext) checks.antiPortrait = Math.min(checks.antiPortrait, 1);

    var total = Object.keys(checks).reduce(function(a,k){ return a + (checks[k] || 0); }, 0);
    var max = 35;
    var percent = Math.round((total / max) * 100);
    var grade = percent >= 80 ? 'good' : percent >= 60 ? 'usable' : 'redo';
    var warnings = [];
    if (checks.hasAction < 3)    warnings.push('action 부족 — 행동 동사 추가 필요');
    if (checks.hasProps < 3)     warnings.push('props 부족 — 핵심 사물 명시 필요');
    if (checks.hasLocation < 3)  warnings.push('location 부족 — 장소 묘사 추가 필요');
    if (checks.antiPortrait < 3) warnings.push('인물 얼굴만 있는 generic portrait 우려 — 행동/배경 보강 필요');
    if (checks.uniqueness < 3)   warnings.push('다른 씬과 너무 유사 — 차별화 필요');
    return { items:checks, total:total, max:max, percent:percent, grade:grade, warnings:warnings };
  }
  window.s3SCScorePrompt = scoreScenePrompt;

  function _uniquenessScore(prompt, all) {
    if (!all || !all.length) return 5;
    var p = String(prompt || '').toLowerCase();
    var maxSim = 0;
    for (var i = 0; i < all.length; i++) {
      var other = all[i];
      if (!other || other === prompt) continue;
      var sim = _jaccard(_tok(p), _tok(String(other).toLowerCase()));
      if (sim > maxSim) maxSim = sim;
    }
    if (maxSim >= 0.85) return 0;
    if (maxSim >= 0.70) return 2;
    if (maxSim >= 0.55) return 3;
    return 5;
  }
  function _tok(s) {
    return s.split(/[^a-z가-힣0-9]+/).filter(function(t){ return t.length >= 3; });
  }
  function _jaccard(a, b) {
    if (!a.length || !b.length) return 0;
    var sa = new Set(a), sb = new Set(b), inter = 0;
    sa.forEach(function(t){ if (sb.has(t)) inter++; });
    var uni = sa.size + sb.size - inter;
    return uni ? inter / uni : 0;
  }

  /* ════════════════════════════════════════════════
     6) Augment — 점수 낮은 프롬프트 자동 보강
     ════════════════════════════════════════════════ */
  function augmentLowScore(prompt, intent) {
    var s = scoreScenePrompt(prompt, intent);
    if (s.percent >= 80) return prompt;
    var addParts = [];
    if (s.items.hasAction    < 3 && intent && intent.action)   addParts.push(intent.action);
    if (s.items.hasProps     < 3 && intent && intent.props)    addParts.push('with ' + intent.props.join(' and '));
    if (s.items.hasLocation  < 3 && intent && intent.location) addParts.push('at ' + intent.location);
    if (s.items.antiPortrait < 3) addParts.push('environmental scene with action and props, not just a portrait');
    if (!addParts.length) return prompt;
    return String(prompt || '').trim() + ', ' + addParts.join(', ');
  }
  window.s3SCAugment = augmentLowScore;

  /* ════════════════════════════════════════════════
     7) Tone variants — practical / emotional / informational / comic
     ════════════════════════════════════════════════ */
  function toneVariant(prompt, intent, tone) {
    var add = '';
    switch (tone) {
      case 'practical':     add = 'practical demonstration with clear hands-on action'; break;
      case 'emotional':     add = 'warm emotional connection, quiet expressive moment'; break;
      case 'informational': add = 'clean instructional composition, clarity over emotion'; break;
      case 'comic':         add = 'expressive playful reaction, tasteful comedic moment'; break;
      default: return prompt;
    }
    return String(prompt || '').trim() + ', ' + add;
  }
  window.s3SCToneVariant = toneVariant;

  /* ════════════════════════════════════════════════
     8) 일괄 컴파일 — 씬 수와 정확히 일치
     ════════════════════════════════════════════════ */
  function compileAllScenes(proj) {
    proj = proj || (window.STUDIO && window.STUDIO.project) || {};
    var s1 = proj.s1 || {};
    var s3 = proj.s3 || {};
    var genre  = s1.genre || s1.style || proj.style || 'general-info';
    var script = (proj.s2 && (proj.s2.scriptKo || proj.s2.scriptJa)) || proj.scriptText || proj.script || '';
    var scenes = (s3.scenes && s3.scenes.length) ? s3.scenes : [];

    /* 씬 수 결정 — s3.scenes 우선, 없으면 s1.sceneCount, 없으면 5 */
    var n = scenes.length || +s1.sceneCount || 5;
    if (!scenes.length) {
      /* placeholder scenes — role 만 부여 */
      var roles = (typeof window.s3RolesForCount === 'function') ? window.s3RolesForCount(n) : ['hook','core','cta'];
      scenes = roles.slice(0, n).map(function(r, i){
        return { label: '씬'+(i+1), role: r, time: '', desc: '', lines: [] };
      });
    }

    /* role annotate */
    if (typeof window.s3AnnotateScenesWithRoles === 'function') {
      scenes = window.s3AnnotateScenesWithRoles(scenes, n);
    }

    var aspectMode = (typeof window.s3DetectAspectMode === 'function') ? window.s3DetectAspectMode(proj) : 'shorts';
    var compiled = scenes.map(function(sc){
      return compileScenePrompt(sc, { genre: genre, scriptText: script, aspectMode: aspectMode });
    });
    /* 점수 (전체 prompts 배열 전달 — uniqueness 계산용) */
    var prompts = compiled.map(function(c){ return c.prompt; });
    compiled.forEach(function(c){ c.score = scoreScenePrompt(c.prompt, c.intent, prompts); });
    /* 60점 미만 자동 augment */
    compiled.forEach(function(c){
      if (c.score.percent < 60) {
        c.prompt = augmentLowScore(c.prompt, c.intent);
        c.score = scoreScenePrompt(c.prompt, c.intent, prompts);
        c.augmented = true;
      }
    });
    return { count: n, scenes: scenes, compiled: compiled, genre: genre, aspectMode: aspectMode };
  }
  window.s3SCCompileAll = compileAllScenes;

  /* ════════════════════════════════════════════════
     9) STUDIO.project 에 결과 적용
     ════════════════════════════════════════════════ */
  function applyCompiledToProject(result, opts) {
    opts = opts || {};
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    proj.s3 = proj.s3 || {};
    var compiled = result.compiled || [];
    proj.s3.scenes        = result.scenes || proj.s3.scenes;
    proj.s3.imagePrompts  = compiled.map(function(c){ return c.prompt; });
    proj.s3.scenePrompts  = compiled.map(function(c){
      return { prompt: c.prompt, negative: c.negative, intent: c.intent, score: c.score };
    });
    proj.s3.prompts       = compiled.map(function(c){ return c.prompt; }); /* 호환 */
    /* imagesV3[i].promptCompiled */
    proj.s3.imagesV3 = proj.s3.imagesV3 || {};
    compiled.forEach(function(c, i){
      proj.s3.imagesV3[i] = proj.s3.imagesV3[i] || {};
      proj.s3.imagesV3[i].promptCompiled = c.prompt;
      proj.s3.imagesV3[i].negative       = c.negative;
      proj.s3.imagesV3[i].promptScore    = c.score;
    });
    if (typeof window.studioSave === 'function') window.studioSave();
    if (opts.rerender !== false && typeof window.renderStudio === 'function') {
      window.renderStudio();
    }
    return proj.s3;
  }
  window.s3SCApplyToProject = applyCompiledToProject;

  /* 편의 함수 — 한번에 컴파일 + 저장 */
  window.s3SCCompileAndApply = function(opts) {
    var r = compileAllScenes();
    applyCompiledToProject(r, opts);
    return r;
  };
})();
