/* ================================================
   modules/studio/s2-voice-design-elevenlabs.js
   ElevenLabs Voice Design 어댑터

   * vdElCreatePreviews(prompt, sampleText) — preview 후보 N개
       POST /v1/text-to-voice/create-previews
       body: { voice_description, text }
       response: { previews:[{generated_voice_id, audio_base_64, ...}] }
   * vdElCreateVoiceFromPreview(generatedVoiceId, name, description)
       POST /v1/text-to-voice/create-voice-from-preview
       body: { voice_name, voice_description, generated_voice_id }
       response: { voice_id, name, ... }
   * base64 audio → Blob URL (보안: HTML/console 노출 금지)
   ================================================ */
(function(){
  'use strict';

  function _getElKey() {
    if (typeof window.getApiProvider === 'function') {
      var p = window.getApiProvider('voice', 'elevenlabs');
      if (p && p.apiKey && p.apiKey.length > 4) return p.apiKey;
    }
    if (typeof window.ucGetApiKey === 'function') {
      var k = window.ucGetApiKey('elevenlabs');
      if (k && k.length > 4) return k;
    }
    var lk = localStorage.getItem('uc_eleven_key') || '';
    return (lk && lk.length > 4) ? lk : '';
  }

  function _b64ToBlobUrl(b64, mime) {
    try {
      var byteChars = atob(b64);
      var byteNums = new Array(byteChars.length);
      for (var i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      var byteArr = new Uint8Array(byteNums);
      var blob = new Blob([byteArr], { type: mime || 'audio/mpeg' });
      return URL.createObjectURL(blob);
    } catch(e) {
      try { console.debug('[voice-lab] b64 decode fail'); } catch(_) {}
      return '';
    }
  }

  /* ── preview 생성 ── */
  async function vdElCreatePreviews(prompt, sampleText) {
    var key = _getElKey();
    if (!key) throw new Error('ElevenLabs 키 없음 — 통합 API 설정에서 등록해주세요.');
    if (!prompt || prompt.length < 20) throw new Error('voice description 이 너무 짧습니다 (최소 20자).');

    try { console.debug('[voice-lab] provider:', 'elevenlabs'); console.debug('[voice-lab] prompt length:', prompt.length); } catch(_) {}

    var body = {
      voice_description: prompt,
      text: sampleText || 'This is a sample text to evaluate the voice character.',
    };
    var r = await fetch('https://api.elevenlabs.io/v1/text-to-voice/create-previews', {
      method:'POST',
      headers:{ 'xi-api-key': key, 'Content-Type':'application/json', 'Accept':'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      var msg = '';
      try { msg = (await r.json()).detail && (await r.json()).detail.message; } catch(_) {}
      throw new Error('ElevenLabs Voice Design HTTP ' + r.status + (msg?' — '+msg:''));
    }
    var data = await r.json();
    var previews = (data && data.previews) || [];
    try { console.debug('[voice-lab] preview count:', previews.length); } catch(_) {}

    return previews.map(function(p, i){
      var audioUrl = '';
      if (p.audio_base_64) audioUrl = _b64ToBlobUrl(p.audio_base_64, p.media_type || 'audio/mpeg');
      return {
        generatedVoiceId: p.generated_voice_id || ('preview_' + i),
        audioUrl: audioUrl,
        description: p.text || prompt,
        provider: 'elevenlabs',
        status: 'preview',
        index: i,
      };
    });
  }
  window.vdElCreatePreviews = vdElCreatePreviews;

  /* ── 선택한 preview 를 실제 voice 로 저장 ── */
  async function vdElCreateVoiceFromPreview(generatedVoiceId, voiceName, voiceDescription) {
    var key = _getElKey();
    if (!key) throw new Error('ElevenLabs 키 없음.');
    if (!generatedVoiceId) throw new Error('generated_voice_id 가 없습니다.');
    if (!voiceName || voiceName.trim().length < 2) throw new Error('voice 이름을 2자 이상 입력해주세요.');

    var body = {
      voice_name: voiceName.trim(),
      voice_description: voiceDescription || '',
      generated_voice_id: generatedVoiceId,
    };
    var r = await fetch('https://api.elevenlabs.io/v1/text-to-voice/create-voice-from-preview', {
      method:'POST',
      headers:{ 'xi-api-key': key, 'Content-Type':'application/json', 'Accept':'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      var msg = '';
      try { msg = (await r.json()).detail && (await r.json()).detail.message; } catch(_) {}
      throw new Error('ElevenLabs voice save HTTP ' + r.status + (msg?' — '+msg:''));
    }
    var data = await r.json();
    var saved = {
      provider: 'elevenlabs',
      voiceId:  data.voice_id || data.voiceId,
      voiceName: data.name || voiceName,
      voiceDescription: voiceDescription,
      labels: data.labels || {},
      createdAt: new Date().toISOString(),
      source: 'voice_design',
    };
    try { console.debug('[voice-lab] saved voiceId exists:', !!saved.voiceId); } catch(_) {}
    return saved;
  }
  window.vdElCreateVoiceFromPreview = vdElCreateVoiceFromPreview;

  /* ── 키 보유 여부 (UI 게이트용) ── */
  window.vdElHasKey = function() {
    return !!_getElKey();
  };
})();
