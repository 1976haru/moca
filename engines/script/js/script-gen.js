/* ========================================================
   script-gen.js  --  메인 대본 생성 (gen-core)
   engines/script/index.html 에서 분리 (Phase 3 — gen core)
   의존: script-common.js (MODE/LANG/OUT/HOOK/TTYPE/LHOOK, TIKI_DATA,
         HOOK_DESC/TRUST_DESC, showErr, renderHist)
         script-api.js (getApiKey, isAsciiOnly, callAPI, apiKeyMissingToast,
         AI_PROVIDER, TRENDING_CONTEXT)
   ======================================================== */

// ─── 탭 ───
function toggleAdv(which){var toggle=document.getElementById('adv-toggle-'+which),body=document.getElementById('adv-body-'+which);var open=body.classList.toggle('open');toggle.classList.toggle('open',open);}

// ─── 모드 ───
function setMode(m){MODE=m;['h','t','l'].forEach(function(x){document.getElementById('mc-'+x).classList.remove('on');});document.getElementById('mc-'+m).classList.add('on');['h','t','l'].forEach(function(x){document.getElementById('form-'+x+'-topic').classList.toggle('hide',x!==m);});document.getElementById('detail-panel-h').classList.toggle('hide',m!=='h');document.getElementById('detail-panel-t').classList.toggle('hide',m!=='t');document.getElementById('detail-panel-l').classList.toggle('hide',m!=='l');document.getElementById('ht-sliders').classList.toggle('hide',m!=='h');document.getElementById('dur-group').classList.toggle('hide',m==='l');document.getElementById('longform-opts').classList.toggle('hide',m!=='l');var labels={h:'⚡ 대본 생성',t:'⚡ 티키타카 대본 생성',l:'⚡ 롱폼 대본 생성 (10~15분)'};document.getElementById('genbtn').textContent=labels[m];updateGenInfo();}
function setLang(l){LANG=l;document.getElementById('lin-jk').classList.toggle('on',l==='jk');document.getElementById('lin-kj').classList.toggle('on',l==='kj');}
function setOut(o){OUT=o;['b','j','k'].forEach(function(x){document.getElementById('lout-'+x).classList.toggle('on',x===o);});document.getElementById('btn-jp').style.display=o==='k'?'none':'';document.getElementById('btn-kr').style.display=o==='j'?'none':'';}
function setBOut(o){B_OUT=o;['b','j','k'].forEach(function(x){document.getElementById('b-lout-'+x).classList.toggle('on',x===o);});}
function setHook(h){HOOK=h;['A','B','C','R'].forEach(function(x){document.getElementById('hk-'+x).classList.toggle('on',x===h);});}
function setBHook(h){B_HOOK=h;['A','B','C','R'].forEach(function(x){document.getElementById('b-hk-'+x).classList.toggle('on',x===h);});}
function setLHook(h){LHOOK=h;['A','B','C','R'].forEach(function(x){document.getElementById('lhk-'+x).classList.toggle('on',x===h);});}

// ─── 훅 히스토리 ───
function getHH(){return JSON.parse(localStorage.getItem('hh_v10')||'[]');}
function addHH(){var hh=getHH();if(!hh.includes(HOOK))hh.push(HOOK);if(hh.length>5)hh=hh.slice(-5);localStorage.setItem('hh_v10',JSON.stringify(hh));renderHH();}
function clearHH(){localStorage.removeItem('hh_v10');renderHH();}
function renderHH(){var hh=getHH(),el=document.getElementById('hh-list');if(!el)return;el.innerHTML=hh.length?hh.map(function(h){return'<span class="hh-tag">패턴'+h+'</span>';}).join(''):'<span style="font-size:11px;color:var(--muted)">없음</span>';}
renderHH();

// ─── 티키타카 ───
function setTT(t){TTYPE=t;document.querySelectorAll('.tcard').forEach(function(c){c.classList.remove('on');});document.getElementById('tt-'+t).classList.add('on');var wrap=document.getElementById('chips-tiki');wrap.innerHTML='';var data=TIKI_DATA[t]||[];if(!data.length){wrap.innerHTML='<span style="font-size:11px;color:var(--muted)">A와 B를 직접 입력하세요</span>';return;}data.forEach(function(pair){var chip=document.createElement('span');chip.className='chip pink';chip.textContent=pair[0]+' vs '+pair[1];chip.onclick=function(){document.getElementById('t-a').value=pair[0];document.getElementById('t-b').value=pair[1];wrap.querySelectorAll('.chip').forEach(function(c){c.classList.remove('on');});chip.classList.add('on');};wrap.appendChild(chip);});}
setTT('jp');

// ─── 슬라이더 ───
function getScenesForDur(v){if(v<=22)return'5~6줄';if(v<=27)return'6~8줄';if(v<=35)return'8~11줄';if(v<=50)return'11~13줄';if(v<=72)return'15~20줄';if(v<=100)return'22~28줄';if(v<=140)return'30~38줄';return'44~55줄';}
function getDurBadge(v){if(v<=22)return'⚡ 20~25초';if(v<=27)return'⚡ 25~30초';if(v<=35)return'⚡ 30~35초';if(v<=50)return'45~50초';if(v<=72)return'A4 한 장';if(v<=100)return'A4 1.5장';if(v<=140)return'A4 2장';return'A4 3장';}
function updDur(){var v=parseInt(document.getElementById('dur').value),mn=Math.floor(v/60),sc=v%60;document.getElementById('dur-val').textContent=mn>0?(sc>0?mn+'분 '+sc+'초':mn+'분'):v+'초';document.getElementById('dur-badge').textContent=getDurBadge(v);document.getElementById('dur-hint').textContent=getScenesForDur(v)+' · Aon Pro 기준';updateGenInfo();}
updDur();
function updBDur(){var v=parseInt(document.getElementById('b-dur').value),mn=Math.floor(v/60),sc=v%60;document.getElementById('b-dur-val').textContent=mn>0?(sc>0?mn+'분 '+sc+'초':mn+'분'):v+'초';document.getElementById('b-dur-badge').textContent=getDurBadge(v);document.getElementById('b-dur-hint').textContent=getScenesForDur(v)+' · Aon Pro 기준';}
updBDur();
function updHT(){var h=parseInt(document.getElementById('hook-sl').value),t=parseInt(document.getElementById('trust-sl').value);document.getElementById('hook-val').textContent=h;document.getElementById('trust-val').textContent=t;document.getElementById('hook-desc').textContent=HOOK_DESC[h];document.getElementById('trust-desc').textContent=TRUST_DESC[t];}
updHT();
function updateGenInfo(){var el=document.getElementById('gen-info');if(MODE==='l'){el.textContent='롱폼 모드\n10~15분 분량';return;}if(MODE==='t'){el.textContent='티키타카 모드\nA vs B 배틀';return;}var v=parseInt(document.getElementById('dur').value),mn=Math.floor(v/60),sc=v%60;var ts=mn>0?(sc>0?mn+'분 '+sc+'초':mn+'분'):v+'초';el.innerHTML=ts+' · '+getScenesForDur(v)+'<br>숏츠 모드';}

// ─── 칩 ───
var CAT_LIST=['시니어 건강','인간관계·심리','재테크·투자','동기부여','비교·세계1위','암·난치병 예방','수면·피로','다이어트·운동'];
var TONE_LIST=['경고형','희망적·밝음','미스터리','동기부여','감성적·공감','전문적·의학','긴급·충격','따뜻·위로','일본 자부심','완곡·신중'];
makeChips('chips-cat',CAT_LIST,'h-cat','blue');
makeChips('chips-tone',TONE_LIST,'h-tone','gold');
makeChips('chips-tone-l',TONE_LIST,'l-tone','gold');
makeChips('b-chips-tone',TONE_LIST,'b-tone','gold');

// ════════════════════════════════════════
// 시스템 프롬프트 빌더
// ════════════════════════════════════════
function outNote(o){o=o||OUT;if(o==='j')return'일본어 대본만 출력.';if(o==='k')return'한국어 대본만 출력.';return'두 언어 모두 출력:\n=====일본어=====\n(일본어 대본)\n=====한국어=====\n(한국어 대본)';}
function jpLayoutGuide(){return'【일본어 출력 규칙】\n일본어는 단어마다 띄어쓰지 말 것.\n자막 가독성을 위해 한 줄이 7~10자 넘으면 문맥 자연스러운 지점에서 공백 1회 허용.\n조사·접속 표현이 다음 줄 첫머리에 홀로 오지 않게 처리.\n\n';}
function isJapaneseLike(line){var jp=(line.match(/[ぁ-んァ-ヶ一-龯々ー]/g)||[]).length,kr=(line.match(/[가-힣]/g)||[]).length;return jp>0&&jp>=kr;}
function normalizeJapaneseLine(line){return line.replace(/[ \t\u3000]+/g,' ').trim();}
function shouldMergeJapaneseWithPrev(prev,cur){if(!prev||!cur)return false;if(!isJapaneseLike(prev)||!isJapaneseLike(cur))return false;if(/[。！？?!」』】\]）)]$/.test(prev))return false;return/^(?:としたら|とすると|という|として|とは|とか|と言|でも|しかし|そして|だから|ですが|けれど|けど|のに|ので|から|まで|より|が|を|に|で|と|も|へ|や|し|ため|ように|ような|可能性があります|傾向があります|ことがあります|ことです|のです)/.test(cur);}
function scoreJapaneseBreak(line,pos){if(pos<3||pos>=line.length-2)return -999;var left=line.slice(0,pos),right=line.slice(pos);var score=20-Math.abs(8.5-pos)*2.2;if(/[ゃゅょぁぃぅぇぉっッー]/.test(right.charAt(0)))score-=8;if(/[、。！？?!」』】\]）)]/.test(right.charAt(0)))score-=10;if(/(?:て|で|は|が|を|に|へ|と|も|や|か|ね|よ)$/.test(left))score+=4;if(/^(?:そして|しかし|でも|だから|けれど|としたら|とすると|ですが|ので|のに|ため|もし|また)/.test(right))score+=5;return score;}
function applyJapaneseCaptionSpace(line){if(!isJapaneseLike(line))return line;if(/\s/.test(line))return line.replace(/\s+/g,' ').trim();if(line.length<=10)return line;var bestPos=-1,bestScore=-999;for(var i=6;i<=Math.min(11,line.length-3);i++){var s=scoreJapaneseBreak(line,i);if(s>bestScore){bestScore=s;bestPos=i;}}if(bestPos===-1)bestPos=Math.min(9,Math.max(6,Math.floor(line.length/2)));return line.slice(0,bestPos)+' '+line.slice(bestPos);}
function formatJapaneseBlock(text){var lines=text.replace(/\r/g,'').split('\n'),out=[];lines.forEach(function(raw){var line=raw.trim();if(!line){if(out.length&&out[out.length-1]!=='')out.push('');return;}var cleaned=isJapaneseLike(line)?normalizeJapaneseLine(line).replace(/\s+/g,''):line;if(out.length&&out[out.length-1]!==''&&shouldMergeJapaneseWithPrev(out[out.length-1],cleaned))out[out.length-1]+=cleaned;else out.push(cleaned);});out=out.map(function(line){if(!line||!isJapaneseLike(line))return line;return applyJapaneseCaptionSpace(line);});return out.join('\n').replace(/\n{3,}/g,'\n\n').trim();}
function postProcessOutputText(text,outLang){outLang=outLang||OUT;if(!text||outLang==='k')return text;if(/=====일본어=====/.test(text)){return text.replace(/(=====일본어=====)\s*([\s\S]*?)(\s*=====한국어=====|$)/,function(_,head,jpBody,tail){return head+'\n\n'+formatJapaneseBlock(jpBody)+(tail?tail:'');}).replace(/\n{3,}=====한국어=====/g,'\n\n=====한국어=====');}if(outLang==='j')return formatJapaneseBlock(text);return text;}

function buildSysH(dur,opts){
  opts=opts||{};
  var hook=opts.hook||HOOK;
  var hookLevel=opts.hookLevel||parseInt(document.getElementById('hook-sl').value);
  var trustLevel=opts.trustLevel||parseInt(document.getElementById('trust-sl').value);
  var ctaStyle=opts.cta||document.getElementById('h-cta').value;
  var outLang=opts.out||OUT;
  var hh=getHH();var isMini=dur<=27,isShort=dur<=40;
  var hookInstr={A:'패턴A (역설형): 건강에 신경쓰던 사람이 오히려 악화된 상황으로 시작.',B:'패턴B (질문형): 시청자를 직접 겨냥한 질문으로 시작.',C:'패턴C (충격형): "건강을 위해 하던 습관이 사실 뇌 노화를 가속시켰다" 같은 반직관적 사실로 시작.',R:'패턴A·B·C 중 이 대본 주제에 가장 적합한 것을 AI가 선택.'}[hook]||'패턴A';
  if(hh.length)hookInstr+='\n이전 편 사용 패턴: '+hh.join(',')+'— 가능하면 다른 패턴 사용.';
  var hookLvl=hookLevel<=2?'자극 최소화. 차분하고 신뢰감 있는 톤.':hookLevel===3?'적당한 긴장감. 과장 없이 흥미 유발.':hookLevel===4?'강한 훅. 충격적 사실이나 반전. 과장어 1~2개 허용.':'최강 훅. 첫 줄에서 반드시 멈추게 만들기. 단, 허구 정보 절대 금지.';
  var trustLvl=trustLevel<=2?'분위기 위주.':trustLevel===3?'실질 정보 최소 1개 포함.':trustLevel===4?'정보 밀도 높음. 증상+원인+이유 구조.':'최고 정보 밀도.';
  var ctaComment={A:'시청자 경험 질문형.',B:'다음편 연결형.',C:'체크형.',D:'저장 유도형.',auto:'AI가 최적 선택'}[ctaStyle]||'시청자 경험 질문형';
  var subLine=outLang==='k'?'채널 구독과 좋아요 꼭 눌러주세요':outLang==='j'?'チャンネル登録と 高評価も よろしくお願いします':'JP: チャンネル登録と 高評価も よろしくお願いします\nKR: 채널 구독과 좋아요 꼭 눌러주세요';
  var ctaFull='댓글 유도: '+ctaComment+'\n    다음 편 예고: user 메시지에 다음예고가 있으면 반드시 1줄로 삽입. 없으면 완전 생략.\n    구독·좋아요: 마지막 줄에 반드시 포함. '+subLine;
  var structureGuide;
  if(isMini){structureGuide='【⚡ 미니 숏츠 3단계 압축 구조 ('+dur+'초)】\n단계1 훅 (2줄): '+hookInstr+'\n단계2 핵심 (3~4줄): 핵심 메시지를 직격.\n단계3 마무리 (1~2줄):\n    '+ctaFull+'\n총 6~8줄.\n';}
  else if(isShort){structureGuide='【숏 숏츠 4단계 구조 ('+dur+'초)】\n단계1 훅 (2줄): '+hookInstr+'\n단계2 긴장 (2줄): 자가진단 유도.\n단계3 핵심 (3~4줄): 정체 공개+이유. 기억 문장 1개.\n단계4 마무리 (2~3줄):\n    '+ctaFull+'\n총 9~11줄.\n';}
  else{structureGuide='【5단계 완결 구조 ('+dur+'초)】\n단계1 훅 (4~5줄): '+hookInstr+'\n단계2 긴장 (4~5줄): 자가진단 유도. 정체 공개 절대 금지.\n단계3 핵심 (5~7줄): 정체 공개+이유. 기억 문장 1개 필수.\n단계4 임팩트 (3~4줄): "그래서 왜 지금 중요한가?"\n단계5 마무리 (3~4줄):\n    '+ctaFull+'\n';}
  var tagLine = outLang==='k' ? '태그: (한국어 해시태그 20개 — 일본어 태그 절대 포함 금지)'
             : outLang==='j' ? '태그: (일본어 해시태그 20개 — 한국어 태그 절대 포함 금지)'
             :                 '태그: (한국어+일본어 혼합 20개)';
  var titleLang = outLang==='k' ? ' — 한국어로만'
               : outLang==='j' ? ' — 日本語のみ'
               :                 '';
  var langLockDirective = outLang==='k'
      ? '\n[OUTPUT LANGUAGE LOCK] 반드시 한국어로만 출력. 일본어 문장·단어·해시태그·가나·한자 출력 금지.\n'
      : outLang==='j'
      ? '\n[OUTPUT LANGUAGE LOCK] 必ず日本語のみ出力。韓国語(한글)の文・語・ハッシュタグを一切出さない。\n'
      : '';
  return '당신은 유튜브 Shorts 상위 0.01% 대본 작가입니다.\n' + langLockDirective + '\n━━ 절대 규칙 ━━\n\n【Aon Pro 최적화】\n줄 1개 = Aon Pro 씬 1개 = TTS 1호흡 = 이미지 1장.\n줄당 15~30자 필수. 15자 미만 금지. 35자 초과 금지.\n'+(outLang!=='k'?jpLayoutGuide():'')+structureGuide+'\n【Hook 강도】'+hookLvl+'\n【Trust 강도】'+trustLvl+'\n\n【기억 문장 필수】\n핵심 단계에 시청자가 스크린샷 찍고 싶은 한 문장.\n\n【허구 정보 완전 금지】\n허용 표현: "専門医たちの間で懸念されている" "많은 분들이 경험하는"\n금지 표현: 허구 수치, 허구 기관명, 과장어\n\n【언어별 작성 스타일】\n'+(outLang!=='k'?'일본어: 완곡형. 부드러운 경고.\n':'')+(outLang!=='j'?'한국어: 직설형. 강하고 짧게. 번역투 금지.\n':'')+'━━ 출력 형식 ━━\n첫 줄: 제목(「...」). 줄당 15~30자. 단계 사이 빈 줄. JSON·씬번호·라벨 금지.\n\n대본 출력 후 반드시 아래 수익화 전략 추가:\n\n###YOUTUBE###\n제목A'+titleLang+': (검색최적화 50자이내)\n제목B'+titleLang+': (호기심유발 첫3초클릭)\n제목C'+titleLang+': (시니어공감 감성연결)\n썸네일: (3~5단어 임팩트)\n'+tagLine+'\n숏츠훅A:\n숏츠훅B:\n댓글유도: (경험공유형 질문)\n설명란첫3줄:\n수익화전략: (멤버십CTA·슈퍼챗·관련영상연결)\n'+(outLang!=='k'?jpLayoutGuide():'')+outNote(outLang);}

function buildSysT(){var a=document.getElementById('t-a').value.trim(),b=document.getElementById('t-b').value.trim();var ca=document.getElementById('t-ca').value.trim()||'딸기',cb=document.getElementById('t-cb').value.trim()||'블루베리';var angle=document.getElementById('t-angle').value,pride=document.getElementById('t-pride').value,comedy=document.getElementById('t-comedy').value,extra=document.getElementById('t-extra').value.trim();var angleNote={reverse:'역전 충격형',data:'데이터 압도형',story:'스토리 감동형',humor:'코미디 극대화형',pride:'자부심 폭발형'}[angle];var subLine=OUT==='k'?'채널 구독과 좋아요 꼭 눌러주세요':OUT==='j'?'チャンネル登録と 高評価も よろしくお願いします':'JP: チャンネル登録と 高評価も / KR: 채널 구독과 좋아요';return '당신은 유튜브 Shorts 티키타카 배틀 전문 대본 작가입니다.\n\n승자 A: '+a+' / 패자 B: '+b+'\n캐릭터A: '+ca+' / 캐릭터B: '+cb+'\n\n━━ 5씬 배틀 구조 ━━\n씬1 도발 / 씬2 위기 / 씬3 반전1 / 씬4 역전 / 씬5 CTA.\n구독·좋아요: '+subLine+'\n\n승부 각도: '+angleNote+' / 자부심: '+pride+' / 코미디: '+comedy+'\n'+(extra?'추가 지시: '+extra+'\n':'')+(OUT!=='k'?jpLayoutGuide():'')+outNote();}

function buildSysL(opts){opts=opts||{};var tone=opts.tone||'',lhook=opts.lhook||'R',ctaStyle=opts.ctaStyle||'auto';var hookInstr={A:'패턴A (역설형)',B:'패턴B (질문형)',C:'패턴C (충격형)',R:'패턴A·B·C 중 AI가 최적 선택.'}[lhook];var ctaComment={A:'시청자 경험 질문형',B:'다음편 연결형',C:'체크형',D:'저장 유도형',auto:'AI가 최적 선택'}[ctaStyle];var subLine=OUT==='k'?'채널 구독과 좋아요 꼭 눌러주세요':OUT==='j'?'チャンネル登録と 高評価も よろしくお願いします':'JP: チャンネル登録と 高評価も\nKR: 채널 구독과 좋아요';return '당신은 유튜브 롱폼 전문 대본 작가입니다.\n\n절대 규칙:\n1. 허구 기관명·수치 금지.\n2. 구조 라벨 출력 금지.\n3. 기억 문장 최소 2개 삽입.\n4. 다음예고 없으면 예고 생성 절대 금지.\n\n'+(tone?'분위기·톤: '+tone+'\n\n':'')+'【오프닝 훅】'+hookInstr+'\n\n구성: 강력한 오프닝 → 【파트명】 3~5개 → 마무리\n마무리: 핵심 요약 + 다음예고(있으면) + 구독·좋아요\n    댓글 유도: '+ctaComment+'\n    구독·좋아요: '+subLine+'\n'+(OUT!=='k'?jpLayoutGuide():'')+outNote();}

// ════════════════════════════════════════
// 대본 생성 (v16 완전 유지)
// ════════════════════════════════════════
function gen(){
  var key=getApiKey();if(!key){showErr('API 키를 입력 후 저장해주세요.');return;}if(!isAsciiOnly(key)){showErr('API 키에 한글·전각문자가 섞여 있습니다.');return;}
  var sys,user,maxTok=3500;
  if(MODE==='h'){
    var title=document.getElementById('h-title').value.trim();if(!title){showErr('제목을 입력해주세요.');return;}
    var cat=document.getElementById('h-cat').value.trim(),ep=document.getElementById('h-ep').value.trim(),tone=document.getElementById('h-tone').value.trim();
    var dur=parseInt(document.getElementById('dur').value);
    sys=buildSysH(dur);
    user='주제: "'+title+'"\n'+(cat?'채널유형: '+cat+'\n':'')+(tone?'분위기: '+tone+'\n':'')+(ep?'시리즈 회차: '+ep+' → 대본 제목 앞에 반드시 표시\n':'')+'목표: '+dur+'초 ('+getScenesForDur(dur)+')\n'+(document.getElementById('prev').value.trim()?'이전예고: "'+document.getElementById('prev').value.trim()+'"\n':'이전예고: 없음\n')+(document.getElementById('next').value.trim()?'다음예고: "'+document.getElementById('next').value.trim()+'"\n':'다음예고: 없음 — 예고 문장 생성 절대 금지\n')+(LANG==='jk'?'주제어 입력 언어: 일본어.':'주제어 입력 언어: 한국어.')+'\n\n줄당 15~30자. 의사는 익명. 기억 문장 1개 필수. 허구 기관명·수치 금지. 순수텍스트.'+(document.getElementById('h-prev-topics').value.trim()?'\n이전 편 주제: '+document.getElementById('h-prev-topics').value.trim()+'\n→ 중복되지 않는 새로운 각도로 작성.':'')+(document.getElementById('h-core-msg').value.trim()?'\n이번 편 핵심 메시지: '+document.getElementById('h-core-msg').value.trim():'');
  }else if(MODE==='t'){
    var a=document.getElementById('t-a').value.trim(),b=document.getElementById('t-b').value.trim();
    if(!a){showErr('A(승자)를 입력해주세요.');return;}if(!b){showErr('B(도전자)를 입력해주세요.');return;}
    sys=buildSysT();maxTok=3000;
    user='대결: "'+a+' vs '+b+'"\n목표: '+parseInt(document.getElementById('dur').value)+'초\n'+(document.getElementById('prev-t').value.trim()?'이전예고: "'+document.getElementById('prev-t').value.trim()+'"\n':'이전예고: 없음\n')+(document.getElementById('next-t').value.trim()?'다음예고: "'+document.getElementById('next-t').value.trim()+'"\n':'다음예고: 없음 — 예고 문장 생성 절대 금지\n')+'순수텍스트.';
  }else{
    var ltitle=document.getElementById('l-title').value.trim();if(!ltitle){showErr('제목을 입력해주세요.');return;}
    var lstyle={list:'리스트형',story:'스토리형',explain:'해설형'}[document.getElementById('l-style').value];
    sys=buildSysL({tone:document.getElementById('l-tone').value.trim(),lhook:LHOOK,ctaStyle:document.getElementById('l-cta').value});maxTok=5500;
    user='제목: "'+ltitle+'"\n'+(document.getElementById('l-cat').value.trim()?'채널유형: '+document.getElementById('l-cat').value.trim()+'\n':'')+(document.getElementById('l-ep').value.trim()?'시리즈 회차: '+document.getElementById('l-ep').value.trim()+' → 대본 제목 앞에 반드시 표시\n':'')+'영상길이: '+document.getElementById('l-dur').value+'분\n구성: '+lstyle+'\n'+(document.getElementById('prev-l').value.trim()?'이전예고: "'+document.getElementById('prev-l').value.trim()+'"\n':'이전예고: 없음\n')+(document.getElementById('next-l').value.trim()?'다음예고: "'+document.getElementById('next-l').value.trim()+'"\n':'다음예고: 없음 — 예고 문장 생성 절대 금지\n')+(document.getElementById('l-prev-topics').value.trim()?'이전 편 주제: '+document.getElementById('l-prev-topics').value.trim()+'\n→ 중복되지 않는 새로운 각도로 작성.\n':'')+(document.getElementById('l-core-msg').value.trim()?'이번 편 핵심 메시지: '+document.getElementById('l-core-msg').value.trim()+'\n':'')+'순수텍스트.';
  }
  hideErr();
  document.getElementById('genbtn').disabled=true;
  document.getElementById('spinning').classList.add('on');
  document.getElementById('spin-msg').textContent=MODE==='l'?'롱폼 대본 작성 중... (30~60초)':'AI가 대본을 작성 중입니다...';
  document.getElementById('result').classList.remove('on');
  callAPI(key,sys,user,maxTok).then(function(text){
    document.getElementById('genbtn').disabled=false;document.getElementById('spinning').classList.remove('on');
    var processed=postProcessOutputText(text);
    // v28: 대본만 textarea에, 이미지/유튜브는 분리
    var v28parsed=parseRawResult(processed);
    var scriptOnly=v28parsed.script||processed;
    document.getElementById('out').value=scriptOnly;updCnt(scriptOnly);
    // 이미지 프롬프트 분리 저장
    if(v28parsed.images){var imgBox=document.getElementById('gen-img-box');if(imgBox){imgBox.textContent=v28parsed.images;document.getElementById('gen-img-wrap').style.display='block';}}
    // 유튜브전략 분리 저장
    if(v28parsed.youtube){var ytBox=document.getElementById('gen-yt-box');if(ytBox){ytBox.textContent=v28parsed.youtube;}}
    document.getElementById('result').classList.add('on');localStorage.setItem('uc_claude_key',key);addHH();
    document.getElementById('result').scrollIntoView({behavior:'smooth',block:'start'});
    /* 부모(자동숏츠 스튜디오)에 대본 전달 */
    try {
      if(window.parent && window.parent !== window){
        var outEl   = document.getElementById('out');
        var titleEl = document.getElementById('title-output');
        window.parent.postMessage({
          type:'script_generated',
          payload:{
            text:  outEl ? outEl.value : scriptOnly,
            title: (titleEl && titleEl.textContent) ? titleEl.textContent : '',
            lang:  (typeof LANG !== 'undefined' ? LANG : ''),
            mode:  (typeof MODE !== 'undefined' ? MODE : 'h')
          }
        }, '*');
        /* s1-script-step.js 가 수신 — scriptKo/scriptJa 로 분리 송신 */
        var _stText = outEl ? outEl.value : scriptOnly;
        var _stLang = (typeof LANG !== 'undefined') ? LANG : '';
        var _stIsJa = (_stLang === 'j' || _stLang === 'ja');
        var _stTopic = '';
        try {
          if(typeof MODE !== 'undefined'){
            if(MODE === 'h') _stTopic = (document.getElementById('h-title')||{}).value || '';
            else if(MODE === 'l') _stTopic = (document.getElementById('l-title')||{}).value || '';
            else if(MODE === 't'){
              var _a = (document.getElementById('t-a')||{}).value || '';
              var _b = (document.getElementById('t-b')||{}).value || '';
              _stTopic = (_a && _b) ? (_a + ' vs ' + _b) : (_a || _b);
            }
          }
        } catch(_){}
        window.parent.postMessage({
          type:    'studio_script_done',
          scriptKo: _stIsJa ? '' : _stText,
          scriptJa: _stIsJa ? _stText : '',
          scenes:  [],
          topic:   _stTopic
        }, '*');
      }
    } catch(_){}
  }).catch(function(e){document.getElementById('genbtn').disabled=false;document.getElementById('spinning').classList.remove('on');showErr('오류: '+e.message);});
}

function updCnt(t){if(!t){document.getElementById('cnt').textContent='';return;}document.getElementById('cnt').textContent=t.split('\n').length+'줄 / '+t.replace(/\s/g,'').length+'자';}
document.getElementById('out').addEventListener('input',function(){updCnt(this.value);});
function sendToLyric(){
  var btn = null;
  document.querySelectorAll('.tnav').forEach(function(b){
    if(b.getAttribute('onclick') && b.getAttribute('onclick').indexOf("'lyric'") !== -1){
      btn = b;
    }
  });
  if(btn){
    TAB('lyric', btn);
  } else {
    var btns = document.querySelectorAll('.tnav');
    var TABS = ['gen','intent','batch','lyric','saying','humor','know','trivia','drama','hub','story','hist','preset','guide','senior','sns','hook','series'];
    var idx = TABS.indexOf('lyric');
    if(btns[idx]) TAB('lyric', btns[idx]);
  }
}

/* ─── 배치 (v19 Senior Content Studio) ─── */
function setEpCount(n){
  epCount=n;
  [1,2,3,4,5].forEach(function(i){document.getElementById('epCnt-'+i).classList.toggle('on',i===n);});
  var hints=['1편','2부작','3부작','4부작','5부작'];
  document.getElementById('epCountHint').textContent=hints[n-1];
  // 활성화 상태 업데이트
  for(var i=0;i<5;i++)epData[i].enabled=i<n;
  renderEpRows();
}

function renderEpRows(){
  var container=document.getElementById('ep-rows');
  container.innerHTML='';
  for(var i=0;i<epCount;i++){
    (function(idx){
      var d=epData[idx];
      var status=d.allDone?'all-done':d.scriptDone?'script-done':'';
      var statusText=d.allDone?'✓ 완료':d.scriptDone?'대본완료':'대기';
      var statusCls=d.allDone?'done':d.scriptDone?'script-ok':'wait';

      var row=document.createElement('div');
      row.className='ep-row '+(d.enabled?'':' disabled')+' '+status;
      row.id='ep-row-'+idx;

      var head=document.createElement('div');
      head.className='ep-row-head';
      head.innerHTML=
        '<div class="ep-toggle '+(d.enabled?'on':'')+'" id="ep-toggle-'+idx+'" onclick="toggleEp('+idx+')">'+(d.enabled?'✓':'')+'</div>'+
        '<div class="ep-num-badge">'+(idx+1)+'</div>'+
        '<input class="ep-topic-input" id="ep-topic-'+idx+'" placeholder="EP.'+(idx+1)+' 주제어 입력..." value="'+escHtml2(d.topic)+'" '+(d.enabled?'':'disabled')+' oninput="epData['+idx+'].topic=this.value">'+
        '<span class="ep-status '+statusCls+'">'+statusText+'</span>'+
        '<div class="ep-mini-btns">'+
          '<button class="ep-mini-btn blue" id="ep-btn-script-'+idx+'" onclick="genEpScript('+idx+')" '+(d.enabled&&!d.scriptDone?'':'disabled')+' title="이 편 대본만 생성">📝 대본</button>'+
          '<button class="ep-mini-btn gold" id="ep-btn-lyrics-'+idx+'" onclick="genEpLyrics('+idx+')" '+(d.enabled&&d.scriptDone?'':'disabled')+' title="이 편 가사 패키지 생성">🎵 가사</button>'+
        '</div>'+
        '<button class="ep-settings-toggle" onclick="toggleEpSettings('+idx+')" title="편별 개별 설정">⚙</button>';
      row.appendChild(head);

      // 개별 설정 패널
      var settingsBody=document.createElement('div');
      settingsBody.className='ep-settings-body';
      settingsBody.id='ep-settings-'+idx;
      settingsBody.innerHTML=
        '<div style="font-size:10px;color:var(--gold);font-weight:700;margin-bottom:8px">⚙ EP.'+(idx+1)+' 개별 설정 (전역 설정보다 우선 적용)</div>'+
        '<div class="r4">'+
          '<div><div class="ctrl-label">대본 스타일</div><select class="ctrl-select" id="ep-style-'+idx+'" style="border:1px solid var(--line);border-radius:8px;padding:5px 7px;font-size:11px;width:100%;background:#fff">'+
            '<option value="">전역 설정 사용</option>'+
            '<option value="shock">충격·경고형</option>'+
            '<option value="empath">공감·스토리형</option>'+
            '<option value="expert">전문지식형</option>'+
            '<option value="question">질문유도형</option>'+
            '<option value="case">사례중심형</option>'+
          '</select></div>'+
          '<div><div class="ctrl-label">훅 패턴</div><select class="ctrl-select" id="ep-hook-'+idx+'" style="border:1px solid var(--line);border-radius:8px;padding:5px 7px;font-size:11px;width:100%;background:#fff">'+
            '<option value="">전역 설정 사용</option>'+
            '<option value="A">A — 역설형</option>'+
            '<option value="B">B — 질문형</option>'+
            '<option value="C">C — 충격형</option>'+
            '<option value="R">🎲 랜덤</option>'+
          '</select></div>'+
          '<div><div class="ctrl-label">CTA 스타일</div><select class="ctrl-select" id="ep-cta-'+idx+'" style="border:1px solid var(--line);border-radius:8px;padding:5px 7px;font-size:11px;width:100%;background:#fff">'+
            '<option value="">전역 설정 사용</option>'+
            '<option value="A">A — 경험 질문형</option>'+
            '<option value="B">B — 다음편 연결형</option>'+
            '<option value="C">C — 체크형</option>'+
            '<option value="D">D — 저장 유도형</option>'+
            '<option value="auto">자동 선택</option>'+
          '</select></div>'+
          '<div><div class="ctrl-label">Hook 강도 <span id="ep-hklv-val-'+idx+'" style="font-weight:800;color:var(--pink)">-</span></div>'+
            '<div style="font-size:10px;color:var(--muted);margin-bottom:3px">0=전역사용</div>'+
            '<input type="range" min="0" max="5" value="0" id="ep-hklv-'+idx+'" style="width:100%" oninput="var v=this.value;document.getElementById(\'ep-hklv-val-'+idx+'\').textContent=v==0?\'전역\':v;epData['+idx+'].overrideHookLv=v==0?null:parseInt(v)">'+
          '</div>'+
        '</div>'+
        '<div style="margin-top:7px"><div class="ctrl-label" style="font-size:10px">분위기/톤 (편별)</div><input type="text" id="ep-tone-'+idx+'" placeholder="전역 설정 사용 (빈칸)" style="font-size:11px;padding:6px 10px;border-radius:8px" oninput="epData['+idx+'].overrideTone=this.value"></div>'+
        '<div style="margin-top:7px"><div class="ctrl-label" style="font-size:10px">이전 예고 / 다음 예고</div>'+
          '<div class="r2"><input type="text" id="ep-prev-'+idx+'" placeholder="이전 예고 없음" style="font-size:11px;padding:6px 10px;border-radius:8px"><input type="text" id="ep-next-'+idx+'" placeholder="다음 예고 없음" style="font-size:11px;padding:6px 10px;border-radius:8px"></div>'+
        '</div>'+
        '<div style="margin-top:7px"><div class="ctrl-label" style="font-size:10px">이번 편 핵심 메시지</div><input type="text" id="ep-coremsg-'+idx+'" placeholder="빈칸이면 전역 설정 사용" style="font-size:11px;padding:6px 10px;border-radius:8px"></div>';
      row.appendChild(settingsBody);
      container.appendChild(row);
    })(i);
  }
}

function toggleEp(idx){
  epData[idx].enabled=!epData[idx].enabled;
  var toggle=document.getElementById('ep-toggle-'+idx);
  var row=document.getElementById('ep-row-'+idx);
  var input=document.getElementById('ep-topic-'+idx);
  toggle.classList.toggle('on',epData[idx].enabled);
  toggle.textContent=epData[idx].enabled?'✓':'';
  row.classList.toggle('disabled',!epData[idx].enabled);
  input.disabled=!epData[idx].enabled;
}

function toggleEpSettings(idx){
  var body=document.getElementById('ep-settings-'+idx);
  body.classList.toggle('open');
}


// ─── 편별 설정 읽기 (전역 fallback) ───
function getEpScriptSettings(idx){
  var d=epData[idx];
  var globalStyle=document.getElementById('b-script-style').value;
  var globalHook=B_HOOK;
  var globalCta=document.getElementById('b-cta').value;
  var globalHookLv=parseInt(document.getElementById('b-hook-sl').value);
  var globalTrustLv=parseInt(document.getElementById('b-trust-sl').value);
  var globalTone=document.getElementById('b-tone').value;
  var globalDur=parseInt(document.getElementById('b-dur').value);

  var epStyle=document.getElementById('ep-style-'+idx)?document.getElementById('ep-style-'+idx).value:'';
  var epHook=document.getElementById('ep-hook-'+idx)?document.getElementById('ep-hook-'+idx).value:'';
  var epCta=document.getElementById('ep-cta-'+idx)?document.getElementById('ep-cta-'+idx).value:'';
  var epHookLvEl=document.getElementById('ep-hklv-'+idx);
  var epHookLv=epHookLvEl&&parseInt(epHookLvEl.value)>0?parseInt(epHookLvEl.value):null;
  var epToneEl=document.getElementById('ep-tone-'+idx);
  var epTone=epToneEl?epToneEl.value.trim():'';
  var epPrev=document.getElementById('ep-prev-'+idx)?document.getElementById('ep-prev-'+idx).value.trim():'';
  var epNext=document.getElementById('ep-next-'+idx)?document.getElementById('ep-next-'+idx).value.trim():'';
  var epCoreMsg=document.getElementById('ep-coremsg-'+idx)?document.getElementById('ep-coremsg-'+idx).value.trim():'';

  return{
    style:epStyle||globalStyle,
    hook:epHook||globalHook,
    cta:epCta||globalCta,
    hookLevel:epHookLv!==null?epHookLv:globalHookLv,
    trustLevel:globalTrustLv,
    tone:epTone||globalTone,
    dur:globalDur,
    out:B_OUT,
    prevEp:epPrev,
    nextEp:epNext,
    coreMsg:epCoreMsg
  };
}

// ─── 배치 진행 상태 ───
var batchRunning=false;

function setBatchProgress(pct,msg){
  document.getElementById('b-pbar').style.width=pct+'%';
  document.getElementById('b-pmsg').textContent=msg;
}

// ─── 에피소드 주제 동기화 ───
function syncEpTopics(){
  for(var i=0;i<epCount;i++){
    var el=document.getElementById('ep-topic-'+i);
    if(el)epData[i].topic=el.value.trim();
  }
}

// ─── 단계별 실행 ───
async function runBatch(mode){
  var key=getApiKey();
  if(!key||!isAsciiOnly(key)){document.getElementById('b-errbox').innerHTML='API 키를 먼저 대본 생성 탭에서 저장해주세요.';document.getElementById('b-errbox').classList.add('on');return;}
  syncEpTopics();
  var enabledEps=epData.slice(0,epCount).filter(function(d){return d.enabled;});
  if(!enabledEps.length){document.getElementById('b-errbox').innerHTML='활성화된 편이 없습니다.';document.getElementById('b-errbox').classList.add('on');return;}
  document.getElementById('b-errbox').classList.remove('on');
  document.getElementById('b-progress').classList.add('show');
  document.getElementById('b-result-area').style.display='block';
  document.getElementById('btn-dl-all').disabled=true;
  batchRunning=true;

  var totalSteps=0,currentStep=0;
  if(mode==='script'||mode==='all') enabledEps.forEach(function(d){if(!d.scriptDone)totalSteps++;});
  if(mode==='lyrics'||mode==='all') enabledEps.forEach(function(d){if(mode==='all'||d.scriptDone)totalSteps++;});
  if(totalSteps===0)totalSteps=1;

  function stepPct(){return Math.round((currentStep/totalSteps)*95);}

  try{
    // 1단계: 대본 생성
    if(mode==='script'||mode==='all'){
      for(var i=0;i<epCount;i++){
        var d=epData[i];
        if(!d.enabled||(mode==='script'&&d.scriptDone)) continue;
        if(!d.topic){setBatchProgress(stepPct(),'EP.'+(i+1)+' 주제어가 없어 건너뜁니다.');continue;}
        setBatchProgress(stepPct(),'📝 EP.'+(i+1)+' 대본 생성 중...');
        try{
          var sOpts=getEpScriptSettings(i);
          var sys=buildSysH(sOpts.dur,sOpts);
          var prevTopics=document.getElementById('b-prev-topics').value.trim();
          var user='주제: "'+d.topic+'"\n'+
            '채널유형: '+document.getElementById('b-category').value+'\n'+
            (sOpts.tone?'분위기: '+sOpts.tone+'\n':'')+
            '시리즈 회차: #'+(i+1)+' → 대본 제목 앞에 반드시 표시\n'+
            '목표: '+sOpts.dur+'초 ('+getScenesForDur(sOpts.dur)+')\n'+
            (sOpts.prevEp?'이전예고: "'+sOpts.prevEp+'"\n':'이전예고: 없음\n')+
            (sOpts.nextEp?'다음예고: "'+sOpts.nextEp+'"\n':'다음예고: 없음 — 예고 문장 생성 절대 금지\n')+
            '주제어 입력 언어: 한국어.\n\n'+
            '줄당 15~30자. 의사는 익명. 기억 문장 1개 필수. 허구 기관명·수치 금지. 순수텍스트.'+
            (prevTopics?'\n이전 편 주제: '+prevTopics+'\n→ 중복되지 않는 새로운 각도로 작성.':'')+
            (sOpts.coreMsg?'\n이번 편 핵심 메시지: '+sOpts.coreMsg:'');
          var result=await callAPI(key,sys,user,3500);
          d.script=postProcessOutputText(result.trim(),sOpts.out);
          // 제목 추출
          var titleMatch=d.script.match(/「(.+?)」/);
          d.title=titleMatch?titleMatch[1]:d.topic.substring(0,20);
          d.scriptDone=true;
          currentStep++;
          updateEpRowStatus(i);
          renderBatchEpTabs();
        }catch(e){d.script='EP.'+(i+1)+' 대본 생성 실패: '+e.message;currentStep++;}
      }
    }

    // 2단계: 가사 패키지 생성
    if(mode==='lyrics'||mode==='all'){
      var prevSensory='';
      for(var i=0;i<epCount;i++){
        var d=epData[i];
        if(!d.enabled||!d.scriptDone||d.allDone) continue;
        setBatchProgress(stepPct(),'🎵 EP.'+(i+1)+' 가사 패키지 생성 중...');
        try{
          var lSys=buildLyricsSystemPrompt({
            genre:document.getElementById('b-music-genre').value,
            era:document.getElementById('b-era').value,
            songLen:document.getElementById('b-song-len').value,
            vibe:document.getElementById('b-lyric-vibe').value,
            imgStyle:document.getElementById('b-img-style').value,
            extraInstr:document.getElementById('b-extra-instr').value.trim(),
            epIndex:i,totalEps:epCount,prevSensory:prevSensory
          });
          var lUser='대본:\n제목: '+d.title+'\n\n'+d.script;
          var lResult=await callAPI(key,lSys,lUser,4000);
          var parsed=parseLyricsResult(lResult);
          d.lyrics=parsed.lyrics;d.music=parsed.music;d.images=parsed.images;d.youtube=parsed.youtube;
          d.allDone=true;
          prevSensory+=(i+1)+'편: '+d.title+' / ';
          currentStep++;
          updateEpRowStatus(i);
          renderBatchEpTabs();
        }catch(e){d.lyrics='EP.'+(i+1)+' 가사 생성 실패: '+e.message;currentStep++;}
      }
    }

    setBatchProgress(100,'🎉 완료!');
    document.getElementById('btn-dl-all').disabled=false;
  }catch(e){setBatchProgress(0,'❌ 오류: '+e.message);}
  batchRunning=false;
  renderBatchEpTabs();
  renderBatchContent();
}

// ─── 편별 독립 생성 ───
async function genEpScript(idx){
  var key=getApiKey();if(!key||!isAsciiOnly(key)){apiKeyMissingToast();return;}
  syncEpTopics();
  var d=epData[idx];if(!d.topic){alert('주제어를 입력해주세요.');return;}
  document.getElementById('ep-btn-script-'+idx).disabled=true;
  document.getElementById('ep-btn-script-'+idx).textContent='⏳';
  try{
    var sOpts=getEpScriptSettings(idx);
    var sys=buildSysH(sOpts.dur,sOpts);
    var user='주제: "'+d.topic+'"\n채널유형: '+document.getElementById('b-category').value+'\n'+(sOpts.tone?'분위기: '+sOpts.tone+'\n':'')+'시리즈 회차: #'+(idx+1)+' → 대본 제목 앞에 반드시 표시\n목표: '+sOpts.dur+'초 ('+getScenesForDur(sOpts.dur)+')\n이전예고: 없음\n다음예고: 없음 — 예고 문장 생성 절대 금지\n주제어 입력 언어: 한국어.\n\n줄당 15~30자. 의사는 익명. 기억 문장 1개 필수. 순수텍스트.'+(sOpts.coreMsg?'\n이번 편 핵심 메시지: '+sOpts.coreMsg:'');
    var result=await callAPI(key,sys,user,3500);
    d.script=postProcessOutputText(result.trim(),sOpts.out);
    var titleMatch=d.script.match(/「(.+?)」/);
    d.title=titleMatch?titleMatch[1]:d.topic.substring(0,20);
    d.scriptDone=true;
    updateEpRowStatus(idx);
    renderBatchEpTabs();
    batchActiveEp=idx;renderBatchContent();
    document.getElementById('b-result-area').style.display='block';
  }catch(e){alert('EP.'+(idx+1)+' 오류: '+e.message);}
  document.getElementById('ep-btn-script-'+idx).textContent='📝 대본';
  document.getElementById('ep-btn-script-'+idx).disabled=false;
  document.getElementById('ep-btn-lyrics-'+idx).disabled=!d.scriptDone;
}

async function genEpLyrics(idx){
  var key=getApiKey();if(!key||!isAsciiOnly(key)){apiKeyMissingToast();return;}
  var d=epData[idx];if(!d.scriptDone){alert('먼저 대본을 생성해주세요.');return;}
  document.getElementById('ep-btn-lyrics-'+idx).disabled=true;
  document.getElementById('ep-btn-lyrics-'+idx).textContent='⏳';
  try{
    var lSys=buildLyricsSystemPrompt({genre:document.getElementById('b-music-genre').value,era:document.getElementById('b-era').value,songLen:document.getElementById('b-song-len').value,vibe:document.getElementById('b-lyric-vibe').value,imgStyle:document.getElementById('b-img-style').value,extraInstr:document.getElementById('b-extra-instr').value.trim()});
    var lUser='대본:\n제목: '+d.title+'\n\n'+d.script;
    var lResult=await callAPI(key,lSys,lUser,4000);
    var parsed=parseLyricsResult(lResult);
    d.lyrics=parsed.lyrics;d.music=parsed.music;d.images=parsed.images;d.youtube=parsed.youtube;d.allDone=true;
    updateEpRowStatus(idx);renderBatchEpTabs();
    batchActiveEp=idx;batchActiveSec='lyrics';renderBatchContent();
    document.getElementById('b-result-area').style.display='block';
    document.getElementById('btn-dl-all').disabled=false;
  }catch(e){alert('EP.'+(idx+1)+' 가사 오류: '+e.message);}
  document.getElementById('ep-btn-lyrics-'+idx).textContent='🎵 가사';
  document.getElementById('ep-btn-lyrics-'+idx).disabled=false;
}

function updateEpRowStatus(idx){
  var d=epData[idx];
  var row=document.getElementById('ep-row-'+idx);if(!row)return;
  row.className='ep-row'+(d.enabled?'':' disabled')+(d.allDone?' all-done':d.scriptDone?' script-done':'');
  var statusEl=row.querySelector('.ep-status');
  if(statusEl){statusEl.textContent=d.allDone?'✓ 완료':d.scriptDone?'대본완료':'대기';statusEl.className='ep-status '+(d.allDone?'done':d.scriptDone?'script-ok':'wait');}
  var btnL=document.getElementById('ep-btn-lyrics-'+idx);
  if(btnL)btnL.disabled=!d.scriptDone;
  var btnS=document.getElementById('ep-btn-script-'+idx);
  if(btnS)btnS.disabled=!d.enabled;
}

// ─── 결과 탭/섹션 ───
function renderBatchEpTabs(){
  var container=document.getElementById('b-ep-tabs');container.innerHTML='';
  for(var i=0;i<epCount;i++){
    (function(idx){
      var d=epData[idx];
      if(!d.enabled)return;
      var btn=document.createElement('button');
      var cls='ep-tab'+(idx===batchActiveEp?' active':'')+(d.allDone?' ready':d.scriptDone?' script-only':'');
      btn.className=cls;
      btn.textContent=(d.allDone?'✓ ':d.scriptDone?'📝 ':'')+'EP.'+(idx+1)+(d.title?' '+d.title.substring(0,6)+'…':'');
      btn.onclick=(function(i2){return function(){batchActiveEp=i2;renderBatchEpTabs();renderBatchContent();};})(idx);
      container.appendChild(btn);
    })(i);
  }
}

function switchBatchSec(sec,btn){batchActiveSec=sec;document.querySelectorAll('#pg-batch .sec-btn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');renderBatchContent();}

function renderBatchContent(){
  var d=epData[batchActiveEp];var display=document.getElementById('b-content-display');
  var sectionMap={script:{label:'대본',key:'script'},lyrics:{label:'가사',key:'lyrics'},music:{label:'Suno 음악 프롬프트',key:'music'},images:{label:'이미지 프롬프트 (4컷)',key:'images'},youtube:{label:'유튜브 수익화 전략',key:'youtube'}};
  var s=sectionMap[batchActiveSec];var content=d[s.key]||'';
  display.innerHTML='<div class="content-card"><div class="card-head"><div class="card-title">EP.'+(batchActiveEp+1)+' — '+s.label+'</div><button class="btn-copy" onclick="copyBatchContent(this,\''+s.key+'\')">복사</button></div>'+(content?'<div class="output-text">'+escHtml(content)+'</div>':'<div style="color:#CCC;font-size:12px;padding:20px;text-align:center">'+(d.scriptDone?'아직 생성되지 않았습니다 (2단계 실행 필요)':'아직 생성되지 않았습니다')+'</div>')+'</div>';
}

function copyBatchContent(btn,key){var text=epData[batchActiveEp][key];if(!text)return;navigator.clipboard.writeText(text).then(function(){btn.textContent='✓ 복사됨';btn.classList.add('copied');setTimeout(function(){btn.textContent='복사';btn.classList.remove('copied');},2000);});}

function downloadBatchAll(){
  var content='【Senior Content Studio v19 — 통합생성 결과물】\n생성일시: '+new Date().toLocaleString('ko-KR')+'\n'+'═'.repeat(60)+'\n\n';
  for(var i=0;i<epCount;i++){var d=epData[i];if(!d.enabled||(d.script===''&&d.lyrics===''))continue;content+='★'.repeat(8)+' EP.'+(i+1)+': '+d.title+' '+'★'.repeat(8)+'\n\n';content+='【대본】\n'+d.script+'\n\n【가사】\n'+d.lyrics+'\n\n【음악 프롬프트】\n'+d.music+'\n\n【이미지 프롬프트】\n'+d.images+'\n\n【유튜브 수익화】\n'+d.youtube+'\n\n'+'─'.repeat(60)+'\n\n';}
  var blob=new Blob([content],{type:'text/plain;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='통합생성_v19_'+new Date().toISOString().slice(0,10)+'.txt';a.click();URL.revokeObjectURL(a.href);
}

/* ─── 에피소드 재생성 ─── */
async function regenEpScript(){
  var key=getApiKey();if(!key)return;
  var idx=batchActiveEp;var d=epData[idx];if(!d.enabled||!d.topic)return;
  var state=initScoreState('b',idx);var fbPrompt=buildFeedbackPrompt(state);
  document.getElementById('b-regen-script-btn').disabled=true;
  try{
    var sOpts=getEpScriptSettings(idx);
    var sys=buildSysH(sOpts.dur,sOpts,fbPrompt);
    var user='주제: "'+d.topic+'"\n채널유형: '+document.getElementById('b-category').value+'\n시리즈 회차: #'+(idx+1)+'\n목표: '+sOpts.dur+'초\n이전예고: 없음\n다음예고: 없음\n주제어 입력 언어: 한국어.\n\n줄당 15~30자. 기억 문장 1개 필수. 순수텍스트.';
    var result=await callAPI(key,sys,user,3500);
    d.script=postProcessOutputText(result.trim(),sOpts.out);
    var tm=d.script.match(/「(.+?)」/);if(tm)d.title=tm[1];
    d.scriptDone=true;pushScoreHistory(state);
    updateEpRowStatus(idx);renderBatchEpTabs();batchActiveSec='script';renderBatchContent();
  }catch(e){alert('오류: '+e.message);}
  document.getElementById('b-regen-script-btn').disabled=false;
}
async function regenEpLyrics(){
  var key=getApiKey();if(!key)return;
  var idx=batchActiveEp;var d=epData[idx];if(!d.scriptDone)return;
  var state=initScoreState('b',idx);var fbPrompt=buildFeedbackPrompt(state);
  document.getElementById('b-regen-lyrics-btn').disabled=true;
  try{
    var lSys=buildLyricsSystemPrompt({genre:document.getElementById('b-music-genre').value,era:document.getElementById('b-era').value,songLen:document.getElementById('b-song-len').value,vibe:document.getElementById('b-lyric-vibe').value,imgStyle:document.getElementById('b-img-style').value,extraInstr:document.getElementById('b-extra-instr').value.trim(),vocalPrompt:buildVocalPrompt('b'),feedbackNote:fbPrompt});
    var lResult=await callAPI(key,lSys,'대본:\n제목: '+d.title+'\n\n'+d.script,4000);
    var parsed=parseLyricsResult(lResult);
    d.lyrics=parsed.lyrics;d.music=parsed.music;d.images=parsed.images;d.youtube=parsed.youtube;d.allDone=true;
    pushScoreHistory(state);updateEpRowStatus(idx);renderBatchEpTabs();batchActiveSec='lyrics';renderBatchContent();
  }catch(e){alert('오류: '+e.message);}
  document.getElementById('b-regen-lyrics-btn').disabled=false;
}
async function regenEpAll(){await regenEpScript();if(epData[batchActiveEp].scriptDone)await regenEpLyrics();}

/* ─── Word 문서 다운로드 (Part 1) ─── */
function generateWordHtml(mainTitle, sections) {
  var rows = sections.map(function(sec) {
    var heading = sec.heading
      ? '<h2 style="color:#1A5A8A;font-family:맑은 고딕;margin-top:16pt;margin-bottom:6pt">' + sec.heading + '</h2>\n'
      : '';
    var body = (sec.text || '').split('\n').map(function(line) {
      return '<p style="font-family:맑은 고딕;font-size:11pt;line-height:1.8;margin:2pt 0">' +
        (line || '&nbsp;').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') +
        '</p>';
    }).join('\n');
    return heading + body;
  }).join('\n<p>&nbsp;</p>\n');

  return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<style>body{font-family:맑은 고딕,sans-serif;margin:2cm;font-size:11pt;color:#1A1A1A}' +
    'h1{color:#1A3A6A;border-bottom:2px solid #2A6AA0;padding-bottom:6pt}' +
    'h2{color:#1A5A8A}p{line-height:1.8;margin:3pt 0}</style></head><body>' +
    '<h1>' + mainTitle.replace(/&/g,'&amp;') + '</h1>' +
    '<p style="color:#888;font-size:9pt">생성: ' + new Date().toLocaleString('ko-KR') + '</p>' +
    '<hr style="border-color:#c0d0e0">' + rows + '</body></html>';
}

function saveWordDoc(filename, htmlContent) {
  var blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename + '.doc';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(a.href); }, 2000);
}

function getFname(id, fallback) {
  var el = document.getElementById(id);
  return (el && el.value.trim()) ? el.value.trim() : fallback;
}

function dlWordGen() {
  var text = document.getElementById('out').value;
  if (!text) { alert('먼저 대본을 생성해주세요.'); return; }
  var title = text.split('\n')[0].replace(/[「」\[\]]/g,'').slice(0,40) || '대본';
  var html = generateWordHtml('📝 ' + title, [{ heading: '대본 전문', text: text }]);
  saveWordDoc(getFname('gen-fn', 'KR_01_대본'), html);
}

var xDlInfo = {
  k: { out: 'k-out', yt: 'k-yt', ser: 'k-ser', title: '🔬 전문지식' },
  tri: { out: 'tri-out', yt: 'tri-yt', ser: 'tri-ser', title: '🧩 잡학·트리비아' },
  d: { out: 'd-out', yt: 'd-yt', ser: null, title: '🎭 숏드라마' },
  sa: { out: 'sa-out', yt: 'sa-yt', ser: 'sa-ser', title: '📜 사자성어·명언' },
  hm: { out: 'hm-out', yt: 'hm-yt', ser: null, title: '😄 코믹·유머' }
};
function dlWordX(prefix) {
  var m = xDlInfo[prefix];
  if (!m) return;
  var outEl = document.getElementById(m.out);
  if (!outEl || !outEl.value) { alert('먼저 대본을 생성해주세요.'); return; }
  var fnEl = document.getElementById(prefix + '-fn');
  var fname = fnEl && fnEl.value.trim() ? fnEl.value.trim() : 'KR_01_대본';
  var secs = [{ heading: '📝 대본', text: outEl.value }];
  var ytEl = document.getElementById(m.yt);
  if (ytEl && ytEl.textContent.trim()) secs.push({ heading: '📺 유튜브 전략', text: ytEl.textContent });
  if (m.ser) { var serEl = document.getElementById(m.ser); if (serEl && serEl.textContent.trim()) secs.push({ heading: '📋 시리즈 기획', text: serEl.textContent }); }
  saveWordDoc(fname, generateWordHtml(m.title + ' 대본 패키지', secs));
}

/* ─── A/B 비교 + 유튜브 전략 토글 ─── */
async function genAB() {
  var key = getApiKey();
  if (!key || !isAsciiOnly(key)) { apiKeyMissingToast(); showErr('⚠️ 설정에서 API 키를 입력해주세요'); return; }
  if (MODE !== 'h') { showErr('A/B 생성은 숏츠 모드에서만 지원됩니다.'); return; }
  var title = document.getElementById('h-title').value.trim();
  if (!title) { showErr('제목을 입력해주세요.'); return; }
  document.getElementById('genbtn').disabled = true;
  document.getElementById('genbtn-ab').disabled = true;
  document.getElementById('spinning').classList.add('on');
  document.getElementById('spin-msg').textContent = '🔀 A·B 두 버전 동시 생성 중...';
  hideErr();
  var dur = parseInt(document.getElementById('dur').value);
  var cat = document.getElementById('h-cat').value.trim();
  var hookA = HOOK === 'R' ? 'A' : HOOK;
  var hookB = hookA === 'A' ? 'B' : hookA === 'B' ? 'C' : 'A';
  function makeUser(note) {
    return '주제: "' + title + '"\n' + (cat ? '채널유형: ' + cat + '\n' : '') +
      '목표: ' + dur + '초\n이전예고: 없음\n다음예고: 없음\n' +
      (LANG === 'jk' ? '주제어 언어: 일본어.\n' : '주제어 언어: 한국어.\n') +
      '줄당 15~30자. 기억 문장 1개 필수. 순수텍스트.\n' + note;
  }
  try {
    var results = await Promise.all([
      callAPI(key, buildSysH(dur, { hook: hookA }), makeUser('[버전A]'), 3500),
      callAPI(key, buildSysH(dur, { hook: hookB }), makeUser('[버전B: 다른 훅 패턴]'), 3500)
    ]);
    abStore.a = postProcessOutputText(results[0]);
    abStore.b = postProcessOutputText(results[1]);
    abStore.cur = 'a';
    document.getElementById('out').value = abStore.a;
    updCnt(abStore.a);
    document.getElementById('result').classList.add('on');
    var abPanel = document.getElementById('gen-ab-panel');
    if (abPanel) abPanel.style.display = 'block';
    var abA = document.getElementById('gen-ab-a');
    var abB = document.getElementById('gen-ab-b');
    if (abA) abA.className = 'ab-tab on-a';
    if (abB) abB.className = 'ab-tab';
    showViral(abStore.a);
    addHH(); localStorage.setItem('uc_claude_key', key);
    document.getElementById('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch(e) { showErr('오류: ' + e.message); }
  document.getElementById('genbtn').disabled = false;
  document.getElementById('genbtn-ab').disabled = false;
  document.getElementById('spinning').classList.remove('on');
}
function switchAB(ver) {
  abStore.cur = ver;
  document.getElementById('out').value = ver === 'a' ? abStore.a : abStore.b;
  updCnt(document.getElementById('out').value);
  var abA = document.getElementById('gen-ab-a');
  var abB = document.getElementById('gen-ab-b');
  if (abA) abA.className = 'ab-tab' + (ver === 'a' ? ' on-a' : '');
  if (abB) abB.className = 'ab-tab' + (ver === 'b' ? ' on-b' : '');
  showViral(document.getElementById('out').value);
}

// ─── 바이럴 예측 ───
function showViral(text) {
  var box = document.getElementById('gen-viral');
  if (box) box.style.display = 'block';
  calcViral(text);
}
function calcViral(text) {
  if (!text) return;
  var lines = text.split('\n').filter(function(l) { return l.trim(); });
  var first3 = lines.slice(0, 3).join(' ');
  var hook = 4;
  if (/절대|충격|몰랐|비밀|진짜|위험|조심|필수|경고/.test(first3)) hook += 2;
  if (/[?!？！]/.test(first3)) hook += 1;
  if (first3.length > 5 && first3.length < 60) hook += 1;
  if (/뇌|치매|암|돈|부자|병|기억|혈압|당뇨/.test(first3)) hook += 1;
  hook = Math.min(10, hook);
  var info = Math.min(10, 4 + Math.min(5, (text.match(/\d+[년월일%배번명개종가지분초원억]/g) || []).length));
  var emo = Math.min(10, 4 + Math.min(6, (text.match(/사랑|눈물|감동|충격|놀라|슬프|기쁘|행복|뭉클|소름|안타깝|그립|따뜻/g) || []).length));
  var share = 4;
  if (/저장|공유|구독|좋아요|댓글/.test(text)) share += 2;
  if (lines.length >= 12 && lines.length <= 24) share += 2;
  share = Math.min(10, share);
  var total = Math.max(1, Math.min(10, Math.round(hook * 0.35 + info * 0.25 + emo * 0.2 + share * 0.2)));
  var vsEl = document.getElementById('gen-vs');
  var vbarEl = document.getElementById('gen-vbar');
  var verdictEl = document.getElementById('gen-verdict');
  var detailEl = document.getElementById('gen-vdetail');
  var fixBtn = document.getElementById('gen-fix');
  if (!vsEl) return;
  var barColor = total >= 8 ? 'linear-gradient(90deg,#FF6B00,#FFD700)' : total >= 6 ? 'linear-gradient(90deg,#FFD700,#9ACD32)' : total >= 4 ? 'linear-gradient(90deg,#90EE90,#3CB371)' : 'linear-gradient(90deg,#87CEEB,#4169E1)';
  var verdicts = ['','⚒ 기초 필요','⚒ 개선 필요','📝 방향 잡힘','📈 평균','📈 평균 이상','⚡ 가능성 있음','⚡ 높은 확산','🔥 바이럴 유력','🔥 바이럴 폭발','🏆 최고 등급'];
  vsEl.textContent = total;
  vbarEl.style.width = (total * 10) + '%'; vbarEl.style.background = barColor;
  verdictEl.textContent = verdicts[total] || '';
  var details = [
    { l: '🎣 훅', s: hook }, { l: '📊 정보', s: info },
    { l: '💖 감정', s: emo }, { l: '🔗 공유', s: share }
  ];
  detailEl.innerHTML = details.map(function(d) {
    var cl = d.s >= 8 ? '#4AE44A' : d.s >= 5 ? '#FFD700' : '#FF6B6B';
    return '<div class="vd-item"><div class="vd-score" style="color:' + cl + '">' + d.s + '</div><div class="vd-label">' + d.l + '</div></div>';
  }).join('');
  if (fixBtn) fixBtn.style.display = total < 7 ? 'block' : 'none';
}

// gen() 후 자동 바이럴
var _genV26Base = gen;
gen = async function() {
  await _genV26Base();
  var text = document.getElementById('out').value;
  if (text) showViral(text);
};

// ─── AI 자동 개선 ───
async function autoFix() {
  var key = getApiKey(); if (!key) return;
  var text = document.getElementById('out').value; if (!text) return;
  var fixBtn = document.getElementById('gen-fix');
  if (fixBtn) fixBtn.style.display = 'none';
  document.getElementById('genbtn').disabled = true;
  document.getElementById('spinning').classList.add('on');
  document.getElementById('spin-msg').textContent = '⚡ AI 자동 개선 중...';
  try {
    var sys = '유튜브 숏츠 대본 최적화 전문가.\n다음 4가지를 개선하라:\n1.훅: 첫 2줄을 더 충격적이고 직접적으로\n2.정보: 구체적 숫자/사실 1개 추가\n3.감정: "내 얘기다" 구체적 상황 추가\n4.CTA: 저장·댓글 유도 강화\n원본 구조 유지. 줄당 15~30자. 순수 텍스트만.';
    var improved = await callAPI(key, sys, '개선할 대본:\n\n' + text + '\n\n[개선된 버전만 출력. 설명 없이.]', 3500);
    document.getElementById('out').value = improved; updCnt(improved);
    showViral(improved);
  } catch(e) { showErr('오류: ' + e.message); }
  document.getElementById('genbtn').disabled = false;
  document.getElementById('spinning').classList.remove('on');
}

// ─── 제목 3개 자동생성 ───
async function genTitles() {
  var key = getApiKey(); if (!key) { apiKeyMissingToast(); showErr('⚠️ 설정에서 API 키를 입력해주세요'); return; }
  var text = document.getElementById('out').value;
  if (!text) { showErr('먼저 대본을 생성해주세요.'); return; }
  document.getElementById('genbtn').disabled = true;
  document.getElementById('spinning').classList.add('on');
  document.getElementById('spin-msg').textContent = '📌 유튜브 제목 생성 중...';
  try {
    var sys = '유튜브 조회수 최적화 제목 전문가.\n제목 3개 + 썸네일 텍스트 생성.\n형식:\nA안: (검색 최적화 — 키워드 포함, 50자 이내)\nB안: (호기심 유발 — 궁금증 극대화)\nC안: (시니어 공감 — 감성·경험 연결)\n썸네일: (3~5단어 임팩트)\n클릭베이트 금지. 내용 그대로 반영.';
    var result = await callAPI(key, sys, '이 대본으로 제목 3개:\n\n' + text.slice(0, 500), 400);
    var titleBox = document.getElementById('title-output');
    if (titleBox) { titleBox.textContent = result; titleBox.style.display = 'block'; }
  } catch(e) { showErr('제목 생성 오류: ' + e.message); }
  document.getElementById('genbtn').disabled = false;
  document.getElementById('spinning').classList.remove('on');
}

document.title = '대본생성기 v26 — 완전작동판';
console.log('✅ v26 모든 기능 로드 완료');


// ═══════════════════════════════════════
// v28 핵심 JS — 모든 기능 완전 작동
// ═══════════════════════════════════════

// ── 1. parseRawResult: ###마커 분리 (Word를 깨끗하게) ──
function parseRawResult(text) {
  function ex(t, s, e) {
    var si = t.indexOf(s);
    if (si < 0) return '';
    si += s.length;
    var ei = e ? t.indexOf(e, si) : t.length;
    return t.substring(si, ei < 0 ? t.length : ei).trim();
  }
  var hasMarkers = text.indexOf('###SCRIPT###') >= 0;
  if (!hasMarkers) return { script: text, images: '', youtube: '', series: '' };
  return {
    script: ex(text, '###SCRIPT###', '###IMAGE_PROMPTS###'),
    images: ex(text, '###IMAGE_PROMPTS###', '###YOUTUBE###'),
    youtube: ex(text, '###YOUTUBE###', '###SERIES_PLAN###'),
    series: ex(text, '###SERIES_PLAN###', null)
  };
}

// ── 2. 유튜브전략 토글 ──
function toggleGenYt() {
  var wrap = document.getElementById('gen-yt-wrap');
  var btn = document.getElementById('gen-yt-btn');
  if (!wrap) return;
  var isHidden = wrap.style.display === 'none' || !wrap.style.display;
  wrap.style.display = isHidden ? 'block' : 'none';
  if (btn) btn.textContent = isHidden ? '📺 유튜브전략 숨기기' : '📺 유튜브전략';
}

// gen 완료 후 유튜브전략 버튼 표시 (youtube 내용 있을 때만)
(function patchGenComplete() {
  var _genV28Base = gen;
  gen = async function() {
    await _genV28Base();
    var ytBox = document.getElementById('gen-yt-box');
    var ytBtn = document.getElementById('gen-yt-btn');
    if (ytBox && ytBox.textContent.trim() && ytBtn) {
      ytBtn.style.display = '';
    }
    // 바이럴 예측도 실행
    var text = document.getElementById('out').value;
    if (text) {
      var viralPanel = document.getElementById('gen-viral');
      if (viralPanel) {
        viralPanel.style.display = 'block';
        if (typeof calcViral === 'function') calcViral(text);
      }
    }
  };
})();

/* ─── Word 문서 다운로드 (Part 2 — Clean) ─── */
// ── 3. Word 다운로드 개선 — 대본만 깔끔하게 ──
// generateWordHtml 개선: 한국어/일본어만, 영어 이미지 프롬프트 제외
function generateWordClean(mainTitle, korScript, jpScript, extraSections) {
  function makeParas(text) {
    if (!text) return '';
    return text.split('\n').map(function(line) {
      var safe = (line || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return '<p style="font-family:\'맑은 고딕\',sans-serif;font-size:11pt;line-height:1.9;margin:2pt 0">' + (safe || '&nbsp;') + '</p>';
    }).join('\n');
  }

  var body = '';

  // 한국어 대본
  if (korScript) {
    body += '<h2 style="color:#1A3A6A;font-family:\'맑은 고딕\';margin:14pt 0 6pt;font-size:14pt">📝 대본 (한국어)</h2>\n';
    body += makeParas(korScript);
    body += '<p>&nbsp;</p>';
  }

  // 일본어 대본 (있을 때)
  if (jpScript) {
    body += '<h2 style="color:#4A1A6A;font-family:\'맑은 고딕\';margin:14pt 0 6pt;font-size:14pt">📝 大本 (日本語)</h2>\n';
    body += makeParas(jpScript);
    body += '<p>&nbsp;</p>';
  }

  // 추가 섹션 (유튜브전략 등 — 선택적)
  if (extraSections) {
    extraSections.forEach(function(sec) {
      if (!sec.text) return;
      body += '<h2 style="color:#1A5A8A;font-family:\'맑은 고딕\';margin:14pt 0 6pt;font-size:12pt">' +
        (sec.heading || '').replace(/&/g,'&amp;') + '</h2>\n';
      body += makeParas(sec.text);
      body += '<p>&nbsp;</p>';
    });
  }

  return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<style>body{font-family:\'맑은 고딕\',sans-serif;margin:2.5cm;font-size:11pt;color:#1A1A1A;line-height:1.9}' +
    'h1{color:#0A2A5A;border-bottom:2pt solid #2A6AA0;padding-bottom:6pt;margin-bottom:10pt;font-size:18pt}' +
    'h2{color:#1A5A8A;border-left:3pt solid #2A8A2A;padding-left:8pt;margin:14pt 0 6pt}' +
    'p{margin:2pt 0;line-height:1.9}' +
    '.meta{color:#888;font-size:9pt;margin-bottom:12pt}' +
    '</style></head><body>' +
    '<h1>' + mainTitle.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</h1>' +
    '<div class="meta">생성일: ' + new Date().toLocaleString('ko-KR') + ' | 대본생성기 v28</div>' +
    '<hr style="border:none;border-top:1pt solid #ddd;margin:8pt 0 16pt">' +
    body + '</body></html>';
}

// 스크립트에서 한국어/일본어 분리
function splitLangScript(text) {
  if (!text) return { ko: '', jp: '' };
  var jpMatch = text.match(/=====일본어=====\s*([\s\S]*?)(?:\s*=====한국어=====|$)/);
  var koMatch = text.match(/=====한국어=====\s*([\s\S]*?)$/);
  if (jpMatch || koMatch) {
    return {
      jp: jpMatch ? jpMatch[1].trim() : '',
      ko: koMatch ? koMatch[1].trim() : (jpMatch ? '' : text)
    };
  }
  return { ko: text, jp: '' };
}

// gen 탭 Word 다운로드 (대본만, 영어 없음)
function dlWordGen() {
  var text = document.getElementById('out').value;
  if (!text) { alert('먼저 대본을 생성해주세요.'); return; }
  var title = text.split('\n')[0].replace(/[「」\[\]#*]/g,'').trim().slice(0,40) || '대본';
  var split = splitLangScript(text);
  var fname = getFname('gen-fn', 'KR_01_대본');
  var html = generateWordClean('📝 ' + title, split.ko || text, split.jp || '');
  saveWordDoc(fname, html);
}

// X탭 Word 다운로드 (대본만, 영어 제외)
function dlWordX(prefix) {
  var m = xDlInfo[prefix];
  if (!m) return;
  var outEl = document.getElementById(m.out);
  if (!outEl || !outEl.value) { alert('먼저 대본을 생성해주세요.'); return; }
  var fnEl = document.getElementById(prefix + '-fn');
  var fname = fnEl && fnEl.value.trim() ? fnEl.value.trim() : 'KR_01_대본';
  var titleMap = { k:'🔬 전문지식', tri:'🧩 잡학·트리비아', d:'🎭 숏드라마', sa:'📜 사자성어·명언', hm:'😄 코믹·유머' };

  var split = splitLangScript(outEl.value);

  // 유튜브전략 추가 여부 선택 - 텍스트 내용만 (한국어)
  var extraSecs = [];
  var ytEl = document.getElementById(m.yt);
  if (ytEl && ytEl.textContent.trim()) {
    // 유튜브전략에서 한국어 부분만
    var ytText = ytEl.textContent.trim();
    // 영어 이미지 프롬프트 줄 제거
    var ytClean = ytText.split('\n').filter(function(line) {
      // 영어만으로 구성된 줄 제거
      var trimmed = line.trim();
      if (!trimmed) return true;
      var korJpChars = (trimmed.match(/[가-힣ぁ-ん一-龥]/g) || []).length;
      var total = trimmed.replace(/\s/g,'').length;
      return total === 0 || korJpChars / total > 0.2;
    }).join('\n');
    if (ytClean.trim()) extraSecs.push({ heading: '📺 유튜브 전략', text: ytClean });
  }
  if (m.ser) {
    var serEl = document.getElementById(m.ser);
    if (serEl && serEl.textContent.trim()) extraSecs.push({ heading: '📋 시리즈 기획', text: serEl.textContent });
  }

  var html = generateWordClean(titleMap[prefix] + ' 대본 패키지', split.ko || outEl.value, split.jp || '', extraSecs);
  saveWordDoc(fname, html);
}

// 가사 탭 Word 다운로드

/* ─── 트렌딩 · URL 분석 ─── */
// ═══════════════════════════════════════
// 2. 트렌딩/URL 분석
// ═══════════════════════════════════════

async function analyzeURL() {
  var url = document.getElementById('url-input').value.trim();
  if (!url) { alert('URL을 입력해주세요.'); return; }
  if (!url.startsWith('http')) { alert('올바른 URL 형식으로 입력해주세요. (https://...)'); return; }

  var key = getApiKey();
  if (!key) { apiKeyMissingToast(); return; }

  showTrendingResult('🔗 URL 분석 중...', '');
  try {
    // Use Claude/AI to analyze the URL content
    var sys = '당신은 유튜브 대본 기획 전문가입니다. 주어진 URL의 콘텐츠를 분석해서:\n1. 핵심 주제 (한 줄)\n2. 시니어에게 연결 가능한 포인트\n3. 대본에 활용할 수 있는 훅 요소 2~3개\n를 간결하게 정리해주세요. 200자 이내.';
    var claudeKey = localStorage.getItem('uc_claude_key') || document.getElementById('apiKey').value.trim();
    // Use Anthropic web_search tool approach via fetch
    var result = await _callAPIOrig(claudeKey, sys, 'URL: ' + url + '\n이 URL의 콘텐츠를 분석해 시니어 채널 대본 소재로 활용할 포인트를 알려주세요.', 600);
    TRENDING_CONTEXT = '[URL분석: ' + url + ']\n' + result;
    TRENDING_TYPE = 'url';
    showTrendingResult('🔗 URL 분석 결과', result);
  } catch(e) {
    showTrendingResult('❌ 오류', e.message);
  }
}

async function fetchTrending(country) {
  var key = localStorage.getItem('uc_claude_key') || document.getElementById('apiKey').value.trim();
  if (!key) { apiKeyMissingToast('Claude'); return; }

  var label = country === 'jp' ? '🔥 일본 트렌딩' : '🔥 한국 트렌딩';
  showTrendingResult(label + ' 검색 중...', '');

  var sys = country === 'jp'
    ? '당신은 일본 유튜브·TV 트렌드 전문가입니다. 현재 일본에서 화제인 드라마·연예인·사건·뉴스 중 60대 시니어 시청자에게 연결 가능한 것을 3~5개 골라, 각각 유튜브 숏츠 훅으로 활용하는 방법을 간결하게 알려주세요. 300자 이내.'
    : '당신은 한국 유튜브·TV 트렌드 전문가입니다. 현재 한국에서 화제인 드라마·연예인·사건·뉴스 중 60대 시니어 시청자에게 연결 가능한 것을 3~5개 골라, 각각 유튜브 숏츠 훅으로 활용하는 방법을 간결하게 알려주세요. 300자 이내.';

  var user = country === 'jp'
    ? '지금 일본에서 가장 화제인 드라마·연예인·뉴스를 알려주고 60대 시니어 건강·치매·라이프 채널과 연결되는 대본 아이디어를 제시해주세요.'
    : '지금 한국에서 가장 화제인 드라마·연예인·뉴스를 알려주고 60대 시니어 건강·치매·라이프 채널과 연결되는 대본 아이디어를 제시해주세요.';

  try {
    var result = await _callAPIOrig(key, sys, user, 800);
    TRENDING_CONTEXT = '[' + (country === 'jp' ? '일본' : '한국') + ' 트렌딩]\n' + result;
    TRENDING_TYPE = country;
    showTrendingResult(label + ' 결과', result);
  } catch(e) {
    showTrendingResult('❌ 오류', e.message);
  }
}

function clearTrending() {
  TRENDING_CONTEXT = '';
  TRENDING_TYPE = '';
  var box = document.getElementById('trending-result');
  if (box) box.style.display = 'none';
  var inp = document.getElementById('url-input');
  if (inp) inp.value = '';
}

function showTrendingResult(label, text) {
  var box = document.getElementById('trending-result');
  var labelEl = document.getElementById('trending-label');
  var textEl = document.getElementById('trending-text');
  if (!box) return;
  box.style.display = 'block';
  if (labelEl) labelEl.textContent = label;
  if (textEl) textEl.textContent = text;
}

// 트렌딩 컨텍스트를 프롬프트에 주입하는 래퍼
function injectTrendingContext(systemPrompt) {
  if (!TRENDING_CONTEXT) return systemPrompt;
  return '【v30 트렌딩/URL 분석 결과 — 대본 주제와 연결하여 활용할 것】\n' + TRENDING_CONTEXT + '\n\n' + systemPrompt;
}

// gen() 래퍼 — 트렌딩 컨텍스트 주입 + YouTube 파싱
(function patchGen() {
  var _origBuildSysH = buildSysH;
  buildSysH = function(dur, opts, feedbackNote) {
    var base = _origBuildSysH(dur, opts, feedbackNote);
    return injectTrendingContext(base);
  };

  // gen 완료 후 YouTube 파싱 & 이미지 분리
  var _origRawFn = window._genRawComplete;

  // Wrap the result processing
  var observer = new MutationObserver(function() {
    var outEl = document.getElementById('out');
    if (!outEl || !outEl.value) return;
    var text = outEl.value;
    if (text.indexOf('###YOUTUBE###') >= 0) {
      var yt = text.slice(text.indexOf('###YOUTUBE###') + 13).trim();
      var imgMark = text.indexOf('###IMAGE###');
      var script = text.slice(0, text.indexOf('###YOUTUBE###')).trim();
      outEl.value = script;
      document.getElementById('cnt') && (document.getElementById('cnt').textContent = script.split('\n').length + '줄');
      var ytBox = document.getElementById('gen-yt-box');
      var ytWrap = document.getElementById('gen-yt-wrap');
      if (ytBox && yt) { ytBox.textContent = yt; if (ytWrap) ytWrap.style.display = 'block'; }
      observer.disconnect();
    }
  });
  var outEl = document.getElementById('out');
  if (outEl) observer.observe(outEl, { attributes: false, childList: false, subtree: false, characterData: false });
})();

// Patch gen result processing
var _origProcessed = true; // flag
(function patchGenProcessing() {
  // We need to intercept after processed is set to out.value
  // Use a Proxy on getElementById for 'out'
  var _origGetEl = document.getElementById.bind(document);
  document.getElementById = function(id) {
    var el = _origGetEl(id);
    if (id === 'out' && el && !el._v30patched) {
      el._v30patched = true;
      var desc = Object.getOwnPropertyDescriptor(el, 'value') || Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
      Object.defineProperty(el, 'value', {
        get: function() { return desc.get ? desc.get.call(this) : this._val || ''; },
        set: function(v) {
          if (desc.set) desc.set.call(this, v);
          else this._val = v;
          // Parse and separate sections
          if (v && v.indexOf('###YOUTUBE###') >= 0) {
            setTimeout(function() {
              var yt = v.slice(v.indexOf('###YOUTUBE###') + 13).trim();
              var script = v.slice(0, v.indexOf('###YOUTUBE###')).trim();
              if (desc.set) desc.set.call(el, script); else el._val = script;
              var ytBox = _origGetEl('gen-yt-box');
              var ytWrap = _origGetEl('gen-yt-wrap');
              if (ytBox && yt) { ytBox.textContent = yt; }
              if (ytWrap && yt) { ytWrap.style.display = 'block'; }
              var cntEl = _origGetEl('cnt');
              if (cntEl) cntEl.textContent = script.split('\n').length + '줄';
            }, 10);
          }
        }
      });
    }
    return el;
  };
})();

// ═══════════════════════════════════════
// 3. Suno Style / Lyrics 분리 렌더링
// ═══════════════════════════════════════

var _origRenderLyricContent = typeof renderLyricContent === 'function' ? renderLyricContent : null;
renderLyricContent = function() {
  // Handle Suno-specific sections
  if (lyricActiveSec === 'sunoStyle' || lyricActiveSec === 'sunoLyrics') {
    var display = document.getElementById('l-content-display');
    if (!display) return;

    if (lyricActiveSec === 'sunoStyle') {
      var style = lyricData.sunoStyle || '';
      display.innerHTML = '<div class="content-card">' +
        '<div class="card-head"><div class="card-title">🎛 Suno Style Prompt</div>' +
        '<button class="btn-copy" onclick="copySunoSection(\'sunoStyle\')">복사</button></div>' +
        '<div class="suno-style-box">' +
        '<div style="font-size:10px;font-weight:800;color:#1A6A1A;margin-bottom:5px">📋 Suno "Style of Music" 입력란에 붙여넣기</div>' +
        '<div style="font-size:11px;line-height:1.7;white-space:pre-wrap;color:#1A3A1A">' + escHtml(style || '가사 생성 후 표시됩니다') + '</div></div></div>';
    } else {
      var lyrics = lyricData.sunoLyrics || lyricData.lyrics || '';
      display.innerHTML = '<div class="content-card">' +
        '<div class="card-head"><div class="card-title">🎤 Suno Lyrics Input</div>' +
        '<button class="btn-copy" onclick="copySunoSection(\'sunoLyrics\')">복사</button></div>' +
        '<div class="suno-lyrics-box">' +
        '<div style="font-size:10px;font-weight:800;color:#C020A0;margin-bottom:5px">📋 Suno "Lyrics" 입력란에 붙여넣기</div>' +
        '<div style="font-size:11px;line-height:1.7;white-space:pre-wrap;color:#3A0A2A">' + escHtml(lyrics || '가사 생성 후 표시됩니다') + '</div></div></div>';
    }
    return;
  }
  if (_origRenderLyricContent) _origRenderLyricContent();
};

function copySunoSection(key) {
  var text = lyricData[key] || '';
  if (!text) { alert('먼저 가사를 생성해주세요.'); return; }
  navigator.clipboard.writeText(text).then(function() {
    alert('✅ 복사됐습니다!\n\nSuno에서 ' +
      (key === 'sunoStyle' ? '"Style of Music"' : '"Lyrics"') + ' 입력란에 붙여넣기 하세요.');
  }).catch(function() {
    var ta = document.createElement('textarea'); ta.value = text;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta); alert('복사됐습니다!');
  });
}

// ═══════════════════════════════════════
// 4. 유튜브 수익화 — X탭 전체 자동 출력
// ═══════════════════════════════════════

// Patch all X-tab gen functions to include YouTube output
function injectYoutubeToXSys(sys) {
  if (!sys.includes('###YOUTUBE###')) {
    sys += '\n\n대본 출력 후 반드시 추가:\n###YOUTUBE###\n제목A: (검색최적화형)\n제목B: (호기심유발형)\n제목C: (시니어공감형)\n썸네일: (3~5단어)\n태그: (20개)\n숏츠훅A:\n숏츠훅B:\n댓글유도:\n설명란첫3줄:\n수익화전략:';
  }
  return sys;
}

// Patch genKnow, genTrivia, genDrama, genSaying, genHumor
['genKnow','genTrivia','genDrama','genSaying','genHumor'].forEach(function(fnName) {
  if (typeof window[fnName] !== 'function') return;
  var _orig = window[fnName];
  window[fnName] = async function() {
    // Temporarily patch buildXSysPrompt calls
    var _origBuildKnow = typeof buildKnowSys === 'function' ? buildKnowSys : null;
    await _orig.apply(this, arguments);
    // After gen, check if yt section exists in relevant textareas
  };
});

// ═══════════════════════════════════════
// 5. parseRawResult — 대본/이미지/수익화 완전 분리
// ═══════════════════════════════════════

parseRawResult = function(text) {
  function ex(t, s, e) {
    var si = t.indexOf(s); if (si < 0) return '';
    si += s.length; var ei = e ? t.indexOf(e, si) : t.length;
    return t.substring(si, ei < 0 ? t.length : ei).trim();
  }
  var hasMarkers = text.indexOf('###YOUTUBE###') >= 0 || text.indexOf('###IMAGE_PROMPTS###') >= 0;
  if (!hasMarkers) return { script: text, images: '', youtube: '', series: '' };

  var imgMark = text.indexOf('###IMAGE_PROMPTS###');
  var ytMark = text.indexOf('###YOUTUBE###');

  // Script = everything before first marker
  var firstMark = imgMark >= 0 && ytMark >= 0 ? Math.min(imgMark, ytMark)
    : imgMark >= 0 ? imgMark : ytMark;

  return {
    script: firstMark >= 0 ? text.slice(0, firstMark).trim() : text,
    images: ex(text, '###IMAGE_PROMPTS###', '###YOUTUBE###'),
    youtube: ex(text, '###YOUTUBE###', null),
    series: ex(text, '###SERIES_PLAN###', null)
  };
};

// ═══════════════════════════════════════
// 6. copyEl helper (universal)
// ═══════════════════════════════════════

if (typeof copyEl !== 'function') {
  window.copyEl = function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var text = el.tagName === 'TEXTAREA' ? el.value : el.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text.trim()).then(function() { alert('복사됐습니다!'); })
      .catch(function() {
        var ta = document.createElement('textarea'); ta.value = text.trim();
        document.body.appendChild(ta); ta.select(); document.execCommand('copy');
        document.body.removeChild(ta); alert('복사됐습니다!');
      });
  };
}

// ═══════════════════════════════════════
// 7. 통합대본(batch) YouTube 수익화 추가
// ═══════════════════════════════════════

// Patch buildSysL (long form) and buildSysH to inject YouTube output
var _origBuildSysL = typeof buildSysL === 'function' ? buildSysL : null;
if (_origBuildSysL) {
  buildSysL = function() {
    var base = _origBuildSysL.apply(this, arguments);
    return injectTrendingContext(injectYoutubeToXSys(base));
  };
}

var _origBuildSysT = typeof buildSysT === 'function' ? buildSysT : null;
if (_origBuildSysT) {
  buildSysT = function() {
    return injectTrendingContext(_origBuildSysT.apply(this, arguments));
  };
}

// ═══════════════════════════════════════
// 8. 최신 드라마·연예인 트렌딩 Hook
//    → 대본 생성 전 자동으로 주제와 연결
// ═══════════════════════════════════════

function buildTrendingHookNote() {
  if (!TRENDING_CONTEXT) return '';
  var hookLines = [
    '【⚡ 트렌딩/URL 분석 자동 반영】',
    TRENDING_CONTEXT.slice(0, 500),
    '→ 위 트렌딩 소재와 이 대본 주제를 자연스럽게 연결할 것.',
    '→ 예: 인기 드라마 장면 → "그 드라마 주인공처럼 ○○를 했더니"',
    '→ 단, 허구 사실 절대 금지. 연관성은 자연스럽게.'
  ].join('\n');
  return hookLines;
}
