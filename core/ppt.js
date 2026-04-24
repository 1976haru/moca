/* ========================================================
/*    core/ppt.js  --  PPT 빌더 + 구 숏츠 스튜디오 + kidsSanitize
   index.html 인라인 블록 1에서 통째 분리 (Phase B)
   주의: 이 블록의 shortsDetail 관련 함수들은 redirect 이후 대부분 미호출 (dead code)
   ======================================================== */

/* (original HTML-level section header for this block was here) */
const PPT_TYPES = {

policy: { label:'제도/정책 설명', focus:'새 제도 도입 취지, 주요 변경점, 수혜 대상, 적용 일정, 문의처를 슬라이드 구조로 풀어서 설명. 복잡한 제도는 표·플로우 삽입 제안.' },

report: { label:'업무 보고',      focus:'주간/월간/연간 업무 보고 구조. 추진 실적, 주요 성과(KPI), 애로사항, 향후 계획, 건의사항.' },

event:  { label:'행사/이벤트 안내', focus:'행사 개요(일시·장소·대상), 프로그램 순서, 참가 방법, 주의사항, 문의처. 시민 친화적인 톤.' },

edu:    { label:'교육/연수',      focus:'학습 목표, 차시·챕터 개요, 핵심 개념 설명, 사례/예시, 실습·토의 자료, 마무리 퀴즈.' },

perf:   { label:'성과 보고',      focus:'사업 배경, 추진 경과, 정량/정성 성과(지표·예산 집행률), 시사점, 향후 확산 방안.' },

promo:  { label:'홍보',           focus:'기관 비전, 핵심 사업, 주요 서비스, 시민 혜택, 연락처·채널. 임팩트 있는 헤드라인과 비주얼 중심.' }

};
const PPT_AUDIENCE = {

internal: '내부 직원 대상. 전문 용어 사용 가능, 행정 절차·일정 구체적으로.',

citizen:  '주민/시민 대상. 쉬운 공공언어, 한자어 풀어 쓰기, 혜택·참여 방법 명확히.',

upper:    '상급기관(중앙부처·감사원 등) 보고용. 정량 지표·예산 집행·법령 근거 강조.',

press:    '언론 대상. 헤드라인 임팩트, 객관적 수치, 인용 가능한 핵심 문장 포함.'

};
const PPT_TONE = {

formal:     '공식 공공문서 톤. "~하고자 합니다" "~예정입니다" 등 정중하고 분명한 공문체.',

friendly:   '친근하고 부드러운 안내체. 공감 표현 사용, 경직된 한자어 줄이기.',

persuasive: '설득력 있는 발표 톤. 이점·근거·행동 유도를 슬라이드마다 구조적으로 배치.'

};

const pptState = { type:'policy', slides:10, audience:'internal', tone:'formal', ko:'', ja:'' };

function openPptBuilder(){

document.querySelector('.hero').style.display = 'none';

document.getElementById('grid').style.display = 'none';

document.getElementById('publicDetail').classList.add('hide');

document.getElementById('pptDetail').classList.remove('hide');

document.getElementById('ppt-out-ko').value = '';

document.getElementById('ppt-out-ja').value = '';

document.getElementById('ppt-status').textContent = '';

pptState.ko = ''; pptState.ja = '';

_pptBindPickers();

}
function closePptBuilder(){

document.getElementById('pptDetail').classList.add('hide');

document.querySelector('.hero').style.display = '';

document.getElementById('grid').style.display = '';

}
function _pptBindPickers(){

const bind = (rowId, attr, key) => {
    const row = document.getElementById(rowId);
    if (!row || row.dataset.bound) return;
    row.dataset.bound = '1';
    row.querySelectorAll('[' + attr + ']').forEach(btn => {
      btn.addEventListener('click', () => {
        row.querySelectorAll('[' + attr + ']').forEach(x => x.classList.remove('on'));
        btn.classList.add('on');
        const v = btn.getAttribute(attr);
        pptState[key] = (key === 'slides') ? parseInt(v,10) : v;
      });
    });
  };

bind('ppt-types',     'data-ppt',    'type');

bind('ppt-count-row', 'data-slides', 'slides');

bind('ppt-aud-row',   'data-aud',    'audience');

bind('ppt-tone-row',  'data-ptone',  'tone');

}

async function generatePpt(){

const topic  = document.getElementById('ppt-topic').value.trim();

const agency = document.getElementById('ppt-agency').value.trim();

if (!topic)  { alert('주제/제목을 입력해주세요.'); return; }

if (!agency) { alert('기관명을 입력해주세요.'); return; }

const t = PPT_TYPES[pptState.type];

const a = PPT_AUDIENCE[pptState.audience];

const tn = PPT_TONE[pptState.tone];

const baseSystem =

'당신은 공공기관 PPT 발표자료 전문가다. 아래 조건에 맞춰 발표용 슬라이드 구조를 생성하라.\n' +

'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +

'PPT 유형: ' + t.label + '\n' +

'유형 포커스: ' + t.focus + '\n' +

'기관명: ' + agency + '\n' +

'주제/제목: ' + topic + '\n' +

'슬라이드 수: 정확히 ' + pptState.slides + '장\n' +

'대상: ' + a + '\n' +

'톤: ' + tn + '\n' +

'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +

'[출력 형식 — 반드시 이 형식을 정확히 지켜라]\n' +

'## 📑 전체 목차\n' +

'1. (슬라이드1 제목)\n' +

'2. (슬라이드2 제목)\n' +

'... (' + pptState.slides + '개까지)\n\n' +

'## 🖥️ 슬라이드별 상세\n' +

'각 슬라이드마다 아래 블록 반복:\n' +

'\n---\n' +

'### 슬라이드 N: (제목)\n' +

'**핵심 내용**\n' +

'- (3~5줄 불릿, 각 줄 40자 이내)\n' +

'**시각자료**: (어떤 그래프/이미지/표/아이콘을 넣을지 구체적으로 1~2문장)\n' +

'**발표자 노트**: (발표 시 말할 스크립트 2~3문장, 청중에게 실제로 말하는 톤으로)\n' +

'---\n' +

'허구의 수치/인용/법적 근거를 사실처럼 단정하지 말고 필요하면 [예시값] 표기.\n' +

'청중과 톤 설정을 모든 슬라이드에 반영.';

const user = '주제: ' + topic + ' / 기관: ' + agency + '\n유형: ' + t.label + '\n슬라이드 ' + pptState.slides + '장으로 완성된 PPT 구조를 출력하라.';

const btn = document.getElementById('ppt-gen');

const status = document.getElementById('ppt-status');

btn.disabled = true; btn.textContent = '⏳ 생성 중 (한+일 동시)...';

status.textContent = 'AI가 한국어·일본어 PPT 구조를 동시 생성 중입니다...';

document.getElementById('ppt-out-ko').value = '';

document.getElementById('ppt-out-ja').value = '';

try {
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
    {const v=localStorage.getItem('uc_openai_key'); if(v) APIAdapter.setApiKey('openai',v);}
    {const v=localStorage.getItem('uc_gemini_key'); if(v) APIAdapter.setApiKey('gemini',v);}

    const maxTok = Math.max(3500, pptState.slides * 450);
    const res = await APIAdapter.generateBilingual(baseSystem, user, { maxTokens: maxTok });
    pptState.ko = res.ko || '';
    pptState.ja = res.jp || '';
    document.getElementById('ppt-out-ko').value = pptState.ko || ('❌ 한국어 생성 실패: ' + (res.errors?.ko || '알 수 없는 오류'));
    document.getElementById('ppt-out-ja').value = pptState.ja || ('❌ 일본어 생성 실패: ' + (res.errors?.jp || '알 수 없는 오류'));
    if (res.ok) status.textContent = '✅ 생성 완료 (' + pptState.slides + '장 · 한+일)';
    else status.textContent = '⚠️ 일부 실패 — KO:' + (res.ko?'OK':'❌') + ' / JP:' + (res.jp?'OK':'❌');
  } catch (err) {
    status.textContent = '❌ ' + err.message;
    document.getElementById('ppt-out-ko').value = '❌ 오류: ' + err.message + '\n\n설정 탭에서 API 키를 저장했는지 확인하세요.';
  } finally {
    btn.disabled = false; btn.textContent = '✨ PPT 생성 (한+일 동시)';
  }

}

function pptCopyAll(){

const ko = document.getElementById('ppt-out-ko').value;

const ja = document.getElementById('ppt-out-ja').value;

if (!ko && !ja) { alert('복사할 내용이 없습니다.'); return; }

const text = '━━━ 🇰🇷 한국어 ━━━\n' + ko + '\n\n━━━ 🇯🇵 日本語 ━━━\n' + ja;

navigator.clipboard.writeText(text).then(()=>{
    document.getElementById('ppt-status').textContent = '📋 전체(한+일) 클립보드에 복사되었습니다.';
  });

}

function pptSave(){

const ko = pptState.ko, ja = pptState.ja;

if (!ko && !ja) { alert('저장할 내용이 없습니다.'); return; }

const rec = {
    at: Date.now(),
    type: pptState.type,
    typeLabel: PPT_TYPES[pptState.type].label,
    slides: pptState.slides,
    audience: pptState.audience,
    tone: pptState.tone,
    agency: document.getElementById('ppt-agency').value,
    topic:  document.getElementById('ppt-topic').value,
    ko, ja
  };

if (typeof window.Library !== 'undefined' && typeof window.Library.saveResult === 'function'){
    try {
      window.Library.saveResult({
        category: 'public',
        source:   'ppt',
        title:    '[PPT/' + rec.typeLabel + '] ' + rec.topic,
        body:     '━ 🇰🇷 ━\n' + ko + '\n\n━ 🇯🇵 ━\n' + ja,
        meta:     rec
      });
      document.getElementById('ppt-status').textContent = '💾 보관함 저장 완료';
      return;
    } catch(_) {}
  }

const key = 'uc_ppt_saved';

const list = JSON.parse(localStorage.getItem(key)||'[]');

list.unshift(rec);

localStorage.setItem(key, JSON.stringify(list.slice(0,50)));

document.getElementById('ppt-status').textContent = '💾 저장됨 (localStorage · 최근 50개)';

}

/* "슬라이드N: 제목 | 내용 | 노트" 형식으로 파싱해서 클립보드에 복사 */
function pptExportStructure(){
  const ko = pptState.ko || document.getElementById('ppt-out-ko').value;
  const ja = pptState.ja || document.getElementById('ppt-out-ja').value;
  if (!ko && !ja) { alert('먼저 PPT를 생성해주세요.'); return; }
  const fmt = (src) => {
    if (!src) return '(없음)';
    // "### 슬라이드 N: ..." 단위로 분할
    const blocks = src.split(/\n(?=###\s*슬라이드\s*\d+|---\s*\n?###\s*슬라이드\s*\d+)/);
    const lines = [];
    blocks.forEach(b => {
      const m = b.match(/###\s*슬라이드\s*(\d+)\s*[:：]\s*(.+?)\n/);
      if (!m) return;
      const idx = m[1]; const title = m[2].trim();
      const contentMatch = b.match(/\*\*핵심\s*내용\*\*\s*\n([\s\S]*?)(?=\*\*시각자료|\*\*발표자|$)/);
      const noteMatch    = b.match(/\*\*발표자\s*노트\*\*\s*[:：]?\s*([\s\S]*?)(?=\n---|\n###|$)/);
      const content = (contentMatch ? contentMatch[1].trim() : '').replace(/\s+/g,' ');
      const note    = (noteMatch    ? noteMatch[1].trim()    : '').replace(/\s+/g,' ');
      lines.push('슬라이드' + idx + ': ' + title + ' | ' + content + ' | ' + note);
    });
    return lines.length ? lines.join('\n') : src;
  };
  const out = '━━━ 🇰🇷 PowerPoint 구조 ━━━\n' + fmt(ko) +
              '\n\n━━━ 🇯🇵 PowerPoint 構造 ━━━\n' + fmt(ja) +
              '\n\n(각 줄 = 슬라이드N: 제목 | 내용 | 발표자노트)';
  navigator.clipboard.writeText(out).then(()=>{
    document.getElementById('ppt-status').textContent = '🖥️ PowerPoint 구조(한+일) 클립보드에 복사되었습니다.';
  });
}

/* ═══════════════════════════════════════════════
/*    🚀 자동숏츠 — 8단계 파이프라인 + 대시보드/분석/대량
   =============================================== */
const SH_STEPS = [
  {id:0,  label:'🏠 대시보드'},
  {id:1,  label:'① 채널 설정'},
  {id:2,  label:'② 트렌드'},
  {id:3,  label:'③ 대본'},
  {id:4,  label:'④ 스타일'},
  {id:5,  label:'⑤ 1차 검증'},
  {id:6,  label:'⑥ 미디어'},
  {id:7,  label:'⑦ 최종 검증'},
  {id:8,  label:'📤 업로드'},
  {id:9,  label:'📊 분석'},
  {id:10, label:'🤖 대량'}
];

let shState = { step:0, data:{} }; // data는 각 단계 입력 보관

function openShorts(step){

shState.step = step || 0;

// 저장된 데이터 있으면 로드
  try { const saved = JSON.parse(localStorage.getItem('uc_shorts_pipeline')||'null'); if(saved && saved.data) shState.data = saved.data; } catch(e){}

document.querySelector('.hero').style.display = 'none';

document.getElementById('grid').style.display = 'none';

['monetizeDetail','publicDetail','eduDetail','transDetail','smbDetail','psyDetail'].forEach(id=>document.getElementById(id)?.classList.add('hide'));

document.getElementById('shortsDetail').classList.remove('hide');

renderStepper();

renderStepContent();

}

function closeShorts(){

document.getElementById('shortsDetail').classList.add('hide');

document.querySelector('.hero').style.display = '';

document.getElementById('grid').style.display = '';

}

function renderStepper(){

const box = document.getElementById('sh-stepper');

box.innerHTML = '';

SH_STEPS.forEach(s => {
    const b = document.createElement('button');
    b.className = 'sh-step' + (s.id === shState.step ? ' active' : (shState.data['step_'+s.id+'_done'] ? ' done' : ''));
    b.textContent = s.label;
    b.onclick = () => { shState.step = s.id; renderStepper(); renderStepContent(); };
    box.appendChild(b);
  });

document.getElementById('sh-prev').disabled = false;

document.getElementById('sh-next').disabled = shState.step === 10;

}

function shStep(delta){

shState.step = Math.max(0, Math.min(10, shState.step + delta));

renderStepper();

renderStepContent();

window.scrollTo({ top: document.getElementById('shortsDetail').offsetTop - 20, behavior:'smooth' });

}

function shSavePipeline(){ localStorage.setItem('uc_shorts_pipeline', JSON.stringify(shState)); alert('💾 파이프라인 저장됨'); }
function shLoadPipeline(){ try{ const s=JSON.parse(localStorage.getItem('uc_shorts_pipeline')||'null'); if(s){ shState=s; renderStepper(); renderStepContent(); alert('📥 불러옴'); } else alert('저장된 데이터 없음'); }catch(e){alert('오류: '+e.message);} }

function renderStepContent(){

const html = {
    0: renderDashboard,
    1: renderChannelSetup,
    2: renderTrend,
    3: renderScript,
    4: renderStyle,
    5: renderValidate1,
    6: renderMediaGen,
    7: renderValidate2,
    8: renderUploadStep,
    9: renderAnalyticsStep,
    10: renderBatch
  }[shState.step]();

document.getElementById('sh-content').innerHTML = html;

// 단계별 초기화 훅
  if (typeof window._shInit === 'function') window._shInit();

}

/* ─── 0. 대시보드 ─── */
function renderDashboard(){
  const today = new Date().toLocaleDateString('ko-KR');
  window._shInit = null;
  return `
  <div class="sh-panel">
    <h4>🏠 대시보드 — ${today}</h4>
    <div class="sh-stat">
      <div class="sh-stat-box"><div class="v">—</div><div class="l">총 영상 수</div></div>
      <div class="sh-stat-box"><div class="v">—</div><div class="l">누적 조회수</div></div>
      <div class="sh-stat-box"><div class="v">—</div><div class="l">이번 달 업로드</div></div>
      <div class="sh-stat-box"><div class="v">—</div><div class="l">예상 수익</div></div>
    </div>
    <div class="muted">※ 실제 채널 데이터 연동은 YouTube Data API 키 입력 후 활성화됩니다.</div>
  </div>

  <div class="sh-panel">
    <h4>📋 오늘 할 일 (자동 생성)</h4>
    <div class="sh-checklist">
      <div class="sh-check">□ 업로드 예정: 오늘 오후 6시 · 시니어 감동 스토리 #23</div>
      <div class="sh-check">□ 만들어야 할 영상: 일본 채널용 신규 1건</div>
      <div class="sh-check">□ 답글 대기 댓글: 12건 (우선 상위 5건)</div>
      <div class="sh-check">□ 경쟁 채널 새 영상 리뷰 (3개 채널)</div>
    </div>
  </div>

  <div class="sh-panel">
    <h4>🔥 트렌드 알림</h4>
    <div class="sh-checklist">
      <div class="sh-check">📈 급상승 키워드: "황혼이혼", "노후자금", "孫の入学"</div>
      <div class="sh-check">🎯 경쟁채널 신규 업로드: 2개</div>
      <div class="sh-check">#️⃣ 급상승 해시태그: #시니어브이로그 #団塊世代</div>
    </div>
  </div>

  <div class="sh-panel" style="background:linear-gradient(135deg,#fff5fa,#f7f4ff);border-color:var(--line-strong)">
    <h4>⚡ 빠른 시작</h4>
    <div class="muted">오늘의 추천 주제로 바로 대본 생성 → 풀 파이프라인 진행</div>
    <div class="actions" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
      <button class="mz-btn pri" onclick="shQuickStart('senior-touching')">🎬 시니어 감동 스토리</button>
      <button class="mz-btn pri" onclick="shQuickStart('jp-senior')">🇯🇵 일본 시니어 트렌드</button>
      <button class="mz-btn pri" onclick="shQuickStart('knowledge')">📚 1분 지식</button>
    </div>
  </div>`;
}
function shQuickStart(preset){
  shState.data.quickPreset = preset;
  shState.step = 3; // 대본 생성으로 바로
  renderStepper(); renderStepContent();
}

/* ─── 1. 채널 설정 ─── */
function renderChannelSetup(){

const d = shState.data.channel || {};

window._shInit = null;

return `

<div class="sh-panel">

<h4>① 채널 프로파일 (최대 10개 저장)</h4>

<div class="mz-row">

<div><label>채널명</label><input class="mz-in" id="ch-name" value="${d.name||''}" placeholder="예: 엄마의 하루"></div>

<div><label>장르</label>

<select class="mz-in" id="ch-genre">

<option value="senior-touching" ${d.genre==='senior-touching'?'selected':''}>시니어 감동</option>

<option value="comic" ${d.genre==='comic'?'selected':''}>코믹</option>

<option value="tikitaka" ${d.genre==='tikitaka'?'selected':''}>티키타카</option>

<option value="knowledge" ${d.genre==='knowledge'?'selected':''}>지식</option>

<option value="drama" ${d.genre==='drama'?'selected':''}>드라마</option>

<option value="ads" ${d.genre==='ads'?'selected':''}>광고</option>

</select>

</div>

<div><label>언어</label>

<select class="mz-in" id="ch-lang-s">

<option value="ko">🇰🇷 한국어</option>

<option value="ja">🇯🇵 일본어</option>

<option value="kojp" selected>🇰🇷+🇯🇵 동시</option>

</select>

</div>

</div>

<div class="mz-row" style="margin-top:8px">

<div><label>타겟 연령</label>

<select class="mz-in" id="ch-age">

<option value="10s">10대</option><option value="20s">20대</option>

<option value="30s">30대</option><option value="40s">40대</option>

<option value="50s" selected>50대</option><option value="60s+">60대+</option>

</select>

</div>

<div><label>성별</label>

<select class="mz-in" id="ch-gender">

<option value="all" selected>전체</option><option value="F">여성</option><option value="M">남성</option>

</select>

</div>

<div><label>톤</label>

<select class="mz-in" id="ch-tone-s">

<option value="warm">따뜻</option><option value="energetic">활기</option>

<option value="calm">차분</option><option value="dramatic">드라마틱</option>

</select>

</div>

</div>

</div>

<div class="sh-panel">

<h4>🎨 브랜드킷</h4>

<div class="mz-row">

<div><label>채널 고유 색상</label><input class="mz-in" type="color" id="ch-color" value="${d.color||'#ef6fab'}"></div>

<div><label>로고 위치</label>

<select class="mz-in" id="ch-logo">

<option value="tl">좌상단</option><option value="tr" selected>우상단</option>

<option value="bl">좌하단</option><option value="br">우하단</option>

</select>

</div>

<div><label>자막 스타일</label>

<select class="mz-in" id="ch-sub-style">

<option value="bold-yellow">굵은 노랑</option>

<option value="white-shadow" selected>흰색+그림자</option>

<option value="box-bg">박스 배경</option>

</select>

</div>

</div>

<div class="mz-row" style="margin-top:8px">

<div><label>워터마크 텍스트</label><input class="mz-in" id="ch-watermark" value="${d.watermark||''}" placeholder="예: @엄마의하루"></div>

<div><label>고정 인트로</label><input class="mz-in" id="ch-intro" value="${d.intro||''}" placeholder="예: 안녕하세요, 엄마의 하루입니다"></div>

<div><label>고정 CTA</label><input class="mz-in" id="ch-cta" value="${d.cta||''}" placeholder="예: 구독·좋아요 부탁드려요"></div>

</div>

</div>

<div class="sh-panel">

<h4>👀 경쟁 채널 모니터링</h4>

<textarea class="mz-in" id="ch-competitors" style="min-height:70px" placeholder="경쟁 채널 URL을 줄바꿈으로 입력">${d.competitors||''}</textarea>

<div class="muted" style="margin-top:6px">등록된 채널의 신규 업로드를 자동 추적합니다.</div>

</div>

<div class="sh-panel" style="background:#effbf7;border-color:#c8ebd9">

<h4>🌏 멀티채널 동기화</h4>

<label style="font-size:12px;display:flex;align-items:center;gap:6px"><input type="checkbox" id="ch-sync" ${d.sync?'checked':''}>한국 채널 ↔ 일본 채널 설정 동기화</label>

<div class="actions">

<button class="mz-btn sv" onclick="shSaveChannel()">💾 채널 프로파일 저장</button>

</div>

</div>`;

}
function shSaveChannel(){

shState.data.channel = {
    name:document.getElementById('ch-name').value, genre:document.getElementById('ch-genre').value,
    lang:document.getElementById('ch-lang-s').value, age:document.getElementById('ch-age').value,
    gender:document.getElementById('ch-gender').value, tone:document.getElementById('ch-tone-s').value,
    color:document.getElementById('ch-color').value, logo:document.getElementById('ch-logo').value,
    subStyle:document.getElementById('ch-sub-style').value,
    watermark:document.getElementById('ch-watermark').value, intro:document.getElementById('ch-intro').value,
    cta:document.getElementById('ch-cta').value, competitors:document.getElementById('ch-competitors').value,
    sync:document.getElementById('ch-sync').checked
  };

shState.data['step_1_done'] = true;

shSavePipeline(); renderStepper();

}

/* ─── 2. 트렌드 탐지 ─── */
function renderTrend(){
  window._shInit = null;
  return `
  <div class="sh-panel">
    <h4>② 실시간 트렌드 수집</h4>
    <div class="sh-card-grid">
      <button onclick="shPickTrend('yt')">📈 YouTube 급상승</button>
      <button onclick="shPickTrend('tiktok')">🎵 TikTok 트렌드</button>
      <button onclick="shPickTrend('naver')">🇰🇷 네이버 실검</button>
      <button onclick="shPickTrend('jp')">🇯🇵 일본 트렌드</button>
      <button onclick="shPickTrend('x')">🐦 X 핫토픽</button>
      <button onclick="shPickTrend('mine')">🎯 내 장르 맞춤</button>
    </div>
    <label>채널 장르 기반 자동 필터</label>
    <textarea id="sh-trend-list" class="mz-in" style="min-height:140px" placeholder="수집된 트렌드가 여기에 표시됩니다. 버튼을 눌러 AI로 생성하세요.">${shState.data.trendList||''}</textarea>
  </div>

  <div class="sh-panel" style="background:#f7f4ff;border-color:#d8d2f4">
    <h4>🔮 AI 트렌드 예측</h4>
    <div class="muted">내일·이번 주 뜰 콘텐츠 미리 예측</div>
    <button class="mz-btn pri" onclick="shPredictTrend()">🔮 예측 실행</button>
    <textarea id="sh-trend-predict" class="mz-in" style="min-height:120px;margin-top:8px" readonly></textarea>
  </div>

  <div class="sh-panel">
    <h4>➡️ 선택한 트렌드를 대본으로</h4>
    <input class="mz-in" id="sh-trend-pick" placeholder="위 목록에서 하나 골라 입력">
    <button class="mz-btn pri" onclick="shTrendToScript()" style="margin-top:8px">📝 이 주제로 대본 생성 단계로 이동</button>
  </div>`;
}
async function shPickTrend(src){
  const ta = document.getElementById('sh-trend-list');
  ta.value = '⏳ AI가 트렌드를 수집·요약 중...';
  try {
    await _syncAPIShorts();
    const genre = (shState.data.channel||{}).genre || 'senior-touching';
    const sys = '당신은 콘텐츠 트렌드 분석가다. ' + {yt:'유튜브 급상승',tiktok:'TikTok',naver:'네이버 실검',jp:'일본 트렌드',x:'X 핫토픽',mine:'내 장르'}[src] + '에서 최근 트렌드를 10개 열거. 각 항목: 키워드 · 관련 주제 한 줄 요약. 내 채널 장르(' + genre + ')에 맞는 것 우선.';
    const r = await APIAdapter.callWithFallback(sys, '트렌드 10개 제시', {maxTokens:800});
    ta.value = r;
    shState.data.trendList = r;
  } catch(e){ ta.value = '❌ '+e.message; }
}
async function shPredictTrend(){
  const ta = document.getElementById('sh-trend-predict');
  ta.value = '⏳ 예측 중...';
  try {
    await _syncAPIShorts();
    const genre = (shState.data.channel||{}).genre || 'senior-touching';
    const sys = '콘텐츠 전략가로서 내일·이번 주에 뜰 가능성이 높은 주제 5개 예측. 근거·추천 훅 포함. 내 장르: '+genre;
    const r = await APIAdapter.callWithFallback(sys, '예측 5개', {maxTokens:800});
    ta.value = r;
  } catch(e){ ta.value = '❌ '+e.message; }
}
function shTrendToScript(){
  const pick = document.getElementById('sh-trend-pick').value.trim();
  if(!pick){ alert('주제를 입력하세요.'); return; }
  shState.data.topic = pick;
  shState.data['step_2_done'] = true;
  shState.step = 3; renderStepper(); renderStepContent();
}

/* ─── 3. 대본 생성 ─── */
const SH_GENRES = [
  {id:'gen',     i:'✨', t:'일반 대본',     d:'쇼츠·롱폼 기본'},
  {id:'batch',   i:'🎬', t:'통합 생성',     d:'여러 에피소드 배치'},
  {id:'lyric',   i:'🎵', t:'가사/음원',     d:'Suno용 가사'},
  {id:'saying',  i:'📜', t:'사자성어·명언', d:'지혜·교훈'},
  {id:'humor',   i:'😄', t:'코믹·유머',     d:'웃음 포인트'},
  {id:'know',    i:'🔬', t:'전문지식',      d:'리서치 기반'},
  {id:'trivia',  i:'🧩', t:'잡학',          d:'궁금증 자극'},
  {id:'drama',   i:'🎭', t:'숏드라마',      d:'반전·몰입'},
  {id:'hub',     i:'🎤', t:'변환허브',      d:'ElevenLabs/InVideo'},
  {id:'hist',    i:'📁', t:'히스토리',      d:'저장된 대본'}
];
function renderScript(){

const d = shState.data;

window._shInit = null;

const activeTab = d.scriptTab || null;

return `

<div class="sh-panel">

<h4>③ 대본 생성 — 장르를 선택하면 아래에 대본생성기가 열려요</h4>

<p style="font-size:12px;color:var(--sub);margin:0 0 10px">주제: <b>${(d.topic||'(Step1 에서 설정)').slice(0,80)}</b> · 대본 엔진의 실제 탭 그대로 사용합니다</p>

<div class="sh-card-grid" id="sh-genre-grid">

${SH_GENRES.map(g => `<button class="sh-genre-card ${activeTab===g.id?'on':''}" data-v="${g.id}" onclick="shOpenScript('${g.id}')"><div style="font-size:22px">${g.i}</div><div style="font-weight:900;font-size:13px;margin-top:4px">${g.t}</div><div style="font-size:11px;color:var(--sub);margin-top:2px">${g.d}</div></button>`).join('')}

</div>

<div id="sh-script-hint" style="display:${activeTab?'block':'none'};margin-top:10px;padding:8px 12px;background:linear-gradient(135deg,#fff5fa,#f7f4ff);border:1px dashed var(--pink);border-radius:10px;font-size:12px;color:var(--pink-deep);font-weight:800">

✅ 대본 완성 후 ④ 다음 단계로 자동 이동해요

</div>

<div id="sh-script-iframe-wrap" class="sh-iframe-wrap${activeTab?' open':''}" style="max-height:${activeTab?'840px':'0'};overflow:hidden">

<iframe id="sh-script-iframe" src="" title="대본 엔진"

style="width:100%;height:820px;border:0;display:block;background:#fff"

allow="clipboard-read; clipboard-write">

</iframe>

</div>

<label style="margin-top:14px;display:block">📋 생성된 대본 (엔진에서 복사해 붙여넣거나 자동 동기화)</label>

<textarea id="sh-script-out" class="mz-out" readonly style="min-height:160px;margin-top:4px" placeholder="대본 엔진에서 '✅ 이 대본으로 다음 단계 →' 버튼을 누르면 여기로 자동 전달됩니다">${d.script||''}</textarea>

<div id="sh-script-status" class="mz-status"></div>

</div>`;

}
// 장르 카드 클릭 → iframe 열기
function shOpenScript(tab){

const d = shState.data;

d.scriptTab = tab;

// API 키 브리지
  try{
    localStorage.setItem('api_key_v10',     localStorage.getItem('uc_claude_key') || '');
    localStorage.setItem('v30_openai_key',  localStorage.getItem('uc_openai_key') || '');
    localStorage.setItem('v30_gemini_key',  localStorage.getItem('uc_gemini_key') || '');
  }catch(_){}

// 주제 브리지
  try{
    localStorage.setItem('sh_topic_bridge', d.topic || '');
    localStorage.setItem('sh_from_shorts',  '1');
    localStorage.setItem('sh_script_tab',   tab);
  }catch(_){}

// 카드 하이라이트
  document.querySelectorAll('#sh-genre-grid .sh-genre-card').forEach(b => b.classList.toggle('on', b.getAttribute('data-v') === tab));

// 힌트 표시
  const hint = document.getElementById('sh-script-hint'); if(hint) hint.style.display = 'block';

// iframe 로드/교체
  const wrap = document.getElementById('sh-script-iframe-wrap');

const ifr = document.getElementById('sh-script-iframe');

const src = 'engines/script/index.html?from=shorts&tab=' + encodeURIComponent(tab) + '&topic=' + encodeURIComponent(d.topic||'');

if(ifr){ ifr.src = src; }

if(wrap){
    /* 인라인 style="max-height:0" 가 CSS 보다 우선되므로 직접 덮어써서 펼침 */
    wrap.style.display = '';
    wrap.style.maxHeight = '840px';
    wrap.classList.add('open');
  }
  if(typeof window.mocaToast === 'function') window.mocaToast('📝 ' + (SH_GENRES.find(g => g.id===tab)?.t || tab) + ' 대본 엔진 열림', 'info');
}
// parent ↔ iframe 메시지
window.addEventListener('message', function(e){
  if(!e.data || typeof e.data !== 'object') return;
  if(e.data.type === 'sh_back'){
    /* STEP 1. iframe wrapper 숨김 + 접기 */
    const ifrWrap = document.getElementById('sh-script-iframe-wrap');
    if(ifrWrap){
      ifrWrap.classList.remove('open');
      ifrWrap.style.maxHeight = '0';
    }
    /* STEP 2. iframe src 비우기 — 내부 스크립트·타이머·네트워크 중단 */
    const ifr = document.getElementById('sh-script-iframe');
    if(ifr) ifr.src = 'about:blank';
    /* STEP 3. 자동숏츠 메인 컨테이너(shortsDetail) 강제 표시 */
    const shD = document.getElementById('shortsDetail');
    if(shD){
      shD.classList.remove('hide');
      shD.style.display = '';
    }
    /* STEP 4. 장르 카드 하이라이트 제거 + scriptTab 상태 초기화 */
    document.querySelectorAll('#sh-genre-grid .sh-genre-card').forEach(b => b.classList.remove('on'));
    if(shState && shState.data) shState.data.scriptTab = null;
    /* STEP 5. Step 전체 재렌더링 — #sh-script-hint 등 잔여 상태까지 초기화 */
    try{
      if(typeof renderStepper === 'function') renderStepper();
      if(typeof renderStepContent === 'function') renderStepContent();
    }catch(_){}
    /* STEP 6. fallback — shortsDetail 이 여전히 숨김이면 홈 그리드로 복귀 */
    if(shD && (shD.classList.contains('hide') || getComputedStyle(shD).display === 'none')){
      const hero = document.querySelector('.hero');
      const grid = document.getElementById('grid');
      if(hero) hero.style.display = '';
      if(grid) grid.style.display = '';
    }
    /* STEP 7. 스크롤 — 카드 목록이 시야에 오도록 이동 */
    setTimeout(function(){
      const target = document.getElementById('sh-genre-grid') || shD
        || document.querySelector('.hero') || document.getElementById('grid');
      if(target) target.scrollIntoView({ behavior:'smooth', block:'start' });
    }, 60);
  }

if(e.data.type === 'sh_next'){
    // 대본 텍스트 수신
    if(e.data.script){
      shState.data.script = e.data.script;
      const out = document.getElementById('sh-script-out');
      if(out) out.value = e.data.script;
      shState.data['step_3_done'] = true;
    }
    // 다음 스텝 이동
    shState.step = e.data.step || 4;
    if(typeof renderStepper === 'function') renderStepper();
    if(typeof renderStepContent === 'function') renderStepContent();
    if(typeof window.mocaToast === 'function') window.mocaToast('✅ 대본 확정 → ④ 다음 단계', 'ok');
  }

/* 대본 생성 완료 메시지 — 자동숏츠 스튜디오 + shState 양쪽 반영 */

if(e.data.type === 'script_generated'){
    const payload = e.data.payload || e.data;
    const text    = payload.text || payload.script || '';
    /* STUDIO 상태 반영 */
    try {
      if(typeof STUDIO !== 'undefined' && STUDIO.project && STUDIO.project.s2){
        const ch = STUDIO.project.channel;
        if(ch !== 'ja') STUDIO.project.s2.scriptKo = text;
        if(ch === 'ja' || ch === 'both') STUDIO.project.s2.scriptJa = text;
        if(typeof studioSave === 'function') studioSave();
      }
    } catch(_){}

/* shState 환경 (자동숏츠 Step 3 대본 영역) */

if(typeof shState !== 'undefined' && shState.data){
      shState.data.script = text;
      if(typeof renderStepContent === 'function') renderStepContent();
    }
    if(typeof window.mocaToast === 'function') window.mocaToast('✅ 대본이 부모 창으로 전달됐어요', 'ok');
  }
});
function shPickHook(k){ shState.data.hookType = k; alert('훅 패턴 '+k+' 선택됨'); }
async function shGenScript(){
  const topic = document.getElementById('sh-topic').value.trim();
  if(!topic){ alert('주제를 입력하세요.'); return; }
  const status = document.getElementById('sh-script-status');
  status.textContent = '⏳ 생성 중...';
  try {
    await _syncAPIShorts();
    const len = document.getElementById('sh-len').value;
    const struct = document.getElementById('sh-struct').value;
    const style = document.getElementById('sh-style').value;
    const slang = document.getElementById('sh-slang').value;
    const ab = document.getElementById('sh-ab').value === 'on';
    const hookType = shState.data.hookType || 'auto';
    const genre = (shState.data.channel||{}).genre || style;

    const sys = '당신은 숏츠 대본 작가다. 길이 '+len+'초, 구조 '+struct+', 스타일 '+style+', 장르 '+genre+', 훅 패턴 '+hookType+'. 첫 3초 훅 매우 강하게, 중간 몰입, 마지막 CTA 또는 여운 있는 한 줄.';
    const tasks = [];
    const langs = slang === 'kojp' ? ['ko','ja'] : [slang];
    const versions = ab ? ['A','B'] : [''];
    versions.forEach(v => langs.forEach(L => {
      const langI = L==='ko'?'반드시 한국어로만':'必ず日本語のみで';
      tasks.push(
        APIAdapter.callWithFallback(sys+'\n[언어] '+langI+(v?'\n[버전 '+v+'] '+(v==='A'?'감정 우선':'정보 우선'):''), '주제: '+topic, {maxTokens:1500})
          .then(r => '━ '+(v?'🅱 '+v+' · ':'')+L.toUpperCase()+' ━\n'+r)
          .catch(e => '❌ '+L+': '+e.message)
      );
    }));
    const results = await Promise.all(tasks);
    const out = results.join('\n\n');
    document.getElementById('sh-script-out').value = out;
    shState.data.script = out;
    shState.data.topic = topic;
    shState.data['step_3_done'] = true;
    status.textContent = '✅ 대본 생성 완료';
    renderStepper();
  } catch(e){ status.textContent = '❌ '+e.message; }
}

/* ─── 4. 스타일 설정 ─── */
function renderStyle(){
  const d = shState.data.style || {};
  window._shInit = null;
  return `
  <div class="sh-panel">
    <h4>④ 이미지 스타일</h4>
    <div class="sh-card-grid" id="sh-img-style">
      ${['실사사진','디즈니픽사풍','일본애니풍','지브리풍','유화/수채화','웹툰/만화풍','3D 렌더링','미니멀 flat','빈티지 레트로','사이버펑크','수묵 동양화','인포그래픽'].map((s,i)=>`<button onclick="shPickImg(${i})" class="${d.imgIdx===i?'on':''}">${s}</button>`).join('')}
    </div>
  </div>

  <div class="sh-panel">
    <h4>🎬 영상 스타일</h4>
    <div class="sh-card-grid" id="sh-vid-style">
      ${['이미지 슬라이드쇼','줌인아웃','켄번스 효과','파티클 효과','AI 아바타(HeyGen)','배경+자막','분할화면(티키타카)','자막+배경색'].map((s,i)=>`<button onclick="shPickVid(${i})" class="${d.vidIdx===i?'on':''}">${s}</button>`).join('')}
    </div>
  </div>

  <div class="sh-panel">
    <h4>📝 자막 상세</h4>
    <div class="mz-row">
      <div><label>위치</label>
        <select class="mz-in" id="sh-sub-pos"><option>상단</option><option selected>중앙</option><option>하단</option></select>
      </div>
      <div><label>한국어 폰트</label>
        <select class="mz-in" id="sh-ko-font">
          <option>배달의민족</option><option>나눔고딕</option><option selected>Pretendard</option>
          <option>Black Han Sans</option><option>강원교육튼튼</option><option>교보손글씨</option>
        </select>
      </div>
      <div><label>일본어 폰트</label>
        <select class="mz-in" id="sh-jp-font">
          <option selected>Noto Sans JP</option><option>M PLUS</option>
          <option>Kosugi Maru</option><option>Zen Kurenaido</option>
        </select>
      </div>
    </div>
    <div class="mz-row" style="margin-top:8px">
      <div><label>영어 폰트</label>
        <select class="mz-in" id="sh-en-font">
          <option>Impact</option><option selected>Montserrat</option><option>Bebas Neue</option><option>Anton</option>
        </select>
      </div>
      <div><label>크기</label>
        <select class="mz-in" id="sh-sub-size"><option>소</option><option selected>중</option><option>대</option><option>특대</option></select>
      </div>
      <div><label>효과</label>
        <select class="mz-in" id="sh-sub-fx"><option>페이드인</option><option selected>팝업</option><option>타이핑</option><option>강조색 변경</option></select>
      </div>
    </div>
    <div class="mz-row" style="margin-top:8px">
      <div><label>글자색</label><input class="mz-in" type="color" id="sh-sub-color" value="#ffffff"></div>
      <div><label>배경색</label><input class="mz-in" type="color" id="sh-sub-bg" value="#000000"></div>
      <div><label>한+일 동시</label>
        <select class="mz-in" id="sh-sub-both"><option value="single" selected>단일</option><option value="both">한·일 동시</option></select>
      </div>
    </div>
  </div>

  <div class="sh-panel">
    <h4>🎤 음성 상세</h4>
    <div class="mz-row">
      <div><label>공급자</label>
        <select class="mz-in" id="sh-tts">
          <option value="openai" selected>OpenAI TTS (저렴)</option>
          <option value="elevenlabs">ElevenLabs (고품질)</option>
          <option value="clova">CLOVA (한국어)</option>
          <option value="nijivoice">Nijivoice (일본어)</option>
        </select>
      </div>
      <div><label>속도</label>
        <input class="mz-in" type="range" id="sh-tts-speed" min="0.7" max="1.3" step="0.05" value="1.0" oninput="this.nextElementSibling.textContent=this.value+'x'">
        <span style="font-size:11px;color:var(--sub)">1.0x</span>
      </div>
      <div><label>감정</label>
        <select class="mz-in" id="sh-tts-emo">
          <option>차분</option><option selected>따뜻함</option><option>열정</option>
          <option>슬픔</option><option>기쁨</option><option>진지</option><option>코믹</option>
        </select>
      </div>
    </div>
    <div class="mz-row" style="margin-top:8px">
      <div><label>화자 수</label>
        <select class="mz-in" id="sh-speakers"><option>1인</option><option selected>2인 (티키타카)</option><option>3인 이상</option></select>
      </div>
      <div><label>언어</label>
        <select class="mz-in" id="sh-tts-lang">
          <option value="ko">🇰🇷</option><option value="ja">🇯🇵</option><option value="kojp" selected>🇰🇷+🇯🇵</option>
        </select>
      </div>
    </div>
  </div>

  <div class="sh-panel">
    <h4>🎵 배경음악</h4>
    <div class="mz-row">
      <div><label>분위기</label>
        <select class="mz-in" id="sh-bgm-mood"><option>감동적</option><option>신나는</option><option>차분한</option><option>긴장감</option><option>코믹</option></select>
      </div>
      <div><label>장르</label>
        <select class="mz-in" id="sh-bgm-gen"><option>피아노</option><option>오케스트라</option><option>팝</option><option>Lo-fi</option><option>EDM</option></select>
      </div>
      <div><label>비율(화면)</label>
        <select class="mz-in" id="sh-ratio"><option value="9:16" selected>9:16 (쇼츠)</option><option value="1:1">1:1</option><option value="16:9">16:9</option></select>
      </div>
    </div>
  </div>

  <div class="sh-panel">
    <button class="mz-btn pri" onclick="shSaveStyle()">💾 스타일 프리셋 저장</button>
    <button class="mz-btn" onclick="shLoadStylePreset()">📥 프리셋 불러오기</button>
  </div>`;
}

/* ─── 5. 1차 검증 ─── */

/* ─── 7. 최종 검증 ─── */

/*
   📤 STEP 8 — 스마트 업로드 (3탭: 연결 / 정보 / 실행)
   ═══════════════════════════════════════════════════════════ */
const UP_PLATFORMS = [

{ id:'yt_kr',   ico:'🇰🇷', name:'유튜브 한국',   keys:[['sh_yt_kr_apikey','API 키'],['sh_yt_kr_channelid','채널 ID']], helpUrl:'https://console.cloud.google.com/' },

{ id:'yt_jp',   ico:'🇯🇵', name:'유튜브 일본',   keys:[['sh_yt_jp_apikey','API 키'],['sh_yt_jp_channelid','채널 ID']], helpUrl:'https://console.cloud.google.com/' },

{ id:'ig',      ico:'📸', name:'인스타그램',     keys:[['sh_ig_token','Access Token']], helpUrl:'https://developers.facebook.com/' },

{ id:'tt',      ico:'🎵', name:'틱톡',           keys:[['sh_tt_key','Client Key'],['sh_tt_secret','Client Secret']], helpUrl:'https://developers.tiktok.com/' },

{ id:'nv',      ico:'📝', name:'네이버 블로그',  keys:[['sh_nv_id','Client ID'],['sh_nv_secret','Secret'],['sh_nv_blogid','블로그 ID']], helpUrl:'https://developers.naver.com/' },

{ id:'fb',      ico:'📘', name:'페이스북 페이지',keys:[['sh_fb_token','Page Token'],['sh_fb_pageid','Page ID']], helpUrl:'https://developers.facebook.com/' }

];

/* ───── TAB 1: 플랫폼 연결 ───── */
function _upT1Connect(){
  const connected = UP_PLATFORMS.filter(p => p.keys.every(([k]) => localStorage.getItem(k)));
  const summary = connected.length
    ? '✅ 연결됨: ' + connected.map(p => p.name).join(', ') + (connected.length < UP_PLATFORMS.length ? ' | ⭕ 미연결: ' + UP_PLATFORMS.filter(p => !p.keys.every(([k]) => localStorage.getItem(k))).map(p => p.name).join(', ') : '')
    : '⭕ 아직 연결된 플랫폼이 없어요. 아래에서 하나 이상 연결하세요.';

  return '<p style="color:var(--pink-deep);font-weight:900;margin:0 0 10px">처음 한 번만 연결하면 다음부터 자동으로 올라가요 🚀</p>' +
    '<div class="sh-card-grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">' +
      UP_PLATFORMS.map(p => {
        const ok = p.keys.every(([k]) => localStorage.getItem(k));
        return '<div class="up-card" style="padding:12px;background:#fff;border:2px solid ' + (ok?'#9ed99c':'var(--line)') + ';border-radius:14px">' +
          '<div style="display:flex;align-items:center;gap:6px;font-weight:900;font-size:14px">' + p.ico + ' ' + p.name + '</div>' +
          '<div style="margin:6px 0;font-size:12px;font-weight:700;color:' + (ok?'#2f7a30':'#d95574') + '">' + (ok?'🟢 연결됨':'🔴 미연결') + '</div>' +
          '<details ' + (ok?'':'open') + '><summary style="cursor:pointer;color:var(--pink-deep);font-weight:800;font-size:12px">' + (ok?'🔧 수정':'+ 연결하기') + '</summary>' +
            '<div style="padding:8px 0">' +
              p.keys.map(([k,l]) => '<label style="font-size:11px">' + l + '</label><input class="mz-in" type="password" id="' + k + '" value="' + (localStorage.getItem(k)||'') + '" placeholder="' + l + '" style="margin-bottom:4px">').join('') +
              '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">' +
                '<a href="' + p.helpUrl + '" target="_blank" class="mz-btn ghost" style="padding:6px 10px;font-size:11px;text-decoration:none;min-height:32px">🔗 키 받기</a>' +
                '<button class="mz-btn" style="padding:6px 10px;font-size:11px;min-height:32px" onclick="upConnectSave(\'' + p.id + '\')">💾 저장</button>' +
                '<button class="mz-btn pri" style="padding:6px 10px;font-size:11px;min-height:32px" onclick="upConnectTest(\'' + p.id + '\')">✅ 연결확인</button>' +
              '</div>' +
              '<p id="up-test-' + p.id + '" style="font-size:11px;margin:6px 0 0;min-height:14px"></p>' +
            '</div>' +
          '</details>' +
        '</div>';
      }).join('') +
    '</div>' +
    '<p style="margin-top:12px;font-size:11px;color:var(--sub)">🔒 이 기기에만 저장됩니다 (localStorage)</p>' +
    '<div style="padding:10px 14px;background:#f7f4ff;border-radius:10px;margin-top:10px;font-size:12.5px;font-weight:700">' + summary + '</div>' +
    '<div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="mz-btn pri" onclick="upTabSet(\'info\')">② 업로드 정보 →</button></div>';
}

/* ───── TAB 2: 업로드 정보 ───── */

/* 상태 저장 / 필드 조작 */

/* ───── TAB 3: 업로드 실행 ───── */

/* ───── TAB 1: 영상별 성과 ───── */

/* ───── TAB 3: 다음 전략 ───── */

/* ─── 10. 대량 생산 ─── */

/* ═══════════════════════════════════════════════

/* 🌈 어린이 모드 — 10 대카테고리 · 안전장치 · 포인트·뱃지
   =============================================== */
const KIDS_CARDS = [

{id:'family',    ico:'👨‍👩‍👧‍👦', title:'가족 놀이터',    desc:'가족과 함께 놀고 사랑쌓기',     c:1, star:true},

{id:'friends',   ico:'👫',       title:'친구 놀이터',    desc:'친구들과 재밌게 놀기',          c:2, star:true},

{id:'games',     ico:'🎮',       title:'게임 & 놀이',    desc:'AI랑 신나는 게임하기',          c:3},

{id:'story',     ico:'📖',       title:'나만의 이야기',  desc:'내가 주인공인 이야기 만들기',   c:4},

{id:'create',    ico:'🎨',       title:'창작 놀이',      desc:'캐릭터·나라·음식·노래 만들기',  c:5},

{id:'comedy',    ico:'😂',       title:'개그 & 유머',    desc:'웃긴 이야기로 빵 터지기',       c:6},

{id:'magic',     ico:'🔮',       title:'신기한 것',      desc:'마술·비밀·미래 예언',           c:7},

{id:'challenge', ico:'🏆',       title:'도전 & 챌린지',  desc:'오늘의 미션·뱃지 모으기',       c:8},

{id:'world',     ico:'🌍',       title:'세계 여행',      desc:'다른 나라 탐험하기',            c:9},

{id:'event',     ico:'🎪',       title:'특별 이벤트',    desc:'생일·방학·크리스마스',          c:10}

];

// 안전장치 - 부적절 키워드 필터
const KIDS_BLOCK_WORDS = ['죽','살인','자살','폭력','성인','담배','음주','술','마약','도박','섹스','야한','베드','밴','욕설'];

// 외부 링크 제거
function kidsSanitize(text){
  return (text||'').replace(/https?:\/\/[^\s]+/g, '').replace(/www\.[^\s]+/g, '');
}

// 뱃지 시스템
const BADGES = {
  story:{label:'이야기왕',icon:'📖'}, game:{label:'게임왕',icon:'🎮'},
  create:{label:'창의왕',icon:'🎨'}, family:{label:'효도왕',icon:'👑'},
  friends:{label:'우정왕',icon:'💝'}, comedy:{label:'웃음왕',icon:'😆'},
  peace:{label:'화해왕',icon:'🕊️'}, cheer:{label:'응원왕',icon:'📣'}
};

// 1) 새 카드 추가 (KIDS_CARDS 배열에 append)
KIDS_CARDS.push({
  id:'character', ico:'🧸', title:'캐릭터 놀이터',
  desc:'세상에 하나뿐인 내 캐릭터 만들기', c:3, star:true
});

// 2) 메타 추가
KIDS_META.character = {ico:'🧸', title:'캐릭터 놀이터', sub:'세상에 하나뿐인 내 캐릭터를 만들어요 🎨✨'};

// 3) 서브 메뉴 추가 — 저작권 안전 프롬프트 가이드 포함
KIDS_SUBS.character = [

{id:'c-cat',      emoji:'🐱', name:'귀요미 고양이 캐릭터 만들기',   hint:'산리오 같은 느낌',
    prompt:'독창적인 귀여운 고양이 캐릭터 생성. 아이가 입력한 색깔·성격·특징을 반영해서 다음을 모두 만들어라: ①캐릭터 이름 제안 3개 ②1인칭 자기 소개 (200자) ③AI 그림 사이트에 붙여넣을 영어 프롬프트 (반드시 저작권 안전한 원본 스타일: "original cute cat character, kawaii style, pastel colors, round face, big eyes, child-friendly" 형식, 절대 Hello Kitty나 기존 캐릭터 이름 언급 금지) ④짧은 인사 노래 가사 2줄.'},

{id:'c-monster',  emoji:'👾', name:'깜찍한 몬스터 캐릭터 만들기',   hint:'포켓몬 같은 느낌',
    prompt:'독창적인 귀여운 몬스터 캐릭터 생성. 타입·능력·외모를 반영해서: ①캐릭터 이름 ②몬스터 도감 설명 (200자) ③영어 이미지 프롬프트 (저작권 안전 원본: "original cute fantasy monster creature, colorful, friendly, round shape, big sparkly eyes, chibi style" — Pokemon이나 기존 작품 이름 절대 금지) ④능력치 카드 (HP/공격/방어/귀여움).'},

{id:'c-toy',      emoji:'🧸', name:'장난꾸러기 인형 캐릭터 만들기', hint:'라부부 같은 느낌',
    prompt:'독창적인 디자이너 토이 캐릭터 생성. 모양·표정·색깔을 반영해서: ①캐릭터 이름 ②인형 소개서 (200자) ③영어 이미지 프롬프트 (저작권 안전 원본: "original vinyl designer art toy character, pointy ears, cute pastel colors, mischievous expression, collectible figurine style" — Labubu나 기존 브랜드 이름 절대 금지) ④수집 도감 한 페이지.'},

{id:'c-custom',   emoji:'🌟', name:'나만의 캐릭터 만들기 (자유)',   hint:'세상에 하나뿐!',
    prompt:'완전히 독창적인 어린이용 캐릭터 생성. 이름·종류·나이·색깔·크기·특징·성격·능력·좋아하는 것을 모두 받아서 다음 5개를 완성: ①📋 캐릭터 소개서 (1인칭, 이모지 풍부하게) ②🎨 이미지 프롬프트 (영어, 저작권 안전한 original character · kawaii style · child-friendly 명시) ③📖 내 캐릭터가 주인공인 짧은 동화 (300자) ④🎤 캐릭터 테마송 가사 4줄 ⑤🃏 능력치 카드 (HP·공격·방어·귀여움·행운, 각 1~999 숫자).'},

{id:'c-story',    emoji:'📖', name:'내 캐릭터 주인공 동화',          hint:'이야기책',
    prompt:'아이가 만든 캐릭터를 주인공으로 한 짧은 동화(500자 내외) 생성. 기승전결 + 교훈 + 친구들과의 따뜻한 에피소드 포함. 폭력·무서운 요소 금지.'},

{id:'c-dialogue', emoji:'💬', name:'캐릭터와 대화하기',              hint:'티키타카 이야기',
    prompt:'아이가 만든 캐릭터와 AI가 짝꿍이 되어 주고받는 귀여운 대화 (10턴). 친근하고 다정한 말투. 마지막은 친구가 되자는 훈훈한 결말.'},

{id:'c-diary',    emoji:'📝', name:'내 캐릭터 오늘의 일기',          hint:'하루 일기',
    prompt:'아이의 캐릭터가 1인칭으로 쓰는 오늘 하루 일기. 날씨·아침·점심·저녁·가장 재밌었던 일·내일 할 일. 이모지 풍부하게.'},

{id:'c-card',     emoji:'🃏', name:'캐릭터 능력치 카드',             hint:'포켓몬 카드처럼',
    prompt:'아이의 캐릭터 능력치 카드. 이름·타입·기술 3개·HP·공격·방어·스피드·귀여움·행운·특수능력·약점·친구가 되는 조건 포함. 재밌게.'},

{id:'c-goods',    emoji:'🏷️', name:'캐릭터 굿즈 문구',                hint:'스티커·엽서·머그컵',
    prompt:'아이의 캐릭터로 만들 굿즈 4종 문구 (스티커·엽서·머그컵·파우치) 각각 한국어·일본어·영어 3언어 병기. 귀엽고 짧게.'},

{id:'c-friends',  emoji:'👫', name:'캐릭터 친구들 함께 이야기',      hint:'2명 주인공',
    prompt:'아이가 설명한 캐릭터 2명이 함께 모험하는 짧은 이야기 (400자). 둘의 성격이 다르지만 협력해서 문제를 해결. 티키타카 대화 풍부하게. 우정의 교훈.'}

];

// 4) 캐릭터 놀이터 시작 가이드 팝업 (선택 시 처음 한 번만)
(function(){
  const ORIG_OPEN = window.openKidsGroup;
  if (typeof ORIG_OPEN !== 'function') return;
  window.openKidsGroup = function(gid){
    const r = ORIG_OPEN.apply(this, arguments);
    if (gid === 'character' && !localStorage.getItem('uc_char_intro_shown')) {
      localStorage.setItem('uc_char_intro_shown','1');
      setTimeout(() => {
        const pop = document.createElement('div');
        pop.className = 'kids-points-pop';
        pop.style.background = 'linear-gradient(135deg,#77DD77,#87CEEB)';
        pop.style.fontSize = '24px';
        pop.innerHTML = '🎨 캐릭터 놀이터 열림! 🧸<br><span style="font-size:16px">저작권 걱정 없는 내 캐릭터 만들기 ✨</span>';
        document.body.appendChild(pop);
        setTimeout(()=>pop.remove(), 2800);
      }, 300);
    }
    return r;
  };
})();

/* ═══════════════════════════════════════════════

/* 📖 가이드 모드 — 10 탭 · 초등학생도 이해할 수 있는 설명
   =============================================== */
const GD_TABS = [

{id:'wizard',  label:'🚀 온보딩 마법사'},

{id:'quick',   label:'⚡ 3분 빠른 시작'},

{id:'concept', label:'📖 개념 설명'},

{id:'ba',      label:'📊 Before/After'},

{id:'calc',    label:'💰 비용 계산기'},

{id:'cases',   label:'🏆 성공 사례'},

{id:'pkg',     label:'📦 패키지 비교'},

{id:'trouble', label:'🔧 문제 해결'},

{id:'course',  label:'🗓️ 5일 완전정복'},

{id:'tips',    label:'💡 꿀팁 & 지원'}

];

/* ─── 탭1: 🚀 온보딩 마법사 ─── */

/* ─── 탭3: 📖 개념 설명 ─── */

/* ─── 탭5: 💰 비용 계산기 ─── */

/* ─── 탭7: 📦 패키지 비교 ─── */

/* ─── 탭9: 🗓️ 5일 완전정복 ─── */

/* ─── 가이드 내 검색 ─── */
