/* ================================================
   modules/studio/s3-image-board-compact.js
   숏츠 스튜디오 — 보드 카드 compact CSS override (2/2)
   * 한 화면에 5~6개 씬 카드가 보이도록 grid columns 증가
   * 카드 자체 작게 (1/5 수준)
   * 기존 보드 로직은 그대로 — CSS 만 override
   ================================================ */
(function(){
  'use strict';

  function _injectCSS() {
    if (document.getElementById('s3-board-compact-style')) return;
    var st = document.createElement('style');
    st.id = 's3-board-compact-style';
    /* 기존 .s3b-grid (4col 1920px / 3col 1366px / 2col 900px / 1col 520px) 를
       6col 1920px / 5col 1366px / 4col 900px / 3col 520px / 2col 380px 로 압축 */
    st.textContent =
      '.s3b-grid{grid-template-columns:repeat(6,1fr) !important;gap:8px !important}'+
      '@media(max-width:1366px){.s3b-grid{grid-template-columns:repeat(5,1fr) !important}}'+
      '@media(max-width:1100px){.s3b-grid{grid-template-columns:repeat(4,1fr) !important}}'+
      '@media(max-width:900px){.s3b-grid{grid-template-columns:repeat(3,1fr) !important}}'+
      '@media(max-width:520px){.s3b-grid{grid-template-columns:repeat(2,1fr) !important}}'+
      /* 카드 메타 영역 작게 */
      '.s3b-meta{padding:6px 8px !important}'+
      '.s3b-meta-row{margin-bottom:2px !important;font-size:10px !important;gap:4px !important}'+
      '.s3b-no{font-size:11px !important}'+
      '.s3b-role{padding:1px 5px !important;font-size:9.5px !important}'+
      '.s3b-time{font-size:9.5px !important}'+
      '.s3b-status{padding:1px 6px !important;font-size:9.5px !important}'+
      '.s3b-status-row{margin-bottom:4px !important}'+
      /* 액션 버튼 더 작게 */
      '.s3b-actions{gap:3px !important}'+
      '.s3b-act{min-width:24px !important;padding:3px 4px !important;font-size:11px !important;border-radius:6px !important}'+
      /* 비율 / 점수 배지 */
      '.s3b-rb{width:18px !important;height:18px !important;font-size:9px !important;top:4px !important;right:4px !important}'+
      '.s3b-score{padding:1px 5px !important;font-size:9.5px !important;top:4px !important;left:4px !important}'+
      /* 카드 hover 효과 약화 */
      '.s3b-card:hover{transform:translateY(-1px) !important;box-shadow:0 3px 10px rgba(145,129,255,.14) !important}'+
      /* 카드 라운드 약간 줄이기 */
      '.s3b-card{border-radius:10px !important;border-width:1px !important}'+
      /* 인포 바 더 컴팩트 */
      '.s3b-info-bar{padding:5px 10px !important;font-size:10.5px !important;margin-bottom:6px !important}'+
      /* 툴바 자체도 좀 더 압축 */
      '.s3b-toolbar{padding:8px 12px !important;margin-bottom:8px !important;gap:10px !important}'+
      '.s3b-tb-label{font-size:10.5px !important;margin-bottom:3px !important}'+
      '.s3b-mode-btn,.s3b-filter-btn{padding:4px 9px !important;font-size:10.5px !important}'+
      '.s3b-bulk-btn{padding:5px 10px !important;font-size:10.5px !important}'+
      '.s3b-tb-info{font-size:10px !important}'+
      '';
    document.head.appendChild(st);
    try { console.log('[s3-board-compact] CSS override applied — 5~6col grid'); } catch(_) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _injectCSS);
  else _injectCSS();
})();
