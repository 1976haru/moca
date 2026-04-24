/* ==================================================
   brandkit.js  (~70 lines)
   brandkit save/load/switch/apply
   src: L33-102
   split_all.py
   ================================================== */

function _migrateLegacyBrandkit(){
  const legacy = localStorage.getItem(LS_BRANDKIT_LEGACY);
  if(!legacy) return;
  try{
    const bk = JSON.parse(legacy);
    const ch = (bk.channel === 'ja') ? 'ja' : 'ko';  // 'both' 도 ko 에 저장
    if(!localStorage.getItem(LS_BRANDKIT_PREFIX + ch)){
      localStorage.setItem(LS_BRANDKIT_PREFIX + ch, JSON.stringify(bk));
    }
  }catch(_){}
  localStorage.removeItem(LS_BRANDKIT_LEGACY);
}
_migrateLegacyBrandkit();

function _bkChannel(){
  // 편집 중인 브랜드킷 언어 (기본: ko)
  return document.getElementById('bk-channel')?.value === 'ja' ? 'ja' : 'ko';
}
function loadBrandkit(channel){
  const ch = channel || _bkChannel();
  try{
    const raw = localStorage.getItem(LS_BRANDKIT_PREFIX + ch);
    if(raw) return Object.assign({ channel: ch }, JSON.parse(raw));
  }catch(_){}
  return { name:'', color: ch==='ja' ? '#6A98E8' : '#FF6B9D', font: ch==='ja' ? 'noto-jp' : 'pretendard', logo:'', channel: ch };
}
function saveBrandkit(bk){
  const ch = bk.channel === 'ja' ? 'ja' : 'ko';
  localStorage.setItem(LS_BRANDKIT_PREFIX + ch, JSON.stringify(bk));
  _updateBrandkitSummary();
}
function bkSave(){
  const bk = {
    name:    document.getElementById('bk-name').value.trim(),
    color:   document.getElementById('bk-color').value,
    font:    document.getElementById('bk-font').value,
    logo:    document.getElementById('bk-logo').value.trim(),
    channel: document.getElementById('bk-channel').value
  };
  saveBrandkit(bk);
  const chLbl = bk.channel === 'ja' ? '🇯🇵 일본채널' : '🇰🇷 한국채널';
  alert('💾 ' + chLbl + ' 브랜드킷 저장됨\n\n한국/일본 채널 각각 다르게 관리할 수 있어요.\n위 "채널 언어" 를 바꾸면 다른 채널의 브랜드킷을 편집할 수 있습니다.');
}
// 브랜드킷 채널 전환 시 해당 언어 값으로 UI 자동 전환
function bkSwitchChannel(){
  const bk = loadBrandkit(_bkChannel());
  const set = (id, v) => { const el = document.getElementById(id); if(el) el.value = v || ''; };
  set('bk-name',  bk.name);
  set('bk-color', bk.color || '#FF6B9D');
  set('bk-font',  bk.font  || 'pretendard');
  set('bk-logo',  bk.logo);
  _updateBrandkitSummary();
}
function _updateBrandkitSummary(){
  const s = document.getElementById('bk-summary');
  if(!s) return;
  const bkKo = loadBrandkit('ko');
  const bkJa = loadBrandkit('ja');
  const parts = [];
  if(bkKo.name) parts.push('🇰🇷 ' + bkKo.name);
  if(bkJa.name) parts.push('🇯🇵 ' + bkJa.name);
  s.textContent = parts.length ? ('· ' + parts.join(' / ')) : '(설정 안 됨)';
}
function _applyBrandkitToCanvas(containerSel, channel){
  const bk = loadBrandkit(channel);
  const el = document.querySelector(containerSel);
  if(el) el.style.setProperty('--bld-brand', bk.color);
}

/* ─── Builder 전역 상태 ─── */


