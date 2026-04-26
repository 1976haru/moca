/* ================================================
   modules/studio/s3-image-safearea.js
   자막 안전영역 (캡션 가림 영역) overlay + 설정
   * 모드별 default — 숏츠: top 12% / bottom 22%
                     롱폼: top 5%  / bottom 16%, side 5%
   * STUDIO.project.s3.safeArea = { show, topPercent, bottomPercent, sidePercent }
   * s4.captionSafeArea 가 있으면 그 값을 우선 (편집 단계 연동)
   ================================================ */
(function(){
  'use strict';

  function _defaultsForMode(mode) {
    if (mode === 'longform' || mode === 'thumbnail') {
      return { show:true, topPercent:5,  bottomPercent:16, sidePercent:5 };
    }
    if (mode === 'cardnews' || mode === 'cardnews45') {
      return { show:true, topPercent:8,  bottomPercent:8,  sidePercent:8 };
    }
    /* shorts default */
    return   { show:true, topPercent:12, bottomPercent:22, sidePercent:0 };
  }

  function getSafeArea(proj) {
    proj = proj || (window.STUDIO && window.STUDIO.project) || {};
    var s3 = proj.s3 || {};
    var s4 = proj.s4 || {};
    /* 우선순위: s3.safeArea > s4.captionSafeArea > 모드 default */
    if (s3.safeArea) return Object.assign(_defaultsForMode(s3.aspectMode), s3.safeArea);
    if (s4.captionSafeArea) return Object.assign(_defaultsForMode(s3.aspectMode), s4.captionSafeArea);
    return _defaultsForMode(s3.aspectMode);
  }
  window.s3GetSafeArea = getSafeArea;

  function setSafeArea(partial) {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    proj.s3 = proj.s3 || {};
    var cur = getSafeArea(proj);
    proj.s3.safeArea = Object.assign({}, cur, partial || {});
    if (typeof window.studioSave === 'function') window.studioSave();
  }
  window.s3SetSafeArea = setSafeArea;

  /* ── overlay HTML ── */
  function overlayHtml() {
    var sa = getSafeArea();
    if (!sa.show) return '';
    var top = Math.max(0, Math.min(40, +sa.topPercent || 0));
    var bot = Math.max(0, Math.min(40, +sa.bottomPercent || 0));
    var side= Math.max(0, Math.min(20, +sa.sidePercent || 0));
    var bands = '';
    if (top  > 0) bands += '<div class="s3-safe-band s3-safe-top" style="height:'+top+'%"></div>';
    if (bot  > 0) bands += '<div class="s3-safe-band s3-safe-bot" style="height:'+bot+'%"></div>';
    if (side > 0) bands += '<div class="s3-safe-band s3-safe-l"   style="width:' +side+'%"></div>' +
                           '<div class="s3-safe-band s3-safe-r"   style="width:' +side+'%"></div>';
    return '<div class="s3-safe-overlay" aria-hidden="true">' + bands +
      '<div class="s3-safe-label s3-safe-label-top" style="top:'+top+'%">자막 영역</div>' +
      '<div class="s3-safe-label s3-safe-label-bot" style="bottom:'+bot+'%">자막 영역</div>' +
      '</div>';
  }
  window.s3SafeAreaOverlayHtml = overlayHtml;

  /* ── 설정 UI ── */
  function settingsHtml() {
    var sa = getSafeArea();
    return '<div class="s3-safe-settings">' +
      '<label class="s3-safe-toggle">' +
        '<input type="checkbox" '+(sa.show?'checked':'')+' '+
          'onchange="window.s3SetSafeAreaAndRefresh({show:this.checked})"> '+
        '<span>자막 안전영역 표시</span>' +
      '</label>' +
      '<div class="s3-safe-row">' +
        '<label>상단 %</label>' +
        '<input type="range" min="0" max="35" step="1" value="'+sa.topPercent+'" '+
          'oninput="window.s3SetSafeAreaLive({topPercent:+this.value})">' +
        '<span class="s3-safe-val">'+sa.topPercent+'%</span>' +
      '</div>' +
      '<div class="s3-safe-row">' +
        '<label>하단 %</label>' +
        '<input type="range" min="0" max="35" step="1" value="'+sa.bottomPercent+'" '+
          'oninput="window.s3SetSafeAreaLive({bottomPercent:+this.value})">' +
        '<span class="s3-safe-val">'+sa.bottomPercent+'%</span>' +
      '</div>' +
      ((sa.sidePercent || 0) > 0 ?
        '<div class="s3-safe-row">' +
          '<label>좌우 %</label>' +
          '<input type="range" min="0" max="15" step="1" value="'+sa.sidePercent+'" '+
            'oninput="window.s3SetSafeAreaLive({sidePercent:+this.value})">' +
          '<span class="s3-safe-val">'+sa.sidePercent+'%</span>' +
        '</div>' : '') +
    '</div>';
  }
  window.s3SafeAreaSettingsHtml = settingsHtml;

  /* live update — overlay 만 즉시 갱신 (rerender 없이) */
  window.s3SetSafeAreaLive = function(partial) {
    setSafeArea(partial);
    var sa = getSafeArea();
    var ov = document.querySelector('.s3-detail-preview-frame .s3-safe-overlay');
    if (ov) {
      var top = sa.topPercent, bot = sa.bottomPercent;
      var t  = ov.querySelector('.s3-safe-top');    if (t)  t.style.height  = top + '%';
      var b  = ov.querySelector('.s3-safe-bot');    if (b)  b.style.height  = bot + '%';
      var lt = ov.querySelector('.s3-safe-label-top'); if (lt) lt.style.top    = top + '%';
      var lb = ov.querySelector('.s3-safe-label-bot'); if (lb) lb.style.bottom = bot + '%';
    }
  };
  window.s3SetSafeAreaAndRefresh = function(partial) {
    setSafeArea(partial);
    if (typeof window.s3RefreshDetail === 'function') {
      var idx = (window._s3OpenSceneIdx != null) ? window._s3OpenSceneIdx : null;
      if (idx != null) window.s3RefreshDetail(idx);
    } else if (typeof window.renderStudio === 'function') {
      window.renderStudio();
    }
  };

  /* ── CSS ── */
  function _injectCSS() {
    if (document.getElementById('s3-safe-style')) return;
    var st = document.createElement('style');
    st.id = 's3-safe-style';
    st.textContent =
      '.s3-safe-overlay{position:absolute;inset:0;pointer-events:none}' +
      '.s3-safe-band{position:absolute;background:rgba(255,107,160,.18);border:1px dashed rgba(255,107,160,.55);box-sizing:border-box}' +
      '.s3-safe-top{top:0;left:0;right:0}' +
      '.s3-safe-bot{bottom:0;left:0;right:0}' +
      '.s3-safe-l  {top:0;bottom:0;left:0}' +
      '.s3-safe-r  {top:0;bottom:0;right:0}' +
      '.s3-safe-label{position:absolute;left:50%;transform:translate(-50%,-100%);background:rgba(255,107,160,.92);color:#fff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:0 0 8px 8px}' +
      '.s3-safe-label-bot{transform:translate(-50%,100%);border-radius:8px 8px 0 0}' +
      '.s3-safe-settings{display:flex;flex-direction:column;gap:6px;background:#fffafd;border:1px solid #f4d6e6;border-radius:10px;padding:10px 12px}' +
      '.s3-safe-toggle{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800;color:#5b1a4a;cursor:pointer}' +
      '.s3-safe-row{display:grid;grid-template-columns:60px 1fr 50px;gap:8px;align-items:center;font-size:11.5px;color:#7b3a5a}' +
      '.s3-safe-row input[type=range]{accent-color:#ef6fab}' +
      '.s3-safe-val{text-align:right;font-weight:700;color:#ef6fab}' +
      '';
    document.head.appendChild(st);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _injectCSS);
  else _injectCSS();
})();
