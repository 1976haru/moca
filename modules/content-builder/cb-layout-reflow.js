/* ================================================
   modules/content-builder/cb-layout-reflow.js
   콘텐츠 빌더 2/3 — 비율별 variant 기본 규칙
   * cbReflowVariants(baseLayout, ratios) → { '16:9':{...}, '9:16':{...}, ... }
   * 각 variant 는 blocks 좌표만 다시 계산 (텍스트·색·타이포는 동일)
   ================================================ */
(function(){
  'use strict';

  /* ── 기본 safeArea (비율별) ── */
  const SAFE_AREA = {
    '16:9': { topPercent: 5,  bottomPercent: 12, sidePercent: 3 },
    '9:16': { topPercent: 12, bottomPercent: 22, sidePercent: 0 },
    '1:1':  { topPercent: 6,  bottomPercent: 8,  sidePercent: 6 },
    '4:5':  { topPercent: 6,  bottomPercent: 16, sidePercent: 4 },
    '3:1':  { topPercent: 10, bottomPercent: 10, sidePercent: 2 },
    '3:4':  { topPercent: 8,  bottomPercent: 10, sidePercent: 6 },
    'A4':   { topPercent: 8,  bottomPercent: 10, sidePercent: 8 },
  };
  window.CB_REFLOW_SAFE_AREA = SAFE_AREA;

  /* ── 비율별 기본 layoutRule ─ {headlinePos, ctaPos, imagePos} ── */
  const RULE = {
    '16:9': { headline:{x:6,y:30,w:55}, sub:{x:6,y:55,w:55}, image:{x:64,y:6,w:32,h:88}, cta:{x:6,y:78,w:30,h:11}, badge:{x:6,y:6,w:28,h:9} },
    '9:16': { headline:{x:8,y:18,w:84}, sub:{x:8,y:36,w:84}, image:{x:8,y:48,w:84,h:36}, cta:{x:18,y:84,w:64,h:8},  badge:{x:8,y:6,w:50,h:6} },
    '1:1':  { headline:{x:8,y:14,w:84}, sub:{x:8,y:34,w:84}, image:{x:8,y:46,w:84,h:36}, cta:{x:18,y:84,w:64,h:8},  badge:{x:8,y:6,w:40,h:6} },
    '4:5':  { headline:{x:8,y:10,w:84}, sub:{x:8,y:28,w:84}, image:{x:8,y:38,w:84,h:42}, cta:{x:18,y:84,w:64,h:8},  badge:{x:8,y:4, w:40,h:5} },
    '3:1':  { headline:{x:4,y:24,w:50}, sub:{x:4,y:54,w:46}, image:{x:60,y:8,w:36,h:84}, cta:{x:4,y:74,w:30,h:18}, badge:{x:4,y:6, w:24,h:14} },
    '3:4':  { headline:{x:8,y:12,w:84}, sub:{x:8,y:30,w:84}, image:{x:8,y:42,w:84,h:38}, cta:{x:18,y:82,w:64,h:8},  badge:{x:8,y:4, w:40,h:5},
              footer:{x:8,y:92,w:84,h:5} },
    'A4':   { headline:{x:8,y:10,w:84}, sub:{x:8,y:24,w:84}, image:{x:8,y:34,w:84,h:42}, cta:{x:18,y:80,w:64,h:7},  badge:{x:8,y:4, w:40,h:5},
              footer:{x:8,y:92,w:84,h:5} },
  };
  window.CB_REFLOW_RULE = RULE;

  /* ── 단일 variant 계산 ── */
  function buildVariant(baseLayout, ratio) {
    var rule = RULE[ratio] || RULE['16:9'];
    var safe = SAFE_AREA[ratio];
    /* baseLayout.blocks 의 type 별로 위치를 rule 로 덮어씀 (텍스트/스타일은 보존) */
    var newBlocks = (baseLayout.blocks || []).map(function(b){
      var copy = Object.assign({}, b);
      var place = rule[b.type];
      if (place) {
        copy.x = place.x; copy.y = place.y; copy.w = place.w;
        if (place.h != null) copy.h = place.h;
      }
      /* badge: 9:16 일 때는 좌상단 작게 */
      return copy;
    });
    /* footer 가 rule 에만 있고 baseLayout 에 없으면 추가 */
    if (rule.footer && !newBlocks.some(function(b){ return b.type === 'footer'; })) {
      newBlocks.push({ type:'footer', text: baseLayout.footer || 'channel.example', x:rule.footer.x, y:rule.footer.y, w:rule.footer.w });
    }
    return Object.assign({}, baseLayout, {
      aspectRatio: ratio,
      blocks: newBlocks,
      safeArea: { show:true, topPercent: safe.topPercent, bottomPercent: safe.bottomPercent, sidePercent: safe.sidePercent },
    });
  }
  window.cbBuildVariant = buildVariant;

  /* ── 다중 variant 생성 ── */
  function reflowVariants(baseLayout, ratios) {
    ratios = ratios && ratios.length ? ratios : ['16:9','9:16','1:1','4:5','3:1','3:4'];
    var out = {};
    ratios.forEach(function(r){ out[r] = buildVariant(baseLayout, r); });
    return out;
  }
  window.cbReflowVariants = reflowVariants;

  /* ── safeArea만 빠르게 가져오기 ── */
  window.cbGetSafeAreaForRatio = function(ratio) {
    return Object.assign({ show:true }, SAFE_AREA[ratio] || SAFE_AREA['16:9']);
  };
})();
