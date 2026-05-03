/* ================================================
   modules/remix/rm-core.js
   영상 리믹스 스튜디오 — 코어 상태 / 프로젝트 / 단계 관리
   * 자동숏츠(STUDIO.project) 와는 별도의 remixProject 를 관리.
   * 자동숏츠로 보낼 때만 STUDIO.project 에 schema 매핑해 export.
   * localStorage key: 'remix_project_v1'
   ================================================ */
(function(){
  'use strict';

  var LS_KEY = 'remix_project_v1';
  var STAGES = [
    { id:'source',    label:'1. 소스' },
    { id:'caption',   label:'2. 자막/대본' },
    { id:'scenes',    label:'3. 장면 보드' },
    { id:'translate', label:'4. 번역/각색' },
    { id:'voice',     label:'5. 음성 교체' },
    { id:'export',    label:'6. 출력 / 자동숏츠' },
  ];

  function _newProject() {
    return {
      version:    1,
      createdAt:  Date.now(),
      updatedAt:  Date.now(),
      stage:      'source',
      /* 소스 */
      source: {
        type:       '',          /* 'youtube' | 'upload' | '' */
        youtubeUrl: '',
        videoId:    '',
        fileName:   '',
        fileBlobUrl:'',          /* URL.createObjectURL — 새 세션마다 재생성 */
        durationSec:0,
        title:      '',
        channel:    '',
      },
      /* 자막 raw + parsed */
      transcript: {
        raw:    '',              /* 사용자가 붙여넣은 원문 */
        format: '',              /* 'srt' | 'vtt' | 'plain' | 'timestamp' */
        cues:   [],              /* [{startSec, endSec, text}] */
      },
      /* scene 배열 — 사용자 명세 schema */
      scenes: [],
      /* 작업 모드 */
      mode:        'subtitle_only', /* subtitle_only | voice_replace | partial_rewrite | structure_only */
      captionLang: 'ja',            /* ko | ja | both */
      seniorTone:  true,
      /* 음성 교체 payload (Step 3 으로 보낼 때 채워짐) */
      voicePayload: null,
      /* 출력 / 진단 */
      lastExport: null,
      warnings:   [],
      errors:     [],
    };
  }

  /* ── 상태 (in-memory) ── */
  var P = null;

  function load() {
    if (P) return P;
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) {
        var j = JSON.parse(raw);
        if (j && j.version === 1) { P = j; return P; }
      }
    } catch(_) {}
    P = _newProject();
    return P;
  }
  function save() {
    if (!P) return;
    P.updatedAt = Date.now();
    try { localStorage.setItem(LS_KEY, JSON.stringify(P)); } catch(_) {}
  }
  function reset() {
    P = _newProject();
    try { localStorage.removeItem(LS_KEY); } catch(_) {}
    return P;
  }
  function project() { return load(); }

  /* ── stage navigation ── */
  function setStage(id) {
    if (!STAGES.some(function(s){ return s.id === id; })) return;
    load();
    P.stage = id;
    save();
  }
  function nextStage() {
    load();
    var i = STAGES.findIndex(function(s){ return s.id === P.stage; });
    if (i < 0 || i >= STAGES.length - 1) return P.stage;
    P.stage = STAGES[i + 1].id;
    save();
    return P.stage;
  }
  function prevStage() {
    load();
    var i = STAGES.findIndex(function(s){ return s.id === P.stage; });
    if (i <= 0) return P.stage;
    P.stage = STAGES[i - 1].id;
    save();
    return P.stage;
  }

  /* ── source ── */
  function setSource(patch) {
    load();
    P.source = Object.assign({}, P.source, patch || {});
    save();
  }
  /* ── transcript ── */
  function setTranscriptRaw(raw, format) {
    load();
    P.transcript.raw = String(raw || '');
    P.transcript.format = format || '';
    save();
  }
  function setTranscriptCues(cues, format) {
    load();
    P.transcript.cues = Array.isArray(cues) ? cues : [];
    if (format) P.transcript.format = format;
    save();
  }
  /* ── scenes ── */
  function setScenes(scenes) {
    load();
    P.scenes = Array.isArray(scenes) ? scenes : [];
    save();
  }
  function patchScene(idx, patch) {
    load();
    if (!P.scenes[idx]) return;
    P.scenes[idx] = Object.assign({}, P.scenes[idx], patch || {});
    save();
  }
  function selectedScenes() {
    load();
    return (P.scenes || []).filter(function(s){ return !s.deleted && s.selected !== false; });
  }
  function visibleScenes() {
    load();
    return (P.scenes || []).filter(function(s){ return !s.deleted; });
  }

  /* ── 작업 모드 ── */
  function setMode(mode) {
    if (!/^(subtitle_only|voice_replace|partial_rewrite|structure_only)$/.test(mode)) return;
    load();
    P.mode = mode;
    save();
  }
  function setCaptionLang(lang) {
    if (!/^(ko|ja|both)$/.test(lang)) return;
    load();
    P.captionLang = lang;
    save();
  }
  function setSeniorTone(on) { load(); P.seniorTone = !!on; save(); }

  /* ── 진단 (warnings / errors) ── */
  function pushWarning(code, message) {
    load();
    P.warnings = P.warnings || [];
    P.warnings.push({ code: code, message: message, at: Date.now() });
    save();
  }
  function pushError(code, message) {
    load();
    P.errors = P.errors || [];
    P.errors.push({ code: code, message: message, at: Date.now() });
    save();
  }
  function clearDiagnostics() {
    load();
    P.warnings = [];
    P.errors = [];
    save();
  }

  /* ── 기본 빈 scene seed (parser 가 비어있을 때 fallback) ── */
  function newEmptyScene(idx, opts) {
    opts = opts || {};
    return {
      id:               'rm_' + String(idx + 1).padStart(3, '0'),
      sceneIndex:       idx,
      sceneNumber:      idx + 1,
      startSec:         opts.startSec || 0,
      endSec:           opts.endSec   || 4,
      timeRange:        '',
      originalCaption:  opts.text || '',
      editedCaption:    '',
      captionJa:        '',
      captionBoth:      '',
      selected:         true,
      deleted:          false,
      thumbnailUrl:     '',
      frameUrl:         '',
      role:             '',
      roleLabel:        '',
      notes:            '',
      visualDescription:'',
      sourceType:       'video_remix_studio',
    };
  }

  /* ── public API ── */
  window.RM_CORE = {
    STAGES:       STAGES,
    load:         load,
    save:         save,
    reset:        reset,
    project:      project,
    setStage:     setStage,
    nextStage:    nextStage,
    prevStage:    prevStage,
    setSource:    setSource,
    setTranscriptRaw:  setTranscriptRaw,
    setTranscriptCues: setTranscriptCues,
    setScenes:    setScenes,
    patchScene:   patchScene,
    selectedScenes: selectedScenes,
    visibleScenes: visibleScenes,
    setMode:      setMode,
    setCaptionLang: setCaptionLang,
    setSeniorTone:  setSeniorTone,
    pushWarning:  pushWarning,
    pushError:    pushError,
    clearDiagnostics: clearDiagnostics,
    newEmptyScene: newEmptyScene,
  };
})();
