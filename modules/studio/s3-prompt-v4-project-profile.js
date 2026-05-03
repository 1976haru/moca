/* ================================================
   modules/studio/s3-prompt-v4-project-profile.js
   ⭐ v4 — 프로젝트 전체 프로파일 분석기
   * window.analyzeProjectProfileV4(project)
       → {
           topic, subTopic, genre, audience, tone, visualWorldType,
           narratorMode, continuityCharacters, continuityWardrobe,
           continuitySetting, tabooElements, mustNotGenericize,
           platform, aspectRatio, subtitleSafeTopPct, subtitleSafeBottomPct,
           scriptDigest, language
         }
   * 결정적 (rule-based, AI 호출 없음). 한국어/일본어 대본 모두 지원.
   * 다른 v4 모듈의 입력으로 사용된다.
   ================================================ */
(function(){
  'use strict';

  function _proj(){
    return (window.STUDIO && window.STUDIO.project) || {};
  }
  function _scriptText(p){
    var s2 = p.s2 || {};
    return (s2.scriptKo || s2.scriptJa || p.scriptText || p.script || p.scriptKo || p.scriptJa || '').toString();
  }
  function _has(re, s){ return re.test(String(s||'')); }

  /* ════════════════════════════════════════════════
     장르 감지 — 키워드 가중합. 가장 높은 점수 채택
     ════════════════════════════════════════════════ */
  var GENRE_KEYWORDS = {
    info:           [/팁|꿀팁|방법|어떻게|정보|상식|how to|tip\b|tips\b|guide\b/i, /\b\d+가지\b|\b\d+\s*개\b/i, /알려드릴|알려드립니다|알아둘|반드시 알아야/i],
    emotional:      [/감동|사연|눈물|어머니|아버지|할머니|할아버지|가족|회상|그리움|미안|고마/i, /진짜 이야기|실화|마지막 인사/i],
    comic:          [/웃긴|웃기는|코미디|개그|ㅋㅋ|뜨악|어이없|대박/i, /반전|충격적|기상천외/i],
    wisdom:         [/명언|한마디|인생|진리|wisdom|quote|aphorism|좌우명|한줄/i, /나이가 들수록|살아보니|진짜 행복은/i],
    tikitaka:       [/A:|B:|A측|B측|vs\b|대결|티키타카|왓더벌써|상대방/i],
    senior_info:    [/시니어|노년|6\d대|7\d대|8\d대|어르신|シニア|高齢|退職|연금|국민연금|건강검진|골다공/i],
    animal_anime:   [/동물|강아지|고양이|반려|토끼|곰돌이|냥이|멍멍|犬|猫|うさぎ/i],
    real_korea:     [/한옥|아파트 단지|한국 시골|동네 구멍가게|한국식 식당|광장시장|동네 미용실/i],
    real_japan:     [/和室|畳|障子|寿司|ラーメン|일본 가정|일본 주택|동네 駅|商店街/i],
    news:           [/속보|뉴스|어제 발표|발표|공식|보도|취재|증언/i],
  };
  function _detectGenre(profile, scriptText){
    var s1 = (profile.s1 || profile) || {};
    var explicit = (s1.genre || s1.style || profile.style || '').toString().toLowerCase().trim();
    /* 명시적 선택이 있으면 그걸 정규화 */
    var explicitMap = {
      info:'info', '정보':'info', '정보형':'info',
      emotional:'emotional', '감동':'emotional', '감동형':'emotional',
      comic:'comic', '코믹':'comic', '유머':'comic', '코미디':'comic',
      wisdom:'wisdom', '명언':'wisdom',
      tikitaka:'tikitaka', '티키타카':'tikitaka',
      senior_info:'senior_info', '시니어':'senior_info', '시니어잡학':'senior_info',
      animal:'animal_anime', '동물':'animal_anime', '애니':'animal_anime',
      animal_character:'animal_anime', '동물의인화':'animal_anime', '의인화':'animal_anime',
      real_korea:'real_korea', '실사한국':'real_korea',
      real_japan:'real_japan', '실사일본':'real_japan',
      news:'news', '뉴스':'news', '뉴스형':'news',
    };
    if (explicitMap[explicit]) return explicitMap[explicit];

    /* 키워드 가중합 */
    var scores = {};
    Object.keys(GENRE_KEYWORDS).forEach(function(g){
      scores[g] = 0;
      GENRE_KEYWORDS[g].forEach(function(re){
        if (re.test(scriptText)) scores[g] += 1;
      });
    });
    /* 시니어 + 정보 동시 매칭은 senior_info 우선 */
    if (scores.senior_info >= 1 && scores.info >= 1) scores.senior_info += 1;
    /* 가장 높은 점수 채택 */
    var best = 'info', bestScore = -1;
    Object.keys(scores).forEach(function(g){
      if (scores[g] > bestScore) { bestScore = scores[g]; best = g; }
    });
    return bestScore <= 0 ? 'info' : best;
  }

  /* ════════════════════════════════════════════════
     visualWorldType — 실사/애니/동물/3D
     ════════════════════════════════════════════════ */
  function _detectVisualWorldType(scriptText, profile, genre){
    var s3 = profile.s3 || {};
    var artStyle = String(s3.artStyle || '').toLowerCase();
    if (/anime|webtoon|3dcg|emoji|sketch|popart|ukiyo|infographic|ghibli/i.test(artStyle)) {
      if (/ukiyo/i.test(artStyle)) return 'animation_japan';
      if (/3dcg/i.test(artStyle))   return '3d_character';
      if (/emoji/i.test(artStyle))  return 'emoji';
      return 'animation_general';
    }
    if (genre === 'animal_anime')          return 'animal_character';
    if (genre === 'real_japan')            return 'real_japan';
    if (genre === 'real_korea')            return 'real_korea';
    if (genre === 'senior_info') {
      /* channel 또는 일본어 대본이면 일본 시니어, 그 외 한국 시니어 */
      var lang = (profile.channel || profile.lang || '').toString().toLowerCase();
      if (lang === 'ja' || lang === 'japan' || /일본/.test(scriptText)) return 'real_japan';
      return 'real_korea';
    }
    return 'real_general';
  }

  /* ════════════════════════════════════════════════
     audience / tone / narratorMode
     ════════════════════════════════════════════════ */
  function _detectAudience(scriptText, genre, profile){
    var s1 = profile.s1 || {};
    if (s1.target) return s1.target;
    if (genre === 'senior_info' || /6\d대|7\d대|시니어|어르신|シニア|退職|연금/.test(scriptText)) {
      var lang = (profile.channel || profile.lang || '').toString().toLowerCase();
      if (lang === 'ja' || /日本|일본/.test(scriptText)) return 'japanese_senior';
      return 'korean_senior';
    }
    if (/학생|아이|kid/i.test(scriptText)) return 'youth';
    return 'general';
  }
  function _detectTone(scriptText, genre){
    if (genre === 'comic')     return 'humorous';
    if (genre === 'emotional') return 'warm';
    if (genre === 'wisdom')    return 'reflective';
    if (genre === 'news')      return 'serious';
    if (genre === 'tikitaka')  return 'lively';
    if (/충격|놀라|반전/.test(scriptText)) return 'surprising';
    if (/따뜻|포근|감사/.test(scriptText)) return 'warm';
    return 'clear';
  }
  function _detectNarratorMode(scriptText){
    /* A:/B: 화자 표시면 dialog */
    if (/(^|\n)\s*[AB][:：]/.test(scriptText)) return 'dialog';
    if (/(^|\n)\s*(narr|narrator|내레이션)\s*[:：]/i.test(scriptText)) return 'narration';
    /* "나는", "내가", "제가" 빈도가 높으면 monologue */
    var monoHits = (scriptText.match(/(^|\s)(나는|내가|제가|私は|僕は)/g) || []).length;
    if (monoHits >= 3) return 'monologue';
    /* 인터뷰 마커 */
    if (/Q\.|A\.|질문[:：]|답변[:：]|interviewer/i.test(scriptText)) return 'interview';
    return 'narration';
  }

  /* ════════════════════════════════════════════════
     continuity 추출 — 등장인물/의상/장소
     ════════════════════════════════════════════════ */
  var CHARACTER_HINTS = [
    { re:/할머니|おばあ|grandma/i, label:'an elderly woman in her 70s' },
    { re:/할아버지|おじい|grandpa/i, label:'an elderly man in his 70s' },
    { re:/어머니|엄마|お母さん|mother\b/i, label:'a middle-aged woman (mother)' },
    { re:/아버지|아빠|お父さん|father\b/i, label:'a middle-aged man (father)' },
    { re:/딸|娘|daughter\b/i, label:'an adult daughter' },
    { re:/아들|息子|son\b/i, label:'an adult son' },
    { re:/손주|孫|grandchild/i, label:'a young grandchild' },
    { re:/부부|夫婦|married couple/i, label:'a married couple' },
    { re:/의사|医師|doctor\b/i, label:'a doctor' },
    { re:/간호사|看護師|nurse\b/i, label:'a nurse' },
    { re:/사장|店長|owner\b/i, label:'a small business owner' },
    { re:/직원|従業員|employee/i, label:'a staff member' },
    { re:/손님|お客|customer/i, label:'a customer' },
  ];
  function _detectCharacters(scriptText){
    var seen = {}, list = [];
    CHARACTER_HINTS.forEach(function(c){
      if (c.re.test(scriptText) && !seen[c.label]) {
        seen[c.label] = true;
        list.push(c.label);
      }
    });
    return list;
  }

  var WARDROBE_HINTS = [
    { re:/한복|hanbok/i, label:'traditional Korean hanbok' },
    { re:/기모노|着物|kimono/i, label:'traditional Japanese kimono' },
    { re:/유카타|浴衣|yukata/i, label:'casual yukata' },
    { re:/정장|スーツ|suit\b/i, label:'modest business suit' },
    { re:/앞치마|エプロン|apron/i, label:'kitchen apron' },
    { re:/병원복|hospital gown/i, label:'hospital gown' },
    { re:/카디건|cardigan|セーター/i, label:'soft cardigan' },
    { re:/안경|眼鏡|glasses\b/i, label:'reading glasses' },
  ];
  function _detectWardrobe(scriptText){
    var list = [];
    WARDROBE_HINTS.forEach(function(w){
      if (w.re.test(scriptText)) list.push(w.label);
    });
    return list;
  }

  var SETTING_HINTS = [
    { re:/한옥|韓屋/i, label:'Korean hanok-style home interior' },
    { re:/아파트|マンション/i, label:'modern Korean apartment interior' },
    { re:/일본 주택|日本家屋|畳/i, label:'Japanese home with tatami' },
    { re:/시골|田舎/i, label:'rural countryside setting' },
    { re:/병원|病院/i, label:'hospital setting' },
    { re:/카페|cafe|喫茶/i, label:'cozy cafe setting' },
    { re:/공원|公園|park\b/i, label:'park setting' },
    { re:/시장|市場|market\b/i, label:'traditional market setting' },
    { re:/지하철|電車|subway|train/i, label:'subway or commuter train setting' },
  ];
  function _detectSetting(scriptText){
    var list = [];
    SETTING_HINTS.forEach(function(s){
      if (s.re.test(scriptText)) list.push(s.label);
    });
    return list;
  }

  /* ════════════════════════════════════════════════
     taboo / mustNotGenericize
     ════════════════════════════════════════════════ */
  function _buildTaboos(genre, visualWorldType){
    var t = [
      'no rendered text in image', 'no watermark', 'no logo',
      'no celebrity likeness', 'no signature', 'no trademark mark',
      'no extra fingers', 'no extra limbs', 'no distorted hands',
      'no medical horror', 'no exaggerated grief',
    ];
    if (visualWorldType === 'animal_character') {
      t.push('no realistic human face', 'no human protagonist');
    }
    if (visualWorldType === 'real_korea') {
      t.push('no Western-looking interior', 'no obviously Japanese signage');
    }
    if (visualWorldType === 'real_japan') {
      t.push('no obviously Korean signage', 'no hanbok wardrobe');
    }
    if (genre === 'comic') {
      t.push('no overly serious dramatic lighting');
    }
    if (genre === 'wisdom') {
      t.push('no busy crowded composition');
    }
    if (genre === 'info') {
      t.push('no abstract emotional metaphor without props');
    }
    return t;
  }
  function _buildMustNotGenericize(){
    return [
      'do not produce a generic portrait without script-grounded action',
      'do not output a stock-photo styled group shot unless script requires it',
      'every scene must show its specific must-show evidence (object, action, environment) from the script',
    ];
  }

  /* ════════════════════════════════════════════════
     스크립트 다이제스트 — 다른 모듈에서 reuse
     ════════════════════════════════════════════════ */
  function _scriptDigest(scriptText){
    var s = scriptText || '';
    return {
      length:    s.length,
      hasKorean: /[가-힣]/.test(s),
      hasJapanese: /[぀-ゟ゠-ヿ]/.test(s),
      hasNumbers: /\d/.test(s),
      hasDialogMarkers: /(^|\n)\s*[AB][:：]/.test(s),
      lineCount: (s.match(/\n/g) || []).length + (s ? 1 : 0),
    };
  }

  /* ════════════════════════════════════════════════
     main
     ════════════════════════════════════════════════ */
  function analyzeProjectProfileV4(project){
    var p = project || _proj();
    var s1 = p.s1 || {};
    var s3 = p.s3 || {};
    var scriptText = _scriptText(p);

    var genre = _detectGenre(p, scriptText);
    var visualWorldType = _detectVisualWorldType(scriptText, p, genre);
    var audience = _detectAudience(scriptText, genre, p);
    var tone = _detectTone(scriptText, genre);
    var narratorMode = _detectNarratorMode(scriptText);

    var continuityCharacters = _detectCharacters(scriptText);
    var continuityWardrobe   = _detectWardrobe(scriptText);
    var continuitySetting    = _detectSetting(scriptText);

    /* characterBible — animal_character 장르에서 s1-script-step 가 저장.
       continuityCharacters 의 1순위로 사용해 모든 씬에서 동일 캐릭터 유지. */
    var characterBible = s3.characterBible || s1.characterBible || null;
    if (characterBible && characterBible.visualSubject) {
      continuityCharacters = [characterBible.visualSubject].concat(continuityCharacters);
    }

    var topic = (s1.topic || p.topic || '').toString().trim();
    var subTopic = (s1.subTopic || s1.angle || s1.target || '').toString().trim();

    var aspectMode = (typeof window.s3DetectAspectMode === 'function')
      ? window.s3DetectAspectMode(p) : 'shorts';
    var aspectRatio = (aspectMode === 'longform' || aspectMode === 'thumbnail') ? '16:9'
                    : (aspectMode === 'cardnews') ? '1:1'
                    : (aspectMode === 'cardnews45') ? '4:5' : '9:16';
    var subtitleSafeTopPct = (aspectMode === 'shorts' || aspectMode === 'cardnews45') ? 15 : 8;
    var subtitleSafeBottomPct = (aspectMode === 'shorts' || aspectMode === 'cardnews45') ? 25 : 12;

    var lang = (p.channel || p.lang || '').toString().toLowerCase();
    if (!lang) lang = /[가-힣]/.test(scriptText) ? 'ko' : (/[぀-ゟ゠-ヿ]/.test(scriptText) ? 'ja' : 'ko');

    return {
      topic:                   topic,
      subTopic:                subTopic,
      genre:                   genre,
      audience:                audience,
      tone:                    tone,
      visualWorldType:         visualWorldType,
      narratorMode:            narratorMode,
      continuityCharacters:    continuityCharacters,
      continuityWardrobe:      continuityWardrobe,
      continuitySetting:       continuitySetting,
      tabooElements:           (characterBible && characterBible.taboos)
                               ? _buildTaboos(genre, visualWorldType).concat(characterBible.taboos)
                               : _buildTaboos(genre, visualWorldType),
      mustNotGenericize:       _buildMustNotGenericize(),
      characterBible:          characterBible,
      platform:                'shorts',
      aspectMode:              aspectMode,
      aspectRatio:             aspectRatio,
      subtitleSafeTopPct:      subtitleSafeTopPct,
      subtitleSafeBottomPct:   subtitleSafeBottomPct,
      language:                lang,
      scriptDigest:            _scriptDigest(scriptText),
      artStyle:                s3.artStyle || '',
      lighting:                s3.lighting || '',
      version:                 'v4'
    };
  }
  window.analyzeProjectProfileV4 = analyzeProjectProfileV4;
})();
