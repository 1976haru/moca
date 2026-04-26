/* ================================================
   modules/content-builder/cb-quality-engine.js
   콘텐츠 빌더 1/3 — 품질 엔진 최소 구조
   * 7항목 점수 (각 0~5) + 100점 환산 + grade
   * 문구 자동 분해 (decomposeCopy) — 규칙 기반
   * localStorage moca_content_builder_quality_engine_v1 자동 저장
   ================================================ */
(function(){
  'use strict';

  const QE_KEY = 'moca_content_builder_quality_engine_v1';
  const QUALITY_ITEMS = [
    'copySplit', 'layoutFit', 'typeHierarchy', 'mobileReadability',
    'collisionAvoidance', 'ctaVisibility', 'ratioReflow',
  ];
  const QUALITY_LABELS = {
    copySplit:          '문구 분해',
    layoutFit:          '레이아웃 적합도',
    typeHierarchy:      '타이포 위계',
    mobileReadability:  '모바일 가독성',
    collisionAvoidance: '겹침 회피',
    ctaVisibility:      'CTA 가시성',
    ratioReflow:        '비율 리플로우',
  };
  window.CB_QUALITY_ITEMS  = QUALITY_ITEMS;
  window.CB_QUALITY_LABELS = QUALITY_LABELS;

  /* ════════════════════════════════════════════════
     1) 문구 자동 분해 — 규칙 기반
     ════════════════════════════════════════════════ */
  const CTA_HINTS    = ['지금','오늘','신청','확인','예약','구매','등록','가입','참여','문의','클릭','시작','받기','보기','체험'];
  const BADGE_HINTS  = ['무료','할인','신규','한정','긴급','오픈','이벤트','신상품','선착순','마감','놓치지','특가'];
  const STRONG_HINTS = ['충격','놀라운','꼭','반드시','절대','후회','비밀','진실','이유','방법','정답','이거','이것'];

  function decomposeCopy(text, opts) {
    opts = opts || {};
    var raw = String(text || '').trim();
    var out = { eyebrow:'', headline:'', subheadline:'', support:'', badge:'', cta:'', footer:'', warning:'' };
    if (!raw) return out;

    /* 문장 분리 */
    var sentences = raw
      .split(/(?<=[.!?。])\s+|\n+/)
      .map(function(s){ return s.trim(); })
      .filter(function(s){ return s.length > 0; });
    if (!sentences.length) sentences = [raw];

    /* badge 후보 — BADGE_HINTS 단어가 들어있는 가장 짧은 문장 (또는 단어) */
    var badgeIdx = -1;
    for (var i = 0; i < sentences.length; i++) {
      var s = sentences[i];
      if (BADGE_HINTS.some(function(h){ return s.indexOf(h) >= 0; }) && s.length <= 25) {
        out.badge = s.replace(/[!?.。]+$/,'');
        badgeIdx = i; break;
      }
    }
    /* 미발견 시 단어 단위 추출 */
    if (!out.badge) {
      var hit = BADGE_HINTS.find(function(h){ return raw.indexOf(h) >= 0; });
      if (hit) out.badge = hit;
    }

    /* warning — '주의', '경고', '⚠' */
    var warnIdx = -1;
    for (var w = 0; w < sentences.length; w++) {
      if (/주의|경고|⚠/.test(sentences[w])) { out.warning = sentences[w]; warnIdx = w; break; }
    }

    /* CTA 후보 — CTA_HINTS 가 들어있고 명령형 어미 */
    var ctaIdx = -1;
    for (var c = sentences.length - 1; c >= 0; c--) {
      var sc = sentences[c];
      var hasHint = CTA_HINTS.some(function(h){ return sc.indexOf(h) >= 0; });
      var hasImper = /(세요|십시오|하기|보기|받기|시작)$|→|→$/.test(sc.replace(/[!?.。]+$/,''));
      if (hasHint && (hasImper || sc.length <= 30)) {
        out.cta = sc.replace(/[!?.。]+$/,'');
        ctaIdx = c; break;
      }
    }
    /* 목적별 기본 CTA 보강 */
    if (!out.cta && opts.defaultCta) out.cta = opts.defaultCta;

    /* 본문 후보 — 위에서 사용한 인덱스 제외 */
    var usedIdx = {};
    [badgeIdx, warnIdx, ctaIdx].forEach(function(idx){ if (idx >= 0) usedIdx[idx] = true; });
    var bodySentences = sentences.filter(function(_, i){ return !usedIdx[i]; });

    /* headline — 첫 문장 또는 가장 짧고 강한 문장 */
    var bestHIdx = -1;
    var bestScore = -1;
    bodySentences.forEach(function(s, i){
      var score = 0;
      if (i === 0) score += 2;
      if (/[?？]$/.test(s)) score += 2;          /* 질문형 */
      if (/\d/.test(s)) score += 1;              /* 숫자 */
      if (STRONG_HINTS.some(function(h){ return s.indexOf(h) >= 0; })) score += 2;
      if (s.length <= 20) score += 1;
      if (s.length > 35)  score -= 2;
      if (score > bestScore) { bestScore = score; bestHIdx = i; }
    });
    if (bestHIdx >= 0) {
      out.headline = bodySentences[bestHIdx].replace(/[.。]+$/,'');
      bodySentences.splice(bestHIdx, 1);
    } else if (bodySentences[0]) {
      out.headline = bodySentences.shift().replace(/[.。]+$/,'');
    }

    /* subheadline — 다음 문장, support — 그 다음 */
    if (bodySentences[0]) out.subheadline = bodySentences.shift().replace(/[.。]+$/,'');
    if (bodySentences[0]) out.support     = bodySentences.join(' ').replace(/[.。]+$/,'');

    /* eyebrow — headline 보다 짧은 도입어 (없으면 빈) */
    /* footer — 도메인/연락처 패턴 */
    var footerMatch = raw.match(/(https?:\/\/\S+|@[\w._]+|\d{2,3}-\d{3,4}-\d{4})/);
    if (footerMatch) out.footer = footerMatch[1];

    return out;
  }
  window.cbDecomposeCopy = decomposeCopy;

  /* ════════════════════════════════════════════════
     2) 7항목 품질 점수 — 각 0~5
        state: { decomposedCopy, purposeFlow, designBoard, blocks, ... }
     ════════════════════════════════════════════════ */
  function _scoreCopySplit(s) {
    var c = s.decomposedCopy || {};
    var filled = ['headline','subheadline','support','cta','badge'].filter(function(k){ return !!c[k]; }).length;
    if (filled >= 4) return 5;
    if (filled === 3) return 4;
    if (filled === 2) return 3;
    if (filled === 1) return 2;
    return 0;
  }
  function _scoreLayoutFit(s) {
    var lp = (s.purposeFlow && s.purposeFlow.layoutPresetGroup) || (s.designBoard && s.designBoard.layoutPresetGroup);
    if (!lp) return 1;
    /* 목적별 기본 layoutPresetGroup 이 지정되어 있으면 만점 */
    return 5;
  }
  function _scoreTypeHierarchy(s) {
    var c = s.decomposedCopy || {};
    var hasH = !!c.headline;
    var hasS = !!(c.subheadline || c.support);
    var hasA = !!(c.cta || c.badge);
    return (hasH ? 2 : 0) + (hasS ? 2 : 0) + (hasA ? 1 : 0);
  }
  function _scoreMobileReadability(s) {
    var c = s.decomposedCopy || {};
    var h = String(c.headline || '');
    if (!h) return 1;
    if (h.length <= 14) return 5;
    if (h.length <= 22) return 4;
    if (h.length <= 30) return 3;
    if (h.length <= 40) return 2;
    return 1;
  }
  function _scoreCollisionAvoidance(s) {
    /* 1/3 단계: safeArea 가 설정되어 있으면 4, layoutPresetGroup 이 있으면 +1 */
    var sa = s.designBoard && s.designBoard.safeArea;
    var lp = s.designBoard && s.designBoard.layoutPresetGroup;
    var n = 0;
    if (sa && sa.show !== false) n += 4;
    if (lp) n += 1;
    return Math.min(5, n);
  }
  function _scoreCtaVisibility(s) {
    var c = s.decomposedCopy || {};
    var pref = (s.purposeFlow && s.purposeFlow.qualityRules) || [];
    var ctaRequired = pref.indexOf('ctaVisibility') >= 0;
    if (!c.cta) return ctaRequired ? 0 : 2;
    if (c.cta.length <= 8) return 5;
    if (c.cta.length <= 14) return 4;
    if (c.cta.length <= 20) return 3;
    return 2;
  }
  function _scoreRatioReflow(s) {
    var pf = s.purposeFlow || {};
    var ratios = (window.cbGetPurposePreset && pf.selectedPurpose && window.cbGetPurposePreset(pf.selectedPurpose) || {}).ratios || [];
    if (!ratios.length) return 1;
    if (ratios.length >= 3) return 5;
    if (ratios.length === 2) return 4;
    return 3;
  }

  function scoreQuality(state) {
    state = state || (window.contentBuilderProject || {});
    var scores = {
      copySplit:          _scoreCopySplit(state),
      layoutFit:          _scoreLayoutFit(state),
      typeHierarchy:      _scoreTypeHierarchy(state),
      mobileReadability:  _scoreMobileReadability(state),
      collisionAvoidance: _scoreCollisionAvoidance(state),
      ctaVisibility:      _scoreCtaVisibility(state),
      ratioReflow:        _scoreRatioReflow(state),
    };
    var total = QUALITY_ITEMS.reduce(function(acc, k){ return acc + (scores[k] || 0); }, 0);
    var percent = Math.round((total / 35) * 100);
    var grade = percent >= 80 ? 'Excellent' : percent >= 60 ? 'Good' : 'Needs Fix';
    return { items:scores, total:total, percent:percent, grade:grade, max:35 };
  }
  window.cbScoreQuality = scoreQuality;

  /* ════════════════════════════════════════════════
     3) Quality Engine snapshot 저장/로드
        state.qualityEngine = { decomposedCopy, scores, savedAt }
     ════════════════════════════════════════════════ */
  function saveQualitySnapshot() {
    var p = window.contentBuilderProject || {};
    var dec = p.decomposedCopy || {};
    var scores = scoreQuality(p);
    var snap = { decomposedCopy: dec, scores: scores, savedAt: Date.now() };
    p.qualityEngine = snap;
    try { localStorage.setItem(QE_KEY, JSON.stringify(snap)); } catch(_) {}
    if (typeof window.cbSave === 'function') window.cbSave();
    return snap;
  }
  function loadQualitySnapshot() {
    try { return JSON.parse(localStorage.getItem(QE_KEY) || 'null'); } catch(_) { return null; }
  }
  window.cbSaveQualitySnapshot = saveQualitySnapshot;
  window.cbLoadQualitySnapshot = loadQualitySnapshot;

  /* ════════════════════════════════════════════════
     4) 합치기 — 입력 텍스트 → 분해 + 점수 한 번에
        (디자인 보드 placeholder 의 "문구 자동 분해" 버튼이 호출)
     ════════════════════════════════════════════════ */
  window.cbRunQualityFromText = function(text) {
    var p = window.contentBuilderProject = window.contentBuilderProject || (window.cbNewProject ? window.cbNewProject() : {});
    var defaultCta = (window.cbGetDefaultCta && p.purposeFlow && window.cbGetDefaultCta(p.purposeFlow.selectedPurpose)) || '';
    var dec = decomposeCopy(text, { defaultCta: defaultCta });
    p.decomposedCopy = dec;
    return saveQualitySnapshot();
  };
})();
