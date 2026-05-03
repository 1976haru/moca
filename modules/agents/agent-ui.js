/* ================================================
   modules/agents/agent-ui.js
   MOCA 에이전트 점검 UI — Step 5 자동 검수 화면에 자동 주입
   * MutationObserver 로 .s5v-wrap 또는 .s5v-body 가 나타나면 첫 번째 t1 위에 panel 삽입
   * 카드 3개 — 점수 / 상태 / 이슈 / 제안 / 다음 행동 버튼
   * 전체 / 개별 실행 / 다음 행동 → 단계 이동 (studioGoto)
   ================================================ */
(function(){
  'use strict';

  var INJECT_ID = 'moca-agents-panel';

  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  /* ── 패널 HTML 생성 ── */
  function _renderPanelHtml(reports) {
    var hasReports = Array.isArray(reports) && reports.length > 0;
    return '<div id="'+INJECT_ID+'" class="moca-agents">' +
      '<div class="ma-hd">' +
        '<div class="ma-title">🤖 AI 에이전트 점검 <small>규칙 기반 1차 검수 — 외부 API 호출 없음</small></div>' +
        '<div class="ma-actions">' +
          '<button class="ma-btn pri" type="button" onclick="MocaAgentsUI.runAll()">▶ 전체 에이전트 실행</button>' +
          (hasReports ? '<button class="ma-btn" type="button" onclick="MocaAgentsUI.refresh()">🔄 다시 그리기</button>' : '') +
        '</div>' +
      '</div>' +
      (hasReports
        ? '<div class="ma-cards">' + reports.map(_renderCard).join('') + '</div>'
        : '<div class="ma-empty">▶ 위 "전체 에이전트 실행" 을 눌러 점검을 시작하세요. ' +
          '실행하지 않아도 Step 5 출력은 정상 동작합니다.</div>') +
    '</div>';
  }

  function _renderCard(r) {
    var statusLabel = r.status === 'good' ? '✅ 양호' : r.status === 'warn' ? '⚠️ 주의' : '❌ 위험';
    var emoji = r.agentId === 'shorts_quality' ? '🎬' : r.agentId === 'cost_api' ? '💰' : r.agentId === 'final_check' ? '📋' : '🤖';
    return '<div class="ma-card '+_esc(r.status)+'">' +
      '<div class="ma-card-hd">' +
        '<span class="ma-card-emoji">'+emoji+'</span>' +
        '<span class="ma-card-label">'+_esc(r.label)+'</span>' +
        '<span class="ma-card-score">'+r.score+'<small>/100</small></span>' +
        '<span class="ma-card-status">'+statusLabel+'</span>' +
      '</div>' +
      (r.summary ? '<div class="ma-card-summary">'+_esc(r.summary)+'</div>' : '') +
      (r.issues.length
        ? '<div class="ma-section"><b>주요 문제 ('+r.issues.length+')</b><ul>' +
            r.issues.slice(0, 6).map(function(i){
              return '<li><code>'+_esc(i.code)+'</code> '+_esc(i.message)+'</li>';
            }).join('') +
          '</ul></div>'
        : '') +
      (r.suggestions.length
        ? '<div class="ma-section"><b>추천</b><ul>' +
            r.suggestions.slice(0, 4).map(function(s){ return '<li>'+_esc(s)+'</li>'; }).join('') +
          '</ul></div>'
        : '') +
      (r.nextActions.length
        ? '<div class="ma-actions-row">' +
            r.nextActions.slice(0, 4).map(function(a){
              return '<button class="ma-btn sm" type="button" onclick="MocaAgentsUI.gotoStep('+(a.step||0)+')">→ '+_esc(a.label)+'</button>';
            }).join('') +
          '</div>'
        : '') +
      '<div class="ma-card-foot">' +
        '<button class="ma-btn sm" type="button" onclick="MocaAgentsUI.runOne(\''+_esc(r.agentId)+'\')">↻ 다시 실행</button>' +
        '<small class="ma-card-time">' + (r.ranAt ? new Date(r.ranAt).toLocaleTimeString() : '') + '</small>' +
      '</div>' +
    '</div>';
  }

  /* ── 패널 주입 — Step 5 t1 위 / 또는 .s5v-body 첫 자식 ── */
  function _inject() {
    if (!window.MocaAgents) return false;
    /* 이미 있으면 reports 만 갱신 */
    var existing = document.getElementById(INJECT_ID);
    if (existing) {
      var reports = window.MocaAgents.getReports();
      if (reports.length) existing.outerHTML = _renderPanelHtml(reports);
      return true;
    }
    /* 진입점 후보 — Step 5 t1 (프로젝트 검수) 활성 시 */
    var body = document.querySelector('.s5v-body');
    if (!body) return false;
    /* t1 활성 검사 — `.s5v-tab.on` 의 텍스트가 "프로젝트 검수" 포함 */
    var activeTab = document.querySelector('.s5v-tab.on');
    if (!activeTab) return false;
    if (activeTab.textContent.indexOf('프로젝트') < 0 && activeTab.textContent.indexOf('검수') < 0) {
      /* t1 이 아니면 panel 제거 */
      return false;
    }
    var html = _renderPanelHtml(window.MocaAgents.getReports());
    var div = document.createElement('div');
    div.innerHTML = html;
    body.insertBefore(div.firstChild, body.firstChild);
    return true;
  }

  /* ── MutationObserver 로 Step 5 렌더 감지 ── */
  function _setupObserver() {
    if (typeof MutationObserver === 'undefined') return;
    var target = document.body;
    if (!target) return;
    var debounceTimer = null;
    var obs = new MutationObserver(function(){
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(_inject, 100);
    });
    obs.observe(target, { childList: true, subtree: true });
    /* 초기 한 번 시도 */
    setTimeout(_inject, 200);
  }

  /* ── public API ── */
  window.MocaAgentsUI = {
    runAll: function() {
      if (!window.MocaAgents) return;
      window.MocaAgents.runAll();
      _refresh();
    },
    runOne: function(agentId) {
      if (!window.MocaAgents) return;
      window.MocaAgents.runOne(agentId);
      _refresh();
    },
    gotoStep: function(step) {
      if (!step || typeof window.studioGoto !== 'function') return;
      try { window.studioGoto(step); } catch(_){}
    },
    refresh: function() { _refresh(); },
    inject: _inject,
  };

  function _refresh() {
    /* 패널 다시 그리기 — 같은 panel 위치에 outerHTML 교체 */
    var existing = document.getElementById(INJECT_ID);
    var html = _renderPanelHtml(window.MocaAgents ? window.MocaAgents.getReports() : []);
    if (existing) {
      var div = document.createElement('div');
      div.innerHTML = html;
      existing.parentNode.replaceChild(div.firstChild, existing);
    } else {
      _inject();
    }
  }

  /* ── 부팅 — DOM 준비 후 observer 시작 ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _setupObserver);
  } else {
    setTimeout(_setupObserver, 0);
  }

  /* CSS 동적 주입 */
  function _injectCSS() {
    if (document.getElementById('moca-agents-style')) return;
    var existing = document.querySelector('script[src*="agent-ui.js"]');
    var href;
    if (existing && existing.src) {
      href = existing.src.replace(/agent-ui\.js.*$/, 'agent-ui.css');
    } else {
      href = '/modules/agents/agent-ui.css';
    }
    var link = document.createElement('link');
    link.id = 'moca-agents-style';
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
  _injectCSS();
})();
