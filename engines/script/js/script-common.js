/* ========================================================
   script-common.js  --  전역 상태 + 공통 헬퍼 + 프리셋
   engines/script/index.html 에서 분리 (Phase 1 — common)
   ======================================================== */

var MODE='h',LANG='jk',OUT='b',HOOK='A',TTYPE='jp',LHOOK='A';
var B_HOOK='A', B_OUT='k';

var SELF_KEY='anymake_script_path',PARTNER_KEY='anymake_content_path';

function TAB(name,btn){
  ['gen','batch','lyric','know','trivia','drama','saying','humor','hub','story','hist','preset','guide','senior','sns','hook','series','intent'].forEach(function(n){
    var el=document.getElementById('pg-'+n); if(el) el.classList.add('hide');
  });
  document.querySelectorAll('.tnav').forEach(function(b){b.classList.remove('on');});
  var pg=document.getElementById('pg-'+name); if(pg) pg.classList.remove('hide');
  if(btn) btn.classList.add('on');
  document.getElementById('stickyGen').style.display=name==='gen'?'flex':'none';
  if(name==='hist')renderHist();
  if(name==='preset'){renderPreset();renderPresetQuick();}
}

var TIKI_DATA={jp:[['닌텐도','미국 게임산업'],['신칸센','세계 고속철도'],['와규','세계 스테이크'],['일본 편의점','세계 편의점'],['혼다','포르쉐'],['세이코','롤렉스']],person:[['오타니','베이브 루스'],['이치로','피트 로즈'],['미야자키 하야오','월트 디즈니'],['마이클 조던','르브론 제임스'],['나달','페더러'],['이순신','넬슨 제독']],animal:[['사자','호랑이'],['독수리','매'],['상어','범고래'],['고릴라','회색곰'],['치타','타조'],['늑대','하이에나']],company:[['Apple','삼성'],['도요타','폭스바겐'],['소니','필립스'],['닌텐도','마이크로소프트'],['유니클로','자라'],['혼다','BMW']],food:[['딸기','포도'],['라멘','우동'],['스시','회'],['커피','녹차'],['블루베리','아사이'],['빵','밥']],country:[['일본','미국 제조업'],['한국','중국 IT'],['일본','독일 자동차'],['한국','미국 반도체']],sport:[['야구','축구'],['스모','MMA'],['태권도','유도'],['골프','테니스']],free:[]};

var HOOK_DESC=['','자극 최소 (정보형)','자극 낮춤 (신뢰형)','균형잡힌 자극','강한 훅 (주목형)','최대 자극'];
var TRUST_DESC=['','최소 정보','기본 정보','균형잡힌 정보','높은 신뢰도 (전문가형)','최고 신뢰도'];

function makeChips(wrapId,items,targetId,cls){var wrap=document.getElementById(wrapId);if(!wrap)return;items.forEach(function(item){var chip=document.createElement('span');chip.className='chip '+cls;chip.textContent=item;chip.onclick=function(){document.getElementById(targetId).value=item;wrap.querySelectorAll('.chip').forEach(function(c){c.classList.remove('on');});chip.classList.add('on');};wrap.appendChild(chip);});}

function copy(type){var text=document.getElementById('out').value;if(!text)return;var toCopy=text;if(type==='jp'){var m=text.match(/=====일본어=====([\s\S]*?)(?:=====한국어=====|$)/);if(m)toCopy=m[1].trim();}else if(type==='kr'){var m2=text.match(/=====한국어=====([\s\S]*?)$/);if(m2)toCopy=m2[1].trim();}var ta=document.createElement('textarea');ta.value=toCopy;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);var ids={all:'btn-all',jp:'btn-jp',kr:'btn-kr'};var btn=document.getElementById(ids[type]);if(!btn)return;var orig=btn.textContent;btn.textContent='✓ 복사됨';setTimeout(function(){btn.textContent=orig;},2000);}
function saveTxt(){var t=document.getElementById('out').value;if(!t)return;var now=new Date();var fn=(MODE==='l'?'롱폼_':'대본_')+now.getFullYear()+('0'+(now.getMonth()+1)).slice(-2)+('0'+now.getDate()).slice(-2)+'_'+('0'+now.getHours()).slice(-2)+('0'+now.getMinutes()).slice(-2)+'.txt';var blob=new Blob([t],{type:'text/plain;charset=utf-8'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;a.click();}
function saveHist(){var t=document.getElementById('out').value;if(!t){showErr('생성된 대본이 없습니다.');return;}var title=t.split('\n')[0].replace(/[「」\[\]]/g,'').slice(0,32);var hist=JSON.parse(localStorage.getItem('hist_v10')||'[]');var now=new Date();var date=now.getFullYear()+'.'+(now.getMonth()+1)+'.'+now.getDate()+' '+now.getHours()+':'+('0'+now.getMinutes()).slice(-2);hist.unshift({title:title,text:t,date:date,mode:MODE});if(hist.length>25)hist=hist.slice(0,25);localStorage.setItem('hist_v10',JSON.stringify(hist));alert('히스토리에 저장했습니다.');}
function renderHist(){var hist=JSON.parse(localStorage.getItem('hist_v10')||'[]');var list=document.getElementById('hist-list'),empty=document.getElementById('hist-empty');if(!hist.length){list.innerHTML='';empty.style.display='block';return;}empty.style.display='none';list.innerHTML=hist.map(function(item,i){var modeLabel={h:'숏츠',t:'티키타카',l:'롱폼'}[item.mode||'h'];return'<div class="hitem" onclick="loadHist('+i+')"><div class="htitle">'+item.title+'<br><span style="font-size:10px;color:var(--muted)">'+modeLabel+'</span></div><div style="display:flex;align-items:center"><span class="hmeta">'+item.date+'</span><button class="hdel" onclick="delHist(event,'+i+')">✕</button></div></div>';}).join('');}
function loadHist(i){var hist=JSON.parse(localStorage.getItem('hist_v10')||'[]');if(!hist[i])return;document.getElementById('out').value=hist[i].text;updCnt(hist[i].text);document.getElementById('result').classList.add('on');TAB('gen',document.querySelector('.tnav'));}
function delHist(e,i){e.stopPropagation();var hist=JSON.parse(localStorage.getItem('hist_v10')||'[]');hist.splice(i,1);localStorage.setItem('hist_v10',JSON.stringify(hist));renderHist();}
function showErr(msg){var el=document.getElementById('errbox');el.innerHTML=msg;el.classList.add('on');el.scrollIntoView({behavior:'smooth',block:'nearest'});}
function hideErr(){document.getElementById('errbox').classList.remove('on');}

// ─── 프리셋 ───
function getSettings(){return{mode:MODE,lang:LANG,out:OUT,hook:HOOK,ttype:TTYPE,lhook:LHOOK,hCat:document.getElementById('h-cat').value,hTone:document.getElementById('h-tone').value,dur:document.getElementById('dur').value,hookSl:document.getElementById('hook-sl').value,trustSl:document.getElementById('trust-sl').value,cta:document.getElementById('h-cta').value,tPride:document.getElementById('t-pride').value,tComedy:document.getElementById('t-comedy').value,lTone:document.getElementById('l-tone').value,lCta:document.getElementById('l-cta').value,lEp:document.getElementById('l-ep').value};}
function applySettings(s){if(s.mode)setMode(s.mode);if(s.lang)setLang(s.lang);if(s.out)setOut(s.out);if(s.hook)setHook(s.hook);if(s.ttype)setTT(s.ttype);if(s.lhook)setLHook(s.lhook);if(s.hCat!==undefined)document.getElementById('h-cat').value=s.hCat;if(s.hTone!==undefined)document.getElementById('h-tone').value=s.hTone;if(s.dur){document.getElementById('dur').value=s.dur;updDur();}if(s.hookSl){document.getElementById('hook-sl').value=s.hookSl;updHT();}if(s.trustSl){document.getElementById('trust-sl').value=s.trustSl;updHT();}if(s.cta)document.getElementById('h-cta').value=s.cta;if(s.tPride)document.getElementById('t-pride').value=s.tPride;if(s.tComedy)document.getElementById('t-comedy').value=s.tComedy;if(s.lTone!==undefined)document.getElementById('l-tone').value=s.lTone;if(s.lCta)document.getElementById('l-cta').value=s.lCta;if(s.lEp!==undefined)document.getElementById('l-ep').value=s.lEp;}
function savePreset(){var name=document.getElementById('preset-name').value.trim();if(!name){alert('프리셋 이름을 입력해주세요.');return;}var presets=JSON.parse(localStorage.getItem('presets_v10')||'[]');presets.push({name:name,s:getSettings()});localStorage.setItem('presets_v10',JSON.stringify(presets));document.getElementById('preset-name').value='';renderPreset();renderPresetQuick();alert('"'+name+'" 저장 완료');}
function renderPreset(){var presets=JSON.parse(localStorage.getItem('presets_v10')||'[]');var list=document.getElementById('preset-list'),empty=document.getElementById('preset-empty');if(!presets.length){list.innerHTML='';empty.style.display='block';return;}empty.style.display='none';list.innerHTML=presets.map(function(p,i){var mLabel={h:'숏츠',t:'티키타카',l:'롱폼'}[p.s.mode||'h'];return'<div class="hitem" onclick="applyPreset('+i+')"><div class="htitle">'+p.name+'<br><span style="font-size:10px;color:var(--muted)">'+mLabel+'</span></div><button class="hdel" onclick="delPreset(event,'+i+')">✕</button></div>';}).join('');}
function renderPresetQuick(){var presets=JSON.parse(localStorage.getItem('presets_v10')||'[]');var wrap=document.getElementById('preset-quick');if(!presets.length){wrap.innerHTML='<span style="font-size:11px;color:var(--muted)">프리셋 탭에서 저장하면 여기에 표시</span>';return;}wrap.innerHTML=presets.map(function(p,i){return'<button class="pbtn" onclick="applyPreset('+i+')">'+p.name+'</button>';}).join('');}
function applyPreset(i){var presets=JSON.parse(localStorage.getItem('presets_v10')||'[]');if(!presets[i])return;applySettings(presets[i].s);TAB('gen',document.querySelector('.tnav'));}
function delPreset(e,i){e.stopPropagation();var presets=JSON.parse(localStorage.getItem('presets_v10')||'[]');presets.splice(i,1);localStorage.setItem('presets_v10',JSON.stringify(presets));renderPreset();renderPresetQuick();}

function escHtml2(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function escHtml(t){return String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

