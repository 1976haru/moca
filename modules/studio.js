/* modules/studio.js — index.html에서 분리된 숏츠 스튜디오 모듈
   의존: APIAdapter (core/api-adapter.js), window.mocaToast (shared/ui.js)
*/

/* ═══════════════════════════════════════════════════════════
   📱 숏츠 스튜디오 (자동숏츠 카테고리 내부)
   6단계 올인원 · 한일 동시 · 자동저장 · AI 전자동 모드
   ═══════════════════════════════════════════════════════════ */
const LS_STUDIO_LIST = 'uc_studio_projects';
const LS_STUDIO_ONE  = 'uc_studio_project_';

const STUDIO_GENRES = [
  {id:'info',     label:'📊 정보·지식형',      desc:'건강·상식·팁'},
  {id:'emotion',  label:'💝 감동 스토리',       desc:'사연·실화·편지'},
  {id:'tiki',     label:'🌍 티키타카',          desc:'대화·비교·배틀'},
  {id:'comic',    label:'😂 코믹 반전',         desc:'유머·웃음'},
  {id:'music',    label:'🎵 음악 추억',         desc:'노래·추억'},
  {id:'senior',   label:'👴 시니어 공감',       desc:'중년·노년'},
  {id:'drama',    label:'🎭 숏드라마',          desc:'몰입형 스토리'},
  {id:'trivia',   label:'🧩 잡학 트리비아',     desc:'궁금증 자극'},
  {id:'saying',   label:'📜 사자성어·명언',     desc:'지혜·교훈'},
  {id:'lyric',    label:'🎼 가사/음원',         desc:'Suno 프롬프트'}
];
const STUDIO_ART_STYLES = [
  ['ghibli','🌸 지브리'],['real','📸 실사'],['watercolor','🎨 수채화'],
  ['ukiyoe','🗾 우키요에'],['3d','🧊 3D CG'],['anime','✨ 애니'],
  ['webtoon','💬 웹툰'],['pixar','🎬 픽사'],['minimal','🖼 미니멀'],
  ['vintage','📷 빈티지'],['pop','🎭 팝아트'],['emoji','😊 이모지'],
  ['line','✏️ 라인아트'],['noir','🌑 느와르'],['pastel','🌷 파스텔'],
  ['info','📊 인포그래픽'],['painting','🖌 유화'],['sketch','📝 스케치']
];
const STUDIO_LIGHTING = [
  'soft natural','dramatic','cinematic','warm golden','cool blue',
  'studio portrait','backlit silhouette','neon','fog/mist'
];
const STUDIO_VOICE_KO = [
  {id:'senior-m', label:'시니어 남성', speed:0.9},
  {id:'senior-f', label:'시니어 여성', speed:0.9},
  {id:'mid-m',    label:'중년 남성',   speed:1.0},
  {id:'mid-f',    label:'중년 여성',   speed:1.0},
  {id:'young-m',  label:'청년 남성',   speed:1.05},
  {id:'young-f',  label:'청년 여성',   speed:1.05},
  {id:'anchor',   label:'아나운서',     speed:1.0},
  {id:'narrator', label:'내레이터',     speed:0.95}
];
const STUDIO_VOICE_JA = [
  {id:'yuki',     label:'Yuki (女性·温かみ)',  speed:0.92},
  {id:'aria',     label:'Aria (女性·信頼)',    speed:0.95},
  {id:'takeshi',  label:'Takeshi (男性·落ち着き)', speed:0.95},
  {id:'showa',    label:'Showa (昭和風)',       speed:0.9},
  {id:'keigo',    label:'敬語アナウンサー',      speed:1.0},
  {id:'kansai',   label:'関西方言',              speed:1.02}
];
const STUDIO_BGM = [
  'cinematic orchestral', 'soft piano', 'nostalgic piano',
  'lofi hip hop', 'upbeat fun', 'playful comedy',
  'dramatic tension', 'ambient calm', 'epic buildup',
  'jazz café', 'traditional Korean gayageum', '和風 traditional'
];
const STUDIO_TEMPLATES = [
  '정보카드형','시니어감동v1','티키타카배틀','스토리몰입','코믹반전',
  '인포그래픽','다큐멘터리','라이브스타일','매거진편집','감성네러티브'
];
const STUDIO_TRANSITIONS = ['페이드','슬라이드','줌','윕','디졸브','플래시','글리치','블러'];
const STUDIO_FILTERS = [
  '원본','따뜻한 톤','차가운 톤','흑백','세피아','비비드','로우키',
  '하이키','시네마','빈티지','투명 파스텔','드라마틱'
];
const STUDIO_FONTS_KO = [
  'Pretendard','Noto Sans KR','Black Han Sans','배달의민족 주아',
  '나눔바른고딕','가비아납작블록','cafe24아네모네','SUITE',
  '카페24단정해','아리따돋움','IM Hyemin','Gangwon'
];
const STUDIO_FONTS_JA = [
  'Noto Sans JP','M PLUS 1p','Kosugi Maru','Sawarabi Gothic',
  'Yuji Syuku (行書)','Zen Old Mincho','BIZ UDPGothic','DotGothic16',
  'New Tegomin','Reggae One','RocknRoll One','Shippori Mincho'
];

/* ─── 전역 상태 ─── */
const STUDIO = { project: null, autoSaveTimer: null };

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
    s7: { titles:[], hashtags:{ko:[],ja:[]}, scoreKo:{}, scoreJa:{}, suggestions:[] }
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
  { n:2, label:'② 이미지 생성' },
  { n:3, label:'③ 음성·BGM' },
  { n:4, label:'④ 편집' },
  { n:5, label:'⑤ 최종검수·업로드' }
];
function _studioStepperShell(){
  const cur = STUDIO.project.step;
  return '<div class="studio-progress"><div class="studio-steps">' +
    STUDIO_STEPS.map(s => '<button class="studio-step-pill ' + (s.n<cur?'done':s.n===cur?'current':'') + '" onclick="studioGoto(' + s.n + ')">' + s.label + '</button>').join('') +
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
  return ({
    0: _studioS0,   // 🏠 대시보드
    1: _studioS2,   // ① 대본 생성 (iframe 기반 script engine)
    2: _studioS3,   // ② 이미지 생성
    3: _studioS4,   // ③ 음성·BGM
    4: _studioS5,   // ④ 편집
    5: _studioS7    // ⑤ 최종검수·업로드
  }[n] || (()=>''))();
}
function _studioBindStep(){
  const fn = {
    0: (typeof _studioBindS0 !== 'undefined' ? _studioBindS0 : null),
    1: _studioBindS2,
    2: _studioBindS3,
    3: _studioBindS4,
    4: _studioBindS5,
    5: (typeof _studioBindS7 !== 'undefined' ? _studioBindS7 : null)
  }[STUDIO.project.step];
  if(typeof fn === 'function') fn();
}

/* ═════════════ STEP 0 대시보드 ═════════════ */
function _studioS0(){
  const p = STUDIO.project;
  const steps = [
    { n:1, icon:'📝', title:'대본 생성',          desc:'장르·주제·훅·길이 설정 → 대본 완성' },
    { n:2, icon:'🖼',  title:'이미지 생성',        desc:'화풍 18종·조명 9종 씬별 자동 생성' },
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

/* ═════════════ STEP 1 기획 (라벨은 '① 대본 생성' 이지만 본문은 기존 기획 유지 — 사용자가 조건부 재작성 보류) ═════════════ */
function _studioS1(){
  const p = STUDIO.project.s1;
  const ch = STUDIO.project.channel;
  const genreBtns = STUDIO_GENRES.map(g =>
    '<button class="studio-chip' + (p.genre===g.id?' on':'') + '" data-v="' + g.id + '" onclick="studioPickGenre(\'' + g.id + '\',this)">' + g.label + '</button>'
  ).join('');
  return '<div class="studio-panel">' +
    '<h4>① 기획 · 장르·주제·기본 설정</h4>' +
    '<p class="sub">채널: ' + (ch==='both'?'🇰🇷🇯🇵 동시':ch==='ja'?'🇯🇵 일본어':'🇰🇷 한국어') + ' · 여기서 언제든 바꿀 수 있어요.</p>' +
    '<div class="studio-chips">' +
      '<button class="studio-chip' + (ch==='ko'?' on':'') + '"   onclick="studioSetChannel(\'ko\')">🇰🇷 한국어</button>' +
      '<button class="studio-chip' + (ch==='ja'?' on':'') + '"   onclick="studioSetChannel(\'ja\')">🇯🇵 일본어</button>' +
      '<button class="studio-chip' + (ch==='both'?' on':'') + '" onclick="studioSetChannel(\'both\')">🇰🇷🇯🇵 동시</button>' +
    '</div>' +

    '<label class="studio-label">장르 (10종)</label>' +
    '<div class="studio-chips" id="s1-genres">' + genreBtns + '</div>' +

    '<label class="studio-label">주제 / 제목</label>' +
    '<input class="studio-in" id="s1-topic" placeholder="예: 치매 예방하는 음식 TOP5" value="' + (p.topic||'') + '">' +
    '<div class="studio-actions" style="margin-top:8px">' +
      '<button class="studio-btn ghost" onclick="studioAiSuggestTopics()">🤖 AI 주제 추천 5개</button>' +
      '<button class="studio-btn ghost" onclick="studioTrendTopics()">🔥 트렌드 주제</button>' +
    '</div>' +
    '<div id="s1-topic-out" style="margin-top:8px"></div>' +

    '<label class="studio-label">영상 길이</label>' +
    '<div class="studio-chips">' +
      [30,45,60,90,180].map(sec => '<button class="studio-chip' + (p.lengthSec===sec?' on':'') + '" onclick="studioSetLen(' + sec + ',this)">' + sec + '초</button>').join('') +
    '</div>' +

    '<div class="studio-row" style="margin-top:10px">' +
      '<div><label class="studio-label">시리즈 여부</label>' +
        '<select class="studio-in" id="s1-series"><option value="false" ' + (!p.series?'selected':'') + '>단편</option><option value="true" ' + (p.series?'selected':'') + '>시리즈 (여러 편 연결)</option></select>' +
      '</div>' +
      '<div><label class="studio-label">타겟 시청자</label>' +
        '<select class="studio-in" id="s1-target">' +
          ['일반','시니어(50+)','중년(40~50)','청년(20~30)','학부모','어린이','직장인'].map(x => '<option ' + (p.target===x?'selected':'') + '>' + x + '</option>').join('') +
        '</select>' +
      '</div>' +
      '<div><label class="studio-label">분위기</label>' +
        '<select class="studio-in" id="s1-mood">' +
          ['밝게','따뜻하게','진지하게','감동적으로','재미있게','긴장감있게','차분하게'].map(x => '<option ' + (p.mood===x?'selected':'') + '>' + x + '</option>').join('') +
        '</select>' +
      '</div>' +
    '</div>' +

    '<div class="studio-actions" style="margin-top:14px">' +
      '<button class="studio-btn ghost" onclick="studioPresetSave()">💾 이 설정 프리셋 저장</button>' +
      '<button class="studio-btn ghost" onclick="studioPresetLoad()">📂 프리셋 불러오기</button>' +
    '</div>' +

    '<div class="studio-actions" style="margin-top:14px;justify-content:flex-end">' +
      '<button class="studio-btn pri" onclick="studioS1Next()">다음: 대본 생성 →</button>' +
    '</div>' +
  '</div>';
}
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

/* ═════════════ STEP 3 이미지 ═════════════ */
function _studioS3(){
  const p  = STUDIO.project;
  const s3 = p.s3 || {};
  const s2 = p.s2 || {};
  const script = s2.scriptKo || s2.scriptJa || p.script || '';
  const scenes = s3.scenes || _studioS3ParseScenes(script);
  if(!s3.scenes){ s3.scenes = scenes; STUDIO.project.s3 = s3; }

  const api      = s3.api      || 'dalle3';
  const genMode  = s3.genMode  || 'balance';
  const sceneCount = scenes.length || 5;
  const costMap  = { dalle3:40, dalle2:8, flux:15, sd:3, gemini:0, minimax:10, ideogram:20 };
  const perScene = { save:1, balance:2, full:4, bg:1 }[genMode] || 2;
  const totalCost = (sceneCount * perScene + 3) * (costMap[api] || 40);

  const apiList = [
    { id:'dalle3',   name:'DALL-E 3',     price:'₩40/장', badge:'고품질'   },
    { id:'dalle2',   name:'DALL-E 2',     price:'₩8/장',  badge:'저렴'     },
    { id:'flux',     name:'Flux',         price:'₩15/장', badge:'시드고정' },
    { id:'sd',       name:'Stable Diff',  price:'₩3/장',  badge:'최저가'   },
    { id:'gemini',   name:'Gemini Imagen',price:'무료',   badge:'Gemini키' },
    { id:'minimax',  name:'MiniMax',      price:'₩10/장', badge:'영상특화' },
    { id:'ideogram', name:'Ideogram',     price:'₩20/장', badge:'텍스트↑'  },
  ];

  const artStyles = [
    ['ghibli','🌿 지브리'],['dslr','📷 실사'],['watercolor','🎨 수채화'],
    ['3dcg','💠 3D CG'],['anime','✨ 애니'],['webtoon','📱 웹툰'],
    ['popart','🎭 팝아트'],['minimal','⬜ 미니멀'],['vintage','📽 빈티지'],
    ['noir','🎞 노와르'],['pastel','🌸 파스텔'],['oilpaint','🖌 유화'],
    ['infographic','📊 인포'],['emoji','😊 이모지'],['sketch','✏️ 스케치'],
    ['ukiyo','🗻 우키요에'],
  ];
  const lighting = [
    'soft natural','dramatic','cinematic','warm golden',
    'cool blue','neon','fog/mist','backlit silhouette','studio portrait'
  ];
  const charPresets = [
    {id:'none',     label:'없음(배경중심)'},
    {id:'senior_f', label:'👵 시니어여성'},
    {id:'senior_m', label:'👴 시니어남성'},
    {id:'mid_f',    label:'👩 중년여성'},
    {id:'mid_m',    label:'👨 중년남성'},
    {id:'young',    label:'🧑 청년'},
    {id:'custom',   label:'✏️ 직접입력'},
  ];
  const genModes = [
    {id:'save',    label:'💰 절약형',   desc:'씬별 1장+썸네일1', est:(sceneCount+1)*(costMap[api]||40)},
    {id:'balance', label:'⚖️ 균형형',   desc:'씬별 2장+썸네일3', est:(sceneCount*2+3)*(costMap[api]||40)},
    {id:'full',    label:'🎨 풀옵션',   desc:'씬별 4장+썸네일5', est:(sceneCount*4+5)*(costMap[api]||40)},
    {id:'bg',      label:'🔄 배경교체', desc:'캐릭터1장+배경교체',est:(1+sceneCount)*(costMap[api]||40)},
  ];

  const keyMap   = {dalle3:'uc_openai_key',dalle2:'uc_openai_key',flux:'uc_flux_key',sd:'uc_sd_key',gemini:'uc_gemini_key',minimax:'uc_minimax_key',ideogram:'uc_ideogram_key'};
  const savedKey = localStorage.getItem(keyMap[api]||'uc_openai_key') || '';

  const apiHtml = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">' +
    apiList.map(function(a){
      var on = api===a.id;
      return '<button onclick="studioS3SetApi(\''+a.id+'\')" style="border:2px solid '+(on?'var(--pink)':'var(--line)')+';background:'+(on?'var(--pink-soft)':'#fff')+';border-radius:12px;padding:8px 12px;cursor:pointer;font-family:inherit;min-width:100px;transition:.15s;">' +
        '<div style="font-size:12px;font-weight:800;color:'+(on?'var(--pink)':'var(--text)')+'">'+a.name+'</div>' +
        '<div style="font-size:11px;color:var(--sub)">'+a.price+'</div>' +
        '<span style="font-size:10px;background:'+(on?'var(--pink)':'#eee')+';color:'+(on?'#fff':'#666')+';border-radius:999px;padding:1px 6px">'+a.badge+'</span>' +
      '</button>';
    }).join('') + '</div>';

  var reuseBarHtml = studioS3ReuseBar();
  var stockBarHtml = studioS3StockBar();

  const scenesHtml = scenes.map(function(sc, idx){
    var img     = (s3.images  || [])[idx];
    var adopted = (s3.adopted || [])[idx];
    return '<div style="background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:10px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
        '<div style="font-size:13px;font-weight:800">씬 '+(idx+1)+' — '+sc.label+'</div>' +
        '<div style="font-size:11px;color:var(--sub)">'+sc.time+'</div>' +
      '</div>' +
      '<textarea id="s3-prompt-'+idx+'" style="width:100%;border:1.5px solid var(--line);border-radius:8px;padding:8px;font-size:11px;resize:vertical;min-height:48px;font-family:inherit" placeholder="AI 프롬프트 (영어 자동생성 → 수정 가능)">'+(s3.prompts&&s3.prompts[idx]?s3.prompts[idx]:sc.prompt||'')+'</textarea>' +
      '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">' +
        '<button onclick="studioS3GenScene('+idx+')" class="studio-btn ghost" style="font-size:12px">🎨 AI생성</button>' +
        '<button onclick="studioS3RegenScene('+idx+')" class="studio-btn ghost" style="font-size:12px">🔄 재생성</button>' +
        '<button onclick="studioS3AutoPrompt('+idx+')" class="studio-btn ghost" style="font-size:12px">🤖 프롬프트 AI생성</button>' +
        '<label style="cursor:pointer"><span class="studio-btn ghost" style="font-size:12px;padding:6px 12px">📁 내 사진 사용</span><input type="file" accept="image/*" style="display:none" onchange="studioS3UploadScene('+idx+', this)"></label>' +
      '</div>' +
      (img ?
        '<div style="margin-top:10px">' +
          '<img src="'+img+'" style="width:100%;max-height:180px;object-fit:cover;border-radius:10px;border:1px solid var(--line)">' +
          '<div style="display:flex;gap:6px;margin-top:6px">' +
            '<button onclick="studioS3Adopt('+idx+',true)" style="flex:1;border:none;border-radius:999px;padding:7px;font-size:12px;font-weight:800;cursor:pointer;background:'+(adopted?'#27ae60':'#eee')+';color:'+(adopted?'#fff':'#666')+'">'+(adopted?'✅ 채택됨':'✅ 채택')+'</button>' +
            '<button onclick="studioS3Adopt('+idx+',false)" style="flex:1;border:none;border-radius:999px;padding:7px;font-size:12px;font-weight:800;cursor:pointer;background:#eee;color:#666">⬜ 건너뜀</button>' +
            '<button onclick="studioS3SaveLib('+idx+')" style="flex:1;border:none;border-radius:999px;padding:7px;font-size:12px;font-weight:800;cursor:pointer;background:#eee;color:#666">📁 라이브러리</button>' +
          '</div>' +
        '</div>'
      : '<div style="margin-top:8px;background:#f8f8f8;border-radius:10px;height:80px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#bbb">이미지 생성 전</div>') +
    '</div>';
  }).join('');

  return '<div class="studio-panel">' +

    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">' +
      '<div><h4 style="margin:0 0 2px">② 이미지 생성</h4><div style="font-size:12px;color:var(--sub)">씬별 이미지 + 썸네일 · 내 사진 업로드 가능</div></div>' +
      '<div style="text-align:right"><div style="font-size:11px;color:var(--sub)">예상비용</div><div style="font-size:20px;font-weight:900;color:var(--pink)">₩'+totalCost+'</div></div>' +
    '</div>' +

    '<div class="studio-section"><div class="studio-label">🤖 A. 이미지 API 선택</div>' +
    apiHtml +
    '<div style="display:flex;gap:8px"><input id="s3-api-key" type="password" class="studio-in" style="flex:1" placeholder="API 키" value="'+savedKey+'"><button onclick="studioS3SaveKey()" class="studio-btn ghost">저장</button></div></div>' +

    '<div class="studio-section"><div class="studio-label">🎨 B. 화풍 선택</div>' +
    '<div class="studio-chips" id="s3-art">' +
    artStyles.map(function(a){ return '<button class="studio-chip'+(s3.artStyle===a[0]?' on':'')+'" onclick="studioS3Art(\''+a[0]+'\',this)">'+a[1]+'</button>'; }).join('') +
    '</div><div class="studio-label" style="margin-top:10px">💡 조명·분위기</div>' +
    '<div class="studio-chips" id="s3-light">' +
    lighting.map(function(l){ return '<button class="studio-chip'+(s3.lighting===l?' on':'')+'" onclick="studioS3Light(\''+l+'\',this)">'+l+'</button>'; }).join('') +
    '</div><div class="studio-label" style="margin-top:10px">🌏 채널 감성</div>' +
    '<div style="display:flex;gap:8px">' +
    ['🇰🇷 한국','🇯🇵 일본','🌐 중립'].map(function(c,i){ var v=['ko','ja','neutral'][i]; return '<button class="studio-chip'+(s3.channelStyle===v?' on':'')+'" onclick="studioS3Style(\''+v+'\',this)">'+c+'</button>'; }).join('') +
    '</div></div>' +

    '<div class="studio-section"><div class="studio-label">👤 C. 캐릭터 일관성</div>' +
    '<div class="studio-chips">' +
    charPresets.map(function(c){ return '<button class="studio-chip'+(s3.charPreset===c.id?' on':'')+'" onclick="studioS3Char(\''+c.id+'\',this)">'+c.label+'</button>'; }).join('') +
    '</div>' +
    (s3.charPreset==='custom'?'<textarea id="s3-char-custom" class="studio-in" style="margin-top:8px;min-height:44px" placeholder="예: 60대 한국 여성, 흰머리, 안경">'+(s3.charCustom||'')+'</textarea>':'') +
    '<div style="display:flex;align-items:center;gap:10px;margin-top:10px">' +
    '<label style="font-size:13px;font-weight:700">🔒 시드 고정</label>' +
    '<input type="checkbox" '+(s3.seedFixed?'checked':'')+' onchange="studioS3SeedToggle(this.checked)" style="width:16px;height:16px;accent-color:var(--pink)">' +
    '<span style="font-size:11px;color:var(--sub)">Flux·SD에서 동작</span></div></div>' +

    '<div class="studio-section"><div class="studio-label">⚡ D. 생성 방식</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
    genModes.map(function(m){ var on=genMode===m.id; return '<button onclick="studioS3Mode(\''+m.id+'\')" style="border:2px solid '+(on?'var(--pink)':'var(--line)')+';background:'+(on?'var(--pink-soft)':'#fff')+';border-radius:12px;padding:10px 14px;cursor:pointer;font-family:inherit;text-align:left;transition:.15s"><div style="font-size:13px;font-weight:800;color:'+(on?'var(--pink)':'var(--text)')+'">'+m.label+'</div><div style="font-size:11px;color:var(--sub)">'+m.desc+'</div><div style="font-size:12px;font-weight:700;color:'+(on?'var(--pink)':'var(--sub)')+'">~₩'+m.est+'</div></button>'; }).join('') +
    '</div></div>' +

    '<div class="studio-section">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
    '<div class="studio-label" style="margin:0">🖼 E. 씬별 이미지 생성</div>' +
    '<div style="display:flex;gap:6px">' +
    '<button onclick="studioS3GenAll()" class="studio-btn pri" style="font-size:12px">⚡ 전체 AI생성</button>' +
    '<label style="cursor:pointer"><span class="studio-btn ghost" style="font-size:12px;padding:8px 12px">📂 내 사진 일괄업로드</span><input type="file" accept="image/*" multiple style="display:none" onchange="studioS3UploadBatch(this)"></label>' +
    '</div></div>' +
    '<div style="font-size:11px;color:var(--sub);margin-bottom:10px">💡 내 사진을 씬 순서대로 선택하면 자동 배정 · 비용 ₩0</div>' +
    reuseBarHtml + stockBarHtml + scenesHtml + '</div>' +

    '<div class="studio-section"><div class="studio-label">🖼 F. 썸네일 생성</div>' +
    '<input id="s3-thumb-title" class="studio-in" placeholder="썸네일 제목" value="'+(s3.thumbTitle||'')+'" style="margin-bottom:8px">' +
    '<div class="studio-chips" style="margin-bottom:10px">' +
    ['충격형','감성형','정보형','호기심형','숫자형'].map(function(t){ return '<button class="studio-chip'+(s3.thumbStyle===t?' on':'')+'" onclick="studioS3ThumbStyle(\''+t+'\',this)">'+t+'</button>'; }).join('') +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
    ['A','B','C'].map(function(v){ var img=s3['thumb'+v]; return '<div style="flex:1"><button onclick="studioS3GenThumb(\''+v+'\')" style="width:100%;border:1.5px dashed var(--line);background:#f8f8f8;border-radius:10px;padding:12px;cursor:pointer;font-size:12px;font-weight:700;color:var(--sub)">'+(img?'<img src="'+img+'" style="width:100%;border-radius:8px">':'🖼 썸네일 '+v+'안')+'</button></div>'; }).join('') +
    '</div>' +
    '<label style="cursor:pointer;display:inline-block;margin-top:8px"><span class="studio-btn ghost" style="font-size:12px">📁 내 사진으로 썸네일</span><input type="file" accept="image/*" style="display:none" onchange="studioS3UploadThumb(this)"></label></div>' +

    '<div class="studio-section"><div class="studio-label">📁 G. 이미지 라이브러리</div>' +
    '<div style="font-size:12px;color:var(--sub);margin-bottom:8px">저장한 이미지 재사용 → 비용 절감</div>' +
    '<button onclick="studioS3OpenLib()" class="studio-btn ghost" style="font-size:12px">📂 라이브러리 열기</button></div>' +

    '<div class="studio-actions" style="justify-content:space-between;margin-top:14px">' +
    '<button class="studio-btn ghost" onclick="studioGoto(1)">← 대본</button>' +
    '<button class="studio-btn pri" onclick="studioS3Next()">다음: 음성·BGM →</button>' +
    '</div>' +
  '</div>';
}

function _studioS3ParseScenes(script){
  var defaults = [
    {label:'훅 장면',   time:'0~3초',   desc:'시청자 시선 잡기', prompt:''},
    {label:'설명 장면', time:'3~20초',  desc:'핵심 내용 소개',   prompt:''},
    {label:'핵심 장면', time:'20~45초', desc:'중요 정보 전달',   prompt:''},
    {label:'강조 장면', time:'45~55초', desc:'포인트 강조',       prompt:''},
    {label:'CTA 장면',  time:'55~60초', desc:'구독·댓글 유도',   prompt:''},
  ];
  if(!script || script.length < 50) return defaults;
  var lines = script.split('\n').filter(function(l){ return l.trim(); });
  var scenePattern = /^[【\[]?씬\s*(\d+)[】\]]?|^SCENE\s*(\d+)/i;
  var sceneLines = [];
  var cur = null;
  lines.forEach(function(line){
    var m = line.match(scenePattern);
    if(m){
      if(cur) sceneLines.push(cur);
      cur = {label:'씬'+(m[1]||m[2]), lines:[], time:'', desc:'', prompt:''};
    } else if(cur){
      cur.lines.push(line);
    }
  });
  if(cur) sceneLines.push(cur);
  if(sceneLines.length >= 3){
    return sceneLines.slice(0,7).map(function(s,i){
      var times = ['0~3초','3~15초','15~35초','35~50초','50~58초','58~60초'];
      s.desc = s.lines.slice(0,2).join(' ').slice(0,60);
      s.time = times[i] || '';
      return s;
    });
  }
  var paras = [];
  var buf = [];
  lines.forEach(function(line){
    if(line.trim() === '' && buf.length){
      paras.push(buf.join(' '));
      buf = [];
    } else {
      buf.push(line.trim());
    }
  });
  if(buf.length) paras.push(buf.join(' '));
  if(paras.length >= 3){
    var count = paras.length >= 5 ? 5 : paras.length;
    var chunk = Math.ceil(paras.length / count);
    var sceneLabels = ['훅 장면','설명 장면','핵심 장면','강조 장면','CTA 장면'];
    var sceneTimes  = ['0~3초','3~20초','20~45초','45~55초','55~60초'];
    var result = [];
    for(var i=0; i<count; i++){
      var group = paras.slice(i*chunk, (i+1)*chunk);
      result.push({
        label: sceneLabels[i] || ('씬'+(i+1)),
        time:  sceneTimes[i]  || '',
        desc:  group[0] ? group[0].slice(0,60) : '',
        prompt: '',
        lines: group
      });
    }
    return result;
  }
  return defaults;
}

function _studioBindS3(){}

function studioS3SetApi(api){
  STUDIO.project.s3 = STUDIO.project.s3 || {};
  STUDIO.project.s3.api = api;
  studioSave(); renderStudio();
}

function studioS3Art(id, btn){
  STUDIO.project.s3 = STUDIO.project.s3 || {};
  STUDIO.project.s3.artStyle = id;
  document.querySelectorAll('#s3-art .studio-chip').forEach(function(b){ b.classList.remove('on'); });
  if(btn) btn.classList.add('on');
  studioSave();
}

function studioS3Light(val, btn){
  STUDIO.project.s3 = STUDIO.project.s3 || {};
  STUDIO.project.s3.lighting = val;
  document.querySelectorAll('#s3-light .studio-chip').forEach(function(b){ b.classList.remove('on'); });
  if(btn) btn.classList.add('on');
  studioSave();
}

function studioS3Style(val, btn){
  STUDIO.project.s3 = STUDIO.project.s3 || {};
  STUDIO.project.s3.channelStyle = val;
  studioSave(); renderStudio();
}

function studioS3Char(id, btn){
  STUDIO.project.s3 = STUDIO.project.s3 || {};
  STUDIO.project.s3.charPreset = id;
  studioSave(); renderStudio();
}

function studioS3SeedToggle(val){
  STUDIO.project.s3 = STUDIO.project.s3 || {};
  STUDIO.project.s3.seedFixed = val;
  studioSave();
}

function studioS3Mode(mode){
  STUDIO.project.s3 = STUDIO.project.s3 || {};
  STUDIO.project.s3.genMode = mode;
  studioSave(); renderStudio();
}

function studioS3SaveKey(){
  var key = document.getElementById('s3-api-key')?.value || '';
  var api = STUDIO.project.s3?.api || 'dalle3';
  var keyMap = {dalle3:'uc_openai_key',dalle2:'uc_openai_key',flux:'uc_flux_key',sd:'uc_sd_key',gemini:'uc_gemini_key',minimax:'uc_minimax_key',ideogram:'uc_ideogram_key'};
  localStorage.setItem(keyMap[api]||'uc_openai_key', key);
  if(typeof ucShowToast==='function') ucShowToast('✅ API 키 저장됨','success');
  else if(typeof window.mocaToast==='function') window.mocaToast('✅ API 키 저장됨','ok');
}

async function studioS3AutoPrompt(idx){
  var s3 = STUDIO.project.s3 || {};
  var scenes = s3.scenes || [];
  var sc = scenes[idx]; if(!sc) return;
  var script = STUDIO.project.s2?.scriptKo || STUDIO.project.s2?.scriptJa || '';
  var sys = 'Stable Diffusion image prompt expert. Answer in English only.';
  var user = 'Scene: '+sc.label+' ('+sc.time+')\nScript: '+script.slice(0,200)+'\nArt style: '+(s3.artStyle||'ghibli')+'\nWrite image prompt in 50 words or less.';
  try {
    var res = await APIAdapter.callWithFallback(sys, user, {maxTokens:150});
    s3.prompts = s3.prompts || [];
    s3.prompts[idx] = res.trim();
    STUDIO.project.s3 = s3; studioSave();
    var el = document.getElementById('s3-prompt-'+idx);
    if(el) el.value = res.trim();
    if(typeof ucShowToast==='function') ucShowToast('✅ 프롬프트 생성됨','success');
  } catch(e){ alert('오류: '+e.message); }
}

async function studioS3AutoAllPrompts(){
  var scenes = STUDIO.project.s3?.scenes || _studioS3ParseScenes('');
  for(var i=0;i<scenes.length;i++){
    await studioS3AutoPrompt(i);
    await new Promise(function(r){ setTimeout(r,500); });
  }
}

async function studioS3GenScene(idx){
  var s3 = STUDIO.project.s3 || {};
  var api = s3.api || 'dalle3';
  var prompt = (document.getElementById('s3-prompt-'+idx)?.value || '').trim();
  if(!prompt){ alert('프롬프트를 입력하거나 🤖 AI생성 버튼을 누르세요'); return; }
  var fullPrompt = prompt + (s3.artStyle?', '+s3.artStyle+' style':'') + (s3.lighting?', '+s3.lighting+' lighting':'') + ', high quality';
  try {
    if(api==='dalle3'||api==='dalle2'){
      var key = localStorage.getItem('uc_openai_key')||'';
      if(!key){ alert('OpenAI API 키를 입력해주세요'); return; }
      if(typeof ucShowToast==='function') ucShowToast('⏳ 이미지 생성 중...','info');
      var r = await fetch('https://api.openai.com/v1/images/generations',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
        body:JSON.stringify({model:api==='dalle3'?'dall-e-3':'dall-e-2',prompt:fullPrompt,n:1,size:'1024x1024'})
      });
      var d = await r.json();
      var url = d?.data?.[0]?.url;
      if(!url) throw new Error(JSON.stringify(d));
      s3.images = s3.images||[]; s3.images[idx] = url;
      STUDIO.project.s3 = s3; studioSave(); renderStudio();
      if(typeof ucShowToast==='function') ucShowToast('✅ 이미지 생성 완료','success');
    } else {
      if(typeof ucShowToast==='function') ucShowToast('⏳ '+api+' 연동 준비 중...','info');
    }
  } catch(e){ alert('이미지 생성 오류: '+e.message); }
}

function studioS3RegenScene(idx){
  var s3 = STUDIO.project.s3||{};
  s3.images = s3.images||[]; s3.images[idx] = null;
  STUDIO.project.s3 = s3; studioSave();
  studioS3GenScene(idx);
}

async function studioS3GenAll(){
  var scenes = STUDIO.project.s3?.scenes || _studioS3ParseScenes('');
  for(var i=0;i<scenes.length;i++){
    await studioS3GenScene(i);
    await new Promise(function(r){ setTimeout(r,1000); });
  }
}

function studioS3UploadScene(idx, input){
  var file = input.files[0]; if(!file) return;
  var reader = new FileReader();
  reader.onload = function(e){
    var s3 = STUDIO.project.s3||{};
    s3.images = s3.images||[]; s3.images[idx] = e.target.result;
    s3.adopted = s3.adopted||[]; s3.adopted[idx] = true;
    STUDIO.project.s3 = s3; studioSave(); renderStudio();
    if(typeof ucShowToast==='function') ucShowToast('✅ 씬'+(idx+1)+' 사진 업로드 완료','success');
  };
  reader.readAsDataURL(file);
}

function studioS3UploadBatch(input){
  var files = Array.from(input.files); if(!files.length) return;
  var s3 = STUDIO.project.s3||{};
  s3.images = s3.images||[]; s3.adopted = s3.adopted||[];
  var scenes = s3.scenes || _studioS3ParseScenes('');
  var total = Math.min(files.length, scenes.length);
  var done = 0;
  files.slice(0,total).forEach(function(file,idx){
    var reader = new FileReader();
    reader.onload = function(e){
      s3.images[idx] = e.target.result;
      s3.adopted[idx] = true;
      done++;
      if(done===total){
        STUDIO.project.s3 = s3; studioSave(); renderStudio();
        var msg = '✅ '+total+'장 업로드 완료';
        if(files.length>scenes.length) msg += ' (초과 '+(files.length-scenes.length)+'장 무시)';
        if(files.length<scenes.length) msg += ' · 나머지 '+(scenes.length-files.length)+'씬은 AI 생성하세요';
        if(typeof ucShowToast==='function') ucShowToast(msg,'success');
      }
    };
    reader.readAsDataURL(file);
  });
}

function studioS3UploadThumb(input){
  var file = input.files[0]; if(!file) return;
  var reader = new FileReader();
  reader.onload = function(e){
    var s3 = STUDIO.project.s3||{};
    s3.thumbA = e.target.result;
    STUDIO.project.s3 = s3; studioSave(); renderStudio();
    if(typeof ucShowToast==='function') ucShowToast('✅ 썸네일 업로드 완료','success');
  };
  reader.readAsDataURL(file);
}

function studioS3Adopt(idx, val){
  var s3 = STUDIO.project.s3||{};
  s3.adopted = s3.adopted||[]; s3.adopted[idx] = val;
  STUDIO.project.s3 = s3; studioSave(); renderStudio();
}

function studioS3SaveLib(idx){
  var s3 = STUDIO.project.s3||{};
  var img = (s3.images||[])[idx];
  if(!img){ alert('먼저 이미지를 생성해주세요'); return; }
  var lib = JSON.parse(localStorage.getItem('uc_img_library')||'[]');
  lib.push({url:img, savedAt:new Date().toISOString(), style:s3.artStyle});
  localStorage.setItem('uc_img_library', JSON.stringify(lib.slice(-50)));
  if(typeof ucShowToast==='function') ucShowToast('📁 라이브러리에 저장됨','success');
}

function studioS3OpenLib(){
  var lib = JSON.parse(localStorage.getItem('uc_img_library')||'[]');
  var overlay = document.createElement('div');
  overlay.id = 'img-lib-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
  var box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:20px;width:100%;max-width:700px;max-height:80vh;overflow-y:auto;padding:20px';
  var header = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px"><div style="font-size:16px;font-weight:900">📁 이미지 라이브러리</div><button onclick="document.getElementById(\'img-lib-overlay\').remove()" style="border:none;background:#eee;border-radius:999px;padding:6px 14px;cursor:pointer;font-weight:700">닫기</button></div>';
  var content = '';
  if(!lib.length){
    content = '<div style="text-align:center;padding:40px;color:#bbb"><div style="font-size:40px;margin-bottom:10px">📭</div><div style="font-size:14px;font-weight:700">저장된 이미지가 없어요</div><div style="font-size:12px;margin-top:6px">씬 이미지 생성 후 📁 버튼을 눌러 저장하세요</div></div>';
  } else {
    content = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">' +
      lib.map(function(item, idx){
        var date = item.savedAt ? new Date(item.savedAt).toLocaleDateString('ko-KR') : '';
        return '<div style="border:1px solid #eee;border-radius:12px;overflow:hidden">' +
          '<img src="'+item.url+'" style="width:100%;height:120px;object-fit:cover;display:block">' +
          '<div style="padding:8px">' +
            '<div style="font-size:11px;color:#999;margin-bottom:6px">'+date+(item.style?' · '+item.style:'')+'</div>' +
            '<div style="display:flex;gap:4px">' +
              '<button onclick="studioS3LibUse('+idx+')" style="flex:1;border:none;background:var(--pink);color:#fff;border-radius:999px;padding:5px;font-size:11px;font-weight:700;cursor:pointer">씬에 사용</button>' +
              '<button onclick="studioS3LibDelete('+idx+')" style="border:none;background:#eee;border-radius:999px;padding:5px 8px;font-size:11px;cursor:pointer">🗑</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
  }
  box.innerHTML = header + content;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

async function studioS3ExtractScenes(){
  var p = STUDIO.project;
  var s3 = p.s3 || {};
  var script = (p.s2 && (p.s2.scriptKo || p.s2.scriptJa)) || p.script || '';
  if(!script || script.length < 100){
    s3.scenes = _studioS3ParseScenes(script);
    STUDIO.project.s3 = s3; studioSave(); return;
  }
  if(s3.scenes && s3.scenes.length && s3.scenesFromScript === script.slice(0,100)) return;
  var sys = '유튜브 숏츠 대본 분석 전문가. JSON만 출력. 설명 없음.';
  var user = '아래 대본을 3~6개 씬으로 분석해서 JSON 배열로 반환해줘.\n형식: [{"label":"씬 이름","time":"시간대","desc":"씬 내용 한 줄 설명","prompt":""}]\n시간대 예시: 0~3초, 3~20초\n대본:\n' + script.slice(0,2000);
  try {
    var res = await APIAdapter.callWithFallback(sys, user, {maxTokens:800});
    var m = res.match(/\[[\s\S]*\]/);
    if(m){
      var arr = JSON.parse(m[0]);
      if(arr && arr.length >= 2){
        s3.scenes = arr;
        s3.scenesFromScript = script.slice(0,100);
        STUDIO.project.s3 = s3; studioSave(); renderStudio();
        if(typeof ucShowToast==='function') ucShowToast('✅ 씬 '+arr.length+'개 자동 추출 완료','success');
        return;
      }
    }
  } catch(e){ console.warn('씬 AI 추출 실패:', e.message); }
  s3.scenes = _studioS3ParseScenes(script);
  STUDIO.project.s3 = s3; studioSave();
}

function studioS3LibUse(idx){
  var lib = JSON.parse(localStorage.getItem('uc_img_library')||'[]');
  var item = lib[idx]; if(!item) return;
  var s3 = STUDIO.project.s3 || {};
  s3.images = s3.images || [];
  var emptyIdx = s3.images.findIndex(function(img){ return !img; });
  if(emptyIdx === -1) emptyIdx = 0;
  s3.images[emptyIdx] = item.url;
  s3.adopted = s3.adopted || [];
  s3.adopted[emptyIdx] = true;
  STUDIO.project.s3 = s3; studioSave();
  document.getElementById('img-lib-overlay')?.remove();
  renderStudio();
  if(typeof ucShowToast==='function') ucShowToast('✅ 씬'+(emptyIdx+1)+'에 적용됐어요','success');
}

function studioS3LibDelete(idx){
  var lib = JSON.parse(localStorage.getItem('uc_img_library')||'[]');
  lib.splice(idx, 1);
  localStorage.setItem('uc_img_library', JSON.stringify(lib));
  document.getElementById('img-lib-overlay')?.remove();
  studioS3OpenLib();
}

function studioS3ThumbStyle(val, btn){
  STUDIO.project.s3 = STUDIO.project.s3||{};
  STUDIO.project.s3.thumbStyle = val;
  studioSave();
}

async function studioS3GenThumb(variant){
  var s3 = STUDIO.project.s3||{};
  var title = document.getElementById('s3-thumb-title')?.value||'';
  var key = localStorage.getItem('uc_openai_key')||'';
  if(!key){ alert('OpenAI API 키를 입력해주세요'); return; }
  if(!title){ alert('썸네일 제목을 입력해주세요'); return; }
  if(typeof ucShowToast==='function') ucShowToast('⏳ 썸네일 '+variant+'안 생성 중...','info');
  try {
    var styleMap = {충격형:'shocking dramatic',감성형:'emotional warm',정보형:'informative clean',호기심형:'mysterious curious',숫자형:'bold numbers'};
    var prm = 'YouTube thumbnail, bold text "'+title+'", '+(styleMap[s3.thumbStyle]||'')+(s3.artStyle?', '+s3.artStyle+' style':'')+', 16:9, high quality';
    var r = await fetch('https://api.openai.com/v1/images/generations',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body:JSON.stringify({model:'dall-e-3',prompt:prm,n:1,size:'1792x1024'})
    });
    var d = await r.json();
    var url = d?.data?.[0]?.url;
    if(!url) throw new Error(JSON.stringify(d));
    s3['thumb'+variant] = url;
    STUDIO.project.s3 = s3; studioSave(); renderStudio();
    if(typeof ucShowToast==='function') ucShowToast('✅ 썸네일 '+variant+'안 완료','success');
  } catch(e){ alert('썸네일 생성 오류: '+e.message); }
}

function studioS3Next(){
  var s3 = STUDIO.project.s3||{};
  var hasImg = (s3.images||[]).some(function(i){ return !!i; });
  if(!hasImg && !confirm('이미지 없이 다음 단계로 진행할까요?')) return;
  STUDIO.project.step = 3;
  studioSave(); renderStudio();
  window.scrollTo({top:0,behavior:'smooth'});
}

/* 하위 호환 */
async function studioS3GenScenes(){ studioS3GenAll(); }
async function studioS3GenThumbs(){ studioS3GenThumb('A'); }
function studioS3Regen(i){ studioS3RegenScene(i); }

/* ═════════════ STEP 4 음성·BGM ═════════════ */
function _studioS4(){
  const p = STUDIO.project;
  const ch = p.channel;
  const s4 = p.s4;
  return '<div class="studio-panel">' +
    '<h4>④ 음성 · BGM</h4>' +
    (ch!=='ja' ? '<label class="studio-label">🇰🇷 한국어 나레이터 (8종)</label>' +
      '<div class="studio-chips">' +
        STUDIO_VOICE_KO.map(v => '<button class="studio-chip' + (s4.voiceKo===v.id?' on':'') + '" onclick="studioS4VoiceKo(\'' + v.id + '\',this)">' + v.label + '</button>').join('') +
      '</div>' : '') +

    (ch!=='ko' ? '<label class="studio-label">🇯🇵 일본어 나레이터 (6종)</label>' +
      '<div class="studio-chips">' +
        STUDIO_VOICE_JA.map(v => '<button class="studio-chip' + (s4.voiceJa===v.id?' on':'') + '" onclick="studioS4VoiceJa(\'' + v.id + '\',this)">' + v.label + '</button>').join('') +
      '</div>' : '') +

    '<div class="studio-row" style="margin-top:10px">' +
      '<div><label class="studio-label">속도 (' + s4.speed + 'x)</label><input type="range" min="0.7" max="1.3" step="0.05" value="' + s4.speed + '" oninput="STUDIO.project.s4.speed=parseFloat(this.value);studioSave();document.querySelector(\'#s4-speed-lbl\').textContent=this.value+\'x\'" style="width:100%"><span id="s4-speed-lbl" style="font-size:11px;color:var(--sub)">' + s4.speed + 'x</span></div>' +
      '<div><label class="studio-label">감정</label><select class="studio-in" id="s4-emotion">' +
        ['중립','따뜻함','강함','밝음','감동','긴장'].map(x => '<option ' + (s4.emotion===x?'selected':'') + '>' + x + '</option>').join('') +
      '</select></div>' +
      '<div><label class="studio-label">음높이</label><input type="range" min="-5" max="5" step="1" value="' + s4.pitch + '" oninput="STUDIO.project.s4.pitch=parseInt(this.value,10);studioSave()" style="width:100%"></div>' +
    '</div>' +

    '<label class="studio-label">🎵 BGM (12종)</label>' +
    '<div class="studio-chips">' +
      STUDIO_BGM.map(b => '<button class="studio-chip' + (s4.bgm===b?' on':'') + '" onclick="studioS4Bgm(\'' + b + '\',this)">' + b + '</button>').join('') +
    '</div>' +
    '<label class="studio-label">BGM 볼륨 (' + s4.bgmVolume + '%)</label>' +
    '<input type="range" min="0" max="50" value="' + s4.bgmVolume + '" oninput="STUDIO.project.s4.bgmVolume=parseInt(this.value,10);studioSave()" style="width:100%">' +

    '<div class="studio-actions" style="justify-content:space-between">' +
      '<button class="studio-btn ghost" onclick="studioGoto(2)">← 이전</button>' +
      '<button class="studio-btn pri" onclick="studioGoto(4)">다음: 편집 →</button>' +
    '</div>' +
  '</div>';
}
function _studioBindS4(){
  const el = document.getElementById('s4-emotion');
  if(el) el.addEventListener('change', e => { STUDIO.project.s4.emotion = e.target.value; studioSave(); });
}
function studioS4VoiceKo(id, btn){ STUDIO.project.s4.voiceKo=id; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }
function studioS4VoiceJa(id, btn){ STUDIO.project.s4.voiceJa=id; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }
function studioS4Bgm(b, btn){ STUDIO.project.s4.bgm=b; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }

/* ═════════════ STEP 5 편집 ═════════════ */
function _studioS5(){
  const p = STUDIO.project.s5;
  return '<div class="studio-panel">' +
    '<h4>⑤ 영상 조립·편집</h4>' +
    '<label class="studio-label">영상 템플릿 (10종)</label>' +
    '<div class="studio-chips">' +
      STUDIO_TEMPLATES.map(t => '<button class="studio-chip' + (p.template===t?' on':'') + '" onclick="studioS5Temp(\'' + t + '\',this)">' + t + '</button>').join('') +
    '</div>' +
    '<label class="studio-label">씬 전환 효과 (복수 선택)</label>' +
    '<div class="studio-chips">' +
      STUDIO_TRANSITIONS.map(t => {
        const on = (p.transitions||[]).includes(t);
        return '<button class="studio-chip' + (on?' on':'') + '" onclick="studioS5Trans(\'' + t + '\',this)">' + t + '</button>';
      }).join('') +
    '</div>' +
    '<label class="studio-label">이미지 모션</label>' +
    '<div class="studio-chips">' +
      [['kenburns','켄번스'],['pan','패닝'],['shake','흔들림'],['zoom','줌인/아웃'],['none','없음']].map(([v,l]) =>
        '<button class="studio-chip' + (p.motion===v?' on':'') + '" onclick="studioS5Motion(\'' + v + '\',this)">' + l + '</button>'
      ).join('') +
    '</div>' +
    '<label class="studio-label">필터 / 색보정 (12종)</label>' +
    '<div class="studio-chips">' +
      STUDIO_FILTERS.map(f => '<button class="studio-chip' + (p.filter===f?' on':'') + '" onclick="studioS5Filter(\'' + f + '\',this)">' + f + '</button>').join('') +
    '</div>' +
    '<label class="studio-label">오프닝 · 클로징 · 브랜딩</label>' +
    '<div class="studio-row">' +
      '<div><label><input type="checkbox" ' + (p.opening?'checked':'') + ' onchange="STUDIO.project.s5.opening=this.checked;studioSave()"> 오프닝 애니메이션</label></div>' +
      '<div><label><input type="checkbox" ' + (p.closing?'checked':'') + ' onchange="STUDIO.project.s5.closing=this.checked;studioSave()"> 클로징 애니메이션</label></div>' +
      '<div><label>로고 URL</label><input class="studio-in" value="' + (p.branding.logo||'') + '" onchange="STUDIO.project.s5.branding.logo=this.value;studioSave()"></div>' +
      '<div><label>워터마크</label><input class="studio-in" value="' + (p.branding.watermark||'') + '" onchange="STUDIO.project.s5.branding.watermark=this.value;studioSave()"></div>' +
      '<div><label>채널 컬러</label><input type="color" class="studio-in" value="' + (p.branding.color||'#ef6fab') + '" onchange="STUDIO.project.s5.branding.color=this.value;studioSave()"></div>' +
    '</div>' +
    '<label class="studio-label">특수 효과</label>' +
    '<div class="studio-chips">' +
      [['particle','파티클'],['hand','손글씨'],['counter','숫자 카운터'],['glitch','글리치'],['light','빛번짐']].map(([v,l]) => {
        const on = (p.effects||[]).includes(v);
        return '<button class="studio-chip' + (on?' on':'') + '" onclick="studioS5Effect(\'' + v + '\',this)">' + l + '</button>';
      }).join('') +
    '</div>' +
    '<div class="studio-actions" style="justify-content:space-between">' +
      '<button class="studio-btn ghost" onclick="studioGoto(3)">← 이전</button>' +
      '<button class="studio-btn pri" onclick="studioGoto(5)">다음: 자막 →</button>' +
    '</div>' +
  '</div>';
}
function _studioBindS5(){}
function studioS5Temp(t, btn){ STUDIO.project.s5.template=t; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }
function studioS5Trans(t, btn){
  const arr = STUDIO.project.s5.transitions = STUDIO.project.s5.transitions || [];
  const i = arr.indexOf(t); if(i>=0) arr.splice(i,1); else arr.push(t);
  btn.classList.toggle('on'); studioSave();
}
function studioS5Motion(v, btn){ STUDIO.project.s5.motion=v; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }
function studioS5Filter(f, btn){ STUDIO.project.s5.filter=f; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }
function studioS5Effect(v, btn){
  const arr = STUDIO.project.s5.effects = STUDIO.project.s5.effects || [];
  const i = arr.indexOf(v); if(i>=0) arr.splice(i,1); else arr.push(v);
  btn.classList.toggle('on'); studioSave();
}

/* ═════════════ STEP 6 자막·폰트 ═════════════ */
function _studioS6(){
  const p = STUDIO.project.s6;
  const ch = STUDIO.project.channel;
  return '<div class="studio-panel">' +
    '<h4>⑥ 자막 · 폰트 · 애니메이션</h4>' +

    (ch!=='ja' ? '<label class="studio-label">🇰🇷 한국어 폰트 (12종)</label>' +
      '<div class="studio-chips">' +
        STUDIO_FONTS_KO.map(f => '<button class="studio-chip' + (p.fontKo===f?' on':'') + '" onclick="studioS6FontKo(\'' + f + '\',this)">' + f + '</button>').join('') +
      '</div>' : '') +

    (ch!=='ko' ? '<label class="studio-label">🇯🇵 일본어 폰트 (12종)</label>' +
      '<div class="studio-chips">' +
        STUDIO_FONTS_JA.map(f => '<button class="studio-chip' + (p.fontJa===f?' on':'') + '" onclick="studioS6FontJa(\'' + f + '\',this)">' + f + '</button>').join('') +
      '</div>' : '') +

    (ch!=='ko' ? '<div class="studio-panel" style="background:#f7f4ff;margin-top:10px">' +
      '<h4 style="margin:0 0 6px">🇯🇵 일본어 전용</h4>' +
      '<label><input type="checkbox" ' + (p.jpVertical?'checked':'') + ' onchange="STUDIO.project.s6.jpVertical=this.checked;studioSave()"> 縦書き (세로쓰기)</label><br>' +
      '<label><input type="checkbox" ' + (p.jpFurigana?'checked':'') + ' onchange="STUDIO.project.s6.jpFurigana=this.checked;studioSave()"> ふりがな 자동 추가</label><br>' +
      '<label><input type="checkbox" ' + (p.jpKeigo?'checked':'') + ' onchange="STUDIO.project.s6.jpKeigo=this.checked;studioSave()"> 敬語 변환</label>' +
    '</div>' : '') +

    '<label class="studio-label">자막 레이아웃 (6종)</label>' +
    '<div class="studio-chips">' +
      [['bottom','하단 기본'],['top','상단'],['center','중앙'],['left','좌측'],['right','우측'],['karaoke','가라오케']].map(([v,l]) =>
        '<button class="studio-chip' + (p.subtitleLayout===v?' on':'') + '" onclick="studioS6Layout(\'' + v + '\',this)">' + l + '</button>'
      ).join('') +
    '</div>' +

    '<label style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:13px;cursor:pointer"><input type="checkbox" ' + (p.keywordHighlight?'checked':'') + ' onchange="STUDIO.project.s6.keywordHighlight=this.checked;studioSave()"> 키워드 자동 강조</label>' +

    '<label class="studio-label">자막 애니메이션 (10종)</label>' +
    '<div class="studio-chips">' +
      ['popup','fade','slide','typewriter','bounce','zoom','flash','wipe','scale','glitch'].map(a =>
        '<button class="studio-chip' + (p.animation===a?' on':'') + '" onclick="studioS6Anim(\'' + a + '\',this)">' + a + '</button>'
      ).join('') +
    '</div>' +

    '<p class="sub" style="margin-top:8px">✅ 음성 타이밍 자동 동기화 · 대본 분석 기반</p>' +

    '<div class="studio-actions" style="justify-content:space-between">' +
      '<button class="studio-btn ghost" onclick="studioGoto(4)">← 이전</button>' +
      '<button class="studio-btn pri" onclick="studioGoto(6)">다음: 최종 검수 →</button>' +
    '</div>' +
  '</div>';
}
function _studioBindS6(){}
function studioS6FontKo(f, btn){ STUDIO.project.s6.fontKo=f; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }
function studioS6FontJa(f, btn){ STUDIO.project.s6.fontJa=f; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }
function studioS6Layout(v, btn){ STUDIO.project.s6.subtitleLayout=v; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }
function studioS6Anim(a, btn){ STUDIO.project.s6.animation=a; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }

/* ═════════════ STEP 7 최종검수·출력 ═════════════ */
function _studioS7(){
  const p = STUDIO.project;
  const sKo = p.s7.scoreKo || {};
  const sJa = p.s7.scoreJa || {};
  const titles = p.s7.titles || [];
  const hashKo = (p.s7.hashtags?.ko || []).join(' ');
  const hashJa = (p.s7.hashtags?.ja || []).join(' ');
  return '<div class="studio-panel">' +
    '<h4>⑦ 최종 검수 · 출력</h4>' +

    '<div class="studio-actions">' +
      '<button class="studio-btn pri" onclick="studioS7Evaluate()">🤖 AI 종합 평가</button>' +
      '<button class="studio-btn ghost" onclick="studioS7GenTitles()">📝 제목 3안 + A/B</button>' +
      '<button class="studio-btn ghost" onclick="studioS7GenTags()">🏷 해시태그 자동</button>' +
    '</div>' +

    (p.channel !== 'ja' && Object.keys(sKo).length ? '<h4 style="margin-top:12px">🇰🇷 한국어 평가</h4>' + _studioScoreTable(sKo) : '') +
    (p.channel !== 'ko' && Object.keys(sJa).length ? '<h4 style="margin-top:12px">🇯🇵 일본어 평가</h4>' + _studioScoreTable(sJa) : '') +

    (titles.length ? '<h4 style="margin-top:12px">📝 제목 3안</h4><ol style="padding-left:20px">' +
      titles.map(t => '<li style="padding:4px 0;font-size:13.5px">' + t + '</li>').join('') + '</ol>' : '') +

    (hashKo ? '<h4 style="margin-top:12px">🏷 해시태그</h4>' +
      (hashKo ? '<div>🇰🇷 ' + hashKo + '</div>' : '') +
      (hashJa ? '<div>🇯🇵 ' + hashJa + '</div>' : '') : '') +

    '<div class="studio-panel" style="background:#fff5fa;margin-top:14px">' +
      '<h4 style="margin:0 0 8px">🔁 어느 단계든 바로 이동 (피드백 루프)</h4>' +
      '<div class="studio-chips">' +
        [1,2,3,4,5].map(n => '<button class="studio-chip" onclick="studioGoto(' + n + ')">Step ' + n + '</button>').join('') +
      '</div>' +
    '</div>' +

    '<div class="studio-actions" style="margin-top:14px">' +
      '<button class="studio-btn pri" onclick="studioS7Export(\'json\')">💾 프로젝트 저장 (JSON)</button>' +
      '<button class="studio-btn ghost" onclick="studioS7Export(\'download\')">⬇️ 전체 다운로드</button>' +
      '<button class="studio-btn ghost" onclick="studioS7Export(\'upload\')">📺 업로드 가이드</button>' +
      '<button class="studio-btn ok" onclick="studioS7Finalize()">🎉 완성 · 대시보드로</button>' +
    '</div>' +
  '</div>';
}
function _studioScoreTable(s){
  const items = [['hook','훅 강도'],['structure','구조'],['clarity','명확성'],['emotion','감정'],['cta','CTA'],['length','길이'],['viral','바이럴']];
  return '<div class="studio-row">' + items.map(([k,l]) =>
    '<div style="background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 10px;text-align:center">' +
      '<div style="font-size:18px;font-weight:900;color:var(--pink-deep)">' + (s[k]||0) + '</div>' +
      '<div style="font-size:11px;color:var(--sub)">' + l + '</div>' +
    '</div>'
  ).join('') + '</div>';
}
function _studioBindS7(){}
async function studioS7Evaluate(){
  const p = STUDIO.project;
  try{
    const sys = '유튜브 숏츠 대본 7개 항목 평가 (각 0~100): hook, structure, clarity, emotion, cta, length, viral. JSON만: {"hook":숫자,"structure":...,"suggestions":["제안1","제안2","제안3"]}';
    if(p.channel !== 'ja' && p.s2.scriptKo){
      const res = await APIAdapter.callWithFallback(sys, p.s2.scriptKo.slice(0,3000), { maxTokens:500 });
      const m = res.match(/\{[\s\S]*\}/); if(m) p.s7.scoreKo = JSON.parse(m[0]);
    }
    if(p.channel !== 'ko' && p.s2.scriptJa){
      const res = await APIAdapter.callWithFallback(sys, p.s2.scriptJa.slice(0,3000), { maxTokens:500 });
      const m = res.match(/\{[\s\S]*\}/); if(m) p.s7.scoreJa = JSON.parse(m[0]);
    }
    studioSave(); renderStudio();
  }catch(e){ alert('❌ ' + e.message); }
}
async function studioS7GenTitles(){
  const p = STUDIO.project;
  try{
    const sys = '유튜브 숏츠 제목 3안 생성 (A/B 테스트용). JSON 배열: ["제목1","제목2","제목3"]';
    const res = await APIAdapter.callWithFallback(sys, '주제: ' + p.s1.topic + ' / 장르: ' + p.s1.genre, { maxTokens:400 });
    const m = res.match(/\[[\s\S]*\]/); if(m) p.s7.titles = JSON.parse(m[0]);
    studioSave(); renderStudio();
  }catch(e){ alert('❌ ' + e.message); }
}
async function studioS7GenTags(){
  const p = STUDIO.project;
  try{
    const sys = '유튜브 숏츠 해시태그 15~20개 생성. JSON만: {"ko":["#tag1",...],"ja":["#tag1",...]}';
    const res = await APIAdapter.callWithFallback(sys, '주제: ' + p.s1.topic, { maxTokens:500 });
    const m = res.match(/\{[\s\S]*\}/); if(m) p.s7.hashtags = JSON.parse(m[0]);
    studioSave(); renderStudio();
  }catch(e){ alert('❌ ' + e.message); }
}
function studioS7Export(mode){
  const p = STUDIO.project;
  if(mode === 'json'){
    const blob = new Blob([JSON.stringify(p, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=(p.name||p.s1.topic||'project')+'.json'; a.click();
    URL.revokeObjectURL(url);
  } else if(mode === 'download'){
    alert('⬇️ 영상 파일은 자동 렌더링 엔진 연결 후 사용 가능합니다\n현재 프로젝트 JSON + 대본 텍스트 + 이미지 URL 은 ⬇️ JSON 저장 으로 받을 수 있어요');
  } else if(mode === 'upload'){
    alert('📺 업로드 가이드:\n\n1. 프로젝트 JSON 다운로드\n2. CapCut/Premiere 에서 이미지+음성+자막 조립\n3. 유튜브 업로드 시:\n   • 제목: Step7 제목 3안 중 선택\n   • 설명: 대본 요약\n   • 태그: Step7 해시태그');
  }
}
function studioS7Finalize(){
  STUDIO.project.step = 0;
  studioSave();
  alert('🎉 "' + (STUDIO.project.s1.topic||'프로젝트') + '" 완성!\n대시보드에서 다시 볼 수 있어요.');
  renderStudio();
}

/* ═════════════ 전자동 모드 ═════════════ */
async function studioRunFullAuto(){
  alert('⚡ 전자동 모드 시작\n\n주제를 입력해주세요 (Step1)');
}

/* 자동저장 타이머 */
setInterval(() => {
  if(STUDIO.project && STUDIO.project.step > 0 && !document.getElementById('studioDetail').classList.contains('hide')){
    studioSave();
  }
}, 20000);

/* ── 이미지 절약 시스템 ── */

/* 비율 설정 UI를 _studioS3() 함수의 E섹션 상단에 추가할 HTML 반환 */
function studioS3ReuseBar(){
  var s3 = STUDIO.project.s3 || {};
  var scenes = s3.scenes || [];
  var total = scenes.length;
  if(total <= 3) return ''; /* 씬이 적으면 표시 안 함 */

  var ratio  = s3.imageRatio  || 100; /* 생성할 이미지 비율 % */
  var reuseMode = s3.reuseMode || 'block'; /* block/cycle/random */
  var genCount = Math.max(1, Math.round(total * ratio / 100));

  return '<div style="background:#fff9fc;border:1.5px solid var(--pink);border-radius:14px;padding:14px;margin-bottom:14px">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
      '<div style="font-size:13px;font-weight:900">💡 이미지 절약 설정</div>' +
      '<div style="font-size:12px;color:var(--pink);font-weight:800">씬 '+total+'개 중 '+genCount+'장만 생성</div>' +
    '</div>' +

    /* 슬라이더 */
    '<div style="margin-bottom:10px">' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--sub);margin-bottom:4px">' +
        '<span>최소 ('+Math.ceil(total*0.2)+'장)</span>' +
        '<span style="font-weight:800;color:var(--pink)">'+ratio+'% = '+genCount+'장 생성</span>' +
        '<span>전체 ('+total+'장)</span>' +
      '</div>' +
      '<input type="range" min="10" max="100" step="5" value="'+ratio+'" '+
        'oninput="studioS3SetRatio(this.value)" '+
        'style="width:100%;accent-color:var(--pink)">' +
    '</div>' +

    /* 재사용 방식 */
    '<div style="font-size:12px;font-weight:700;color:var(--sub);margin-bottom:6px">재사용 방식</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      [
        {id:'block',  label:'📦 구간',  desc:'씬1~3→이미지1, 씬4~6→이미지2'},
        {id:'cycle',  label:'🔄 순환',  desc:'1→2→...→'+genCount+'→1→2...'},
        {id:'similar',label:'🧠 유사도',desc:'비슷한 내용끼리 같은 이미지'},
        {id:'random', label:'🎲 랜덤',  desc:'무작위 배정'},
      ].map(function(m){
        var on = reuseMode === m.id;
        return '<button onclick="studioS3SetReuseMode(\''+m.id+'\')" '+
          'title="'+m.desc+'" '+
          'style="border:2px solid '+(on?'var(--pink)':'var(--line)')+';'+
          'background:'+(on?'var(--pink-soft)':'#fff')+';'+
          'border-radius:999px;padding:6px 12px;cursor:pointer;'+
          'font-size:12px;font-weight:700;color:'+(on?'var(--pink)':'var(--sub)')+'">'+
          m.label+'</button>';
      }).join('') +
    '</div>' +

    /* 미리보기 */
    '<div style="margin-top:10px;font-size:11px;color:var(--sub);background:#f8f8f8;border-radius:8px;padding:8px">' +
      '📋 배정 미리보기: '+studioS3ReusePreview(total, genCount, reuseMode) +
    '</div>' +
  '</div>';
}

/* 재사용 배정 미리보기 텍스트 */
function studioS3ReusePreview(total, genCount, mode){
  if(mode === 'block'){
    var blockSize = Math.ceil(total / genCount);
    return '씬 '+blockSize+'개마다 이미지 1장 공유 (총 '+genCount+'장 생성)';
  }
  if(mode === 'cycle'){
    return '씬1→이미지1, 씬2→이미지2 ... 씬'+(genCount+1)+'→이미지1 (반복)';
  }
  if(mode === 'similar'){
    return 'AI가 씬 내용 분석 → 유사한 씬끼리 같은 이미지 배정';
  }
  return '무작위 배정 ('+genCount+'장 이미지로 '+total+'씬 커버)';
}

/* 비율 설정 */
function studioS3SetRatio(val){
  var s3 = STUDIO.project.s3 || {};
  s3.imageRatio = parseInt(val);
  STUDIO.project.s3 = s3;
  studioSave();
  /* 슬라이더만 업데이트 (전체 재렌더 없이) */
  var total = (s3.scenes||[]).length;
  var genCount = Math.max(1, Math.round(total * s3.imageRatio / 100));
  var preview = document.querySelector('[data-reuse-preview]');
  if(preview) preview.textContent = studioS3ReusePreview(total, genCount, s3.reuseMode||'block');
  /* 비율 표시 업데이트 */
  var label = document.querySelector('[data-ratio-label]');
  if(label) label.textContent = val+'% = '+genCount+'장 생성';
}

/* 재사용 방식 설정 */
function studioS3SetReuseMode(mode){
  var s3 = STUDIO.project.s3 || {};
  s3.reuseMode = mode;
  STUDIO.project.s3 = s3;
  studioSave();
  renderStudio();
}

/* 이미지 배정 실행 — 생성된 이미지를 전체 씬에 배정 */
function studioS3ApplyReuse(){
  var s3 = STUDIO.project.s3 || {};
  var scenes = s3.scenes || [];
  var images = (s3.images || []).filter(function(img){ return !!img; });
  if(!images.length){ alert('먼저 이미지를 생성해주세요'); return; }

  var total    = scenes.length;
  var genCount = images.length;
  var mode     = s3.reuseMode || 'block';
  var assigned = new Array(total).fill(null);

  /* 생성된 이미지는 원래 위치에 먼저 배정 */
  images.forEach(function(img, i){ assigned[i] = img; });

  if(mode === 'block'){
    var blockSize = Math.ceil(total / genCount);
    for(var i=0; i<total; i++){
      if(!assigned[i]){
        var srcIdx = Math.floor(i / blockSize);
        assigned[i] = images[Math.min(srcIdx, genCount-1)];
      }
    }
  } else if(mode === 'cycle'){
    for(var i=0; i<total; i++){
      if(!assigned[i]) assigned[i] = images[i % genCount];
    }
  } else if(mode === 'random'){
    for(var i=0; i<total; i++){
      if(!assigned[i]) assigned[i] = images[Math.floor(Math.random()*genCount)];
    }
  } else if(mode === 'similar'){
    /* 유사도는 AI 분석 필요 → 일단 block으로 폴백 */
    var blockSize2 = Math.ceil(total / genCount);
    for(var i=0; i<total; i++){
      if(!assigned[i]){
        var srcIdx2 = Math.floor(i / blockSize2);
        assigned[i] = images[Math.min(srcIdx2, genCount-1)];
      }
    }
    studioS3ApplyReuseSimilar(); /* 비동기로 AI 재배정 */
  }

  s3.finalImages = assigned;
  STUDIO.project.s3 = s3;
  studioSave();
  renderStudio();
  if(typeof ucShowToast==='function') ucShowToast('✅ '+genCount+'장으로 '+total+'씬 배정 완료','success');
}

/* 유사도 기반 재배정 (AI) */
async function studioS3ApplyReuseSimilar(){
  var s3 = STUDIO.project.s3 || {};
  var scenes = s3.scenes || [];
  var images = (s3.images||[]).filter(function(img){ return !!img; });
  if(!images.length || !scenes.length) return;

  var sys = '유튜브 영상 씬 분석가. JSON만 출력.';
  var user = '아래 씬 목록을 '+images.length+'개 그룹으로 나눠줘.\n'+
    '형식: {"groups":[[씬인덱스,...],[씬인덱스,...]]}\n'+
    '씬 목록:\n'+
    scenes.map(function(s,i){ return i+': '+s.label+' - '+s.desc; }).join('\n');

  try {
    var res = await APIAdapter.callWithFallback(sys, user, {maxTokens:500});
    var m = res.match(/\{[\s\S]*\}/);
    if(m){
      var obj = JSON.parse(m[0]);
      var groups = obj.groups || [];
      var assigned = new Array(scenes.length).fill(null);
      groups.forEach(function(group, imgIdx){
        var img = images[imgIdx];
        if(!img) return;
        group.forEach(function(sceneIdx){
          if(sceneIdx >= 0 && sceneIdx < scenes.length) assigned[sceneIdx] = img;
        });
      });
      s3.finalImages = assigned;
      STUDIO.project.s3 = s3; studioSave(); renderStudio();
      if(typeof ucShowToast==='function') ucShowToast('✅ AI 유사도 배정 완료','success');
    }
  } catch(e){ console.warn('유사도 배정 실패:', e.message); }
}

/* ── 스톡 영상/이미지 검색 시스템 ── */

/* 무료 스톡 API 목록 */
var STOCK_APIS = [
  { id:'pexels',    name:'Pexels',    type:'both',  free:true,  url:'https://api.pexels.com/v1/',          keyName:'uc_pexels_key',    badge:'무료·상업OK' },
  { id:'pixabay',   name:'Pixabay',   type:'both',  free:true,  url:'https://pixabay.com/api/',            keyName:'uc_pixabay_key',   badge:'무료·상업OK' },
  { id:'unsplash',  name:'Unsplash',  type:'image', free:true,  url:'https://api.unsplash.com/',           keyName:'uc_unsplash_key',  badge:'이미지전용'  },
  { id:'coverr',    name:'Coverr',    type:'video', free:true,  url:'https://coverr.co/api/v2/',           keyName:'uc_coverr_key',    badge:'영상전용'    },
  { id:'videvo',    name:'Videvo',    type:'video', free:false, url:'https://www.videvo.net/api/',         keyName:'uc_videvo_key',    badge:'일부유료'    },
];

/* 스톡 검색 UI */
function studioS3StockBar(){
  var s3 = STUDIO.project.s3 || {};
  var stockApi = s3.stockApi || 'pexels';
  var stockType = s3.stockType || 'both';

  return '<div style="background:#f0f7ff;border:1.5px solid #90c8f0;border-radius:14px;padding:14px;margin-bottom:14px">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
      '<div style="font-size:13px;font-weight:900">🎬 스톡 이미지·영상 검색</div>' +
      '<div style="font-size:11px;color:#4a90c4;font-weight:700">무료 상업용 가능</div>' +
    '</div>' +

    /* API 선택 */
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' +
    STOCK_APIS.map(function(a){
      var on = stockApi === a.id;
      var typeIcon = a.type==='both'?'📷🎬':a.type==='image'?'📷':'🎬';
      return '<button onclick="studioS3SetStockApi(\''+a.id+'\')" style="'+
        'border:2px solid '+(on?'#4a90c4':'#cce0f0')+';'+
        'background:'+(on?'#e8f4ff':'#fff')+';'+
        'border-radius:10px;padding:7px 11px;cursor:pointer;font-family:inherit;'+
        'transition:.15s;text-align:left;">' +
        '<div style="font-size:12px;font-weight:800;color:'+(on?'#2271b1':'var(--text)')+'">'+typeIcon+' '+a.name+'</div>'+
        '<div style="font-size:10px;color:'+(a.free?'#27ae60':'#e67e22')+'">'+a.badge+'</div>'+
      '</button>';
    }).join('') +
    '</div>' +

    /* API 키 */
    '<div style="display:flex;gap:8px;margin-bottom:10px">' +
      '<input id="s3-stock-key" type="password" class="studio-in" style="flex:1;font-size:12px" '+
        'placeholder="API 키 (Pexels/Pixabay 무료 발급 가능)" '+
        'value="'+(localStorage.getItem(STOCK_APIS.find(function(a){return a.id===stockApi})?.keyName||'')||'')+'">' +
      '<button onclick="studioS3SaveStockKey()" class="studio-btn ghost" style="font-size:11px;white-space:nowrap">저장</button>' +
      '<a href="'+studioS3StockSignupUrl(stockApi)+'" target="_blank" style="'+
        'display:flex;align-items:center;border:1.5px solid #cce0f0;'+
        'background:#fff;border-radius:8px;padding:0 10px;font-size:11px;'+
        'color:#2271b1;text-decoration:none;white-space:nowrap;font-weight:700">무료 발급 →</a>' +
    '</div>' +

    /* 검색창 */
    '<div style="display:flex;gap:6px;margin-bottom:8px">' +
      '<input id="s3-stock-query" class="studio-in" style="flex:1;font-size:12px" '+
        'placeholder="검색어 입력 (한국어 OK → 자동 번역)">' +
      '<select id="s3-stock-type" onchange="studioS3SetStockType(this.value)" '+
        'style="border:1.5px solid var(--line);border-radius:8px;padding:6px;font-size:12px">' +
        '<option value="image" '+(stockType==='image'?'selected':'')+'>이미지</option>' +
        '<option value="video" '+(stockType==='video'?'selected':'')+'>영상</option>' +
        '<option value="both"  '+(stockType==='both'?'selected':'')+'>전부</option>' +
      '</select>' +
      '<button onclick="studioS3StockSearch()" class="studio-btn pri" style="font-size:12px;white-space:nowrap">🔍 검색</button>' +
    '</div>' +

    /* 검색 결과 */
    '<div id="s3-stock-results" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:300px;overflow-y:auto"></div>' +
  '</div>';
}

/* API 무료 발급 URL */
function studioS3StockSignupUrl(api){
  var urls = {
    pexels:   'https://www.pexels.com/api/',
    pixabay:  'https://pixabay.com/api/docs/',
    unsplash: 'https://unsplash.com/developers',
    coverr:   'https://coverr.co/developers',
    videvo:   'https://www.videvo.net/api/',
  };
  return urls[api] || '#';
}

/* 스톡 API 선택 */
function studioS3SetStockApi(api){
  var s3 = STUDIO.project.s3 || {};
  s3.stockApi = api;
  STUDIO.project.s3 = s3;
  studioSave(); renderStudio();
}

/* 스톡 타입 선택 */
function studioS3SetStockType(type){
  var s3 = STUDIO.project.s3 || {};
  s3.stockType = type;
  STUDIO.project.s3 = s3;
  studioSave();
}

/* 스톡 API 키 저장 */
function studioS3SaveStockKey(){
  var key = document.getElementById('s3-stock-key')?.value || '';
  var s3 = STUDIO.project.s3 || {};
  var api = s3.stockApi || 'pexels';
  var keyName = STOCK_APIS.find(function(a){ return a.id===api; })?.keyName || 'uc_pexels_key';
  localStorage.setItem(keyName, key);
  if(typeof ucShowToast==='function') ucShowToast('✅ '+api+' 키 저장됨','success');
}

/* 스톡 검색 실행 */
async function studioS3StockSearch(){
  var query  = document.getElementById('s3-stock-query')?.value || '';
  var type   = document.getElementById('s3-stock-type')?.value || 'image';
  var s3     = STUDIO.project.s3 || {};
  var api    = s3.stockApi || 'pexels';
  var keyName = STOCK_APIS.find(function(a){ return a.id===api; })?.keyName || 'uc_pexels_key';
  var key    = localStorage.getItem(keyName) || '';
  var out    = document.getElementById('s3-stock-results');

  if(!query){ alert('검색어를 입력해주세요'); return; }
  if(!key){   alert(api+' API 키를 입력해주세요 (무료 발급 버튼 클릭)'); return; }
  if(!out) return;

  /* 한국어 → 영어 번역 */
  var engQuery = query;
  try {
    var transRes = await APIAdapter.callWithFallback(
      'Translate Korean to English. Output English only, no explanation.',
      query, {maxTokens:50}
    );
    if(transRes && transRes.trim()) engQuery = transRes.trim();
  } catch(e){ /* 번역 실패 시 원문 사용 */ }

  out.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#4a90c4;font-size:12px">🔍 검색 중...</div>';

  try {
    var results = [];

    if(api === 'pexels'){
      if(type === 'video' || type === 'both'){
        var r = await fetch('https://api.pexels.com/videos/search?query='+encodeURIComponent(engQuery)+'&per_page=9', {
          headers:{'Authorization': key}
        });
        var d = await r.json();
        (d.videos||[]).forEach(function(v){
          results.push({
            type: 'video',
            thumb: v.image,
            url: v.video_files?.[0]?.link || '',
            credit: v.user?.name || 'Pexels',
            creditUrl: v.url || '#',
          });
        });
      }
      if(type === 'image' || type === 'both'){
        var r2 = await fetch('https://api.pexels.com/v1/search?query='+encodeURIComponent(engQuery)+'&per_page=9', {
          headers:{'Authorization': key}
        });
        var d2 = await r2.json();
        (d2.photos||[]).forEach(function(p){
          results.push({
            type: 'image',
            thumb: p.src?.medium || '',
            url:   p.src?.large  || '',
            credit: p.photographer || 'Pexels',
            creditUrl: p.photographer_url || '#',
          });
        });
      }
    }

    else if(api === 'pixabay'){
      var pType = type==='video'?'&video_type=film':'';
      var pApi  = type==='video'?'https://pixabay.com/api/videos/':'https://pixabay.com/api/';
      var r3 = await fetch(pApi+'?key='+key+'&q='+encodeURIComponent(engQuery)+'&per_page=12&safesearch=true'+pType);
      var d3 = await r3.json();
      (d3.hits||[]).forEach(function(h){
        results.push({
          type: type==='video'?'video':'image',
          thumb: type==='video'?(h.videos?.tiny?.thumbnail||''):(h.previewURL||''),
          url:   type==='video'?(h.videos?.medium?.url||''):(h.largeImageURL||''),
          credit: h.user || 'Pixabay',
          creditUrl: h.pageURL || '#',
        });
      });
    }

    else if(api === 'unsplash'){
      var r4 = await fetch('https://api.unsplash.com/search/photos?query='+encodeURIComponent(engQuery)+'&per_page=12&client_id='+key);
      var d4 = await r4.json();
      (d4.results||[]).forEach(function(p){
        results.push({
          type: 'image',
          thumb: p.urls?.small || '',
          url:   p.urls?.regular || '',
          credit: p.user?.name || 'Unsplash',
          creditUrl: p.user?.links?.html || '#',
        });
      });
    }

    if(!results.length){
      out.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#bbb;font-size:12px">검색 결과가 없어요. 다른 검색어를 시도해보세요.</div>';
      return;
    }

    out.innerHTML = results.slice(0,12).map(function(item, idx){
      var typeIcon = item.type==='video'?'🎬':'📷';
      return '<div style="border:1px solid #dde8f0;border-radius:10px;overflow:hidden;cursor:pointer;position:relative" '+
        'onclick="studioS3StockUse('+idx+')" data-idx="'+idx+'">' +
        (item.type==='video'
          ? '<div style="background:#000;height:90px;display:flex;align-items:center;justify-content:center;position:relative">'+
              (item.thumb?'<img src="'+item.thumb+'" style="width:100%;height:90px;object-fit:cover;opacity:0.7">':'')+
              '<span style="position:absolute;font-size:24px">▶</span></div>'
          : '<img src="'+item.thumb+'" style="width:100%;height:90px;object-fit:cover;display:block">') +
        '<div style="padding:5px 6px;background:#fff">' +
          '<div style="font-size:10px;color:#4a90c4;font-weight:700">'+typeIcon+' '+item.credit+'</div>' +
          '<button onclick="event.stopPropagation();studioS3StockApply('+idx+',null)" style="'+
            'width:100%;margin-top:4px;border:none;background:#4a90c4;color:#fff;'+
            'border-radius:6px;padding:4px;font-size:10px;font-weight:700;cursor:pointer">'+
            '씬에 적용</button>' +
        '</div>' +
      '</div>';
    }).join('');

    /* 결과 저장 */
    s3._stockResults = results;
    STUDIO.project.s3 = s3;

    if(typeof ucShowToast==='function') ucShowToast('✅ '+results.length+'개 결과 (번역: "'+engQuery+'")','success');

  } catch(e){
    out.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:red;font-size:12px">❌ 오류: '+e.message+'</div>';
  }
}

/* 스톡 결과 씬에 적용 */
function studioS3StockApply(resultIdx, sceneIdx){
  var s3 = STUDIO.project.s3 || {};
  var results = s3._stockResults || [];
  var item = results[resultIdx];
  if(!item){ alert('검색 결과를 먼저 불러와주세요'); return; }

  s3.images = s3.images || [];
  s3.adopted = s3.adopted || [];

  /* sceneIdx가 null이면 빈 씬에 자동 배정 */
  var idx = sceneIdx;
  if(idx === null || idx === undefined){
    idx = s3.images.findIndex(function(img){ return !img; });
    if(idx === -1) idx = 0;
  }

  s3.images[idx] = item.type==='video' ? item.thumb : item.url;
  s3.stockVideos = s3.stockVideos || [];
  if(item.type === 'video') s3.stockVideos[idx] = item.url;
  s3.adopted[idx] = true;

  /* 출처 저장 (저작권 표시용) */
  s3.credits = s3.credits || [];
  s3.credits[idx] = { name: item.credit, url: item.creditUrl, type: item.type };

  STUDIO.project.s3 = s3;
  studioSave();
  renderStudio();
  if(typeof ucShowToast==='function') ucShowToast('✅ 씬'+(idx+1)+'에 '+item.type+' 적용됨 · 출처: '+item.credit,'success');
}

/* 스톡 결과 팝업에서 씬 선택 */
function studioS3StockUse(resultIdx){
  var s3 = STUDIO.project.s3 || {};
  var scenes = s3.scenes || [];
  if(!scenes.length){ studioS3StockApply(resultIdx, null); return; }

  /* 씬 선택 팝업 */
  var existing = document.getElementById('stock-scene-picker');
  if(existing) existing.remove();

  var picker = document.createElement('div');
  picker.id = 'stock-scene-picker';
  picker.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);'+
    'background:#fff;border-radius:16px;padding:20px;z-index:10000;'+
    'box-shadow:0 8px 40px rgba(0,0,0,0.2);max-height:60vh;overflow-y:auto;min-width:280px';

  picker.innerHTML = '<div style="font-size:14px;font-weight:900;margin-bottom:12px">어느 씬에 적용할까요?</div>'+
    '<div style="display:flex;flex-direction:column;gap:6px">' +
    scenes.map(function(sc,i){
      return '<button onclick="studioS3StockApply('+resultIdx+','+i+');document.getElementById(\'stock-scene-picker\').remove()" '+
        'style="border:1.5px solid #dde8f0;background:#fff;border-radius:8px;padding:8px 12px;'+
        'cursor:pointer;text-align:left;font-size:12px;font-weight:700">' +
        '씬'+(i+1)+' — '+sc.label+'</button>';
    }).join('') +
    '<button onclick="document.getElementById(\'stock-scene-picker\').remove()" '+
      'style="border:none;background:#eee;border-radius:8px;padding:8px;cursor:pointer;font-size:12px;margin-top:4px">취소</button>' +
    '</div>';

  document.body.appendChild(picker);
}
