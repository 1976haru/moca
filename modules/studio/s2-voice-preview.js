/* ================================================
   modules/studio/s2-voice-preview.js
   STEP 3 보조 — 미리듣기 (router 위임)

   * _v2Preview(candidate, langKey) — s2-voice-preview-router.js 의 previewVoice 위임
   * router 미로드 시에만 SpeechSynthesis fallback (안내 포함)
   ================================================ */
(function(){
  'use strict';

  window._v2Preview = function(candidate, langKey) {
    if (!candidate) return;
    if (typeof window.previewVoice === 'function') {
      return window.previewVoice(candidate, { lang: langKey || 'ko' });
    }
    /* router 미로드 — 명시적 fallback 안내 */
    if (typeof window.speechSynthesis === 'undefined') {
      alert('🔊 미리듣기 모듈(preview-router)이 로드되지 않았습니다.');
      return;
    }
    var lang = (langKey === 'ja') ? 'ja-JP' : 'ko-KR';
    var u = new SpeechSynthesisUtterance(lang === 'ja-JP' ? 'こんにちは' : '안녕하세요');
    u.lang = lang;
    window.speechSynthesis.speak(u);
    if (typeof window.ucShowToast === 'function') {
      window.ucShowToast('⚠️ preview-router 미로드 — 브라우저 기본 음성으로 재생', 'warn');
    }
  };
})();
