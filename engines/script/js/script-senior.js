/* ========================================================
   script-senior.js  --  시니어 + 채널 + 트렌드 주입 + 공통 유틸
   engines/script/index.html block 2 에서 분리 (Phase 7)
   의존: script-api.js (AI_PROVIDER, getApiKey), core/api-adapter.js,
         script-common.js (showErr 없음 — 자체 alert 사용)
   초기화 IIFE → DOMContentLoaded 후 injectChannelBar + injectTrendButtons
   ======================================================== */

/* ══════════ 공통 유틸 ══════════ */
function _v(id){var e=document.getElementById(id); return e?e.value:'';}
function _set(id,v){var e=document.getElementById(id); if(e){ if(e.value!==undefined) e.value=v; else e.textContent=v; }}
function copyFromId(id){
  var e=document.getElementById(id); if(!e) return;
  var t=e.value!==undefined?e.value:e.textContent;
  if(!t){ alert('복사할 내용이 없습니다.'); return; }
  navigator.clipboard.writeText(t).then(function(){ alert('📋 복사됨'); });
}
async function _syncAPI(){
  if(typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
  if(typeof AI_PROVIDER !== 'undefined') APIAdapter.setProvider(AI_PROVIDER);
  var ck=localStorage.getItem('uc_claude_key'); if(ck) APIAdapter.setApiKey('claude',ck);
  var ok=localStorage.getItem('uc_openai_key'); if(ok) APIAdapter.setApiKey('openai',ok);
  var gk=localStorage.getItem('uc_gemini_key'); if(gk) APIAdapter.setApiKey('gemini',gk);
}

/* ══════════ 🌸 14. 시니어 특화 모드 ══════════ */
var SR_COUNTRY='kr';
function srCountry(c){
  SR_COUNTRY=c;
  ['kr','jp'].forEach(function(x){
    var b=document.getElementById('sr-'+x); if(!b) return;
    var on=(x===c);
    b.style.background = on ? 'linear-gradient(135deg,#ef6fab,#9181ff)' : '#fff';
    b.style.color = on ? '#fff' : '#7a6d73';
    b.style.borderColor = on ? '#e8a6c6' : '#f1dce7';
  });
}
async function generateSenior(){
  var topic=_v('sr-topic').trim();
  if(!topic){ alert('주제를 입력해주세요.'); return; }
  var age=_v('sr-age');
  var big=document.getElementById('sr-bigtext').checked;
  var easy=document.getElementById('sr-easy').checked;
  var emp=document.getElementById('sr-empathy').checked;
  var trend=document.getElementById('sr-trend').checked;

  var st=document.getElementById('sr-status');
  st.textContent='⏳ 한국어 + 일본어 대본 동시 생성 중...';
  try{
    await _syncAPI();
    var empKeys='건강, 추억, 가족, 손자, 자식, 부모님, 지난 세월, 친구';
    var jpTrend='団塊世代, 年金, 健康寿命, 孫, 昭和の思い出, 定年退職, 温泉, 老後';
    var baseKO =
      '당신은 시니어 시청자용 쇼츠·롱폼 대본 작가다.\n' +
      '대상: ' + (SR_COUNTRY==='kr'?'한국':'일본') + ' ' + age + ' 시니어.\n' +
      (big?'- 한 문장을 짧게 끊고 쉼표를 자주 넣어 낭독 시 명확하게.\n':'') +
      (easy?'- 어려운 단어·외래어 대신 쉬운 일상어로 바꿔 쓴다.\n':'') +
      (emp?'- 공감 키워드를 자연스럽게 녹인다: '+empKeys+'.\n':'') +
      (trend && SR_COUNTRY==='jp' ? '- 일본 시니어 트렌드 키워드를 적절히 반영: '+jpTrend+'.\n' : '') +
      '결과물은 시니어가 편안히 듣고 공감할 수 있는 톤으로.';
    var baseJP = baseKO + '\n[言語指示] 必ず日本語のみで作成。敬体で、日本のシニアに自然な語彙。';
    var sysKO = baseKO + '\n[언어 지시] 반드시 한국어로만 작성.';
    var prompt='주제: '+topic+'\n위 주제로 3~5분 분량 시니어 친화 대본을 작성해라.';
    var resKO = await APIAdapter.callWithFallback(sysKO, prompt, {maxTokens:2500});
    var resJP = await APIAdapter.callWithFallback(baseJP, prompt, {maxTokens:2500});
    _set('sr-out', '═══ 🇰🇷 한국어 ═══\n\n'+resKO+'\n\n═══ 🇯🇵 日本語 ═══\n\n'+resJP);
    st.textContent='✅ 완료';
  }catch(e){ st.textContent='❌ '+e.message; alert(e.message); }
}

/* ══════════ 📱 15. SNS 자동 변환 ══════════ */
// 저장된 출력 언어 복원
document.addEventListener('DOMContentLoaded', function(){
  var el = document.getElementById('slang');
  if(el){
    var saved = localStorage.getItem('script_lang');
    if(saved === 'ko' || saved === 'ja' || saved === 'kojp') el.value = saved;
  }
});
async function convertSNS(){
  var script=_v('sns-script').trim();
  if(!script){ alert('대본을 입력하세요.'); return; }
  var doIG=document.getElementById('sns-ig').checked;
  var doX =document.getElementById('sns-x').checked;
  var doB =document.getElementById('sns-blog').checked;
  if(!doIG && !doX && !doB){ alert('최소 1개 이상 선택하세요.'); return; }

  // ── 출력 언어 분기 ('ko' | 'ja' | 'kojp') ──
  var lang = (document.getElementById('slang') && document.getElementById('slang').value)
          || localStorage.getItem('script_lang')
          || 'ko';
  // 내부에서는 기존 'jp' 키를 유지 (일본어)
  var langs = lang==='ko' ? ['ko'] : lang==='ja' ? ['jp'] : ['ko','jp'];

  var st=document.getElementById('sns-status');
  var totalN = langs.length * ((doIG?1:0)+(doX?1:0)+(doB?1:0));
  st.textContent='⏳ '+totalN+'개 결과 병렬 생성 중...';
  try{
    await _syncAPI();
    var sys = function(lang, kind){
      var langLabel = lang==='ko'?'한국어':'日本語';
      var guides={
        ig: '인스타그램 캡션: 3~5줄, 감정 이입, 해시태그 8~12개 포함',
        x:  'X(트위터) 스레드: 5~7개 트윗, 각 280자 이내, 번호(1/ 2/ ...)',
        blog: '블로그 포스팅: 800~1200자, 제목+3개 소제목+마무리, SEO 친화'
      };
      return '당신은 SNS 에디터다. 아래 대본을 ' + langLabel + '로 ' + guides[kind] + ' 형식으로 변환.\n' +
        (lang==='ko'?'[언어] 반드시 한국어로만.':'[言語] 必ず日本語のみで。');
    };
    var userP='원본 대본:\n'+script;

    var tasks=[];
    var labels=[];
    langs.forEach(function(L){
      if(doIG){ tasks.push(APIAdapter.callWithFallback(sys(L,'ig'),   userP,{maxTokens:900})); labels.push(L+'-ig'); }
      if(doX ){ tasks.push(APIAdapter.callWithFallback(sys(L,'x'),    userP,{maxTokens:1200})); labels.push(L+'-x'); }
      if(doB ){ tasks.push(APIAdapter.callWithFallback(sys(L,'blog'), userP,{maxTokens:2500})); labels.push(L+'-blog'); }
    });
    var results = await Promise.allSettled(tasks);

    var koBox=document.getElementById('sns-ko-box');
    var jpBox=document.getElementById('sns-jp-box');
    var koSec=document.getElementById('sns-ko-sec');
    var jpSec=document.getElementById('sns-jp-sec');
    koBox.innerHTML=''; jpBox.innerHTML='';
    // 언어별 섹션 헤더 on/off
    var showKo = langs.indexOf('ko')>=0;
    var showJp = langs.indexOf('jp')>=0;
    if(koSec) koSec.style.display = showKo ? '' : 'none';
    if(koBox) koBox.style.display = showKo ? '' : 'none';
    if(jpSec) jpSec.style.display = showJp ? '' : 'none';
    if(jpBox) jpBox.style.display = showJp ? '' : 'none';
    var titles={ig:'📸 인스타그램 캡션', x:'🐦 X 스레드', blog:'✍️ 블로그 포스팅'};

    results.forEach(function(r, i){
      var parts=labels[i].split('-'); var lang=parts[0], kind=parts[1];
      var txt = r.status==='fulfilled' ? r.value : '❌ '+r.reason.message;
      var boxId = 'sns-'+labels[i]+'-out';
      var block = document.createElement('div');
      block.style.margin='8px 0';
      block.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'+
          '<strong style="font-size:12px">'+titles[kind]+'</strong>'+
          '<button onclick="copyFromId(\''+boxId+'\')" style="padding:4px 10px;border:1px solid #e8a6c6;background:#fff;border-radius:8px;font-size:10px;font-weight:800;cursor:pointer">📋 복사</button>'+
        '</div>'+
        '<textarea id="'+boxId+'" readonly style="width:100%;min-height:140px;padding:10px;border:1px solid #ead9e1;border-radius:10px;font-size:11px;line-height:1.7;font-family:inherit;background:#fff9fc">'+ (txt||'').replace(/"/g,'&quot;') +'</textarea>';
      (lang==='ko'?koBox:jpBox).appendChild(block);
    });
    document.getElementById('sns-results').style.display='';
    st.textContent='✅ 변환 완료 ('+results.filter(function(r){return r.status==='fulfilled';}).length+'/'+results.length+')';
  }catch(e){ st.textContent='❌ '+e.message; alert(e.message); }
}

/* ══════════ 🎯 16. 훅 강화 도우미 ══════════ */
async function generateHooks(){
  var topic=_v('hk-topic').trim();
  if(!topic){ alert('주제를 입력하세요.'); return; }
  var st=document.getElementById('hk-status');
  st.textContent='⏳ 훅·제목·썸네일·A/B 버전 동시 생성 중...';
  try{
    await _syncAPI();
    var sys = '당신은 유튜브 쇼츠·롱폼 카피라이터다. 아래 JSON 형식으로만 정확히 응답하라. 추가 설명 금지.\n'+
      '{\n'+
      '  "hooks3s": ["훅1","훅2","훅3","훅4","훅5"],\n'+
      '  "titleKO": ["제목1","제목2","제목3","제목4","제목5"],\n'+
      '  "titleJP": ["タイトル1","タイトル2","タイトル3","タイトル4","タイトル5"],\n'+
      '  "thumb":   ["썸네일1","썸네일2","썸네일3"],\n'+
      '  "abA":     {"hook":"...", "title":"...", "thumb":"..."},\n'+
      '  "abB":     {"hook":"...", "title":"...", "thumb":"..."}\n'+
      '}\n훅은 첫 3초용 1문장씩. 제목은 클릭률 중심, 이모지 허용.';
    var res = await APIAdapter.callWithFallback(sys, '주제: '+topic, {maxTokens:1500});
    var json; try{
      var m=res.match(/\{[\s\S]*\}/);
      json = JSON.parse(m?m[0]:res);
    }catch(e){ throw new Error('응답 파싱 실패: '+e.message+'\n\n원문: '+res.slice(0,200)); }
    _set('hk-3s',       (json.hooks3s||[]).map(function(h,i){return (i+1)+'. '+h;}).join('\n'));
    _set('hk-title-ko', (json.titleKO||[]).map(function(h,i){return (i+1)+'. '+h;}).join('\n'));
    _set('hk-title-jp', (json.titleJP||[]).map(function(h,i){return (i+1)+'. '+h;}).join('\n'));
    _set('hk-thumb',    (json.thumb  ||[]).map(function(h,i){return (i+1)+'. '+h;}).join('\n'));
    var a=json.abA||{}, b=json.abB||{};
    _set('hk-ab-a', '훅: '+(a.hook||'')+'\n제목: '+(a.title||'')+'\n썸네일: '+(a.thumb||''));
    _set('hk-ab-b', '훅: '+(b.hook||'')+'\n제목: '+(b.title||'')+'\n썸네일: '+(b.thumb||''));
    document.getElementById('hk-results').style.display='';
    st.textContent='✅ 완료';
  }catch(e){ st.textContent='❌ '+e.message; alert(e.message); }
}

/* ══════════ 📚 17. 시리즈 관리 ══════════ */
function saveSeries(){
  var key='ucs_series_list';
  var list=JSON.parse(localStorage.getItem(key)||'[]');
  var item={ name:_v('sx-name'), ep:_v('sx-ep'), prev:_v('sx-prev'), topic:_v('sx-topic'), at:Date.now() };
  list.unshift(item); localStorage.setItem(key, JSON.stringify(list.slice(0,30)));
  alert('💾 시리즈 저장됨 ('+(item.name||'무제')+' '+item.ep+'편)');
}
async function generateSeries(){
  var name=_v('sx-name').trim();
  var ep  =_v('sx-ep');
  var prev=_v('sx-prev').trim();
  var topic=_v('sx-topic').trim();
  if(!name || !topic){ alert('시리즈 이름과 이번 편 주제를 입력해주세요.'); return; }

  var st=document.getElementById('sx-status');
  st.textContent='⏳ 요약·도입·예고 3종 생성 중...';
  try{
    await _syncAPI();
    var sys = '당신은 유튜브 시리즈 연출가다. 시리즈의 연속성을 유지하도록 아래 JSON으로만 응답하라.\n'+
      '{\n  "summary":"(이전 편 3~4문장 요약)",\n  "opening":"(이번 편 도입부 30초, 자연스러운 연결 멘트)",\n  "nextTeaser":"(다음 편 예고 멘트 2~3문장, 궁금증 유발)"\n}';
    var user = '시리즈: '+name+' / 현재 '+ep+'편\n'+
               '이전 편 내용: '+(prev||'(정보 없음 — 자유 생성)')+'\n'+
               '이번 편 주제: '+topic;
    var res = await APIAdapter.callWithFallback(sys, user, {maxTokens:1400});
    var json; try{ var m=res.match(/\{[\s\S]*\}/); json=JSON.parse(m?m[0]:res); }
    catch(e){ throw new Error('응답 파싱 실패: '+res.slice(0,200)); }
    _set('sx-sum',  json.summary   ||'');
    _set('sx-open', json.opening   ||'');
    _set('sx-next', json.nextTeaser||'');
    document.getElementById('sx-results').style.display='';
    st.textContent='✅ 완료';
  }catch(e){ st.textContent='❌ '+e.message; alert(e.message); }
}

/* ══════════ 🌏 채널별 톤 프리셋 (상단 바 주입) ══════════ */
var CHANNEL_KEY='ucs_channel_preset';
var CHANNEL_DEFAULTS = {
  ko: { tone:'따뜻·잔잔', style:'시니어 친화', length:'3~5분' },
  jp: { tone:'温かい・穏やか', style:'シニア向け', length:'3~5分' }
};
function loadChannelPresets(){
  try{ return JSON.parse(localStorage.getItem(CHANNEL_KEY)||'null') || CHANNEL_DEFAULTS; }
  catch(e){ return CHANNEL_DEFAULTS; }
}
function saveChannelPresets(p){ localStorage.setItem(CHANNEL_KEY, JSON.stringify(p)); }
function applyChannel(ch){
  var p=loadChannelPresets();
  var s=p[ch]; if(!s) return;
  var bar=document.getElementById('ch-current');
  if(bar) bar.textContent = (ch==='ko'?'🇰🇷 한국':'🇯🇵 일본') + ' · ' + s.tone + ' / ' + s.style + ' / ' + s.length;
  ['ko','jp'].forEach(function(x){
    var b=document.getElementById('ch-'+x); if(!b) return;
    var on=(x===ch);
    b.style.background = on ? 'linear-gradient(135deg,#ef6fab,#9181ff)' : '#fff';
    b.style.color = on ? '#fff' : '#7a6d73';
    b.style.borderColor = on ? '#e8a6c6' : '#f1dce7';
  });
  localStorage.setItem('ucs_channel_active', ch);
}
function editChannel(ch){
  var p=loadChannelPresets();
  var tone=prompt('['+(ch==='ko'?'한국':'일본')+'] 톤?', p[ch].tone); if(tone===null) return;
  var style=prompt('스타일?', p[ch].style); if(style===null) return;
  var length=prompt('길이?', p[ch].length); if(length===null) return;
  p[ch]={tone:tone,style:style,length:length}; saveChannelPresets(p); applyChannel(ch);
  alert('💾 '+(ch==='ko'?'한국':'일본')+' 채널 프리셋 저장됨');
}
function injectChannelBar(){
  var nav=document.querySelector('.tab-nav'); if(!nav || document.getElementById('ch-bar')) return;
  var bar=document.createElement('div');
  bar.id='ch-bar';
  bar.style.cssText='display:flex;gap:6px;align-items:center;flex-wrap:wrap;background:#fff;border:1px solid var(--line);border-radius:18px;padding:10px 14px;margin-bottom:10px;box-shadow:0 4px 12px rgba(126,87,110,.06)';
  bar.innerHTML =
    '<strong style="font-size:12px;color:#b14d82">🌏 채널 프리셋:</strong>'+
    '<button id="ch-ko" onclick="applyChannel(\'ko\')" style="padding:6px 12px;border:1.5px solid #f1dce7;border-radius:999px;background:#fff;font-size:11px;font-weight:800;cursor:pointer">🇰🇷 한국 채널</button>'+
    '<button id="ch-jp" onclick="applyChannel(\'jp\')" style="padding:6px 12px;border:1.5px solid #f1dce7;border-radius:999px;background:#fff;font-size:11px;font-weight:800;cursor:pointer">🇯🇵 일본 채널</button>'+
    '<span id="ch-current" style="font-size:11px;color:var(--muted);margin-left:4px"></span>'+
    '<span style="flex:1"></span>'+
    '<button onclick="editChannel(\'ko\')" style="padding:5px 10px;border:1px solid #f1dce7;border-radius:8px;background:#fff;font-size:10px;cursor:pointer">✏️ 한국 설정</button>'+
    '<button onclick="editChannel(\'jp\')" style="padding:5px 10px;border:1px solid #f1dce7;border-radius:8px;background:#fff;font-size:10px;cursor:pointer">✏️ 일본 설정</button>';
  nav.parentNode.insertBefore(bar, nav);
  applyChannel(localStorage.getItem('ucs_channel_active')||'ko');
}

/* ══════════ 🔥 트렌드 반영 강화 (기존 gen 탭에 버튼 주입) ══════════ */
var TREND_KO = ['배우자 사별','노후 자금','혈압관리','손주 용돈','황혼이혼','무릎 건강','치매 예방','시골집','친구 만남','연금 실수령액'];
var TREND_JP = ['孫の入学','年金生活','血圧','終活','温泉旅行','健康寿命','団塊世代','認知症予防','親の介護','定年退職'];
function suggestTrend(lang){
  var arr = (lang==='ko') ? TREND_KO : TREND_JP;
  var popup = document.createElement('div');
  popup.id='trend-popup';
  popup.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border:2px solid #e8a6c6;border-radius:18px;padding:22px;box-shadow:0 20px 50px rgba(126,87,110,.22);z-index:9999;max-width:460px;width:92%';
  var btns = arr.map(function(k){
    return '<button onclick="pickTrend(\''+k.replace(/\'/g,"\\'")+'\')" style="margin:3px;padding:8px 12px;border:1px solid #e8a6c6;border-radius:999px;background:#fff5fa;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">'+k+'</button>';
  }).join('');
  popup.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'+
      '<strong style="color:#b14d82">🔥 '+(lang==='ko'?'한국':'일본')+' 유튜브 시니어 트렌드</strong>'+
      '<button onclick="closeTrend()" style="border:none;background:none;font-size:18px;cursor:pointer">✕</button>'+
    '</div>'+
    '<div style="font-size:11px;color:#7a6d73;margin-bottom:10px">클릭 시 주제 입력란에 자동 반영</div>'+
    '<div>'+btns+'</div>'+
    '<div style="margin-top:12px;padding:10px;background:#fff7ee;border:1px solid #f1e0c4;border-radius:10px;font-size:11px;line-height:1.7">'+
      '<strong>💡 차별화 팁:</strong> 유사 채널과 다르게, 인물 실명·구체 숫자·계절감·지역명을 넣으면 클릭률이 오릅니다.'+
    '</div>';
  document.body.appendChild(popup);
}
function pickTrend(k){
  var targets=['h-topic','t-a','l-topic','sr-topic','hk-topic','sx-topic'];
  var placed=false;
  for(var i=0;i<targets.length;i++){
    var el=document.getElementById(targets[i]);
    if(el && el.offsetParent !== null){ // visible
      el.value = (el.value ? (el.value+' · ') : '') + k;
      el.focus(); placed=true; break;
    }
  }
  if(!placed){
    var any=document.getElementById('h-topic')||document.getElementById('sr-topic');
    if(any) any.value=(any.value?(any.value+' · '):'')+k;
  }
  closeTrend();
}
function closeTrend(){ var p=document.getElementById('trend-popup'); if(p) p.remove(); }
function differentiateTip(){
  var tips=[
    '유사 영상이 "방법/팁"에 집중한다면, 당신은 "실패담·후회"로 시작하라.',
    '다른 채널이 전문가를 쓴다면, 당신은 평범한 시청자 사연으로 시작하라.',
    '경쟁 영상이 긴 인트로를 쓴다면, 당신은 3초 안에 결론부터 던져라.',
    '다른 썸네일이 밝다면, 당신은 어둡고 한 단어 강조 스타일로 뒤집어라.',
    '흔한 BGM 대신, 고요한 무음·호흡·발자국 소리로 시작하면 체류시간이 오른다.'
  ];
  alert('💡 차별화 포인트 제안\n\n'+tips[Math.floor(Math.random()*tips.length)]);
}
function injectTrendButtons(){
  var genPage=document.getElementById('pg-gen'); if(!genPage || document.getElementById('trend-bar')) return;
  var bar=document.createElement('div');
  bar.id='trend-bar';
  bar.style.cssText='display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:10px 0;padding:10px 12px;background:linear-gradient(135deg,#fff7ee,#fff0f5);border:1px solid #f1e0c4;border-radius:14px';
  bar.innerHTML =
    '<strong style="font-size:12px;color:#B05010">🔥 트렌드 반영</strong>'+
    '<button onclick="suggestTrend(\'ko\')" style="padding:6px 12px;border:1.5px solid #e8a6c6;border-radius:999px;background:#fff;font-size:11px;font-weight:800;cursor:pointer">🇰🇷 한국 트렌드</button>'+
    '<button onclick="suggestTrend(\'jp\')" style="padding:6px 12px;border:1.5px solid #e8a6c6;border-radius:999px;background:#fff;font-size:11px;font-weight:800;cursor:pointer">🇯🇵 일본 트렌드</button>'+
    '<button onclick="differentiateTip()" style="padding:6px 12px;border:1.5px solid #e8a6c6;border-radius:999px;background:#fff;font-size:11px;font-weight:800;cursor:pointer">✨ 차별화 포인트</button>'+
    '<span style="font-size:10px;color:#7a6d73">인기 키워드 클릭 → 주제에 자동 삽입</span>';
  genPage.insertBefore(bar, genPage.firstChild);
}

/* ══════════ 초기화 ══════════ */
(function init(){
  function run(){ injectChannelBar(); injectTrendButtons(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
