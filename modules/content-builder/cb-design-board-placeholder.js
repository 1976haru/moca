/* ================================================
   modules/content-builder/cb-design-board-placeholder.js
   콘텐츠 빌더 1/3 — AI 디자인 보드 placeholder
   * 본격 구현은 2/3·3/3 단계
   * 현재는 선택 목적/비율/qualityRules/문구분해/7항목 점수만 표시
   ================================================ */
(function(){
  'use strict';

  window.cbRenderTabDesignBoard = function(p) {
    p = p || (window.contentBuilderProject || {});
    p.purposeFlow  = p.purposeFlow  || {};
    p.designBoard  = p.designBoard  || {};
    p.decomposedCopy = p.decomposedCopy || {};
    _injectCSS();

    var purId = p.purposeFlow.selectedPurpose || p.designBoard.purposeId || '';
    var preset = (purId && typeof window.cbGetPurposePreset === 'function')
      ? window.cbGetPurposePreset(purId) : null;

    if (!preset) {
      return '<div class="cbdb-wrap">' +
        '<div class="cbdb-empty">' +
          '<div class="cbdb-empty-ico">🪄</div>' +
          '<div class="cbdb-empty-title">먼저 목적을 선택하세요</div>' +
          '<div class="cbdb-empty-sub">"목적 선택" 탭에서 무엇을 만들지 고른 뒤 디자인 보드가 활성화됩니다.</div>' +
          '<button class="cbdb-btn-primary" onclick="cbGotoTab(\'purpose\')">→ 목적 선택으로 이동</button>' +
        '</div>' +
      '</div>';
    }

    /* qualityRules tag list */
    var rulesHtml = (p.purposeFlow.qualityRules || preset.qualityRules || []).map(function(r){
      var label = (window.CB_QUALITY_LABELS && window.CB_QUALITY_LABELS[r]) || r;
      return '<span class="cbdb-rule">' + label + '</span>';
    }).join('');

    /* decomposedCopy 표시 */
    var dec = p.decomposedCopy || {};
    var decHtml = ['eyebrow','headline','subheadline','support','badge','cta','footer','warning'].map(function(k){
      return '<div class="cbdb-dec-row">' +
        '<span class="cbdb-dec-key">' + k + '</span>' +
        '<span class="cbdb-dec-val">' + (_esc(dec[k]) || '<i>—</i>') + '</span>' +
      '</div>';
    }).join('');

    /* 7항목 점수 */
    var snapshot = (typeof window.cbScoreQuality === 'function')
      ? window.cbScoreQuality(p) : { items:{}, total:0, percent:0, grade:'?' };
    var scoreHtml = (window.CB_QUALITY_ITEMS || []).map(function(k){
      var v = snapshot.items[k] || 0;
      var label = (window.CB_QUALITY_LABELS || {})[k] || k;
      var cls = v >= 4 ? 'good' : v >= 2 ? 'mid' : 'low';
      return '<div class="cbdb-score-row">' +
        '<span class="cbdb-score-label">' + label + '</span>' +
        '<div class="cbdb-score-bar"><div class="cbdb-score-fill cbdb-' + cls + '" style="width:' + (v/5*100) + '%"></div></div>' +
        '<span class="cbdb-score-num">' + v + '/5</span>' +
      '</div>';
    }).join('');
    var gradeCls = snapshot.percent >= 80 ? 'good' : snapshot.percent >= 60 ? 'mid' : 'low';

    return '<div class="cbdb-wrap">' +
      '<div class="cbdb-hd">' +
        '<div>' +
          '<h3>🪄 AI 디자인 보드 <span class="cbdb-phase">v1 (placeholder)</span></h3>' +
          '<p>2/3 단계에서 디자인 시안과 예시 갤러리가 연결됩니다. 현재는 선택 목적·문구·점수가 미리 보입니다.</p>' +
        '</div>' +
        '<button class="cbdb-btn-secondary" onclick="cbGotoTab(\'purpose\')">← 목적 변경</button>' +
      '</div>' +

      '<div class="cbdb-grid">' +
        /* 좌: 선택 정보 */
        '<div class="cbdb-card">' +
          '<div class="cbdb-card-title">📋 선택 정보</div>' +
          '<div class="cbdb-info-row"><span>목적</span><b>' + preset.icon + ' ' + _esc(preset.label) + '</b></div>' +
          '<div class="cbdb-info-row"><span>권장 비율</span><b>' + (preset.ratios || []).join(' / ') + '</b></div>' +
          '<div class="cbdb-info-row"><span>레이아웃 그룹</span><b>' + _esc(preset.layoutPresetGroup || '-') + '</b></div>' +
          '<div class="cbdb-info-row"><span>기본 CTA</span><b>' + _esc(preset.defaultCta || '-') + '</b></div>' +
          '<div class="cbdb-info-row"><span>구조</span><b>' + (preset.copyStructure || []).join(' → ') + '</b></div>' +
          '<div class="cbdb-rules-row"><div class="cbdb-rules-title">활성 품질 규칙</div><div class="cbdb-rules">' + rulesHtml + '</div></div>' +
        '</div>' +

        /* 우: 문구 분해 입력 */
        '<div class="cbdb-card">' +
          '<div class="cbdb-card-title">✂️ 문구 자동 분해</div>' +
          '<textarea id="cbdb-input" class="cbdb-textarea" placeholder="여기에 원본 문구를 붙여넣으세요. 예: 60대가 가장 후회하는 것, 알아요? 바로 부모님께 더 많은 시간을 드리지 못한 거래요. 오늘 바로 전화 한 통 드려보세요.">' + _esc(p.designBoard.lastInputText || '') + '</textarea>' +
          '<div class="cbdb-textarea-actions">' +
            '<button class="cbdb-btn-secondary" onclick="cbDbSampleFill()">예시 채우기</button>' +
            '<button class="cbdb-btn-primary"   onclick="cbDbRunDecompose()">✂️ 문구 자동 분해 + 점수 계산</button>' +
          '</div>' +
          '<div class="cbdb-dec-list">' + decHtml + '</div>' +
        '</div>' +
      '</div>' +

      /* 7항목 점수 */
      '<div class="cbdb-card cbdb-score-card">' +
        '<div class="cbdb-card-title">📊 7항목 품질 점수 ' +
          '<span class="cbdb-grade cbdb-' + gradeCls + '">' + snapshot.percent + '점 · ' + snapshot.grade + '</span>' +
        '</div>' +
        '<div class="cbdb-score-list">' + scoreHtml + '</div>' +
        '<div class="cbdb-card-hint">💡 점수는 입력 문구·선택 목적·기본 preset 기준이며, 2/3 단계에서 실제 시안 충돌 감지·리플로우와 연결됩니다.</div>' +
      '</div>' +

      /* 다음 단계 안내 */
      '<div class="cbdb-card cbdb-next-card">' +
        '<div class="cbdb-card-title">🚧 1/3 단계 안내</div>' +
        '<div class="cbdb-next-grid">' +
          '<div class="cbdb-next-item">✅ 1/3 (현재) — 목적 선택, 문구 분해, 7항목 점수 구조</div>' +
          '<div class="cbdb-next-item">⏳ 2/3 — 예시 갤러리 본격 구현, 디자인 시안 미리보기, 충돌 감지</div>' +
          '<div class="cbdb-next-item">⏳ 3/3 — 미디어 슬롯 완전 연동, 출력 패키지, 브랜드 키트 적용</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  };

  /* 예시 채우기 */
  window.cbDbSampleFill = function() {
    var el = document.getElementById('cbdb-input');
    if (!el) return;
    el.value = '60대가 가장 후회하는 것, 알아요? 바로 부모님께 더 많은 시간을 드리지 못한 거래요. 돈은 다시 벌 수 있지만 시간은 돌아오지 않습니다. 오늘 바로 전화 한 통 드려보세요.';
  };

  /* 분해 실행 */
  window.cbDbRunDecompose = function() {
    var el = document.getElementById('cbdb-input');
    var text = (el && el.value) || '';
    if (!text.trim()) { alert('문구를 입력해주세요.'); return; }
    var p = window.contentBuilderProject = window.contentBuilderProject || {};
    p.designBoard = p.designBoard || {};
    p.designBoard.lastInputText = text;
    if (typeof window.cbRunQualityFromText === 'function') {
      window.cbRunQualityFromText(text);
    }
    if (typeof window.cbGotoTab === 'function') window.cbGotoTab('design-board');
  };

  function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  /* ── CSS ── */
  function _injectCSS() {
    if (document.getElementById('cb-designboard-style')) return;
    var st = document.createElement('style');
    st.id = 'cb-designboard-style';
    st.textContent =
      '.cbdb-wrap{padding:6px 4px;display:flex;flex-direction:column;gap:14px}'+
      '.cbdb-hd{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap}'+
      '.cbdb-hd h3{margin:0 0 4px;font-size:17px;font-weight:900;color:#2b2430}'+
      '.cbdb-phase{font-size:11px;font-weight:700;color:#9181ff;background:#f5f0ff;padding:2px 8px;border-radius:999px;vertical-align:middle;margin-left:6px}'+
      '.cbdb-hd p{margin:0;font-size:12.5px;color:#7b6080}'+
      '.cbdb-grid{display:grid;grid-template-columns:1fr 1.3fr;gap:14px}'+
      '@media(max-width:880px){.cbdb-grid{grid-template-columns:1fr}}'+
      '.cbdb-card{background:#fff;border:1.5px solid #ece6f5;border-radius:14px;padding:14px 16px}'+
      '.cbdb-card-title{font-size:13px;font-weight:900;color:#5b1a4a;margin-bottom:10px;display:flex;align-items:center;gap:8px}'+
      '.cbdb-card-hint{font-size:11px;color:#7b6080;margin-top:10px;line-height:1.6;background:#fafafe;border-radius:8px;padding:8px 10px}'+
      '.cbdb-info-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px dashed #f1ecf6;font-size:12.5px}'+
      '.cbdb-info-row:last-child{border-bottom:none}'+
      '.cbdb-info-row span{color:#7b6080}'+
      '.cbdb-info-row b{color:#2b2430;text-align:right}'+
      '.cbdb-rules-row{margin-top:8px;padding-top:8px;border-top:1px dashed #f1ecf6}'+
      '.cbdb-rules-title{font-size:11.5px;color:#7b6080;margin-bottom:6px}'+
      '.cbdb-rules{display:flex;gap:4px;flex-wrap:wrap}'+
      '.cbdb-rule{background:#f5f0ff;color:#5a4a8a;padding:3px 9px;border-radius:6px;font-size:11px;font-weight:700}'+
      '.cbdb-textarea{width:100%;border:1.5px solid var(--line,#e9e4f3);border-radius:10px;padding:10px;font-size:12.5px;font-family:inherit;min-height:90px;resize:vertical;box-sizing:border-box}'+
      '.cbdb-textarea:focus{outline:none;border-color:#9181ff}'+
      '.cbdb-textarea-actions{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}'+
      '.cbdb-btn-secondary{border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#7b6080;border-radius:8px;padding:6px 12px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit}'+
      '.cbdb-btn-secondary:hover{border-color:#9181ff;color:#9181ff}'+
      '.cbdb-btn-primary{flex:1;border:none;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-radius:8px;padding:6px 12px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit}'+
      '.cbdb-btn-primary:hover{opacity:.92}'+
      '.cbdb-dec-list{margin-top:10px;display:flex;flex-direction:column;gap:4px}'+
      '.cbdb-dec-row{display:flex;gap:10px;font-size:11.5px;padding:5px 8px;background:#fafafe;border-radius:6px}'+
      '.cbdb-dec-key{min-width:90px;color:#9181ff;font-weight:800;text-transform:uppercase;font-size:10.5px}'+
      '.cbdb-dec-val{color:#3a3040}'+
      '.cbdb-dec-val i{color:#bbb;font-style:normal}'+
      '.cbdb-score-card{}'+
      '.cbdb-grade{margin-left:auto;font-size:11.5px;font-weight:900;padding:3px 10px;border-radius:999px}'+
      '.cbdb-grade.cbdb-good{background:#effbf7;color:#1a7a5a}'+
      '.cbdb-grade.cbdb-mid{background:#eef5ff;color:#2b66c4}'+
      '.cbdb-grade.cbdb-low{background:#fff1f1;color:#c0392b}'+
      '.cbdb-score-list{display:flex;flex-direction:column;gap:6px}'+
      '.cbdb-score-row{display:grid;grid-template-columns:130px 1fr 50px;gap:8px;align-items:center;font-size:12px}'+
      '.cbdb-score-label{color:#5a4a56;font-weight:700}'+
      '.cbdb-score-bar{height:8px;background:#f1ecf6;border-radius:999px;overflow:hidden}'+
      '.cbdb-score-fill{height:100%;border-radius:999px;transition:width .25s}'+
      '.cbdb-score-fill.cbdb-good{background:linear-gradient(135deg,#27ae60,#a8e063)}'+
      '.cbdb-score-fill.cbdb-mid{background:linear-gradient(135deg,#9181ff,#778beb)}'+
      '.cbdb-score-fill.cbdb-low{background:linear-gradient(135deg,#ef6fab,#f5af19)}'+
      '.cbdb-score-num{text-align:right;font-weight:800;color:#7b6080}'+
      '.cbdb-next-card{background:linear-gradient(135deg,#fff5fa,#f5f0ff)}'+
      '.cbdb-next-grid{display:flex;flex-direction:column;gap:6px;font-size:12.5px;color:#5b1a4a}'+
      '.cbdb-next-item{padding:6px 10px;background:#fff;border-radius:8px;border:1px solid #f1c5dc}'+
      '.cbdb-empty{padding:60px 20px;text-align:center;background:#fafafe;border-radius:14px;border:1px dashed #ece6f5}'+
      '.cbdb-empty-ico{font-size:48px;margin-bottom:12px}'+
      '.cbdb-empty-title{font-size:16px;font-weight:900;color:#2b2430;margin-bottom:4px}'+
      '.cbdb-empty-sub{font-size:12.5px;color:#7b6080;margin-bottom:16px;line-height:1.6}';
    document.head.appendChild(st);
  }
})();
