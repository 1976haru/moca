/* ==================================================
   shorts.js
   Shorts pipeline core -- stepper/channel/trend/script/style/validate/SEO/batch
   extracted from index.html by split_index.py
   ================================================== */

function shPickImg(i){ shState.data.style = shState.data.style || {}; shState.data.style.imgIdx = i; renderStepContent(); }

function shPickVid(i){ shState.data.style = shState.data.style || {}; shState.data.style.vidIdx = i; renderStepContent(); }

function shSaveStyle(){ shState.data['step_4_done']=true; shSavePipeline(); renderStepper(); alert('💾 스타일 프리셋 저장됨'); }

function shLoadStylePreset(){ try{ const s=JSON.parse(localStorage.getItem('uc_shorts_pipeline')||'null'); if(s&&s.data&&s.data.style){ shState.data.style=s.data.style; renderStepContent(); alert('📥 스타일 불러옴'); } }catch(e){} }

function renderValidate1(){
  window._shInit = null;
  const hasScript = !!shState.data.script;
  return `
  <div class="sh-panel">
    <h4>⑤ 대본 품질 자동체크</h4>
    <div class="sh-checklist" id="sh-v1-checks">
      <div class="sh-check">□ 길이 적절성 (예상 ${shState.data.script ? Math.round((shState.data.script.length/8)) : '—'}초)</div>
      <div class="sh-check">□ 첫 3초 훅 강도</div>
      <div class="sh-check">□ CTA 유무</div>
      <div class="sh-check">□ 금지어·저작권 확인</div>
      <div class="sh-check">□ 자연스러운 한국어/일본어</div>
    </div>
  </div>

  <div class="sh-panel" style="background:linear-gradient(135deg,#fff5fa,#f7f4ff)">
    <h4>🔮 AI 바이럴 예측 점수</h4>
    <button class="mz-btn pri" onclick="shViralScore()" ${hasScript?'':'disabled'}>🎯 예측 실행</button>
    <div id="sh-viral-out" class="mz-out" style="min-height:160px;margin-top:8px"></div>
  </div>

  <div class="sh-panel">
    <h4>🎨 채널 적합성 체크</h4>
    <div class="sh-checklist">
      <div class="sh-check">□ 채널 톤과 일치</div>
      <div class="sh-check">□ 타겟 연령 적합</div>
      <div class="sh-check">□ 브랜드킷 반영</div>
    </div>
    <div class="actions" style="margin-top:10px">
      <button class="mz-btn sv" onclick="shMarkDone(5)">✅ 통과</button>
      <button class="mz-btn" onclick="shStep(-2)">✏️ 수정 (대본으로)</button>
      <button class="mz-btn" onclick="shGenScript()">🔄 재생성</button>
    </div>
  </div>`;
}
async function shViralScore(){
  const out = document.getElementById('sh-viral-out');
  out.textContent = '⏳ 예측 중...';
  try {
    await _syncAPIShorts();
    const sys = '당신은 숏츠 바이럴 예측가다. 아래 대본을 평가: ① 예상 시청완료율 (0~100%) ② 공유 가능성 (0~100) ③ 훅 강도 (상/중/하) ④ 경쟁 영상 대비 점수 ⑤ 개선 제안 3가지. 구조화해서 출력.';
    const r = await APIAdapter.callWithFallback(sys, shState.data.script||'', {maxTokens:1000});
    out.textContent = r;
  } catch(e){ out.textContent = '❌ '+e.message; }
}
function shMarkDone(step){ shState.data['step_'+step+'_done'] = true; renderStepper(); alert('✅ '+SH_STEPS[step].label+' 통과'); }

/* ─── 6. 미디어 생성 ─── */
function renderMediaGen(){
  window._shInit = null;
  return `
  <div class="sh-panel">
    <h4>⑥ 순서대로 자동 생성</h4>
    <div class="sh-checklist" id="sh-media-progress">
      <div class="sh-check" id="mp-voice">1. 음성 생성 (TTS/씬별 감정) — 대기</div>
      <div class="sh-check" id="mp-image">2. 이미지 프롬프트 (DALL·E 3/Ideogram/Flux 자동선택) — 대기</div>
      <div class="sh-check" id="mp-subtitle">3. 자막 파일 (.srt 타이밍 자동) — 대기</div>
      <div class="sh-check" id="mp-bgm">4. 배경음악 프롬프트 — 대기</div>
      <div class="sh-check" id="mp-thumb">5. 썸네일 (KO/JP · A/B 2버전) — 대기</div>
    </div>
    <button class="mz-btn pri" onclick="shRunMediaGen()" style="margin-top:10px">🚀 일괄 생성 시작</button>
    <textarea id="sh-media-out" class="mz-out" style="min-height:280px;margin-top:8px" readonly></textarea>
  </div>`;
}

async function shRunMediaGen(){
  const steps = ['mp-voice','mp-image','mp-subtitle','mp-bgm','mp-thumb'];
  const out = document.getElementById('sh-media-out');
  out.value = '';
  try {
    await _syncAPIShorts();
    const script = shState.data.script || '(대본 없음)';
    const sys = '숏츠 미디어 제작자다. 아래 대본 기반으로 다음 5종 전부 생성해 구조화해 출력:\n'+
      '━ 1. 음성 스크립트 (씬별 감정 태그 포함)\n'+
      '━ 2. 이미지 프롬프트 (씬별 · 공급자 추천 포함)\n'+
      '━ 3. .srt 자막 (타임코드 포함)\n'+
      '━ 4. 배경음악 Suno 프롬프트\n'+
      '━ 5. 썸네일 (KO/JP · A/B 2버전 · 문구 + 이미지 프롬프트)';
    const r = await APIAdapter.callWithFallback(sys, script, {maxTokens:6000});
    out.value = r;
    steps.forEach(id => { const el=document.getElementById(id); if(el){ el.classList.add('ok'); el.textContent = el.textContent.replace('대기','✅ 완료'); }});
    shState.data.media = r;
    shState.data['step_6_done'] = true;
    renderStepper();
  } catch(e){ out.value = '❌ '+e.message; }
}

function renderValidate2(){
  window._shInit = null;
  return `
  <div class="sh-panel">
    <h4>⑦ 완성도·정책·SEO 체크</h4>
    <div class="sh-checklist">
      <div class="sh-check">□ 대본/음성/이미지/자막/썸네일 확인</div>
      <div class="sh-check">□ 전체 길이 적절</div>
      <div class="sh-check">□ 유튜브 정책 준수</div>
      <div class="sh-check">□ 틱톡 정책 준수</div>
      <div class="sh-check">□ 인스타 정책 준수</div>
      <div class="sh-check">□ 저작권 이슈 없음</div>
    </div>
  </div>

  <div class="sh-panel" style="background:linear-gradient(135deg,#eff6ff,#fff5fa)">
    <h4>🔍 SEO 최적화 패키지</h4>
    <button class="mz-btn pri" onclick="shSeoPackage()">🎯 제목 A/B · 설명문 · 태그 30개 자동 생성</button>
    <textarea id="sh-seo-out" class="mz-out" style="min-height:260px;margin-top:8px" readonly></textarea>
    <button class="mz-btn sv" onclick="shMarkDone(7)" style="margin-top:10px">✅ 최종 승인</button>
  </div>`;
}
async function shSeoPackage(){
  const out = document.getElementById('sh-seo-out');
  out.value = '⏳ 생성 중...';
  try {
    await _syncAPIShorts();
    const sys = '숏츠 SEO 전문가다. JSON 형식으로만 출력:\n{\n  "titlesKO_A":["..."],"titlesKO_B":["..."],"titlesJP_A":["..."],"titlesJP_B":["..."],\n  "descriptionKO":"...","descriptionJP":"...",\n  "tags":["태그 30개"],\n  "hashtagsKO":["#..."],"hashtagsJP":["#..."]\n}';
    const r = await APIAdapter.callWithFallback(sys, '주제: '+(shState.data.topic||'')+'\n\n대본: '+(shState.data.script||''), {maxTokens:2000});
    out.value = r;
    shState.data.seo = r;
  } catch(e){ out.value = '❌ '+e.message; }
}

/* ─── 8. 플랫폼 업로드 ─── */
/* ═══════════════════════════════════════════════════════════

function renderBatch(){
  window._shInit = null;
  return `
  <div class="sh-panel">
    <h4>🤖 배치 생성 (주제 10개 → 영상 10개 동시)</h4>
    <textarea class="mz-in" id="sh-batch-topics" style="min-height:120px" placeholder="주제를 줄바꿈으로 입력 (최대 10개)"></textarea>
    <button class="mz-btn pri" onclick="shBatchRun()" style="margin-top:8px">🚀 일괄 생성</button>
    <textarea id="sh-batch-out" class="mz-out" style="min-height:260px;margin-top:8px" readonly></textarea>
  </div>

  <div class="sh-panel">
    <h4>📺 시리즈 자동 생성</h4>
    <div class="mz-row">
      <div><label>시리즈 이름</label><input class="mz-in" id="sh-series-name" placeholder="예: 어머니의 편지 시리즈"></div>
      <div><label>편수</label>
        <select class="mz-in" id="sh-series-count"><option>3</option><option selected>5</option><option>7</option><option>10</option></select>
      </div>
      <div><label>주제</label><input class="mz-in" id="sh-series-topic" placeholder="시리즈 전체 주제"></div>
    </div>
    <button class="mz-btn pri" onclick="shSeriesRun()" style="margin-top:8px">📺 시리즈 생성</button>
    <textarea id="sh-series-out" class="mz-out" style="min-height:200px;margin-top:8px" readonly></textarea>
  </div>

  <div class="sh-panel">
    <h4>📅 월간 콘텐츠 캘린더 (한·일 동시)</h4>
    <input class="mz-in" id="sh-cal-theme" placeholder="이번 달 테마 (예: 가을 감성·추석·건강)">
    <button class="mz-btn pri" onclick="shCalendarRun()" style="margin-top:8px">📅 30일 캘린더 생성</button>
    <textarea id="sh-cal-out" class="mz-out" style="min-height:200px;margin-top:8px" readonly></textarea>
  </div>

  <div class="sh-panel" style="background:#fff7ee;border-color:#f1e0c4">
    <h4>♻️ 재활용 시스템</h4>
    <div class="sh-card-grid">
      <button onclick="shRecycle('long2short')">🎬 롱폼 → 숏츠 분할</button>
      <button onclick="shRecycle('blog2short')">📝 블로그 → 숏츠</button>
      <button onclick="shRecycle('nl2short')">📧 뉴스레터 → 숏츠</button>
    </div>
    <label style="margin-top:8px">원본 콘텐츠</label>
    <textarea class="mz-in" id="sh-recycle-src" style="min-height:120px" placeholder="변환할 원본 붙여넣기"></textarea>
    <textarea id="sh-recycle-out" class="mz-out" style="min-height:160px;margin-top:8px" readonly></textarea>
  </div>`;
}
async function shBatchRun(){
  const topics = document.getElementById('sh-batch-topics').value.split('\n').filter(t=>t.trim()).slice(0,10);
  if(!topics.length){ alert('주제를 입력하세요.'); return; }
  const out = document.getElementById('sh-batch-out');
  out.value = '⏳ '+topics.length+'개 동시 생성 중...';
  try {
    await _syncAPIShorts();
    const sys = '숏츠 대본 작가. 30초 숏츠 대본 생성. 훅·본문·CTA 구조.';
    const tasks = topics.map(t => APIAdapter.callWithFallback(sys, '주제: '+t, {maxTokens:700}).then(r=>'━ '+t+' ━\n'+r).catch(e=>'❌ '+t+': '+e.message));
    const results = await Promise.all(tasks);
    out.value = results.join('\n\n');
  } catch(e){ out.value = '❌ '+e.message; }
}
async function shSeriesRun(){
  const name = document.getElementById('sh-series-name').value;
  const count = parseInt(document.getElementById('sh-series-count').value);
  const topic = document.getElementById('sh-series-topic').value;
  if(!name || !topic){ alert('시리즈 이름과 주제를 입력하세요.'); return; }
  const out = document.getElementById('sh-series-out');
  out.value = '⏳ 생성 중...';
  try {
    await _syncAPIShorts();
    const sys = '시리즈 '+count+'편 연속 대본 작가. 이전 편 요약·다음 편 예고가 자연스럽게 연결되게 '+count+'편 각각 30초 대본.';
    const r = await APIAdapter.callWithFallback(sys, '시리즈:'+name+'\n주제:'+topic, {maxTokens:6000});
    out.value = r;
  } catch(e){ out.value = '❌ '+e.message; }
}
async function shCalendarRun(){
  const theme = document.getElementById('sh-cal-theme').value||'자유 테마';
  const out = document.getElementById('sh-cal-out');
  out.value = '⏳ 생성 중...';
  try {
    await _syncAPIShorts();
    const sys = '한국·일본 채널용 월간 콘텐츠 캘린더 작성자. 30일치 일자별 표(날짜|한국 주제|일본 주제|해시태그). 트렌드·시즌 반영.';
    const r = await APIAdapter.callWithFallback(sys, '이번 달 테마: '+theme, {maxTokens:3500});
    out.value = r;
  } catch(e){ out.value = '❌ '+e.message; }
}
async function shRecycle(kind){
  const src = document.getElementById('sh-recycle-src').value;
  if(!src){ alert('원본을 입력하세요.'); return; }
  const out = document.getElementById('sh-recycle-out');
  out.value = '⏳ 변환 중...';
  try {
    await _syncAPIShorts();
    const map = {long2short:'롱폼 영상 대본을 30초 숏츠 3~5개로 분할', blog2short:'블로그 글을 30초 숏츠 대본으로', nl2short:'뉴스레터를 30초 숏츠 대본으로'};
    const r = await APIAdapter.callWithFallback('재활용 편집자다. '+map[kind]+'. 각 숏츠 30초 분량.', src, {maxTokens:3000});
    out.value = r;
  } catch(e){ out.value = '❌ '+e.message; }
}

/* ─── 공통 ─── */
async function _syncAPIShorts(){
  if(typeof APIAdapter==='undefined') throw new Error('api-adapter.js 미로드');
  {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
  {const v=localStorage.getItem('uc_openai_key'); if(v) APIAdapter.setApiKey('openai',v);}
  {const v=localStorage.getItem('uc_gemini_key'); if(v) APIAdapter.setApiKey('gemini',v);}
}
