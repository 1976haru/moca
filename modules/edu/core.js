/* ==================================================
   core.js  (~207 lines)
   openEdu / generateEdu / edCopy / edSave / edSendToMedia
   src: L198-404
   split_all.py
   ================================================== */

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


