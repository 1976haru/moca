/* ========================================================
   script-refine.js  --  Intent·runRefine·shortsEmbed·UI Helpers·iframe
   engines/script/index.html block 2 끝부분에서 분리 (Phase 8 — refine)
   의존: core/intent-system.js (IntentSystem), script-api.js,
         script-senior.js (CHANNEL_KEY, applyChannel)
   4개 IIFE 포함: Intent / shortsEmbed / UI watchResult / iframe topbar 숨김
   ======================================================== */


/* ═══════════════════════════════════════════════
   ⚡ 빠른 생성 (Intent) — 스크립트 엔진용
   =============================================== */
(function(){
  const SAMPLES = [
    {k:'감사 편지', text:'엄마한테 감사 편지'},
    {k:'SNS 게시물', text:'카페 인스타 게시물'},
    {k:'유튜브 대본', text:'치매 예방하는 음식 TOP5 유튜브 대본'},
    {k:'보고서',     text:'법원 결정전조사 보고서'},
    {k:'블로그',     text:'50대 갱년기 극복 경험담 블로그 포스팅'},
    {k:'축사',       text:'친구 결혼식 축사'},
    {k:'숙제',       text:'초등학생 독후감 숙제'},
    {k:'번역',       text:'이 글을 일본어로 번역해줘:\n바쁘신 중에 도와주셔서 감사합니다.'}
  ];
  const st = { lastInput:'', lastResult:'' };
  const by = (id)=>document.getElementById(id);
  const esc = s=>String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const estMin = (n)=>Math.max(1, Math.round(n/320));

  function fillSamples(){
    const box = by('intentSampleBox');
    if(!box || box.dataset.ready) return;
    box.innerHTML = SAMPLES.map(s=>`<button onclick='intentPickSample(${JSON.stringify(s.text)})' style="padding:9px;border:1px solid #ead9e1;background:#fff;border-radius:10px;font-size:10.5px;font-weight:800;color:#5a4a56;cursor:pointer;text-align:left">${esc(s.k)}</button>`).join('');
    box.dataset.ready='1';
  }
  window.intentPickSample = function(t){ const i=by('intentInput'); if(i){ i.value=t; i.focus(); } const b=by('intentSampleBox'); if(b) b.style.display='none'; };

  window.intentRun = async function(){
    if(!window.IntentSystem){ alert('intent-system.js 로드가 필요해요.'); return; }
    const text = (by('intentInput').value||'').trim();
    if(!text){ alert('편하게 입력해주세요!'); return; }
    st.lastInput = text;
    const btn = by('intentGoBtn'); const s = by('intentStatus');
    btn.disabled = true; btn.textContent='⏳ 생성 중...';
    s.textContent = '입력 내용을 분석해 최적 프롬프트로 생성하고 있어요...';
    try{
      const r = await window.IntentSystem.runIntent(text, {maxTokens:2400, featureId:'intent-gen-script'});
      st.lastResult = r; show(r); s.textContent='';
    }catch(e){ s.textContent='❌ '+e.message; }
    finally{ btn.disabled=false; btn.textContent='☕ 생성하기'; }
  };

  function show(r){
    const box = by('intentResultBox'), out = by('intentResult'), meta = by('intentResultMeta');
    out.textContent = r;
    const ctx = (window.IntentSystem.detectContext(st.lastInput)||[]).map(x=>x.tag).slice(0,4).join(' · ') || '자동 감지';
    const p = window.IntentSystem.getActiveProfile();
    meta.textContent = `📏 ${r.length.toLocaleString()}자 · ⏱ 약 ${estMin(r.length)}분 · 🧭 ${ctx} · 👤 ${p.name||''}`;
    box.style.display = 'block';
    box.scrollIntoView({behavior:'smooth', block:'start'});
  }

  window.intentRefine = async function(kind){
    if(!st.lastResult){ alert('먼저 결과를 생성해주세요.'); return; }
    if(kind==='custom'){ by('intentRefineBox').style.display='block'; by('intentRefineInput').focus(); return; }
    const map = {
      rewrite:'같은 주제/맥락으로 완전히 다시 써주세요. 표현·예시·구조를 달리 하되 목적은 동일하게.',
      shorter:'기존 결과를 절반 정도 길이로 압축해주세요. 핵심만 남기고 군더더기는 제거.',
      longer: '기존 결과를 1.5~2배로 더 풍성하게 확장해주세요. 구체 예시·배경 설명 추가.'
    };
    const lenHint = kind==='shorter' ? '원본의 50% 길이' : kind==='longer' ? '원본의 150~200% 길이' : '';
    await runRefine(map[kind], lenHint);
  };
  window.intentApplyRefine = async function(){
    const v = (by('intentRefineInput').value||'').trim();
    if(!v){ alert('어떻게 바꿀지 적어주세요!'); return; }
    by('intentRefineBox').style.display='none';
    await runRefine(v, '');
  };
  async function runRefine(instr, lenHint){
    const s = by('intentStatus');
    s.textContent = '⏳ 수정 요청을 반영해 다시 쓰고 있어요...';
    try{
      const r = await window.IntentSystem.runIntent(st.lastInput, {
        baseText: st.lastResult, refineInstruction: instr, lengthHint: lenHint,
        maxTokens:2400, featureId:'intent-refine-script'
      });
      st.lastResult = r; show(r); s.textContent='';
    }catch(e){ s.textContent='❌ '+e.message; }
  }
  window.intentCopy = function(){
    if(!st.lastResult) return;
    navigator.clipboard.writeText(st.lastResult).then(()=>alert('📋 복사됐어요!'));
  };
  window.intentSaveToLib = function(){
    if(!st.lastResult) return;
    // 허브 보관함(localStorage: lib_history_v1)과 공유
    try{
      const ctx = (window.IntentSystem.detectContext(st.lastInput)||[]).map(x=>x.tag);
      const cat = ctx.includes('script')?'script': ctx.includes('blog')?'blog': ctx.includes('public')?'public': ctx.includes('smb')?'smb': ctx.includes('edu')?'edu': ctx.includes('translate')?'trans':'other';
      const lang = ctx.includes('lang-jp')?'jp': ctx.includes('lang-kojp')?'kojp':'ko';
      const list = JSON.parse(localStorage.getItem('lib_history_v1')||'[]');
      const item = {
        id: 'r'+Date.now().toString(36), createdAt: Date.now(),
        category:cat, lang, title:'[빠른생성] ' + st.lastInput.split('\n')[0].slice(0,40),
        text: st.lastResult, chars: st.lastResult.length, favorite:false, projectId:null,
        meta:{intent:true, source:'script-engine'}
      };
      list.unshift(item);
      localStorage.setItem('lib_history_v1', JSON.stringify(list.slice(0,20)));
      alert('📁 보관함에 저장됐어요!');
    }catch(e){ alert('저장 실패: '+e.message); }
  };
  window.intentOpenProfile = function(){
    if(window.IntentSystem) window.IntentSystem.openPicker();
  };

  // TAB('intent') 훅 — 샘플 채우기
  const origTAB = window.TAB;
  if(typeof origTAB === 'function'){
    window.TAB = function(id, btn){
      origTAB(id, btn);
      if(id==='intent') fillSamples();
    };
  }
  document.addEventListener('DOMContentLoaded', fillSamples);
  console.log('✅ ⚡ 빠른 생성 (Intent-script) 로드 완료');
})();

/* ═══════════════════════════════════════════════════════════
   📱 자동숏츠 임베드 모드 (?from=shorts)
   ═══════════════════════════════════════════════════════════ */
(function shortsEmbed(){
  const params = new URLSearchParams(location.search);
  if(params.get('from') !== 'shorts') return;

  const tab   = params.get('tab') || localStorage.getItem('sh_script_tab') || 'gen';
  const topic = params.get('topic') || localStorage.getItem('sh_topic_bridge') || '';

  // CSS 주입: 자체 topbar, tab-nav 숨김
  const st = document.createElement('style');
  st.textContent =
    'header.topbar{display:none !important}' +
    'nav.tab-nav{display:none !important}' +
    '#ai-bar-auto{display:none !important}' +  // 상단 AI 바도 공간 절약
    '.sh-embed-bar{position:sticky;top:0;z-index:90;background:linear-gradient(135deg,#ef6fab,#9181ff);' +
      'color:#fff;padding:8px 14px;display:flex;align-items:center;gap:10px;font-size:12.5px;font-weight:800;' +
      'box-shadow:0 2px 6px rgba(126,87,110,.15)}' +
    '.sh-embed-bar .sh-back{padding:4px 10px;background:rgba(255,255,255,.25);border:1px solid rgba(255,255,255,.4);' +
      'color:#fff;border-radius:999px;cursor:pointer;font-weight:900;font-size:11px}' +
    '.sh-embed-bar .sh-back:hover{background:rgba(255,255,255,.4)}' +
    '.sh-next-btn{display:block;margin:12px auto;padding:14px 28px;background:linear-gradient(135deg,#ef6fab,#9181ff);' +
      'color:#fff;border:none;border-radius:999px;font-weight:900;font-size:14px;cursor:pointer;' +
      'box-shadow:0 8px 20px rgba(239,111,171,.3)}' +
    '.sh-next-btn:hover{transform:translateY(-1px)}' +
    '.app{padding-top:0 !important}';
  document.head.appendChild(st);

  const tabNames = {
    gen:'일반 대본', batch:'통합 생성', lyric:'가사/음원', saying:'사자성어·명언',
    humor:'코믹·유머', know:'전문지식', trivia:'잡학', drama:'숏드라마',
    hub:'변환허브', hist:'히스토리', story:'감동스토리', preset:'프리셋', intent:'빠른 생성',
    senior:'시니어 특화', sns:'SNS 변환'
  };
  const tabLabel = tabNames[tab] || tab;

  // 상단 얇은 안내바 삽입
  document.addEventListener('DOMContentLoaded', () => {
    const bar = document.createElement('div');
    bar.className = 'sh-embed-bar';
    bar.innerHTML =
      '<span>📱 자동숏츠 대본 모드</span>' +
      '<span style="opacity:.85">· 탭: <b>' + tabLabel + '</b></span>' +
      '<span style="flex:1"></span>' +
      '<button class="sh-back" onclick="shEmbedBack()">← 자동숏츠로</button>';
    const app = document.querySelector('.app') || document.body;
    app.insertBefore(bar, app.firstChild);

    // 주제 자동 입력
    if(topic){
      setTimeout(() => {
        const targets = ['topic','subject','one-input','input-topic'];
        for(const id of targets){
          const el = document.getElementById(id);
          if(el){ el.value = topic; break; }
        }
        // 첫 번째 textarea 에도 주입 (fallback)
        const firstTa = document.querySelector('textarea');
        if(firstTa && !firstTa.value) firstTa.value = topic;
      }, 300);
    }

    // 탭 자동 활성화
    setTimeout(() => {
      try{
        const btns = document.querySelectorAll('.tab-nav .tnav');
        for(const b of btns){
          const code = b.getAttribute('onclick') || '';
          if(code.indexOf("'" + tab + "'") >= 0){
            if(typeof TAB === 'function') TAB(tab, b);
            break;
          }
        }
      }catch(_){}
    }, 400);

    // 결과 textarea 감시 → 생성 완료 시 [다음 단계 →] 버튼 추가
    let lastOutKey = null;
    setInterval(() => {
      const outIds = ['out','scriptOut','generated-output','result-out'];
      let target = null, content = '';
      for(const id of outIds){
        const el = document.getElementById(id);
        if(el && (el.value||'').trim().length > 100){ target = el; content = el.value; break; }
      }
      if(!target){
        // 가장 긴 readonly textarea 찾기
        document.querySelectorAll('textarea[readonly]').forEach(t => {
          if((t.value||'').trim().length > (content.length)){ target = t; content = t.value; }
        });
      }
      if(!target || !content) return;
      if(document.getElementById('sh-next-btn')) return;
      // 기존 버튼 있다면 그 근처에 추가
      const btn = document.createElement('button');
      btn.id = 'sh-next-btn';
      btn.className = 'sh-next-btn';
      btn.textContent = '✅ 이 대본으로 다음 단계 →';
      btn.onclick = () => shEmbedNext(content);
      target.parentElement.insertBefore(btn, target.nextSibling);
    }, 1500);
  });

  window.shEmbedBack = function(){
    if(window.parent && window.parent !== window){
      window.parent.postMessage({ type:'sh_back' }, '*');
    } else {
      history.back();
    }
  };
  window.shEmbedNext = function(scriptText){
    if(window.parent && window.parent !== window){
      window.parent.postMessage({ type:'sh_next', step: 4, script: scriptText || '' }, '*');
    } else {
      location.href = '../../index.html';
    }
  };
})();

/* ══════════════════════════════════════════════════════════
   UI 재구성: 사용자 흐름 순서대로 DOM 재배치
   (기존 ID·이벤트 핸들러 보존 — CSS order 아닌 실제 element 이동)
   순서: 상단바 → 장르탭 → 채널 → 모드 → 주제 → 기본설정 → HT → 고급 → ⚡생성 → 결과
   ══════════════════════════════════════════════════════════ */
(function(){
  function mk(tag, cls, id){
    var d = document.createElement(tag||'div');
    if(cls) d.className = cls;
    if(id)  d.id = id;
    return d;
  }

  function reorder(){
    var pg = document.getElementById('pg-gen');
    if(!pg) return;

    /* ── 1) 컨테이너 생성 ── */
    var chPanel = mk('div', 'panel', 'sc-channel-panel');
    chPanel.innerHTML =
      '<div class="sec" style="margin-top:0">③ 채널 선택</div>' +
      '<div class="sc-ch-panel" id="sc-ch-bar">' +
        '<button type="button" class="sc-ch-btn" data-ch="k" onclick="setOut(\'k\')">🇰🇷 한국어</button>' +
        '<button type="button" class="sc-ch-btn" data-ch="j" onclick="setOut(\'j\')">🇯🇵 일본어</button>' +
        '<button type="button" class="sc-ch-btn on" data-ch="b" onclick="setOut(\'b\')">🇰🇷🇯🇵 동시</button>' +
      '</div>';

    var htPanel = mk('div', 'panel', 'sc-ht-panel');
    htPanel.innerHTML = '<div class="sec" style="margin-top:0">⑦ Hook · Trust 설정</div>';

    var advWrap = mk('div', 'sc-adv-wrap', 'sc-adv-wrap');
    advWrap.innerHTML =
      '<div class="sc-adv-head" id="sc-adv-head">' +
        '<span>⚙️ 고급 설정 — URL분석·차별화·이전/다음 예고·추가 지시 (선택)</span>' +
        '<span class="arr">▾</span>' +
      '</div>' +
      '<div class="sc-adv-body" id="sc-adv-body"></div>';

    var genWrap = mk('div', null, 'sc-gen-wrap');
    genWrap.innerHTML = '<button class="sc-gen-inline" type="button" onclick="gen()">⚡ 대본 생성</button>';

    /* ── 2) 기존 요소 참조 ── */
    var apiBar     = pg.querySelector('.api-bar');
    var modesEl    = pg.querySelector('.modes');
    var modePanel  = modesEl ? modesEl.closest('.panel') : null;
    var topicPanel = document.getElementById('topic-panel');
    var htSliders  = document.getElementById('ht-sliders');
    var basicPanel = htSliders ? htSliders.closest('.panel') : null;
    var trendingBox = topicPanel ? topicPanel.querySelector('.trending-box') : null;
    var detailH    = document.getElementById('detail-panel-h');
    var detailT    = document.getElementById('detail-panel-t');
    var detailL    = document.getElementById('detail-panel-l');
    var hookCards  = detailH ? detailH.querySelector('.hook-cards') : null;
    var advBodyH   = document.getElementById('adv-body-h');
    var advToggleH = document.getElementById('adv-toggle-h');
    var hookSec    = detailH ? detailH.querySelector('.sec') : null;
    var presetQ    = document.getElementById('preset-quick');
    var presetPanel = presetQ ? presetQ.closest('.panel') : null;
    var errbox     = document.getElementById('errbox');
    var resultPanel = document.getElementById('result');

    /* ── 3) 이동: URL·트렌딩 박스 → 고급 ── */
    var advBody = advWrap.querySelector('#sc-adv-body');
    if(trendingBox) advBody.appendChild(trendingBox);

    /* ── 4) 이동: Hook·Trust 슬라이더 + 훅 패턴 카드 → HT 패널 ── */
    if(hookSec)   htPanel.appendChild(hookSec.cloneNode(true)); // 훅 패턴 섹 레이블
    if(hookCards) htPanel.appendChild(hookCards);
    if(htSliders) htPanel.appendChild(htSliders);

    /* ── 5) 이동: detail-panel-h 고급 body + 티키타카 + 롱폼 → 고급 ── */
    if(advToggleH) advToggleH.style.display = 'none';
    if(advBodyH){ advBodyH.style.display = 'block'; advBody.appendChild(advBodyH); }
    if(detailH)  detailH.style.display = 'none'; // 빈 껍질 숨김
    if(detailT)  advBody.appendChild(detailT);
    if(detailL)  advBody.appendChild(detailL);

    /* ── 6) #pg-gen 자식 순서 재정렬 ──
       [2026-04-24 플로우 정리] ⚡ 대본 생성 버튼을 주제 입력 바로 아래로 이동 */
    var order = [
      apiBar,        /* AI 선택 (상단 고정바와 중복 보존 — 상세 상태/키 경고 포함) */
      chPanel,       /* ③ 채널 선택 (CSS 로 숨김 — 상단 기본설정과 중복) */
      modePanel,     /* ④ 모드 선택 */
      topicPanel,    /* ⑤ 주제 입력 */
      genWrap,       /* ⑥ ⚡ 대본 생성 (주제 입력 직후로 이동) */
      basicPanel,    /* ⑦ 기본 설정 (출력언어·목표길이) */
      htPanel,       /* ⑧ Hook·Trust */
      advWrap,       /* ⑨ 고급 설정 */
      presetPanel,   /* 프리셋 퀵바 */
      errbox,        /* 에러 */
      resultPanel    /* ⑩ 결과창 */
    ];
    order.forEach(function(el){ if(el) pg.appendChild(el); });

    /* ── 7) 채널 버튼 ↔ setOut 양방향 동기화 ── */
    var _origSetOut = window.setOut;
    window.setOut = function(v){
      if(typeof _origSetOut === 'function') _origSetOut(v);
      var map = {k:'k', j:'j', b:'b'};
      document.querySelectorAll('.sc-ch-btn').forEach(function(b){
        b.classList.toggle('on', b.getAttribute('data-ch') === map[v]);
      });
      scriptUpdateTopbar();
    };
    // 초기 상태 반영 (OUT 전역변수)
    try {
      var cur = (typeof OUT !== 'undefined') ? OUT : 'b';
      document.querySelectorAll('.sc-ch-btn').forEach(function(b){
        b.classList.toggle('on', b.getAttribute('data-ch') === cur);
      });
    } catch(e){}

    /* ── 8) 고급 설정 토글 ── */
    var advHead = document.getElementById('sc-adv-head');
    if(advHead) advHead.addEventListener('click', function(){ advWrap.classList.toggle('open'); });
  }

  /* 상단바 상태 표시 업데이트 */
  window.scriptUpdateTopbar = function(){
    var el = document.getElementById('script-topbar-status');
    if(!el) return;
    var tabBtn = document.querySelector('.tnav.on');
    var tab = tabBtn ? (tabBtn.textContent || '').trim() : '';
    var chBtn = document.querySelector('.sc-ch-btn.on');
    var ch = chBtn ? (chBtn.textContent || '').trim() : '';
    var parts = [tab, ch].filter(Boolean);
    el.textContent = parts.length ? parts.join(' · ') : '대본생성기';
  };

  /* TAB 래퍼: 기존 TAB 호출 후 상단바 동기화 */
  if(typeof window.TAB === 'function'){
    var _origTAB = window.TAB;
    window.TAB = function(name, btn){
      _origTAB(name, btn);
      scriptUpdateTopbar();
    };
  }

  /* 상단바 버튼 핸들러 */
  window.scriptBackToShorts = function(){
    if(window.parent && window.parent !== window){
      window.parent.postMessage({ type:'sh_back' }, '*');
      return;
    }
    location.href = '../../index.html';
  };
  window.scriptOpenPreset = function(){
    var btn = Array.from(document.querySelectorAll('.tnav')).find(function(b){
      return (b.getAttribute('onclick')||'').indexOf("'preset'") >= 0;
    });
    if(btn && typeof TAB === 'function'){ TAB('preset', btn); }
  };

  /* 상단바 드롭다운 토글 */
  window.scriptCloseDropdowns = function(){
    ['sc-ai-menu','sc-preset-menu'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.classList.remove('open');
    });
  };
  window.scriptToggleDropdown = function(name){
    var id = name === 'ai' ? 'sc-ai-menu' : 'sc-preset-menu';
    var other = name === 'ai' ? 'sc-preset-menu' : 'sc-ai-menu';
    var el = document.getElementById(id);
    var ot = document.getElementById(other);
    if(ot) ot.classList.remove('open');
    if(el) el.classList.toggle('open');
  };
  // 드롭다운 바깥 클릭 시 닫기
  document.addEventListener('click', function(e){
    if(!e.target.closest('.sc-topbtn-wrap')) scriptCloseDropdowns();
  }, true);

  /* 장르 탭을 카드로 감싸기: <div class="genre-tab-card"><div class="genre-tab-label">1️⃣ 장르</div> .tab-nav</div> */
  function wrapGenreTab(){
    var nav = document.querySelector('nav.tab-nav');
    if(!nav) return;
    if(nav.parentNode && nav.parentNode.classList && nav.parentNode.classList.contains('genre-tab-card')) return;
    var card = document.createElement('div');
    card.className = 'genre-tab-card';
    card.id = 'sc-genre-wrap';
    var label = document.createElement('div');
    label.className = 'genre-tab-label';
    label.textContent = '1️⃣ 장르';
    nav.parentNode.insertBefore(card, nav);
    card.appendChild(label);
    card.appendChild(nav);
  }

  /* ── 대본 검수 체크리스트 자동 표시 ── */
  window.scriptShowReview = function(){
    var sec = document.getElementById('script-review-section');
    if(!sec) return;
    sec.style.display = 'block';
    var meta = document.getElementById('script-review-meta');
    var out = document.getElementById('out');
    if(meta && out){
      var len = (out.value || '').length;
      var min = Math.round(len / 200 * 10) / 10;
      meta.textContent = len.toLocaleString() + '자 · 약 ' + min + '분';
    }
  };

  /* 수동 검수 실행 — 체크박스 초기화 후 섹션 표시·스크롤 */
  window.scriptRunReview = function(){
    var sec = document.getElementById('script-review-section');
    if(!sec) return;
    // 체크박스 전부 해제 (새 검수 시작)
    sec.querySelectorAll('input[type=checkbox]').forEach(function(cb){ cb.checked = false; });
    scriptShowReview();
    sec.scrollIntoView({behavior:'smooth', block:'start'});
  };

  /* 다음 단계로 진행 — 임베드 모드면 부모로 postMessage, 아니면 허브 이동 */
  window.scriptGoNext = function(){
    var out = document.getElementById('out');
    var scriptText = out ? (out.value || '').trim() : '';
    if(!scriptText){
      alert('먼저 대본을 생성해주세요.');
      return;
    }
    // 검수 체크리스트가 표시되지 않았다면 먼저 표시
    var sec = document.getElementById('script-review-section');
    if(sec && sec.style.display === 'none'){ scriptShowReview(); }

    // 기존 shEmbedNext(shortsEmbed IIFE에서 정의)가 있으면 재사용
    if(typeof window.shEmbedNext === 'function'){
      window.shEmbedNext(scriptText);
      return;
    }
    // 부모 창(스튜디오)에 postMessage 시도
    try {
      if(window.parent && window.parent !== window){
        window.parent.postMessage({ type:'sh_next', step: 4, script: scriptText }, '*');
        return;
      }
    } catch(e){}
    // fallback — 직접 접속일 때만 허브로 이동 (iframe 내에서 상위 프레임 이동 금지)
    if(window.parent === window){
      location.href = '../../index.html';
    }
  };

  function watchResult(){
    var result = document.getElementById('result');
    if(!result) return;
    new MutationObserver(function(muts){
      muts.forEach(function(m){
        if(m.attributeName === 'class' && result.classList.contains('on')){
          scriptShowReview();
        }
      });
    }).observe(result, {attributes:true, attributeFilter:['class']});
    // 이미 on 상태면 즉시 표시 (재진입)
    if(result.classList.contains('on')) scriptShowReview();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ reorder(); wrapGenreTab(); watchResult(); });
  } else {
    reorder(); wrapGenreTab(); watchResult();
  }
  // 초기 상태바 채우기
  setTimeout(scriptUpdateTopbar, 100);
})();

/* ─── iframe 안에서 열렸으면 내부 상단바(.script-topbar) 숨김 ─── */
(function(){
  if(window.self !== window.top){
    var bar = document.getElementById('script-topbar')
      || document.querySelector('.script-topbar')
      || document.querySelector('[id*="topbar"]');
    if(bar) bar.style.display = 'none';
  }
})();
