/* ================================================
   modules/studio/s3-video.js
   ② 이미지·영상 소스 — TAB B: AI 영상 프롬프트
   + TAB C: 직접 업로드

   TAB B: 캐릭터 설정 + 씬별 영상 프롬프트 생성
          자동 API (Runway/Kling/Pika/Luma)
          수동 연동 (InVideo/CapCut/Vrew)
   TAB C: MP4/이미지 직접 업로드
   ================================================ */

/* ── 영상 툴 목록 ── */
const S3V_TOOLS = {
  auto: [
    {
      id: 'runway',
      label: 'Runway ML',
      icon: '⚡',
      desc: 'Gen-3 Alpha · 최고 품질',
      apiKey: 's3v_runway_key',
      url: 'https://runwayml.com',
      promptStyle: 'cinematic',
    },
    {
      id: 'kling',
      label: 'Kling AI',
      icon: '⚡',
      desc: '한국어 지원 · 실사 강점',
      apiKey: 's3v_kling_key',
      url: 'https://klingai.com',
      promptStyle: 'realistic',
    },
    {
      id: 'pika',
      label: 'Pika Labs',
      icon: '⚡',
      desc: '빠른 생성 · 애니 강점',
      apiKey: 's3v_pika_key',
      url: 'https://pika.art',
      promptStyle: 'animated',
    },
    {
      id: 'luma',
      label: 'Luma AI',
      icon: '⚡',
      desc: 'Dream Machine · 자연스러운 움직임',
      apiKey: 's3v_luma_key',
      url: 'https://lumalabs.ai',
      promptStyle: 'natural',
    },
    {
      id: 'heygen',
      label: 'HeyGen',
      icon: '⚡',
      desc: '아바타 영상 · API 있음',
      apiKey: 's3v_heygen_key',
      url: 'https://heygen.com',
      promptStyle: 'avatar',
    },
  ],
  manual: [
    {
      id: 'invideo',
      label: 'InVideo',
      icon: '📋',
      desc: '수동 연동 · AI 영상 편집',
      url: 'https://invideo.io',
      promptStyle: 'invideo',
    },
    {
      id: 'capcut',
      label: 'CapCut AI',
      icon: '📋',
      desc: '수동 연동 · 모바일 최적',
      url: 'https://capcut.com',
      promptStyle: 'short',
    },
    {
      id: 'vrew',
      label: 'Vrew',
      icon: '📋',
      desc: '수동 연동 · 자막 AI 강점',
      url: 'https://vrew.ai',
      promptStyle: 'documentary',
    },
    {
      id: 'did',
      label: 'D-ID',
      icon: '📋',
      desc: '아바타 영상 · 수동 연동',
      url: 'https://www.d-id.com',
      promptStyle: 'avatar',
    },
  ],
};

/* ── 캐릭터 타입 ── */
const S3V_CHAR_TYPES = [
  { id: 'person_ko', label: '실사 인물 (한국)', icon: '🧑' },
  { id: 'person_ja', label: '실사 인물 (일본)', icon: '🧑' },
  { id: 'anime',     label: '애니메이션',       icon: '🎌' },
  { id: 'animal',    label: '동물 캐릭터',       icon: '🐱' },
  { id: '3d',        label: '3D 캐릭터',         icon: '🎮' },
  { id: 'avatar',    label: '아바타',            icon: '👤' },
  { id: 'none',      label: '없음 (풍경·사물)', icon: '🌄' },
];

/* ── 전역 상태 ── */
let _s3vTab     = 'b';    // 'b' | 'c'
let _s3vTool    = 'invideo';
let _s3vChar    = null;   // 저장된 캐릭터 설정
let _s3vUploads = [];     // 업로드된 파일들

/* ════════════════════════════════════════════════
   메인 렌더 (TAB B + C 라우터)
   ════════════════════════════════════════════════ */
function _studioS3Video(wrapId) {
  const wrap = document.getElementById(wrapId || 'studioS3VideoWrap');
  if (!wrap) return;

  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const scenes = proj.scenes || [];

  // 캐릭터 설정 로드
  if (!_s3vChar) {
    const saved = localStorage.getItem('s3v_char');
    _s3vChar = saved ? JSON.parse(saved) : _s3vDefaultChar();
  }

  wrap.innerHTML = `
  <div class="s3v-wrap">
    <div class="s3v-tab-switcher">
      <button class="s3v-main-tab ${_s3vTab==='b'?'on':''}"
        onclick="_s3vSetTab('b','${wrapId||'studioS3VideoWrap'}')">
        🎬 AI 영상 프롬프트
      </button>
      <button class="s3v-main-tab ${_s3vTab==='c'?'on':''}"
        onclick="_s3vSetTab('c','${wrapId||'studioS3VideoWrap'}')">
        📁 직접 업로드
      </button>
    </div>

    <div class="s3v-body">
      ${_s3vTab === 'b' ? _s3vRenderB(scenes, proj) : _s3vRenderC(scenes)}
    </div>
  </div>`;

  _s3vInjectCSS();
}

/* ════════════════════════════════════════════════
   TAB B — AI 영상 프롬프트
   ════════════════════════════════════════════════ */
function _s3vRenderB(scenes, proj) {
  return `
  <div class="s3v-section">

    <!-- B-1. 캐릭터 일관성 설정 -->
    ${_s3vRenderCharBlock()}

    <!-- B-2. 영상 스타일 -->
    ${_s3vRenderStyleBlock()}

    <!-- B-3. 툴 선택 -->
    ${_s3vRenderToolBlock()}

    <!-- B-4. 씬별 프롬프트 -->
    ${scenes.length > 0
      ? _s3vRenderScenePrompts(scenes, proj)
      : _s3vRenderNoScenes()}
  </div>`;
}

/* ── B-1 캐릭터 설정 ── */
function _s3vRenderCharBlock() {
  const c = _s3vChar;
  return `
  <div class="s3v-block">
    <div class="s3v-label">
      👤 채널 고정 캐릭터 설정
      <span class="s3v-label-sub">영상 전체 캐릭터 일관성 유지</span>
    </div>

    <!-- 캐릭터 타입 -->
    <div class="s3v-char-types">
      ${S3V_CHAR_TYPES.map(t => `
        <button class="s3v-char-type-btn ${c.type===t.id?'on':''}"
          onclick="_s3vChar.type='${t.id}';_s3vUpdateCharPrompt();
            document.getElementById('s3vCharDetail').innerHTML=_s3vCharDetail()">
          <span>${t.icon}</span>
          <span>${t.label}</span>
        </button>
      `).join('')}
    </div>

    <!-- 캐릭터 상세 설정 (타입별 동적) -->
    <div id="s3vCharDetail">${_s3vCharDetail()}</div>

    <!-- 생성된 캐릭터 프롬프트 -->
    <div class="s3v-char-prompt-box">
      <div class="s3v-char-prompt-label">🤖 자동 생성된 캐릭터 프롬프트</div>
      <div class="s3v-char-prompt-text" id="s3vCharPromptText">
        ${_s3vBuildCharPrompt()}
      </div>
      <div class="s3v-char-prompt-actions">
        <button class="s3v-mini-copy"
          onclick="_s3vCopy(this, document.getElementById('s3vCharPromptText').textContent)">
          복사
        </button>
        <button class="s3v-mini-btn"
          onclick="localStorage.setItem('s3v_char', JSON.stringify(_s3vChar));
            this.textContent='✅ 저장됨';setTimeout(()=>this.textContent='채널 캐릭터 저장',1500)">
          채널 캐릭터 저장
        </button>
      </div>
    </div>
  </div>`;
}

function _s3vCharDetail() {
  const c = _s3vChar;
  if (c.type === 'none') {
    return `<div class="s3v-char-none">풍경·사물 중심 영상 — 캐릭터 없음</div>`;
  }
  if (c.type === 'anime') {
    return `
    <div class="s3v-char-fields">
      ${_s3vField('성별', 'gender', ['여성', '남성', '중성'], c.gender||'여성')}
      ${_s3vField('스타일', 'animeStyle', ['귀여운(모에)', '성숙한', '소년만화', '소녀만화', '현실적'], c.animeStyle||'귀여운(모에)')}
      ${_s3vTextField('특징 메모', 'charNote', c.charNote||'', '예: 분홍 트윈테일, 교복')}
    </div>`;
  }
  if (c.type === 'animal') {
    return `
    <div class="s3v-char-fields">
      ${_s3vField('동물 종류', 'animalType', ['고양이', '강아지', '토끼', '여우', '곰', '기타'], c.animalType||'고양이')}
      ${_s3vField('스타일', 'animalStyle', ['귀여운 만화풍', '실사풍', '3D'], c.animalStyle||'귀여운 만화풍')}
      ${_s3vTextField('특징 메모', 'charNote', c.charNote||'', '예: 흰 고양이, 파란 리본')}
    </div>`;
  }
  if (c.type === 'avatar' || c.type === '3d') {
    return `
    <div class="s3v-char-fields">
      ${_s3vField('스타일', 'avatarStyle', ['사실적', '카툰', '미니멀', 'VTuber풍'], c.avatarStyle||'사실적')}
      ${_s3vTextField('특징 메모', 'charNote', c.charNote||'', '예: 파란 머리, 헤드셋')}
    </div>`;
  }
  // 실사 인물 (기본)
  const isJa = c.type === 'person_ja';
  return `
  <div class="s3v-char-fields">
    ${_s3vField('성별', 'gender', ['여성', '남성'], c.gender||'여성')}
    ${_s3vField('연령대', 'age', ['20대', '30대', '40대', '50대', '60대', '70대+'], c.age||'60대')}
    ${_s3vField('머리색', 'hairColor',
      isJa ? ['검정', '흰색', '갈색', '회색'] : ['검정', '흰색', '갈색', '회색', '염색'],
      c.hairColor||'흰색')}
    ${_s3vField('헤어스타일', 'hairStyle', ['단발', '긴머리', '파마', '묶음', '짧은', '대머리'], c.hairStyle||'단발')}
    ${_s3vField('체형', 'build', ['보통', '날씬한', '통통한'], c.build||'보통')}
    ${_s3vField('의상 일관성', 'outfitFixed', ['항상 같은 옷', '씬마다 다름'], c.outfitFixed||'항상 같은 옷')}
    ${_s3vTextField('의상 설명', 'outfit', c.outfit||'', isJa ? '예: 밝은 색 카디건, 안경' : '예: 밝은 색 블라우스, 안경')}
    ${_s3vTextField('기타 특징', 'charNote', c.charNote||'', '예: 따뜻한 미소, 안경 착용')}
  </div>`;
}

function _s3vField(label, key, options, current) {
  return `
  <div class="s3v-field-row">
    <span class="s3v-field-label">${label}</span>
    <div class="s3v-seg">
      ${options.map(opt => `
        <button class="s3v-seg-btn ${current===opt?'on':''}"
          onclick="_s3vChar['${key}']='${opt}';
            document.getElementById('s3vCharDetail').innerHTML=_s3vCharDetail();
            document.getElementById('s3vCharPromptText').textContent=_s3vBuildCharPrompt()">
          ${opt}
        </button>
      `).join('')}
    </div>
  </div>`;
}

function _s3vTextField(label, key, value, placeholder) {
  return `
  <div class="s3v-field-row">
    <span class="s3v-field-label">${label}</span>
    <input class="s3v-text-inp" value="${value}" placeholder="${placeholder}"
      oninput="_s3vChar['${key}']=this.value;
        document.getElementById('s3vCharPromptText').textContent=_s3vBuildCharPrompt()">
  </div>`;
}

function _s3vBuildCharPrompt() {
  const c = _s3vChar;
  if (!c || c.type === 'none') return 'No character (landscape/object focused)';

  if (c.type === 'anime') {
    return `${c.animeStyle||'cute'} anime character, ${c.gender||'female'}, ${c.charNote||''}`.trim();
  }
  if (c.type === 'animal') {
    return `${c.animalStyle||'cute cartoon'} ${c.animalType||'cat'}, ${c.charNote||''}`.trim();
  }
  if (c.type === 'avatar' || c.type === '3d') {
    return `${c.avatarStyle||'realistic'} ${c.type} avatar, ${c.charNote||''}`.trim();
  }

  const nat  = c.type === 'person_ja' ? 'Japanese' : 'Korean';
  const age  = c.age  || '60s';
  const gen  = c.gender === '남성' ? 'man' : 'woman';
  const hair = `${c.hairColor||'white'} ${c.hairStyle||'short'} hair`;
  const out  = c.outfitFixed === '항상 같은 옷' && c.outfit ? `, wearing ${c.outfit}` : '';
  const note = c.charNote ? `, ${c.charNote}` : '';
  return `${age} ${nat} ${gen}, ${hair}${out}${note}, consistent appearance throughout video`;
}

/* ── B-2 영상 스타일 ── */
function _s3vRenderStyleBlock() {
  const s = _s3vChar.videoStyle || {};
  return `
  <div class="s3v-block">
    <div class="s3v-label">🎥 영상 스타일</div>
    <div class="s3v-style-grid">
      <div class="s3v-field-row">
        <span class="s3v-field-label">분위기</span>
        <div class="s3v-seg">
          ${['따뜻한 자연광','스튜디오','야외','드라마틱','미니멀'].map(v=>`
            <button class="s3v-seg-btn ${s.mood===v?'on':''}"
              onclick="_s3vChar.videoStyle={..._s3vChar.videoStyle||{},mood:'${v}'}">
              ${v}
            </button>`).join('')}
        </div>
      </div>
      <div class="s3v-field-row">
        <span class="s3v-field-label">카메라</span>
        <div class="s3v-seg">
          ${['고정','줌인','패닝','핸드헬드'].map(v=>`
            <button class="s3v-seg-btn ${s.camera===v?'on':''}"
              onclick="_s3vChar.videoStyle={..._s3vChar.videoStyle||{},camera:'${v}'}">
              ${v}
            </button>`).join('')}
        </div>
      </div>
      <div class="s3v-field-row">
        <span class="s3v-field-label">화면비율</span>
        <div class="s3v-seg">
          ${['9:16','16:9','1:1'].map(v=>`
            <button class="s3v-seg-btn ${s.ratio===v?'on':''}"
              onclick="_s3vChar.videoStyle={..._s3vChar.videoStyle||{},ratio:'${v}'}">
              ${v}
            </button>`).join('')}
        </div>
      </div>
      <div class="s3v-field-row">
        <span class="s3v-field-label">씬당 길이</span>
        <div class="s3v-seg">
          ${['3초','5초','8초','15초'].map(v=>`
            <button class="s3v-seg-btn ${s.duration===v?'on':''}"
              onclick="_s3vChar.videoStyle={..._s3vChar.videoStyle||{},duration:'${v}'}">
              ${v}
            </button>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

/* ── B-3 툴 선택 ── */
function _s3vRenderToolBlock() {
  return `
  <div class="s3v-block">
    <div class="s3v-label">🛠 영상 생성 툴 선택</div>

    <div class="s3v-tool-group-label">⚡ API 자동 연동</div>
    <div class="s3v-tool-grid">
      ${S3V_TOOLS.auto.map(t => `
        <button class="s3v-tool-btn ${_s3vTool===t.id?'on':''} auto"
          onclick="_s3vTool='${t.id}';
            document.querySelectorAll('.s3v-tool-btn').forEach(b=>b.classList.remove('on'));
            this.classList.add('on')">
          ${t.icon} ${t.label}
          <span class="s3v-tool-desc">${t.desc}</span>
        </button>
      `).join('')}
    </div>

    <div class="s3v-tool-group-label" style="margin-top:10px">📋 수동 연동 (프롬프트 복사)</div>
    <div class="s3v-tool-grid">
      ${S3V_TOOLS.manual.map(t => `
        <button class="s3v-tool-btn ${_s3vTool===t.id?'on':''} manual"
          onclick="_s3vTool='${t.id}';
            document.querySelectorAll('.s3v-tool-btn').forEach(b=>b.classList.remove('on'));
            this.classList.add('on')">
          ${t.icon} ${t.label}
          <span class="s3v-tool-desc">${t.desc}</span>
        </button>
      `).join('')}
    </div>

    <!-- API 키 입력 (자동 연동 툴 선택 시) -->
    ${S3V_TOOLS.auto.find(t=>t.id===_s3vTool) ? `
    <div class="s3v-api-row">
      <span>API 키</span>
      <input type="password" class="s3v-api-inp"
        value="${localStorage.getItem(S3V_TOOLS.auto.find(t=>t.id===_s3vTool)?.apiKey||'')||''}"
        placeholder="${_s3vTool} API Key"
        oninput="localStorage.setItem('s3v_${_s3vTool}_key',this.value)">
    </div>` : ''}
  </div>`;
}

/* ── B-4 씬별 프롬프트 ── */
function _s3vRenderScenePrompts(scenes, proj) {
  const tool    = [...S3V_TOOLS.auto, ...S3V_TOOLS.manual].find(t=>t.id===_s3vTool);
  const isManual= S3V_TOOLS.manual.some(t=>t.id===_s3vTool);
  const charPmt = _s3vBuildCharPrompt();
  const style   = _s3vChar.videoStyle || {};

  // 전체 프롬프트 패키지
  const allPrompts = scenes.map((s,i) => _s3vBuildScenePrompt(s, i, charPmt, style, tool));
  const fullPackage = allPrompts.join('\n\n---\n\n');

  return `
  <div class="s3v-block">
    <div class="s3v-label">
      📋 씬별 영상 프롬프트
      ${tool ? `<span class="s3v-tool-badge">${tool.icon} ${tool.label}</span>` : ''}
    </div>

    <!-- 전체 복사 -->
    <div class="s3v-all-actions">
      <button class="s3v-btn-primary" onclick="_s3vCopy(this,\`${fullPackage.replace(/`/g,"'")}\`)">
        📋 전체 프롬프트 복사 (${scenes.length}씬)
      </button>
      ${tool?.url ? `
      <a class="s3v-btn-open" href="${tool.url}" target="_blank">
        🔗 ${tool.label} 열기
      </a>` : ''}
    </div>

    <!-- 수동 연동 가이드 -->
    ${isManual ? `
    <div class="s3v-manual-guide">
      <div class="s3v-guide-steps">
        <div class="s3v-guide-step">① 아래 씬별 프롬프트를 복사하세요</div>
        <div class="s3v-guide-step">② ${tool?.label}에 붙여넣고 영상을 생성하세요</div>
        <div class="s3v-guide-step">③ 완성된 MP4를 다운로드하세요</div>
        <div class="s3v-guide-step">④ 아래 "직접 업로드" 탭에서 가져오세요</div>
      </div>
      <button class="s3v-btn-outline"
        onclick="_s3vSetTab('c','studioS3VideoWrap')">
        → 직접 업로드 탭으로 이동
      </button>
    </div>` : ''}

    <!-- 씬별 프롬프트 -->
    <div class="s3v-scene-prompts">
      ${scenes.map((s,i) => {
        const pmt = _s3vBuildScenePrompt(s, i, charPmt, style, tool);
        return `
        <div class="s3v-scene-pmt-card">
          <div class="s3v-scene-pmt-hd">
            <span class="s3v-scene-num">씬 ${i+1}</span>
            <span class="s3v-scene-desc">${s.label || s.desc || ''}</span>
            <button class="s3v-mini-copy" onclick="_s3vCopy(this,\`${pmt.replace(/`/g,"'")}\`)">
              복사
            </button>
          </div>
          <div class="s3v-scene-pmt-text">${pmt}</div>
          ${s.imageUrl ? `<img src="${s.imageUrl}" class="s3v-scene-thumb" alt="씬${i+1}">` : ''}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function _s3vRenderNoScenes() {
  return `
  <div class="s3v-empty">
    <div style="font-size:36px;margin-bottom:12px">📝</div>
    <div>대본에서 씬을 먼저 추출하세요</div>
    <div style="font-size:12px;color:#9b8a93;margin-top:6px">
      STEP1 대본 생성 완료 후 씬 자동 추출
    </div>
    <button class="s3v-btn-outline" style="margin-top:14px"
      onclick="typeof studioGoto==='function'&&studioGoto(1)">
      ① 대본 생성으로 이동
    </button>
  </div>`;
}

function _s3vBuildScenePrompt(scene, idx, charPrompt, style, tool) {
  const desc    = scene.desc || scene.label || scene.caption || `Scene ${idx+1}`;
  const ratio   = style.ratio   || '9:16';
  const camera  = style.camera  || '고정';
  const mood    = style.mood    || '따뜻한 자연광';
  const dur     = style.duration|| '5초';
  const durSec  = dur.replace('초', 'seconds');
  const cameraEn= {고정:'static shot', 줌인:'slow zoom in', 패닝:'panning shot', 핸드헬드:'handheld camera'}[camera] || 'static';
  const moodEn  = {
    '따뜻한 자연광': 'warm natural lighting',
    '스튜디오': 'soft studio lighting',
    '야외': 'outdoor natural light',
    '드라마틱': 'dramatic contrast lighting',
    '미니멀': 'clean minimal lighting',
  }[mood] || 'warm natural lighting';

  const charPart = charPrompt !== 'No character (landscape/object focused)'
    ? `${charPrompt}, `
    : '';

  if (tool?.id === 'invideo') {
    return `[Scene ${idx+1}] ${desc}
Character: ${charPrompt}
Scene: ${desc}
Style: ${mood}, ${camera}
Duration: ${dur}
Aspect: ${ratio}`;
  }

  return `${charPart}${desc}, ${moodEn}, ${cameraEn}, ${ratio} vertical video, ${durSec}, cinematic quality, consistent character throughout`;
}

/* ════════════════════════════════════════════════
   TAB C — 직접 업로드
   ════════════════════════════════════════════════ */
function _s3vRenderC(scenes) {
  return `
  <div class="s3v-section">
    <div class="s3v-block">
      <div class="s3v-label">📁 직접 업로드</div>
      <div class="s3v-upload-types">
        <div class="s3v-upload-card">
          <div class="s3v-upload-icon">🎬</div>
          <div class="s3v-upload-title">영상 파일 (MP4)</div>
          <input type="file" accept="video/*" multiple
            onchange="_s3vHandleUpload(this.files,'video')">
          <div class="s3v-upload-hint">드래그하거나 클릭해서 선택</div>
        </div>
        <div class="s3v-upload-card">
          <div class="s3v-upload-icon">🖼</div>
          <div class="s3v-upload-title">이미지 파일</div>
          <input type="file" accept="image/*" multiple
            onchange="_s3vHandleUpload(this.files,'image')">
          <div class="s3v-upload-hint">JPG, PNG, WebP 지원</div>
        </div>
      </div>

      <!-- 업로드된 파일 목록 -->
      ${_s3vUploads.length > 0 ? `
      <div class="s3v-upload-list">
        <div class="s3v-label" style="margin-top:14px">
          업로드된 파일 (${_s3vUploads.length}개)
        </div>
        ${_s3vUploads.map((f,i) => `
          <div class="s3v-upload-item">
            <span>${f.type === 'video' ? '🎬' : '🖼'} ${f.name}</span>
            <div class="s3v-upload-item-actions">
              ${scenes.length > 0 ? `
              <select class="s3v-scene-sel"
                onchange="_s3vAssignToScene(${i},this.value)">
                <option value="">씬 배정</option>
                ${scenes.map((s,si) => `
                  <option value="${si}">씬${si+1} ${s.label||''}</option>
                `).join('')}
              </select>` : ''}
              <button class="s3v-mini-btn danger"
                onclick="_s3vUploads.splice(${i},1);_studioS3Video('studioS3VideoWrap')">
                ×
              </button>
            </div>
          </div>
        `).join('')}
      </div>` : ''}

      <!-- 재사용 안내 -->
      <div class="s3v-reuse-hint">
        💡 기존 소장 영상·이전에 만든 영상도 여기서 올릴 수 있어요.<br>
        올린 파일은 씬별로 배정하거나 편집 단계에서 활용됩니다.
      </div>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   헬퍼
   ════════════════════════════════════════════════ */
function _s3vDefaultChar() {
  return {
    type: 'person_ko',
    gender: '여성',
    age: '60대',
    hairColor: '흰색',
    hairStyle: '단발',
    build: '보통',
    outfitFixed: '항상 같은 옷',
    outfit: '밝은 색 블라우스, 안경',
    charNote: '따뜻한 미소',
    animeStyle: '귀여운(모에)',
    animalType: '고양이',
    animalStyle: '귀여운 만화풍',
    avatarStyle: '사실적',
    videoStyle: {
      mood: '따뜻한 자연광',
      camera: '고정',
      ratio: '9:16',
      duration: '5초',
    },
  };
}

function _s3vUpdateCharPrompt() {
  const el = document.getElementById('s3vCharPromptText');
  if (el) el.textContent = _s3vBuildCharPrompt();
}

window._s3vCopy = function(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✅ 복사됨';
    setTimeout(() => { btn.textContent = orig; }, 1500);
  });
};

window._s3vSetTab = function(tab, wid) {
  _s3vTab = tab;
  _studioS3Video(wid);
};

window._s3vHandleUpload = function(files, type) {
  Array.from(files).forEach(f => {
    _s3vUploads.push({ name: f.name, type, file: f, url: URL.createObjectURL(f) });
  });
  _studioS3Video('studioS3VideoWrap');
};

window._s3vAssignToScene = function(uploadIdx, sceneIdx) {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  if (!proj.scenes || sceneIdx === '') return;
  const upload = _s3vUploads[uploadIdx];
  if (!upload) return;
  if (upload.type === 'video') {
    proj.scenes[sceneIdx].videoUrl = upload.url;
  } else {
    proj.scenes[sceneIdx].imageUrl = upload.url;
  }
  if (typeof studioSave === 'function') studioSave();
};

/* ── CSS ── */
function _s3vInjectCSS() {
  if (document.getElementById('s3v-style')) return;
  const st = document.createElement('style');
  st.id = 's3v-style';
  st.textContent = `
.s3v-wrap{font-family:inherit}
.s3v-tab-switcher{display:flex;gap:6px;margin-bottom:12px}
.s3v-main-tab{flex:1;padding:10px;border:2px solid #f1dce7;border-radius:12px;
  background:#fff;font-size:13px;font-weight:800;cursor:pointer;transition:.14s}
.s3v-main-tab.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.s3v-body{background:#fff;border-radius:16px;border:1px solid #f1dce7;padding:18px}
.s3v-section{}
.s3v-block{margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #f8f0f5}
.s3v-block:last-child{border-bottom:none}
.s3v-label{font-size:12px;font-weight:800;color:#2b2430;margin-bottom:10px;
  display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.s3v-label-sub{font-size:10px;color:#9b8a93;font-weight:400}

/* 캐릭터 */
.s3v-char-types{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px}
@media(max-width:500px){.s3v-char-types{grid-template-columns:repeat(2,1fr)}}
.s3v-char-type-btn{padding:10px 6px;border:1.5px solid #f1dce7;border-radius:12px;
  background:#fff;cursor:pointer;font-size:12px;font-weight:700;text-align:center;
  display:flex;flex-direction:column;align-items:center;gap:4px;transition:.12s}
.s3v-char-type-btn span:first-child{font-size:20px}
.s3v-char-type-btn.on{border-color:#ef6fab;background:#fff1f8}
.s3v-char-fields{display:flex;flex-direction:column;gap:8px;margin-bottom:12px}
.s3v-field-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.s3v-field-label{font-size:12px;font-weight:700;min-width:76px;color:#5a4a56}
.s3v-seg{display:flex;gap:3px;flex-wrap:wrap}
.s3v-seg-btn{padding:4px 10px;border:1.5px solid #f1dce7;border-radius:8px;
  background:#fff;font-size:11px;font-weight:700;color:#7b7077;cursor:pointer;transition:.12s}
.s3v-seg-btn.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.s3v-text-inp{flex:1;min-width:150px;border:1.5px solid #f1dce7;border-radius:8px;
  padding:5px 10px;font-size:12px;outline:none}
.s3v-text-inp:focus{border-color:#ef6fab}
.s3v-char-none{padding:12px;background:#f9f3fb;border-radius:10px;font-size:13px;color:#9b8a93}
.s3v-char-prompt-box{background:#f9f3fb;border-radius:12px;padding:12px;margin-top:10px}
.s3v-char-prompt-label{font-size:11px;font-weight:700;color:#9b8a93;margin-bottom:6px}
.s3v-char-prompt-text{font-size:12.5px;color:#2b2430;line-height:1.6;margin-bottom:8px}
.s3v-char-prompt-actions{display:flex;gap:6px}
.s3v-mini-copy{padding:3px 10px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:11px;cursor:pointer;font-weight:700}
.s3v-mini-btn{padding:3px 10px;border:1.5px solid #9181ff;border-radius:20px;
  background:#fff;font-size:11px;cursor:pointer;font-weight:700;color:#9181ff}
.s3v-mini-btn.danger{border-color:#fca5a5;color:#dc2626}

/* 스타일 */
.s3v-style-grid{display:flex;flex-direction:column;gap:8px}

/* 툴 */
.s3v-tool-group-label{font-size:11px;font-weight:800;color:#9b8a93;margin-bottom:6px}
.s3v-tool-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:6px}
@media(max-width:500px){.s3v-tool-grid{grid-template-columns:repeat(2,1fr)}}
.s3v-tool-btn{padding:10px 8px;border:1.5px solid #f1dce7;border-radius:12px;
  background:#fff;cursor:pointer;font-size:13px;font-weight:800;
  display:flex;flex-direction:column;align-items:center;gap:3px;transition:.12s}
.s3v-tool-btn.on{border-color:#9181ff;background:#ede9ff}
.s3v-tool-btn.auto.on{border-color:#ef6fab;background:#fff1f8}
.s3v-tool-desc{font-size:10px;color:#9b8a93;font-weight:400;text-align:center}
.s3v-api-row{display:flex;align-items:center;gap:8px;margin-top:8px}
.s3v-api-row span{font-size:12px;font-weight:700;min-width:50px}
.s3v-api-inp{flex:1;border:1.5px solid #f1dce7;border-radius:8px;padding:6px 10px;font-size:12px}

/* 씬 프롬프트 */
.s3v-all-actions{display:flex;gap:8px;margin-bottom:12px}
.s3v-btn-primary{flex:1;padding:12px;border:none;border-radius:12px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-weight:800;font-size:13px;cursor:pointer}
.s3v-btn-open{flex:1;padding:12px;border:2px solid #9181ff;border-radius:12px;
  color:#9181ff;font-weight:800;font-size:13px;text-align:center;
  text-decoration:none;display:flex;align-items:center;justify-content:center}
.s3v-btn-outline{width:100%;padding:10px;border:1.5px solid #f1dce7;border-radius:10px;
  background:#fff;font-weight:700;font-size:12px;cursor:pointer;margin-top:8px;transition:.12s}
.s3v-btn-outline:hover{border-color:#9181ff;color:#9181ff}
.s3v-manual-guide{background:#fff8f0;border-radius:12px;padding:12px;margin-bottom:12px}
.s3v-guide-steps{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.s3v-guide-step{font-size:13px;font-weight:600;color:#3a3038}
.s3v-tool-badge{padding:3px 10px;background:#ede9ff;color:#5b4ecf;
  border-radius:20px;font-size:11px;font-weight:700}
.s3v-scene-prompts{display:flex;flex-direction:column;gap:8px}
.s3v-scene-pmt-card{border:1.5px solid #f1dce7;border-radius:12px;padding:12px;
  background:#fbf7f9}
.s3v-scene-pmt-hd{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.s3v-scene-num{font-size:11px;font-weight:800;background:#9181ff;color:#fff;
  border-radius:20px;padding:2px 10px}
.s3v-scene-desc{flex:1;font-size:12px;color:#5a4a56;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.s3v-scene-pmt-text{font-size:12px;color:#3a3038;line-height:1.6;
  background:#fff;border-radius:8px;padding:8px;margin-bottom:6px;word-break:break-all}
.s3v-scene-thumb{width:60px;height:40px;object-fit:cover;border-radius:6px}
.s3v-empty{text-align:center;padding:40px 20px;color:#9b8a93;font-size:14px}

/* 업로드 */
.s3v-upload-types{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.s3v-upload-card{border:2px dashed #f1dce7;border-radius:14px;padding:20px;
  text-align:center;position:relative;cursor:pointer;transition:.12s}
.s3v-upload-card:hover{border-color:#ef6fab;background:#fff1f8}
.s3v-upload-card input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
.s3v-upload-icon{font-size:28px;margin-bottom:8px}
.s3v-upload-title{font-size:13px;font-weight:800;margin-bottom:4px}
.s3v-upload-hint{font-size:11px;color:#9b8a93}
.s3v-upload-list{border:1.5px solid #f1dce7;border-radius:12px;padding:10px}
.s3v-upload-item{display:flex;align-items:center;justify-content:space-between;
  padding:8px 0;border-bottom:1px solid #f8f0f5;font-size:12px}
.s3v-upload-item:last-child{border-bottom:none}
.s3v-upload-item-actions{display:flex;gap:6px;align-items:center}
.s3v-scene-sel{border:1.5px solid #f1dce7;border-radius:8px;padding:3px 6px;font-size:11px}
.s3v-reuse-hint{background:#f9f3fb;border-radius:10px;padding:10px 12px;
  font-size:12px;color:#7b7077;line-height:1.6;margin-top:12px}
`;
  document.head.appendChild(st);
}
