/* modules/public.js — index.html에서 분리된 공공기관 패키지 모듈 */

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
