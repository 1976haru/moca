/* ================================================
   modules/remix/rm-scene-board.js
   영상 리믹스 스튜디오 — 메인 보드 렌더 + 액션
   * 6 단계 워크플로우: 소스 → 자막 → 장면 → 번역 → 음성 → 출력
   * 좌(60%) Scene 리스트 / 우(40%) iframe + 편집 패널
   * 자막 붙여넣기 → 장면 분리 → 번역 → 음성/출력 모두 한 화면에서 가능
   * 의존: RM_CORE · RM_SOURCE · RM_PARSER · RM_TRANSLATE · RM_VOICE · RM_EXPORT
   ================================================ */
(function(){
  'use strict';

  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function _escAttr(s){ return String(s == null ? '' : s).replace(/"/g,'&quot;').replace(/'/g, "\\'"); }
  function _fmtSec(sec){ var s = Math.max(0, Math.round(sec || 0)); var m = Math.floor(s/60); var ss = s%60;
    return m+':'+(ss<10?'0'+ss:ss); }
  function _toChips(t){ return String(t || '').split(/[\s,.!?。、！？]+/).filter(Boolean); }
  function _toast(msg, kind){ if (typeof window.ucShowToast === 'function') window.ucShowToast(msg, kind || 'info'); }

  /* ── render entry — engines/remix/index.html 가 호출 ── */
  function render(rootId) {
    var root = document.getElementById(rootId || 'rm-root');
    if (!root) return;
    var p = window.RM_CORE.load();
    root.innerHTML = '' +
      _renderTopBar(p) +
      _renderStateBadge(p) +
      _renderStageHeader(p) +
      _renderToolbar(p) +
      _renderModeBar(p) +
      _renderBoard(p) +
      _renderActionBar(p) +
      _renderStatus(p) +
      _renderCopyNotice() +
    '';
  }

  /* ── 3단계 상태 배지 ──
     1: 영상 미리보기 준비됨 (소스 설정 + 자막 없음)
     2: 자막/대본 필요 (소스 없음 또는 자막 비어있음)
     3: Scene 생성 완료 (scenes.length > 0) */
  function _renderStateBadge(p) {
    var hasSrc    = !!(p.source && (p.source.videoId || p.source.fileBlobUrl));
    var hasRaw    = String(p.transcript.raw || '').trim().length > 0;
    var sceneN    = (p.scenes || []).filter(function(s){ return !s.deleted; }).length;
    var hasScenes = sceneN > 0;
    var jaN       = (p.scenes || []).filter(function(s){ return !s.deleted && (s.captionJa||'').trim(); }).length;

    var s1Cls = (hasSrc && !hasRaw) ? 'on' : (hasSrc ? 'done' : 'pending');
    var s2Cls = hasRaw ? (hasScenes ? 'done' : 'on') : 'pending';
    var s3Cls = hasScenes ? 'on' : 'pending';

    var msg;
    if (!hasSrc && !hasRaw) {
      msg = '👇 시작하기 — 유튜브 링크 입력 or MP4 업로드 + 자막/대본 붙여넣기';
    } else if (hasSrc && !hasRaw) {
      msg = '⚠️ 영상 미리보기만으로는 장면 편집이 불가능합니다. 자막/대본을 붙여넣어야 Scene 이 생성됩니다.';
    } else if (hasRaw && !hasScenes) {
      msg = '⚠️ 자막이 입력됐습니다 — "🪄 장면 분리" 를 누르거나 paste 자동분리를 기다리세요.';
    } else {
      msg = '✅ ' + sceneN + ' 개 Scene 생성 완료 · 일본어 자막 ' + jaN + ' 개 — 자동숏츠로 전달 가능합니다.';
    }

    return '<div class="rm-statebar">' +
      '<div class="rm-state-pills">' +
        '<span class="rm-state-pill '+s1Cls+'"><b>1</b> 영상 미리보기 ' +
          (hasSrc ? '✅' : '◻') + '</span>' +
        '<span class="rm-state-arrow">→</span>' +
        '<span class="rm-state-pill '+s2Cls+'"><b>2</b> 자막/대본 ' +
          (hasRaw ? '✅' : '◻') + '</span>' +
        '<span class="rm-state-arrow">→</span>' +
        '<span class="rm-state-pill '+s3Cls+'"><b>3</b> Scene 생성 ' +
          (hasScenes ? '✅ ('+sceneN+')' : '◻') + '</span>' +
      '</div>' +
      '<div class="rm-state-msg '+(hasScenes?'ok':hasSrc&&!hasRaw?'warn':'init')+'">'+_esc(msg)+'</div>' +
    '</div>';
  }

  /* ── 상단 권한/저작권 안내 + 상태 ── */
  function _renderTopBar(p) {
    var src = p.source || {};
    var stage = (window.RM_CORE.STAGES.find(function(s){ return s.id === p.stage; }) || { label: '' }).label;
    return '<div class="rm-topbar">' +
      '<div class="rm-topbar-l"><b>🎞 영상 리믹스 스튜디오</b> <span class="rm-stage">'+_esc(stage)+'</span></div>' +
      '<div class="rm-topbar-r">' +
        (src.videoId ? '<span class="rm-pill">YouTube · '+_esc(src.videoId)+'</span>' :
         src.fileName ? '<span class="rm-pill">파일 · '+_esc(src.fileName)+'</span>' :
         '<span class="rm-pill muted">소스 미설정</span>') +
        ' <a href="../../index.html" class="rm-link">← 메인</a>' +
        ' <a href="../shorts/index.html" class="rm-link">자동숏츠 →</a>' +
      '</div>' +
    '</div>';
  }

  /* ── 단계 헤더 (1~6) ── */
  function _renderStageHeader(p) {
    var idx = window.RM_CORE.STAGES.findIndex(function(s){ return s.id === p.stage; });
    return '<div class="rm-stages">' + window.RM_CORE.STAGES.map(function(s, i){
      var cls = i < idx ? 'done' : i === idx ? 'on' : '';
      return '<button type="button" class="rm-stage-btn '+cls+'" onclick="rmGotoStage(\''+s.id+'\')">' +
        '<b>'+(i+1)+'</b> '+_esc(s.label.split('. ')[1] || s.label)+'</button>';
    }).join('') + '</div>';
  }

  /* ── 툴바 (URL / 파일 / 자막 입력 / 분석) ── */
  function _renderToolbar(p) {
    var src = p.source || {};
    var iframeHtml = src.videoId
      ? '<iframe src="https://www.youtube.com/embed/'+_escAttr(src.videoId)+'?rel=0&modestbranding=1" '+
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" '+
        'allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>'
      : (src.fileBlobUrl
          ? '<video id="rm-video-el" src="'+_escAttr(src.fileBlobUrl)+'" controls preload="metadata" style="width:100%;height:100%;background:#000"></video>'
          : '<div class="rm-iframe-empty">유튜브 URL 또는 MP4 파일을 넣으면 미리보기가 표시됩니다.</div>');

    return '<div class="rm-toolbar">' +
      '<div class="rm-tb-row">' +
        '<input type="url" class="rm-inp" placeholder="유튜브 링크 (watch?v=, shorts/, youtu.be/)" '+
          'value="'+_escAttr(src.youtubeUrl || '')+'" oninput="rmSetYoutubeUrl(this.value)">' +
        '<label class="rm-tb-btn rm-file"><input type="file" accept="video/mp4,video/webm" onchange="rmLoadVideoFile(event)"> 📁 MP4 업로드</label>' +
        '<label class="rm-tb-btn rm-file"><input type="file" accept=".srt,.vtt,.txt" onchange="rmLoadCaptionFile(event)"> 📄 자막 파일</label>' +
        '<button type="button" class="rm-tb-btn pri" onclick="rmParseAndSplit()">🪄 장면 분리</button>' +
      '</div>' +
      '<div class="rm-tb-row">' +
        '<div class="rm-iframe-box">' + iframeHtml + '</div>' +
        '<div class="rm-paste-wrap">' +
          '<textarea class="rm-paste" id="rm-paste-ta" '+
            'placeholder="자막 / 대본 붙여넣기 — SRT, VTT, 시간 포함, 일반 줄/문장 모두 OK&#10;&#10;⚠️ 영상은 미리보기로만 표시됩니다. 자막/대본을 붙여넣어야 장면 편집과 자동숏츠 전달이 가능합니다." '+
            'oninput="rmSetTranscriptRaw(this.value)" onpaste="rmOnPaste(event)" onblur="rmOnPasteBlur()">'+_esc(p.transcript.raw || '')+'</textarea>' +
          '<div class="rm-paste-hint">' +
            (p.transcript.raw && (p.scenes || []).length === 0
              ? '⚠️ 자막이 입력됐습니다 — "🪄 장면 분리" 를 눌러 Scene 카드를 생성하세요.'
              : !p.transcript.raw
                ? '👇 위 영역에 자막/대본을 붙여넣으세요 (붙여넣으면 자동으로 장면 분리됩니다)'
                : '✅ '+(p.scenes || []).length+'개 씬 생성됨 — 왼쪽 보드에서 편집할 수 있습니다.') +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ── 작업 모드 + 자막 언어 + 시니어 톤 ── */
  function _renderModeBar(p) {
    var modes = [
      { id:'subtitle_only',  label:'자막만 번역',     hint:'장면 구조 유지 · 일본어 자막 변환' },
      { id:'voice_replace',  label:'음성만 교체',     hint:'원본 영상 + 새 TTS 대본 (Step 3 전달)' },
      { id:'partial_rewrite',label:'일부 각색',       hint:'장면 구조 유지 · 말투/표현만 수정' },
      { id:'structure_only', label:'구조만 참고',     hint:'대사/장면 새로 작성 (Step 2 전달)' },
    ];
    var langs = [{id:'ko',label:'한국어'},{id:'ja',label:'일본어'},{id:'both',label:'한일 동시'}];
    return '<div class="rm-modebar">' +
      '<span class="rm-mb-label">🪄 모드</span>' +
      modes.map(function(m){
        var on = p.mode === m.id;
        return '<button type="button" class="rm-mb-btn '+(on?'on':'')+'" onclick="rmSetMode(\''+m.id+'\')" title="'+_escAttr(m.hint)+'">'+_esc(m.label)+'</button>';
      }).join('') +
      '<span class="rm-mb-sep"></span>' +
      '<span class="rm-mb-label">자막</span>' +
      langs.map(function(l){
        var on = p.captionLang === l.id;
        return '<button type="button" class="rm-mb-btn '+(on?'on':'')+'" onclick="rmSetLang(\''+l.id+'\')">'+_esc(l.label)+'</button>';
      }).join('') +
      '<label class="rm-mb-chk"><input type="checkbox" '+(p.seniorTone?'checked':'')+' onchange="rmToggleSenior()"> 시니어 친화 톤</label>' +
    '</div>';
  }

  /* ── 60/40 보드 ── */
  function _renderBoard(p) {
    var hasScenes = (p.scenes || []).length > 0;
    return '<div class="rm-board">' +
      _renderSceneList(p, hasScenes) +
      _renderRightPanel(p, hasScenes) +
    '</div>';
  }

  function _renderSceneList(p, hasScenes) {
    if (!hasScenes) {
      var hasRaw = String(p.transcript.raw || '').trim().length > 0;
      return '<div class="rm-list"><div class="rm-empty">' +
        '<b>📋 Scene 카드는 자막/대본을 분리해야 표시됩니다.</b>' +
        '<ol style="text-align:left;margin:10px 0 6px 0;padding-left:20px;line-height:1.8">' +
          '<li' + (p.source && (p.source.videoId || p.source.fileBlobUrl) ? ' style="color:#86efac"' : '') + '>' +
            (p.source && (p.source.videoId || p.source.fileBlobUrl) ? '✅ ' : '◻ ') +
            '유튜브 링크 입력 또는 MP4 업로드' +
          '</li>' +
          '<li' + (hasRaw ? ' style="color:#86efac"' : '') + '>' +
            (hasRaw ? '✅ ' : '◻ ') +
            '자막/대본 붙여넣기 (위 textarea) <b>또는</b> SRT/VTT/TXT 파일 업로드' +
            (hasRaw ? '' : ' <span style="color:#9181ff">← 지금 필요</span>') +
          '</li>' +
          '<li' + (hasRaw ? ' style="color:#9181ff;font-weight:800"' : ' style="opacity:.55"') + '>' +
            '◻ "🪄 장면 분리" 버튼 클릭 ' +
            (hasRaw
              ? '<button class="rm-mini ok" onclick="rmParseAndSplit()" style="margin-left:6px">🪄 지금 장면 분리</button>'
              : '<small>(자막 입력 후 자동 실행됩니다)</small>') +
          '</li>' +
          '<li style="opacity:.55">◻ Scene 카드에서 일본어 자막 생성 / 일부 수정</li>' +
          '<li style="opacity:.55">◻ 자동숏츠 Step 2 로 보내기</li>' +
        '</ol>' +
        '<small>붙여넣은 자막에 시간 표기가 있으면 자동으로 씬 단위로 분해됩니다 (1분 영상 기준 8~20개 씬).</small>' +
      '</div></div>';
    }
    var scenes = p.scenes || [];
    var visible = scenes.filter(function(sc){ return !sc.deleted; });
    var sel = visible.filter(function(sc){ return sc.selected !== false; });
    var allSel = visible.length && sel.length === visible.length;
    var anyDel = scenes.some(function(sc){ return sc.deleted; });
    return '<div class="rm-list">' +
      '<div class="rm-list-hd">' +
        '<label><input type="checkbox" '+(allSel?'checked':'')+' onchange="rmSelectAll(this.checked)"> ' +
          '<b>전체 선택</b> <span class="rm-cnt">'+sel.length+' / '+visible.length+'</span></label>' +
        (anyDel ? '<button class="rm-mini" onclick="rmRestoreAll()">↺ 전체 복구</button>' : '') +
        '<button class="rm-mini" onclick="rmMergeShort()">🧩 짧은 자막 병합</button>' +
        '<button class="rm-mini" onclick="rmRemoveBlanks()">⌫ 공백 자막 삭제</button>' +
      '</div>' +
      '<div class="rm-list-note">선택 해제 / 삭제된 씬은 export 와 자동숏츠 전달에서 자동 제외됩니다.</div>' +
      '<div class="rm-cards">' +
        scenes.map(function(sc, i){ return _renderSceneCard(p, sc, i); }).join('') +
      '</div>' +
    '</div>';
  }

  function _renderSceneCard(p, sc, i) {
    var active = p._active === i;
    var deleted = !!sc.deleted;
    var selected = sc.selected !== false;
    var thumb = sc.thumbnailUrl ||
      (p.source && p.source.videoId ? 'https://img.youtube.com/vi/'+p.source.videoId+'/default.jpg' : '');
    var status = sc.previewStatus || (thumb ? 'placeholder' : 'missing');
    var thumbHtml = thumb
      ? '<div class="rm-thumb-wrap"><img class="rm-thumb" src="'+_escAttr(thumb)+'" alt="" loading="lazy">' +
          (status === 'placeholder' ? '<span class="rm-badge">프레임 미생성</span>' : '') +
          (sc.timeRange ? '<span class="rm-badge t">'+_esc(sc.timeRange)+'</span>' : '') +
        '</div>'
      : '<div class="rm-thumb-wrap"><div class="rm-thumb empty">no preview</div></div>';
    var chips = _toChips(sc.originalCaption).slice(0, 12).map(function(w){
      return '<span class="rm-chip">'+_esc(w)+'</span>';
    }).join('');
    var inline = '';
    if (sc.editedCaption) inline += '<div class="rm-inl ko"><span class="rm-tag">수정</span>'+_esc(sc.editedCaption)+'</div>';
    if (sc.captionJa)     inline += '<div class="rm-inl ja"><span class="rm-tag">日本</span>'+_esc(sc.captionJa)+'</div>';
    return '<div class="rm-card '+(active?'active':'')+' '+(deleted?'deleted':'')+'" onclick="rmSetActive('+i+')">' +
      '<div class="rm-card-row">' +
        '<input type="checkbox" '+(selected?'checked':'')+' onclick="event.stopPropagation();rmToggleSel('+i+')">' +
        thumbHtml +
        '<div class="rm-card-info">' +
          '<div class="rm-card-no">씬 '+sc.sceneNumber +
            (sc.timeRange ? ' · '+_esc(sc.timeRange) : '') +
            (deleted ? ' <span class="rm-tag-del">삭제됨</span>' : '') +
          '</div>' +
          (chips ? '<div class="rm-chips">'+chips+'</div>' : '<div class="rm-empty-line">(빈 자막)</div>') +
          inline +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ── 우측: iframe + 편집 패널 ── */
  function _renderRightPanel(p, hasScenes) {
    if (!hasScenes) {
      return '<div class="rm-right">' + _renderActiveIframe(p) +
        '<div class="rm-edit empty">씬을 분리하면 여기에 편집 패널이 표시됩니다.</div></div>';
    }
    return '<div class="rm-right">' + _renderActiveIframe(p) + _renderTimeline(p) + _renderEditPanel(p) + '</div>';
  }
  function _renderActiveIframe(p) {
    var src = p.source || {};
    if (src.videoId) {
      var startSec = p._activeJump || 0;
      var iframeSrc = 'https://www.youtube.com/embed/'+src.videoId+'?rel=0&modestbranding=1' +
        (startSec > 0 ? '&start='+startSec : '');
      return '<div class="rm-r-iframe">' +
        '<iframe src="'+_escAttr(iframeSrc)+'" '+
          'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" '+
          'allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>' +
      '</div>';
    }
    if (src.fileBlobUrl) {
      return '<div class="rm-r-iframe">' +
        '<video id="rm-video-active" src="'+_escAttr(src.fileBlobUrl)+'" controls preload="metadata" style="width:100%;height:100%;background:#000"></video>' +
      '</div>';
    }
    return '<div class="rm-r-iframe empty">미리보기 없음</div>';
  }
  function _renderTimeline(p) {
    var visible = (p.scenes || []).filter(function(sc){ return !sc.deleted; });
    if (!visible.length) return '';
    var last = visible[visible.length-1];
    var total = (last && last.endSec) ? last.endSec : 60;
    if (total <= 0) total = 60;
    return '<div class="rm-timeline">' + visible.map(function(sc){
      var L = ((sc.startSec||0) / total) * 100;
      var W = (((sc.endSec||(sc.startSec||0)+4) - (sc.startSec||0)) / total) * 100;
      if (W < 1) W = 1;
      var act = p._active === sc.sceneIndex;
      return '<div class="rm-tl-seg '+(act?'active':'')+'" style="left:'+L.toFixed(2)+'%;width:'+W.toFixed(2)+'%" '+
        'title="씬 '+sc.sceneNumber+' · '+_escAttr(sc.timeRange||'')+'" onclick="rmSetActive('+sc.sceneIndex+')">'+sc.sceneNumber+'</div>';
    }).join('') + '</div>';
  }
  function _renderEditPanel(p) {
    var idx = (typeof p._active === 'number') ? p._active : 0;
    var sc = (p.scenes || [])[idx];
    if (!sc) return '<div class="rm-edit empty">씬 카드를 선택하세요.</div>';
    return '<div class="rm-edit">' +
      '<div class="rm-edit-hd">✏️ 씬 '+sc.sceneNumber +
        (sc.timeRange ? ' · '+_esc(sc.timeRange) : '') +
        (p.source && (p.source.videoId || p.source.fileBlobUrl) && sc.startSec != null
          ? ' <button class="rm-mini" onclick="rmJump('+(sc.startSec||0)+')">▶ '+_esc(_fmtSec(sc.startSec))+'</button>'
          : '') +
        (sc.deleted
          ? ' <button class="rm-mini ok" onclick="rmRestoreOne('+idx+')">↺ 복구</button>'
          : ' <button class="rm-mini danger" onclick="rmDeleteOne('+idx+')">🗑 삭제</button>') +
      '</div>' +
      '<label>원본 자막 (편집 불가)</label>' +
      '<div class="rm-orig">'+_esc(sc.originalCaption || '(빈 자막)')+'</div>' +
      '<label>수정 자막 (한국어)</label>' +
      '<textarea class="rm-ta" rows="2" oninput="rmEdit('+idx+',\'editedCaption\',this.value)">'+_esc(sc.editedCaption || '')+'</textarea>' +
      '<label>일본어 자막</label>' +
      '<textarea class="rm-ta" rows="2" oninput="rmEdit('+idx+',\'captionJa\',this.value)">'+_esc(sc.captionJa || '')+'</textarea>' +
      '<label>화면 설명</label>' +
      '<input type="text" class="rm-inp" oninput="rmEdit('+idx+',\'visualDescription\',this.value)" value="'+_escAttr(sc.visualDescription || '')+'">' +
      '<label>메모</label>' +
      '<input type="text" class="rm-inp" oninput="rmEdit('+idx+',\'notes\',this.value)" value="'+_escAttr(sc.notes || '')+'">' +
      '<div class="rm-edit-actions">' +
        '<button class="rm-mini" onclick="rmTranslateOne('+idx+')">🇯🇵 다시 번역</button>' +
        '<button class="rm-mini" onclick="rmVariantOne('+idx+',\'shorter\')">⏬ 더 짧게</button>' +
        '<button class="rm-mini" onclick="rmVariantOne('+idx+',\'natural\')">💆 자연스럽게</button>' +
        '<button class="rm-mini" onclick="rmVariantOne('+idx+',\'senior\')">👴 시니어</button>' +
        '<button class="rm-mini" onclick="rmVariantOne('+idx+',\'casual\')">😄 캐주얼</button>' +
        '<button class="rm-mini" onclick="rmPolishKo('+idx+')">✨ KO 다듬기</button>' +
      '</div>' +
    '</div>';
  }

  /* ── 하단 액션 바 (모드별 핵심 액션) ── */
  function _renderActionBar(p) {
    var hasScenes = (p.scenes || []).length > 0;
    if (!hasScenes) return '';
    var sel = (p.scenes || []).filter(function(sc){ return !sc.deleted && sc.selected !== false; }).length;
    return '<div class="rm-actbar">' +
      '<button class="rm-act" onclick="rmTranslateAll()">🇯🇵 전체 일본어 자막 생성</button>' +
      '<button class="rm-act" onclick="rmTranslateSelected()">🇯🇵 선택 ('+sel+')만 일본어 생성</button>' +
      '<button class="rm-act" onclick="rmBuildBoth()">🇰🇷🇯🇵 한일 동시 자막 묶기</button>' +
      '<span class="rm-sep"></span>' +
      '<button class="rm-act" onclick="rmDownloadSrt(\'ja\')">📄 SRT (JA)</button>' +
      '<button class="rm-act" onclick="rmDownloadSrt(\'ko\')">📄 SRT (KO)</button>' +
      '<button class="rm-act" onclick="rmDownloadTxt(\'ja\')">📄 TXT (JA)</button>' +
      '<button class="rm-act" onclick="rmDownloadTxt(\'both\')">📄 TXT (한일)</button>' +
      '<button class="rm-act" onclick="rmDownloadJson()">📄 JSON</button>' +
      '<span class="rm-sep"></span>' +
      '<button class="rm-act pri" onclick="rmBridgeVoice()">🎙 음성 교체 → Step 3</button>' +
      '<button class="rm-act" onclick="rmPreflight()">🔍 자동숏츠 검증 (preflight)</button>' +
      '<button class="rm-act pri" onclick="rmBridgeShorts()">📦 핸드오프 저장</button>' +
      '<button class="rm-act pri" onclick="rmGotoShorts2()">→ Step 2 로 이동</button>' +
    '</div>';
  }

  function _renderStatus(p) {
    var html = '';
    if (p._status) {
      var cls = p._status.kind || 'init';
      html += '<div class="rm-status '+cls+'">'+_esc(p._status.text || '')+'</div>';
    }
    var errs = (p.errors || []).slice(-3);
    var warns = (p.warnings || []).slice(-3);
    if (errs.length) {
      html += '<div class="rm-errpanel high"><b>❌ 오류</b><ul>' +
        errs.map(function(e){ return '<li><b>['+_esc(e.code)+']</b> '+_esc(e.message)+'</li>'; }).join('') +
        '</ul></div>';
    }
    if (warns.length) {
      html += '<div class="rm-errpanel warn"><b>⚠️ 경고</b><ul>' +
        warns.map(function(w){ return '<li><b>['+_esc(w.code)+']</b> '+_esc(w.message)+'</li>'; }).join('') +
        '</ul></div>';
    }
    /* 마지막 export 결과 배너 + 검증 패널 (counts) */
    if (p.lastExport && p.lastExport.result) {
      var r = p.lastExport.result;
      var c = p.lastExport.counts || r.counts;
      var preOnly = !!p.lastExport.preflightOnly;
      if (r.ok) {
        html += '<div class="rm-errpanel ok">' +
          '<b>'+(preOnly?'✅ 검증 통과 (preflight)':'✅ 자동숏츠 핸드오프 준비 완료')+'</b>' +
          (c ? '<div style="font-size:11px;margin-top:4px">' +
            '전체 ' + (c.total||0) + ' · 활성 ' + (c.active||0) +
            ' · 자막 있음 ' + (c.withCaption||0) + ' · 자막 비어있음 ' + (c.empty||0) +
            ' · 일본어 자막 ' + (c.ja||0) +
          '</div>' : '') +
          (r.written ? '<div style="font-size:11px;margin-top:2px">' +
            '저장 경로: s1.scenes ' + r.written.scenes + ' · s3.scenePrompts ' + r.written.prompts +
          '</div>' : '') +
          (r.warnings && r.warnings.length ? '<ul style="font-size:11px">' +
            r.warnings.map(function(w){ return '<li>⚠️ <b>['+_esc(w.code)+']</b> '+_esc(w.message)+'</li>'; }).join('') +
          '</ul>' : '') +
          '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">' +
            (preOnly ? '<button class="rm-mini ok" onclick="rmBridgeShorts()">📦 핸드오프 저장</button> ' : '') +
            '<button class="rm-mini ok" onclick="rmGotoShorts2()">→ Step 2 로 이동</button>' +
            '<button class="rm-mini ok" onclick="rmGotoShorts3()">→ Step 3 (음성)</button>' +
          '</div>' +
        '</div>';
      } else if (r.errors && r.errors.length) {
        html += '<div class="rm-errpanel high"><b>❌ 자동숏츠 전달 차단</b>' +
          (c ? '<div style="font-size:11px;margin-top:4px">' +
            '전체 ' + (c.total||0) + ' · 활성 ' + (c.active||0) +
            ' · 자막 있음 ' + (c.withCaption||0) +
          '</div>' : '') +
          '<ul>' +
          r.errors.map(function(e){ return '<li><b>['+_esc(e.code)+']</b> '+_esc(e.message)+'</li>'; }).join('') +
          '</ul></div>';
      }
    }
    return html;
  }

  function _renderCopyNotice() {
    return '<details class="rm-notice"><summary>📚 권한 / 저작권 안내 + 후속 기능</summary><ul>' +
      window.RM_SOURCE.COPY_NOTICE.map(function(x){ return '<li>'+_esc(x)+'</li>'; }).join('') +
      '<li><i>후속(이번 PR 미포함):</i> OAuth 자막 자동 가져오기 / 서버 proxy 자막·프레임 처리 / 업로드 MP4 의 ffmpeg.wasm 프레임 추출</li>' +
    '</ul></details>';
  }

  /* ════════════════════════════════════════════════
     액션 핸들러 (window 노출)
     ════════════════════════════════════════════════ */
  function _re() { render(); }
  function _setStatus(text, kind) {
    var p = window.RM_CORE.project();
    p._status = text ? { text: text, kind: kind || 'init' } : null;
    window.RM_CORE.save();
    _re();
  }

  window.rmGotoStage      = function(id){ window.RM_CORE.setStage(id); _re(); };
  window.rmSetYoutubeUrl  = function(v){ window.RM_SOURCE.setYoutubeUrl(v); _re(); };
  window.rmLoadVideoFile  = function(ev){
    var f = ev && ev.target && ev.target.files && ev.target.files[0];
    if (!f) return;
    window.RM_SOURCE.loadMp4File(f, function(meta){
      _setStatus('✅ MP4 로드 — ' + meta.fileName + ' (' + meta.durationSec + '초)', 'ok');
      try { ev.target.value = ''; } catch(_) {}
    });
  };
  window.rmLoadCaptionFile = function(ev){
    var f = ev && ev.target && ev.target.files && ev.target.files[0];
    if (!f) return;
    window.RM_SOURCE.loadCaptionFile(f, function(d){
      window.RM_CORE.setTranscriptRaw(d.text, d.format);
      _setStatus('✅ 자막 파일 로드 — ' + d.fileName + ' ('+d.format+')', 'ok');
      try { ev.target.value = ''; } catch(_) {}
      _re();
    });
  };
  window.rmSetTranscriptRaw = function(v){ window.RM_CORE.setTranscriptRaw(v); };

  /* ── 붙여넣기 시 자동 장면 분리 — 사용자가 "장면 분리" 버튼을 누르지 않아도 동작 ──
       1) onpaste 이벤트로 즉시 paste 본문 캡처 → 100ms 후 자동 parse (textarea 가 채워질 시간 줌)
       2) blur (포커스 이탈) 시에도 한 번 더 — 수동 입력 종료 시점 처리 */
  var _autoParseTimer = null;
  function _maybeAutoParse(){
    var p = window.RM_CORE.project();
    var raw = String(p.transcript.raw || '').trim();
    /* 너무 짧으면 (50자 미만) 자동 파싱 보류 — 의도치 않은 짧은 문장에서 동작 방지 */
    if (raw.length < 50) return false;
    /* 이미 scenes 가 있고 raw 길이가 비슷하면 다시 안 함 */
    if ((p.scenes || []).length > 0) return false;
    if (typeof window.rmParseAndSplit === 'function') window.rmParseAndSplit();
    return true;
  }
  window.rmOnPaste = function(ev){
    /* paste 이벤트 직후엔 textarea 값에 아직 paste 본문이 없을 수 있음 — setTimeout 으로 다음 tick 에 확인 */
    if (_autoParseTimer) clearTimeout(_autoParseTimer);
    _autoParseTimer = setTimeout(function(){
      _autoParseTimer = null;
      _maybeAutoParse();
    }, 120);
  };
  window.rmOnPasteBlur = function(){
    if (_autoParseTimer) clearTimeout(_autoParseTimer);
    _autoParseTimer = null;
    _maybeAutoParse();
  };

  /* 자막 textarea 가 비어있을 때 — focus + 스크롤 + 플래시 하이라이트 */
  function _focusPasteTextarea() {
    var ta = document.getElementById('rm-paste-ta');
    if (!ta) return;
    try {
      ta.scrollIntoView({ behavior:'smooth', block:'center' });
      ta.classList.add('rm-paste-flash');
      setTimeout(function(){ try { ta.focus(); } catch(_) {} }, 180);
      setTimeout(function(){ try { ta.classList.remove('rm-paste-flash'); } catch(_) {} }, 1600);
    } catch(_) {}
  }
  window.rmParseAndSplit = function(){
    var p = window.RM_CORE.project();
    var raw = String(p.transcript.raw || '').trim();
    if (!raw) {
      _setStatus('⚠️ 자막/대본이 비어 있습니다. 유튜브 자막, 직접 받아쓴 대본, SRT/TXT 내용을 먼저 붙여넣어 주세요.', 'warn');
      _focusPasteTextarea();
      return;
    }
    var r = window.RM_PARSER.parseAndSplit(raw, { videoId: p.source.videoId });
    if (!r.scenes.length) {
      _setStatus('❌ 장면 분리 실패 — 자막 형식을 확인하세요. (SRT/VTT 형식 또는 일반 줄/문장 텍스트가 필요합니다)', 'err');
      _focusPasteTextarea();
      return;
    }
    window.RM_CORE.setTranscriptCues(r.cues, r.format);
    window.RM_CORE.setScenes(r.scenes);
    var pp = window.RM_CORE.project();
    pp._active = 0;
    window.RM_CORE.setStage('scenes');
    window.RM_CORE.save();
    _setStatus('✅ '+r.scenes.length+'개 씬 분리 완료 · 형식 '+r.format, 'ok');
  };

  window.rmSetMode  = function(m){ window.RM_CORE.setMode(m); _re(); };
  window.rmSetLang  = function(l){ window.RM_CORE.setCaptionLang(l); _re(); };
  window.rmToggleSenior = function(){
    var p = window.RM_CORE.project(); window.RM_CORE.setSeniorTone(!p.seniorTone); _re();
  };

  window.rmSetActive = function(idx){
    var p = window.RM_CORE.project();
    p._active = idx;
    var sc = (p.scenes || [])[idx];
    if (sc && typeof sc.startSec === 'number') p._activeJump = sc.startSec;
    window.RM_CORE.save();
    /* MP4 video 가 있으면 currentTime 으로 바로 seek */
    var v = document.getElementById('rm-video-active');
    if (v && sc && typeof sc.startSec === 'number') {
      try { v.currentTime = sc.startSec; } catch(_) {}
    }
    _re();
  };
  window.rmJump = function(sec){
    var p = window.RM_CORE.project();
    p._activeJump = sec;
    window.RM_CORE.save();
    var v = document.getElementById('rm-video-active');
    if (v) { try { v.currentTime = sec; v.play && v.play().catch(function(){}); } catch(_){} _re(); return; }
    _re();
  };
  window.rmToggleSel = function(idx){
    var p = window.RM_CORE.project();
    if (!p.scenes[idx]) return;
    p.scenes[idx].selected = p.scenes[idx].selected === false ? true : false;
    window.RM_CORE.save();
    _re();
  };
  window.rmSelectAll = function(on){
    var p = window.RM_CORE.project();
    p.scenes = window.RM_PARSER.selectAll(p.scenes, on);
    window.RM_CORE.save();
    _re();
  };
  window.rmDeleteOne = function(idx){
    var p = window.RM_CORE.project();
    if (!p.scenes[idx]) return;
    p.scenes[idx].deleted = true; p.scenes[idx].selected = false;
    window.RM_CORE.save();
    _re();
  };
  window.rmRestoreOne = function(idx){
    var p = window.RM_CORE.project();
    if (!p.scenes[idx]) return;
    p.scenes[idx].deleted = false;
    window.RM_CORE.save();
    _re();
  };
  window.rmRestoreAll = function(){
    var p = window.RM_CORE.project();
    p.scenes = window.RM_PARSER.restoreAll(p.scenes);
    window.RM_CORE.save();
    _re();
  };
  window.rmMergeShort = function(){
    var p = window.RM_CORE.project();
    var before = (p.scenes || []).length;
    p.scenes = window.RM_PARSER.mergeShortScenes(p.scenes, 1.5);
    window.RM_CORE.save();
    _setStatus('🧩 짧은 자막 병합 — ' + before + ' → ' + p.scenes.length + ' 씬', 'ok');
  };
  window.rmRemoveBlanks = function(){
    var p = window.RM_CORE.project();
    p.scenes = window.RM_PARSER.markBlanksDeleted(p.scenes);
    window.RM_CORE.save();
    _re();
  };
  window.rmEdit = function(idx, key, val){
    window.RM_CORE.patchScene(idx, (function(o){ var x = {}; x[key] = val; return x; })());
  };

  window.rmTranslateOne = async function(idx){
    _setStatus('🇯🇵 번역 중...', 'loading');
    var ja = await window.RM_TRANSLATE.translateOne(idx);
    _setStatus(ja ? '✅ 번역 완료' : '⚠️ 번역 결과 없음', ja ? 'ok' : 'warn');
  };
  window.rmTranslateAll = async function(){
    _setStatus('🇯🇵 전체 번역 중...', 'loading');
    var r = await window.RM_TRANSLATE.translateBatch('all', null, function(i, n){
      _setStatus('🇯🇵 번역 ' + i + ' / ' + n, 'loading');
    });
    _setStatus('✅ 번역 완료 — 성공 '+r.ok+' / 실패 '+r.fail, r.ok ? 'ok' : 'warn');
  };
  window.rmTranslateSelected = async function(){
    _setStatus('🇯🇵 선택 씬 번역 중...', 'loading');
    var r = await window.RM_TRANSLATE.translateBatch('selected', null, function(i, n){
      _setStatus('🇯🇵 번역 ' + i + ' / ' + n, 'loading');
    });
    _setStatus('✅ 선택 씬 번역 완료 — 성공 '+r.ok+' / 실패 '+r.fail, r.ok ? 'ok' : 'warn');
  };
  window.rmVariantOne = async function(idx, variant){
    _setStatus('🪄 ' + variant + ' 변형 중...', 'loading');
    var r = await window.RM_TRANSLATE.variantOne(idx, variant);
    _setStatus(r ? '✅ 변형 완료' : '⚠️ 변형 결과 없음', r ? 'ok' : 'warn');
  };
  window.rmPolishKo = async function(idx){
    _setStatus('✨ 한국어 다듬기...', 'loading');
    var r = await window.RM_TRANSLATE.polishKo(idx);
    _setStatus(r ? '✅ 다듬기 완료' : '⚠️ 다듬기 결과 없음', r ? 'ok' : 'warn');
  };
  window.rmBuildBoth = function(){
    window.RM_TRANSLATE.buildBothAll();
    _setStatus('✅ 한일 동시 자막 묶음 갱신', 'ok');
  };

  window.rmDownloadSrt  = function(lang){ window.RM_EXPORT.downloadSrt(lang, { selectedOnly: false }); };
  window.rmDownloadTxt  = function(lang){ window.RM_EXPORT.downloadTxt(lang, { selectedOnly: false }); };
  window.rmDownloadJson = function(){ window.RM_EXPORT.downloadJson(); };

  window.rmBridgeVoice = function(){
    var p = window.RM_CORE.project();
    var lang = p.captionLang || 'ja';
    var payload = window.RM_VOICE.buildAndBridge({ language: lang, selectedOnly: false });
    if (payload) {
      _setStatus('✅ 음성 payload 준비 — Step 3 (음성) 으로 이동 가능', 'ok');
    } else {
      _setStatus('❌ 음성 payload 생성 실패', 'err');
    }
  };
  window.rmBridgeShorts = function(){
    var r = window.RM_EXPORT.sendToShorts({ selectedOnly: false });
    _re();
    if (r && r.ok) {
      _setStatus('✅ 자동숏츠 핸드오프 준비 완료 — 씬 '+r.scenes.length+'개. "→ Step 2 로 이동" 버튼을 누르세요.', 'ok');
    } else {
      var msg = (r && r.errors && r.errors[0] && r.errors[0].message) || '자동숏츠 전달 실패';
      _setStatus('❌ ' + msg, 'err');
    }
  };
  /* preflight 만 실행 — 검증 패널이 결과를 표시 (저장 X) */
  window.rmPreflight = function(){
    var pf = window.RM_EXPORT.preflight({ selectedOnly: false });
    var p = window.RM_CORE.project();
    p.lastExport = { at: Date.now(), result: pf, mode: p.mode, counts: pf.counts, preflightOnly: true };
    window.RM_CORE.save();
    _re();
    if (pf.ok) _setStatus('✅ 검증 통과 — 자동숏츠로 보낼 준비가 완료되었습니다.', 'ok');
    else _setStatus('⚠️ 검증 실패 — 패널의 안내를 확인하세요.', 'warn');
  };
  window.rmGotoShorts2 = function(){
    /* 핸드오프 키가 없으면 미리 sendToShorts 호출 — 사용자가 검증만 한 뒤 바로 이동 시도 */
    var hasKey = false;
    try { hasKey = !!localStorage.getItem(window.RM_EXPORT.HANDOFF_KEY || 'moca_remix_to_shorts_v1'); } catch(_){}
    if (!hasKey) {
      var r = window.RM_EXPORT.sendToShorts({ selectedOnly: false });
      if (!r || !r.ok) {
        _setStatus('❌ 핸드오프 저장 실패 — 자동숏츠로 이동하지 않습니다.', 'err');
        _re(); return;
      }
    }
    window.RM_EXPORT.gotoShortsStep2();
  };
  window.rmGotoShorts3 = function(){
    var hasKey = false;
    try { hasKey = !!localStorage.getItem(window.RM_EXPORT.HANDOFF_KEY || 'moca_remix_to_shorts_v1'); } catch(_){}
    if (!hasKey) {
      var r = window.RM_EXPORT.sendToShorts({ selectedOnly: false });
      if (!r || !r.ok) { _setStatus('❌ 핸드오프 저장 실패', 'err'); _re(); return; }
    }
    window.RM_EXPORT.gotoShortsStep3();
  };

  window.RM_BOARD = { render: render };
})();
