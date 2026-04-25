/* ================================================
   modules/studio/s1-prompt-builder.js
   STEP 1 — AI 프롬프트 중앙화 (모드/장르/언어/AB 분기)
   호출자: s1-script-step.js 의 _s1Generate, _s1GenerateAB
   ================================================ */

window._s1Prompt = (function(){

  /* ── 헬퍼 ── */
  function _styleLabel(id) {
    if (typeof S1_STYLES === 'undefined') return id;
    var found = S1_STYLES.find(function(s){ return s.id === id; });
    return found ? found.label : id;
  }
  function _modeLabel(mode) {
    return mode === 'tikitaka' ? '티키타카'
         : mode === 'longform' ? '롱폼'
         : '일반 숏츠';
  }
  function _lenLabel(sec) {
    if (typeof _s1FormatLen === 'function') return _s1FormatLen(sec);
    if (sec < 60) return sec + '초';
    var m = Math.floor(sec/60), s = sec % 60;
    return s === 0 ? m + '분' : m + '분 ' + s + '초';
  }
  function _sceneCount(sec) {
    if (typeof _s1CalcScenes === 'function') return _s1CalcScenes(sec);
    if (sec <= 45)  return 3;
    if (sec <= 90)  return 5;
    if (sec <= 180) return 8;
    if (sec <= 360) return 12;
    return 18;
  }

  /* ── 언어 지시 ── */
  function _langInstruction(outputLang) {
    if (outputLang === 'ko') {
      return '반드시 한국어로만 작성하세요. 일본어 번역, 영어 단어, 외국어 표현 금지.';
    }
    if (outputLang === 'ja') {
      return '必ず日本語のみで作成してください。韓国語·英語·他言語の表現は禁止。日本のシニア視聴者に自然な敬体（です·ます体）で書いてください。';
    }
    /* both */
    return '한국어 대본을 먼저 작성한 후, 빈 줄을 띄우고 정확히 "=== 일본어 ===" 구분자를 출력하고, 그 아래에 일본어 번역본을 작성하세요. 양쪽 모두 같은 씬 구조를 유지하세요.';
  }

  /* ── 장르별 추가 지시 (s1-style-panels.js 의 settings 기반) ── */
  function _genreInstruction(opts) {
    var lines = [];
    var genre = opts.genre || opts.style;
    var s = opts.s1 || {};

    /* 💗 감동 (emotional) */
    if (genre === 'emotional') {
      var em = s.emotionSettings || {};
      lines.push('');
      lines.push('[감동 모드]');
      if (em.emotionType)   lines.push('감동 유형: ' + em.emotionType);
      if (em.emotionFlow)   lines.push('감정 흐름: ' + em.emotionFlow);
      if (em.emotionLevel)  lines.push('감정 강도: ' + em.emotionLevel);
      if (em.endingTone)    lines.push('결말 톤: ' + em.endingTone);
      if (em.emotionDevice) lines.push('감동 장치: ' + em.emotionDevice);
      if (em.extraInstruction) lines.push('추가 지시: ' + em.extraInstruction);
      lines.push('주의: 과도한 신파·억지 눈물 금지. 장면이 머릿속에 그려지게 작성.');
      lines.push('마지막 1문장은 시청자가 댓글을 남기고 싶게 만드는 한 줄로 마무리.');
    }

    /* 📊 정보 (info) */
    else if (genre === 'info') {
      var inf = s.infoSettings || {};
      lines.push('');
      lines.push('[정보 모드]');
      if (inf.infoType)      lines.push('정보 유형: ' + inf.infoType);
      if (inf.structure)     lines.push('전달 구조: ' + inf.structure + ' — 이 구조를 실제 대본 흐름에 그대로 반영하세요.');
      if (inf.difficulty)    lines.push('난이도: ' + inf.difficulty);
      if (inf.trustStyle)    lines.push('신뢰도 표현: ' + inf.trustStyle);
      if (inf.viewerBenefit) lines.push('시청자 이득: ' + inf.viewerBenefit + ' (첫 문장에 격차/손실 회피 훅으로 강조)');
      if (inf.ctaType)       lines.push('CTA 유형: ' + inf.ctaType);
      if (inf.extraInstruction) lines.push('추가 지시: ' + inf.extraInstruction);
      lines.push('주의: 추상적 설명보다 구체적 예시·숫자 포함. 어려운 용어는 쉬운 말로 풀기.');
      lines.push('주의: 과장된 단정 금지. 건강·금융·법률 관련은 단정적 조언이 아닌 일반 정보 형태로.');
    }

    /* 👵 시니어 (senior) */
    else if (genre === 'senior') {
      var se = s.seniorSettings || {};
      lines.push('');
      lines.push('[시니어 모드]');
      if (se.interest)      lines.push('관심 분야: ' + se.interest);
      if (se.ageTarget)     lines.push('대상 연령 느낌: ' + se.ageTarget);
      if (se.speechTone)    lines.push('말투: ' + se.speechTone);
      if (se.mood)          lines.push('영상 분위기: ' + se.mood);
      if (se.structure)     lines.push('구성 방식: ' + se.structure + ' — 이 흐름을 실제 대본에 반영하세요.');
      if (se.captionBreath) lines.push('자막/호흡 규칙: ' + se.captionBreath);
      if (se.cautionRules)  lines.push('주의할 표현: ' + se.cautionRules + ' (반드시 준수)');
      if (se.extraInstruction) lines.push('추가 지시: ' + se.extraInstruction);
      lines.push('주의: 문장은 짧고 천천히 읽히게. 시니어가 실제로 공감할 생활 장면 포함.');
      lines.push('주의: 존중하는 표현 사용. 불안 조장보다 해결책 중심.');
      lines.push('마지막에는 저장·공유·댓글 유도 중 하나를 자연스럽게 포함.');
    }

    if (genre === 'tikitaka') {
      var t = s.tikiSettings || {};
      lines.push('');
      lines.push('[티키타카 모드 — A vs B 배틀 형식]');
      if (t.subGenre)  lines.push('소분류: ' + t.subGenre);
      if (t.a && t.b)  lines.push('A 측: ' + t.a + ' / B 측: ' + t.b);
      if (t.angle)     lines.push('승부 각도: ' + t.angle);
      if (t.pride!=null)   lines.push('자부심·국뽕 강도: ' + t.pride + '/5');
      if (t.comedy!=null)  lines.push('코미디 강도: ' + t.comedy + '/5');
      if (t.extra)     lines.push('추가 지시: ' + t.extra);
      lines.push('각 씬에 화자 표시(A:/B:)를 명확히 넣고 양측의 주장·반박·결말을 균형있게 배치하세요.');
    }

    else if (genre === 'humor') {
      var h = s.humorSettings || {};
      lines.push('');
      lines.push('[코믹·유머 모드]');
      if (h.humorType) lines.push('유머 유형: ' + h.humorType);
      if (h.rating)    lines.push('등급: ' + h.rating);
      if (h.structure) lines.push('개그 구조: ' + h.structure);
      if (h.extra)     lines.push('추가 지시: ' + h.extra);
      lines.push('웃음 포인트는 자연스럽게 배치, 시청자가 댓글로 공감하게 만드세요.');
    }

    else if (genre === 'drama') {
      var d = s.dramaSettings || {};
      lines.push('');
      lines.push('[숏드라마 모드]');
      if (d.dramaGenre) lines.push('드라마 장르: ' + d.dramaGenre);
      if (d.structure)  lines.push('드라마 구조: ' + d.structure);
      if (d.scenarioHint) lines.push('시나리오 힌트: ' + d.scenarioHint);
      if (d.emotionStrength != null) lines.push('감정 강도: ' + d.emotionStrength + '/5');
      if (d.characters) lines.push('등장인물: ' + d.characters);
      if (d.setting)    lines.push('배경: ' + d.setting);
      if (d.extra)      lines.push('추가 지시: ' + d.extra);
      lines.push('대사와 지문을 분리하고, 시청자가 마지막에 감정적으로 멈출 수 있는 한 문장을 두세요.');
    }

    else if (genre === 'knowledge') {
      var k = s.knowledgeSettings || {};
      lines.push('');
      lines.push('[전문지식 모드]');
      if (k.format)     lines.push('포맷: ' + k.format);
      if (k.field)      lines.push('분야: ' + k.field);
      if (k.difficulty) lines.push('난이도: ' + k.difficulty);
      if (k.references) lines.push('참고 사실: ' + k.references);
      lines.push('출처가 명확한 정보만 사용하고, 한 문장은 짧고 명료하게.');
    }

    else if (genre === 'trivia') {
      var tv = s.triviaSettings || {};
      lines.push('');
      lines.push('[잡학·트리비아 모드]');
      if (tv.field)  lines.push('분야: ' + tv.field);
      if (tv.tone)   lines.push('톤: ' + tv.tone);
      if (tv.target) lines.push('타겟: ' + tv.target);
      lines.push('"몰랐던 사실 1가지" → "왜 그런지" → "이게 우리에게 뭔지" 구조 권장.');
    }

    else if (genre === 'saying') {
      var sy = s.sayingSettings || {};
      lines.push('');
      lines.push('[사자성어·명언 모드]');
      if (sy.type)   lines.push('유형: ' + sy.type);
      if (sy.theme)  lines.push('테마: ' + sy.theme);
      if (sy.format) lines.push('포맷: ' + sy.format);
      lines.push('원문 → 뜻 → 현대 적용 → 한 줄 메시지 구조 권장.');
    }

    else if (genre === 'lyric') {
      /* 가사/음원은 lyric-panel 의 별도 prompt builder 가 처리 */
      var ly = s.lyricSettings || {};
      lines.push('');
      lines.push('[가사/음원 모드]');
      if (ly.musicGenre)   lines.push('음악 장르: ' + ly.musicGenre);
      if (ly.nostalgia!=null) lines.push('향수 강도: ' + ly.nostalgia + '/5');
      if (ly.era)          lines.push('향수 시대: ' + ly.era);
      if (ly.lyricMood)    lines.push('가사 감성 코드: ' + ly.lyricMood);
      if (ly.duration)     lines.push('음원 길이: ' + ly.duration);
      if (ly.extra)        lines.push('추가 지시: ' + ly.extra);
      lines.push('가사 본문 + Suno Style 힌트 + Suno Lyrics 형식으로 함께 작성하세요.');
      lines.push('형식: "=== 가사 ===" 본문 → "=== Suno Style ===" 키워드 → "=== Suno Lyrics ===" 출력용.');
    }

    else if (genre === 'longform') {
      lines.push('');
      lines.push('[롱폼 영상 — 챕터 구조]');
      lines.push('오프닝(시청 유지 훅) → 파트 3~5개(각각 소제목 명시) → 마무리(요약 + CTA).');
      lines.push('각 파트 시작에 "## 파트 N — [소제목]" 형식의 챕터 마커를 넣으세요.');
    }

    return lines.join('\n');
  }

  /* ── 모드별 추가 지시 ── */
  function _modeInstruction(mode, opts) {
    var lines = [];
    if (mode === 'tikitaka') {
      lines.push('');
      lines.push('[모드: 티키타카] A vs B 배틀 형식. 화자를 명확히 구분.');
    } else if (mode === 'longform') {
      lines.push('');
      lines.push('[모드: 롱폼] 챕터 구조. 오프닝·파트3~5·마무리. max_tokens 5000.');
    }
    return lines.join('\n');
  }

  /* ── A/B 버전별 톤 지시 ── */
  function _abVariantInstruction(variant) {
    if (variant === 'A') {
      return '\n\n[버전 A — 안정형]\n정보 중심 · 신뢰감 강조 · 차분한 어투. 사실관계와 출처를 중심에 두고 후킹은 절제하세요.';
    }
    if (variant === 'B') {
      return '\n\n[버전 B — 자극형]\n후킹 강조 · 감정 자극 · 댓글 유도형. 첫 3초에 강한 질문/충격 + 마지막에 댓글 유도 한 문장.';
    }
    return '';
  }

  /* ════════════════════════════════════════════════
     메인 빌더
     ════════════════════════════════════════════════ */
  function build(opts) {
    var topic   = opts.topic || '';
    var mode    = opts.mode  || 'general';
    var style   = opts.genre || opts.style || 'emotional';
    var lengthSec = opts.length || 60;
    var outputLang= opts.outputLang || opts.lang || 'both';
    var hook    = opts.hook || 'R';
    var hookStr = opts.hookStr  || 3;
    var trustStr= opts.trustStr || 3;
    var adv     = opts.adv || {};
    var abVariant = opts.abVariant || null;

    var styleLabel  = _styleLabel(style);
    var lenLabel    = _lenLabel(lengthSec);
    var sceneCount  = _sceneCount(lengthSec);

    var hookMap = {
      A:'역설형 — "사실은 정반대였습니다" 유형',
      B:'질문형 — "왜 이런 일이 일어날까요?" 유형',
      C:'충격형 — "믿기 힘든 사실" 유형',
      R:'AI가 가장 적절한 패턴 선택',
    };
    var ctaMap = {
      A:'시청자에게 비슷한 경험을 묻는 질문형 CTA',
      B:'다음편 시청을 유도하는 연결형 CTA',
      C:'시청자가 자기 점검하는 체크리스트형 CTA',
      D:'저장·공유를 유도하는 CTA',
      auto:'주제·맥락에 가장 자연스러운 CTA',
    };

    var lines = [];
    lines.push('당신은 유튜브 숏츠/롱폼 영상 전문 대본 작가입니다.');
    lines.push('주어진 주제로 ' + lenLabel + ' 분량의 ' + styleLabel + ' 스타일 영상 대본을 작성하세요.');
    lines.push('대본은 반드시 ' + sceneCount + '개 씬으로 나누세요.');
    lines.push('각 씬은 "씬N: [씬 설명]" 형식으로 시작하세요.');
    lines.push('첫 씬은 강력한 훅 — 패턴: ' + (hookMap[hook] || hookMap.R));
    lines.push('훅 강도: ' + hookStr + '/5, 신뢰도 톤: ' + trustStr + '/5.');
    lines.push('마지막 씬 CTA: ' + (ctaMap[adv.cta] || ctaMap.auto) + '.');

    if (adv.moodTone)    lines.push('분위기/톤: ' + adv.moodTone);
    if (adv.seriesEp)    lines.push('시리즈 회차 — 제목/도입에 "' + adv.seriesEp + '" 표시.');
    if (adv.prevPreview) lines.push('이전 편 예고 내용 이어받기: ' + adv.prevPreview);
    if (adv.nextPreview) lines.push('마지막에 다음 편 예고 포함: ' + adv.nextPreview);
    else                 lines.push('다음 편 예고가 없으므로 임의로 만들지 마세요.');
    if (adv.prevTopics)  lines.push('이전 편 주제와 중복 금지: ' + adv.prevTopics);
    if (adv.keyMessage)  lines.push('이번 편 핵심 메시지(반드시 포함): ' + adv.keyMessage);

    /* 모드별 추가 */
    var modeExtra = _modeInstruction(mode, opts);
    if (modeExtra) lines.push(modeExtra);

    /* 장르별 추가 */
    var genreExtra = _genreInstruction(opts);
    if (genreExtra) lines.push(genreExtra);

    /* 언어 지시 — 핵심 fix */
    lines.push('');
    lines.push('[출력 언어 — 절대 위반 금지]');
    lines.push(_langInstruction(outputLang));

    /* A/B 버전별 톤 */
    if (abVariant) lines.push(_abVariantInstruction(abVariant));

    if (adv.extra) {
      lines.push('');
      lines.push('[추가 지시]');
      lines.push(adv.extra);
    }

    var sys = lines.join('\n');
    var user = '주제: ' + topic + '\n모드: ' + _modeLabel(mode) +
               '\n스타일: ' + styleLabel +
               '\n길이: ' + lenLabel + ' (' + sceneCount + '씬)' +
               '\n출력언어: ' + (outputLang === 'ko' ? '한국어만' : outputLang === 'ja' ? '日本語のみ' : '한국어+일본어 동시');

    return { sys: sys, user: user };
  }

  /* ════════════════════════════════════════════════
     출력 파싱 — 언어별 분기
     ════════════════════════════════════════════════ */
  function parseOutput(rawText, outputLang) {
    var raw = (rawText || '').trim();
    if (outputLang === 'ko') {
      return { ko: raw, ja: '', primary: raw };
    }
    if (outputLang === 'ja') {
      return { ko: '', ja: raw, primary: raw };
    }
    /* both: split on === 일본어 === */
    var parts = raw.split(/={3,}\s*일본어\s*={3,}/i);
    var ko = (parts[0] || '').trim();
    var ja = (parts[1] || '').trim();
    return { ko: ko, ja: ja, primary: ko || ja };
  }

  /* ── 공개 API ── */
  return { build: build, parseOutput: parseOutput };
})();
