/* ================================================
   modules/studio/s1-lyric-panel.js
   STEP 1 — 가사/음원 전용 패널 (한국어/일본어/한일 동시 분기)
   호출자: s1-style-panels.js 의 _s1RenderStylePanel('lyric')
   저장: STUDIO.project.s1.lyricSettings
   * 다음 PR에서 보컬 30옵션·전체 결과 4종(가사/Suno Style/Lyrics/이미지) 확장 예정
   ================================================ */

const LP_MUSIC_GENRES = [
  '발라드', '트로트', '엔카', '포크',
  '재즈·블루스', '컨템포러리', '국악·민요', '동요',
];
const LP_DURATIONS = ['30초', '1분', '2분', '3분', '5분 풀버전'];
const LP_LYRIC_MOODS = [
  '향수·추억', '눈물·이별', '용기·도전', '사랑·고백',
  '가족·효도', '풍자·해학', '자연·계절',
];
const LP_ERAS = [
  '1960~70', '1980', '1990', '2000', '복고풍 자유',
];
const LP_JA_GENRES = ['엔카', '가요곡', '민요', '포크엔카'];
const LP_JA_THEMES = ['望郷(향수)', '離別(이별)', '人生(인생)', '酒場(술집)', '季節(계절)'];

/* ── 기본값 ── */
function _lpDefault() {
  return {
    musicGenre: '트로트',
    nostalgia: 4,
    era: '1980',
    duration: '1분',
    lyricMood: '향수·추억',
    imageStyle: '복고 영화 톤',
    extra: '',
    /* 일본어 가사 전용 */
    jaGenre: '엔카',
    jaShowaEra: 4,         /* 쇼와 시대감 강도 */
    jaKobushi: 3,          /* 고부시 강도 */
    jaTheme: '望郷(향수)',
    jaExtra: '',
  };
}
function _lpGet() {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  if (!proj.s1) proj.s1 = {};
  if (!proj.s1.lyricSettings) proj.s1.lyricSettings = _lpDefault();
  return proj.s1.lyricSettings;
}
function _lpSet(field, val) {
  const s = _lpGet();
  s[field] = val;
  if (typeof studioSave === 'function') studioSave();
}
window._lpSet = _lpSet;

function _lpChips(label, options, val, field) {
  return `
    <div class="lp-row">
      <div class="lp-row-label">${label}</div>
      <div class="lp-chips">
        ${options.map(o=>`
          <button type="button" class="lp-chip ${val===o?'on':''}"
            onclick="_lpSet('${field}','${o}');_studioS1Step(_s1WrapId())">${o}</button>
        `).join('')}
      </div>
    </div>`;
}
function _lpRange(label, val, min, max, field) {
  return `
    <div class="lp-row">
      <div class="lp-row-label">${label}: <b>${val}</b> / ${max}</div>
      <input type="range" class="lp-range" min="${min}" max="${max}" step="1" value="${val}"
        oninput="_lpSet('${field}',parseInt(this.value));this.previousElementSibling.querySelector('b').textContent=this.value">
    </div>`;
}
function _lpInput(label, val, field, placeholder) {
  return `
    <div class="lp-row">
      <div class="lp-row-label">${label}</div>
      <input type="text" class="lp-inp" placeholder="${placeholder||''}"
        value="${(val||'').replace(/"/g,'&quot;')}"
        oninput="_lpSet('${field}',this.value)">
    </div>`;
}
function _lpTextarea(label, val, field, placeholder) {
  return `
    <div class="lp-row">
      <div class="lp-row-label">${label}</div>
      <textarea class="lp-textarea" rows="2"
        placeholder="${placeholder||''}"
        oninput="_lpSet('${field}',this.value)">${val||''}</textarea>
    </div>`;
}

/* ════════════════════════════════════════════════
   메인 렌더 — outputLang에 따라 한/일/동시 분기
   ════════════════════════════════════════════════ */
function _s1RenderLyricPanel(wid) {
  const s = _lpGet();
  const lang = (typeof _s1Lang !== 'undefined') ? _s1Lang : 'both';

  const koBlock = `
    <div class="lp-section">
      <div class="lp-section-hd">🇰🇷 한국어 가사 설정</div>
      ${_lpChips('음악 장르',  LP_MUSIC_GENRES, s.musicGenre, 'musicGenre')}
      ${_lpRange('향수 강도',  s.nostalgia, 1, 5, 'nostalgia')}
      ${_lpChips('향수 시대',  LP_ERAS, s.era, 'era')}
      ${_lpChips('음원 길이',  LP_DURATIONS, s.duration, 'duration')}
      ${_lpChips('가사 감성 코드', LP_LYRIC_MOODS, s.lyricMood, 'lyricMood')}
      ${_lpInput('이미지 스타일', s.imageStyle, 'imageStyle', '예: 복고 영화 톤·1980 한국 농촌')}
      ${_lpTextarea('한국어 추가 지시', s.extra, 'extra', '특정 단어·금지어·후렴 반복 등')}
    </div>`;

  const jaBlock = `
    <div class="lp-section lp-section-ja">
      <div class="lp-section-hd">🇯🇵 일본어 가사 전용 설정</div>
      ${_lpChips('일본어 음악 장르', LP_JA_GENRES, s.jaGenre, 'jaGenre')}
      ${_lpRange('쇼와 시대감 (昭和感)', s.jaShowaEra, 1, 5, 'jaShowaEra')}
      ${_lpRange('고부시 강도 (こぶし)', s.jaKobushi, 1, 5, 'jaKobushi')}
      ${_lpChips('감성 테마', LP_JA_THEMES, s.jaTheme, 'jaTheme')}
      ${_lpTextarea('일본어 추가 지시', s.jaExtra, 'jaExtra',
        '예: 必ず日本語のみ。サビは2回繰り返し')}
    </div>`;

  return `
  <div class="lp-wrap">
    <div class="lp-banner">
      🎵 가사/음원 모드 — 결과는 <b>가사 본문 + Suno Style + Suno Lyrics</b> 형식으로 생성됩니다.<br>
      <span class="lp-sub">현재 출력언어: <b>${lang === 'ko' ? '한국어만' : lang === 'ja' ? '일본어만' : '한일 동시'}</b></span>
    </div>
    ${lang !== 'ja' ? koBlock : ''}
    ${lang !== 'ko' ? jaBlock : ''}
    <div class="lp-hint">📌 다음 PR: 보컬·가수 스타일 30옵션 + 결과 분할(가사/Suno Style/Lyrics/이미지/유튜브 전략) 추가 예정</div>
  </div>`;
}

/* ── CSS ── */
(function _lpInjectCSS(){
  if (document.getElementById('lp-style')) return;
  const st = document.createElement('style');
  st.id = 'lp-style';
  st.textContent = `
.lp-wrap{display:flex;flex-direction:column;gap:12px;background:#fff;
  border:2px dashed #ef6fab;border-radius:14px;padding:14px;margin-bottom:12px}
.lp-banner{background:linear-gradient(135deg,#fff5f9,#f5f0ff);border-radius:10px;
  padding:10px 12px;font-size:12px;color:#5b4060;line-height:1.5}
.lp-banner b{color:#ef6fab}
.lp-sub{font-size:11px;color:#9b8a93;display:block;margin-top:3px}
.lp-section{background:#fbf7f9;border-radius:12px;padding:12px;
  display:flex;flex-direction:column;gap:8px;border:1px solid #f1dce7}
.lp-section-ja{background:#f5f0ff;border-color:#d4b5f5}
.lp-section-hd{font-size:13px;font-weight:800;color:#2b2430;margin-bottom:4px}
.lp-row{display:flex;flex-direction:column;gap:4px}
.lp-row-label{font-size:11.5px;font-weight:700;color:#5a4a56}
.lp-row-label b{color:#ef6fab;font-weight:800}
.lp-chips{display:flex;gap:4px;flex-wrap:wrap}
.lp-chip{padding:4px 10px;border:1.5px solid #f1dce7;border-radius:18px;
  background:#fff;font-size:11px;font-weight:700;color:#7b7077;cursor:pointer;
  transition:.12s;font-family:inherit}
.lp-chip:hover{border-color:#ef6fab;color:#ef6fab}
.lp-chip.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.lp-inp,.lp-textarea{width:100%;border:1.5px solid #f1dce7;border-radius:8px;
  padding:7px 10px;font-size:12px;font-family:inherit;outline:none;box-sizing:border-box;background:#fff}
.lp-textarea{resize:vertical;line-height:1.5;min-height:48px}
.lp-inp:focus,.lp-textarea:focus{border-color:#9181ff}
.lp-range{width:100%;-webkit-appearance:none;appearance:none;height:5px;
  background:#f1dce7;border-radius:3px;outline:none;margin:6px 0}
.lp-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
  width:16px;height:16px;border-radius:50%;background:#ef6fab;cursor:pointer;border:none}
.lp-range::-moz-range-thumb{width:16px;height:16px;border-radius:50%;
  background:#ef6fab;cursor:pointer;border:none}
.lp-hint{margin-top:4px;padding:8px 12px;background:#fffbe8;border-radius:8px;
  font-size:11px;color:#7b6020}
`;
  document.head.appendChild(st);
})();

/* 외부 노출 */
window._s1RenderLyricPanel = _s1RenderLyricPanel;
