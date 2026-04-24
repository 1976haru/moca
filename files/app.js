<script>
const categories = [
  {id:'script',   icon:'✍️', title:'대본 생성기',       desc:'🏆 쇼츠·롱폼 대본 · 가장 중요'},
  {id:'media',    icon:'🎬', title:'미디어 엔진',       desc:'음성·이미지·영상·음악'},
  {id:'shorts',   icon:'📱', title:'자동숏츠',          desc:'8단계 원클릭 파이프라인'},
  // 콘텐츠 빌더 제거 - 기능이 모든 카테고리 미디어 바로 통합됨
  {id:'profit',   icon:'💰', title:'수익형 콘텐츠',     desc:'블로그·전자책·웹툰·SNS · 수익화'},
  {id:'public',   icon:'🏛️', title:'공공기관 패키지',   desc:'보도자료·공문·회의록'},
  {id:'edu',      icon:'📚', title:'학습/교육',         desc:'강의자료·퀴즈·워크북'},
  {id:'trans',    icon:'🌐', title:'번역/통역/다국어',  desc:'한·영·일·중 동시 변환'},
  {id:'smb',      icon:'🏪', title:'소상공인 패키지',   desc:'메뉴판·전단지·SNS'},
  {id:'psy',      icon:'🔮', title:'심리/운세/사주',    desc:'타로·MBTI·사주풀이'},
  {id:'library',  icon:'📁', title:'내 보관함',         desc:'만든 것들을 여기서 다시 찾아요!'},
  {id:'trend',    icon:'🔥', title:'트렌드 분석',       desc:'지금 뭐가 뜨고 있는지 알아봐요!'},
  {id:'bench',    icon:'🔍', title:'유튜브 벤치마킹',   desc:'잘된 영상 분석 · 공식 라이브러리'},
  {id:'share',    icon:'📤', title:'공유센터',          desc:'만든 것을 팀원과 나눠요!'}
];

const cards = {
  script:[
    {i:'✨',t:'일반 대본',      s:'쇼츠·롱폼 대본 기본 생성',     bg:'bg-pink',  tag:'대본',   tab:'gen'},
    {i:'🎬',t:'통합 생성',      s:'여러 에피소드 배치 생성',      bg:'bg-purple',tag:'배치',   tab:'batch'},
    {i:'🎵',t:'가사/음원',      s:'Suno용 가사·스타일 분리',     bg:'bg-green', tag:'음원',   tab:'lyric'},
    {i:'📜',t:'사자성어·명언',  s:'명언 기반 지식 콘텐츠',        bg:'bg-blue',  tag:'지식',   tab:'saying'},
    {i:'😄',t:'코믹·유머',      s:'웃음 포인트 자동 배치',        bg:'bg-peach', tag:'유머',   tab:'humor'},
    {i:'🔬',t:'전문지식',      s:'리서치 기반 정보 대본',        bg:'bg-mint',  tag:'지식',   tab:'know'},
    {i:'🧩',t:'잡학',          s:'궁금증 자극 트리비아',         bg:'bg-pink',  tag:'잡학',   tab:'trivia'},
    {i:'🎭',t:'숏드라마',      s:'반전·몰입형 숏드라마',         bg:'bg-purple',tag:'드라마', tab:'drama'},
    {i:'💝',t:'감동스토리',    s:'실화·사연·눈물버튼 (KO+JP)',   bg:'bg-pink',  tag:'감동',   tab:'story'},
    {i:'📁',t:'히스토리',      s:'최근 저장된 대본 불러오기',    bg:'bg-blue',  tag:'관리',   tab:'hist'},
    {i:'⚙️',t:'프리셋',        s:'저장된 설정 관리',             bg:'bg-green', tag:'관리',   tab:'preset'},
    {i:'📖',t:'가이드',        s:'사용 안내·팁',                 bg:'bg-mint',  tag:'도움',   tab:'guide'}
  ],
  media:[
    {i:'🎤',t:'변환허브',s:'ElevenLabs·InVideo 변환',bg:'bg-peach',tag:'변환',engine:'script',tab:'hub'},
    {i:'🖼️',t:'썸네일 생성',s:'CTR 높은 썸네일 자동화',bg:'bg-pink',tag:'이미지'},
    {i:'🎥',t:'영상 조립',s:'장면별 영상 자동 편집',bg:'bg-purple',tag:'영상'},
    {i:'💬',t:'자막 싱크',s:'SRT·VTT 자동 생성',bg:'bg-green',tag:'자막'},
    {i:'🎙️',t:'TTS 음성',s:'ElevenLabs 연동',bg:'bg-blue',tag:'음성'},
    {i:'🎞️',t:'프레임 유지',s:'InVideo 구조 변환',bg:'bg-mint',tag:'변환'},
    {i:'🎨',t:'스타일 프리셋',s:'채널별 톤앤매너',bg:'bg-pink',tag:'프리셋'}
  ],
  monetize:[
    {i:'📝',t:'블로그',          s:'네이버·브런치·티스토리',           bg:'bg-pink',  tag:'블로그',  bldId:'blog'},
    {i:'📧',t:'뉴스레터',        s:'스티비·메일침프·비히브',           bg:'bg-blue',  tag:'구독',    bldId:'newsletter'},
    {i:'🎨',t:'웹툰/만화',       s:'네이버웹툰 스타일·일상툰',         bg:'bg-green', tag:'창작',    bldId:'webtoon'},
    {i:'📱',t:'SNS 카드뉴스',    s:'인스타·카카오채널·스토리',         bg:'bg-mint',  tag:'SNS',     bldId:'sns'},
    {i:'📊',t:'전자책 / PDF',    s:'크몽·클래스101·자료집',            bg:'bg-purple',tag:'PDF',     bldId:'ebook'},
    {i:'🌐',t:'랜딩페이지',      s:'링크인바이오·원페이지',             bg:'bg-peach', tag:'LP',      bldId:'landing'}
  ],
  profit:[
    {i:'📝',t:'블로그 (수익화)',  s:'네이버·브런치 · CTA 자동',          bg:'bg-pink',  tag:'블로그',  bldId:'blog'},
    {i:'📊',t:'전자책 / PDF',     s:'크몽·클래스101 판매용',             bg:'bg-purple',tag:'판매',    bldId:'ebook'},
    {i:'🎨',t:'웹툰/창작',        s:'유료 연재 · 광고수익',               bg:'bg-green', tag:'창작',    bldId:'webtoon'},
    {i:'📧',t:'유료 뉴스레터',    s:'스티비·비히브 구독형',              bg:'bg-blue',  tag:'구독',    bldId:'newsletter'},
    {i:'📱',t:'SNS 수익화',       s:'인스타·제휴마케팅·광고',             bg:'bg-mint',  tag:'SNS',     bldId:'sns'},
    {i:'🌐',t:'랜딩페이지',       s:'상품·서비스 판매 LP',                bg:'bg-peach', tag:'LP',      bldId:'landing'}
  ],
  public:[
    {i:'📄',t:'문서/보고서',     s:'정책·업무·기안·회의·감사·연간계획',     bg:'bg-blue',  tag:'보고',   pbId:'doc'},
    {i:'📰',t:'보도/홍보',       s:'보도자료·해명·홍보·인터뷰·SNS',        bg:'bg-pink',  tag:'홍보',   pbId:'press'},
    {i:'🎨',t:'디자인/인쇄물',   s:'포스터·현수막·명함·리플릿·배너',       bg:'bg-purple',tag:'디자인', pbId:'design'},
    {i:'🗂️',t:'민원/소통',       s:'민원답변·안내문·이의신청·청원',        bg:'bg-green', tag:'민원',   pbId:'civil'},
    {i:'⚖️',t:'법원/사법',       s:'결정전·판결전·보호관찰·면담보고',      bg:'bg-peach', tag:'법원',   pbId:'court'},
    {i:'📜',t:'법령/행정',       s:'법령해설·행정예고·처분통지·심판',       bg:'bg-mint',  tag:'법령',   pbId:'law'},
    {i:'💡',t:'제도/행정 개선',  s:'제도개선·규제혁신·국민제안·적극행정',  bg:'bg-pink',  tag:'개선',   pbId:'improve'},
    {i:'📊',t:'기획/예산',       s:'사업·예산·성과·타당성·RFP',            bg:'bg-blue',  tag:'기획',   pbId:'plan'},
    {i:'🎪',t:'행사/교육',       s:'행사계획·식순·커리큘럼·초청장',        bg:'bg-peach', tag:'행사',   pbId:'event'},
    {i:'🏆',t:'상훈/표창',       s:'표창장·감사패·공로패·훈포장',           bg:'bg-purple',tag:'표창',   pbId:'award'},
    {i:'📋',t:'계약/조달',       s:'계약서·입찰공고·MOU·협조공문',         bg:'bg-green', tag:'조달',   pbId:'contract'},
    {i:'🌐',t:'대외협력',        s:'국제공문·자매결연·외빈환영·다국어',    bg:'bg-blue',  tag:'국제',   pbId:'intl'},
    {i:'📱',t:'소셜/디지털',     s:'공식SNS·유튜브·카드뉴스·챗봇',         bg:'bg-mint',  tag:'디지털', pbId:'social'},
    {i:'🚨',t:'위기관리/대응',   s:'위기공문·사과문·입장문·재난안내',      bg:'bg-pink',  tag:'위기',   pbId:'crisis'},
    {i:'🖥️',t:'PPT 슬라이드 제작', s:'제도설명·정책발표·행사안내·성과보고',  bg:'bg-blue',  tag:'PPT',    pbId:'ppt'}
  ],
  edu:[
    {i:'🧒',t:'초등 저학년 (1~3)',   s:'일기·독후감·받아쓰기·창작동화',         bg:'bg-pink',  tag:'초저',  eduId:'elem-low'},
    {i:'👦',t:'초등 고학년 (4~6)',   s:'독서록·탐구·논설문·수행평가',          bg:'bg-purple',tag:'초고',  eduId:'elem-high'},
    {i:'📖',t:'중학교',              s:'과목별 개념·서술형·영어에세이',        bg:'bg-green', tag:'중',    eduId:'middle'},
    {i:'🎓',t:'고등학교 ⭐',         s:'수능·논술·생활기록부·자소서',          bg:'bg-blue',  tag:'고',    eduId:'high'},
    {i:'🏛️',t:'대학교',              s:'레포트·논문·발표·인턴십',              bg:'bg-peach', tag:'대',    eduId:'univ'},
    {i:'🔬',t:'대학원',              s:'연구계획·초록·학회·심사',              bg:'bg-mint',  tag:'원',    eduId:'grad'},
    {i:'🌐',t:'언어학습',            s:'한·영·일 + JLPT·회화·교정',            bg:'bg-pink',  tag:'언어',  eduId:'lang'},
    {i:'📝',t:'시험/수능 특화',      s:'개념카드·예상문제·오답노트',           bg:'bg-blue',  tag:'시험',  eduId:'exam'},
    {i:'🤖',t:'AI 튜터 ⭐',          s:'단계별 풀이·오답분석·맞춤제안',        bg:'bg-purple',tag:'튜터',  eduId:'tutor'},
    {i:'🗓️',t:'학습 플래너',         s:'시험날짜→자동일정·체크리스트',         bg:'bg-green', tag:'플랜',  eduId:'planner'},
    {i:'📚',t:'독서 교육',           s:'활동지·토론질문·서평',                 bg:'bg-peach', tag:'독서',  eduId:'reading'},
    {i:'🫶',t:'특수교육/느린학습자',s:'쉬운말·그림설명·반복학습',             bg:'bg-mint',  tag:'특수',  eduId:'special'},
    {i:'🏆',t:'입시 전략 ⭐',        s:'대학별·학종·면접·포트폴리오',          bg:'bg-pink',  tag:'입시',  eduId:'admission'},
    {i:'📜',t:'자격증/시험',         s:'한국사·공무원·TOEIC·JLPT',             bg:'bg-blue',  tag:'자격',  eduId:'cert'},
    {i:'🍎',t:'교사/강사 ⭐',        s:'수업지도안·평가·가정통신문',           bg:'bg-green', tag:'교사',  eduId:'teacher'},
    {i:'🏡',t:'홈스쿨링',            s:'커리큘럼·주간계획·포트폴리오',         bg:'bg-peach', tag:'홈',    eduId:'homeschool'},
    {i:'🎉',t:'학교 행사',           s:'학예회·학급신문·축제·급훈',            bg:'bg-purple',tag:'행사',  eduId:'school-event'},
    {i:'👨‍👩‍👧',t:'부모 지원 ⭐',     s:'학부모총회·교사소통·진로대화',         bg:'bg-pink',  tag:'부모',  eduId:'parent'},
    {i:'📺',t:'교육 유튜브 채널',    s:'초등동화·중고문제풀이·성인강의',       bg:'bg-mint',  tag:'채널',  eduId:'yt-edu'}
  ],
  trans:[
    {i:'💼',t:'비즈니스 번역',       s:'이메일·공문·계약·IR·제안서',        bg:'bg-blue',  tag:'비즈', trId:'business'},
    {i:'💬',t:'대화체/구어체 ⭐',    s:'카톡·라인·댓글·회화·슬랭·여행',    bg:'bg-pink',  tag:'대화', trId:'casual'},
    {i:'🏛️',t:'공공기관/법률 ⭐',    s:'공문·판결·비자·공증·행정서류',      bg:'bg-peach', tag:'법률', trId:'legal'},
    {i:'🏥',t:'의료/복지 ⭐',        s:'진단서·처방전·의료동의·복지안내',   bg:'bg-green', tag:'의료', trId:'medical'},
    {i:'🎮',t:'엔터/게임',           s:'게임UI·웹툰·자막·가사·팬픽',         bg:'bg-purple',tag:'엔터', trId:'entertain'},
    {i:'🛒',t:'커머스/마케팅',       s:'쿠팡→아마존→라쿠텐·현지화·리뷰',    bg:'bg-mint',  tag:'커머스',trId:'commerce'},
    {i:'🎥',t:'콘텐츠/미디어',       s:'유튜브자막·블로그·뉴스레터·전자책',  bg:'bg-blue',  tag:'미디어',trId:'content'},
    {i:'📚',t:'학습 연계 번역 ⭐',   s:'교과서·지문·자소서·JLPT·유학서류',   bg:'bg-peach', tag:'학습', trId:'edu'},
    {i:'🎤',t:'통역 준비',           s:'회의·발표·인터뷰·의전·전화',         bg:'bg-pink',  tag:'통역', trId:'interpret'},
    {i:'🌏',t:'현지화/문화 ⭐',      s:'속담·유머·경어·음식·연령대 말투',    bg:'bg-green', tag:'문화', trId:'localize'},
    {i:'✍️',t:'문체 교정/윤문',      s:'직역→자연·번역투교정·원어민감수',   bg:'bg-purple',tag:'교정', trId:'polish'},
    {i:'✈️',t:'여행/생활 ⭐',        s:'식당·쇼핑·숙소·병원·긴급·교통',     bg:'bg-mint',  tag:'여행', trId:'travel'},
    {i:'🌐',t:'재외교포/외국인 ⭐',  s:'양국 행정·법률·세금·학교·직장',      bg:'bg-pink',  tag:'재외', trId:'overseas'},
    {i:'🗺️',t:'다국어 동시생성 ⭐',  s:'한영일중 동시·SEO·.srt 자막',        bg:'bg-blue',  tag:'멀티', trId:'multilang'}
  ],
  smb:[
    {i:'🍽️',t:'외식업 특화',       s:'메뉴판·배달앱·알레르기·원산지',         bg:'bg-pink',  tag:'외식', smbId:'restaurant'},
    {i:'🏪',t:'매장 운영',          s:'소개·영업시간·이용안내·쿠폰',            bg:'bg-peach', tag:'매장', smbId:'store'},
    {i:'📢',t:'광고/마케팅',        s:'전단지·당근·네이버플레이스·시즌',       bg:'bg-purple',tag:'광고', smbId:'ads'},
    {i:'📱',t:'SNS 운영',           s:'인스타·블로그·카톡·유튜브·월간캘린더',  bg:'bg-blue',  tag:'SNS',  smbId:'sns'},
    {i:'🛒',t:'온라인 판매',        s:'스마트스토어·쿠팡·아마존·라쿠텐',        bg:'bg-green', tag:'판매', smbId:'online'},
    {i:'💬',t:'고객 응대',          s:'리뷰답글·클레임·VIP·지연사과',          bg:'bg-mint',  tag:'CS',   smbId:'cs'},
    {i:'🎉',t:'이벤트/프로모션',    s:'개업·기념일·시즌·SNS공유·스탬프',        bg:'bg-pink',  tag:'이벤트',smbId:'event'},
    {i:'📋',t:'사업 문서 ⭐',       s:'사업계획·지원금신청·임대·채용',          bg:'bg-peach', tag:'문서', smbId:'docs'},
    {i:'💰',t:'세무/회계',          s:'매출지출·부가세·세금계산서·절세',        bg:'bg-blue',  tag:'세무', smbId:'tax'},
    {i:'🖥️',t:'디지털 전환',        s:'배달·스마트스토어·SNS·예약·키오스크',   bg:'bg-purple',tag:'DX',   smbId:'digital'},
    {i:'📊',t:'경영 전략',          s:'경쟁사·가격·상권·성수기·폐업대응',       bg:'bg-green', tag:'전략', smbId:'strategy'},
    {i:'👔',t:'직원 관리',          s:'교육매뉴얼·채용·격려·퇴직안내',          bg:'bg-mint',  tag:'HR',   smbId:'hr'},
    {i:'🌏',t:'외국인/해외진출 ⭐', s:'다국어메뉴·면세·일본관광객·인바운드',    bg:'bg-pink',  tag:'해외', smbId:'foreign'},
    {i:'🏢',t:'업종별 특화',        s:'미용·카페·쇼핑몰·학원·병원·부동산',      bg:'bg-peach', tag:'업종', smbId:'industry'},
    {i:'🤖',t:'자동화 패키지 ⭐',   s:'월간SNS·리뷰답글·고객시퀀스·경쟁사',     bg:'bg-blue',  tag:'자동', smbId:'auto'}
  ],
  psy:[
    {i:'🧠',t:'MBTI/성격 분석',    s:'16유형·궁합·팀빌딩·성장플랜',        bg:'bg-purple',tag:'MBTI', psyId:'mbti'},
    {i:'🔮',t:'운세/타로',         s:'오늘·주간·연간·12간지·별자리·혈액형',bg:'bg-pink',  tag:'운세', psyId:'fortune'},
    {i:'🀄',t:'사주/명리학',       s:'사주팔자·용신·대운·신살·궁합',       bg:'bg-peach', tag:'사주', psyId:'saju'},
    {i:'✍️',t:'작명 서비스',       s:'아기·상호·예명·반려·채널명(한일영)',bg:'bg-green', tag:'작명', psyId:'naming'},
    {i:'💞',t:'궁합/연애',         s:'소개팅·썸·이별·결혼·권태기',         bg:'bg-pink',  tag:'연애', psyId:'love'},
    {i:'💼',t:'직업/진로/취업',    s:'적성·창업·이직·합격·노후',           bg:'bg-blue',  tag:'진로', psyId:'career-p'},
    {i:'💰',t:'재물/투자',         s:'재물운·주식·부동산·코인·사업',       bg:'bg-mint',  tag:'재물', psyId:'wealth'},
    {i:'🧭',t:'풍수/공간',         s:'집·사무실·방위·묘자리',              bg:'bg-peach', tag:'풍수', psyId:'feng-shui'},
    {i:'🧩',t:'심리 테스트',       s:'자존감·에니어그램·애착·번아웃',      bg:'bg-purple',tag:'심리', psyId:'test'},
    {i:'🌿',t:'힐링/상담',         s:'확언·명상·감정일기·자존감 회복',     bg:'bg-green', tag:'힐링', psyId:'healing'},
    {i:'🐾',t:'반려동물 운세 ⭐',  s:'성격·궁합·작명·무지개다리 힐링',     bg:'bg-pink',  tag:'펫',   psyId:'pet'},
    {i:'👶',t:'육아/자녀 ⭐',      s:'기질·학습·형제·궁합·태몽',           bg:'bg-blue',  tag:'자녀', psyId:'child'},
    {i:'🍎',t:'건강/체질 ⭐',      s:'오행체질·사상체질·주의시기',         bg:'bg-mint',  tag:'건강', psyId:'health'},
    {i:'🎊',t:'시즌/이벤트 ⭐',    s:'신년·수능·취업·밸런타인·명절',       bg:'bg-peach', tag:'시즌', psyId:'season'},
    {i:'🗺️',t:'한/일/영 특화 ⭐⭐',s:'오미쿠지·주역·점성술·八字·3언어',   bg:'bg-purple',tag:'문화', psyId:'culture'},
    {i:'💎',t:'프리미엄 서비스',   s:'종합리포트·커플·가족·B2B·구독',      bg:'bg-pink',  tag:'프리', psyId:'premium'}
  ],
  shorts:[
    {i:'🏠',t:'대시보드',           s:'채널 현황·오늘 할 일·빠른시작',   bg:'bg-pink',  tag:'홈',   shStep:0},
    {i:'①',t:'채널 설정',           s:'프로파일·브랜드킷·경쟁채널',       bg:'bg-purple',tag:'Step1',shStep:1},
    {i:'②',t:'트렌드 탐지',         s:'YT·TikTok·네이버·일본 트렌드',    bg:'bg-blue',  tag:'Step2',shStep:2},
    {i:'③',t:'대본 생성',           s:'훅·A/B·한일 동시',                 bg:'bg-green', tag:'Step3',shStep:3},
    {i:'④',t:'스타일 설정',         s:'이미지·영상·자막·음성·BGM',        bg:'bg-peach', tag:'Step4',shStep:4},
    {i:'⑤',t:'1차 검증',            s:'바이럴 예측 점수·품질 체크',        bg:'bg-mint',  tag:'Step5',shStep:5},
    {i:'⑥',t:'미디어 생성',         s:'음성·이미지·자막·썸네일 A/B',       bg:'bg-pink',  tag:'Step6',shStep:6},
    {i:'⑦',t:'최종 검증',           s:'정책·SEO·제목 A/B',                 bg:'bg-purple',tag:'Step7',shStep:7},
    {i:'⑧',t:'플랫폼 업로드',       s:'패키지·스케줄·멀티 플랫폼',        bg:'bg-blue',  tag:'Step8',shStep:8},
    {i:'📈',t:'성과 분석',           s:'영상별·채널·AI 인사이트',          bg:'bg-green', tag:'분석', shStep:9},
    {i:'🤖',t:'대량 생산',           s:'배치·시리즈·월간 캘린더·재활용',    bg:'bg-peach', tag:'자동', shStep:10}
  ]
};

const modeLabels = {
  normal:'🌟 일반 모드',
  kids:'🧒 어린이 모드',
  guide:'📖 가이드 모드',
  setting:'⚙️ 설정 모드',
  about:'☕ 소개',
  qna:'💬 Q&A'
};

let state = { category:'script', mode:'normal' };
window.__hubState = state;
window.__hubGoCategory = function(id){ state.category = id; if(typeof renderAll==='function') renderAll(); };

function renderSidebar(){
  const box = document.getElementById('sidebar');
  box.innerHTML = '';
  categories.forEach(c => {
    const b = document.createElement('button');
    b.className = 'sidebtn' + (state.category === c.id ? ' on' : '');
    b.innerHTML = `<div class="ico">${c.icon}</div><div class="tx"><strong>${c.title}</strong><span>${c.desc}</span></div>`;
    b.onclick = () => { state.category = c.id; renderAll(); };
    box.appendChild(b);
  });
}

function renderHero(){
  const c = categories.find(x => x.id === state.category);
  const hub = document.getElementById('oneHub');
  // 카테고리 미선택 = 메인 = one-hub 노출, 카테고리 선택 시 hub 숨김
  if(!c){
    if(hub) hub.style.display = '';
    const h = document.querySelector('.hero'); if(h) h.style.display = 'none';
    return;
  }
  if(hub) hub.style.display = 'none';
  document.getElementById('heroTitle').textContent = `${c.icon} ${c.title}`;
  document.getElementById('heroDesc').textContent = c.desc + ' — 아래 카드에서 원하는 기능을 선택하세요.';
  document.getElementById('modeBadge').textContent = modeLabels[state.mode];
  const h = document.querySelector('.hero'); if(h) h.style.display = '';
}

function renderGrid(){
  // 카테고리 전환 시 열려있는 상세 뷰 정리
  const mzD = document.getElementById('monetizeDetail'); if(mzD) mzD.classList.add('hide');
  const pbD = document.getElementById('publicDetail');   if(pbD) pbD.classList.add('hide');
  const edD = document.getElementById('eduDetail');      if(edD) edD.classList.add('hide');
  const trD = document.getElementById('transDetail');    if(trD) trD.classList.add('hide');
  const smD = document.getElementById('smbDetail');      if(smD) smD.classList.add('hide');
  const psD = document.getElementById('psyDetail');      if(psD) psD.classList.add('hide');
  const shD = document.getElementById('shortsDetail');   if(shD) shD.classList.add('hide');
  const libD= document.getElementById('libraryDetail');  if(libD) libD.classList.add('hide');
  const trD2= document.getElementById('trendDetail');    if(trD2) trD2.classList.add('hide');
  const abD = document.getElementById('abDetail');       if(abD)  abD.classList.add('hide');
  const shD2= document.getElementById('shareDetail');    if(shD2) shD2.classList.add('hide');
  const intS = document.getElementById('intentStage');   if(intS) intS.classList.add('hide');
  const hero = document.querySelector('.hero'); if(hero) hero.style.display = '';
  const gridEl = document.getElementById('grid'); if(gridEl) gridEl.style.display = '';
  // 온보딩 위젯: 일반모드 & 기본 카테고리에서만 노출
  const hpTopics = document.getElementById('hpTopics');
  const hpSample = document.getElementById('hpSample');
  const hpSetup  = document.getElementById('hpSetup');
  // "오늘의 추천 주제"는 메인 대시보드(일반탭 + 기본 카테고리 script)에서만 노출
  const isDashboard = (state.mode==='normal' && state.category==='script');
  const showHomeWidgets = isDashboard;
  // about/qna 모드에서도 홈 위젯 숨김
  if(state.mode==='about' || state.mode==='qna'){
    if(hpTopics) hpTopics.style.display='none';
    if(hpSample) hpSample.style.display='none';
    if(hpSetup)  hpSetup.style.display='none';
  }
  if(hpTopics) hpTopics.style.display = 'none'; // 플로팅으로 이동
  if(hpSample) hpSample.style.display = showHomeWidgets ? '' : 'none';
  if(hpSetup)  hpSetup.style.display  = showHomeWidgets ? hpSetup.style.display : 'none';

  // 📁 내 보관함 카테고리
  if (state.category === 'library' && state.mode === 'normal') {
    if(hero) hero.style.display = 'none';
    if(gridEl) gridEl.style.display = 'none';
    if(libD){ libD.classList.remove('hide'); if(typeof renderLibrary==='function') renderLibrary(); }
    return;
  }
  // 🔥 트렌드 분석 센터 카테고리
  if (state.category === 'trend' && state.mode === 'normal') {
    if(hero) hero.style.display = 'none';
    if(gridEl) gridEl.style.display = 'none';
    if(trD2){ trD2.classList.remove('hide'); if(typeof renderTrendHub==='function') renderTrendHub(); }
    return;
  }
  // 🔍 유튜브 벤치마킹 카테고리
  if (state.category === 'bench' && state.mode === 'normal') {
    if(hero) hero.style.display = 'none';
    if(gridEl) gridEl.style.display = 'none';
    const bd = document.getElementById('benchDetail');
    if(bd){ bd.classList.remove('hide'); if(typeof renderBenchHub === 'function') renderBenchHub(); }
    return;
  }
  // ⚖️ A/B 비교 센터 카테고리
  if (state.category === 'ab' && state.mode === 'normal') {
    if(hero) hero.style.display = 'none';
    if(gridEl) gridEl.style.display = 'none';
    if(abD){ abD.classList.remove('hide'); if(typeof renderAB==='function') renderAB(); }
    return;
  }
  // 📤 공유센터 카테고리
  if (state.category === 'share' && state.mode === 'normal') {
    if(hero) hero.style.display = 'none';
    if(gridEl) gridEl.style.display = 'none';
    if(shD2){ shD2.classList.remove('hide'); if(typeof renderShareHub==='function') renderShareHub(); }
    return;
  }
  // ✨ 빠른 생성 (Intent) 카테고리
  if (state.category === 'intent' && state.mode === 'normal') {
    if(hero) hero.style.display = 'none';
    if(gridEl) gridEl.style.display = 'none';
    const is = document.getElementById('intentStage');
    if(is){ is.classList.remove('hide'); if(typeof intentInitStage==='function') intentInitStage(); }
    return;
  }

  // 🌈 어린이 모드: 전용 스테이지 표시, 나머지 숨김
  const kidsStage  = document.getElementById('kidsStage');
  const kidsDetail = document.getElementById('kidsDetail');
  const guideStage = document.getElementById('guideStage');
  if (state.mode === 'kids') {
    document.body.classList.add('kids-mode');
    if(hero) hero.style.display = 'none';
    if(gridEl) gridEl.style.display = 'none';
    if(kidsStage) { kidsStage.classList.remove('hide'); renderKidsHome(); }
    if(kidsDetail) kidsDetail.classList.add('hide');
    if(guideStage) guideStage.classList.add('hide');
    return;
  } else {
    document.body.classList.remove('kids-mode');
    if(kidsStage) kidsStage.classList.add('hide');
    if(kidsDetail) kidsDetail.classList.add('hide');
  }
  // 📖 가이드 모드: 전용 스테이지 표시
  if (state.mode === 'guide') {
    if(hero) hero.style.display = 'none';
    if(gridEl) gridEl.style.display = 'none';
    if(guideStage) { guideStage.classList.remove('hide'); renderGuide(); }
    return;
  } else {
    if(guideStage) guideStage.classList.add('hide');
  }
  // ☕ 소개 모드
  const aboutStage = document.getElementById('aboutStage');
  const qnaStage   = document.getElementById('qnaStage');
  if (state.mode === 'about') {
    if(hero) hero.style.display = 'none';
    if(gridEl) gridEl.style.display = 'none';
    if(aboutStage) aboutStage.classList.remove('hide');
    if(qnaStage) qnaStage.classList.add('hide');
    return;
  } else if(aboutStage) aboutStage.classList.add('hide');
  // 💬 Q&A 모드
  if (state.mode === 'qna') {
    if(hero) hero.style.display = 'none';
    if(gridEl) gridEl.style.display = 'none';
    if(qnaStage){ qnaStage.classList.remove('hide'); if(typeof renderQnA==='function') renderQnA(); }
    return;
  } else if(qnaStage) qnaStage.classList.add('hide');

  const g = document.getElementById('grid');
  g.innerHTML = '';
  // guide/setting 모드는 상위 early-return에서 처리됨
  if (state.mode === 'setting') {
    g.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <h3 style="color:#b14d82;margin:0 0 10px">⚙️ 설정</h3>
      <p>API 키, 기본 모델, 출력 경로는 각 엔진의 설정 탭에서 관리합니다.</p></div>`;
    return;
  }
  const list = cards[state.category] || [];
  list.forEach(c => {
    const b = document.createElement('button');
    b.className = 'q ' + c.bg;
    b.innerHTML = `<span class="tag">${c.tag}</span><div class="i">${c.i}</div><strong>${c.t}</strong><span>${c.s}</span>`;
    b.onclick = () => {
      const targetEngine = c.engine || state.category;
      if ((targetEngine === 'script') && c.tab) {
        location.href = 'engines/script/index.html?tab=' + encodeURIComponent(c.tab);
      } else if ((state.category === 'monetize' || state.category === 'profit') && c.bldId) {
        openBuilder(c);
      } else if (state.category === 'public' && c.pbId === 'ppt') {
        openPptBuilder();
      } else if (state.category === 'public' && c.pbId) {
        openPublic(c);
      } else if (state.category === 'edu' && c.eduId) {
        openEdu(c);
      } else if (state.category === 'trans' && c.trId) {
        openTrans(c);
      } else if (state.category === 'smb' && c.smbId) {
        openSmb(c);
      } else if (state.category === 'psy' && c.psyId) {
        openPsy(c);
      } else if (state.category === 'shorts' && c.shStep !== undefined) {
        openShorts(c.shStep);
      } else {
        alert(`"${c.t}" 선택됨\n(연결될 엔진: ${targetEngine})`);
      }
    };
    g.appendChild(b);
  });
}

function renderAll(){ renderSidebar(); renderHero(); renderGrid(); }

// 모드 탭 (일반/어린이/가이드/설정) — .lang 버튼은 제외
document.getElementById('toptabs').querySelectorAll('.toptab:not(.lang)').forEach(t => {
  t.onclick = () => {
    document.querySelectorAll('.toptab:not(.lang)').forEach(x => x.classList.remove('on'));
    t.classList.add('on');
    state.mode = t.dataset.mode;
    renderAll();
  };
});

/* ═══════════════════════════════════════════════════════════
   ☕ 원스톱 입력 허브 — AI 자동분류 · 라우팅 · 통합 결과
   ═══════════════════════════════════════════════════════════ */

/* 포맷 버튼 바인딩 */
document.addEventListener('DOMContentLoaded', function(){
  // 포맷 선택
  const fmts = document.querySelectorAll('#one-formats .one-fmt');
  fmts.forEach(b => b.addEventListener('click', () => {
    fmts.forEach(x => x.classList.remove('on'));
    b.classList.add('on');
  }));
  // 채널 선택
  const chs = document.querySelectorAll('#one-channel .one-ch');
  chs.forEach(b => b.addEventListener('click', () => {
    chs.forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    window._oneChannel = b.getAttribute('data-ch');
  }));
  // 빠른예시 칩
  document.querySelectorAll('.one-qchip').forEach(b => b.addEventListener('click', () => {
    const el = document.getElementById('one-input');
    if(el){ el.value = b.getAttribute('data-ex'); el.focus(); }
  }));
  // Enter 키 (Shift+Enter 는 줄바꿈)
  const inp = document.getElementById('one-input');
  if(inp) inp.addEventListener('keydown', e => {
    if(e.key === 'Enter' && !e.shiftKey && (e.metaKey || e.ctrlKey)){ e.preventDefault(); oneMake(); }
  });

  /* 🔥 오늘의 추천 주제 (월별 시즌 + 날짜 + 접이식) */
  (function todayTopic(open){
    var d = new Date();
    var de = document.getElementById('tp-date');
    if(de) de.textContent = (d.getMonth()+1) + '월 ' + d.getDate() + '일';
    var sm = {
      1: '새해·건강검진·겨울건강',
      2: '설날·부모님건강·면역력',
      3: '봄맞이·건강검진 준비',
      4: '봄·어린이날 준비·건강검진',
      5: '어버이날·가정의달·효도',
      6: '초여름·더위 대비·건강',
      7: '여름건강·무더위 극복',
      8: '휴가·노후 여행·건강',
      9: '가을건강·추석·부모님',
      10: '단풍·노후준비·건강검진',
      11: '김장·겨울준비·면역력',
      12: '연말·한해마무리·건강'
    };
    var m = d.getMonth()+1;
    var se = document.getElementById('tp-season');
    if(se && sm[m]) se.textContent = '이번주: ' + sm[m];
    // 레거시 호환
    var legacy = document.getElementById('topicSeasonText');
    if(legacy && sm[m]) legacy.textContent = '이번주: ' + sm[m];
    // 키워드 칩 생성
    var chipBox = document.getElementById('tp-chips');
    if(chipBox && sm[m]){
      chipBox.innerHTML = sm[m].split('·').map(function(kw){
        var k = kw.trim();
        return '<button class="tp-chip" onclick="tpPickTopic(\'' + k.replace(/\'/g,"") + '\')">' + k + '</button>';
      }).join('');
    }
    if(!open){
      var b = document.getElementById('todayTopicBody');
      var t = document.getElementById('todayTopicToggle');
      if(b) b.classList.add('tp-closed');
      if(t) t.textContent = '🔥';
    }
  })(true);
});

/* 주제 칩 클릭 → 입력창 자동 삽입 */
function tpPickTopic(kw){
  var el = document.getElementById('one-input');
  if(el){
    el.value = kw + ' 시니어 유튜브 숏츠';
    el.focus();
    el.scrollIntoView({behavior:'smooth', block:'center'});
  }
}
/* 접이식 토글 */
function toggleTodayTopic(){
  var b = document.getElementById('todayTopicBody');
  var t = document.getElementById('todayTopicToggle');
  if(!b) return;
  b.classList.toggle('tp-closed');
  if(t) t.textContent = b.classList.contains('tp-closed') ? '🔥' : '🔽';
}

/* 카테고리 자동 분류 (규칙 + 키워드) */
function classifyInput(text){
  const s = (text||'').toLowerCase();
  const rules = [
    { cat:'shorts',    route:'shorts',    kw:['유튜브','숏츠','틱톡','릴스','reels','tiktok','shorts','영상 대본','대본'] },
    { cat:'sns',       route:'builder',   bld:'sns',       kw:['인스타','instagram','sns','카카오채널','카카오 채널','스토리','릴스','카드뉴스'] },
    { cat:'blog',      route:'builder',   bld:'blog',      kw:['블로그','네이버','브런치','티스토리','포스팅','후기 글','리뷰 글'] },
    { cat:'newsletter',route:'builder',   bld:'newsletter',kw:['뉴스레터','메일','스티비','mailchimp','beehiiv','이메일'] },
    { cat:'webtoon',   route:'builder',   bld:'webtoon',   kw:['웹툰','만화','일상툰'] },
    { cat:'ebook',     route:'builder',   bld:'ebook',     kw:['전자책','ebook','pdf','크몽','클래스101','자료집'] },
    { cat:'landing',   route:'builder',   bld:'landing',   kw:['랜딩','lp','링크인바이오'] },
    { cat:'public',    route:'public',    kw:['공문','보고서','법원','판결','주민센터','시청','구청','기관','안내문','공지','보도자료','민원','정책','기안','회의록'] },
    { cat:'ppt',       route:'ppt',       kw:['ppt','슬라이드','프레젠테이션','발표자료'] },
    { cat:'edu',       route:'edu',       kw:['숙제','독후감','발표','초등','중등','고등','학습','교육','워크북','퀴즈'] },
    { cat:'kids',      route:'edu',       kw:['어린이','아이','유치원','동화','동요'] },
    { cat:'smb',       route:'smb',       kw:['카페','식당','메뉴','가게','소상공인','상세페이지','전단지','쿠폰','신메뉴'] },
    { cat:'letter',    route:'inline',    kw:['편지','감사','축하','위로','생신','생일','결혼','청첩','초대','카드'] },
    { cat:'psy',       route:'psy',       kw:['운세','타로','mbti','사주','별자리','심리'] },
    { cat:'translate', route:'trans',     kw:['번역','일본어로','영어로','중국어로','translate'] }
  ];
  for(const r of rules){
    if(r.kw.some(k => s.includes(k))) return r;
  }
  return { cat:'general', route:'inline' };
}

/* 카테고리 → 이미지 스타일 자동 감지 */
function pickImageStyle(cat){
  const map = {
    shorts:'ghibli', sns:'vibrant', blog:'minimal', newsletter:'clean',
    webtoon:'webtoon', ebook:'elegant', landing:'clean',
    public:'banner', ppt:'infographic',
    edu:'illustration', kids:'cute illustration',
    smb:'realistic food/product photography',
    letter:'warm watercolor', psy:'mystical', translate:'minimal', general:'clean illustration'
  };
  return map[cat] || 'clean illustration';
}

/* 만들어줘 — 메인 엔트리 포인트 */
async function oneMake(){
  const input = document.getElementById('one-input').value.trim();
  if(!input){ document.getElementById('one-input').focus(); return; }
  const fmtBtn = document.querySelector('#one-formats .one-fmt.on');
  const format = fmtBtn ? fmtBtn.getAttribute('data-fmt') : 'text-img';

  // 키 확인
  if (typeof APIAdapter === 'undefined') { alert('api-adapter.js 미로드'); return; }
  const hasAnyKey = ['claude','openai','gemini'].some(p => localStorage.getItem('uc_'+p+'_key'));
  if(!hasAnyKey){
    if(typeof apiKeyMissingToast === 'function') apiKeyMissingToast();
    return;
  }

  const cls = classifyInput(input);
  const btn = document.getElementById('one-make');
  btn.disabled = true; btn.textContent = '⏳ 분석 중...';
  _oneProgress([{ok:false,label:'🤖 AI 가 입력을 분석하고 있어요 (유형: ' + cls.cat + ')'}]);
  try{
    // 영상 계열은 자동숏츠 엔진으로 보냄
    if(cls.route === 'shorts'){
      btn.textContent = '☁️ 자동숏츠 엔진으로 전달...';
      const qs = '?topic=' + encodeURIComponent(input);
      setTimeout(() => { location.href = 'engines/shorts/index.html' + qs; }, 400);
      return;
    }
    // 공공기관 / PPT / 교육 / 소상공인 / 심리 / 번역 은 해당 카테고리의 상세 뷰 자동 전환 + 주제 사전 입력
    const bridge = {
      public:  () => { state.category='public'; renderAll(); _oneToast('🏛️ 공공기관 패키지 이동 · 원하는 유형을 선택하세요'); },
      ppt:     () => { openPptBuilder(); setTimeout(()=>{ const el=document.getElementById('ppt-topic'); if(el) el.value=input; }, 50); },
      edu:     () => { state.category='edu';   renderAll(); _oneToast('📚 학습/교육 카테고리 이동'); },
      smb:     () => { state.category='smb';   renderAll(); _oneToast('🏪 소상공인 카테고리 이동'); },
      psy:     () => { state.category='psy';   renderAll(); _oneToast('🔮 심리/운세 카테고리 이동'); },
      trans:   () => { state.category='trans'; renderAll(); _oneToast('🌐 번역 카테고리 이동'); }
    };
    if(bridge[cls.route]){ bridge[cls.route](); _oneDone(); return; }
    // 빌더 계열: 콘텐츠 빌더 진입 + 주제 자동 입력
    if(cls.route === 'builder'){
      openBuilder({ bldId: cls.bld });
      setTimeout(() => {
        const top = document.getElementById('bld-topic') || document.getElementById('nl-topic') ||
                    document.getElementById('wt-topic')  || document.getElementById('sns-topic') ||
                    document.getElementById('eb-title')  || document.getElementById('lp-name');
        if(top) top.value = input;
        _oneToast('🎨 콘텐츠 빌더 (' + cls.bld + ') 이동 · 주제 자동 입력됨');
      }, 80);
      _oneDone();
      return;
    }

    // inline 생성 (편지·일반·카테고리 미분류)
    await _oneInlineGenerate(input, cls, format);
  }catch(e){
    _oneProgress([{ok:false,label:'❌ 오류: ' + e.message}]);
  }finally{
    btn.disabled = false; btn.textContent = '☕ 만들어줘!';
  }
}
function _oneDone(){
  const btn = document.getElementById('one-make');
  btn.disabled = false; btn.textContent = '☕ 만들어줘!';
  setTimeout(() => { document.getElementById('one-progress').style.display = 'none'; }, 1500);
}
function _oneProgress(steps){
  const wrap = document.getElementById('one-progress');
  wrap.style.display = '';
  wrap.innerHTML = steps.map(s => '<div class="step"><span class="ico">' + (s.ok ? '✅' : '⏳') + '</span>' + s.label + '</div>').join('');
}
function _oneToast(msg){
  _oneProgress([{ok:true, label:msg}]);
  setTimeout(() => { document.getElementById('one-progress').style.display = 'none'; }, 2500);
}

/* 인라인 생성 — 편지/감성/일반용 */
async function _oneInlineGenerate(input, cls, format){
  const wantImage = (format === 'text-img' || format === 'full');
  const wantVideo = (format === 'text-vid' || format === 'full');
  const catLabel  = {
    letter:'편지/카드', general:'일반 글쓰기'
  }[cls.cat] || '일반';
  const lang = window._oneChannel || (document.querySelector('.toptab.lang.on')?.getAttribute('data-lang')) || 'ko';
  const langInst = lang === 'ja' ? '반드시 일본어(경어체)로 작성.' : '반드시 한국어로 작성.';

  _oneProgress([
    { ok:false, label:'✍️ 글 생성 중 ('+catLabel+')' }
  ]);

  const imgMarker = wantImage ? '\n\n각 주요 단락/전환점에 이미지가 필요한 위치를 \n[IMAGE: <영어로 구체적인 이미지 설명>]\n형식으로 텍스트 안에 직접 삽입해라. 이미지는 2~4장 정도 적절한 위치에만.\n' : '';

  const sys =
    '당신은 전문 작가다. 사용자가 요청한 콘텐츠를 최종 완성물로 작성한다.\n' +
    '유형: ' + catLabel + '\n' +
    langInst + '\n' +
    '형식: 간결하고 마크다운 헤딩(H1/H2/H3), 적절한 단락 구분 사용.\n' +
    imgMarker;
  const user = input;

  const text = await APIAdapter.callWithFallback(sys, user, { maxTokens: 2500, featureId:'one-hub-'+cls.cat });

  _oneProgress([
    { ok:true, label:'✅ 글 생성 완료 (' + text.length + '자)' },
    ...(wantImage ? [{ok:false, label:'🖼 이미지 생성 준비...'}] : [])
  ]);

  let images = [];
  if(wantImage){
    images = await generateContentImages(text, pickImageStyle(cls.cat), cls.cat, 4, (done, total) => {
      _oneProgress([
        { ok:true, label:'✅ 글 생성 완료' },
        { ok:false, label:'🖼 이미지 ' + done + '/' + total + ' 생성 중...' }
      ]);
    });
  }

  // 렌더
  _oneProgress([
    { ok:true, label:'✅ 글 생성 완료' },
    ...(wantImage ? [{ok:true, label:'✅ 이미지 ' + images.filter(x=>x.url).length + '장 완료'}] : []),
    ...(wantVideo ? [{ok:true, label:'🎬 영상 생성은 자동숏츠 엔진으로 전송 가능 (아래 버튼)'}] : [])
  ]);

  const finalHtml = _renderTextWithImages(text, images);
  showUnifiedResult({
    title: cls.cat === 'letter' ? '✉️ 편지 완성' : '✍️ 글 완성',
    meta:  catLabel + ' · ' + lang.toUpperCase() + ' · ' + text.length + '자' + (images.length ? (' · 이미지 ' + images.filter(x=>x.url).length + '장') : ''),
    htmlBody: finalHtml,
    plainText: text.replace(/\[IMAGE:\s*[^\]]+\]/g, '').trim(),
    images: images,
    category: cls.cat,
    wantVideo
  });
  setTimeout(() => { document.getElementById('one-progress').style.display = 'none'; }, 600);
}

/* [IMAGE: ...] 마커를 실제 <img> 로 치환 + 나머지 마크다운을 간단 HTML 로 */
function _renderTextWithImages(text, images){
  let i = 0;
  let html = String(text||'').replace(/\[IMAGE:\s*([^\]]+)\]/g, (_, prompt) => {
    const img = images[i++];
    if(img && img.url) return '<img src="' + img.url + '" alt="' + prompt.replace(/"/g,'&quot;') + '">';
    return '<div style="padding:14px;background:#fff5fa;border:2px dashed var(--line);border-radius:10px;text-align:center;color:var(--sub);font-size:12px;margin:10px 0">🖼 ' + prompt + '<br><small>(이미지 생성 실패 또는 생략됨 · 프롬프트만 표시)</small></div>';
  });
  // 마크다운 간단 변환
  html = html
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---+$/gm, '<hr>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  if(!/^<h\d|<p>/.test(html)) html = '<p>' + html + '</p>';
  return html;
}

/* ─── 공통 이미지 생성 헬퍼 ─────────────────────────────
   [IMAGE: ...] 마커에서 프롬프트를 추출하고 DALL·E 3 로 생성. */
async function generateContentImages(text, styleHint, category, maxCount, onProgress){
  const matches = [...String(text||'').matchAll(/\[IMAGE:\s*([^\]]+)\]/g)];
  const prompts = matches.slice(0, maxCount || 4).map(m => m[1].trim());
  if(!prompts.length) return [];
  const key = localStorage.getItem('uc_openai_key');
  if(!key){
    // OpenAI 키 없으면 프롬프트만 반환
    return prompts.map(p => ({ prompt: p, url: null, reason:'no-openai-key' }));
  }
  const results = new Array(prompts.length);
  let done = 0;
  await Promise.all(prompts.map((raw, i) => (async () => {
    const fullPrompt = styleHint + ' style, ' + raw;
    try{
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+key },
        body: JSON.stringify({ model:'dall-e-3', prompt: fullPrompt, n:1, size:'1024x1024', response_format:'url' })
      });
      const data = await res.json();
      results[i] = { prompt: raw, url: data.data?.[0]?.url || null, reason: !res.ok ? (data.error?.message||'HTTP '+res.status) : null };
    }catch(e){
      results[i] = { prompt: raw, url: null, reason: e.message };
    }
    done++;
    if(typeof onProgress === 'function') onProgress(done, prompts.length);
  })()));
  return results;
}

/* ─── 통합 결과 바 (모든 카테고리 공통) ──────────────── */
function showUnifiedResult(opts){
  opts = opts || {};
  const wrap = document.getElementById('one-result');
  wrap.style.display = '';
  const convBtns = (() => {
    const c = opts.category || 'general';
    const canInsta = c !== 'sns';
    const canVid = true;
    const canJa   = true;
    const canNewsletter = c !== 'newsletter';
    return [
      canInsta        && '<button onclick="uniConvert(\'sns\')">📱 인스타로</button>',
      canVid          && '<button onclick="uniConvert(\'shorts\')">🎬 영상으로</button>',
      canJa           && '<button onclick="uniConvert(\'ja\')">🇯🇵 일본어로</button>',
      canNewsletter   && '<button onclick="uniConvert(\'newsletter\')">📧 뉴스레터로</button>'
    ].filter(Boolean).join('');
  })();
  wrap.innerHTML =
    '<div class="uni-result">' +
      '<h3>' + (opts.title||'완성') + '</h3>' +
      '<div class="meta">' + (opts.meta||'') + '</div>' +
      '<div class="uni-body" id="uni-body">' + (opts.htmlBody||'') + '</div>' +
      '<div class="uni-actions">' +
        '<div><b>📋 복사해서 붙여넣기</b>' +
          '<button onclick="uniCopy(\'full\')">📋 전체 복사</button>' +
          '<button onclick="uniCopy(\'text\')">📋 글만 복사</button>' +
          (opts.images && opts.images.length ? '<button onclick="uniCopy(\'with-img\')">📋 글+이미지 URL 복사</button>' : '') +
        '</div>' +
        '<div><b>💾 저장</b>' +
          '<button onclick="uniSave(\'html\')">💾 HTML</button>' +
          '<button onclick="uniSave(\'pdf\')">📄 PDF</button>' +
          (opts.images && opts.images.length ? '<button onclick="uniSave(\'img\')">🖼 이미지</button>' : '') +
          '<button onclick="uniSave(\'library\')">📁 보관함</button>' +
        '</div>' +
        '<div><b>🔄 다른 형태로 변환</b>' + convBtns + '</div>' +
        '<div><b>🔁 다시 / 이동</b>' +
          '<button onclick="oneMake()">🔄 다시 만들기</button>' +
          '<a href="#oneHub" onclick="document.getElementById(\'one-input\').focus()">⬆️ 맨 위로</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  // 세션 저장
  window._uniResult = { plainText: opts.plainText||'', images: opts.images||[], category: opts.category||'general' };
  wrap.scrollIntoView({ behavior:'smooth', block:'start' });
}
function uniCopy(mode){
  const r = window._uniResult || {};
  let out = r.plainText || '';
  if(mode === 'with-img'){
    const urls = (r.images||[]).filter(x => x.url).map(x => '이미지: ' + x.url).join('\n');
    out = out + '\n\n' + urls;
  } else if(mode === 'full'){
    const body = document.getElementById('uni-body');
    if(body) out = body.innerText; // 렌더된 텍스트
  }
  navigator.clipboard.writeText(out).then(() => {
    _oneToast('📋 클립보드에 복사됨 (' + out.length + '자)');
  });
}
function uniSave(mode){
  const body = document.getElementById('uni-body');
  const r = window._uniResult || {};
  if(mode === 'html'){
    const full = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Pretendard,sans-serif;max-width:700px;margin:0 auto;padding:32px 20px;line-height:1.8}</style></head><body>' + (body?.innerHTML||'') + '</body></html>';
    const blob = new Blob([full], {type:'text/html'}); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='content.html'; a.click(); URL.revokeObjectURL(url);
  } else if(mode === 'pdf'){
    const w = window.open('', '_blank');
    w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Pretendard,sans-serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8}</style></head><body>'+(body?.innerHTML||'')+'</body></html>');
    w.document.close(); w.focus(); setTimeout(() => w.print(), 400);
  } else if(mode === 'img'){
    const urls = (r.images||[]).filter(x=>x.url);
    if(!urls.length){ alert('저장할 이미지가 없어요'); return; }
    urls.forEach((img,i) => { const a=document.createElement('a'); a.href=img.url; a.download='image-'+(i+1)+'.png'; a.target='_blank'; a.click(); });
  } else if(mode === 'library'){
    if(typeof window.Library !== 'undefined' && typeof window.Library.saveResult === 'function'){
      try{
        window.Library.saveResult({
          category: r.category || 'general', source:'one-hub',
          title: '[원스톱] ' + ((r.plainText||'').split('\n')[0].slice(0,40) || '콘텐츠'),
          body: r.plainText, meta:{ images: (r.images||[]).length }
        });
        _oneToast('💾 보관함 저장 완료');
        return;
      }catch(_){}
    }
    _oneToast('💾 localStorage 에 저장');
    const key = 'uc_onehub_saved';
    const list = JSON.parse(localStorage.getItem(key)||'[]');
    list.unshift({ at: Date.now(), body: r.plainText, images: r.images });
    localStorage.setItem(key, JSON.stringify(list.slice(0,50)));
  }
}
async function uniConvert(target){
  const r = window._uniResult || {};
  if(!r.plainText){ alert('먼저 콘텐츠를 만들어주세요'); return; }
  if(target === 'shorts'){
    const key='hub_scripts_v1';
    const list = JSON.parse(localStorage.getItem(key)||'[]');
    list.unshift({ source:'one-hub', lang:'ko', text:r.plainText, at:Date.now() });
    localStorage.setItem(key, JSON.stringify(list.slice(0,30)));
    if(confirm('🎬 자동숏츠 엔진으로 이동할까요?')) location.href = 'engines/shorts/index.html';
    return;
  }
  // 나머지는 AI 변환
  const map = {
    sns: 'JSON 배열 [{"slide":1,"title":"","text":"120자"}] 10장 인스타 카드뉴스',
    ja:  '원문을 자연스러운 일본어 경어체로 번역',
    newsletter: '뉴스레터 이메일 형식 (제목 + 본문 섹션 3개)'
  };
  const sys = '아래 원문을 변환. ' + (map[target] || '요청 형식으로 변환');
  try{
    const out = await APIAdapter.callWithFallback(sys, r.plainText, { maxTokens: 3000 });
    document.getElementById('uni-body').innerText = out;
    window._uniResult.plainText = out;
    _oneToast('✅ ' + target + ' 변환 완료');
  }catch(e){ alert('❌ ' + e.message); }
}

// 언어 선택 (현재 한국어만 활성화)
const LANG_LABELS = { ko:'🇰🇷 한국어', ja:'🇯🇵 日本語', en:'🇺🇸 English' };
function selectLang(code){
  if(code !== 'ko'){
    alert('준비 중입니다 🚧\n\n' + LANG_LABELS[code] + ' 버전은 곧 지원될 예정입니다.\n현재는 한국어만 사용할 수 있습니다.');
    return;
  }
  document.querySelectorAll('.toptab.lang').forEach(x => x.classList.remove('on'));
  const btn = document.querySelector('.toptab.lang[data-lang="'+code+'"]');
  if(btn) btn.classList.add('on');
  localStorage.setItem('uc_hub_lang', code);
}
// 초기화: localStorage 복원
(function initLang(){
  const saved = localStorage.getItem('uc_hub_lang') || 'ko';
  if(saved === 'ko') selectLang('ko'); // ko만 실제 적용, 나머지는 팝업 트리거 안 함
})();

renderAll();

/* ═══════════════════════════════════════════════════════════
   🎨 콘텐츠 빌더 (구 monetize 자리)
   6개 빌더 · 브랜드킷 · 블록 에디터 · SEO · A/B · 재활용 · 수익화 · 성과학습
   ═══════════════════════════════════════════════════════════ */

const BLD_TYPES = {
  blog:       { ico:'📝', title:'블로그 빌더',         desc:'글 하나로 네이버·브런치·티스토리까지' },
  newsletter: { ico:'📧', title:'뉴스레터 빌더',       desc:'스티비·메일침프·비히브 형식 자동' },
  webtoon:    { ico:'🎨', title:'웹툰/만화 빌더',      desc:'5칸 자동 · 캐릭터 일관성' },
  sns:        { ico:'📱', title:'SNS 카드뉴스 빌더',   desc:'인스타·스토리·카카오·링크드인' },
  ebook:      { ico:'📊', title:'전자책 / PDF 빌더',   desc:'크몽·클래스101 판매용 최적화' },
  landing:    { ico:'🌐', title:'랜딩페이지 빌더',     desc:'링크인바이오 스타일 · 스크롤 애니' }
};

const BLOG_TEMPLATES = [
  { id:'emotional',  ico:'🌸', t:'감성 일기형',   s:'시니어/감성 최적',   cssClass:'tpl-emotional' },
  { id:'info',       ico:'📊', t:'정보/지식형',   s:'건강/정보 최적',     cssClass:'tpl-info' },
  { id:'magazine',   ico:'🎨', t:'매거진형',       s:'프리미엄 최적',       cssClass:'tpl-magazine' },
  { id:'review',     ico:'🛍', t:'상품/리뷰형',   s:'소상공인 최적',       cssClass:'tpl-review' },
  { id:'official',   ico:'📰', t:'뉴스/공식형',   s:'공공기관 최적',       cssClass:'tpl-official' }
];

/* ─── 브랜드킷 (🇰🇷 / 🇯🇵 각각 저장) ───
   저장소: uc_bld_brandkit_ko / uc_bld_brandkit_ja
   구버전 uc_bld_brandkit 는 자동 마이그레이션(채널값에 따라 ko/ja 로 이동). */
const LS_BRANDKIT_PREFIX = 'uc_bld_brandkit_';
const LS_BRANDKIT_LEGACY = 'uc_bld_brandkit';

function _migrateLegacyBrandkit(){
  const legacy = localStorage.getItem(LS_BRANDKIT_LEGACY);
  if(!legacy) return;
  try{
    const bk = JSON.parse(legacy);
    const ch = (bk.channel === 'ja') ? 'ja' : 'ko';  // 'both' 도 ko 에 저장
    if(!localStorage.getItem(LS_BRANDKIT_PREFIX + ch)){
      localStorage.setItem(LS_BRANDKIT_PREFIX + ch, JSON.stringify(bk));
    }
  }catch(_){}
  localStorage.removeItem(LS_BRANDKIT_LEGACY);
}
_migrateLegacyBrandkit();

function _bkChannel(){
  // 편집 중인 브랜드킷 언어 (기본: ko)
  return document.getElementById('bk-channel')?.value === 'ja' ? 'ja' : 'ko';
}
function loadBrandkit(channel){
  const ch = channel || _bkChannel();
  try{
    const raw = localStorage.getItem(LS_BRANDKIT_PREFIX + ch);
    if(raw) return Object.assign({ channel: ch }, JSON.parse(raw));
  }catch(_){}
  return { name:'', color: ch==='ja' ? '#6A98E8' : '#FF6B9D', font: ch==='ja' ? 'noto-jp' : 'pretendard', logo:'', channel: ch };
}
function saveBrandkit(bk){
  const ch = bk.channel === 'ja' ? 'ja' : 'ko';
  localStorage.setItem(LS_BRANDKIT_PREFIX + ch, JSON.stringify(bk));
  _updateBrandkitSummary();
}
function bkSave(){
  const bk = {
    name:    document.getElementById('bk-name').value.trim(),
    color:   document.getElementById('bk-color').value,
    font:    document.getElementById('bk-font').value,
    logo:    document.getElementById('bk-logo').value.trim(),
    channel: document.getElementById('bk-channel').value
  };
  saveBrandkit(bk);
  const chLbl = bk.channel === 'ja' ? '🇯🇵 일본채널' : '🇰🇷 한국채널';
  alert('💾 ' + chLbl + ' 브랜드킷 저장됨\n\n한국/일본 채널 각각 다르게 관리할 수 있어요.\n위 "채널 언어" 를 바꾸면 다른 채널의 브랜드킷을 편집할 수 있습니다.');
}
// 브랜드킷 채널 전환 시 해당 언어 값으로 UI 자동 전환
function bkSwitchChannel(){
  const bk = loadBrandkit(_bkChannel());
  const set = (id, v) => { const el = document.getElementById(id); if(el) el.value = v || ''; };
  set('bk-name',  bk.name);
  set('bk-color', bk.color || '#FF6B9D');
  set('bk-font',  bk.font  || 'pretendard');
  set('bk-logo',  bk.logo);
  _updateBrandkitSummary();
}
function _updateBrandkitSummary(){
  const s = document.getElementById('bk-summary');
  if(!s) return;
  const bkKo = loadBrandkit('ko');
  const bkJa = loadBrandkit('ja');
  const parts = [];
  if(bkKo.name) parts.push('🇰🇷 ' + bkKo.name);
  if(bkJa.name) parts.push('🇯🇵 ' + bkJa.name);
  s.textContent = parts.length ? ('· ' + parts.join(' / ')) : '(설정 안 됨)';
}
function _applyBrandkitToCanvas(containerSel, channel){
  const bk = loadBrandkit(channel);
  const el = document.querySelector(containerSel);
  if(el) el.style.setProperty('--bld-brand', bk.color);
}

/* ─── Builder 전역 상태 ─── */
let BLD = {
  type: 'blog',
  template: 'emotional',
  language: 'ko',
  tone: 'emotional',
  length: 'mid',
  imgStyle: 'ghibli',
  colorTheme: 'pastel',
  imgPlacement: 'auto',
  animation: 'fade',
  blocks: [],          // 블로그 블록 배열
  selectedBlockId: null,
  canvasSize: 'blog',
  device: 'desktop',
  undoStack: [],
  redoStack: [],
  ab: { titleA:'', titleB:'', imgA:'', imgB:'', saved:false },
  seoScore: 0,
  deviceMobile: false,
  topic: ''
};

/* ─── 진입/종료 ─── */
function openBuilder(card){
  BLD.type = card.bldId || 'blog';
  const meta = BLD_TYPES[BLD.type];
  document.getElementById('bld-ico').textContent   = meta.ico;
  document.getElementById('bld-title').textContent = meta.title;
  document.getElementById('bld-desc').textContent  = meta.desc;

  // 브랜드킷 UI 프리필 — 현재 BLD.language 에 맞는 채널 브랜드킷 로드
  const bkCh = (BLD.language === 'ja') ? 'ja' : 'ko';
  const bk = loadBrandkit(bkCh);
  document.getElementById('bk-channel').value = bkCh;
  document.getElementById('bk-name').value    = bk.name || '';
  document.getElementById('bk-color').value   = bk.color || '#FF6B9D';
  document.getElementById('bk-font').value    = bk.font || 'pretendard';
  document.getElementById('bk-logo').value    = bk.logo || '';
  _updateBrandkitSummary();

  // 패널 전환
  ['blog','newsletter','webtoon','sns','ebook','landing'].forEach(k => {
    const el = document.getElementById('bld-' + k);
    if(el) el.style.display = (k === BLD.type ? '' : 'none');
  });

  // 블로그 템플릿 렌더
  if(BLD.type === 'blog') _renderTemplates();
  _bldBindPickers();

  // 뷰 전환
  document.querySelector('.hero').style.display = 'none';
  document.getElementById('grid').style.display = 'none';
  document.getElementById('publicDetail')?.classList.add('hide');
  document.getElementById('monetizeDetail').classList.remove('hide');
  document.getElementById('mz-out').value = '';
  document.getElementById('mz-status').textContent = '';
}
function closeBuilder(){
  document.getElementById('monetizeDetail').classList.add('hide');
  document.querySelector('.hero').style.display = '';
  document.getElementById('grid').style.display = '';
}
// 레거시 이름 호환
function closeMonetize(){ closeBuilder(); }

function _renderTemplates(){
  const wrap = document.getElementById('bld-tpl-grid');
  if(!wrap) return;
  wrap.innerHTML = BLOG_TEMPLATES.map(t =>
    '<div class="bld-tpl' + (t.id === BLD.template ? ' on' : '') + '" data-v="' + t.id + '">' +
      '<div class="ico">' + t.ico + '</div>' +
      '<div class="t">' + t.t + '</div>' +
      '<div class="s">' + t.s + '</div>' +
    '</div>'
  ).join('');
  wrap.querySelectorAll('.bld-tpl').forEach(el => {
    el.addEventListener('click', () => {
      wrap.querySelectorAll('.bld-tpl').forEach(x => x.classList.remove('on'));
      el.classList.add('on');
      BLD.template = el.getAttribute('data-v');
    });
  });
}

function _bldBindPickers(){
  const bind = (rowId, key, multi) => {
    const row = document.getElementById(rowId);
    if(!row || row.dataset.bound) return;
    row.dataset.bound = '1';
    row.querySelectorAll('[data-v]').forEach(el => {
      el.addEventListener('click', () => {
        if(!multi) row.querySelectorAll('[data-v]').forEach(x => x.classList.remove('on'));
        el.classList.toggle('on');
        if(!multi) BLD[key] = el.getAttribute('data-v');
      });
    });
  };
  bind('bld-lang',     'language');
  bind('bld-tone',     'tone');
  bind('bld-length',   'length');
  bind('bld-imgstyle', 'imgStyle');
  bind('bld-color',    'colorTheme');
  bind('bld-anim',     'animation');
  bind('mon-pos',      'moneyPos');
  // 캔버스 사이즈
  const sizeRow = document.querySelector('.bld-size-row');
  if(sizeRow && !sizeRow.dataset.bound){
    sizeRow.dataset.bound = '1';
    sizeRow.querySelectorAll('[data-size]').forEach(el => {
      el.addEventListener('click', () => {
        sizeRow.querySelectorAll('[data-size]').forEach(x => x.classList.remove('on'));
        el.classList.add('on');
        BLD.canvasSize = el.getAttribute('data-size');
        const canvas = document.getElementById('bld-canvas');
        if(canvas){
          canvas.classList.remove('size-blog','size-insta','size-story','size-kakao');
          canvas.classList.add('size-' + BLD.canvasSize);
        }
      });
    });
  }
}

/* ─── 블록 ID / 푸시 ─── */
function _blockId(){ return 'b_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6); }
function _pushUndo(){
  BLD.undoStack.push(JSON.parse(JSON.stringify(BLD.blocks)));
  if(BLD.undoStack.length > 30) BLD.undoStack.shift();
  BLD.redoStack = [];
}
function bldUndo(){ if(!BLD.undoStack.length) return; BLD.redoStack.push(JSON.parse(JSON.stringify(BLD.blocks))); BLD.blocks = BLD.undoStack.pop(); _renderCanvas(); }
function bldRedo(){ if(!BLD.redoStack.length) return; BLD.undoStack.push(JSON.parse(JSON.stringify(BLD.blocks))); BLD.blocks = BLD.redoStack.pop(); _renderCanvas(); }

/* ─── 블로그 AI 생성 + 이미지 자동 생성 (초심자 모드) ─── */
async function bldGenerateBlogFull(){
  await bldGenerateBlog();
  // 이미지 프롬프트가 생성된 블록들에 대해 자동 이미지 생성 시도
  const imgBlocks = (BLD.blocks||[]).filter(b => b.type === 'image' && !b.url);
  if(imgBlocks.length && localStorage.getItem('uc_openai_key')){
    document.getElementById('mz-status').textContent = '🖼 이미지 ' + imgBlocks.length + '장 생성 중...';
    for(const b of imgBlocks){
      try{ await bldGenSingleImage(b.id); }catch(_){}
    }
    document.getElementById('mz-status').textContent = '✅ 글+이미지 완성';
  }
}

/* ─── 블로그 AI 생성 (기본) ─── */
async function bldGenerateBlog(){
  const topic = document.getElementById('bld-topic').value.trim();
  if(!topic){ alert('주제를 입력해주세요'); return; }
  BLD.topic = topic;
  const btn = document.getElementById('bld-gen');
  btn.disabled = true; btn.textContent = '⏳ 생성 중...';
  try{
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
    {const v=localStorage.getItem('uc_openai_key'); if(v) APIAdapter.setApiKey('openai',v);}
    {const v=localStorage.getItem('uc_gemini_key'); if(v) APIAdapter.setApiKey('gemini',v);}

    const tpl = BLOG_TEMPLATES.find(x => x.id === BLD.template);
    const toneLabel = {emotional:'감성적', info:'정보형', expert:'전문적'}[BLD.tone];
    const lenTarget = {short:1200, mid:2200, long:3500}[BLD.length];
    const wantKo = BLD.language !== 'ja';
    const wantJa = BLD.language === 'ja' || BLD.language === 'both';

    const sys =
      '너는 한국 블로그(네이버·브런치·티스토리) 전문 작가다.\n' +
      '템플릿: ' + tpl.t + ' (' + tpl.s + ')\n' +
      '톤: ' + toneLabel + ' · 목표 글자수: ' + lenTarget + '자 ±20%\n' +
      '블록 단위 JSON 배열로만 출력(다른 말 금지).\n' +
      '사용 가능 type: "heading"(H1/H2/H3), "paragraph", "image"(prompt 포함), "quote", "divider", "checklist"(items 배열)\n' +
      '구성: H1 제목 1개 → 리드 문단 → 섹션 (H2 + 문단 1~2개 + 이미지 프롬프트) 반복 → 마무리 문단\n' +
      '최소 3개의 섹션 · 이미지 블록 2~4개 · 강조 키워드는 텍스트 안에 ** **로 감싸 표시.\n' +
      '출력 예시: [{"type":"heading","level":1,"text":"..."},{"type":"paragraph","text":"..."},{"type":"image","prompt":"..."},{"type":"heading","level":2,"text":"..."},...]';
    const user = '주제: ' + topic + (wantJa ? '\n※ text 필드에 한국어/일본어 둘 다 제공: {"text_ko":"...","text_ja":"..."}' : '');

    const text = await APIAdapter.callWithFallback(sys, user, { maxTokens: 4500 });
    const m = text.match(/\[[\s\S]*\]/);
    if(!m) throw new Error('AI 응답 파싱 실패');
    const arr = JSON.parse(m[0]);

    _pushUndo();
    BLD.blocks = arr.map(b => {
      const id = _blockId();
      if(b.type === 'heading') return { id, type:'heading', level:b.level||2, text:b.text||b.text_ko||'' };
      if(b.type === 'paragraph') return { id, type:'paragraph', text:b.text||b.text_ko||'' };
      if(b.type === 'image') return { id, type:'image', prompt:b.prompt||'', url:'' };
      if(b.type === 'quote') return { id, type:'quote', text:b.text||b.text_ko||'' };
      if(b.type === 'divider') return { id, type:'divider' };
      if(b.type === 'checklist') return { id, type:'checklist', items:(b.items||[]).map(x => ({ text:x, done:false })) };
      if(b.type === 'table') return { id, type:'table', rows:b.rows||[['제목','내용']] };
      if(b.type === 'button') return { id, type:'button', text:b.text||'클릭', url:b.url||'#' };
      return { id, type:'paragraph', text:String(b.text||'') };
    });
    _renderCanvas();
    _computeSeoScore();
    document.getElementById('mz-out').value = _blocksToPlain(BLD.blocks);
    document.getElementById('mz-status').textContent = '✅ ' + BLD.blocks.length + '개 블록 생성';
  }catch(e){
    document.getElementById('mz-status').textContent = '❌ ' + e.message;
    alert('❌ ' + e.message);
  }finally{
    btn.disabled = false; btn.textContent = '☕ 글 자동생성';
  }
}

/* ─── 캔버스 렌더 ─── */
function _renderCanvas(){
  const c = document.getElementById('bld-canvas');
  if(!c) return;
  if(!BLD.blocks.length){ c.innerHTML = '<div class="bld-empty">주제를 입력하고 "☕ 글 자동생성"을 눌러주세요</div>'; return; }
  const fxReveal = document.getElementById('bld-fx-reveal')?.checked;
  const fxProgress = document.getElementById('bld-fx-progress')?.checked;
  const fxToc = document.getElementById('bld-fx-toc')?.checked;
  let html = '';
  if(fxProgress) html += '<div class="bld-read-progress"><b id="bld-progress-b"></b></div>';
  if(fxToc){
    const toc = BLD.blocks.filter(b => b.type === 'heading' && b.level >= 2);
    if(toc.length){
      html += '<div class="bld-toc"><h5>📑 목차</h5><ul>' +
        toc.map(t => '<li onclick="document.getElementById(\'' + t.id + '\').scrollIntoView({behavior:\'smooth\'})">' + (t.text||'').replace(/</g,'&lt;') + '</li>').join('') +
        '</ul></div>';
    }
  }
  BLD.blocks.forEach(b => {
    const sel = (b.id === BLD.selectedBlockId) ? ' sel' : '';
    const anim = (fxReveal ? ' style="animation:fadeInUp .5s ease"' : '');
    html += '<div class="bld-block bld-block-' + b.type + sel + '" id="' + b.id + '" onclick="bldSelectBlock(\'' + b.id + '\',event)"' + anim + '>';
    html += '<div class="bld-acts">' +
      '<button onclick="bldRegenBlock(\'' + b.id + '\',event)" title="AI 재생성">🔄</button>' +
      '<button onclick="bldDeleteBlock(\'' + b.id + '\',event)" title="삭제">🗑</button>' +
    '</div>';
    html += _renderBlockBody(b);
    html += '</div>';
  });
  c.innerHTML = html;
}
function _renderBlockBody(b){
  const txt = (s) => _highlightStar(String(s||'').replace(/</g,'&lt;'));
  switch(b.type){
    case 'heading': return '<h' + (b.level||2) + ' contenteditable="true" oninput="bldEditBlock(\'' + b.id + '\',this.innerText)">' + txt(b.text) + '</h' + (b.level||2) + '>';
    case 'paragraph': return '<p contenteditable="true" oninput="bldEditBlock(\'' + b.id + '\',this.innerText)">' + txt(b.text) + '</p>';
    case 'image':
      if(b.url) return '<img src="' + b.url + '" alt="' + (b.prompt||'이미지').replace(/"/g,'&quot;') + '">';
      return '<div style="padding:40px 20px;background:#fff5fa;border:2px dashed var(--line);border-radius:10px;text-align:center;color:var(--sub);font-size:12px">🖼 <b>이미지</b><br>프롬프트: ' + (b.prompt||'').slice(0,80) + '<br><button onclick="bldGenSingleImage(\'' + b.id + '\',event)" style="margin-top:8px;padding:6px 14px;border-radius:8px;border:1px solid var(--pink);background:#fff;cursor:pointer">🎨 이 이미지 생성</button></div>';
    case 'quote': return '<blockquote contenteditable="true" oninput="bldEditBlock(\'' + b.id + '\',this.innerText)">' + txt(b.text) + '</blockquote>';
    case 'divider': return '<hr class="bld-block-divider">';
    case 'checklist': return '<ul>' + (b.items||[]).map((it,i) => '<li' + (it.done?' class="done"':'') + ' onclick="bldToggleCheck(\'' + b.id + '\',' + i + ',event)">' + txt(it.text) + '</li>').join('') + '</ul>';
    case 'table':
      return '<table>' + (b.rows||[]).map((row,i) => '<tr>' + row.map(cell => i===0 ? '<th>' + txt(cell) + '</th>' : '<td>' + txt(cell) + '</td>').join('') + '</tr>').join('') + '</table>';
    case 'button': return '<a href="' + (b.url||'#') + '" target="_blank" contenteditable="true">' + txt(b.text) + '</a>';
  }
  return '';
}
function _highlightStar(s){ return s.replace(/\*\*(.+?)\*\*/g, '<span class="bld-hl">$1</span>'); }
function bldSelectBlock(id, ev){ if(ev) ev.stopPropagation(); BLD.selectedBlockId = id; _renderCanvas(); _renderPropsPanel(); }
function bldEditBlock(id, text){
  const b = BLD.blocks.find(x => x.id === id);
  if(!b) return;
  if(b.type === 'heading' || b.type === 'paragraph' || b.type === 'quote' || b.type === 'button') b.text = text;
  document.getElementById('mz-out').value = _blocksToPlain(BLD.blocks);
  _computeSeoScore();
}
function bldDeleteBlock(id, ev){
  ev && ev.stopPropagation();
  _pushUndo();
  BLD.blocks = BLD.blocks.filter(x => x.id !== id);
  _renderCanvas();
}
async function bldRegenBlock(id, ev){
  ev && ev.stopPropagation();
  const b = BLD.blocks.find(x => x.id === id);
  if(!b) return;
  try{
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
    const sys = '주어진 문장을 동일한 역할(같은 블록 유형)로 자연스럽게 다시 작성. 한 문장 또는 짧은 단락으로만 출력.';
    const user = '원본: ' + (b.text||b.prompt||'');
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens: 800 });
    _pushUndo();
    if(b.type === 'image') b.prompt = res.trim().slice(0,300);
    else b.text = res.trim();
    _renderCanvas();
  }catch(e){ alert('❌ ' + e.message); }
}
function bldToggleCheck(id, i, ev){
  ev && ev.stopPropagation();
  const b = BLD.blocks.find(x => x.id === id);
  if(b && b.items[i]) b.items[i].done = !b.items[i].done;
  _renderCanvas();
}

/* ─── 블록 추가 / 이미지 생성 ─── */
function bldAddBlock(type){
  _pushUndo();
  const id = _blockId();
  const stub = {
    text:     { id, type:'paragraph', text:'새 문단' },
    image:    { id, type:'image', prompt:'새 이미지 설명', url:'' },
    divider:  { id, type:'divider' },
    button:   { id, type:'button', text:'클릭', url:'#' },
    table:    { id, type:'table', rows:[['열1','열2'],['데이터1','데이터2']] },
    quote:    { id, type:'quote', text:'인용구' },
    checklist:{ id, type:'checklist', items:[{text:'항목1', done:false},{text:'항목2', done:false}] }
  }[type];
  if(stub) BLD.blocks.push(stub);
  _renderCanvas();
}
async function bldGenerateImages(){
  const imgBlocks = BLD.blocks.filter(b => b.type === 'image' && !b.url);
  if(!imgBlocks.length){ alert('생성할 이미지 블록이 없어요 (블로그 본문 먼저 생성)'); return; }
  const key = localStorage.getItem('uc_openai_key');
  if(!key){ alert('OpenAI 키가 필요합니다 (설정 탭에서 저장)'); return; }
  document.getElementById('mz-status').textContent = '🎨 ' + imgBlocks.length + '개 이미지 생성 중...';
  for(let i=0; i<imgBlocks.length; i++){
    try{ await bldGenSingleImage(imgBlocks[i].id); }catch(_){}
  }
  document.getElementById('mz-status').textContent = '✅ 이미지 생성 완료';
}
async function bldGenSingleImage(id, ev){
  ev && ev.stopPropagation();
  const b = BLD.blocks.find(x => x.id === id);
  if(!b) return;
  const key = localStorage.getItem('uc_openai_key');
  if(!key){ alert('OpenAI 키가 필요합니다'); return; }
  try{
    const stylePrefix = {
      ghibli:'in Studio Ghibli animation style, pastel colors,',
      realistic:'photorealistic, high detail,',
      watercolor:'soft watercolor illustration,',
      info:'clean infographic with icons and charts,',
      emoji:'cute emoji-style illustration,',
      minimal:'minimalist flat vector art,',
      pop:'pop art style, vibrant colors,',
      vintage:'vintage retro illustration,'
    }[BLD.imgStyle] || '';
    const fullPrompt = stylePrefix + ' ' + (b.prompt||BLD.topic);
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body: JSON.stringify({ model:'dall-e-3', prompt: fullPrompt, n:1, size:'1024x1024', response_format:'url' })
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error?.message || 'HTTP '+res.status);
    b.url = data.data?.[0]?.url || '';
    _renderCanvas();
  }catch(e){ alert('❌ ' + e.message); }
}

/* ─── 디바이스 프리뷰 ─── */
function bldSetDevice(d){
  BLD.device = d;
  document.getElementById('bld-dev-m')?.classList.toggle('on', d === 'mobile');
  document.getElementById('bld-dev-d')?.classList.toggle('on', d === 'desktop');
  const c = document.getElementById('bld-canvas');
  if(c) c.classList.toggle('mobile', d === 'mobile');
}

/* ─── 오른쪽 탭 ─── */
function bldRightTab(t){
  document.querySelectorAll('.bld-right-tabs button').forEach(b => b.classList.toggle('on', b.getAttribute('data-t') === t));
  ['props','seo','ab','money'].forEach(k => {
    const el = document.getElementById('bld-tab-' + k);
    if(el) el.classList.toggle('on', k === t);
  });
  if(t === 'seo') _computeSeoScore();
}

/* ─── 속성 패널 ─── */
function _renderPropsPanel(){
  const body = document.getElementById('bld-props-body');
  if(!body) return;
  const b = BLD.blocks.find(x => x.id === BLD.selectedBlockId);
  if(!b){ body.innerHTML = '<p class="hint" style="opacity:.7">(선택된 요소 없음)</p>'; return; }
  if(b.type === 'heading' || b.type === 'paragraph' || b.type === 'quote'){
    body.innerHTML =
      '<p class="hint">' + b.type + (b.level?' H'+b.level:'') + ' 선택됨</p>' +
      '<label>정렬</label><div class="bld-pill-row">' +
        '<button class="bld-pill on" onclick="_propAlign(\'left\')">좌</button>' +
        '<button class="bld-pill" onclick="_propAlign(\'center\')">중</button>' +
        '<button class="bld-pill" onclick="_propAlign(\'right\')">우</button>' +
      '</div>' +
      '<button class="mz-btn" style="width:100%;margin-top:8px" onclick="bldRegenBlock(\'' + b.id + '\')">🔄 AI 재생성</button>';
  } else if(b.type === 'image'){
    body.innerHTML =
      '<p class="hint">이미지 블록</p>' +
      '<label>프롬프트</label><textarea class="mz-in" style="min-height:70px" onchange="(BLD.blocks.find(x=>x.id===\'' + b.id + '\')||{}).prompt=this.value">' + (b.prompt||'') + '</textarea>' +
      '<button class="mz-btn pri" style="width:100%;margin-top:8px" onclick="bldGenSingleImage(\'' + b.id + '\')">🎨 AI로 재생성</button>' +
      '<label style="margin-top:6px">효과</label>' +
      '<select class="mz-in" onchange="document.getElementById(\'' + b.id + '\').querySelector(\'img\').style.borderRadius=({none:0,round:12,pill:999}[this.value]||0)+\'px\'">' +
      '<option value="none">없음</option><option value="round" selected>둥글게</option><option value="pill">완전 둥글게</option></select>';
  } else {
    body.innerHTML = '<p class="hint">' + b.type + ' 블록 선택됨</p>';
  }
}
function _propAlign(v){
  const b = BLD.blocks.find(x => x.id === BLD.selectedBlockId);
  if(!b) return;
  const el = document.getElementById(b.id);
  if(el) el.style.textAlign = v;
}

/* ─── SEO 점수 ─── */
function _computeSeoScore(){
  const checks = [];
  const blocks = BLD.blocks;
  const h1 = blocks.find(b => b.type === 'heading' && b.level === 1);
  const topic = BLD.topic || (h1?.text || '');
  const totalChars = blocks.reduce((a,b) => a + (b.text?.length || 0), 0);
  const imgCount = blocks.filter(b => b.type === 'image').length;

  function ck(ok, warn, label){ checks.push({ ok, warn, label }); }
  ck(!!h1, false, '제목(H1) 있음');
  ck(h1 && topic && h1.text && h1.text.includes((topic.split(' ')[0]||'').slice(0,5)), false, '제목에 키워드 포함');
  const metaDesc = document.getElementById('seo-desc')?.value || '';
  ck(metaDesc.length >= 80, metaDesc.length > 0, '메타 설명 80자 이상');
  ck(imgCount >= 2, imgCount >= 1, '이미지 ' + imgCount + '개 (권장 2+)');
  ck(totalChars >= 1500, totalChars >= 800, '본문 ' + totalChars + '자 (권장 1,500+)');
  const h2Count = blocks.filter(b => b.type === 'heading' && b.level === 2).length;
  ck(h2Count >= 3, h2Count >= 2, 'H2 소제목 ' + h2Count + '개 (권장 3+)');
  // 네이버 특화
  if(document.getElementById('seo-naver-2000')?.checked) ck(totalChars >= 2000, false, '네이버: 2,000자 이상');
  if(document.getElementById('seo-naver-img3')?.checked) ck(imgCount >= 3, imgCount >= 1, '네이버: 이미지 3장+');

  const okCount = checks.filter(c => c.ok).length;
  const score = Math.round((okCount / checks.length) * 100);
  BLD.seoScore = score;

  const scoreEl = document.getElementById('seo-score'); if(scoreEl) scoreEl.textContent = score;
  const list = document.getElementById('seo-checklist');
  if(list){
    list.innerHTML = checks.map(c =>
      '<li class="' + (c.ok ? 'ok' : (c.warn ? 'warn' : 'fail')) + '">' + c.label + '</li>'
    ).join('');
  }
  // 자동 메타 채우기
  const seoTitle = document.getElementById('seo-title');
  if(seoTitle && !seoTitle.value && h1) seoTitle.value = h1.text;
  const seoDesc = document.getElementById('seo-desc');
  if(seoDesc && !seoDesc.value){
    const firstPara = blocks.find(b => b.type === 'paragraph');
    if(firstPara) seoDesc.value = String(firstPara.text||'').slice(0,150);
  }
}
async function bldSeoAutoFix(){
  try{
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    const plain = _blocksToPlain(BLD.blocks);
    const sys = 'SEO 점수가 90+ 되도록 개선안을 JSON으로 출력: {"title":"메타 제목","description":"메타 설명(150~160자)","keywords":"키워드, 쉼표, 구분"}';
    const res = await APIAdapter.callWithFallback(sys, '주제: ' + BLD.topic + '\n본문 요약:\n' + plain.slice(0,1500), { maxTokens:800 });
    const m = res.match(/\{[\s\S]*\}/); if(!m) throw new Error('파싱 실패');
    const obj = JSON.parse(m[0]);
    document.getElementById('seo-title').value = obj.title || '';
    document.getElementById('seo-desc').value  = obj.description || '';
    document.getElementById('seo-kw').value    = obj.keywords || '';
    _computeSeoScore();
    alert('🔧 SEO 최적화 완료 · 점수: ' + BLD.seoScore);
  }catch(e){ alert('❌ ' + e.message); }
}

/* ─── A/B ─── */
function bldAbSave(){
  BLD.ab = {
    titleA: document.getElementById('ab-title-a').value,
    titleB: document.getElementById('ab-title-b').value,
    imgA:   document.getElementById('ab-img-a').value,
    imgB:   document.getElementById('ab-img-b').value,
    saved: true
  };
  const key = 'uc_bld_ab';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  list.unshift({ at: Date.now(), topic: BLD.topic, ab: BLD.ab });
  localStorage.setItem(key, JSON.stringify(list.slice(0,30)));
  alert('✅ 두 버전 동시 저장 · 나중에 성과 탭에서 비교');
}

/* ─── 수익화 CTA ─── */
async function bldMonCtaGen(){
  try{
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    const types = ['mon-kmong','mon-class','mon-sub','mon-kakao'].filter(id => document.getElementById(id)?.checked).join(', ');
    const sys = '수익화 CTA 한 줄 문구 생성. 자연스럽고 설득력 있게. 과장 없이. 100자 이내.';
    const user = '콘텐츠 주제: ' + BLD.topic + '\nCTA 유형: ' + (types || '일반');
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens:300 });
    document.getElementById('mon-cta-text').value = res.trim();
  }catch(e){ alert('❌ ' + e.message); }
}
function bldMonInsert(){
  const url = document.getElementById('mon-url').value.trim() || '#';
  const text = document.getElementById('mon-cta-text').value.trim();
  if(!text){ alert('CTA 문구를 먼저 작성/생성해주세요'); return; }
  const pos = BLD.moneyPos || '70';
  const ctaBlock = { id: _blockId(), type:'button', text, url };
  _pushUndo();
  if(pos === 'top') BLD.blocks.unshift(ctaBlock);
  else if(pos === 'bottom') BLD.blocks.push(ctaBlock);
  else {
    const at = Math.max(1, Math.floor(BLD.blocks.length * 0.7));
    BLD.blocks.splice(at, 0, ctaBlock);
  }
  _renderCanvas();
  alert('📌 ' + (pos==='70'?'70% 지점':pos==='top'?'상단':'하단') + '에 CTA 삽입');
}

/* ─── 블록 → HTML/Plain 변환 ─── */
function _blocksToHtml(opts){
  opts = opts || {};
  const ch = (BLD.language === 'ja') ? 'ja' : 'ko';
  const bk = loadBrandkit(ch);
  const brandColor = bk.color || '#FF6B9D';
  return BLD.blocks.map(b => {
    switch(b.type){
      case 'heading': return '<h' + (b.level||2) + ' style="color:' + brandColor + ';margin:20px 0 12px">' + (b.text||'').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>') + '</h' + (b.level||2) + '>';
      case 'paragraph': return '<p style="line-height:1.9;margin:0 0 14px">' + (b.text||'').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>') + '</p>';
      case 'image': return b.url ? '<p><img src="' + b.url + '" alt="' + (b.prompt||'이미지').replace(/"/g,'&quot;') + '" style="max-width:100%;border-radius:8px"></p>' : '<p><em>[이미지: ' + (b.prompt||'') + ']</em></p>';
      case 'quote': return '<blockquote style="border-left:4px solid ' + brandColor + ';padding:12px 16px;background:#fff5fa;margin:14px 0">' + (b.text||'') + '</blockquote>';
      case 'divider': return '<hr style="border:none;border-top:2px solid #eee;margin:24px 0">';
      case 'checklist': return '<ul>' + (b.items||[]).map(it => '<li>' + (it.done?'☑':'☐') + ' ' + it.text + '</li>').join('') + '</ul>';
      case 'table': return '<table style="width:100%;border-collapse:collapse">' + (b.rows||[]).map((r,i) => '<tr>' + r.map(c => i===0 ? '<th style="border:1px solid #eee;padding:8px;background:#fff5fa">'+c+'</th>' : '<td style="border:1px solid #eee;padding:8px">'+c+'</td>').join('') + '</tr>').join('') + '</table>';
      case 'button': return '<p style="text-align:center;margin:18px 0"><a href="' + (b.url||'#') + '" style="display:inline-block;padding:12px 24px;background:' + brandColor + ';color:#fff;border-radius:999px;text-decoration:none;font-weight:700">' + (b.text||'') + '</a></p>';
    }
    return '';
  }).join('\n');
}
function _blocksToPlain(blocks){
  return blocks.map(b => {
    switch(b.type){
      case 'heading': return '\n' + '#'.repeat(b.level||2) + ' ' + (b.text||'') + '\n';
      case 'paragraph': return (b.text||'').replace(/\*\*(.+?)\*\*/g,'$1') + '\n';
      case 'image': return '[이미지: ' + (b.prompt||'') + ']';
      case 'quote': return '> ' + (b.text||'');
      case 'divider': return '\n---\n';
      case 'checklist': return (b.items||[]).map(it => (it.done?'[x] ':'[ ] ') + it.text).join('\n');
      case 'button': return '[버튼: ' + (b.text||'') + ' → ' + (b.url||'') + ']';
    }
    return '';
  }).join('\n');
}

/* ─── Export ─── */
function bldExport(format){
  const html = _blocksToHtml();
  const plain = _blocksToPlain(BLD.blocks);
  let toCopy = html;
  let msg = '';
  if(format === 'naver'){ msg = '📝 네이버 블로그 에디터에 붙여넣으세요'; }
  else if(format === 'brunch'){ msg = '✍️ 브런치 에디터(마크다운)에 붙여넣으세요'; toCopy = plain; }
  else if(format === 'tistory'){ msg = '📄 티스토리 HTML 모드에 붙여넣으세요'; }
  else if(format === 'stibee'){ msg = '📋 스티비 HTML 에디터에 붙여넣으세요'; }
  else if(format === 'mailchimp'){ msg = '📋 Mailchimp Code view 에 붙여넣으세요'; }
  else if(format === 'beehiiv'){ msg = '📋 Beehiiv 에디터에 붙여넣으세요'; }
  else if(format === 'html'){ msg = '📋 HTML 복사됨'; }
  navigator.clipboard.writeText(toCopy).then(() => {
    alert(msg + '\n\n(' + toCopy.length + '자 클립보드 복사됨)');
  });
}

/* ─── 재활용 (1개 → 6개 플랫폼) ─── */
async function bldRecycle(target){
  if(!BLD.blocks.length){ alert('먼저 블로그를 생성해주세요'); return; }
  const source = _blocksToPlain(BLD.blocks);
  try{
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    const map = {
      newsletter: '뉴스레터 이메일 HTML 형식. 헤더 + 본문 3섹션 + 구독/CTA. 제목(subject)과 본문(body) JSON 출력: {"subject":"","body_html":""}',
      sns:        '인스타그램 카드뉴스 10장. 각 카드 120자 이내. JSON 배열: [{"slide":1,"title":"","text":""}, ... 10개]',
      webtoon:    '5칸 웹툰 구조. JSON 배열: [{"panel":1,"scene":"씬 설명","dialogue":"대사","sfx":"효과음"}, ... 5개]',
      shorts:     '60초 유튜브 숏츠 대본. 씬 6개. JSON 배열: [{"scene":1,"duration":10,"narration":"","visual":""}, ... 6개]',
      ebook:      'PDF 전자책용 구조. 표지 + 목차 + 3챕터. JSON: {"cover":"","toc":[],"chapters":[{"title":"","body":""}, ...]}',
      ja:         '일본어 버전 번역. 원본 구조 유지. 자연스러운 경어체. JSON 배열 블록 형식.'
    };
    const sys = map[target];
    if(!sys) return;
    const res = await APIAdapter.callWithFallback(sys, '원본 블로그:\n' + source.slice(0,4000), { maxTokens:4000 });
    // 보관함에 저장
    const key = 'uc_bld_recycled';
    const list = JSON.parse(localStorage.getItem(key)||'[]');
    list.unshift({ at: Date.now(), source_topic: BLD.topic, target, result: res });
    localStorage.setItem(key, JSON.stringify(list.slice(0,50)));
    // 타겟별 후속 동작
    if(target === 'shorts'){
      // 미디어 엔진으로 자동 전송
      const mkey = 'hub_scripts_v1';
      const mlist = JSON.parse(localStorage.getItem(mkey)||'[]');
      mlist.unshift({ source:'builder', lang:'ko', text: res, at: Date.now(), meta:{ topic: BLD.topic } });
      localStorage.setItem(mkey, JSON.stringify(mlist.slice(0,30)));
      if(confirm('📺 영상 대본 변환 완료 · 자동숏츠 엔진으로 이동할까요?')){
        location.href = 'engines/shorts/index.html?topic=' + encodeURIComponent(BLD.topic);
        return;
      }
    }
    navigator.clipboard.writeText(res);
    alert('✅ ' + target + ' 변환 완료 · 클립보드 복사 + 보관함 저장');
    document.getElementById('mz-out').value = res;
  }catch(e){ alert('❌ ' + e.message); }
}

/* ─── 저장/다운로드 ─── */
function bldSaveHtml(){
  const bk = loadBrandkit();
  const full = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' +
    (document.getElementById('seo-title')?.value || BLD.topic || '콘텐츠') + '</title>' +
    '<meta name="description" content="' + (document.getElementById('seo-desc')?.value||'') + '">' +
    '<style>body{font-family:Pretendard,sans-serif;max-width:700px;margin:0 auto;padding:32px 20px;line-height:1.8;color:#2b2430}</style>' +
    '</head><body>' + _blocksToHtml() + '</body></html>';
  const blob = new Blob([full], { type:'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = (BLD.topic || 'content') + '.html';
  a.click();
  URL.revokeObjectURL(url);
}
function bldSavePdf(){
  // window.print 다이얼로그 — 사용자가 "PDF로 저장" 선택
  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Pretendard,sans-serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8}</style></head><body>' + _blocksToHtml() + '</body></html>';
  const w = window.open('', '_blank');
  w.document.write(html); w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}
function bldSaveImage(){
  alert('🖼 이미지 저장: html2canvas 라이브러리 필요. 당분간 PDF 저장 후 스크린샷을 이용해주세요.');
}
function bldSaveLibrary(){
  const plain = _blocksToPlain(BLD.blocks);
  if(typeof window.Library !== 'undefined' && typeof window.Library.saveResult === 'function'){
    try{
      window.Library.saveResult({
        category:'monetize', source:'builder',
        title: '[' + BLD_TYPES[BLD.type].title + '] ' + (BLD.topic||'(제목없음)'),
        body: plain,
        meta: { type: BLD.type, template: BLD.template, seoScore: BLD.seoScore, brandkit: loadBrandkit() }
      });
      document.getElementById('mz-status').textContent = '💾 보관함 저장 완료';
      return;
    }catch(_){}
  }
  const key = 'uc_builder_saved';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  list.unshift({ at: Date.now(), type: BLD.type, topic: BLD.topic, blocks: BLD.blocks, seoScore: BLD.seoScore });
  localStorage.setItem(key, JSON.stringify(list.slice(0,50)));
  document.getElementById('mz-status').textContent = '💾 localStorage 저장 완료';
}
function bldSchedule(){
  const dt = document.getElementById('bld-schedule-dt').value;
  if(!dt){ alert('날짜/시간을 설정해주세요'); return; }
  const when = new Date(dt).getTime();
  const now = Date.now();
  const delta = when - now;
  if(delta <= 0){ alert('미래 시점으로 설정해주세요'); return; }
  if(delta > 2147483647){ alert('너무 먼 미래에요 (최대 24일)'); return; }
  setTimeout(() => {
    if('Notification' in window && Notification.permission === 'granted'){
      new Notification('📅 예약 발행 시간', { body: (BLD.topic||'콘텐츠') + ' 발행할 시간이에요' });
    } else alert('📅 예약한 시간이 되었습니다: ' + (BLD.topic||'콘텐츠'));
  }, delta);
  if('Notification' in window && Notification.permission === 'default'){ Notification.requestPermission(); }
  alert('📅 ' + new Date(when).toLocaleString('ko-KR') + ' 에 알림을 예약했습니다 (탭을 열어두세요)');
}

/* ─── 성과 기록 & AI 분석 ─── */
function bldPerfRecord(){
  const perf = {
    views:  parseInt(document.getElementById('perf-views').value||'0',10),
    time:   parseInt(document.getElementById('perf-time').value||'0',10),
    ctr:    parseFloat(document.getElementById('perf-ctr').value||'0'),
    share:  parseInt(document.getElementById('perf-share').value||'0',10)
  };
  const key = 'uc_bld_perf';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  list.unshift({
    at: Date.now(), topic: BLD.topic, type: BLD.type, template: BLD.template,
    imgStyle: BLD.imgStyle, tone: BLD.tone, seoScore: BLD.seoScore, perf
  });
  localStorage.setItem(key, JSON.stringify(list.slice(0,200)));
  document.getElementById('perf-result').innerHTML = '<div style="padding:10px;background:#eafbe8;border-radius:10px;color:#2f7a30;font-size:13px;font-weight:800">📈 성과 기록됨 · 기록 누적 ' + list.length + '건</div>';
}
async function bldPerfAnalyze(){
  const key = 'uc_bld_perf';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  if(list.length < 3){ alert('최소 3건 이상 성과 기록이 필요해요'); return; }
  try{
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    const sys = '콘텐츠 성과 데이터를 분석해서 잘된 패턴을 찾아 한국어로 3줄 이내로 요약. 다음 콘텐츠 추천 설정 1문장 포함.';
    const res = await APIAdapter.callWithFallback(sys, JSON.stringify(list.slice(0,30)), { maxTokens:800 });
    document.getElementById('perf-result').innerHTML =
      '<div style="padding:12px;background:#fff5fa;border:1px solid var(--line-strong);border-radius:10px;font-size:13px;line-height:1.7">🤖 <b>AI 분석</b><br>' +
      res.replace(/\n/g,'<br>') + '</div>';
  }catch(e){ alert('❌ ' + e.message); }
}

/* ═══════════════════════════════════════════════════════════
   다른 5개 빌더 (뉴스레터·웹툰·SNS·전자책·랜딩)
   AI 생성 → 해당 캔버스에 HTML 미리보기
   ═══════════════════════════════════════════════════════════ */
async function _bldGenGeneric(canvasId, sys, user, renderer){
  const status = document.getElementById('mz-status');
  status.textContent = '⏳ 생성 중...';
  try{
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
    {const v=localStorage.getItem('uc_openai_key'); if(v) APIAdapter.setApiKey('openai',v);}
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens: 4500 });
    const html = renderer(res);
    document.getElementById(canvasId).innerHTML = html;
    document.getElementById('mz-out').value = res;
    status.textContent = '✅ 생성 완료';
  }catch(e){ status.textContent = '❌ ' + e.message; alert('❌ ' + e.message); }
}
function _safeJsonBlock(s){ const m = s.match(/\{[\s\S]*\}|\[[\s\S]*\]/); if(!m) return null; try{ return JSON.parse(m[0]); }catch(_){ return null; } }

async function bldGenerateNewsletter(){
  const topic = document.getElementById('nl-topic').value.trim();
  const tpl = document.getElementById('nl-tpl').value;
  const seg = document.getElementById('nl-segment').value;
  if(!topic){ alert('주제를 입력해주세요'); return; }
  BLD.topic = topic;
  const sys = '뉴스레터 HTML 작성. 템플릿 스타일: ' + tpl + ' / 세그먼트: ' + seg + ' / JSON 출력: {"subject":"제목","body":"<div>...</div>"}. body 는 인라인 style 사용한 이메일 호환 HTML.';
  await _bldGenGeneric('nl-canvas', sys, '주제: ' + topic, (res) => {
    const j = _safeJsonBlock(res);
    if(!j) return '<div class="bld-empty">생성 실패: ' + res.slice(0,200) + '</div>';
    return '<p><b>📧 Subject:</b> ' + (j.subject||'') + '</p>' + (j.body||'');
  });
}
async function bldGenerateWebtoon(){
  const topic = document.getElementById('wt-topic').value.trim();
  const c1 = document.getElementById('wt-char1').value.trim();
  const c2 = document.getElementById('wt-char2').value.trim();
  if(!topic){ alert('주제를 입력해주세요'); return; }
  BLD.topic = topic;
  const sys = '5칸 웹툰 구조 JSON 배열: [{"panel":1~5,"scene":"씬 묘사","dialogue":"대사","sfx":"효과음"}]';
  const user = '주제: ' + topic + '\n캐릭터1: ' + c1 + '\n캐릭터2: ' + c2;
  await _bldGenGeneric('wt-canvas', sys, user, (res) => {
    const arr = _safeJsonBlock(res);
    if(!Array.isArray(arr)) return '<div class="bld-empty">생성 실패</div>';
    return arr.map(p => '<div style="padding:14px;margin:10px 0;border:2px solid var(--line);border-radius:12px;background:#fff"><b>🎨 칸 ' + p.panel + '</b><p style="font-size:12px;color:var(--sub);margin:6px 0">씬: ' + p.scene + '</p><p style="font-size:13px;margin:6px 0"><b>💬</b> ' + (p.dialogue||'') + '</p>' + (p.sfx ? '<p style="font-size:11px;color:var(--warn)">🔊 ' + p.sfx + '</p>' : '') + '</div>').join('');
  });
}
async function bldGenerateSns(){
  const topic = document.getElementById('sns-topic').value.trim();
  const count = parseInt(document.getElementById('sns-count').value,10);
  if(!topic){ alert('주제를 입력해주세요'); return; }
  BLD.topic = topic;
  const sys = count + '장 인스타 카드뉴스 JSON 배열: [{"slide":1,"title":"","text":"120자 이내"}]';
  await _bldGenGeneric('sns-canvas', sys, '주제: ' + topic, (res) => {
    const arr = _safeJsonBlock(res);
    if(!Array.isArray(arr)) return '<div class="bld-empty">생성 실패</div>';
    return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px">' +
      arr.map(s => '<div style="aspect-ratio:1;padding:14px;background:linear-gradient(135deg,#fff5fa,#f7f4ff);border-radius:14px;border:1px solid var(--line);display:flex;flex-direction:column;gap:6px"><b style="font-size:11px;color:var(--pink-deep)">SLIDE ' + s.slide + '</b><div style="font-size:14px;font-weight:900">' + (s.title||'') + '</div><div style="font-size:11.5px;line-height:1.5">' + (s.text||'') + '</div></div>').join('') +
    '</div>';
  });
}
async function bldGenerateEbook(){
  const title = document.getElementById('eb-title').value.trim();
  const ch = parseInt(document.getElementById('eb-chapters').value,10);
  const plat = document.getElementById('eb-platform').value;
  if(!title){ alert('책 제목을 입력해주세요'); return; }
  BLD.topic = title;
  const sys = '전자책 ' + ch + '챕터 구조 JSON: {"cover":"표지 카피","toc":["1장..","2장.."],"chapters":[{"title":"","summary":"","body":"600~800자"}]}. 플랫폼 최적화: ' + plat;
  await _bldGenGeneric('eb-canvas', sys, '책 제목: ' + title, (res) => {
    const j = _safeJsonBlock(res);
    if(!j) return '<div class="bld-empty">생성 실패</div>';
    let html = '<div style="background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;padding:40px 20px;border-radius:14px;text-align:center;margin-bottom:14px"><h2 style="margin:0">📚 ' + title + '</h2><p style="margin:8px 0 0">' + (j.cover||'') + '</p></div>';
    html += '<div style="padding:14px;background:#fff5fa;border-radius:12px;margin-bottom:14px"><b>📑 목차</b><ol>' + (j.toc||[]).map(t => '<li>' + t + '</li>').join('') + '</ol></div>';
    html += (j.chapters||[]).map((c,i) => '<div style="padding:16px;border:1px solid var(--line);border-radius:12px;margin:10px 0"><h3 style="margin:0 0 6px;color:var(--pink-deep)">' + (i+1) + '장. ' + c.title + '</h3><p style="font-size:12px;color:var(--sub);margin:0 0 10px">' + (c.summary||'') + '</p><p style="line-height:1.8">' + (c.body||'').replace(/\n/g,'<br>') + '</p></div>').join('');
    return html;
  });
}
async function bldGenerateLanding(){
  const name = document.getElementById('lp-name').value.trim();
  const tag = document.getElementById('lp-tagline').value.trim();
  const cta = document.getElementById('lp-cta').value.trim();
  const url = document.getElementById('lp-url').value.trim() || '#';
  const sec = parseInt(document.getElementById('lp-sections').value,10);
  if(!name){ alert('서비스명을 입력해주세요'); return; }
  BLD.topic = name;
  const sys = '링크인바이오 랜딩페이지 ' + sec + '섹션 JSON 배열: [{"section":"헤더|소개|서비스|후기|CTA","title":"","content":"","icon":"이모지"}]';
  await _bldGenGeneric('lp-canvas', sys, '서비스: ' + name + '\n태그라인: ' + tag + '\nCTA: ' + cta, (res) => {
    const arr = _safeJsonBlock(res);
    if(!Array.isArray(arr)) return '<div class="bld-empty">생성 실패</div>';
    const bk = loadBrandkit();
    return '<div style="max-width:420px;margin:0 auto;background:#fff">' +
      '<div style="padding:40px 20px;background:linear-gradient(135deg,' + (bk.color||'#FF6B9D') + ',#9181ff);color:#fff;text-align:center"><h1 style="margin:0;font-size:24px">' + name + '</h1><p style="margin:8px 0 16px">' + tag + '</p><a href="' + url + '" style="display:inline-block;padding:12px 24px;background:#fff;color:' + (bk.color||'#FF6B9D') + ';border-radius:999px;font-weight:900;text-decoration:none">' + cta + '</a></div>' +
      arr.map((s,i) => '<section style="padding:28px 20px;text-align:center;border-bottom:1px solid #f3e4ee"><div style="font-size:36px">' + (s.icon||'✨') + '</div><h2 style="margin:8px 0;font-size:18px">' + (s.title||'') + '</h2><p style="color:var(--sub);line-height:1.7">' + (s.content||'') + '</p></section>').join('') +
    '</div>';
  });
}

/* ═══════════════════════════════════════════════════════════
   호환 shim — 외부에서 참조하는 함수들 (보관함 전송 등)
   ═══════════════════════════════════════════════════════════ */
function mzCopy(){
  const t = document.getElementById('mz-out').value;
  if (!t) { alert('복사할 내용이 없습니다.'); return; }
  navigator.clipboard.writeText(t).then(() => {
    document.getElementById('mz-status').textContent = '📋 클립보드에 복사되었습니다.';
  });
}
function mzSave(){ bldSaveLibrary(); }
function mzSendToMedia(){
  const t = document.getElementById('mz-out').value;
  if (!t) { alert('먼저 콘텐츠를 생성해주세요.'); return; }
  const key = 'hub_scripts_v1';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  list.unshift({ source:'builder', lang:'ko', text:t, at:Date.now(), meta:{ type: BLD.type, topic: BLD.topic } });
  localStorage.setItem(key, JSON.stringify(list.slice(0,30)));
  if (confirm('🎬 미디어 엔진으로 전송했습니다.\n\n지금 미디어 엔진으로 이동할까요?')) {
    location.href = 'engines/media/index.html?tab=oneclick';
  }
}
// 레거시 이름 (다른 코드가 참조)
function generateMonetize(){ bldGenerateBlog(); }
function openMonetize(card){ openBuilder(card); }

// fadeInUp keyframes 등록
(function(){
  if(document.getElementById('bld-kfs')) return;
  const st = document.createElement('style');
  st.id = 'bld-kfs';
  st.textContent = '@keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
  document.head.appendChild(st);
})();

/* ═══════════════════════════════════════════════
   🏛️ 공공기관 패키지 — 서브 · 기관유형 · 톤 · 특화 필드
   =============================================== */
const PUBLIC_META = {
  doc:{ico:'📄',title:'문서/보고서'}, press:{ico:'📰',title:'보도/홍보'},
  design:{ico:'🎨',title:'디자인/인쇄물'}, civil:{ico:'🗂️',title:'민원/소통'},
  court:{ico:'⚖️',title:'법원/사법'}, law:{ico:'📜',title:'법령/행정'},
  improve:{ico:'💡',title:'제도/행정 개선'}, plan:{ico:'📊',title:'기획/예산'},
  event:{ico:'🎪',title:'행사/교육'}, award:{ico:'🏆',title:'상훈/표창'},
  contract:{ico:'📋',title:'계약/조달'}, intl:{ico:'🌐',title:'대외협력'},
  social:{ico:'📱',title:'소셜/디지털'}, crisis:{ico:'🚨',title:'위기관리/대응'}
};

const PUBLIC_SUBS = {
  doc:[
    {id:'policy-report',  name:'정책보고서',       hint:'배경·현황·과제·대안', prompt:'정책보고서. 구조: 배경→현황→문제점→정책 방향→추진 방안→기대효과→소요예산'},
    {id:'work-report',    name:'업무보고서',       hint:'수행 경과',            prompt:'업무보고서. 구조: 업무 개요→추진 경과→성과→향후 계획→건의사항'},
    {id:'draft-memo',     name:'기안문',           hint:'결재용',                prompt:'기안문. 제목/관련 근거/내용/붙임. 결재권자가 바로 읽을 수 있게 압축'},
    {id:'minutes',        name:'회의록',           hint:'논의·결정·액션',       prompt:'회의록. 회의 개요(일시/장소/참석자)→주요 논의→결정사항→후속조치(담당자/기한)'},
    {id:'business-trip',  name:'출장보고서',       hint:'출장 결과',             prompt:'출장보고서. 출장 개요→방문기관·면담자→주요 논의→시사점→활용방안'},
    {id:'audit-report',   name:'감사보고서',       hint:'감사 결과',             prompt:'감사보고서. 감사 개요→감사 결과→지적사항→조치의견→개선권고'},
    {id:'annual-plan',    name:'연간업무계획서',   hint:'1년 로드맵',            prompt:'연간 업무계획서. 비전/목표→전략과제(3~5개)→세부 과제→추진 일정→성과지표'}
  ],
  press:[
    {id:'press-release',  name:'보도자료',         hint:'언론 배포',             prompt:'보도자료. 리드문(육하원칙)→본문→인용문(기관장·관계자)→참고사항'},
    {id:'explanation',    name:'해명자료',         hint:'오보·논란 해명',        prompt:'해명자료. 사실관계→해명 내용→향후 계획→문의처. 방어적이지 않게 정확히'},
    {id:'promo',          name:'기관홍보문',       hint:'기관 소개',              prompt:'기관 홍보문. 기관 소개→주요 성과→핵심 사업→시민 혜택→미래 비전'},
    {id:'interview',      name:'보도 인터뷰 답변', hint:'기자 질문',              prompt:'보도 인터뷰 예상 질문 5개 + 공식 답변. 오해 없이 간결히'},
    {id:'sns-official',   name:'SNS 공식 게시물', hint:'공식 톤',                prompt:'공식 SNS 게시물. 짧고 명확, 공식 톤 유지, 해시태그 5~8개'}
  ],
  design:[
    {id:'poster',    name:'포스터 문구+레이아웃', hint:'행사 포스터', type:'design', prompt:'포스터 문구 + 3가지 레이아웃 배치안 제시'},
    {id:'banner',    name:'현수막/플래카드',       hint:'7~14자 메인', type:'design', prompt:'현수막/플래카드 문구. 메인 7~14자 + 보조 문구 3안'},
    {id:'namecard',  name:'명함 문구/직책 표기',   hint:'정식 표기',   type:'design', prompt:'명함 문구. 직책 정식 표기(국/한/영) + 간이 소개'},
    {id:'souvenir',  name:'기념품/각인 문구',      hint:'각인·보훈',   type:'design', prompt:'기념품 각인 문구 3안 + 영문/한자 병기 옵션'},
    {id:'leaflet',   name:'리플릿/브로슈어',       hint:'3단 접지',    type:'design', prompt:'3단 리플릿 구성. 표지/내지 3면/뒷면. 각 면 제목+본문+CTA'},
    {id:'ad-banner', name:'배너 카피라이팅',       hint:'웹/옥외',     type:'design', prompt:'배너 카피 3안(짧음/중간/긺). 메인 메시지+CTA'},
    {id:'envelope',  name:'봉투/레터헤드 문구',    hint:'공식 서한',   type:'design', prompt:'공식 봉투/레터헤드 문구. 기관명+부서+주소 표기'}
  ],
  civil:[
    {id:'civil-reply',  name:'민원답변서',        hint:'공감·설명·안내',        prompt:'민원답변서. 공감→사실 설명→처리 결과→후속 안내·문의처'},
    {id:'notice',       name:'안내문/공지문',     hint:'시민 안내',              prompt:'안내문/공지문. 무엇/언제/어디/어떻게/문의처를 상단에'},
    {id:'civil-result', name:'민원처리결과통보',  hint:'처리 완료',              prompt:'민원처리결과통보. 접수→검토→처리 결과→불복 시 절차'},
    {id:'objection',    name:'이의신청답변',      hint:'기준 명확히',            prompt:'이의신청답변. 이의 요지→검토 결과→근거 법령→결정 이유'},
    {id:'petition',     name:'청원답변서',        hint:'격식 유지',              prompt:'청원답변서. 청원 요지→처리 결과→향후 방침'},
    {id:'grievance',    name:'고충처리답변',      hint:'공감 우선',              prompt:'고충처리답변. 공감→경과→처리 결과→개선 방안'}
  ],
  court:[
    {id:'pre-decision',  name:'결정전조사 보고서', hint:'객관·중립', type:'court',
      prompt:'결정전조사 보고서. 구조: ①사건기본정보(피조사자/사건번호) ②면담내용(일시·장소·답변 요약) ③환경조사(가족/거주/경제/사회관계) ④의견 및 권고. 객관적·중립적 서술체 필수, 주관적 판단/추측 배제.'},
    {id:'pre-sentence',  name:'판결전조사 보고서', hint:'양형 자료', type:'court',
      prompt:'판결전조사 보고서. 구조: ①피고인 성행 ②가족환경 ③피해자 영향 ④재범위험성 평가 ⑤양형 의견. 객관적 기술, 사실 근거 명시.'},
    {id:'interview-rep', name:'조사관 면담 보고서',hint:'면담 기록', type:'court',
      prompt:'조사관 면담 보고서. 일시/장소/참석자→주요 문답→관찰 소견. 주관적 판단 최소화, 인용문은 따옴표로 명확히.'},
    {id:'probation',     name:'보호관찰 보고서',   hint:'관찰 결과', type:'court',
      prompt:'보호관찰 보고서. 관찰 기간→준수사항 이행→생활태도→위반 여부→권고 의견.'},
    {id:'service-cert',  name:'사회봉사 확인서',   hint:'이행 확인', type:'court',
      prompt:'사회봉사 확인서. 인적사항→명령 내용→이행 내역(일시/장소/시간)→확인 의견.'},
    {id:'court-opinion', name:'법원 제출용 의견서',hint:'공식 의견', type:'court',
      prompt:'법원 제출용 의견서. 사건 개요→쟁점→사실관계→법률적 검토→결론. 존칭·경어 사용.'}
  ],
  law:[
    {id:'easy-law',   name:'법령쉬운설명문',   hint:'시민용 풀이',          prompt:'법령을 시민이 이해하기 쉽게 푼 설명문. 조문 원문→쉬운 풀이→사례'},
    {id:'notice-adm', name:'행정예고문',       hint:'의견수렴',             prompt:'행정예고문. 예고 사유→주요 내용→의견 제출 기간/방법→문의처'},
    {id:'disposition',name:'처분통지서',       hint:'법적 효과',            prompt:'처분통지서. 처분 근거 법령→처분 내용→이유→불복 시 절차(행정심판/행정소송)'},
    {id:'trial-reply',name:'행정심판답변서',   hint:'청구 답변',            prompt:'행정심판답변서. 청구 취지 답변→처분 경위→답변 이유→증거자료'},
    {id:'ordinance',  name:'조례규칙해설문',   hint:'제정 취지',            prompt:'조례/규칙 해설문. 제정 배경→주요 내용→적용 대상→시행일→문의처'},
    {id:'law-opinion',name:'법령해석의견서',   hint:'해석 기준',            prompt:'법령해석의견서. 질의 요지→관련 법령→해석 기준→결론'}
  ],
  improve:[
    {id:'system-proposal',  name:'제도개선 제안서',       hint:'현황·문제·개선', prompt:'제도개선 제안서. ①현황 분석 ②문제점 ③개선 방향 ④세부 개선안 ⑤기대효과 ⑥소요예산·추진일정'},
    {id:'admin-proposal',   name:'행정개선 제안서',       hint:'절차·효율',      prompt:'행정개선 제안서. 현 행정 절차→비효율 요소→개선 방안→기대효과'},
    {id:'regulation-reform',name:'규제혁신 제안서',       hint:'규제 완화',      prompt:'규제혁신 제안서. 현 규제→현장 애로→혁신 방안→기대효과→법령 개정 필요 사항'},
    {id:'active-admin',     name:'적극행정 우수사례',     hint:'사례 공유',      prompt:'적극행정 우수사례. 배경→문제 상황→적극적 조치→성과→시사점'},
    {id:'citizen-proposal', name:'국민제안 작성 도우미',  hint:'시민 제안',      prompt:'국민제안 형식. 현황→문제점→제안 내용→기대효과. 시민이 읽기 좋게'},
    {id:'officer-proposal', name:'공무원 제안제도 보고서',hint:'제안 보고',      prompt:'공무원 제안제도 보고서. 제안 요지→근거→실행 방안→예상 효과→검토 의견'},
    {id:'innovation',       name:'혁신우수사례 보고서',   hint:'혁신 성과',      prompt:'혁신우수사례 보고서. 추진 배경→혁신 내용→성과(정량/정성)→시사점→확산 가능성'}
  ],
  plan:[
    {id:'biz-plan',       name:'사업계획서',     hint:'사업 설계',          prompt:'사업계획서. 사업 개요→목표/지표→추진 방안→일정→예산→성과관리'},
    {id:'budget-plan',    name:'예산기획서',     hint:'예산 요구',          prompt:'예산기획서. 사업 목적→소요예산 산출근거→세부 집행계획→재원 확보방안'},
    {id:'perf-report',    name:'성과보고서',     hint:'성과 정리',          prompt:'성과보고서. 사업 개요→주요 성과(정량/정성)→평가→개선과제'},
    {id:'policy-suggest', name:'정책제안서',     hint:'정책 아이디어',      prompt:'정책제안서. 배경→문제점→정책 방향→세부 방안→기대효과'},
    {id:'feasibility',    name:'타당성검토서',   hint:'사업 타당성',        prompt:'타당성검토서. 정책/기술/경제/운영 타당성 검토→종합 의견'},
    {id:'rfp',            name:'RFP',           hint:'제안요청서',          prompt:'RFP. 사업 개요→요구사항(기능/기술/품질)→제출 서류→평가기준'}
  ],
  event:[
    {id:'event-plan',   name:'행사계획서',         hint:'종합 기획',             prompt:'행사계획서. 행사 개요→추진 방향→세부 일정→역할 분담→예산→위험관리'},
    {id:'ceremony',     name:'식순/진행대본',      hint:'개·폐·시상·기념',       prompt:'공식 행사 식순 + 진행 대본. 개회→국민의례→기관장 인사→축사→본행사→폐회. MC 멘트 포함'},
    {id:'curriculum',   name:'교육커리큘럼+강의',  hint:'교육 설계',             prompt:'교육 커리큘럼 + 1차시 강의자료 샘플. 학습목표→차시별 주제→세부 내용→평가'},
    {id:'event-invite', name:'행사안내문/초청장',  hint:'공식 초청',             prompt:'공식 초청장. 초청 취지→행사 개요(일시/장소/내용)→회신 방법→문의처'},
    {id:'plaque-event', name:'감사패/상장 문구',   hint:'수여용',                prompt:'감사패/상장 문구. 공적 내용 요약→감사 표현→수여 기관명. 정중한 공식 문어'}
  ],
  award:[
    {id:'commendation',  name:'표창장',          hint:'공식 표창',    prompt:'표창장. 직위·성명→공적 요약→표창 문구→수여 일자·기관장'},
    {id:'thanks-plaque', name:'감사패',          hint:'감사 표시',    prompt:'감사패. 수여 사유→공적 요약→감사 문구→수여 일자·기관장'},
    {id:'merit-plaque',  name:'공로패',          hint:'공로 인정',    prompt:'공로패. 공로 내용→공적 요약→공로패 문구→수여 일자·기관장'},
    {id:'certificate',   name:'상장',            hint:'수상 증명',    prompt:'상장. 시상 부문→성적·공적→상장 문구→수여 일자·기관장'},
    {id:'recommend',     name:'추천서',          hint:'포상 추천',    prompt:'추천서. 피추천인 인적사항→공적 요약→추천 이유→추천 의견'},
    {id:'merit-brief',   name:'포상 추천 이유서',hint:'상세 공적',    prompt:'포상 추천 이유서. 공적 개요→세부 공적(수치·성과)→사회적 기여→수상 적정성'},
    {id:'merit-doc',     name:'훈포장 공적조서', hint:'서훈 공적',    prompt:'훈포장 공적조서. 표창/수상 이력→직무 공적→사회적 기여→서훈 추천 근거'}
  ],
  contract:[
    {id:'contract-draft',name:'계약서 초안',    hint:'조항 구조',      prompt:'공공기관 계약서 초안. 계약 개요→계약 조건→이행 의무→지체·해지→분쟁 해결'},
    {id:'bid-notice',    name:'입찰공고문',     hint:'공고 양식',      prompt:'입찰공고문. 공고 내용→참가 자격→입찰 방법·일정→낙찰자 결정 방식→문의처'},
    {id:'mou',           name:'협약서(MOU)',    hint:'기관간 협력',    prompt:'업무협약서(MOU). 협약 목적→협력 분야→각 기관의 역할→비밀유지→유효기간'},
    {id:'cooperation',   name:'업무협조공문',   hint:'기관간 요청',    prompt:'업무협조공문. 협조 요청 배경→요청 사항(구체적)→기한→문의처'},
    {id:'purchase-req',  name:'구매요청서',     hint:'내부 요청',      prompt:'구매요청서. 요청 사유→품목/규격/수량→예정가격→납기→집행 부서'}
  ],
  intl:[
    {id:'intl-letter',  name:'국제협력 공문',  hint:'정중한 서두',            prompt:'국제협력 공문. 상대국 기관에 대한 정중한 서두→본문(협력 제안/요청)→결어'},
    {id:'sister-city',  name:'자매결연 제안서',hint:'협력 제안',               prompt:'자매결연 제안서. 제안 배경→양 기관 개요→협력 분야→기대 효과'},
    {id:'intro-abroad', name:'해외기관소개문', hint:'영문 가능',                prompt:'해외 기관 대상 기관 소개문. 연혁→조직→주요 성과→국제협력 관심 분야'},
    {id:'welcome',      name:'외빈환영사',     hint:'환영 인사말',             prompt:'외빈환영사. 환영 인사→양국/기관 관계→방문 의의→협력 기대'},
    {id:'multi-guide',  name:'다국어 안내문',  hint:'한/영/일',                 prompt:'다국어 안내문. 한글 원문 + 영문 번역 + 일문 번역 3개 블록 병기'}
  ],
  social:[
    {id:'official-sns',name:'공식 SNS 게시물', hint:'인스타/FB/YT',         prompt:'공식 SNS 게시물 3종 (인스타/페이스북/유튜브 커뮤니티). 각 플랫폼 특성 반영'},
    {id:'yt-script',   name:'기관 유튜브 대본',hint:'3~5분',                 prompt:'기관 유튜브 대본. 훅→소개→본문→CTA. 공식 톤 유지하되 시청자 친화'},
    {id:'card-news-p', name:'카드뉴스',        hint:'6~8장',                  prompt:'카드뉴스 6~8장. 각 장: 제목 + 핵심 문장(20자 내외) + 보조 설명'},
    {id:'homepage',    name:'홈페이지 공지문', hint:'웹용',                    prompt:'홈페이지 공지문. 제목(검색 친화)→요약→본문→관련 링크/문의'},
    {id:'chatbot',     name:'챗봇 답변 스크립트',hint:'FAQ형',                prompt:'챗봇 답변 스크립트. 예상 질문 10개 + 각 답변(2~3문장) → 추가 문의 안내'}
  ],
  crisis:[
    {id:'crisis-doc', name:'위기상황 대응 공문',hint:'긴급 대응',            prompt:'위기 대응 공문. 상황 개요→현재까지 조치→향후 대응 계획→협조 요청'},
    {id:'apology',    name:'사과문',            hint:'공식 사과',             prompt:'공식 사과문. 사실 인정→원인→책임 소재→재발 방지 대책→사과 표현'},
    {id:'position',   name:'입장문',            hint:'공식 입장',             prompt:'공식 입장문. 쟁점 요약→기관 입장→근거→향후 계획'},
    {id:'briefing',   name:'언론브리핑자료',    hint:'기자 대응',             prompt:'언론 브리핑 자료. 상황 설명→조치 내용→기자 예상 질문/답변'},
    {id:'disaster',   name:'재난안전안내문',    hint:'시민 대응',             prompt:'재난안전 안내문. 상황→행동 요령(단계별)→문의·신고처. 쉽고 명확하게'}
  ]
};

const AGENCY_LABEL = {
  central:'중앙부처', metro:'광역지자체', local:'기초지자체',
  court:'법원', prosecutor:'검찰', police:'경찰',
  'edu-office':'교육청', soe:'공기업'
};

let pbState = { groupId:null, subId:null };

function openPublic(card){
  pbState.groupId = card.pbId;
  pbState.subId = null;
  const meta = PUBLIC_META[card.pbId];
  document.getElementById('pb-ico').textContent   = meta.ico;
  document.getElementById('pb-title').textContent = meta.title;
  document.getElementById('pb-desc').textContent  = '기관유형·톤·세부유형을 선택한 뒤 입력하세요.';

  // 법원 그룹이면 기관유형 기본값을 '법원'으로
  if (card.pbId === 'court') document.getElementById('pb-agency').value = 'court';

  // 서브 버튼 렌더
  const subBox = document.getElementById('pb-subs');
  subBox.innerHTML = '';
  (PUBLIC_SUBS[card.pbId]||[]).forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'mz-sub-btn';
    btn.innerHTML = s.name + '<small>' + s.hint + '</small>';
    btn.onclick = () => {
      pbState.subId = s.id;
      subBox.querySelectorAll('.mz-sub-btn').forEach(x=>x.classList.remove('on'));
      btn.classList.add('on');
      togglePbFields(s.type);
    };
    subBox.appendChild(btn);
  });
  // 첫 번째 자동 선택
  const first = (PUBLIC_SUBS[card.pbId]||[])[0];
  if (first) {
    pbState.subId = first.id;
    subBox.querySelector('.mz-sub-btn')?.classList.add('on');
    togglePbFields(first.type);
  }

  // 뷰 전환
  document.querySelector('.hero').style.display = 'none';
  document.getElementById('grid').style.display = 'none';
  document.getElementById('monetizeDetail').classList.add('hide');
  document.getElementById('publicDetail').classList.remove('hide');
  document.getElementById('pb-out').value = '';
  document.getElementById('pb-status').textContent = '';
}

function closePublic(){
  document.getElementById('publicDetail').classList.add('hide');
  document.querySelector('.hero').style.display = '';
  document.getElementById('grid').style.display = '';
  pbState = { groupId:null, subId:null };
}

function togglePbFields(type){
  document.getElementById('pb-court-box').style.display  = (type === 'court')  ? '' : 'none';
  document.getElementById('pb-design-box').style.display = (type === 'design') ? '' : 'none';
}

function _getPbSub(){
  if(!pbState.groupId || !pbState.subId) return null;
  return (PUBLIC_SUBS[pbState.groupId]||[]).find(s => s.id === pbState.subId);
}

async function generatePublic(){
  const sub = _getPbSub();
  if (!sub) { alert('세부 유형을 먼저 선택하세요.'); return; }
  const topic    = document.getElementById('pb-topic').value.trim();
  const target   = document.getElementById('pb-target').value.trim();
  const agency   = document.getElementById('pb-agency').value;
  const tone     = document.getElementById('pb-tone').value;
  const length   = document.getElementById('pb-length').value;
  const keywords = document.getElementById('pb-keywords').value.trim();
  const avoid    = document.getElementById('pb-avoid').value.trim();
  if (!topic) { alert('주제/제목을 입력해주세요.'); return; }

  const toneMap = {
    formal:  { label:'격식체(공문용)',    inst:'공공 문서 격식체. "~하고자 합니다" "~바랍니다" 등 공식 문어 사용. 존칭·경어 엄격.' },
    gentle:  { label:'안내체(민원용)',    inst:'시민 민원 안내체. 정중하되 부드럽고, 공감 표현과 명확한 안내를 병행.' },
    easy:    { label:'쉬운말(일반국민용)',inst:'쉬운 공공언어. 한자어·전문용어는 풀어 쓰고, 짧은 문장으로. 외래어 최소화.' },
    english: { label:'영어(국제협력용)',  inst:'Professional English for government/public sector. Formal yet clear. Use institutional tone.' }
  }[tone];
  const targetLang = (tone === 'english') ? 'en' : 'ko';
  const langInstruct = targetLang === 'en' ? '[Language] Write in English only.' : '[언어 지시] 반드시 한국어로만 작성.';

  // 본문 조립
  let extra = '';
  if (sub.type === 'court') {
    const subject = document.getElementById('pb-court-subject').value.trim();
    const when    = document.getElementById('pb-court-when').value.trim();
    const notes   = document.getElementById('pb-court-notes').value.trim();
    extra = '\n[법원 특화 입력]\n'+
      '피조사자: '+(subject||'(미입력)')+'\n'+
      '면담 일시·장소: '+(when||'(미입력)')+'\n'+
      '면담 내용 키워드:\n'+(notes||'(미입력)')+'\n'+
      '※ 반드시 객관적·중립적 서술체로 작성. 주관적 판단·추측·인상 표현 배제. 사실은 "확인되었다/진술하였다" 형식으로.';
  }
  if (sub.type === 'design') {
    const name  = document.getElementById('pb-design-name').value.trim();
    const when  = document.getElementById('pb-design-when').value.trim();
    const where = document.getElementById('pb-design-where').value.trim();
    const host  = document.getElementById('pb-design-host').value.trim();
    extra = '\n[디자인 특화 입력]\n'+
      '행사/품명: '+(name||'(미입력)')+'\n'+
      '일시: '+(when||'(미입력)')+'\n'+
      '장소: '+(where||'(미입력)')+'\n'+
      '주최·주관: '+(host||'(미입력)')+'\n'+
      '※ 반드시 3가지 문구·레이아웃 배치안(A안/B안/C안)을 제시하고, 각 안의 특징을 짧게 설명.';
  }

  const system =
    '당신은 공공기관 문서 작성 전문가다.\n' +
    '기관 유형: ' + AGENCY_LABEL[agency] + '\n' +
    '문서 유형: ' + sub.name + '\n' +
    '문서 규칙: ' + sub.prompt + '\n' +
    '문서 톤: ' + toneMap.label + ' — ' + toneMap.inst + '\n' +
    '길이: ' + {short:'500자 내외',mid:'1,500자 내외',long:'3,000자 내외',xl:'5,000자 이상'}[length] + '\n' +
    (keywords ? '핵심 키워드(자연스럽게 포함): ' + keywords + '\n' : '') +
    (avoid    ? '피해야 할 표현: ' + avoid + '\n' : '') +
    '허구의 수치·인용·법적 근거를 사실처럼 단정하지 말 것. 필요 시 [예시값] 표기.\n' +
    langInstruct;

  const user = '주제/제목: ' + topic + (target ? '\n대상(수신·독자): ' + target : '') + extra + '\n\n위 조건에 맞춰 바로 제출 가능한 최종 결과물만 작성해라.';

  const btn = document.getElementById('pb-gen');
  const out = document.getElementById('pb-out');
  const status = document.getElementById('pb-status');
  btn.disabled = true; btn.textContent = '⏳ 생성 중...';
  status.textContent = 'AI가 문서를 생성하고 있습니다...';
  out.value = '';

  try {
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
    {const v=localStorage.getItem('uc_openai_key'); if(v) APIAdapter.setApiKey('openai',v);}
    {const v=localStorage.getItem('uc_gemini_key'); if(v) APIAdapter.setApiKey('gemini',v);}

    const maxTok = {short:1500, mid:3000, long:5000, xl:7000}[length];
    const result = await APIAdapter.callWithFallback(system, user, { maxTokens: maxTok });
    out.value = result;
    status.textContent = '✅ 생성 완료 (' + result.length + '자, ' + AGENCY_LABEL[agency] + ' · ' + toneMap.label + ')';
  } catch (err) {
    out.value = '❌ 오류: ' + err.message + '\n\n- 대본생성기 탭에서 API 키를 저장했는지 확인하세요.';
    status.textContent = '❌ ' + err.message;
  } finally {
    btn.disabled = false; btn.textContent = '✨ AI로 생성';
  }
}

function pbCopy(){
  const t = document.getElementById('pb-out').value;
  if (!t) { alert('복사할 내용이 없습니다.'); return; }
  navigator.clipboard.writeText(t).then(()=>{
    document.getElementById('pb-status').textContent = '📋 클립보드에 복사되었습니다.';
  });
}
function pbSave(){
  const t = document.getElementById('pb-out').value;
  if (!t) { alert('저장할 내용이 없습니다.'); return; }
  const sub = _getPbSub();
  const key = 'uc_public_saved';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  list.unshift({
    at: Date.now(),
    agency: document.getElementById('pb-agency').value,
    tone:   document.getElementById('pb-tone').value,
    group:  pbState.groupId, sub: sub?.id, subName: sub?.name,
    topic:  document.getElementById('pb-topic').value,
    body:   t
  });
  localStorage.setItem(key, JSON.stringify(list.slice(0,50)));
  document.getElementById('pb-status').textContent = '💾 저장됨 (localStorage · 최근 50개 유지)';
}
function pbSendToMedia(){
  const t = document.getElementById('pb-out').value;
  if (!t) { alert('먼저 문서를 생성해주세요.'); return; }
  const key = 'hub_scripts_v1';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  const sub = _getPbSub();
  const isEnglish = document.getElementById('pb-tone').value === 'english';
  list.unshift({ source:'public', lang: isEnglish?'en':'ko', text:t, at:Date.now(), meta:{group:pbState.groupId, sub:sub?.id, agency:document.getElementById('pb-agency').value} });
  localStorage.setItem(key, JSON.stringify(list.slice(0,30)));
  if (confirm('🎬 미디어 엔진으로 전송했습니다.\n\n지금 미디어 엔진으로 이동할까요?')) {
    location.href = 'engines/media/index.html?tab=oneclick';
  }
}

/* ═══════════════════════════════════════════════
   🖥️ PPT 슬라이드 제작 — 6 유형 · 한+일 동시 · PowerPoint 구조 내보내기
   =============================================== */
const PPT_TYPES = {
  policy: { label:'제도/정책 설명', focus:'새 제도 도입 취지, 주요 변경점, 수혜 대상, 적용 일정, 문의처를 슬라이드 구조로 풀어서 설명. 복잡한 제도는 표·플로우 삽입 제안.' },
  report: { label:'업무 보고',      focus:'주간/월간/연간 업무 보고 구조. 추진 실적, 주요 성과(KPI), 애로사항, 향후 계획, 건의사항.' },
  event:  { label:'행사/이벤트 안내', focus:'행사 개요(일시·장소·대상), 프로그램 순서, 참가 방법, 주의사항, 문의처. 시민 친화적인 톤.' },
  edu:    { label:'교육/연수',      focus:'학습 목표, 차시·챕터 개요, 핵심 개념 설명, 사례/예시, 실습·토의 자료, 마무리 퀴즈.' },
  perf:   { label:'성과 보고',      focus:'사업 배경, 추진 경과, 정량/정성 성과(지표·예산 집행률), 시사점, 향후 확산 방안.' },
  promo:  { label:'홍보',           focus:'기관 비전, 핵심 사업, 주요 서비스, 시민 혜택, 연락처·채널. 임팩트 있는 헤드라인과 비주얼 중심.' }
};
const PPT_AUDIENCE = {
  internal: '내부 직원 대상. 전문 용어 사용 가능, 행정 절차·일정 구체적으로.',
  citizen:  '주민/시민 대상. 쉬운 공공언어, 한자어 풀어 쓰기, 혜택·참여 방법 명확히.',
  upper:    '상급기관(중앙부처·감사원 등) 보고용. 정량 지표·예산 집행·법령 근거 강조.',
  press:    '언론 대상. 헤드라인 임팩트, 객관적 수치, 인용 가능한 핵심 문장 포함.'
};
const PPT_TONE = {
  formal:     '공식 공공문서 톤. "~하고자 합니다" "~예정입니다" 등 정중하고 분명한 공문체.',
  friendly:   '친근하고 부드러운 안내체. 공감 표현 사용, 경직된 한자어 줄이기.',
  persuasive: '설득력 있는 발표 톤. 이점·근거·행동 유도를 슬라이드마다 구조적으로 배치.'
};

const pptState = { type:'policy', slides:10, audience:'internal', tone:'formal', ko:'', ja:'' };

function openPptBuilder(){
  document.querySelector('.hero').style.display = 'none';
  document.getElementById('grid').style.display = 'none';
  document.getElementById('publicDetail').classList.add('hide');
  document.getElementById('pptDetail').classList.remove('hide');
  document.getElementById('ppt-out-ko').value = '';
  document.getElementById('ppt-out-ja').value = '';
  document.getElementById('ppt-status').textContent = '';
  pptState.ko = ''; pptState.ja = '';
  _pptBindPickers();
}
function closePptBuilder(){
  document.getElementById('pptDetail').classList.add('hide');
  document.querySelector('.hero').style.display = '';
  document.getElementById('grid').style.display = '';
}
function _pptBindPickers(){
  const bind = (rowId, attr, key) => {
    const row = document.getElementById(rowId);
    if (!row || row.dataset.bound) return;
    row.dataset.bound = '1';
    row.querySelectorAll('[' + attr + ']').forEach(btn => {
      btn.addEventListener('click', () => {
        row.querySelectorAll('[' + attr + ']').forEach(x => x.classList.remove('on'));
        btn.classList.add('on');
        const v = btn.getAttribute(attr);
        pptState[key] = (key === 'slides') ? parseInt(v,10) : v;
      });
    });
  };
  bind('ppt-types',     'data-ppt',    'type');
  bind('ppt-count-row', 'data-slides', 'slides');
  bind('ppt-aud-row',   'data-aud',    'audience');
  bind('ppt-tone-row',  'data-ptone',  'tone');
}

async function generatePpt(){
  const topic  = document.getElementById('ppt-topic').value.trim();
  const agency = document.getElementById('ppt-agency').value.trim();
  if (!topic)  { alert('주제/제목을 입력해주세요.'); return; }
  if (!agency) { alert('기관명을 입력해주세요.'); return; }
  const t = PPT_TYPES[pptState.type];
  const a = PPT_AUDIENCE[pptState.audience];
  const tn = PPT_TONE[pptState.tone];

  const baseSystem =
    '당신은 공공기관 PPT 발표자료 전문가다. 아래 조건에 맞춰 발표용 슬라이드 구조를 생성하라.\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    'PPT 유형: ' + t.label + '\n' +
    '유형 포커스: ' + t.focus + '\n' +
    '기관명: ' + agency + '\n' +
    '주제/제목: ' + topic + '\n' +
    '슬라이드 수: 정확히 ' + pptState.slides + '장\n' +
    '대상: ' + a + '\n' +
    '톤: ' + tn + '\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '[출력 형식 — 반드시 이 형식을 정확히 지켜라]\n' +
    '## 📑 전체 목차\n' +
    '1. (슬라이드1 제목)\n' +
    '2. (슬라이드2 제목)\n' +
    '... (' + pptState.slides + '개까지)\n\n' +
    '## 🖥️ 슬라이드별 상세\n' +
    '각 슬라이드마다 아래 블록 반복:\n' +
    '\n---\n' +
    '### 슬라이드 N: (제목)\n' +
    '**핵심 내용**\n' +
    '- (3~5줄 불릿, 각 줄 40자 이내)\n' +
    '**시각자료**: (어떤 그래프/이미지/표/아이콘을 넣을지 구체적으로 1~2문장)\n' +
    '**발표자 노트**: (발표 시 말할 스크립트 2~3문장, 청중에게 실제로 말하는 톤으로)\n' +
    '---\n' +
    '허구의 수치/인용/법적 근거를 사실처럼 단정하지 말고 필요하면 [예시값] 표기.\n' +
    '청중과 톤 설정을 모든 슬라이드에 반영.';

  const user = '주제: ' + topic + ' / 기관: ' + agency + '\n유형: ' + t.label + '\n슬라이드 ' + pptState.slides + '장으로 완성된 PPT 구조를 출력하라.';

  const btn = document.getElementById('ppt-gen');
  const status = document.getElementById('ppt-status');
  btn.disabled = true; btn.textContent = '⏳ 생성 중 (한+일 동시)...';
  status.textContent = 'AI가 한국어·일본어 PPT 구조를 동시 생성 중입니다...';
  document.getElementById('ppt-out-ko').value = '';
  document.getElementById('ppt-out-ja').value = '';

  try {
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
    {const v=localStorage.getItem('uc_openai_key'); if(v) APIAdapter.setApiKey('openai',v);}
    {const v=localStorage.getItem('uc_gemini_key'); if(v) APIAdapter.setApiKey('gemini',v);}

    const maxTok = Math.max(3500, pptState.slides * 450);
    const res = await APIAdapter.generateBilingual(baseSystem, user, { maxTokens: maxTok });
    pptState.ko = res.ko || '';
    pptState.ja = res.jp || '';
    document.getElementById('ppt-out-ko').value = pptState.ko || ('❌ 한국어 생성 실패: ' + (res.errors?.ko || '알 수 없는 오류'));
    document.getElementById('ppt-out-ja').value = pptState.ja || ('❌ 일본어 생성 실패: ' + (res.errors?.jp || '알 수 없는 오류'));
    if (res.ok) status.textContent = '✅ 생성 완료 (' + pptState.slides + '장 · 한+일)';
    else status.textContent = '⚠️ 일부 실패 — KO:' + (res.ko?'OK':'❌') + ' / JP:' + (res.jp?'OK':'❌');
  } catch (err) {
    status.textContent = '❌ ' + err.message;
    document.getElementById('ppt-out-ko').value = '❌ 오류: ' + err.message + '\n\n설정 탭에서 API 키를 저장했는지 확인하세요.';
  } finally {
    btn.disabled = false; btn.textContent = '✨ PPT 생성 (한+일 동시)';
  }
}

function pptCopyAll(){
  const ko = document.getElementById('ppt-out-ko').value;
  const ja = document.getElementById('ppt-out-ja').value;
  if (!ko && !ja) { alert('복사할 내용이 없습니다.'); return; }
  const text = '━━━ 🇰🇷 한국어 ━━━\n' + ko + '\n\n━━━ 🇯🇵 日本語 ━━━\n' + ja;
  navigator.clipboard.writeText(text).then(()=>{
    document.getElementById('ppt-status').textContent = '📋 전체(한+일) 클립보드에 복사되었습니다.';
  });
}

function pptSave(){
  const ko = pptState.ko, ja = pptState.ja;
  if (!ko && !ja) { alert('저장할 내용이 없습니다.'); return; }
  const rec = {
    at: Date.now(),
    type: pptState.type,
    typeLabel: PPT_TYPES[pptState.type].label,
    slides: pptState.slides,
    audience: pptState.audience,
    tone: pptState.tone,
    agency: document.getElementById('ppt-agency').value,
    topic:  document.getElementById('ppt-topic').value,
    ko, ja
  };
  if (typeof window.Library !== 'undefined' && typeof window.Library.saveResult === 'function'){
    try {
      window.Library.saveResult({
        category: 'public',
        source:   'ppt',
        title:    '[PPT/' + rec.typeLabel + '] ' + rec.topic,
        body:     '━ 🇰🇷 ━\n' + ko + '\n\n━ 🇯🇵 ━\n' + ja,
        meta:     rec
      });
      document.getElementById('ppt-status').textContent = '💾 보관함 저장 완료';
      return;
    } catch(_) {}
  }
  const key = 'uc_ppt_saved';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  list.unshift(rec);
  localStorage.setItem(key, JSON.stringify(list.slice(0,50)));
  document.getElementById('ppt-status').textContent = '💾 저장됨 (localStorage · 최근 50개)';
}

/* "슬라이드N: 제목 | 내용 | 노트" 형식으로 파싱해서 클립보드에 복사 */
function pptExportStructure(){
  const ko = pptState.ko || document.getElementById('ppt-out-ko').value;
  const ja = pptState.ja || document.getElementById('ppt-out-ja').value;
  if (!ko && !ja) { alert('먼저 PPT를 생성해주세요.'); return; }
  const fmt = (src) => {
    if (!src) return '(없음)';
    // "### 슬라이드 N: ..." 단위로 분할
    const blocks = src.split(/\n(?=###\s*슬라이드\s*\d+|---\s*\n?###\s*슬라이드\s*\d+)/);
    const lines = [];
    blocks.forEach(b => {
      const m = b.match(/###\s*슬라이드\s*(\d+)\s*[:：]\s*(.+?)\n/);
      if (!m) return;
      const idx = m[1]; const title = m[2].trim();
      const contentMatch = b.match(/\*\*핵심\s*내용\*\*\s*\n([\s\S]*?)(?=\*\*시각자료|\*\*발표자|$)/);
      const noteMatch    = b.match(/\*\*발표자\s*노트\*\*\s*[:：]?\s*([\s\S]*?)(?=\n---|\n###|$)/);
      const content = (contentMatch ? contentMatch[1].trim() : '').replace(/\s+/g,' ');
      const note    = (noteMatch    ? noteMatch[1].trim()    : '').replace(/\s+/g,' ');
      lines.push('슬라이드' + idx + ': ' + title + ' | ' + content + ' | ' + note);
    });
    return lines.length ? lines.join('\n') : src;
  };
  const out = '━━━ 🇰🇷 PowerPoint 구조 ━━━\n' + fmt(ko) +
              '\n\n━━━ 🇯🇵 PowerPoint 構造 ━━━\n' + fmt(ja) +
              '\n\n(각 줄 = 슬라이드N: 제목 | 내용 | 발표자노트)';
  navigator.clipboard.writeText(out).then(()=>{
    document.getElementById('ppt-status').textContent = '🖥️ PowerPoint 구조(한+일) 클립보드에 복사되었습니다.';
  });
}

/* ═══════════════════════════════════════════════
   🎓 학습/교육 — 19 그룹 · 학년 자동조절 · 다국어 · 특화 필드
   =============================================== */
const EDU_META = {
  'elem-low':    {ico:'🧒',  title:'초등 저학년 (1~3)', grade:'elem1-3'},
  'elem-high':   {ico:'👦',  title:'초등 고학년 (4~6)', grade:'elem4-6'},
  'middle':      {ico:'📖',  title:'중학교',             grade:'mid'},
  'high':        {ico:'🎓',  title:'고등학교',           grade:'high'},
  'univ':        {ico:'🏛️', title:'대학교',             grade:'univ'},
  'grad':        {ico:'🔬',  title:'대학원',             grade:'grad'},
  'lang':        {ico:'🌐',  title:'언어학습',           grade:null},
  'exam':        {ico:'📝',  title:'시험/수능 특화',     grade:null},
  'tutor':       {ico:'🤖',  title:'AI 튜터',            grade:null},
  'planner':     {ico:'🗓️', title:'학습 플래너',        grade:null},
  'reading':     {ico:'📚',  title:'독서 교육',          grade:null},
  'special':     {ico:'🫶',  title:'특수교육/느린학습자', grade:null},
  'admission':   {ico:'🏆',  title:'입시 전략',          grade:'high'},
  'cert':        {ico:'📜',  title:'자격증/시험',        grade:'adult'},
  'teacher':     {ico:'🍎',  title:'교사/강사 도우미',   grade:null},
  'homeschool':  {ico:'🏡',  title:'홈스쿨링',           grade:null},
  'school-event':{ico:'🎉',  title:'학교 행사',          grade:null},
  'parent':      {ico:'👨‍👩‍👧',title:'부모 지원',          grade:null},
  'yt-edu':      {ico:'📺',  title:'교육 유튜브 채널',   grade:null}
};

const EDU_SUBS = {
  'elem-low':[
    {id:'diary',      name:'일기쓰기',         hint:'하루 기록',     prompt:'초등 저학년 일기 예시·구조. 날씨·있었던 일·느낀 점·내일 할 일. 짧고 쉬운 문장.'},
    {id:'bookreport', name:'독후감',           hint:'짧은 감상',     prompt:'초등 저학년 독후감. 책 소개→기억에 남는 장면→내 생각. 5~10문장.'},
    {id:'dictation',  name:'받아쓰기 연습',    hint:'연습 세트',     prompt:'받아쓰기 연습 문장 20개. 학년 수준 맞춤 어휘, 띄어쓰기·맞춤법 포인트.'},
    {id:'story',      name:'창작동화',         hint:'짧은 이야기',   prompt:'초등 저학년용 창작동화. 주인공·문제·해결·교훈. 600자 내외.'},
    {id:'letter',     name:'편지쓰기',         hint:'누구에게든',    prompt:'편지쓰기 예시. 받는 사람→인사→본문→끝인사. 초등 저학년 수준 어휘.'},
    {id:'math',       name:'수학 문제 풀이',   hint:'단계별',        prompt:'초등 저학년 수학 문제 풀이 설명. 그림·예시·단계별 풀이. 쉬운 비유 활용.'},
    {id:'picture-diary',name:'그림일기 문구', hint:'그림+글',       prompt:'그림일기 문구 5개 패턴. 그림 설명+짧은 글. 저학년 말투.'},
    {id:'present',    name:'발표자료',         hint:'짧은 발표',     prompt:'저학년 발표자료. 제목→인사→3가지 할 말→마무리 인사. 아이가 외우기 쉽게.'}
  ],
  'elem-high':[
    {id:'book-record', name:'독서록',         hint:'체계적 기록',    prompt:'초등 고학년 독서록. 책 정보→줄거리→인상 깊은 장면→내 생각→추천 여부.'},
    {id:'sci-report',  name:'과학탐구 보고서',hint:'실험형',         prompt:'초등 고학년 과학탐구 보고서. 탐구 주제→가설→실험 방법→결과→결론.'},
    {id:'soc-report',  name:'사회조사 보고서',hint:'조사형',         prompt:'초등 고학년 사회조사 보고서. 주제→조사 방법→결과→느낀 점.'},
    {id:'history',     name:'역사탐구',        hint:'인물·사건',     prompt:'초등 고학년 역사탐구. 시대·인물·사건 흐름. 이해하기 쉬운 어휘.'},
    {id:'essay',       name:'논설문',          hint:'주장+근거',     prompt:'초등 고학년 논설문. 주장→근거 3개→마무리. 근거는 구체적 예시.'},
    {id:'performance', name:'수행평가',        hint:'채점 기준',     prompt:'수행평가 답안 + 채점 포인트. 핵심 키워드 강조.'},
    {id:'en-basic',    name:'영어작문 기초',   hint:'간단 문장',     prompt:'초등 고학년 영어 작문 기초. 주제문장 + 보조문장 3~5개. 어휘는 수준 맞춤.'},
    {id:'jp-basic',    name:'일본어 기초',     hint:'히라가나부터',  prompt:'초등 고학년 일본어 기초. 히라가나·가타카나·인사말·자기소개.'},
    {id:'ppt',         name:'발표 PPT',        hint:'슬라이드 구성', prompt:'발표 PPT 구성 8장. 표지→주제→본문 5장→결론→질문받기.'}
  ],
  'middle':[
    {id:'concept',     name:'과목별 개념정리', hint:'국영수과사',     prompt:'중학교 과목별 개념정리. 핵심 개념→예시→확인 문제 3개.'},
    {id:'narrative',   name:'서술형 답안',     hint:'채점 포인트',    prompt:'중학교 서술형 답안 모범예시. 논리 구조+핵심 키워드 강조.'},
    {id:'mid-book',    name:'독서록',          hint:'분석적',         prompt:'중학교 독서록. 줄거리 요약→주제 분석→내 견해→이 책이 준 질문.'},
    {id:'free-inquiry',name:'자유탐구 보고서', hint:'자기주도',       prompt:'자유탐구 보고서. 주제 선정 이유→탐구 과정→결과→배운 점.'},
    {id:'mid-perf',    name:'수행평가',        hint:'포트폴리오',     prompt:'중학교 수행평가 답안. 주제 분석→본론 전개→결론.'},
    {id:'en-essay',    name:'영어 에세이',     hint:'5단락 구조',     prompt:'중학 수준 영어 에세이. Intro-Body1-Body2-Body3-Conclusion.'},
    {id:'jp-inter',    name:'일본어 중급',     hint:'JLPT N4~N5',     prompt:'중학 수준 일본어 작문. 간단한 경어·조사 포인트.'},
    {id:'career',      name:'진로탐색 보고서', hint:'자기이해',       prompt:'진로탐색 보고서. 자기이해→관심 직업→탐색 방법→앞으로의 계획.'},
    {id:'debate',      name:'토론 준비',       hint:'찬반 논거',      prompt:'토론 준비. 논제→찬/반 논거 각 3개→예상 반박→최종 정리.'},
    {id:'vacation',    name:'방학 과제',        hint:'계획+결과',     prompt:'방학 과제 구성. 목표→주차별 계획→실천 기록→결과 정리.'}
  ],
  'high':[
    {id:'sat-summary', name:'수능 과목 요약',  hint:'국영수탐구',     prompt:'수능 과목 핵심 요약. 단원별 핵심 개념·공식·기출 포인트.'},
    {id:'nonsul',      name:'논술',             hint:'인문·사회·과학', prompt:'대학 논술 답안. 논제 분석→논거→반론 고려→결론. 1,200~1,500자.'},
    {id:'record',      name:'생활기록부 ⭐',   hint:'세특/창체',      prompt:'생활기록부 기재 문구. 교과성취기준·핵심역량 기반 공식 문어체. 500자 제한 내에서 구체적 관찰·성장 기술.', type:'record'},
    {id:'personal',    name:'자기소개서 (학종)',hint:'대학 학종',      prompt:'학종 자기소개서. 지원동기→학업노력→성장경험→향후계획. 구체성 + 주도성 강조.'},
    {id:'interview',   name:'심층 면접 준비',  hint:'예상+답변',      prompt:'심층 면접 예상 질문 10개 + 모범 답변. 학과 관련성·근거 중심.'},
    {id:'en-advanced', name:'영어 에세이 고급',hint:'아카데믹',       prompt:'고등 수준 영어 에세이. Thesis 명확, 논증 전개 치밀, 인용 양식.'}
  ],
  'univ':[
    {id:'report',      name:'레포트',           hint:'대학 과제',     prompt:'대학 레포트. 서론(문제제기)→본론(논증·인용)→결론. 참고문헌 표기법 안내.'},
    {id:'paper-assist',name:'논문 작성 도우미', hint:'구조·표현',     prompt:'학부 논문 작성 지원. 연구 질문 설정·선행연구 정리 포맷·구조.'},
    {id:'ppt-univ',    name:'발표 PPT',         hint:'팀/개인',       prompt:'대학 발표 PPT 12장 구성. 표지→연구배경→방법→결과→논의→참고문헌.'},
    {id:'team-plan',   name:'팀프로젝트 기획서',hint:'역할·일정',     prompt:'팀프로젝트 기획서. 문제정의→목표→역할 분담→일정→산출물.'},
    {id:'lab-report',  name:'실험·실습 보고서',hint:'이공계',         prompt:'실험·실습 보고서. 목적→원리→방법→데이터→결과→고찰.'},
    {id:'internship',  name:'인턴십 지원서',    hint:'직무적합',      prompt:'인턴십 지원서. 지원동기→역량·경험→기여 방안→성장계획.'},
    {id:'job-resume',  name:'자기소개서 (취업용)',hint:'직무 중심',   prompt:'취업용 자기소개서. 성장과정·성격·지원동기·입사 후 포부. 직무 역량 기반.'},
    {id:'en-paper',    name:'영어 논문 요약',   hint:'Abstract',      prompt:'영어 논문 요약. Abstract 핵심 5문장 + 한국어 요약.'},
    {id:'study-plan',  name:'학업계획서',       hint:'교환·편입',     prompt:'학업계획서. 전공 선택 동기→계획→역량→졸업 후 진로.'},
    {id:'scholarship', name:'장학금 신청서',    hint:'목적·필요성',   prompt:'장학금 신청서. 신청 동기→학업 계획→경제 상황→향후 기여.'}
  ],
  'grad':[
    {id:'research-plan',name:'연구계획서',      hint:'석박사',         prompt:'연구계획서. 연구 주제·필요성→선행연구→연구 질문→방법론→일정.'},
    {id:'abstract',     name:'초록(논문)',      hint:'200~300자',     prompt:'논문 초록. 배경→목적→방법→결과→결론. 간결하게.'},
    {id:'intro',        name:'서론',            hint:'이론적 배경',    prompt:'논문 서론. 문제 인식→선행연구 한계→연구 목적·가치→본문 구성 안내.'},
    {id:'method',       name:'방법론',          hint:'연구설계',       prompt:'연구 방법론. 연구 대상·설계·도구·분석 방법·윤리적 고려.'},
    {id:'conclusion',   name:'결론',            hint:'시사점',         prompt:'논문 결론. 주요 결과 요약→이론적·실무적 시사점→한계·후속연구.'},
    {id:'conf',         name:'학회 발표자료',   hint:'15~20분',        prompt:'학회 발표자료. 슬라이드 15장 구성 + 스크립트.'},
    {id:'grant',        name:'연구비 신청서',   hint:'과제 제안',      prompt:'연구비 신청서. 연구 필요성→목표→방법→기대효과→예산 근거.'},
    {id:'en-paper2',    name:'영문 논문',       hint:'IMRaD',          prompt:'IMRaD 구조 영문 논문. Each section in academic English.'},
    {id:'jp-paper',     name:'일본어 논문',     hint:'論文形式',       prompt:'일본어 학술논문 기본 구조. 敬体を避け、論文体で。'},
    {id:'defense',      name:'심사 준비',       hint:'Q&A 예상',       prompt:'학위심사 준비. 예상 질문 15개 + 대응 포인트.'},
    {id:'rec-letter',   name:'교수 추천서 초안',hint:'초안',            prompt:'교수 추천서 초안. 관계→학업·연구 능력→인성·잠재력→추천 강조점.'},
    {id:'research-log', name:'연구노트',         hint:'기록 양식',     prompt:'연구노트 양식. 날짜·실험 내용·관찰·고찰·다음 단계.'}
  ],
  'lang':[
    {id:'ko-foreign', name:'한국어 (외국인용)',     hint:'문법 설명',    prompt:'외국인을 위한 한국어 설명. 문법 포인트→예문 5개→연습 문제.'},
    {id:'en-essay2',  name:'영어 에세이 교정',     hint:'첨삭',         prompt:'영어 에세이 첨삭. 원문→문법·표현 수정→수정 이유→개선본.'},
    {id:'en-speak',   name:'영어 회화',             hint:'상황별',       prompt:'영어 회화 상황극. 일상 상황 3개 × 대화 10턴 + 핵심 표현 해설.'},
    {id:'en-present', name:'영어 발표문',           hint:'프레젠테이션', prompt:'영어 프레젠테이션. Opening → Body → Closing + 제스처/연결어 가이드.'},
    {id:'jlpt',       name:'JLPT 대비',             hint:'N1~N5',        prompt:'JLPT 대비 자료. 문법·어휘·독해 핵심 + 기출 스타일 문제 10개.'},
    {id:'jp-write',   name:'일본어 작문 교정',      hint:'敬語·助詞',    prompt:'일본어 작문 첨삭. 원문→수정→문법 설명→개선본.'},
    {id:'jp-speak',   name:'일본어 회화 연습',      hint:'상황별',       prompt:'일본어 회화 상황극 × 10턴 + 주요 표현·敬語 해설.'},
    {id:'tri-lang',   name:'한영일 동시 학습자료',  hint:'3언어 병기',   prompt:'동일 주제 한/영/일 3개 언어 자료 병기. 단어·문장·연습문제.'}
  ],
  'exam':[
    {id:'concept-card',name:'개념 요약 카드',  hint:'핵심 정리',     prompt:'시험 대비 개념 요약 카드 세트 10장. 각 카드: 핵심 개념 + 예시 + 주의점.'},
    {id:'mock',        name:'예상 문제 자동생성',hint:'N개 출제',     prompt:'시험 예상 문제 10개 자동 생성. 유형별(객관식·서술형) + 정답 해설.'},
    {id:'wrong-note',  name:'오답노트 정리',   hint:'원인 분석',      prompt:'오답노트 양식. 문제→내 답→정답→오답 원인→유사 문제 3개.'},
    {id:'quiz',        name:'암기 퀴즈',        hint:'Q&A 형식',      prompt:'암기 퀴즈 20문. Q → A → 암기 팁.'},
    {id:'mindmap',     name:'마인드맵',         hint:'시각 정리',     prompt:'마인드맵 내용 구조. 중심 주제→3~5 가지 가지→세부 노드.'},
    {id:'final',       name:'시험 직전 요약본',hint:'30분 정리',      prompt:'시험 직전 30분 정리본. 반드시 체크할 핵심 개념 20개.'}
  ],
  'tutor':[
    {id:'step-by-step',name:'단계별 풀이 설명', hint:'친절 설명', type:'tutor', prompt:'모르는 문제를 학생이 이해할 때까지 단계별로 풀어준다. 중간 질문을 섞어 이해 확인.'},
    {id:'analyze-wrong',name:'왜 틀렸는지 분석',hint:'오답 분석', type:'tutor', prompt:'학생이 쓴 오답을 분석: ①무엇을 혼동했나 ②어떤 지식이 부족했나 ③교정 방법.'},
    {id:'similar',     name:'비슷한 문제 생성', hint:'유형 연습', type:'tutor', prompt:'같은 유형·개념의 유사 문제 5개 생성 + 정답·해설.'},
    {id:'weakness',    name:'취약점 파악+제안', hint:'맞춤 학습', type:'tutor', prompt:'학생의 취약점 파악 후 맞춤 학습 경로 제안. 우선순위·예상 소요시간 포함.'}
  ],
  'planner':[
    {id:'gen-schedule',name:'시험 일정 자동 생성', hint:'D-day 기반', type:'planner', prompt:'시험 날짜·가용 시간·과목 기반 주간/일일 학습 일정 자동 구성. 과목별 시간 분배·반복 주기 포함.'},
    {id:'distribute', name:'과목별 학습량 분배',  hint:'난이도 고려',  type:'planner', prompt:'과목별 학습량 분배표. 난이도·비중·부족도 반영. 시간 배분 근거 설명.'},
    {id:'checklist',  name:'체크리스트 생성',      hint:'실행 관리',    type:'planner', prompt:'주간/일일 학습 체크리스트. 완료 표시·누적 진도 확인 가능한 포맷.'},
    {id:'final-plan', name:'시험 직전 마무리 플랜',hint:'3일 플랜',     type:'planner', prompt:'시험 3일 전~당일 아침까지 마무리 플랜. 시간대별 학습/휴식·컨디션 관리 팁.'}
  ],
  'reading':[
    {id:'activity', name:'학년별 독서활동지', hint:'자동 생성', prompt:'학년별 독서활동지 자동 생성. 책 정보·인물 분석·질문·그리기·나라면 코너.'},
    {id:'discuss',  name:'토론 질문 생성',    hint:'깊이 있는', prompt:'책에 대한 토론 질문 10개. 사실·추론·가치 질문 순 구성.'},
    {id:'topic',    name:'독후글쓰기 주제',   hint:'주제 제안', prompt:'독후글쓰기 주제 10개 + 각 주제별 글쓰기 포인트.'},
    {id:'oneline',  name:'한줄평',            hint:'짧은 소감', prompt:'책에 대한 한줄평 10개. 다양한 관점 포함.'},
    {id:'review',   name:'서평 작성 도우미',  hint:'체계적',    prompt:'서평 작성 가이드. 책 소개→저자 소개→핵심 내용→저의 관점→추천 대상.'}
  ],
  'special':[
    {id:'easy-text', name:'쉬운말 자동 변환',  hint:'문장 단순화', prompt:'복잡한 글을 느린 학습자도 이해할 수 있는 쉬운말로 변환. 한 문장은 짧게, 어려운 단어는 풀어 쓰기.'},
    {id:'picture',   name:'그림 설명 추가',    hint:'시각 자료',   prompt:'글에 그림 설명을 추가. 각 문단에 어울리는 그림 프롬프트 + 짧은 캡션.'},
    {id:'repeat',    name:'반복 학습 자료',    hint:'단계적 반복', prompt:'핵심 개념을 3단계 반복 학습 자료로. 기초→중간→심화 단계별 설명·예시.'},
    {id:'praise',    name:'칭찬·격려 문구',    hint:'자신감 부여', prompt:'학습 상황별 칭찬·격려 문구 20개. 구체적·진정성·성장 마인드 기반.'}
  ],
  'admission':[
    {id:'univ-strategy',name:'대학별 입시 전략',hint:'맞춤 분석',  type:'admission', prompt:'희망 대학·학과·전형 기반 입시 전략 분석. 준비 포인트·시기별 할 일·경쟁률 고려.'},
    {id:'suseong-prep', name:'학생부종합전형 준비',hint:'학종',     type:'admission', prompt:'학생부종합전형 준비 로드맵. 교과·비교과·생기부·자소서·면접 영역별 점검.'},
    {id:'interview-adm',name:'면접 예상+답변',  hint:'학과별',      type:'admission', prompt:'학과/전형별 면접 예상 질문 15개 + 모범 답변 + 답변 구조 팁.'},
    {id:'portfolio',    name:'포트폴리오 구성', hint:'활동 정리',    type:'admission', prompt:'포트폴리오 구성 가이드. 표지·자기소개·활동·수상·성장 스토리.'},
    {id:'accepted-self',name:'합격 자소서 분석', hint:'패턴 학습',   type:'admission', prompt:'합격 자기소개서 구조 분석. 공통 패턴·차별화 포인트·반복 사용 표현 경고.'}
  ],
  'cert':[
    {id:'korea-history',name:'한국사능력검정',   hint:'시대별',  prompt:'한국사능력검정 대비 시대별 핵심 정리 + 기출 스타일 문제 10개.'},
    {id:'civil-exam',   name:'공무원 시험',      hint:'과목별',  prompt:'공무원 시험 과목별 핵심 요약 + 기출 패턴 분석.'},
    {id:'toeic-toefl',  name:'TOEIC/TOEFL',      hint:'유형별',  prompt:'TOEIC/TOEFL 유형별 전략 + 예상 문제 + 답 해설.'},
    {id:'jlpt-cert',    name:'JLPT',             hint:'N1~N5',   prompt:'JLPT 급수별 문법·어휘·독해·청해 핵심.'},
    {id:'cert-summary', name:'자격증 핵심 요약', hint:'단기',     prompt:'자격증 핵심 요약. 목차→단원별 핵심 100개→기출 분석.'},
    {id:'past-analysis',name:'기출 문제 분석',   hint:'빈출',     prompt:'기출 문제 빈출 주제 TOP 10 + 각 주제 정리 + 예상 문제.'}
  ],
  'teacher':[
    {id:'lesson-plan',name:'수업지도안',       hint:'학습목표',    type:'teacher', prompt:'수업지도안. 학습목표→도입→전개(활동 3~4개)→정리→평가→과제.'},
    {id:'quiz-make', name:'시험 문제 출제',     hint:'난이도 분포',type:'teacher', prompt:'학년·단원 기반 시험 문제 출제. 객관식 10·단답 5·서술 3 + 채점 기준.'},
    {id:'eval-text', name:'학생 평가 문구',     hint:'공식 표현',   type:'teacher', prompt:'학생 개개인 평가 문구. 학업·태도·성장 3영역, 500자 이내 공식 문어.'},
    {id:'letter-p',  name:'가정통신문',         hint:'학부모용',    type:'teacher', prompt:'가정통신문. 안내 사항→협조 요청→문의처. 친절·명확한 톤.'},
    {id:'ppt-class', name:'수업 PPT',           hint:'슬라이드',    type:'teacher', prompt:'수업용 PPT 구성. 도입→학습목표→본문(활동)→정리→과제.'},
    {id:'hw-assign', name:'과제 출제',           hint:'루브릭 포함',type:'teacher', prompt:'과제 출제. 목표→과제 설명→제출 방법→루브릭(채점 기준).'},
    {id:'parent-counsel',name:'학부모 상담 준비',hint:'대화 시나리오',type:'teacher', prompt:'학부모 상담 준비. 학생 상황 요약→주요 논의점→예상 질문·답변.'}
  ],
  'homeschool':[
    {id:'curri',    name:'커리큘럼 설계',     hint:'연간 계획',  prompt:'홈스쿨링 연간 커리큘럼. 과목별 목표→월별 진도→평가 방식.'},
    {id:'weekly',   name:'주간/월간 학습계획',hint:'일정표',     prompt:'홈스쿨링 주간·월간 학습계획 양식 + 예시.'},
    {id:'portfolio',name:'학습 포트폴리오',   hint:'성장 기록',  prompt:'학습 포트폴리오 구성. 학기별 목표·성과·성장 스토리.'},
    {id:'teach-guide',name:'부모용 교수법 가이드',hint:'지도 팁', prompt:'홈스쿨링 부모용 교수법 가이드. 동기부여·학습법·갈등 해결.'}
  ],
  'school-event':[
    {id:'talent-show',name:'학예회 대본',  hint:'반별 공연',    prompt:'초·중 학예회 대본. 개회→반별 공연 순서→마무리. MC 멘트 포함.'},
    {id:'class-news',name:'학급 신문',     hint:'학급 소식',    prompt:'학급 신문 구성. 헤드→이번 달 행사→친구 인터뷰→사진 설명→다음 호 예고.'},
    {id:'festival', name:'학교 축제 기획', hint:'부스·공연',    prompt:'학교 축제 기획안. 테마→부스 아이디어 10개→공연 프로그램→예산.'},
    {id:'motto',    name:'급훈 만들기',    hint:'슬로건',       prompt:'급훈 후보 10개 + 선정 기준 + 의미 설명.'},
    {id:'bunjip',   name:'학급 문집 편집', hint:'학생 글모음',  prompt:'학급 문집 편집 구성. 목차→학생 글 섹션 아이디어→편집자 인사말.'}
  ],
  'parent':[
    {id:'consult-prep',name:'자녀 학습 상담 준비',  hint:'포인트 정리', type:'parent', prompt:'자녀 학습 상담 준비. 현재 상태 점검→상담 질문→듣기 태도 가이드.'},
    {id:'meeting-talk',name:'학부모 총회 발언 준비',hint:'자연스러운 인사말',type:'parent', prompt:'학부모 총회 발언. 자기소개→자녀/학급에 대한 관찰→제안·건의.'},
    {id:'teacher-email',name:'교사 소통 이메일',     hint:'정중',        type:'parent', prompt:'교사와 소통 이메일 샘플. 문의·감사·건의 상황별 3개.'},
    {id:'career-talk',  name:'자녀 진로 대화 가이드',hint:'경청',        type:'parent', prompt:'자녀와 진로 대화 가이드. 시작 질문·경청 자세·피해야 할 말.'},
    {id:'motivate',     name:'학습 동기부여 방법',   hint:'연령별',      type:'parent', prompt:'연령별 학습 동기부여 방법. 칭찬법·목표 설정·환경 조성.'}
  ],
  'yt-edu':[
    {id:'elem-yt',name:'초등 교육 콘텐츠', hint:'동화·동요',  prompt:'초등 교육 유튜브 콘텐츠. 동화/개념 쉬운 설명/학습 동요 대본. 아이가 몰입하는 톤.'},
    {id:'mid-yt', name:'중고등 교육',      hint:'문제풀이',    prompt:'중고등 교육 유튜브 콘텐츠. 개념 설명/문제 풀이/수능 꿀팁. 공부하는 학생 시청자 친화.'},
    {id:'adult-yt',name:'대학·성인 교육',  hint:'전문 강의',   prompt:'대학·성인 대상 교육 콘텐츠. 전문 강의/자격증 준비 등 깊이 있는 구조.'}
  ]
};

const GRADE_LABEL = {
  'elem1-3':'초등 저학년 (1~3학년)', 'elem4-6':'초등 고학년 (4~6학년)',
  'mid':'중학교 (1~3학년)', 'high':'고등학교 (1~3학년)',
  'univ':'대학교', 'grad':'대학원', 'adult':'성인·일반'
};

let edState = { groupId:null, subId:null };

function openEdu(card){
  edState.groupId = card.eduId;
  edState.subId = null;
  const meta = EDU_META[card.eduId];
  document.getElementById('ed-ico').textContent   = meta.ico;
  document.getElementById('ed-title').textContent = meta.title;
  document.getElementById('ed-desc').textContent  = '학년·언어·세부유형을 선택한 뒤 입력하세요.';

  // 그룹별 권장 학년 자동 적용
  if (meta.grade) document.getElementById('ed-grade').value = meta.grade;

  // 서브 렌더
  const subBox = document.getElementById('ed-subs');
  subBox.innerHTML = '';
  (EDU_SUBS[card.eduId]||[]).forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'mz-sub-btn';
    btn.innerHTML = s.name + '<small>' + s.hint + '</small>';
    btn.onclick = () => {
      edState.subId = s.id;
      subBox.querySelectorAll('.mz-sub-btn').forEach(x=>x.classList.remove('on'));
      btn.classList.add('on');
      toggleEdFields(s.type);
    };
    subBox.appendChild(btn);
  });
  const first = (EDU_SUBS[card.eduId]||[])[0];
  if (first) {
    edState.subId = first.id;
    subBox.querySelector('.mz-sub-btn')?.classList.add('on');
    toggleEdFields(first.type);
  }

  // 뷰 전환
  document.querySelector('.hero').style.display = 'none';
  document.getElementById('grid').style.display = 'none';
  document.getElementById('monetizeDetail')?.classList.add('hide');
  document.getElementById('publicDetail')?.classList.add('hide');
  document.getElementById('eduDetail').classList.remove('hide');
  document.getElementById('ed-out').value = '';
  document.getElementById('ed-status').textContent = '';
}

function closeEdu(){
  document.getElementById('eduDetail').classList.add('hide');
  document.querySelector('.hero').style.display = '';
  document.getElementById('grid').style.display = '';
  edState = { groupId:null, subId:null };
}

function toggleEdFields(type){
  const ids = ['record','tutor','planner','admission','teacher','parent'];
  ids.forEach(t => {
    const el = document.getElementById('ed-'+t+'-box');
    if(el) el.style.display = (type === t) ? '' : 'none';
  });
}

function _getEdSub(){
  if(!edState.groupId || !edState.subId) return null;
  return (EDU_SUBS[edState.groupId]||[]).find(s => s.id === edState.subId);
}

async function generateEdu(){
  const sub = _getEdSub();
  if (!sub) { alert('세부 유형을 먼저 선택하세요.'); return; }
  const topic    = document.getElementById('ed-topic').value.trim();
  const target   = document.getElementById('ed-target').value.trim();
  const grade    = document.getElementById('ed-grade').value;
  const lang     = document.getElementById('ed-lang').value;
  const length   = document.getElementById('ed-length').value;
  const keywords = document.getElementById('ed-keywords').value.trim();
  const avoid    = document.getElementById('ed-avoid').value.trim();
  if (!topic) { alert('주제/단원/과제를 입력해주세요.'); return; }

  // 학년별 자동 난이도 가이드
  const gradeGuide = {
    'elem1-3':'쉬운 어휘, 짧은 문장, 그림 비유 중심. 한자어 최소화.',
    'elem4-6':'조금 더 복잡한 구조, 개념 설명과 예시를 풍부히.',
    'mid':'교과 성취기준 중심. 개념·예시·확인 문제 구성.',
    'high':'학습 목표와 사고력. 서술형 답안 구조 강조.',
    'univ':'학술적 표현, 참고문헌·인용 표기.',
    'grad':'학술 논문 수준의 엄밀성, 전문 용어 사용.',
    'adult':'실용적 어조, 바로 적용 가능한 내용.'
  }[grade];

  // 특화 입력 조립
  let extra = '';
  if (sub.type === 'record') {
    extra = '\n[생활기록부 입력]\n'+
      '유형: '+document.getElementById('ed-rec-type').value+'\n'+
      '과목/영역: '+document.getElementById('ed-rec-subject').value+'\n'+
      '활동 내용: '+document.getElementById('ed-rec-activity').value+'\n'+
      '※ 교과 성취기준·핵심역량 기반 공식 문어. 500자 제한 내 구체적 관찰·성장 기술. 주어 생략 가능.';
  }
  if (sub.type === 'tutor') {
    extra = '\n[AI 튜터 입력]\n문제: '+document.getElementById('ed-tutor-problem').value+
            '\n학생 답: '+(document.getElementById('ed-tutor-answer').value||'(없음)');
  }
  if (sub.type === 'planner') {
    extra = '\n[학습 플래너 입력]\n'+
      '목표일: '+document.getElementById('ed-plan-date').value+
      '\n가용 시간: '+document.getElementById('ed-plan-hours').value+
      '\n과목: '+document.getElementById('ed-plan-subjects').value;
  }
  if (sub.type === 'admission') {
    extra = '\n[입시 전략 입력]\n'+
      '희망 대학·학과: '+document.getElementById('ed-adm-target').value+
      '\n전형: '+document.getElementById('ed-adm-type').value+
      '\n현재 성적·활동: '+document.getElementById('ed-adm-profile').value;
  }
  if (sub.type === 'teacher') {
    extra = '\n[교사 입력]\n학급/수업: '+document.getElementById('ed-t-class').value+
            '\n수업 유형: '+document.getElementById('ed-t-type').value;
  }
  if (sub.type === 'parent') {
    extra = '\n[부모 지원 입력]\n자녀: '+document.getElementById('ed-p-child').value+
            '\n상황: '+document.getElementById('ed-p-type').value;
  }

  // 언어별 병렬 호출 목록
  const langList = {
    'ko':    [['ko','한국어','반드시 한국어로만 작성.']],
    'ko+en': [['ko','한국어','반드시 한국어로만 작성.'], ['en','English','Write in English only.']],
    'ko+jp': [['ko','한국어','반드시 한국어로만 작성.'], ['ja','日本語','必ず日本語のみで作成。']],
    'all':   [['ko','한국어','반드시 한국어로만 작성.'], ['en','English','Write in English only.'], ['ja','日本語','必ず日本語のみで作成。']]
  }[lang];

  const baseSystem =
    '당신은 학습 콘텐츠 전문가이자 교사다.\n' +
    '대상 학년/수준: ' + GRADE_LABEL[grade] + '\n' +
    '학년별 난이도 가이드: ' + gradeGuide + '\n' +
    '콘텐츠 유형: ' + sub.name + '\n' +
    '콘텐츠 규칙: ' + sub.prompt + '\n' +
    '길이: ' + {short:'500자 내외',mid:'1,500자 내외',long:'3,000자 내외',xl:'5,000자 이상'}[length] + '\n' +
    (keywords ? '핵심 키워드: ' + keywords + '\n' : '') +
    (avoid    ? '피해야 할 표현: ' + avoid + '\n' : '') +
    '허구의 수치·사실을 단정하지 말 것.';
  const user = '주제/단원/과제: ' + topic + (target ? '\n대상 학습자: ' + target : '') + extra;

  const btn = document.getElementById('ed-gen');
  const out = document.getElementById('ed-out');
  const status = document.getElementById('ed-status');
  btn.disabled = true; btn.textContent = '⏳ 생성 중...';
  status.textContent = (langList.length>1?langList.length+'개 언어':'한국어') + ' 생성 중...';
  out.value = '';

  try {
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
    {const v=localStorage.getItem('uc_openai_key'); if(v) APIAdapter.setApiKey('openai',v);}
    {const v=localStorage.getItem('uc_gemini_key'); if(v) APIAdapter.setApiKey('gemini',v);}

    const maxTok = {short:1500, mid:3000, long:5000, xl:7000}[length];
    const tasks = langList.map(([code, label, inst]) =>
      APIAdapter.callWithFallback(baseSystem + '\n[언어 지시] ' + inst, user, { maxTokens: maxTok })
        .then(r => ({code, label, text:r}))
        .catch(e => ({code, label, text:'❌ '+e.message}))
    );
    const results = await Promise.all(tasks);
    const combined = results.map(r => '━━━━━━━━━━ ' + r.label + ' ━━━━━━━━━━\n' + r.text + '\n').join('\n');
    out.value = combined;
    status.textContent = '✅ 생성 완료 (' + GRADE_LABEL[grade] + ' · ' + results.length + '개 언어)';
  } catch (err) {
    out.value = '❌ 오류: ' + err.message;
    status.textContent = '❌ ' + err.message;
  } finally {
    btn.disabled = false; btn.textContent = '✨ AI로 생성';
  }
}

function edCopy(){
  const t = document.getElementById('ed-out').value;
  if (!t) { alert('복사할 내용이 없습니다.'); return; }
  navigator.clipboard.writeText(t).then(()=>{
    document.getElementById('ed-status').textContent = '📋 클립보드에 복사되었습니다.';
  });
}
function edSave(){
  const t = document.getElementById('ed-out').value;
  if (!t) { alert('저장할 내용이 없습니다.'); return; }
  const sub = _getEdSub();
  const key = 'uc_edu_saved';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  list.unshift({
    at: Date.now(),
    grade: document.getElementById('ed-grade').value,
    lang:  document.getElementById('ed-lang').value,
    group: edState.groupId, sub: sub?.id, subName: sub?.name,
    topic: document.getElementById('ed-topic').value,
    body:  t
  });
  localStorage.setItem(key, JSON.stringify(list.slice(0,50)));
  document.getElementById('ed-status').textContent = '💾 저장됨 (localStorage · 최근 50개 유지)';
}
function edSendToMedia(){
  const t = document.getElementById('ed-out').value;
  if (!t) { alert('먼저 자료를 생성해주세요.'); return; }
  const key = 'hub_scripts_v1';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  const sub = _getEdSub();
  list.unshift({ source:'edu', lang:'ko', text:t, at:Date.now(), meta:{group:edState.groupId, sub:sub?.id, grade:document.getElementById('ed-grade').value} });
  localStorage.setItem(key, JSON.stringify(list.slice(0,30)));
  if (confirm('🎬 미디어 엔진으로 전송했습니다.\n\n지금 미디어 엔진으로 이동할까요?')) {
    location.href = 'engines/media/index.html?tab=oneclick';
  }
}

/* ═══════════════════════════════════════════════
   🌐 번역/통역/다국어 — 14 그룹 · 상황별 모드 · .srt 지원
   =============================================== */
const TRANS_META = {
  business:  {ico:'💼',title:'비즈니스 번역',      mode:'business'},
  casual:    {ico:'💬',title:'대화체/구어체 번역',  mode:'casual'},
  legal:     {ico:'🏛️',title:'공공기관/법률 번역', mode:'public'},
  medical:   {ico:'🏥',title:'의료/복지 번역',      mode:'medical'},
  entertain: {ico:'🎮',title:'엔터/게임 번역',      mode:'casual',  culture:true},
  commerce:  {ico:'🛒',title:'커머스/마케팅 번역',  mode:'casual'},
  content:   {ico:'🎥',title:'콘텐츠/미디어 번역',  mode:'casual',  subtitle:true},
  edu:       {ico:'📚',title:'학습 연계 번역',      mode:'business',linkEdu:true},
  interpret: {ico:'🎤',title:'통역 준비',            mode:'business'},
  localize:  {ico:'🌏',title:'현지화/문화 번역',    mode:'casual',  culture:true},
  polish:    {ico:'✍️',title:'문체 교정/윤문',      mode:'business'},
  travel:    {ico:'✈️',title:'여행/생활 특화',      mode:'casual'},
  overseas:  {ico:'🌐',title:'재외교포/외국인 특화',mode:'public'},
  multilang: {ico:'🗺️',title:'다국어 동시생성',    mode:'business',subtitle:true, multi:true}
};

const TRANS_SUBS = {
  business:[
    {id:'email',       name:'이메일',          hint:'공식 비즈',   prompt:'비즈니스 이메일 번역. 서두-본문-맺음말 구조, 정중한 격식체, 문화별 인사 관습 반영.'},
    {id:'official',    name:'공문 번역',        hint:'공식 문서',   prompt:'공문 번역. 문서 번호·제목·수신·참조 등 형식 유지, 각국 공문 관행 반영.'},
    {id:'contract',    name:'계약서',          hint:'법적 구속',   prompt:'계약서 번역. 조항 번호 유지, 법률 용어 정확성, 당사자 의무·권리 명확히.'},
    {id:'mou',         name:'협약서(MOU)',     hint:'기관간',       prompt:'MOU 번역. 협약 목적·범위·역할·유효기간 각국 관행에 맞게.'},
    {id:'report',      name:'보고서',          hint:'비즈 보고',   prompt:'비즈니스 보고서 번역. 요약·본문·결론 구조 유지, 숫자·용어 일관성.'},
    {id:'proposal',    name:'제안서',          hint:'설득형',       prompt:'제안서 번역. 설득 구조 유지(문제→해결→가치→CTA), 현지 비즈니스 문화 반영.'},
    {id:'presentation',name:'발표자료',        hint:'슬라이드',     prompt:'발표 슬라이드 번역. 슬라이드당 핵심 메시지 간결하게, 말하기 좋은 문장.'},
    {id:'manual',      name:'제품 설명서',     hint:'사용자 매뉴얼', prompt:'제품 사용설명서 번역. 단계별 명령형·일관된 용어·주의사항 강조.'},
    {id:'ir',          name:'IR 투자자료',     hint:'투자자용',     prompt:'IR 투자자료 번역. 재무 용어 정확성, 전문 투자자 톤, 수치 표기 일관성.'}
  ],
  casual:[
    {id:'daily',    name:'일상 대화',         hint:'친구·가족',    prompt:'일상 대화 번역. 자연스러운 구어체, 감정 톤 유지.'},
    {id:'katok',    name:'카카오톡/라인',     hint:'짧은 메시지',  prompt:'모바일 메신저 번역. 짧고 자연스럽게, 이모지·말줄임 보존.'},
    {id:'comment',  name:'댓글',              hint:'SNS 댓글',     prompt:'SNS 댓글 번역. 짧고 감정적, 커뮤니티 분위기 반영.'},
    {id:'cs',       name:'고객 응대 대화',    hint:'친절 응대',    prompt:'고객 응대 대화 번역. 정중하되 친근, 해결 중심.'},
    {id:'love',     name:'연애·친구 메시지',  hint:'감정 섬세',    prompt:'연애·친구 메시지 번역. 감정 뉘앙스 살려서.'},
    {id:'meme',     name:'밈·유행어·슬랭',    hint:'문화 현지화',  prompt:'밈·유행어·슬랭 번역. 직역이 아닌 타깃 문화의 유사 표현 찾기. 설명 주석 포함.'},
    {id:'game',     name:'게임 채팅',         hint:'짧고 빠르게',  prompt:'게임 채팅 번역. 축약어·은어·욕설 완화 버전 병기.'},
    {id:'travel-g', name:'여행 회화',         hint:'식당·쇼핑·긴급',prompt:'여행 회화 번역. 상황별 즉시 사용 문장 10개(식당/쇼핑/숙소/긴급).'}
  ],
  legal:[
    {id:'official-doc',name:'공문서',        hint:'정부·기관',    prompt:'공문서 번역. 격식체·공문 형식 유지·법적 용어 정확성.'},
    {id:'court',       name:'법원 서류',     hint:'소송·판결',    prompt:'법원 서류 번역. 법률 용어 정확, 문단 구조 유지, 당사자 호칭 규칙 준수.'},
    {id:'visa',        name:'비자/출입국 서류',hint:'이민국용',   prompt:'비자/출입국 서류 번역. 각국 양식 관행·용어 정확·서명란 표기.'},
    {id:'admin',       name:'행정서류',      hint:'증명·신청',    prompt:'행정서류(증명서·신청서) 번역. 양식 구조 유지·공식 번역가 톤.'},
    {id:'law-doc',     name:'법률문서',      hint:'계약·합의',    prompt:'법률문서 번역. 법률 용어 정확, 모호성 제거, 조항 번호 유지.'},
    {id:'judgment',    name:'판결문',        hint:'사건·판결',    prompt:'판결문 번역. 사건 개요·쟁점·판단 이유·주문을 법원 형식으로.'},
    {id:'notary',      name:'공증서류',      hint:'공증 양식',    prompt:'공증 서류 번역. 양식·서명·날인·공증관 표시 규칙 엄수.'}
  ],
  medical:[
    {id:'diagnosis', name:'진단서',           hint:'의료 공식',   prompt:'진단서 번역. 의학 용어 정확(ICD 코드 병기 가능), 환자·날짜·의사 정보 형식 유지.'},
    {id:'opinion',   name:'소견서',           hint:'의사 의견',   prompt:'소견서 번역. 의학적 소견·권고 명확히, 전문 용어 일관.'},
    {id:'prescription',name:'처방전',         hint:'용법·용량',   prompt:'처방전 번역. 약품명(원어 병기)·용법·용량·주의사항 정확.'},
    {id:'consent',   name:'의료 동의서',      hint:'환자 동의',   prompt:'의료 동의서 번역. 환자가 이해 가능한 쉬운 표현 + 법적 효력 있는 핵심 조항 유지.'},
    {id:'hospital-guide',name:'병원 안내문', hint:'방문·절차',    prompt:'병원 안내문 번역. 동선·절차·문의처 명확, 외국인 환자 친화적 톤.'},
    {id:'welfare',   name:'복지서비스 안내',  hint:'시민 안내',   prompt:'복지서비스 안내 번역. 대상·자격·신청 방법·혜택 구조 유지, 쉬운 말투.'},
    {id:'foreign-patient',name:'외국인 환자 소통',hint:'진료 중', prompt:'외국인 환자와의 진료 현장 대화 번역. 증상 확인 질문 세트·검사 안내·치료 설명.'}
  ],
  entertain:[
    {id:'game-ui',  name:'게임 UI',          hint:'버튼·메뉴',    prompt:'게임 UI 번역. 글자수 제한 고려, 기능 명확, 게임 톤 유지.'},
    {id:'game-story',name:'게임 시나리오',   hint:'캐릭터 대사',  prompt:'게임 시나리오 번역. 캐릭터별 말투 차별화, 감정 전달, 문화 현지화.'},
    {id:'webtoon',   name:'웹툰·만화 대사',  hint:'말풍선 길이',  prompt:'웹툰·만화 번역. 말풍선 길이 맞춤, 의성어·의태어 현지화, 감정 유지.'},
    {id:'drama',     name:'드라마·영화 자막',hint:'시청자 몰입',  prompt:'드라마·영화 자막 번역. 시청자 호흡 맞춤, 문화 노트 최소, 구어체.'},
    {id:'anime',     name:'애니메이션',      hint:'대사·효과',    prompt:'애니메이션 번역. 캐릭터 말투 차별, 팬 커뮤니티 용어 반영.'},
    {id:'lyric',     name:'노래 가사',       hint:'운율·감정',    prompt:'노래 가사 번역. 직역과 의역 2버전 병기, 운율·감정 우선.'},
    {id:'fanfic',    name:'팬픽',            hint:'팬 문화',      prompt:'팬픽 번역. 팬덤 용어·캐릭터 이름 원어 병기, 팬 커뮤니티 톤.'}
  ],
  commerce:[
    {id:'product-kr-jp',name:'상품설명 (쿠팡→아마존→라쿠텐)',hint:'플랫폼 변환', prompt:'상품설명을 대상 플랫폼(쿠팡/아마존/라쿠텐) 스타일로 현지화. 제목·불릿·상세 설명을 플랫폼 규칙에 맞춰.'},
    {id:'ad-copy',      name:'광고 카피 현지화',hint:'유행 반영',     prompt:'광고 카피 현지화. 직역 금지, 타깃 문화 정서·유행 반영, 3안 병기.'},
    {id:'sns-commerce', name:'SNS 콘텐츠',      hint:'플랫폼별',      prompt:'SNS 커머스 콘텐츠 번역. 플랫폼별 어조·해시태그 전략.'},
    {id:'review',       name:'리뷰·후기',       hint:'진정성',        prompt:'리뷰·후기 번역. 구어체 진정성 유지, 별점 표현 관행 반영.'},
    {id:'detail-page',  name:'상세페이지',      hint:'판매전환',      prompt:'상세페이지 번역. 구매 결정 흐름 유지, 문화별 설득 포인트 조정.'},
    {id:'slogan',       name:'브랜드 슬로건',   hint:'짧고 강하게',   prompt:'브랜드 슬로건 현지화 3안. 짧고 강하게, 음운 고려.'}
  ],
  content:[
    {id:'yt-subtitle', name:'유튜브 자막',     hint:'.srt 생성', type:'subtitle', prompt:'유튜브 자막 번역. .srt 형식으로 타이밍 포함 자동 분할.'},
    {id:'blog-sns',    name:'블로그·SNS',      hint:'플랫폼 톤',               prompt:'블로그·SNS 게시물 번역. 플랫폼별 어조 현지화.'},
    {id:'newsletter',  name:'뉴스레터',        hint:'구독자용',                 prompt:'뉴스레터 번역. 헤드·리드·본문·CTA 구조 유지, 구독자 친화 톤.'},
    {id:'webtoon-novel',name:'웹툰·웹소설',    hint:'장편 번역',               prompt:'웹툰·웹소설 번역. 문체 일관성·등장인물 톤 유지·분할 번역 OK.'},
    {id:'ebook-t',     name:'전자책',          hint:'챕터 단위',                prompt:'전자책 번역. 챕터 구조 유지, 목차·인덱스 별도 표기.'},
    {id:'srt-file',    name:'자막 파일(.srt)', hint:'타이밍',    type:'subtitle', prompt:'원문을 번역 + SRT 타이밍으로 분할해 .srt 파일 형식으로 출력.'}
  ],
  edu:[
    {id:'textbook',  name:'교과서 내용 (한영일 동시)',hint:'3언어 병기', prompt:'교과서 내용을 한/영/일 3언어 병기. 학년 수준 어휘 조정.'},
    {id:'en-passage',name:'영어 지문 → 한국어 해석', hint:'수능·모의', prompt:'영어 지문 한국어 해석. 구문 분석·단어 정리 주석 포함.'},
    {id:'jp-passage',name:'일본어 지문 → 한국어 해석',hint:'JLPT 포함', prompt:'일본어 지문 한국어 해석. 문법·어휘 주석 포함.'},
    {id:'en-essay-trans',name:'영어 에세이 교정+번역',hint:'첨삭 함께', prompt:'영어 에세이 문법 교정 + 한국어 번역. 교정 사항 주석.'},
    {id:'jp-write-trans',name:'일본어 작문 교정+번역',hint:'경어·조사',  prompt:'일본어 작문 교정 + 한국어 번역. 敬語·조사 교정 주석.'},
    {id:'jlpt-explain',  name:'JLPT 문제 해설',       hint:'N1~N5',     prompt:'JLPT 문제 해설. 문법 포인트·정답 근거·유사 문제.'},
    {id:'toeic-passage', name:'TOEIC/TOEFL 지문 분석',hint:'유형별',    prompt:'TOEIC/TOEFL 지문 분석. 핵심 문장·패러프레이징·정답 근거.'},
    {id:'study-abroad',  name:'유학 지원서류 번역',   hint:'자소서·추천서·성적표',prompt:'유학 지원서류 번역. 공식 격식체, 학업 용어 정확, 각국 양식 관행 반영.'},
    {id:'oversea-textbook',name:'해외 교재 번역 요약',hint:'챕터 요약', prompt:'해외 교재 번역 요약. 핵심 개념 중심 요약, 한국 학생 이해 관점.'},
    {id:'kor-eng-jpn-study',name:'한영일 학습자료 동시', hint:'3언어 병기',prompt:'한영일 동시 학습자료. 단어·문장·예시 문제 3언어 병기.'}
  ],
  interpret:[
    {id:'meeting-int',name:'회의 통역 스크립트', hint:'사전 준비', prompt:'회의 통역 스크립트. 주요 의제·예상 질문·용어집·통역자 대응 팁.'},
    {id:'present-int',name:'발표 통역 스크립트', hint:'슬라이드별',prompt:'발표 통역 스크립트. 슬라이드별 번역 + 말하기 호흡 표시.'},
    {id:'interview',  name:'인터뷰 통역',        hint:'질문·답변', prompt:'인터뷰 통역 준비. 예상 질문·답변·고유명사 표기.'},
    {id:'nego',       name:'비즈니스 협상 준비', hint:'용어집',    prompt:'비즈니스 협상 통역 준비. 협상 포인트·주요 용어·문화별 협상 관행.'},
    {id:'protocol',   name:'의전 행사 통역',     hint:'격식',      prompt:'의전 행사 통역. 호칭·인사말·감사 표현 격식체로.'},
    {id:'phone',      name:'전화 통역 스크립트', hint:'짧은 대화', prompt:'전화 통역 스크립트. 인사·본론·마무리 + 긴급 대응 표현.'}
  ],
  localize:[
    {id:'kr-jp',    name:'한→일 문화 현지화',  hint:'정서 조정',  prompt:'한→일 문화 현지화. 한국 특유 표현·정서를 일본 문화 관점에서 자연스럽게.'},
    {id:'kr-us',    name:'한→미 문화 현지화',  hint:'구어·유머',   prompt:'한→미 문화 현지화. 한국 정서를 미국 독자가 이해하기 쉽게, 유머·관용구 조정.'},
    {id:'jp-kr',    name:'일→한 문화 현지화',  hint:'일본 특유',   prompt:'일→한 문화 현지화. 일본 특유 표현·경어·정서를 한국 독자에게.'},
    {id:'proverb',  name:'속담·관용어',          hint:'유사 표현',  prompt:'속담·관용어 번역. 직역 + 타깃 언어의 유사 속담 + 의미 주석.'},
    {id:'humor',    name:'유머·개그',            hint:'웃음 유지',  prompt:'유머·개그 번역. 타깃 문화에서 통할 유사 유머로 치환 + 원본 주석.'},
    {id:'food-name',name:'음식·지명',            hint:'표기 관행',  prompt:'음식·지명 번역. 원어 병기 + 현지 표기 관행 반영 + 설명 주석.'},
    {id:'honor',    name:'경칭·존댓말 변환',     hint:'한↔일 경어', prompt:'한↔일 경어 체계 변환. 직급·연령·친밀도에 따른 경어 등급 조정.'},
    {id:'age-tone', name:'연령대별 말투 조정',  hint:'10~70대',     prompt:'연령대별 말투 조정(10대/20대/30대/40대/50대+). 어휘·종결어미·구어 경향.'}
  ],
  polish:[
    {id:'de-literal',  name:'직역→자연스러운 번역',hint:'번역투 제거', prompt:'직역된 문장을 자연스러운 타깃 언어로 윤문. 원어민 감수 시뮬레이션.'},
    {id:'formal-swap', name:'격식↔비격식 변환',   hint:'톤 조정',     prompt:'같은 내용을 격식체/비격식체 두 버전으로 제공.'},
    {id:'tr-tone',     name:'번역투 문장 교정',   hint:'어색한 표현', prompt:'번역투 표현 찾아 자연스럽게 교정. 교정 전후 대비표 포함.'},
    {id:'native-sim',  name:'원어민 감수 시뮬레이션',hint:'최종 점검',prompt:'원어민 감수 시뮬레이션. 어색한 표현·문법·문체 지적 + 개선안.'},
    {id:'term',        name:'전문용어 일관성 체크',hint:'용어집',      prompt:'전문용어 일관성 체크. 문서 내 용어 통일·용어집 생성.'}
  ],
  travel:[
    {id:'food-order', name:'식당 주문',     hint:'메뉴·주문', prompt:'식당 주문 즉시 사용 문장. 메뉴 문의·주문·알레르기·계산.'},
    {id:'shopping',   name:'쇼핑·흥정',     hint:'가격 흥정', prompt:'쇼핑·흥정 즉시 사용 문장. 가격 문의·할인·교환 환불.'},
    {id:'checkin',    name:'숙소 체크인',   hint:'호텔·에어비앤비',prompt:'숙소 체크인 즉시 사용 문장. 체크인·요청사항·문제 해결.'},
    {id:'hospital-t', name:'병원 방문',     hint:'증상 설명', prompt:'병원 방문 즉시 사용 문장. 증상 설명·진료 절차 질문·약 구입.'},
    {id:'emergency',  name:'긴급 상황 대처',hint:'경찰·대사관',prompt:'긴급 상황(분실·도난·사고·의료) 대처 문장. 경찰·대사관 연락 포함.'},
    {id:'transport',  name:'대중교통 이용', hint:'지하철·버스',prompt:'대중교통 이용 즉시 사용 문장. 티켓 구매·경로 질문·환승.'},
    {id:'tour',       name:'관광지 안내',   hint:'투어·입장권',prompt:'관광지 안내 즉시 사용 문장. 입장권·가이드 요청·사진 촬영.'}
  ],
  overseas:[
    {id:'jp-admin',name:'일본 행정서류 번역',    hint:'재류·세금·보험', prompt:'일본 행정서류 번역(재류카드·주민표·세금·건보). 한국인이 이해하기 쉽게.'},
    {id:'kr-admin',name:'한국 행정서류 번역',    hint:'주민등록·재외국민',prompt:'한국 행정서류 번역(주민등록·재외국민 등록·주민증). 일본어·영어 설명.'},
    {id:'law-diff',name:'양국 법률 차이 설명',   hint:'한↔일',          prompt:'양국 법률 차이 설명. 같은 상황(상속·계약·세금)에서 두 나라 법률 차이 비교표.'},
    {id:'tax-ins', name:'세금·보험 서류',        hint:'연말정산·건보',  prompt:'세금·보험 서류 번역. 연말정산·국민건강보험 등 한국어·일본어 양식 변환.'},
    {id:'school-work',name:'학교·직장 서류 번역',hint:'입학·취업',     prompt:'학교 입학·직장 제출 서류 번역. 각국 양식 관행 반영.'}
  ],
  multilang:[
    {id:'tri-lang', name:'한국어+일본어+영어 동시',hint:'3개국어 동시', prompt:'한/일/영 3개국어 병렬 번역. 각 언어 자연스럽게, 문장 구조 유지.'},
    {id:'add-zh',   name:'중국어 추가',            hint:'4개국어',    prompt:'한/일/영/중 4개국어 병렬 번역.'},
    {id:'platform', name:'플랫폼별 최적화',        hint:'SEO·길이',   prompt:'같은 콘텐츠를 네이버/구글/Yahoo Japan/百度 각 플랫폼 SEO·문화에 맞춰 4개 버전.'},
    {id:'seo',      name:'국가별 SEO 최적화',      hint:'키워드',      prompt:'국가별 SEO 키워드 분석 + 제목·메타·본문 각 국가 최적화.'},
    {id:'yt-3lang', name:'유튜브 대본 한일영 동시',hint:'영상용',     prompt:'유튜브 대본 한/일/영 동시 번역. 말하기 호흡 맞춰 자연스럽게.'},
    {id:'srt-gen',  name:'자막 파일(.srt) 생성',   hint:'타이밍',      type:'subtitle', prompt:'원문을 번역 + SRT 타이밍으로 자동 분할·출력.'},
    {id:'srt-time', name:'자막 타이밍 최적화',     hint:'호흡 조정',   type:'subtitle', prompt:'기존 자막의 타이밍과 길이 최적화. 한 줄 글자수·표시 시간 조정.'}
  ]
};

const LANG_LABEL_FULL = { ko:'한국어', ja:'일본어', en:'영어', zh:'중국어', auto:'자동감지' };
const MODE_LABEL = {
  business:'비즈니스 격식체',
  casual:'친근한 대화체',
  public:'공공기관 공문체',
  medical:'의료·법률 전문체',
  kids:'어린이 쉬운말',
  senior:'시니어 친화체'
};
const MODE_INSTRUCT = {
  business:'공식·정중한 비즈니스 격식체. 경어·전문 용어 정확.',
  casual:'친근하고 자연스러운 구어체. 감정·뉘앙스 살리기.',
  public:'공공기관 공문체. 정중하되 명확하고 형식 규정 준수.',
  medical:'의료·법률 전문 용어 정확. 법적·의학적 모호성 제거.',
  kids:'어린이가 이해할 쉬운 단어·짧은 문장·친근한 어조.',
  senior:'시니어가 편안히 읽을 어휘. 천천히 또박또박 느낌의 말씨.'
};

let trState = { groupId:null, subId:null };

function openTrans(card){
  trState.groupId = card.trId;
  trState.subId = null;
  const meta = TRANS_META[card.trId];
  document.getElementById('tr-ico').textContent   = meta.ico;
  document.getElementById('tr-title').textContent = meta.title;
  document.getElementById('tr-desc').textContent  = '출발어·도착어·번역 모드를 선택한 뒤 원문을 입력하세요.';

  // 그룹 기본 모드 적용
  if (meta.mode) document.getElementById('tr-mode').value = meta.mode;

  // 문화·자막 박스 기본 숨김
  document.getElementById('tr-culture-box').style.display  = meta.culture  ? '' : 'none';
  document.getElementById('tr-subtitle-box').style.display = meta.subtitle ? '' : 'none';
  document.getElementById('tr-go-edu').style.display       = meta.linkEdu  ? '' : 'none';
  document.getElementById('tr-dl-srt').style.display       = 'none';

  // 다국어 동시 그룹이면 도착어를 기본 3개국어로
  if (meta.multi) document.getElementById('tr-to').value = 'ko+ja+en';

  // 서브 렌더
  const subBox = document.getElementById('tr-subs');
  subBox.innerHTML = '';
  (TRANS_SUBS[card.trId]||[]).forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'mz-sub-btn';
    btn.innerHTML = s.name + '<small>' + s.hint + '</small>';
    btn.onclick = () => {
      trState.subId = s.id;
      subBox.querySelectorAll('.mz-sub-btn').forEach(x=>x.classList.remove('on'));
      btn.classList.add('on');
      // 자막 서브 선택 시 자막 박스 표시
      document.getElementById('tr-subtitle-box').style.display = (s.type === 'subtitle' || meta.subtitle) ? '' : 'none';
    };
    subBox.appendChild(btn);
  });
  const first = (TRANS_SUBS[card.trId]||[])[0];
  if (first) {
    trState.subId = first.id;
    subBox.querySelector('.mz-sub-btn')?.classList.add('on');
    if (first.type === 'subtitle') document.getElementById('tr-subtitle-box').style.display = '';
  }

  // 뷰 전환
  document.querySelector('.hero').style.display = 'none';
  document.getElementById('grid').style.display = 'none';
  ['monetizeDetail','publicDetail','eduDetail'].forEach(id=>document.getElementById(id)?.classList.add('hide'));
  document.getElementById('transDetail').classList.remove('hide');
  document.getElementById('tr-out').value = '';
  document.getElementById('tr-status').textContent = '';
}

function closeTrans(){
  document.getElementById('transDetail').classList.add('hide');
  document.querySelector('.hero').style.display = '';
  document.getElementById('grid').style.display = '';
  trState = { groupId:null, subId:null };
}

function _getTrSub(){
  if(!trState.groupId || !trState.subId) return null;
  return (TRANS_SUBS[trState.groupId]||[]).find(s => s.id === trState.subId);
}

async function generateTrans(){
  const sub = _getTrSub();
  if (!sub) { alert('세부 유형을 먼저 선택하세요.'); return; }
  const source  = document.getElementById('tr-source').value.trim();
  if (!source) { alert('원문을 입력해주세요.'); return; }

  const from    = document.getElementById('tr-from').value;
  const to      = document.getElementById('tr-to').value;
  const mode    = document.getElementById('tr-mode').value;
  const context = document.getElementById('tr-context').value.trim();
  const avoid   = document.getElementById('tr-avoid').value.trim();
  const meta    = TRANS_META[trState.groupId];
  const isSubtitle = sub.type === 'subtitle' || meta.subtitle;

  const fromLabel = LANG_LABEL_FULL[from] || from;
  const toLangs = to.split('+'); // ['ko','ja','en'] 등
  const toLabels = toLangs.map(l => LANG_LABEL_FULL[l] || l).join(', ');

  // 문화 특화
  let cultureExtra = '';
  if (meta.culture && document.getElementById('tr-culture-box').style.display !== 'none') {
    cultureExtra = '\n[문화 특화]\n분야: '+document.getElementById('tr-culture-type').value+'\n연령대: '+document.getElementById('tr-culture-age').value;
  }

  // 자막 특화
  let subtitleInstruct = '';
  let subtitleOpts = null;
  if (isSubtitle) {
    const dur = parseInt(document.getElementById('tr-sub-duration').value) || 60;
    const cps = parseInt(document.getElementById('tr-sub-cps').value) || 16;
    const linesec = parseFloat(document.getElementById('tr-sub-linesec').value) || 3;
    subtitleOpts = { dur, cps, linesec };
    subtitleInstruct = '\n[자막(.srt) 출력 규칙]\n'+
      '- 총 재생 시간 '+dur+'초에 맞춰 원문을 번역하고 자막으로 분할\n'+
      '- 각 줄 최대 '+cps+'자, 표시 시간 약 '+linesec+'초\n'+
      '- .srt 포맷으로만 출력: 순번 → 타임코드(00:00:00,000 --> 00:00:00,000) → 자막 내용 → 빈 줄\n'+
      '- 타임코드는 누적해서 계산';
  }

  const system =
    '당신은 전문 번역가 · 통역사다.\n' +
    '출발어: ' + fromLabel + '\n' +
    '도착어: ' + toLabels + (toLangs.length>1 ? ' (각 언어 블록으로 구분 출력)' : '') + '\n' +
    '번역 유형: ' + sub.name + '\n' +
    '번역 규칙: ' + sub.prompt + '\n' +
    '톤 모드: ' + MODE_LABEL[mode] + ' — ' + MODE_INSTRUCT[mode] + '\n' +
    (context ? '상황 컨텍스트: ' + context + '\n' : '') +
    (avoid   ? '피해야 할 표현: ' + avoid + '\n' : '') +
    cultureExtra +
    subtitleInstruct +
    '\n원문 의미와 뉘앙스를 살리되, 타깃 언어·문화에 자연스럽게.';

  const user = '원문:\n' + source + (toLangs.length>1 ? '\n\n위 원문을 ' + toLabels + ' 각각으로 번역. 언어별로 "=== [언어명] ===" 헤더 구분.' : '');

  const btn = document.getElementById('tr-gen');
  const out = document.getElementById('tr-out');
  const status = document.getElementById('tr-status');
  btn.disabled = true; btn.textContent = '⏳ 번역 중...';
  status.textContent = fromLabel + ' → ' + toLabels + ' 번역 중...';
  out.value = '';

  try {
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
    {const v=localStorage.getItem('uc_openai_key'); if(v) APIAdapter.setApiKey('openai',v);}
    {const v=localStorage.getItem('uc_gemini_key'); if(v) APIAdapter.setApiKey('gemini',v);}

    const maxTok = isSubtitle ? 5000 : 4000;
    const result = await APIAdapter.callWithFallback(system, user, { maxTokens: maxTok });
    out.value = result;
    document.getElementById('tr-dl-srt').style.display = isSubtitle ? '' : 'none';
    status.textContent = '✅ 번역 완료 · ' + MODE_LABEL[mode] + (isSubtitle ? ' · .srt 다운로드 가능' : '');
  } catch (err) {
    out.value = '❌ 오류: ' + err.message;
    status.textContent = '❌ ' + err.message;
  } finally {
    btn.disabled = false; btn.textContent = '✨ AI 번역 실행';
  }
}

function trCopy(){
  const t = document.getElementById('tr-out').value;
  if (!t) { alert('복사할 내용이 없습니다.'); return; }
  navigator.clipboard.writeText(t).then(()=>{
    document.getElementById('tr-status').textContent = '📋 클립보드에 복사되었습니다.';
  });
}
function trSave(){
  const t = document.getElementById('tr-out').value;
  if (!t) { alert('저장할 내용이 없습니다.'); return; }
  const sub = _getTrSub();
  const list = JSON.parse(localStorage.getItem('uc_trans_saved')||'[]');
  list.unshift({
    at: Date.now(),
    from: document.getElementById('tr-from').value,
    to:   document.getElementById('tr-to').value,
    mode: document.getElementById('tr-mode').value,
    group: trState.groupId, sub: sub?.id, subName: sub?.name,
    source: document.getElementById('tr-source').value,
    body: t
  });
  localStorage.setItem('uc_trans_saved', JSON.stringify(list.slice(0,50)));
  document.getElementById('tr-status').textContent = '💾 저장됨 (localStorage · 최근 50개 유지)';
}
function trSendToMedia(){
  const t = document.getElementById('tr-out').value;
  if (!t) { alert('먼저 번역을 실행해주세요.'); return; }
  const list = JSON.parse(localStorage.getItem('hub_scripts_v1')||'[]');
  const sub = _getTrSub();
  const to = document.getElementById('tr-to').value;
  const lang = to.split('+')[0];
  list.unshift({ source:'trans', lang, text:t, at:Date.now(), meta:{group:trState.groupId, sub:sub?.id, from:document.getElementById('tr-from').value, to} });
  localStorage.setItem('hub_scripts_v1', JSON.stringify(list.slice(0,30)));
  if (confirm('🎬 미디어 엔진으로 전송했습니다.\n\n음성·자막 연결을 위해 미디어 엔진으로 이동할까요?')) {
    location.href = 'engines/media/index.html?tab=oneclick';
  }
}
function trGoEdu(){
  // 학습 카테고리로 전환
  state.category = 'edu';
  renderAll();
  document.getElementById('transDetail').classList.add('hide');
  document.querySelector('.hero').style.display = '';
  document.getElementById('grid').style.display = '';
  document.querySelector('.card .cardhead')?.scrollIntoView({behavior:'smooth'});
}
function trDownloadSrt(){
  const t = document.getElementById('tr-out').value;
  if (!t) { alert('먼저 번역을 실행해주세요.'); return; }
  const blob = new Blob([t], {type:'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'translated_' + Date.now() + '.srt';
  a.click();
  URL.revokeObjectURL(a.href);
  document.getElementById('tr-status').textContent = '💾 .srt 파일 다운로드 완료';
}

/* ═══════════════════════════════════════════════
   🏪 소상공인 패키지 — 15 그룹 · 업종·다국어·지원금·월간캘린더
   =============================================== */
const SMB_META = {
  restaurant:{ico:'🍽️',title:'외식업 특화',      industry:'restaurant'},
  store:     {ico:'🏪',title:'매장 운영'},
  ads:       {ico:'📢',title:'광고/마케팅'},
  sns:       {ico:'📱',title:'SNS 운영'},
  online:    {ico:'🛒',title:'온라인 판매'},
  cs:        {ico:'💬',title:'고객 응대'},
  event:     {ico:'🎉',title:'이벤트/프로모션'},
  docs:      {ico:'📋',title:'사업 문서'},
  tax:       {ico:'💰',title:'세무/회계 도우미'},
  digital:   {ico:'🖥️',title:'디지털 전환 도우미'},
  strategy:  {ico:'📊',title:'경영 전략'},
  hr:        {ico:'👔',title:'직원 관리'},
  foreign:   {ico:'🌏',title:'외국인 고객/해외진출'},
  industry:  {ico:'🏢',title:'업종별 특화'},
  auto:      {ico:'🤖',title:'자동화 패키지'}
};

const SMB_SUBS = {
  restaurant:[
    {id:'menu-multi',  name:'다국어 메뉴판',      hint:'한/영/일/중', type:'menu', prompt:'다국어 메뉴판(한/영/일/중). 메뉴명·설명·가격·알레르기·원산지 포함.'},
    {id:'delivery-opt',name:'배달앱 최적화',       hint:'배민·쿠팡이츠·요기요', prompt:'배달앱 상품 설명 최적화. 상호·대표메뉴·세트·할인·사진 가이드.'},
    {id:'food-desc',   name:'음식 설명 문구',      hint:'세일즈 카피',   prompt:'음식 설명 문구. 재료·조리·맛·시그니처 포인트.'},
    {id:'special',     name:'오늘의 특선·계절메뉴',hint:'특선 안내',     prompt:'오늘의 특선·계절 메뉴 안내. 추천 이유·사용 재료·한정 수량.'},
    {id:'allergy',     name:'알레르기 안내',       hint:'표기 규정',     prompt:'알레르기 표시 안내. 알레르기 유발 식품 22종 체크리스트 + 표기 문구.'},
    {id:'hygiene',     name:'위생·청결 안내',      hint:'고객 안심',     prompt:'위생·청결 안내문. 조리/배달/포장 단계별 위생 관리 포인트.'},
    {id:'reservation', name:'예약 안내',           hint:'전화·앱',       prompt:'예약 안내. 가능 인원·시간·보증금·취소 규정.'},
    {id:'origin',      name:'원산지 표기문',       hint:'법적 필수',     prompt:'원산지 표기문 양식. 농수산물 원산지 표시법 기준.'}
  ],
  store:[
    {id:'intro',     name:'매장 소개문',        hint:'간판·홈페이지',  prompt:'매장 소개문. 브랜드 가치·역사·주요 메뉴·고객 경험.'},
    {id:'hours',     name:'영업시간·휴무 안내', hint:'공지',            prompt:'영업시간·휴무 안내. 요일별 시간·휴무일·명절 운영.'},
    {id:'rules',     name:'이용안내·규칙',       hint:'고객 안내',      prompt:'매장 이용안내·규칙. 좌석 이용·반려동물·외부음식·흡연.'},
    {id:'coupon',    name:'할인 쿠폰 문구',      hint:'마케팅',          prompt:'할인 쿠폰 문구. 쿠폰명·할인율·사용 조건·유효기간.'},
    {id:'packaging', name:'포장·배달 안내',      hint:'서비스',          prompt:'포장·배달 안내. 포장 옵션·배달 지역·소요시간·최소주문.'},
    {id:'location',  name:'위치 안내문',         hint:'찾아오는 길',     prompt:'위치 안내문. 주소·대중교통·주차·근처 랜드마크.'}
  ],
  ads:[
    {id:'flyer',       name:'전단지/포스터 문구',hint:'오프라인',        prompt:'전단지/포스터 문구. 메인 카피·서브·혜택·CTA·연락처.'},
    {id:'banner',      name:'현수막/배너 카피',  hint:'짧고 강하게',     prompt:'현수막/배너 카피. 7~14자 메인 + 보조 문구 3안.'},
    {id:'local-news',  name:'지역신문 광고',      hint:'신뢰 중심',       prompt:'지역신문 광고 문안. 정보 밀도·지역 친화·문의처.'},
    {id:'danggeun',    name:'당근마켓 광고문',    hint:'동네 친근',       prompt:'당근마켓 동네홍보 광고문. 친근한 구어체·구체적 혜택·근처 랜드마크.'},
    {id:'naver-place', name:'네이버플레이스 최적화',hint:'SEO',          prompt:'네이버플레이스 상세 페이지 최적화. 업체명·대표메뉴·소개·키워드·사진 설명.'},
    {id:'google-biz',  name:'구글 비즈니스',      hint:'영문 가능',       prompt:'구글 비즈니스 프로필 최적화. 설명·서비스·FAQ·게시물 예시.'},
    {id:'copy',        name:'광고 카피라이팅',    hint:'짧·중·긺',        prompt:'광고 카피 3안(짧은/중간/긴). 후킹·혜택·CTA 구조.'},
    {id:'season-ads',  name:'시즌별 이벤트 광고',hint:'봄·여름·가을·겨울·명절', prompt:'시즌·명절 이벤트 광고. 시즌 분위기·특별 혜택·한정 기간.'}
  ],
  sns:[
    {id:'ig-set',  name:'인스타그램 세트',    hint:'캡션·스토리·릴스·태그', prompt:'인스타그램 세트: 캡션 3안 + 스토리 문구 + 릴스 스크립트 + 해시태그 15개.'},
    {id:'naver-b', name:'네이버 블로그',      hint:'맛집리뷰·SEO',         prompt:'네이버 블로그 포스팅. 제목 SEO·본문 1,500자·사진 삽입 포인트·태그.'},
    {id:'kakao-ch',name:'카카오채널',         hint:'단골·이벤트·쿠폰',    prompt:'카카오채널 메시지. 인사·혜택·CTA 3종 세트.'},
    {id:'yt-tiktok',name:'유튜브/틱톡 대본',  hint:'매장·요리·브이로그',   prompt:'유튜브/틱톡 30~60초 대본. 훅·본문·CTA 타임스탬프 표기.'},
    {id:'facebook',name:'페이스북 지역 홍보', hint:'지역 타깃',            prompt:'페이스북 게시물. 지역 타깃 광고용·공감 포인트·CTA.'},
    {id:'cal-monthly',name:'월간 SNS 캘린더', hint:'한 달 자동생성', type:'calendar', prompt:'한 달치 SNS 콘텐츠 캘린더 자동 생성. 각 날짜별 주제·카피·해시태그·플랫폼 배분.'}
  ],
  online:[
    {id:'smart-store', name:'스마트스토어 최적화',hint:'상품명·설명·키워드·태그', prompt:'스마트스토어 상품 등록 최적화. 제목·상세설명·검색 키워드·태그 10개.'},
    {id:'platforms',   name:'쿠팡/지마켓/11번가',hint:'플랫폼별',          prompt:'쿠팡/지마켓/11번가 각 플랫폼 상품 등록 최적화(3개 플랫폼 병기).'},
    {id:'amazon-raku', name:'아마존/라쿠텐',     hint:'영·일 번역',         prompt:'아마존(영어)·라쿠텐(일본어) 해외 판매용 상품 설명. 각 플랫폼 관행 반영.'},
    {id:'kmong',       name:'크몽/숨고 서비스 소개',hint:'재능마켓',       prompt:'크몽/숨고 서비스 상품 소개. 포트폴리오·차별점·고객 후기 구조.'},
    {id:'kakao-gift',  name:'카카오 선물하기',   hint:'선물 특화',          prompt:'카카오 선물하기 상품 문구. 받는 사람 감성·선물 가치·받는 후기.'}
  ],
  cs:[
    {id:'review-auto',name:'리뷰 답글',       hint:'좋은·보통·나쁜·악성', type:'cs', prompt:'리뷰 답글 답변. 유형별(좋은/보통/나쁜/악성) 답글 패턴 + 톤 조절.'},
    {id:'claim',      name:'클레임/분쟁 대응',hint:'환불·품질·배달·법적', type:'cs', prompt:'클레임 유형별(환불거절·품질·배달사고·법적 대응) 공식 답변 초안.'},
    {id:'reservation-r',name:'예약 문의 답변',hint:'FAQ 패턴',           prompt:'예약 문의 답변 패턴 10종. 가능·불가·변경·취소·인원 문의.'},
    {id:'vip',        name:'VIP·단골 관리 문자',hint:'장기 고객',         prompt:'VIP·단골 관리 문자 메시지. 생일·감사·신메뉴·특별 혜택.'},
    {id:'apology',    name:'배달 지연 사과문', hint:'위기 대응',           prompt:'배달 지연·품절 사과문. 공감·사실·보상·재발 방지.'}
  ],
  event:[
    {id:'open',     name:'개업/리뉴얼 이벤트', hint:'신규',          prompt:'개업/리뉴얼 이벤트. 오픈 할인·증정·이벤트 포스터 문구·SNS 공지.'},
    {id:'holiday',  name:'기념일/시즌 이벤트', hint:'발렌타인·빼빼로·크리스마스', prompt:'기념일·시즌 이벤트. 시즌 감성·커플/가족/친구 타깃·SNS 인증 유도.'},
    {id:'sns-share',name:'SNS 공유 이벤트',    hint:'바이럴',         prompt:'SNS 공유 이벤트 기획. 참여 방법·혜택·기간·당첨자 발표.'},
    {id:'review-ev',name:'리뷰 이벤트',        hint:'후기 유도',       prompt:'리뷰 이벤트. 작성 조건·혜택·기간·주의사항.'},
    {id:'stamp',    name:'포인트/스탬프 안내', hint:'재방문',         prompt:'포인트·스탬프 안내. 적립·사용·유효기간·특별 혜택.'},
    {id:'local-fest',name:'지역 축제 연계',    hint:'지역 상권',       prompt:'지역 축제 연계 이벤트. 축제 기간 한정 메뉴·할인·방문 유도.'}
  ],
  docs:[
    {id:'biz-plan',    name:'창업 사업계획서',   hint:'투자·지원금',  prompt:'창업 사업계획서. 사업 개요·시장분석·경쟁분석·수익모델·재무·일정.'},
    {id:'support-fund',name:'소상공인 지원금 신청서',hint:'자동완성 마법사', type:'fund', prompt:'지원금 신청서 자동완성. 사업자 정보·신청 사유·자금 사용 계획·기대 효과를 심사 관점에서 작성.'},
    {id:'franchise',   name:'프랜차이즈 계약 검토',hint:'주의 조항',   prompt:'프랜차이즈 계약서 검토 포인트. 로열티·위약금·독점권·영업지역·분쟁해결 조항 점검표.'},
    {id:'rental',      name:'임대차 계약',        hint:'권리금·협상',  prompt:'임대차 계약 검토 포인트·권리금 협상 전략·분쟁 발생 시 대응.'},
    {id:'hire',        name:'직원 채용공고',      hint:'구인구직',      prompt:'직원 채용공고. 업무·조건·급여·근무시간·지원 방법.'},
    {id:'labor-contract',name:'근로계약서 초안',  hint:'법적 필수',     prompt:'근로계약서 표준 초안. 필수 기재사항·시간·급여·휴일·해지 조항.'},
    {id:'four-ins',    name:'4대보험 안내',        hint:'직원용',        prompt:'4대보험 안내문. 종류·가입 기준·보험료·신고 방법.'},
    {id:'close',       name:'폐업/양도 안내문',    hint:'마무리',        prompt:'폐업/양도 안내문. 고객·거래처 대상 공지 + 양도 조건 안내.'}
  ],
  tax:[
    {id:'revenue',   name:'매출·지출 정리 템플릿', hint:'월별 양식',     prompt:'매출·지출 정리 템플릿. 월별·카테고리별 항목 + 가이드.'},
    {id:'vat',       name:'부가세 신고 준비',      hint:'체크리스트',    prompt:'부가세 신고 전 체크리스트. 필요 서류·마감일·주의사항.'},
    {id:'tax-doc',   name:'세금계산서/현금영수증',hint:'발행 규칙',     prompt:'세금계산서·현금영수증 발행·수취 가이드. 의무 발행·기한·오류 정정.'},
    {id:'saving',    name:'소득세 절세 팁',        hint:'경비 처리',     prompt:'소득세 절세 팁. 경비 처리 가능 항목·증빙·주의사항.'},
    {id:'cpa-prep',  name:'세무사 상담 준비 문서', hint:'상담 전',       prompt:'세무사 상담 전 정리 문서. 사업 현황·세무 이슈·질문 리스트.'}
  ],
  digital:[
    {id:'delivery-start',name:'배달 시작 가이드',    hint:'앱·메뉴·포장', prompt:'배달 시작 가이드. 배달앱 등록·메뉴 구성·포장 안내·수수료 계산.'},
    {id:'smart-start',   name:'스마트스토어 시작',    hint:'셀러 온보딩',   prompt:'스마트스토어 시작 가이드. 가입·상품 등록·광고·고객 관리 30일 로드맵.'},
    {id:'sns-start',     name:'SNS 시작 가이드',      hint:'계정·첫 30일', prompt:'SNS(인스타·블로그) 시작 가이드. 계정 최적화 + 첫 30일 운영 계획.'},
    {id:'reservation-sys',name:'예약 시스템 도입',   hint:'캐치테이블·네이버', prompt:'예약 시스템 도입 가이드. 플랫폼 비교·수수료·설정·운영 팁.'},
    {id:'kiosk-pos',     name:'키오스크/포스 도입',  hint:'기기 선택',     prompt:'키오스크·포스 도입 안내. 기기 비교·설치·직원 교육·고객 안내.'}
  ],
  strategy:[
    {id:'competitor', name:'경쟁사 분석 보고서',   hint:'주변 상권',     prompt:'경쟁사 분석 보고서. 주변 3~5개 경쟁사 비교·차별화 전략·실행 방안.'},
    {id:'pricing',    name:'가격 전략 수립',        hint:'원가·가격',     prompt:'가격 전략. 원가 계산·적정 가격·가격 인상 안내문·고객 설명.'},
    {id:'sales',      name:'매출·상권 분석',        hint:'현황 진단',     prompt:'매출·상권 분석 보고서. 요일·시간·메뉴별 매출 + 상권 특성.'},
    {id:'season',     name:'성수기·비수기 전략',    hint:'시즌 대응',     prompt:'성수기·비수기 전략. 각 시즌별 매출 극대화·비용 절감 방안.'},
    {id:'crisis-close',name:'폐업 위기 대응',        hint:'비용·재기',     prompt:'폐업 위기 대응 전략. 비용 절감·재기 방안·업종 전환 검토.'}
  ],
  hr:[
    {id:'manual', name:'직원 교육 매뉴얼', hint:'서비스·위생',     prompt:'직원 교육 매뉴얼. 서비스·위생·매장 규칙·긴급 대응.'},
    {id:'part',   name:'알바 채용공고·면접',hint:'구인·면접',      prompt:'알바 채용공고 + 면접 질문 리스트 15개 + 평가 포인트.'},
    {id:'praise', name:'직원 칭찬·격려 문구',hint:'동기부여',       prompt:'직원 칭찬·격려 문구 20개. 상황별·개인별.'},
    {id:'order',  name:'업무 지시서',       hint:'명확 지시',       prompt:'업무 지시서 양식. 목표·일정·방법·확인 포인트.'},
    {id:'leave',  name:'퇴직·해고 관련 안내',hint:'공식 절차',      prompt:'퇴직·해고 관련 안내문. 사유·절차·퇴직금·4대보험 상실.'}
  ],
  foreign:[
    {id:'menu-4lang',name:'다국어 메뉴판(한/영/일/중)',hint:'원클릭 변환', type:'menu', prompt:'4개국어 메뉴판. 메뉴명·설명·가격·알레르기·원산지 각 언어 블록 병기.'},
    {id:'tourist',   name:'관광객 안내문',          hint:'영/일/중',      prompt:'관광객 안내문. 이용법·결제·영수증·면세 안내.'},
    {id:'duty-free', name:'면세·환급 안내',         hint:'텍스리펀드',    prompt:'면세·텍스리펀드 안내. 대상·방법·필요 서류.'},
    {id:'foreign-cs',name:'외국어 고객 응대 스크립트',hint:'상황별',       prompt:'외국어 고객 응대 스크립트. 인사·주문·결제·문제 상황.'},
    {id:'jp-tourist',name:'일본 관광객 유치 전략',  hint:'인바운드',      prompt:'일본 관광객 유치 전략. 일본어 SNS 운영·일본 여행앱 등록·일본인 선호 서비스.'},
    {id:'export',    name:'해외직구 판매 시작',      hint:'수출',          prompt:'해외직구·수출 판매 시작 가이드. 플랫폼·배송·관세.'},
    {id:'inbound',   name:'인바운드 마케팅',          hint:'외국인 고객',  prompt:'인바운드 마케팅 전략. 채널·콘텐츠·SEO·현지 커뮤니티.'}
  ],
  industry:[
    {id:'beauty',    name:'미용실/네일/피부',      hint:'시술·예약·전후', prompt:'미용/네일/피부 업종 콘텐츠. 시술 메뉴·예약 안내·인스타용 캡션·전후 사진 설명.'},
    {id:'cafe',      name:'카페/베이커리',         hint:'음료·디저트·시즌',prompt:'카페/베이커리 콘텐츠. 음료·디저트 설명·원두 소개·시즌 메뉴.'},
    {id:'shop-cloth',name:'쇼핑몰/의류',           hint:'상품·코디·사이즈', prompt:'쇼핑몰·의류 콘텐츠. 상품 설명·코디 제안·사이즈 안내·반품 규정.'},
    {id:'academy',   name:'학원/교습소',           hint:'모집·커리큘럼·후기', prompt:'학원/교습소 콘텐츠. 모집 광고·커리큘럼·성과 후기·상담 안내.'},
    {id:'clinic',    name:'병원/의원/약국',        hint:'진료·건강정보',   prompt:'병원/의원/약국 콘텐츠. 진료 소개·건강 정보·예약 안내.'},
    {id:'realestate',name:'부동산',                hint:'매물·지역·임대',  prompt:'부동산 콘텐츠. 매물 설명·지역 소개·임대·중개 안내.'},
    {id:'interior',  name:'인테리어/시공',         hint:'포트폴리오·견적', prompt:'인테리어/시공 콘텐츠. 포트폴리오·시공 과정·견적 안내.'},
    {id:'pet',       name:'펫샵/동물병원',         hint:'케어·상품',       prompt:'펫샵/동물병원 콘텐츠. 반려동물 케어·상품 설명·예약 안내.'},
    {id:'fitness',   name:'헬스/요가/필라테스',    hint:'프로그램·PT',     prompt:'헬스/요가/필라테스 콘텐츠. 프로그램 소개·등록 안내·PT 문구.'},
    {id:'mart',      name:'편의점/마트',           hint:'행사·신상',       prompt:'편의점/마트 콘텐츠. 행사 안내·신상품 소개·쿠폰.'},
    {id:'lodging',   name:'숙박/게스트하우스',     hint:'객실·지역',       prompt:'숙박/게스트하우스 콘텐츠. 객실 소개·지역 안내·예약 정책.'}
  ],
  auto:[
    {id:'sns-calendar',name:'월간 SNS 자동 캘린더',hint:'한 달치', type:'calendar', prompt:'한 달치 SNS 콘텐츠 자동 생성. 각 날짜별 주제·카피·해시태그·플랫폼 배분.'},
    {id:'review-auto', name:'자동 리뷰 답글 시스템',hint:'유형별', type:'cs', prompt:'리뷰 유형별 자동 답글 템플릿 12종(좋은·보통·나쁜·악성 × 3 업종 톤).'},
    {id:'event-auto',  name:'정기 이벤트 자동생성', hint:'연간',                prompt:'정기 이벤트 연간 캘린더. 월별·시즌별 이벤트 12개 + 카피.'},
    {id:'sequence',    name:'고객 문자 시퀀스',      hint:'첫방문·재방문·VIP', prompt:'고객 단계별 문자 시퀀스(첫방문→재방문→단골→VIP). 각 단계별 3~5통.'},
    {id:'season-auto', name:'계절별 마케팅 자동화',  hint:'봄·여름·가을·겨울',  prompt:'계절별 마케팅 자동 패키지. 계절별 메뉴·이벤트·카피·SNS·포스터.'},
    {id:'competitor-mon',name:'경쟁사 모니터링 보고서',hint:'주간/월간',        prompt:'경쟁사 모니터링 보고서 양식. 체크 항목·기록·시사점 정리.'}
  ]
};

const INDUSTRY_LABEL = {
  restaurant:'외식업',cafe:'카페/베이커리',beauty:'미용/네일/피부',shop:'쇼핑몰/의류',
  academy:'학원/교습소',clinic:'병원/의원/약국',realestate:'부동산',interior:'인테리어/시공',
  pet:'펫샵/동물병원',fitness:'헬스/요가/필라테스',mart:'편의점/마트',lodging:'숙박/게스트하우스',etc:'기타'
};

let smState = { groupId:null, subId:null };

function openSmb(card){
  smState.groupId = card.smbId;
  smState.subId = null;
  const meta = SMB_META[card.smbId];
  document.getElementById('sm-ico').textContent   = meta.ico;
  document.getElementById('sm-title').textContent = meta.title;
  document.getElementById('sm-desc').textContent  = '업종·언어·세부 유형을 선택한 뒤 입력하세요.';

  // 그룹 기본 업종 적용
  if (meta.industry) document.getElementById('sm-industry').value = meta.industry;

  // 서브 렌더
  const subBox = document.getElementById('sm-subs');
  subBox.innerHTML = '';
  (SMB_SUBS[card.smbId]||[]).forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'mz-sub-btn';
    btn.innerHTML = s.name + '<small>' + s.hint + '</small>';
    btn.onclick = () => {
      smState.subId = s.id;
      subBox.querySelectorAll('.mz-sub-btn').forEach(x=>x.classList.remove('on'));
      btn.classList.add('on');
      toggleSmFields(s.type);
    };
    subBox.appendChild(btn);
  });
  const first = (SMB_SUBS[card.smbId]||[])[0];
  if (first) {
    smState.subId = first.id;
    subBox.querySelector('.mz-sub-btn')?.classList.add('on');
    toggleSmFields(first.type);
  }

  // 업종 변경 시 서브 필터링(업종별 특화 그룹일 때만 자동 이동)
  document.getElementById('sm-industry').onchange = function(){
    if (smState.groupId === 'industry') {
      const match = (SMB_SUBS.industry||[]).find(s => s.id === this.value);
      if (match) {
        smState.subId = match.id;
        subBox.querySelectorAll('.mz-sub-btn').forEach((b,i)=>{
          b.classList.toggle('on', (SMB_SUBS.industry[i]||{}).id === match.id);
        });
      }
    }
  };

  // 뷰 전환
  document.querySelector('.hero').style.display = 'none';
  document.getElementById('grid').style.display = 'none';
  ['monetizeDetail','publicDetail','eduDetail','transDetail'].forEach(id=>document.getElementById(id)?.classList.add('hide'));
  document.getElementById('smbDetail').classList.remove('hide');
  document.getElementById('sm-out').value = '';
  document.getElementById('sm-status').textContent = '';
}

function closeSmb(){
  document.getElementById('smbDetail').classList.add('hide');
  document.querySelector('.hero').style.display = '';
  document.getElementById('grid').style.display = '';
  smState = { groupId:null, subId:null };
}

function toggleSmFields(type){
  ['fund','calendar','menu','cs'].forEach(t => {
    const el = document.getElementById('sm-'+t+'-box');
    if (el) el.style.display = (type === t) ? '' : 'none';
  });
}

function _getSmSub(){
  if(!smState.groupId || !smState.subId) return null;
  return (SMB_SUBS[smState.groupId]||[]).find(s => s.id === smState.subId);
}

async function generateSmb(){
  const sub = _getSmSub();
  if (!sub) { alert('세부 유형을 먼저 선택하세요.'); return; }
  const topic    = document.getElementById('sm-topic').value.trim();
  if (!topic && sub.type !== 'fund') { alert('주제/상호/품목을 입력해주세요.'); return; }

  const industry = document.getElementById('sm-industry').value;
  const lang     = document.getElementById('sm-lang').value;
  const length   = document.getElementById('sm-length').value;
  const target   = document.getElementById('sm-target').value.trim();
  const keywords = document.getElementById('sm-keywords').value.trim();
  const avoid    = document.getElementById('sm-avoid').value.trim();

  // 특화 입력 조립
  let extra = '';
  if (sub.type === 'fund') {
    extra = '\n[지원금 신청서 입력]\n'+
      '지원금 종류: '+document.getElementById('sm-fund-type').value+'\n'+
      '업력: '+document.getElementById('sm-fund-years').value+'\n'+
      '신청 사유: '+document.getElementById('sm-fund-reason').value+'\n'+
      '※ 심사위원 관점에서 설득력 있게. 필수 항목: 사업자 정보, 신청 사유, 자금 사용 계획, 기대 효과, 상환 계획(해당 시).';
  }
  if (sub.type === 'calendar') {
    extra = '\n[월간 SNS 캘린더 입력]\n'+
      '플랫폼: '+document.getElementById('sm-cal-platform').value+'\n'+
      '빈도: '+document.getElementById('sm-cal-freq').value+'\n'+
      '시즌/이벤트: '+document.getElementById('sm-cal-season').value+'\n'+
      '※ 날짜별 표 형식으로 출력: 날짜 | 플랫폼 | 주제 | 본문(또는 카피) | 해시태그.';
  }
  if (sub.type === 'menu') {
    extra = '\n[다국어 메뉴판 입력]\n'+document.getElementById('sm-menu-list').value+
      '\n※ 각 메뉴를 한/영/일/중 4개국어 블록으로 병기 + 알레르기·원산지 표기.';
  }
  if (sub.type === 'cs') {
    extra = '\n[고객 응대 입력]\n'+
      '원문: '+document.getElementById('sm-cs-original').value+'\n'+
      '답변 유형: '+document.getElementById('sm-cs-type').value+'\n'+
      '답변 톤: '+document.getElementById('sm-cs-tone').value;
  }

  // 언어 지시
  const langList = {
    'ko':    [['ko','한국어','반드시 한국어로만 작성.']],
    'ko+en': [['ko','한국어','한국어로만'],['en','English','Write in English only.']],
    'ko+ja': [['ko','한국어','한국어로만'],['ja','日本語','必ず日本語のみで。']],
    'ko+zh': [['ko','한국어','한국어로만'],['zh','中文','请用中文回答。']],
    'all4':  [['ko','한국어','한국어로만'],['en','English','English only.'],['ja','日本語','日本語のみ。'],['zh','中文','中文。']]
  }[lang];

  const baseSystem =
    '당신은 소상공인 전문 마케팅·문서 작가다.\n' +
    '업종: ' + INDUSTRY_LABEL[industry] + '\n' +
    '콘텐츠 유형: ' + sub.name + '\n' +
    '규칙: ' + sub.prompt + '\n' +
    '길이: ' + {short:'500자 내외',mid:'1,500자 내외',long:'3,000자 내외',xl:'5,000자 이상'}[length] + '\n' +
    (target   ? '타깃 고객: ' + target + '\n' : '') +
    (keywords ? '핵심 정보: ' + keywords + '\n' : '') +
    (avoid    ? '피해야 할 표현: ' + avoid + '\n' : '') +
    '허구의 수치·법적 내용을 사실처럼 단정하지 말 것.';
  const user = '주제/상호/품목: ' + (topic||'(입력 없음)') + extra;

  const btn = document.getElementById('sm-gen');
  const out = document.getElementById('sm-out');
  const status = document.getElementById('sm-status');
  btn.disabled = true; btn.textContent = '⏳ 생성 중...';
  status.textContent = '생성 중... (' + (langList.length>1 ? langList.length+'개 언어' : '한국어') + ')';
  out.value = '';

  try {
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
    {const v=localStorage.getItem('uc_openai_key'); if(v) APIAdapter.setApiKey('openai',v);}
    {const v=localStorage.getItem('uc_gemini_key'); if(v) APIAdapter.setApiKey('gemini',v);}

    const maxTok = {short:1500, mid:3000, long:5000, xl:7000}[length];
    const tasks = langList.map(([code, label, inst]) =>
      APIAdapter.callWithFallback(baseSystem + '\n[언어 지시] ' + inst, user, { maxTokens: maxTok })
        .then(r => ({code, label, text:r}))
        .catch(e => ({code, label, text:'❌ '+e.message}))
    );
    const results = await Promise.all(tasks);
    out.value = results.map(r => '━━━━━━━━━━ ' + r.label + ' ━━━━━━━━━━\n' + r.text).join('\n\n');
    status.textContent = '✅ 생성 완료 (' + INDUSTRY_LABEL[industry] + ' · ' + results.length + '개 언어)';
  } catch (err) {
    out.value = '❌ 오류: ' + err.message;
    status.textContent = '❌ ' + err.message;
  } finally {
    btn.disabled = false; btn.textContent = '✨ AI로 생성';
  }
}

function smCopy(){
  const t = document.getElementById('sm-out').value;
  if (!t) { alert('복사할 내용이 없습니다.'); return; }
  navigator.clipboard.writeText(t).then(()=>{
    document.getElementById('sm-status').textContent = '📋 클립보드에 복사되었습니다.';
  });
}
function smSave(){
  const t = document.getElementById('sm-out').value;
  if (!t) { alert('저장할 내용이 없습니다.'); return; }
  const sub = _getSmSub();
  const list = JSON.parse(localStorage.getItem('uc_smb_saved')||'[]');
  list.unshift({
    at: Date.now(),
    industry: document.getElementById('sm-industry').value,
    lang:     document.getElementById('sm-lang').value,
    group: smState.groupId, sub: sub?.id, subName: sub?.name,
    topic: document.getElementById('sm-topic').value,
    body: t
  });
  localStorage.setItem('uc_smb_saved', JSON.stringify(list.slice(0,50)));
  document.getElementById('sm-status').textContent = '💾 저장됨 (localStorage · 최근 50개 유지)';
}
function smSendToMedia(){
  const t = document.getElementById('sm-out').value;
  if (!t) { alert('먼저 콘텐츠를 생성해주세요.'); return; }
  const list = JSON.parse(localStorage.getItem('hub_scripts_v1')||'[]');
  const sub = _getSmSub();
  list.unshift({ source:'smb', lang:'ko', text:t, at:Date.now(), meta:{group:smState.groupId, sub:sub?.id, industry:document.getElementById('sm-industry').value} });
  localStorage.setItem('hub_scripts_v1', JSON.stringify(list.slice(0,30)));
  if (confirm('🎬 미디어 엔진으로 전송했습니다.\n\n포스터·SNS 이미지를 생성하려면 미디어 엔진으로 이동하세요.\n지금 이동할까요?')) {
    location.href = 'engines/media/index.html?tab=image';
  }
}

/* ═══════════════════════════════════════════════
   🔮 심리/운세/사주 — 16 그룹 · 특화필드 · 시즌배너 · 프리미엄
   =============================================== */
const PSY_META = {
  mbti:     {ico:'🧠',title:'MBTI/성격 분석',    type:'mbti'},
  fortune:  {ico:'🔮',title:'운세/타로',         type:'birth'},
  saju:     {ico:'🀄',title:'사주/명리학',       type:'birth'},
  naming:   {ico:'✍️',title:'작명 서비스',       type:'naming'},
  love:     {ico:'💞',title:'궁합/연애',         type:'birth'},
  'career-p':{ico:'💼',title:'직업/진로/취업',  type:'birth'},
  wealth:   {ico:'💰',title:'재물/투자',         type:'birth'},
  'feng-shui':{ico:'🧭',title:'풍수/공간'},
  test:     {ico:'🧩',title:'심리 테스트'},
  healing:  {ico:'🌿',title:'힐링/상담'},
  pet:      {ico:'🐾',title:'반려동물 운세',     type:'subject'},
  child:    {ico:'👶',title:'육아/자녀 특화',    type:'subject'},
  health:   {ico:'🍎',title:'건강/체질 운세',    type:'birth'},
  season:   {ico:'🎊',title:'시즌/이벤트 특화',  type:'birth'},
  culture:  {ico:'🗺️',title:'한/일/영 특화'},
  premium:  {ico:'💎',title:'프리미엄 서비스',   type:'birth', premium:true}
};

const PSY_SUBS = {
  mbti:[
    {id:'detail',  name:'MBTI 상세 분석',      hint:'16유형',           type:'mbti', prompt:'MBTI 16유형 상세 분석. 장점·단점·성장 포인트·추천 활동.'},
    {id:'career-m',name:'직업 적성',           hint:'진로 추천',         type:'mbti', prompt:'MBTI 기반 직업 적성·추천 직업·피해야 할 업무 환경.'},
    {id:'love-m',  name:'연애/인간관계',       hint:'관계 스타일',       type:'mbti', prompt:'MBTI 연애 스타일·인간관계 패턴·갈등 해소법.'},
    {id:'combi',   name:'MBTI 궁합',            hint:'연인·친구·직장·가족', type:'mbti', prompt:'두 MBTI 궁합 분석. 관계별(연인/친구/직장/가족) 시너지·주의점·대화법.'},
    {id:'content-m',name:'MBTI 콘텐츠 생성',   hint:'유머·밈·추천',     type:'mbti', prompt:'MBTI별 유머·밈·추천 목록(영화/책/음식/취미).'},
    {id:'team',    name:'기업 팀 MBTI',         hint:'팀빌딩',            type:'mbti', prompt:'기업 팀 MBTI 조합. 팀원 구성·리더십·시너지·갈등 예방.'},
    {id:'growth',  name:'MBTI 성장 플랜',       hint:'진로·취업',         type:'mbti', prompt:'MBTI 성장 플랜·진로 취업 매칭·약점 보완 액션.'}
  ],
  fortune:[
    {id:'today',    name:'오늘의 운세',        hint:'종합·애정·금전·직업·건강', type:'birth', prompt:'오늘의 운세 5영역(종합·애정·금전·직업·건강). 한 줄 요약 + 상세.'},
    {id:'weekly',   name:'주간/월간/연간 운세',hint:'기간 운세',               type:'birth', prompt:'주간·월간·연간 운세. 기간별 핵심 흐름·주의할 날·기회의 날.'},
    {id:'new-year', name:'신년 특별 운세',     hint:'12간지·띠·별자리',         type:'birth', prompt:'신년 종합 운세(12간지·띠·별자리 통합). 월별 흐름·핵심 키워드.'},
    {id:'exam-luck',name:'시험·취업 합격 운세',hint:'수능·면접·시험',           type:'birth', prompt:'시험·취업 운세. 합격 가능성·면접 날·시험 당일 주의점.'},
    {id:'tarot',    name:'타로카드 해석',       hint:'1·3·10카드',              type:'tarot', prompt:'타로카드 리딩. 카드 이름·위치·의미·통합 해석·조언.'},
    {id:'star',     name:'별자리 운세',         hint:'12별자리·궁합',            prompt:'12별자리 운세·궁합·어센던트 영향.'},
    {id:'blood',    name:'혈액형 운세',         hint:'A·B·O·AB',                 prompt:'혈액형별 성격·궁합·직업 추천. 한·일 문화 관점 병기.'},
    {id:'numerology',name:'수비학',             hint:'인생수·럭키넘버',         type:'birth', prompt:'수비학. 생일·이름 기반 인생수·오늘의 럭키넘버.'}
  ],
  saju:[
    {id:'basic',    name:'기본 사주 분석',     hint:'사주팔자·용신·대운', type:'birth', prompt:'사주팔자·천간지지·용신·기신·대운·세운 기본 해석.'},
    {id:'match',    name:'사주 궁합',           hint:'연인·부부·사업',     type:'birth', prompt:'두 사주 궁합 분석. 관계별(연인/부부/사업파트너) 장단점·대응.'},
    {id:'sin-sal',  name:'신살 분석',           hint:'도화·역마·화개',     type:'birth', prompt:'신살 분석(도화살·역마살·화개살 등). 의미·영향·활용법.'},
    {id:'job-saju', name:'직업/진로/재물 사주',hint:'적성·재물',           type:'birth', prompt:'사주 기반 직업·진로·재물운. 추천 분야·조심할 시기.'},
    {id:'health-s', name:'건강운 사주',         hint:'체질별 조언',         type:'birth', prompt:'사주 기반 건강운·체질별 조언·주의 포인트.'},
    {id:'gilil',    name:'이사·결혼 길일',      hint:'택일',                type:'birth', prompt:'이사·결혼 길일 선택. 해당 기간 내 좋은 날 추천 + 피할 날.'},
    {id:'child-saju',name:'자녀 사주',          hint:'기질·양육',           type:'birth', prompt:'자녀 사주 분석. 기질·진로 방향·양육 포인트.'},
    {id:'family',   name:'가족 사주 통합',      hint:'가족 궁합',           type:'birth', prompt:'가족 구성원 사주 통합 분석. 가족 내 에너지 흐름·조화 방안.'}
  ],
  naming:[
    {id:'baby',    name:'아기 이름 짓기',        hint:'사주·획수·한일영',type:'naming', prompt:'아기 이름 5개 추천(사주 기반·한자 획수 고려·한/일/영 병기).'},
    {id:'brand',   name:'상호/브랜드명',         hint:'업종·풍수',        type:'naming', prompt:'상호/브랜드명 10개 추천. 업종별·풍수·도메인 가용성 고려.'},
    {id:'pen',     name:'예명/필명/닉네임',      hint:'감성·짧게',        type:'naming', prompt:'예명/필명/닉네임 10개. 콘셉트 맞춤·발음 좋게.'},
    {id:'pet-name',name:'반려동물 이름',         hint:'종류별·3언어',     type:'naming', prompt:'반려동물 이름 10개 추천(한/일/영 병기).'},
    {id:'char',    name:'캐릭터/브랜드 이름',   hint:'세계관',           type:'naming', prompt:'캐릭터·브랜드 이름 10개. 세계관·이미지 반영.'},
    {id:'yt-name', name:'유튜브 채널명',         hint:'SEO·3언어',        type:'naming', prompt:'유튜브 채널명 10개. 콘셉트 기반·SEO·한/일/영 병기.'},
    {id:'evaluate',name:'이름 감정',              hint:'획수·오행',        type:'naming', prompt:'이름 감정. 획수·음양오행·개명 필요 여부·보완 방법.'},
    {id:'corp',    name:'법인명/상호 변경',       hint:'변경 전략',        type:'naming', prompt:'법인명·상호 변경 작명. 변경 전략·법적 검토 포인트.'}
  ],
  love:[
    {id:'couple', name:'연인 궁합 종합',         hint:'MBTI+사주+별자리',type:'birth', prompt:'MBTI+사주+별자리 통합 궁합 분석.'},
    {id:'blind',  name:'소개팅 전 빠른 궁합',    hint:'즉석',             type:'birth', prompt:'소개팅 전 빠른 궁합 분석. 첫인상·대화 포인트·주의점.'},
    {id:'sseom',  name:'썸 단계 분석',           hint:'고백 타이밍',     type:'birth', prompt:'썸 단계 분석. 상대 마음·고백 타이밍·고백 멘트 예시.'},
    {id:'style',  name:'연애 스타일 분석',       hint:'자기이해',         type:'birth', prompt:'개인 연애 스타일 분석. 애착·선호·피해야 할 패턴.'},
    {id:'breakup',name:'이별 후 분석',           hint:'재회 가능성',      type:'birth', prompt:'이별 후 분석. 재회 가능성·다음 연애 준비도·치유 가이드.'},
    {id:'marriage',name:'결혼 상대 분석',        hint:'장기 관점',        type:'birth', prompt:'결혼 상대 분석. 장기 궁합·현실 조화·가족 관계.'},
    {id:'rut',    name:'권태기 극복 가이드',     hint:'관계 회복',        type:'birth', prompt:'권태기 극복 가이드. 원인·단계별 회복법·대화 방법.'},
    {id:'conflict',name:'갈등/외도 상담',        hint:'회복·결별',        type:'birth', prompt:'갈등/외도 관계 상담. 관계 회복·결별 결정 판단 포인트.'}
  ],
  'career-p':[
    {id:'aptitude',name:'적성 종합 분석',       hint:'MBTI+사주',        type:'birth', prompt:'MBTI+사주 통합 적성 분석. 추천 직업·성장 경로.'},
    {id:'startup',name:'창업 적성·타이밍',       hint:'사업운',           type:'birth', prompt:'창업 적성과 타이밍 분석. 업종 추천·시기·리스크.'},
    {id:'move-job',name:'이직 타이밍',            hint:'연간 흐름',        type:'birth', prompt:'이직 타이밍 분석. 좋은 시기·주의 시기·준비 사항.'},
    {id:'work-rel',name:'직장 인간관계',         hint:'상사·동료',        type:'birth', prompt:'직장 인간관계 분석. 상사·동료·부하와의 관계 전략.'},
    {id:'exam-pass',name:'합격운/시험운',        hint:'단기 운',          type:'birth', prompt:'합격운·시험운 분석. 단기 운세·시험 당일 주의점.'},
    {id:'side',   name:'부업/투잡 적성',          hint:'추가 수입',        type:'birth', prompt:'부업·투잡 적성 분석. 추천 분야·시간 관리·세금.'},
    {id:'senior-work',name:'은퇴/노후 직업',    hint:'시니어 특화',      type:'birth', prompt:'은퇴·노후 직업 추천(시니어 특화). 건강·경험·보람 기반.'}
  ],
  wealth:[
    {id:'basic-w',   name:'재물운 기본',         hint:'평생 흐름',        type:'birth', prompt:'재물운 기본 분석. 평생 흐름·대운별 재물 흐름.'},
    {id:'invest',    name:'투자 적성',           hint:'주식·부동산·코인',type:'birth', prompt:'투자 적성 분석. 자산별(주식/부동산/코인) 적합도·리스크 수용도.'},
    {id:'biz-luck',  name:'사업운 분석',         hint:'창업 운',          type:'birth', prompt:'사업운 분석. 창업·확장·매각 시기·주의 사항.'},
    {id:'rich-time', name:'부자 될 시기',         hint:'대운',             type:'birth', prompt:'부자 될 시기 분석(대운 기준). 준비·실행 타이밍.'},
    {id:'enhance',   name:'재물운 강화 방법',    hint:'실천법',           prompt:'재물운 강화 일상 실천법. 습관·공간·색상·생활.'},
    {id:'save',      name:'절약·저축 운세',       hint:'돈 새는 시기',     type:'birth', prompt:'절약·저축 운세. 돈 새는 시기·재물운 상승 시기·저축 전략.'}
  ],
  'feng-shui':[
    {id:'home',     name:'집 풍수 분석',        hint:'이사·방·색상', prompt:'집 풍수 분석. 이사 길일·방 배치·인테리어 색상.'},
    {id:'office',   name:'사무실 풍수/개업일',  hint:'업무 효율',    prompt:'사무실 풍수·개업일 선택. 책상 배치·업무 동선.'},
    {id:'direction',name:'방위별 운세',         hint:'나침반 활용',  prompt:'방위별 운세 분석. 본인에게 길·흉 방위 + 활용법.'},
    {id:'grave',    name:'묘자리/납골',         hint:'시니어 관심',  prompt:'묘자리·납골 관련 풍수 조언. 시니어 가족 관점.'}
  ],
  test:[
    {id:'self-esteem',name:'자존감/스트레스',    hint:'10문항',       prompt:'자존감·스트레스 자가진단 테스트 10문항 + 결과 해석·조언.'},
    {id:'burnout',    name:'연애심리/직장 번아웃',hint:'자가진단',    prompt:'연애 심리·직장 번아웃 자가진단 테스트 + 해석·대응.'},
    {id:'attachment', name:'애착 유형',           hint:'안정·회피·불안', prompt:'애착 유형 테스트. 안정형·회피형·불안형·혼란형 판정·회복.'},
    {id:'ennea',      name:'에니어그램 9유형',   hint:'핵심 동기',    prompt:'에니어그램 9유형 테스트 + 핵심 동기·성장 방향.'},
    {id:'inner-child',name:'내면아이 테스트',    hint:'치유',         prompt:'내면아이 테스트·치유 가이드.'},
    {id:'dep-anx',    name:'우울/불안 자가진단', hint:'전문가 연계', prompt:'우울·불안 자가진단 + 점수 해석. 일정 점수 이상이면 전문가 연계 안내.'},
    {id:'senior-test',name:'시니어 심리 테스트', hint:'노년 행복지수',prompt:'시니어 심리 테스트. 은퇴 후 적응·노년 행복지수·우울감 체크.'}
  ],
  healing:[
    {id:'affirm',     name:'오늘의 긍정 확언',  hint:'맞춤 확언',    prompt:'오늘의 긍정 확언 5개 + 맞춤 명상 가이드.'},
    {id:'diary',      name:'감정일기 도우미',   hint:'글쓰기 질문',  prompt:'감정일기 작성 도우미. 질문 리스트 + 글쓰기 구조.'},
    {id:'anger',      name:'분노/불안 극복',    hint:'실전 기법',    prompt:'분노·불안 극복 실전 기법. 호흡·인지재구성·환경 조정.'},
    {id:'self-rec',   name:'자존감 회복',       hint:'단계별',        prompt:'자존감 회복 단계별 프로그램. 자기 이해→수용→성장.'},
    {id:'inner-heal', name:'내면아이 치유',     hint:'상처 회복',    prompt:'내면아이 치유 가이드. 상처 인식→위로→통합.'},
    {id:'senior-heal',name:'시니어 힐링',       hint:'외로움·상실',  prompt:'시니어 힐링. 외로움·상실감·손자녀 관계 개선.'}
  ],
  pet:[
    {id:'personality',name:'반려동물 성격',     hint:'종류·생일',   type:'subject', prompt:'반려동물 성격 분석. 종류·생년월일 기반 기질·특징.'},
    {id:'today-pet',  name:'반려동물 오늘 운세',hint:'건강·행복',   type:'subject', prompt:'반려동물 오늘의 운세. 건강운·행복운·주의사항.'},
    {id:'pet-match',  name:'보호자-반려동물 궁합',hint:'생활 조화',type:'subject', prompt:'보호자-반려동물 궁합. 생활 조화·의사소통·훈련 팁.'},
    {id:'pet-name-m', name:'반려동물 이름 감정',hint:'작명',         type:'subject', prompt:'반려동물 이름 감정/추천. 한/일/영 3언어.'},
    {id:'rainbow',    name:'무지개다리 힐링',   hint:'추모',         type:'subject', prompt:'반려동물 이별 후 슬픔 극복·추모 문구·회복 과정.'},
    {id:'new-pet',    name:'새 반려동물 입양',  hint:'타이밍',       prompt:'새 반려동물 입양 타이밍·종류 추천·준비 사항.'}
  ],
  child:[
    {id:'temperament',name:'자녀 기질/성격',    hint:'생일·MBTI아동',type:'subject', prompt:'자녀 기질·성격 분석. 생년월일·아동 MBTI 기반.'},
    {id:'aptitude-c', name:'자녀 진로 적성',    hint:'학습 스타일',  type:'subject', prompt:'자녀 진로 적성·학습 스타일 분석.'},
    {id:'siblings',   name:'형제자매 관계',     hint:'성격 조화',   type:'subject', prompt:'형제자매 관계 분석. 성격 조화·갈등 해소·대화법.'},
    {id:'parent-child',name:'부모-자녀 궁합',  hint:'소통 스타일', type:'subject', prompt:'부모-자녀 궁합. 소통 스타일·훈육 포인트.'},
    {id:'child-name', name:'자녀 이름 감정',   hint:'개명 여부',    type:'subject', prompt:'자녀 이름 감정·보완 방법·개명 필요 여부.'},
    {id:'dream-b',    name:'태몽 해석',         hint:'꿈 내용',     type:'subject', prompt:'태몽 내용 해석. 성격·운명 암시·상징 분석.'}
  ],
  health:[
    {id:'ohaeng',  name:'오행 체질 분석',     hint:'목·화·토·금·수', type:'birth', prompt:'사주 기반 오행 체질 분석. 체질별 음식·운동·보약 방향.'},
    {id:'warning', name:'건강 주의 시기',      hint:'연간 흐름',       type:'birth', prompt:'건강 주의 시기 분석. 연간·월간 주의 시기 + 예방 포인트.'},
    {id:'food',    name:'체질별 음식·운동',   hint:'추천/금기',       type:'birth', prompt:'체질별 음식·운동 추천 + 금기사항.'},
    {id:'sasang',  name:'사상체질 분석',       hint:'태양·태음·소양·소음',type:'birth', prompt:'사상체질 분석(태양인·태음인·소양인·소음인). 특징·음식·운동.'},
    {id:'senior-h',name:'시니어 건강운',       hint:'시니어 특화',     type:'birth', prompt:'시니어 건강운 분석. 나이대별 주의점·실천 가능한 습관.'}
  ],
  season:[
    {id:'newyear-p',name:'신년 특별 운세 패키지',hint:'연간 종합',     type:'birth', prompt:'신년 종합 운세 패키지. 월별 흐름·12분야 + 해시 태그.'},
    {id:'exam-season',name:'수능/시험 시즌 운세',hint:'시험생',        type:'birth', prompt:'수능·시험 시즌 특별 운세. D-day 응원 + 당일 주의점.'},
    {id:'jobs-season',name:'취업 시즌 운세',    hint:'구직자',          type:'birth', prompt:'취업 시즌 특별 운세. 면접·서류·네트워킹 시기별 전략.'},
    {id:'valentine',  name:'밸런타인/화이트데이',hint:'연인 궁합',      type:'birth', prompt:'밸런타인·화이트데이 특별 궁합. 선물·고백 멘트 팁.'},
    {id:'family-fest',name:'추석/설날 가족 운세',hint:'명절',          type:'birth', prompt:'명절 가족 운세. 가족 구성원 관계·대화 팁.'},
    {id:'birthday',   name:'생일 특별 운세',     hint:'1년 흐름',       type:'birth', prompt:'생일 기준 1년 운세. 새로운 한 해의 흐름·목표 설정.'},
    {id:'xmas',       name:'크리스마스/연말',    hint:'한 해 마무리',   type:'birth', prompt:'크리스마스·연말 운세. 한 해 마무리·내년 준비.'}
  ],
  culture:[
    {id:'omikuji',name:'일본 오미쿠지·주역 점괘',hint:'日本式',       prompt:'일본 오미쿠지 스타일 운세. 大吉/吉/中吉/小吉 등 + 주역 점괘.'},
    {id:'jp-blood',name:'일본 혈액형 운세',       hint:'日本式',       prompt:'일본 혈액형 운세(일본식 해석). 성격·궁합·직업 추천.'},
    {id:'ema',    name:'에마(絵馬) 소원문 작성', hint:'신사',         prompt:'일본 신사 에마 소원문 작성. 격식·형식·소원별 예시.'},
    {id:'kanshi', name:'일본 간지(干支) 운세',    hint:'띠',           type:'birth', prompt:'일본 간지 운세·포춘쿠키 메시지.'},
    {id:'jp-name',name:'일본식 작명·신사절',     hint:'이름·참배',     prompt:'일본식 작명(히라가나/한자) + 신사 절 방문 운세.'},
    {id:'natal',  name:'서양 나탈차트 분석',     hint:'점성술',        type:'birth', prompt:'서양 나탈차트 분석. 행성 영향·수성역행 대처법.'},
    {id:'bazi',   name:'중국 사주(八字)',         hint:'풍수',          type:'birth', prompt:'중국식 사주(八字) 분석·풍수 인테리어·음양오행.'},
    {id:'tri-result',name:'한/일/영 동시 운세',  hint:'3언어 동시',    type:'birth', prompt:'동일한 운세를 한국어/일본어/영어 3언어로 동시 생성.'}
  ],
  premium:[
    {id:'full-saju',name:'종합 사주 리포트',     hint:'20페이지', type:'birth', prompt:'종합 사주 리포트(20페이지 분량). 사주팔자·용신·10년 대운·세운·년별 흐름·건강·재물·직업·인간관계 전 영역.', premium:true},
    {id:'couple-full',name:'커플 종합 궁합',     hint:'종합 리포트',type:'birth', prompt:'커플 종합 궁합 리포트. MBTI·사주·별자리 통합 + 장기 궁합.',premium:true},
    {id:'family-full',name:'가족 사주 통합',     hint:'가족 리포트',type:'birth', prompt:'가족 구성원 사주 통합 리포트. 가족 에너지 흐름·조화 전략.',premium:true},
    {id:'b2b-mbti', name:'기업 팀 MBTI 분석(B2B)',hint:'팀 리포트',type:'mbti',  prompt:'기업 팀 MBTI 분석 리포트(B2B). 조합·리더십·시너지·갈등 관리.',premium:true},
    {id:'baby-prem',name:'신생아 작명 프리미엄', hint:'10개·3언어',type:'naming',prompt:'신생아 프리미엄 작명 10개. 사주 기반 + 한/일/영 동시 + 의미 해설.',premium:true},
    {id:'year-sub', name:'연간 운세 구독',        hint:'1년 세트', type:'birth', prompt:'연간 운세 구독 서비스(1년치 월별).',premium:true},
    {id:'monthly-nl',name:'월간 운세 뉴스레터',  hint:'매월',     type:'birth', prompt:'월간 운세 뉴스레터. 이번 달 흐름·주요 이벤트·금주의 조언.',premium:true},
    {id:'chat',     name:'1:1 AI 운세 상담',      hint:'질의응답',                prompt:'1:1 AI 운세 상담 응답. 질문에 구체적 답변 + 후속 질문 안내.', premium:true}
  ]
};

const SEASON_BANNERS = (function(){
  const m = new Date().getMonth()+1; // 1~12
  if (m===11) return {text:'📚 수능 시즌 특별 운세 — 시험생 응원 운세 준비 완료', bg:'linear-gradient(135deg,#fff5fa,#eff6ff)', color:'#1f4a80'};
  if (m===12||m===1) return {text:'🎊 신년 특별 운세 패키지 — 12간지·별자리 연간 운세', bg:'linear-gradient(135deg,#fff7ee,#fff5fa)', color:'#b14d82'};
  if (m===2) return {text:'💝 밸런타인 궁합 운세 — 커플·썸타는 사람들을 위한', bg:'linear-gradient(135deg,#fff5fa,#f7f4ff)', color:'#b14d82'};
  if (m===3) return {text:'🌸 봄맞이 새학기 운세 — 새 출발을 위한 운세', bg:'linear-gradient(135deg,#fff5fa,#effbf7)', color:'#1a7a5a'};
  if (m===9||m===10) return {text:'🌕 추석·명절 가족 운세 — 가족 구성원 통합 분석', bg:'linear-gradient(135deg,#fff7ee,#fff5fa)', color:'#9a5a1a'};
  if (m===5||m===6) return {text:'💼 취업 시즌 운세 — 면접·서류 합격 운세', bg:'linear-gradient(135deg,#eff6ff,#effbf7)', color:'#1f4a80'};
  return null;
})();

let psState = { groupId:null, subId:null };

function openPsy(card){
  psState.groupId = card.psyId;
  psState.subId = null;
  const meta = PSY_META[card.psyId];
  document.getElementById('ps-ico').textContent   = meta.ico;
  document.getElementById('ps-title').textContent = meta.title;
  document.getElementById('ps-desc').textContent  = '유형을 선택하고 정보를 입력하세요.';

  // 시즌 배너
  const banner = document.getElementById('ps-banner');
  if (SEASON_BANNERS) {
    banner.style.display = '';
    banner.style.background = SEASON_BANNERS.bg;
    banner.style.color = SEASON_BANNERS.color;
    banner.style.border = '1px solid ' + SEASON_BANNERS.color + '33';
    banner.textContent = SEASON_BANNERS.text;
  } else {
    banner.style.display = 'none';
  }

  // 프리미엄 잠금
  document.getElementById('ps-premium-lock').style.display = meta.premium ? '' : 'none';

  // 서브 렌더
  const subBox = document.getElementById('ps-subs');
  subBox.innerHTML = '';
  (PSY_SUBS[card.psyId]||[]).forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'mz-sub-btn' + (s.premium?' soon':'');
    btn.innerHTML = s.name + (s.premium?' 💎':'') + '<small>' + s.hint + '</small>';
    btn.onclick = () => {
      psState.subId = s.id;
      subBox.querySelectorAll('.mz-sub-btn').forEach(x=>x.classList.remove('on'));
      btn.classList.add('on');
      togglePsFields(s.type || meta.type);
      document.getElementById('ps-premium-lock').style.display = (s.premium || meta.premium) ? '' : 'none';
    };
    subBox.appendChild(btn);
  });
  const first = (PSY_SUBS[card.psyId]||[])[0];
  if (first) {
    psState.subId = first.id;
    subBox.querySelector('.mz-sub-btn')?.classList.add('on');
    togglePsFields(first.type || meta.type);
  }

  // 뷰 전환
  document.querySelector('.hero').style.display = 'none';
  document.getElementById('grid').style.display = 'none';
  ['monetizeDetail','publicDetail','eduDetail','transDetail','smbDetail'].forEach(id=>document.getElementById(id)?.classList.add('hide'));
  document.getElementById('psyDetail').classList.remove('hide');
  document.getElementById('ps-out').value = '';
  document.getElementById('ps-status').textContent = '';
}

function closePsy(){
  document.getElementById('psyDetail').classList.add('hide');
  document.querySelector('.hero').style.display = '';
  document.getElementById('grid').style.display = '';
  psState = { groupId:null, subId:null };
}

function togglePsFields(type){
  ['birth','mbti','tarot','naming','subject'].forEach(t => {
    const el = document.getElementById('ps-'+t+'-box');
    if (el) el.style.display = (type === t) ? '' : 'none';
  });
}

function _getPsSub(){
  if(!psState.groupId || !psState.subId) return null;
  return (PSY_SUBS[psState.groupId]||[]).find(s => s.id === psState.subId);
}

async function generatePsy(){
  const sub = _getPsSub();
  if (!sub) { alert('세부 유형을 먼저 선택하세요.'); return; }
  const topic  = document.getElementById('ps-topic').value.trim();
  const lang   = document.getElementById('ps-lang').value;
  const length = document.getElementById('ps-length').value;
  const tone   = document.getElementById('ps-tone').value;

  // 특화 입력 조립
  const meta = PSY_META[psState.groupId];
  const fieldType = sub.type || meta.type;
  let extra = '';
  if (fieldType === 'birth') {
    extra += '\n[생년월일 정보]\n'+
      '본인: '+document.getElementById('ps-birth1').value+' '+document.getElementById('ps-birth1-time').value+' '+document.getElementById('ps-birth1-sex').value+'\n'+
      '상대: '+document.getElementById('ps-birth2').value+' '+document.getElementById('ps-birth2-time').value+' '+document.getElementById('ps-birth2-sex').value;
  }
  if (fieldType === 'mbti') {
    extra += '\n[MBTI]\n본인: '+document.getElementById('ps-mbti-me').value+'\n상대: '+document.getElementById('ps-mbti-other').value+'\n관계: '+document.getElementById('ps-mbti-rel').value;
  }
  if (fieldType === 'tarot') {
    extra += '\n[타로]\n스프레드: '+document.getElementById('ps-tarot-spread').value+'\n분야: '+document.getElementById('ps-tarot-area').value+
      '\n※ 카드는 AI가 무작위로 뽑아 제시하고 의미·위치·통합 해석을 제공.';
  }
  if (fieldType === 'naming') {
    extra += '\n[작명 조건]\n'+
      '유형: '+document.getElementById('ps-name-type').value+'\n'+
      '성별: '+document.getElementById('ps-name-sex').value+'\n'+
      '성(姓): '+document.getElementById('ps-name-family').value+'\n'+
      '선호: '+document.getElementById('ps-name-pref').value;
  }
  if (fieldType === 'subject') {
    extra += '\n[대상 정보]\n'+
      '이름: '+document.getElementById('ps-sub-name').value+'\n'+
      '생년월일: '+document.getElementById('ps-sub-birth').value+'\n'+
      '추가: '+document.getElementById('ps-sub-extra').value+'\n'+
      '꿈/태몽: '+document.getElementById('ps-sub-dream').value;
  }

  const toneMap = {warm:'따뜻·친근', mystic:'신비·진지', fun:'재미·가벼움', pro:'전문·객관'};
  const langList = {
    'ko':    [['ko','한국어','한국어로만']],
    'ko+ja': [['ko','한국어','한국어로만'],['ja','日本語','日本語のみ']],
    'ko+en': [['ko','한국어','한국어로만'],['en','English','English only']],
    'all':   [['ko','한국어','한국어로만'],['ja','日本語','日本語のみ'],['en','English','English only']]
  }[lang];

  const baseSystem =
    '당신은 심리·운세·사주·작명 전문 상담가다. 과학적 근거가 약한 전통 해석임을 이해하고, 내담자에게 상처를 주지 않도록 조심스럽게 안내한다.\n' +
    '카테고리: ' + meta.title + '\n' +
    '세부 유형: ' + sub.name + '\n' +
    '규칙: ' + sub.prompt + '\n' +
    '톤: ' + toneMap[tone] + '\n' +
    '상세 수준: ' + {short:'300자',mid:'1,000자',long:'2,500자',premium:'5,000자+'}[length] + '\n' +
    '단정적 운명론 대신 가능성·조언 중심. 의학·법률 결정이 필요한 사안은 전문가 상담을 권유.';

  const user = '질문/주제: ' + (topic||'(자유)') + extra;

  const btn = document.getElementById('ps-gen');
  const out = document.getElementById('ps-out');
  const status = document.getElementById('ps-status');
  btn.disabled = true; btn.textContent = '⏳ 생성 중...';
  status.textContent = '생성 중... (' + (langList.length>1?langList.length+'개 언어':'한국어') + ')';
  out.value = '';

  try {
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
    {const v=localStorage.getItem('uc_openai_key'); if(v) APIAdapter.setApiKey('openai',v);}
    {const v=localStorage.getItem('uc_gemini_key'); if(v) APIAdapter.setApiKey('gemini',v);}

    const maxTok = {short:900, mid:2000, long:4000, premium:7000}[length];
    const tasks = langList.map(([c, label, inst]) =>
      APIAdapter.callWithFallback(baseSystem + '\n[언어 지시] ' + inst, user, {maxTokens:maxTok})
        .then(r => ({label, text:r}))
        .catch(e => ({label, text:'❌ '+e.message}))
    );
    const results = await Promise.all(tasks);
    out.value = results.map(r => '━━━━━━━━━━ ' + r.label + ' ━━━━━━━━━━\n' + r.text).join('\n\n');
    status.textContent = '✅ 생성 완료 (' + toneMap[tone] + ' · ' + results.length + '개 언어)';
  } catch (err) {
    out.value = '❌ 오류: ' + err.message;
    status.textContent = '❌ ' + err.message;
  } finally {
    btn.disabled = false; btn.textContent = '✨ AI로 생성';
  }
}

function psCopy(){
  const t = document.getElementById('ps-out').value;
  if (!t) { alert('복사할 내용이 없습니다.'); return; }
  navigator.clipboard.writeText(t).then(()=>{
    document.getElementById('ps-status').textContent = '📋 클립보드에 복사되었습니다.';
  });
}
function psSave(){
  const t = document.getElementById('ps-out').value;
  if (!t) { alert('저장할 내용이 없습니다.'); return; }
  const sub = _getPsSub();
  const list = JSON.parse(localStorage.getItem('uc_psy_saved')||'[]');
  list.unshift({
    at: Date.now(),
    group: psState.groupId, sub: sub?.id, subName: sub?.name,
    topic: document.getElementById('ps-topic').value,
    body:  t
  });
  localStorage.setItem('uc_psy_saved', JSON.stringify(list.slice(0,50)));
  document.getElementById('ps-status').textContent = '💾 저장됨 (localStorage · 최근 50개 유지)';
}
function psShare(){
  const t = document.getElementById('ps-out').value;
  if (!t) { alert('먼저 결과를 생성해주세요.'); return; }
  // 공유용 요약 (너무 길지 않게)
  const sub = _getPsSub();
  const title = (sub?.name || '운세 결과');
  const summary = t.slice(0, 200).replace(/\n+/g,' ').trim() + (t.length>200?'…':'');
  const shareText = '✨ [' + title + ']\n\n' + summary + '\n\n— 통합 콘텐츠 생성기';
  if (navigator.share) {
    navigator.share({ title: title, text: shareText }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(shareText).then(()=>{
      alert('📤 공유 텍스트가 클립보드에 복사됐습니다.\n인스타·트위터·카톡에 붙여넣기 해주세요.');
    });
  }
}
function psSendToMedia(){
  const t = document.getElementById('ps-out').value;
  if (!t) { alert('먼저 결과를 생성해주세요.'); return; }
  const list = JSON.parse(localStorage.getItem('hub_scripts_v1')||'[]');
  const sub = _getPsSub();
  list.unshift({ source:'psy', lang:'ko', text:t, at:Date.now(), meta:{group:psState.groupId, sub:sub?.id} });
  localStorage.setItem('hub_scripts_v1', JSON.stringify(list.slice(0,30)));
  if (confirm('🎬 미디어 엔진으로 전송했습니다.\n\n운세 영상·SNS 이미지로 만들어보시겠어요?')) {
    location.href = 'engines/media/index.html?tab=oneclick';
  }
}

/* ═══════════════════════════════════════════════
   🚀 자동숏츠 — 8단계 파이프라인 + 대시보드/분석/대량
   =============================================== */
const SH_STEPS = [
  {id:0,  label:'🏠 대시보드'},
  {id:1,  label:'① 채널 설정'},
  {id:2,  label:'② 트렌드'},
  {id:3,  label:'③ 대본'},
  {id:4,  label:'④ 스타일'},
  {id:5,  label:'⑤ 1차 검증'},
  {id:6,  label:'⑥ 미디어'},
  {id:7,  label:'⑦ 최종 검증'},
  {id:8,  label:'⑧ 업로드'},
  {id:9,  label:'📈 분석'},
  {id:10, label:'🤖 대량'}
];

let shState = { step:0, data:{} }; // data는 각 단계 입력 보관

function openShorts(step){
  shState.step = step || 0;
  // 저장된 데이터 있으면 로드
  try { const saved = JSON.parse(localStorage.getItem('uc_shorts_pipeline')||'null'); if(saved && saved.data) shState.data = saved.data; } catch(e){}
  document.querySelector('.hero').style.display = 'none';
  document.getElementById('grid').style.display = 'none';
  ['monetizeDetail','publicDetail','eduDetail','transDetail','smbDetail','psyDetail'].forEach(id=>document.getElementById(id)?.classList.add('hide'));
  document.getElementById('shortsDetail').classList.remove('hide');
  renderStepper();
  renderStepContent();
}

function closeShorts(){
  document.getElementById('shortsDetail').classList.add('hide');
  document.querySelector('.hero').style.display = '';
  document.getElementById('grid').style.display = '';
}

function renderStepper(){
  const box = document.getElementById('sh-stepper');
  box.innerHTML = '';
  SH_STEPS.forEach(s => {
    const b = document.createElement('button');
    b.className = 'sh-step' + (s.id === shState.step ? ' active' : (shState.data['step_'+s.id+'_done'] ? ' done' : ''));
    b.textContent = s.label;
    b.onclick = () => { shState.step = s.id; renderStepper(); renderStepContent(); };
    box.appendChild(b);
  });
  document.getElementById('sh-prev').disabled = shState.step === 0;
  document.getElementById('sh-next').disabled = shState.step === 10;
}

function shStep(delta){
  shState.step = Math.max(0, Math.min(10, shState.step + delta));
  renderStepper();
  renderStepContent();
  window.scrollTo({ top: document.getElementById('shortsDetail').offsetTop - 20, behavior:'smooth' });
}

function shSavePipeline(){ localStorage.setItem('uc_shorts_pipeline', JSON.stringify(shState)); alert('💾 파이프라인 저장됨'); }
function shLoadPipeline(){ try{ const s=JSON.parse(localStorage.getItem('uc_shorts_pipeline')||'null'); if(s){ shState=s; renderStepper(); renderStepContent(); alert('📥 불러옴'); } else alert('저장된 데이터 없음'); }catch(e){alert('오류: '+e.message);} }

function renderStepContent(){
  const html = {
    0: renderDashboard,
    1: renderChannelSetup,
    2: renderTrend,
    3: renderScript,
    4: renderStyle,
    5: renderValidate1,
    6: renderMediaGen,
    7: renderValidate2,
    8: renderUpload,
    9: renderAnalytics,
    10: renderBatch
  }[shState.step]();
  document.getElementById('sh-content').innerHTML = html;
  // 단계별 초기화 훅
  if (typeof window._shInit === 'function') window._shInit();
}

/* ─── 0. 대시보드 ─── */
function renderDashboard(){
  const today = new Date().toLocaleDateString('ko-KR');
  window._shInit = null;
  return `
  <div class="sh-panel">
    <h4>🏠 대시보드 — ${today}</h4>
    <div class="sh-stat">
      <div class="sh-stat-box"><div class="v">—</div><div class="l">총 영상 수</div></div>
      <div class="sh-stat-box"><div class="v">—</div><div class="l">누적 조회수</div></div>
      <div class="sh-stat-box"><div class="v">—</div><div class="l">이번 달 업로드</div></div>
      <div class="sh-stat-box"><div class="v">—</div><div class="l">예상 수익</div></div>
    </div>
    <div class="muted">※ 실제 채널 데이터 연동은 YouTube Data API 키 입력 후 활성화됩니다.</div>
  </div>

  <div class="sh-panel">
    <h4>📋 오늘 할 일 (자동 생성)</h4>
    <div class="sh-checklist">
      <div class="sh-check">□ 업로드 예정: 오늘 오후 6시 · 시니어 감동 스토리 #23</div>
      <div class="sh-check">□ 만들어야 할 영상: 일본 채널용 신규 1건</div>
      <div class="sh-check">□ 답글 대기 댓글: 12건 (우선 상위 5건)</div>
      <div class="sh-check">□ 경쟁 채널 새 영상 리뷰 (3개 채널)</div>
    </div>
  </div>

  <div class="sh-panel">
    <h4>🔥 트렌드 알림</h4>
    <div class="sh-checklist">
      <div class="sh-check">📈 급상승 키워드: "황혼이혼", "노후자금", "孫の入学"</div>
      <div class="sh-check">🎯 경쟁채널 신규 업로드: 2개</div>
      <div class="sh-check">#️⃣ 급상승 해시태그: #시니어브이로그 #団塊世代</div>
    </div>
  </div>

  <div class="sh-panel" style="background:linear-gradient(135deg,#fff5fa,#f7f4ff);border-color:var(--line-strong)">
    <h4>⚡ 빠른 시작</h4>
    <div class="muted">오늘의 추천 주제로 바로 대본 생성 → 풀 파이프라인 진행</div>
    <div class="actions" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
      <button class="mz-btn pri" onclick="shQuickStart('senior-touching')">🎬 시니어 감동 스토리</button>
      <button class="mz-btn pri" onclick="shQuickStart('jp-senior')">🇯🇵 일본 시니어 트렌드</button>
      <button class="mz-btn pri" onclick="shQuickStart('knowledge')">📚 1분 지식</button>
    </div>
  </div>`;
}
function shQuickStart(preset){
  shState.data.quickPreset = preset;
  shState.step = 3; // 대본 생성으로 바로
  renderStepper(); renderStepContent();
}

/* ─── 1. 채널 설정 ─── */
function renderChannelSetup(){
  const d = shState.data.channel || {};
  window._shInit = null;
  return `
  <div class="sh-panel">
    <h4>① 채널 프로파일 (최대 10개 저장)</h4>
    <div class="mz-row">
      <div><label>채널명</label><input class="mz-in" id="ch-name" value="${d.name||''}" placeholder="예: 엄마의 하루"></div>
      <div><label>장르</label>
        <select class="mz-in" id="ch-genre">
          <option value="senior-touching" ${d.genre==='senior-touching'?'selected':''}>시니어 감동</option>
          <option value="comic" ${d.genre==='comic'?'selected':''}>코믹</option>
          <option value="tikitaka" ${d.genre==='tikitaka'?'selected':''}>티키타카</option>
          <option value="knowledge" ${d.genre==='knowledge'?'selected':''}>지식</option>
          <option value="drama" ${d.genre==='drama'?'selected':''}>드라마</option>
          <option value="ads" ${d.genre==='ads'?'selected':''}>광고</option>
        </select>
      </div>
      <div><label>언어</label>
        <select class="mz-in" id="ch-lang-s">
          <option value="ko">🇰🇷 한국어</option>
          <option value="ja">🇯🇵 일본어</option>
          <option value="kojp" selected>🇰🇷+🇯🇵 동시</option>
        </select>
      </div>
    </div>
    <div class="mz-row" style="margin-top:8px">
      <div><label>타겟 연령</label>
        <select class="mz-in" id="ch-age">
          <option value="10s">10대</option><option value="20s">20대</option>
          <option value="30s">30대</option><option value="40s">40대</option>
          <option value="50s" selected>50대</option><option value="60s+">60대+</option>
        </select>
      </div>
      <div><label>성별</label>
        <select class="mz-in" id="ch-gender">
          <option value="all" selected>전체</option><option value="F">여성</option><option value="M">남성</option>
        </select>
      </div>
      <div><label>톤</label>
        <select class="mz-in" id="ch-tone-s">
          <option value="warm">따뜻</option><option value="energetic">활기</option>
          <option value="calm">차분</option><option value="dramatic">드라마틱</option>
        </select>
      </div>
    </div>
  </div>

  <div class="sh-panel">
    <h4>🎨 브랜드킷</h4>
    <div class="mz-row">
      <div><label>채널 고유 색상</label><input class="mz-in" type="color" id="ch-color" value="${d.color||'#ef6fab'}"></div>
      <div><label>로고 위치</label>
        <select class="mz-in" id="ch-logo">
          <option value="tl">좌상단</option><option value="tr" selected>우상단</option>
          <option value="bl">좌하단</option><option value="br">우하단</option>
        </select>
      </div>
      <div><label>자막 스타일</label>
        <select class="mz-in" id="ch-sub-style">
          <option value="bold-yellow">굵은 노랑</option>
          <option value="white-shadow" selected>흰색+그림자</option>
          <option value="box-bg">박스 배경</option>
        </select>
      </div>
    </div>
    <div class="mz-row" style="margin-top:8px">
      <div><label>워터마크 텍스트</label><input class="mz-in" id="ch-watermark" value="${d.watermark||''}" placeholder="예: @엄마의하루"></div>
      <div><label>고정 인트로</label><input class="mz-in" id="ch-intro" value="${d.intro||''}" placeholder="예: 안녕하세요, 엄마의 하루입니다"></div>
      <div><label>고정 CTA</label><input class="mz-in" id="ch-cta" value="${d.cta||''}" placeholder="예: 구독·좋아요 부탁드려요"></div>
    </div>
  </div>

  <div class="sh-panel">
    <h4>👀 경쟁 채널 모니터링</h4>
    <textarea class="mz-in" id="ch-competitors" style="min-height:70px" placeholder="경쟁 채널 URL을 줄바꿈으로 입력">${d.competitors||''}</textarea>
    <div class="muted" style="margin-top:6px">등록된 채널의 신규 업로드를 자동 추적합니다.</div>
  </div>

  <div class="sh-panel" style="background:#effbf7;border-color:#c8ebd9">
    <h4>🌏 멀티채널 동기화</h4>
    <label style="font-size:12px;display:flex;align-items:center;gap:6px"><input type="checkbox" id="ch-sync" ${d.sync?'checked':''}>한국 채널 ↔ 일본 채널 설정 동기화</label>
    <div class="actions">
      <button class="mz-btn sv" onclick="shSaveChannel()">💾 채널 프로파일 저장</button>
    </div>
  </div>`;
}
function shSaveChannel(){
  shState.data.channel = {
    name:document.getElementById('ch-name').value, genre:document.getElementById('ch-genre').value,
    lang:document.getElementById('ch-lang-s').value, age:document.getElementById('ch-age').value,
    gender:document.getElementById('ch-gender').value, tone:document.getElementById('ch-tone-s').value,
    color:document.getElementById('ch-color').value, logo:document.getElementById('ch-logo').value,
    subStyle:document.getElementById('ch-sub-style').value,
    watermark:document.getElementById('ch-watermark').value, intro:document.getElementById('ch-intro').value,
    cta:document.getElementById('ch-cta').value, competitors:document.getElementById('ch-competitors').value,
    sync:document.getElementById('ch-sync').checked
  };
  shState.data['step_1_done'] = true;
  shSavePipeline(); renderStepper();
}

/* ─── 2. 트렌드 탐지 ─── */
function renderTrend(){
  window._shInit = null;
  return `
  <div class="sh-panel">
    <h4>② 실시간 트렌드 수집</h4>
    <div class="sh-card-grid">
      <button onclick="shPickTrend('yt')">📈 YouTube 급상승</button>
      <button onclick="shPickTrend('tiktok')">🎵 TikTok 트렌드</button>
      <button onclick="shPickTrend('naver')">🇰🇷 네이버 실검</button>
      <button onclick="shPickTrend('jp')">🇯🇵 일본 트렌드</button>
      <button onclick="shPickTrend('x')">🐦 X 핫토픽</button>
      <button onclick="shPickTrend('mine')">🎯 내 장르 맞춤</button>
    </div>
    <label>채널 장르 기반 자동 필터</label>
    <textarea id="sh-trend-list" class="mz-in" style="min-height:140px" placeholder="수집된 트렌드가 여기에 표시됩니다. 버튼을 눌러 AI로 생성하세요.">${shState.data.trendList||''}</textarea>
  </div>

  <div class="sh-panel" style="background:#f7f4ff;border-color:#d8d2f4">
    <h4>🔮 AI 트렌드 예측</h4>
    <div class="muted">내일·이번 주 뜰 콘텐츠 미리 예측</div>
    <button class="mz-btn pri" onclick="shPredictTrend()">🔮 예측 실행</button>
    <textarea id="sh-trend-predict" class="mz-in" style="min-height:120px;margin-top:8px" readonly></textarea>
  </div>

  <div class="sh-panel">
    <h4>➡️ 선택한 트렌드를 대본으로</h4>
    <input class="mz-in" id="sh-trend-pick" placeholder="위 목록에서 하나 골라 입력">
    <button class="mz-btn pri" onclick="shTrendToScript()" style="margin-top:8px">📝 이 주제로 대본 생성 단계로 이동</button>
  </div>`;
}
async function shPickTrend(src){
  const ta = document.getElementById('sh-trend-list');
  ta.value = '⏳ AI가 트렌드를 수집·요약 중...';
  try {
    await _syncAPIShorts();
    const genre = (shState.data.channel||{}).genre || 'senior-touching';
    const sys = '당신은 콘텐츠 트렌드 분석가다. ' + {yt:'유튜브 급상승',tiktok:'TikTok',naver:'네이버 실검',jp:'일본 트렌드',x:'X 핫토픽',mine:'내 장르'}[src] + '에서 최근 트렌드를 10개 열거. 각 항목: 키워드 · 관련 주제 한 줄 요약. 내 채널 장르(' + genre + ')에 맞는 것 우선.';
    const r = await APIAdapter.callWithFallback(sys, '트렌드 10개 제시', {maxTokens:800});
    ta.value = r;
    shState.data.trendList = r;
  } catch(e){ ta.value = '❌ '+e.message; }
}
async function shPredictTrend(){
  const ta = document.getElementById('sh-trend-predict');
  ta.value = '⏳ 예측 중...';
  try {
    await _syncAPIShorts();
    const genre = (shState.data.channel||{}).genre || 'senior-touching';
    const sys = '콘텐츠 전략가로서 내일·이번 주에 뜰 가능성이 높은 주제 5개 예측. 근거·추천 훅 포함. 내 장르: '+genre;
    const r = await APIAdapter.callWithFallback(sys, '예측 5개', {maxTokens:800});
    ta.value = r;
  } catch(e){ ta.value = '❌ '+e.message; }
}
function shTrendToScript(){
  const pick = document.getElementById('sh-trend-pick').value.trim();
  if(!pick){ alert('주제를 입력하세요.'); return; }
  shState.data.topic = pick;
  shState.data['step_2_done'] = true;
  shState.step = 3; renderStepper(); renderStepContent();
}

/* ─── 3. 대본 생성 ─── */
function renderScript(){
  const d = shState.data;
  window._shInit = null;
  return `
  <div class="sh-panel">
    <h4>③ 대본 생성</h4>
    <label>주제 / 키워드</label>
    <textarea class="mz-in" id="sh-topic" style="min-height:70px" placeholder="예: 70대 어머니의 마지막 편지">${d.topic||''}</textarea>

    <div class="mz-row" style="margin-top:10px">
      <div><label>길이</label>
        <select class="mz-in" id="sh-len">
          <option value="15">15초</option>
          <option value="30" selected>30초</option>
          <option value="60">60초</option>
        </select>
      </div>
      <div><label>구조</label>
        <select class="mz-in" id="sh-struct">
          <option value="hook">훅 → 본문 → CTA</option>
          <option value="3act">3막 (문제·해결·결론)</option>
          <option value="auto" selected>자동 (도입·본문·마무리)</option>
        </select>
      </div>
      <div><label>스타일</label>
        <select class="mz-in" id="sh-style">
          <option value="senior-touching" selected>감동</option>
          <option value="comic">코믹</option>
          <option value="info">정보</option>
          <option value="drama">드라마</option>
          <option value="tikitaka">티키타카</option>
        </select>
      </div>
    </div>

    <label style="margin-top:10px">🎣 훅 라이브러리 (장르별 검증된 패턴)</label>
    <div class="sh-card-grid">
      <button onclick="shPickHook('A')">A. 질문형 "왜 ~일까요?"</button>
      <button onclick="shPickHook('B')">B. 충격 선언 "믿기지 않겠지만..."</button>
      <button onclick="shPickHook('C')">C. 숫자·통계 "87%의 사람이..."</button>
      <button onclick="shPickHook('D')">D. 스토리 오프닝 "어느 날..."</button>
      <button onclick="shPickHook('E')">E. 반전 예고 "이 영상 끝까지 보세요"</button>
      <button onclick="shPickHook('F')">F. 공감·호소 "혹시 당신도..."</button>
    </div>

    <div class="mz-row" style="margin-top:10px">
      <div><label>언어</label>
        <select class="mz-in" id="sh-slang">
          <option value="ko">🇰🇷 한국어</option>
          <option value="ja">🇯🇵 일본어</option>
          <option value="kojp" selected>🇰🇷+🇯🇵 동시</option>
        </select>
      </div>
      <div><label>A/B 동시 생성</label>
        <select class="mz-in" id="sh-ab">
          <option value="off">단일</option>
          <option value="on" selected>A/B 2버전</option>
        </select>
      </div>
    </div>

    <button class="mz-btn pri" onclick="shGenScript()" style="margin-top:10px">✨ 대본 생성</button>
    <div id="sh-script-status" class="mz-status"></div>
    <textarea id="sh-script-out" class="mz-out" readonly style="min-height:260px;margin-top:8px">${d.script||''}</textarea>
  </div>`;
}
function shPickHook(k){ shState.data.hookType = k; alert('훅 패턴 '+k+' 선택됨'); }
async function shGenScript(){
  const topic = document.getElementById('sh-topic').value.trim();
  if(!topic){ alert('주제를 입력하세요.'); return; }
  const status = document.getElementById('sh-script-status');
  status.textContent = '⏳ 생성 중...';
  try {
    await _syncAPIShorts();
    const len = document.getElementById('sh-len').value;
    const struct = document.getElementById('sh-struct').value;
    const style = document.getElementById('sh-style').value;
    const slang = document.getElementById('sh-slang').value;
    const ab = document.getElementById('sh-ab').value === 'on';
    const hookType = shState.data.hookType || 'auto';
    const genre = (shState.data.channel||{}).genre || style;

    const sys = '당신은 숏츠 대본 작가다. 길이 '+len+'초, 구조 '+struct+', 스타일 '+style+', 장르 '+genre+', 훅 패턴 '+hookType+'. 첫 3초 훅 매우 강하게, 중간 몰입, 마지막 CTA 또는 여운 있는 한 줄.';
    const tasks = [];
    const langs = slang === 'kojp' ? ['ko','ja'] : [slang];
    const versions = ab ? ['A','B'] : [''];
    versions.forEach(v => langs.forEach(L => {
      const langI = L==='ko'?'반드시 한국어로만':'必ず日本語のみで';
      tasks.push(
        APIAdapter.callWithFallback(sys+'\n[언어] '+langI+(v?'\n[버전 '+v+'] '+(v==='A'?'감정 우선':'정보 우선'):''), '주제: '+topic, {maxTokens:1500})
          .then(r => '━ '+(v?'🅱 '+v+' · ':'')+L.toUpperCase()+' ━\n'+r)
          .catch(e => '❌ '+L+': '+e.message)
      );
    }));
    const results = await Promise.all(tasks);
    const out = results.join('\n\n');
    document.getElementById('sh-script-out').value = out;
    shState.data.script = out;
    shState.data.topic = topic;
    shState.data['step_3_done'] = true;
    status.textContent = '✅ 대본 생성 완료';
    renderStepper();
  } catch(e){ status.textContent = '❌ '+e.message; }
}

/* ─── 4. 스타일 설정 ─── */
function renderStyle(){
  const d = shState.data.style || {};
  window._shInit = null;
  return `
  <div class="sh-panel">
    <h4>④ 이미지 스타일</h4>
    <div class="sh-card-grid" id="sh-img-style">
      ${['실사사진','디즈니픽사풍','일본애니풍','지브리풍','유화/수채화','웹툰/만화풍','3D 렌더링','미니멀 flat','빈티지 레트로','사이버펑크','수묵 동양화','인포그래픽'].map((s,i)=>`<button onclick="shPickImg(${i})" class="${d.imgIdx===i?'on':''}">${s}</button>`).join('')}
    </div>
  </div>

  <div class="sh-panel">
    <h4>🎬 영상 스타일</h4>
    <div class="sh-card-grid" id="sh-vid-style">
      ${['이미지 슬라이드쇼','줌인아웃','켄번스 효과','파티클 효과','AI 아바타(HeyGen)','배경+자막','분할화면(티키타카)','자막+배경색'].map((s,i)=>`<button onclick="shPickVid(${i})" class="${d.vidIdx===i?'on':''}">${s}</button>`).join('')}
    </div>
  </div>

  <div class="sh-panel">
    <h4>📝 자막 상세</h4>
    <div class="mz-row">
      <div><label>위치</label>
        <select class="mz-in" id="sh-sub-pos"><option>상단</option><option selected>중앙</option><option>하단</option></select>
      </div>
      <div><label>한국어 폰트</label>
        <select class="mz-in" id="sh-ko-font">
          <option>배달의민족</option><option>나눔고딕</option><option selected>Pretendard</option>
          <option>Black Han Sans</option><option>강원교육튼튼</option><option>교보손글씨</option>
        </select>
      </div>
      <div><label>일본어 폰트</label>
        <select class="mz-in" id="sh-jp-font">
          <option selected>Noto Sans JP</option><option>M PLUS</option>
          <option>Kosugi Maru</option><option>Zen Kurenaido</option>
        </select>
      </div>
    </div>
    <div class="mz-row" style="margin-top:8px">
      <div><label>영어 폰트</label>
        <select class="mz-in" id="sh-en-font">
          <option>Impact</option><option selected>Montserrat</option><option>Bebas Neue</option><option>Anton</option>
        </select>
      </div>
      <div><label>크기</label>
        <select class="mz-in" id="sh-sub-size"><option>소</option><option selected>중</option><option>대</option><option>특대</option></select>
      </div>
      <div><label>효과</label>
        <select class="mz-in" id="sh-sub-fx"><option>페이드인</option><option selected>팝업</option><option>타이핑</option><option>강조색 변경</option></select>
      </div>
    </div>
    <div class="mz-row" style="margin-top:8px">
      <div><label>글자색</label><input class="mz-in" type="color" id="sh-sub-color" value="#ffffff"></div>
      <div><label>배경색</label><input class="mz-in" type="color" id="sh-sub-bg" value="#000000"></div>
      <div><label>한+일 동시</label>
        <select class="mz-in" id="sh-sub-both"><option value="single" selected>단일</option><option value="both">한·일 동시</option></select>
      </div>
    </div>
  </div>

  <div class="sh-panel">
    <h4>🎤 음성 상세</h4>
    <div class="mz-row">
      <div><label>공급자</label>
        <select class="mz-in" id="sh-tts">
          <option value="openai" selected>OpenAI TTS (저렴)</option>
          <option value="elevenlabs">ElevenLabs (고품질)</option>
          <option value="clova">CLOVA (한국어)</option>
          <option value="nijivoice">Nijivoice (일본어)</option>
        </select>
      </div>
      <div><label>속도</label>
        <input class="mz-in" type="range" id="sh-tts-speed" min="0.7" max="1.3" step="0.05" value="1.0" oninput="this.nextElementSibling.textContent=this.value+'x'">
        <span style="font-size:11px;color:var(--sub)">1.0x</span>
      </div>
      <div><label>감정</label>
        <select class="mz-in" id="sh-tts-emo">
          <option>차분</option><option selected>따뜻함</option><option>열정</option>
          <option>슬픔</option><option>기쁨</option><option>진지</option><option>코믹</option>
        </select>
      </div>
    </div>
    <div class="mz-row" style="margin-top:8px">
      <div><label>화자 수</label>
        <select class="mz-in" id="sh-speakers"><option>1인</option><option selected>2인 (티키타카)</option><option>3인 이상</option></select>
      </div>
      <div><label>언어</label>
        <select class="mz-in" id="sh-tts-lang">
          <option value="ko">🇰🇷</option><option value="ja">🇯🇵</option><option value="kojp" selected>🇰🇷+🇯🇵</option>
        </select>
      </div>
    </div>
  </div>

  <div class="sh-panel">
    <h4>🎵 배경음악</h4>
    <div class="mz-row">
      <div><label>분위기</label>
        <select class="mz-in" id="sh-bgm-mood"><option>감동적</option><option>신나는</option><option>차분한</option><option>긴장감</option><option>코믹</option></select>
      </div>
      <div><label>장르</label>
        <select class="mz-in" id="sh-bgm-gen"><option>피아노</option><option>오케스트라</option><option>팝</option><option>Lo-fi</option><option>EDM</option></select>
      </div>
      <div><label>비율(화면)</label>
        <select class="mz-in" id="sh-ratio"><option value="9:16" selected>9:16 (쇼츠)</option><option value="1:1">1:1</option><option value="16:9">16:9</option></select>
      </div>
    </div>
  </div>

  <div class="sh-panel">
    <button class="mz-btn pri" onclick="shSaveStyle()">💾 스타일 프리셋 저장</button>
    <button class="mz-btn" onclick="shLoadStylePreset()">📥 프리셋 불러오기</button>
  </div>`;
}
function shPickImg(i){ shState.data.style = shState.data.style || {}; shState.data.style.imgIdx = i; renderStepContent(); }
function shPickVid(i){ shState.data.style = shState.data.style || {}; shState.data.style.vidIdx = i; renderStepContent(); }
function shSaveStyle(){ shState.data['step_4_done']=true; shSavePipeline(); renderStepper(); alert('💾 스타일 프리셋 저장됨'); }
function shLoadStylePreset(){ try{ const s=JSON.parse(localStorage.getItem('uc_shorts_pipeline')||'null'); if(s&&s.data&&s.data.style){ shState.data.style=s.data.style; renderStepContent(); alert('📥 스타일 불러옴'); } }catch(e){} }

/* ─── 5. 1차 검증 ─── */
function renderValidate1(){
  window._shInit = null;
  const hasScript = !!shState.data.script;
  return `
  <div class="sh-panel">
    <h4>⑤ 대본 품질 자동체크</h4>
    <div class="sh-checklist" id="sh-v1-checks">
      <div class="sh-check">□ 길이 적절성 (예상 ${shState.data.script ? Math.round((shState.data.script.length/8)) : '—'}초)</div>
      <div class="sh-check">□ 첫 3초 훅 강도</div>
      <div class="sh-check">□ CTA 유무</div>
      <div class="sh-check">□ 금지어·저작권 확인</div>
      <div class="sh-check">□ 자연스러운 한국어/일본어</div>
    </div>
  </div>

  <div class="sh-panel" style="background:linear-gradient(135deg,#fff5fa,#f7f4ff)">
    <h4>🔮 AI 바이럴 예측 점수</h4>
    <button class="mz-btn pri" onclick="shViralScore()" ${hasScript?'':'disabled'}>🎯 예측 실행</button>
    <div id="sh-viral-out" class="mz-out" style="min-height:160px;margin-top:8px"></div>
  </div>

  <div class="sh-panel">
    <h4>🎨 채널 적합성 체크</h4>
    <div class="sh-checklist">
      <div class="sh-check">□ 채널 톤과 일치</div>
      <div class="sh-check">□ 타겟 연령 적합</div>
      <div class="sh-check">□ 브랜드킷 반영</div>
    </div>
    <div class="actions" style="margin-top:10px">
      <button class="mz-btn sv" onclick="shMarkDone(5)">✅ 통과</button>
      <button class="mz-btn" onclick="shStep(-2)">✏️ 수정 (대본으로)</button>
      <button class="mz-btn" onclick="shGenScript()">🔄 재생성</button>
    </div>
  </div>`;
}
async function shViralScore(){
  const out = document.getElementById('sh-viral-out');
  out.textContent = '⏳ 예측 중...';
  try {
    await _syncAPIShorts();
    const sys = '당신은 숏츠 바이럴 예측가다. 아래 대본을 평가: ① 예상 시청완료율 (0~100%) ② 공유 가능성 (0~100) ③ 훅 강도 (상/중/하) ④ 경쟁 영상 대비 점수 ⑤ 개선 제안 3가지. 구조화해서 출력.';
    const r = await APIAdapter.callWithFallback(sys, shState.data.script||'', {maxTokens:1000});
    out.textContent = r;
  } catch(e){ out.textContent = '❌ '+e.message; }
}
function shMarkDone(step){ shState.data['step_'+step+'_done'] = true; renderStepper(); alert('✅ '+SH_STEPS[step].label+' 통과'); }

/* ─── 6. 미디어 생성 ─── */
function renderMediaGen(){
  window._shInit = null;
  return `
  <div class="sh-panel">
    <h4>⑥ 순서대로 자동 생성</h4>
    <div class="sh-checklist" id="sh-media-progress">
      <div class="sh-check" id="mp-voice">1. 음성 생성 (TTS/씬별 감정) — 대기</div>
      <div class="sh-check" id="mp-image">2. 이미지 프롬프트 (DALL·E 3/Ideogram/Flux 자동선택) — 대기</div>
      <div class="sh-check" id="mp-subtitle">3. 자막 파일 (.srt 타이밍 자동) — 대기</div>
      <div class="sh-check" id="mp-bgm">4. 배경음악 프롬프트 — 대기</div>
      <div class="sh-check" id="mp-thumb">5. 썸네일 (KO/JP · A/B 2버전) — 대기</div>
    </div>
    <button class="mz-btn pri" onclick="shRunMediaGen()" style="margin-top:10px">🚀 일괄 생성 시작</button>
    <textarea id="sh-media-out" class="mz-out" style="min-height:280px;margin-top:8px" readonly></textarea>
  </div>`;
}
async function shRunMediaGen(){
  const steps = ['mp-voice','mp-image','mp-subtitle','mp-bgm','mp-thumb'];
  const out = document.getElementById('sh-media-out');
  out.value = '';
  try {
    await _syncAPIShorts();
    const script = shState.data.script || '(대본 없음)';
    const sys = '숏츠 미디어 제작자다. 아래 대본 기반으로 다음 5종 전부 생성해 구조화해 출력:\n'+
      '━ 1. 음성 스크립트 (씬별 감정 태그 포함)\n'+
      '━ 2. 이미지 프롬프트 (씬별 · 공급자 추천 포함)\n'+
      '━ 3. .srt 자막 (타임코드 포함)\n'+
      '━ 4. 배경음악 Suno 프롬프트\n'+
      '━ 5. 썸네일 (KO/JP · A/B 2버전 · 문구 + 이미지 프롬프트)';
    const r = await APIAdapter.callWithFallback(sys, script, {maxTokens:6000});
    out.value = r;
    steps.forEach(id => { const el=document.getElementById(id); if(el){ el.classList.add('ok'); el.textContent = el.textContent.replace('대기','✅ 완료'); }});
    shState.data.media = r;
    shState.data['step_6_done'] = true;
    renderStepper();
  } catch(e){ out.value = '❌ '+e.message; }
}

/* ─── 7. 최종 검증 ─── */
function renderValidate2(){
  window._shInit = null;
  return `
  <div class="sh-panel">
    <h4>⑦ 완성도·정책·SEO 체크</h4>
    <div class="sh-checklist">
      <div class="sh-check">□ 대본/음성/이미지/자막/썸네일 확인</div>
      <div class="sh-check">□ 전체 길이 적절</div>
      <div class="sh-check">□ 유튜브 정책 준수</div>
      <div class="sh-check">□ 틱톡 정책 준수</div>
      <div class="sh-check">□ 인스타 정책 준수</div>
      <div class="sh-check">□ 저작권 이슈 없음</div>
    </div>
  </div>

  <div class="sh-panel" style="background:linear-gradient(135deg,#eff6ff,#fff5fa)">
    <h4>🔍 SEO 최적화 패키지</h4>
    <button class="mz-btn pri" onclick="shSeoPackage()">🎯 제목 A/B · 설명문 · 태그 30개 자동 생성</button>
    <textarea id="sh-seo-out" class="mz-out" style="min-height:260px;margin-top:8px" readonly></textarea>
    <button class="mz-btn sv" onclick="shMarkDone(7)" style="margin-top:10px">✅ 최종 승인</button>
  </div>`;
}
async function shSeoPackage(){
  const out = document.getElementById('sh-seo-out');
  out.value = '⏳ 생성 중...';
  try {
    await _syncAPIShorts();
    const sys = '숏츠 SEO 전문가다. JSON 형식으로만 출력:\n{\n  "titlesKO_A":["..."],"titlesKO_B":["..."],"titlesJP_A":["..."],"titlesJP_B":["..."],\n  "descriptionKO":"...","descriptionJP":"...",\n  "tags":["태그 30개"],\n  "hashtagsKO":["#..."],"hashtagsJP":["#..."]\n}';
    const r = await APIAdapter.callWithFallback(sys, '주제: '+(shState.data.topic||'')+'\n\n대본: '+(shState.data.script||''), {maxTokens:2000});
    out.value = r;
    shState.data.seo = r;
  } catch(e){ out.value = '❌ '+e.message; }
}

/* ─── 8. 플랫폼 업로드 ─── */
function renderUpload(){
  window._shInit = null;
  return `
  <div class="sh-panel">
    <h4>⑧ 플랫폼 패키지 자동 생성</h4>
    <div class="sh-card-grid">
      <button onclick="shMakePackage('yt')">🎬 YouTube 숏츠</button>
      <button onclick="shMakePackage('tiktok')">🎵 TikTok</button>
      <button onclick="shMakePackage('ig')">📸 Instagram 릴스</button>
      <button onclick="shMakePackage('naver')">🇰🇷 네이버 클립/TV</button>
      <button onclick="shMakePackage('jp')">🇯🇵 일본 플랫폼 (ニコニコ/LINE VOOM/note)</button>
      <button onclick="shMakePackage('all')">📦 전체 패키지</button>
    </div>
    <textarea id="sh-package" class="mz-out" style="min-height:280px;margin-top:8px" readonly></textarea>
    <div class="actions">
      <button class="mz-btn" onclick="shDownloadBundle()">💾 .txt 번들 다운로드</button>
    </div>
  </div>

  <div class="sh-panel" style="background:#effbf7;border-color:#c8ebd9">
    <h4>📅 업로드 스케줄러</h4>
    <div class="mz-row">
      <div><label>업로드 시각 (한국 KST)</label><input class="mz-in" type="datetime-local" id="sh-upload-kst"></div>
      <div><label>일본 JST 자동 환산</label><input class="mz-in" id="sh-upload-jst" readonly placeholder="KST 입력 시 자동"></div>
      <div><label>주간 반복</label>
        <select class="mz-in" id="sh-upload-repeat"><option value="">없음</option><option value="weekly">매주</option><option value="daily">매일</option></select>
      </div>
    </div>
    <div class="muted" style="margin-top:6px">※ 실제 자동 업로드는 플랫폼 API 연동 필요 (YouTube/Meta/TikTok). 현재는 예약 메모 저장.</div>
    <button class="mz-btn sv" onclick="shSaveSchedule()">📅 예약 저장</button>
  </div>

  <div class="sh-panel">
    <h4>💬 댓글 자동 답글 템플릿</h4>
    <button class="mz-btn pri" onclick="shGenReplies()">✨ 답글 템플릿 10종 자동 생성</button>
    <textarea id="sh-replies" class="mz-out" style="min-height:180px;margin-top:8px" readonly></textarea>
  </div>`;
}
async function shMakePackage(target){
  const out = document.getElementById('sh-package');
  out.value = '⏳ 생성 중...';
  try {
    await _syncAPIShorts();
    const map = {
      yt:'YouTube 숏츠: 제목 A/B + 설명문 + 태그 30개 + 썸네일 + 자막 + 최적 업로드 시간',
      tiktok:'TikTok: 제목 + 해시태그 20개 + 듀엣/스티치 설정',
      ig:'Instagram 릴스: 캡션 + 해시태그 30개 + 스토리 연계 문구',
      naver:'네이버 클립/TV: 제목 + 설명 + 태그 + 블로그 연계 포스팅',
      jp:'일본 플랫폼: ニコニコ動画 / LINE VOOM / Twitter 일본어 / note.com 각 버전',
      all:'모든 플랫폼(YouTube/TikTok/IG/Naver/일본) 패키지를 전부 생성'
    };
    const sys = '플랫폼 최적화 마케터다. 아래 콘텐츠를 '+map[target]+' 형식으로 작성. 구조화해서 출력.';
    const r = await APIAdapter.callWithFallback(sys, '주제:'+(shState.data.topic||'')+'\n대본:'+(shState.data.script||''), {maxTokens:3500});
    out.value = r;
    shState.data.package = r;
    shState.data['step_8_done'] = true;
    renderStepper();
  } catch(e){ out.value = '❌ '+e.message; }
}
function shDownloadBundle(){
  const combined = [
    '=== 주제 ===', shState.data.topic||'',
    '\n=== 대본 ===', shState.data.script||'',
    '\n=== 미디어 ===', shState.data.media||'',
    '\n=== SEO ===', shState.data.seo||'',
    '\n=== 플랫폼 패키지 ===', shState.data.package||''
  ].join('\n');
  const blob = new Blob([combined], {type:'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'shorts_bundle_' + Date.now() + '.txt';
  a.click();
  URL.revokeObjectURL(a.href);
}
function shSaveSchedule(){
  const kst = document.getElementById('sh-upload-kst').value;
  if(!kst){ alert('시각을 선택하세요.'); return; }
  const date = new Date(kst);
  // KST -> JST 동일시간대(+0) 간주
  document.getElementById('sh-upload-jst').value = date.toLocaleString('ja-JP');
  const list = JSON.parse(localStorage.getItem('uc_shorts_schedule')||'[]');
  list.unshift({ at:Date.now(), scheduledAt:date.toISOString(), repeat:document.getElementById('sh-upload-repeat').value, topic:shState.data.topic });
  localStorage.setItem('uc_shorts_schedule', JSON.stringify(list.slice(0,50)));
  alert('📅 예약 저장됨');
}
async function shGenReplies(){
  const out = document.getElementById('sh-replies');
  out.value = '⏳ 생성 중...';
  try {
    await _syncAPIShorts();
    const sys = '유튜브 댓글 자동 답글 템플릿 10종 생성. 긍정·질문·부정·감사·불만 등 상황별로.';
    const r = await APIAdapter.callWithFallback(sys, '채널 장르: '+((shState.data.channel||{}).genre||'일반')+'\n영상 주제: '+(shState.data.topic||''), {maxTokens:1500});
    out.value = r;
  } catch(e){ out.value = '❌ '+e.message; }
}

/* ─── 9. 성과 분석 ─── */
function renderAnalytics(){
  window._shInit = null;
  return `
  <div class="sh-panel">
    <h4>📈 영상별 분석 · 채널 분석 · AI 인사이트</h4>
    <div class="sh-stat">
      <div class="sh-stat-box"><div class="v">—</div><div class="l">조회수</div></div>
      <div class="sh-stat-box"><div class="v">—</div><div class="l">시청완료율</div></div>
      <div class="sh-stat-box"><div class="v">—</div><div class="l">좋아요</div></div>
      <div class="sh-stat-box"><div class="v">—</div><div class="l">구독자 유입</div></div>
    </div>
    <div class="muted">※ 실제 분석은 YouTube Analytics API 키 필요. 현재는 수동 입력 기반 AI 인사이트 제공.</div>
  </div>

  <div class="sh-panel">
    <h4>🧠 AI 인사이트 (수동 입력)</h4>
    <label>영상 성과 데이터 입력</label>
    <textarea class="mz-in" id="sh-perf-data" style="min-height:100px" placeholder="예: 조회수 12,000 / 시청완료율 45% / 좋아요 320 / 댓글 45 / 구독 유입 28"></textarea>
    <button class="mz-btn pri" onclick="shAnalyzePerf()" style="margin-top:8px">🔍 분석 실행</button>
    <textarea id="sh-insight" class="mz-out" style="min-height:200px;margin-top:8px" readonly></textarea>
  </div>`;
}
async function shAnalyzePerf(){
  const out = document.getElementById('sh-insight');
  const data = document.getElementById('sh-perf-data').value;
  if(!data){ alert('성과 데이터를 입력하세요.'); return; }
  out.value = '⏳ 분석 중...';
  try {
    await _syncAPIShorts();
    const sys = '유튜브 성과 분석가다. 입력 데이터로 ① 왜 잘됐나/안됐나 ② 다음 영상 개선포인트 3개 ③ 최적 업로드 시간 추정 ④ 경쟁채널 비교 관점을 구조화해서 출력.';
    const r = await APIAdapter.callWithFallback(sys, '채널:'+((shState.data.channel||{}).name||'')+'\n성과:'+data+'\n주제:'+(shState.data.topic||''), {maxTokens:1500});
    out.value = r;
  } catch(e){ out.value = '❌ '+e.message; }
}

/* ─── 10. 대량 생산 ─── */
function renderBatch(){
  window._shInit = null;
  return `
  <div class="sh-panel">
    <h4>🤖 배치 생성 (주제 10개 → 영상 10개 동시)</h4>
    <textarea class="mz-in" id="sh-batch-topics" style="min-height:120px" placeholder="주제를 줄바꿈으로 입력 (최대 10개)"></textarea>
    <button class="mz-btn pri" onclick="shBatchRun()" style="margin-top:8px">🚀 일괄 생성</button>
    <textarea id="sh-batch-out" class="mz-out" style="min-height:260px;margin-top:8px" readonly></textarea>
  </div>

  <div class="sh-panel">
    <h4>📺 시리즈 자동 생성</h4>
    <div class="mz-row">
      <div><label>시리즈 이름</label><input class="mz-in" id="sh-series-name" placeholder="예: 어머니의 편지 시리즈"></div>
      <div><label>편수</label>
        <select class="mz-in" id="sh-series-count"><option>3</option><option selected>5</option><option>7</option><option>10</option></select>
      </div>
      <div><label>주제</label><input class="mz-in" id="sh-series-topic" placeholder="시리즈 전체 주제"></div>
    </div>
    <button class="mz-btn pri" onclick="shSeriesRun()" style="margin-top:8px">📺 시리즈 생성</button>
    <textarea id="sh-series-out" class="mz-out" style="min-height:200px;margin-top:8px" readonly></textarea>
  </div>

  <div class="sh-panel">
    <h4>📅 월간 콘텐츠 캘린더 (한·일 동시)</h4>
    <input class="mz-in" id="sh-cal-theme" placeholder="이번 달 테마 (예: 가을 감성·추석·건강)">
    <button class="mz-btn pri" onclick="shCalendarRun()" style="margin-top:8px">📅 30일 캘린더 생성</button>
    <textarea id="sh-cal-out" class="mz-out" style="min-height:200px;margin-top:8px" readonly></textarea>
  </div>

  <div class="sh-panel" style="background:#fff7ee;border-color:#f1e0c4">
    <h4>♻️ 재활용 시스템</h4>
    <div class="sh-card-grid">
      <button onclick="shRecycle('long2short')">🎬 롱폼 → 숏츠 분할</button>
      <button onclick="shRecycle('blog2short')">📝 블로그 → 숏츠</button>
      <button onclick="shRecycle('nl2short')">📧 뉴스레터 → 숏츠</button>
    </div>
    <label style="margin-top:8px">원본 콘텐츠</label>
    <textarea class="mz-in" id="sh-recycle-src" style="min-height:120px" placeholder="변환할 원본 붙여넣기"></textarea>
    <textarea id="sh-recycle-out" class="mz-out" style="min-height:160px;margin-top:8px" readonly></textarea>
  </div>`;
}
async function shBatchRun(){
  const topics = document.getElementById('sh-batch-topics').value.split('\n').filter(t=>t.trim()).slice(0,10);
  if(!topics.length){ alert('주제를 입력하세요.'); return; }
  const out = document.getElementById('sh-batch-out');
  out.value = '⏳ '+topics.length+'개 동시 생성 중...';
  try {
    await _syncAPIShorts();
    const sys = '숏츠 대본 작가. 30초 숏츠 대본 생성. 훅·본문·CTA 구조.';
    const tasks = topics.map(t => APIAdapter.callWithFallback(sys, '주제: '+t, {maxTokens:700}).then(r=>'━ '+t+' ━\n'+r).catch(e=>'❌ '+t+': '+e.message));
    const results = await Promise.all(tasks);
    out.value = results.join('\n\n');
  } catch(e){ out.value = '❌ '+e.message; }
}
async function shSeriesRun(){
  const name = document.getElementById('sh-series-name').value;
  const count = parseInt(document.getElementById('sh-series-count').value);
  const topic = document.getElementById('sh-series-topic').value;
  if(!name || !topic){ alert('시리즈 이름과 주제를 입력하세요.'); return; }
  const out = document.getElementById('sh-series-out');
  out.value = '⏳ 생성 중...';
  try {
    await _syncAPIShorts();
    const sys = '시리즈 '+count+'편 연속 대본 작가. 이전 편 요약·다음 편 예고가 자연스럽게 연결되게 '+count+'편 각각 30초 대본.';
    const r = await APIAdapter.callWithFallback(sys, '시리즈:'+name+'\n주제:'+topic, {maxTokens:6000});
    out.value = r;
  } catch(e){ out.value = '❌ '+e.message; }
}
async function shCalendarRun(){
  const theme = document.getElementById('sh-cal-theme').value||'자유 테마';
  const out = document.getElementById('sh-cal-out');
  out.value = '⏳ 생성 중...';
  try {
    await _syncAPIShorts();
    const sys = '한국·일본 채널용 월간 콘텐츠 캘린더 작성자. 30일치 일자별 표(날짜|한국 주제|일본 주제|해시태그). 트렌드·시즌 반영.';
    const r = await APIAdapter.callWithFallback(sys, '이번 달 테마: '+theme, {maxTokens:3500});
    out.value = r;
  } catch(e){ out.value = '❌ '+e.message; }
}
async function shRecycle(kind){
  const src = document.getElementById('sh-recycle-src').value;
  if(!src){ alert('원본을 입력하세요.'); return; }
  const out = document.getElementById('sh-recycle-out');
  out.value = '⏳ 변환 중...';
  try {
    await _syncAPIShorts();
    const map = {long2short:'롱폼 영상 대본을 30초 숏츠 3~5개로 분할', blog2short:'블로그 글을 30초 숏츠 대본으로', nl2short:'뉴스레터를 30초 숏츠 대본으로'};
    const r = await APIAdapter.callWithFallback('재활용 편집자다. '+map[kind]+'. 각 숏츠 30초 분량.', src, {maxTokens:3000});
    out.value = r;
  } catch(e){ out.value = '❌ '+e.message; }
}

/* ─── 공통 ─── */
async function _syncAPIShorts(){
  if(typeof APIAdapter==='undefined') throw new Error('api-adapter.js 미로드');
  {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
  {const v=localStorage.getItem('uc_openai_key'); if(v) APIAdapter.setApiKey('openai',v);}
  {const v=localStorage.getItem('uc_gemini_key'); if(v) APIAdapter.setApiKey('gemini',v);}
}

/* ═══════════════════════════════════════════════
   🌈 어린이 모드 — 10 대카테고리 · 안전장치 · 포인트·뱃지
   =============================================== */
const KIDS_CARDS = [
  {id:'family',    ico:'👨‍👩‍👧‍👦', title:'가족 놀이터',    desc:'가족과 함께 놀고 사랑쌓기',     c:1, star:true},
  {id:'friends',   ico:'👫',       title:'친구 놀이터',    desc:'친구들과 재밌게 놀기',          c:2, star:true},
  {id:'games',     ico:'🎮',       title:'게임 & 놀이',    desc:'AI랑 신나는 게임하기',          c:3},
  {id:'story',     ico:'📖',       title:'나만의 이야기',  desc:'내가 주인공인 이야기 만들기',   c:4},
  {id:'create',    ico:'🎨',       title:'창작 놀이',      desc:'캐릭터·나라·음식·노래 만들기',  c:5},
  {id:'comedy',    ico:'😂',       title:'개그 & 유머',    desc:'웃긴 이야기로 빵 터지기',       c:6},
  {id:'magic',     ico:'🔮',       title:'신기한 것',      desc:'마술·비밀·미래 예언',           c:7},
  {id:'challenge', ico:'🏆',       title:'도전 & 챌린지',  desc:'오늘의 미션·뱃지 모으기',       c:8},
  {id:'world',     ico:'🌍',       title:'세계 여행',      desc:'다른 나라 탐험하기',            c:9},
  {id:'event',     ico:'🎪',       title:'특별 이벤트',    desc:'생일·방학·크리스마스',          c:10}
];

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

// 안전장치 - 부적절 키워드 필터
const KIDS_BLOCK_WORDS = ['죽','살인','자살','폭력','성인','담배','음주','술','마약','도박','섹스','야한','베드','밴','욕설'];
function kidsContainsBad(text){
  const lower = (text||'').toLowerCase();
  return KIDS_BLOCK_WORDS.some(w => lower.includes(w));
}
// 외부 링크 제거
function kidsSanitize(text){
  return (text||'').replace(/https?:\/\/[^\s]+/g, '').replace(/www\.[^\s]+/g, '');
}

// 뱃지 시스템
const BADGES = {
  story:{label:'이야기왕',icon:'📖'}, game:{label:'게임왕',icon:'🎮'},
  create:{label:'창의왕',icon:'🎨'}, family:{label:'효도왕',icon:'👑'},
  friends:{label:'우정왕',icon:'💝'}, comedy:{label:'웃음왕',icon:'😆'},
  peace:{label:'화해왕',icon:'🕊️'}, cheer:{label:'응원왕',icon:'📣'}
};

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

// 1) 새 카드 추가 (KIDS_CARDS 배열에 append)
KIDS_CARDS.push({
  id:'character', ico:'🧸', title:'캐릭터 놀이터',
  desc:'세상에 하나뿐인 내 캐릭터 만들기', c:3, star:true
});

// 2) 메타 추가
KIDS_META.character = {ico:'🧸', title:'캐릭터 놀이터', sub:'세상에 하나뿐인 내 캐릭터를 만들어요 🎨✨'};

// 3) 서브 메뉴 추가 — 저작권 안전 프롬프트 가이드 포함
KIDS_SUBS.character = [
  {id:'c-cat',      emoji:'🐱', name:'귀요미 고양이 캐릭터 만들기',   hint:'산리오 같은 느낌',
    prompt:'독창적인 귀여운 고양이 캐릭터 생성. 아이가 입력한 색깔·성격·특징을 반영해서 다음을 모두 만들어라: ①캐릭터 이름 제안 3개 ②1인칭 자기 소개 (200자) ③AI 그림 사이트에 붙여넣을 영어 프롬프트 (반드시 저작권 안전한 원본 스타일: "original cute cat character, kawaii style, pastel colors, round face, big eyes, child-friendly" 형식, 절대 Hello Kitty나 기존 캐릭터 이름 언급 금지) ④짧은 인사 노래 가사 2줄.'},
  {id:'c-monster',  emoji:'👾', name:'깜찍한 몬스터 캐릭터 만들기',   hint:'포켓몬 같은 느낌',
    prompt:'독창적인 귀여운 몬스터 캐릭터 생성. 타입·능력·외모를 반영해서: ①캐릭터 이름 ②몬스터 도감 설명 (200자) ③영어 이미지 프롬프트 (저작권 안전 원본: "original cute fantasy monster creature, colorful, friendly, round shape, big sparkly eyes, chibi style" — Pokemon이나 기존 작품 이름 절대 금지) ④능력치 카드 (HP/공격/방어/귀여움).'},
  {id:'c-toy',      emoji:'🧸', name:'장난꾸러기 인형 캐릭터 만들기', hint:'라부부 같은 느낌',
    prompt:'독창적인 디자이너 토이 캐릭터 생성. 모양·표정·색깔을 반영해서: ①캐릭터 이름 ②인형 소개서 (200자) ③영어 이미지 프롬프트 (저작권 안전 원본: "original vinyl designer art toy character, pointy ears, cute pastel colors, mischievous expression, collectible figurine style" — Labubu나 기존 브랜드 이름 절대 금지) ④수집 도감 한 페이지.'},
  {id:'c-custom',   emoji:'🌟', name:'나만의 캐릭터 만들기 (자유)',   hint:'세상에 하나뿐!',
    prompt:'완전히 독창적인 어린이용 캐릭터 생성. 이름·종류·나이·색깔·크기·특징·성격·능력·좋아하는 것을 모두 받아서 다음 5개를 완성: ①📋 캐릭터 소개서 (1인칭, 이모지 풍부하게) ②🎨 이미지 프롬프트 (영어, 저작권 안전한 original character · kawaii style · child-friendly 명시) ③📖 내 캐릭터가 주인공인 짧은 동화 (300자) ④🎤 캐릭터 테마송 가사 4줄 ⑤🃏 능력치 카드 (HP·공격·방어·귀여움·행운, 각 1~999 숫자).'},
  {id:'c-story',    emoji:'📖', name:'내 캐릭터 주인공 동화',          hint:'이야기책',
    prompt:'아이가 만든 캐릭터를 주인공으로 한 짧은 동화(500자 내외) 생성. 기승전결 + 교훈 + 친구들과의 따뜻한 에피소드 포함. 폭력·무서운 요소 금지.'},
  {id:'c-dialogue', emoji:'💬', name:'캐릭터와 대화하기',              hint:'티키타카 이야기',
    prompt:'아이가 만든 캐릭터와 AI가 짝꿍이 되어 주고받는 귀여운 대화 (10턴). 친근하고 다정한 말투. 마지막은 친구가 되자는 훈훈한 결말.'},
  {id:'c-diary',    emoji:'📝', name:'내 캐릭터 오늘의 일기',          hint:'하루 일기',
    prompt:'아이의 캐릭터가 1인칭으로 쓰는 오늘 하루 일기. 날씨·아침·점심·저녁·가장 재밌었던 일·내일 할 일. 이모지 풍부하게.'},
  {id:'c-card',     emoji:'🃏', name:'캐릭터 능력치 카드',             hint:'포켓몬 카드처럼',
    prompt:'아이의 캐릭터 능력치 카드. 이름·타입·기술 3개·HP·공격·방어·스피드·귀여움·행운·특수능력·약점·친구가 되는 조건 포함. 재밌게.'},
  {id:'c-goods',    emoji:'🏷️', name:'캐릭터 굿즈 문구',                hint:'스티커·엽서·머그컵',
    prompt:'아이의 캐릭터로 만들 굿즈 4종 문구 (스티커·엽서·머그컵·파우치) 각각 한국어·일본어·영어 3언어 병기. 귀엽고 짧게.'},
  {id:'c-friends',  emoji:'👫', name:'캐릭터 친구들 함께 이야기',      hint:'2명 주인공',
    prompt:'아이가 설명한 캐릭터 2명이 함께 모험하는 짧은 이야기 (400자). 둘의 성격이 다르지만 협력해서 문제를 해결. 티키타카 대화 풍부하게. 우정의 교훈.'}
];

// 4) 캐릭터 놀이터 시작 가이드 팝업 (선택 시 처음 한 번만)
(function(){
  const ORIG_OPEN = window.openKidsGroup;
  if (typeof ORIG_OPEN !== 'function') return;
  window.openKidsGroup = function(gid){
    const r = ORIG_OPEN.apply(this, arguments);
    if (gid === 'character' && !localStorage.getItem('uc_char_intro_shown')) {
      localStorage.setItem('uc_char_intro_shown','1');
      setTimeout(() => {
        const pop = document.createElement('div');
        pop.className = 'kids-points-pop';
        pop.style.background = 'linear-gradient(135deg,#77DD77,#87CEEB)';
        pop.style.fontSize = '24px';
        pop.innerHTML = '🎨 캐릭터 놀이터 열림! 🧸<br><span style="font-size:16px">저작권 걱정 없는 내 캐릭터 만들기 ✨</span>';
        document.body.appendChild(pop);
        setTimeout(()=>pop.remove(), 2800);
      }, 300);
    }
    return r;
  };
})();

/* ═══════════════════════════════════════════════
   📖 가이드 모드 — 10 탭 · 초등학생도 이해할 수 있는 설명
   =============================================== */
const GD_TABS = [
  {id:'wizard',  label:'🚀 온보딩 마법사'},
  {id:'quick',   label:'⚡ 3분 빠른 시작'},
  {id:'concept', label:'📖 개념 설명'},
  {id:'ba',      label:'📊 Before/After'},
  {id:'calc',    label:'💰 비용 계산기'},
  {id:'cases',   label:'🏆 성공 사례'},
  {id:'pkg',     label:'📦 패키지 비교'},
  {id:'trouble', label:'🔧 문제 해결'},
  {id:'course',  label:'🗓️ 5일 완전정복'},
  {id:'tips',    label:'💡 꿀팁 & 지원'}
];
let gdActive = 'wizard';

function renderGuide(){
  const box = document.getElementById('gd-tabs');
  box.innerHTML = '';
  GD_TABS.forEach(t => {
    const b = document.createElement('button');
    b.className = 'gd-tab' + (gdActive === t.id ? ' on' : '');
    b.textContent = t.label;
    b.onclick = () => { gdActive = t.id; renderGuide(); };
    box.appendChild(b);
  });
  const c = document.getElementById('gd-content');
  c.innerHTML = ({
    wizard:  gdWizard,  quick: gdQuick,   concept: gdConcept,
    ba:      gdBA,      calc:  gdCalc,    cases:   gdCases,
    pkg:     gdPkg,     trouble: gdTrouble, course: gdCourse,
    tips:    gdTips
  }[gdActive] || gdWizard)();
  if (typeof window._gdInit === 'function') window._gdInit();
}

/* ─── 탭1: 🚀 온보딩 마법사 ─── */
let gdWizardStep = 1, gdUserType = null, gdUserGoal = null;
function gdStartWizard(){ gdWizardStep = 1; gdUserType = null; gdUserGoal = null; gdActive='wizard'; renderGuide(); }
function gdWizard(){
  window._gdInit = null;
  if (gdWizardStep === 1) {
    return `<div class="gd-panel">
      <h3>🚀 온보딩 마법사 — Step 1/3</h3>
      <p><strong>저는 누구인가요?</strong> 가장 비슷한 카드를 골라주세요. 3번만 클릭하면 딱 맞는 기능으로 안내해 드릴게요! 🎯</p>
      <div class="gd-grid-3">
        ${[
          ['smb','🏪','소상공인 / 자영업자','식당·카페·가게 운영'],
          ['creator','📝','유튜버 / 크리에이터','쇼츠·롱폼·블로그'],
          ['public','🏛️','공무원 / 공공기관','보고서·공문·보도자료'],
          ['parent','📚','학생 / 학부모','숙제·생활기록부·학습'],
          ['office','💼','직장인 / 프리랜서','업무 자동화·문서'],
          ['curious','🎮','그냥 궁금해서','처음 써보는 분']
        ].map(([id,ico,t,s])=>
          `<button class="gd-card" onclick="gdWizardPick('${id}')" style="cursor:pointer;font-family:inherit;text-align:left;border:2px solid var(--line-strong)"><span class="big-emoji">${ico}</span><h5>${t}</h5><span style="font-size:12px;color:var(--sub)">${s}</span></button>`
        ).join('')}
      </div>
    </div>`;
  }
  if (gdWizardStep === 2) {
    const goals = {
      smb: [['sns','📱 SNS 게시물 만들기','monetize','sns'],['menu','🍽️ 메뉴판·전단지','smb','restaurant'],['review','💬 리뷰 답글','smb','cs'],['fund','💰 지원금 신청서','smb','docs']],
      creator: [['shorts','⚡ 쇼츠 대본','script','gen'],['longform','🎬 롱폼 대본','script','story'],['hub','🎤 변환허브','script','hub'],['multi','🌏 한·일 동시 운영','shorts',null]],
      public: [['report','📊 보고서','public','doc'],['press','📰 보도자료','public','press'],['civil','🗂️ 민원답변','public','civil'],['court','⚖️ 법원 조사서','public','court']],
      parent: [['homework','📝 숙제 도우미','edu','elem-low'],['record','⭐ 생활기록부','edu','high'],['tutor','🤖 AI 튜터','edu','tutor'],['admit','🏆 입시 전략','edu','admission']],
      office: [['trans','🌐 번역','trans','business'],['doc','📋 문서 작성','monetize','blog'],['sns-of','📱 SNS','monetize','sns']],
      curious: [['try','✨ 일단 구경만','script','gen'],['demo','🎮 샘플 체험','monetize','blog']]
    }[gdUserType] || [];
    return `<div class="gd-panel">
      <h3>🚀 온보딩 마법사 — Step 2/3</h3>
      <p><strong>주로 뭘 하고 싶나요?</strong></p>
      <div class="gd-grid-2">
        ${goals.map(([id,label,cat,tab])=>
          `<button class="gd-card" onclick="gdWizardGoal('${id}','${cat}','${tab||''}')" style="cursor:pointer;font-family:inherit;text-align:left;font-size:16px;font-weight:800;color:#b14d82">${label}</button>`
        ).join('')}
      </div>
      <div class="gd-actions" style="margin-top:12px"><button class="gd-tb" onclick="gdWizardStep=1;renderGuide()">← 이전으로</button></div>
    </div>`;
  }
  return `<div class="gd-panel">
    <h3>🎉 완료! Step 3/3</h3>
    <div class="gd-result-box">
      <p style="margin:0;font-size:16px">🎯 딱 맞는 기능을 찾았어요!</p>
      <p style="margin:8px 0 0;font-size:14px">30초만 따라하면 첫 결과가 나와요. 시작해볼까요? ✨</p>
    </div>
    <ul style="font-size:14px;line-height:2">
      <li>1️⃣ "이동하기" 버튼을 눌러주세요</li>
      <li>2️⃣ 주제를 짧게 입력 (예: "제주도 카페")</li>
      <li>3️⃣ "AI로 생성" 버튼 클릭 — 완성! 🎉</li>
    </ul>
    <button class="gd-bigbtn" onclick="gdWizardGo()">🚀 이동하기</button>
    <button class="gd-tb" onclick="gdWizardStep=1;renderGuide()" style="margin-left:8px">← 처음부터</button>
  </div>`;
}
function gdWizardPick(id){ gdUserType = id; gdWizardStep = 2; renderGuide(); }
function gdWizardGoal(id, cat, tab){ gdUserGoal = {id,cat,tab}; gdWizardStep = 3; renderGuide(); }
function gdWizardGo(){
  if (!gdUserGoal) return;
  state.mode = 'normal'; state.category = gdUserGoal.cat;
  // 모드 탭 시각 상태 업데이트
  document.querySelectorAll('.toptab:not(.lang)').forEach(x => x.classList.toggle('on', x.dataset.mode==='normal'));
  renderAll();
  // 카드 자동 클릭 (있으면)
  if (gdUserGoal.tab) {
    setTimeout(() => {
      const card = document.querySelector(`#grid button`);
      // 대신 직접 카드 데이터 조회
      const found = (cards[gdUserGoal.cat]||[]).find(c => (c.tab===gdUserGoal.tab)||(c.bldId===gdUserGoal.tab)||(c.pbId===gdUserGoal.tab)||(c.eduId===gdUserGoal.tab)||(c.trId===gdUserGoal.tab)||(c.smbId===gdUserGoal.tab)||(c.psyId===gdUserGoal.tab));
      if (found) {
        if (gdUserGoal.cat === 'script' && found.tab) location.href = 'engines/script/index.html?tab=' + found.tab;
        else if (found.bldId) openBuilder(found);
        else if (found.pbId) openPublic(found);
        else if (found.eduId) openEdu(found);
        else if (found.trId) openTrans(found);
        else if (found.smbId) openSmb(found);
        else if (found.psyId) openPsy(found);
      }
    }, 200);
  }
}

/* ─── 탭2: ⚡ 3분 빠른 시작 ─── */
function gdQuick(){
  window._gdInit = null;
  return `<div class="gd-panel">
    <h3>⚡ 3분 빠른 시작 — 딱 5단계!</h3>
    <div class="gd-step-card">
      <div class="gd-step-num">1</div>
      <div class="gd-step-body"><strong>🔑 API 키를 넣어요</strong><span>게임 계정처럼 딱 한 번만! 한 번 저장하면 계속 써요. 어디서 받냐고요? 대본생성기 탭의 "🔑 API 키" 버튼을 누르면 안내가 나와요.</span></div>
    </div>
    <div class="gd-step-card">
      <div class="gd-step-num">2</div>
      <div class="gd-step-body"><strong>👆 원하는 걸 클릭해요</strong><span>왼쪽 메뉴에서 카테고리를 고르고, 중앙 카드에서 원하는 기능을 눌러요. 예) "블로그/글쓰기" → "네이버 블로그 감성형"</span></div>
    </div>
    <div class="gd-step-card">
      <div class="gd-step-num">3</div>
      <div class="gd-step-body"><strong>✍️ 주제를 입력해요</strong><span>한 줄이면 충분해요! 예) "제주도 2박3일 여행 후기"</span></div>
    </div>
    <div class="gd-step-card">
      <div class="gd-step-num">4</div>
      <div class="gd-step-body"><strong>🎯 생성 버튼 클릭!</strong><span>"✨ AI로 생성" 버튼을 누르면 20~40초 만에 결과가 나와요.</span></div>
    </div>
    <div class="gd-step-card">
      <div class="gd-step-num">5</div>
      <div class="gd-step-body"><strong>🎉 완성! 복사해서 쓰면 끝!</strong><span>📋 복사 버튼으로 클립보드에 담아서 원하는 곳에 붙여넣으면 끝이에요.</span></div>
    </div>
  </div>

  <div class="gd-panel">
    <h3>🎯 목적별 3분 가이드</h3>
    <div class="gd-grid-2">
      <div class="gd-card"><h5>📝 블로그 글 3분 만들기</h5><p style="font-size:13px">① 수익형 → 블로그/글쓰기 / ② 네이버 감성형 / ③ 주제 입력 / ④ 생성 / ⑤ 복사</p></div>
      <div class="gd-card blue"><h5>⚡ 숏츠 대본 3분 만들기</h5><p style="font-size:13px">① 대본 생성기 / ② 일반 대본 / ③ 15~30초 선택 / ④ 생성 / ⑤ 복사</p></div>
      <div class="gd-card green"><h5>🏛️ 공문서 3분 만들기</h5><p style="font-size:13px">① 공공기관 패키지 / ② 문서/보고서 / ③ 기관 유형 선택 / ④ 생성</p></div>
      <div class="gd-card peach"><h5>🍽️ 메뉴판 3분 만들기</h5><p style="font-size:13px">① 소상공인 / ② 외식업 특화 / ③ 다국어 메뉴판 / ④ 메뉴 목록 입력 / ⑤ 생성</p></div>
    </div>
  </div>`;
}

/* ─── 탭3: 📖 개념 설명 ─── */
function gdConcept(){
  window._gdInit = null;
  return `<div class="gd-panel">
    <h3>📖 초등학생도 이해하는 개념 설명</h3>
    <div class="gd-grid-2">
      <div class="gd-card">
        <span class="big-emoji">🤖</span><h5>AI가 뭔가요?</h5>
        <p style="font-size:13px"><strong>"AI는 엄청 똑똑한 친구예요"</strong></p>
        <div class="gd-before-after" style="margin-top:8px">
          <div class="gd-before">😊 보통 글쓰기<br>30분~1시간</div>
          <div class="gd-after">🤖 AI 글쓰기<br>30초~1분</div>
        </div>
        <p style="font-size:12px;margin-top:8px;color:#1a5a3a"><strong>⏰ 29분 절약!</strong></p>
      </div>
      <div class="gd-card blue">
        <span class="big-emoji">🔑</span><h5>API 키가 뭔가요?</h5>
        <p style="font-size:13px"><strong>"도서관 회원증이에요"</strong></p>
        <p style="font-size:12px">🏛️ 도서관(AI 회사)에 회원가입하면 회원증(API 키)을 줘요.</p>
        <p style="font-size:12px;color:#1f4a80"><strong>💰 비용: 글 1개 = 약 10~50원</strong></p>
      </div>
      <div class="gd-card green">
        <span class="big-emoji">✉️</span><h5>프롬프트가 뭔가요?</h5>
        <p style="font-size:13px"><strong>"AI한테 보내는 편지예요"</strong></p>
        <div class="gd-before" style="margin:6px 0">❌ 나쁜 편지<br>"블로그 글 써줘"</div>
        <div class="gd-after">✅ 좋은 편지<br>"제주도 2박3일 여행 후기를 30대 여성이 읽기 좋게 친근한 말투로 써줘"</div>
      </div>
      <div class="gd-card peach">
        <span class="big-emoji">🧑‍🏫</span><h5>AI 모델이 뭔가요?</h5>
        <p style="font-size:13px"><strong>"AI 선생님 종류예요"</strong></p>
        <ul style="font-size:12px;margin:6px 0">
          <li>🟣 <b>Claude</b> = 글쓰기 잘해요</li>
          <li>🟢 <b>GPT</b> = 다방면으로 잘해요</li>
          <li>🔵 <b>Gemini</b> = 정보검색 잘해요</li>
        </ul>
      </div>
      <div class="gd-card">
        <span class="big-emoji">🪙</span><h5>토큰이 뭔가요?</h5>
        <p style="font-size:13px"><strong>"AI가 읽는 글자 수예요"</strong></p>
        <p style="font-size:12px">짧게 핵심만 입력하면 비용 절약! 한국어 1글자 ≈ 2토큰.</p>
      </div>
    </div>
  </div>`;
}

/* ─── 탭4: 📊 Before/After ─── */
function gdBA(){
  window._gdInit = null;
  const items = [
    ['🏪 소상공인','SNS 1개 = 30분~1시간 / 전문가 5만원','3분 완성 / 월 9,900원 무제한','💰 월 최대 100만원 절약!'],
    ['🏛️ 공무원','보고서 1개 = 2~3시간 / 야근 반복','30분 완성 / 칼퇴근 가능','⏰ 월 평균 20시간 절약!'],
    ['📝 유튜버','대본 1개 = 2~4시간 / 주 2개 힘듦','30분 완성 / 주 7개 가능','📈 구독자 3배 증가 사례'],
    ['📚 학부모','숙제 도움 = 막막하고 힘듦','주제 입력 30초 / 아이 수준 맞춤','😊 아이와 즐겁게 공부']
  ];
  return `<div class="gd-panel">
    <h3>📊 Before / After 비교</h3>
    ${items.map(([t,b,a,h])=>`
      <div style="margin-bottom:14px">
        <h4>${t}</h4>
        <div class="gd-before-after">
          <div class="gd-before"><strong>❌ Before</strong><br>${b}</div>
          <div class="gd-after"><strong>✅ After</strong><br>${a}</div>
        </div>
        <div class="gd-result-box" style="margin-top:8px">${h}</div>
      </div>
    `).join('')}
  </div>`;
}

/* ─── 탭5: 💰 비용 계산기 ─── */
function gdCalc(){
  window._gdInit = gdBindCalc;
  return `<div class="gd-panel">
    <h3>💰 AI 비용 계산기</h3>
    <div class="gd-calc-row">
      <label>월 생성 횟수</label>
      <input type="range" id="calc-count" min="1" max="500" value="30" oninput="gdUpdateCalc()">
      <span class="val" id="calc-count-val">30회</span>
    </div>
    <div class="gd-result-box" id="calc-result">월 30회 기준 예상 비용을 계산 중...</div>
  </div>

  <div class="gd-panel">
    <h3>💸 절약 비용 계산기</h3>
    <div class="gd-calc-row">
      <label>직업 선택</label>
      <select class="mz-in" id="calc-job" onchange="gdUpdateSave()">
        <option value="smb">🏪 소상공인</option>
        <option value="public">🏛️ 공무원</option>
        <option value="creator">📝 크리에이터</option>
        <option value="parent">📚 학부모</option>
      </select>
    </div>
    <div class="gd-result-box" id="calc-save">직업을 선택해주세요</div>
  </div>

  <div class="gd-panel">
    <h3>📈 크리에이터 수익 계산기</h3>
    <div class="gd-calc-row">
      <label>구독자 수</label>
      <input type="number" class="mz-in" id="calc-subs" value="10000" oninput="gdUpdateRev()">
    </div>
    <div class="gd-calc-row">
      <label>월 영상 수</label>
      <input type="range" id="calc-videos" min="4" max="60" value="20" oninput="gdUpdateRev()">
      <span class="val" id="calc-videos-val">20개</span>
    </div>
    <div class="gd-calc-row">
      <label>한·일 동시운영</label>
      <select class="mz-in" id="calc-multi" onchange="gdUpdateRev()">
        <option value="1">한국만</option>
        <option value="1.8" selected>한·일 동시 (×1.8)</option>
      </select>
    </div>
    <div class="gd-result-box" id="calc-rev">계산 중...</div>
  </div>`;
}
function gdBindCalc(){ gdUpdateCalc(); gdUpdateSave(); gdUpdateRev(); }
function gdUpdateCalc(){
  const n = parseInt(document.getElementById('calc-count').value);
  document.getElementById('calc-count-val').textContent = n+'회';
  const claude = n * 30, openai = n * 15, gemini = n * 3;
  const cheapest = Math.min(claude, openai, gemini);
  const who = cheapest === gemini ? 'Gemini' : (cheapest === openai ? 'OpenAI' : 'Claude');
  document.getElementById('calc-result').innerHTML =
    `🟣 Claude: 약 <b>${claude.toLocaleString()}원</b>/월<br>🟢 OpenAI: 약 <b>${openai.toLocaleString()}원</b>/월<br>🔵 Gemini: 약 <b>${gemini.toLocaleString()}원</b>/월<br><br>💡 <b>가장 저렴한 선택: ${who}</b> (${cheapest.toLocaleString()}원)`;
}
function gdUpdateSave(){
  const job = document.getElementById('calc-job').value;
  const savings = {
    smb: {items:['SNS 대행 월 50만원','전단지 연 120만원','메뉴판 연 30만원'], total:'연 최대 720만원'},
    public: {items:['야근 월 20시간 절약','외주 보고서 연 500만원'], total:'연 최대 500만원 + 야근 240시간'},
    creator: {items:['대본 외주 월 200만원','편집 시간 50% 절감'], total:'연 최대 2,400만원'},
    parent: {items:['학습지 연 120만원','과외 일부 대체'], total:'연 최대 300만원 + 아이 시간 단축'}
  }[job];
  document.getElementById('calc-save').innerHTML = '절약 항목:<br>' + savings.items.map(i=>'• '+i).join('<br>') + `<br><br>💰 <b>합계: ${savings.total}</b>`;
}
function gdUpdateRev(){
  const subs = parseInt(document.getElementById('calc-subs').value)||0;
  const videos = parseInt(document.getElementById('calc-videos').value);
  document.getElementById('calc-videos-val').textContent = videos+'개';
  const multi = parseFloat(document.getElementById('calc-multi').value);
  const monthlyViews = subs * videos * 0.3;
  const rpm = 1500;
  const rev = Math.round(monthlyViews / 1000 * rpm * multi);
  document.getElementById('calc-rev').innerHTML =
    `예상 월 조회수: <b>${Math.round(monthlyViews).toLocaleString()}회</b><br>예상 광고 수익: <b>약 ${rev.toLocaleString()}원/월</b><br><small style="color:var(--sub)">※ 실제 수익은 콘텐츠·지역·광고단가에 따라 달라집니다</small>`;
}

/* ─── 탭6: 🏆 성공 사례 ─── */
function gdCases(){
  window._gdInit = null;
  const cases = [
    ['🏪 강남 카페 사장님','SNS 팔로워 500 → 5,000명','월매출 30% 증가','매일 30분이면 해결'],
    ['👔 동대문 쇼핑몰','상세페이지 직접 작성','전환율 2배 증가','월 200만원 대행비 절약'],
    ['🏛️ A시청 홍보팀','보도자료 3시간 → 30분','SNS 팔로워 3배 증가','칼퇴근 실현'],
    ['⚖️ 법원 조사관 B','결정전조사 4시간 → 1시간','업무 집중도 ↑','객관적 서술 품질 ↑'],
    ['👴 시니어 유튜브 C','1,000 → 10,000 구독자','한·일 동시 운영','월수익 300만원'],
    ['👩‍🏫 초등학생 엄마 D','숙제 스트레스 ↓','생활기록부 문구 완성','교사 소통 원활']
  ];
  return `<div class="gd-panel">
    <h3>🏆 실제 사용 사례</h3>
    <div class="gd-grid-2">
      ${cases.map(([t,a,b,c])=>`<div class="gd-card"><h5>${t}</h5><p style="font-size:13px;line-height:1.9">✅ ${a}<br>✅ ${b}<br>✅ ${c}</p></div>`).join('')}
    </div>
  </div>`;
}

/* ─── 탭7: 📦 패키지 비교 ─── */
function gdPkg(){
  window._gdInit = null;
  return `<div class="gd-panel">
    <h3>📦 패키지 비교 & 추천</h3>
    <div class="gd-pkg primary">
      <h4>🏪 소상공인 패키지</h4>
      <p><strong>이런 분께 딱이에요</strong></p>
      <div class="pkg-list">✅ 식당/카페/가게 운영<br>✅ SNS 올리기 힘드신 분<br>✅ 광고 문구 어려우신 분</div>
      <p style="margin-top:10px"><strong>포함 기능</strong></p>
      <div class="pkg-list">메뉴판 · SNS(월30개) · 전단지·포스터 · 리뷰 답글 자동 · 이벤트 문구</div>
      <p style="margin-top:10px"><strong>얼마나 아낄 수 있나요?</strong></p>
      <div class="gd-result-box">SNS 대행 월 30~80만원 → <b>9,900원</b><br>💰 월 최대 100만원 절약!</div>
      <p style="margin-top:10px"><strong>🎁 구매 후 받는 것</strong></p>
      <div class="pkg-list">소상공인 가이드북 · 업종별 템플릿 50개 · SNS 30일 캘린더 · 1:1 설치 지원 · 30일 환불 보장</div>
    </div>

    <div class="gd-pkg">
      <h4>🏛️ 공공기관 패키지</h4>
      <div class="pkg-list">✅ 공무원·공공기관 직원 / 보고서 작성 어려우신 분 / 법원 조사관 / 행사 담당자</div>
      <p style="margin-top:8px"><strong>포함:</strong> 정책보고서·보도자료·민원답변·법원조사서 특화·포스터·사업계획서</p>
      <div class="gd-result-box">보고서 3시간 → 30분 / 야근 월 8회 → 2회</div>
      <p style="margin-top:8px"><strong>🏢 기관 도입 혜택:</strong> 단체 라이선스 할인 · 맞춤 템플릿 · 담당자 교육 지원 · 전담 CS</p>
    </div>

    <div class="gd-pkg">
      <h4>📝 크리에이터 패키지</h4>
      <div class="pkg-list">✅ 유튜버·틱토커·인스타 크리에이터 / 한·일 동시 운영 / 다중 채널</div>
      <p style="margin-top:8px"><strong>포함:</strong> 자동숏츠 8단계 파이프라인·변환허브·감동스토리·시리즈 관리·SEO·썸네일 A/B</p>
      <div class="gd-result-box">월 영상 2개 → 7개 / 구독자 3배 증가 사례</div>
    </div>

    <div class="gd-pkg">
      <h4>📚 교육 패키지</h4>
      <div class="pkg-list">✅ 학부모 / 교사 / 학원 / 홈스쿨링</div>
      <p style="margin-top:8px"><strong>포함:</strong> 학년별 자료(초·중·고·대) · 생활기록부 특화 · AI 튜터 · 입시 전략 · 한영일 동시 학습자료</p>
    </div>

    <div class="gd-pkg">
      <h4>🏢 기업·단체 패키지</h4>
      <div class="pkg-list">✅ 기업 사내 문서 · 번역 · 마케팅 · HR</div>
      <p style="margin-top:8px"><strong>포함:</strong> 전 카테고리 무제한 · 전담 지원 · 사내 가이드·교육 세션</p>
    </div>
  </div>`;
}

/* ─── 탭8: 🔧 스마트 문제해결 ─── */
let gdTroubleAnswer = '';
function gdTrouble(){
  window._gdInit = null;
  if (!gdTroubleAnswer) {
    return `<div class="gd-panel">
      <h3>🔧 문제 해결 도우미</h3>
      <p>어떤 문제가 있으신가요? 아래에서 비슷한 것을 골라주세요.</p>
      <div class="gd-tree-btns">
        <button class="gd-tree-btn red"    onclick="gdTroubleAns('dead')">🔴 아예 안 돼요</button>
        <button class="gd-tree-btn yellow" onclick="gdTroubleAns('weird')">🟡 결과가 이상해요</button>
        <button class="gd-tree-btn orange" onclick="gdTroubleAns('short')">🟠 너무 짧게 나와요</button>
        <button class="gd-tree-btn purple" onclick="gdTroubleAns('weirdko')">🟣 한국어가 어색해요</button>
        <button class="gd-tree-btn blue"   onclick="gdTroubleAns('save')">🔵 저장이 안 돼요</button>
      </div>
    </div>

    <div class="gd-panel">
      <h3>🔍 API 오류 코드 확인</h3>
      <p>오류 코드를 붙여넣으면 원인과 해결 방법을 안내해드릴게요.</p>
      <input class="mz-in" id="gd-err-code" placeholder="예: 401 Unauthorized">
      <button class="gd-bigbtn" onclick="gdDiagnoseErr()" style="margin-top:8px">🔍 진단</button>
      <div id="gd-err-result" class="gd-result-box" style="display:none"></div>
    </div>`;
  }
  const map = {
    dead: '🔴 아예 안 돼요',
    weird: '🟡 결과가 이상해요',
    short: '🟠 너무 짧게 나와요',
    weirdko: '🟣 한국어가 어색해요',
    save: '🔵 저장이 안 돼요'
  };
  const sol = {
    dead: ['① API 키 다시 확인 (맨 앞에 sk-ant-... 또는 sk-... 로 시작하는지)','② 인터넷 연결 확인','③ 브라우저 새로고침 (F5 또는 Cmd+R)','④ 다른 브라우저(Chrome 최신)로 시도'],
    weird: ['① 주제를 더 구체적으로 입력 (3줄 이상)','② 톤·길이 설정 바꿔보기','③ "다시 생성" 버튼 3번 시도','④ 프롬프트에 "자연스럽게" 추가'],
    short: ['① "길이" 옵션을 "상세"로 변경','② 주제 입력에 "자세히", "구체적으로" 추가','③ 프리미엄 길이 옵션 사용'],
    weirdko: ['① Claude 모델 선택 (한국어 품질 최고)','② 프롬프트 끝에 "반드시 자연스러운 한국어로" 추가','③ "번역투 금지" 명시'],
    save: ['① 브라우저 설정에서 localStorage 허용 확인','② 시크릿 모드가 아닌 일반 모드에서 사용','③ 📋 복사 버튼으로 외부에 따로 저장','④ 용량 부족이면 오래된 항목 삭제']
  };
  return `<div class="gd-panel">
    <h3>${map[gdTroubleAnswer]} — 해결 방법</h3>
    <ul>${sol[gdTroubleAnswer].map(x=>`<li>${x}</li>`).join('')}</ul>
    <div class="gd-actions">
      <button class="gd-tb" onclick="gdTroubleAnswer='';renderGuide()">← 다른 문제</button>
      <button class="gd-bigbtn" onclick="alert('📧 support@example.com 으로 문의해주세요\\n또는 화면 캡처 후 커뮤니티에 올려주세요.')">😢 그래도 안 돼요 → 1:1 문의</button>
    </div>
  </div>`;
}
function gdTroubleAns(k){ gdTroubleAnswer = k; renderGuide(); }
function gdDiagnoseErr(){
  const code = document.getElementById('gd-err-code').value.trim();
  const box = document.getElementById('gd-err-result');
  const map = {
    '401':'🔑 API 키가 틀렸거나 만료됐어요. 키를 다시 복사해서 저장해보세요.',
    '429':'⏳ 요청이 너무 많아요. 잠시 후 다시 시도하세요.',
    '402':'💳 크레딧이 부족해요. AI 회사 사이트에서 결제 상태를 확인하세요.',
    '500':'🔧 AI 서버 일시 문제. 10분 후 다시 시도.',
    'cors':'🚫 브라우저 보안 문제. 최신 Chrome을 쓰거나, 모바일 사파리로 시도.',
    'network':'🌐 인터넷 연결 확인 필요.'
  };
  const lower = code.toLowerCase();
  const matched = Object.keys(map).find(k => lower.includes(k));
  box.style.display = '';
  box.textContent = matched ? map[matched] : '🤔 알 수 없는 오류예요. 메시지를 그대로 복사해서 1:1 문의해주세요.';
}

/* ─── 탭9: 🗓️ 5일 완전정복 ─── */
const COURSES = {
  smb: {title:'🏪 소상공인 코스', badge:'소상공인 마스터 🏆',
    days:[
      ['첫 SNS 게시물 만들기','⭐','30분'],
      ['메뉴판 & 전단지 만들기','⭐⭐','30분'],
      ['리뷰관리 & 고객응대 세팅','⭐⭐','30분'],
      ['한달치 SNS 캘린더','⭐⭐⭐','1시간'],
      ['수익화 & 크몽 등록','⭐⭐⭐','1시간']
    ]},
  public: {title:'🏛️ 공무원 코스', badge:'공공기관 마스터 🏆',
    days:[
      ['첫 보고서 30분에 완성','⭐','30분'],
      ['민원 답변 자동화','⭐⭐','30분'],
      ['보도자료 & SNS','⭐⭐','1시간'],
      ['행사대본 & 현수막','⭐⭐⭐','1시간'],
      ['업무 자동화 완성','⭐⭐⭐','1시간']
    ]},
  creator: {title:'📝 크리에이터 코스', badge:'크리에이터 마스터 🏆',
    days:[
      ['첫 숏츠 대본','⭐','30분'],
      ['한국+일본 동시채널','⭐⭐','1시간'],
      ['자동숏츠 파이프라인','⭐⭐⭐','1시간'],
      ['멀티플랫폼 업로드','⭐⭐⭐','1시간'],
      ['월수익 분석 & 최적화','⭐⭐⭐','1시간']
    ]},
  parent: {title:'📚 학부모 코스', badge:'학습 마스터 🏆',
    days:[
      ['숙제 도움받기','⭐','20분'],
      ['생활기록부 문구','⭐⭐','30분'],
      ['독후감/발표자료','⭐⭐','30분'],
      ['영어/일본어 학습','⭐⭐⭐','30분'],
      ['자녀 맞춤 학습 플랜','⭐⭐⭐','1시간']
    ]}
};
let gdCourseSel = 'smb';
function gdCourse(){
  window._gdInit = null;
  const p = JSON.parse(localStorage.getItem('uc_guide_course')||'{}');
  const done = p[gdCourseSel] || [];
  const c = COURSES[gdCourseSel];
  const prog = Math.round(done.length / 5 * 100);
  return `<div class="gd-panel">
    <h3>🗓️ 5일 완전정복 코스</h3>
    <div class="gd-actions">
      ${Object.keys(COURSES).map(k=>`<button class="gd-tb ${gdCourseSel===k?'':''}" style="${gdCourseSel===k?'background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent':''}" onclick="gdCourseSel='${k}';renderGuide()">${COURSES[k].title}</button>`).join('')}
    </div>
    <h4 style="margin-top:16px">${c.title}</h4>
    <div class="gd-prog"><div style="width:${prog}%"></div></div>
    <p style="font-size:13px;color:var(--sub)">진행률: ${done.length}/5일 (${prog}%)</p>
    ${c.days.map((d,i)=>{
      const isDone = done.includes(i);
      return `<div class="gd-day-card">
        <div class="gd-day-num ${isDone?'done':''}">${isDone?'✓':'D'+(i+1)}</div>
        <div class="gd-day-body"><strong>Day ${i+1}: ${d[0]}</strong><span>난이도: ${d[1]} / 소요시간: ${d[2]}</span></div>
        <button class="gd-tb" onclick="gdCourseToggle(${i})">${isDone?'완료 취소':'✅ 완료'}</button>
      </div>`;
    }).join('')}
    ${done.length===5 ? `<div class="gd-result-box" style="text-align:center;font-size:16px">🎉 축하해요! <b>${c.badge}</b> 획득!</div>` : ''}
  </div>`;
}
function gdCourseToggle(i){
  const p = JSON.parse(localStorage.getItem('uc_guide_course')||'{}');
  p[gdCourseSel] = p[gdCourseSel] || [];
  const idx = p[gdCourseSel].indexOf(i);
  if (idx>=0) p[gdCourseSel].splice(idx,1); else p[gdCourseSel].push(i);
  localStorage.setItem('uc_guide_course', JSON.stringify(p));
  renderGuide();
}

/* ─── 탭10: 💡 꿀팁 & 지원 ─── */
function gdTips(){
  window._gdInit = null;
  return `<div class="gd-panel">
    <h3>💡 꿀팁 대백과</h3>
    <details class="gd-fold" open>
      <summary>🎯 결과 품질 높이는 법</summary>
      <div class="gd-before-after" style="margin-top:8px">
        <div class="gd-before"><strong>❌ 나쁜 입력</strong><br>"카페 SNS 써줘"</div>
        <div class="gd-after"><strong>✅ 좋은 입력</strong><br>"강남역 근처 작은 카페, 시그니처 딸기라떼 신메뉴 출시, 20~30대 여성 타겟, 인스타 캡션, 친근·귀여운 말투, 해시태그 10개 포함"</div>
      </div>
    </details>
    <details class="gd-fold">
      <summary>⏰ 시간 절약 꿀팁</summary>
      <ul><li>프리셋 저장 활용 (자주 쓰는 설정)</li><li>배치 생성 (10개 한 번에)</li><li>단축키: Ctrl+C 복사 / Ctrl+S 저장</li></ul>
    </details>
    <details class="gd-fold">
      <summary>💰 비용 절약 꿀팁</summary>
      <ul><li>토큰 아끼기: 짧고 명확하게 입력</li><li>Gemini가 가장 저렴 (간단한 작업)</li><li>Claude는 품질 중요한 작업에만</li><li>무료 기능 최대 활용 (프리셋·히스토리)</li></ul>
    </details>
    <details class="gd-fold">
      <summary>💸 수익화 꿀팁</summary>
      <ul><li>크몽에 AI 대행 서비스 등록 (5만원/건부터)</li><li>가격 전략: 처음엔 낮게, 후기 쌓이면 인상</li><li>후기 받는 법: 완성 후 "별점 부탁" 정중히</li><li>패키지 업셀링: 단건 → 월 구독 유도</li></ul>
    </details>
  </div>

  <div class="gd-panel">
    <h3>🤝 고객 지원 센터</h3>
    <ul>
      <li>💬 1:1 채팅 문의 (평일 9~18시)</li>
      <li>📧 이메일 문의 (48시간 내 답변)</li>
      <li>👥 커뮤니티 참여 (질문·공유·피드백)</li>
      <li>📺 유튜브 채널 (영상 튜토리얼)</li>
      <li>🗺️ 업데이트 로드맵</li>
    </ul>
  </div>

  <div class="gd-panel">
    <h3>🛡️ 보장 정책</h3>
    <div class="gd-grid-3">
      <div class="gd-card green"><span class="big-emoji">🛡️</span><h5>30일 환불 보장</h5><p style="font-size:12px">만족 못하시면 전액 환불</p></div>
      <div class="gd-card blue"><span class="big-emoji">⚡</span><h5>99.9% 업타임</h5><p style="font-size:12px">안정적인 서비스 약속</p></div>
      <div class="gd-card peach"><span class="big-emoji">🔓</span><h5>언제든 해지</h5><p style="font-size:12px">약정·위약금 없음</p></div>
    </div>
  </div>

  <div class="gd-panel">
    <h3>🎁 구매자 전용 혜택</h3>
    <ul>
      <li>📚 전용 템플릿 라이브러리</li>
      <li>⭐ 프리미엄 프롬프트 모음</li>
      <li>🏃 우선 고객 지원 (4시간 내 답변)</li>
      <li>🚀 신기능 얼리액세스</li>
      <li>🎥 월 1회 웨비나 참여</li>
      <li>💝 업그레이드 50% 할인</li>
    </ul>
  </div>`;
}

/* ─── 가이드 내 검색 ─── */
function gdSearch(q){
  if (!q) { renderGuide(); return; }
  // 탭별로 검색 키워드가 있는 탭을 자동 선택
  const map = {
    'api키':'quick','api 키':'quick','키':'concept',
    '비용':'calc','절약':'calc','수익':'calc','돈':'calc',
    '오류':'trouble','안돼':'trouble','에러':'trouble','문제':'trouble',
    '소상공인':'pkg','공무원':'pkg','크리에이터':'pkg','학부모':'pkg','패키지':'pkg',
    '사례':'cases','성공':'cases',
    'before':'ba','after':'ba','비교':'ba',
    '코스':'course','5일':'course','뱃지':'course','마스터':'course',
    '꿀팁':'tips','지원':'tips','환불':'tips','보장':'tips',
    '시작':'quick','3분':'quick','빠른':'quick',
    '개념':'concept','ai가':'concept','프롬프트':'concept','모델':'concept','토큰':'concept',
    '마법사':'wizard','누구':'wizard','시작하기':'wizard'
  };
  const lower = q.toLowerCase();
  const found = Object.keys(map).find(k => lower.includes(k));
  if (found) { gdActive = map[found]; renderGuide(); }
}

// 부모 모드
function kParentMode(){
  const pass = prompt('🔒 부모 설정 모드\n\n부모님 확인 — 네 자리 숫자 비밀번호를 입력하세요:\n(처음이면 원하는 번호 4자리를 설정하세요)');
  if (!pass || pass.length !== 4) return;
  const stored = localStorage.getItem('uc_kids_parent_pw');
  if (!stored) { localStorage.setItem('uc_kids_parent_pw', pass); alert('✅ 비밀번호가 설정됐어요: '+pass); }
  else if (stored !== pass) { alert('❌ 비밀번호가 틀렸어요.'); return; }
  // 부모 설정 UI
  const action = prompt('🔧 부모 설정\n\n1: 사용 시간 제한 설정\n2: 포인트 초기화\n3: 뱃지 초기화\n4: 저장된 결과 삭제\n5: 비밀번호 변경\n\n번호 입력:');
  const p = _kidsPoints();
  if (action === '1') {
    const minutes = prompt('하루 최대 사용 시간(분):', '60');
    if (minutes) { localStorage.setItem('uc_kids_timelimit', minutes); alert('✅ 하루 '+minutes+'분 제한 설정됨'); }
  } else if (action === '2') { p.total = 0; p.bonus = 0; _kidsSavePoints(p); alert('✅ 포인트 초기화'); renderKidsHome(); }
  else if (action === '3') { p.badges = {}; _kidsSavePoints(p); alert('✅ 뱃지 초기화'); renderKidsHome(); }
  else if (action === '4') { localStorage.removeItem('uc_kids_saved'); alert('✅ 저장된 결과 삭제'); }
  else if (action === '5') { const np = prompt('새 비밀번호 4자리:'); if (np && np.length === 4) { localStorage.setItem('uc_kids_parent_pw', np); alert('✅ 비밀번호 변경됨'); } }
}
