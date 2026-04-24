/* ==================================================
   guide.js
   Guide mode -- wizard/quick/concept/calc/cases/trouble/course
   extracted from index.html by split_index.py
   ================================================== */

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
        if (gdUserGoal.cat === 'script' && found.tab) { if(typeof window.__hubGoCategory === 'function') window.__hubGoCategory('shorts'); }
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
