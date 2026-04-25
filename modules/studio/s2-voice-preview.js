/* ================================================
   modules/studio/s2-voice-preview.js
   STEP 3 보조 — 음성 후보 미리듣기 (이슈 1·2)
   호출자: s2-voice-step.js 의 _v2Preview 버튼
   * 실제 API 호출은 만들지 않음.
     ① 후보에 sampleUrl이 있으면 audio 재생
     ② 없으면 브라우저 SpeechSynthesis 짧은 문장
     ③ 둘 다 불가하면 안내 alert
   ================================================ */

const VPV_SAMPLE_TEXT = {
  ko: '안녕하세요. 이 목소리로 영상을 제작합니다.',
  ja: 'こんにちは。この声で動画を作成します。',
};

/* ── 진행 중 audio/utterance 추적 (중복 방지) ── */
let _vpvCurrentAudio = null;
let _vpvCurrentUtter = null;

function _vpvStop() {
  try {
    if (_vpvCurrentAudio) { _vpvCurrentAudio.pause(); _vpvCurrentAudio = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    _vpvCurrentUtter = null;
  } catch(_) {}
}

/* ════════════════════════════════════════════════
   메인 — 미리듣기 시도 (3-tier fallback)
   ════════════════════════════════════════════════ */
window._v2Preview = function(candidate, langKey) {
  _vpvStop();

  /* ① 샘플 URL 우선 */
  if (candidate && candidate.sampleUrl) {
    try {
      const audio = new Audio(candidate.sampleUrl);
      _vpvCurrentAudio = audio;
      audio.play().catch(function(err){
        console.warn('[v2-preview] audio play 실패:', err);
        _vpvSpeechFallback(candidate, langKey);
      });
      return;
    } catch(e) {
      console.warn('[v2-preview] Audio() 실패:', e);
    }
  }

  /* ② SpeechSynthesis 폴백 */
  _vpvSpeechFallback(candidate, langKey);
};

function _vpvSpeechFallback(candidate, langKey) {
  if (typeof window.speechSynthesis === 'undefined' ||
      typeof window.SpeechSynthesisUtterance === 'undefined') {
    alert('🔊 샘플 음성은 API 연동 후 제공됩니다.\n' +
          '현재 브라우저에서 미리듣기를 지원하지 않습니다.');
    return;
  }
  const lang = (langKey === 'ja') ? 'ja' : 'ko';
  const text = VPV_SAMPLE_TEXT[lang];
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang   = (lang === 'ja') ? 'ja-JP' : 'ko-KR';
    u.rate   = 1.0;
    u.pitch  = 1.0;
    u.volume = 1.0;
    /* 가능하면 lang 매칭 voice 선택 */
    const voices = window.speechSynthesis.getVoices() || [];
    const match  = voices.find(function(v){ return v.lang && v.lang.indexOf(u.lang.slice(0,2)) === 0; });
    if (match) u.voice = match;
    _vpvCurrentUtter = u;
    window.speechSynthesis.speak(u);
  } catch(e) {
    console.warn('[v2-preview] speech 실패:', e);
    alert('🔊 샘플 음성 재생 실패. 브라우저 설정을 확인하거나 API 연동 후 사용하세요.');
  }
}

/* ── 페이지 떠날 때 정지 ── */
window.addEventListener('beforeunload', _vpvStop);
