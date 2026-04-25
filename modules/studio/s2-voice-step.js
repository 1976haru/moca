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

/* ── 음성 추천 매핑 ── */
const V2_VOICE_RECOMMEND = {
  emotional: {
    ko: { id:'rachel', label:'Rachel',  provider:'EL', desc:'따뜻함·감성 최적' },
    ja: { id:'haruka', label:'Haruka',  provider:'NJ', desc:'시니어 감성 일본어' },
  },
  info: {
    ko: { id:'adam',   label:'Adam',    provider:'EL', desc:'차분·신뢰감' },
    ja: { id:'kenji',  label:'Kenji',   provider:'NJ', desc:'정보형 일본어' },
  },
  humor: {
    ko: { id:'grace',  label:'Grace',   provider:'EL', desc:'밝고 경쾌' },
    ja: { id:'yuki',   label:'Yuki',    provider:'NJ', desc:'활기찬 일본어' },
  },
  drama: {
    ko: { id:'josh',   label:'Josh',    provider:'EL', desc:'깊고 묵직한' },
    ja: { id:'takeshi',label:'Takeshi', provider:'NJ', desc:'드라마틱 일본어' },
  },
  senior: {
    ko: { id:'rachel', label:'Rachel',  provider:'EL', desc:'시니어 채널 최적' },
    ja: { id:'sachiko',label:'Sachiko', provider:'NJ', desc:'시니어 일본어 최적' },
  },
  knowledge: {
    ko: { id:'adam',   label:'Adam',    provider:'EL', desc:'전문적·차분' },
    ja: { id:'kenji',  label:'Kenji',   provider:'NJ', desc:'교양 일본어' },
  },
};

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

  wrap.innerHTML = `
  <div class="v2-wrap">

    <!-- AI 자동 추천 배너 -->
    <div class="v2-recommend-banner">
      <div class="v2-rec-hd">
        🤖 AI 음성 자동 추천
        <span class="v2-rec-badge">장르: ${_v2StyleLabel(style)}</span>
      </div>
      <div class="v2-rec-voices">
        ${lang !== 'ja' ? `
        <div class="v2-rec-voice">
          <span class="v2-rec-flag">🇰🇷</span>
          <div class="v2-rec-info">
            <div class="v2-rec-name">${rec.ko.label}
              <span class="v2-rec-provider">${rec.ko.provider}</span>
            </div>
            <div class="v2-rec-desc">${rec.ko.desc}</div>
          </div>
          <button class="v2-rec-apply ${_v2Voice.voiceKo===rec.ko.id?'applied':''}"
            onclick="_v2ApplyRecommend('ko','${wrapId||'studioS2Wrap'}')">
            ${_v2Voice.voiceKo===rec.ko.id?'✅ 적용됨':'적용'}
          </button>
        </div>` : ''}
        ${lang !== 'ko' ? `
        <div class="v2-rec-voice">
          <span class="v2-rec-flag">🇯🇵</span>
          <div class="v2-rec-info">
            <div class="v2-rec-name">${rec.ja.label}
              <span class="v2-rec-provider">${rec.ja.provider}</span>
            </div>
            <div class="v2-rec-desc">${rec.ja.desc}</div>
          </div>
          <button class="v2-rec-apply ${_v2Voice.voiceJa===rec.ja.id?'applied':''}"
            onclick="_v2ApplyRecommend('ja','${wrapId||'studioS2Wrap'}')">
            ${_v2Voice.voiceJa===rec.ja.id?'✅ 적용됨':'적용'}
          </button>
        </div>` : ''}
      </div>
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

    <!-- 기존 화자 설정 (고급) -->
    <details class="v2-advanced">
      <summary>⚙️ 고급 화자 설정 (기존 기능)</summary>
      <div id="v2AdvancedInner">
        ${typeof _studioS4 === 'function' ? '' : '기존 s2-voice.js 함수를 로드해주세요.'}
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

    if (!_v2Voice.scenes) _v2Voice.scenes = [];
    _v2Voice.scenes[idx] = { audioUrl, duration: 0 };
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
  if (typeof studioSave === 'function') studioSave();
}

window._v2ApplyRecommend = function(langKey, wid) {
  const proj  = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const style = proj.style || 'emotional';
  const rec   = V2_VOICE_RECOMMEND[style] || V2_VOICE_RECOMMEND.emotional;
  if (langKey === 'ko') _v2Voice.voiceKo = rec.ko.id;
  if (langKey === 'ja') _v2Voice.voiceJa = rec.ja.id;
  _v2Save();
  _studioS2Step(wid);
};

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

/* BGM */
.v2-bgm-rec{font-size:10px;color:#9b8a93;font-weight:400}
.v2-bgm-list{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-bottom:12px}
@media(max-width:500px){.v2-bgm-list{grid-template-columns:1fr}}
.v2-bgm-item{display:flex;align-items:center;gap:8px;padding:8px;
  border:1.5px solid #f1dce7;border-radius:10px;cursor:pointer;transition:.12s}
.v2-bgm-item.on{border-color:#9181ff;background:#ede9ff}
.v2-bgm-label{font-size:12px;font-weight:700}
.v2-bgm-desc{font-size:10px;color:#9b8a93}
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
