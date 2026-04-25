/* ================================================
   engines/script/js/script-music.js
   노래/음악 카테고리 강화

   서브탭:
   1. 추억 노래 대본
   2. 노래 스토리 콘텐츠
   3. 엔카·J-POP 특화
   4. 커버곡 소개 대본
   5. 음악 예능 대본

   공통: 저작권 안내 / 시니어 친화 / 한일 동시
   연동: 자동숏츠 postMessage / 미디어 엔진
   ================================================ */

/* ── 한국 시대 데이터 ── */
const SM_KO_ERAS = [
  { id:'ko_6070', label:'1960~70년대', desc:'트로트 황금기', emoji:'🎺' },
  { id:'ko_80',   label:'1980년대',   desc:'추억의 팝/발라드', emoji:'🎸' },
  { id:'ko_90',   label:'1990년대',   desc:'댄스/발라드 전성기', emoji:'💿' },
  { id:'ko_2000', label:'2000년대',   desc:'아이돌 시대', emoji:'⭐' },
];

/* ── 일본 시대 데이터 ── */
const SM_JA_ERAS = [
  { id:'ja_s3040', label:'昭和30~40年代', desc:'쇼와 30~40년대', emoji:'🎼' },
  { id:'ja_s5060', label:'昭和50~60年代', desc:'쇼와 50~60년대', emoji:'🎵' },
  { id:'ja_h1',    label:'平成初期',       desc:'헤이세이 90년대', emoji:'🌸' },
  { id:'ja_h2',    label:'平成中期',       desc:'2000년대', emoji:'🌟' },
];

/* ── 스토리 유형 ── */
const SM_STORY_TYPES = [
  { id:'birth',   ico:'🎵', label:'탄생 비화',    desc:'"이 노래는 이렇게 만들어졌어요"' },
  { id:'love',    ico:'💔', label:'사랑 이야기',   desc:'"숨겨진 러브스토리"' },
  { id:'hit',     ico:'🏆', label:'히트 비결',     desc:'"왜 이 노래가 사랑받았나"' },
  { id:'compare', ico:'🌏', label:'한일 비교',     desc:'"한국과 일본에서 다르게 사랑받은"' },
  { id:'sad',     ico:'😢', label:'슬픈 사연',     desc:'"눈물 없이 들을 수 없는"' },
  { id:'cover',   ico:'🔄', label:'커버/리메이크', desc:'"원곡 vs 리메이크 비교"' },
];

/* ── 엔카 카테고리 ── */
const SM_ENKA_CATS = [
  { id:'enka',    ico:'🎤', label:'演歌 명곡',      desc:'클래식 엔카' },
  { id:'showa',   ico:'🌸', label:'昭和ポップス',   desc:'쇼와 팝스' },
  { id:'kayo',    ico:'🎵', label:'歌謡曲',          desc:'일본 가요 황금기' },
  { id:'jpop',    ico:'🌟', label:'J-POP 추억',     desc:'90년대~2000년대' },
  { id:'exchange',ico:'🇰🇷🇯🇵',label:'한일 교류 노래', desc:'양국에서 사랑받은' },
];

/* ── 커버 유형 ── */
const SM_COVER_TYPES = [
  { id:'senior',   ico:'🎤', label:'할머니/할아버지 커버', desc:'"90세 할머니가 부른 최신곡"' },
  { id:'child',    ico:'👶', label:'어린이 커버',          desc:'"아이가 부른 트로트"' },
  { id:'foreign',  ico:'🌏', label:'외국인 커버',          desc:'"일본인이 부른 한국 노래"' },
  { id:'genre',    ico:'🎸', label:'장르 변환',            desc:'"트로트를 재즈로"' },
  { id:'duet',     ico:'💑', label:'듀엣 커버',            desc:'"부부가 함께 부른"' },
];

/* ── 예능 포맷 ── */
const SM_SHOW_FORMATS = [
  { id:'quiz',     ico:'🎯', label:'음악 퀴즈쇼',    desc:'"이 노래 제목 맞히면 레전드"' },
  { id:'ranking',  ico:'🏆', label:'레전드 랭킹',     desc:'"역대 최고 명곡 TOP10"' },
  { id:'battle',   ico:'🎭', label:'노래 배틀',       desc:'"한국 트로트 vs 일본 엔카"' },
  { id:'tv',       ico:'📺', label:'가요무대 재현',   desc:'"70년대 가요무대"' },
  { id:'challenge',ico:'🎪', label:'노래방 챌린지',   desc:'"이 노래 따라 부르기"' },
];

/* ── 전역 상태 ── */
let _smSubTab   = 'memory';  // memory|story|enka|cover|show
let _smKoEra    = 'ko_90';
let _smJaEra    = 'ja_s5060';
let _smLang     = 'both';
let _smLength   = '5min';
let _smResult   = null;
let _smLoading  = false;

/* ════════════════════════════════════════════════
   메인 렌더
   ════════════════════════════════════════════════ */
function smRenderMusicTab(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
  <div class="sm-wrap">

    <!-- 저작권 안내 -->
    <div class="sm-copyright">
      ⚖️ 실제 노래 가사는 저작권이 있어요.
      소개·이야기 형태로만 활용하세요.
    </div>

    <!-- 서브탭 -->
    <div class="sm-subtabs">
      ${[
        ['memory','🎵 추억 노래 대본'],
        ['story', '📖 노래 스토리'],
        ['enka',  '🎤 엔카·J-POP'],
        ['cover', '🎬 커버곡 소개'],
        ['show',  '🎪 음악 예능'],
      ].map(([id,label])=>`
        <button class="sm-subtab ${_smSubTab===id?'on':''}"
          onclick="_smSetSubTab('${id}','${containerId}')">
          ${label}
        </button>
      `).join('')}
    </div>

    <!-- 공통 설정 -->
    <div class="sm-common-settings">
      <div class="sm-setting-row">
        <span>언어</span>
        <div class="sm-seg">
          ${[['ko','🇰🇷 한국어'],['ja','🇯🇵 일본어'],['both','🇰🇷🇯🇵 동시']].map(([v,l])=>`
            <button class="sm-seg-btn ${_smLang===v?'on':''}"
              onclick="_smLang='${v}'">
              ${l}
            </button>`).join('')}
        </div>
      </div>
      <div class="sm-setting-row">
        <span>길이</span>
        <div class="sm-seg">
          ${[['shorts','숏츠 60초'],['5min','5분'],['long','10분+']].map(([v,l])=>`
            <button class="sm-seg-btn ${_smLength===v?'on':''}"
              onclick="_smLength='${v}'">
              ${l}
            </button>`).join('')}
        </div>
      </div>
    </div>

    <!-- 탭 콘텐츠 -->
    <div class="sm-content">
      ${_smSubTab==='memory'  ? smRenderMemory()  : ''}
      ${_smSubTab==='story'   ? smRenderStory()   : ''}
      ${_smSubTab==='enka'    ? smRenderEnka()    : ''}
      ${_smSubTab==='cover'   ? smRenderCover()   : ''}
      ${_smSubTab==='show'    ? smRenderShow()    : ''}
    </div>

    <!-- 결과 -->
    ${_smResult ? smRenderResult(containerId) : ''}

  </div>`;

  smInjectCSS();
}

/* ── 서브탭1: 추억 노래 대본 ── */
function smRenderMemory() {
  return `
  <div class="sm-section">
    <div class="sm-section-title">🎵 추억 노래 대본</div>
    <div class="sm-desc">그 시절 노래로 감동 콘텐츠 만들기</div>

    <div class="sm-subsection">
      <div class="sm-sub-label">🇰🇷 한국 시대</div>
      <div class="sm-era-grid">
        ${SM_KO_ERAS.map(e=>`
          <button class="sm-era-btn ${_smKoEra===e.id?'on':''}"
            onclick="_smKoEra='${e.id}'">
            <span>${e.emoji}</span>
            <div class="sm-era-label">${e.label}</div>
            <div class="sm-era-desc">${e.desc}</div>
          </button>`).join('')}
      </div>
    </div>

    <div class="sm-subsection">
      <div class="sm-sub-label">🇯🇵 일본 시대</div>
      <div class="sm-era-grid">
        ${SM_JA_ERAS.map(e=>`
          <button class="sm-era-btn ${_smJaEra===e.id?'on':''}"
            onclick="_smJaEra='${e.id}'">
            <span>${e.emoji}</span>
            <div class="sm-era-label">${e.label}</div>
            <div class="sm-era-desc">${e.desc}</div>
          </button>`).join('')}
      </div>
    </div>

    <div class="sm-input-group">
      <label>특정 노래명 (선택)</label>
      <input class="sm-input" id="smSongName" placeholder="예: 고향의 봄 / 北国の春">
    </div>

    <div class="sm-content-types">
      <div class="sm-sub-label">콘텐츠 유형</div>
      <div class="sm-type-list" id="smMemoryType">
        ${['그 시절 명곡 TOP10 소개 대본','세대공감 음악 이야기 대본',
           '노래로 돌아보는 그때 그시절','부모님이 좋아하던 노래 특집',
           '할머니할아버지 추억의 노래방'].map((t,i)=>`
          <label class="sm-type-row">
            <input type="radio" name="smMemType" value="${i}" ${i===0?'checked':''}>
            ${t}
          </label>`).join('')}
      </div>
    </div>

    ${smRenderGenBtn('memory')}
  </div>`;
}

/* ── 서브탭2: 노래 스토리 ── */
function smRenderStory() {
  return `
  <div class="sm-section">
    <div class="sm-section-title">📖 노래 스토리 콘텐츠</div>
    <div class="sm-desc">"이 노래가 만들어진 사연이 있어요"</div>

    <div class="sm-story-types">
      ${SM_STORY_TYPES.map((t,i)=>`
        <label class="sm-story-card">
          <input type="radio" name="smStoryType" value="${t.id}" ${i===0?'checked':''}>
          <div>
            <div class="sm-story-label">${t.ico} ${t.label}</div>
            <div class="sm-story-desc">${t.desc}</div>
          </div>
        </label>`).join('')}
    </div>

    <div class="sm-input-group">
      <label>노래명 입력</label>
      <input class="sm-input" id="smStorySong" placeholder="예: 고향의 봄 / 北国の春">
    </div>

    <div class="sm-senior-options">
      <div class="sm-sub-label">☑ 시니어 특화 자동 포함</div>
      <div class="sm-check-list">
        <label><input type="checkbox" checked> 쉬운 단어 사용</label>
        <label><input type="checkbox" checked> 추억 자극 멘트</label>
        <label><input type="checkbox" checked> 따뜻한 마무리</label>
      </div>
    </div>

    ${smRenderGenBtn('story')}
  </div>`;
}

/* ── 서브탭3: 엔카·J-POP ── */
function smRenderEnka() {
  return `
  <div class="sm-section">
    <div class="sm-section-title">🎤 엔카·J-POP 특화</div>
    <div class="sm-desc">일본 시니어 채널 필수 콘텐츠!</div>

    <div class="sm-enka-cats">
      ${SM_ENKA_CATS.map((c,i)=>`
        <label class="sm-enka-card">
          <input type="radio" name="smEnkaCat" value="${c.id}" ${i===0?'checked':''}>
          <div>
            <div class="sm-enka-label">${c.ico} ${c.label}</div>
            <div class="sm-enka-desc">${c.desc}</div>
          </div>
        </label>`).join('')}
    </div>

    <div class="sm-input-group">
      <label>노래명 또는 가수명</label>
      <input class="sm-input" id="smEnkaSong"
        placeholder="예: 北国の春 / 津軽海峡冬景色 / 美空ひばり">
    </div>

    <div class="sm-enka-types">
      <div class="sm-sub-label">콘텐츠 유형</div>
      <div class="sm-type-list">
        ${['노래 소개 대본 (5분)','가수 스토리 대본',
           '엔카의 매력 소개','한국인이 좋아하는 엔카 특집',
           '일본인이 좋아하는 한국 트로트'].map((t,i)=>`
          <label class="sm-type-row">
            <input type="radio" name="smEnkaType" value="${i}" ${i===0?'checked':''}>
            ${t}
          </label>`).join('')}
      </div>
    </div>

    <div class="sm-enka-note">
      💡 일본 경어체 자동 적용 · 望郷/離別 테마 포함 · 후리가나 옵션
    </div>

    ${smRenderGenBtn('enka')}
  </div>`;
}

/* ── 서브탭4: 커버곡 소개 ── */
function smRenderCover() {
  return `
  <div class="sm-section">
    <div class="sm-section-title">🎬 커버곡 소개 대본</div>
    <div class="sm-desc">"이 노래를 커버한 감동 영상 소개"</div>

    <div class="sm-cover-types">
      ${SM_COVER_TYPES.map((t,i)=>`
        <label class="sm-cover-card">
          <input type="radio" name="smCoverType" value="${t.id}" ${i===0?'checked':''}>
          <div>
            <div class="sm-cover-label">${t.ico} ${t.label}</div>
            <div class="sm-cover-desc">${t.desc}</div>
          </div>
        </label>`).join('')}
    </div>

    <div class="sm-input-group">
      <label>원곡명</label>
      <input class="sm-input" id="smCoverSong" placeholder="예: 동백아가씨">
    </div>
    <div class="sm-input-group">
      <label>커버 특징</label>
      <input class="sm-input" id="smCoverFeature"
        placeholder="예: 90세 할머니가 BTS 노래 커버">
    </div>

    ${smRenderGenBtn('cover')}
  </div>`;
}

/* ── 서브탭5: 음악 예능 ── */
function smRenderShow() {
  return `
  <div class="sm-section">
    <div class="sm-section-title">🎪 음악 예능 대본</div>
    <div class="sm-desc">음악 관련 예능형 콘텐츠</div>

    <div class="sm-show-formats">
      ${SM_SHOW_FORMATS.map((f,i)=>`
        <label class="sm-show-card">
          <input type="radio" name="smShowFormat" value="${f.id}" ${i===0?'checked':''}>
          <div>
            <div class="sm-show-label">${f.ico} ${f.label}</div>
            <div class="sm-show-desc">${f.desc}</div>
          </div>
        </label>`).join('')}
    </div>

    <div class="sm-input-group">
      <label>주제/노래명 (선택)</label>
      <input class="sm-input" id="smShowTopic"
        placeholder="예: 1990년대 최고 히트곡 / 트로트 vs 엔카">
    </div>

    <div class="sm-tikitaka-note">
      💡 티키타카 연동: 이 포맷을 캐릭터 티키타카로도 만들 수 있어요
    </div>

    ${smRenderGenBtn('show')}
  </div>`;
}

/* ── 생성 버튼 ── */
function smRenderGenBtn(type) {
  return `
  <button class="sm-gen-btn ${_smLoading?'loading':''}"
    onclick="smGenerate('${type}')"
    ${_smLoading?'disabled':''}>
    ${_smLoading?'⏳ 대본 생성 중...':'✨ AI 대본 생성'}
  </button>`;
}

/* ── 결과 렌더 ── */
function smRenderResult(containerId) {
  const r = _smResult;
  if (!r) return '';

  return `
  <div class="sm-result">
    <div class="sm-result-hd">
      <span class="sm-result-title">✅ 생성된 대본</span>
      <div class="sm-result-actions">
        ${r.ko ? `<button class="sm-mini-btn" onclick="smCopy('ko')">🇰🇷 한국어 복사</button>` : ''}
        ${r.ja ? `<button class="sm-mini-btn" onclick="smCopy('ja')">🇯🇵 일본어 복사</button>` : ''}
        <button class="sm-mini-btn danger" onclick="_smResult=null;smRenderMusicTab('${containerId}')">
          다시 생성
        </button>
      </div>
    </div>

    <div class="sm-result-tabs">
      ${r.ko ? `<button class="sm-result-tab on" onclick="smShowTab(this,'ko')">🇰🇷 한국어</button>` : ''}
      ${r.ja ? `<button class="sm-result-tab" onclick="smShowTab(this,'ja')">🇯🇵 일본어</button>` : ''}
    </div>

    ${r.ko ? `<textarea class="sm-result-text" id="smResultKo">${r.ko}</textarea>` : ''}
    ${r.ja ? `<textarea class="sm-result-text" id="smResultJa" style="display:none">${r.ja}</textarea>` : ''}

    <!-- 연동 버튼 -->
    <div class="sm-connect-btns">
      <button class="sm-connect-btn shorts"
        onclick="smSendToShorts()">
        🎬 이 대본으로 숏츠 만들기
      </button>
      <button class="sm-connect-btn media"
        onclick="smSendToMedia()">
        🎵 음성/영상 패키지 만들기
      </button>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   AI 대본 생성
   ════════════════════════════════════════════════ */
async function smGenerate(type) {
  _smLoading = true;
  _smResult  = null;
  const el   = document.querySelector('.sm-gen-btn');
  if (el) { el.textContent = '⏳ 생성 중...'; el.disabled = true; }

  try {
    const { sys, user } = smBuildPrompt(type);
    let ko = '', ja = '';

    if (typeof callAI === 'function') {
      const raw = await callAI(sys, user);
      const parts = raw.split(/={3,}\s*일본어\s*={3,}/i);
      ko = parts[0]?.trim() || raw;
      ja = parts[1]?.trim() || '';
    } else {
      ko = smFallback(type);
      ja = _smLang !== 'ko' ? smFallbackJa(type) : '';
    }

    _smResult = { ko, ja };

  } catch(e) {
    alert('대본 생성 오류: ' + e.message);
  }

  _smLoading = false;
  const cont = document.querySelector('.sm-wrap')?.closest('[id]')?.id || 'smMusicContainer';
  smRenderMusicTab(cont);
}

function smBuildPrompt(type) {
  const lenMap = { shorts:'60초 분량', '5min':'5분 분량', long:'10분 이상 분량' };
  const lenStr = lenMap[_smLength] || '5분 분량';
  const langStr = _smLang==='both' ? '한국어+일본어 동시' : _smLang==='ja' ? '일본어' : '한국어';
  const needJa  = _smLang !== 'ko';

  const sys = `당신은 한국·일본 시니어 채널 전문 음악 콘텐츠 작가입니다.
시니어 친화 원칙: 쉬운 단어, 천천히 설명, 추억 자극, 따뜻한 말투.
저작권: 실제 가사는 인용하지 말고 소개·이야기 형태로만 작성.
${needJa?'한국어 대본 작성 후 "=== 일본어 ===" 구분자 후 일본어 번역본도 작성.':''}`;

  let user = '';

  if (type === 'memory') {
    const era   = SM_KO_ERAS.find(e=>e.id===_smKoEra)?.label || '1990년대';
    const jaEra = SM_JA_ERAS.find(e=>e.id===_smJaEra)?.label || '昭和50年代';
    const song  = document.getElementById('smSongName')?.value || '';
    user = `${era} 한국 ${jaEra} 일본 추억 노래 대본을 ${lenStr}로 작성해주세요.
${song?`노래명: ${song}`:''}
콘텐츠: 그 시절 명곡 소개, 세대공감, 추억 자극
시청자: 60대 이상 한국·일본 시니어
언어: ${langStr}`;
  }

  else if (type === 'story') {
    const storyType = document.querySelector('input[name="smStoryType"]:checked')?.value || 'birth';
    const song      = document.getElementById('smStorySong')?.value || '';
    const stType    = SM_STORY_TYPES.find(t=>t.id===storyType);
    user = `노래 스토리 대본 작성 (${lenStr}):
스토리 유형: ${stType?.label||'탄생 비화'}
${song?`노래/가수: ${song}`:''}
포함 요소: 탄생 배경, 감동 포인트, 시청자 공감 유도
언어: ${langStr}
시니어 친화: 쉬운 단어, 추억 자극, 따뜻한 마무리`;
  }

  else if (type === 'enka') {
    const cat  = document.querySelector('input[name="smEnkaCat"]:checked')?.value || 'enka';
    const song = document.getElementById('smEnkaSong')?.value || '';
    const enka = SM_ENKA_CATS.find(c=>c.id===cat);
    user = `엔카·J-POP 콘텐츠 대본 작성 (${lenStr}):
카테고리: ${enka?.label||'演歌'}
${song?`노래/가수: ${song}`:''}
특징: 일본 경어체, 望郷/離別 테마, 계절·자연 묘사 풍부
시청자: 60대 이상 일본·한국 시니어
언어: ${langStr}`;
  }

  else if (type === 'cover') {
    const covType = document.querySelector('input[name="smCoverType"]:checked')?.value || 'senior';
    const song    = document.getElementById('smCoverSong')?.value || '';
    const feature = document.getElementById('smCoverFeature')?.value || '';
    const cov     = SM_COVER_TYPES.find(t=>t.id===covType);
    user = `커버곡 소개 대본 작성 (${lenStr}):
커버 유형: ${cov?.label||'시니어 커버'}
원곡: ${song||'(미입력)'}
커버 특징: ${feature||'감동적인 커버'}
포함: 반응형 훅, 감동 포인트, 원곡 비교 멘트
언어: ${langStr}`;
  }

  else if (type === 'show') {
    const fmt   = document.querySelector('input[name="smShowFormat"]:checked')?.value || 'quiz';
    const topic = document.getElementById('smShowTopic')?.value || '';
    const show  = SM_SHOW_FORMATS.find(f=>f.id===fmt);
    user = `음악 예능 대본 작성 (${lenStr}):
포맷: ${show?.label||'음악 퀴즈쇼'}
${topic?`주제: ${topic}`:''}
구성: 도입부 → 본문 → 반전/공개 → 마무리 CTA
언어: ${langStr}`;
  }

  return { sys, user };
}

function smFallback(type) {
  return `[${type} 대본 샘플]\n\n안녕하세요! 오늘은 정말 감동적인 이야기를 들고 왔어요.\n\n(API 키를 설정하면 AI가 자동으로 대본을 생성해드립니다)\n\n👍 구독과 좋아요 부탁드려요!`;
}

function smFallbackJa(type) {
  return `[${type} サンプル]\n\nこんにちは！今日は感動的なお話をお届けします。\n\n(APIキーを設定するとAIが自動で台本を生成します)\n\n👍 チャンネル登録とイイネをお願いします！`;
}

/* ── 연동 버튼 ── */
window.smSendToShorts = function() {
  const r = _smResult;
  if (!r) return;
  const msg = {
    type: 'studio_script_done',
    scriptKo: r.ko || '',
    scriptJa: r.ja || '',
    topic:    document.getElementById('smSongName')?.value ||
              document.getElementById('smStorySong')?.value ||
              document.getElementById('smEnkaSong')?.value || '음악 콘텐츠',
    scenes:   [],
  };
  // 같은 창에 shorts가 있으면 postMessage
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(msg, '*');
  } else {
    // 새 탭으로 열면서 URL에 파라미터 전달
    const url = '../../engines/shorts/index.html?mode=shorts';
    const win = window.open(url, '_blank');
    win?.addEventListener('load', () => win.postMessage(msg, '*'));
  }
  alert('숏츠 스튜디오로 대본을 전송했어요! 숏츠 탭을 확인하세요.');
};

window.smSendToMedia = function() {
  const url = '../../engines/media/index.html';
  window.open(url, '_blank');
};

/* ── 이벤트 ── */
window._smSetSubTab = function(tab, containerId) {
  _smSubTab = tab;
  smRenderMusicTab(containerId);
};

window.smCopy = function(lang) {
  const el = document.getElementById(lang==='ja'?'smResultJa':'smResultKo');
  if (el) navigator.clipboard.writeText(el.value).then(()=>alert('복사됐어요!'));
};

window.smShowTab = function(btn, lang) {
  document.querySelectorAll('.sm-result-tab').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  const ko = document.getElementById('smResultKo');
  const ja = document.getElementById('smResultJa');
  if (ko) ko.style.display = lang==='ko' ? '' : 'none';
  if (ja) ja.style.display = lang==='ja' ? '' : 'none';
};

/* ── CSS ── */
function smInjectCSS() {
  if (document.getElementById('sm-style')) return;
  const st = document.createElement('style');
  st.id = 'sm-style';
  st.textContent = `
.sm-wrap{display:flex;flex-direction:column;gap:10px;padding:12px}
.sm-copyright{background:#fffbe8;border:1px solid #fde68a;border-radius:10px;
  padding:8px 12px;font-size:11.5px;color:#92400e;font-weight:600}
.sm-subtabs{display:flex;gap:4px;flex-wrap:wrap}
.sm-subtab{padding:7px 12px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:11px;font-weight:700;cursor:pointer;transition:.12s;color:#7b7077}
.sm-subtab.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.sm-common-settings{background:#f9f3fb;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px}
.sm-setting-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sm-setting-row>span{font-size:11px;font-weight:700;min-width:32px}
.sm-seg{display:flex;gap:3px;flex-wrap:wrap}
.sm-seg-btn{padding:4px 10px;border:1.5px solid #f1dce7;border-radius:8px;
  background:#fff;font-size:11px;font-weight:700;cursor:pointer;transition:.12s;color:#7b7077}
.sm-seg-btn.on{background:#9181ff;color:#fff;border-color:#9181ff}
.sm-content{background:#fff;border:1.5px solid #f1dce7;border-radius:14px;padding:14px}
.sm-section-title{font-size:14px;font-weight:900;color:#2b2430;margin-bottom:4px}
.sm-desc{font-size:12px;color:#9b8a93;margin-bottom:12px}
.sm-sub-label{font-size:11px;font-weight:800;color:#5a4a56;margin-bottom:6px}
.sm-subsection{margin-bottom:12px}
.sm-era-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
.sm-era-btn{padding:10px;border:1.5px solid #f1dce7;border-radius:10px;
  background:#fff;cursor:pointer;text-align:center;transition:.12s}
.sm-era-btn.on{border-color:#9181ff;background:#ede9ff}
.sm-era-label{font-size:12px;font-weight:800;margin:3px 0}
.sm-era-desc{font-size:10px;color:#9b8a93}
.sm-input-group{margin-bottom:10px}
.sm-input-group label{display:block;font-size:11px;font-weight:700;color:#7b7077;margin-bottom:4px}
.sm-input{width:100%;border:1.5px solid #f1dce7;border-radius:10px;
  padding:9px 12px;font-size:13px;outline:none;box-sizing:border-box}
.sm-input:focus{border-color:#ef6fab}
.sm-type-list{display:flex;flex-direction:column;gap:6px}
.sm-type-row{display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer}
.sm-check-list{display:flex;flex-wrap:wrap;gap:10px}
.sm-check-list label{font-size:12px;cursor:pointer;display:flex;align-items:center;gap:4px}
.sm-story-types,.sm-enka-cats,.sm-cover-types,.sm-show-formats{
  display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
.sm-story-card,.sm-enka-card,.sm-cover-card,.sm-show-card{
  display:flex;align-items:flex-start;gap:8px;padding:8px;
  border:1.5px solid #f1dce7;border-radius:10px;cursor:pointer;transition:.12s}
.sm-story-label,.sm-enka-label,.sm-cover-label,.sm-show-label{
  font-size:12px;font-weight:800;margin-bottom:2px}
.sm-story-desc,.sm-enka-desc,.sm-cover-desc,.sm-show-desc{font-size:11px;color:#9b8a93}
.sm-enka-note,.sm-tikitaka-note{font-size:11px;color:#9b8a93;
  background:#f9f3fb;border-radius:8px;padding:6px 10px;margin-bottom:10px}
.sm-senior-options{background:#f9f3fb;border-radius:10px;padding:10px;margin-bottom:12px}
.sm-content-types{margin-bottom:12px}
.sm-gen-btn{width:100%;padding:14px;border:none;border-radius:12px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-size:14px;font-weight:900;cursor:pointer;margin-top:4px}
.sm-gen-btn.loading{opacity:.6;cursor:not-allowed}
.sm-result{background:#fff;border:2px solid #9181ff;border-radius:14px;padding:14px;margin-top:10px}
.sm-result-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px}
.sm-result-title{font-size:14px;font-weight:800}
.sm-result-actions{display:flex;gap:4px;flex-wrap:wrap}
.sm-mini-btn{padding:4px 10px;border:1.5px solid #9181ff;border-radius:20px;
  background:#fff;color:#9181ff;font-size:11px;font-weight:700;cursor:pointer}
.sm-mini-btn.danger{border-color:#fca5a5;color:#dc2626}
.sm-result-tabs{display:flex;gap:4px;margin-bottom:8px}
.sm-result-tab{padding:5px 12px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:11px;font-weight:700;cursor:pointer;transition:.12s}
.sm-result-tab.on{background:#9181ff;color:#fff;border-color:#9181ff}
.sm-result-text{width:100%;min-height:160px;border:1.5px solid #f1dce7;
  border-radius:10px;padding:10px;font-size:12px;font-family:inherit;
  resize:vertical;box-sizing:border-box;line-height:1.6;margin-bottom:10px}
.sm-connect-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.sm-connect-btn{padding:12px;border:none;border-radius:12px;font-size:13px;
  font-weight:800;cursor:pointer}
.sm-connect-btn.shorts{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff}
.sm-connect-btn.media{background:linear-gradient(135deg,#9181ff,#6b5ecf);color:#fff}
`;
  document.head.appendChild(st);
}

window.smRenderMusicTab = smRenderMusicTab;
window.smGenerate       = smGenerate;
