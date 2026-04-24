/* ==================================================
   subsidy.js  (~114 lines)
   지원금 조건·검색·저장·알림·팝업
   src: L420-533
   split_all.py
   ================================================== */

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


