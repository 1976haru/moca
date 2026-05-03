/* ========================================================
   core/hub.js  --  MOCA 메인 허브 (categories/cards/state/render/oneMake/unified result)
   index.html 인라인 JS에서 분리 (Phase A — hub core)
   가장 먼저 로드 (다른 모든 core/modules/shared 보다 앞)
   포함: categories·cards·state·renderSidebar/Hero/Grid/All, 허브 DOM 바인딩,
         tpPickTopic·oneMake·_one* helpers, showUnifiedResult·uni* 헬퍼,
         selectLang·initLang, 비용바·모바일UI IIFE들, generateImagesForText
   ======================================================== */

/* ─── BLOCK 1: 허브 코어 (categories / cards / state / render) ─── */
const categories = [

{id:'shorts',   icon:'📱', title:'숏츠 스튜디오',     desc:'🏆 대본·이미지·영상 올인원 (6단계)'},

{id:'remix',    icon:'🎞️', title:'영상 리믹스 스튜디오', desc:'영상·자막을 불러와 번역·각색·음성교체'},

{id:'media',    icon:'🎨', title:'콘텐츠 빌더',       desc:'글·이미지·영상 조합 완성'},

// 대본 생성기 제거 — 숏츠 스튜디오 Step2에 흡수됨
  // 콘텐츠 빌더 제거 - 기능이 모든 카테고리 미디어 바로 통합됨
  {id:'profit',   icon:'💰', title:'수익형 콘텐츠',     desc:'블로그·전자책·웹툰·SNS · 수익화'},

{id:'public',   icon:'🏛️', title:'공공기관 패키지',   desc:'보도자료·공문·회의록'},

{id:'edu',      icon:'📚', title:'학습/교육',         desc:'강의자료·퀴즈·워크북'},

{id:'trans',    icon:'🌐', title:'번역/통역/다국어',  desc:'한·영·일·중 동시 변환'},

{id:'smb',      icon:'🏪', title:'소상공인 창업 패키지', desc:'창업·운영·지원금·근로자관리'},

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
    /* ⭐ 시작 카드 3개 — 처음 사용자가 가장 먼저 봄 */
    {i:'🚀', t:'새 콘텐츠 만들기',       s:'목표만 입력하면 AI가 구성을 추천합니다',
      bg:'bg-pink',  tag:'⭐ 시작', section:'start',
      url:'engines/media/index.html?mode=builder&tab=t1'},
    {i:'📥', t:'카테고리 결과 가져오기', s:'다른 카테고리 초안·소재로 완성 콘텐츠 조립',
      bg:'bg-mint',  tag:'⭐ 시작', section:'start',
      url:'engines/media/index.html?mode=builder&tab=t1&source=draft'},
    {i:'🕒', t:'이어 만들기',            s:'최근 작업 불러와 편집 계속',
      bg:'bg-purple',tag:'⭐ 시작', section:'start',
      url:'engines/media/index.html?mode=builder&tab=t1&resume=1'},

    /* 🎯 단계형 워크플로우 0~7 (8개 카드) */
    {i:'🏠', t:'0. 대시보드',         s:'새 콘텐츠 시작·최근 작업·가져오기',
      bg:'bg-blue',  tag:'단계', section:'step',
      url:'engines/media/index.html?mode=builder&tab=t1'},
    {i:'📥', t:'1. 소스 가져오기',    s:'목표 입력·글 붙여넣기·카테고리 결과 불러오기',
      bg:'bg-mint',  tag:'단계', section:'step',
      url:'engines/media/index.html?mode=builder&tab=t1'},
    {i:'🍳', t:'2. 레시피·템플릿',     s:'AI 추천 패키지와 콘텐츠 형식 선택',
      bg:'bg-pink',  tag:'단계', section:'step',
      url:'engines/media/index.html?mode=builder&tab=t2'},
    {i:'🧱', t:'3. 블록 구성',        s:'제목·본문·이미지 자리·CTA 자동 배치',
      bg:'bg-purple',tag:'단계', section:'step',
      url:'engines/media/index.html?mode=builder&tab=t4'},
    {i:'🖼', t:'4. 미디어 채우기',    s:'이미지·영상·음성·자막·썸네일 슬롯 채우기',
      bg:'bg-peach', tag:'단계', section:'step',
      url:'engines/media/index.html?mode=builder&tab=t5'},
    {i:'🎨', t:'5. 디자인·브랜드',    s:'문체·색상·플랫폼·이미지 스타일 적용',
      bg:'bg-green', tag:'단계', section:'step',
      url:'engines/media/index.html?mode=builder&tab=t6'},
    {i:'👁', t:'6. 미리보기·품질검수',s:'모바일·SNS·블로그 미리보기와 품질 점수',
      bg:'bg-pink',  tag:'단계', section:'step',
      url:'engines/media/index.html?mode=builder&tab=t7'},
    {i:'📦', t:'7. 출력·패키지',      s:'전체 복사·플랫폼별·HTML/Markdown·JSON',
      bg:'bg-purple',tag:'단계', section:'step',
      url:'engines/media/index.html?mode=builder&tab=t8'},

    /* 🧰 보조 도구함 (음성·자막·썸네일·영상 보조 기능, 사용자 친화 이름) */
    {i:'🎤', t:'파일/외부툴 변환',  s:'ElevenLabs·InVideo 변환 허브',
      bg:'bg-peach', tag:'🧰 보조', section:'tool', engine:'script',tab:'hub',
      url:'engines/media/index.html?mode=wizard'},
    {i:'🖼️', t:'썸네일 만들기',     s:'CTR 높은 썸네일 자동화',
      bg:'bg-pink',  tag:'🧰 보조', section:'tool',
      url:'engines/media/index.html?mode=wizard'},
    {i:'🎥', t:'영상 조립하기',     s:'장면별 영상 자동 편집',
      bg:'bg-purple',tag:'🧰 보조', section:'tool',
      url:'engines/media/index.html?mode=wizard'},
    {i:'💬', t:'자막 만들기',       s:'SRT·VTT 자동 생성',
      bg:'bg-green', tag:'🧰 보조', section:'tool',
      url:'engines/media/index.html?mode=wizard'},
    {i:'🎙️', t:'음성 만들기',       s:'TTS·ElevenLabs 연동',
      bg:'bg-blue',  tag:'🧰 보조', section:'tool',
      url:'engines/media/index.html?mode=wizard'},
    {i:'🎞️', t:'영상 비율 맞추기',  s:'프레임/구조 변환',
      bg:'bg-mint',  tag:'🧰 보조', section:'tool',
      url:'engines/media/index.html?mode=wizard'},
    {i:'🎨', t:'스타일 빠른 적용',  s:'채널별 톤앤매너 프리셋',
      bg:'bg-pink',  tag:'🧰 보조', section:'tool',
      url:'engines/media/index.html?mode=wizard'}
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
    {i:'🤖',t:'자동화 패키지 ⭐',   s:'월간SNS·리뷰답글·고객시퀀스·경쟁사',     bg:'bg-blue',  tag:'자동', smbId:'auto'},
    {i:'🚀',t:'창업 준비 ⭐',        s:'사업계획서·상권분석·프랜차이즈·인허가',  bg:'bg-peach', tag:'창업', smbId:'startup'},
    {i:'💸',t:'정부지원금 레이더 ⭐⭐', s:'맞춤검색·신청서·심사대응·알림',        bg:'bg-green', tag:'지원금',smbId:'subsidy'},
    {i:'👨‍💼',t:'근로자 관리 ⭐',     s:'근로계약·4대보험·최저임금·해고절차',    bg:'bg-mint',  tag:'근로', smbId:'labor'},
    {i:'⚖️',t:'법률/계약서 ⭐',      s:'임대차·상표·손해배상·폐업·권리금',       bg:'bg-pink',  tag:'법률', smbId:'legal'}
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
    {i:'🏠', t:'대시보드',        s:'진행 현황·빠른 시작',             bg:'bg-pink',   tag:'홈',    shStep:0},
    {i:'①',  t:'대본 생성',       s:'언어·장르·트렌드·주제·훅·대본',   bg:'bg-green',  tag:'Step1', shStep:1},
    {i:'②',  t:'이미지 생성',     s:'씬별 이미지·썸네일·스타일',       bg:'bg-blue',   tag:'Step2', shStep:2},
    {i:'③',  t:'음성·BGM',        s:'TTS·성우·배경음악',               bg:'bg-purple', tag:'Step3', shStep:3},
    {i:'④',  t:'편집',            s:'자막·전환·템플릿·브랜딩',         bg:'bg-peach',  tag:'Step4', shStep:4},
    {i:'⑤',  t:'최종검수·업로드', s:'제목·SEO·해시태그·출력',          bg:'bg-mint',   tag:'Step5', shStep:5}
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

let state = { category:'script', mode:'normal', studioOpen:false };

window.__hubState = state;

window.__hubGoCategory = function(id){ state.category = id; state.studioOpen = false; if(typeof renderAll==='function') renderAll(); };

function renderSidebar(){
  const box = document.getElementById('sidebar');
  box.innerHTML = '';
  categories.forEach(c => {
    const b = document.createElement('button');
    b.className = 'sidebtn' + (state.category === c.id ? ' on' : '');
    b.innerHTML = `<div class="ico">${c.icon}</div><div class="tx"><strong>${c.title}</strong><span>${c.desc}</span></div>`;
    b.onclick = () => { state.category = c.id; state.studioOpen = false; renderAll(); };
    box.appendChild(b);
  });
}

function renderHero(){
  const c = categories.find(x => x.id === state.category);
  const hub = document.getElementById('oneHub');
  // 카테고리 미선택 = 홈 = 카테고리 그리드만 노출 (one-hub 제거됨)
  if(!c){
    if(hub) hub.style.display = 'none';
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

  // 🎞 영상 리믹스 스튜디오 — 별도 엔진 페이지로 이동
  if (state.category === 'remix' && state.mode === 'normal') {
    window.location.href = 'engines/remix/index.html';
    return;
  }
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
  // 📱 숏츠 스튜디오 (자동숏츠 카테고리) — 7단계 올인원
  if (state.category === 'shorts' && state.mode === 'normal') {
    const sd = document.getElementById('studioDetail');
    if(state.studioOpen === true){
      /* 카드 클릭 후: 스튜디오 본체 표시 */
      if(hero) hero.style.display = 'none';
      if(gridEl) gridEl.style.display = 'none';
      if(sd){ sd.classList.remove('hide'); if(typeof renderStudio === 'function') renderStudio(); }
      return;
    }
    /* 기본: 카드 목록 표시 (studioDetail 숨김, 아래 카드 그리드 렌더 경로로 진입) */
    if(sd) sd.classList.add('hide');
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

  /* media 카테고리는 section(start/step/tool) 별로 그룹 + 도구함은 details 접기 */
  if (state.category === 'media' && list.some(c => c.section)) {
    return _renderMediaGrid(g, list);
  }

  list.forEach(c => {
    const b = document.createElement('button');
    b.className = 'q ' + c.bg;
    b.innerHTML = `<span class="tag">${c.tag}</span><div class="i">${c.i}</div><strong>${c.t}</strong><span>${c.s}</span>`;
    b.onclick = () => {
      /* c.url 이 있으면 최우선 — 직접 이동 (콘텐츠 빌더 카드 등) */
      if (c.url) { location.href = c.url; return; }
      const targetEngine = c.engine || state.category;
      if ((targetEngine === 'script') && c.tab) {
        // 대본 생성기는 iframe으로만 사용 — 숏츠 스튜디오로 라우팅
        if(typeof window.__hubGoCategory === 'function') window.__hubGoCategory('shorts');
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
        openStudio(c.shStep);
      } else {
        alert(`"${c.t}" 선택됨\n(연결될 엔진: ${targetEngine})`);
      }
    };
    g.appendChild(b);
  });
}

/* ── media 전용 그리드 — 시작/단계/보조 도구함 (3구간) ── */
function _renderMediaGrid(g, list) {
  const start = list.filter(c => c.section === 'start');
  const step  = list.filter(c => c.section === 'step');
  const tool  = list.filter(c => c.section === 'tool');

  /* g 는 grid 컨테이너 — innerHTML 으로 한 번에 그리고, 그리드 column-span으로 헤더/접기 처리 */
  g.innerHTML = '';
  g.style.gridColumn = ''; /* reset */

  /* 안내문 (전폭) */
  const intro = document.createElement('div');
  intro.style.cssText = 'grid-column:1/-1;padding:14px 16px;background:linear-gradient(135deg,#fff5fa,#f5f0ff);' +
    'border:1.5px solid #ead9e1;border-radius:14px;margin-bottom:6px;color:#5b1a4a;line-height:1.6';
  intro.innerHTML =
    '<div style="font-size:14px;font-weight:900;margin-bottom:4px">🎨 콘텐츠 빌더</div>' +
    '<div style="font-size:12.5px;color:#7b4060">글·이미지·영상 조합을 하나의 콘텐츠 패키지로 완성합니다. ' +
      '초안·소재·이미지·영상 아이디어를 가져와 블로그·상세페이지·카드뉴스·뉴스레터·포스터·SNS 패키지로 조립하세요.</div>' +
    '<div style="margin-top:8px;font-size:11.5px;color:#9b6f7e">' +
      '💡 처음이라면 <b>새 콘텐츠 만들기</b>부터 시작하세요. 이미 다른 카테고리에서 만든 결과가 있다면 <b>카테고리 결과 가져오기</b>를 누르세요.' +
    '</div>';
  g.appendChild(intro);

  /* 시작 카드 (그리드 안에 직접) */
  start.forEach(c => g.appendChild(_makeCardBtn(c)));

  /* 단계 헤더 (전폭) */
  const stepHd = document.createElement('div');
  stepHd.style.cssText = 'grid-column:1/-1;padding:8px 0 4px;font-size:13px;font-weight:800;color:#5b1a4a;margin-top:8px';
  stepHd.innerHTML = '🎯 단계별 워크플로우 — 왼쪽부터 순서대로 진행하면 됩니다';
  g.appendChild(stepHd);

  /* 단계 카드 */
  step.forEach(c => g.appendChild(_makeCardBtn(c)));

  /* 보조 도구함 (전폭, details 접기) */
  const tools = document.createElement('details');
  tools.style.cssText = 'grid-column:1/-1;margin-top:14px;background:#fbf7f9;border:1.5px solid #ead9e1;border-radius:14px;padding:0';
  tools.innerHTML =
    '<summary style="padding:14px 16px;cursor:pointer;font-size:13px;font-weight:800;color:#5b1a4a;list-style:none;display:flex;align-items:center;justify-content:space-between">' +
      '<span>🧰 보조 도구함 — 음성·자막·썸네일·영상 보조 기능 (필요할 때만)</span>' +
      '<span style="font-size:11px;color:#9b6f7e;font-weight:600">처음에는 열지 않아도 됩니다 ▼</span>' +
    '</summary>' +
    '<div id="cbToolsGrid" style="padding:0 16px 16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px"></div>';
  g.appendChild(tools);
  const toolsGrid = tools.querySelector('#cbToolsGrid');
  tool.forEach(c => toolsGrid.appendChild(_makeCardBtn(c)));

  /* 하단 안내 (전폭) */
  const foot = document.createElement('div');
  foot.style.cssText = 'grid-column:1/-1;margin-top:10px;font-size:11.5px;color:#9b6f7e;text-align:center';
  foot.textContent = '개별 음성·자막·썸네일 작업만 필요하면 보조 도구함을 열어 사용하세요.';
  g.appendChild(foot);
}

/* 카드 버튼 생성 (기존 클릭 라우팅과 동일) */
function _makeCardBtn(c) {
  const b = document.createElement('button');
  b.className = 'q ' + (c.bg || '');
  b.innerHTML = `<span class="tag">${c.tag||''}</span><div class="i">${c.i||''}</div><strong>${c.t||''}</strong><span>${c.s||''}</span>`;
  b.onclick = () => {
    if (c.url) { location.href = c.url; return; }
    /* 기존 라우팅 fallback (다른 카테고리와 동일) */
    if (state.category === 'monetize' || state.category === 'profit') {
      if (typeof openBuilder === 'function' && c.bldId) return openBuilder(c);
    }
    alert(`"${c.t}" 선택됨`);
  };
  return b;
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
    const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Pretendard,sans-serif;max-width:700px;margin:0 auto;padding:32px 20px;line-height:1.8}
/* ═══ studioS4 v2 CSS ═══ */
.s4-panel{padding:14px;background:#fff;border-radius:16px;border:1px solid var(--line,#f1dce7);font-family:inherit}
.s4-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.s4-api-row{background:#f9f3fb;border-radius:12px;padding:8px 10px;margin-bottom:12px}
.s4-label{font-size:11.5px;font-weight:800;color:#7b7077;min-width:80px;white-space:nowrap}
.s4-seg{display:flex;gap:2px;flex-wrap:wrap}
.s4-seg-btn{border:1px solid #f1dce7;background:#fff;border-radius:8px;padding:5px 12px;font-size:11px;font-weight:700;color:#7b7077;cursor:pointer;transition:.12s}
.s4-seg-btn.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.s4-ai-chip{background:#fffbe8;border:1.5px solid #f5c518;border-radius:20px;padding:4px 12px;font-size:11px;font-weight:800;color:#8a6800;cursor:pointer;margin-left:auto;transition:.12s}
.s4-ai-chip:hover{background:#f5c518;color:#fff}
.s4-genre-chips{display:flex;gap:4px;flex-wrap:wrap}
.s4-chip{border:1px solid #f1dce7;background:#fff;border-radius:20px;padding:4px 10px;font-size:11px;cursor:pointer;transition:.12s}
.s4-chip.on{background:#fff1f8;border-color:#ef6fab;color:#d4357a;font-weight:800}
.s4-section-hd{display:flex;align-items:center;justify-content:space-between;margin:10px 0 6px}
.s4-section-title{font-size:12px;font-weight:800;color:#2b2430}
.s4-mini-btn{border:1.5px solid #f1dce7;background:#fff;border-radius:8px;padding:3px 10px;font-size:11px;cursor:pointer;font-weight:700;transition:.12s}
.s4-mini-btn:hover{border-color:#ef6fab;color:#ef6fab}
.s4-mini-btn.danger{border-color:#fca5a5;color:#dc2626}
.s4-mini-btn.primary{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
/* 화자 카드 */
.s4-speakers{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-bottom:4px}
.s4-sp-card{border:1.5px solid #f1dce7;border-radius:12px;padding:10px;background:#eff6ff;position:relative}
.s4-sp-card.active-sp{border-color:#9181ff;background:#ede9ff}
.s4-sp-badge{display:inline-block;font-size:10px;font-weight:800;color:#9181ff;background:#ede9ff;border-radius:20px;padding:1px 8px;margin-bottom:6px}
.s4-sp-role{width:100%;border:none;border-bottom:1.5px solid #f1dce7;background:transparent;font-size:12px;font-weight:700;outline:none;padding:2px 0;margin-bottom:6px;color:#2b2430}
.s4-sp-voice-name{font-size:11px;font-weight:700;margin-bottom:4px}
.s4-sp-tag{font-size:9px;background:#f0fdf4;color:#16a34a;border-radius:20px;padding:1px 6px;margin-left:4px}
.s4-sp-sel{width:100%;border:1px solid #f1dce7;border-radius:8px;padding:3px 6px;font-size:10.5px;background:#fff}
.s4-sp-click-hint{font-size:9px;color:#9181ff;margin-top:4px;text-align:center}
/* 음성 그리드 */
.s4-filter-bar{display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-bottom:6px}
.s4-filter{border:1px solid #f1dce7;background:#fff;border-radius:20px;padding:3px 9px;font-size:11px;cursor:pointer;transition:.12s}
.s4-filter.on{background:#ef6fab;color:#fff;border-color:#ef6fab}
.s4-fsep{color:#f1dce7;margin:0 2px}
.s4-voice-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(82px,1fr));gap:5px;max-height:200px;overflow-y:auto;margin-bottom:12px;padding:2px}
.s4-vc{border:1.5px solid #f1dce7;border-radius:10px;padding:7px 5px;text-align:center;cursor:pointer;transition:.14s;background:#fff;user-select:none}
.s4-vc:hover{border-color:#ef6fab;background:#fff1f8}
.s4-vc.active{border-color:#9181ff;background:#ede9ff}
.s4-vc-ico{font-size:16px;margin-bottom:1px}
.s4-vc-name{font-size:10.5px;font-weight:800;margin:1px 0}
.s4-vc-mood{font-size:9px;color:#7b7077}
.s4-vc-prov{font-size:8px;background:#f1dce7;border-radius:4px;padding:1px 5px;margin-top:2px;display:inline-block}
/* 씬 그리드 */
.s4-scene-grid{display:flex;flex-direction:column;gap:3px;margin-bottom:12px}
.s4-scene-row{display:grid;grid-template-columns:28px minmax(0,1fr) 44px 110px;align-items:center;gap:5px;padding:5px 8px;background:#f9f3fb;border-radius:8px;border:1px solid #f1dce7;transition:.12s}
.s4-scene-row:hover{background:#fff1f8;border-color:#ef6fab}
.s4-sc-num{font-size:10.5px;font-weight:800;color:#9181ff}
.s4-sc-label{font-size:11px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.s4-sc-role{font-size:10px;background:#fff;border-radius:20px;padding:1px 5px;border:1px solid #f1dce7;text-align:center;font-weight:700}
.s4-sc-sel{border:1px solid #f1dce7;border-radius:6px;padding:2px 4px;font-size:10px;background:#fff;width:100%}
.s4-empty-hint{font-size:12px;color:#7b7077;text-align:center;padding:16px;background:#f9f3fb;border-radius:10px}

</style></head><body>${body?.innerHTML||''}</body></html>`;
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

/* ═══════════════════════════════════════════════

/* ─── BLOCK 2: 비용 바 · 모바일 UI · uni* 히스토리 · 이미지 생성 ─── */
/* ═══════════════════════════════════════════════

💰 상단 비용 바 · ⚙️ 설정 모드 구현
   =============================================== */

/* ─── 잔액 확인 링크 ─── */

function openBalanceLinks(){
  const html = '🔗 각 서비스 콘솔에서 정확한 잔액을 확인할 수 있어요.\n\n' +
    '🟣 Claude:  console.anthropic.com\n' +
    '🟢 OpenAI:  platform.openai.com/usage\n' +
    '🔵 Gemini:  aistudio.google.com\n\n' +
    '지금 Claude 콘솔을 열까요?';
  if (confirm(html)) window.open('https://console.anthropic.com/', '_blank');
}

/* ─── 비용 바 업데이트 ─── */
function updateCostBar(){
  if (typeof CostTracker === 'undefined') return;
  const s = CostTracker.getStatus();
  const bar = document.getElementById('costBar'); if (!bar) return;
  const today = document.getElementById('cb-today');
  const month = document.getElementById('cb-month');
  const pct   = document.getElementById('cb-pct');
  const aiDot = document.getElementById('cb-ai-dot');
  const aiName= document.getElementById('cb-ai-name');

  if (today) today.textContent = Math.round(s.todayKRW).toLocaleString() + '원';
  if (month) month.textContent = Math.round(s.monthKRW).toLocaleString() + '원';
  if (pct)   pct.textContent   = '(' + Math.round(s.usedPct) + '%)';

  // 상태 색상
  bar.classList.remove('warn','block');
  if (s.level === 'warn') bar.classList.add('warn');
  if (s.level === 'block') bar.classList.add('block');

  // 연결된 AI 표시
  const provider = localStorage.getItem('uc_ai_provider') || 'claude';
  const keys = {
    claude: localStorage.getItem('uc_claude_key'),
    openai: localStorage.getItem('uc_openai_key'),
    gemini: localStorage.getItem('uc_gemini_key')
  };
  const names = {claude:'🟣 Claude', openai:'🟢 OpenAI', gemini:'🔵 Gemini'};
  if (aiName && aiDot) {
    if (keys[provider]) { aiName.textContent = names[provider]+' 연결됨'; aiDot.textContent='🟢'; }
    else { aiName.textContent = (names[provider]||'AI')+' 미연결'; aiDot.textContent='🔴'; }
  }
}

if (typeof CostTracker !== 'undefined') {
  CostTracker.onUpdate(updateCostBar);
}

updateCostBar();

// 390px 모바일: 햄버거 버튼으로 사이드바 토글
(function setupMobileSidebarToggle(){
  if (document.querySelector('.mobile-sidebar-toggle')) return;
  var btn = document.createElement('button');
  btn.className = 'mobile-sidebar-toggle';
  btn.type = 'button';
  btn.textContent = '☰';
  btn.setAttribute('aria-label','메뉴 열기');
  btn.addEventListener('click', function(){ document.body.classList.toggle('sidebar-open'); });
  document.body.appendChild(btn);
  // 사이드바 항목 클릭 시 자동 닫힘
  document.addEventListener('click', function(e){
    if(!document.body.classList.contains('sidebar-open')) return;
    var sb = document.getElementById('sidebar');
    if(sb && sb.contains(e.target) && e.target.closest('button,a')){
      document.body.classList.remove('sidebar-open');
    } else if(e.target === document.body){
      document.body.classList.remove('sidebar-open');
    }
  });
})();

/* ═══════════════════════════════════════════════════════════

📱 모바일 하단 네비게이션 + 키보드 감지 + 스와이프 + 이미지 long-press
   ═══════════════════════════════════════════════════════════ */
(function setupMobileNav(){
  if(document.getElementById('mobileNav')) return;
  var nav = document.createElement('div');
  nav.id = 'mobileNav';
  nav.className = 'mobile-nav';
  nav.innerHTML =
    '<button data-nav="home"    class="on"><span class="ico">🏠</span><span class="lbl">홈</span></button>' +
    '<button data-nav="create"><span class="ico">✍️</span><span class="lbl">생성</span></button>' +
    '<button data-nav="library"><span class="ico">📁</span><span class="lbl">보관함</span></button>' +
    '<button data-nav="setting"><span class="ico">⚙️</span><span class="lbl">설정</span></button>';
  document.body.appendChild(nav);
  nav.querySelectorAll('button').forEach(function(btn){
    btn.addEventListener('click', function(){
      nav.querySelectorAll('button').forEach(function(x){ x.classList.remove('on'); });
      btn.classList.add('on');
      var tab = btn.getAttribute('data-nav');
      if(tab === 'home'){
        state.category = null; state.mode = 'normal';
        document.querySelectorAll('.toptab').forEach(function(t){ if(t.dataset.mode) t.classList.toggle('on', t.dataset.mode === 'normal'); });
        if(typeof renderAll === 'function') renderAll();
        document.getElementById('oneHub')?.scrollIntoView({behavior:'smooth', block:'start'});
      } else if(tab === 'create'){
        document.getElementById('one-input')?.focus();
        document.getElementById('oneHub')?.scrollIntoView({behavior:'smooth', block:'start'});
      } else if(tab === 'library'){
        state.category = 'library'; state.mode = 'normal';
        if(typeof renderAll === 'function') renderAll();
      } else if(tab === 'setting'){
        var t = document.querySelector('.toptab[data-mode="setting"]');
        if(t) t.click();
      }
    });
  });
})();

/* 키보드 열림/닫힘 감지 (모바일) — input/textarea focus 기준 */

(function keyboardDetect(){
  if(!('ontouchstart' in window)) return;
  var ifocus = function(){ document.body.classList.add('kb-open'); };
  var iblur  = function(){ document.body.classList.remove('kb-open'); };
  document.addEventListener('focusin',  function(e){ if(['INPUT','TEXTAREA'].includes(e.target.tagName)) ifocus(); });
  document.addEventListener('focusout', function(e){ if(['INPUT','TEXTAREA'].includes(e.target.tagName)) setTimeout(iblur, 150); });
})();

/* 스와이프 제스처 (결과 영역) — 좌우 스와이프로 이력 탐색 */
(function swipeResult(){
  var startX = 0, startY = 0, active = false;
  document.addEventListener('touchstart', function(e){
    var t = e.target.closest('.uni-result, .one-result, .uni-body');
    if(!t) return;
    active = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', function(e){
    if(!active) return;
    active = false;
    var dx = (e.changedTouches[0].clientX - startX);
    var dy = (e.changedTouches[0].clientY - startY);
    if(Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if(dx < 0){ if(typeof uniNavigate === 'function') uniNavigate(+1); } // 왼쪽 스와이프 → 다음
    else      { if(typeof uniNavigate === 'function') uniNavigate(-1); } // 오른쪽 스와이프 → 이전
  }, { passive: true });
})();

// 결과 히스토리 보관
window._uniHistory = [];

window._uniHistoryIdx = -1;

var _origShowUniRes = window.showUnifiedResult;

window.showUnifiedResult = function(opts){
  if(_origShowUniRes) _origShowUniRes(opts);
  try{
    window._uniHistory.push(opts);
    if(window._uniHistory.length > 20) window._uniHistory.shift();
    window._uniHistoryIdx = window._uniHistory.length - 1;
  }catch(_){}
};

function uniNavigate(delta){
  var h = window._uniHistory||[];
  if(!h.length) return;
  var next = Math.max(0, Math.min(h.length-1, window._uniHistoryIdx + delta));
  if(next === window._uniHistoryIdx) return;
  window._uniHistoryIdx = next;
  if(_origShowUniRes) _origShowUniRes(h[next]);
}

/* 이미지 long-press 저장 팝업 (모바일) */

(function imageLongPress(){
  var timer = null, target = null;
  document.addEventListener('touchstart', function(e){
    var img = e.target.closest('.uni-body img, .bld-block-img img, .bld-canvas img');
    if(!img) return;
    target = img;
    timer = setTimeout(function(){
      if(!target) return;
      if(confirm('🖼 이 이미지를 저장할까요?')){
        var a = document.createElement('a');
        a.href = target.src; a.download = 'image.png'; a.target = '_blank'; a.click();
      }
    }, 600);
  }, { passive: true });
  document.addEventListener('touchend', function(){ clearTimeout(timer); target = null; });
  document.addEventListener('touchmove', function(){ clearTimeout(timer); target = null; });
})();

/* 공통 이미지 생성 (= generateContentImages 의 별칭 · 프롬프트가 이미 포함된 텍스트면 그대로, 없으면 섹션에서 추출) */
async function generateImagesForText(text, styleHint, category, count, onProgress){
  // [IMAGE: ...] 마커가 없으면 섹션(빈 줄 단위)에서 간단 프롬프트 자동 생성
  if(!/\[IMAGE:\s/.test(text||'')){
    const sections = String(text||'').split(/\n\s*\n/).filter(s => s.trim().length > 40).slice(0, count || 3);
    text = sections.map(s => s + '\n[IMAGE: ' + s.replace(/\n/g,' ').slice(0,120) + ']').join('\n\n');
  }
  return generateContentImages(text, styleHint, category, count, onProgress);
}
