/* ================================================
   modules/studio/s3-prompt-quality-v31.js
   ⭐ 프롬프트 품질 점수 v3.1 + provider 품질 경고
   * window.s3ScorePromptQualityV31(prompt, scene, type, intent, providerId)
       → { score, tier, issues:[], details:{...} }
   * window.s3GetProviderQualityWarningV31(providerId, type)
       → { tier, message, recommend?:[ids] }
   * 사용처: drawer 배지, 보드 카드 점수, 생성 전 경고
   ================================================ */
(function(){
  'use strict';

  var TIERS = [
    { min:90, label:'매우 좋음',  color:'#1a7a5a', bg:'#effbf7' },
    { min:80, label:'사용 가능',  color:'#2a6db8', bg:'#eaf3fb' },
    { min:70, label:'재생성 권장',color:'#a05a00', bg:'#fff7e6' },
    { min:60, label:'수정 필요',  color:'#c0392b', bg:'#fff1f1' },
    { min: 0, label:'생성 전 경고',color:'#811',   bg:'#ffe6e6' },
  ];
  function tierFor(score){
    for (var i = 0; i < TIERS.length; i++) if (score >= TIERS[i].min) return TIERS[i];
    return TIERS[TIERS.length - 1];
  }

  function _has(re, s){ return re.test(String(s||'')); }

  function score(prompt, scene, type, intent, providerId){
    type = type || 'image';
    var s = String(prompt || '');
    var issues = [];
    var penalties = 0;

    /* 한국어 잔존 — 강한 감점 */
    if (/[ㄱ-ㆎ가-힣]/.test(s)) {
      issues.push('한국어 rawVisual 이 영어 프롬프트에 그대로 섞임');
      penalties += 15;
    }

    /* action 부재 */
    var hasAction = _has(/(holding|sitting|extending|standing|walking|stepping|reaching|inspecting|placing|pressing|filling|reading|making|looking|pointing|nodding|smiling|breathing|wiping|arranging|greeting|navigating|rotating|drinking|demonstrating|waiting)/i, s);
    if (!hasAction) { issues.push('action 동사가 없음'); penalties += 20; }

    /* mustShow coverage */
    var ms = (intent && intent.mustShow) || [];
    var msHits = ms.filter(function(x){ return _has(new RegExp(x.split(' ')[0], 'i'), s); }).length;
    if (ms.length === 0)            { issues.push('mustShow(핵심 소품/신체) 0 개'); penalties += 20; }
    else if (msHits === 0)          { issues.push('mustShow 가 prompt 본문에 반영 안됨'); penalties += 15; }
    else if (msHits < 2 && ms.length >= 2) { issues.push('mustShow 가 1개만 반영됨'); penalties += 5; }

    /* subject clarity */
    if (!_has(/(person|adult|senior|elder|customer|owner|child|citizen|singer|couple|parent)/i, s)) {
      if (!intent || /3d|animal|anime|ghibli/i.test(intent.subject || '')) {
        /* 동물/3D/애니 모드 등은 사람 부재 허용 */
      } else {
        issues.push('subject(주체) 가 명확하지 않음'); penalties += 5;
      }
    }

    /* ratio */
    if (type === 'image') {
      if (!_has(/9:16|9 ?vertical|portrait composition/i, s)) {
        issues.push('9:16 vertical 누락'); penalties += 10;
      }
      if (!_has(/safe area|caption safe|subject centered|safe-area/i, s)) {
        issues.push('caption safe area 누락'); penalties += 10;
      }
      if (!_has(/no text overlay/i, s)) {
        issues.push('no text overlay 누락'); penalties += 5;
      }
    } else {
      /* video */
      if (!_has(/9:16/i, s))                                  { issues.push('9:16 누락'); penalties += 10; }
      if (!_has(/duration:\s*\d/i, s))                        { issues.push('duration 누락'); penalties += 5; }
      if (!_has(/camera motion/i, s))                         { issues.push('camera motion 누락'); penalties += 10; }
      if (!_has(/subject motion/i, s))                        { issues.push('subject motion 누락'); penalties += 10; }
      if (_has(/static (shot|talking)|fade (in|out)|warm smile/i, s)) {
        issues.push('static/fade/warm smile 반복'); penalties += 15;
      }
      if (!_has(/no text overlay/i, s))                       { issues.push('no text overlay 누락'); penalties += 5; }
    }

    /* studio name leak */
    if (_has(/(ghibli|pixar|disney|miyazaki)/i, s)) {
      issues.push('특정 스튜디오명 포함'); penalties += 10;
    }

    /* generic senior portrait */
    if (_has(/generic (senior|elderly) portrait|generic portrait/i, s)) {
      issues.push('generic senior portrait 표현'); penalties += 20;
    }

    /* provider fit */
    if (providerId === 'dalle2' && type === 'image') {
      issues.push('DALL-E 2 는 정사각형 위주 — 9:16 후처리 크롭 필요');
      penalties += 5;
    }

    var sc = Math.max(0, 100 - penalties);
    return {
      score:   sc,
      tier:    tierFor(sc),
      issues:  issues.slice(0, 5),
      type:    type,
      details: { mustShowCoverage: ms.length ? (msHits + '/' + ms.length) : '0/0', hasAction: hasAction }
    };
  }
  window.s3ScorePromptQualityV31 = score;

  /* ════════════════════════════════════════════════
     provider 품질 경고
     ════════════════════════════════════════════════ */
  function providerWarning(providerId, type){
    type = type || 'image';
    /* router 의 registry 가 있으면 capability 참고 */
    var REG = window.S3_IMAGE_PROVIDER_REGISTRY || {};
    var cfg = REG[providerId] || REG[String(providerId).toLowerCase()] || null;

    if (providerId === 'dalle2') {
      return {
        tier: 'legacy',
        message: 'DALL-E 2 는 테스트용으로는 가능하지만, 대본 의도 반영·세로 쇼츠 구도·사실적 인물 표현은 최신 모델보다 불리할 수 있습니다.',
        recommend: ['dalle3', 'flux', 'geminiImagen']
      };
    }
    if (providerId === 'minimax' && type === 'image') {
      if (cfg && cfg.image === false) {
        return {
          tier: 'unsupported',
          message: 'MiniMax 는 현재 이 프로젝트에서 영상/이미지→영상 provider 로 설정되어 있으며 이미지 생성 adapter 가 없습니다.',
          recommend: ['dalle3', 'flux', 'geminiImagen']
        };
      }
    }
    /* 키 저장됐는데 adapter 없음 — capability false 인데 호출 시도 */
    if (cfg && cfg.image === false && type === 'image') {
      return {
        tier: 'unsupported',
        message: cfg.label + ' 는 이미지 생성을 지원하지 않습니다. 다른 image provider 를 선택하세요.',
        recommend: ['dalle3', 'flux', 'geminiImagen']
      };
    }
    return null;
  }
  window.s3GetProviderQualityWarningV31 = providerWarning;

  /* 점수를 STUDIO 에 적재 */
  function scoreAllAndStore(){
    var project = (window.s3GetProjectSafe ? window.s3GetProjectSafe() : {});
    var scenes = (typeof window.s3GetResolvedScenesSafe === 'function')
      ? window.s3GetResolvedScenesSafe() : [];
    var s3 = (window.s3GetS3Safe ? window.s3GetS3Safe() : (project.s3 = project.s3 || {}));
    var imageScores = [], videoScores = [];
    scenes.forEach(function(sc, i){
      var imgPrompt = (s3.imagePrompts || [])[i] || (sc.imagePrompt || '');
      var vidPrompt = (s3.videoPrompts || [])[i] || (sc.videoPrompt || '');
      var intent = (typeof window.s3ParseSceneVisualIntentV31 === 'function')
        ? window.s3ParseSceneVisualIntentV31(sc, i, project) : null;
      var providerId = (typeof window.getSelectedImageProviderId === 'function')
        ? window.getSelectedImageProviderId() : (s3.api || 'dalle3');
      imageScores[i] = score(imgPrompt, sc, 'image', intent, providerId);
      videoScores[i] = score(vidPrompt, sc, 'video', intent, providerId);
    });
    s3.promptQuality = { version:'v3.1', image: imageScores, video: videoScores, lastRunAt: Date.now() };
    if (typeof window.studioSave === 'function') { try { window.studioSave(); } catch(_){} }
    return s3.promptQuality;
  }
  window.s3ScoreAllAndStoreV31 = scoreAllAndStore;
})();
