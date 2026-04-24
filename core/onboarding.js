/* ==================================================
   onboarding.js  -- 오늘의 추천 + 샘플 미리보기 + FAB + 준비 현황
   ================================================== */

/* ═══════════════════════════════════════════════
   🎉 온보딩 · 오늘의 추천 · 샘플 미리보기 · 도움말 FAB · 준비 현황
   =============================================== */
(function(){
  const LS_DONE = 'onboarding_done';
  const LS_USER = 'user_type';
  const LS_DATE = 'onboarding_date';
  const KEY_NAMES = ['uc_claude_key','uc_openai_key','uc_gemini_key'];

  function hasKey(){ return KEY_NAMES.some(k=>{ const v=localStorage.getItem(k); return v && v.trim().length>0; }); }
  function getUserType(){ return localStorage.getItem(LS_USER) || 'youtuber'; }
  function setUserType(t){ localStorage.setItem(LS_USER, t); }
  function markDone(){
    localStorage.setItem(LS_DONE, '1');
    localStorage.setItem(LS_DATE, new Date().toISOString());
  }

  /* ─ 월별 추천 주제 (유저 타입별) ─ */
  const SEASONAL = {
    1: {season:'신년·새해 다짐·건강검진', soon:'구정 준비'},
    2: {season:'설날·명절·밸런타인',     soon:'봄 맞이'},
    3: {season:'봄·건강관리·새학기',     soon:'벚꽃·어린이날 준비'},
    4: {season:'봄·어린이날 준비·건강검진', soon:'어버이날 콘텐츠'},
    5: {season:'어버이날·가정의달·스승의날', soon:'6월 여름 준비'},
    6: {season:'여름 준비·건강음료·장마', soon:'7월 휴가 시즌'},
    7: {season:'휴가·더위 극복·시원한 음식', soon:'8월 광복절'},
    8: {season:'광복절·추억·역사', soon:'9월 추석 준비'},
    9: {season:'추석·명절 음식·가족', soon:'10월 가을 콘텐츠'},
    10:{season:'가을·단풍·건강검진', soon:'11월 김장 시즌'},
    11:{season:'김장·겨울 준비·따뜻한 음식', soon:'12월 연말 콘텐츠'},
    12:{season:'연말·크리스마스·한해 정리', soon:'1월 신년 다짐'}
  };
  const TOPICS_BY_USER = {
    youtuber: [
      {flag:'🇰🇷', topic:'치매 예방 음식 TOP5',      note:'🔥 급상승 중! 지금 만들면 좋아요'},
      {flag:'🇯🇵', topic:'老後の健康習慣',          note:'일본 시니어 채널 인기 주제'}
    ],
    smb: [
      {flag:'📱', topic:'이달의 신메뉴 인스타 소개', note:'🔥 고객 반응 높은 포맷'},
      {flag:'🎁', topic:'단골 고객 감사 이벤트 안내', note:'리텐션 UP'}
    ],
    public: [
      {flag:'📰', topic:'시즌 보도자료 (환절기 건강수칙)', note:'배포 최적 시점'},
      {flag:'📋', topic:'민원 안내문 예시',          note:'공문 톤으로 자동 생성'}
    ],
    student: [
      {flag:'📚', topic:'오늘의 독서 감상문 주제',   note:'학년별 맞춤'},
      {flag:'✏️', topic:'시사 이슈 에세이 주제',     note:'학교 숙제용'}
    ],
    worker: [
      {flag:'💼', topic:'주간 업무보고 템플릿',      note:'30분 → 3분'},
      {flag:'📧', topic:'거래처 감사 메일',          note:'톤 자동 조정'}
    ],
    curious: [
      {flag:'🎮', topic:'지금 가장 인기있는 숏츠 주제', note:'카테고리별 TOP'},
      {flag:'🌏', topic:'한일 시니어 트렌드 비교',   note:'비교 콘텐츠 핫함'}
    ]
  };
  const SAMPLES = {
    script: {
      title:'📺 숏츠 대본 샘플',
      ko:'"안녕하세요! 오늘은 깜짝 놀랄 사실을 알려드릴게요. 치매를 예방하는 음식이 있다는 거 알고 계셨나요? 지금부터 그 다섯 가지를 천천히 소개해드릴 테니 끝까지 함께 봐주세요..."',
      jp:'"こんにちは！今日は驚きの事実をお伝えします。認知症を防ぐ食べ物があるのをご存知ですか？これから5つを、ゆっくりご紹介します..."',
      go:'script'
    },
    blog: {
      title:'📝 블로그 포스팅 샘플',
      ko:'"50대가 되면서 가장 자주 느끼는 변화는 무엇일까요? 오늘은 갱년기 극복을 도와주는 일상 습관 3가지를 정리해드립니다. 직접 해본 결과부터 솔직하게..."',
      jp:null, go:'monetize'
    },
    doc: {
      title:'📋 보도자료 샘플',
      ko:'"○○시는 시민 건강 증진을 위해 오는 5월 1일부터 만 60세 이상 시민을 대상으로 무료 건강검진을 실시한다고 20일 밝혔다..."',
      jp:null, go:'public'
    },
    trans: {
      title:'🌐 번역 샘플',
      ko:'"바쁘신 와중에 도와주셔서 감사드립니다. 덕분에 일정에 맞게 잘 마무리할 수 있었습니다."',
      jp:'"お忙しい中、ご協力ありがとうございました。おかげさまで予定通り無事に完了できました。"',
      go:'trans'
    },
    smb: {
      title:'📱 인스타그램 게시물 샘플',
      ko:'"오늘의 특별메뉴 🌟 신선한 제철 재료로 만든 한정 런치세트! 점심 피크 전에 꼭 들러주세요 #오늘의메뉴 #수제 #동네맛집"',
      jp:null, go:'smb'
    }
  };

  /* ─ 오버레이 DOM 주입 ─ */
  const overlay = document.createElement('div');
  overlay.id = 'obOverlay';
  overlay.innerHTML = `
    <div class="ob-modal" role="dialog" aria-modal="true">
      <div class="ob-head">
        <div class="ob-prog" id="obProg"></div>
        <button class="ob-close" onclick="window.obClose()" aria-label="닫기">✕</button>
      </div>
      <div class="ob-body" id="obBody"></div>
      <div class="ob-foot" id="obFoot"></div>
    </div>`;
  document.body.appendChild(overlay);

  /* ─ FAB + 팝업 ─ */
  const fab = document.createElement('button');
  fab.id='helpFab'; fab.innerHTML='❓'; fab.title='도움말';
  fab.onclick = ()=> document.getElementById('helpPop').classList.toggle('on');
  document.body.appendChild(fab);

  const pop = document.createElement('div');
  pop.id = 'helpPop';
  pop.innerHTML = `
    <h4>무엇을 도와드릴까요?
      <button class="x" onclick="document.getElementById('helpPop').classList.remove('on')" aria-label="닫기">✕</button>
    </h4>
    <div class="row">
      <button onclick="window.obRestart()">🚀 온보딩 다시 보기</button>
      <button onclick="window.obGoGuide()">📖 가이드 탭</button>
      <button onclick="window.obGoSettings()">🔑 API 키 설정</button>
      <button onclick="document.getElementById('helpFaq').scrollIntoView({behavior:'smooth'})">💬 자주 묻는 질문</button>
    </div>
    <div class="faq" id="helpFaq">
      <div class="q">Q. API 키가 없어요</div>
      <div>→ <a href="https://console.anthropic.com/" target="_blank" rel="noopener">Claude</a> 또는 <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">OpenAI</a>에서 무료로 발급받으세요.</div>
      <div class="q">Q. 결과가 안 나와요</div>
      <div>→ 먼저 ⚙️ 설정 모드에서 API 키를 입력해주세요.</div>
      <div class="q">Q. 일본어도 나오나요?</div>
      <div>→ 네! 가사/음원·대본 생성 시 한·일 동시 버전을 만들 수 있어요.</div>
    </div>`;
  document.body.appendChild(pop);

  /* ─ 오버레이 상태 ─ */
  const state = { step:0, userType:null };
  const TOTAL_STEPS = 5;

  const USERS = [
    {id:'youtuber', ico:'📺', name:'유튜버/크리에이터', desc:'숏츠·롱폼·채널 운영'},
    {id:'smb',      ico:'🏪', name:'소상공인/자영업자', desc:'SNS·메뉴판·홍보'},
    {id:'public',   ico:'🏛️', name:'공무원/공공기관',   desc:'보고서·공문·보도자료'},
    {id:'student',  ico:'📚', name:'학생/학부모',        desc:'숙제·교육·워크북'},
    {id:'worker',   ico:'💼', name:'직장인/프리랜서',    desc:'보고서·이메일·번역'},
    {id:'curious',  ico:'🎮', name:'그냥 궁금해서',      desc:'여러 기능 둘러보기'}
  ];
  const FIRST_STEPS = {
    youtuber: {ico:'🎬', title:'숏츠 대본 만들기',
      steps:['왼쪽에서 "숏츠 스튜디오" 클릭','모드 선택','주제 입력','생성 버튼 클릭!'], time:'2분', cost:'약 15원',
      finalBtn:'🎬 첫 대본 만들러 가기!', setCategory:'shorts'},
    smb: {ico:'📱', title:'인스타그램 게시물 만들기',
      steps:['왼쪽에서 "소상공인 패키지" 클릭','"SNS 운영" 선택','가게 정보 입력','생성 버튼 클릭!'], time:'2분', cost:'약 10원',
      finalBtn:'📱 첫 SNS 게시물 만들기!', setCategory:'smb'},
    public: {ico:'📋', title:'보도자료 만들기',
      steps:['왼쪽에서 "공공기관 패키지" 클릭','"보도/홍보" 선택','내용 입력','생성 버튼 클릭!'], time:'3분', cost:'약 20원',
      finalBtn:'📋 첫 보도자료 만들기!', setCategory:'public'},
    student: {ico:'📚', title:'숙제 도움받기',
      steps:['왼쪽에서 "학습/교육" 클릭','원하는 과목·형식 선택','주제 입력','생성 버튼 클릭!'], time:'3분', cost:'약 15원',
      finalBtn:'📚 첫 숙제 도움받기!', setCategory:'edu'},
    worker: {ico:'💼', title:'업무 이메일·번역 만들기',
      steps:['왼쪽에서 "번역/통역" 또는 "수익형" 선택','세부 유형 선택','내용 입력','생성 버튼 클릭!'], time:'2분', cost:'약 10원',
      finalBtn:'💼 첫 업무 결과 만들기!', setCategory:'trans'},
    curious: {ico:'🌟', title:'이것저것 둘러보기',
      steps:['사이드바의 각 카테고리를 하나씩 눌러보세요','마음에 드는 카드를 클릭','가이드 모드로 사용법 확인','원하는 기능으로 시작!'], time:'—', cost:'—',
      finalBtn:'🌟 메인으로 시작하기!', setCategory:'script'}
  };

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function render(){
    const body = document.getElementById('obBody');
    const foot = document.getElementById('obFoot');
    const prog = document.getElementById('obProg');
    prog.innerHTML = '';
    for(let i=0;i<TOTAL_STEPS;i++){
      const d = document.createElement('div');
      d.className = 'dot' + (i<=state.step?' on':'');
      prog.appendChild(d);
    }

    if(state.step===0){
      body.innerHTML = `
        <h2>🎉 환영해요!</h2>
        <p class="sub">통합 콘텐츠 생성기에 오신 걸 환영해요!<br><b>5분이면 첫 번째 결과를 만들 수 있어요</b></p>
        <div class="ob-info-card">
          <h4>💡 준비된 기능</h4>
          <p>유튜브 대본 · 블로그 · 보도자료 · 번역 · 소상공인 SNS · 학습자료 · 트렌드 분석까지 한 곳에서!</p>
        </div>`;
      foot.innerHTML = `
        <button class="ob-btn ghost" onclick="window.obSkip()">나중에 볼게요 (건너뛰기)</button>
        <button class="ob-btn pri" onclick="window.obNext()">지금 바로 시작하기 →</button>`;
    }
    else if(state.step===1){
      body.innerHTML = `
        <h2>어떤 분이신가요?</h2>
        <p class="sub">딱 맞게 안내해드려요!</p>
        <div class="ob-usergrid">
          ${USERS.map(u=>`<button class="ob-usercard ${state.userType===u.id?'on':''}" data-u="${u.id}" onclick="window.obPickUser('${u.id}')">
            <span class="ico">${u.ico}</span>
            <strong>${esc(u.name)}</strong>
            <span>${esc(u.desc)}</span>
          </button>`).join('')}
        </div>`;
      foot.innerHTML = `
        <button class="ob-btn" onclick="window.obPrev()">← 이전</button>
        <button class="ob-btn pri" onclick="window.obNext()" ${state.userType?'':'disabled style="opacity:.5;cursor:not-allowed"'}>다음 →</button>`;
    }
    else if(state.step===2){
      const fs = FIRST_STEPS[state.userType] || FIRST_STEPS.youtuber;
      body.innerHTML = `
        <h2>첫 번째로 이걸 해보세요!</h2>
        <p class="sub">당신에게 꼭 맞는 빠른 시작 안내예요</p>
        <div class="ob-step-card">
          <h4>${fs.ico} ${esc(fs.title)}</h4>
          <ol>${fs.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>
          <div class="meta"><span>⏱ 예상 시간: ${esc(fs.time)}</span><span>💰 예상 비용: ${esc(fs.cost)}</span></div>
        </div>`;
      foot.innerHTML = `
        <button class="ob-btn" onclick="window.obPrev()">← 이전</button>
        <button class="ob-btn pri" onclick="window.obNext()">다음 →</button>`;
    }
    else if(state.step===3){
      body.innerHTML = `
        <h2>🔑 AI를 쓰려면 키가 필요해요</h2>
        <p class="sub">딱 한 번만 넣으면 끝이에요!</p>
        <div class="ob-info-card">
          <h4>API 키가 뭐예요?</h4>
          <p>도서관 회원증 같은 거예요. 회원증이 있어야 책을 빌리듯, 키가 있어야 AI를 쓸 수 있어요.</p>
        </div>
        <div style="font-size:13px;font-weight:800;color:#5a4a56;margin:14px 0 6px">지금 키가 있나요?</div>
        <div class="ob-key-row">
          <button class="ob-btn pri" onclick="window.obGoSettings()">✅ 네! 키 입력하러 가기</button>
        </div>
        <div style="font-size:12px;color:var(--sub);margin:8px 0 4px">❌ 아직 없어요 — 무료 발급:</div>
        <div class="ob-key-row">
          <button class="ob-btn" onclick="window.open('https://console.anthropic.com/','_blank')">Claude 키 받기 →</button>
          <button class="ob-btn" onclick="window.open('https://platform.openai.com/api-keys','_blank')">OpenAI 키 받기 →</button>
        </div>
        <div style="font-size:11px;color:var(--sub);margin-top:8px">⏩ 지금은 샘플만 보고 싶다면 그냥 "다음"을 눌러주세요.</div>`;
      foot.innerHTML = `
        <button class="ob-btn" onclick="window.obPrev()">← 이전</button>
        <button class="ob-btn pri" onclick="window.obNext()">다음 →</button>`;
    }
    else if(state.step===4){
      const fs = FIRST_STEPS[state.userType] || FIRST_STEPS.youtuber;
      body.innerHTML = `
        <div class="ob-finale">
          <div class="emo">🎉</div>
          <h2 style="text-align:center">모든 준비가 됐어요!</h2>
          <p class="sub" style="text-align:center">지금 바로 첫 번째 결과를 만들어봐요!</p>
        </div>
        <button class="ob-btn pri" onclick="window.obFinish()" style="width:100%;padding:16px;font-size:15px">${esc(fs.finalBtn)}</button>
        <p class="sub" style="text-align:center;margin-top:14px;font-size:11px">언제든지 우측 하단 ❓ 버튼 또는 가이드 탭에서 다시 볼 수 있어요</p>`;
      foot.innerHTML = `
        <button class="ob-btn" onclick="window.obPrev()">← 이전</button>
        <button class="ob-btn ok" onclick="window.obFinish()">완료!</button>`;
    }
  }

  /* ─ 공개 API ─ */
  window.obOpen = function(){ state.step=0; state.userType = getUserType(); overlay.classList.add('on'); render(); };
  window.obClose = function(){ overlay.classList.remove('on'); };
  window.obSkip = function(){ markDone(); overlay.classList.remove('on'); refreshMainWidgets(); };
  window.obPrev = function(){ if(state.step>0){ state.step--; render(); } };
  window.obNext = function(){
    if(state.step===1 && !state.userType){ alert('직업을 하나 선택해주세요!'); return; }
    if(state.step < TOTAL_STEPS-1){ state.step++; render(); }
  };
  window.obPickUser = function(id){ state.userType = id; setUserType(id); render(); };
  window.obGoSettings = function(){
    const t = document.querySelector('.toptab[data-mode="setting"]');
    if(t){ t.click(); overlay.classList.remove('on'); document.getElementById('helpPop').classList.remove('on'); }
    else apiKeyMissingToast();
  };
  window.obGoGuide = function(){
    const t = document.querySelector('.toptab[data-mode="guide"]');
    if(t){ t.click(); document.getElementById('helpPop').classList.remove('on'); }
  };
  window.obRestart = function(){
    document.getElementById('helpPop').classList.remove('on');
    window.obOpen();
  };
  window.obFinish = function(){
    markDone();
    const fs = FIRST_STEPS[state.userType||'youtuber'];
    overlay.classList.remove('on');
    refreshMainWidgets();
    if(fs && fs.goHref){ location.href = fs.goHref; return; }
    if(fs && fs.setCategory && typeof window.__hubGoCategory==='function'){
      try{ window.__hubGoCategory(fs.setCategory); window.scrollTo({top:0,behavior:'smooth'}); }catch(_){}
    }
  };

  /* ─ 메인 위젯 렌더 ─ */
  function refreshMainWidgets(){
    renderSetupPanel();
    renderTopicsWidget();
    renderSampleWidget();
  }

  function renderSetupPanel(){
    const box = document.getElementById('hpSetup'); if(!box) return;
    if(hasKey()){
      box.className = 'hp-setup done';
      box.innerHTML = `<div style="font-size:14px;font-weight:800;color:#2f7a54;text-align:center">🎉 모든 준비 완료! 바로 시작하세요!</div>`;
      box.style.display = 'block';
      setTimeout(()=>{ box.style.display='none'; }, 4000);
    } else {
      box.className = 'hp-setup';
      box.innerHTML = `
        <h3>🔧 시작 준비 현황</h3>
        <div class="step"><span class="s-ico">✅</span><strong>1단계: 프로그램 열기</strong><span class="s-sta">완료!</span></div>
        <div class="step"><span class="s-ico">❌</span><strong>2단계: API 키 입력</strong><button onclick="window.obGoSettings()">설정하기</button></div>
        <div class="step"><span class="s-ico">⬜</span><strong>3단계: 첫 결과 만들기</strong><span class="s-sta">대기중...</span></div>
        <div class="msg">API 키만 넣으면 바로 시작할 수 있어요!</div>`;
      box.style.display = 'block';
    }
  }

  function renderTopicsWidget(){
    const box = document.getElementById('hpTopics'); if(!box) return;
    const m = (new Date()).getMonth()+1;
    const s = SEASONAL[m] || {season:'시즌 주제',soon:'다음달 준비'};
    // 컴팩트 한 줄 형식 — 한국/일본 주제 1개씩 + 이번주 시즌
    const kr = {flag:'🇰🇷', topic:'치매 예방 음식 TOP5'};
    const jp = {flag:'🇯🇵', topic:'老後の健康習慣'};
    box.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <strong style="font-size:13px;color:#b14d82">✨ 오늘의 추천 주제</strong>
        <a class="more" style="margin:0 0 0 auto" onclick='window.obGoTrend()'>더 많은 주제 →</a>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;background:#fff9fc;border:1px solid #f1dce7;border-radius:10px;margin-bottom:6px">
        <span style="font-size:13px;font-weight:800">${kr.flag} ${esc(kr.topic)}</span>
        <button style="margin-left:auto;padding:5px 11px;border:none;border-radius:999px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;font-size:11px;font-weight:800;cursor:pointer" onclick='window.obGoScriptWith(${JSON.stringify(kr.topic)})'>대본 만들기</button>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;background:#fff9fc;border:1px solid #f1dce7;border-radius:10px;margin-bottom:6px">
        <span style="font-size:13px;font-weight:800">${jp.flag} ${esc(jp.topic)}</span>
        <button style="margin-left:auto;padding:5px 11px;border:none;border-radius:999px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;font-size:11px;font-weight:800;cursor:pointer" onclick='window.obGoScriptWith(${JSON.stringify(jp.topic)})'>대본 만들기</button>
      </div>
      <div style="font-size:11px;color:#8B5020;padding:6px 12px;background:#fff7ee;border:1px solid #f0d6a0;border-radius:10px">📅 이번주: ${esc(s.season)}</div>`;
  }

  function renderSampleWidget(){
    const box = document.getElementById('hpSample'); if(!box) return;
    const order = ['script','blog','doc','trans','smb'];
    const labels = {script:'대본', blog:'블로그', doc:'공문서', trans:'번역', smb:'소상공인'};
    let cur = localStorage.getItem('hp_sample_tab') || 'script';
    if(!SAMPLES[cur]) cur = 'script';
    const s = SAMPLES[cur];
    box.innerHTML = `
      <h3>👀 이런 결과가 나와요! (샘플)</h3>
      <p class="sub">유형별로 실제 생성 결과 예시를 미리 볼 수 있어요</p>
      <div class="tabs">
        ${order.map(k=>`<button class="${k===cur?'on':''}" onclick='window.obPickSample(${JSON.stringify(k)})'>${esc(labels[k])}</button>`).join('')}
      </div>
      <div class="preview">
        <h4>${esc(s.title)}</h4>
        <div class="bi">🇰🇷 한국어:</div>
        <blockquote>${esc(s.ko)}</blockquote>
        ${s.jp?`<div class="bi">🇯🇵 일본어:</div><blockquote>${esc(s.jp)}</blockquote>`:''}
        <div class="ok-line">✅ 실제로 이런 결과가 나와요!</div>
        <button class="try" onclick='window.obTrySample(${JSON.stringify(cur)})'>나도 만들어보기 →</button>
      </div>`;
  }
  window.obPickSample = function(k){ localStorage.setItem('hp_sample_tab', k); renderSampleWidget(); };
  window.obTrySample = function(k){
    const s = SAMPLES[k]; if(!s) return;
    // 대본 생성기는 iframe으로만 사용 — 'script' 샘플은 숏츠 스튜디오로 라우팅
    const target = s.go==='script' ? 'shorts' : s.go;
    if(typeof window.__hubGoCategory==='function'){
      try{ window.__hubGoCategory(target); window.scrollTo({top:0,behavior:'smooth'}); }catch(_){}
    }
  };
  window.obGoScriptWith = function(topic){
    // 대본 생성기는 iframe으로만 사용 — 숏츠 스튜디오로 라우팅 (주제는 sh_topic_bridge로 전달)
    try{ localStorage.setItem('sh_topic_bridge', topic||''); }catch(_){}
    if(typeof window.__hubGoCategory === 'function') window.__hubGoCategory('shorts');
  };
  window.obCopyTopic = function(topic){ navigator.clipboard.writeText(topic).then(()=>{ if(typeof libToast==='function') libToast('📋 복사됐어요!'); }); };
  window.obGoTrend = function(){
    if(typeof window.__hubGoCategory==='function'){
      try{ window.__hubGoCategory('trend'); window.scrollTo({top:0,behavior:'smooth'}); }catch(_){}
    }
  };

  /* ─ 첫 실행 자동 시작 ─ */
  function boot(){
    refreshMainWidgets();
    if(!localStorage.getItem(LS_DONE)){
      setTimeout(()=>{ window.obOpen(); }, 400);
    }
    // 키 입력 감지: storage 이벤트 (다른 탭) + 주기적 재체크
    window.addEventListener('storage', refreshMainWidgets);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  console.log('✅ 🎉 온보딩·오늘의 추천·샘플·도움말 로드 완료');
})();
