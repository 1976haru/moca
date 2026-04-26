/* ================================================
   modules/studio/s2-voice-profile-resolver.js
   Step 3 음성 — 대본 contentProfile 추출

   * resolveContentProfile() → { mainGenre, tone, target, lang, channel,
                                  channelLabel, mainGenreLabel, toneLabel }
   * 우선순위:
     - mainGenre: s1.genre/style → topic 키워드(senior/노후/건강 등) →
                   channel context(senior 채널이면 senior bias)
     - tone: emotional/warm/calm/news/comic 등 — style 또는 mode 에서 추출
     - target: senior / adult / general — channel + topic 키워드
     - lang: ko / ja / both / multi
   * "시니어 감동" 케이스 처리: mainGenre=senior 유지 + tone=emotional
   ================================================ */
(function(){
  'use strict';

  /* style id (S1_STYLES) → mainGenre / 기본 tone */
  var STYLE_TO_GENRE = {
    emotional: { genre:'senior_emotional', tone:'emotional' }, /* ex post에서 senior 채널이면 senior 로 */
    info:      { genre:'info',             tone:'clear' },
    humor:     { genre:'comic',            tone:'energetic' },
    drama:     { genre:'drama',            tone:'tense' },
    senior:    { genre:'senior',           tone:'warm' },
    knowledge: { genre:'knowledge',        tone:'documentary' },
    tikitaka:  { genre:'dialog',           tone:'energetic' },
    trivia:    { genre:'trivia',           tone:'curious' },
    saying:    { genre:'wisdom',           tone:'calm' },
    lyric:     { genre:'lyric',            tone:'expressive' },
    longform:  { genre:'longform',         tone:'narration' },
    custom:    { genre:'general',          tone:'neutral' },
  };

  /* mainGenre 라벨 */
  var GENRE_LABEL = {
    senior:'시니어', senior_emotional:'시니어 감동',
    info:'정보', comic:'코믹', drama:'드라마',
    knowledge:'지식', dialog:'티키타카', trivia:'잡학',
    wisdom:'명언·지혜', lyric:'가사·음원', longform:'롱폼',
    news:'뉴스', public:'공공·소상공인', general:'일반',
    japanese:'일본어',
  };

  /* tone 라벨 */
  var TONE_LABEL = {
    emotional:'감동', warm:'따뜻함', calm:'차분함',
    clear:'명료함', energetic:'활기참', tense:'긴장감',
    documentary:'다큐멘터리', curious:'호기심', expressive:'표현력',
    narration:'내레이션', neutral:'중립', news:'뉴스',
  };

  /* topic 키워드 → genre/target bias */
  var SENIOR_KEYWORDS = ['시니어','60대','70대','80대','노후','노년','어르신','부모님','할머니','할아버지',
                         '실버','엔카','쇼와','관절','무릎','허리','연금','은퇴','요양'];
  var HEALTH_KEYWORDS = ['건강','통증','관절염','당뇨','혈압','다이어트','운동','스트레칭','재활'];
  var INFO_KEYWORDS   = ['팁','노하우','방법','정리','비교','차이','이유','분석'];
  var EMOTIONAL_KW    = ['감동','눈물','후회','외로움','사랑','부모','자식','이별','가족'];
  var COMIC_KW        = ['웃긴','웃음','반전','어이','코믹','병맛'];
  var NEWS_KW         = ['뉴스','속보','공지','발표','정책','보도'];

  function _hasAny(text, kws) {
    if (!text) return false;
    var t = String(text).toLowerCase();
    for (var i = 0; i < kws.length; i++) {
      if (t.indexOf(kws[i].toLowerCase()) >= 0) return true;
    }
    return false;
  }

  /* lang 정규화 */
  function _normLang(v) {
    var x = String(v || '').toLowerCase();
    if (x === 'ja' || x === 'jp' || x.indexOf('일본') >= 0) return 'ja';
    if (x === 'both' || x === 'multi') return 'both';
    if (x === 'ko' || x === 'kr' || x.indexOf('한국') >= 0) return 'ko';
    return 'ko';
  }

  /* channel → target / lang 추정 */
  function _channelInfo(channel) {
    var c = String(channel || '').toLowerCase();
    var label = channel || '';
    var target = 'general', lang = 'ko';
    if (c === 'ja') { lang = 'ja'; target = 'general'; label='🇯🇵 일본'; }
    else if (c === 'both') { lang = 'both'; label='🇰🇷🇯🇵 한·일'; }
    else if (c === 'ko') { lang = 'ko'; label='🇰🇷 한국'; }
    /* "senior" 채널 특수 케이스 (dashboard 에서 STUDIO.project.channel = 'senior' 로 들어올 수 있음) */
    if (c.indexOf('senior') >= 0 || c.indexOf('시니어') >= 0) {
      target = 'senior'; if (lang === 'ko') label = '👴 시니어';
    }
    return { target: target, lang: lang, channelLabel: label };
  }

  function resolveContentProfile() {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s1 = proj.s1 || {};
    var styleId = (s1.genre || s1.style || proj.style || 'emotional').toLowerCase();
    var topic = (s1.topic || proj.topic || s1.title || proj.title || '').toString();
    var channel = proj.channel || s1.channel || 'ko';
    var ci = _channelInfo(channel);

    /* base mapping */
    var base = STYLE_TO_GENRE[styleId] || STYLE_TO_GENRE.custom;
    var mainGenre = base.genre;
    var tone      = base.tone;
    var target    = ci.target;

    /* topic 기반 bias */
    var seniorHit  = _hasAny(topic, SENIOR_KEYWORDS);
    var healthHit  = _hasAny(topic, HEALTH_KEYWORDS);
    var infoHit    = _hasAny(topic, INFO_KEYWORDS);
    var emotionHit = _hasAny(topic, EMOTIONAL_KW);
    var comicHit   = _hasAny(topic, COMIC_KW);
    var newsHit    = _hasAny(topic, NEWS_KW);

    if (seniorHit) target = 'senior';
    if (target === 'senior' && (mainGenre === 'senior_emotional' || mainGenre === 'general')) {
      mainGenre = 'senior';
      if (emotionHit || styleId === 'emotional') tone = 'emotional';
      else if (healthHit) tone = 'clear';
    }
    /* style=emotional → 시니어 채널/타깃이면 senior + emotional */
    if (styleId === 'emotional' && target === 'senior') {
      mainGenre = 'senior';
      tone = 'emotional';
    } else if (styleId === 'emotional') {
      /* 일반 채널의 감동 → emotional 단독 */
      mainGenre = 'senior_emotional'; /* compat: 추천 데이터에서 emotional 키와 매핑 */
      tone = 'emotional';
    }
    if (newsHit && mainGenre === 'general') { mainGenre = 'news'; tone = 'news'; }
    if (comicHit && mainGenre === 'general') { mainGenre = 'comic'; tone = 'energetic'; }
    if (ci.lang === 'ja') {
      /* 일본어 채널은 별도 추천 풀 사용 */
      if (mainGenre === 'general') mainGenre = 'japanese';
    }

    /* 라벨 */
    var mgLabelKey = mainGenre === 'senior_emotional' ? 'senior_emotional' : mainGenre;
    var profile = {
      mainGenre:      mainGenre,
      mainGenreLabel: GENRE_LABEL[mgLabelKey] || mainGenre,
      tone:           tone,
      toneLabel:      TONE_LABEL[tone] || tone,
      target:         target,
      lang:           ci.lang,
      channel:        channel,
      channelLabel:   ci.channelLabel,
      styleId:        styleId,
      topic:          topic,
      reasons:        []
    };
    if (seniorHit) profile.reasons.push('topic: 시니어 키워드');
    if (healthHit) profile.reasons.push('topic: 건강 키워드');
    if (emotionHit) profile.reasons.push('topic: 감동 키워드');
    if (target === 'senior') profile.reasons.push('target: senior');
    try { console.debug('[voice-profile] resolved:', profile.mainGenre, '·', profile.tone, '·', profile.target, '·', profile.lang); } catch(_) {}
    return profile;
  }

  /* recommendation pool key (s2-voice-data.js V2_VOICE_RECOMMEND 의 키) 매핑 */
  function profileToRecommendKey(profile) {
    if (!profile) return 'emotional';
    var g = profile.mainGenre;
    if (g === 'senior') return 'senior';
    if (g === 'senior_emotional') return 'emotional';
    if (g === 'comic') return 'comic';
    if (g === 'news') return 'news';
    if (g === 'public') return 'public';
    if (g === 'dialog') return 'dialog';
    if (g === 'japanese') return 'japanese';
    if (g === 'knowledge' || g === 'wisdom' || g === 'trivia') return 'knowledge';
    if (g === 'info') return 'info';
    if (g === 'drama') return 'drama';
    return 'emotional';
  }

  window.resolveContentProfile = resolveContentProfile;
  window.profileToRecommendKey = profileToRecommendKey;
  window.V2_GENRE_LABEL_MAP    = GENRE_LABEL;
  window.V2_TONE_LABEL_MAP     = TONE_LABEL;
  /* lang 정규화 helper 도 노출 (preview 에서 사용) */
  window._v2NormLang           = _normLang;
})();
