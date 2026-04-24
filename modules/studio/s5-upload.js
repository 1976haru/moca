/* ================================================
   s5-upload.js
   STEP7 final-check+export / full-auto mode
   modules/studio/ -- split_studio2.py
   ================================================ */

/* ═════════════ STEP 7 최종검수·출력 ═════════════ */
function _studioS7(){
  const p = STUDIO.project;
  const sKo = p.s7.scoreKo || {};
  const sJa = p.s7.scoreJa || {};
  const titles = p.s7.titles || [];
  const hashKo = (p.s7.hashtags?.ko || []).join(' ');
  const hashJa = (p.s7.hashtags?.ja || []).join(' ');
  return '<div class="studio-panel">' +
    '<h4>⑦ 최종 검수 · 출력</h4>' +

    '<div class="studio-actions">' +
      '<button class="studio-btn pri" onclick="studioS7Evaluate()">🤖 AI 종합 평가</button>' +
      '<button class="studio-btn ghost" onclick="studioS7GenTitles()">📝 제목 3안 + A/B</button>' +
      '<button class="studio-btn ghost" onclick="studioS7GenTags()">🏷 해시태그 자동</button>' +
    '</div>' +

    (p.channel !== 'ja' && Object.keys(sKo).length ? '<h4 style="margin-top:12px">🇰🇷 한국어 평가</h4>' + _studioScoreTable(sKo) : '') +
    (p.channel !== 'ko' && Object.keys(sJa).length ? '<h4 style="margin-top:12px">🇯🇵 일본어 평가</h4>' + _studioScoreTable(sJa) : '') +

    (titles.length ? '<h4 style="margin-top:12px">📝 제목 3안</h4><ol style="padding-left:20px">' +
      titles.map(t => '<li style="padding:4px 0;font-size:13.5px">' + t + '</li>').join('') + '</ol>' : '') +

    (hashKo ? '<h4 style="margin-top:12px">🏷 해시태그</h4>' +
      (hashKo ? '<div>🇰🇷 ' + hashKo + '</div>' : '') +
      (hashJa ? '<div>🇯🇵 ' + hashJa + '</div>' : '') : '') +

    '<div class="studio-panel" style="background:#fff5fa;margin-top:14px">' +
      '<h4 style="margin:0 0 8px">🔁 어느 단계든 바로 이동 (피드백 루프)</h4>' +
      '<div class="studio-chips">' +
        [1,2,3,4,5].map(n => '<button class="studio-chip" onclick="studioGoto(' + n + ')">Step ' + n + '</button>').join('') +
      '</div>' +
    '</div>' +

    '<div class="studio-actions" style="margin-top:14px">' +
      '<button class="studio-btn pri" onclick="studioS7Export(\'json\')">💾 프로젝트 저장 (JSON)</button>' +
      '<button class="studio-btn ghost" onclick="studioS7Export(\'download\')">⬇️ 전체 다운로드</button>' +
      '<button class="studio-btn ghost" onclick="studioS7Export(\'upload\')">📺 업로드 가이드</button>' +
      '<button class="studio-btn ok" onclick="studioS7Finalize()">🎉 완성 · 대시보드로</button>' +
    '</div>' +
  '</div>';
}
function _studioScoreTable(s){
  const items = [['hook','훅 강도'],['structure','구조'],['clarity','명확성'],['emotion','감정'],['cta','CTA'],['length','길이'],['viral','바이럴']];
  return '<div class="studio-row">' + items.map(([k,l]) =>
    '<div style="background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 10px;text-align:center">' +
      '<div style="font-size:18px;font-weight:900;color:var(--pink-deep)">' + (s[k]||0) + '</div>' +
      '<div style="font-size:11px;color:var(--sub)">' + l + '</div>' +
    '</div>'
  ).join('') + '</div>';
}
function _studioBindS7(){}
async function studioS7Evaluate(){
  const p = STUDIO.project;
  try{
    const sys = '유튜브 숏츠 대본 7개 항목 평가 (각 0~100): hook, structure, clarity, emotion, cta, length, viral. JSON만: {"hook":숫자,"structure":...,"suggestions":["제안1","제안2","제안3"]}';
    if(p.channel !== 'ja' && p.s2.scriptKo){
      const res = await APIAdapter.callWithFallback(sys, p.s2.scriptKo.slice(0,3000), { maxTokens:500 });
      const m = res.match(/\{[\s\S]*\}/); if(m) p.s7.scoreKo = JSON.parse(m[0]);
    }
    if(p.channel !== 'ko' && p.s2.scriptJa){
      const res = await APIAdapter.callWithFallback(sys, p.s2.scriptJa.slice(0,3000), { maxTokens:500 });
      const m = res.match(/\{[\s\S]*\}/); if(m) p.s7.scoreJa = JSON.parse(m[0]);
    }
    studioSave(); renderStudio();
  }catch(e){ alert('❌ ' + e.message); }
}
async function studioS7GenTitles(){
  const p = STUDIO.project;
  try{
    const sys = '유튜브 숏츠 제목 3안 생성 (A/B 테스트용). JSON 배열: ["제목1","제목2","제목3"]';
    const res = await APIAdapter.callWithFallback(sys, '주제: ' + p.s1.topic + ' / 장르: ' + p.s1.genre, { maxTokens:400 });
    const m = res.match(/\[[\s\S]*\]/); if(m) p.s7.titles = JSON.parse(m[0]);
    studioSave(); renderStudio();
  }catch(e){ alert('❌ ' + e.message); }
}
async function studioS7GenTags(){
  const p = STUDIO.project;
  try{
    const sys = '유튜브 숏츠 해시태그 15~20개 생성. JSON만: {"ko":["#tag1",...],"ja":["#tag1",...]}';
    const res = await APIAdapter.callWithFallback(sys, '주제: ' + p.s1.topic, { maxTokens:500 });
    const m = res.match(/\{[\s\S]*\}/); if(m) p.s7.hashtags = JSON.parse(m[0]);
    studioSave(); renderStudio();
  }catch(e){ alert('❌ ' + e.message); }
}
function studioS7Export(mode){
  const p = STUDIO.project;
  if(mode === 'json'){
    const blob = new Blob([JSON.stringify(p, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=(p.name||p.s1.topic||'project')+'.json'; a.click();
    URL.revokeObjectURL(url);
  } else if(mode === 'download'){
    alert('⬇️ 영상 파일은 자동 렌더링 엔진 연결 후 사용 가능합니다\n현재 프로젝트 JSON + 대본 텍스트 + 이미지 URL 은 ⬇️ JSON 저장 으로 받을 수 있어요');
  } else if(mode === 'upload'){
    alert('📺 업로드 가이드:\n\n1. 프로젝트 JSON 다운로드\n2. CapCut/Premiere 에서 이미지+음성+자막 조립\n3. 유튜브 업로드 시:\n   • 제목: Step7 제목 3안 중 선택\n   • 설명: 대본 요약\n   • 태그: Step7 해시태그');
  }
}
function studioS7Finalize(){
  STUDIO.project.step = 0;
  studioSave();
  alert('🎉 "' + (STUDIO.project.s1.topic||'프로젝트') + '" 완성!\n대시보드에서 다시 볼 수 있어요.');
  renderStudio();
}

/* ═════════════ 전자동 모드 ═════════════ */
async function studioRunFullAuto(){
  alert('⚡ 전자동 모드 시작\n\n주제를 입력해주세요 (Step1)');
}

/* 자동저장 타이머 */
setInterval(() => {
  if(STUDIO.project && STUDIO.project.step > 0 && !document.getElementById('studioDetail').classList.contains('hide')){
    studioSave();
  }
}, 20000);


