/* ==================================================
   core.js  (~210 lines)
   openPsy / generatePsy / psCopy / psSave / psShare / psSendToMedia
   src: L182-391
   split_all.py
   ================================================== */

function openPsy(card){
  psState.groupId = card.psyId;
  psState.subId = null;
  const meta = PSY_META[card.psyId];
  document.getElementById('ps-ico').textContent   = meta.ico;
  document.getElementById('ps-title').textContent = meta.title;
  document.getElementById('ps-desc').textContent  = '유형을 선택하고 정보를 입력하세요.';

  // 시즌 배너
  const banner = document.getElementById('ps-banner');
  if (SEASON_BANNERS) {
    banner.style.display = '';
    banner.style.background = SEASON_BANNERS.bg;
    banner.style.color = SEASON_BANNERS.color;
    banner.style.border = '1px solid ' + SEASON_BANNERS.color + '33';
    banner.textContent = SEASON_BANNERS.text;
  } else {
    banner.style.display = 'none';
  }

  // 프리미엄 잠금
  document.getElementById('ps-premium-lock').style.display = meta.premium ? '' : 'none';

  // 서브 렌더
  const subBox = document.getElementById('ps-subs');
  subBox.innerHTML = '';
  (PSY_SUBS[card.psyId]||[]).forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'mz-sub-btn' + (s.premium?' soon':'');
    btn.innerHTML = s.name + (s.premium?' 💎':'') + '<small>' + s.hint + '</small>';
    btn.onclick = () => {
      psState.subId = s.id;
      subBox.querySelectorAll('.mz-sub-btn').forEach(x=>x.classList.remove('on'));
      btn.classList.add('on');
      togglePsFields(s.type || meta.type);
      document.getElementById('ps-premium-lock').style.display = (s.premium || meta.premium) ? '' : 'none';
    };
    subBox.appendChild(btn);
  });
  const first = (PSY_SUBS[card.psyId]||[])[0];
  if (first) {
    psState.subId = first.id;
    subBox.querySelector('.mz-sub-btn')?.classList.add('on');
    togglePsFields(first.type || meta.type);
  }

  // 뷰 전환
  document.querySelector('.hero').style.display = 'none';
  document.getElementById('grid').style.display = 'none';
  ['monetizeDetail','publicDetail','eduDetail','transDetail','smbDetail'].forEach(id=>document.getElementById(id)?.classList.add('hide'));
  document.getElementById('psyDetail').classList.remove('hide');
  document.getElementById('ps-out').value = '';
  document.getElementById('ps-status').textContent = '';
}

function closePsy(){
  document.getElementById('psyDetail').classList.add('hide');
  document.querySelector('.hero').style.display = '';
  document.getElementById('grid').style.display = '';
  psState = { groupId:null, subId:null };
}

function togglePsFields(type){
  ['birth','mbti','tarot','naming','subject'].forEach(t => {
    const el = document.getElementById('ps-'+t+'-box');
    if (el) el.style.display = (type === t) ? '' : 'none';
  });
}

function _getPsSub(){
  if(!psState.groupId || !psState.subId) return null;
  return (PSY_SUBS[psState.groupId]||[]).find(s => s.id === psState.subId);
}

async function generatePsy(){
  const sub = _getPsSub();
  if (!sub) { alert('세부 유형을 먼저 선택하세요.'); return; }
  const topic  = document.getElementById('ps-topic').value.trim();
  const lang   = document.getElementById('ps-lang').value;
  const length = document.getElementById('ps-length').value;
  const tone   = document.getElementById('ps-tone').value;

  // 특화 입력 조립
  const meta = PSY_META[psState.groupId];
  const fieldType = sub.type || meta.type;
  let extra = '';
  if (fieldType === 'birth') {
    extra += '\n[생년월일 정보]\n'+
      '본인: '+document.getElementById('ps-birth1').value+' '+document.getElementById('ps-birth1-time').value+' '+document.getElementById('ps-birth1-sex').value+'\n'+
      '상대: '+document.getElementById('ps-birth2').value+' '+document.getElementById('ps-birth2-time').value+' '+document.getElementById('ps-birth2-sex').value;
  }
  if (fieldType === 'mbti') {
    extra += '\n[MBTI]\n본인: '+document.getElementById('ps-mbti-me').value+'\n상대: '+document.getElementById('ps-mbti-other').value+'\n관계: '+document.getElementById('ps-mbti-rel').value;
  }
  if (fieldType === 'tarot') {
    extra += '\n[타로]\n스프레드: '+document.getElementById('ps-tarot-spread').value+'\n분야: '+document.getElementById('ps-tarot-area').value+
      '\n※ 카드는 AI가 무작위로 뽑아 제시하고 의미·위치·통합 해석을 제공.';
  }
  if (fieldType === 'naming') {
    extra += '\n[작명 조건]\n'+
      '유형: '+document.getElementById('ps-name-type').value+'\n'+
      '성별: '+document.getElementById('ps-name-sex').value+'\n'+
      '성(姓): '+document.getElementById('ps-name-family').value+'\n'+
      '선호: '+document.getElementById('ps-name-pref').value;
  }
  if (fieldType === 'subject') {
    extra += '\n[대상 정보]\n'+
      '이름: '+document.getElementById('ps-sub-name').value+'\n'+
      '생년월일: '+document.getElementById('ps-sub-birth').value+'\n'+
      '추가: '+document.getElementById('ps-sub-extra').value+'\n'+
      '꿈/태몽: '+document.getElementById('ps-sub-dream').value;
  }

  const toneMap = {warm:'따뜻·친근', mystic:'신비·진지', fun:'재미·가벼움', pro:'전문·객관'};
  const langList = {
    'ko':    [['ko','한국어','한국어로만']],
    'ko+ja': [['ko','한국어','한국어로만'],['ja','日本語','日本語のみ']],
    'ko+en': [['ko','한국어','한국어로만'],['en','English','English only']],
    'all':   [['ko','한국어','한국어로만'],['ja','日本語','日本語のみ'],['en','English','English only']]
  }[lang];

  const baseSystem =
    '당신은 심리·운세·사주·작명 전문 상담가다. 과학적 근거가 약한 전통 해석임을 이해하고, 내담자에게 상처를 주지 않도록 조심스럽게 안내한다.\n' +
    '카테고리: ' + meta.title + '\n' +
    '세부 유형: ' + sub.name + '\n' +
    '규칙: ' + sub.prompt + '\n' +
    '톤: ' + toneMap[tone] + '\n' +
    '상세 수준: ' + {short:'300자',mid:'1,000자',long:'2,500자',premium:'5,000자+'}[length] + '\n' +
    '단정적 운명론 대신 가능성·조언 중심. 의학·법률 결정이 필요한 사안은 전문가 상담을 권유.';

  const user = '질문/주제: ' + (topic||'(자유)') + extra;

  const btn = document.getElementById('ps-gen');
  const out = document.getElementById('ps-out');
  const status = document.getElementById('ps-status');
  btn.disabled = true; btn.textContent = '⏳ 생성 중...';
  status.textContent = '생성 중... (' + (langList.length>1?langList.length+'개 언어':'한국어') + ')';
  out.value = '';

  try {
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
    {const v=localStorage.getItem('uc_openai_key'); if(v) APIAdapter.setApiKey('openai',v);}
    {const v=localStorage.getItem('uc_gemini_key'); if(v) APIAdapter.setApiKey('gemini',v);}

    const maxTok = {short:900, mid:2000, long:4000, premium:7000}[length];
    const tasks = langList.map(([c, label, inst]) =>
      APIAdapter.callWithFallback(baseSystem + '\n[언어 지시] ' + inst, user, {maxTokens:maxTok})
        .then(r => ({label, text:r}))
        .catch(e => ({label, text:'❌ '+e.message}))
    );
    const results = await Promise.all(tasks);
    out.value = results.map(r => '━━━━━━━━━━ ' + r.label + ' ━━━━━━━━━━\n' + r.text).join('\n\n');
    status.textContent = '✅ 생성 완료 (' + toneMap[tone] + ' · ' + results.length + '개 언어)';
  } catch (err) {
    out.value = '❌ 오류: ' + err.message;
    status.textContent = '❌ ' + err.message;
  } finally {
    btn.disabled = false; btn.textContent = '✨ AI로 생성';
  }
}

function psCopy(){
  const t = document.getElementById('ps-out').value;
  if (!t) { alert('복사할 내용이 없습니다.'); return; }
  navigator.clipboard.writeText(t).then(()=>{
    document.getElementById('ps-status').textContent = '📋 클립보드에 복사되었습니다.';
  });
}
function psSave(){
  const t = document.getElementById('ps-out').value;
  if (!t) { alert('저장할 내용이 없습니다.'); return; }
  const sub = _getPsSub();
  const list = JSON.parse(localStorage.getItem('uc_psy_saved')||'[]');
  list.unshift({
    at: Date.now(),
    group: psState.groupId, sub: sub?.id, subName: sub?.name,
    topic: document.getElementById('ps-topic').value,
    body:  t
  });
  localStorage.setItem('uc_psy_saved', JSON.stringify(list.slice(0,50)));
  document.getElementById('ps-status').textContent = '💾 저장됨 (localStorage · 최근 50개 유지)';
}
function psShare(){
  const t = document.getElementById('ps-out').value;
  if (!t) { alert('먼저 결과를 생성해주세요.'); return; }
  // 공유용 요약 (너무 길지 않게)
  const sub = _getPsSub();
  const title = (sub?.name || '운세 결과');
  const summary = t.slice(0, 200).replace(/\n+/g,' ').trim() + (t.length>200?'…':'');
  const shareText = '✨ [' + title + ']\n\n' + summary + '\n\n— 통합 콘텐츠 생성기';
  if (navigator.share) {
    navigator.share({ title: title, text: shareText }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(shareText).then(()=>{
      alert('📤 공유 텍스트가 클립보드에 복사됐습니다.\n인스타·트위터·카톡에 붙여넣기 해주세요.');
    });
  }
}
function psSendToMedia(){
  const t = document.getElementById('ps-out').value;
  if (!t) { alert('먼저 결과를 생성해주세요.'); return; }
  const list = JSON.parse(localStorage.getItem('hub_scripts_v1')||'[]');
  const sub = _getPsSub();
  list.unshift({ source:'psy', lang:'ko', text:t, at:Date.now(), meta:{group:psState.groupId, sub:sub?.id} });
  localStorage.setItem('hub_scripts_v1', JSON.stringify(list.slice(0,30)));
  if (confirm('🎬 미디어 엔진으로 전송했습니다.\n\n운세 영상·SNS 이미지로 만들어보시겠어요?')) {
    location.href = 'engines/media/index.html?tab=oneclick';
  }
}


