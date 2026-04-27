/* ================================================
   modules/studio/s3-visual-action-translator.js
   ⭐ 한국어 visual action → 영어 prompt action 변환 (rule-based)
   * AI 호출 없음 — deterministic, 빠름
   * window.s3TranslateVisualActionToEnglish(rawVisual, intent, project)
   * 한국어 rawVisual 이 영어 prompt 에 그대로 섞이지 않게,
     매칭이 안되면 intent.subject + mustShow 기반 fallback 영문장 생성
   ================================================ */
(function(){
  'use strict';

  /* 패턴 → 영어 액션 문장. 우선순위는 위에서부터. */
  var ACTION_RULES = [
    { re:/무릎.*잡고.*계단.*내려|계단.*내려가/i,
      en:'holding one knee with the hand while carefully stepping down indoor stairs near a handrail' },
    { re:/무릎.*잡|knee.*hold/i,
      en:'gently holding one knee with both hands, expressing mild discomfort' },
    { re:/계단.*올라|계단.*오르/i,
      en:'carefully stepping up indoor stairs while holding the handrail' },
    { re:/난간.*잡/i,
      en:'firmly grasping a wooden handrail for support' },

    { re:/의자.*앉.*다리.*펴|다리.*천천히.*펴|leg.*extension/i,
      en:'sitting on a sturdy chair and slowly extending one leg forward to strengthen the thigh' },
    { re:/의자.*앉.*스트레칭|chair.*stretch/i,
      en:'doing a gentle seated stretch on a sturdy chair in a sunlit living room' },
    { re:/스트레칭|stretch/i,
      en:'performing a gentle full-body stretch in a calm home setting' },

    { re:/체중계.*확인|체중.*재|scale.*check/i,
      en:'standing on a digital body weight scale and looking down at the readout' },
    { re:/체중.*증가|weight.*gain/i,
      en:'looking at the scale display with a slightly worried expression' },

    { re:/신발.*밑창|신발.*닳|sole.*worn/i,
      en:'tilting an old shoe to reveal its worn-out rubber sole' },
    { re:/신발.*신|shoe.*put on/i,
      en:'sitting on a chair and slowly putting on supportive shoes' },

    { re:/온찜질|찜질팩|핫팩|heat pack/i,
      en:'placing a warm heat pack around one knee while sitting on a sofa' },
    { re:/얼음찜질|cold pack|아이스팩/i,
      en:'pressing a cold pack on one knee with one hand' },

    { re:/경사로|램프|ramp/i,
      en:'choosing a gentle accessibility ramp instead of stairs at a building entrance' },
    { re:/엘리베이터|elevator/i,
      en:'pressing the elevator button instead of taking stairs in a clean lobby' },

    { re:/부모.*전화|어머니.*전화|아버지.*전화|電話.*親/i,
      en:'making a heartfelt phone call to elderly parents while sitting at the dining table' },
    { re:/전화.*받|받는.*전화/i,
      en:'holding the phone close to the ear and listening attentively' },
    { re:/스마트폰|핸드폰|smartphone/i,
      en:'looking at a smartphone screen with focused attention' },

    { re:/사진.*보|앨범.*보|family photo/i,
      en:'looking at an old framed family photograph held in both hands' },
    { re:/편지.*쓰|편지.*읽|letter/i,
      en:'reading a handwritten letter on a wooden desk' },

    { re:/손가락.*가리|point/i,
      en:'pointing at a key object with one hand to explain' },
    { re:/끄덕|nod/i,
      en:'nodding gently with an understanding expression' },
    { re:/고개.*저|head.*shake/i,
      en:'shaking the head slowly with a regretful look' },

    { re:/놀란.*표정|surprised/i,
      en:'reacting with a clearly surprised facial expression' },
    { re:/눈물|울|tear|cry/i,
      en:'showing quiet emotion with subtle teary eyes, restrained' },
    { re:/웃음|smile|笑/i,
      en:'smiling gently with relief in a warm setting' },
    { re:/안도|relief/i,
      en:'taking a deep breath of relief, shoulders relaxing' },
    { re:/결심|determined/i,
      en:'showing quiet determination with a focused gaze' },

    /* 소상공인/매장 */
    { re:/매장.*정리|상품.*진열/i,
      en:'arranging products neatly on a small shop display shelf' },
    { re:/손님.*응대|customer.*serve/i,
      en:'greeting a customer warmly across the shop counter' },

    /* 정보/공공 */
    { re:/서류.*작성|신청서.*작성|application form/i,
      en:'filling out an application form on a public service desk' },
    { re:/안내.*받|consultation/i,
      en:'receiving careful consultation from a staff at a public office desk' },

    /* 일반 */
    { re:/기다리|wait/i,
      en:'sitting quietly and waiting in a calm setting' },
    { re:/생각|돌아보|reflect/i,
      en:'pausing in thought, looking softly into the distance' },
  ];

  /* mustShow → 행동 fallback */
  var MUSTSHOW_TO_ACTION = {
    'knee':                            'holding one knee carefully',
    'lower back':                      'placing one hand on the lower back',
    'shoulder':                        'rolling one shoulder gently',
    'ankle':                           'rotating an ankle slowly',
    'wrist':                           'rotating a wrist gently',
    'leg':                             'extending one leg forward slowly',
    'foot':                            'pressing the foot firmly on the floor',
    'stairs':                          'navigating indoor stairs carefully',
    'handrail':                        'using a handrail for support',
    'sturdy chair':                    'sitting on a sturdy chair with proper posture',
    'digital body weight scale':       'standing on a digital body weight scale',
    'shoe with worn sole':             'inspecting the worn-out sole of a shoe',
    'warm heat pack':                  'applying a warm heat pack to a sore area',
    'walking cane':                    'walking with a supportive cane',
    'stretching motion':               'performing a gentle stretching motion',
    'yoga mat':                        'sitting on a yoga mat in a sunny room',
    'water bottle':                    'drinking from a water bottle after exercise',
    'towel':                           'wiping the brow with a soft towel',
    'old framed family photograph':    'holding an old framed family photograph',
    'phone in hand':                   'holding a phone close to the ear',
    'handwritten letter':              'reading a handwritten letter at a desk',
    'medication packet':               'organizing a medication packet on a tray',
    'empty chair':                     'looking at an empty chair across the table',
    'dining table':                    'sitting alone at a warm dining table',
    'accessibility ramp':              'choosing an accessibility ramp over stairs',
    'elevator':                        'pressing the elevator button',
    'small neighborhood shop interior':'standing inside a small neighborhood shop',
    'the featured product':            'demonstrating the featured product clearly',
    'application form':                'filling out an application form'
  };

  function _topicHint(project){
    var topic = String(((project && (project.topic || (project.s1 && project.s1.topic))) || '')).toLowerCase();
    if (/무릎|knee/.test(topic))     return 'knee health and safe everyday movement';
    if (/허리|back/.test(topic))     return 'lower back care during daily activity';
    if (/혈압|blood pressure/.test(topic)) return 'simple blood pressure self-check at home';
    if (/체중|당뇨|diabetes/.test(topic))   return 'careful daily self-care for body weight management';
    return '';
  }

  function translate(rawVisualKo, intent, project){
    intent = intent || {};
    project = project || (window.s3GetProjectSafe ? window.s3GetProjectSafe() : {});
    var raw = String(rawVisualKo || '');

    /* 1) 직접 한국어 → 영어 매칭 (raw + narration 합쳐 검색) */
    var search = raw + ' ' + (intent.narration || '');
    for (var i = 0; i < ACTION_RULES.length; i++) {
      var rule = ACTION_RULES[i];
      if (rule.re.test(search)) return rule.en;
    }
    /* 2) mustShow 기반 fallback */
    if (intent.mustShow && intent.mustShow.length) {
      var actionParts = [];
      intent.mustShow.slice(0, 2).forEach(function(ms){
        if (MUSTSHOW_TO_ACTION[ms]) actionParts.push(MUSTSHOW_TO_ACTION[ms]);
      });
      if (actionParts.length) {
        var loc = intent.location ? (' in ' + intent.location) : '';
        return actionParts.join(' and ') + loc;
      }
    }
    /* 3) role 기반 fallback */
    var role = intent.role || '';
    var topicHint = _topicHint(project);
    var locStr = intent.location ? (' at ' + intent.location) : '';
    if (role === 'hook')   return 'a moment that immediately raises a clear question about ' + (topicHint || 'the topic') + locStr;
    if (role === 'cta')    return 'reaching for a phone or saving a checklist about ' + (topicHint || 'the topic') + locStr;
    if (role === 'core' || role === 'core_cause') return 'demonstrating the core practical action for ' + (topicHint || 'the topic') + locStr;
    if (role === 'reveal_or_solution') return 'showing a small but clear improvement or solution' + locStr;
    if (role === 'reversal') return 'a contrasting before-and-after moment' + locStr;
    if (role === 'situation') return 'an everyday situation that introduces the topic' + locStr;
    if (role === 'setup')    return 'an introductory everyday situation' + locStr;
    if (role === 'conclusion') return 'a calm summary moment with the key object visible' + locStr;
    /* 4) 최후 fallback — 한국어 raw 를 영어 prompt 에 절대 그대로 넣지 않음 */
    if (topicHint) return 'a clear practical scene related to ' + topicHint + locStr;
    return 'a clear practical everyday scene relevant to the topic' + locStr;
  }
  window.s3TranslateVisualActionToEnglish = translate;
})();
