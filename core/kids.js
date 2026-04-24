/* ==================================================
   kids.js
   Kids mode -- KIDS_CARDS/SUBS/META + generate + points/badges
   extracted from index.html by split_index.py
   ================================================== */

const KIDS_SUBS = {
  family:[
    {id:'f-roleplay',     emoji:'🎭', name:'가족 역할극 대본',         bonus:'family', prompt:'가족 역할극 대본. 엄마/아빠/자녀가 역할 바꾸는 웃긴 상황극. 각자 대사 포함.'},
    {id:'f-musical',      emoji:'🎵', name:'가족 뮤지컬 대본',         bonus:'family', prompt:'가족 뮤지컬. 각자 파트 자동 배정, 노래 가사 + 안무 힌트.'},
    {id:'f-debate',       emoji:'⚔️',name:'가족 토론 배틀',           bonus:'family', prompt:'가족 토론 배틀. 주제에 대한 찬반 각 3문장씩 + AI 심판 판정.'},
    {id:'f-balance',      emoji:'⚖️',name:'가족 밸런스 게임',         bonus:'family', prompt:'세대차이 밸런스 게임 10문제. 각 세대별 예상 답변 + 웃긴 분석.'},
    {id:'f-20q',          emoji:'❓', name:'가족 스무고개 대결',        bonus:'family', prompt:'가족 팀 스무고개 주제 10개 + 힌트 시스템.'},
    {id:'f-common',       emoji:'🔍', name:'가족 공통점 찾기',          bonus:'family', prompt:'가족 정보를 바탕으로 의외의 공통점 10가지 찾기.'},
    {id:'f-quiz',         emoji:'📝', name:'우리 가족 퀴즈쇼',         bonus:'family', prompt:'우리 가족에 대한 퀴즈 15문제(취향·추억·비밀).'},
    {id:'f-thanks',       emoji:'💌', name:'부모님께 감사 편지',       bonus:'family', prompt:'부모님께 드리는 감사 편지. 귀여운 이모지와 함께 진심 담아.'},
    {id:'f-grand',        emoji:'👵', name:'할머니 할아버지 편지',     bonus:'family', prompt:'할머니·할아버지께 드리는 편지. 큰 글씨 스타일, 추억 표현.'},
    {id:'f-coupon',        emoji:'🎟️',name:'가족 사랑 쿠폰북',        bonus:'family', prompt:'가족 사랑 쿠폰 12장(설거지 도와드리기·안마 5분·안아주기 등 귀엽게).'},
    {id:'f-storybook',    emoji:'📚', name:'우리 가족 이야기책',       bonus:'family', prompt:'가족 특징·추억을 동화로. 주인공은 우리 가족.'},
    {id:'f-birthday',     emoji:'🎂', name:'부모님 생신 축하',         bonus:'family', prompt:'부모님 생신 준비. 편지 + 시 + 노래 가사 + 파티 계획표.'},
    {id:'f-newspaper',    emoji:'📰', name:'가족 신문 만들기',         bonus:'family', prompt:'오늘 가족 이야기로 1면 신문 작성. 헤드·기사·인터뷰·만평.'},
    {id:'f-capsule',      emoji:'⏳', name:'가족 타임캡슐',            bonus:'family', prompt:'오늘 날짜 기록 + 가족 각자 소원 + 1년 후에 열어볼 편지 양식.'},
    {id:'f-oldstory',     emoji:'🌾', name:'옛날 이야기 듣기',         bonus:'family', prompt:'할머니·할아버지 고향·시대 기반 그 시절 이야기·풍경 묘사.'},
    {id:'f-gen-gap',      emoji:'📻', name:'세대차이 게임',            bonus:'family', prompt:'옛날 물건 vs 요즘 것들 맞추기 10문제 + 세대별 설명.'},
    {id:'f-old-play',     emoji:'🎎', name:'옛날 놀이 배우기',          bonus:'family', prompt:'고무줄·딱지·구슬치기·비석치기 규칙·방법 친절하게.'},
    {id:'f-interview',    emoji:'🎤', name:'조부모 인터뷰 도우미',      bonus:'family', prompt:'조부모 인터뷰 질문 20개 + 가족 역사책 양식.'},
    {id:'f-recipe',       emoji:'🍲', name:'함께 만드는 레시피',       bonus:'family', prompt:'할머니 특별 요리를 기록 + 동화화(이 요리의 탄생 이야기).'},
    {id:'f-sib-battle',   emoji:'🥊', name:'형제자매 대결 게임',                        prompt:'형제자매 나이 차이 고려한 공정한 대결 게임 5종.'},
    {id:'f-sib-peace',    emoji:'🕊️',name:'형제자매 화해 도우미',                       prompt:'싸운 상황 기반 화해 방법 + 사과 편지.'},
    {id:'f-sib-story',    emoji:'👧', name:'형제자매 공동 이야기',                      prompt:'각자 캐릭터로 함께 주인공 되는 모험 이야기.'},
    {id:'f-sib-intro',    emoji:'🎁', name:'동생/형 소개서',                            prompt:'형제자매 귀여운 소개서. 장점·추억·웃긴 에피소드.'}
  ],
  friends:[
    {id:'fr-battle',      emoji:'⚔️',name:'친구 대결 시리즈',          bonus:'friends', prompt:'친구와 함께할 대결 게임 3종(끝말잇기·수수께끼·밸런스).'},
    {id:'fr-story',       emoji:'📖', name:'공동 스토리 만들기',        bonus:'friends', prompt:'친구 여러 명이 이어쓰기 스토리 양식. 시작 3문장 + 이어쓰기 규칙.'},
    {id:'fr-mafia',       emoji:'🕵️',name:'친구 마피아 게임',         bonus:'friends', prompt:'친구 마피아 게임. 역할 자동 배정·AI 진행자 대사·라운드 진행법.'},
    {id:'fr-telepathy',   emoji:'🧠', name:'텔레파시 게임',             bonus:'friends', prompt:'같은 답 맞히기 10문제 + 채점 규칙.'},
    {id:'fr-explain',     emoji:'🗣️',name:'친구 설명왕 게임',          bonus:'friends', prompt:'단어 10개 + 설명 힌트(쉬움·보통·어려움).'},
    {id:'fr-draw',        emoji:'🖍️',name:'친구 그림 전달 게임',       bonus:'friends', prompt:'그림 설명 전달 규칙·주제 10개.'},
    {id:'fr-intro',       emoji:'🌟', name:'친구 소개서 만들기',        bonus:'friends', prompt:'세상에서 가장 멋진 친구 소개서 양식.'},
    {id:'fr-letter',      emoji:'💌', name:'친구에게 보내는 편지',      bonus:'friends', prompt:'친구 편지. 감동·재미 2버전 선택 가능하게.'},
    {id:'fr-praise',      emoji:'🎉', name:'친구 칭찬 폭탄',            bonus:'friends', prompt:'창의적인 친구 칭찬 10개.'},
    {id:'fr-level',       emoji:'💎', name:'우정 레벨 측정',            bonus:'friends', prompt:'공통점 입력 기반 우정 레벨(1~10) + 특별 재능.'},
    {id:'fr-birthday',    emoji:'🎂', name:'친구 생일 서프라이즈',      bonus:'friends', prompt:'친구 생일용 편지 + 파티 아이디어 + 선물 추천.'},
    {id:'fr-bucket',      emoji:'🪣', name:'친구 버킷리스트',           bonus:'friends', prompt:'친구와 함께할 버킷리스트 10개 + 실천 계획표.'},
    {id:'fr-secret',      emoji:'🔐', name:'우리만의 암호 만들기',      bonus:'friends', prompt:'친구들만 아는 암호 체계 + 해독기 규칙.'},
    {id:'fr-classhero',   emoji:'🦸', name:'우리 반이 주인공',          bonus:'friends', prompt:'친구들 이름·특징으로 모험 이야기 만들기.'},
    {id:'fr-team',        emoji:'💪', name:'우리 반 히어로 팀',         bonus:'friends', prompt:'친구별 특기를 히어로 능력으로 배정한 팀.'},
    {id:'fr-teacher',     emoji:'🍎', name:'선생님께 감사 편지',                          prompt:'선생님께 감사 편지. 존경·추억·감사의 마음.'},
    {id:'fr-cheer',       emoji:'📣', name:'우리 반 응원가',            bonus:'friends', prompt:'반 이름·특징으로 응원가 가사 만들기.'},
    {id:'fr-trip',        emoji:'🎒', name:'소풍·체험학습 계획',                          prompt:'장소 기반 소풍 계획표 + 챙길 것 목록.'},
    {id:'fr-play',        emoji:'🎭', name:'학예회 대본',               bonus:'friends', prompt:'역할·주제 선택 기반 재밌는 학예회 대본.'},
    {id:'fr-fight',       emoji:'😢', name:'친구와 싸웠을 때',                            prompt:'화해 방법·사과 편지·대화 시작 방법. 부드럽게.', care:true},
    {id:'fr-bully',       emoji:'🆘', name:'따돌림 당했을 때',                            prompt:'위로 메시지 + 어른에게 도움 요청 가이드(담임·부모·상담선생님).', care:true, adult:true},
    {id:'fr-sad',         emoji:'🤗', name:'친구가 슬플 때',                              prompt:'친구를 위로하는 편지·말. 진심 담아 부드럽게.', care:true},
    {id:'fr-new',         emoji:'🌱', name:'새 친구 사귀기',                              prompt:'친구 사귀는 말 연습 + 대화 시작 방법 10가지.'}
  ],
  games:[
    {id:'g-word',     emoji:'📝', name:'AI 끝말잇기',             prompt:'끝말잇기 게임. 테마(동물/음식/나라) 선택 + 진행 규칙 + AI가 낼 단어 예시.'},
    {id:'g-20',       emoji:'🎯', name:'스무고개 AI',              prompt:'스무고개 게임. 카테고리별 힌트 시스템 + 진행 규칙.'},
    {id:'g-riddle',   emoji:'🧩', name:'수수께끼 배틀',            prompt:'수수께끼 10문제 + 힌트 + 정답 해설. 점수 시스템 포함.'},
    {id:'g-story',    emoji:'📚', name:'스토리 이어쓰기',          prompt:'AI가 시작 문장 3줄 제시 + 이어쓰기 규칙 + 예상 못한 결말 예시.'},
    {id:'g-mind',     emoji:'🔮', name:'마인드리딩 게임',          prompt:'숫자·동물 생각하면 맞히는 마술 트릭 3종. 재미용.'},
    {id:'g-assoc',    emoji:'💭', name:'단어 연상 게임',           prompt:'주제어에서 연상되는 단어 10개 + 재미있는 연상 포인트.'},
    {id:'g-balance',  emoji:'⚖️',name:'밸런스 게임',              prompt:'둘 중 하나 선택 10문제 + 선택별 재미있는 결과 분석.'}
  ],
  story:[
    {id:'s-me',       emoji:'🌟', name:'내가 주인공인 동화',       prompt:'이름·나이·특기 기반 주인공 동화. 모험·성장·친구 포함.'},
    {id:'s-hero',     emoji:'🦸', name:'나만의 히어로',            prompt:'이름·능력 기반 히어로 스토리 + 히어로 카드(능력치·약점·무기).'},
    {id:'s-animal',   emoji:'🐶', name:'동물 친구 스토리',         prompt:'좋아하는 동물이 주인공인 이야기.'},
    {id:'s-magic',    emoji:'🪄', name:'마법학교 입학',             prompt:'마법 능력 선택 기반 마법학교 입학 스토리.'},
    {id:'s-space',    emoji:'🚀', name:'우주 탐험',                 prompt:'탐험할 행성 선택 기반 우주 탐험 스토리.'},
    {id:'s-choice',   emoji:'🔀', name:'결말 선택 스토리',          prompt:'분기 선택형 이야기. 3가지 결말 분기 제시.'}
  ],
  create:[
    {id:'c-char',     emoji:'🎭', name:'나만의 캐릭터',            prompt:'생김새·성격·특기 기반 캐릭터 설명서 + 이미지 프롬프트.'},
    {id:'c-country',  emoji:'🏳️',name:'나만의 나라',              prompt:'이름·국기 색·규칙 입력 기반 나라 소개서.'},
    {id:'c-food',     emoji:'🍰', name:'나만의 음식 레시피',       prompt:'재료 조합 기반 세상에 없는 새 요리 이름·레시피.'},
    {id:'c-game',     emoji:'🎲', name:'나만의 게임 규칙',          prompt:'나만의 게임 설명서 자동 생성(목표·규칙·승리 조건).'},
    {id:'c-song',     emoji:'🎶', name:'나만의 노래 만들기',        prompt:'주제·분위기 기반 동요·랩·팝 가사.'},
    {id:'c-job',      emoji:'💼', name:'내 꿈 직업 스토리',         prompt:'장래희망 기반 그 직업의 하루 이야기.'}
  ],
  comedy:[
    {id:'co-aj',      emoji:'😆', name:'아재개그 생성기',          prompt:'주제 기반 아재개그 5개 + 웃음 점수 매기기.'},
    {id:'co-mine',    emoji:'🤣', name:'나만의 개그',              prompt:'상황 기반 나만의 개그 대본.'},
    {id:'co-play',    emoji:'🎬', name:'상황극 대본',               prompt:'친구랑 연기할 짧은 상황극 대본.'},
    {id:'co-weird',   emoji:'👽', name:'어이없는 이야기',          prompt:'엉뚱한 설정 기반 웃긴 이야기.'},
    {id:'co-old',     emoji:'📜', name:'훈민정음 변환',            prompt:'현대 문장을 재밌는 옛날 말투로 변환.'},
    {id:'co-alien',   emoji:'🛸', name:'외계인 언어 번역기',        prompt:'문장을 외계인 언어로 변환(재미용). + 해석.'},
    {id:'co-animal',  emoji:'🐱', name:'동물 통역사',              prompt:'동물이 하고 싶은 말을 번역해주기.'}
  ],
  magic:[
    {id:'m-trick',    emoji:'🎩', name:'AI 마술사',                 prompt:'친구한테 써먹을 숫자·카드 마술 트릭 3종 + 진행법.'},
    {id:'m-name',     emoji:'📛', name:'내 이름의 비밀',           prompt:'이름의 뜻·숨겨진 비밀·삼행시.'},
    {id:'m-animal',   emoji:'🦉', name:'동물 되어보기',             prompt:'선택한 동물의 하루 이야기·입장 일기.'},
    {id:'m-future',   emoji:'🔮', name:'미래 예언 (재미용)',       prompt:'생일·이름 기반 재미있는 미래 예언(진지 X).'},
    {id:'m-star',     emoji:'⭐', name:'나만의 별자리',            prompt:'좋아하는 것으로 별자리 탄생 이야기.'},
    {id:'m-power',    emoji:'💫', name:'수퍼파워 검사',             prompt:'좋아하는 것·잘하는 것 기반 숨겨진 수퍼파워.'},
    {id:'m-fortune',  emoji:'🍀', name:'AI 점쟁이 (재미용)',       prompt:'오늘의 럭키 간식·럭키 색깔·럭키 숫자.'},
    {id:'m-animal-me',emoji:'🐾', name:'닮은 동물 찾기',            prompt:'성격·특징 기반 닮은 동물 + 이유.'}
  ],
  challenge:[
    {id:'ch-daily',   emoji:'🎯', name:'오늘의 미션',               prompt:'오늘의 재미있는 어린이 미션 1개 + 완료 조건.'},
    {id:'ch-creative',emoji:'🎨', name:'창의력 챌린지',             prompt:'10초 안에 그림 설명·1분 안에 이야기 완성 챌린지 5종.'},
    {id:'ch-imagine', emoji:'🌈', name:'상상력 테스트',             prompt:'엉뚱한 질문 10개 + 창의적 답변 점수화.'},
    {id:'ch-char',    emoji:'🎭', name:'나는 어떤 캐릭터',          prompt:'질문 10개로 만화 캐릭터 매칭 + 설명.'},
    {id:'ch-spell',   emoji:'🧙', name:'친구 소환 주문',             prompt:'친구 특징 기반 마법 주문 + 효과.'}
  ],
  world:[
    {id:'w-country',  emoji:'🗺️',name:'나라 탐험대',              prompt:'선택한 나라의 재미있는 사실·그 나라 아이들 하루.'},
    {id:'w-food',     emoji:'🍜', name:'음식 탐험대',               prompt:'선택한 나라 대표 음식 소개·집에서 해보는 간단 레시피.'},
    {id:'w-lang',     emoji:'🗣️',name:'언어 탐험대',              prompt:'선택한 나라 인사말·기본 표현 10개·발음 포인트.'},
    {id:'w-culture',  emoji:'🎎', name:'문화 탐험대',               prompt:'선택한 나라의 재미있는 문화 차이·전통 놀이.'}
  ],
  event:[
    {id:'e-birthday', emoji:'🎂', name:'생일파티 도우미',           prompt:'친구 이름 기반 특별 편지 + 파티 게임 3개 추천.'},
    {id:'e-vacation', emoji:'🏖️',name:'방학 계획 마법사',         prompt:'좋아하는 것 기반 재미있는 방학 계획(매일 달라지게).'},
    {id:'e-xmas',     emoji:'🎄', name:'크리스마스 소원 편지',       prompt:'소원 기반 산타할아버지께 보내는 편지.'},
    {id:'e-childday', emoji:'🎁', name:'어린이날 이벤트',           prompt:'하고 싶은 것 기반 어린이날 계획서.'},
    {id:'e-hallo',    emoji:'🎃', name:'핼로윈 코스튬',             prompt:'좋아하는 캐릭터 기반 코스튬 아이디어 + 만들기 힌트.'}
  ]
};

const KIDS_META = {
  family:    {ico:'👨‍👩‍👧‍👦', title:'가족 놀이터',  sub:'가족과 함께 놀고 사랑쌓기 💕'},
  friends:   {ico:'👫',          title:'친구 놀이터',  sub:'친구들과 재밌게 놀아봐요 🎉'},
  games:     {ico:'🎮',          title:'게임 & 놀이',  sub:'AI랑 신나는 게임하기 🎯'},
  story:     {ico:'📖',          title:'나만의 이야기',sub:'내가 주인공! ✨'},
  create:    {ico:'🎨',          title:'창작 놀이',    sub:'만들고 싶은 걸 마음껏 🎨'},
  comedy:    {ico:'😂',          title:'개그 & 유머',  sub:'웃으면 복이 와요 😆'},
  magic:     {ico:'🔮',          title:'신기한 것',    sub:'마술·비밀·예언 🔮'},
  challenge: {ico:'🏆',          title:'도전 & 챌린지',sub:'미션 완료하면 뱃지 받아요 🏅'},
  world:     {ico:'🌍',          title:'세계 여행',    sub:'다른 나라 탐험하기 ✈️'},
  event:     {ico:'🎪',          title:'특별 이벤트',  sub:'생일·방학·크리스마스 🎁'}
};

function kidsContainsBad(text){
  const lower = (text||'').toLowerCase();
  return KIDS_BLOCK_WORDS.some(w => lower.includes(w));
}

let kidsState = { groupId:null, subId:null, output:'', mode:'solo' /* solo/family/friends */ };

function _kidsPoints(){ try{return JSON.parse(localStorage.getItem('uc_kids_points')||'{"total":0,"bonus":0,"badges":{}}');}catch(e){return {total:0,bonus:0,badges:{}};} }
function _kidsSavePoints(p){ localStorage.setItem('uc_kids_points', JSON.stringify(p)); }

function renderKidsHome(){
  const p = _kidsPoints();
  document.getElementById('k-points').textContent = p.total;
  document.getElementById('k-bonus').textContent = p.bonus;
  document.getElementById('k-badges').textContent = Object.keys(p.badges||{}).length;

  const g = document.getElementById('kidsGrid');
  g.innerHTML = '';
  KIDS_CARDS.forEach(c => {
    const b = document.createElement('button');
    b.className = 'kids-card c'+c.c;
    b.innerHTML = (c.star?'<span class="star">⭐</span>':'') +
      '<div class="ico">'+c.ico+'</div>' +
      '<strong>'+c.title+'</strong>' +
      '<span>'+c.desc+'</span>';
    b.onclick = () => openKidsGroup(c.id);
    g.appendChild(b);
  });
}

function openKidsGroup(gid){
  kidsState.groupId = gid;
  kidsState.subId = null;
  kidsState.output = '';
  const meta = KIDS_META[gid];
  const subs = KIDS_SUBS[gid] || [];

  const detail = document.getElementById('kidsDetail');
  detail.classList.remove('hide');
  document.getElementById('kidsStage').classList.add('hide');

  const subBtns = subs.map((s,i) =>
    '<button class="kids-sub-btn" onclick="pickKidsSub(\''+s.id+'\')">'+
      '<span class="emoji">'+s.emoji+'</span> '+s.name+
    '</button>'
  ).join('');

  detail.innerHTML =
    '<button class="kids-back" onclick="closeKids()">← 돌아가기</button>' +
    '<div class="kids-head">' +
      '<span class="bigico">'+meta.ico+'</span>' +
      '<div><h3>'+meta.title+'</h3><p>'+meta.sub+'</p></div>' +
    '</div>' +
    '<div class="kids-subs">'+subBtns+'</div>' +

    '<div class="kids-form" id="kids-form-area" style="display:none">' +
      '<label>📝 어떤 이야기를 만들고 싶어요?</label>' +
      '<textarea class="kinp ktxt" id="k-topic" placeholder="여기에 자유롭게 써주세요! 예: 우리 가족 구성원, 좋아하는 것, 오늘 있었던 일"></textarea>' +
      '<div class="kids-toggle-row">' +
        '<button class="kids-toggle on" id="k-mode-solo" onclick="kSetMode(\'solo\')">👤 혼자 놀기</button>' +
        '<button class="kids-toggle" id="k-mode-family" onclick="kSetMode(\'family\')">👨‍👩‍👧 가족과 (2배!)</button>' +
        '<button class="kids-toggle" id="k-mode-friends" onclick="kSetMode(\'friends\')">👫 친구와 (2배!)</button>' +
      '</div>' +
      '<button class="kids-big-btn" onclick="generateKids()">🎉 AI야 만들어줘! ✨</button>' +
      '<div id="k-care-msg"></div>' +
      '<div class="kids-result" id="k-result"></div>' +
      '<div class="kids-actions" id="k-actions" style="display:none">' +
        '<button class="kids-action-btn" onclick="kCopy()">📋 복사</button>' +
        '<button class="kids-action-btn" onclick="kSave()">💾 저장</button>' +
        '<button class="kids-action-btn" onclick="kPrint()">🖨️ 프린트</button>' +
      '</div>' +
    '</div>';
}

function pickKidsSub(sid){
  const subs = KIDS_SUBS[kidsState.groupId]||[];
  const s = subs.find(x=>x.id===sid); if(!s) return;
  kidsState.subId = sid;
  document.querySelectorAll('.kids-sub-btn').forEach(b=>b.classList.remove('on'));
  event.target.closest('.kids-sub-btn').classList.add('on');
  document.getElementById('kids-form-area').style.display='';

  // 어른 도움 필요 안내
  const careMsg = document.getElementById('k-care-msg');
  if (s.adult) {
    careMsg.innerHTML = '<div class="kids-warning">💗 이 주제는 중요해요. AI가 위로해줄게요, 하지만 <b>담임선생님·부모님·상담선생님</b>께 꼭 말해주세요. 도움받는 건 용기 있는 일이에요!</div>';
  } else if (s.care) {
    careMsg.innerHTML = '<div class="kids-warning">💗 힘들었지? AI가 같이 생각해볼게요.</div>';
  } else {
    careMsg.innerHTML = '';
  }
}

function kSetMode(m){
  kidsState.mode = m;
  ['solo','family','friends'].forEach(x => document.getElementById('k-mode-'+x)?.classList.toggle('on', x===m));
}

function closeKids(){
  document.getElementById('kidsDetail').classList.add('hide');
  document.getElementById('kidsStage').classList.remove('hide');
  renderKidsHome();
}

async function generateKids(){
  const sub = (KIDS_SUBS[kidsState.groupId]||[]).find(x=>x.id===kidsState.subId);
  if(!sub){ alert('어떤 놀이를 할지 먼저 골라주세요!'); return; }
  const topic = document.getElementById('k-topic').value.trim();
  if(!topic){ alert('✨ 뭘 하고 싶은지 적어주세요!'); return; }
  if(kidsContainsBad(topic)){ alert('🙅 적절하지 않은 단어가 있어요. 다시 적어볼까요?'); return; }

  const result = document.getElementById('k-result');
  result.textContent = '✨ AI가 열심히 만들고 있어요... 🎨';

  try {
    if (typeof APIAdapter === 'undefined') throw new Error('AI가 아직 준비 안됐어요. 부모님께 API 키 등록을 요청해주세요.');
    {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
    {const v=localStorage.getItem('uc_openai_key'); if(v) APIAdapter.setApiKey('openai',v);}

    const sys = '당신은 어린이를 위한 친근한 AI 친구다. 7~13세 어린이가 읽을 수 있는 쉬운 말로, 따뜻하고 긍정적으로 답변. ' +
      '폭력·성인 콘텐츠·부적절 표현·외부 링크·개인정보 요구 절대 금지. 이모지를 풍부하게 사용. ' +
      '주제: ' + sub.name + '\n규칙: ' + sub.prompt + (sub.adult ? '\n※ 심각한 주제는 반드시 어른(부모/선생님)에게 도움 요청 안내 포함.' : '');
    const r = await APIAdapter.callWithFallback(sys, topic, { maxTokens:1500 });
    const clean = kidsSanitize(r);
    if (kidsContainsBad(clean)) { result.textContent = '🙅 결과가 적절하지 않아서 다시 만들게요. 다른 주제로 시도해볼까요?'; return; }

    kidsState.output = clean;
    result.textContent = clean;
    document.getElementById('k-actions').style.display='flex';

    // 포인트·뱃지
    const p = _kidsPoints();
    let earned = 10;
    if (kidsState.mode === 'family') { earned = 20; p.bonus += 10; }
    else if (kidsState.mode === 'friends') { earned = 20; p.bonus += 10; }
    p.total += earned;

    // 뱃지 획득 체크
    const badgeMap = { family:'family', friends:'friends', games:'game', story:'story',
      create:'create', comedy:'comedy', challenge:'cheer' };
    const bk = badgeMap[kidsState.groupId];
    if (bk && !p.badges[bk]) { p.badges[bk] = { earnedAt: Date.now() }; showBadgePopup(bk); }
    _kidsSavePoints(p);
    showPointsPopup(earned);
    // 메인 통계 갱신
    document.getElementById('k-points').textContent = p.total;
    document.getElementById('k-bonus').textContent = p.bonus;
    document.getElementById('k-badges').textContent = Object.keys(p.badges).length;
  } catch(err) {
    result.textContent = '앗! 문제가 생겼어요. ' + err.message;
  }
}

function showPointsPopup(n){
  const pop = document.createElement('div');
  pop.className = 'kids-points-pop';
  pop.textContent = '+' + n + ' 포인트! 🎉';
  document.body.appendChild(pop);
  setTimeout(()=>pop.remove(), 2300);
}
function showBadgePopup(key){
  const b = BADGES[key]; if(!b) return;
  setTimeout(()=>{
    const pop = document.createElement('div');
    pop.className = 'kids-points-pop';
    pop.innerHTML = '🏆 ' + b.icon + ' ' + b.label + ' 뱃지 획득!';
    pop.style.background = 'linear-gradient(135deg,#9A8AE3,#FFD700)';
    document.body.appendChild(pop);
    setTimeout(()=>pop.remove(), 2800);
  }, 2400);
}

function kCopy(){
  if (!kidsState.output) return;
  navigator.clipboard.writeText(kidsState.output).then(()=>{
    alert('📋 복사 완료! 친구한테 보여줘요 ✨');
  });
}
function kSave(){
  if (!kidsState.output) return;
  const key = 'uc_kids_saved';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  const sub = (KIDS_SUBS[kidsState.groupId]||[]).find(x=>x.id===kidsState.subId);
  list.unshift({ at:Date.now(), group:kidsState.groupId, sub:sub?.id, name:sub?.name, body:kidsState.output });
  localStorage.setItem(key, JSON.stringify(list.slice(0,30)));
  alert('💾 저장 완료! 나중에 다시 볼 수 있어요 🌟');
}
function kPrint(){
  if (!kidsState.output) return;
  const sub = (KIDS_SUBS[kidsState.groupId]||[]).find(x=>x.id===kidsState.subId);
  const w = window.open('', '_blank', 'width=720,height=900');
  const safeHtml = kidsState.output
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+(sub?.name||'결과')+'</title>' +
    '<style>@import url(https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap);' +
    'body{font-family:"나눔손글씨",Pretendard,sans-serif;padding:30px;max-width:700px;margin:0 auto;background:#fff9fc}' +
    'h1{color:#b14d82;font-size:28px;border-bottom:3px dashed #FF6EC7;padding-bottom:10px}' +
    '.content{font-size:18px;line-height:2;padding:20px;background:#fff5fa;border:3px dashed #FF6EC7;border-radius:20px;min-height:300px}' +
    '.footer{margin-top:30px;text-align:center;font-size:13px;color:#888}' +
    '@media print{body{background:#fff}.content{background:#fff}}</style></head><body>' +
    '<h1>'+(sub?.emoji||'✨')+' '+(sub?.name||'결과')+'</h1>' +
    '<div class="content">'+safeHtml+'</div>' +
    '<div class="footer">🌈 어린이 모드 · ' + new Date().toLocaleDateString('ko-KR') + '</div>' +
    '<script>window.print()<\/script></body></html>');
  w.document.close();
}

/* ═══════════════════════════════════════════════
   🧸 어린이 모드 — 🎨 캐릭터 놀이터 카테고리 (추가 전용)
   ※ 기존 어린이 모드 기능을 전혀 건드리지 않고 데이터만 추가합니다.
   =============================================== */
