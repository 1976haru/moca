/* ================================================
   modules/studio/s1-review.js
   STEP 1 보조 모듈 — AI 대본 검수 + A/B 버전 + 바이럴 점수
   호출자: s1-script-step.js 의 _s1RenderResult
   가정 (스펙 truncated):
   - 바이럴 종합점수 = round( (hook+info+emotion+share)/4 * 10 ) / 10
   - A 버전 = 현재 대본 (정보·신뢰형 톤 유지)
   - B 버전 = 자극·감정형 리라이트
   ================================================ */

/* ── 전역 상태 ── */
let _s1Reviewing  = false;
let _s1AbBLoading = false;

/* ── 검수 섹션 메인 (s1-script-step.js 의 _s1RenderResult 가 호출) ── */
function _s1RenderReviewSection(wid) {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const review = (_s1Result && _s1Result.review) || (proj.s1 && proj.s1.review) || null;
  const abB    = (_s1Result && _s1Result.versionB) || (proj.s1 && proj.s1.versionB) || null;

  return `
  <div class="s1r-wrap">

    <!-- AI 검수 -->
    <div class="s1r-section">
      <div class="s1r-hd">
        <span class="s1r-title">🔍 AI 대본 검수</span>
        <button class="s1r-btn ${_s1Reviewing?'loading':''}"
          onclick="_s1Review('${wid}')"
          ${_s1Reviewing?'disabled':''}>
          ${_s1Reviewing ? '⏳ 검수 중...' : (review ? '🔄 다시 검수' : '🔍 AI 대본 검수')}
        </button>
      </div>
      <div id="s1sReviewBox">
        ${review ? _s1RenderReviewResult(review) : _s1RenderReviewEmpty()}
      </div>
    </div>

    <!-- A/B 버전 -->
    <div class="s1r-section">
      <div class="s1r-hd">
        <span class="s1r-title">🔀 A/B 버전 비교</span>
        <button class="s1r-btn ${_s1AbBLoading?'loading':''}"
          onclick="_s1GenAB('${wid}')"
          ${_s1AbBLoading?'disabled':''}>
          ${_s1AbBLoading ? '⏳ B 생성 중...' : (abB ? '🔄 B 다시 생성' : '🔀 A/B 버전 생성')}
        </button>
      </div>
      <div id="s1sAbBox">
        ${abB ? _s1RenderAB(abB) : `
          <div class="s1r-empty">
            B 버전을 생성하면 A(현재 대본)와 나란히 비교할 수 있어요.<br>
            <b>A=정보·신뢰형 / B=자극·감정형</b> 톤으로 자동 생성됩니다.
          </div>`}
      </div>
    </div>

  </div>`;
}

function _s1RenderReviewEmpty() {
  return `
  <div class="s1r-empty">
    <b>🎯 5개 항목 평가 + 바이럴 예측 점수</b><br>
    훅 강도 / 시청 지속성 / CTA 명확도 / 시니어 친화도 / 한·일 문화 적합도<br>
    + 바이럴 점수(hook/info/emotion/share, 1~5) + 개선 제안 2개
  </div>`;
}

function _s1RenderReviewResult(review) {
  const items = [
    { id:'hook',     label:'훅 강도 (첫 3초)' },
    { id:'pacing',   label:'시청 지속성 (흐름·완급)' },
    { id:'cta',      label:'CTA 명확도' },
    { id:'senior',   label:'시니어 친화도' },
    { id:'culture',  label:'한국/일본 문화 적합도' },
  ];
  const itemsHtml = items.map(it=>{
    const r = review[it.id] || {};
    const grade = r.grade || '-';
    const score = r.score || 0;
    const tip   = r.tip   || '';
    const ico   = grade==='상'?'✅':grade==='중'?'⚠️':grade==='하'?'❌':'·';
    const cls   = grade==='상'?'good':grade==='중'?'warn':grade==='하'?'bad':'';
    return `
    <div class="s1r-item ${cls}">
      <span class="s1r-item-ico">${ico}</span>
      <span class="s1r-item-label">${it.label}: <b>${grade}</b> (${score}점)</span>
      ${tip?`<span class="s1r-item-tip">— "${tip}"</span>`:''}
    </div>`;
  }).join('');

  /* 바이럴 점수 */
  const v = review.viral || {};
  const stars = (n) => {
    const r = Math.max(0, Math.min(5, Math.round(n||0)));
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  };
  const totalCalc = ((v.hook||0) + (v.info||0) + (v.emotion||0) + (v.share||0)) / 4;
  const total = (v.total != null ? v.total : totalCalc);
  const totalRounded = Math.round(total * 10) / 10;

  const viralHtml = `
  <div class="s1r-viral">
    <div class="s1r-viral-hd">🚀 바이럴 예측 — 종합 <b>${totalRounded}</b> / 5</div>
    <div class="s1r-viral-grid">
      <div>훅 ${stars(v.hook)} <small>${v.hook||0}</small></div>
      <div>정보 ${stars(v.info)} <small>${v.info||0}</small></div>
      <div>감정 ${stars(v.emotion)} <small>${v.emotion||0}</small></div>
      <div>공유 ${stars(v.share)} <small>${v.share||0}</small></div>
    </div>
    ${(v.suggests && v.suggests.length) ? `
      <div class="s1r-suggests">
        <b>🛠 개선 제안</b>
        ${v.suggests.map(s=>`<div class="s1r-suggest">• ${s}</div>`).join('')}
      </div>
    ` : ''}
  </div>`;

  return itemsHtml + viralHtml;
}

function _s1RenderAB(abB) {
  const a = (_s1Result && _s1Result.ko) || '';
  return `
  <div class="s1r-ab-grid">
    <div class="s1r-ab-col">
      <div class="s1r-ab-title">A 버전 (현재 — 정보·신뢰형)</div>
      <textarea class="s1r-ab-text" readonly>${a}</textarea>
      <button class="s1s-mini-btn" onclick="alert('A 버전이 현재 대본입니다.')">A 사용중</button>
    </div>
    <div class="s1r-ab-col">
      <div class="s1r-ab-title">B 버전 (자극·감정형)</div>
      <textarea class="s1r-ab-text" readonly>${abB||''}</textarea>
      <button class="s1s-mini-btn" onclick="_s1AdoptAb('B')">B 채택 (스왑)</button>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   AI 검수 호출
   ════════════════════════════════════════════════ */
window._s1Review = async function(wid) {
  const text = (typeof _s1Result !== 'undefined' && _s1Result && _s1Result.ko) || '';
  if (!text || text.length < 30) {
    alert('검수할 대본이 충분하지 않습니다.');
    return;
  }
  _s1Reviewing = true;
  _studioS1Step(wid);

  try {
    const sys = `당신은 시니어 채널 숏츠 대본 평가 전문가입니다. 아래 5개 항목을 평가하고, 바이럴 점수도 함께 산출하세요.
반드시 아래 JSON 형식으로만 답하세요. 마크다운 코드블록 사용 금지.
{
  "hook":    {"grade":"상|중|하","score":0~100,"tip":"한 줄 개선 제안"},
  "pacing":  {"grade":"상|중|하","score":0~100,"tip":"한 줄 개선 제안"},
  "cta":     {"grade":"상|중|하","score":0~100,"tip":"한 줄 개선 제안"},
  "senior":  {"grade":"상|중|하","score":0~100,"tip":"한 줄 개선 제안"},
  "culture": {"grade":"상|중|하","score":0~100,"tip":"한 줄 개선 제안"},
  "viral": {
    "hook":1~5, "info":1~5, "emotion":1~5, "share":1~5,
    "total":1~5,
    "suggests":["개선 제안1","개선 제안2"]
  }
}`;
    const user = `평가 대본:\n${text}`;

    let raw = '';
    if (typeof callAI === 'function') {
      raw = await callAI(sys, user);
    } else if (typeof APIAdapter !== 'undefined' && APIAdapter.callWithFallback) {
      raw = await APIAdapter.callWithFallback(sys, user, { maxTokens:800, featureId:'s1-review' });
    } else {
      throw new Error('AI 호출 함수가 없습니다.');
    }
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('검수 결과 파싱 실패');
    const review = JSON.parse(m[0]);

    if (!_s1Result) _s1Result = {};
    _s1Result.review = review;
    if (typeof _s1SaveToProject === 'function') _s1SaveToProject();
  } catch (err) {
    console.error('검수 오류:', err);
    alert('검수 중 오류: ' + err.message);
  }

  _s1Reviewing = false;
  _studioS1Step(wid);
};

/* ════════════════════════════════════════════════
   A/B 버전 생성 (B = 자극·감정형 리라이트)
   ════════════════════════════════════════════════ */
window._s1GenAB = async function(wid) {
  const text = (typeof _s1Result !== 'undefined' && _s1Result && _s1Result.ko) || '';
  if (!text || text.length < 30) {
    alert('A 버전 대본이 먼저 필요합니다.');
    return;
  }
  _s1AbBLoading = true;
  _studioS1Step(wid);

  try {
    const sys = `당신은 유튜브 숏츠 대본을 자극·감정형으로 리라이트하는 전문가입니다.
주어진 A 버전 대본을 같은 주제·길이·구조로 유지하되, 다음을 적용한 B 버전을 작성하세요:
- 첫 3초 훅을 더 자극적으로 (질문/충격/숫자)
- 감정 단어 강화
- CTA를 더 행동 유도적으로
- 씬 구조와 씬 수는 그대로 유지
대본 본문만 출력하세요.`;
    const user = `A 버전 대본:\n${text}`;

    let raw = '';
    if (typeof callAI === 'function') {
      raw = await callAI(sys, user);
    } else if (typeof APIAdapter !== 'undefined' && APIAdapter.callWithFallback) {
      raw = await APIAdapter.callWithFallback(sys, user, { maxTokens:2000, featureId:'s1-ab' });
    } else {
      throw new Error('AI 호출 함수가 없습니다.');
    }

    if (!_s1Result) _s1Result = {};
    _s1Result.versionB = raw.trim();
    if (typeof _s1SaveToProject === 'function') _s1SaveToProject();
  } catch (err) {
    console.error('A/B 생성 오류:', err);
    alert('B 버전 생성 중 오류: ' + err.message);
  }

  _s1AbBLoading = false;
  _studioS1Step(wid);
};

/* ── A/B 채택 (스왑) ── */
window._s1AdoptAb = function(which) {
  if (which !== 'B') return;
  const b = _s1Result && _s1Result.versionB;
  if (!b) return;
  if (!confirm('B 버전을 현재 대본으로 채택할까요? (씬도 다시 분리되며 기존 A는 versionB 자리에 보관됩니다)')) return;
  const original = _s1Result.ko;
  _s1Result.ko = b;
  _s1Result.versionB = original;
  if (typeof _s1ParseScenes === 'function') {
    _s1Result.scenes = _s1ParseScenes(b, (_s1Result.scenes||[]).length || 5);
  }
  if (typeof _s1SaveToProject === 'function') _s1SaveToProject();
  const wid = document.querySelector('.s1s-wrap')?.parentElement?.id || 'studioS1Wrap';
  if (typeof _studioS1Step === 'function') _studioS1Step(wid);
};

/* ── CSS ── */
(function _s1ReviewInjectCSS(){
  if (document.getElementById('s1r-style')) return;
  const st = document.createElement('style');
  st.id = 's1r-style';
  st.textContent = `
.s1r-wrap{display:flex;flex-direction:column;gap:12px;margin:12px 0}
.s1r-section{background:#fbf7f9;border:1.5px solid #f1dce7;border-radius:14px;padding:14px}
.s1r-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px}
.s1r-title{font-size:13px;font-weight:800;color:#2b2430}
.s1r-btn{padding:6px 14px;border:1.5px solid #9181ff;border-radius:20px;
  background:#fff;font-size:11.5px;font-weight:700;cursor:pointer;color:#9181ff;transition:.12s}
.s1r-btn:hover:not(:disabled){background:#9181ff;color:#fff}
.s1r-btn.loading{opacity:.6;cursor:not-allowed}
.s1r-empty{font-size:12px;color:#7b7077;line-height:1.6;background:#fff;border-radius:10px;padding:10px 12px;border:1px dashed #f1dce7}
.s1r-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;
  background:#fff;margin-bottom:4px;font-size:12px;flex-wrap:wrap;border:1px solid transparent}
.s1r-item.good{border-color:#bbf7d0;background:#f0fdf4}
.s1r-item.warn{border-color:#fde68a;background:#fffbeb}
.s1r-item.bad{border-color:#fecaca;background:#fef2f2}
.s1r-item-ico{font-size:14px;flex-shrink:0}
.s1r-item-label{font-weight:700;color:#2b2430}
.s1r-item-tip{font-size:11px;color:#5a4a56}
.s1r-viral{margin-top:12px;padding:12px;background:#fff;border-radius:10px;border:1.5px solid #f1dce7}
.s1r-viral-hd{font-size:13px;font-weight:800;color:#2b2430;margin-bottom:8px}
.s1r-viral-hd b{color:#ef6fab;font-size:15px}
.s1r-viral-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;font-size:12px}
.s1r-viral-grid div{display:flex;align-items:center;gap:6px;color:#9181ff;font-weight:700}
.s1r-viral-grid small{color:#9b8a93;font-weight:400;margin-left:auto}
.s1r-suggests{margin-top:10px;padding-top:10px;border-top:1px dashed #f1dce7;font-size:11.5px}
.s1r-suggest{margin-top:4px;color:#5a4a56}
.s1r-ab-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media(max-width:600px){.s1r-ab-grid{grid-template-columns:1fr}}
.s1r-ab-col{display:flex;flex-direction:column;gap:6px}
.s1r-ab-title{font-size:12px;font-weight:800;color:#9181ff}
.s1r-ab-text{width:100%;min-height:200px;border:1.5px solid #f1dce7;border-radius:10px;
  padding:10px;font-size:12px;font-family:inherit;resize:vertical;line-height:1.6;background:#fff;box-sizing:border-box}
`;
  document.head.appendChild(st);
})();
