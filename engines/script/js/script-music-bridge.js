/* ================================================
   engines/script/js/script-music-bridge.js
   가사/음원 — 숏츠/미디어 엔진 연동
   * 호출자: script-music-tabs.js 의 "🎬 숏츠 만들기" / "🎵 음성·영상 패키지" 버튼
   * 전송 채널:
     ① localStorage (moca_script_handoff) — 항상
     ② query string (topic·script·lang·musicType) — URL 길이 한도 고려해 짧게
   ================================================ */
(function(){
  'use strict';

  const SHORTS_URL = '../shorts/index.html';
  const MEDIA_URL  = '../media/index.html';
  const HANDOFF_KEY= 'moca_script_handoff';

  /* ── 현재 서브탭의 본문 + 설정 수집 ── */
  function _collectPayload(sub) {
    const settings = (window._smGetSettings && window._smGetSettings()) || {};
    const raw      = (typeof window._smGetRawScript === 'function') ? window._smGetRawScript(sub) : '';
    const suno     = (window.SCRIPT_MUSIC_STATE && window.SCRIPT_MUSIC_STATE.suno) || null;
    const subLabel = (typeof window._smGetSubLabel === 'function') ? window._smGetSubLabel(sub) : sub;

    /* topic 추정 — Suno 제목 후보 우선, 없으면 본문 첫 줄 */
    let topic = '';
    if (suno && suno.titleCandidates && suno.titleCandidates.length) {
      topic = suno.titleCandidates[0].text;
    }
    if (!topic && raw) {
      const head = raw.split('\n').filter(function(l){ return l.trim(); })[0] || '';
      topic = head.slice(0, 40);
    }

    return {
      source:     'script-music',
      subTab:     sub,
      subLabel:   subLabel,
      topic:      topic,
      script:     raw,
      lang:       settings.channelLang || 'kojp',
      musicType:  sub,                      /* memory|story|enka|cover|variety|orig */
      duration:   settings.duration || '5min',
      seniorOptions: settings.seniorOptions || {},
      sunoPackage:   suno,
      generatedAt:   Date.now(),
    };
  }

  function _saveHandoff(payload) {
    try {
      localStorage.setItem(HANDOFF_KEY, JSON.stringify(payload));
    } catch(e) {
      console.warn('[bridge] localStorage 저장 실패:', e);
    }
  }

  function _buildShortsUrl(payload) {
    const params = [];
    if (payload.topic)     params.push('topic='     + encodeURIComponent(payload.topic.slice(0, 80)));
    if (payload.lang)      params.push('lang='      + encodeURIComponent(payload.lang));
    if (payload.musicType) params.push('musicType=' + encodeURIComponent(payload.musicType));
    /* 1단계(대본) 진입 */
    params.push('step=1');
    return SHORTS_URL + (params.length ? '?' + params.join('&') : '');
  }

  /* ════════════════════════════════════════════════
     "이 대본으로 숏츠 만들기" 버튼
     ════════════════════════════════════════════════ */
  window._smBridgeToShorts = function(sub) {
    const payload = _collectPayload(sub);
    if (!payload.script) {
      alert('먼저 ' + payload.subLabel + ' 영역에서 대본을 생성한 뒤 시도하세요.');
      return;
    }
    _saveHandoff(payload);
    const url = _buildShortsUrl(payload);
    if (confirm('🎬 자동숏츠 엔진으로 이동하시겠어요?\n현재 대본·설정·Suno 패키지(있으면)가 함께 전달됩니다.')) {
      location.href = url;
    }
  };

  /* ════════════════════════════════════════════════
     "음성/영상 패키지 만들기" 버튼
     - media 페이지 존재 여부 확인 후 이동/안내
     ════════════════════════════════════════════════ */
  window._smBridgeToMedia = function(sub) {
    const payload = _collectPayload(sub);
    if (!payload.script) {
      alert('먼저 ' + payload.subLabel + ' 영역에서 대본을 생성한 뒤 시도하세요.');
      return;
    }
    _saveHandoff(payload);
    /* media 엔진 존재 확인 (HEAD 요청) */
    fetch(MEDIA_URL, { method:'HEAD' }).then(function(res){
      if (res.ok) {
        if (confirm('🎵 미디어 엔진으로 이동하시겠어요?\n현재 대본·설정·Suno 패키지가 함께 전달됩니다.')) {
          location.href = MEDIA_URL;
        }
      } else {
        _mediaUnavailable();
      }
    }).catch(_mediaUnavailable);
  };

  function _mediaUnavailable() {
    alert('🎵 음성/영상 패키지 엔진(engines/media/)은 아직 준비 중입니다.\n' +
          '현재 대본·Suno 패키지는 localStorage(moca_script_handoff)에 저장됐어요.\n' +
          '엔진이 준비되면 자동으로 불러옵니다.');
  }

  /* ── 디버그용: 현재 handoff 확인 ── */
  window._smGetHandoff = function() {
    try { return JSON.parse(localStorage.getItem(HANDOFF_KEY) || 'null'); }
    catch(_) { return null; }
  };
  window._smClearHandoff = function() {
    try { localStorage.removeItem(HANDOFF_KEY); } catch(_) {}
  };
})();
