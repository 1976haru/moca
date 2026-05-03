/* ================================================
   modules/remix/rm-longform-candidates.js
   롱폼 → 숏폼 후보 생성기
   * cues 배열 (또는 RM_CORE.scenes 기반) 에서 sliding window 로
     15~60s 후보를 만들고 score 로 정렬해 비중복 top-N 반환
   * 외부 API 호출 없음 — 결정적
   ================================================ */
(function(){
  'use strict';

  var MIN_DUR = 12;     /* 최소 12s — 15s 미만도 일단 후보로 (감점) */
  var MAX_DUR = 75;     /* 최대 75s — 60s 초과는 감점 */
  var IDEAL_MIN = 15;
  var IDEAL_MAX = 60;

  /* ── cues 정규화 — RM_CORE.scenes 또는 transcript 큐 모두 받음 ── */
  function _normalizeCues(input) {
    if (!Array.isArray(input)) return [];
    return input.map(function(c, i){
      var startSec = +c.startSec || 0;
      var endSec   = +c.endSec   || (startSec + 4);
      var text     = String(c.text || c.originalCaption || c.original || c.captionKo || '').trim();
      return { startSec: startSec, endSec: endSec, text: text, _idx: i };
    }).filter(function(c){ return c.text; });
  }

  /* ── 후보 슬라이딩 윈도우 ── */
  function _windows(cues) {
    var out = [];
    for (var i = 0; i < cues.length; i++) {
      for (var j = i; j < cues.length; j++) {
        var startSec = cues[i].startSec;
        var endSec   = cues[j].endSec;
        var dur      = endSec - startSec;
        if (dur < MIN_DUR) continue;
        if (dur > MAX_DUR) break;
        out.push({ from: i, to: j, startSec: startSec, endSec: endSec });
      }
    }
    return out;
  }

  /* ── 비중복 top-N 선택 (greedy by score, drop overlapping) ── */
  function _pickNonOverlap(scoredList, n) {
    var sorted = scoredList.slice().sort(function(a, b){ return b.score - a.score; });
    var picked = [];
    for (var i = 0; i < sorted.length && picked.length < n; i++) {
      var c = sorted[i];
      var clash = picked.some(function(p){
        return !(c.endSec <= p.startSec || c.startSec >= p.endSec);
      });
      if (!clash) picked.push(c);
    }
    /* 시간 순서로 다시 정렬 */
    return picked.sort(function(a, b){ return a.startSec - b.startSec; });
  }

  /* ── 제목 후보 ── */
  function _titleFor(text, type) {
    var t = String(text || '').trim();
    /* 첫 문장 또는 첫 60자 */
    var first = t.split(/[.!?。！？]/)[0].trim();
    if (first.length > 50) first = first.slice(0, 47) + '…';
    if (!first) first = t.slice(0, 50);
    var prefix = type === '감동' ? '💝 ' :
                 type === '코믹' ? '😂 ' :
                 type === '논쟁' ? '⚡ ' :
                 type === '튜토리얼' ? '📋 ' :
                 type === '정보' ? '💡 ' : '🎬 ';
    return prefix + first;
  }

  /* ── 훅 후보 ── (첫 cue 30자 또는 첫 문장) */
  function _hookFor(cues) {
    var first = cues[0] || { text: '' };
    var t = String(first.text || '').trim();
    if (t.length <= 30) return t;
    var dot = t.search(/[.!?。！？]/);
    if (dot > 0 && dot < 35) return t.slice(0, dot + 1);
    return t.slice(0, 28) + '…';
  }

  /* ── 요약 ──
     (간이) 첫 cue + 마지막 cue 결합 */
  function _summaryFor(cues) {
    if (!cues.length) return '';
    var first = String(cues[0].text || '').trim();
    var last  = String(cues[cues.length - 1].text || '').trim();
    if (first === last) return first.slice(0, 80);
    var combined = first + ' … ' + last;
    if (combined.length > 100) combined = combined.slice(0, 97) + '…';
    return combined;
  }

  /* ── scenes 변환 — 후보 안의 cues → rm-core scene schema ── */
  function _scenesFor(cues) {
    return cues.map(function(c, i){
      return {
        id:               'lf_' + String(i + 1).padStart(3, '0'),
        sceneIndex:       i,
        sceneNumber:      i + 1,
        startSec:         c.startSec,
        endSec:           c.endSec,
        timeRange:        _fmtSec(c.startSec) + '~' + _fmtSec(c.endSec),
        originalCaption:  c.text,
        editedCaption:    '',
        captionKo:        c.text,
        captionJa:        '',
        captionBoth:      '',
        narration:        c.text,
        selected:         true,
        deleted:          false,
        thumbnailUrl:     '',
        previewStatus:    'missing',
        role:             '', roleLabel: '',
        notes:            '', visualDescription: '',
        source:           'longform_clip',
        sourceType:       'video_remix_studio',
      };
    });
  }
  function _fmtSec(sec) {
    var s = Math.max(0, Math.round(+sec || 0));
    var m = Math.floor(s/60); var ss = s%60;
    return m+':'+(ss<10?'0'+ss:ss);
  }

  /* ── public: 후보 N 개 생성 ──
     opts: { count:3, ideal:[15,60], minDur, maxDur } */
  function generate(input, opts) {
    opts = opts || {};
    var cues = _normalizeCues(input);
    if (!cues.length) return [];
    if (cues.length < 2) return [];  /* 너무 짧음 — 1개 큐로는 후보 못 만듦 */

    var SCORE = window.RM_LONGFORM_SCORE;
    if (!SCORE || typeof SCORE.evaluate !== 'function') {
      console.error('[rm-longform-candidates] RM_LONGFORM_SCORE not loaded');
      return [];
    }

    var windows = _windows(cues);
    if (!windows.length) return [];

    var scored = windows.map(function(w){
      var sub = cues.slice(w.from, w.to + 1);
      var text = sub.map(function(c){ return c.text; }).join(' ');
      var ev = SCORE.evaluate({ startSec: w.startSec, endSec: w.endSec, text: text, cues: sub });
      return Object.assign({}, w, {
        cues: sub, text: text, score: ev.score, label: ev.label,
        type: ev.type, sub: ev.sub, reasons: ev.reasons,
        durationSec: ev.durationSec,
      });
    });

    var n = Math.max(1, Math.min(10, +opts.count || 3));
    var picked = _pickNonOverlap(scored, n);
    return picked.map(function(c, i){
      var titleCandidate = _titleFor(c.text, c.type);
      var hookText = _hookFor(c.cues);
      var summary  = _summaryFor(c.cues);
      var scenes   = _scenesFor(c.cues);
      return {
        candidateId:    'cand_' + (Date.now() % 1e6).toString(36) + '_' + i,
        startSec:       c.startSec,
        endSec:         c.endSec,
        durationSec:    c.durationSec,
        titleCandidate: titleCandidate,
        hookText:       hookText,
        summary:        summary,
        transcript:     c.text,
        reason:         (c.reasons || []).slice(0, 3).join(' · ') || c.label,
        score:          c.score,
        label:          c.label,
        type:           c.type,
        sub:            c.sub,
        scenes:         scenes,
        cues:           c.cues,
      };
    });
  }

  window.RM_LONGFORM_CAND = {
    generate: generate,
    MIN_DUR: MIN_DUR, MAX_DUR: MAX_DUR,
    IDEAL_MIN: IDEAL_MIN, IDEAL_MAX: IDEAL_MAX,
  };
})();
