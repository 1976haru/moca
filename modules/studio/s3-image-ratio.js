/* ================================================
   modules/studio/s3-image-ratio.js
   숏폼/롱폼/썸네일/카드뉴스 비율 결정 + provider별 size 매핑 +
   프롬프트 자동 주입 + 결과 비율 평가
   ================================================ */
(function(){
  'use strict';

  /* ── 비율 프리셋 ── */
  const ASPECT_PRESETS = {
    shorts:    { ratio:'9:16',  w:9,  h:16, label:'숏츠 9:16',     promptHints:[
      '9:16 vertical', 'portrait composition', 'full vertical frame',
      'subject centered', 'subtitle-safe composition', 'no text overlay'
    ]},
    longform:  { ratio:'16:9',  w:16, h:9,  label:'롱폼 16:9',     promptHints:[
      '16:9 horizontal', 'cinematic wide composition', 'subtitle-safe lower area', 'no text overlay'
    ]},
    thumbnail: { ratio:'16:9',  w:16, h:9,  label:'썸네일 16:9',  promptHints:[
      'YouTube thumbnail composition', 'strong focal point', 'clean background', 'no text overlay unless explicitly requested'
    ]},
    cardnews:  { ratio:'1:1',   w:1,  h:1,  label:'카드뉴스 1:1', promptHints:[
      'square 1:1 composition', 'centered focal point', 'card news friendly layout', 'no text overlay'
    ]},
    cardnews45:{ ratio:'4:5',   w:4,  h:5,  label:'카드뉴스 4:5', promptHints:[
      '4:5 vertical composition', 'card news friendly layout', 'no text overlay'
    ]},
    custom:    { ratio:'',      w:0,  h:0,  label:'사용자 지정',  promptHints:[] },
  };
  window.S3_ASPECT_PRESETS = ASPECT_PRESETS;

  /* ── provider 별 권장 size (가로폭, 세로폭) ── */
  const PROVIDER_SIZES = {
    /* OpenAI DALL-E 3 — 1024x1024 / 1024x1792 / 1792x1024 */
    dalle3:    { '9:16': {w:1024, h:1792}, '16:9': {w:1792, h:1024}, '1:1': {w:1024, h:1024} },
    dalle2:    { '9:16': {w:1024, h:1024, note:'정사각만 지원 → 후처리 크롭'}, '16:9': {w:1024, h:1024, note:'정사각만 지원 → 후처리 크롭'}, '1:1': {w:1024, h:1024} },
    /* Flux — 다양한 사이즈 */
    flux:      { '9:16': {w:768,  h:1344}, '16:9': {w:1344, h:768}, '1:1': {w:1024, h:1024} },
    /* SD */
    sd:        { '9:16': {w:768,  h:1344}, '16:9': {w:1344, h:768}, '1:1': {w:1024, h:1024} },
    /* Gemini Imagen */
    gemini:    { '9:16': {w:768,  h:1344}, '16:9': {w:1344, h:768}, '1:1': {w:1024, h:1024} },
    geminiImg: { '9:16': {w:768,  h:1344}, '16:9': {w:1344, h:768}, '1:1': {w:1024, h:1024} },
    /* MiniMax */
    minimax:   { '9:16': {w:768,  h:1344}, '16:9': {w:1344, h:768}, '1:1': {w:1024, h:1024} },
    /* Ideogram */
    ideogram:  { '9:16': {w:736,  h:1312}, '16:9': {w:1312, h:736}, '1:1': {w:1024, h:1024} },
  };
  window.S3_PROVIDER_SIZES = PROVIDER_SIZES;

  /* ── 모드 자동 감지 — STUDIO.project 기반 ── */
  function detectAspectMode(proj) {
    proj = proj || (window.STUDIO && window.STUDIO.project) || {};
    var s3 = proj.s3 || {};
    /* 1) 사용자가 명시 */
    if (s3.aspectMode && ASPECT_PRESETS[s3.aspectMode]) return s3.aspectMode;
    /* 2) 콘텐츠 타입 키 */
    var ctype = (proj.contentType || (proj.s1 && proj.s1.contentType) || '').toLowerCase();
    if (/short|reels|tiktok|숏츠|릴스|틱톡/.test(ctype)) return 'shorts';
    if (/long|longform|롱폼/.test(ctype))               return 'longform';
    if (/thumb|썸네일/.test(ctype))                      return 'thumbnail';
    if (/card|카드뉴스/.test(ctype))                     return 'cardnews';
    /* 3) 길이 기반 추정 */
    var sec = parseInt(proj.lengthSec || (proj.s1 && proj.s1.duration), 10) || 60;
    if (sec <= 90)  return 'shorts';
    if (sec >= 240) return 'longform';
    return 'shorts';
  }
  window.s3DetectAspectMode = detectAspectMode;

  function getAspectRatio(mode) {
    var p = ASPECT_PRESETS[mode] || ASPECT_PRESETS.shorts;
    return p.ratio;
  }
  window.s3GetAspectRatio = getAspectRatio;

  /* ── provider 에 보낼 size 결정 ── */
  function getImageSize(mode, providerId) {
    var ratio = getAspectRatio(mode);
    var sizes = PROVIDER_SIZES[providerId];
    if (sizes && sizes[ratio]) return Object.assign({ratio:ratio}, sizes[ratio]);
    /* fallback */
    var preset = ASPECT_PRESETS[mode] || ASPECT_PRESETS.shorts;
    var base = ratio === '9:16' ? 1024 : ratio === '16:9' ? 1792 : 1024;
    return {
      ratio: ratio,
      w: Math.round(base * preset.w / Math.max(preset.w, preset.h)),
      h: Math.round(base * preset.h / Math.max(preset.w, preset.h)),
      note: 'fallback size',
    };
  }
  window.s3GetImageSize = getImageSize;

  /* ── 프로젝트에 비율 정보 적재 ── */
  function applyAspectToProject(mode, proj) {
    proj = proj || (window.STUDIO && window.STUDIO.project) || {};
    proj.s3 = proj.s3 || {};
    if (!ASPECT_PRESETS[mode]) mode = detectAspectMode(proj);
    proj.s3.aspectMode  = mode;
    proj.s3.aspectRatio = getAspectRatio(mode);
    var providerId = proj.s3.api || 'dalle3';
    proj.s3.imageSize   = getImageSize(mode, providerId);
    if (typeof window.studioSave === 'function') window.studioSave();
    return proj.s3.imageSize;
  }
  window.s3ApplyAspectToProject = applyAspectToProject;

  /* ── 프롬프트에 비율 키워드 자동 주입 ── */
  function injectAspectIntoPrompt(prompt, mode) {
    var p = String(prompt || '').trim();
    var preset = ASPECT_PRESETS[mode || detectAspectMode()];
    if (!preset || !preset.promptHints || !preset.promptHints.length) return p;
    var need = [];
    preset.promptHints.forEach(function(h){
      var key = h.split(/[\s,]/)[0].toLowerCase();
      var rx = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (!rx.test(p)) need.push(h);
    });
    if (!need.length) return p;
    return (p ? p + ', ' : '') + need.join(', ');
  }
  window.s3InjectAspectIntoPrompt = injectAspectIntoPrompt;

  /* ── 결과 이미지 비율 평가 ── */
  function evaluateRatio(naturalW, naturalH, mode) {
    if (!naturalW || !naturalH) return { kind:'unknown', label:'?' };
    var ratio = naturalW / naturalH;
    var target = (mode === 'longform' || mode === 'thumbnail') ? (16/9)
               : (mode === 'cardnews') ? 1
               : (mode === 'cardnews45') ? (4/5)
               : (9/16);
    var diff = Math.abs(ratio - target) / target;
    if (diff < 0.08) {
      return { kind:'ok', label:'✅ ' + (ASPECT_PRESETS[mode] ? ASPECT_PRESETS[mode].label : '목표') + ' 비율 (' + naturalW + '×' + naturalH + ')' };
    }
    /* 정사각 또는 완전 반대 방향 */
    var isSquare = Math.abs(ratio - 1) < 0.18;
    var goalIsVertical = target < 1;
    var actualIsVertical = ratio < 1;
    if (isSquare && (mode === 'shorts' || mode === 'longform' || mode === 'thumbnail')) {
      return { kind:'warn', label:'⚠️ 정사각형 이미지 — ' + (mode === 'shorts' ? '9:16' : '16:9') + ' 로 재생성 권장' };
    }
    if (goalIsVertical !== actualIsVertical) {
      return { kind:'wrong', label:'⚠️ ' + (actualIsVertical ? '세로' : '가로') + ' 이미지 — ' + (goalIsVertical ? '숏츠 9:16' : '롱폼 16:9') + ' 에 사용 시 크게 잘릴 수 있음' };
    }
    return { kind:'warn', label:'⚠️ 비율 차이 (' + naturalW + '×' + naturalH + ') — 목표 ' + getAspectRatio(mode) };
  }
  window.s3EvaluateRatio = evaluateRatio;

  /* ── 모드 라벨 / 안내 헬퍼 ── */
  function getModeLabel(mode) {
    return (ASPECT_PRESETS[mode] && ASPECT_PRESETS[mode].label) || mode || '';
  }
  window.s3GetModeLabel = getModeLabel;

  function getProviderRatioNote(providerId, mode) {
    var ratio = getAspectRatio(mode);
    var s = PROVIDER_SIZES[providerId];
    if (s && s[ratio] && s[ratio].note) return s[ratio].note;
    return '';
  }
  window.s3GetProviderRatioNote = getProviderRatioNote;
})();
