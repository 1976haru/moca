/* ================================================
   modules/remix/rm-caption-parser.js
   영상 리믹스 스튜디오 — 자막/대본 파싱 + Scene 분할
   * SRT / VTT / timestamp / plain 모두 지원 (YT_IMPORT.normalizeTranscript 재사용)
   * Scene 분할도 YT_IMPORT.splitToScenes 재사용 (1분 8~20 scene 목표)
   * 결과를 rm-core schema 로 매핑해 RM_CORE.setScenes
   * 너무 짧은 조각 병합 / 공백 자막 제거 / 선택/삭제 도구 노출
   ================================================ */
(function(){
  'use strict';

  function _fmtSec(sec){
    var s = Math.max(0, Math.round(sec || 0));
    var m = Math.floor(s/60); var ss = s%60;
    return m+':'+(ss<10?'0'+ss:ss);
  }

  /* ── 외부에서 raw text → cues 정규화 ──
     YT_IMPORT.normalizeTranscript 가 SRT/VTT/timestamp/plain 모두 처리 */
  function parseToCues(text, opts) {
    if (window.YT_IMPORT && typeof window.YT_IMPORT.normalizeTranscript === 'function') {
      return window.YT_IMPORT.normalizeTranscript(text);
    }
    /* fallback — 줄 단위 */
    var lines = String(text||'').split('\n').map(function(l){return l.trim();}).filter(Boolean);
    return lines.map(function(t,i){ return { startSec: i*4, endSec: (i+1)*4, text: t }; });
  }

  /* ── cues → scenes (rm-core schema) ── */
  function cuesToScenes(cues, opts) {
    opts = opts || {};
    var ytScenes;
    if (window.YT_IMPORT && typeof window.YT_IMPORT.splitToScenes === 'function') {
      ytScenes = window.YT_IMPORT.splitToScenes(cues, { videoId: opts.videoId || '' });
    } else {
      ytScenes = (cues || []).map(function(c, i){
        return { sceneIndex: i, sceneNumber: i+1,
          startSec: c.startSec, endSec: c.endSec, original: c.text, role: 'evidence' };
      });
    }
    /* yt schema → rm schema 매핑 (사용자 명세 schema 그대로 — narration/captionKo/captionBoth/source 포함) */
    var src = (opts && opts.captionSource) || 'manual_caption';
    return ytScenes.map(function(sc, i){
      var thumb = sc.thumbnailUrl ||
        (opts.videoId ? 'https://img.youtube.com/vi/'+opts.videoId+'/hqdefault.jpg' : '');
      var orig = sc.originalText || sc.original || '';
      return {
        id:               'rm_' + String(i + 1).padStart(3, '0'),
        sceneIndex:       i,
        sceneNumber:      i + 1,
        startSec:         sc.startSec || 0,
        endSec:           sc.endSec   || 4,
        timeRange:        sc.timeRange || (_fmtSec(sc.startSec)+'~'+_fmtSec(sc.endSec)),
        originalCaption:  orig,
        editedCaption:    '',
        captionKo:        orig,
        captionJa:        '',
        captionBoth:      '',
        narration:        orig,            /* 자동숏츠 narration 호환 (수정 시 editedCaption 우선) */
        selected:         true,
        deleted:          false,
        thumbnailUrl:     thumb,
        frameUrl:         '',
        previewStatus:    sc.previewStatus || (thumb ? 'placeholder' : 'missing'),
        role:             sc.role || '',
        roleLabel:        sc.roleLabel || '',
        notes:            '',
        visualDescription:'',
        source:           src,             /* 'srt' | 'vtt' | 'timestamp' | 'manual_caption' | 'txt' */
        sourceType:       'video_remix_studio',
      };
    });
  }

  /* ── 한 번에 raw text → scenes ── */
  function parseAndSplit(text, opts) {
    opts = opts || {};
    var cues = parseToCues(text, opts);
    if (!cues.length) return { cues: [], scenes: [], format: '' };
    var format = _guessFormat(text);
    /* captionSource 자동 결정 — opts.captionSource 가 있으면 그대로, 없으면 format 기반 */
    var capSrc = opts.captionSource ||
                 (format === 'srt' ? 'srt' :
                  format === 'vtt' ? 'vtt' :
                  format === 'timestamp' ? 'timestamp' :
                  'manual_caption');
    var scenes = cuesToScenes(cues, Object.assign({}, opts, { captionSource: capSrc }));
    return { cues: cues, scenes: scenes, format: format };
  }
  function _guessFormat(text) {
    var t = String(text || '');
    if (/^WEBVTT/i.test(t)) return 'vtt';
    if (/-->/.test(t) && /^\d+\s*$/m.test(t)) return 'srt';
    if (/-->/.test(t)) return 'vtt';
    if (/\d{1,2}:\d{2}/.test(t)) return 'timestamp';
    return 'plain';
  }

  /* ── 너무 짧은 자막(< minSec) 자동 병합 ── */
  function mergeShortScenes(scenes, minSec) {
    var min = (typeof minSec === 'number' && minSec > 0) ? minSec : 1.5;
    if (!Array.isArray(scenes) || !scenes.length) return [];
    var out = [];
    for (var i = 0; i < scenes.length; i++) {
      var sc = Object.assign({}, scenes[i]);
      var dur = (sc.endSec || 0) - (sc.startSec || 0);
      if (sc.deleted) { out.push(sc); continue; }
      if (out.length && dur < min) {
        var prev = out[out.length - 1];
        prev.endSec = sc.endSec;
        prev.timeRange = _fmtSec(prev.startSec) + '~' + _fmtSec(prev.endSec);
        prev.originalCaption = (prev.originalCaption + ' ' + sc.originalCaption).trim();
        if (sc.editedCaption) prev.editedCaption = (prev.editedCaption + ' ' + sc.editedCaption).trim();
        if (sc.captionJa)     prev.captionJa     = (prev.captionJa     + ' ' + sc.captionJa).trim();
      } else {
        out.push(sc);
      }
    }
    /* re-index */
    return out.map(function(sc, k){
      sc = Object.assign({}, sc);
      sc.sceneIndex = k; sc.sceneNumber = k + 1;
      sc.id = 'rm_' + String(k + 1).padStart(3, '0');
      return sc;
    });
  }

  /* ── 공백 자막 자동 삭제 (deleted 플래그) ── */
  function markBlanksDeleted(scenes) {
    return (scenes || []).map(function(sc){
      var copy = Object.assign({}, sc);
      if (!sc.deleted && !String(sc.originalCaption || '').trim()) copy.deleted = true;
      return copy;
    });
  }

  /* ── 일괄 선택 도구 ── */
  function selectAll(scenes, on) {
    return (scenes || []).map(function(sc){
      var c = Object.assign({}, sc);
      if (!c.deleted) c.selected = !!on;
      return c;
    });
  }
  function deleteSelected(scenes) {
    return (scenes || []).map(function(sc){
      var c = Object.assign({}, sc);
      if (c.selected && !c.deleted) { c.deleted = true; c.selected = false; }
      return c;
    });
  }
  function restoreAll(scenes) {
    return (scenes || []).map(function(sc){
      var c = Object.assign({}, sc);
      c.deleted = false;
      return c;
    });
  }

  window.RM_PARSER = {
    parseToCues:        parseToCues,
    cuesToScenes:       cuesToScenes,
    parseAndSplit:      parseAndSplit,
    mergeShortScenes:   mergeShortScenes,
    markBlanksDeleted:  markBlanksDeleted,
    selectAll:          selectAll,
    deleteSelected:     deleteSelected,
    restoreAll:         restoreAll,
  };
})();
