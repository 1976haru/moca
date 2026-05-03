/* ================================================
   modules/studio/s1-remix-handoff.js
   영상 리믹스 → 자동숏츠 cross-page 핸드오프 복원
   * engines/shorts/index.html 가 ?source=remix 로 진입하면
     localStorage['moca_remix_to_shorts_v1'] 를 읽어 STUDIO.project 에 적용.
   * shorts 페이지 init 코드는 항상 STUDIO.project = studioNewProjectObj() 로 새로 만들기 때문에
     이 모듈이 그 직후 실행되어 핸드오프 payload 를 그 신규 project 에 덮어 씀.
   * 적용 후 studioSave() 로 영구 저장 → renderStudio() 가 씬을 정상 렌더.
   ================================================ */
(function(){
  'use strict';

  var HANDOFF_KEY = 'moca_remix_to_shorts_v1';

  function _toast(msg, kind){
    if (typeof window.ucShowToast === 'function') {
      try { window.ucShowToast(msg, kind || 'info'); } catch(_){}
    } else {
      try { console.log('[remix-handoff]', kind || 'info', msg); } catch(_){}
    }
  }

  /* ── role 영어 코드 매핑 (Step 2 v4 _resolveRole 호환) ── */
  function _roleCode(r) {
    var x = String(r || '').toLowerCase();
    if (/hook|훅/.test(x)) return 'hook';
    if (/setup|intro|도입|상황/.test(x)) return 'setup';
    if (/conflict|core|main|핵심|develop|전개|evidence|예시|증거/.test(x)) return 'conflict_or_core';
    if (/reveal|solution|resolve|반전|해결|payoff/.test(x)) return 'reveal_or_solution';
    if (/cta|outro|마무리|conclusion/.test(x)) return 'cta';
    return 'conflict_or_core';
  }

  /* ── handoff payload → STUDIO.project schema 변환 ── */
  function _toStudioScene(sc, i) {
    var role = _roleCode(sc.role);
    var narration = sc.narration || sc.editedCaption || sc.captionJa || sc.originalCaption || '';
    var caption   = sc.caption   || sc.captionJa || sc.editedCaption || sc.originalCaption || '';
    return {
      sceneIndex:        i,
      sceneNumber:       i + 1,
      role:              role,
      displayRole:       sc.roleLabel || role,
      narration:         narration,
      caption:           caption,
      captionKo:         sc.captionKo || sc.editedCaption || sc.originalCaption || '',
      captionJa:         sc.captionJa || '',
      captionBoth:       sc.captionBoth || '',
      visualDescription: sc.visualDescription || '',
      visualReference:   sc.thumbnailUrl || '',
      label:             '씬 ' + (i + 1),
      desc:              sc.visualDescription || narration,
      text:              narration,
      imagePrompt:       sc.imagePrompt || '',
      videoPrompt:       sc.videoPrompt || '',
      promptCompiled:    sc.imagePrompt || '',
      thumbnailUrl:      sc.thumbnailUrl || '',
      previewStatus:     sc.previewStatus || 'placeholder',
      startSec:          sc.startSec,
      endSec:            sc.endSec,
      adaptedFromSourceSceneIndex: i,
      source:            'video_remix_studio',
      sourceType:        'video_remix_studio',
    };
  }

  /* ── 메인 — shorts 페이지 init 가 호출 (또는 자동 실행) ── */
  function applyHandoff() {
    /* URL 파라미터 검사 */
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.get('source') !== 'remix') return { ok: false, skip: true };
    } catch(_) { return { ok: false, skip: true }; }

    /* localStorage 에서 payload 읽기 */
    var raw;
    try { raw = localStorage.getItem(HANDOFF_KEY); } catch(_) { raw = null; }
    if (!raw) {
      _toast('⚠️ 영상 리믹스 핸드오프 데이터가 없습니다 — 빈 프로젝트로 진입합니다.', 'warn');
      return { ok: false, reason: 'no-payload' };
    }
    var payload;
    try { payload = JSON.parse(raw); }
    catch(e) {
      _toast('❌ 핸드오프 데이터 파싱 실패: ' + (e && e.message), 'error');
      return { ok: false, reason: 'parse-error', error: e && e.message };
    }
    if (!payload || !Array.isArray(payload.scenes) || !payload.scenes.length) {
      _toast('⚠️ 핸드오프 데이터에 씬이 없습니다.', 'warn');
      return { ok: false, reason: 'empty-scenes' };
    }

    /* STUDIO.project 보장 */
    if (!window.STUDIO) window.STUDIO = {};
    if (!window.STUDIO.project) {
      if (typeof window.studioNewProjectObj === 'function') {
        window.STUDIO.project = window.studioNewProjectObj();
      } else {
        window.STUDIO.project = { s1:{}, s2:{}, s3:{}, scenes:[] };
      }
    }
    var proj = window.STUDIO.project;
    proj.s1 = proj.s1 || {};
    proj.s2 = proj.s2 || {};
    proj.s3 = proj.s3 || {};

    /* scene 매핑 */
    var studioScenes = payload.scenes.map(_toStudioScene);
    proj.s1.scenes = studioScenes;
    proj.scenes    = studioScenes.slice();

    /* 빈 prompt 시드 — v4 컴파일러가 채울 수 있게 visualDescription/narration 으로 */
    proj.s3.imagePrompts = studioScenes.map(function(sc){
      if (sc.imagePrompt) return sc.imagePrompt;
      var seed = sc.visualDescription || sc.narration || sc.caption || '';
      return (seed ? seed + ' — ' : '') + '9:16 vertical, no text overlay, subtitle-safe composition';
    });
    proj.s3.videoPrompts = studioScenes.map(function(sc){
      if (sc.videoPrompt) return sc.videoPrompt;
      var seed = sc.visualDescription || sc.narration || sc.caption || '';
      return (seed ? seed + ' — ' : '') + 'short clip 3~5s, 9:16 vertical, smooth motion, no text';
    });
    proj.s3.scenePrompts = studioScenes.map(function(sc, i){
      return {
        sceneIndex:        i,
        promptCompiled:    proj.s3.imagePrompts[i],
        prompt:            proj.s3.imagePrompts[i],
        imagePrompt:       proj.s3.imagePrompts[i],
        videoPrompt:       proj.s3.videoPrompts[i],
        narration:         sc.narration,
        caption:           sc.caption,
        captionKo:         sc.captionKo,
        captionJa:         sc.captionJa,
        originalCaption:   sc.captionKo || sc.narration,
        translatedJa:      sc.captionJa,
        visualDescription: sc.visualDescription,
        visualReference:   sc.thumbnailUrl,
        thumbnailUrl:      sc.thumbnailUrl,
        previewStatus:     sc.previewStatus,
        role:              sc.role,
        startSec:          sc.startSec,
        endSec:            sc.endSec,
        source:            'video_remix_studio',
        adaptedFromSourceSceneIndex: i,
      };
    });
    proj.s3.prompts = proj.s3.imagePrompts.slice();
    proj.s3._hydrateSource = 'remix-handoff';

    /* scriptText / scriptKo / scriptJa */
    proj.scriptText = studioScenes.map(function(sc){
      return '씬 ' + sc.sceneNumber + ' (' + (sc.displayRole || '') + ')\n' +
        (sc.narration || '') +
        (sc.caption ? '\n자막: ' + sc.caption : '') +
        (sc.visualDescription ? '\n화면: ' + sc.visualDescription : '');
    }).join('\n\n');
    proj.s1.scriptKo = studioScenes.map(function(sc){ return sc.captionKo || sc.narration; }).filter(Boolean).join('\n\n');
    proj.s1.scriptJa = studioScenes.map(function(sc){ return sc.captionJa; }).filter(Boolean).join('\n\n');

    /* 메타 — 어디서 왔는지 표시 */
    proj.remixSource = {
      url:        (payload.remixSource && payload.remixSource.url)        || '',
      videoId:    (payload.remixSource && payload.remixSource.videoId)    || '',
      title:      (payload.remixSource && payload.remixSource.title)      || '',
      type:       (payload.remixSource && payload.remixSource.type)       || '',
      durationSec:(payload.remixSource && payload.remixSource.durationSec)|| 0,
      mode:       payload.mode || '',
      sceneCount: payload.sceneCount || studioScenes.length,
      sentAt:     payload.sentAt || Date.now(),
    };
    /* step 2 로 진입 */
    proj.step = 2;

    /* v4 컴파일러 자동 호출 — 비어있는 prompt 채움 */
    try {
      if (typeof window.compileImagePromptsV4All === 'function') window.compileImagePromptsV4All(proj);
      if (typeof window.compileVideoPromptsV4All === 'function') window.compileVideoPromptsV4All(proj);
      if (typeof window.s3ScoreAllAndStoreV4 === 'function') window.s3ScoreAllAndStoreV4();
    } catch(e) { try { console.debug('[remix-handoff] v4 compile skipped', e && e.message); } catch(_){} }

    /* 영구 저장 */
    if (typeof window.studioSave === 'function') {
      try { window.studioSave(); } catch(_){}
    }

    /* 핸드오프 키 정리 — 다음 진입 때 stale 데이터 안 읽도록 */
    try { localStorage.removeItem(HANDOFF_KEY); } catch(_){}

    var toastMsg = '✅ 영상 리믹스에서 ' + studioScenes.length + '개 장면을 가져왔어요';
    _toast(toastMsg, 'success');
    try { console.log('[remix-handoff]', toastMsg, '· source:', proj.remixSource); } catch(_){}

    return {
      ok: true,
      sceneCount: studioScenes.length,
      remixSource: proj.remixSource,
      counts: {
        s1Scenes:       proj.s1.scenes.length,
        projectScenes:  proj.scenes.length,
        s3ImagePrompts: proj.s3.imagePrompts.length,
        s3VideoPrompts: proj.s3.videoPrompts.length,
        s3ScenePrompts: proj.s3.scenePrompts.length,
      },
    };
  }

  window.MOCA_REMIX_HANDOFF = {
    HANDOFF_KEY: HANDOFF_KEY,
    apply:       applyHandoff,
  };

  /* ── 자동 실행 ──
     shorts 페이지 inline init 에서 STUDIO.project 를 새로 만든 직후에 동작해야 한다.
     DOMContentLoaded 시점이면 inline init 보다 늦을 수 있으므로 즉시 시도 후
     DOMContentLoaded 에서도 한 번 더 시도. 적용은 idempotent — payload 는 1회만 처리.
     (성공 시 localStorage 에서 키 제거되므로 두 번째 호출은 자동으로 skip) */
  function _autoApply() { try { applyHandoff(); } catch(_){} }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _autoApply);
  } else {
    /* 즉시 — STUDIO 가 아직 없을 수 있으니 setTimeout 0 으로 한번 미룸 */
    setTimeout(_autoApply, 0);
  }
})();
