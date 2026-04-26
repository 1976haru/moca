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
     메인 — buildStockSearchQuery(sceneIdx, opts)
     opts.prefer: 'image' | 'video'
     반환: { query, source, sceneIdx, debug }
     ════════════════════════════════════════════════ */
  function buildStockSearchQuery(sceneIdx, opts) {
    opts = opts || {};
    var prefer = opts.prefer || 'image';
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s3 = proj.s3 || {};
    var s2 = proj.s2 || {};
    var scenes = s3.scenes || [];
    var scene = scenes[sceneIdx] || null;

    var debug = { sceneIdx: sceneIdx, prefer: prefer, sources: [] };

    /* 1순위: image prompt */
    var imgP = (s3.imagePrompts && s3.imagePrompts[sceneIdx])
            || (s3.imagesV3 && s3.imagesV3[sceneIdx] && s3.imagesV3[sceneIdx].promptCompiled)
            || '';
    /* 2순위: video prompt */
    var vidP = (s3.videoPrompts && s3.videoPrompts[sceneIdx])
            || (s3.imagesV3 && s3.imagesV3[sceneIdx] && s3.imagesV3[sceneIdx].videoPromptCompiled)
            || '';
    /* 3순위: scene narration / description */
    var sceneDesc = scene ? ((scene.lines && scene.lines.join(' ')) || scene.desc || scene.label || '') : '';
    /* 4순위: 전체 스크립트의 첫 문장 (fallback) */
    var script = (s2.scriptKo || s2.scriptJa) || proj.scriptText || '';
    var scriptLead = script.split(/[.!?\n。]/).filter(Boolean).slice(0, 2).join(' ');

    var src = '';
    var raw = '';
    if (prefer === 'image' && imgP) { src = 'imagePrompt'; raw = imgP; }
    else if (prefer === 'video' && vidP) { src = 'videoPrompt'; raw = vidP; }
    else if (imgP) { src = 'imagePrompt'; raw = imgP; }
    else if (vidP) { src = 'videoPrompt'; raw = vidP; }
    else if (sceneDesc) { src = 'sceneDesc'; raw = sceneDesc; }
    else if (scriptLead) { src = 'scriptFallback'; raw = scriptLead; }
    debug.sources.push(src);

    if (!raw) {
      try { console.log('[stock-query] empty — no prompt or script for scene', sceneIdx + 1); } catch(_) {}
      return { query: '', source: '', sceneIdx: sceneIdx, debug: debug };
    }

    /* 영문이면 압축, 한글이면 매핑 */
    var query = '';
    /* 한글이 30% 이상이면 한글 처리, 아니면 영문 압축 */
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

    /* 공백/빈 결과 보정 — 최소한 영상 vs 이미지 표시어 */
    if (!query.trim()) {
      query = sceneDesc ? _korToEnglishQuery(sceneDesc) : 'lifestyle scene';
      debug.fallback = true;
    }

    debug.query = query;
    try { console.log('[stock-query] scene', sceneIdx + 1, 'src:', src, 'query:', query); } catch(_) {}
    return { query: query, source: src, sceneIdx: sceneIdx, debug: debug };
  }
  window.buildStockSearchQuery = buildStockSearchQuery;

  /* ── 모든 씬의 query 일괄 생성 (옵션) ── */
  window.buildAllStockSearchQueries = function(opts) {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var scenes = (proj.s3 && proj.s3.scenes) || [];
    return scenes.map(function(_, i){ return buildStockSearchQuery(i, opts); });
  };
})();
