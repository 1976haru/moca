/* ================================================
   modules/studio/s1-modes.js
   STEP 1 보조 모듈 — 모드별 전용 블록
   - 티키타카 전용 설정 (A측/B측/승부각도/코미디강도)
   - 롱폼 전용 설정 (구성 방식)
   호출자: s1-script-step.js 의 _studioS1Step / _s1BuildSystemPrompt
   ================================================ */

/* ── 상수 ── */
const S1_TIKI_ANGLES = [
  { id:'reverse', label:'역전 충격형' },
  { id:'data',    label:'데이터 압도형' },
  { id:'story',   label:'스토리 감동형' },
  { id:'comedy',  label:'코미디 극대화형' },
  { id:'pride',   label:'자부심 폭발형' },
];
const S1_LONG_STRUCTS = [
  { id:'list',    label:'리스트형' },
  { id:'story',   label:'스토리형' },
  { id:'narrate', label:'해설형' },
];

/* ── 전역 상태 ── */
let _s1TikiA      = '';
let _s1TikiB      = '';
let _s1TikiAngle  = 'reverse';
let _s1TikiComedy = 3;
let _s1LongStruct = 'list';

/* ── 모드별 블록 디스패처 (s1-script-step.js 가 호출) ── */
function _s1RenderModeBlock(wid, mode) {
  if (mode === 'tikitaka') return _s1RenderTikitakaBlock(wid);
  if (mode === 'longform') return _s1RenderLongformBlock(wid);
  if (mode === 'youtube_reference_adapt' && typeof window._s1RenderYoutubeRefBlock === 'function') {
    return window._s1RenderYoutubeRefBlock(wid);
  }
  return '';
}

/* ── 티키타카 전용 ── */
function _s1RenderTikitakaBlock(wid) {
  return `
  <div class="s1s-block s1s-mode-block">
    <div class="s1s-label">💬 티키타카 전용 설정</div>
    <div class="s1s-mode-row">
      <div class="s1s-mode-col">
        <label class="s1s-adv-label">A 측</label>
        <input type="text" class="s1s-adv-inp"
          placeholder="예: 한국음식" value="${_s1TikiA||''}"
          oninput="_s1TikiA=this.value">
      </div>
      <div class="s1s-mode-col">
        <label class="s1s-adv-label">B 측</label>
        <input type="text" class="s1s-adv-inp"
          placeholder="예: 일본음식" value="${_s1TikiB||''}"
          oninput="_s1TikiB=this.value">
      </div>
    </div>
    <div class="s1s-mode-row">
      <div class="s1s-mode-col">
        <label class="s1s-adv-label">승부 각도</label>
        <select class="s1s-adv-sel" oninput="_s1TikiAngle=this.value">
          ${S1_TIKI_ANGLES.map(a=>`
            <option value="${a.id}" ${_s1TikiAngle===a.id?'selected':''}>${a.label}</option>
          `).join('')}
        </select>
      </div>
      <div class="s1s-mode-col">
        <label class="s1s-adv-label">코미디 강도: <b id="s1sTikiCmVal">${_s1TikiComedy}</b> / 5</label>
        <input type="range" class="s1s-len-range"
          min="1" max="5" step="1" value="${_s1TikiComedy}"
          oninput="_s1OnTikiCmInput(this.value)">
      </div>
    </div>
  </div>`;
}

/* ── 롱폼 전용 ── */
function _s1RenderLongformBlock(wid) {
  return `
  <div class="s1s-block s1s-mode-block">
    <div class="s1s-label">📺 롱폼 전용 설정</div>
    <div class="s1s-mode-row">
      <div class="s1s-mode-col">
        <label class="s1s-adv-label">구성 방식</label>
        <select class="s1s-adv-sel" oninput="_s1LongStruct=this.value">
          ${S1_LONG_STRUCTS.map(s=>`
            <option value="${s.id}" ${_s1LongStruct===s.id?'selected':''}>${s.label}</option>
          `).join('')}
        </select>
      </div>
    </div>
    <div class="s1s-mode-hint">
      💡 롱폼 영상은 <b>오프닝 → 파트 3~5개 → 마무리</b> 구조로 작성됩니다.
      영상 길이는 위 "영상 길이" 드롭다운에서 선택하세요.
    </div>
  </div>`;
}

/* ── 코미디 강도 슬라이더 즉시 표시 업데이트 ── */
window._s1OnTikiCmInput = function(v) {
  _s1TikiComedy = parseInt(v);
  const el = document.getElementById('s1sTikiCmVal');
  if (el) el.textContent = _s1TikiComedy;
};

/* ── 프롬프트 빌더 (s1-script-step.js 의 _s1BuildSystemPrompt 가 호출) ── */
function _s1BuildTikitakaPromptExtra() {
  const angleLabel = (S1_TIKI_ANGLES.find(a=>a.id===_s1TikiAngle)||{}).label || '역전 충격형';
  const lines = ['', '[티키타카 모드]'];
  if (_s1TikiA && _s1TikiB) {
    lines.push(`A 측: ${_s1TikiA}`);
    lines.push(`B 측: ${_s1TikiB}`);
    lines.push(`A vs B 배틀 형식. 화자를 명확히 구분하고 양측의 주장·반박·결말을 균형있게 배치하세요.`);
  } else {
    lines.push(`A vs B 배틀 형식. 양측을 명확히 구분하고 화자 표시.`);
  }
  lines.push(`승부 각도: ${angleLabel}.`);
  lines.push(`코미디 강도: ${_s1TikiComedy}/5 (1=거의 진지, 5=과장된 코믹).`);
  return lines.join('\n');
}

function _s1BuildLongformPromptExtra() {
  const structLabel = (S1_LONG_STRUCTS.find(s=>s.id===_s1LongStruct)||{}).label || '리스트형';
  return [
    '',
    '[롱폼 모드]',
    `오프닝(시청 유지 훅) → 파트 3~5개(각각 소제목 명시) → 마무리(요약 + CTA) 구조.`,
    `구성 방식: ${structLabel}.`,
    `각 파트 시작에 "## 파트 N — [소제목]" 형식의 챕터 마커를 넣으세요.`,
  ].join('\n');
}

/* ── CSS (s1s- prefix 유지, mode 전용 클래스만 추가) ── */
(function _s1ModesInjectCSS(){
  if (document.getElementById('s1s-modes-style')) return;
  const st = document.createElement('style');
  st.id = 's1s-modes-style';
  st.textContent = `
.s1s-mode-block{background:#fff;border:2px dashed #ef6fab;border-radius:16px}
.s1s-mode-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px}
@media(max-width:500px){.s1s-mode-row{grid-template-columns:1fr}}
.s1s-mode-col{display:flex;flex-direction:column;gap:4px}
.s1s-mode-hint{margin-top:8px;padding:8px 12px;background:#fff5f9;border-radius:10px;
  font-size:11.5px;color:#7b4060;line-height:1.5}
`;
  document.head.appendChild(st);
})();
