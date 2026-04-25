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
  return {};
}

/* ── 현재 settings 가져오기 ── */
function _spGet(genre) {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  if (!proj.s1) proj.s1 = {};
  const key = genre + 'Settings';
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
