/* ================================================
   shared/topnav.js
   헤더 없는 엔진 페이지(shorts/media 등)에 미니 상단바 주입
   * 🏠 홈 / ← 뒤로 / [data-moca-header-actions] (api-settings-button 자리)
   * 메인 index.html 처럼 .uch-top 가 있으면 주입 스킵 (대신 .uch-icons에
     api-settings-button이 알아서 들어감)
   ================================================ */
(function(){
  'use strict';

  var TOPNAV_ID = 'moca-topnav';

  /* ── 메인 index.html 경로 추정 ── */
  function getMocaHomeUrl() {
    try {
      var p = window.location.pathname;
      /* /moca/engines/shorts/index.html → /moca/index.html */
      var idx = p.indexOf('/engines/');
      if (idx >= 0) return p.slice(0, idx + 1) + 'index.html';
      /* /xxx/engines/yyy/ 처럼 trailing slash */
      var idx2 = p.lastIndexOf('/engines/');
      if (idx2 >= 0) return p.slice(0, idx2 + 1) + 'index.html';
      return '/index.html';
    } catch(_) { return '../../index.html'; }
  }
  window.getMocaHomeUrl = getMocaHomeUrl;

  /* ── 뒤로가기 동작 ── */
  function goBack() {
    try {
      var url = new URL(window.location.href);
      var step = parseInt(url.searchParams.get('step'), 10);
      if (Number.isFinite(step) && step >= 2 && step <= 5) {
        url.searchParams.set('step', step - 1);
        window.location.href = url.toString();
        return;
      }
      if (Number.isFinite(step) && step === 1) {
        url.searchParams.delete('step');
        window.location.href = url.toString();
        return;
      }
    } catch(_) {}
    /* 그 외에는 메인으로 */
    window.location.href = getMocaHomeUrl();
  }
  window.mocaGoBack = goBack;

  /* ── 메인 홈 이동 ── */
  function goHome() {
    /* 현재가 메인이면 동작 안 함 */
    var p = window.location.pathname;
    if (p === '/' || /\/index\.html$/.test(p) && p.indexOf('/engines/') < 0) {
      try { console.log('[topnav] already at home'); } catch(_) {}
      return;
    }
    window.location.href = getMocaHomeUrl();
  }
  window.mocaGoHome = goHome;

  /* ── 메인 index.html 인지 ── */
  function _hasMainHeader() {
    return !!document.querySelector('.uch-top, .uch-tabs, .uch-icons');
  }

  /* ── topnav 주입 ── */
  function _ensureTopnav() {
    /* 메인 index 는 자체 헤더가 있으니 minimal nav 주입 안 함 */
    if (_hasMainHeader()) {
      try { console.log('[topnav] main header detected · skip'); } catch(_) {}
      return;
    }
    if (document.getElementById(TOPNAV_ID)) return;

    var nav = document.createElement('div');
    nav.id = TOPNAV_ID;
    nav.setAttribute('data-moca-topnav', '1');
    nav.innerHTML =
      '<div class="moca-tn-left">' +
        '<button data-moca-home-btn class="moca-tn-btn moca-tn-home" '+
          'onclick="window.mocaGoHome()" title="메인 홈으로 이동">' +
          '<span class="moca-tn-ico">🏠</span><span class="moca-tn-label">홈</span>' +
        '</button>' +
        '<button class="moca-tn-btn moca-tn-back" '+
          'onclick="window.mocaGoBack()" title="이전 단계로 이동">' +
          '<span class="moca-tn-ico">←</span><span class="moca-tn-label">뒤로</span>' +
        '</button>' +
        '<span class="moca-tn-crumb" id="moca-tn-crumb"></span>' +
      '</div>' +
      '<div class="moca-tn-right" data-moca-header-actions>' +
        /* api-settings-button 이 여기에 자동 주입 */
      '</div>';

    document.body.insertBefore(nav, document.body.firstChild);
    _updateBreadcrumb();
    try { console.log('[topnav] injected (engine page)'); } catch(_) {}
  }

  /* ── breadcrumb 텍스트 (현재 위치 표시) ── */
  function _updateBreadcrumb() {
    var el = document.getElementById('moca-tn-crumb');
    if (!el) return;
    var p = window.location.pathname;
    var parts = [];
    if (p.indexOf('/engines/shorts/') >= 0) {
      parts.push('숏츠 스튜디오');
      try {
        var step = parseInt(new URL(window.location.href).searchParams.get('step'), 10);
        var stepNames = { 1:'대본 생성', 2:'이미지·영상 소스', 3:'음성·BGM', 4:'편집', 5:'최종검수·출력' };
        if (Number.isFinite(step) && stepNames[step]) parts.push(stepNames[step]);
        else parts.push('대시보드');
      } catch(_) {}
    } else if (p.indexOf('/engines/media/') >= 0) {
      parts.push('콘텐츠 빌더');
    } else if (p.indexOf('/engines/script/') >= 0) {
      parts.push('대본 작가');
    }
    el.textContent = parts.length ? '› ' + parts.join(' › ') : '';
  }

  /* ── CSS ── */
  function _injectCSS() {
    if (document.getElementById('moca-topnav-style')) return;
    var st = document.createElement('style');
    st.id = 'moca-topnav-style';
    st.textContent =
      '#moca-topnav{position:sticky;top:0;z-index:2000;display:flex;align-items:center;justify-content:space-between;'+
        'gap:8px;padding:8px 14px;background:#fff;border-bottom:1px solid #ecdef0;'+
        'box-shadow:0 1px 3px rgba(0,0,0,.04);font-family:inherit}'+
      '.moca-tn-left,.moca-tn-right{display:flex;align-items:center;gap:6px}'+
      '.moca-tn-btn{display:inline-flex;align-items:center;gap:5px;height:34px;padding:0 12px;'+
        'border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:999px;'+
        'font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:.12s;white-space:nowrap}'+
      '.moca-tn-btn:hover{border-color:#9181ff;color:#9181ff;background:#f5f0ff}'+
      '.moca-tn-home{border-color:#ef6fab;color:#ef6fab}'+
      '.moca-tn-home:hover{background:#ef6fab;color:#fff;border-color:#ef6fab}'+
      '.moca-tn-ico{font-size:14px;line-height:1}'+
      '.moca-tn-crumb{margin-left:6px;font-size:12px;color:#7b6080;font-weight:700}'+
      '@media(max-width:760px){'+
        '.moca-tn-label{display:none}'+
        '.moca-tn-btn{padding:0 10px}'+
        '.moca-tn-crumb{display:none}'+
      '}'+
      '';
    document.head.appendChild(st);
  }

  /* 메인 index 의 .uch-icons 에는 [data-moca-header-actions] 마커가 없으니
     api-settings-button.js 가 .uch-icons 도 인식하게 도와줌 — marker 부착 */
  function _markMainHeaderActions() {
    var icons = document.querySelector('.uch-icons');
    if (icons && !icons.hasAttribute('data-moca-header-actions')) {
      icons.setAttribute('data-moca-header-actions', '1');
    }
  }

  function _init() {
    _injectCSS();
    _ensureTopnav();
    _markMainHeaderActions();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _init);
  else _init();
})();
