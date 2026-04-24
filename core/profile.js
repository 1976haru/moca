/* ==================================================
   profile.js  -- profile system (system prefix + UI + hooks)
   ================================================== */

/* ==================================================
   settings.js
   settings -- AI/cost/theme/write/lock/stats/brand/profile tabs
   extracted by split_index2.py (Phase 2)
   ================================================== */

/* ─── 설정 탭: 나의 프로필 섹션 ─── */
function renderSetProfile(){
  const list = profileList();
  const active = profileActive();
  const editId = window._editingProfile || (active && active.id);
  const p = list.find(x => x.id === editId) || list[0] || { id:'', name:'', emoji:'🧑', ageGroup:'adult', role:'other', language:'ko', tone:'friendly', channelName:'', target:'general', categories:[], styleAnalysis:null };

  const emojiPicker = DEFAULT_EMOJIS.map(e =>
    '<button class="set-pill' + (p.emoji === e ? ' on':'') + '" onclick="document.getElementById(\'pf-emoji\').value=\'' + e + '\';document.querySelectorAll(\'#pf-emoji-row .set-pill\').forEach(x=>x.classList.remove(\'on\'));this.classList.add(\'on\')">' + e + '</button>'
  ).join('');

  return '<div class="set-panel">' +
    '<h3>👤 나의 프로필</h3>' +
    '<p class="hint">여러 사람이 같은 컴퓨터를 써도 각자 기록이 분리돼요. 최대 10개까지.</p>' +

    '<div class="profile-grid" style="margin:12px 0 14px">' +
      list.map(x => '<div class="profile-card' + (x.id===editId?' on':'') + '" onclick="window._editingProfile=\'' + x.id + '\';renderSetSection(\'profile\')">' +
        '<div class="emoji">' + (x.emoji||'🧑') + '</div>' +
        '<div class="name">' + x.name + '</div>' +
        (active && x.id===active.id ? '<div class="chk">사용중 ✓</div>' : '') +
      '</div>').join('') +
      '<div class="profile-card add" onclick="profileNewAndEdit()"><div class="emoji">➕</div><div class="name">새 프로필</div></div>' +
    '</div>' +

    (p.id ? (
      '<div class="set-budget-box">' +
        '<h4>✏️ 프로필 상세 설정</h4>' +
        '<div class="set-row">' +
          '<div><label>이름 / 별명</label><input class="set-in" id="pf-name" value="' + (p.name||'') + '"></div>' +
          '<div><label>이모지</label><input class="set-in" id="pf-emoji" value="' + (p.emoji||'🧑') + '" maxlength="2"></div>' +
          '<div><label style="opacity:.7">빠른 이모지 선택</label><div class="set-pill-row" id="pf-emoji-row" style="margin:0">' + emojiPicker + '</div></div>' +
        '</div>' +
        '<label>나이대</label>' +
        '<div class="set-pill-row" id="pf-age">' +
          ['child','youth','adult','senior'].map(v => '<button class="set-pill' + (p.ageGroup===v?' on':'') + '" onclick="_pfPick(\'pf-age\',\'ageGroup\',\'' + v + '\',this)">' +
            {child:'🌱 어린이', youth:'🌿 청소년', adult:'🌳 성인', senior:'🍂 시니어'}[v] +
          '</button>').join('') +
        '</div>' +
        '<label>역할</label>' +
        '<div class="set-pill-row" id="pf-role">' +
          ['youtuber','smb','public','student','parent','other'].map(v => '<button class="set-pill' + (p.role===v?' on':'') + '" onclick="_pfPick(\'pf-role\',\'role\',\'' + v + '\',this)">' +
            {youtuber:'📺 유튜버', smb:'🏪 소상공인', public:'🏛️ 공무원', student:'📚 학생', parent:'👨‍👩‍👧 학부모', other:'기타'}[v] +
          '</button>').join('') +
        '</div>' +
        '<label>기본 언어</label>' +
        '<div class="set-pill-row" id="pf-lang">' +
          ['ko','ja','both'].map(v => '<button class="set-pill' + (p.language===v?' on':'') + '" onclick="_pfPick(\'pf-lang\',\'language\',\'' + v + '\',this)">' +
            {ko:'🇰🇷 한국어', ja:'🇯🇵 일본어', both:'동시'}[v] +
          '</button>').join('') +
        '</div>' +
        '<label>말투 스타일</label>' +
        '<div class="set-pill-row" id="pf-tone">' +
          ['friendly','expert','emotional','formal'].map(v => '<button class="set-pill' + (p.tone===v?' on':'') + '" onclick="_pfPick(\'pf-tone\',\'tone\',\'' + v + '\',this)">' +
            {friendly:'친근하게', expert:'전문적으로', emotional:'감성적으로', formal:'격식체'}[v] +
          '</button>').join('') +
        '</div>' +

        (p.role === 'youtuber' ? (
          '<h4 style="margin-top:12px">📺 채널 설정 (유튜버)</h4>' +
          '<div class="set-row">' +
            '<div><label>채널명</label><input class="set-in" id="pf-channelName" value="' + (p.channelName||'') + '"></div>' +
            '<div><label>타겟 시청자</label><select class="set-in" id="pf-target">' +
              [['senior','시니어'],['general','일반'],['kids','어린이']].map(v => '<option value="' + v[0] + '" ' + (p.target===v[0]?'selected':'') + '>' + v[1] + '</option>').join('') +
            '</select></div>' +
          '</div>' +
          '<label>주요 카테고리 (복수 선택)</label>' +
          '<div class="set-pill-row" id="pf-cats">' +
            ['health','info','emotion','comedy','music'].map(v => '<button class="set-pill' + ((p.categories||[]).includes(v)?' on':'') + '" onclick="_pfToggleCat(\'' + v + '\',this)">' +
              {health:'건강', info:'정보', emotion:'감동', comedy:'유머', music:'음악'}[v] +
            '</button>').join('') +
          '</div>'
        ) : '') +

        '<div class="set-row" style="margin-top:14px">' +
          '<div><button class="set-btn" onclick="pfSave()">💾 저장</button></div>' +
          '<div><button class="set-btn" onclick="profileActivate(\'' + p.id + '\')">✅ 이 프로필로 전환</button></div>' +
          '<div><button class="set-btn ghost" onclick="pfDelete(\'' + p.id + '\')" style="color:var(--err)">🗑 삭제</button></div>' +
        '</div>' +
      '</div>' +

      _renderStyleLearning(p)
    ) : '<p class="hint" style="padding:16px;text-align:center">프로필이 없어요. "➕ 새 프로필" 을 눌러 만들어보세요.</p>') +
  '</div>';
}

function _renderStyleLearning(p){
  const st = p.styleAnalysis;
  return '<div class="set-budget-box" style="margin-top:14px;background:linear-gradient(135deg,#fff5fa,#f7f4ff)">' +
    '<h4>🧠 내 글쓰기 스타일 학습</h4>' +
    '<p class="hint" style="font-size:12px">선택사항. 내가 쓴 글을 붙여넣으면 AI 가 분석해서 내 말투로 써요.</p>' +
    '<label>내가 쓴 글 샘플 1</label>' +
    '<textarea class="set-in" id="pf-style-1" style="min-height:90px" placeholder="여기에 내가 쓴 글을 붙여넣으세요 (블로그·카톡·편지 등 아무거나)">' + (st?.sample1||'') + '</textarea>' +
    '<label style="margin-top:6px">샘플 2 (선택)</label>' +
    '<textarea class="set-in" id="pf-style-2" style="min-height:70px" placeholder="(선택) 두 번째 샘플">' + (st?.sample2||'') + '</textarea>' +
    '<button class="set-btn" style="margin-top:8px" onclick="pfAnalyzeStyle(\'' + p.id + '\')">🧠 내 스타일 분석하기</button>' +
    (st && st.summary ? (
      '<div class="set-budget-box" style="background:#fff;margin-top:10px;padding:12px">' +
        '<b>📊 분석 결과</b>' +
        '<div style="font-size:13px;line-height:1.7;margin-top:6px;white-space:pre-wrap">' + st.summary + '</div>' +
        '<div class="hint" style="font-size:11px;margin-top:6px">' + new Date(st.at||Date.now()).toLocaleString('ko-KR') + ' 분석</div>' +
      '</div>'
    ) : '') +
  '</div>';
}

function _pfPick(rowId, key, v, btn){
  document.querySelectorAll('#' + rowId + ' .set-pill').forEach(x => x.classList.remove('on'));
  btn.classList.add('on');
  window._pfPendingField = window._pfPendingField || {};
  window._pfPendingField[key] = v;
}

function _pfToggleCat(v, btn){
  btn.classList.toggle('on');
  const sel = Array.from(document.querySelectorAll('#pf-cats .set-pill.on')).map(x => x.textContent.trim());
  const map = {'건강':'health','정보':'info','감동':'emotion','유머':'comedy','음악':'music'};
  window._pfPendingField = window._pfPendingField || {};
  window._pfPendingField.categories = sel.map(x => map[x] || x);
}

function profileNewAndEdit(){
  const p = profileCreate({});
  window._editingProfile = p.id;
  renderSetSection('profile');
}

function pfSave(){
  const id = window._editingProfile;
  const cur = profileGet(id); if(!cur) return;
  const pending = window._pfPendingField || {};
  const p = Object.assign({}, cur, {
    name:   document.getElementById('pf-name').value.trim() || cur.name,
    emoji:  document.getElementById('pf-emoji').value.trim() || cur.emoji,
    channelName: document.getElementById('pf-channelName')?.value || cur.channelName,
    target: document.getElementById('pf-target')?.value || cur.target
  }, pending);
  profileSave(p);
  window._pfPendingField = {};
  _renderProfileBadge();
  alert('💾 저장됨');
  renderSetSection('profile');
}

function pfDelete(id){
  if(profileList().length <= 1){ alert('최소 1개 프로필은 남겨두세요'); return; }
  if(!confirm('이 프로필과 모든 기록을 삭제할까요?')) return;
  profileDelete(id);
  window._editingProfile = null;
  renderSetSection('profile');
}

async function pfAnalyzeStyle(id){
  const s1 = document.getElementById('pf-style-1').value.trim();
  const s2 = document.getElementById('pf-style-2').value.trim();
  if(!s1){ alert('최소 1개 샘플을 붙여넣어주세요'); return; }
  try{
    const sys =
      '아래 샘플에서 작성자의 글쓰기 스타일을 분석하라.\n' +
      '출력 형식(한국어, 5~6줄):\n' +
      '문장 길이: (짧은편/보통/긴편, 평균 글자수)\n' +
      '감정 온도: ★(1~5)\n' +
      '자주 쓰는 표현: "~", "~"\n' +
      '특징: (이모지/어미/문체 등 3가지)\n' +
      '다음 글을 이 스타일로 써야 하는 지침 2줄';
    const user = '=== 샘플 1 ===\n' + s1 + (s2 ? '\n\n=== 샘플 2 ===\n' + s2 : '');
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens: 800, featureId: 'style-analyze' });
    const cur = profileGet(id); if(!cur) return;
    cur.styleAnalysis = { sample1: s1, sample2: s2, summary: res.trim(), at: Date.now() };
    profileSave(cur);
    alert('🧠 분석 완료!');
    renderSetSection('profile');
  }catch(e){ alert('❌ ' + e.message); }
}

/* ─── AI 프롬프트 자동 주입 ─── */

function buildProfileSystemPrefix(){
  const p = profileActive();
  if(!p || !p.name) return '';
  const roleMap = {youtuber:'유튜버', smb:'소상공인', public:'공무원', student:'학생', parent:'학부모', other:'일반'};
  const ageMap  = {child:'어린이', youth:'청소년', adult:'성인', senior:'시니어'};
  const toneMap = {friendly:'따뜻하고 친근하게', expert:'전문적으로', emotional:'감성적으로', formal:'격식체로'};
  let out = '[사용자 정보]\n';
  out += '이름/별명: ' + p.name + '\n';
  out += '나이대: ' + (ageMap[p.ageGroup]||'성인') + '\n';
  out += '역할: ' + (roleMap[p.role]||'일반') + '\n';
  out += '기본 언어: ' + (p.language === 'ja' ? '일본어' : p.language === 'both' ? '한국어+일본어' : '한국어') + '\n';
  out += '선호 말투: ' + (toneMap[p.tone]||'친근하게') + '\n';
  if(p.channelName) out += '채널: ' + p.channelName + ' (타겟: ' + (p.target||'general') + ')\n';
  if(p.categories && p.categories.length) out += '주요 관심: ' + p.categories.join(', ') + '\n';
  if(p.styleAnalysis && p.styleAnalysis.summary){
    out += '학습된 작성자 스타일:\n' + p.styleAnalysis.summary + '\n';
  }
  out += '→ 이 사람의 스타일/의도/언어에 맞게 작성.\n\n';
  return out;
}

// APIAdapter 호출 래핑 — callWithFallback 과 callAI 모두에 프로필 정보 자동 prepend
(function hookProfileInjection(){
  if (typeof APIAdapter === 'undefined') return;
  if (APIAdapter._profileHooked) return;
  APIAdapter._profileHooked = true;
  ['callWithFallback','callAI'].forEach(fnName => {
    const orig = APIAdapter[fnName];
    if(typeof orig !== 'function') return;
    APIAdapter[fnName] = async function(system, user, opts){
      opts = opts || {};
      if(opts.skipProfile !== true){
        const prefix = buildProfileSystemPrefix();
        if(prefix) system = prefix + (system||'');
      }
      return orig.call(this, system, user, opts);
    };
  });
})();

// 초기 마운트
document.addEventListener('DOMContentLoaded', function(){
  if(!profileList().length){
    profileCreate({ name:'기본', emoji:'☕', ageGroup:'adult', role:'other', language:'ko', tone:'friendly' });
  }
  _renderProfileBadge();
});
if(document.readyState !== 'loading'){
  if(!profileList().length) profileCreate({ name:'기본', emoji:'☕', ageGroup:'adult', role:'other', language:'ko', tone:'friendly' });
  _renderProfileBadge();
}

/* ── original Phase 2 profile fragment (below) ── */
function profileList(){
  try{ const l = JSON.parse(localStorage.getItem(LS_PROFILES)||'[]'); return Array.isArray(l) ? l : []; }catch(_){ return []; }
}

function profileGet(id){ return profileList().find(p => p.id === id) || null; }

function profileActive(){
  const aid = localStorage.getItem(LS_PROFILE_ACT);
  const list = profileList();
  if(aid){ const found = list.find(p => p.id === aid); if(found) return found; }
  return list[0] || null;
}

function profileSave(profile){
  const list = profileList();
  const i = list.findIndex(p => p.id === profile.id);
  if(i >= 0) list[i] = profile; else list.push(profile);
  if(list.length > 10) list.length = 10;
  localStorage.setItem(LS_PROFILES, JSON.stringify(list));
}

function profileDelete(id){
  const list = profileList().filter(p => p.id !== id);
  localStorage.setItem(LS_PROFILES, JSON.stringify(list));
  if(localStorage.getItem(LS_PROFILE_ACT) === id) localStorage.removeItem(LS_PROFILE_ACT);
  _renderProfileBadge();
}

function profileActivate(id){
  localStorage.setItem(LS_PROFILE_ACT, id);
  _renderProfileBadge();
  document.getElementById('profileModal')?.classList.remove('on');
  // 애니메이션 (배경 잠깐 깜빡)
  document.body.style.transition = 'filter .3s ease';
  document.body.style.filter = 'brightness(1.05)';
  setTimeout(()=>{ document.body.style.filter=''; setTimeout(()=>{document.body.style.transition='';}, 400); }, 120);
}

function profileCreate(defaults){
  const id = 'pf_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6);
  const p = Object.assign({
    id, name:'새 프로필', emoji:'🧑', ageGroup:'adult', role:'other',
    language:'ko', tone:'friendly', channelName:'', target:'general',
    categories:[], styleAnalysis:null, createdAt: Date.now()
  }, defaults||{});
  profileSave(p);
  return p;
}

/* ─── 상단 배지 + 전환 모달 ─── */

function _renderProfileBadge(){
  let b = document.getElementById('profileBadge');
  const p = profileActive();
  if(!p){
    if(b) b.remove();
    return;
  }
  if(!b){
    b = document.createElement('button');
    b.id = 'profileBadge';
    b.className = 'profile-badge';
    b.type = 'button';
    b.addEventListener('click', profileOpenSwitcher);
    document.body.appendChild(b);
  }
  b.innerHTML = '<span class="emoji">' + (p.emoji||'🧑') + '</span><span class="name">' + (p.name||'프로필') + '</span>';
}
function profileOpenSwitcher(){
  let m = document.getElementById('profileModal');
  if(!m){
    m = document.createElement('div');
    m.id = 'profileModal';
    m.className = 'profile-modal';
    m.addEventListener('click', function(e){ if(e.target === m) m.classList.remove('on'); });
    document.body.appendChild(m);
  }
  const active = profileActive();
  const list = profileList();
  m.innerHTML =
    '<div class="profile-modal-body">' +
      '<h3>👤 누가 사용하나요?</h3>' +
      '<p class="sub">프로필을 바꾸면 모든 기록·스타일이 그 사람 것으로 전환돼요</p>' +
      '<div class="profile-grid">' +
        list.map(p => '<div class="profile-card' + (active && p.id===active.id ? ' on':'') + '" onclick="profileActivate(\'' + p.id + '\')">' +
          '<div class="emoji">' + (p.emoji||'🧑') + '</div>' +
          '<div class="name">' + p.name + '</div>' +
          (active && p.id===active.id ? '<div class="chk">사용중 ✓</div>' : '') +
        '</div>').join('') +
        '<div class="profile-card add" onclick="profileQuickAdd()">' +
          '<div class="emoji">➕</div><div class="name">새 프로필 추가</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;justify-content:flex-end">' +
        '<button class="mz-btn ghost" onclick="document.getElementById(\'profileModal\').classList.remove(\'on\')">닫기</button>' +
        '<button class="mz-btn" onclick="document.getElementById(\'profileModal\').classList.remove(\'on\');var t=document.querySelector(\'.toptab[data-mode=setting]\');if(t)t.click();setTimeout(function(){setOpen(\'profile\');}, 100)">⚙️ 상세 설정</button>' +
      '</div>' +
    '</div>';
  m.classList.add('on');
}
function profileQuickAdd(){
  const name = prompt('프로필 이름:'); if(!name) return;
  const p = profileCreate({ name });
  profileActivate(p.id);
  profileOpenSwitcher();
}

/* ─── 설정 탭: 나의 프로필 섹션 ─── */
