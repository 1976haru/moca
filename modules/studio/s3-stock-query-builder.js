/* ================================================
   modules/studio/s3-stock-query-builder.js
   숏츠 스튜디오 — 프롬프트 → 스톡 검색어 압축 변환
   * AI 생성용 프롬프트(긴 영문)에서 스타일 수식어 제거
   * 인물/행동/장소/소품/감정 핵심 키워드 5~10개로 정리
   * image prompt > video prompt > scene desc > script 우선순위
   * 한글 → 영문 fallback (간단 키워드 매핑)
   ================================================ */
(function(){
  'use strict';

  /* ── 제거할 스타일 수식어 (소문자 정규식 토큰) ── */
  const STYLE_NOISE = [
    'high quality', 'masterpiece', 'best quality', 'ultra detailed', 'photorealistic',
    'realistic photography', 'realistic photo', 'cinematic photography', 'cinematic',
    '9:16 vertical', '9:16', '16:9 horizontal', '16:9', '1:1 composition', '4:5',
    'portrait composition', 'full vertical frame', 'subject centered',
    'subtitle-safe composition', 'no text overlay', 'no rendered text',
    'no watermark', 'no logo', 'no subtitles', 'fake brand',
    'generic portrait close-up only', 'realistic daily life photography',
    'environmental scene with action and props, not just a portrait',
    'documentary-style', 'film grain subtle', 'editorial', 'commercial',
    'low-angle', 'medium shot', 'medium close-up', 'close-up', 'wide shot',
    'top-down', 'over-the-shoulder', 'split-screen', 'split-frame',
    'minimal composition', 'composition', 'framing',
    'soft natural light', 'warm golden hour', 'warm mood',
    'restrained warm mood', 'restrained mood', 'mood',
    'no text', 'high resolution', 'hi-res',
  ];

  /* ── 한글 → 영문 키워드 fallback (스톡 영문 검색용 — 간단 매핑) ── */
  const KO_TO_EN = {
    '시니어':'senior', '노인':'elderly', '어르신':'elderly',
    '부모':'parent', '엄마':'mother', '아빠':'father', '어머니':'mother', '아버지':'father',
    '할머니':'grandmother', '할아버지':'grandfather',
    '아이':'child', '학생':'student', '청년':'young adult', '중년':'middle-aged',
    '여자':'woman', '여성':'woman', '남자':'man', '남성':'man',
    '아기':'baby', '커플':'couple', '연인':'couple', '가족':'family',
    '손':'hand', '손님':'customer', '의사':'doctor', '간호사':'nurse',
    '사장':'shop owner', '점원':'staff', '직원':'employee',
    /* 행동 */
    '걷기':'walking', '걷는':'walking', '뛰기':'running', '운동':'exercise',
    '스트레치':'stretching', '체조':'gymnastics', '요가':'yoga',
    '계단':'stairs', '계단에서':'on stairs', '내려가기':'going down',
    '올라가기':'going up', '앉기':'sitting', '서기':'standing',
    '잠':'sleeping', '수면':'sleep', '식사':'meal', '요리':'cooking',
    '공부':'studying', '독서':'reading', '쇼핑':'shopping', '운전':'driving',
    '전화':'phone call', '통화':'phone call', '메시지':'messaging',
    '구매':'shopping', '결제':'payment',
    /* 장소 */
    '집':'home', '거실':'living room', '주방':'kitchen', '침실':'bedroom',
    '욕실':'bathroom', '식탁':'dining table', '책상':'desk',
    '병원':'hospital', '약국':'pharmacy', '학교':'school', '교실':'classroom',
    '사무실':'office', '카페':'cafe', '식당':'restaurant', '매장':'store',
    '가게':'shop', '시장':'market', '공원':'park', '거리':'street',
    '도시':'city', '시골':'countryside', '바다':'sea', '산':'mountain',
    '하늘':'sky', '해변':'beach', '무대':'stage', '광장':'plaza',
    '관공서':'government office', '시청':'city hall',
    /* 감정 / 분위기 */
    '슬픔':'sadness', '기쁨':'joy', '행복':'happiness', '걱정':'worry',
    '불안':'anxiety', '평온':'calm', '따뜻함':'warmth',
    '후회':'regret', '외로움':'loneliness', '사랑':'love',
    /* 소품 */
    '사진':'photograph', '편지':'letter', '책':'book', '꽃':'flower',
    '컵':'cup', '커피':'coffee', '차':'tea', '음식':'food',
    '돈':'money', '지갑':'wallet', '가방':'bag', '신발':'shoes',
    '약':'medicine', '약통':'pill bottle', '체중계':'weight scale',
    '의자':'chair', '소파':'sofa', '침대':'bed', '거울':'mirror',
    '시계':'clock', '전화기':'phone', '컴퓨터':'computer', '노트북':'laptop',
    '카드':'card', '자동차':'car', '자전거':'bicycle',
    '카세트':'cassette tape', '레코드':'vinyl record', '마이크':'microphone',
    '기타':'guitar', '피아노':'piano',
    /* 통증/건강 */
    '통증':'pain', '아픔':'pain', '무릎':'knee', '허리':'lower back', '목':'neck',
    '어깨':'shoulder', '머리':'head', '두통':'headache', '복통':'stomach pain',
    '관절염':'arthritis', '치료':'treatment', '재활':'rehabilitation',
    '스트레칭':'stretching', '마사지':'massage', '찜질':'heat therapy',
    /* 잡학/정보 */
    '비교':'comparison', '대비':'contrast', '설명':'explanation',
    '도구':'tool', '방법':'method', '단계':'step',
    /* 음악/공연 */
    '노래':'song', '음악':'music', '공연':'performance', '콘서트':'concert',
    '쇼와':'showa era', '엔카':'enka',
    /* 공공/소상공인 */
    '신청':'application', '서류':'document', '안내':'guidance', '정책':'policy',
    '할인':'discount', '이벤트':'event', '오픈':'opening', '신메뉴':'new menu',
  };

  /* ── 한 토큰 변환 — 한글이면 매핑, 영문이면 그대로 ── */
  function _translateToken(t) {
    if (!t) return '';
    /* 영문/숫자만 있으면 그대로 */
    if (/^[a-zA-Z0-9 -]+$/.test(t)) return t;
    /* 한글 매핑 */
    if (KO_TO_EN[t]) return KO_TO_EN[t];
    /* 부분 매칭 — 가장 긴 매칭 우선 */
    var bestMatch = '';
    var bestLen = 0;
    Object.keys(KO_TO_EN).forEach(function(ko){
      if (t.indexOf(ko) >= 0 && ko.length > bestLen) {
        bestMatch = KO_TO_EN[ko];
        bestLen = ko.length;
      }
    });
    return bestMatch || '';
  }
  window._s3StockTranslateToken = _translateToken;

  /* ── 영문 텍스트 압축 — 스타일 수식어 제거 ── */
  function _compressEnglish(text) {
    var s = String(text || '').toLowerCase();
    /* [Subject] [Action] 같은 블록 라벨 제거 */
    s = s.replace(/\[[^\]]*\]/g, ' ');
    /* 스타일 노이즈 제거 */
    STYLE_NOISE.forEach(function(noise){
      var re = new RegExp(noise.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      s = s.replace(re, ' ');
    });
    /* 콤마/문장부호 정리 */
    s = s.replace(/[,;:.!?]+/g, ' ').replace(/\s+/g, ' ').trim();
    /* 토큰화 + dedup */
    var tokens = s.split(/\s+/).filter(function(t){ return t.length >= 2; });
    var seen = {};
    var out = [];
    tokens.forEach(function(t){
      if (!seen[t]) { seen[t] = true; out.push(t); }
    });
    /* 5~10 토큰으로 자르기 (8 기본) */
    return out.slice(0, 10).join(' ');
  }

  /* ── 한국어 텍스트 → 영문 키워드 변환 ── */
  function _korToEnglishQuery(text) {
    var s = String(text || '');
    /* 한글 단어 추출 */
    var koMatches = s.match(/[가-힣]+/g) || [];
    var translated = [];
    var seen = {};
    koMatches.forEach(function(t){
      var en = _translateToken(t);
      if (en && !seen[en]) { seen[en] = true; translated.push(en); }
    });
    /* 영문 토큰도 함께 (사용자가 입력한 영어 단어) */
    var enMatches = s.match(/[a-zA-Z]{3,}/g) || [];
    enMatches.forEach(function(t){
      var lower = t.toLowerCase();
      if (!seen[lower]) { seen[lower] = true; translated.push(lower); }
    });
    return translated.slice(0, 10).join(' ');
  }

  /* ════════════════════════════════════════════════
     v4 의도 기반 영어 키워드 압축 (4~8 토큰)
     visualActionEn / mustShow / genre / subject / environment 결합
     예: "무릎 통증 계단" → "senior knee pain stairs handrail"
         "강아지의 하루"   → "cute dog daily routine playful home"
         "한국음식 vs 일본음식" → "Korean food Japanese food comparison table"
     ════════════════════════════════════════════════ */
  var GENRE_KEYWORDS = {
    senior_info:   ['senior', 'health', 'lifestyle'],
    emotional:     ['family', 'emotional', 'warm'],
    wisdom:        ['quiet', 'reflective', 'minimal'],
    comic:         ['playful', 'reaction'],
    tikitaka:      ['conversation', 'two people'],
    animal_anime:  ['cute', 'animal', 'playful'],
    real_korea:    ['Korean', 'lifestyle'],
    real_japan:    ['Japanese', 'lifestyle'],
    news:          ['editorial', 'news']
  };
  var AUDIENCE_KEYWORDS = {
    korean_senior:   ['Korean senior'],
    japanese_senior: ['Japanese senior'],
    youth:           ['young'],
    general:         []
  };
  /* mustShow 항목을 검색 키워드로 정규화 — 'must show' / 괄호 / 형용사 일부 제거 */
  function _shortenEvidence(item){
    var s = String(item||'').toLowerCase();
    s = s.replace(/^(must show:?|clear action:?|show:?|emotion:?|environment:?)\s*/, '');
    s = s.replace(/\(.*?\)/g, ' ').replace(/\s{2,}/g, ' ').trim();
    /* "warm heat pack" → 'heat pack'  /  'home blood pressure monitor' → 'blood pressure monitor' */
    var parts = s.split(/\s+/);
    if (parts.length > 3) parts = parts.slice(parts.length - 3);
    return parts.join(' ');
  }
  function _buildFromIntentV4(sceneIdx, prefer){
    if (typeof window.analyzeProjectProfileV4 !== 'function' ||
        typeof window.analyzeSceneIntentV4 !== 'function' ||
        typeof window.s3GetResolvedScenesSafe !== 'function') return null;
    try {
      var profile = window.analyzeProjectProfileV4();
      var scenes  = window.s3GetResolvedScenesSafe();
      var sc = scenes[sceneIdx];
      if (!sc) return null;
      var intent = window.analyzeSceneIntentV4(sc, profile, sceneIdx, scenes.length);

      var tokens = [];
      var seen = {};
      function _push(t){
        if (!t) return;
        var v = String(t).toLowerCase().trim();
        if (!v || seen[v]) return;
        seen[v] = true; tokens.push(v);
      }

      /* 1) audience / genre — 가장 넓은 영어 검색어 시드 */
      (AUDIENCE_KEYWORDS[profile.audience] || []).forEach(_push);
      (GENRE_KEYWORDS[profile.genre] || []).forEach(_push);

      /* 2) subject / relationship / age — Korean/Japanese senior/married couple 등 */
      if (intent.relationship)              _push(intent.relationship);
      if (intent.age && intent.age.length < 30) _push(intent.age.replace(/^in (their|his|her) /, ''));
      if (intent.subject) {
        /* 'a middle-aged woman (mother)' → 'middle-aged woman' */
        var subj = String(intent.subject).toLowerCase().split(',')[0].replace(/^(a|an)\s+/, '').replace(/\(.*?\)/g, '').replace(/\s{2,}/g,' ').trim();
        /* 'person interacting with X' phrase 면 X 만 남김 */
        var m = subj.match(/^person interacting with (.+)/);
        if (m) _push(m[1]); else _push(subj);
      }

      /* 3) mustShow objects/actions/environment 첫 1~2개 — 핵심 evidence */
      (intent.mustShowObjects || []).slice(0, 2).forEach(function(x){ _push(_shortenEvidence(x)); });
      (intent.mustShowActions || []).slice(0, 1).forEach(function(x){ _push(_shortenEvidence(x)); });
      (intent.mustShowEnvironment || []).slice(0, 1).forEach(function(x){ _push(_shortenEvidence(x)); });

      /* 4) prefer=video 일 때 'motion' 한 단어 추가 (영상 stock 검색에 도움) */
      if (prefer === 'video') _push('motion');

      /* 4~8 토큰 cap. 너무 적으면 null 반환해서 legacy 경로로 폴백 */
      if (tokens.length < 3) return null;
      var capped = tokens.slice(0, 8);
      /* 공백 정리 */
      var query = capped.join(' ').replace(/\s{2,}/g,' ').trim();
      return { query: query, profile: profile, intent: intent };
    } catch (e) {
      try { console.debug('[stock-query] v4 build failed, falling back:', e && e.message); } catch(_){}
      return null;
    }
  }
  window._s3BuildStockQueryFromIntentV4 = _buildFromIntentV4;

  /* ════════════════════════════════════════════════
     메인 — buildStockSearchQuery(sceneIdx, opts)
     opts.prefer: 'image' | 'video'
     반환: { query, source, sceneIdx, debug }
     ════════════════════════════════════════════════ */
  function buildStockSearchQuery(sceneIdx, opts) {
    opts = opts || {};
    var prefer = opts.prefer || (opts.mediaType === 'video' ? 'video' : 'image');
    var debug = { sceneIdx: sceneIdx, prefer: prefer, sources: [] };

    /* ⭐ v4 의도 기반 영어 키워드 우선 — 한국어 narration 도 4~8 토큰
       영어 검색어로 압축. v4 분석기가 없거나 토큰이 너무 적으면 legacy 경로. */
    var v4Built = _buildFromIntentV4(sceneIdx, prefer);
    if (v4Built && v4Built.query) {
      debug.method = 'v4-intent';
      debug.sources.push('v4-intent');
      try {
        console.debug('[stock-query] sceneIndex:', sceneIdx);
        console.debug('[stock-query] mediaType:', prefer);
        console.debug('[stock-query] method: v4-intent');
        console.debug('[stock-query] built query:', v4Built.query);
      } catch(_) {}
      return { query: v4Built.query, source: 'v4-intent', sceneIdx: sceneIdx, debug: debug };
    }

    /* legacy: resolver(getScenePrompt) 사용 — 모든 fallback 통합 */
    var ref = (typeof window.getScenePrompt === 'function')
            ? window.getScenePrompt(sceneIdx, prefer)
            : { prompt:'', source:'(resolver missing)' };
    var raw = ref.prompt || '';
    var src = ref.source || '';
    debug.sources.push(src);

    if (!raw) {
      try {
        console.debug('[stock-query] sceneIndex:', sceneIdx);
        console.debug('[stock-query] mediaType:', prefer);
        console.debug('[stock-query] empty — no prompt found');
      } catch(_) {}
      return { query: '', source: src, sceneIdx: sceneIdx, debug: debug };
    }
    try {
      console.debug('[stock-query] sceneIndex:', sceneIdx);
      console.debug('[stock-query] mediaType:', prefer);
      console.debug('[stock-query] prompt source:', src);
      console.debug('[stock-query] original prompt length:', raw.length);
    } catch(_) {}

    /* 한글이 30% 이상이면 한글 처리, 아니면 영문 압축 */
    var query = '';
    var koCount = (raw.match(/[가-힣]/g) || []).length;
    var totalLen = raw.replace(/\s/g, '').length;
    var koRatio = totalLen > 0 ? koCount / totalLen : 0;

    if (koRatio > 0.3) {
      query = _korToEnglishQuery(raw);
      debug.method = 'kor-to-eng';
    } else {
      query = _compressEnglish(raw);
      debug.method = 'eng-compress';
    }

    /* 공백/빈 결과 보정 */
    if (!query.trim()) {
      query = 'lifestyle scene';
      debug.fallback = true;
    }

    /* 5~8 토큰으로 추가 cap (legacy 경로도 일관성 유지) */
    var qParts = query.split(/\s+/).filter(Boolean);
    if (qParts.length > 8) query = qParts.slice(0, 8).join(' ');

    debug.query = query;
    try { console.debug('[stock-query] built query:', query); } catch(_) {}
    return { query: query, source: src, sceneIdx: sceneIdx, debug: debug };
  }
  window.buildStockSearchQuery = buildStockSearchQuery;

  /* ── 모든 씬의 query 일괄 생성 (옵션) ── */
  window.buildAllStockSearchQueries = function(opts) {
    var scenes = window.getStudioScenesForStock();
    return scenes.map(function(_, i){ return buildStockSearchQuery(i, opts); });
  };

  /* ════════════════════════════════════════════════
     getStudioScenesForStock — 단일 resolver(s3-scene-resolver.js)에 위임
     ════════════════════════════════════════════════ */
  window.getStudioScenesForStock = function() {
    if (typeof window.resolveStudioScenes !== 'function') {
      try { console.debug('[stock-scenes] resolver missing — empty list'); } catch(_) {}
      return [];
    }
    return window.resolveStudioScenes();
  };

  /* ════════════════════════════════════════════════
     getScenePromptForStock — getScenePrompt(resolver) 위임
     ════════════════════════════════════════════════ */
  window.getScenePromptForStock = function(sceneIndex, mediaType) {
    if (typeof window.getScenePrompt !== 'function') {
      try { console.debug('[stock-prompt] resolver missing'); } catch(_) {}
      return { prompt:'', source:'' };
    }
    return window.getScenePrompt(sceneIndex, mediaType === 'video' ? 'video' : 'image');
  };

  /* ════════════════════════════════════════════════
     ensureStockSearchDraft — STUDIO.project.s3.stockSearch 갱신
     ════════════════════════════════════════════════ */
  window.ensureStockSearchDraft = function(sceneIndex, mediaType, options) {
    options = options || {};
    var force = !!options.force;
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    proj.s3 = proj.s3 || {};
    proj.s3.stockSearch = proj.s3.stockSearch || { drafts: {} };
    var ss = proj.s3.stockSearch;
    ss.drafts[sceneIndex] = ss.drafts[sceneIndex] || {};
    var existing = ss.drafts[sceneIndex][mediaType];
    if (existing && !force) return existing;

    var built = window.buildStockSearchQuery(sceneIndex, { prefer: mediaType });
    var query = built && built.query || '';
    ss.drafts[sceneIndex][mediaType] = query;
    if (typeof window.studioSave === 'function') window.studioSave();
    return query;
  };

  /* ════════════════════════════════════════════════
     spec helpers — getStockSearchDraft / cleanStockQueryText
     ════════════════════════════════════════════════ */
  window.getStockSearchDraft = function(sceneIndex, mediaType) {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var drafts = proj.s3 && proj.s3.stockSearch && proj.s3.stockSearch.drafts;
    if (!drafts || !drafts[sceneIndex]) return '';
    return drafts[sceneIndex][mediaType || 'image'] || '';
  };
  window.cleanStockQueryText = function(text) {
    var s = String(text || '');
    var koCount = (s.match(/[가-힣]/g) || []).length;
    var totalLen = s.replace(/\s/g, '').length;
    var koRatio = totalLen > 0 ? koCount / totalLen : 0;
    return koRatio > 0.3 ? _korToEnglishQuery(s) : _compressEnglish(s);
  };

  /* ════════════════════════════════════════════════
     [stock-boot] 부팅 진단 — 한 번만 출력
     ════════════════════════════════════════════════ */
  function _stockBoot() {
    try {
      console.debug('[stock-boot] resolveStudioScenes:',   typeof window.resolveStudioScenes);
      console.debug('[stock-boot] buildStockSearchQuery:', typeof window.buildStockSearchQuery);
      console.debug('[stock-boot] cbRenderStockSearchPanel:', typeof window.cbRenderStockSearchPanel);
      console.debug('[stock-boot] getScenePrompt:',         typeof window.getScenePrompt);
      console.debug('[stock-boot] ensureStockSearchDraft:', typeof window.ensureStockSearchDraft);
      console.debug('[stock-boot] getStockSearchDraft:',    typeof window.getStockSearchDraft);
      console.debug('[stock-boot] cleanStockQueryText:',    typeof window.cleanStockQueryText);
    } catch(_) {}
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _stockBoot);
    } else {
      setTimeout(_stockBoot, 0); /* panel 등 다른 모듈도 로드된 후 출력 */
    }
  }
})();
