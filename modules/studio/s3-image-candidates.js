/* ================================================
   modules/studio/s3-image-candidates.js
   씬별 후보 이미지 배열 + legacy → V3 마이그레이션
   * 데이터 구조 일원화 — 기존 s3.images[] (단일 URL 배열) 유지하면서
     s3.imagesV3[sceneIdx] = {
       prompt, selectedCandidateId, skipped, transform,
       candidates: [{ id, url, originalUrl, provider, aspectRatio, width, height,
                      createdAt, status, transform }]
     } 동기화
   ================================================ */
(function(){
  'use strict';

  function _newId() {
    return 'img_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,7);
  }

  /* ── legacy → V3 마이그레이션 (기존 데이터 보존) ── */
  function normalizeImageState(proj) {
    proj = proj || (window.STUDIO && window.STUDIO.project) || {};
    proj.s3 = proj.s3 || {};
    var s3 = proj.s3;
    s3.imagesV3 = s3.imagesV3 || {};
    var legacyImages  = s3.images   || [];
    var legacyAdopted = s3.adopted  || [];
    var legacyV2      = s3.imagesV2 || {};
    var prompts       = s3.imagePrompts || s3.prompts || [];
    var scenes        = s3.scenes || [];
    var n = Math.max(scenes.length, legacyImages.length, Object.keys(legacyV2).length);
    if (!n) return s3.imagesV3;

    for (var i = 0; i < n; i++) {
      var slot = s3.imagesV3[i];
      if (!slot) {
        slot = {
          prompt: prompts[i] || '',
          selectedCandidateId: '',
          skipped: false,
          candidates: [],
          transform: { fit:'contain', scale:1, offsetX:0, offsetY:0, cropPreset:'center' },
        };
        s3.imagesV3[i] = slot;
      } else {
        slot.candidates = slot.candidates || [];
        slot.transform  = slot.transform  || { fit:'contain', scale:1, offsetX:0, offsetY:0, cropPreset:'center' };
        if (!slot.prompt && prompts[i]) slot.prompt = prompts[i];
      }
      /* legacy V2 후보 흡수 */
      var v2 = legacyV2[i];
      if (v2 && v2.candidates && v2.candidates.length) {
        v2.candidates.forEach(function(c){
          if (!slot.candidates.some(function(x){ return x.url === c.url; })) {
            slot.candidates.push({
              id: c.id || _newId(),
              url: c.url, originalUrl: c.url,
              provider: c.provider || '',
              aspectRatio: c.aspectRatio || '',
              width: c.width || 0, height: c.height || 0,
              createdAt: c.createdAt || Date.now(),
              status: c.status || 'ready',
              transform: { fit:'contain', scale:1, offsetX:0, offsetY:0, cropPreset:'center' },
            });
          }
        });
        if (!slot.selectedCandidateId && v2.selectedUrl) {
          var sel = slot.candidates.find(function(x){ return x.url === v2.selectedUrl; });
          if (sel) slot.selectedCandidateId = sel.id;
        }
        if (v2.skipped) slot.skipped = true;
      }
      /* legacy 단일 URL 흡수 */
      var legacy = legacyImages[i];
      if (legacy && !slot.candidates.some(function(x){ return x.url === legacy; })) {
        var c2 = {
          id: _newId(), url: legacy, originalUrl: legacy,
          provider: s3.api || '', aspectRatio: s3.aspectRatio || '',
          width: 0, height: 0, createdAt: Date.now(), status: 'ready',
          transform: { fit:'contain', scale:1, offsetX:0, offsetY:0, cropPreset:'center' },
        };
        slot.candidates.push(c2);
        if (!slot.selectedCandidateId) slot.selectedCandidateId = c2.id;
      }
      if (legacyAdopted[i] === false) slot.skipped = true;
      /* selectedCandidateId 가 비어있고 후보가 있으면 첫 번째 채택 */
      if (!slot.selectedCandidateId && slot.candidates.length) {
        slot.selectedCandidateId = slot.candidates[0].id;
      }
    }

    /* 호환 미러링 — s3.images / s3.adopted */
    s3.images  = s3.images  || [];
    s3.adopted = s3.adopted || [];
    Object.keys(s3.imagesV3).forEach(function(k){
      var i = +k;
      var sel = getSelectedCandidate(i);
      if (sel) s3.images[i] = sel.url;
      if (s3.imagesV3[i].skipped) s3.adopted[i] = false;
      else if (s3.images[i] && s3.adopted[i] !== false) s3.adopted[i] = true;
    });
    return s3.imagesV3;
  }
  window.s3NormalizeImageState = normalizeImageState;

  function getSlot(sceneIdx) {
    var s3 = (window.STUDIO && window.STUDIO.project && window.STUDIO.project.s3) || {};
    return (s3.imagesV3 || {})[sceneIdx] || null;
  }
  window.s3GetSlot = getSlot;

  function getSelectedCandidate(sceneIdx) {
    var slot = getSlot(sceneIdx);
    if (!slot || !slot.candidates) return null;
    if (slot.selectedCandidateId) {
      var c = slot.candidates.find(function(x){ return x.id === slot.selectedCandidateId; });
      if (c) return c;
    }
    return slot.candidates[0] || null;
  }
  window.s3GetSelectedCandidate = getSelectedCandidate;

  function getSelectedUrl(sceneIdx) {
    var c = getSelectedCandidate(sceneIdx);
    return c ? c.url : '';
  }
  window.s3GetSelectedUrl = getSelectedUrl;

  function addCandidate(sceneIdx, url, meta) {
    if (!url) return null;
    normalizeImageState();
    var s3 = window.STUDIO.project.s3;
    var slot = s3.imagesV3[sceneIdx];
    if (!slot) {
      slot = { prompt:'', selectedCandidateId:'', skipped:false, candidates:[], transform:{fit:'contain',scale:1,offsetX:0,offsetY:0,cropPreset:'center'} };
      s3.imagesV3[sceneIdx] = slot;
    }
    var c = {
      id: _newId(), url: url, originalUrl: url,
      provider: (meta && meta.provider) || s3.api || '',
      aspectRatio: (meta && meta.aspectRatio) || s3.aspectRatio || '',
      width: (meta && meta.width) || 0, height: (meta && meta.height) || 0,
      createdAt: Date.now(), status: 'ready',
      transform: { fit:'contain', scale:1, offsetX:0, offsetY:0, cropPreset:'center' },
    };
    slot.candidates.push(c);
    slot.selectedCandidateId = c.id;
    s3.images = s3.images || [];
    s3.images[sceneIdx] = url;
    s3.adopted = s3.adopted || [];
    s3.adopted[sceneIdx] = true;
    if (typeof window.studioSave === 'function') window.studioSave();
    return c;
  }
  window.s3AddCandidate = addCandidate;

  function selectCandidate(sceneIdx, candId) {
    var slot = getSlot(sceneIdx); if (!slot) return false;
    var c = slot.candidates.find(function(x){ return x.id === candId; });
    if (!c) return false;
    slot.selectedCandidateId = candId;
    var s3 = window.STUDIO.project.s3;
    s3.images = s3.images || []; s3.images[sceneIdx] = c.url;
    s3.adopted = s3.adopted || []; s3.adopted[sceneIdx] = true;
    slot.skipped = false;
    if (typeof window.studioSave === 'function') window.studioSave();
    return true;
  }
  window.s3SelectCandidate = selectCandidate;

  function deleteCandidate(sceneIdx, candId) {
    var slot = getSlot(sceneIdx); if (!slot) return false;
    var ix = slot.candidates.findIndex(function(x){ return x.id === candId; });
    if (ix < 0) return false;
    slot.candidates.splice(ix, 1);
    if (slot.selectedCandidateId === candId) {
      slot.selectedCandidateId = slot.candidates[0] ? slot.candidates[0].id : '';
      var s3 = window.STUDIO.project.s3;
      s3.images = s3.images || [];
      s3.images[sceneIdx] = slot.selectedCandidateId ? slot.candidates[0].url : '';
    }
    if (typeof window.studioSave === 'function') window.studioSave();
    return true;
  }
  window.s3DeleteCandidate = deleteCandidate;

  function setSkipped(sceneIdx, val) {
    var slot = getSlot(sceneIdx);
    if (!slot) {
      window.STUDIO.project.s3 = window.STUDIO.project.s3 || {};
      window.STUDIO.project.s3.imagesV3 = window.STUDIO.project.s3.imagesV3 || {};
      slot = { prompt:'', selectedCandidateId:'', skipped:!!val, candidates:[], transform:{fit:'contain',scale:1,offsetX:0,offsetY:0,cropPreset:'center'} };
      window.STUDIO.project.s3.imagesV3[sceneIdx] = slot;
    } else {
      slot.skipped = !!val;
    }
    var s3 = window.STUDIO.project.s3;
    s3.adopted = s3.adopted || [];
    s3.adopted[sceneIdx] = !val;
    if (typeof window.studioSave === 'function') window.studioSave();
  }
  window.s3SetSkipped = setSkipped;
})();
