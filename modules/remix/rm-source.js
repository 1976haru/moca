/* ================================================
   modules/remix/rm-source.js
   영상 리믹스 스튜디오 — 소스 가져오기
   * youtube URL → videoId 추출 (extractVideoId 재사용)
   * 직접 MP4 업로드 → URL.createObjectURL + duration
   * 자막 파일 업로드(.srt/.vtt/.txt) — rm-caption-parser 가 파싱
   ================================================ */
(function(){
  'use strict';

  function _toast(msg, kind){
    if (typeof window.ucShowToast === 'function') window.ucShowToast(msg, kind || 'info');
  }

  /* ── youtube URL 파싱 ── (YT_IMPORT.extractVideoId 재사용) */
  function extractVideoId(url) {
    if (window.YT_IMPORT && typeof window.YT_IMPORT.extractVideoId === 'function') {
      return window.YT_IMPORT.extractVideoId(url);
    }
    /* fallback */
    var s = String(url || '').trim();
    var m;
    m = s.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);          if (m) return m[1];
    m = s.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/);if (m) return m[1];
    m = s.match(/[?&]v=([A-Za-z0-9_-]{6,})/);                if (m) return m[1];
    m = s.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/); if (m) return m[1];
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
    return '';
  }

  /* ── youtube URL set ── */
  function setYoutubeUrl(url) {
    var vid = extractVideoId(url);
    window.RM_CORE.setSource({
      type:       vid ? 'youtube' : '',
      youtubeUrl: url || '',
      videoId:    vid,
      fileName:   '',
      fileBlobUrl:'',
      title:      '',
    });
    return vid;
  }

  /* ── MP4 업로드 ──
     사용자가 권한을 가진 영상만 업로드한다고 가정.
     URL.createObjectURL 로 video element 가 재생 — 새 세션에선 다시 업로드 필요. */
  function loadMp4File(file, onMeta) {
    if (!file) return;
    var url = URL.createObjectURL(file);
    /* duration 추출 — hidden video 요소로 */
    var v = document.createElement('video');
    v.preload = 'metadata';
    v.src = url;
    v.onloadedmetadata = function(){
      var dur = Math.round(v.duration || 0);
      window.RM_CORE.setSource({
        type:        'upload',
        youtubeUrl:  '',
        videoId:     '',
        fileName:    file.name || '',
        fileBlobUrl: url,
        durationSec: dur,
        title:       file.name || '',
      });
      if (typeof onMeta === 'function') onMeta({ url: url, durationSec: dur, fileName: file.name });
    };
    v.onerror = function(){
      _toast('❌ MP4 메타 로드 실패 — 파일이 손상되었거나 지원하지 않는 코덱입니다.', 'error');
    };
  }

  /* ── 자막/대본 파일 업로드 (.srt/.vtt/.txt) ──
     실제 파싱은 rm-caption-parser 에서 수행. 여기선 텍스트만 읽어 콜백. */
  function loadCaptionFile(file, onText) {
    if (!file) return;
    var fr = new FileReader();
    fr.onload = function(){
      var text = String(fr.result || '');
      var format = _detectFormat(file.name, text);
      if (typeof onText === 'function') onText({ text: text, format: format, fileName: file.name });
    };
    fr.onerror = function(){ _toast('❌ 자막 파일 로드 실패', 'error'); };
    fr.readAsText(file, 'utf-8');
  }
  function _detectFormat(name, text) {
    var ext = String(name || '').toLowerCase().split('.').pop();
    if (ext === 'srt') return 'srt';
    if (ext === 'vtt') return 'vtt';
    if (/^WEBVTT/i.test(text)) return 'vtt';
    if (/-->/.test(text)) return 'srt';
    return 'plain';
  }

  /* ── 소스 비우기 (object URL revoke) ── */
  function clearSource() {
    var p = window.RM_CORE.project();
    if (p && p.source && p.source.fileBlobUrl) {
      try { URL.revokeObjectURL(p.source.fileBlobUrl); } catch(_) {}
    }
    window.RM_CORE.setSource({
      type: '', youtubeUrl: '', videoId: '', fileName: '', fileBlobUrl: '', durationSec: 0, title: '',
    });
  }

  /* ── 권한/저작권 안내 텍스트 (UI 가 바로 사용) ── */
  var COPY_NOTICE = [
    '유튜브 원본 영상 파일을 다운로드하거나 재사용하지 않습니다. 영상은 iframe 으로 미리보기만 하며, ' +
      '자막/대본은 사용자가 직접 붙여넣은 내용을 기준으로 편집합니다.',
    '본인 영상 또는 사용 허가를 받은 영상만 음성 교체·자막 교체 결과물로 사용하세요.',
    '공개 영상은 구조 분석과 참고용으로만 사용하고, 원본 화면·로고·캐릭터·문장을 그대로 복제하지 마세요.',
  ];

  window.RM_SOURCE = {
    extractVideoId:  extractVideoId,
    setYoutubeUrl:   setYoutubeUrl,
    loadMp4File:     loadMp4File,
    loadCaptionFile: loadCaptionFile,
    clearSource:     clearSource,
    COPY_NOTICE:     COPY_NOTICE,
  };
})();
