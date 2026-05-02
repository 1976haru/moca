/* ================================================
   modules/studio/s1-youtube-remix-safety.js
   유튜브 레퍼런스 리믹스 — 원본 복제 방지 검사
   * n-gram overlap (3-gram, 5-gram), 5단어 연속 일치 탐지
   * scene 단위 + 전체 risk (low / medium / high) 산출
   * 결정적 — AI 호출 없음
   ================================================ */
(function(){
  'use strict';

  function _norm(s){
    return String(s || '').toLowerCase()
      .replace(/[^a-z0-9가-힣ぁ-んァ-ヶ一-龥\s]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function _tokens(s){
    return _norm(s).split(' ').filter(function(w){ return w.length >= 2; });
  }
  function _ngramSet(s, n){
    var t = _tokens(s);
    var set = Object.create(null);
    for (var i = 0; i + n <= t.length; i++) {
      set[t.slice(i, i + n).join(' ')] = true;
    }
    return set;
  }
  function _overlapRatio(targetText, sourceSet){
    var tgt = _ngramSet(targetText, 3);
    var keys = Object.keys(tgt);
    if (!keys.length) return 0;
    var hits = 0;
    for (var i = 0; i < keys.length; i++) if (sourceSet[keys[i]]) hits++;
    return hits / keys.length;
  }

  /* ── 한 씬의 위험도 산출 ── */
  function checkScene(scene, srcSet3, srcSet5) {
    var narr = scene.adaptedNarration || '';
    var cap  = scene.adaptedCaption   || scene.captionKo || scene.captionJa || '';
    var vis  = scene.visualDescription || '';
    var combined = (narr + ' ' + cap).trim();
    if (!combined) {
      return { risk: 'low', narrationOverlap: 0, visualOverlap: 0, longestRun: 0, hasFiveWordRun: false };
    }
    var rNarr = _overlapRatio(combined, srcSet3);
    var rVis  = _overlapRatio(vis, srcSet3);
    var t = _tokens(combined);
    var hasLong5 = false;
    var longestRun = 0;
    var run = 0;
    for (var i = 0; i + 5 <= t.length; i++) {
      if (srcSet5[t.slice(i, i + 5).join(' ')]) {
        hasLong5 = true;
        run++;
        if (run > longestRun) longestRun = run;
      } else {
        run = 0;
      }
    }
    var risk = 'low';
    if (hasLong5 || rNarr >= 0.45 || rVis >= 0.45) risk = 'high';
    else if (rNarr >= 0.30 || rVis >= 0.30) risk = 'medium';
    return {
      risk: risk,
      narrationOverlap: Math.round(rNarr * 100),
      visualOverlap:    Math.round(rVis * 100),
      longestRun:       longestRun + 4,
      hasFiveWordRun:   hasLong5,
    };
  }

  /* ── 전체 검사 ── */
  function checkAll(originalText, scenes, opts) {
    opts = opts || {};
    var src = String(originalText || '');
    var srcSet3 = _ngramSet(src, 3);
    var srcSet5 = _ngramSet(src, 5);

    var perScene = [];
    var sentenceWarnings = [];
    var visualWarnings   = [];
    var highCount = 0, midCount = 0;

    (scenes || []).forEach(function(sc, i){
      var r = checkScene(sc, srcSet3, srcSet5);
      perScene.push(Object.assign({ sceneIndex: i, sceneNumber: i + 1 }, r));
      if (r.risk === 'high') {
        highCount++;
        sentenceWarnings.push('씬 ' + (i + 1) + ': 원본과 매우 유사 (' + r.narrationOverlap + '%)' +
          (r.hasFiveWordRun ? ' — ' + r.longestRun + '단어 연속 일치' : ''));
      } else if (r.risk === 'medium') {
        midCount++;
        sentenceWarnings.push('씬 ' + (i + 1) + ': 일부 표현 유사 (' + r.narrationOverlap + '%)');
      }
      if (r.visualOverlap >= 30) {
        visualWarnings.push('씬 ' + (i + 1) + ': 화면 묘사가 원본과 유사 (' + r.visualOverlap + '%)');
      }
    });

    /* 제목 유사도 */
    var titleSrc = _norm(opts.originalTitle || '');
    var titleNew = _norm(opts.newTopic || '');
    var titleSimilarity = 0;
    if (titleSrc && titleNew) {
      var t1 = titleSrc.split(' ').filter(function(w){ return w.length >= 2; });
      var t2 = titleNew.split(' ').filter(function(w){ return w.length >= 2; });
      if (t1.length && t2.length) {
        var common = t1.filter(function(w){ return t2.indexOf(w) >= 0; }).length;
        titleSimilarity = common / Math.max(1, Math.min(t1.length, t2.length));
      }
    }
    var titleWarning = titleSimilarity >= 0.5 ? '새 제목/훅이 원본 제목과 유사 (' + Math.round(titleSimilarity * 100) + '%)' : '';

    var overallRisk = 'low';
    if (highCount > 0 || titleSimilarity >= 0.7) overallRisk = 'high';
    else if (midCount > 0 || titleSimilarity >= 0.5 || visualWarnings.length) overallRisk = 'medium';

    var fixes = [];
    if (highCount)              fixes.push('위험 씬은 "이 씬만 다시 각색" 으로 표현을 새로 쓰세요.');
    if (visualWarnings.length)  fixes.push('화면 설명을 새 주제 맥락으로 더 구체적으로 다시 쓰세요.');
    if (titleWarning)           fixes.push('새 주제·훅을 더 차별화된 표현으로 바꿔보세요.');
    if (overallRisk === 'high') fixes.push('전체 다시 각색 권장 — 구조만 유지하고 표현을 완전히 새로 쓰세요.');

    return {
      overallRisk:               overallRisk,
      perScene:                  perScene,
      sentenceSimilarityWarnings: sentenceWarnings,
      visualSimilarityWarnings:   visualWarnings,
      titleSimilarityWarning:     titleWarning,
      titleSimilarity:            Math.round(titleSimilarity * 100),
      recommendedFixes:           fixes,
      checkedAt:                  Date.now(),
    };
  }

  window.YT_REMIX_SAFETY = {
    checkScene: checkScene,
    checkAll:   checkAll,
  };
})();
