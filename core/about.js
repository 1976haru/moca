/* ==================================================
   about.js  -- MOCA 소개 + Q&A + Intent Stage (빠른 생성)
   ================================================== */

/* ═══════════════════════════════════════════════
   ☕ MOCA 소개 탭 + 💬 Q&A 탭
   =============================================== */
(function(){
  /* ─ 소개 탭 핸들러 ─ */
  window.moStart = function(){
    // 일반 모드로 돌아가 대본 생성기 카테고리로
    const normalTab = document.querySelector('.toptab[data-mode="normal"]');
    if(normalTab){ normalTab.click(); }
    if(typeof window.__hubGoCategory==='function'){ window.__hubGoCategory('script'); }
    window.scrollTo({top:0, behavior:'smooth'});
  };
  window.moScrollTo = function(id){
    const el = document.getElementById(id);
    if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  };
  window.moContact = function(){
    alert('📧 이메일 문의\n\nsupport@moca.example 로 보내주세요!\n(단체 라이선스·공공기관 도입·추천인 혜택 문의 환영)\n\n보통 24시간 이내에 답변드립니다.');
  };

  /* ─ Q&A 데이터 ─ */
  const QNA = [
    // 시작하기
    {c:'start', q:'MOCA가 뭔가요?', a:`MOCA는 "Make One Click All"의 줄임말이에요.
글 쓸 일이 생길 때마다 여기저기 사이트를 돌아다니던 불편함을 없애고 블로그, 대본, 번역, 보고서, SNS 등 어떤 글이든 한 곳에서 해결하는 프로그램이에요.
마치 마법처럼요! ✨`},
    {c:'start', q:'어떤 글을 쓸 수 있나요?', a:`정말 어떤 글이든 다 돼요!
유튜브 대본, 블로그, SNS 게시물, 공문서, 보고서, 번역, 숙제, 편지, 웹툰 대본, 소설, 광고 카피...
글과 관련된 건 전부 MOCA 하나로 해결해요.`},
    {c:'start', q:'코딩을 몰라도 쓸 수 있나요?', a:`네! 전혀 몰라도 돼요.
클릭하고 글자 입력하면 끝이에요. 초등학생도 쓸 수 있어요! 🎮`},
    {c:'start', q:'API 키가 뭔가요? 어렵지 않나요?', a:`API 키는 도서관 회원증 같은 거예요.
딱 한 번만 만들면 돼요. 만드는 방법은 📖 가이드 탭에서 쉽게 알려드려요.
5분이면 완성! ⏱`},
    {c:'start', q:'처음에 뭐부터 해야 하나요?', a:`이 순서대로 따라하세요:
1. ⚙️ 설정 탭 → API 키 입력
2. 왼쪽 카테고리 중 원하는 것 클릭
3. 주제 입력
4. 생성 버튼 클릭!

끝이에요! 😊`},

    // 비용/결제
    {c:'cost', q:'얼마나 드나요?', a:`두 가지 비용이 있어요.
1) MOCA 이용료: 월 9,900원~29,900원
2) AI 사용료: 글 1개당 약 10원~50원

합쳐도 월 1~3만원이면 충분해요!`},
    {c:'cost', q:'무료로 써볼 수 있나요?', a:`API 키만 있으면 MOCA는 무료로 써볼 수 있어요.
API 키도 처음엔 무료 크레딧이 있어요!`},
    {c:'cost', q:'API 비용이 걱정돼요', a:`걱정 마세요!
글 1개 = 약 10원~50원이에요.
하루 10개 만들어도 월 3,000원~15,000원이에요.
카페 아메리카노 3잔 가격이에요! ☕`},
    {c:'cost', q:'어떻게 결제하나요?', a:`AI 회사(Anthropic/OpenAI)에 직접 충전하면 돼요.
신용카드로 5달러(약 7,000원)부터 충전 가능해요.`},

    // 기능
    {c:'feat', q:'정말 어떤 글이든 다 되나요?', a:`네! 블로그, 유튜브 대본, 번역, 보고서, SNS, 공문서, 숙제, 편지, 웹툰 대본, 광고 카피...
글과 관련된 건 전부 MOCA 하나로 해결해요. 여기저기 돌아다닐 필요 없어요!`},
    {c:'feat', q:'일본어도 나오나요?', a:`네! 한국어와 일본어가 동시에 나와요.
따로 번역 안 해도 돼요. 한 번에 두 채널 운영 가능해요! 🇰🇷🇯🇵`},
    {c:'feat', q:'어떤 AI를 사용하나요?', a:`Claude(Anthropic), GPT(OpenAI), Gemini(Google) 세 가지를 쓸 수 있어요.
⚙️ 설정 탭에서 원하는 것으로 바꿀 수 있어요!`},
    {c:'feat', q:'유튜브 자동 업로드도 되나요?', a:`현재는 업로드용 텍스트(제목/설명/태그)를 자동으로 만들어줘요.
복사해서 붙여넣기 하면 돼요. 자동 업로드는 추후 업데이트 예정이에요!`},
    {c:'feat', q:'저장은 어떻게 되나요?', a:`만든 결과물이 자동으로 📁 보관함에 저장돼요.
최근 20개까지 보관해요. 즐겨찾기와 프로젝트별 관리도 가능해요! 📁`},
    {c:'feat', q:'몇 개까지 만들 수 있나요?', a:`무제한이에요!
API 크레딧이 있는 한 계속 만들 수 있어요.`},
    {c:'feat', q:'스마트폰에서도 되나요?', a:`네! 모바일에서도 잘 돼요.
화면이 자동으로 스마트폰 크기에 맞게 바뀌어요! 📱`},

    // 오류해결
    {c:'fix', q:'결과가 안 나와요', a:`이렇게 확인해보세요:
1) ⚙️ 설정 탭에서 API 키 입력됐는지 확인
2) API 크레딧 있는지 확인
3) 인터넷 연결 확인

그래도 안 되면 페이지 새로고침(F5) 해보세요!`},
    {c:'fix', q:'일본어가 이상해요', a:`Claude 모델을 선택하면 일본어 품질이 좋아져요.
⚙️ 설정 탭에서 Claude로 바꿔보세요!`},
    {c:'fix', q:'화면이 깨져 보여요', a:`브라우저를 Chrome으로 써보세요.
또는 페이지를 새로고침(F5) 해보세요!`},
    {c:'fix', q:'저장이 안 돼요', a:`시크릿 모드에서는 저장이 안 될 수 있어요.
일반 모드로 사용해주세요!`},

    // 판매/활용
    {c:'biz', q:'MOCA로 만든 글을 판매해도 되나요?', a:`네! MOCA로 만든 결과물의 저작권은 사용자(여러분)에게 있어요.
블로그/유튜브/SNS 수익화 모두 가능해요!`},
    {c:'biz', q:'크몽에서 대행 서비스로 팔 수 있나요?', a:`네! MOCA를 활용해서 크몽에서 대행 서비스를 판매할 수 있어요.
📖 가이드 탭에서 크몽 판매 방법을 알려드려요!`},
    {c:'biz', q:'공공기관/회사에서 단체로 쓸 수 있나요?', a:`네! 단체 라이선스 문의는 아래 [📧 이메일 문의] 버튼을 눌러주세요.`},
    {c:'biz', q:'다른 사람에게 MOCA를 소개하면 혜택이 있나요?', a:`추후 추천인 혜택 프로그램을 운영할 예정이에요.
업데이트 소식을 기다려주세요!`}
  ];
  const QNA_CAT = {start:'시작하기', cost:'비용/결제', feat:'기능', fix:'오류해결', biz:'판매/활용'};
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  const qaState = { filter:'all', query:'' };
  window.renderQnA = function(){ drawQnA(); };

  function filteredQna(){
    const q = qaState.query.trim().toLowerCase();
    return QNA.filter(x => {
      if(qaState.filter !== 'all' && x.c !== qaState.filter) return false;
      if(!q) return true;
      return (x.q.toLowerCase().includes(q) || x.a.toLowerCase().includes(q));
    });
  }
  function drawQnA(){
    const list = document.getElementById('qa-list');
    const nomatch = document.getElementById('qa-nomatch');
    if(!list) return;
    const items = filteredQna();
    if(!items.length){
      list.innerHTML = '';
      if(nomatch) nomatch.style.display = 'block';
      return;
    }
    if(nomatch) nomatch.style.display = 'none';
    list.innerHTML = items.map((x,i)=>`<div class="qa-item" data-idx="${i}">
      <div class="qa-q" onclick="qaToggle(this)">
        <span class="cat">${esc(QNA_CAT[x.c]||'기타')}</span>
        <span class="txt">Q. ${esc(x.q)}</span>
        <span class="chev">▾</span>
      </div>
      <div class="qa-a"><div class="qa-a-inner">${esc(x.a)}</div></div>
    </div>`).join('');
  }
  window.qaToggle = function(q){ q.parentElement.classList.toggle('open'); };
  window.qaSearch = function(v){ qaState.query = v||''; drawQnA(); };
  window.qaFilter = function(f, btn){
    qaState.filter = f;
    document.querySelectorAll('#qa-fils .qa-fil').forEach(b=>b.classList.remove('on'));
    if(btn) btn.classList.add('on');
    drawQnA();
  };

  console.log('✅ ☕ MOCA 소개 + 💬 Q&A 로드 완료');
})();

/* ═══════════════════════════════════════════════
   ✨ 빠른 생성 (Intent Stage)
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

  const st = { lastInput:'', lastResult:'', resultLang:'ko' };

  function by(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function estMinutes(len){ return Math.max(1, Math.round(len/320)); }

  window.intentInitStage = function(){
    // 샘플 카드 채우기 (한번만)
    const box = by('intentSampleBox');
    if(box && !box.dataset.ready){
      box.innerHTML = SAMPLES.map(s=>`<button onclick='intentPickSample(${JSON.stringify(s.text)})' style="padding:10px;border:1px solid var(--line);background:#fff;border-radius:12px;font-size:11px;font-weight:800;color:#5a4a56;cursor:pointer;text-align:left">${esc(s.k)}</button>`).join('');
      box.dataset.ready = '1';
    }
  };

  window.intentPickSample = function(text){
    const ta = by('intentInput');
    if(ta){ ta.value = text; ta.focus(); }
    const box = by('intentSampleBox'); if(box) box.style.display = 'none';
  };

  window.intentRun = async function(){
    const ta = by('intentInput');
    const text = (ta && ta.value || '').trim();
    if(!text){ alert('어떤 글을 쓸지 편하게 입력해주세요!'); return; }
    st.lastInput = text;
    const btn = by('intentGoBtn'); const status = by('intentStatus');
    btn.disabled = true; btn.textContent = '⏳ 생성 중...';
    status.textContent = '사용자 입력을 분석해 최적 프롬프트로 생성하고 있어요...';
    try{
      const r = await window.IntentSystem.runIntent(text, {maxTokens:2400, featureId:'intent-gen'});
      st.lastResult = r;
      showResult(r);
      status.textContent = '';
    }catch(e){
      status.textContent = '❌ '+e.message;
    }finally{
      btn.disabled = false; btn.textContent = '☕ 생성하기';
    }
  };

  function showResult(r){
    const box = by('intentResultBox');
    const out = by('intentResult');
    const meta= by('intentResultMeta');
    if(!box || !out) return;
    out.textContent = r;
    const ctx = (window.IntentSystem.detectContext(st.lastInput)||[]).map(x=>x.tag).slice(0,4).join(' · ') || '자동 감지';
    meta.textContent = `📏 ${r.length.toLocaleString()}자 · ⏱ 약 ${estMinutes(r.length)}분 · 🧭 ${ctx}`;
    box.style.display = 'block';
    box.scrollIntoView({behavior:'smooth', block:'start'});
  }

  window.intentRefine = async function(kind){
    if(!st.lastResult){ alert('먼저 결과를 생성해주세요.'); return; }
    if(kind==='custom'){
      const rb = by('intentRefineBox');
      if(rb){ rb.style.display='block'; by('intentRefineInput').focus(); }
      return;
    }
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
    by('intentRefineBox').style.display = 'none';
    await runRefine(v, '');
  };

  async function runRefine(instruction, lenHint){
    const status = by('intentStatus');
    status.textContent = '⏳ 수정 요청을 반영해 다시 쓰고 있어요...';
    try{
      const r = await window.IntentSystem.runIntent(st.lastInput, {
        baseText: st.lastResult,
        refineInstruction: instruction,
        lengthHint: lenHint,
        maxTokens:2400, featureId:'intent-refine'
      });
      st.lastResult = r;
      showResult(r);
      status.textContent = '';
    }catch(e){ status.textContent = '❌ '+e.message; }
  }

  window.intentCopy = function(){
    if(!st.lastResult) return;
    navigator.clipboard.writeText(st.lastResult).then(()=>{ if(typeof libToast==='function') libToast('📋 복사됨!'); });
  };
  window.intentSaveToLib = function(){
    if(!st.lastResult) return;
    if(typeof window.Library !== 'undefined'){
      const p = window.IntentSystem.getActiveProfile();
      const ctx = (window.IntentSystem.detectContext(st.lastInput)||[]).map(x=>x.tag);
      const cat = ctx.includes('script')?'script': ctx.includes('blog')?'blog': ctx.includes('public')?'public': ctx.includes('smb')?'smb': ctx.includes('edu')?'edu': ctx.includes('translate')?'trans':'other';
      const lang = ctx.includes('lang-jp')?'jp': ctx.includes('lang-kojp')?'kojp':'ko';
      window.Library.saveResult({
        text: st.lastResult,
        category: cat,
        lang,
        title: '[빠른생성] ' + (st.lastInput.split('\n')[0].slice(0,40)),
        meta: {intent:true, profile:p.id, context:ctx}
      });
    }
  };

  // 프로필 변경 시 결과 화면 메타 갱신
  window.addEventListener('intent:profile-change', ()=>{
    if(st.lastResult){
      const meta = by('intentResultMeta'); if(!meta) return;
      const ctx = (window.IntentSystem.detectContext(st.lastInput)||[]).map(x=>x.tag).slice(0,4).join(' · ') || '자동 감지';
      meta.textContent = `📏 ${st.lastResult.length.toLocaleString()}자 · ⏱ 약 ${estMinutes(st.lastResult.length)}분 · 🧭 ${ctx} · 👤 ${(window.IntentSystem.getActiveProfile()||{}).name||''}`;
    }
  });

  console.log('✅ ✨ 빠른 생성 (Intent) 로드 완료');
})();
