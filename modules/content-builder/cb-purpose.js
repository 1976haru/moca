/* ================================================
   modules/content-builder/cb-purpose.js
   콘텐츠 빌더 — 탭 1 "목적 선택"
   * 결과물 중심: 사용자가 무엇을 만들지 먼저 고름
   * 카드 클릭 → "예시 보기"(t2) 또는 "바로 시작"(t3 블록)
   ================================================ */
(function(){
  'use strict';

  /* ── 10 목적 프리셋 ── */
  const PURPOSES = [
    { id:'youtube-thumb', icon:'🎬', label:'유튜브 썸네일',
      desc:'클릭률 높이는 16:9 썸네일',
      ratio:'16:9', use:['유튜브','쇼츠 외 영상'],
      tips:['강한 headline','큰 피사체','고대비'],
      sample:'linear-gradient(135deg,#ff6b6b,#ffa502)' },
    { id:'shorts-cover', icon:'📱', label:'쇼츠 커버',
      desc:'9:16 세로형 첫 프레임',
      ratio:'9:16', use:['쇼츠','릴스','틱톡'],
      tips:['짧은 headline','중앙 피사체','자막 안전영역'],
      sample:'linear-gradient(135deg,#a55eea,#778beb)' },
    { id:'card-news', icon:'📰', label:'카드뉴스',
      desc:'4:5 또는 1:1 정보 전달 카드',
      ratio:'4:5', use:['인스타','네이버 블로그','뉴스'],
      tips:['정보 위계','짧은 단락','시각적 흐름'],
      sample:'linear-gradient(135deg,#4ecdc4,#556270)' },
    { id:'insta-feed', icon:'📷', label:'인스타 피드',
      desc:'1:1 정사각 감성형',
      ratio:'1:1', use:['인스타그램','감성 채널'],
      tips:['브랜드 색감','대표 이미지','짧은 태그'],
      sample:'linear-gradient(135deg,#ec79bf,#ffafbd)' },
    { id:'blog-cover', icon:'✍️', label:'블로그 대표 이미지',
      desc:'16:9 글 첫인상',
      ratio:'16:9', use:['네이버/티스토리','뉴스레터'],
      tips:['깔끔한 타이포','주제 시각화','중간 톤'],
      sample:'linear-gradient(135deg,#8e2de2,#4a00e0)' },
    { id:'detail-banner', icon:'🛍', label:'상세페이지 배너',
      desc:'스마트스토어/쿠팡 상단 배너',
      ratio:'16:9', use:['쇼핑몰','상세페이지'],
      tips:['혜택 강조','가격/할인','신뢰감'],
      sample:'linear-gradient(135deg,#11998e,#38ef7d)' },
    { id:'smb-promo', icon:'🏪', label:'소상공인 홍보 배너',
      desc:'음식점·미용실·공방 홍보용',
      ratio:'1:1', use:['SNS','매장 게시','전단'],
      tips:['혜택 강조','상품/매장','강한 CTA'],
      sample:'linear-gradient(135deg,#f12711,#f5af19)' },
    { id:'public-card', icon:'🏛', label:'공공기관 안내 카드',
      desc:'민원·공지·홍보 카드',
      ratio:'4:5', use:['시청','구청','공공 SNS'],
      tips:['신뢰감 색상','정보 위계','자극 최소'],
      sample:'linear-gradient(135deg,#1c92d2,#f2fcfe)' },
    { id:'newsletter', icon:'📧', label:'뉴스레터 커버',
      desc:'메일 헤더·발행물 표지',
      ratio:'16:9', use:['이메일 마케팅','구독자 모집'],
      tips:['브랜드 톤','이슈 강조','짧은 카피'],
      sample:'linear-gradient(135deg,#fdc830,#f37335)' },
    { id:'ebook-cover', icon:'📖', label:'전자책 표지',
      desc:'세로 6:9 책 표지',
      ratio:'9:16', use:['리디북스','크몽','PDF'],
      tips:['제목 가독성','저자/부제','분야 색감'],
      sample:'linear-gradient(135deg,#283c86,#45a247)' },
  ];
  window.CB_PURPOSES = PURPOSES;

  /* ── purpose 메타 조회 ── */
  function getPurposeMeta(id) {
    return PURPOSES.find(function(p){ return p.id === id; }) || null;
  }
  window.cbGetPurposeMeta = getPurposeMeta;

  /* ════════════════════════════════════════════════
     탭 1 — 목적 선택
     ════════════════════════════════════════════════ */
  window.cbRenderTab1Purpose = function(p) {
    p = p || (window.contentBuilderProject || {});
    var selected = (p.examples && p.examples.selectedPurpose) || '';
    _injectCSS();

    var cardsHtml = PURPOSES.map(function(pu){
      var on = (selected === pu.id);
      return '<div class="cbp-card' + (on?' on':'') + '" data-purpose="' + pu.id + '">' +
        '<div class="cbp-thumb" style="background:' + pu.sample + '">' +
          '<span class="cbp-thumb-ico">' + pu.icon + '</span>' +
          '<span class="cbp-thumb-ratio">' + pu.ratio + '</span>' +
        '</div>' +
        '<div class="cbp-meta">' +
          '<div class="cbp-label">' + pu.label + '</div>' +
          '<div class="cbp-desc">' + pu.desc + '</div>' +
          '<div class="cbp-tags">' + pu.use.map(function(u){ return '<span>'+u+'</span>'; }).join('') + '</div>' +
          '<div class="cbp-tips">' + pu.tips.map(function(t){ return '✓ '+t; }).join(' · ') + '</div>' +
        '</div>' +
        '<div class="cbp-actions" onclick="event.stopPropagation()">' +
          '<button class="cbp-btn-secondary" onclick="cbSelectPurpose(\'' + pu.id + '\',true)">예시 보기 →</button>' +
          '<button class="cbp-btn-primary"   onclick="cbSelectPurpose(\'' + pu.id + '\',false)">바로 시작</button>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="cbp-wrap">' +
      '<div class="cbp-intro">' +
        '<h3>🎯 무엇을 만들고 싶으세요?</h3>' +
        '<p>먼저 결과물을 고른 뒤 <b>예시 갤러리</b>에서 마음에 드는 스타일을 선택하면, 블록·디자인 보드가 그 예시 기준으로 자동 세팅됩니다.</p>' +
      '</div>' +
      '<div class="cbp-grid">' + cardsHtml + '</div>' +
      (selected ? '<div class="cbp-selected-bar">선택됨: <b>' + (getPurposeMeta(selected)||{label:selected}).label +
        '</b> <button class="cbp-btn-tab" onclick="cbGotoTab(\'t2\')">다음 → 예시 갤러리</button></div>' : '') +
    '</div>';
  };

  /* ── 목적 선택 핸들러 ── */
  window.cbSelectPurpose = function(id, goExamples) {
    var p = window.contentBuilderProject = window.contentBuilderProject || (window.cbNewProject ? window.cbNewProject() : {});
    p.examples = p.examples || {};
    p.examples.selectedPurpose  = id;
    /* 선택만으로 비율 등 기본값 자동 세팅 (예시 미선택 시 fallback) */
    var meta = getPurposeMeta(id);
    if (meta) {
      p.examples.initialPreset = p.examples.initialPreset || {};
      p.examples.initialPreset.aspectRatio = meta.ratio;
      p.examples.initialPreset.useTips     = meta.tips;
    }
    if (typeof window.cbSave === 'function') window.cbSave();
    /* 갤러리로 이동 또는 블록으로 바로 */
    if (typeof window.cbGotoTab === 'function') {
      window.cbGotoTab(goExamples ? 't2' : 't3');
    }
  };

  /* ── CSS ── */
  function _injectCSS() {
    if (document.getElementById('cb-purpose-style')) return;
    var st = document.createElement('style');
    st.id = 'cb-purpose-style';
    st.textContent =
      '.cbp-wrap{padding:6px 4px}'+
      '.cbp-intro{margin-bottom:18px}'+
      '.cbp-intro h3{margin:0 0 6px;font-size:18px;font-weight:900;color:#2b2430}'+
      '.cbp-intro p{margin:0;font-size:13px;color:#7b6080;line-height:1.6}'+
      '.cbp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}'+
      '.cbp-card{background:#fff;border:1.5px solid #ece6f5;border-radius:14px;overflow:hidden;'+
        'cursor:pointer;transition:.14s;display:flex;flex-direction:column}'+
      '.cbp-card:hover{transform:translateY(-2px);border-color:#9181ff;box-shadow:0 6px 18px rgba(145,129,255,.18)}'+
      '.cbp-card.on{border-color:#ef6fab;box-shadow:0 4px 14px rgba(239,111,171,.25)}'+
      '.cbp-thumb{position:relative;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center}'+
      '.cbp-thumb-ico{font-size:42px;filter:drop-shadow(0 2px 6px rgba(0,0,0,.25))}'+
      '.cbp-thumb-ratio{position:absolute;top:8px;right:8px;background:rgba(0,0,0,.45);color:#fff;'+
        'padding:2px 9px;border-radius:999px;font-size:10.5px;font-weight:800}'+
      '.cbp-meta{padding:12px 14px 8px;flex:1}'+
      '.cbp-label{font-size:14px;font-weight:900;color:#2b2430}'+
      '.cbp-desc{font-size:12px;color:#7b6080;margin-top:3px;line-height:1.5}'+
      '.cbp-tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}'+
      '.cbp-tags span{background:#f5f0ff;color:#5a4a8a;padding:2px 7px;border-radius:6px;font-size:10.5px;font-weight:700}'+
      '.cbp-tips{margin-top:6px;font-size:11px;color:#5a4a56;line-height:1.5}'+
      '.cbp-actions{display:flex;gap:6px;padding:10px 14px}'+
      '.cbp-btn-secondary{flex:1;border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;'+
        'border-radius:10px;padding:7px 10px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit}'+
      '.cbp-btn-secondary:hover{border-color:#9181ff;color:#9181ff}'+
      '.cbp-btn-primary{flex:1;border:none;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;'+
        'border-radius:10px;padding:7px 10px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit}'+
      '.cbp-btn-primary:hover{opacity:.92}'+
      '.cbp-selected-bar{margin-top:14px;background:#fff5fa;border:1px solid #f1c5dc;border-radius:10px;'+
        'padding:10px 14px;font-size:12.5px;color:#5b1a4a;display:flex;align-items:center;gap:10px}'+
      '.cbp-btn-tab{margin-left:auto;border:none;background:#ef6fab;color:#fff;border-radius:999px;'+
        'padding:6px 14px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit}';
    document.head.appendChild(st);
  }
})();
