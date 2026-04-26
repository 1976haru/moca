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
    var p = _proj();
    var scenes = (p.s3 && p.s3.scenes) || [];

    /* 초기 status 보장 — render 가 도중 'loading' 으로 남는 일 없음 */
    if (STATE.status === 'loading' && (!STATE.results || !STATE.results.length)) {
      /* fetch 가 끝나지 않았는데 다시 render 되는 경우는 흔치 않음 — 안전망 */
      STATE.status = '';
    }

    /* 진입 시 무조건 자동 query 재생성 (씬/타입 변경 반영) */
    if (typeof window.buildStockSearchQuery === 'function') {
      var q = window.buildStockSearchQuery(STATE.sceneIdx, { prefer: STATE.type });
      if (q && q.query) STATE.query = q.query;
      try { console.debug('[stock] sceneIndex:', STATE.sceneIdx, 'query:', STATE.query); } catch(_) {}
    }

    /* scene picker */
    var sceneOptions = '<option value="">(전체 씬)</option>' +
      scenes.map(function(sc, i){
        var label = '씬 ' + (i+1) + (sc.label ? ' — ' + sc.label : '');
        var on = (i === STATE.sceneIdx);
        return '<option value="'+i+'"' + (on?' selected':'') + '>' + _esc(label) + '</option>';
      }).join('');

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
    if (STATE.status === 'loading') statusHtml = '<div class="s3ss-status s3ss-loading">🔍 스톡 검색 중...</div>';
    else if (STATE.status === 'no-results') statusHtml = '<div class="s3ss-status s3ss-empty">📭 검색 결과가 없습니다. 검색어를 수정하거나 다른 provider를 선택해주세요.</div>';
    else if (STATE.status === 'error') statusHtml = '<div class="s3ss-status s3ss-err">❌ ' + _esc(STATE.errorMsg || '응답 처리 중 오류가 발생했습니다.') + '</div>';
    else if (STATE.status === 'ok') statusHtml = '<div class="s3ss-status s3ss-ok">✅ 검색 결과 ' + STATE.results.length + '건</div>';
    else statusHtml = '<div class="s3ss-status s3ss-init">💡 검색어를 확인하고 "🔍 스톡 검색" 버튼을 누르세요. 자동 검색어는 현재 씬의 이미지/영상 프롬프트에서 생성됩니다.</div>';

    /* results grid */
    var resultsHtml = '';
    if (STATE.results.length) {
      resultsHtml = STATE.results.map(function(item, i){
        var typeBadge = item.type === 'video' ? '🎬' : '📷';
        var thumbHtml = item.type === 'video'
          ? '<div class="s3ss-result-thumb s3ss-vid">' +
              (item.thumb ? '<img src="'+_escAttr(item.thumb)+'" alt="" onerror="this.style.display=\'none\'">' : '') +
              '<span class="s3ss-vid-icon">▶</span>' +
              (item.duration ? '<span class="s3ss-vid-dur">'+item.duration+'s</span>' : '') +
            '</div>'
          : '<div class="s3ss-result-thumb"><img src="'+_escAttr(item.thumb)+'" alt="" onerror="this.style.display=\'none\'"></div>';
        return '<div class="s3ss-result-card">' +
          thumbHtml +
          '<div class="s3ss-result-meta">' +
            '<span class="s3ss-result-prov">' + typeBadge + ' ' + _esc(item.provider) + '</span>' +
            (item.credit ? '<span class="s3ss-result-credit">' + _esc(item.credit) + '</span>' : '') +
          '</div>' +
          '<div class="s3ss-result-actions">' +
            '<button class="s3ss-result-btn pri" onclick="s3SsAdoptResult('+i+')">씬에 적용</button>' +
            (item.creditUrl ? '<a class="s3ss-result-btn" href="'+_escAttr(item.creditUrl)+'" target="_blank" rel="noopener">출처</a>' : '') +
          '</div>' +
        '</div>';
      }).join('');
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

      statusHtml +

      '<div class="s3ss-results">' + resultsHtml + '</div>' +
    '</div>';
  };

  /* ════════════════════════════════════════════════
     state setters
     ════════════════════════════════════════════════ */
  window.STATE_setQuery = function(v) { STATE.query = v; };
  window.s3SsSetScene = function(v) {
    STATE.sceneIdx = parseInt(v, 10) || 0;
    /* 씬 변경 시 query 자동 다시 생성 */
    s3SsRebuildQuery();
  };
  window.s3SsSetType = function(t) {
    STATE.type = t;
    /* 타입에 맞는 provider 자동 전환 */
    var prov = PROVIDERS.find(function(pv){ return pv.id === STATE.provider; });
    if (prov && prov.types.indexOf(t) < 0) {
      var fallback = PROVIDERS.find(function(pv){ return pv.types.indexOf(t) >= 0; });
      if (fallback) STATE.provider = fallback.id;
    }
    s3SsRebuildQuery();
  };
  window.s3SsSetProvider = function(p) {
    STATE.provider = p;
    _refresh();
  };
  window.s3SsRebuildQuery = function() {
    if (typeof window.buildStockSearchQuery === 'function') {
      var q = window.buildStockSearchQuery(STATE.sceneIdx, { prefer: STATE.type });
      STATE.query = q.query || '';
    }
    _refresh();
  };

  /* ════════════════════════════════════════════════
     검색 실행
     ════════════════════════════════════════════════ */
  window.s3SsSearch = async function() {
    if (!STATE.query || !STATE.query.trim()) {
      alert('현재 씬에서 검색어를 만들 수 없습니다. 이미지 또는 영상 프롬프트를 먼저 생성해주세요.');
      return;
    }
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
     결과 채택 — adoptSceneImage
     ════════════════════════════════════════════════ */
  window.s3SsAdoptResult = function(idx) {
    var item = STATE.results[idx];
    if (!item) return;
    var sceneIdx = STATE.sceneIdx;
    if (typeof window.adoptSceneImage !== 'function') {
      alert('s3-scene-image-state.js 가 로드되지 않았습니다.');
      return;
    }
    var ok = window.adoptSceneImage(sceneIdx, {
      url: item.url || item.thumb,
      thumbUrl: item.thumb,
      previewUrl: item.previewUrl || item.thumb,
      fullUrl: item.fullUrl || item.url,
      provider: item.provider,
      type: item.type,
      credit: item.credit,
      creditUrl: item.creditUrl,
      width: item.width || 0,
      height: item.height || 0,
      aspectRatio: '',
    }, 'stock');
    if (ok && typeof ucShowToast === 'function') {
      ucShowToast('✅ 씬 ' + (sceneIdx+1) + ' 에 ' + item.provider + ' 채택', 'success');
    }
    if (typeof window.renderStudio === 'function') window.renderStudio();
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
      '.s3ss-results{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin-top:6px}'+
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
