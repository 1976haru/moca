/* ================================================
   s1-script.js
   project mgmt / stepper / STEP0-dashboard / STEP1-plan / STEP2-script
   modules/studio/ -- split_studio2.py
   ================================================ */


function studioNewProjectObj(){
  return {
    id: 'st_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6),
    name: '', createdAt: Date.now(), updatedAt: Date.now(),
    step: 0,                        // 0=dash, 1~7
    mode: 'semi-auto',              // full-auto / semi-auto / expert
    channel: 'ko',                  // ko / ja / both
    s1: { genre:'info', topic:'', lengthSec:60, series:false, target:'일반', mood:'밝게' },
    s2: { scriptKo:'', scriptJa:'', viralScore:0, scriptTab:'gen' },
    s3: { artStyle:'ghibli', lighting:'soft natural', sceneImages:{ko:[], ja:[]}, thumbnails:[] },
    s4: { voiceKo:'senior-f', voiceJa:'yuki', speed:1.0, emotion:'중립', pitch:0, bgm:'soft piano', bgmVolume:15 },
    s5: { template:'시니어감동v1', transitions:[], motion:'kenburns', filter:'원본', opening:true, closing:true, branding:{logo:'',watermark:'',color:'#ef6fab'}, effects:[] },
    s6: { fontKo:'Pretendard', fontJa:'Noto Sans JP', subtitleLayout:'bottom', keywordHighlight:true, animation:'popup', jpVertical:false, jpFurigana:false, jpKeigo:false },
    s7: { titles:[], hashtags:{ko:[],ja:[]}, scoreKo:{}, scoreJa:{}, suggestions:[] },
    sources: {
      mode: 'image',                   // 'image' | 'video_prompt' | 'upload'
      images: [],
      videoPrompts: [],
      uploadedFiles: [],
      externalTool: { name:'invideo', prompt:'', outputVideo:null }
    }
  };
}

function studioList(){
  try{ const l = JSON.parse(localStorage.getItem(LS_STUDIO_LIST)||'[]'); return Array.isArray(l)?l:[]; }catch(_){ return []; }
}
function studioLoadProject(id){
  try{ const raw = localStorage.getItem(LS_STUDIO_ONE+id); if(raw) return JSON.parse(raw); }catch(_){}
  return null;
}
/* 빈 프로젝트(=의미 있는 입력/결과 없음)는 목록에 누적시키지 않는다 */
function _studioHasMeaningful(p){
  if(!p) return false;
  if(p.topic && String(p.topic).trim()) return true;
  if(p.scriptText || p.scriptKo || p.scriptJa) return true;
  if(p.scenes && p.scenes.length) return true;
  if(p.s1 && (p.s1.topic || p.s1.scriptText)) return true;
  if(typeof p.step === 'number' && p.step > 0) return true;
  return false;
}

function studioSave(){
  if(!STUDIO.project) return;
  STUDIO.project.updatedAt = Date.now();
  try{
    const meaningful = _studioHasMeaningful(STUDIO.project);
    /* 의미 있을 때만 개별 프로젝트도 저장 — 빈 프로젝트로 디스크 낭비 방지 */
    if(meaningful){
      localStorage.setItem(LS_STUDIO_ONE + STUDIO.project.id, JSON.stringify(STUDIO.project));
    }
    const list = studioList();
    const i = list.findIndex(x => x.id === STUDIO.project.id);
    const summary = {
      id: STUDIO.project.id,
      name: STUDIO.project.name || (STUDIO.project.s1 && STUDIO.project.s1.topic) || STUDIO.project.topic || '(제목없음)',
      channel: STUDIO.project.channel,
      step: STUDIO.project.step,
      updatedAt: STUDIO.project.updatedAt
    };
    if(meaningful){
      if(i >= 0) list[i] = summary; else list.unshift(summary);
    } else if(i >= 0){
      /* 의미 없으면 기존 항목도 제거 (사용자가 입력 지웠을 때) */
      list.splice(i, 1);
    }
    /* 추가 안전망 — 누적된 빈 항목 정리 */
    const cleaned = list.filter(function(x){
      if(!x) return false;
      if(x.name && x.name !== '(제목없음)') return true;
      if(typeof x.step === 'number' && x.step > 0) return true;
      return false;
    });
    localStorage.setItem(LS_STUDIO_LIST, JSON.stringify(cleaned.slice(0,50)));
    const s = document.getElementById('studio-savestate'); if(s) s.innerHTML = '자동저장 ✅';
  }catch(e){ console.warn('[studio save]', e); }
}
function openStudio(step){
  /* 스튜디오 진입점 — in-progress 프로젝트는 마지막 step 유지 (5 초과만 클램프) */
  if(!STUDIO.project) STUDIO.project = studioNewProjectObj();
  if(STUDIO.project.step > 5) STUDIO.project.step = 5;
  state.studioOpen = true;
  state.category = 'shorts';
  const sd = document.getElementById('studioDetail');
  if(sd) sd.classList.remove('hide');
  const hero = document.querySelector('.hero'); if(hero) hero.style.display = 'none';
  const grid = document.getElementById('grid');  if(grid) grid.style.display = 'none';
  if(typeof renderStudio === 'function') renderStudio();
}

function studioClose(){
  studioSave();
  const sd = document.getElementById('studioDetail'); if(sd) sd.classList.add('hide');
  const hero = document.querySelector('.hero'); if(hero) hero.style.display = '';
  const grid = document.getElementById('grid'); if(grid) grid.style.display = '';
  state.studioOpen = false;
  state.category = 'shorts';
  if(typeof renderAll === 'function') renderAll();
}

/* ─── API 키 브리지 (uc_claude_key → api_key_v10) ─── */
function studioBridgeKeys(){
  try{
    const pairs = [
      ['uc_claude_key', 'api_key_v10'],
      ['uc_openai_key', 'openai_api_key_v30'],
      ['uc_gemini_key', 'gemini_api_key_v30']
    ];
    pairs.forEach(([src, dst]) => {
      const v = localStorage.getItem(src);
      if(v) localStorage.setItem(dst, v);
    });
  }catch(_){}
}

/* ─── 메인 렌더 ─── */
function renderStudio(){
  studioBridgeKeys();
  if(!STUDIO.project) STUDIO.project = studioNewProjectObj();
  /* localStorage 마이그레이션 — 이전 6/7단계로 저장된 프로젝트의 step 값을 5단계 범위로 재조정 */
  if(STUDIO.project && !STUDIO.project.v5StepMigrated){
    if(STUDIO.project.step >= 6) STUDIO.project.step = 5;
    STUDIO.project.v5StepMigrated = true;
    studioSave();
  }
  /* step 범위 보정 — 0(대시보드) 혹은 1~5 */
  if(!STUDIO.project.step || STUDIO.project.step < 0) STUDIO.project.step = 0;
  if(STUDIO.project.step > 5) STUDIO.project.step = 5;
  const body = document.getElementById('studio-body');
  if(!body) return;
  /* step 0 = 대시보드(stepper 없음), 1~5 = stepper + 단계 본문 */
  if(STUDIO.project.step === 0){
    body.innerHTML = _studioStepBody();
  } else {
    body.innerHTML = _studioStepperShell() + _studioStepBody();
  }
  _studioBindStep();
}

function _studioDash(){
  const list = studioList().slice(0, 6);
  const modeCard = (mode, ico, title, desc, rec) =>
    '<div class="studio-mode-card' + (rec?' recommend':'') + '" onclick="studioStart(\'' + mode + '\')">' +
      '<div class="ico">' + ico + '</div><h4>' + title + '</h4><p>' + desc + '</p>' +
      '<div style="margin-top:auto;padding:8px 14px;background:var(--grad-main);color:#fff;border-radius:999px;font-weight:900;font-size:12px;text-align:center">시작 →</div>' +
    '</div>';

  return '<div class="studio-panel">' +
    '<h4>📡 채널 선택 — 모든 단계에 반영됩니다</h4>' +
    '<div class="studio-ch-bar">' +
      '<button class="studio-ch on" data-ch="ko"   onclick="studioPickChannel(\'ko\',this)">🇰🇷 한국어만</button>' +
      '<button class="studio-ch"    data-ch="ja"   onclick="studioPickChannel(\'ja\',this)">🇯🇵 일본어만</button>' +
      '<button class="studio-ch"    data-ch="both" onclick="studioPickChannel(\'both\',this)">🇰🇷🇯🇵 동시생성</button>' +
    '</div>' +
    '<h4 style="margin-top:18px">🎬 어떤 모드로 시작할까요?</h4>' +
    '<div class="studio-dash">' +
      modeCard('full-auto','⚡','전자동','주제만 입력하면 AI가 6단계 전부 자동', true) +
      modeCard('semi-auto','🔬','반자동','단계마다 확인하며 수정 가능 (권장)') +
      modeCard('expert','🛠','전문가','모든 세부값 직접 조정') +
    '</div>' +
    '</div>' +
    '<div class="studio-panel">' +
      '<h4>📂 진행 중 / 완성된 작업</h4>' +
      (list.length ? '<div class="studio-proj-list">' +
        list.map(p => '<div class="studio-proj-row">' +
          '<span class="stepbadge">Step ' + p.step + '/6</span>' +
          '<span class="name">' + p.name + '</span>' +
          '<span class="meta">' + (p.channel==='both'?'🇰🇷🇯🇵':p.channel==='ja'?'🇯🇵':'🇰🇷') + ' · ' + new Date(p.updatedAt).toLocaleString('ko-KR') + '</span>' +
          '<button class="studio-btn pri" style="padding:6px 12px;font-size:11px" onclick="studioResume(\'' + p.id + '\')">이어하기</button>' +
          '<button class="studio-btn ghost" style="padding:6px 12px;font-size:11px" onclick="studioDelete(\'' + p.id + '\')">🗑</button>' +
        '</div>').join('') +
      '</div>' : '<p class="sub">저장된 프로젝트가 없어요. 위에서 모드를 선택해 시작하세요.</p>') +
    '</div>';
}
function _studioBindDash(){
  const cur = document.querySelector('#studio-body .studio-ch.on');
  if(STUDIO.project && STUDIO.project.channel){
    document.querySelectorAll('#studio-body .studio-ch').forEach(b => b.classList.toggle('on', b.getAttribute('data-ch') === STUDIO.project.channel));
  }
}
function studioPickChannel(ch, btn){
  document.querySelectorAll('#studio-body .studio-ch').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  STUDIO.project.channel = ch;
  studioSave();
}
function studioStart(mode){
  STUDIO.project.mode = mode;
  STUDIO.project.step = 1;
  studioSave();
  renderStudio();
  if(mode === 'full-auto') setTimeout(studioRunFullAuto, 200);
}
function studioResume(id){
  const proj = studioLoadProject(id);
  if(!proj){ alert('프로젝트를 불러올 수 없어요'); return; }
  STUDIO.project = proj;
  /* 기존 7단계 저장값 → 6단계 마이그레이션 (프로젝트당 1회) */
  if(!STUDIO.project.migratedTo6){
    if(STUDIO.project.step >= 2) STUDIO.project.step = STUDIO.project.step - 1;
    if(STUDIO.project.step < 1) STUDIO.project.step = 1;
    if(STUDIO.project.step > 5) STUDIO.project.step = 5;
    STUDIO.project.migratedTo6 = true;
    studioSave();
  }
  renderStudio();
}
function studioDelete(id){
  if(!confirm('이 프로젝트를 삭제할까요?')) return;
  localStorage.removeItem(LS_STUDIO_ONE+id);
  const list = studioList().filter(x => x.id !== id);
  localStorage.setItem(LS_STUDIO_LIST, JSON.stringify(list));
  renderStudio();
}

/* ─── 스테퍼 쉘 ─── */
const STUDIO_STEPS = [
  { n:0, ico:'🏠', title:'대시보드',         key:'dash'   },
  { n:1, ico:'📝', title:'대본 생성',         key:'script' },
  { n:2, ico:'🖼', title:'이미지·영상 소스',   key:'source' },
  { n:3, ico:'🔊', title:'음성·BGM',          key:'voice'  },
  { n:4, ico:'✂️', title:'편집',              key:'edit'   },
  { n:5, ico:'📤', title:'최종검수·출력',      key:'upload' }
];
const _STUDIO_STEP_NUM = ['','①','②','③','④','⑤'];
function _studioStepperShell(){
  const cur = STUDIO.project.step;
  return '<div class="studio-progress"><div class="studio-steps">' +
    STUDIO_STEPS.map(s => {
      const lbl = (s.n === 0 ? '' : _STUDIO_STEP_NUM[s.n] + ' ') + s.ico + ' ' + s.title;
      return '<button class="studio-step-pill ' + (s.n<cur?'done':s.n===cur?'current':'') + '" onclick="studioGoto(' + s.n + ')">' + lbl + '</button>';
    }).join('') +
  '</div></div>';
}
function studioGoto(n){
  if(n < 0 || n > 5) return;
  STUDIO.project.step = n;
  studioSave();
  renderStudio();
}
function _studioStepBody(){
  const n = STUDIO.project.step;
  /* STEP 0(대시보드): dashboard.js 의 _studioDashboard(wrapId) 로 패널 주입 */
  if(n === 0) return '<div id="studioDashWrap"></div>';
  /* STEP 1(대본 생성): s1-script-step.js 의 _studioS1Step(wrapId) 로 패널 주입 */
  if(n === 1) return '<div id="studioS1Wrap"></div>';
  /* STEP 2(이미지·영상 소스): s3-source-tabs.js 의 _studioS3Source(wrapId) 로 3탭 라우팅 */
  if(n === 2) return '<div id="studioS3SourceWrap"></div>';
  /* STEP 3(음성·BGM): s2-voice-step.js 의 _studioS2Step(wrapId) 로 패널 주입 */
  if(n === 3) return '<div id="studioS2Wrap"></div>';
  /* STEP 4(편집): s4-edit.js 의 _studioS4Edit(wrapId) 로 패널 주입 */
  if(n === 4) return '<div id="studioS4EditWrap"></div>';
  /* STEP 5(최종검수·출력): wrap div 만 반환, 콘텐츠는 _studioBindStep 의 _studioS6(wrapId) 로 주입 */
  if(n === 5) return '<div id="studioS5Wrap"></div>';
  return '';
}
function _studioBindStep(){
  /* STEP 0(대시보드): dashboard.js 의 _studioDashboard(wrapId) 로 패널 주입 */
  if(STUDIO.project.step === 0){
    if(typeof _studioDashboard === 'function') _studioDashboard('studioDashWrap');
    return;
  }
  /* STEP 1(대본 생성): s1-script-step.js 의 _studioS1Step(wrapId) 로 패널 주입 */
  if(STUDIO.project.step === 1){
    if(typeof _studioS1Step === 'function') _studioS1Step('studioS1Wrap');
    return;
  }
  /* STEP 2(이미지·영상 소스): s3-source-tabs.js 의 _studioS3Source(wrapId) 로 3탭 라우팅 */
  if(STUDIO.project.step === 2){
    if(typeof _studioS3Source === 'function') _studioS3Source('studioS3SourceWrap');
    return;
  }
  /* STEP 3(음성·BGM): s2-voice-step.js 의 _studioS2Step(wrapId) 로 패널 주입 */
  if(STUDIO.project.step === 3){
    if(typeof _studioS2Step === 'function') _studioS2Step('studioS2Wrap');
    return;
  }
  /* STEP 4(편집): s4-edit.js 의 _studioS4Edit(wrapId) 로 패널 주입 */
  if(STUDIO.project.step === 4){
    if(typeof _studioS4Edit === 'function') _studioS4Edit('studioS4EditWrap');
    return;
  }
  /* STEP 5(최종검수·출력): s5-upload-v2.js 의 _studioS5Upload(wrapId) 우선, 없으면 s5-upload.js 의 _studioS6(wrapId) fallback */
  if(STUDIO.project.step === 5){
    if(typeof _studioS5Upload === 'function') _studioS5Upload('studioS5Wrap');
    else if(typeof _studioS6 === 'function') _studioS6('studioS5Wrap');
    return;
  }
}

/* ═════════════ STEP 0 대시보드 — modules/studio/dashboard.js 로 이관됨 ═════════════ */

function _studioBindS1(){
  const p = STUDIO.project.s1;
  const on = (id, fn) => { const e = document.getElementById(id); if(e) e.addEventListener('change', fn); };
  on('s1-topic',  e => { p.topic = e.target.value; studioSave(); });
  on('s1-series', e => { p.series = e.target.value === 'true'; studioSave(); });
  on('s1-target', e => { p.target = e.target.value; studioSave(); });
  on('s1-mood',   e => { p.mood = e.target.value; studioSave(); });
  const topicInput = document.getElementById('s1-topic');
  if(topicInput) topicInput.addEventListener('input', e => { p.topic = e.target.value; studioSave(); });
}
function studioSetChannel(ch){ STUDIO.project.channel = ch; studioSave(); renderStudio(); }
function studioPickGenre(id, btn){
  STUDIO.project.s1.genre = id;
  document.querySelectorAll('#s1-genres .studio-chip').forEach(x => x.classList.remove('on'));
  btn.classList.add('on');
  studioSave();
}
function studioSetLen(sec, btn){
  STUDIO.project.s1.lengthSec = sec;
  btn.parentElement.querySelectorAll('.studio-chip').forEach(x => x.classList.remove('on'));
  btn.classList.add('on');
  studioSave();
}
async function studioAiSuggestTopics(){
  const out = document.getElementById('s1-topic-out');
  out.innerHTML = '<p class="sub">⏳ AI 주제 추천 중...</p>';
  try{
    const p = STUDIO.project.s1;
    const genre = STUDIO_GENRES.find(g => g.id===p.genre)?.label || p.genre;
    const sys = '한국 시니어 유튜브 숏츠 주제 추천. JSON 배열: ["주제1","주제2","주제3","주제4","주제5"]';
    const user = '장르: ' + genre + ' / 타겟: ' + p.target + ' / 분위기: ' + p.mood;
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens:500 });
    const m = res.match(/\[[\s\S]*\]/); if(!m) throw new Error('파싱 실패');
    const arr = JSON.parse(m[0]);
    out.innerHTML = arr.map(t => '<button class="studio-chip" onclick="document.getElementById(\'s1-topic\').value=\'' + t.replace(/\'/g,'') + '\';STUDIO.project.s1.topic=\'' + t.replace(/\'/g,'') + '\';studioSave()">' + t + '</button>').join('');
  }catch(e){ out.innerHTML = '<p class="sub">❌ ' + e.message + '</p>'; }
}
function studioTrendTopics(){
  const out = document.getElementById('s1-topic-out');
  out.innerHTML = '<p class="sub">🔥 트렌드 주제 (이번 주):</p>' +
    ['치매예방 음식 TOP5','50대 갱년기 극복','어버이날 효도영상','시니어 운동 루틴','노후준비 체크리스트']
      .map(t => '<button class="studio-chip" onclick="document.getElementById(\'s1-topic\').value=\'' + t + '\';STUDIO.project.s1.topic=\'' + t + '\';studioSave()">' + t + '</button>').join('');
}
function studioPresetSave(){
  const name = prompt('프리셋 이름:'); if(!name) return;
  const list = JSON.parse(localStorage.getItem('uc_studio_presets')||'[]');
  list.unshift({ name, s1: JSON.parse(JSON.stringify(STUDIO.project.s1)), at: Date.now() });
  localStorage.setItem('uc_studio_presets', JSON.stringify(list.slice(0,20)));
  alert('💾 저장됨');
}
function studioPresetLoad(){
  const list = JSON.parse(localStorage.getItem('uc_studio_presets')||'[]');
  if(!list.length){ alert('저장된 프리셋 없음'); return; }
  const choice = prompt('불러올 프리셋:\n\n' + list.map((p,i)=>(i+1)+'. '+p.name).join('\n') + '\n\n번호 입력:');
  const i = parseInt(choice,10)-1;
  if(isNaN(i) || !list[i]) return;
  Object.assign(STUDIO.project.s1, list[i].s1);
  studioSave(); renderStudio();
}
function studioS1Next(){
  if(!STUDIO.project.s1.topic.trim()){ alert('주제를 입력해주세요'); return; }
  STUDIO.project.step = 2; studioSave(); renderStudio();
}

