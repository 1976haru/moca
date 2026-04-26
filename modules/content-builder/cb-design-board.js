/* ================================================
   modules/content-builder/cb-design-board.js
   콘텐츠 빌더 2/3 — AI 디자인 보드 본격 구현
   * 좌: 입력 문구 + 분해 결과
   * 중: 4~6 시안 자동 생성 (cbGenerateLayouts) + 미리보기
   * 우/하: 선택 시안 상세 + 7항목 점수 + 문제점 안내
   * cb-design-board-placeholder.js 의 cbRenderTabDesignBoard 를 덮어씀
   ================================================ */
(function(){
  'use strict';

  /* ── tab 진입: 자동 시안 생성 ── */
  function _ensureLayouts(p) {
    p.designBoard = p.designBoard || {};
    var dirty = !p.designBoard.layouts || !p.designBoard.layouts.length;
    /* purpose 또는 입력 문구가 바뀌면 재생성 */
    var sigKey = (p.purposeFlow && p.purposeFlow.selectedPurpose) + '|' +
                 (p.purposeFlow && p.purposeFlow.aspectRatio) + '|' +
                 (p.purposeFlow && p.purposeFlow.selectedExampleId) + '|' +
                 ((p.decomposedCopy && p.decomposedCopy.headline) || '');
    if (p.designBoard._sigKey !== sigKey) dirty = true;
    if (dirty && typeof window.cbGenerateLayouts === 'function') {
      p.designBoard.layouts = window.cbGenerateLayouts(p);
      p.designBoard._sigKey = sigKey;
      if (!p.designBoard.selectedLayoutId && p.designBoard.layouts[0]) {
        p.designBoard.selectedLayoutId = p.designBoard.layouts[0].id;
      }
      if (typeof window.cbSave === 'function') window.cbSave();
    }
  }

  /* ── 메인 render — placeholder 함수를 덮어씀 ── */
  window.cbRenderTabDesignBoard = function(p) {
    p = p || (window.contentBuilderProject || {});
    p.purposeFlow    = p.purposeFlow    || {};
    p.designBoard    = p.designBoard    || {};
    p.decomposedCopy = p.decomposedCopy || {};
    _injectCSS();

    var pid    = p.purposeFlow.selectedPurpose || p.designBoard.purposeId || '';
    var preset = pid && (window.cbGetPurposePreset && window.cbGetPurposePreset(pid)) || null;
    if (!preset) {
      return '<div class="cbdb2-wrap"><div class="cbdb2-empty">' +
        '<div class="cbdb2-empty-ico">🪄</div>' +
        '<div class="cbdb2-empty-title">먼저 목적을 선택하세요</div>' +
        '<button class="cbdb2-btn-primary" onclick="cbGotoTab(\'purpose\')">→ 목적 선택으로 이동</button>' +
      '</div></div>';
    }

    _ensureLayouts(p);
    var layouts = p.designBoard.layouts || [];
    var selId   = p.designBoard.selectedLayoutId || (layouts[0] && layouts[0].id);
    var selected = layouts.find(function(l){ return l.id === selId; }) || layouts[0] || null;

    /* 상단 요약 */
    var headHtml = '<div class="cbdb2-hd">' +
      '<div>' +
        '<h3>🪄 AI 디자인 보드 — ' + preset.icon + ' ' + _esc(preset.label) + '</h3>' +
        '<p>예시 또는 입력 문구를 기반으로 ' + layouts.length + '개 시안이 자동 생성되었습니다. 시안을 선택하면 상세 점수와 다음 단계 안내가 표시됩니다.</p>' +
      '</div>' +
      '<div class="cbdb2-hd-actions">' +
        '<button class="cbdb2-btn-secondary" onclick="cbGotoTab(\'example-gallery\')">← 예시 갤러리</button>' +
        '<button class="cbdb2-btn-secondary" onclick="cbDb2Regenerate()">🔄 시안 재생성</button>' +
      '</div>' +
    '</div>';

    /* 좌측 — 문구 분해 */
    var dec = p.decomposedCopy || {};
    var decHtml = ['headline','subheadline','support','badge','cta','footer','warning'].map(function(k){
      return '<div class="cbdb2-dec-row">' +
        '<span class="cbdb2-dec-key">' + k + '</span>' +
        '<span class="cbdb2-dec-val">' + (_esc(dec[k]) || '<i>—</i>') + '</span>' +
      '</div>';
    }).join('');
    var leftHtml = '<div class="cbdb2-card cbdb2-card-left">' +
      '<div class="cbdb2-card-title">✂️ 입력 문구 / 자동 분해</div>' +
      '<textarea id="cbdb2-input" class="cbdb2-textarea" placeholder="예: 60대가 가장 후회하는 것, 알아요? 바로 부모님께 더 많은 시간을 드리지 못한 거래요. 오늘 바로 전화 한 통 드려보세요.">' + _esc(p.designBoard.lastInputText || '') + '</textarea>' +
      '<div class="cbdb2-textarea-actions">' +
        '<button class="cbdb2-btn-secondary" onclick="cbDb2SampleFill()">예시 채우기</button>' +
        '<button class="cbdb2-btn-primary"   onclick="cbDb2RunDecomposeAndRegen()">✂️ 분해 + 시안 재생성</button>' +
      '</div>' +
      '<div class="cbdb2-dec-list">' + decHtml + '</div>' +
      '<div class="cbdb2-cta-tip">기본 CTA: <b>' + _esc(preset.defaultCta || '-') + '</b></div>' +
    '</div>';

    /* 중앙 — 시안 grid */
    var draftsHtml = layouts.map(function(L){
      var on = (selId === L.id);
      var preview = (window.cbRenderDesignPreview)
        ? window.cbRenderDesignPreview(L, { scale: 0.4 })
        : '<div class="cbdb2-no-preview">미리보기 없음</div>';
      var sc = L.qualityScore || { percent:0, grade:'?' };
      var gradeCls = sc.percent >= 80 ? 'good' : sc.percent >= 60 ? 'mid' : 'low';
      return '<div class="cbdb2-draft' + (on?' on':'') + '" onclick="cbDb2SelectDraft(\''+L.id+'\')">' +
        '<div class="cbdb2-draft-prev">' + preview + '</div>' +
        '<div class="cbdb2-draft-meta">' +
          '<div class="cbdb2-draft-name">' + _esc(L.typeLabel) + (on?' <span class="cbdb2-on-chip">선택</span>':'') + '</div>' +
          '<div class="cbdb2-draft-score cbdb2-' + gradeCls + '">' + sc.percent + '점 · ' + sc.grade + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    var middleHtml = '<div class="cbdb2-card cbdb2-card-middle">' +
      '<div class="cbdb2-card-title">🎨 자동 생성 시안 (' + layouts.length + ')</div>' +
      '<div class="cbdb2-drafts">' + draftsHtml + '</div>' +
    '</div>';

    /* 우측 — 선택 시안 상세 */
    var rightHtml = '';
    if (selected) {
      var bigPreview = (window.cbRenderDesignPreview)
        ? window.cbRenderDesignPreview(selected, { scale: 0.8 })
        : '';
      var sc2 = selected.qualityScore || { items:{}, percent:0, grade:'?' };
      var scoreItems = (window.CB_QUALITY_ITEMS||[]).map(function(k){
        var v = sc2.items[k] || 0;
        var label = (window.CB_QUALITY_LABELS||{})[k] || k;
        var cls = v >= 4 ? 'good' : v >= 2 ? 'mid' : 'low';
        return '<div class="cbdb2-score-row">' +
          '<span class="cbdb2-score-label">' + label + '</span>' +
          '<div class="cbdb2-score-bar"><div class="cbdb2-score-fill cbdb2-' + cls + '" style="width:' + (v/5*100) + '%"></div></div>' +
          '<span class="cbdb2-score-num">' + v + '/5</span>' +
        '</div>';
      }).join('');
      var problems = _detectProblems(selected, dec);
      var problemsHtml = problems.length
        ? problems.map(function(pp){ return '<li>' + _esc(pp) + '</li>'; }).join('')
        : '<li class="cbdb2-ok">큰 문제 없음 — 다음 단계 진행 가능</li>';

      /* variants 칩 */
      var variantChips = '';
      if (selected.variants) {
        variantChips = Object.keys(selected.variants).map(function(r){
          var on2 = (selected.aspectRatio === r);
          return '<button class="cbdb2-vc' + (on2?' on':'') + '" onclick="cbDb2SwitchVariant(\''+r+'\')">' + r + '</button>';
        }).join('');
      }

      rightHtml = '<div class="cbdb2-card cbdb2-card-right">' +
        '<div class="cbdb2-card-title">📌 선택 시안 — ' + _esc(selected.typeLabel) +
          ' <span class="cbdb2-grade cbdb2-' + (sc2.percent>=80?'good':sc2.percent>=60?'mid':'low') + '">' + sc2.percent + '점 · ' + sc2.grade + '</span>' +
        '</div>' +
        '<div class="cbdb2-big-prev">' + bigPreview + '</div>' +
        '<div class="cbdb2-vc-row">비율 전환 ' + variantChips + '</div>' +
        '<div class="cbdb2-score-list">' + scoreItems + '</div>' +
        '<div class="cbdb2-problems"><div class="cbdb2-problems-title">📋 문제점 / 개선 제안</div><ul>' + problemsHtml + '</ul></div>' +
        '<div class="cbdb2-next-actions">' +
          '<button class="cbdb2-btn-primary" onclick="cbDb2AdoptDraft()">✅ 이 시안 채택</button>' +
          '<button class="cbdb2-btn-secondary" onclick="alert(\'3/3 단계에서 미디어 슬롯 완전 연동·PNG 출력이 추가됩니다.\')">미디어 슬롯으로 보내기 (3/3)</button>' +
          '<button class="cbdb2-btn-secondary" onclick="alert(\'3/3 단계에서 출력 패키지가 활성화됩니다.\')">출력 패키지에 추가 (3/3)</button>' +
        '</div>' +
      '</div>';
    }

    /* 3/3 안내 */
    var nextHtml = '<div class="cbdb2-next-card">' +
      '<div class="cbdb2-next-title">🚧 3/3 단계 안내</div>' +
      '<div>3/3 단계에서 이미지·로고·배경 미디어 슬롯 연결, 출력 패키지, PNG 다운로드, 자동 개선 고도화가 추가됩니다.</div>' +
    '</div>';

    return '<div class="cbdb2-wrap">' + headHtml +
      '<div class="cbdb2-grid">' + leftHtml + middleHtml + '</div>' +
      rightHtml + nextHtml +
    '</div>';
  };

  /* ── 액션들 ── */
  window.cbDb2SelectDraft = function(layoutId) {
    var p = window.contentBuilderProject || {};
    p.designBoard = p.designBoard || {};
    p.designBoard.selectedLayoutId = layoutId;
    var L = (p.designBoard.layouts || []).find(function(x){ return x.id === layoutId; });
    if (L) {
      p.designBoard.selectedLayout  = L;
      p.designBoard.qualityScores   = L.qualityScore;
    }
    /* localStorage 스냅샷 */
    try {
      localStorage.setItem('moca_content_builder_design_board_v1', JSON.stringify(p.designBoard));
    } catch(_) {}
    if (typeof window.cbSave === 'function') window.cbSave();
    if (typeof window.cbGotoTab === 'function') window.cbGotoTab('design-board');
  };

  window.cbDb2AdoptDraft = function() {
    var p = window.contentBuilderProject || {};
    var L = p.designBoard && p.designBoard.selectedLayout;
    if (!L) { alert('먼저 시안을 선택하세요.'); return; }
    p.designBoard.adopted = true;
    p.designBoard.adoptedAt = Date.now();
    try { localStorage.setItem('moca_content_builder_design_board_v1', JSON.stringify(p.designBoard)); } catch(_) {}
    if (typeof window.cbSave === 'function') window.cbSave();
    if (typeof ucShowToast === 'function') ucShowToast('✅ "' + L.typeLabel + '" 시안 채택됨', 'success');
    if (typeof window.cbGotoTab === 'function') window.cbGotoTab('design-board');
  };

  window.cbDb2Regenerate = function() {
    var p = window.contentBuilderProject || {};
    p.designBoard = p.designBoard || {};
    p.designBoard._sigKey = ''; /* 강제 재생성 트리거 */
    p.designBoard.layouts = [];
    p.designBoard.selectedLayoutId = '';
    if (typeof window.cbGotoTab === 'function') window.cbGotoTab('design-board');
  };

  window.cbDb2SwitchVariant = function(ratio) {
    var p = window.contentBuilderProject || {};
    var L = p.designBoard && p.designBoard.selectedLayout;
    if (!L || !L.variants || !L.variants[ratio]) return;
    var v = L.variants[ratio];
    /* 현재 선택 시안의 가시 비율을 변경 — selectedLayout 객체를 v 로 덮음 (qualityScore 유지) */
    var idx = (p.designBoard.layouts || []).findIndex(function(x){ return x.id === L.id; });
    if (idx >= 0) {
      var newL = Object.assign({}, L, { aspectRatio: ratio, blocks: v.blocks, safeArea: v.safeArea });
      p.designBoard.layouts[idx] = newL;
      p.designBoard.selectedLayout = newL;
    }
    if (typeof window.cbSave === 'function') window.cbSave();
    if (typeof window.cbGotoTab === 'function') window.cbGotoTab('design-board');
  };

  window.cbDb2SampleFill = function() {
    var el = document.getElementById('cbdb2-input');
    if (!el) return;
    el.value = '60대가 가장 후회하는 것, 알아요? 바로 부모님께 더 많은 시간을 드리지 못한 거래요. 돈은 다시 벌 수 있지만 시간은 돌아오지 않습니다. 오늘 바로 전화 한 통 드려보세요.';
  };

  window.cbDb2RunDecomposeAndRegen = function() {
    var el = document.getElementById('cbdb2-input');
    var text = (el && el.value) || '';
    if (!text.trim()) { alert('문구를 입력해주세요.'); return; }
    var p = window.contentBuilderProject = window.contentBuilderProject || {};
    p.designBoard = p.designBoard || {};
    p.designBoard.lastInputText = text;
    if (typeof window.cbRunQualityFromText === 'function') window.cbRunQualityFromText(text);
    /* 시안 재생성 트리거 */
    p.designBoard._sigKey = '';
    p.designBoard.layouts = [];
    p.designBoard.selectedLayoutId = '';
    if (typeof window.cbGotoTab === 'function') window.cbGotoTab('design-board');
  };

  /* ── 문제점 자동 감지 ── */
  function _detectProblems(L, dec) {
    var out = [];
    var sc = L.qualityScore || { items:{} };
    if ((sc.items.ctaVisibility || 0) < 3 && L.qualityRules.indexOf('ctaVisibility') >= 0) {
      out.push('CTA 가시성 부족 — CTA 문구를 추가하거나 더 짧게 만드세요.');
    }
    if ((sc.items.mobileReadability || 0) < 3) {
      out.push('헤드라인이 길어 모바일에서 잘릴 수 있음 — 14자 이내 권장.');
    }
    if ((sc.items.copySplit || 0) < 3) {
      out.push('문구 분해가 부족 — subheadline / support / badge / cta 중 일부를 추가하세요.');
    }
    if (L.aspectRatio === '9:16' && (!L.safeArea || !L.safeArea.show)) {
      out.push('자막 안전영역 누락 — 9:16 은 상단 12% / 하단 22% 권장.');
    }
    if ((sc.items.layoutFit || 0) < 3) {
      out.push('레이아웃이 목적과 다소 어긋남 — 예시 갤러리에서 다른 스타일도 확인하세요.');
    }
    return out;
  }

  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  function _injectCSS() {
    if (document.getElementById('cb-design-board-style')) return;
    var st = document.createElement('style');
    st.id = 'cb-design-board-style';
    st.textContent =
      '.cbdb2-wrap{padding:6px 4px;display:flex;flex-direction:column;gap:14px}'+
      '.cbdb2-hd{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap}'+
      '.cbdb2-hd h3{margin:0 0 4px;font-size:17px;font-weight:900;color:#2b2430}'+
      '.cbdb2-hd p{margin:0;font-size:12.5px;color:#7b6080}'+
      '.cbdb2-hd-actions{display:flex;gap:6px;flex-wrap:wrap}'+
      '.cbdb2-grid{display:grid;grid-template-columns:1fr 1.6fr;gap:14px}'+
      '@media(max-width:980px){.cbdb2-grid{grid-template-columns:1fr}}'+
      '.cbdb2-card{background:#fff;border:1.5px solid #ece6f5;border-radius:14px;padding:14px 16px}'+
      '.cbdb2-card-title{font-size:13px;font-weight:900;color:#5b1a4a;margin-bottom:10px;display:flex;align-items:center;gap:8px}'+
      '.cbdb2-textarea{width:100%;border:1.5px solid var(--line,#e9e4f3);border-radius:10px;padding:10px;font-size:12.5px;font-family:inherit;min-height:100px;resize:vertical;box-sizing:border-box}'+
      '.cbdb2-textarea:focus{outline:none;border-color:#9181ff}'+
      '.cbdb2-textarea-actions{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}'+
      '.cbdb2-btn-primary{flex:1;border:none;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-radius:8px;padding:7px 12px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit}'+
      '.cbdb2-btn-primary:hover{opacity:.92}'+
      '.cbdb2-btn-secondary{border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#7b6080;border-radius:8px;padding:7px 12px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit}'+
      '.cbdb2-btn-secondary:hover{border-color:#9181ff;color:#9181ff}'+
      '.cbdb2-dec-list{margin-top:10px;display:flex;flex-direction:column;gap:4px;max-height:280px;overflow-y:auto}'+
      '.cbdb2-dec-row{display:flex;gap:10px;font-size:11.5px;padding:5px 8px;background:#fafafe;border-radius:6px}'+
      '.cbdb2-dec-key{min-width:90px;color:#9181ff;font-weight:800;text-transform:uppercase;font-size:10.5px}'+
      '.cbdb2-dec-val{color:#3a3040}'+
      '.cbdb2-dec-val i{color:#bbb;font-style:normal}'+
      '.cbdb2-cta-tip{margin-top:10px;font-size:11.5px;color:#7b6080;background:#f5f0ff;padding:6px 10px;border-radius:6px}'+
      '.cbdb2-drafts{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}'+
      '.cbdb2-draft{cursor:pointer;border:2px solid transparent;border-radius:10px;transition:.14s;padding:6px}'+
      '.cbdb2-draft:hover{border-color:#9181ff}'+
      '.cbdb2-draft.on{border-color:#ef6fab;background:#fff5fa}'+
      '.cbdb2-draft-prev{margin-bottom:6px}'+
      '.cbdb2-draft-meta{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:11px}'+
      '.cbdb2-draft-name{font-weight:800;color:#2b2430}'+
      '.cbdb2-on-chip{margin-left:4px;background:#ef6fab;color:#fff;padding:1px 6px;border-radius:999px;font-size:9.5px;font-weight:800}'+
      '.cbdb2-draft-score{font-weight:800;padding:2px 7px;border-radius:999px;font-size:10.5px}'+
      '.cbdb2-good{background:#effbf7;color:#1a7a5a}'+
      '.cbdb2-mid{background:#eef5ff;color:#2b66c4}'+
      '.cbdb2-low{background:#fff1f1;color:#c0392b}'+
      '.cbdb2-card-right{}'+
      '.cbdb2-grade{margin-left:auto;font-size:11.5px;font-weight:900;padding:3px 10px;border-radius:999px}'+
      '.cbdb2-big-prev{margin-bottom:10px;max-width:540px}'+
      '.cbdb2-vc-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;font-size:11.5px;color:#7b6080;align-items:center}'+
      '.cbdb2-vc{border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit}'+
      '.cbdb2-vc.on{background:#9181ff;color:#fff;border-color:#9181ff}'+
      '.cbdb2-score-list{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}'+
      '.cbdb2-score-row{display:grid;grid-template-columns:130px 1fr 50px;gap:8px;align-items:center;font-size:12px}'+
      '.cbdb2-score-label{color:#5a4a56;font-weight:700}'+
      '.cbdb2-score-bar{height:8px;background:#f1ecf6;border-radius:999px;overflow:hidden}'+
      '.cbdb2-score-fill{height:100%;border-radius:999px;transition:width .25s}'+
      '.cbdb2-score-fill.cbdb2-good{background:linear-gradient(135deg,#27ae60,#a8e063)}'+
      '.cbdb2-score-fill.cbdb2-mid{background:linear-gradient(135deg,#9181ff,#778beb)}'+
      '.cbdb2-score-fill.cbdb2-low{background:linear-gradient(135deg,#ef6fab,#f5af19)}'+
      '.cbdb2-score-num{text-align:right;font-weight:800;color:#7b6080}'+
      '.cbdb2-problems{margin-bottom:12px;background:#fafafe;border-radius:10px;padding:10px 14px;font-size:12px}'+
      '.cbdb2-problems-title{font-weight:800;color:#5b1a4a;margin-bottom:6px}'+
      '.cbdb2-problems ul{margin:0;padding-left:18px;color:#5a4a56;line-height:1.6}'+
      '.cbdb2-problems li.cbdb2-ok{color:#1a7a5a;font-weight:700;list-style:"✅ "}'+
      '.cbdb2-next-actions{display:flex;gap:6px;flex-wrap:wrap}'+
      '.cbdb2-next-card{background:linear-gradient(135deg,#fff5fa,#f5f0ff);border:1px solid #f1c5dc;border-radius:14px;padding:12px 16px;font-size:12.5px;color:#5b1a4a}'+
      '.cbdb2-next-title{font-weight:900;margin-bottom:4px}'+
      '.cbdb2-empty{padding:60px 20px;text-align:center;background:#fafafe;border-radius:14px;border:1px dashed #ece6f5}'+
      '.cbdb2-empty-ico{font-size:48px;margin-bottom:12px}'+
      '.cbdb2-empty-title{font-size:16px;font-weight:900;color:#2b2430;margin-bottom:14px}'+
      '.cbdb2-no-preview{padding:20px;text-align:center;color:#999;background:#fafafe;border-radius:8px;font-size:11px}';
    document.head.appendChild(st);
  }
})();
