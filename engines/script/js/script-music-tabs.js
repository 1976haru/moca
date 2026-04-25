/* ================================================
   engines/script/js/script-music-tabs.js
   가사/음원 탭 — 각 서브탭에 Suno 패키지 박스 + 공통 옵션 주입
   * 기존 ls-* 패널과 switchLyricSub 함수는 손대지 않음.
     이 모듈은 각 서브탭 패널 끝에 [공통 옵션 + Suno 패키지 영역]을 동적 주입.
   ================================================ */
(function(){
  'use strict';

  /* 글로벌 상태 */
  window.SCRIPT_MUSIC_STATE = window.SCRIPT_MUSIC_STATE || {
    settings: {
      subTab: 'orig',
      channelLang: 'kojp',  /* 'ko' | 'ja' | 'kojp' */
      duration: '5min',     /* '60s' | '5min' | '10min' */
      seniorOptions: {
        easyWords: true, slowExplain: true, memoryHook: true,
        warmTone: true, largeCaption: true,
      },
      copyrightNotice: true,
    },
    suno: null,
    rawScripts: { orig:'', memory:'', story:'', enka:'', cover:'', variety:'' },
  };

  /* 서브탭 ID — index.html 의 ls-* 패널과 매핑 */
  const SUB_TABS = ['orig','memory','story','enka','cover','variety'];

  /* 서브탭 라벨 (UI 안내용) */
  const SUB_LABELS = {
    orig:    '기존 가사생성',
    memory:  '추억노래 대본',
    story:   '노래 스토리',
    enka:    '엔카 / J-POP',
    cover:   '커버곡 소개',
    variety: '음악예능 대본',
  };

  /* 각 서브탭에서 결과를 담는 기존 textarea ID */
  const SUB_OUTPUT_IDS = {
    orig:    'l-out',         /* script-lyric.js 의 출력 — 추정 */
    memory:  'mem-out',
    story:   'str-out',
    enka:    'enk-out',
    cover:   'cov-out',
    variety: 'var-out',
  };

  /* ── 각 패널에 Suno 박스 + 공통 옵션 주입 ── */
  function injectSunoBoxes() {
    SUB_TABS.forEach(function(sub){
      const panel = document.getElementById('ls-' + sub);
      if (!panel) return;
      if (panel.querySelector('.smt-suno-wrap')) return; /* 이미 주입됨 */

      const wrap = document.createElement('div');
      wrap.className = 'smt-suno-wrap';
      wrap.innerHTML = _renderSunoBox(sub);
      panel.appendChild(wrap);
    });
  }

  function _renderSunoBox(sub) {
    return ''
      + '<div class="smt-common-opts">'
      +   '<div class="smt-opts-hd">⚙️ 공통 옵션 (모든 서브탭에 적용)</div>'
      +   _renderLangSeg() + _renderDurationSeg() + _renderSeniorChecks()
      + '</div>'

      + '<div class="smt-copyright">'
      +   '⚖️ <b>저작권 안내:</b> 기존 노래의 실제 가사는 저작권이 있을 수 있으므로 그대로 사용하지 마세요. '
      +   '이 기능은 분위기와 장르를 참고한 <b>새로운 창작 가사</b> 제작용입니다.'
      + '</div>'

      + '<div class="smt-actions">'
      +   '<button class="smt-btn smt-btn-suno" onclick="window._smGenerateSunoPackage(\'' + sub + '\')">'
      +     '🎼 Suno 패키지 생성'
      +   '</button>'
      +   '<button class="smt-btn smt-btn-shorts" onclick="window._smBridgeToShorts(\'' + sub + '\')">'
      +     '🎬 이 대본으로 숏츠 만들기'
      +   '</button>'
      +   '<button class="smt-btn smt-btn-media" onclick="window._smBridgeToMedia(\'' + sub + '\')">'
      +     '🎵 음성/영상 패키지 만들기'
      +   '</button>'
      + '</div>'

      + '<div id="suno-pkg-' + sub + '" class="smt-suno-result"></div>';
  }

  function _renderLangSeg() {
    const cur = window.SCRIPT_MUSIC_STATE.settings.channelLang;
    const opts = [
      ['ko',   '🇰🇷 한국어만'],
      ['ja',   '🇯🇵 일본어만'],
      ['kojp', '🇰🇷🇯🇵 한일 동시'],
    ];
    return ''
      + '<div class="smt-row">'
      +   '<div class="smt-row-label">출력 언어</div>'
      +   '<div class="smt-seg">'
      +     opts.map(function(o){
            return '<button type="button" class="smt-seg-btn ' + (cur===o[0]?'on':'') + '"' +
              ' onclick="window._smSetLang(\'' + o[0] + '\')">' + o[1] + '</button>';
          }).join('')
      +   '</div>'
      + '</div>';
  }

  function _renderDurationSeg() {
    const cur = window.SCRIPT_MUSIC_STATE.settings.duration;
    const opts = [['60s','숏츠 60초'], ['5min','5분'], ['10min','10분 이상']];
    return ''
      + '<div class="smt-row">'
      +   '<div class="smt-row-label">길이</div>'
      +   '<div class="smt-seg">'
      +     opts.map(function(o){
            return '<button type="button" class="smt-seg-btn ' + (cur===o[0]?'on':'') + '"' +
              ' onclick="window._smSetDuration(\'' + o[0] + '\')">' + o[1] + '</button>';
          }).join('')
      +   '</div>'
      + '</div>';
  }

  function _renderSeniorChecks() {
    const so = window.SCRIPT_MUSIC_STATE.settings.seniorOptions;
    const items = [
      ['easyWords',   '쉬운 단어'],
      ['slowExplain', '천천히 설명'],
      ['memoryHook',  '추억 자극'],
      ['warmTone',    '따뜻한 말투'],
      ['largeCaption','큰 글씨 자막'],
    ];
    return ''
      + '<div class="smt-row">'
      +   '<div class="smt-row-label">시니어 친화</div>'
      +   '<div class="smt-checks">'
      +     items.map(function(it){
            return '<label class="smt-check">' +
              '<input type="checkbox" ' + (so[it[0]] ? 'checked' : '') +
              ' onchange="window._smToggleSenior(\'' + it[0] + '\',this.checked)">' +
              '<span>' + it[1] + '</span></label>';
          }).join('')
      +   '</div>'
      + '</div>';
  }

  /* ── 공통 옵션 핸들러 ── */
  window._smSetLang = function(v) {
    window.SCRIPT_MUSIC_STATE.settings.channelLang = v;
    _refreshAllOptions();
  };
  window._smSetDuration = function(v) {
    window.SCRIPT_MUSIC_STATE.settings.duration = v;
    _refreshAllOptions();
  };
  window._smToggleSenior = function(key, on) {
    window.SCRIPT_MUSIC_STATE.settings.seniorOptions[key] = !!on;
  };

  function _refreshAllOptions() {
    /* 모든 서브탭의 공통 옵션 영역만 재렌더 */
    SUB_TABS.forEach(function(sub){
      const panel = document.getElementById('ls-' + sub);
      if (!panel) return;
      const opts = panel.querySelector('.smt-common-opts');
      if (!opts) return;
      opts.innerHTML = '<div class="smt-opts-hd">⚙️ 공통 옵션 (모든 서브탭에 적용)</div>'
        + _renderLangSeg() + _renderDurationSeg() + _renderSeniorChecks();
    });
  }

  /* ── 외부 모듈에서 사용할 헬퍼 ── */
  window._smGetSettings = function() {
    return window.SCRIPT_MUSIC_STATE.settings;
  };
  window._smGetOutputId = function(sub) {
    return SUB_OUTPUT_IDS[sub] || '';
  };
  window._smGetSubLabel = function(sub) {
    return SUB_LABELS[sub] || sub;
  };
  /* 기존 textarea 또는 result 영역에서 현재 본문 추출 */
  window._smGetRawScript = function(sub) {
    const id = SUB_OUTPUT_IDS[sub];
    if (!id) return '';
    const el = document.getElementById(id);
    if (!el) return '';
    return (el.value || el.textContent || '').trim();
  };

  /* ── CSS ── */
  function _injectCSS() {
    if (document.getElementById('smt-style')) return;
    const st = document.createElement('style');
    st.id = 'smt-style';
    st.textContent = ''
      + '.smt-suno-wrap{margin-top:14px;display:flex;flex-direction:column;gap:10px}'
      + '.smt-common-opts{background:#fbf7f9;border:1.5px solid #ead9e1;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px}'
      + '.smt-opts-hd{font-size:12px;font-weight:800;color:#2b2430}'
      + '.smt-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}'
      + '.smt-row-label{font-size:11px;font-weight:700;color:#5a4a56;min-width:72px}'
      + '.smt-seg{display:flex;gap:4px;flex-wrap:wrap}'
      + '.smt-seg-btn{padding:5px 12px;border:1.5px solid #f1dce7;border-radius:8px;background:#fff;font-size:11.5px;font-weight:700;color:#7b7077;cursor:pointer;font-family:inherit;transition:.12s}'
      + '.smt-seg-btn:hover{border-color:#9181ff;color:#9181ff}'
      + '.smt-seg-btn.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}'
      + '.smt-checks{display:flex;gap:10px;flex-wrap:wrap}'
      + '.smt-check{display:flex;align-items:center;gap:5px;font-size:11px;color:#5a4a56;cursor:pointer}'
      + '.smt-check input{accent-color:#9181ff}'
      + '.smt-copyright{background:#fff8ec;border:1px solid #f1e0c4;border-radius:10px;padding:8px 12px;font-size:11px;color:#8B5020;line-height:1.5}'
      + '.smt-copyright b{color:#6b3f10}'
      + '.smt-actions{display:flex;gap:8px;flex-wrap:wrap}'
      + '.smt-btn{padding:10px 16px;border:none;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;transition:.14s}'
      + '.smt-btn:hover{opacity:.9;transform:translateY(-1px)}'
      + '.smt-btn-suno{background:linear-gradient(135deg,#C020A0,#8030A0);color:#fff}'
      + '.smt-btn-shorts{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff}'
      + '.smt-btn-media{background:linear-gradient(135deg,#9181ff,#5b4ecf);color:#fff}'
      + '.smt-suno-result{min-height:0}'
      ;
    document.head.appendChild(st);
  }

  /* ── 부팅 ── */
  function _boot() {
    _injectCSS();
    injectSunoBoxes();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _boot);
  } else {
    _boot();
  }

  /* 서브탭 전환 시 누락 패널이 생기면 다시 주입 (안전망) */
  if (typeof window.switchLyricSub === 'function' && !window._smPatchedSwitch) {
    const _origSwitch = window.switchLyricSub;
    window.switchLyricSub = function(id, btn) {
      _origSwitch(id, btn);
      injectSunoBoxes();
    };
    window._smPatchedSwitch = true;
  }
})();
