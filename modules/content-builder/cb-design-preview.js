/* ================================================
   modules/content-builder/cb-design-preview.js
   콘텐츠 빌더 2/3 — HTML/CSS 캔버스 미리보기 렌더러
   * layoutSpec 또는 example → 절대좌표 div 배치
   * 이미지 파일 없이 mock preview 자동 생성
   ================================================ */
(function(){
  'use strict';

  /* aspect-ratio CSS 문자열 */
  function _ratioCss(ratio) {
    var map = { '16:9':'16/9','9:16':'9/16','1:1':'1/1','4:5':'4/5','3:1':'3/1','3:4':'3/4','A4':'1/1.414' };
    return map[ratio] || '16/9';
  }
  window.cbRatioCss = _ratioCss;

  /* layoutSpec 의 blocks 를 절대좌표(%)로 렌더 */
  function renderDesignPreview(spec, opts) {
    opts = opts || {};
    spec = spec || {};
    var ratio = spec.aspectRatio || opts.ratio || '16:9';
    var blocks = spec.blocks || [];
    var color  = (window.CB_COLOR_TOKENS||{})[spec.colorPreset || 'bold'] || { bg:'#fff', fg:'#222', accent:'#ef6fab' };
    var typo   = (window.CB_TYPO_TOKENS ||{})[spec.typographyPreset || 'impact'] || { hSize:42, sSize:18, family:'NotoSansKR', weight:900, hLine:1.2 };
    var safeArea = spec.safeArea || null;

    /* canvas 비율과 글꼴 size 자동 스케일 — 작은 카드용 0.4, 큰 미리보기용 1.0 */
    var scale = (typeof opts.scale === 'number') ? opts.scale : 1.0;

    var blocksHtml = blocks.map(function(b){
      return _renderBlock(b, color, typo, scale);
    }).join('');

    var safeHtml = '';
    if (safeArea && safeArea.show !== false) {
      var top = +safeArea.topPercent    || 0;
      var bot = +safeArea.bottomPercent || 0;
      safeHtml =
        '<div class="cbpv-safe" style="top:0;height:'+top+'%"></div>'+
        '<div class="cbpv-safe" style="bottom:0;height:'+bot+'%"></div>';
    }

    return '<div class="cbpv-frame" style="aspect-ratio:'+_ratioCss(ratio)+';background:'+(color.bg||'#fff')+'">' +
      blocksHtml + safeHtml +
    '</div>';
  }
  window.cbRenderDesignPreview = renderDesignPreview;

  /* 단일 block 렌더 */
  function _renderBlock(b, color, typo, scale) {
    if (!b || !b.type) return '';
    var x = (b.x != null ? b.x : 0);
    var y = (b.y != null ? b.y : 0);
    var w = (b.w != null ? b.w : 100);
    var h = (b.h != null ? b.h : 'auto');
    var pos = 'left:'+x+'%;top:'+y+'%;width:'+w+'%;' + (h === 'auto' ? '' : 'height:'+h+'%;');
    var text = _esc(b.text || '');
    var bg, fg;
    switch (b.type) {
      case 'background':
        var grad = (b.style && b.style.bg) || ('linear-gradient(135deg,'+color.bg+','+color.accent+')');
        return '<div class="cbpv-block cbpv-bg" style="position:absolute;inset:0;background:'+_escAttr(grad)+'"></div>';
      case 'imageSlot':
        return '<div class="cbpv-block cbpv-image" style="position:absolute;'+pos+'background:'+_escAttr((b.style&&b.style.bg)||'rgba(255,255,255,.18)')+';border-radius:'+(8*scale)+'px;border:1.5px dashed rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);font-size:'+(11*scale)+'px;font-weight:700">🖼 IMAGE</div>';
      case 'headline':
        return '<div class="cbpv-block cbpv-h" style="position:absolute;'+pos+'color:'+(b.color||color.fg)+';font-size:'+Math.round(typo.hSize*scale)+'px;font-weight:'+(typo.weight||900)+';line-height:'+typo.hLine+';font-family:'+typo.family+';text-shadow:0 1px 4px rgba(0,0,0,.25);text-align:'+(b.align||'left')+'">'+text+'</div>';
      case 'subheadline':
        return '<div class="cbpv-block cbpv-s" style="position:absolute;'+pos+'color:'+(b.color||color.fg)+';font-size:'+Math.round(typo.sSize*scale)+'px;font-weight:600;opacity:.9;line-height:1.4;font-family:'+typo.family+';text-align:'+(b.align||'left')+'">'+text+'</div>';
      case 'support':
        return '<div class="cbpv-block cbpv-sup" style="position:absolute;'+pos+'color:'+(b.color||color.fg)+';font-size:'+Math.round(typo.sSize*scale*0.85)+'px;font-weight:500;opacity:.75;line-height:1.5;font-family:'+typo.family+';text-align:'+(b.align||'left')+'">'+text+'</div>';
      case 'badge':
        bg = b.bg || color.accent; fg = b.color || '#fff';
        return '<div class="cbpv-block cbpv-badge" style="position:absolute;'+pos+'background:'+_escAttr(bg)+';color:'+fg+';padding:'+(4*scale)+'px '+(10*scale)+'px;border-radius:999px;font-size:'+Math.round(typo.sSize*scale*0.7)+'px;font-weight:900;text-align:center;display:inline-flex;align-items:center;justify-content:center;height:auto">'+text+'</div>';
      case 'cta':
        bg = b.bg || color.accent; fg = b.color || '#fff';
        return '<div class="cbpv-block cbpv-cta" style="position:absolute;'+pos+'background:'+_escAttr(bg)+';color:'+fg+';padding:'+(6*scale)+'px '+(14*scale)+'px;border-radius:'+(8*scale)+'px;font-size:'+Math.round(typo.sSize*scale*0.85)+'px;font-weight:900;text-align:center;display:flex;align-items:center;justify-content:center">'+text+'</div>';
      case 'logo':
        return '<div class="cbpv-block cbpv-logo" style="position:absolute;'+pos+'border:1.5px dashed rgba(255,255,255,.5);border-radius:'+(6*scale)+'px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);font-size:'+(10*scale)+'px;font-weight:700">LOGO</div>';
      case 'footer':
        return '<div class="cbpv-block cbpv-footer" style="position:absolute;'+pos+'color:'+(b.color||color.fg)+';font-size:'+Math.round(typo.sSize*scale*0.7)+'px;opacity:.6;text-align:'+(b.align||'left')+'">'+text+'</div>';
      case 'warning':
        return '<div class="cbpv-block cbpv-warn" style="position:absolute;'+pos+'background:rgba(192,57,43,.92);color:#fff;padding:'+(4*scale)+'px '+(10*scale)+'px;border-radius:8px;font-size:'+Math.round(typo.sSize*scale*0.75)+'px;font-weight:900;text-align:center">⚠️ '+text+'</div>';
      case 'eyebrow':
        return '<div class="cbpv-block cbpv-eyebrow" style="position:absolute;'+pos+'color:'+(b.color||color.accent)+';font-size:'+Math.round(typo.sSize*scale*0.75)+'px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase">'+text+'</div>';
      default:
        return '';
    }
  }

  /* 아주 작은 thumbnail 미리보기 (예시 카드용) */
  function renderThumbPreview(example, opts) {
    opts = opts || {};
    var ratio = (opts.ratio || '16:9');
    var color = (window.CB_COLOR_TOKENS||{})[example.colorPreset || 'bold'] || { bg:'#1a1a2e', fg:'#fff', accent:'#ef6fab' };
    var grad  = 'linear-gradient(135deg,'+color.bg+','+color.accent+')';
    var head  = _esc(example.headline || example.name || '');
    var sub   = _esc(example.sub || '');
    return '<div class="cbpv-thumb" style="aspect-ratio:'+_ratioCss(ratio)+';background:'+grad+'">' +
      '<div class="cbpv-thumb-head" style="color:'+color.fg+'">'+head+'</div>' +
      (sub ? '<div class="cbpv-thumb-sub" style="color:'+color.fg+'">'+sub+'</div>' : '') +
    '</div>';
  }
  window.cbRenderExampleThumb = renderThumbPreview;

  /* ── CSS ── */
  function _injectCSS() {
    if (document.getElementById('cb-design-preview-style')) return;
    var st = document.createElement('style');
    st.id = 'cb-design-preview-style';
    st.textContent =
      '.cbpv-frame{position:relative;width:100%;border-radius:14px;overflow:hidden;border:1px solid rgba(0,0,0,.08);box-shadow:0 2px 8px rgba(0,0,0,.06)}'+
      '.cbpv-block{box-sizing:border-box;overflow:hidden}'+
      '.cbpv-safe{position:absolute;left:0;right:0;background:rgba(255,107,160,.14);border:1px dashed rgba(255,107,160,.45);pointer-events:none}'+
      '.cbpv-thumb{position:relative;width:100%;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px;text-align:center;text-shadow:0 1px 4px rgba(0,0,0,.4)}'+
      '.cbpv-thumb-head{font-size:14px;font-weight:900;line-height:1.2}'+
      '.cbpv-thumb-sub{font-size:11px;font-weight:600;margin-top:4px;opacity:.92}';
    document.head.appendChild(st);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _injectCSS);
  else _injectCSS();

  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function _escAttr(s){ return String(s == null ? '' : s).replace(/"/g,'&quot;'); }
})();
