/* ================================================
   modules/studio/s3-image-adjust.js
   이미지 transform (fit/scale/offset/cropPreset) + auto-fit + UI
   * 비파괴 — 원본 url 은 candidate.originalUrl 그대로,
     transform 값만 candidate.transform 에 저장
   ================================================ */
(function(){
  'use strict';

  const DEFAULT_TF = { fit:'contain', scale:1, offsetX:0, offsetY:0, cropPreset:'center' };

  function _getCand(sceneIdx) {
    if (typeof window.s3GetSelectedCandidate !== 'function') return null;
    return window.s3GetSelectedCandidate(sceneIdx);
  }

  function getTransform(sceneIdx) {
    var c = _getCand(sceneIdx);
    if (!c) return Object.assign({}, DEFAULT_TF);
    c.transform = c.transform || Object.assign({}, DEFAULT_TF);
    return c.transform;
  }
  window.s3GetTransform = getTransform;

  function setTransform(sceneIdx, partial) {
    var c = _getCand(sceneIdx); if (!c) return;
    c.transform = Object.assign({}, DEFAULT_TF, c.transform || {}, partial || {});
    if (typeof window.studioSave === 'function') window.studioSave();
  }
  window.s3SetTransform = setTransform;

  /* ── 자동 맞춤 프리셋 ── */
  const AUTO_PRESETS = {
    center:        { fit:'contain', scale:1.0,  offsetX:0,   offsetY:0,    cropPreset:'center'      },
    full:          { fit:'contain', scale:1.0,  offsetX:0,   offsetY:0,    cropPreset:'center'      },
    cover:         { fit:'cover',   scale:1.1,  offsetX:0,   offsetY:0,    cropPreset:'center'      },
    'top-avoid':   { fit:'cover',   scale:1.08, offsetX:0,   offsetY: 8,   cropPreset:'top-avoid'   },
    'bottom-avoid':{ fit:'cover',   scale:1.10, offsetX:0,   offsetY:-10,  cropPreset:'bottom-avoid'},
    'shorts-safe': { fit:'cover',   scale:1.05, offsetX:0,   offsetY:-8,   cropPreset:'shorts-safe' },
  };
  window.S3_AUTO_FIT_PRESETS = AUTO_PRESETS;

  function applyAutoFit(sceneIdx, presetId) {
    var p = AUTO_PRESETS[presetId];
    if (!p) return false;
    setTransform(sceneIdx, p);
    return true;
  }
  window.s3ApplyAutoFit = applyAutoFit;

  /* ── transform → CSS style 문자열 ──
     이미지를 9:16 등 frame 안에 비파괴로 표시.
     fit: contain(원본 비율 유지) / cover(꽉) / safe-fit(약간 contain + offset) */
  function styleForTransform(tf) {
    tf = Object.assign({}, DEFAULT_TF, tf || {});
    var fit = (tf.fit === 'cover' || tf.fit === 'safe-fit') ? 'cover' : 'contain';
    var sx = Math.max(0.5, Math.min(2.5, +tf.scale || 1));
    var ox = Math.max(-50, Math.min(50, +tf.offsetX || 0));
    var oy = Math.max(-50, Math.min(50, +tf.offsetY || 0));
    return 'object-fit:' + fit + ';' +
           'transform:translate(' + ox + '%, ' + oy + '%) scale(' + sx + ');' +
           'transform-origin:center center;' +
           'transition:transform .12s';
  }
  window.s3StyleForTransform = styleForTransform;

  /* ── 컨트롤 UI HTML ── */
  function renderAdjustControlsHtml(sceneIdx) {
    var tf = getTransform(sceneIdx);
    var ctx = 'window.s3AdjustChange(' + sceneIdx + ')';
    return '<div class="s3-adj-wrap">' +
      '<div class="s3-adj-row">' +
        '<button class="s3-adj-btn '+(tf.fit==='contain'?'on':'')+'" onclick="window.s3SetTransformPart('+sceneIdx+',{fit:\'contain\'})">전체 보기</button>' +
        '<button class="s3-adj-btn '+(tf.fit==='cover'?'on':'')+'"   onclick="window.s3SetTransformPart('+sceneIdx+',{fit:\'cover\'})">꽉 채우기</button>' +
        '<button class="s3-adj-btn '+(tf.fit==='safe-fit'?'on':'')+'" onclick="window.s3SetTransformPart('+sceneIdx+',{fit:\'safe-fit\'})">자막 안전</button>' +
      '</div>' +
      '<div class="s3-adj-slider-row">' +
        '<label>확대/축소</label>' +
        '<input type="range" min="0.6" max="2" step="0.05" value="'+tf.scale+'" '+
          'oninput="window.s3SetTransformPart('+sceneIdx+',{scale:+this.value})">' +
        '<span class="s3-adj-val">×'+(+tf.scale).toFixed(2)+'</span>' +
      '</div>' +
      '<div class="s3-adj-slider-row">' +
        '<label>좌우 이동</label>' +
        '<input type="range" min="-30" max="30" step="1" value="'+tf.offsetX+'" '+
          'oninput="window.s3SetTransformPart('+sceneIdx+',{offsetX:+this.value})">' +
        '<span class="s3-adj-val">'+tf.offsetX+'%</span>' +
      '</div>' +
      '<div class="s3-adj-slider-row">' +
        '<label>상하 이동</label>' +
        '<input type="range" min="-30" max="30" step="1" value="'+tf.offsetY+'" '+
          'oninput="window.s3SetTransformPart('+sceneIdx+',{offsetY:+this.value})">' +
        '<span class="s3-adj-val">'+tf.offsetY+'%</span>' +
      '</div>' +
      '<div class="s3-adj-presets">' +
        '<div class="s3-adj-presets-title">🪄 자동 맞춤</div>' +
        '<div class="s3-adj-row s3-adj-row-wrap">' +
          '<button class="s3-adj-pill" onclick="window.s3ApplyAutoFitAndRender('+sceneIdx+',\'center\')">중앙 맞춤</button>' +
          '<button class="s3-adj-pill" onclick="window.s3ApplyAutoFitAndRender('+sceneIdx+',\'top-avoid\')">상단 피하기</button>' +
          '<button class="s3-adj-pill" onclick="window.s3ApplyAutoFitAndRender('+sceneIdx+',\'bottom-avoid\')">하단 자막 피하기</button>' +
          '<button class="s3-adj-pill" onclick="window.s3ApplyAutoFitAndRender('+sceneIdx+',\'full\')">전체 보기</button>' +
          '<button class="s3-adj-pill" onclick="window.s3ApplyAutoFitAndRender('+sceneIdx+',\'cover\')">꽉 채우기</button>' +
          '<button class="s3-adj-pill" onclick="window.s3ApplyAutoFitAndRender('+sceneIdx+',\'shorts-safe\')">숏츠 안전영역</button>' +
        '</div>' +
        '<div class="s3-adj-row">' +
          '<button class="s3-adj-pill s3-adj-reset" onclick="window.s3ApplyAutoFitAndRender('+sceneIdx+',\'center\')">↺ 초기화</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }
  window.s3RenderAdjustControlsHtml = renderAdjustControlsHtml;

  /* ── slider/preset 라이브 핸들러 ── */
  window.s3SetTransformPart = function(sceneIdx, partial){
    setTransform(sceneIdx, partial);
    /* 라이브 미리보기 — 전체 rerender 없이 img 만 업데이트 */
    var img = document.querySelector('.s3-detail-preview-img[data-scene="'+sceneIdx+'"]');
    if (img) img.setAttribute('style', styleForTransform(getTransform(sceneIdx)));
  };
  window.s3ApplyAutoFitAndRender = function(sceneIdx, presetId){
    applyAutoFit(sceneIdx, presetId);
    if (typeof window.s3RefreshDetail === 'function') window.s3RefreshDetail(sceneIdx);
    else if (typeof window.renderStudio === 'function') window.renderStudio();
  };

  /* ── CSS injection ── */
  function _injectCSS() {
    if (document.getElementById('s3-adjust-style')) return;
    var st = document.createElement('style');
    st.id = 's3-adjust-style';
    st.textContent =
      '.s3-adj-wrap{display:flex;flex-direction:column;gap:8px;background:#fafafe;border:1px solid #e9e4f3;border-radius:12px;padding:10px 12px}' +
      '.s3-adj-row{display:flex;gap:6px}' +
      '.s3-adj-row-wrap{flex-wrap:wrap}' +
      '.s3-adj-btn{flex:1;border:1.5px solid var(--line);background:#fff;color:#555;border-radius:8px;padding:6px 10px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit}' +
      '.s3-adj-btn.on{background:#9181ff;color:#fff;border-color:#9181ff}' +
      '.s3-adj-slider-row{display:grid;grid-template-columns:80px 1fr 50px;gap:8px;align-items:center;font-size:11.5px;color:#5a4a56}' +
      '.s3-adj-slider-row input[type=range]{accent-color:#9181ff}' +
      '.s3-adj-val{text-align:right;font-weight:700;color:#9181ff}' +
      '.s3-adj-presets{margin-top:4px;border-top:1px dashed #e0d8ee;padding-top:8px}' +
      '.s3-adj-presets-title{font-size:11px;font-weight:800;color:#5b1a4a;margin-bottom:6px}' +
      '.s3-adj-pill{padding:5px 10px;border:1px solid #d4cdec;background:#fff;color:#5a4a8a;border-radius:999px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit}' +
      '.s3-adj-pill:hover{background:#9181ff;color:#fff;border-color:#9181ff}' +
      '.s3-adj-pill.s3-adj-reset{background:#fff5fa;color:#c0397b;border-color:#f1c5dc}' +
      '';
    document.head.appendChild(st);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _injectCSS);
  else _injectCSS();
})();
