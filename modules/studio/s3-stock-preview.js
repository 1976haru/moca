/* ================================================
   modules/studio/s3-stock-preview.js
   Step 2 — 스톡 검색 결과 큰 미리보기 + 씬별 재검색

   * sspOpenPreview(resultIndex) — modal 로 큰 이미지/영상
   * sspApplyResult(resultIndex)  — s3.imagesV3[sceneIndex] 에 저장
                                   (selectedSourceType:'stock' + transform 기본값)
   * sspResearchScene(sceneIndex) — 같은 provider 로 해당 씬 query 재검색
   * sspEditQuery(sceneIndex)     — query 수정 prompt
   * 결과 자체는 s3-stock-search-panel.js 의 STATE.results 를 읽음
   ================================================ */
(function(){
  'use strict';

  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function _escAttr(s){ return String(s == null ? '' : s).replace(/"/g,'&quot;').replace(/'/g, "\\'"); }

  function _state() { return window._s3StockState || {}; }

  function _toast(msg, kind) {
    if (typeof window.ucShowToast === 'function') window.ucShowToast(msg, kind || 'info');
    else try { console.debug('[stock-toast]', msg); } catch(_) {}
  }

  /* ════════════════════════════════════════════════
     큰 미리보기 modal
     ════════════════════════════════════════════════ */
  window.sspOpenPreview = function(resultIdx) {
    var st = _state();
    var item = (st.results || [])[resultIdx];
    if (!item) { _toast('결과를 찾을 수 없습니다.', 'warn'); return; }
    var sceneIdx = (st.sceneIdx === 'all' || st.sceneIdx == null) ? 0 : st.sceneIdx;
    var sceneNo  = (typeof window.getSceneByIndex === 'function')
                   ? (window.getSceneByIndex(sceneIdx) || {}).sceneNumber
                   : (sceneIdx + 1);
    sceneNo = sceneNo || (sceneIdx + 1);

    var existing = document.getElementById('ssp-modal');
    if (existing) existing.remove();

    var bigSrc = item.fullUrl || item.url || item.previewUrl || item.thumb;
    var media  = (item.type === 'video')
      ? '<video src="'+_escAttr(item.url || item.fullUrl || '')+'" poster="'+_escAttr(item.thumb || '')+'" controls preload="metadata" class="ssp-media"></video>'
      : '<img src="'+_escAttr(bigSrc)+'" alt="" class="ssp-media" onerror="this.style.opacity=.3">';

    var ratio = (item.width && item.height) ? (item.width + '×' + item.height) : '';

    var html = ''+
    '<div class="ssp-backdrop" onclick="sspClosePreview(event)">'+
      '<div class="ssp-modal" onclick="event.stopPropagation()">'+
        '<div class="ssp-hd">'+
          '<span class="ssp-tag">'+(item.type==='video'?'🎬 영상':'📷 이미지')+'</span>'+
          '<span class="ssp-prov">'+_esc(item.provider||'')+'</span>'+
          (item.credit ? '<span class="ssp-credit">© '+_esc(item.credit)+'</span>' : '')+
          (ratio ? '<span class="ssp-ratio">'+ratio+'</span>' : '')+
          '<button class="ssp-x" onclick="sspClosePreview()">✕</button>'+
        '</div>'+
        '<div class="ssp-body">' + media + '</div>'+
        '<div class="ssp-info">현재 적용 대상: <b>씬 '+sceneNo+'</b></div>'+
        '<div class="ssp-actions">'+
          '<button class="ssp-btn pri" onclick="sspApplyResult('+resultIdx+');sspClosePreview()">✅ 이 결과를 씬 '+sceneNo+'에 적용</button>'+
          '<button class="ssp-btn" onclick="sspResearchScene('+sceneIdx+')">🔄 마음에 안 들어요: 이 씬 다시 검색</button>'+
          '<button class="ssp-btn" onclick="sspEditQuery('+sceneIdx+')">✏️ 검색어 수정하기</button>'+
          (item.creditUrl ? '<a class="ssp-btn link" href="'+_escAttr(item.creditUrl)+'" target="_blank" rel="noopener">출처 열기</a>' : '')+
        '</div>'+
      '</div>'+
    '</div>';

    var div = document.createElement('div');
    div.id = 'ssp-modal';
    div.innerHTML = html;
    document.body.appendChild(div);
    _injectCSS();
  };

  window.sspClosePreview = function(e) {
    if (e && e.target && e.target.classList && !e.target.classList.contains('ssp-backdrop')) return;
    var el = document.getElementById('ssp-modal');
    if (el) el.remove();
  };

  /* ════════════════════════════════════════════════
     결과를 씬에 적용 — 통합 schema 로 저장
     ════════════════════════════════════════════════ */
  window.sspApplyResult = function(resultIdx) {
    var st = _state();
    var item = (st.results || [])[resultIdx];
    if (!item) { _toast('결과를 찾을 수 없습니다.', 'warn'); return; }
    var sceneIdx = (st.sceneIdx === 'all' || st.sceneIdx == null) ? 0 : st.sceneIdx;
    var sceneNo  = sceneIdx + 1;
    try { console.debug('[stock-apply] sceneIndex:', sceneIdx); } catch(_) {}

    var proj = (window.STUDIO && window.STUDIO.project) || {};
    proj.s3 = proj.s3 || {};
    proj.s3.imagesV3 = proj.s3.imagesV3 || {};
    var slot = proj.s3.imagesV3[sceneIdx] || {};
    var candidate = _buildCandidate(item, sceneIdx);
    var allCandidates = (st.results || []).map(function(it){ return _buildCandidate(it, sceneIdx); });

    /* adoptSceneImage 가 있으면 위임 (transform·thumbnail 등 일관 처리) */
    if (typeof window.adoptSceneImage === 'function') {
      window.adoptSceneImage(sceneIdx, {
        url:        candidate.url,
        thumbUrl:   candidate.thumbUrl,
        previewUrl: candidate.previewUrl,
        fullUrl:    candidate.fullUrl,
        provider:   candidate.provider,
        type:       candidate.type,
        credit:     candidate.credit || '',
        creditUrl:  candidate.creditUrl || '',
        width:      candidate.width  || 0,
        height:     candidate.height || 0,
        aspectRatio: candidate.aspectRatio || '',
      }, 'stock');
      /* adoptSceneImage 이후 슬롯 다시 읽어 stockCandidates 추가 */
      slot = proj.s3.imagesV3[sceneIdx] || slot;
    }

    /* spec 통합 schema — selectedCandidate / stockCandidates / sourceType */
    proj.s3.imagesV3[sceneIdx] = Object.assign({}, slot, {
      sceneIndex: sceneIdx,
      sceneNumber: sceneNo,
      selectedSourceType:  'stock',
      selectedCandidateId: candidate.id,
      selectedCandidate:   candidate,
      stockCandidates:     allCandidates,
    });

    if (typeof window.studioSave === 'function') window.studioSave();
    if (typeof window.renderStudio === 'function') window.renderStudio();
    _toast('✅ 씬 '+sceneNo+'에 스톡 소스를 적용했습니다.', 'success');
  };

  function _buildCandidate(item, sceneIdx) {
    var ar = '';
    if (item.width && item.height) {
      var g = _gcd(item.width, item.height);
      ar = (item.width/g) + ':' + (item.height/g);
    }
    var id = item.id ||
             (item.provider + '_' + (item.url || item.thumb || Math.random().toString(36).slice(2)));
    return {
      id:          id,
      url:         item.fullUrl || item.url || item.previewUrl || item.thumb,
      thumbUrl:    item.thumb || item.previewUrl,
      previewUrl:  item.previewUrl || item.thumb,
      fullUrl:     item.fullUrl || item.url || item.previewUrl,
      provider:    item.provider || 'stock',
      type:        item.type || 'image',
      sourceType:  'stock',
      aspectRatio: item.aspectRatio || ar,
      width:       item.width || 0,
      height:      item.height || 0,
      credit:      item.credit || '',
      creditUrl:   item.creditUrl || '',
      transform:   { scale:1, offsetX:0, offsetY:0, fit:'cover' },
    };
  }
  function _gcd(a,b){ return b ? _gcd(b, a%b) : a; }

  /* ════════════════════════════════════════════════
     씬별 재검색 — 같은 provider, 새 query 로
     ════════════════════════════════════════════════ */
  window.sspResearchScene = function(sceneIdx) {
    var st = _state();
    sceneIdx = (sceneIdx == null || sceneIdx === 'all')
             ? (st.sceneIdx === 'all' ? 0 : st.sceneIdx)
             : sceneIdx;
    if (typeof window.buildStockSearchQuery !== 'function') {
      _toast('stock query builder 미로드', 'warn'); return;
    }
    /* query 재생성 (force) */
    var built = window.buildStockSearchQuery(sceneIdx, { prefer: st.type, force:true });
    if (!built || !built.query) {
      _toast('⚠️ 검색어를 만들 수 없습니다. 프롬프트를 먼저 컴파일하거나 직접 입력해주세요.', 'warn');
      return;
    }
    st.sceneIdx = sceneIdx;
    st.query = built.query;
    /* DOM input 즉시 반영 */
    var input = document.querySelector('#s3-stock-panel .s3ss-query, #s3ss-holder .s3ss-query');
    if (input) input.value = built.query;
    /* 검색 실행 */
    sspClosePreview();
    if (typeof window.s3SsSearch === 'function') {
      _toast('🔄 씬 '+(sceneIdx+1)+' 다시 검색', 'info');
      window.s3SsSearch();
    }
  };

  /* ════════════════════════════════════════════════
     검색어 수정 — prompt 로 새 query 입력 후 재검색
     ════════════════════════════════════════════════ */
  window.sspEditQuery = function(sceneIdx) {
    var st = _state();
    sceneIdx = (sceneIdx == null) ? st.sceneIdx : sceneIdx;
    var current = st.query || '';
    var next = prompt('검색어 수정 (씬 '+((sceneIdx===-1||sceneIdx==='all')?'전체':((sceneIdx||0)+1))+'):', current);
    if (next == null) return; /* 취소 */
    next = String(next).trim();
    if (!next) { _toast('검색어가 비어 있습니다.', 'warn'); return; }
    st.query = next;
    var input = document.querySelector('#s3-stock-panel .s3ss-query, #s3ss-holder .s3ss-query');
    if (input) input.value = next;
    sspClosePreview();
    if (typeof window.s3SsSearch === 'function') window.s3SsSearch();
  };

  /* ════════════════════════════════════════════════
     CSS
     ════════════════════════════════════════════════ */
  function _injectCSS() {
    if (document.getElementById('ssp-style')) return;
    var st = document.createElement('style');
    st.id = 'ssp-style';
    st.textContent = ''+
'.ssp-backdrop{position:fixed;inset:0;background:rgba(20,15,30,.72);z-index:9998;display:flex;align-items:center;justify-content:center;padding:18px;animation:sspFade .14s ease}'+
'@keyframes sspFade{from{opacity:0}to{opacity:1}}'+
'.ssp-modal{background:#fff;border-radius:14px;max-width:760px;width:100%;max-height:92vh;overflow-y:auto;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.4)}'+
'.ssp-hd{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid #f1dce7;flex-wrap:wrap}'+
'.ssp-tag{font-size:11px;font-weight:800;color:#5b1a4a;background:#fff5fa;padding:3px 9px;border-radius:20px}'+
'.ssp-prov{font-size:11px;font-weight:700;color:#5b4ecf;background:#ede9ff;padding:3px 9px;border-radius:20px}'+
'.ssp-credit{font-size:10px;color:#7b6080}'+
'.ssp-ratio{font-size:10px;color:#7b6080;margin-left:auto}'+
'.ssp-x{margin-left:auto;border:none;background:transparent;font-size:18px;cursor:pointer;color:#5a4a56;padding:2px 8px}'+
'.ssp-x:hover{color:#ef6fab}'+
'.ssp-body{padding:0;background:#0e0e1a;display:flex;justify-content:center;align-items:center;min-height:280px}'+
'.ssp-media{max-width:100%;max-height:60vh;display:block;background:#0e0e1a}'+
'.ssp-info{padding:10px 14px;font-size:12px;color:#5b1a4a;background:#fafafe;border-bottom:1px solid #f1dce7}'+
'.ssp-info b{color:#ef6fab}'+
'.ssp-actions{padding:12px 14px;display:flex;gap:6px;flex-wrap:wrap}'+
'.ssp-btn{flex:1;min-width:120px;border:1.5px solid #f1dce7;background:#fff;color:#5a4a56;border-radius:10px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;text-align:center;text-decoration:none}'+
'.ssp-btn:hover{border-color:#9181ff;color:#9181ff}'+
'.ssp-btn.pri{border:none;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;font-weight:800}'+
'.ssp-btn.pri:hover{opacity:.92;color:#fff}'+
'.ssp-btn.link{background:#fff5fa}'+
'';
    document.head.appendChild(st);
  }
  _injectCSS();
})();
