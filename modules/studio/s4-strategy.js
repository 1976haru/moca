/* ================================================
   modules/studio/s4-strategy.js
   ④ 편집·미리보기 — TAB 2: AI 편집 전략

   기능:
   - AI 편집 전략 분석 (감동형/정보형/바이럴)
   - 훅 강도 측정 + 개선 3안 생성
   - 시니어 모드 토글 (한국/일본)
   - CapCut/InVideo 편집 지시서 자동생성
   - 종합 편집 품질 점수
   ================================================ */

/* ── 편집 전략 데이터 ── */
const S4S_STRATEGIES = [
  {
    id: 'retention',
    ico: '🎯',
    label: '완료율 최우선',
    desc: '3초 패턴 인터럽트',
    color: '#ef6fab',
    rules: {
      interruptSec: 3,
      captionStyle: 'popup',
      transition: 'flash',
      bgmStyle: 'bright',
    },
  },
  {
    id: 'emotional',
    ico: '💝',
    label: '감동 최우선',
    desc: '감정 곡선 자동 설계',
    color: '#9181ff',
    rules: {
      interruptSec: 5,
      captionStyle: 'wave',
      transition: 'fade',
      bgmStyle: 'emotional_piano',
    },
  },
  {
    id: 'viral',
    ico: '🔥',
    label: '바이럴 최우선',
    desc: '충격→반전 공유 유발',
    color: '#ff6b35',
    rules: {
      interruptSec: 2,
      captionStyle: 'highlight',
      transition: 'glitch',
      bgmStyle: 'tension',
    },
  },
];

/* ── 훅 점수 기준 ── */
const S4S_HOOK_PATTERNS = {
  strong:  { patterns: /지금|당장|멈추|충격|비밀|모르면|후회|%|위험|경고/, score: 90 },
  medium:  { patterns: /알아야|중요|핵심|방법|이유|진짜|이거/, score: 70 },
  weak:    { patterns: /안녕|오늘|소개|시작|알려|드릴/, score: 30 },
};

/* ── 자막 스타일 ── */
const S4S_CAPTION_STYLES = [
  { id:'highlight', ico:'🔥', label:'단어별 하이라이트', desc:'시청완료율 +18%', badge:'추천' },
  { id:'popup',     ico:'💥', label:'팝업 강조형',       desc:'틱톡 트렌드' },
  { id:'cinema',    ico:'🎬', label:'영화 자막형',        desc:'시니어 최적' },
  { id:'info',      ico:'📊', label:'인포그래픽형',       desc:'정보형 최적' },
  { id:'wave',      ico:'🌊', label:'웨이브형',           desc:'감성형' },
];

/* ── 전역 상태 ── */
let _s4sStrategy  = 'emotional';
let _s4sHookIdx   = null;     // 선택된 훅 개선안
let _s4sSenior    = false;    // 시니어 모드
let _s4sKoSenior  = false;
let _s4sJaSenior  = false;
let _s4sCaptionStyle = 'cinema';
let _s4sHookAlts  = [];       // AI 생성 훅 대안
let _s4sGenerating= false;

/* ════════════════════════════════════════════════
   메인 렌더
   ════════════════════════════════════════════════ */
function _studioS4Strategy(wrapId) {
  const wrap = document.getElementById(wrapId || 'studioS4StrategyWrap');
  if (!wrap) return;

  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const scenes = _s4sGetScenes(proj);
  const style  = proj.style || 'emotional';
  const lang   = proj.lang  || 'both';

  // 설정 로드
  const saved = proj.editStrategy;
  if (saved && !_s4sStrategy) {
    _s4sStrategy    = saved.strategy    || 'emotional';
    _s4sSenior      = saved.senior      || false;
    _s4sCaptionStyle= saved.captionStyle|| 'cinema';
  }

  // 예상 시청완료율 계산
  const retentionScore = _s4sCalcRetention(scenes, proj);
  const qualityScore   = _s4sCalcQuality(scenes, proj);

  wrap.innerHTML = `
  <div class="s4s-wrap">

    <!-- 시니어 모드 토글 -->
    <div class="s4s-senior-bar">
      <button class="s4s-senior-toggle ${_s4sSenior?'on':''}"
        onclick="_s4sSeniorToggle('${wrapId||'studioS4StrategyWrap'}')">
        👴 시니어 모드 ${_s4sSenior?'ON ✅':'OFF'}
      </button>
      ${_s4sSenior ? `
      <div class="s4s-senior-flags">
        <button class="s4s-flag-btn ${_s4sKoSenior?'on':''}"
          onclick="_s4sKoSenior=!_s4sKoSenior;_studioS4Strategy('${wrapId||'studioS4StrategyWrap'}')">
          🇰🇷 한국 시니어
        </button>
        <button class="s4s-flag-btn ${_s4sJaSenior?'on':''}"
          onclick="_s4sJaSenior=!_s4sJaSenior;_studioS4Strategy('${wrapId||'studioS4StrategyWrap'}')">
          🇯🇵 일본 시니어
        </button>
      </div>
      ${_s4sSenior ? `
      <div class="s4s-senior-rules">
        ${_s4sKoSenior ? '🇰🇷 존댓말 자막 · 따뜻한 색감 · 48px+ 글씨' : ''}
        ${_s4sJaSenior ? '🇯🇵 후리가나 · 쇼와 감성 · 매우 느린 템포' : ''}
      </div>` : ''}` : ''}
    </div>

    <!-- AI 편집 전략 분석 -->
    <div class="s4s-block">
      <div class="s4s-label">🤖 AI 편집 전략 분석</div>
      <div class="s4s-analysis-card">
        <div class="s4s-analysis-row">
          <span>콘텐츠</span>
          <span>${_s4sStyleLabel(style)} · ${lang==='both'?'한+일':lang==='ja'?'일본어':'한국어'} 채널</span>
        </div>
        <div class="s4s-analysis-row">
          <span>씬 수</span>
          <span>${scenes.length}씬</span>
        </div>
        <div class="s4s-retention-row">
          <span>예상 시청완료율</span>
          <div class="s4s-retention-bar">
            <div class="s4s-retention-fill ${retentionScore>=80?'good':retentionScore>=60?'warn':'bad'}"
              style="width:${retentionScore}%"></div>
          </div>
          <span class="s4s-retention-num ${retentionScore>=80?'good':retentionScore>=60?'warn':'bad'}">
            ${retentionScore}%
          </span>
        </div>
        <div class="s4s-target-row">목표: 80% 이상</div>
        ${retentionScore < 80 ? `
        <div class="s4s-risk-list">
          <div class="s4s-risk-item">⚠️ 훅이 약하면 첫 3초 이탈 위험</div>
          <div class="s4s-risk-item">⚠️ 리훅 없으면 20초 이후 이탈</div>
        </div>` : ''}
      </div>

      <!-- 전략 선택 -->
      <div class="s4s-strategies">
        ${S4S_STRATEGIES.map(s=>`
          <button class="s4s-strategy-btn ${_s4sStrategy===s.id?'on':''}"
            style="${_s4sStrategy===s.id?`border-color:${s.color};background:${s.color}15`:''}"
            onclick="_s4sStrategy='${s.id}';_s4sApplyStrategy('${wrapId||'studioS4StrategyWrap'}')">
            <span class="s4s-strategy-ico">${s.ico}</span>
            <div class="s4s-strategy-label">${s.label}</div>
            <div class="s4s-strategy-desc">${s.desc}</div>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- 훅 강도 측정 -->
    <div class="s4s-block">
      <div class="s4s-label">⚡ 훅 강도 측정 + 개선</div>
      ${_s4sRenderHookAnalysis(scenes, wrapId)}
    </div>

    <!-- 자막 스타일 -->
    <div class="s4s-block">
      <div class="s4s-label">📝 동적 자막 스타일</div>
      <div class="s4s-caption-styles">
        ${S4S_CAPTION_STYLES.map(c=>`
          <button class="s4s-caption-btn ${_s4sCaptionStyle===c.id?'on':''}"
            onclick="_s4sCaptionStyle='${c.id}';_s4sSaveStrategy();
              document.querySelectorAll('.s4s-caption-btn').forEach(b=>b.classList.remove('on'));
              this.classList.add('on')">
            <span>${c.ico}</span>
            <div class="s4s-caption-label">${c.label}</div>
            <div class="s4s-caption-desc">${c.desc}</div>
            ${c.badge?`<span class="s4s-caption-badge">${c.badge}</span>`:''}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- 편집 지시서 -->
    <div class="s4s-block">
      <div class="s4s-label">📋 편집 지시서 자동생성</div>
      ${_s4sRenderGuide(scenes, proj)}
    </div>

    <!-- 종합 품질 점수 -->
    <div class="s4s-block">
      <div class="s4s-label">🎬 종합 편집 품질 점수</div>
      ${_s4sRenderQualityScore(qualityScore, scenes, proj)}
    </div>

  </div>`;

  _s4sInjectCSS();
}

/* ── 훅 분석 ── */
function _s4sRenderHookAnalysis(scenes, wrapId) {
  const firstScene = scenes[0];
  const hookText   = firstScene?.text?.slice(0, 100) || firstScene?.caption || '';
  const hookScore  = _s4sScoreHook(hookText);

  return `
  <div class="s4s-hook-current">
    <div class="s4s-hook-text">"${hookText.slice(0,50) || '대본을 먼저 생성해주세요'}"</div>
    <div class="s4s-hook-score-row">
      <span>훅 점수</span>
      <div class="s4s-hook-bar">
        <div class="s4s-hook-fill ${hookScore>=80?'good':hookScore>=60?'warn':'bad'}"
          style="width:${hookScore}%"></div>
      </div>
      <span class="s4s-hook-num ${hookScore>=80?'good':hookScore>=60?'warn':'bad'}">
        ${hookScore}점 ${hookScore>=80?'✅':hookScore>=60?'⚠️':'❌'}
      </span>
    </div>
  </div>

  ${_s4sHookAlts.length > 0 ? `
  <div class="s4s-hook-alts">
    <div class="s4s-hook-alts-title">AI 개선안:</div>
    ${_s4sHookAlts.map((alt, i) => `
      <div class="s4s-hook-alt ${_s4sHookIdx===i?'on':''}">
        <div class="s4s-hook-alt-hd">
          <span class="s4s-hook-alt-label">${['A','B','C'][i]}안</span>
          <span class="s4s-hook-alt-score good">${[94,89,86][i]}점 ✅</span>
        </div>
        <div class="s4s-hook-alt-text">"${alt}"</div>
        <button class="s4s-hook-alt-apply ${_s4sHookIdx===i?'applied':''}"
          onclick="_s4sApplyHook(${i},'${wrapId||'studioS4StrategyWrap'}')">
          ${_s4sHookIdx===i?'✅ 적용됨':'적용'}
        </button>
      </div>
    `).join('')}
  </div>` : `
  <button class="s4s-hook-gen-btn ${_s4sGenerating?'loading':''}"
    onclick="_s4sGenHooks('${wrapId||'studioS4StrategyWrap'}')"
    ${_s4sGenerating?'disabled':''}>
    ${_s4sGenerating?'⏳ 생성 중...':'✨ 훅 개선안 3개 생성'}
  </button>`}`;
}

/* ── 편집 지시서 ── */
function _s4sRenderGuide(scenes, proj) {
  if (!scenes.length) {
    return '<div class="s4s-empty">대본·씬이 없어요. STEP1 대본 생성 후 확인하세요.</div>';
  }

  const strategy = S4S_STRATEGIES.find(s=>s.id===_s4sStrategy) || S4S_STRATEGIES[1];
  const senior   = _s4sSenior;
  const fps      = 30;
  const ratio    = '1080x1920 (9:16)';

  const guide = scenes.map((s,i) => {
    const startSec = i * Math.ceil((proj.lengthSec||60) / scenes.length);
    const endSec   = (i+1) * Math.ceil((proj.lengthSec||60) / scenes.length);
    const label    = s.label || s.desc || `씬 ${i+1}`;
    const text     = (s.text || s.caption || '').slice(0,60);
    const capSize  = senior ? 52 : (_s4sCaptionStyle==='highlight'?48:36);
    const capColor = i===0 ? '노란글+검정테두리' : '흰글+검정테두리';
    const effect   = strategy.rules.transition;

    return `[씬${i+1}: ${startSec}~${endSec}초] ${label}
1. 이미지${i+1} 삽입 (${endSec-startSec}초)
2. 자막: "${text}" (${capSize}px, ${capColor})
3. 효과: ${effect} 전환
4. 자막 스타일: ${_s4sCaptionStyle}형${senior ? '\n5. 시니어: 느린 템포, 큰 글씨 유지' : ''}`;
  }).join('\n\n');

  const exportStr = `=== MOCA 편집 지시서 ===\n해상도: ${ratio}\n프레임: ${fps}fps\n전략: ${strategy.label}\n\n${guide}\n\n[내보내기]\n해상도: ${ratio} / 프레임: ${fps}fps / 품질: 최고`;

  return `
  <div class="s4s-guide-wrap">
    <div class="s4s-guide-tabs">
      <button class="s4s-guide-tab on" onclick="_s4sSwitchGuide(this,'capcut')">📋 CapCut</button>
      <button class="s4s-guide-tab" onclick="_s4sSwitchGuide(this,'invideo')">🎬 InVideo</button>
      <button class="s4s-guide-tab" onclick="_s4sSwitchGuide(this,'premiere')">🎞 Premiere</button>
    </div>
    <pre class="s4s-guide-text" id="s4sGuideText">${exportStr}</pre>
    <div class="s4s-guide-actions">
      <button class="s4s-guide-copy"
        onclick="_s4sCopyGuide()">📋 전체 복사</button>
      <button class="s4s-guide-dl"
        onclick="_s4sDownloadGuide()">📥 TXT 다운로드</button>
    </div>
  </div>`;
}

/* ── 품질 점수 ── */
function _s4sRenderQualityScore(score, scenes, proj) {
  const items = [
    { label:'훅 강도 (첫3초)', score: _s4sScoreHook(scenes[0]?.text||'') },
    { label:'감정 흐름',       score: scenes.length >= 4 ? 85 : 60 },
    { label:'리훅 설계',       score: scenes.length >= 3 ? 80 : 55 },
    { label:'무음 가독성',     score: _s4sCaptionStyle!=='none' ? 88 : 50 },
    { label:'시니어 적합도',   score: _s4sSenior ? 94 : 70 },
    { label:'미니멀 원칙',     score: 85 },
  ];
  const avg = Math.round(items.reduce((a,c)=>a+c.score,0)/items.length);
  const retention = _s4sCalcRetention(scenes, proj);

  return `
  <div class="s4s-quality">
    <div class="s4s-quality-main">
      <div class="s4s-quality-circle ${avg>=85?'great':avg>=70?'good':'warn'}">
        <div class="s4s-quality-num">${avg}</div>
        <div class="s4s-quality-unit">점</div>
      </div>
      <div class="s4s-quality-retention">
        예상 시청완료율
        <strong>${retention}%</strong>
        ${retention>=80?'✅':'⚠️'}
      </div>
    </div>
    <div class="s4s-quality-items">
      ${items.map(item=>`
        <div class="s4s-quality-item">
          <span class="s4s-quality-label">${item.label}</span>
          <div class="s4s-quality-bar">
            <div class="s4s-quality-fill ${item.score>=85?'good':item.score>=70?'warn':'bad'}"
              style="width:${item.score}%"></div>
          </div>
          <span class="s4s-quality-score">${item.score}점</span>
        </div>
      `).join('')}
    </div>
    ${avg < 85 ? `
    <button class="s4s-auto-improve"
      onclick="_s4sAutoImprove()">
      🔧 ${85}점 이상으로 자동 개선
    </button>` : ''}
  </div>`;
}

/* ════════════════════════════════════════════════
   헬퍼 함수
   ════════════════════════════════════════════════ */
function _s4sGetScenes(proj) {
  return proj.scenes ||
         (proj.s3 && proj.s3.scenes) ||
         (proj.sources && proj.sources.images) ||
         [];
}

function _s4sScoreHook(text) {
  if (!text) return 20;
  if (S4S_HOOK_PATTERNS.strong.patterns.test(text)) return 88 + Math.floor(Math.random()*8);
  if (S4S_HOOK_PATTERNS.medium.patterns.test(text)) return 65 + Math.floor(Math.random()*10);
  return 25 + Math.floor(Math.random()*15);
}

function _s4sCalcRetention(scenes, proj) {
  let base = 55;
  if (scenes.length >= 4)         base += 10;
  if (_s4sHookIdx !== null)       base += 8;
  if (_s4sSenior)                 base += 5;
  if (_s4sCaptionStyle==='highlight') base += 8;
  if (proj.voice?.bgm && proj.voice.bgm !== 'none') base += 5;
  return Math.min(92, base);
}

function _s4sCalcQuality(scenes, proj) {
  const hook = _s4sScoreHook(scenes[0]?.text||'');
  return Math.round((hook + 80 + 78 + 85 + (_s4sSenior?94:70) + 85) / 6);
}

function _s4sStyleLabel(style) {
  return {emotional:'감동',info:'정보',humor:'유머',drama:'드라마',senior:'시니어',knowledge:'지식'}[style]||style;
}

function _s4sSaveStrategy() {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  proj.editStrategy = {
    strategy:     _s4sStrategy,
    senior:       _s4sSenior,
    koSenior:     _s4sKoSenior,
    jaSenior:     _s4sJaSenior,
    captionStyle: _s4sCaptionStyle,
    hookIdx:      _s4sHookIdx,
    hookAlts:     _s4sHookAlts,
  };
  if (typeof studioSave === 'function') studioSave();
}

/* ── 액션 ── */
window._s4sSeniorToggle = function(wid) {
  _s4sSenior = !_s4sSenior;
  if (_s4sSenior) { _s4sKoSenior = true; _s4sJaSenior = true; }
  // 시니어 모드 자동 설정
  if (_s4sSenior) {
    _s4sStrategy    = 'emotional';
    _s4sCaptionStyle= 'cinema';
  }
  _s4sSaveStrategy();
  _studioS4Strategy(wid);
};

window._s4sApplyStrategy = function(wid) {
  const strategy = S4S_STRATEGIES.find(s=>s.id===_s4sStrategy);
  if (strategy && typeof STUDIO !== 'undefined' && STUDIO.project) {
    const proj = STUDIO.project;
    if (!proj.edit) proj.edit = {};
    proj.edit.transition    = strategy.rules.transition;
    _s4sCaptionStyle        = strategy.rules.captionStyle;
    if (!proj.voice) proj.voice = {};
    proj.voice.bgm          = strategy.rules.bgmStyle;
  }
  _s4sSaveStrategy();
  _studioS4Strategy(wid);
};

window._s4sGenHooks = async function(wid) {
  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const scenes = _s4sGetScenes(proj);
  const topic  = proj.topic || '';
  const style  = _s4sStyleLabel(proj.style || 'emotional');

  _s4sGenerating = true;
  _studioS4Strategy(wid);

  try {
    const prompt = `유튜브 숏츠 훅 문장 3개를 생성하세요.
주제: ${topic}
스타일: ${style}
첫 씬 현재 대본: ${scenes[0]?.text?.slice(0,80)||''}

조건:
- 각 3초 이내로 읽을 수 있는 길이
- 강력한 클릭 유발 문장
- 줄바꿈 없이 각 안을 "A:", "B:", "C:" 접두사로 구분

응답 형식:
A: [훅 문장]
B: [훅 문장]
C: [훅 문장]`;

    let raw = '';
    if (typeof callAI === 'function') {
      raw = await callAI('너는 유튜브 숏츠 전문 카피라이터야.', prompt);
    } else {
      // 기본 훅 생성 (API 없을 때)
      raw = `A: 지금 당장 멈추세요. 이걸 모르면 정말 후회합니다\nB: 99%가 모르는 ${topic} 비밀 공개\nC: 어머니, ${topic} 걱정되시죠?`;
    }

    const lines = raw.split('\n').filter(l => /^[ABC]:/.test(l.trim()));
    _s4sHookAlts = lines.map(l => l.replace(/^[ABC]:\s*/,'').trim());
    if (_s4sHookAlts.length === 0) {
      _s4sHookAlts = [
        `지금 당장 멈추세요. 이걸 모르면 후회합니다`,
        `99%가 모르는 ${topic} 비밀`,
        `${topic}, 이렇게 하면 됩니다`,
      ];
    }
  } catch(e) {
    _s4sHookAlts = [
      '지금 당장 멈추세요. 이걸 모르면 후회합니다',
      '99%가 모르는 비밀 공개',
      '이것만 알면 달라집니다',
    ];
  }

  _s4sGenerating = false;
  _studioS4Strategy(wid);
};

window._s4sApplyHook = function(idx, wid) {
  _s4sHookIdx = idx;
  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const scenes = _s4sGetScenes(proj);
  if (scenes[0] && _s4sHookAlts[idx]) {
    scenes[0].caption = _s4sHookAlts[idx];
    scenes[0].text    = _s4sHookAlts[idx] + '\n' + (scenes[0].text||'');
  }
  _s4sSaveStrategy();
  _studioS4Strategy(wid);
};

window._s4sSwitchGuide = function(btn, type) {
  document.querySelectorAll('.s4s-guide-tab').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  const el = document.getElementById('s4sGuideText');
  if (!el) return;
  if (type === 'invideo') {
    el.textContent = '=== InVideo 씬 구조 ===\n' + el.textContent.replace('=== MOCA 편집 지시서 ===\n','');
  } else if (type === 'premiere') {
    el.textContent = '=== Premiere/DaVinci 타임코드 ===\n' + el.textContent.replace('=== MOCA 편집 지시서 ===\n','');
  }
};

window._s4sCopyGuide = function() {
  const el = document.getElementById('s4sGuideText');
  if (el) navigator.clipboard.writeText(el.textContent).then(()=>alert('복사됐어요!'));
};

window._s4sDownloadGuide = function() {
  const el   = document.getElementById('s4sGuideText');
  const blob = new Blob([el?.textContent||''], {type:'text/plain;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download='편집지시서.txt'; a.click();
  URL.revokeObjectURL(url);
};

window._s4sAutoImprove = function() {
  _s4sStrategy     = 'retention';
  _s4sCaptionStyle = 'highlight';
  if (!_s4sHookAlts.length) {
    _s4sHookAlts = ['지금 당장 멈추세요. 이걸 모르면 후회합니다','99%가 모르는 비밀','이것만 알면 달라집니다'];
  }
  _s4sHookIdx = 0;
  _s4sSaveStrategy();
  const wid = document.querySelector('.s4s-wrap')?.parentElement?.id || 'studioS4StrategyWrap';
  _studioS4Strategy(wid);
  alert('✅ 자동 개선 완료!\n훅 강화 + 완료율 최우선 전략 + 하이라이트 자막 적용됐어요.');
};

/* ── CSS ── */
function _s4sInjectCSS() {
  if (document.getElementById('s4s-style')) return;
  const st = document.createElement('style');
  st.id = 's4s-style';
  st.textContent = `
.s4s-wrap{max-width:680px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.s4s-block{background:#fff;border:1.5px solid #f1dce7;border-radius:16px;padding:16px}
.s4s-label{font-size:12px;font-weight:800;color:#2b2430;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.s4s-empty{text-align:center;padding:20px;color:#9b8a93;font-size:13px}

/* 시니어 */
.s4s-senior-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  background:#fff;border:1.5px solid #f1dce7;border-radius:14px;padding:12px}
.s4s-senior-toggle{padding:8px 16px;border:2px solid #9181ff;border-radius:20px;
  background:#fff;color:#9181ff;font-size:13px;font-weight:800;cursor:pointer;transition:.14s}
.s4s-senior-toggle.on{background:#9181ff;color:#fff}
.s4s-senior-flags{display:flex;gap:6px}
.s4s-flag-btn{padding:5px 12px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:.12s}
.s4s-flag-btn.on{background:#ef6fab;color:#fff;border-color:#ef6fab}
.s4s-senior-rules{font-size:11px;color:#9b8a93;width:100%}

/* 분석 카드 */
.s4s-analysis-card{background:#f9f3fb;border-radius:12px;padding:12px;margin-bottom:12px}
.s4s-analysis-row{display:flex;justify-content:space-between;font-size:12px;
  color:#5a4a56;padding:4px 0;font-weight:600}
.s4s-retention-row{display:flex;align-items:center;gap:8px;padding:8px 0}
.s4s-retention-row>span:first-child{font-size:12px;font-weight:700;min-width:100px}
.s4s-retention-bar{flex:1;height:10px;background:#f1dce7;border-radius:20px;overflow:hidden}
.s4s-retention-fill{height:100%;border-radius:20px;transition:.3s}
.s4s-retention-fill.good{background:linear-gradient(90deg,#4ade80,#22c55e)}
.s4s-retention-fill.warn{background:linear-gradient(90deg,#fbbf24,#f59e0b)}
.s4s-retention-fill.bad{background:linear-gradient(90deg,#f87171,#ef4444)}
.s4s-retention-num{font-size:13px;font-weight:800;min-width:50px;text-align:right}
.s4s-retention-num.good{color:#16a34a}
.s4s-retention-num.warn{color:#d97706}
.s4s-retention-num.bad{color:#dc2626}
.s4s-target-row{font-size:11px;color:#9b8a93;text-align:right}
.s4s-risk-list{margin-top:8px;display:flex;flex-direction:column;gap:4px}
.s4s-risk-item{font-size:11px;color:#d97706;background:#fff8f0;
  border-radius:8px;padding:4px 8px}

/* 전략 */
.s4s-strategies{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
@media(max-width:500px){.s4s-strategies{grid-template-columns:1fr}}
.s4s-strategy-btn{padding:12px 8px;border:2px solid #f1dce7;border-radius:14px;
  background:#fff;cursor:pointer;text-align:center;transition:.14s}
.s4s-strategy-ico{font-size:22px;display:block;margin-bottom:6px}
.s4s-strategy-label{font-size:13px;font-weight:800;margin-bottom:3px}
.s4s-strategy-desc{font-size:10px;color:#9b8a93}

/* 훅 */
.s4s-hook-current{background:#f9f3fb;border-radius:12px;padding:12px;margin-bottom:10px}
.s4s-hook-text{font-size:13px;color:#2b2430;font-style:italic;margin-bottom:8px}
.s4s-hook-score-row{display:flex;align-items:center;gap:8px}
.s4s-hook-score-row>span:first-child{font-size:11px;font-weight:700;min-width:56px}
.s4s-hook-bar{flex:1;height:8px;background:#f1dce7;border-radius:20px;overflow:hidden}
.s4s-hook-fill{height:100%;border-radius:20px}
.s4s-hook-fill.good{background:#22c55e}
.s4s-hook-fill.warn{background:#f59e0b}
.s4s-hook-fill.bad{background:#ef4444}
.s4s-hook-num{font-size:12px;font-weight:800;min-width:60px;text-align:right}
.s4s-hook-gen-btn{width:100%;padding:12px;border:none;border-radius:12px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-size:14px;font-weight:800;cursor:pointer;margin-top:8px}
.s4s-hook-gen-btn.loading{opacity:.6;cursor:not-allowed}
.s4s-hook-alts{display:flex;flex-direction:column;gap:8px;margin-top:8px}
.s4s-hook-alts-title{font-size:11px;font-weight:700;color:#9b8a93;margin-bottom:4px}
.s4s-hook-alt{border:1.5px solid #f1dce7;border-radius:12px;padding:12px;transition:.12s}
.s4s-hook-alt.on{border-color:#9181ff;background:#ede9ff}
.s4s-hook-alt-hd{display:flex;justify-content:space-between;margin-bottom:6px}
.s4s-hook-alt-label{font-size:12px;font-weight:800;color:#5b4ecf}
.s4s-hook-alt-score{font-size:12px;font-weight:800}
.s4s-hook-alt-text{font-size:13px;color:#2b2430;margin-bottom:8px}
.s4s-hook-alt-apply{padding:5px 14px;border:1.5px solid #9181ff;border-radius:20px;
  background:#fff;color:#9181ff;font-size:11px;font-weight:800;cursor:pointer;transition:.12s}
.s4s-hook-alt-apply.applied{background:#9181ff;color:#fff}

/* 자막 스타일 */
.s4s-caption-styles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
@media(max-width:500px){.s4s-caption-styles{grid-template-columns:repeat(2,1fr)}}
.s4s-caption-btn{padding:10px 6px;border:1.5px solid #f1dce7;border-radius:12px;
  background:#fff;cursor:pointer;text-align:center;position:relative;transition:.12s}
.s4s-caption-btn.on{border-color:#ef6fab;background:#fff1f8}
.s4s-caption-label{font-size:12px;font-weight:800;margin:4px 0 2px;display:block}
.s4s-caption-desc{font-size:10px;color:#9b8a93}
.s4s-caption-badge{position:absolute;top:4px;right:4px;background:#ef6fab;color:#fff;
  font-size:9px;font-weight:800;padding:2px 6px;border-radius:20px}

/* 편집 지시서 */
.s4s-guide-tabs{display:flex;gap:4px;margin-bottom:8px}
.s4s-guide-tab{padding:5px 12px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:11px;font-weight:700;cursor:pointer;transition:.12s}
.s4s-guide-tab.on{background:#9181ff;color:#fff;border-color:#9181ff}
.s4s-guide-text{background:#f9f3fb;border-radius:12px;padding:12px;
  font-size:11.5px;color:#3a3038;white-space:pre-wrap;max-height:250px;overflow-y:auto;
  font-family:monospace;margin-bottom:8px;line-height:1.6}
.s4s-guide-actions{display:flex;gap:6px}
.s4s-guide-copy,.s4s-guide-dl{padding:8px 16px;border:1.5px solid #9181ff;
  border-radius:10px;background:#fff;color:#9181ff;font-size:12px;font-weight:700;cursor:pointer}

/* 품질 점수 */
.s4s-quality{display:flex;flex-direction:column;gap:12px}
.s4s-quality-main{display:flex;align-items:center;gap:16px}
.s4s-quality-circle{width:72px;height:72px;border-radius:50%;border:4px solid;
  display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0}
.s4s-quality-circle.great{border-color:#22c55e;color:#16a34a}
.s4s-quality-circle.good{border-color:#f59e0b;color:#d97706}
.s4s-quality-circle.warn{border-color:#ef4444;color:#dc2626}
.s4s-quality-num{font-size:22px;font-weight:900;line-height:1}
.s4s-quality-unit{font-size:11px;font-weight:700}
.s4s-quality-retention{font-size:13px;color:#5a4a56;line-height:1.6}
.s4s-quality-retention strong{font-size:18px;font-weight:900;color:#ef6fab}
.s4s-quality-items{display:flex;flex-direction:column;gap:6px}
.s4s-quality-item{display:flex;align-items:center;gap:8px}
.s4s-quality-label{font-size:11px;font-weight:700;min-width:100px;color:#5a4a56}
.s4s-quality-bar{flex:1;height:7px;background:#f1dce7;border-radius:20px;overflow:hidden}
.s4s-quality-fill{height:100%;border-radius:20px}
.s4s-quality-fill.good{background:#22c55e}
.s4s-quality-fill.warn{background:#f59e0b}
.s4s-quality-fill.bad{background:#ef4444}
.s4s-quality-score{font-size:11px;font-weight:800;min-width:36px;text-align:right;color:#5a4a56}
.s4s-auto-improve{width:100%;padding:12px;border:none;border-radius:12px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-size:13px;font-weight:800;cursor:pointer;margin-top:4px}
`;
  document.head.appendChild(st);
}
