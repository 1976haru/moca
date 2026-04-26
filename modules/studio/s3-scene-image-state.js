/* ================================================
   modules/studio/s3-scene-image-state.js
   숏츠 스튜디오 — 이미지 선택 상태 공통 helper (2/2)
   * generated / stock / upload / reuse 모두 동일하게 인정
   * imagesV3 우선, legacy s3.images / s3.adopted fallback
   * adoptSceneImage 가 V3 + legacy 동시 동기화
   ================================================ */
(function(){
  'use strict';

  function _proj() { return (window.STUDIO && window.STUDIO.project) || {}; }
  function getS3State() {
    var p = _proj();
    p.s3 = p.s3 || {};
    p.s3.imagesV3 = p.s3.imagesV3 || {};
    return p.s3;
  }
  window.getS3State = getS3State;

  /* ── 단일 씬 상태 ── */
  function getSceneImageState(sceneIndex) {
    var s3 = getS3State();
    var slot = (s3.imagesV3 || {})[sceneIndex] || null;
    var legacyUrl = (s3.images || [])[sceneIndex] || '';
    var legacyAdopted = (s3.adopted || [])[sceneIndex];
    var skipped = !!(slot && slot.skipped);
    return {
      sceneIndex: sceneIndex,
      slot: slot,
      legacyUrl: legacyUrl,
      legacyAdopted: legacyAdopted,
      skipped: skipped,
    };
  }
  window.getSceneImageState = getSceneImageState;

  /* ── 씬의 최종 선택 이미지 — V3 우선, candidate id 로 url 복구 ── */
  function getSceneSelectedImage(sceneIndex) {
    var st = getSceneImageState(sceneIndex);
    if (st.skipped) return null;
    var slot = st.slot;
    /* 1) selectedCandidate 객체 직접 */
    if (slot && slot.selectedCandidate) {
      var sc = slot.selectedCandidate;
      var url = sc.url || sc.previewUrl || sc.fullUrl || sc.thumbUrl || '';
      if (url) return _normalizeCandidate(sc, slot.selectedSourceType || sc.sourceType);
    }
    /* 2) selectedCandidateId 로 candidates 에서 복구 */
    if (slot && slot.selectedCandidateId && slot.candidates && slot.candidates.length) {
      var found = slot.candidates.find(function(c){ return c.id === slot.selectedCandidateId; });
      if (found) {
        var u = found.url || found.previewUrl || found.fullUrl || found.thumbUrl || '';
        if (u) return _normalizeCandidate(found, slot.selectedSourceType || found.sourceType);
      }
    }
    /* 3) candidates 첫 번째 */
    if (slot && slot.candidates && slot.candidates[0]) {
      var first = slot.candidates[0];
      var u2 = first.url || first.previewUrl || first.fullUrl || first.thumbUrl || '';
      if (u2) return _normalizeCandidate(first, slot.selectedSourceType || first.sourceType);
    }
    /* 4) legacy s3.images[i] */
    if (st.legacyUrl) {
      return {
        id:'legacy_'+sceneIndex, url:st.legacyUrl, thumbUrl:st.legacyUrl,
        previewUrl:st.legacyUrl, fullUrl:st.legacyUrl,
        sourceType:'generated', provider:'legacy', type:'image',
      };
    }
    return null;
  }
  window.getSceneSelectedImage = getSceneSelectedImage;

  function _normalizeCandidate(c, sourceType) {
    var url = c.url || c.previewUrl || c.fullUrl || c.thumbUrl || '';
    return {
      id:        c.id || ('cand_' + Date.now().toString(36)),
      url:       url,
      thumbUrl:  c.thumbUrl  || c.previewUrl || url,
      previewUrl:c.previewUrl|| url,
      fullUrl:   c.fullUrl   || url,
      provider:  c.provider  || '',
      type:      c.type      || (url && /\.(mp4|mov|webm)(\?|$)/i.test(url) ? 'video' : 'image'),
      sourceType:sourceType  || c.sourceType || 'generated',
      aspectRatio: c.aspectRatio || '',
      width:     c.width  || 0,
      height:    c.height || 0,
      transform: c.transform || { scale:1, offsetX:0, offsetY:0, fit:'cover' },
      credit:    c.credit || '',
      creditUrl: c.creditUrl || '',
    };
  }
  window._s3NormalizeCandidate = _normalizeCandidate;

  /* ── 단순 boolean: 씬에 이미지 있나? ── */
  function hasSceneImage(sceneIndex) {
    var sel = getSceneSelectedImage(sceneIndex);
    return !!(sel && sel.url);
  }
  window.hasSceneImage = hasSceneImage;

  /* ── 선택된 씬 이미지 카운트 ── */
  function countSelectedSceneImages() {
    var s3 = getS3State();
    var n = (s3.scenes && s3.scenes.length) || Object.keys(s3.imagesV3 || {}).length || (s3.images || []).length || 0;
    var c = 0;
    for (var i = 0; i < n; i++) if (hasSceneImage(i)) c++;
    return c;
  }
  window.countSelectedSceneImages = countSelectedSceneImages;

  function hasAnySelectedImages() {
    return countSelectedSceneImages() > 0;
  }
  window.hasAnySelectedImages = hasAnySelectedImages;

  /* ── 비어있는 씬 인덱스 (사용자가 명시적으로 skipped 한 씬은 제외) ── */
  function getMissingImageSceneIndexes() {
    var s3 = getS3State();
    var n = (s3.scenes && s3.scenes.length) || Object.keys(s3.imagesV3 || {}).length || (s3.images || []).length || 0;
    var missing = [];
    for (var i = 0; i < n; i++) {
      var st = getSceneImageState(i);
      if (st.skipped) continue;
      if (!hasSceneImage(i)) missing.push(i);
    }
    return missing;
  }
  window.getMissingImageSceneIndexes = getMissingImageSceneIndexes;

  /* ── 씬에 이미지 적용 — V3 + legacy 동시 동기화 ──
     candidate: { url, [thumbUrl, previewUrl, fullUrl, provider, type, credit, ...] }
     sourceType: 'generated' | 'stock' | 'upload' | 'reuse' */
  function adoptSceneImage(sceneIndex, candidate, sourceType) {
    if (!candidate || !(candidate.url || candidate.previewUrl || candidate.fullUrl || candidate.thumbUrl)) return false;
    sourceType = sourceType || candidate.sourceType || 'generated';
    var s3 = getS3State();
    s3.imagesV3 = s3.imagesV3 || {};
    var slot = s3.imagesV3[sceneIndex] || {
      sceneIndex: sceneIndex, sceneNumber: sceneIndex + 1,
      candidates: [], selectedCandidateId: '', skipped: false,
    };
    var norm = _normalizeCandidate(candidate, sourceType);
    /* 동일 url 이 이미 후보에 있으면 그것 사용, 아니면 추가 */
    var existing = (slot.candidates || []).find(function(c){ return c.url === norm.url; });
    if (existing) {
      existing.sourceType = sourceType;
      existing.thumbUrl   = existing.thumbUrl   || norm.thumbUrl;
      existing.previewUrl = existing.previewUrl || norm.previewUrl;
      existing.fullUrl    = existing.fullUrl    || norm.fullUrl;
      existing.credit     = existing.credit     || norm.credit;
      existing.creditUrl  = existing.creditUrl  || norm.creditUrl;
      existing.provider   = existing.provider   || norm.provider;
      slot.selectedCandidateId = existing.id;
      slot.selectedCandidate   = existing;
    } else {
      slot.candidates.push(norm);
      slot.selectedCandidateId = norm.id;
      slot.selectedCandidate   = norm;
    }
    slot.selectedSourceType = sourceType;
    slot.skipped = false;
    s3.imagesV3[sceneIndex] = slot;

    /* legacy mirror */
    s3.images  = s3.images  || [];
    s3.adopted = s3.adopted || [];
    s3.images[sceneIndex]  = norm.url;
    s3.adopted[sceneIndex] = true;

    if (typeof window.studioSave === 'function') window.studioSave();
    try { console.log('[s3-state] adopted scene', sceneIndex+1, 'source:', sourceType, 'provider:', norm.provider); } catch(_) {}
    return true;
  }
  window.adoptSceneImage = adoptSceneImage;

  /* ── 씬 건너뛰기 ── */
  window.skipSceneImage = function(sceneIndex, val) {
    var s3 = getS3State();
    s3.imagesV3 = s3.imagesV3 || {};
    var slot = s3.imagesV3[sceneIndex] || { sceneIndex: sceneIndex, candidates: [] };
    slot.skipped = !!val;
    s3.imagesV3[sceneIndex] = slot;
    s3.adopted = s3.adopted || [];
    s3.adopted[sceneIndex] = !val;
    if (typeof window.studioSave === 'function') window.studioSave();
  };

  /* ── 전체 동기화 — V3 → legacy s3.images 미러 (기존 코드 호환) ── */
  function syncLegacySceneImages() {
    var s3 = getS3State();
    var v3 = s3.imagesV3 || {};
    s3.images  = s3.images  || [];
    s3.adopted = s3.adopted || [];
    Object.keys(v3).forEach(function(k){
      var i = +k;
      var sel = getSceneSelectedImage(i);
      if (sel) {
        s3.images[i]  = sel.url;
        s3.adopted[i] = true;
      } else if (v3[i] && v3[i].skipped) {
        s3.adopted[i] = false;
      }
    });
    if (typeof window.studioSave === 'function') window.studioSave();
  }
  window.syncLegacySceneImages = syncLegacySceneImages;

  /* 페이지 로드 시 자동 1회 동기화 */
  function _autoSync() {
    if (window.STUDIO && window.STUDIO.project) syncLegacySceneImages();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _autoSync);
  else _autoSync();
})();
