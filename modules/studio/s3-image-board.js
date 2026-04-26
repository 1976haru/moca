/* ================================================
   modules/studio/s3-image-board.js
   씬 이미지 보드 (갤러리 + 상세 drawer)
   * 갤러리: 데스크톱 3-4col, 1366px 2-3col, 모바일 1-2col
   * 카드: 썸네일 + 상태/비율/점수 배지 + 작은 pill 액션
   * 카드 클릭 또는 🛠 → 우측 drawer (상세 편집)
   ================================================ */
(function(){
  'use strict';

  /* ── 상태: 현재 보기 모드, 필터, 열린 씬 ── */
  var BOARD_STATE = {
    view:    'gallery',   /* 'gallery' | 'card' | 'detail' */
    filter:  'all',       /* 'all' | 'unmade' | 'adopted' | 'ratio-warn' */
    openIdx: null,
  };
  window._s3OpenSceneIdx = null;

  function _proj() { return (window.STUDIO && window.STUDIO.project) || {}; }
  function _s3()   { var p = _proj(); return p.s3 = p.s3 || {}; }

  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  /* ════════════════════════════════════════════════
     상단 툴바 — 모드 전환 / 일괄 액션 / 비율 모드
     ════════════════════════════════════════════════ */
  function _toolbarHtml(scenes) {
    var s3 = _s3();
    var mode = (typeof window.s3DetectAspectMode === 'function') ? window.s3DetectAspectMode() : 'shorts';
    if (s3.aspectMode !== mode) {
      if (typeof window.s3ApplyAspectToProject === 'function') window.s3ApplyAspectToProject(mode);
    }
    var modeLabel = (typeof window.s3GetModeLabel === 'function') ? window.s3GetModeLabel(mode) : mode;
    var size = s3.imageSize || {};
    var sizeNote = (size.w && size.h) ? (' · ' + size.w + '×' + size.h) : '';

    var modeBtns = ['shorts','longform','thumbnail','cardnews','cardnews45'].map(function(m){
      var on = (mode === m);
      var lbl = (typeof window.s3GetModeLabel === 'function') ? window.s3GetModeLabel(m) : m;
      return '<button class="s3b-mode-btn'+(on?' on':'')+'" onclick="window.s3BoardSetAspect(\''+m+'\')">'+lbl+'</button>';
    }).join('');

    var filterBtns = [
      ['all','전체'], ['unmade','미생성'], ['adopted','채택'], ['ratio-warn','비율 경고'],
    ].map(function(f){
      var on = (BOARD_STATE.filter === f[0]);
      return '<button class="s3b-filter-btn'+(on?' on':'')+'" onclick="window.s3BoardSetFilter(\''+f[0]+'\')">'+f[1]+'</button>';
    }).join('');

    return '<div class="s3b-toolbar">' +
      '<div class="s3b-tb-left">' +
        '<div class="s3b-tb-label">📐 비율 모드</div>' +
        '<div class="s3b-mode-row">' + modeBtns + '</div>' +
        '<div class="s3b-tb-info">현재: <b>' + modeLabel + '</b>' + sizeNote + '</div>' +
      '</div>' +
      '<div class="s3b-tb-right">' +
        '<div class="s3b-bulk-row">' +
          '<button class="s3b-bulk-btn" onclick="window.s3BoardBulkPrompts()">🪄 전체 프롬프트 컴파일</button>' +
          '<button class="s3b-bulk-btn pri" onclick="window.s3BoardGenAll()">⚡ 전체 이미지 생성</button>' +
          '<button class="s3b-bulk-btn" onclick="window.s3BoardGenUnmade()">🆕 미생성만 생성</button>' +
        '</div>' +
        '<div class="s3b-tb-label">필터</div>' +
        '<div class="s3b-filter-row">' + filterBtns + '</div>' +
      '</div>' +
    '</div>';
  }

  /* ════════════════════════════════════════════════
     갤러리 카드
     ════════════════════════════════════════════════ */
  function _galleryCardHtml(sc, idx) {
    var slot = (typeof window.s3GetSlot === 'function') ? window.s3GetSlot(idx) : null;
    var sel  = (typeof window.s3GetSelectedCandidate === 'function') ? window.s3GetSelectedCandidate(idx) : null;
    var url  = sel ? sel.url : '';
    var skipped = !!(slot && slot.skipped);
    var role = sc.role || 'core';
    var roleLabel = ({hook:'훅', setup:'설명', situation:'상황', core:'핵심', core_cause:'원인',
                     conflict_or_core:'갈등', reveal_or_solution:'해결', reversal:'반전',
                     conclusion:'결론', cta:'CTA'})[role] || role;

    /* 비율 평가 */
    var ratioBadge = '', ratioBadgeCls = '';
    if (url && sel && sel.width && sel.height && typeof window.s3EvaluateRatio === 'function') {
      var ev = window.s3EvaluateRatio(sel.width, sel.height, _s3().aspectMode || 'shorts');
      if (ev.kind === 'ok')      { ratioBadge = '✅'; ratioBadgeCls = 's3b-rb-ok'; }
      else if (ev.kind === 'warn'){ ratioBadge = '⚠'; ratioBadgeCls = 's3b-rb-warn'; }
      else                        { ratioBadge = '⚠!';ratioBadgeCls = 's3b-rb-wrong'; }
    }

    var status = skipped ? '⏭ 건너뜀' : url ? (sc.adoptedExplicit === false ? '생성 완료' : '✅ 채택') : '⬜ 생성 전';
    var statusCls = skipped ? 'skip' : url ? 'done' : 'empty';

    /* 점수 (이미지 프롬프트) */
    var scoreChip = '';
    var s3 = _s3();
    var imgP = (s3.imagePrompts && s3.imagePrompts[idx]) || (slot && slot.prompt) || (s3.prompts && s3.prompts[idx]) || '';
    if (imgP && typeof window.s3ScoreImagePrompt === 'function') {
      var scr = window.s3ScoreImagePrompt(imgP).score;
      var t = (typeof window.s3PromptTier === 'function') ? window.s3PromptTier(scr) : null;
      scoreChip = '<span class="s3b-score" style="color:'+(t?t.color:'#666')+';background:'+(t?t.bg:'#eee')+'">'+scr+'</span>';
    }

    var thumb = url
      ? '<img src="'+_esc(url)+'" alt="씬 '+(idx+1)+'" loading="lazy">'
      : '<div class="s3b-empty"><div style="font-size:24px">🖼</div><div>생성 전</div></div>';

    return '<div class="s3b-card s3b-card-'+statusCls+(skipped?' s3b-skip':'')+'" onclick="window.s3OpenSceneDetail('+idx+')">' +
      '<div class="s3b-thumb-wrap">' + thumb +
        (ratioBadge ? '<span class="s3b-rb '+ratioBadgeCls+'" title="비율">'+ratioBadge+'</span>' : '') +
        scoreChip +
      '</div>' +
      '<div class="s3b-meta">' +
        '<div class="s3b-meta-row">' +
          '<span class="s3b-no">씬 '+(idx+1)+'</span>' +
          '<span class="s3b-role">'+roleLabel+'</span>' +
          '<span class="s3b-time">'+_esc(sc.time||'')+'</span>' +
        '</div>' +
        '<div class="s3b-meta-row s3b-status-row">' +
          '<span class="s3b-status s3b-st-'+statusCls+'">'+status+'</span>' +
        '</div>' +
        '<div class="s3b-actions" onclick="event.stopPropagation()">' +
          (url ?
            '<button class="s3b-act" onclick="window.s3OpenSceneDetail('+idx+')" title="조정">🛠</button>' +
            '<button class="s3b-act" onclick="window.s3OpenImagePreview(\''+_esc(url)+'\',\'씬 '+(idx+1)+'\')" title="확대">🔍</button>' +
            '<button class="s3b-act" onclick="window.studioS3RegenScene('+idx+')" title="재생성">🔄</button>' +
            '<button class="s3b-act" onclick="window.s3BoardToggleSkip('+idx+')" title="건너뜀">⏭</button>'
          :
            '<button class="s3b-act pri" onclick="window.studioS3GenScene('+idx+')" title="생성">🎨</button>' +
            '<button class="s3b-act" onclick="window.s3OpenSceneDetail('+idx+')" title="상세">🛠</button>' +
            '<button class="s3b-act" onclick="window.s3BoardToggleSkip('+idx+')" title="건너뜀">⏭</button>'
          ) +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ════════════════════════════════════════════════
     필터 적용
     ════════════════════════════════════════════════ */
  function _applyFilter(scenes) {
    var f = BOARD_STATE.filter;
    if (f === 'all') return scenes.map(function(s,i){ return {sc:s,idx:i}; });
    var s3 = _s3();
    return scenes.map(function(s,i){ return {sc:s,idx:i}; }).filter(function(o){
      var slot = (s3.imagesV3 || {})[o.idx];
      var url  = (typeof window.s3GetSelectedUrl === 'function') ? window.s3GetSelectedUrl(o.idx) : (s3.images||[])[o.idx];
      if (f === 'unmade')   return !url && !(slot && slot.skipped);
      if (f === 'adopted')  return !!url && !(slot && slot.skipped);
      if (f === 'ratio-warn') {
        var sel = (typeof window.s3GetSelectedCandidate === 'function') ? window.s3GetSelectedCandidate(o.idx) : null;
        if (!sel || !sel.width || !sel.height) return false;
        var ev = window.s3EvaluateRatio(sel.width, sel.height, s3.aspectMode || 'shorts');
        return ev.kind !== 'ok';
      }
      return true;
    });
  }

  /* ════════════════════════════════════════════════
     보드 메인 — scenesHtml 자리에 들어감
     ════════════════════════════════════════════════ */
  function renderBoard(scenes) {
    /* 마이그레이션 (안전) */
    if (typeof window.s3NormalizeImageState === 'function') window.s3NormalizeImageState();

    var rows = _applyFilter(scenes);
    var cards = rows.map(function(r){ return _galleryCardHtml(r.sc, r.idx); }).join('');
    var empty = !rows.length
      ? '<div class="s3b-empty-row">표시할 씬이 없습니다. (필터: '+BOARD_STATE.filter+')</div>' : '';
    return _toolbarHtml(scenes) +
      '<div class="s3b-info-bar">📋 씬 ' + scenes.length + '개 · 표시 ' + rows.length + '개 · 클릭하면 상세 편집 패널이 열립니다.</div>' +
      '<div class="s3b-grid">' + cards + '</div>' + empty;
  }
  window.s3RenderBoard = renderBoard;

  /* ════════════════════════════════════════════════
     상세 drawer — 우측 슬라이드 패널
     ════════════════════════════════════════════════ */
  function openDetail(sceneIdx) {
    BOARD_STATE.openIdx = sceneIdx;
    window._s3OpenSceneIdx = sceneIdx;
    var ex = document.getElementById('s3-detail-drawer');
    if (ex) ex.remove();
    var d = document.createElement('div');
    d.id = 's3-detail-drawer';
    d.className = 's3-detail-drawer';
    d.innerHTML = _detailHtml(sceneIdx);
    d.addEventListener('click', function(e){
      if (e.target === d || e.target.classList.contains('s3-detail-close')) closeDetail();
    });
    document.body.appendChild(d);
    setTimeout(function(){ d.classList.add('open'); }, 10);
    document.addEventListener('keydown', _detailEsc);
  }
  function closeDetail() {
    var d = document.getElementById('s3-detail-drawer');
    if (d) { d.classList.remove('open'); setTimeout(function(){ d.remove(); }, 180); }
    BOARD_STATE.openIdx = null;
    window._s3OpenSceneIdx = null;
    document.removeEventListener('keydown', _detailEsc);
  }
  function _detailEsc(e) { if (e.key === 'Escape') closeDetail(); }
  window.s3OpenSceneDetail  = openDetail;
  window.s3CloseSceneDetail = closeDetail;

  function refreshDetail(sceneIdx) {
    var d = document.getElementById('s3-detail-drawer');
    if (!d) return;
    var inner = d.querySelector('.s3-detail-inner');
    if (inner) inner.innerHTML = _detailInnerHtml(sceneIdx);
  }
  window.s3RefreshDetail = refreshDetail;

  function _detailHtml(sceneIdx) {
    return '<div class="s3-detail-panel" onclick="event.stopPropagation()">' +
      '<button class="s3-detail-close" aria-label="닫기">✕</button>' +
      '<div class="s3-detail-inner">' + _detailInnerHtml(sceneIdx) + '</div>' +
    '</div>';
  }
  function _detailInnerHtml(sceneIdx) {
    var s3 = _s3();
    var scenes = s3.scenes || [];
    var sc = scenes[sceneIdx] || {};
    var slot = (typeof window.s3GetSlot === 'function') ? window.s3GetSlot(sceneIdx) : null;
    var sel  = (typeof window.s3GetSelectedCandidate === 'function') ? window.s3GetSelectedCandidate(sceneIdx) : null;
    var url  = sel ? sel.url : '';
    var mode = s3.aspectMode || 'shorts';
    var ratio = (mode === 'longform' || mode === 'thumbnail') ? '16/9'
              : (mode === 'cardnews') ? '1/1'
              : (mode === 'cardnews45') ? '4/5' : '9/16';

    var promptText = (s3.imagePrompts && s3.imagePrompts[sceneIdx]) || (slot && slot.prompt) || (s3.prompts && s3.prompts[sceneIdx]) || '';
    var safeOverlay = (typeof window.s3SafeAreaOverlayHtml === 'function') ? window.s3SafeAreaOverlayHtml() : '';
    var tf = (typeof window.s3GetTransform === 'function') ? window.s3GetTransform(sceneIdx) : null;
    var imgStyle = tf && typeof window.s3StyleForTransform === 'function' ? window.s3StyleForTransform(tf) : 'object-fit:contain';

    /* 후보 strip */
    var cands = (slot && slot.candidates) || [];
    var candStrip = cands.length > 0 ?
      '<div class="s3d-cand-strip">' + cands.map(function(c){
        var on = (slot && slot.selectedCandidateId === c.id);
        return '<div class="s3d-cand'+(on?' on':'')+'" onclick="window.s3SelectCandidateAndRefresh('+sceneIdx+',\''+c.id+'\')">' +
          '<img src="'+_esc(c.url)+'" alt="">' +
          '<button class="s3d-cand-del" onclick="event.stopPropagation();window.s3DeleteCandidateAndRefresh('+sceneIdx+',\''+c.id+'\')" title="삭제">🗑</button>' +
        '</div>';
      }).join('') + '</div>' : '<div class="s3d-cand-empty">아직 생성된 후보가 없습니다.</div>';

    /* 비율 평가 */
    var ratioMsg = '';
    if (sel && sel.width && sel.height && typeof window.s3EvaluateRatio === 'function') {
      var ev = window.s3EvaluateRatio(sel.width, sel.height, mode);
      var cls = ev.kind === 'ok' ? 's3d-ratio-ok' : ev.kind === 'wrong' ? 's3d-ratio-wrong' : 's3d-ratio-warn';
      ratioMsg = '<div class="s3d-ratio-msg '+cls+'">' + _esc(ev.label) + '</div>';
    }

    /* 영상 프롬프트 점수 */
    var vidP = (s3.videoPrompts || [])[sceneIdx] || '';
    var vidScore = vidP && typeof window.s3ScoreVideoPrompt === 'function' ? window.s3ScoreVideoPrompt(vidP).score : null;

    return '<div class="s3d-hd">' +
        '<div>' +
          '<div class="s3d-title">씬 '+(sceneIdx+1)+' — '+_esc(sc.label||'')+'</div>' +
          '<div class="s3d-sub">'+_esc(sc.time||'')+' · 역할 '+_esc(sc.role||'core')+'</div>' +
        '</div>' +
      '</div>' +

      /* 미리보기 + safe area overlay */
      '<div class="s3-detail-preview-frame" style="aspect-ratio:'+ratio+'">' +
        (url ?
          '<img class="s3-detail-preview-img" data-scene="'+sceneIdx+'" src="'+_esc(url)+'" '+
            'style="'+imgStyle+'" '+
            'onload="window._s3OnImgLoadedDetail(this,'+sceneIdx+')">'
          : '<div class="s3d-empty"><div style="font-size:36px">🖼</div><div style="font-size:12px;color:#999;margin-top:6px">'+_esc(((typeof window.s3GetModeLabel==='function')?window.s3GetModeLabel(mode):mode))+' 영역</div><div style="font-size:11px;color:#bbb;margin-top:2px">생성 전</div></div>') +
        safeOverlay +
      '</div>' +
      ratioMsg +

      /* 액션 행 */
      '<div class="s3d-action-row">' +
        (url ?
          '<button class="s3d-act pri" onclick="window.studioS3RegenScene('+sceneIdx+')">🔄 재생성</button>' +
          '<button class="s3d-act" onclick="window.s3OpenImagePreview(\''+_esc(url)+'\',\'씬 '+(sceneIdx+1)+'\')">🔍 확대</button>' +
          '<button class="s3d-act" onclick="window.s3OpenOriginal(\''+_esc(url)+'\')">🖼 원본</button>'
        :
          '<button class="s3d-act pri" onclick="window.studioS3GenScene('+sceneIdx+')">🎨 AI 생성</button>'
        ) +
        '<button class="s3d-act" onclick="window.s3BoardToggleSkip('+sceneIdx+');window.s3RefreshDetail('+sceneIdx+')">⏭ 건너뜀</button>' +
        '<button class="s3d-act" onclick="window.studioS3SaveLib('+sceneIdx+')">📁 라이브러리</button>' +
      '</div>' +

      /* 자막 안전영역 설정 */
      '<details class="s3d-block" open>' +
        '<summary>📐 자막 안전영역 (overlay)</summary>' +
        ((typeof window.s3SafeAreaSettingsHtml === 'function') ? window.s3SafeAreaSettingsHtml() : '') +
      '</details>' +

      /* 크기·위치 조정 */
      (url ?
        '<details class="s3d-block" open>' +
          '<summary>🛠 크기·위치 조정</summary>' +
          ((typeof window.s3RenderAdjustControlsHtml === 'function') ? window.s3RenderAdjustControlsHtml(sceneIdx) : '') +
        '</details>'
      : '') +

      /* 후보 이미지 */
      '<details class="s3d-block" open>' +
        '<summary>🖼 후보 이미지 (' + cands.length + ')</summary>' +
        candStrip +
      '</details>' +

      /* 프롬프트 */
      '<details class="s3d-block">' +
        '<summary>📝 이미지 프롬프트</summary>' +
        '<textarea id="s3d-prompt-'+sceneIdx+'" class="s3d-prompt-ta" '+
          'oninput="window.s3DetailUpdatePrompt('+sceneIdx+', this.value)" '+
          'placeholder="비율 키워드는 자동 주입됩니다.">'+_esc(promptText)+'</textarea>' +
        '<div class="s3d-prompt-actions">' +
          '<button class="s3d-act" onclick="window.studioS3AutoPrompt('+sceneIdx+')">🤖 AI 생성</button>' +
          '<button class="s3d-act" onclick="window.s3PromptCopy('+sceneIdx+',\'image\')">📋 복사</button>' +
          '<button class="s3d-act" onclick="window.s3PromptImprove('+sceneIdx+',\'image\');window.s3RefreshDetail('+sceneIdx+')">✨ 개선</button>' +
        '</div>' +
      '</details>' +

      /* 영상 프롬프트 */
      '<details class="s3d-block">' +
        '<summary>🎬 영상 프롬프트' + (vidScore != null ? ' · 점수 '+vidScore : '') + '</summary>' +
        '<div class="s3d-vid-actions">' +
          '<button class="s3d-act pri" onclick="window.s3PromptCompileScene('+sceneIdx+',\'video\');window.s3RefreshDetail('+sceneIdx+')">🪄 영상 프롬프트 생성</button>' +
          '<button class="s3d-act" onclick="window.s3PromptCopy('+sceneIdx+',\'video\')">📋 복사</button>' +
          '<button class="s3d-act" onclick="window.s3PromptOpenVideoTab('+sceneIdx+')">🎬 영상 탭으로</button>' +
        '</div>' +
        (vidP ? '<pre class="s3d-vid-pre">'+_esc(vidP)+'</pre>' : '<div class="s3d-vid-empty">아직 생성되지 않았습니다.</div>') +
      '</details>';
  }

  /* ── 라이트박스 / 원본은 s3-preview.js 의 함수를 호출만 ── */
  window.s3OpenImagePreview = window.s3OpenImagePreview || function(){};
  window.s3OpenOriginal     = window.s3OpenOriginal     || function(){};

  /* ── live: 후보 선택 ── */
  window.s3SelectCandidateAndRefresh = function(sceneIdx, candId){
    if (typeof window.s3SelectCandidate === 'function') window.s3SelectCandidate(sceneIdx, candId);
    refreshDetail(sceneIdx);
  };
  window.s3DeleteCandidateAndRefresh = function(sceneIdx, candId){
    if (!confirm('이 후보 이미지를 삭제할까요?')) return;
    if (typeof window.s3DeleteCandidate === 'function') window.s3DeleteCandidate(sceneIdx, candId);
    refreshDetail(sceneIdx);
  };
  /* ── live: 프롬프트 textarea → 슬롯/배열 갱신 ── */
  window.s3DetailUpdatePrompt = function(sceneIdx, val){
    var s3 = _s3();
    s3.imagePrompts = s3.imagePrompts || [];
    s3.imagePrompts[sceneIdx] = val;
    s3.prompts = s3.prompts || [];
    s3.prompts[sceneIdx] = val;
    if (typeof window.s3GetSlot === 'function') {
      var slot = window.s3GetSlot(sceneIdx);
      if (slot) slot.prompt = val;
    }
    if (typeof window.studioSave === 'function') window.studioSave();
  };
  /* ── 결과 이미지 onload — 후보의 width/height 저장 ── */
  window._s3OnImgLoadedDetail = function(img, sceneIdx){
    if (!img || !img.naturalWidth) return;
    var sel = (typeof window.s3GetSelectedCandidate === 'function') ? window.s3GetSelectedCandidate(sceneIdx) : null;
    if (sel && (!sel.width || !sel.height)) {
      sel.width = img.naturalWidth; sel.height = img.naturalHeight;
      if (typeof window.studioSave === 'function') window.studioSave();
    }
  };

  /* ── 보드 액션 ── */
  window.s3BoardSetAspect = function(mode){
    if (typeof window.s3ApplyAspectToProject === 'function') window.s3ApplyAspectToProject(mode);
    if (typeof window.renderStudio === 'function') window.renderStudio();
  };
  window.s3BoardSetFilter = function(f){
    BOARD_STATE.filter = f;
    if (typeof window.renderStudio === 'function') window.renderStudio();
  };
  window.s3BoardToggleSkip = function(idx){
    var slot = (typeof window.s3GetSlot === 'function') ? window.s3GetSlot(idx) : null;
    var cur = !!(slot && slot.skipped);
    if (typeof window.s3SetSkipped === 'function') window.s3SetSkipped(idx, !cur);
    if (typeof window.renderStudio === 'function') window.renderStudio();
  };
  window.s3BoardBulkPrompts = function(){
    if (typeof window.s3PromptCompileAll === 'function') window.s3PromptCompileAll();
  };
  window.s3BoardGenAll = function(){
    if (typeof window.studioS3GenAll === 'function') window.studioS3GenAll();
  };
  window.s3BoardGenUnmade = function(){
    if (typeof window.studioS3GenAll !== 'function') return;
    /* 미생성만: studioS3GenAll 가 모두 돈다면 임시로 채택된 씬 표시는 그대로 둔 채 호출.
       세분화 함수 없으면 일단 전체 호출로 fallback. */
    window.studioS3GenAll();
  };

  /* ════════════════════════════════════════════════
     CSS injection
     ════════════════════════════════════════════════ */
  function _injectCSS() {
    if (document.getElementById('s3b-style')) return;
    var st = document.createElement('style');
    st.id = 's3b-style';
    st.textContent = ''
      + '.s3b-toolbar{display:grid;grid-template-columns:1fr 1fr;gap:14px;background:linear-gradient(135deg,#fffafd,#f7f4ff);border:1px solid #ecd9ee;border-radius:14px;padding:12px 14px;margin-bottom:10px}'
      + '@media(max-width:980px){.s3b-toolbar{grid-template-columns:1fr}}'
      + '.s3b-tb-label{font-size:11.5px;font-weight:800;color:#5b1a4a;margin-bottom:4px}'
      + '.s3b-mode-row,.s3b-filter-row,.s3b-bulk-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}'
      + '.s3b-mode-btn,.s3b-filter-btn{padding:5px 10px;border:1.5px solid var(--line);background:#fff;color:#555;border-radius:999px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit}'
      + '.s3b-mode-btn.on,.s3b-filter-btn.on{background:#ef6fab;color:#fff;border-color:#ef6fab}'
      + '.s3b-tb-info{font-size:11px;color:#7b6080}'
      + '.s3b-bulk-btn{padding:6px 11px;border:1.5px solid #d4cdec;background:#fff;color:#5a4a8a;border-radius:8px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit}'
      + '.s3b-bulk-btn.pri{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border:none}'
      + '.s3b-bulk-btn:hover{border-color:#9181ff;color:#9181ff}'
      + '.s3b-bulk-btn.pri:hover{opacity:.92;color:#fff}'
      + '.s3b-info-bar{font-size:11px;color:#7b6080;background:#f8f5fc;border-radius:8px;padding:6px 10px;margin-bottom:8px}'
      + '.s3b-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}'
      + '@media(max-width:1366px){.s3b-grid{grid-template-columns:repeat(3,1fr)}}'
      + '@media(max-width:900px){.s3b-grid{grid-template-columns:repeat(2,1fr)}}'
      + '@media(max-width:520px){.s3b-grid{grid-template-columns:1fr}}'
      + '.s3b-card{background:#fff;border:1.5px solid var(--line);border-radius:12px;overflow:hidden;cursor:pointer;transition:.14s;display:flex;flex-direction:column}'
      + '.s3b-card:hover{transform:translateY(-2px);border-color:#9181ff;box-shadow:0 6px 18px rgba(145,129,255,.18)}'
      + '.s3b-card-empty{border-style:dashed}'
      + '.s3b-card.s3b-skip{opacity:.55}'
      + '.s3b-thumb-wrap{position:relative;aspect-ratio:9/16;background:#f5f5f7;display:flex;align-items:center;justify-content:center;overflow:hidden}'
      + '.s3b-thumb-wrap img{width:100%;height:100%;object-fit:cover;display:block}'
      + '.s3b-empty{color:#bbb;text-align:center;font-size:11px}'
      + '.s3b-rb{position:absolute;top:6px;right:6px;width:24px;height:24px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;background:rgba(0,0,0,.45)}'
      + '.s3b-rb-ok{background:#27ae60}.s3b-rb-warn{background:#e0a000}.s3b-rb-wrong{background:#c0392b}'
      + '.s3b-score{position:absolute;top:6px;left:6px;background:#fff;border:1.5px solid #eee;color:#666;border-radius:999px;font-size:10.5px;font-weight:900;padding:2px 7px}'
      + '.s3b-meta{padding:8px 10px}'
      + '.s3b-meta-row{display:flex;align-items:center;gap:6px;font-size:11px;color:#666;margin-bottom:4px}'
      + '.s3b-no{font-weight:900;color:#2b2430;font-size:12px}'
      + '.s3b-role{background:#f5f0ff;color:#5a4a8a;padding:1px 6px;border-radius:6px;font-weight:700;font-size:10.5px}'
      + '.s3b-time{margin-left:auto}'
      + '.s3b-status-row{margin-bottom:6px}'
      + '.s3b-status{font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px}'
      + '.s3b-st-empty{background:#eee;color:#777}.s3b-st-done{background:#effbf7;color:#1a7a5a}.s3b-st-skip{background:#fff1f1;color:#c0392b}'
      + '.s3b-actions{display:flex;gap:4px;flex-wrap:wrap}'
      + '.s3b-act{flex:1;min-width:32px;padding:5px 6px;border:1px solid var(--line);background:#fff;color:#555;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit}'
      + '.s3b-act.pri{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border:none}'
      + '.s3b-act:hover{background:#f5f0ff;color:#9181ff}'
      + '.s3b-act.pri:hover{opacity:.92;color:#fff}'
      + '.s3b-empty-row{padding:24px;text-align:center;color:#999;font-size:13px;background:#fff;border:1px dashed #ddd;border-radius:12px}'
      /* drawer */
      + '.s3-detail-drawer{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:10002;display:flex;justify-content:flex-end;opacity:0;transition:opacity .18s}'
      + '.s3-detail-drawer.open{opacity:1}'
      + '.s3-detail-panel{width:min(560px,100%);max-width:100%;height:100%;background:#fff;overflow-y:auto;padding:18px 18px 100px;box-sizing:border-box;transform:translateX(100%);transition:transform .18s ease-out;position:relative}'
      + '.s3-detail-drawer.open .s3-detail-panel{transform:translateX(0)}'
      + '.s3-detail-close{position:sticky;top:0;float:right;border:none;background:#eee;border-radius:999px;padding:6px 14px;cursor:pointer;font-weight:700;font-size:13px;z-index:1}'
      + '.s3d-hd{margin-bottom:10px}.s3d-title{font-size:15px;font-weight:900;color:#2b2430}.s3d-sub{font-size:11.5px;color:#7b6080;margin-top:2px}'
      + '.s3-detail-preview-frame{position:relative;width:min(100%,360px);margin:0 auto 8px;background:#f5f5f7;border:1px solid rgba(0,0,0,.08);border-radius:14px;overflow:hidden}'
      + '.s3-detail-preview-img{display:block;width:100%;height:100%}'
      + '.s3d-empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#999;text-align:center}'
      + '.s3d-ratio-msg{font-size:11.5px;border-radius:8px;padding:6px 10px;margin:0 auto 10px;text-align:center;max-width:360px}'
      + '.s3d-ratio-ok{background:#effbf7;color:#1a7a5a}.s3d-ratio-warn{background:#fff7e6;color:#a05a00}.s3d-ratio-wrong{background:#fff1f1;color:#c0392b}'
      + '.s3d-action-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}'
      + '.s3d-act{flex:1;min-width:80px;padding:7px 12px;border:1.5px solid var(--line);background:#fff;color:#5a4a56;border-radius:999px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit}'
      + '.s3d-act.pri{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border:none}'
      + '.s3d-act:hover{border-color:#9181ff;color:#9181ff}'
      + '.s3d-act.pri:hover{opacity:.92;color:#fff}'
      + '.s3d-block{background:#fafafe;border:1px solid #ece6f5;border-radius:10px;padding:8px 12px;margin-bottom:10px}'
      + '.s3d-block summary{cursor:pointer;font-size:12px;font-weight:800;color:#5b1a4a;list-style:none;display:flex;align-items:center;gap:6px;padding:2px 0}'
      + '.s3d-block summary::after{content:"▾";margin-left:auto;color:#9181ff}'
      + '.s3d-cand-strip{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}'
      + '.s3d-cand{position:relative;width:60px;height:108px;border-radius:8px;overflow:hidden;border:2px solid var(--line);background:#fff;cursor:pointer}'
      + '.s3d-cand.on{border-color:#ef6fab}.s3d-cand img{width:100%;height:100%;object-fit:cover;display:block}'
      + '.s3d-cand-del{position:absolute;top:2px;right:2px;border:none;background:rgba(255,255,255,.92);border-radius:6px;font-size:11px;cursor:pointer;padding:2px 4px}'
      + '.s3d-cand-empty{font-size:11.5px;color:#999;padding:6px 0}'
      + '.s3d-prompt-ta{width:100%;border:1.5px solid var(--line);border-radius:8px;padding:8px;font-size:11.5px;resize:vertical;min-height:90px;font-family:inherit;box-sizing:border-box;margin-top:6px}'
      + '.s3d-prompt-actions,.s3d-vid-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}'
      + '.s3d-vid-pre{background:#fff;border:1px solid var(--line);border-radius:8px;padding:8px;font-size:11.5px;line-height:1.5;white-space:pre-wrap;word-break:break-word;margin-top:6px;color:#3a3040}'
      + '.s3d-vid-empty{font-size:11.5px;color:#999;padding:6px 0}'
      ;
    document.head.appendChild(st);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _injectCSS);
  else _injectCSS();
})();
