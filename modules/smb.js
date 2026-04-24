/* modules/smb.js — index.html에서 분리된 소상공인 패키지 모듈
   의존: state, cards, renderAll (index.html 인라인 스크립트)
         APIAdapter (core/api-adapter.js)
*/

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
  auto:      {ico:'🤖',title:'자동화 패키지'},
  startup:   {ico:'🚀',title:'창업 준비'},
  subsidy:   {ico:'💰',title:'정부지원금 레이더'},
  labor:     {ico:'👔',title:'근로자 관리'},
  legal:     {ico:'⚖️',title:'법무·위기 대응'}
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
  ],
  startup:[
    {id:'biz-plan-gov',    name:'정부제출용 사업계획서',   hint:'소진공·창진원 양식',  type:'startup',  prompt:'정부 제출용 사업계획서. 창업 아이템·시장분석·경쟁사·수익모델·마케팅전략·재무계획·대표자 역량. 소상공인진흥공단 양식 기준.'},
    {id:'biz-plan-invest', name:'투자유치용 사업계획서',   hint:'IR 피칭덱',             type:'startup',  prompt:'투자유치용 사업계획서(IR). 문제정의·솔루션·시장규모·비즈니스모델·팀 소개·재무전망·투자요청 금액 포함.'},
    {id:'market-analysis', name:'시장·상권 분석 보고서',   hint:'창업 전 필수',          type:'startup',  prompt:'시장·상권 분석 보고서. 상권 반경·유동인구·경쟁업체 수·임대료 수준·타겟 고객 분석·입지 적합도 평가.'},
    {id:'biz-validate',    name:'창업 아이템 검증 리포트', hint:'SWOT + 검증',           type:'startup',  prompt:'창업 아이템 검증 리포트. SWOT 분석·린캔버스·최소기능제품(MVP) 계획·리스크 체크리스트·월손익분기점 계산.'},
    {id:'biz-reg-guide',   name:'사업자 등록 가이드',       hint:'개인·법인 비교',        type:'startup',  prompt:'사업자 등록 가이드. 개인사업자 vs 법인 장단점 비교·업종코드 선택·세금 유형(간이·일반)·등록 순서·필요 서류 체크리스트.'},
    {id:'franchise-guide', name:'프랜차이즈 계약 체크리스트', hint:'가맹 전 필수',         type:'startup',  prompt:'프랜차이즈 가맹 계약 체크리스트. 계약서 핵심 조항·로열티·영업지역·해지 조건·정보공개서 확인 포인트·주의사항.'},
    {id:'startup-costs',   name:'창업 비용 계산서',         hint:'초기자금 설계',         type:'startup',  prompt:'창업 비용 계산서. 인테리어·기기·보증금·초도물품·인허가·마케팅·예비비 항목별 예산표 + 자금조달 계획.'},
    {id:'permit-guide',    name:'인허가·신고 가이드',       hint:'업종별 필수 인허가',     type:'startup',  prompt:'업종별 인허가·신고 안내. 식품영업신고·위생교육·소방·건축·전기안전검사 등 필요 인허가 목록 + 신청 순서.'}
  ],
  subsidy:[
    {id:'subsidy-radar',   name:'🔍 내 조건 맞춤 지원금 검색', hint:'지역·연령·업종 입력',  type:'subsidy-search', prompt:''},
    {id:'subsidy-youth',   name:'청년 창업 지원금 안내문',   hint:'만39세 이하',          type:'subsidy', prompt:'청년 창업 지원금 신청 안내문. 대상(만39세 이하)·지원금액·신청기간·필요서류·선정기준·유의사항. 희망리턴패키지·청년창업사관학교·지역별 청년지원금 포함.'},
    {id:'subsidy-return',  name:'희망리턴패키지 신청서',     hint:'폐업·재창업',          type:'subsidy', prompt:'희망리턴패키지 신청서 작성 도우미. 사업정리 컨설팅·철거비 지원·취업연계 신청서. 지원 대상 조건·신청 절차·필요 서류 포함.'},
    {id:'subsidy-policy',  name:'소상공인 정책자금 신청 가이드', hint:'저금리 대출',       type:'subsidy', prompt:'소상공인 정책자금(저금리 대출) 신청 가이드. 일반경영안정자금·성장촉진자금·특별경영안정자금 종류·금리·한도·신청조건·서류 안내.'},
    {id:'subsidy-apply',   name:'지원금 자기소개서 AI 작성',  hint:'공고별 맞춤',          type:'subsidy', prompt:'지원금 신청용 자기소개서. 창업 동기·아이템 차별성·시장성·대표자 역량·지역사회 기여도. 공고별 키워드 맞춤 작성.'},
    {id:'subsidy-woman',   name:'여성 창업 패키지 안내',      hint:'여성기업 인증',        type:'subsidy', prompt:'여성 창업 지원 패키지 안내. 여성기업 확인제도·여성창업경진대회·여성경제인협회 지원사업·신청 방법.'},
    {id:'subsidy-senior',  name:'시니어 창업 지원 안내',      hint:'50세 이상',            type:'subsidy', prompt:'시니어(50세 이상) 창업 지원 안내. 신중년 창업 패키지·사회적기업 지원·장년창업지원센터·은퇴 후 창업 지원사업.'},
    {id:'subsidy-local',   name:'지역별 특화 지원사업 안내',  hint:'시·도별',             type:'subsidy', prompt:'지역별 소상공인·창업 지원사업 목록. 경기도·서울·부산·인천·대구·광주·대전·울산·강원·충청·전라·경상·제주 주요 지원사업 정리.'}
  ],
  labor:[
    {id:'contract-full',   name:'정규직 근로계약서',       hint:'최저임금 자동반영', type:'labor', prompt:'정규직 근로계약서. 2025년 최저임금(10,030원) 자동 반영. 계약기간·근무장소·업무내용·근로시간·임금·휴가·4대보험·퇴직금 포함.'},
    {id:'contract-part',   name:'파트타임 근로계약서',     hint:'주휴수당 포함',     type:'labor', prompt:'파트타임 근로계약서. 시급·주간 근로시간·주휴수당 자동 계산·4대보험 적용 여부 안내 포함.'},
    {id:'contract-short',  name:'단기 알바 근로계약서',     hint:'일용직',            type:'labor', prompt:'단기(일용직) 근로계약서. 1일 단위 계약·일당·업무 내용·근로시간·퇴직금 미발생 안내.'},
    {id:'salary-statement',name:'급여명세서 자동생성',      hint:'공제항목 포함',     type:'labor', prompt:'급여명세서. 기본급·연장수당·야간수당·휴일수당·식대·교통비 지급항목 + 국민연금·건강보험·고용보험·소득세 공제항목 자동 계산표.'},
    {id:'wage-calc',       name:'각종 수당 계산 가이드',     hint:'연장·야간·휴일',    type:'labor', prompt:'각종 수당 계산 가이드. 연장근로수당(1.5배)·야간수당(0.5배)·휴일수당(1.5~2배)·주휴수당 계산 방법 + 실제 계산 예시.'},
    {id:'insurance-guide', name:'4대보험 가입 가이드',      hint:'사업주·직원',       type:'labor', prompt:'4대보험(국민연금·건강보험·고용보험·산재보험) 가입 가이드. 사업주·직원 부담률·신고 기한·가입 제외 대상 안내.'},
    {id:'job-posting',     name:'채용공고문 작성',           hint:'잡코리아·알바몬',   type:'labor', prompt:'채용공고문. 업종·업무내용·근무조건·급여·복리후생·지원 방법. 잡코리아·알바몬·사람인 최적화 버전.'},
    {id:'interview-q',     name:'면접 질문지',               hint:'업종별 맞춤',       type:'labor', prompt:'면접 질문지. 공통 질문(10개) + 업종별 특화 질문(5개). 평가 기준·체크리스트 포함.'},
    {id:'work-manual',     name:'직원 업무 매뉴얼',          hint:'신입 온보딩',       type:'labor', prompt:'신입 직원 업무 매뉴얼. 매장 소개·기본 인사법·업무 프로세스·위생 규칙·비상 대응·FAQ. 업종별 맞춤.'},
    {id:'severance-guide', name:'퇴직금·해고 가이드',       hint:'분쟁 방지',         type:'labor', prompt:'퇴직금·해고 관련 가이드. 퇴직금 계산법·지급 기한·해고 예고·해고 금지 기간·해고예고수당·부당해고 대응 방법.'}
  ],
  legal:[
    {id:'lease-check',     name:'임대차 계약 체크리스트',    hint:'상가임대차보호법',   type:'legal', prompt:'상가 임대차 계약 체크리스트. 보증금·월세·계약기간·권리금·계약갱신요구권·임대료 인상률 상한(5%)·특약사항 주의 포인트.'},
    {id:'keymoney-guide',  name:'권리금 계약서·가이드',      hint:'권리금 분쟁 방지',   type:'legal', prompt:'권리금 계약서 및 가이드. 권리금 종류(영업·시설·바닥)·계약서 필수 항목·임대인 방해 금지·권리금 회수 방법.'},
    {id:'supply-contract', name:'납품·용역 계약서',          hint:'거래처 분쟁 방지',   type:'legal', prompt:'납품·용역 계약서. 계약 목적·금액·납기·검수조건·하자보증·지체상금·계약 해지 조건·분쟁해결 방법.'},
    {id:'certi-letter',    name:'내용증명 작성',             hint:'법적 효력',          type:'legal', prompt:'내용증명 작성. 발송 목적·사실관계·요구사항·이행 기한·미이행 시 조치. 미지급 대금·계약 위반·환불 거부 등 상황별 템플릿.'},
    {id:'refund-policy',   name:'환불·교환 정책 작성',       hint:'소비자분쟁 예방',    type:'legal', prompt:'환불·교환 정책. 환불 가능 기간·조건·절차·예외사항·소비자분쟁해결기준 기반. 온라인·오프라인 버전 분리.'},
    {id:'terms-of-service',name:'이용약관·개인정보처리방침', hint:'법적 필수',         type:'legal', prompt:'이용약관 및 개인정보처리방침. 개인정보보호법 기준·수집항목·보유기간·제3자 제공·처리 위탁·정보주체 권리 안내.'},
    {id:'crisis-response', name:'경영 위기 대응 가이드',     hint:'자금난·매출급감',    type:'legal', prompt:'경영 위기 대응 가이드. 긴급경영안정자금 신청·채무조정(신용회복위원회)·소상공인 컨설팅 연계 기관 목록·폐업 절차.'},
    {id:'closure-guide',   name:'폐업 절차·지원 가이드',     hint:'희망리턴패키지 연계',type:'legal', prompt:'폐업 절차 가이드. 세무서 폐업신고·4대보험 탈퇴·임대차 종료·희망리턴패키지 신청 방법·폐업 후 실업급여·재창업 준비.'},
    {id:'trademark-guide', name:'상표 등록 가이드',          hint:'브랜드 보호',        type:'legal', prompt:'상표 등록 가이드. 등록 필요성·출원 절차·비용·유사 상표 조회 방법·상표권 침해 대응·특허청 활용법.'}
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
  ['fund','calendar','menu','cs','subsidy'].forEach(t => {
    const el = document.getElementById('sm-'+t+'-box');
    if (!el) return;
    const match = (t === 'subsidy') ? (type === 'subsidy-search') : (type === t);
    el.style.display = match ? '' : 'none';
  });
  // 지원금 레이더는 생성 버튼 숨김(전용 버튼 사용)
  const genBtn = document.getElementById('sm-gen');
  const out    = document.getElementById('sm-out');
  if (genBtn) genBtn.style.display = (type === 'subsidy-search') ? 'none' : '';
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
   🔍 정부지원금 레이더 — 조건 기반 맞춤 검색
   =============================================== */
function _getSubsidyCondition(){
  return {
    region:   document.getElementById('sm-sub-region')?.value   || '전국',
    age:      document.getElementById('sm-sub-age')?.value      || '전체',
    status:   document.getElementById('sm-sub-status')?.value   || '1년 이내',
    industry: document.getElementById('sm-sub-industry')?.value || '전체',
    type:     document.getElementById('sm-sub-type')?.value     || '전체',
    special:  document.getElementById('sm-sub-special')?.value  || '없음'
  };
}

function smbSaveSubsidyCondition(){
  const cond = _getSubsidyCondition();
  localStorage.setItem('sh_subsidy_condition', JSON.stringify({ ...cond, savedAt: Date.now() }));
  const st = document.getElementById('sm-status');
  if (st) st.textContent = '💾 조건 저장 완료. 다음 접속 시 맞춤 지원금을 알려드립니다.';
}

async function smbDoSubsidySearch(){
  const cond = _getSubsidyCondition();
  localStorage.setItem('sh_subsidy_condition', JSON.stringify({ ...cond, savedAt: Date.now() }));

  const out    = document.getElementById('sm-out');
  const status = document.getElementById('sm-status');
  out.value = '';
  status.textContent = '🔍 조건에 맞는 지원금을 검색 중...';

  const sys = '당신은 대한민국 중소기업·소상공인 정부지원금 전문 컨설턴트다. ' +
              '2026년 4월 기준으로 실제 운영 중이거나 상시 모집되는 지원금·정책자금·보조금을 안내한다. ' +
              '허위·폐지 사업을 현행처럼 단정하지 말고, 불확실하면 "확인 필요"로 표기한다.';

  const user =
    '[신청자 조건]\n' +
    '• 지역: ' + cond.region + '\n' +
    '• 연령대: ' + cond.age + '\n' +
    '• 창업 단계: ' + cond.status + '\n' +
    '• 업종: ' + cond.industry + '\n' +
    '• 지원 종류: ' + cond.type + '\n' +
    '• 특별 조건: ' + cond.special + '\n\n' +
    '[요청]\n' +
    '위 조건에 해당할 가능성이 높은 지원사업을 5~8개 제시하라. 각 항목은 아래 표 형식으로 출력한다.\n\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '[1] 지원사업명 (주관 기관)\n' +
    '💰 지원 규모: (금액·한도)\n' +
    '🎯 지원 대상: (요건 3~4줄)\n' +
    '📅 신청 기간: (상시/특정월 — 불확실 시 "확인 필요")\n' +
    '✅ 적합도: ★★★★★ (조건 일치 이유 1줄)\n' +
    '📝 신청 방법: (온라인 주소·창구 — 확실한 것만)\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
    '마지막에 "⚠️ 최종 신청 전 반드시 소상공인시장진흥공단(1357) 또는 기업마당(www.bizinfo.go.kr)에서 재확인하세요." 라는 안내 문구를 추가하라.';

  try {
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
    {const v=localStorage.getItem('uc_openai_key'); if(v) APIAdapter.setApiKey('openai',v);}
    {const v=localStorage.getItem('uc_gemini_key'); if(v) APIAdapter.setApiKey('gemini',v);}
    const r = await APIAdapter.callWithFallback(sys, user, { maxTokens: 4000 });
    out.value = r;
    status.textContent = '✅ 맞춤 지원금 검색 완료 — 신청 전 관할 기관 재확인 필수';
  } catch (err) {
    out.value = '❌ 오류: ' + err.message;
    status.textContent = '❌ ' + err.message;
  }
}

/* 로그인(첫 진입) 시 저장된 조건이 있으면 팝업 알림 */
function smbCheckSubsidyAlert(){
  try {
    const raw = localStorage.getItem('sh_subsidy_condition');
    if (!raw) return;
    const cond = JSON.parse(raw);
    if (!cond || !cond.savedAt) return;
    // 24시간 내 이미 알림 띄웠으면 스킵
    const lastShown = +(localStorage.getItem('sh_subsidy_alert_shown')||0);
    if (Date.now() - lastShown < 24*60*60*1000) return;

    if (document.getElementById('subsidyAlertPop')) return;
    const pop = document.createElement('div');
    pop.id = 'subsidyAlertPop';
    pop.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:9999;width:340px;'+
      'background:linear-gradient(135deg,#fef3c7,#fde68a);border:2px solid #f59e0b;'+
      'border-radius:18px;padding:16px 18px;box-shadow:0 20px 60px rgba(245,158,11,.35);'+
      'font-family:inherit;animation:slideInRight .4s ease';
    pop.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">'+
      '  <div style="font-weight:900;font-size:14px;color:#92400e">🔔 저장된 조건 맞춤 지원금</div>'+
      '  <button onclick="document.getElementById(\'subsidyAlertPop\').remove()" style="background:none;border:0;font-size:18px;cursor:pointer;color:#92400e">×</button>'+
      '</div>'+
      '<div style="margin-top:6px;font-size:12px;color:#78350f;line-height:1.5">'+
      '  저장된 조건: <b>'+cond.region+'</b> · '+cond.age+' · '+cond.status+' · '+cond.industry+'<br>'+
      '  <span style="color:#b45309">지금 확인할 수 있는 지원금이 있을 수 있습니다.</span>'+
      '</div>'+
      '<div style="margin-top:10px;display:flex;gap:6px">'+
      '  <button onclick="smbGoSubsidyFromPop()" style="flex:1;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:0;padding:9px 10px;border-radius:10px;font-weight:800;cursor:pointer;font-size:12px">🔍 지원금 전체 보기</button>'+
      '  <button onclick="document.getElementById(\'subsidyAlertPop\').remove()" style="background:#fff;border:1px solid #f59e0b;color:#92400e;padding:9px 10px;border-radius:10px;font-weight:700;cursor:pointer;font-size:12px">나중에</button>'+
      '</div>';
    document.body.appendChild(pop);
    localStorage.setItem('sh_subsidy_alert_shown', String(Date.now()));
  } catch(e){ /* 무시 */ }
}

function smbGoSubsidyFromPop(){
  document.getElementById('subsidyAlertPop')?.remove();
  state.category = 'smb';
  if (typeof renderAll === 'function') renderAll();
  // smb 카드 중 subsidy 그룹 카드 찾아 열기
  setTimeout(()=>{
    const card = (cards.smb||[]).find(c => c.smbId === 'subsidy');
    if (card && typeof openSmb === 'function') openSmb(card);
  }, 300);
}

// 페이지 로드 3초 후 알림 체크
window.addEventListener('load', () => setTimeout(smbCheckSubsidyAlert, 3000));
