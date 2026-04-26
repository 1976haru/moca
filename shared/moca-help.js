/* ================================================
   shared/moca-help.js
   📘 사용자가이드 + ❓ Q&A — 헤더 버튼 + 모달
   * 헤더 [data-moca-header-actions] 컨테이너에 자동 주입
   * 모달 z-index: 20000, ESC/배경 닫기
   * Q&A 검색 (단순 문자열 필터)
   ================================================ */
(function(){
  'use strict';

  /* ════════════════════════════════════════════════
     가이드 데이터
     ════════════════════════════════════════════════ */
  var GUIDE_SECTIONS = [
    { id:'start', icon:'🚀', title:'처음 시작하기',
      body:'MOCA 통합 콘텐츠 생성기에 오신 것을 환영합니다. 처음이라면 먼저 우측 상단의 ⚙️ 통합 API 설정에서 사용할 API 키를 입력하세요. 키는 한 번만 입력하면 모든 단계에서 자동으로 사용됩니다.',
      action:{ label:'⚙️ 통합 API 설정 열기', call:"openApiSettingsModal('script')" } },
    { id:'order', icon:'🎬', title:'숏츠 제작 순서',
      body:'1단계 대본 생성 → 2단계 이미지·영상 소스 → 3단계 음성·BGM → 4단계 편집 → 5단계 최종검수·출력 순서로 진행하세요. 각 단계 우상단의 다음 버튼을 누르면 이동합니다.',
      action:{ label:'1단계 대본 생성으로 이동', call:"_mocaGoStep(1)" } },
    { id:'apikey', icon:'🔑', title:'통합 API 설정 방법',
      body:'우측 상단 ⚙️ 통합 API 설정을 누르면 8개 탭이 나옵니다. 사용할 API 키를 password 필드에 붙여넣고 💾 저장을 누르세요. 키는 브라우저에 저장되며 다른 단계에 자동 적용됩니다.',
      action:{ label:'통합 API 설정 열기', call:"openApiSettingsModal('script')" } },
    { id:'script', icon:'📝', title:'대본 생성 방법',
      body:'1단계에서 주제와 출력 언어를 입력하고 장르(감동/정보/시니어 등)를 선택하면 자동으로 추천 AI가 표시됩니다. 추천 1순위 AI를 선택하면 키 보유 여부가 즉시 보이고, 키가 있으면 바로 대본을 생성할 수 있습니다.',
      action:{ label:'1단계로 이동', call:"_mocaGoStep(1)" } },
    { id:'image', icon:'🎨', title:'이미지 생성 / 채택 방법',
      body:'2단계는 "씬 이미지 보드" 입니다. 상단에서 9:16 / 16:9 등 비율을 선택하고, 갤러리 카드에서 ⚡ 전체 이미지 생성 또는 🛠 조정을 누르면 됩니다. 각 카드 클릭하면 우측 drawer에서 자막 안전영역과 크기·위치 조정이 가능합니다.',
      action:{ label:'2단계로 이동', call:"_mocaGoStep(2)" } },
    { id:'voice', icon:'🎙', title:'음성 생성 방법',
      body:'3단계에서 추천 음성 API(ElevenLabs/OpenAI TTS/Nijivoice)를 선택하세요. 선택한 provider 의 키만 사용되며, 다른 provider 로 몰래 전환되지 않습니다. 키가 없으면 통합 설정 음성 탭이 자동으로 열립니다.',
      action:{ label:'3단계로 이동', call:"_mocaGoStep(3)" } },
    { id:'edit', icon:'✂️', title:'편집 / 최종검수 방법',
      body:'4단계 편집에서 템플릿·전환·자막 규칙을 정합니다. 2단계에서 조정한 이미지 크기·위치는 자동으로 4단계 editPlan 에 반영됩니다. 5단계에서 project.json 다운로드와 외부 업로드가 가능합니다.',
      action:{ label:'4단계로 이동', call:"_mocaGoStep(4)" } },
    { id:'mistakes', icon:'⚠️', title:'자주 하는 실수',
      body:'1) 모든 씬에 고비용 이미지 API를 사용하면 비용이 빠르게 늘어납니다. 일반 씬은 저비용, 핵심컷만 고품질을 권장합니다. 2) 이미지가 정사각형으로 나오면 비율이 9:16으로 설정되어 있는지 확인하세요. 3) 음성이 안 나오면 선택 provider 의 키가 통합 설정에 저장되어 있는지 확인하세요.' },
    { id:'troubleshoot', icon:'🛟', title:'문제 발생 시 확인할 것',
      body:'• 화면이 비어 있으면 새로고침(Ctrl+F5) → 캐시 비우기. • 키 입력했는데 안 되면 통합 설정에서 ✅ 저장됨 표시 확인. • API 호출이 실패하면 콘솔(F12) 에서 빨간 에러 메시지 확인 — API 키 값은 절대 콘솔에 출력되지 않습니다.' },
  ];

  /* ════════════════════════════════════════════════
     Q&A 데이터
     ════════════════════════════════════════════════ */
  var QA_LIST = [
    { q:'API 키는 어디에 입력하나요?',
      a:'우측 상단의 "⚙️ 통합 API 설정"에서 대본·이미지·음성·영상 API 키를 한 번만 입력하면 됩니다. 키는 8개 탭으로 분류되어 있고, 한 번 입력하면 모든 단계에서 자동 사용됩니다.' },
    { q:'이미지가 정사각형으로 나와요.',
      a:'2단계 이미지 단계에서 상단 비율 모드를 "숏츠 9:16" 으로 설정하고 다시 생성하세요. DALL-E 3 는 1024×1792, Flux/SD 는 768×1344 로 자동 설정됩니다.' },
    { q:'음성이 생성되지 않아요.',
      a:'3단계 음성 단계에서 선택한 provider(ElevenLabs/OpenAI TTS/Nijivoice 등)의 API 키가 통합 설정의 음성 탭에 저장되어 있는지 확인하세요. 키 없으면 자동으로 음성 탭이 열립니다.' },
    { q:'대본은 생성됐는데 이미지 프롬프트가 이상해요.',
      a:'2단계 상단 툴바에서 "🪄 전체 프롬프트 컴파일" 을 클릭하면 장르·씬 역할 기반으로 다시 생성됩니다. 또는 각 씬 카드의 🤖 프롬프트 AI생성 버튼으로 개별 재생성 가능합니다.' },
    { q:'비용이 걱정돼요.',
      a:'통합 설정 상단 "📦 추천 스택 프리셋" 에서 "숏츠 자동화 — 가성비" 를 선택하면 모든 단계에 저비용/스톡 이미지/무료 BGM 조합이 자동 적용됩니다. 또는 모든 씬에 고비용 API 를 쓰면 자동으로 경고가 뜹니다.' },
    { q:'일본어 채널은 어떻게 만들어요?',
      a:'1단계 대본에서 출력 언어를 "일본어" 또는 "한일 동시" 로 선택하세요. 3단계 음성에서는 자동으로 일본어 추천(Nijivoice → ElevenLabs → OpenAI TTS) 이 표시됩니다.' },
    { q:'홈으로 돌아가려면?',
      a:'좌측 상단의 🏠 홈 버튼을 누르면 메인 페이지로 이동합니다. ← 뒤로 버튼은 step 단위로 이전 단계로 갑니다.' },
    { q:'API 키가 안전한가요?',
      a:'현재 프로토타입에서는 브라우저 localStorage 에 저장됩니다. console.log/alert/HTML 어디에도 키 원문이 출력되지 않습니다. 단, 실제 서비스 배포 시에는 서버 암호화 저장으로 전환해야 합니다.' },
    { q:'2단계에서 조정한 이미지 크기/위치가 4단계에 반영되나요?',
      a:'네. 2단계 drawer 에서 조정한 fit/scale/offsetX/offsetY/cropPreset 은 STUDIO.project.s3.imagesV3 에 비파괴 저장되고, 4단계 진입 시 자동으로 editPlan.scenes[i].imageTransform 으로 동기화됩니다.' },
    { q:'추천 1순위가 마음에 안 들어요.',
      a:'통합 설정의 "⚙️ 기본 선호" 탭에서 "가격 우선 / 가성비 / 품질 우선 / 속도 우선" 을 변경하면 모든 단계의 추천 1~3순위가 그 기준으로 다시 정렬됩니다.' },
  ];

  /* ════════════════════════════════════════════════
     단계 이동 헬퍼
     ════════════════════════════════════════════════ */
  window._mocaGoStep = function(n) {
    /* 가이드 모달 닫기 */
    var m = document.getElementById('moca-help-modal'); if (m) m.remove();
    /* 현재가 shorts 엔진이면 step 변경, 아니면 메인으로 이동 (사용자 선택) */
    try {
      var url = new URL(window.location.href);
      if (url.pathname.indexOf('/engines/shorts/') >= 0) {
        url.searchParams.set('step', n);
        window.location.href = url.toString();
        return;
      }
    } catch(_) {}
    /* 그 외 — 메인 또는 안내 */
    if (typeof window.getMocaHomeUrl === 'function') {
      window.location.href = window.getMocaHomeUrl().replace(/index\.html$/, 'engines/shorts/index.html?step=' + n);
    } else {
      alert('숏츠 스튜디오에서 ' + n + '단계로 이동하세요.');
    }
  };

  /* ════════════════════════════════════════════════
     모달 공통
     ════════════════════════════════════════════════ */
  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function _closeModal(id){ var m = document.getElementById(id); if (m) m.remove(); document.removeEventListener('keydown', _modalEsc); }
  function _modalEsc(e){
    if (e.key !== 'Escape') return;
    var m = document.querySelector('.moca-help-modal-back');
    if (m) m.remove();
    document.removeEventListener('keydown', _modalEsc);
  }
  function _attachClose(modal){
    modal.addEventListener('click', function(e){ if (e.target === modal) modal.remove(); });
    document.addEventListener('keydown', _modalEsc);
  }

  /* ── 가이드 모달 ── */
  window.mocaOpenGuide = function() {
    /* 다른 모달 닫기 — 단, 통합 설정과는 충돌 안 하도록 z-index 같음 */
    var ex = document.getElementById('moca-help-modal'); if (ex) ex.remove();
    var modal = document.createElement('div');
    modal.id = 'moca-help-modal';
    modal.className = 'moca-modal-back moca-help-modal-back';
    var sectionsHtml = GUIDE_SECTIONS.map(function(s){
      return '<details class="moca-help-section">' +
        '<summary>'+s.icon+' '+_esc(s.title)+'</summary>' +
        '<div class="moca-help-body">' +
          '<p>'+_esc(s.body)+'</p>' +
          (s.action ? '<button class="moca-btn-primary" onclick="'+_esc(s.action.call)+';document.getElementById(\'moca-help-modal\').remove()">'+_esc(s.action.label)+'</button>' : '') +
        '</div>' +
      '</details>';
    }).join('');
    modal.innerHTML =
      '<div class="moca-modal-card moca-help-card" onclick="event.stopPropagation()">' +
        '<button class="moca-modal-close" aria-label="닫기" onclick="document.getElementById(\'moca-help-modal\').remove()">✕</button>' +
        '<h3 class="moca-modal-title">📘 사용자가이드</h3>' +
        '<p class="moca-modal-sub">처음이라면 위에서부터 차례로 펼쳐 보세요.</p>' +
        '<div class="moca-help-list">' + sectionsHtml + '</div>' +
      '</div>';
    _attachClose(modal);
    document.body.appendChild(modal);
  };

  /* ── Q&A 모달 ── */
  window.mocaOpenQa = function() {
    var ex = document.getElementById('moca-help-modal'); if (ex) ex.remove();
    var modal = document.createElement('div');
    modal.id = 'moca-help-modal';
    modal.className = 'moca-modal-back moca-help-modal-back';
    modal.innerHTML =
      '<div class="moca-modal-card moca-help-card" onclick="event.stopPropagation()">' +
        '<button class="moca-modal-close" aria-label="닫기" onclick="document.getElementById(\'moca-help-modal\').remove()">✕</button>' +
        '<h3 class="moca-modal-title">❓ 자주 묻는 질문</h3>' +
        '<input id="moca-qa-search" class="moca-qa-search" type="text" placeholder="궁금한 내용을 입력하세요" oninput="window._mocaFilterQa(this.value)">' +
        '<div id="moca-qa-list" class="moca-help-list">' + _renderQaList('') + '</div>' +
      '</div>';
    _attachClose(modal);
    document.body.appendChild(modal);
  };
  function _renderQaList(filter) {
    var f = String(filter || '').trim().toLowerCase();
    var items = QA_LIST;
    if (f) items = QA_LIST.filter(function(it){ return (it.q + ' ' + it.a).toLowerCase().indexOf(f) >= 0; });
    if (!items.length) return '<div class="moca-qa-empty">검색 결과가 없습니다. 가이드를 확인하거나 통합 API 설정의 안내를 참고하세요.</div>';
    return items.map(function(it){
      return '<details class="moca-help-section moca-qa-item">' +
        '<summary>Q. '+_esc(it.q)+'</summary>' +
        '<div class="moca-help-body"><p>A. '+_esc(it.a)+'</p></div>' +
      '</details>';
    }).join('');
  }
  window._mocaFilterQa = function(v){
    var list = document.getElementById('moca-qa-list');
    if (list) list.innerHTML = _renderQaList(v);
  };

  /* ════════════════════════════════════════════════
     헤더 버튼 주입
     ════════════════════════════════════════════════ */
  function _findHeader() {
    return document.querySelector('[data-moca-header-actions]')
        || document.querySelector('.uch-icons')
        || document.querySelector('.topbar-actions')
        || null;
  }
  function _ensureGuideBtn() {
    if (document.querySelector('[data-moca-guide-btn]')) return true;
    var c = _findHeader(); if (!c) return false;
    var b = document.createElement('button');
    b.setAttribute('data-moca-guide-btn','1');
    b.className = 'moca-chip moca-chip-help';
    b.type = 'button';
    b.title = '사용자가이드 — 처음이라면 여기부터';
    b.innerHTML = '<span class="moca-chip-ico">📘</span><span class="moca-chip-label">가이드</span>';
    b.onclick = function(){ window.mocaOpenGuide(); };
    c.appendChild(b);
    return true;
  }
  function _ensureQaBtn() {
    if (document.querySelector('[data-moca-qa-btn]')) return true;
    var c = _findHeader(); if (!c) return false;
    var b = document.createElement('button');
    b.setAttribute('data-moca-qa-btn','1');
    b.className = 'moca-chip moca-chip-help';
    b.type = 'button';
    b.title = '자주 묻는 질문';
    b.innerHTML = '<span class="moca-chip-ico">❓</span><span class="moca-chip-label">Q&amp;A</span>';
    b.onclick = function(){ window.mocaOpenQa(); };
    c.appendChild(b);
    return true;
  }

  /* ── CSS ── */
  function _injectCSS() {
    if (document.getElementById('moca-help-style')) return;
    var st = document.createElement('style');
    st.id = 'moca-help-style';
    st.textContent =
      '.moca-chip-help{}'+
      '.moca-help-card{max-width:560px;width:100%}'+
      '.moca-help-list{display:flex;flex-direction:column;gap:8px;margin-top:14px}'+
      '.moca-help-section{background:#fafafe;border:1px solid #ece6f5;border-radius:10px;padding:10px 14px;font-family:inherit}'+
      '.moca-help-section summary{cursor:pointer;list-style:none;font-size:13px;font-weight:800;color:#5b1a4a;display:flex;align-items:center;gap:6px}'+
      '.moca-help-section summary::after{content:"▾";margin-left:auto;color:#9181ff}'+
      '.moca-help-section[open] summary::after{content:"▴"}'+
      '.moca-help-body{margin-top:10px;font-size:12.5px;color:#3a3040;line-height:1.7}'+
      '.moca-help-body p{margin:0 0 10px}'+
      '.moca-qa-item summary{font-weight:700;color:#2b2430}'+
      '.moca-qa-search{width:100%;border:1.5px solid var(--line,#e9e4f3);border-radius:10px;padding:10px 14px;font-size:13px;font-family:inherit;margin-top:6px;box-sizing:border-box}'+
      '.moca-qa-search:focus{outline:none;border-color:#9181ff}'+
      '.moca-qa-empty{padding:20px;text-align:center;color:#999;font-size:12px;background:#fafafe;border-radius:10px}'+
      /* 모바일 라벨 숨김 */
      '@media(max-width:760px){.moca-chip-help .moca-chip-label{display:none}}';
    document.head.appendChild(st);
  }

  function _init() {
    _injectCSS();
    var tries = 0;
    function tryMount() {
      var ok = _ensureGuideBtn();
      ok = _ensureQaBtn() && ok;
      if (!ok && tries++ < 6) setTimeout(tryMount, 100);
    }
    tryMount();
    try { console.log('[topnav] guide+qa buttons ready'); } catch(_) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _init);
  else _init();
})();
