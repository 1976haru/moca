/* ================================================
   modules/content-builder/cb-design-finalize.js
   콘텐츠 빌더 3/3 — finalDesign 저장 + 다른 탭 연결
   ================================================ */
(function(){
  'use strict';

  function _selected(p) {
    p = p || (window.contentBuilderProject || {});
    return (p.designBoard && p.designBoard.selectedLayout)
        || ((p.designBoard && p.designBoard.layouts || []).find(function(x){ return x.id === (p.designBoard && p.designBoard.selectedLayoutId); }))
        || null;
  }

  /* finalDesign 저장 */
  window.cbSaveFinalDesign = function() {
    var p = window.contentBuilderProject = window.contentBuilderProject || {};
    var L = _selected(p);
    if (!L) { alert('먼저 시안을 선택하세요.'); return null; }
    p.finalDesign = {
      purpose:           L.purposeId,
      aspectRatio:       L.aspectRatio,
      selectedExampleId: L.sourceExampleId || (p.purposeFlow && p.purposeFlow.selectedExampleId) || '',
      selectedLayoutId:  L.id,
      layoutSpec:        L,
      mediaSlots:        (p.designBoard && p.designBoard.mediaSlots) || {},
      qualityScore:      L.qualityScore || {},
      exportPackage:     (p.designBoard && p.designBoard.exportPackage) || {},
      decomposedCopy:    p.decomposedCopy || {},
      updatedAt:         new Date().toISOString(),
    };
    try {
      localStorage.setItem('moca_content_builder_final_design_v1', JSON.stringify(p.finalDesign));
    } catch(_) {}
    if (typeof window.cbSave === 'function') window.cbSave();
    return p.finalDesign;
  };

  /* 다른 탭으로 보내기 — finalDesign 저장 후 이동 */
  window.cbSendToTab = function(targetTabId) {
    var fd = cbSaveFinalDesign();
    if (!fd) return;
    if (typeof ucShowToast === 'function') ucShowToast('✅ 최종 디자인 저장 — ' + targetTabId + ' 탭으로 이동', 'success');
    if (typeof window.cbGotoTab === 'function') window.cbGotoTab(targetTabId);
  };

  /* finalDesign 로드 */
  window.cbLoadFinalDesign = function() {
    try { return JSON.parse(localStorage.getItem('moca_content_builder_final_design_v1') || 'null'); }
    catch(_) { return null; }
  };

  /* render — 디자인 보드 footer 영역에 final 액션 버튼 그룹 */
  window.cbRenderFinalizeBar = function(p) {
    p = p || (window.contentBuilderProject || {});
    var L = _selected(p);
    if (!L) return '';
    var fd = p.finalDesign;
    var savedHtml = fd ? '<span class="cbfn-saved">✅ 최종 저장됨 (' + (new Date(fd.updatedAt).toLocaleTimeString('ko-KR')) + ')</span>' : '';
    return '<div class="cbfn-bar">' +
      '<div class="cbfn-info">📤 다음 단계로 보내기:</div>' +
      '<button class="cbfn-btn" onclick="cbSendToTab(\'t5\')">미디어 슬롯 (t5)</button>' +
      '<button class="cbfn-btn" onclick="cbSendToTab(\'t6\')">스타일/브랜드 (t6)</button>' +
      '<button class="cbfn-btn" onclick="cbSendToTab(\'t7\')">미리보기·검수 (t7)</button>' +
      '<button class="cbfn-btn cbfn-btn-pri" onclick="cbSendToTab(\'t8\')">📦 출력 패키지 (t8)</button>' +
      savedHtml +
    '</div>';
  };

  /* CSS */
  (function _css(){
    if (document.getElementById('cb-design-finalize-style')) return;
    var st = document.createElement('style');
    st.id = 'cb-design-finalize-style';
    st.textContent =
      '.cbfn-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;background:linear-gradient(135deg,#fff5fa,#f5f0ff);border:1px solid #f1c5dc;border-radius:12px;padding:10px 14px;margin-top:14px;font-size:12.5px;color:#5b1a4a}'+
      '.cbfn-info{font-weight:800;color:#5b1a4a;margin-right:4px}'+
      '.cbfn-btn{border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:8px;padding:6px 12px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit}'+
      '.cbfn-btn:hover{border-color:#9181ff;color:#9181ff}'+
      '.cbfn-btn-pri{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border:none}'+
      '.cbfn-btn-pri:hover{opacity:.92;color:#fff}'+
      '.cbfn-saved{margin-left:auto;font-size:11px;color:#1a7a5a;font-weight:700}';
    document.head.appendChild(st);
  })();
})();
