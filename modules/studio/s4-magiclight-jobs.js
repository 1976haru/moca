/* ================================================
   modules/studio/s4-magiclight-jobs.js
   Magiclight 작업 상태 store

   * STUDIO.project.s4.magiclight 구조 보장 + helper
   * mlj* helpers — 패널 UI 가 호출
   ================================================ */
(function(){
  'use strict';

  function _proj() { return (window.STUDIO && window.STUDIO.project) || {}; }

  function mljEnsureRoot() {
    var p = _proj();
    p.s4 = p.s4 || {};
    p.s4.magiclight = p.s4.magiclight || {
      provider: 'magiclight',
      selectedMode: 'scene_text_to_video',
      aspectRatio: '9:16',
      resolution: '1080p',
      jobs: [],          /* sceneIndex 순으로 정렬 */
      storyJob: null,
      lastRunAt: '',
      totalEstimatedCredits: null,
    };
    return p.s4.magiclight;
  }
  window.mljEnsureRoot = mljEnsureRoot;

  function mljGetJob(sceneIndex) {
    var ml = mljEnsureRoot();
    return ml.jobs.find(function(j){ return j.sceneIndex === sceneIndex; }) || null;
  }
  window.mljGetJob = mljGetJob;

  function mljUpsertJob(sceneIndex, patch) {
    var ml = mljEnsureRoot();
    var idx = ml.jobs.findIndex(function(j){ return j.sceneIndex === sceneIndex; });
    var now = new Date().toISOString();
    var base = (idx >= 0) ? ml.jobs[idx] : {
      sceneIndex: sceneIndex,
      mode: ml.selectedMode,
      status: 'idle',
      jobId: '',
      requestPayload: {},
      resultRaw: {},
      result: { videoUrl:'', thumbUrl:'', durationSec:0, width:0, height:0, provider:'magiclight' },
      error: '',
      createdAt: now,
      updatedAt: now,
      creditEstimate: null,
    };
    var next = Object.assign({}, base, patch || {}, { updatedAt: now });
    if (idx >= 0) ml.jobs[idx] = next; else ml.jobs.push(next);
    if (typeof window.studioSave === 'function') window.studioSave();
    return next;
  }
  window.mljUpsertJob = mljUpsertJob;

  function mljSetMode(mode) {
    var ml = mljEnsureRoot();
    ml.selectedMode = mode;
    if (typeof window.studioSave === 'function') window.studioSave();
  }
  window.mljSetMode = mljSetMode;

  function mljClearJob(sceneIndex) {
    var ml = mljEnsureRoot();
    ml.jobs = ml.jobs.filter(function(j){ return j.sceneIndex !== sceneIndex; });
    if (typeof window.studioSave === 'function') window.studioSave();
  }
  window.mljClearJob = mljClearJob;

  /* 결과 채택 — sceneVideos 에 저장 + editPlan 호환 */
  function mljAdoptResult(sceneIndex) {
    var job = mljGetJob(sceneIndex);
    if (!job || !job.result || !job.result.videoUrl) return false;
    var p = _proj();
    p.s4 = p.s4 || {};
    p.s4.sceneVideos = p.s4.sceneVideos || [];
    p.s4.sceneVideos[sceneIndex] = {
      provider:    'magiclight',
      videoUrl:    job.result.videoUrl,
      thumbUrl:    job.result.thumbUrl,
      durationSec: job.result.durationSec,
      sourceJobId: job.jobId,
      sourceMode:  job.mode,
      sceneIndex:  sceneIndex,
    };
    /* editPlan.scenes[i].videoSource 호환 */
    p.editPlan = p.editPlan || { scenes: [] };
    p.editPlan.scenes = p.editPlan.scenes || [];
    p.editPlan.scenes[sceneIndex] = Object.assign({}, p.editPlan.scenes[sceneIndex] || {}, {
      videoSource: { type:'magiclight', url: job.result.videoUrl, provider:'magiclight' },
    });
    if (typeof window.studioSave === 'function') window.studioSave();
    return true;
  }
  window.mljAdoptResult = mljAdoptResult;

  /* 비용 추정 (응답에 creditsUsed 있을 때만 합산) */
  function mljSumCredits() {
    var ml = mljEnsureRoot();
    var sum = 0, hasAny = false;
    ml.jobs.forEach(function(j){
      var c = j.result && (j.result.creditsUsed || j.result.creditEstimate);
      if (typeof c === 'number') { sum += c; hasAny = true; }
    });
    return hasAny ? sum : null;
  }
  window.mljSumCredits = mljSumCredits;
})();
