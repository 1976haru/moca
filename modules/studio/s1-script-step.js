/* ================================================
   modules/studio/s1-script-step.js
   STEP 1 — 대본 생성 (자동숏츠 전용)

   기능:
   - 주제 입력 → 스타일·길이·언어 선택
   - AI 대본 생성 (callAI 직접 호출)
   - 씬 자동 분리
   - STUDIO.project 저장
   - engines/script postMessage 수신 브리지
   ================================================ */

/* ── 스타일 옵션 ── */
const S1_STYLES = [
  { id:'emotional',    ico:'❤️',  label:'감동',   desc:'공감·눈물·따뜻함' },
  { id:'info',         ico:'📊',  label:'정보',   desc:'팁·노하우·정리' },
  { id:'humor',        ico:'😄',  label:'유머',   desc:'웃음·반전·코믹' },
  { id:'drama',        ico:'🎭',  label:'드라마', desc:'긴장·폭로·반전' },
  { id:'senior',       ico:'👴',  label:'시니어', desc:'건강·노후·생활' },
  { id:'knowledge',    ico:'🧠',  label:'지식',   desc:'전문·학습·교양' },
];

const S1_LENGTHS = [
  { id:30,   label:'30초', scenes:3 },
  { id:60,   label:'1분',  scenes:5, default:true },
  { id:180,  label:'3분',  scenes:8 },
  { id:600,  label:'10분', scenes:15 },
];

/* ── 전역 상태 ── */
let _s1Style   = 'emotional';
let _s1Length  = 60;
let _s1Lang    = 'both';
let _s1Loading = false;
let _s1Result  = null; // { ko, ja, scenes }

/* ════════════════════════════════════════════════
   메인 렌더
   ════════════════════════════════════════════════ */
function _studioS1Step(wrapId) {
  const wrap = document.getElementById(wrapId || 'studioS1Wrap');
  if (!wrap) return;

  const proj  = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const topic = proj.topic || '';

  // 기존 결과 복원
  if (!_s1Result && proj.scriptText) {
    _s1Result = {
      ko: proj.scriptText,
      ja: proj.scriptJa || '',
      scenes: proj.scenes || [],
    };
  }

  // 채널 언어 기본값 동기화
  if (proj.lang && !_s1Lang) _s1Lang = proj.lang;

  wrap.innerHTML = `
  <div class="s1s-wrap">

    <!-- 주제 입력 -->
    <div class="s1s-block">
      <div class="s1s-label">📝 주제 입력</div>
      <div class="s1s-topic-row">
        <textarea class="s1s-topic-inp" id="s1sTopic" rows="2"
          placeholder="예) 60대가 모르면 후회하는 노후 준비법&#10;예) 무릎 통증 없애는 5가지 습관"
          oninput="_s1SyncTopic(this.value)">${topic}</textarea>
        <button class="s1s-ai-suggest" onclick="_s1SuggestTopic()"
          title="AI 주제 추천">✨</button>
      </div>
      <div class="s1s-topic-chips" id="s1sTopicChips">
        ${_s1GetQuickTopics().map(t=>`
          <button class="s1s-chip" onclick="_s1SetTopic('${_esc(t)}')">${t}</button>
        `).join('')}
      </div>
    </div>

    <!-- 스타일 선택 -->
    <div class="s1s-block">
      <div class="s1s-label">🎬 영상 스타일</div>
      <div class="s1s-style-grid">
        ${S1_STYLES.map(s=>`
          <button class="s1s-style-btn ${_s1Style===s.id?'on':''}"
            onclick="_s1Style='${s.id}';_studioS1Step('${wrapId||'studioS1Wrap'}')">
            <span class="s1s-style-ico">${s.ico}</span>
            <span class="s1s-style-label">${s.label}</span>
            <span class="s1s-style-desc">${s.desc}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- 길이 + 언어 -->
    <div class="s1s-block s1s-row-2">
      <div class="s1s-sub-block">
        <div class="s1s-label">⏱ 영상 길이</div>
        <div class="s1s-seg">
          ${S1_LENGTHS.map(l=>`
            <button class="s1s-seg-btn ${_s1Length===l.id?'on':''}"
              onclick="_s1Length=${l.id};_studioS1Step('${wrapId||'studioS1Wrap'}')">
              ${l.label}
            </button>
          `).join('')}
        </div>
      </div>
      <div class="s1s-sub-block">
        <div class="s1s-label">🌐 언어</div>
        <div class="s1s-seg">
          ${[['ko','🇰🇷 한국어'],['ja','🇯🇵 일본어'],['both','🇰🇷🇯🇵 동시']].map(([v,l])=>`
            <button class="s1s-seg-btn ${_s1Lang===v?'on':''}"
              onclick="_s1Lang='${v}';_studioS1Step('${wrapId||'studioS1Wrap'}')">
              ${l}
            </button>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- 생성 버튼 -->
    <button class="s1s-gen-btn ${_s1Loading?'loading':''}"
      id="s1sGenBtn"
      onclick="_s1Generate('${wrapId||'studioS1Wrap'}')"
      ${_s1Loading?'disabled':''}>
      ${_s1Loading
        ? '<span class="s1s-spin">⏳</span> 대본 생성 중...'
        : '✨ AI 대본 생성'}
    </button>

    <!-- 결과 -->
    ${_s1Result ? _s1RenderResult(wrapId) : ''}

    <!-- 고급 모드 링크 -->
    <div class="s1s-advanced-link">
      <a href="../../engines/script/index.html?mode=shorts&embed=1"
        target="_blank" onclick="_s1SetupBridge()">
        📝 대본생성기 전체 기능 열기 (고급)
      </a>
    </div>

  </div>`;

  _s1InjectCSS();
  _s1SetupMessageBridge();
}

/* ── 결과 렌더 ── */
function _s1RenderResult(wrapId) {
  const r = _s1Result;
  if (!r) return '';

  const scenes = r.scenes || [];

  return `
  <div class="s1s-result">
    <div class="s1s-result-hd">
      <span class="s1s-result-title">✅ 생성된 대본</span>
      <div class="s1s-result-actions">
        <button class="s1s-mini-btn" onclick="_s1CopyScript('ko')">한국어 복사</button>
        ${r.ja ? `<button class="s1s-mini-btn" onclick="_s1CopyScript('ja')">일본어 복사</button>` : ''}
        <button class="s1s-mini-btn danger" onclick="_s1ClearResult('${wrapId}')">다시 생성</button>
      </div>
    </div>

    <!-- 씬 목록 -->
    <div class="s1s-scenes">
      <div class="s1s-scenes-hd">
        📋 씬 구성 (${scenes.length}씬)
        <span class="s1s-scenes-hint">클릭해서 편집</span>
      </div>
      ${scenes.map((s,i)=>`
        <div class="s1s-scene-item" onclick="_s1EditScene(${i},'${wrapId}')">
          <span class="s1s-scene-num">${i+1}</span>
          <div class="s1s-scene-content">
            <div class="s1s-scene-label">${s.label||s.desc||'씬 '+(i+1)}</div>
            <div class="s1s-scene-text">${(s.text||'').slice(0,60)}${(s.text||'').length>60?'...':''}</div>
          </div>
          <span class="s1s-scene-edit">✏️</span>
        </div>
      `).join('')}
    </div>

    <!-- 대본 텍스트 (접히는) -->
    <details class="s1s-script-detail">
      <summary>전체 대본 보기</summary>
      <div class="s1s-script-tabs">
        <button class="s1s-script-tab on" onclick="_s1ShowScriptTab(this,'ko')">🇰🇷 한국어</button>
        ${r.ja ? `<button class="s1s-script-tab" onclick="_s1ShowScriptTab(this,'ja')">🇯🇵 일본어</button>` : ''}
      </div>
      <textarea class="s1s-script-text" id="s1sScriptKo"
        oninput="_s1Result.ko=this.value;_s1SaveToProject()">${r.ko||''}</textarea>
      ${r.ja ? `<textarea class="s1s-script-text" id="s1sScriptJa"
        style="display:none"
        oninput="_s1Result.ja=this.value;_s1SaveToProject()">${r.ja}</textarea>` : ''}
    </details>

    <!-- 다음 단계 -->
    <button class="s1s-next-btn"
      onclick="_s1SaveToProject();typeof studioGoto==='function'&&studioGoto(2)">
      다음: 이미지·영상 소스 →
    </button>
  </div>`;
}

/* ════════════════════════════════════════════════
   AI 대본 생성
   ════════════════════════════════════════════════ */
async function _s1Generate(wrapId) {
  const topic = document.getElementById('s1sTopic')?.value?.trim();
  if (!topic) {
    alert('주제를 입력해주세요!');
    return;
  }

  _s1Loading = true;
  _s1Result  = null;
  _studioS1Step(wrapId);

  try {
    const styleLabel = S1_STYLES.find(s=>s.id===_s1Style)?.label || '감동';
    const lenLabel   = S1_LENGTHS.find(l=>l.id===_s1Length)?.label || '1분';
    const sceneCount = S1_LENGTHS.find(l=>l.id===_s1Length)?.scenes || 5;
    const needJa     = _s1Lang === 'ja' || _s1Lang === 'both';
    const needKo     = _s1Lang === 'ko' || _s1Lang === 'both';

    const sysPrompt = `당신은 유튜브 숏츠/릴스 전문 대본 작가입니다.
주어진 주제로 ${lenLabel} 분량의 ${styleLabel} 스타일 영상 대본을 작성하세요.
대본은 반드시 ${sceneCount}개 씬으로 나눠야 합니다.
각 씬은 "씬N: [씬 설명]" 형식으로 시작하세요.
첫 씬은 반드시 강력한 훅(시청자가 멈추게 만드는 첫 마디)으로 시작하세요.
마지막 씬은 반드시 CTA(구독·좋아요 유도)로 끝내세요.
${needJa ? '한국어 대본 작성 후, 아래에 === 일본어 === 를 쓰고 일본어 번역본도 작성하세요.' : ''}`;

    const userPrompt = `주제: ${topic}
스타일: ${styleLabel}
길이: ${lenLabel} (${sceneCount}씬)
언어: ${_s1Lang === 'ko' ? '한국어만' : _s1Lang === 'ja' ? '일본어만' : '한국어 + 일본어'}`;

    // AI 호출 (callAI 또는 직접 fetch)
    let rawText = '';

    if (typeof callAI === 'function') {
      rawText = await callAI(sysPrompt, userPrompt);
    } else {
      // 직접 API 호출 (Anthropic)
      const apiKey = localStorage.getItem('claude_api_key') ||
                     localStorage.getItem('anthropic_key') || '';
      if (!apiKey) {
        alert('API 키를 설정해주세요 (설정 탭)');
        _s1Loading = false;
        _studioS1Step(wrapId);
        return;
      }
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 2000,
          system: sysPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
      const data = await res.json();
      rawText = data.content?.[0]?.text || '';
    }

    // 한/일 분리
    const parts = rawText.split(/={3,}\s*일본어\s*={3,}/i);
    const koText = parts[0]?.trim() || rawText;
    const jaText = parts[1]?.trim() || '';

    // 씬 파싱
    const scenes = _s1ParseScenes(koText, sceneCount);

    _s1Result = { ko: koText, ja: jaText, scenes };
    _s1SaveToProject(topic);

  } catch (err) {
    console.error('대본 생성 오류:', err);
    alert('대본 생성 중 오류가 발생했습니다.\n' + err.message);
  }

  _s1Loading = false;
  _studioS1Step(wrapId);
}

/* ── 씬 파싱 ── */
function _s1ParseScenes(script, targetCount) {
  const scenePattern = /씬\s*(\d+)\s*[:\-：]\s*([^\n]*)\n([\s\S]*?)(?=씬\s*\d+\s*[:\-：]|$)/g;
  const scenes = [];
  let match;

  while ((match = scenePattern.exec(script)) !== null) {
    scenes.push({
      idx:    scenes.length,
      label:  match[2]?.trim() || `씬 ${scenes.length + 1}`,
      text:   match[3]?.trim() || '',
      desc:   match[2]?.trim() || '',
      caption: (match[3]?.trim() || '').slice(0, 50),
      imageUrl: null,
      videoUrl: null,
    });
  }

  // 씬 구분자가 없으면 단락으로 분리
  if (scenes.length === 0) {
    const paragraphs = script.split(/\n\n+/).filter(p => p.trim().length > 10);
    const labels = ['훅', '문제 제기', '핵심 내용', '해결책', 'CTA'];
    paragraphs.slice(0, targetCount).forEach((p, i) => {
      scenes.push({
        idx:    i,
        label:  labels[i] || `씬 ${i + 1}`,
        text:   p.trim(),
        desc:   p.trim().slice(0, 30),
        caption: p.trim().slice(0, 50),
        imageUrl: null,
        videoUrl: null,
      });
    });
  }

  return scenes;
}

/* ── STUDIO.project 저장 ── */
function _s1SaveToProject(topic) {
  if (typeof STUDIO === 'undefined' || !STUDIO.project) return;
  if (topic) STUDIO.project.topic = topic;
  if (_s1Result) {
    STUDIO.project.scriptText = _s1Result.ko;
    STUDIO.project.scriptJa   = _s1Result.ja;
    STUDIO.project.scenes     = _s1Result.scenes;
    STUDIO.project.style      = _s1Style;
    STUDIO.project.lengthSec  = _s1Length;
    STUDIO.project.lang       = _s1Lang;
  }
  if (typeof studioSave === 'function') studioSave();
}

/* ── postMessage 브리지 ── */
function _s1SetupMessageBridge() {
  if (window.__s1BridgeReady) return;
  window.__s1BridgeReady = true;

  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'studio_script_done') return;

    const d = e.data;
    _s1Result = {
      ko:     d.scriptKo || d.script || '',
      ja:     d.scriptJa || '',
      scenes: d.scenes   || _s1ParseScenes(d.scriptKo || '', 5),
    };
    if (d.topic) {
      const el = document.getElementById('s1sTopic');
      if (el) el.value = d.topic;
    }
    _s1SaveToProject(d.topic);

    // 대본 완성 후 자동 step2 이동
    const wid = document.querySelector('.s1s-wrap')?.parentElement?.id || 'studioS1Wrap';
    _studioS1Step(wid);

    setTimeout(() => {
      if (confirm('대본이 완성됐어요! 이미지·영상 소스 단계로 이동할까요?')) {
        if (typeof studioGoto === 'function') studioGoto(2);
      }
    }, 300);
  });
}

window._s1SetupBridge = _s1SetupMessageBridge;

/* ── 헬퍼 ── */
function _s1GetQuickTopics() {
  const topics = {
    emotional: ['60대가 후회하는 한 가지','엄마에게 전하지 못한 말','늦게 꿈을 이룬 사람들'],
    info:      ['국민연금 더 받는 방법','혈압 낮추는 식습관','스마트폰 배터리 2배'],
    humor:     ['시니어 카카오톡 실수 모음','할머니 스마트폰 도전기'],
    drama:     ['60년 후 나에게 쓰는 편지','마지막 직장의 기억'],
    senior:    ['무릎 통증 없애는 5가지','노후에 꼭 해야 할 일'],
    knowledge: ['치매 예방하는 뇌운동','노후 자금 계산하는 법'],
  };
  return (topics[_s1Style] || topics.emotional).slice(0, 3);
}

function _s1SyncTopic(val) {
  if (typeof STUDIO !== 'undefined' && STUDIO.project) {
    STUDIO.project.topic = val;
  }
}

window._s1SetTopic = function(topic) {
  const el = document.getElementById('s1sTopic');
  if (el) { el.value = topic; _s1SyncTopic(topic); }
};

window._s1SuggestTopic = function() {
  const topics = _s1GetQuickTopics();
  const pick   = topics[Math.floor(Math.random() * topics.length)];
  window._s1SetTopic(pick);
};

window._s1CopyScript = function(lang) {
  const text = lang === 'ja' ? _s1Result?.ja : _s1Result?.ko;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    alert('복사됐어요!');
  });
};

window._s1ClearResult = function(wid) {
  if (!confirm('다시 생성할까요?')) return;
  _s1Result = null;
  _studioS1Step(wid);
};

window._s1EditScene = function(idx, wid) {
  const scene = _s1Result?.scenes?.[idx];
  if (!scene) return;
  const edited = prompt(`씬 ${idx+1} 내용 편집:`, scene.text);
  if (edited === null) return;
  scene.text    = edited;
  scene.caption = edited.slice(0, 50);
  _s1SaveToProject();
  _studioS1Step(wid);
};

window._s1ShowScriptTab = function(btn, lang) {
  document.querySelectorAll('.s1s-script-tab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  const ko = document.getElementById('s1sScriptKo');
  const ja = document.getElementById('s1sScriptJa');
  if (ko) ko.style.display = lang === 'ko' ? '' : 'none';
  if (ja) ja.style.display = lang === 'ja' ? '' : 'none';
};

function _esc(str) {
  return (str||'').replace(/'/g,"\\'");
}

/* ── CSS ── */
function _s1InjectCSS() {
  if (document.getElementById('s1s-style')) return;
  const st = document.createElement('style');
  st.id = 's1s-style';
  st.textContent = `
.s1s-wrap{max-width:680px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.s1s-block{background:#fff;border:1.5px solid #f1dce7;border-radius:16px;padding:16px}
.s1s-label{font-size:12px;font-weight:800;color:#2b2430;margin-bottom:10px}
.s1s-row-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:500px){.s1s-row-2{grid-template-columns:1fr}}
.s1s-sub-block{}

/* 주제 */
.s1s-topic-row{display:flex;gap:8px;margin-bottom:8px}
.s1s-topic-inp{flex:1;border:2px solid #f1dce7;border-radius:12px;padding:10px 14px;
  font-size:14px;font-family:inherit;resize:none;outline:none;line-height:1.5;transition:.14s}
.s1s-topic-inp:focus{border-color:#ef6fab}
.s1s-ai-suggest{width:40px;height:40px;border:2px solid #f1dce7;border-radius:12px;
  background:#fff;font-size:18px;cursor:pointer;flex-shrink:0;transition:.14s}
.s1s-ai-suggest:hover{border-color:#9181ff;background:#f5f0ff}
.s1s-topic-chips{display:flex;gap:6px;flex-wrap:wrap}
.s1s-chip{padding:5px 12px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:11px;font-weight:600;cursor:pointer;transition:.12s;color:#5a4a56}
.s1s-chip:hover{border-color:#ef6fab;color:#ef6fab;background:#fff5f9}

/* 스타일 */
.s1s-style-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
@media(max-width:500px){.s1s-style-grid{grid-template-columns:repeat(2,1fr)}}
.s1s-style-btn{padding:10px 6px;border:2px solid #f1dce7;border-radius:14px;
  background:#fff;cursor:pointer;text-align:center;transition:.14s;
  display:flex;flex-direction:column;align-items:center;gap:3px}
.s1s-style-btn.on{border-color:#ef6fab;background:linear-gradient(135deg,#fff5f9,#f5f0ff)}
.s1s-style-ico{font-size:22px}
.s1s-style-label{font-size:13px;font-weight:800}
.s1s-style-desc{font-size:10px;color:#9b8a93}

/* 세그 */
.s1s-seg{display:flex;gap:4px;flex-wrap:wrap}
.s1s-seg-btn{padding:6px 12px;border:1.5px solid #f1dce7;border-radius:8px;
  background:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:.12s;color:#7b7077}
.s1s-seg-btn.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}

/* 생성 버튼 */
.s1s-gen-btn{width:100%;padding:16px;border:none;border-radius:16px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-size:16px;font-weight:900;cursor:pointer;transition:.14s;
  display:flex;align-items:center;justify-content:center;gap:8px}
.s1s-gen-btn:hover:not(:disabled){opacity:.9;transform:translateY(-2px);
  box-shadow:0 8px 24px rgba(239,111,171,.3)}
.s1s-gen-btn.loading{opacity:.7;cursor:not-allowed}
.s1s-spin{animation:s1spin 1s linear infinite;display:inline-block}
@keyframes s1spin{to{transform:rotate(360deg)}}

/* 결과 */
.s1s-result{background:#fff;border:2px solid #9181ff;border-radius:16px;padding:16px}
.s1s-result-hd{display:flex;align-items:center;justify-content:space-between;
  margin-bottom:12px;flex-wrap:wrap;gap:6px}
.s1s-result-title{font-size:14px;font-weight:800;color:#2b2430}
.s1s-result-actions{display:flex;gap:6px;flex-wrap:wrap}
.s1s-mini-btn{padding:4px 10px;border:1.5px solid #9181ff;border-radius:20px;
  background:#fff;font-size:11px;font-weight:700;cursor:pointer;color:#9181ff;transition:.12s}
.s1s-mini-btn.danger{border-color:#fca5a5;color:#dc2626}
.s1s-mini-btn:hover{background:#9181ff;color:#fff}
.s1s-mini-btn.danger:hover{background:#dc2626;color:#fff}

/* 씬 목록 */
.s1s-scenes{margin-bottom:12px}
.s1s-scenes-hd{font-size:12px;font-weight:800;color:#2b2430;margin-bottom:8px;
  display:flex;align-items:center;gap:8px}
.s1s-scenes-hint{font-size:10px;color:#9b8a93;font-weight:400}
.s1s-scene-item{display:flex;align-items:center;gap:10px;padding:10px;
  border:1.5px solid #f1dce7;border-radius:10px;margin-bottom:6px;
  cursor:pointer;transition:.12s;background:#fbf7f9}
.s1s-scene-item:hover{border-color:#9181ff;background:#f5f0ff}
.s1s-scene-num{width:24px;height:24px;border-radius:50%;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;
  flex-shrink:0}
.s1s-scene-content{flex:1;min-width:0}
.s1s-scene-label{font-size:12px;font-weight:800;color:#2b2430;margin-bottom:2px}
.s1s-scene-text{font-size:11px;color:#9b8a93;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.s1s-scene-edit{color:#9b8a93;font-size:14px}

/* 전체 대본 */
.s1s-script-detail{border:1.5px solid #f1dce7;border-radius:12px;padding:12px;margin-bottom:12px}
.s1s-script-detail summary{font-size:12px;font-weight:700;cursor:pointer;color:#7b7077}
.s1s-script-tabs{display:flex;gap:4px;margin:8px 0}
.s1s-script-tab{padding:4px 12px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:11px;font-weight:700;cursor:pointer;transition:.12s}
.s1s-script-tab.on{background:#9181ff;color:#fff;border-color:#9181ff}
.s1s-script-text{width:100%;min-height:150px;border:1.5px solid #f1dce7;
  border-radius:10px;padding:10px;font-size:12px;font-family:inherit;
  resize:vertical;outline:none;line-height:1.6;box-sizing:border-box}
.s1s-script-text:focus{border-color:#9181ff}

/* 다음 버튼 */
.s1s-next-btn{width:100%;padding:14px;border:none;border-radius:14px;
  background:linear-gradient(135deg,#9181ff,#ef6fab);color:#fff;
  font-size:14px;font-weight:900;cursor:pointer;transition:.14s}
.s1s-next-btn:hover{opacity:.9;transform:translateY(-1px)}

/* 고급 링크 */
.s1s-advanced-link{text-align:center;padding:8px 0}
.s1s-advanced-link a{font-size:12px;color:#9b8a93;text-decoration:none;font-weight:600}
.s1s-advanced-link a:hover{color:#9181ff;text-decoration:underline}
`;
  document.head.appendChild(st);
}
