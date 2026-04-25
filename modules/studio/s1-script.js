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
function studioSave(){
  if(!STUDIO.project) return;
  STUDIO.project.updatedAt = Date.now();
  try{
    localStorage.setItem(LS_STUDIO_ONE + STUDIO.project.id, JSON.stringify(STUDIO.project));
    const list = studioList();
    const i = list.findIndex(x => x.id === STUDIO.project.id);
    const summary = {
      id: STUDIO.project.id,
      name: STUDIO.project.name || STUDIO.project.s1.topic || '(제목없음)',
      channel: STUDIO.project.channel,
      step: STUDIO.project.step,
      updatedAt: STUDIO.project.updatedAt
    };
    if(i >= 0) list[i] = summary; else list.unshift(summary);
    localStorage.setItem(LS_STUDIO_LIST, JSON.stringify(list.slice(0,50)));
    const s = document.getElementById('studio-savestate'); if(s) s.innerHTML = '자동저장 ✅';
  }catch(e){ console.warn('[studio save]', e); }
}
function openStudio(step){
  /* 5단계 스튜디오 진입점 — shorts 카드 클릭 시 호출 (카드 shStep = STUDIO_STEPS n = 매핑 n 전부 일치) */
  if(!STUDIO.project) STUDIO.project = studioNewProjectObj();
  let s = parseInt(step, 10);
  if(isNaN(s) || s < 0) s = 0;
  if(s > 5) s = 5;
  STUDIO.project.step = s;
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
  /* step 범위 보정 — 0(대시보드) 혹은 1~6 */
  if(!STUDIO.project.step || STUDIO.project.step < 0) STUDIO.project.step = 0;
  if(STUDIO.project.step > 6) STUDIO.project.step = 6;
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
    if(STUDIO.project.step > 6) STUDIO.project.step = 6;
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
  { n:0, label:'🏠 대시보드' },
  { n:1, label:'① 대본 생성' },
  { n:2, label:'② 이미지·영상 소스' },
  { n:3, label:'③ 음성·BGM' },
  { n:4, label:'④ 편집' },
  { n:5, label:'⑤ 최종검수·업로드' },
  { n:6, label:'⑥ 📤 최종검수·출력' }
];
function _studioStepperShell(){
  const cur = STUDIO.project.step;
  return '<div class="studio-progress"><div class="studio-steps">' +
    STUDIO_STEPS.map(s => '<button class="studio-step-pill ' + (s.n<cur?'done':s.n===cur?'current':'') + '" onclick="studioGoto(' + s.n + ')">' + s.label + '</button>').join('') +
  '</div></div>';
}
function studioGoto(n){
  if(n < 0 || n > 6) return;
  STUDIO.project.step = n;
  studioSave();
  renderStudio();
}
function _studioStepBody(){
  const n = STUDIO.project.step;
  /* STEP 4(편집): s4-edit.js 의 _studioS4Edit(wrapId) 로 패널 주입 */
  if(n === 4) return '<div id="studioS4EditWrap"></div>';
  /* STEP 5(업로드 legacy)/STEP 6(출력) 은 wrap div 만 반환, 콘텐츠는 _studioBindStep 의 _studioS6(wrapId) 로 주입 */
  if(n === 5 || n === 6) return '<div id="studioS5Wrap"></div>';
  return ({
    0: _studioS0,   // 🏠 대시보드
    1: _studioS2,   // ① 대본 생성 (iframe 기반 script engine)
    2: _studioS3,   // ② 이미지 생성
    3: _studioS4    // ③ 음성·BGM
  }[n] || (()=>''))();
}
function _studioBindStep(){
  /* STEP 4(편집): s4-edit.js 의 _studioS4Edit(wrapId) 로 패널 주입 */
  if(STUDIO.project.step === 4){
    if(typeof _studioS4Edit === 'function') _studioS4Edit('studioS4EditWrap');
    return;
  }
  /* STEP 5/6: s5-upload.js 의 _studioS6(wrapId) 로 패널 주입 (타 step 들과 다른 패턴) */
  if(STUDIO.project.step === 5 || STUDIO.project.step === 6){
    if(typeof _studioS6 === 'function') _studioS6('studioS5Wrap');
    return;
  }
  const fn = {
    0: (typeof _studioBindS0 !== 'undefined' ? _studioBindS0 : null),
    1: _studioBindS2,
    2: _studioBindS3,
    3: _studioBindS4
  }[STUDIO.project.step];
  if(typeof fn === 'function') fn();
}

/* ═════════════ STEP 0 대시보드 ═════════════ */
function _studioS0(){
  const p = STUDIO.project;
  const steps = [
    { n:1, icon:'📝', title:'대본 생성',          desc:'장르·주제·훅·길이 설정 → 대본 완성' },
    { n:2, icon:'🖼',  title:'이미지·영상 소스',    desc:'이미지 / AI 영상 프롬프트 / 직접 업로드 — 3가지 소스' },
    { n:3, icon:'🔊', title:'음성·BGM',           desc:'TTS 보이스·감정·BGM 선곡' },
    { n:4, icon:'✂️', title:'편집',               desc:'컷·자막·효과·전환' },
    { n:5, icon:'✅', title:'최종검수·업로드',    desc:'제목·해시태그·업로드 패키지' }
  ];
  const chLabel = (p.channel==='both'?'🇰🇷🇯🇵 동시':p.channel==='ja'?'🇯🇵 일본어':'🇰🇷 한국어');
  return '<div class="studio-panel">' +
    '<h4>🏠 자동숏츠 스튜디오 대시보드</h4>' +
    '<p class="sub">채널: <b>' + chLabel + '</b> · 아래 단계를 순서대로 진행하거나 원하는 단계로 바로 이동할 수 있어요.</p>' +
    '<div class="studio-dash" style="display:flex;flex-direction:column;gap:10px;margin-top:8px">' +
    steps.map(function(s){
      var active = (p.step === s.n);
      var done   = (p.step > s.n);
      return '<button onclick="studioGoto(' + s.n + ')" style="display:flex;align-items:center;gap:14px;padding:14px 18px;border:1.5px solid ' + (active?'var(--pink)':'var(--line)') + ';border-radius:14px;background:' + (done?'#e8f6ef':active?'var(--pink-soft)':'#fff') + ';cursor:pointer;text-align:left;font-family:inherit">' +
        '<div style="font-size:26px">' + s.icon + '</div>' +
        '<div style="flex:1">' +
          '<div style="font-size:14px;font-weight:900;color:' + (done?'#1a7a5a':active?'var(--pink)':'var(--text)') + '">' +
            (done?'✅ ':'') + 'STEP ' + s.n + '. ' + s.title +
          '</div>' +
          '<div style="font-size:12px;color:var(--sub);margin-top:2px">' + s.desc + '</div>' +
        '</div>' +
        '<span style="font-size:18px;color:var(--sub)">›</span>' +
      '</button>';
    }).join('') +
    '</div>' +
  '</div>';
}
function _studioBindS0(){ /* 순수 static 렌더 — 별도 바인딩 불필요 */ }

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

/* ═════════════ STEP 2 대본 (engines/script iframe) ═════════════ */
const SCRIPT_TABS = [
  {id:'gen',   label:'✨ 일반'}, {id:'batch', label:'🎬 배치'},
  {id:'lyric', label:'🎵 가사'}, {id:'saying',label:'📜 명언'},
  {id:'humor', label:'😄 유머'}, {id:'know',  label:'🔬 지식'},
  {id:'trivia',label:'🧩 잡학'}, {id:'drama', label:'🎭 드라마'},
  {id:'story', label:'💝 감동'}, {id:'hist',  label:'📁 히스토리'},
  {id:'preset',label:'⚙️ 프리셋'},{id:'B',    label:'🌐 일본'}
];
function _studioS2(){
  const p = STUDIO.project;
  const ch = p.channel;
  const curTab = p.s2.scriptTab || 'gen';
  const dual = p.channel === 'both';
  const tabs = '<div class="studio-iframe-tabs">' +
    SCRIPT_TABS.map(t => '<button class="' + (curTab===t.id?'on':'') + '" onclick="studioS2Tab(\'' + t.id + '\')">' + t.label + '</button>').join('') +
    '</div>';

  const iframeSingle = (qs) => '<div class="studio-iframe-wrap">' + tabs +
    '<iframe id="studio-script-iframe" src="engines/script/index.html?tab=' + qs + '&studio=1" title="script engine"></iframe>' +
    '</div>';
  const iframeDual =
    '<div class="studio-iframe-dual">' +
      '<div class="studio-iframe-wrap"><div style="padding:6px 10px;background:#fff5fa;font-weight:900;font-size:12px">🇰🇷 한국어</div>' +
        '<iframe src="engines/script/index.html?tab=' + curTab + '&lang=ko&studio=1" title="KO"></iframe></div>' +
      '<div class="studio-iframe-wrap"><div style="padding:6px 10px;background:#f7f4ff;font-weight:900;font-size:12px">🇯🇵 日本語</div>' +
        '<iframe src="engines/script/index.html?tab=' + curTab + '&lang=ja&studio=1" title="JA"></iframe></div>' +
    '</div>';

  return '<div class="studio-panel">' +
    '<h4>① 대본 생성 (대본 엔진 12탭 · 내부 임베드)</h4>' +
    '<p class="sub">' + (dual ? '한국어·일본어 나란히 동시 작성' : '대본 엔진의 12개 탭을 그대로 사용') + ' · 아래 엔진에서 바로 생성·확인하세요</p>' +

    // 상단: 채널 선택 (주제·길이 등 입력은 iframe 안에서 처리)
    '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">' +
      '<button class="studio-chip' + (ch==='ko'  ?' on':'') + '" onclick="studioSetChannel(\'ko\')">🇰🇷 한국어</button>' +
      '<button class="studio-chip' + (ch==='ja'  ?' on':'') + '" onclick="studioSetChannel(\'ja\')">🇯🇵 일본어</button>' +
      '<button class="studio-chip' + (ch==='both'?' on':'') + '" onclick="studioSetChannel(\'both\')">🇰🇷🇯🇵 동시</button>' +
    '</div>' +

    (dual ? tabs + iframeDual : iframeSingle(curTab)) +

    /* ── 🤖 AI 자동 검수 결과 영역 ── */
    (function(){
      var p2 = STUDIO.project.s2;
      var items = [
        {key:'hook', label:'훅 강도',      desc:'첫 3초 안에 시청자를 잡는가?'},
        {key:'lang', label:'시니어 이해도', desc:'쉬운 언어로 작성됐는가?'},
        {key:'cta',  label:'CTA 명확도',   desc:'구독·댓글 유도가 명확한가?'},
        {key:'flow', label:'전체 흐름',    desc:'자연스럽게 이어지는가?'}
      ];
      var sc = p2.viralScore || 0;
      var done = !!p2.review_done;
      var loading = !!p2.review_loading;
      var r = p2.review || {};

      var header =
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
          '<h4 style="margin:0">🤖 AI 자동 검수</h4>' +
          '<button class="studio-btn ghost" onclick="studioS2AiReview(false)" ' + (loading?'disabled':'') + '>' +
            (loading ? '⏳ 검수 중…' : (done ? '🔄 재검수' : '🤖 지금 검수')) +
          '</button>' +
        '</div>';

      if(!done && !loading){
        return '<div class="studio-panel" style="background:#fff5fa;margin-top:14px">' + header +
          '<p class="sub" style="margin:0">대본 엔진에서 대본을 생성하면 자동으로 검수가 시작됩니다. ' +
          '수동으로 실행하려면 오른쪽 <b>🤖 지금 검수</b> 버튼을 눌러주세요.</p>' +
        '</div>';
      }
      if(loading){
        return '<div class="studio-panel" style="background:#fff5fa;margin-top:14px">' + header +
          '<p class="sub" style="margin:0">⏳ AI가 대본을 분석하고 있어요… 잠시만 기다려주세요.</p>' +
        '</div>';
      }

      var rows = items.map(function(it){
        var d = r[it.key] || {};
        var isc = d.score || 0;
        var cur = (d.current || '').toString();
        var sug = (d.suggested || '').toString();
        var hasSwap = cur.trim() && sug.trim() && cur !== sug;
        var color = isc>=18 ? '#3a8a70' : isc>=12 ? '#b06020' : '#c2185b';
        return '<div style="border:1px solid #f1dce7;border-radius:12px;padding:10px 12px;margin-top:8px;background:#fff">' +
          '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<div><b style="font-size:13px">' + it.label + '</b> <span class="sub" style="font-size:11px">· ' + it.desc + '</span></div>' +
            '<div style="font-size:15px;font-weight:900;color:' + color + '">' + isc + '/25</div>' +
          '</div>' +
          (cur ? '<div style="margin-top:6px;padding:6px 8px;background:#fbf4f8;border-radius:8px;font-size:12px;line-height:1.5"><b>현재:</b> ' + cur.replace(/</g,'&lt;') + '</div>' : '') +
          (sug ? '<div style="margin-top:4px;padding:6px 8px;background:#eef8f3;border-radius:8px;font-size:12px;line-height:1.5"><b>추천:</b> ' + sug.replace(/</g,'&lt;') + '</div>' : '') +
          (hasSwap ? '<div style="margin-top:6px;text-align:right">' +
            '<button class="studio-btn ghost" style="padding:4px 10px;font-size:11px" onclick="studioS2ApplySuggestion(\'' + it.key + '\')">🔁 추천 문구로 교체</button>' +
          '</div>' : '') +
        '</div>';
      }).join('');

      var scColor = sc>=80 ? '#3a8a70' : sc>=70 ? '#b06020' : '#c2185b';
      var scMsg = sc>=80 ? '🎉 상위권 대본이에요 — 바로 다음 단계로!' :
                  sc>=70 ? '✅ 70점 이상 — 다음 단계 진행 가능해요' :
                  '⚠️ 70점 미만 — 대본을 수정 후 재검수하세요';

      return '<div class="studio-panel" style="background:#fff5fa;margin-top:14px">' + header +
        rows +
        '<div style="margin-top:12px;padding:10px 12px;border-radius:12px;background:#fff;border:1px solid #f1dce7;display:flex;justify-content:space-between;align-items:center">' +
          '<div><span class="sub" style="font-size:11px">종합 점수</span> <b style="font-size:22px;color:' + scColor + '">' + sc + '</b><span class="sub" style="font-size:11px">/100</span></div>' +
          '<div style="font-size:12px;font-weight:800;color:' + scColor + '">' + scMsg + '</div>' +
        '</div>' +
      '</div>';
    })() +

    /* ── 다음 버튼 (검수 완료 + 70점 이상일 때만 활성) ── */
    '<div class="studio-actions" style="justify-content:flex-end">' +
      (function(){
        var sc = STUDIO.project.s2.viralScore || 0;
        var done = !!STUDIO.project.s2.review_done;
        var disabled = !done || sc < 70;
        var tip = !done ? 'AI 검수 후 진행할 수 있어요' : (sc<70 ? '70점 이상이어야 진행할 수 있어요' : '');
        return '<button class="studio-btn pri" onclick="studioS2Next()"' +
          (disabled ? ' disabled style="opacity:0.4;cursor:not-allowed"' : '') +
          ' title="' + tip + '">' +
          '다음: 이미지 생성 →' +
          (disabled && done ? '<span style="display:block;font-size:10px;margin-top:2px;font-weight:600">현재 ' + sc + '점 · 70점 이상 필요</span>' : '') +
        '</button>';
      })() +
    '</div>' +
  '</div>';
}
function _studioBindS2(){ /* 주제/대본 입력은 iframe 안에서 처리 — 바인딩 불필요 */ }
function studioS2Tab(t){ STUDIO.project.s2.scriptTab = t; studioSave(); renderStudio(); }
async function studioS2AiGenerate(){
  try{
    const p = STUDIO.project;
    const sys = '한국 시니어 유튜브 숏츠 대본 작성. 장르: ' + p.s1.genre + ' / 길이: ' + p.s1.lengthSec + '초 / 분위기: ' + p.s1.mood + '. 6~8씬 구조 대본만 출력.';
    const user = '주제: ' + p.s1.topic;
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens:3500 });
    if(p.channel === 'ja'){ p.s2.scriptJa = res; }
    else { p.s2.scriptKo = res; }
    if(p.channel === 'both'){
      const sys2 = '위 한국어 대본을 자연스러운 일본어 경어체로 번역.';
      const ja = await APIAdapter.callWithFallback(sys2, res, { maxTokens:3500 });
      p.s2.scriptJa = ja;
    }
    /* 대본 생성 완료 후 자동 검수 시작 */
    setTimeout(function(){ studioS2AiReview(true); }, 800);
    studioSave(); renderStudio();
  }catch(e){ alert('❌ ' + e.message); }
}

/* ══════════ 🤖 대본 AI 자동 검수 ══════════ */
function _studioS2ReadScriptFromIframe(){
  try{
    var ifr = document.getElementById('studio-script-iframe');
    if(ifr && ifr.contentDocument){
      var ta = ifr.contentDocument.getElementById('out')
            || ifr.contentDocument.querySelector('textarea[readonly]')
            || ifr.contentDocument.querySelector('#pg-gen textarea');
      if(ta && ta.value) return ta.value;
    }
  }catch(e){ /* cross-origin 등 무시 */ }
  return '';
}
async function studioS2AiReview(isAuto){
  var p = STUDIO.project;
  var p2 = p.s2;

  /* 텍스트 확보: 상태 → iframe 순 */
  var text = (p2.scriptKo || p2.scriptJa || '').trim();
  if(!text) text = _studioS2ReadScriptFromIframe().trim();

  if(!text){
    if(!isAuto) alert('검수할 대본이 없어요. 엔진에서 대본을 먼저 생성해주세요.');
    return;
  }

  /* 상태에 저장 (재평가·다음 단계에서 재사용) */
  if(!p2.scriptKo && !p2.scriptJa){ p2.scriptKo = text; }

  p2.review_loading = true;
  p2.review_done = false;
  studioSave(); renderStudio();

  try{
    var sys =
      '당신은 한국 시니어 유튜브 숏츠 대본 품질 평가 전문가다. ' +
      '아래 대본을 4개 항목으로 평가하고, 각 항목마다 현재 문제 문장과 개선 추천 문장을 제시하라. ' +
      '각 항목은 25점 만점, 총점 100점. 반드시 JSON만 출력하라.\n\n' +
      'JSON 스키마:\n' +
      '{\n' +
      '  "hook": {"score":숫자(0-25),"current":"대본에서 실제로 발췌한 훅 문장","suggested":"더 강한 훅 문장"},\n' +
      '  "lang": {"score":숫자(0-25),"current":"시니어가 어려워할 문장 1개","suggested":"쉬운 말로 바꾼 문장"},\n' +
      '  "cta":  {"score":숫자(0-25),"current":"현재 CTA 문장(없으면 빈 문자열)","suggested":"더 명확한 CTA 문장"},\n' +
      '  "flow": {"score":숫자(0-25),"current":"흐름이 어색한 문장","suggested":"자연스럽게 고친 문장"},\n' +
      '  "top":"가장 시급한 개선 포인트 1줄"\n' +
      '}';
    var res = await APIAdapter.callWithFallback(sys, text.slice(0,5000), { maxTokens: 1200 });
    var m = res.match(/\{[\s\S]*\}/);
    if(!m) throw new Error('AI 응답 파싱 실패');
    var obj = JSON.parse(m[0]);

    var hook = obj.hook||{}, lang = obj.lang||{}, cta = obj.cta||{}, flow = obj.flow||{};
    var total = (hook.score||0) + (lang.score||0) + (cta.score||0) + (flow.score||0);

    p2.review = { hook:hook, lang:lang, cta:cta, flow:flow };
    p2.review_top = obj.top || '';
    p2.viralScore = total;
    p2.review_done = true;
    p2.review_loading = false;
    studioSave(); renderStudio();
  }catch(e){
    p2.review_loading = false;
    p2.review_done = false;
    studioSave(); renderStudio();
    if(!isAuto) alert('❌ 검수 실패: ' + e.message);
  }
}

/* 추천 문구로 대본 일괄 교체 + 재검수 */
function studioS2ApplySuggestion(key){
  var p2 = STUDIO.project.s2;
  var r = (p2.review || {})[key];
  if(!r || !r.current || !r.suggested){ alert('교체할 추천 문구가 없어요.'); return; }

  /* iframe 안 대본 편집 시도 → 실패 시 상태 대본 편집 */
  var replaced = false;
  try{
    var ifr = document.getElementById('studio-script-iframe');
    if(ifr && ifr.contentDocument){
      var ta = ifr.contentDocument.getElementById('out')
            || ifr.contentDocument.querySelector('textarea[readonly]')
            || ifr.contentDocument.querySelector('#pg-gen textarea');
      if(ta && ta.value && ta.value.indexOf(r.current) >= 0){
        ta.value = ta.value.split(r.current).join(r.suggested);
        ta.dispatchEvent(new Event('input', {bubbles:true}));
        replaced = true;
      }
    }
  }catch(e){ /* 동일 출처 아니면 무시 */ }

  if(!replaced){
    ['scriptKo','scriptJa'].forEach(function(k){
      if(p2[k] && p2[k].indexOf(r.current) >= 0){
        p2[k] = p2[k].split(r.current).join(r.suggested);
        replaced = true;
      }
    });
  }

  if(!replaced){ alert('대본에서 해당 문장을 찾지 못했어요. 수동으로 수정 후 재검수해주세요.'); return; }

  studioSave();
  /* 바로 재검수 */
  setTimeout(function(){ studioS2AiReview(true); }, 400);
}

function studioS2Next(){
  var p = STUDIO.project;
  var sc = p.s2.viralScore || 0;
  var done = p.s2.review_done;
  if(!done){
    alert('대본 AI 검수를 먼저 완료해주세요.\n생성된 대본이 있으면 자동으로 검수가 시작돼요.');
    return;
  }
  if(sc < 70){
    alert('바이럴 점수가 '+sc+'점이에요.\n70점 이상이어야 다음 단계로 진행할 수 있어요.\n\n개선 포인트: ' + (p.s2.review_top||'대본을 수정해주세요'));
    return;
  }
  p.step = 2;
  studioSave();
  renderStudio();
  window.scrollTo({top:0, behavior:'smooth'});
}


