/* ================================================
   modules/studio/dashboard.js
   0단계 대시보드 전용 모듈

   5개 섹션:
   1. 채널 상태 위젯
   2. 새 프로젝트 시작 (모드 선택 포함)
   3. 최근 프로젝트 이어하기
   4. 오늘 추천 주제
   5. 빠른 상태 요약
   ================================================ */

/* ── 추천 주제 데이터 ── */
const DASH_TOPICS = {
  ko: [
    { tag:'건강', topics:['60대가 꼭 알아야 할 혈압 관리법','무릎 통증 없애는 5가지 습관','시니어 면역력 높이는 음식 TOP5'] },
    { tag:'재테크', topics:['국민연금 더 받는 방법','노후 준비 지금 시작해도 늦지 않아요','퇴직 후 월 300 버는 현실적인 방법'] },
    { tag:'생활', topics:['스마트폰 배터리 2배 늘리는 꿀팁','카카오톡 사기 이렇게 막아요','혼자 살기 좋은 동네 고르는 법'] },
    { tag:'감동', topics:['엄마에게 전하지 못한 말','60년 해로한 부부의 비밀','늦은 나이에 꿈을 이룬 사람들'] },
  ],
  ja: [
    { tag:'健康', topics:['60代が知るべき血圧管理','膝の痛みを解消する5つの習慣','シニアの免疫力を上げる食べ物'] },
    { tag:'お金', topics:['年金を増やす方法','老後の準備は今からでも間に合う','退職後に月30万稼ぐリアルな方法'] },
    { tag:'生活', topics:['スマホのバッテリーを2倍に','詐欺電話の見分け方','一人暮らしに最適な街の選び方'] },
  ],
};

const DASH_MODES = [
  { id:'stepper', ico:'📋', label:'단계별 제작', desc:'대본→이미지→음성→편집 순서대로' },
  { id:'oneclick', ico:'⚡', label:'딸깍 모드',  desc:'주제 입력 → AI가 전부 자동 완성' },
  { id:'batch',   ico:'📦', label:'대량 생산',   desc:'여러 편을 한 번에 제작' },
];

/* ── 전역 상태 ── */
let _dashMode    = 'stepper';
let _dashLang    = 'ko';
let _dashTopicDay= null;

/* ════════════════════════════════════════════════
   메인 대시보드 렌더
   ════════════════════════════════════════════════ */
function _studioDashboard(wrapId) {
  const wrap = document.getElementById(wrapId || 'studio-body');
  if (!wrap) return;

  const proj    = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const channel = proj.channel || localStorage.getItem('studio_channel') || null;
  const recent  = _dashGetRecent();
  const topics  = _dashGetTodayTopics();
  const stats   = _dashGetStats();

  wrap.innerHTML = `
  <div class="dash-wrap">

    <!-- 1. 채널 상태 -->
    <div class="dash-section dash-channel">
      <div class="dash-channel-inner">
        <div class="dash-channel-info">
          <span class="dash-channel-ico">📺</span>
          <div>
            <div class="dash-channel-name">
              ${channel
                ? `<strong>${channel}</strong>`
                : '<span class="dash-channel-empty">채널 미설정</span>'}
            </div>
            <div class="dash-channel-sub">
              ${channel ? '채널 기반으로 대본·음성이 자동 최적화됩니다' : '채널을 설정하면 모든 단계가 자동 최적화됩니다'}
            </div>
          </div>
        </div>
        <button class="dash-channel-btn"
          onclick="_dashSetChannel()">
          ${channel ? '변경' : '⚠️ 설정하기'}
        </button>
      </div>
      <div class="dash-lang-row">
        ${[['ko','🇰🇷 한국'],['ja','🇯🇵 일본'],['both','🇰🇷🇯🇵 동시']].map(([v,l])=>`
          <button class="dash-lang-btn ${_dashLang===v?'on':''}"
            onclick="_dashLang='${v}';_studioDashboard('${wrapId||'studio-body'}')">
            ${l}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- 2. 새 프로젝트 시작 -->
    <div class="dash-section">
      <div class="dash-section-title">🚀 새 프로젝트 시작</div>
      <div class="dash-modes">
        ${DASH_MODES.map(m=>`
          <button class="dash-mode-card ${_dashMode===m.id?'on':''}"
            onclick="_dashMode='${m.id}';_studioDashboard('${wrapId||'studio-body'}')">
            <span class="dash-mode-ico">${m.ico}</span>
            <div class="dash-mode-label">${m.label}</div>
            <div class="dash-mode-desc">${m.desc}</div>
          </button>
        `).join('')}
      </div>
      <button class="dash-start-btn"
        onclick="_dashStartNew('${wrapId||'studio-body'}')">
        ${_dashMode==='oneclick'?'⚡ 지금 바로 시작':
          _dashMode==='batch'?'📦 배치 생성 시작':
          '📋 단계별로 시작하기'} →
      </button>
    </div>

    <!-- 3. 최근 프로젝트 -->
    ${recent.length > 0 ? `
    <div class="dash-section">
      <div class="dash-section-title">
        📂 이어 만들기
        <button class="dash-del-all-btn"
          onclick="_dashDeleteAll('${wrapId||'studio-body'}')"
          title="모든 기록 삭제">전체 삭제</button>
      </div>
      <div class="dash-recent-list">
        ${recent.slice(0,3).map(p=>`
          <div class="dash-recent-item">
            <div class="dash-recent-info"
              onclick="_dashLoadProject('${p.id}')">
              <div class="dash-recent-name">${p.title||'제목 없음'}</div>
              <div class="dash-recent-meta">
                ${_dashStepLabel(p.step)} · ${_dashFmtDate(p.savedAt)}
              </div>
            </div>
            <div class="dash-recent-step"
              onclick="_dashLoadProject('${p.id}')">
              <div class="dash-step-bar">
                ${[0,1,2,3,4,5].map(s=>`
                  <div class="dash-step-dot ${s<=p.step?'done':''}"></div>
                `).join('')}
              </div>
              <span class="dash-recent-arrow">→</span>
            </div>
            <button class="dash-del-one-btn"
              onclick="event.stopPropagation();_dashDeleteOne('${p.id}','${wrapId||'studio-body'}')"
              title="이 프로젝트 삭제">🗑</button>
          </div>
        `).join('')}
      </div>
    </div>` : ''}

    <!-- 4. 오늘 추천 주제 -->
    <div class="dash-section">
      <div class="dash-section-title">
        💡 오늘 추천 주제
        <button class="dash-refresh-btn"
          onclick="_dashTopicDay=null;_studioDashboard('${wrapId||'studio-body'}')">
          새로고침
        </button>
      </div>
      <div class="dash-topics">
        ${topics.map(t=>`
          <button class="dash-topic-chip"
            onclick="_dashStartWithTopic('${_esc(t)}','${wrapId||'studio-body'}')">
            ${t}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- 5. 빠른 상태 요약 -->
    <div class="dash-section dash-stats">
      <div class="dash-stat-item">
        <div class="dash-stat-num">${stats.done}</div>
        <div class="dash-stat-label">완성</div>
      </div>
      <div class="dash-stat-divider"></div>
      <div class="dash-stat-item">
        <div class="dash-stat-num">${stats.inProgress}</div>
        <div class="dash-stat-label">진행중</div>
      </div>
      <div class="dash-stat-divider"></div>
      <div class="dash-stat-item">
        <div class="dash-stat-num">${stats.thisMonth}</div>
        <div class="dash-stat-label">이번달 제작</div>
      </div>
      <div class="dash-stat-divider"></div>
      <div class="dash-stat-item">
        <div class="dash-stat-num">${stats.cost}원</div>
        <div class="dash-stat-label">이번달 비용</div>
      </div>
    </div>

  </div>`;

  _dashInjectCSS();
}

/* ── 헬퍼 ── */
function _dashGetRecent() {
  try {
    const ls = localStorage.getItem('uc_studio_projects');
    const list = ls ? JSON.parse(ls) : [];
    return list.sort((a,b) => (b.savedAt||0) - (a.savedAt||0));
  } catch(e) { return []; }
}

function _dashGetTodayTopics() {
  if (_dashTopicDay) return _dashTopicDay;
  const lang = _dashLang === 'ja' ? 'ja' : 'ko';
  const pool = DASH_TOPICS[lang] || DASH_TOPICS.ko;
  // 오늘 날짜 기반 시드
  const seed = new Date().getDate() % pool.length;
  const cat  = pool[seed];
  _dashTopicDay = cat.topics;
  return _dashTopicDay;
}

function _dashGetStats() {
  const recent = _dashGetRecent();
  const now    = Date.now();
  const monthMs= 30 * 24 * 60 * 60 * 1000;
  return {
    done:       recent.filter(p => p.step >= 5).length,
    inProgress: recent.filter(p => p.step > 0 && p.step < 5).length,
    thisMonth:  recent.filter(p => now - (p.savedAt||0) < monthMs).length,
    cost:       0, // 추후 Analytics 연동
  };
}

function _dashStepLabel(step) {
  const labels = ['대시보드','대본','이미지·소스','음성','편집','완성'];
  return labels[step] || `Step ${step}`;
}

function _dashFmtDate(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const d = Math.floor(diff / 86400000);
  if (d === 0) return '오늘';
  if (d === 1) return '어제';
  if (d < 7)  return `${d}일 전`;
  return new Date(ts).toLocaleDateString('ko-KR');
}

function _esc(str) {
  return (str||'').replace(/'/g,"\\'");
}

/* ── 액션 ── */
window._dashStartNew = function(wid) {
  if (typeof studioNewProjectObj === 'function') {
    const proj = studioNewProjectObj();
    proj.mode  = _dashMode;
    proj.lang  = _dashLang;
    if (typeof STUDIO !== 'undefined') STUDIO.project = proj;
  }
  if (_dashMode === 'oneclick') {
    // 주제 입력 받고 바로 대본 생성
    const topic = prompt('주제를 입력하세요:');
    if (!topic) return;
    if (typeof studioGoto === 'function') studioGoto(1);
    setTimeout(() => {
      const el = document.querySelector('#sc-topic,#studio-topic,[name="topic"]');
      if (el) { el.value = topic; el.dispatchEvent(new Event('input')); }
    }, 400);
  } else {
    if (typeof studioGoto === 'function') studioGoto(1);
  }
};

window._dashStartWithTopic = function(topic, wid) {
  if (typeof studioNewProjectObj === 'function') {
    const proj = studioNewProjectObj();
    proj.topic = topic;
    if (typeof STUDIO !== 'undefined') STUDIO.project = proj;
  }
  if (typeof studioGoto === 'function') studioGoto(1);
  setTimeout(() => {
    const el = document.querySelector('#sc-topic,#studio-topic,[name="topic"]');
    if (el) { el.value = topic; el.dispatchEvent(new Event('input')); }
  }, 400);
};

window._dashLoadProject = function(id) {
  if (typeof studioResume === 'function') studioResume(id);
};

window._dashSetChannel = function() {
  const ch = prompt('채널명을 입력하세요 (예: 일본 시니어 채널):');
  if (ch) {
    localStorage.setItem('studio_channel', ch);
    if (typeof STUDIO !== 'undefined' && STUDIO.project) {
      STUDIO.project.channel = ch;
    }
    _studioDashboard('studio-body');
  }
};

/* ── CSS ── */
function _dashInjectCSS() {
  if (document.getElementById('dash-style')) return;
  const st = document.createElement('style');
  st.id = 'dash-style';
  st.textContent = `
.dash-wrap{max-width:680px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.dash-section{background:#fff;border:1.5px solid #f1dce7;border-radius:16px;padding:16px}
.dash-section-title{font-size:13px;font-weight:800;color:#2b2430;margin-bottom:12px;
  display:flex;align-items:center;gap:8px}

/* 채널 */
.dash-channel{background:linear-gradient(135deg,#fff5f9,#f5f0ff)}
.dash-channel-inner{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.dash-channel-ico{font-size:24px}
.dash-channel-name{font-size:14px;font-weight:800;margin-bottom:2px}
.dash-channel-empty{color:#ef6fab;font-weight:800}
.dash-channel-sub{font-size:11px;color:#9b8a93}
.dash-channel-btn{margin-left:auto;padding:6px 14px;border:1.5px solid #ef6fab;
  border-radius:20px;background:#fff;color:#ef6fab;font-weight:800;font-size:12px;
  cursor:pointer;white-space:nowrap;transition:.12s}
.dash-channel-btn:hover{background:#ef6fab;color:#fff}
.dash-lang-row{display:flex;gap:4px}
.dash-lang-btn{padding:4px 12px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:11px;font-weight:700;cursor:pointer;transition:.12s}
.dash-lang-btn.on{background:#9181ff;color:#fff;border-color:#9181ff}

/* 모드 */
.dash-modes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
@media(max-width:500px){.dash-modes{grid-template-columns:1fr}}
.dash-mode-card{padding:12px 8px;border:2px solid #f1dce7;border-radius:14px;
  background:#fff;cursor:pointer;text-align:center;transition:.14s}
.dash-mode-card.on{border-color:#ef6fab;background:#fff5f9}
.dash-mode-ico{font-size:24px;display:block;margin-bottom:6px}
.dash-mode-label{font-size:13px;font-weight:800;margin-bottom:3px}
.dash-mode-desc{font-size:10px;color:#9b8a93}
.dash-start-btn{width:100%;padding:14px;border:none;border-radius:14px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-size:15px;font-weight:900;cursor:pointer;transition:.14s}
.dash-start-btn:hover{opacity:.9;transform:translateY(-1px)}

/* 최근 프로젝트 */
.dash-recent-list{display:flex;flex-direction:column;gap:8px}
.dash-recent-item{display:flex;align-items:center;gap:12px;padding:12px;
  border:1.5px solid #f1dce7;border-radius:12px;cursor:pointer;
  background:#fbf7f9;transition:.12s}
.dash-recent-item:hover{border-color:#9181ff;background:#f5f0ff}
.dash-recent-name{font-size:13px;font-weight:800;margin-bottom:3px;color:#2b2430}
.dash-recent-meta{font-size:11px;color:#9b8a93}
.dash-recent-step{display:flex;align-items:center;gap:8px;margin-left:auto}
.dash-step-bar{display:flex;gap:3px}
.dash-step-dot{width:8px;height:8px;border-radius:50%;background:#f1dce7}
.dash-step-dot.done{background:#ef6fab}
.dash-recent-arrow{color:#9181ff;font-weight:800;font-size:16px}

/* 추천 주제 */
.dash-topics{display:flex;flex-direction:column;gap:6px}
.dash-topic-chip{padding:10px 14px;border:1.5px solid #f1dce7;border-radius:10px;
  background:#fff;font-size:13px;font-weight:600;cursor:pointer;text-align:left;
  transition:.12s;color:#2b2430}
.dash-topic-chip:hover{border-color:#ef6fab;background:#fff5f9;color:#ef6fab}
.dash-refresh-btn{padding:3px 10px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:11px;cursor:pointer;font-weight:700;margin-left:auto}

/* 상태 요약 */
.dash-stats{display:flex;align-items:center;justify-content:space-around}
.dash-stat-item{text-align:center;flex:1}
.dash-stat-num{font-size:22px;font-weight:900;color:#ef6fab}
.dash-stat-label{font-size:11px;color:#9b8a93;margin-top:2px}
.dash-stat-divider{width:1px;height:40px;background:#f1dce7}

/* 삭제 버튼 (이슈 1) */
.dash-section-title{display:flex;align-items:center;gap:8px}
.dash-del-all-btn{margin-left:auto;padding:3px 10px;border:1.5px solid #fca5a5;
  border-radius:20px;background:#fff;color:#dc2626;font-size:11px;font-weight:700;
  cursor:pointer;transition:.12s;font-family:inherit}
.dash-del-all-btn:hover{background:#dc2626;color:#fff}
.dash-recent-item{position:relative}
.dash-del-one-btn{margin-left:6px;padding:5px 8px;border:1.5px solid transparent;
  border-radius:8px;background:transparent;color:#9b8a93;font-size:14px;
  cursor:pointer;transition:.12s;flex-shrink:0}
.dash-del-one-btn:hover{border-color:#fca5a5;background:#fef2f2;color:#dc2626}
`;
  document.head.appendChild(st);
}

/* ════════════════════════════════════════════════
   이슈 1 — 삭제 함수 (단건/전체)
   ════════════════════════════════════════════════ */
window._dashDeleteOne = function(id, wid) {
  if (!confirm('이 프로젝트를 삭제할까요?')) return;
  try {
    /* localStorage에서 단건 제거 — 키 패턴: studio_project_<id> 또는 ms_studio_<id> */
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(function(k){
      if (k.indexOf(id) !== -1 && (k.indexOf('studio') !== -1 || k.indexOf('project') !== -1)) {
        localStorage.removeItem(k);
      }
    });
    /* studioList 인덱스 갱신 (s1-script.js 의 LS_STUDIO_LIST) */
    try {
      const listKey = 'studio_project_list';
      const raw = localStorage.getItem(listKey);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const filtered = list.filter(function(x){ return x && x.id !== id; });
          localStorage.setItem(listKey, JSON.stringify(filtered));
        }
      }
    } catch(_) { /* ignore */ }
  } catch(e) {
    console.warn('[dash] delete one 오류:', e);
  }
  if (typeof _studioDashboard === 'function') _studioDashboard(wid || 'studio-body');
};

window._dashDeleteAll = function(wid) {
  if (!confirm('모든 기록을 삭제할까요? 되돌릴 수 없습니다.')) return;
  try {
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(function(k){
      if (k.indexOf('studio_project') === 0 || k.indexOf('ms_studio_') === 0
          || k === 'studio_project_list') {
        localStorage.removeItem(k);
      }
    });
  } catch(e) {
    console.warn('[dash] delete all 오류:', e);
  }
  if (typeof _studioDashboard === 'function') _studioDashboard(wid || 'studio-body');
};
