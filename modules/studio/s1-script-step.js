/* ================================================
   modules/studio/s1-script-step.js
   STEP 1 — 대본 생성 (자동숏츠 전용) · 복원판
   분리 모듈:
   - s1-modes.js  : 티키타카/롱폼 전용 블록
   - s1-review.js : AI 검수 + A/B 버전 + 바이럴 점수
   기능: 모드선택 + 12장르 + 길이슬라이더(롱폼은 dropdown) + 훅패턴/강도 + 고급설정 8필드 + 검수
   ================================================ */

/* ── 스타일 옵션 (12개) ── */
const S1_STYLES = [
  { id:'emotional', ico:'❤️', label:'감동',         desc:'공감·눈물·따뜻함' },
  { id:'info',      ico:'📊', label:'정보',         desc:'팁·노하우·정리' },
  { id:'humor',     ico:'😄', label:'유머',         desc:'웃음·반전·코믹' },
  { id:'drama',     ico:'🎭', label:'드라마',       desc:'긴장·폭로·반전' },
  { id:'senior',    ico:'👴', label:'시니어',       desc:'건강·노후·생활' },
  { id:'knowledge', ico:'🧠', label:'지식',         desc:'전문·학습·교양' },
  { id:'tikitaka',  ico:'💬', label:'티키타카',     desc:'A vs B 배틀·비교' },
  { id:'trivia',    ico:'🧩', label:'잡학·트리비아',desc:'궁금증 자극·놀라운 사실' },
  { id:'saying',    ico:'📜', label:'사자성어·명언',desc:'지혜·교훈' },
  { id:'lyric',     ico:'🎵', label:'가사/음원',    desc:'Suno 프롬프트·트로트·엔카' },
  { id:'longform',  ico:'📺', label:'롱폼',         desc:'10~15분 챕터 구조' },
  { id:'custom',    ico:'✏️', label:'직접 입력',    desc:'스타일 직접 지정' },
];

const S1_MODES = [
  { id:'general',  ico:'⚡', label:'일반 숏츠' },
  { id:'tikitaka', ico:'💬', label:'티키타카' },
  { id:'longform', ico:'📺', label:'롱폼' },
];

const S1_QUICK_LENS_SHORT = [30, 40, 60, 90, 180, 300, 480];
const S1_LONGFORM_LENS    = [480, 600, 720, 900]; /* 8/10/12/15분 */

const S1_HOOK_PATTERNS = [
  { id:'A', label:'A — 역설형',  desc:'"사실은 정반대였습니다"' },
  { id:'B', label:'B — 질문형',  desc:'"왜 이런 일이 일어날까요?"' },
  { id:'C', label:'C — 충격형',  desc:'"믿기 힘든 사실"' },
  { id:'R', label:'R — AI 최적', desc:'AI가 가장 적절한 패턴 선택' },
];

const S1_CTA_STYLES = [
  { id:'A',    label:'경험 질문형(A)' },
  { id:'B',    label:'다음편 연결형(B)' },
  { id:'C',    label:'체크형(C)' },
  { id:'D',    label:'저장 유도형(D)' },
  { id:'auto', label:'자동' },
];

/* ── 헬퍼 ── */
function _s1FormatLen(sec) {
  if (sec < 60) return sec + '초';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? (m + '분') : (m + '분 ' + s + '초');
}
function _s1CalcScenes(sec) {
  if (sec <= 45)  return 3;
  if (sec <= 90)  return 5;
  if (sec <= 180) return 8;
  if (sec <= 360) return 12;
  return 18;
}
function _s1AdvDefault() {
  return {
    moodTone: '', cta: 'auto', seriesEp: '',
    prevPreview: '', nextPreview: '', prevTopics: '',
    keyMessage: '', extra: '',
  };
}
function _s1HookHint(v){
  return ['','자극 최소(정보형)','약함','보통','강함','최대 자극'][v] || '';
}
function _s1TrustHint(v){
  return ['','완전 중립','약한 신뢰','보통','강한 톤','강한 신뢰 구축'][v] || '';
}

/* ── 전역 상태 ── */
let _s1Style    = 'emotional';
let _s1Length   = 60;
let _s1Lang     = 'both';
let _s1Loading  = false;
let _s1Result   = null;
let _s1Mode     = 'general';
let _s1Hook     = 'R';
let _s1HookStr  = 3;
let _s1TrustStr = 3;
let _s1AdvOpen  = false;
let _s1Adv      = _s1AdvDefault();

/* ════════════════════════════════════════════════
   메인 렌더
   ════════════════════════════════════════════════ */
function _studioS1Step(wrapId) {
  const wrap = document.getElementById(wrapId || 'studioS1Wrap');
  if (!wrap) return;
  const wid = wrapId || 'studioS1Wrap';

  const proj  = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const topic = proj.topic || '';

  if (!_s1Result && proj.scriptText) {
    _s1Result = {
      ko: proj.scriptText,
      ja: proj.scriptJa || '',
      scenes: proj.scenes || [],
    };
  }

  wrap.innerHTML = `
  <div class="s1s-wrap">

    <!-- 주제 입력 -->
    <div class="s1s-block">
      <div class="s1s-label">📝 주제 입력</div>
      <div class="s1s-topic-row">
        <textarea class="s1s-topic-inp" id="s1sTopic" rows="2"
          placeholder="예) 60대가 모르면 후회하는 노후 준비법&#10;예) 무릎 통증 없애는 5가지 습관"
          oninput="_s1SyncTopic(this.value)">${topic}</textarea>
        <button class="s1s-ai-suggest" onclick="_s1SuggestTopic()" title="AI 주제 추천">✨</button>
      </div>
      <div class="s1s-topic-chips">
        ${_s1GetQuickTopics().map(t=>`
          <button class="s1s-chip" onclick="_s1SetTopic('${_esc(t)}')">${t}</button>
        `).join('')}
      </div>
    </div>

    <!-- 모드 선택 -->
    <div class="s1s-block">
      <div class="s1s-label">🎬 모드 선택</div>
      <div class="s1s-seg">
        ${S1_MODES.map(m=>`
          <button class="s1s-seg-btn ${_s1Mode===m.id?'on':''}"
            onclick="_s1SetMode('${m.id}','${wid}')">
            ${m.ico} ${m.label}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- 스타일 선택 (12개) -->
    <div class="s1s-block">
      <div class="s1s-label">🎨 영상 스타일</div>
      <div class="s1s-style-grid">
        ${S1_STYLES.map(s=>`
          <button class="s1s-style-btn ${_s1Style===s.id?'on':''}"
            onclick="_s1Style='${s.id}';_studioS1Step('${wid}')">
            <span class="s1s-style-ico">${s.ico}</span>
            <span class="s1s-style-label">${s.label}</span>
            <span class="s1s-style-desc">${s.desc}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- 영상 길이 (모드에 따라 슬라이더 OR 드롭다운) -->
    ${_s1RenderLengthBlock(wid)}

    <!-- 훅 패턴 + 강도 슬라이더 2개 -->
    <div class="s1s-block">
      <div class="s1s-label">🎣 훅 패턴</div>
      <div class="s1s-seg">
        ${S1_HOOK_PATTERNS.map(h=>`
          <button class="s1s-seg-btn ${_s1Hook===h.id?'on':''}"
            onclick="_s1Hook='${h.id}';_studioS1Step('${wid}')"
            title="${h.desc}">${h.label}</button>
        `).join('')}
      </div>
      <div class="s1s-strength-row">
        <label class="s1s-str-label">훅 강도: <b id="s1sHookStrVal">${_s1HookStr}</b> / 5
          <span class="s1s-str-hint" id="s1sHookHint">${_s1HookHint(_s1HookStr)}</span></label>
        <input type="range" id="s1sHookSl" class="s1s-len-range"
          min="1" max="5" step="1" value="${_s1HookStr}"
          oninput="_s1OnHookStrInput(this.value)">
      </div>
      <div class="s1s-strength-row">
        <label class="s1s-str-label">신뢰도 강도: <b id="s1sTrustStrVal">${_s1TrustStr}</b> / 5
          <span class="s1s-str-hint" id="s1sTrustHint">${_s1TrustHint(_s1TrustStr)}</span></label>
        <input type="range" id="s1sTrustSl" class="s1s-len-range"
          min="1" max="5" step="1" value="${_s1TrustStr}"
          oninput="_s1OnTrustStrInput(this.value)">
      </div>
    </div>

    <!-- 모드별 전용 블록 (s1-modes.js 가 로드됐을 때만) -->
    ${typeof _s1RenderModeBlock === 'function' ? _s1RenderModeBlock(wid, _s1Mode) : ''}

    <!-- 언어 -->
    <div class="s1s-block">
      <div class="s1s-label">🌐 언어</div>
      <div class="s1s-seg">
        ${[['ko','🇰🇷 한국어'],['ja','🇯🇵 일본어'],['both','🇰🇷🇯🇵 동시']].map(([v,l])=>`
          <button class="s1s-seg-btn ${_s1Lang===v?'on':''}"
            onclick="_s1Lang='${v}';_studioS1Step('${wid}')">${l}</button>
        `).join('')}
      </div>
    </div>

    <!-- 고급 설정 (접이식, 8필드) -->
    ${_s1RenderAdv(wid)}

    <!-- 생성 버튼 -->
    <button class="s1s-gen-btn ${_s1Loading?'loading':''}"
      onclick="_s1Generate('${wid}')"
      ${_s1Loading?'disabled':''}>
      ${_s1Loading ? '<span class="s1s-spin">⏳</span> 대본 생성 중...' : '✨ AI 대본 생성'}
    </button>

    <!-- 결과 -->
    ${_s1Result ? _s1RenderResult(wid) : ''}

    <!-- 고급 모드 링크 -->
    <div class="s1s-advanced-link">
      <a href="../../engines/script/index.html?mode=shorts&embed=1" target="_blank" onclick="_s1SetupBridge()">
        📝 대본생성기 전체 기능 열기 (고급)
      </a>
    </div>

  </div>`;

  _s1InjectCSS();
  _s1SetupMessageBridge();
}

/* ── 길이 블록 (모드 분기) ── */
function _s1RenderLengthBlock(wid) {
  if (_s1Mode === 'longform') {
    return `
    <div class="s1s-block">
      <div class="s1s-len-hd">
        <span class="s1s-label" style="margin:0">⏱ 영상 길이 (롱폼)</span>
        <span class="s1s-len-val">${_s1FormatLen(_s1Length)} · 약 ${_s1CalcScenes(_s1Length)}씬</span>
      </div>
      <select class="s1s-len-select" onchange="_s1OnLenChange(this.value, true, '${wid}')">
        ${S1_LONGFORM_LENS.map(sec=>`
          <option value="${sec}" ${_s1Length===sec?'selected':''}>${(sec/60)}분</option>
        `).join('')}
      </select>
    </div>`;
  }
  return `
  <div class="s1s-block">
    <div class="s1s-len-hd">
      <span class="s1s-label" style="margin:0">⏱ 영상 길이</span>
      <span class="s1s-len-val" id="s1sLenVal">${_s1FormatLen(_s1Length)} · 약 ${_s1CalcScenes(_s1Length)}씬</span>
    </div>
    <input type="range" class="s1s-len-range" id="s1sDurSlider"
      min="20" max="480" step="5" value="${_s1Length}"
      oninput="_s1OnLenChange(this.value, false)">
    <div class="s1s-len-chips">
      ${S1_QUICK_LENS_SHORT.map(sec=>`
        <button class="s1s-chip-len ${_s1Length===sec?'on':''}"
          onclick="_s1OnLenChange(${sec}, true, '${wid}')">
          ${sec<60 ? sec+'초' : (sec/60)+'분'}
        </button>
      `).join('')}
    </div>
  </div>`;
}

/* ── 고급 설정 (접이식, 8필드) ── */
function _s1RenderAdv(wid) {
  return `
  <div class="s1s-adv-wrap">
    <button class="s1s-adv-toggle" onclick="_s1AdvOpen=!_s1AdvOpen;_studioS1Step('${wid}')">
      ${_s1AdvOpen?'▲':'▼'} 고급 설정
    </button>
    ${_s1AdvOpen ? `
    <div class="s1s-adv-body">
      <div class="s1s-adv-row">
        <div class="s1s-adv-label">분위기/톤</div>
        <textarea class="s1s-adv-extra" rows="2"
          placeholder="예: 따뜻하고 위로가 되는 톤으로"
          oninput="_s1Adv.moodTone=this.value">${_s1Adv.moodTone||''}</textarea>
      </div>
      <div class="s1s-adv-row">
        <div class="s1s-adv-label">CTA 스타일</div>
        <select class="s1s-adv-sel" oninput="_s1Adv.cta=this.value">
          ${S1_CTA_STYLES.map(c=>`
            <option value="${c.id}" ${_s1Adv.cta===c.id?'selected':''}>${c.label}</option>
          `).join('')}
        </select>
      </div>
      <div class="s1s-adv-row">
        <div class="s1s-adv-label">시리즈 회차</div>
        <input type="text" class="s1s-adv-inp"
          placeholder="예: 3편 (비워두면 단독 영상)"
          value="${_s1Adv.seriesEp||''}" oninput="_s1Adv.seriesEp=this.value">
      </div>
      <div class="s1s-adv-row">
        <div class="s1s-adv-label">이전 예고 내용</div>
        <input type="text" class="s1s-adv-inp"
          placeholder="이전 편 말미에 예고한 내용"
          value="${_s1Adv.prevPreview||''}" oninput="_s1Adv.prevPreview=this.value">
      </div>
      <div class="s1s-adv-row">
        <div class="s1s-adv-label">다음 예고 내용</div>
        <input type="text" class="s1s-adv-inp"
          placeholder="다음 편에서 다룰 내용 (없으면 비워두기)"
          value="${_s1Adv.nextPreview||''}" oninput="_s1Adv.nextPreview=this.value">
      </div>
      <div class="s1s-adv-row">
        <div class="s1s-adv-label">이전 편 핵심 주제들</div>
        <textarea class="s1s-adv-extra" rows="2"
          placeholder="예: 1편-치매예방, 2편-혈압관리"
          oninput="_s1Adv.prevTopics=this.value">${_s1Adv.prevTopics||''}</textarea>
      </div>
      <div class="s1s-adv-row">
        <div class="s1s-adv-label">이번 편 핵심 메시지</div>
        <input type="text" class="s1s-adv-inp"
          placeholder="시청자가 기억해야 할 한 문장"
          value="${_s1Adv.keyMessage||''}" oninput="_s1Adv.keyMessage=this.value">
      </div>
      <div class="s1s-adv-row">
        <div class="s1s-adv-label">추가 지시사항</div>
        <textarea class="s1s-adv-extra" rows="2"
          placeholder="예: 마지막에 일본어 자막 추가해줘"
          oninput="_s1Adv.extra=this.value">${_s1Adv.extra||''}</textarea>
      </div>
    </div>` : ''}
  </div>`;
}

/* ── 결과 렌더 (검수는 s1-review.js 가 호출) ── */
function _s1RenderResult(wid) {
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
        <button class="s1s-mini-btn danger" onclick="_s1ClearResult('${wid}')">다시 생성</button>
      </div>
    </div>

    <div class="s1s-scenes">
      <div class="s1s-scenes-hd">
        📋 씬 구성 (${scenes.length}씬) <span class="s1s-scenes-hint">클릭해서 편집</span>
      </div>
      ${scenes.map((s,i)=>`
        <div class="s1s-scene-item" onclick="_s1EditScene(${i},'${wid}')">
          <span class="s1s-scene-num">${i+1}</span>
          <div class="s1s-scene-content">
            <div class="s1s-scene-label">${s.label||s.desc||'씬 '+(i+1)}</div>
            <div class="s1s-scene-text">${(s.text||'').slice(0,60)}${(s.text||'').length>60?'...':''}</div>
          </div>
          <span class="s1s-scene-edit">✏️</span>
        </div>
      `).join('')}
    </div>

    <details class="s1s-script-detail">
      <summary>전체 대본 보기</summary>
      <div class="s1s-script-tabs">
        <button class="s1s-script-tab on" onclick="_s1ShowScriptTab(this,'ko')">🇰🇷 한국어</button>
        ${r.ja ? `<button class="s1s-script-tab" onclick="_s1ShowScriptTab(this,'ja')">🇯🇵 일본어</button>` : ''}
      </div>
      <textarea class="s1s-script-text" id="s1sScriptKo"
        oninput="_s1Result.ko=this.value;_s1SaveToProject()">${r.ko||''}</textarea>
      ${r.ja ? `<textarea class="s1s-script-text" id="s1sScriptJa" style="display:none"
        oninput="_s1Result.ja=this.value;_s1SaveToProject()">${r.ja}</textarea>` : ''}
    </details>

    <!-- AI 검수 + A/B 버전 + 바이럴 점수 (s1-review.js 가 로드됐을 때만) -->
    ${typeof _s1RenderReviewSection === 'function' ? _s1RenderReviewSection(wid) : ''}

    <button class="s1s-next-btn"
      onclick="_s1SaveToProject();typeof studioGoto==='function'&&studioGoto(2)">
      다음: 이미지·영상 소스 →
    </button>
  </div>`;
}

/* ════════════════════════════════════════════════
   AI 대본 생성 (모드 분기)
   ════════════════════════════════════════════════ */
async function _s1Generate(wid) {
  const topic = document.getElementById('s1sTopic')?.value?.trim();
  if (!topic) { alert('주제를 입력해주세요!'); return; }

  _s1Loading = true;
  _s1Result  = null;
  _studioS1Step(wid);

  try {
    const sysPrompt  = _s1BuildSystemPrompt(topic);
    const userPrompt = _s1BuildUserPrompt(topic);
    const maxTokens  = (_s1Mode === 'longform') ? 5000 : 2000;

    let rawText = '';
    if (typeof callAI === 'function') {
      rawText = await callAI(sysPrompt, userPrompt);
    } else if (typeof APIAdapter !== 'undefined' && APIAdapter.callWithFallback) {
      rawText = await APIAdapter.callWithFallback(sysPrompt, userPrompt, { maxTokens, featureId:'s1-script' });
    } else {
      const apiKey = localStorage.getItem('claude_api_key') ||
                     localStorage.getItem('uc_claude_key') ||
                     localStorage.getItem('anthropic_key') || '';
      if (!apiKey) {
        alert('API 키를 설정해주세요 (설정 탭)');
        _s1Loading = false; _studioS1Step(wid); return;
      }
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'x-api-key': apiKey,
          'anthropic-version':'2023-06-01',
        },
        body: JSON.stringify({
          model:'claude-opus-4-5',
          max_tokens: maxTokens,
          system: sysPrompt,
          messages:[{ role:'user', content:userPrompt }],
        }),
      });
      const data = await res.json();
      rawText = data.content?.[0]?.text || '';
    }

    const parts  = rawText.split(/={3,}\s*일본어\s*={3,}/i);
    const koText = parts[0]?.trim() || rawText;
    const jaText = parts[1]?.trim() || '';
    const sceneCount = _s1CalcScenes(_s1Length);
    const scenes = _s1ParseScenes(koText, sceneCount);

    _s1Result = { ko: koText, ja: jaText, scenes };
    _s1SaveToProject(topic);
  } catch (err) {
    console.error('대본 생성 오류:', err);
    alert('대본 생성 중 오류가 발생했습니다.\n' + err.message);
  }

  _s1Loading = false;
  _studioS1Step(wid);
}

/* ── 시스템 프롬프트 빌더 (모드 분기) ── */
function _s1BuildSystemPrompt(topic) {
  const styleLabel = (S1_STYLES.find(s=>s.id===_s1Style)||{}).label || '감동';
  const lenLabel   = _s1FormatLen(_s1Length);
  const sceneCount = _s1CalcScenes(_s1Length);
  const needJa     = _s1Lang === 'ja' || _s1Lang === 'both';

  const hookMap = {
    A:'역설형 — "사실은 정반대였습니다" 유형',
    B:'질문형 — "왜 이런 일이 일어날까요?" 유형',
    C:'충격형 — "믿기 힘든 사실" 유형',
    R:'AI가 가장 적절한 패턴 선택',
  };
  const ctaMap = {
    A:'시청자에게 비슷한 경험을 묻는 질문형 CTA',
    B:'다음편 시청을 유도하는 연결형 CTA',
    C:'시청자가 자기 점검하는 체크리스트형 CTA',
    D:'저장·공유를 유도하는 CTA',
    auto:'주제·맥락에 가장 자연스러운 CTA',
  };

  let lines = [];
  lines.push(`당신은 유튜브 숏츠/릴스 전문 대본 작가입니다.`);
  lines.push(`주어진 주제로 ${lenLabel} 분량의 ${styleLabel} 스타일 영상 대본을 작성하세요.`);
  lines.push(`대본은 반드시 ${sceneCount}개 씬으로 나눠야 합니다.`);
  lines.push(`각 씬은 "씬N: [씬 설명]" 형식으로 시작하세요.`);
  lines.push(`첫 씬은 강력한 훅으로 시작 — 패턴: ${hookMap[_s1Hook]||hookMap.R}.`);
  lines.push(`훅 강도: ${_s1HookStr}/5 (5=가장 자극, 1=정보 중심).`);
  lines.push(`신뢰도 톤: ${_s1TrustStr}/5 (5=강한 신뢰, 1=완전 중립).`);
  lines.push(`마지막 씬 CTA: ${ctaMap[_s1Adv.cta]||ctaMap.auto}.`);

  if (_s1Adv.moodTone)    lines.push(`분위기/톤: ${_s1Adv.moodTone}`);
  if (_s1Adv.seriesEp)    lines.push(`시리즈 회차 — 제목/도입에 "${_s1Adv.seriesEp}" 표시.`);
  if (_s1Adv.prevPreview) lines.push(`이전 편 예고 내용을 자연스럽게 이어받으세요: ${_s1Adv.prevPreview}`);
  if (_s1Adv.nextPreview) lines.push(`마지막에 다음 편 예고를 포함: ${_s1Adv.nextPreview}`);
  else                    lines.push(`다음 편 예고가 없으므로 임의로 예고를 만들지 마세요.`);
  if (_s1Adv.prevTopics)  lines.push(`이전 편 주제와 중복 금지: ${_s1Adv.prevTopics}`);
  if (_s1Adv.keyMessage)  lines.push(`이번 편 핵심 메시지(반드시 포함): ${_s1Adv.keyMessage}`);

  /* 모드별 추가 — s1-modes.js */
  if (_s1Mode === 'tikitaka' && typeof _s1BuildTikitakaPromptExtra === 'function') {
    lines.push(_s1BuildTikitakaPromptExtra());
  }
  if (_s1Mode === 'longform' && typeof _s1BuildLongformPromptExtra === 'function') {
    lines.push(_s1BuildLongformPromptExtra());
  }

  if (needJa) lines.push(`한국어 대본 작성 후, 아래에 "=== 일본어 ===" 를 쓰고 일본어 번역본도 작성하세요.`);
  if (_s1Adv.extra) lines.push(`\n[추가 지시]\n${_s1Adv.extra}`);

  return lines.join('\n');
}

function _s1BuildUserPrompt(topic) {
  const styleLabel = (S1_STYLES.find(s=>s.id===_s1Style)||{}).label || '감동';
  return `주제: ${topic}
모드: ${_s1Mode}
스타일: ${styleLabel}
길이: ${_s1FormatLen(_s1Length)} (${_s1CalcScenes(_s1Length)}씬)
언어: ${_s1Lang === 'ko' ? '한국어만' : _s1Lang === 'ja' ? '일본어만' : '한국어 + 일본어'}`;
}

/* ── 씬 파싱 ── */
function _s1ParseScenes(script, targetCount) {
  const scenePattern = /씬\s*(\d+)\s*[:\-：]\s*([^\n]*)\n([\s\S]*?)(?=씬\s*\d+\s*[:\-：]|$)/g;
  const scenes = [];
  let match;
  while ((match = scenePattern.exec(script)) !== null) {
    scenes.push({
      idx: scenes.length,
      label: match[2]?.trim() || `씬 ${scenes.length + 1}`,
      text: match[3]?.trim() || '',
      desc: match[2]?.trim() || '',
      caption: (match[3]?.trim() || '').slice(0, 50),
      imageUrl: null, videoUrl: null,
    });
  }
  if (scenes.length === 0) {
    const paragraphs = script.split(/\n\n+/).filter(p => p.trim().length > 10);
    const labels = ['훅', '문제 제기', '핵심 내용', '해결책', 'CTA'];
    paragraphs.slice(0, targetCount).forEach((p, i) => {
      scenes.push({
        idx: i, label: labels[i] || `씬 ${i + 1}`,
        text: p.trim(), desc: p.trim().slice(0, 30),
        caption: p.trim().slice(0, 50),
        imageUrl: null, videoUrl: null,
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
    if (!STUDIO.project.s1) STUDIO.project.s1 = {};
    STUDIO.project.s1.mode    = _s1Mode;
    STUDIO.project.s1.hook    = _s1Hook;
    STUDIO.project.s1.hookStr = _s1HookStr;
    STUDIO.project.s1.trustStr= _s1TrustStr;
    STUDIO.project.s1.adv     = Object.assign({}, _s1Adv);
    if (_s1Result.review)   STUDIO.project.s1.review   = _s1Result.review;
    if (_s1Result.versionB) STUDIO.project.s1.versionB = _s1Result.versionB;
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
      ko: d.scriptKo || d.script || '',
      ja: d.scriptJa || '',
      scenes: d.scenes || _s1ParseScenes(d.scriptKo || '', 5),
    };
    if (d.topic) {
      const el = document.getElementById('s1sTopic');
      if (el) el.value = d.topic;
    }
    _s1SaveToProject(d.topic);
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

/* ── 길이/모드/강도 변경 핸들러 ── */
window._s1OnLenChange = function(val, isChip, wid){
  const v = parseInt(val);
  if (!isNaN(v)) _s1Length = Math.max(20, Math.min(900, v));
  const valEl = document.getElementById('s1sLenVal');
  if (valEl) valEl.textContent = _s1FormatLen(_s1Length) + ' · 약 ' + _s1CalcScenes(_s1Length) + '씬';
  const sl = document.getElementById('s1sDurSlider');
  if (sl && parseInt(sl.value) !== _s1Length) sl.value = _s1Length;
  if (isChip && wid) _studioS1Step(wid);
};
window._s1SetMode = function(mode, wid) {
  _s1Mode = mode;
  if (mode === 'longform' && _s1Length < 480) _s1Length = 480;
  if (mode !== 'longform' && _s1Length > 480) _s1Length = 60;
  _studioS1Step(wid);
};
window._s1OnHookStrInput = function(v) {
  _s1HookStr = parseInt(v);
  const valEl  = document.getElementById('s1sHookStrVal');
  const hintEl = document.getElementById('s1sHookHint');
  if (valEl)  valEl.textContent  = _s1HookStr;
  if (hintEl) hintEl.textContent = _s1HookHint(_s1HookStr);
};
window._s1OnTrustStrInput = function(v) {
  _s1TrustStr = parseInt(v);
  const valEl  = document.getElementById('s1sTrustStrVal');
  const hintEl = document.getElementById('s1sTrustHint');
  if (valEl)  valEl.textContent  = _s1TrustStr;
  if (hintEl) hintEl.textContent = _s1TrustHint(_s1TrustStr);
};

/* ── 토픽 헬퍼 ── */
function _s1GetQuickTopics() {
  const topics = {
    emotional:['60대가 후회하는 한 가지','엄마에게 전하지 못한 말','늦게 꿈을 이룬 사람들'],
    info:     ['국민연금 더 받는 방법','혈압 낮추는 식습관','스마트폰 배터리 2배'],
    humor:    ['시니어 카카오톡 실수 모음','할머니 스마트폰 도전기'],
    drama:    ['60년 후 나에게 쓰는 편지','마지막 직장의 기억'],
    senior:   ['무릎 통증 없애는 5가지','노후에 꼭 해야 할 일'],
    knowledge:['치매 예방하는 뇌운동','노후 자금 계산하는 법'],
    tikitaka: ['한국 김치 vs 일본 단무지','현대 의료 vs 전통 한방'],
    trivia:   ['우리 몸에서 가장 강한 뼈','코끼리도 모르는 사실'],
    saying:   ['"세 살 버릇 여든까지" 진짜 의미','노자가 알려주는 인생'],
    lyric:    ['엄마 생각나는 트로트 가사','북국의 봄 같은 감성'],
    longform: ['시니어 건강 종합 가이드','노후 자금 만들기 완전판'],
    custom:   ['주제를 자유롭게 입력하세요'],
  };
  return (topics[_s1Style] || topics.emotional).slice(0, 3);
}
function _s1SyncTopic(val) {
  if (typeof STUDIO !== 'undefined' && STUDIO.project) STUDIO.project.topic = val;
}
window._s1SetTopic = function(topic) {
  const el = document.getElementById('s1sTopic');
  if (el) { el.value = topic; _s1SyncTopic(topic); }
};
window._s1SuggestTopic = function() {
  const topics = _s1GetQuickTopics();
  const pick = topics[Math.floor(Math.random() * topics.length)];
  window._s1SetTopic(pick);
};
window._s1CopyScript = function(lang) {
  const text = lang === 'ja' ? _s1Result?.ja : _s1Result?.ko;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => alert('복사됐어요!'));
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
  scene.text = edited;
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
function _esc(str) { return (str||'').replace(/'/g,"\\'"); }

/* ── CSS ── */
function _s1InjectCSS() {
  if (document.getElementById('s1s-style')) return;
  const st = document.createElement('style');
  st.id = 's1s-style';
  st.textContent = `
.s1s-wrap{max-width:680px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.s1s-block{background:#fff;border:1.5px solid #f1dce7;border-radius:16px;padding:16px}
.s1s-label{font-size:12px;font-weight:800;color:#2b2430;margin-bottom:10px;display:block}
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
.s1s-style-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
@media(max-width:600px){.s1s-style-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:420px){.s1s-style-grid{grid-template-columns:repeat(2,1fr)}}
.s1s-style-btn{padding:10px 6px;border:2px solid #f1dce7;border-radius:14px;
  background:#fff;cursor:pointer;text-align:center;transition:.14s;
  display:flex;flex-direction:column;align-items:center;gap:3px}
.s1s-style-btn.on{border-color:#ef6fab;background:linear-gradient(135deg,#fff5f9,#f5f0ff)}
.s1s-style-ico{font-size:20px}
.s1s-style-label{font-size:12px;font-weight:800}
.s1s-style-desc{font-size:9.5px;color:#9b8a93;line-height:1.3}
.s1s-seg{display:flex;gap:4px;flex-wrap:wrap}
.s1s-seg-btn{padding:6px 12px;border:1.5px solid #f1dce7;border-radius:8px;
  background:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:.12s;color:#7b7077}
.s1s-seg-btn.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.s1s-len-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px}
.s1s-len-val{font-size:13px;font-weight:800;color:#9181ff;background:#f5f0ff;padding:4px 10px;border-radius:8px}
.s1s-len-range{width:100%;-webkit-appearance:none;appearance:none;height:6px;background:#f1dce7;border-radius:3px;outline:none;margin:8px 0}
.s1s-len-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:50%;background:#ef6fab;cursor:pointer;border:none}
.s1s-len-range::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#ef6fab;cursor:pointer;border:none}
.s1s-len-chips{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}
.s1s-chip-len{padding:5px 10px;border:1.5px solid #f1dce7;border-radius:18px;background:#fff;
  font-size:11px;font-weight:700;cursor:pointer;transition:.12s;color:#5a4a56}
.s1s-chip-len:hover{border-color:#9181ff;color:#9181ff}
.s1s-chip-len.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.s1s-len-select{width:100%;padding:10px;border:1.5px solid #f1dce7;border-radius:10px;
  font-size:13px;font-weight:700;background:#fff;color:#2b2430}
.s1s-strength-row{margin-top:10px}
.s1s-str-label{display:block;font-size:11.5px;font-weight:700;color:#5a4a56;margin-bottom:4px}
.s1s-str-hint{color:#9181ff;font-weight:600;margin-left:6px}
.s1s-adv-wrap{background:#fff;border:1.5px solid #f1dce7;border-radius:16px;overflow:hidden}
.s1s-adv-toggle{width:100%;padding:14px 16px;background:#fbf7f9;border:none;cursor:pointer;
  font-size:13px;font-weight:800;color:#5a4a56;text-align:left;font-family:inherit;transition:.12s}
.s1s-adv-toggle:hover{background:#f5f0ff;color:#9181ff}
.s1s-adv-body{padding:14px 16px;display:flex;flex-direction:column;gap:10px;border-top:1px solid #f1dce7}
.s1s-adv-row{display:flex;flex-direction:column;gap:4px}
.s1s-adv-label{font-size:11.5px;font-weight:700;color:#5a4a56}
.s1s-adv-extra,.s1s-adv-inp,.s1s-adv-sel{width:100%;border:1.5px solid #f1dce7;border-radius:10px;
  padding:8px 12px;font-size:12.5px;font-family:inherit;outline:none;box-sizing:border-box}
.s1s-adv-extra{resize:vertical;line-height:1.5}
.s1s-adv-extra:focus,.s1s-adv-inp:focus,.s1s-adv-sel:focus{border-color:#9181ff}
.s1s-gen-btn{width:100%;padding:16px;border:none;border-radius:16px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-size:16px;font-weight:900;cursor:pointer;transition:.14s;
  display:flex;align-items:center;justify-content:center;gap:8px}
.s1s-gen-btn:hover:not(:disabled){opacity:.9;transform:translateY(-2px);box-shadow:0 8px 24px rgba(239,111,171,.3)}
.s1s-gen-btn.loading{opacity:.7;cursor:not-allowed}
.s1s-spin{animation:s1spin 1s linear infinite;display:inline-block}
@keyframes s1spin{to{transform:rotate(360deg)}}
.s1s-result{background:#fff;border:2px solid #9181ff;border-radius:16px;padding:16px}
.s1s-result-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:6px}
.s1s-result-title{font-size:14px;font-weight:800;color:#2b2430}
.s1s-result-actions{display:flex;gap:6px;flex-wrap:wrap}
.s1s-mini-btn{padding:4px 10px;border:1.5px solid #9181ff;border-radius:20px;
  background:#fff;font-size:11px;font-weight:700;cursor:pointer;color:#9181ff;transition:.12s}
.s1s-mini-btn.danger{border-color:#fca5a5;color:#dc2626}
.s1s-mini-btn:hover{background:#9181ff;color:#fff}
.s1s-mini-btn.danger:hover{background:#dc2626;color:#fff}
.s1s-scenes{margin-bottom:12px}
.s1s-scenes-hd{font-size:12px;font-weight:800;color:#2b2430;margin-bottom:8px}
.s1s-scenes-hint{font-size:10px;color:#9b8a93;font-weight:400;margin-left:6px}
.s1s-scene-item{display:flex;align-items:center;gap:10px;padding:10px;
  border:1.5px solid #f1dce7;border-radius:10px;margin-bottom:6px;
  cursor:pointer;transition:.12s;background:#fbf7f9}
.s1s-scene-item:hover{border-color:#9181ff;background:#f5f0ff}
.s1s-scene-num{width:24px;height:24px;border-radius:50%;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.s1s-scene-content{flex:1;min-width:0}
.s1s-scene-label{font-size:12px;font-weight:800;color:#2b2430;margin-bottom:2px}
.s1s-scene-text{font-size:11px;color:#9b8a93;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.s1s-scene-edit{color:#9b8a93;font-size:14px}
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
.s1s-next-btn{width:100%;padding:14px;border:none;border-radius:14px;
  background:linear-gradient(135deg,#9181ff,#ef6fab);color:#fff;
  font-size:14px;font-weight:900;cursor:pointer;transition:.14s}
.s1s-next-btn:hover{opacity:.9;transform:translateY(-1px)}
.s1s-advanced-link{text-align:center;padding:8px 0}
.s1s-advanced-link a{font-size:12px;color:#9b8a93;text-decoration:none;font-weight:600}
.s1s-advanced-link a:hover{color:#9181ff;text-decoration:underline}
`;
  document.head.appendChild(st);
}
