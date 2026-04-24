/* ========================================================
   script-api.js  --  API 키 · AI 호출 · 연결 상태
   engines/script/index.html 에서 분리 (Phase 2 — API)
   의존: script-common.js (PARTNER_KEY, showKS 없음 — showKS는 여기)
   ======================================================== */

/* ─── BLOCK A: API 키 관리 + 상태 동기화 ─── */
function goToContent(){var path='';try{path=localStorage.getItem(PARTNER_KEY)||'';}catch(e){}if(!path){alert('콘텐츠생성기를 한 번 브라우저에서 열어주세요.');return;}location.href=path;}

// ─── API 키 ───
function sanitizeApiKey(raw){return String(raw||'').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/[""'']/g,'').replace(/\s+/g,'').trim();}
function isAsciiOnly(str){return /^[\x00-\x7F]+$/.test(str);}
// 통합설정에서 저장된 키 자동 불러오기 + 연결 상태 점 표시
function _ucDot(p){
  if(!localStorage.getItem('uc_'+p+'_key')) return '🔴';
  try{
    const st = (APIAdapter && APIAdapter.getConnectionStatus) ? APIAdapter.getConnectionStatus(p) : null;
    if(st && st.state === 'error') return '🔴';
    if(st && st.state === 'ok')    return '🟢';
  }catch(_){}
  return '🟡';
}
function _ucSyncAiBar(){
  ['claude','openai','gemini'].forEach(p => {
    const dot = document.getElementById('ai-dot-'+p);
    if(dot) dot.textContent = _ucDot(p);
    // hidden input (레거시 코드용)
    const inp = document.getElementById(p==='claude'?'apiKey':(p+'Key'));
    if(inp) inp.value = localStorage.getItem('uc_'+p+'_key') || '';
  });
  const anyKey = ['claude','openai','gemini'].some(p => localStorage.getItem('uc_'+p+'_key'));
  const warn = document.getElementById('api-no-key-warn');
  const label = document.getElementById('api-status-label');
  if(warn) warn.style.display = anyKey ? 'none' : '';
  if(label) label.textContent = anyKey ? '통합설정 키 자동 적용됨 ✅' : '키 없음';
}
(function(){ _ucSyncAiBar(); showKS('통합설정의 키 자동 적용', 'ok'); })();
window.addEventListener('storage', function(e){
  if(!e.key) return;
  if(/^uc_(claude|openai|gemini)_key$/.test(e.key) || e.key === 'uc_connection_status') _ucSyncAiBar();
});
window.addEventListener('uc-ai-status-change', _ucSyncAiBar);
function toggleApi(){ /* legacy no-op */ }
function saveKey(){ location.href = '../../index.html?set=ai'; }
function showKS(msg,cls){var el=document.getElementById('ks');el.textContent=msg;el.className='ks '+cls;if(cls==='ok')setTimeout(function(){el.textContent='';},4000);}

// 키 가져오기 (통합설정의 uc_*_key 에서 자동 읽기)
function getApiKey(provider){
  var p = provider || (typeof AI_PROVIDER !== 'undefined' ? AI_PROVIDER : 'claude');
  var keyMap = { claude:'uc_claude_key', openai:'uc_openai_key', gemini:'uc_gemini_key', minimax:'uc_minimax_key' };
  var raw = localStorage.getItem(keyMap[p] || 'uc_claude_key') || '';
  return sanitizeApiKey(raw);
}

// 키 누락 토스트 (alert 대체) — 우측 상단 · 설정 이동 버튼 포함
function apiKeyMissingToast(providerName){
  var name = providerName || '';
  var t = document.getElementById('api-miss-toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'api-miss-toast';
    t.style.cssText = 'position:fixed;right:16px;top:16px;z-index:9999;background:#2b2430;color:#fff;padding:12px 16px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.25);font-size:13px;font-weight:800;max-width:340px;opacity:0;transition:opacity .2s;display:flex;flex-direction:column;gap:8px';
    document.body.appendChild(t);
  }
  t.innerHTML = '⚠️ ' + (name ? name + ' ' : '') + 'API 키가 없어요.<br><span style="font-weight:600;font-size:12px;opacity:.85">설정에서 입력해주세요</span>' +
    '<a href="../../index.html?set=ai" style="display:inline-block;padding:7px 12px;background:var(--grad-main,linear-gradient(135deg,#ef6fab,#9181ff));color:#fff;border-radius:999px;font-weight:900;font-size:12px;text-decoration:none;text-align:center">⚙️ 설정으로 이동</a>';
  t.style.opacity = '1';
  clearTimeout(window._apiMissTimer);
  window._apiMissTimer = setTimeout(function(){ t.style.opacity='0'; }, 4500);
}


/* ─── BLOCK A: 공통 API 호출 (Claude) ─── */
// ════════════════════════════════════════
// 공통 API 호출
// ════════════════════════════════════════
async function callAPI(key,system,user,maxTokens){
  var res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:maxTokens||3500,system:system,messages:[{role:'user',content:user}]})});
  var d=await res.json();if(d.error)throw new Error(d.error.message);return d.content[0].text;
}


/* ─── BLOCK B: Multi-AI 선택 + Override + OpenAI/Gemini ─── */
// ── 전역 상태 ──
var AI_PROVIDER = 'claude';   // 'claude' | 'openai' | 'gemini'
var TRENDING_CONTEXT = '';    // 트렌딩/URL 분석 결과
var TRENDING_TYPE = '';       // 'url' | 'jp' | 'kr'

// ═══════════════════════════════════════
// 1. Multi-AI 선택 & callAPI 라우터
// ═══════════════════════════════════════

function selectAI(provider) {
  AI_PROVIDER = provider;
  ['claude','openai','gemini'].forEach(function(p) {
    var btn = document.getElementById('ai-' + p);
    if (!btn) return;
    btn.className = 'ai-sel-btn' + (p === provider
      ? (provider === 'openai' ? ' on-green' : provider === 'gemini' ? ' on-blue' : ' on')
      : '');
    var area = document.getElementById('ai-area-' + p);
    if (area) area.style.display = p === provider ? '' : 'none';
  });
  var label = document.getElementById('api-status-label');
  if (label) {
    var names = { claude: 'Claude', openai: 'OpenAI', gemini: 'Gemini' };
    label.textContent = '· ' + names[provider] + ' 선택됨';
  }
}

function saveOpenAIKey() { location.href = '../../index.html?set=ai'; }
function saveGeminiKey() { location.href = '../../index.html?set=ai'; }

// Load saved keys (통합설정 공유 키)
function _ucSyncKeyInputs() {
  var ck = localStorage.getItem('uc_claude_key');
  var ok = localStorage.getItem('uc_openai_key');
  var gk = localStorage.getItem('uc_gemini_key');
  if (ck) { var el0 = document.getElementById('apiKey');    if (el0) el0.value = ck; }
  if (ok) { var el  = document.getElementById('openaiKey'); if (el)  el.value  = ok; }
  if (gk) { var el2 = document.getElementById('geminiKey'); if (el2) el2.value = gk; }
}
(function loadSavedKeys() {
  _ucSyncKeyInputs();
  selectAI('claude'); // default
})();
// 다른 탭(통합설정)에서 키를 저장하면 실시간 반영
window.addEventListener('storage', function(e){
  if (e.key === 'uc_claude_key' || e.key === 'uc_openai_key' || e.key === 'uc_gemini_key') {
    _ucSyncKeyInputs();
  }
});

// Override callAPI with Multi-AI router
var _callAPIOrig = callAPI;
callAPI = async function(key, system, user, maxTokens) {
  if (AI_PROVIDER === 'openai') {
    return await callOpenAI(system, user, maxTokens);
  } else if (AI_PROVIDER === 'gemini') {
    return await callGemini(system, user, maxTokens);
  }
  return await _callAPIOrig(key, system, user, maxTokens);
};

// (getApiKey 는 상단의 통합 버전이 provider 인자를 이미 지원함 — 별도 override 불필요)

async function callOpenAI(system, user, maxTokens) {
  var key = localStorage.getItem('uc_openai_key') || document.getElementById('openaiKey').value.trim();
  if (!key) throw new Error('OpenAI API 키를 먼저 저장해주세요.');
  var model = document.getElementById('openai-model') ? document.getElementById('openai-model').value : 'gpt-4o';
  var res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model: model,
      max_tokens: maxTokens || 3500,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  });
  var d = await res.json();
  if (d.error) throw new Error(d.error.message);
  return d.choices[0].message.content;
}

async function callGemini(system, user, maxTokens) {
  var key = localStorage.getItem('uc_gemini_key') || document.getElementById('geminiKey').value.trim();
  if (!key) throw new Error('Gemini API 키를 먼저 저장해주세요.');
  var model = document.getElementById('gemini-model') ? document.getElementById('gemini-model').value : 'gemini-2.0-flash';
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key;
  var res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: maxTokens || 3500 }
    })
  });
  var d = await res.json();
  if (d.error) throw new Error(d.error.message);
  return d.candidates[0].content.parts[0].text;
}

