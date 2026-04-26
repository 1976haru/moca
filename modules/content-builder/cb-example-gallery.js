/* ================================================
   modules/content-builder/cb-example-gallery.js
   콘텐츠 빌더 2/3 — 예시 갤러리 탭
   * cbRenderTabExampleGallery
   * 카드: cbRenderExampleThumb mock + 태그/품질강점/qualityRules
   * "이 스타일로 시작하기" → preset 적용 + design-board 이동
   ================================================ */
(function(){
  'use strict';

  window.cbRenderTabExampleGallery = function(p) {
    p = p || (window.contentBuilderProject || {});
    p.purposeFlow = p.purposeFlow || {};
    var pid = p.purposeFlow.selectedPurpose || '';
    _injectCSS();

    if (!pid) {
      return '<div class="cbeg-wrap"><div class="cbeg-empty">' +
        '<div class="cbeg-empty-ico">🎨</div>' +
        '<div class="cbeg-empty-title">먼저 목적을 선택해주세요</div>' +
        '<div class="cbeg-empty-sub">"목적 선택" 탭에서 무엇을 만들지 고른 뒤 예시 갤러리가 표시됩니다.</div>' +
        '<button class="cbeg-btn-primary" onclick="cbGotoTab(\'purpose\')">→ 목적 선택으로 이동</button>' +
      '</div></div>';
    }

    var pPreset = (window.cbGetPurposePreset && window.cbGetPurposePreset(pid)) || null;
    var examples = (window.cbGetExamplesByPurpose && window.cbGetExamplesByPurpose(pid)) || [];
    var selectedId = p.purposeFlow.selectedExampleId || '';
    var ratio = (pPreset && pPreset.aspectRatio) || '16:9';

    var cardsHtml = examples.map(function(ex){
      var on = (selectedId === ex.id);
      var thumb = (window.cbRenderExampleThumb)
        ? window.cbRenderExampleThumb(ex, { ratio: ratio })
        : '<div class="cbeg-thumb-fallback">미리보기</div>';
      var tags = (ex.tags || []).map(function(t){ return '<span class="cbeg-tag">'+_esc(t)+'</span>'; }).join('');
      var strengths = (ex.strengths || []).map(function(s){ return '<span class="cbeg-strength">'+_esc(s)+'</span>'; }).join('');
      var rules = (ex.qualityRules || []).slice(0,4).map(function(r){
        var label = (window.CB_QUALITY_LABELS||{})[r] || r;
        return '<span class="cbeg-rule">'+_esc(label)+'</span>';
      }).join('');
      return '<div class="cbeg-card'+(on?' on':'')+'">' +
        '<div class="cbeg-thumb-wrap">' + thumb + '</div>' +
        '<div class="cbeg-meta">' +
          '<div class="cbeg-name">' + _esc(ex.name) + (on ? ' <span class="cbeg-on-chip">선택됨</span>' : '') + '</div>' +
          '<div class="cbeg-desc">' + _esc(ex.desc) + '</div>' +
          (tags ? '<div class="cbeg-row">' + tags + '</div>' : '') +
          (strengths ? '<div class="cbeg-row"><span class="cbeg-row-label">강점</span>' + strengths + '</div>' : '') +
          (rules ? '<div class="cbeg-row"><span class="cbeg-row-label">규칙</span>' + rules + '</div>' : '') +
        '</div>' +
        '<div class="cbeg-actions">' +
          '<button class="cbeg-btn-secondary" onclick="cbExamplePreviewLarge(\''+pid+'\',\''+ex.id+'\')">미리보기 확대</button>' +
          '<button class="cbeg-btn-primary"   onclick="cbApplyExampleStart(\''+pid+'\',\''+ex.id+'\')">'+ (on?'다시 적용':'이 스타일로 시작하기') +'</button>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="cbeg-wrap">' +
      '<div class="cbeg-hd">' +
        '<div>' +
          '<h3>🎨 예시 갤러리 — ' + (pPreset ? pPreset.icon + ' ' + _esc(pPreset.label) : pid) + '</h3>' +
          '<p>마음에 드는 스타일을 누르면 layoutPreset / 색감 / 타이포 / qualityRules 가 디자인 보드에 자동 적용됩니다.</p>' +
        '</div>' +
        '<button class="cbeg-btn-secondary" onclick="cbGotoTab(\'purpose\')">← 목적 변경</button>' +
      '</div>' +
      '<div class="cbeg-grid">' + cardsHtml + '</div>' +
      (selectedId ? '<div class="cbeg-selected-bar">선택된 예시: <b>' +
        _esc((window.cbGetExampleById && window.cbGetExampleById(pid, selectedId) || {name:selectedId}).name) +
        '</b><button class="cbeg-btn-tab" onclick="cbGotoTab(\'design-board\')">다음 → AI 디자인 보드</button></div>' : '') +
    '</div>';
  };

  /* ── 이 스타일로 시작하기 ── */
  window.cbApplyExampleStart = function(purposeId, exampleId) {
    var ex = (window.cbGetExampleById) ? window.cbGetExampleById(purposeId, exampleId) : null;
    if (!ex) { alert('예시를 찾을 수 없습니다.'); return; }
    var pPreset = (window.cbGetPurposePreset && window.cbGetPurposePreset(purposeId)) || {};
    var p = window.contentBuilderProject = window.contentBuilderProject || (window.cbNewProject ? window.cbNewProject() : {});
    p.purposeFlow = p.purposeFlow || {};
    p.purposeFlow.selectedPurpose      = purposeId;
    p.purposeFlow.selectedExampleId    = ex.id;
    p.purposeFlow.aspectRatio          = pPreset.aspectRatio || '16:9';
    p.purposeFlow.layoutPreset         = ex.layoutPreset;
    p.purposeFlow.layoutPresetGroup    = pPreset.layoutPresetGroup || '';
    p.purposeFlow.copyStructure        = pPreset.copyStructure || [];
    p.purposeFlow.ctaPreset            = pPreset.defaultCta || '';
    p.purposeFlow.colorPreset          = ex.colorPreset;
    p.purposeFlow.typographyPreset     = ex.typographyPreset;
    p.purposeFlow.safeArea             = (window.cbGetSafeAreaForRatio) ? window.cbGetSafeAreaForRatio(pPreset.aspectRatio||'16:9') : { show:true };
    p.purposeFlow.qualityRules         = ex.qualityRules || pPreset.qualityRules || [];
    p.purposeFlow.initialPreset = {
      aspectRatio: pPreset.aspectRatio || '16:9',
      layoutPreset: ex.layoutPreset,
      colorPreset: ex.colorPreset,
      typographyPreset: ex.typographyPreset,
      safeArea: p.purposeFlow.safeArea,
      qualityRules: p.purposeFlow.qualityRules,
      sourceExampleMeta: { purposeId: purposeId, exampleId: ex.id, name: ex.name },
    };
    p.qualityEngine = p.qualityEngine || {};
    p.qualityEngine.selectedExampleId = ex.id;
    p.qualityEngine.layoutPreset      = ex.layoutPreset;
    p.qualityEngine.qualityRule       = ex.qualityRules;
    /* designBoard 미러 */
    p.designBoard = Object.assign({}, p.designBoard || {}, {
      purposeId: purposeId,
      aspectRatio: pPreset.aspectRatio || '16:9',
      layoutPreset: ex.layoutPreset,
      colorPreset: ex.colorPreset,
      typographyPreset: ex.typographyPreset,
      qualityRules: ex.qualityRules || [],
      sourceExampleId: ex.id,
      sourceExampleName: ex.name,
    });
    /* localStorage 스냅샷 */
    try {
      localStorage.setItem('moca_content_builder_purpose_flow_v1', JSON.stringify(p.purposeFlow));
      localStorage.setItem('moca_content_builder_quality_engine_v1', JSON.stringify(p.qualityEngine));
    } catch(_) {}
    if (typeof window.cbSave === 'function') window.cbSave();
    if (typeof ucShowToast === 'function') ucShowToast('✅ "' + ex.name + '" 적용 — 시안 자동 생성 중', 'success');
    if (typeof window.cbGotoTab === 'function') window.cbGotoTab('design-board');
  };

  /* ── 미리보기 확대 모달 ── */
  window.cbExamplePreviewLarge = function(purposeId, exampleId) {
    var ex = window.cbGetExampleById && window.cbGetExampleById(purposeId, exampleId);
    if (!ex) return;
    var pPreset = (window.cbGetPurposePreset && window.cbGetPurposePreset(purposeId)) || {};
    var ratio = pPreset.aspectRatio || '16:9';
    var existing = document.getElementById('cbeg-preview-modal');
    if (existing) existing.remove();
    var modal = document.createElement('div');
    modal.id = 'cbeg-preview-modal';
    modal.className = 'cbeg-modal-back';
    modal.innerHTML =
      '<div class="cbeg-modal-card" onclick="event.stopPropagation()">' +
        '<button class="cbeg-modal-close" onclick="document.getElementById(\'cbeg-preview-modal\').remove()">✕</button>' +
        '<h3 class="cbeg-modal-title">' + _esc(ex.name) + '</h3>' +
        '<div class="cbeg-modal-preview">' + (window.cbRenderExampleThumb ? window.cbRenderExampleThumb(ex, { ratio: ratio }) : '') + '</div>' +
        '<div class="cbeg-modal-desc">' + _esc(ex.desc) + '</div>' +
        '<div class="cbeg-modal-actions">' +
          '<button class="cbeg-btn-secondary" onclick="document.getElementById(\'cbeg-preview-modal\').remove()">닫기</button>' +
          '<button class="cbeg-btn-primary" onclick="document.getElementById(\'cbeg-preview-modal\').remove();cbApplyExampleStart(\''+purposeId+'\',\''+ex.id+'\')">이 스타일로 시작하기</button>' +
        '</div>' +
      '</div>';
    modal.addEventListener('click', function(e){ if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  };

  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  function _injectCSS() {
    if (document.getElementById('cb-example-gallery-style')) return;
    var st = document.createElement('style');
    st.id = 'cb-example-gallery-style';
    st.textContent =
      '.cbeg-wrap{padding:6px 4px}'+
      '.cbeg-hd{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap}'+
      '.cbeg-hd h3{margin:0 0 4px;font-size:17px;font-weight:900;color:#2b2430}'+
      '.cbeg-hd p{margin:0;font-size:12.5px;color:#7b6080;line-height:1.6}'+
      '.cbeg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}'+
      '.cbeg-card{background:#fff;border:1.5px solid #ece6f5;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;transition:.14s}'+
      '.cbeg-card:hover{transform:translateY(-2px);border-color:#9181ff;box-shadow:0 6px 18px rgba(145,129,255,.18)}'+
      '.cbeg-card.on{border-color:#ef6fab;box-shadow:0 4px 14px rgba(239,111,171,.25)}'+
      '.cbeg-thumb-wrap{padding:12px;background:#fafafe}'+
      '.cbeg-thumb-fallback{aspect-ratio:16/9;background:#ddd;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#666;font-size:11px}'+
      '.cbeg-meta{padding:10px 14px;flex:1}'+
      '.cbeg-name{font-size:13.5px;font-weight:900;color:#2b2430;display:flex;align-items:center;gap:6px}'+
      '.cbeg-on-chip{background:#ef6fab;color:#fff;padding:2px 7px;border-radius:999px;font-size:10px;font-weight:800}'+
      '.cbeg-desc{font-size:12px;color:#7b6080;margin-top:3px;line-height:1.5}'+
      '.cbeg-row{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:6px;font-size:11px}'+
      '.cbeg-row-label{font-weight:800;color:#5a4a8a;margin-right:2px}'+
      '.cbeg-tag{background:#f5f0ff;color:#5a4a8a;padding:2px 7px;border-radius:6px;font-size:10.5px;font-weight:700}'+
      '.cbeg-strength{background:#fff5e6;color:#5b2e1a;padding:2px 7px;border-radius:6px;font-size:10.5px;font-weight:700}'+
      '.cbeg-rule{background:#eef5ff;color:#1a3a5b;padding:2px 7px;border-radius:6px;font-size:10.5px;font-weight:700}'+
      '.cbeg-actions{display:flex;gap:6px;padding:10px 14px;border-top:1px solid #f1ecf6}'+
      '.cbeg-btn-primary{flex:1;border:none;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-radius:8px;padding:7px 10px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit}'+
      '.cbeg-btn-primary:hover{opacity:.92}'+
      '.cbeg-btn-secondary{border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#7b6080;border-radius:8px;padding:7px 10px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit}'+
      '.cbeg-btn-secondary:hover{border-color:#9181ff;color:#9181ff}'+
      '.cbeg-empty{padding:60px 20px;text-align:center;background:#fafafe;border-radius:14px;border:1px dashed #ece6f5}'+
      '.cbeg-empty-ico{font-size:48px;margin-bottom:12px}'+
      '.cbeg-empty-title{font-size:16px;font-weight:900;color:#2b2430;margin-bottom:4px}'+
      '.cbeg-empty-sub{font-size:12.5px;color:#7b6080;margin-bottom:16px;line-height:1.6}'+
      '.cbeg-selected-bar{margin-top:14px;background:#fff5fa;border:1px solid #f1c5dc;border-radius:10px;padding:10px 14px;font-size:12.5px;color:#5b1a4a;display:flex;align-items:center;gap:10px}'+
      '.cbeg-btn-tab{margin-left:auto;border:none;background:#ef6fab;color:#fff;border-radius:999px;padding:6px 14px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit}'+
      /* 모달 */
      '.cbeg-modal-back{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:20000;display:flex;align-items:center;justify-content:center;padding:20px}'+
      '.cbeg-modal-card{background:#fff;border-radius:18px;padding:24px;max-width:560px;width:100%;max-height:84vh;overflow-y:auto;position:relative;box-shadow:0 12px 40px rgba(0,0,0,.25)}'+
      '.cbeg-modal-close{position:absolute;top:14px;right:14px;border:none;background:#eee;border-radius:999px;padding:6px 12px;font-weight:800;cursor:pointer}'+
      '.cbeg-modal-title{margin:0 0 14px;font-size:18px;font-weight:900;color:#2b2430}'+
      '.cbeg-modal-preview{margin-bottom:14px}'+
      '.cbeg-modal-desc{font-size:13px;color:#7b6080;margin-bottom:14px;line-height:1.6}'+
      '.cbeg-modal-actions{display:flex;gap:8px;justify-content:flex-end}';
    document.head.appendChild(st);
  }
})();
