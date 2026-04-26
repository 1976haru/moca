/* ================================================
   modules/studio/s2-voice-manual-picker.js
   STEP 3 — 수동 음성 선택 패널 (자동 추천 외 직접 고르기)

   * 의존: s2-voice-data.js (V2_VOICE_CATALOG / _v2GetCandidateById / _v2DispatchProvider)
           s2-voice-favorites.js (vfvGetRecent / vfvToggleFavorite / vfvIsFavorite)
           s2-voice-api-status.js (V2_EL_VOICES — ElevenLabs 원격 voice 목록)
           s2-voice-step.js (_v2ApplyCandidate, _v2Voice, _studioS2Step)
   * 필터: provider / 언어(ko·ja·any) / 성별 / 연령 / 비용 / 검색어
   * 직접 voice_id 입력 (ElevenLabs / Nijivoice / OpenAI 별칭)
   * 최근 사용 / 즐겨찾기 핀업
   ================================================ */
(function(){
  'use strict';

  var VMP_STATE = {
    provider: 'all',  /* all | EL | OA | NJ | SS */
    lang:     'any',  /* any | ko | ja */
    gender:   'any',  /* any | female | male | neutral */
    age:      'any',  /* any | young | middle | senior */
    cost:     'any',  /* any | free | low | medium */
    query:    '',
  };
  window.VMP_STATE = VMP_STATE;

  /* ── 카탈로그 + 원격(ElevenLabs) 합치기 ── */
  function _vmpAllCandidates() {
    var local  = (window.V2_VOICE_CATALOG || []);
    var remote = (window.V2_EL_VOICES || []);
    return local.concat(remote);
  }

  /* ── 필터 적용 ── */
  function _vmpFilter(list) {
    var s = VMP_STATE;
    var q = (s.query || '').toLowerCase().trim();
    return list.filter(function(c){
      if (s.provider !== 'all' && c.provider !== s.provider) return false;
      if (s.gender !== 'any' && c.gender !== s.gender) return false;
      if (s.age    !== 'any' && c.age    !== s.age) return false;
      if (s.cost   !== 'any' && c.cost   !== s.cost) return false;
      /* 언어 — SS 는 ko/ja 명시, 그 외(EL/OA)는 multilingual 이라 any 매칭 */
      if (s.lang !== 'any') {
        if (c.provider === 'SS') {
          if (s.lang === 'ko' && !/ko/i.test(c.voiceId || '')) return false;
          if (s.lang === 'ja' && !/ja/i.test(c.voiceId || '')) return false;
        } else if (c.provider === 'NJ' && s.lang === 'ko') {
          /* Nijivoice 는 일본어 전용 */
          return false;
        }
      }
      if (q) {
        var hay = ((c.label||'')+' '+(c.desc||'')+' '+(c.voiceId||'')+' '+(c.style||'')).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  /* ── 단일 카드 HTML ── */
  function _vmpCardHtml(c) {
    var fav = (typeof window.vfvIsFavorite === 'function') && window.vfvIsFavorite(c.id);
    var genderLabel = (window.V2_GENDER_LABEL && window.V2_GENDER_LABEL[c.gender]) || c.gender;
    var ageLabel    = (window.V2_AGE_LABEL    && window.V2_AGE_LABEL[c.age])       || c.age;
    var costLabel   = (window.V2_COST_LABEL   && window.V2_COST_LABEL[c.cost])     || c.cost;
    var provBadge   = '<span class="vmp-prov vmp-prov-'+c.provider+'">'+c.provider+'</span>';
    var jsonId      = JSON.stringify(c.id);
    return ''+
    '<div class="vmp-card" data-id="'+c.id+'">'+
      '<div class="vmp-card-hd">'+
        '<span class="vmp-name">'+(c.label||c.id)+'</span>'+
        provBadge+
        '<button type="button" class="vmp-fav '+(fav?'on':'')+'" '+
          'onclick="vmpToggleFav('+jsonId+')" title="즐겨찾기">★</button>'+
      '</div>'+
      '<div class="vmp-meta">'+
        '<span class="vmp-tag">'+genderLabel+'</span>'+
        '<span class="vmp-tag">'+ageLabel+'</span>'+
        '<span class="vmp-tag">'+costLabel+'</span>'+
      '</div>'+
      '<div class="vmp-desc">'+(c.desc || '')+'</div>'+
      '<div class="vmp-actions">'+
        '<button type="button" class="vmp-prev" onclick="vmpPreview('+jsonId+')">▶ 미리듣기</button>'+
        '<button type="button" class="vmp-pick" onclick="vmpApply('+jsonId+')">선택</button>'+
      '</div>'+
    '</div>';
  }

  /* ── 메인 패널 렌더 ── */
  function vmpRenderPanel() {
    vmpInjectCSS();
    var all      = _vmpAllCandidates();
    var filtered = _vmpFilter(all);
    var recent   = (typeof window.vfvGetRecent === 'function') ? window.vfvGetRecent() : [];
    var favs     = (typeof window.vfvGetFavorites === 'function') ? window.vfvGetFavorites() : [];
    var hasEL    = !!(window.V2_EL_VOICES && window.V2_EL_VOICES.length);

    var pinTopHtml = '';
    if (favs.length || recent.length) {
      pinTopHtml = ''+
      '<div class="vmp-pin">'+
        (favs.length ? ''+
          '<div class="vmp-pin-row">'+
            '<div class="vmp-pin-hd">★ 즐겨찾기</div>'+
            '<div class="vmp-pin-list">'+
              favs.map(_vmpPinChipHtml).join('')+
            '</div>'+
          '</div>' : '')+
        (recent.length ? ''+
          '<div class="vmp-pin-row">'+
            '<div class="vmp-pin-hd">🕘 최근 사용</div>'+
            '<div class="vmp-pin-list">'+
              recent.map(_vmpPinChipHtml).join('')+
            '</div>'+
          '</div>' : '')+
      '</div>';
    }

    return ''+
    '<div class="vmp-wrap">'+
      pinTopHtml+
      '<div class="vmp-filters">'+
        _vmpSeg('provider', '제공사', [['all','전체'],['EL','ElevenLabs'],['OA','OpenAI'],['NJ','Nijivoice'],['SS','브라우저']])+
        _vmpSeg('lang',     '언어',   [['any','전체'],['ko','한국어'],['ja','일본어']])+
        _vmpSeg('gender',   '성별',   [['any','전체'],['female','여성'],['male','남성'],['neutral','중성']])+
        _vmpSeg('age',      '연령',   [['any','전체'],['young','청년'],['middle','중년'],['senior','시니어']])+
        _vmpSeg('cost',     '비용',   [['any','전체'],['free','무료'],['low','저렴'],['medium','보통']])+
      '</div>'+
      '<div class="vmp-search">'+
        '<input type="search" class="vmp-search-input" placeholder="🔎 음성 이름·설명·voice_id 검색" '+
          'value="'+(VMP_STATE.query.replace(/"/g,'&quot;'))+'" '+
          'oninput="VMP_STATE.query=this.value;vmpRefresh()">'+
        '<button type="button" class="vmp-direct-btn" onclick="vmpOpenDirectInput()">+ voice_id 직접 입력</button>'+
        (hasEL ? '<span class="vmp-el-count">ElevenLabs '+window.V2_EL_VOICES.length+'개 fetched</span>'
               : '<button type="button" class="vmp-fetch-btn" onclick="vmpFetchEL()">↓ ElevenLabs 목록</button>')+
      '</div>'+
      '<div class="vmp-count">'+filtered.length+' / '+all.length+' 후보 표시</div>'+
      '<div class="vmp-cards">'+
        (filtered.length ? filtered.map(_vmpCardHtml).join('') :
          '<div class="vmp-empty">조건에 맞는 음성이 없습니다.</div>')+
      '</div>'+
    '</div>';
  }

  function _vmpSeg(key, label, options) {
    var cur = VMP_STATE[key];
    var btns = options.map(function(opt){
      var isOn = cur === opt[0];
      return '<button type="button" class="vmp-seg-btn '+(isOn?'on':'')+'" '+
        'onclick="VMP_STATE.'+key+'=\''+opt[0]+'\';vmpRefresh()">'+opt[1]+'</button>';
    }).join('');
    return ''+
    '<div class="vmp-seg-row">'+
      '<span class="vmp-seg-label">'+label+'</span>'+
      '<div class="vmp-seg">'+btns+'</div>'+
    '</div>';
  }

  function _vmpPinChipHtml(it) {
    var jsonId = JSON.stringify(it.id);
    return '<button type="button" class="vmp-pin-chip" onclick="vmpApply('+jsonId+')" title="'+(it.provider||'')+' · '+(it.label||'')+'">'+
      (it.label||it.id)+
    '</button>';
  }

  /* ── 패널 다시 그리기 (자기 영역만) ── */
  function vmpRefresh() {
    var host = document.getElementById('vmpPanelHost');
    if (!host) {
      if (typeof window._studioS2Step === 'function') window._studioS2Step();
      return;
    }
    host.innerHTML = vmpRenderPanel();
  }

  /* ── 후보 적용 — _v2Voice 에 반영 + recent 등록 ── */
  function vmpApply(id) {
    var c = (typeof window._v2GetCandidateById === 'function') && window._v2GetCandidateById(id);
    if (!c) {
      /* 원격 voice (V2_EL_VOICES) 도 검색 */
      c = (window.V2_EL_VOICES || []).find(function(x){ return x.id === id; }) || null;
    }
    if (!c) { alert('후보를 찾을 수 없습니다.'); return; }
    if (typeof window._v2ApplyCandidate === 'function') {
      window._v2ApplyCandidate(c, _vmpLangForCand(c));
    }
    if (typeof window.vfvAddRecent === 'function') {
      window.vfvAddRecent(c, _vmpLangForCand(c));
    }
    vmpRefresh();
  }

  function _vmpLangForCand(c) {
    if (!c) return 'ko';
    if (c.provider === 'NJ') return 'ja';
    if (c.provider === 'SS') return /ja/i.test(c.voiceId || '') ? 'ja' : 'ko';
    return VMP_STATE.lang === 'ja' ? 'ja' : 'ko';
  }

  /* ── 즐겨찾기 토글 ── */
  function vmpToggleFav(id) {
    var c = (typeof window._v2GetCandidateById === 'function') && window._v2GetCandidateById(id);
    if (!c) c = (window.V2_EL_VOICES || []).find(function(x){ return x.id === id; }) || null;
    if (!c) return;
    if (typeof window.vfvToggleFavorite === 'function') {
      window.vfvToggleFavorite(c, _vmpLangForCand(c));
    }
    vmpRefresh();
  }

  /* ── 미리듣기 — preview_url 우선, 없으면 SpeechSynthesis ── */
  function vmpPreview(id) {
    var c = (typeof window._v2GetCandidateById === 'function') && window._v2GetCandidateById(id);
    if (!c) c = (window.V2_EL_VOICES || []).find(function(x){ return x.id === id; }) || null;
    if (!c) return;
    if (typeof window._v2Preview === 'function') {
      window._v2Preview(c, _vmpLangForCand(c));
    } else {
      alert('미리듣기 모듈이 로드되지 않았습니다.');
    }
  }

  /* ── voice_id 직접 입력 ── */
  function vmpOpenDirectInput() {
    var prov = prompt('제공사 약어 (EL=ElevenLabs / OA=OpenAI / NJ=Nijivoice):', 'EL');
    if (!prov) return;
    prov = String(prov).toUpperCase().trim();
    if (['EL','OA','NJ'].indexOf(prov) < 0) { alert('지원하지 않는 제공사입니다.'); return; }
    var vid = prompt('voice_id 입력 (ElevenLabs voice ID 또는 OpenAI voice 이름 또는 Nijivoice voice_actor id):', '');
    if (!vid) return;
    var label = prompt('표시할 이름 (선택):', vid) || vid;
    var c = (typeof window._v2BuildCustomCandidate === 'function')
              && window._v2BuildCustomCandidate(prov, vid.trim(), label.trim());
    if (!c) return;
    if (typeof window._v2ApplyCandidate === 'function') {
      window._v2ApplyCandidate(c, prov === 'NJ' ? 'ja' : 'ko');
    }
    if (typeof window.vfvAddRecent === 'function') {
      window.vfvAddRecent(c, prov === 'NJ' ? 'ja' : 'ko');
    }
    vmpRefresh();
  }

  /* ── ElevenLabs 목록 fetch ── */
  async function vmpFetchEL() {
    if (typeof window.vasTestProvider !== 'function') {
      alert('s2-voice-api-status.js 가 로드되지 않았습니다.'); return;
    }
    var st = await window.vasTestProvider('elevenlabs');
    if (st && st.ok) {
      vmpRefresh();
    } else {
      alert('ElevenLabs 연결 실패: ' + (st && st.msg || ''));
    }
  }

  /* ── CSS ── */
  function vmpInjectCSS() {
    if (document.getElementById('vmp-style')) return;
    var st = document.createElement('style');
    st.id = 'vmp-style';
    st.textContent = ''+
'.vmp-wrap{display:flex;flex-direction:column;gap:10px}'+
'.vmp-pin{display:flex;flex-direction:column;gap:6px;background:#fbf7ff;border:1.5px solid #e8d9f5;border-radius:12px;padding:8px 10px}'+
'.vmp-pin-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'+
'.vmp-pin-hd{font-size:11px;font-weight:800;color:#5b1a4a;min-width:72px}'+
'.vmp-pin-list{display:flex;gap:4px;flex-wrap:wrap}'+
'.vmp-pin-chip{padding:4px 10px;border:1.5px solid #ef6fab;background:#fff;color:#9b1a4a;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;transition:.12s}'+
'.vmp-pin-chip:hover{background:#ef6fab;color:#fff}'+
'.vmp-filters{display:flex;flex-direction:column;gap:5px}'+
'.vmp-seg-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'+
'.vmp-seg-label{font-size:11px;font-weight:700;color:#5a4a56;min-width:48px}'+
'.vmp-seg{display:flex;gap:4px;flex-wrap:wrap;flex:1}'+
'.vmp-seg-btn{padding:4px 10px;border:1.5px solid #f1dce7;border-radius:8px;background:#fff;font-size:11px;font-weight:700;color:#7b7077;cursor:pointer;transition:.12s}'+
'.vmp-seg-btn:hover{border-color:#9181ff;color:#9181ff}'+
'.vmp-seg-btn.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}'+
'.vmp-search{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'+
'.vmp-search-input{flex:1;min-width:200px;padding:7px 12px;border:1.5px solid #f1dce7;border-radius:10px;font-size:12px;font-family:inherit}'+
'.vmp-search-input:focus{border-color:#9181ff;outline:none}'+
'.vmp-direct-btn,.vmp-fetch-btn{padding:6px 12px;border:1.5px solid #9181ff;border-radius:20px;background:#fff;color:#9181ff;font-size:11px;font-weight:700;cursor:pointer}'+
'.vmp-direct-btn:hover,.vmp-fetch-btn:hover{background:#9181ff;color:#fff}'+
'.vmp-el-count{font-size:11px;color:#16a34a;font-weight:700}'+
'.vmp-count{font-size:10px;color:#9b8a93;text-align:right}'+
'.vmp-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;max-height:520px;overflow-y:auto;padding-right:4px}'+
'.vmp-card{background:#fff;border:1.5px solid #f1dce7;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px;transition:.12s}'+
'.vmp-card:hover{border-color:#9181ff;background:#fbf7ff}'+
'.vmp-card-hd{display:flex;align-items:center;gap:6px}'+
'.vmp-name{flex:1;font-size:13px;font-weight:800;color:#2b2430}'+
'.vmp-prov{font-size:10px;padding:2px 7px;border-radius:20px;font-weight:700}'+
'.vmp-prov-EL{background:#ede9ff;color:#5b4ecf}'+
'.vmp-prov-OA{background:#e0f2fe;color:#0369a1}'+
'.vmp-prov-NJ{background:#fff1f8;color:#c0357a}'+
'.vmp-prov-SS{background:#f3f4f6;color:#374151}'+
'.vmp-fav{border:none;background:transparent;font-size:14px;cursor:pointer;color:#d1d5db;padding:0;line-height:1}'+
'.vmp-fav.on{color:#fbbf24}'+
'.vmp-meta{display:flex;gap:4px;flex-wrap:wrap}'+
'.vmp-tag{font-size:10px;padding:2px 7px;background:#f6eef3;color:#7b7077;border-radius:20px;font-weight:600}'+
'.vmp-desc{font-size:11px;color:#7b7077;line-height:1.4;min-height:30px}'+
'.vmp-actions{display:flex;gap:4px;margin-top:auto}'+
'.vmp-prev,.vmp-pick{flex:1;padding:5px 8px;border-radius:8px;font-size:10.5px;font-weight:700;cursor:pointer;transition:.12s;font-family:inherit}'+
'.vmp-prev{border:1.5px solid #f1dce7;background:#fff;color:#5a4a56}'+
'.vmp-prev:hover{border-color:#9181ff;color:#9181ff}'+
'.vmp-pick{border:none;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff}'+
'.vmp-empty{padding:24px;text-align:center;color:#9b8a93;font-size:12px}'+
'';
    document.head.appendChild(st);
  }

  /* 전역 노출 */
  window.vmpRenderPanel    = vmpRenderPanel;
  window.vmpRefresh        = vmpRefresh;
  window.vmpApply          = vmpApply;
  window.vmpToggleFav      = vmpToggleFav;
  window.vmpPreview        = vmpPreview;
  window.vmpOpenDirectInput= vmpOpenDirectInput;
  window.vmpFetchEL        = vmpFetchEL;
  window.vmpInjectCSS      = vmpInjectCSS;
})();
