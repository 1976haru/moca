/* ================================================
   modules/studio/s2-voice-favorites.js
   STEP 3 보조 — 음성 후보 즐겨찾기 / 최근 사용 저장소

   * 최근 사용: localStorage 'moca_voice_recent_v1'  (최대 10개, 시간 역순)
   * 즐겨찾기: localStorage 'moca_voice_favorites_v1' (사용자 명시 ★)
   * 항목: { id, label, provider, voiceId, gender, age, lang, ts }
   ================================================ */
(function(){
  'use strict';

  var KEY_RECENT = 'moca_voice_recent_v1';
  var KEY_FAVS   = 'moca_voice_favorites_v1';
  var MAX_RECENT = 10;
  var MAX_FAVS   = 30;

  function _vfvLoad(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return [];
      var v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch(_) { return []; }
  }
  function _vfvSave(key, arr) {
    try { localStorage.setItem(key, JSON.stringify(arr || [])); return true; }
    catch(_) { return false; }
  }

  /* ── 후보 객체 → 저장 항목 ── */
  function _vfvToEntry(cand, langKey) {
    if (!cand) return null;
    return {
      id:       cand.id,
      label:    cand.label || cand.id,
      provider: cand.provider || 'OA',
      voiceId:  cand.voiceId || cand.id,
      gender:   cand.gender || 'neutral',
      age:      cand.age    || 'middle',
      lang:     langKey === 'ja' ? 'ja' : 'ko',
      ts:       Date.now(),
    };
  }

  /* ── 최근 사용 ── */
  function vfvGetRecent() { return _vfvLoad(KEY_RECENT); }
  function vfvAddRecent(cand, langKey) {
    var entry = _vfvToEntry(cand, langKey);
    if (!entry) return;
    var arr = _vfvLoad(KEY_RECENT).filter(function(it){ return it.id !== entry.id; });
    arr.unshift(entry);
    if (arr.length > MAX_RECENT) arr = arr.slice(0, MAX_RECENT);
    _vfvSave(KEY_RECENT, arr);
  }
  function vfvClearRecent() { _vfvSave(KEY_RECENT, []); }

  /* ── 즐겨찾기 ── */
  function vfvGetFavorites() { return _vfvLoad(KEY_FAVS); }
  function vfvIsFavorite(id) {
    if (!id) return false;
    return _vfvLoad(KEY_FAVS).some(function(it){ return it.id === id; });
  }
  function vfvToggleFavorite(cand, langKey) {
    if (!cand || !cand.id) return false;
    var arr = _vfvLoad(KEY_FAVS);
    var idx = arr.findIndex(function(it){ return it.id === cand.id; });
    if (idx >= 0) {
      arr.splice(idx, 1);
      _vfvSave(KEY_FAVS, arr);
      return false; /* removed */
    }
    var entry = _vfvToEntry(cand, langKey);
    if (!entry) return false;
    arr.unshift(entry);
    if (arr.length > MAX_FAVS) arr = arr.slice(0, MAX_FAVS);
    _vfvSave(KEY_FAVS, arr);
    return true;   /* added */
  }
  function vfvClearFavorites() { _vfvSave(KEY_FAVS, []); }

  /* ── 전역 노출 ── */
  window.vfvGetRecent     = vfvGetRecent;
  window.vfvAddRecent     = vfvAddRecent;
  window.vfvClearRecent   = vfvClearRecent;
  window.vfvGetFavorites  = vfvGetFavorites;
  window.vfvIsFavorite    = vfvIsFavorite;
  window.vfvToggleFavorite= vfvToggleFavorite;
  window.vfvClearFavorites= vfvClearFavorites;
})();
