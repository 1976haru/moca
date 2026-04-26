/* ================================================
   modules/studio/s2-voice-safety.js
   Step 3 음성 — 프롬프트 안전 필터

   * vsfCheck(prompt) → { ok, reasons:[], suggestion }
     - 유명 성우 / 실존 인물 / 유튜버 / 캐릭터 / "OOO 와 똑같이" 패턴 차단
     - 일반적 음성 특성 표현으로 자동 치환 제안
   ================================================ */
(function(){
  'use strict';

  /* ── 차단 패턴 ── */
  var BANNED_KW_KO = [
    '유명 성우','성우 ','연예인','정치인','대통령','앵커','tv 진행자',
    '복제','복사','클론','clone','똑같이','똑같은','똑같게',
    '같은 목소리','같은 톤','목소리 따라','보이스 카피',
    '짱구','도라에몽','뽀로로','피카츄','애니 캐릭터','만화 캐릭터',
    '특정 유튜버','특정 인물','특정 연예인','특정 성우',
  ];
  var BANNED_KW_EN = [
    'famous voice actor','specific celebrity','specific person','specific youtuber',
    'voice clone','clone of','copy of','imitate','impersonate',
    'sounds exactly like','identical to','same as',
  ];
  /* "OOO 처럼", "OOO와 같이" 형태 — 사람 이름 패턴 (한글 2~5자 + 처럼/같이) */
  var NAME_LIKE_PATTERNS = [
    /[가-힣]{2,5}\s*(처럼|같이|같은|풍|체|식)/g,
    /like\s+[A-Z][a-zA-Z]{2,}/g,
  ];

  /* ── 치환 제안 사전 ── */
  var SUGGESTION_MAP = [
    { pattern: /유명\s*성우[^.]*/, replace: '극적인 감정 표현이 가능한 전문 내레이션 톤' },
    { pattern: /특정\s*유튜버[^.]*/, replace: '빠른 리액션과 코믹한 타이밍이 있는 밝은 진행자 톤' },
    { pattern: /[가-힣]{2,5}\s*(처럼|같이|같은)/, replace: '비슷한 분위기의 일반적인 톤' },
    { pattern: /(짱구|도라에몽|뽀로로|피카츄)\s*(처럼|같이|같은)?/, replace: '애니메이션 조연풍의 과장된 코믹 톤' },
    { pattern: /(연예인|정치인|대통령)/, replace: '공식적이고 신뢰감 있는 발표 톤' },
  ];

  /* ── 일반 음성 특성 안내 (UI 표시용) ── */
  var SAFE_EXAMPLES = [
    '장난기 많은 고음의 코믹톤',
    '광고 내레이션처럼 또렷한 중년 여성톤',
    '라디오 DJ 같은 부드러운 저음 남성톤',
    '애니메이션 조연처럼 과장된 리액션 톤',
    '다큐멘터리형 차분한 중년 남성톤',
    '따뜻하고 느린 시니어 친화 내레이션',
  ];
  window.VSF_SAFE_EXAMPLES = SAFE_EXAMPLES;

  function _hitsFor(text, kws) {
    var hits = [];
    var t = String(text || '').toLowerCase();
    kws.forEach(function(k){
      if (t.indexOf(k.toLowerCase()) >= 0) hits.push(k);
    });
    return hits;
  }

  function _suggestReplacement(text) {
    var s = String(text || '');
    SUGGESTION_MAP.forEach(function(rule){
      s = s.replace(rule.pattern, rule.replace);
    });
    return s;
  }

  /* ── 메인 ── */
  function vsfCheck(prompt) {
    var text = String(prompt || '');
    var reasons = [];

    /* keyword hits */
    var koHits = _hitsFor(text, BANNED_KW_KO);
    var enHits = _hitsFor(text, BANNED_KW_EN);
    koHits.forEach(function(h){ reasons.push('금지 표현: "' + h + '"'); });
    enHits.forEach(function(h){ reasons.push('금지 표현: "' + h + '"'); });

    /* "OOO 처럼" 패턴 (단, 일반 명사 처럼/같이 는 너무 광범위 — 한글 이름 2-5자에만 한정) */
    NAME_LIKE_PATTERNS.forEach(function(re){
      var m = text.match(re);
      if (m) m.forEach(function(s){
        /* 화이트리스트 — 일반 명사 */
        var WHITELIST = ['시니어처럼','어른처럼','아이처럼','중년처럼','청년처럼',
                         '광고처럼','뉴스처럼','다큐처럼','캐릭터처럼','내레이션처럼',
                         'like a','like the','like an','like our'];
        var isAllowed = WHITELIST.some(function(w){ return s.toLowerCase().indexOf(w.toLowerCase()) >= 0; });
        if (!isAllowed) reasons.push('실존 인물/캐릭터 모방 의심: "' + s.trim() + '"');
      });
    });

    var suggestion = reasons.length ? _suggestReplacement(text) : text;
    var ok = reasons.length === 0;
    try { console.debug('[voice-safety] ok:', ok, 'reasons:', reasons.length); } catch(_) {}
    return { ok: ok, reasons: reasons, suggestion: suggestion, original: text };
  }

  /* ── UI 안내 문구 ── */
  function vsfRenderHint() {
    return '<div class="vsf-hint">'+
      '<div class="vsf-hint-title">⚠️ 음성 프롬프트 안전 정책</div>'+
      '<div class="vsf-hint-body">특정 실존 인물, 유명 성우, 유튜버, 캐릭터의 목소리를 모방하는 요청은 사용할 수 없습니다. 대신 일반적인 음성 특성으로 작성해주세요.</div>'+
      '<div class="vsf-hint-list">' +
        SAFE_EXAMPLES.map(function(e){ return '<span class="vsf-hint-chip">'+e+'</span>'; }).join('') +
      '</div>' +
    '</div>';
  }

  function vsfInjectCSS() {
    if (document.getElementById('vsf-style')) return;
    var st = document.createElement('style');
    st.id = 'vsf-style';
    st.textContent = ''+
'.vsf-hint{background:#fff5fa;border:1.5px solid #f1dce7;border-radius:10px;padding:10px 12px;font-size:11px}'+
'.vsf-hint-title{font-weight:800;color:#5b1a4a;margin-bottom:4px}'+
'.vsf-hint-body{color:#5a4a56;line-height:1.5;margin-bottom:6px}'+
'.vsf-hint-list{display:flex;gap:4px;flex-wrap:wrap}'+
'.vsf-hint-chip{font-size:10px;padding:2px 8px;background:#fff;border:1px solid #f1dce7;border-radius:20px;color:#5b1a4a}'+
'.vsf-fail{background:#fee2e2;border-color:#fca5a5;color:#991b1b}'+
'';
    document.head.appendChild(st);
  }

  /* 전역 노출 */
  window.vsfCheck       = vsfCheck;
  window.vsfRenderHint  = vsfRenderHint;
  window.vsfInjectCSS   = vsfInjectCSS;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vsfInjectCSS);
    else vsfInjectCSS();
  }
})();
