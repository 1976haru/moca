/* ================================================
   modules/content-builder/cb-purpose-presets.js
   콘텐츠 빌더 1/3 — 목적별 preset 데이터
   * aspectRatio / layoutPresetGroup / qualityRules / defaultCta /
     copyStructure / 카테고리 매핑
   * UI 없음 — 데이터 + 헬퍼만
   ================================================ */
(function(){
  'use strict';

  /* ── 12 목적 ── */
  const PURPOSE_PRESETS = {
    'youtube-thumb': {
      label:'유튜브 썸네일', icon:'🎬',
      ratios:['16:9'], aspectRatio:'16:9',
      layoutPresetGroup:'thumbnail-impact',
      qualityRules:['ctaVisibility','typeHierarchy','mobileReadability','copySplit'],
      defaultCta:'영상 보기',
      copyStructure:['headline','subheadline'],
      beginnerRecommended:true,
    },
    'shorts-cover': {
      label:'쇼츠 커버', icon:'📱',
      ratios:['9:16'], aspectRatio:'9:16',
      layoutPresetGroup:'shorts-hook',
      qualityRules:['ctaVisibility','typeHierarchy','mobileReadability','collisionAvoidance','ratioReflow'],
      defaultCta:'',
      copyStructure:['headline','badge'],
      beginnerRecommended:true,
    },
    'card-news': {
      label:'카드뉴스', icon:'📰',
      ratios:['4:5','1:1'], aspectRatio:'4:5',
      layoutPresetGroup:'cardnews-info',
      qualityRules:['copySplit','typeHierarchy','layoutFit','mobileReadability'],
      defaultCta:'자세히 보기',
      copyStructure:['eyebrow','headline','subheadline','support'],
      beginnerRecommended:true,
    },
    'smb-promo': {
      label:'소상공인 홍보물', icon:'🏪',
      ratios:['1:1','4:5','16:9'], aspectRatio:'1:1',
      layoutPresetGroup:'smb-deal',
      qualityRules:['ctaVisibility','copySplit','collisionAvoidance','typeHierarchy'],
      defaultCta:'예약하기',
      copyStructure:['badge','headline','subheadline','cta'],
      beginnerRecommended:true,
    },
    'event-banner': {
      label:'이벤트 배너', icon:'🎪',
      ratios:['16:9','3:1','4:5'], aspectRatio:'16:9',
      layoutPresetGroup:'event-promo',
      qualityRules:['ctaVisibility','typeHierarchy','collisionAvoidance','ratioReflow'],
      defaultCta:'신청하기',
      copyStructure:['badge','headline','support','cta'],
      beginnerRecommended:false,
    },
    'blog-cover': {
      label:'블로그 대표 이미지', icon:'✍️',
      ratios:['16:9'], aspectRatio:'16:9',
      layoutPresetGroup:'blog-editorial',
      qualityRules:['typeHierarchy','copySplit','layoutFit'],
      defaultCta:'',
      copyStructure:['eyebrow','headline','subheadline'],
      beginnerRecommended:false,
    },
    'public-card': {
      label:'공공기관 안내 카드', icon:'🏛',
      ratios:['4:5','1:1','A4'], aspectRatio:'4:5',
      layoutPresetGroup:'public-formal',
      qualityRules:['copySplit','typeHierarchy','layoutFit','mobileReadability'],
      defaultCta:'자세히 보기',
      copyStructure:['eyebrow','headline','subheadline','support','footer'],
      beginnerRecommended:false,
    },
    'ebook-cover': {
      label:'전자책 표지', icon:'📖',
      ratios:['3:4','A4'], aspectRatio:'3:4',
      layoutPresetGroup:'ebook-cover',
      qualityRules:['typeHierarchy','layoutFit','copySplit'],
      defaultCta:'',
      copyStructure:['eyebrow','headline','subheadline','footer'],
      beginnerRecommended:false,
    },
    'newsletter': {
      label:'뉴스레터 커버', icon:'📧',
      ratios:['16:9','3:1'], aspectRatio:'16:9',
      layoutPresetGroup:'newsletter-header',
      qualityRules:['typeHierarchy','copySplit','ctaVisibility','layoutFit'],
      defaultCta:'전체 보기',
      copyStructure:['eyebrow','headline','subheadline','cta'],
      beginnerRecommended:false,
    },
    'detail-banner': {
      label:'상세페이지 상단', icon:'🛍',
      ratios:['16:9','4:5'], aspectRatio:'16:9',
      layoutPresetGroup:'detail-hero',
      qualityRules:['ctaVisibility','typeHierarchy','copySplit','collisionAvoidance'],
      defaultCta:'바로 구매',
      copyStructure:['badge','headline','subheadline','cta'],
      beginnerRecommended:false,
    },
    'sns-promo': {
      label:'SNS 홍보 이미지', icon:'📷',
      ratios:['1:1','4:5'], aspectRatio:'1:1',
      layoutPresetGroup:'sns-snap',
      qualityRules:['copySplit','typeHierarchy','mobileReadability','ctaVisibility'],
      defaultCta:'프로필 링크',
      copyStructure:['badge','headline','support','cta'],
      beginnerRecommended:false,
    },
    'review-card': {
      label:'리뷰/후기 카드', icon:'⭐',
      ratios:['1:1','4:5'], aspectRatio:'1:1',
      layoutPresetGroup:'review-quote',
      qualityRules:['typeHierarchy','copySplit','layoutFit'],
      defaultCta:'',
      copyStructure:['eyebrow','headline','support','footer'],
      beginnerRecommended:false,
    },
  };
  window.CB_PURPOSE_PRESETS = PURPOSE_PRESETS;

  /* ── 8 카테고리 → 목적 매핑 ── */
  const CATEGORY_MAP = {
    'all':            ['youtube-thumb','shorts-cover','card-news','smb-promo','event-banner','blog-cover','public-card','ebook-cover','newsletter','detail-banner','sns-promo','review-card'],
    'video-thumb':    ['youtube-thumb','shorts-cover'],
    'sns-promo':      ['sns-promo','event-banner','card-news','review-card'],
    'smb':            ['smb-promo','event-banner','review-card','sns-promo'],
    'monetization':   ['blog-cover','ebook-cover','newsletter','detail-banner'],
    'public':         ['public-card','card-news','event-banner'],
    'edu':            ['card-news','ebook-cover','blog-cover'],
    'ebook-news':     ['ebook-cover','newsletter','blog-cover'],
  };
  const CATEGORY_LABELS = {
    'all':'전체', 'video-thumb':'영상·썸네일', 'sns-promo':'SNS·홍보',
    'smb':'소상공인', 'monetization':'수익화 콘텐츠', 'public':'공공기관',
    'edu':'교육·자료', 'ebook-news':'전자책·뉴스레터',
  };
  window.CB_CATEGORY_MAP    = CATEGORY_MAP;
  window.CB_CATEGORY_LABELS = CATEGORY_LABELS;

  /* ── 헬퍼 ── */
  function getPurposePreset(id) { return PURPOSE_PRESETS[id] || null; }
  function getCategoryPurposes(catId) {
    var ids = CATEGORY_MAP[catId] || CATEGORY_MAP.all;
    return ids.map(function(id){
      var p = getPurposePreset(id);
      return p ? Object.assign({ id: id }, p) : null;
    }).filter(Boolean);
  }
  function getQualityRulesFor(purposeId) {
    var p = getPurposePreset(purposeId);
    return (p && p.qualityRules) || ['copySplit','typeHierarchy','layoutFit'];
  }
  function getDefaultCta(purposeId) {
    var p = getPurposePreset(purposeId);
    return (p && p.defaultCta) || '';
  }
  window.cbGetPurposePreset    = getPurposePreset;
  window.cbGetCategoryPurposes = getCategoryPurposes;
  window.cbGetQualityRulesFor  = getQualityRulesFor;
  window.cbGetDefaultCta       = getDefaultCta;
})();
