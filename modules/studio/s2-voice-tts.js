/* ================================================
   modules/studio/s2-voice-tts.js
   ⭐ TTS provider 분기 헬퍼 — 선택 provider별 키 lookup + dispatcher
   * 통합 store(moca_api_settings_v1.voice.*) 우선, legacy fallback
   * provider: openaiTts / elevenlabs / nijivoice / googleTts / azureTts / clova / voicevox
   * 키 없으면 voice 탭 안내. console 에 키 값 절대 출력 안 함.
   ================================================ */
function _s2NormalizeVoiceProvider(p) {
  if (!p) return 'openaiTts';
  var v = String(p).toLowerCase();
  if (v === 'openai' || v === 'openaitts' || v === 'openai_tts') return 'openaiTts';
  if (v === 'elevenlabs' || v === 'eleven') return 'elevenlabs';
  if (v === 'nijivoice' || v === 'niji') return 'nijivoice';
  if (v === 'google' || v === 'googletts' || v === 'google_tts') return 'googleTts';
  if (v === 'azure' || v === 'azure_tts') return 'azureTts';
  if (v === 'clova') return 'clova';
  if (v === 'voicevox') return 'voicevox';
  return v;
}

function _s2GetCurrentVoiceProvider() {
  var proj = (window.STUDIO && window.STUDIO.project) || {};
  var s2 = proj.s2 || {};
  var s4 = proj.s4 || {};
  var raw = s2.voiceProvider || s2.provider || s2.voiceApi || s4.voiceApi || 'openaiTts';
  return _s2NormalizeVoiceProvider(raw);
}

function _s2GetVoiceKey(provider) {
  var p = _s2NormalizeVoiceProvider(provider);
  /* 1순위 — 통합 store voice 그룹 */
  if (typeof window.getApiProvider === 'function') {
    var prov = window.getApiProvider('voice', p);
    if (prov && prov.apiKey && prov.apiKey.length > 4) return prov.apiKey;
    /* OpenAI TTS 는 script.openai 키 공유 (fallback) */
    if (p === 'openaiTts') {
      var script = window.getApiProvider('script', 'openai');
      if (script && script.apiKey && script.apiKey.length > 4) return script.apiKey;
    }
  }
  /* 2순위 — ucGetApiKey (자체 LEGACY_MAP 역추적) */
  if (typeof window.ucGetApiKey === 'function') {
    if (p === 'openaiTts') {
      var k = window.ucGetApiKey('openai_tts') || window.ucGetApiKey('openai');
      if (k) return k;
    } else {
      var k2 = window.ucGetApiKey(p);
      if (k2) return k2;
    }
  }
  /* 3순위 — legacy uc_*_key 직접 */
  var alias = {
    openaiTts:'uc_openai_key', elevenlabs:'uc_eleven_key', nijivoice:'uc_nijivoice_key',
    googleTts:'uc_google_key', azureTts:'uc_azure_key', clova:'uc_clova_key',
  };
  var lk = alias[p];
  return lk ? (localStorage.getItem(lk) || '') : '';
}

function _s2PromptOpenVoiceSettings(providerLabel) {
  var label = providerLabel || '선택한 음성';
  if (confirm(label + ' API 키가 없습니다. 통합 API 설정(음성 탭)을 열까요?')) {
    if (typeof window.openApiSettingsModal === 'function') window.openApiSettingsModal('voice');
    else if (typeof window.renderApiSettings === 'function') {
      window._mocaApiActiveTab = 'voice'; window.renderApiSettings();
    }
  }
}

/* dispatcher — provider 별 실제 fetch 함수 호출.
   각 함수는 해당 provider 키만 읽음. 결과: { url, blob, provider, voiceId } */
async function _s2DispatchTts(opts) {
  var provider = _s2NormalizeVoiceProvider(opts.provider || _s2GetCurrentVoiceProvider());
  try { console.log('[api] voice provider:', provider); } catch(_) {}
  if (provider === 'elevenlabs') return await _s2CallElevenLabsTts(opts);
  if (provider === 'nijivoice')  return await _s2CallNijivoiceTts(opts);
  /* default — OpenAI TTS (대부분 호환) */
  return await _s2CallOpenAiTts(opts);
}

async function _s2CallOpenAiTts(opts) {
  var key = _s2GetVoiceKey('openaiTts');
  if (!key) { _s2PromptOpenVoiceSettings('OpenAI TTS'); return null; }
  var voice = opts.voice || 'nova';
  var speed = parseFloat(opts.speed != null ? opts.speed : 1.0);
  var r = await fetch('https://api.openai.com/v1/audio/speech', {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
    body:JSON.stringify({ model:'tts-1', input:opts.text, voice:voice, speed:speed })
  });
  if (!r.ok) throw new Error('OpenAI TTS 실패 ('+r.status+')');
  var blob = await r.blob();
  return { url:URL.createObjectURL(blob), blob:blob, provider:'openaiTts', voiceId:voice };
}

async function _s2CallElevenLabsTts(opts) {
  var key = _s2GetVoiceKey('elevenlabs');
  if (!key) { _s2PromptOpenVoiceSettings('ElevenLabs'); return null; }
  /* voiceId 우선순위: opts > s2.voiceId > s4 voice* > 기본 (Bella) */
  var proj = (window.STUDIO && window.STUDIO.project) || {};
  var voiceId = opts.voiceId
              || (proj.s2 && proj.s2.voiceId)
              || (proj.s4 && (proj.s4.voiceKo || proj.s4.voiceJa))
              || 'EXAVITQu4vr4xnSDxMaL';
  var url = 'https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(voiceId);
  var r = await fetch(url, {
    method:'POST',
    headers:{'xi-api-key':key, 'Content-Type':'application/json', 'Accept':'audio/mpeg'},
    body:JSON.stringify({
      text: opts.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability:0.5, similarity_boost:0.75 }
    })
  });
  if (!r.ok) throw new Error('ElevenLabs TTS 실패 ('+r.status+')');
  var blob = await r.blob();
  return { url:URL.createObjectURL(blob), blob:blob, provider:'elevenlabs', voiceId:voiceId };
}

async function _s2CallNijivoiceTts(opts) {
  var key = _s2GetVoiceKey('nijivoice');
  if (!key) { _s2PromptOpenVoiceSettings('Nijivoice'); return null; }
  /* 실제 Nijivoice API 스펙은 별도 문서 — 표준 패턴으로 호출 시도.
     실패 시 사용자가 선택한 provider 를 OpenAI 등으로 몰래 바꾸지 않고 명시 에러. */
  var proj = (window.STUDIO && window.STUDIO.project) || {};
  var voiceId = opts.voiceId
              || (proj.s2 && proj.s2.voiceId)
              || 'haruka';
  var url = 'https://api.nijivoice.com/api/platform/v1/voice-actors/' + encodeURIComponent(voiceId) + '/generate-voice';
  var r = await fetch(url, {
    method:'POST',
    headers:{'x-api-key':key, 'Content-Type':'application/json', 'Accept':'application/json'},
    body:JSON.stringify({ script: opts.text, format:'mp3', speed:String(opts.speed || 1.0) })
  });
  if (!r.ok) throw new Error('Nijivoice TTS 실패 ('+r.status+') — voice_id 또는 키 확인 필요');
  var data = await r.json();
  var audioUrl = (data && data.generatedVoice && (data.generatedVoice.audioFileUrl || data.generatedVoice.audioFileDownloadUrl))
              || (data && data.audioFileUrl) || '';
  if (!audioUrl) throw new Error('Nijivoice 응답에 audio URL 없음');
  return { url:audioUrl, blob:null, provider:'nijivoice', voiceId:voiceId };
}

window._s2NormalizeVoiceProvider   = _s2NormalizeVoiceProvider;
window._s2GetCurrentVoiceProvider  = _s2GetCurrentVoiceProvider;
window._s2GetVoiceKey              = _s2GetVoiceKey;
window._s2DispatchTts              = _s2DispatchTts;
