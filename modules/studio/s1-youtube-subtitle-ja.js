/* ================================================
   modules/studio/s1-youtube-subtitle-ja.js
   유튜브 리믹스 보드 — 자막만 일본어로 바꾸기 테스트 모드
   * Toggle: YRX_STATE.jaTestMode = true 일 때 board 가 이 패널을 호출
   * 기능:
     - 좌(원본) / 우(일본어) 2 컬럼 비교 보드
     - 씬별 체크박스 + "이 씬만 다시 번역 / 더 짧게 / 자연스럽게 / 시니어"
     - 전체 일본어 자막 생성 / 선택 씬만 일본어 자막 생성
     - 일본어 자막 전체 복사 / SRT 다운로드 / TXT 다운로드 / Step 2 송신
   * 의존: YT_REMIX_ADAPTER.translateCaption · YT_BRIDGE.bridgeToStep2
   * 자동 자막은 시도만 하고, 실패 시 "수동 붙여넣기" 안내 명시
   * 영상 다운로드/원본 파일 저장 금지 — iframe 미리보기만
   ================================================ */
(function(){
  'use strict';

  function _state() { return window.YRX_STATE; }
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

  /* ════════════════════════════════════════════════
     메인 패널 렌더 — board 가 jaTestMode 일 때 호출
     ════════════════════════════════════════════════ */
  window._s1RenderJaTestPanel = function() {
    _injectCSS();
    var YRX = _state();
    if (!YRX) return '';
    var scenes = YRX.detectedScenes || [];
    var hasScenes = scenes.length > 0;

    return '' +
    '<div class="yjat-wrap">' +
      _renderHeader(YRX, scenes) +
      (hasScenes ? _renderCompareBoard(YRX, scenes) : _renderEmpty(YRX)) +
      (hasScenes ? _renderActionBar(YRX, scenes) : '') +
      _renderFollowupHint() +
    '</div>';
  };

  function _renderHeader(YRX, scenes) {
    var visible = scenes.filter(function(sc){ return !sc.deleted; });
    var selected = visible.filter(function(sc){ return sc.selected !== false; });
    var jaCount = visible.filter(function(sc){
      return String(((YRX.adaptedScenes||[])[sc.sceneIndex] || {}).captionJa || sc.captionJa || '').trim().length > 0;
    }).length;
    return '<div class="yjat-hd">' +
      '<div class="yjat-title">🇯🇵 자막만 일본어로 바꾸기 테스트 모드</div>' +
      '<div class="yjat-meta">총 '+visible.length+' 씬 · 선택 '+selected.length+' · 일본어 생성 '+jaCount+'</div>' +
      '<div class="yjat-hd-actions">' +
        '<label class="yjat-chk"><input type="checkbox" '+(YRX.jaSeniorTone!==false?'checked':'')+
          ' onchange="yrxJaTestToggleSenior()"> 시니어 친화 톤</label>' +
        '<button type="button" class="yjat-btn" onclick="yrxJaTestExit()">← 일반 보드로</button>' +
      '</div>' +
    '</div>';
  }

  function _renderEmpty(YRX) {
    return '<div class="yjat-empty">' +
      '<b>📋 먼저 자막/대본을 가져와 주세요.</b><br>' +
      '상단 보드의 "🪄 가져오기 / 장면 분리" 를 누르거나, 자막을 직접 붙여넣어 장면을 만든 뒤 이 모드를 다시 켜세요.<br>' +
      '<small>유튜브 자동 자막은 브라우저 보안 정책(CORS) + 권한 문제로 실패할 수 있습니다. 자막/대본을 붙여넣으면 동일하게 장면 분리와 일본어 자막 변환이 동작합니다.</small>' +
    '</div>';
  }

  /* ── 좌(원본) / 우(일본어) 비교 보드 ── */
  function _renderCompareBoard(YRX, scenes) {
    var ad = YRX.adaptedScenes || [];
    return '<div class="yjat-board">' +
      scenes.map(function(sc, i){
        if (sc.deleted) return '';
        var a = ad[i] || {};
        var captionJa = a.captionJa || sc.captionJa || sc.translatedJa || '';
        var orig = sc.originalText || sc.original || '';
        var sel  = sc.selected !== false;
        var busy = !!(YRX.sceneBusy && YRX.sceneBusy[i]);
        return '<div class="yjat-row">' +
          /* 좌 — 원본 */
          '<div class="yjat-col left">' +
            '<div class="yjat-row-hd">' +
              '<label class="yjat-chk"><input type="checkbox" '+(sel?'checked':'')+
                ' onchange="yrxJaTestToggleSel('+i+')"> ' +
                '<b>씬 '+sc.sceneNumber+'</b></label>' +
              (sc.timeRange ? '<span class="yjat-time">'+_esc(sc.timeRange)+'</span>' : '') +
              (sc.roleLabel ? '<span class="yjat-role">'+_esc(sc.roleLabel)+'</span>' : '') +
              (sc.startSec != null && YRX.videoId
                ? '<button type="button" class="yjat-jump" onclick="yrxJumpTo('+(sc.startSec||0)+')" title="이 시점부터 영상 보기">▶ '+_esc(_fmtSec(sc.startSec))+'</button>'
                : '') +
            '</div>' +
            '<div class="yjat-orig">'+_esc(orig || '(빈 자막)')+'</div>' +
          '</div>' +
          /* 우 — 일본어 */
          '<div class="yjat-col right">' +
            '<div class="yjat-row-hd"><span class="yjat-ja-label">日本語 字幕</span></div>' +
            '<textarea class="yjat-ja-ta" rows="2" placeholder="자연스러운 일본어 쇼츠 자막 — 비어있으면 \'이 씬만 다시 번역\' 또는 전체 생성 사용" ' +
              'oninput="yrxJaTestEdit('+i+',this.value)">'+_esc(captionJa)+'</textarea>' +
            '<div class="yjat-row-actions">' +
              '<button type="button" class="yjat-mini" '+(busy?'disabled':'')+' onclick="yrxJaTestRetranslate('+i+')">↻ 이 씬만 다시 번역</button>' +
              '<button type="button" class="yjat-mini" '+(busy?'disabled':'')+' onclick="yrxJaTestVariant('+i+',\'shorter\')">⏬ 더 짧게</button>' +
              '<button type="button" class="yjat-mini" '+(busy?'disabled':'')+' onclick="yrxJaTestVariant('+i+',\'natural\')">💆 더 자연스럽게</button>' +
              '<button type="button" class="yjat-mini" '+(busy?'disabled':'')+' onclick="yrxJaTestVariant('+i+',\'senior\')">👴 시니어 친화</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  function _renderActionBar(YRX, scenes) {
    var busy = !!YRX.busy;
    return '<div class="yjat-actionbar">' +
      '<button type="button" class="yjat-btn pri" '+(busy?'disabled':'')+
        ' onclick="yrxJaTestTranslateAll()">🇯🇵 전체 일본어 자막 생성</button>' +
      '<button type="button" class="yjat-btn" '+(busy?'disabled':'')+
        ' onclick="yrxJaTestTranslateSelected()">🇯🇵 선택 씬만 일본어 자막 생성</button>' +
      '<span class="yjat-sep"></span>' +
      '<button type="button" class="yjat-btn" onclick="yrxJaTestCopyAll()">📋 일본어 자막 전체 복사</button>' +
      '<button type="button" class="yjat-btn" onclick="yrxJaTestDownloadSrt()">📄 SRT 다운로드</button>' +
      '<button type="button" class="yjat-btn" onclick="yrxJaTestDownloadTxt()">📄 TXT 다운로드</button>' +
      '<span class="yjat-sep"></span>' +
      '<button type="button" class="yjat-btn pri" onclick="yrxJaTestSendToStep2()">→ Step 2 로 보내기</button>' +
    '</div>';
  }

  function _renderFollowupHint() {
    return '<details class="yjat-followup">' +
      '<summary>📚 후속 기능 (이번 PR 미포함)</summary>' +
      '<ul>' +
        '<li>내 유튜브 영상 OAuth 자막 자동 가져오기 — YouTube Data API + OAuth 토큰 필요</li>' +
        '<li>서버 proxy 기반 자막/프레임 자동 처리 — Cloudflare Worker / Node serverless</li>' +
        '<li>직접 업로드한 MP4 의 프레임 추출 — ffmpeg.wasm 또는 서버 사이드 ffmpeg</li>' +
      '</ul>' +
      '<small>현재는 iframe 미리보기 + 사용자가 붙여넣은 자막/대본 기반으로 동작합니다.</small>' +
    '</details>';
  }

  /* ════════════════════════════════════════════════
     액션
     ════════════════════════════════════════════════ */
  window.yrxJaTestEnter = function() {
    var YRX = _state(); if (!YRX) return;
    YRX.jaTestMode = true;
    if (YRX.jaSeniorTone == null) YRX.jaSeniorTone = !!YRX.seniorTone;
    _save(); _refresh();
  };
  window.yrxJaTestExit = function() {
    var YRX = _state(); if (!YRX) return;
    YRX.jaTestMode = false;
    _save(); _refresh();
  };
  window.yrxJaTestToggleSenior = function() {
    var YRX = _state(); if (!YRX) return;
    YRX.jaSeniorTone = !YRX.jaSeniorTone;
    _save(); _refresh();
  };
  window.yrxJaTestToggleSel = function(idx) {
    var YRX = _state(); if (!YRX) return;
    var sc = (YRX.detectedScenes || [])[idx];
    if (!sc) return;
    sc.selected = sc.selected === false ? true : false;
    _save(); _refresh();
  };

  /* 사용자 직접 편집 — captionJa 만 갱신 (adaptedScenes 자동 시드) */
  window.yrxJaTestEdit = function(idx, val) {
    var YRX = _state(); if (!YRX) return;
    var sc = (YRX.detectedScenes || [])[idx];
    if (sc) sc.captionJa = val; sc.translatedJa = val;
    if (typeof window.yrxAdaptEdit === 'function') {
      window.yrxAdaptEdit(idx, 'captionJa', val);
    } else {
      _save();
    }
  };

  /* 한 씬 다시 번역 — 원본 → 일본어 자막 */
  window.yrxJaTestRetranslate = async function(idx) {
    var YRX = _state(); if (!YRX) return;
    var sc = (YRX.detectedScenes || [])[idx];
    if (!sc) return;
    var src = sc.originalText || sc.original || '';
    if (!src.trim()) { _toast('⚠️ 빈 자막 — 번역할 원본이 없습니다.', 'warn'); return; }
    var ad = window.YT_REMIX_ADAPTER;
    if (!ad || typeof ad.translateCaption !== 'function') {
      _toast('❌ 번역 어댑터 미로드 — YT_REMIX_ADAPTER 필요', 'error');
      return;
    }
    YRX.sceneBusy = YRX.sceneBusy || {};
    YRX.sceneBusy[idx] = true; _refresh();
    try {
      var ja = await ad.translateCaption(src, 'ja', {
        seniorTone: !!YRX.jaSeniorTone,
        context: YRX.title || YRX.newTopic || '',
      });
      if (ja) {
        sc.captionJa = ja; sc.translatedJa = ja;
        if (typeof window.yrxAdaptEdit === 'function') window.yrxAdaptEdit(idx, 'captionJa', ja);
        _toast('✅ 씬 ' + (idx+1) + ' 일본어 자막 생성', 'success');
      } else {
        _toast('⚠️ 번역 결과가 비어있습니다.', 'warn');
      }
    } catch(e) {
      _toast('❌ 번역 실패: ' + ((e && e.message) || e), 'error');
    }
    YRX.sceneBusy[idx] = false; _save(); _refresh();
  };

  /* 변형 — 더 짧게 / 자연스럽게 / 시니어 톤 */
  window.yrxJaTestVariant = async function(idx, variant) {
    var YRX = _state(); if (!YRX) return;
    var sc = (YRX.detectedScenes || [])[idx];
    if (!sc) return;
    var ad = window.YT_REMIX_ADAPTER;
    if (!ad || typeof ad.adaptSceneTone !== 'function') {
      _toast('❌ 톤 변형 어댑터 미로드', 'error');
      return;
    }
    YRX.sceneBusy = YRX.sceneBusy || {};
    YRX.sceneBusy[idx] = true; _refresh();
    try {
      /* 일본어 자막을 시드로 사용 — 없으면 원본 */
      var seedJa = sc.captionJa || sc.translatedJa || '';
      var sceneSeed = Object.assign({}, sc, {
        adaptedNarration: seedJa || sc.originalText || sc.original || '',
      });
      var v = (variant === 'natural' || variant === 'shorter') ? variant
            : (variant === 'senior' ? 'senior' : 'natural');
      var next = await ad.adaptSceneTone(sceneSeed, v, { newTopic: YRX.newTopic || '', role: sc.roleLabel });
      var newJa = (next && (next.captionJa || next.adaptedNarration)) || '';
      /* senior/natural/shorter 변형 결과를 다시 ja 로 번역 (일본어 자체 변형이 안 됐을 수도 있음) */
      if (newJa) {
        var finalJa = await ad.translateCaption(newJa, 'ja', { seniorTone: !!YRX.jaSeniorTone });
        if (finalJa) newJa = finalJa;
        sc.captionJa = newJa; sc.translatedJa = newJa;
        if (typeof window.yrxAdaptEdit === 'function') window.yrxAdaptEdit(idx, 'captionJa', newJa);
        _toast('✅ 씬 ' + (idx+1) + ' ' + variant + ' 적용', 'success');
      }
    } catch(e) {
      _toast('❌ 변형 실패: ' + ((e && e.message) || e), 'error');
    }
    YRX.sceneBusy[idx] = false; _save(); _refresh();
  };

  /* 전체 일본어 자막 생성 */
  window.yrxJaTestTranslateAll = async function() {
    var YRX = _state(); if (!YRX) return;
    if (YRX.busy) return;
    var scenes = (YRX.detectedScenes || []).filter(function(sc){ return !sc.deleted; });
    if (!scenes.length) { _toast('⚠️ 씬이 없습니다.', 'warn'); return; }
    await _translateBatch(scenes, '전체');
  };
  window.yrxJaTestTranslateSelected = async function() {
    var YRX = _state(); if (!YRX) return;
    if (YRX.busy) return;
    var scenes = (YRX.detectedScenes || []).filter(function(sc){ return !sc.deleted && sc.selected !== false; });
    if (!scenes.length) { _toast('⚠️ 선택된 씬이 없습니다.', 'warn'); return; }
    await _translateBatch(scenes, '선택 ' + scenes.length + '개');
  };
  async function _translateBatch(scenes, label) {
    var YRX = _state(); if (!YRX) return;
    var ad = window.YT_REMIX_ADAPTER;
    if (!ad || typeof ad.translateCaption !== 'function') {
      _toast('❌ 번역 어댑터 미로드', 'error');
      return;
    }
    YRX.busy = true; YRX.busyTag = 'ja-batch';
    YRX.status = '🇯🇵 ' + label + ' 일본어 자막 생성 중... (0/' + scenes.length + ')';
    _refresh();
    var ok = 0, fail = 0;
    for (var i = 0; i < scenes.length; i++) {
      var sc = scenes[i];
      var src = sc.originalText || sc.original || '';
      if (!src.trim()) continue;
      try {
        var ja = await ad.translateCaption(src, 'ja', {
          seniorTone: !!YRX.jaSeniorTone,
          context: YRX.title || YRX.newTopic || '',
        });
        if (ja) {
          sc.captionJa = ja; sc.translatedJa = ja;
          if (typeof window.yrxAdaptEdit === 'function') window.yrxAdaptEdit(sc.sceneIndex, 'captionJa', ja);
          ok++;
        } else {
          fail++;
        }
      } catch(_) { fail++; }
      YRX.status = '🇯🇵 ' + label + ' 일본어 자막 생성 중... (' + (i+1) + '/' + scenes.length + ')';
      _refresh();
    }
    YRX.busy = false; YRX.busyTag = '';
    YRX.status = '✅ 일본어 자막 생성 완료 — 성공 ' + ok + ' / 실패 ' + fail;
    _toast(YRX.status, ok ? 'success' : 'warn');
    _save(); _refresh();
  }

  /* 출력 — 복사 / SRT / TXT */
  window.yrxJaTestCopyAll = function() {
    var text = _collectJa();
    if (!text) { _toast('⚠️ 복사할 일본어 자막이 없습니다.', 'warn'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){
        _toast('📋 일본어 자막 ' + text.split('\n').filter(Boolean).length + '줄 복사됨', 'success');
      }, function(){ _fallbackCopy(text); });
    } else {
      _fallbackCopy(text);
    }
  };
  function _fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      _toast('📋 복사 완료', 'success');
    } catch(e) { _toast('❌ 복사 실패: ' + (e && e.message), 'error'); }
  }
  function _collectJa() {
    var YRX = _state(); if (!YRX) return '';
    var ad = YRX.adaptedScenes || [];
    return (YRX.detectedScenes || []).filter(function(sc){ return !sc.deleted; })
      .map(function(sc){
        var a = ad[sc.sceneIndex] || {};
        return (a.captionJa || sc.captionJa || sc.translatedJa || '').trim();
      }).filter(Boolean).join('\n');
  }
  function _collectScenesForExport() {
    var YRX = _state(); if (!YRX) return [];
    var ad = YRX.adaptedScenes || [];
    return (YRX.detectedScenes || []).filter(function(sc){ return !sc.deleted; })
      .map(function(sc){
        var a = ad[sc.sceneIndex] || {};
        return {
          startSec: sc.startSec || 0,
          endSec:   sc.endSec   || ((sc.startSec||0) + 4),
          ja:       (a.captionJa || sc.captionJa || sc.translatedJa || '').trim(),
        };
      });
  }

  window.yrxJaTestDownloadSrt = function() {
    var YRX = _state(); if (!YRX) return;
    var rows = _collectScenesForExport().filter(function(r){ return r.ja; });
    if (!rows.length) { _toast('⚠️ 일본어 자막이 없습니다 — 먼저 생성하세요.', 'warn'); return; }
    var srt = rows.map(function(r, i){
      return (i+1) + '\n' +
        _toSrtTime(r.startSec) + ' --> ' + _toSrtTime(r.endSec) + '\n' +
        r.ja + '\n';
    }).join('\n');
    _downloadFile('youtube-ja-' + (YRX.videoId || 'remix') + '.srt', srt, 'text/plain;charset=utf-8');
    _toast('💾 SRT ' + rows.length + ' 큐 다운로드', 'success');
  };
  window.yrxJaTestDownloadTxt = function() {
    var YRX = _state(); if (!YRX) return;
    var text = _collectJa();
    if (!text) { _toast('⚠️ 일본어 자막이 없습니다 — 먼저 생성하세요.', 'warn'); return; }
    _downloadFile('youtube-ja-' + (YRX.videoId || 'remix') + '.txt', text, 'text/plain;charset=utf-8');
    _toast('💾 TXT 다운로드', 'success');
  };
  function _toSrtTime(sec) {
    var s = Math.max(0, +sec || 0);
    var h = Math.floor(s/3600); s -= h*3600;
    var m = Math.floor(s/60);   s -= m*60;
    var ss = Math.floor(s);
    var ms = Math.round((s - ss) * 1000);
    return _pad(h,2)+':'+_pad(m,2)+':'+_pad(ss,2)+','+_pad(ms,3);
  }
  function _pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
  function _fmtSec(sec) {
    var s = Math.max(0, Math.round(sec || 0));
    var m = Math.floor(s/60); var ss = s%60;
    return m+':'+(ss<10?'0'+ss:ss);
  }
  function _downloadFile(name, content, mime) {
    var blob = new Blob([content], { type: mime || 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ try { URL.revokeObjectURL(url); document.body.removeChild(a); } catch(_){} }, 0);
  }

  /* Step 2 송신 — 명세 schema (narration: captionJa || originalText, captionJa, captionKo: originalCaption) */
  window.yrxJaTestSendToStep2 = function() {
    var YRX = _state(); if (!YRX) return;
    var ad = YRX.adaptedScenes || [];
    var scenes = (YRX.detectedScenes || []).filter(function(sc){ return !sc.deleted; });
    if (!scenes.length) { _toast('⚠️ 씬이 없습니다.', 'warn'); return; }

    /* bridge 스키마로 매핑 — 사용자 명세 7번 그대로 */
    var mapped = scenes.map(function(sc, i){
      var a = ad[sc.sceneIndex] || {};
      var captionJa = a.captionJa || sc.captionJa || sc.translatedJa || '';
      var orig = sc.originalText || sc.original || '';
      return Object.assign({}, sc, {
        sceneIndex: i,
        sceneNumber: i + 1,
        editedText: captionJa || orig,           /* 우선순위: ja → 원본 */
        translatedJa: captionJa,
        captionJa: captionJa,
        captionKo: orig,
        adaptedNarration: captionJa || orig,
        adaptedCaption: captionJa || orig,
        sourceType: 'youtube_subtitle_remix',
      });
    });

    if (window.YT_BRIDGE && typeof window.YT_BRIDGE.bridgeToStep2 === 'function') {
      var result = window.YT_BRIDGE.bridgeToStep2(mapped);
      YRX.bridgeResult = result;
      if (result.ok) {
        _toast('✅ Step 2 전달 성공 — 씬 ' + result.written.scenes + ' (source=youtube_subtitle_remix)', 'success');
        if (typeof window.studioGoto === 'function') {
          /* 즉시 이동하지 않고 사용자가 배너에서 이동 — bridge banner 가 board 상단에 노출 */
        }
      } else {
        _toast('❌ Step 2 전달 실패 — 패널 확인', 'error');
      }
    } else {
      _toast('❌ YT_BRIDGE 미로드', 'error');
    }
    _save(); _refresh();
  };

  /* ════════════════════════════════════════════════
     CSS
     ════════════════════════════════════════════════ */
  function _injectCSS() {
    if (document.getElementById('yjat-style')) return;
    var st = document.createElement('style');
    st.id = 'yjat-style';
    st.textContent = '' +
      '.yjat-wrap{display:flex;flex-direction:column;gap:8px}' +
      '.yjat-hd{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;' +
        'padding:8px 12px;background:linear-gradient(135deg,#fff5fa,#f5f0ff);border:1.5px solid #c7b3e5;border-radius:10px}' +
      '.yjat-title{font-weight:800;color:#5b1a4a;font-size:13px}' +
      '.yjat-meta{font-size:11px;color:#7b6080;font-weight:700}' +
      '.yjat-hd-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap}' +
      '.yjat-chk{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#5a4a56;cursor:pointer}' +
      '.yjat-chk input{accent-color:#9181ff}' +
      '.yjat-empty{padding:14px 16px;background:#fafafe;border:1px dashed #d6c7e0;border-radius:10px;' +
        'text-align:center;color:#5a4a56;font-size:12px;line-height:1.7}' +
      '.yjat-empty small{color:#9b8a93}' +
      '.yjat-board{display:flex;flex-direction:column;gap:6px}' +
      '.yjat-row{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#fff;' +
        'border:1.5px solid #f1dce7;border-radius:10px;padding:6px 8px;align-items:stretch}' +
      '@media(max-width:700px){.yjat-row{grid-template-columns:1fr}}' +
      '.yjat-col{display:flex;flex-direction:column;gap:4px}' +
      '.yjat-col.left{border-right:1px dashed #f1dce7;padding-right:6px}' +
      '@media(max-width:700px){.yjat-col.left{border-right:0;padding-right:0;border-bottom:1px dashed #f1dce7;padding-bottom:6px}}' +
      '.yjat-row-hd{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:11px;color:#5a4a56}' +
      '.yjat-time{color:#9b8a93;font-size:10.5px}' +
      '.yjat-role{padding:2px 7px;background:#f5f0ff;color:#5a4a8a;border-radius:5px;font-size:10px;font-weight:700}' +
      '.yjat-jump{padding:2px 7px;border:1px solid #d6c7e0;background:#fff;border-radius:5px;font-size:10px;font-weight:700;color:#5a4a8a;cursor:pointer;font-family:inherit}' +
      '.yjat-jump:hover{border-color:#9181ff;color:#9181ff}' +
      '.yjat-orig{padding:6px 8px;background:#fafafe;border:1px solid #f1dce7;border-radius:6px;' +
        'font-size:11.5px;color:#2b2430;line-height:1.5;word-break:break-word;flex:1}' +
      '.yjat-ja-label{font-weight:800;color:#2b66c4;font-size:10.5px}' +
      '.yjat-ja-ta{width:100%;box-sizing:border-box;border:1.5px solid #f1dce7;border-radius:6px;padding:6px 8px;' +
        'font-size:11.5px;font-family:inherit;line-height:1.5;resize:vertical;min-height:48px}' +
      '.yjat-ja-ta:focus{outline:none;border-color:#9181ff}' +
      '.yjat-row-actions{display:flex;flex-wrap:wrap;gap:4px}' +
      '.yjat-mini{padding:3px 8px;border:1px solid #f1dce7;background:#fff;border-radius:5px;' +
        'font-size:10.5px;font-weight:700;color:#5a4a56;cursor:pointer;font-family:inherit}' +
      '.yjat-mini:hover:not(:disabled){border-color:#9181ff;color:#9181ff}' +
      '.yjat-mini:disabled{opacity:.5;cursor:not-allowed}' +
      '.yjat-actionbar{display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:8px;' +
        'background:#fff;border:1.5px solid #f1dce7;border-radius:10px;position:sticky;bottom:0;z-index:3}' +
      '.yjat-btn{padding:7px 12px;border:1.5px solid #f1dce7;border-radius:8px;background:#fff;' +
        'font-size:11.5px;font-weight:700;color:#5a4a56;cursor:pointer;font-family:inherit}' +
      '.yjat-btn:hover:not(:disabled){border-color:#9181ff;color:#9181ff}' +
      '.yjat-btn:disabled{opacity:.5;cursor:not-allowed}' +
      '.yjat-btn.pri{border:none;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff}' +
      '.yjat-btn.pri:hover:not(:disabled){opacity:.92}' +
      '.yjat-sep{flex:0 0 1px;height:24px;background:#f1dce7;margin:0 4px}' +
      '.yjat-followup{padding:8px 12px;background:#fafafe;border:1px solid #d6c7e0;border-radius:10px;font-size:11px;color:#5a4a56;line-height:1.55}' +
      '.yjat-followup summary{cursor:pointer;font-weight:800;color:#5b1a4a}' +
      '.yjat-followup ul{margin:4px 0 0 18px;padding:0}' +
      '';
    document.head.appendChild(st);
  }
})();
