/* ================================================
   modules/studio/s1-youtube-remix-board.js
   유튜브 리믹스 보드 — 자동숏츠 프로그램 스타일 60/40 레이아웃
   * 상단 툴바: URL · 자막 자동 가져오기 · 붙여넣기 · 파일 불러오기 · 분석 시작
   * 좌 60%: Scene 카드 리스트 (썸네일 + 자막 칩 + 체크박스 + 시간 범위)
   * 우 40%: iframe 미리보기 + 타임라인 + 활성 Scene 편집 패널
   * 하단: 선택 삭제/복구/공백 삭제 · 4 가지 각색 모드 · 유사도 검사 · Step 2
   * 푸터:  copy safety + 분석 요약 (기존 referenceAnalysis 보존)
   * 의존:  YT_REMIX_PARSER · YT_REMIX_SAFETY · YT_REMIX_ADAPTER · 기존 yrx* 액션
   * 모드 id 호환: youtube_reference_adapt
   ================================================ */
(function(){
  'use strict';

  /* ── helpers ── */
  function _state() { return window.YRX_STATE; }
  function _ensure() {
    var YRX = _state();
    if (!YRX) return null;
    if (typeof YRX.activeSceneIdx !== 'number') YRX.activeSceneIdx = 0;
    if (!YRX.boardMobileTab) YRX.boardMobileTab = 'list';
    return YRX;
  }
  function _save() { if (typeof window.studioSave === 'function') window.studioSave(); }
  function _refresh() {
    if (typeof window._studioS1Step === 'function') window._studioS1Step();
    else if (typeof window.renderStudio === 'function') window.renderStudio();
  }
  function _toast(msg, kind) {
    if (typeof window.ucShowToast === 'function') window.ucShowToast(msg, kind || 'info');
  }
  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function _escAttr(s){ return String(s == null ? '' : s).replace(/"/g,'&quot;').replace(/'/g, "\\'"); }
  function _fmtSec(sec){
    var s = Math.max(0, Math.round(sec || 0));
    var m = Math.floor(s/60); var ss = s%60;
    return m+':'+(ss<10?'0'+ss:ss);
  }
  function _toChips(text) {
    var s = String(text || '').trim();
    if (!s) return [];
    /* 한국어/일본어/영어 모두 공백 + 구두점으로 chip 분할 */
    return s.split(/[\s,.!?。、！？]+/).filter(Boolean);
  }
  function _isVisible(sc) { return sc && !sc.deleted; }

  var ADAPT_MODES = [
    { id:'subtitle_only',  title:'자막만 번역',     hint:'장면 구조 유지 · 한/일/한일 자막 변환' },
    { id:'partial_rewrite',title:'대본 일부 각색',  hint:'장면 구조 유지 · 말투/표현 수정' },
    { id:'structure_only', title:'구조만 참고',     hint:'대사·장면을 새 주제로 새로 작성' },
    { id:'full_recreate',  title:'완전 재창작',     hint:'장점만 참고 · 전부 새로 작성' },
  ];
  var CAPTION_LANGS = [
    { id:'ko',   label:'한국어' },
    { id:'ja',   label:'일본어' },
    { id:'both', label:'한일 동시' },
  ];

  /* ════════════════════════════════════════════════
     메인 진입점 — s1-modes.js 디스패처가 호출
     ════════════════════════════════════════════════ */
  window._s1RenderYoutubeRemixBoardBlock = function() {
    _injectCSS();
    var YRX = _ensure();
    if (!YRX) {
      return '<div class="s1s-block s1s-mode-block"><div class="yrxb-empty">' +
        'YRX_STATE 미초기화 — s1-youtube-remix.js 가 먼저 로드돼야 합니다.</div></div>';
    }
    /* legacy → import packet 마이그레이션 (1회) */
    try { if (window.YT_IMPORT && typeof window.YT_IMPORT.migrateLegacy === 'function') window.YT_IMPORT.migrateLegacy(); } catch(_){}
    var hasScenes = (YRX.detectedScenes || []).length > 0;
    /* 일본어 자막 테스트 모드 — 토글 ON 이면 board 대신 ja-test 패널을 본문으로 사용 */
    var jaMode = !!YRX.jaTestMode;
    return '' +
    '<div class="s1s-block s1s-mode-block yrxb-wrap">' +
      '<div class="s1s-label">🎬 유튜브 리믹스 보드 — 영상을 보면서 장면별로 수정·번역·각색</div>' +
      '<div class="yrxb-notice" style="background:linear-gradient(135deg,#fff5fa,#f5f0ff);border-color:#c7b3e5">' +
        '🎞 더 깔끔한 흐름이 필요하다면 <a href="../remix/index.html" style="color:#9181ff;text-decoration:underline;font-weight:800">영상 리믹스 스튜디오 (신규)</a> 를 사용해 보세요. ' +
        'URL/MP4 업로드 + 자막 SRT/TXT + 장면 보드 + 일본어 자막 + 음성 교체가 한 화면에 모여 있습니다.' +
      '</div>' +
      '<div class="yrxb-notice">⚠️ 영상 다운로드/원본 파일 저장 금지 — iframe 미리보기 + 사용자가 붙여넣은 자막/대본만 사용합니다. ' +
        '원본 문장을 그대로 복제하지 말고 수정/번역/각색해 주세요.</div>' +
      _renderToolbar(YRX) +
      _renderImportStatus(YRX) +
      _renderImportErrors(YRX) +
      _renderBridgeBanner(YRX) +
      (jaMode
        ? (typeof window._s1RenderJaTestPanel === 'function' ? window._s1RenderJaTestPanel() : '')
        : (
          _renderPasteArea(YRX) +
          _renderModeBar(YRX) +
          (hasScenes ? _renderBoard(YRX) : _renderEmptyHint()) +
          (hasScenes ? _renderActionBar(YRX) : '')
        )) +
      _renderFooter(YRX) +
      _renderStatus(YRX) +
    '</div>';
  };

  /* ── import 단계별 상태 (1/4 → 4/4) ── */
  function _renderImportStatus(YRX) {
    var st = YRX.importStatus;
    if (!st || !st.steps) return '';
    return '<div class="yrxb-impst">' +
      st.steps.map(function(s){
        var cls = s.state || 'pending';
        var icon = cls === 'ok' ? '✅' : cls === 'error' ? '❌' : cls === 'warn' ? '⚠️' : cls === 'running' ? '⏳' : '◻';
        return '<div class="yrxb-impst-step '+cls+'">' +
          '<span class="yrxb-impst-icon">'+icon+'</span>' +
          '<span class="yrxb-impst-label">'+_esc(s.label)+'</span>' +
          (s.detail ? '<span class="yrxb-impst-detail">'+_esc(s.detail)+'</span>' : '') +
        '</div>';
      }).join('') +
    '</div>';
  }

  /* ── import 실패 / 경고 패널 (조용한 실패 금지) ── */
  function _renderImportErrors(YRX) {
    var pk = (window.YT_IMPORT && typeof window.YT_IMPORT.getImport === 'function') ? window.YT_IMPORT.getImport() : null;
    var errs = (pk && pk.errors) || [];
    var warns = (pk && pk.warnings) || [];
    if (!errs.length && !warns.length) return '';
    var html = '';
    if (errs.length) {
      html += '<div class="yrxb-errpanel high">' +
        '<div class="yrxb-errpanel-hd">❌ import 실패 / 미완료</div>' +
        '<ul>' + errs.map(function(e){
          return '<li><b>['+_esc(e.code||'error')+']</b> '+_esc(e.message||'')+'</li>';
        }).join('') + '</ul>' +
        '<div class="yrxb-errpanel-fix">' +
          '<button type="button" class="yrxb-mini" onclick="yrxBoardTogglePaste()">📋 자막 직접 붙여넣기</button>' +
          '<button type="button" class="yrxb-mini" onclick="yrxBoardRunImport()">↻ 다시 가져오기</button>' +
        '</div>' +
      '</div>';
    }
    if (warns.length) {
      html += '<div class="yrxb-errpanel warn">' +
        '<div class="yrxb-errpanel-hd">⚠️ 경고 (진행 가능)</div>' +
        '<ul>' + warns.map(function(w){
          return '<li><b>['+_esc(w.code||'warn')+']</b> '+_esc(w.message||'')+'</li>';
        }).join('') + '</ul>' +
      '</div>';
    }
    return html;
  }

  /* ── Step 2 bridge 결과 배너 ── */
  function _renderBridgeBanner(YRX) {
    var br = YRX.bridgeResult;
    if (!br) return '';
    if (br.ok) {
      var scenes = YRX.detectedScenes || [];
      var totN = scenes.filter(_isVisible).length;
      var selN = scenes.filter(function(sc){ return _isVisible(sc) && sc.selected; }).length;
      var excludeNote = (totN > selN)
        ? ' (선택 안 된 ' + (totN - selN) + '개 씬은 export 에서 제외됨)'
        : '';
      return '<div class="yrxb-errpanel ok">' +
        '<div class="yrxb-errpanel-hd">✅ Step 2 전달 성공 — 씬 '+br.written.scenes+'개 · prompt '+br.written.prompts+'개'+_esc(excludeNote)+'</div>' +
        '<div class="yrxb-errpanel-fix">' +
          '<button type="button" class="yrxb-mini ok" onclick="if(window.studioGoto)studioGoto(2)">→ Step 2 (이미지·영상) 으로 이동</button>' +
        '</div>' +
      '</div>';
    }
    return '<div class="yrxb-errpanel high">' +
      '<div class="yrxb-errpanel-hd">❌ Step 2 전달 실패</div>' +
      '<ul>' + (br.errors||[]).map(function(e){
        return '<li><b>['+_esc(e.code||'')+']</b> '+_esc(e.message||'')+'</li>';
      }).join('') + '</ul>' +
    '</div>';
  }

  /* ── 상단 툴바 ── */
  function _renderToolbar(YRX) {
    return '<div class="yrxb-toolbar">' +
      '<input type="url" class="yrxb-url" placeholder="유튜브 링크 — watch?v= / shorts/ / youtu.be/" ' +
        'value="'+_escAttr(YRX.url||'')+'" oninput="yrxSetUrl(this.value)">' +
      '<button type="button" class="yrxb-tb-btn" '+(YRX.busy||!YRX.videoId?'disabled':'')+
        ' onclick="yrxFetchTranscript()" title="유튜브 timedtext — CORS 정책으로 실패 시 직접 붙여넣기">🔄 자막 자동 가져오기</button>' +
      '<button type="button" class="yrxb-tb-btn" onclick="yrxBoardTogglePaste()">📋 자막/대본 붙여넣기</button>' +
      '<label class="yrxb-tb-btn yrxb-file" title="자막 .srt/.vtt/.txt 파일 선택">' +
        '📁 파일 불러오기' +
        '<input type="file" accept=".srt,.vtt,.txt" onchange="yrxBoardLoadFile(event)">' +
      '</label>' +
      '<button type="button" class="yrxb-tb-btn pri" '+(YRX.busy?'disabled':'')+
        ' onclick="yrxBoardRunImport()">🪄 가져오기 / 장면 분리</button>' +
      (YRX.jaTestMode
        ? '<button type="button" class="yrxb-tb-btn" onclick="yrxJaTestExit()" title="일반 보드로 돌아가기">← 일반 보드</button>'
        : '<button type="button" class="yrxb-tb-btn" onclick="yrxJaTestEnter()" title="원본 ↔ 일본어 자막 비교 + 일괄 번역 + SRT/TXT 다운로드">🇯🇵 자막 일본어 테스트 모드</button>') +
    '</div>';
  }

  /* ── 자막 붙여넣기 영역 (토글) ── */
  function _renderPasteArea(YRX) {
    var open = !!YRX.boardPasteOpen;
    var hasScenes = (YRX.detectedScenes||[]).length > 0;
    if (!open && hasScenes) return '';
    return '<div class="yrxb-paste">' +
      '<label class="yrxb-paste-label">자막 / 대본 붙여넣기 — 시간 표기(00:12 또는 00:12 → 00:18) 가 있으면 자동 분해</label>' +
      '<textarea class="yrxb-paste-ta" placeholder="00:00 - 00:05 여러분 방금 영상 어떠셨나요&#10;00:05 - 00:10 ...&#10;&#10;또는 일반 문장 그대로" ' +
        'oninput="yrxSet(\'transcript\',this.value)">'+_esc(YRX.transcript||'')+'</textarea>' +
    '</div>';
  }

  /* ── 모드 바 ── */
  function _renderModeBar(YRX) {
    return '<div class="yrxb-modebar">' +
      '<span class="yrxb-modebar-label">🪄 작업 모드</span>' +
      ADAPT_MODES.map(function(m){
        var on = YRX.adaptationMode === m.id;
        return '<button type="button" class="yrxb-mode-btn '+(on?'on':'')+'" ' +
          'onclick="yrxSet(\'adaptationMode\',\''+m.id+'\')" title="'+_escAttr(m.hint)+'">'+_esc(m.title)+'</button>';
      }).join('') +
      '<span class="yrxb-modebar-sep"></span>' +
      '<span class="yrxb-modebar-label">자막 언어</span>' +
      CAPTION_LANGS.map(function(c){
        var on = YRX.captionLang === c.id;
        return '<button type="button" class="yrxb-mode-btn '+(on?'on':'')+'" ' +
          'onclick="yrxSet(\'captionLang\',\''+c.id+'\')">'+_esc(c.label)+'</button>';
      }).join('') +
      '<label class="yrxb-modebar-chk">' +
        '<input type="checkbox" '+(YRX.seniorTone?'checked':'')+' onchange="yrxToggleSenior()"> 시니어 톤' +
      '</label>' +
    '</div>';
  }

  /* ── 빈 상태 — 큰 안내 + 즉시 paste textarea 노출 ── */
  function _renderEmptyHint() {
    return '<div class="yrxb-empty-hint">' +
      '<div class="yrxb-empty-hd">📋 가져오기 시작 — 다음 중 하나를 입력하세요</div>' +
      '<ol class="yrxb-empty-steps">' +
        '<li><b>유튜브 링크</b> — 위 입력창에 URL 을 붙여 넣고 "🔄 자막 자동 가져오기" 를 시도</li>' +
        '<li><b>자막/대본 직접 붙여넣기</b> — 자동 가져오기 실패 시 유튜브 자막(CC) 또는 SRT/VTT 를 복사해서 아래 textarea 에 붙여넣기</li>' +
        '<li><b>파일 불러오기</b> — .srt/.vtt/.txt 파일을 직접 선택</li>' +
      '</ol>' +
      '<div class="yrxb-empty-warn">⚠️ 클라이언트 단독으로는 자막/프레임 자동 추출이 CORS 로 막힐 수 있습니다. ' +
        '서버(/api/youtube/...)가 설정되지 않은 환경에서는 <b>자막 직접 붙여넣기</b>가 가장 확실한 방법입니다.</div>' +
      '<div class="yrxb-empty-cta">' +
        '<button type="button" class="yrxb-act-btn pri" onclick="yrxBoardRunImport()">🪄 가져오기 / 장면 분리 시작</button>' +
        '<button type="button" class="yrxb-act-btn" onclick="yrxBoardTogglePaste()">📋 자막 붙여넣기 영역 열기</button>' +
      '</div>' +
    '</div>';
  }

  /* ── 보드 (좌 60% 우 40%) ── */
  function _renderBoard(YRX) {
    var mt = YRX.boardMobileTab || 'list';
    return '<div class="yrxb-board" data-mt="'+_esc(mt)+'">' +
      '<div class="yrxb-mt-tabs">' +
        '<button class="yrxb-mt-tab '+(mt==='list'?'on':'')+'" onclick="yrxBoardSetMt(\'list\')">📋 Scene 리스트</button>' +
        '<button class="yrxb-mt-tab '+(mt==='preview'?'on':'')+'" onclick="yrxBoardSetMt(\'preview\')">▶ 미리보기</button>' +
        '<button class="yrxb-mt-tab '+(mt==='edit'?'on':'')+'" onclick="yrxBoardSetMt(\'edit\')">✏️ 편집</button>' +
      '</div>' +
      _renderSceneList(YRX) +
      _renderRightPanel(YRX) +
    '</div>';
  }

  /* ── Scene 리스트 (좌측 60%) ── */
  function _renderSceneList(YRX) {
    var scenes = YRX.detectedScenes || [];
    var visibleCount = scenes.filter(_isVisible).length;
    var visibleSel = scenes.filter(function(sc){ return _isVisible(sc) && sc.selected; });
    var allSel = visibleCount > 0 && visibleSel.length === visibleCount;
    var anyDeleted = scenes.some(function(sc){ return sc.deleted; });
    return '<div class="yrxb-list">' +
      '<div class="yrxb-list-hd">' +
        '<label class="yrxb-list-checkall">' +
          '<input type="checkbox" '+(allSel?'checked':'')+' onchange="yrxBoardSelectAll(this.checked)"> ' +
          '<b>전체 선택</b> <span class="yrxb-list-cnt">'+visibleSel.length+' / '+visibleCount+' 선택</span>' +
        '</label>' +
        (anyDeleted ? '<button type="button" class="yrxb-mini" onclick="yrxBoardRestoreAll()">↺ 전체 복구</button>' : '') +
      '</div>' +
      '<div class="yrxb-list-note">선택 해제된 씬은 Step 2 export 에서 자동 제외됩니다.</div>' +
      '<div class="yrxb-cards">' +
        scenes.map(function(sc, i){ return _renderSceneCard(YRX, sc, i); }).join('') +
      '</div>' +
    '</div>';
  }

  function _renderSceneCard(YRX, sc, i) {
    var active = YRX.activeSceneIdx === i;
    var deleted = !!sc.deleted;
    var selected = sc.selected !== false;
    /* 썸네일 — 서버 keyframes 가 ready 면 그 URL, 아니면 영상 hqdefault placeholder */
    var thumbUrl = sc.thumbnailUrl ||
      (YRX.videoId ? 'https://img.youtube.com/vi/'+YRX.videoId+'/default.jpg' : '');
    var status = sc.previewStatus || (thumbUrl ? 'placeholder' : 'missing');
    var thumb;
    if (thumbUrl) {
      thumb = '<div class="yrxb-card-thumbwrap">' +
        '<img class="yrxb-card-thumb" src="'+_escAttr(thumbUrl)+'" alt="" loading="lazy">' +
        (status === 'placeholder' ? '<span class="yrxb-thumb-badge">프레임 미생성</span>' : '') +
        (status === 'missing'     ? '<span class="yrxb-thumb-badge err">썸네일 없음</span>' : '') +
        (sc.timeRange ? '<span class="yrxb-thumb-time">'+_esc(sc.timeRange)+'</span>' : '') +
      '</div>';
    } else {
      thumb = '<div class="yrxb-card-thumbwrap"><div class="yrxb-card-thumb empty">no preview</div>' +
        '<span class="yrxb-thumb-badge err">프레임 없음</span></div>';
    }
    /* 자막 칩 — original 또는 originalText */
    var chipText = sc.originalText || sc.original || '';
    var chips = _toChips(chipText).slice(0, 12).map(function(w){
      return '<span class="yrxb-chip">'+_esc(w)+'</span>';
    }).join('');
    var jumpBtn = (sc.startSec != null && YRX.videoId)
      ? '<button type="button" class="yrxb-card-jump" onclick="event.stopPropagation();yrxJumpTo('+(sc.startSec||0)+')" title="이 시점부터 영상 보기">▶ '+_esc(_fmtSec(sc.startSec))+'</button>'
      : '';
    /* 카드 안 인라인 미리보기 — 수정 자막 / 일본어 자막 (값이 있을 때만) */
    var ad = (YRX.adaptedScenes || [])[i] || {};
    var editedKo = sc.editedText || ad.adaptedNarration || '';
    var captionJa = ad.captionJa || sc.captionJa || sc.translatedJa || '';
    var inline = '';
    if (editedKo) {
      inline += '<div class="yrxb-card-inline ko">' +
        '<span class="yrxb-card-tag">수정</span>' +
        '<span class="yrxb-card-text">'+_esc(editedKo)+'</span>' +
      '</div>';
    }
    if (captionJa) {
      inline += '<div class="yrxb-card-inline ja">' +
        '<span class="yrxb-card-tag">日本語</span>' +
        '<span class="yrxb-card-text">'+_esc(captionJa)+'</span>' +
      '</div>';
    }
    return '<div class="yrxb-card '+(active?'active':'')+' '+(deleted?'deleted':'')+'" onclick="yrxBoardSetActive('+i+')">' +
      '<div class="yrxb-card-row1">' +
        '<input type="checkbox" '+(selected?'checked':'')+' onclick="event.stopPropagation();yrxBoardToggleSelect('+i+')">' +
        thumb +
        '<div class="yrxb-card-info">' +
          '<div class="yrxb-card-no">' +
            '씬 '+sc.sceneNumber +
            (sc.timeRange ? ' · '+_esc(sc.timeRange) : '') +
            ' · '+_esc(sc.roleLabel || sc.role || '') +
            (deleted ? ' <span class="yrxb-tag-del">삭제됨</span>' : '') +
            ' '+jumpBtn +
          '</div>' +
          (chips ? '<div class="yrxb-chips">'+chips+'</div>' :
            '<div class="yrxb-card-empty">(빈 자막 — 공백 삭제로 정리 가능)</div>') +
          inline +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ── 우측 패널 (40%) ── */
  function _renderRightPanel(YRX) {
    return '<div class="yrxb-right">' +
      _renderIframe(YRX) +
      _renderTimeline(YRX) +
      _renderEditPanel(YRX) +
    '</div>';
  }

  function _renderIframe(YRX) {
    var vid = YRX.videoId;
    if (!vid) {
      return '<div class="yrxb-iframe empty"><span>📺 유튜브 링크를 입력하면 미리보기가 표시됩니다.</span></div>';
    }
    var startSec = YRX._lastJumpSec || 0;
    var src = 'https://www.youtube.com/embed/'+vid+'?rel=0&modestbranding=1' +
              (startSec > 0 ? '&start='+startSec : '');
    return '<div class="yrxb-iframe">' +
      '<iframe src="'+_escAttr(src)+'" ' +
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
        'allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>' +
    '</div>';
  }

  function _renderTimeline(YRX) {
    var scenes = (YRX.detectedScenes || []).filter(_isVisible);
    if (!scenes.length) return '';
    var last = scenes[scenes.length-1];
    var total = (last && last.endSec) ? last.endSec : 60;
    if (total <= 0) total = 60;
    return '<div class="yrxb-timeline" title="씬 클릭 시 미리보기 시점 이동">' +
      scenes.map(function(sc){
        var L = ((sc.startSec||0) / total) * 100;
        var W = (((sc.endSec||(sc.startSec||0)+4) - (sc.startSec||0)) / total) * 100;
        if (W < 1) W = 1;
        var act = YRX.activeSceneIdx === sc.sceneIndex;
        return '<div class="yrxb-tl-seg '+(act?'active':'')+'" ' +
          'style="left:'+L.toFixed(2)+'%;width:'+W.toFixed(2)+'%" ' +
          'title="씬 '+sc.sceneNumber+' · '+_escAttr(sc.timeRange||'')+'" ' +
          'onclick="yrxBoardSetActive('+sc.sceneIndex+')">'+sc.sceneNumber+'</div>';
      }).join('') +
    '</div>';
  }

  function _renderEditPanel(YRX) {
    var idx = YRX.activeSceneIdx;
    var sc = (YRX.detectedScenes || [])[idx];
    if (!sc) return '<div class="yrxb-edit empty">씬 카드를 클릭하면 여기에 편집 패널이 표시됩니다.</div>';
    var ad = (YRX.adaptedScenes || [])[idx] || {};
    var busy = !!(YRX.sceneBusy && YRX.sceneBusy[idx]);
    var eko = (sc.editedText != null ? sc.editedText : ad.adaptedNarration) || '';
    return '<div class="yrxb-edit">' +
      '<div class="yrxb-edit-hd">' +
        '✏️ 씬 '+sc.sceneNumber +
        (sc.timeRange ? ' · '+_esc(sc.timeRange) : '') +
        ' · '+_esc(sc.roleLabel || '') +
        (sc.startSec != null && YRX.videoId
          ? ' <button type="button" class="yrxb-mini" onclick="yrxJumpTo('+(sc.startSec||0)+')">▶ '+_esc(_fmtSec(sc.startSec))+'</button>'
          : '') +
      '</div>' +

      '<label class="yrxb-edit-label">원본 자막 (편집 불가 — 참고용)</label>' +
      '<div class="yrxb-edit-orig">'+_esc(sc.original || '(빈 자막)')+'</div>' +

      '<label class="yrxb-edit-label">수정 자막 (한국어)</label>' +
      '<textarea class="yrxb-edit-ta" rows="2" placeholder="이 씬의 한국어 자막/대사를 직접 수정하세요" ' +
        'oninput="yrxBoardEditNarr('+idx+',this.value)">'+_esc(eko)+'</textarea>' +

      '<label class="yrxb-edit-label">일본어 자막</label>' +
      '<textarea class="yrxb-edit-ta" rows="2" placeholder="일본어 자막 — 빈 칸이면 \'🇯🇵 일본어로\' 버튼으로 자동 변환" ' +
        'oninput="yrxAdaptEdit('+idx+',\'captionJa\',this.value)">'+_esc(ad.captionJa || '')+'</textarea>' +

      '<label class="yrxb-edit-label">화면 설명 / 비주얼 시드 (Step 2 prompt 시드)</label>' +
      '<input type="text" class="yrxb-edit-inp" placeholder="예: 시니어 남성 클로즈업, 따뜻한 조명" ' +
        'value="'+_escAttr(ad.visualDescription || '')+'" oninput="yrxAdaptEdit('+idx+',\'visualDescription\',this.value)">' +

      '<label class="yrxb-edit-label">각색 메모</label>' +
      '<input type="text" class="yrxb-edit-inp" placeholder="이 씬의 의도/주의사항" ' +
        'value="'+_escAttr(sc.notes || '')+'" oninput="yrxBoardEditNote('+idx+',this.value)">' +

      '<div class="yrxb-edit-actions">' +
        '<button type="button" class="yrxb-mini" '+(busy?'disabled':'')+' onclick="yrxSceneVar('+idx+',\'ja_only\')">🇯🇵 일본어로</button>' +
        '<button type="button" class="yrxb-mini" '+(busy?'disabled':'')+' onclick="yrxSceneVar('+idx+',\'ko_only\')">🇰🇷 한국어 다듬기</button>' +
        '<button type="button" class="yrxb-mini" '+(busy?'disabled':'')+' onclick="yrxSceneVar('+idx+',\'shorter\')">⏬ 더 짧게</button>' +
        '<button type="button" class="yrxb-mini" '+(busy?'disabled':'')+' onclick="yrxSceneVar('+idx+',\'comic\')">😂 코믹</button>' +
        '<button type="button" class="yrxb-mini" '+(busy?'disabled':'')+' onclick="yrxSceneVar('+idx+',\'emotional\')">💝 감동</button>' +
        '<button type="button" class="yrxb-mini" '+(busy?'disabled':'')+' onclick="yrxSceneVar('+idx+',\'senior\')">👴 시니어 톤</button>' +
        '<button type="button" class="yrxb-mini" '+(busy?'disabled':'')+' onclick="yrxRedoScene('+idx+')">↻ 다시 각색</button>' +
        (sc.deleted
          ? '<button type="button" class="yrxb-mini ok" onclick="yrxBoardRestore('+idx+')">↺ 복구</button>'
          : '<button type="button" class="yrxb-mini danger" onclick="yrxBoardDeleteOne('+idx+')">🗑 이 씬 삭제</button>') +
      '</div>' +
    '</div>';
  }

  /* ── 하단 액션 바 ── */
  function _renderActionBar(YRX) {
    var busy = !!YRX.busy;
    var scenes = YRX.detectedScenes || [];
    var selN = scenes.filter(function(sc){ return _isVisible(sc) && sc.selected; }).length;
    var totN = scenes.filter(_isVisible).length;
    return '<div class="yrxb-actionbar">' +
      '<button type="button" class="yrxb-act-btn" onclick="yrxBoardClearSelect()">선택 해제</button>' +
      '<button type="button" class="yrxb-act-btn" onclick="yrxBoardDeleteSelected()">🗑 선택 삭제</button>' +
      '<button type="button" class="yrxb-act-btn" onclick="yrxBoardRestoreAll()">↺ 전체 복구</button>' +
      '<button type="button" class="yrxb-act-btn" onclick="yrxBoardRemoveBlanks()">⌫ 공백 자막 삭제</button>' +
      '<span class="yrxb-act-sep"></span>' +
      '<button type="button" class="yrxb-act-btn" '+(busy?'disabled':'')+
        ' onclick="yrxBoardRunMode(\'subtitle_only\')">🌐 자막만 번역</button>' +
      '<button type="button" class="yrxb-act-btn" '+(busy?'disabled':'')+
        ' onclick="yrxBoardRunMode(\'partial_rewrite\')">✏️ 일부 각색</button>' +
      '<button type="button" class="yrxb-act-btn" '+(busy?'disabled':'')+
        ' onclick="yrxAdaptAll()">🪄 전체 각색 (현재 모드)</button>' +
      '<span class="yrxb-act-sep"></span>' +
      '<button type="button" class="yrxb-act-btn pri" onclick="yrxRunSafety()">🛡 유사도 검사</button>' +
      '<button type="button" class="yrxb-act-btn pri" onclick="yrxBoardBridgeToStep2()">'+
        '→ Step 2 로 보내기 <span class="yrxb-act-cnt">선택 '+selN+' / '+totN+'</span></button>' +
    '</div>';
  }

  /* ── 푸터: copy safety + 분석 요약 ── */
  function _renderFooter(YRX) {
    var s = YRX.safety;
    var safetyHtml = '';
    if (s) {
      var label = s.overallRisk === 'low' ? '낮음 — 사용 가능' :
                  s.overallRisk === 'medium' ? '보통 — 일부 표현 수정 권장' :
                  '높음 — 다시 각색 권장';
      var items = [].concat(s.sentenceSimilarityWarnings || [], s.visualSimilarityWarnings || [], s.brandCarryoverWarnings || []);
      if (s.titleSimilarityWarning) items.push(s.titleSimilarityWarning);
      safetyHtml = '<details class="yrxb-foot-card '+_esc(s.overallRisk)+'" '+(s.overallRisk!=='low'?'open':'')+'>' +
        '<summary>🛡 원본 유사도: '+_esc(label) +
          (s.overallRisk === 'high' ? ' — 원본과 너무 유사합니다. 구조만 남기고 표현을 다시 각색하세요.' : '') +
        '</summary>' +
        (items.length ? '<ul>'+items.map(function(x){ return '<li>'+_esc(x)+'</li>'; }).join('')+'</ul>'
                      : '<div>유사도 위반 항목이 없습니다.</div>') +
        ((s.recommendedFixes||[]).length ? '<ul>'+s.recommendedFixes.map(function(x){ return '<li>'+_esc(x)+'</li>'; }).join('')+'</ul>' : '') +
      '</details>';
    }
    /* 기존 referenceAnalysis (s1-youtube-reference.js 의 분석 결과) 보존 — 보드 안에 합침 */
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var an = (proj.s1 && proj.s1.referenceAnalysis) || YRX.analysis;
    var analysisHtml = '';
    if (an) {
      analysisHtml = '<details class="yrxb-foot-card analysis">' +
        '<summary>📊 레퍼런스 분석 ('+_esc(an._source==='ai'?'AI':'휴리스틱')+')</summary>' +
        '<div class="yrxb-an-grid">' +
          '<div><b>훅</b> '+_esc(an.hookPattern || '-')+'</div>' +
          '<div><b>씬 수</b> '+_esc(an.sceneCount != null ? an.sceneCount : '-')+'</div>' +
          '<div><b>자막</b> '+_esc(an.captionStyle || '-')+'</div>' +
          '<div><b>페이스</b> '+_esc(an.pacing || '-')+'</div>' +
          '<div><b>CTA</b> '+_esc(an.ctaPattern || '-')+'</div>' +
          '<div><b>모션</b> '+_esc(an.motionStyle || '-')+'</div>' +
        '</div>' +
      '</details>';
    }
    if (!safetyHtml && !analysisHtml) return '';
    return '<div class="yrxb-footer">' + safetyHtml + analysisHtml + '</div>';
  }

  function _renderStatus(YRX) {
    if (!YRX.status) return '';
    var cls = YRX.busy ? 'loading' :
              (YRX.status.indexOf('❌') === 0 ? 'err' :
              (YRX.status.indexOf('✅') === 0 ? 'ok' : 'init'));
    return '<div class="yrxb-status '+cls+'">'+_esc(YRX.status)+'</div>';
  }

  /* ════════════════════════════════════════════════
     보드 액션
     ════════════════════════════════════════════════ */
  window.yrxBoardSetActive = function(idx) {
    var YRX = _state(); if (!YRX) return;
    YRX.activeSceneIdx = idx;
    var sc = (YRX.detectedScenes || [])[idx];
    if (sc && typeof sc.startSec === 'number' && typeof window.yrxJumpTo === 'function') {
      window.yrxJumpTo(sc.startSec);
    }
    _save(); _refresh();
  };
  window.yrxBoardToggleSelect = function(idx) {
    var YRX = _state(); if (!YRX) return;
    var sc = (YRX.detectedScenes || [])[idx];
    if (!sc) return;
    sc.selected = !sc.selected;
    _save(); _refresh();
  };
  window.yrxBoardSelectAll = function(on) {
    var YRX = _state(); if (!YRX) return;
    (YRX.detectedScenes || []).forEach(function(sc){
      if (!sc.deleted) sc.selected = !!on;
    });
    _save(); _refresh();
  };
  window.yrxBoardClearSelect = function() { window.yrxBoardSelectAll(false); };
  window.yrxBoardDeleteSelected = function() {
    var YRX = _state(); if (!YRX) return;
    var n = 0;
    (YRX.detectedScenes || []).forEach(function(sc){
      if (sc.selected && !sc.deleted) { sc.deleted = true; sc.selected = false; n++; }
    });
    if (n) {
      _toast('🗑 ' + n + '개 씬 삭제 (Step 2 export 에서 제외 · 복구 가능)', 'info');
      if (typeof window.yrxPersistAdaptation === 'function') window.yrxPersistAdaptation();
    } else {
      _toast('⚠️ 선택된 씬이 없습니다.', 'warn');
    }
    _save(); _refresh();
  };
  window.yrxBoardDeleteOne = function(idx) {
    var YRX = _state(); if (!YRX) return;
    var sc = (YRX.detectedScenes || [])[idx];
    if (!sc) return;
    sc.deleted = true; sc.selected = false;
    if (typeof window.yrxPersistAdaptation === 'function') window.yrxPersistAdaptation();
    _save(); _refresh();
  };
  window.yrxBoardRestore = function(idx) {
    var YRX = _state(); if (!YRX) return;
    var sc = (YRX.detectedScenes || [])[idx];
    if (!sc) return;
    sc.deleted = false;
    if (typeof window.yrxPersistAdaptation === 'function') window.yrxPersistAdaptation();
    _save(); _refresh();
  };
  window.yrxBoardRestoreAll = function() {
    var YRX = _state(); if (!YRX) return;
    var n = 0;
    (YRX.detectedScenes || []).forEach(function(sc){ if (sc.deleted) { sc.deleted = false; n++; } });
    _toast(n ? ('↺ ' + n + '개 씬 복구') : '⚠️ 복구할 씬이 없습니다.', n ? 'success' : 'warn');
    if (typeof window.yrxPersistAdaptation === 'function') window.yrxPersistAdaptation();
    _save(); _refresh();
  };
  window.yrxBoardRemoveBlanks = function() {
    var YRX = _state(); if (!YRX) return;
    var n = 0;
    (YRX.detectedScenes || []).forEach(function(sc){
      if (!sc.deleted && !String(sc.original || '').trim()) { sc.deleted = true; n++; }
    });
    _toast(n ? ('⌫ 공백 씬 ' + n + '개 삭제') : '⚠️ 공백 씬이 없습니다.', n ? 'success' : 'warn');
    if (typeof window.yrxPersistAdaptation === 'function') window.yrxPersistAdaptation();
    _save(); _refresh();
  };

  /* 사용자 직접 편집 — editedText 는 detectedScenes 에 보관, adaptedScenes.adaptedNarration 으로 미러 */
  window.yrxBoardEditNarr = function(idx, val) {
    var YRX = _state(); if (!YRX) return;
    var sc = (YRX.detectedScenes || [])[idx];
    if (sc) sc.editedText = val;
    if (typeof window.yrxAdaptEdit === 'function') {
      window.yrxAdaptEdit(idx, 'adaptedNarration', val);
    } else {
      _save();
    }
  };
  window.yrxBoardEditNote = function(idx, val) {
    var YRX = _state(); if (!YRX) return;
    var sc = (YRX.detectedScenes || [])[idx];
    if (sc) sc.notes = val;
    _save();
  };
  window.yrxBoardSetMt = function(t) {
    var YRX = _state(); if (!YRX) return;
    YRX.boardMobileTab = t;
    _refresh();
  };
  window.yrxBoardTogglePaste = function() {
    var YRX = _state(); if (!YRX) return;
    YRX.boardPasteOpen = !YRX.boardPasteOpen;
    _refresh();
  };
  window.yrxBoardLoadFile = function(ev) {
    var YRX = _state(); if (!YRX) return;
    var f = ev && ev.target && ev.target.files && ev.target.files[0];
    if (!f) return;
    var fr = new FileReader();
    fr.onload = function() {
      YRX.transcript = String(fr.result || '');
      YRX.boardPasteOpen = true;
      _save(); _refresh();
      _toast('📁 파일을 불러왔습니다 — "분석 / 장면으로 나누기" 를 누르세요.', 'success');
    };
    fr.onerror = function() { _toast('❌ 파일 로드 실패', 'error'); };
    try { fr.readAsText(f, 'utf-8'); } catch(e) { _toast('❌ 파일 읽기 실패: '+(e&&e.message||e), 'error'); }
    /* 같은 파일 재선택 가능하도록 reset */
    try { ev.target.value = ''; } catch(_) {}
  };
  window.yrxBoardParseAndShow = function() {
    var YRX = _state(); if (!YRX) return;
    if (!String(YRX.transcript || '').trim()) {
      YRX.boardPasteOpen = true;
      _refresh();
      _toast('⚠️ 먼저 자막/대본을 붙여넣어 주세요.', 'warn');
      return;
    }
    if (typeof window.yrxParseScenes === 'function') {
      window.yrxParseScenes();
      var YRX2 = _state();
      if (YRX2 && (YRX2.detectedScenes || []).length) YRX2.activeSceneIdx = 0;
      if (YRX2) YRX2.boardPasteOpen = false;
      _save(); _refresh();
    }
  };

  /* ⭐ 새 import pipeline — 단계별 status 를 UI 에 노출, 모든 실패는 errors[] 로 표시 */
  window.yrxBoardRunImport = async function() {
    var YRX = _state(); if (!YRX) return;
    if (!window.YT_IMPORT) {
      _toast('❌ YT_IMPORT 미로드 — s1-youtube-import-pipeline.js 를 확인하세요.', 'error');
      return;
    }
    if (YRX.busy) return;
    YRX.busy = true; YRX.busyTag = 'import';
    YRX.bridgeResult = null;
    /* 단계별 상태를 매 단계마다 화면에 즉시 반영 */
    function onStatus(st) {
      YRX.importStatus = st;
      _refresh();
    }
    try {
      var packet = await window.YT_IMPORT.runImport({
        url: YRX.url || '',
        transcript: YRX.transcript || '',
        mode: YRX.adaptationMode || 'subtitle_only',
      }, onStatus);
      /* packet 적용 — YRX 상태 동기화 */
      if (packet && packet.scenes && packet.scenes.length) {
        YRX.detectedScenes = packet.scenes.slice();
        YRX.adaptedScenes  = []; /* 새 import → 기존 adaptedScenes 초기화 */
        YRX.safety         = null;
        YRX.activeSceneIdx = 0;
        YRX.boardPasteOpen = false;
        if (packet.videoId) YRX.videoId = packet.videoId;
        if (packet.url)     YRX.url     = packet.url;
        if (packet.meta && packet.meta.title) YRX.title = packet.meta.title;
        _toast('✅ 가져오기 완료 — '+packet.scenes.length+'개 씬 생성', 'success');
      } else if (packet && packet.errors && packet.errors.length) {
        _toast('❌ 가져오기 실패 — 패널의 안내를 확인하세요.', 'error');
        YRX.boardPasteOpen = true;
      } else {
        _toast('⚠️ 가져오기 결과가 비어있습니다.', 'warn');
      }
    } catch(e) {
      _toast('❌ 가져오기 예외: '+(e&&e.message||e), 'error');
    }
    YRX.busy = false; YRX.busyTag = '';
    _save(); _refresh();
  };

  /* ⭐ Step 2 bridge — 검증 포함, 결과를 화면에 명시 */
  window.yrxBoardBridgeToStep2 = function() {
    var YRX = _state(); if (!YRX) return;
    if (!window.YT_BRIDGE) {
      _toast('❌ YT_BRIDGE 미로드 — s1-youtube-import-bridge.js 를 확인하세요.', 'error');
      return;
    }
    var scenes = YRX.detectedScenes || [];
    if (!scenes.length) {
      YRX.bridgeResult = { ok:false, written:{scenes:0,prompts:0},
        errors:[{code:'no-scenes',message:'씬이 없습니다 — 먼저 자막을 가져오세요.'}], warnings:[] };
      _refresh();
      _toast('❌ 씬이 없습니다 — 먼저 자막을 가져오기 하세요.', 'error');
      return;
    }
    /* deleted/edited 반영해 bridge 에 넘김 — adaptedScenes 가 있으면 우선 사용 */
    var ad = YRX.adaptedScenes || [];
    var merged = scenes.map(function(sc, i){
      var a = ad[i] || {};
      return Object.assign({}, sc, {
        editedText:   sc.editedText || a.adaptedNarration || '',
        translatedJa: sc.translatedJa || a.captionJa || '',
        captionKo:    a.captionKo || '',
        captionJa:    a.captionJa || sc.translatedJa || '',
        visualDescription: a.visualDescription || sc.visualDescription || '',
        adaptedCaption:    a.adaptedCaption || '',
        adaptedNarration:  a.adaptedNarration || sc.editedText || '',
        imagePrompt:  a.imagePrompt || sc.imagePrompt || '',
        videoPrompt:  a.videoPrompt || sc.videoPrompt || '',
      });
    });
    var result = window.YT_BRIDGE.bridgeToStep2(merged);
    YRX.bridgeResult = result;
    if (result.ok) {
      _toast('✅ Step 2 전달 성공 — 씬 '+result.written.scenes+'개', 'success');
    } else {
      _toast('❌ Step 2 전달 실패 — 패널 확인', 'error');
    }
    _save();
    _refresh();
  };
  /* 모드 변경 후 즉시 전체 각색 — "자막만 번역" / "일부 각색" 빠른 실행 */
  window.yrxBoardRunMode = function(modeId) {
    var YRX = _state(); if (!YRX) return;
    YRX.adaptationMode = modeId;
    _save();
    if (typeof window.yrxAdaptAll === 'function') window.yrxAdaptAll();
  };

  /* ════════════════════════════════════════════════
     CSS link 동적 주입
     ════════════════════════════════════════════════ */
  function _injectCSS() {
    if (document.getElementById('yrxb-style-link')) return;
    var existing = document.querySelector('script[src*="s1-youtube-remix-board.js"]');
    var href = existing && existing.src
      ? existing.src.replace(/s1-youtube-remix-board\.js.*$/, 's1-youtube-remix-board.css')
      : '/modules/studio/s1-youtube-remix-board.css';
    var link = document.createElement('link');
    link.id = 'yrxb-style-link';
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
})();
