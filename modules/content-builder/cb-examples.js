/* ================================================
   modules/content-builder/cb-examples.js
   콘텐츠 빌더 — 탭 2 "예시 갤러리"
   * 목적별 6~8 예시 카드 + 시작 프리셋 자동 적용
   * 선택 시 layoutPreset/colorPreset/typographyPreset 등이
     CONTENT_BUILDER state 에 저장됨 → AI 디자인 보드 초기값
   ================================================ */
(function(){
  'use strict';

  /* ── 색상 프리셋 (예시 카드 미리보기 + AI 디자인 보드 초기값) ── */
  const COLOR_PRESETS = {
    bold:        { bg:'#1a1a2e', fg:'#fff',    accent:'#ef6fab' },
    warm:        { bg:'#fff5e6', fg:'#5b1a4a', accent:'#f5af19' },
    pastel:      { bg:'#fff5fa', fg:'#5b1a4a', accent:'#9181ff' },
    trust:       { bg:'#eef5ff', fg:'#1a3a5b', accent:'#2b66c4' },
    nature:      { bg:'#effbf7', fg:'#1a3a2b', accent:'#27ae60' },
    luxury:      { bg:'#0f0a1f', fg:'#f5e6c8', accent:'#c8a55a' },
    youth:       { bg:'#fff',    fg:'#2b2430', accent:'#ff6b6b' },
    public:      { bg:'#f4f6fa', fg:'#1c2a3e', accent:'#1c92d2' },
    food:        { bg:'#fff8e6', fg:'#5b2e1a', accent:'#f12711' },
    quiet:       { bg:'#fafafe', fg:'#3a3040', accent:'#778beb' },
  };
  window.CB_COLOR_PRESETS = COLOR_PRESETS;

  /* ── 타이포 위계 프리셋 ── */
  const TYPO_PRESETS = {
    impact:    { hSize:64, sSize:24, family:'NotoSansKR', weight:900, hLine:1.1 },
    editorial: { hSize:42, sSize:18, family:'NotoSerifKR', weight:700, hLine:1.3 },
    casual:    { hSize:36, sSize:16, family:'NotoSansKR', weight:700, hLine:1.4 },
    formal:    { hSize:38, sSize:16, family:'NotoSansKR', weight:600, hLine:1.4 },
    cute:      { hSize:34, sSize:14, family:'NotoSansKR', weight:800, hLine:1.3 },
  };
  window.CB_TYPO_PRESETS = TYPO_PRESETS;

  /* ── 레이아웃 프리셋 ── */
  const LAYOUT_PRESETS = {
    centerStack:    { headlinePos:'center',  ctaPos:'bottom-center', subjectPos:'center'      },
    leftHeadline:   { headlinePos:'top-left',ctaPos:'bottom-left',   subjectPos:'right'       },
    bottomCaption:  { headlinePos:'bottom',  ctaPos:'bottom',        subjectPos:'top-center'  },
    splitAB:        { headlinePos:'top',     ctaPos:'bottom-center', subjectPos:'split-2col'  },
    bigPriceTag:    { headlinePos:'top',     ctaPos:'bottom',        subjectPos:'left',       extras:['priceTag'] },
    infoLadder:     { headlinePos:'top',     ctaPos:'none',          subjectPos:'right-grid', extras:['ladder'] },
  };
  window.CB_LAYOUT_PRESETS = LAYOUT_PRESETS;

  /* ── 목적별 예시 갤러리 ── */
  const EXAMPLES = {
    'youtube-thumb': [
      { id:'yt-click',  name:'클릭 유도형',  tags:['고대비','놀람'],   color:'bold',   typo:'impact',    layout:'centerStack',
        headline:'이거 모르면 후회해요', sub:'60대 80%가 모르는 사실', cta:'영상 보기',
        sample:'linear-gradient(135deg,#ff6b6b 0%,#ff6b6b 60%,#000 60%)' },
      { id:'yt-info',   name:'정보 정리형',   tags:['깔끔','신뢰'],     color:'trust',  typo:'editorial', layout:'leftHeadline',
        headline:'2025 절세 가이드', sub:'10분 안에 핵심만 정리', cta:'요약 보기',
        sample:'linear-gradient(135deg,#1c92d2,#f2fcfe)' },
      { id:'yt-emo',    name:'감성형',        tags:['따뜻','감동'],     color:'warm',   typo:'editorial', layout:'bottomCaption',
        headline:'엄마가 했던 그 말', sub:'30년 전 그날의 기억', cta:'',
        sample:'linear-gradient(135deg,#f5af19,#f12711)' },
      { id:'yt-cmp',    name:'비교형',        tags:['A vs B','정보'],   color:'youth',  typo:'impact',    layout:'splitAB',
        headline:'A vs B 정답은?', sub:'끝까지 보면 알게 됨', cta:'결과 보기',
        sample:'linear-gradient(90deg,#ef6fab 50%,#9181ff 50%)' },
      { id:'yt-warn',   name:'경고형',        tags:['빨강','강조'],     color:'food',   typo:'impact',    layout:'centerStack',
        headline:'⚠️ 절대 하지 마세요', sub:'전문가 5명이 경고함', cta:'이유 보기',
        sample:'linear-gradient(135deg,#f12711,#ffa502)' },
      { id:'yt-rev',    name:'반전형',        tags:['궁금','놀람'],     color:'bold',   typo:'impact',    layout:'centerStack',
        headline:'끝까지 보세요', sub:'마지막에 반전 있음', cta:'',
        sample:'linear-gradient(135deg,#1a1a2e,#ef6fab)' },
    ],
    'shorts-cover': [
      { id:'sc-hook',  name:'훅 강조',  tags:['짧은 카피','중앙'],   color:'bold',   typo:'impact',  layout:'centerStack',
        headline:'3초만 보세요', sub:'', cta:'',
        sample:'linear-gradient(135deg,#a55eea,#778beb)' },
      { id:'sc-num',   name:'숫자형',    tags:['통계','강조'],         color:'trust',  typo:'impact',  layout:'centerStack',
        headline:'87%가 모르는', sub:'노후 준비 1가지', cta:'',
        sample:'linear-gradient(135deg,#2b66c4,#a55eea)' },
      { id:'sc-emo',   name:'감성 시니어', tags:['따뜻','시니어'],     color:'warm',   typo:'editorial', layout:'bottomCaption',
        headline:'그때 알았더라면', sub:'', cta:'',
        sample:'linear-gradient(135deg,#fdc830,#f37335)' },
      { id:'sc-jp',    name:'일본 감성', tags:['일본어','쇼와'],       color:'quiet',  typo:'editorial', layout:'centerStack',
        headline:'昭和の思い出', sub:'', cta:'',
        sample:'linear-gradient(135deg,#fff5fa,#a55eea)' },
      { id:'sc-list',  name:'목록형',    tags:['리스트','짧음'],       color:'pastel', typo:'casual',  layout:'centerStack',
        headline:'TOP 3', sub:'끝까지 보세요', cta:'',
        sample:'linear-gradient(135deg,#ec79bf,#ffafbd)' },
      { id:'sc-quiz',  name:'퀴즈형',    tags:['질문','참여'],         color:'youth',  typo:'impact',  layout:'centerStack',
        headline:'알면 댓글ㄱㄱ', sub:'정답은?', cta:'',
        sample:'linear-gradient(135deg,#ff6b6b,#ffa502)' },
    ],
    'card-news': [
      { id:'cn-info',   name:'정보 카드',  tags:['단계별','명확'],     color:'trust',  typo:'formal',    layout:'infoLadder',
        headline:'5단계 절세법', sub:'1. 연금계좌 2. ISA 3. 청약', cta:'전체 보기',
        sample:'linear-gradient(135deg,#eef5ff,#2b66c4 80%)' },
      { id:'cn-quote',  name:'인용형',     tags:['감성','문체'],       color:'pastel', typo:'editorial', layout:'centerStack',
        headline:'"오늘 행복하세요"', sub:'— 김유정', cta:'',
        sample:'linear-gradient(135deg,#fff5fa,#9181ff)' },
      { id:'cn-step',   name:'단계 안내',  tags:['1·2·3','순서'],      color:'public', typo:'formal',    layout:'infoLadder',
        headline:'간단 신청 절차', sub:'3단계로 끝', cta:'신청하기',
        sample:'linear-gradient(135deg,#1c92d2,#f2fcfe)' },
      { id:'cn-tips',   name:'팁 모음',    tags:['생활','작은팁'],     color:'nature', typo:'casual',    layout:'infoLadder',
        headline:'주방 꿀팁 7가지', sub:'바로 쓸 수 있어요', cta:'',
        sample:'linear-gradient(135deg,#11998e,#38ef7d)' },
      { id:'cn-vs',     name:'비교 표',    tags:['A vs B','선택'],     color:'youth',  typo:'casual',    layout:'splitAB',
        headline:'A vs B 비교', sub:'장단점 한눈에', cta:'',
        sample:'linear-gradient(90deg,#ec79bf 50%,#778beb 50%)' },
      { id:'cn-warn',   name:'주의 안내',  tags:['경고','중요'],       color:'food',   typo:'formal',    layout:'centerStack',
        headline:'⚠️ 꼭 확인하세요', sub:'서류 미비 시 반려', cta:'서류 보기',
        sample:'linear-gradient(135deg,#f5af19,#f12711)' },
    ],
    'insta-feed': [
      { id:'if-quote',  name:'한줄 명언', tags:['감성','파스텔'], color:'pastel', typo:'editorial', layout:'centerStack',
        headline:'오늘도 수고했어요', sub:'', cta:'',
        sample:'linear-gradient(135deg,#fff5fa,#ec79bf)' },
      { id:'if-photo',  name:'사진 강조', tags:['풀배경','짧은 태그'], color:'quiet', typo:'casual', layout:'bottomCaption',
        headline:'#오늘의일상', sub:'', cta:'',
        sample:'linear-gradient(135deg,#778beb,#fff)' },
      { id:'if-promo',  name:'프로모션',  tags:['혜택','강조'], color:'bold', typo:'impact', layout:'centerStack',
        headline:'팔로워 한정 30% OFF', sub:'48시간 한정', cta:'쇼핑 →',
        sample:'linear-gradient(135deg,#1a1a2e,#ef6fab)' },
      { id:'if-cute',   name:'귀여운 컷', tags:['이모지','산뜻'], color:'youth', typo:'cute', layout:'centerStack',
        headline:'주말엔 뭐하지? 🌸', sub:'', cta:'',
        sample:'linear-gradient(135deg,#ffafbd,#ffc3a0)' },
    ],
    'blog-cover': [
      { id:'bl-clean',  name:'깔끔 타이포', tags:['미니멀','블로그'], color:'quiet', typo:'editorial', layout:'leftHeadline',
        headline:'노후 준비, 지금 시작하기', sub:'10년 차 재무설계사가 알려주는 5가지', cta:'',
        sample:'linear-gradient(135deg,#fafafe,#778beb)' },
      { id:'bl-info',   name:'정보 표지',   tags:['깊이','정리'],   color:'trust', typo:'editorial', layout:'leftHeadline',
        headline:'2025 부동산 트렌드', sub:'전문가 인터뷰 정리', cta:'',
        sample:'linear-gradient(135deg,#eef5ff,#1c92d2)' },
      { id:'bl-emo',    name:'감성 표지',   tags:['따뜻','문체'],   color:'warm',  typo:'editorial', layout:'bottomCaption',
        headline:'엄마의 손편지', sub:'30년 전 오늘', cta:'',
        sample:'linear-gradient(135deg,#fdc830,#f37335)' },
      { id:'bl-tutorial',name:'튜토리얼',  tags:['가이드','단계'], color:'nature',typo:'formal',    layout:'infoLadder',
        headline:'블로그 시작 7단계', sub:'초보 → 수익화', cta:'',
        sample:'linear-gradient(135deg,#11998e,#38ef7d)' },
    ],
    'detail-banner': [
      { id:'db-disc',   name:'할인 강조', tags:['가격','한정'], color:'food',  typo:'impact', layout:'bigPriceTag',
        headline:'역대 최대 50% OFF', sub:'48시간만!', cta:'바로 구매',
        sample:'linear-gradient(135deg,#f12711,#f5af19)' },
      { id:'db-trust',  name:'신뢰형',    tags:['리뷰','보증'], color:'trust', typo:'formal', layout:'leftHeadline',
        headline:'리뷰 10만 돌파', sub:'고객 만족도 4.9', cta:'후기 보기',
        sample:'linear-gradient(135deg,#1c92d2,#eef5ff)' },
      { id:'db-new',    name:'신상품',    tags:['NEW','강조'], color:'bold', typo:'impact', layout:'centerStack',
        headline:'NEW · 한정 생산', sub:'500개만 입고', cta:'예약하기',
        sample:'linear-gradient(135deg,#1a1a2e,#ef6fab)' },
      { id:'db-bundle', name:'세트 묶음', tags:['세트','혜택'], color:'warm', typo:'impact', layout:'splitAB',
        headline:'2+1 세트 구성', sub:'개당 ₩9,900', cta:'세트 보기',
        sample:'linear-gradient(135deg,#fff5e6,#f5af19)' },
    ],
    'smb-promo': [
      { id:'sp-disc',   name:'할인형',     tags:['혜택','강조'], color:'food',   typo:'impact',  layout:'bigPriceTag',
        headline:'오픈 기념 30% OFF', sub:'4월 30일까지', cta:'예약',
        sample:'linear-gradient(135deg,#f12711,#ffa502)' },
      { id:'sp-new',    name:'신메뉴',     tags:['NEW','음식'], color:'food',   typo:'impact',  layout:'centerStack',
        headline:'신메뉴 출시 🍜', sub:'시그니처 라멘', cta:'주문하기',
        sample:'linear-gradient(135deg,#fff8e6,#f12711)' },
      { id:'sp-rev',    name:'후기 강조', tags:['별점','리뷰'], color:'trust',  typo:'casual',  layout:'leftHeadline',
        headline:'⭐ 4.9 / 리뷰 320', sub:'손님 추천 No.1', cta:'',
        sample:'linear-gradient(135deg,#eef5ff,#1c92d2)' },
      { id:'sp-loc',    name:'위치 안내', tags:['지도','신규'], color:'nature', typo:'formal',  layout:'bottomCaption',
        headline:'역에서 도보 3분', sub:'화성역 1번 출구', cta:'지도 보기',
        sample:'linear-gradient(135deg,#effbf7,#27ae60)' },
      { id:'sp-book',   name:'예약 유도', tags:['CTA','강함'], color:'bold',    typo:'impact',  layout:'centerStack',
        headline:'지금 예약하면 음료 무료', sub:'카톡 채널 +', cta:'예약하기',
        sample:'linear-gradient(135deg,#1a1a2e,#ef6fab)' },
      { id:'sp-event',  name:'시즌 이벤트', tags:['시즌','감성'], color:'warm', typo:'cute',  layout:'centerStack',
        headline:'벚꽃 시즌 한정', sub:'딸기 라떼 ₩4,900', cta:'',
        sample:'linear-gradient(135deg,#ffafbd,#ec79bf)' },
    ],
    'public-card': [
      { id:'pc-notice', name:'공지 안내',  tags:['신뢰','명확'], color:'public', typo:'formal', layout:'leftHeadline',
        headline:'민원 처리 안내', sub:'영업시간 09:00~18:00', cta:'자세히',
        sample:'linear-gradient(135deg,#f4f6fa,#1c92d2)' },
      { id:'pc-step',   name:'절차 안내',  tags:['단계','순서'], color:'public', typo:'formal', layout:'infoLadder',
        headline:'신청 4단계', sub:'1. 접수 2. 심사 3. 결정 4. 통지', cta:'신청서',
        sample:'linear-gradient(135deg,#eef5ff,#1c92d2)' },
      { id:'pc-faq',    name:'FAQ 카드',   tags:['질문','정리'], color:'public', typo:'formal', layout:'infoLadder',
        headline:'자주 묻는 질문', sub:'민원 전, 한 번 확인', cta:'',
        sample:'linear-gradient(135deg,#f4f6fa,#778beb)' },
      { id:'pc-event',  name:'행사 안내',  tags:['일정','참여'], color:'nature', typo:'formal', layout:'centerStack',
        headline:'주민 한마당 4월 28일', sub:'사전등록 무료', cta:'등록하기',
        sample:'linear-gradient(135deg,#effbf7,#27ae60)' },
    ],
    'newsletter': [
      { id:'nl-issue',  name:'이슈 헤더', tags:['이번주','중요'], color:'bold',   typo:'impact',    layout:'leftHeadline',
        headline:'이번주 핵심 5가지', sub:'#42호 · 4월 4주', cta:'전체 보기',
        sample:'linear-gradient(135deg,#1a1a2e,#ef6fab)' },
      { id:'nl-quote',  name:'명언 헤더', tags:['감성','짧음'],   color:'pastel', typo:'editorial', layout:'centerStack',
        headline:'"오늘만 잘 살아보자"', sub:'— 편집장 노트', cta:'',
        sample:'linear-gradient(135deg,#fff5fa,#9181ff)' },
      { id:'nl-promo',  name:'프로모션',   tags:['혜택','구독'],   color:'food',   typo:'impact',    layout:'centerStack',
        headline:'구독자 50% 할인', sub:'쿠폰 자동 발급', cta:'쿠폰 받기',
        sample:'linear-gradient(135deg,#fdc830,#f37335)' },
    ],
    'ebook-cover': [
      { id:'eb-formal', name:'정통 표지', tags:['신뢰','진중'],     color:'luxury', typo:'editorial', layout:'centerStack',
        headline:'노후 준비 완전정복', sub:'재무설계사 김유정', cta:'',
        sample:'linear-gradient(135deg,#0f0a1f,#c8a55a)' },
      { id:'eb-casual', name:'캐주얼',    tags:['친근','명료'],     color:'pastel', typo:'casual',    layout:'centerStack',
        headline:'블로그로 월 100', sub:'초보 가이드', cta:'',
        sample:'linear-gradient(135deg,#ec79bf,#9181ff)' },
      { id:'eb-info',   name:'전문 정보', tags:['깊이','권위'],     color:'trust',  typo:'editorial', layout:'leftHeadline',
        headline:'2025 부동산 백서', sub:'데이터로 본 시장', cta:'',
        sample:'linear-gradient(135deg,#1c92d2,#283c86)' },
    ],
  };
  window.CB_EXAMPLES = EXAMPLES;

  /* ── 예시 메타 조회 ── */
  function getExamplesForPurpose(purposeId) {
    return EXAMPLES[purposeId] || [];
  }
  function getExampleMeta(purposeId, exampleId) {
    return getExamplesForPurpose(purposeId).find(function(e){ return e.id === exampleId; }) || null;
  }
  window.cbGetExamples       = getExamplesForPurpose;
  window.cbGetExampleMeta    = getExampleMeta;

  /* ════════════════════════════════════════════════
     탭 2 — 예시 갤러리
     ════════════════════════════════════════════════ */
  window.cbRenderTab2Examples = function(p) {
    p = p || (window.contentBuilderProject || {});
    var purposeId = (p.examples && p.examples.selectedPurpose) || '';
    var meta = (typeof window.cbGetPurposeMeta === 'function') ? window.cbGetPurposeMeta(purposeId) : null;
    _injectCSS();

    if (!purposeId || !meta) {
      return '<div class="cbe-wrap">' +
        '<div class="cbe-empty">' +
          '<div class="cbe-empty-ico">🎯</div>' +
          '<div class="cbe-empty-title">먼저 목적을 선택하세요</div>' +
          '<div class="cbe-empty-sub">탭 1 "목적 선택" 에서 무엇을 만들지 고른 뒤 예시 갤러리가 표시됩니다.</div>' +
          '<button class="cbp-btn-primary" onclick="cbGotoTab(\'t1\')">목적 선택으로 가기</button>' +
        '</div>' +
      '</div>';
    }

    var examples = getExamplesForPurpose(purposeId);
    var selectedId = (p.examples && p.examples.selectedExampleId) || '';
    var cardsHtml = examples.map(function(ex){
      var on = (selectedId === ex.id);
      var color = COLOR_PRESETS[ex.color] || COLOR_PRESETS.bold;
      return '<div class="cbe-card' + (on?' on':'') + '">' +
        '<div class="cbe-thumb" style="background:' + ex.sample + '">' +
          '<div class="cbe-thumb-text" style="color:' + color.fg + '">' +
            '<div class="cbe-th-h">' + _esc(ex.headline) + '</div>' +
            (ex.sub ? '<div class="cbe-th-s">' + _esc(ex.sub) + '</div>' : '') +
            (ex.cta ? '<div class="cbe-th-cta" style="background:' + color.accent + ';color:#fff">' + _esc(ex.cta) + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="cbe-meta">' +
          '<div class="cbe-name">' + _esc(ex.name) + '</div>' +
          '<div class="cbe-tags">' + ex.tags.map(function(t){ return '<span>'+_esc(t)+'</span>'; }).join('') + '</div>' +
        '</div>' +
        '<button class="cbe-pick" onclick="cbApplyExample(\'' + purposeId + '\',\'' + ex.id + '\')">'+
          (on ? '✅ 적용됨 — 변경하기' : '이 스타일로 시작하기 →') +
        '</button>' +
      '</div>';
    }).join('');

    return '<div class="cbe-wrap">' +
      '<div class="cbe-hd">' +
        '<div>' +
          '<h3>🎨 예시 갤러리 — ' + _esc(meta.label) + '</h3>' +
          '<p>마음에 드는 스타일을 누르면 블록·디자인 보드·색감·타이포가 자동으로 세팅됩니다.</p>' +
        '</div>' +
        '<button class="cbp-btn-secondary" onclick="cbGotoTab(\'t1\')">← 목적 변경</button>' +
      '</div>' +
      '<div class="cbe-grid">' + cardsHtml + '</div>' +
      (selectedId ? '<div class="cbp-selected-bar">선택된 예시: <b>' +
        _esc((getExampleMeta(purposeId, selectedId)||{name:selectedId}).name) +
        '</b> <button class="cbp-btn-tab" onclick="cbGotoTab(\'t3\')">다음 → 블록 구성</button></div>' : '') +
    '</div>';
  };

  /* ── 예시 적용 — CONTENT_BUILDER state 업데이트 ── */
  window.cbApplyExample = function(purposeId, exampleId) {
    var p = window.contentBuilderProject = window.contentBuilderProject || (window.cbNewProject ? window.cbNewProject() : {});
    var meta = getExampleMeta(purposeId, exampleId);
    if (!meta) return;
    var purpose = (typeof window.cbGetPurposeMeta === 'function') ? window.cbGetPurposeMeta(purposeId) : null;
    var color = COLOR_PRESETS[meta.color] || COLOR_PRESETS.bold;
    var typo  = TYPO_PRESETS[meta.typo]   || TYPO_PRESETS.impact;
    var layout= LAYOUT_PRESETS[meta.layout]|| LAYOUT_PRESETS.centerStack;

    p.examples = p.examples || {};
    p.examples.selectedPurpose   = purposeId;
    p.examples.selectedExampleId = exampleId;
    p.examples.initialPreset = {
      aspectRatio:        (purpose && purpose.ratio) || '16:9',
      colorPreset:        meta.color,
      typographyPreset:   meta.typo,
      layoutPreset:       meta.layout,
      colors:             color,
      typo:               typo,
      layout:             layout,
      safeArea:           { show:true, topPercent: (purpose && purpose.ratio === '9:16') ? 12 : 5,
                                       bottomPercent: (purpose && purpose.ratio === '9:16') ? 22 : 16 },
      headline:           meta.headline,
      sub:                meta.sub,
      cta:                meta.cta,
    };
    /* 블록 자동 채움 (기존 cbBlocks 가 있으면 보존, 없으면 신규 생성) */
    p.blocks = p.blocks || [];
    if (!p.blocks.length) {
      p.blocks = [
        { type:'headline', value: meta.headline },
        meta.sub ? { type:'subhead',  value: meta.sub } : null,
        meta.cta ? { type:'cta',      value: meta.cta } : null,
      ].filter(Boolean);
    }
    /* AI 디자인 보드 초기값 */
    p.designBoard = p.designBoard || {};
    p.designBoard.layout      = meta.layout;
    p.designBoard.colorPreset = meta.color;
    p.designBoard.typoPreset  = meta.typo;
    p.designBoard.aspectRatio = (purpose && purpose.ratio) || '16:9';
    p.designBoard.headline    = meta.headline;
    p.designBoard.sub         = meta.sub;
    p.designBoard.cta         = meta.cta;
    p.designBoard.exampleId   = exampleId;

    if (typeof window.cbSave === 'function') window.cbSave();
    /* 토스트 */
    if (typeof ucShowToast === 'function') ucShowToast('✅ "' + meta.name + '" 스타일 적용됨', 'success');
    /* 블록 탭으로 자동 이동 */
    if (typeof window.cbGotoTab === 'function') window.cbGotoTab('t3');
  };

  function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  /* ── CSS ── */
  function _injectCSS() {
    if (document.getElementById('cb-examples-style')) return;
    var st = document.createElement('style');
    st.id = 'cb-examples-style';
    st.textContent =
      '.cbe-wrap{padding:6px 4px}'+
      '.cbe-hd{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap}'+
      '.cbe-hd h3{margin:0 0 4px;font-size:17px;font-weight:900;color:#2b2430}'+
      '.cbe-hd p{margin:0;font-size:12.5px;color:#7b6080}'+
      '.cbe-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}'+
      '.cbe-card{background:#fff;border:1.5px solid #ece6f5;border-radius:14px;overflow:hidden;'+
        'display:flex;flex-direction:column;transition:.14s}'+
      '.cbe-card:hover{transform:translateY(-2px);border-color:#9181ff;box-shadow:0 6px 18px rgba(145,129,255,.18)}'+
      '.cbe-card.on{border-color:#ef6fab;box-shadow:0 4px 14px rgba(239,111,171,.25)}'+
      '.cbe-thumb{position:relative;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;padding:14px}'+
      '.cbe-thumb-text{text-align:center;text-shadow:0 1px 4px rgba(0,0,0,.4);max-width:90%}'+
      '.cbe-th-h{font-size:16px;font-weight:900;line-height:1.2}'+
      '.cbe-th-s{font-size:11px;font-weight:600;margin-top:4px;opacity:.92}'+
      '.cbe-th-cta{display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;font-size:10px;font-weight:800;text-shadow:none}'+
      '.cbe-meta{padding:10px 14px;flex:1}'+
      '.cbe-name{font-size:13px;font-weight:900;color:#2b2430}'+
      '.cbe-tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}'+
      '.cbe-tags span{background:#f5f0ff;color:#5a4a8a;padding:2px 7px;border-radius:6px;font-size:10.5px;font-weight:700}'+
      '.cbe-pick{margin:0 12px 12px;border:none;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;'+
        'border-radius:10px;padding:8px 12px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit}'+
      '.cbe-pick:hover{opacity:.92}'+
      '.cbe-empty{padding:60px 20px;text-align:center;background:#fafafe;border-radius:14px;border:1px dashed #ece6f5}'+
      '.cbe-empty-ico{font-size:48px;margin-bottom:12px}'+
      '.cbe-empty-title{font-size:16px;font-weight:900;color:#2b2430;margin-bottom:4px}'+
      '.cbe-empty-sub{font-size:12.5px;color:#7b6080;margin-bottom:16px;line-height:1.6}';
    document.head.appendChild(st);
  }
})();
