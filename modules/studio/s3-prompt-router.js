/* ================================================
   modules/studio/s3-prompt-router.js
   씬 수 ↔ 이미지/영상 프롬프트 수 동기화 + role 매핑
   * STUDIO.project.s1.sceneCount 가 정답 (없으면 파싱 결과)
   * compact-3 모드: 6→3 묶기 (비용절약)
   ================================================ */
(function(){
  'use strict';

  /* ── 씬 수별 default role 시퀀스 ── */
  const ROLE_SEQ = {
    3: ['hook', 'core', 'cta'],
    4: ['hook', 'setup', 'core', 'cta'],
    5: ['hook', 'setup', 'conflict_or_core', 'reveal_or_solution', 'cta'],
    6: ['hook', 'situation', 'core_cause', 'reversal', 'conclusion', 'cta'],
    7: ['hook', 'setup', 'situation', 'core_cause', 'reversal', 'conclusion', 'cta'],
  };

  function rolesForCount(n) {
    if (ROLE_SEQ[n]) return ROLE_SEQ[n].slice();
    if (n <= 2) return ['hook','cta'].slice(0, n);
    /* 7 이상 — 양 끝 hook/cta 고정, 중간을 core 로 채움 */
    var mid = n - 2;
    var arr = ['hook'];
    for (var i = 0; i < mid; i++) arr.push('core');
    arr.push('cta');
    return arr;
  }

  /* ── 정답 씬 수 결정 — s1.sceneCount 우선 ── */
  function resolveSceneCount(proj) {
    proj = proj || (window.STUDIO && window.STUDIO.project) || {};
    var s1 = proj.s1 || {};
    var n = parseInt(s1.sceneCount, 10);
    if (Number.isFinite(n) && n >= 2 && n <= 10) return n;
    /* fallback — 기존 s3.scenes 길이 */
    var s3 = proj.s3 || {};
    if (Array.isArray(s3.scenes) && s3.scenes.length) return s3.scenes.length;
    /* fallback — 길이 기반 추정 */
    var sec = parseInt(proj.lengthSec || s1.duration, 10) || 60;
    if (sec <= 30) return 3;
    if (sec <= 60) return 5;
    return 6;
  }

  /* ── compact-3 grouping (6→3 등) ──
     출력: [[srcIdx, srcIdx, ...], [srcIdx, ...], [srcIdx]]
     n=6 → [[0,1],[2,3],[4,5]]
     n=5 → [[0,1],[2,3],[4]]
     n=4 → [[0,1],[2],[3]]
     n=3 → [[0],[1],[2]]   (그대로)
     n=2 → [[0],[1]]       (그룹 2개)
  */
  function compactGroups(n, target) {
    target = target || 3;
    if (n <= target) {
      var arr = [];
      for (var i = 0; i < n; i++) arr.push([i]);
      return arr;
    }
    var groups = [];
    var per = Math.ceil(n / target);
    for (var g = 0; g < target; g++) {
      var start = g * per;
      var end   = Math.min(start + per, n);
      var grp = [];
      for (var k = start; k < end; k++) grp.push(k);
      if (grp.length) groups.push(grp);
    }
    return groups;
  }

  /* ── 씬 객체에 role + index 부여 ── */
  function annotateScenesWithRoles(scenes, count) {
    var roles = rolesForCount(count || (scenes && scenes.length) || 3);
    return (scenes || []).slice(0, roles.length).map(function(sc, i){
      var copy = Object.assign({}, sc);
      copy.role     = roles[i];
      copy.index    = i;
      copy.roleHint = (typeof window.s3GetRoleHint === 'function')
        ? window.s3GetRoleHint(roles[i]) : { composition:'medium shot', action:'show the scene' };
      return copy;
    });
  }

  /* ── 이미지 프롬프트 수를 씬 수에 맞게 trim/extend ──
     - mode='same-as-scenes' (기본): N개
     - mode='compact-3'             : 3개 (씬 그룹 묶기)
     반환: { count, mode, groups, prompts (조정된 배열) }
  */
  function syncImagePromptCount(proj, mode) {
    proj = proj || (window.STUDIO && window.STUDIO.project) || {};
    var s1 = proj.s1 || {};
    var s3 = proj.s3 || {};
    var sceneN = resolveSceneCount(proj);
    var resolvedMode = mode || s1.imagePromptMode || 'same-as-scenes';
    var targetCount, groups;
    if (resolvedMode === 'compact-3' && sceneN > 3) {
      groups = compactGroups(sceneN, 3);
      targetCount = groups.length;
    } else {
      groups = compactGroups(sceneN, sceneN);
      targetCount = sceneN;
      resolvedMode = 'same-as-scenes';
    }
    /* 기존 prompts 를 target 길이로 조정 */
    var srcA = s3.imagePrompts || [];
    var srcB = s3.prompts      || [];
    var srcC = s1.imagePrompts || [];
    var src  = srcA.length ? srcA : (srcB.length ? srcB : srcC);
    var out  = [];
    for (var i = 0; i < targetCount; i++) out.push(src[i] || '');

    return {
      count: targetCount,
      mode:  resolvedMode,
      sceneCount: sceneN,
      groups: groups,
      prompts: out,
    };
  }

  /* ── 영상 프롬프트 수도 동일 규칙 ── */
  function syncVideoPromptCount(proj, mode) {
    var r = syncImagePromptCount(proj, mode);
    var s3 = (proj || window.STUDIO.project).s3 || {};
    var src = s3.videoPrompts || [];
    var out = [];
    for (var i = 0; i < r.count; i++) out.push(src[i] || '');
    r.videoPrompts = out;
    return r;
  }

  /* ── 사용자가 모드를 바꿀 때 STUDIO 에 저장 + 동기화 ── */
  function setImagePromptMode(mode) {
    if (mode !== 'same-as-scenes' && mode !== 'compact-3') return false;
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    proj.s1 = proj.s1 || {};
    proj.s1.imagePromptMode = mode;
    if (typeof window.studioSave === 'function') window.studioSave();
    return true;
  }

  /* ── 외부 노출 ── */
  window.S3_ROLE_SEQ                = ROLE_SEQ;
  window.s3RolesForCount            = rolesForCount;
  window.s3ResolveSceneCount        = resolveSceneCount;
  window.s3CompactGroups            = compactGroups;
  window.s3AnnotateScenesWithRoles  = annotateScenesWithRoles;
  window.s3SyncImagePromptCount     = syncImagePromptCount;
  window.s3SyncVideoPromptCount     = syncVideoPromptCount;
  window.s3SetImagePromptMode       = setImagePromptMode;
})();
