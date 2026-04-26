/* ================================================
   modules/content-builder/cb-design-editor.js
   콘텐츠 빌더 3/3 — 텍스트/블록 편집
   * 8필드 textarea + 글자수 + 너무 길면 경고
   * 입력 즉시 layoutSpec.blocks.text + decomposedCopy + qualityScore
   ================================================ */
(function(){
  'use strict';

  const FIELDS = [
    { key:'headline',    label:'헤드라인',  max:30, recommend:14 },
    { key:'subheadline', label:'부제목',    max:60, recommend:30 },
    { key:'support',     label:'본문',      max:120, recommend:80 },
    { key:'badge',       label:'배지',      max:12, recommend:6 },
    { key:'cta',         label:'CTA',       max:20, recommend:8 },
    { key:'eyebrow',     label:'아이브로우', max:20, recommend:10 },
    { key:'footer',      label:'푸터',      max:30, recommend:20 },
    { key:'warning',     label:'경고',      max:20, recommend:10 },
  ];

  function _selected(p) {
    p = p || (window.contentBuilderProject || {});
    var L = (p.designBoard && p.designBoard.selectedLayout)
         || ((p.designBoard && p.designBoard.layouts || []).find(function(x){ return x.id === (p.designBoard && p.designBoard.selectedLayoutId); }));
    return L || null;
  }

  /* render — design-board 우측 sub-panel 'edit' 일 때 호출 */
  window.cbRenderEditorPanel = function(p) {
    p = p || (window.contentBuilderProject || {});
    var L = _selected(p);
    if (!L) {
      return '<div class="cbed-empty">먼저 시안 grid에서 시안을 선택하세요.</div>';
    }
    p.decomposedCopy = p.decomposedCopy || {};
    _injectCSS();

    var rowsHtml = FIELDS.map(function(f){
      var val = p.decomposedCopy[f.key] || _getBlockText(L, f.key) || '';
      var len = val.length;
      var warn = len > f.recommend ? (len > f.max ? 'over' : 'warn') : 'ok';
      var msg = warn === 'over' ? '⚠️ 너무 길어요 — 잘릴 수 있음'
              : warn === 'warn' ? 'ℹ️ 권장 길이 초과'
              : '✅ 길이 적정';
      return '<div class="cbed-row">' +
        '<label class="cbed-label">' +
          '<span class="cbed-name">' + f.label + '</span>' +
          '<span class="cbed-len cbed-' + warn + '">' + len + '/' + f.recommend + '~' + f.max + '</span>' +
        '</label>' +
        '<textarea class="cbed-input" data-field="' + f.key + '" oninput="cbEdSetField(\'' + f.key + '\', this.value)" placeholder="비어 있음">' + _esc(val) + '</textarea>' +
        '<div class="cbed-hint cbed-' + warn + '">' + msg + '</div>' +
      '</div>';
    }).join('');

    return '<div class="cbed-wrap">' +
      '<div class="cbed-intro">✏️ 입력 즉시 시안 미리보기와 점수가 갱신됩니다.</div>' +
      rowsHtml +
      '<div class="cbed-actions">' +
        '<button class="cbed-btn-secondary" onclick="cbEdShortenAll()">🪄 모든 문구 자동 줄이기</button>' +
        '<button class="cbed-btn-secondary" onclick="cbEdCtaSuggest()">💡 CTA 추천</button>' +
      '</div>' +
    '</div>';
  };

  function _getBlockText(L, fieldKey) {
    if (!L || !L.blocks) return '';
    var b = L.blocks.find(function(x){ return x.type === fieldKey; });
    return b ? (b.text || '') : '';
  }

  /* 필드 변경 — 즉시 layoutSpec + decomposedCopy + qualityScore 갱신 */
  window.cbEdSetField = function(fieldKey, val) {
    var p = window.contentBuilderProject = window.contentBuilderProject || {};
    p.decomposedCopy = p.decomposedCopy || {};
    p.decomposedCopy[fieldKey] = val;
    /* 모든 시안의 해당 block.text 업데이트 (선택 시안 우선) */
    (p.designBoard && p.designBoard.layouts || []).forEach(function(L){
      var b = (L.blocks || []).find(function(x){ return x.type === fieldKey; });
      if (b) {
        b.text = val;
      } else if (val) {
        /* badge/cta 가 없었는데 새로 추가되는 경우 — 합리적 위치 */
        var rule = (window.CB_REFLOW_RULE || {})[L.aspectRatio] || {};
        var place = rule[fieldKey];
        if (place) L.blocks.push({ type: fieldKey, text: val, x:place.x, y:place.y, w:place.w, h:place.h });
      }
      /* 점수 갱신 */
      if (typeof window.cbScoreLayoutSpec === 'function') {
        L.qualityScore = window.cbScoreLayoutSpec(L, p.decomposedCopy);
      }
    });
    if (typeof window.cbSaveQualitySnapshot === 'function') window.cbSaveQualitySnapshot();
    if (typeof window.cbDb2RerenderRight === 'function') window.cbDb2RerenderRight();
    else if (typeof window.cbSave === 'function') window.cbSave();
  };

  window.cbEdShortenAll = function() {
    var p = window.contentBuilderProject || {};
    var dec = p.decomposedCopy = p.decomposedCopy || {};
    FIELDS.forEach(function(f){
      var v = (dec[f.key] || '').trim();
      if (!v) return;
      if (v.length > f.recommend) {
        /* 첫 문장만 / 첫 N자 */
        var first = v.split(/[.!?。]\s*/)[0] || v;
        if (first.length > f.recommend) first = first.slice(0, f.recommend);
        dec[f.key] = first.trim();
      }
    });
    /* 모든 layout 갱신 */
    (p.designBoard && p.designBoard.layouts || []).forEach(function(L){
      (L.blocks || []).forEach(function(b){
        if (dec[b.type] != null) b.text = dec[b.type];
      });
      if (typeof window.cbScoreLayoutSpec === 'function') {
        L.qualityScore = window.cbScoreLayoutSpec(L, dec);
      }
    });
    if (typeof window.cbSaveQualitySnapshot === 'function') window.cbSaveQualitySnapshot();
    if (typeof window.cbDb2RerenderRight === 'function') window.cbDb2RerenderRight();
    if (typeof ucShowToast === 'function') ucShowToast('✂️ 문구 자동 줄이기 적용', 'success');
  };

  window.cbEdCtaSuggest = function() {
    var p = window.contentBuilderProject || {};
    var pid = (p.purposeFlow && p.purposeFlow.selectedPurpose) || '';
    var defaultCta = (window.cbGetDefaultCta && window.cbGetDefaultCta(pid)) || '바로 보기';
    if (!p.decomposedCopy) p.decomposedCopy = {};
    if (!p.decomposedCopy.cta) p.decomposedCopy.cta = defaultCta;
    /* layout 에 cta block 없으면 추가 */
    (p.designBoard && p.designBoard.layouts || []).forEach(function(L){
      var b = (L.blocks || []).find(function(x){ return x.type === 'cta'; });
      var rule = (window.CB_REFLOW_RULE || {})[L.aspectRatio] || (window.CB_REFLOW_RULE || {})['16:9'];
      var place = rule.cta;
      if (b) b.text = p.decomposedCopy.cta;
      else if (place) L.blocks.push({ type:'cta', text: p.decomposedCopy.cta, x:place.x, y:place.y, w:place.w, h:place.h });
      if (typeof window.cbScoreLayoutSpec === 'function') {
        L.qualityScore = window.cbScoreLayoutSpec(L, p.decomposedCopy);
      }
    });
    if (typeof window.cbSaveQualitySnapshot === 'function') window.cbSaveQualitySnapshot();
    if (typeof window.cbDb2RerenderRight === 'function') window.cbDb2RerenderRight();
    if (typeof ucShowToast === 'function') ucShowToast('💡 CTA "' + defaultCta + '" 적용', 'success');
  };

  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  function _injectCSS() {
    if (document.getElementById('cb-design-editor-style')) return;
    var st = document.createElement('style');
    st.id = 'cb-design-editor-style';
    st.textContent =
      '.cbed-wrap{padding:6px 4px;display:flex;flex-direction:column;gap:10px}'+
      '.cbed-intro{font-size:12px;color:#7b6080;background:#fafafe;border-radius:8px;padding:8px 12px}'+
      '.cbed-row{display:flex;flex-direction:column;gap:4px;background:#fff;border:1px solid #ece6f5;border-radius:10px;padding:10px 12px}'+
      '.cbed-label{display:flex;align-items:center;justify-content:space-between;font-size:11.5px;font-weight:800;color:#5b1a4a}'+
      '.cbed-len{font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:999px}'+
      '.cbed-len.cbed-ok{background:#effbf7;color:#1a7a5a}'+
      '.cbed-len.cbed-warn{background:#fff7e6;color:#a05a00}'+
      '.cbed-len.cbed-over{background:#fff1f1;color:#c0392b}'+
      '.cbed-input{width:100%;border:1.5px solid var(--line,#e9e4f3);border-radius:8px;padding:7px 10px;font-size:12.5px;font-family:inherit;min-height:36px;resize:vertical;box-sizing:border-box}'+
      '.cbed-input:focus{outline:none;border-color:#9181ff}'+
      '.cbed-hint{font-size:10.5px;font-weight:700}'+
      '.cbed-hint.cbed-ok{color:#1a7a5a}.cbed-hint.cbed-warn{color:#a05a00}.cbed-hint.cbed-over{color:#c0392b}'+
      '.cbed-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}'+
      '.cbed-btn-secondary{flex:1;min-width:160px;border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit}'+
      '.cbed-btn-secondary:hover{border-color:#9181ff;color:#9181ff}'+
      '.cbed-empty{padding:30px 20px;text-align:center;color:#999;background:#fafafe;border-radius:12px;font-size:12.5px}';
    document.head.appendChild(st);
  }
})();
