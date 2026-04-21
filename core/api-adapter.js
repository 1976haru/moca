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

  /* ─── 통합 호출 (자동 라우팅) ─── */
  async function callAI(system, user, opts){
    const provider = (opts && opts.provider) || getProvider();
    try{
      if(provider === 'claude') return await callClaude(system, user, opts);
      if(provider === 'openai') return await callOpenAI(system, user, opts);
      if(provider === 'gemini') return await callGemini(system, user, opts);
      throw new Error('알 수 없는 제공자: '+provider);
    }catch(err){
      const friendly = humanError(err, provider);
      const wrapped = new Error(friendly);
      wrapped.raw = err;
      wrapped.provider = provider;
      throw wrapped;
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
     - container 인자 (CSS 선택자 또는 Element). 미지정 시
       <div id="ai-bar"> 를 <body> 최상단에 자동 삽입.
     - 설정 탭에서 저장된 기본 공급자를 자동 선택.
     - 버튼 클릭 시 setProvider(p) 저장. 키 미연결이면 안내 토스트.
     - 설정 페이지 경로(settingsUrl)는 options 로 오버라이드 가능. */
  const AI_NAMES = { claude:'🟣 Claude', openai:'🟢 ChatGPT', gemini:'🔵 Gemini' };
  const AI_SETTINGS_HASH = { claude:'#claude', openai:'#openai', gemini:'#gemini' };

  function mountAiBar(container, options){
    if(typeof document === 'undefined') return null;
    options = options || {};
    const settingsUrl = options.settingsUrl || '../../index.html?set=ai';
    const hint = options.hint || '← 설정의 기본값 자동 적용 / 클릭으로 변경';

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
    host.innerHTML = `
      <span class="ai-bar-label">AI:</span>
      <button type="button" data-ai="claude">🟣 Claude</button>
      <button type="button" data-ai="openai">🟢 ChatGPT</button>
      <button type="button" data-ai="gemini">🔵 Gemini</button>
      <span class="ai-bar-hint">${hint}</span>
    `;

    const refresh = () => {
      const cur = getProvider();
      host.querySelectorAll('button[data-ai]').forEach(btn => {
        const p = btn.getAttribute('data-ai');
        btn.classList.remove('on-claude','on-openai','on-gemini');
        if(p === cur) btn.classList.add('on-' + p);
        btn.textContent = (p === cur ? '✓ ' : '') + AI_NAMES[p].replace(/^[^\s]+\s/, (m)=>m);
        // Keep icon+label form
        btn.textContent = (p === cur ? AI_NAMES[p] + ' ✓' : AI_NAMES[p]);
      });
    };

    host.querySelectorAll('button[data-ai]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-ai');
        if(!hasApiKey(p)){
          const friendly = { claude:'Claude', openai:'ChatGPT', gemini:'Gemini' }[p];
          _aiBarToast('🔑 설정에서 [' + friendly + '] 키를 먼저 입력해주세요!',
            settingsUrl + AI_SETTINGS_HASH[p]);
          return;
        }
        try{ setProvider(p); }catch(_){ return; }
        refresh();
      });
    });

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
    callForFeature,
    callClaude,
    callOpenAI,
    callGemini,
    generateBilingual,

    // UI
    mountAiBar,

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
