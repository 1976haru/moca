/* ================================================
   modules/studio/s3-stock-search-panel.js
   숏츠 스튜디오 — 스톡 검색 패널 (업로드·스톡 탭 안)
   * 씬 picker / image-video 토글 / 자동 채워진 query input
   * provider picker (pexels/pixabay/unsplash/coverr/videvo)
   * 검색 → 결과 grid → 채택 → adoptSceneImage
   ================================================ */
(function(){
  'use strict';

  /* state — 모듈 로컬 */
  var STATE = {
    sceneIdx: 0,
    type: 'image',        // 'image' | 'video'
    provider: 'pexels',
    query: '',
    results: [],
    status: '',           // '' | 'loading' | 'no-results' | 'error' | 'ok'
    errorMsg: '',
  };
  window._s3StockState = STATE;

  /* provider 목록 */
  const PROVIDERS = [
    { id:'pexels',   label:'Pexels',   types:['image','video'], hint:'무료·상업용 OK' },
    { id:'pixabay',  label:'Pixabay',  types:['image','video'], hint:'무료·무제한' },
    { id:'unsplash', label:'Unsplash', types:['image'],         hint:'고품질 사진' },
    { id:'coverr',   label:'Coverr',   types:['video'],         hint:'무료 stock video' },
    { id:'videvo',   label:'Videvo',   types:['video'],         hint:'준비중' },
  ];

  function _proj() { return (window.STUDIO && window.STUDIO.project) || {}; }
  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function _escAttr(s){ return String(s == null ? '' : s).replace(/"/g,'&quot;').replace(/'/g, "\\'"); }

  /* ════════════════════════════════════════════════
     render — 패널 HTML
     ════════════════════════════════════════════════ */
  window.cbRenderStockSearchPanel = function(opts) {
    opts = opts || {};
    _injectCSS();
    /* 단일 resolver — 상단 씬별 소스 현황과 동일한 씬 목록 */
    var scenes = (typeof window.resolveStudioScenes === 'function')
      ? window.resolveStudioScenes()
      : (typeof window.getStudioScenesForStock === 'function' ? window.getStudioScenesForStock() : []);

    /* 초기 status 보장 — render 가 도중 'loading' 으로 남는 일 없음 */
    if (STATE.status === 'loading' && (!STATE.results || !STATE.results.length)) {
      STATE.status = '';
    }

    /* selectedSceneIndex 기본값 — 첫 씬 (0) */
    if (STATE.sceneIdx === undefined || STATE.sceneIdx === null) {
      STATE.sceneIdx = scenes.length ? scenes[0].sceneIndex : 0;
    }

    /* 진입 시 자동 query 재생성 — 씬/타입 변경 반영 (전체 씬 모드 제외) */
    if (STATE.sceneIdx !== 'all' && typeof window.buildStockSearchQuery === 'function' && scenes.length) {
      var qResult = window.buildStockSearchQuery(STATE.sceneIdx, { prefer: STATE.type });
      if (qResult && qResult.query) {
        STATE.query = qResult.query;
        /* draft 저장 */
        if (typeof window.ensureStockSearchDraft === 'function') {
          window.ensureStockSearchDraft(STATE.sceneIdx, STATE.type, { force: true });
        }
      }
    }

    /* scene picker — resolveStudioScenes 결과 사용 (상단 씬별 소스 현황과 동일) */
    var sceneOptions = '<option value="all"' + (STATE.sceneIdx === 'all' ? ' selected' : '') + '>📋 전체 씬 미리보기</option>';
    if (!scenes.length) {
      sceneOptions += '<option value="" disabled>대본 씬을 찾지 못했습니다 — 1단계 대본을 먼저 생성하세요</option>';
    } else {
      sceneOptions += scenes.map(function(sc){
        var label = sc.label || ('씬 ' + sc.sceneNumber);
        var on = (STATE.sceneIdx === sc.sceneIndex);
        return '<option value="'+sc.sceneIndex+'"' + (on?' selected':'') + '>' + _esc(label) + '</option>';
      }).join('');
    }

    /* provider buttons */
    var providersHtml = PROVIDERS.map(function(pv){
      var on = (STATE.provider === pv.id);
      var supportsType = pv.types.indexOf(STATE.type) >= 0;
      var disabled = !supportsType;
      var keyOk = (typeof window.hasApiKey === 'function') ? window.hasApiKey('stock', pv.id) : true;
      return '<button class="s3ss-prov' + (on?' on':'') + (disabled?' disabled':'') + '" '+
        (disabled ? 'title="' + pv.types.join('/') + ' 만 지원" ' : '') +
        'onclick="' + (disabled ? 'return false' : 's3SsSetProvider(\''+pv.id+'\')') + '">' +
        '<b>'+pv.label+'</b>' +
        '<span class="s3ss-prov-hint">'+pv.hint+'</span>' +
        '<span class="s3ss-prov-key">'+(keyOk ? '✅' : '⚠️')+'</span>' +
      '</button>';
    }).join('');

    /* type toggle */
    var typesHtml = ['image','video'].map(function(t){
      var on = (STATE.type === t);
      return '<button class="s3ss-type' + (on?' on':'') + '" onclick="s3SsSetType(\''+t+'\')">' +
        (t === 'image' ? '🖼 이미지' : '🎬 영상') + '</button>';
    }).join('');

    /* status banner — 초기 진입 시 안내, 로딩은 fetch 중에만 */
    var statusHtml = '';
    var sceneNoMsg = (STATE.sceneIdx === 'all' || STATE.sceneIdx == null) ? '' : ((STATE.sceneIdx|0) + 1);
    if (STATE.status === 'loading') statusHtml = '<div class="s3ss-status s3ss-loading">🔍 씬 ' + (sceneNoMsg||'?') + ' 스톡 검색 중...</div>';
    else if (STATE.status === 'no-results') statusHtml = '<div class="s3ss-status s3ss-empty">📭 검색 결과가 없습니다. 검색어를 수정하거나 다른 provider를 선택해주세요.</div>';
    else if (STATE.status === 'error') statusHtml = '<div class="s3ss-status s3ss-err">❌ 스톡 검색 중 오류가 발생했습니다. API 설정과 검색어를 확인해주세요. (' + _esc(STATE.errorMsg || '') + ')</div>';
    else if (STATE.status === 'ok') statusHtml = '<div class="s3ss-status s3ss-ok">✅ 씬 ' + sceneNoMsg + ' 검색 결과 ' + STATE.results.length + '건</div>';
    else if (!scenes.length) statusHtml = '<div class="s3ss-status s3ss-empty">⚠️ 현재 저장된 s1/s3 데이터에서 씬을 찾지 못했습니다. 상단 소스 현황 데이터와 resolver 경로를 확인해주세요.</div>';
    else if (STATE.sceneIdx === 'all') statusHtml = '<div class="s3ss-status s3ss-init">📋 전체 씬의 프롬프트를 미리보고, 원하는 씬만 스톡 검색할 수 있습니다.</div>';
    else if (STATE.query) statusHtml = '<div class="s3ss-status s3ss-init">✅ 씬 ' + sceneNoMsg + ' 검색어를 만들었습니다. "🔍 스톡 검색" 버튼을 누르세요.</div>';
    else statusHtml = '<div class="s3ss-status s3ss-empty">⚠️ 검색어가 없습니다. 씬 프롬프트를 확인하거나 직접 입력하세요.</div>';

    /* results grid */
    var resultsHtml = '';
    if (STATE.results.length) {
      var sceneNoForBtn = (STATE.sceneIdx === 'all' || STATE.sceneIdx == null)
                         ? 1 : ((STATE.sceneIdx|0) + 1);
      var headerHtml =
        '<div class="s3ss-results-hd">' +
          '<span class="s3ss-results-hd-title">씬 ' + sceneNoForBtn + ' 검색 결과 ' + STATE.results.length + '건</span>' +
          '<button class="s3ss-results-hd-btn" onclick="sspResearchScene(' + (STATE.sceneIdx === 'all' ? 0 : STATE.sceneIdx|0) + ')" title="현재 씬 query 로 다시 검색">🔄 다른 결과 보기</button>' +
          '<button class="s3ss-results-hd-btn" onclick="sspEditQuery(' + (STATE.sceneIdx === 'all' ? 0 : STATE.sceneIdx|0) + ')" title="검색어 직접 수정">✏️ 검색어 수정</button>' +
        '</div>';
      var ratioBadge = function(item){
        if (!(item.width && item.height)) return '';
        var g = (function(a,b){return b?arguments.callee(b,a%b):a;})(item.width, item.height);
        return '<span class="s3ss-result-ratio">'+(item.width/g)+':'+(item.height/g)+'</span>';
      };
      var cardsHtml = STATE.results.map(function(item, i){
        var typeBadge = item.type === 'video' ? '🎬' : '📷';
        var thumbHtml = item.type === 'video'
          ? '<div class="s3ss-result-thumb s3ss-vid" onclick="sspOpenPreview('+i+')">' +
              (item.thumb ? '<img src="'+_escAttr(item.thumb)+'" alt="" onerror="this.style.display=\'none\'">' : '') +
              '<span class="s3ss-vid-icon">▶</span>' +
              (item.duration ? '<span class="s3ss-vid-dur">'+item.duration+'s</span>' : '') +
            '</div>'
          : '<div class="s3ss-result-thumb" onclick="sspOpenPreview('+i+')"><img src="'+_escAttr(item.thumb)+'" alt="" onerror="this.style.display=\'none\'"></div>';
        return '<div class="s3ss-result-card">' +
          thumbHtml +
          '<div class="s3ss-result-meta">' +
            '<span class="s3ss-result-prov">' + typeBadge + ' ' + _esc(item.provider) + '</span>' +
            ratioBadge(item) +
            (item.credit ? '<span class="s3ss-result-credit">' + _esc(item.credit) + '</span>' : '') +
          '</div>' +
          '<div class="s3ss-result-actions">' +
            '<button class="s3ss-result-btn pri" onclick="s3SsAdoptResult('+i+')">씬에 적용</button>' +
            '<button class="s3ss-result-btn" onclick="sspOpenPreview('+i+')">🔍 미리보기</button>' +
            (item.creditUrl ? '<a class="s3ss-result-btn" href="'+_escAttr(item.creditUrl)+'" target="_blank" rel="noopener">출처</a>' : '') +
          '</div>' +
        '</div>';
      }).join('');
      resultsHtml = headerHtml + '<div class="s3ss-results-grid">' + cardsHtml + '</div>';
    }

    return '<div class="s3ss-wrap">' +
      '<div class="s3ss-intro">대본에서 만든 이미지/영상 프롬프트를 자동으로 검색어로 변환합니다. 직접 수정도 가능합니다.</div>' +

      /* 씬 + 타입 */
      '<div class="s3ss-row">' +
        '<label class="s3ss-label">씬 선택</label>' +
        '<select class="s3ss-scene" onchange="s3SsSetScene(this.value)">' + sceneOptions + '</select>' +
        '<div class="s3ss-types">' + typesHtml + '</div>' +
      '</div>' +

      /* 자동 query */
      '<div class="s3ss-row s3ss-row-query">' +
        '<label class="s3ss-label">검색어 (자동)</label>' +
        '<input class="s3ss-query" type="text" value="'+_escAttr(STATE.query)+'" '+
          'placeholder="씬 프롬프트에서 자동 생성 — 직접 수정 가능" '+
          'oninput="STATE_setQuery(this.value)">' +
        '<button class="s3ss-btn" onclick="s3SsRebuildQuery()" title="현재 씬 프롬프트로 다시 생성">↻ 다시 생성</button>' +
      '</div>' +

      /* provider */
      '<div class="s3ss-row">' +
        '<label class="s3ss-label">스톡 provider</label>' +
        '<div class="s3ss-providers">' + providersHtml + '</div>' +
      '</div>' +

      /* 검색 */
      '<div class="s3ss-row s3ss-row-search">' +
        '<button class="s3ss-btn-pri" onclick="s3SsSearch()">🔍 스톡 검색</button>' +
        '<button class="s3ss-btn" onclick="window.openApiSettingsModal && window.openApiSettingsModal(\'stock\')">🔑 통합 API 설정</button>' +
      '</div>' +

      /* 씬 프롬프트 미리보기 — 전체 씬 선택 시 grid, 단일 씬 선택 시 단일 카드 */
      _renderPreviewSection(scenes) +

      statusHtml +

      '<div class="s3ss-results">' + resultsHtml + '</div>' +
    '</div>';
  };

  /* ════════════════════════════════════════════════
     씬 미리보기 섹션 — 전체 씬 grid OR 단일 씬 카드
     ════════════════════════════════════════════════ */
  function _renderPreviewSection(scenes) {
    if (!scenes.length) return '';
    /* 단일 씬 선택 → 단일 카드 */
    if (STATE.sceneIdx !== 'all' && Number.isFinite(+STATE.sceneIdx)) {
      var sc = scenes[+STATE.sceneIdx];
      if (sc) return '<div class="s3ss-preview-section"><div class="s3ss-preview-title">📋 현재 씬 미리보기</div>' + _renderPreviewCard(sc) + '</div>';
    }
    /* 전체 씬 → compact grid */
    return '<div class="s3ss-preview-section">' +
      '<div class="s3ss-preview-title">📋 씬별 프롬프트 미리보기 (' + scenes.length + ')</div>' +
      '<div class="s3ss-preview-grid">' +
        scenes.map(function(sc){ return _renderPreviewCard(sc, true); }).join('') +
      '</div>' +
    '</div>';
  }

  function _renderPreviewCard(sc, compact) {
    var stockQuery = '', querySource = '';
    if (typeof window.buildStockSearchQuery === 'function') {
      var qResult = window.buildStockSearchQuery(sc.sceneIndex, { prefer: STATE.type });
      stockQuery   = qResult && qResult.query || '';
      querySource  = (qResult && qResult.source) || '';
    }
    var rawPrompt = STATE.type === 'video' ? sc.videoPrompt : sc.imagePrompt;
    if (!rawPrompt) rawPrompt = sc.imagePrompt || sc.videoPrompt || sc.visualDescription || sc.narration || '';
    var status = stockQuery
      ? '<span class="s3ss-pp-q-ok">✅ query 준비됨</span>'
      : '<span class="s3ss-pp-q-empty">⚠️ 프롬프트 없음 — 먼저 컴파일 필요</span>';
    var narrShort = sc.narration ? (sc.narration.length > 80 ? sc.narration.slice(0,80) + '…' : sc.narration) : '';
    var rawShort = rawPrompt ? (rawPrompt.length > 100 ? rawPrompt.slice(0,100) + '…' : rawPrompt) : '';
    var srcLine  = '';
    if (sc.sourcePath || querySource) {
      var parts = [];
      if (sc.sourcePath) parts.push('scene ← ' + sc.sourcePath);
      if (querySource)   parts.push('query ← ' + querySource);
      srcLine = '<div class="s3ss-pp-src">📍 ' + _esc(parts.join(' · ')) + '</div>';
    }

    return '<div class="s3ss-pp-card' + (compact ? ' compact' : '') + '">' +
      '<div class="s3ss-pp-hd">' +
        '<span class="s3ss-pp-no">씬 ' + sc.sceneNumber + '</span>' +
        (sc.roleLabel ? '<span class="s3ss-pp-role">' + _esc(sc.roleLabel) + '</span>' : '') +
        status +
      '</div>' +
      (narrShort ? '<div class="s3ss-pp-narr">📜 ' + _esc(narrShort) + '</div>' : '') +
      '<details class="s3ss-pp-orig"><summary>원본 ' + (STATE.type === 'video' ? 'video' : 'image') + ' prompt</summary>' +
        '<div class="s3ss-pp-orig-text">' + (rawShort ? _esc(rawShort) : '<i>없음</i>') + '</div>' +
      '</details>' +
      '<div class="s3ss-pp-q-row">' +
        '<span class="s3ss-pp-q-label">stock query:</span>' +
        '<code class="s3ss-pp-q">' + (stockQuery ? _esc(stockQuery) : '<i>비어있음</i>') + '</code>' +
      '</div>' +
      srcLine +
      '<div class="s3ss-pp-actions">' +
        '<button class="s3ss-pp-btn" onclick="s3SsRegenScene(' + sc.sceneIndex + ')">↻ 검색어 다시 만들기</button>' +
        '<button class="s3ss-pp-btn pri" onclick="s3SsSearchScene(' + sc.sceneIndex + ')">🔍 이 씬 검색</button>' +
      '</div>' +
    '</div>';
  }

  /* 씬별 query 재생성 — STUDIO state 갱신 + UI 업데이트 */
  window.s3SsRegenScene = function(sceneIdx) {
    if (typeof window.ensureStockSearchDraft === 'function') {
      window.ensureStockSearchDraft(sceneIdx, STATE.type, { force: true });
    }
    if (sceneIdx === STATE.sceneIdx && typeof window.buildStockSearchQuery === 'function') {
      var q = window.buildStockSearchQuery(sceneIdx, { prefer: STATE.type });
      STATE.query = q.query || '';
    }
    if (typeof ucShowToast === 'function') ucShowToast('↻ 씬 ' + (sceneIdx+1) + ' query 다시 생성', 'success');
    _refresh();
  };

  /* 씬 단위 검색 — 해당 씬 선택 + 검색 실행 */
  window.s3SsSearchScene = function(sceneIdx) {
    STATE.sceneIdx = sceneIdx;
    if (typeof window.buildStockSearchQuery === 'function') {
      var q = window.buildStockSearchQuery(sceneIdx, { prefer: STATE.type, force:true });
      STATE.query = (q && q.query) || '';
    }
    /* DOM input 즉시 반영 — 사용자가 수정·확인 가능하게 */
    var input = document.querySelector('#s3-stock-panel .s3ss-query, #s3ss-holder .s3ss-query');
    if (input) input.value = STATE.query;
    /* legacy s3-stock.js 도 같은 씬을 보도록 동기화 */
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    proj.s3 = proj.s3 || {}; proj.s3._stockActiveScene = sceneIdx;
    if (!STATE.query) {
      _toast('⚠️ 검색어가 없습니다. 씬 프롬프트를 확인하거나 직접 입력하세요.', 'warn');
      _refresh();
      return;
    }
    _toast('✅ 씬 ' + (sceneIdx+1) + ' 검색어를 만들었습니다.', 'info');
    s3SsSearch();
  };

  /* ════════════════════════════════════════════════
     state setters
     ════════════════════════════════════════════════ */
  window.STATE_setQuery = function(v) { STATE.query = v; };
  window.s3SsSetScene = function(v) {
    if (v === 'all') {
      STATE.sceneIdx = 'all';
      STATE.query = ''; /* 전체 씬 모드는 query 안 보여줌 */
    } else {
      STATE.sceneIdx = parseInt(v, 10);
      if (!Number.isFinite(STATE.sceneIdx)) STATE.sceneIdx = 0;
      _autoFillQuery();
      /* DOM input 즉시 반영 — 사용자가 다른 씬으로 바꾸면 input.value 도 따라 변경 */
      var input = document.querySelector('#s3-stock-panel .s3ss-query, #s3ss-holder .s3ss-query');
      if (input) input.value = STATE.query;
      /* legacy s3-stock.js 가 사용할 활성 씬 */
      var proj = (window.STUDIO && window.STUDIO.project) || {};
      proj.s3 = proj.s3 || {}; proj.s3._stockActiveScene = STATE.sceneIdx;
      if (STATE.query) _toast('✅ 씬 ' + (STATE.sceneIdx+1) + ' 검색어를 만들었습니다.', 'info');
    }
    try { console.debug('[stock-ui] selectedSceneIndex:', STATE.sceneIdx); } catch(_) {}
    _refresh();
  };
  window.s3SsSetType = function(t) {
    STATE.type = t;
    /* 타입에 맞는 provider 자동 전환 */
    var prov = PROVIDERS.find(function(pv){ return pv.id === STATE.provider; });
    if (prov && prov.types.indexOf(t) < 0) {
      var fallback = PROVIDERS.find(function(pv){ return pv.types.indexOf(t) >= 0; });
      if (fallback) STATE.provider = fallback.id;
    }
    _autoFillQuery();
    _refresh();
  };
  window.s3SsSetProvider = function(p) {
    STATE.provider = p;
    _refresh();
  };
  /* 다시 생성 — 현재 씬 프롬프트로 query 재생성 + input.value 즉시 반영 */
  window.s3SsRebuildQuery = function() {
    /* 전체 씬이면 첫 씬으로 fallback */
    var scenes = (typeof window.resolveStudioScenes === 'function') ? window.resolveStudioScenes() : [];
    var idx = STATE.sceneIdx;
    if (idx === 'all' || idx == null) {
      idx = scenes.length ? scenes[0].sceneIndex : 0;
      STATE.sceneIdx = idx;
    }
    if (typeof window.buildStockSearchQuery !== 'function') {
      _toast('⚠️ stock query builder 미로드', 'warn'); return;
    }
    var q = window.buildStockSearchQuery(idx, { prefer: STATE.type, force: true });
    var query = (q && q.query) || '';
    STATE.query = query;
    /* DOM input 직접 업데이트 — 즉시 반영 보장 */
    var input = document.querySelector('#s3-stock-panel .s3ss-query, #s3ss-holder .s3ss-query');
    if (input) {
      input.value = query;
      try { console.debug('[stock-query] built query:', query); } catch(_) {}
    }
    /* draft 저장 */
    if (typeof window.ensureStockSearchDraft === 'function') {
      window.ensureStockSearchDraft(idx, STATE.type, { force: true });
    }
    if (!query) {
      _toast('⚠️ 검색어를 만들 수 없습니다. 이미지/영상 프롬프트를 먼저 컴파일해주세요.', 'warn');
    } else {
      _toast('✅ 현재 씬 프롬프트로 검색어를 다시 만들었습니다.', 'success');
    }
    _refresh();
  };

  function _autoFillQuery() {
    if (STATE.sceneIdx === 'all') { STATE.query = ''; return; }
    if (typeof window.buildStockSearchQuery !== 'function') return;
    var q = window.buildStockSearchQuery(STATE.sceneIdx, { prefer: STATE.type });
    if (q && q.query) {
      STATE.query = q.query;
      if (typeof window.ensureStockSearchDraft === 'function') {
        window.ensureStockSearchDraft(STATE.sceneIdx, STATE.type, { force: true });
      }
    }
  }

  /* ── 토스트 helper (없으면 console) ── */
  function _toast(msg, kind) {
    if (typeof window.ucShowToast === 'function') {
      window.ucShowToast(msg, kind || 'info'); return;
    }
    try { console.debug('[stock-toast]', msg); } catch(_) {}
  }

  /* ════════════════════════════════════════════════
     spec helpers — 외부 호출용
     ════════════════════════════════════════════════ */
  window.getCurrentStockSceneIndex = function() { return STATE.sceneIdx; };
  window.getCurrentStockMediaType  = function() { return STATE.type === 'video' ? 'video' : 'image'; };

  /* ════════════════════════════════════════════════
     ensureStockSceneState — 탭 진입 시 자동 초기화
     * 모든 씬의 query draft 를 미리 생성 → 드롭다운 변경 즉시 query 표시
     * legacy s3-stock.js studioS3StockSearch 도 활용 — s3._stockActiveScene 동기화
     ════════════════════════════════════════════════ */
  window.ensureStockSceneState = function() {
    var scenes = (typeof window.resolveStudioScenes === 'function') ? window.resolveStudioScenes() : [];
    try { console.debug('[stock-scenes] count:', scenes.length); } catch(_) {}
    if (!scenes.length) return { scenes: [], query: '' };

    /* selectedSceneIndex 기본값 — 0 (전체 미리보기는 사용자가 선택했을 때만) */
    if (STATE.sceneIdx == null) STATE.sceneIdx = scenes[0].sceneIndex;
    /* 모든 씬의 query draft 미리 생성 (image + video 둘 다) */
    if (typeof window.ensureStockSearchDraft === 'function') {
      scenes.forEach(function(sc){
        try {
          window.ensureStockSearchDraft(sc.sceneIndex, 'image', { force:false });
          window.ensureStockSearchDraft(sc.sceneIndex, 'video', { force:false });
        } catch(_) {}
      });
    }
    /* 현재 STATE.type 의 query 를 화면 변수에 동기화 */
    if (STATE.sceneIdx !== 'all' && typeof window.buildStockSearchQuery === 'function') {
      var built = window.buildStockSearchQuery(STATE.sceneIdx, { prefer: STATE.type, force:false });
      if (built && built.query) STATE.query = built.query;
    }
    /* legacy s3-stock.js 와 활성 씬 공유 */
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    proj.s3 = proj.s3 || {};
    proj.s3._stockActiveScene = STATE.sceneIdx === 'all' ? 0 : STATE.sceneIdx;
    return { scenes: scenes, query: STATE.query };
  };

  /* ════════════════════════════════════════════════
     검색 실행
     ════════════════════════════════════════════════ */
  window.s3SsSearch = async function() {
    /* 전체 씬 모드에서 검색 시도 — 첫 씬으로 fallback + query 자동 생성 */
    if (STATE.sceneIdx === 'all' || STATE.sceneIdx == null) {
      var scenes2 = (typeof window.resolveStudioScenes === 'function') ? window.resolveStudioScenes() : [];
      if (scenes2.length) {
        STATE.sceneIdx = scenes2[0].sceneIndex;
        _autoFillQuery();
      }
    }
    /* query 비면 자동 생성 시도 */
    if ((!STATE.query || !STATE.query.trim()) && typeof window.buildStockSearchQuery === 'function' && STATE.sceneIdx !== 'all') {
      var built = window.buildStockSearchQuery(STATE.sceneIdx, { prefer: STATE.type, force:true });
      if (built && built.query) STATE.query = built.query;
    }
    if (!STATE.query || !STATE.query.trim()) {
      _toast('⚠️ 검색어를 만들 수 없습니다. 프롬프트를 먼저 컴파일하거나 직접 입력해주세요.', 'warn');
      return;
    }
    try { console.debug('[stock-ui] selectedSceneIndex:', STATE.sceneIdx); } catch(_) {}
    /* 키 확인 */
    var keyOk = (typeof window.hasApiKey === 'function') ? window.hasApiKey('stock', STATE.provider) : true;
    if (!keyOk) {
      if (confirm('이 스톡 API 키가 없습니다. 통합 API 설정을 열까요?')) {
        if (typeof window.openApiSettingsModal === 'function') window.openApiSettingsModal('stock');
      }
      return;
    }
    var key = '';
    if (typeof window.getApiProvider === 'function') {
      var prov = window.getApiProvider('stock', STATE.provider);
      if (prov && prov.apiKey) key = prov.apiKey;
    }
    if (!key && typeof window.ucGetApiKey === 'function') {
      key = window.ucGetApiKey(STATE.provider);
    }
    if (!key) {
      STATE.status = 'error'; STATE.errorMsg = 'API 키를 찾을 수 없습니다.';
      _refresh(); return;
    }

    STATE.status = 'loading';
    STATE.results = [];
    _refresh();

    try {
      try {
        console.debug('[stock] provider:', STATE.provider);
        console.debug('[stock] sceneIndex:', STATE.sceneIdx);
        console.debug('[stock] query:', STATE.query);
        console.debug('[stock] fetch start');
      } catch(_) {}
      var results = await _doSearch(STATE.provider, STATE.type, STATE.query, key);
      STATE.results = results;
      STATE.status = results.length ? 'ok' : 'no-results';
      try { console.debug('[stock] result count:', results.length); } catch(_) {}
    } catch (e) {
      STATE.status = 'error';
      STATE.errorMsg = (e && e.message) || String(e);
      try { console.debug('[stock] error:', STATE.errorMsg); } catch(_) {}
    }
    _refresh();
  };

  /* provider 별 fetch + 결과 normalize */
  async function _doSearch(providerId, type, query, key) {
    var q = encodeURIComponent(query);
    if (providerId === 'pexels') {
      if (type === 'video') {
        var r = await fetch('https://api.pexels.com/videos/search?query=' + q + '&per_page=15', { headers:{'Authorization': key} });
        if (!r.ok) throw new Error('Pexels HTTP ' + r.status);
        var d = await r.json();
        return (d.videos || []).map(function(v){
          var file = (v.video_files || []).find(function(f){ return f.quality === 'sd' || f.quality === 'hd'; }) || (v.video_files || [])[0];
          return {
            type:'video', thumb: v.image, url: file ? file.link : '',
            previewUrl: v.image, fullUrl: file ? file.link : v.image,
            provider:'Pexels', credit: v.user && v.user.name || 'Pexels',
            creditUrl: v.url, duration: v.duration,
            width: v.width, height: v.height,
          };
        });
      }
      var r2 = await fetch('https://api.pexels.com/v1/search?query=' + q + '&per_page=15', { headers:{'Authorization': key} });
      if (!r2.ok) throw new Error('Pexels HTTP ' + r2.status);
      var d2 = await r2.json();
      return (d2.photos || []).map(function(p){
        return {
          type:'image', thumb: (p.src && p.src.medium) || '', url: (p.src && p.src.large) || '',
          previewUrl: (p.src && p.src.medium) || '', fullUrl: (p.src && p.src.large) || '',
          provider:'Pexels', credit: p.photographer || 'Pexels',
          creditUrl: p.url, width: p.width, height: p.height,
        };
      });
    }
    if (providerId === 'pixabay') {
      var pUrl = (type === 'video' ? 'https://pixabay.com/api/videos/' : 'https://pixabay.com/api/');
      var pRes = await fetch(pUrl + '?key=' + encodeURIComponent(key) + '&q=' + q + '&per_page=15&safesearch=true');
      if (!pRes.ok) throw new Error('Pixabay HTTP ' + pRes.status);
      var pData = await pRes.json();
      return (pData.hits || []).map(function(h){
        if (type === 'video') {
          var v = (h.videos && (h.videos.medium || h.videos.small)) || {};
          return {
            type:'video', thumb: v.thumbnail || (h.videos && h.videos.tiny && h.videos.tiny.thumbnail) || '',
            url: v.url || '', previewUrl: v.thumbnail || '', fullUrl: v.url || '',
            provider:'Pixabay', credit: h.user || 'Pixabay', creditUrl: h.pageURL || '',
            duration: h.duration, width: v.width, height: v.height,
          };
        }
        return {
          type:'image', thumb: h.previewURL || '', url: h.largeImageURL || h.webformatURL || '',
          previewUrl: h.previewURL || '', fullUrl: h.largeImageURL || h.webformatURL || '',
          provider:'Pixabay', credit: h.user || 'Pixabay', creditUrl: h.pageURL || '',
          width: h.imageWidth, height: h.imageHeight,
        };
      });
    }
    if (providerId === 'unsplash') {
      var uRes = await fetch('https://api.unsplash.com/search/photos?query=' + q + '&per_page=15&client_id=' + encodeURIComponent(key));
      if (!uRes.ok) throw new Error('Unsplash HTTP ' + uRes.status);
      var uData = await uRes.json();
      return (uData.results || []).map(function(p){
        return {
          type:'image', thumb: (p.urls && p.urls.small) || '', url: (p.urls && p.urls.regular) || '',
          previewUrl: (p.urls && p.urls.small) || '', fullUrl: (p.urls && p.urls.regular) || '',
          provider:'Unsplash', credit: (p.user && p.user.name) || 'Unsplash',
          creditUrl: (p.user && p.user.links && p.user.links.html) || p.links.html,
          width: p.width, height: p.height,
        };
      });
    }
    if (providerId === 'coverr') {
      /* Coverr는 공개 API endpoint가 변경되어 안정적인 무인증 호출이 어려움 — 안내 */
      throw new Error('Coverr API 는 현재 안정 호출이 어렵습니다. Pexels/Pixabay 사용을 권장합니다.');
    }
    if (providerId === 'videvo') {
      throw new Error('Videvo provider 는 준비중입니다.');
    }
    throw new Error('알 수 없는 provider: ' + providerId);
  }

  /* ════════════════════════════════════════════════
     결과 채택 — sspApplyResult 위임 (통합 schema 저장)
     ════════════════════════════════════════════════ */
  window.s3SsAdoptResult = function(idx) {
    var item = STATE.results[idx];
    if (!item) return;
    if (STATE.sceneIdx === 'all' || STATE.sceneIdx == null) {
      _toast('⚠️ 먼저 적용할 씬을 선택해주세요. (전체 미리보기 모드)', 'warn');
      return;
    }
    /* preview 모듈이 통합 schema 로 저장 + adoptSceneImage 위임 */
    if (typeof window.sspApplyResult === 'function') {
      window.sspApplyResult(idx); return;
    }
    /* fallback — 모듈 미로드 시 직접 adoptSceneImage */
    if (typeof window.adoptSceneImage !== 'function') {
      alert('s3-scene-image-state.js / s3-stock-preview.js 모두 로드되지 않았습니다.');
      return;
    }
    var ok = window.adoptSceneImage(STATE.sceneIdx, {
      url: item.url || item.thumb, thumbUrl: item.thumb,
      previewUrl: item.previewUrl || item.thumb, fullUrl: item.fullUrl || item.url,
      provider: item.provider, type: item.type, credit: item.credit,
      creditUrl: item.creditUrl, width: item.width || 0, height: item.height || 0, aspectRatio: '',
    }, 'stock');
    if (ok) _toast('✅ 씬 ' + (STATE.sceneIdx+1) + ' 에 ' + item.provider + ' 채택', 'success');
    /* 패널 상태 보존을 위해 renderStudio() 대신 로컬 refresh */
    _refresh();
  };

  function _refresh() {
    /* 가능한 모든 컨테이너 — s3-source-tabs 의 #s3-stock-panel 또는
       s3-upload-stock-panel 의 #s3ss-holder */
    var holder = document.getElementById('s3-stock-panel')
              || document.getElementById('s3ss-holder');
    if (!holder) {
      try { console.debug('[stock] refresh skipped — no container'); } catch(_) {}
      return;
    }
    holder.innerHTML = window.cbRenderStockSearchPanel();
  }
  window._s3SsRefresh = _refresh;

  /* ════════════════════════════════════════════════
     CSS
     ════════════════════════════════════════════════ */
  function _injectCSS() {
    if (document.getElementById('s3-stock-search-style')) return;
    var st = document.createElement('style');
    st.id = 's3-stock-search-style';
    st.textContent =
      '.s3ss-wrap{padding:6px 4px;display:flex;flex-direction:column;gap:10px}'+
      '.s3ss-intro{font-size:12px;color:#7b6080;background:#fafafe;border-radius:8px;padding:8px 12px;line-height:1.5}'+
      '.s3ss-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'+
      '.s3ss-row-query{align-items:stretch}'+
      '.s3ss-row-search{justify-content:flex-end}'+
      '.s3ss-label{font-size:11.5px;font-weight:800;color:#5b1a4a;min-width:90px}'+
      '.s3ss-scene{flex:1;min-width:140px;border:1.5px solid var(--line,#e9e4f3);border-radius:8px;padding:6px 10px;font-size:12px;font-family:inherit}'+
      '.s3ss-types{display:flex;gap:4px}'+
      '.s3ss-type{border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:8px;padding:5px 12px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit}'+
      '.s3ss-type.on{background:#9181ff;color:#fff;border-color:#9181ff}'+
      '.s3ss-query{flex:1;border:1.5px solid var(--line,#e9e4f3);border-radius:8px;padding:8px 12px;font-size:13px;font-family:inherit}'+
      '.s3ss-query:focus{outline:none;border-color:#9181ff}'+
      '.s3ss-providers{display:flex;gap:6px;flex-wrap:wrap;flex:1}'+
      '.s3ss-prov{display:flex;flex-direction:column;align-items:flex-start;gap:2px;border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:8px;padding:6px 12px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;position:relative}'+
      '.s3ss-prov.on{background:linear-gradient(135deg,#fff5fa,#f5f0ff);border-color:#ef6fab;color:#5b1a4a}'+
      '.s3ss-prov.disabled{opacity:.4;cursor:not-allowed}'+
      '.s3ss-prov b{font-size:12.5px}'+
      '.s3ss-prov-hint{font-size:10px;color:#9b8a93;font-weight:500}'+
      '.s3ss-prov-key{position:absolute;top:4px;right:6px;font-size:11px}'+
      '.s3ss-btn{border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;gap:4px}'+
      '.s3ss-btn:hover{border-color:#9181ff;color:#9181ff}'+
      '.s3ss-btn-pri{border:none;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-radius:8px;padding:8px 18px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit}'+
      '.s3ss-btn-pri:hover{opacity:.92;color:#fff}'+
      '.s3ss-status{padding:8px 12px;border-radius:8px;font-size:12px;font-weight:700}'+
      '.s3ss-loading{background:#eef5ff;color:#2b66c4}'+
      '.s3ss-empty{background:#fafafe;color:#7b6080}'+
      '.s3ss-err{background:#fff1f1;color:#c0392b}'+
      '.s3ss-ok{background:#effbf7;color:#1a7a5a}'+
      '.s3ss-init{background:#fff5fa;color:#5b1a4a}'+
      /* 씬 미리보기 카드 */
      '.s3ss-preview-section{margin-top:6px}'+
      '.s3ss-preview-title{font-size:12px;font-weight:800;color:#5b1a4a;margin-bottom:8px}'+
      '.s3ss-preview-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px}'+
      '.s3ss-pp-card{background:#fff;border:1.5px solid #ece6f5;border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:5px;font-size:11.5px}'+
      '.s3ss-pp-card.compact{padding:8px 10px;font-size:11px}'+
      '.s3ss-pp-hd{display:flex;align-items:center;gap:6px;flex-wrap:wrap}'+
      '.s3ss-pp-no{font-weight:900;color:#2b2430;font-size:12px}'+
      '.s3ss-pp-role{background:#f5f0ff;color:#5a4a8a;padding:1px 7px;border-radius:6px;font-size:10px;font-weight:700}'+
      '.s3ss-pp-q-ok{margin-left:auto;background:#effbf7;color:#1a7a5a;padding:1px 7px;border-radius:999px;font-size:9.5px;font-weight:800}'+
      '.s3ss-pp-q-empty{margin-left:auto;background:#fff7e6;color:#a05a00;padding:1px 7px;border-radius:999px;font-size:9.5px;font-weight:800}'+
      '.s3ss-pp-narr{color:#5a4a56;line-height:1.5;font-size:11px}'+
      '.s3ss-pp-orig{}'+
      '.s3ss-pp-orig summary{cursor:pointer;list-style:none;font-size:10.5px;color:#9181ff;font-weight:700}'+
      '.s3ss-pp-orig summary::after{content:" ▾";color:#bbb}'+
      '.s3ss-pp-orig[open] summary::after{content:" ▴"}'+
      '.s3ss-pp-orig-text{margin-top:4px;padding:5px 8px;background:#fafafe;border-radius:6px;font-size:10.5px;color:#5a4a56;line-height:1.5}'+
      '.s3ss-pp-orig-text i{color:#bbb}'+
      '.s3ss-pp-src{font-size:10px;color:#9b8a93;font-family:monospace;padding:2px 0;line-height:1.4}'+
      '.s3ss-pp-q-row{display:flex;align-items:flex-start;gap:6px}'+
      '.s3ss-pp-q-label{font-weight:800;color:#9181ff;font-size:10px;flex-shrink:0;padding-top:2px}'+
      '.s3ss-pp-q{flex:1;background:#f5f0ff;color:#3a3040;padding:4px 8px;border-radius:6px;font-size:11px;font-family:monospace;word-break:break-word;line-height:1.4}'+
      '.s3ss-pp-q i{color:#bbb;font-style:normal}'+
      '.s3ss-pp-actions{display:flex;gap:4px;margin-top:2px}'+
      '.s3ss-pp-btn{flex:1;border:1px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:6px;padding:5px 8px;font-size:10.5px;font-weight:700;cursor:pointer;font-family:inherit}'+
      '.s3ss-pp-btn:hover{border-color:#9181ff;color:#9181ff}'+
      '.s3ss-pp-btn.pri{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border:none}'+
      '.s3ss-pp-btn.pri:hover{opacity:.92;color:#fff}'+
      '.s3ss-results{display:flex;flex-direction:column;gap:8px;margin-top:6px}'+
      '.s3ss-results-hd{display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#fff5fa;border:1px solid #f1dce7;border-radius:10px;padding:8px 12px}'+
      '.s3ss-results-hd-title{font-weight:800;color:#5b1a4a;font-size:12px;flex:1}'+
      '.s3ss-results-hd-btn{border:1.5px solid #ef6fab;background:#fff;color:#5b1a4a;border-radius:20px;padding:5px 14px;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit}'+
      '.s3ss-results-hd-btn:hover{background:#ef6fab;color:#fff}'+
      '.s3ss-results-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}'+
      '.s3ss-result-thumb{cursor:pointer}'+
      '.s3ss-result-thumb:hover img{transform:scale(1.04);transition:.2s}'+
      '.s3ss-result-ratio{font-size:9.5px;color:#9b8a93;background:#fafafe;padding:1px 6px;border-radius:6px;font-weight:700}'+
      '.s3ss-result-card{background:#fff;border:1px solid #ece6f5;border-radius:8px;overflow:hidden;display:flex;flex-direction:column}'+
      '.s3ss-result-thumb{position:relative;aspect-ratio:16/9;background:#1a1a2e;display:flex;align-items:center;justify-content:center;overflow:hidden}'+
      '.s3ss-result-thumb img{width:100%;height:100%;object-fit:cover;display:block}'+
      '.s3ss-vid{background:#000}'+
      '.s3ss-vid img{opacity:.7}'+
      '.s3ss-vid-icon{position:absolute;font-size:24px;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.5)}'+
      '.s3ss-vid-dur{position:absolute;bottom:4px;right:6px;background:rgba(0,0,0,.7);color:#fff;padding:1px 6px;border-radius:6px;font-size:10px;font-weight:800}'+
      '.s3ss-result-meta{padding:5px 8px;font-size:10.5px;color:#5a4a56;display:flex;flex-direction:column;gap:1px}'+
      '.s3ss-result-prov{font-weight:800;color:#5b1a4a}'+
      '.s3ss-result-credit{color:#9b8a93;font-size:9.5px}'+
      '.s3ss-result-actions{display:flex;gap:3px;padding:0 8px 8px;justify-content:space-between}'+
      '.s3ss-result-btn{flex:1;border:1px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:6px;padding:5px 8px;font-size:10.5px;font-weight:700;cursor:pointer;font-family:inherit;text-align:center;text-decoration:none}'+
      '.s3ss-result-btn.pri{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border:none}'+
      '.s3ss-result-btn:hover{opacity:.92}'+
      '.s3ss-result-btn.pri:hover{color:#fff}'+
      '';
    document.head.appendChild(st);
  }
})();
