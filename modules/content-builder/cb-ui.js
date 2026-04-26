/* ================================================
   modules/content-builder/cb-ui.js
   콘텐츠 빌더 — 8탭 shell + 라우터
   ================================================ */
(function(){
  'use strict';

  /* 신규 8탭 — 결과물 중심 흐름 (목적 → 예시 → 블록 → 디자인보드 → 슬롯 → 스타일 → 미리보기 → 출력)
     기존 t1 소스 가져오기 / t2 AI 레시피 / t3 템플릿 함수는 alias로 보존
     (cbRenderTab1Source / cbRenderTab2Recipes / cbRenderTab3Templates) */
  const CB_TABS = [
    { id:'t1', icon:'🎯', label:'목적 선택' },
    { id:'t2', icon:'🎨', label:'예시 갤러리' },
    { id:'t3', icon:'🧱', label:'블록 구성' },
    { id:'t4', icon:'🪄', label:'AI 디자인 보드' },
    { id:'t5', icon:'🖼', label:'미디어 슬롯' },
    { id:'t6', icon:'🎨', label:'스타일' },
    { id:'t7', icon:'👁', label:'미리보기·검수' },
    { id:'t8', icon:'📦', label:'출력' },
  ];

  /* ── 메인 shell 렌더 ── */
  function cbRenderShell(wrapId) {
    const wrap = document.getElementById(wrapId || 'view-cb');
    if (!wrap) return;
    const p = window.contentBuilderProject || (window.cbNewProject && window.cbNewProject());
    const q = (window.cbCalcQuality && window.cbCalcQuality(p)) || { score:0 };
    const cur = (p && p.currentTab) || 't1';

    wrap.innerHTML = ''
      + '<div class="cb-shell">'
      +   '<header class="cb-header">'
      +     '<div>'
      +       '<div class="cb-title">🎨 콘텐츠 빌더</div>'
      +       '<div class="cb-sub">각 카테고리에서 만든 글·소재를 받아 상세페이지·블로그·뉴스레터·카드뉴스·포스터·SNS로 조립합니다.</div>'
      +     '</div>'
      +     '<div class="cb-quality-badge cb-q-' + _qualityClass(q.score) + '" id="cbQualityBadge">'
      +       '품질 <b>' + q.score + '</b> / 100'
      +     '</div>'
      +   '</header>'

      +   '<div class="cb-step-hint">💡 왼쪽부터 순서대로 진행하면 됩니다 — 현재 단계는 진하게 표시됩니다.</div>'
      +   '<nav class="cb-tabs" id="cbTabs">'
      +     CB_TABS.map(function(t){
            return '<button type="button" class="cb-tab ' + (cur===t.id?'on':'') + '"' +
                   ' data-tab="' + t.id + '"' +
                   ' onclick="cbGotoTab(\'' + t.id + '\')">' +
                   t.icon + ' ' + t.label + '</button>';
          }).join('')
      +   '</nav>'

      +   '<div class="cb-body" id="cbBody"></div>'
      + '</div>';

    cbGotoTab(cur);
  }

  /* ── 탭 라우팅 ── */
  function cbGotoTab(tabId) {
    const p = window.contentBuilderProject;
    if (p) p.currentTab = tabId;

    /* 탭 활성화 (data-tab 기반, textContent.includes 사용 금지) */
    document.querySelectorAll('.cb-tab').forEach(function(btn){
      btn.classList.toggle('on', btn.dataset.tab === tabId);
    });

    const body = document.getElementById('cbBody');
    if (!body) return;

    /* legacy 함수 alias 보존 — 기존 cbRenderTab1/2/3 가 source/recipes/templates 였음 */
    if (window.cbRenderTab1 && !window.cbRenderTab1Source)    window.cbRenderTab1Source    = window.cbRenderTab1;
    if (window.cbRenderTab2 && !window.cbRenderTab2Recipes)   window.cbRenderTab2Recipes   = window.cbRenderTab2;
    if (window.cbRenderTab3 && !window.cbRenderTab3Templates) window.cbRenderTab3Templates = window.cbRenderTab3;
    /* 신규 1/3 단계: 'purpose' / 'design-board' 별칭 매핑 — t1/t4 와 동일 */
    if (window.cbRenderTabPurpose && !window.cbRenderTab1Purpose) {
      window.cbRenderTab1Purpose = window.cbRenderTabPurpose;
    }
    if (!window.cbRenderTab4Designboard) {
      window.cbRenderTab4Designboard = window.cbRenderTabDesignBoard || window.cbRenderTab3Templates;
    }
    const renderMap = {
      /* 신규 alias (1/3·2/3 단계) */
      'purpose':         window.cbRenderTabPurpose        || window.cbRenderTab1Purpose || window.cbRenderTab1,
      'example-gallery': window.cbRenderTabExampleGallery || window.cbRenderTab2Examples || window.cbRenderTab2,
      'design-board':    window.cbRenderTabDesignBoard    || window.cbRenderTab4Designboard,
      /* 기존 t1~t8 — direct link 보존 */
      t1: window.cbRenderTabPurpose     || window.cbRenderTab1Purpose || window.cbRenderTab1,
      t2: window.cbRenderTab2Examples   || window.cbRenderTab2,
      t3: window.cbRenderTab4           || window.cbRenderTab3,    /* 블록 구성 (legacy cbRenderTab4) */
      t4: window.cbRenderTabDesignBoard || window.cbRenderTab4Designboard || window.cbRenderTab3,
      t5: window.cbRenderTab5,                                      /* 미디어 슬롯 */
      t6: window.cbRenderTab6,                                      /* 스타일 */
      t7: window.cbRenderTab7,                                      /* 미리보기·검수 */
      t8: window.cbRenderTab8,                                      /* 출력 */
    };
    const fn = renderMap[tabId];
    if (typeof fn === 'function') {
      try {
        body.innerHTML = fn(p) || '';
      } catch(err) {
        console.error('[cb] tab render error:', tabId, err);
        body.innerHTML = _renderError(tabId, err);
      }
    } else {
      body.innerHTML = _renderMissing(tabId);
    }

    /* 자동 저장 */
    if (typeof window.cbSave === 'function') window.cbSave();

    /* 품질 배지 갱신 */
    _refreshQualityBadge();
  }
  window.cbGotoTab = cbGotoTab;
  window.cbRenderShell = cbRenderShell;

  /* ── 헬퍼 ── */
  function _qualityClass(score) {
    if (score >= 80) return 'good';
    if (score >= 70) return 'mid';
    return 'low';
  }
  function _refreshQualityBadge() {
    const el = document.getElementById('cbQualityBadge');
    if (!el || typeof window.cbCalcQuality !== 'function') return;
    const q = window.cbCalcQuality(window.contentBuilderProject);
    el.className = 'cb-quality-badge cb-q-' + _qualityClass(q.score);
    el.innerHTML = '품질 <b>' + q.score + '</b> / 100';
  }
  function _renderMissing(tabId) {
    return '<div class="cb-section">'
      +   '<div class="cb-section-title">⚠️ 탭 ' + tabId + ' 모듈을 찾을 수 없습니다</div>'
      +   '<p>해당 탭 렌더 함수(window.cbRenderTab' + tabId.slice(1) + ')가 로드되지 않았습니다. ' +
            '<code>cb-recipes.js</code>·<code>cb-templates.js</code>·<code>cb-slots.js</code>·<code>cb-output.js</code> 로드 여부를 확인하세요.</p>'
      + '</div>';
  }
  function _renderError(tabId, err) {
    return '<div class="cb-section">'
      +   '<div class="cb-section-title">⚠️ 탭 ' + tabId + ' 렌더 오류</div>'
      +   '<pre style="white-space:pre-wrap;background:#fff5f5;border:1px solid #fca5a5;border-radius:8px;padding:8px;font-size:11px">'
      +   String(err && err.message || err)
      +   '</pre>'
      + '</div>';
  }

  /* ── 모드 전환: builder ↔ wizard (engines/media/index.html 에서 호출) ── */
  function cbSwitchMode(mode) {
    if (mode === 'builder') {
      document.querySelectorAll('.view').forEach(function(v){ v.classList.add('hide'); });
      const cbView = document.getElementById('view-cb');
      if (cbView) cbView.classList.remove('hide');
      cbRenderShell('view-cb');
      const bb = document.getElementById('btnModeBuilder');
      const bw = document.getElementById('btnModeWizard');
      if (bb) bb.classList.add('active');
      if (bw) bw.classList.remove('active');
    } else {
      document.querySelectorAll('.view').forEach(function(v){ v.classList.add('hide'); });
      /* 기존 미디어 위자드는 view-hub 또는 view-one 등으로 시작 — view-hub 우선 */
      const hub = document.getElementById('view-hub');
      if (hub) hub.classList.remove('hide');
      const bb = document.getElementById('btnModeBuilder');
      const bw = document.getElementById('btnModeWizard');
      if (bb) bb.classList.remove('active');
      if (bw) bw.classList.add('active');
    }
  }
  window.cbSwitchMode = cbSwitchMode;

  /* ── 자동 진입 처리 (URL ?mode=builder&tab=tN 또는 draft 존재) ── */
  function _autoEnter() {
    const params = new URLSearchParams(window.location.search || '');
    const mode   = params.get('mode');
    const tab    = params.get('tab');     /* t1~t8 */
    const draft  = (window.cbCore && window.cbCore.cbLoadDraft && window.cbCore.cbLoadDraft());

    if (draft) {
      const ok = window.cbCore.cbApplyDraft(draft);
      if (ok) window.cbCore.cbClearDraft();
    }

    if (mode === 'builder' || draft) {
      if (document.getElementById('view-cb')) {
        cbSwitchMode('builder');
        /* tab 파라미터가 있으면 해당 탭으로 이동 */
        if (tab && (/^t[1-8]$/.test(tab) || tab === 'purpose' || tab === 'example-gallery' || tab === 'design-board')) {
          setTimeout(function(){ cbGotoTab(tab); }, 30);
        }
      }
    } else if (mode === 'wizard') {
      /* 명시적 wizard 모드 */
      if (document.getElementById('view-cb') && document.getElementById('view-hub')) {
        cbSwitchMode('wizard');
      }
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _autoEnter);
  } else {
    /* 다른 모듈이 먼저 로드되도록 다음 tick */
    setTimeout(_autoEnter, 0);
  }
})();
