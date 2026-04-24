/* ==================================================
   index.js  (~181 lines)
   PSY_META / PSY_SUBS / SEASON_BANNERS / psState
   src: L1-181
   split_all.py
   ================================================== */

/* modules/psy.js — index.html에서 분리된 심리/운세/사주 모듈 */

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


