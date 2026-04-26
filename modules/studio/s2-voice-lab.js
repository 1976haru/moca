/* ================================================
   modules/studio/s2-voice-lab.js
   STEP 3 — 프롬프트 음성 제작소 (Voice Lab) UI

   * 두 sub-mode:
     - 'el_design'   ElevenLabs 새 음성 만들기 (text-to-voice)
     - 'oa_instr'    OpenAI 기존 voice + instructions 연기 프리셋
   * 의존:
     s2-voice-safety.js (vsfCheck)
     s2-voice-prompt-presets.js (VPP_PURPOSE_PRESETS / vppBuildAutoPrompt / vppPickSampleText)
     s2-voice-design-elevenlabs.js (vdElCreatePreviews / vdElCreateVoiceFromPreview)
     s2-voice-instructions-openai.js (voInsListBaseVoices / voInsPreview / voInsCallTts)
     s2-voice-library.js (vlbAddElevenlabsVoice / vlbAddOpenAiPreset / vlbAsCandidates)
   ================================================ */
(function(){
  'use strict';

  var VL_STATE = {
    mode:     'el_design', /* 'el_design' | 'oa_instr' */
    presetId: 'senior_info',
    spec:     {
      gender:'female_tone', age:'mature', energy:'mid', speed:'mid',
      emotion:'calm', usage:'shorts', lang:'ko',
    },
    prompt:    '',
    promptOverride: false,
    /* EL design state */
    elPreviews:  [],   /* [{generatedVoiceId, audioUrl, description}] */
    elBusy:      false,
    elError:     '',
    elSelected:  null, /* {generatedVoiceId, ...} */
    elSaveName:  '',
    /* OA instr state */
    oaBaseVoice:    'alloy',
    oaInstructions: '',
    oaPreviewBusy:  false,
    oaError:        '',
    oaPresetName:   '',
  };
  window.VL_STATE = VL_STATE;

  /* ════════════════════════════════════════════════
     메인 패널 렌더
     ════════════════════════════════════════════════ */
  window.vlRenderPanel = function() {
    _vlInjectCSS();
    var modeBtns = ''+
      '<button type="button" class="vl-mode '+(VL_STATE.mode==='el_design'?'on':'')+'" '+
        'onclick="vlSetMode(\'el_design\')">🎙 ElevenLabs 새 음성 만들기</button>'+
      '<button type="button" class="vl-mode '+(VL_STATE.mode==='oa_instr'?'on':'')+'" '+
        'onclick="vlSetMode(\'oa_instr\')">🤖 OpenAI 연기 지시 프리셋</button>';

    var hint = (typeof window.vsfRenderHint === 'function') ? window.vsfRenderHint() : '';
    var presetCards = _vlRenderPresetCards();
    var specPanel   = _vlRenderSpecPanel();
    var promptEditor = _vlRenderPromptEditor();
    var modeBody = (VL_STATE.mode === 'el_design') ? _vlRenderElBody() : _vlRenderOaBody();

    return ''+
    '<div class="vl-wrap">'+
      '<div class="vl-mode-row">'+modeBtns+'</div>'+
      hint+
      '<div class="vl-section">'+
        '<div class="vl-sec-hd">🎯 목적 선택</div>'+
        presetCards+
      '</div>'+
      '<div class="vl-section">'+
        '<div class="vl-sec-hd">🎚 음성 특성</div>'+
        specPanel+
      '</div>'+
      '<div class="vl-section">'+
        '<div class="vl-sec-hd">📝 voice 설명 프롬프트</div>'+
        promptEditor+
      '</div>'+
      '<div class="vl-section">'+
        modeBody+
      '</div>'+
    '</div>';
  };

  /* ── 목적 카드 ── */
  function _vlRenderPresetCards() {
    var presets = window.VPP_PURPOSE_PRESETS || [];
    return '<div class="vl-preset-grid">' + presets.map(function(p){
      var on = VL_STATE.presetId === p.id;
      return '<div class="vl-preset-card '+(on?'on':'')+'" onclick="vlPickPreset(\''+p.id+'\')">'+
        '<div class="vl-preset-label">'+p.label+'</div>'+
        '<div class="vl-preset-desc">'+p.desc+'</div>'+
      '</div>';
    }).join('') + '</div>';
  }

  /* ── spec 패널 ── */
  function _vlRenderSpecPanel() {
    var s = VL_STATE.spec;
    function seg(key, label, opts) {
      return '<div class="vl-spec-row"><span class="vl-spec-label">'+label+'</span><div class="vl-spec-seg">' +
        opts.map(function(o){
          var on = s[key] === o[0];
          return '<button type="button" class="vl-spec-btn '+(on?'on':'')+'" onclick="vlSetSpec(\''+key+'\',\''+o[0]+'\')">'+o[1]+'</button>';
        }).join('') +
      '</div></div>';
    }
    return '<div class="vl-spec-panel">'+
      seg('gender', '톤',     [['male_tone','남성톤'],['female_tone','여성톤'],['neutral_tone','중성톤'],['unknown','미확인']]) +
      seg('age',    '연령',   [['young','청년'],['adult','성인'],['mature','중년'],['senior','시니어']]) +
      seg('energy', '에너지', [['low','낮음'],['mid','보통'],['high','높음']]) +
      seg('speed',  '속도',   [['slow','느림'],['mid','보통'],['fast','빠름']]) +
      seg('emotion','감정',   [['calm','차분'],['warm','따뜻'],['comic','코믹'],['trust','신뢰'],['tense','긴장'],['bright','밝음'],['documentary','다큐']]) +
      seg('usage',  '사용처', [['shorts','숏츠'],['longform','롱폼'],['ad','광고'],['explain','설명'],['character','캐릭터'],['news','뉴스']]) +
      seg('lang',   '언어',   [['ko','한국어'],['ja','일본어'],['both','한·일'],['multi','다국어']]) +
    '</div>';
  }

  /* ── 프롬프트 편집기 ── */
  function _vlRenderPromptEditor() {
    var current = VL_STATE.promptOverride
      ? VL_STATE.prompt
      : (_vlComputePrompt());
    var safe = '';
    if (current && typeof window.vsfCheck === 'function') {
      var chk = window.vsfCheck(current);
      if (!chk.ok) {
        safe = '<div class="vl-safe-fail">⚠️ 안전 정책 위반: '+chk.reasons.join(', ')+'<br>'+
               '제안: <code>'+_esc(chk.suggestion)+'</code></div>';
      }
    }
    return '<div class="vl-prompt-edit">'+
      '<textarea class="vl-prompt-ta" rows="3" placeholder="voice description (영문 권장)" '+
        'oninput="vlSetPrompt(this.value)">'+_esc(current)+'</textarea>'+
      '<div class="vl-prompt-actions">'+
        '<button type="button" class="vl-btn" onclick="vlAutoFillPrompt()">↻ 자동 생성</button>'+
        '<span class="vl-prompt-info">💡 비용 발생 가능 — preview 와 실제 voice 저장은 별도 단계</span>'+
      '</div>'+
      safe+
    '</div>';
  }

  function _vlComputePrompt() {
    var presets = window.VPP_PURPOSE_PRESETS || [];
    var p = presets.find(function(x){ return x.id === VL_STATE.presetId; });
    if (p && p.prompt) return p.prompt;
    if (typeof window.vppBuildAutoPrompt === 'function') {
      return window.vppBuildAutoPrompt(VL_STATE.spec);
    }
    return '';
  }

  /* ── ElevenLabs 영역 ── */
  function _vlRenderElBody() {
    var hasKey = (typeof window.vdElHasKey === 'function') && window.vdElHasKey();
    if (!hasKey) {
      return '<div class="vl-sec-hd">🎙 ElevenLabs Voice Design</div>'+
        '<div class="vl-warn">⚠️ ElevenLabs API 키가 없습니다. '+
          '<button type="button" class="vl-btn" onclick="window.openApiSettingsModal && window.openApiSettingsModal(\'voice\')">🔑 통합 API 설정 열기</button>'+
        '</div>';
    }
    var statusHtml = '';
    if (VL_STATE.elBusy) statusHtml = '<div class="vl-status loading">⏳ 음성 후보 생성 중...</div>';
    else if (VL_STATE.elError) statusHtml = '<div class="vl-status err">❌ '+_esc(VL_STATE.elError)+'</div>';
    else if (VL_STATE.elPreviews.length) statusHtml = '<div class="vl-status ok">✅ 후보 '+VL_STATE.elPreviews.length+'개 생성 완료</div>';

    var previewsHtml = VL_STATE.elPreviews.map(function(p, i){
      var on = VL_STATE.elSelected && VL_STATE.elSelected.generatedVoiceId === p.generatedVoiceId;
      var audio = p.audioUrl ? '<audio controls preload="none" src="'+_escAttr(p.audioUrl)+'" class="vl-audio"></audio>' : '<i class="vl-no-audio">audio 없음</i>';
      return '<div class="vl-prev-card '+(on?'on':'')+'">'+
        '<div class="vl-prev-hd"><span>후보 '+(i+1)+'</span>'+
          '<button type="button" class="vl-btn small" onclick="vlPickElPreview(\''+p.generatedVoiceId+'\')">'+(on?'✅ 선택됨':'선택')+'</button>'+
        '</div>'+
        audio+
      '</div>';
    }).join('');

    var saveBlock = '';
    if (VL_STATE.elSelected) {
      saveBlock = '<div class="vl-save-block">'+
        '<input type="text" class="vl-name-input" placeholder="저장할 voice 이름 (2자 이상)" '+
          'value="'+_escAttr(VL_STATE.elSaveName)+'" oninput="VL_STATE.elSaveName=this.value">'+
        '<button type="button" class="vl-btn pri" onclick="vlSaveElVoice()">💾 이 음성 저장</button>'+
      '</div>';
    }

    return '<div class="vl-sec-hd">🎙 ElevenLabs Voice Design</div>'+
      '<div class="vl-actions">'+
        '<button type="button" class="vl-btn pri" '+(VL_STATE.elBusy?'disabled':'')+' onclick="vlGenerateElPreviews()">▶ 후보 음성 생성</button>'+
      '</div>'+
      statusHtml+
      (previewsHtml ? '<div class="vl-prev-grid">'+previewsHtml+'</div>' : '')+
      saveBlock;
  }

  /* ── OpenAI 영역 ── */
  function _vlRenderOaBody() {
    var voices = (typeof window.voInsListBaseVoices === 'function') ? window.voInsListBaseVoices() : [];
    var voiceOpts = voices.map(function(v){
      var sel = v.voiceId === VL_STATE.oaBaseVoice ? ' selected' : '';
      var label = v.displayName + ' · ' + (v.voiceToneGender || 'unknown');
      return '<option value="'+v.voiceId+'"'+sel+'>'+_esc(label)+'</option>';
    }).join('');

    var statusHtml = '';
    if (VL_STATE.oaPreviewBusy) statusHtml = '<div class="vl-status loading">⏳ 미리듣기 생성 중...</div>';
    else if (VL_STATE.oaError) statusHtml = '<div class="vl-status err">❌ '+_esc(VL_STATE.oaError)+'</div>';

    return '<div class="vl-sec-hd">🤖 OpenAI 연기 지시 프리셋</div>'+
      '<div class="vl-oa-row">'+
        '<label class="vl-oa-label">base voice</label>'+
        '<select class="vl-oa-select" onchange="VL_STATE.oaBaseVoice=this.value">'+voiceOpts+'</select>'+
      '</div>'+
      '<div class="vl-oa-row vl-oa-instr">'+
        '<label class="vl-oa-label">instructions</label>'+
        '<textarea class="vl-oa-ta" rows="3" placeholder="예: 차분하고 따뜻한 톤으로, 중요한 단어는 또렷하게 강조하며 천천히 말하세요." '+
          'oninput="VL_STATE.oaInstructions=this.value">'+_esc(VL_STATE.oaInstructions)+'</textarea>'+
      '</div>'+
      '<div class="vl-actions">'+
        '<button type="button" class="vl-btn" '+(VL_STATE.oaPreviewBusy?'disabled':'')+' onclick="vlPreviewOa()">▶ 미리듣기</button>'+
        '<input type="text" class="vl-name-input" placeholder="저장할 프리셋 이름" '+
          'value="'+_escAttr(VL_STATE.oaPresetName)+'" oninput="VL_STATE.oaPresetName=this.value" style="flex:1;min-width:160px">'+
        '<button type="button" class="vl-btn pri" onclick="vlSaveOaPreset()">💾 프리셋 저장</button>'+
      '</div>'+
      statusHtml+
      '<div class="vl-info">💡 instructions 는 gpt-4o-mini-tts 등 지원 모델에서만 적용됩니다. 미지원 시 기본 voice 로 fallback 후 안내합니다.</div>';
  }

  /* ════════════════════════════════════════════════
     액션
     ════════════════════════════════════════════════ */
  window.vlSetMode = function(m) { VL_STATE.mode = m; _vlRefresh(); };
  window.vlPickPreset = function(id) {
    VL_STATE.presetId = id;
    var p = (window.VPP_PURPOSE_PRESETS || []).find(function(x){ return x.id === id; });
    if (p) {
      if (p.lang) VL_STATE.spec.lang = p.lang;
      if (p.tone) VL_STATE.spec.emotion = (p.tone === 'warm' ? 'warm' : p.tone === 'energetic' ? 'comic' : p.tone === 'documentary' ? 'documentary' : p.tone === 'news' ? 'trust' : 'calm');
      if (p.age)  VL_STATE.spec.age = p.age;
      VL_STATE.promptOverride = false;
      VL_STATE.prompt = p.prompt || '';
    }
    _vlRefresh();
  };
  window.vlSetSpec = function(key, val) {
    VL_STATE.spec[key] = val;
    if (!VL_STATE.promptOverride) VL_STATE.prompt = _vlComputePrompt();
    _vlRefresh();
  };
  window.vlSetPrompt = function(v) {
    VL_STATE.prompt = v;
    VL_STATE.promptOverride = true;
  };
  window.vlAutoFillPrompt = function() {
    VL_STATE.promptOverride = false;
    VL_STATE.prompt = _vlComputePrompt();
    _vlRefresh();
  };

  /* ── ElevenLabs 액션 ── */
  window.vlGenerateElPreviews = async function() {
    var prompt = VL_STATE.prompt || _vlComputePrompt();
    if (!prompt || prompt.length < 20) { _vlToast('⚠️ voice description 이 너무 짧습니다.', 'warn'); return; }
    var chk = (typeof window.vsfCheck === 'function') ? window.vsfCheck(prompt) : { ok:true };
    if (!chk.ok) {
      _vlToast('⚠️ 안전 정책 위반: 제안 문구로 수정해주세요.', 'warn');
      VL_STATE.prompt = chk.suggestion; VL_STATE.promptOverride = true;
      _vlRefresh(); return;
    }
    if (typeof window.vdElCreatePreviews !== 'function') {
      _vlToast('⚠️ ElevenLabs Voice Design 모듈 미로드', 'warn'); return;
    }
    VL_STATE.elBusy = true; VL_STATE.elError = ''; VL_STATE.elPreviews = []; VL_STATE.elSelected = null;
    _vlRefresh();
    try {
      var sample = (typeof window.vppPickSampleText === 'function')
                   ? window.vppPickSampleText(VL_STATE.spec.lang, VL_STATE.spec.emotion)
                   : '안녕하세요. 이 목소리로 영상을 만듭니다.';
      var previews = await window.vdElCreatePreviews(prompt, sample);
      VL_STATE.elPreviews = previews;
      _vlToast('✅ 후보 ' + previews.length + '개 생성 완료', 'success');
    } catch (e) {
      VL_STATE.elError = (e && e.message) || String(e);
      _vlToast('❌ ' + VL_STATE.elError, 'error');
    }
    VL_STATE.elBusy = false;
    _vlRefresh();
  };

  window.vlPickElPreview = function(genId) {
    var p = VL_STATE.elPreviews.find(function(x){ return x.generatedVoiceId === genId; });
    VL_STATE.elSelected = p || null;
    _vlRefresh();
  };

  window.vlSaveElVoice = async function() {
    if (!VL_STATE.elSelected) { _vlToast('⚠️ preview 를 먼저 선택해주세요.', 'warn'); return; }
    if (!VL_STATE.elSaveName || VL_STATE.elSaveName.trim().length < 2) {
      _vlToast('⚠️ voice 이름을 2자 이상 입력해주세요.', 'warn'); return;
    }
    if (typeof window.vdElCreateVoiceFromPreview !== 'function') {
      _vlToast('⚠️ Voice Design 모듈 미로드', 'warn'); return;
    }
    try {
      var saved = await window.vdElCreateVoiceFromPreview(
        VL_STATE.elSelected.generatedVoiceId,
        VL_STATE.elSaveName.trim(),
        VL_STATE.prompt || ''
      );
      saved.voiceToneGender = VL_STATE.spec.gender;
      saved.ageTone = VL_STATE.spec.age;
      saved.styleTags = [VL_STATE.spec.emotion, VL_STATE.spec.usage].filter(Boolean);
      if (typeof window.vlbAddElevenlabsVoice === 'function') {
        window.vlbAddElevenlabsVoice(saved);
      }
      _vlToast('✅ 음성 저장 완료 — 수동 선택/최근 사용에서 사용 가능', 'success');
      VL_STATE.elSelected = null; VL_STATE.elSaveName = '';
      _vlRefresh();
    } catch (e) {
      _vlToast('❌ 저장 실패: ' + ((e && e.message) || e), 'error');
    }
  };

  /* ── OpenAI 액션 ── */
  window.vlPreviewOa = async function() {
    if (typeof window.voInsPreview !== 'function') {
      _vlToast('⚠️ OpenAI 모듈 미로드', 'warn'); return;
    }
    var instr = VL_STATE.oaInstructions || '';
    var chk = (typeof window.vsfCheck === 'function') ? window.vsfCheck(instr) : { ok:true };
    if (!chk.ok) {
      _vlToast('⚠️ instructions 에 금지 표현이 있습니다.', 'warn');
      VL_STATE.oaInstructions = chk.suggestion;
      _vlRefresh(); return;
    }
    VL_STATE.oaPreviewBusy = true; VL_STATE.oaError = '';
    _vlRefresh();
    try {
      var sample = (typeof window.vppPickSampleText === 'function')
                   ? window.vppPickSampleText(VL_STATE.spec.lang, VL_STATE.spec.emotion)
                   : '안녕하세요.';
      var res = await window.voInsPreview(VL_STATE.oaBaseVoice, instr, sample);
      if (res && res.instructionsApplied === false && instr) {
        _vlToast('ℹ️ instructions 미적용 — 모델이 지원하지 않아 기본 voice 로 재생', 'info');
      }
    } catch (e) {
      VL_STATE.oaError = (e && e.message) || String(e);
      _vlToast('❌ ' + VL_STATE.oaError, 'error');
    }
    VL_STATE.oaPreviewBusy = false;
    _vlRefresh();
  };

  window.vlSaveOaPreset = function() {
    if (!VL_STATE.oaInstructions || VL_STATE.oaInstructions.trim().length < 5) {
      _vlToast('⚠️ instructions 를 5자 이상 입력해주세요.', 'warn'); return;
    }
    if (!VL_STATE.oaPresetName || VL_STATE.oaPresetName.trim().length < 2) {
      _vlToast('⚠️ 프리셋 이름을 입력해주세요.', 'warn'); return;
    }
    if (typeof window.vlbAddOpenAiPreset !== 'function') {
      _vlToast('⚠️ 라이브러리 모듈 미로드', 'warn'); return;
    }
    var preset = {
      voiceId: VL_STATE.oaBaseVoice,
      instructions: VL_STATE.oaInstructions.trim(),
      voiceName: VL_STATE.oaPresetName.trim(),
      voiceToneGender: VL_STATE.spec.gender,
      ageTone: VL_STATE.spec.age,
      styleTags: [VL_STATE.spec.emotion, VL_STATE.spec.usage].filter(Boolean),
      model: 'gpt-4o-mini-tts',
    };
    window.vlbAddOpenAiPreset(preset);
    _vlToast('✅ 프리셋 저장 완료 — 수동 선택/최근 사용에서 사용 가능', 'success');
    VL_STATE.oaPresetName = '';
    _vlRefresh();
  };

  /* ════════════════════════════════════════════════
     refresh / helpers
     ════════════════════════════════════════════════ */
  function _vlRefresh() {
    var host = document.getElementById('vlPanelHost');
    if (host) { host.innerHTML = vlRenderPanel(); return; }
    if (typeof window._studioS2Step === 'function') window._studioS2Step();
  }
  window._vlRefresh = _vlRefresh;

  function _vlToast(msg, kind) {
    if (typeof window.ucShowToast === 'function') window.ucShowToast(msg, kind || 'info');
    else try { console.debug('[voice-lab]', msg); } catch(_) {}
  }

  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function _escAttr(s){ return String(s == null ? '' : s).replace(/"/g,'&quot;').replace(/'/g, "\\'"); }

  function _vlInjectCSS() {
    if (document.getElementById('vl-style')) return;
    var st = document.createElement('style');
    st.id = 'vl-style';
    st.textContent = ''+
'.vl-wrap{display:flex;flex-direction:column;gap:10px}'+
'.vl-mode-row{display:flex;gap:6px;border-bottom:1.5px solid #f1dce7;padding-bottom:0}'+
'.vl-mode{padding:8px 14px;border:none;background:transparent;font-size:12px;font-weight:800;color:#9b8a93;cursor:pointer;border-bottom:2px solid transparent;transition:.14s;font-family:inherit}'+
'.vl-mode:hover{color:#9181ff}'+
'.vl-mode.on{color:#ef6fab;border-bottom-color:#ef6fab}'+
'.vl-section{background:#fff;border:1.5px solid #f1dce7;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:8px}'+
'.vl-sec-hd{font-size:12px;font-weight:800;color:#5b1a4a}'+
'.vl-preset-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}'+
'.vl-preset-card{padding:8px 10px;border:1.5px solid #f1dce7;border-radius:10px;background:#fff;cursor:pointer;transition:.12s}'+
'.vl-preset-card:hover{border-color:#9181ff;background:#fbf7ff}'+
'.vl-preset-card.on{border-color:#ef6fab;background:linear-gradient(135deg,#fff5fa,#f5f0ff);box-shadow:0 2px 8px rgba(239,111,171,.15)}'+
'.vl-preset-label{font-size:12px;font-weight:800;color:#2b2430;margin-bottom:2px}'+
'.vl-preset-desc{font-size:10.5px;color:#7b6080;line-height:1.4}'+
'.vl-spec-panel{display:flex;flex-direction:column;gap:5px}'+
'.vl-spec-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'+
'.vl-spec-label{font-size:11px;font-weight:700;color:#5a4a56;min-width:60px}'+
'.vl-spec-seg{display:flex;gap:4px;flex-wrap:wrap;flex:1}'+
'.vl-spec-btn{padding:4px 10px;border:1.5px solid #f1dce7;border-radius:8px;background:#fff;font-size:11px;font-weight:700;color:#7b7077;cursor:pointer;font-family:inherit;transition:.12s}'+
'.vl-spec-btn:hover{border-color:#9181ff;color:#9181ff}'+
'.vl-spec-btn.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}'+
'.vl-prompt-edit{display:flex;flex-direction:column;gap:6px}'+
'.vl-prompt-ta{width:100%;border:1.5px solid #f1dce7;border-radius:8px;padding:8px 12px;font-size:12px;font-family:inherit;line-height:1.5;resize:vertical;min-height:60px}'+
'.vl-prompt-ta:focus{outline:none;border-color:#9181ff}'+
'.vl-prompt-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'+
'.vl-prompt-info{font-size:10.5px;color:#9b8a93;flex:1}'+
'.vl-safe-fail{background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;border-radius:8px;padding:8px 10px;font-size:11px}'+
'.vl-safe-fail code{background:#fff;padding:2px 6px;border-radius:4px;color:#7b1d1d;font-family:monospace}'+
'.vl-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}'+
'.vl-btn{padding:7px 14px;border:1.5px solid #f1dce7;border-radius:10px;background:#fff;color:#5a4a56;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit;transition:.12s}'+
'.vl-btn:hover:not(:disabled){border-color:#9181ff;color:#9181ff}'+
'.vl-btn:disabled{opacity:.5;cursor:not-allowed}'+
'.vl-btn.pri{border:none;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff}'+
'.vl-btn.pri:hover:not(:disabled){opacity:.92;color:#fff}'+
'.vl-btn.small{padding:4px 10px;font-size:10.5px}'+
'.vl-status{padding:6px 12px;border-radius:8px;font-size:11.5px;font-weight:700}'+
'.vl-status.loading{background:#eef5ff;color:#2b66c4}'+
'.vl-status.err{background:#fee2e2;color:#991b1b}'+
'.vl-status.ok{background:#dcfce7;color:#166534}'+
'.vl-prev-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}'+
'.vl-prev-card{border:1.5px solid #f1dce7;border-radius:10px;padding:8px 10px;background:#fafafe;display:flex;flex-direction:column;gap:6px}'+
'.vl-prev-card.on{border-color:#ef6fab;background:linear-gradient(135deg,#fff5fa,#f5f0ff)}'+
'.vl-prev-hd{display:flex;justify-content:space-between;align-items:center;font-size:11.5px;font-weight:800}'+
'.vl-audio{width:100%;height:32px}'+
'.vl-no-audio{font-size:10.5px;color:#9b8a93}'+
'.vl-save-block{display:flex;gap:6px;flex-wrap:wrap;align-items:center;background:#fbf7ff;border:1px solid #e8d9f5;border-radius:8px;padding:8px}'+
'.vl-name-input{flex:1;min-width:160px;border:1.5px solid #f1dce7;border-radius:8px;padding:6px 10px;font-size:12px;font-family:inherit}'+
'.vl-name-input:focus{outline:none;border-color:#9181ff}'+
'.vl-warn{background:#fef3c7;border:1px solid #fcd34d;color:#92400e;border-radius:8px;padding:10px 12px;font-size:11.5px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}'+
'.vl-info{font-size:10.5px;color:#9b8a93;background:#fafafe;padding:6px 10px;border-radius:8px}'+
'.vl-oa-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'+
'.vl-oa-row.vl-oa-instr{align-items:flex-start}'+
'.vl-oa-label{font-size:11px;font-weight:700;color:#5a4a56;min-width:80px}'+
'.vl-oa-select{flex:1;min-width:160px;border:1.5px solid #f1dce7;border-radius:8px;padding:6px 10px;font-size:12px;font-family:inherit}'+
'.vl-oa-ta{flex:1;min-width:200px;border:1.5px solid #f1dce7;border-radius:8px;padding:8px 12px;font-size:12px;font-family:inherit;line-height:1.5;resize:vertical}'+
'.vl-oa-ta:focus{outline:none;border-color:#9181ff}'+
'';
    document.head.appendChild(st);
  }
})();
