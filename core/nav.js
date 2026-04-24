/* ==================================================
   nav.js
   Nav / breadcrumb / FAB / UCH top-bar
   extracted from index.html by split_index.py
   ================================================== */

function navSearchUpdate(q){
  const dd = document.getElementById('navSearchDd');
  if(!dd) return;
  q = (q||'').trim().toLowerCase();
  const recent = JSON.parse(localStorage.getItem('uc_recent_cats')||'[]');
  let items = [];
  if(!q){
    if(recent.length){
      items.push({group:'최근 사용'});
      recent.slice(0,4).forEach(id => {
        const hit = NAV_SEARCH_INDEX.find(x => x.t.includes(categories.find(c=>c.id===id)?.title||''));
        if(hit) items.push(hit);
      });
    }
    items.push({group:'바로가기'});
    items = items.concat(NAV_SEARCH_INDEX.slice(0, 8));
  } else {
    items.push({group:'검색 결과'});
    items = items.concat(NAV_SEARCH_INDEX.filter(x => (x.t+x.d).toLowerCase().includes(q)).slice(0, 12));
  }
  if(items.length <= 1){ dd.innerHTML = '<div class="sd-group">검색 결과 없음</div>'; dd.classList.add('open'); return; }
  dd.innerHTML = items.map(it => {
    if(it.group) return '<div class="sd-group">' + it.group + '</div>';
    return '<div class="sd-item" onclick="navSearchPick(' + NAV_SEARCH_INDEX.indexOf(it) + ')"><span>' + it.t + '</span><span class="sd-desc">' + it.d + '</span></div>';
  }).join('');
  dd.classList.add('open');
}

function navSearchPick(i){
  const it = NAV_SEARCH_INDEX[i]; if(!it) return;
  document.getElementById('navSearchDd').classList.remove('open');
  document.getElementById('navSearchInput').value = '';
  try{ it.go(); window.mocaToast('📍 ' + it.t + ' 으로 이동', 'info'); }catch(e){ window.mocaToast('❌ ' + e.message, 'err'); }
}

function navLangPick(lang){
  document.getElementById('navLangDd').classList.remove('open');
  document.getElementById('navLangCur').textContent = { ko:'🇰🇷', ja:'🇯🇵', en:'🇺🇸' }[lang] || '🇰🇷';
  if(typeof selectLang === 'function') selectLang(lang);
  localStorage.setItem('uc_hub_lang', lang);
  window.mocaToast('언어: ' + ({ko:'한국어', ja:'日本語', en:'English'}[lang]), 'info');
}

function navGoSettings(section){
  const t = document.querySelector('.toptab[data-mode="setting"]'); if(t) t.click();
  if(section) setTimeout(() => { if(typeof setOpen === 'function') setOpen(section); }, 100);
}

function navOpenHelp(){
  const t = document.querySelector('.toptab[data-mode="guide"]'); if(t){ t.click(); return; }
  window.mocaToast('💡 도움말은 우측 하단 플로팅 버튼에서 확인하세요', 'info');
}

function showLeaveModal(onSave, onDrop){
  let m = document.getElementById('leaveModal');
  if(!m){
    m = document.createElement('div');
    m.id = 'leaveModal';
    m.className = 'leave-modal';
    document.body.appendChild(m);
  }
  m.innerHTML = '<div class="lm-body"><h3>⚠️ 작업 중이에요</h3>' +
    '<p>현재 진행 중인 작업이 있어요. 어떻게 할까요?</p>' +
    '<div class="lm-btns">' +
      '<button class="lm-save">💾 저장하고 이동</button>' +
      '<button class="lm-drop">🗑 저장 안 하고</button>' +
      '<button class="lm-cancel">✕ 취소</button>' +
    '</div></div>';
  m.classList.add('on');
  const close = () => m.classList.remove('on');
  m.querySelector('.lm-save').onclick   = () => { try{ if(typeof studioSave==='function') studioSave(); }catch(_){}; close(); if(onSave) onSave(); };
  m.querySelector('.lm-drop').onclick   = () => { close(); if(onDrop) onDrop(); };
  m.querySelector('.lm-cancel').onclick = close;
  m.onclick = (e) => { if(e.target === m) close(); };
}

// 사이드바 카테고리 클릭을 인터셉트해서 안전 이동 처리
(function safeSidebarNav(){
  document.addEventListener('click', function(e){
    const btn = e.target.closest('#sidebar button.sidebtn');
    if(!btn) return;
    if(!_hasUnsavedWork()) return; // 통과
    const title = (btn.textContent||'').trim();
    const cat = categories.find(c => title.indexOf(c.title) >= 0);
    if(!cat || cat.id === state.category) return;
    e.preventDefault(); e.stopImmediatePropagation();
    showLeaveModal(
      () => { state.category = cat.id; if(typeof renderAll==='function') renderAll(); },
      () => { state.category = cat.id; if(typeof renderAll==='function') renderAll(); }
    );
  }, true);

  // 최근 사용 카테고리 기록
  setInterval(() => {
    if(typeof state === 'undefined' || !state.category) return;
    const recent = JSON.parse(localStorage.getItem('uc_recent_cats')||'[]');
    const idx = recent.indexOf(state.category);
    if(idx >= 0) recent.splice(idx,1);
    recent.unshift(state.category);
    localStorage.setItem('uc_recent_cats', JSON.stringify(recent.slice(0,8)));
    localStorage.setItem('uc_last_category', state.category);
  }, 4000);
})();

/* ─── 5. 화면 전환 애니메이션 (메인 콘텐츠 패널) ─── */
(function animateMain(){
  const main = document.querySelector('.main');
  if(!main) return;
  let lastCategory = null;
  setInterval(() => {
    const cur = (typeof state !== 'undefined') ? state.category : null;
    if(cur !== lastCategory){
      main.classList.remove('anim-slide-r','anim-slide-l','anim-fade','anim-slide-u');
      void main.offsetWidth;
      main.classList.add(cur ? 'anim-slide-r' : 'anim-fade');
      lastCategory = cur;
    }
  }, 400);
})();
