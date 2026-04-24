/* ==================================================
   combo.js  (~73 lines)
   _mediaBarToShorts / _mediaBarFull / window.showMediaComboBar
   src: L211-283
   split_all.py
   ================================================== */

function _mediaBarToShorts(btn, category){
  const bar = _mediaBarFindBar(btn);
  const text = typeof bar._getText === 'function' ? bar._getText() : '';
  if(!text){ alert('본문이 비어있어요'); return; }
  const key = 'hub_scripts_v1';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  list.unshift({ source:category||'media-bar', lang:'ko', text, at:Date.now() });
  localStorage.setItem(key, JSON.stringify(list.slice(0,30)));
  if(confirm('🎬 자동숏츠 엔진으로 이동할까요?')){
    location.href = 'engines/shorts/index.html?topic=' + encodeURIComponent((text.split('\n')[0]||'').slice(0,60));
  }
}
async function _mediaBarFull(btn, category){
  await _mediaBarAddImages(btn, category);
  _mediaBarToShorts(btn, category);
}

// 주요 카테고리 output textarea 에 media bar 자동 부착
(function autoAttachMediaBar(){
  const targets = [
    ['mz-out',  'monetize'],   // 수익형/콘텐츠 빌더
    ['pb-out',  'public'],      // 공공기관
    ['ed-out',  'edu'],         // 학습
    ['tr-out',  'translate'],   // 번역
    ['sm-out',  'smb'],         // 소상공인
    ['ps-out',  'psy'],         // 심리
    ['ppt-out-ko','ppt']        // PPT
  ];
  // div 기반 출력 영역도 감시 (textContent 사용)
  const divTargets = [
    ['intentResult', 'general'],   // 빠른생성(Intent)
    ['one-result',   'general']    // 원스톱 허브 인라인
  ];
  setInterval(() => {
    targets.forEach(([id, cat]) => {
      const el = document.getElementById(id);
      if(!el) return;
      const hasContent = (el.value||'').trim().length > 30;
      const hasBar = el.parentElement?.querySelector(':scope > .media-bar') || el.nextElementSibling?.classList?.contains('media-bar');
      if(hasContent && !hasBar){
        showMediaBar(el, () => el.value, cat);
      } else if(!hasContent && hasBar){
        const bar = el.parentElement?.querySelector(':scope > .media-bar') || el.nextElementSibling;
        if(bar && bar.classList && bar.classList.contains('media-bar')) bar.remove();
      }
    });
    divTargets.forEach(([id, cat]) => {
      const el = document.getElementById(id);
      if(!el) return;
      const txt = (el.textContent || el.innerText || '').trim();
      const hasContent = txt.length > 30 && el.offsetParent !== null;  // 보일 때만
      const hasBar = el.parentElement?.querySelector(':scope > .media-bar') || el.nextElementSibling?.classList?.contains('media-bar');
      if(hasContent && !hasBar){
        showMediaBar(el, () => (el.textContent||el.innerText||'').trim(), cat);
      } else if(!hasContent && hasBar){
        const bar = el.parentElement?.querySelector(':scope > .media-bar') || el.nextElementSibling;
        if(bar && bar.classList && bar.classList.contains('media-bar')) bar.remove();
      }
    });
  }, 1500);
})();

/* ─── 전역 alias (스펙 호환) ─── */
window.showMediaComboBar = function(anchorEl, getText, category){ return showMediaBar(anchorEl, getText, category); };
window.mediaComboImage   = function(category){
  const btn = document.querySelector('.media-bar button[onclick*="AddImages"]'); if(btn) btn.click();
};
window.mediaComboVideo   = function(category){
  const btn = document.querySelector('.media-bar button[onclick*="ToShorts"]');  if(btn) btn.click();
};
window.mediaComboAll     = function(category){
  const btn = document.querySelector('.media-bar button[onclick*="Full"]');      if(btn) btn.click();
};


