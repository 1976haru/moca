/* ================================================
   modules/studio/s5-upload-platforms.js
   STEP 5 보조 모듈 — 플랫폼 업로드 계획 UI (이슈 8)
   호출자: s5-upload-v2.js 의 _s5vT3() 끝
   저장: STUDIO.project.uploadPlan = { platforms:{...}, status:'manual-ready' }
   주의: 실제 자동 업로드 API 연동은 하지 않음 (준비중 표시)
   ================================================ */

/* ── 플랫폼 목록 ── */
const S5UP_PLATFORMS = [
  { id:'youtube',   ico:'📺', label:'YouTube',   open:'https://studio.youtube.com',         field:'title' },
  { id:'instagram', ico:'📷', label:'Instagram', open:'https://www.instagram.com',          field:'caption' },
  { id:'tiktok',    ico:'🔴', label:'TikTok',    open:'https://www.tiktok.com/upload',      field:'caption' },
  { id:'facebook',  ico:'🔵', label:'Facebook',  open:'https://www.facebook.com',           field:'caption' },
  { id:'naver',     ico:'🟢', label:'네이버블로그', open:'https://blog.naver.com',           field:'title' },
];

const S5UP_VISIBILITY = [
  { id:'draft',     label:'초안' },
  { id:'private',   label:'비공개' },
  { id:'unlisted',  label:'일부공개' },
  { id:'scheduled', label:'예약' },
  { id:'public',    label:'공개' },
];

/* ── 기본 플랜 생성 ── */
function _s5upDefaultPlatform() {
  return {
    enabled:false, visibility:'draft',
    scheduledAt:'', scheduledTime:'18:00', timezone:'Asia/Seoul',
    title:'', body:'', caption:'', tags:[],
  };
}
function _s5upDefaultPlan() {
  const platforms = {};
  S5UP_PLATFORMS.forEach(function(p){ platforms[p.id] = _s5upDefaultPlatform(); });
  return { platforms, status:'manual-ready' };
}

function _s5upGetPlan() {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  if (!proj.uploadPlan) proj.uploadPlan = _s5upDefaultPlan();
  /* 안전: 누락 플랫폼 채움 */
  if (!proj.uploadPlan.platforms) proj.uploadPlan.platforms = {};
  S5UP_PLATFORMS.forEach(function(p){
    if (!proj.uploadPlan.platforms[p.id]) {
      proj.uploadPlan.platforms[p.id] = _s5upDefaultPlatform();
    }
  });
  return proj.uploadPlan;
}

/* ════════════════════════════════════════════════
   메인 렌더 — s5-upload-v2.js 의 _s5vT3() 가 호출
   ════════════════════════════════════════════════ */
function _s5upRender(wrapId) {
  const wrap = document.getElementById(wrapId || 's5UpPlatformsWrap');
  if (!wrap) return;
  const plan = _s5upGetPlan();

  wrap.innerHTML = `
  <div class="s5up-wrap">

    <div class="s5up-hd">
      <h3 class="s5up-title">📤 플랫폼 업로드 계획</h3>
      <p class="s5up-sub">플랫폼별 메타데이터를 정리하고 수동 업로드 가이드를 복사하세요.<br>
        실제 자동 업로드는 OAuth 연동 후 가능합니다 (준비중).</p>
    </div>

    <div class="s5up-cards">
      ${S5UP_PLATFORMS.map(function(p){
        return _s5upRenderCard(p, plan.platforms[p.id]);
      }).join('')}
    </div>

    <div class="s5up-footer">
      <button class="s5up-auto-btn" disabled title="OAuth 연동 후 활성화">
        🔒 자동 업로드 (준비중)
      </button>
      <button class="s5up-save-btn" onclick="_s5upSavePlan()">
        💾 업로드 계획 저장
      </button>
    </div>

  </div>`;

  _s5upInjectCSS();
}

/* ── 플랫폼 카드 ── */
function _s5upRenderCard(plat, p) {
  const isText = plat.field === 'caption';
  return `
  <div class="s5up-card ${p.enabled?'on':''}">
    <label class="s5up-card-hd">
      <input type="checkbox" ${p.enabled?'checked':''}
        onchange="_s5upToggle('${plat.id}', this.checked)">
      <span class="s5up-card-ico">${plat.ico}</span>
      <span class="s5up-card-name">${plat.label}</span>
      <a class="s5up-card-link" href="${plat.open}" target="_blank" rel="noopener"
        onclick="event.stopPropagation()" title="${plat.label} 열기">↗</a>
    </label>

    ${p.enabled ? `
    <div class="s5up-card-body">

      <!-- 공개 설정 -->
      <div class="s5up-row">
        <div class="s5up-row-label">공개 설정</div>
        <div class="s5up-seg">
          ${S5UP_VISIBILITY.map(function(v){
            return '<button class="s5up-seg-btn ' + (p.visibility===v.id?'on':'') + '"' +
              ' onclick="_s5upSetField(\'' + plat.id + '\',\'visibility\',\'' + v.id + '\')">' +
              v.label + '</button>';
          }).join('')}
        </div>
      </div>

      ${p.visibility === 'scheduled' ? `
      <!-- 예약 -->
      <div class="s5up-row s5up-sched">
        <div class="s5up-row-label">예약 일시</div>
        <input type="date" class="s5up-inp"
          value="${p.scheduledAt||''}"
          oninput="_s5upSetField('${plat.id}','scheduledAt',this.value)">
        <input type="time" class="s5up-inp" style="max-width:120px"
          value="${p.scheduledTime||'18:00'}"
          oninput="_s5upSetField('${plat.id}','scheduledTime',this.value)">
        <select class="s5up-inp" style="max-width:170px"
          onchange="_s5upSetField('${plat.id}','timezone',this.value)">
          <option value="Asia/Seoul"   ${p.timezone==='Asia/Seoul'?'selected':''}>Asia/Seoul (KST)</option>
          <option value="Asia/Tokyo"   ${p.timezone==='Asia/Tokyo'?'selected':''}>Asia/Tokyo (JST)</option>
          <option value="UTC"          ${p.timezone==='UTC'?'selected':''}>UTC</option>
        </select>
      </div>` : ''}

      <!-- 제목/캡션 -->
      ${isText ? `
        <div class="s5up-row">
          <div class="s5up-row-label">캡션</div>
          <textarea class="s5up-textarea" rows="3"
            placeholder="플랫폼에 게시할 캡션 (해시태그 포함 가능)"
            oninput="_s5upSetField('${plat.id}','caption',this.value)">${p.caption||''}</textarea>
        </div>
      ` : `
        <div class="s5up-row">
          <div class="s5up-row-label">제목</div>
          <input type="text" class="s5up-inp"
            placeholder="${plat.label} 제목"
            value="${(p.title||'').replace(/"/g,'&quot;')}"
            oninput="_s5upSetField('${plat.id}','title',this.value)">
        </div>
        <div class="s5up-row">
          <div class="s5up-row-label">설명문</div>
          <textarea class="s5up-textarea" rows="3"
            placeholder="${plat.label} 설명문"
            oninput="_s5upSetField('${plat.id}','body',this.value)">${p.body||''}</textarea>
        </div>
      `}

      <!-- 태그 -->
      <div class="s5up-row">
        <div class="s5up-row-label">태그 (쉼표 구분)</div>
        <input type="text" class="s5up-inp"
          placeholder="예: 시니어, 건강, 트로트"
          value="${(p.tags||[]).join(', ')}"
          oninput="_s5upSetTags('${plat.id}',this.value)">
      </div>

      <!-- 액션 -->
      <div class="s5up-actions">
        <button class="s5up-action-btn" onclick="_s5upCopyGuide('${plat.id}')">
          📋 수동 업로드 가이드 복사
        </button>
        <a class="s5up-action-btn open" href="${plat.open}" target="_blank" rel="noopener">
          ↗ ${plat.label} 열기
        </a>
      </div>

    </div>
    ` : ''}
  </div>`;
}

/* ════════════════════════════════════════════════
   이벤트 핸들러
   ════════════════════════════════════════════════ */
window._s5upToggle = function(id, on) {
  const plan = _s5upGetPlan();
  if (!plan.platforms[id]) plan.platforms[id] = _s5upDefaultPlatform();
  plan.platforms[id].enabled = !!on;
  if (typeof studioSave === 'function') studioSave();
  _s5upRender('s5UpPlatformsWrap');
};

window._s5upSetField = function(id, key, val) {
  const plan = _s5upGetPlan();
  if (!plan.platforms[id]) plan.platforms[id] = _s5upDefaultPlatform();
  plan.platforms[id][key] = val;
  if (typeof studioSave === 'function') studioSave();
  /* visibility 변경 시 예약 입력창 토글 위해 재렌더 */
  if (key === 'visibility') _s5upRender('s5UpPlatformsWrap');
};

window._s5upSetTags = function(id, val) {
  const plan = _s5upGetPlan();
  if (!plan.platforms[id]) plan.platforms[id] = _s5upDefaultPlatform();
  plan.platforms[id].tags = (val||'').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
  if (typeof studioSave === 'function') studioSave();
};

window._s5upSavePlan = function() {
  if (typeof studioSave === 'function') studioSave();
  alert('✅ 업로드 계획이 저장됐습니다.');
};

/* ── 가이드 복사 ── */
window._s5upCopyGuide = function(platformId) {
  const plan = _s5upGetPlan();
  const p    = plan.platforms[platformId] || {};
  const meta = S5UP_PLATFORMS.find(function(x){ return x.id===platformId; }) || {};

  const lines = [];
  lines.push('=== ' + (meta.label||platformId) + ' 수동 업로드 가이드 ===');
  lines.push('');
  lines.push('1. ' + meta.label + ' 열기: ' + (meta.open||''));
  lines.push('2. 영상 파일 업로드 후 다음 정보를 붙여넣으세요:');
  lines.push('');
  if (meta.field === 'caption') {
    lines.push('[캡션]');
    lines.push(p.caption || '(작성 안 됨)');
  } else {
    lines.push('[제목]');
    lines.push(p.title || '(작성 안 됨)');
    lines.push('');
    lines.push('[설명문]');
    lines.push(p.body  || '(작성 안 됨)');
  }
  lines.push('');
  if (p.tags && p.tags.length) {
    lines.push('[태그]');
    lines.push(p.tags.map(function(t){ return '#' + t; }).join(' '));
    lines.push('');
  }
  lines.push('[공개 설정] ' + (p.visibility||'draft'));
  if (p.visibility === 'scheduled') {
    lines.push('[예약] ' + (p.scheduledAt||'') + ' ' + (p.scheduledTime||'') + ' ' + (p.timezone||''));
  }

  const text = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function(){
      alert('📋 ' + meta.label + ' 업로드 가이드가 복사됐습니다.');
    }).catch(function(){
      _s5upFallbackCopy(text);
    });
  } else {
    _s5upFallbackCopy(text);
  }
};

function _s5upFallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); alert('📋 복사됐습니다.'); }
  catch(_) { alert('복사 실패. 수동으로 선택해서 복사해주세요.'); }
  document.body.removeChild(ta);
}

/* ── CSS ── */
function _s5upInjectCSS() {
  if (document.getElementById('s5up-style')) return;
  const st = document.createElement('style');
  st.id = 's5up-style';
  st.textContent = `
.s5up-wrap{margin-top:18px;padding:16px;background:#fbf7f9;border-radius:14px;border:1.5px solid #f1dce7}
.s5up-hd{margin-bottom:14px}
.s5up-title{margin:0 0 4px;font-size:14px;font-weight:800;color:#2b2430}
.s5up-sub{margin:0;font-size:11.5px;color:#9b8a93;line-height:1.5}
.s5up-cards{display:flex;flex-direction:column;gap:10px}
.s5up-card{background:#fff;border:1.5px solid #f1dce7;border-radius:12px;overflow:hidden;transition:.12s}
.s5up-card.on{border-color:#9181ff;box-shadow:0 2px 8px rgba(145,129,255,.1)}
.s5up-card-hd{display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;
  user-select:none;background:#fbf7f9}
.s5up-card.on .s5up-card-hd{background:#ede9ff}
.s5up-card-hd input[type="checkbox"]{width:16px;height:16px;cursor:pointer;accent-color:#9181ff;margin:0}
.s5up-card-ico{font-size:18px}
.s5up-card-name{flex:1;font-size:13px;font-weight:800;color:#2b2430}
.s5up-card-link{color:#9b8a93;text-decoration:none;font-size:14px;padding:2px 8px;
  border-radius:6px;transition:.12s}
.s5up-card-link:hover{background:#fff;color:#9181ff}
.s5up-card-body{padding:12px 14px 14px;display:flex;flex-direction:column;gap:10px;
  border-top:1px solid #f1dce7}
.s5up-row{display:flex;flex-direction:column;gap:5px}
.s5up-row.s5up-sched{flex-direction:row;align-items:flex-end;gap:6px;flex-wrap:wrap}
.s5up-row.s5up-sched .s5up-row-label{flex:0 0 100%}
.s5up-row-label{font-size:11px;font-weight:700;color:#5a4a56}
.s5up-seg{display:flex;gap:4px;flex-wrap:wrap}
.s5up-seg-btn{padding:4px 11px;border:1.5px solid #f1dce7;border-radius:6px;
  background:#fff;font-size:11px;font-weight:700;color:#7b7077;cursor:pointer;transition:.12s;font-family:inherit}
.s5up-seg-btn:hover{border-color:#9181ff;color:#9181ff}
.s5up-seg-btn.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.s5up-inp,.s5up-textarea{width:100%;border:1.5px solid #f1dce7;border-radius:8px;
  padding:7px 10px;font-size:12px;font-family:inherit;outline:none;box-sizing:border-box;background:#fff}
.s5up-textarea{resize:vertical;line-height:1.5;min-height:60px}
.s5up-inp:focus,.s5up-textarea:focus{border-color:#9181ff}
.s5up-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
.s5up-action-btn{padding:7px 12px;border:1.5px solid #9181ff;border-radius:8px;
  background:#fff;color:#9181ff;font-size:11.5px;font-weight:700;cursor:pointer;
  transition:.12s;text-decoration:none;font-family:inherit}
.s5up-action-btn:hover{background:#9181ff;color:#fff}
.s5up-action-btn.open{border-color:#ef6fab;color:#ef6fab}
.s5up-action-btn.open:hover{background:#ef6fab;color:#fff}
.s5up-footer{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.s5up-auto-btn,.s5up-save-btn{flex:1;padding:11px;border:none;border-radius:10px;
  font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;transition:.12s}
.s5up-auto-btn{background:#f1f1f1;color:#9b8a93;cursor:not-allowed}
.s5up-save-btn{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff}
.s5up-save-btn:hover{opacity:.9}
`;
  document.head.appendChild(st);
}
