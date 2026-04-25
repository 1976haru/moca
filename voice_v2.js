/* ═══ 확장된 음성 목록 ═══ */
const STUDIO_VOICE_KO = [
  /* 시니어 */
  {id:'senior-f',    label:'👵 시니어 여성',  speed:0.88, emotion:'따뜻함', gender:'f'},
  {id:'senior-m',    label:'👴 시니어 남성',  speed:0.90, emotion:'차분',   gender:'m'},
  /* 중년 */
  {id:'mid-f',       label:'👩 중년 여성',    speed:0.95, emotion:'따뜻함', gender:'f'},
  {id:'mid-m',       label:'👨 중년 남성',    speed:0.95, emotion:'신뢰',   gender:'m'},
  /* 청년 */
  {id:'young-f',     label:'🧑‍🦰 청년 여성',  speed:1.05, emotion:'밝음',   gender:'f'},
  {id:'young-m',     label:'🧑 청년 남성',    speed:1.05, emotion:'밝음',   gender:'m'},
  /* 전문직 */
  {id:'anchor-f',    label:'📺 아나운서 여',  speed:1.00, emotion:'중립',   gender:'f'},
  {id:'anchor-m',    label:'📺 아나운서 남',  speed:1.00, emotion:'중립',   gender:'m'},
  {id:'narrator',    label:'🎙 내레이터',     speed:0.95, emotion:'중립',   gender:'n'},
  {id:'professor',   label:'🎓 교수님',       speed:0.90, emotion:'신뢰',   gender:'m'},
  /* 감정형 */
  {id:'warm-f',      label:'💝 따뜻한 여성',  speed:0.92, emotion:'감동',   gender:'f'},
  {id:'exciting-m',  label:'🔥 열정 남성',    speed:1.10, emotion:'강함',   gender:'m'},
  {id:'calm-f',      label:'🌙 차분한 여성',  speed:0.88, emotion:'차분',   gender:'f'},
  {id:'funny-m',     label:'😄 재미있는 남성',speed:1.10, emotion:'밝음',   gender:'m'},
  /* 특수 */
  {id:'child',       label:'👦 아이 목소리',  speed:1.10, emotion:'밝음',   gender:'n'},
  {id:'elder',       label:'🧓 노인 목소리',  speed:0.82, emotion:'차분',   gender:'n'},
];

const STUDIO_VOICE_JA = [
  {id:'yuki',     label:'Yuki 유키 (温かみ)',    speed:0.92, emotion:'따뜻함', gender:'f'},
  {id:'aria',     label:'Aria 아리아 (信頼)',     speed:0.95, emotion:'신뢰',   gender:'f'},
  {id:'hana',     label:'Hana 하나 (明るい)',     speed:1.00, emotion:'밝음',   gender:'f'},
  {id:'sakura',   label:'Sakura 사쿠라 (感動)',   speed:0.90, emotion:'감동',   gender:'f'},
  {id:'takeshi',  label:'Takeshi (落ち着き)',      speed:0.95, emotion:'차분',   gender:'m'},
  {id:'kenji',    label:'Kenji 켄지 (信頼)',       speed:0.92, emotion:'신뢰',   gender:'m'},
  {id:'showa',    label:'Showa 쇼와 (昭和風)',     speed:0.88, emotion:'차분',   gender:'m'},
  {id:'keigo',    label:'敬語 케이고 (アナウンサー)',speed:1.00,emotion:'중립',  gender:'m'},
  {id:'kansai',   label:'関西 칸사이 (方言)',      speed:1.02, emotion:'밝음',   gender:'n'},
  {id:'narrator-ja',label:'ナレーター (中立)',     speed:0.95, emotion:'중립',   gender:'n'},
];

/* ═══ 장르→화자 자동 매핑 ═══ */
var GENRE_VOICE_MAP = {
  '시니어건강': {ko:['senior-f','senior-m'], ja:['yuki','takeshi'], emotion:'따뜻함'},
  '시니어특화': {ko:['senior-f','senior-m'], ja:['yuki','kenji'],   emotion:'따뜻함'},
  '재테크':     {ko:['professor','anchor-m'], ja:['kenji','takeshi'],emotion:'신뢰'},
  '투자':       {ko:['professor','mid-m'],    ja:['kenji','takeshi'],emotion:'신뢰'},
  '유머':       {ko:['funny-m','young-f'],    ja:['kansai','hana'],  emotion:'밝음'},
  '코믹':       {ko:['funny-m','young-m'],    ja:['kansai','hana'],  emotion:'밝음'},
  '감동':       {ko:['warm-f','narrator'],    ja:['sakura','yuki'],  emotion:'감동'},
  '히스토리':   {ko:['professor','narrator'], ja:['keigo','takeshi'],emotion:'차분'},
  '사자성어':   {ko:['professor','anchor-m'], ja:['keigo','narrator-ja'],emotion:'차분'},
  '명언':       {ko:['calm-f','narrator'],    ja:['sakura','narrator-ja'],emotion:'차분'},
  '뉴스':       {ko:['anchor-f','anchor-m'],  ja:['keigo','narrator-ja'],emotion:'중립'},
  '정보':       {ko:['anchor-m','narrator'],  ja:['keijo','narrator-ja'],emotion:'중립'},
};

/* ═══ 모드→화자 수 자동 결정 ═══ */
function studioS4GetModeConfig(mode, ch, genre){
  var voiceList = ch==='ja' ? STUDIO_VOICE_JA : STUDIO_VOICE_KO;
  var genreMap = GENRE_VOICE_MAP[genre] || null;
  var recommendedIds = genreMap ? (ch==='ja'?genreMap.ja:genreMap.ko) : null;

  if(mode==='tiki'){
    return {
      count:2,
      label:'티키타카 2인 (주장 vs 반박)',
      speakers:[
        {label:'화자 A (주장)', voiceId: recommendedIds?recommendedIds[0]:(ch==='ja'?'takeshi':'mid-m'),  emotion:'강함'},
        {label:'화자 B (반박)', voiceId: recommendedIds?recommendedIds[1]:(ch==='ja'?'aria':'mid-f'),    emotion:'강함'},
      ]
    };
  }
  if(mode==='drama'){
    var chars = studioS4ExtractCharacters(
      (STUDIO.project.s2&&(STUDIO.project.s2.scriptKo||STUDIO.project.s2.scriptJa))||''
    );
    return {
      count: Math.max(chars.length, 2),
      label:'드라마 '+Math.max(chars.length,2)+'인 (등장인물 자동 감지)',
      speakers: chars.map(function(c,i){
        return {label:c, voiceId:voiceList[i%voiceList.length].id, emotion:'중립'};
      })
    };
  }
  if(mode==='long'){
    return {
      count:1,
      label:'롱폼 1인 나레이터',
      speakers:[{label:'나레이터', voiceId:recommendedIds?recommendedIds[0]:'narrator', emotion:genreMap?genreMap.emotion:'중립'}]
    };
  }
  /* 기본: 일반 숏츠 1인 */
  return {
    count:1,
    label:'일반 숏츠 1인 나레이터',
    speakers:[{label:'나레이터', voiceId:recommendedIds?recommendedIds[0]:(ch==='ja'?'yuki':'senior-f'), emotion:genreMap?genreMap.emotion:'중립'}]
  };
}

function studioS4ExtractCharacters(script){
  if(!script) return ['화자A','화자B','나레이터'];
  var chars = {};
  script.split('\n').forEach(function(l){
    var m = l.match(/^([가-힣a-zA-Z]{1,8})\s*[:：]/);
    if(m) chars[m[1]] = true;
  });
  var list = Object.keys(chars).slice(0,5);
  return list.length >= 2 ? list : ['화자A','화자B','나레이터'];
}

/* ═══ 새 _studioS4 함수 ═══ */
function _studioS4(){
  var p   = STUDIO.project;
  var s4  = p.s4 || {};
  var s2  = p.s2 || {};
  var ch  = p.channel || 'ko';
  var mode= (p.s1&&p.s1.mode) || 'shorts';
  var genre=(p.s1&&p.s1.genre)||'';
  var script = s2.scriptKo||s2.scriptJa||p.script||'';

  /* 화자 설정 자동 결정 */
  var modeConfig = studioS4GetModeConfig(mode, ch, genre);
  var speakers = s4.speakers || modeConfig.speakers;
  if(!s4.speakers){ s4.speakers=speakers; STUDIO.project.s4=s4; }

  /* AI 추천 */
  var genreMap = GENRE_VOICE_MAP[genre];
  var recVoiceId = genreMap?(ch==='ja'?genreMap.ja[0]:genreMap.ko[0]):null;
  var curApi = s4.voiceApi||'clova';

  /* 음성 API 목록 */
  var voiceApis = [
    {id:'clova',      name:'ClovaVoice',  price:'₩3/분',  badge:'한국어 최적'},
    {id:'elevenlabs', name:'ElevenLabs',  price:'₩15/분', badge:'감정 최고'},
    {id:'openai',     name:'OpenAI TTS',  price:'₩2/분',  badge:'저렴·무난'},
    {id:'voicevox',   name:'VoiceVox',    price:'무료',    badge:'일본어 전용'},
    {id:'google',     name:'Google TTS',  price:'무료',    badge:'다국어'},
  ];

  var voiceList = ch==='ja' ? STUDIO_VOICE_JA : STUDIO_VOICE_KO;

  /* ── A. API + AI추천 (한 줄) ── */
  var apiRowHtml =
    '<div class="studio-section">' +
    '<div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap">' +

    /* API 선택 (왼쪽) */
    '<div style="flex:1;min-width:200px">' +
      '<div class="studio-label">🤖 음성 API</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
      voiceApis.map(function(a){
        var on=curApi===a.id;
        var st=(typeof ucApiKeyStatus==='function')?ucApiKeyStatus(a.id):{ok:false};
        return '<button onclick="studioS4SetApi(\''+a.id+'\')" style="border:2px solid '+(on?'var(--pink)':'var(--line)')+';background:'+(on?'var(--pink-soft)':'#fff')+';border-radius:10px;padding:6px 10px;cursor:pointer;font-family:inherit;transition:.15s;text-align:left">'+
          '<div style="font-size:11px;font-weight:800;color:'+(on?'var(--pink)':'var(--text)')+'">'+a.name+'</div>'+
          '<div style="font-size:10px;color:var(--sub)">'+a.price+'</div>'+
          '<div style="font-size:10px;color:'+(st.ok?'#27ae60':'#e74c3c')+'">'+st.label+'</div>'+
        '</button>';
      }).join('')+
      '</div>'+
      '<button onclick="renderApiSettings()" style="margin-top:6px;border:none;background:#f0e8ef;color:var(--pink);border-radius:999px;padding:4px 12px;font-size:11px;font-weight:700;cursor:pointer">⚙️ 키 설정</button>'+
    '</div>'+

    /* AI 추천 (오른쪽, 작게) */
    (genreMap?
    '<div style="min-width:180px;max-width:220px;background:linear-gradient(135deg,#fff5fa,#f7f4ff);border:1.5px solid var(--pink);border-radius:12px;padding:10px">' +
      '<div style="font-size:11px;font-weight:900;color:var(--pink);margin-bottom:6px">🤖 AI 추천</div>' +
      genreMap[ch==='ja'?'ja':'ko'].slice(0,2).map(function(vid,i){
        var v=voiceList.find(function(x){return x.id===vid;})||{label:vid};
        return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">'+
          '<span style="font-size:12px">'+(i===0?'🥇':'🥈')+'</span>'+
          '<span style="font-size:11px;font-weight:700">'+v.label+'</span>'+
          (i===0?'<button onclick="studioS4ApplyRec(\''+vid+'\')" style="margin-left:auto;border:none;background:var(--pink);color:#fff;border-radius:999px;padding:2px 8px;font-size:10px;cursor:pointer">적용</button>':'')+ 
        '</div>';
      }).join('')+
    '</div>'
    :'') +

    '</div></div>';

  /* ── B. 화자 설정 (모드별 자동) ── */
  var speakerHtml =
    '<div class="studio-section">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
      '<div class="studio-label" style="margin:0">👥 B. 화자 설정 <span style="font-size:11px;color:var(--sub);font-weight:400">— '+modeConfig.label+'</span></div>' +
      '<button onclick="studioS4ResetSpeakers()" class="studio-btn ghost" style="font-size:11px">🔄 자동 초기화</button>' +
    '</div>';

  speakerHtml += '<div style="display:flex;flex-direction:column;gap:8px">';
  speakers.forEach(function(sp,si){
    speakerHtml +=
      '<div style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px">' +
      '<div style="font-size:12px;font-weight:900;margin-bottom:8px">'+sp.label+'</div>' +

      /* 목소리 선택 — 칩 형식 (한 줄 스크롤) */
      '<div style="overflow-x:auto;white-space:nowrap;padding-bottom:4px;margin-bottom:6px">' +
      voiceList.map(function(v){
        var on=sp.voiceId===v.id;
        return '<button onclick="studioS4SetSpeakerVoice('+si+',\''+v.id+'\')" style="display:inline-block;border:2px solid '+(on?'var(--pink)':'var(--line)')+';background:'+(on?'var(--pink-soft)':'#fff')+';border-radius:999px;padding:5px 10px;cursor:pointer;font-size:11px;font-weight:700;margin-right:4px;white-space:nowrap;color:'+(on?'var(--pink)':'var(--text)')+'">'+v.label+'</button>';
      }).join('')+
      '</div>' +

      /* 감정 + 속도 한 줄 */
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
        '<div style="display:flex;gap:4px;flex-wrap:wrap">' +
        ['중립','따뜻함','강함','밝음','감동','긴장','충격','차분'].map(function(e){
          var on=sp.emotion===e;
          return '<button onclick="studioS4SetSpeakerEmotion('+si+',\''+e+'\')" style="border:1.5px solid '+(on?'var(--pink)':'var(--line)')+';background:'+(on?'var(--pink-soft)':'#fff')+';border-radius:999px;padding:3px 8px;font-size:10px;font-weight:700;cursor:pointer;color:'+(on?'var(--pink)':'var(--sub)')+'">'+e+'</button>';
        }).join('')+
        '</div>'+
        '<div style="display:flex;align-items:center;gap:4px;margin-left:auto">' +
          '<span style="font-size:10px;color:var(--sub)">속도</span>'+
          '<input type="range" min="0.7" max="1.3" step="0.05" value="'+(sp.speed||1.0)+'" '+
            'oninput="studioS4SetSpeakerSpeed('+si+',this.value)" '+
            'style="width:60px;accent-color:var(--pink)">'+
          '<span style="font-size:10px;font-weight:700">'+(sp.speed||1.0)+'x</span>'+
        '</div>'+
      '</div>'+
      '</div>';
  });

  /* 화자 추가 버튼 (드라마 모드) */
  if(mode==='drama' || speakers.length<5){
    speakerHtml += '<button onclick="studioS4AddSpeaker()" class="studio-btn ghost" style="font-size:12px;width:100%">+ 화자 추가</button>';
  }
  speakerHtml += '</div></div>';

  /* ── C. 씬별 감정 (컴팩트 테이블) ── */
  var scenes = (p.s3&&p.s3.scenes)||(p.s2&&_studioS3ParseScenes&&_studioS3ParseScenes(script))||[];
  var sceneEmotions = s4.sceneEmotions || studioS4AutoEmotions(scenes);
  var sceneHtml = '';
  if(scenes.length){
    sceneHtml =
      '<div class="studio-section">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
        '<div class="studio-label" style="margin:0">🎭 C. 씬별 감정·속도 ('+scenes.length+'개)</div>' +
        '<button onclick="studioS4AutoSetEmotions()" class="studio-btn ghost" style="font-size:11px">🤖 AI 자동</button>' +
      '</div>' +

      /* 컴팩트 테이블 */
      '<div style="background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden">' +
      '<div style="display:grid;grid-template-columns:80px 1fr auto auto auto;gap:0;font-size:10px;font-weight:800;color:var(--sub);padding:6px 10px;background:#f8f8f8;border-bottom:1px solid var(--line)">'+
        '<div>씬</div><div>감정</div><div>속도</div><div>화자</div><div>음성</div>'+
      '</div>'+
      scenes.map(function(sc,i){
        var se = sceneEmotions[i]||{emotion:'중립',speed:1.0,speaker:0};
        var hasAudio = s4.audios&&s4.audios[i];
        return '<div style="display:grid;grid-template-columns:80px 1fr auto auto auto;gap:0;align-items:center;padding:5px 10px;border-bottom:1px solid #f5f5f5;font-size:11px">'+
          '<div style="font-weight:700">'+sc.label.slice(0,8)+'</div>'+
          '<div>'+
            '<select onchange="studioS4SetSceneEmotion('+i+',this.value)" style="border:1px solid var(--line);border-radius:6px;padding:2px 4px;font-size:10px;width:64px">'+
              ['중립','따뜻함','강함','밝음','감동','긴장','충격','차분'].map(function(e){
                return '<option '+(se.emotion===e?'selected':'')+'>'+e+'</option>';
              }).join('')+
            '</select>'+
          '</div>'+
          '<div style="display:flex;align-items:center;gap:2px">'+
            '<input type="range" min="0.7" max="1.3" step="0.05" value="'+se.speed+'" '+
              'oninput="studioS4SetSceneSpeed('+i+',this.value)" style="width:45px;accent-color:var(--pink)">'+
            '<span style="font-size:9px;width:24px">'+se.speed+'x</span>'+
          '</div>'+
          '<div>'+
            (speakers.length>1?
              '<select onchange="studioS4SetSceneSpeaker('+i+',this.value)" style="border:1px solid var(--line);border-radius:6px;padding:2px 4px;font-size:10px">'+
                speakers.map(function(sp,si){ return '<option value="'+si+'" '+(se.speaker===si?'selected':'')+'>'+sp.label.slice(0,4)+'</option>'; }).join('')+
              '</select>'
            :'<span style="font-size:10px;color:var(--sub)">1인</span>')+
          '</div>'+
          '<div>'+
            (hasAudio?
              '<div style="display:flex;gap:2px">'+
                '<button onclick="studioS4PlayScene('+i+')" title="듣기" style="border:none;background:#27ae60;color:#fff;border-radius:4px;padding:2px 5px;font-size:10px;cursor:pointer">▶</button>'+
                '<button onclick="studioS4RegenScene('+i+')" title="재생성" style="border:none;background:#eee;border-radius:4px;padding:2px 5px;font-size:10px;cursor:pointer">↺</button>'+
              '</div>'
            :
              '<button onclick="studioS4GenScene('+i+')" title="생성" style="border:none;background:var(--pink);color:#fff;border-radius:4px;padding:2px 5px;font-size:10px;cursor:pointer">⚡</button>'
            )+
          '</div>'+
        '</div>';
      }).join('')+
      '</div>' +

      /* 일괄 생성 */
      '<div style="display:flex;gap:6px;margin-top:8px">' +
        '<button onclick="studioS4GenAll()" class="studio-btn pri" style="font-size:12px">⚡ 전체 생성</button>' +
        ((s4.audios&&s4.audios.some(function(a){return !!a;}))?
          '<button onclick="studioS4PlayAll()" class="studio-btn ghost" style="font-size:12px">▶ 전체 듣기</button>'+
          '<button onclick="studioS4DownloadAll()" class="studio-btn ghost" style="font-size:12px">💾 저장</button>'
        :'')+
      '</div>'+
      ((s4.audios&&s4.audios.some(function(a){return !!a;}))?'<audio id="s4-player" controls style="width:100%;margin-top:8px;border-radius:8px"></audio>':'')+
      '</div>';
  }

  /* ── D. BGM ── */
  var bgmHtml =
    '<div class="studio-section">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
      '<div class="studio-label" style="margin:0">🎵 D. BGM</div>' +
      '<button onclick="studioS4AutoBgm()" class="studio-btn ghost" style="font-size:11px">🤖 자동매칭</button>' +
    '</div>' +
    '<div class="studio-chips" id="s4-bgm">' +
    STUDIO_BGM.map(function(b){
      return '<button class="studio-chip'+(s4.bgm===b?' on':'')+'" onclick="studioS4Bgm(\''+b+'\',this)">'+b+'</button>';
    }).join('')+
    '</div>'+
    '<label style="cursor:pointer;display:inline-block;margin-top:6px">'+
      '<span class="studio-btn ghost" style="font-size:11px">📁 내 BGM</span>'+
      '<input type="file" accept="audio/*" style="display:none" onchange="studioS4HandleBgm(this)">'+
    '</label>'+
    '<div style="display:flex;align-items:center;gap:8px;margin-top:8px">' +
      '<span style="font-size:11px;color:var(--sub)">음성</span>'+
      '<input type="range" min="50" max="100" value="'+(s4.voiceVol||100)+'" oninput="STUDIO.project.s4.voiceVol=parseInt(this.value);studioSave()" style="width:80px;accent-color:var(--pink)">'+
      '<span style="font-size:11px;font-weight:700">'+(s4.voiceVol||100)+'%</span>'+
      '<span style="font-size:11px;color:var(--sub);margin-left:8px">BGM</span>'+
      '<input type="range" min="0" max="50" value="'+(s4.bgmVolume||15)+'" oninput="STUDIO.project.s4.bgmVolume=parseInt(this.value);studioSave()" style="width:80px;accent-color:var(--pink)">'+
      '<span style="font-size:11px;font-weight:700">'+(s4.bgmVolume||15)+'%</span>'+
    '</div>'+
    '</div>';

  return '<div class="studio-panel">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">'+
      '<div><h4 style="margin:0 0 2px">③ 음성·BGM</h4>'+
      '<div style="font-size:12px;color:var(--sub)">'+genre+' · '+ch.toUpperCase()+' · '+mode+'</div></div>'+
    '</div>'+
    apiRowHtml + speakerHtml + sceneHtml + bgmHtml +
    '<div class="studio-actions" style="justify-content:space-between;margin-top:14px">'+
      '<button class="studio-btn ghost" onclick="studioGoto(2)">← 이미지</button>'+
      '<button class="studio-btn pri" onclick="studioGoto(4)">다음: 편집 →</button>'+
    '</div>'+
  '</div>';
}

/* 보조 함수 */
function studioS4SetApi(api){
  STUDIO.project.s4=STUDIO.project.s4||{};
  STUDIO.project.s4.voiceApi=api;
  studioSave(); renderStudio();
}

function studioS4ApplyRec(voiceId){
  var s4=STUDIO.project.s4||{};
  s4.speakers=s4.speakers||[{}]; s4.speakers[0].voiceId=voiceId;
  STUDIO.project.s4=s4; studioSave(); renderStudio();
  if(typeof ucShowToast==='function') ucShowToast('✅ 추천 목소리 적용됨','success');
}

function studioS4ResetSpeakers(){
  var p=STUDIO.project;
  var mode=(p.s1&&p.s1.mode)||'shorts';
  var ch=p.channel||'ko';
  var genre=(p.s1&&p.s1.genre)||'';
  var s4=p.s4||{};
  s4.speakers=studioS4GetModeConfig(mode,ch,genre).speakers;
  STUDIO.project.s4=s4; studioSave(); renderStudio();
  if(typeof ucShowToast==='function') ucShowToast('✅ 화자 자동 초기화됨','success');
}

function studioS4AddSpeaker(){
  var s4=STUDIO.project.s4||{};
  s4.speakers=s4.speakers||[];
  if(s4.speakers.length>=5){alert('최대 5인까지 가능합니다');return;}
  var name=prompt('화자 이름:','화자'+(s4.speakers.length+1));
  if(!name) return;
  s4.speakers.push({label:name,voiceId:'narrator',emotion:'중립',speed:1.0});
  STUDIO.project.s4=s4; studioSave(); renderStudio();
}

function studioS4SetSpeakerVoice(idx,val){
  var s4=STUDIO.project.s4||{};
  s4.speakers=s4.speakers||[];
  s4.speakers[idx]=s4.speakers[idx]||{};
  s4.speakers[idx].voiceId=val; STUDIO.project.s4=s4; studioSave(); renderStudio();
}

function studioS4SetSpeakerEmotion(idx,val){
  var s4=STUDIO.project.s4||{};
  s4.speakers=s4.speakers||[];
  s4.speakers[idx]=s4.speakers[idx]||{};
  s4.speakers[idx].emotion=val; STUDIO.project.s4=s4; studioSave(); renderStudio();
}

function studioS4SetSpeakerSpeed(idx,val){
  var s4=STUDIO.project.s4||{};
  s4.speakers=s4.speakers||[];
  s4.speakers[idx]=s4.speakers[idx]||{};
  s4.speakers[idx].speed=parseFloat(val); STUDIO.project.s4=s4; studioSave();
}

function studioS4SetSceneEmotion(idx,val){
  var s4=STUDIO.project.s4||{};
  s4.sceneEmotions=s4.sceneEmotions||[];
  s4.sceneEmotions[idx]=s4.sceneEmotions[idx]||{emotion:'중립',speed:1.0,speaker:0};
  s4.sceneEmotions[idx].emotion=val; STUDIO.project.s4=s4; studioSave();
}

function studioS4SetSceneSpeed(idx,val){
  var s4=STUDIO.project.s4||{};
  s4.sceneEmotions=s4.sceneEmotions||[];
  s4.sceneEmotions[idx]=s4.sceneEmotions[idx]||{emotion:'중립',speed:1.0,speaker:0};
  s4.sceneEmotions[idx].speed=parseFloat(val); STUDIO.project.s4=s4; studioSave();
}

function studioS4SetSceneSpeaker(idx,val){
  var s4=STUDIO.project.s4||{};
  s4.sceneEmotions=s4.sceneEmotions||[];
  s4.sceneEmotions[idx]=s4.sceneEmotions[idx]||{emotion:'중립',speed:1.0,speaker:0};
  s4.sceneEmotions[idx].speaker=parseInt(val); STUDIO.project.s4=s4; studioSave();
}

function studioS4AutoEmotions(scenes){
  var map={훅:'충격',설명:'차분',핵심:'강함',강조:'감동',CTA:'밝음',주장:'강함',반박:'긴장',결론:'감동',챕터:'중립'};
  return scenes.map(function(s,i){
    var key=Object.keys(map).find(function(k){return s.label&&s.label.includes(k);});
    return {emotion:key?map[key]:'중립', speed:key==='훅'?1.1:key==='CTA'?0.9:1.0, pause:0.3, speaker:0};
  });
}

async function studioS4AutoSetEmotions(){
  var scenes=(STUDIO.project.s3&&STUDIO.project.s3.scenes)||[];
  if(!scenes.length){alert('씬이 없어요');return;}
  var sys='유튜브 영상 감정 분석. JSON만 출력.';
  var user='씬 목록에 감정·속도 배정:\n형식:[{"emotion":"중립","speed":1.0,"speaker":0}]\n씬:\n'+
    scenes.map(function(s,i){return i+': '+s.label;}).join('\n');
  try{
    var res=await APIAdapter.callWithFallback(sys,user,{maxTokens:500});
    var m=res.match(/\[[\s\S]*\]/);
    if(m){
      STUDIO.project.s4=STUDIO.project.s4||{};
      STUDIO.project.s4.sceneEmotions=JSON.parse(m[0]);
      studioSave(); renderStudio();
      if(typeof ucShowToast==='function') ucShowToast('✅ AI 감정 자동 설정됨','success');
    }
  }catch(e){alert('오류: '+e.message);}
}

function studioS4AutoBgm(){
  var genre=(STUDIO.project.s1&&STUDIO.project.s1.genre)||'';
  var map={'시니어건강':'soft piano','재테크':'cinematic orchestral','유머':'playful comedy','감동':'nostalgic piano','히스토리':'cinematic orchestral'};
  var bgm=map[genre]||'ambient calm';
  STUDIO.project.s4=STUDIO.project.s4||{}; STUDIO.project.s4.bgm=bgm;
  studioSave(); renderStudio();
  if(typeof ucShowToast==='function') ucShowToast('✅ BGM: '+bgm,'success');
}

function studioS4Bgm(b,btn){
  STUDIO.project.s4=STUDIO.project.s4||{}; STUDIO.project.s4.bgm=b;
  document.querySelectorAll('#s4-bgm .studio-chip').forEach(function(x){x.classList.remove('on');});
  if(btn) btn.classList.add('on'); studioSave();
}

function studioS4HandleBgm(input){
  var file=input.files[0]; if(!file) return;
  var reader=new FileReader();
  reader.onload=function(e){
    STUDIO.project.s4=STUDIO.project.s4||{}; STUDIO.project.s4.bgmCustom=e.target.result;
    studioSave(); renderStudio();
    if(typeof ucShowToast==='function') ucShowToast('✅ BGM 업로드 완료','success');
  };
  reader.readAsDataURL(file);
}

async function studioS4GenScene(idx){
  var s4=STUDIO.project.s4||{};
  var scenes=(STUDIO.project.s3&&STUDIO.project.s3.scenes)||[];
  var sc=scenes[idx]; if(!sc) return;
  var text=sc.desc||sc.label||'';
  var key=(typeof ucGetApiKey==='function')?ucGetApiKey('openai'):localStorage.getItem('uc_openai_key')||'';
  if(!key){alert('OpenAI API 키를 설정해주세요');return;}
  if(typeof ucShowToast==='function') ucShowToast('⏳ 씬'+(idx+1)+' 음성 생성 중...','info');
  try{
    var se=(s4.sceneEmotions&&s4.sceneEmotions[idx])||{speed:1.0};
    var r=await fetch('https://api.openai.com/v1/audio/speech',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body:JSON.stringify({model:'tts-1',input:text,voice:s4.speakers&&s4.speakers[0]?'nova':'nova',speed:se.speed||1.0})
    });
    var blob=await r.blob();
    var url=URL.createObjectURL(blob);
    s4.audios=s4.audios||[]; s4.audios[idx]=url;
    STUDIO.project.s4=s4; studioSave(); renderStudio();
    if(typeof ucShowToast==='function') ucShowToast('✅ 씬'+(idx+1)+' 음성 완료','success');
  }catch(e){alert('음성 생성 오류: '+e.message);}
}

function studioS4PlayScene(idx){
  var url=(STUDIO.project.s4&&STUDIO.project.s4.audios&&STUDIO.project.s4.audios[idx]);
  if(!url) return;
  var p=document.getElementById('s4-player');
  if(p){p.src=url;p.play();}else{new Audio(url).play();}
}

function studioS4RegenScene(idx){
  var s4=STUDIO.project.s4||{};
  s4.audios=s4.audios||[]; s4.audios[idx]=null;
  STUDIO.project.s4=s4; studioSave(); studioS4GenScene(idx);
}

function studioS4SaveScene(idx){
  var url=(STUDIO.project.s4&&STUDIO.project.s4.audios&&STUDIO.project.s4.audios[idx]);
  if(!url) return;
  var a=document.createElement('a'); a.href=url; a.download='scene_'+(idx+1)+'.mp3'; a.click();
}

async function studioS4GenAll(){
  var scenes=(STUDIO.project.s3&&STUDIO.project.s3.scenes)||[];
  for(var i=0;i<scenes.length;i++){await studioS4GenScene(i);await new Promise(function(r){setTimeout(r,600);});}
}

function studioS4PlayAll(){
  var s4=STUDIO.project.s4||{};
  var first=(s4.audios||[]).find(function(a){return!!a;});
  if(!first){alert('먼저 음성을 생성해주세요');return;}
  var p=document.getElementById('s4-player'); if(p){p.src=first;p.play();}
}

function studioS4DownloadAll(){
  (STUDIO.project.s4&&STUDIO.project.s4.audios||[]).forEach(function(url,i){
    if(!url) return;
    var a=document.createElement('a'); a.href=url; a.download='scene_'+(i+1)+'.mp3'; a.click();
  });
}

function studioS4VoiceKo(id,btn){studioS4SetSpeakerVoice(0,id);}
function studioS4VoiceJa(id,btn){studioS4SetSpeakerVoice(0,id);}
function _studioBindS4(){}
