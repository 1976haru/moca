/* ================================================
   modules/studio/s3-video-tools.js
   영상 프롬프트 도구별 템플릿 강화

   - 도구별 프롬프트 최적화 (Runway/Kling/Pika/InVideo 등)
   - 카메라 무빙 / 인물 행동 / 배경 / 감정 / 비율 포함
   - 씬별 프롬프트 자동 생성 + 부분 수정
   - 품질 점수 연동 (studio-quality.js)
   ================================================ */

/* ── 도구별 프롬프트 템플릿 ── */
const S3VT_TOOLS = {
  runway: {
    label: 'Runway ML',
    ico: '⚡',
    type: 'auto',
    url: 'https://runwayml.com',
    template: (scene, char, style) => {
      const cam    = style.camera   || 'static shot';
      const mood   = style.mood     || 'warm natural lighting';
      const dur    = style.duration || '5 seconds';
      const ratio  = style.ratio    || '9:16 vertical';
      const action = scene.action   || 'looking at camera with warm smile';
      const neg    = 'blurry, watermark, text overlay, bad quality, distorted';
      return `${char}, ${scene.desc||scene.label||'scene'}, ${action}, ${mood}, ${cam}, ${ratio}, ${dur}, cinematic quality, 4K -- neg ${neg}`;
    },
    tips: ['Gen-3 Alpha 사용 권장', '5초 이하로 설정', 'negative prompt 필수'],
  },
  kling: {
    label: 'Kling AI',
    ico: '⚡',
    type: 'auto',
    url: 'https://klingai.com',
    template: (scene, char, style) => {
      const cam  = style.camera   || '固定镜头';
      const mood = style.mood     || '温暖自然光';
      const dur  = style.duration || '5秒';
      return `${char}, ${scene.desc||scene.label||'场景'}, ${mood}, ${cam}, ${style.ratio||'9:16'}, ${dur}, 电影质感`;
    },
    tips: ['한국어 프롬프트도 지원', '실사 인물에 강점', '1080p 출력'],
  },
  pika: {
    label: 'Pika Labs',
    ico: '⚡',
    type: 'auto',
    url: 'https://pika.art',
    template: (scene, char, style) => {
      const motion = style.camera === '줌인' ? 'zoom in slowly' :
                     style.camera === '패닝' ? 'pan left to right' : 'static';
      return `${char} ${scene.desc||scene.label||'scene'}, ${style.mood||'warm lighting'}, ${motion}, ${style.ratio||'9:16'}, high quality`;
    },
    tips: ['애니메이션 스타일 강점', '빠른 생성', 'motion 파라미터 활용'],
  },
  luma: {
    label: 'Luma AI',
    ico: '⚡',
    type: 'auto',
    url: 'https://lumalabs.ai',
    template: (scene, char, style) => {
      return `${char} in ${scene.desc||scene.label||'a scene'}, ${style.mood||'natural lighting'}, smooth camera movement, photorealistic, ${style.ratio||'9:16 vertical video'}`;
    },
    tips: ['자연스러운 움직임 강점', 'Dream Machine 사용', '루프 영상 지원'],
  },
  heygen: {
    label: 'HeyGen',
    ico: '⚡',
    type: 'auto',
    url: 'https://heygen.com',
    template: (scene, char, style) => {
      return `Avatar: ${char}\nScript: ${scene.text||scene.desc||''}\nLanguage: ${style.lang==='ja'?'Japanese':'Korean'}\nBackground: ${style.mood||'warm studio'}\nRatio: ${style.ratio||'9:16'}`;
    },
    tips: ['아바타 영상 전용', 'API 키 필요', '한국어/일본어 지원'],
  },
  invideo: {
    label: 'InVideo',
    ico: '📋',
    type: 'manual',
    url: 'https://invideo.io',
    template: (scene, char, style) => {
      return `[씬 ${(scene.idx||0)+1}]
주제: ${scene.label||scene.desc||'씬'}
내레이션: ${(scene.text||'').slice(0,100)}
배경: ${style.mood||'따뜻한 실내'}
인물: ${char}
카메라: ${style.camera||'고정'}
길이: ${style.duration||'5초'}
비율: ${style.ratio||'9:16'}
전환: ${style.transition||'페이드'}`;
    },
    guide: ['프롬프트 복사 → InVideo 붙여넣기', '영상 생성 후 MP4 다운로드', '여기로 다시 업로드'],
    tips: ['텍스트 기반 편집 강점', 'API 미지원 → 수동 작업'],
  },
  capcut: {
    label: 'CapCut AI',
    ico: '📋',
    type: 'manual',
    url: 'https://capcut.com',
    template: (scene, char, style) => {
      return `씬${(scene.idx||0)+1}: ${scene.label||scene.desc||''}\n내레이션: ${(scene.text||'').slice(0,80)}\n스타일: ${style.mood||'자연스러운'}\n길이: ${style.duration||'5초'}`;
    },
    guide: ['CapCut 앱에서 AI 생성 탭 사용', '생성 후 내보내기 → MP4', 'MOCA에 다시 업로드'],
    tips: ['모바일 최적화', '간단한 AI 영상 생성'],
  },
  vrew: {
    label: 'Vrew',
    ico: '📋',
    type: 'manual',
    url: 'https://vrew.ai',
    template: (scene, char, style) => {
      return `${scene.text||scene.desc||''}\n(${style.duration||'5초'} / ${style.ratio||'9:16'})`;
    },
    guide: ['Vrew에서 AI 영상 생성', '자막 자동 생성 활용', 'MP4 내보내기'],
    tips: ['자막 기반 영상 편집 강점', '한국어 음성 인식 우수'],
  },
};

/* ── 카메라 옵션 ── */
const S3VT_CAMERAS = [
  { id:'static',   label:'고정',      en:'static shot' },
  { id:'zoom_in',  label:'줌인',      en:'slow zoom in' },
  { id:'zoom_out', label:'줌아웃',    en:'slow zoom out' },
  { id:'pan',      label:'패닝',      en:'pan left to right' },
  { id:'handheld', label:'핸드헬드',  en:'handheld camera' },
  { id:'tilt',     label:'틸트업',    en:'tilt up slowly' },
];

/* ── 감정/분위기 ── */
const S3VT_MOODS = [
  { id:'warm',      label:'따뜻한 자연광', en:'warm natural lighting, soft shadows' },
  { id:'studio',    label:'스튜디오',      en:'soft studio lighting, clean background' },
  { id:'outdoor',   label:'야외 자연',     en:'outdoor natural light, gentle breeze' },
  { id:'dramatic',  label:'드라마틱',      en:'dramatic contrast lighting, cinematic' },
  { id:'minimal',   label:'미니멀',        en:'clean minimal lighting, neutral background' },
  { id:'emotional', label:'감성적',        en:'emotional warm glow, golden hour' },
];

/* ── 인물 행동 ── */
const S3VT_ACTIONS = [
  { id:'camera',   label:'카메라 응시',   en:'looking at camera with warm smile' },
  { id:'talking',  label:'말하는 중',     en:'speaking naturally, gesturing gently' },
  { id:'sitting',  label:'앉아있음',      en:'sitting comfortably, relaxed posture' },
  { id:'walking',  label:'걷는 중',       en:'walking slowly, thoughtful expression' },
  { id:'reading',  label:'책 읽기',       en:'reading a book, focused expression' },
  { id:'none',     label:'없음 (풍경)',   en:'' },
];

/* ── 전역 상태 ── */
let _s3vtTool     = 'invideo';
let _s3vtStyle    = {
  camera:'static', mood:'warm', action:'camera',
  ratio:'9:16', duration:'5초', lang:'ko',
  transition:'fade',
};
let _s3vtEditing  = null; // 수정 중인 씬 인덱스

/* ════════════════════════════════════════════════
   메인 렌더
   ════════════════════════════════════════════════ */
function _studioS3VideoTools(wrapId) {
  const wrap = document.getElementById(wrapId || 'studioS3VTWrap');
  if (!wrap) return;

  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const scenes = proj.scenes || (proj.s3 && proj.s3.scenes) || [];
  const char   = _s3vtGetCharPrompt(proj);

  wrap.innerHTML = `
  <div class="s3vt-wrap">

    <!-- 도구 선택 -->
    ${_s3vtRenderToolSelect()}

    <!-- 영상 스타일 설정 -->
    ${_s3vtRenderStyleSettings()}

    <!-- 씬별 프롬프트 -->
    ${scenes.length > 0
      ? _s3vtRenderScenePrompts(scenes, char, wrapId)
      : _s3vtRenderNoScenes()}

    <!-- 품질 게이트 -->
    ${scenes.length > 0 ? _s3vtRenderQualityGate(proj.videoPrompts||[]) : ''}

  </div>`;

  _s3vtInjectCSS();
}

/* ── 도구 선택 ── */
function _s3vtRenderToolSelect() {
  const autoTools   = Object.entries(S3VT_TOOLS).filter(([,t])=>t.type==='auto');
  const manualTools = Object.entries(S3VT_TOOLS).filter(([,t])=>t.type==='manual');

  return `
  <div class="s3vt-block">
    <div class="s3vt-label">🛠 영상 생성 도구 선택</div>
    <div class="s3vt-tool-group-label">⚡ API 자동 연동</div>
    <div class="s3vt-tool-grid">
      ${autoTools.map(([id,t])=>`
        <button class="s3vt-tool-btn ${_s3vtTool===id?'on':''} auto"
          onclick="_s3vtTool='${id}';_studioS3VideoTools('studioS3VTWrap')">
          ${t.ico} ${t.label}
        </button>`).join('')}
    </div>
    <div class="s3vt-tool-group-label" style="margin-top:8px">📋 수동 연동</div>
    <div class="s3vt-tool-grid">
      ${manualTools.map(([id,t])=>`
        <button class="s3vt-tool-btn ${_s3vtTool===id?'on':''} manual"
          onclick="_s3vtTool='${id}';_studioS3VideoTools('studioS3VTWrap')">
          ${t.ico} ${t.label}
        </button>`).join('')}
    </div>
    ${S3VT_TOOLS[_s3vtTool]?.tips ? `
    <div class="s3vt-tips">
      ${S3VT_TOOLS[_s3vtTool].tips.map(t=>`<span>💡 ${t}</span>`).join('')}
    </div>` : ''}
  </div>`;
}

/* ── 스타일 설정 ── */
function _s3vtRenderStyleSettings() {
  return `
  <div class="s3vt-block">
    <div class="s3vt-label">🎬 영상 스타일 설정</div>
    <div class="s3vt-style-grid">

      <div class="s3vt-style-row">
        <span>카메라</span>
        <div class="s3vt-seg">
          ${S3VT_CAMERAS.map(c=>`
            <button class="s3vt-seg-btn ${_s3vtStyle.camera===c.id?'on':''}"
              onclick="_s3vtStyle.camera='${c.id}'">${c.label}</button>`).join('')}
        </div>
      </div>

      <div class="s3vt-style-row">
        <span>분위기</span>
        <div class="s3vt-seg">
          ${S3VT_MOODS.map(m=>`
            <button class="s3vt-seg-btn ${_s3vtStyle.mood===m.id?'on':''}"
              onclick="_s3vtStyle.mood='${m.id}'">${m.label}</button>`).join('')}
        </div>
      </div>

      <div class="s3vt-style-row">
        <span>인물 행동</span>
        <div class="s3vt-seg">
          ${S3VT_ACTIONS.map(a=>`
            <button class="s3vt-seg-btn ${_s3vtStyle.action===a.id?'on':''}"
              onclick="_s3vtStyle.action='${a.id}'">${a.label}</button>`).join('')}
        </div>
      </div>

      <div class="s3vt-style-row">
        <span>비율</span>
        <div class="s3vt-seg">
          ${['9:16','16:9','1:1'].map(r=>`
            <button class="s3vt-seg-btn ${_s3vtStyle.ratio===r?'on':''}"
              onclick="_s3vtStyle.ratio='${r}'">${r}</button>`).join('')}
        </div>
      </div>

      <div class="s3vt-style-row">
        <span>씬당 길이</span>
        <div class="s3vt-seg">
          ${['3초','5초','8초','15초'].map(d=>`
            <button class="s3vt-seg-btn ${_s3vtStyle.duration===d?'on':''}"
              onclick="_s3vtStyle.duration='${d}'">${d}</button>`).join('')}
        </div>
      </div>

    </div>
  </div>`;
}

/* ── 씬별 프롬프트 ── */
function _s3vtRenderScenePrompts(scenes, char, wrapId) {
  const tool   = S3VT_TOOLS[_s3vtTool];
  const isManual = tool?.type === 'manual';

  // 스타일 객체 변환
  const styleObj = {
    camera:     S3VT_CAMERAS.find(c=>c.id===_s3vtStyle.camera)?.en || _s3vtStyle.camera,
    mood:       S3VT_MOODS.find(m=>m.id===_s3vtStyle.mood)?.en || _s3vtStyle.mood,
    action:     S3VT_ACTIONS.find(a=>a.id===_s3vtStyle.action)?.en || _s3vtStyle.action,
    ratio:      _s3vtStyle.ratio,
    duration:   _s3vtStyle.duration,
    transition: _s3vtStyle.transition,
    lang:       _s3vtStyle.lang,
  };

  const prompts = scenes.map(s => tool?.template(s, char, styleObj) || '');

  // STUDIO.project에 저장
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  proj.videoPrompts = scenes.map((s,i) => ({
    sceneIdx: i, prompt: prompts[i], tool: _s3vtTool,
  }));

  // 품질 계산
  if (typeof sqCalcVideoPrompt === 'function') {
    sqCalcVideoPrompt(proj.videoPrompts);
  }

  const allPrompts = prompts.join('\n\n---\n\n');

  return `
  <div class="s3vt-block">
    <div class="s3vt-label">
      📋 씬별 프롬프트
      ${tool ? `<span class="s3vt-tool-badge">${tool.ico} ${tool.label}</span>` : ''}
    </div>

    <!-- 전체 복사 -->
    <div class="s3vt-all-row">
      <button class="s3vt-btn-primary"
        onclick="_s3vtCopyAll('${wrapId}')">
        📋 전체 프롬프트 복사 (${scenes.length}씬)
      </button>
      ${tool?.url ? `
      <a class="s3vt-btn-open" href="${tool.url}" target="_blank">
        🔗 ${tool.label} 열기
      </a>` : ''}
    </div>

    <!-- 수동 가이드 -->
    ${isManual && tool?.guide ? `
    <div class="s3vt-manual-guide">
      ${tool.guide.map((g,i)=>`<div class="s3vt-guide-step">${i+1}. ${g}</div>`).join('')}
      <button class="s3vt-btn-outline"
        onclick="_s3vSetTab('c','studioS3VideoWrap')">
        → 완성 영상 업로드 탭으로 이동
      </button>
    </div>` : ''}

    <!-- 씬별 -->
    <div class="s3vt-scenes">
      ${scenes.map((s,i)=>`
        <div class="s3vt-scene-card" id="s3vtScene${i}">
          <div class="s3vt-scene-hd">
            <span class="s3vt-scene-num">${i+1}</span>
            <span class="s3vt-scene-label">${s.label||s.desc||'씬 '+(i+1)}</span>
            <button class="s3vt-mini-copy"
              onclick="_s3vtCopyOne(this,'${i}')">복사</button>
          </div>
          <div class="s3vt-prompt-text" id="s3vtPrompt${i}">${prompts[i]||''}</div>
          <div class="s3vt-scene-actions">
            <button class="s3vt-mini-edit"
              onclick="_s3vtEditPrompt(${i},'${wrapId||'studioS3VTWrap'}')">
              ✏️ 수정
            </button>
            <button class="s3vt-mini-regen"
              onclick="_s3vtRegenPrompt(${i},'${wrapId||'studioS3VTWrap'}')">
              🔄 재생성
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function _s3vtRenderNoScenes() {
  return `
  <div class="s3vt-empty">
    <div>📝 대본을 먼저 생성해주세요</div>
    <button class="s3vt-btn-outline"
      onclick="typeof studioGoto==='function'&&studioGoto(1)">
      ① 대본 생성으로 이동
    </button>
  </div>`;
}

function _s3vtRenderQualityGate(videoPrompts) {
  if (typeof sqRenderGate !== 'function') return '';
  return sqRenderGate(
    'videoPrompt',
    "sqConfirm('videoPrompt',3)",
    "typeof studioGoto==='function'&&studioGoto(3)"
  );
}

/* ════════════════════════════════════════════════
   헬퍼
   ════════════════════════════════════════════════ */
function _s3vtGetCharPrompt(proj) {
  // s3-video.js의 캐릭터 설정 활용
  const char = localStorage.getItem('s3v_char');
  if (char) {
    try {
      const c = JSON.parse(char);
      if (c.type === 'none') return 'landscape scene, no character';
      const nat = c.type === 'person_ja' ? 'Japanese' : 'Korean';
      const age = c.age || '60s';
      const gen = c.gender === '남성' ? 'man' : 'woman';
      const hair= `${c.hairColor||'white'} ${c.hairStyle||'short'} hair`;
      const out = c.outfit ? `, wearing ${c.outfit}` : '';
      return `${age} ${nat} ${gen}, ${hair}${out}, consistent character`;
    } catch(e) {}
  }
  const style = proj.style || 'emotional';
  const lang  = proj.lang  || 'ko';
  return lang === 'ja'
    ? '60s Japanese woman, white short hair, warm smile'
    : '60s Korean woman, white short hair, warm smile';
}

/* ── 이벤트 ── */
window._s3vtCopyAll = function(wid) {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const texts = (proj.videoPrompts||[]).map((p,i)=>`[씬${i+1}]\n${p.prompt}`).join('\n\n---\n\n');
  navigator.clipboard.writeText(texts).then(()=>alert('전체 프롬프트가 복사됐어요!'));
};

window._s3vtCopyOne = function(btn, idx) {
  const el = document.getElementById(`s3vtPrompt${idx}`);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(()=>{
    const o=btn.textContent; btn.textContent='✅'; setTimeout(()=>btn.textContent=o,1500);
  });
};

window._s3vtEditPrompt = function(idx, wid) {
  const el = document.getElementById(`s3vtPrompt${idx}`);
  if (!el) return;
  const edited = prompt(`씬${idx+1} 프롬프트 수정:`, el.textContent);
  if (edited === null) return;
  el.textContent = edited;
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  if (proj.videoPrompts?.[idx]) proj.videoPrompts[idx].prompt = edited;
  if (typeof studioSave === 'function') studioSave();
};

window._s3vtRegenPrompt = function(idx, wid) {
  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const scenes = proj.scenes || [];
  const scene  = scenes[idx];
  if (!scene) return;
  const char   = _s3vtGetCharPrompt(proj);
  const tool   = S3VT_TOOLS[_s3vtTool];
  const styleObj = {
    camera:   S3VT_CAMERAS.find(c=>c.id===_s3vtStyle.camera)?.en || _s3vtStyle.camera,
    mood:     S3VT_MOODS.find(m=>m.id===_s3vtStyle.mood)?.en || _s3vtStyle.mood,
    action:   S3VT_ACTIONS.find(a=>a.id===_s3vtStyle.action)?.en || _s3vtStyle.action,
    ratio:    _s3vtStyle.ratio,
    duration: _s3vtStyle.duration,
  };
  const newPrompt = tool?.template(scene, char, styleObj) || '';
  const el = document.getElementById(`s3vtPrompt${idx}`);
  if (el) el.textContent = newPrompt;
  if (proj.videoPrompts?.[idx]) proj.videoPrompts[idx].prompt = newPrompt;
  if (typeof studioSave === 'function') studioSave();
};

/* ── CSS ── */
function _s3vtInjectCSS() {
  if (document.getElementById('s3vt-style')) return;
  const st = document.createElement('style');
  st.id = 's3vt-style';
  st.textContent = `
.s3vt-wrap{display:flex;flex-direction:column;gap:12px;padding:12px}
.s3vt-block{background:#fff;border:1.5px solid #f1dce7;border-radius:14px;padding:14px}
.s3vt-label{font-size:12px;font-weight:800;color:#2b2430;margin-bottom:10px;
  display:flex;align-items:center;gap:8px}
.s3vt-tool-group-label{font-size:11px;font-weight:700;color:#9b8a93;margin-bottom:6px}
.s3vt-tool-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:4px}
@media(max-width:500px){.s3vt-tool-grid{grid-template-columns:repeat(2,1fr)}}
.s3vt-tool-btn{padding:8px 6px;border:1.5px solid #f1dce7;border-radius:10px;
  background:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:.12s}
.s3vt-tool-btn.on.auto{border-color:#ef6fab;background:#fff1f8}
.s3vt-tool-btn.on.manual{border-color:#9181ff;background:#ede9ff}
.s3vt-tips{display:flex;flex-direction:column;gap:3px;margin-top:8px}
.s3vt-tips span{font-size:11px;color:#9b8a93}
.s3vt-style-grid{display:flex;flex-direction:column;gap:8px}
.s3vt-style-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.s3vt-style-row>span{font-size:11px;font-weight:700;min-width:64px;color:#5a4a56}
.s3vt-seg{display:flex;gap:3px;flex-wrap:wrap}
.s3vt-seg-btn{padding:4px 10px;border:1.5px solid #f1dce7;border-radius:8px;
  background:#fff;font-size:11px;font-weight:700;cursor:pointer;transition:.12s;color:#7b7077}
.s3vt-seg-btn.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.s3vt-tool-badge{padding:3px 10px;background:#ede9ff;color:#5b4ecf;border-radius:20px;font-size:10px}
.s3vt-all-row{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}
.s3vt-btn-primary{flex:1;padding:10px;border:none;border-radius:10px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;font-weight:800;font-size:12px;cursor:pointer}
.s3vt-btn-open{flex:1;padding:10px;border:1.5px solid #9181ff;border-radius:10px;
  color:#9181ff;font-weight:800;font-size:12px;text-align:center;text-decoration:none;
  display:flex;align-items:center;justify-content:center}
.s3vt-btn-outline{width:100%;padding:8px;border:1.5px solid #f1dce7;border-radius:10px;
  background:#fff;font-size:12px;font-weight:700;cursor:pointer;margin-top:8px}
.s3vt-manual-guide{background:#f9f3fb;border-radius:10px;padding:10px;margin-bottom:10px}
.s3vt-guide-step{font-size:12px;font-weight:600;color:#3a3038;padding:3px 0}
.s3vt-scenes{display:flex;flex-direction:column;gap:8px}
.s3vt-scene-card{border:1.5px solid #f1dce7;border-radius:10px;padding:10px;background:#fbf7f9}
.s3vt-scene-hd{display:flex;align-items:center;gap:6px;margin-bottom:6px}
.s3vt-scene-num{width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#ef6fab,#9181ff);
  color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.s3vt-scene-label{flex:1;font-size:12px;font-weight:700}
.s3vt-mini-copy{padding:3px 8px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:10px;cursor:pointer;font-weight:700}
.s3vt-prompt-text{font-size:11.5px;color:#3a3038;background:#fff;border-radius:8px;
  padding:8px;white-space:pre-wrap;line-height:1.6;margin-bottom:6px;word-break:break-all}
.s3vt-scene-actions{display:flex;gap:4px}
.s3vt-mini-edit,.s3vt-mini-regen{padding:3px 10px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:10px;cursor:pointer;font-weight:700;transition:.12s}
.s3vt-mini-regen:hover{border-color:#9181ff;color:#9181ff}
.s3vt-empty{text-align:center;padding:30px;color:#9b8a93;font-size:13px}
`;
  document.head.appendChild(st);
}

window._studioS3VideoTools = _studioS3VideoTools;
