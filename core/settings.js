/* ==================================================
   settings.js  -- AI/cost/theme/write/lock/stats + API hook
   ================================================== */


// APIAdapter.callAI / callWithFallback 양쪽에 자동 비용 기록 + 예산 가드 후킹
(function hookAPIAdapter(){
  if (typeof APIAdapter === 'undefined' || typeof CostTracker === 'undefined') return;
  if (APIAdapter._costHooked) return;
  APIAdapter._costHooked = true;

  const wrap = (fnName) => {
    const orig = APIAdapter[fnName];
    if (typeof orig !== 'function') return;
    APIAdapter[fnName] = async function(system, user, opts){
      if (!CostTracker.canGenerate()) {
        const s = CostTracker.getStatus();
        throw new Error('이번달 예산 ' + CostTracker.getBudget().blockAt + '% 에 도달했어요. 설정에서 예산을 늘리거나 월말까지 기다려주세요. (사용률 ' + Math.round(s.usedPct) + '%)');
      }
      const result = await orig.call(this, system, user, opts);
      try {
        const provider = (opts && opts.provider) || APIAdapter.getProvider();
        const model = (opts && opts.model) ||
          (provider==='claude'  ? 'claude-sonnet-4-5' :
           provider==='openai'  ? (localStorage.getItem('uc_openai_model')||'gpt-4o') :
           provider==='gemini'  ? (localStorage.getItem('uc_gemini_model')||'gemini-2.0-flash') :
           provider==='minimax' ? (localStorage.getItem('uc_minimax_model')||'abab6.5s-chat') : 'claude-sonnet-4-5');
        CostTracker.record({
          model, inputText: (system||'') + '\n' + (user||''), outputText: result,
          featureId: opts && opts.featureId
        });
      } catch(e) { console.warn('[cost-tracker] record failed:', e); }
      return result;
    };
  };
  // callWithFallback 만 래핑하면 내부 callAI 는 원본 그대로 호출되어야 함 (이중 기록 방지).
  // 대신 callAI 는 "예산 가드만" 유지하고 기록은 각 호출 성공 지점에서 한다.
  wrap('callAI');
  wrap('callWithFallback');
})();

/* ─── ⚙️ 설정 모드 ─── */
const SET_HUB = [

{id:'profile',ico:'👤',  title:'나의 프로필', desc:'여러 명이 따로 사용'},

{id:'brand',  ico:'🎨',  title:'내 채널 브랜드', desc:'로고·색상·폰트 1회 설정'},

{id:'ai',     ico:'🔑',  title:'AI 연결',     desc:'AI 키를 넣어요'},

{id:'cost',   ico:'💰',  title:'비용 관리',   desc:'얼마 썼는지 봐요'},

{id:'theme',  ico:'🎨',  title:'꾸미기',      desc:'화면 색깔 바꿔요'},

{id:'write',  ico:'✍️',  title:'글쓰기',      desc:'기본값 설정해요'},

{id:'lock',   ico:'🔒',  title:'보안',        desc:'어린이 보호 설정'},

{id:'stats',  ico:'📊',  title:'현황',        desc:'내 통계 봐요'}

];

let setActive = null;

function renderSettings(){
  const stage = document.getElementById('settingStage') || createSettingStage();
  stage.innerHTML = `
    <div class="set-top">
      <h2>⚙️ 설정 — 내 마음대로 꾸며요!</h2>
      <p>어려운 말 없이 쉽게 알려드려요. 아래 6개 카드 중 하나를 눌러주세요 ✨</p>
    </div>
    <div class="set-hub">${SET_HUB.map(c => `
      <button class="set-hub-card ${setActive===c.id?'on':''}" onclick="setOpen('${c.id}')">
        <span class="ico">${c.ico}</span>
        <strong>${c.title}</strong>
        <span>${c.desc}</span>
      </button>`).join('')}
    </div>
    <div id="set-content"></div>
    <!-- 의도반영: 프로필 & 스타일 관리 (조용히) -->
    <div style="margin-top:18px;padding:14px 18px;background:#fff;border:1px solid var(--line);border-radius:18px">
      <div id="intentMgrRoot"></div>
    </div>
  `;
  setTimeout(()=>{ if(window.IntentSystem) window.IntentSystem.renderProfileManager('intentMgrRoot'); }, 20);
  if (setActive) renderSetSection(setActive);
}

function createSettingStage(){
  const stage = document.createElement('div');
  stage.id = 'settingStage';
  stage.className = 'set-stage hide';
  document.querySelector('main.card .main').appendChild(stage);
  return stage;
}

function setOpen(id){ setActive = id; renderSettings(); }

function renderSetSection(id){
  const c = document.getElementById('set-content');
  c.innerHTML = ({
    profile: renderSetProfile,
    brand: renderSetBrand,
    ai: renderSetAi, cost: renderSetCost, theme: renderSetTheme,
    write: renderSetWrite, lock: renderSetLock, stats: renderSetStats
  }[id] || (()=>''))();
  if (typeof window._setInit === 'function') { window._setInit(); window._setInit = null; }
  if (id === 'ai' && typeof _bindFallbackDnD === 'function') setTimeout(_bindFallbackDnD, 10);
}

/* ─── 섹션 1: 🔑 AI 연결 ─── */

function renderSetAi(){
  const keys = {
    claude:  localStorage.getItem('uc_claude_key')||'',
    openai:  localStorage.getItem('uc_openai_key')||'',
    gemini:  localStorage.getItem('uc_gemini_key')||'',
    minimax: localStorage.getItem('uc_minimax_key')||''
  };
  const models = {
    claude:  ['claude-sonnet-4-5','claude-haiku-4-5-20251001'],
    openai:  ['gpt-4o','gpt-4o-mini'],
    gemini:  ['gemini-2.0-flash','gemini-2.5-pro-exp-03-25'],
    minimax: ['abab6.5s-chat','abab6.5-chat']
  };
  const cur = {
    claude:  'claude-sonnet-4-5',
    openai:  localStorage.getItem('uc_openai_model')||'gpt-4o',
    gemini:  localStorage.getItem('uc_gemini_model')||'gemini-2.0-flash',
    minimax: localStorage.getItem('uc_minimax_model')||'abab6.5s-chat'
  };
  const card = (p, cls, title, tip, costHint, urlLabel, url) => {
    const on = !!keys[p];
    return `<div class="set-key-card ${cls}">
      <div class="khead"><strong>${title}</strong>
        <span class="set-status ${on?'on':'off'}">${on?'🟢 연결됨':'🔴 연결 안됨'}</span>
      </div>
      <p class="hint" style="margin:0 0 8px">${tip}</p>
      <div class="set-row">
        <div style="grid-column:1/3">
          <label>API 키</label>
          <input class="set-in" id="sk-${p}" type="password" placeholder="${p==='claude'?'sk-ant-api03-...':'sk-...'}" value="${keys[p]}">
        </div>
        <div>
          <label>모델</label>
          <select class="set-in" id="sm-${p}">${models[p].map(m=>`<option value="${m}" ${m===cur[p]?'selected':''}>${m}</option>`).join('')}</select>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
        <button class="set-btn" onclick="saveProvKey('${p}')">💾 저장</button>
        <button class="set-btn ghost" onclick="toggleKeyVis('sk-${p}')">👁️ 보기/숨기기</button>
        <a class="set-linkbtn" href="${url}" target="_blank" style="margin-left:auto">${urlLabel} ↗</a>
      </div>
      <p class="hint" style="margin:8px 0 0;font-size:11px">💰 ${costHint}</p>
    </div>`;
  };
  return `<div class="set-panel">
    <h3>🔑 AI 연결 설정</h3>
    <p class="hint">💡 "AI를 쓰려면 열쇠(키)가 필요해요. 게임 계정처럼 딱 한 번만 넣으면 계속 쓸 수 있어요!"</p>
    ${card('claude','claude','🟣 Claude (글쓰기 최고!)','한국어 글쓰기 품질 1위. 긴 문서·감성적 글에 강해요.','글 1개 = 약 15~50원','콘솔에서 잔액 확인','https://console.anthropic.com/')}
    ${card('openai','openai','🟢 OpenAI (다방면 최고!)','이미지·음성도 함께 써요. DALL-E와 키 공유 가능.','글 1개 = 약 5~20원 (mini) / 20~60원 (4o)','OpenAI에서 잔액 확인','https://platform.openai.com/usage')}
    ${card('gemini','gemini','🔵 Gemini (검색·정보 최고!)','무료 할당량이 넉넉해요. 가장 저렴!','글 1개 = 약 1~5원','Google에서 잔액 확인','https://aistudio.google.com/')}
    ${card('minimax','minimax','🔴 MiniMax (중국어·다국어 특화)','중국어/한·중·일 번역과 표현에 강해요. 긴 문서도 잘 처리해요.','글 1개 = 약 3~10원','MiniMax에서 키 받기','https://www.minimaxi.com/platform')}

    <details class="gd-fold">
      <summary>🎙 음성·🖼 이미지·🎬 영상·🎵 음악 키 (고급)</summary>
      <div style="padding:10px 0">
        <div class="set-row"><div style="grid-column:1/4"><label>🎙 ElevenLabs</label><input class="set-in" type="password" id="sk-11l" placeholder="sk_..." value="${localStorage.getItem('uc_elevenlabs_key')||''}"><button class="set-btn" onclick="saveMiscKey('11l','uc_elevenlabs_key')" style="margin-top:6px">저장</button><p class="hint" style="margin:6px 0 0;font-size:11px">💡 ElevenLabs에서 일본어 지원 음성을 선택하세요 (예: Yuki, Aria 등)</p></div></div>
        <div class="set-row"><div style="grid-column:1/4"><label>🎬 InVideo</label><input class="set-in" type="password" id="sk-iv" placeholder="..." value="${localStorage.getItem('uc_invideo_key')||''}"><button class="set-btn" onclick="saveMiscKey('iv','uc_invideo_key')" style="margin-top:6px">저장</button></div></div>
        <div class="set-row"><div style="grid-column:1/4"><label>🎵 Suno</label><input class="set-in" type="password" id="sk-suno" placeholder="..." value="${localStorage.getItem('uc_suno_key')||''}"><button class="set-btn" onclick="saveMiscKey('suno','uc_suno_key')" style="margin-top:6px">저장</button></div></div>
        <p class="hint">🖼 DALL·E는 OpenAI 키를 자동으로 씁니다 (위에서 저장한 키 사용)</p>
      </div>
    </details>

    <div class="set-budget-box" style="margin-top:12px">
      <h4>💡 키가 없어요!</h4>
      <p class="hint" style="margin:4px 0 10px">아직 키가 없어도 괜찮아요. 아래 버튼을 눌러서 무료로 받아요!</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <a class="set-linkbtn" href="https://aistudio.google.com/app/apikey" target="_blank">🔵 Gemini 키 받기 (무료!) ⭐</a>
        <a class="set-linkbtn" href="https://console.anthropic.com/" target="_blank">🟣 Claude 키 받기</a>
        <a class="set-linkbtn" href="https://platform.openai.com/api-keys" target="_blank">🟢 OpenAI 키 받기</a>
      </div>
    </div>

    ${renderAiStatusDashboard()}
    ${renderFallbackOrder()}
    ${renderFeatureMatrix()}
  </div>`;
}

/* ─── 🤖 AI 상태 대시보드 ─── */
function renderAiStatusDashboard(){
  const providers = [
    {id:'claude',  label:'🟣 Claude',   url:'https://console.anthropic.com/'},
    {id:'openai',  label:'🟢 ChatGPT',  url:'https://platform.openai.com/api-keys'},
    {id:'gemini',  label:'🔵 Gemini',   url:'https://aistudio.google.com/app/apikey'},
    {id:'minimax', label:'🔴 MiniMax',  url:'https://www.minimaxi.com/platform'}
  ];
  const rows = providers.map(p => {
    const hasKey = !!localStorage.getItem('uc_' + p.id + '_key');
    const st = (typeof APIAdapter !== 'undefined' && APIAdapter.getConnectionStatus) ? APIAdapter.getConnectionStatus(p.id) : null;
    const dot = !hasKey ? '🔴' : (st && st.state === 'error' ? '🔴' : (st && st.state === 'ok' ? '🟢' : '🟡'));
    const stText = !hasKey ? '🔴 키 없음' : (st && st.state === 'error' ? '🔴 오류 (' + ((st.info && st.info.kind) || '알 수 없음') + ')' : (st && st.state === 'ok' ? '🟢 연결됨 (정상)' : '🟡 키 있음 · 확인 전'));
    const lastErr = (st && st.state === 'error' && st.info && st.info.message) ? ('마지막 오류: ' + st.info.message.slice(0,80)) : '마지막 오류: 없음';
    return '<div class="ai-status-row" style="padding:10px 12px;background:#fff;border:1px solid var(--line);border-radius:12px;margin-bottom:8px;display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center">' +
      '<div><b>' + p.label + '</b> <span style="margin-left:8px;font-size:13px">' + stText + '</span>' +
      '<div class="hint" style="margin-top:2px;font-size:11px">' + lastErr + '</div></div>' +
      (hasKey
        ? '<button class="set-btn" onclick="testAiConnection(\'' + p.id + '\',this)">🔌 연결 테스트</button>'
        : '<a class="set-linkbtn" href="' + p.url + '" target="_blank">지금 키 받기</a>'
      ) +
    '</div>';
  }).join('');
  return '<div class="set-budget-box" style="margin-top:14px"><h4>🤖 AI 연결 상태</h4>' +
    '<p class="hint" style="margin:4px 0 10px">실시간 연결 확인 · 실패한 AI는 자동으로 다음 AI로 넘어가요.</p>' +
    rows +
  '</div>';
}

async function testAiConnection(provider, btn){
  if (typeof APIAdapter === 'undefined') { alert('api-adapter.js 미로드'); return; }
  const orig = btn.textContent;
  btn.disabled = true; btn.textContent = '⏳ 테스트 중...';
  try{
    const r = await APIAdapter.testConnection(provider);
    if(r.ok) alert('🟢 정상 작동합니다!\n\n응답: ' + (r.response||''));
    else {
      const msgMap = { auth:'🔴 API 키가 틀렸거나 만료됐어요', credit:'🔴 크레딧이 부족해요', rate:'🔴 잠시 후 다시 시도해주세요', server:'🔴 서버에 문제가 있어요', network:'🔴 연결할 수 없어요' };
      alert(msgMap[r.kind] || ('🔴 ' + r.message));
    }
  }catch(e){ alert('❌ ' + e.message); }
  finally{ btn.disabled = false; btn.textContent = orig; renderSetSection('ai'); }
}

/* ─── ⚙️ 자동 전환 (폴백) 우선순위 ─── */

function renderFallbackOrder(){
  if (typeof APIAdapter === 'undefined') return '';
  const order = APIAdapter.getFallbackOrder();
  const enabled = APIAdapter.isFallbackEnabled();
  const labelOf = id => ({claude:'🟣 Claude', openai:'🟢 ChatGPT', gemini:'🔵 Gemini', minimax:'🔴 MiniMax'}[id] || id);
  return '<div class="set-budget-box" style="margin-top:14px;background:linear-gradient(135deg,#f7f4ff,#eff6ff);border-color:#bcd7f0">' +
    '<h4>⚙️ 자동 전환 설정</h4>' +
    '<label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;padding:6px 0;cursor:pointer">' +
      '<input type="checkbox" id="fallback-enabled" ' + (enabled?'checked':'') + ' onchange="APIAdapter.setFallbackEnabled(this.checked);renderSetSection(\'ai\')"> ' +
      '오류 시 자동으로 다른 AI 사용' +
    '</label>' +
    '<p class="hint" style="margin:4px 0 10px">예: Claude 크레딧 부족 → OpenAI 로 즉시 전환 · 토스트 알림 표시</p>' +
    '<div id="fallback-list" style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:6px">' +
      order.map((id, i) => '<div class="fallback-row" draggable="true" data-id="' + id + '" style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:#fff;border:1px solid transparent;border-radius:8px;cursor:grab;user-select:none">' +
        '<span style="font-size:12px;color:var(--sub);width:36px">' + (i+1) + '순위</span>' +
        '<span style="flex:1;font-weight:900">' + labelOf(id) + '</span>' +
        '<span style="color:var(--muted);font-size:14px">☰</span>' +
      '</div>').join('') +
    '</div>' +
    '<p class="hint" style="margin:8px 0 0;font-size:11px">↑↓ 드래그로 순서 변경 · 저장은 자동</p>' +
  '</div>';
}

// DnD 바인딩 (렌더 후 DOM 준비 시점에 실행)
function _bindFallbackDnD(){
  const list = document.getElementById('fallback-list'); if(!list) return;
  let dragId = null;
  list.querySelectorAll('.fallback-row').forEach(row => {
    row.addEventListener('dragstart', e => { dragId = row.getAttribute('data-id'); row.style.opacity = '0.5'; });
    row.addEventListener('dragend',   e => { row.style.opacity = '1'; });
    row.addEventListener('dragover',  e => { e.preventDefault(); row.style.borderColor = 'var(--pink)'; });
    row.addEventListener('dragleave', e => { row.style.borderColor = 'transparent'; });
    row.addEventListener('drop', e => {
      e.preventDefault();
      row.style.borderColor = 'transparent';
      const overId = row.getAttribute('data-id');
      if(!dragId || dragId === overId) return;
      const cur = APIAdapter.getFallbackOrder();
      const from = cur.indexOf(dragId), to = cur.indexOf(overId);
      if(from < 0 || to < 0) return;
      cur.splice(to, 0, cur.splice(from, 1)[0]);
      APIAdapter.setFallbackOrder(cur);
      renderSetSection('ai');
    });
  });
}
// renderSetSection 후크: 폴백 섹션이 있으면 DnD 바인딩
const _origRenderSetSection = typeof renderSetSection === 'function' ? renderSetSection : null;

/* ─── 🤖 기능별 최적 AI 조합 (AI 연결 섹션 내부) ─── */
const FEATURE_MATRIX_TEXT = [

{id:'script',          icon:'✍️', label:'대본/글쓰기'},

{id:'official',        icon:'📋', label:'공공기관 문서'},

{id:'small_business',  icon:'🏪', label:'소상공인'},

{id:'translate_ko_ja', icon:'🌏', label:'한→일 번역'},

{id:'translate_ko_en', icon:'🌏', label:'한→영 번역'},

{id:'learning',        icon:'📚', label:'학습/교육'},

{id:'kids',            icon:'🎮', label:'어린이 모드'},

{id:'psychology',      icon:'🔮', label:'심리/운세'},

{id:'auto_shorts',     icon:'⚡', label:'자동숏츠'},

{id:'summary',         icon:'📝', label:'요약/정리'}

];

const FEATURE_MATRIX_IMAGE = [

{id:'ghibli',       icon:'🎨', label:'지브리/애니'},

{id:'realistic',    icon:'🎨', label:'실사/사진'},

{id:'thumbnail',    icon:'🖼', label:'썸네일'},

{id:'countryballs', icon:'🌍', label:'Countryballs'}

];

const FEATURE_MATRIX_TTS = [

{id:'ko_emotional', icon:'🎙', label:'한국어 감동'},

{id:'ko_general',   icon:'🎙', label:'한국어 일반'},

{id:'ja_general',   icon:'🎙', label:'일본어'},

{id:'tiki_taka_a',  icon:'🎙', label:'티키타카A'},

{id:'tiki_taka_b',  icon:'🎙', label:'티키타카B'},

{id:'kids',         icon:'🎙', label:'어린이'}

];

const TEXT_PROVIDER_CHOICES = [

{provider:'claude', model:'claude-sonnet-4-5',         label:'🟣 Claude Sonnet'},

{provider:'claude', model:'claude-haiku-4-5-20251001', label:'🟣 Claude Haiku'},

{provider:'openai', model:'gpt-4o',                    label:'🟢 GPT-4o'},

{provider:'openai', model:'gpt-4o-mini',               label:'🟢 GPT-4o-mini'},

{provider:'gemini', model:'gemini-2.0-flash',          label:'🔵 Gemini Flash'}

];

const IMAGE_PROVIDER_CHOICES = [

{provider:'ideogram', model:'ideogram-v2', label:'Ideogram'},

{provider:'dalle3',   model:'dall-e-3',    label:'DALL-E 3'},

{provider:'stability',model:'stable-image-core', label:'Stability'}

];

const TTS_PROVIDER_CHOICES = [

{provider:'elevenlabs', voice:'Rachel',  label:'ElevenLabs Rachel'},

{provider:'elevenlabs', voice:'Domi',    label:'ElevenLabs Domi'},

{provider:'openai',     voice:'nova',    label:'OpenAI Nova'},

{provider:'openai',     voice:'shimmer', label:'OpenAI Shimmer'},

{provider:'nijivoice',  voice:'default', label:'Nijivoice'}

];

function _featureSignature(cfg){
  if(!cfg) return '';
  if(cfg.model) return cfg.provider + '|' + cfg.model;
  if(cfg.voice) return cfg.provider + '|' + cfg.voice;
  return cfg.provider || '';
}

function _featureRow(category, item, choices){
  const PC = (typeof ProviderConfig !== 'undefined') ? ProviderConfig : null;
  const cfg = PC ? PC.getFeatureDefault(category, item.id) : null;
  const sig = _featureSignature(cfg);
  const curLabel = (cfg && cfg.label) || '—';
  const reason   = (cfg && cfg.reason) || '';
  const opts = choices.map(c => {
    const csig = _featureSignature(c);
    return `<option value='${csig}' ${csig===sig?'selected':''}>${c.label}</option>`;
  }).join('');
  return `<tr>
    <td>${item.icon} ${item.label}</td>
    <td><b>${curLabel}</b></td>
    <td class="hint">${reason}</td>
    <td><select class="set-in feat-sel" data-cat="${category}" data-id="${item.id}">${opts}</select></td>
  </tr>`;
}

function renderFeatureMatrix(){
  const textRows  = FEATURE_MATRIX_TEXT.map(x => _featureRow('text',  x, TEXT_PROVIDER_CHOICES)).join('');
  const imageRows = FEATURE_MATRIX_IMAGE.map(x => _featureRow('image', x, IMAGE_PROVIDER_CHOICES)).join('');
  const ttsRows   = FEATURE_MATRIX_TTS.map(x => _featureRow('tts',   x, TTS_PROVIDER_CHOICES)).join('');
  return `<div class="set-budget-box" style="margin-top:16px;background:linear-gradient(135deg,#fff5fa,#eef6ff);border-color:#e0c5d8">
    <h4 style="margin:0">🤖 기능별 최적 AI 조합</h4>
    <p class="hint" style="margin:4px 0 10px">전문가가 설정한 최적 조합이에요. 바꾸고 싶으면 언제든지 변경 가능!</p>

    <table class="set-table" style="font-size:13px">
      <tr><th>기능</th><th>기본 AI</th><th>이유</th><th>변경</th></tr>
      ${textRows}
      <tr><td colspan="4" style="background:#f6eff7;font-weight:600">🎨 이미지</td></tr>
      ${imageRows}
      <tr><td colspan="4" style="background:#f6eff7;font-weight:600">🎙 음성</td></tr>
      ${ttsRows}
    </table>

    <div class="set-budget-box" style="margin-top:12px;background:#fff;border-color:#eadff1">
      <h4 style="margin:0 0 6px">💡 이 설정의 의미</h4>
      <ul style="margin:0;padding-left:18px;font-size:12px;line-height:1.8">
        <li><b>Claude</b> = 한국어/일본어 글쓰기 최강</li>
        <li><b>GPT-4o</b> = 영어 번역 최강</li>
        <li><b>Gemini</b> = 빠르고 저렴한 요약</li>
        <li><b>Ideogram</b> = 텍스트 포함 이미지 무료</li>
        <li><b>DALL-E 3</b> = 실사/캐릭터 품질 최강</li>
        <li><b>ElevenLabs</b> = 감성 목소리 최강</li>
        <li><b>Nijivoice</b> = 일본어 목소리 최강</li>
      </ul>
    </div>

    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
      <button class="set-btn" onclick="saveFeatureMatrix()">✅ 이 설정으로 저장</button>
      <button class="set-btn ghost" onclick="resetFeatureMatrix()">↩️ 전문가 추천으로 되돌리기</button>
    </div>
  </div>`;
}

function saveFeatureMatrix(){
  if (typeof ProviderConfig === 'undefined') { alert('providers.js 미로드'); return; }
  const CHOICE_BANK = { text:TEXT_PROVIDER_CHOICES, image:IMAGE_PROVIDER_CHOICES, tts:TTS_PROVIDER_CHOICES };
  const nodes = document.querySelectorAll('.feat-sel');
  let missing = [];
  nodes.forEach(sel => {
    const cat = sel.getAttribute('data-cat');
    const id  = sel.getAttribute('data-id');
    const sig = sel.value;
    const pick = (CHOICE_BANK[cat]||[]).find(c => _featureSignature(c) === sig);
    if(!pick) return;
    const base = ProviderConfig.getFeatureDefault(cat, id) || {};
    const merged = Object.assign({}, base, pick);
    ProviderConfig.setFeatureDefault(cat, id, merged);
    // API 키 미연결 체크 (텍스트만)
    if (cat === 'text' && typeof APIAdapter !== 'undefined' && !APIAdapter.hasApiKey(pick.provider)) {
      if (!missing.includes(pick.provider)) missing.push(pick.provider);
    }
  });
  if (missing.length) {
    const labels = missing.map(p => ({claude:'Claude',openai:'ChatGPT',gemini:'Gemini'}[p]||p)).join(', ');
    if (confirm('💾 저장 완료!\n\n🔑 [' + labels + '] 키가 아직 없어요. 지금 입력할까요?')) {
      document.querySelector('#sk-' + missing[0])?.focus();
      return;
    }
  } else {
    alert('✅ 기능별 AI 조합이 저장됐어요!');
  }
  renderSetSection('ai');
}

function resetFeatureMatrix(){
  if (typeof ProviderConfig === 'undefined') return;
  if (!confirm('모든 기능을 전문가 추천 기본값으로 되돌릴까요?')) return;
  ['text','image','tts'].forEach(cat => ProviderConfig.clearFeatureDefault(cat));
  alert('↩️ 전문가 추천으로 돌렸어요.');
  renderSetSection('ai');
}

function saveProvKey(p){
  const key = document.getElementById('sk-'+p).value.trim();
  const model = document.getElementById('sm-'+p).value;
  localStorage.setItem('uc_'+p+'_key', key);
  if (p === 'openai')  localStorage.setItem('uc_openai_model', model);
  if (p === 'gemini')  localStorage.setItem('uc_gemini_model', model);
  if (p === 'minimax') localStorage.setItem('uc_minimax_model', model);
  if (typeof APIAdapter !== 'undefined' && APIAdapter.setApiKey) {
    try { APIAdapter.setApiKey(p, key); } catch(_) { /* minimax may not be in STORAGE_KEYS yet */ }
  }
  alert('💾 '+p+' 키 저장됨');
  updateCostBar();
}
function saveMiscKey(id, key){ localStorage.setItem(key, document.getElementById('sk-'+id).value.trim()); alert('💾 저장됨'); }
function toggleKeyVis(id){ const el = document.getElementById(id); el.type = el.type === 'password' ? 'text' : 'password'; }

/* ─── 섹션 2: 💰 비용 관리 ─── */
function renderSetCost(){
  const s = CostTracker.getStatus();
  const t = CostTracker.getToday();
  const m = CostTracker.getMonth();
  const b = CostTracker.getBudget();
  const fx = CostTracker.getFxRate();
  const lvl = s.level;
  return `<div class="set-panel">
    <h3>💰 실시간 비용 관리</h3>
    <p class="hint">💡 "얼마나 쓰고 있는지 한눈에 봐요"</p>

    <div class="set-budget-box">
      <h4>☀️ 오늘 사용한 비용</h4>
      <ul style="font-size:13px;list-style:none;padding:0;margin:8px 0">
        <li>🟣 Claude: 약 ${Math.round(t.byProvider?.claude||0).toLocaleString()}원</li>
        <li>🟢 OpenAI: 약 ${Math.round(t.byProvider?.openai||0).toLocaleString()}원</li>
        <li>🔵 Gemini: 약 ${Math.round(t.byProvider?.gemini||0).toLocaleString()}원</li>
      </ul>
      <hr style="border:none;border-top:1px dashed #e8a6c6;margin:8px 0">
      <strong style="font-size:16px">합계: 약 ${Math.round(s.todayKRW).toLocaleString()}원</strong>
    </div>

    <div class="set-budget-box" style="background:linear-gradient(135deg,#eff6ff,#fff5fa);border-color:#bcd7f0">
      <h4>📅 이번달 사용 현황</h4>
      <p>사용: 약 <b>${Math.round(s.monthKRW).toLocaleString()}원</b> <span class="pill">${Math.round(s.usedPct)}%</span></p>
      <p>예산: ${b.monthly.toLocaleString()}원</p>
      <div class="set-progress ${lvl==='warn'?'warn':lvl==='block'?'block':''}"><div style="width:${Math.min(100,s.usedPct)}%"></div></div>
      <p>남은 예산: 약 ${Math.round(s.remaining).toLocaleString()}원</p>
      <p>이 속도면 이번달 예상: <b>약 ${Math.round(s.projected).toLocaleString()}원</b></p>
    </div>

    <h4>📊 예산 설정</h4>
    <div class="set-row">
      <div><label>이번달 예산 (원)</label><input class="set-in" type="number" id="set-bud-m" value="${b.monthly}"></div>
      <div><label>⚠️ 경고 시점 (%)</label><input class="set-in" type="number" id="set-bud-w" value="${b.warnAt}"></div>
      <div><label>🚫 차단 시점 (%)</label><input class="set-in" type="number" id="set-bud-b" value="${b.blockAt}"></div>
    </div>
    <button class="set-btn" onclick="saveBudget()">💾 예산 저장</button>

    <h4>💳 잔액 확인하기</h4>
    <p class="hint">정확한 잔액은 각 사이트에서 확인해주세요.</p>
    <a class="set-linkbtn" href="https://console.anthropic.com/" target="_blank">🟣 Claude 잔액 확인 → console.anthropic.com</a>
    <a class="set-linkbtn" href="https://platform.openai.com/usage" target="_blank">🟢 OpenAI 잔액 확인 → platform.openai.com/usage</a>
    <a class="set-linkbtn" href="https://aistudio.google.com/" target="_blank">🔵 Gemini 잔액 확인 → aistudio.google.com</a>

    <h4>📋 모델별 비용 비교표</h4>
    <table class="set-table">
      <tr><th>모델</th><th>품질</th><th>속도</th><th>글 1개 비용</th></tr>
      <tr><td>🟣 Claude Sonnet</td><td>⭐⭐⭐</td><td>보통</td><td>약 15~50원</td></tr>
      <tr><td>🟣 Claude Haiku</td><td>⭐⭐</td><td>빠름</td><td>약 2~8원</td></tr>
      <tr><td>🟢 GPT-4o</td><td>⭐⭐⭐</td><td>보통</td><td>약 20~60원</td></tr>
      <tr><td>🟢 GPT-4o-mini</td><td>⭐⭐</td><td>빠름</td><td>약 1~5원</td></tr>
      <tr><td>🔵 Gemini Flash</td><td>⭐⭐</td><td>아주 빠름</td><td>약 1~3원</td></tr>
    </table>

    <h4>⚡ 절약 모드</h4>
    <div class="set-pill-row">
      <button class="set-pill ${localStorage.getItem('uc_thrift')==='off'||!localStorage.getItem('uc_thrift')?'on':''}" onclick="setThrift('off')">⭕ 끄기 (설정한 모델 그대로)</button>
      <button class="set-pill ${localStorage.getItem('uc_thrift')==='on'?'on':''}" onclick="setThrift('on')">✅ 켜기 (자동으로 저렴한 모델 선택)</button>
    </div>

    <h4>💱 환율 설정</h4>
    <div class="set-row">
      <div><label>1달러 = ? 원</label><input class="set-in" type="number" id="set-fx" value="${fx}"></div>
      <div style="display:flex;align-items:flex-end"><button class="set-btn" onclick="saveFx()">💾 환율 저장</button></div>
      <div><label style="opacity:.6">마지막 업데이트</label><input class="set-in" value="${new Date().toLocaleDateString('ko-KR')}" readonly></div>
    </div>

    <h4>🤖 기능별 AI 선택</h4>
    <p class="hint">전문가 추천 조합은 <b>설정 → 🔑 AI 연결</b> 탭의 "기능별 최적 AI 조합" 표에서 관리해요.</p>
    <button class="set-btn" onclick="setOpen('ai')">🔑 AI 연결 탭으로 이동</button>
  </div>`;
}
function featureModelRow(id, label, def){
  const cur = localStorage.getItem('uc_fmodel_'+id) || def;
  return `<div class="set-row" style="grid-template-columns:1fr 2fr">
    <label style="padding-top:10px">${label}</label>
    <select class="set-in" onchange="localStorage.setItem('uc_fmodel_${id}',this.value)">
      <option value="claude" ${cur==='claude'?'selected':''}>🟣 Claude</option>
      <option value="openai" ${cur==='openai'?'selected':''}>🟢 OpenAI</option>
      <option value="gemini" ${cur==='gemini'?'selected':''}>🔵 Gemini</option>
    </select>
  </div>`;
}
function saveBudget(){
  CostTracker.setBudget(
    parseFloat(document.getElementById('set-bud-m').value),
    parseFloat(document.getElementById('set-bud-w').value),
    parseFloat(document.getElementById('set-bud-b').value)
  );
  alert('💾 예산 저장됨'); renderSetSection('cost');
}
function saveFx(){
  CostTracker.setFxRate(parseFloat(document.getElementById('set-fx').value)||1350);
  alert('💾 환율 저장됨'); renderSetSection('cost');
}
function setThrift(v){ localStorage.setItem('uc_thrift', v); renderSetSection('cost'); }
function recommendModels(){
  localStorage.setItem('uc_fmodel_script','claude');
  localStorage.setItem('uc_fmodel_translate','openai');
  localStorage.setItem('uc_fmodel_summary','gemini');
  localStorage.setItem('uc_fmodel_public','claude');
  localStorage.setItem('uc_fmodel_image','openai');
  alert('✨ 추천 설정 적용됨'); renderSetSection('cost');
}

/* ─── 섹션 3: 🎨 꾸미기 ─── */
function renderSetTheme(){
  const t = localStorage.getItem('uc_theme')||'light';
  const col = localStorage.getItem('uc_color')||'pink';
  const fs  = localStorage.getItem('uc_fontsize')||'mid';
  const mp  = localStorage.getItem('uc_menupos')||'left';
  return `<div class="set-panel">
    <h3>🎨 화면 꾸미기</h3>
    <p class="hint">내 마음대로 꾸며봐요!</p>

    <h4>☀️ 테마</h4>
    <div class="set-pill-row">
      <button class="set-pill ${t==='light'?'on':''}" onclick="setTheme('light')">☀️ 밝게</button>
      <button class="set-pill ${t==='dark'?'on':''}" onclick="setTheme('dark')">🌙 어둡게</button>
      <button class="set-pill ${t==='auto'?'on':''}" onclick="setTheme('auto')">🔄 자동</button>
    </div>

    <h4>🌈 색깔</h4>
    <div class="set-pill-row">
      <button class="set-pill ${col==='pink'?'on':''}" onclick="setColor('pink')">💜 핑크-보라</button>
      <button class="set-pill ${col==='blue'?'on':''}" onclick="setColor('blue')">💙 파랑</button>
      <button class="set-pill ${col==='orange'?'on':''}" onclick="setColor('orange')">🧡 주황</button>
      <button class="set-pill ${col==='mono'?'on':''}" onclick="setColor('mono')">🖤 흑백</button>
    </div>

    <h4>🔤 글자 크기</h4>
    <div class="set-pill-row">
      <button class="set-pill ${fs==='sm'?'on':''}" onclick="setFontSize('sm')">작게</button>
      <button class="set-pill ${fs==='mid'?'on':''}" onclick="setFontSize('mid')">보통</button>
      <button class="set-pill ${fs==='lg'?'on':''}" onclick="setFontSize('lg')">크게</button>
      <button class="set-pill ${fs==='xl'?'on':''}" onclick="setFontSize('xl')">아주 크게</button>
    </div>
    <p style="padding:12px;background:#fff5fa;border-radius:12px;margin-top:6px;font-size:${fs==='sm'?'11':fs==='lg'?'18':fs==='xl'?'22':'14'}px;font-weight:800">미리보기: "이 크기예요!"</p>

    <h4>📍 메뉴 위치</h4>
    <div class="set-pill-row">
      <button class="set-pill ${mp==='left'?'on':''}" onclick="setMenuPos('left')">◀️ 왼쪽</button>
      <button class="set-pill ${mp==='right'?'on':''}" onclick="setMenuPos('right')">오른쪽 ▶️</button>
    </div>

    <h4>✨ 특별</h4>
    <label class="set-check"><input type="checkbox" id="chk-noanim" ${localStorage.getItem('uc_noanim')==='1'?'checked':''} onchange="localStorage.setItem('uc_noanim',this.checked?'1':'0')">움직이는 효과 끄기 (배터리 절약)</label>
    <label class="set-check"><input type="checkbox" id="chk-hc" ${localStorage.getItem('uc_highcontrast')==='1'?'checked':''} onchange="localStorage.setItem('uc_highcontrast',this.checked?'1':'0')">눈 편한 모드 (고대비)</label>

    <h4 style="margin-top:20px">🌐 언어 설정</h4>
    <p class="hint">화면 언어</p>
    <div class="set-pill-row">
      <button class="set-pill on">🇰🇷 한국어</button>
      <button class="set-pill" onclick="alert('준비중 🚧')">🇯🇵 日本語 🚧</button>
      <button class="set-pill" onclick="alert('준비중 🚧')">🇺🇸 English 🚧</button>
    </div>

    <p class="hint" style="margin-top:10px">만들어지는 글</p>
    <select class="set-in" onchange="localStorage.setItem('uc_gen_lang',this.value)">
      <option value="ko" ${(localStorage.getItem('uc_gen_lang')||'kojp')==='ko'?'selected':''}>한국어만</option>
      <option value="jp" ${localStorage.getItem('uc_gen_lang')==='jp'?'selected':''}>일본어만</option>
      <option value="kojp" ${(localStorage.getItem('uc_gen_lang')||'kojp')==='kojp'?'selected':''}>한국어+일본어 동시</option>
      <option value="all" ${localStorage.getItem('uc_gen_lang')==='all'?'selected':''}>한·일·영 동시</option>
    </select>

    <p class="hint" style="margin-top:10px">말투</p>
    <div class="set-row">
      <div><label>한국어</label><select class="set-in" onchange="localStorage.setItem('uc_ko_speech',this.value)"><option value="formal" ${(localStorage.getItem('uc_ko_speech')||'formal')==='formal'?'selected':''}>존댓말</option><option value="casual" ${localStorage.getItem('uc_ko_speech')==='casual'?'selected':''}>반말</option></select></div>
      <div><label>일본어</label><select class="set-in" onchange="localStorage.setItem('uc_jp_speech',this.value)"><option value="keitai" ${(localStorage.getItem('uc_jp_speech')||'keitai')==='keitai'?'selected':''}>정중체</option><option value="jotai" ${localStorage.getItem('uc_jp_speech')==='jotai'?'selected':''}>보통체</option></select></div>
      <div><label>날짜 형식</label><select class="set-in" onchange="localStorage.setItem('uc_date_fmt',this.value)">
        <option value="ko" ${(localStorage.getItem('uc_date_fmt')||'ko')==='ko'?'selected':''}>2025년 4월 20일</option>
        <option value="jp" ${localStorage.getItem('uc_date_fmt')==='jp'?'selected':''}>2025年4月20日</option>
        <option value="en" ${localStorage.getItem('uc_date_fmt')==='en'?'selected':''}>April 20, 2025</option>
      </select></div>
    </div>
  </div>`;
}
function setTheme(v){ localStorage.setItem('uc_theme',v); document.body.dataset.theme=v; renderSetSection('theme'); }
function setColor(v){ localStorage.setItem('uc_color',v); renderSetSection('theme'); }
function setFontSize(v){ localStorage.setItem('uc_fontsize',v); renderSetSection('theme'); }
function setMenuPos(v){ localStorage.setItem('uc_menupos',v); renderSetSection('theme'); }

/* ─── 섹션 4: ✍️ 글쓰기 기본값 ─── */
function renderSetWrite(){
  const tone = localStorage.getItem('uc_def_tone')||'pro';
  const len  = localStorage.getItem('uc_def_len')||'mid';
  return `<div class="set-panel">
    <h3>✍️ 글쓰기 기본값</h3>
    <p class="hint">💡 "한 번 설정하면 매번 자동으로 적용돼요!"</p>

    <h4>🎭 기본 말투</h4>
    <div class="set-pill-row">
      <button class="set-pill ${tone==='friendly'?'on':''}" onclick="setDefTone('friendly')">😊 친근하게</button>
      <button class="set-pill ${tone==='pro'?'on':''}" onclick="setDefTone('pro')">💼 전문적으로</button>
      <button class="set-pill ${tone==='emo'?'on':''}" onclick="setDefTone('emo')">🌸 감성적으로</button>
      <button class="set-pill ${tone==='fun'?'on':''}" onclick="setDefTone('fun')">😄 재미있게</button>
    </div>

    <h4>📏 기본 길이</h4>
    <div class="set-pill-row">
      <button class="set-pill ${len==='short'?'on':''}" onclick="setDefLen('short')">짧게</button>
      <button class="set-pill ${len==='mid'?'on':''}" onclick="setDefLen('mid')">중간</button>
      <button class="set-pill ${len==='long'?'on':''}" onclick="setDefLen('long')">길게</button>
    </div>

    <h4>✅ 항상 포함할 것</h4>
    <label class="set-check"><input type="checkbox" onchange="localStorage.setItem('uc_inc_hash',this.checked?'1':'0')" ${localStorage.getItem('uc_inc_hash')==='1'?'checked':''}>#️⃣ 해시태그</label>
    <label class="set-check"><input type="checkbox" onchange="localStorage.setItem('uc_inc_emoji',this.checked?'1':'0')" ${localStorage.getItem('uc_inc_emoji')==='1'?'checked':''}>😊 이모지</label>
    <label class="set-check"><input type="checkbox" onchange="localStorage.setItem('uc_inc_en',this.checked?'1':'0')" ${localStorage.getItem('uc_inc_en')==='1'?'checked':''}>🇺🇸 영어 번역</label>
    <label class="set-check"><input type="checkbox" onchange="localStorage.setItem('uc_inc_br',this.checked?'1':'0')" ${localStorage.getItem('uc_inc_br')!=='0'?'checked':''}>↵ 줄바꿈</label>

    <h4>🚫 절대 쓰면 안 되는 단어</h4>
    <input class="set-in" id="set-banned" placeholder="쉼표로 구분. 예: 경쟁사이름, 민감한단어" value="${localStorage.getItem('uc_banned_words')||''}">
    <button class="set-btn" onclick="localStorage.setItem('uc_banned_words',document.getElementById('set-banned').value);alert('💾 저장됨')" style="margin-top:6px">💾 저장</button>
  </div>`;
}
function setDefTone(v){ localStorage.setItem('uc_def_tone',v); renderSetSection('write'); }
function setDefLen(v){ localStorage.setItem('uc_def_len',v); renderSetSection('write'); }

/* ─── 섹션 5: 🔒 보안 & 어린이 보호 ─── */
function renderSetLock(){
  const al = localStorage.getItem('uc_autolock')||'10';
  const kt = localStorage.getItem('uc_kids_timelimit')||'2h';
  const hist = localStorage.getItem('uc_hist_retention')||'month';
  return `<div class="set-panel">
    <h3>🔒 보안 & 어린이 보호</h3>
    <p class="hint">💡 "내 정보를 안전하게 지켜요"</p>

    <h4>🔐 내 정보 보호</h4>
    <label class="set-check"><input type="checkbox" onchange="if(this.checked){const p=prompt('비밀번호 4자리:');if(p&&p.length===4)localStorage.setItem('uc_app_lock',p);}else localStorage.removeItem('uc_app_lock')" ${localStorage.getItem('uc_app_lock')?'checked':''}>앱 잠금 비밀번호 사용</label>
    <label>자동 잠금</label>
    <div class="set-pill-row">
      <button class="set-pill ${al==='off'?'on':''}" onclick="localStorage.setItem('uc_autolock','off');renderSetSection('lock')">안 함</button>
      <button class="set-pill ${al==='10'?'on':''}" onclick="localStorage.setItem('uc_autolock','10');renderSetSection('lock')">10분 후</button>
      <button class="set-pill ${al==='30'?'on':''}" onclick="localStorage.setItem('uc_autolock','30');renderSetSection('lock')">30분 후</button>
    </div>
    <label class="set-check"><input type="checkbox" onchange="localStorage.setItem('uc_hide_key',this.checked?'1':'0')" ${localStorage.getItem('uc_hide_key')!=='0'?'checked':''}>🔐 API 키 별표로 숨기기</label>

    <h4>🧒 어린이 보호 설정</h4>
    <button class="set-btn" onclick="kParentMode()">🔒 어린이 모드 비밀번호 설정</button>
    <p class="hint" style="margin-top:10px">하루 사용 시간</p>
    <div class="set-pill-row">
      <button class="set-pill ${kt==='30m'?'on':''}" onclick="localStorage.setItem('uc_kids_timelimit','30m');renderSetSection('lock')">30분</button>
      <button class="set-pill ${kt==='1h'?'on':''}" onclick="localStorage.setItem('uc_kids_timelimit','1h');renderSetSection('lock')">1시간</button>
      <button class="set-pill ${kt==='2h'?'on':''}" onclick="localStorage.setItem('uc_kids_timelimit','2h');renderSetSection('lock')">2시간</button>
      <button class="set-pill ${kt==='off'?'on':''}" onclick="localStorage.setItem('uc_kids_timelimit','off');renderSetSection('lock')">제한 없음</button>
    </div>
    <p class="hint" style="margin-top:10px">허용 카테고리</p>
    ${['edu','kids','psy','smb','monetize','public','trans','shorts'].map(c=>{
      const cur = localStorage.getItem('uc_allow_'+c)!=='0';
      const label = {edu:'📚 학습/교육',kids:'🌈 어린이 모드',psy:'🔮 심리/운세 (숨기기)',smb:'🏪 소상공인',monetize:'💰 수익형',public:'🏛️ 공공기관',trans:'🌐 번역',shorts:'📱 자동숏츠'}[c];
      return `<label class="set-check"><input type="checkbox" ${cur?'checked':''} onchange="localStorage.setItem('uc_allow_${c}',this.checked?'1':'0')">${label}</label>`;
    }).join('')}

    <h4 style="margin-top:20px">💾 저장 & 백업</h4>
    <p class="hint">기록 보관 기간</p>
    <div class="set-pill-row">
      <button class="set-pill ${hist==='7d'?'on':''}" onclick="localStorage.setItem('uc_hist_retention','7d');renderSetSection('lock')">7일</button>
      <button class="set-pill ${hist==='month'?'on':''}" onclick="localStorage.setItem('uc_hist_retention','month');renderSetSection('lock')">한 달</button>
      <button class="set-pill ${hist==='3m'?'on':''}" onclick="localStorage.setItem('uc_hist_retention','3m');renderSetSection('lock')">3달</button>
      <button class="set-pill ${hist==='forever'?'on':''}" onclick="localStorage.setItem('uc_hist_retention','forever');renderSetSection('lock')">영원히</button>
    </div>
    <p class="hint" style="margin-top:10px">localStorage 용량</p>
    <div class="set-progress"><div id="set-storage-bar" style="width:0%"></div></div>
    <p class="hint" id="set-storage-text">계산 중...</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
      <button class="set-btn" onclick="exportSettings()">📥 내 설정 저장하기</button>
      <button class="set-btn ghost" onclick="importSettings()">📤 저장한 설정 불러오기</button>
    </div>

    <h4 style="margin-top:20px">⚠️ 초기화</h4>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button class="set-btn ghost" onclick="if(confirm('설정만 초기화할까요?')){Object.keys(localStorage).filter(k=>k.startsWith('uc_')&&!k.startsWith('uc_kids_')).forEach(k=>localStorage.removeItem(k));alert('✅ 초기화 완료');location.reload();}">설정만 초기화</button>
      <button class="set-btn danger" onclick="if(confirm('⚠️ 전체 데이터를 지울까요? 되돌릴 수 없어요!')){localStorage.clear();alert('✅ 전체 초기화');location.reload();}">전체 초기화</button>
    </div>
  </div>`;
}
function exportSettings(){
  const data = {};
  Object.keys(localStorage).filter(k=>k.startsWith('uc_')||k.startsWith('cost_')).forEach(k=>data[k]=localStorage.getItem(k));
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'uc_settings_'+Date.now()+'.json'; a.click();
  URL.revokeObjectURL(a.href);
}
function importSettings(){
  const f = document.createElement('input'); f.type = 'file'; f.accept = '.json';
  f.onchange = e => {
    const r = new FileReader();
    r.onload = () => {
      try{
        const data = JSON.parse(r.result);
        Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
        alert('✅ 불러오기 완료'); location.reload();
      }catch(err){ alert('❌ 파일 오류: '+err.message); }
    };
    r.readAsText(e.target.files[0]);
  };
  f.click();
}

/* ─── 섹션 6: 📊 현황 ─── */
function renderSetStats(){
  const m = CostTracker.getMonth();
  const features = m.byFeature||{};
  const sorted = Object.entries(features).sort((a,b)=>b[1].count-a[1].count);
  const medals = ['🥇','🥈','🥉'];
  const savedMinutes = (m.count||0) * 30;
  const savedMoney   = (m.count||0) * 50000;

  return `<div class="set-panel">
    <h3>📊 내 사용 통계</h3>
    <p class="hint">💡 "이번달 얼마나 썼고, 얼마나 절약했는지 봐요!"</p>

    <div class="set-budget-box">
      <h4>✨ 이번달 만든 것들</h4>
      <p style="font-size:16px;line-height:2">
        총 생성: <b>${m.count||0}개</b><br>
        💰 AI 비용: 약 <b>${Math.round(m.total).toLocaleString()}원</b>
      </p>
    </div>

    <h4>🏆 가장 많이 쓴 기능 TOP 3</h4>
    ${sorted.slice(0,3).map(([id, v], i) => `<p style="font-size:14px;padding:8px 12px;background:#fff5fa;border-radius:10px;margin:4px 0">${medals[i]} ${id}: ${v.count}회 (약 ${Math.round(v.krw).toLocaleString()}원)</p>`).join('') || '<p class="hint">아직 사용 기록이 없어요. 한번 써보세요! ✨</p>'}

    <h4>💎 절약 현황</h4>
    <div class="set-budget-box" style="background:linear-gradient(135deg,#effbf7,#fff7ee);border-color:#c8ebd9">
      <p style="font-size:15px;line-height:2">
        ⏰ 이번달 절약한 시간: 약 <b>${Math.floor(savedMinutes/60)}시간 ${savedMinutes%60}분</b><br>
        💰 이번달 절약한 비용: 약 <b>${savedMoney.toLocaleString()}원</b>
        <small style="display:block;color:var(--sub);font-size:11px;margin-top:6px">※ 평균 1개당 30분 · 전문가 5만원 기준 추정</small>
      </p>
    </div>

    <h4 style="margin-top:20px">📱 앱 정보</h4>
    <div class="set-key-card">
      <p><b>현재 버전:</b> v1.0.0</p>
      <p><b>내 플랜:</b> 🌟 소상공인 패키지 이용중 (예시)</p>
      <p><b>만료일:</b> 30일 후 (예시)</p>
      <button class="set-btn" style="margin-top:6px">다른 패키지로 바꾸기</button>
    </div>

    <h4>🆕 새로운 기능</h4>
    <p>🆕 감동스토리 롱폼 추가됨</p>
    <p>🆕 자동숏츠 8단계 파이프라인</p>
    <p>🆕 어린이 모드 (무지개 UI + 뱃지)</p>

    <h4>🔜 다음에 추가될 기능</h4>
    <p>🔜 유튜브 자동 업로드</p>
    <p>🔜 이미지 직접 생성</p>
    <p>🔜 모바일 앱 출시</p>

    <h4>💬 도움 & 지원</h4>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
      <button class="set-btn ghost" onclick="alert('💬 support@example.com')">💬 채팅 문의</button>
      <button class="set-btn ghost" onclick="alert('📧 support@example.com')">📧 이메일</button>
      <button class="set-btn ghost" onclick="alert('📹 youtube.com')">📹 유튜브 강의</button>
      <button class="set-btn ghost" onclick="alert('💡 새 기능 제안 감사해요!')">💡 기능 제안</button>
      <button class="set-btn ghost" onclick="alert('🐛 버그 신고 감사해요!')">🐛 버그 신고</button>
      <button class="set-btn ghost" onclick="alert('⭐ 후기 감사해요!')">⭐ 후기</button>
    </div>
  </div>`;
}

/* ─── setting 모드: renderGrid에서 토글 ─── */
(function hookSettingMode(){
  const origRender = window.renderGrid;
  window.renderGrid = function(){
    const stage = document.getElementById('settingStage');
    if (state.mode === 'setting') {
      ['monetizeDetail','publicDetail','eduDetail','transDetail','smbDetail','psyDetail','shortsDetail','kidsDetail','kidsStage','guideStage','libraryDetail','trendDetail','abDetail','shareDetail','aboutStage','qnaStage','intentStage'].forEach(id=>document.getElementById(id)?.classList.add('hide'));
      document.body.classList.remove('kids-mode');
      const hero = document.querySelector('.hero'); if (hero) hero.style.display='none';
      const grid = document.getElementById('grid'); if (grid) grid.style.display='none';
      const s = stage || createSettingStage();
      s.classList.remove('hide');
      renderSettings();
      return;
    } else if (stage) {
      stage.classList.add('hide');
    }
    origRender();
  };
})();

// 초기 비용 바 갱신
setTimeout(updateCostBar, 200);
