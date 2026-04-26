/* ================================================
   shared/api-settings-button.js
   ⚙️ 통합 API 설정 — 글로벌 floating 진입 버튼
   * 모든 화면 (대시보드 / step 1~5) 우상단 fixed
   * 현재 단계에 따라 적절한 group 자동 전달
   ================================================ */
(function(){
  'use strict';

  var BTN_ID = 'moca-api-fab';

  /* ── 현재 단계/맥락 → group 매핑 ── */
  function _detectGroup() {
    /* URL 의 ?step=N 또는 STUDIO.project.currentStep 등 활용 */
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
    /* fallback — 모듈 미로드 */
    alert('통합 API 설정 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
  };

  /* ── floating 버튼 생성 ── */
  function _ensureButton() {
    if (document.getElementById(BTN_ID)) return;
    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.title = '통합 API 설정 (모든 단계 키 입력)';
    btn.innerHTML = '<span class="moca-fab-ico">⚙️</span><span class="moca-fab-label">통합 API 설정</span>';
    btn.onclick = function(){ window.mocaOpenApiSettings(); };
    document.body.appendChild(btn);
  }

  function _injectCSS() {
    if (document.getElementById('moca-api-fab-style')) return;
    var st = document.createElement('style');
    st.id = 'moca-api-fab-style';
    st.textContent =
      '#moca-api-fab{position:fixed;top:14px;right:14px;z-index:19000;'+
        'display:flex;align-items:center;gap:6px;'+
        'padding:8px 14px;border:none;border-radius:999px;cursor:pointer;'+
        'background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;'+
        'font-size:12.5px;font-weight:800;font-family:inherit;'+
        'box-shadow:0 4px 14px rgba(145,129,255,.35);transition:.14s}'+
      '#moca-api-fab:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(145,129,255,.5)}'+
      '#moca-api-fab .moca-fab-ico{font-size:14px;line-height:1}'+
      '@media(max-width:600px){#moca-api-fab .moca-fab-label{display:none}'+
        '#moca-api-fab{padding:10px 12px;border-radius:999px}}'+
      '';
    document.head.appendChild(st);
  }

  /* ── 페이지 로드 시 1회 + step 변경 감지 ── */
  function _init() {
    _injectCSS();
    _ensureButton();
    try { console.log('[api-settings] floating button ready'); } catch(_) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _init);
  else _init();
})();
