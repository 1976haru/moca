/* ==================================================
   ab.js  -- A/B 비교 센터
   ================================================== */

/* ═══════════════════════════════════════════════
   ⚖️ A/B 비교 센터
   =============================================== */
(function(){
  const LS_LOG = 'ab_test_log_v1';
  const STYLE_LABEL = {emotion:'감동형', info:'정보형', story:'스토리형', quiz:'퀴즈형', custom:'직접입력'};
  const CHANNEL_LABEL = {'senior-emotion':'시니어감동','comic':'코믹','knowledge':'지식','custom':'직접입력'};
  const TONE_LABEL = {friendly:'친근하게', emotional:'감동적으로', professional:'전문적으로', humor:'유머러스하게'};
  const LANG_LABEL = {ko:'한국어', jp:'일본어', kojp:'한국어+일본어'};
  const LANG_INSTR = {
    ko:'[언어] 반드시 한국어로만 작성.',
    jp:'[言語] 必ず日本語のみで作成。',
    kojp:'[언어] 한국어 먼저, 빈 줄 뒤 일본어 버전 순서로 작성.'
  };
  const STYLE_SYS = {
    emotion: '감동형 시니어 대본 작가. 공감·눈물 포인트·따뜻한 마무리. 개인 경험 에피소드 포함.',
    info:    '정보형 대본 작가. 사실·근거·수치 활용. 명확한 단계별 설명, 전문성 유지하되 쉬운 단어.',
    story:   '스토리형 대본 작가. 기승전결 서사 구조, 구체적 인물·상황 묘사.',
    quiz:    '퀴즈형 대본 작가. 문제 제기→힌트→정답 공개 구조, 궁금증 자극.',
    custom:  '{custom}'
  };
  const TONE_SYS = {
    friendly:'친근한 구어체. 반말/존댓말 섞어 편안하게, 시청자를 친구처럼.',
    emotional:'감정이 풍부한 서정적 톤. 향수·공감·따뜻함.',
    professional:'전문가 톤. 객관적 근거 제시, 정중한 존댓말, 명료한 구조.',
    humor:'유머러스한 톤. 과장·반전·재치 있는 비유. 웃음 포인트 중간중간.'
  };

  const ui = { tab:'script',
    scriptStyleA:'emotion', scriptStyleB:'info', scriptLang:'ko', scriptLen:'60', scriptCh:'senior-emotion',
    toneA:'emotional', toneB:'professional' };

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function by(id){ return document.getElementById(id); }
  function read(k,d){ try{ return JSON.parse(localStorage.getItem(k)||JSON.stringify(d)); }catch(_){ return d; } }
  function write(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(_){ return false; } }

  function ensureAdapter(){
    if(typeof APIAdapter === 'undefined') return null;
    try{
      if(typeof AI_PROVIDER !== 'undefined') APIAdapter.setProvider(AI_PROVIDER);
      const ck=localStorage.getItem('uc_claude_key'); if(ck) APIAdapter.setApiKey('claude',ck);
      const ok=localStorage.getItem('uc_openai_key'); if(ok) APIAdapter.setApiKey('openai',ok);
      const gk=localStorage.getItem('uc_gemini_key'); if(gk) APIAdapter.setApiKey('gemini',gk);
    }catch(_){}
    return APIAdapter;
  }
  async function callAI(sys, user, opts){
    const A = ensureAdapter();
    if(!A) throw new Error('core/api-adapter.js 로드 필요');
    return A.callAI(sys, user, Object.assign({maxTokens:2000}, opts||{}));
  }

  /* ─ 탭 전환 / 옵션 버튼 ─ */
  window.abSwitch = function(tab, btn){
    ui.tab = tab;
    document.querySelectorAll('#abTabs button').forEach(b=>b.classList.remove('on'));
    if(btn) btn.classList.add('on');
    ['script','title','thumb','lang','tone','log'].forEach(k=>{
      const p = by('abPanel-'+k); if(p) p.style.display = (k===tab?'block':'none');
    });
    if(tab==='log') renderLog();
  };

  document.addEventListener('click', function(e){
    const b = e.target.closest('#ab-script-styleA button, #ab-script-styleB button, #ab-script-lang button, #ab-script-len button, #ab-script-channel button, #ab-tone-A button, #ab-tone-B button');
    if(!b) return;
    b.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    const parentId = b.parentElement.id;
    if(parentId==='ab-script-styleA'){ ui.scriptStyleA = b.dataset.s; toggleCustom('ab-script-styleA-custom', b.dataset.s==='custom'); }
    if(parentId==='ab-script-styleB'){ ui.scriptStyleB = b.dataset.s; toggleCustom('ab-script-styleB-custom', b.dataset.s==='custom'); }
    if(parentId==='ab-script-lang') ui.scriptLang = b.dataset.l;
    if(parentId==='ab-script-len')  ui.scriptLen  = b.dataset.t;
    if(parentId==='ab-script-channel'){ ui.scriptCh = b.dataset.c; toggleCustom('ab-script-channel-custom', b.dataset.c==='custom'); }
    if(parentId==='ab-tone-A') ui.toneA = b.dataset.t;
    if(parentId==='ab-tone-B') ui.toneB = b.dataset.t;
  });
  function toggleCustom(id, show){ const el=by(id); if(el) el.style.display = show?'block':'none'; }

  /* ─ 렌더 진입점 ─ */
  window.renderAB = function(){ renderLog(); };

  /* ─ 섹션2: 대본 A/B ─ */
  window.abRunScript = async function(){
    const topic = (by('ab-script-topic').value||'').trim();
    if(!topic){ alert('주제를 입력해주세요.'); return; }
    const out = by('ab-script-out');
    const styleA = ui.scriptStyleA==='custom' ? (by('ab-script-styleA-custom').value||'직접입력') : STYLE_LABEL[ui.scriptStyleA];
    const styleB = ui.scriptStyleB==='custom' ? (by('ab-script-styleB-custom').value||'직접입력') : STYLE_LABEL[ui.scriptStyleB];
    const channel = ui.scriptCh==='custom' ? (by('ab-script-channel-custom').value||'직접입력') : CHANNEL_LABEL[ui.scriptCh];
    const sysA = (STYLE_SYS[ui.scriptStyleA]||STYLE_SYS.emotion).replace('{custom}', styleA);
    const sysB = (STYLE_SYS[ui.scriptStyleB]||STYLE_SYS.info).replace('{custom}', styleB);
    const lenInst = `길이 약 ${ui.scriptLen}초 분량 (1초=약 4자 기준).`;
    const chInst = `채널 컨셉: ${channel}. 시니어 친화 톤 유지.`;
    const langInst = LANG_INSTR[ui.scriptLang] || LANG_INSTR.ko;
    const userMsg = `주제: ${topic}\n${lenInst}\n${chInst}\n${langInst}`;

    out.innerHTML = `<div class="ab-split">
      <div class="ab-col A"><h4><span class="ver">A</span> ${esc(styleA)} 스타일</h4><div class="style-chip">⏳ 생성 중...</div></div>
      <div class="ab-col B"><h4><span class="ver">B</span> ${esc(styleB)} 스타일</h4><div class="style-chip">⏳ 생성 중...</div></div>
    </div>`;
    try{
      const [rA, rB] = await Promise.all([
        callAI(sysA+'\n'+langInst, userMsg, {maxTokens:2200, featureId:'ab-script-A'}).catch(e=>'❌ '+e.message),
        callAI(sysB+'\n'+langInst, userMsg, {maxTokens:2200, featureId:'ab-script-B'}).catch(e=>'❌ '+e.message)
      ]);
      renderScriptResults(topic, rA, rB, styleA, styleB);
      // AI 추천
      renderRecommendation(topic, rA, rB, styleA, styleB);
    }catch(e){ out.innerHTML = '<div class="ab-reco">❌ '+esc(e.message)+'</div>'; }
  };
  function scoreOf(text){
    const len = (text||'').length;
    // 간단 휴리스틱 점수
    let pts = 2;
    if(len>400) pts++;
    if(/[?!]/.test(text)) pts++;
    if(/[0-9]+/.test(text)) pts++;
    if(/(안녕|여러분|오늘|함께)/.test(text)) pts++;
    return Math.min(5, pts);
  }
  function stars(n){ return '★'.repeat(n) + '☆'.repeat(5-n); }
  function renderScriptResults(topic, rA, rB, sA, sB){
    const sc = {A:scoreOf(rA), B:scoreOf(rB)};
    const lenA = rA.length, lenB = rB.length;
    const minA = Math.max(1, Math.round(lenA/320));
    const minB = Math.max(1, Math.round(lenB/320));
    const forecastA = sc.A>=4?'높음 📈': sc.A>=3?'보통 📊':'낮음 📉';
    const forecastB = sc.B>=4?'높음 📈': sc.B>=3?'보통 📊':'낮음 📉';
    const metaJson = JSON.stringify({mode:'script',topic,styleA:sA,styleB:sB});
    by('ab-script-out').innerHTML = `
      <div class="ab-split" id="abScriptSplit">
        <div class="ab-col A" data-ab="A">
          <h4><span class="ver">A</span> ${esc(sA)}</h4>
          <div class="meta-row"><span>📏 ${lenA.toLocaleString()}자</span><span>⏱ 약 ${minA}분</span></div>
          <div class="score">AI 점수: ${stars(sc.A)} · 예상 시청 완료율: ${forecastA}</div>
          <pre class="out">${esc(rA)}</pre>
          <div class="acts">
            <button onclick="abCopy('A')">📋 복사</button>
            <button class="pick" onclick="abPick('A', ${esc(JSON.stringify(topic)).replace(/"/g,'&quot;')})">✅ A 선택!</button>
            <button onclick="abSaveToLib('A')">📁 보관함</button>
          </div>
        </div>
        <div class="ab-col B" data-ab="B">
          <h4><span class="ver">B</span> ${esc(sB)}</h4>
          <div class="meta-row"><span>📏 ${lenB.toLocaleString()}자</span><span>⏱ 약 ${minB}분</span></div>
          <div class="score">AI 점수: ${stars(sc.B)} · 예상 시청 완료율: ${forecastB}</div>
          <pre class="out">${esc(rB)}</pre>
          <div class="acts">
            <button onclick="abCopy('B')">📋 복사</button>
            <button class="pick" onclick="abPick('B', ${esc(JSON.stringify(topic)).replace(/"/g,'&quot;')})">✅ B 선택!</button>
            <button onclick="abSaveToLib('B')">📁 보관함</button>
          </div>
        </div>
      </div>
      <div id="ab-reco"></div>`;
    // 데이터 캐시
    window.__abCache = {A:{text:rA, style:sA, topic}, B:{text:rB, style:sB, topic}, meta:metaJson};
  }
  async function renderRecommendation(topic, rA, rB, sA, sB){
    const reco = by('ab-reco'); if(!reco) return;
    reco.innerHTML = `<div class="ab-reco"><div class="title">🤖 AI 추천 분석 중...</div></div>`;
    try{
      const sys = `당신은 유튜브 콘텐츠 전략가입니다. 두 버전의 대본을 비교하여 다음 형식으로 한국어로 답변:
🤖 AI 추천: [A버전 or B버전]이 더 좋아요!

이유:
✅ (이유 1)
✅ (이유 2)
✅ (이유 3)

[반대 버전]이 더 좋은 경우:
→ (상황 1)
→ (상황 2)`;
      const r = await callAI(sys, `주제: ${topic}\n\n[A버전 - ${sA}]\n${rA.slice(0,1200)}\n\n[B버전 - ${sB}]\n${rB.slice(0,1200)}`,
        {maxTokens:800, featureId:'ab-reco'});
      reco.innerHTML = `<div class="ab-reco"><div class="title">🤖 AI 추천</div>${esc(r)}</div>`;
    }catch(e){ reco.innerHTML = `<div class="ab-reco">❌ AI 추천 실패: ${esc(e.message)}</div>`; }
  }
  window.abCopy = function(ver){
    const d = (window.__abCache||{})[ver]; if(!d) return;
    navigator.clipboard.writeText(d.text).then(()=>{ if(typeof libToast==='function') libToast('📋 '+ver+' 버전 복사됨!'); });
  };
  window.abPick = function(ver, topic){
    const d = (window.__abCache||{})[ver]; if(!d) return;
    document.querySelectorAll('#abScriptSplit .ab-col').forEach(c=>c.classList.remove('sel'));
    const el = document.querySelector(`#abScriptSplit .ab-col[data-ab="${ver}"]`);
    if(el) el.classList.add('sel');
    if(typeof libToast==='function') libToast('✅ '+ver+' 버전 선택!');
    abSaveToLib(ver);
  };
  window.abSaveToLib = function(ver){
    const d = (window.__abCache||{})[ver]; if(!d) return;
    if(typeof window.Library !== 'undefined' && typeof window.Library.saveResult === 'function'){
      window.Library.saveResult({text:d.text, category:'script', lang:ui.scriptLang, title:`[A/B ${ver}] ${d.style} · ${d.topic}`,
        meta:{ab:true, ver, style:d.style}});
    } else {
      alert('보관함 모듈이 없어요. index.html에서 실행해주세요.');
    }
  };

  /* ─ 섹션3: 제목 A/B ─ */
  window.abRunTitles = async function(){
    const topic = (by('ab-title-topic').value||'').trim();
    if(!topic){ alert('주제를 입력해주세요.'); return; }
    const withJp = by('ab-title-jp').checked;
    const out = by('ab-title-out');
    out.innerHTML = `<div class="ab-reco">⏳ 제목 5개 생성 중...</div>`;
    try{
      const sys = `당신은 유튜브 제목 전문가입니다. 주제 기반으로 클릭률(CTR) 높은 한국어 제목 5개를 아래 JSON으로만 답변:
[
 {"title":"...", "stars":5, "reason":"숫자 활용 + 궁금증 유발"${withJp?', "jp":"認知症予防の食べ物TOP5"':''}},
 ...5개...
]
stars는 1~5 정수. reason은 한 문장.`;
      const r = await callAI(sys, `주제: ${topic}`, {maxTokens:1800, featureId:'ab-titles'});
      let arr;
      try{ arr = JSON.parse((r.match(/\[[\s\S]*\]/)||[r])[0]); }catch(_){ arr = null; }
      if(!Array.isArray(arr) || !arr.length){
        out.innerHTML = `<div class="ab-reco">⚠️ 형식 파싱 실패. 응답 원문:<br><br>${esc(r)}</div>`;
        return;
      }
      out.innerHTML = `<div class="ab-titles">` + arr.slice(0,5).map((t,i)=>{
        const s = Math.max(1, Math.min(5, Number(t.stars)||3));
        return `<div class="ab-title-card">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="num">${i+1}</span><span class="stars">${stars(s)}</span>
          </div>
          <div class="tit">${esc(t.title||'')}</div>
          ${t.jp?`<div class="tit" style="font-size:13px;color:#8B5020">🇯🇵 ${esc(t.jp)}</div>`:''}
          <div class="reason">이유: ${esc(t.reason||'')}</div>
          <div class="acts">
            <button class="pri" onclick='abPickTitle(${JSON.stringify(t.title||"")})'>✅ 이 제목 선택</button>
            <button onclick='abCopyText(${JSON.stringify(t.title||"")})'>📋 복사</button>
            ${t.jp?`<button onclick='abCopyText(${JSON.stringify(t.jp)})'>📋 JP 복사</button>`:''}
          </div>
        </div>`;
      }).join('') + `</div>`;
    }catch(e){ out.innerHTML = `<div class="ab-reco">❌ ${esc(e.message)}</div>`; }
  };
  window.abCopyText = function(t){ navigator.clipboard.writeText(t).then(()=>{ if(typeof libToast==='function') libToast('📋 복사됨!'); }); };
  window.abPickTitle = function(t){
    if(typeof window.Library !== 'undefined' && typeof window.Library.saveResult === 'function'){
      window.Library.saveResult({text:t, category:'other', lang:'ko', title:'[A/B 선택 제목] '+t.slice(0,40), meta:{ab:true, type:'title'}});
    }
    if(typeof libToast==='function') libToast('✅ 제목 저장됨! 보관함에서 확인하세요.');
  };

  /* ─ 섹션3b: 썸네일 문구 A/B ─ */
  window.abRunThumbs = async function(){
    const topic = (by('ab-thumb-topic').value||'').trim();
    if(!topic){ alert('영상 주제를 입력해주세요.'); return; }
    const dirA = (by('ab-thumb-A').value||'').trim() || '강렬·경고형';
    const dirB = (by('ab-thumb-B').value||'').trim() || '숫자·친근형';
    const out = by('ab-thumb-out');
    out.innerHTML = `<div class="ab-split">
      <div class="ab-col A"><h4><span class="ver">A</span> ${esc(dirA)}</h4><div class="style-chip">⏳</div></div>
      <div class="ab-col B"><h4><span class="ver">B</span> ${esc(dirB)}</h4><div class="style-chip">⏳</div></div>
    </div>`;
    try{
      const sys = `당신은 유튜브 썸네일 카피 전문가입니다. 주어진 방향에 맞춰 CTR 높은 한국어 썸네일 문구 3개를 짧게(각 10~18자) 줄바꿈으로 제안하세요. 숫자·대비·감정 활용.`;
      const [rA, rB] = await Promise.all([
        callAI(sys, `주제: ${topic}\n방향: ${dirA}`, {maxTokens:500, featureId:'ab-thumb-A'}).catch(e=>'❌ '+e.message),
        callAI(sys, `주제: ${topic}\n방향: ${dirB}`, {maxTokens:500, featureId:'ab-thumb-B'}).catch(e=>'❌ '+e.message)
      ]);
      out.innerHTML = `<div class="ab-split">
        <div class="ab-col A">
          <h4><span class="ver">A</span> ${esc(dirA)}</h4>
          <pre class="out">${esc(rA)}</pre>
          <div class="acts"><button onclick='abCopyText(${JSON.stringify(rA)})'>📋 복사</button></div>
        </div>
        <div class="ab-col B">
          <h4><span class="ver">B</span> ${esc(dirB)}</h4>
          <pre class="out">${esc(rB)}</pre>
          <div class="acts"><button onclick='abCopyText(${JSON.stringify(rB)})'>📋 복사</button></div>
        </div>
      </div>`;
    }catch(e){ out.innerHTML = `<div class="ab-reco">❌ ${esc(e.message)}</div>`; }
  };

  /* ─ 섹션4: 한·일 비교 ─ */
  window.abRunLang = async function(){
    const src = (by('ab-lang-input').value||'').trim();
    if(!src){ alert('한국어 대본 또는 주제를 입력해주세요.'); return; }
    const out = by('ab-lang-out');
    out.innerHTML = `<div class="ab-split">
      <div class="ab-col A"><h4><span class="ver">KO</span> 🇰🇷 한국어</h4><div class="style-chip">⏳</div></div>
      <div class="ab-col B"><h4><span class="ver">JP</span> 🇯🇵 일본어</h4><div class="style-chip">⏳</div></div>
    </div>`;
    try{
      const sysK = '시니어 친화 한국어 대본 작가. 따뜻하고 쉬운 단어, 천천히 설명하는 구조.';
      const sysJ = '日本のシニア向け台本作家。敬体(です・ます), 季節感, 共感を大切に、やさしい言葉で丁寧に。';
      const [rK, rJ] = await Promise.all([
        callAI(sysK, src, {maxTokens:1600, featureId:'ab-lang-ko'}).catch(e=>'❌ '+e.message),
        callAI(sysJ, src, {maxTokens:1600, featureId:'ab-lang-jp'}).catch(e=>'❌ '+e.message)
      ]);
      out.innerHTML = `<div class="ab-split">
        <div class="ab-col A">
          <h4><span class="ver">KO</span> 🇰🇷 한국어</h4>
          <pre class="out" id="ab-lang-ko-out" contenteditable="true">${esc(rK)}</pre>
          <div class="acts"><button onclick='abCopyFromEl("ab-lang-ko-out")'>📋 복사</button><button onclick="abSaveLang('ko')">📁 보관함</button></div>
        </div>
        <div class="ab-col B">
          <h4><span class="ver">JP</span> 🇯🇵 일본어</h4>
          <pre class="out" id="ab-lang-jp-out" contenteditable="true">${esc(rJ)}</pre>
          <div class="acts"><button onclick='abCopyFromEl("ab-lang-jp-out")'>📋 복사</button><button onclick="abSaveLang('jp')">📁 보관함</button></div>
        </div>
      </div>
      <button class="ab-go" style="margin-top:10px" onclick="abCheckTrans()">🔍 번역이 자연스러운지 확인</button>
      <div id="ab-lang-check"></div>`;
      window.__abCache = {ko:rK, jp:rJ};
    }catch(e){ out.innerHTML = `<div class="ab-reco">❌ ${esc(e.message)}</div>`; }
  };
  window.abCopyFromEl = function(id){
    const el = document.getElementById(id); if(!el) return;
    navigator.clipboard.writeText(el.innerText).then(()=>{ if(typeof libToast==='function') libToast('📋 복사됨!'); });
  };
  window.abSaveLang = function(lang){
    const el = document.getElementById(lang==='ko'?'ab-lang-ko-out':'ab-lang-jp-out');
    if(!el) return;
    if(typeof window.Library !== 'undefined'){
      window.Library.saveResult({text:el.innerText, category:'trans', lang, title:`[한·일 비교 ${lang.toUpperCase()}] `+el.innerText.slice(0,30), meta:{ab:true, type:'lang'}});
    }
  };
  window.abCheckTrans = async function(){
    const ko = (by('ab-lang-ko-out')||{}).innerText;
    const jp = (by('ab-lang-jp-out')||{}).innerText;
    const box = by('ab-lang-check');
    if(!box) return;
    box.innerHTML = `<div class="ab-trans-issue">⏳ 번역 자연스러움 체크 중...</div>`;
    try{
      const sys = '당신은 한일 번역 감수자입니다. 두 버전을 비교해 어색한 표현이 있는지 한국어로 간단히 지적하고 개선 제안을 해주세요.';
      const r = await callAI(sys, `[한국어]\n${ko}\n\n[日本語]\n${jp}`, {maxTokens:900, featureId:'ab-trans-check'});
      box.innerHTML = `<div class="ab-trans-issue">🔍 번역 체크 결과\n\n${esc(r)}</div>`;
    }catch(e){ box.innerHTML = `<div class="ab-trans-issue">❌ ${esc(e.message)}</div>`; }
  };

  /* ─ 섹션5: 말투 A/B ─ */
  window.abRunTone = async function(){
    const topic = (by('ab-tone-topic').value||'').trim();
    if(!topic){ alert('주제를 입력해주세요.'); return; }
    const tA = ui.toneA, tB = ui.toneB;
    if(tA===tB){ alert('A와 B는 다른 말투를 선택해주세요.'); return; }
    const out = by('ab-tone-out');
    out.innerHTML = `<div class="ab-split">
      <div class="ab-col A"><h4><span class="ver">A</span> ${esc(TONE_LABEL[tA])}</h4><div class="style-chip">⏳</div></div>
      <div class="ab-col B"><h4><span class="ver">B</span> ${esc(TONE_LABEL[tB])}</h4><div class="style-chip">⏳</div></div>
    </div>`;
    try{
      const [rA, rB] = await Promise.all([
        callAI(TONE_SYS[tA]+'\n[언어] 반드시 한국어.', `주제: ${topic}\n분량: 약 400~600자.`, {maxTokens:1200, featureId:'ab-tone-A'}).catch(e=>'❌ '+e.message),
        callAI(TONE_SYS[tB]+'\n[언어] 반드시 한국어.', `주제: ${topic}\n분량: 약 400~600자.`, {maxTokens:1200, featureId:'ab-tone-B'}).catch(e=>'❌ '+e.message)
      ]);
      out.innerHTML = `<div class="ab-split">
        <div class="ab-col A">
          <h4><span class="ver">A</span> ${esc(TONE_LABEL[tA])}</h4>
          <pre class="out">${esc(rA)}</pre>
          <div class="acts">
            <button onclick='abCopyText(${JSON.stringify(rA)})'>📋 복사</button>
            <button class="pick" onclick='abSaveTone(${JSON.stringify(rA)}, ${JSON.stringify(TONE_LABEL[tA])})'>✅ A 선택</button>
          </div>
        </div>
        <div class="ab-col B">
          <h4><span class="ver">B</span> ${esc(TONE_LABEL[tB])}</h4>
          <pre class="out">${esc(rB)}</pre>
          <div class="acts">
            <button onclick='abCopyText(${JSON.stringify(rB)})'>📋 복사</button>
            <button class="pick" onclick='abSaveTone(${JSON.stringify(rB)}, ${JSON.stringify(TONE_LABEL[tB])})'>✅ B 선택</button>
          </div>
        </div>
      </div>`;
    }catch(e){ out.innerHTML = `<div class="ab-reco">❌ ${esc(e.message)}</div>`; }
  };
  window.abSaveTone = function(text, tone){
    if(typeof window.Library !== 'undefined'){
      window.Library.saveResult({text, category:'script', lang:'ko', title:`[말투 A/B] ${tone}`, meta:{ab:true, type:'tone', tone}});
    }
    if(typeof libToast==='function') libToast('✅ 선택됨! 보관함에 저장.');
  };

  /* ─ 섹션6: 테스트 기록 ─ */
  window.abAddLog = function(){
    const topic = prompt('테스트 주제 (예: 치매 예방 음식)'); if(!topic) return;
    const styleA = prompt('A버전 스타일 (예: 감동형)', '감동형'); if(styleA===null) return;
    const styleB = prompt('B버전 스타일 (예: 정보형)', '정보형'); if(styleB===null) return;
    const viewA = parseInt(prompt('A버전 조회수 (숫자만)','0'),10)||0;
    const viewB = parseInt(prompt('B버전 조회수 (숫자만)','0'),10)||0;
    const list = read(LS_LOG, []);
    list.unshift({id:'l'+Date.now(), topic, styleA, styleB, viewA, viewB, at:Date.now(),
      winner: viewA===viewB ? null : (viewA>viewB ? 'A':'B')});
    write(LS_LOG, list);
    renderLog();
    if(typeof libToast==='function') libToast('📊 기록 저장됨!');
  };
  window.abDeleteLog = function(id){
    if(!confirm('이 기록을 삭제할까요?')) return;
    write(LS_LOG, read(LS_LOG, []).filter(x=>x.id!==id));
    renderLog();
  };
  window.abExportLog = function(){
    const list = read(LS_LOG, []);
    if(!list.length){ alert('내보낼 기록이 없어요.'); return; }
    const blob = new Blob([JSON.stringify({version:1,exportedAt:Date.now(),log:list}, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const d=new Date(); const p=n=>String(n).padStart(2,'0');
    a.download = `AB_테스트_기록_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 500);
  };
  function fmtD(ts){ const d=new Date(ts); return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`; }
  function renderLog(){
    const list = read(LS_LOG, []);
    const box = by('ab-log-list'); const sbox = by('ab-log-stats');
    if(!box) return;
    if(!list.length){
      box.innerHTML = `<div class="ab-reco" style="background:#fff9fc;border-color:#f1dce7;color:#7b4060"><div class="title">📊 아직 기록이 없어요</div>[+ 테스트 결과 기록하기] 버튼으로 A/B 테스트 결과를 적어두면 내 채널 승률 통계가 만들어져요.</div>`;
      if(sbox) sbox.innerHTML = '';
      return;
    }
    box.innerHTML = list.map(x=>`<div class="ab-log-card">
      <h5>📊 ${esc(x.topic)}</h5>
      <div class="row"><span>${fmtD(x.at)}</span><button style="padding:4px 10px;border:1px solid #f0b8b8;background:#fff5f5;color:#b04040;border-radius:999px;font-size:10px;font-weight:800;cursor:pointer" onclick="abDeleteLog('${x.id}')">🗑</button></div>
      <div class="row"><span>A버전 (${esc(x.styleA)})</span><span>조회수 ${x.viewA.toLocaleString()}</span></div>
      <div class="row"><span>B버전 (${esc(x.styleB)})</span><span>조회수 ${x.viewB.toLocaleString()}</span></div>
      ${x.winner?`<div class="win">🏆 승자: ${x.winner}버전 (${esc(x.winner==='A'?x.styleA:x.styleB)})</div>`:'<div class="win" style="background:#eee;color:#5a5a5a">무승부</div>'}
    </div>`).join('');

    // 스타일별 승률 집계
    const wins = {};
    list.forEach(x=>{
      if(!x.winner) return;
      const winStyle = x.winner==='A'?x.styleA:x.styleB;
      const loseStyle = x.winner==='A'?x.styleB:x.styleA;
      wins[winStyle] = wins[winStyle] || {w:0,l:0};
      wins[loseStyle] = wins[loseStyle] || {w:0,l:0};
      wins[winStyle].w++; wins[loseStyle].l++;
    });
    const ranks = Object.keys(wins).map(k=>{
      const t = wins[k].w + wins[k].l;
      return {style:k, rate: t? Math.round(wins[k].w/t*100) : 0, n:t};
    }).sort((a,b)=>b.rate-a.rate);
    if(ranks.length && sbox){
      const medals = ['🥇','🥈','🥉'];
      sbox.innerHTML = `<div class="ab-stats">
        <h4>📈 내 채널에서 잘되는 스타일</h4>
        ${ranks.slice(0,5).map((r,i)=>`<div class="line"><span>${medals[i]||'•'} ${esc(r.style)}</span><span>승률 ${r.rate}% (${r.n}회)</span></div>`).join('')}
        <div class="ai-hint">🤖 AI 학습 결과: "${esc(ranks[0].style)}이(가) 당신 채널과 가장 잘 맞아요!"</div>
      </div>`;
    } else if(sbox){ sbox.innerHTML = ''; }
  }

  console.log('✅ ⚖️ A/B 비교 센터 로드 완료');
})();
