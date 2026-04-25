/* ================================================
   modules/studio/s2-voice-step.js
   STEP 3 — 음성·BGM (자동숏츠 전용 UI)

   기존 s2-voice.js 삭제 없음 — 위에 씌우는 구조
   - AI 음성 자동 추천 (장르+대본 분석)
   - 음성 속도 조절 (0.7~1.3)
   - 씬별 TTS 생성 + URL 저장
   - BGM 자동 추천 + 선택
   - STUDIO.project.voice 저장
   ================================================ */

/* ── 음성 추천 매핑 (이슈 1: 각 스타일·언어별 2~3개 후보) ── */
const V2_VOICE_RECOMMEND = {
  emotional: {
    ko: [
      { id:'rachel',     label:'Rachel',            provider:'EL', desc:'따뜻함·감성 최적' },
      { id:'calm_senior',label:'Calm Senior Female',provider:'OA', desc:'차분한 시니어 톤' },
      { id:'warm_narr',  label:'Warm Narrator',     provider:'EL', desc:'감동 내레이션' },
    ],
    ja: [
      { id:'haruka',     label:'Haruka',            provider:'NJ', desc:'시니어 감성 일본어' },
      { id:'calm_jp',    label:'Calm JP Narrator',  provider:'OA', desc:'차분한 일본어 내레이션' },
    ],
  },
  info: {
    ko: [
      { id:'adam',       label:'Adam',              provider:'EL', desc:'차분·신뢰감' },
      { id:'nova',       label:'Nova',              provider:'OA', desc:'명료·정보형' },
      { id:'mid_male',   label:'중년 남성',          provider:'CV', desc:'전문성 강조' },
    ],
    ja: [
      { id:'kenji',      label:'Kenji',             provider:'NJ', desc:'정보형 일본어' },
      { id:'jp_male_mid',label:'中年男性',           provider:'OA', desc:'안정적 일본어' },
    ],
  },
  humor: {
    ko: [
      { id:'grace',      label:'Grace',             provider:'EL', desc:'밝고 경쾌' },
      { id:'young_male', label:'청년 남성',          provider:'CV', desc:'활기찬 톤' },
    ],
    ja: [
      { id:'yuki',       label:'Yuki',              provider:'NJ', desc:'활기찬 일본어' },
      { id:'jp_young_f', label:'若い女性',           provider:'OA', desc:'밝은 일본어' },
    ],
  },
  drama: {
    ko: [
      { id:'josh',       label:'Josh',              provider:'EL', desc:'깊고 묵직한' },
      { id:'serious_m',  label:'Serious Male',      provider:'OA', desc:'드라마틱' },
    ],
    ja: [
      { id:'takeshi',    label:'Takeshi',           provider:'NJ', desc:'드라마틱 일본어' },
    ],
  },
  senior: {
    ko: [
      { id:'rachel',     label:'Rachel',            provider:'EL', desc:'시니어 채널 최적' },
      { id:'senior_f',   label:'시니어 여성',        provider:'CV', desc:'친숙한 시니어 톤' },
      { id:'senior_m',   label:'시니어 남성',        provider:'CV', desc:'관록 있는 톤' },
    ],
    ja: [
      { id:'sachiko',    label:'Sachiko',           provider:'NJ', desc:'시니어 일본어 최적' },
      { id:'jp_senior_f',label:'シニア女性',         provider:'OA', desc:'따뜻한 시니어 일본어' },
    ],
  },
  knowledge: {
    ko: [
      { id:'adam',       label:'Adam',              provider:'EL', desc:'전문적·차분' },
      { id:'narrator',   label:'Narrator',          provider:'OA', desc:'다큐형' },
    ],
    ja: [
      { id:'kenji',      label:'Kenji',             provider:'NJ', desc:'교양 일본어' },
    ],
  },
};

/* 호환 — 기존 단일 추천을 사용하던 코드는 [0] 가 KO 첫 후보 */
function _v2RecOne(style, langKey) {
  const arr = ((V2_VOICE_RECOMMEND[style] || V2_VOICE_RECOMMEND.emotional)[langKey]) || [];
  return arr[0] || null;
}

/* ── BGM 추천 매핑 ── */
const V2_BGM_RECOMMEND = {
  emotional: 'emotional_piano',
  info:      'bright',
  humor:     'bright',
  drama:     'tension',
  senior:    'emotional_piano',
  knowledge: 'lofi',
};

/* ── 속도 추천 ── */
const V2_SPEED_RECOMMEND = {
  30:  1.2,
  60:  1.1,
  180: 1.0,
  600: 0.9,
};

const V2_BGM_LIST = [
  { id:'emotional_piano', label:'🎹 감성 피아노',  desc:'시니어·감동 최적' },
  { id:'acoustic_guitar', label:'🎸 어쿠스틱',     desc:'자연스러운 감성' },
  { id:'japan_harmony',   label:'🎋 일본풍 화음',  desc:'일본 채널 최적' },
  { id:'tension',         label:'⚡ 긴장감',        desc:'드라마·폭로' },
  { id:'bright',          label:'☀️ 밝고 경쾌',    desc:'정보·유머' },
  { id:'lofi',            label:'🌙 로파이',        desc:'집중·교양' },
  { id:'none',            label:'🔇 없음',          desc:'음성만' },
];

const V2_PROVIDERS = [
  { id:'elevenlabs', label:'ElevenLabs', ico:'🎙' },
  { id:'openai',     label:'OpenAI TTS', ico:'🤖' },
  { id:'nijivoice',  label:'Nijivoice',  ico:'🇯🇵' },
];

const V2_SPEEDS = [0.7, 0.8, 0.85, 0.9, 1.0, 1.1, 1.2, 1.3];

/* ── 전역 상태 ── */
let _v2Tab       = 'auto';  // 'auto' | 'manual'
let _v2Voice     = null;    // 저장된 voice 설정
let _v2Generating= {};      // { sceneIdx: true }

/* ════════════════════════════════════════════════
   메인 렌더
   ════════════════════════════════════════════════ */
function _studioS2Step(wrapId) {
  const wrap = document.getElementById(wrapId || 'studioS2Wrap');
  if (!wrap) return;

  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const scenes = proj.scenes || [];
  const style  = proj.style  || 'emotional';
  const lang   = proj.lang   || 'both';
  const lenSec = proj.lengthSec || 60;

  // 음성 설정 초기화
  if (!_v2Voice) {
    const saved = proj.voice;
    if (saved) {
      _v2Voice = saved;
    } else {
      _v2Voice = _v2DefaultVoice(style, lang, lenSec);
      proj.voice = _v2Voice;
    }
  }

  const rec = V2_VOICE_RECOMMEND[style] || V2_VOICE_RECOMMEND.emotional;

  /* ⭐ 콘텐츠 종류별 API 추천 (provider 단위) */
  const _recTaskKey = (lang === 'ja')                                ? 'japanese'
                    : (style === 'info' || style === 'knowledge')    ? 'information'
                    : (lang === 'ko')                                 ? 'korean'
                    : 'seniorEmotion';
  const _recCardsHtml = (typeof window.renderRecommendationCards === 'function')
    ? window.renderRecommendationCards('voice', _recTaskKey, {
        onPick: "_v2PickRecommendedProvider('PROVIDER')"
      })
    : '';

  wrap.innerHTML = `
  <div class="v2-wrap">

    <!-- ⭐ 콘텐츠 종류별 API 추천 (provider) -->
    ${_recCardsHtml}

    <!-- AI 자동 추천 (이슈 1 — 후보 2~3개 카드 + 미리듣기 + 단일 적용 표시) -->
    <div class="v2-recommend-banner">
      <div class="v2-rec-hd">
        🤖 AI 음성 자동 추천 — 후보 비교 후 1개 선택
        <span class="v2-rec-badge">장르: ${_v2StyleLabel(style)}</span>
      </div>
      ${lang !== 'ja' ? _v2RenderRecGroup('ko', style, _v2Voice.voiceKo, wrapId) : ''}
      ${lang !== 'ko' ? _v2RenderRecGroup('ja', style, _v2Voice.voiceJa, wrapId) : ''}
    </div>

    <!-- API + 속도 설정 -->
    <div class="v2-block">
      <div class="v2-row-2">
        <div>
          <div class="v2-label">🎙 음성 API</div>
          <div class="v2-seg">
            ${V2_PROVIDERS.map(p=>`
              <button class="v2-seg-btn ${_v2Voice.api===p.id?'on':''}"
                onclick="_v2Voice.api='${p.id}';_v2Save();
                  document.querySelectorAll('.v2-seg-btn').forEach(b=>{});
                  this.closest('.v2-seg').querySelectorAll('button').forEach(b=>b.classList.remove('on'));
                  this.classList.add('on')">
                ${p.ico} ${p.label}
              </button>
            `).join('')}
          </div>
        </div>
        <div>
          <div class="v2-label">
            ⚡ 음성 속도
            <span class="v2-speed-hint">${_v2SpeedHint(lenSec, proj.channel)}</span>
          </div>
          <div class="v2-speed-row">
            ${V2_SPEEDS.map(s=>`
              <button class="v2-speed-btn ${_v2Voice.speed===s?'on':''}"
                onclick="_v2Voice.speed=${s};_v2Save();
                  this.closest('.v2-speed-row').querySelectorAll('button').forEach(b=>b.classList.remove('on'));
                  this.classList.add('on')">
                ${s}×
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- 씬별 음성 생성 -->
    <div class="v2-block">
      <div class="v2-label">
        📢 씬별 음성 생성
        <button class="v2-gen-all-btn"
          onclick="_v2GenAll('${wrapId||'studioS2Wrap'}')">
          ⚡ 전체 씬 생성
        </button>
      </div>

      ${scenes.length === 0 ? `
        <div class="v2-no-scenes">
          대본이 없어요. STEP1에서 대본을 먼저 생성해주세요.
          <button class="v2-go-step" onclick="typeof studioGoto==='function'&&studioGoto(1)">
            ① 대본 생성으로 →
          </button>
        </div>
      ` : `
        <div class="v2-scenes">
          ${scenes.map((s,i) => _v2RenderScene(s, i, wrapId)).join('')}
        </div>
      `}
    </div>

    <!-- BGM -->
    <div class="v2-block">
      <div class="v2-label">
        🎵 BGM
        <span class="v2-bgm-rec">추천: ${_v2BgmLabel(V2_BGM_RECOMMEND[style])}</span>
      </div>
      <div class="v2-bgm-list">
        ${V2_BGM_LIST.map(b=>`
          <label class="v2-bgm-item ${_v2Voice.bgm===b.id?'on':''}">
            <input type="radio" name="v2bgm" value="${b.id}"
              ${_v2Voice.bgm===b.id?'checked':''}
              onchange="_v2Voice.bgm='${b.id}';_v2Save()">
            <div>
              <div class="v2-bgm-label">${b.label}</div>
              <div class="v2-bgm-desc">${b.desc}</div>
            </div>
          </label>
        `).join('')}
      </div>

      <!-- 볼륨 -->
      <div class="v2-vol-rows">
        <div class="v2-vol-row">
          <span>BGM 볼륨</span>
          <input type="range" min="0" max="100" value="${_v2Voice.bgmVol}"
            oninput="_v2Voice.bgmVol=+this.value;
              document.getElementById('v2BgmVol').textContent=this.value+'%';_v2Save()">
          <span id="v2BgmVol">${_v2Voice.bgmVol}%</span>
        </div>
        <div class="v2-vol-row">
          <span>음성 볼륨</span>
          <input type="range" min="0" max="100" value="${_v2Voice.voiceVol}"
            oninput="_v2Voice.voiceVol=+this.value;
              document.getElementById('v2VoiceVol').textContent=this.value+'%';_v2Save()">
          <span id="v2VoiceVol">${_v2Voice.voiceVol}%</span>
        </div>
      </div>
    </div>

    <!-- 기존 화자 설정 (고급) — 이슈 3: details 열릴 때 _vAdvRender 호출 -->
    <details class="v2-advanced"
      ontoggle="if(this.open && typeof _vAdvRender==='function') _vAdvRender('v2AdvancedInner');">
      <summary>⚙️ 고급 화자 설정 (다중 화자·감정·발음·씬적용)</summary>
      <div id="v2AdvancedInner">
        ${typeof _vAdvRender === 'function'
          ? '<div style="padding:10px;color:#9b8a93;font-size:12px">열기 버튼을 클릭하면 고급 화자 설정이 나타납니다.</div>'
          : '<div style="padding:10px;color:#dc2626;font-size:12px">⚠️ s2-voice-advanced.js 가 로드되지 않았습니다.</div>'}
      </div>
    </details>

    <!-- 하단 -->
    <div class="v2-footer">
      <button class="v2-skip-btn"
        onclick="typeof studioGoto==='function'&&studioGoto(4)">
        건너뛰기 → 편집 먼저
      </button>
      <button class="v2-next-btn" onclick="_v2Next()">
        다음: 편집 →
      </button>
    </div>

  </div>`;

  _v2InjectCSS();
}

/* ── 씬 카드 렌더 ── */
function _v2RenderScene(scene, idx, wrapId) {
  const voiceData = _v2Voice.scenes?.[idx] || {};
  const hasAudio  = !!voiceData.audioUrl;
  const isLoading = !!_v2Generating[idx];
  const text      = scene.text || scene.caption || scene.desc || '';

  return `
  <div class="v2-scene-card ${hasAudio?'done':''}" id="v2Scene${idx}">
    <div class="v2-scene-hd">
      <span class="v2-scene-num">${idx+1}</span>
      <span class="v2-scene-label">${scene.label||scene.desc||'씬 '+(idx+1)}</span>
      <span class="v2-scene-status">
        ${hasAudio ? '✅ 완료' : isLoading ? '⏳ 생성중...' : '⬜ 미생성'}
      </span>
    </div>
    <div class="v2-scene-text">${text.slice(0,80)}${text.length>80?'...':''}</div>
    <div class="v2-scene-actions">
      ${hasAudio ? `
        <audio controls src="${voiceData.audioUrl}" class="v2-audio"></audio>
        <button class="v2-mini-btn danger"
          onclick="_v2ClearScene(${idx},'${wrapId||'studioS2Wrap'}')">재생성</button>
      ` : `
        <button class="v2-gen-btn ${isLoading?'loading':''}"
          onclick="_v2GenScene(${idx},'${wrapId||'studioS2Wrap'}')"
          ${isLoading?'disabled':''}>
          ${isLoading?'⏳ 생성중...':'🎤 음성 생성'}
        </button>
      `}
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   음성 생성
   ════════════════════════════════════════════════ */
async function _v2GenScene(idx, wrapId) {
  const proj  = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const scene = (proj.scenes || [])[idx];
  if (!scene) return;

  _v2Generating[idx] = true;
  _studioS2Step(wrapId);

  try {
    const text = scene.text || scene.caption || '';
    const api  = _v2Voice.api || 'elevenlabs';
    const spd  = _v2Voice.speed || 1.0;

    let audioUrl = '';

    if (api === 'elevenlabs') {
      audioUrl = await _v2CallElevenLabs(text, spd);
    } else if (api === 'openai') {
      audioUrl = await _v2CallOpenAI(text, spd);
    } else {
      // Nijivoice 등 수동 안내
      alert(`${api} 음성 생성은 API 연동 후 사용 가능합니다.`);
      _v2Generating[idx] = false;
      _studioS2Step(wrapId);
      return;
    }

    if (typeof vqSaveSceneAudio === 'function') {
      await vqSaveSceneAudio(idx, audioUrl);
    } else {
      if (!_v2Voice.scenes) _v2Voice.scenes = [];
      _v2Voice.scenes[idx] = { audioUrl, duration: 0 };
    }
    proj.voice = _v2Voice;
    _v2Save();

  } catch(err) {
    console.error('음성 생성 오류:', err);
    alert('음성 생성 중 오류:\n' + err.message);
  }

  _v2Generating[idx] = false;
  _studioS2Step(wrapId);
}

async function _v2GenAll(wrapId) {
  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const scenes = proj.scenes || [];
  if (!scenes.length) { alert('대본이 없어요.'); return; }

  for (let i = 0; i < scenes.length; i++) {
    const already = _v2Voice.scenes?.[i]?.audioUrl;
    if (!already) await _v2GenScene(i, wrapId);
  }
}

/* ── ElevenLabs 호출 ── */
async function _v2CallElevenLabs(text, speed) {
  const key    = localStorage.getItem('el_api_key') ||
                 localStorage.getItem('elevenlabs_key') || '';
  const voiceId= _v2Voice.voiceKo || 'EXAVITQu4vr4xnSDxMaL'; // Rachel

  if (!key) {
    alert('ElevenLabs API 키를 설정 탭에서 입력해주세요.');
    throw new Error('No ElevenLabs API key');
  }

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        speed,
      },
    }),
  });

  if (!res.ok) throw new Error(`ElevenLabs 오류: ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/* ── OpenAI TTS 호출 ── */
async function _v2CallOpenAI(text, speed) {
  const key  = localStorage.getItem('openai_key') || '';
  const voice= 'nova'; // 기본 음성

  if (!key) {
    alert('OpenAI API 키를 설정 탭에서 입력해주세요.');
    throw new Error('No OpenAI API key');
  }

  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice,
      speed: Math.min(4.0, Math.max(0.25, speed)),
    }),
  });

  if (!res.ok) throw new Error(`OpenAI TTS 오류: ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/* ════════════════════════════════════════════════
   헬퍼
   ════════════════════════════════════════════════ */
function _v2DefaultVoice(style, lang, lenSec) {
  const rec   = V2_VOICE_RECOMMEND[style] || V2_VOICE_RECOMMEND.emotional;
  const speed = V2_SPEED_RECOMMEND[lenSec] || 1.0;
  const isSenior = style === 'senior';
  const bgm   = V2_BGM_RECOMMEND[style] || 'emotional_piano';

  return {
    api:      'elevenlabs',
    voiceKo:  rec.ko.id,
    voiceJa:  rec.ja.id,
    speed:    isSenior ? Math.max(0.85, speed - 0.1) : speed,
    bgm,
    bgmVol:   30,
    voiceVol: 100,
    scenes:   [],
  };
}

function _v2StyleLabel(style) {
  const map = {
    emotional:'감동', info:'정보', humor:'유머',
    drama:'드라마', senior:'시니어', knowledge:'지식',
  };
  return map[style] || style;
}

function _v2BgmLabel(bgmId) {
  const item = V2_BGM_LIST.find(b => b.id === bgmId);
  return item ? item.label : bgmId;
}

function _v2SpeedHint(lenSec, channel) {
  const base = V2_SPEED_RECOMMEND[lenSec] || 1.0;
  const isSr = (channel||'').includes('시니어') ||
               (channel||'').includes('senior');
  const rec  = isSr ? Math.max(0.85, base - 0.1) : base;
  const hint = isSr ? '시니어 채널' : `${lenSec}초 기준`;
  return `(${hint} 추천: ${rec}×)`;
}

function _v2Save() {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  proj.voice = _v2Voice;
  /* 이슈 2 — STUDIO.project.s2 에 핵심 선택값 동기화 (씬별 음성 생성 시 읽힘) */
  if (!proj.s2) proj.s2 = {};
  proj.s2.provider   = _v2Voice.provider || proj.s2.provider || 'elevenlabs';
  proj.s2.voiceSpeed = _v2Voice.speed    || 1.0;
  proj.s2.voiceVol   = _v2Voice.voiceVol || proj.s2.voiceVol || 100;
  proj.s2.bgmVol     = _v2Voice.bgmVol   || proj.s2.bgmVol   || 30;
  proj.s2.bgm        = _v2Voice.bgm      || proj.s2.bgm      || '';
  /* voice 필드는 _v2ApplyRecommend 에서 langKey 기준으로 설정 */
  if (typeof studioSave === 'function') studioSave();
}

/* ── 추천 그룹 렌더 (한 언어당 후보 2~3개 카드) ── */
function _v2RenderRecGroup(langKey, style, currentVoiceId, wrapId) {
  const flag = langKey === 'ja' ? '🇯🇵' : '🇰🇷';
  const langLabel = langKey === 'ja' ? '일본어' : '한국어';
  const candidates = ((V2_VOICE_RECOMMEND[style] || V2_VOICE_RECOMMEND.emotional)[langKey]) || [];
  if (!candidates.length) return '';
  return `
  <div class="v2-rec-group">
    <div class="v2-rec-group-hd">${flag} ${langLabel} 후보 (${candidates.length}개) — 1개 선택</div>
    <div class="v2-rec-cards">
      ${candidates.map(function(c){
        const isApplied = currentVoiceId === c.id;
        const cdata = encodeURIComponent(JSON.stringify(c));
        return `
        <div class="v2-rec-card ${isApplied?'applied':''}"
          onclick="_v2ApplyRecommend('${langKey}','${c.id}','${wrapId||'studioS2Wrap'}')">
          <div class="v2-rec-card-hd">
            <span class="v2-rec-name">${c.label}</span>
            <span class="v2-rec-provider v2-prov-${c.provider}">${c.provider}</span>
          </div>
          <div class="v2-rec-desc">${c.desc}</div>
          <div class="v2-rec-actions">
            <button type="button" class="v2-rec-preview"
              onclick="event.stopPropagation();_v2PreviewById('${langKey}','${c.id}')">
              ▶ 미리듣기
            </button>
            <button type="button" class="v2-rec-apply ${isApplied?'on':''}"
              onclick="event.stopPropagation();_v2ApplyRecommend('${langKey}','${c.id}','${wrapId||'studioS2Wrap'}')">
              ${isApplied?'✅ 적용됨':'적용'}
            </button>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

/* ── 적용 (이슈 2: 단일 적용 + STUDIO.project.s2 통합 저장) ── */
window._v2ApplyRecommend = function(langKey, voiceId, wid) {
  const proj  = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const style = proj.style || 'emotional';
  const candidates = ((V2_VOICE_RECOMMEND[style] || V2_VOICE_RECOMMEND.emotional)[langKey]) || [];
  const found = candidates.find(function(c){ return c.id === voiceId; }) || candidates[0];
  if (!found) return;
  if (langKey === 'ko') _v2Voice.voiceKo = found.id;
  if (langKey === 'ja') _v2Voice.voiceJa = found.id;
  _v2Voice.provider = found.provider;
  /* 후보 전체와 선택 상세를 STUDIO.project.s2 에 누적 저장 */
  if (!proj.s2) proj.s2 = {};
  proj.s2.voice         = found.id;
  proj.s2.voiceLabel    = found.label;
  proj.s2.voiceLang     = langKey === 'ja' ? 'JP' : 'KR';
  proj.s2.provider      = found.provider;
  proj.s2.voiceSpeed    = _v2Voice.speed || 1.0;
  if (!proj.s2.voiceCandidates) proj.s2.voiceCandidates = {};
  proj.s2.voiceCandidates[langKey] = candidates;
  _v2Save();
  _studioS2Step(wid);
};

/* ── 미리듣기 (s2-voice-preview.js 의 _v2Preview 호출) ── */
window._v2PreviewById = function(langKey, voiceId) {
  const proj  = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const style = proj.style || 'emotional';
  const candidates = ((V2_VOICE_RECOMMEND[style] || V2_VOICE_RECOMMEND.emotional)[langKey]) || [];
  const found = candidates.find(function(c){ return c.id === voiceId; });
  if (!found) return;
  if (typeof window._v2Preview === 'function') {
    window._v2Preview(found, langKey);
  } else {
    alert('🔊 미리듣기 모듈(s2-voice-preview.js)이 로드되지 않았습니다.');
  }
};

/* 추천 카드 클릭 → V2 음성 API 매핑 */
window._v2PickRecommendedProvider = function(providerId) {
  const apiMap = { elevenlabs:'elevenlabs', openaiTts:'openai', nijivoice:'nijivoice', googleTts:'openai', clova:'openai' };
  const apiId = apiMap[providerId] || 'elevenlabs';
  /* 키 확인 — 통합 설정 모달로 안내 */
  if (typeof window.hasProviderKey === 'function' && !window.hasProviderKey('voice', providerId)) {
    if (confirm('이 음성 provider 의 API 키가 없습니다. 통합 API 설정을 열까요?') &&
        typeof window.renderApiSettings === 'function') {
      window.renderApiSettings();
    }
    return;
  }
  _v2Voice = _v2Voice || {};
  _v2Voice.api = apiId;
  /* STUDIO.project 에 추천 목록 저장 */
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  proj.s2 = proj.s2 || {};
  proj.s2.voiceProvider = providerId;
  proj.s2.recommendedVoiceProviders =
    (typeof window.getRecommendedProviders === 'function')
      ? window.getRecommendedProviders('voice', _v2RecTaskKeyForProj(proj)) : [];
  _v2Save();
  _studioS2Step();
};
function _v2RecTaskKeyForProj(proj) {
  const style = proj.style || 'emotional';
  const lang  = proj.lang  || 'both';
  if (lang === 'ja') return 'japanese';
  if (style === 'info' || style === 'knowledge') return 'information';
  if (lang === 'ko') return 'korean';
  return 'seniorEmotion';
}

window._v2ClearScene = function(idx, wid) {
  if (!confirm(`씬${idx+1} 음성을 다시 생성할까요?`)) return;
  if (_v2Voice.scenes) delete _v2Voice.scenes[idx];
  _v2Save();
  _studioS2Step(wid);
};

window._v2Next = function() {
  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const scenes = proj.scenes || [];
  const done   = (_v2Voice.scenes || []).filter(s => s?.audioUrl).length;

  if (done === 0 && scenes.length > 0) {
    if (!confirm('음성이 아직 없어요. 그냥 편집 단계로 넘어갈까요?')) return;
  }
  _v2Save();
  if (typeof studioGoto === 'function') studioGoto(4);
};

/* ── CSS ── */
function _v2InjectCSS() {
  if (document.getElementById('v2-style')) return;
  const st = document.createElement('style');
  st.id = 'v2-style';
  st.textContent = `
.v2-wrap{max-width:680px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.v2-block{background:#fff;border:1.5px solid #f1dce7;border-radius:16px;padding:16px}
.v2-label{font-size:12px;font-weight:800;color:#2b2430;margin-bottom:10px;
  display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.v2-row-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:500px){.v2-row-2{grid-template-columns:1fr}}

/* 추천 배너 */
.v2-recommend-banner{background:linear-gradient(135deg,#fff5f9,#f5f0ff);
  border:1.5px solid #e8d9f5;border-radius:16px;padding:14px}
.v2-rec-hd{font-size:13px;font-weight:800;color:#2b2430;margin-bottom:10px;
  display:flex;align-items:center;gap:8px}
.v2-rec-badge{padding:3px 10px;background:#9181ff;color:#fff;border-radius:20px;
  font-size:11px;font-weight:700}
.v2-rec-voices{display:flex;flex-direction:column;gap:8px}
.v2-rec-voice{display:flex;align-items:center;gap:10px;padding:10px;
  background:#fff;border-radius:12px;border:1.5px solid #f1dce7}
.v2-rec-flag{font-size:20px;flex-shrink:0}
.v2-rec-info{flex:1}
.v2-rec-name{font-size:13px;font-weight:800;display:flex;align-items:center;gap:6px}
.v2-rec-provider{font-size:10px;padding:2px 6px;background:#f1dce7;border-radius:20px;color:#7b7077}
.v2-rec-desc{font-size:11px;color:#9b8a93;margin-top:2px}
.v2-rec-apply{padding:6px 14px;border:1.5px solid #9181ff;border-radius:20px;
  background:#fff;color:#9181ff;font-size:11px;font-weight:800;cursor:pointer;transition:.12s}
.v2-rec-apply.applied{background:#9181ff;color:#fff}
.v2-rec-apply:hover:not(.applied){background:#9181ff;color:#fff}

/* 추천 후보 카드 그리드 (이슈 1) */
.v2-rec-group{margin-bottom:12px}
.v2-rec-group:last-child{margin-bottom:0}
.v2-rec-group-hd{font-size:12px;font-weight:700;color:#5a4a56;margin-bottom:8px;
  padding:4px 0;border-bottom:1px dashed #f1dce7}
.v2-rec-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
@media(max-width:600px){.v2-rec-cards{grid-template-columns:repeat(2,1fr)}}
@media(max-width:420px){.v2-rec-cards{grid-template-columns:1fr}}
.v2-rec-card{position:relative;display:flex;flex-direction:column;gap:6px;
  padding:12px 10px;background:#fff;border:1.5px solid #f1dce7;border-radius:12px;
  cursor:pointer;transition:.14s}
.v2-rec-card:hover{border-color:#9181ff;background:#fbf7ff;transform:translateY(-1px)}
.v2-rec-card.applied{border-color:#ef6fab;background:linear-gradient(135deg,#fff1f8,#f5f0ff);
  box-shadow:0 2px 10px rgba(239,111,171,.18)}
.v2-rec-card-hd{display:flex;align-items:center;gap:6px;justify-content:space-between}
.v2-rec-card .v2-rec-name{font-size:13px;font-weight:800;color:#2b2430}
.v2-rec-card .v2-rec-provider{font-size:10px;padding:2px 7px;border-radius:20px;font-weight:700}
.v2-prov-EL{background:#ede9ff;color:#5b4ecf}
.v2-prov-OA{background:#e0f2fe;color:#0369a1}
.v2-prov-NJ{background:#fff1f8;color:#c0357a}
.v2-prov-CV{background:#f0fdf4;color:#16a34a}
.v2-rec-card .v2-rec-desc{font-size:11px;color:#7b7077;line-height:1.4;min-height:32px}
.v2-rec-actions{display:flex;gap:4px;margin-top:auto}
.v2-rec-preview{flex:1;padding:5px 8px;border:1.5px solid #f1dce7;border-radius:8px;
  background:#fff;font-size:10.5px;font-weight:700;color:#5a4a56;cursor:pointer;
  transition:.12s;font-family:inherit}
.v2-rec-preview:hover{border-color:#9181ff;color:#9181ff}
.v2-rec-card .v2-rec-apply{flex:1;padding:5px 8px;font-size:10.5px;text-align:center}
.v2-rec-card .v2-rec-apply.on{background:#ef6fab;color:#fff;border-color:#ef6fab}

/* 세그 */
.v2-seg{display:flex;gap:4px;flex-wrap:wrap}
.v2-seg-btn{padding:5px 10px;border:1.5px solid #f1dce7;border-radius:8px;
  background:#fff;font-size:11px;font-weight:700;color:#7b7077;cursor:pointer;transition:.12s}
.v2-seg-btn.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}

/* 속도 */
.v2-speed-hint{font-size:10px;color:#9b8a93;font-weight:400}
.v2-speed-row{display:flex;gap:3px;flex-wrap:wrap}
.v2-speed-btn{padding:5px 8px;border:1.5px solid #f1dce7;border-radius:8px;
  background:#fff;font-size:11px;font-weight:700;cursor:pointer;transition:.12s;color:#5a4a56}
.v2-speed-btn.on{background:#ef6fab;color:#fff;border-color:#ef6fab}

/* 씬 */
.v2-gen-all-btn{margin-left:auto;padding:4px 12px;border:1.5px solid #9181ff;
  border-radius:20px;background:#fff;color:#9181ff;font-size:11px;font-weight:800;cursor:pointer}
.v2-no-scenes{text-align:center;padding:24px;color:#9b8a93;font-size:13px}
.v2-go-step{display:block;margin:10px auto 0;padding:8px 20px;border:1.5px solid #ef6fab;
  border-radius:20px;background:#fff;color:#ef6fab;font-weight:800;cursor:pointer}
.v2-scenes{display:flex;flex-direction:column;gap:8px}
.v2-scene-card{border:1.5px solid #f1dce7;border-radius:12px;padding:12px;
  background:#fbf7f9;transition:.12s}
.v2-scene-card.done{border-color:#9181ff;background:#f5f0ff}
.v2-scene-hd{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.v2-scene-num{width:22px;height:22px;border-radius:50%;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;
  flex-shrink:0}
.v2-scene-label{flex:1;font-size:12px;font-weight:800;color:#2b2430}
.v2-scene-status{font-size:11px;color:#9b8a93}
.v2-scene-text{font-size:12px;color:#7b7077;margin-bottom:8px;line-height:1.5}
.v2-scene-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.v2-audio{height:32px;flex:1;min-width:160px}
.v2-gen-btn{padding:7px 16px;border:none;border-radius:10px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-size:12px;font-weight:800;cursor:pointer;transition:.14s}
.v2-gen-btn.loading{opacity:.6;cursor:not-allowed}
.v2-mini-btn{padding:5px 12px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:11px;font-weight:700;cursor:pointer;transition:.12s}
.v2-mini-btn.danger{border-color:#fca5a5;color:#dc2626}

/* BGM (이슈 4 — 세로형 카드 + 라디오 우상단) */
.v2-bgm-rec{font-size:10px;color:#9b8a93;font-weight:400}
.v2-bgm-list{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px}
@media(max-width:500px){.v2-bgm-list{grid-template-columns:1fr}}
.v2-bgm-item{position:relative;display:flex;flex-direction:column;align-items:flex-start;
  gap:4px;padding:14px 12px 12px;border:1.5px solid #f1dce7;border-radius:12px;
  cursor:pointer;transition:.12s;background:#fff;min-height:64px}
.v2-bgm-item:hover{border-color:#9181ff;background:#fbf7ff}
.v2-bgm-item.on{border-color:#9181ff;background:#ede9ff;box-shadow:0 2px 8px rgba(145,129,255,.15)}
.v2-bgm-item input[type="radio"]{position:absolute;top:8px;right:8px;
  width:14px;height:14px;margin:0;cursor:pointer;accent-color:#9181ff}
.v2-bgm-label{font-size:13px;font-weight:800;color:#2b2430;line-height:1.3;
  padding-right:24px}
.v2-bgm-desc{font-size:11px;color:#9b8a93;line-height:1.4}
.v2-vol-rows{display:flex;flex-direction:column;gap:8px}
.v2-vol-row{display:flex;align-items:center;gap:10px}
.v2-vol-row span:first-child{font-size:11px;font-weight:700;min-width:64px}
.v2-vol-row input[type=range]{flex:1}
.v2-vol-row span:last-child{font-size:11px;color:#9b8a93;min-width:36px;text-align:right}

/* 고급 */
.v2-advanced{border:1.5px solid #f1dce7;border-radius:12px;padding:12px}
.v2-advanced summary{font-size:12px;font-weight:700;cursor:pointer;color:#9b8a93}

/* 하단 */
.v2-footer{display:flex;gap:8px}
.v2-skip-btn{padding:12px 16px;border:1.5px solid #f1dce7;border-radius:12px;
  background:#fff;font-size:12px;font-weight:700;cursor:pointer;color:#9b8a93}
.v2-next-btn{flex:1;padding:12px;border:none;border-radius:12px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-size:14px;font-weight:900;cursor:pointer}
`;
  document.head.appendChild(st);
}
