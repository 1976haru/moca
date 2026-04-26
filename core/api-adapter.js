/* ============================================================
   통합 콘텐츠 생성기 · API 어댑터
   - Claude / OpenAI / Gemini 통합 호출
   - AI_PROVIDER 전역 상태 기반 자동 라우팅
   - API 키 localStorage 관리
   - 한국어 + 일본어 동시 생성
   - 오류 메시지 한국어 안내
   ============================================================ */

(function(global){
  'use strict';

  /* ─── 레거시 키 1회 마이그레이션 ───────────────────────
     과거 스크립트 엔진이 'api_key_v10', 'v10_key', 'v30_openai_key',
     'v30_gemini_key' 에 저장한 값을 통일 키로 옮기고 원본은 삭제.
     새 키에 이미 값이 있으면 건너뜀. 모든 엔진에서 한 번만 실행. */
  (function migrateLegacyKeys(){
    if(typeof localStorage === 'undefined') return;
    if(localStorage.getItem('uc_key_migrated_v1') === '1') return;
    const map = {
      'api_key_v10':   'uc_claude_key',
      'v10_key':       'uc_claude_key',
      'v30_openai_key':'uc_openai_key',
      'v30_gemini_key':'uc_gemini_key'
    };
    Object.keys(map).forEach(oldK => {
      const val = localStorage.getItem(oldK);
      const newK = map[oldK];
      if(val && !localStorage.getItem(newK)) localStorage.setItem(newK, val);
      if(val) localStorage.removeItem(oldK);
    });
    localStorage.setItem('uc_key_migrated_v1','1');
  })();

  /* ─── 상수 ─── */
  const STORAGE_KEYS = {
    provider:    'uc_ai_provider',
    claude:      'uc_claude_key',
    openai:      'uc_openai_key',
    gemini:      'uc_gemini_key',
    minimax:     'uc_minimax_key',
    openaiModel: 'uc_openai_model',
    geminiModel: 'uc_gemini_model',
    minimaxModel:'uc_minimax_model'
  };

  const DEFAULTS = {
    provider:    'claude',
    claudeModel: 'claude-sonnet-4-5',
    openaiModel: 'gpt-4o',
    geminiModel: 'gemini-2.0-flash',
    maxTokens:   3500
  };

  // 구 모델명 → 신 모델명 매핑 (기존 localStorage 호환)
  const MODEL_ALIASES = {
    'claude-sonnet-4-20250514': 'claude-sonnet-4-5'
  };

  const ENDPOINTS = {
    claude: 'https://api.anthropic.com/v1/messages',
    openai: 'https://api.openai.com/v1/chat/completions',
    gemini: (model, key) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
  };

  /* ─── 상태 관리 ─── */
  function getProvider(){
    return localStorage.getItem(STORAGE_KEYS.provider) || DEFAULTS.provider;
  }
  function setProvider(p){
    if(!['claude','openai','gemini'].includes(p)){
      throw new Error('지원하지 않는 AI 제공자입니다: ' + p);
    }
    localStorage.setItem(STORAGE_KEYS.provider, p);
  }

  /* ─── API 키 관리 ─── */
  function getApiKey(provider){
    const p = provider || getProvider();
    /* 1순위: 통합 store (ucGetApiKey 가 있으면 그것이 통합 store 우선) */
    if (typeof window.ucGetApiKey === 'function') {
      var v = window.ucGetApiKey(p);
      if (v && v.length > 4) return v.trim();
    }
    /* 2순위: legacy uc_*_key 직접 읽기 (fallback) */
    const key = localStorage.getItem(STORAGE_KEYS[p]) || '';
    return key.trim();
  }
  function setApiKey(provider, key){
    if(!STORAGE_KEYS[provider]) throw new Error('알 수 없는 제공자: '+provider);
    localStorage.setItem(STORAGE_KEYS[provider], (key||'').trim());
  }
  function clearApiKey(provider){
    localStorage.removeItem(STORAGE_KEYS[provider]);
  }
  function hasApiKey(provider){
    return !!getApiKey(provider);
  }

  /* ─── 모델 선택 ─── */
  function resolveModel(m){ return MODEL_ALIASES[m] || m; }
  function getModel(provider){
    const p = provider || getProvider();
    if(p === 'claude') return DEFAULTS.claudeModel;
    if(p === 'openai') return localStorage.getItem(STORAGE_KEYS.openaiModel) || DEFAULTS.openaiModel;
    if(p === 'gemini') return localStorage.getItem(STORAGE_KEYS.geminiModel) || DEFAULTS.geminiModel;
    return '';
  }
  function setModel(provider, model){
    if(provider === 'openai') localStorage.setItem(STORAGE_KEYS.openaiModel, model);
    else if(provider === 'gemini') localStorage.setItem(STORAGE_KEYS.geminiModel, model);
  }

  /* ─── 공통 유틸 ─── */
  function isAsciiOnly(s){ return /^[\x00-\x7F]*$/.test(s||''); }

  function humanError(err, provider){
    const msg = (err && err.message) ? String(err.message) : String(err||'');
    const p = provider || getProvider();
    const name = {claude:'Claude', openai:'OpenAI', gemini:'Gemini'}[p] || p;

    if(/api key|api_key|unauthorized|401/i.test(msg))
      return `❌ ${name} API 키가 유효하지 않습니다. 키를 다시 확인하고 저장해주세요.`;
    if(/quota|billing|insufficient|429/i.test(msg))
      return `❌ ${name} API 사용 한도를 초과했거나 결제 설정이 필요합니다.`;
    if(/model.*not.*found|does not exist|404/i.test(msg))
      return `❌ ${name} 모델을 찾을 수 없습니다. 설정 탭에서 모델을 확인해주세요.`;
    if(/cors|network|failed to fetch|timeout/i.test(msg))
      return `❌ 네트워크 오류가 발생했습니다. 인터넷 연결과 브라우저 CORS 설정을 확인해주세요. (${name})`;
    if(/safety|blocked|content.*polic/i.test(msg))
      return `❌ ${name}의 안전 필터에 의해 응답이 차단되었습니다. 프롬프트를 조정해보세요.`;
    if(/rate.*limit/i.test(msg))
      return `❌ ${name} 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.`;

    return `❌ ${name} 호출 중 오류가 발생했습니다: ${msg}`;
  }

  /* ─── Claude ─── */
  async function callClaude(system, user, opts){
    opts = opts || {};
    const key = getApiKey('claude');
    if(!key) throw new Error('Claude API 키가 저장되어 있지 않습니다.');
    if(!isAsciiOnly(key)) throw new Error('Claude API 키에 비ASCII 문자가 포함되어 있습니다.');

    const res = await fetch(ENDPOINTS.claude, {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key':key,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({
        model: resolveModel(opts.model || DEFAULTS.claudeModel),
        max_tokens: opts.maxTokens || DEFAULTS.maxTokens,
        system: system || '',
        messages:[{role:'user', content:user || ''}]
      })
    });
    const data = await res.json();
    if(!res.ok || data.error){
      throw new Error((data.error && data.error.message) || ('HTTP '+res.status));
    }
    return (data.content||[])
      .filter(x => x.type === 'text')
      .map(x => x.text)
      .join('\n')
      .trim();
  }

  /* ─── OpenAI ─── */
  async function callOpenAI(system, user, opts){
    opts = opts || {};
    const key = getApiKey('openai');
    if(!key) throw new Error('OpenAI API 키가 저장되어 있지 않습니다.');

    const res = await fetch(ENDPOINTS.openai, {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+key
      },
      body:JSON.stringify({
        model: opts.model || getModel('openai'),
        max_tokens: opts.maxTokens || DEFAULTS.maxTokens,
        messages:[
          {role:'system', content: system||''},
          {role:'user',   content: user  ||''}
        ]
      })
    });
    const data = await res.json();
    if(!res.ok || data.error){
      throw new Error((data.error && data.error.message) || ('HTTP '+res.status));
    }
    return ((data.choices||[])[0]?.message?.content || '').trim();
  }

  /* ─── Gemini ─── */
  async function callGemini(system, user, opts){
    opts = opts || {};
    const key = getApiKey('gemini');
    if(!key) throw new Error('Gemini API 키가 저장되어 있지 않습니다.');

    const model = opts.model || getModel('gemini');
    const url = ENDPOINTS.gemini(model, key);

    const body = {
      contents:[{
        role:'user',
        parts:[{text: (system ? system+'\n\n' : '') + (user||'')}]
      }],
      generationConfig:{
        maxOutputTokens: opts.maxTokens || DEFAULTS.maxTokens
      }
    };

    const res = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
    const data = await res.json();
    if(!res.ok || data.error){
      throw new Error((data.error && data.error.message) || ('HTTP '+res.status));
    }
    const parts = data.candidates?.[0]?.content?.parts || [];
    return parts.map(p => p.text || '').join('\n').trim();
  }

  /* ─── 오류 분류 · 연결 상태 · 폴백 저장소 ──────────────────
     401/403: 키 없음/만료 · 402: 크레딧 부족 · 429: 요청 초과
     5xx: 서버 오류 · network: 연결 실패 */
  const FALLBACK_ORDER_KEY   = 'uc_fallback_order';
  const FALLBACK_ENABLED_KEY = 'uc_fallback_enabled';
  const FALLBACK_HISTORY_KEY = 'uc_fallback_history';
  const CONN_STATUS_KEY      = 'uc_connection_status';
  const ALL_PROVIDERS        = ['claude','openai','gemini','minimax'];

  function getFallbackOrder(){
    try{ const s = JSON.parse(localStorage.getItem(FALLBACK_ORDER_KEY)||'null');
      if(Array.isArray(s) && s.length) return s.filter(p => ALL_PROVIDERS.includes(p));
    }catch(_){}
    return ['claude','openai','gemini','minimax'];
  }
  function setFallbackOrder(order){
    if(!Array.isArray(order)) return;
    localStorage.setItem(FALLBACK_ORDER_KEY, JSON.stringify(order.filter(p => ALL_PROVIDERS.includes(p))));
  }
  function isFallbackEnabled(){ return localStorage.getItem(FALLBACK_ENABLED_KEY) !== '0'; }
  function setFallbackEnabled(b){ localStorage.setItem(FALLBACK_ENABLED_KEY, b ? '1' : '0'); }

  function classifyError(err){
    const msg = ((err && (err.message || err.toString())) || '').toLowerCase();
    if(/401|403|unauthorized|invalid[_ -]?api|api[_ -]?key/i.test(msg)) return {kind:'auth',   friendly:'API 키가 없거나 만료됐어요'};
    if(/402|credit|balance|insufficient|billing/i.test(msg))           return {kind:'credit', friendly:'크레딧이 부족해요'};
    if(/429|rate[_ -]?limit|too[_ -]?many/i.test(msg))                 return {kind:'rate',   friendly:'요청 한도를 초과했어요'};
    if(/\b5\d\d\b|server error|internal/i.test(msg))                   return {kind:'server', friendly:'서버에 문제가 있어요'};
    if(/network|fetch|timeout|cors|failed to fetch/i.test(msg))        return {kind:'network',friendly:'연결할 수 없어요'};
    return {kind:'unknown', friendly: (err && err.message) ? err.message.slice(0,140) : '알 수 없는 오류'};
  }

  function _getConnStatus(){
    try{ return JSON.parse(localStorage.getItem(CONN_STATUS_KEY) || '{}'); }catch(_){ return {}; }
  }
  function _setConnStatus(provider, state, info){
    const all = _getConnStatus();
    all[provider] = { state, info: info||null, at: Date.now() };
    try{ localStorage.setItem(CONN_STATUS_KEY, JSON.stringify(all)); }catch(_){}
    _dispatchStatusChange();
  }
  function getConnectionStatus(provider){
    const all = _getConnStatus();
    if(provider) return all[provider] || null;
    return all;
  }
  function _dispatchStatusChange(){
    try{ window.dispatchEvent(new CustomEvent('uc-ai-status-change')); }catch(_){}
  }

  function _logFallback(fromP, toP, klass){
    try{
      const list = JSON.parse(localStorage.getItem(FALLBACK_HISTORY_KEY) || '[]');
      list.unshift({ from: fromP, to: toP, reason: klass && klass.kind, at: Date.now() });
      localStorage.setItem(FALLBACK_HISTORY_KEY, JSON.stringify(list.slice(0,50)));
    }catch(_){}
  }

  const PROVIDER_COLOR = {
    claude:'#6030C0', openai:'#228B22', gemini:'#1565C0', minimax:'#D93644'
  };
  const PROVIDER_NAME = { claude:'Claude', openai:'ChatGPT', gemini:'Gemini', minimax:'MiniMax' };

  function _emitFallbackToast(from, to, klass){
    if(typeof document === 'undefined') return;
    let t = document.getElementById('ai-bar-toast');
    if(!t){
      t = document.createElement('div');
      t.id = 'ai-bar-toast';
      t.className = 'ai-bar-toast';
      document.body.appendChild(t);
    }
    const fromLbl = PROVIDER_NAME[from] || from;
    const toLbl   = PROVIDER_NAME[to] || to;
    const reason  = (klass && klass.friendly) || '오류';
    t.style.background = 'linear-gradient(135deg,' + (PROVIDER_COLOR[to]||'#2b2430') + ',#2b2430)';
    t.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px">' +
        '<div>⚠️ <b>' + fromLbl + '</b> ' + reason +
        '<br>→ <b>' + toLbl + '</b> 로 자동 전환했어요!<br>' +
        '<span style="font-size:11px;opacity:.8">결과는 동일하게 나와요 😊</span></div>' +
        '<button onclick="this.parentElement.parentElement.classList.remove(\'show\')" style="background:transparent;border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:8px;padding:4px 10px;cursor:pointer">닫기</button>' +
      '</div>';
    t.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => t.classList.remove('show'), 4200);
  }

  function _emitErrorToast(msg){
    if(typeof document === 'undefined') return;
    let t = document.getElementById('ai-bar-toast');
    if(!t){
      t = document.createElement('div');
      t.id = 'ai-bar-toast';
      t.className = 'ai-bar-toast';
      document.body.appendChild(t);
    }
    t.style.background = '#2b2430';
    t.innerHTML = msg;
    t.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => t.classList.remove('show'), 4500);
  }

  /* ─── 통합 호출 (자동 라우팅) ─── */
  async function callAI(system, user, opts){
    const provider = (opts && opts.provider) || getProvider();
    try{
      let result;
      if(provider === 'claude')       result = await callClaude(system, user, opts);
      else if(provider === 'openai')  result = await callOpenAI(system, user, opts);
      else if(provider === 'gemini')  result = await callGemini(system, user, opts);
      else if(provider === 'minimax') result = await callMinimax(system, user, opts);
      else throw new Error('알 수 없는 제공자: '+provider);
      _setConnStatus(provider, 'ok');
      return result;
    }catch(err){
      const klass = classifyError(err);
      _setConnStatus(provider, 'error', { kind: klass.kind, message: err.message });
      const friendly = humanError(err, provider);
      const wrapped = new Error(friendly);
      wrapped.raw = err;
      wrapped.provider = provider;
      wrapped.kind = klass.kind;
      throw wrapped;
    }
  }

  /* ─── MiniMax 호출 (chat/completions v2 호환) ─── */
  async function callMinimax(system, user, opts){
    opts = opts || {};
    const key = getApiKey('minimax');
    if(!key) throw new Error('MiniMax API 키가 저장되어 있지 않습니다.');
    const model = opts.model || (localStorage.getItem(STORAGE_KEYS.minimaxModel) || 'abab6.5s-chat');
    const res = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+key },
      body: JSON.stringify({
        model,
        messages:[
          { role:'system', content: system||'' },
          { role:'user',   content: user||'' }
        ],
        max_tokens: opts.maxTokens || DEFAULTS.maxTokens
      })
    });
    const data = await res.json();
    if(!res.ok || data.error) throw new Error((data.error && (data.error.message||data.error)) || ('HTTP '+res.status));
    return (data.choices?.[0]?.message?.content || '').trim();
  }

  /* ─── 폴백 호출: 오류 시 다음 공급자로 자동 전환 ──────────
     순서: (선택/기본 공급자) → FallbackOrder 의 나머지
     키 없는 공급자는 건너뜀. 서버 오류(5xx)는 1회 재시도 후 다음으로.
     전환 시 토스트 알림. 모두 실패하면 최종 에러. */
  async function callWithFallback(system, user, opts){
    opts = opts || {};
    const primary = opts.provider || getProvider();
    const order = [primary].concat(getFallbackOrder().filter(p => p !== primary));
    const available = order.filter(p => hasApiKey(p));
    if(!available.length){
      _emitErrorToast('❌ 사용 가능한 AI가 없어요.<br>설정 탭에서 API 키를 입력해주세요');
      throw new Error('사용 가능한 AI가 없어요. 설정에서 API 키를 하나 이상 입력해주세요.');
    }
    let lastErr = null, lastKlass = null;
    for(let i=0; i<available.length; i++){
      const p = available[i];
      try{
        const result = await callAI(system, user, Object.assign({}, opts, { provider: p }));
        if(i > 0){
          _logFallback(available[0], p, lastKlass);
          _emitFallbackToast(available[0], p, lastKlass);
        }
        return result;
      }catch(err){
        lastErr = err;
        lastKlass = classifyError(err);
        if(!isFallbackEnabled()){ throw err; }
        // 서버 오류는 한 번만 재시도
        if(lastKlass.kind === 'server'){
          try{
            await new Promise(r => setTimeout(r, 800));
            const retry = await callAI(system, user, Object.assign({}, opts, { provider: p }));
            if(i > 0){ _logFallback(available[0], p, lastKlass); _emitFallbackToast(available[0], p, lastKlass); }
            return retry;
          }catch(err2){ lastErr = err2; lastKlass = classifyError(err2); }
        }
        // 다음 공급자로 계속
      }
    }
    _emitErrorToast('❌ 모든 AI 호출이 실패했어요 · 설정에서 확인해주세요');
    const finalErr = new Error('모든 AI 호출 실패 — ' + (lastKlass ? lastKlass.friendly : (lastErr && lastErr.message)));
    finalErr.raw = lastErr;
    finalErr.kind = lastKlass && lastKlass.kind;
    throw finalErr;
  }

  /* ─── 연결 테스트 ─── */
  async function testConnection(provider){
    if(!hasApiKey(provider)) return { ok:false, kind:'auth', message:'키가 없어요' };
    try{
      const r = await callAI('한 단어만 출력해. 정확히 "pong"', 'ping', { provider, maxTokens: 8 });
      _setConnStatus(provider, 'ok');
      return { ok:true, message:'정상 작동합니다', response: (r||'').slice(0,40) };
    }catch(err){
      const klass = classifyError(err);
      _setConnStatus(provider, 'error', { kind: klass.kind, message: err.message });
      return { ok:false, kind:klass.kind, message: klass.friendly };
    }
  }

  /* ─── 기능별 최적 AI 자동 선택 호출 ───────────────────────
     ProviderConfig.getFeatureDefault('text', feature) 로 조회한
     {provider, model} 을 자동 적용해서 callAI 를 돌립니다.
     예) callForFeature('script', system, user, {maxTokens:3500})
     기능 키가 없거나 ProviderConfig 미로드 시 현재 getProvider() 로 폴백. */
  async function callForFeature(feature, system, user, opts){
    opts = opts || {};
    let provider = opts.provider;
    let model    = opts.model;
    try{
      const PC = (typeof ProviderConfig !== 'undefined') ? ProviderConfig : null;
      const cfg = PC && PC.getFeatureDefault ? PC.getFeatureDefault('text', feature) : null;
      if(cfg){
        provider = provider || cfg.provider;
        model    = model    || cfg.model;
      }
    }catch(_){}
    return callAI(system, user, Object.assign({}, opts, {
      provider: provider || getProvider(),
      model:    model    || getModel(provider),
      featureId: opts.featureId || feature
    }));
  }

  /* ─── 한국어 + 일본어 동시 생성 ─── */
  async function generateBilingual(baseSystem, userPrompt, opts){
    opts = opts || {};
    const maxTokens = opts.maxTokens || DEFAULTS.maxTokens;

    const systemKO = (baseSystem||'') +
      '\n\n[언어 지시] 아래 요청에 대해 반드시 한국어로만 답변하세요. ' +
      '한국어 독자에게 자연스러운 표현과 어휘를 사용하세요.';

    const systemJP = (baseSystem||'') +
      '\n\n[言語指示] 以下のリクエストに対して必ず日本語のみで回答してください。' +
      '日本の読者に自然な表現と語彙を使用してください。';

    const [ko, jp] = await Promise.allSettled([
      callAI(systemKO, userPrompt, {...opts, maxTokens}),
      callAI(systemJP, userPrompt, {...opts, maxTokens})
    ]);

    return {
      ko: ko.status === 'fulfilled' ? ko.value : null,
      jp: jp.status === 'fulfilled' ? jp.value : null,
      errors:{
        ko: ko.status === 'rejected' ? ko.reason.message : null,
        jp: jp.status === 'rejected' ? jp.reason.message : null
      },
      ok: ko.status === 'fulfilled' && jp.status === 'fulfilled'
    };
  }

  /* ─── 공통 AI 선택바 (engines/* 상단) ───────────────────
     버튼에 실시간 상태 점(🟢🟡🔴)을 같이 그리고, storage/status 이벤트
     발생 시 자동 갱신. 툴팁은 title 속성 사용.
     - 🟢 연결됨 (최근 OK) · 🟡 키는 있으나 확인 안 됨 · 🔴 키 없음/오류 */
  const AI_NAMES = { claude:'🟣 Claude', openai:'🟢 ChatGPT', gemini:'🔵 Gemini', minimax:'🔴 MiniMax' };
  const AI_SETTINGS_HASH = { claude:'#claude', openai:'#openai', gemini:'#gemini', minimax:'#minimax' };

  function _providerDot(p){
    if(!hasApiKey(p)) return '🔴';
    const st = _getConnStatus()[p];
    if(st && st.state === 'error') return '🔴';
    if(st && st.state === 'ok')    return '🟢';
    return '🟡'; // 키는 있으나 확인 전
  }
  function _providerTooltip(p){
    const name = PROVIDER_NAME[p] || p;
    if(!hasApiKey(p)) return name + ': API 키 없음 — 설정 탭에서 입력하세요';
    const st = _getConnStatus()[p];
    if(st && st.state === 'ok')    return name + ': 연결됨 ✅';
    if(st && st.state === 'error') return name + ': 오류 — ' + ((st.info && st.info.kind) || '알 수 없음');
    return name + ': 키 있음 (연결 미확인)';
  }

  function mountAiBar(container, options){
    if(typeof document === 'undefined') return null;
    options = options || {};
    const settingsUrl = options.settingsUrl || '../../index.html?set=ai';
    const hint = options.hint || '← 통합설정의 키 자동 적용 · 클릭으로 변경';
    const providers = options.providers || ['claude','openai','gemini'];

    let host = null;
    if(typeof container === 'string') host = document.querySelector(container);
    else if(container && container.nodeType === 1) host = container;

    if(!host){
      host = document.getElementById('ai-bar-auto');
      if(!host){
        host = document.createElement('div');
        host.id = 'ai-bar-auto';
        document.body.insertBefore(host, document.body.firstChild);
      }
    }
    host.classList.add('ai-bar');
    host.innerHTML =
      '<span class="ai-bar-label">🤖 사용할 AI</span>' +
      providers.map(p => '<button type="button" data-ai="' + p + '" title=""></button>').join('') +
      '<span class="ai-bar-hint">' + hint + '</span>';

    const refresh = () => {
      const cur = getProvider();
      host.querySelectorAll('button[data-ai]').forEach(btn => {
        const p = btn.getAttribute('data-ai');
        btn.classList.remove('on-claude','on-openai','on-gemini','on-minimax');
        if(p === cur) btn.classList.add('on-' + p);
        const dot = _providerDot(p);
        const label = AI_NAMES[p] || p;
        btn.innerHTML = label + (p === cur ? ' ✓' : '') + ' <span class="ai-dot" aria-hidden="true">' + dot + '</span>';
        btn.title = _providerTooltip(p);
      });
    };

    host.querySelectorAll('button[data-ai]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-ai');
        if(!hasApiKey(p)){
          _aiBarToast('🔑 설정에서 [' + (PROVIDER_NAME[p]||p) + '] 키를 먼저 입력해주세요!',
            settingsUrl + AI_SETTINGS_HASH[p]);
          return;
        }
        try{ setProvider(p); }catch(_){ return; }
        refresh();
      });
    });

    // 다른 탭/설정탭에서 키 변경·상태 변경 시 자동 갱신
    window.addEventListener('storage', (e) => {
      if(!e.key) return;
      if(/^uc_(claude|openai|gemini|minimax)_key$/.test(e.key) || e.key === CONN_STATUS_KEY) refresh();
    });
    window.addEventListener('uc-ai-status-change', refresh);

    refresh();
    return { refresh, host };
  }

  let _toastTimer = null;
  function _aiBarToast(msg, href){
    if(typeof document === 'undefined') return;
    let t = document.getElementById('ai-bar-toast');
    if(!t){
      t = document.createElement('div');
      t.id = 'ai-bar-toast';
      t.className = 'ai-bar-toast';
      document.body.appendChild(t);
    }
    t.style.background = '#2b2430';
    t.innerHTML = (msg||'') + (href ? ' <a href="'+href+'">설정으로 이동 →</a>' : '');
    t.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => t.classList.remove('show'), 4200);
  }

  /* ─── 외부 노출 ─── */
  const API = {
    // 상태
    getProvider, setProvider,
    getApiKey,   setApiKey,   clearApiKey, hasApiKey,
    getModel,    setModel,

    // 호출
    callAI,
    callWithFallback,
    callForFeature,
    callClaude,
    callOpenAI,
    callGemini,
    callMinimax,
    generateBilingual,

    // 폴백 / 상태
    classifyError,
    testConnection,
    getConnectionStatus,
    getFallbackOrder, setFallbackOrder,
    isFallbackEnabled, setFallbackEnabled,

    // UI
    mountAiBar,
    // 이미지 생성 헬퍼 (브라우저에서 window.generateImagesForText 사용 권장)
    generateImagesForText: async function(text, style, apiKey, count){
      if(typeof window !== 'undefined' && typeof window.generateImagesForText === 'function'){
        return window.generateImagesForText(text, style, 'general', count || 3);
      }
      return [];
    },

    // 유틸
    humanError,
    isAsciiOnly,

    // 상수 참조
    STORAGE_KEYS,
    DEFAULTS
  };

  global.APIAdapter = API;
  if(typeof module !== 'undefined' && module.exports) module.exports = API;

})(typeof window !== 'undefined' ? window : globalThis);
