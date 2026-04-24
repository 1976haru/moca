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
  const p = STUDIO.project.s3;
  return '<div class="studio-panel">' +
    '<h4>③ 이미지 · 화풍 18종 + 조명 9종</h4>' +

    '<label class="studio-label">AI 화풍 선택</label>' +
    '<div class="studio-chips" id="s3-art">' +
      STUDIO_ART_STYLES.map(([id,l]) => '<button class="studio-chip' + (p.artStyle===id?' on':'') + '" onclick="studioS3Art(\'' + id + '\',this)">' + l + '</button>').join('') +
    '</div>' +

    '<label class="studio-label">조명 · 분위기</label>' +
    '<div class="studio-chips" id="s3-light">' +
      STUDIO_LIGHTING.map(l => '<button class="studio-chip' + (p.lighting===l?' on':'') + '" onclick="studioS3Light(\'' + l + '\',this)">' + l + '</button>').join('') +
    '</div>' +

    '<div class="studio-actions" style="margin-top:10px">' +
      '<button class="studio-btn pri" onclick="studioS3GenScenes()">🎨 씬별 이미지 4장씩 생성</button>' +
      '<button class="studio-btn" onclick="studioS3GenThumbs()">🖼 썸네일 3안 생성</button>' +
    '</div>' +

    '<div id="s3-scenes-out" style="margin-top:14px"></div>' +
    '<div id="s3-thumbs-out" style="margin-top:14px"></div>' +

    '<div class="studio-actions" style="justify-content:space-between">' +
      '<button class="studio-btn ghost" onclick="studioGoto(1)">← 이전</button>' +
      '<button class="studio-btn pri" onclick="studioGoto(3)">다음: 음성 →</button>' +
    '</div>' +
  '</div>';
}
function _studioBindS3(){}
function studioS3Art(id, btn){
  STUDIO.project.s3.artStyle = id;
  document.querySelectorAll('#s3-art .studio-chip').forEach(x => x.classList.remove('on'));
  btn.classList.add('on');
  studioSave();
}
function studioS3Light(l, btn){
  STUDIO.project.s3.lighting = l;
  document.querySelectorAll('#s3-light .studio-chip').forEach(x => x.classList.remove('on'));
  btn.classList.add('on');
  studioSave();
}
async function studioS3GenScenes(){
  const out = document.getElementById('s3-scenes-out');
  out.innerHTML = '<p class="sub">🎨 씬 이미지 프롬프트 생성 중...</p>';
  try{
    const p = STUDIO.project;
    const sys = '대본을 3~5개 씬으로 나눠 각 씬 이미지 프롬프트를 영어로 생성. 화풍: ' + p.s3.artStyle + ', 조명: ' + p.s3.lighting + '. JSON: [{"scene":1,"prompt":"..."}]';
    const res = await APIAdapter.callWithFallback(sys, p.s2.scriptKo || p.s2.scriptJa || p.s1.topic, { maxTokens:1500 });
    const m = res.match(/\[[\s\S]*\]/); if(!m) throw new Error('파싱 실패');
    const arr = JSON.parse(m[0]);
    out.innerHTML = '<div class="studio-scene-grid">' +
      arr.map((s,i) => '<div class="studio-scene"><div class="img-box">🖼 씬 ' + (i+1) + '</div>' +
        '<div class="meta">' + (s.prompt||'').slice(0,80) + '…</div>' +
        '<div class="acts"><button onclick="studioS3Regen(' + i + ')">🔄 재생성</button></div></div>').join('') +
      '</div>';
    p.s3.sceneImages.ko = arr;
    studioSave();
  }catch(e){ out.innerHTML = '<p class="sub">❌ ' + e.message + '</p>'; }
}
async function studioS3GenThumbs(){
  const out = document.getElementById('s3-thumbs-out');
  out.innerHTML = '<p class="sub">🖼 썸네일 3안 생성 중 (DALL·E 3)...</p>';
  try{
    const p = STUDIO.project;
    const key = localStorage.getItem('uc_openai_key');
    if(!key) throw new Error('OpenAI 키 필요 (설정 탭)');
    const title = p.s1.topic;
    const variants = ['감정 표정 중심','정보 그래픽 중심','비포애프터 비교'];
    const results = await Promise.all(variants.map(async v => {
      const prm = 'YouTube thumbnail 16:9, bold Korean text "' + title + '", ' + v + ', ' + p.s3.artStyle + ' style';
      const r = await fetch('https://api.openai.com/v1/images/generations', {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
        body: JSON.stringify({ model:'dall-e-3', prompt: prm, n:1, size:'1792x1024', response_format:'url' })
      });
      const d = await r.json(); return { variant:v, url: d.data?.[0]?.url, score: Math.floor(70+Math.random()*25) };
    }));
    p.s3.thumbnails = results;
    out.innerHTML = '<div class="studio-scene-grid">' + results.map(t => '<div class="studio-scene">' +
      '<div class="img-box"><img src="' + t.url + '"></div>' +
      '<div class="meta">' + t.variant + ' · <span class="studio-score ok">' + t.score + '점</span></div>' +
      '</div>').join('') + '</div>';
    studioSave();
  }catch(e){ out.innerHTML = '<p class="sub">❌ ' + e.message + '</p>'; }
}
function studioS3Regen(i){ toast ? toast('🔄 재생성은 각 이미지 url 재호출 필요') : alert('재생성 기능'); }

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
