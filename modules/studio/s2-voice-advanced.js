/* ================================================
   modules/studio/s2-voice-advanced.js
   STEP 3 (음성·BGM) 보조 모듈 — 고급 화자 설정 (이슈 3)
   호출자: s2-voice-step.js 의 details 태그 ontoggle
   저장 위치: STUDIO.project.s2.speakerAdvanced = { speakerCount, speakers:[] }
   각 speaker: { gender, age, emotion, speed, pron, tone, sceneApply }
   ================================================ */

/* ── 옵션 상수 ── */
const VADV_GENDERS  = [
  { id:'female', label:'여성' },
  { id:'male',   label:'남성' },
  { id:'neutral',label:'중성' },
];
const VADV_AGES = [
  { id:'young',  label:'청년' },
  { id:'mid',    label:'중년' },
  { id:'senior', label:'시니어' },
];
const VADV_EMOTIONS = [
  { id:'neutral', label:'중립' },
  { id:'warm',    label:'따뜻함' },
  { id:'energetic',label:'활기' },
  { id:'sad',     label:'슬픔' },
  { id:'serious', label:'진지' },
  { id:'happy',   label:'기쁨' },
];
const VADV_TONES = [
  { id:'narration', label:'내레이션' },
  { id:'dialog',    label:'대화체' },
  { id:'reading',   label:'읽기체' },
  { id:'storytell', label:'스토리텔링' },
];
const VADV_SCENE_APPLY = [
  { id:'all',  label:'전체 씬' },
  { id:'odd',  label:'홀수 씬' },
  { id:'even', label:'짝수 씬' },
  { id:'pick', label:'특정 씬 (직접 지정)' },
];

/* ── 기본 화자 ── */
function _vAdvDefaultSpeaker(idx) {
  return {
    gender:'female', age:'mid', emotion:'neutral',
    speed:1.0, pron:'standard', tone:'narration',
    sceneApply:'all', scenePick:'',
  };
}
function _vAdvDefault() {
  return { speakerCount:1, speakers:[ _vAdvDefaultSpeaker(0) ] };
}

/* ── 현재 설정 가져오기 ── */
function _vAdvGet() {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  if (!proj.s2) proj.s2 = {};
  if (!proj.s2.speakerAdvanced) proj.s2.speakerAdvanced = _vAdvDefault();
  /* 안전: speakers 배열 부족하면 채움 */
  const adv = proj.s2.speakerAdvanced;
  if (!Array.isArray(adv.speakers)) adv.speakers = [];
  while (adv.speakers.length < adv.speakerCount) {
    adv.speakers.push(_vAdvDefaultSpeaker(adv.speakers.length));
  }
  return adv;
}

/* ════════════════════════════════════════════════
   메인 렌더 — details 가 열렸을 때 호출됨
   ════════════════════════════════════════════════ */
function _vAdvRender(wrapId) {
  const wrap = document.getElementById(wrapId || 'v2AdvancedInner');
  if (!wrap) return;
  const adv = _vAdvGet();

  wrap.innerHTML = `
  <div class="vadv-wrap">
    <!-- 화자 수 -->
    <div class="vadv-row">
      <div class="vadv-label">👥 화자 수</div>
      <div class="vadv-seg">
        ${[1,2,3].map(n=>`
          <button class="vadv-seg-btn ${adv.speakerCount===n?'on':''}"
            onclick="_vAdvSetCount(${n},'${wrapId}')">${n}인</button>
        `).join('')}
      </div>
    </div>

    <!-- 화자별 카드 -->
    <div class="vadv-speakers">
      ${adv.speakers.slice(0, adv.speakerCount).map((sp, i)=>
        _vAdvRenderSpeaker(sp, i, wrapId)
      ).join('')}
    </div>

    <button class="vadv-save-btn" onclick="_vAdvSave()">💾 고급 화자 설정 저장</button>
  </div>`;

  _vAdvInjectCSS();
}

/* ── 화자 카드 ── */
function _vAdvRenderSpeaker(sp, idx, wrapId) {
  const seg = (label, options, key) => `
    <div class="vadv-field">
      <div class="vadv-field-label">${label}</div>
      <div class="vadv-seg">
        ${options.map(o=>`
          <button class="vadv-seg-btn ${sp[key]===o.id?'on':''}"
            onclick="_vAdvSetField(${idx},'${key}','${o.id}','${wrapId}')">${o.label}</button>
        `).join('')}
      </div>
    </div>`;
  return `
  <div class="vadv-card">
    <div class="vadv-card-hd">화자 ${idx+1}</div>
    ${seg('성별', VADV_GENDERS, 'gender')}
    ${seg('연령', VADV_AGES, 'age')}
    ${seg('감정', VADV_EMOTIONS, 'emotion')}
    ${seg('톤', VADV_TONES, 'tone')}
    ${seg('씬 적용', VADV_SCENE_APPLY, 'sceneApply')}
    ${sp.sceneApply==='pick' ? `
      <div class="vadv-field">
        <div class="vadv-field-label">적용할 씬 번호 (쉼표 구분)</div>
        <input type="text" class="vadv-inp"
          placeholder="예: 1,3,5"
          value="${sp.scenePick||''}"
          oninput="_vAdvSetField(${idx},'scenePick',this.value,null)">
      </div>` : ''}
    <div class="vadv-field-row">
      <div class="vadv-field" style="flex:1">
        <div class="vadv-field-label">속도: <b>${sp.speed.toFixed(2)}×</b></div>
        <input type="range" class="vadv-range" min="0.5" max="2" step="0.05" value="${sp.speed}"
          oninput="_vAdvSetSpeed(${idx},this.value)">
      </div>
      <div class="vadv-field" style="flex:1">
        <div class="vadv-field-label">발음 보정</div>
        <select class="vadv-sel"
          onchange="_vAdvSetField(${idx},'pron',this.value,null)">
          <option value="standard"  ${sp.pron==='standard'?'selected':''}>표준</option>
          <option value="dialect"   ${sp.pron==='dialect'?'selected':''}>지역 사투리 톤</option>
          <option value="formal"    ${sp.pron==='formal'?'selected':''}>격식체</option>
          <option value="casual"    ${sp.pron==='casual'?'selected':''}>구어체</option>
        </select>
      </div>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   이벤트 핸들러
   ════════════════════════════════════════════════ */
window._vAdvSetCount = function(n, wid) {
  const adv = _vAdvGet();
  adv.speakerCount = n;
  while (adv.speakers.length < n) adv.speakers.push(_vAdvDefaultSpeaker(adv.speakers.length));
  if (typeof studioSave === 'function') studioSave();
  _vAdvRender(wid);
};

window._vAdvSetField = function(idx, key, val, wid) {
  const adv = _vAdvGet();
  if (!adv.speakers[idx]) adv.speakers[idx] = _vAdvDefaultSpeaker(idx);
  adv.speakers[idx][key] = val;
  if (typeof studioSave === 'function') studioSave();
  /* sceneApply 변경 시 picks 입력창 토글 위해 재렌더 */
  if (key === 'sceneApply' && wid) _vAdvRender(wid);
};

window._vAdvSetSpeed = function(idx, val) {
  const adv = _vAdvGet();
  if (!adv.speakers[idx]) adv.speakers[idx] = _vAdvDefaultSpeaker(idx);
  const v = parseFloat(val);
  adv.speakers[idx].speed = isNaN(v) ? 1.0 : v;
  /* 표시만 즉시 업데이트 (re-render 없이) */
  const labels = document.querySelectorAll('.vadv-card');
  if (labels[idx]) {
    const speedB = labels[idx].querySelector('.vadv-field-row .vadv-field b');
    if (speedB) speedB.textContent = adv.speakers[idx].speed.toFixed(2) + '×';
  }
  if (typeof studioSave === 'function') studioSave();
};

window._vAdvSave = function() {
  if (typeof studioSave === 'function') studioSave();
  alert('✅ 고급 화자 설정이 저장됐습니다.');
};

/* ── CSS ── */
function _vAdvInjectCSS() {
  if (document.getElementById('vadv-style')) return;
  const st = document.createElement('style');
  st.id = 'vadv-style';
  st.textContent = `
.vadv-wrap{padding:12px;display:flex;flex-direction:column;gap:14px}
.vadv-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.vadv-label{font-size:12px;font-weight:800;color:#2b2430;min-width:80px}
.vadv-seg{display:flex;gap:4px;flex-wrap:wrap}
.vadv-seg-btn{padding:5px 12px;border:1.5px solid #f1dce7;border-radius:8px;
  background:#fff;font-size:11.5px;font-weight:700;color:#7b7077;cursor:pointer;transition:.12s;font-family:inherit}
.vadv-seg-btn:hover{border-color:#9181ff;color:#9181ff}
.vadv-seg-btn.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.vadv-speakers{display:flex;flex-direction:column;gap:12px}
.vadv-card{background:#fbf7f9;border:1.5px solid #f1dce7;border-radius:14px;padding:14px}
.vadv-card-hd{font-size:13px;font-weight:800;color:#9181ff;margin-bottom:10px}
.vadv-field{display:flex;flex-direction:column;gap:4px;margin-bottom:8px}
.vadv-field-label{font-size:11px;font-weight:700;color:#5a4a56}
.vadv-field-label b{color:#ef6fab;font-weight:800}
.vadv-field-row{display:flex;gap:10px;flex-wrap:wrap}
.vadv-inp,.vadv-sel{width:100%;border:1.5px solid #f1dce7;border-radius:8px;
  padding:7px 10px;font-size:12px;font-family:inherit;background:#fff;outline:none;box-sizing:border-box}
.vadv-inp:focus,.vadv-sel:focus{border-color:#9181ff}
.vadv-range{width:100%;-webkit-appearance:none;appearance:none;height:5px;
  background:#f1dce7;border-radius:3px;outline:none;margin:6px 0}
.vadv-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
  width:16px;height:16px;border-radius:50%;background:#9181ff;cursor:pointer;border:none}
.vadv-range::-moz-range-thumb{width:16px;height:16px;border-radius:50%;
  background:#9181ff;cursor:pointer;border:none}
.vadv-save-btn{width:100%;padding:12px;border:none;border-radius:12px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-size:13px;font-weight:800;cursor:pointer;font-family:inherit}
.vadv-save-btn:hover{opacity:.9}
`;
  document.head.appendChild(st);
}
