/* intent-system.js
   의도 반영 시스템 — 사용자는 입력창 하나만 보면 되고, 나머지는 전부 백그라운드에서 처리.

   기능:
   - 입력 텍스트 자동 문맥 분석 (편지/SNS/대본/보고서/숙제/일본어/광고 등)
   - 가족·역할 프로필 저장/전환 (localStorage)
   - "나처럼 써줘" 글 샘플 3개 저장 → 스타일 학습
   - APIAdapter.callAI 자동 래핑: 시스템 프롬프트에 문맥·프로필·스타일 자동 주입
   - 프로필 스위처 아이콘·모달 렌더 헬퍼
*/
(function(){
  const LS_PROFILES = 'intent_profiles_v1';
  const LS_ACTIVE   = 'intent_active_profile_v1';
  const LS_SAMPLES  = 'intent_style_samples_v1';

  /* ─ 기본 프로필 ─ */
  const DEFAULT_PROFILES = [
    {id:'default', name:'기본', emoji:'✍️', age:'adult', role:'other', tone:'friendly', memo:''}
  ];
  const AGE_HINTS = {
    'u7':     '7세 이하 대상. 아주 짧게, 한 문장당 10자 이내, 의성어·의태어 활용, 그림이 보이는 듯한 쉬운 설명.',
    'elem':   '초등학생 대상. 짧고 재미있게, 예시와 이모지 풍부하게, 쉬운 단어만.',
    'teen':   '중·고등학생 대상. 친구에게 말하듯 자연스럽게, 트렌디한 톤, 공감 포인트 적극 활용.',
    'adult':  '성인 대상. 목적에 맞게 자유롭게 작성. 불필요한 설명은 생략.',
    'senior': '시니어 대상. 천천히, 쉬운 단어, 따뜻한 어투. 한 문장은 짧게, 전문 용어는 풀어서 설명.'
  };
  const ROLE_HINTS = {
    youtuber: '유튜브/틱톡 크리에이터 관점. 훅-몰입-CTA 구조와 후킹 멘트, 채널 톤 유지.',
    smb:      '소상공인·자영업자 관점. 친근하고 밝게, 혜택/오늘의 한정/고객 참여 유도 포함.',
    public:   '공무원·공공기관 관점. 격식 있는 어투, 정확한 수치·근거, 객관적 문장.',
    student:  '학생·학부모 관점. 쉽고 재미있게, 학습 목적에 맞춘 구조, 예시 충분히.',
    worker:   '직장인·프리랜서 관점. 목적 달성 중심, 정중한 어투, 간결·명료.',
    other:    ''
  };
  const TONE_HINTS = {
    friendly:     '친근하고 다정한 어투.',
    professional: '전문적이고 객관적인 격식체.',
    emotional:    '감성적이고 따뜻한 어투, 공감 포인트 풍부하게.',
    formal:       '격식체·존댓말, 공식 문서 스타일.'
  };

  function read(k, d){ try{ return JSON.parse(localStorage.getItem(k)||JSON.stringify(d)); }catch(_){ return d; } }
  function write(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(_){} }

  /* ─ 프로필 CRUD ─ */
  function getProfiles(){
    const list = read(LS_PROFILES, null);
    if(!list || !list.length){ write(LS_PROFILES, DEFAULT_PROFILES); return DEFAULT_PROFILES.slice(); }
    return list;
  }
  function getActiveId(){
    const id = localStorage.getItem(LS_ACTIVE);
    if(id) return id;
    return 'default';
  }
  function getActiveProfile(){
    const list = getProfiles();
    return list.find(x => x.id === getActiveId()) || list[0];
  }
  function setActiveId(id){ localStorage.setItem(LS_ACTIVE, id); }
  function saveProfile(p){
    const list = getProfiles();
    const idx = list.findIndex(x=>x.id===p.id);
    if(idx<0) list.push(p); else list[idx] = Object.assign(list[idx], p);
    write(LS_PROFILES, list);
  }
  function deleteProfile(id){
    if(id==='default'){ alert('기본 프로필은 삭제할 수 없어요.'); return; }
    write(LS_PROFILES, getProfiles().filter(x=>x.id!==id));
    if(getActiveId()===id) setActiveId('default');
  }

  /* ─ 스타일 샘플 ─ */
  function getSamples(){ return read(LS_SAMPLES, ['','','']); }
  function saveSamples(arr){ write(LS_SAMPLES, (arr||[]).slice(0,3).map(x=>String(x||''))); }
  function hasSamples(){ return getSamples().some(x => x && x.trim().length > 20); }

  /* ─ 입력 텍스트 자동 문맥 감지 ─ */
  const CTX_RULES = [
    {k:/감사|편지|사랑|마음|고마움|위로|축하|결혼|생일|추모|안부/, tag:'emotional',
      hint:'따뜻하고 진심이 담긴 어투. 과하지 않게, 담백하게 감정을 표현.'},
    {k:/카페|식당|가게|매장|메뉴|고객|SNS|인스타|instagram|블로그|페이스북/i, tag:'smb',
      hint:'친근하고 밝은 어투. 가게 특색·혜택·방문 유도 포인트 자연스럽게 포함.'},
    {k:/유튜브|youtube|숏츠|shorts|대본|채널|영상|틱톡|tiktok|롱폼/i, tag:'script',
      hint:'영상 시청자 관점. 3초 훅 → 몰입 구간 → 행동 유도(CTA) 구조. 구어체·짧은 문장.'},
    {k:/보고서|공문|공공|법원|조사|기관|기안|민원|정책|결재|안건|공지/, tag:'public',
      hint:'격식체·객관적 문체. 사실·수치·근거 중심. 정중한 존댓말.'},
    {k:/숙제|일기|독후감|초등|학생|학교|수행|발표|독서록|과학탐구/, tag:'edu',
      hint:'학생 눈높이. 쉬운 단어, 예시 풍부하게, 재미 요소 포함.'},
    {k:/일본어|日本語|日本|にほん/i, tag:'lang-jp',
      hint:'[언어] 반드시 일본어로 작성. 경어체(です・ます体), 자연스러운 일본식 어휘.'},
    {k:/한일|한국어\s*[\+와]\s*일본어|동시|kojp/i, tag:'lang-kojp',
      hint:'[언어] 한국어 먼저, 빈 줄 뒤에 일본어 버전 동시 작성.'},
    {k:/광고|홍보|마케팅|카피|세일|할인|프로모션/, tag:'ads',
      hint:'설득력 있는 어투. 혜택-차별점-CTA 구조, 구체적 수치·한정 표현 활용.'},
    {k:/요약|정리|분석|핵심|비교|차이/, tag:'summary',
      hint:'간결하고 명확하게. 불릿 포인트·번호 매김 활용, 군더더기 제거.'},
    {k:/블로그|포스팅|SEO|검색|네이버|티스토리/i, tag:'blog',
      hint:'SEO 친화 구조. 소제목(H2) 분리, 도입-본문-결론, 이미지 삽입 지점 [이미지] 태그.'},
    {k:/번역|translate|translation/i, tag:'translate',
      hint:'자연스러운 번역. 원문 의미 유지하되 목표 언어 관용 표현 활용.'}
  ];
  function detectContext(text){
    const t = String(text||'');
    const matched = [];
    for(const r of CTX_RULES){
      if(r.k.test(t)) matched.push(r);
    }
    return matched;
  }

  /* ─ 시스템 프롬프트 합성 ─ */
  function buildSystemPrompt(userInput, extraOpts){
    const lines = [];
    const p = getActiveProfile();
    const ctxs = detectContext(userInput);

    lines.push('당신은 사용자의 요청을 보고 가장 자연스럽고 목적에 맞는 글을 작성하는 전문가입니다.');
    lines.push('사용자가 명시하지 않은 세부 설정은 글 종류·맥락에 따라 스스로 최적화해서 작성하세요.');

    // 문맥
    if(ctxs.length){
      lines.push('\n[자동 감지된 문맥]');
      ctxs.forEach(c => lines.push('• '+c.hint));
    }

    // 프로필
    if(p){
      const bits = [];
      if(p.name && p.name !== '기본') bits.push(`이름·별명: ${p.name}`);
      if(AGE_HINTS[p.age]) bits.push(AGE_HINTS[p.age]);
      if(ROLE_HINTS[p.role]) bits.push(ROLE_HINTS[p.role]);
      if(TONE_HINTS[p.tone]) bits.push(TONE_HINTS[p.tone]);
      if(p.memo) bits.push(`메모: ${p.memo}`);
      if(bits.length){
        lines.push('\n[현재 사용자 프로필]');
        bits.forEach(b => lines.push('• '+b));
      }
    }

    // 스타일 샘플
    if(hasSamples()){
      const samples = getSamples().filter(s => s && s.trim().length > 20).slice(0,3);
      lines.push('\n[사용자 평소 글쓰기 스타일 샘플 — 어휘·호흡·문장 길이를 이와 비슷하게]');
      samples.forEach((s,i) => lines.push(`— 샘플 ${i+1} —\n${s.slice(0,600)}`));
    }

    // 추가 옵션 (예: 다시쓰기/짧게/길게/사용자 지시)
    if(extraOpts && extraOpts.refineInstruction){
      lines.push('\n[수정 지시 — 반드시 반영]');
      lines.push(extraOpts.refineInstruction);
    }
    if(extraOpts && extraOpts.lengthHint){
      lines.push('\n[길이 지시] '+extraOpts.lengthHint);
    }

    return lines.join('\n');
  }

  /* ─ AI 호출 헬퍼 ─ */
  function ensureAdapter(){
    if(typeof APIAdapter === 'undefined') return null;
    try{
      if(typeof AI_PROVIDER !== 'undefined') APIAdapter.setProvider(AI_PROVIDER);
      const _ck=localStorage.getItem('uc_claude_key'); if(_ck) APIAdapter.setApiKey('claude',_ck);
      const _ok=localStorage.getItem('uc_openai_key'); if(_ok) APIAdapter.setApiKey('openai',_ok);
      const _gk=localStorage.getItem('uc_gemini_key'); if(_gk) APIAdapter.setApiKey('gemini',_gk);
    }catch(_){}
    return APIAdapter;
  }
  async function runIntent(userInput, opts){
    opts = opts || {};
    const A = ensureAdapter();
    if(!A) throw new Error('core/api-adapter.js 로드가 필요해요.');
    const sys = buildSystemPrompt(userInput, opts);
    const user = opts.baseText
      ? `[기존 결과]\n${opts.baseText}\n\n[사용자 요청]\n${userInput}`
      : userInput;
    return A.callAI(sys, user, {maxTokens: opts.maxTokens || 2400, featureId: opts.featureId || 'intent'});
  }

  /* ─ 프로필 스위처 아이콘 (상단 우측 등에 마운트) ─ */
  function renderProfileBadge(container){
    const el = (typeof container==='string') ? document.getElementById(container) : container;
    if(!el) return;
    const p = getActiveProfile();
    el.innerHTML = `<button class="intent-badge" title="프로필: ${escapeHtml(p.name||'기본')}" onclick="IntentSystem.openPicker()">${escapeHtml(p.emoji||'✍️')}</button>`;
  }
  function openPicker(){
    const list = getProfiles();
    const active = getActiveId();
    const html = `<div class="intent-modal-backdrop" onclick="IntentSystem.closePicker()"></div>
      <div class="intent-modal">
        <div class="intent-modal-head">
          <h4>프로필 선택</h4>
          <button class="close" onclick="IntentSystem.closePicker()">✕</button>
        </div>
        <div class="intent-profile-grid">
          ${list.map(p=>`<button class="intent-profile-card ${p.id===active?'on':''}" onclick="IntentSystem.selectProfile('${p.id}')">
            <span class="emo">${escapeHtml(p.emoji||'✍️')}</span>
            <strong>${escapeHtml(p.name||'')}</strong>
            <span class="role">${escapeHtml(labelRole(p.role))}</span>
          </button>`).join('')}
        </div>
        <div class="intent-modal-foot">
          <button class="gh" onclick="IntentSystem.openManager()">⚙️ 프로필 관리</button>
          <button class="gh" onclick="IntentSystem.closePicker()">닫기</button>
        </div>
      </div>`;
    const wrap = ensureModalRoot();
    wrap.innerHTML = html;
    wrap.classList.add('on');
  }
  function closePicker(){ const m = document.getElementById('intentModalRoot'); if(m){ m.classList.remove('on'); m.innerHTML=''; } }
  function selectProfile(id){ setActiveId(id); closePicker(); refreshBadges(); notifyChange(); }
  function ensureModalRoot(){
    let m = document.getElementById('intentModalRoot');
    if(!m){ m = document.createElement('div'); m.id = 'intentModalRoot'; document.body.appendChild(m); }
    return m;
  }
  function refreshBadges(){
    document.querySelectorAll('[data-intent-badge]').forEach(el=>renderProfileBadge(el));
  }
  function notifyChange(){
    try{ window.dispatchEvent(new CustomEvent('intent:profile-change', {detail:getActiveProfile()})); }catch(_){}
  }

  /* ─ 프로필 관리 패널 HTML (설정 탭 등에 마운트) ─ */
  function renderProfileManager(containerId){
    const el = document.getElementById(containerId); if(!el) return;
    const list = getProfiles();
    const active = getActiveId();
    const samples = getSamples();
    el.innerHTML = `
      <div class="intent-mgr">
        <div class="intent-mgr-head">
          <h4>🪪 프로필 & 스타일</h4>
          <p class="sub">설정해두면 다음 생성부터 자동 반영돼요 · 메인에서는 보이지 않아요</p>
        </div>
        <div class="intent-profile-list">
          ${list.map(p=>`<div class="intent-pcard ${p.id===active?'on':''}">
            <span class="emo">${escapeHtml(p.emoji||'✍️')}</span>
            <div class="info">
              <strong>${escapeHtml(p.name||'')}</strong>
              <span>${escapeHtml(labelRole(p.role))} · ${escapeHtml(labelAge(p.age))} · ${escapeHtml(labelTone(p.tone))}</span>
            </div>
            <div class="ops">
              ${p.id!==active?`<button onclick="IntentSystem.selectProfile('${p.id}')">선택</button>`:'<span class="active-pill">선택중</span>'}
              <button onclick="IntentSystem.editProfile('${p.id}')">수정</button>
              ${p.id!=='default'?`<button class="warn" onclick="IntentSystem.removeProfile('${p.id}')">🗑</button>`:''}
            </div>
          </div>`).join('')}
        </div>
        <button class="intent-add-btn" onclick="IntentSystem.openEditor()">＋ 새 프로필 추가</button>

        <div class="intent-editor" id="intentEditor" style="display:none"></div>

        <div class="intent-style">
          <h4>🧠 나처럼 써줘 (선택사항)</h4>
          <p class="sub">내가 평소에 쓴 글을 3개까지 넣어두면, AI가 내 말투·호흡·어휘를 따라 써드려요.</p>
          <textarea id="intentSample1" placeholder="글 샘플 1 — 100자 이상 권장" rows="3">${escapeHtml(samples[0]||'')}</textarea>
          <textarea id="intentSample2" placeholder="글 샘플 2 (선택)" rows="3">${escapeHtml(samples[1]||'')}</textarea>
          <textarea id="intentSample3" placeholder="글 샘플 3 (선택)" rows="3">${escapeHtml(samples[2]||'')}</textarea>
          <div class="row">
            <button class="intent-btn pri" onclick="IntentSystem.saveSamplesFromUI()">🧠 내 스타일 저장</button>
            <button class="intent-btn gh" onclick="IntentSystem.clearSamples()">초기화</button>
            <span class="hint">${hasSamples()?'✅ 저장됨 — 다음 생성부터 자동 반영':'저장 전 — 필요할 때 입력하세요'}</span>
          </div>
        </div>
      </div>`;
  }

  function openEditor(existingId){
    const editBox = document.getElementById('intentEditor');
    if(!editBox){ openManager(); return; }
    const p = existingId ? getProfiles().find(x=>x.id===existingId) : {id:'p'+Date.now().toString(36), name:'', emoji:'👤', age:'adult', role:'other', tone:'friendly', memo:''};
    if(!p) return;
    editBox.innerHTML = `
      <h5>${existingId?'프로필 수정':'새 프로필'}</h5>
      <label>이름·별명</label>
      <input id="ipName" value="${escapeHtml(p.name||'')}" placeholder="예: 아빠 / 카페 사장 / 큰딸">
      <label>나이대</label>
      <div class="pill-row" data-field="age">
        ${['u7','elem','teen','adult','senior'].map(k=>`<button type="button" class="pill ${p.age===k?'on':''}" data-v="${k}">${escapeHtml(labelAge(k))}</button>`).join('')}
      </div>
      <label>역할</label>
      <div class="pill-row" data-field="role">
        ${Object.keys(ROLE_HINTS).map(k=>`<button type="button" class="pill ${p.role===k?'on':''}" data-v="${k}">${escapeHtml(labelRole(k))}</button>`).join('')}
      </div>
      <label>기본 말투</label>
      <div class="pill-row" data-field="tone">
        ${Object.keys(TONE_HINTS).map(k=>`<button type="button" class="pill ${p.tone===k?'on':''}" data-v="${k}">${escapeHtml(labelTone(k))}</button>`).join('')}
      </div>
      <label>이모지</label>
      <div class="pill-row" data-field="emoji">
        ${['👴','👩','🧒','👧','👦','🎅','👨‍💼','👩‍🎓','🎨','🏪','🏛️','📺','✍️'].map(e=>`<button type="button" class="pill emo ${p.emoji===e?'on':''}" data-v="${e}">${e}</button>`).join('')}
      </div>
      <label>메모 (선택)</label>
      <input id="ipMemo" value="${escapeHtml(p.memo||'')}" placeholder="예: 50대, 유튜브 채널명 ○○, 독자는 30~50대 여성">
      <div class="row" style="margin-top:10px">
        <button class="intent-btn pri" onclick='IntentSystem.submitEditor(${JSON.stringify(p.id)})'>저장</button>
        <button class="intent-btn gh" onclick="document.getElementById('intentEditor').style.display='none'">취소</button>
      </div>`;
    editBox.style.display = 'block';
    // Pill 선택 바인딩
    editBox.querySelectorAll('.pill-row').forEach(row=>{
      row.addEventListener('click', (e)=>{
        const b = e.target.closest('.pill'); if(!b) return;
        row.querySelectorAll('.pill').forEach(x=>x.classList.remove('on'));
        b.classList.add('on');
        row.dataset.value = b.dataset.v;
      });
      row.dataset.value = (p[row.dataset.field]||'');
    });
  }
  function submitEditor(id){
    const box = document.getElementById('intentEditor'); if(!box) return;
    const get = (f)=>{ const el=box.querySelector('.pill-row[data-field="'+f+'"]'); return el && el.dataset.value; };
    const p = {
      id: id || ('p'+Date.now().toString(36)),
      name: (box.querySelector('#ipName').value||'').trim() || '이름 없음',
      emoji: get('emoji') || '👤',
      age: get('age') || 'adult',
      role: get('role') || 'other',
      tone: get('tone') || 'friendly',
      memo: (box.querySelector('#ipMemo').value||'').trim()
    };
    saveProfile(p);
    box.style.display = 'none';
    // 관리 패널 다시 그리기 (현재 마운트 컨테이너 찾아서)
    const host = box.closest('.intent-mgr');
    if(host && host.parentElement && host.parentElement.id){
      renderProfileManager(host.parentElement.id);
    }
    refreshBadges();
    notifyChange();
  }
  function editProfile(id){ openEditor(id); document.getElementById('intentEditor')?.scrollIntoView({behavior:'smooth', block:'center'}); }
  function removeProfile(id){
    if(!confirm('이 프로필을 삭제할까요?')) return;
    deleteProfile(id);
    const box = document.querySelector('.intent-mgr'); if(box && box.parentElement && box.parentElement.id) renderProfileManager(box.parentElement.id);
    refreshBadges(); notifyChange();
  }
  function saveSamplesFromUI(){
    const s1 = (document.getElementById('intentSample1')||{}).value || '';
    const s2 = (document.getElementById('intentSample2')||{}).value || '';
    const s3 = (document.getElementById('intentSample3')||{}).value || '';
    saveSamples([s1,s2,s3]);
    const box = document.querySelector('.intent-mgr'); if(box && box.parentElement && box.parentElement.id) renderProfileManager(box.parentElement.id);
  }
  function clearSamples(){ if(!confirm('스타일 샘플을 모두 지울까요?')) return; saveSamples(['','','']); const box = document.querySelector('.intent-mgr'); if(box && box.parentElement && box.parentElement.id) renderProfileManager(box.parentElement.id); }
  function openManager(){
    // 관리 패널을 모달로 표시 (설정 탭에 마운트된 경우가 아니라면)
    const wrap = ensureModalRoot();
    wrap.innerHTML = `<div class="intent-modal-backdrop" onclick="IntentSystem.closePicker()"></div>
      <div class="intent-modal" style="max-width:560px">
        <div class="intent-modal-head">
          <h4>🪪 프로필 관리</h4>
          <button class="close" onclick="IntentSystem.closePicker()">✕</button>
        </div>
        <div id="intentMgrInline"></div>
      </div>`;
    wrap.classList.add('on');
    renderProfileManager('intentMgrInline');
  }

  /* ─ Labels ─ */
  function labelAge(k){ return ({u7:'🐣 7세이하', elem:'🌱 초등', teen:'🌿 중고생', adult:'🌳 성인', senior:'🍂 시니어'}[k])||k||''; }
  function labelRole(k){ return ({youtuber:'유튜버', smb:'소상공인', public:'공무원', student:'학생·학부모', worker:'직장인·프리랜서', other:'기타'}[k])||k||''; }
  function labelTone(k){ return ({friendly:'친근하게', professional:'전문적으로', emotional:'감성적으로', formal:'격식체'}[k])||k||''; }
  function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  /* ─ 스타일 주입 ─ */
  function injectStyles(){
    if(document.getElementById('intentSystemStyles')) return;
    const css = `
      .intent-badge{width:36px;height:36px;border-radius:50%;border:2px solid #e8a6c6;background:#fff;
        font-size:18px;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;justify-content:center}
      .intent-badge:hover{transform:scale(1.08);background:#fff0f8}
      #intentModalRoot{position:fixed;inset:0;z-index:10200;display:none;align-items:center;justify-content:center;padding:20px}
      #intentModalRoot.on{display:flex}
      .intent-modal-backdrop{position:absolute;inset:0;background:rgba(30,18,30,.55);backdrop-filter:blur(3px)}
      .intent-modal{position:relative;background:#fff;border-radius:20px;max-width:460px;width:100%;max-height:88vh;overflow:auto;
        box-shadow:0 20px 50px rgba(30,18,30,.3);display:flex;flex-direction:column}
      .intent-modal-head{padding:16px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1dce7}
      .intent-modal-head h4{margin:0;font-size:16px}
      .intent-modal-head .close{border:none;background:transparent;font-size:18px;color:#7b7077;cursor:pointer;padding:4px 8px;border-radius:999px}
      .intent-modal-head .close:hover{background:#fff0f8}
      .intent-modal-foot{padding:12px 18px;border-top:1px solid #f1dce7;display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}
      .intent-modal-foot .gh{padding:8px 14px;border:1px solid #f1dce7;background:#fff;border-radius:999px;cursor:pointer;font-size:12px;font-weight:800;color:#5a4a56}
      .intent-profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:14px 18px}
      .intent-profile-card{padding:14px;background:#fff;border:2px solid #f1dce7;border-radius:14px;cursor:pointer;
        display:flex;flex-direction:column;gap:4px;text-align:center;font-family:inherit;transition:.15s}
      .intent-profile-card:hover{border-color:#e8a6c6;background:#fff0f8}
      .intent-profile-card.on{border-color:#ef6fab;background:linear-gradient(135deg,#fff0f8,#f4eaff);box-shadow:0 6px 18px rgba(232,166,198,.25)}
      .intent-profile-card .emo{font-size:28px}
      .intent-profile-card strong{font-size:13px}
      .intent-profile-card .role{font-size:10px;color:#7b7077}
      .intent-mgr{padding:10px 0}
      .intent-mgr-head h4{margin:0 0 4px;font-size:15px}
      .intent-mgr-head .sub{margin:0 0 12px;font-size:12px;color:#7b7077}
      .intent-profile-list{display:grid;gap:8px;margin-bottom:10px}
      .intent-pcard{display:flex;align-items:center;gap:12px;padding:12px 14px;background:#fff;border:1px solid #f1dce7;border-radius:14px}
      .intent-pcard.on{border-color:#ef6fab;background:linear-gradient(135deg,#fff0f8,#fff)}
      .intent-pcard .emo{font-size:24px;width:36px;text-align:center}
      .intent-pcard .info{flex:1;min-width:0}
      .intent-pcard .info strong{display:block;font-size:13px}
      .intent-pcard .info span{font-size:11px;color:#7b7077}
      .intent-pcard .ops{display:flex;gap:4px;flex-wrap:wrap}
      .intent-pcard .ops button{padding:6px 11px;border:1px solid #f1dce7;background:#fff;border-radius:999px;
        font-size:11px;font-weight:800;color:#5a4a56;cursor:pointer;font-family:inherit}
      .intent-pcard .ops button:hover{border-color:#e8a6c6}
      .intent-pcard .ops button.warn{background:#fff5f5;border-color:#f0b8b8;color:#b04040}
      .intent-pcard .ops .active-pill{padding:5px 11px;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-radius:999px;font-size:10px;font-weight:800}
      .intent-add-btn{width:100%;padding:11px;border:2px dashed #e8a6c6;background:transparent;border-radius:14px;
        color:#b14d82;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;margin-bottom:12px}
      .intent-add-btn:hover{background:#fff0f8}
      .intent-editor{background:#fff9fc;border:1px solid #f1dce7;border-radius:14px;padding:14px 16px;margin-bottom:12px}
      .intent-editor h5{margin:0 0 10px;font-size:13px;color:#b14d82}
      .intent-editor label{display:block;font-size:11px;font-weight:800;color:#5a4a56;margin:8px 0 4px}
      .intent-editor input{width:100%;padding:8px 10px;border:1px solid #f1dce7;border-radius:10px;font-size:12px;font-family:inherit;background:#fff}
      .pill-row{display:flex;gap:5px;flex-wrap:wrap}
      .pill{padding:6px 12px;border:1px solid #f1dce7;background:#fff;border-radius:999px;
        font-size:11px;font-weight:800;color:#7b7077;cursor:pointer;font-family:inherit}
      .pill.on{background:linear-gradient(135deg,#fff0f8,#f4eaff);border-color:#e8a6c6;color:#b14d82}
      .pill.emo{font-size:16px}
      .intent-style{margin-top:14px;padding:14px 16px;background:linear-gradient(135deg,#fff9fc,#f4eaff);border:1px solid #e0c8de;border-radius:14px}
      .intent-style h4{margin:0 0 4px;font-size:13px}
      .intent-style .sub{margin:0 0 10px;font-size:11px;color:#7b7077}
      .intent-style textarea{width:100%;padding:8px 10px;border:1px solid #f1dce7;border-radius:10px;
        font-size:12px;line-height:1.7;font-family:inherit;background:#fff;resize:vertical;margin-bottom:6px}
      .intent-style .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:4px}
      .intent-style .hint{font-size:11px;color:#7b7077;flex:1}
      .intent-btn{padding:8px 14px;border:none;border-radius:999px;cursor:pointer;font-size:12px;font-weight:800;font-family:inherit}
      .intent-btn.pri{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff}
      .intent-btn.gh{background:#fff;border:1px solid #f1dce7;color:#5a4a56}
      @media(max-width:560px){
        .intent-profile-grid{grid-template-columns:1fr}
      }`;
    const s = document.createElement('style');
    s.id = 'intentSystemStyles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function boot(){ injectStyles(); refreshBadges(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* ─ 공개 API ─ */
  window.IntentSystem = {
    // 데이터
    getProfiles, getActiveId, getActiveProfile, setActiveId, saveProfile, deleteProfile,
    getSamples, saveSamples, hasSamples,
    // 분석/프롬프트
    detectContext, buildSystemPrompt, runIntent,
    // UI
    renderProfileBadge, renderProfileManager,
    openPicker, closePicker, selectProfile, openManager,
    openEditor, submitEditor, editProfile, removeProfile,
    saveSamplesFromUI, clearSamples,
    // 내부 업데이트
    refreshBadges
  };
})();
