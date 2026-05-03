/* ================================================
   modules/agents/agent-core.js
   MOCA 1차 에이전트 — 검수·추천 (규칙 기반, 외부 API 호출 없음)
   * 공통 register / runOne / runAll / save / load 인프라
   * 에이전트는 register(agentId, fn) 으로 등록
   * fn(project) → { agentId, label, score, status, issues, suggestions, nextActions }
   ================================================ */
(function(){
  'use strict';

  var LS_KEY = 'moca_agent_reports_v1';
  var registry = [];
  var lastReports = [];

  /* ── 점수 → status 분류 ── */
  function classify(score) {
    var s = Math.max(0, Math.min(100, +score || 0));
    if (s >= 80) return 'good';
    if (s >= 50) return 'warn';
    return 'danger';
  }

  /* ── 등록: register(agentId, label, fn) ── */
  function register(agentId, label, fn) {
    if (!agentId || typeof fn !== 'function') return;
    /* 중복 등록 시 마지막 등록이 이김 */
    var i = registry.findIndex(function(a){ return a.agentId === agentId; });
    var entry = { agentId: agentId, label: label || agentId, fn: fn };
    if (i >= 0) registry[i] = entry; else registry.push(entry);
  }

  function listAgents() {
    return registry.map(function(a){ return { agentId: a.agentId, label: a.label }; });
  }

  /* ── 단일 에이전트 실행 ── */
  function runOne(agentId, project) {
    var entry = registry.find(function(a){ return a.agentId === agentId; });
    if (!entry) {
      return _emptyReport(agentId, agentId, '에이전트가 등록되지 않았습니다');
    }
    project = project || _proj();
    var report;
    try {
      report = entry.fn(project) || {};
    } catch (e) {
      return _emptyReport(agentId, entry.label, '실행 중 오류: ' + (e && e.message || e), 'danger');
    }
    /* 정규화 */
    var normalized = _normalize(agentId, entry.label, report);
    _mergeIntoLast(normalized);
    return normalized;
  }

  /* ── 모든 에이전트 실행 ── */
  function runAll(project) {
    project = project || _proj();
    lastReports = [];
    registry.forEach(function(entry){
      var report;
      try { report = entry.fn(project) || {}; }
      catch (e) {
        report = { score: 0, status: 'danger',
          issues: [{ code: 'EXEC_FAIL', message: '실행 중 오류: ' + (e && e.message) }] };
      }
      lastReports.push(_normalize(entry.agentId, entry.label, report));
    });
    save();
    return lastReports.slice();
  }

  function _normalize(agentId, label, r) {
    var score = (typeof r.score === 'number') ? Math.round(r.score) : 0;
    return {
      agentId:     agentId,
      label:       label,
      score:       score,
      status:      r.status || classify(score),
      issues:      Array.isArray(r.issues)      ? r.issues      : [],
      suggestions: Array.isArray(r.suggestions) ? r.suggestions : [],
      nextActions: Array.isArray(r.nextActions) ? r.nextActions : [],
      summary:     r.summary || '',
      ranAt:       Date.now(),
    };
  }
  function _emptyReport(agentId, label, msg, status) {
    return _normalize(agentId, label, {
      score: 0, status: status || 'danger',
      issues: [{ code: 'NO_AGENT', message: msg }],
      suggestions: [], nextActions: [],
    });
  }
  function _mergeIntoLast(report) {
    var i = lastReports.findIndex(function(r){ return r.agentId === report.agentId; });
    if (i >= 0) lastReports[i] = report; else lastReports.push(report);
  }

  /* ── STUDIO.project + localStorage 영속화 ── */
  function save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ reports: lastReports, savedAt: Date.now() }));
    } catch(_){}
    var p = _proj();
    if (p) {
      p.agentReports = lastReports.slice();
      if (typeof window.studioSave === 'function') {
        try { window.studioSave(); } catch(_){}
      }
    }
  }
  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      var j = JSON.parse(raw);
      if (j && Array.isArray(j.reports)) {
        lastReports = j.reports;
        return j.reports.slice();
      }
    } catch(_){}
    return [];
  }
  function getReports() { return lastReports.slice(); }

  function _proj() {
    return (window.STUDIO && window.STUDIO.project) || null;
  }

  /* ── 헬퍼 — 에이전트들이 공통으로 사용 ── */
  function _scenes(p) {
    if (!p) return [];
    if (Array.isArray(p.s1 && p.s1.scenes) && p.s1.scenes.length) return p.s1.scenes;
    if (Array.isArray(p.scenes) && p.scenes.length) return p.scenes;
    return [];
  }
  function _scriptText(p) {
    if (!p) return '';
    return p.scriptText || (p.s1 && p.s1.scriptKo) || (p.s1 && p.s1.scriptText) || '';
  }
  function _scriptJa(p) {
    if (!p) return '';
    return p.scriptJa || (p.s1 && p.s1.scriptJa) || '';
  }

  /* ── 사전 등록된 에이전트가 있을 경우 자동 로드 ── */
  load();

  window.MocaAgents = {
    register:    register,
    listAgents:  listAgents,
    runOne:      runOne,
    runAll:      runAll,
    getReports:  getReports,
    save:        save,
    load:        load,
    classify:    classify,
    /* helpers — 다른 agent 모듈이 사용 */
    _scenes:     _scenes,
    _scriptText: _scriptText,
    _scriptJa:   _scriptJa,
    _proj:       _proj,
  };
})();
