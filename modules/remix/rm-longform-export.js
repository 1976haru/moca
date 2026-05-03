/* ================================================
   modules/remix/rm-longform-export.js
   롱폼 후보 → 자동숏츠 전달
   * 기존 RM_EXPORT.sendToShorts 흐름 재사용
   * source: 'longform_clip', URL: ?step=2&source=longform_clip
   * 추가 메타: titleCandidate, hookText, score, type
   ================================================ */
(function(){
  'use strict';

  var HANDOFF_KEY = 'moca_remix_to_shorts_v1';

  function _toast(msg, kind) {
    if (typeof window.ucShowToast === 'function') window.ucShowToast(msg, kind || 'info');
  }

  /* ── 후보 → handoff payload ── */
  function _toPayload(candidate) {
    var scenes = (candidate.scenes || []).map(function(sc, i){
      var narr = sc.editedCaption || sc.captionJa || sc.originalCaption || '';
      var cap  = sc.captionJa || sc.editedCaption || sc.originalCaption || '';
      return {
        sceneIndex:        i,
        sceneNumber:       i + 1,
        startSec:          sc.startSec || 0,
        endSec:            sc.endSec   || ((sc.startSec || 0) + 4),
        originalCaption:   sc.originalCaption || '',
        editedCaption:     sc.editedCaption || '',
        captionKo:         sc.editedCaption || sc.originalCaption || '',
        captionJa:         sc.captionJa || '',
        captionBoth:       sc.captionBoth || '',
        narration:         narr,
        caption:           cap,
        role:              sc.role || '',
        roleLabel:         sc.roleLabel || '',
        visualDescription: sc.visualDescription || '',
        imagePrompt:       sc.imagePrompt || '',
        videoPrompt:       sc.videoPrompt || '',
        thumbnailUrl:      sc.thumbnailUrl || '',
        previewStatus:     sc.previewStatus || 'missing',
        notes:             sc.notes || '',
        source:            'longform_clip',
        sourceType:        'video_remix_studio',
      };
    });
    /* RM_CORE source 메타 */
    var p = window.RM_CORE && window.RM_CORE.project();
    var rmSrc = (p && p.source) || {};
    return {
      version: 1,
      sentAt:  Date.now(),
      remixSource: {
        url:        rmSrc.youtubeUrl   || '',
        videoId:    rmSrc.videoId      || '',
        title:      candidate.titleCandidate || rmSrc.title || '',
        type:       rmSrc.type         || '',
        fileName:   rmSrc.fileName     || '',
        durationSec: candidate.durationSec || rmSrc.durationSec || 0,
      },
      mode:        'longform_clip',
      captionLang: (p && p.captionLang) || 'ja',
      sceneCount:  scenes.length,
      scenes:      scenes,
      /* 롱폼 후보 메타 — Step 2 가 표시용으로 사용 */
      longformClip: {
        candidateId:    candidate.candidateId,
        startSec:       candidate.startSec,
        endSec:         candidate.endSec,
        durationSec:    candidate.durationSec,
        titleCandidate: candidate.titleCandidate,
        hookText:       candidate.hookText,
        summary:        candidate.summary,
        score:          candidate.score,
        label:          candidate.label,
        type:           candidate.type,
        reason:         candidate.reason,
      },
    };
  }

  /* ── 후보 검증 ── */
  function preflight(candidate) {
    var errors = [];
    if (!candidate)                               errors.push({ code:'NO_CANDIDATE', message:'후보가 없습니다.' });
    else if (!Array.isArray(candidate.scenes))    errors.push({ code:'NO_SCENES',    message:'후보에 scenes 배열이 없습니다.' });
    else if (!candidate.scenes.length)            errors.push({ code:'EMPTY_SCENES', message:'후보의 scenes 가 비어있습니다.' });
    else {
      var withCaption = candidate.scenes.filter(function(s){
        return (s.editedCaption || s.originalCaption || s.captionJa || '').trim();
      }).length;
      if (!withCaption) errors.push({ code:'EMPTY_CAPTIONS', message:'후보의 모든 자막이 비어있습니다.' });
    }
    return { ok: errors.length === 0, errors: errors };
  }

  /* ── 송신 ── */
  function sendCandidate(candidate, opts) {
    opts = opts || {};
    var pf = preflight(candidate);
    if (!pf.ok) {
      _toast('❌ 전달 차단 — ' + (pf.errors[0] && pf.errors[0].message), 'error');
      return { ok: false, errors: pf.errors, written: { scenes: 0, prompts: 0 } };
    }
    var payload = _toPayload(candidate);
    /* localStorage handoff */
    try { localStorage.setItem(HANDOFF_KEY, JSON.stringify(payload)); }
    catch (e) {
      _toast('❌ 핸드오프 저장 실패: ' + (e && e.message), 'error');
      return { ok:false, errors:[{code:'localstorage-fail', message: e && e.message}],
               written: { scenes: 0, prompts: 0 } };
    }
    /* 같은 페이지 내 STUDIO 가 살아있으면 즉시 bridge */
    var bridgeResult = null;
    if (window.YT_BRIDGE && typeof window.YT_BRIDGE.bridgeToStep2 === 'function' &&
        window.STUDIO && window.STUDIO.project) {
      try { bridgeResult = window.YT_BRIDGE.bridgeToStep2(payload.scenes); } catch(_){}
    }
    var written = (bridgeResult && bridgeResult.ok)
      ? bridgeResult.written
      : { scenes: payload.scenes.length, prompts: payload.scenes.length };
    /* 결과 lastExport 에 mirror */
    if (window.RM_CORE) {
      var p = window.RM_CORE.project();
      p.lastExport = { at: Date.now(),
        result: { ok:true, written: written, errors:[], warnings:[] },
        mode: 'longform_clip', candidateId: candidate.candidateId };
      window.RM_CORE.save();
    }
    _toast('✅ 롱폼 후보 핸드오프 — ' + payload.scenes.length + ' 씬 (점수 ' + candidate.score + ')', 'success');
    return { ok: true, payload: payload, written: written };
  }

  /* ── Step 2 페이지 진입 (?source=longform_clip) ── */
  function gotoShortsStep2() {
    var url = '../../engines/shorts/index.html?step=2&source=longform_clip';
    window.location.assign(url);
  }
  /* sendCandidate + 즉시 navigate */
  function sendAndGoto(candidate) {
    var r = sendCandidate(candidate);
    if (!r.ok) return r;
    setTimeout(gotoShortsStep2, 200);
    return r;
  }

  window.RM_LONGFORM_EXPORT = {
    preflight:       preflight,
    sendCandidate:   sendCandidate,
    sendAndGoto:     sendAndGoto,
    gotoShortsStep2: gotoShortsStep2,
    HANDOFF_KEY:     HANDOFF_KEY,
  };
})();
