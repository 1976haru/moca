/* modules/trans.js — index.html에서 분리된 번역/통역 모듈 */

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
