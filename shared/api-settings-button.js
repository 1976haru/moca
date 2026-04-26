/* ================================================
   shared/api-settings-button.js
   ⚙️ 통합 API 설정 — 헤더 주입 우선, fallback 은 우측 "하단"
   * 우측 상단 floating 금지 (기존 메뉴 가림 문제)
   * 헤더 컨테이너 우선순위:
     [data-moca-header-actions] > .uch-icons > .topbar-actions > .moca-header-actions
   * 헤더 미발견 시에만 우측 하단 floating
   * dedup [data-moca-api-settings-btn]
   ================================================ */
(function(){
  'use strict';

  var FAB_ID = 'moca-api-fab';
  var BTN_ATTR = 'data-moca-api-settings-btn';

  /* ── 현재 단계/맥락 → group 매핑 ── */
  function _detectGroup() {
    try {
      var url = new URL(window.location.href);
      var step = parseInt(url.searchParams.get('step'), 10);
      if (Number.isFinite(step)) {
        if (step === 1) return 'script';
        if (step === 2) return 'image';
        if (step === 3) return 'voice';
        if (step === 4) return 'video';
        if (step === 5) return 'upload';
      }
    } catch(_) {}
    if (window.STUDIO && window.STUDIO.project && window.STUDIO.project.currentStep) {
      var s = +window.STUDIO.project.currentStep;
      if (s === 1) return 'script';
      if (s === 2) return 'image';
      if (s === 3) return 'voice';
      if (s === 4) return 'video';
      if (s === 5) return 'upload';
    }
    return 'script';
  }

  /* ── 클릭 핸들러 ── */
  window.mocaOpenApiSettings = function(group) {
    var g = group || _detectGroup();
    if (typeof window.openApiSettingsModal === 'function') {
      try { console.log('[api-settings] open group:', g); } catch(_) {}
      window.openApiSettingsModal(g);
      return;
    }
    if (typeof window.renderApiSettings === 'function') {
      window._mocaApiActiveTab = g;
      try { console.log('[api-settings] open group (fallback):', g); } catch(_) {}
      window.renderApiSettings();
      return;
    }
    alert('통합 API 설정 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
  };

  /* ── 버튼 HTML (헤더용 / floating fallback 공용) ── */
  function _btnHtml(extraClass) {
    return '<button '+BTN_ATTR+' class="moca-api-btn '+(extraClass||'')+'" type="button" '+
      'title="대본·이미지·음성·영상 API 키를 한 곳에서 관리합니다." '+
      'onclick="window.mocaOpenApiSettings()">'+
      '<span class="moca-api-ico">⚙️</span>'+
      '<span class="moca-api-label">통합 API 설정</span>'+
    '</button>';
  }

  /* ── 헤더 컨테이너 탐색 ── */
  function _findHeaderContainer() {
    return document.querySelector('[data-moca-header-actions]')
        || document.querySelector('.uch-icons')
        || document.querySelector('.topbar-actions')
        || document.querySelector('.moca-header-actions')
        || null;
  }

  /* ── 중복 방지 ── */
  function _alreadyExists() {
    return !!document.querySelector('['+BTN_ATTR+']');
  }

  /* ── 헤더 안에 정적 버튼 주입 ── */
  function _mountInHeader(container) {
    if (_alreadyExists()) return true;
    var holder = document.createElement('span');
    holder.className = 'moca-api-btn-holder';
    holder.innerHTML = _btnHtml('moca-api-btn-header');
    container.appendChild(holder.firstChild);
    try { console.log('[api-settings] mounted in header'); } catch(_) {}
    return true;
  }

  /* ── 우측 "하단" floating fallback (상단 금지) ── */
  function _mountFloating() {
    if (_alreadyExists()) return;
    if (document.getElementById(FAB_ID)) return;
    var wrap = document.createElement('div');
    wrap.id = FAB_ID;
    wrap.innerHTML = _btnHtml('moca-api-btn-fab');
    document.body.appendChild(wrap.firstChild);
    try { console.log('[api-settings] mounted as bottom-right fallback'); } catch(_) {}
  }

  /* ── CSS ── */
  function _injectCSS() {
    if (document.getElementById('moca-api-btn-style')) return;
    var st = document.createElement('style');
    st.id = 'moca-api-btn-style';
    st.textContent =
      /* 공통 버튼 스타일 */
      '.moca-api-btn{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 14px;'+
        'border:none;border-radius:999px;cursor:pointer;font-family:inherit;'+
        'background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;'+
        'font-size:12.5px;font-weight:800;transition:.14s;white-space:nowrap}'+
      '.moca-api-btn:hover{transform:translateY(-1px);'+
        'box-shadow:0 3px 10px rgba(145,129,255,.35)}'+
      '.moca-api-ico{font-size:14px;line-height:1}'+
      '.moca-api-btn-holder{display:inline-flex;align-items:center;margin-left:6px}'+
      /* 헤더 안에 들어갔을 때 — fixed 아님, z-index 불필요 */
      '.moca-api-btn-header{position:static}'+
      /* fallback floating — 우측 "하단" */
      '.moca-api-btn-fab{position:fixed;bottom:24px;right:24px;z-index:19000;'+
        'height:44px;padding:0 18px;font-size:13px;'+
        'box-shadow:0 6px 20px rgba(145,129,255,.4)}'+
      '.moca-api-btn-fab:hover{transform:translateY(-1px);'+
        'box-shadow:0 8px 26px rgba(145,129,255,.55)}'+
      /* 모바일 — 라벨 숨김 */
      '@media(max-width:760px){'+
        '.moca-api-btn .moca-api-label{display:none}'+
        '.moca-api-btn{padding:0 12px}'+
        '.moca-api-btn-fab{bottom:16px;right:16px;height:46px;padding:0 14px}'+
      '}'+
      '';
    document.head.appendChild(st);
  }

  /* ── 초기화 ── */
  function _init() {
    if (_alreadyExists()) return;
    _injectCSS();
    var container = _findHeaderContainer();
    if (container) {
      _mountInHeader(container);
    } else {
      /* DOM 이 아직 로드 중일 수 있으니 한 번 더 시도 */
      setTimeout(function(){
        var c2 = _findHeaderContainer();
        if (c2) _mountInHeader(c2);
        else _mountFloating();
      }, 50);
    }
    try { console.log('[api-settings] button ready'); } catch(_) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _init);
  else _init();
})();
