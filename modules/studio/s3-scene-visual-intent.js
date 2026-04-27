/* ================================================
   modules/studio/s3-scene-visual-intent.js
   ⭐ 안전 프로젝트 접근 helper + visual intent parser v3.1
   * window.s3GetProjectSafe() / s3GetS3Safe() — STUDIO 미선언 환경 대응
   * window.s3GetResolvedScenesSafe() — resolveStudioScenes() 우선,
       실패 시 cascade fallback 으로 빈 배열 대신 가능한 한 복원
   * window.s3ParseSceneVisualIntentV31(scene, idx, project)
       narration / visualDescription / 화면: 라벨 / caption 등을 분석해
       { visualActionKo, visualActionEn, subject, mustShow, emotion,
         camera, location, role, confidence, source } 반환
   * 한국어 rawVisual 을 visualActionKo 에 보존하되 prompt 본문에는
       visualActionEn 만 사용하도록 분리
   ================================================ */
(function(){
  'use strict';

  /* ════════════════════════════════════════════════
     1) 안전 접근 helper
     ════════════════════════════════════════════════ */
  function getProjectSafe(){
    return (typeof window !== 'undefined' && window.STUDIO && window.STUDIO.project)
      ? window.STUDIO.project : {};
  }
  function getS3Safe(){
    var p = getProjectSafe();
    p.s3 = p.s3 || {};
    return p.s3;
  }
  window.s3GetProjectSafe = getProjectSafe;
  window.s3GetS3Safe       = getS3Safe;

  function getResolvedScenesSafe(){
    /* 1) 정상 path */
    if (typeof window.resolveStudioScenes === 'function') {
      try {
        var r = window.resolveStudioScenes();
        if (Array.isArray(r) && r.length) return r;
      } catch(_) {}
    }
    /* 2) 직접 cascade fallback */
    var p = getProjectSafe();
    var s1 = p.s1 || {};
    var s3 = p.s3 || {};
    var lst = s3.scenes || s1.scenes || s1.sceneList || p.scenes || s3.scenePrompts ||
              s3.imagePrompts || s3.prompts || s3.imagesV3 || [];
    if (typeof window.normalizeSceneArray === 'function' && lst) {
      try {
        var normalized = window.normalizeSceneArray(lst, 'fallback');
        if (Array.isArray(normalized) && normalized.length) {
          return normalized.map(function(n, i){
            return {
              sceneIndex: i, sceneNumber: n.sceneNumber || (i+1),
              role: n.role || '', label: n.title || ('씬 '+(i+1)),
              narration: n.narration || '',
              visualDescription: n.visualDescription || '',
              imagePrompt: n.imagePrompt || '', videoPrompt: n.videoPrompt || '',
              raw: n.raw || n
            };
          });
        }
      } catch(_) {}
    }
    return [];
  }
  window.s3GetResolvedScenesSafe = getResolvedScenesSafe;

  /* ════════════════════════════════════════════════
     2) "화면:" / "Scene:" / "Visual:" 라벨 추출
     ════════════════════════════════════════════════ */
  var DIRECTIVE_LABELS = [
    /(?:^|\n)\s*(?:화면|장면|컷|영상|영상지시|연출|화면지시|화면연출)\s*[:：]\s*([^\n]{2,200})/i,
    /(?:^|\n)\s*(?:visual|scene|shot|camera)\s*[:：]\s*([^\n]{2,200})/i,
    /(?:^|\n)\s*(?:画面|シーン|映像)\s*[:：]\s*([^\n]{2,200})/i,
  ];
  function extractDirective(text){
    var s = String(text || '');
    for (var i = 0; i < DIRECTIVE_LABELS.length; i++) {
      var m = s.match(DIRECTIVE_LABELS[i]);
      if (m && m[1]) return m[1].trim();
    }
    return '';
  }

  /* ════════════════════════════════════════════════
     3) mustShow 추출 — 신체부위/소품/장소 키워드
     ════════════════════════════════════════════════ */
  var MUSTSHOW_RULES = [
    /* 신체 부위 */
    { re:/무릎|knee|膝/i,                              show:'knee', body:true },
    { re:/허리|등|back\b|腰/i,                         show:'lower back' },
    { re:/어깨|shoulder|肩/i,                           show:'shoulder' },
    { re:/발목|ankle|足首/i,                            show:'ankle' },
    { re:/손목|wrist|手首/i,                            show:'wrist' },
    { re:/다리|leg|脚/i,                                show:'leg' },
    { re:/발(?!목)|foot/i,                              show:'foot' },
    /* 운동/재활 소품 */
    { re:/계단|stairs|階段/i,                           show:'stairs' },
    { re:/난간|handrail|手すり/i,                       show:'handrail' },
    { re:/의자|chair|椅子/i,                            show:'sturdy chair' },
    { re:/체중계|scale|체중|体重計/i,                   show:'digital body weight scale' },
    { re:/신발|shoe|靴/i,                               show:'shoe with worn sole' },
    { re:/온찜질|찜질팩|핫팩|heat pack|온열/i,           show:'warm heat pack' },
    { re:/지팡이|cane|杖/i,                             show:'walking cane' },
    { re:/스트레칭|stretch/i,                           show:'stretching motion' },
    { re:/요가매트|매트|yoga mat/i,                     show:'yoga mat' },
    { re:/물병|water bottle/i,                          show:'water bottle' },
    { re:/타월|수건|towel/i,                            show:'towel' },
    /* 일상/감성 */
    { re:/사진|photo|アルバム|写真/i,                    show:'old framed family photograph' },
    { re:/전화|phone|電話|スマホ/i,                      show:'phone in hand' },
    { re:/편지|letter|手紙/i,                           show:'handwritten letter' },
    { re:/약|medication|薬/i,                           show:'medication packet' },
    { re:/빈\s*의자|empty chair|空席/i,                  show:'empty chair' },
    { re:/식탁|dining|食卓/i,                           show:'dining table' },
    /* 접근성/이동 */
    { re:/경사로|램프|ramp/i,                           show:'accessibility ramp' },
    { re:/엘리베이터|elevator|エレベーター/i,           show:'elevator' },
    /* 정보/소상공인 */
    { re:/매장|가게|상점|お店/i,                         show:'small neighborhood shop interior' },
    { re:/제품|상품|商品/i,                             show:'the featured product' },
    { re:/서류|신청서|application/i,                    show:'application form' },
  ];

  function extractMustShow(text, accumulator){
    var s = String(text || '').toLowerCase();
    var seen = {};
    (accumulator || []).forEach(function(x){ seen[x] = true; });
    var out = (accumulator || []).slice();
    MUSTSHOW_RULES.forEach(function(r){
      if (r.re.test(s) && !seen[r.show]) {
        out.push(r.show);
        seen[r.show] = true;
      }
    });
    return out;
  }

  /* ════════════════════════════════════════════════
     4) emotion / camera / location 추출
     ════════════════════════════════════════════════ */
  function extractEmotion(text){
    var s = String(text || '');
    if (/후회|미안|残念|悔/.test(s))            return 'restrained regret';
    if (/감사|고마|感謝|ありがと/.test(s))       return 'quiet gratitude';
    if (/외로|寂し|ひとり/.test(s))              return 'gentle loneliness';
    if (/기쁨|행복|嬉|幸せ/.test(s))             return 'soft contentment';
    if (/걱정|불안|心配|不安|두려/.test(s))      return 'concerned but composed';
    if (/놀란|surprised|びっくり/.test(s))       return 'surprised expression';
    if (/안도|relief|ほっと/.test(s))            return 'relieved calm';
    if (/단호|결심|determined/.test(s))          return 'quiet determination';
    if (/통증|아프|痛/.test(s))                  return 'mild discomfort, not pain horror';
    return '';
  }

  function extractCamera(text){
    var s = String(text || '');
    if (/클로즈업|close[- ]?up|アップ/i.test(s))                         return 'close-up shot';
    if (/와이드|wide shot|ワイド/i.test(s))                              return 'wide shot';
    if (/오버\s*숄더|over[- ]?the[- ]?shoulder/i.test(s))                return 'over-the-shoulder shot';
    if (/탑\s*다운|top[- ]?down|俯瞰/i.test(s))                           return 'top-down shot';
    if (/투\s*샷|two\s*shot/i.test(s))                                   return 'two-shot';
    return ''; /* 컴파일러가 role 기본값 사용 */
  }

  function extractLocation(text){
    var s = String(text || '');
    if (/집|거실|방|식탁|家|リビング/i.test(s))         return 'warm home interior';
    if (/병원|진료|병실|病院|診察/i.test(s))             return 'quiet hospital corridor';
    if (/공원|길|거리|駅|公園|路地/i.test(s))             return 'evening street or park';
    if (/사무실|회사|オフィス/i.test(s))                  return 'small office';
    if (/매장|가게|상점|お店/i.test(s))                  return 'small neighborhood shop';
    if (/카페|cafe|喫茶/i.test(s))                       return 'cozy cafe';
    if (/관공서|구청|市役所|역할/i.test(s))               return 'public service office';
    if (/계단/i.test(s))                                  return 'indoor staircase';
    return '';
  }

  /* ════════════════════════════════════════════════
     5) subject 결정
     ════════════════════════════════════════════════ */
  function decideSubject(text, project){
    var s = String(text || '').toLowerCase();
    var topic = String((project && (project.topic || (project.s1 && project.s1.topic))) || '').toLowerCase();
    var combined = s + ' ' + topic;
    /* characterProfile 우선 */
    var s1 = (project && project.s1) || {};
    if (s1.characterProfile && String(s1.characterProfile).trim()) {
      return String(s1.characterProfile).trim();
    }
    if (/할머니|할아버지|시니어|노인|어르신|シニア|高齢/.test(combined)) return 'senior person in their 60s or 70s';
    if (/부모|어머니|아버지|親|母|父/.test(combined))                      return 'middle-aged adult and elderly parent';
    if (/사장|점주|손님|매장|お店|店長/.test(combined))                   return 'small business owner and customer';
    if (/시민|민원|공무원|役所/.test(combined))                            return 'citizen at a public service desk';
    if (/아이|학생|자녀|子供|学生/.test(combined))                         return 'parent and child';
    if (/연인|커플|부부/.test(combined))                                   return 'a couple';
    /* 동물/3D 모드에서 사람 자동 삽입 방지 */
    if (/동물|animal|3d|애니메이션|anime|ghibli/i.test(combined))          return '';
    return 'an adult relevant to the topic';
  }

  /* ════════════════════════════════════════════════
     6) main: parseSceneVisualIntentV31
     ════════════════════════════════════════════════ */
  function parseSceneVisualIntent(scene, sceneIndex, project){
    project = project || getProjectSafe();
    scene   = scene   || {};
    var role = scene.role || scene.roleHint || '';
    var label = scene.label || scene.title || ('씬 ' + ((scene.sceneNumber || (sceneIndex+1))));

    var narration = scene.narration || scene.text || '';
    var visualDesc = scene.visualDescription || scene.visual_description || '';
    var caption = scene.caption || '';
    var rawCombined = [narration, visualDesc, caption].filter(Boolean).join('\n');

    /* 화면: 지시문 우선 추출 */
    var directive = extractDirective(rawCombined);
    var primary   = directive || visualDesc || narration || caption || '';

    /* mustShow: 우선순위로 누적 (directive > visualDesc > narration) */
    var mustShow = [];
    mustShow = extractMustShow(directive, mustShow);
    mustShow = extractMustShow(visualDesc, mustShow);
    mustShow = extractMustShow(narration,  mustShow);

    var emotion  = extractEmotion(primary)    || extractEmotion(narration);
    var camera   = extractCamera(primary)     || extractCamera(narration);
    var location = extractLocation(primary)   || extractLocation(narration);
    var subject  = decideSubject(primary + ' ' + narration, project);

    /* visualActionKo: 한국어 raw 그대로 — prompt 본문에 직접 넣지 않음 */
    var visualActionKo = directive || visualDesc || '';
    /* 너무 길면 한 줄로 trim */
    if (visualActionKo) visualActionKo = visualActionKo.replace(/\s+/g,' ').trim().slice(0, 300);

    /* 영어 변환은 translator (다음 모듈) 가 담당하지만,
       null safe 차원에서 placeholder 생성 */
    var visualActionEn = '';
    if (typeof window.s3TranslateVisualActionToEnglish === 'function') {
      try {
        visualActionEn = window.s3TranslateVisualActionToEnglish(visualActionKo, {
          role: role, mustShow: mustShow, subject: subject, location: location,
          emotion: emotion, camera: camera, narration: narration
        }, project) || '';
      } catch(_) { visualActionEn = ''; }
    }

    /* confidence 추정 */
    var confidence = 30;
    if (visualDesc && visualDesc.length > 4) confidence = Math.max(confidence, 80);
    if (directive)                            confidence = Math.max(confidence, 90);
    if (caption && caption.length > 4)        confidence = Math.max(confidence, 60);
    if (narration && narration.length > 8)    confidence = Math.max(confidence, 50);

    return {
      sceneIndex:      sceneIndex,
      role:            role,
      label:           label,
      subject:         subject,
      visualActionKo:  visualActionKo,
      visualActionEn:  visualActionEn,
      mustShow:        mustShow,
      emotion:         emotion,
      camera:          camera,
      location:        location,
      narration:       narration,
      confidence:      confidence,
      source:          directive ? 'directive' : visualDesc ? 'visualDescription' :
                       caption ? 'caption' : narration ? 'narration' : 'topic-fallback',
      version:         'v3.1'
    };
  }
  window.s3ParseSceneVisualIntentV31 = parseSceneVisualIntent;
})();
