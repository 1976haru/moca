/* ==================================================
   core.js  (~201 lines)
   openTrans / generateTrans / trCopy / trSave / trDownloadSrt
   src: L172-372
   split_all.py
   ================================================== */

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


