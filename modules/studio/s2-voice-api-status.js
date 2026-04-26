/* ================================================
   modules/studio/s2-voice-api-status.js
   STEP 3 보조 — 음성 API 키 상태 패널 + ElevenLabs voice 목록 fetch

   * 통합 store 에서 voice.elevenlabs / voice.openai_tts / voice.nijivoice 키 조회
     - getApiProvider('voice', '<provider>')  +  ucGetApiKey fallback
   * 패널: ✅ 연결됨 / ⚠️ 키 없음 / ❌ 테스트 실패
   * "테스트" 버튼 — 해당 provider 의 가벼운 endpoint 호출
   * ElevenLabs /v1/voices 결과 → window.V2_EL_VOICES 캐시 (수동 picker 가 사용)
   * 보안: API 키를 console / alert / DOM 에 절대 노출 안 함.
   ================================================ */
(function(){
  'use strict';

  /* ── 상태 캐시 ── */
  var V2_API_STATUS = {
    elevenlabs: { has:false, ok:null, msg:'' },
    openai_tts: { has:false, ok:null, msg:'' },
    nijivoice:  { has:false, ok:null, msg:'' },
  };
  window.V2_API_STATUS = V2_API_STATUS;
  window.V2_EL_VOICES  = window.V2_EL_VOICES || []; /* ElevenLabs voice list cache */

  /* provider id 정규화 (외부 API 와 매핑) */
  function _vasNormProvider(p) {
    var v = String(p || '').toLowerCase();
    if (v === 'openai' || v === 'openaitts' || v === 'openai_tts') return 'openai_tts';
    if (v === 'eleven' || v === 'elevenlabs') return 'elevenlabs';
    if (v === 'niji' || v === 'nijivoice') return 'nijivoice';
    return v;
  }

  /* 현재 키 보유 여부 */
  function vasHasKey(provider) {
    var p = _vasNormProvider(provider);
    /* 통합 store */
    if (typeof window.getApiProvider === 'function') {
      var prov = window.getApiProvider('voice', p);
      if (prov && prov.apiKey && prov.apiKey.length > 4) return true;
      /* OpenAI TTS — script.openai 키 공유 */
      if (p === 'openai_tts') {
        var sc = window.getApiProvider('script', 'openai');
        if (sc && sc.apiKey && sc.apiKey.length > 4) return true;
      }
    }
    /* legacy */
    if (typeof window.ucGetApiKey === 'function') {
      var alt = (p === 'openai_tts') ? 'openai' : p;
      if (window.ucGetApiKey(alt)) return true;
    }
    return false;
  }

  /* 키 가져오기 — _s2GetVoiceKey 가 이미 우선순위 처리 */
  function _vasGetKey(provider) {
    var p = _vasNormProvider(provider);
    var dispatchId = (p === 'openai_tts') ? 'openaiTts'
                  : (p === 'elevenlabs') ? 'elevenlabs'
                  : (p === 'nijivoice')  ? 'nijivoice' : p;
    if (typeof window._s2GetVoiceKey === 'function') {
      return window._s2GetVoiceKey(dispatchId) || '';
    }
    return '';
  }

  /* ── 상태 갱신 (키 보유만 체크) ── */
  function vasRefreshStatus() {
    Object.keys(V2_API_STATUS).forEach(function(p){
      V2_API_STATUS[p].has = vasHasKey(p);
      if (!V2_API_STATUS[p].has) {
        V2_API_STATUS[p].ok = false;
        V2_API_STATUS[p].msg = '키 없음';
      } else if (V2_API_STATUS[p].ok === null) {
        V2_API_STATUS[p].msg = '미테스트';
      }
    });
    return V2_API_STATUS;
  }

  /* ── 연결 테스트 ── */
  async function vasTestProvider(provider) {
    var p = _vasNormProvider(provider);
    var key = _vasGetKey(p);
    if (!key) {
      V2_API_STATUS[p] = { has:false, ok:false, msg:'키 없음' };
      return V2_API_STATUS[p];
    }
    try {
      if (p === 'elevenlabs') {
        var r = await fetch('https://api.elevenlabs.io/v1/voices', {
          method:'GET', headers:{ 'xi-api-key': key, 'Accept':'application/json' },
        });
        if (!r.ok) throw new Error('HTTP '+r.status);
        var data = await r.json();
        var voices = (data && data.voices) || [];
        window.V2_EL_VOICES = voices.map(function(v){
          return {
            id:        'el_remote_' + v.voice_id,
            label:     v.name || v.voice_id,
            provider:  'EL',
            voiceId:   v.voice_id,
            gender:    (v.labels && v.labels.gender) || 'neutral',
            age:       (v.labels && v.labels.age) || 'middle',
            style:     (v.labels && v.labels.use_case) || 'narrator',
            desc:      (v.description || v.category || ''),
            cost:      'medium',
            preview_url: v.preview_url || '',
            _remote:   true,
          };
        });
        V2_API_STATUS[p] = { has:true, ok:true, msg:'연결 OK ('+voices.length+'개)' };
      } else if (p === 'openai_tts') {
        /* OpenAI 는 voice list endpoint 가 없음 — /v1/models 로 대체 */
        var r2 = await fetch('https://api.openai.com/v1/models', {
          method:'GET', headers:{ 'Authorization': 'Bearer '+key },
        });
        if (!r2.ok) throw new Error('HTTP '+r2.status);
        V2_API_STATUS[p] = { has:true, ok:true, msg:'연결 OK' };
      } else if (p === 'nijivoice') {
        /* Nijivoice 는 voice-actors 목록 엔드포인트가 있음 */
        var r3 = await fetch('https://api.nijivoice.com/api/platform/v1/voice-actors', {
          method:'GET', headers:{ 'x-api-key': key, 'Accept':'application/json' },
        });
        if (!r3.ok) throw new Error('HTTP '+r3.status);
        V2_API_STATUS[p] = { has:true, ok:true, msg:'연결 OK' };
      } else {
        V2_API_STATUS[p] = { has:true, ok:null, msg:'테스트 미지원' };
      }
    } catch(e) {
      V2_API_STATUS[p] = { has:true, ok:false, msg:'실패: '+(e && e.message || e) };
    }
    return V2_API_STATUS[p];
  }

  /* ── 한 줄 상태 칩 HTML ── */
  function _vasChipHtml(label, st) {
    var icon = st.ok === true ? '✅'
             : st.ok === false ? (st.has ? '❌' : '⚠️')
             : '⏳';
    var cls  = st.ok === true ? 'on'
             : st.ok === false ? (st.has ? 'err' : 'warn')
             : '';
    return '<span class="vas-chip '+cls+'" title="'+st.msg+'">'+icon+' '+label+'</span>';
  }

  /* ── 상태 패널 렌더 (Step 3 상단) ── */
  function vasRenderStatusPanel() {
    vasRefreshStatus();
    var s = V2_API_STATUS;
    return ''+
    '<div class="vas-panel">'+
      '<div class="vas-hd">🔌 음성 API 연결 상태</div>'+
      '<div class="vas-chips">'+
        _vasChipHtml('ElevenLabs', s.elevenlabs)+
        _vasChipHtml('OpenAI TTS', s.openai_tts)+
        _vasChipHtml('Nijivoice', s.nijivoice)+
      '</div>'+
      '<div class="vas-actions">'+
        '<button type="button" class="vas-btn" onclick="vasTestAndRender()">🔄 연결 테스트</button>'+
        '<button type="button" class="vas-btn" onclick="vasOpenSettings()">🔑 API 키 설정</button>'+
      '</div>'+
    '</div>';
  }

  /* ── 모든 provider 동시 테스트 후 패널 다시 렌더 ── */
  async function vasTestAndRender() {
    var providers = ['elevenlabs','openai_tts','nijivoice'];
    /* 키 있는 것만 테스트 (없는 건 skip — 헛 호출 방지) */
    vasRefreshStatus();
    var jobs = providers
      .filter(function(p){ return V2_API_STATUS[p].has; })
      .map(function(p){ return vasTestProvider(p); });
    try { await Promise.all(jobs); } catch(_) {}
    /* Step 3 패널 다시 그리기 */
    if (typeof window._studioS2Step === 'function') {
      window._studioS2Step();
    }
  }

  /* ── API 키 설정 모달 열기 (음성 탭) ── */
  function vasOpenSettings() {
    if (typeof window.openApiSettingsModal === 'function') {
      window.openApiSettingsModal('voice'); return;
    }
    if (typeof window.renderApiSettings === 'function') {
      window._mocaApiActiveTab = 'voice'; window.renderApiSettings();
    } else {
      alert('통합 API 설정 모듈이 로드되지 않았습니다.');
    }
  }

  /* ── CSS (1회 주입) ── */
  function vasInjectCSS() {
    if (document.getElementById('vas-style')) return;
    var st = document.createElement('style');
    st.id = 'vas-style';
    st.textContent = ''+
'.vas-panel{background:#fff;border:1.5px solid #f1dce7;border-radius:14px;padding:12px;'+
'  display:flex;flex-direction:column;gap:8px;margin-bottom:8px}'+
'.vas-hd{font-size:12px;font-weight:800;color:#2b2430}'+
'.vas-chips{display:flex;gap:6px;flex-wrap:wrap}'+
'.vas-chip{font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;'+
'  background:#f6eef3;color:#7b7077;border:1px solid #f1dce7}'+
'.vas-chip.on{background:#dcfce7;color:#166534;border-color:#86efac}'+
'.vas-chip.warn{background:#fef3c7;color:#92400e;border-color:#fcd34d}'+
'.vas-chip.err{background:#fee2e2;color:#991b1b;border-color:#fca5a5}'+
'.vas-actions{display:flex;gap:6px;flex-wrap:wrap}'+
'.vas-btn{padding:5px 12px;border:1.5px solid #f1dce7;border-radius:20px;'+
'  background:#fff;font-size:11px;font-weight:700;color:#5a4a56;cursor:pointer;transition:.12s}'+
'.vas-btn:hover{border-color:#9181ff;color:#9181ff;background:#fbf7ff}'+
'';
    document.head.appendChild(st);
  }

  /* 자동 1회 주입 */
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', vasInjectCSS);
    } else {
      vasInjectCSS();
    }
  }

  /* 전역 노출 */
  window.vasHasKey            = vasHasKey;
  window.vasRefreshStatus     = vasRefreshStatus;
  window.vasTestProvider      = vasTestProvider;
  window.vasRenderStatusPanel = vasRenderStatusPanel;
  window.vasTestAndRender     = vasTestAndRender;
  window.vasOpenSettings      = vasOpenSettings;
  window.vasInjectCSS         = vasInjectCSS;
})();
