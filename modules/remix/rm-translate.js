/* ================================================
   modules/remix/rm-translate.js
   영상 리믹스 스튜디오 — 일본어 자막 번역 / 톤 변형
   * YT_REMIX_ADAPTER.translateCaption / adaptSceneTone 재사용
   * 시니어 친화 톤 / 캐주얼 / 더 짧게 / 더 자연스럽게
   * 결과는 RM_CORE.patchScene 로 저장
   ================================================ */
(function(){
  'use strict';

  function _toast(msg, kind){
    if (typeof window.ucShowToast === 'function') window.ucShowToast(msg, kind || 'info');
  }
  function _adapter() {
    return window.YT_REMIX_ADAPTER && typeof window.YT_REMIX_ADAPTER.translateCaption === 'function'
      ? window.YT_REMIX_ADAPTER : null;
  }

  /* ── 한 씬 일본어 번역 ── */
  async function translateOne(idx, opts) {
    opts = opts || {};
    var p = window.RM_CORE.project();
    var sc = (p.scenes || [])[idx];
    if (!sc) return null;
    var src = sc.originalCaption || sc.editedCaption || '';
    if (!src.trim()) { _toast('⚠️ 빈 자막 — 번역할 원본이 없습니다.', 'warn'); return null; }
    var ad = _adapter();
    if (!ad) { _toast('❌ 번역 어댑터 미로드', 'error'); return null; }
    try {
      var ja = await ad.translateCaption(src, 'ja', {
        seniorTone: opts.seniorTone != null ? !!opts.seniorTone : !!p.seniorTone,
        context:    opts.context || p.source.title || '',
      });
      if (ja) {
        window.RM_CORE.patchScene(idx, { captionJa: ja });
        return ja;
      }
    } catch(e) { _toast('❌ 번역 실패: ' + (e && e.message || e), 'error'); }
    return null;
  }

  /* ── 전체 / 선택 일괄 번역 ──
     onProgress: function(i, total, ok, fail) */
  async function translateBatch(filter, opts, onProgress) {
    opts = opts || {};
    var p = window.RM_CORE.project();
    var scenes = (p.scenes || []).filter(function(sc){
      if (sc.deleted) return false;
      if (filter === 'selected' && sc.selected === false) return false;
      return true;
    });
    if (!scenes.length) { _toast('⚠️ 대상 씬이 없습니다.', 'warn'); return { ok: 0, fail: 0 }; }
    var ad = _adapter();
    if (!ad) { _toast('❌ 번역 어댑터 미로드', 'error'); return { ok: 0, fail: 0 }; }
    var ok = 0, fail = 0;
    for (var i = 0; i < scenes.length; i++) {
      var sc = scenes[i];
      var src = sc.originalCaption || sc.editedCaption || '';
      if (!src.trim()) continue;
      try {
        var ja = await ad.translateCaption(src, 'ja', {
          seniorTone: opts.seniorTone != null ? !!opts.seniorTone : !!p.seniorTone,
          context:    opts.context || p.source.title || '',
        });
        if (ja) {
          window.RM_CORE.patchScene(sc.sceneIndex, { captionJa: ja });
          ok++;
        } else fail++;
      } catch(_) { fail++; }
      if (typeof onProgress === 'function') {
        try { onProgress(i + 1, scenes.length, ok, fail); } catch(_) {}
      }
    }
    return { ok: ok, fail: fail };
  }

  /* ── 변형: shorter / natural / senior / casual ──
     1) 한국어 시드(원본/edited)에 톤 변형 적용 (한국어 결과)
     2) 일본어로 다시 번역 → captionJa 갱신 */
  async function variantOne(idx, variant, opts) {
    opts = opts || {};
    var p = window.RM_CORE.project();
    var sc = (p.scenes || [])[idx];
    if (!sc) return null;
    var ad = _adapter();
    if (!ad || typeof ad.adaptSceneTone !== 'function') {
      _toast('❌ 톤 변형 어댑터 미로드', 'error'); return null;
    }
    var seed = sc.editedCaption || sc.originalCaption || '';
    if (!seed.trim()) { _toast('⚠️ 변형할 원본이 없습니다.', 'warn'); return null; }
    var v = ({
      shorter: 'shorter',
      natural: 'natural',
      senior:  'senior',
      casual:  'natural',
    })[variant] || 'natural';
    try {
      var sceneSeed = {
        adaptedNarration: seed,
        original:         sc.originalCaption,
        roleLabel:        sc.roleLabel,
      };
      var next = await ad.adaptSceneTone(sceneSeed, v, { newTopic: '', role: sc.roleLabel });
      var newKo = (next && (next.adaptedNarration || next.captionJa)) || '';
      if (!newKo) return null;
      /* 일본어로 재번역 */
      var ja = await ad.translateCaption(newKo, 'ja', {
        seniorTone: variant === 'senior' ? true : (opts.seniorTone != null ? !!opts.seniorTone : !!p.seniorTone),
        context:    opts.context || p.source.title || '',
      });
      var patch = { editedCaption: newKo };
      if (ja) patch.captionJa = ja;
      window.RM_CORE.patchScene(idx, patch);
      return patch;
    } catch(e) {
      _toast('❌ 변형 실패: ' + (e && e.message || e), 'error');
      return null;
    }
  }

  /* ── 한국어 다듬기 (editedCaption 만 갱신) ── */
  async function polishKo(idx, opts) {
    opts = opts || {};
    var p = window.RM_CORE.project();
    var sc = (p.scenes || [])[idx];
    if (!sc) return null;
    var ad = _adapter();
    if (!ad || typeof ad.adaptSceneTone !== 'function') return null;
    var seed = sc.editedCaption || sc.originalCaption || '';
    if (!seed.trim()) return null;
    try {
      var sceneSeed = { adaptedNarration: seed, original: sc.originalCaption };
      var next = await ad.adaptSceneTone(sceneSeed, 'natural', {});
      var newKo = (next && next.adaptedNarration) || '';
      if (newKo) {
        window.RM_CORE.patchScene(idx, { editedCaption: newKo });
        return newKo;
      }
    } catch(_) {}
    return null;
  }

  /* ── 한일 동시 자막 (captionBoth) 생성 ── */
  function buildBothCaption(idx) {
    var p = window.RM_CORE.project();
    var sc = (p.scenes || [])[idx];
    if (!sc) return '';
    var ko = sc.editedCaption || sc.originalCaption || '';
    var ja = sc.captionJa || '';
    var both = [ko, ja].filter(Boolean).join('\n');
    if (both) window.RM_CORE.patchScene(idx, { captionBoth: both });
    return both;
  }
  function buildBothAll() {
    var p = window.RM_CORE.project();
    (p.scenes || []).forEach(function(sc, i){ if (!sc.deleted) buildBothCaption(i); });
  }

  window.RM_TRANSLATE = {
    translateOne:    translateOne,
    translateBatch:  translateBatch,  /* filter: 'all' | 'selected' */
    variantOne:      variantOne,
    polishKo:        polishKo,
    buildBothCaption:buildBothCaption,
    buildBothAll:    buildBothAll,
  };
})();
