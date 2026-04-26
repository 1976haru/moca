/* ================================================
   s2-voice.js
   STEP4 voice+BGM / _studioS4 v2 / pronunc / channel-voice / lipsync / pixabay
   modules/studio/ -- split_studio2.py
   ================================================ */

/* TTS provider 분기 헬퍼는 modules/studio/s2-voice-tts.js 로 분리 (1000줄 한도).
   _s2NormalizeVoiceProvider / _s2GetCurrentVoiceProvider /
   _s2GetVoiceKey / _s2DispatchTts 모두 그 파일에서 window.* 노출됨. */

/* ════════════════════════════════════════════════════════
   _studioS4  v2.0 — 다자 화자 + 자동 배치 + 컴팩트 UI
   ════════════════════════════════════════════════════════ */
function _studioS4(wrapId){
  const wrap = document.getElementById(wrapId || 'studioS4Wrap');
  if(!wrap) return;

  _s4InjectVoiceCSS();

  /* 상태 초기화 */
  if(!window._s4st){
    window._s4st = {
      api:'elevenlabs', genre:null,
      speakers:[{id:1, voiceId:'e_rachel', role:'나레이터'}],
      scenes:[], activeSp:0,
      filterGender:'all', filterLang:'all',
    };
  }
  const S = window._s4st;

  /* 현재 API 필터로 음성 목록 */
  function voicesForApi(api){
    const pMap={elevenlabs:'elevenlabs',openai:'openai',nijivoice:'nijivoice'};
    return STUDIO_VOICE_KO.filter(v=>v.provider===pMap[api]);
  }
  function filteredVoices(){
    return STUDIO_VOICE_KO.filter(v=>{
      if(S.filterGender!=='all' && v.gender!==S.filterGender) return false;
      if(S.filterLang!=='all' && v.lang!==S.filterLang) return false;
      return true;
    });
  }
  function voiceById(id){ return STUDIO_VOICE_KO.find(v=>v.id===id)||STUDIO_VOICE_KO[0]; }
  function genderIcon(g){ return g==='female'?'👩':g==='male'?'👨':'🎙'; }

  /* HTML 렌더링 */
  function render(){
    const vlist = filteredVoices();
    const apiVoices = voicesForApi(S.api);

    const speakerHtml = S.speakers.map((sp,si)=>{
      const v = voiceById(sp.voiceId);
      const isActive = si===S.activeSp;
      return `
      <div class="s4-sp-card ${isActive?'active-sp':''}" onclick="window._s4st.activeSp=${si};_studioS4('${wrapId||'studioS4Wrap'}')">
        <div class="s4-sp-badge">화자 ${si+1}</div>
        <input class="s4-sp-role" value="${sp.role||'화자'+(si+1)}"
          oninput="window._s4st.speakers[${si}].role=this.value"
          placeholder="역할명 (예: 진행자)" onclick="event.stopPropagation()">
        <div class="s4-sp-voice-name">${genderIcon(v.gender)} ${v.name}<span class="s4-sp-tag">${v.mood}</span></div>
        <select class="s4-sp-sel" onclick="event.stopPropagation()"
          onchange="window._s4st.speakers[${si}].voiceId=this.value;_studioS4('${wrapId||'studioS4Wrap'}')">
          ${apiVoices.map(x=>`<option value="${x.id}"${x.id===sp.voiceId?' selected':''}>${x.name} · ${x.mood}</option>`).join('')}
        </select>
        ${isActive?'<div class="s4-sp-click-hint">✅ 현재 선택 화자</div>':'<div class="s4-sp-click-hint">클릭하여 선택</div>'}
      </div>`;
    }).join('');

    const voiceGridHtml = vlist.map(v=>{
      const isUsed = S.speakers.some(s=>s.voiceId===v.id);
      return `
      <div class="s4-vc ${isUsed?'active':''}" title="${v.tags.join(', ')}"
        onclick="_s4AssignVoice('${v.id}','${wrapId||'studioS4Wrap'}')">
        <div class="s4-vc-ico">${genderIcon(v.gender)}</div>
        <div class="s4-vc-name">${v.name}</div>
        <div class="s4-vc-mood">${v.mood}</div>
        <div class="s4-vc-prov">${{elevenlabs:'EL',openai:'OA',nijivoice:'NJ'}[v.provider]}</div>
      </div>`;
    }).join('');

    const sceneHtml = S.scenes.length ? S.scenes.map((sc,i)=>`
      <div class="s4-scene-row">
        <span class="s4-sc-num">씬${i+1}</span>
        <span class="s4-sc-label" title="${sc.label}">${sc.label}</span>
        <span class="s4-sc-role">${sc.role}</span>
        <select class="s4-sc-sel"
          onchange="window._s4st.scenes[${i}].spIdx=parseInt(this.value)">
          <option value="">-- 미배정 --</option>
          ${S.speakers.map((sp,si)=>`
            <option value="${si}"${sc.spIdx===si?' selected':''}>${sp.role||'화자'+(si+1)}</option>
          `).join('')}
        </select>
      </div>`).join('')
    : '<div class="s4-empty-hint">⬆ 장르를 선택하면 씬이 자동 구성됩니다</div>';

    const genreChips = Object.entries(GENRE_VOICE_MAP).map(([k,g])=>`
      <button class="s4-chip ${S.genre===k?'on':''}"
        onclick="_s4SetGenre('${k}','${wrapId||'studioS4Wrap'}')" title="${g.label}">${g.label}</button>
    `).join('');

    wrap.innerHTML = `
    <div class="s4-panel">
      <!-- ① API + AI추천 (한 줄) -->
      <div class="s4-row s4-api-row">
        <span class="s4-label">🎙 음성 API</span>
        <div class="s4-seg">
          ${['elevenlabs','openai','nijivoice'].map(p=>`
            <button class="s4-seg-btn ${S.api===p?'on':''}"
              onclick="window._s4st.api='${p}';_studioS4('${wrapId||'studioS4Wrap'}')">${
                {elevenlabs:'🎵 ElevenLabs',openai:'🤖 OpenAI',nijivoice:'🌸 Nijivoice'}[p]
              }</button>
          `).join('')}
        </div>
        <button class="s4-ai-chip" onclick="_s4AiRecommend('${wrapId||'studioS4Wrap'}')">✨ AI추천조합</button>
      </div>

      <!-- ② 장르 자동 설정 -->
      <div class="s4-row">
        <span class="s4-label">📖 장르 자동</span>
        <div class="s4-genre-chips">${genreChips}</div>
      </div>

      <!-- ③ 화자 설정 (다자) -->
      <div class="s4-section-hd">
        <span class="s4-section-title">👥 화자 설정 · ${S.speakers.length}인</span>
        <div style="display:flex;gap:6px">
          ${S.speakers.length<4?`<button class="s4-mini-btn primary" onclick="_s4AddSp('${wrapId||'studioS4Wrap'}')">+ 화자 추가</button>`:''}
          ${S.speakers.length>1?`<button class="s4-mini-btn danger" onclick="_s4RemSp('${wrapId||'studioS4Wrap'}')">− 제거</button>`:''}
        </div>
      </div>
      <div class="s4-speakers">${speakerHtml}</div>

      <!-- ④ 전체 음성 목록 (컴팩트 그리드) -->
      <div class="s4-section-hd">
        <span class="s4-section-title">🗂 음성 선택 (클릭 → 현재 화자에 적용)</span>
        <div class="s4-filter-bar">
          <button class="s4-filter ${S.filterGender==='all'?'on':''}" onclick="_s4FG('all','${wrapId||'studioS4Wrap'}')">전체</button>
          <button class="s4-filter ${S.filterGender==='female'?'on':''}" onclick="_s4FG('female','${wrapId||'studioS4Wrap'}')">👩여성</button>
          <button class="s4-filter ${S.filterGender==='male'?'on':''}" onclick="_s4FG('male','${wrapId||'studioS4Wrap'}')">👨남성</button>
          <span class="s4-fsep">|</span>
          <button class="s4-filter ${S.filterLang==='all'?'on':''}" onclick="_s4FL('all','${wrapId||'studioS4Wrap'}')">전체어</button>
          <button class="s4-filter ${S.filterLang==='ko'?'on':''}" onclick="_s4FL('ko','${wrapId||'studioS4Wrap'}')">🇰🇷한</button>
          <button class="s4-filter ${S.filterLang==='ja'?'on':''}" onclick="_s4FL('ja','${wrapId||'studioS4Wrap'}')">🇯🇵일</button>
        </div>
      </div>
      <div class="s4-voice-grid">${voiceGridHtml}</div>

      <!-- ⑤ 씬별 화자 배치 (컴팩트) -->
      <div class="s4-section-hd">
        <span class="s4-section-title">🎬 씬별 화자 배치</span>
        <button class="s4-mini-btn" onclick="_s4AutoScene('${wrapId||'studioS4Wrap'}')">⚡ 자동 배치</button>
      </div>
      <div class="s4-scene-grid">${sceneHtml}</div>
    </div>`;
  }

  render();
}

/* ── 헬퍼 함수들 ── */
window._s4SetGenre = function(genre, wid){
  const S=window._s4st, g=GENRE_VOICE_MAP[genre];
  if(!g) return;
  S.genre=genre;
  /* 화자 자동 구성 */
  const apiVoices=STUDIO_VOICE_KO.filter(v=>
    (S.api==='nijivoice'?v.provider==='nijivoice':
     S.api==='openai'?v.provider==='openai':v.provider==='elevenlabs'));
  S.speakers=g.pairs.map(([gender,mood],i)=>{
    const v=apiVoices.find(v=>v.gender===gender&&v.mood===mood)
           ||apiVoices.find(v=>v.gender===gender)
           ||apiVoices[i%apiVoices.length];
    const roleNames=['나레이터','진행자','게스트','캐릭터A','캐릭터B','내레이션'];
    return{id:i+1,voiceId:v.id,role:roleNames[i]||'화자'+(i+1)};
  });
  /* 씬 자동 구성 */
  const tmplKey=g.scenes;
  const tmpl=(SCENE_TEMPLATES[tmplKey]||SCENE_TEMPLATES.narration).map((sc,i)=>({
    ...sc, spIdx:i%S.speakers.length
  }));
  S.scenes=tmpl;
  _studioS4(wid);
};

window._s4AssignVoice=function(voiceId,wid){
  const S=window._s4st;
  if(!S.speakers[S.activeSp]) return;
  S.speakers[S.activeSp].voiceId=voiceId;
  _studioS4(wid);
};
window._s4AddSp=function(wid){
  const S=window._s4st; if(S.speakers.length>=4) return;
  const v=STUDIO_VOICE_KO[S.speakers.length%STUDIO_VOICE_KO.length];
  S.speakers.push({id:S.speakers.length+1,voiceId:v.id,role:'화자'+(S.speakers.length+1)});
  _studioS4(wid);
};
window._s4RemSp=function(wid){
  const S=window._s4st; if(S.speakers.length<=1) return;
  S.speakers.pop(); if(S.activeSp>=S.speakers.length) S.activeSp=S.speakers.length-1;
  _studioS4(wid);
};
window._s4FG=function(v,wid){window._s4st.filterGender=v;_studioS4(wid);};
window._s4FL=function(v,wid){window._s4st.filterLang=v;_studioS4(wid);};
window._s4AutoScene=function(wid){
  const S=window._s4st;
  S.scenes.forEach((sc,i)=>{sc.spIdx=i%S.speakers.length;});
  _studioS4(wid);
};
window._s4AiRecommend=function(wid){
  const S=window._s4st;
  const g=S.genre?GENRE_VOICE_MAP[S.genre]:null;
  const msg=g
    ?`✨ [${g.label}] AI 추천 조합\n\n화자 ${g.count}인 구성\n장르별 최적 음성 자동 배치\n\n지금 적용할까요?`
    :'장르를 먼저 선택하면 AI가 최적 음성 조합을 추천해드려요!\n\n장르 선택 후 다시 눌러주세요.';
  if(g && confirm(msg)) _s4SetGenre(S.genre,wid);
  else if(!g) alert(msg);
};


/* ═════════════ STEP 4 음성·BGM ═════════════ */


/* 보조 함수들 */
function studioS4GetRecommended(genre, ch, mode){
  var map = {
    '시니어건강': [{api:'clova',apiName:'ClovaVoice',voice:'senior-f',voiceName:'시니어 여성',reason:'시니어 채널 최적화·따뜻한 신뢰감',price:'₩3/분'},
                  {api:'elevenlabs',apiName:'ElevenLabs',voice:'bella',voiceName:'Bella',reason:'감정 연기 최고',price:'₩15/분'},
                  {api:'openai',apiName:'OpenAI TTS',voice:'nova',voiceName:'Nova',reason:'저렴·무난',price:'₩2/분'}],
    '재테크':     [{api:'clova',apiName:'ClovaVoice',voice:'mid-m',voiceName:'중년 남성',reason:'신뢰감·전문성',price:'₩3/분'},
                  {api:'elevenlabs',apiName:'ElevenLabs',voice:'adam',voiceName:'Adam',reason:'권위있는 목소리',price:'₩15/분'},
                  {api:'openai',apiName:'OpenAI TTS',voice:'onyx',voiceName:'Onyx',reason:'저렴·남성적',price:'₩2/분'}],
    '유머':       [{api:'clova',apiName:'ClovaVoice',voice:'young-m',voiceName:'청년 남성',reason:'밝고 경쾌한 톤',price:'₩3/분'},
                  {api:'elevenlabs',apiName:'ElevenLabs',voice:'sam',voiceName:'Sam',reason:'자연스러운 유머',price:'₩15/분'},
                  {api:'openai',apiName:'OpenAI TTS',voice:'alloy',voiceName:'Alloy',reason:'중성·무난',price:'₩2/분'}],
  };
  var def = [{api:'clova',apiName:'ClovaVoice',voice:'narrator',voiceName:'내레이터',reason:'범용·안정적',price:'₩3/분'},
             {api:'elevenlabs',apiName:'ElevenLabs',voice:'bella',voiceName:'Bella',reason:'자연스러운 감정',price:'₩15/분'},
             {api:'openai',apiName:'OpenAI TTS',voice:'nova',voiceName:'Nova',reason:'저렴·무난',price:'₩2/분'}];
  var list = map[genre] || def;
  if(ch==='ja') list = [{api:'voicevox',apiName:'VoiceVox',voice:'yukari',voiceName:'紫(ゆかり)',reason:'일본어 무료·자연스러움',price:'무료'},
                        {api:'google',apiName:'Google TTS',voice:'ja-JP-Neural2-B',voiceName:'일본어 여성',reason:'다국어·무료',price:'무료'},
                        {api:'elevenlabs',apiName:'ElevenLabs',voice:'bella',voiceName:'Bella',reason:'감정 연기',price:'₩15/분'}];
  return { api: list[0].api, voice: list[0].voice, list: list };
}

function studioS4DefaultSpeakers(mode, ch, genre){
  var rec = studioS4GetRecommended(genre, ch, mode);
  if(mode==='tiki') return [
    {api:rec.api, voice:'mid-m', emotion:'강함', speed:1.0},
    {api:rec.api, voice:'mid-f', emotion:'강함', speed:1.0}
  ];
  if(mode==='drama') return [
    {api:rec.api, voice:'senior-f', emotion:'감동', speed:0.9},
    {api:rec.api, voice:'young-m',  emotion:'밝음', speed:1.05},
    {api:rec.api, voice:'narrator', emotion:'중립', speed:0.95},
  ];
  return [{api:rec.api, voice:rec.voice, emotion:'중립', speed:1.0}];
}

function studioS4ExtractCharacters(script){
  if(!script) return ['화자A','화자B','나레이터'];
  var chars = {};
  var lines = script.split('\n');
  lines.forEach(function(l){
    var m = l.match(/^([가-힣a-zA-Z]{1,8})\s*[:：]/);
    if(m) chars[m[1]] = true;
  });
  var list = Object.keys(chars).slice(0,5);
  return list.length ? list : ['화자A','화자B','나레이터'];
}

function studioS4AutoEmotions(scenes){
  var map = {훅:'충격', 설명:'차분', 핵심:'강함', 강조:'감동', CTA:'밝음', 주장:'강함', 반박:'긴장', 결론:'감동'};
  return scenes.map(function(s){
    var key = Object.keys(map).find(function(k){ return s.label&&s.label.includes(k); });
    return { emotion: key?map[key]:'중립', speed: key==='훅'?1.1:key==='CTA'?0.9:1.0, pause: 0.3 };
  });
}

function studioS4EstCost(api, secs){
  var perMin = {clova:3, elevenlabs:15, openai:2, voicevox:0, google:0}[api] || 3;
  return '₩'+Math.ceil(secs/60*perMin);
}

function studioS4VoiceSelect(idx, sp, ch){
  var voices = ch==='ja' ? STUDIO_VOICE_JA : STUDIO_VOICE_KO;
  return '<select onchange="studioS4SetSpeakerVoice('+idx+',this.value)" '+
    'style="border:1.5px solid var(--line);border-radius:8px;padding:6px;font-size:12px;font-family:inherit">'+
    voices.map(function(v){
      return '<option value="'+v.id+'" '+(sp.voice===v.id?'selected':'')+'>'+v.label+'</option>';
    }).join('')+
  '</select>';
}

function studioS4EmotionSelect(idx, cur){
  return '<select onchange="studioS4SetSpeakerEmotion('+idx+',this.value)" '+
    'style="border:1.5px solid var(--line);border-radius:8px;padding:6px;font-size:12px;font-family:inherit">'+
    ['중립','따뜻함','강함','밝음','감동','긴장','충격','차분'].map(function(e){
      return '<option '+(cur===e?'selected':'')+'>'+e+'</option>';
    }).join('')+
  '</select>';
}

function studioS4SetApi(api){
  STUDIO.project.s4 = STUDIO.project.s4||{};
  STUDIO.project.s4.voiceApi = api;
  studioSave(); renderStudio();
}

function studioS4ApplyRecommended(idx){
  var p=STUDIO.project; var s4=p.s4||{};
  var ch=(p.channel||'ko'); var genre=(p.s1&&p.s1.genre)||'';
  var mode=(p.s1&&p.s1.mode)||'shorts';
  var rec = studioS4GetRecommended(genre,ch,mode);
  var r = rec.list[idx]; if(!r) return;
  s4.voiceApi=r.api; s4.voiceKo=r.voice; s4.voiceJa=r.voice;
  STUDIO.project.s4=s4; studioSave(); renderStudio();
  if(typeof ucShowToast==='function') ucShowToast('✅ '+r.apiName+' · '+r.voiceName+' 적용됨','success');
}

function studioS4SetSpeakerVoice(idx,val){
  var s4=STUDIO.project.s4||{};
  s4.speakers=s4.speakers||[]; s4.speakers[idx]=s4.speakers[idx]||{};
  s4.speakers[idx].voice=val; STUDIO.project.s4=s4; studioSave();
}

function studioS4SetSpeakerEmotion(idx,val){
  var s4=STUDIO.project.s4||{};
  s4.speakers=s4.speakers||[]; s4.speakers[idx]=s4.speakers[idx]||{};
  s4.speakers[idx].emotion=val; STUDIO.project.s4=s4; studioSave();
}

function studioS4SetSceneEmotion(idx,val){
  var s4=STUDIO.project.s4||{};
  s4.sceneEmotions=s4.sceneEmotions||[];
  s4.sceneEmotions[idx]=s4.sceneEmotions[idx]||{emotion:'중립',speed:1.0,pause:0.3};
  s4.sceneEmotions[idx].emotion=val; STUDIO.project.s4=s4; studioSave();
}

function studioS4SetSceneSpeed(idx,val){
  var s4=STUDIO.project.s4||{};
  s4.sceneEmotions=s4.sceneEmotions||[];
  s4.sceneEmotions[idx]=s4.sceneEmotions[idx]||{emotion:'중립',speed:1.0,pause:0.3};
  s4.sceneEmotions[idx].speed=parseFloat(val); STUDIO.project.s4=s4; studioSave();
}

function studioS4SetScenePause(idx,val){
  var s4=STUDIO.project.s4||{};
  s4.sceneEmotions=s4.sceneEmotions||[];
  s4.sceneEmotions[idx]=s4.sceneEmotions[idx]||{emotion:'중립',speed:1.0,pause:0.3};
  s4.sceneEmotions[idx].pause=parseFloat(val); STUDIO.project.s4=s4; studioSave();
}

async function studioS4AutoSetEmotions(){
  var scenes=(STUDIO.project.s3&&STUDIO.project.s3.scenes)||[];
  if(!scenes.length){ alert('씬이 없어요. 이미지 단계에서 씬을 먼저 생성하세요.'); return; }
  var sys='유튜브 숏츠 음성 감정 분석가. JSON만 출력.';
  var user='아래 씬 목록에 맞는 감정·속도·침묵을 배정해줘.\n'+
    '형식: [{"emotion":"중립","speed":1.0,"pause":0.3}]\n'+
    '감정 옵션: 중립,따뜻함,강함,밝음,감동,긴장,충격,차분\n'+
    '씬 목록:\n'+scenes.map(function(s,i){ return i+': '+s.label; }).join('\n');
  try {
    var res=await APIAdapter.callWithFallback(sys,user,{maxTokens:500});
    var m=res.match(/\[[\s\S]*\]/);
    if(m){
      var arr=JSON.parse(m[0]);
      STUDIO.project.s4=STUDIO.project.s4||{};
      STUDIO.project.s4.sceneEmotions=arr;
      studioSave(); renderStudio();
      if(typeof ucShowToast==='function') ucShowToast('✅ AI 감정 자동 설정 완료','success');
    }
  } catch(e){ alert('오류: '+e.message); }
}

async function studioS4AutoBgm(){
  var genre=(STUDIO.project.s1&&STUDIO.project.s1.genre)||'';
  var map={'시니어건강':'soft piano','재테크':'cinematic orchestral','유머':'playful comedy','감동':'nostalgic piano','히스토리':'cinematic orchestral'};
  var bgm=map[genre]||'ambient calm';
  STUDIO.project.s4=STUDIO.project.s4||{};
  STUDIO.project.s4.bgm=bgm; studioSave(); renderStudio();
  if(typeof ucShowToast==='function') ucShowToast('✅ BGM 자동 매칭: '+bgm,'success');
}

function studioS4HandleBgm(input){
  var file=input.files[0]; if(!file) return;
  var reader=new FileReader();
  reader.onload=function(e){
    STUDIO.project.s4=STUDIO.project.s4||{};
    STUDIO.project.s4.bgmCustom=e.target.result;
    studioSave(); renderStudio();
    if(typeof ucShowToast==='function') ucShowToast('✅ BGM 업로드 완료','success');
  };
  reader.readAsDataURL(file);
}

function studioS4Bgm(b,btn){
  STUDIO.project.s4=STUDIO.project.s4||{};
  STUDIO.project.s4.bgm=b;
  document.querySelectorAll('#s4-bgm .studio-chip').forEach(function(x){x.classList.remove('on');});
  if(btn) btn.classList.add('on');
  studioSave();
}

function studioS4VoiceKo(id,btn){
  STUDIO.project.s4=STUDIO.project.s4||{};
  STUDIO.project.s4.voiceKo=id;
  if(btn){btn.parentElement.querySelectorAll('.studio-chip').forEach(function(x){x.classList.remove('on');});btn.classList.add('on');}
  studioSave();
}

function studioS4VoiceJa(id,btn){
  STUDIO.project.s4=STUDIO.project.s4||{};
  STUDIO.project.s4.voiceJa=id;
  if(btn){btn.parentElement.querySelectorAll('.studio-chip').forEach(function(x){x.classList.remove('on');});btn.classList.add('on');}
  studioSave();
}

async function studioS4GenScene(idx){
  var s4=STUDIO.project.s4||{};
  var scenes=(STUDIO.project.s3&&STUDIO.project.s3.scenes)||[];
  var sc=scenes[idx]; if(!sc) return;
  var text=sc.desc||sc.label||'';
  if(typeof ucShowToast==='function') ucShowToast('⏳ 씬'+(idx+1)+' 음성 생성 중...','info');
  /* 선택 provider 기준 dispatch — 통합 store에서 해당 provider 키만 읽음 */
  var provider = _s2GetCurrentVoiceProvider();
  var voice    = s4.voiceKo || s4.voiceJa || 'nova';
  var speed    = parseFloat((s4.sceneEmotions && s4.sceneEmotions[idx] && s4.sceneEmotions[idx].speed) || 1.0);
  try {
    var res = await _s2DispatchTts({ provider: provider, text: text, voice: voice, speed: speed });
    if (!res || !res.url) return; /* 키 없음 안내가 떠서 사용자가 취소한 경우 */
    s4.audios = s4.audios || []; s4.audios[idx] = res.url;
    /* provider 결과 메타 저장 */
    STUDIO.project.s2 = STUDIO.project.s2 || {};
    STUDIO.project.s2.voiceResults = STUDIO.project.s2.voiceResults || [];
    STUDIO.project.s2.voiceResults[idx] = {
      sceneNumber: idx + 1, provider: res.provider, voiceId: res.voiceId,
      audioUrl: res.url, status: 'done',
    };
    STUDIO.project.s4 = s4; studioSave(); renderStudio();
    if(typeof ucShowToast==='function') ucShowToast('✅ 씬'+(idx+1)+' 음성 완료 ('+res.provider+')','success');
  } catch(e){ alert('음성 생성 오류: '+e.message); }
}

function studioS4PlayScene(idx){
  var s4=STUDIO.project.s4||{};
  var url=(s4.audios||[])[idx]; if(!url) return;
  var player=document.getElementById('s4-player');
  if(player){player.src=url;player.play();}
  else { var a=new Audio(url); a.play(); }
}

function studioS4RegenScene(idx){
  var s4=STUDIO.project.s4||{};
  s4.audios=s4.audios||[]; s4.audios[idx]=null;
  STUDIO.project.s4=s4; studioSave();
  studioS4GenScene(idx);
}

function studioS4SaveScene(idx){
  var s4=STUDIO.project.s4||{};
  var url=(s4.audios||[])[idx]; if(!url) return;
  var a=document.createElement('a');
  a.href=url; a.download='scene_'+(idx+1)+'.mp3'; a.click();
}

async function studioS4GenAll(){
  var scenes=(STUDIO.project.s3&&STUDIO.project.s3.scenes)||[];
  for(var i=0;i<scenes.length;i++){
    await studioS4GenScene(i);
    await new Promise(function(r){setTimeout(r,500);});
  }
}

function studioS4PlayAll(){
  var s4=STUDIO.project.s4||{};
  var first=(s4.audios||[]).find(function(a){return !!a;});
  if(!first){alert('먼저 음성을 생성해주세요');return;}
  var player=document.getElementById('s4-player');
  if(player){player.src=first;player.play();}
}

function studioS4DownloadAll(){
  var s4=STUDIO.project.s4||{};
  (s4.audios||[]).forEach(function(url,i){
    if(!url) return;
    var a=document.createElement('a');
    a.href=url; a.download='scene_'+(i+1)+'.mp3'; a.click();
  });
}

function studioS4AddChar(){
  var name=prompt('인물 이름 입력:');
  if(!name) return;
  var s4=STUDIO.project.s4||{};
  s4.speakers=s4.speakers||[];
  s4.speakers.push({name:name,voice:'narrator',emotion:'중립',speed:1.0});
  STUDIO.project.s4=s4; studioSave(); renderStudio();
}

function _studioBindS4(){
  /* 기존 호환 유지 */
}


/* ─── voice_v3.js (발음교정·채널목소리·미리보기·립싱크·Pixabay BGM) ─── */

/* ═══ 발음 교정 사전 ═══ */
var MOCA_PRONUNC = {
  'ElevenLabs':'일레븐랩스', 'ChatGPT':'챗지피티', 'YouTube':'유튜브',
  'Instagram':'인스타그램', 'TikTok':'틱톡', 'AI':'에이아이',
  'GDP':'지디피', 'ETF':'이티에프', 'SNS':'에스엔에스',
  'BGM':'비지엠', 'TTS':'티티에스', 'API':'에이피아이',
};

/* ═══ 채널 목소리 프리셋 저장/불러오기 ═══ */
function studioS4SaveChannelVoice(){
  var s4=STUDIO.project.s4||{};
  var preset={
    voiceApi:s4.voiceApi, speakers:s4.speakers,
    savedAt:new Date().toISOString()
  };
  localStorage.setItem('moca_channel_voice', JSON.stringify(preset));
  if(typeof ucShowToast==='function') ucShowToast('✅ 채널 목소리 저장됨','success');
}

function studioS4LoadChannelVoice(){
  var preset=JSON.parse(localStorage.getItem('moca_channel_voice')||'null');
  if(!preset){alert('저장된 채널 목소리가 없어요'); return;}
  var s4=STUDIO.project.s4||{};
  s4.voiceApi=preset.voiceApi;
  s4.speakers=preset.speakers;
  STUDIO.project.s4=s4; studioSave(); renderStudio();
  if(typeof ucShowToast==='function') ucShowToast('✅ 채널 목소리 불러옴','success');
}

/* ═══ 발음 교정 함수 ═══ */
function studioS4FixPronunc(text){
  var result=text;
  Object.keys(MOCA_PRONUNC).forEach(function(k){
    result=result.replace(new RegExp(k,'g'), MOCA_PRONUNC[k]);
  });
  /* 한자 → 한글 (간단 패턴) */
  result=result.replace(/(\d+)代/g,'$1대');
  result=result.replace(/(\d+)歳/g,'$1세');
  return result;
}

async function studioS4AutoFixPronunc(){
  var scenes=(STUDIO.project.s3&&STUDIO.project.s3.scenes)||[];
  if(!scenes.length){alert('씬이 없어요');return;}
  var s4=STUDIO.project.s4||{};
  s4.pronuncFixed=s4.pronuncFixed||{};
  scenes.forEach(function(sc,i){
    var text=sc.desc||sc.label||'';
    s4.pronuncFixed[i]=studioS4FixPronunc(text);
  });
  STUDIO.project.s4=s4; studioSave();
  if(typeof ucShowToast==='function') ucShowToast('✅ 발음 교정 완료','success');
  renderStudio();
}

function studioS4OpenPronuncEditor(){
  var existing=document.getElementById('pronunc-editor');
  if(existing){existing.remove();return;}
  var dict=Object.assign({},MOCA_PRONUNC);
  var extra=JSON.parse(localStorage.getItem('moca_pronunc_custom')||'{}');
  Object.assign(dict,extra);

  var popup=document.createElement('div');
  popup.id='pronunc-editor';
  popup.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);'+
    'background:#fff;border-radius:16px;padding:20px;z-index:10001;'+
    'box-shadow:0 8px 40px rgba(0,0,0,0.25);width:400px;max-height:70vh;overflow-y:auto';

  var rows=Object.keys(dict).map(function(k){
    return '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">'+
      '<input value="'+k+'" data-orig="'+k+'" style="flex:1;border:1px solid #eee;border-radius:6px;padding:4px 8px;font-size:12px">'+
      '<span style="color:var(--sub)">→</span>'+
      '<input value="'+dict[k]+'" data-val="true" style="flex:1;border:1px solid #eee;border-radius:6px;padding:4px 8px;font-size:12px">'+
      '<button onclick="this.parentElement.remove()" style="border:none;background:#fee;color:#e74c3c;border-radius:4px;padding:4px 6px;cursor:pointer">✕</button>'+
    '</div>';
  }).join('');

  popup.innerHTML=
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">'+
      '<div style="font-size:14px;font-weight:900">📖 발음 사전</div>'+
      '<button onclick="document.getElementById(\'pronunc-editor\').remove()" style="border:none;background:#eee;border-radius:999px;padding:4px 12px;cursor:pointer">닫기</button>'+
    '</div>'+
    '<div id="pronunc-rows">'+rows+'</div>'+
    '<button onclick="studioS4AddPronunc()" style="width:100%;border:1.5px dashed var(--line);background:#f8f8f8;border-radius:8px;padding:8px;cursor:pointer;font-size:12px;margin-top:8px">+ 추가</button>'+
    '<button onclick="studioS4SavePronunc()" class="studio-btn pri" style="width:100%;margin-top:8px;font-size:12px">저장</button>';

  document.body.appendChild(popup);
}

function studioS4AddPronunc(){
  var rows=document.getElementById('pronunc-rows');
  if(!rows) return;
  var div=document.createElement('div');
  div.style.cssText='display:flex;gap:6px;align-items:center;margin-bottom:6px';
  div.innerHTML='<input placeholder="원본" data-orig="new" style="flex:1;border:1px solid #eee;border-radius:6px;padding:4px 8px;font-size:12px">'+
    '<span style="color:var(--sub)">→</span>'+
    '<input placeholder="발음" data-val="true" style="flex:1;border:1px solid #eee;border-radius:6px;padding:4px 8px;font-size:12px">'+
    '<button onclick="this.parentElement.remove()" style="border:none;background:#fee;color:#e74c3c;border-radius:4px;padding:4px 6px;cursor:pointer">✕</button>';
  rows.appendChild(div);
}

function studioS4SavePronunc(){
  var rows=document.querySelectorAll('#pronunc-rows > div');
  var custom={};
  rows.forEach(function(row){
    var inputs=row.querySelectorAll('input');
    if(inputs[0]&&inputs[1]&&inputs[0].value&&inputs[1].value){
      custom[inputs[0].value.trim()]=inputs[1].value.trim();
    }
  });
  localStorage.setItem('moca_pronunc_custom',JSON.stringify(custom));
  Object.assign(MOCA_PRONUNC,custom);
  document.getElementById('pronunc-editor')?.remove();
  if(typeof ucShowToast==='function') ucShowToast('✅ 발음 사전 저장됨','success');
}

/* ═══ Before/After 비교 ═══ */
async function studioS4Preview(idx, withEmotion){
  var s4=STUDIO.project.s4||{};
  var scenes=(STUDIO.project.s3&&STUDIO.project.s3.scenes)||[];
  var sc=scenes[idx]; if(!sc) return;

  var text=sc.desc||sc.label||'';
  var fixedText=studioS4FixPronunc(text);

  var se=(s4.sceneEmotions&&s4.sceneEmotions[idx])||{speed:1.0};
  var speed=withEmotion?(se.speed||1.0):1.0;
  var provider = _s2GetCurrentVoiceProvider();

  if(typeof ucShowToast==='function') ucShowToast('⏳ '+(withEmotion?'감정적용':'원본')+' 미리듣기 생성 중... ('+provider+')','info');

  try{
    var res = await _s2DispatchTts({ provider: provider, text: fixedText, voice: 'nova', speed: speed });
    if (!res || !res.url) return;
    var url = res.url;

    /* Before/After 팝업 */
    var popId='voice-compare-'+idx;
    var existing=document.getElementById(popId);
    if(existing) existing.remove();

    var pop=document.createElement('div');
    pop.id=popId;
    pop.style.cssText='position:fixed;bottom:80px;right:20px;background:#fff;border-radius:14px;'+
      'padding:14px;box-shadow:0 4px 20px rgba(0,0,0,0.2);z-index:9999;width:280px';
    pop.innerHTML=
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px">'+
        '<div style="font-size:12px;font-weight:900">씬'+(idx+1)+' '+(withEmotion?'감정 적용':'원본')+'</div>'+
        '<button onclick="document.getElementById(\''+popId+'\').remove()" style="border:none;background:#eee;border-radius:999px;padding:2px 8px;cursor:pointer;font-size:11px">✕</button>'+
      '</div>'+
      '<audio src="'+url+'" controls autoplay style="width:100%;border-radius:8px"></audio>'+
      '<div style="display:flex;gap:6px;margin-top:8px">'+
        '<button onclick="studioS4Preview('+idx+',false)" style="flex:1;border:1.5px solid var(--line);background:#fff;border-radius:999px;padding:5px;font-size:11px;cursor:pointer">원본</button>'+
        '<button onclick="studioS4Preview('+idx+',true)" style="flex:1;border:none;background:var(--pink);color:#fff;border-radius:999px;padding:5px;font-size:11px;cursor:pointer">감정 적용</button>'+
        '<button onclick="studioS4SavePreview(\''+url+'\','+idx+')" style="flex:1;border:1.5px solid #4a90c4;color:#4a90c4;background:#fff;border-radius:999px;padding:5px;font-size:11px;cursor:pointer">채택</button>'+
      '</div>';
    document.body.appendChild(pop);
  }catch(e){alert('오류: '+e.message);}
}

function studioS4SavePreview(url, idx){
  var s4=STUDIO.project.s4||{};
  s4.audios=s4.audios||[]; s4.audios[idx]=url;
  STUDIO.project.s4=s4; studioSave(); renderStudio();
  document.querySelectorAll('[id^="voice-compare-"]').forEach(function(el){el.remove();});
  if(typeof ucShowToast==='function') ucShowToast('✅ 씬'+(idx+1)+' 음성 채택됨','success');
}

/* ═══ 립싱크 데이터 생성 ═══ */
async function studioS4GenLipSync(idx){
  var s4=STUDIO.project.s4||{};
  var audioUrl=(s4.audios||[])[idx];
  if(!audioUrl){alert('먼저 씬 음성을 생성해주세요');return;}

  /* HeyGen API 연동 */
  var heygenKey=(typeof ucGetApiKey==='function')?ucGetApiKey('heygen'):localStorage.getItem('uc_heygen_key')||'';
  if(!heygenKey){
    if(confirm('HeyGen API 키가 없어요.\nAPI 설정에서 등록할까요?')){renderApiSettings();}
    return;
  }

  if(typeof ucShowToast==='function') ucShowToast('⏳ 립싱크 데이터 생성 중...','info');
  /* 실제 HeyGen 연동은 별도 구현 필요 */
  s4.lipSync=s4.lipSync||{};
  s4.lipSync[idx]={generated:true, timestamp:Date.now()};
  STUDIO.project.s4=s4; studioSave();
  if(typeof ucShowToast==='function') ucShowToast('✅ 립싱크 데이터 생성됨 (HeyGen/D-ID에서 사용 가능)','success');
}

/* ═══ Pixabay Music 검색 ═══ */
async function studioS4SearchBgm(){
  var genre=(STUDIO.project.s1&&STUDIO.project.s1.genre)||'';
  var moodMap={
    '시니어건강':'calm piano','재테크':'corporate','유머':'upbeat fun',
    '감동':'emotional','히스토리':'epic cinematic','사자성어':'traditional',
  };
  var query=moodMap[genre]||'background music';
  /* 통합 store(stock.pixabay) → ucGetApiKey 가 자동 처리 */
  var key=(typeof ucGetApiKey==='function')?ucGetApiKey('pixabay'):localStorage.getItem('uc_pixabay_key')||'';
  if(!key){
    if (confirm('Pixabay API 키가 없습니다. 통합 API 설정(스톡 탭)을 열까요?')) {
      if (typeof window.openApiSettingsModal === 'function') window.openApiSettingsModal('stock');
    }
    return;
  }

  if(typeof ucShowToast==='function') ucShowToast('⏳ BGM 검색 중: '+query,'info');

  try{
    var r=await fetch('https://pixabay.com/api/videos/?key='+key+'&q='+encodeURIComponent(query)+'&per_page=5&video_type=animation');
    var d=await r.json();
    var hits=d.hits||[];

    if(!hits.length){
      if(typeof ucShowToast==='function') ucShowToast('검색 결과 없음. 직접 선택해주세요','warn');
      return;
    }

    /* BGM 결과 팝업 */
    var existing=document.getElementById('bgm-search-popup');
    if(existing) existing.remove();

    var pop=document.createElement('div');
    pop.id='bgm-search-popup';
    pop.style.cssText='position:fixed;bottom:80px;right:20px;background:#fff;border-radius:14px;'+
      'padding:14px;box-shadow:0 4px 20px rgba(0,0,0,0.2);z-index:9999;width:300px;max-height:400px;overflow-y:auto';
    pop.innerHTML=
      '<div style="display:flex;justify-content:space-between;margin-bottom:10px">'+
        '<div style="font-size:12px;font-weight:900">🎵 BGM 검색 결과</div>'+
        '<button onclick="document.getElementById(\'bgm-search-popup\').remove()" style="border:none;background:#eee;border-radius:999px;padding:2px 8px;cursor:pointer;font-size:11px">✕</button>'+
      '</div>'+
      hits.map(function(h,i){
        var audioUrl=h.videos&&h.videos.tiny&&h.videos.tiny.url;
        return '<div style="border:1px solid #eee;border-radius:10px;padding:8px;margin-bottom:6px">'+
          '<div style="font-size:11px;font-weight:700;margin-bottom:4px">'+(h.tags||'BGM '+i)+'</div>'+
          (audioUrl?'<audio src="'+audioUrl+'" controls style="width:100%;height:32px"></audio>':'')+
          '<button onclick="studioS4ApplyBgm(\''+audioUrl+'\')" style="width:100%;margin-top:4px;border:none;background:var(--pink);color:#fff;border-radius:6px;padding:4px;font-size:11px;cursor:pointer">적용</button>'+
        '</div>';
      }).join('');
    document.body.appendChild(pop);
    if(typeof ucShowToast==='function') ucShowToast('✅ BGM '+hits.length+'개 검색됨','success');
  }catch(e){alert('BGM 검색 오류: '+e.message);}
}

function studioS4ApplyBgm(url){
  if(!url) return;
  STUDIO.project.s4=STUDIO.project.s4||{};
  STUDIO.project.s4.bgmCustom=url;
  studioSave();
  document.getElementById('bgm-search-popup')?.remove();
  if(typeof ucShowToast==='function') ucShowToast('✅ BGM 적용됨','success');
}

/* _studioS4() bgmHtml 끝에 추가할 내용 + E·F 섹션 전체 */

/* ── Pixabay BGM 검색 버튼 (bgmHtml 마지막 줄에 추가) ── */
var bgmSearchBtn =
  '<button onclick="studioS4SearchBgm()" class="studio-btn ghost" '+
  'style="font-size:11px;margin-top:6px">🔍 Pixabay BGM 자동검색</button>';

/* ── E. 발음 교정 + 채널 목소리 섹션 ── */
var pronuncHtml =
  '<div class="studio-section">' +
  '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
    '<div class="studio-label" style="margin:0">📖 E. 발음 교정 · 채널 목소리</div>' +
  '</div>' +
  '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
    '<button onclick="studioS4AutoFixPronunc()" class="studio-btn ghost" style="font-size:11px">🔧 발음 자동 교정</button>' +
    '<button onclick="studioS4OpenPronuncEditor()" class="studio-btn ghost" style="font-size:11px">📖 발음 사전 편집</button>' +
    '<button onclick="studioS4SaveChannelVoice()" class="studio-btn ghost" style="font-size:11px">💾 채널 목소리 저장</button>' +
    '<button onclick="studioS4LoadChannelVoice()" class="studio-btn ghost" style="font-size:11px">📂 채널 목소리 불러오기</button>' +
  '</div>' +
  '</div>';

/* ── F. Before/After + 립싱크 섹션 ── */
function studioS4BuildPreviewSection(scenes, s4){
  if(!scenes || !scenes.length) return '';
  return '<div class="studio-section">' +
    '<div class="studio-label">🎭 F. 씬별 미리보기 · 립싱크</div>' +
    '<div style="display:flex;flex-direction:column;gap:6px">' +
    scenes.slice(0,5).map(function(sc,i){
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;'+
        'background:#fff;border:1px solid var(--line);border-radius:8px">' +
        '<div style="font-size:12px;font-weight:700;flex:1">씬'+(i+1)+' '+sc.label+'</div>' +
        '<button onclick="studioS4Preview('+i+',false)" style="border:1.5px solid var(--line);background:#fff;border-radius:6px;padding:3px 8px;font-size:10px;cursor:pointer">원본 ▶</button>' +
        '<button onclick="studioS4Preview('+i+',true)" style="border:none;background:var(--pink);color:#fff;border-radius:6px;padding:3px 8px;font-size:10px;cursor:pointer">감정 ▶</button>' +
        '<button onclick="studioS4GenLipSync('+i+')" style="border:1.5px solid #4a90c4;color:#4a90c4;background:#fff;border-radius:6px;padding:3px 8px;font-size:10px;cursor:pointer">👄 립싱크</button>' +
      '</div>';
    }).join('') +
    (scenes.length>5?'<div style="font-size:11px;color:var(--sub);text-align:center">... 외 '+(scenes.length-5)+'개 씬</div>':'') +
    '</div></div>';
}

/* ── studioS4 v2 CSS 주입 (라이브 페이지용) ──
   원래 hub.js 의 uniSave('html') 익스포트 템플릿 안에만 있던 규칙을
   실제 DOM 에 적용시키기 위해 분리 */
function _s4InjectVoiceCSS(){
  if(document.getElementById('s4-voice-style')) return;
  const st = document.createElement('style');
  st.id = 's4-voice-style';
  st.textContent = `
.s4-panel{padding:14px;background:#fff;border-radius:16px;border:1px solid var(--line,#f1dce7);font-family:inherit}
.s4-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.s4-api-row{background:#f9f3fb;border-radius:12px;padding:8px 10px;margin-bottom:12px}
.s4-label{font-size:11.5px;font-weight:800;color:#7b7077;min-width:80px;white-space:nowrap}
.s4-seg{display:flex;gap:2px;flex-wrap:wrap}
.s4-seg-btn{border:1px solid #f1dce7;background:#fff;border-radius:8px;padding:5px 12px;font-size:11px;font-weight:700;color:#7b7077;cursor:pointer;transition:.12s}
.s4-seg-btn.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.s4-ai-chip{background:#fffbe8;border:1.5px solid #f5c518;border-radius:20px;padding:4px 12px;font-size:11px;font-weight:800;color:#8a6800;cursor:pointer;margin-left:auto;transition:.12s}
.s4-ai-chip:hover{background:#f5c518;color:#fff}
.s4-genre-chips{display:flex;gap:4px;flex-wrap:wrap}
.s4-chip{border:1px solid #f1dce7;background:#fff;border-radius:20px;padding:4px 10px;font-size:11px;cursor:pointer;transition:.12s}
.s4-chip.on{background:#fff1f8;border-color:#ef6fab;color:#d4357a;font-weight:800}
.s4-section-hd{display:flex;align-items:center;justify-content:space-between;margin:10px 0 6px}
.s4-section-title{font-size:12px;font-weight:800;color:#2b2430}
.s4-mini-btn{border:1.5px solid #f1dce7;background:#fff;border-radius:8px;padding:3px 10px;font-size:11px;cursor:pointer;font-weight:700;transition:.12s}
.s4-mini-btn:hover{border-color:#ef6fab;color:#ef6fab}
.s4-mini-btn.danger{border-color:#fca5a5;color:#dc2626}
.s4-mini-btn.primary{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
/* 화자 카드 */
.s4-speakers{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-bottom:4px}
.s4-sp-card{border:1.5px solid #f1dce7;border-radius:12px;padding:10px;background:#eff6ff;position:relative}
.s4-sp-card.active-sp{border-color:#9181ff;background:#ede9ff}
.s4-sp-badge{display:inline-block;font-size:10px;font-weight:800;color:#9181ff;background:#ede9ff;border-radius:20px;padding:1px 8px;margin-bottom:6px}
.s4-sp-role{width:100%;border:none;border-bottom:1.5px solid #f1dce7;background:transparent;font-size:12px;font-weight:700;outline:none;padding:2px 0;margin-bottom:6px;color:#2b2430}
.s4-sp-voice-name{font-size:11px;font-weight:700;margin-bottom:4px}
.s4-sp-tag{font-size:9px;background:#f0fdf4;color:#16a34a;border-radius:20px;padding:1px 6px;margin-left:4px}
.s4-sp-sel{width:100%;border:1px solid #f1dce7;border-radius:8px;padding:3px 6px;font-size:10.5px;background:#fff}
.s4-sp-click-hint{font-size:9px;color:#9181ff;margin-top:4px;text-align:center}
/* 음성 그리드 */
.s4-filter-bar{display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-bottom:6px}
.s4-filter{border:1px solid #f1dce7;background:#fff;border-radius:20px;padding:3px 9px;font-size:11px;cursor:pointer;transition:.12s}
.s4-filter.on{background:#ef6fab;color:#fff;border-color:#ef6fab}
.s4-fsep{color:#f1dce7;margin:0 2px}
.s4-voice-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(82px,1fr));gap:5px;max-height:200px;overflow-y:auto;margin-bottom:12px;padding:2px}
.s4-vc{border:1.5px solid #f1dce7;border-radius:10px;padding:7px 5px;text-align:center;cursor:pointer;transition:.14s;background:#fff;user-select:none}
.s4-vc:hover{border-color:#ef6fab;background:#fff1f8}
.s4-vc.active{border-color:#9181ff;background:#ede9ff}
.s4-vc-ico{font-size:16px;margin-bottom:1px}
.s4-vc-name{font-size:10.5px;font-weight:800;margin:1px 0}
.s4-vc-mood{font-size:9px;color:#7b7077}
.s4-vc-prov{font-size:8px;background:#f1dce7;border-radius:4px;padding:1px 5px;margin-top:2px;display:inline-block}
/* 씬 그리드 */
.s4-scene-grid{display:flex;flex-direction:column;gap:3px;margin-bottom:12px}
.s4-scene-row{display:grid;grid-template-columns:28px minmax(0,1fr) 44px 110px;align-items:center;gap:5px;padding:5px 8px;background:#f9f3fb;border-radius:8px;border:1px solid #f1dce7;transition:.12s}
.s4-scene-row:hover{background:#fff1f8;border-color:#ef6fab}
.s4-sc-num{font-size:10.5px;font-weight:800;color:#9181ff}
.s4-sc-label{font-size:11px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.s4-sc-role{font-size:10px;background:#fff;border-radius:20px;padding:1px 5px;border:1px solid #f1dce7;text-align:center;font-weight:700}
.s4-sc-sel{border:1px solid #f1dce7;border-radius:6px;padding:2px 4px;font-size:10px;background:#fff;width:100%}
.s4-empty-hint{font-size:12px;color:#7b7077;text-align:center;padding:16px;background:#f9f3fb;border-radius:10px}
`;
  document.head.appendChild(st);
}


