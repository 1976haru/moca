/* ================================================
   modules/content-builder/cb-purpose-cards.js
   콘텐츠 빌더 1/3 — 목적 선택 탭 (12 카드 + 8 카테고리 필터)
   * cb-purpose-presets.js 의 PURPOSE_PRESETS / CATEGORY_MAP 를 사용
   * UI 데이터(설명/추천용도/예시문구)는 이 파일에 보관 (컴팩트)
   ================================================ */
(function(){
  'use strict';

  /* ── 카드 표시 데이터 (preset 와 별도) ── */
  const CARD_TEXT = {
    'youtube-thumb': { desc:'클릭을 부르는 16:9 대표 이미지',
      uses:['강의','리뷰','정보 콘텐츠','수익화 영상','롱폼 영상'],
      sample:'50대가 모르면 손해 보는 건강 습관',
      gradient:'linear-gradient(135deg,#ff6b6b,#ffa502)' },
    'shorts-cover':  { desc:'첫 1초에 멈춰 보게 만드는 세로형 화면',
      uses:['유튜브 쇼츠','릴스','틱톡','짧은 정보 영상'],
      sample:'60대가 가장 후회하는 것',
      gradient:'linear-gradient(135deg,#a55eea,#778beb)' },
    'card-news':     { desc:'정보를 한 장씩 이해하기 쉽게 정리',
      uses:['정책 안내','건강 정보','금융 정보','교육 자료'],
      sample:'노후 준비 체크리스트 5가지',
      gradient:'linear-gradient(135deg,#4ecdc4,#556270)' },
    'smb-promo':     { desc:'가게 소식과 이벤트를 바로 홍보물로 제작',
      uses:['카페','음식점','미용실','학원','헬스장','병원'],
      sample:'첫 방문 고객 20% 할인',
      gradient:'linear-gradient(135deg,#f12711,#f5af19)' },
    'event-banner':  { desc:'할인·혜택·신청을 한눈에 보이게',
      uses:['프로모션','할인 행사','모집 공고','예약 유도'],
      sample:'오늘 신청하면 무료 체험',
      gradient:'linear-gradient(135deg,#fdc830,#f37335)' },
    'blog-cover':    { desc:'글의 전문성과 클릭률을 높이는 대표 이미지',
      uses:['네이버 블로그','티스토리','브런치','정보성 글'],
      sample:'건강검진 항목, 30대는 무엇을 봐야 할까?',
      gradient:'linear-gradient(135deg,#8e2de2,#4a00e0)' },
    'public-card':   { desc:'정확하고 신뢰감 있게 정보를 전달',
      uses:['정책 안내','민원 안내','행사 공지','안전 수칙'],
      sample:'2025년 청년 지원사업 안내',
      gradient:'linear-gradient(135deg,#1c92d2,#f2fcfe)' },
    'ebook-cover':   { desc:'제목과 주제가 선명한 디지털 책 표지',
      uses:['PDF 전자책','리포트','노하우북','강의자료'],
      sample:'초보자를 위한 AI 자동화 입문',
      gradient:'linear-gradient(135deg,#283c86,#45a247)' },
    'newsletter':    { desc:'메일을 열고 싶게 만드는 상단 이미지',
      uses:['이메일 뉴스레터','구독형 콘텐츠','정책 소식'],
      sample:'이번 주 AI 트렌드 요약',
      gradient:'linear-gradient(135deg,#fdc830,#f37335)' },
    'detail-banner': { desc:'상품의 장점을 첫 화면에서 강하게 전달',
      uses:['상품 판매 페이지','서비스 소개','강의 판매'],
      sample:'하루 10분으로 배우는 AI 자동화',
      gradient:'linear-gradient(135deg,#11998e,#38ef7d)' },
    'sns-promo':     { desc:'인스타·페이스북·스레드에 바로 올리는 홍보물',
      uses:['짧은 공지','이벤트','신제품','콘텐츠 홍보'],
      sample:'오늘만 무료 공개',
      gradient:'linear-gradient(135deg,#ec79bf,#ffafbd)' },
    'review-card':   { desc:'고객 반응을 신뢰감 있는 이미지로 변환',
      uses:['소상공인 후기','강의 후기','제품 리뷰'],
      sample:'처음 왔는데 너무 친절했어요',
      gradient:'linear-gradient(135deg,#fff5e6,#f5af19)' },
  };
  window.CB_PURPOSE_CARD_TEXT = CARD_TEXT;

  /* ════════════════════════════════════════════════
     탭 — 목적 선택
     ════════════════════════════════════════════════ */
  window.cbRenderTabPurpose = function(p) {
    p = p || (window.contentBuilderProject || {});
    p.purposeFlow = p.purposeFlow || { selectedCategory:'all', selectedPurpose:'' };
    var selCat = p.purposeFlow.selectedCategory || 'all';
    var selPur = p.purposeFlow.selectedPurpose  || '';
    _injectCSS();

    /* 카테고리 필터 */
    var catLabels = window.CB_CATEGORY_LABELS || {};
    var filterHtml = Object.keys(catLabels).map(function(catId){
      var on = (selCat === catId);
      return '<button class="cbpc-filter' + (on?' on':'') + '" onclick="cbSetPurposeCategory(\'' + catId + '\')">' +
        catLabels[catId] + '</button>';
    }).join('');

    /* 카드 */
    var purposes = (typeof window.cbGetCategoryPurposes === 'function')
      ? window.cbGetCategoryPurposes(selCat) : [];
    var cardsHtml = purposes.map(function(pu){
      var ct = CARD_TEXT[pu.id] || {};
      var on = (selPur === pu.id);
      var ratios = (pu.ratios || []).join(' / ');
      return '<div class="cbpc-card' + (on?' on':'') + '">' +
        '<div class="cbpc-thumb" style="background:' + (ct.gradient || '#ddd') + '">' +
          '<span class="cbpc-thumb-ico">' + pu.icon + '</span>' +
          '<span class="cbpc-thumb-ratio">' + ratios + '</span>' +
          (pu.beginnerRecommended ? '<span class="cbpc-badge-new">초보자 추천</span>' : '') +
        '</div>' +
        '<div class="cbpc-meta">' +
          '<div class="cbpc-label">' + _esc(pu.label) + '</div>' +
          '<div class="cbpc-desc">' + _esc(ct.desc || '') + '</div>' +
          '<div class="cbpc-uses">추천: ' + _esc((ct.uses||[]).slice(0,3).join(' · ')) + '</div>' +
          '<div class="cbpc-sample">예시 문구 — ' + _esc(ct.sample || '') + '</div>' +
        '</div>' +
        '<div class="cbpc-actions">' +
          '<button class="cbpc-btn-secondary" onclick="cbStartPurpose(\'' + pu.id + '\',true)" title="2/3 단계에서 본격 구현">예시 보기 (준비중)</button>' +
          '<button class="cbpc-btn-primary"   onclick="cbStartPurpose(\'' + pu.id + '\',false)">바로 시작</button>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="cbpc-wrap">' +
      '<div class="cbpc-intro">' +
        '<h3>🎯 무엇을 만들까요?</h3>' +
        '<p>원하는 결과물을 고르면, 예시와 레이아웃을 보고 바로 시작할 수 있어요.</p>' +
        '<p class="cbpc-intro-sub">처음이라면 ⭐ <b>초보자 추천</b> 배지가 붙은 목적부터 시작해보세요.</p>' +
      '</div>' +
      '<div class="cbpc-filter-row">' + filterHtml + '</div>' +
      '<div class="cbpc-grid">' + cardsHtml + '</div>' +
      (selPur ? '<div class="cbpc-selected-bar">현재 선택: <b>' +
        _esc((window.cbGetPurposePreset && window.cbGetPurposePreset(selPur)||{label:selPur}).label) +
        '</b><button class="cbpc-btn-tab" onclick="cbGotoTab(\'design-board\')">다음 → AI 디자인 보드</button></div>' : '') +
    '</div>';
  };

  /* ── 카테고리 변경 ── */
  window.cbSetPurposeCategory = function(catId) {
    var p = window.contentBuilderProject = window.contentBuilderProject || (window.cbNewProject ? window.cbNewProject() : {});
    p.purposeFlow = p.purposeFlow || {};
    p.purposeFlow.selectedCategory = catId || 'all';
    if (typeof window.cbSave === 'function') window.cbSave();
    if (typeof window.cbGotoTab === 'function') window.cbGotoTab('purpose');
  };

  /* ── 목적 시작 — preset 적용 + design-board 이동 ── */
  window.cbStartPurpose = function(purposeId, openExamples) {
    var preset = (typeof window.cbGetPurposePreset === 'function') ? window.cbGetPurposePreset(purposeId) : null;
    if (!preset) return;
    var p = window.contentBuilderProject = window.contentBuilderProject || (window.cbNewProject ? window.cbNewProject() : {});
    p.purposeFlow = p.purposeFlow || {};
    p.purposeFlow.selectedPurpose = purposeId;
    p.purposeFlow.aspectRatio     = preset.aspectRatio;
    p.purposeFlow.qualityRules    = preset.qualityRules || [];
    p.purposeFlow.layoutPresetGroup = preset.layoutPresetGroup;
    p.purposeFlow.defaultCta      = preset.defaultCta;
    p.purposeFlow.copyStructure   = preset.copyStructure || [];
    /* designBoard 초기값 미러링 — 2/3 단계에서 본격 사용 */
    p.designBoard = Object.assign({}, p.designBoard || {}, {
      purposeId:        purposeId,
      aspectRatio:      preset.aspectRatio,
      qualityRules:     preset.qualityRules || [],
      layoutPresetGroup:preset.layoutPresetGroup,
      defaultCta:       preset.defaultCta,
      copyStructure:    preset.copyStructure || [],
    });
    /* localStorage flow snapshot */
    try {
      localStorage.setItem('moca_content_builder_purpose_flow_v1',
        JSON.stringify(p.purposeFlow));
    } catch(_) {}
    if (typeof window.cbSave === 'function') window.cbSave();
    /* 2/3에서 예시 갤러리 본격 구현 — 현재는 design-board 로 바로 이동 */
    if (typeof window.cbGotoTab === 'function') {
      window.cbGotoTab('design-board');
    }
    if (typeof ucShowToast === 'function') {
      ucShowToast('✅ "' + preset.label + '" 시작 — ' + preset.aspectRatio, 'success');
    }
  };

  function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  /* ── CSS ── */
  function _injectCSS() {
    if (document.getElementById('cb-purpose-cards-style')) return;
    var st = document.createElement('style');
    st.id = 'cb-purpose-cards-style';
    st.textContent =
      '.cbpc-wrap{padding:6px 4px}'+
      '.cbpc-intro{margin-bottom:14px}'+
      '.cbpc-intro h3{margin:0 0 4px;font-size:18px;font-weight:900;color:#2b2430}'+
      '.cbpc-intro p{margin:0;font-size:13px;color:#7b6080;line-height:1.6}'+
      '.cbpc-intro-sub{font-size:12px !important;color:#9181ff !important;margin-top:4px !important}'+
      '.cbpc-filter-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;'+
        'padding:8px;background:#fafafe;border-radius:12px;border:1px solid #ece6f5}'+
      '.cbpc-filter{padding:6px 12px;border:1.5px solid transparent;background:transparent;'+
        'color:#7b6080;border-radius:999px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:.12s}'+
      '.cbpc-filter:hover{background:#f5f0ff;color:#9181ff}'+
      '.cbpc-filter.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}'+
      '.cbpc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}'+
      '.cbpc-card{background:#fff;border:1.5px solid #ece6f5;border-radius:14px;overflow:hidden;'+
        'display:flex;flex-direction:column;transition:.14s}'+
      '.cbpc-card:hover{transform:translateY(-2px);border-color:#9181ff;box-shadow:0 6px 18px rgba(145,129,255,.18)}'+
      '.cbpc-card.on{border-color:#ef6fab;box-shadow:0 4px 14px rgba(239,111,171,.25)}'+
      '.cbpc-thumb{position:relative;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center}'+
      '.cbpc-thumb-ico{font-size:42px;filter:drop-shadow(0 2px 6px rgba(0,0,0,.25))}'+
      '.cbpc-thumb-ratio{position:absolute;top:8px;right:8px;background:rgba(0,0,0,.45);color:#fff;'+
        'padding:2px 9px;border-radius:999px;font-size:10.5px;font-weight:800}'+
      '.cbpc-badge-new{position:absolute;top:8px;left:8px;background:#fde047;color:#5b1a4a;'+
        'padding:2px 9px;border-radius:999px;font-size:10px;font-weight:900}'+
      '.cbpc-meta{padding:10px 14px 6px;flex:1}'+
      '.cbpc-label{font-size:14px;font-weight:900;color:#2b2430}'+
      '.cbpc-desc{font-size:12px;color:#7b6080;margin-top:3px;line-height:1.5}'+
      '.cbpc-uses{font-size:11px;color:#5a4a8a;margin-top:5px;line-height:1.5}'+
      '.cbpc-sample{font-size:11px;color:#7b6080;margin-top:4px;font-style:italic;line-height:1.5}'+
      '.cbpc-actions{display:flex;gap:6px;padding:10px 14px}'+
      '.cbpc-btn-secondary{flex:1;border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#7b6080;'+
        'border-radius:10px;padding:7px 10px;font-size:11.5px;font-weight:700;cursor:not-allowed;font-family:inherit;opacity:.7}'+
      '.cbpc-btn-primary{flex:1;border:none;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;'+
        'border-radius:10px;padding:7px 10px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit}'+
      '.cbpc-btn-primary:hover{opacity:.92}'+
      '.cbpc-selected-bar{margin-top:14px;background:#fff5fa;border:1px solid #f1c5dc;border-radius:10px;'+
        'padding:10px 14px;font-size:12.5px;color:#5b1a4a;display:flex;align-items:center;gap:10px}'+
      '.cbpc-btn-tab{margin-left:auto;border:none;background:#ef6fab;color:#fff;border-radius:999px;'+
        'padding:6px 14px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit}';
    document.head.appendChild(st);
  }
})();
