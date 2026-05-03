/* ================================================
   modules/studio/s1-style-panels.js
   STEP 1 — 장르별 세부 패널 (티키타카·유머·드라마 풀필드,
                                 나머지는 핵심필드만)
   호출자: s1-script-step.js 의 _studioS1Step
   저장: STUDIO.project.s1.<genre>Settings = {...}
   ================================================ */

/* ── 옵션 데이터 ── */
const SP_TIKI_SUBGENRES = [
  '일본 자부심', '인물 대결', '동물 대결', '기업 대결',
  '음식', '국가', '스포츠', '자유',
];
const SP_TIKI_ANGLES = [
  '역전 충격형', '데이터 압도형', '스토리 감동형',
  '코미디 극대화형', '자부심 폭발형',
];
const SP_HUMOR_TYPES = [
  '일상 공감 개그', '세대 차이 유머', '말장난·언어유희', '반전 개그',
  '블랙 코미디', '한일 문화 유머', '레트로 감성', '자학 개그',
];
const SP_HUMOR_RATINGS = ['전체관람가', '19금'];
const SP_HUMOR_STRUCTS = ['플랫폼-펀치라인', '셋업-반전', '리스트형', '스토리형'];
const SP_DRAMA_GENRES = [
  '가족·감동', '향수·추억', '반전·충격', '코미디·공감',
  '인생·지혜', '황혼·로맨스', '건강·도전', '이웃·공동체',
];
const SP_DRAMA_STRUCTS = ['3막 구조', '반전 구조', '회상 구조', '독백 구조'];
const SP_KNOW_FORMATS = ['지식 숏츠', '미니 다큐', '롱폼 다큐'];
const SP_KNOW_DIFFS   = ['초급', '중급', '고급'];
const SP_TRIVIA_TONES = ['진지', '유머', '미스터리', '경탄'];
const SP_SAYING_TYPES = [
  '사자성어', '속담·격언', '세계 명언', '일본 사자숙어',
  '혼합형', '고사형', '인생·노년형', '건강·마음형',
];

/* ── 키 매핑 (사용자 지정 키명 우선) ── */
const SP_KEY_MAP = {
  'emotional': 'emotionSettings',
  'info':      'infoSettings',
  'senior':    'seniorSettings',
};
function _spKey(genre) { return SP_KEY_MAP[genre] || (genre + 'Settings'); }

/* ── 기본값 ── */
function _spDefault(genre) {
  if (genre === 'tikitaka') {
    return { subGenre:'일본 자부심', a:'', b:'', angle:'역전 충격형',
             pride:3, comedy:3, extra:'' };
  }
  if (genre === 'humor') {
    return { humorType:'일상 공감 개그', rating:'전체관람가',
             structure:'셋업-반전', extra:'' };
  }
  if (genre === 'drama') {
    return { dramaGenre:'가족·감동', structure:'3막 구조',
             scenarioHint:'', emotionStrength:3,
             characters:'', setting:'', extra:'' };
  }
  if (genre === 'knowledge') {
    return { format:'지식 숏츠', field:'', difficulty:'중급',
             references:'', extra:'' };
  }
  if (genre === 'trivia') {
    return { field:'', tone:'유머', target:'', extra:'' };
  }
  if (genre === 'saying') {
    return { type:'사자성어', theme:'', format:'원문→뜻→적용', extra:'' };
  }
  if (genre === 'emotional') {
    return { emotionType:'가족 감동', emotionFlow:'잔잔하게 시작 → 따뜻한 결말',
             emotionLevel:'감동', endingTone:'따뜻한 마무리',
             emotionDevice:'마지막 한마디', extraInstruction:'' };
  }
  if (genre === 'info') {
    return { infoType:'꿀팁', structure:'3가지 핵심 정리', difficulty:'일반인 수준',
             trustStyle:'일반 상식 기반', viewerBenefit:'시간 절약',
             ctaType:'저장 유도', extraInstruction:'' };
  }
  if (genre === 'senior') {
    return { interest:'건강 관리', ageTarget:'60대',
             speechTone:'따뜻한 존댓말', mood:'따뜻함',
             structure:'공감 → 정보 → 위로', captionBreath:'짧은 문장',
             cautionRules:'나이 비하 표현 금지', extraInstruction:'' };
  }
  return {};
}

/* ── 현재 settings 가져오기 ── */
function _spGet(genre) {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  if (!proj.s1) proj.s1 = {};
  const key = _spKey(genre);
  if (!proj.s1[key]) proj.s1[key] = _spDefault(genre);
  return proj.s1[key];
}

function _spSet(genre, field, value) {
  const s = _spGet(genre);
  s[field] = value;
  if (typeof studioSave === 'function') studioSave();
}
window._spSet = _spSet;

/* ════════════════════════════════════════════════
   디스패처 (s1-script-step.js 가 호출)
   ════════════════════════════════════════════════ */
function _s1RenderStylePanel(genre, wid) {
  if (genre === 'emotional')  return _spRenderEmotion(wid);
  if (genre === 'info')       return _spRenderInfo(wid);
  if (genre === 'senior')     return _spRenderSenior(wid);
  if (genre === 'tikitaka')   return _spRenderTikitaka(wid);
  if (genre === 'humor')      return _spRenderHumor(wid);
  if (genre === 'drama')      return _spRenderDrama(wid);
  if (genre === 'knowledge')  return _spRenderKnowledge(wid);
  if (genre === 'trivia')     return _spRenderTrivia(wid);
  if (genre === 'saying')     return _spRenderSaying(wid);
  if (genre === 'lyric')      {
    /* lyric은 별도 모듈(s1-lyric-panel.js) */
    return (typeof _s1RenderLyricPanel === 'function')
      ? _s1RenderLyricPanel(wid)
      : '<div class="sp-block">⚠️ s1-lyric-panel.js 가 로드되지 않았습니다.</div>';
  }
  if (genre === 'animal_character') {
    /* 동물 의인화는 별도 모듈(s1-animal-character.js) */
    return (typeof window._acRender === 'function')
      ? window._acRender(wid)
      : '<div class="sp-block">⚠️ s1-animal-character.js 가 로드되지 않았습니다.</div>';
  }
  return ''; /* emotional, info, senior, longform, custom 등은 패널 없음 */
}

/* ── 공통 헬퍼 (HTML 빌더) ── */
function _spChips(label, options, val, genre, field) {
  const opts = Array.isArray(options[0]) ? options : options.map(o => [o, o]);
  return `
    <div class="sp-row">
      <div class="sp-row-label">${label}</div>
      <div class="sp-chips">
        ${opts.map(o=>{
          const id = Array.isArray(o) ? o[0] : o;
          const lb = Array.isArray(o) ? o[1] : o;
          return `<button type="button" class="sp-chip ${val===id?'on':''}"
            onclick="_spSet('${genre}','${field}','${id}');_studioS1Step(_s1WrapId())">${lb}</button>`;
        }).join('')}
      </div>
    </div>`;
}

function _spInput(label, val, genre, field, placeholder) {
  return `
    <div class="sp-row">
      <div class="sp-row-label">${label}</div>
      <input type="text" class="sp-inp" placeholder="${placeholder||''}"
        value="${(val||'').replace(/"/g,'&quot;')}"
        oninput="_spSet('${genre}','${field}',this.value)">
    </div>`;
}

function _spTextarea(label, val, genre, field, placeholder) {
  return `
    <div class="sp-row">
      <div class="sp-row-label">${label}</div>
      <textarea class="sp-textarea" rows="2"
        placeholder="${placeholder||''}"
        oninput="_spSet('${genre}','${field}',this.value)">${val||''}</textarea>
    </div>`;
}

function _spRange(label, val, min, max, genre, field) {
  return `
    <div class="sp-row">
      <div class="sp-row-label">${label}: <b>${val}</b> / ${max}</div>
      <input type="range" class="sp-range" min="${min}" max="${max}" step="1" value="${val}"
        oninput="_spSet('${genre}','${field}',parseInt(this.value));this.previousElementSibling.querySelector('b').textContent=this.value">
    </div>`;
}

/* ════════════════════════════════════════════════
   1) 티키타카 패널 (풀필드)
   ════════════════════════════════════════════════ */
function _spRenderTikitaka(wid) {
  const s = _spGet('tikitaka');
  return `
  <div class="sp-block">
    <div class="sp-title">💬 티키타카 전용 설정</div>
    ${_spChips('소분류', SP_TIKI_SUBGENRES, s.subGenre, 'tikitaka', 'subGenre')}
    <div class="sp-row sp-row-2">
      ${_spInput('A 측 (승자)', s.a, 'tikitaka', 'a', '예: 한국 김치')}
      ${_spInput('B 측 (도전자)', s.b, 'tikitaka', 'b', '예: 일본 단무지')}
    </div>
    ${_spChips('승부 각도', SP_TIKI_ANGLES, s.angle, 'tikitaka', 'angle')}
    ${_spRange('자부심·국뽕 강도', s.pride, 1, 5, 'tikitaka', 'pride')}
    ${_spRange('코미디 강도',     s.comedy, 1, 5, 'tikitaka', 'comedy')}
    ${_spTextarea('추가 지시', s.extra, 'tikitaka', 'extra', '특별한 요청·금지어 등')}
  </div>`;
}

/* ════════════════════════════════════════════════
   2) 코믹·유머 패널 (풀필드)
   ════════════════════════════════════════════════ */
function _spRenderHumor(wid) {
  const s = _spGet('humor');
  return `
  <div class="sp-block">
    <div class="sp-title">😄 코믹·유머 전용 설정</div>
    ${_spChips('유머 유형', SP_HUMOR_TYPES, s.humorType, 'humor', 'humorType')}
    ${_spChips('등급',     SP_HUMOR_RATINGS, s.rating, 'humor', 'rating')}
    ${_spChips('개그 구조', SP_HUMOR_STRUCTS, s.structure, 'humor', 'structure')}
    ${_spTextarea('추가 지시', s.extra, 'humor', 'extra', '예: 노년층 공감 포인트 강조')}
  </div>`;
}

/* ════════════════════════════════════════════════
   3) 숏드라마 패널 (풀필드)
   ════════════════════════════════════════════════ */
function _spRenderDrama(wid) {
  const s = _spGet('drama');
  return `
  <div class="sp-block">
    <div class="sp-title">🎭 숏드라마 전용 설정</div>
    ${_spChips('드라마 장르', SP_DRAMA_GENRES, s.dramaGenre, 'drama', 'dramaGenre')}
    ${_spChips('드라마 구조', SP_DRAMA_STRUCTS, s.structure, 'drama', 'structure')}
    ${_spTextarea('시나리오 힌트', s.scenarioHint, 'drama', 'scenarioHint',
      '예: 30년 만에 동창을 만난 시니어')}
    ${_spRange('감정 강도', s.emotionStrength, 1, 5, 'drama', 'emotionStrength')}
    <div class="sp-row sp-row-2">
      ${_spInput('등장인물', s.characters, 'drama', 'characters', '예: 60대 부부, 손주')}
      ${_spInput('배경',     s.setting,    'drama', 'setting',    '예: 시골 고향집')}
    </div>
    ${_spTextarea('추가 지시', s.extra, 'drama', 'extra', '톤·금지어 등')}
  </div>`;
}

/* ════════════════════════════════════════════════
   4) 전문지식 패널 (핵심필드만)
   ════════════════════════════════════════════════ */
function _spRenderKnowledge(wid) {
  const s = _spGet('knowledge');
  return `
  <div class="sp-block">
    <div class="sp-title">🧠 전문지식 전용 설정</div>
    ${_spChips('포맷',      SP_KNOW_FORMATS, s.format, 'knowledge', 'format')}
    ${_spInput('분야',      s.field,      'knowledge', 'field', '예: 노후 의료')}
    ${_spChips('난이도',    SP_KNOW_DIFFS, s.difficulty, 'knowledge', 'difficulty')}
    ${_spTextarea('참고 사실', s.references, 'knowledge', 'references', '신뢰할 수 있는 출처·수치')}
    <div class="sp-hint">📌 다음 PR: 시리즈 기획·공개 방식 추가 예정</div>
  </div>`;
}

/* ════════════════════════════════════════════════
   5) 잡학·트리비아 패널 (핵심필드만)
   ════════════════════════════════════════════════ */
function _spRenderTrivia(wid) {
  const s = _spGet('trivia');
  return `
  <div class="sp-block">
    <div class="sp-title">🧩 잡학·트리비아 전용 설정</div>
    ${_spInput('분야',  s.field,  'trivia', 'field',  '예: 동물·역사·과학')}
    ${_spChips('톤',   SP_TRIVIA_TONES, s.tone, 'trivia', 'tone')}
    ${_spInput('타겟', s.target, 'trivia', 'target', '예: 60대·자녀와 함께')}
    <div class="sp-hint">📌 다음 PR: 시리즈 주제 묶음 기획 추가 예정</div>
  </div>`;
}

/* ════════════════════════════════════════════════
   6) 사자성어·명언 패널 (핵심필드만)
   ════════════════════════════════════════════════ */
function _spRenderSaying(wid) {
  const s = _spGet('saying');
  return `
  <div class="sp-block">
    <div class="sp-title">📜 사자성어·명언 전용 설정</div>
    ${_spChips('유형', SP_SAYING_TYPES, s.type, 'saying', 'type')}
    ${_spInput('테마', s.theme, 'saying', 'theme', '예: 인생·건강·관계')}
    ${_spInput('포맷', s.format, 'saying', 'format', '예: 원문→뜻→현대적용')}
    <div class="sp-hint">📌 다음 PR: CTA·언어별 출력 옵션 추가 예정</div>
  </div>`;
}

/* ════════════════════════════════════════════════
   7) 💗 감동 전용 (신규)
   ════════════════════════════════════════════════ */
const SP_EMOTION_TYPES = [
  '가족 감동','부모님 이야기','부부/연인 감동','친구/이웃 감동','반려동물 감동',
  '인생 회상','후회와 화해','작은 친절','기적 같은 순간',
];
const SP_EMOTION_FLOWS = [
  '잔잔하게 시작 → 따뜻한 결말', '평범한 일상 → 마지막 반전',
  '후회 → 깨달음', '이별/그리움 → 위로', '갈등 → 화해', '외로움 → 연결',
];
const SP_EMOTION_LEVELS = ['잔잔', '감동', '눈물', '깊은 여운'];
const SP_ENDING_TONES = [
  '따뜻한 마무리', '눈물 나는 마무리', '희망적인 마무리',
  '여운 남기는 마무리', '댓글 유도형 마무리',
];
const SP_EMOTION_DEVICES = [
  '마지막 한마디', '오래된 사진/물건', '뒤늦은 고백', '예상 못 한 배려',
  '부모님의 침묵', '잊고 있던 약속', '세월의 흔적',
];

function _spRenderEmotion(wid) {
  const s = _spGet('emotional');
  return `
  <div class="sp-block">
    <div class="sp-title">💗 감동 전용 설정</div>
    ${_spChips('감동 유형', SP_EMOTION_TYPES, s.emotionType, 'emotional', 'emotionType')}
    ${_spChips('감정 흐름', SP_EMOTION_FLOWS, s.emotionFlow, 'emotional', 'emotionFlow')}
    ${_spChips('감정 강도', SP_EMOTION_LEVELS, s.emotionLevel, 'emotional', 'emotionLevel')}
    ${_spChips('결말 톤', SP_ENDING_TONES, s.endingTone, 'emotional', 'endingTone')}
    ${_spChips('감동 장치', SP_EMOTION_DEVICES, s.emotionDevice, 'emotional', 'emotionDevice')}
    ${_spTextarea('추가 지시', s.extraInstruction, 'emotional', 'extraInstruction',
      '예: 너무 신파스럽지 않게, 현실적인 가족 이야기로, 마지막에 댓글을 유도해줘')}
  </div>`;
}

/* ════════════════════════════════════════════════
   8) 📊 정보 전용 (신규)
   ════════════════════════════════════════════════ */
const SP_INFO_TYPES = [
  '꿀팁','체크리스트','비교 정리','실수 방지','단계별 방법',
  '오해 바로잡기','트렌드 요약','돈/생활 정보','건강/생활 습관','정책/지원금 안내',
];
const SP_INFO_STRUCTURES = [
  '3가지 핵심 정리', 'Before / After 비교', '문제 → 원인 → 해결',
  '체크리스트 5개', '실수 TOP3', '모르면 손해 보는 정보',
  '질문 → 답변형', '사례 → 설명 → 결론',
];
const SP_INFO_DIFFICULTY = ['아주 쉽게', '일반인 수준', '조금 전문적으로', '핵심만 짧게'];
const SP_INFO_TRUST = ['경험 기반', '일반 상식 기반', '자료 참고 느낌', '전문가 설명 느낌', '주의사항 포함'];
const SP_INFO_BENEFIT = ['시간 절약', '돈 절약', '실수 방지', '건강 관리', '선택 기준 제공', '바로 따라 하기'];
const SP_INFO_CTA = ['저장 유도', '공유 유도', '댓글 질문 유도', '다음 편 예고', '체크리스트 요청 유도'];

function _spRenderInfo(wid) {
  const s = _spGet('info');
  return `
  <div class="sp-block">
    <div class="sp-title">📊 정보 전용 설정</div>
    ${_spChips('정보 유형', SP_INFO_TYPES, s.infoType, 'info', 'infoType')}
    ${_spChips('전달 구조', SP_INFO_STRUCTURES, s.structure, 'info', 'structure')}
    ${_spChips('난이도', SP_INFO_DIFFICULTY, s.difficulty, 'info', 'difficulty')}
    ${_spChips('신뢰도 표현', SP_INFO_TRUST, s.trustStyle, 'info', 'trustStyle')}
    ${_spChips('시청자 이득', SP_INFO_BENEFIT, s.viewerBenefit, 'info', 'viewerBenefit')}
    ${_spChips('CTA 유형', SP_INFO_CTA, s.ctaType, 'info', 'ctaType')}
    ${_spTextarea('추가 지시', s.extraInstruction, 'info', 'extraInstruction',
      '예: 60대도 이해하기 쉽게, 숫자와 예시를 넣어서, 너무 어려운 용어는 피해서')}
  </div>`;
}

/* ════════════════════════════════════════════════
   9) 👵 시니어 전용 (신규)
   ════════════════════════════════════════════════ */
const SP_SENIOR_INTERESTS = [
  '건강 관리','노후 준비','가족 관계','자녀와의 관계','배우자/혼자 사는 삶',
  '연금/생활비','취미/여행','스마트폰/생활기술','추억/인생 이야기',
  '생활 안전','외로움/마음 건강',
];
const SP_SENIOR_AGES = [
  '50대','60대','70대','80대 이상','자녀 세대가 부모님께 알려주는 느낌',
];
const SP_SENIOR_TONES = [
  '따뜻한 존댓말','천천히 설명하는 말투','아들이/딸이 설명하는 느낌',
  '전문가가 쉽게 설명하는 느낌','친구처럼 다정한 말투',
];
const SP_SENIOR_MOODS = ['따뜻함','차분함','공감','실용적','희망적','경각심','추억 감성'];
const SP_SENIOR_STRUCTURES = [
  '공감 → 정보 → 위로','문제 → 쉬운 해결법','이야기 → 교훈',
  '체크리스트','가족 대화형','오늘 바로 할 일 3가지',
];
const SP_SENIOR_BREATHS = [
  '짧은 문장','쉬운 단어','천천히 읽기 좋게',
  '한 문장 20자 이하 권장','어려운 외래어 줄이기',
];
const SP_SENIOR_CAUTIONS = [
  '나이 비하 표현 금지','겁주는 표현 과도하게 사용 금지',
  '건강/돈 문제 단정 금지','자녀 비난으로 몰아가지 않기',
  '너무 어린아이 대하듯 말하지 않기',
];

function _spRenderSenior(wid) {
  const s = _spGet('senior');
  return `
  <div class="sp-block">
    <div class="sp-title">👵 시니어 전용 설정</div>
    ${_spChips('시니어 관심 분야', SP_SENIOR_INTERESTS, s.interest, 'senior', 'interest')}
    ${_spChips('대상 연령 느낌', SP_SENIOR_AGES, s.ageTarget, 'senior', 'ageTarget')}
    ${_spChips('말투', SP_SENIOR_TONES, s.speechTone, 'senior', 'speechTone')}
    ${_spChips('영상 분위기', SP_SENIOR_MOODS, s.mood, 'senior', 'mood')}
    ${_spChips('구성 방식', SP_SENIOR_STRUCTURES, s.structure, 'senior', 'structure')}
    ${_spChips('자막/호흡', SP_SENIOR_BREATHS, s.captionBreath, 'senior', 'captionBreath')}
    ${_spChips('주의할 표현', SP_SENIOR_CAUTIONS, s.cautionRules, 'senior', 'cautionRules')}
    ${_spTextarea('추가 지시', s.extraInstruction, 'senior', 'extraInstruction',
      '예: 부모님께 설명하듯 따뜻하게, 너무 겁주지 말고 현실적인 조언으로, 댓글을 남기고 싶게')}
  </div>`;
}

/* ════════════════════════════════════════════════
   CSS 주입
   ════════════════════════════════════════════════ */
(function _spInjectCSS(){
  if (document.getElementById('sp-style')) return;
  const st = document.createElement('style');
  st.id = 'sp-style';
  st.textContent = `
.sp-block{background:#fff;border:2px dashed #9181ff;border-radius:14px;
  padding:14px;margin-bottom:12px;display:flex;flex-direction:column;gap:10px}
.sp-title{font-size:13px;font-weight:800;color:#5b4ecf;margin-bottom:4px}
.sp-row{display:flex;flex-direction:column;gap:5px}
.sp-row.sp-row-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:500px){.sp-row.sp-row-2{grid-template-columns:1fr}}
.sp-row-label{font-size:11.5px;font-weight:700;color:#5a4a56}
.sp-row-label b{color:#ef6fab;font-weight:800}
.sp-chips{display:flex;gap:4px;flex-wrap:wrap}
.sp-chip{padding:4px 10px;border:1.5px solid #f1dce7;border-radius:18px;
  background:#fff;font-size:11px;font-weight:700;color:#7b7077;cursor:pointer;
  transition:.12s;font-family:inherit}
.sp-chip:hover{border-color:#9181ff;color:#9181ff}
.sp-chip.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.sp-inp,.sp-textarea{width:100%;border:1.5px solid #f1dce7;border-radius:8px;
  padding:7px 10px;font-size:12px;font-family:inherit;outline:none;box-sizing:border-box;background:#fff}
.sp-textarea{resize:vertical;line-height:1.5;min-height:48px}
.sp-inp:focus,.sp-textarea:focus{border-color:#9181ff}
.sp-range{width:100%;-webkit-appearance:none;appearance:none;height:5px;
  background:#f1dce7;border-radius:3px;outline:none;margin:6px 0}
.sp-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
  width:16px;height:16px;border-radius:50%;background:#9181ff;cursor:pointer;border:none}
.sp-range::-moz-range-thumb{width:16px;height:16px;border-radius:50%;
  background:#9181ff;cursor:pointer;border:none}
.sp-hint{margin-top:4px;padding:6px 10px;background:#fbf7f9;border-radius:8px;
  font-size:11px;color:#9b8a93}
`;
  document.head.appendChild(st);
})();

/* 외부 노출 */
window._s1RenderStylePanel = _s1RenderStylePanel;
