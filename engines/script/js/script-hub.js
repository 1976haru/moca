/* ========================================================
   script-hub.js  --  변환허브 + 감동스토리 + 음악
   engines/script/index.html 에서 분리 (Phase 6 — hub)
   의존: script-common.js (escHtml), script-api.js (callAPI, getApiKey,
         isAsciiOnly, apiKeyMissingToast, AI_PROVIDER),
         script-gen.js (postProcessOutputText, OUT, MODE, ...),
         script-lyric.js (lyricData, switchLyricSub)
   ======================================================== */

/* ─── 변환허브 (ElevenLabs/InVideo/Riverside) ─── */
// ═══════════════════════════════════════
// 3. 변환허브 — 대본 수집 시스템
// ═══════════════════════════════════════

var HUB_SCRIPTS = [];        // {id, type, title, text, lang, created}
var HUB_FILTER = 'all';
var HUB_OUT_MODE = 'elevenlabs';
var HUB_SELECTED = null;

// 대본 허브에 저장
function saveToHub(type, text, lang) {
  if (!text || text.trim().length < 20) return;
  var title = text.split('\n')[0].replace(/[「」\[\]#*]/g,'').trim().slice(0,40) || type + ' 대본';
  var id = Date.now() + Math.random();
  var typeNames = {
    gen:'✨ 대본생성', batch:'🎬 통합생성', know:'🔬 전문지식',
    trivia:'🧩 잡학', drama:'🎭 숏드라마', saying:'📜 사자성어',
    humor:'😄 코믹유머', lyric:'🎵 가사'
  };
  HUB_SCRIPTS.unshift({
    id: id, type: type, typeName: typeNames[type] || type,
    title: title, text: text.trim(),
    lang: lang || 'kr',
    created: new Date().toLocaleString('ko-KR')
  });
  if (HUB_SCRIPTS.length > 20) HUB_SCRIPTS = HUB_SCRIPTS.slice(0, 20);
  renderHubList();
}

function filterHub(type, btn) {
  HUB_FILTER = type;
  document.querySelectorAll('.hub-filter-btn').forEach(function(b) { b.classList.remove('on'); });
  btn.classList.add('on');
  renderHubList();
}

function renderHubList() {
  var list = document.getElementById('hub-script-list');
  var empty = document.getElementById('hub-empty');
  if (!list) return;
  var filtered = HUB_FILTER === 'all' ? HUB_SCRIPTS : HUB_SCRIPTS.filter(function(s) { return s.type === HUB_FILTER; });
  if (!filtered.length) {
    list.innerHTML = '';
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';
  list.innerHTML = filtered.map(function(s) {
    var isSel = HUB_SELECTED && HUB_SELECTED.id === s.id;
    var preview = s.text.split('\n').filter(function(l) { return l.trim(); }).slice(1,3).join(' ');
    return '<div class="hub-script-item' + (isSel ? ' selected' : '') + '" onclick="selectHubScript(\'' + s.id + '\')">' +
      '<div class="hub-script-title">' + escHtml(s.title) + '</div>' +
      '<div class="hub-script-meta"><span>' + s.typeName + '</span><span>' + s.lang.toUpperCase() + '</span><span>' + s.created + '</span></div>' +
      '<div class="hub-script-preview">' + escHtml(preview) + '</div></div>';
  }).join('');
}

function selectHubScript(id) {
  HUB_SELECTED = HUB_SCRIPTS.find(function(s) { return s.id == id; });
  renderHubList();
  if (HUB_SELECTED) generateHubOutput();
}

function importLyricToHub() {
  if (typeof lyricData !== 'undefined' && lyricData.lyrics) {
    saveToHub('lyric', lyricData.lyrics, 'kr');
    alert('가사를 허브에 등록했습니다.');
  } else {
    alert('먼저 가사/음원 탭에서 가사를 생성해주세요.');
  }
}

function switchHubOut(mode) {
  HUB_OUT_MODE = mode;
  ['el','iv','rd'].forEach(function(k) {
    var t = document.getElementById('hub-tab-' + k);
    if (t) t.classList.remove('on');
  });
  var tabMap = { elevenlabs: 'el', invideo: 'iv', readable: 'rd' };
  var activeTab = document.getElementById('hub-tab-' + (tabMap[mode] || 'el'));
  if (activeTab) activeTab.classList.add('on');

  var elGuide = document.getElementById('hub-guide-elevenlabs');
  var ivGuide = document.getElementById('hub-guide-invideo');
  if (elGuide) elGuide.style.display = mode === 'elevenlabs' ? '' : 'none';
  if (ivGuide) ivGuide.style.display = mode === 'invideo' ? '' : 'none';

  var labelMap = {
    elevenlabs: '🎤 ELEVENLABS VOICE SCRIPT',
    invideo: '🎬 INVIDEO SCENE JSON',
    readable: '📄 읽기용 대본'
  };
  var labelEl = document.getElementById('hub-out-label');
  if (labelEl) labelEl.textContent = labelMap[mode] || '';

  if (HUB_SELECTED) generateHubOutput();
}

function generateHubOutput() {
  if (!HUB_SELECTED) {
    var el = document.getElementById('hub-out-text');
    if (el) el.textContent = '← 위에서 대본을 선택해주세요';
    return;
  }
  var out = '';
  if (HUB_OUT_MODE === 'elevenlabs') out = formatElevenLabs(HUB_SELECTED);
  else if (HUB_OUT_MODE === 'invideo') out = formatInVideo(HUB_SELECTED);
  else out = formatReadable(HUB_SELECTED);

  var el = document.getElementById('hub-out-text');
  if (el) el.textContent = out;
}

function regenerateHub() { generateHubOutput(); }

// ═══════════════════════════════════════
// 4. ElevenLabs 포맷 생성
// ═══════════════════════════════════════

function formatElevenLabs(script) {
  var narratorType = document.getElementById('hub-narrator') ? document.getElementById('hub-narrator').value : 'female-60s';
  var defaultEmotion = document.getElementById('hub-emotion') ? document.getElementById('hub-emotion').value : 'warm';
  var voiceId = document.getElementById('hub-voice-id') ? document.getElementById('hub-voice-id').value.trim() : '';

  var narratorMap = {
    'female-60s': { id: 'narrator', voice: 'Korean Female Senior', gender: 'female', age: 60 },
    'male-60s': { id: 'narrator', voice: 'Korean Male Senior', gender: 'male', age: 60 },
    'female-warm': { id: 'narrator', voice: 'Korean Female Warm', gender: 'female', age: 45 },
    'male-calm': { id: 'narrator', voice: 'Korean Male Expert', gender: 'male', age: 50 },
    'female-young': { id: 'narrator', voice: 'Korean Female Young', gender: 'female', age: 28 }
  };
  var narrator = narratorMap[narratorType] || narratorMap['female-60s'];

  var lines = script.text.split('\n').filter(function(l) { return l.trim(); });
  var result = [];

  // Header
  result.push('# ElevenLabs Voice Script');
  result.push('# Generated: ' + new Date().toLocaleString('ko-KR'));
  result.push('# Voice: ' + narrator.voice + (voiceId ? ' [ID: ' + voiceId + ']' : ''));
  result.push('# Channel Language: ' + script.lang.toUpperCase());
  result.push('');
  result.push('---METADATA---');
  result.push('title: ' + script.title);
  result.push('type: ' + (script.typeName || script.type));
  result.push('language: ' + script.lang);
  result.push('narrator_voice: ' + narrator.voice);
  if (voiceId) result.push('voice_id: ' + voiceId);
  result.push('');
  result.push('---SCRIPT---');
  result.push('');

  lines.forEach(function(line, i) {
    var trimmed = line.trim();
    if (!trimmed) return;

    // Detect speaker from line patterns
    var speaker = 'narrator';
    var emotion = defaultEmotion;
    var pace = 'normal';
    var pauseHint = '';

    // Tiki-taka detection
    if (/^[A-B측]:|^남:|^여:|^호스트:|^게스트:/.test(trimmed)) {
      var parts = trimmed.split(':');
      speaker = parts[0] === 'A측' || parts[0] === '남' || parts[0] === '호스트' ? 'male_1' : 'female_1';
      trimmed = parts.slice(1).join(':').trim();
    }

    // Hook lines (first 3 lines = high energy)
    if (i < 3) { emotion = 'urgent'; pace = 'normal'; }
    // Question lines
    if (/[？?]$/.test(trimmed)) { emotion = 'curious'; }
    // Emotional lines
    if (/사랑|눈물|고마|감동|그립|따뜻/.test(trimmed)) { emotion = 'warm'; pace = 'slow'; }
    // Climax / key sentences
    if (/반드시|절대|꼭 기억|중요/.test(trimmed)) { emotion = 'urgent'; pace = 'slow'; }
    // Outro
    if (i === lines.length - 1 || i >= lines.length - 3) { emotion = 'warm'; pace = 'slow'; pauseHint = 'long_pause_after'; }

    result.push('[speaker: ' + speaker + ']');
    result.push('[emotion: ' + emotion + ']');
    result.push('[pace: ' + pace + ']');
    if (pauseHint) result.push('[pause: ' + pauseHint + ']');
    result.push('text: ' + trimmed);
    result.push('');
  });

  result.push('---END---');
  result.push('');
  result.push('# ── 사용법 ──');
  result.push('# 1. ElevenLabs → Projects → Create Project');
  result.push('# 2. "Paste Script" 클릭 후 이 내용 붙여넣기');
  result.push('# 3. [speaker:] 기준으로 화자 자동 할당');
  result.push('# 4. 각 화자에 원하는 Voice 선택');
  result.push('# 5. Generate 클릭');

  return result.join('\n');
}

// ═══════════════════════════════════════
// 5. InVideo 포맷 생성
// ═══════════════════════════════════════

function formatInVideo(script) {
  var vidStyle = document.getElementById('hub-vidstyle') ? document.getElementById('hub-vidstyle').value : 'documentary';
  var lang = script.lang || 'kr';

  var styleMap = {
    documentary: { camera: 'medium_shot', transition: 'fade', background: 'documentary_warm' },
    knowledge: { camera: 'info_graphic', transition: 'slide', background: 'clean_white' },
    drama: { camera: 'dynamic_cut', transition: 'hard_cut', background: 'cinematic' },
    interview: { camera: 'talking_head', transition: 'dissolve', background: 'studio' },
    comedy: { camera: 'wide_shot', transition: 'wipe', background: 'colorful' }
  };
  var style = styleMap[vidStyle] || styleMap.documentary;

  var lines = script.text.split('\n').filter(function(l) { return l.trim(); });
  var scenes = [];
  var sceneNum = 0;

  // Group lines into scenes (every 2-3 lines = 1 scene)
  var LINES_PER_SCENE = 2;
  for (var i = 0; i < lines.length; i += LINES_PER_SCENE) {
    sceneNum++;
    var sceneLines = lines.slice(i, i + LINES_PER_SCENE).filter(function(l) { return l.trim(); });
    if (!sceneLines.length) continue;

    var dialogue = sceneLines.join(' ');
    var isHook = sceneNum <= 2;
    var isOutro = i + LINES_PER_SCENE >= lines.length;

    // Estimate duration (Korean: ~300chars/min, Japanese: ~400chars/min)
    var charsPerSec = lang === 'jp' ? 6.5 : 5.0;
    var duration = Math.max(2, Math.min(8, Math.round(dialogue.length / charsPerSec)));

    // Subtitle (shortened version)
    var subtitle = dialogue.length > 40 ? dialogue.slice(0, 38) + '...' : dialogue;

    // Visual prompt (English, based on content)
    var visual = buildVisualPrompt(dialogue, vidStyle, isHook, isOutro);

    // Camera direction
    var camera = isHook ? 'close_up' : isOutro ? 'wide_shot' : style.camera;

    scenes.push({
      scene_number: sceneNum,
      duration_seconds: duration,
      dialogue: dialogue,
      subtitle: subtitle,
      visual_prompt: visual,
      camera_direction: camera,
      transition: style.transition,
      stock_keyword: buildStockKeyword(dialogue),
      background_style: style.background,
      text_overlay: isHook ? 'large_bold' : 'normal',
      voice_emotion: isHook ? 'urgent' : isOutro ? 'warm' : 'calm'
    });
  }

  var output = [
    '# InVideo Scene JSON',
    '# Generated: ' + new Date().toLocaleString('ko-KR'),
    '# Title: ' + script.title,
    '# Style: ' + vidStyle,
    '# Language: ' + lang.toUpperCase(),
    '# Total Scenes: ' + scenes.length,
    '',
    '---JSON START---',
    '',
    JSON.stringify({ title: script.title, language: lang, style: vidStyle, scenes: scenes }, null, 2),
    '',
    '---JSON END---',
    '',
    '# ── InVideo 사용법 ──',
    '# 1. InVideo AI → Script 탭',
    '# 2. "Custom Script" 선택 → 위 JSON에서 dialogue 내용만 붙여넣기',
    '# 3. 또는 InVideo API → /v3/generate → scenes 배열 직접 전송',
    '# 4. visual_prompt → InVideo 영상 검색어로 활용',
    '# 5. stock_keyword → Getty/Unsplash 검색어로 활용'
  ].join('\n');

  return output;
}

function buildVisualPrompt(text, style, isHook, isOutro) {
  // Build English visual prompt from Korean/Japanese text
  var base = '';
  if (/뇌|치매|인지|기억/.test(text)) base = 'human brain glowing neurons, medical visualization, warm lighting';
  else if (/혈압|혈당|심장|혈관/.test(text)) base = 'healthy heart and blood vessels, medical illustration, blue tones';
  else if (/걷|운동|산책/.test(text)) base = 'elderly person walking in nature, morning sunlight, peaceful';
  else if (/음식|먹|식사/.test(text)) base = 'healthy korean traditional food, wooden table, warm light';
  else if (/가족|손자|자녀/.test(text)) base = 'happy korean family gathering, warm home interior, golden hour';
  else if (/노년|시니어|할머니|할아버지/.test(text)) base = 'cheerful korean elderly couple, park setting, soft daylight';
  else base = 'serene korean countryside, elderly person, warm golden light';

  var prefix = isHook ? 'cinematic dramatic shot, ' : isOutro ? 'peaceful wide shot, ' : '';
  var suffix = ', 4K, photorealistic, emotional depth';
  return prefix + base + suffix;
}

function buildStockKeyword(text) {
  if (/뇌|치매|인지/.test(text)) return 'brain health senior';
  if (/혈압|혈당/.test(text)) return 'blood pressure elderly health';
  if (/운동|걷/.test(text)) return 'senior exercise walking';
  if (/음식|식사/.test(text)) return 'healthy asian food';
  if (/가족|손자/.test(text)) return 'korean family elderly';
  if (/수면|잠/.test(text)) return 'senior peaceful sleep';
  return 'korean elderly lifestyle';
}

// ═══════════════════════════════════════
// 6. 읽기용 포맷
// ═══════════════════════════════════════

function formatReadable(script) {
  var lines = [
    '══════════════════════════════════',
    '  ' + script.title,
    '  타입: ' + (script.typeName || script.type) + ' | 언어: ' + script.lang.toUpperCase(),
    '  생성: ' + script.created,
    '══════════════════════════════════',
    '',
    '【대본 전문】',
    '',
    script.text,
    '',
    '══════════════════════════════════',
    '  총 ' + script.text.split('\n').filter(function(l) { return l.trim(); }).length + '줄',
    '══════════════════════════════════'
  ];
  return lines.join('\n');
}

// ═══════════════════════════════════════
// 7. 복사 & 저장
// ═══════════════════════════════════════

function copyHubOutput() {
  var el = document.getElementById('hub-out-text');
  if (!el || !el.textContent || el.textContent.includes('선택해주세요')) {
    alert('먼저 대본을 선택해주세요.');
    return;
  }
  var text = el.textContent;
  navigator.clipboard.writeText(text).then(function() {
    alert('✅ 복사됐습니다!\n\n' + (HUB_OUT_MODE === 'elevenlabs' ? 'ElevenLabs Projects에 붙여넣기 하세요.' : HUB_OUT_MODE === 'invideo' ? 'InVideo Script에 붙여넣기 하세요.' : '완료!'));
  }).catch(function() {
    var ta = document.createElement('textarea'); ta.value = text;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta); alert('복사됐습니다!');
  });
}

function downloadHubOutput() {
  var el = document.getElementById('hub-out-text');
  if (!el || !el.textContent || el.textContent.includes('선택해주세요')) {
    alert('먼저 대본을 선택해주세요.');
    return;
  }
  var extMap = { elevenlabs: '_elevenlabs.txt', invideo: '_invideo.json', readable: '_readable.txt' };
  var fname = (HUB_SELECTED ? HUB_SELECTED.title.slice(0,20) : '대본') + (extMap[HUB_OUT_MODE] || '.txt');
  var blob = new Blob([el.textContent], { type: 'text/plain;charset=utf-8' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = fname; a.click();
}

// ═══════════════════════════════════════
// 8. 대본 생성 완료 시 허브 자동 저장
// ═══════════════════════════════════════

// Patch all gen functions to auto-save to hub
(function patchGenFnsForHub() {
  // Watch for out.value changes (gen tab)
  var _origProcessGenResult = setInterval(function() {
    var outEl = document.getElementById('out');
    if (!outEl) return;
    clearInterval(_origProcessGenResult);
    var lastVal = '';
    setInterval(function() {
      var cur = outEl.value;
      if (cur && cur !== lastVal && cur.length > 50) {
        lastVal = cur;
        var lang = typeof OUT !== 'undefined' ? (OUT === 'j' ? 'jp' : OUT === 'b' ? 'kr+jp' : 'kr') : 'kr';
        saveToHub('gen', cur, lang);
      }
    }, 2000);
  }, 500);

  // Patch x-tab gen functions
  var xTabMap = {
    'k-out': 'know', 'tri-out': 'trivia', 'd-out': 'drama',
    'sa-out': 'saying', 'hm-out': 'humor'
  };
  Object.keys(xTabMap).forEach(function(elId) {
    var tabType = xTabMap[elId];
    setInterval(function() {
      var el = document.getElementById(elId);
      if (!el || !el.value || el.value.length < 30) return;
      // Only save if changed since last save
      var key = 'hub_last_' + elId;
      if (el.value !== window[key]) {
        window[key] = el.value;
        saveToHub(tabType, el.value, 'kr');
      }
    }, 3000);
  });

  // Patch batch tab
  setInterval(function() {
    var batchEl = document.querySelector('[id^="batch-ep-result-"]');
    if (batchEl && batchEl.textContent && batchEl.textContent.length > 50) {
      var key = 'hub_last_batch';
      if (batchEl.textContent !== window[key]) {
        window[key] = batchEl.textContent;
        saveToHub('batch', batchEl.textContent, 'kr');
      }
    }
  }, 3000);
})();

// ═══════════════════════════════════════
// 9. TAB 재정의 (hub 포함)
// ═══════════════════════════════════════

var _origTABv31 = TAB;
TAB = function(name, btn) {
  if (name === 'hub') {
    var allTabs = ['gen','batch','lyric','know','trivia','drama','saying','humor','hub','hist','preset','guide'];
    allTabs.forEach(function(n) {
      var el = document.getElementById('pg-' + n);
      if (el) el.classList.add('hide');
    });
    document.querySelectorAll('.tnav').forEach(function(b) { b.classList.remove('on'); });
    var pg = document.getElementById('pg-hub');
    if (pg) pg.classList.remove('hide');
    btn.classList.add('on');
    var sticky = document.getElementById('stickyGen');
    if (sticky) sticky.style.display = 'none';
    // Refresh hub list when tab opens
    renderHubList();
  } else {
    _origTABv31(name, btn);
  }
};

// ═══════════════════════════════════════
// 10. 트렌딩 컨텍스트 — 날짜 주입
// ═══════════════════════════════════════

// Override injectTrendingContext to include current date
injectTrendingContext = function(systemPrompt) {
  var dateNote = '※ 현재 날짜: ' + NOW_DATE.full + ' (' + NOW_DATE.season + ') — 계절에 맞는 내용으로 작성할 것.\n';
  var trending = TRENDING_CONTEXT ? '\n【트렌딩/URL 분석 — 대본에 자연스럽게 반영】\n' + TRENDING_CONTEXT + '\n→ 위 소재와 이 대본 주제를 자연스럽게 연결. 허구 사실 절대 금지.\n' : '';
  return dateNote + trending + systemPrompt;
};

// ═══════════════════════════════════════
// 11. 성능 최적화 — URL input 힌트 업데이트
// ═══════════════════════════════════════

(function updateURLInputHint() {
  var inp = document.getElementById('url-input');
  if (inp) {
    inp.placeholder = 'URL 또는 기사 내용 텍스트 붙여넣기 (URL은 주제 추정, 텍스트는 정밀 분석)';
  }
})();

// Version
document.title = '대본생성기 v31 — 변환허브';
console.log('✅ v31 로드 완료 — 변환허브(ElevenLabs/InVideo) · 트렌딩Fix · URL분석Fix · ' + NOW_DATE.full);

/* ─── 감동스토리 (한/일 동시 생성) ─── */

// ═══════════════════════════════════════
// 12. 💝 감동스토리 탭 (신규)
//     - 실화/사연/눈물버튼 3모드
//     - 한국어 + 일본어 동시 생성 (core/api-adapter.js 사용)
// ═══════════════════════════════════════
var STORY_MODE = 'true';
var STORY_OUT = { ko:'', jp:'' };
var STORY_VIEW = 'ko';

function setStoryMode(m){
  STORY_MODE = m;
  ['true','letter','tear'].forEach(function(x){
    var el = document.getElementById('sm-' + x);
    if(!el) return;
    var active = (x === m);
    el.style.background = active ? '#fff5fa' : '#fff';
    el.style.borderColor = active ? '#e8a6c6' : '#f1dce7';
    el.classList.toggle('on', active);
  });
}

function buildStorySystem(lang){
  var tone = document.getElementById('story-tone').value;
  var lenSec = parseInt(document.getElementById('story-len').value, 10) || 780;
  var minutes = Math.round(lenSec / 60);

  var modeDesc = {
    'true':   '실제 사건·인물·역사에 기반한 실화를 장편 서사로',
    'letter': '편지·고백·일기·추억 중심의 1인칭 사연을 장편으로',
    'tear':   '절정과 결말의 감정을 극대화하는 눈물 유도형 장편 구성으로'
  }[STORY_MODE];
  var toneDesc = {
    'gentle':    '잔잔하고 따뜻한',
    'strong':    '강한 감정과 울컥함이 느껴지는',
    'healing':   '치유와 위로가 있는',
    'nostalgic': '향수와 추억이 묻어나는'
  }[tone];

  var base =
    '당신은 감동 롱폼(10~15분) 스토리텔링 대본 작가다. ' + modeDesc + ' ' + toneDesc + ' 대본을 작성한다.\n' +
    '목표 길이: 약 ' + minutes + '분 분량 (내레이션 기준 ' + lenSec + '초). 허구 인물·수치를 사실처럼 단정하지 말 것.\n' +
    '반드시 아래 5막 장편 구조를 명시적으로 따르며, 각 막마다 장면 번호(#1, #2...)와 구간 표기(【① 도입】 등)를 넣고, ' +
    '내레이션·대사를 분리해 자연스러운 호흡으로 길게 풀어 쓴다. 각 막의 분량 비율은 대체로 도입 15% · 전개 25% · 위기 20% · 절정 25% · 결말 15%.\n' +
    '5막 구조:\n' +
    '  【① 도입】 인물·배경·시작 상황 제시. 시청자의 관심 확보.\n' +
    '  【② 전개】 관계·사건의 시작과 축적. 감정선을 서서히 쌓음.\n' +
    '  【③ 위기】 갈등·좌절·상실. 가장 어두운 구간.\n' +
    '  【④ 절정】 반전·깨달음·폭발점. 감정 최고조.\n' +
    '  【⑤ 감동결말】 여운·치유·한 줄의 마지막 메시지.\n' +
    '첫 문장은 시청을 붙잡는 훅, 마지막 문장은 오래 남는 한 줄로 마무리.';

  if(lang === 'ko'){
    return base + '\n[언어 지시] 반드시 한국어로만 작성. 시니어 시청자에게 익숙한 자연스러운 어휘 사용.';
  }else{
    return base + '\n[言語指示] 必ず日本語のみで作成。日本のシニア視聴者に自然な敬体・語彙で、長編ナレーションとして書くこと。';
  }
}

function buildStoryUser(){
  var title = document.getElementById('story-title').value.trim();
  var a1 = document.getElementById('story-act1').value.trim();
  var a2 = document.getElementById('story-act2').value.trim();
  var a3 = document.getElementById('story-act3').value.trim();
  var a4 = document.getElementById('story-act4').value.trim();
  var a5 = document.getElementById('story-act5').value.trim();

  var lines = [];
  lines.push('작품 제목 / 핵심 메시지: ' + (title || '(자유 설정)'));
  lines.push('');
  lines.push('5막 소재 (각 막을 길게 풀어 써주세요):');
  lines.push('① 도입: '       + (a1 || '(AI가 자유 구성)'));
  lines.push('② 전개: '       + (a2 || '(AI가 자유 구성)'));
  lines.push('③ 위기: '       + (a3 || '(AI가 자유 구성)'));
  lines.push('④ 절정: '       + (a4 || '(AI가 자유 구성)'));
  lines.push('⑤ 감동결말: '   + (a5 || '(AI가 자유 구성)'));
  lines.push('');
  lines.push('위 5막 구조를 충실히 따르며, 10~15분 분량의 롱폼 감동 대본을 완성해라.');
  return lines.join('\n');
}

async function generateStory(){
  var title = document.getElementById('story-title').value.trim();
  var hasAnyAct = ['story-act1','story-act2','story-act3','story-act4','story-act5']
    .some(function(id){ return document.getElementById(id).value.trim(); });
  if(!title && !hasAnyAct){
    alert('작품 제목이나 5막 중 최소 하나는 입력해주세요.');
    return;
  }

  var bilingual = document.getElementById('story-bilingual').checked;
  var btn = document.getElementById('story-genbtn');
  var status = document.getElementById('story-status');
  btn.disabled = true;
  btn.textContent = '⏳ 롱폼 대본 생성 중...';
  status.textContent = bilingual ? '한국어와 일본어 롱폼 대본을 동시 생성하고 있습니다... (최대 1분 소요)' : '한국어 롱폼 대본을 생성하고 있습니다...';

  try{
    if(typeof APIAdapter === 'undefined'){
      throw new Error('api-adapter.js 가 로드되지 않았습니다.');
    }

    if(typeof AI_PROVIDER !== 'undefined') APIAdapter.setProvider(AI_PROVIDER);
    var claudeKey = localStorage.getItem('uc_claude_key'); if(claudeKey) APIAdapter.setApiKey('claude', claudeKey);
    var openaiKey = localStorage.getItem('uc_openai_key'); if(openaiKey) APIAdapter.setApiKey('openai', openaiKey);
    var geminiKey = localStorage.getItem('uc_gemini_key'); if(geminiKey) APIAdapter.setApiKey('gemini', geminiKey);

    var userPrompt = buildStoryUser();
    var MAX_TOK = 6000; // 롱폼 10~15분 대본 수용

    if(bilingual){
      var resKO = await APIAdapter.callWithFallback(buildStorySystem('ko'), userPrompt, { maxTokens:MAX_TOK });
      var resJP = await APIAdapter.callWithFallback(buildStorySystem('jp'), userPrompt, { maxTokens:MAX_TOK });
      STORY_OUT.ko = resKO;
      STORY_OUT.jp = resJP;
      document.getElementById('story-tab-jp').style.display = '';
    }else{
      var resKO2 = await APIAdapter.callWithFallback(buildStorySystem('ko'), userPrompt, { maxTokens:MAX_TOK });
      STORY_OUT.ko = resKO2;
      STORY_OUT.jp = '';
      document.getElementById('story-tab-jp').style.display = 'none';
    }

    document.getElementById('story-out-ko').value = STORY_OUT.ko;
    document.getElementById('story-out-jp').value = STORY_OUT.jp;
    document.getElementById('story-result-wrap').style.display = 'block';
    switchStoryOut('ko');
    status.textContent = '✅ 생성 완료';
  }catch(err){
    status.textContent = err.message || String(err);
    alert(err.message || String(err));
  }finally{
    btn.disabled = false;
    btn.textContent = '💝 롱폼 감동스토리 대본 생성 (10~15분)';
  }
}

function switchStoryOut(lang){
  STORY_VIEW = lang;
  document.getElementById('story-tab-ko').classList.toggle('active', lang==='ko');
  document.getElementById('story-tab-jp').classList.toggle('active', lang==='jp');
  document.getElementById('story-out-ko').style.display = lang==='ko' ? '' : 'none';
  document.getElementById('story-out-jp').style.display = lang==='jp' ? '' : 'none';
}

function copyStoryOut(){
  var t = STORY_VIEW === 'jp' ? STORY_OUT.jp : STORY_OUT.ko;
  if(!t){ alert('복사할 대본이 없습니다.'); return; }
  navigator.clipboard.writeText(t).then(function(){
    document.getElementById('story-status').textContent = '📋 클립보드에 복사됨';
  });
}

function sendStoryToHub(){
  var t = STORY_VIEW === 'jp' ? STORY_OUT.jp : STORY_OUT.ko;
  if(!t){ alert('전송할 대본이 없습니다.'); return; }
  // 변환허브로 대본 주입 (hub 탭의 수집 리스트 사용)
  try{
    var key = 'hub_scripts_v1';
    var list = JSON.parse(localStorage.getItem(key) || '[]');
    list.unshift({ source:'story', lang:STORY_VIEW, text:t, at:Date.now() });
    localStorage.setItem(key, JSON.stringify(list.slice(0,30)));
    document.querySelectorAll('.tnav').forEach(function(b){
      if(b.textContent.indexOf('변환허브') >= 0){ b.click(); }
    });
  }catch(e){ alert('전송 실패: ' + e.message); }
}

console.log('✅ 💝 감동스토리 탭 로드 완료');

// ═══════════════════════════════════════

/* ─── 음악/BGM 탭 (추억·스토리·엔카·커버·예능) ─── */
console.log('✅ [신규] 14~17번 탭 + 채널 프리셋 + 트렌드 기능 로드 완료');
function musicGetConfig(sub){
  function _v(id){var e=document.getElementById(id); return e?e.value:'';}
  var langLabels = { ko:'한국어만', jp:'日本語のみ', kojp:'한국어+일본어 동시' };

  if(sub==='memory'){
    var type={top10:'그 시절 명곡 TOP10 소개',generation:'세대공감 음악 이야기',nostalgia:'노래로 돌아보는 그때 그시절',parent:'부모님이 좋아하던 노래 특집',grand:'할머니·할아버지 추억의 노래방'}[_v('mem-type')];
    return {
      lang:_v('mem-lang'), len:_v('mem-len'), outId:'mem-out', statusId:'mem-status',
      sys:'시니어 특화 추억 노래 대본 작가. 다음을 포함: ①오프닝 훅(첫 3초) ②시대 배경 설명 ③노래 소개 및 감동 포인트 ④시청자 공감 멘트 ⑤마무리 CTA. 쉬운 단어·천천히 설명·추억 자극·따뜻한 마무리.',
      user:'한국 시대: '+_v('mem-kr-era')+'\n일본 시대: '+_v('mem-jp-era')+'\n콘텐츠 유형: '+type+'\n특정 노래: '+(_v('mem-song')||'(없음)')+'\n길이: '+_v('mem-len')+'초\n언어: '+langLabels[_v('mem-lang')]
    };
  }
  if(sub==='story'){
    var stype={birth:'탄생 비화',love:'숨겨진 사랑 이야기',hit:'히트 비결 분석',kojp:'한일 비교 스토리',sad:'슬픈 사연',cover:'커버/리메이크 비교'}[_v('str-type')];
    return {
      lang:_v('str-lang'), len:_v('str-len'), outId:'str-out', statusId:'str-status',
      sys:'노래 뒤에 숨겨진 사연을 감동적으로 풀어내는 스토리텔러. 시니어 시청자 친화. 쉬운 단어·천천히·추억 자극·따뜻한 마무리. 탄생배경→감동 포인트→공감 유도 구조.',
      user:'스토리 유형: '+stype+'\n노래명: '+_v('str-song')+'\n가수/작곡가: '+(_v('str-artist')||'(불명)')+'\n길이: '+_v('str-len')+'초\n언어: '+langLabels[_v('str-lang')]
    };
  }
  if(sub==='enka'){
    var cat={enka:'엔카 (演歌) 명곡',showa:'쇼와 팝스',kayokyoku:'일본 가요쿡 황금기',jpop:'J-POP 추억',kojp:'한일 교류 노래'}[_v('enk-cat')];
    var etype={intro:'노래 소개 대본',artist:'가수 스토리 대본',charm:'엔카의 매력 소개',"kr-loves-jp":'한국인이 좋아하는 엔카 특집',"jp-loves-kr":'일본인이 좋아하는 한국 트로트'}[_v('enk-type')];
    return {
      lang:'kojp', len:'300', outId:'enk-out', statusId:'enk-status',
      sys:'엔카·일본 가요 전문 대본 작가. 일본 경어체(です·ます체), 계절·자연 묘사 풍부, 望郷·離別 테마 자연스럽게, 일본 시니어 공감 멘트. 5분 분량.',
      user:'카테고리: '+cat+'\n콘텐츠 유형: '+etype+'\n대상: '+_v('enk-target')+'\n언어: 한국어+일본어 동시 2버전 출력'
    };
  }
  if(sub==='cover'){
    var ctype={senior:'할머니·할아버지 커버 감동',child:'어린이 커버 귀여움',foreign:'외국인 커버 놀라움',genre:'장르 변환 커버',duet:'듀엣 커버 감동'}[_v('cov-type')];
    return {
      lang:_v('cov-lang'), len:_v('cov-len'), outId:'cov-out', statusId:'cov-status',
      sys:'커버곡 감동 소개 대본 작가. 반응형 훅("이거 보고 눈물났어요")→커버 소개→감동 포인트→원곡 비교→시청자 반응 유도. 감탄/놀라움 연출.',
      user:'커버 유형: '+ctype+'\n원곡명: '+_v('cov-song')+'\n커버 특징: '+_v('cov-detail')+'\n길이: '+_v('cov-len')+'초\n언어: '+langLabels[_v('cov-lang')]
    };
  }
  if(sub==='variety'){
    var fmt={quiz:'음악 퀴즈쇼 (도입→문제→정답공개→마무리)',ranking:'레전드 명곡 랭킹 TOP10',battle:'노래 배틀 (A vs B 대결)',retro:'그때 그시절 음악방송 재현',challenge:'노래방 따라부르기 챌린지'}[_v('var-fmt')];
    return {
      lang:_v('var-lang'), len:_v('var-len'), outId:'var-out', statusId:'var-status',
      sys:'음악 예능형 대본 작가. 시청자 참여 유도 · 궁금증 유발 · 반전 요소 · 재미있는 진행 멘트. 예능 MC 톤.',
      user:'포맷: '+fmt+'\n주제·테마: '+_v('var-topic')+'\n길이: '+_v('var-len')+'초\n언어: '+langLabels[_v('var-lang')]
    };
  }
  return null;
}

async function genMusicTab(sub){
  var cfg = musicGetConfig(sub); if(!cfg) return;
  var status = document.getElementById(cfg.statusId);
  var out = document.getElementById(cfg.outId);
  status.textContent = '⏳ 생성 중... (한·일 동시)';
  out.value = '';
  try{
    if(typeof APIAdapter==='undefined') throw new Error('api-adapter.js 미로드');
    if(typeof AI_PROVIDER !== 'undefined') APIAdapter.setProvider(AI_PROVIDER);
    var ck=localStorage.getItem('uc_claude_key'); if(ck) APIAdapter.setApiKey('claude',ck);
    var ok=localStorage.getItem('uc_openai_key'); if(ok) APIAdapter.setApiKey('openai',ok);
    var gk=localStorage.getItem('uc_gemini_key'); if(gk) APIAdapter.setApiKey('gemini',gk);

    var tasks=[];
    var maxTok = parseInt(cfg.len)||300; maxTok = Math.max(2000, maxTok*10);

    function langInst(L){
      if(L==='ko') return '[언어] 반드시 한국어로만 작성.';
      if(L==='jp') return '[言語] 必ず日本語のみで作成。';
      return '';
    }

    if(cfg.lang === 'kojp'){
      tasks.push(APIAdapter.callWithFallback(cfg.sys+'\n'+langInst('ko'), cfg.user, {maxTokens:maxTok, featureId:'music-'+sub+'-ko'}).then(r=>'🇰🇷 ━━━━━ 한국어 ━━━━━\n\n'+r));
      tasks.push(APIAdapter.callWithFallback(cfg.sys+'\n'+langInst('jp'), cfg.user, {maxTokens:maxTok, featureId:'music-'+sub+'-jp'}).then(r=>'🇯🇵 ━━━━━ 日本語 ━━━━━\n\n'+r));
    } else {
      tasks.push(APIAdapter.callWithFallback(cfg.sys+'\n'+langInst(cfg.lang), cfg.user, {maxTokens:maxTok, featureId:'music-'+sub}));
    }

    var results = await Promise.all(tasks.map(t=>t.catch(e=>'❌ '+e.message)));
    out.value = results.join('\n\n');
    status.textContent = '✅ 생성 완료 · ' + out.value.length + '자';
  }catch(e){ status.textContent = '❌ '+e.message; }
}

function copyMusicOut(sub){
  var ids = {memory:'mem-out', story:'str-out', enka:'enk-out', cover:'cov-out', variety:'var-out'};
  var t = document.getElementById(ids[sub]).value;
  if(!t){ alert('복사할 내용이 없습니다.'); return; }
  navigator.clipboard.writeText(t).then(()=>alert('📋 복사됨!'));
}
function sendMusicToShorts(sub, tikitaka){
  var ids = {memory:'mem-out', story:'str-out', enka:'enk-out', cover:'cov-out', variety:'var-out'};
  var t = document.getElementById(ids[sub]).value;
  if(!t){ alert('먼저 생성해주세요.'); return; }
  var list = JSON.parse(localStorage.getItem('hub_scripts_v1')||'[]');
  list.unshift({source:'music-'+sub, lang:'kojp', text:t, at:Date.now(), meta:{music:true, tikitaka:!!tikitaka}});
  localStorage.setItem('hub_scripts_v1', JSON.stringify(list.slice(0,30)));
  var dest = tikitaka ? '../shorts/index.html?view=tikitaka' : '../shorts/index.html';
  if(confirm('🎬 자동숏츠 엔진으로 전송했어요.\n\n' + (tikitaka?'🌍 캐릭터 티키타카 채널로 이동할까요?':'지금 숏츠 엔진으로 이동할까요?'))){
    location.href = dest;
  }
}
function sendMusicToMedia(sub){
  var ids = {memory:'mem-out', story:'str-out', enka:'enk-out', cover:'cov-out', variety:'var-out'};
  var t = document.getElementById(ids[sub]).value;
  if(!t){ alert('먼저 생성해주세요.'); return; }
  var list = JSON.parse(localStorage.getItem('hub_scripts_v1')||'[]');
  list.unshift({source:'music-'+sub, lang:'kojp', text:t, at:Date.now(), meta:{music:true}});
  localStorage.setItem('hub_scripts_v1', JSON.stringify(list.slice(0,30)));
  if(confirm('🎵 미디어 엔진으로 전송했어요.\n\n음성·이미지·영상 패키지를 만들러 이동할까요?')){
    location.href = '../media/index.html';
  }
}

console.log('✅ [신규] 가사/음원 탭 서브탭 5종 로드 완료');
