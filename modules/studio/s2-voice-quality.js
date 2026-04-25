/* ================================================
   modules/studio/s2-voice-quality.js
   음성 품질 강화

   - 음성 Base64 저장 (세션 소멸 방지)
   - 음성 길이 기반 씬 duration 자동 계산
   - BGM/음성 충돌 체크
   - 발음 검수 (한국어/일본어)
   - 품질 점수 연동
   ================================================ */

/* ── 발음 사전 ── */
const VQ_HARD_KO = [
  { word:'낙관적', easy:'긍정적인' },
  { word:'귀추', easy:'결과' },
  { word:'창출', easy:'만들기' },
  { word:'도출', easy:'찾아내기' },
  { word:'지양', easy:'피하기' },
  { word:'지향', easy:'목표로 하기' },
  { word:'항산화', easy:'노화 방지' },
  { word:'혈당', easy:'혈당 수치' },
];

const VQ_HARD_JA = [
  { word:'熟慮', easy:'よく考えること', furigana:'じゅくりょ' },
  { word:'頓挫', easy:'うまくいかなくなること', furigana:'とんざ' },
  { word:'乖離', easy:'ずれること', furigana:'かいり' },
  { word:'醸成', easy:'育てること', furigana:'じょうせい' },
  { word:'逡巡', easy:'ためらうこと', furigana:'しゅんじゅん' },
];

/* ── 음성 볼륨 충돌 기준 ── */
const VQ_VOLUME_RULES = {
  voiceMin: 80,   // 음성 최소 볼륨
  bgmMax:   40,   // BGM 최대 볼륨 (음성 있을 때)
  bgmHook:  25,   // 훅 씬 BGM (더 낮게)
  bgmCTA:   20,   // CTA 씬 BGM (가장 낮게)
};

/* ════════════════════════════════════════════════
   Base64 저장/로드
   ════════════════════════════════════════════════ */

/**
 * ObjectURL → Base64 변환 후 localStorage 저장
 * 세션 소멸 후에도 유지
 */
async function vqSaveAudioBase64(audioUrl, key) {
  try {
    const res  = await fetch(audioUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const b64 = reader.result;
        try {
          localStorage.setItem(`vq_audio_${key}`, b64);
          resolve(b64);
        } catch(e) {
          // localStorage 용량 초과 시 session 저장
          sessionStorage.setItem(`vq_audio_${key}`, b64);
          resolve(b64);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch(e) {
    console.error('음성 Base64 저장 오류:', e);
    return null;
  }
}

/**
 * Base64 → ObjectURL 변환 (재생용)
 */
function vqLoadAudioUrl(key) {
  const b64 = localStorage.getItem(`vq_audio_${key}`) ||
              sessionStorage.getItem(`vq_audio_${key}`);
  if (!b64) return null;
  try {
    const arr    = b64.split(',');
    const mime   = arr[0].match(/:(.*?);/)[1];
    const bstr   = atob(arr[1]);
    const u8arr  = new Uint8Array(bstr.length);
    for (let i=0; i<bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    const blob   = new Blob([u8arr], { type: mime });
    return URL.createObjectURL(blob);
  } catch(e) {
    return null;
  }
}

/**
 * 씬 음성 저장 (Base64 포함)
 */
async function vqSaveSceneAudio(sceneIdx, audioUrl) {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  if (!proj.voice) proj.voice = { scenes: [] };
  if (!proj.voice.scenes) proj.voice.scenes = [];

  // Base64 저장
  const b64 = await vqSaveAudioBase64(audioUrl, `scene_${sceneIdx}`);

  // duration 계산
  const duration = await vqGetAudioDuration(audioUrl);

  proj.voice.scenes[sceneIdx] = {
    audioUrl,   // ObjectURL (현재 세션)
    base64Key: `scene_${sceneIdx}`, // 영구 저장 키
    duration,
  };

  // 씬에도 duration 저장
  if (proj.scenes?.[sceneIdx]) {
    proj.scenes[sceneIdx].audioDuration = duration;
  }

  // 총 duration 업데이트
  const totalDuration = (proj.voice.scenes || [])
    .reduce((a, s) => a + (s?.duration || 0), 0);
  proj.voice.totalDuration = totalDuration;

  // 품질 계산
  if (typeof sqCalcVoice === 'function') {
    sqCalcVoice(proj.voice, proj.scenes || []);
  }

  if (typeof studioSave === 'function') studioSave();

  return { audioUrl, duration, base64: !!b64 };
}

/**
 * 음성 파일 길이 측정 (AudioContext 기반)
 */
function vqGetAudioDuration(audioUrl) {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src   = audioUrl;
    audio.addEventListener('loadedmetadata', () => {
      resolve(Math.round(audio.duration * 10) / 10);
    });
    audio.addEventListener('error', () => resolve(0));
    setTimeout(() => resolve(0), 5000); // 타임아웃
  });
}

/**
 * 영구 저장된 음성 복원 (페이지 새로고침 후)
 */
function vqRestoreAudioUrls() {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const scenes = proj.voice?.scenes || [];

  scenes.forEach((s, i) => {
    if (!s?.audioUrl && s?.base64Key) {
      const url = vqLoadAudioUrl(s.base64Key);
      if (url && proj.voice.scenes[i]) {
        proj.voice.scenes[i].audioUrl = url;
      }
    }
  });
}

/* ════════════════════════════════════════════════
   발음 검수
   ════════════════════════════════════════════════ */
function vqCheckPronunciation(text, lang) {
  const dict   = lang === 'ja' ? VQ_HARD_JA : VQ_HARD_KO;
  const issues = [];

  dict.forEach(item => {
    if (text.includes(item.word)) {
      issues.push({
        word:     item.word,
        easy:     item.easy,
        furigana: item.furigana || null,
      });
    }
  });

  return issues;
}

/**
 * 발음 검수 UI 렌더
 */
function vqRenderPronCheck(text, lang, wrapId) {
  const issues = vqCheckPronunciation(text, lang);
  if (issues.length === 0) return '<div class="vq-pron-ok">✅ 발음 검수 통과</div>';

  return `
  <div class="vq-pron-issues">
    <div class="vq-pron-title">⚠️ 어려운 단어 감지 — 쉬운 표현으로 바꾸세요</div>
    ${issues.map(i=>`
      <div class="vq-pron-item">
        <span class="vq-pron-word">${i.word}</span>
        <span class="vq-pron-arrow">→</span>
        <span class="vq-pron-easy">${i.easy}</span>
        ${i.furigana ? `<span class="vq-pron-furi">(${i.furigana})</span>` : ''}
        <button class="vq-pron-apply"
          onclick="vqApplyPron('${i.word}','${i.easy}','${wrapId}')">
          적용
        </button>
      </div>
    `).join('')}
  </div>`;
}

window.vqApplyPron = function(word, easy, wrapId) {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  if (proj.scriptText) {
    proj.scriptText = proj.scriptText.replaceAll(word, easy);
  }
  if (proj.scenes) {
    proj.scenes.forEach(s => {
      if (s.text) s.text = s.text.replaceAll(word, easy);
    });
  }
  if (typeof studioSave === 'function') studioSave();
  alert(`'${word}'을 '${easy}'으로 변경했어요.`);
};

/* ════════════════════════════════════════════════
   BGM/음성 충돌 체크
   ════════════════════════════════════════════════ */
function vqCheckVolumeConflict(voice) {
  const issues  = [];
  const voiceVol= voice.voiceVol || 100;
  const bgmVol  = voice.bgmVol   || 30;
  const bgm     = voice.bgm      || 'none';

  if (voiceVol < VQ_VOLUME_RULES.voiceMin) {
    issues.push({
      level: 'error',
      msg: `음성 볼륨(${voiceVol}%)이 너무 낮아요. ${VQ_VOLUME_RULES.voiceMin}% 이상 권장`,
    });
  }
  if (bgm !== 'none' && bgmVol > VQ_VOLUME_RULES.bgmMax) {
    issues.push({
      level: 'warn',
      msg: `BGM 볼륨(${bgmVol}%)이 높아요. ${VQ_VOLUME_RULES.bgmMax}% 이하 권장`,
    });
  }
  if (bgmVol > voiceVol * 0.5) {
    issues.push({
      level: 'warn',
      msg: 'BGM이 음성보다 너무 커요. 음성이 묻힐 수 있어요.',
    });
  }

  return issues;
}

function vqRenderVolumeCheck(voice) {
  const issues = vqCheckVolumeConflict(voice);
  if (issues.length === 0) return '<div class="vq-vol-ok">✅ 볼륨 밸런스 양호</div>';

  return `
  <div class="vq-vol-issues">
    ${issues.map(i=>`
      <div class="vq-vol-item ${i.level}">
        ${i.level==='error'?'🔴':'🟡'} ${i.msg}
      </div>
    `).join('')}
    <button class="vq-vol-fix" onclick="vqAutoFixVolume()">
      🔧 자동 볼륨 최적화
    </button>
  </div>`;
}

window.vqAutoFixVolume = function() {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  if (!proj.voice) proj.voice = {};
  proj.voice.voiceVol = 100;
  proj.voice.bgmVol   = 25;
  if (typeof studioSave === 'function') studioSave();
  alert('✅ 볼륨 자동 최적화 완료!\n음성: 100% / BGM: 25%로 설정했어요.');
};

/* ════════════════════════════════════════════════
   씬 duration 기반 영상 길이 계산
   ════════════════════════════════════════════════ */
function vqCalcVideoDuration(proj) {
  const voiceScenes = proj.voice?.scenes || [];
  const scenes      = proj.scenes || [];

  // 음성 길이 있으면 그 합산
  const totalFromVoice = voiceScenes.reduce((a,s) => a + (s?.duration||0), 0);
  if (totalFromVoice > 0) return totalFromVoice;

  // 없으면 설정값 사용
  return proj.lengthSec || 60;
}

function vqRenderDurationInfo(proj) {
  const total = vqCalcVideoDuration(proj);
  const scenes = proj.scenes || [];
  const perScene = scenes.length > 0 ? Math.round(total / scenes.length * 10) / 10 : 0;

  return `
  <div class="vq-duration-info">
    <div class="vq-dur-row">
      <span>예상 총 영상 길이</span>
      <strong>${total}초 (${Math.floor(total/60)}분 ${total%60}초)</strong>
    </div>
    <div class="vq-dur-row">
      <span>씬 평균 길이</span>
      <strong>${perScene}초/씬</strong>
    </div>
    <div class="vq-dur-row">
      <span>씬 수</span>
      <strong>${scenes.length}개</strong>
    </div>
    ${total > 70 && total < 50 ? `
    <div class="vq-dur-warn">
      ⚠️ 유튜브 쇼츠 기준 60초 초과 — 일부 씬 줄이기 권장
    </div>` : ''}
  </div>`;
}

/* ════════════════════════════════════════════════
   CSS
   ════════════════════════════════════════════════ */
(function vqInjectCSS() {
  if (document.getElementById('vq-style')) return;
  const st = document.createElement('style');
  st.id = 'vq-style';
  st.textContent = `
.vq-pron-ok,.vq-vol-ok{font-size:12px;color:#16a34a;padding:6px;
  background:#f0fdf4;border-radius:8px}
.vq-pron-issues,.vq-vol-issues{background:#fff8f0;border-radius:10px;padding:10px}
.vq-pron-title{font-size:12px;font-weight:700;color:#d97706;margin-bottom:8px}
.vq-pron-item{display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;flex-wrap:wrap}
.vq-pron-word{font-weight:800;color:#dc2626;background:#fff1f1;
  border-radius:4px;padding:2px 6px}
.vq-pron-arrow{color:#9b8a93}
.vq-pron-easy{font-weight:700;color:#16a34a}
.vq-pron-furi{font-size:10px;color:#9b8a93}
.vq-pron-apply{padding:2px 8px;border:1px solid #9181ff;border-radius:20px;
  background:#fff;color:#9181ff;font-size:10px;cursor:pointer}
.vq-vol-item{font-size:12px;padding:5px 0}
.vq-vol-item.error{color:#dc2626}
.vq-vol-item.warn{color:#d97706}
.vq-vol-fix{margin-top:8px;padding:6px 14px;border:none;border-radius:8px;
  background:#9181ff;color:#fff;font-size:12px;font-weight:700;cursor:pointer}
.vq-duration-info{background:#f9f3fb;border-radius:10px;padding:10px}
.vq-dur-row{display:flex;justify-content:space-between;font-size:12px;
  padding:4px 0;color:#5a4a56}
.vq-dur-row strong{font-weight:800;color:#2b2430}
.vq-dur-warn{font-size:11px;color:#d97706;margin-top:6px;
  background:#fffbeb;border-radius:6px;padding:4px 8px}
`;
  document.head.appendChild(st);
})();

/* 전역 노출 */
window.vqSaveSceneAudio     = vqSaveSceneAudio;
window.vqLoadAudioUrl       = vqLoadAudioUrl;
window.vqRestoreAudioUrls   = vqRestoreAudioUrls;
window.vqCheckPronunciation = vqCheckPronunciation;
window.vqRenderPronCheck    = vqRenderPronCheck;
window.vqCheckVolumeConflict= vqCheckVolumeConflict;
window.vqRenderVolumeCheck  = vqRenderVolumeCheck;
window.vqCalcVideoDuration  = vqCalcVideoDuration;
window.vqRenderDurationInfo = vqRenderDurationInfo;
window.vqGetAudioDuration   = vqGetAudioDuration;
