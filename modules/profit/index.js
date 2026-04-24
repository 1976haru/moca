/* ==================================================
   index.js  (~55 lines)
   BLD_TYPES / BLOG_TEMPLATES / BLD state
   src: L1-32 + L103-125
   split_all.py
   ================================================== */

/* modules/profit.js — index.html에서 분리된 수익형(콘텐츠 빌더) 모듈
   의존: state, cards, renderAll, APIAdapter, Library
*/

/* ═══════════════════════════════════════════════════════════
   🎨 콘텐츠 빌더 (구 monetize 자리)
   6개 빌더 · 브랜드킷 · 블록 에디터 · SEO · A/B · 재활용 · 수익화 · 성과학습
   ═══════════════════════════════════════════════════════════ */

const BLD_TYPES = {
  blog:       { ico:'📝', title:'블로그 빌더',         desc:'글 하나로 네이버·브런치·티스토리까지' },
  newsletter: { ico:'📧', title:'뉴스레터 빌더',       desc:'스티비·메일침프·비히브 형식 자동' },
  webtoon:    { ico:'🎨', title:'웹툰/만화 빌더',      desc:'5칸 자동 · 캐릭터 일관성' },
  sns:        { ico:'📱', title:'SNS 카드뉴스 빌더',   desc:'인스타·스토리·카카오·링크드인' },
  ebook:      { ico:'📊', title:'전자책 / PDF 빌더',   desc:'크몽·클래스101 판매용 최적화' },
  landing:    { ico:'🌐', title:'랜딩페이지 빌더',     desc:'링크인바이오 스타일 · 스크롤 애니' }
};

const BLOG_TEMPLATES = [
  { id:'emotional',  ico:'🌸', t:'감성 일기형',   s:'시니어/감성 최적',   cssClass:'tpl-emotional' },
  { id:'info',       ico:'📊', t:'정보/지식형',   s:'건강/정보 최적',     cssClass:'tpl-info' },
  { id:'magazine',   ico:'🎨', t:'매거진형',       s:'프리미엄 최적',       cssClass:'tpl-magazine' },
  { id:'review',     ico:'🛍', t:'상품/리뷰형',   s:'소상공인 최적',       cssClass:'tpl-review' },
  { id:'official',   ico:'📰', t:'뉴스/공식형',   s:'공공기관 최적',       cssClass:'tpl-official' }
];

/* ─── 브랜드킷 (🇰🇷 / 🇯🇵 각각 저장) ───
   저장소: uc_bld_brandkit_ko / uc_bld_brandkit_ja
   구버전 uc_bld_brandkit 는 자동 마이그레이션(채널값에 따라 ko/ja 로 이동). */
const LS_BRANDKIT_PREFIX = 'uc_bld_brandkit_';
const LS_BRANDKIT_LEGACY = 'uc_bld_brandkit';


let BLD = {
  type: 'blog',
  template: 'emotional',
  language: 'ko',
  tone: 'emotional',
  length: 'mid',
  imgStyle: 'ghibli',
  colorTheme: 'pastel',
  imgPlacement: 'auto',
  animation: 'fade',
  blocks: [],          // 블로그 블록 배열
  selectedBlockId: null,
  canvasSize: 'blog',
  device: 'desktop',
  undoStack: [],
  redoStack: [],
  ab: { titleA:'', titleB:'', imgA:'', imgB:'', saved:false },
  seoScore: 0,
  deviceMobile: false,
  topic: ''
};

/* ─── 진입/종료 ─── */


