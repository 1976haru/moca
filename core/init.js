/* ========================================================
   core/init.js  --  플로팅 주제·온보딩·FAB·브레드크럼·각종 초기화 IIFE
   index.html 인라인 블록 3에서 통째 분리 (Phase B)
   ======================================================== */

(function(){
  var isOpen = localStorage.getItem('tp_float_open') !== '0';

  window.tpFloatToggle = function(){
    isOpen = !isOpen;
    localStorage.setItem('tp_float_open', isOpen ? '1' : '0');
    var b = document.getElementById('tp-float-body');
    var t = document.getElementById('tp-float-toggle');
    if(isOpen){ b.classList.remove('tp-hide'); t.textContent='🔥 오늘의 추천 주제'; }
    else { b.classList.add('tp-hide'); t.textContent='🔥'; }
  };

  window.tpFloatMake = function(lang){
    var text = lang === 'kr'
      ? document.getElementById('tp-float-kr').textContent
      : document.getElementById('tp-float-jp').textContent;
    if(typeof __hubGoCategory === 'function') __hubGoCategory('script');
    setTimeout(function(){
      var el = document.getElementById('one-input')
        || document.getElementById('topic')
        || document.querySelector('[placeholder*="주제"]');
      if(el){ el.value = text; el.focus(); }
    }, 350);
  };

  var d = new Date();
  var de = document.getElementById('tp-float-date');
  if(de) de.textContent = (d.getMonth()+1) + '월 ' + d.getDate() + '일';

  var sm = {
    1:'새해·건강검진·겨울건강', 2:'설날·부모님건강·면역력',
    3:'봄맞이·건강검진 준비', 4:'봄·어린이날 준비·건강검진',
    5:'어버이날·가정의달·효도', 6:'초여름·더위 대비·건강',
    7:'여름건강·무더위 극복', 8:'휴가·노후 여행·건강',
    9:'가을건강·추석·부모님', 10:'단풍·노후준비·건강검진',
    11:'김장·겨울준비·면역력', 12:'연말·한해마무리·건강'
  };
  var se = document.getElementById('tp-float-season');
  if(se && sm[d.getMonth()+1]) se.textContent = '이번주: ' + sm[d.getMonth()+1];

  if(!isOpen){
    var b = document.getElementById('tp-float-body');
    var t = document.getElementById('tp-float-toggle');
    if(b) b.classList.add('tp-hide');
    if(t) t.textContent = '🔥';
  }
})();

/* ═══════════════════════════════════════════════════════════

🎨 UI Polish — 10가지 개선안 JS
   ═══════════════════════════════════════════════════════════ */

/* ─── 1. 상단 컨트롤바 (검색·아이콘·언어·AI상태) ─── */

(function mountNavCtrl(){
  if(document.getElementById('navCtrl')) return;
  const ctrl = document.createElement('div');
  ctrl.id = 'navCtrl';
  ctrl.className = 'nav-ctrl';
  ctrl.innerHTML =
    '<div class="nav-search" id="navSearch">' +
      '<input id="navSearchInput" placeholder="카테고리·기능 검색 (예: 블로그, 숏츠, SEO...)">' +
      '<div class="search-dd" id="navSearchDd"></div>' +
    '</div>' +
    '<span class="nav-ai-status" id="navAiStatus">🟡 연결 확인 중</span>' +
    '<div class="nav-lang-dd" id="navLangDd">' +
      '<button class="nav-lang-btn" onclick="document.getElementById(\'navLangDd\').classList.toggle(\'open\')"><span id="navLangCur">🇰🇷</span>▼</button>' +
      '<div class="nav-lang-menu">' +
        '<button onclick="navLangPick(\'ko\')">🇰🇷 한국어</button>' +
        '<button onclick="navLangPick(\'ja\')">🇯🇵 日本語</button>' +
        '<button onclick="navLangPick(\'en\')">🇺🇸 English</button>' +
      '</div>' +
    '</div>' +
    '<button class="nav-icon" title="설정" onclick="navGoSettings()">⚙</button>' +
    '<button class="nav-icon" title="도움말" onclick="navOpenHelp()">?</button>';
  const app = document.querySelector('.app');
  if(app) app.insertBefore(ctrl, app.firstChild);

  // 검색
  const input = document.getElementById('navSearchInput');
  const dd = document.getElementById('navSearchDd');
  input.addEventListener('focus', () => navSearchUpdate(input.value));
  input.addEventListener('input', () => navSearchUpdate(input.value));
  input.addEventListener('blur', () => setTimeout(()=>dd.classList.remove('open'), 200));
  input.addEventListener('keydown', e => {
    if(e.key === 'Escape') { dd.classList.remove('open'); input.blur(); }
  });
  // 외부 클릭 시 언어 드롭다운 닫기
  document.addEventListener('click', e => {
    const ld = document.getElementById('navLangDd');
    if(ld && !ld.contains(e.target)) ld.classList.remove('open');
  });
  _refreshNavAiStatus();
  setInterval(_refreshNavAiStatus, 5000);
})();



/* 검색 */
const NAV_SEARCH_INDEX = [

// 카테고리
  { t:'📱 숏츠 스튜디오', d:'대본·이미지·영상 올인원', go:()=>{ state.category='shorts'; renderAll(); } },

{ t:'🎬 미디어 엔진',    d:'음성·이미지·영상·음악', go:()=>{ state.category='media'; renderAll(); } },

{ t:'💰 수익형 콘텐츠',  d:'블로그·전자책·웹툰·SNS', go:()=>{ state.category='profit'; renderAll(); } },

{ t:'🏛️ 공공기관 패키지', d:'보도자료·공문·회의록', go:()=>{ state.category='public'; renderAll(); } },

{ t:'📚 학습/교육',       d:'강의자료·퀴즈·워크북', go:()=>{ state.category='edu'; renderAll(); } },

{ t:'🌐 번역/통역',       d:'한·영·일·중 동시', go:()=>{ state.category='trans'; renderAll(); } },

{ t:'🏪 소상공인',         d:'메뉴판·전단지·SNS', go:()=>{ state.category='smb'; renderAll(); } },

{ t:'🔮 심리/운세',        d:'타로·MBTI·사주', go:()=>{ state.category='psy'; renderAll(); } },

{ t:'📁 내 보관함',        d:'만든 것들 모아보기', go:()=>{ state.category='library'; renderAll(); } },

{ t:'🔥 트렌드 분석',      d:'이번주 뜨는 주제', go:()=>{ state.category='trend'; renderAll(); } },

{ t:'🔍 유튜브 벤치마킹',  d:'잘된 영상 분석', go:()=>{ state.category='bench'; renderAll(); } },

// 기능 (우회 진입점)
  { t:'⚙️ 설정 → API 키', d:'Claude/OpenAI/Gemini 키 관리', go:()=>navGoSettings('ai') },

{ t:'👤 프로필 관리',   d:'여러 사용자 · 스타일 학습', go:()=>navGoSettings('profile') },

{ t:'💸 비용 관리',      d:'예산·환율·절약 모드', go:()=>navGoSettings('cost') },

{ t:'🎨 꾸미기',         d:'테마·색상·폰트', go:()=>navGoSettings('theme') },

{ t:'📊 통계',           d:'내 사용 현황', go:()=>navGoSettings('stats') },

{ t:'✨ SEO 자동 개선',  d:'콘텐츠 빌더 > 블로그', go:()=>{ state.category='profit'; renderAll(); } },

{ t:'🧪 A/B 테스트',     d:'제목·이미지 2안 동시', go:()=>{ state.category='profit'; renderAll(); } },

];

/* ─── 2. 브레드크럼 고정바 ─── */

(function mountBreadcrumb(){
  if(document.getElementById('breadcrumb')) return;
  const bc = document.createElement('div');
  bc.id = 'breadcrumb';
  bc.className = 'breadcrumb';
  bc.innerHTML =
    '<button class="bc-back" onclick="bcGoBack()">← 이전</button>' +
    '<div class="bc-path" id="bcPath"></div>' +
    '<span class="bc-save saved" id="bcSave">✓ 저장됨</span>';
  const app = document.querySelector('.app');
  const navC = document.getElementById('navCtrl');
  if(app && navC) app.insertBefore(bc, navC.nextSibling);
  _bcUpdate();
  // state.category 변경 감지 (주기적 갱신)
  setInterval(_bcUpdate, 800);
})();







/* ─── 3. 사이드바 sticky + 활성 카테고리 + 뱃지 ─── */
(function enhanceSidebar(){
  setInterval(() => {
    const sidebar = document.getElementById('sidebar'); if(!sidebar) return;
    const btns = sidebar.querySelectorAll('button.sidebtn');
    btns.forEach(btn => {
      btn.classList.remove('active-cat');
      const title = (btn.textContent||'').trim();
      const cat = categories.find(c => title.indexOf(c.title) >= 0);
      if(!cat) return;
      if(state.category === cat.id) btn.classList.add('active-cat');
      // 진행중 뱃지 (숏츠 스튜디오)
      btn.querySelectorAll('.progress-badge,.complete-badge').forEach(x => x.remove());
      if(cat.id === 'shorts'){
        if(typeof STUDIO !== 'undefined' && STUDIO.project && STUDIO.project.step > 0 && STUDIO.project.step < 6){
          const b = document.createElement('span'); b.className='progress-badge';
          b.textContent = STUDIO.project.step + '/6 진행중';
          btn.appendChild(b);
        } else if(typeof STUDIO !== 'undefined' && STUDIO.project && STUDIO.project.step === 6){
          const b = document.createElement('span'); b.className='complete-badge'; b.textContent='✅';
          btn.appendChild(b);
        }
      }
    });
  }, 1200);
})();

/* ─── 4. 작업 중 경고 모달 ─── */

/* ─── 6. 플로팅 빠른메뉴 (우측 하단) ─── */

(function mountFabMenu(){
  if(document.getElementById('fabMenu')) return;
  const menu = document.createElement('div');
  menu.id = 'fabMenu';
  menu.className = 'fab-menu';
  menu.innerHTML =
    '<button class="fab-btn"         title="도움말"  onclick="navOpenHelp()">? <span class="fab-tip">도움말</span></button>' +
    '<button class="fab-btn"         title="저장"   onclick="fabSave()">💾 <span class="fab-tip">저장</span></button>' +
    '<button class="fab-btn"         title="이어하기" onclick="fabResume()">↩ <span class="fab-tip">이어하기</span></button>' +
    '<button class="fab-btn primary" title="홈"     onclick="bcGoHome()">🏠 <span class="fab-tip">홈</span></button>';
  document.body.appendChild(menu);
})();



/* ─── 10. 자동 복귀 모달 (재접속 시) ─── */
document.addEventListener('DOMContentLoaded', function(){
  setTimeout(() => {
    const lastCat = localStorage.getItem('uc_last_category');
    const alreadyShown = sessionStorage.getItem('uc_resume_shown');
    if(!lastCat || alreadyShown) return;
    sessionStorage.setItem('uc_resume_shown', '1');
    // 대상 카테고리 정보
    const cat = categories.find(c => c.id === lastCat);
    if(!cat) return;
    // 숏츠 스튜디오 진행 중이면 특별 표시
    let info = cat.icon + ' ' + cat.title;
    if(lastCat === 'shorts'){
      try{
        const list = JSON.parse(localStorage.getItem('uc_studio_projects')||'[]');
        const recent = list[0];
        if(recent && recent.step > 0) info += ' · Step ' + recent.step + '/6 진행 중 — "' + recent.name + '"';
      }catch(_){}
    }
    _showResumeModal(info, lastCat);
  }, 800);
});


/* ─── 저장 상태 실시간 동기화 (브레드크럼 ↔ 토스트) ─── */
(function hookAutoSave(){
  if(typeof studioSave === 'function'){

const orig = studioSave;

window.studioSave = function(){
      setBcSaveState('saving');
      orig.apply(this, arguments);
      setTimeout(() => setBcSaveState('saved'), 200);
    };

}
})();

/* ═══════════════════════════════════════════════════════════
   🌟 ucHeader — 새 상단 헤더 (기존 top/costbar/newHeader 전부 대체)
   ═══════════════════════════════════════════════════════════ */
// 이전 헤더가 이미 마운트됐으면 제거
(function removeOldHeaders(){
  ['newHeader','navCtrl','breadcrumb'].forEach(id => {

const el = document.getElementById(id); if(el) el.remove();

});
})();

(function mountUcHeader(){
  // 정적 HTML이 이미 index.html 에 있으면 생성 생략, 리스너만 연결
  let hdr = document.getElementById('ucHeader');
  const alreadyStatic = !!hdr;
  if(alreadyStatic){
    /* 정적 HTML 사용 — createElement 건너뛰고 listener setup 으로 이동 */
  } else {
  hdr = document.createElement('header');
  hdr.id = 'ucHeader';
  hdr.innerHTML =
    // 줄1: 정보바 (날짜·날씨 / 로고·제목 / AI·비용·잔액)
    '<div class="uch-info">' +
      '<div class="uch-date">' +
        '<span id="uchDateStr">—</span>' +
        '<div class="uch-weather" id="uchWeather" title="Open-Meteo · 서울">' +
          '<span id="uchWIcon">⛅</span>' +
          '<span id="uchWTemp"></span>' +
          '<span id="uchWDesc">날씨…</span>' +
        '</div>' +
      '</div>' +
      '<div class="uch-center">' +
        '<div class="uch-logo">통</div>' +
        '<h1 class="uch-title">통합 콘텐츠 생성기</h1>' +
      '</div>' +
      '<div class="uch-status">' +
        '<span class="uch-ai" id="uchAiStatus"><span id="uchAiDot">🔴</span> <span id="uchAiName">AI 미연결</span></span>' +
        '<span class="uch-cost">☀️ 오늘 <b id="uchToday">0원</b></span>' +
        '<span class="uch-cost">📊 이번달 <b id="uchMonth">0원</b></span>' +
        '<button class="uch-balance" onclick="(typeof openBalanceLinks===\'function\'?openBalanceLinks():alert(\'잔액은 각 AI 콘솔에서 확인하세요\'))">💳 잔액확인</button>' +
      '</div>' +
    '</div>' +
    // 줄2: 컨트롤바 (탭 / 검색 / 언어·아이콘)
    '<div class="uch-ctrl">' +
      '<div class="uch-tabs" id="uchTabs">' +
        '<button class="on" data-mode="normal">✨ 일반</button>' +
        '<button data-mode="kids">🧒 어린이</button>' +
        '<button data-mode="guide">📖 가이드</button>' +
        '<button data-mode="setting">⚙️ 설정</button>' +
      '</div>' +
      '<div class="uch-search">' +
        '<input id="uchSearchInput" placeholder="카테고리·기능 검색 (블로그, 숏츠, SEO…)">' +
        '<div class="uch-search-dd" id="uchSearchDd"></div>' +
      '</div>' +
      '<div class="uch-icons">' +
        '<div class="uch-lang-dd" id="uchLangDd">' +
          '<button class="uch-lang-btn" onclick="document.getElementById(\'uchLangDd\').classList.toggle(\'open\')"><span id="uchLangCur">🇰🇷</span>▾</button>' +
          '<div class="uch-lang-menu">' +
            '<button onclick="uchPickLang(\'ko\')">🇰🇷 한국어</button>' +
            '<button onclick="uchPickLang(\'ja\')">🇯🇵 日本語</button>' +
            '<button onclick="uchPickLang(\'en\')">🇺🇸 English</button>' +
          '</div>' +
        '</div>' +
        '<button class="uch-icon" title="소개"  onclick="uchClickTab(\'about\')">☕</button>' +
        '<button class="uch-icon" title="Q&A"   onclick="uchClickTab(\'qna\')">💬</button>' +
        '<button class="uch-icon" title="도움말" onclick="(typeof navOpenHelp===\'function\'?navOpenHelp():alert(\'도움말\'))">❓</button>' +
      '</div>' +
    '</div>' +
    // 줄3: 브레드크럼 (카테고리 선택 시만 표시)
    '<div class="uch-breadcrumb" id="uchBreadcrumb">' +
      '<span class="bc-home" onclick="uchGoHome()">🏠 홈</span>' +
      '<span class="bc-sep">›</span>' +
      '<span class="bc-current" id="uchBcCurrent">카테고리</span>' +
      '<span class="bc-save saved" id="uchBcSave">✓ 저장됨</span>' +
    '</div>';
  document.body.insertBefore(hdr, document.body.firstChild);
  }  /* end of !alreadyStatic */

  // 탭 클릭 → 기존 toptab 연동
  document.querySelectorAll('#uchTabs button').forEach(b => {

b.addEventListener('click', () => uchClickTab(b.getAttribute('data-mode')));

});

  // 검색
  const si = document.getElementById('uchSearchInput');
  si.addEventListener('focus', () => uchSearchUpdate(si.value));
  si.addEventListener('input', () => uchSearchUpdate(si.value));
  si.addEventListener('blur',  () => setTimeout(() => document.getElementById('uchSearchDd').classList.remove('open'), 200));

  // 외부 클릭 시 드롭다운 닫기
  document.addEventListener('click', e => {

const ld = document.getElementById('uchLangDd');

if(ld && !ld.contains(e.target)) ld.classList.remove('open');

});

  // 초기 동기화
  uchSyncDate();
  uchFetchWeather();
  uchSyncStatus();
  uchSyncBreadcrumb();
  setInterval(uchSyncStatus, 3000);
  setInterval(uchSyncBreadcrumb, 800);
  setInterval(uchFetchWeather, 10*60*1000);
})();

/* 탭 클릭 → 기존 toptab 연동 */

/* 언어 드롭다운 → 기존 lang toptab 연동 */

/* 홈 복귀 */


/* 날짜 */


/* 날씨 — Open-Meteo 무료 API (서울) */


/* AI 상태 + 비용 동기화 */


/* 브레드크럼 + 활성 모드 반영 */


/* 검색 — 기존 NAV_SEARCH_INDEX 재사용 */



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
