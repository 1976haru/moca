/* ================================================
   modules/studio/s1-youtube-reference.js
   Step 1 — 유튜브 링크 분석·각색 모드

   * 새 mode: 'youtube_reference_adapt'
   * 입력: url / title / description / transcript / notes / avoid /
           newTopic / targetStyle / adaptationStrength
   * 분석: APIAdapter.callWithFallback (없으면 휴리스틱 분석)
   * 각색: 새 주제로 5~6 씬 대본 생성 → s1.scenes / project.scenes /
           s3.imagePrompts/videoPrompts/scenePrompts 저장
   * 원본 문장 복제 금지 — 구조·훅·리듬만 참고
   ================================================ */
(function(){
  'use strict';

  /* ── state ── */
  var YR_STATE = {
    busy:    false,
    busyTag: '',
    status:  '',
    /* 입력 */
    url:'', title:'', description:'', transcript:'',
    notes:'', avoid:'', newTopic:'',
    targetStyle:'info', adaptationStrength:'medium',
    /* 사용자 명시 체크박스 — 참고하고 싶은 / 피하고 싶은 부분 */
    benchmarkPoints: { hook:true, pacing:true, captionStyle:true, narrationTone:false, twist:false, cta:true, structure:true, character:false, rhythm:false },
    avoidPoints:     { copyOriginalSentences:true, copyOriginalCharacters:true, copyOriginalVisual:true, exaggeration:false, brandLogoExposure:true },
    /* 결과 */
    analysis: null,
    scenes:   [],
    copySafety: null,
  };
  window.YR_STATE = YR_STATE;

  /* 체크박스 라벨 — 사용자 명세 */
  var BENCH_OPTIONS = [
    { id:'hook',           label:'훅 구조' },
    { id:'pacing',         label:'컷 전환 속도' },
    { id:'captionStyle',   label:'자막 스타일' },
    { id:'narrationTone',  label:'말투/진행 방식' },
    { id:'twist',          label:'반전 포인트' },
    { id:'cta',            label:'CTA 방식' },
    { id:'structure',      label:'전체 구성' },
    { id:'character',      label:'캐릭터 유형' },
    { id:'rhythm',         label:'화면 리듬' },
  ];
  var AVOID_OPTIONS = [
    { id:'copyOriginalSentences',  label:'원본과 너무 비슷한 문장' },
    { id:'copyOriginalCharacters', label:'원본 캐릭터 따라 하기' },
    { id:'copyOriginalVisual',     label:'원본 화면 복제' },
    { id:'exaggeration',           label:'과장된 표현' },
    { id:'brandLogoExposure',      label:'특정 브랜드/로고/인물 노출' },
  ];

  var STYLES = [
    { id:'comic',       label:'코믹' },
    { id:'info',        label:'정보' },
    { id:'senior',      label:'시니어' },
    { id:'emotional',   label:'감동' },
    { id:'trivia',      label:'잡학' },
    { id:'tikitaka',    label:'티키타카' },
    { id:'animation',   label:'애니메이션' },
    { id:'animal',      label:'동물 캐릭터' },
    { id:'realperson',  label:'실사 인물' },
  ];
  var STRENGTHS = [
    { id:'weak',   label:'약하게', desc:'구조만 참고' },
    { id:'medium', label:'보통',   desc:'흐름 참고 + 새 주제 적용' },
    { id:'strong', label:'강하게', desc:'완전히 다른 소재로 재구성' },
  ];

  /* ── 메인 블록 (s1-modes.js _s1RenderModeBlock 가 호출) ── */
  window._s1RenderYoutubeRefBlock = function(wid) {
    _yrInjectCSS();
    /* state 복원 */
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var saved = (proj.s1 && proj.s1.youtubeReference) || {};
    if (saved.url && !YR_STATE.url) Object.assign(YR_STATE, saved);
    if (proj.s1 && proj.s1.referenceAnalysis && !YR_STATE.analysis) YR_STATE.analysis = proj.s1.referenceAnalysis;
    if (proj.s1 && Array.isArray(proj.s1.scenes) && proj.s1.scenes.length && !YR_STATE.scenes.length &&
        proj.s1.youtubeReference) YR_STATE.scenes = proj.s1.scenes;

    return ''+
    '<div class="s1s-block s1s-mode-block yr-wrap">'+
      '<div class="s1s-label">🎬 유튜브 레퍼런스 분석</div>'+
      '<div class="yr-notice">⚠️ 원본 문장을 그대로 복제하지 않고, 훅·구성·리듬만 분석해 새 주제로 각색합니다.</div>'+

      /* 입력 grid */
      '<div class="yr-form">'+
        _yrField('url',         '유튜브 링크',     '<input type="url" class="yr-inp" placeholder="https://youtube.com/shorts/..." value="'+_escAttr(YR_STATE.url)+'" oninput="yrSet(\'url\',this.value)">')+
        _yrField('title',       '영상 제목',       '<input type="text" class="yr-inp" placeholder="원본 영상 제목" value="'+_escAttr(YR_STATE.title)+'" oninput="yrSet(\'title\',this.value)">')+
        _yrField('description', '영상 설명',       '<textarea class="yr-ta" rows="2" placeholder="원본 영상 설명/요약" oninput="yrSet(\'description\',this.value)">'+_esc(YR_STATE.description)+'</textarea>')+
        _yrField('transcript',  '대본/자막 붙여넣기','<textarea class="yr-ta" rows="4" placeholder="원본 자막 또는 대본 텍스트 (분석용 — 복제 금지)" oninput="yrSet(\'transcript\',this.value)">'+_esc(YR_STATE.transcript)+'</textarea>')+
        _yrField('notes',       '참고하고 싶은 점','<textarea class="yr-ta" rows="2" placeholder="예: 빠른 컷, 시니어 친화 자막, CTA 위치" oninput="yrSet(\'notes\',this.value)">'+_esc(YR_STATE.notes)+'</textarea>')+
        _yrField('avoid',       '피하고 싶은 점',  '<textarea class="yr-ta" rows="2" placeholder="예: 과한 슬랭, 특정 캐릭터 모방, 광고 톤" oninput="yrSet(\'avoid\',this.value)">'+_esc(YR_STATE.avoid)+'</textarea>')+
        _yrField('newTopic',    '내 새 주제',      '<input type="text" class="yr-inp" placeholder="예: 시니어 무릎 스트레칭" value="'+_escAttr(YR_STATE.newTopic)+'" oninput="yrSet(\'newTopic\',this.value)">')+
      '</div>'+

      /* 스타일 + 각색 강도 */
      '<div class="yr-row"><span class="yr-row-label">원하는 스타일</span><div class="yr-seg">'+
        STYLES.map(function(s){
          var on = YR_STATE.targetStyle === s.id;
          return '<button type="button" class="yr-seg-btn '+(on?'on':'')+'" onclick="yrSet(\'targetStyle\',\''+s.id+'\')">'+s.label+'</button>';
        }).join('') +
      '</div></div>'+
      '<div class="yr-row"><span class="yr-row-label">각색 강도</span><div class="yr-seg">'+
        STRENGTHS.map(function(s){
          var on = YR_STATE.adaptationStrength === s.id;
          return '<button type="button" class="yr-seg-btn '+(on?'on':'')+'" title="'+s.desc+'" onclick="yrSet(\'adaptationStrength\',\''+s.id+'\')">'+s.label+'</button>';
        }).join('') +
      '</div></div>'+

      /* 참고하고 싶은 부분 — 체크박스 */
      '<div class="yr-row yr-checks"><span class="yr-row-label">참고할 부분</span><div class="yr-chk-grid">'+
        BENCH_OPTIONS.map(function(o){
          var on = !!YR_STATE.benchmarkPoints[o.id];
          return '<label class="yr-chk'+(on?' on':'')+'">'+
            '<input type="checkbox" '+(on?'checked':'')+' onchange="yrToggleBench(\''+o.id+'\')">'+
            '<span>'+o.label+'</span>'+
          '</label>';
        }).join('') +
      '</div></div>'+
      /* 피하고 싶은 부분 — 체크박스 */
      '<div class="yr-row yr-checks"><span class="yr-row-label">피할 부분</span><div class="yr-chk-grid">'+
        AVOID_OPTIONS.map(function(o){
          var on = !!YR_STATE.avoidPoints[o.id];
          return '<label class="yr-chk'+(on?' on':'')+'">'+
            '<input type="checkbox" '+(on?'checked':'')+' onchange="yrToggleAvoid(\''+o.id+'\')">'+
            '<span>'+o.label+'</span>'+
          '</label>';
        }).join('') +
      '</div></div>'+

      /* 액션 */
      '<div class="yr-actions">'+
        '<button type="button" class="yr-btn" '+(YR_STATE.busy?'disabled':'')+' onclick="yrAnalyze()">🔍 레퍼런스 분석하기</button>'+
        '<button type="button" class="yr-btn pri" '+(YR_STATE.busy||!YR_STATE.analysis||!YR_STATE.newTopic?'disabled':'')+' onclick="yrAdapt()">🪄 내 주제로 각색하기</button>'+
        '<button type="button" class="yr-btn" '+(!YR_STATE.scenes.length?'disabled':'')+' onclick="yrCopySafetyCheck()">🛡 원본 유사도 검사</button>'+
        '<button type="button" class="yr-btn" '+(!YR_STATE.scenes.length?'disabled':'')+' onclick="yrSendToStep2()">→ Step 2 로 보내기</button>'+
      '</div>'+
      _yrRenderStatus()+
      _yrRenderAnalysis()+
      _yrRenderScenes()+
      _yrRenderCopySafety()+
    '</div>';
  };

  function _yrField(key, label, inputHtml) {
    return '<div class="yr-field"><label class="yr-label">'+label+'</label>'+inputHtml+'</div>';
  }

  /* ════════════════════════════════════════════════
     상태 setter
     ════════════════════════════════════════════════ */
  window.yrSet = function(key, val) {
    YR_STATE[key] = val;
    /* segmented buttons 즉시 갱신 */
    if (key === 'targetStyle' || key === 'adaptationStrength') _yrRefresh();
    _yrPersistInputs();
  };

  function _yrPersistInputs() {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    proj.s1 = proj.s1 || {};
    /* 사용자 명세 schema — 체크박스를 list 로도 export */
    var benchmarkPointsList = Object.keys(YR_STATE.benchmarkPoints).filter(function(k){ return YR_STATE.benchmarkPoints[k]; });
    var avoidPointsList     = Object.keys(YR_STATE.avoidPoints).filter(function(k){ return YR_STATE.avoidPoints[k]; });
    proj.s1.youtubeReference = Object.assign({}, proj.s1.youtubeReference || {}, {
      url: YR_STATE.url, title: YR_STATE.title, description: YR_STATE.description,
      transcript: YR_STATE.transcript, notes: YR_STATE.notes, avoid: YR_STATE.avoid,
      newTopic: YR_STATE.newTopic, targetStyle: YR_STATE.targetStyle,
      targetGenre: YR_STATE.targetStyle,
      adaptationStrength: YR_STATE.adaptationStrength,
      benchmarkPoints: benchmarkPointsList,
      avoidPoints: avoidPointsList,
      avoidCopying: !!YR_STATE.avoidPoints.copyOriginalSentences,
      updatedAt: Date.now(),
    });
    if (!proj.s1.youtubeReference.createdAt) proj.s1.youtubeReference.createdAt = Date.now();
    proj.s1.mode = 'youtube_reference_adapt';
    if (typeof window.studioSave === 'function') window.studioSave();
  }

  /* 체크박스 토글 */
  window.yrToggleBench = function(id) {
    YR_STATE.benchmarkPoints[id] = !YR_STATE.benchmarkPoints[id];
    _yrPersistInputs(); _yrRefresh();
  };
  window.yrToggleAvoid = function(id) {
    YR_STATE.avoidPoints[id] = !YR_STATE.avoidPoints[id];
    _yrPersistInputs(); _yrRefresh();
  };

  /* ════════════════════════════════════════════════
     레퍼런스 분석 — APIAdapter 우선, 휴리스틱 fallback
     ════════════════════════════════════════════════ */
  window.yrAnalyze = async function() {
    if (YR_STATE.busy) return;
    var src = (YR_STATE.transcript || YR_STATE.description || YR_STATE.title || '').trim();
    if (!src) { _yrToast('⚠️ 분석할 내용을 입력해주세요 (대본/자막/제목/설명 중 하나).', 'warn'); return; }
    YR_STATE.busy = true; YR_STATE.busyTag = 'analyze'; YR_STATE.status = '분석 중...';
    _yrRefresh();
    try {
      var analysis = null;
      if (typeof window.APIAdapter !== 'undefined' && typeof window.APIAdapter.callWithFallback === 'function') {
        try { analysis = await _yrAnalyzeWithAI(src); } catch(_) { analysis = null; }
      }
      if (!analysis) analysis = _yrAnalyzeHeuristic(src);
      YR_STATE.analysis = analysis;
      var proj = (window.STUDIO && window.STUDIO.project) || {};
      proj.s1 = proj.s1 || {};
      proj.s1.referenceAnalysis = analysis;
      if (typeof window.studioSave === 'function') window.studioSave();
      YR_STATE.status = '✅ 레퍼런스 분석 완료. 새 주제를 입력하고 "🪄 내 주제로 각색하기" 를 누르세요.';
      _yrToast('✅ 레퍼런스 분석 완료', 'success');
    } catch(e) {
      YR_STATE.status = '❌ 분석 실패: ' + ((e && e.message) || e);
      _yrToast(YR_STATE.status, 'error');
    }
    YR_STATE.busy = false; YR_STATE.busyTag = '';
    _yrRefresh();
  };

  async function _yrAnalyzeWithAI(src) {
    var system = '당신은 숏츠 영상 구조 분석가입니다. 원문 문장을 절대 복사하지 말고, ' +
                 '훅 패턴 / 씬 개수 / 자막 스타일 / 캐릭터 유형 / 화면 움직임 / 효과음 / CTA 등 ' +
                 '구조와 패턴만 JSON 으로 요약하세요. 원문 대사는 절대 포함하지 마세요.';
    var prompt = 'Analyze this short video reference (paraphrase only — do not copy):\n\n' +
                 '[Title]\n' + (YR_STATE.title || '(none)') + '\n\n' +
                 '[Description]\n' + (YR_STATE.description || '(none)') + '\n\n' +
                 '[Transcript / Script]\n' + (src.slice(0, 4000)) + '\n\n' +
                 '[Notes to keep] ' + (YR_STATE.notes || '(none)') + '\n' +
                 '[Avoid] ' + (YR_STATE.avoid || '(none)') + '\n\n' +
                 'Return JSON only:\n' +
                 '{ "hookPattern":"", "sceneCount":0, "sceneStructure":[{"role":"", "summary":""}], ' +
                 '"captionStyle":"", "characterStyle":"", "visualStyle":"", "motionStyle":"", ' +
                 '"soundStyle":"", "pacing":"", "retentionDevices":[], "ctaPattern":"", ' +
                 '"doNotCopy":["원문 복사 금지 항목들"] }';
    var raw = await window.APIAdapter.callWithFallback(system, prompt, { maxTokens: 1200 });
    var txt = String(raw || '').trim();
    var m = txt.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('AI 응답에서 JSON 을 찾지 못했습니다.');
    var parsed = JSON.parse(m[0]);
    parsed._source = 'ai';
    return parsed;
  }

  function _yrAnalyzeHeuristic(src) {
    var lines = src.split(/\n|(?<=[.!?。])\s+/).map(function(s){ return s.trim(); }).filter(Boolean);
    var sceneCount = Math.min(8, Math.max(3, Math.ceil(lines.length / 4)));
    var captionMatches = src.match(/[A-Z!?]{2,}|[!?]{2,}/g) || [];
    var hookHint = lines[0] ? lines[0].slice(0, 60) + '…' : '';
    var hasCta = /구독|좋아요|팔로우|subscribe|follow|see you|채널|링크/i.test(src);
    return {
      hookPattern:    hookHint ? '강한 첫 줄 / 시청자 자극 — "' + hookHint + '"' : '하드 hook 패턴 미검출',
      sceneCount:     sceneCount,
      sceneStructure: Array.from({length: sceneCount}, function(_, i){
        var role = i === 0 ? '훅' : i === sceneCount - 1 ? 'CTA/마무리' : (i === 1 ? '도입/설명' : '핵심 전개');
        return { role: role, summary: '(휴리스틱 추정 — AI 분석 권장)' };
      }),
      captionStyle:   captionMatches.length > 3 ? '강조 자막 (대문자/감탄부호) 다수' : '균형 자막',
      characterStyle: '미상 (AI 분석 권장)',
      visualStyle:    '미상 (AI 분석 권장)',
      motionStyle:    '컷 위주 (휴리스틱 추정)',
      soundStyle:     '미상',
      pacing:         lines.length > 12 ? '빠른 페이스' : '중간 페이스',
      retentionDevices: hasCta ? ['CTA','반복 강조'] : ['질문형 hook'],
      ctaPattern:     hasCta ? 'CTA 감지됨' : '명시적 CTA 없음',
      doNotCopy:      ['원본 자막 그대로', '원본 캐릭터/이름', '원본 효과음 자체 복제'],
      _source:        'heuristic',
    };
  }

  /* ════════════════════════════════════════════════
     각색 — 새 주제로 5~6 씬 생성
     ════════════════════════════════════════════════ */
  window.yrAdapt = async function() {
    if (YR_STATE.busy) return;
    if (!YR_STATE.analysis) { _yrToast('⚠️ 먼저 레퍼런스 분석을 실행해주세요.', 'warn'); return; }
    if (!YR_STATE.newTopic || YR_STATE.newTopic.length < 2) { _yrToast('⚠️ 내 새 주제를 입력해주세요.', 'warn'); return; }
    YR_STATE.busy = true; YR_STATE.busyTag = 'adapt'; YR_STATE.status = '각색 대본 생성 중...';
    _yrRefresh();
    try {
      var scenes = null;
      if (typeof window.APIAdapter !== 'undefined' && typeof window.APIAdapter.callWithFallback === 'function') {
        try { scenes = await _yrAdaptWithAI(); } catch(_) { scenes = null; }
      }
      if (!scenes || !scenes.length) scenes = _yrAdaptHeuristic();
      YR_STATE.scenes = scenes;
      _yrPersistAdaptation(scenes);
      YR_STATE.status = '✅ ' + scenes.length + '개 씬 각색 완료 — 미리보기 확인 후 Step 2 로 보내주세요.';
      _yrToast(YR_STATE.status, 'success');
    } catch(e) {
      YR_STATE.status = '❌ 각색 실패: ' + ((e && e.message) || e);
      _yrToast(YR_STATE.status, 'error');
    }
    YR_STATE.busy = false; YR_STATE.busyTag = '';
    _yrRefresh();
  };

  async function _yrAdaptWithAI() {
    var ref = YR_STATE.analysis || {};
    var system = '당신은 숏츠 대본 작가입니다. 주어진 레퍼런스 분석의 ' +
                 '훅·씬 구조·리듬·CTA 패턴만 참고해서, 사용자의 새 주제로 완전히 다른 대본을 작성하세요. ' +
                 '원본 대사를 절대 복사하지 마세요. 출력은 JSON 배열만.';
    var styleLabel = (STYLES.find(function(s){ return s.id === YR_STATE.targetStyle; }) || {}).label || '정보';
    var strengthLabel = (STRENGTHS.find(function(s){ return s.id === YR_STATE.adaptationStrength; }) || {}).desc || '흐름 참고';
    var prompt = 'New topic: ' + YR_STATE.newTopic + '\n' +
                 'Style: ' + styleLabel + '\n' +
                 'Adaptation strength: ' + strengthLabel + '\n' +
                 'Notes to keep: ' + (YR_STATE.notes || '(none)') + '\n' +
                 'Avoid: ' + (YR_STATE.avoid || '(none)') + '\n\n' +
                 'Reference structure:\n' + JSON.stringify(ref).slice(0, 2000) + '\n\n' +
                 'Generate 5~6 scenes. JSON array only:\n' +
                 '[ { "sceneNumber":1, "role":"훅", "narration":"새 대사 (한국어)", "caption":"강조 자막", ' +
                 '"visualDescription":"화면 묘사", "referenceRole":"원본 역할", "hookIntent":"훅 의도", ' +
                 '"editNote":"편집 메모", "motionStyle":"컷 스타일", "soundCue":"효과음 힌트" } ]';
    var raw = await window.APIAdapter.callWithFallback(system, prompt, { maxTokens: 2500 });
    var txt = String(raw || '').trim();
    var m = txt.match(/\[[\s\S]*\]/);
    if (!m) throw new Error('AI 응답에서 JSON 배열을 찾지 못했습니다.');
    var arr = JSON.parse(m[0]);
    if (!Array.isArray(arr) || !arr.length) throw new Error('빈 scene 배열');
    return arr.map(function(sc, i){ return _normalizeScene(sc, i, arr.length); });
  }

  function _yrAdaptHeuristic() {
    var ref = YR_STATE.analysis || {};
    var n = Math.max(5, Math.min(6, ref.sceneCount || 5));
    var roles = ['훅','도입','핵심','전개','반전','CTA'];
    var topic = YR_STATE.newTopic || '주제';
    var out = [];
    for (var i = 0; i < n; i++) {
      var role = i === 0 ? '훅' : i === n-1 ? 'CTA' : roles[Math.min(i, roles.length-2)];
      out.push(_normalizeScene({
        sceneNumber: i + 1,
        role: role,
        narration: '[' + role + '] ' + topic + ' 관련 새 대사 (휴리스틱 — AI 키 등록 시 자동 생성)',
        caption: role === '훅' ? '👀 ' + topic + '?' : (role === 'CTA' ? '✅ 도움됐다면 구독!' : ''),
        visualDescription: role + ' 장면 — ' + topic + ' 시각 묘사',
        referenceRole: role,
        hookIntent: i === 0 ? '시청자 호기심 자극' : '',
        editNote:  '레퍼런스 ' + role + ' 위치 참고',
        motionStyle: ref.motionStyle || '컷 위주',
        soundCue:    i === 0 ? 'whoosh' : (i === n-1 ? 'ding' : ''),
      }, i, n));
    }
    return out;
  }

  /* role 정규화 — v4 _resolveRole 이 인식하는 영어 코드로.
     한국어 role 라벨은 displayRole 로 별도 보존하여 UI 표시 유지. */
  function _roleToCode(rawRole, idx, total){
    var r = String(rawRole || '').toLowerCase().trim();
    if (/hook|훅/.test(r))                              return 'hook';
    if (/setup|intro|도입|설명/.test(r))                 return 'setup';
    if (/conflict|core|main|핵심|develop|전개/.test(r))  return 'conflict_or_core';
    if (/reveal|solution|resolve|반전|해결|payoff/.test(r))  return 'reveal_or_solution';
    if (/cta|outro|마무리|conclusion/.test(r))           return 'cta';
    /* fallback — index 기반 */
    if (idx === 0)             return 'hook';
    if (idx === (total||5)-1)  return 'cta';
    if (idx === 1)             return 'setup';
    if (idx === (total||5)-2)  return 'reveal_or_solution';
    return 'conflict_or_core';
  }
  function _roleToDisplay(code){
    return ({hook:'훅', setup:'도입', conflict_or_core:'핵심', reveal_or_solution:'반전/해결', cta:'CTA'})[code] || code;
  }

  function _normalizeScene(sc, i, total) {
    sc = sc || {};
    var sceneIndex = i;
    var sceneNumber = sc.sceneNumber || (i + 1);
    var narration = String(sc.narration || sc.text || sc.script || '').trim();
    var caption   = String(sc.caption || sc.subtitle || '').trim();
    var visual    = String(sc.visualDescription || sc.visual || sc.scene || '').trim();
    var roleCode  = _roleToCode(sc.role, i, total);
    return {
      sceneIndex:        sceneIndex,
      sceneNumber:       sceneNumber,
      /* role 은 v4 호환 영어 코드, displayRole 은 한국어 (UI 표시) */
      role:              roleCode,
      displayRole:       _roleToDisplay(roleCode),
      narration:         narration,
      caption:           caption,
      visualDescription: visual,
      referenceRole:     sc.referenceRole || sc.role || '',
      hookIntent:        sc.hookIntent || '',
      editNote:          sc.editNote || '',
      motionStyle:       sc.motionStyle || '',
      soundCue:          sc.soundCue || '',
      /* 호환 — Step 2 / Step 3 가 읽는 필드 */
      label:             sc.label || ('씬 ' + sceneNumber),
      desc:              visual || narration,
      imagePrompt:       _buildImagePrompt(sc, narration, visual),
      videoPrompt:       _buildVideoPrompt(sc, narration, visual),
      promptCompiled:    _buildImagePrompt(sc, narration, visual),
      adaptedFromSourceSceneIndex: sc.adaptedFromSourceSceneIndex != null ? sc.adaptedFromSourceSceneIndex : i,
    };
  }

  function _buildImagePrompt(sc, narration, visual) {
    var styleLabel = (STYLES.find(function(s){ return s.id === YR_STATE.targetStyle; }) || {}).label || 'realistic';
    var styleHint = (YR_STATE.targetStyle === 'animation') ? 'flat 2d animation style, friendly characters'
                  : (YR_STATE.targetStyle === 'animal')    ? 'cute animal character illustration'
                  : (YR_STATE.targetStyle === 'comic')     ? 'bright pop colors, comedic energy'
                  : (YR_STATE.targetStyle === 'senior')    ? 'warm soft tones, senior-friendly composition'
                  : (YR_STATE.targetStyle === 'emotional') ? 'warm cinematic lighting, emotional mood'
                  : 'clean realistic photography';
    var seed = visual || narration || sc.role || '';
    return seed + ' — ' + styleHint + ', 9:16 vertical, no text overlay, subtitle-safe composition';
  }
  function _buildVideoPrompt(sc, narration, visual) {
    var motion = sc.motionStyle || '컷 위주';
    var seed = visual || narration || sc.role || '';
    return seed + ' — ' + motion + ', short clip 3~5s, 9:16 vertical, smooth motion, no text';
  }

  /* 통합 schema 로 STUDIO.project 저장
     ⭐ v4 prompt compiler 가 로드되어 있으면 hand-built prompt 대신 v4 결과를
     사용한다 (사용자 요구: 'v4 prompt compiler 를 우선 사용. legacy generic
     fallback 으로 내려가지 않도록 할 것'). */
  function _yrPersistAdaptation(scenes) {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    proj.s1 = proj.s1 || {};
    proj.s3 = proj.s3 || {};
    /* s1.scenes + project.scenes — Step 2 resolver 가 1순위로 읽음.
       각 scene 에 narration/caption/visualDescription/role 모두 포함되어
       v4 analyzeSceneIntentV4 가 evidence 추출 가능. */
    proj.s1.scenes = scenes.slice();
    proj.scenes    = scenes.slice();
    /* scriptText / scriptKo — 미리보기/검색용 결합 */
    var scriptText = scenes.map(function(sc){
      return '씬 ' + sc.sceneNumber + ' (' + (sc.role||'') + ')\n' +
             (sc.narration || '') +
             (sc.caption ? '\n자막: ' + sc.caption : '') +
             (sc.visualDescription ? '\n화면: ' + sc.visualDescription : '');
    }).join('\n\n');
    proj.scriptText  = scriptText;
    proj.s1.scriptKo = scriptText;

    /* Step 2 prompt 호환 — 일단 hand-built prompt 로 채워놓고, v4 가 있으면 즉시 덮어씀 */
    proj.s3.imagePrompts  = scenes.map(function(sc){ return sc.imagePrompt; });
    proj.s3.videoPrompts  = scenes.map(function(sc){ return sc.videoPrompt; });
    proj.s3.scenePrompts  = scenes.map(function(sc){
      return {
        sceneIndex:       sc.sceneIndex,
        promptCompiled:   sc.promptCompiled,
        prompt:           sc.imagePrompt,
        imagePrompt:      sc.imagePrompt,
        videoPrompt:      sc.videoPrompt,
        caption:          sc.caption,
        visualDescription:sc.visualDescription,
        motionStyle:      sc.motionStyle,
        soundCue:         sc.soundCue,
        source:           'youtube_reference_adapt',
        adaptedFromSourceSceneIndex: sc.adaptedFromSourceSceneIndex != null ? sc.adaptedFromSourceSceneIndex : sc.sceneIndex,
      };
    });
    proj.s3.prompts = scenes.map(function(sc){ return sc.imagePrompt; });
    proj.s3._hydrateSource = 'script-imagePrompts';
    if (typeof window.studioSave === 'function') window.studioSave();

    /* ⭐ v4 prompt compiler 자동 호출 — 로드되어 있으면 hand-built prompt 를
       v4 결과로 즉시 덮음. v4 미가용 시에만 hand-built fallback 유지. */
    var v4ImageOk = false, v4VideoOk = false;
    if (typeof window.compileImagePromptsV4All === 'function') {
      try {
        var ri = window.compileImagePromptsV4All(proj);
        v4ImageOk = !!(ri && ri.count);
      } catch(e) { try { console.debug('[yt-ref] v4 image compile failed:', e && e.message); } catch(_){} }
    }
    if (typeof window.compileVideoPromptsV4All === 'function') {
      try {
        var rv = window.compileVideoPromptsV4All(proj);
        v4VideoOk = !!(rv && rv.count);
      } catch(e) { try { console.debug('[yt-ref] v4 video compile failed:', e && e.message); } catch(_){} }
    }
    /* 점수도 계산해서 STUDIO.project.s3.promptQualityV4 에 적재 */
    if ((v4ImageOk || v4VideoOk) && typeof window.s3ScoreAllAndStoreV4 === 'function') {
      try { window.s3ScoreAllAndStoreV4(); } catch(_){}
    }
    if (typeof window.studioSave === 'function') window.studioSave();
    try {
      console.debug('[yt-ref] adapted scenes:', scenes.length, '· v4 image:', v4ImageOk, '· v4 video:', v4VideoOk);
      console.debug('[yt-ref] persisted: s1.scenes / project.scenes / s3.imagePrompts/videoPrompts/scenePrompts');
    } catch(_) {}
  }

  /* ════════════════════════════════════════════════
     원본 유사도 검사 (copy safety)
     - 원본 transcript / title / description 과 각색 결과의 narration / caption /
       visualDescription 사이의 n-gram 겹침으로 risk 측정.
     - AI 호출 없이 결정적으로 동작.
     ════════════════════════════════════════════════ */
  function _normForCmp(s){
    return String(s||'').toLowerCase().replace(/[^a-z0-9가-힣\s]/g,' ').replace(/\s+/g,' ').trim();
  }
  function _ngramSet(s, n){
    var t = _normForCmp(s);
    var tokens = t.split(' ').filter(function(w){ return w.length >= 2; });
    var set = {};
    for (var i = 0; i + n <= tokens.length; i++) {
      set[tokens.slice(i, i+n).join(' ')] = true;
    }
    return set;
  }
  function _overlapRatio(targetText, sourceSet){
    var tgt = _ngramSet(targetText, 3);
    var keys = Object.keys(tgt);
    if (!keys.length) return 0;
    var hits = 0;
    keys.forEach(function(k){ if (sourceSet[k]) hits++; });
    return hits / keys.length;
  }

  window.yrCopySafetyCheck = function(){
    if (!YR_STATE.scenes.length) { _yrToast('⚠️ 먼저 각색을 실행해주세요.', 'warn'); return null; }
    var src = (YR_STATE.transcript || '') + '\n' + (YR_STATE.description || '') + '\n' + (YR_STATE.title || '');
    var srcSet3 = _ngramSet(src, 3);
    var srcSet5 = _ngramSet(src, 5);

    var sentenceWarnings = [];
    var visualWarnings   = [];
    YR_STATE.scenes.forEach(function(sc, i){
      var narr = sc.narration || '';
      var cap  = sc.caption || '';
      var vis  = sc.visualDescription || '';
      var rNarr = _overlapRatio(narr + ' ' + cap, srcSet3);
      var rVis  = _overlapRatio(vis, srcSet3);
      var hasLong5 = false;
      var t = _normForCmp(narr + ' ' + cap).split(' ');
      for (var j = 0; j + 5 <= t.length; j++) {
        if (srcSet5[t.slice(j, j+5).join(' ')]) { hasLong5 = true; break; }
      }
      if (hasLong5 || rNarr >= 0.35) {
        sentenceWarnings.push('씬 ' + (i+1) + ': 원본과 유사한 표현 (' + Math.round(rNarr*100) + '%)' + (hasLong5 ? ' — 5단어 연속 일치' : ''));
      }
      if (rVis >= 0.30) {
        visualWarnings.push('씬 ' + (i+1) + ': 원본 화면 묘사와 유사 (' + Math.round(rVis*100) + '%)');
      }
    });

    var titleSrc = _normForCmp(YR_STATE.title || '');
    var titleNew = _normForCmp((YR_STATE.newTopic || '') + ' ' + (YR_STATE.scenes[0] && YR_STATE.scenes[0].caption || ''));
    var titleSimilarity = 0;
    if (titleSrc && titleNew) {
      var t1 = titleSrc.split(' ').filter(function(w){return w.length>=2;});
      var t2 = titleNew.split(' ').filter(function(w){return w.length>=2;});
      var common = t1.filter(function(w){ return t2.indexOf(w) >= 0; }).length;
      titleSimilarity = common / Math.max(1, Math.min(t1.length, t2.length));
    }
    var titleWarning = titleSimilarity >= 0.5 ? ('새 제목/훅이 원본 제목과 유사 (' + Math.round(titleSimilarity*100) + '%)') : '';

    var totalIssues = sentenceWarnings.length + visualWarnings.length + (titleWarning ? 1 : 0);
    var overallRisk = totalIssues === 0 ? 'low' : totalIssues <= 2 ? 'medium' : 'high';

    var fixes = [];
    if (sentenceWarnings.length) fixes.push('위험한 씬은 "이 씬만 다시 각색" 으로 재작성하세요.');
    if (visualWarnings.length)   fixes.push('화면 설명을 새 주제 맥락에 맞춰 더 구체적으로 다시 쓰세요.');
    if (titleWarning)            fixes.push('새 주제를 더 차별화된 표현으로 바꿔보세요.');
    if (overallRisk === 'high')  fixes.push('전체 다시 각색 — 구조만 유지하고 표현을 새로 쓰는 것을 권장합니다.');

    var result = {
      overallRisk: overallRisk,
      sentenceSimilarityWarnings: sentenceWarnings,
      visualSimilarityWarnings:   visualWarnings,
      titleSimilarityWarning:     titleWarning,
      recommendedFixes:           fixes,
      checkedAt: Date.now(),
    };
    YR_STATE.copySafety = result;

    var proj = (window.STUDIO && window.STUDIO.project) || {};
    proj.s1 = proj.s1 || {};
    proj.s1.youtubeReference = proj.s1.youtubeReference || {};
    proj.s1.youtubeReference.copySafety = result;
    if (typeof window.studioSave === 'function') window.studioSave();

    var toastKind = overallRisk === 'low' ? 'success' : overallRisk === 'medium' ? 'warn' : 'error';
    var toastMsg  = overallRisk === 'low'    ? '🛡 원본 유사도 낮음 — 사용 가능' :
                    overallRisk === 'medium' ? '⚠️ 일부 표현 수정 권장' :
                                               '❌ 원본과 너무 유사 — 다시 각색 권장';
    _yrToast(toastMsg, toastKind);
    _yrRefresh();
    return result;
  };

  function _yrRenderCopySafety() {
    var c = YR_STATE.copySafety;
    if (!c) return '';
    var cls = c.overallRisk === 'low' ? 'yr-cs-low' : c.overallRisk === 'medium' ? 'yr-cs-mid' : 'yr-cs-high';
    var label = c.overallRisk === 'low' ? '낮음 — 사용 가능' :
                c.overallRisk === 'medium' ? '보통 — 일부 표현 수정 권장' :
                                             '높음 — 다시 각색 권장';
    var items = [].concat(c.sentenceSimilarityWarnings || [], c.visualSimilarityWarnings || []);
    if (c.titleSimilarityWarning) items.push(c.titleSimilarityWarning);
    return '<div class="yr-cs-card '+cls+'">'+
      '<div class="yr-cs-hd">🛡 원본 유사도: '+_esc(label)+'</div>'+
      (items.length ? '<ul class="yr-cs-list">'+items.map(function(x){ return '<li>'+_esc(x)+'</li>'; }).join('')+'</ul>' : '<div>유사도 위반 항목이 없습니다.</div>')+
      ((c.recommendedFixes||[]).length ? '<ul class="yr-cs-list">'+c.recommendedFixes.map(function(x){ return '<li>'+_esc(x)+'</li>'; }).join('')+'</ul>' : '')+
    '</div>';
  }

  /* ════════════════════════════════════════════════
     씬 단위 다시 각색 / 전체 다시 / Step 2 이동
     ════════════════════════════════════════════════ */
  window.yrReadaptScene = async function(idx) {
    if (!YR_STATE.scenes[idx]) return;
    if (typeof window.APIAdapter === 'undefined') {
      _yrToast('⚠️ AI 어댑터 미로드 — 휴리스틱으로 재생성합니다.', 'warn');
    }
    YR_STATE.busy = true; _yrRefresh();
    try {
      var sample = (await _yrAdaptWithAI())[idx] || _yrAdaptHeuristic()[idx];
      if (sample) {
        sample.sceneIndex = idx; sample.sceneNumber = idx + 1;
        YR_STATE.scenes[idx] = sample;
        _yrPersistAdaptation(YR_STATE.scenes);
        _yrToast('✅ 씬 ' + (idx+1) + ' 다시 각색 완료', 'success');
      }
    } catch(e) {
      _yrToast('❌ 재각색 실패: ' + ((e && e.message) || e), 'error');
    }
    YR_STATE.busy = false; _yrRefresh();
  };
  window.yrReadaptAll = function() {
    YR_STATE.scenes = []; _yrRefresh();
    yrAdapt();
  };
  window.yrSendToStep2 = function() {
    if (!YR_STATE.scenes.length) { _yrToast('⚠️ 먼저 각색하기를 실행해주세요.', 'warn'); return; }
    _yrPersistAdaptation(YR_STATE.scenes);
    if (typeof window.studioGoto === 'function') window.studioGoto(2);
    else _yrToast('✅ 저장 완료 — 상단 stepper 에서 ② 이미지·영상 으로 이동해주세요.', 'success');
  };

  /* ════════════════════════════════════════════════
     렌더 helpers
     ════════════════════════════════════════════════ */
  function _yrRenderStatus() {
    if (!YR_STATE.status) return '';
    var cls = YR_STATE.busy ? 'loading' : (YR_STATE.status.indexOf('❌') === 0 ? 'err' : YR_STATE.status.indexOf('✅') === 0 ? 'ok' : 'init');
    return '<div class="yr-status '+cls+'">'+_esc(YR_STATE.status)+'</div>';
  }
  function _yrRenderAnalysis() {
    var a = YR_STATE.analysis;
    if (!a) return '';
    var rows = [
      ['훅 패턴',     a.hookPattern],
      ['씬 개수',     a.sceneCount],
      ['자막 스타일', a.captionStyle],
      ['캐릭터',      a.characterStyle],
      ['비주얼',      a.visualStyle],
      ['모션',        a.motionStyle],
      ['효과음',      a.soundStyle],
      ['페이스',      a.pacing],
      ['CTA',         a.ctaPattern],
    ];
    var sceneStruct = Array.isArray(a.sceneStructure)
      ? a.sceneStructure.map(function(s, i){ return (i+1) + '. ' + (s.role||'') + ' — ' + (s.summary||''); }).join('<br>')
      : '';
    var dnc = Array.isArray(a.doNotCopy)
      ? '<div class="yr-dnc">⛔ 복제 금지: ' + a.doNotCopy.map(_esc).join(' · ') + '</div>'
      : '';
    return '<details class="yr-analysis" open>'+
      '<summary>📊 레퍼런스 분석 결과 ('+(a._source==='ai'?'AI':'휴리스틱')+')</summary>'+
      '<table class="yr-tbl">'+
        rows.map(function(r){ return '<tr><th>'+r[0]+'</th><td>'+_esc(r[1] == null ? '-' : r[1])+'</td></tr>'; }).join('')+
      '</table>'+
      (sceneStruct ? '<div class="yr-struct"><b>씬 구조:</b><br>'+sceneStruct+'</div>' : '')+
      dnc+
    '</details>';
  }
  function _yrRenderScenes() {
    if (!YR_STATE.scenes.length) return '';
    return '<div class="yr-scenes-section">'+
      '<div class="yr-scenes-hd">📝 각색 미리보기 (' + YR_STATE.scenes.length + '개)</div>'+
      '<div class="yr-scenes-grid">' +
        YR_STATE.scenes.map(function(sc, i){
          return '<div class="yr-scene-card">'+
            '<div class="yr-scene-hd">'+
              '<span class="yr-scene-no">씬 '+sc.sceneNumber+'</span>'+
              '<span class="yr-scene-role">'+_esc(sc.displayRole || sc.role||'')+'</span>'+
              (sc.referenceRole ? '<span class="yr-scene-ref">← '+_esc(sc.referenceRole)+'</span>' : '')+
            '</div>'+
            '<div class="yr-scene-narr">'+_esc(sc.narration || '(빈 대사)')+'</div>'+
            (sc.caption ? '<div class="yr-scene-caption">자막: '+_esc(sc.caption)+'</div>' : '')+
            (sc.visualDescription ? '<div class="yr-scene-visual">화면: '+_esc(sc.visualDescription)+'</div>' : '')+
            (sc.motionStyle ? '<div class="yr-scene-meta">모션: '+_esc(sc.motionStyle)+(sc.soundCue?' · 효과음: '+_esc(sc.soundCue):'')+'</div>' : '')+
            '<div class="yr-scene-actions">'+
              '<button type="button" class="yr-mini-btn" onclick="yrReadaptScene('+i+')">↻ 이 씬 다시</button>'+
            '</div>'+
          '</div>';
        }).join('') +
      '</div>'+
      '<div class="yr-scenes-actions">'+
        '<button type="button" class="yr-btn" onclick="yrReadaptAll()">↻ 전체 다시 각색</button>'+
        '<button type="button" class="yr-btn pri" onclick="yrSendToStep2()">→ Step 2 로 보내기</button>'+
      '</div>'+
    '</div>';
  }

  /* ── refresh ── */
  function _yrRefresh() {
    /* mode 블록 컨테이너 — s1-script-step.js 가 _s1RenderModeBlock 결과를 다시 그릴 때만 갱신 */
    if (typeof window._studioS1Step === 'function') {
      window._studioS1Step();
    } else if (typeof renderStudio === 'function') {
      renderStudio();
    }
  }

  function _yrToast(msg, kind) {
    if (typeof window.ucShowToast === 'function') window.ucShowToast(msg, kind || 'info');
    else try { console.debug('[yt-ref]', msg); } catch(_) {}
  }
  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function _escAttr(s){ return String(s == null ? '' : s).replace(/"/g,'&quot;').replace(/'/g, "\\'"); }

  function _yrInjectCSS() {
    if (document.getElementById('yr-style')) return;
    var st = document.createElement('style');
    st.id = 'yr-style';
    st.textContent = ''+
'.yr-wrap{display:flex;flex-direction:column;gap:8px}'+
'.yr-notice{background:#fff5fa;border:1px solid #f1dce7;border-radius:8px;padding:8px 12px;font-size:11px;color:#5b1a4a}'+
'.yr-form{display:grid;grid-template-columns:1fr 1fr;gap:8px}'+
'@media(max-width:600px){.yr-form{grid-template-columns:1fr}}'+
'.yr-field{display:flex;flex-direction:column;gap:4px}'+
'.yr-field:has(textarea){grid-column:1 / -1}'+
'.yr-label{font-size:11px;font-weight:700;color:#5a4a56}'+
'.yr-inp,.yr-ta{border:1.5px solid #f1dce7;border-radius:8px;padding:7px 10px;font-size:12px;font-family:inherit;width:100%;box-sizing:border-box;line-height:1.5}'+
'.yr-inp:focus,.yr-ta:focus{outline:none;border-color:#9181ff}'+
'.yr-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'+
'.yr-row-label{font-size:11px;font-weight:700;color:#5a4a56;min-width:80px}'+
'.yr-seg{display:flex;gap:4px;flex-wrap:wrap;flex:1}'+
'.yr-seg-btn{padding:4px 10px;border:1.5px solid #f1dce7;border-radius:8px;background:#fff;font-size:11px;font-weight:700;color:#7b7077;cursor:pointer;font-family:inherit}'+
'.yr-seg-btn:hover{border-color:#9181ff;color:#9181ff}'+
'.yr-seg-btn.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}'+
'.yr-actions{display:flex;gap:6px;flex-wrap:wrap;align-items:center}'+
'.yr-btn{padding:7px 14px;border:1.5px solid #f1dce7;border-radius:10px;background:#fff;color:#5a4a56;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit}'+
'.yr-btn:hover:not(:disabled){border-color:#9181ff;color:#9181ff}'+
'.yr-btn:disabled{opacity:.5;cursor:not-allowed}'+
'.yr-btn.pri{border:none;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff}'+
'.yr-btn.pri:hover:not(:disabled){opacity:.92;color:#fff}'+
'.yr-status{padding:6px 12px;border-radius:8px;font-size:12px;font-weight:700}'+
'.yr-status.loading{background:#eef5ff;color:#2b66c4}'+
'.yr-status.ok{background:#dcfce7;color:#166534}'+
'.yr-status.err{background:#fee2e2;color:#991b1b}'+
'.yr-status.init{background:#fff5fa;color:#5b1a4a}'+
'.yr-analysis{background:#fafafe;border:1px solid #f1dce7;border-radius:10px;padding:8px 12px;font-size:11.5px}'+
'.yr-analysis summary{cursor:pointer;font-weight:800;color:#5b1a4a}'+
'.yr-tbl{width:100%;border-collapse:collapse;margin-top:6px;font-size:11px}'+
'.yr-tbl th{text-align:left;padding:3px 6px;color:#7b6080;font-weight:700;width:90px}'+
'.yr-tbl td{padding:3px 6px;color:#2b2430}'+
'.yr-struct{margin-top:6px;padding:6px 8px;background:#fff;border-radius:6px;color:#5a4a56;line-height:1.5}'+
'.yr-dnc{margin-top:6px;padding:5px 8px;background:#fee2e2;color:#991b1b;border-radius:6px;font-weight:700}'+
'.yr-scenes-section{margin-top:6px;display:flex;flex-direction:column;gap:8px}'+
'.yr-scenes-hd{font-weight:800;color:#5b1a4a;font-size:12px}'+
'.yr-scenes-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:6px}'+
'.yr-scene-card{background:#fff;border:1.5px solid #f1dce7;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:4px;font-size:11.5px}'+
'.yr-scene-hd{display:flex;align-items:center;gap:6px;flex-wrap:wrap}'+
'.yr-scene-no{font-weight:800;color:#2b2430}'+
'.yr-scene-role{padding:2px 7px;background:#f5f0ff;color:#5a4a8a;border-radius:6px;font-size:10px;font-weight:700}'+
'.yr-scene-ref{font-size:10px;color:#9b8a93}'+
'.yr-scene-narr{color:#2b2430;line-height:1.5}'+
'.yr-scene-caption,.yr-scene-visual,.yr-scene-meta{font-size:10.5px;color:#5a4a56}'+
'.yr-scene-actions{display:flex;gap:4px;margin-top:4px}'+
'.yr-mini-btn{flex:1;padding:4px 8px;border:1px solid #f1dce7;background:#fff;border-radius:6px;font-size:10.5px;font-weight:700;color:#5a4a56;cursor:pointer;font-family:inherit}'+
'.yr-mini-btn:hover{border-color:#9181ff;color:#9181ff}'+
'.yr-scenes-actions{display:flex;gap:6px;flex-wrap:wrap}'+
'.yr-checks{align-items:flex-start}'+
'.yr-chk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:4px;flex:1}'+
'.yr-chk{display:flex;align-items:center;gap:6px;padding:5px 8px;background:#fff;border:1px solid #f1dce7;border-radius:8px;font-size:11px;cursor:pointer;color:#5a4a56}'+
'.yr-chk input{margin:0;accent-color:#9181ff}'+
'.yr-chk.on{background:#f5f0ff;border-color:#9181ff;color:#5a4a8a;font-weight:700}'+
'.yr-cs-card{margin-top:6px;padding:10px 12px;border-radius:10px;font-size:12px;line-height:1.55}'+
'.yr-cs-low{background:#dcfce7;color:#166534;border:1px solid #86efac}'+
'.yr-cs-mid{background:#fef3c7;color:#92400e;border:1px solid #fcd34d}'+
'.yr-cs-high{background:#fee2e2;color:#991b1b;border:1px solid #fca5a5}'+
'.yr-cs-hd{font-weight:800;margin-bottom:4px}'+
'.yr-cs-list{margin:4px 0 0 16px;padding:0;font-size:11px}'+
'';
    document.head.appendChild(st);
  }
})();
