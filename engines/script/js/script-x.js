/* ========================================================
   script-x.js  --  전문지식·잡학·숏드라마·사자성어·유머
   engines/script/index.html 에서 분리 (Phase 5 — X content)
   의존: script-common.js, script-api.js (callAPI, getApiKey, isAsciiOnly,
         apiKeyMissingToast), script-gen.js (saveWordDoc, generateWordHtml,
         generateWordClean, getFname)
   주의: switchXSec / renderImgPrompts / parseXResult / saveXTxt / saveXHist
         각 2회 선언 — 원본 버그 보존 (JS hoisting 마지막이 우선)
   ======================================================== */

// ════════════════════════════════════════
// v22 — 전문지식·잡학·숏드라마 공통 유틸
// ════════════════════════════════════════
var KF_FMT='shorts',KF_OUT='k',K_REVEAL='shock',K_DIFF='easy';
var TRI_TONE='shock',TRI_OUT='k';
var D_GENRE='family',D_STRUCT='3act',D_EMO='mid',D_OUT='k';

var X_DOMAINS=['과학·물리','화학·소재','생물·자연','우주·천문','역사·문명','경제·금융','공학·기술','의학·인체','심리학','지리·지질','수학','컴퓨터·AI','건축·도시','식품·요리'];
var TRIVIA_DOMAINS=['음식·요리','동물·자연','역사·어원','인체·뇌','우주·지구','숫자·기록','발명·기술','사회·문화','스포츠','일본 잡학','한국 잡학','세계 기록'];

function initDomainChips(wrapId,domains){
  var wrap=document.getElementById(wrapId);if(!wrap)return;
  domains.forEach(function(d){
    var chip=document.createElement('span');chip.className='td-chip';chip.textContent=d;
    chip.onclick=function(){chip.classList.toggle('on');};
    wrap.appendChild(chip);
  });
}
function getSelectedChips(wrapId){
  var wrap=document.getElementById(wrapId);if(!wrap)return'';
  return Array.from(wrap.querySelectorAll('.td-chip.on')).map(function(c){return c.textContent;}).join('·');
}
function initSeriesRows(containerId,badgeCls,n){
  var c=document.getElementById(containerId);if(!c)return;c.innerHTML='';
  for(var i=1;i<=n;i++){
    var row=document.createElement('div');row.className='series-ep-row';
    row.innerHTML='<div class="series-ep-badge '+badgeCls+'">'+i+'</div><input class="series-ep-input" id="'+containerId+'-ep'+i+'" placeholder="'+i+'편 주제 (선택)">';
    c.appendChild(row);
  }
}
function getSeriesTopics(containerId,n){
  var arr=[];for(var i=1;i<=n;i++){var el=document.getElementById(containerId+'-ep'+i);if(el&&el.value.trim())arr.push(i+'편: '+el.value.trim());}return arr.join('\n');
}
function switchXSec(prefix,sec,btn){
  var allSecs={k:['script','images','youtube','series'],tri:['script','images','youtube','series'],d:['script','images','youtube']};
  (allSecs[prefix]||[]).forEach(function(s){var el=document.getElementById(prefix+'-sec-'+s);if(el)el.style.display='none';});
  var pgId=prefix==='k'?'pg-know':prefix==='tri'?'pg-trivia':'pg-drama';
  document.querySelectorAll('#'+pgId+' .x-sec-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  var t=document.getElementById(prefix+'-sec-'+sec);if(t)t.style.display='block';
}
function renderImgPrompts(listId,text){
  var wrap=document.getElementById(listId);if(!wrap||!text)return;
  var blocks=text.split(/(?=\[씬\d|\[Scene|\d+\.\s*\[)/i).filter(function(b){return b.trim();});
  if(!blocks.length)blocks=[text];
  wrap.innerHTML=blocks.map(function(b){return'<div class="img-prompt-item"><span style="flex:1">'+escHtml(b.trim())+'</span><button class="btn-copy" style="flex-shrink:0;font-size:10px;padding:3px 8px" onclick="var t=this.parentNode.querySelector(\'span\').textContent;navigator.clipboard.writeText(t);this.textContent=\'✓\';var me=this;setTimeout(function(){me.textContent=\'복사\'},1500)">복사</button></div>';}).join('');
}
function copyXSec(prefix,key){
  var elMap={k:{script:'k-out',images:'k-img-list',youtube:'k-yt',series:'k-ser'},tri:{script:'tri-out',images:'tri-img-list',youtube:'tri-yt',series:'tri-ser'},d:{script:'d-out',images:'d-img-list',youtube:'d-yt'}};
  var elId=elMap[prefix]&&elMap[prefix][key];if(!elId)return;
  var el=document.getElementById(elId);if(!el)return;
  var text=el.tagName==='TEXTAREA'?el.value:el.textContent;if(!text)return;
  navigator.clipboard.writeText(text).then(function(){alert('복사됐습니다!');}).catch(function(){var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);alert('복사됐습니다!');});
}
function saveXTxt(type){
  var map={know:'k',trivia:'tri',drama:'d'};var p=map[type];
  var el=document.getElementById(p+'-out');if(!el||!el.value)return;
  var fn=type+'_'+new Date().toISOString().slice(0,10)+'.txt';
  var blob=new Blob([el.value],{type:'text/plain;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;a.click();
}
function saveXHist(type){
  var map={know:'k',trivia:'tri',drama:'d'};var p=map[type];
  var el=document.getElementById(p+'-out');if(!el||!el.value)return;
  var title=el.value.split('\n')[0].replace(/[「」\[\]]/g,'').slice(0,32);
  var hist=JSON.parse(localStorage.getItem('hist_v10')||'[]');
  var now=new Date();
  hist.unshift({title:'['+type+'] '+title,text:el.value,date:now.getFullYear()+'.'+(now.getMonth()+1)+'.'+now.getDate(),mode:type[0]});
  if(hist.length>25)hist=hist.slice(0,25);localStorage.setItem('hist_v10',JSON.stringify(hist));alert('히스토리에 저장했습니다.');
}
function parseXResult(text){
  function ex(t,s,e){var si=t.indexOf(s);if(si===-1)return'';si+=s.length;var ei=e?t.indexOf(e,si):t.length;return t.substring(si,ei===-1?t.length:ei).trim();}
  return{script:ex(text,'###SCRIPT###','###IMAGE_PROMPTS###'),images:ex(text,'###IMAGE_PROMPTS###','###YOUTUBE###'),youtube:ex(text,'###YOUTUBE###','###SERIES_PLAN###'),series:ex(text,'###SERIES_PLAN###',null)};
}

// ── 전문지식 설정 함수 ──
function setKFmt(f,card){KF_FMT=f;document.querySelectorAll('.fmt-card').forEach(function(c){c.classList.remove('on');});card.classList.add('on');
  var sl=document.getElementById('kf-dur');
  if(f==='shorts'){sl.min=20;sl.max=180;sl.step=5;sl.value=Math.min(parseInt(sl.value)||60,180);}
  else if(f==='mini'){sl.min=180;sl.max=480;sl.step=15;sl.value=Math.max(180,Math.min(parseInt(sl.value)||240,480));}
  else{sl.min=480;sl.max=1200;sl.step=30;sl.value=Math.max(480,parseInt(sl.value)||600);}
  updKDur();}
function updKDur(){
  var v=parseInt(document.getElementById('kf-dur').value)||60;
  var mn=Math.floor(v/60),sc=v%60;
  document.getElementById('kf-dur-val').textContent=mn>0?(sc>0?mn+'분 '+sc+'초':mn+'분'):v+'초';
  var b=KF_FMT==='shorts'?(v<=40?'미니숏츠':v<=90?'숏 숏츠':'표준 숏츠'):KF_FMT==='mini'?(v<=300?'3~5분':v<=420?'5~7분':'7~8분'):(v<=600?'8~10분':v<=900?'10~15분':'15~20분');
  document.getElementById('kf-dur-badge').textContent=b;
  var viz=document.getElementById('kf-struct');if(!viz)return;
  var blocks=KF_FMT==='shorts'?[['sv-1','훅'],['sv-2','긴장'],['sv-3','핵심'],['sv-5','임팩트'],['sv-6','CTA']]:
    KF_FMT==='mini'?[['sv-1','훅'],['sv-2','도입'],['sv-3','전개'],['sv-4','클라이맥스'],['sv-5','심화'],['sv-6','마무리']]:
    [['sv-1','오프닝'],['sv-2','챕터1'],['sv-3','챕터2'],['sv-4','챕터3'],['sv-5','챕터4'],['sv-6','챕터5'],['sv-7','마무리']];
  viz.innerHTML=blocks.map(function(b){return'<div class="sv-block '+b[0]+'">'+b[1]+'</div>';}).join('');
}
function setKOut(o){KF_OUT=o;['k','j','b'].forEach(function(x){document.getElementById('ko-'+x).classList.toggle('on',x===o);});}
function setKReveal(r,c){K_REVEAL=r;document.querySelectorAll('.rcard').forEach(function(x){x.classList.remove('on');});c.classList.add('on');}
function setKDiff(d,b){K_DIFF=d;document.querySelectorAll('[id^="kd-"]').forEach(function(x){x.classList.remove('on');});b.classList.add('on');}
// ── 잡학 설정 함수 ──
function setTTone(t,c){TRI_TONE=t;document.querySelectorAll('.tt-card').forEach(function(x){x.classList.remove('on');});c.classList.add('on');}
function setTriOut(o){TRI_OUT=o;['k','j','b'].forEach(function(x){document.getElementById('tri-out-'+x).classList.toggle('on',x===o);});}
// ── 숏드라마 설정 함수 ──
function setDGenre(g,c){D_GENRE=g;document.querySelectorAll('.dg-card').forEach(function(x){x.classList.remove('on');});c.classList.add('on');}
function setDStruct(s,c){D_STRUCT=s;document.querySelectorAll('.ds-card').forEach(function(x){x.classList.remove('on');});c.classList.add('on');}
function setDEmo(e,b){D_EMO=e;document.querySelectorAll('[id^="de-"]').forEach(function(x){x.classList.remove('on');x.style.background='';x.style.color='';});b.classList.add('on');b.style.background='#8030A0';b.style.color='#fff';}
function setDOut(o){D_OUT=o;['k','j','b'].forEach(function(x){document.getElementById('d-out-'+x).classList.toggle('on',x===o);});}

// ── 전문지식 생성 ──
async function genKnow(){
  var key=getApiKey();if(!key||!isAsciiOnly(key)){var eb=document.getElementById('k-errbox');apiKeyMissingToast();eb.innerHTML='⚠️ 설정에서 API 키를 입력해주세요';eb.classList.add('on');return;}
  var topic=document.getElementById('k-topic').value.trim();if(!topic){var eb=document.getElementById('k-errbox');eb.innerHTML='주제를 입력해주세요.';eb.classList.add('on');return;}
  document.getElementById('k-errbox').classList.remove('on');
  var domain=getSelectedChips('k-domain-chips')||document.getElementById('k-domain').value.trim()||'일반 과학';
  var dur=parseInt(document.getElementById('kf-dur').value)||60;
  var mn=Math.floor(dur/60),sc=dur%60;var durStr=mn>0?(sc>0?mn+'분 '+sc+'초':mn+'분'):dur+'초';
  var audience=document.getElementById('k-audience').value;
  var cta=document.getElementById('k-cta').value;
  var facts=document.getElementById('k-facts').value.trim();
  var next=document.getElementById('k-next').value.trim();
  var extra=document.getElementById('k-extra').value.trim();
  var seriesPlan=getSeriesTopics('k-series-rows',5);
  var REVEAL_MAP={shock:'"이 상식은 사실 완전히 틀렸다"는 반직관적 사실로 시작.',mystery:'수수께끼처럼 시작. 단서를 하나씩 공개.',story:'역사적 사건이나 실제 인물 사례로 시작.',timeline:'탄생→발전→현재 역사적 흐름 추적.',mechanism:'작동 원리를 단계별로 해부.',why:'"왜?" 근본 질문으로 시작.',hidden:'"아무도 알려주지 않는" 내부자 관점.',compare:'A vs B 비교로 핵심 원리 부각.'};
  var DIFF_MAP={easy:'전문 용어 없이 쉽게. 비유와 일상 사례로만.',mid:'핵심 전문 용어 사용하되 즉시 쉽게 설명.',hard:'전문 용어와 심층 메커니즘 상세히.'};
  var AUD_MAP={general:'일반 대중 — 쉽고 재미있게',senior:'60~75세 시니어 — 친근하고 천천히, 생활과 연결',curious:'지식 호기심 강한 시청자'};
  var FMT_MAP={shorts:'【지식 숏츠 5단계 구조】\n훅(4~6줄)→긴장(3~4줄)→핵심공개(5~7줄)→임팩트(2~3줄)→CTA(2~3줄)\n총 16~23줄. 줄당 15~30자 필수 (Aon Pro 최적화)',mini:'【미니 다큐 6파트 구조】\n오프닝훅→도입→핵심원리→반전·심화→실생활연결→마무리CTA\n전체 3~8분 분량.',long:'【롱폼 다큐】\n강력한 오프닝 훅 → 챕터1~5 → 마무리CTA\n챕터명 명시. 8~20분 분량.'};
  var outNote=KF_OUT==='k'?'한국어로만 출력.':KF_OUT==='j'?'일본어로만 출력.':'두 언어 모두:\n=====일본어=====\n(일본어 대본)\n=====한국어=====\n(한국어 대본)';
  var sys='당신은 유튜브 전문지식 채널 상위 0.01% 대본 작가입니다.\n"와, 처음 알았다!" 반응을 끌어내는 것이 목표.\n\n【진실성 원칙】허구 수치·허구 기관명·과장 완전 금지. 전문 용어는 즉시 쉬운 말로 설명.\n\n【분야】'+domain+'\n【포맷】'+FMT_MAP[KF_FMT]+'\n【공개방식】'+REVEAL_MAP[K_REVEAL]+'\n【난이도】'+DIFF_MAP[K_DIFF]+'\n【타겟】'+AUD_MAP[audience]+'\n\n【기억 문장 필수 1개】 시청자가 스크린샷 찍고 싶은 한 문장.\n\n'+outNote+'\n\n━━ 출력 형식 ━━\n###SCRIPT###\n(대본)\n###IMAGE_PROMPTS###\n[씬1] Prompt: (영어)\n[씬2] Prompt: (영어)\n...\n###YOUTUBE###\n제목 A안:\n제목 B안:\n제목 C안:\n썸네일 텍스트:\n태그:\n댓글 유도 문구:\n숏츠 훅 3개:\n###SERIES_PLAN###\n5~8편 시리즈 기획안:'+(seriesPlan?'\n입력된 시리즈 계획:\n'+seriesPlan:'');
  var user='주제: "'+topic+'"\n분야: '+domain+'\n목표 길이: '+durStr+'\n'+(next?'다음편 예고: "'+next+'"\n':'다음편 예고: 없음\n')+(facts?'반드시 포함할 사실:\n'+facts+'\n':'')+(extra?'추가 지시: '+extra+'\n':'')+'순수 텍스트. 기억 문장 1개 필수.';
  document.getElementById('k-genbtn').disabled=true;document.getElementById('k-spinning').classList.add('on');
  try{
    var result=await callAPI(key,sys,user,KF_FMT==='long'?5500:4000);
    if(KF_OUT!=='k')result=postProcessOutputText(result,KF_OUT);
    var parsed=parseXResult(result);
    document.getElementById('k-out').value=parsed.script||result;
    document.getElementById('k-cnt').textContent=(parsed.script||result).split('\n').length+'줄';
    if(parsed.youtube)document.getElementById('k-yt').textContent=parsed.youtube;
    if(parsed.series)document.getElementById('k-ser').textContent=parsed.series;
    renderImgPrompts('k-img-list',parsed.images);
    document.getElementById('k-result').style.display='block';
    document.getElementById('k-result').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){document.getElementById('k-errbox').innerHTML='오류: '+e.message;document.getElementById('k-errbox').classList.add('on');}
  document.getElementById('k-genbtn').disabled=false;document.getElementById('k-spinning').classList.remove('on');
}

// ── 잡학·트리비아 생성 ──
async function genTrivia(){
  var key=getApiKey();if(!key||!isAsciiOnly(key)){var eb=document.getElementById('tri-errbox');apiKeyMissingToast();eb.innerHTML='⚠️ 설정에서 API 키를 입력해주세요';eb.classList.add('on');return;}
  var topic=document.getElementById('t-topic').value.trim();if(!topic){var eb=document.getElementById('tri-errbox');eb.innerHTML='주제를 입력해주세요.';eb.classList.add('on');return;}
  document.getElementById('tri-errbox').classList.remove('on');
  var domain=getSelectedChips('trivia-domain-chips')||'일반';
  var dur=document.getElementById('tri-dur').value;
  var target=document.getElementById('tri-target').value;
  var extra=document.getElementById('tri-extra').value.trim();
  var seriesPlan=getSeriesTopics('tri-series-rows',5);
  var TONE_MAP={shock:'충격·반전형 — 상식을 뒤집는 반직관적 사실로 시작.',wonder:'경이·감탄형 — 자연·우주의 신비를 경이롭게.',funny:'유쾌·재미형 — 웃음+지식의 가벼운 트리비아.',history:'역사·기원형 — 이름의 유래, 어원, 기원 비밀.',body:'몸·뇌 과학형 — 인체·뇌의 신기한 사실. 건강 연결.',number:'숫자·기록형 — "세계 최초/최대" 기록과 통계.',japan:'일본 자부심형 — 일본의 독특한 문화·기술·역사.',compare:'비교·랭킹형 — A vs B 의외의 비교.'};
  var TGT_MAP={all:'전 연령 — 누구나 공유하고 싶은 재미있고 놀라운 사실',senior:'60~75세 시니어 — 손자에게 전달하고 싶은 느낌. 옛날 경험과 연결',curious:'지식 탐구형 — 깊이 있되 쉽게'};
  var outNote=TRI_OUT==='k'?'한국어로만 출력.':TRI_OUT==='j'?'일본어로만 출력.':'두 언어 모두:\n=====일본어=====\n(일본어)\n=====한국어=====\n(한국어)';
  var sys='당신은 한국·일본 잡학·트리비아 숏츠 전문 대본 작가.\n"헤~" "이거 몰랐지?" 반응을 끌어내는 지식 엔터테인먼트 전문가.\n\n【핵심 원칙】\n1. 사실 정확성 최우선 — 허구 정보 절대 금지\n2. 첫 문장에서 시청자를 멈추게 만드는 훅\n3. "이거 손자에게 알려줘야겠다" 공유 욕구 자극\n4. 줄당 15~30자 (Aon Pro 최적화)\n5. 기억 문장 1개 필수\n\n【톤·스타일】'+TONE_MAP[TRI_TONE]+'\n【분야】'+domain+'\n【타겟】'+TGT_MAP[target]+'\n\n'+outNote+'\n\n━━ 출력 형식 ━━\n###SCRIPT###\n(대본: 훅→본문→기억문장→CTA)\n###IMAGE_PROMPTS###\n[씬1] Prompt: (영어)\n...\n###YOUTUBE###\n제목 A안: (충격형)\n제목 B안: (호기심형)\n제목 C안: (공유유도형)\n썸네일 텍스트:\n태그:\n댓글 유도 문구:\n숏츠 훅 3개:\n###SERIES_PLAN###\n5편 시리즈 기획안:'+(seriesPlan?'\n입력된 계획:\n'+seriesPlan:'');
  var user='주제/소재: "'+topic+'"\n분야: '+domain+'\n목표 길이: '+dur+'초\n'+(extra?'추가 지시: '+extra+'\n':'');
  document.getElementById('tri-genbtn').disabled=true;document.getElementById('tri-spinning').classList.add('on');
  try{
    var result=await callAPI(key,sys,user,3500);
    if(TRI_OUT!=='k')result=postProcessOutputText(result,TRI_OUT);
    var parsed=parseXResult(result);
    document.getElementById('tri-out').value=parsed.script||result;
    document.getElementById('tri-cnt').textContent=(parsed.script||result).split('\n').length+'줄';
    if(parsed.youtube)document.getElementById('tri-yt').textContent=parsed.youtube;
    if(parsed.series)document.getElementById('tri-ser').textContent=parsed.series;
    renderImgPrompts('tri-img-list',parsed.images);
    document.getElementById('tri-result').style.display='block';
    document.getElementById('tri-result').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){document.getElementById('tri-errbox').innerHTML='오류: '+e.message;document.getElementById('tri-errbox').classList.add('on');}
  document.getElementById('tri-genbtn').disabled=false;document.getElementById('tri-spinning').classList.remove('on');
}

// ── 숏드라마 생성 ──
async function genDrama(){
  var key=getApiKey();if(!key||!isAsciiOnly(key)){var eb=document.getElementById('d-errbox');apiKeyMissingToast();eb.innerHTML='⚠️ 설정에서 API 키를 입력해주세요';eb.classList.add('on');return;}
  var topic=document.getElementById('d-topic').value.trim();if(!topic){var eb=document.getElementById('d-errbox');eb.innerHTML='드라마 소재를 입력해주세요.';eb.classList.add('on');return;}
  document.getElementById('d-errbox').classList.remove('on');
  var dur=document.getElementById('d-dur').value;
  var extra=document.getElementById('d-extra').value.trim();
  var next=document.getElementById('d-next').value.trim();
  var GENRE_MAP={family:'가족·감동 — 부모자식, 손자 이야기.',nostalgia:'향수·추억 — 옛날로 돌아가는 회상.',twist:'반전·충격 — 예상 못한 반전으로 감동.',comedy:'코미디·공감 — 시니어 일상 유머.',wisdom:'인생·지혜 — 어른의 삶에서 배우는 교훈.',romance:'황혼·로맨스 — 중년·노년의 사랑이야기.',health:'건강·도전 — 늦지 않은 새 시작의 용기.',community:'이웃·공동체 — 따뜻한 동네 사람들.'};
  var STRUCT_MAP={'3act':'3막 구조 — 발단(상황설정)→갈등(감정고조)→해결(감동)','twist':'반전 구조 — 일상적 시작→충격 반전→감동 마무리','flash':'회상 구조 — 현재→과거 회상→현재로 돌아와 깨달음','mono':'독백 구조 — 한 사람의 내면 독백. 감성 1인칭 서사'};
  var EMO_MAP={light:'잔잔하고 따뜻한 감성. 미소 짓는 결말.',mid:'감동적이고 뭉클한. 가슴 따뜻해지는 결말.',strong:'눈물 유발. 강렬한 감동 결말.'};
  var outNote=D_OUT==='k'?'한국어로만 출력.':D_OUT==='j'?'일본어로만 출력.':'두 언어 모두:\n=====일본어=====\n(일본어)\n=====한국어=====\n(한국어)';
  var sys='당신은 한국·일본 숏드라마 전문 대본 작가.\n60~180초 미니 드라마. 시니어 감성 자극 최강 포맷.\n\n【핵심 원칙】\n1. 첫 문장에서 감정을 잡아야 함\n2. 모든 대사는 자연스럽게. 과장 없이. 실제 인물처럼\n3. 시니어가 자신의 삶과 연결할 수 있는 소재\n4. Aon Pro 최적화: 줄 1개 = 씬 1개, 줄당 15~30자\n5. 지문은 간결하게. 대사 중심.\n\n【장르】'+GENRE_MAP[D_GENRE]+'\n【구조】'+STRUCT_MAP[D_STRUCT]+'\n【감정 강도】'+EMO_MAP[D_EMO]+'\n\n【대본 형식】\n지문: (씬 묘사 간결히)\n[인물명] "대사"\n(나레이션 필요시)\n\n'+outNote+'\n\n━━ 출력 형식 ━━\n###SCRIPT###\n(숏드라마 대본 전문)\n###IMAGE_PROMPTS###\n[씬1/장면명] Prompt: (영어, AI이미지·립싱크용) Style: 권장스타일\n...\n###YOUTUBE###\n제목 A안:\n제목 B안:\n제목 C안:\n썸네일 텍스트:\n태그:\n댓글 유도 문구:\n숏츠 훅 3개:';
  var user='드라마 소재: "'+topic+'"\n목표 길이: '+dur+'초\n'+(extra?'추가 설정: '+extra+'\n':'')+(next?'다음화 예고: "'+next+'"\n':'다음화 예고: 없음\n')+'자연스러운 대사. 감동적 결말.';
  document.getElementById('d-genbtn').disabled=true;document.getElementById('d-spinning').classList.add('on');
  try{
    var result=await callAPI(key,sys,user,3500);
    if(D_OUT!=='k')result=postProcessOutputText(result,D_OUT);
    var parsed=parseXResult(result);
    document.getElementById('d-out').value=parsed.script||result;
    document.getElementById('d-cnt').textContent=(parsed.script||result).split('\n').length+'줄';
    if(parsed.youtube)document.getElementById('d-yt').textContent=parsed.youtube;
    renderImgPrompts('d-img-list',parsed.images);
    document.getElementById('d-result').style.display='block';
    document.getElementById('d-result').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){document.getElementById('d-errbox').innerHTML='오류: '+e.message;document.getElementById('d-errbox').classList.add('on');}
  document.getElementById('d-genbtn').disabled=false;document.getElementById('d-spinning').classList.remove('on');
}

// ── 초기화 ──
(function(){
  initDomainChips('k-domain-chips',X_DOMAINS);
  initDomainChips('trivia-domain-chips',TRIVIA_DOMAINS);
  initSeriesRows('k-series-rows','sep-know',5);
  initSeriesRows('tri-series-rows','sep-trivia',5);
  setTimeout(updKDur,50);
})();


// ═══════════════════════════════════════
// v26 완전작동 추가 JS
// ═══════════════════════════════════════

// ─── TAB 함수 업데이트 ───
(function() {
  var origTAB = TAB;
  TAB = function(name, btn) {
    var allPages = ['gen','batch','lyric','know','trivia','drama','saying','humor','hub','hist','preset','guide'];
    allPages.forEach(function(n) {
      var el = document.getElementById('pg-' + n);
      if (el) el.classList.add('hide');
    });
    document.querySelectorAll('.tnav').forEach(function(b) { b.classList.remove('on'); });
    var pg = document.getElementById('pg-' + name);
    if (pg) pg.classList.remove('hide');
    btn.classList.add('on');
    document.getElementById('stickyGen').style.display = name === 'gen' ? 'flex' : 'none';
    if (name === 'hist') renderHist();
    if (name === 'preset') { renderPreset(); renderPresetQuick(); }
  };
})();

// ─── X탭 섹션 전환 (saying/humor 포함) ───
function switchXSec(prefix, sec, btn) {
  var secMap = {
    k: ['script','images','youtube','series'],
    tri: ['script','images','youtube','series'],
    d: ['script','images','youtube'],
    sa: ['script','images','youtube','series'],
    hm: ['script','images','youtube']
  };
  var pgMap = { k: 'know', tri: 'trivia', d: 'drama', sa: 'saying', hm: 'humor' };
  var secs = secMap[prefix] || [];
  secs.forEach(function(s) {
    var el = document.getElementById(prefix + '-sec-' + s);
    if (el) el.style.display = 'none';
  });
  var pgId = 'pg-' + (pgMap[prefix] || prefix);
  document.querySelectorAll('#' + pgId + ' .x-sec-btn').forEach(function(b) {
    b.classList.remove('active');
  });
  btn.classList.add('active');
  var target = document.getElementById(prefix + '-sec-' + sec);
  if (target) target.style.display = 'block';
}

// ─── 이미지 프롬프트 렌더 ───
function renderImgPrompts(listId, text) {
  var wrap = document.getElementById(listId);
  if (!wrap || !text) return;
  var blocks = text.replace(/\n\n+/g, '\n\n').split(/\n(?=\[)/);
  if (!blocks.length) blocks = [text];
  wrap.innerHTML = blocks.filter(function(b) { return b.trim(); }).map(function(b) {
    var escaped = b.trim().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return '<div class="img-prompt-item"><span style="flex:1">' + escaped + '</span>' +
      '<button class="btn-copy" style="flex-shrink:0;font-size:10px;padding:3px 8px" ' +
      'onclick="(function(t){navigator.clipboard.writeText(t).then(function(){}).catch(function(){});this.textContent=\'✓\';var me=this;setTimeout(function(){me.textContent=\'복사\'},1500)}).call(this,\'' +
      b.trim().replace(/'/g,"\\'").replace(/\n/g,'\\n') + '\')">' +
      '복사</button></div>';
  }).join('');
}

// ─── parseXResult ───
function parseXResult(text) {
  function ex(t, s, e) {
    var si = t.indexOf(s);
    if (si < 0) return '';
    si += s.length;
    var ei = e ? t.indexOf(e, si) : t.length;
    return t.substring(si, ei < 0 ? t.length : ei).trim();
  }
  return {
    script: ex(text, '###SCRIPT###', '###IMAGE_PROMPTS###'),
    images: ex(text, '###IMAGE_PROMPTS###', '###YOUTUBE###'),
    youtube: ex(text, '###YOUTUBE###', '###SERIES_PLAN###'),
    series: ex(text, '###SERIES_PLAN###', null)
  };
}

// ─── X탭 복사/저장 헬퍼 ───
function copyXText(prefix) {
  var el = document.getElementById(prefix + '-out');
  if (!el || !el.value) return;
  navigator.clipboard.writeText(el.value).then(function() { alert('복사됐습니다!'); });
}
function copyXImgAll(prefix) {
  var el = document.getElementById(prefix + '-img-list');
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(function() { alert('복사됐습니다!'); });
}
function copyXYt(prefix) {
  var el = document.getElementById(prefix + '-yt');
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(function() { alert('복사됐습니다!'); });
}
function copyXSer(prefix) {
  var el = document.getElementById(prefix + '-ser');
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(function() { alert('복사됐습니다!'); });
}
function saveXTxt(type) {
  var map = { saying: 'sa', humor: 'hm', know: 'k', trivia: 'tri', drama: 'd' };
  var p = map[type] || type;
  var el = document.getElementById(p + '-out');
  if (!el || !el.value) return;
  var blob = new Blob([el.value], { type: 'text/plain;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = type + '_' + new Date().toISOString().slice(0,10) + '.txt';
  a.click();
}
function saveXHist(type) {
  var map = { saying: 'sa', humor: 'hm', know: 'k', trivia: 'tri', drama: 'd' };
  var p = map[type] || type;
  var el = document.getElementById(p + '-out');
  if (!el || !el.value) return;
  var title = el.value.split('\n')[0].replace(/[「」\[\]]/g,'').slice(0,32);
  var hist = JSON.parse(localStorage.getItem('hist_v10') || '[]');
  hist.unshift({ title: '[' + type + '] ' + title, text: el.value, date: new Date().toLocaleDateString('ko-KR'), mode: type[0] });
  if (hist.length > 25) hist = hist.slice(0,25);
  localStorage.setItem('hist_v10', JSON.stringify(hist));
  alert('히스토리에 저장했습니다.');
}

// ─── Word 다운로드 (HTML→Word 방식 — CDN 불필요) ───

// ─── 사자성어·명언 상태 ───
var SA_TYPE = 'idiomatic', SA_OUT = 'k', SA_FMT = 'short';
var HM_TYPE = 'daily', HM_AGE = 'g', HM_OUT = 'k';
var SA_TOPICS = ['인내·끈기','가족·사랑','건강·장수','행복·감사','우정·이웃','노력·성공','시간·인생','마음·평화','극복·용기','소박함'];
var HM_TOPICS_G = ['할아버지 스마트폰','손자와 할머니','병원 대기실','노인 운전면허','퇴직 후 첫날','아내와 남편 다툼'];
var HM_TOPICS_19 = ['부부의 밤','목욕탕에서','검진 중 실수','부부 건강검진','노인 소개팅','잠자리 이야기'];

function setSayType(t, el) {
  SA_TYPE = t;
  document.querySelectorAll('.say-card').forEach(function(x) { x.classList.remove('on'); });
  el.classList.add('on');
}
function setSayFmt(f, el) {
  SA_FMT = f;
  document.querySelectorAll('.say-fmt-btn').forEach(function(x) { x.classList.remove('on'); });
  el.classList.add('on');
}
function setSaOut(o) {
  SA_OUT = o;
  ['k','j','b'].forEach(function(x) { document.getElementById('sa-out-' + x).classList.toggle('on', x === o); });
}
function setHmType(t, el) {
  HM_TYPE = t;
  document.querySelectorAll('.hm-card').forEach(function(x) { x.classList.remove('on'); });
  el.classList.add('on');
}
function setHmOut(o) {
  HM_OUT = o;
  ['k','j','b'].forEach(function(x) { document.getElementById('hm-out-' + x).classList.toggle('on', x === o); });
}
function setHmAge(a, el) {
  HM_AGE = a;
  document.querySelectorAll('.age-btn').forEach(function(x) { x.classList.remove('on'); });
  el.classList.add('on');
  document.getElementById('r19-notice').classList.toggle('show', a === '19');
  renderHmChips();
}
function renderHmChips() {
  var wrap = document.getElementById('hm-chips');
  if (!wrap) return;
  wrap.innerHTML = '';
  var topics = HM_AGE === 'g' ? HM_TOPICS_G : HM_TOPICS_19;
  topics.forEach(function(t) {
    var span = document.createElement('span');
    span.className = 'topic-chip hm';
    span.textContent = t;
    span.onclick = function() { document.getElementById('hm-topic').value = t; };
    wrap.appendChild(span);
  });
}

// 초기 칩 렌더
(function() {
  var saWrap = document.getElementById('sa-chips');
  if (saWrap) SA_TOPICS.forEach(function(t) {
    var span = document.createElement('span');
    span.className = 'topic-chip';
    span.textContent = t;
    span.onclick = function() { document.getElementById('sa-topic').value = t; };
    saWrap.appendChild(span);
  });
  renderHmChips();
})();

// ─── 사자성어·명언 생성 ───
async function genSaying() {
  var key = getApiKey();
  if (!key || !isAsciiOnly(key)) {
    var eb = document.getElementById('sa-errbox');
    apiKeyMissingToast(); eb.innerHTML = '⚠️ 설정에서 API 키를 입력해주세요'; eb.classList.add('on'); return;
  }
  document.getElementById('sa-errbox').classList.remove('on');
  var topic = document.getElementById('sa-topic').value.trim();
  var specific = document.getElementById('sa-specific').value.trim();
  var dur = document.getElementById('sa-dur').value;
  var cta = document.getElementById('sa-cta').value;
  var extra = document.getElementById('sa-extra').value.trim();

  var typeMap = {
    idiomatic: '한국 사자성어(四字成語) — 한자 풀이 + 유래 고사 + 현대 시니어 삶 연결',
    proverb: '한국 속담·격언 — 옛 조상 지혜. 탄생 배경 + 실생활 적용',
    world: '세계 위인 명언 — 아인슈타인·공자·처칠 등. 반드시 정확한 출처 명시',
    japan: '일본 사자숙어(四字熟語) — 一期一会·初志貫徹·七転八起 등. 한국어 의미 포함',
    mix: '한·중·일 명언 AI 최적 선택 — 주제에 가장 감동적인 명언 자동',
    story: '고사(故事)형 — 명언 탄생 역사적 사건을 드라마처럼. 등장인물+갈등+교훈',
    life: '인생·노년형 — 60~75세 시니어 "내 얘기다" 공감. 노년 지혜·진짜 행복',
    health: '건강·마음형 — 몸과 마음 균형. 시니어 건강 채널과 자연 연결'
  };
  var fmtMap = {
    short: '숏츠형 (' + dur + '초): 명언 제시(임팩트) → 해설(쉽게) → 현대 시니어 삶 적용 → 감동 마무리 → CTA',
    series: '시리즈 1편 (' + dur + '초): "오늘의 명언" → 명언+해설 → 다음편 기대감 형성',
    story: '스토리텔링 (' + dur + '초): 명언 주인공 소개 → 어떤 상황에서 이 말을 했는지 → 시청자 삶 연결',
    quiz: '퀴즈형 (' + dur + '초): "이 사자성어/명언 뜻 아세요?" → 3초 멈춤 유도 → 정답 공개 → 현대 적용',
    compare: '한일 비교형 (' + dur + '초): 같은 주제 한국 명언 + 일본 명언 → 공통점·차이점 → 양국 문화 인사이트'
  };
  var ctaMap = {
    share: '"이 명언 꼭 저장해두세요. 힘들 때 꺼내 보시면 힘이 됩니다." — 저장 유도',
    question: '"여러분이 가장 좋아하는 사자성어나 명언은 무엇인가요? 댓글로 알려주세요!" — 댓글 폭발',
    series: '"다음 편엔 더 놀라운 사자성어를 준비했습니다. 구독 누르고 기다려주세요!"',
    apply: '"오늘 이 명언, 딱 한 번만 실천해보세요. 생각보다 쉽습니다." — 행동 유도'
  };
  var outNote = SA_OUT === 'k' ? '한국어로만 출력.' : SA_OUT === 'j' ? '일본어로만 출력.' : '두 언어 모두:\n=====일본어=====\n(일본어)\n=====한국어=====\n(한국어)';

  var sysLines = [
    '당신은 한국·일본 사자성어·명언 숏츠 전문 대본 작가입니다.',
    '시니어가 "이 말이 내 인생 얘기다"라고 눈물 흘리거나 즉시 저장하게 만드는 콘텐츠 전문가.',
    '',
    '【절대 규칙 — 반드시 준수】',
    '1. 출처 정확성: 잘못된 출처는 채널 신뢰도를 망칩니다. 불확실하면 "~에서 유래한" 표현 사용.',
    '2. 첫 문장 임팩트: 명언을 먼저 제시하고 "이 말의 진짜 뜻, 아세요?" 호기심 자극.',
    '3. 시니어 삶 연결 필수: 반드시 손자·건강·노년·가족으로 연결.',
    '4. Aon Pro: 줄 1개 = 씬 1개 = TTS 1호흡. 줄당 15~30자.',
    '5. 기억 문장 1개: 시청자가 화면 캡처하고 싶은 한 줄.',
    '6. 이미지: 동양화·먹그림·족자·서예 스타일 권장.',
    '',
    '【콘텐츠 타입】' + (typeMap[SA_TYPE] || typeMap.idiomatic),
    '【포맷】' + (fmtMap[SA_FMT] || fmtMap.short),
    '【CTA】' + (ctaMap[cta] || ctaMap.share),
    specific ? '【지정 명언】반드시 이 명언 사용: "' + specific + '"' : '',
    extra ? '【추가 지시】' + extra : '',
    '',
    outNote,
    '',
    '━━ 출력 형식 ━━',
    '###SCRIPT###',
    '(대본 전문 — 줄당 15~30자, 순수 텍스트)',
    '###IMAGE_PROMPTS###',
    '[씬1] Prompt: (영어 — 동양화/족자/먹그림 스타일)',
    '[씬2] Prompt: (영어)',
    '[씬3] Prompt: (영어)',
    '###YOUTUBE###',
    '제목 A안: (명언 인용형)',
    '제목 B안: (궁금증 유발형)',
    '제목 C안: (시니어 공감형)',
    '썸네일 텍스트: (명언 4~6글자)',
    '태그: (20개)',
    '댓글 유도 문구:',
    '숏츠 훅 3개:',
    '###SERIES_PLAN###',
    '"오늘의 명언" 시리즈 10편 기획안:',
    '(편당: 명언 + 핵심 감정 + 타겟 시청자)'
  ];
  var sys = sysLines.filter(function(l) { return l !== undefined; }).join('\n');
  var user = '주제/테마: ' + (topic || 'AI 최적 선택 — 시니어에게 가장 공감될 명언') + '\n' +
    '목표 길이: ' + dur + '초\n' + '정확한 출처. 감동적. 저장하고 싶은 대본. 순수 텍스트만.';

  document.getElementById('sa-genbtn').disabled = true;
  document.getElementById('sa-spinning').classList.add('on');
  try {
    var result = await callAPI(key, sys, user, 3500);
    if (SA_OUT !== 'k') result = postProcessOutputText(result, SA_OUT);
    var parsed = parseXResult(result);
    document.getElementById('sa-out').value = parsed.script || result;
    document.getElementById('sa-cnt').textContent = (parsed.script || result).split('\n').length + '줄';
    if (parsed.youtube) document.getElementById('sa-yt').textContent = parsed.youtube;
    if (parsed.series) document.getElementById('sa-ser').textContent = parsed.series;
    renderImgPrompts('sa-img-list', parsed.images);
    document.getElementById('sa-result').style.display = 'block';
    document.getElementById('sa-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch(e) {
    document.getElementById('sa-errbox').innerHTML = '오류: ' + e.message;
    document.getElementById('sa-errbox').classList.add('on');
  }
  document.getElementById('sa-genbtn').disabled = false;
  document.getElementById('sa-spinning').classList.remove('on');
}

// ─── 코믹·유머 생성 ───
async function genHumor() {
  var key = getApiKey();
  if (!key || !isAsciiOnly(key)) {
    var eb = document.getElementById('hm-errbox');
    apiKeyMissingToast(); eb.innerHTML = '⚠️ 설정에서 API 키를 입력해주세요'; eb.classList.add('on'); return;
  }
  document.getElementById('hm-errbox').classList.remove('on');
  var topic = document.getElementById('hm-topic').value.trim();
  var dur = document.getElementById('hm-dur').value;
  var struct = document.getElementById('hm-struct').value;
  var extra = document.getElementById('hm-extra').value.trim();
  var is19 = HM_AGE === '19';

  var typeMap = {
    daily: '일상 공감 개그 — 시니어 누구나 겪는 웃픈 상황. "맞아 맞아!" 공감 폭발.',
    generation: '세대 차이 — 할아버지/할머니 vs 스마트폰·손자. 두 세대 모두 웃음.',
    wordplay: '말장난·언어유희 — 한국어 동음이의어·이중 의미. 교양 있는 웃음.',
    reversal: '반전 개그 — 80%는 진지, 20%는 예상 못한 반전. 마지막 줄이 핵심.',
    black: '블랙 코미디 — 씁쓸하지만 웃긴 인생 아이러니. 자기희화화.',
    culture: '한일 문화 유머 — 두 나라 차이에서 친근한 웃음. 비하 없이 애정으로.',
    retro: '레트로 개그 — 70~80년대 소재. 그 시절 알면 더 웃긴 유머.',
    self: '자학·희화화 — 나이 드는 것 유쾌하게. 공감으로 위로.'
  };
  var structMap = {
    setup: '셋업-펀치라인: 상황 설정(70%) → 예상 깨는 펀치라인(30%). 펀치라인은 짧고 강하게.',
    triple: '3단 개그: 1번(약함) → 2번(조금) → 3번(빵 터짐). 점층 필수.',
    reversal: '반전형: 당연한 것 같다가 → 마지막에 "어?" 반전. 결말 전까지 힌트 없음.',
    callback: '콜백형: 초반 사소한 것이 → 끝에 다시 등장해 더 크게 웃김.'
  };
  var ageNote = is19
    ? ['【19금 — 유튜브 가이드라인 엄수】',
       '허용: 이중 의미·성적 암시·부부 은밀 유머·비명시적 성인 공감',
       '금지: 신체 부위 직접 명칭·성행위 직접 묘사·미성년자·혐오',
       '펀치라인은 듣는 사람이 스스로 연상하게. 직접 말 없이 이중 의미로.'].join('\n')
    : '【전체관람가】 남녀노소 함께. 특정 계층 비하 없이.';
  var outNote = HM_OUT === 'k' ? '한국어로만 출력.' : HM_OUT === 'j' ? '일본어로만 출력.' : '두 언어 모두:\n=====일본어=====\n(일본어)\n=====한국어=====\n(한국어)';

  var sysLines = [
    '당신은 한국·일본 시니어 채널 전문 코미디 작가입니다.',
    '개그 타이밍의 달인. 시청자가 무의식적으로 끝까지 보고 주변에 공유하는 대본 전문가.',
    '',
    '【코미디 작법 원칙 — 검증된 공식】',
    '1. Rule of 3: 세 번의 패턴 → 마지막에 반전. 인간 뇌는 3번째를 예상 → 뒤집으면 웃김.',
    '2. 타이밍: 펀치라인 앞에 1박자 멈춤(짧은 줄). 긴 설명 후 짧은 펀치라인.',
    '3. 공감 우선: "맞아 맞아!" 공감이 먼저. 억지 웃음 금지.',
    '4. 진지하게 설정: 과장 티 나면 웃음 죽음. 실제처럼 진지하게.',
    '5. Aon Pro: 줄당 15~30자. 대사는 [인물명] "대사" 형식.',
    '',
    '【유머 유형】' + (typeMap[HM_TYPE] || typeMap.daily),
    '【개그 구조】' + (structMap[struct] || structMap.setup),
    ageNote,
    '',
    outNote,
    '',
    '━━ 출력 형식 ━━',
    '###SCRIPT###',
    '(대본: 지문 + 대사 혼합. 자연스러운 구어체)',
    '###IMAGE_PROMPTS###',
    '[씬1] Prompt: (영어 — 웃긴 상황 일러스트/만화 스타일)',
    '[씬2] Prompt: (영어)',
    '###YOUTUBE###',
    '제목 A안:',
    '제목 B안:',
    '제목 C안:',
    '썸네일 텍스트: (웃긴 한 줄)',
    '태그: (20개)',
    '댓글 유도 문구: (비슷한 경험 공유)',
    '숏츠 훅 3개:'
  ];
  var sys = sysLines.join('\n');
  var user = '개그 주제: ' + (topic || 'AI가 이 유형에 가장 공감 폭발할 소재 자동 선택') + '\n' +
    '목표 길이: ' + dur + '초\n' + '등급: ' + (is19 ? '19금' : '전체관람가') + '\n' +
    (extra ? '추가 지시: ' + extra + '\n' : '') + '진짜로 웃긴 대본. 자연스러운 구어체.';

  document.getElementById('hm-genbtn').disabled = true;
  document.getElementById('hm-spinning').classList.add('on');
  try {
    var result = await callAPI(key, sys, user, 3000);
    if (HM_OUT !== 'k') result = postProcessOutputText(result, HM_OUT);
    var parsed = parseXResult(result);
    document.getElementById('hm-out').value = parsed.script || result;
    document.getElementById('hm-cnt').textContent = (parsed.script || result).split('\n').length + '줄';
    if (parsed.youtube) document.getElementById('hm-yt').textContent = parsed.youtube;
    renderImgPrompts('hm-img-list', parsed.images);
    document.getElementById('hm-result').style.display = 'block';
    document.getElementById('hm-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch(e) {
    document.getElementById('hm-errbox').innerHTML = '오류: ' + e.message;
    document.getElementById('hm-errbox').classList.add('on');
  }
  document.getElementById('hm-genbtn').disabled = false;
  document.getElementById('hm-spinning').classList.remove('on');
}
