/* ================================================
   modules/studio/s1-youtube-import-bridge.js
   유튜브 import scenes → Step 2 bridge
   * 사용자 명세 schema 그대로 s1.scenes / project.scenes / s3.scenePrompts 작성
   * 작성 후 검증 — 비어있으면 명시적 실패 결과 반환
   * 조용한 실패 금지 — { ok, written, missing, errors } 로 모든 결과 노출
   ================================================ */
(function(){
  'use strict';

  function _proj() {
    var p = (window.STUDIO && window.STUDIO.project) || (window.STUDIO ? (window.STUDIO.project = {}) : null);
    if (!p) return null;
    p.s1 = p.s1 || {};
    p.s3 = p.s3 || {};
    return p;
  }

  /* ── role 매핑 (Step 2 v4 _resolveRole 호환 영어 코드) ── */
  function _roleCode(r) {
    var x = String(r || '').toLowerCase();
    if (/hook|훅/.test(x)) return 'hook';
    if (/setup|intro|도입|상황/.test(x)) return 'setup';
    if (/conflict|core|main|핵심|develop|전개|evidence|예시|증거/.test(x)) return 'conflict_or_core';
    if (/reveal|solution|resolve|반전|해결|payoff/.test(x)) return 'reveal_or_solution';
    if (/cta|outro|마무리|conclusion/.test(x)) return 'cta';
    return 'conflict_or_core';
  }

  /* ── Step 2 가 1순위로 읽는 schema 로 변환 ── */
  function _toStudioScene(sc, i) {
    var role = _roleCode(sc.role);
    var narration = sc.editedText || sc.translatedJa || sc.adaptedNarration || sc.originalText || sc.original || '';
    var caption   = sc.editedText || sc.adaptedCaption || sc.captionKo || sc.translatedJa || sc.captionJa || sc.originalText || sc.original || '';
    var visual    = sc.visualDescription || sc.visualReference || '';
    return {
      sceneIndex:        i,
      sceneNumber:       i + 1,
      role:              role,
      displayRole:       sc.roleLabel || role,
      narration:         narration,
      caption:           caption,
      captionKo:         sc.captionKo || '',
      captionJa:         sc.translatedJa || sc.captionJa || '',
      visualDescription: visual,
      visualReference:   sc.thumbnailUrl || '',
      label:             '씬 ' + (i + 1),
      desc:              visual || narration,
      text:              narration,
      imagePrompt:       sc.imagePrompt || '',
      videoPrompt:       sc.videoPrompt || '',
      promptCompiled:    sc.imagePrompt || '',
      thumbnailUrl:      sc.thumbnailUrl || '',
      previewStatus:     sc.previewStatus || 'missing',
      startSec:          sc.startSec,
      endSec:            sc.endSec,
      timeRange:         sc.timeRange || '',
      adaptedFromSourceSceneIndex: i,
      source:            'youtube_import',
      sourceType:        'youtube_import',
    };
  }

  /* ────────────────────────────────────────────
     bridgeToStep2(scenes, opts)
     - 사용자 명세 schema scenes 를 받아 Step 2 가 읽는 모든 경로를 채움
     - deleted scenes 는 export 에서 제외
     - 결과: { ok, written:{scenes,prompts}, errors[], warnings[] }
     ──────────────────────────────────────────── */
  function bridgeToStep2(scenes, opts) {
    opts = opts || {};
    var result = {
      ok: false,
      written: { scenes: 0, prompts: 0 },
      errors: [],
      warnings: [],
    };
    var p = _proj();
    if (!p) {
      result.errors.push({ code:'no-studio-project', message:'STUDIO.project 가 초기화되지 않았습니다.' });
      return result;
    }
    if (!Array.isArray(scenes)) {
      result.errors.push({ code:'no-scenes-array', message:'scenes 배열이 전달되지 않았습니다.' });
      return result;
    }

    /* deleted/skipped 제외 후 재인덱싱 */
    var visible = [];
    for (var i = 0; i < scenes.length; i++) {
      var sc = scenes[i];
      if (!sc) continue;
      if (sc.deleted) continue;
      if (sc.selected === false) continue;  /* 명시적 선택 해제 시도 — 기본 true 유지 */
      visible.push(Object.assign({}, sc));
    }
    if (!visible.length) {
      result.errors.push({ code:'empty-after-filter',
        message:'활성 씬이 0개입니다. 삭제된 씬을 복구하거나 선택을 켜세요.' });
      return result;
    }

    /* 기본 prompt seed — 비어있으면 v4 컴파일러가 채움 */
    visible.forEach(function(sc, k){
      if (!sc.imagePrompt) {
        var seed = sc.visualDescription || sc.editedText || sc.translatedJa || sc.originalText || sc.original || '';
        sc.imagePrompt = (seed ? seed + ' — ' : '') + '9:16 vertical, no text overlay, subtitle-safe composition';
      }
      if (!sc.videoPrompt) {
        var seed2 = sc.visualDescription || sc.editedText || sc.translatedJa || sc.originalText || sc.original || '';
        sc.videoPrompt = (seed2 ? seed2 + ' — ' : '') + 'short clip 3~5s, 9:16 vertical, smooth motion, no text';
      }
    });

    /* ⭐ Step 2 resolver primary order: s1.scenes → project.scenes → ... */
    var studioScenes = visible.map(_toStudioScene);
    p.s1.scenes = studioScenes;
    p.scenes    = studioScenes.slice();

    /* scriptText / scriptKo */
    p.scriptText  = studioScenes.map(function(sc){
      return '씬 ' + sc.sceneNumber + ' (' + (sc.displayRole || sc.role || '') + ')\n' +
             (sc.narration || '') +
             (sc.caption ? '\n자막: ' + sc.caption : '') +
             (sc.visualDescription ? '\n화면: ' + sc.visualDescription : '');
    }).join('\n\n');
    p.s1.scriptKo = p.scriptText;

    /* Step 2 prompt 호환 — promptOrder: s3.scenePrompts → s3.imagePrompts */
    p.s3.imagePrompts = studioScenes.map(function(sc){ return sc.imagePrompt || ''; });
    p.s3.videoPrompts = studioScenes.map(function(sc){ return sc.videoPrompt || ''; });
    p.s3.scenePrompts = studioScenes.map(function(sc, k){
      return {
        sceneIndex:        k,
        promptCompiled:    sc.imagePrompt || '',
        prompt:            sc.imagePrompt || '',
        imagePrompt:       sc.imagePrompt || '',
        videoPrompt:       sc.videoPrompt || '',
        narration:         sc.narration || '',
        caption:           sc.caption || '',
        originalCaption:   sc.text || sc.narration || '',
        captionKo:         sc.captionKo || '',
        captionJa:         sc.captionJa || '',
        translatedJa:      sc.captionJa || '',
        visualDescription: sc.visualDescription || '',
        visualReference:   sc.thumbnailUrl || '',
        thumbnailUrl:      sc.thumbnailUrl || '',
        previewStatus:     sc.previewStatus || 'missing',
        role:              sc.role,
        startSec:          sc.startSec,
        endSec:            sc.endSec,
        source:            'youtube_import',
        adaptedFromSourceSceneIndex: k,
      };
    });
    p.s3.prompts = p.s3.imagePrompts.slice();
    p.s3._hydrateSource = 'youtube-import-bridge';

    /* v4 컴파일러 자동 호출 — 비어있는 prompt 채움 */
    try {
      if (typeof window.compileImagePromptsV4All === 'function') window.compileImagePromptsV4All(p);
      if (typeof window.compileVideoPromptsV4All === 'function') window.compileVideoPromptsV4All(p);
      if (typeof window.s3ScoreAllAndStoreV4 === 'function') window.s3ScoreAllAndStoreV4();
    } catch(e) {
      result.warnings.push({ code:'v4-compile-skipped', message: e && e.message });
    }

    if (typeof window.studioSave === 'function') window.studioSave();

    /* ── 검증 ── */
    var verify = verifyBridge();
    result.written.scenes  = verify.scenesCount;
    result.written.prompts = verify.promptsCount;
    if (!verify.ok) {
      result.errors = result.errors.concat(verify.errors);
      return result;
    }

    result.ok = true;
    return result;
  }

  /* ── 작성 후 검증 — 모든 경로에 데이터가 들어갔는지 확인 ── */
  function verifyBridge() {
    var p = _proj();
    var out = { ok: false, scenesCount: 0, promptsCount: 0, errors: [] };
    if (!p) { out.errors.push({ code:'no-project', message:'STUDIO.project 없음' }); return out; }

    var s1Scenes = (p.s1 && p.s1.scenes) || [];
    var projScenes = p.scenes || [];
    var imgPrompts = (p.s3 && p.s3.imagePrompts) || [];
    var scenePrompts = (p.s3 && p.s3.scenePrompts) || [];

    out.scenesCount  = s1Scenes.length;
    out.promptsCount = scenePrompts.length;

    if (!s1Scenes.length) {
      out.errors.push({ code:'s1-scenes-empty', message:'STUDIO.project.s1.scenes 가 비어있습니다.' });
    }
    if (!projScenes.length) {
      out.errors.push({ code:'project-scenes-empty', message:'STUDIO.project.scenes 가 비어있습니다.' });
    }
    if (!imgPrompts.length) {
      out.errors.push({ code:'image-prompts-empty', message:'STUDIO.project.s3.imagePrompts 가 비어있습니다.' });
    }
    if (!scenePrompts.length) {
      out.errors.push({ code:'scene-prompts-empty', message:'STUDIO.project.s3.scenePrompts 가 비어있습니다.' });
    }
    if (s1Scenes.length && scenePrompts.length && s1Scenes.length !== scenePrompts.length) {
      out.errors.push({ code:'count-mismatch',
        message:'씬 개수 불일치: s1.scenes='+s1Scenes.length+' vs s3.scenePrompts='+scenePrompts.length });
    }
    out.ok = out.errors.length === 0;
    return out;
  }

  /* ── 자동 분석에서 받은 youtubeImportPacket 을 그대로 bridge ── */
  function bridgePacket(packet) {
    if (!packet || !packet.scenes) {
      return {
        ok: false,
        written: { scenes: 0, prompts: 0 },
        errors: [{ code:'no-packet', message:'youtubeImportPacket 이 비었습니다.' }],
        warnings: [],
      };
    }
    return bridgeToStep2(packet.scenes);
  }

  window.YT_BRIDGE = {
    bridgeToStep2:  bridgeToStep2,
    bridgePacket:   bridgePacket,
    verifyBridge:   verifyBridge,
  };
})();
