/* ================================================
   modules/studio/s1-animal-character.js
   STEP 1 — 동물 의인화 / 캐릭터 쇼츠 전용 모듈

   * 별도 파일로 분리 — s1-script-step.js (1000줄 한계) 압박 회피.
   * 노출 함수:
     - window._acDefault()                     기본 settings
     - window._acRender(wid)                   전용 설정 패널 HTML
     - window._acBuildSystemPromptExtra()      대본 system prompt 추가 라인
     - window._acBuildCharacterBible(settings) characterBible 객체 빌드
     - window._acQualityHints(prompt, kind)    품질 점수 힌트
   * 저장 위치: STUDIO.project.s1.animalCharacterSettings
   * v4 visual mapping: genre 'animal_character' → 'animal_anime' (project-profile)
   ================================================ */
(function(){
  'use strict';

  /* ── 옵션 데이터 ── */
  var AC_TYPES = ['햄스터','강아지','고양이','토끼','곰','펭귄','병아리','여우','직접입력'];
  var AC_TYPE_EN = {
    '햄스터':'cute golden hamster',
    '강아지':'cute corgi puppy',
    '고양이':'cute round-faced cat',
    '토끼':'cute white bunny',
    '곰':'cute soft brown bear cub',
    '펭귄':'cute small penguin',
    '병아리':'cute fluffy chick',
    '여우':'cute small fox',
  };
  var AC_PERSONALITIES = ['소심함','허세','게으름','예민함','순둥함','먹보','똑똑한 척','현실 직장인','까칠함'];
  var AC_PERSONALITY_EN = {
    '소심함':'timid and easily startled',
    '허세':'overconfident bragging vibe',
    '게으름':'lazy slouchy posture',
    '예민함':'anxious twitchy reactions',
    '순둥함':'gentle naive expressions',
    '먹보':'always thinking about food',
    '똑똑한 척':'pretending to be smart',
    '현실 직장인':'tired office-worker vibe',
    '까칠함':'grumpy unimpressed look',
  };
  var AC_WORLDS = ['회사','자취방','주방','학교','카페','편의점','헬스장','지하철','마트'];
  var AC_WORLD_EN = {
    '회사':'tiny cozy office desk with a small monitor',
    '자취방':'cozy tiny studio room with a small bed',
    '주방':'tiny home kitchen with miniature appliances',
    '학교':'small classroom with a tiny desk',
    '카페':'small cafe corner with a tiny table',
    '편의점':'tiny convenience store aisle',
    '헬스장':'small gym corner with miniature dumbbells',
    '지하철':'tiny subway car interior',
    '마트':'small mart aisle with shelves',
  };
  var AC_CONTENT_TYPES = ['일상 공감','직장인 공감','음식 개그','반전 개그','정보 전달','짧은 교훈','티키타카'];
  var AC_TONES = ['귀엽게','툴툴대게','현실 직장인','짧고 건조하게','과장된 리액션'];
  var AC_INTENSITIES = ['잔잔','웃김','과장','극대화'];
  var AC_CTAS = ['댓글 유도','저장 유도','공유 유도','다음 편 예고'];

  /* ── 기본값 ── */
  function _default(){
    return {
      characterType:    '햄스터',
      characterTypeCustom: '',
      personality:      '현실 직장인',
      world:            '회사',
      contentType:      '직장인 공감',
      tone:             '현실 직장인',
      intensity:        '웃김',
      cta:              '댓글 유도',
      extra:            '',
    };
  }
  window._acDefault = _default;

  /* ── settings 가져오기 ── */
  function _get(){
    var proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
    if (!proj.s1) proj.s1 = {};
    if (!proj.s1.animalCharacterSettings) proj.s1.animalCharacterSettings = _default();
    return proj.s1.animalCharacterSettings;
  }
  function _set(field, value){
    var s = _get();
    s[field] = value;
    if (typeof studioSave === 'function') studioSave();
  }
  /* _spSet 를 그대로 따라가도록 — 다른 패널과 동일한 onclick 패턴 사용 */
  window._acSet = _set;

  /* ── HTML 헬퍼 (s1-style-panels 와 동일 클래스 사용) ── */
  function _esc(s){ return String(s == null ? '' : s).replace(/"/g,'&quot;').replace(/[<>]/g, function(c){
    return {'<':'&lt;','>':'&gt;'}[c]; }); }
  function _chips(label, options, val, field){
    return '<div class="sp-row"><div class="sp-row-label">'+label+'</div>'+
      '<div class="sp-chips">' +
        options.map(function(o){
          return '<button type="button" class="sp-chip '+(val===o?'on':'')+'"' +
            ' onclick="_acSet(\''+field+'\',\''+o+'\');_studioS1Step(_s1WrapId())">'+o+'</button>';
        }).join('') +
      '</div></div>';
  }
  function _input(label, val, field, placeholder){
    return '<div class="sp-row"><div class="sp-row-label">'+label+'</div>'+
      '<input type="text" class="sp-inp" placeholder="'+_esc(placeholder||'')+'"'+
        ' value="'+_esc(val||'')+'"'+
        ' oninput="_acSet(\''+field+'\',this.value)"></div>';
  }
  function _textarea(label, val, field, placeholder){
    return '<div class="sp-row"><div class="sp-row-label">'+label+'</div>'+
      '<textarea class="sp-textarea" rows="2" placeholder="'+_esc(placeholder||'')+'"' +
        ' oninput="_acSet(\''+field+'\',this.value)">'+_esc(val||'')+'</textarea></div>';
  }

  /* ── 패널 렌더 ── */
  function _render(wid){
    var s = _get();
    var html = '<div class="sp-block">' +
      '<div class="sp-title">🐹 동물 의인화 전용 설정</div>' +
      _chips('캐릭터 종류',  AC_TYPES,         s.characterType,    'characterType') +
      (s.characterType === '직접입력'
        ? _input('직접 입력 캐릭터', s.characterTypeCustom, 'characterTypeCustom',
            '예: 오리너구리, 라쿤 등 (영어로 설명도 가능)')
        : '') +
      _chips('캐릭터 성격',  AC_PERSONALITIES, s.personality,      'personality') +
      _chips('세계관',       AC_WORLDS,        s.world,            'world') +
      _chips('콘텐츠 유형',  AC_CONTENT_TYPES, s.contentType,      'contentType') +
      _chips('말투',         AC_TONES,         s.tone,             'tone') +
      _chips('감정 강도',    AC_INTENSITIES,   s.intensity,        'intensity') +
      _chips('CTA',          AC_CTAS,          s.cta,              'cta') +
      _textarea('추가 지시', s.extra, 'extra',
        '예: 햄스터가 키보드 위에서 미끄러지는 슬랩스틱 한 컷 추가') +
      '<div class="sp-hint">⚠️ 유명 캐릭터 복제·특정 스튜디오 스타일 직접 사용 금지. ' +
        '캐릭터는 매 씬에서 동일 외형 유지가 필수입니다 (characterBible 자동 생성).</div>' +
    '</div>';
    return html;
  }
  window._acRender = _render;

  /* ── characterBible 빌드 ── */
  function _buildCharacterBible(settings){
    var s = settings || _get();
    var typeKo = (s.characterType === '직접입력' && s.characterTypeCustom)
      ? s.characterTypeCustom
      : s.characterType;
    var typeEn = AC_TYPE_EN[s.characterType] ||
                 (s.characterTypeCustom ? ('cute small ' + s.characterTypeCustom + ' character') : 'cute small animal character');
    var personalityEn = AC_PERSONALITY_EN[s.personality] || 'expressive';
    var worldEn       = AC_WORLD_EN[s.world] || 'small cozy indoor environment';

    /* masterPrompt: 모든 씬 prompt 머리에 부착되는 캐릭터 일관성 핵심 문장 */
    var masterPrompt =
      'The same anthropomorphic ' + typeEn +
      ', consistent character design across all scenes, ' +
      'standing or sitting upright like a person, soft round friendly proportions, ' +
      personalityEn + ', ' +
      'cozy ' + worldEn + ', ' +
      'friendly 2D-style animal animation with soft outlines, vertical 9:16 frame, ' +
      'subtitle-safe area kept clear, no text overlay, no logo, no celebrity likeness';

    return {
      version:        1,
      genre:          'animal_character',
      characterType:  typeKo,
      personality:    s.personality,
      world:          s.world,
      contentType:    s.contentType,
      tone:           s.tone,
      intensity:      s.intensity,
      masterPrompt:   masterPrompt,
      /* 필수 — image/video compiler 가 prefix 로 사용 */
      visualSubject:  'the same anthropomorphic ' + typeEn,
      worldSetting:   worldEn,
      personalityEn:  personalityEn,
      taboos: [
        'no famous animation studio style names (e.g., ghibli, pixar, disney)',
        'no copyrighted character likeness',
        'no scary or aggressive animal expressions',
        'no eerie human-animal hybrid',
        'no rendered text inside the image',
        'character must remain the same species and outfit across all scenes',
      ],
      buildAt: Date.now(),
    };
  }
  window._acBuildCharacterBible = _buildCharacterBible;

  /* ── 대본 system prompt 추가 라인 (s1-script-step.js 가 호출) ── */
  function _buildSystemPromptExtra(){
    var s = _get();
    var bible = _buildCharacterBible(s);
    var typeKo = bible.characterType;
    var lines = [];
    lines.push('');
    lines.push('[동물 의인화 / 캐릭터 쇼츠 전용 규칙]');
    lines.push('- 주인공: 같은 ' + typeKo + ' 캐릭터 1마리 (성격: ' + s.personality + '). 모든 씬에서 동일 외형 유지.');
    lines.push('- 세계관: ' + s.world + '. 현실 인간 사이즈가 아니라 미니어처 소품 세트로 묘사.');
    lines.push('- 콘텐츠 유형: ' + s.contentType + ' / 말투: ' + s.tone + ' / 감정 강도: ' + s.intensity + '.');
    lines.push('- 구조: 씬1 캐릭터 등장 + 강한 훅, 씬2 일상 상황, 씬3 착각/문제/반전, 씬4 리액션/해결, 씬5 댓글/공감 CTA(' + s.cta + ').');
    lines.push('- 각 씬 필수 요소 (라벨 그대로 출력):');
    lines.push('    대사: <캐릭터의 한 줄 한국어 대사>');
    lines.push('    화면: <카메라 앵글 포함 시각 묘사>');
    lines.push('    표정: <눈/입/귀 등 디테일>');
    lines.push('    행동: <짧은 동작 시퀀스>');
    lines.push('    효과음: <Boom/Pop/Sparkle 등 짧은 영문 큐>');
    lines.push('    자막: <짧은 한국어 자막 (이미지 안에는 절대 그리지 말 것)>');
    lines.push('- 금지: 유명 애니메이션 캐릭터 이름·스튜디오 스타일명 직접 사용, 무서운 동물 표현, 사람 얼굴+동물 어색 합성, 매 씬마다 캐릭터 종류 변경, 이미지 안에 자막 텍스트 생성.');
    if (s.extra) lines.push('- 추가 지시: ' + s.extra);
    return lines.join('\n');
  }
  window._acBuildSystemPromptExtra = _buildSystemPromptExtra;

  /* ── 품질 점수 힌트 (s3-prompt-quality-v4 가 호출) ──
     prompt 문자열을 받아 부족한 항목을 키워드 배열로 반환. */
  function _qualityHints(prompt, kind){
    var p = String(prompt || '').toLowerCase();
    var miss = [];
    /* 캐릭터 일관성 */
    if (!/same\s+(anthropomorphic|animal|character|hamster|cat|dog|bunny|bear|penguin|chick|fox)/.test(p) &&
        !/consistent character design/.test(p)) {
      miss.push('character_consistency');
    }
    /* 표정 구체성 */
    if (!/(eye|eyes|brow|mouth|smile|frown|shocked|wide-eyed|tear|blush|grin|expression)/.test(p)) {
      miss.push('expression_specificity');
    }
    /* 행동 구체성 */
    if (!/(holding|reaching|pointing|sitting|standing|walking|running|tapping|jumping|leaning|tripping|raising|lowering)/.test(p)) {
      miss.push('action_specificity');
    }
    /* 세계관 */
    if (!/(office|kitchen|cafe|studio|gym|subway|mart|classroom|store|desk|table|aisle)/.test(p)) {
      miss.push('world_setting');
    }
    /* 영상화 가능성 (video kind 만) */
    if (kind === 'video') {
      if (!/(camera|zoom|push-in|pull-out|whip|tilt|dolly|tracking|pan)/.test(p)) miss.push('camera_motion');
      if (!/(then|raises|lowers|turns|flinches|jumps|reaches|drops|leans)/.test(p)) miss.push('action_change');
      if (!/(cue|sfx|sound|boom|pop|sparkle|whoosh|click|chime)/.test(p))         miss.push('sfx_cue');
    }
    return miss;
  }
  window._acQualityHints = _qualityHints;

  /* ── characterBible 저장 — s1-script-step 가 호출 ──
       장르가 animal_character 일 때만 실행. project.s1·s3 양쪽에 캐시. */
  window._acPersistCharacterBible = function(project){
    if (!project || !project.s1 || project.s1.genre !== 'animal_character') return false;
    try {
      var bible = _buildCharacterBible(project.s1.animalCharacterSettings || null);
      project.s1.characterBible = bible;
      project.s3 = project.s3 || {};
      project.s3.characterBible = bible;
      return true;
    } catch (_) { return false; }
  };

  /* ── friendly 메시지 매핑 — quality v4 에서 쓰임 ── */
  var QUALITY_MESSAGES = {
    character_consistency: '캐릭터 일관성이 부족합니다 (같은 동물·동일 외형 명시 필요)',
    expression_specificity:'표정 변화가 없습니다 (눈/입/표정 디테일 추가 필요)',
    action_specificity:    '동작이 부족합니다 (구체적인 행동 동사 추가 필요)',
    world_setting:         '세계관 적합성이 부족합니다 (회사·주방·카페 등 환경 요소 추가)',
    camera_motion:         '영상 프롬프트가 정지 이미지 설명에 가깝습니다 (카메라 움직임 추가)',
    action_change:         '동작 변화가 없습니다 (시작 자세 → 변화 → 끝 자세 시퀀스 필요)',
    sfx_cue:               '효과음 큐가 없습니다 (Boom/Pop 등 영문 SFX 큐 명시)',
  };
  window._acQualityMessage = function(code){ return QUALITY_MESSAGES[code] || code; };
})();
