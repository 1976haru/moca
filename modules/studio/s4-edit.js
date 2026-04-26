/* ================================================
   modules/studio/s4-edit.js
   ④ 영상 구성·미리보기 — 공통 + TAB 1 미리보기 + CSS

   분리 구조 (로드 순서: s4-edit → s4-caption → s4-compose):
     s4-edit.js     공통 상수+상태+TAB1 미리보기+CSS+탭 라우팅
     s4-caption.js  TAB2 자막·폰트 (+ S4_FONTS)
     s4-compose.js  TAB3 썸네일 + TAB4 영상구성 + TAB5 BGM

   TAB 1  📱 미리보기       씬 슬라이드 + 자막 오버레이
   TAB 2  📝 자막·폰트      한일 안전 체크 + SRT 생성  (s4-caption.js)
   TAB 3  🖼 썸네일         텍스트 오버레이 + A/B/C    (s4-compose.js)
   TAB 4  🎬 영상 구성      템플릿·전환·필터·브랜딩    (s4-compose.js)
   TAB 5  🎵 BGM·음향       설정값 저장                (s4-compose.js)
   ================================================ */

/* ── 편집 상수 ── */
const S4_TEMPLATES = [
  { id: 'senior_warm',  label: '시니어감동',  desc: '따뜻한 톤·느린 전환' },
  { id: 'tikitaka',     label: '티키타카배틀', desc: '빠른 컷·임팩트' },
  { id: 'documentary',  label: '다큐멘터리',  desc: '진중한 톤·페이드' },
  { id: 'reels',        label: '릴스스타일',  desc: '트렌디·컬러풀' },
  { id: 'infocard',     label: '정보카드형',  desc: '텍스트 중심·깔끔' },
  { id: 'comic',        label: '코믹반전',    desc: '글리치·임팩트 효과' },
];

const S4_TRANSITIONS = [
  { id: 'fade',     label: '페이드' },
  { id: 'slide',    label: '슬라이드' },
  { id: 'zoom',     label: '줌' },
  { id: 'dissolve', label: '디졸브' },
  { id: 'flash',    label: '플래시' },
  { id: 'glitch',   label: '글리치' },
  { id: 'none',     label: '없음' },
];

const S4_MOTIONS = [
  { id: 'canvas', label: '캔버스' },
  { id: 'pan',    label: '패닝' },
  { id: 'shake',  label: '흔들림' },
  { id: 'zoom',   label: '줌인/아웃' },
  { id: 'none',   label: '없음' },
];

const S4_FILTERS = [
  { id: 'none',    label: '원본' },
  { id: 'warm',    label: '따뜻한 톤' },
  { id: 'cool',    label: '차가운 톤' },
  { id: 'bw',      label: '흑백' },
  { id: 'sepia',   label: '세피아' },
  { id: 'vivid',   label: '비비드' },
  { id: 'cinema',  label: '시네마' },
  { id: 'vintage', label: '빈티지' },
  { id: 'drama',   label: '드라마틱' },
];

const S4_BGM_LIST = [
  { id: 'emotional_piano', label: '🎹 감성 피아노',    desc: '시니어 기본·따뜻함' },
  { id: 'acoustic_guitar', label: '🎸 어쿠스틱 기타',  desc: '자연스러운 감성' },
  { id: 'japan_harmony',   label: '🎋 일본풍 화음',    desc: '화와·거문고 느낌' },
  { id: 'tension',         label: '⚡ 긴장감',          desc: '드라마·폭로·충격' },
  { id: 'bright',          label: '☀️ 밝고 경쾌',      desc: '정보·튜토리얼' },
  { id: 'lofi',            label: '🌙 로파이',          desc: '집중·공부 분위기' },
  { id: 'none',            label: '🔇 BGM 없음',        desc: '음성만 사용' },
];

const S4_EMPHASIS_WORDS = ['이것', '절대', '반드시', '지금', '충격', '비밀',
  '몰랐', '후회', '긴급', '공개', '무료', '비법', '핵심',
  'これ', '絶対', '必ず', '今すぐ', '衝撃', '秘密', '無料'];

const S4_LS = 'moca_s4_edit';

/* ── 전역 상태 ── */
let _s4Tab       = 't1';
let _s4SceneIdx  = 0;
let _s4ThumbAlt  = 'A'; // A/B/C
let _s4Edit      = null; // 저장된 편집 설정

/* ════════════════════════════════════════════════
   메인 렌더
   ════════════════════════════════════════════════ */
function _studioS4Edit(wrapId) {
  const wrap = document.getElementById(wrapId || 'studioS4EditWrap');
  if (!wrap) return;

  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  /* 씬경로 fallback 통일 — s4-strategy.js 의 _s4sGetScenes 와 동일 패턴 */
  const scenes = proj.scenes
              || (proj.s3 && proj.s3.scenes)
              || (proj.sources && proj.sources.images)
              || [];

  // 편집 설정 초기화
  if (!_s4Edit) {
    const saved = localStorage.getItem(S4_LS);
    _s4Edit = saved ? JSON.parse(saved) : _s4DefaultEdit();
  }

  wrap.innerHTML = `
  <div class="s4e-wrap">
    <nav class="s4e-nav">
      ${[
        ['t1','📱 미리보기'],
        ['t2','📝 자막·폰트'],
        ['t3','🖼 썸네일'],
        ['t4','🎬 영상 구성'],
        ['t5','🎵 BGM·음향'],
        ['t6','🎯 편집 전략'],
        ['t7','🎬 Magiclight'],
      ].map(([id,label]) => `
        <button class="s4e-tab ${_s4Tab===id?'on':''}"
          onclick="_s4eSetTab('${id}','${wrapId||'studioS4EditWrap'}')">${label}</button>
      `).join('')}
    </nav>

    <div class="s4e-body">
      ${_s4Tab==='t1' ? _s4eT1Preview(scenes, proj)            : ''}
      ${_s4Tab==='t2' ? _s4eT2Caption(scenes, proj)            : ''}
      ${_s4Tab==='t3' ? _s4eT3Thumb(proj)                      : ''}
      ${_s4Tab==='t4' ? _s4eT4Compose()                        : ''}
      ${_s4Tab==='t5' ? _s4eT5Audio()                          : ''}
      ${_s4Tab==='t6' ? '<div id="studioS4StrategyWrap"></div>' : ''}
      ${_s4Tab==='t7' ? '<div id="s4-magiclight-host"></div>'   : ''}
    </div>

    <div class="s4e-footer">
      <button class="s4e-btn-save" onclick="_s4eSave()">💾 편집 설정 저장</button>
      <button class="s4e-btn-next"
        onclick="typeof studioGoto==='function'&&studioGoto(5)">
        다음: 최종검수·출력 →
      </button>
    </div>
  </div>`;

  _s4eInjectCSS();
  _s4eLoadFonts();

  /* TAB 6: s4-strategy.js 의 _studioS4Strategy(wrapId) 로 패널 주입 */
  if (_s4Tab === 't6' && typeof _studioS4Strategy === 'function') {
    _studioS4Strategy('studioS4StrategyWrap');
  }
  /* TAB 7: s4-magiclight-panel.js 의 s4mlRenderPanel(hostId) 로 패널 주입 */
  if (_s4Tab === 't7' && typeof window.s4mlRenderPanel === 'function') {
    window.s4mlRenderPanel('s4-magiclight-host');
  } else if (_s4Tab === 't7') {
    var host = document.getElementById('s4-magiclight-host');
    if (host) host.innerHTML = '<div style="padding:12px;color:#92400e;background:#fef3c7;border-radius:10px;font-size:12px">⚠️ Magiclight 모듈이 로드되지 않았습니다. (s4-magiclight-panel.js)</div>';
  }
}

/* ════════════════════════════════════════════════
   TAB 1 — 미리보기
   ════════════════════════════════════════════════ */
function _s4eT1Preview(scenes, proj) {
  const scene  = scenes[_s4SceneIdx] || {};
  const imgUrl = scene.imageUrl || scene.img || '';
  const caption= _s4eApplyCaption(scene.caption || scene.desc || scene.label || '');
  const font   = S4_FONTS.find(f => f.id === _s4Edit.caption.fontId) || S4_FONTS[0];
  const total  = scenes.length;

  // 영상 파일 있으면 metadata 체크
  const hasVideo = !!(proj.videoUrl || proj.videoFile);

  // 씬 길이 계산
  const durSec = _s4eSceneDuration(proj);
  const totalSec = durSec * total;

  // 안전구역 경고
  const warnings = _s4eCheckWarnings(scenes);

  return `
  <div class="s4e-section">

    <!-- 화면 비율 선택 -->
    <div class="s4e-ratio-row">
      ${['9:16','16:9','1:1'].map(r => `
        <button class="s4e-ratio-btn ${_s4Edit.ratio===r?'on':''}"
          onclick="_s4Edit.ratio='${r}';_studioS4Edit('studioS4EditWrap')">${r}</button>
      `).join('')}
      <span class="s4e-ratio-hint">
        ⏱ 예상 ${_s4eFmtTime(totalSec)}
        ${hasVideo ? `· 📐 영상 감지됨` : '· 🖼 이미지 슬라이드'}
      </span>
    </div>

    <!-- 미리보기 프레임 -->
    <div class="s4e-preview-wrap ${_s4Edit.ratio==='9:16'?'portrait':_s4Edit.ratio==='1:1'?'square':'landscape'}">
      ${imgUrl
        ? `<img src="${imgUrl}" class="s4e-preview-img" alt="씬${_s4SceneIdx+1}">`
        : `<div class="s4e-preview-empty">🖼 이미지 없음<br><small>STEP2에서 이미지 생성 후 표시됩니다</small></div>`}

      <!-- 자막 오버레이 -->
      ${caption ? `
        <div class="s4e-caption-overlay ${_s4Edit.caption.position}"
          style="font-family:${font.css};
                 font-size:${_s4eFontSize(_s4Edit.caption.size)}px;
                 color:${_s4Edit.caption.color};
                 ${_s4Edit.caption.bg?'background:rgba(0,0,0,0.55);padding:4px 10px;border-radius:6px;':''}">
          ${_s4eHighlight(caption)}
        </div>` : ''}

      <!-- 씬 번호 -->
      <div class="s4e-scene-badge">씬 ${_s4SceneIdx+1} / ${total}</div>
    </div>

    <!-- 씬 네비게이션 -->
    <div class="s4e-scene-nav">
      <button class="s4e-nav-btn" onclick="_s4eSceneNav(-1,'studioS4EditWrap')"
        ${_s4SceneIdx===0?'disabled':''}>←</button>
      <div class="s4e-scene-dots">
        ${scenes.map((_,i) => `
          <button class="s4e-dot ${i===_s4SceneIdx?'on':''}"
            onclick="_s4SceneIdx=${i};_studioS4Edit('studioS4EditWrap')"
            title="씬${i+1}"></button>
        `).join('')}
      </div>
      <button class="s4e-nav-btn" onclick="_s4eSceneNav(1,'studioS4EditWrap')"
        ${_s4SceneIdx>=total-1?'disabled':''}>→</button>
    </div>

    <!-- 씬 정보 -->
    <div class="s4e-scene-info">
      <span>📌 ${scene.label || scene.desc || '씬 '+(_s4SceneIdx+1)}</span>
      <span>⏱ ~${durSec}초</span>
    </div>

    <!-- 경고 -->
    ${warnings.length ? `
      <div class="s4e-warnings">
        ${warnings.map(w=>`<div class="s4e-warn-row">⚠️ ${w}</div>`).join('')}
      </div>` : ''}

    <!-- 빠른 이동 -->
    <div class="s4e-quick-btns">
      <button class="s4e-quick-btn" onclick="_s4eSetTab('t2','studioS4EditWrap')">
        📝 자막 편집
      </button>
      <button class="s4e-quick-btn" onclick="_s4eSetTab('t3','studioS4EditWrap')">
        🖼 썸네일 편집
      </button>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   헬퍼 함수
   ════════════════════════════════════════════════ */
function _s4DefaultEdit() {
  return {
    ratio: '9:16',
    channelLang: 'both',
    caption: {
      fontId: 'noto_both',
      size: 'lg',
      position: 'bottom',
      color: '#ffffff',
      bg: true,
      autoSplit: true,
      autoEmphasis: true,
      safeZone: true,
    },
    thumb: {
      A: { text: '', size: 'lg', pos: 'bottom', color: '#ffffff', bg: true },
      B: { text: '', size: 'xl', pos: 'center', color: '#FFE033', bg: false },
      C: { text: '', size: 'lg', pos: 'top',    color: '#ffffff', bg: true },
    },
    compose: {
      template: 'senior_warm',
      transition: 'fade',
      motion: 'pan',
      filter: 'warm',
      openingAnim: true,
      closingAnim: true,
      endCard: false,
      logoUrl: '',
      watermark: '',
      channelColor: '#ef6fab',
    },
    audio: {
      bgm: 'emotional_piano',
      bgmVol: 30,
      voiceVol: 100,
      sfx: 'none',
      fadeIn: true,
      fadeOut: true,
    },
  };
}

function _s4eApplyCaption(text) {
  if (!_s4Edit.caption.autoSplit) return text;
  if (text.length <= 20) return text;
  const mid = Math.ceil(text.length / 2);
  return text.slice(0, mid) + '\n' + text.slice(mid);
}

function _s4eHighlight(text) {
  if (!_s4Edit.caption.autoEmphasis) return text.replace(/\n/g,'<br>');
  let result = text.replace(/\n/g, '<br>');
  S4_EMPHASIS_WORDS.forEach(w => {
    result = result.replace(
      new RegExp(w, 'g'),
      `<span style="color:#FFE033;font-weight:900">${w}</span>`
    );
  });
  return result;
}

function _s4eFontSize(size) {
  return { sm: 14, md: 18, lg: 22, xl: 28 }[size] || 20;
}

function _s4eSceneDuration(proj) {
  const len = proj.lengthSec || proj.duration || 60;
  const cnt = (proj.scenes || []).length || 1;
  return Math.round(len / cnt);
}

function _s4eFmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

function _s4eCheckWarnings(scenes) {
  const warns = [];
  scenes.forEach((s, i) => {
    if (!s.imageUrl && !s.img)
      warns.push(`씬${i+1} 이미지 없음`);
  });
  if (_s4Edit.caption.safeZone && _s4Edit.caption.position === 'bottom')
    warns.push('Shorts/TikTok 하단 자막 — 플랫폼 UI와 겹칠 수 있음');
  return warns;
}

function _s4eApplyPreset(id) {
  const presets = {
    shorts: { position:'bottom', size:'lg', color:'#ffffff', bg:true },
    reels:  { position:'center', size:'xl', color:'#ffffff', bg:false },
    tiktok: { position:'top',    size:'lg', color:'#FFE033', bg:false },
  };
  const p = presets[id];
  if (p) {
    Object.assign(_s4Edit.caption, p);
    _studioS4Edit('studioS4EditWrap');
  }
}

function _s4eSave() {
  // STUDIO.project에도 저장
  if (typeof STUDIO !== 'undefined' && STUDIO.project) {
    STUDIO.project.edit = _s4Edit;
    if (typeof studioSave === 'function') studioSave();
  }
  localStorage.setItem(S4_LS, JSON.stringify(_s4Edit));
  const btn = document.querySelector('.s4e-btn-save');
  if (btn) { btn.textContent = '✅ 저장됨'; setTimeout(() => { btn.textContent = '💾 편집 설정 저장'; }, 1500); }
}

/* ── 이벤트 핸들러 ── */
window._s4eSetTab = function(tab, wid) {
  _s4Tab = tab;
  _studioS4Edit(wid);
};

window._s4eSceneNav = function(dir, wid) {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const max  = (proj.scenes || []).length - 1;
  _s4SceneIdx = Math.max(0, Math.min(max, _s4SceneIdx + dir));
  _studioS4Edit(wid);
};

/* ── 폰트 로드 ── */
function _s4eLoadFonts() {
  const font = S4_FONTS.find(f => f.id === (_s4Edit?.caption?.fontId)) || S4_FONTS[0];
  if (!font.google) return;
  const id = 's4e-font-' + font.id;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id   = id;
  link.rel  = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`;
  document.head.appendChild(link);
}

/* ── CSS ── */
function _s4eInjectCSS() {
  if (document.getElementById('s4e-style')) return;
  const st = document.createElement('style');
  st.id = 's4e-style';
  st.textContent = `
.s4e-wrap{font-family:inherit}
.s4e-nav{display:flex;gap:4px;margin-bottom:14px;flex-wrap:wrap}
.s4e-tab{padding:8px 14px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:12px;font-weight:700;color:#7b7077;cursor:pointer;transition:.14s}
.s4e-tab.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.s4e-body{background:#fff;border-radius:16px;border:1px solid #f1dce7;padding:18px;margin-bottom:10px}
.s4e-section{}
.s4e-block{margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #f8f0f5}
.s4e-block:last-child{border-bottom:none;margin-bottom:0}
.s4e-label{font-size:12px;font-weight:800;color:#2b2430;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.s4e-label-sub{font-size:10px;color:#9b8a93;font-weight:400}
.s4e-footer{display:flex;gap:8px}
.s4e-btn-save{flex:1;padding:12px;border:2px solid #9181ff;border-radius:12px;
  background:#fff;color:#9181ff;font-weight:800;cursor:pointer;font-size:13px}
.s4e-btn-next{flex:2;padding:12px;border:none;border-radius:12px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;font-weight:800;cursor:pointer;font-size:13px}
.s4e-btn-primary{width:100%;padding:12px;border:none;border-radius:12px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;font-weight:800;cursor:pointer;margin-top:8px}
.s4e-btn-outline{width:100%;padding:10px;border:1.5px solid #f1dce7;border-radius:10px;
  background:#fff;font-weight:700;font-size:12px;cursor:pointer;margin-top:6px;transition:.12s}
.s4e-btn-outline:hover{border-color:#9181ff;color:#9181ff}

/* 미리보기 */
.s4e-ratio-row{display:flex;align-items:center;gap:6px;margin-bottom:10px;flex-wrap:wrap}
.s4e-ratio-btn{padding:5px 14px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:.12s}
.s4e-ratio-btn.on{background:#9181ff;color:#fff;border-color:#9181ff}
.s4e-ratio-hint{font-size:11px;color:#9b8a93;margin-left:auto}
.s4e-preview-wrap{position:relative;background:#1a1a2e;border-radius:14px;overflow:hidden;
  margin-bottom:10px;display:flex;align-items:center;justify-content:center}
.s4e-preview-wrap.portrait{width:180px;height:320px;margin:0 auto}
.s4e-preview-wrap.landscape{width:100%;height:200px}
.s4e-preview-wrap.square{width:240px;height:240px;margin:0 auto}
.s4e-preview-img{width:100%;height:100%;object-fit:cover}
.s4e-preview-empty{color:#555;text-align:center;font-size:12px;padding:20px;line-height:1.6}
.s4e-caption-overlay{position:absolute;left:0;right:0;text-align:center;
  font-weight:800;line-height:1.4;padding:6px 10px;white-space:pre-line}
.s4e-caption-overlay.top{top:8px}
.s4e-caption-overlay.center{top:50%;transform:translateY(-50%)}
.s4e-caption-overlay.bottom{bottom:8px}
.s4e-scene-badge{position:absolute;top:8px;right:8px;background:rgba(0,0,0,.6);
  color:#fff;border-radius:20px;padding:3px 10px;font-size:11px}
.s4e-scene-nav{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.s4e-nav-btn{padding:6px 14px;border:1.5px solid #f1dce7;border-radius:8px;
  background:#fff;cursor:pointer;font-size:14px}
.s4e-nav-btn:disabled{opacity:.3}
.s4e-scene-dots{display:flex;gap:4px;flex:1;flex-wrap:wrap}
.s4e-dot{width:10px;height:10px;border-radius:50%;border:1.5px solid #f1dce7;
  background:#fff;cursor:pointer;transition:.12s;padding:0}
.s4e-dot.on{background:#ef6fab;border-color:#ef6fab}
.s4e-scene-info{display:flex;justify-content:space-between;font-size:11px;
  color:#9b8a93;margin-bottom:8px}
.s4e-warnings{background:#fff8f0;border-radius:10px;padding:8px 12px;margin-bottom:8px}
.s4e-warn-row{font-size:12px;color:#c0692b;padding:2px 0}
.s4e-quick-btns{display:flex;gap:6px}
.s4e-quick-btn{flex:1;padding:8px;border:1.5px solid #f1dce7;border-radius:10px;
  background:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:.12s}
.s4e-quick-btn:hover{border-color:#9181ff;color:#9181ff}

/* 자막·폰트 */
.s4e-seg{display:flex;gap:3px;flex-wrap:wrap}
.s4e-seg-btn{padding:5px 12px;border:1.5px solid #f1dce7;border-radius:8px;
  background:#fff;font-size:11px;font-weight:700;color:#7b7077;cursor:pointer;transition:.12s}
.s4e-seg-btn.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.s4e-font-warn{background:#fff1f1;border-radius:10px;padding:10px 12px;
  font-size:12px;color:#c0392b;font-weight:700;margin-bottom:10px}
/* 폰트 카드 (이슈 5+6 — 카드형 grid + 미리보기 강화) */
.s4e-font-list{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:6px}
@media(max-width:500px){.s4e-font-list{grid-template-columns:1fr}}
.s4e-font-row{position:relative;display:flex;flex-direction:column;align-items:stretch;
  gap:6px;padding:14px 12px 12px;border:1.5px solid #f1dce7;border-radius:12px;
  cursor:pointer;transition:.12s;background:#fff;min-height:84px}
.s4e-font-row:hover{border-color:#9181ff;background:#fbf7ff}
.s4e-font-row.on{border-color:#9181ff;background:#ede9ff;box-shadow:0 2px 8px rgba(145,129,255,.15)}
.s4e-font-row input[type="radio"]{position:absolute;top:8px;right:8px;
  width:14px;height:14px;margin:0;cursor:pointer;accent-color:#9181ff}
.s4e-font-name{font-size:13px;font-weight:800;color:#2b2430;display:flex;
  align-items:center;gap:6px;flex-wrap:wrap;padding-right:24px;line-height:1.3}
.s4e-font-preview{font-size:15px;color:#3a3038;line-height:1.5;
  padding:6px 10px;background:#fbf7f9;border-radius:8px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.s4e-font-desc{font-size:11px;color:#9b8a93;line-height:1.4}
.s4e-badge-rec{padding:2px 8px;background:#effbf7;color:#1a7a5a;border-radius:20px;font-size:10px;font-weight:700}
.s4e-badge-safe{padding:2px 8px;background:#ede9ff;color:#5b4ecf;border-radius:20px;font-size:10px;font-weight:700}
.s4e-style-presets{display:flex;gap:6px;margin-bottom:10px}
.s4e-preset-btn{flex:1;padding:8px;border:1.5px solid #f1dce7;border-radius:10px;
  background:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:.12s}
.s4e-preset-btn:hover{border-color:#ef6fab;background:#fff1f8}
.s4e-style-rows{display:flex;flex-direction:column;gap:8px}
.s4e-style-row{display:flex;align-items:center;gap:8px}
.s4e-style-row>span{font-size:12px;font-weight:700;min-width:36px}
.s4e-auto-rows{display:flex;flex-direction:column;gap:6px}
.s4e-auto-row{display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer}
.s4e-srt-btns{display:flex;gap:6px;margin-bottom:8px}
.s4e-srt-preview{font-size:11px;color:#9b8a93;background:#f9f3fb;border-radius:8px;
  padding:8px;white-space:pre;overflow-x:auto;max-height:100px;display:none}
.s4e-srt-preview:not(:empty){display:block}

/* 썸네일 */
.s4e-ab-tabs{display:flex;gap:4px;margin-bottom:10px}
.s4e-ab-tab{flex:1;padding:8px;border:1.5px solid #f1dce7;border-radius:10px;
  background:#fff;font-weight:800;cursor:pointer;transition:.12s}
.s4e-ab-tab.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.s4e-thumb-preview{position:relative;width:100%;height:200px;background:#1a1a2e;
  border-radius:12px;overflow:hidden;margin-bottom:10px}
.s4e-thumb-img{width:100%;height:100%;object-fit:cover}
.s4e-thumb-empty{color:#555;text-align:center;font-size:12px;padding:20px;line-height:1.6;
  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
.s4e-thumb-text{position:absolute;left:0;right:0;text-align:center;
  font-weight:900;padding:6px 12px}
.s4e-thumb-text.top{top:10px}
.s4e-thumb-text.center{top:50%;transform:translateY(-50%)}
.s4e-thumb-text.bottom{bottom:10px}
.s4e-thumb-text.md{font-size:20px}
.s4e-thumb-text.lg{font-size:26px}
.s4e-thumb-text.xl{font-size:34px}
.s4e-thumb-inputs{margin-bottom:10px}
.s4e-thumb-input{width:100%;border:1.5px solid #f1dce7;border-radius:10px;
  padding:10px;font-size:14px;font-weight:700;outline:none;margin-bottom:8px}
.s4e-thumb-input:focus{border-color:#ef6fab}
.s4e-thumb-controls{display:flex;flex-direction:column;gap:8px}

/* 영상 구성 (구버전 호환) */
.s4e-template-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:4px}
@media(max-width:500px){.s4e-template-grid{grid-template-columns:repeat(2,1fr)}}
.s4e-template-btn{padding:10px 8px;border:1.5px solid #f1dce7;border-radius:12px;
  background:#fff;cursor:pointer;transition:.14s;text-align:center}
.s4e-template-btn.on{border-color:#ef6fab;background:#fff1f8}
.s4e-tpl-label{font-size:13px;font-weight:800;margin-bottom:3px}
.s4e-tpl-desc{font-size:10px;color:#9b8a93}
.s4e-chip-row{display:flex;gap:4px;flex-wrap:wrap}
.s4e-chip{padding:5px 12px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:.12s}
.s4e-chip.on{background:#9181ff;color:#fff;border-color:#9181ff}

/* 통합 옵션 카드 — 이슈 3 (UI 깨짐 수정) */
.studio-option-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:4px}
@media(max-width:600px){.studio-option-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:420px){.studio-option-grid{grid-template-columns:1fr}}
.studio-compact-grid{grid-template-columns:repeat(4,1fr)}
@media(max-width:600px){.studio-compact-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:420px){.studio-compact-grid{grid-template-columns:repeat(2,1fr)}}
.studio-option-card{position:relative;display:flex;flex-direction:column;
  align-items:flex-start;justify-content:flex-start;gap:3px;
  padding:11px 12px 10px;border:1.5px solid #f1dce7;border-radius:11px;
  background:#fff;cursor:pointer;transition:.14s;min-height:48px;
  text-align:left;user-select:none}
.studio-option-card:hover{border-color:#9181ff;background:#fbf7ff;transform:translateY(-1px)}
.studio-option-card.on{border-color:#ef6fab;background:linear-gradient(135deg,#fff1f8,#f5f0ff);
  box-shadow:0 2px 10px rgba(239,111,171,.18)}
.studio-option-title{font-size:12.5px;font-weight:800;color:#2b2430;line-height:1.3;
  padding-right:18px}
.studio-option-desc{font-size:10.5px;color:#9b8a93;line-height:1.4}
.studio-option-check{position:absolute;top:6px;right:8px;
  width:16px;height:16px;border-radius:4px;display:flex;
  align-items:center;justify-content:center;font-size:11px;font-weight:900;
  background:transparent;color:#ef6fab}
.studio-option-card.on .studio-option-check{background:#ef6fab;color:#fff}

/* 편집 설정 요약 */
.s4e-summary{background:#fbf7f9;border-radius:10px;padding:10px 12px;
  display:flex;flex-direction:column;gap:4px;font-size:12px;color:#3a3038}
.s4e-summary b{color:#5b4ecf;font-weight:800}
.s4e-summary-hint{margin-top:4px;font-size:10.5px;color:#9b8a93}
.s4e-summary code{background:#fff;padding:1px 5px;border-radius:4px;font-size:10px}
.s4e-brand-rows{margin-bottom:10px}
.s4e-brand-inputs{display:flex;flex-direction:column;gap:8px}
.s4e-inp-row{display:flex;align-items:center;gap:8px}
.s4e-inp-row label{font-size:12px;font-weight:700;min-width:70px}
.s4e-inp{flex:1;border:1.5px solid #f1dce7;border-radius:8px;padding:6px 10px;font-size:12px}

/* BGM */
.s4e-bgm-list{display:flex;flex-direction:column;gap:6px}
.s4e-bgm-row{display:flex;align-items:center;gap:10px;padding:10px;
  border:1.5px solid #f1dce7;border-radius:12px;cursor:pointer;transition:.12s}
.s4e-bgm-row.on{border-color:#9181ff;background:#ede9ff}
.s4e-bgm-label{font-size:13px;font-weight:700}
.s4e-bgm-desc{font-size:11px;color:#9b8a93}
.s4e-vol-rows{display:flex;flex-direction:column;gap:10px}
.s4e-vol-row{display:flex;align-items:center;gap:10px}
.s4e-vol-row span:first-child{font-size:12px;font-weight:700;min-width:70px}
.s4e-vol-row input[type=range]{flex:1}
.s4e-vol-row span:last-child{font-size:12px;color:#9b8a93;min-width:36px;text-align:right}
.s4e-audio-hint{background:#f9f3fb;border-radius:10px;padding:12px;
  font-size:11.5px;color:#7b7077;line-height:1.7}
`;
  document.head.appendChild(st);
}
