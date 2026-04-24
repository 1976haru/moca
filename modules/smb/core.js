/* ==================================================
   core.js  (~209 lines)
   openSmb / generateSmb / smCopy / smSave / smSendToMedia
   src: L211-419
   split_all.py
   ================================================== */

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


