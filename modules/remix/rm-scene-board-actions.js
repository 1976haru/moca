/* ================================================
   modules/remix/rm-scene-board-actions.js
   영상 리믹스 스튜디오 — Scene 보드 액션 핸들러

   * rm-scene-board.js 가 1000+ 줄을 넘어 분리.
     렌더는 rm-scene-board-render.js 가 담당.
   * 모든 window.rm* 핸들러는 여기서 정의 — 기존 inline onclick 호환 유지.
   * _re() 가 window._rmBoardRender(rootId) 를 호출해 다시 렌더.
   * window._rmMaybeAutoParse 는 rm-server-ui.js 가 사용.
   ================================================ */
(function(){
  'use strict';

  function _re() {
    if (typeof window._rmBoardRender === 'function') window._rmBoardRender();
  }
  function _setStatus(text, kind) {
    var p = window.RM_CORE.project();
    p._status = text ? { text: text, kind: kind || 'init' } : null;
    window.RM_CORE.save();
    _re();
  }

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

  /* ── 자동 장면 분리 — 사용자가 "장면 분리" 버튼을 누르지 않아도 동작 ──
       1) onpaste — 즉시 paste 본문 캡처 (120ms 지연으로 textarea 갱신 대기)
       2) oninput debounce — 타이핑 종료 후 800ms (rmSetTranscriptRaw)
       3) onblur — 포커스 이탈 시 한 번 더 */
  var _autoParseTimer = null;
  var _typingTimer = null;
  function _maybeAutoParse(){
    var p = window.RM_CORE.project();
    var raw = String(p.transcript.raw || '').trim();
    /* 너무 짧으면 (50자 미만) 자동 파싱 보류 — 의도치 않은 짧은 문장에서 동작 방지 */
    if (raw.length < 50) return false;
    /* 이미 scenes 가 있으면 다시 안 함 (사용자가 명시적으로 "🪄 장면 분리" 버튼 눌러야 재파싱) */
    if ((p.scenes || []).length > 0) return false;
    if (typeof window.rmParseAndSplit === 'function') window.rmParseAndSplit();
    return true;
  }

  /* ════════════════════════════════════════════════
     액션 핸들러 (window 노출 — 기존 inline onclick 호환)
     ════════════════════════════════════════════════ */
  window.rmGotoStage      = function(id){ window.RM_CORE.setStage(id); _re(); };

  /* ── 소스 모드 선택 / 리셋 ── */
  window.rmSetSourceMode = function(modeId){
    var p = window.RM_CORE.project();
    /* 기존 소스 정보 유지 — 모드만 셋팅 (이미 입력된 url/file 이 있으면 그대로 둠) */
    p.source = p.source || {};
    p.source.type = modeId;
    window.RM_CORE.save();
    _re();
  };
  window.rmResetSource = function(){
    if (typeof window.RM_SOURCE.clearSource === 'function') window.RM_SOURCE.clearSource();
    var p = window.RM_CORE.project();
    p.source = p.source || {};
    p.source.type = '';
    window.RM_CORE.save();
    _re();
  };

  /* ── 영상 메타데이터 조회 (YouTube Data API v3) ── */
  window.rmFetchYoutubeMeta = async function(){
    var p = window.RM_CORE.project();
    if (!p.source || !p.source.videoId) {
      _setStatus('⚠️ 먼저 유튜브 링크를 입력하세요.', 'warn');
      return;
    }
    if (!window.RM_YT_META || typeof window.RM_YT_META.getYouTubeVideoMeta !== 'function') {
      _setStatus('❌ RM_YT_META 모듈 미로드', 'err');
      return;
    }
    if (!window.RM_YT_META.hasApiKey()) {
      _setStatus('⚠️ YouTube Data API v3 키 미설정 — 설정 → API 통합 설정 → 업로드·배포 에서 입력하세요.', 'warn');
      return;
    }
    _setStatus('🔄 영상 정보 조회 중...', 'loading');
    var r = await window.RM_YT_META.getYouTubeVideoMeta(p.source.youtubeUrl || p.source.videoId);
    if (!r.ok) {
      _setStatus('❌ ' + window.RM_YT_META.friendlyMessage(r), 'err');
      return;
    }
    var pp = window.RM_CORE.project();
    pp.source = pp.source || {};
    pp.source.title = r.title || pp.source.title;
    pp.source.durationSec = r.durationSec || pp.source.durationSec;
    pp.source.youtubeMeta = {
      videoId:      r.videoId,
      title:        r.title,
      channelTitle: r.channelTitle,
      duration:     r.duration,
      durationSec:  r.durationSec,
      thumbnailUrl: r.thumbnailUrl,
      fetchedAt:    Date.now(),
    };
    window.RM_CORE.save();
    _setStatus('✅ 영상 정보: ' + (r.title || r.videoId) + ' · ' + (r.duration || '') +
      ' — 자막/대본은 붙여넣거나, 권한 있는 영상의 경우 OAuth 자막 가져오기를 사용하세요.', 'ok');
    _re();
  };

  /* ── 자동 자막 안내 (OAuth 필요) ── */
  window.rmAutoCaptionInfo = function(){
    _setStatus('🔐 자동 자막 가져오기는 OAuth 권한이 필요합니다. ' +
      '서버 자동 가져오기 모드에서 Google 로그인 후 시도하거나, 자막/대본을 직접 붙여넣어 주세요.', 'warn');
    _focusPasteTextarea();
  };

  /* ── OAuth 자막 가져오기 (서버 OAuth 토큰 보유 시) ──
       권한 없는 영상에서는 401/403 — 그 경우 명확히 안내 */
  window.rmFetchOAuthCaption = async function(){
    var p = window.RM_CORE.project();
    if (!p.source || !p.source.videoId) {
      _setStatus('⚠️ 유튜브 링크가 없습니다.', 'warn');
      return;
    }
    if (!window.RM_YT_META) { _setStatus('❌ RM_YT_META 모듈 미로드', 'err'); return; }
    var lst = await window.RM_YT_META.listYouTubeCaptions(p.source.videoId);
    if (!lst.ok) {
      var err = lst.error || '';
      if (err === 'NO_TOKEN' || err === 'OAUTH_NOT_CONFIGURED') {
        _setStatus('🔐 ' + window.RM_YT_META.friendlyMessage(lst), 'warn');
        return;
      }
      if ((lst.httpStatus === 401) || (lst.httpStatus === 403) || /401|403|forbidden|permission/i.test(err)) {
        _setStatus('❌ 이 영상의 자막을 가져올 권한이 없습니다. 본인 영상 또는 자막 접근 권한이 있는 영상만 가능합니다.', 'err');
        _focusPasteTextarea();
        return;
      }
      _setStatus('❌ 자막 목록 조회 실패: ' + window.RM_YT_META.friendlyMessage(lst), 'err');
      return;
    }
    var caps = lst.captions || [];
    if (!caps.length) {
      _setStatus('⚠️ 이 영상에 가져올 수 있는 자막 트랙이 없습니다. 자막을 직접 붙여넣어 주세요.', 'warn');
      _focusPasteTextarea();
      return;
    }
    var pick = caps.find(function(c){ return c.language === 'ko' || c.language === 'ja'; }) || caps[0];
    _setStatus('🔄 자막 다운로드 중... (' + (pick.language || '') + ')', 'loading');
    var d = await window.RM_YT_META.downloadYouTubeCaption(pick.id, 'srt');
    if (!d.ok) {
      _setStatus('❌ 자막 다운로드 실패: ' + window.RM_YT_META.friendlyMessage(d), 'err');
      return;
    }
    window.RM_CORE.setTranscriptRaw(d.text, 'srt');
    _setStatus('✅ 자막 가져옴 (' + (pick.language || '') + ') — "🪄 장면 분리" 를 누르거나 자동 분리를 기다리세요', 'ok');
    _re();
    setTimeout(function(){ _maybeAutoParse(); }, 100);
  };

  window.rmSetYoutubeUrl  = function(v){
    var prev = window.RM_CORE.project();
    var prevId = (prev.source && prev.source.videoId) || '';
    window.RM_SOURCE.setYoutubeUrl(v);
    var p = window.RM_CORE.project();
    /* URL 입력 시 모드 안 정해져 있으면 youtube 모드로 자동 셋팅 */
    if (!p.source.type && p.source.videoId) p.source.type = 'youtube';
    /* videoId 가 바뀌면 이전 메타 캐시 무효화 */
    if (p.source.videoId !== prevId && p.source.youtubeMeta) p.source.youtubeMeta = null;
    window.RM_CORE.save();
    _re();
  };
  window.rmLoadVideoFile  = function(ev){
    var f = ev && ev.target && ev.target.files && ev.target.files[0];
    if (!f) return;
    window.RM_SOURCE.loadMp4File(f, function(meta){
      /* MP4 업로드 → 자동으로 upload 모드 셋팅 */
      var p = window.RM_CORE.project();
      p.source.type = 'upload';
      window.RM_CORE.save();
      _setStatus('✅ MP4 로드 — ' + meta.fileName + ' (' + meta.durationSec + '초)', 'ok');
      try { ev.target.value = ''; } catch(_) {}
      _re();
    });
  };

  /* ── 리믹스 패키지 import (.json / .zip / .srt / .vtt / .txt) ── */
  window.rmPkgImport = async function(ev){
    var f = ev && ev.target && ev.target.files && ev.target.files[0];
    if (!f) return;
    if (!window.RM_PACKAGE) {
      _setStatus('❌ RM_PACKAGE 모듈 미로드', 'err');
      try { ev.target.value = ''; } catch(_){}
      return;
    }
    _setStatus('🔄 패키지 import 중... (' + f.name + ')', 'loading');
    var r = await window.RM_PACKAGE.importAuto(f);
    try { ev.target.value = ''; } catch(_){}
    if (!r.ok) {
      _setStatus('❌ import 실패 (' + (r.error || 'UNKNOWN') + ') — ' + (r.message || ''), 'err');
      return;
    }
    _setStatus('✅ 패키지 import 완료 — ' + r.sceneCount + ' 씬' +
      (r.hasFrames ? ' · 프레임 ' + r.hasFrames + ' 개' : '') +
      ' · source: ' + r.source, 'ok');
    _re();
  };

  window.rmLoadCaptionFile = function(ev){
    var f = ev && ev.target && ev.target.files && ev.target.files[0];
    if (!f) return;
    window.RM_SOURCE.loadCaptionFile(f, function(d){
      window.RM_CORE.setTranscriptRaw(d.text, d.format);
      _setStatus('✅ 자막 파일 로드 — ' + d.fileName + ' ('+d.format+')', 'ok');
      try { ev.target.value = ''; } catch(_) {}
      _re();
      /* 자막 파일은 보통 충분히 긴 본문이므로 자동 파싱 시도 */
      setTimeout(_maybeAutoParse, 50);
    });
  };

  /* 서버 자동 가져오기 액션은 rm-server-ui.js 에 있음 — auto parse helper 만 노출 */
  window._rmMaybeAutoParse = _maybeAutoParse;

  /* ── MP4 frame capture (Scene 카드의 📷 버튼) ── */
  window.rmCaptureFrame = async function(idx) {
    var p = window.RM_CORE.project();
    if (!p.source || p.source.type !== 'upload') {
      _setStatus('⚠️ 프레임 캡처는 MP4 업로드 모드에서만 가능합니다.', 'warn');
      return;
    }
    var sc = (p.scenes || [])[idx];
    if (!sc) return;
    if (!window.RM_SOURCE || typeof window.RM_SOURCE.captureFrameAtSec !== 'function') {
      _setStatus('❌ 캡처 모듈 미로드', 'err');
      return;
    }
    _setStatus('📷 ' + (sc.startSec || 0) + '초 프레임 캡처 중...', 'loading');
    try {
      var midSec = ((sc.startSec || 0) + (sc.endSec || sc.startSec || 0)) / 2;
      var url = await window.RM_SOURCE.captureFrameAtSec(midSec);
      window.RM_CORE.patchScene(idx, { thumbnailUrl: url, frameUrl: url, previewStatus: 'ready' });
      _setStatus('✅ 씬 ' + sc.sceneNumber + ' 프레임 캡처 완료', 'ok');
    } catch(e) {
      _setStatus('❌ 캡처 실패: ' + (e && e.message || e), 'err');
    }
  };

  /* textarea oninput → state 갱신 + 디바운스 자동 분리 (입력/타이핑 케이스도 커버) */
  window.rmSetTranscriptRaw = function(v){
    window.RM_CORE.setTranscriptRaw(v);
    /* 타이핑 직후 800ms 동안 더 입력 없으면 자동 분리 시도. paste 와 blur 와 별도 타이머. */
    if (_typingTimer) clearTimeout(_typingTimer);
    _typingTimer = setTimeout(function(){ _typingTimer = null; _maybeAutoParse(); }, 800);
  };

  window.rmOnPaste = function(){
    if (_autoParseTimer) clearTimeout(_autoParseTimer);
    _autoParseTimer = setTimeout(function(){
      _autoParseTimer = null;
      _maybeAutoParse();
    }, 120);
  };
  window.rmOnPasteBlur = function(){
    if (_autoParseTimer) clearTimeout(_autoParseTimer);
    if (_typingTimer)    clearTimeout(_typingTimer);
    _autoParseTimer = null;
    _typingTimer    = null;
    _maybeAutoParse();
  };

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
})();
