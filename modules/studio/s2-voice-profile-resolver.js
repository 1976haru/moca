/* ================================================
   modules/studio/s2-voice-profile-resolver.js
   Step 3 음성 — 대본 contentProfile 추출 (v2)

   * 핵심 원칙: mainCategory(대상/채널)는 contentType(유형/포맷)에
     절대 덮어쓰지 않는다.
     - 시니어 채널 + emotional 스타일 → mainCategory:senior + contentType:emotional + tone:warm
     - 시니어 채널 + info 스타일 → mainCategory:senior + contentType:info + tone:clear
     - 일반 채널 + info 스타일 → mainCategory:general + contentType:info + tone:clear
   * resolveContentProfile() 반환:
     {
       mainCategory:      'senior' | 'general' | 'japanese',
       mainCategoryLabel: '시니어' | '일반' | '일본어',
       contentType:       'info' | 'emotional' | 'comic' | ...
       contentTypeLabel:  '정보' | '감동' | '코믹' | ...
       tone:              'clear' | 'warm' | 'energetic' | ...
       toneLabel:         '명료함' | '따뜻함' | '활기참' | ...
       lang:              'ko' | 'ja' | 'both',
       channel, channelLabel, styleId, topic,
       sourcePath:        진단용 (어디서 어떤 값이 왔는지),
       reasons:           ['topic: 시니어 키워드', ...]
     }
   ================================================ */
(function(){
  'use strict';

  /* style id (S1_STYLES) → contentType / 기본 tone */
  var STYLE_TO_TYPE = {
    emotional: { type:'emotional', tone:'emotional' },
    info:      { type:'info',      tone:'clear' },
    humor:     { type:'comic',     tone:'energetic' },
    drama:     { type:'drama',     tone:'tense' },
    senior:    { type:'senior_life', tone:'warm' },  /* 명시적 senior style 자체 */
    knowledge: { type:'knowledge', tone:'documentary' },
    tikitaka:  { type:'dialog',    tone:'energetic' },
    trivia:    { type:'trivia',    tone:'curious' },
    saying:    { type:'wisdom',    tone:'calm' },
    lyric:     { type:'lyric',     tone:'expressive' },
    longform:  { type:'longform',  tone:'narration' },
    custom:    { type:'general',   tone:'neutral' },
  };

  /* contentType 라벨 */
  var TYPE_LABEL = {
    info:'정보', emotional:'감동', comic:'코믹', drama:'드라마',
    senior_life:'시니어 생활', knowledge:'지식', dialog:'티키타카',
    trivia:'잡학', wisdom:'명언·지혜', lyric:'가사·음원', longform:'롱폼',
    news:'뉴스', public:'공공·소상공인', general:'일반',
  };

  /* tone 라벨 */
  var TONE_LABEL = {
    emotional:'감동', warm:'따뜻함', calm:'차분함',
    clear:'명료함', energetic:'활기참', tense:'긴장감',
    documentary:'다큐멘터리', curious:'호기심', expressive:'표현력',
    narration:'내레이션', neutral:'중립', news:'뉴스',
  };

  /* category 라벨 */
  var CATEGORY_LABEL = {
    senior:'시니어', general:'일반', japanese:'일본어',
  };

  /* topic 키워드 */
  var SENIOR_KEYWORDS = ['시니어','60대','70대','80대','노후','노년','어르신','부모님','할머니','할아버지',
                         '실버','엔카','쇼와','관절','무릎','허리','연금','은퇴','요양'];
  var HEALTH_KEYWORDS = ['건강','통증','관절염','당뇨','혈압','다이어트','운동','스트레칭','재활'];
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

  function _normLang(v) {
    var x = String(v || '').toLowerCase();
    if (x === 'ja' || x === 'jp' || x.indexOf('일본') >= 0) return 'ja';
    if (x === 'both' || x === 'multi') return 'both';
    if (x === 'ko' || x === 'kr' || x.indexOf('한국') >= 0) return 'ko';
    return 'ko';
  }

  /* channel → category / lang / 라벨 */
  function _channelInfo(channel) {
    var c = String(channel || '').toLowerCase();
    var lang = 'ko', label = '🇰🇷 한국', isSenior = false;
    if (c === 'ja') { lang = 'ja'; label='🇯🇵 일본'; }
    else if (c === 'both') { lang = 'both'; label='🇰🇷🇯🇵 한·일'; }
    /* "senior" 채널 명시 (dashboard 에서 STUDIO.project.channel = 'senior') */
    if (c.indexOf('senior') >= 0 || c.indexOf('시니어') >= 0) {
      isSenior = true; label = '👴 시니어 채널';
    }
    return { lang: lang, channelLabel: label, isSeniorChannel: isSenior };
  }

  function resolveContentProfile() {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s1 = proj.s1 || {};
    var styleId = String(s1.genre || s1.style || proj.style || 'emotional').toLowerCase();
    var topic = (s1.topic || proj.topic || s1.title || proj.title || '').toString();
    var channel = proj.channel || s1.channel || 'ko';
    var ci = _channelInfo(channel);

    /* base style → contentType / tone */
    var base = STYLE_TO_TYPE[styleId] || STYLE_TO_TYPE.custom;
    var contentType = base.type;
    var tone        = base.tone;

    /* topic-based 가중치 */
    var seniorHit  = _hasAny(topic, SENIOR_KEYWORDS);
    var healthHit  = _hasAny(topic, HEALTH_KEYWORDS);
    var emotionHit = _hasAny(topic, EMOTIONAL_KW);
    var comicHit   = _hasAny(topic, COMIC_KW);
    var newsHit    = _hasAny(topic, NEWS_KW);

    /* mainCategory 결정 — channel/style/topic 순 */
    var mainCategory;
    if (ci.isSeniorChannel || styleId === 'senior' || seniorHit) {
      mainCategory = 'senior';
    } else if (ci.lang === 'ja') {
      mainCategory = 'japanese';
    } else {
      mainCategory = 'general';
    }

    /* topic 가 강한 경우 contentType 보정 (단, mainCategory 는 보존) */
    if (newsHit  && contentType === 'general') contentType = 'news';
    if (comicHit && contentType === 'general') contentType = 'comic';
    if (emotionHit && contentType === 'general') contentType = 'emotional';
    if (healthHit && contentType === 'general') contentType = 'info';

    /* tone 미세 조정 — senior + emotional → warm 강조 */
    if (mainCategory === 'senior' && contentType === 'emotional') tone = 'warm';
    if (mainCategory === 'senior' && contentType === 'info' && healthHit) tone = 'clear';
    if (contentType === 'emotional' && tone !== 'warm') tone = 'emotional';

    /* sourcePath — 진단 정보 */
    var sourcePath = [];
    sourcePath.push('style: s1.' + (s1.genre ? 'genre' : 's1.style') + '=' + styleId);
    if (proj.channel) sourcePath.push('channel: project.channel=' + proj.channel);
    if (ci.isSeniorChannel) sourcePath.push('channel: senior detected');
    if (seniorHit) sourcePath.push('topic: senior keyword');
    if (healthHit) sourcePath.push('topic: health keyword');
    if (emotionHit) sourcePath.push('topic: emotional keyword');

    var profile = {
      mainCategory:       mainCategory,
      mainCategoryLabel:  CATEGORY_LABEL[mainCategory] || mainCategory,
      contentType:        contentType,
      contentTypeLabel:   TYPE_LABEL[contentType] || contentType,
      tone:               tone,
      toneLabel:          TONE_LABEL[tone] || tone,
      lang:               ci.lang,
      channel:            channel,
      channelLabel:       ci.channelLabel,
      styleId:            styleId,
      topic:              topic,
      reasons:            [],
      sourcePath:         sourcePath.join(' / '),
      /* legacy 호환 — 이전 필드명 사용처를 위해 유지 */
      mainGenre:          mainCategory === 'senior' ? 'senior' : contentType,
      mainGenreLabel:     CATEGORY_LABEL[mainCategory] || mainCategory,
      target:             mainCategory === 'senior' ? 'senior' : 'general',
    };
    if (seniorHit) profile.reasons.push('topic: 시니어 키워드');
    if (healthHit) profile.reasons.push('topic: 건강 키워드');
    if (emotionHit) profile.reasons.push('topic: 감동 키워드');
    try {
      console.debug('[voice-profile] mainCategory:', profile.mainCategory,
                    '· contentType:', profile.contentType,
                    '· tone:', profile.tone,
                    '· lang:', profile.lang);
    } catch(_) {}
    return profile;
  }

  /* recommendation pool key (V2_VOICE_RECOMMEND 키) — mainCategory 우선 */
  function profileToRecommendKey(profile) {
    if (!profile) return 'emotional';
    /* mainCategory 가 senior 면 무조건 senior 풀 (contentType 별 순서 조정은 추천 측에서) */
    if (profile.mainCategory === 'senior') {
      /* senior 안에서 contentType 별 분기 */
      if (profile.contentType === 'emotional') return 'senior';     /* warm/emotional */
      if (profile.contentType === 'info')      return 'senior';     /* calm/clear */
      if (profile.contentType === 'knowledge') return 'senior';
      return 'senior';
    }
    if (profile.mainCategory === 'japanese' && profile.lang === 'ja') return 'japanese';
    /* general — contentType 별 풀 */
    var t = profile.contentType;
    if (t === 'comic')      return 'comic';
    if (t === 'drama')      return 'drama';
    if (t === 'news')       return 'news';
    if (t === 'public')     return 'public';
    if (t === 'dialog')     return 'dialog';
    if (t === 'knowledge' || t === 'wisdom' || t === 'trivia') return 'knowledge';
    if (t === 'info')       return 'info';
    if (t === 'emotional')  return 'emotional';
    return 'emotional';
  }

  /* UI 배지용 — 3개 항목 */
  function renderVoiceProfileBadge(profile) {
    if (!profile) return '';
    return ''+
      '<span class="v2-rec-badge category">대상: '+profile.mainCategoryLabel+'</span>'+
      '<span class="v2-rec-badge type">유형: '+profile.contentTypeLabel+'</span>'+
      '<span class="v2-rec-badge tone">톤: '+profile.toneLabel+'</span>';
  }

  window.resolveContentProfile = resolveContentProfile;
  window.profileToRecommendKey = profileToRecommendKey;
  window.renderVoiceProfileBadge = renderVoiceProfileBadge;
  window.V2_TYPE_LABEL_MAP     = TYPE_LABEL;
  window.V2_TONE_LABEL_MAP     = TONE_LABEL;
  window.V2_CATEGORY_LABEL_MAP = CATEGORY_LABEL;
  window._v2NormLang           = _normLang;
})();
