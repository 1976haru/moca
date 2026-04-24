/* ==================================================
   uch.js
   UCH (User Control Hub) -- top-bar sync/search/weather
   extracted by split_index2.py (Phase 2)
   ================================================== */

/* 탭 클릭 → 기존 toptab 연동 */
function uchClickTab(mode){
  const btn = document.querySelector('.toptab[data-mode="' + mode + '"]');
  if(btn){ btn.click(); }
  document.querySelectorAll('#uchTabs button').forEach(b => b.classList.toggle('on', b.getAttribute('data-mode') === mode));
  window.mocaToast && window.mocaToast('📍 ' + ({normal:'일반',kids:'어린이',guide:'가이드',setting:'설정',about:'소개',qna:'Q&A'}[mode] || mode), 'info');
}
/* 언어 드롭다운 → 기존 lang toptab 연동 */
function uchPickLang(lang){
  document.getElementById('uchLangDd').classList.remove('open');
  document.getElementById('uchLangCur').textContent = {ko:'🇰🇷', ja:'🇯🇵', en:'🇺🇸'}[lang] || '🇰🇷';
  const btn = document.querySelector('.toptab.lang[data-lang="' + lang + '"]');
  if(btn){ btn.click(); return; }
  if(typeof selectLang === 'function') selectLang(lang);
}
/* 홈 복귀 */
function uchGoHome(){
  if(typeof state !== 'undefined') state.category = null;
  if(typeof renderAll === 'function') renderAll();
  window.mocaToast && window.mocaToast('🏠 홈', 'info');
}

/* 날짜 */
function uchSyncDate(){
  const d = new Date();
  const dow = ['일','월','화','수','목','금','토'][d.getDay()];
  const el = document.getElementById('uchDateStr');
  if(el) el.textContent = (d.getMonth()+1) + '월 ' + d.getDate() + '일 (' + dow + ')';
}

/* 날씨 — Open-Meteo 무료 API (서울) */
async function uchFetchWeather(){
  const wEl = document.getElementById('uchWeather'); if(!wEl) return;
  const icon = document.getElementById('uchWIcon');
  const temp = document.getElementById('uchWTemp');
  const desc = document.getElementById('uchWDesc');
  try{
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.57&longitude=126.98&current=temperature_2m,weathercode&timezone=Asia%2FSeoul', {
      headers:{ 'Accept':'application/json' }
    });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const t = Math.round(data.current?.temperature_2m ?? 0);
    const code = data.current?.weathercode ?? 0;
    const map = {
      0:['☀️','맑음'], 1:['🌤','대체로 맑음'], 2:['⛅','구름 조금'], 3:['☁️','흐림'],
      45:['🌫','안개'], 48:['🌫','짙은 안개'],
      51:['🌦','약한 이슬비'], 53:['🌦','이슬비'], 55:['🌦','강한 이슬비'],
      56:['🌨','얼음 이슬비'], 57:['🌨','강한 얼음 이슬비'],
      61:['🌧','약한 비'], 63:['🌧','비'], 65:['🌧','강한 비'],
      66:['🌨','얼음 비'], 67:['🌨','강한 얼음 비'],
      71:['🌨','약한 눈'], 73:['🌨','눈'], 75:['❄️','폭설'], 77:['❄️','싸락눈'],
      80:['🌦','소나기'], 81:['🌧','강한 소나기'], 82:['⛈','매우 강한 소나기'],
      85:['🌨','약한 소낙눈'], 86:['❄️','강한 소낙눈'],
      95:['⛈','뇌우'], 96:['⛈','뇌우+약한 우박'], 99:['⛈','뇌우+강한 우박']
    };
    const w = map[code] || ['🌤','흐림'];
    wEl.classList.remove('err');
    if(icon) icon.textContent = w[0];
    if(temp) temp.textContent = t + '°';
    if(desc) desc.textContent = w[1];
  }catch(e){
    wEl.classList.add('err');
    if(icon) icon.textContent = '❓';
    if(temp) temp.textContent = '';
    if(desc) desc.textContent = '날씨 불가';
  }
}

/* AI 상태 + 비용 동기화 */
function uchSyncStatus(){
  const dot = document.getElementById('uchAiDot');
  const name = document.getElementById('uchAiName');
  const oldDot = document.getElementById('cb-ai-dot');
  const oldName = document.getElementById('cb-ai-name');
  if(dot && oldDot && oldDot.textContent) dot.textContent = oldDot.textContent;
  if(name && oldName && oldName.textContent) name.textContent = oldName.textContent;
  // 기존 UI 미존재 시 직접 계산
  if(name && (!oldName || !oldName.textContent)){

try{
      const hasKey = ['claude','openai','gemini'].some(p => localStorage.getItem('uc_' + p + '_key'));
      if(!hasKey){ dot.textContent='🔴'; name.textContent='AI 미연결'; }
      else if(typeof APIAdapter !== 'undefined'){
        const cur = APIAdapter.getProvider();
        const names = {claude:'🟣 Claude', openai:'🟢 ChatGPT', gemini:'🔵 Gemini', minimax:'🔴 MiniMax'};
        dot.textContent='🟢'; name.textContent = (names[cur]||cur) + ' 연결';
      }
    }catch(_){}

}
  const today = document.getElementById('uchToday');
  const month = document.getElementById('uchMonth');
  const oldToday = document.getElementById('cb-today');
  const oldMonth = document.getElementById('cb-month');
  if(today && oldToday && oldToday.textContent) today.textContent = oldToday.textContent;
  if(month && oldMonth && oldMonth.textContent) month.textContent = oldMonth.textContent;
  if(today && (!oldToday || !oldToday.textContent) && typeof CostTracker !== 'undefined'){

try{
      const s = CostTracker.getStatus();
      today.textContent = Math.round(s.todayKRW).toLocaleString() + '원';
      month.textContent = Math.round(s.monthKRW).toLocaleString() + '원';
    }catch(_){}

}
}

/* 브레드크럼 + 활성 모드 반영 */
function uchSyncBreadcrumb(){
  const bc = document.getElementById('uchBreadcrumb');
  const cur = document.getElementById('uchBcCurrent');
  if(!bc || !cur || typeof state === 'undefined') return;
  const cat = state.category ? (categories.find(c => c.id === state.category)) : null;
  if(cat){
    bc.classList.add('on');
    let text = cat.icon + ' ' + cat.title;
    if(cat.id === 'shorts' && typeof STUDIO !== 'undefined' && STUDIO.project && STUDIO.project.step > 0){
      text += ' › Step ' + STUDIO.project.step + '/6';
    } else if(cat.id === 'shorts' && typeof shState !== 'undefined' && shState.step > 0){
      text += ' › Step ' + shState.step;
    }
    cur.textContent = text;
  } else {
    bc.classList.remove('on');
  }
  const activeMode = document.querySelector('.toptab.on:not(.lang)');
  if(activeMode){
    const m = activeMode.getAttribute('data-mode');
    document.querySelectorAll('#uchTabs button').forEach(b => b.classList.toggle('on', b.getAttribute('data-mode') === m));
  }
}

/* 검색 — 기존 NAV_SEARCH_INDEX 재사용 */
function uchSearchUpdate(q){
  const dd = document.getElementById('uchSearchDd');
  if(!dd || typeof NAV_SEARCH_INDEX === 'undefined') return;
  q = (q||'').trim().toLowerCase();
  let items = [];
  if(!q){

items.push({group:'바로가기'});

items = items.concat(NAV_SEARCH_INDEX.slice(0, 8));

} else {

items.push({group:'검색 결과'});

const found = NAV_SEARCH_INDEX.filter(x => (x.t + x.d).toLowerCase().includes(q)).slice(0, 12);

items = items.concat(found);

if(!found.length){ dd.innerHTML = '<div class="sd-group">검색 결과 없음</div>'; dd.classList.add('open'); return; }

}
  dd.innerHTML = items.map(it => {

if(it.group) return '<div class="sd-group">' + it.group + '</div>';

return '<div class="sd-item" onclick="uchSearchPick(' + NAV_SEARCH_INDEX.indexOf(it) + ')">' +

'<span>' + it.t + '</span><span class="sd-desc">' + it.d + '</span></div>';

}).join('');
  dd.classList.add('open');
}
function uchSearchPick(i){
  const it = NAV_SEARCH_INDEX[i]; if(!it) return;
  document.getElementById('uchSearchDd').classList.remove('open');
  document.getElementById('uchSearchInput').value = '';
  try{ it.go(); window.mocaToast && window.mocaToast('📍 ' + it.t + ' 이동', 'info'); }catch(e){}
}

/* 저장 상태 후킹 */
(function hookUchSave(){
  if(typeof setBcSaveState === 'function'){
    const orig = setBcSaveState;
    window.setBcSaveState = function(s){
      orig.apply(this, arguments);
      const el = document.getElementById('uchBcSave');
      if(!el) return;
      el.classList.remove('saving','saved');
      if(s === 'saving'){ el.textContent='저장중…'; el.classList.add('saving'); }
      else { el.textContent='✓ 저장됨'; el.classList.add('saved'); }
    };
  }
})();
