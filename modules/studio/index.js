/* ================================================
   index.js
   common constants / voice data (KO+JA) / GENRE_VOICE_MAP / SCENE_TEMPLATES
   modules/studio/ -- split_studio2.py
   ================================================ */


/* ═══════════════════════════════════════════════════════════
   STUDIO VOICE DATA  v2.0  (20+ 음성, 다자 화자, 장르 자동 배치)
   ═══════════════════════════════════════════════════════════ */

const STUDIO_VOICE_KO = [
  /* ElevenLabs */
  {id:'e_rachel',  provider:'elevenlabs', voice:'Rachel',   name:'Rachel',   gender:'female', mood:'warm',        lang:'ko', tags:['나레이션','감성','시니어']},
  {id:'e_bella',   provider:'elevenlabs', voice:'Bella',    name:'Bella',    gender:'female', mood:'soft',        lang:'ko', tags:['나레이션','부드러움','명상']},
  {id:'e_domi',    provider:'elevenlabs', voice:'Domi',     name:'Domi',     gender:'female', mood:'bright',      lang:'ko', tags:['캐릭터','밝음','티키타카']},
  {id:'e_elli',    provider:'elevenlabs', voice:'Elli',     name:'Elli',     gender:'female', mood:'young',       lang:'ko', tags:['캐릭터','젊음','대화']},
  {id:'e_grace',   provider:'elevenlabs', voice:'Grace',    name:'Grace',    gender:'female', mood:'cheerful',    lang:'ko', tags:['튜토리얼','설명','밝음']},
  {id:'e_charlotte',provider:'elevenlabs',voice:'Charlotte',name:'Charlotte',gender:'female', mood:'authoritative',lang:'ko',tags:['뉴스','다큐','권위']},
  {id:'e_adam',    provider:'elevenlabs', voice:'Adam',     name:'Adam',     gender:'male',   mood:'calm',        lang:'ko', tags:['나레이션','안정','롱폼']},
  {id:'e_josh',    provider:'elevenlabs', voice:'Josh',     name:'Josh',     gender:'male',   mood:'deep',        lang:'ko', tags:['다큐','권위','진중']},
  {id:'e_thomas',  provider:'elevenlabs', voice:'Thomas',   name:'Thomas',   gender:'male',   mood:'casual',      lang:'ko', tags:['티키타카','대화','자연']},
  {id:'e_sam',     provider:'elevenlabs', voice:'Sam',      name:'Sam',      gender:'male',   mood:'friendly',    lang:'ko', tags:['튜토리얼','인터뷰','친근']},
  {id:'e_ethan',   provider:'elevenlabs', voice:'Ethan',    name:'Ethan',    gender:'male',   mood:'storytelling',lang:'ko', tags:['드라마','스토리','감성']},
  {id:'e_michael', provider:'elevenlabs', voice:'Michael',  name:'Michael',  gender:'male',   mood:'strong',      lang:'ko', tags:['뉴스','권위','강함']},
  /* OpenAI TTS */
  {id:'o_nova',    provider:'openai',     voice:'nova',     name:'Nova',     gender:'female', mood:'bright',      lang:'ko', tags:['나레이션','밝음','범용']},
  {id:'o_shimmer', provider:'openai',     voice:'shimmer',  name:'Shimmer',  gender:'female', mood:'soft',        lang:'ko', tags:['나레이션','부드러움','명상']},
  {id:'o_alloy',   provider:'openai',     voice:'alloy',    name:'Alloy',    gender:'neutral',mood:'calm',        lang:'ko', tags:['정보','안정','범용']},
  {id:'o_echo',    provider:'openai',     voice:'echo',     name:'Echo',     gender:'male',   mood:'calm',        lang:'ko', tags:['나레이션','안정','남성']},
  {id:'o_fable',   provider:'openai',     voice:'fable',    name:'Fable',    gender:'male',   mood:'storytelling',lang:'ko', tags:['스토리','드라마','감성']},
  {id:'o_onyx',    provider:'openai',     voice:'onyx',     name:'Onyx',     gender:'male',   mood:'deep',        lang:'ko', tags:['다큐','딥','권위']},
  /* Nijivoice (일본어) */
  {id:'n_yuki',    provider:'nijivoice',  voice:'yuki',     name:'유키',     gender:'female', mood:'warm',        lang:'ja', tags:['일본어','시니어','감성']},
  {id:'n_hana',    provider:'nijivoice',  voice:'hana',     name:'하나',     gender:'female', mood:'bright',      lang:'ja', tags:['일본어','밝음','캐릭터']},
  {id:'n_sakura',  provider:'nijivoice',  voice:'sakura',   name:'사쿠라',   gender:'female', mood:'soft',        lang:'ja', tags:['일본어','부드러움','명상']},
  {id:'n_ai',      provider:'nijivoice',  voice:'ai',       name:'아이',     gender:'female', mood:'young',       lang:'ja', tags:['일본어','젊음','티키타카']},
  {id:'n_kenji',   provider:'nijivoice',  voice:'kenji',    name:'켄지',     gender:'male',   mood:'calm',        lang:'ja', tags:['일본어','안정','나레이션']},
  {id:'n_taro',    provider:'nijivoice',  voice:'taro',     name:'타로',     gender:'male',   mood:'casual',      lang:'ja', tags:['일본어','대화','티키타카']},
  {id:'n_ryu',     provider:'nijivoice',  voice:'ryu',      name:'류',       gender:'male',   mood:'deep',        lang:'ja', tags:['일본어','다큐','권위']},
];

/* 장르별 화자 자동 설정 맵 */
const GENRE_VOICE_MAP = {
  narration:   {count:1, pairs:[['female','warm']],                              label:'🎙 나레이션 1인',    scenes:'narration'},
  tikitaka:    {count:2, pairs:[['female','bright'],['male','casual']],          label:'💬 티키타카 2인',    scenes:'tikitaka'},
  drama:       {count:3, pairs:[['female','warm'],['male','calm'],['female','soft']], label:'🎭 드라마 3인',  scenes:'drama'},
  longform:    {count:2, pairs:[['female','warm'],['male','calm']],              label:'📺 롱폼 진행자+게스트', scenes:'longform'},
  documentary: {count:1, pairs:[['male','deep']],                               label:'🎬 다큐 나레이션',   scenes:'narration'},
  interview:   {count:2, pairs:[['female','warm'],['male','friendly']],         label:'🎤 인터뷰 2인',      scenes:'interview'},
  tutorial:    {count:1, pairs:[['female','bright']],                           label:'📚 튜토리얼 1인',    scenes:'tutorial'},
  meditation:  {count:1, pairs:[['female','soft']],                             label:'🧘 명상 1인',        scenes:'narration'},
  news:        {count:1, pairs:[['female','authoritative']],                    label:'📰 뉴스 앵커',       scenes:'news'},
  character:   {count:2, pairs:[['female','young'],['male','casual']],          label:'🌟 캐릭터 2인',      scenes:'tikitaka'},
};

/* 씬별 구성 템플릿 (장르별 동적) */
const SCENE_TEMPLATES = {
  narration: [
    {role:'narr', label:'인트로·도입'},
    {role:'narr', label:'본론 핵심'},
    {role:'narr', label:'심화·예시'},
    {role:'narr', label:'정리·결론'},
    {role:'narr', label:'CTA·마무리'},
  ],
  tikitaka: [
    {role:'A', label:'🙋 A: 오프닝 질문'},
    {role:'B', label:'💡 B: 첫 응답'},
    {role:'A', label:'🙋 A: 심화 질문'},
    {role:'B', label:'💡 B: 핵심 답변'},
    {role:'A', label:'🙋 A: 공감·요약'},
    {role:'B', label:'💡 B: 추가 팁'},
    {role:'AB',label:'🤝 A+B: 마무리 CTA'},
  ],
  drama: [
    {role:'narr', label:'📖 내레이션 도입'},
    {role:'A',    label:'🎭 A: 상황 전개'},
    {role:'B',    label:'🎭 B: 갈등 반응'},
    {role:'A',    label:'🎭 A: 감정 클라이맥스'},
    {role:'B',    label:'🎭 B: 전환점'},
    {role:'narr', label:'📖 에필로그'},
  ],
  longform: [
    {role:'A', label:'🎬 인트로 (0~1분)'},
    {role:'A', label:'📌 주제 소개 (1~3분)'},
    {role:'B', label:'👤 게스트 발언 1'},
    {role:'A', label:'🔍 심화 질문'},
    {role:'B', label:'👤 게스트 발언 2'},
    {role:'A', label:'📊 데이터·사례'},
    {role:'B', label:'👤 마지막 코멘트'},
    {role:'A', label:'🏁 결론 + CTA'},
  ],
  interview: [
    {role:'A', label:'🎤 인터뷰어 소개'},
    {role:'A', label:'🎤 첫 번째 질문'},
    {role:'B', label:'🙋 게스트 답변 1'},
    {role:'A', label:'🎤 두 번째 질문'},
    {role:'B', label:'🙋 게스트 답변 2'},
    {role:'A', label:'🎤 마무리 질문'},
    {role:'B', label:'🙋 마지막 말'},
  ],
  tutorial: [
    {role:'narr', label:'🎯 목표 소개'},
    {role:'narr', label:'📋 준비물·개요'},
    {role:'narr', label:'🔧 Step 1'},
    {role:'narr', label:'🔧 Step 2'},
    {role:'narr', label:'🔧 Step 3'},
    {role:'narr', label:'✅ 확인·마무리'},
  ],
  news: [
    {role:'narr', label:'📢 헤드라인'},
    {role:'narr', label:'📰 상세 내용'},
    {role:'narr', label:'📊 배경·맥락'},
    {role:'narr', label:'🔍 분석·전망'},
    {role:'narr', label:'📌 마무리'},
  ],
};



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

/* ─── 전역 상태 ───
   classic <script> 의 const 는 global declarative record 에만 들어가 window 에
   직접 노출되지 않는다. 외부(테스트/엔진 진입 HTML/devtools)에서 동일 객체를
   보려면 window.STUDIO 도 같은 reference 로 동기화해야 한다. */
const STUDIO = (typeof window !== 'undefined' && window.STUDIO && typeof window.STUDIO === 'object')
  ? window.STUDIO
  : { project: null, autoSaveTimer: null };
if (typeof window !== 'undefined') window.STUDIO = STUDIO;

