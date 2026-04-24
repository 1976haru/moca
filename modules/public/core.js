/* ==================================================
   core.js  (~182 lines)
   openPublic / generatePublic / pbCopy / pbSave / pbSendToMedia
   src: L143-324
   split_all.py
   ================================================== */

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


