/* ==================================================
   index.js  (~197 lines)
   EDU_META / EDU_SUBS / GRADE_LABEL / edState
   src: L1-197
   split_all.py
   ================================================== */

/* modules/edu.js — index.html에서 분리된 학습/교육 모듈 */

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


