/* ================================================
   modules/studio/s1-youtube-remix.js
   유튜브 레퍼런스 리믹스 보드 — Step 1 모드 'youtube_reference_adapt'
   * 4단 구조: 링크/자막 입력 → 원본 장면 보드 → 비교 보드 → Step 2 보내기
   * iframe 미리보기, 자막 파싱, 4 모드 각색, 일본어/한국어 자막,
     씬별 재각색, 원본 유사도 검사, Step 2/3 prompt 저장
   * 원본 영상 다운로드/문장 복제 금지 — iframe + paste-only
   * 의존: YT_REMIX_PARSER · YT_REMIX_SAFETY · YT_REMIX_ADAPTER
   ================================================ */
(function(){
  'use strict';

  /* ── 모드 정의 ── */
  var ADAPT_MODES = [
    { id:'subtitle_only',  title:'자막만 번역/변경',     desc:'장면 구조 유지 · 원본 자막을 한/일/한일 동시로 변환' },
    { id:'partial_rewrite',title:'대본만 일부 각색',     desc:'장면 구조 유지 · 말투/표현/CTA 를 내 채널에 맞게 수정' },
    { id:'structure_only', title:'구조만 참고 — 새 주제',desc:'훅/전개/CTA 구조만 참고 · 대사·장면은 새 주제로 생성' },
    { id:'full_recreate',  title:'완전 재창작',          desc:'원본 장점만 참고 · 장면/대사/소재 새로 생성' },
  ];
  var CAPTION_LANGS = [
    { id:'ko',   label:'한국어만' },
    { id:'ja',   label:'일본어만' },
    { id:'both', label:'한일 동시' },
  ];
  var STYLE_HINTS = [
    { id:'senior',    label:'시니어' },
    { id:'info',      label:'정보' },
    { id:'comic',     label:'코믹' },
    { id:'emotional', label:'감동' },
    { id:'animation', label:'애니메이션' },
  ];

  /* ── 상태 ── */
  var YRX = {
    busy: false,
    busyTag: '',
    status: '',
    activeTab: 'input',  /* input / orig / cmp / send */
    /* 입력 */
    url: '',
    videoId: '',
    title: '',
    transcript: '',
    newTopic: '',
    style: 'senior',
    captionLang: 'both',
    seniorTone: true,
    adaptationMode: 'partial_rewrite',
    /* 결과 */
    detectedScenes: [],
    adaptedScenes:  [],
    safety:         null,
    /* 씬별 busy */
    sceneBusy: {},
  };
  window.YRX_STATE = YRX;

  /* ════════════════════════════════════════════════
     메인 렌더 — s1-modes.js 디스패처가 호출
     ════════════════════════════════════════════════ */
  window._s1RenderYoutubeRemixBlock = function(wid) {
    _injectCSS();
    _restoreFromProject();

    return ''+
    '<div class="s1s-block s1s-mode-block yrx-wrap">'+
      '<div class="s1s-label">🎬 유튜브 레퍼런스 리믹스 — 조회수 영상 구조로 새로 만들기</div>'+
      '<div class="yrx-notice">'+
        '⚠️ 원본 영상은 다운로드·재사용하지 않습니다. iframe 미리보기 + 사용자가 붙여넣은 자막/대본만 사용합니다. '+
        '원본 문장을 그대로 복제하지 말고, 수정·번역·각색 형태로만 활용하세요.'+
      '</div>'+

      /* 탭 */
      '<div class="yrx-tabs">'+
        _tabBtn('input', '1. 링크 / 자막 입력') +
        _tabBtn('orig',  '2. 원본 장면 보드 (' + YRX.detectedScenes.length + ')') +
        _tabBtn('cmp',   '3. 각색 비교 보드 (' + YRX.adaptedScenes.length + ')') +
        _tabBtn('send',  '4. Step 2 로 보내기') +
      '</div>'+

      _renderActiveSection() +
      _renderStatus() +
    '</div>';
  };

  function _tabBtn(id, label){
    var on = YRX.activeTab === id ? ' on' : '';
    return '<button type="button" class="yrx-tab'+on+'" onclick="yrxTab(\''+id+'\')">'+_esc(label)+'</button>';
  }
  function _renderActiveSection(){
    if (YRX.activeTab === 'orig') return _renderOrigBoard();
    if (YRX.activeTab === 'cmp')  return _renderCompareBoard();
    if (YRX.activeTab === 'send') return _renderSendSection();
    return _renderInputSection();
  }

  /* ════════════════════════════════════════════════
     Section 1 — 링크 / 자막 입력
     ════════════════════════════════════════════════ */
  function _renderInputSection() {
    var vid = YRX.videoId;
    var iframeHtml = vid
      ? '<iframe src="https://www.youtube.com/embed/'+_esc(vid)+'" '+
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" '+
        'allowfullscreen referrerpolicy="strict-origin-when-cross-origin" '+
        'onerror="yrxIframeFail()"></iframe>'
      : '<div class="yrx-iframe-empty">유튜브 링크를 입력하면<br>iframe 미리보기가 표시됩니다.<br><br>(영상은 다운로드·복제하지 않습니다)</div>';

    return ''+
    '<div class="yrx-input-grid">'+
      /* 좌측 — 링크 + iframe */
      '<div class="yrx-input-col">'+
        '<label class="yrx-label">유튜브 링크</label>'+
        '<input type="url" class="yrx-inp" placeholder="https://youtube.com/shorts/... 또는 https://youtu.be/..." '+
          'value="'+_escAttr(YRX.url)+'" oninput="yrxSetUrl(this.value)">'+
        '<div class="yrx-iframe-box">'+ iframeHtml +'</div>'+
        (vid ? '<div class="yrx-iframe-meta">'+
          '<span>영상 ID: <b>'+_esc(vid)+'</b></span>'+
          '<a href="https://www.youtube.com/watch?v='+_esc(vid)+'" target="_blank" rel="noopener">새 창에서 열기 ↗</a>'+
        '</div>' : '')+
        '<label class="yrx-label" style="margin-top:6px">영상 제목 (선택)</label>'+
        '<input type="text" class="yrx-inp" placeholder="원본 영상 제목 — 유사도 검사 용" '+
          'value="'+_escAttr(YRX.title)+'" oninput="yrxSet(\'title\',this.value)">'+
      '</div>'+

      /* 우측 — 자막/대본 + 새 주제 + 모드 */
      '<div class="yrx-input-col">'+
        '<label class="yrx-label">자막 / 대본 붙여넣기</label>'+
        '<div class="yrx-hint">'+
          '자막을 자동으로 가져오지 못하는 경우, 유튜브 자막 또는 직접 받아쓴 대본을 붙여넣어 주세요. '+
          '시간 표기(00:12 또는 00:12 → 00:18) 가 있으면 자동으로 씬 단위로 분해됩니다.'+
        '</div>'+
        '<textarea class="yrx-ta yrx-ta-large" placeholder="00:00 안녕하세요&#10;00:04 오늘은 ...&#10;&#10;또는 일반 문장 그대로 붙여넣기" '+
          'oninput="yrxSet(\'transcript\',this.value)">'+_esc(YRX.transcript)+'</textarea>'+
        '<div class="yrx-actions">'+
          '<button type="button" class="yrx-btn pri" onclick="yrxParseScenes()">📋 자막/대본 장면으로 나누기</button>'+
          '<button type="button" class="yrx-btn" onclick="yrxClearTranscript()">🗑 자막 비우기</button>'+
        '</div>'+

        '<label class="yrx-label" style="margin-top:8px">내 새 주제 (선택 — 구조만 참고/완전 재창작 시 권장)</label>'+
        '<input type="text" class="yrx-inp" placeholder="예: 시니어 무릎 스트레칭" '+
          'value="'+_escAttr(YRX.newTopic)+'" oninput="yrxSet(\'newTopic\',this.value)">'+

        '<div class="yrx-row" style="margin-top:6px">'+
          '<span class="yrx-row-label">스타일</span>'+
          '<div class="yrx-seg">'+
            STYLE_HINTS.map(function(s){
              var on = YRX.style === s.id;
              return '<button type="button" class="yrx-seg-btn '+(on?'on':'')+'" onclick="yrxSet(\'style\',\''+s.id+'\')">'+_esc(s.label)+'</button>';
            }).join('') +
          '</div>'+
        '</div>'+
        '<div class="yrx-row">'+
          '<span class="yrx-row-label">자막 언어</span>'+
          '<div class="yrx-seg">'+
            CAPTION_LANGS.map(function(c){
              var on = YRX.captionLang === c.id;
              return '<button type="button" class="yrx-seg-btn '+(on?'on':'')+'" onclick="yrxSet(\'captionLang\',\''+c.id+'\')">'+_esc(c.label)+'</button>';
            }).join('') +
          '</div>'+
        '</div>'+
        '<label class="yrx-label" style="display:flex;align-items:center;gap:6px;cursor:pointer">'+
          '<input type="checkbox" '+(YRX.seniorTone?'checked':'')+' onchange="yrxToggleSenior()"> '+
          '일본 시니어 친화 톤 (부드럽고 정중한 표현)'+
        '</label>'+
      '</div>'+
    '</div>'+

    /* 모드 선택 */
    '<div class="yrx-board-hd" style="margin-top:8px">'+
      '<div class="yrx-board-title">🪄 각색 모드 선택</div>'+
    '</div>'+
    '<div class="yrx-modes">'+
      ADAPT_MODES.map(function(m){
        var on = YRX.adaptationMode === m.id;
        return '<button type="button" class="yrx-mode-btn '+(on?'on':'')+'" onclick="yrxSet(\'adaptationMode\',\''+m.id+'\')">'+
          '<span class="yrx-mode-title">'+_esc(m.title)+'</span>'+
          '<span class="yrx-mode-desc">'+_esc(m.desc)+'</span>'+
        '</button>';
      }).join('') +
    '</div>'+

    '<div class="yrx-actions">'+
      '<button type="button" class="yrx-btn pri" '+(YRX.busy||!YRX.detectedScenes.length?'disabled':'')+' onclick="yrxAdaptAll()">'+
        '🪄 선택 모드로 전체 각색 시작'+
      '</button>'+
      '<button type="button" class="yrx-btn" '+(!YRX.detectedScenes.length?'disabled':'')+' onclick="yrxTab(\'orig\')">→ 원본 장면 보드 보기</button>'+
    '</div>';
  }

  /* ════════════════════════════════════════════════
     Section 2 — 원본 장면 보드
     ════════════════════════════════════════════════ */
  function _renderOrigBoard() {
    if (!YRX.detectedScenes.length) {
      return '<div class="yrx-empty">먼저 1단계에서 자막/대본을 붙여넣고 "장면으로 나누기" 를 눌러 주세요.</div>';
    }
    return ''+
    '<div class="yrx-board-hd">'+
      '<div class="yrx-board-title">📋 원본 장면 보드 — 총 '+YRX.detectedScenes.length+' 씬</div>'+
      '<div class="yrx-actions">'+
        '<button type="button" class="yrx-btn" onclick="yrxTab(\'input\')">← 입력으로</button>'+
        '<button type="button" class="yrx-btn pri" '+(YRX.busy?'disabled':'')+' onclick="yrxAdaptAll()">🪄 전체 각색 시작</button>'+
      '</div>'+
    '</div>'+
    '<div class="yrx-orig-grid">'+
      YRX.detectedScenes.map(function(sc, i){
        return '<div class="yrx-orig-card">'+
          '<div class="yrx-orig-hd">'+
            '<span class="yrx-orig-no">씬 '+sc.sceneNumber+'</span>'+
            (sc.timeRange ? '<span class="yrx-orig-time">'+_esc(sc.timeRange)+'</span>' : '')+
            '<span class="yrx-orig-role">'+_esc(sc.roleLabel || sc.role)+'</span>'+
            '<span class="yrx-orig-shot">'+_esc(sc.shotTypeLabel || sc.shotType)+'</span>'+
          '</div>'+
          '<div class="yrx-orig-text">'+_esc(sc.original || '(빈 자막)')+'</div>'+
          '<div class="yrx-orig-meta">'+
            '<span><b>자막 길이</b> '+_esc(sc.captionLength)+'</span>'+
            '<span><b>컷 리듬</b> '+_esc(sc.cutRhythm)+'</span>'+
          '</div>'+
          '<input type="text" class="yrx-cmp-input" placeholder="참고할 점 (예: 빠른 컷)" '+
            'value="'+_escAttr(sc.keepNote)+'" oninput="yrxOrigEdit('+i+',\'keepNote\',this.value)">'+
          '<input type="text" class="yrx-cmp-input" placeholder="제외할 점 (예: 광고 톤)" '+
            'value="'+_escAttr(sc.avoidNote)+'" oninput="yrxOrigEdit('+i+',\'avoidNote\',this.value)">'+
        '</div>';
      }).join('') +
    '</div>';
  }

  /* ════════════════════════════════════════════════
     Section 3 — 비교 보드 (원본 vs 각색)
     ════════════════════════════════════════════════ */
  function _renderCompareBoard() {
    if (!YRX.adaptedScenes.length) {
      return '<div class="yrx-empty">아직 각색본이 없습니다. 1단계 또는 2단계에서 "🪄 전체 각색 시작" 을 눌러 주세요.</div>';
    }
    var perScene = (YRX.safety && YRX.safety.perScene) || [];
    return ''+
    '<div class="yrx-board-hd">'+
      '<div class="yrx-board-title">🔀 원본 / 각색 비교 — 총 '+YRX.adaptedScenes.length+' 씬</div>'+
      '<div class="yrx-actions">'+
        '<button type="button" class="yrx-btn" onclick="yrxRunSafety()">🛡 원본 유사도 검사</button>'+
        '<button type="button" class="yrx-btn pri" onclick="yrxTab(\'send\')">→ Step 2 로 보내기</button>'+
      '</div>'+
    '</div>'+
    '<div class="yrx-cmp-grid">'+
      YRX.adaptedScenes.map(function(sc, i){
        var orig = YRX.detectedScenes[i] || sc;
        var risk = perScene[i] || {};
        var busy = !!YRX.sceneBusy[i];
        return '<div class="yrx-cmp-row">'+
          /* 좌 — 원본 */
          '<div class="yrx-cmp-col">'+
            '<div class="yrx-cmp-side orig">원본 · 씬 '+sc.sceneNumber+
              (orig.timeRange ? ' · '+_esc(orig.timeRange) : '')+
              ' · '+_esc(orig.roleLabel || orig.role || '')+'</div>'+
            '<div class="yrx-cmp-text">'+_esc(orig.original || '(빈 자막)')+'</div>'+
            '<div class="yrx-cmp-meta">'+
              '샷타입: <b>'+_esc(orig.shotTypeLabel || orig.shotType || '')+'</b> · '+
              '자막 길이: <b>'+_esc(orig.captionLength)+'</b> · 컷 리듬: <b>'+_esc(orig.cutRhythm)+'</b>'+
            '</div>'+
          '</div>'+
          /* 우 — 각색 */
          '<div class="yrx-cmp-col">'+
            '<div class="yrx-cmp-side adapt">'+
              '각색본'+
              (risk.risk ? ' <span class="yrx-cmp-risk '+_esc(risk.risk)+'">'+_riskLabel(risk.risk)+(risk.narrationOverlap?' · '+risk.narrationOverlap+'%':'')+'</span>' : '')+
            '</div>'+
            '<textarea class="yrx-cmp-input" rows="2" placeholder="새 대사" '+
              'oninput="yrxAdaptEdit('+i+',\'adaptedNarration\',this.value)">'+_esc(sc.adaptedNarration)+'</textarea>'+
            '<input type="text" class="yrx-cmp-input" placeholder="새 강조 자막 (≤14자 권장)" '+
              'value="'+_escAttr(sc.adaptedCaption)+'" oninput="yrxAdaptEdit('+i+',\'adaptedCaption\',this.value)">'+
            '<div class="yrx-cmp-cap-row">'+
              '<span><b>KO</b> '+_esc(sc.captionKo || '-')+'</span>'+
              '<span><b>JA</b> '+_esc(sc.captionJa || '-')+'</span>'+
            '</div>'+
            '<input type="text" class="yrx-cmp-input" placeholder="화면 묘사 (이미지/영상 prompt 시드)" '+
              'value="'+_escAttr(sc.visualDescription)+'" oninput="yrxAdaptEdit('+i+',\'visualDescription\',this.value)">'+
            '<div class="yrx-cmp-actions">'+
              '<button type="button" class="yrx-mini" '+(busy?'disabled':'')+' onclick="yrxRedoScene('+i+')">↻ 다시 각색</button>'+
              '<button type="button" class="yrx-mini" '+(busy?'disabled':'')+' onclick="yrxSceneVar('+i+',\'ja_only\')">🇯🇵 일본어 자막</button>'+
              '<button type="button" class="yrx-mini" '+(busy?'disabled':'')+' onclick="yrxSceneVar('+i+',\'ko_only\')">🇰🇷 한국어 자막</button>'+
              '<button type="button" class="yrx-mini" '+(busy?'disabled':'')+' onclick="yrxSceneVar('+i+',\'shorter\')">⏬ 더 짧게</button>'+
              '<button type="button" class="yrx-mini" '+(busy?'disabled':'')+' onclick="yrxSceneVar('+i+',\'comic\')">😂 코믹</button>'+
              '<button type="button" class="yrx-mini" '+(busy?'disabled':'')+' onclick="yrxSceneVar('+i+',\'emotional\')">💝 감동</button>'+
              '<button type="button" class="yrx-mini" '+(busy?'disabled':'')+' onclick="yrxSceneVar('+i+',\'senior\')">👴 시니어 톤</button>'+
              '<button type="button" class="yrx-mini ok" onclick="yrxSendOneToStep2('+i+')">→ Step 2</button>'+
            '</div>'+
          '</div>'+
        '</div>';
      }).join('') +
    '</div>';
  }

  /* ════════════════════════════════════════════════
     Section 4 — Step 2 보내기 + safety
     ════════════════════════════════════════════════ */
  function _renderSendSection() {
    if (!YRX.adaptedScenes.length) {
      return '<div class="yrx-empty">아직 각색본이 없습니다. 1~3단계를 먼저 완료해 주세요.</div>';
    }
    var s = YRX.safety;
    var safetyHtml = '';
    if (s) {
      var label = s.overallRisk === 'low' ? '낮음 — 사용 가능' :
                  s.overallRisk === 'medium' ? '보통 — 일부 표현 수정 권장' :
                  '높음 — 다시 각색 권장';
      var items = [].concat(
        s.sentenceSimilarityWarnings || [],
        s.visualSimilarityWarnings || [],
        s.brandCarryoverWarnings || []
      );
      if (s.titleSimilarityWarning) items.push(s.titleSimilarityWarning);
      var hasRisky = (s.perScene || []).some(function(p){ return p.risk === 'high' || p.risk === 'medium'; });
      safetyHtml = '<div class="yrx-cs '+_esc(s.overallRisk)+'">'+
        '<div class="yrx-cs-hd">🛡 원본 유사도: '+_esc(label)+
          (s.overallRisk === 'high' ? ' — 원본과 너무 유사합니다. 구조만 남기고 표현을 다시 각색하세요.' : '')+
        '</div>'+
        (items.length ? '<ul class="yrx-cs-list">'+items.map(function(x){ return '<li>'+_esc(x)+'</li>'; }).join('')+'</ul>'
                      : '<div>유사도 위반 항목이 없습니다.</div>') +
        ((s.recommendedFixes||[]).length ? '<ul class="yrx-cs-list">'+s.recommendedFixes.map(function(x){ return '<li>'+_esc(x)+'</li>'; }).join('')+'</ul>' : '') +
        '<div class="yrx-actions" style="margin-top:8px">'+
          '<button type="button" class="yrx-btn" '+(YRX.busy||!hasRisky?'disabled':'')+' onclick="yrxRedoRisky()">⚠️ 위험 문장만 다시 각색</button>'+
          '<button type="button" class="yrx-btn" '+(YRX.busy?'disabled':'')+' onclick="yrxAdaptAll()">↻ 전체 다시 각색</button>'+
          '<button type="button" class="yrx-btn pri" '+(YRX.busy?'disabled':'')+' onclick="yrxRecreateFromStructure()">🪄 구조만 남기고 완전 재작성</button>'+
        '</div>'+
      '</div>';
    }

    return ''+
    '<div class="yrx-board-hd">'+
      '<div class="yrx-board-title">📤 Step 2 로 보내기</div>'+
      '<div class="yrx-actions">'+
        '<button type="button" class="yrx-btn" onclick="yrxRunSafety()">🛡 다시 검사</button>'+
        '<button type="button" class="yrx-btn pri" onclick="yrxSendAllToStep2()">→ Step 2 (이미지·영상) 으로 보내기</button>'+
      '</div>'+
    '</div>'+
    safetyHtml +
    '<div class="yrx-empty" style="text-align:left">'+
      '<b>저장되는 데이터</b><br>'+
      'STUDIO.project.s1.scenes / project.scenes — 각색된 ' + YRX.adaptedScenes.length + ' 씬<br>'+
      'STUDIO.project.s3.imagePrompts / videoPrompts / scenePrompts — Step 2 v4 컴파일러가 즉시 사용<br>'+
      'STUDIO.project.s1.youtubeReference.videoId / url / detectedScenes / adaptationMode — 리믹스 컨텍스트<br>'+
      '<i>비어 있는 prompt 는 Step 2 에서 v4 컴파일러가 자동 생성합니다.</i>'+
    '</div>';
  }

  /* ════════════════════════════════════════════════
     상태 setter / 탭 전환
     ════════════════════════════════════════════════ */
  window.yrxTab = function(t){ YRX.activeTab = t; _persist(); _refresh(); };
  window.yrxSet = function(key, val){
    YRX[key] = val;
    if (key === 'url') {
      var p = window.YT_REMIX_PARSER;
      YRX.videoId = p ? p.extractVideoId(val) : '';
    }
    _persist();
    if (key === 'url' || key === 'style' || key === 'captionLang' || key === 'adaptationMode') _refresh();
  };
  window.yrxSetUrl = function(v){ window.yrxSet('url', v); };
  window.yrxToggleSenior = function(){ YRX.seniorTone = !YRX.seniorTone; _persist(); _refresh(); };
  window.yrxClearTranscript = function(){
    YRX.transcript = ''; YRX.detectedScenes = []; YRX.adaptedScenes = []; YRX.safety = null;
    _persist(); _refresh();
  };
  window.yrxIframeFail = function(){
    _toast('⚠️ iframe 미리보기 로드 실패 — 영상이 임베드 차단됐을 수 있습니다. 새 창에서 열기를 사용해 주세요.', 'warn');
  };

  /* ════════════════════════════════════════════════
     자막 → 씬 분해
     ════════════════════════════════════════════════ */
  window.yrxParseScenes = function(){
    var p = window.YT_REMIX_PARSER;
    if (!p) { _toast('⚠️ remix parser 미로드', 'error'); return; }
    var src = String(YRX.transcript || '').trim();
    if (!src) { _toast('⚠️ 자막/대본을 먼저 붙여넣어 주세요.', 'warn'); return; }
    var scenes = p.parseTranscriptToScenes(src);
    if (!scenes.length) { _toast('⚠️ 씬을 분해하지 못했습니다. 형식을 확인하세요.', 'warn'); return; }
    YRX.detectedScenes = scenes;
    YRX.adaptedScenes  = []; /* 새 분해 → 기존 각색본 초기화 */
    YRX.safety = null;
    YRX.activeTab = 'orig';
    _persist();
    _toast('✅ ' + scenes.length + '개 씬으로 분해 완료', 'success');
    _refresh();
  };
  window.yrxOrigEdit = function(idx, key, val){
    if (!YRX.detectedScenes[idx]) return;
    YRX.detectedScenes[idx][key] = val;
    _persist();
  };

  /* ════════════════════════════════════════════════
     전체 각색
     ════════════════════════════════════════════════ */
  window.yrxAdaptAll = async function(){
    if (YRX.busy) return;
    if (!YRX.detectedScenes.length) { _toast('⚠️ 먼저 자막을 분해해 주세요.', 'warn'); return; }
    var ad = window.YT_REMIX_ADAPTER;
    if (!ad) { _toast('⚠️ remix adapter 미로드', 'error'); return; }
    YRX.busy = true; YRX.busyTag = 'adapt'; YRX.status = '🪄 ' + _modeLabel(YRX.adaptationMode) + ' 모드로 각색 중...';
    _refresh();
    try {
      var opts = {
        newTopic: YRX.newTopic, style: YRX.style,
        captionLang: YRX.captionLang, seniorTone: YRX.seniorTone,
        audience: YRX.seniorTone ? '일본 시니어' : '일반',
      };
      var scenes = await ad.adaptAllScenes(YRX.detectedScenes, YRX.adaptationMode, opts);
      YRX.adaptedScenes = scenes;
      YRX.activeTab = 'cmp';
      _persistAdaptation(scenes);
      _runSafetyInternal();
      YRX.status = '✅ ' + scenes.length + '개 씬 각색 완료 — 비교 보드에서 수정 가능';
      _toast(YRX.status, 'success');
    } catch(e) {
      YRX.status = '❌ 각색 실패: ' + ((e && e.message) || e);
      _toast(YRX.status, 'error');
    }
    YRX.busy = false; YRX.busyTag = ''; _refresh();
  };

  /* 씬 단위 다시 각색 — 동일 모드로 1개만 */
  window.yrxRedoScene = async function(idx){
    if (!YRX.adaptedScenes[idx]) return;
    var ad = window.YT_REMIX_ADAPTER;
    if (!ad) { _toast('⚠️ remix adapter 미로드', 'error'); return; }
    YRX.sceneBusy[idx] = true; _refresh();
    try {
      var single = await ad.adaptAllScenes([YRX.detectedScenes[idx]], YRX.adaptationMode, {
        newTopic: YRX.newTopic, style: YRX.style,
        captionLang: YRX.captionLang, seniorTone: YRX.seniorTone,
      });
      if (single && single[0]) {
        single[0].sceneIndex = idx;
        single[0].sceneNumber = idx + 1;
        YRX.adaptedScenes[idx] = single[0];
        _persistAdaptation(YRX.adaptedScenes);
        _runSafetyInternal();
        _toast('✅ 씬 ' + (idx+1) + ' 다시 각색 완료', 'success');
      }
    } catch(e) { _toast('❌ ' + ((e && e.message) || e), 'error'); }
    YRX.sceneBusy[idx] = false; _refresh();
  };

  /* 씬 단위 변형 — variant: ja_only / ko_only / shorter / comic / emotional / senior / natural */
  window.yrxSceneVar = async function(idx, variant){
    if (!YRX.adaptedScenes[idx]) return;
    var ad = window.YT_REMIX_ADAPTER;
    if (!ad) { _toast('⚠️ remix adapter 미로드', 'error'); return; }
    YRX.sceneBusy[idx] = true; _refresh();
    try {
      var next = await ad.adaptSceneTone(YRX.adaptedScenes[idx], variant, {
        newTopic: YRX.newTopic, role: YRX.adaptedScenes[idx].roleLabel,
      });
      if (next) {
        YRX.adaptedScenes[idx] = next;
        _persistAdaptation(YRX.adaptedScenes);
        _runSafetyInternal();
        _toast('✅ 씬 ' + (idx+1) + ' ' + variant + ' 적용', 'success');
      }
    } catch(e) { _toast('❌ ' + ((e && e.message) || e), 'error'); }
    YRX.sceneBusy[idx] = false; _refresh();
  };

  window.yrxAdaptEdit = function(idx, key, val){
    if (!YRX.adaptedScenes[idx]) return;
    YRX.adaptedScenes[idx][key] = val;
    _persistAdaptation(YRX.adaptedScenes);
  };

  /* ── 위험(medium/high) 씬만 일괄 재각색 ── */
  window.yrxRedoRisky = async function(){
    if (YRX.busy) return;
    var sf = YRX.safety;
    if (!sf || !Array.isArray(sf.perScene)) {
      _toast('⚠️ 먼저 유사도 검사를 실행해 주세요.', 'warn'); return;
    }
    var risky = sf.perScene.filter(function(p){ return p.risk === 'high' || p.risk === 'medium'; });
    if (!risky.length) { _toast('✅ 위험 씬이 없습니다.', 'success'); return; }
    YRX.busy = true; YRX.busyTag = 'redo-risky';
    YRX.status = '⚠️ 위험 씬 ' + risky.length + '개 다시 각색 중...';
    _refresh();
    try {
      for (var k = 0; k < risky.length; k++) {
        var idx = risky[k].sceneIndex;
        await window.yrxRedoScene(idx);
      }
      YRX.status = '✅ 위험 ' + risky.length + '개 씬 재각색 완료';
      _toast(YRX.status, 'success');
    } catch(e) {
      YRX.status = '❌ 재각색 실패: ' + ((e && e.message) || e);
      _toast(YRX.status, 'error');
    }
    YRX.busy = false; YRX.busyTag = ''; _refresh();
  };

  /* ── 구조만 남기고 완전 재작성 — adaptationMode 강제 'full_recreate' ── */
  window.yrxRecreateFromStructure = function(){
    if (YRX.busy) return;
    YRX.adaptationMode = 'full_recreate';
    _persist();
    return window.yrxAdaptAll();
  };

  window.yrxSendOneToStep2 = function(idx){
    if (!YRX.adaptedScenes[idx]) return;
    _persistAdaptation(YRX.adaptedScenes);
    _toast('✅ 씬 ' + (idx+1) + ' Step 2 로 저장됐습니다. 모든 씬을 보내려면 4단계를 사용하세요.', 'success');
  };
  window.yrxSendAllToStep2 = function(){
    if (!YRX.adaptedScenes.length) { _toast('⚠️ 먼저 각색을 실행해 주세요.', 'warn'); return; }
    _persistAdaptation(YRX.adaptedScenes);
    if (typeof window.studioGoto === 'function') window.studioGoto(2);
    else _toast('✅ 저장 완료 — 상단 stepper 에서 ② 이미지·영상 으로 이동해 주세요.', 'success');
  };

  /* ════════════════════════════════════════════════
     Safety 검사
     ════════════════════════════════════════════════ */
  window.yrxRunSafety = function(){
    if (!YRX.adaptedScenes.length) { _toast('⚠️ 먼저 각색을 실행해 주세요.', 'warn'); return null; }
    var r = _runSafetyInternal();
    var kind = r.overallRisk === 'low' ? 'success' : r.overallRisk === 'medium' ? 'warn' : 'error';
    var msg  = r.overallRisk === 'low' ? '🛡 원본 유사도 낮음 — 사용 가능' :
               r.overallRisk === 'medium' ? '⚠️ 일부 표현 수정 권장' :
                                            '❌ 원본과 너무 유사 — 다시 각색 권장';
    _toast(msg, kind);
    _refresh();
    return r;
  };
  function _runSafetyInternal(){
    var sf = window.YT_REMIX_SAFETY;
    if (!sf) return null;
    var src = (YRX.transcript || '') + '\n' + (YRX.title || '');
    var r = sf.checkAll(src, YRX.adaptedScenes, {
      originalTitle: YRX.title,
      newTopic: YRX.newTopic,
    });
    YRX.safety = r;
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    proj.s1 = proj.s1 || {};
    proj.s1.youtubeReference = proj.s1.youtubeReference || {};
    proj.s1.youtubeReference.copySafety = r;
    if (typeof window.studioSave === 'function') window.studioSave();
    return r;
  }

  /* ════════════════════════════════════════════════
     STUDIO.project 저장
     ════════════════════════════════════════════════ */
  function _persist() {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    proj.s1 = proj.s1 || {};
    proj.s1.mode = 'youtube_reference_adapt';
    proj.s1.youtubeReference = Object.assign({}, proj.s1.youtubeReference || {}, {
      url: YRX.url, videoId: YRX.videoId, title: YRX.title,
      transcript: YRX.transcript, newTopic: YRX.newTopic,
      style: YRX.style, captionLang: YRX.captionLang,
      seniorTone: YRX.seniorTone,
      adaptationMode: YRX.adaptationMode,
      activeTab: YRX.activeTab,
      detectedScenes: YRX.detectedScenes,
      updatedAt: Date.now(),
    });
    if (!proj.s1.youtubeReference.createdAt) proj.s1.youtubeReference.createdAt = Date.now();
    if (typeof window.studioSave === 'function') window.studioSave();
  }
  function _persistAdaptation(scenes) {
    if (!Array.isArray(scenes)) return;
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    proj.s1 = proj.s1 || {};
    proj.s3 = proj.s3 || {};
    proj.s1.youtubeReference = proj.s1.youtubeReference || {};
    proj.s1.youtubeReference.adaptedScenes  = scenes;
    proj.s1.youtubeReference.adaptationMode = YRX.adaptationMode;

    /* ⭐ Step 2 resolver 가 1순위로 읽는 위치 */
    proj.s1.scenes = scenes.map(_toStudioScene);
    proj.scenes    = proj.s1.scenes.slice();

    /* scriptText/scriptKo — 미리보기/검색용 */
    var scriptText = scenes.map(function(sc){
      return '씬 ' + sc.sceneNumber + ' (' + (sc.roleLabel || sc.role || '') + ')\n' +
             (sc.adaptedNarration || sc.original || '') +
             ((sc.adaptedCaption || sc.captionKo || sc.captionJa) ?
               '\n자막: ' + (sc.adaptedCaption || sc.captionKo || sc.captionJa) : '') +
             (sc.visualDescription ? '\n화면: ' + sc.visualDescription : '');
    }).join('\n\n');
    proj.scriptText  = scriptText;
    proj.s1.scriptKo = scriptText;

    /* Step 2 prompt 호환 */
    proj.s3.imagePrompts = scenes.map(function(sc){ return sc.imagePrompt || ''; });
    proj.s3.videoPrompts = scenes.map(function(sc){ return sc.videoPrompt || ''; });
    proj.s3.scenePrompts = scenes.map(function(sc, i){
      return {
        sceneIndex:        i,
        promptCompiled:    sc.imagePrompt || '',
        prompt:            sc.imagePrompt || '',
        imagePrompt:       sc.imagePrompt || '',
        videoPrompt:       sc.videoPrompt || '',
        narration:         sc.adaptedNarration || sc.original || '',
        caption:           sc.adaptedCaption || sc.captionKo || sc.captionJa || '',
        captionKo:         sc.captionKo || '',
        captionJa:         sc.captionJa || '',
        visualDescription: sc.visualDescription || '',
        role:              sc.role,
        source:            'youtube_reference_remix',
        adaptationMode:    YRX.adaptationMode,
        adaptedFromSourceSceneIndex: i,
      };
    });
    proj.s3.prompts = proj.s3.imagePrompts.slice();
    proj.s3._hydrateSource = 'youtube-remix';

    if (typeof window.studioSave === 'function') window.studioSave();

    /* v4 컴파일러 자동 호출 — 비어 있는 prompt 자동 생성 */
    try {
      if (typeof window.compileImagePromptsV4All === 'function') {
        window.compileImagePromptsV4All(proj);
      }
      if (typeof window.compileVideoPromptsV4All === 'function') {
        window.compileVideoPromptsV4All(proj);
      }
      if (typeof window.s3ScoreAllAndStoreV4 === 'function') {
        window.s3ScoreAllAndStoreV4();
      }
    } catch(e) {
      try { console.debug('[yt-remix] v4 compile skipped:', e && e.message); } catch(_){}
    }
    if (typeof window.studioSave === 'function') window.studioSave();
  }
  function _toStudioScene(sc) {
    var roleCode = ({ hook:'hook', setup:'setup', evidence:'conflict_or_core',
      reveal:'reveal_or_solution', cta:'cta' })[sc.role] || sc.role || 'conflict_or_core';
    var narration = sc.adaptedNarration || sc.original || '';
    var caption   = sc.adaptedCaption || sc.captionKo || sc.captionJa || '';
    var visual    = sc.visualDescription || '';
    return {
      sceneIndex:        sc.sceneIndex,
      sceneNumber:       sc.sceneNumber,
      role:              roleCode,
      displayRole:       sc.roleLabel || '',
      narration:         narration,
      caption:           caption,
      captionKo:         sc.captionKo || '',
      captionJa:         sc.captionJa || '',
      visualDescription: visual,
      label:             '씬 ' + sc.sceneNumber,
      desc:              visual || narration,
      text:              narration,
      imagePrompt:       sc.imagePrompt || '',
      videoPrompt:       sc.videoPrompt || '',
      promptCompiled:    sc.imagePrompt || '',
      adaptedFromSourceSceneIndex: sc.sceneIndex,
      source:            'youtube_reference_remix',
    };
  }

  /* ════════════════════════════════════════════════
     STUDIO.project → 상태 복원
     ════════════════════════════════════════════════ */
  function _restoreFromProject() {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var saved = proj.s1 && proj.s1.youtubeReference;
    if (!saved) return;
    if (saved.url && !YRX.url) YRX.url = saved.url;
    if (saved.videoId && !YRX.videoId) YRX.videoId = saved.videoId;
    if (saved.title && !YRX.title) YRX.title = saved.title;
    if (saved.transcript && !YRX.transcript) YRX.transcript = saved.transcript;
    if (saved.newTopic && !YRX.newTopic) YRX.newTopic = saved.newTopic;
    if (saved.style) YRX.style = saved.style;
    if (saved.captionLang) YRX.captionLang = saved.captionLang;
    if (typeof saved.seniorTone === 'boolean') YRX.seniorTone = saved.seniorTone;
    if (saved.adaptationMode) YRX.adaptationMode = saved.adaptationMode;
    if (saved.activeTab && !YRX._tabTouched) YRX.activeTab = saved.activeTab;
    if (Array.isArray(saved.detectedScenes) && saved.detectedScenes.length && !YRX.detectedScenes.length) {
      YRX.detectedScenes = saved.detectedScenes;
    }
    if (Array.isArray(saved.adaptedScenes) && saved.adaptedScenes.length && !YRX.adaptedScenes.length) {
      YRX.adaptedScenes = saved.adaptedScenes;
    }
    if (saved.copySafety && !YRX.safety) YRX.safety = saved.copySafety;
  }

  /* ════════════════════════════════════════════════
     UI helpers
     ════════════════════════════════════════════════ */
  function _renderStatus() {
    if (!YRX.status) return '';
    var cls = YRX.busy ? 'loading' :
              (YRX.status.indexOf('❌') === 0 ? 'err' :
              (YRX.status.indexOf('✅') === 0 ? 'ok' : 'init'));
    return '<div class="yrx-status '+cls+'">'+_esc(YRX.status)+'</div>';
  }
  function _refresh() {
    if (typeof window._studioS1Step === 'function') window._studioS1Step();
    else if (typeof window.renderStudio === 'function') window.renderStudio();
  }
  function _toast(msg, kind) {
    if (typeof window.ucShowToast === 'function') window.ucShowToast(msg, kind || 'info');
    else try { console.debug('[yt-remix]', msg); } catch(_){}
  }
  function _modeLabel(id) {
    var m = ADAPT_MODES.find(function(x){ return x.id === id; });
    return m ? m.title : id;
  }
  function _riskLabel(r) {
    return r === 'low' ? '안전' : r === 'medium' ? '주의' : '위험';
  }
  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function _escAttr(s){ return String(s == null ? '' : s).replace(/"/g,'&quot;').replace(/'/g, "\\'"); }

  /* ── CSS link 동적 주입 (engines/shorts/index.html 에 link 추가하지 않아도 동작) ── */
  function _injectCSS() {
    if (document.getElementById('yrx-style-link')) return;
    var existing = document.querySelector('script[src*="s1-youtube-remix.js"]');
    var href;
    if (existing && existing.src) {
      href = existing.src.replace(/s1-youtube-remix\.js.*$/, 's1-youtube-remix.css');
    } else {
      /* 폴백 — 절대 경로 */
      href = '/modules/studio/s1-youtube-remix.css';
    }
    var link = document.createElement('link');
    link.id = 'yrx-style-link';
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
})();
