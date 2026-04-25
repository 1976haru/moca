/* ================================================
   modules/studio/s4-edit.js
   ④ 영상 구성·미리보기 단계

   TAB 1  📱 미리보기       씬 슬라이드 + 자막 오버레이
   TAB 2  📝 자막·폰트      한일 안전 체크 + SRT 생성
   TAB 3  🖼 썸네일         텍스트 오버레이 + A/B/C
   TAB 4  🎬 영상 구성      템플릿·전환·필터·브랜딩
   TAB 5  🎵 BGM·음향       설정값 저장
   ================================================ */

/* ── 폰트 데이터 ── */
const S4_FONTS = [
  {
    id: 'noto_both',
    label: 'Noto Sans KR+JP',
    lang: 'both',
    css: '"Noto Sans KR","Noto Sans JP",sans-serif',
    google: 'Noto+Sans+KR:wght@400;700;900&family=Noto+Sans+JP:wght@400;700;900',
    preview_ko: '안녕하세요 / こんにちは',
    preview_ja: 'シニア情報 / 시니어 정보',
    desc: '한일 동시 채널 ✅ 필수 권장',
    recommended: true,
  },
  {
    id: 'noto_serif_both',
    label: 'Noto Serif KR+JP',
    lang: 'both',
    css: '"Noto Serif KR","Noto Serif JP",serif',
    google: 'Noto+Serif+KR:wght@400;700&family=Noto+Serif+JP:wght@400;700',
    preview_ko: '노후 준비 완벽 가이드',
    preview_ja: '老後の準備ガイド',
    desc: '다큐·정보형 고급감',
  },
  {
    id: 'pretendard',
    label: 'Pretendard',
    lang: 'ko',
    css: 'Pretendard,"Noto Sans KR",sans-serif',
    google: 'Noto+Sans+KR:wght@400;700;900',
    preview_ko: '이거 모르면 후회해요!',
    preview_ja: null,
    desc: '한국 채널 기본',
  },
  {
    id: 'nanumsquare',
    label: '나눔스퀘어',
    lang: 'ko',
    css: '"NanumSquare","Noto Sans KR",sans-serif',
    google: 'Nanum+Gothic:wght@700;800',
    preview_ko: '시니어 꿀팁 공개!',
    preview_ja: null,
    desc: '한국 훅·강조 문구',
  },
  {
    id: 'noto_jp',
    label: 'Noto Sans JP',
    lang: 'ja',
    css: '"Noto Sans JP","Hiragino Sans",sans-serif',
    google: 'Noto+Sans+JP:wght@400;700;900',
    preview_ko: null,
    preview_ja: '知らないと損する！',
    desc: '일본 채널 가장 안전',
  },
  {
    id: 'zen_maru',
    label: 'Zen Maru Gothic',
    lang: 'ja',
    css: '"Zen Maru Gothic","Noto Sans JP",sans-serif',
    google: 'Zen+Maru+Gothic:wght@400;700',
    preview_ko: null,
    preview_ja: 'やってみましょう！',
    desc: '일본 시니어 친근감',
  },
  {
    id: 'mplus',
    label: 'M PLUS Rounded',
    lang: 'ja',
    css: '"M PLUS Rounded 1c","Noto Sans JP",sans-serif',
    google: 'M+PLUS+Rounded+1c:wght@700;900',
    preview_ko: null,
    preview_ja: 'シニアの情報',
    desc: '일본 임팩트·훅',
  },
];

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
  const scenes = proj.scenes || [];

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
      ].map(([id,label]) => `
        <button class="s4e-tab ${_s4Tab===id?'on':''}"
          onclick="_s4eSetTab('${id}','${wrapId||'studioS4EditWrap'}')">${label}</button>
      `).join('')}
    </nav>

    <div class="s4e-body">
      ${_s4Tab==='t1' ? _s4eT1Preview(scenes, proj)   : ''}
      ${_s4Tab==='t2' ? _s4eT2Caption(scenes, proj)   : ''}
      ${_s4Tab==='t3' ? _s4eT3Thumb(proj)             : ''}
      ${_s4Tab==='t4' ? _s4eT4Compose()               : ''}
      ${_s4Tab==='t5' ? _s4eT5Audio()                 : ''}
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
   TAB 2 — 자막·폰트
   ════════════════════════════════════════════════ */
function _s4eT2Caption(scenes, proj) {
  const cap    = _s4Edit.caption;
  const font   = S4_FONTS.find(f => f.id === cap.fontId) || S4_FONTS[0];
  const chLang = _s4Edit.channelLang || 'both';

  // 폰트 안전성 체크
  const srtText = scenes.map(s => s.caption || s.desc || '').join(' ');
  const fontCheck = _s4eFontSafeCheck(srtText, cap.fontId);

  return `
  <div class="s4e-section">

    <!-- 채널 언어 -->
    <div class="s4e-block">
      <div class="s4e-label">🌐 채널 언어</div>
      <div class="s4e-seg">
        ${[['ko','🇰🇷 한국어만'],['ja','🇯🇵 일본어만'],['both','🇰🇷🇯🇵 한일동시']].map(([v,l])=>`
          <button class="s4e-seg-btn ${chLang===v?'on':''}"
            onclick="_s4Edit.channelLang='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
        `).join('')}
      </div>
    </div>

    <!-- 폰트 선택 -->
    <div class="s4e-block">
      <div class="s4e-label">🔤 폰트 선택</div>

      ${!fontCheck.ok ? `
        <div class="s4e-font-warn">
          ⚠️ ${fontCheck.msg}
        </div>` : ''}

      ${S4_FONTS.filter(f =>
          chLang === 'both' ? true :
          f.lang === chLang || f.lang === 'both'
        ).map(f => `
        <label class="s4e-font-row ${cap.fontId===f.id?'on':''}">
          <input type="radio" name="s4font" value="${f.id}"
            ${cap.fontId===f.id?'checked':''}
            onchange="_s4Edit.caption.fontId='${f.id}';_studioS4Edit('studioS4EditWrap')">
          <div class="s4e-font-info">
            <div class="s4e-font-name">
              ${f.label}
              ${f.recommended?'<span class="s4e-badge-rec">✅ 권장</span>':''}
              ${f.lang==='both'?'<span class="s4e-badge-safe">한일 안전</span>':''}
            </div>
            <div class="s4e-font-preview" style="font-family:${f.css}">
              ${chLang==='ja' ? (f.preview_ja||f.preview_ko||'') :
                chLang==='ko' ? (f.preview_ko||'') :
                (f.preview_ko||'')+' / '+(f.preview_ja||'')}
            </div>
            <div class="s4e-font-desc">${f.desc}</div>
          </div>
        </label>
      `).join('')}
    </div>

    <!-- 자막 스타일 -->
    <div class="s4e-block">
      <div class="s4e-label">📐 자막 스타일</div>

      <div class="s4e-style-presets">
        ${[
          {id:'shorts', label:'📱 Shorts', pos:'bottom', size:'lg', color:'#fff', bg:true},
          {id:'reels',  label:'📸 Reels',  pos:'center', size:'xl', color:'#fff', bg:false},
          {id:'tiktok', label:'🔴 TikTok', pos:'top',    size:'lg', color:'#FFE033', bg:false},
        ].map(p=>`
          <button class="s4e-preset-btn"
            onclick="_s4eApplyPreset('${p.id}')">
            ${p.label}
          </button>
        `).join('')}
      </div>

      <div class="s4e-style-rows">
        <div class="s4e-style-row">
          <span>크기</span>
          <div class="s4e-seg">
            ${[['sm','작게'],['md','보통'],['lg','크게'],['xl','최대']].map(([v,l])=>`
              <button class="s4e-seg-btn ${cap.size===v?'on':''}"
                onclick="_s4Edit.caption.size='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
            `).join('')}
          </div>
        </div>
        <div class="s4e-style-row">
          <span>위치</span>
          <div class="s4e-seg">
            ${[['top','상단'],['center','중앙'],['bottom','하단']].map(([v,l])=>`
              <button class="s4e-seg-btn ${cap.position===v?'on':''}"
                onclick="_s4Edit.caption.position='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
            `).join('')}
          </div>
        </div>
        <div class="s4e-style-row">
          <span>색상</span>
          <div class="s4e-seg">
            ${[['#ffffff','흰색'],['#FFE033','노랑'],['#000000','검정']].map(([v,l])=>`
              <button class="s4e-seg-btn ${cap.color===v?'on':''}"
                style="${v==='#ffffff'?'background:#f0f0f0;':v==='#000000'?'background:#333;color:#fff;':''}"
                onclick="_s4Edit.caption.color='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
            `).join('')}
          </div>
        </div>
        <div class="s4e-style-row">
          <span>배경</span>
          <div class="s4e-seg">
            <button class="s4e-seg-btn ${cap.bg?'on':''}"
              onclick="_s4Edit.caption.bg=true;_studioS4Edit('studioS4EditWrap')">반투명</button>
            <button class="s4e-seg-btn ${!cap.bg?'on':''}"
              onclick="_s4Edit.caption.bg=false;_studioS4Edit('studioS4EditWrap')">없음</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 자동 처리 설정 -->
    <div class="s4e-block">
      <div class="s4e-label">⚙️ 자동 처리</div>
      <div class="s4e-auto-rows">
        ${[
          ['autoSplit','20자 초과 자동 2줄 분할'],
          ['autoEmphasis','강조 키워드 색상 표시'],
          ['safeZone','안전구역 체크 (Shorts/TikTok)'],
        ].map(([k,l])=>`
          <label class="s4e-auto-row">
            <input type="checkbox" ${_s4Edit.caption[k]?'checked':''}
              onchange="_s4Edit.caption['${k}']=this.checked">
            ${l}
          </label>
        `).join('')}
      </div>
    </div>

    <!-- SRT 생성 -->
    <div class="s4e-block">
      <div class="s4e-label">📄 SRT 자막 파일</div>
      <div class="s4e-srt-btns">
        <button class="s4e-btn-outline" onclick="_s4eGenSrt('ko')">
          🇰🇷 한국어 SRT 생성
        </button>
        ${chLang !== 'ko' ? `
        <button class="s4e-btn-outline" onclick="_s4eGenSrt('ja')">
          🇯🇵 일본어 SRT 생성
        </button>` : ''}
      </div>
      <div class="s4e-srt-preview" id="s4eSrtPreview"></div>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   TAB 3 — 썸네일 텍스트 오버레이
   ════════════════════════════════════════════════ */
function _s4eT3Thumb(proj) {
  const th    = _s4Edit.thumb;
  const imgs  = (proj.scenes || []).map(s => s.imageUrl || s.img).filter(Boolean);
  const imgUrl= proj.thumbUrl || imgs[0] || '';
  const font  = S4_FONTS.find(f => f.id === (_s4Edit.caption.fontId)) || S4_FONTS[0];

  return `
  <div class="s4e-section">
    <div class="s4e-block">
      <div class="s4e-label">
        🖼 썸네일 텍스트 오버레이
        <span class="s4e-label-sub">이미지 생성은 STEP2에서 완료됨</span>
      </div>

      <!-- A/B/C 안 탭 -->
      <div class="s4e-ab-tabs">
        ${['A','B','C'].map(v=>`
          <button class="s4e-ab-tab ${_s4ThumbAlt===v?'on':''}"
            onclick="_s4ThumbAlt='${v}';_studioS4Edit('studioS4EditWrap')">${v}안</button>
        `).join('')}
      </div>

      <!-- 썸네일 미리보기 -->
      <div class="s4e-thumb-preview">
        ${imgUrl
          ? `<img src="${imgUrl}" class="s4e-thumb-img" alt="썸네일">`
          : `<div class="s4e-thumb-empty">🖼 썸네일 이미지 없음<br><small>STEP2 이미지 생성 후 표시</small></div>`}

        <!-- 텍스트 오버레이 -->
        ${th[_s4ThumbAlt]?.text ? `
          <div class="s4e-thumb-text
            ${th[_s4ThumbAlt].pos||'bottom'}
            ${th[_s4ThumbAlt].size||'lg'}"
            style="font-family:${font.css};
                   color:${th[_s4ThumbAlt].color||'#fff'};
                   ${th[_s4ThumbAlt].bg?'background:rgba(0,0,0,0.6);padding:6px 14px;border-radius:8px;':''}">
            ${th[_s4ThumbAlt].text}
          </div>` : ''}
      </div>

      <!-- 텍스트 입력 -->
      <div class="s4e-thumb-inputs">
        <input class="s4e-thumb-input"
          value="${th[_s4ThumbAlt]?.text||''}"
          placeholder="썸네일 텍스트 입력..."
          oninput="_s4Edit.thumb['${_s4ThumbAlt}'].text=this.value;_studioS4Edit('studioS4EditWrap')">

        <div class="s4e-thumb-controls">
          <div class="s4e-style-row">
            <span>크기</span>
            <div class="s4e-seg">
              ${[['md','보통'],['lg','크게'],['xl','최대']].map(([v,l])=>`
                <button class="s4e-seg-btn ${th[_s4ThumbAlt]?.size===v?'on':''}"
                  onclick="_s4Edit.thumb['${_s4ThumbAlt}'].size='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
              `).join('')}
            </div>
          </div>
          <div class="s4e-style-row">
            <span>위치</span>
            <div class="s4e-seg">
              ${[['top','상단'],['center','중앙'],['bottom','하단']].map(([v,l])=>`
                <button class="s4e-seg-btn ${th[_s4ThumbAlt]?.pos===v?'on':''}"
                  onclick="_s4Edit.thumb['${_s4ThumbAlt}'].pos='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
              `).join('')}
            </div>
          </div>
          <div class="s4e-style-row">
            <span>색상</span>
            <div class="s4e-seg">
              ${[['#ffffff','흰'],['#FFE033','노랑'],['#FF4444','빨강'],['#000000','검정']].map(([v,l])=>`
                <button class="s4e-seg-btn ${th[_s4ThumbAlt]?.color===v?'on':''}"
                  style="background:${v};color:${v==='#FFE033'||v==='#ffffff'?'#333':'#fff'}"
                  onclick="_s4Edit.thumb['${_s4ThumbAlt}'].color='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
              `).join('')}
            </div>
          </div>
          <div class="s4e-style-row">
            <span>배경</span>
            <div class="s4e-seg">
              <button class="s4e-seg-btn ${th[_s4ThumbAlt]?.bg?'on':''}"
                onclick="_s4Edit.thumb['${_s4ThumbAlt}'].bg=true;_studioS4Edit('studioS4EditWrap')">반투명</button>
              <button class="s4e-seg-btn ${!th[_s4ThumbAlt]?.bg?'on':''}"
                onclick="_s4Edit.thumb['${_s4ThumbAlt}'].bg=false;_studioS4Edit('studioS4EditWrap')">없음</button>
            </div>
          </div>
        </div>
      </div>

      <!-- AI 제목 3안 자동 채우기 -->
      <button class="s4e-btn-outline" onclick="_s4eAutoThumbText(${JSON.stringify(proj).replace(/"/g,"'")})">
        ✨ AI 제목 3안 자동 입력
      </button>

      <!-- PNG 다운로드 -->
      <button class="s4e-btn-primary" onclick="_s4eDownloadThumb()">
        📥 PNG 다운로드
      </button>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   TAB 4 — 영상 구성
   ════════════════════════════════════════════════ */
function _s4eT4Compose() {
  const c = _s4Edit.compose;

  return `
  <div class="s4e-section">

    <!-- 템플릿 -->
    <div class="s4e-block">
      <div class="s4e-label">🎬 영상 템플릿</div>
      <div class="s4e-template-grid">
        ${S4_TEMPLATES.map(t=>`
          <button class="s4e-template-btn ${c.template===t.id?'on':''}"
            onclick="_s4Edit.compose.template='${t.id}';_studioS4Edit('studioS4EditWrap')">
            <div class="s4e-tpl-label">${t.label}</div>
            <div class="s4e-tpl-desc">${t.desc}</div>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- 전환 효과 -->
    <div class="s4e-block">
      <div class="s4e-label">✨ 씬 전환 효과</div>
      <div class="s4e-chip-row">
        ${S4_TRANSITIONS.map(t=>`
          <button class="s4e-chip ${c.transition===t.id?'on':''}"
            onclick="_s4Edit.compose.transition='${t.id}';">${t.label}</button>
        `).join('')}
      </div>
    </div>

    <!-- 이미지 모션 -->
    <div class="s4e-block">
      <div class="s4e-label">🎥 이미지 모션</div>
      <div class="s4e-chip-row">
        ${S4_MOTIONS.map(m=>`
          <button class="s4e-chip ${c.motion===m.id?'on':''}"
            onclick="_s4Edit.compose.motion='${m.id}';">${m.label}</button>
        `).join('')}
      </div>
    </div>

    <!-- 필터 -->
    <div class="s4e-block">
      <div class="s4e-label">🎨 필터 / 색보정</div>
      <div class="s4e-chip-row">
        ${S4_FILTERS.map(f=>`
          <button class="s4e-chip ${c.filter===f.id?'on':''}"
            onclick="_s4Edit.compose.filter='${f.id}';">${f.label}</button>
        `).join('')}
      </div>
    </div>

    <!-- 브랜딩 -->
    <div class="s4e-block">
      <div class="s4e-label">🏷 오프닝·클로징·브랜딩</div>
      <div class="s4e-brand-rows">
        <label class="s4e-auto-row">
          <input type="checkbox" ${c.openingAnim?'checked':''}
            onchange="_s4Edit.compose.openingAnim=this.checked">
          오프닝 애니메이션
        </label>
        <label class="s4e-auto-row">
          <input type="checkbox" ${c.closingAnim?'checked':''}
            onchange="_s4Edit.compose.closingAnim=this.checked">
          클로징 애니메이션 + CTA (구독·좋아요)
        </label>
        <label class="s4e-auto-row">
          <input type="checkbox" ${c.endCard?'checked':''}
            onchange="_s4Edit.compose.endCard=this.checked">
          엔딩 카드 (다음 영상 예고)
        </label>
      </div>
      <div class="s4e-brand-inputs">
        <div class="s4e-inp-row">
          <label>로고 URL</label>
          <input class="s4e-inp" value="${c.logoUrl||''}" placeholder="https://..."
            oninput="_s4Edit.compose.logoUrl=this.value">
        </div>
        <div class="s4e-inp-row">
          <label>워터마크</label>
          <input class="s4e-inp" value="${c.watermark||''}" placeholder="채널명 또는 @handle"
            oninput="_s4Edit.compose.watermark=this.value">
        </div>
        <div class="s4e-inp-row">
          <label>채널 컬러</label>
          <input type="color" value="${c.channelColor||'#ef6fab'}"
            oninput="_s4Edit.compose.channelColor=this.value">
        </div>
      </div>
    </div>

    <!-- 훅 자동 강화 -->
    <div class="s4e-block">
      <div class="s4e-label">⚡ 훅 자동 강화</div>
      <button class="s4e-btn-outline" onclick="_s4eHookBoost()">
        첫 씬 텍스트 크고 굵게 자동 적용 (3초 훅 최적화)
      </button>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   TAB 5 — BGM·음향 (설정값만 저장)
   ════════════════════════════════════════════════ */
function _s4eT5Audio() {
  const a = _s4Edit.audio;

  return `
  <div class="s4e-section">
    <div class="s4e-block">
      <div class="s4e-label">🎵 BGM 선택</div>
      <div class="s4e-bgm-list">
        ${S4_BGM_LIST.map(b=>`
          <label class="s4e-bgm-row ${a.bgm===b.id?'on':''}">
            <input type="radio" name="s4bgm" value="${b.id}"
              ${a.bgm===b.id?'checked':''}
              onchange="_s4Edit.audio.bgm='${b.id}'">
            <div>
              <div class="s4e-bgm-label">${b.label}</div>
              <div class="s4e-bgm-desc">${b.desc}</div>
            </div>
          </label>
        `).join('')}
      </div>
    </div>

    <div class="s4e-block">
      <div class="s4e-label">🔊 볼륨 설정</div>
      <div class="s4e-vol-rows">
        <div class="s4e-vol-row">
          <span>BGM 볼륨</span>
          <input type="range" min="0" max="100" value="${a.bgmVol}"
            oninput="_s4Edit.audio.bgmVol=this.value;
              document.getElementById('s4eBgmVol').textContent=this.value+'%'">
          <span id="s4eBgmVol">${a.bgmVol}%</span>
        </div>
        <div class="s4e-vol-row">
          <span>음성 볼륨</span>
          <input type="range" min="0" max="100" value="${a.voiceVol}"
            oninput="_s4Edit.audio.voiceVol=this.value;
              document.getElementById('s4eVoiceVol').textContent=this.value+'%'">
          <span id="s4eVoiceVol">${a.voiceVol}%</span>
        </div>
      </div>
    </div>

    <div class="s4e-block">
      <div class="s4e-label">🎚 효과음 스타일</div>
      <div class="s4e-seg">
        ${[['none','없음'],['calm','잔잔'],['impact','임팩트']].map(([v,l])=>`
          <button class="s4e-seg-btn ${a.sfx===v?'on':''}"
            onclick="_s4Edit.audio.sfx='${v}'">${l}</button>
        `).join('')}
      </div>
    </div>

    <div class="s4e-block">
      <div class="s4e-label">🔁 페이드 설정</div>
      <div class="s4e-auto-rows">
        <label class="s4e-auto-row">
          <input type="checkbox" ${a.fadeIn?'checked':''}
            onchange="_s4Edit.audio.fadeIn=this.checked">
          인트로 페이드 인
        </label>
        <label class="s4e-auto-row">
          <input type="checkbox" ${a.fadeOut?'checked':''}
            onchange="_s4Edit.audio.fadeOut=this.checked">
          아웃트로 페이드 아웃
        </label>
      </div>
    </div>

    <div class="s4e-audio-hint">
      💡 설정값은 <code>STUDIO.project.edit.audio</code>에 저장됩니다.<br>
      실제 오디오 믹싱은 렌더링 단계에서 Creatomate 또는 FFmpeg.wasm으로 처리됩니다.
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

function _s4eFontSafeCheck(text, fontId) {
  const font = S4_FONTS.find(f => f.id === fontId);
  if (!font) return { ok: true };
  const hasKo = /[\uAC00-\uD7A3]/.test(text);
  const hasJa = /[\u3040-\u30FF\u4E00-\u9FAF]/.test(text);
  if (font.lang === 'ko' && hasJa)
    return { ok: false, msg: '한국 폰트에 일본어 감지 → Noto Sans KR+JP 권장' };
  if (font.lang === 'ja' && hasKo)
    return { ok: false, msg: '일본 폰트에 한글 감지 → Noto Sans KR+JP 권장' };
  return { ok: true };
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

function _s4eGenSrt(lang) {
  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const scenes = proj.scenes || [];
  const dur    = _s4eSceneDuration(proj);
  let srt = '';
  scenes.forEach((s, i) => {
    const start = i * dur;
    const end   = (i + 1) * dur;
    const text  = lang === 'ja'
      ? (s.captionJa || s.descJa || s.caption || s.desc || '')
      : (s.caption || s.desc || s.label || '');
    srt += `${i+1}\n`;
    srt += `${_s4eSrtTime(start)} --> ${_s4eSrtTime(end)}\n`;
    srt += `${text}\n\n`;
  });

  const el = document.getElementById('s4eSrtPreview');
  if (el) el.textContent = srt.slice(0, 300) + '...';

  const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `subtitle_${lang}.srt`;
  a.click();
  URL.revokeObjectURL(url);
}

function _s4eSrtTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},000`;
}

function _s4eDownloadThumb() {
  const canvas = document.createElement('canvas');
  canvas.width  = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  const th  = _s4Edit.thumb[_s4ThumbAlt];
  const font = S4_FONTS.find(f => f.id === _s4Edit.caption.fontId) || S4_FONTS[0];

  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const imgs   = (proj.scenes || []).map(s => s.imageUrl || s.img).filter(Boolean);
  const imgUrl = proj.thumbUrl || imgs[0] || '';

  const draw = () => {
    if (th?.bg) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    }
    if (th?.text) {
      ctx.font = `bold ${th.size==='xl'?72:th.size==='lg'?56:40}px ${font.css}`;
      ctx.fillStyle = th.color || '#fff';
      ctx.textAlign = 'center';
      const y = th.pos==='top' ? 80 : th.pos==='center' ? canvas.height/2 : canvas.height - 40;
      ctx.fillText(th.text, canvas.width/2, y);
    }
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href    = url;
      a.download= `thumbnail_${_s4ThumbAlt}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  if (imgUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); draw(); };
    img.onerror = draw;
    img.src = imgUrl;
  } else {
    ctx.fillStyle = '#f1dce7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    draw();
  }
}

function _s4eAutoThumbText(proj) {
  const script = proj.scriptText || proj.script || '';
  const words  = script.slice(0, 100);
  _s4Edit.thumb.A.text = `이거 모르면 후회해요`;
  _s4Edit.thumb.B.text = words.slice(0, 20) + '...';
  _s4Edit.thumb.C.text = `${words.slice(0, 15)} 완벽 정리`;
  _studioS4Edit('studioS4EditWrap');
}

function _s4eHookBoost() {
  _s4Edit.caption.size = 'xl';
  _s4Edit.caption.position = 'center';
  _s4Edit.caption.color = '#FFE033';
  _s4Edit.caption.bg = true;
  _studioS4Edit('studioS4EditWrap');
  alert('⚡ 훅 강화 적용!\n첫 씬에 최대 크기·노란색·중앙 자막이 설정됐어요.');
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
.s4e-font-row{display:flex;align-items:flex-start;gap:10px;padding:10px;
  border:1.5px solid #f1dce7;border-radius:12px;margin-bottom:6px;cursor:pointer;transition:.12s}
.s4e-font-row.on{border-color:#9181ff;background:#ede9ff}
.s4e-font-row input{flex-shrink:0;margin-top:3px}
.s4e-font-name{font-size:13px;font-weight:800;margin-bottom:3px;display:flex;align-items:center;gap:6px}
.s4e-font-preview{font-size:14px;color:#3a3038;margin-bottom:2px;line-height:1.5}
.s4e-font-desc{font-size:11px;color:#9b8a93}
.s4e-badge-rec{padding:2px 8px;background:#effbf7;color:#1a7a5a;border-radius:20px;font-size:10px}
.s4e-badge-safe{padding:2px 8px;background:#ede9ff;color:#5b4ecf;border-radius:20px;font-size:10px}
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

/* 영상 구성 */
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
