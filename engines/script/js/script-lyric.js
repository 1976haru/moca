/* ========================================================
   script-lyric.js  --  가사 (한국어/일본어) · 보컬 · 점수
   engines/script/index.html 에서 분리 (Phase 4 — lyric)
   의존: script-common.js (escHtml 등), script-api.js (callAPI, getApiKey, isAsciiOnly),
         script-gen.js (getFname, generateWordClean, saveWordDoc, splitLangScript,
                         postProcessOutputText, MODE, LANG)
   ======================================================== */

/* ─── 가사 시스템 프롬프트 + 파서 ─── */

// ════════════════════════════════════════
// 가사 시스템 프롬프트 + 파서
// ════════════════════════════════════════
function buildLyricsSystemPrompt(opts){
  var GENRE_MAP={'trot-ballad':'한국 트로트발라드 (가야금 또는 아코디언 인트로, 60대 여성 보컬, 한(恨)과 흥(興) 공존)','ballad':'한국 순수발라드 (피아노+현악, 성숙한 여성 보컬)','enka':'일본 엔카 (하모니카 또는 샤미센 인트로, 고부시 창법, 쇼와 노스탈지아)','folk-ballad':'포크발라드 (어쿠스틱 기타 중심, 자연스럽고 따뜻한 목소리)'};
  var ERA_MAP={'70s':'1970년대 — 새마을운동 시대, 가마솥 밥, 고무신, 국민학교, 보릿고개','60s':'1960년대 — 6·25 이후 재건 시대, 가난했지만 따뜻했던 공동체','80s':'1980년대 — 고도성장기, 처음 여유가 생기던 시절','mix':'AI가 대본 주제에 맞게 자유롭게 혼합'};
  var VIBE_MAP={'nostalgia-hope':'향수+위로+희망 — 그리운 시절이 오늘의 위로가 되고, 지금도 늦지 않았다는 희망','family':'가족+효도+감사 — 어머니, 아버지, 형제에 대한 깊은 감사','community':'공동체+근면+고향 — 품앗이, 두레, 이웃사촌, 고향 마을','health':'건강+활기+자연 — 텃밭, 계절 음식, 소박한 건강','enka-showa':'쇼와·엔카 감성 — 絆(인연), 故郷(고향), 昭和の記憶'};
  var IMG_MAP={'watercolor':'warm vintage Korean watercolor illustration, 1960s-70s nostalgic, golden amber tones','realistic':'realistic vintage Korean illustration, photorealistic nostalgic, warm cinematic lighting','oil':'oil painting style, impressionist, warm earthy tones, nostalgic Korean countryside','anime':'retro anime style, 1970s Korean aesthetics, warm pastel colors'};
  var SONGLEN_MAP={'5min':'5분 내외: [intro 35-40초]+[verse1]+[pre-chorus]+[chorus]+[instrumental break]+[verse2]+[pre-chorus]+[chorus]+[bridge]+[final chorus 반음전조]+[outro 35-40초]','4min':'4분 내외: [intro]+[verse1]+[chorus]+[instrumental]+[verse2]+[chorus]+[bridge]+[outro]','6min':'6분 내외: [긴intro]+[verse1]+[pre]+[chorus]+[break]+[verse2]+[pre]+[chorus]+[bridge]+[chorus]+[final chorus]+[long outro]','3min':'3분 내외: [intro]+[verse1]+[chorus]+[verse2]+[chorus]+[outro]'};
  var epNote=opts.epIndex!==undefined?'시리즈 총 '+opts.totalEps+'편 중 '+(opts.epIndex+1)+'번째 가사.\n'+(opts.prevSensory?'이전 편 핵심 소재: '+opts.prevSensory+'\n→ 이번 편은 반드시 다른 소재 중심으로.\n':''):'';
  return '당신은 한국/일본 시니어 채널 전용 상위 0.001% 음원 제작 전문가입니다.\n\n━━ 절대 원칙 ━━\n\n【감정 설계】\n대본의 충격·경고·불안을 정면으로 다루지 말 것.\n가사는 그 감정의 따뜻한 출구, 위로, 희망이 되어야 함.\n\n【가사 완성도 — 상위 0.001%】\n1. 각 줄이 독립적으로도 시(詩)가 될 것\n2. 60~75세가 처음 들어도 따라 부를 수 있는 자연스러운 호흡\n3. 후렴구는 처음 들어도 함께 부르고 싶은 중독성\n4. 트로트·발라드 특유의 한(恨)과 흥(興) 공존\n5. 브릿지에서 감정 폭발 → 파이널 코러스에서 일어서기\n6. 아웃트로는 말이 끊기듯 여운으로 마무리\n7. 절대 쓰지 말 것: "힐링", "웰니스", 영어 외래어, 젊은 세대 언어\n\n【향수 시대】 '+ERA_MAP[opts.era||'70s']+'\n【가사 감성 코드】 '+VIBE_MAP[opts.vibe||'nostalgia-hope']+'\n【음악 장르】 '+GENRE_MAP[opts.genre||'trot-ballad']+'\n【음원 길이】 '+SONGLEN_MAP[opts.songLen||'5min']+'\n【이미지 스타일】 '+IMG_MAP[opts.imgStyle||'watercolor']+'\n'+(opts.extraInstr?'【추가 특별 지시】 '+opts.extraInstr+'\n':'')+epNote+'\n━━ 출력 형식 ━━\n\n###LYRICS###\n제목: [가사 제목]\n[완전한 가사 전문]\n\n###MUSIC_PROMPT###\nGenre:\nMood:\nInstruments:\nVocal:\nTempo: [BPM]\nKey: [키] → Final chorus modulates up half step\nDynamic arc:\nProduction:\nTags:\n\n[Suno 가사 입력본 - [verse][pre-chorus][chorus][instrumental][bridge][outro] 태그 포함]\n\n###IMAGE_PROMPTS###\n[컷1 - 대본 감성 직결 장면]\nPrompt: [영어]\n\n[컷2 - 어머니/할머니 따뜻한 일상]\nPrompt: [영어]\n\n[컷3 - 아이들/청년 활기찬 장면]\nPrompt: [영어]\n\n[컷4 - 계절+자연+인물 서정 장면]\nPrompt: [영어]\n\n[립싱크 캐릭터용]\nPrompt: [영어]\n\n###YOUTUBE###\n제목 A안:\n제목 B안:\n제목 C안:\n\n숏츠 훅1:\n숏츠 훅2:\n숏츠 훅3:\n\n댓글 유도:\n\n설명란 첫3줄:\n\n해시태그:';}

function parseLyricsResult(text){
  function extract(t,start,end){var si=t.indexOf(start);if(si===-1)return'';si+=start.length;var ei=end?t.indexOf(end,si):t.length;return t.substring(si,ei===-1?t.length:ei).trim();}
  var lyricsRaw=extract(text,'###LYRICS###','###MUSIC_PROMPT###');
  var musicRaw=extract(text,'###MUSIC_PROMPT###','###IMAGE_PROMPTS###');
  var imagesRaw=extract(text,'###IMAGE_PROMPTS###','###YOUTUBE###');
  var youtubeRaw=extract(text,'###YOUTUBE###',null);
  // v30: Suno Style / Lyrics 분리
  var sunoStyle='',sunoLyrics='';
  if(musicRaw){
    var sLyricMatch=musicRaw.match(/\[(?:verse|chorus|pre-chorus|bridge|outro|intro|instrumental)[^\]]*\]/i);
    if(sLyricMatch){
      var sLyricIdx=musicRaw.indexOf(sLyricMatch[0]);
      sunoStyle=musicRaw.slice(0,sLyricIdx).trim();
      sunoLyrics=musicRaw.slice(sLyricIdx).trim();
    }else{sunoStyle=musicRaw;}
  }
  return{lyrics:lyricsRaw,music:musicRaw,images:imagesRaw,youtube:youtubeRaw,sunoStyle:sunoStyle,sunoLyrics:sunoLyrics};
}

/* ─── 가사/음원 단편 (상태 + 메인 함수) ─── */
// ════════════════════════════════════════
// 가사/음원 단편
// ════════════════════════════════════════
var lyricData={lyrics:'',music:'',images:'',youtube:'',sunoStyle:'',sunoLyrics:'',lyrics_jp:'',music_jp:'',images_jp:'',youtube_jp:''};
var lyricActiveSec='lyrics';
function switchLyricSec(sec,btn){lyricActiveSec=sec;document.querySelectorAll('#pg-lyric .sec-btn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');renderLyricContent();}
function renderLyricContent(){var display=document.getElementById('l-content-display');var sectionMap={lyrics:{label:'가사'},music:{label:'Suno 음악 프롬프트'},images:{label:'이미지 프롬프트 (4컷)'},youtube:{label:'유튜브 수익화'}};var s=sectionMap[lyricActiveSec];var content=lyricData[lyricActiveSec]||'';display.innerHTML='<div class="content-card"><div class="card-head"><div class="card-title">'+s.label+'</div><button class="btn-copy" onclick="copyLyricContent(this,\''+lyricActiveSec+'\')">복사</button></div>'+(content?'<div class="output-text">'+escHtml(content)+'</div>':'<div style="color:#CCC;font-size:12px;padding:20px;text-align:center">아직 생성되지 않았습니다</div>')+'</div>';}
function copyLyricContent(btn,key){var text=lyricData[key];if(!text)return;navigator.clipboard.writeText(text).then(function(){btn.textContent='✓ 복사됨';btn.classList.add('copied');setTimeout(function(){btn.textContent='복사';btn.classList.remove('copied');},2000);});}
async function genLyric(){
  var key=getApiKey();if(!key||!isAsciiOnly(key)){apiKeyMissingToast();document.getElementById('lyric-errbox').innerHTML='⚠️ 설정에서 API 키를 입력해주세요';document.getElementById('lyric-errbox').classList.add('on');return;}
  var scriptText=document.getElementById('lyric-script-input').value.trim();if(!scriptText){document.getElementById('lyric-errbox').innerHTML='대본을 입력해주세요.';document.getElementById('lyric-errbox').classList.add('on');return;}
  document.getElementById('lyric-errbox').classList.remove('on');
  document.getElementById('btn-lyric').disabled=true;document.getElementById('lyric-spinning').classList.add('on');
  try{
    var sys=buildLyricsSystemPrompt({genre:document.getElementById('l-music-genre').value,era:document.getElementById('l-era').value,songLen:document.getElementById('l-song-len').value,vibe:document.getElementById('l-lyric-vibe').value,imgStyle:document.getElementById('l-img-style').value,extraInstr:document.getElementById('l-extra-instr').value.trim()});
    var result=await callAPI(key,sys,'대본:\n\n'+scriptText,4000);
    lyricData=parseLyricsResult(result);
    document.getElementById('lyric-result').style.display='block';renderLyricContent();
  }catch(e){document.getElementById('lyric-errbox').innerHTML='오류: '+e.message;document.getElementById('lyric-errbox').classList.add('on');}
  document.getElementById('btn-lyric').disabled=false;document.getElementById('lyric-spinning').classList.remove('on');
}
function downloadLyric(){var content='【가사/음원 패키지 v29】\n'+new Date().toLocaleString('ko-KR')+'\n'+'─'.repeat(40)+'\n\n【가사】\n'+lyricData.lyrics+'\n\n【음악 프롬프트】\n'+lyricData.music+'\n\n【이미지 프롬프트】\n'+lyricData.images+'\n\n【유튜브 수익화】\n'+lyricData.youtube;var blob=new Blob([content],{type:'text/plain;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='가사패키지_'+new Date().toISOString().slice(0,10)+'.txt';a.click();}

/* ─── 보컬 상태 관리 (vocalState + maps + setters) ─── */
// ════════════════════════════════════════
// v20 — 보컬 상태 관리
// ════════════════════════════════════════
var vocalState={
  b:{gender:'f',age:'60s',emo:'warm',styles:['trot-female'],freeTags:[],freeText:''},
  l:{gender:'f',age:'60s',emo:'warm',styles:['trot-female'],freeTags:[],freeText:''}
};
var GENDER_MAP={f:'Korean female vocalist',m:'Korean male vocalist',duo:'mixed duet (male and female)',choir:'choir with lead vocalist'};
var AGE_MAP={'50s':'energetic 50s voice, vibrant','60s':'mature 60s voice, rich with life experience','70s':'seasoned 70s voice, deep gravitas','ai':'age chosen by AI for best emotional fit'};
var EMO_MAP={warm:'warm and comforting delivery',tearful:'emotionally tearful, voice cracking with nostalgia',bright:'bright and uplifting, hopeful',whisper:'hushed and intimate, whisper-soft on outro'};
var VSTYLE_MAP={'trot-female':'Korean trot female style (Yi Mi-ja, Seol Un-do type)','trot-male':'Korean trot male style (Na Hoon-a, Nam Jin type)','ballad-f':'emotional female ballad, lyrical and expressive','ballad-m':'deep male ballad, resonant and moving','folk':'acoustic folk, natural and earthy','enka':'Japanese enka with kobushi ornamentation','powerful':'powerful high-note delivery, emotionally explosive','gentle':'gentle and delicate, understated emotional depth'};

function setBGender(v,btn){vocalState.b.gender=v;document.querySelectorAll('[id^="b-gender-"]').forEach(function(b){b.classList.remove('on');});btn.classList.add('on');}
function setBAgeVibe(v,btn){vocalState.b.age=v;document.querySelectorAll('[id^="b-age-"]').forEach(function(b){b.classList.remove('on');});btn.classList.add('on');}
function setBEmo(v,btn){vocalState.b.emo=v;document.querySelectorAll('[id^="b-emo-"]').forEach(function(b){b.classList.remove('on');});btn.classList.add('on');}
function setLGender(v,btn){vocalState.l.gender=v;document.querySelectorAll('[id^="l-gender-"]').forEach(function(b){b.classList.remove('on');});btn.classList.add('on');}
function setLAgeVibe(v,btn){vocalState.l.age=v;document.querySelectorAll('[id^="l-age-"]').forEach(function(b){b.classList.remove('on');});btn.classList.add('on');}
function setLEmo(v,btn){vocalState.l.emo=v;document.querySelectorAll('[id^="l-emo-"]').forEach(function(b){b.classList.remove('on');});btn.classList.add('on');}

function toggleVStyle(card,prefix){
  card.classList.toggle('on');
  var id=card.id.replace(prefix+'-vs-','');
  var styles=vocalState[prefix].styles;
  var idx=styles.indexOf(id);
  if(idx===-1)styles.push(id);else styles.splice(idx,1);
}
function addVocalTag(tag,prefix){
  var text=tag.textContent.trim();
  var tags=vocalState[prefix].freeTags;
  if(tags.includes(text)){tags.splice(tags.indexOf(text),1);tag.style.background='';tag.style.fontWeight='';}
  else{tags.push(text);tag.style.background='#c8d8f8';tag.style.fontWeight='800';}
}
// Enter key for free vocal input
(function(){
  ['b','l'].forEach(function(prefix){
    setTimeout(function(){
      var inp=document.getElementById(prefix+'-vocal-free');
      if(inp){inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&this.value.trim()){
        var text=this.value.trim();
        vocalState[prefix].freeText=(vocalState[prefix].freeText?vocalState[prefix].freeText+', ':'')+text;
        var wrap=document.getElementById(prefix+'-vocal-free-tags');
        if(wrap){var t=document.createElement('span');t.className='free-tag';t.style.background='#c8d8f8';t.style.fontWeight='800';
          t.innerHTML=escHtml(text)+' <span style="cursor:pointer" onclick="this.parentNode.remove();vocalState[\''+prefix+'\'].freeText=vocalState[\''+prefix+'\'].freeText.split(\', \').filter(function(x){return x!==\''+text.replace(/'/g,"\\'")+'\'}).join(\', \')">✕</span>';
          wrap.appendChild(t);}
        this.value='';
      }});}
    },100);
  });
})();

function buildVocalPrompt(prefix){
  var vs=vocalState[prefix];
  var parts=[];
  parts.push(GENDER_MAP[vs.gender]||'female vocalist');
  parts.push(AGE_MAP[vs.age]||'mature voice');
  parts.push(EMO_MAP[vs.emo]||'warm delivery');
  if(vs.styles.length)parts.push(vs.styles.map(function(s){return VSTYLE_MAP[s]||s;}).join(', '));
  if(vs.freeTags.length)parts.push(vs.freeTags.join(', '));
  if(vs.freeText)parts.push(vs.freeText);
  return parts.join('; ');
}

/* ─── 점수 피드백 시스템 ─── */
// ════════════════════════════════════════
// v20 — 점수 피드백 시스템
// ════════════════════════════════════════
var scoreState={l:{scores:{},feedbacks:{},history:[]},b:{}};
var SCORE_SECTIONS=[
  {key:'lyrics',label:'🎵 가사 품질'},
  {key:'music',label:'🎼 음악 프롬프트'},
  {key:'script',label:'📝 대본 품질'},
  {key:'images',label:'🖼 이미지 프롬프트'},
  {key:'youtube',label:'📺 수익화 전략'}
];

function initScoreState(prefix,idx){
  if(idx!==undefined){if(!scoreState.b[idx])scoreState.b[idx]={scores:{},feedbacks:{},history:[]};return scoreState.b[idx];}
  return scoreState.l;
}

function renderScoreSections(containerId,prefix,idx){
  var container=document.getElementById(containerId);if(!container)return;
  var state=initScoreState(prefix,idx);
  container.innerHTML='';
  SCORE_SECTIONS.forEach(function(sec){
    var cur=state.scores[sec.key]||0;var fb=state.feedbacks[sec.key]||'';
    var div=document.createElement('div');div.className='score-section';
    var starsHtml='';
    for(var i=1;i<=10;i++){
      var cls='score-star-btn'+(i<=cur?(cur<=4?' low':cur<=7?' mid':' sel'):'');
      starsHtml+='<button class="'+cls+'" onclick="setScore(this,'+i+',\''+sec.key+'\',\''+prefix+'\','+(idx!==undefined?idx:'null')+')">'+i+'</button>';
    }
    var chip=cur?'<span class="score-chip '+(cur<=4?'sc-lo':cur<=7?'sc-mid':'sc-hi')+'">'+cur+'점</span>':'<span style="font-size:10px;color:var(--muted)">미평가</span>';
    div.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px"><div class="score-sec-label">'+sec.label+'</div>'+chip+'</div><div class="score-stars">'+starsHtml+'</div><textarea class="score-feedback-input" placeholder="피드백 (예: 후렴이 약함, 더 강하게 / 첫 줄 충격이 부족함...)" rows="2" oninput="saveFeedback(this,\''+sec.key+'\',\''+prefix+'\','+(idx!==undefined?idx:'null')+')">'+fb+'</textarea>';
    container.appendChild(div);
  });
}

function setScore(btn,score,key,prefix,idx){
  var idxNum=idx!==null?parseInt(idx):undefined;
  var state=initScoreState(prefix,idxNum);state.scores[key]=score;
  var allBtns=btn.closest('.score-stars').querySelectorAll('.score-star-btn');
  allBtns.forEach(function(b,i){b.className='score-star-btn'+(i<score?(score<=4?' low':score<=7?' mid':' sel'):'');});
  var chip=btn.closest('.score-section').querySelector('.score-chip');
  if(chip){chip.className='score-chip '+(score<=4?'sc-lo':score<=7?'sc-mid':'sc-hi');chip.textContent=score+'점';}
}

function saveFeedback(ta,key,prefix,idx){
  var idxNum=idx!==null?parseInt(idx):undefined;
  initScoreState(prefix,idxNum).feedbacks[key]=ta.value.trim();
}

function buildFeedbackPrompt(state){
  if(!state)return'';
  var parts=[];
  SCORE_SECTIONS.forEach(function(sec){
    var score=state.scores[sec.key],fb=state.feedbacks[sec.key];
    if(score||fb){
      var line=sec.label+': ';
      if(score)line+='점수 '+score+'/10 ('+(score<=4?'낮음—반드시 개선':score<=7?'보통—개선 권장':'우수—방향 유지')+')';
      if(fb)line+=' | 피드백: "'+fb+'"';
      parts.push(line);
    }
  });
  if(!parts.length)return'';
  return'\n\n【이전 생성물 점수 & 피드백 — 최우선으로 반영할 것】\n'+parts.join('\n')+'\n→ 낮은 점수 항목 필수 개선. 피드백 지시사항 그대로 반영.';
}

function pushScoreHistory(state){
  if(!state)return;
  var e={time:new Date().toLocaleTimeString('ko-KR'),scores:{},feedbacks:{}};
  Object.assign(e.scores,state.scores);Object.assign(e.feedbacks,state.feedbacks);
  state.history.unshift(e);if(state.history.length>5)state.history=state.history.slice(0,5);
  state.scores={};state.feedbacks={};
}

function renderScoreHistory(listId,state){
  if(!state||!state.history.length)return;
  var el=document.getElementById(listId);if(!el)return;
  el.parentElement.style.display='block';
  el.innerHTML=state.history.map(function(h,i){
    var sc=Object.entries(h.scores).filter(function(e){return e[1];}).map(function(e){return e[0]+':'+e[1]+'점';}).join(' / ');
    var fb=Object.entries(h.feedbacks).filter(function(e){return e[1];}).map(function(e){return'"'+e[1]+'"';}).join(' | ');
    return'<div class="score-hist-item"><span class="feedback-badge">#'+(state.history.length-i)+'</span> '+h.time+(sc?' — '+sc:'')+(fb?' | '+fb:'')+'</div>';
  }).join('');
}

function renderBatchScorePanel(idx){
  var panel=document.getElementById('b-score-panel');if(!panel)return;
  panel.style.display='block';
  document.getElementById('b-score-ep-label').textContent=idx+1;
  renderScoreSections('b-score-sections','b',idx);
}

// Override renderBatchContent to always refresh score panel
var _rbcOrig=renderBatchContent;
renderBatchContent=function(){
  _rbcOrig();
  var d=epData[batchActiveEp];
  if(d&&(d.scriptDone||d.allDone))renderBatchScorePanel(batchActiveEp);
};

// ─── Override buildLyricsSystemPrompt to inject vocal + feedback ───
var _blspOrig=buildLyricsSystemPrompt;
buildLyricsSystemPrompt=function(opts){
  opts=opts||{};
  var GENRE_MAP={'trot-ballad':'한국 트로트발라드','ballad':'한국 순수발라드','enka':'일본 엔카','folk-ballad':'포크발라드','minyo':'한국/일본 민요풍','gospel':'복음성가풍'};
  var ERA_MAP={'70s':'1970년대 — 새마을운동 시대, 가마솥 밥, 고무신, 국민학교','60s':'1960년대 — 6·25 이후 재건','80s':'1980년대 — 고도성장기','mix':'AI가 대본 주제에 맞게 혼합'};
  var VIBE_MAP={'nostalgia-hope':'향수+위로+희망','family':'가족+효도+감사','community':'공동체+근면+고향','health':'건강+활기+자연','enka-showa':'쇼와·엔카 감성'};
  var IMG_MAP={'watercolor':'warm vintage Korean watercolor illustration, 1960s-70s nostalgic, golden amber tones','realistic':'realistic vintage Korean illustration, photorealistic nostalgic','oil':'oil painting style, impressionist, warm earthy','anime':'retro anime style, 1970s Korean, warm pastel'};
  var SONGLEN_MAP={'5min':'5분: [intro35-40초]+[verse1]+[pre]+[chorus]+[break]+[verse2]+[pre]+[chorus]+[bridge]+[final chorus 반음전조]+[outro35-40초]','4min':'4분: [intro]+[verse1]+[chorus]+[break]+[verse2]+[chorus]+[bridge]+[outro]','6min':'6분: [긴intro]+[verse1]+[pre]+[chorus]+[break]+[verse2]+[pre]+[chorus]+[bridge]+[chorus]+[final]+[long outro]','3min':'3분: [intro]+[verse1]+[chorus]+[verse2]+[chorus]+[outro]'};
  var epNote=opts.epIndex!==undefined?'시리즈 '+(opts.epIndex+1)+'/'+opts.totalEps+'편 가사.\n'+(opts.prevSensory?'이전 편 소재: '+opts.prevSensory+'\n→ 이번 편은 다른 소재.\n':''):'';
  var vocalNote=opts.vocalPrompt?'\n【보컬 설정 — Suno 프롬프트 Vocal 항목에 정확히 반영】\n'+opts.vocalPrompt+'\n':'';
  var feedbackNote=opts.feedbackNote||'';
  return '당신은 시니어 채널 전용 상위 0.001% 음원 제작 전문가.\n\n━━ 절대 원칙 ━━\n\n【감정 설계】\n대본 경고/불안 정면 다루기 금지.\n가사는 따뜻한 출구·위로·희망.\n\n【가사 완성도 0.001%】\n1. 각 줄 독립적으로도 시(詩)가 될 것\n2. 60~75세 처음 들어도 따라 부를 수 있는 호흡\n3. 후렴구 중독성 — 처음 들어도 함께 부르고 싶게\n4. 트로트·발라드 한(恨)+흥(興) 공존\n5. 브릿지 감정 폭발 → 파이널 코러스 일어서기\n6. 아웃트로 말 끊기듯 여운\n7. 금지어: "힐링","웰니스",영어 외래어,젊은 언어\n\n【향수 시대】 '+(ERA_MAP[opts.era||'70s']||'')+'\n【가사 감성】 '+(VIBE_MAP[opts.vibe||'nostalgia-hope']||'')+'\n【음악 장르】 '+(GENRE_MAP[opts.genre||'trot-ballad']||'')+'\n【음원 길이】 '+(SONGLEN_MAP[opts.songLen||'5min']||'')+'\n【이미지 스타일】 '+(IMG_MAP[opts.imgStyle||'watercolor']||'')+'\n'+(opts.extraInstr?'【추가 지시】 '+opts.extraInstr+'\n':'')+vocalNote+epNote+feedbackNote+'\n━━ 출력 형식 ━━\n\n###LYRICS###\n제목: [가사 제목]\n[완전한 가사 전문 - [verse][pre-chorus][chorus][bridge][outro] 태그 포함]\n\n###MUSIC_PROMPT###\nGenre:\nMood:\nInstruments:\nVocal: [보컬 설정 정확히 반영]\nTempo: [BPM]\nKey: [키] → Final chorus +0.5 key modulation\nDynamic arc: pp→mp→mf→p(bridge)→ff→pp\nProduction:\nTags:\n\n[Suno 가사 입력본]\n\n###IMAGE_PROMPTS###\n[컷1]\nPrompt: [영어]\n[컷2]\nPrompt: [영어]\n[컷3]\nPrompt: [영어]\n[컷4]\nPrompt: [영어]\n[립싱크 캐릭터용]\nPrompt: [영어]\n\n###YOUTUBE###\n제목 A안:\n제목 B안:\n제목 C안:\n숏츠 훅1:\n숏츠 훅2:\n숏츠 훅3:\n댓글 유도:\n설명란 첫3줄:\n해시태그:';
};

// ─── Override buildSysH to inject feedback ───
var _bshOrig=buildSysH;
buildSysH=function(dur,opts,feedbackNote){
  var base=_bshOrig(dur,opts);
  return feedbackNote?base+feedbackNote:base;
};

// ─── Override genLyric to include vocal prompt ───
genLyric=async function(){
  var key=getApiKey();if(!key||!isAsciiOnly(key)){apiKeyMissingToast();document.getElementById('lyric-errbox').innerHTML='⚠️ 설정에서 API 키를 입력해주세요';document.getElementById('lyric-errbox').classList.add('on');return;}
  var scriptText=document.getElementById('lyric-script-input').value.trim();if(!scriptText){document.getElementById('lyric-errbox').innerHTML='대본을 입력해주세요.';document.getElementById('lyric-errbox').classList.add('on');return;}
  document.getElementById('lyric-errbox').classList.remove('on');
  document.getElementById('btn-lyric').disabled=true;document.getElementById('lyric-spinning').classList.add('on');
  try{
    var sys=buildLyricsSystemPrompt({genre:document.getElementById('l-music-genre').value,era:document.getElementById('l-era').value,songLen:document.getElementById('l-song-len').value,vibe:document.getElementById('l-lyric-vibe').value,imgStyle:document.getElementById('l-img-style').value,extraInstr:document.getElementById('l-extra-instr').value.trim(),vocalPrompt:buildVocalPrompt('l')});
    var result=await callAPI(key,sys,'대본:\n\n'+scriptText,4000);
    lyricData=parseLyricsResult(result);
    document.getElementById('lyric-result').style.display='block';renderLyricContent();
    renderScoreSections('l-score-sections','l',undefined);
    renderScoreHistory('l-score-history-list',scoreState.l);
  }catch(e){document.getElementById('lyric-errbox').innerHTML='오류: '+e.message;document.getElementById('lyric-errbox').classList.add('on');}
  document.getElementById('btn-lyric').disabled=false;document.getElementById('lyric-spinning').classList.remove('on');
};

// ─── Override genEpLyrics to include vocal + feedback ───
genEpLyrics=async function(idx){
  var key=getApiKey();if(!key||!isAsciiOnly(key)){apiKeyMissingToast();return;}
  var d=epData[idx];if(!d.scriptDone){alert('먼저 대본을 생성해주세요.');return;}
  var btn=document.getElementById('ep-btn-lyrics-'+idx);if(btn){btn.disabled=true;btn.textContent='⏳';}
  try{
    var state=initScoreState('b',idx);var fbPrompt=buildFeedbackPrompt(state);
    var lSys=buildLyricsSystemPrompt({genre:document.getElementById('b-music-genre').value,era:document.getElementById('b-era').value,songLen:document.getElementById('b-song-len').value,vibe:document.getElementById('b-lyric-vibe').value,imgStyle:document.getElementById('b-img-style').value,extraInstr:document.getElementById('b-extra-instr').value.trim(),vocalPrompt:buildVocalPrompt('b'),feedbackNote:fbPrompt});
    var lResult=await callAPI(key,lSys,'대본:\n제목: '+d.title+'\n\n'+d.script,4000);
    var parsed=parseLyricsResult(lResult);
    d.lyrics=parsed.lyrics;d.music=parsed.music;d.images=parsed.images;d.youtube=parsed.youtube;d.allDone=true;
    updateEpRowStatus(idx);renderBatchEpTabs();
    batchActiveEp=idx;batchActiveSec='lyrics';renderBatchContent();
    document.getElementById('b-result-area').style.display='block';
    document.getElementById('btn-dl-all').disabled=false;
  }catch(e){alert('EP.'+(idx+1)+' 가사 오류: '+e.message);}
  if(btn){btn.textContent='🎵 가사';btn.disabled=false;}
};

// ─── 피드백 반영 재생성 함수들 ───
async function regenLyricWithFeedback(){
  var key=getApiKey();if(!key)return;
  var scriptText=document.getElementById('lyric-script-input').value.trim();if(!scriptText)return;
  var state=scoreState.l;var fbPrompt=buildFeedbackPrompt(state);
  document.getElementById('l-regen-btn').disabled=true;document.getElementById('lyric-spinning').classList.add('on');
  try{
    var sys=buildLyricsSystemPrompt({genre:document.getElementById('l-music-genre').value,era:document.getElementById('l-era').value,songLen:document.getElementById('l-song-len').value,vibe:document.getElementById('l-lyric-vibe').value,imgStyle:document.getElementById('l-img-style').value,extraInstr:document.getElementById('l-extra-instr').value.trim(),vocalPrompt:buildVocalPrompt('l'),feedbackNote:fbPrompt});
    var result=await callAPI(key,sys,'대본:\n\n'+scriptText+'\n\n[재생성 — 가사와 음악 프롬프트만 재생성. 피드백 최우선 반영.]',4000);
    var parsed=parseLyricsResult(result);
    if(parsed.lyrics)lyricData.lyrics=parsed.lyrics;if(parsed.music)lyricData.music=parsed.music;
    pushScoreHistory(state);renderLyricContent();
    renderScoreSections('l-score-sections','l',undefined);renderScoreHistory('l-score-history-list',scoreState.l);
  }catch(e){alert('오류: '+e.message);}
  document.getElementById('l-regen-btn').disabled=false;document.getElementById('lyric-spinning').classList.remove('on');
}
async function regenLyricAllFeedback(){
  var key=getApiKey();if(!key)return;
  var scriptText=document.getElementById('lyric-script-input').value.trim();if(!scriptText)return;
  var state=scoreState.l;var fbPrompt=buildFeedbackPrompt(state);
  document.getElementById('l-regen-all-btn').disabled=true;document.getElementById('lyric-spinning').classList.add('on');
  try{
    var sys=buildLyricsSystemPrompt({genre:document.getElementById('l-music-genre').value,era:document.getElementById('l-era').value,songLen:document.getElementById('l-song-len').value,vibe:document.getElementById('l-lyric-vibe').value,imgStyle:document.getElementById('l-img-style').value,extraInstr:document.getElementById('l-extra-instr').value.trim(),vocalPrompt:buildVocalPrompt('l'),feedbackNote:fbPrompt});
    var result=await callAPI(key,sys,'대본:\n\n'+scriptText,4000);
    lyricData=parseLyricsResult(result);
    pushScoreHistory(state);renderLyricContent();
    renderScoreSections('l-score-sections','l',undefined);renderScoreHistory('l-score-history-list',scoreState.l);
  }catch(e){alert('오류: '+e.message);}
  document.getElementById('l-regen-all-btn').disabled=false;document.getElementById('lyric-spinning').classList.remove('on');
}

/* ─── dlWordLyric (lyric version — splitLangScript 사용) ─── */
function dlWordLyric() {
  var fname = getFname('lyric-fn', 'KR_01_가사');
  var secs = [];
  if (typeof lyricData !== 'undefined') {
    if (lyricData.lyrics) {
      var lSplit = splitLangScript(lyricData.lyrics);
      secs.push({ heading: '🎵 가사', text: lSplit.ko || lyricData.lyrics });
      if (lSplit.jp) secs.push({ heading: '🎵 歌詞 (日本語)', text: lSplit.jp });
    }
    if (lyricData.music) secs.push({ heading: '🎼 Suno 음악 프롬프트', text: lyricData.music });
    // 유튜브전략은 제외 (영어 섞임)
  }
  if (!secs.length) { alert('먼저 가사를 생성해주세요.'); return; }
  var html = generateWordClean('🎵 가사 패키지', secs[0].text, '', secs.slice(1));
  saveWordDoc(fname, html);
}

/* ─── v29 가사 한일 동시생성 (JP 시스템) ─── */
// ═══════════════════════════════════════════
// v29 — 가사 한국어·일본어 동시생성 시스템
// ═══════════════════════════════════════════

// ── 상태 ──
var LYRIC_OUT = 'kr'; // 'kr' | 'jp' | 'both'

// ── 언어 선택 ──
function setLyricOut(lang) {
  LYRIC_OUT = lang;
  ['kr','jp','both'].forEach(function(x) {
    var el = document.getElementById('lyric-out-' + x);
    if (el) el.classList.toggle('on', x === lang);
  });
  var jpSettings = document.getElementById('jp-lyric-settings');
  if (jpSettings) jpSettings.style.display = (lang === 'jp' || lang === 'both') ? 'block' : 'none';
}

// ── JP 시스템 프롬프트 빌더 ──
function buildJPLyricsSystemPrompt(opts) {
  var jpGenreMap = {
    'enka': '演歌 (エンカ) — 고부시(こぶし) 창법, 샤미센 또는 하모니카 인트로, 쇼와 노스탤지아',
    'kayokyoku': '歌謡曲 (カヨウキョク) — 쇼와 팝, 오케스트라 편곡, 流行歌 스타일',
    'minyo': '民謡 (ミンヨウ) — 지방 전통 민요 감성, 자연스럽고 소박한 멜로디',
    'fok-enka': 'フォーク演歌 — 어쿠스틱 기타 + 엔카 창법의 현대적 혼합'
  };
  var jpEraMap = {
    'showa30': '昭和30年代 (1955~64) — 전후 부흥기, 映画の黄金時代, 力道山, 三丁目の夕日 감성',
    'showa40': '昭和40年代 (1965~74) — 고도성장기, 万博, 団地, 三波春夫·美空ひばり 전성기',
    'showa50': '昭和50年代 (1975~84) — 안정성장기, 演歌의 황금기, 八代亜紀·森昌子 시대',
    'mix': 'AI가 가사 내용에 맞게 昭和 시대감 자유롭게 혼합'
  };
  var jpVibeMap = {
    'furusato': '故郷 — 고향에 대한 그리움, 田舎の風景, 幼い日の記憶, 親の温もり',
    'kizuna': '絆 — 인연의 소중함, 出会いと別れ, 縁, 人と人のつながり',
    'haha': '母 — 어머니를 향한 효심, 母の背中, 苦労した親への感謝, 涙と笑顔',
    'tabi': '旅 — 인생을 여행에 비유, 旅路, 人生の峠, 行く先々の景色',
    'ai': '愛 — 황혼의 사랑, 老いても変わらぬ絆, 夫婦の温もり, 晩年の恋'
  };
  var kobushiLevel = opts.kobushi || 3;
  var kobushiNote = kobushiLevel >= 4 ? '고부시 장식음을 적극적으로 표시. 「こぶしを効かせて」 지시 필수.' :
    kobushiLevel === 3 ? '고부시를 자연스럽게 적용. 중간 강도.' :
    '고부시 최소화. 현대적이고 깔끔한 창법.';

  var songlenMap = {
    '5min': '5分前後: [イントロ35秒]+[Aメロ]+[Bメロ]+[サビ]+[間奏]+[Aメロ2番]+[Bメロ]+[サビ]+[Cメロ·大サビ]+[転調サビ]+[アウトロ35秒]',
    '4min': '4分前後: [イントロ]+[Aメロ]+[サビ]+[間奏]+[Aメロ2番]+[サビ]+[Cメロ]+[アウトロ]',
    '3min': '3分前後: [イントロ]+[Aメロ]+[サビ]+[Aメロ2番]+[サビ]+[アウトロ]'
  };

  return '你は日本·韓国シニアチャンネル専用、上位0.001%の演歌·歌謡曲作詞家です。\n' +
    '60〜75歳のシニアが「この歌、私の人生そのものだ」と涙する歌詞を書きます。\n\n' +
    '━━ 絶対原則 ━━\n\n' +
    '【歌詞品質 — 上位0.001%】\n' +
    '1. 各行が独立しても詩(うた)になること\n' +
    '2. 60〜75歳が初めて聴いても一緒に口ずさめる自然な呼吸\n' +
    '3. サビは初めて聴いても「もう一度聴きたい」という中毒性\n' +
    '4. 演歌·歌謡曲特有の「哀愁」と「温もり」の共存\n' +
    '5. Cメロ·大サビで感情が爆発 → 転調サビで立ち上がる\n' +
    '6. アウトロは言葉が消えるように余韻で締める\n' +
    '7. 絶対に使わないこと: カタカナ外来語, 若者言葉, 英語\n\n' +
    '【こぶし(高振)】' + kobushiNote + '\n' +
    '【時代感】' + (jpEraMap[opts.era] || jpEraMap['showa40']) + '\n' +
    '【감성 테마】' + (jpVibeMap[opts.vibe] || jpVibeMap['furusato']) + '\n' +
    '【ジャンル】' + (jpGenreMap[opts.genre] || jpGenreMap['enka']) + '\n' +
    '【曲の長さ】' + (songlenMap[opts.songLen] || songlenMap['5min']) + '\n' +
    (opts.extraInstr ? '【追加指示】' + opts.extraInstr + '\n' : '') +
    '\n━━ 出力形式 ━━\n\n' +
    '###LYRICS_JP###\n' +
    'タイトル: [歌のタイトル]\n' +
    '[完全な歌詞全文 — 구조 레이블 포함]\n\n' +
    '###MUSIC_PROMPT_JP###\n' +
    'ジャンル:\nムード:\n楽器:\nボーカル:\nテンポ: [BPM]\nキー: [キー] → 転調 半音上げ\nダイナミクス:\nプロダクション:\nタグ:\n\n' +
    '[Suno歌詞入力本 - [verse][pre-chorus][chorus][instrumental][bridge][outro]タグ含む]\n\n' +
    '###IMAGE_PROMPTS_JP###\n' +
    '[カット1 - 故郷·昭和の風景]\nPrompt: [英語]\n\n' +
    '[カット2 - 母·家族の温もり]\nPrompt: [英語]\n\n' +
    '[カット3 - 旅·人生の風景]\nPrompt: [英語]\n\n' +
    '[リップシンクキャラ用]\nPrompt: [英語]\n\n' +
    '###YOUTUBE_JP###\n' +
    '타이틀 A案:\n타이틀 B案:\n태그:\n수익화 전략:\n';
}

// ── genLyric v29 — 한국어/일본어/동시 생성 ──
var _origGenLyric = genLyric;
genLyric = async function() {
  if (LYRIC_OUT === 'kr') {
    await _origGenLyric();
    return;
  }

  var key = getApiKey();
  if (!key || !isAsciiOnly(key)) {
    apiKeyMissingToast();
    document.getElementById('lyric-errbox').innerHTML = '⚠️ 설정에서 API 키를 입력해주세요';
    document.getElementById('lyric-errbox').classList.add('on');
    return;
  }
  var scriptText = document.getElementById('lyric-script-input').value.trim();
  if (!scriptText) {
    document.getElementById('lyric-errbox').innerHTML = '대본을 입력해주세요.';
    document.getElementById('lyric-errbox').classList.add('on');
    return;
  }
  document.getElementById('lyric-errbox').classList.remove('on');
  document.getElementById('btn-lyric').disabled = true;
  document.getElementById('lyric-spinning').classList.add('on');

  var jpOpts = {
    genre: document.getElementById('jp-genre') ? document.getElementById('jp-genre').value : 'enka',
    era: document.getElementById('jp-era') ? document.getElementById('jp-era').value : 'showa40',
    kobushi: document.getElementById('jp-kobushi-sl') ? parseInt(document.getElementById('jp-kobushi-sl').value) : 3,
    vibe: document.getElementById('jp-vibe') ? document.getElementById('jp-vibe').value : 'furusato',
    songLen: document.getElementById('l-song-len') ? document.getElementById('l-song-len').value : '5min',
    extraInstr: document.getElementById('jp-extra-instr') ? document.getElementById('jp-extra-instr').value.trim() : ''
  };

  try {
    if (LYRIC_OUT === 'jp') {
      // 일본어만
      var jpSys = buildJPLyricsSystemPrompt(jpOpts);
      var jpUser = '대본 내용:\n\n' + scriptText + '\n\n이 대본의 감성을 살려 일본어 가사를 작성해주세요.';
      var jpResult = await callAPI(key, jpSys, jpUser, 4000);
      lyricData.lyrics_jp = parseJPSection(jpResult, '###LYRICS_JP###', '###MUSIC_PROMPT_JP###');
      lyricData.music_jp = parseJPSection(jpResult, '###MUSIC_PROMPT_JP###', '###IMAGE_PROMPTS_JP###');
      lyricData.images_jp = parseJPSection(jpResult, '###IMAGE_PROMPTS_JP###', '###YOUTUBE_JP###');
      lyricData.youtube_jp = parseJPSection(jpResult, '###YOUTUBE_JP###', null);
      showJPTabs();
      lyricActiveSec = 'lyrics_jp';

    } else if (LYRIC_OUT === 'both') {
      // 한일 동시생성
      var krSys = buildLyricsSystemPrompt({
        genre: document.getElementById('l-music-genre').value,
        era: document.getElementById('l-era').value,
        songLen: document.getElementById('l-song-len').value,
        vibe: document.getElementById('l-lyric-vibe').value,
        imgStyle: document.getElementById('l-img-style').value,
        extraInstr: document.getElementById('l-extra-instr').value.trim()
      });
      var jpSys2 = buildJPLyricsSystemPrompt(jpOpts);
      var bothUser = '대본 내용:\n\n' + scriptText;

      var [krResult, jpResult2] = await Promise.all([
        callAPI(key, krSys, '대본:\n\n' + scriptText, 4000),
        callAPI(key, jpSys2, bothUser + '\n\n이 대본의 감성을 살려 일본어 가사를 작성해주세요.', 4000)
      ]);

      // 한국어 파싱
      lyricData = parseLyricsResult(krResult);

      // 일본어 파싱
      lyricData.lyrics_jp = parseJPSection(jpResult2, '###LYRICS_JP###', '###MUSIC_PROMPT_JP###');
      lyricData.music_jp = parseJPSection(jpResult2, '###MUSIC_PROMPT_JP###', '###IMAGE_PROMPTS_JP###');
      lyricData.images_jp = parseJPSection(jpResult2, '###IMAGE_PROMPTS_JP###', '###YOUTUBE_JP###');
      lyricData.youtube_jp = parseJPSection(jpResult2, '###YOUTUBE_JP###', null);
      showJPTabs();
    }

    document.getElementById('lyric-result').style.display = 'block';
    renderLyricContent();
  } catch(e) {
    document.getElementById('lyric-errbox').innerHTML = '오류: ' + e.message;
    document.getElementById('lyric-errbox').classList.add('on');
  }
  document.getElementById('btn-lyric').disabled = false;
  document.getElementById('lyric-spinning').classList.remove('on');
};

// ── JP 섹션 파싱 ──
function parseJPSection(text, start, end) {
  var si = text.indexOf(start);
  if (si < 0) return '';
  si += start.length;
  var ei = end ? text.indexOf(end, si) : text.length;
  return text.substring(si, ei < 0 ? text.length : ei).trim();
}

// ── JP 탭 표시 ──
function showJPTabs() {
  var jpTab = document.getElementById('lyric-jp-tab');
  var jpMusicTab = document.getElementById('lyric-jp-music-tab');
  if (jpTab) jpTab.style.display = '';
  if (jpMusicTab) jpMusicTab.style.display = '';
}

// ── renderLyricContent 확장 (JP 탭 처리) ──
var _origRenderLyricContent = renderLyricContent;
renderLyricContent = function() {
  // JP 섹션 처리
  if (lyricActiveSec === 'lyrics_jp' || lyricActiveSec === 'music_jp' ||
      lyricActiveSec === 'images_jp' || lyricActiveSec === 'youtube_jp') {
    var display = document.getElementById('l-content-display');
    var labelMap = {
      lyrics_jp: '🇯🇵 일본어 가사',
      music_jp: '🎼 Suno 음악 프롬프트 (일본어)',
      images_jp: '🖼 이미지 프롬프트 (일본어)',
      youtube_jp: '📺 수익화 전략 (일본어)'
    };
    var content = (lyricData && lyricData[lyricActiveSec]) || '';
    var label = labelMap[lyricActiveSec] || lyricActiveSec;
    var safeContent = content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    display.innerHTML = '<div class="content-card"><div class="card-head"><div class="card-title">' + label +
      '</div><button class="btn-copy" onclick="copyLyricJP(\'' + lyricActiveSec + '\')">복사</button></div>' +
      (content ? '<div class="output-text">' + safeContent + '</div>' :
        '<div style="color:#CCC;font-size:12px;padding:20px;text-align:center">아직 생성되지 않았습니다</div>') +
      '</div>';
    return;
  }
  _origRenderLyricContent();
};

// ── switchLyricSec 확장 ──
var _origSwitchLyricSec = switchLyricSec;
switchLyricSec = function(sec, btn) {
  lyricActiveSec = sec;
  document.querySelectorAll('.sec-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  renderLyricContent();
};

// ── JP 복사 ──
function copyLyricJP(key) {
  var text = lyricData && lyricData[key];
  if (!text) return;
  navigator.clipboard.writeText(text).then(function() { alert('복사됐습니다!'); });
}

// ── Word 저장 v29 개선 — 한일 분리 깔끔하게 ──
var _origDlWordLyric = dlWordLyric;
dlWordLyric = function() {
  var fname = getFname('lyric-fn', 'KR_01_가사');
  var hasKR = lyricData && lyricData.lyrics;
  var hasJP = lyricData && lyricData.lyrics_jp;

  if (!hasKR && !hasJP) { alert('먼저 가사를 생성해주세요.'); return; }

  // generateWordClean 함수 활용 (v28에서 정의됨)
  var secs = [];

  if (hasKR) {
    secs.push({ heading: '🇰🇷 한국어 가사', text: lyricData.lyrics });
    if (lyricData.music) secs.push({ heading: '🎼 한국어 음악 프롬프트 (Suno)', text: lyricData.music });
  }
  if (hasJP) {
    secs.push({ heading: '🇯🇵 日本語 歌詞', text: lyricData.lyrics_jp });
    if (lyricData.music_jp) secs.push({ heading: '🎼 日本語 音楽プロンプト (Suno)', text: lyricData.music_jp });
  }

  // generateWordClean이 있으면 사용, 없으면 직접 생성
  var mainTitle = '🎵 가사 패키지' + (hasKR && hasJP ? ' (한국어+일본어)' : hasJP ? ' (일본어)' : ' (한국어)');
  if (typeof generateWordClean === 'function') {
    var korText = hasKR ? lyricData.lyrics : '';
    var jpText = hasJP ? lyricData.lyrics_jp : '';
    var extraSecs = secs.filter(function(s) { return !s.heading.includes('가사') && !s.heading.includes('歌詞'); });
    var html = generateWordClean(mainTitle, korText, jpText, extraSecs);
    saveWordDoc(fname, html);
  } else {
    var html2 = generateWordHtml(mainTitle, secs);
    saveWordDoc(fname, html2);
  }
};

// ── TXT 저장도 한일 포함 ──
var _origDownloadLyric = downloadLyric;
downloadLyric = function() {
  var lines = ['【가사/음원 패키지 v29】', new Date().toLocaleString('ko-KR'), '─'.repeat(40)];
  if (lyricData.lyrics) {
    lines.push('', '【🇰🇷 한국어 가사】', lyricData.lyrics);
    if (lyricData.music) lines.push('', '【🎼 한국어 음악 프롬프트】', lyricData.music);
  }
  if (lyricData.lyrics_jp) {
    lines.push('', '【🇯🇵 日本語 歌詞】', lyricData.lyrics_jp);
    if (lyricData.music_jp) lines.push('', '【🎼 日本語 音楽プロンプト】', lyricData.music_jp);
  }
  if (lyricData.images) lines.push('', '【🖼 이미지 프롬프트】', lyricData.images);
  if (lyricData.images_jp) lines.push('', '【🖼 イメージプロンプト (JP)】', lyricData.images_jp);
  if (lyricData.youtube) lines.push('', '【📺 유튜브 수익화】', lyricData.youtube);

  var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '가사패키지_v29_' + new Date().toISOString().slice(0,10) + '.txt';
  a.click();
};

// ── 가사 탭 버튼 텍스트 업데이트 ──
(function updateLyricBtn() {
  var btn = document.getElementById('btn-lyric');
  if (btn) {
    // Update button text based on language selection
    var origClick = btn.onclick;
    btn.removeAttribute('onclick');
    btn.addEventListener('click', function() {
      var langMap = {
        kr: '🇰🇷 한국어 가사 + 음악 프롬프트 + 이미지 + 수익화 생성',
        jp: '🇯🇵 일본어 가사 + 음악 프롬프트 + 이미지 + 수익화 생성',
        both: '🇰🇷🇯🇵 한일 동시 가사 생성 (약 30~40초)'
      };
      genLyric();
    });
  }
})();

// setLyricOut 초기 실행 — 기본값 KR
setLyricOut('kr');

document.title = '대본생성기 v29 — 가사 한일 동시생성';
console.log('✅ v29 가사 한일 동시생성 기능 로드 완료');

/* ─── 가사/음원 탭 서브탭 ─── */

/* ═══════════════════════════════════════════════
   [신규] 🎵 가사/음원 탭 서브탭 — 추억노래·스토리·엔카·커버·예능
   =============================================== */
function switchLyricSub(id, btn){
  ['orig','memory','story','enka','cover','variety'].forEach(k=>{
    var p=document.getElementById('ls-'+k); if(p) p.style.display = (k===id?'block':'none');
  });
  document.querySelectorAll('#lyric-subtabs .ls-tab').forEach(b=>{
    b.style.background='transparent'; b.style.color='#7e6f79';
  });
  if(btn){
    btn.style.background='linear-gradient(135deg,#d96cb0,#8b6ad9)';
    btn.style.color='#fff';
  }
}
