/* ================================================
   modules/agents/agent-cost-api.js
   비용/API 추천 에이전트
   * provider 선택 상태 / 키 저장 여부 / 고비용 API 과다 사용 / 대체 추천
   * 외부 API 호출 없음 — 로컬 설정만 검사
   ================================================ */
(function(){
  'use strict';

  /* 일반적으로 알려진 provider 비용 등급 (휴리스틱) */
  var COST_TIER = {
    /* 이미지 — high cost */
    'dalle': 'high', 'dalle3': 'high', 'dall-e-3': 'high',
    'flux': 'high', 'flux-pro': 'high', 'imagen': 'high', 'midjourney': 'high',
    /* 이미지 — mid */
    'gemini': 'mid', 'sd': 'mid', 'sdxl': 'mid', 'stable-diffusion': 'mid',
    /* 이미지 — low/free */
    'pexels': 'low', 'pixabay': 'low', 'unsplash': 'low', 'stock': 'low',
    /* 영상 — high */
    'veo': 'high', 'veo3': 'high', 'sora': 'high', 'kling': 'high', 'runway': 'high',
    'magiclight': 'mid', 'magic-light': 'mid',
    /* TTS */
    'elevenlabs': 'high', 'openai-tts': 'mid', 'gemini-tts': 'mid',
    'edge-tts': 'low', 'web-speech': 'low', 'browser': 'low',
  };

  /* 키 저장 여부 휴리스틱 — 자주 쓰이는 LS 키 prefix */
  var KEY_LS_KEYS = [
    'api_key_v10', 'openai_api_key_v30', 'gemini_api_key_v30',
    'uc_claude_key', 'uc_openai_key', 'uc_gemini_key',
    'elevenlabs_api_key', 'pexels_api_key', 'flux_api_key',
    'dalle_api_key', 'magiclight_api_key',
  ];

  function _hasAnyKeyStored(prefixes) {
    try {
      for (var i = 0; i < KEY_LS_KEYS.length; i++) {
        if (localStorage.getItem(KEY_LS_KEYS[i])) return true;
      }
    } catch(_){}
    return false;
  }

  function _provider(p, kind) {
    if (!p) return '';
    var s2 = p.s2 || {}, s3 = p.s3 || {};
    if (kind === 'image') return s3.imageProvider || s3.provider || s3.imgProvider || '';
    if (kind === 'voice') return s2.voiceProvider || s2.provider || s2.tts || '';
    if (kind === 'video') return s3.videoProvider || s3.vidProvider || '';
    return '';
  }
  function _tier(name) {
    var s = String(name || '').toLowerCase();
    for (var k in COST_TIER) if (Object.prototype.hasOwnProperty.call(COST_TIER, k)) {
      if (s.indexOf(k) >= 0) return COST_TIER[k];
    }
    return '';
  }

  function run(project) {
    var p = project;
    var M = window.MocaAgents;
    var scenes = M._scenes(p);
    var issues = [], suggestions = [], nextActions = [];
    var score = 100;

    var imgProv   = _provider(p, 'image');
    var voiceProv = _provider(p, 'voice');
    var vidProv   = _provider(p, 'video');

    /* 1) provider 선택 여부 */
    if (!imgProv) {
      score -= 10;
      issues.push({ code: 'NO_IMG_PROVIDER', message: '이미지 provider 가 선택되지 않았습니다.' });
      nextActions.push({ label: 'Step 2 이미지 설정으로 이동', step: 2 });
    }
    if (!voiceProv) {
      score -= 10;
      issues.push({ code: 'NO_VOICE_PROVIDER', message: '음성 provider 가 선택되지 않았습니다.' });
      nextActions.push({ label: 'Step 3 음성 설정으로 이동', step: 3 });
    }
    if (!vidProv && scenes.some(function(s){ return s.useVideo || s.videoUrl; })) {
      score -= 5;
      issues.push({ code: 'NO_VID_PROVIDER', message: '영상 provider 가 선택되지 않았는데 영상 사용 씬이 있습니다.' });
      nextActions.push({ label: 'Step 2 영상 설정으로 이동', step: 2 });
    }

    /* 2) 키 저장 여부 */
    if (!_hasAnyKeyStored()) {
      score -= 15;
      issues.push({ code: 'NO_API_KEY',
        message: 'API 키가 저장돼 있지 않습니다. 일부 provider 는 키 없이 동작하지 않습니다.' });
      suggestions.push('설정 → 🔑 AI 연결 에서 사용할 provider 의 API 키를 먼저 저장하세요.');
    }

    /* 3) 고비용 API 과다 사용 — 모든 씬에 high tier 이미지 provider 면 경고 */
    if (imgProv && _tier(imgProv) === 'high' && scenes.length >= 4) {
      score -= 10;
      issues.push({ code: 'COST_HIGH_IMG',
        message: '모든 이미지를 고비용 API (' + imgProv + ') 로 생성 중입니다. 씬 ' + scenes.length + '개 기준 비용이 누적됩니다.' });
      suggestions.push('일반/배경 씬은 Pexels/Gemini, 핵심/인물 씬만 Flux/DALL-E 3 로 분기하세요. ' +
        '이미지 보드에서 씬별 provider 를 다르게 지정할 수 있습니다.');
    }
    if (vidProv && _tier(vidProv) === 'high' && scenes.length >= 4) {
      score -= 10;
      issues.push({ code: 'COST_HIGH_VID',
        message: '모든 영상을 고비용 API (' + vidProv + ') 로 생성 중입니다. 씬 ' + scenes.length + '개 → 비용 큼.' });
      suggestions.push('정적 씬은 이미지 + Ken Burns, 동적 씬만 Veo/Kling/Runway 로 분기하세요.');
    }
    if (voiceProv && _tier(voiceProv) === 'high') {
      score -= 5;
      suggestions.push('ElevenLabs 같은 고품질 TTS 는 핵심 hook/CTA 만 사용하고, 나머지는 OpenAI/Gemini TTS 로 비용 절감 가능합니다.');
    }

    /* 4) 비용 추정 — 단순 카운트 (실제 비용은 provider 별 단가에 따라 다름) */
    var roughCost = 0;
    var imgN = scenes.length, vidN = scenes.filter(function(s){ return s.useVideo || s.videoUrl; }).length;
    if (_tier(imgProv) === 'high') roughCost += imgN * 4;          /* ~$0.04/이미지 추정 단위 */
    else if (_tier(imgProv) === 'mid') roughCost += imgN * 1;
    if (_tier(vidProv) === 'high') roughCost += vidN * 80;          /* ~$0.80/영상 클립 단위 */
    else if (_tier(vidProv) === 'mid') roughCost += vidN * 30;
    if (_tier(voiceProv) === 'high') roughCost += 10;               /* TTS 1회 ~$0.10 */

    var summary = '이미지 ' + (imgProv || '미설정') + ' (' + (_tier(imgProv) || '?') + ') · ' +
                  '영상 ' + (vidProv || '미설정') + ' (' + (_tier(vidProv) || '?') + ') · ' +
                  '음성 ' + (voiceProv || '미설정') + ' (' + (_tier(voiceProv) || '?') + ')' +
                  ' · 추정 단가 합 ~' + roughCost.toFixed(0) + ' (단위, 실제 비용과 다름)';

    /* 비용 정보가 부족하면 너무 낮게 평가하지 않도록 floor */
    if (score < 0) score = 0;
    if (!issues.length) suggestions.push('현재 provider 조합은 비용 효율이 양호합니다.');

    return {
      score: score,
      status: M.classify(score),
      issues: issues,
      suggestions: suggestions,
      nextActions: nextActions,
      summary: summary,
    };
  }

  if (window.MocaAgents) {
    window.MocaAgents.register('cost_api', '비용 / API 추천', run);
  }
})();
