/* ================================================
   modules/studio/s2-voice-prompt-presets.js
   Step 3 음성 — 프롬프트 음성 제작소 프리셋

   * VPP_PURPOSE_PRESETS: 목적 카드 (10종 + 직접 작성)
   * VPP_SAMPLE_TEXT: 미리듣기 sample text (콘텐츠 언어/톤별)
   * vppBuildAutoPrompt(spec) — 사용자 옵션을 voice description 자연어로 변환
   ================================================ */
(function(){
  'use strict';

  /* ── 목적 프리셋 ── */
  var VPP_PURPOSE_PRESETS = [
    {
      id:'senior_info',
      label:'시니어 정보형',
      desc:'건강·생활·정보 — 신뢰감, 차분, 또렷',
      prompt:'A calm mature Korean information narrator with clear pronunciation, comfortable pacing, gentle articulation, and trustworthy tone suitable for senior-friendly health and lifestyle content.',
      tags:['mature','calm','clear','senior_friendly','documentary'],
      lang:'ko', tone:'clear', age:'mature',
    },
    {
      id:'senior_emotional',
      label:'시니어 감동형',
      desc:'가족·추억 — 따뜻함, 느린 호흡',
      prompt:'A warm mature Korean emotional narrator with soft delivery, slow gentle pacing, subtle emotional expression, and nostalgic storytelling tone for senior audiences.',
      tags:['warm','emotional','mature','narration'],
      lang:'ko', tone:'warm', age:'mature',
    },
    {
      id:'comic_shorts',
      label:'코믹 숏츠형',
      desc:'반전·웃음 — 활기, 빠른 리액션',
      prompt:'A bright energetic Korean shorts narrator with playful timing, expressive reactions, varied pitch, and comedic delivery suitable for short-form fun videos.',
      tags:['energetic','playful','bright','comic'],
      lang:'ko', tone:'energetic', age:'young',
    },
    {
      id:'tikitaka_host',
      label:'티키타카 진행자형',
      desc:'A vs B 비교 — 빠른 전환, 또렷',
      prompt:'A quick witty Korean dialogue host with clear articulation, dynamic pacing, conversational warmth, and engaging back-and-forth delivery for comparison and debate content.',
      tags:['energetic','clear','dialog','engaging'],
      lang:'ko', tone:'energetic', age:'adult',
    },
    {
      id:'trivia_info',
      label:'잡학·상식형',
      desc:'호기심 자극 — 명료, 다큐형',
      prompt:'A curious knowledgeable Korean narrator with documentary-style delivery, measured pacing, clear emphasis on key facts, and inquisitive engaging tone.',
      tags:['documentary','clear','curious','knowledge'],
      lang:'ko', tone:'documentary', age:'adult',
    },
    {
      id:'news_public',
      label:'뉴스/공공기관형',
      desc:'발표·공지 — 신뢰감, 정확',
      prompt:'A neutral professional Korean news anchor with clear precise articulation, steady pacing, formal tone, and authoritative delivery for news and public announcements.',
      tags:['news','neutral','clear','professional'],
      lang:'ko', tone:'news', age:'adult',
    },
    {
      id:'small_business',
      label:'소상공인 홍보형',
      desc:'밝고 친근 — 광고 멘트',
      prompt:'A bright and friendly Korean promotional narrator with approachable energy, warm delivery, clear call-to-action style, and inviting tone suitable for local business advertisements.',
      tags:['bright','warm','promotional','friendly'],
      lang:'ko', tone:'energetic', age:'adult',
    },
    {
      id:'wisdom_quote',
      label:'명언/철학형',
      desc:'지혜·교훈 — 깊은 호흡',
      prompt:'A calm reflective Korean narrator with deep pacing, gentle pauses, thoughtful inflection, and contemplative tone suitable for quotes, wisdom, and philosophical stories.',
      tags:['calm','reflective','wisdom','narration'],
      lang:'ko', tone:'calm', age:'mature',
    },
    {
      id:'japanese_emotion',
      label:'일본어 감성 내레이션형',
      desc:'따뜻함·향수 — 일본어',
      prompt:'A warm mature Japanese narrator with gentle emotional expression, calm pacing, clear pronunciation, and nostalgic storytelling tone suitable for senior-oriented Japanese content.',
      tags:['warm','emotional','mature','japanese','narration'],
      lang:'ja', tone:'warm', age:'mature',
    },
    {
      id:'custom',
      label:'직접 작성',
      desc:'사용자 voice description',
      prompt:'',
      tags:[],
      lang:'ko', tone:'neutral', age:'adult',
    },
  ];
  window.VPP_PURPOSE_PRESETS = VPP_PURPOSE_PRESETS;

  /* ── 미리듣기 sample text ── */
  var VPP_SAMPLE_TEXT = {
    ko_default: '안녕하세요. 이 목소리로 숏츠 나레이션을 생성합니다. 중요한 부분은 또렷하게, 감정은 자연스럽게 전달합니다.',
    ja_default: 'こんにちは。この声でショート動画のナレーションを作成します。大切な部分ははっきりと、自然な感情で伝えます。',
    ko_comic:    '잠깐만요, 이거 모르고 지나가면 진짜 손해입니다. 딱 10초만 들어보세요.',
    ko_senior:   '오늘은 무릎 건강을 지키는 쉬운 방법을 차분하게 알려드리겠습니다.',
    ko_emotional:'그때는 몰랐지만, 시간이 지나고 나서야 소중함을 알게 되는 순간이 있습니다.',
    ko_news:     '시청자 여러분 안녕하십니까. 오늘 발표된 주요 소식을 정리해드리겠습니다.',
    ko_promo:    '오늘 단 하루, 우리 매장 신메뉴를 가장 먼저 만나보세요.',
    ja_senior:   '今日は、膝の健康を守る簡単な方法を、ゆっくりとお伝えします。',
    ja_emotional:'あの時はわからなかったけれど、時間が経ってからこそ大切さに気づく瞬間があります。',
  };
  window.VPP_SAMPLE_TEXT = VPP_SAMPLE_TEXT;

  /* lang + tone → 적절한 sample text 선택 */
  function vppPickSampleText(lang, tone) {
    var L = String(lang || 'ko').toLowerCase();
    var T = String(tone || '').toLowerCase();
    if (L === 'ja') {
      if (T === 'warm' || T === 'emotional') return VPP_SAMPLE_TEXT.ja_emotional;
      if (T === 'clear' && /senior/i.test(T)) return VPP_SAMPLE_TEXT.ja_senior;
      return VPP_SAMPLE_TEXT.ja_default;
    }
    if (T === 'energetic') return VPP_SAMPLE_TEXT.ko_comic;
    if (T === 'warm' || T === 'emotional') return VPP_SAMPLE_TEXT.ko_emotional;
    if (T === 'news') return VPP_SAMPLE_TEXT.ko_news;
    if (T === 'clear' || T === 'documentary') return VPP_SAMPLE_TEXT.ko_senior;
    return VPP_SAMPLE_TEXT.ko_default;
  }
  window.vppPickSampleText = vppPickSampleText;

  /* ── 옵션 → voice description 자동 생성 ── */
  var GENDER_PHRASE = {
    male_tone: 'male voice', female_tone: 'female voice',
    neutral_tone: 'neutral voice', unknown: 'voice',
  };
  var AGE_PHRASE = {
    young: 'young', adult: 'adult', mature: 'mature middle-aged',
    senior: 'mature senior', unknown: '',
  };
  var LANG_PHRASE = { ko:'Korean', ja:'Japanese', both:'Korean and Japanese', multi:'multilingual' };
  var EMOTION_PHRASE = {
    calm: 'calm composed', warm: 'warm gentle', comic: 'playful comedic',
    trust: 'trustworthy authoritative', tense: 'tense dramatic',
    bright: 'bright cheerful', documentary: 'documentary informative',
  };
  var ENERGY_PHRASE = { low:'soft low energy', mid:'balanced energy', high:'high energetic' };
  var SPEED_PHRASE  = { slow:'slow pacing', mid:'comfortable pacing', fast:'quick brisk pacing' };
  var USAGE_PHRASE  = {
    shorts:'short-form video', longform:'long-form video',
    ad:'advertisement', explain:'explainer', character:'character voice', news:'news broadcast',
  };

  function vppBuildAutoPrompt(spec) {
    spec = spec || {};
    var parts = [];
    var ageP = AGE_PHRASE[spec.age] || '';
    var emoP = EMOTION_PHRASE[spec.emotion] || '';
    var energP = ENERGY_PHRASE[spec.energy] || '';
    var speedP = SPEED_PHRASE[spec.speed] || '';
    var langP = LANG_PHRASE[spec.lang] || 'Korean';
    var genderP = GENDER_PHRASE[spec.gender] || 'voice';
    var usageP = USAGE_PHRASE[spec.usage] || 'narration';

    /* "A {emotion} {age} {lang} {gender} with {energy}, {speed}, suitable for {usage}." */
    var head = 'A';
    if (emoP) head += ' ' + emoP;
    if (ageP) head += ' ' + ageP;
    head += ' ' + langP + ' ' + genderP;
    parts.push(head);
    var trailers = [];
    if (energP)  trailers.push(energP);
    if (speedP)  trailers.push(speedP);
    if (trailers.length) parts.push('with ' + trailers.join(', '));
    if (usageP) parts.push('suitable for ' + usageP);
    return parts.join(' ') + '.';
  }
  window.vppBuildAutoPrompt = vppBuildAutoPrompt;
})();
