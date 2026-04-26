/* ================================================
   modules/studio/s3-preview.js
   숏츠 스튜디오 2단계 — 라이트박스 / 원본보기 / 미리보기 CSS
   * s3-image.js 에서 분리 (1000줄 한도 유지)
   ================================================ */
(function(){
  'use strict';

  /* 라이트박스 — 확대 보기 */
  window.s3OpenImagePreview = function(src, title){
    var ex = document.getElementById('s3-lightbox');
    if (ex) ex.remove();
    var box = document.createElement('div');
    box.id = 's3-lightbox';
    box.className = 's3-lightbox';
    box.innerHTML =
      '<button class="s3-lightbox-close" aria-label="닫기">✕</button>' +
      (title ? '<div class="s3-lightbox-title">'+String(title).replace(/[<>]/g,'')+'</div>' : '') +
      '<img src="'+String(src).replace(/"/g,'&quot;')+'" alt="원본 미리보기">';
    box.addEventListener('click', function(e){
      if (e.target === box || e.target.classList.contains('s3-lightbox-close')) {
        _s3CloseLightbox();
      }
    });
    document.body.appendChild(box);
    document.addEventListener('keydown', _s3LightboxEsc);
  };
  function _s3CloseLightbox(){
    var ex = document.getElementById('s3-lightbox');
    if (ex) ex.remove();
    document.removeEventListener('keydown', _s3LightboxEsc);
  }
  function _s3LightboxEsc(e){
    if (e.key === 'Escape') _s3CloseLightbox();
  }

  /* 원본 보기 — 새 탭 */
  window.s3OpenOriginal = function(src){
    if (!src) return;
    /* data: URL 도 새 탭에서 열기 */
    try {
      var w = window.open('', '_blank');
      if (w) {
        w.document.write('<title>원본 이미지</title>'+
          '<body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh">'+
          '<img src="'+String(src).replace(/"/g,'&quot;')+'" style="max-width:100%;max-height:100vh">'+
          '</body>');
        w.document.close();
      } else {
        window.open(src, '_blank');
      }
    } catch(_) { window.open(src, '_blank'); }
  };

  /* 미리보기 / 라이트박스 / 칩 / pill CSS */
  window._s3InjectPreviewCSS = function(){
    if (document.getElementById('s3-preview-style')) return;
    var st = document.createElement('style');
    st.id = 's3-preview-style';
    st.textContent =
      '.s3-scene-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:10px}' +
      '.s3-scene-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}' +
      '.s3-scene-title{font-size:13px;font-weight:800}' +
      '.s3-scene-time{font-size:11px;color:var(--sub)}' +
      '.s3-prompt-ta{width:100%;border:1.5px solid var(--line);border-radius:8px;padding:8px;font-size:11px;resize:vertical;min-height:48px;font-family:inherit;box-sizing:border-box}' +
      '.s3-action-row{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}' +
      '.s3-act-btn{font-size:12px}' +
      '.s3-upload-lbl{cursor:pointer;display:inline-flex}' +
      '.s3-upload-lbl .s3-act-btn{padding:6px 12px}' +
      '.s3-scene-preview-wrap{display:grid;grid-template-columns:minmax(220px,320px) 1fr;gap:16px;align-items:start;margin-top:12px}' +
      '.s3-portrait-preview{width:min(320px,100%);aspect-ratio:9/16;border-radius:18px;overflow:hidden;background:#f5f5f7;border:1px solid rgba(0,0,0,.08);display:flex;align-items:center;justify-content:center}' +
      '.s3-portrait-preview img{width:100%;height:100%;object-fit:contain;display:block;background:#eee}' +
      '.s3-portrait-preview.s3-preview-err{background:#fff1f1}' +
      '.s3-preview-empty{width:min(320px,100%);aspect-ratio:9/16;border-radius:18px;background:#f5f5f7;display:flex;align-items:center;justify-content:center;color:#999;border:1px dashed #ddd}' +
      '.s3-preview-side{display:flex;flex-direction:column;gap:10px}' +
      '.s3-status-chip{display:inline-block;align-self:flex-start;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800}' +
      '.s3-chip-empty{background:#eee;color:#777}' +
      '.s3-chip-done{background:#eef5ff;color:#2b66c4}' +
      '.s3-chip-adopt{background:#effbf7;color:#1a7a5a}' +
      '.s3-chip-skip{background:#fff1f1;color:#c0392b}' +
      '.s3-pill-row{display:flex;gap:6px;flex-wrap:wrap}' +
      '.s3-pill{flex:1 1 auto;min-width:80px;border:1.5px solid var(--line);background:#fff;color:#555;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:.12s;white-space:nowrap}' +
      '.s3-pill:hover{border-color:#9181ff;color:#9181ff}' +
      '.s3-pill-adopt.on{background:#27ae60;border-color:#27ae60;color:#fff}' +
      '.s3-pill-zoom:hover{background:#9181ff;color:#fff;border-color:#9181ff}' +
      '.s3-pill-orig:hover{background:#ef6fab;color:#fff;border-color:#ef6fab}' +
      '.s3-cand-strip{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}' +
      '.s3-cand-thumb{width:54px;height:96px;border-radius:8px;overflow:hidden;border:2px solid var(--line);background:#fff;padding:0;cursor:pointer}' +
      '.s3-cand-thumb.on{border-color:#ef6fab}' +
      '.s3-cand-thumb img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.s3-ratio-hint{margin-top:6px;font-size:11px;line-height:1.4;padding:4px 8px;border-radius:6px;display:none}' +
      '.s3-ratio-hint.s3-ratio-ok{display:block;background:#effbf7;color:#1a7a5a}' +
      '.s3-ratio-hint.s3-ratio-warn{display:block;background:#fff7e6;color:#a05a00}' +
      '.s3-ratio-hint.s3-ratio-info{display:block;background:#f4f4f7;color:#555}' +
      '.s3-lightbox{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:10001;display:flex;align-items:center;justify-content:center;padding:24px;flex-direction:column;gap:12px}' +
      '.s3-lightbox img{max-width:92vw;max-height:84vh;object-fit:contain;border-radius:16px;background:#111;box-shadow:0 8px 40px rgba(0,0,0,.5)}' +
      '.s3-lightbox-close{position:absolute;top:16px;right:16px;width:40px;height:40px;border-radius:999px;border:none;background:rgba(255,255,255,.9);font-size:18px;font-weight:900;cursor:pointer;z-index:1}' +
      '.s3-lightbox-title{color:#fff;font-size:14px;font-weight:800;background:rgba(0,0,0,.4);padding:6px 14px;border-radius:999px}' +
      '@media(max-width:760px){' +
        '.s3-scene-preview-wrap{grid-template-columns:1fr}' +
        '.s3-portrait-preview,.s3-preview-empty{width:min(280px,100%);margin:0 auto}' +
        '.s3-pill{flex:1 1 calc(50% - 4px);min-width:0}' +
      '}';
    document.head.appendChild(st);
  };
})();
