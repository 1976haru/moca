/* ================================================
   modules/remix/rm-server-ui.js
   영상 리믹스 스튜디오 — 서버 자동 가져오기 모드 UI + 액션
   * rm-scene-board.js 가 _renderModeServer / rmSrv* 액션을 윈도우 namespace 로 사용.
   * 이 파일은 1000줄 제한 회피용 분리 — UI 와 핸들러 양쪽 모두 포함.
   ================================================ */
(function(){
  'use strict';

  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function _escAttr(s){ return String(s == null ? '' : s).replace(/"/g,'&quot;').replace(/'/g, "\\'"); }

  function _setStatus(text, kind) {
    var p = window.RM_CORE && window.RM_CORE.project();
    if (!p) return;
    p._status = text ? { text: text, kind: kind || 'init' } : null;
    window.RM_CORE.save();
    _re();
  }
  function _re() {
    if (window.RM_BOARD && typeof window.RM_BOARD.render === 'function') window.RM_BOARD.render();
  }

  /* ── 공개 자막 segments → scenes 변환 ──
       사용자 명세 schema 그대로 변환. 자동숏츠 핸드오프(rm-export.preflight) 와도 호환. */
  function _inferRole(i, total) {
    if (total <= 1) return 'body';
    if (i === 0) return 'intro';
    if (i === total - 1) return 'outro';
    return 'body';
  }
  function _fmtTime(sec) {
    var s = Math.max(0, Math.round(sec || 0));
    var m = Math.floor(s / 60); var ss = s % 60;
    return m + ':' + (ss < 10 ? '0' + ss : ss);
  }
  function _segmentsToScenes(segments) {
    var arr = Array.isArray(segments) ? segments : [];
    var n = arr.length;
    return arr.map(function(seg, i){
      var start = +seg.startSec || 0;
      var end   = +seg.endSec   || (start + 4);
      var text  = String(seg.text || '').trim();
      return {
        id:                'rm_' + String(i + 1).padStart(3, '0'),
        sceneIndex:        i,
        sceneNumber:       i + 1,
        startSec:          start,
        endSec:            end,
        timeRange:         _fmtTime(start) + '–' + _fmtTime(end),
        originalCaption:   text,
        editedCaption:     text,
        captionKo:         text,
        captionJa:         '',
        captionBoth:       '',
        selected:          true,
        deleted:           false,
        role:              _inferRole(i, n),
        roleLabel:         '',
        notes:             '',
        visualDescription: '',
        thumbnailUrl:      '',
        frameUrl:          '',
        previewStatus:     '',
        source:            'youtube_public_caption',
        sourceType:        'video_remix_studio',
      };
    });
  }
  /* 모듈 내·외부에서 모두 호출 가능하도록 헬퍼 노출 */
  window._rmSegmentsToScenes = _segmentsToScenes;

  /* ── 서버 자동 가져오기 모드 렌더 ── */
  window._rmRenderModeServer = function(p) {
    var SC = window.RM_SERVER;
    var base   = SC ? SC.getBaseUrl() : '';
    var hasTok = SC && !!SC.getToken();
    var health = (p && p._serverHealth) || null;
    var feats  = (health && health.features) || {};

    return '<div class="rm-server-box">' +
      '<div class="rm-server-hd">☁️ 서버 자동 가져오기</div>' +
      '<div class="rm-server-row">' +
        '<label class="rm-server-lbl">API 서버 주소</label>' +
        '<input type="url" class="rm-inp" placeholder="https://your-remix-api.example.com" '+
          'value="'+_escAttr(base)+'" oninput="rmSrvSetBase(this.value)" id="rm-srv-base">' +
        '<button type="button" class="rm-tb-btn" onclick="rmSrvHealth()">🔄 연결 테스트</button>' +
      '</div>' +
      (health
        ? '<div class="rm-server-status '+(health.ok?'ok':'err')+'">' +
            (health.ok
              ? '✅ ' + _esc(health.service || 'connected') + ' · 모드: ' + _esc(health.transcribeMode || 'stub') + ' · ' + _esc(health.time || '')
              : '❌ ' + _esc(health.error || 'FAIL') + ' — ' + _esc(health.message || '연결 실패'))
          + '</div>' +
          (health.ok
            ? '<div class="rm-feat-row">' +
                _featPill('🔗 YouTube 메타',         feats.youtubeMeta) +
                _featPill('🔐 OAuth 자막',           feats.youtubeCaptionsOAuth) +
                _featPill('🎤 MP4 음성 인식',        feats.mp4Transcribe) +
                _featPill('✨ Whisper (실 인식)',     feats.mp4TranscribeReal) +
                _featPill('🖼 프레임 추출',          feats.keyframes) +
              '</div>' +
              _renderServerActions(p, feats, hasTok)
            : '')
        : '<div class="rm-server-hint">아직 연결 테스트를 하지 않았습니다. "🔄 연결 테스트" 를 누르세요.</div>') +
      '<details class="rm-server-help"><summary>📖 서버 셋업 안내</summary>' +
        '<div style="font-size:11px;line-height:1.7;margin-top:6px">' +
          '이 레포의 <code>server/</code> 폴더에 Node/Express 서버 코드가 있습니다. ' +
          'Render/Railway/Vercel/Fly.io 에 배포 후 위 주소창에 URL 을 입력하세요. ' +
          '<br>주요 엔드포인트:<br>' +
          '<code>GET /api/health</code> — 사용 가능 기능 표시<br>' +
          '<code>GET /api/youtube/meta?url=</code> — oEmbed 기반 메타<br>' +
          '<code>GET /api/youtube/oauth/start</code> — Google OAuth (GOOGLE_CLIENT_ID 필요)<br>' +
          '<code>GET /api/youtube/captions/list</code> — 권한 있는 영상의 자막 목록<br>' +
          '<code>POST /api/remix/transcribe</code> — MP4 → 자막 (OPENAI_API_KEY 없으면 stub)<br>' +
          '<code>POST /api/remix/keyframes</code> — ffmpeg 프레임 추출 (ffmpeg-static 포함)<br>' +
          '<small>자세한 설정은 <code>server/README.md</code> 참고</small>' +
        '</div>' +
      '</details>' +
      '<button type="button" class="rm-tb-btn" onclick="rmResetSource()" style="margin-top:8px">← 다른 모드 선택</button>' +
    '</div>';
  };

  function _featPill(label, on) {
    return '<span class="rm-feat-pill '+(on?'on':'off')+'">'+_esc(label)+(on?'':' ✗')+'</span>';
  }
  function _renderServerActions(p, feats, hasTok) {
    var src = p.source || {};
    var hasUrl = !!(src.videoId);
    return '<div class="rm-server-actions">' +
      '<div class="rm-server-action">' +
        '<b>🔗 YouTube 메타 + 자막 가져오기</b><br>' +
        '<input type="url" class="rm-inp" placeholder="유튜브 링크" '+
          'value="'+_escAttr(src.youtubeUrl||'')+'" oninput="rmSetYoutubeUrl(this.value)">' +
        '<div class="rm-server-action-row">' +
          '<button type="button" class="rm-mini" onclick="rmSrvFetchMeta()">📋 메타 조회</button>' +
          /* A. 공개 자막 가져오기 (실험 기능, 보조 추출) */
          (feats.youtubePublicTranscript
            ? '<button type="button" class="rm-mini" onclick="rmSrvPublicTranscript()" '+(hasUrl?'':'disabled')+
                ' title="공개 자막 트랙이 열려있는 영상만 가능 — 실패할 수 있습니다">📥 공개 자막 가져오기 시도</button>'
            : '') +
          /* B. OAuth 자막 (본인/권한 영상) */
          (feats.youtubeCaptionsOAuth
            ? (hasTok
              ? '<button class="rm-mini ok" onclick="rmSrvCaptionsList()">🔐 OAuth 자막 (로그인됨)</button> ' +
                '<button class="rm-mini" onclick="rmSrvOAuthLogout()">로그아웃</button>'
              : '<button class="rm-mini" onclick="rmSrvOAuthStart()">🔐 Google 로그인 (OAuth 자막)</button>')
            : '<small style="color:#92400e">OAuth 미설정 (서버 GOOGLE_CLIENT_ID 필요)</small>') +
        '</div>' +
        '<small style="color:#7b6080;line-height:1.55">' +
          '🅰 공개 자막 가져오기는 실패할 수 있는 <b>보조(실험) 기능</b>입니다. ' +
          '🅱 정확하고 안정적인 자막은 <b>본인 영상 OAuth</b> 또는 <b>MP4 STT</b> 를 사용하세요.' +
        '</small>' +
      '</div>' +
      '<div class="rm-server-action">' +
        '<b>📁 MP4 자동 자막 + 프레임</b><br>' +
        '<label class="rm-tb-btn rm-file rm-file-pri">' +
          '<input type="file" accept="video/mp4,video/webm,video/quicktime" onchange="rmSrvUploadAndProcess(event)"> ' +
          '📁 파일 업로드 → 자동 처리' +
        '</label>' +
        '<small>업로드한 영상의 음성을 자동 인식하고 scene 별 프레임을 추출합니다. ' +
          '본인 권한 영상만 업로드하세요.</small>' +
      '</div>' +
    '</div>';
  }

  /* ════════════════════════════════════════════════
     액션 핸들러
     ════════════════════════════════════════════════ */
  window.rmSrvSetBase = function(v){
    if (window.RM_SERVER) window.RM_SERVER.setBaseUrl(v || '');
  };
  window.rmSrvHealth = async function(){
    if (!window.RM_SERVER) { _setStatus('❌ RM_SERVER 모듈 미로드', 'err'); return; }
    if (!window.RM_SERVER.getBaseUrl()) {
      _setStatus('⚠️ 서버 주소를 먼저 입력하세요.', 'warn'); return;
    }
    _setStatus('🔄 서버 연결 테스트 중...', 'loading');
    var r = await window.RM_SERVER.health();
    var p = window.RM_CORE.project();
    p._serverHealth = r;
    window.RM_CORE.save();
    if (r.ok) _setStatus('✅ 서버 연결 — ' + (r.service || 'OK') + ' · 모드: ' + (r.transcribeMode || 'stub'), 'ok');
    else _setStatus('❌ 연결 실패 — ' + window.RM_SERVER.friendlyMessage(r), 'err');
  };
  window.rmSrvFetchMeta = async function(){
    if (!window.RM_SERVER) return;
    var p = window.RM_CORE.project();
    var url = (p.source && p.source.youtubeUrl) || '';
    if (!url) { _setStatus('⚠️ 유튜브 링크를 입력하세요.', 'warn'); return; }
    _setStatus('🔄 메타 조회 중...', 'loading');
    var r = await window.RM_SERVER.youtubeMeta(url);
    if (r.ok) {
      window.RM_SOURCE.setYoutubeUrl(url);
      var pp = window.RM_CORE.project();
      pp.source.title = r.title || pp.source.title;
      window.RM_CORE.save();
      _setStatus('✅ 메타: ' + (r.title || r.videoId), 'ok');
      _re();
    } else {
      _setStatus('❌ ' + window.RM_SERVER.friendlyMessage(r), 'err');
    }
  };
  /* ── 공개 자막 가져오기 시도 (실험 기능) ──
       성공 시 segments → scenes 로 변환해 RM_CORE 에 저장.
       실패 시 명확한 에러 메시지 + textarea focus 유도. */
  window.rmSrvPublicTranscript = async function(){
    if (!window.RM_SERVER) { _setStatus('❌ RM_SERVER 모듈 미로드', 'err'); return; }
    if (!window.RM_SERVER.getBaseUrl()) {
      _setStatus('⚠️ 서버 자동 가져오기를 사용하려면 API 서버 주소를 먼저 입력하고 "🔄 연결 테스트" 를 통과시키세요.', 'warn');
      return;
    }
    var p = window.RM_CORE.project();
    var url = (p.source && p.source.youtubeUrl) || '';
    if (!url) { _setStatus('⚠️ 유튜브 링크를 먼저 입력하세요.', 'warn'); return; }

    _setStatus('🔄 공개 자막 가져오기 시도 중... (실험 기능 — 영상별로 실패할 수 있습니다)', 'loading');
    var r = await window.RM_SERVER.publicTranscript(url);
    if (!r.ok) {
      var msg = window.RM_SERVER.friendlyMessage(r);
      _setStatus('⚠️ 공개 자막을 자동으로 가져오지 못했습니다 — ' + msg +
        ' · 자막/대본 붙여넣기, SRT 업로드, MP4 업로드 STT 중 하나를 사용하세요.', 'warn');
      var ta = document.getElementById('rm-paste-ta');
      if (ta) {
        try {
          ta.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(function(){ try { ta.focus(); } catch(_){} }, 180);
        } catch(_){}
      }
      return;
    }
    var segs = Array.isArray(r.segments) ? r.segments : [];
    if (!segs.length) {
      _setStatus('⚠️ 자막을 받았지만 비어있습니다. 자막을 직접 붙여넣어 주세요.', 'warn');
      return;
    }
    /* raw 텍스트도 저장 — 사용자가 textarea 에서 확인/수정 가능 */
    var rawLines = segs.map(function(s){
      var ms = Math.floor(s.startSec || 0);
      var m = Math.floor(ms / 60); var ss = ms % 60;
      return m + ':' + (ss < 10 ? '0' + ss : ss) + ' ' + (s.text || '');
    }).join('\n');
    window.RM_CORE.setTranscriptRaw(rawLines, 'timestamp');

    var scenes = _segmentsToScenes(segs);
    window.RM_CORE.setScenes(scenes);
    window.RM_CORE.setStage('scenes');
    var pp = window.RM_CORE.project();
    pp._active = 0;
    window.RM_CORE.save();

    var auto = r.isAutoGenerated ? ' (자동 생성 자막)' : '';
    _setStatus('✅ 공개 자막에서 ' + segs.length + '개 구간을 가져왔어요' + auto +
      ' · 언어: ' + (r.language || '?') + ' — Scene 보드에서 편집·번역하세요.', 'ok');
    _re();
  };

  window.rmSrvOAuthStart = function(){
    if (!window.RM_SERVER) return;
    var url = window.RM_SERVER.oauthStartUrl();
    if (!url) { _setStatus('⚠️ 서버 주소 미설정', 'warn'); return; }
    var pop = window.open(url, 'moca-yt-oauth', 'width=500,height=620');
    if (!pop) { _setStatus('❌ 팝업 차단 — 브라우저 팝업을 허용해 주세요', 'err'); return; }
    window.RM_SERVER.listenForOAuthToken(60000).then(function(){
      _setStatus('✅ Google 로그인 완료', 'ok'); _re();
    }, function(e){
      _setStatus('❌ OAuth 실패: ' + (e && e.message || 'unknown'), 'err');
    });
  };
  window.rmSrvOAuthLogout = function(){
    if (window.RM_SERVER) window.RM_SERVER.clearToken();
    _setStatus('로그아웃 — 토큰 삭제됨', 'init');
    _re();
  };
  window.rmSrvCaptionsList = async function(){
    if (!window.RM_SERVER) return;
    var p = window.RM_CORE.project();
    var vid = p.source && p.source.videoId;
    if (!vid) { _setStatus('⚠️ 유튜브 링크의 videoId 를 먼저 추출하세요.', 'warn'); return; }
    _setStatus('🔄 자막 목록 조회 중...', 'loading');
    var r = await window.RM_SERVER.captionsList(vid);
    if (!r.ok) { _setStatus('❌ ' + window.RM_SERVER.friendlyMessage(r), 'err'); return; }
    if (!r.captions || !r.captions.length) {
      _setStatus('⚠️ 이 영상에 자막 트랙이 없습니다.', 'warn'); return;
    }
    var pick = r.captions.find(function(c){ return c.language === 'ko' || c.language === 'ja'; }) || r.captions[0];
    _setStatus('🔄 자막 다운로드 중... (' + pick.language + ')', 'loading');
    var d = await window.RM_SERVER.captionsDownload(pick.id, 'srt');
    if (!d.ok) { _setStatus('❌ ' + window.RM_SERVER.friendlyMessage(d), 'err'); return; }
    window.RM_CORE.setTranscriptRaw(d.text, 'srt');
    _setStatus('✅ 자막 가져옴 — "🪄 장면 분리" 를 누르거나 자동 분리를 기다리세요', 'ok');
    _re();
    setTimeout(function(){
      if (typeof window._rmMaybeAutoParse === 'function') window._rmMaybeAutoParse();
      else if (typeof window.rmParseAndSplit === 'function') window.rmParseAndSplit();
    }, 100);
  };
  window.rmSrvUploadAndProcess = async function(ev){
    var f = ev && ev.target && ev.target.files && ev.target.files[0];
    if (!f) return;
    if (!window.RM_SERVER) { _setStatus('❌ RM_SERVER 모듈 미로드', 'err'); return; }
    if (!window.RM_SERVER.getBaseUrl()) {
      _setStatus('⚠️ 서버 주소를 먼저 입력하고 "🔄 연결 테스트" 를 통과시키세요.', 'warn');
      try { ev.target.value = ''; } catch(_){}
      return;
    }
    _setStatus('🔄 MP4 업로드 + 음성 인식 중... (네트워크 상태에 따라 수십 초 소요)', 'loading');
    var t = await window.RM_SERVER.transcribe(f, { language: 'ko' });
    if (!t.ok) {
      _setStatus('❌ ' + window.RM_SERVER.friendlyMessage(t), 'err');
      try { ev.target.value = ''; } catch(_){}
      return;
    }
    var segs = t.segments || [];
    if (!segs.length) { _setStatus('⚠️ 인식된 자막이 없습니다.', 'warn'); return; }
    var raw = segs.map(function(s){
      var ms = Math.floor(s.startSec || 0);
      var m = Math.floor(ms/60); var ss = ms%60;
      return m+':'+(ss<10?'0'+ss:ss)+' '+(s.text||'');
    }).join('\n');
    window.RM_CORE.setTranscriptRaw(raw, 'timestamp');
    var pr = window.RM_PARSER.parseAndSplit(raw, {});
    if (!pr.scenes.length) { _setStatus('⚠️ scene 분리 결과가 비었습니다.', 'warn'); return; }
    var blobUrl = URL.createObjectURL(f);
    window.RM_CORE.setSource({
      type: 'upload', fileName: f.name, fileBlobUrl: blobUrl,
      durationSec: t.durationSec || 0, title: f.name,
      youtubeUrl: '', videoId: '',
    });
    window.RM_CORE.setScenes(pr.scenes);
    window.RM_CORE.setStage('scenes');
    var pp = window.RM_CORE.project();
    pp._active = 0;
    window.RM_CORE.save();
    _setStatus('✅ 자막 ' + segs.length + ' segments → ' + pr.scenes.length + ' 씬 생성 — 프레임 추출 진행', 'loading');
    _re();
    var k = await window.RM_SERVER.keyframes(f, pr.scenes);
    if (k.ok && Array.isArray(k.frames)) {
      var ppp = window.RM_CORE.project();
      k.frames.forEach(function(fr){
        var idx = fr.sceneIndex;
        if (ppp.scenes[idx] && fr.imageUrl) {
          ppp.scenes[idx].thumbnailUrl = fr.imageUrl;
          ppp.scenes[idx].previewStatus = 'ready';
        }
      });
      window.RM_CORE.save();
      _setStatus('✅ 자동 처리 완료 — 자막 ' + pr.scenes.length + ' 씬 + 프레임 ' +
        k.frames.filter(function(f){return f.imageUrl;}).length + ' 개', 'ok');
    } else {
      _setStatus('✅ 자막 ' + pr.scenes.length + ' 씬 — ⚠️ 프레임 추출 실패: ' + window.RM_SERVER.friendlyMessage(k), 'warn');
    }
    try { ev.target.value = ''; } catch(_){}
    _re();
  };
})();
