function _studioS4(){
  const p  = STUDIO.project;
  const ch = p.channel || 'ko';
  const s4 = p.s4 || {};
  const s2 = p.s2 || {};
  const s1 = p.s1 || {};
  const mode   = s1.mode || 'shorts';
  const genre  = s1.genre || '';
  const script = s2.scriptKo || s2.scriptJa || p.script || '';

  /* 음성 API 목록 */
  const voiceApis = [
    { id:'clova',      name:'ClovaVoice',  lang:'ko',   price:'₩3/분',  badge:'한국어최적', key:'uc_clova_key' },
    { id:'elevenlabs', name:'ElevenLabs',  lang:'both', price:'₩15/분', badge:'감정표현↑',  key:'uc_eleven_key' },
    { id:'openaitts',  name:'OpenAI TTS',  lang:'both', price:'₩2/분',  badge:'저렴·자연',  key:'uc_openai_key' },
    { id:'typecast',   name:'Typecast',    lang:'ko',   price:'₩10/분', badge:'감정연기↑',  key:'uc_typecast_key' },
    { id:'voicevox',   name:'VoiceVox',    lang:'ja',   price:'무료',   badge:'일본어전용',  key:'' },
    { id:'googleTTS',  name:'Google TTS',  lang:'both', price:'무료',   badge:'다국어',      key:'uc_google_key' },
    { id:'upload',     name:'내 목소리',   lang:'both', price:'무료',   badge:'직접녹음',    key:'' },
  ];

  /* 장르별 추천 목소리 */
  const genreVoiceMap = {
    'senior':'senior-f', 'health':'senior-f', 'know':'mid-m',
    'humor':'young-m',   'saying':'mid-m',    'story':'senior-f',
    'hist':'announcer-m','drama':'multi',      'tiki':'multi',
    'batch':'mid-f',     'lyric':'young-f',
  };

  /* AI 추천 API */
  const recommendApi = ch==='ja' ? 'voicevox'
    : mode==='tiki'||mode==='drama' ? 'elevenlabs'
    : 'clova';
  const selectedApi = s4.voiceApi || recommendApi;

  /* 화자 수 결정 */
  const speakerCount = mode==='tiki'||mode==='drama' ? 2 : 1;

  /* 씬 목록 */
  const scenes = (p.s3&&p.s3.scenes) || [];

  /* API 선택 UI */
  const apiHtml = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">' +
    voiceApis.filter(a => a.lang==='both' || a.lang===ch || ch==='both').map(a => {
      const on  = selectedApi===a.id;
      const keyOk = a.key ? (typeof ucGetApiKey==='function' ? !!ucGetApiKey(a.id) : !!localStorage.getItem(a.key)) : true;
      return '<button onclick="studioS4SetApi(\''+a.id+'\')" style="'+
        'border:2px solid '+(on?'var(--pink)':'var(--line)')+';'+
        'background:'+(on?'var(--pink-soft)':'#fff')+';'+
        'border-radius:12px;padding:8px 12px;cursor:pointer;font-family:inherit;'+
        'min-width:100px;text-align:left;transition:.15s;">'+
        '<div style="font-size:12px;font-weight:800;color:'+(on?'var(--pink)':'var(--text)')+'">'+a.name+'</div>'+
        '<div style="font-size:11px;color:var(--sub)">'+a.price+'</div>'+
        '<span style="font-size:10px;background:'+(on?'var(--pink)':'#eee')+';color:'+(on?'#fff':'#666')+';border-radius:999px;padding:1px 6px">'+a.badge+'</span>'+
        (a.key?'<div style="font-size:10px;margin-top:3px;color:'+(keyOk?'#27ae60':'#e74c3c')+'">'+(keyOk?'✅ 키설정됨':'❌ 키필요')+'</div>':'')+
      '</button>';
    }).join('') +
  '</div>';

  /* 키 상태 표시 */
  const selApi   = voiceApis.find(a=>a.id===selectedApi)||voiceApis[0];
  const keyOk    = selApi.key ? (typeof ucGetApiKey==='function' ? !!ucGetApiKey(selectedApi) : !!localStorage.getItem(selApi.key)) : true;
  const keyBadge = selApi.key
    ? (keyOk
        ? '<span style="color:#27ae60;font-weight:700">✅ API 키 설정됨</span>'
        : '<span style="color:#e74c3c;font-weight:700">❌ API 키 필요 </span><button onclick="typeof renderApiSettings===\'function\'&&renderApiSettings()" style="border:none;background:var(--pink);color:#fff;border-radius:999px;padding:4px 10px;font-size:11px;cursor:pointer">⚙️ 키 설정</button>')
    : '<span style="color:#27ae60;font-weight:700">✅ 키 불필요</span>';

  /* AI 추천 박스 */
  const recHtml = '<div style="background:linear-gradient(135deg,#fff5fa,#f7f4ff);'+
    'border:1.5px solid var(--pink);border-radius:14px;padding:14px;margin-bottom:14px">'+
    '<div style="font-size:13px;font-weight:900;margin-bottom:8px">🤖 AI 추천 조합</div>'+
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">'+
      '<div style="background:#fff;border-radius:10px;padding:8px 14px;flex:1;min-width:160px">'+
        '<div style="font-size:12px;font-weight:800;color:var(--pink)">1순위 · '+selApi.name+'</div>'+
        '<div style="font-size:11px;color:var(--sub);margin-top:2px">'+
          (ch==='ja'?'일본어 전용 · 무료':
           mode==='tiki'?'감정표현 최고 · 다인 대화':
           '한국어 최적화 · 따뜻한 목소리')+'</div>'+
        '<div style="font-size:11px;font-weight:700;margin-top:4px;color:var(--pink)">'+selApi.price+'</div>'+
      '</div>'+
      '<button onclick="studioS4QuickGen()" style="border:none;'+
        'background:linear-gradient(135deg,var(--pink),var(--purple));'+
        'color:#fff;border-radius:12px;padding:10px 18px;font-size:13px;'+
        'font-weight:900;cursor:pointer;white-space:nowrap">⚡ 추천으로 바로 생성</button>'+
    '</div>'+
  '</div>';

  /* 화자 설정 */
  const voicesKo = STUDIO_VOICE_KO||[];
  const voicesJa = STUDIO_VOICE_JA||[];

  let speakerHtml = '';
  if(mode==='tiki'){
    speakerHtml = '<div class="studio-section">'+
      '<div class="studio-label">🎭 티키타카 화자 설정 (A vs B)</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
        /* 화자 A */
        '<div style="background:#fff5fa;border:1.5px solid var(--pink);border-radius:12px;padding:12px">'+
          '<div style="font-size:12px;font-weight:800;color:var(--pink);margin-bottom:8px">화자 A (주장측)</div>'+
          '<div class="studio-chips" style="gap:4px">'+
          voicesKo.slice(0,4).map(v=>'<button class="studio-chip'+(s4.voiceA===v.id?' on':'')+
            '" onclick="studioS4SetSpeaker(\'A\',\''+v.id+'\',this)">'+v.label+'</button>').join('')+
          '</div>'+
        '</div>'+
        /* 화자 B */
        '<div style="background:#f7f4ff;border:1.5px solid var(--purple);border-radius:12px;padding:12px">'+
          '<div style="font-size:12px;font-weight:800;color:var(--purple);margin-bottom:8px">화자 B (반박측)</div>'+
          '<div class="studio-chips" style="gap:4px">'+
          voicesKo.slice(4,8).map(v=>'<button class="studio-chip'+(s4.voiceB===v.id?' on':'')+
            '" onclick="studioS4SetSpeaker(\'B\',\''+v.id+'\',this)">'+v.label+'</button>').join('')+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  } else if(mode==='drama'){
    /* 드라마: 등장인물 자동 감지 */
    const chars = studioS4DetectChars(script);
    speakerHtml = '<div class="studio-section">'+
      '<div class="studio-label">🎭 등장인물별 목소리</div>'+
      (chars.length
        ? chars.map((c,i)=>'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
            '<span style="font-size:13px;font-weight:800;min-width:60px">'+c+'</span>'+
            '<div class="studio-chips" style="flex:1;gap:4px">'+
            voicesKo.slice(0,4).map(v=>'<button class="studio-chip'+(s4.charVoices&&s4.charVoices[c]===v.id?' on':'')+
              '" onclick="studioS4SetCharVoice(\''+c+'\',\''+v.id+'\',this)" style="font-size:11px;padding:4px 8px">'+v.label+'</button>').join('')+
            '</div>'+
          '</div>').join('')
        : '<div style="font-size:12px;color:var(--sub)">대본에서 등장인물을 자동 감지합니다. 대본 생성 후 다시 방문하세요.</div>')+
      '<button onclick="studioS4DetectCharsUI()" class="studio-btn ghost" style="font-size:12px;margin-top:8px">🔍 등장인물 다시 감지</button>'+
    '</div>';
  } else {
    /* 일반: 단일 화자 */
    speakerHtml = '<div class="studio-section">'+
      (ch!=='ja'?'<div class="studio-label">🇰🇷 한국어 나레이터</div>'+
        '<div class="studio-chips" id="s4-voice-ko">'+
        voicesKo.map(v=>'<button class="studio-chip'+(s4.voiceKo===v.id?' on':'')+
          '" onclick="studioS4VoiceKo(\''+v.id+'\',this)">'+v.label+'</button>').join('')+
        '</div>':'')+
      (ch!=='ko'?'<div class="studio-label" style="margin-top:10px">🇯🇵 일본어 나레이터</div>'+
        '<div class="studio-chips" id="s4-voice-ja">'+
        voicesJa.map(v=>'<button class="studio-chip'+(s4.voiceJa===v.id?' on':'')+
          '" onclick="studioS4VoiceJa(\''+v.id+'\',this)">'+v.label+'</button>').join('')+
        '</div>':'')+
    '</div>';
  }

  /* 씬별 감정·속도 설정 */
  const emotionMap = {
    '훅':'긴장', '설명':'차분', '핵심':'열정', '강조':'강함', 'CTA':'친근'
  };
  const speedMap   = { '훅':1.1, '설명':0.95, '핵심':1.0, '강조':1.0, 'CTA':0.9 };
  const scenesHtml = scenes.length ? '<div class="studio-section">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'+
      '<div class="studio-label" style="margin:0">🎙 씬별 음성 생성</div>'+
      '<button onclick="studioS4GenAll()" class="studio-btn pri" style="font-size:12px">⚡ 전체 생성</button>'+
    '</div>'+
    scenes.map((sc,idx)=>{
      const key   = Object.keys(emotionMap).find(k=>sc.label&&sc.label.includes(k))||'설명';
      const defEmo = (s4.sceneEmotions&&s4.sceneEmotions[idx]) || emotionMap[key]||'중립';
      const defSpd = (s4.sceneSpeeds&&s4.sceneSpeeds[idx])    || speedMap[key]||1.0;
      const audio  = s4.sceneAudios&&s4.sceneAudios[idx];
      return '<div style="background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:10px">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">'+
          '<div style="font-size:13px;font-weight:800">씬 '+(idx+1)+' — '+sc.label+'</div>'+
          '<div style="font-size:11px;color:var(--sub)">'+sc.time+'</div>'+
        '</div>'+
        '<div style="font-size:12px;color:var(--sub);margin-bottom:8px;background:#f8f8f8;border-radius:8px;padding:6px">'+
          (sc.desc||'').slice(0,80)+'</div>'+
        '<div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">'+
          '<div style="flex:1;min-width:120px">'+
            '<div style="font-size:11px;font-weight:700;color:var(--sub);margin-bottom:4px">감정</div>'+
            '<select id="s4-emo-'+idx+'" onchange="studioS4SetEmo('+idx+',this.value)" '+
              'style="width:100%;border:1.5px solid var(--line);border-radius:8px;padding:5px;font-size:12px">'+
              ['중립','따뜻함','강함','긴장','밝음','감동','차분','친근','열정'].map(e=>
                '<option '+(defEmo===e?'selected':'')+'>'+e+'</option>').join('')+
            '</select>'+
          '</div>'+
          '<div style="flex:1;min-width:120px">'+
            '<div style="font-size:11px;font-weight:700;color:var(--sub);margin-bottom:4px">속도 ('+defSpd+'x)</div>'+
            '<input type="range" min="0.7" max="1.3" step="0.05" value="'+defSpd+'" '+
              'oninput="studioS4SetSpeed('+idx+',parseFloat(this.value))" style="width:100%;accent-color:var(--pink)">'+
          '</div>'+
          '<div style="flex:1;min-width:120px">'+
            '<div style="font-size:11px;font-weight:700;color:var(--sub);margin-bottom:4px">씬 전 침묵</div>'+
            '<select onchange="studioS4SetPause('+idx+',parseFloat(this.value))" '+
              'style="width:100%;border:1.5px solid var(--line);border-radius:8px;padding:5px;font-size:12px">'+
              [0,0.3,0.5,0.8,1.0].map(v=>
                '<option value="'+v+'" '+((s4.scenePauses&&s4.scenePauses[idx]||0)===v?'selected':'')+'>'+
                  (v===0?'없음':v+'초')+'</option>').join('')+
            '</select>'+
          '</div>'+
        '</div>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap">'+
          '<button onclick="studioS4GenScene('+idx+')" class="studio-btn ghost" style="font-size:12px">🎙 생성</button>'+
          (audio?'<button onclick="studioS4PlayScene('+idx+')" class="studio-btn ghost" style="font-size:12px">▶ 듣기</button>':'')+
          (audio?'<button onclick="studioS4RegenScene('+idx+')" class="studio-btn ghost" style="font-size:12px">🔄 재생성</button>':'')+
          (audio?'<button onclick="studioS4SaveScene('+idx+')" class="studio-btn ghost" style="font-size:12px">💾 저장</button>':'')+
          '<label style="cursor:pointer"><span class="studio-btn ghost" style="font-size:12px;padding:6px 12px">📁 녹음 업로드</span>'+
            '<input type="file" accept="audio/*" style="display:none" onchange="studioS4UploadScene('+idx+',this)"></label>'+
        '</div>'+
        (audio?'<div style="margin-top:8px"><audio controls src="'+audio+'" style="width:100%;height:36px"></audio></div>':'')+
      '</div>';
    }).join('')+
  '</div>' : '';

  /* BGM */
  const bgmHtml = '<div class="studio-section">'+
    '<div class="studio-label">🎵 BGM ('+（STUDIO_BGM||[]).length+'종)</div>'+
    '<div class="studio-chips">'+
    (STUDIO_BGM||[]).map(b=>'<button class="studio-chip'+(s4.bgm===b?' on':'')+
      '" onclick="studioS4Bgm(\''+b+'\',this)">'+b+'</button>').join('')+
    '</div>'+
    '<div style="display:flex;align-items:center;gap:12px;margin-top:10px">'+
      '<span style="font-size:12px;font-weight:700;white-space:nowrap">BGM 볼륨 ('+（s4.bgmVolume||15)+'%)</span>'+
      '<input type="range" min="0" max="50" value="'+(s4.bgmVolume||15)+'" '+
        'oninput="STUDIO.project.s4.bgmVolume=parseInt(this.value,10);studioSave()" '+
        'style="flex:1;accent-color:var(--pink)">'+
    '</div>'+
    '<label style="cursor:pointer;display:inline-block;margin-top:8px">'+
      '<span class="studio-btn ghost" style="font-size:12px">📁 내 BGM 업로드</span>'+
      '<input type="file" accept="audio/*" style="display:none" onchange="studioS4UploadBgm(this)">'+
    '</label>'+
    (s4.bgmCustom?'<div style="margin-top:8px"><audio controls src="'+s4.bgmCustom+'" style="width:100%;height:36px"></audio></div>':'')+
  '</div>';

  /* 전체 미리듣기 */
  const previewHtml = (s4.sceneAudios&&s4.sceneAudios.some(Boolean))
    ? '<div class="studio-section">'+
        '<div class="studio-label">🎧 전체 미리듣기</div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
          '<button onclick="studioS4PreviewAll()" class="studio-btn pri" style="font-size:12px">▶ 음성 전체 재생</button>'+
          '<button onclick="studioS4DownloadAll()" class="studio-btn ghost" style="font-size:12px">💾 전체 MP3 저장</button>'+
        '</div>'+
      '</div>'
    : '';

  return '<div class="studio-panel">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">'+
      '<div>'+
        '<h4 style="margin:0 0 2px">③ 음성·BGM</h4>'+
        '<div style="font-size:12px;color:var(--sub)">TTS 생성·감정 조절·BGM 믹싱</div>'+
      '</div>'+
    '</div>'+

    /* A. AI 추천 */
    recHtml+

    /* B. API 선택 */
    '<div class="studio-section">'+
      '<div class="studio-label">🤖 A. 음성 API 선택</div>'+
      apiHtml+
      '<div style="font-size:12px;padding:6px 0">API 키 상태: '+keyBadge+'</div>'+
    '</div>'+

    /* C. 화자 설정 */
    speakerHtml+

    /* D. 속도·음높이 (일반 설정) */
    '<div class="studio-section">'+
      '<div class="studio-label">🎛 B. 기본 음성 설정</div>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap">'+
        '<div style="flex:1;min-width:140px">'+
          '<div style="font-size:11px;font-weight:700;color:var(--sub);margin-bottom:4px">기본 속도 ('+(s4.speed||1.0)+'x)</div>'+
          '<input type="range" min="0.7" max="1.3" step="0.05" value="'+(s4.speed||1.0)+'" '+
            'oninput="STUDIO.project.s4.speed=parseFloat(this.value);studioSave()" '+
            'style="width:100%;accent-color:var(--pink)">'+
        '</div>'+
        '<div style="flex:1;min-width:140px">'+
          '<div style="font-size:11px;font-weight:700;color:var(--sub);margin-bottom:4px">기본 감정</div>'+
          '<select id="s4-emotion" class="studio-in" style="font-size:12px">'+
            ['중립','따뜻함','강함','밝음','감동','긴장'].map(x=>
              '<option '+(（s4.emotion||'중립')===x?'selected':'')+'>'+x+'</option>').join('')+
          '</select>'+
        '</div>'+
        '<div style="flex:1;min-width:140px">'+
          '<div style="font-size:11px;font-weight:700;color:var(--sub);margin-bottom:4px">음높이</div>'+
          '<input type="range" min="-5" max="5" step="1" value="'+(s4.pitch||0)+'" '+
            'oninput="STUDIO.project.s4.pitch=parseInt(this.value,10);studioSave()" '+
            'style="width:100%;accent-color:var(--pink)">'+
        '</div>'+
      '</div>'+
    '</div>'+

    /* E. 씬별 생성 */
    scenesHtml+

    /* F. BGM */
    bgmHtml+

    /* G. 전체 미리듣기 */
    previewHtml+

    /* 이전·다음 */
    '<div class="studio-actions" style="justify-content:space-between;margin-top:14px">'+
      '<button class="studio-btn ghost" onclick="studioGoto(2)">← 이미지</button>'+
      '<button class="studio-btn pri" onclick="studioGoto(4)">다음: 편집 →</button>'+
    '</div>'+
  '</div>';
}

function _studioBindS4(){
  const el = document.getElementById('s4-emotion');
  if(el) el.addEventListener('change', e=>{
    STUDIO.project.s4.emotion = e.target.value; studioSave();
  });
}

/* 등장인물 자동 감지 */
function studioS4DetectChars(script){
  if(!script) return [];
  const chars = new Set();
  const pattern = /^([가-힣a-zA-Z]{1,8})\s*[:：]/gm;
  let m;
  while((m=pattern.exec(script))!==null){
    if(!['나레이터','해설','narrator'].includes(m[1].toLowerCase()))
      chars.add(m[1]);
  }
  return [...chars].slice(0,5);
}

function studioS4DetectCharsUI(){
  const script = STUDIO.project.s2?.scriptKo||STUDIO.project.s2?.scriptJa||'';
  const chars = studioS4DetectChars(script);
  if(!chars.length){ alert('등장인물을 찾지 못했어요.\n대본에 "이름: 대사" 형식이 있어야 합니다.'); return; }
  alert('감지된 등장인물: '+chars.join(', '));
  renderStudio();
}

/* API 선택 */
function studioS4SetApi(api){
  STUDIO.project.s4 = STUDIO.project.s4||{};
  STUDIO.project.s4.voiceApi = api;
  studioSave(); renderStudio();
}

/* 티키타카 화자 */
function studioS4SetSpeaker(ab, id, btn){
  const s4 = STUDIO.project.s4||{};
  if(ab==='A') s4.voiceA=id; else s4.voiceB=id;
  STUDIO.project.s4=s4; studioSave();
  btn.closest('.studio-chips')?.querySelectorAll('.studio-chip').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
}

/* 드라마 인물 목소리 */
function studioS4SetCharVoice(char, id, btn){
  const s4 = STUDIO.project.s4||{};
  s4.charVoices = s4.charVoices||{};
  s4.charVoices[char] = id;
  STUDIO.project.s4=s4; studioSave();
  btn.closest('.studio-chips')?.querySelectorAll('.studio-chip').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
}

/* 씬 감정 */
function studioS4SetEmo(idx, val){
  const s4 = STUDIO.project.s4||{};
  s4.sceneEmotions = s4.sceneEmotions||[];
  s4.sceneEmotions[idx] = val;
  STUDIO.project.s4=s4; studioSave();
}

/* 씬 속도 */
function studioS4SetSpeed(idx, val){
  const s4 = STUDIO.project.s4||{};
  s4.sceneSpeeds = s4.sceneSpeeds||[];
  s4.sceneSpeeds[idx] = val;
  STUDIO.project.s4=s4; studioSave();
}

/* 씬 침묵 */
function studioS4SetPause(idx, val){
  const s4 = STUDIO.project.s4||{};
  s4.scenePauses = s4.scenePauses||[];
  s4.scenePauses[idx] = val;
  STUDIO.project.s4=s4; studioSave();
}

/* 씬 음성 생성 (OpenAI TTS 기준) */
async function studioS4GenScene(idx){
  const p   = STUDIO.project;
  const s4  = p.s4||{};
  const s3  = p.s3||{};
  const sc  = (s3.scenes||[])[idx];
  if(!sc){ alert('씬 정보가 없어요. 이미지 단계에서 씬을 먼저 설정해주세요.'); return; }

  const text = sc.desc||sc.label||'';
  if(!text.trim()){ alert('씬 내용이 없어요.'); return; }

  const api  = s4.voiceApi||'openaitts';
  const key  = (typeof ucGetApiKey==='function') ? ucGetApiKey('openai') : localStorage.getItem('uc_openai_key')||'';
  const speed= (s4.sceneSpeeds&&s4.sceneSpeeds[idx])||s4.speed||1.0;

  if(typeof ucShowToast==='function') ucShowToast('⏳ 씬'+(idx+1)+' 음성 생성 중...','info');

  try {
    if(api==='openaitts'||api==='elevenlabs'){
      if(!key){ alert('OpenAI API 키를 설정해주세요 (⚙️ 키 설정 버튼)'); return; }
      const voiceMap = {
        'senior-f':'nova','senior-m':'onyx','mid-f':'shimmer',
        'mid-m':'echo','young-f':'fable','young-m':'alloy',
        'announcer-m':'onyx','announcer-f':'nova'
      };
      const voice = voiceMap[s4.voiceKo||'senior-f']||'nova';
      const r = await fetch('https://api.openai.com/v1/audio/speech',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
        body:JSON.stringify({ model:'tts-1', input:text, voice:voice, speed:speed })
      });
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      s4.sceneAudios = s4.sceneAudios||[];
      s4.sceneAudios[idx] = url;
      STUDIO.project.s4=s4; studioSave(); renderStudio();
      if(typeof ucShowToast==='function') ucShowToast('✅ 씬'+(idx+1)+' 음성 완료','success');
    } else {
      if(typeof ucShowToast==='function') ucShowToast('⏳ '+api+' 연동 준비 중...','info');
    }
  } catch(e){ alert('음성 생성 오류: '+e.message); }
}

/* 전체 씬 생성 */
async function studioS4GenAll(){
  const scenes = (STUDIO.project.s3&&STUDIO.project.s3.scenes)||[];
  for(let i=0;i<scenes.length;i++){
    await studioS4GenScene(i);
    await new Promise(r=>setTimeout(r,800));
  }
}

/* 빠른 생성 (추천 API) */
function studioS4QuickGen(){
  studioS4GenAll();
}

/* 씬 재생 */
function studioS4PlayScene(idx){
  const url = (STUDIO.project.s4?.sceneAudios||[])[idx];
  if(!url){ alert('먼저 음성을 생성해주세요'); return; }
  const a = new Audio(url);
  a.play();
}

/* 씬 재생성 */
function studioS4RegenScene(idx){
  const s4 = STUDIO.project.s4||{};
  s4.sceneAudios = s4.sceneAudios||[];
  s4.sceneAudios[idx] = null;
  STUDIO.project.s4=s4; studioSave();
  studioS4GenScene(idx);
}

/* 씬 저장 (다운로드) */
function studioS4SaveScene(idx){
  const url = (STUDIO.project.s4?.sceneAudios||[])[idx];
  if(!url){ alert('먼저 음성을 생성해주세요'); return; }
  const a = document.createElement('a');
  a.href=url; a.download='scene_'+(idx+1)+'.mp3'; a.click();
}

/* 씬 녹음 업로드 */
function studioS4UploadScene(idx, input){
  const file = input.files[0]; if(!file) return;
  const url  = URL.createObjectURL(file);
  const s4   = STUDIO.project.s4||{};
  s4.sceneAudios = s4.sceneAudios||[];
  s4.sceneAudios[idx] = url;
  STUDIO.project.s4=s4; studioSave(); renderStudio();
  if(typeof ucShowToast==='function') ucShowToast('✅ 씬'+(idx+1)+' 음성 업로드 완료','success');
}

/* BGM 업로드 */
function studioS4UploadBgm(input){
  const file = input.files[0]; if(!file) return;
  const url  = URL.createObjectURL(file);
  const s4   = STUDIO.project.s4||{};
  s4.bgmCustom = url;
  STUDIO.project.s4=s4; studioSave(); renderStudio();
  if(typeof ucShowToast==='function') ucShowToast('✅ BGM 업로드 완료','success');
}

/* 전체 재생 */
function studioS4PreviewAll(){
  const audios = (STUDIO.project.s4?.sceneAudios||[]).filter(Boolean);
  if(!audios.length){ alert('먼저 음성을 생성해주세요'); return; }
  let i=0;
  function playNext(){
    if(i>=audios.length) return;
    const a = new Audio(audios[i++]);
    a.onended = playNext;
    a.play();
  }
  playNext();
}

/* 전체 다운로드 */
function studioS4DownloadAll(){
  const audios = (STUDIO.project.s4?.sceneAudios||[]);
  audios.forEach((url,i)=>{
    if(!url) return;
    const a = document.createElement('a');
    a.href=url; a.download='scene_'+(i+1)+'.mp3'; a.click();
  });
}

/* 기존 함수 호환 */
function studioS4VoiceKo(id,btn){
  STUDIO.project.s4=STUDIO.project.s4||{};
  STUDIO.project.s4.voiceKo=id;
  btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on'));
  btn.classList.add('on'); studioSave();
}
function studioS4VoiceJa(id,btn){
  STUDIO.project.s4=STUDIO.project.s4||{};
  STUDIO.project.s4.voiceJa=id;
  btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on'));
  btn.classList.add('on'); studioSave();
}
function studioS4Bgm(b,btn){
  STUDIO.project.s4=STUDIO.project.s4||{};
  STUDIO.project.s4.bgm=b;
  btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on'));
  btn.classList.add('on'); studioSave();
}
