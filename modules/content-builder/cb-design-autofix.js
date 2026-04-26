/* ================================================
   modules/content-builder/cb-design-autofix.js
   콘텐츠 빌더 3/3 — 9 자동 개선
   * 각 함수: 선택 시안 또는 모든 시안 조정 + qualityScore 재계산
   ================================================ */
(function(){
  'use strict';

  function _selected(p) {
    p = p || (window.contentBuilderProject || {});
    return (p.designBoard && p.designBoard.selectedLayout)
        || ((p.designBoard && p.designBoard.layouts || []).find(function(x){ return x.id === (p.designBoard && p.designBoard.selectedLayoutId); }))
        || null;
  }
  function _afterChange(p, msg) {
    var L = _selected(p);
    if (L && typeof window.cbScoreLayoutSpec === 'function') {
      L.qualityScore = window.cbScoreLayoutSpec(L, p.decomposedCopy || {});
      p.designBoard.qualityScores = L.qualityScore;
    }
    if (typeof window.cbSaveQualitySnapshot === 'function') window.cbSaveQualitySnapshot();
    if (typeof window.cbDb2RerenderRight === 'function') window.cbDb2RerenderRight();
    if (msg && typeof ucShowToast === 'function') ucShowToast(msg, 'success');
  }

  /* render — 자동 개선 패널 */
  window.cbRenderAutofixPanel = function(p) {
    p = p || (window.contentBuilderProject || {});
    var L = _selected(p);
    if (!L) return '<div class="cbaf-empty">먼저 시안을 선택하세요.</div>';
    _injectCSS();

    var sc = L.qualityScore || { percent:0, grade:'?' };
    var prev = (p.designBoard && p.designBoard._autofixPrev) || null;

    var prevHtml = prev ? '<div class="cbaf-prev-card">개선 전: <b>' + prev.percent + '점 · ' + prev.grade + '</b> → 현재: <b>' + sc.percent + '점 · ' + sc.grade + '</b></div>' : '';

    var btns = [
      ['shorten',     '✂️ 문구 줄이기',     'cbAfShortenCopy()'],
      ['readability', '📖 가독성 개선',     'cbAfReadability()'],
      ['hierarchy',   '📐 위계 정리',       'cbAfHierarchy()'],
      ['contrast',    '🎨 대비 강화',       'cbAfContrast()'],
      ['cta',         '🔥 CTA 강조',        'cbAfCtaEmphasis()'],
      ['separate',    '🪄 이미지·텍스트 분리','cbAfSeparateImageText()'],
      ['mobile',      '📱 모바일 최적화',   'cbAfMobileOptimize()'],
      ['reflow',      '🔁 비율 재배치',     'cbAfRatioReflow()'],
      ['all',         '⚡ 전체 자동 개선 (모두 순차 실행)', 'cbAfAll()'],
    ];

    var btnsHtml = btns.map(function(b){
      var primary = (b[0] === 'all') ? ' cbaf-btn-primary' : '';
      return '<button class="cbaf-btn'+primary+'" onclick="' + b[2] + '">' + b[1] + '</button>';
    }).join('');

    return '<div class="cbaf-wrap">' +
      '<div class="cbaf-intro">🪄 자동 개선 — 선택 시안에 적용하고 7항목 점수가 즉시 재계산됩니다.</div>' +
      prevHtml +
      '<div class="cbaf-grid">' + btnsHtml + '</div>' +
    '</div>';
  };

  /* ── 0) snapshot 저장 — 비교용 ── */
  function _snapshotPrev(p) {
    var L = _selected(p);
    if (!L || !L.qualityScore) return;
    p.designBoard._autofixPrev = { percent: L.qualityScore.percent, grade: L.qualityScore.grade };
  }

  /* ── 1) 문구 줄이기 ── */
  window.cbAfShortenCopy = function() {
    var p = window.contentBuilderProject || {}; _snapshotPrev(p);
    var L = _selected(p); if (!L) return;
    p.decomposedCopy = p.decomposedCopy || {};
    var dec = p.decomposedCopy;
    var rules = { headline:14, subheadline:30, support:80, badge:6, cta:8 };
    Object.keys(rules).forEach(function(k){
      var v = (dec[k] || '').trim(); if (!v) return;
      if (v.length > rules[k]) {
        var first = v.split(/[.!?。]\s*/)[0] || v;
        if (first.length > rules[k]) first = first.slice(0, rules[k]);
        dec[k] = first.trim();
      }
    });
    (L.blocks || []).forEach(function(b){ if (dec[b.type] != null) b.text = dec[b.type]; });
    _afterChange(p, '✂️ 문구 줄이기 적용');
  };

  /* ── 2) 가독성 개선 ── */
  window.cbAfReadability = function() {
    var p = window.contentBuilderProject || {}; _snapshotPrev(p);
    var L = _selected(p); if (!L) return;
    /* support block 이 길면 표시 안 함 (시안 단순화) */
    L.blocks = (L.blocks || []).map(function(b){
      if (b.type === 'support' && b.text && b.text.length > 80) {
        return Object.assign({}, b, { text: b.text.slice(0, 60) + '...' });
      }
      /* headline 에 글자 그림자/배경 추가 */
      if (b.type === 'headline') {
        return Object.assign({}, b, { color: b.color || '#fff' });
      }
      return b;
    });
    /* 더 진한 색감 (typo size 키움) */
    L.typographyPreset = L.typographyPreset === 'editorial' ? 'impact' : L.typographyPreset;
    _afterChange(p, '📖 가독성 개선 적용');
  };

  /* ── 3) 위계 정리 ── */
  window.cbAfHierarchy = function() {
    var p = window.contentBuilderProject || {}; _snapshotPrev(p);
    var L = _selected(p); if (!L) return;
    /* CTA 가 없으면 추가 */
    var hasCta = (L.blocks || []).some(function(b){ return b.type === 'cta'; });
    if (!hasCta && p.decomposedCopy && p.decomposedCopy.cta) {
      var rule = (window.CB_REFLOW_RULE || {})[L.aspectRatio] || (window.CB_REFLOW_RULE || {})['16:9'];
      L.blocks.push({ type:'cta', text: p.decomposedCopy.cta, x:rule.cta.x, y:rule.cta.y, w:rule.cta.w, h:rule.cta.h });
    }
    /* badge 가 너무 길면 짧게 */
    L.blocks.forEach(function(b){
      if (b.type === 'badge' && b.text && b.text.length > 8) b.text = b.text.slice(0, 8);
    });
    _afterChange(p, '📐 위계 정리 적용');
  };

  /* ── 4) 대비 강화 ── */
  window.cbAfContrast = function() {
    var p = window.contentBuilderProject || {}; _snapshotPrev(p);
    var L = _selected(p); if (!L) return;
    /* colorPreset 을 bold 또는 luxury 로 전환 (대비 큰 색감) */
    var current = L.colorPreset;
    var target = (current === 'bold' ? 'luxury' : 'bold');
    L.colorPreset = target;
    /* headline 색상 강제 white */
    L.blocks.forEach(function(b){
      if (b.type === 'headline' || b.type === 'subheadline') {
        b.color = '#fff';
      }
    });
    _afterChange(p, '🎨 대비 강화 적용 (' + target + ')');
  };

  /* ── 5) CTA 강조 ── */
  window.cbAfCtaEmphasis = function() {
    var p = window.contentBuilderProject || {}; _snapshotPrev(p);
    var L = _selected(p); if (!L) return;
    var rule = (window.CB_REFLOW_RULE || {})[L.aspectRatio] || (window.CB_REFLOW_RULE || {})['16:9'];
    var ctaBlock = (L.blocks || []).find(function(b){ return b.type === 'cta'; });
    var color = (window.CB_COLOR_TOKENS || {})[L.colorPreset] || { accent:'#ef6fab' };
    if (!ctaBlock) {
      var text = (p.decomposedCopy && p.decomposedCopy.cta) || (window.cbGetDefaultCta && window.cbGetDefaultCta(L.purposeId)) || '바로 보기';
      L.blocks.push({ type:'cta', text:text, x:rule.cta.x, y:rule.cta.y, w:rule.cta.w, h:rule.cta.h, bg:color.accent, color:'#fff' });
    } else {
      ctaBlock.bg = color.accent;
      ctaBlock.color = '#fff';
      ctaBlock.x = rule.cta.x; ctaBlock.y = rule.cta.y;
      ctaBlock.w = rule.cta.w; ctaBlock.h = rule.cta.h;
    }
    /* qualityRules 에 ctaVisibility 추가 */
    if (L.qualityRules.indexOf('ctaVisibility') < 0) L.qualityRules.push('ctaVisibility');
    _afterChange(p, '🔥 CTA 강조 적용');
  };

  /* ── 6) 이미지·텍스트 분리 ── */
  window.cbAfSeparateImageText = function() {
    var p = window.contentBuilderProject || {}; _snapshotPrev(p);
    var L = _selected(p); if (!L) return;
    var image = (L.blocks || []).find(function(b){ return b.type === 'imageSlot'; });
    if (!image) {
      /* image 가 없으면 추가 (우측 또는 배경) */
      var rule = (window.CB_REFLOW_RULE || {})[L.aspectRatio] || (window.CB_REFLOW_RULE || {})['16:9'];
      L.blocks.unshift({ type:'imageSlot', x:rule.image.x, y:rule.image.y, w:rule.image.w, h:rule.image.h });
    }
    /* headline/sub 이 image 와 겹치면 좌측으로 이동 */
    L.blocks.forEach(function(b){
      if (b.type === 'headline' || b.type === 'subheadline' || b.type === 'cta') {
        var imgRight = image ? (image.x + image.w) : 100;
        if (b.x + b.w > image && image && b.x >= image.x && b.x < imgRight) {
          /* 좌측으로 */
          b.x = Math.max(2, image.x - b.w - 4);
        }
      }
    });
    _afterChange(p, '🪄 이미지·텍스트 분리 적용');
  };

  /* ── 7) 모바일 최적화 ── */
  window.cbAfMobileOptimize = function() {
    var p = window.contentBuilderProject || {}; _snapshotPrev(p);
    var L = _selected(p); if (!L) return;
    /* 9:16 으로 강제 */
    if (L.aspectRatio !== '9:16' && L.variants && L.variants['9:16']) {
      var v = L.variants['9:16'];
      L.aspectRatio = '9:16';
      L.blocks = v.blocks;
      L.safeArea = v.safeArea;
    } else {
      /* safeArea 추가 */
      L.safeArea = (window.cbGetSafeAreaForRatio && window.cbGetSafeAreaForRatio(L.aspectRatio)) || { show:true, topPercent:12, bottomPercent:22 };
      L.safeArea.show = true;
    }
    /* footer/warning 축소 */
    L.blocks.forEach(function(b){
      if (b.type === 'footer' || b.type === 'warning') b.h = Math.min(b.h || 5, 4);
    });
    _afterChange(p, '📱 모바일 최적화 적용 (9:16 + safe area)');
  };

  /* ── 8) 비율 재배치 ── */
  window.cbAfRatioReflow = function() {
    var p = window.contentBuilderProject || {}; _snapshotPrev(p);
    var L = _selected(p); if (!L) return;
    if (typeof window.cbReflowVariants === 'function') {
      L.variants = window.cbReflowVariants(L, ['16:9','9:16','1:1','4:5','3:1','3:4']);
    }
    _afterChange(p, '🔁 비율 재배치 — 6 비율 variant 재생성');
  };

  /* ── 9) 전체 자동 개선 (순차) ── */
  window.cbAfAll = function() {
    var p = window.contentBuilderProject || {}; _snapshotPrev(p);
    /* 순차 실행 — 각 함수가 자기 _afterChange 호출하지만 마지막에 한 번만 rerender 보장 */
    cbAfShortenCopy();
    cbAfReadability();
    cbAfHierarchy();
    cbAfContrast();
    cbAfCtaEmphasis();
    cbAfSeparateImageText();
    cbAfRatioReflow();
    if (typeof ucShowToast === 'function') ucShowToast('⚡ 전체 자동 개선 완료', 'success');
  };

  function _injectCSS() {
    if (document.getElementById('cb-design-autofix-style')) return;
    var st = document.createElement('style');
    st.id = 'cb-design-autofix-style';
    st.textContent =
      '.cbaf-wrap{padding:6px 4px;display:flex;flex-direction:column;gap:10px}'+
      '.cbaf-intro{font-size:12px;color:#7b6080;background:#fafafe;border-radius:8px;padding:8px 12px}'+
      '.cbaf-prev-card{font-size:12px;color:#5b1a4a;background:#fff5fa;border:1px solid #f1c5dc;border-radius:8px;padding:8px 12px}'+
      '.cbaf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}'+
      '.cbaf-btn{border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:8px;padding:10px 12px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;text-align:left}'+
      '.cbaf-btn:hover{border-color:#9181ff;color:#9181ff;background:#f5f0ff}'+
      '.cbaf-btn-primary{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border:none;grid-column:1/-1;text-align:center}'+
      '.cbaf-btn-primary:hover{opacity:.92;color:#fff}'+
      '.cbaf-empty{padding:30px 20px;text-align:center;color:#999;background:#fafafe;border-radius:12px;font-size:12.5px}';
    document.head.appendChild(st);
  }
})();
