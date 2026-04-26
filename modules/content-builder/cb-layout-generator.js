/* ================================================
   modules/content-builder/cb-layout-generator.js
   콘텐츠 빌더 2/3 — 4~6 디자인 시안 자동 생성
   * cbGenerateLayouts(state) → layouts[]
   * 입력: purposeFlow + decomposedCopy + selectedExample
   * 출력: 시안 객체 배열 (각 시안은 cb-design-preview 가 렌더 가능)
   ================================================ */
(function(){
  'use strict';

  /* 시안 유형 — 5종 (기본 4~5 생성, 일부 purpose 는 6) */
  const DRAFT_TYPES = [
    { id:'click',   label:'클릭 유도형',   colorPreset:'bold',    typographyPreset:'impact'    },
    { id:'info',    label:'정보 정리형',   colorPreset:'trust',   typographyPreset:'editorial' },
    { id:'emotion', label:'감성 브랜드형', colorPreset:'warm',    typographyPreset:'editorial' },
    { id:'sales',   label:'판매·전환형',   colorPreset:'food',    typographyPreset:'impact'    },
    { id:'public',  label:'공익 안내형',   colorPreset:'public',  typographyPreset:'formal'    },
    { id:'expert',  label:'전문가형',      colorPreset:'luxury',  typographyPreset:'editorial' },
  ];
  window.CB_DRAFT_TYPES = DRAFT_TYPES;

  /* purpose → 추천 시안 type 순서 */
  const PURPOSE_TYPES = {
    'youtube-thumb':  ['click','info','emotion','expert'],
    'shorts-cover':   ['click','emotion','sales','info'],
    'card-news':      ['info','public','emotion','expert'],
    'smb-promo':      ['sales','emotion','click','info'],
    'event-banner':   ['sales','click','public','info'],
    'blog-cover':     ['info','emotion','expert','public'],
    'public-card':    ['public','info','expert','emotion'],
    'ebook-cover':    ['expert','info','emotion','public'],
    'newsletter':     ['info','emotion','sales','public'],
    'detail-banner':  ['sales','expert','info','click'],
    'sns-promo':      ['emotion','sales','click','info'],
    'review-card':    ['emotion','expert','info','public'],
  };
  window.CB_PURPOSE_DRAFT_TYPES = PURPOSE_TYPES;

  /* ── 단일 시안 spec 생성 ── */
  function _buildLayoutSpec(driftType, ctx) {
    var purposeId = ctx.purposeId || 'youtube-thumb';
    var ratio     = ctx.aspectRatio || '16:9';
    var dec       = ctx.decomposedCopy || {};
    var defaultCta= ctx.defaultCta || '';
    var headline  = dec.headline || ctx.fallbackHeadline || ctx.exampleHeadline || '미리보기';
    var sub       = dec.subheadline || ctx.exampleSub || '';
    var support   = dec.support || '';
    var badge     = dec.badge   || (driftType.id === 'sales' ? '한정' : '');
    var cta       = dec.cta     || defaultCta || (driftType.id === 'click' ? '바로 보기' : '');

    /* reflow rule 사용 — cb-layout-reflow.js */
    var rule = (window.CB_REFLOW_RULE || {})[ratio] || (window.CB_REFLOW_RULE || {})['16:9'];

    /* base blocks */
    var blocks = [];
    blocks.push({ type:'background' });
    /* image slot — info 시안은 우측, emotion 은 배경, click 은 우측 */
    if (driftType.id !== 'emotion') {
      blocks.push({ type:'imageSlot', x:rule.image.x, y:rule.image.y, w:rule.image.w, h:rule.image.h });
    }
    if (badge) {
      blocks.push({ type:'badge', text:badge, x:rule.badge.x, y:rule.badge.y, w:rule.badge.w, h:rule.badge.h });
    }
    blocks.push({ type:'headline', text:headline, x:rule.headline.x, y:rule.headline.y, w:rule.headline.w });
    if (sub) {
      blocks.push({ type:'subheadline', text:sub, x:rule.sub.x, y:rule.sub.y, w:rule.sub.w });
    }
    if (support && (driftType.id === 'info' || driftType.id === 'public' || driftType.id === 'expert')) {
      blocks.push({ type:'support', text:support, x:rule.sub.x, y:rule.sub.y + 12, w:rule.sub.w });
    }
    if (cta && driftType.id !== 'emotion') {
      blocks.push({ type:'cta', text:cta, x:rule.cta.x, y:rule.cta.y, w:rule.cta.w, h:rule.cta.h });
    }
    if (rule.footer) {
      blocks.push({ type:'footer', text: ctx.footer || '@channel', x:rule.footer.x, y:rule.footer.y, w:rule.footer.w });
    }

    /* safeArea */
    var safe = (window.cbGetSafeAreaForRatio && window.cbGetSafeAreaForRatio(ratio)) || { show:true, topPercent:5, bottomPercent:12 };

    /* qualityRules — purposeFlow 기준 + driftType 보강 */
    var rules = (ctx.qualityRules || []).slice();
    if (driftType.id === 'click')   rules = _u(rules, ['ctaVisibility','strongContrast','shortHeadline']);
    if (driftType.id === 'info')    rules = _u(rules, ['clearHierarchy','copySplit','readable']);
    if (driftType.id === 'emotion') rules = _u(rules, ['warmTone','typeHierarchy','emotionalFocus']);
    if (driftType.id === 'sales')   rules = _u(rules, ['ctaVisibility','strongContrast','copySplit']);
    if (driftType.id === 'public')  rules = _u(rules, ['clearHierarchy','readable','layoutFit']);
    if (driftType.id === 'expert')  rules = _u(rules, ['typeHierarchy','readable','layoutFit']);

    var spec = {
      id:               'draft-' + driftType.id + '-' + Date.now().toString(36).slice(-4),
      type:             driftType.id,
      typeLabel:        driftType.label,
      purposeId:        purposeId,
      aspectRatio:      ratio,
      layoutPreset:     ctx.layoutPreset || ('auto_' + driftType.id),
      colorPreset:      ctx.colorPresetOverride || driftType.colorPreset,
      typographyPreset: ctx.typographyPresetOverride || driftType.typographyPreset,
      qualityRules:     rules,
      safeArea:         safe,
      blocks:           blocks,
      copyStructure:    ctx.copyStructure || ['headline','subheadline','cta'],
      sourceExampleId:  ctx.sourceExampleId || '',
      sourceExampleName:ctx.sourceExampleName || '',
    };
    /* variants — 다른 비율 */
    if (window.cbReflowVariants) {
      var purposePreset = (window.cbGetPurposePreset && window.cbGetPurposePreset(purposeId)) || null;
      var allRatios = (purposePreset && purposePreset.ratios) ? purposePreset.ratios : [ratio];
      /* 항상 핵심 6개 비율 포함 */
      var union = {};
      allRatios.concat(['16:9','9:16','1:1','4:5']).forEach(function(r){ union[r] = true; });
      spec.variants = window.cbReflowVariants(spec, Object.keys(union));
    }
    /* qualityScore */
    spec.qualityScore = _scoreSpec(spec, dec);
    return spec;
  }
  function _u(arr, add) {
    var s = {}; arr.forEach(function(x){ s[x]=true; }); add.forEach(function(x){ s[x]=true; });
    return Object.keys(s);
  }

  /* ── 시안별 7항목 점수 계산 (cb-quality-engine 의 scoreQuality 와 보완) ── */
  function _scoreSpec(spec, dec) {
    function n(v){ return Math.max(0, Math.min(5, v)); }
    var headline = (dec && dec.headline) || (spec.blocks.find(function(b){ return b.type==='headline'; })||{}).text || '';
    var hasCta   = !!(dec && dec.cta) || spec.blocks.some(function(b){ return b.type==='cta'; });
    var hasBadge = !!(dec && dec.badge) || spec.blocks.some(function(b){ return b.type==='badge'; });
    var copyFilled = ['headline','subheadline','support','cta','badge'].filter(function(k){
      return dec && dec[k];
    }).length;

    var copySplit = n(copyFilled >= 4 ? 5 : copyFilled >= 3 ? 4 : copyFilled >= 2 ? 3 : copyFilled === 1 ? 2 : 0);
    var layoutFit = n(spec.layoutPreset && spec.layoutPreset !== 'auto' ? 5 : 3);
    /* clutter — block 수 ≤7 좋음, ≤9 mid */
    var blockCnt = spec.blocks.length;
    var typeHierarchy = n(headline ? (spec.blocks.some(function(b){ return b.type==='subheadline'; }) ? 5 : 3) : 1);
    var mobileReadability = n(
      headline.length === 0 ? 1 :
      headline.length <= 14 ? 5 :
      headline.length <= 22 ? 4 :
      headline.length <= 30 ? 3 :
      headline.length <= 40 ? 2 : 1
    );
    if (spec.aspectRatio === '9:16' && blockCnt > 8) mobileReadability = Math.max(1, mobileReadability - 1);
    var collisionAvoidance = n(spec.safeArea && spec.safeArea.show ? 4 + (spec.layoutPreset ? 1 : 0) : 2);
    if (spec.aspectRatio === '9:16' && (!spec.safeArea || !spec.safeArea.show)) collisionAvoidance = 1;
    var ctaVisibility = n(
      spec.qualityRules.indexOf('ctaVisibility') >= 0 && !hasCta ? 0 :
      hasCta ? 5 : 2
    );
    /* ratioReflow — variants 가 3개 이상이면 5점 */
    var variantCount = spec.variants ? Object.keys(spec.variants).length : 0;
    var ratioReflow = n(variantCount >= 4 ? 5 : variantCount >= 2 ? 4 : 2);

    var items = { copySplit:copySplit, layoutFit:layoutFit, typeHierarchy:typeHierarchy,
                  mobileReadability:mobileReadability, collisionAvoidance:collisionAvoidance,
                  ctaVisibility:ctaVisibility, ratioReflow:ratioReflow };
    var total = Object.keys(items).reduce(function(a,k){ return a + items[k]; }, 0);
    var percent = Math.round((total / 35) * 100);
    var grade = percent >= 80 ? 'Excellent' : percent >= 60 ? 'Good' : 'Needs Fix';
    return { items:items, total:total, percent:percent, grade:grade, max:35 };
  }
  window.cbScoreLayoutSpec = _scoreSpec;

  /* ── 메인 — 4~6 시안 생성 ── */
  function generateLayouts(state) {
    state = state || (window.contentBuilderProject || {});
    var pf  = state.purposeFlow || {};
    var pid = pf.selectedPurpose || (state.designBoard && state.designBoard.purposeId) || 'youtube-thumb';
    var ratio = pf.aspectRatio || (state.designBoard && state.designBoard.aspectRatio) || '16:9';
    var dec   = state.decomposedCopy || {};
    var defaultCta = (window.cbGetDefaultCta && window.cbGetDefaultCta(pid)) || '';
    var qualityRules = pf.qualityRules || (window.cbGetQualityRulesFor && window.cbGetQualityRulesFor(pid)) || [];
    var copyStructure = pf.copyStructure || [];

    /* selectedExample 메타 가져오기 */
    var selExId = pf.selectedExampleId || (state.designBoard && state.designBoard.sourceExampleId) || '';
    var selEx = (selExId && window.cbGetExampleById) ? window.cbGetExampleById(pid, selExId) : null;

    /* 시안 type 순서 */
    var typeIds = PURPOSE_TYPES[pid] || ['click','info','emotion','sales'];
    /* selectedExample 의 색/타이포 우선 */
    var ctxBase = {
      purposeId:        pid,
      aspectRatio:      ratio,
      decomposedCopy:   dec,
      defaultCta:       defaultCta,
      qualityRules:     qualityRules,
      copyStructure:    copyStructure,
      fallbackHeadline: '미리보기 헤드라인',
      sourceExampleId:  selEx ? selEx.id : '',
      sourceExampleName:selEx ? selEx.name : '',
      exampleHeadline:  selEx ? selEx.headline : '',
      exampleSub:       selEx ? selEx.sub : '',
      colorPresetOverride:      selEx ? selEx.colorPreset : '',
      typographyPresetOverride: selEx ? selEx.typographyPreset : '',
      layoutPreset:     selEx ? selEx.layoutPreset : '',
    };

    var layouts = typeIds.slice(0, 4).map(function(tid){
      var dt = DRAFT_TYPES.find(function(t){ return t.id === tid; }) || DRAFT_TYPES[0];
      /* selectedExample 이 있으면 첫 시안만 그것 기반, 나머지는 파생 */
      var ctx = Object.assign({}, ctxBase);
      if (typeIds.indexOf(tid) > 0) {
        /* 두 번째 시안부터는 selectedExample 색/타이포 무시 — 다양성 */
        ctx.colorPresetOverride = '';
        ctx.typographyPresetOverride = '';
      }
      return _buildLayoutSpec(dt, ctx);
    });
    return layouts;
  }
  window.cbGenerateLayouts = generateLayouts;
})();
