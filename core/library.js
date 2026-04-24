/* ==================================================
   library.js  -- 내 보관함 + 트렌드 분석 센터
   ================================================== */

/* ═══════════════════════════════════════════════
   📁 내 보관함 — LibraryStore + UI
   =============================================== */
(function(){
  const LS_HIST = 'lib_history_v1';
  const LS_FAV  = 'lib_favorites_v1';
  const LS_PROJ = 'lib_projects_v1';
  const LS_TRASH= 'lib_trash_v1';
  const HIST_LIMIT = 20;
  const TRASH_DAYS = 7;

  function now(){ return Date.now(); }
  function uid(){ return 'r'+now().toString(36)+Math.random().toString(36).slice(2,6); }
  function read(k, d){ try{ return JSON.parse(localStorage.getItem(k)||JSON.stringify(d)); }catch(_){ return d; } }
  function write(k, v){
    try{ localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch(e){ pruneForSpace(); try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(_){ return false; } }
  }
  function pruneForSpace(){
    const hist = read(LS_HIST, []);
    if(hist.length > 5){ write(LS_HIST, hist.slice(0, 10)); }
    write(LS_TRASH, []);
  }

  function titleFromText(t){
    if(!t) return '(제목 없음)';
    const first = String(t).split('\n').map(s=>s.trim()).find(s=>s && s.length>2) || '';
    return (first.replace(/[#*>`_~\-=]+/g,'').trim().slice(0,60)) || '(제목 없음)';
  }
  function sweepTrash(){
    const cutoff = now() - TRASH_DAYS*24*3600*1000;
    const t = read(LS_TRASH, []).filter(x => (x.trashedAt||now()) >= cutoff);
    write(LS_TRASH, t);
  }

  const Library = {
    saveResult({text, category, lang, title, projectId, meta}={}){
      if(!text || typeof text !== 'string') return null;
      const list = read(LS_HIST, []);
      const item = {
        id: uid(),
        createdAt: now(),
        category: category || 'other',
        lang: lang || 'ko',
        title: title || titleFromText(text),
        text: text,
        chars: text.length,
        favorite: false,
        projectId: projectId || null,
        meta: meta || {}
      };
      list.unshift(item);
      const trimmed = list.slice(0, HIST_LIMIT);
      write(LS_HIST, trimmed);
      showToast('✅ 보관함에 자동저장 됐어요!');
      return item.id;
    },
    getAll(){ return read(LS_HIST, []); },
    getFavorites(){ return read(LS_HIST, []).filter(x=>x.favorite); },
    getProjects(){ return read(LS_PROJ, []); },
    getTrash(){ sweepTrash(); return read(LS_TRASH, []); },
    toggleFavorite(id){
      const list = read(LS_HIST, []);
      const i = list.findIndex(x=>x.id===id); if(i<0) return;
      list[i].favorite = !list[i].favorite;
      write(LS_HIST, list);
    },
    moveToTrash(id){
      const list = read(LS_HIST, []);
      const i = list.findIndex(x=>x.id===id); if(i<0) return;
      const [it] = list.splice(i,1);
      it.trashedAt = now();
      const trash = read(LS_TRASH, []); trash.unshift(it);
      write(LS_HIST, list); write(LS_TRASH, trash);
    },
    restore(id){
      const trash = read(LS_TRASH, []);
      const i = trash.findIndex(x=>x.id===id); if(i<0) return;
      const [it] = trash.splice(i,1); delete it.trashedAt;
      const list = read(LS_HIST, []); list.unshift(it);
      write(LS_TRASH, trash); write(LS_HIST, list.slice(0, HIST_LIMIT));
    },
    deleteForever(id){
      write(LS_TRASH, read(LS_TRASH, []).filter(x=>x.id!==id));
    },
    assignProject(id, projectId){
      const list = read(LS_HIST, []);
      const i = list.findIndex(x=>x.id===id); if(i<0) return;
      list[i].projectId = projectId || null;
      write(LS_HIST, list);
      const projs = read(LS_PROJ, []);
      projs.forEach(p => {
        p.itemIds = (p.itemIds||[]).filter(x=>x!==id);
        if(p.id === projectId) p.itemIds.push(id);
        p.updatedAt = now();
      });
      write(LS_PROJ, projs);
    },
    createProject({name, kind, emoji, color, memo}){
      const projs = read(LS_PROJ, []);
      const p = { id:'p'+uid(), name:name||'새 프로젝트', kind:kind||'kr',
                  emoji:emoji||'📂', color:color||'pink', memo:memo||'',
                  createdAt:now(), updatedAt:now(), itemIds:[] };
      projs.unshift(p); write(LS_PROJ, projs); return p;
    },
    updateProject(id, patch){
      const projs = read(LS_PROJ, []);
      const i = projs.findIndex(x=>x.id===id); if(i<0) return;
      Object.assign(projs[i], patch, {updatedAt:now()});
      write(LS_PROJ, projs);
    },
    deleteProject(id){
      write(LS_PROJ, read(LS_PROJ, []).filter(x=>x.id!==id));
      const list = read(LS_HIST, []).map(x=> x.projectId===id ? Object.assign(x,{projectId:null}) : x);
      write(LS_HIST, list);
    },
    clearAll(){ write(LS_HIST, []); write(LS_FAV, []); },
    clearTrash(){ write(LS_TRASH, []); },
    exportAll(){
      return { version:1, exportedAt:now(),
               history: read(LS_HIST, []),
               favorites: read(LS_FAV, []),
               projects: read(LS_PROJ, []),
               trash: read(LS_TRASH, []) };
    },
    importAll(data, {merge=true}={}){
      if(!data || typeof data!=='object') throw new Error('잘못된 파일 형식');
      if(merge){
        const cur = read(LS_HIST, []); const inc = data.history||[];
        const ids = new Set(cur.map(x=>x.id));
        const merged = cur.concat(inc.filter(x=>!ids.has(x.id))).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
        write(LS_HIST, merged.slice(0, HIST_LIMIT));
        const p1 = read(LS_PROJ, []); const p2 = data.projects||[];
        const pids = new Set(p1.map(x=>x.id));
        write(LS_PROJ, p1.concat(p2.filter(x=>!pids.has(x.id))));
      } else {
        write(LS_HIST, (data.history||[]).slice(0, HIST_LIMIT));
        write(LS_PROJ, data.projects||[]);
        write(LS_TRASH, data.trash||[]);
      }
    },
    usage(){
      let used = 0;
      try{ for(const k in localStorage){ if(Object.prototype.hasOwnProperty.call(localStorage,k)){ used += (k.length + (localStorage.getItem(k)||'').length); } } }catch(_){}
      const quota = 5 * 1024 * 1024;
      return { used, quota, pct: Math.min(100, Math.round(used/quota*100)) };
    }
  };
  window.Library = Library;

  /* ─ Toast ─ */
  let toastTimer;
  function showToast(msg){
    let el = document.getElementById('libToast');
    if(!el){ el=document.createElement('div'); el.id='libToast'; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>el.classList.remove('on'), 2400);
  }
  window.libToast = showToast;

  /* ─ UI state ─ */
  const ui = { tab:'recent', cat:'all', time:'all', projectOpenId:null, newProjEmo:'🇰🇷', newProjColor:'pink' };

  function fmtDate(ts){
    const d = new Date(ts); const p = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${d.getHours()<12?'오전':'오후'} ${p(((d.getHours()+11)%12)+1)}:${p(d.getMinutes())}`;
  }
  function estMinutes(chars){ return Math.max(1, Math.round(chars/320)); }
  function langLabel(l){ return l==='jp'?'🇯🇵 일본어': l==='kojp'?'🇰🇷 한국어 + 🇯🇵 일본어': l==='en'?'🇺🇸 영어':'🇰🇷 한국어'; }
  function catLabel(c){
    const m={script:'📋 대본생성기',trans:'🌐 번역',blog:'📝 블로그',public:'🏛 공공기관',smb:'🏪 소상공인',
            edu:'📚 학습',psy:'🔮 심리운세',shorts:'📱 자동숏츠',media:'🎬 미디어',music:'🎵 음악',other:'✨ 기타'};
    return m[c] || m.other;
  }
  function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  /* ─ Renderers ─ */
  window.renderLibrary = function(){
    renderStats();
    renderUsage();
    renderActiveTab();
  };

  function renderStats(){
    const box = document.getElementById('libStats'); if(!box) return;
    const n = Library.getAll().length;
    const f = Library.getFavorites().length;
    const p = Library.getProjects().length;
    box.innerHTML = `
      <div class="lib-stat"><div class="icon">📋</div><div class="num">${n}</div><div class="lbl">총 결과물</div></div>
      <div class="lib-stat"><div class="icon">⭐</div><div class="num">${f}</div><div class="lbl">즐겨찾기</div></div>
      <div class="lib-stat"><div class="icon">📂</div><div class="num">${p}</div><div class="lbl">프로젝트</div></div>`;
  }
  function renderUsage(){
    const box = document.getElementById('libUsage'); if(!box) return;
    const u = Library.usage();
    const usedMB = (u.used/1024/1024).toFixed(2);
    const quotaMB = (u.quota/1024/1024).toFixed(0);
    box.innerHTML = `
      <div style="font-size:12px;font-weight:800;color:#5a4a56">용량 사용: ${u.pct}%</div>
      <div class="bar"><i style="width:${u.pct}%"></i></div>
      <div class="meta"><span>${usedMB}MB / ${quotaMB}MB</span>
        <span>${u.pct>=80?'⚠ 용량이 부족하면 오래된 것부터 삭제돼요':'넉넉해요 👍'}</span></div>`;
  }

  window.libSwitch = function(tab, btn){
    ui.tab = tab;
    document.querySelectorAll('#libTabs .lib-tab').forEach(b=>b.classList.remove('on'));
    if(btn) btn.classList.add('on');
    ['recent','favorite','project','trash'].forEach(k=>{
      const p = document.getElementById('libPanel-'+k); if(p) p.style.display = (k===tab?'block':'none');
    });
    renderActiveTab();
  };

  function renderActiveTab(){
    if(ui.tab==='recent')   renderRecent();
    else if(ui.tab==='favorite') renderFavorites();
    else if(ui.tab==='project')  renderProjects();
    else if(ui.tab==='trash')    renderTrash();
  }

  window.libSetCatFilter = function(cat, btn){
    ui.cat = cat;
    document.querySelectorAll('#libFilters .lib-fil[data-cat]').forEach(b=>b.classList.remove('on'));
    if(btn) btn.classList.add('on');
    renderRecent();
  };
  window.libSetTimeFilter = function(t, btn){
    ui.time = (ui.time===t ? 'all' : t);
    document.querySelectorAll('#libFilters .lib-fil[data-time]').forEach(b=>b.classList.remove('on'));
    if(ui.time!=='all' && btn) btn.classList.add('on');
    renderRecent();
  };

  function applyFilters(list){
    const q = (document.getElementById('libSearch')?.value || '').trim().toLowerCase();
    const t0 = now();
    const DAY = 24*3600*1000;
    return list.filter(x => {
      if(ui.cat!=='all' && x.category !== ui.cat) return false;
      if(ui.time==='today' && (t0 - x.createdAt) > DAY) return false;
      if(ui.time==='week'  && (t0 - x.createdAt) > 7*DAY) return false;
      if(ui.time==='month' && (t0 - x.createdAt) > 31*DAY) return false;
      if(q){
        const blob = ((x.title||'')+' '+(x.text||'')).toLowerCase();
        if(!blob.includes(q)) return false;
      }
      return true;
    });
  }

  function sortList(list){
    const s = document.getElementById('libSort')?.value || 'new';
    const copy = list.slice();
    if(s==='new') copy.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    else if(s==='old') copy.sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
    else if(s==='fav') copy.sort((a,b)=> (b.favorite?1:0)-(a.favorite?1:0) || (b.createdAt||0)-(a.createdAt||0));
    return copy;
  }

  function cardHtml(x, opts={}){
    const proj = Library.getProjects().find(p=>p.id===x.projectId);
    const prev = (x.text||'').replace(/\n+/g,' ').slice(0,120);
    const chips = [
      x.favorite ? '<span class="chip star">⭐ 즐겨찾기</span>' : '',
      `<span class="chip cat">${catLabel(x.category)}</span>`,
      proj ? `<span class="chip proj">${escapeHtml(proj.emoji)} ${escapeHtml(proj.name)}</span>` : ''
    ].join('');
    const acts = opts.trash ? `
        <button class="lib-btn ok"   onclick="libRestore('${x.id}')">♻ 복구</button>
        <button class="lib-btn warn" onclick="libDeleteForever('${x.id}')">🗑 완전삭제</button>` : `
        <button class="lib-btn" onclick="libView('${x.id}')">전체보기</button>
        <button class="lib-btn" onclick="libCopy('${x.id}')">복사</button>
        <button class="lib-btn gold" onclick="libToggleFav('${x.id}')">${x.favorite?'⭐ 해제':'⭐ 즐겨찾기'}</button>
        <button class="lib-btn" onclick="libAssign('${x.id}')">📂 프로젝트에 저장</button>
        <button class="lib-btn pri"  onclick="libReuse('${x.id}')">✏️ 이 설정으로 다시 만들기</button>
        <button class="lib-btn ok"   onclick="libSendShorts('${x.id}')">⚡ 숏츠로</button>
        <button class="lib-btn ok"   onclick="libSendMedia('${x.id}')">🎬 미디어로</button>
        <button class="lib-btn warn" onclick="libDelete('${x.id}')">🗑</button>`;
    return `<div class="lib-card" data-id="${x.id}">
      <div class="row1">${chips}</div>
      <h4>${escapeHtml(x.title||'(제목 없음)')}</h4>
      <div class="meta">${langLabel(x.lang)} · 📏 ${(x.chars||0).toLocaleString()}자 · ⏱ 약 ${estMinutes(x.chars||0)}분 · 📅 ${fmtDate(x.createdAt||0)}${opts.trash?' · 삭제일: '+fmtDate(x.trashedAt||0):''}</div>
      <div class="prev">${escapeHtml(prev)}${(x.text||'').length>120?'…':''}</div>
      <div class="acts">${acts}</div>
    </div>`;
  }

  function renderRecent(){
    const box = document.getElementById('libRecentCards'); if(!box) return;
    const list = sortList(applyFilters(Library.getAll()));
    if(!list.length){ box.innerHTML = `<div class="lib-empty">아직 저장된 결과가 없어요.<br>대본/번역/블로그 등에서 콘텐츠를 만들면 여기에 자동으로 쌓여요!</div>`; return; }
    box.innerHTML = list.map(x=>cardHtml(x)).join('');
  }
  window.libRenderRecent = renderRecent;

  function renderFavorites(){
    const box = document.getElementById('libFavCards'); if(!box) return;
    const list = Library.getFavorites();
    if(!list.length){ box.innerHTML = `<div class="lib-empty">아직 즐겨찾기가 없어요!<br>결과 카드의 ⭐ 버튼을 눌러보세요</div>`; return; }
    box.innerHTML = list.map(x=>cardHtml(x)).join('');
  }

  function renderTrash(){
    const box = document.getElementById('libTrashCards'); if(!box) return;
    const list = Library.getTrash();
    if(!list.length){ box.innerHTML = `<div class="lib-empty">휴지통이 비어있어요.</div>`; return; }
    box.innerHTML = list.map(x=>cardHtml(x,{trash:true})).join('');
  }

  function renderProjects(){
    const box = document.getElementById('libProjList'); if(!box) return;
    const projs = Library.getProjects();
    const openBox = document.getElementById('libProjOpen');
    if(ui.projectOpenId){
      const p = projs.find(x=>x.id===ui.projectOpenId);
      if(p){
        const items = Library.getAll().filter(x=>x.projectId===p.id);
        openBox.style.display='block';
        openBox.innerHTML = `
          <div class="lib-head" style="margin-bottom:10px">
            <div><h2>${escapeHtml(p.emoji)} ${escapeHtml(p.name)}</h2>
              <p>저장된 결과 ${items.length}개 · ${p.memo?escapeHtml(p.memo):'메모 없음'}</p></div>
            <div class="hd-actions"><button class="lib-btn" onclick="libCloseProject()">← 돌아가기</button></div>
          </div>
          <div class="lib-cards">${items.length? items.map(x=>cardHtml(x)).join('') : `<div class="lib-empty">이 프로젝트에 저장된 결과가 없어요.</div>`}</div>`;
      }
    } else {
      openBox.style.display='none';
    }
    if(!projs.length){
      box.innerHTML = `<div class="lib-empty">아직 프로젝트가 없어요.<br>아래 [+ 새 프로젝트 만들기] 버튼으로 시작해보세요!</div>`;
      return;
    }
    box.innerHTML = projs.map(p=>{
      const count = Library.getAll().filter(x=>x.projectId===p.id).length;
      return `<div class="lib-proj-card c-${p.color||'pink'}">
        <div class="emo">${escapeHtml(p.emoji||'📂')}</div>
        <div class="info">
          <strong>${escapeHtml(p.name)}</strong>
          <span>저장된 결과: ${count}개 · 마지막 작업: ${fmtDate(p.updatedAt||p.createdAt||0)}</span>
        </div>
        <div class="ops">
          <button class="lib-btn pri" onclick="libOpenProject('${p.id}')">열기</button>
          <button class="lib-btn"     onclick="libRenameProject('${p.id}')">수정</button>
          <button class="lib-btn warn" onclick="libDeleteProject('${p.id}')">🗑</button>
        </div>
      </div>`;
    }).join('');
  }
  window.libOpenProject = function(id){ ui.projectOpenId = id; renderProjects(); };
  window.libCloseProject = function(){ ui.projectOpenId = null; renderProjects(); };
  window.libRenameProject = function(id){
    const projs = Library.getProjects(); const p = projs.find(x=>x.id===id); if(!p) return;
    const name = prompt('새 프로젝트 이름', p.name); if(name===null) return;
    const memo = prompt('메모 (선택)', p.memo||''); if(memo===null) return;
    Library.updateProject(id, {name:name.trim()||p.name, memo});
    renderProjects(); renderStats();
  };
  window.libDeleteProject = function(id){
    if(!confirm('이 프로젝트를 삭제할까요?\n(안에 있던 결과는 보관함에 그대로 남아요)')) return;
    Library.deleteProject(id);
    if(ui.projectOpenId===id) ui.projectOpenId=null;
    renderProjects(); renderStats();
  };

  /* ─ New project form ─ */
  window.libToggleNewProj = function(){
    const el = document.getElementById('libNewProj');
    if(!el) return;
    el.style.display = (el.style.display==='none'||!el.style.display)?'block':'none';
  };
  document.addEventListener('click', function(e){
    const b = e.target.closest('#npEmoPick button, #npColorPick button');
    if(!b) return;
    const parent = b.parentElement;
    parent.querySelectorAll('button').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    if(parent.id==='npEmoPick') ui.newProjEmo = b.dataset.e;
    if(parent.id==='npColorPick') ui.newProjColor = b.dataset.c;
  });
  window.libCreateProject = function(){
    const name = (document.getElementById('npName')?.value||'').trim();
    if(!name){ alert('프로젝트 이름을 입력해주세요.'); return; }
    const kind = document.getElementById('npKind')?.value || 'kr';
    const memo = document.getElementById('npMemo')?.value || '';
    Library.createProject({name, kind, emoji:ui.newProjEmo, color:ui.newProjColor, memo});
    document.getElementById('npName').value=''; document.getElementById('npMemo').value='';
    document.getElementById('libNewProj').style.display='none';
    renderProjects(); renderStats();
    showToast('📂 새 프로젝트를 만들었어요!');
  };

  /* ─ Card actions ─ */
  function findItem(id){
    return Library.getAll().find(x=>x.id===id) || Library.getTrash().find(x=>x.id===id);
  }
  window.libView = function(id){
    const x = findItem(id); if(!x) return;
    const w = window.open('', '_blank', 'width=720,height=800');
    if(!w){ alert(x.text); return; }
    const safe = escapeHtml(x.text);
    w.document.write(`<!doctype html><meta charset="utf-8"><title>${escapeHtml(x.title||'결과')}</title>
      <body style="font-family:Pretendard,sans-serif;padding:20px;line-height:1.9;max-width:780px;margin:0 auto"><h2>${escapeHtml(x.title||'')}</h2>
      <pre style="white-space:pre-wrap;background:#fff9fc;border:1px solid #f1dce7;border-radius:12px;padding:16px">${safe}</pre></body>`);
    w.document.close();
  };
  window.libCopy = function(id){
    const x = findItem(id); if(!x) return;
    navigator.clipboard.writeText(x.text).then(()=>showToast('📋 복사됐어요!'), ()=>alert(x.text));
  };
  window.libToggleFav = function(id){ Library.toggleFavorite(id); renderActiveTab(); renderStats(); };
  window.libDelete = function(id){
    if(!confirm('이 결과를 휴지통으로 보낼까요?')) return;
    Library.moveToTrash(id); renderActiveTab(); renderStats();
    showToast('🗑 휴지통으로 옮겼어요 (7일 안에 복구 가능)');
  };
  window.libRestore = function(id){ Library.restore(id); renderActiveTab(); renderStats(); };
  window.libDeleteForever = function(id){
    if(!confirm('완전히 삭제할까요? (복구 불가)')) return;
    Library.deleteForever(id); renderActiveTab(); renderStats();
  };
  window.libAssign = function(id){
    const projs = Library.getProjects();
    if(!projs.length){ alert('먼저 프로젝트를 만들어주세요.\n[프로젝트] 탭에서 생성할 수 있어요.'); return; }
    const opts = projs.map((p,i)=>`${i+1}. ${p.emoji} ${p.name}`).join('\n');
    const ans = prompt('저장할 프로젝트 번호를 입력하세요:\n0 = 프로젝트 해제\n\n'+opts, '1');
    if(ans===null) return;
    const n = parseInt(ans, 10);
    if(n===0){ Library.assignProject(id, null); }
    else if(n>=1 && n<=projs.length){ Library.assignProject(id, projs[n-1].id); }
    else return;
    renderActiveTab(); renderStats();
    showToast('📂 프로젝트에 저장됐어요!');
  };
  window.libReuse = function(id){
    const x = findItem(id); if(!x) return;
    const tab = (x.meta && x.meta.scriptTab) || 'gen';
    try{
      const q = new URLSearchParams({tab, reuse:id}).toString();
      // 대본 생성기는 iframe으로만 사용 — 스크립트 카테고리는 숏츠 스튜디오로 라우팅
      const map = {media:'engines/media/index.html', shorts:'engines/shorts/index.html'};
      sessionStorage.setItem('lib_reuse_payload', JSON.stringify(x));
      if(x.category === 'script'){
        if(typeof window.__hubGoCategory === 'function') window.__hubGoCategory('shorts');
      } else {
        const base = map[x.category] || 'engines/shorts/index.html';
        location.href = base + '?' + q;
      }
    }catch(e){ alert('다시 만들기 이동 실패: '+e.message); }
  };
  window.libSendShorts = function(id){
    const x = findItem(id); if(!x) return;
    const list = JSON.parse(localStorage.getItem('hub_scripts_v1')||'[]');
    list.unshift({source:'library', lang:x.lang||'ko', text:x.text, at:now(), meta:x.meta||{}});
    localStorage.setItem('hub_scripts_v1', JSON.stringify(list.slice(0,30)));
    if(confirm('⚡ 자동숏츠 엔진으로 이동할까요?')) location.href='engines/shorts/index.html';
  };
  window.libSendMedia = function(id){
    const x = findItem(id); if(!x) return;
    const list = JSON.parse(localStorage.getItem('hub_scripts_v1')||'[]');
    list.unshift({source:'library', lang:x.lang||'ko', text:x.text, at:now(), meta:x.meta||{}});
    localStorage.setItem('hub_scripts_v1', JSON.stringify(list.slice(0,30)));
    if(confirm('🎬 미디어 엔진으로 이동할까요?')) location.href='engines/media/index.html';
  };

  window.libClearAll = function(){
    if(!confirm('최근 결과를 모두 삭제할까요?\n(휴지통 경유 없이 바로 삭제됩니다)')) return;
    if(!confirm('정말 삭제할까요? 복구할 수 없어요.')) return;
    Library.clearAll(); renderActiveTab(); renderStats();
  };
  window.libTrashClear = function(){
    if(!confirm('휴지통을 비울까요? (복구 불가)')) return;
    Library.clearTrash(); renderActiveTab(); renderStats();
  };

  /* ─ Export / Import ─ */
  window.libExportAll = function(){
    const data = Library.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date(); const p=n=>String(n).padStart(2,'0');
    a.href = url; a.download = `보관함_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 500);
    showToast('💾 전체 내보내기 완료!');
  };
  window.libImportFile = function(e){
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const rd = new FileReader();
    rd.onload = ()=>{
      try{
        const data = JSON.parse(rd.result);
        Library.importAll(data, {merge:true});
        renderLibrary(); renderActiveTab();
        showToast('📥 불러오기 완료!');
      }catch(err){ alert('불러오기 실패: '+err.message); }
      finally{ e.target.value=''; }
    };
    rd.readAsText(f);
  };

  /* ─ Session reuse payload pickup (sibling engines can read sessionStorage) ─ */
  window.addEventListener('storage', ()=>{ if(ui.tab) renderActiveTab(); });

  sweepTrash();
})();

/* ═══════════════════════════════════════════════
   🔥 트렌드 분석 센터
   =============================================== */
(function(){
  const LS_FAV_CH = 'trend_fav_channels_v1';

  /* ─ 샘플 트렌드 데이터 (API 연동 전 기본값) ─ */
  const TREND_DATA = {
    kr: {
      all: [
        {k:'치매 예방 음식',     trend:'🔥 급상승 중',           cat:'시니어/건강', delta:'+180%'},
        {k:'노후 준비 방법',     trend:'📈 지난주 대비 +230%',   cat:'시니어/건강', delta:'+230%'},
        {k:'70대 건강 루틴',     trend:'📈 꾸준한 상승',         cat:'시니어/건강', delta:'+95%'},
        {k:'할머니 레시피',      trend:'🆕 신규 급상승',         cat:'감동',       delta:'+320%'},
        {k:'추억의 옛날 노래',   trend:'📈 시니어 최상위',       cat:'음악',       delta:'+140%'},
        {k:'은퇴 후 후회',       trend:'🔥 공감 폭발',           cat:'지식',       delta:'+210%'},
        {k:'60세 이후 운동법',   trend:'📈 꾸준한 인기',         cat:'시니어/건강', delta:'+85%'},
        {k:'부모님이 몰래 하는 일',trend:'🔥 감동 킬러',         cat:'감동',       delta:'+260%'},
        {k:'옛날 드라마 명장면',  trend:'📈 추억 소환',           cat:'감동',       delta:'+110%'},
        {k:'일본 여행 시니어',    trend:'🆕 새로운 흐름',         cat:'지식',       delta:'+175%'}
      ],
      cats:[{id:'all',label:'전체'},{id:'시니어/건강',label:'시니어/건강'},{id:'감동',label:'감동'},{id:'지식',label:'지식'},{id:'음악',label:'음악'},{id:'코믹',label:'코믹'}]
    },
    jp: {
      all: [
        {k:'老後の生活費',        trend:'🔥 急上昇中',             cat:'シニア/健康', delta:'+200%'},
        {k:'昭和の名曲',          trend:'📈 懐かしさ爆発',         cat:'音楽/演歌',   delta:'+160%'},
        {k:'認知症予防レシピ',    trend:'🔥 健康最前線',           cat:'シニア/健康', delta:'+145%'},
        {k:'高齢者の一日',        trend:'📈 共感急増',             cat:'感動',       delta:'+130%'},
        {k:'母の手紙',            trend:'🆕 涙腺崩壊',             cat:'感動',       delta:'+280%'},
        {k:'70代の運動習慣',      trend:'📈 実用最上位',           cat:'シニア/健康', delta:'+90%'},
        {k:'懐かしい昭和ドラマ',  trend:'📈 思い出の定番',         cat:'エンタメ',   delta:'+120%'},
        {k:'年金だけで暮らす',    trend:'🔥 リアル情報',           cat:'シニア/健康', delta:'+240%'},
        {k:'定年後の趣味',        trend:'📈 セカンドライフ',       cat:'エンタメ',   delta:'+100%'},
        {k:'日本の古い歌 名曲',   trend:'🆕 昭和ブーム',           cat:'音楽/演歌',   delta:'+155%'}
      ],
      cats:[{id:'all',label:'全体'},{id:'シニア/健康',label:'シニア/健康'},{id:'感動',label:'感動'},{id:'エンタメ',label:'エンタメ'},{id:'音楽/演歌',label:'音楽/演歌'}]
    },
    global: {
      all: [
        {k:'Senior fitness tips',     trend:'🔥 Fast rising',   cat:'health',   delta:'+210%'},
        {k:'Grandma recipes',         trend:'📈 Consistent',    cat:'cooking',  delta:'+140%'},
        {k:'Retirement lifestyle',    trend:'🔥 Trending',      cat:'lifestyle',delta:'+185%'},
        {k:'Memory care exercises',   trend:'🆕 New wave',      cat:'health',   delta:'+320%'},
        {k:'Old Japanese music',      trend:'📈 Nostalgia hit', cat:'music',    delta:'+120%'},
        {k:'Korean drama classics',   trend:'🔥 Rewatched',     cat:'entertainment',delta:'+250%'},
        {k:'Asian senior travel',     trend:'📈 Rising niche',  cat:'travel',   delta:'+95%'},
        {k:'Anti-aging foods',        trend:'🔥 Top topic',     cat:'health',   delta:'+170%'},
        {k:'Traditional remedies',    trend:'📈 Growing',       cat:'health',   delta:'+110%'},
        {k:'Family stories compilation',trend:'🆕 Emerging',    cat:'emotional',delta:'+290%'}
      ],
      cats:[{id:'all',label:'All'},{id:'health',label:'Health'},{id:'music',label:'Music'},{id:'entertainment',label:'Entertainment'},{id:'emotional',label:'Emotional'},{id:'lifestyle',label:'Lifestyle'}]
    },
    senior: {
      all: [
        {k:'치매 예방 3가지 습관',   trend:'🔥 급상승',        cat:'건강',    delta:'+250%'},
        {k:'할머니가 알려주는 지혜', trend:'📈 감동 최고조',    cat:'감동',    delta:'+180%'},
        {k:'부모님과의 추억',        trend:'🔥 눈물버튼',      cat:'가족',    delta:'+310%'},
        {k:'노후 생활비 절약',       trend:'📈 실용 정보',     cat:'노후',    delta:'+200%'},
        {k:'老後の楽しみ方',         trend:'📈 일본 시니어',   cat:'노후',    delta:'+165%'},
        {k:'昭和の思い出',           trend:'🔥 일본 추억',     cat:'추억',    delta:'+220%'},
        {k:'건강한 70대의 하루',     trend:'📈 루틴 최고',     cat:'건강',    delta:'+130%'},
        {k:'한일 시니어 비교',       trend:'🆕 틈새 시장',     cat:'가족',    delta:'+275%'},
        {k:'추억의 엔카 명곡',       trend:'📈 음악 감동',     cat:'추억',    delta:'+145%'},
        {k:'50세 이후 후회하는 것',  trend:'🔥 공감 폭발',     cat:'노후',    delta:'+240%'}
      ],
      cats:[{id:'all',label:'전체'},{id:'건강',label:'건강'},{id:'추억',label:'추억'},{id:'가족',label:'가족'},{id:'노후',label:'노후'}]
    }
  };

  /* ─ 월별 캘린더 데이터 ─ */
  const CAL = [
    {m:1,  ko:'신년·새해 다짐·건강검진·초심',            jp:'お正月・初詣・初日の出・書き初め'},
    {m:2,  ko:'설날·명절·밸런타인·겨울 건강',            jp:'節分・バレンタイン・梅まつり'},
    {m:3,  ko:'봄·건강관리·새학기·환절기',               jp:'ひな祭り・卒業式・春の訪れ'},
    {m:4,  ko:'벚꽃·봄나들이·건강식품·새출발',           jp:'花見・新年度・桜・入学式'},
    {m:5,  ko:'어버이날·가정의달·운동·부모님 감동',      jp:'こどもの日・母の日・GW旅行'},
    {m:6,  ko:'여름 준비·건강음료·장마 대비·여행',       jp:'梅雨・父の日・紫陽花'},
    {m:7,  ko:'휴가·더위 극복·시원한 음식·여름보양',     jp:'七夕・海の日・夏祭り・花火'},
    {m:8,  ko:'광복절·추억·역사 이야기·여름 끝자락',     jp:'お盆・終戦記念日・夏休みの思い出'},
    {m:9,  ko:'추석·명절 음식·가족 이야기·가을 건강',    jp:'敬老の日・お月見・秋分の日'},
    {m:10, ko:'가을·단풍·건강검진·운동',                 jp:'紅葉狩り・体育の日・食欲の秋'},
    {m:11, ko:'김장·겨울 준비·따뜻한 음식·가족',         jp:'七五三・勤労感謝の日・紅葉終盤'},
    {m:12, ko:'연말·크리스마스·한해 정리·신년 계획',     jp:'クリスマス・年末・大掃除・忘年会'}
  ];

  /* ─ UI 상태 ─ */
  const ui = { kwTab:'kr', catFil:'all', genre:'senior-emotion', target:'kr-senior' };

  function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function esc(s){ return escapeHtml(s); }

  /* ─ API 호출 준비 ─ */
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
    return A.callAI(sys, user, Object.assign({maxTokens:2400}, opts||{}));
  }

  /* ─ 렌더: 진입점 ─ */
  window.renderTrendHub = function(){
    renderKwTab();
    renderCalendar();
    renderFavChannels();
  };

  /* ─ 섹션1: 키워드 탭 ─ */
  window.trSwitchKw = function(tab, btn){
    ui.kwTab = tab; ui.catFil = 'all';
    document.querySelectorAll('#trKwTabs .tr-tab').forEach(b=>b.classList.remove('on'));
    if(btn) btn.classList.add('on');
    renderKwTab();
  };
  function renderKwTab(){
    const data = TREND_DATA[ui.kwTab]; if(!data) return;
    const fils = document.getElementById('trCatFils');
    if(fils){
      fils.innerHTML = data.cats.map(c =>
        `<button class="tr-cat-fil ${ui.catFil===c.id?'on':''}" onclick="trSetCat('${c.id}',this)">${esc(c.label)}</button>`
      ).join('');
    }
    const grid = document.getElementById('trKwGrid'); if(!grid) return;
    const list = data.all.filter(x => ui.catFil==='all' || x.cat===ui.catFil);
    grid.innerHTML = list.map((x,i)=>{
      const hot = (x.trend||'').indexOf('🔥')>=0;
      const langHint = ui.kwTab==='jp' ? '(일본어)' : ui.kwTab==='global' ? '(영어)' : '';
      return `<div class="tr-kw">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="rank">#${i+1}</span>
          <div style="flex:1;min-width:0">
            <div class="kw">${esc(x.k)} <span style="font-size:10px;color:var(--sub);font-weight:600">${langHint}</span></div>
            <div class="trend ${hot?'hot':''}">${esc(x.trend)} · ${esc(x.delta||'')}</div>
          </div>
        </div>
        <div class="meta">카테고리: ${esc(x.cat)}</div>
        <div class="acts">
          <button class="pri" onclick='trSendToScript(${JSON.stringify(x.k)})'>🎬 대본 만들기</button>
          <button class="ok" onclick='trSendToShorts(${JSON.stringify(x.k)})'>⚡ 숏츠 만들기</button>
          <button onclick='trSendToMedia(${JSON.stringify(x.k)})'>🎵 미디어</button>
          <button onclick='trCopyText(${JSON.stringify(x.k)})'>📋 복사</button>
        </div>
      </div>`;
    }).join('');
  }
  window.trSetCat = function(id, btn){
    ui.catFil = id;
    document.querySelectorAll('#trCatFils .tr-cat-fil').forEach(b=>b.classList.remove('on'));
    if(btn) btn.classList.add('on');
    renderKwTab();
  };

  /* ─ 엔진 연동 ─ */
  function pushScriptPayload(topic, extra){
    const list = JSON.parse(localStorage.getItem('hub_scripts_v1')||'[]');
    list.unshift({source:'trend', lang:'ko', text:'', topic, at:Date.now(), meta:Object.assign({trend:true}, extra||{})});
    localStorage.setItem('hub_scripts_v1', JSON.stringify(list.slice(0,30)));
    sessionStorage.setItem('trend_topic', topic);
  }
  window.trSendToScript = function(topic){
    pushScriptPayload(topic);
    if(confirm('🎬 이 주제로 대본을 만들어볼까요?\n\n→ '+topic)){
      // 대본 생성기는 iframe으로만 사용 — 숏츠 스튜디오로 라우팅
      if(typeof window.__hubGoCategory === 'function') window.__hubGoCategory('shorts');
    }
  };
  window.trSendToShorts = function(topic){
    pushScriptPayload(topic, {shorts:true});
    if(confirm('⚡ 이 주제로 숏츠를 만들어볼까요?\n\n→ '+topic)) location.href='engines/shorts/index.html?topic='+encodeURIComponent(topic);
  };
  window.trSendToMedia = function(topic){
    pushScriptPayload(topic, {media:true});
    if(confirm('🎵 미디어 엔진으로 이동할까요?')) location.href='engines/media/index.html?topic='+encodeURIComponent(topic);
  };
  window.trCopyText = function(t){
    navigator.clipboard.writeText(t).then(()=>{
      if(typeof libToast==='function') libToast('📋 복사됐어요!'); else alert('복사됨');
    });
  };

  /* ─ 섹션2: URL 분석 ─ */
  window.trAnalyzeUrl = async function(){
    const url = (document.getElementById('trUrlInput').value||'').trim();
    if(!url){ alert('유튜브 URL을 입력해주세요.'); return; }
    const box = document.getElementById('trUrlResult');
    box.textContent = '⏳ AI가 영상 제목·키워드·잘된 이유를 분석 중...';
    try{
      const sys = `당신은 유튜브 콘텐츠 전략가입니다. 주어진 URL만 보고 추정되는 영상을 분석하세요 (실제 메타데이터 조회 없이 제목·패턴 추론). 반드시 다음 섹션을 포함:
1) 📊 영상 분석 결과 (추정 제목, 예상 조회수 수준: 높음/중간/낮음)
2) 잘된 이유 (3~5개, ✅로 시작)
3) 핵심 키워드 (3~6개) — [키워드] 형식
4) 비슷한 주제로 만들 대본 제안 3개
시니어(한국/일본) 채널 맥락을 염두에 두고 한국어로 답변.`;
      const r = await callAI(sys, `URL: ${url}`, {maxTokens:1800, featureId:'trend-url'});
      const html = r.replace(/\[([^\]]+)\]/g, (m,w)=>`<span class="kw-chip">${esc(w)}</span>`);
      box.innerHTML = html + `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
        <button class="tr-kw" style="padding:8px 12px;cursor:pointer;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:999px;font-size:12px;font-weight:800" onclick='trSendToScript("URL 분석 주제: ${esc(url)}")'>🎬 대본 만들기</button>
        <button class="tr-kw" style="padding:8px 12px;cursor:pointer;background:var(--green);border:1px solid #c2e8d8;color:#2f7a54;border-radius:999px;font-size:12px;font-weight:800" onclick='trSendToShorts("URL 분석 주제: ${esc(url)}")'>⚡ 숏츠 만들기</button>
      </div>`;
    }catch(e){ box.textContent = '❌ '+e.message; }
  };

  /* ─ 섹션3: 채널 분석 + 즐겨찾기 ─ */
  window.trAnalyzeChannel = async function(){
    const url = (document.getElementById('trChUrl').value||'').trim();
    if(!url){ alert('채널 URL을 입력해주세요.'); return; }
    const box = document.getElementById('trChResult');
    box.textContent = '⏳ 채널 특성·업로드 패턴·차별화 전략 분석 중...';
    try{
      const sys = `당신은 유튜브 채널 그로스 전략가입니다. 주어진 채널 URL을 바탕으로 추정되는 특성을 분석하고 다음 섹션을 모두 포함:
1) 📊 채널 분석 결과 (추정)
2) ✅ 인기 비결 5개 (업로드 주기/시간/주력 콘텐츠/썸네일 스타일/영상 길이)
3) 인기 영상 TOP5 키워드 — [키워드] 형식
4) 차별화 전략 제안 3~4개 (이 채널이 안 다루는 주제)
5) 추천 영상 주제 3개
한국 시니어 / 일본 시니어 채널 컨텍스트. 한국어로 답변.`;
      const r = await callAI(sys, `채널 URL: ${url}`, {maxTokens:2200, featureId:'trend-channel'});
      const html = r.replace(/\[([^\]]+)\]/g, (m,w)=>`<span class="kw-chip">${esc(w)}</span>`);
      box.innerHTML = html;
    }catch(e){ box.textContent = '❌ '+e.message; }
  };
  window.trSaveFavChannel = function(){
    const url = (document.getElementById('trChUrl').value||'').trim();
    if(!url){ alert('채널 URL을 입력한 뒤 눌러주세요.'); return; }
    const list = JSON.parse(localStorage.getItem(LS_FAV_CH)||'[]');
    if(list.find(x=>x.url===url)){ alert('이미 등록된 채널이에요.'); return; }
    if(list.length>=5){ alert('즐겨찾기는 최대 5개까지 가능해요.\n기존 채널을 삭제하고 추가해주세요.'); return; }
    const name = prompt('이 채널 별명 (예: 시니어 감동 채널 A)', '')||url.slice(0,30);
    list.unshift({url, name, at:Date.now()});
    localStorage.setItem(LS_FAV_CH, JSON.stringify(list));
    renderFavChannels();
    if(typeof libToast==='function') libToast('⭐ 즐겨찾기에 추가했어요!');
  };
  function renderFavChannels(){
    const box = document.getElementById('trFavList'); if(!box) return;
    const list = JSON.parse(localStorage.getItem(LS_FAV_CH)||'[]');
    if(!list.length){
      box.innerHTML = `<div style="padding:12px 14px;background:var(--pink-soft);border:1px dashed #f0c8de;border-radius:12px;font-size:11px;color:#7b4060">⭐ 아직 즐겨찾기 채널이 없어요. 채널을 분석한 뒤 [⭐ 즐겨찾기] 버튼을 눌러보세요.</div>`;
      return;
    }
    box.innerHTML = list.map((x,i)=>`<div class="tr-fav">
      <div class="info"><strong>${esc(x.name)}</strong><span>${esc(x.url)}</span></div>
      <div class="ops">
        <button onclick='trLoadFavChannel(${i})'>불러오기</button>
        <button onclick='trDeleteFavChannel(${i})' style="color:#b04040">🗑</button>
      </div>
    </div>`).join('');
  }
  window.trLoadFavChannel = function(i){
    const list = JSON.parse(localStorage.getItem(LS_FAV_CH)||'[]');
    if(!list[i]) return;
    document.getElementById('trChUrl').value = list[i].url;
    window.scrollTo({top:document.getElementById('trChUrl').getBoundingClientRect().top+window.scrollY-100, behavior:'smooth'});
  };
  window.trDeleteFavChannel = function(i){
    if(!confirm('이 즐겨찾기를 삭제할까요?')) return;
    const list = JSON.parse(localStorage.getItem(LS_FAV_CH)||'[]');
    list.splice(i,1);
    localStorage.setItem(LS_FAV_CH, JSON.stringify(list));
    renderFavChannels();
  };

  /* ─ 섹션4: 내 채널 키워드 전략 ─ */
  document.addEventListener('click', function(e){
    const g = e.target.closest('#trMyGenre button');
    if(g){
      g.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
      g.classList.add('on'); ui.genre = g.dataset.g;
    }
    const t = e.target.closest('#trMyTarget button');
    if(t){
      t.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
      t.classList.add('on'); ui.target = t.dataset.t;
    }
  });
  window.trStrategyMe = async function(){
    const kw = (document.getElementById('trMyKeywords').value||'').trim();
    const box = document.getElementById('trMyResult');
    box.textContent = '⏳ 맞춤 키워드 전략 분석 중...';
    const genreLabel = {'senior-emotion':'시니어 감동','comic':'코믹','knowledge':'지식','music':'음악'}[ui.genre]||ui.genre;
    const targetLabel = {'kr-senior':'한국 시니어','jp-senior':'일본 시니어','all':'전체'}[ui.target]||ui.target;
    try{
      const sys = `당신은 한국·일본 시니어 유튜브 채널 전문 SEO/키워드 전략가입니다. 채널 장르·타깃·현재 키워드를 바탕으로 다음을 한국어로 출력:
1) 🎯 내 채널 맞춤 키워드 전략
2) 지금 당장 써야 할 키워드 3~5개 (각 키워드: 경쟁 강도·조회수 잠재력 코멘트)
3) 일본 채널 추가 키워드 3개 (일본어 원문 + 한글 뜻)
4) 피해야 할 키워드 2~3개 (❌, 이유 포함)
5) 추천 영상 주제 5개 — 번호 매김, 마지막에 [대본만들기] 태그로 연결 암시`;
      const user = `채널 장르: ${genreLabel}\n타깃: ${targetLabel}\n현재 주력 키워드: ${kw||'(미입력)'}`;
      const r = await callAI(sys, user, {maxTokens:2200, featureId:'trend-my'});
      const html = r.replace(/\[([^\]]+)\]/g, (m,w)=>`<span class="kw-chip">${esc(w)}</span>`);
      box.innerHTML = html + `<div style="margin-top:10px"><button style="padding:9px 14px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:999px;font-size:12px;font-weight:800;cursor:pointer" onclick='trSendToScript("내 채널 추천 주제")'>🎬 1번 주제로 대본 만들기</button></div>`;
    }catch(e){ box.textContent = '❌ '+e.message; }
  };

  /* ─ 섹션5: 제목 분석기 ─ */
  window.trAnalyzeTitle = async function(){
    const title = (document.getElementById('trTitleInput').value||'').trim();
    if(!title){ alert('분석할 제목을 입력해주세요.'); return; }
    const box = document.getElementById('trTitleResult');
    box.textContent = '⏳ 제목 클릭률·개선안 분석 중...';
    try{
      const sys = `당신은 유튜브 썸네일·제목 클릭률(CTR) 전문가입니다. 주어진 한국어 제목을 분석하고 다음을 모두 포함해 한국어로 답변:
1) 📊 제목 분석 결과
2) 클릭률 예상 (★5개 만점, ex ★★★☆☆ 보통)
3) 개선 포인트 (✅ 잘한 점 2~3개, ⚠️ 아쉬운 점 2~3개)
4) 개선된 제목 추천 3개 (숫자/궁금증/구체성 활용)
5) 일본어 제목 자동 생성 3개 (시니어 공감 톤)
6) 마지막 줄에 "[이 제목으로 대본 만들기]" 제안`;
      const r = await callAI(sys, `제목: ${title}`, {maxTokens:1800, featureId:'trend-title'});
      box.innerHTML = r + `<div style="margin-top:10px"><button style="padding:9px 14px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:999px;font-size:12px;font-weight:800;cursor:pointer" onclick='trSendToScript(${JSON.stringify(title)})'>🎬 이 제목으로 대본 만들기</button></div>`;
    }catch(e){ box.textContent = '❌ '+e.message; }
  };

  /* ─ 섹션6: 캘린더 ─ */
  function renderCalendar(){
    const box = document.getElementById('trCalendar'); if(!box) return;
    const hl  = document.getElementById('trCalHighlight');
    const now = new Date();
    const curM = now.getMonth()+1;
    const nextM = (curM%12)+1;
    const cur = CAL.find(x=>x.m===curM);
    const nxt = CAL.find(x=>x.m===nextM);
    if(hl && cur && nxt){
      hl.innerHTML = `<h5>🗓 이번달(${curM}월) 추천 주제 · 다음달(${nextM}월) 미리 준비</h5>
        <p><b>이번달:</b> 🇰🇷 ${esc(cur.ko)} / 🇯🇵 ${esc(cur.jp)}</p>
        <p><b>다음달:</b> 🇰🇷 ${esc(nxt.ko)} / 🇯🇵 ${esc(nxt.jp)}</p>
        <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
          <button style="padding:8px 12px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:999px;font-size:12px;font-weight:800;cursor:pointer" onclick='trSendToScript(${JSON.stringify(cur.ko.split(/[·,、]/)[0])})'>🎬 이달의 추천 주제로 대본 만들기</button>
          <button style="padding:8px 12px;background:var(--green);border:1px solid #c2e8d8;color:#2f7a54;border-radius:999px;font-size:12px;font-weight:800;cursor:pointer" onclick='trSendToShorts(${JSON.stringify(cur.ko.split(/[·,、]/)[0])})'>⚡ 숏츠 만들기</button>
        </div>`;
    }
    box.innerHTML = CAL.map(x=>`<div class="tr-cal-cell ${x.m===curM?'now':''}">
      <h5>${x.m}月 ${x.m===curM?'· 지금!':''}</h5>
      <div class="ko">🇰🇷 ${esc(x.ko)}</div>
      <div class="jp">🇯🇵 ${esc(x.jp)}</div>
    </div>`).join('');
  }

})();
console.log('✅ 🔥 트렌드 분석 센터 로드 완료');
