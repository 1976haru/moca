/* ========================================================
   core/bench.js  --  벤치마킹 + 설정/프로필 (중복) + 트렌드 데이터 + Intent 보조
   index.html 인라인 블록 2에서 통째 분리 (Phase B)
   주의: core/settings.js, core/profile.js 와 중복 선언 존재 (추후 정리 필요)
   ======================================================== */

/* (original HTML-level section header for this block was here) */
const LS_BENCH_LIBRARY = 'uc_bench_library';

const BENCH = {
  tab: 'video',
  video: { url:'', script:'', title:'', views:'', subs:'', date:'', lang:'ko',
           analysis:null, titleAB:null, thumbAnalysis:null, commentAnalysis:null, myTopic:'' },
  channel: { url:'', result:null, items:{pattern:true,top:true,bottom:true,title:true,thumb:true,time:true} },
  gap:    { keywords:'', result:null },
};

function closeBench(){
  document.getElementById('benchDetail').classList.add('hide');
  document.querySelector('.hero').style.display = '';
  document.getElementById('grid').style.display = '';
}

function benchTab(t){
  BENCH.tab = t;
  document.querySelectorAll('.bench-tab').forEach(b => b.classList.toggle('on', b.getAttribute('data-t') === t));
  renderBenchHub();
}

function renderBenchHub(){
  const body = document.getElementById('bench-body');
  if(!body) return;
  const r = { video:_renderBenchVideo, channel:_renderBenchChannel, gap:_renderBenchGap, library:_renderBenchLibrary }[BENCH.tab] || _renderBenchVideo;
  body.innerHTML = r();
  if(BENCH.tab === 'video' && BENCH.video.analysis) _bindVideoResultEvents();
}

/* ─── TAB 1: 영상 분석 ─── */

function _renderBenchVideo(){
  const v = BENCH.video;
  const input =
    '<div class="bench-panel">' +
      '<h4>STEP 1 · 영상 정보 수집</h4>' +
      '<p class="hint">가장 정확한 방법은 <b>대본 붙여넣기</b> 입니다 (YouTube: ··· → 스크립트 열기 → 전체 복사)</p>' +

      '<h5>📋 대본 / 자막 (필수)</h5>' +
      '<textarea class="bench-input" id="bv-script" placeholder="유튜브 자막을 여기에 붙여넣어주세요.&#10;&#10;자막 가져오는 법: 영상 → ··· 더보기 → 스크립트 열기 → 전체 선택 → 복사 → 여기 붙여넣기">' + (v.script||'') + '</textarea>' +

      '<h5>🔗 URL (선택)</h5>' +
      '<input class="bench-small" id="bv-url" placeholder="https://youtube.com/watch?v=..." value="' + (v.url||'') + '">' +
      '<p class="hint" style="font-size:11px">URL 은 참고용 · 실제 분석은 위 대본으로 진행합니다 (브라우저 CORS 제약)</p>' +

      '<div class="bench-row" style="margin-top:10px">' +
        '<div><label>제목</label><input class="bench-small" id="bv-title" placeholder="원본 영상 제목" value="' + (v.title||'') + '"></div>' +
        '<div><label>채널 언어</label><select class="bench-small" id="bv-lang"><option value="ko" ' + (v.lang==='ko'?'selected':'') + '>🇰🇷 한국</option><option value="ja" ' + (v.lang==='ja'?'selected':'') + '>🇯🇵 일본</option></select></div>' +
      '</div>' +
      '<div class="bench-row">' +
        '<div><label>조회수</label><input class="bench-small" id="bv-views" placeholder="예: 1,200,000" value="' + (v.views||'') + '"></div>' +
        '<div><label>구독자</label><input class="bench-small" id="bv-subs" placeholder="예: 150,000" value="' + (v.subs||'') + '"></div>' +
      '</div>' +
      '<div class="bench-row">' +
        '<div><label>업로드</label><input class="bench-small" type="date" id="bv-date" value="' + (v.date||'') + '"></div>' +
        '<div style="display:flex;align-items:flex-end"><button class="vs-btn pri lg" style="width:100%" onclick="benchAnalyzeVideo()">🔍 전체 분석 시작</button></div>' +
      '</div>' +
    '</div>';

  if(!v.analysis) return input;

  // 분석 결과 렌더
  const a = v.analysis;
  const scoreBars = (frames) => (frames||[]).map(f =>
    '<div class="bench-bar"><span class="lbl">' + f.range + '</span><div class="bar"><b style="width:' + (f.score||0) + '%"></b></div><span class="val">' + (f.score||0) + '</span></div>'
  ).join('');
  const topSentences = (a.topSentences||[]).slice(0,5).map((s,i) =>
    '<div style="padding:10px;background:#fff;border:1px solid var(--line);border-radius:10px;margin:6px 0">' +
      `<b>${i+1}. ${(s.text||'').replace(/</g,'&lt;')}</b>` +
      '<div style="font-size:12px;color:var(--sub);margin-top:4px">패턴: ' + (s.pattern||'') + '</div>' +
    '</div>'
  ).join('');

  const result =
    '<div class="bench-panel">' +
      '<h4>STEP 2 · 대본 심층 분석 결과</h4>' +

      '<div class="bench-section">' +
        '<h5>🎯 훅 분석</h5>' +
        '<p><b>첫 문장:</b> "' + ((a.hook && a.hook.firstLine) || '') + '"</p>' +
        '<p><b>유형:</b> ' + ((a.hook && a.hook.type) || '—') + ' · <span class="bench-score ok">' + ((a.hook && a.hook.score) || 0) + '점</span></p>' +
        '<p style="font-size:12.5px;color:var(--sub);white-space:pre-wrap">' + ((a.hook && a.hook.whyWorks) || '') + '</p>' +
        (a.hook && a.hook.myVersion ? '<div style="margin-top:8px;padding:10px;background:#fff5fa;border-radius:10px"><b>내 채널 버전:</b> "' + a.hook.myVersion + '"</div>' : '') +
      '</div>' +

      '<div class="bench-section">' +
        '<h5>⏱ 첫 30초 프레임 분석</h5>' +
        scoreBars(a.frames) +
        (a.riskZone ? '<div style="margin-top:8px;padding:8px;background:#fff7ee;border-left:3px solid #d48a3a;border-radius:6px;font-size:12.5px">⚠️ <b>이탈 위험:</b> ' + a.riskZone + '</div>' : '') +
      '</div>' +

      '<div class="bench-section">' +
        '<h5>🧱 대본 구조 분석</h5>' +
        '<p><b>구조 유형:</b> ' + ((a.structure && a.structure.type) || '—') + ' · <span class="bench-score">' + ((a.structure && a.structure.score) || 0) + '점</span></p>' +
        '<pre style="font-size:12px;background:#fff;padding:10px;border-radius:8px;margin:0;white-space:pre-wrap">' + ((a.structure && a.structure.breakdown) || '') + '</pre>' +
      '</div>' +

      '<div class="bench-section">' +
        '<h5>💬 핵심 문장 TOP 5</h5>' +
        topSentences +
        (a.commonPattern ? '<div style="margin-top:8px;padding:10px;background:#fff5fa;border-radius:10px"><b>공통 패턴:</b> ' + a.commonPattern + '</div>' : '') +
      '</div>' +

      '<div class="bench-section">' +
        '<h5>🗣 언어 스타일</h5>' +
        '<pre style="font-size:12.5px;white-space:pre-wrap;margin:0">' + ((a.language && a.language.summary) || '') + '</pre>' +
      '</div>' +
    '</div>' +

    '<div class="bench-panel">' +
      '<h4>STEP 3 · 제목 공식 분석 + A/B</h4>' +
      '<p class="hint">주제 입력 시 같은 공식으로 5개 제목을 자동 생성합니다.</p>' +
      '<input class="bench-small" id="bv-mytopic" placeholder="내 주제 (예: 치매예방 운동 TOP3)" value="' + (v.myTopic||'') + '">' +
      '<button class="vs-btn pri" style="margin-top:8px" onclick="benchGenTitles()">🧪 제목 5개 + CTR 예측</button>' +
      (v.titleAB ? '<div style="margin-top:10px">' + (v.titleAB||[]).map((t,i) => '<div style="padding:8px 12px;background:#fff;border:1px solid var(--line);border-radius:10px;margin:4px 0;display:flex;justify-content:space-between;align-items:center;gap:8px"><span><b>' + String.fromCharCode(65+i) + '.</b> ' + t.title + '</span><span class="bench-score ' + (t.ctr>=8?'ok':t.ctr>=6?'':'warn') + '">CTR ' + t.ctr + '%</span></div>').join('') + '</div>' : '') +
    '</div>' +

    '<div class="bench-panel">' +
      '<h4>STEP 4 · 썸네일 분석</h4>' +
      '<p class="hint">썸네일 이미지를 붙여넣거나 URL 입력 · 없어도 텍스트 패턴 분석 가능</p>' +
      '<input class="bench-small" id="bv-thumb-url" placeholder="썸네일 이미지 URL (선택)">' +
      '<button class="vs-btn" style="margin-top:8px" onclick="benchAnalyzeThumb()">🖼 썸네일 패턴 분석</button>' +
      (v.thumbAnalysis ? '<div class="bench-section" style="margin-top:10px"><pre style="white-space:pre-wrap;margin:0;font-size:12.5px">' + v.thumbAnalysis + '</pre></div>' : '') +
      '<button class="vs-btn" style="margin-top:8px" onclick="benchGenThumb()">🎨 같은 공식으로 내 썸네일 생성</button>' +
    '</div>' +

    '<div class="bench-panel">' +
      '<h4>STEP 5 · 댓글 감성 분석</h4>' +
      '<textarea class="bench-input" id="bv-comments" placeholder="인기 댓글을 복사해서 붙여넣어주세요 (여러 개 가능)" style="min-height:90px"></textarea>' +
      '<button class="vs-btn" style="margin-top:8px" onclick="benchAnalyzeComments()">💬 댓글 분석</button>' +
      (v.commentAnalysis ? '<div class="bench-section" style="margin-top:10px"><pre style="white-space:pre-wrap;margin:0;font-size:12.5px">' + v.commentAnalysis + '</pre></div>' : '') +
    '</div>' +

    '<div class="bench-panel" style="background:linear-gradient(135deg,#fff5fa,#f7f4ff)">' +
      '<h4>STEP 6-7 · 원클릭 벤치마킹 대본 생성</h4>' +
      '<p class="hint">분석된 공식 (훅 패턴·구조·제목·CTA) 을 모두 적용해서 내 주제로 즉시 생성</p>' +
      '<input class="bench-small" id="bv-bench-topic" placeholder="내 주제 (예: 치매예방 운동 TOP3)">' +
      '<div class="bench-checklist" style="margin-top:8px">' +
        '<label><input type="checkbox" id="b-apply-hook" checked> 훅 패턴 적용</label>' +
        '<label><input type="checkbox" id="b-apply-struct" checked> 대본 구조 적용</label>' +
        '<label><input type="checkbox" id="b-apply-title" checked> 제목 공식 적용</label>' +
        '<label><input type="checkbox" id="b-apply-cta" checked> CTA 방식 적용</label>' +
        '<label><input type="checkbox" id="b-apply-senior" checked> 시니어 채널 커스터마이징</label>' +
        '<label><input type="checkbox" id="b-apply-bilingual"> 한국+일본 동시 생성</label>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
        '<button class="vs-btn pri lg" onclick="benchCreateFromFormula()">🚀 벤치마킹 대본 즉시 생성!</button>' +
        '<button class="vs-btn" onclick="benchSaveFormula()">💾 이 공식 라이브러리 저장</button>' +
      '</div>' +
      '<div id="bv-final-out" style="margin-top:12px"></div>' +
    '</div>';

  return input + result;
}

function _bindVideoResultEvents(){
  // 값 복원
  const v = BENCH.video;
  ['bv-title','bv-url','bv-views','bv-subs','bv-date'].forEach(id => {
    const el = document.getElementById(id); if(el) el.addEventListener('change', ()=>{ const k = id.slice(3); v[k] = el.value; });
  });
}

/* 메인 분석 AI 호출 */
async function benchAnalyzeVideo(){
  const v = BENCH.video;
  v.script = document.getElementById('bv-script').value.trim();
  v.url    = document.getElementById('bv-url').value.trim();
  v.title  = document.getElementById('bv-title').value.trim();
  v.views  = document.getElementById('bv-views').value.trim();
  v.subs   = document.getElementById('bv-subs').value.trim();
  v.date   = document.getElementById('bv-date').value;
  v.lang   = document.getElementById('bv-lang').value;
  if(!v.script){ alert('대본/자막을 붙여넣어주세요'); return; }
  try{
    const sys =
      '유튜브 영상 대본을 심층 분석한다. 반드시 아래 JSON 스키마만 출력:\n' +
      '{\n' +
      '  "hook": {"firstLine":"첫 문장","type":"훅 유형","score":0~100,"whyWorks":"3줄 이유","myVersion":"시니어 채널 변환 예시"},\n' +
      '  "frames": [{"range":"0~3초","score":0~100},{"range":"3~8초","score":0~100},{"range":"8~15초","score":0~100},{"range":"15~30초","score":0~100}],\n' +
      '  "riskZone": "가장 이탈 위험 구간과 이유 (1줄) 또는 null",\n' +
      '  "structure": {"type":"5단계 완결형 등","score":0~100,"breakdown":"0~5초: ...\\n5~15초: ..."},\n' +
      '  "topSentences": [{"text":"문장","pattern":"패턴 설명"}, ... 5개],\n' +
      '  "commonPattern": "공통 패턴 1줄",\n' +
      '  "language": {"summary":"평균 문장길이, 구어체 비율, 질문 횟수, 호칭, 이모지/감탄사 사용, 번역투 여부 등을 요약"}\n' +
      '}';
    const user = '제목: ' + v.title + '\n채널 언어: ' + v.lang + '\n\n=== 대본 ===\n' + v.script.slice(0,8000);
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens: 3500, featureId:'bench-video' });
    const m = res.match(/\{[\s\S]*\}/); if(!m) throw new Error('JSON 파싱 실패');
    v.analysis = JSON.parse(m[0]);
    renderBenchHub();
  }catch(e){ alert('❌ ' + e.message); }
}

async function benchGenTitles(){
  const v = BENCH.video;
  v.myTopic = document.getElementById('bv-mytopic').value.trim();
  if(!v.myTopic){ alert('내 주제를 입력해주세요'); return; }
  try{
    const sys = '원본 제목의 공식(파워워드·숫자·감정)을 분석해서 내 주제로 제목 5개 생성. JSON 배열: [{"title":"","ctr":숫자(예측 클릭률 %, 4~10)}]. 원본 공식을 유지하며 다양하게.';
    const user = '원본 제목: ' + v.title + '\n내 주제: ' + v.myTopic;
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens: 800 });
    const m = res.match(/\[[\s\S]*\]/); if(!m) throw new Error('JSON 파싱 실패');
    v.titleAB = JSON.parse(m[0]);
    renderBenchHub();
  }catch(e){ alert('❌ ' + e.message); }
}

async function benchAnalyzeThumb(){
  const v = BENCH.video;
  const url = document.getElementById('bv-thumb-url').value.trim();
  try{
    const sys = '유튜브 썸네일의 성공 공식을 분석하라. 색상 구성(메인 3색+%), 메인/서브 텍스트(크기·폰트 스타일·색상), 위치(좌상/중앙/우하 등), 이미지 요소(인물·배경·표정), 예상 클릭률(%)을 간결히 출력. 썸네일 URL 이 없으면 제목/주제 기반으로 일반 패턴 분석.';
    const user = '제목: ' + v.title + '\n썸네일 URL: ' + (url||'없음') + '\n채널 언어: ' + v.lang;
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens: 800 });
    v.thumbAnalysis = res.trim();
    renderBenchHub();
  }catch(e){ alert('❌ ' + e.message); }
}

async function benchGenThumb(){
  const v = BENCH.video;
  if(!v.analysis){ alert('먼저 영상 분석을 완료해주세요'); return; }
  /* 통합 store(script.openai) 우선, legacy uc_openai_key fallback */
  const key = (typeof window.ucGetApiKey === 'function')
    ? window.ucGetApiKey('openai')
    : (localStorage.getItem('uc_openai_key') || '');
  if(!key){
    if (confirm('OpenAI 키가 필요해요 (DALL·E 3). 통합 API 설정을 열까요?')) {
      if (typeof window.openApiSettingsModal === 'function') window.openApiSettingsModal('script');
    }
    return;
  }
  const title = v.myTopic || v.title;
  try{
    const prompt = 'YouTube thumbnail, 16:9, bold Korean text ' + title.replace(/[^a-zA-Z0-9가-힣\s]/g,'') + ', high contrast emotional face, dramatic lighting, red and yellow accents';
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body: JSON.stringify({ model:'dall-e-3', prompt, n:1, size:'1792x1024', response_format:'url' })
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error?.message || 'HTTP '+res.status);
    const imgUrl = data.data?.[0]?.url;
    const area = document.getElementById('bv-final-out') || document.getElementById('bench-body');
    const box = document.createElement('div');
    box.style.margin = '10px 0';
    box.innerHTML = '<p><b>🎨 벤치마킹 썸네일</b></p><img src="' + imgUrl + '" style="max-width:100%;border-radius:12px">';
    area.appendChild(box);
  }catch(e){ alert('❌ ' + e.message); }
}

async function benchAnalyzeComments(){
  const v = BENCH.video;
  const comments = document.getElementById('bv-comments').value.trim();
  if(!comments){ alert('댓글을 붙여넣어주세요'); return; }
  try{
    const sys = '유튜브 댓글을 분석하라. 출력:\n반응 분포 (감동/정보/공유/부정 %)\n핵심 키워드 TOP 5\n시청자가 진짜 원하는 것 3가지\n다음 영상 아이디어 3개';
    const res = await APIAdapter.callWithFallback(sys, comments.slice(0,4000), { maxTokens: 800 });
    v.commentAnalysis = res.trim();
    renderBenchHub();
  }catch(e){ alert('❌ ' + e.message); }
}

async function benchCreateFromFormula(){
  const v = BENCH.video;
  if(!v.analysis){ alert('먼저 영상 분석을 완료해주세요'); return; }
  const topic = document.getElementById('bv-bench-topic').value.trim() || v.myTopic;
  if(!topic){ alert('내 주제를 입력해주세요'); return; }
  const flags = {
    hook:   document.getElementById('b-apply-hook').checked,
    struct: document.getElementById('b-apply-struct').checked,
    title:  document.getElementById('b-apply-title').checked,
    cta:    document.getElementById('b-apply-cta').checked,
    senior: document.getElementById('b-apply-senior').checked,
    bilingual: document.getElementById('b-apply-bilingual').checked
  };
  try{
    const sys =
      '분석된 원본 영상의 공식을 적용해서 내 주제로 60초 유튜브 숏츠 대본을 작성.\n' +
      (flags.hook   ? '훅 패턴: ' + JSON.stringify(v.analysis.hook||{}) + '\n' : '') +
      (flags.struct ? '구조 적용: ' + JSON.stringify(v.analysis.structure||{}) + '\n' : '') +
      (flags.senior ? '시니어 채널 조정: 느린 편집속도(5초/씬), 큰 자막, 부드러운 충격 표현, 잔잔한 BGM 가정하여 나레이션 톤 반영.\n' : '') +
      (flags.cta    ? 'CTA: 댓글·공유 유도형 1문장으로 마무리.\n' : '') +
      '출력: 6~8씬 대본, 각 씬은 [0~5초] 형식으로 시작. 맨 위에 제목 1줄 포함.' +
      (flags.bilingual ? '\n한국어 버전 먼저, 이어서 === 日本語 === 구분선 후 일본어 버전.' : '');
    const user = '내 주제: ' + topic + '\n원본 영상 핵심문장 패턴: ' + (v.analysis.commonPattern||'');
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens: 3500, featureId:'bench-create' });
    const out = document.getElementById('bv-final-out');
    out.innerHTML = '<div class="bench-section"><h5>🚀 벤치마킹 대본</h5><pre style="white-space:pre-wrap;font-size:13px;margin:0">' + res + '</pre></div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' +
        '<button class="vs-btn" onclick="navigator.clipboard.writeText(' + JSON.stringify(res) + ');alert(\'📋 복사됨\')">📋 복사</button>' +
        '<button class="vs-btn pri" onclick="benchSendToShorts(' + JSON.stringify(topic) + ',' + JSON.stringify(res) + ')">🎬 자동숏츠로 보내기</button>' +
      '</div>';
    out.scrollIntoView({ behavior:'smooth', block:'center' });
  }catch(e){ alert('❌ ' + e.message); }
}

function benchSendToShorts(topic, script){
  const key = 'hub_scripts_v1';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  list.unshift({ source:'bench', lang:'ko', text:script, at:Date.now(), meta:{topic} });
  localStorage.setItem(key, JSON.stringify(list.slice(0,30)));
  if(confirm('🎬 자동숏츠 엔진으로 이동할까요?')) location.href='engines/shorts/index.html?topic=' + encodeURIComponent(topic);
}

function benchSaveFormula(){
  const v = BENCH.video;
  if(!v.analysis){ alert('먼저 분석을 완료해주세요'); return; }
  const name = prompt('공식 이름 (예: 감동형 성공 공식)') ;
  if(!name) return;
  const entry = {
    id: 'bf_' + Date.now().toString(36),
    name, savedAt: Date.now(),
    title: v.title, lang: v.lang, views: v.views,
    analysis: v.analysis, titleAB: v.titleAB, thumbAnalysis: v.thumbAnalysis, commentAnalysis: v.commentAnalysis
  };
  const list = JSON.parse(localStorage.getItem(LS_BENCH_LIBRARY)||'[]');
  list.unshift(entry);
  localStorage.setItem(LS_BENCH_LIBRARY, JSON.stringify(list.slice(0,50)));
  alert('💾 "' + name + '" 라이브러리에 저장됨');
}

/* ─── TAB 2: 채널 분석 ─── */

function _renderBenchChannel(){
  const c = BENCH.channel;
  return '<div class="bench-panel">' +
    '<h4>📺 채널 분석</h4>' +
    '<p class="hint">URL 로는 직접 접근 불가 (CORS). 분석 원하는 <b>채널 이름 + 특징</b> 을 간단히 적어주시면 AI 가 일반 패턴 분석을 해드려요.</p>' +
    '<input class="bench-small" id="bc-name" placeholder="채널명 (예: 시니어라이프 TV)" value="' + (c.url||'') + '">' +
    '<textarea class="bench-input" id="bc-desc" style="min-height:90px" placeholder="채널 설명 (장르·타겟·최근 영상 스타일 등을 3~5줄로)"></textarea>' +
    '<div class="bench-checklist">' +
      '<label><input type="checkbox" id="bc-pattern" checked> 업로드 패턴 분석</label>' +
      '<label><input type="checkbox" id="bc-top"     checked> 잘된 영상 TOP10 공통점</label>' +
      '<label><input type="checkbox" id="bc-bottom"  checked> 안된 영상 BOTTOM10 차이점</label>' +
      '<label><input type="checkbox" id="bc-title"   checked> 제목 공식 패턴</label>' +
      '<label><input type="checkbox" id="bc-thumb"   checked> 썸네일 스타일 변화</label>' +
      '<label><input type="checkbox" id="bc-time"    checked> 최적 업로드 시간</label>' +
    '</div>' +
    '<button class="vs-btn pri" style="margin-top:10px" onclick="benchAnalyzeChannel()">🔍 분석 시작</button>' +
    (c.result ? '<div class="bench-section" style="margin-top:12px"><pre style="white-space:pre-wrap;font-size:12.5px;margin:0">' + c.result + '</pre></div>' : '') +
  '</div>';
}
async function benchAnalyzeChannel(){
  const c = BENCH.channel;
  const name = document.getElementById('bc-name').value.trim();
  const desc = document.getElementById('bc-desc').value.trim();
  if(!name || !desc){ alert('채널명과 설명을 입력해주세요'); return; }
  const items = ['pattern','top','bottom','title','thumb','time'].filter(k => document.getElementById('bc-' + k).checked);
  c.url = name;
  try{
    const sys =
      '유튜브 채널 벤치마킹 분석. 아래 항목별로 실전 팁을 구체 수치와 함께 출력:\n' +
      (items.includes('pattern') ? '[업로드 패턴] 주기·최적 시간·평균 길이\n' : '') +
      (items.includes('top')     ? '[TOP10 공통점] ✅ 제목·썸네일·훅·길이 패턴\n' : '') +
      (items.includes('bottom')  ? '[BOTTOM10 차이점] ❌ 어떤 패턴이 실패하는지\n' : '') +
      (items.includes('title')   ? '[제목 공식] 숫자·파워워드·패턴 등\n' : '') +
      (items.includes('thumb')   ? '[썸네일 스타일] 색상·레이아웃·변화\n' : '') +
      (items.includes('time')    ? '[최적 업로드 시간] 요일·시간\n' : '') +
      '[내 채널 적용 순위] 큰 영향 순 3가지\n' +
      '모든 설명 3~5줄로 간결히.';
    const res = await APIAdapter.callWithFallback(sys, '채널: ' + name + '\n특징:\n' + desc, { maxTokens: 1800, featureId:'bench-channel' });
    c.result = res.trim();
    renderBenchHub();
  }catch(e){ alert('❌ ' + e.message); }
}

/* ─── TAB 3: 콘텐츠 갭 ─── */
function _renderBenchGap(){
  const g = BENCH.gap;
  return '<div class="bench-panel">' +
    '<h4>🗺 콘텐츠 갭 분석</h4>' +
    '<p class="hint">내 채널 키워드를 입력하면, 포화/기회 주제를 구분해서 추천합니다.</p>' +
    '<input class="bench-small" id="bg-kw" placeholder="예: 시니어, 건강, 치매, 노후, 일본" value="' + (g.keywords||'') + '">' +
    '<button class="vs-btn pri" style="margin-top:10px" onclick="benchAnalyzeGap()">🔍 갭 분석 시작</button>' +
    (g.result ? '<div style="margin-top:12px">' +
      (g.result.red||[]).map(t => '<div class="bench-topic-card red"><span>🔴 <b>' + t.topic + '</b> <small style="color:var(--sub)">· ' + (t.reason||'경쟁 과다') + '</small></span></div>').join('') +
      (g.result.green||[]).map(t => '<div class="bench-topic-card green"><span>🟢 <b>' + t.topic + '</b> <small style="color:var(--sub)">· ' + (t.reason||'블루오션') + '</small></span><button class="vs-btn" onclick="benchGapToScript(' + JSON.stringify(t.topic) + ')">🚀 이 주제로 대본</button></div>').join('') +
      (g.result.ja_green && g.result.ja_green.length ? '<h5 style="margin-top:12px">🇯🇵 일본 채널 갭</h5>' + g.result.ja_green.map(t => '<div class="bench-topic-card green"><span>🟢 <b>' + t.topic + '</b> <small style="color:var(--sub)">· ' + (t.reason||'') + '</small></span><button class="vs-btn" onclick="benchGapToScript(' + JSON.stringify(t.topic) + ')">🚀 대본</button></div>').join('') : '') +
    '</div>' : '') +
  '</div>';
}

async function benchAnalyzeGap(){
  const g = BENCH.gap;
  g.keywords = document.getElementById('bg-kw').value.trim();
  if(!g.keywords){ alert('키워드를 입력해주세요'); return; }
  try{
    const sys =
      '콘텐츠 갭 분석. 내 채널 키워드를 기반으로:\n' +
      '- 포화 주제 (경쟁 과다, 진입 어려움) 3~4개\n' +
      '- 기회 주제 (블루오션, 선점 가능) 4~6개\n' +
      '- 일본 채널 기회 주제 2~3개 (昭和の思い出/孫との時間 같은 일본 특화)\n' +
      '반드시 JSON: {"red":[{"topic":"","reason":""}], "green":[{"topic":"","reason":""}], "ja_green":[{"topic":"","reason":""}]}';
    const res = await APIAdapter.callWithFallback(sys, '내 키워드: ' + g.keywords, { maxTokens: 1500 });
    const m = res.match(/\{[\s\S]*\}/); if(!m) throw new Error('JSON 파싱 실패');
    g.result = JSON.parse(m[0]);
    renderBenchHub();
  }catch(e){ alert('❌ ' + e.message); }
}

function benchGapToScript(topic){
  const el = document.getElementById('one-input');
  if(el){ el.value = topic + ' 유튜브 숏츠 대본'; el.scrollIntoView({behavior:'smooth'}); }
  location.hash = '#oneHub';
}

/* ─── TAB 4: 내 공식 라이브러리 ─── */

function _renderBenchLibrary(){
  const list = JSON.parse(localStorage.getItem(LS_BENCH_LIBRARY)||'[]');
  if(!list.length){
    return '<div class="bench-panel">' +
      '<h4>📚 내 공식 라이브러리</h4>' +
      '<p class="hint" style="padding:20px;text-align:center">아직 저장된 공식이 없어요.<br>[📹 영상 분석] 에서 분석 후 "💾 이 공식 라이브러리 저장" 을 누르세요.</p>' +
    '</div>';
  }
  return '<div class="bench-panel">' +
    '<h4>📚 내 공식 라이브러리 <span style="font-weight:400;font-size:12px;color:var(--sub)">· 총 ' + list.length + '개</span></h4>' +
    list.map(f => '<div class="bench-lib-card">' +
      '<div class="hdr"><b>' + (f.name||'무제') + '</b><span class="bench-score">' + (f.lang==='ja'?'🇯🇵':'🇰🇷') + ' ' + (f.views||'?') + ' 조회</span></div>' +
      '<div style="font-size:12px;color:var(--sub);margin-bottom:6px">원본: ' + (f.title||'') + ' · ' + new Date(f.savedAt).toLocaleDateString('ko-KR') + '</div>' +
      '<div style="font-size:12.5px;line-height:1.7;margin:6px 0">' +
        '훅: ' + ((f.analysis?.hook?.type)||'?') + ' · ' +
        '구조: ' + ((f.analysis?.structure?.type)||'?') + ' · ' +
        '점수: ' + ((f.analysis?.structure?.score)||0) + '/100' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
        '<button class="vs-btn pri" onclick="benchApplyFormula(' + JSON.stringify(f.id) + ')">🚀 이 공식으로 즉시 생성</button>' +
        '<button class="vs-btn" onclick="benchLoadFormula(' + JSON.stringify(f.id) + ')">📹 상세 보기</button>' +
        '<button class="vs-btn ghost" onclick="benchDeleteFormula(' + JSON.stringify(f.id) + ')" style="color:var(--err)">🗑</button>' +
      '</div>' +
    '</div>').join('') +

    '<div class="bench-panel" style="background:linear-gradient(135deg,#fff5fa,#f7f4ff);margin-top:16px;padding:14px">' +
      '<h4>✅ 즉시 실행 체크리스트</h4>' +
      '<p class="hint" style="font-size:12px">라이브러리에 저장된 공식 기반 추천 체크리스트</p>' +
      '<div class="bench-checklist">' +
        '<h5 style="margin:6px 0">오늘 당장</h5>' +
        '<label><input type="checkbox"> 다음 영상 제목에 숫자 추가</label>' +
        '<label><input type="checkbox"> 첫 문장을 질문형으로 변경</label>' +
        '<label><input type="checkbox"> 썸네일에 6글자 텍스트 추가</label>' +
        '<h5 style="margin:10px 0 6px">이번 주</h5>' +
        '<label><input type="checkbox"> 영상 길이 55~60초로 맞추기</label>' +
        '<label><input type="checkbox"> 감동 씬 BGM 볼륨 20% 로 조정</label>' +
        '<label><input type="checkbox"> CTA 를 댓글 유도형으로 변경</label>' +
        '<h5 style="margin:10px 0 6px">이번 달</h5>' +
        '<label><input type="checkbox"> 콘텐츠 갭 주제 3개 기획</label>' +
        '<label><input type="checkbox"> 시리즈물 1개 시작</label>' +
        '<label><input type="checkbox"> 업로드 시간 최적화 테스트</label>' +
      '</div>' +
    '</div>' +
  '</div>';
}
function benchLoadFormula(id){
  const list = JSON.parse(localStorage.getItem(LS_BENCH_LIBRARY)||'[]');
  const f = list.find(x => x.id === id); if(!f) return;
  BENCH.video = Object.assign({}, BENCH.video, {
    title: f.title, lang: f.lang, analysis: f.analysis,
    titleAB: f.titleAB, thumbAnalysis: f.thumbAnalysis, commentAnalysis: f.commentAnalysis,
    script: BENCH.video.script || '(라이브러리에서 로드)'
  });
  benchTab('video');
}
function benchApplyFormula(id){
  benchLoadFormula(id);
  const topic = prompt('이 공식으로 어떤 주제를 만들까요?');
  if(!topic) return;
  BENCH.video.myTopic = topic;
  setTimeout(() => {
    const el = document.getElementById('bv-bench-topic');
    if(el){ el.value = topic; benchCreateFromFormula(); }
  }, 100);
}
function benchDeleteFormula(id){
  if(!confirm('이 공식을 삭제할까요?')) return;
  const list = JSON.parse(localStorage.getItem(LS_BENCH_LIBRARY)||'[]').filter(x => x.id !== id);
  localStorage.setItem(LS_BENCH_LIBRARY, JSON.stringify(list));
  renderBenchHub();
}

