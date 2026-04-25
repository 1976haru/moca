/* ================================================
   modules/studio/studio-quality.js
   품질 점수판 + 단계별 확정 게이트

   - STUDIO.project.quality 구조 관리
   - 단계별 품질 점수 계산
   - 확정 게이트 UI
   - 최종 통합 품질 대시보드
   ================================================ */

/* ── 품질 기본 구조 ── */
const SQ_DEFAULT = {
  script: {
    score:0, hook:0, clarity:0, cta:0, risk:100,
    confirmed:false, issues:[]
  },
  image: {
    score:0, sceneMatch:0, consistency:0, ratio:0,
    confirmed:false, issues:[]
  },
  videoPrompt: {
    score:0, actionDetail:0, camera:0, toolFit:0,
    confirmed:false, issues:[]
  },
  voice: {
    score:0, pronunciation:0, emotion:0, speed:0, volume:0,
    duration:0,
    confirmed:false, issues:[]
  },
  edit: {
    score:0, captionReadability:0, hookVisual:0,
    thumbnailCtr:0, pacing:0,
    confirmed:false, issues:[]
  },
};

/* ── 단계별 라벨 ── */
const SQ_STEP_LABELS = {
  script:      { label:'대본',         step:1, ico:'📝' },
  image:       { label:'이미지/소스',  step:2, ico:'🖼' },
  videoPrompt: { label:'영상 프롬프트',step:2, ico:'🎬' },
  voice:       { label:'음성·BGM',     step:3, ico:'🎙' },
  edit:        { label:'편집',         step:4, ico:'✂️' },
};

/* ════════════════════════════════════════════════
   품질 초기화 / 가져오기
   ════════════════════════════════════════════════ */
function sqInit() {
  const proj = _sqProj();
  if (!proj.quality) proj.quality = JSON.parse(JSON.stringify(SQ_DEFAULT));
  return proj.quality;
}

function sqGet(key) {
  const q = sqInit();
  return key ? (q[key] || {}) : q;
}

function sqSave() {
  if (typeof studioSave === 'function') studioSave();
}

function _sqProj() {
  return (typeof STUDIO !== 'undefined' && STUDIO.project) ? STUDIO.project : {};
}

/* ════════════════════════════════════════════════
   품질 점수 업데이트
   ════════════════════════════════════════════════ */
function sqUpdate(key, data) {
  const q = sqInit();
  if (!q[key]) q[key] = JSON.parse(JSON.stringify(SQ_DEFAULT[key]||{}));
  Object.assign(q[key], data);
  // 평균 점수 계산
  const scoreKeys = Object.keys(data).filter(k =>
    k !== 'score' && k !== 'confirmed' && k !== 'issues' &&
    typeof data[k] === 'number'
  );
  if (scoreKeys.length > 0) {
    q[key].score = Math.round(scoreKeys.reduce((a,k) => a + (q[key][k]||0), 0) / scoreKeys.length);
  }
  sqSave();
  return q[key];
}

/* ── 대본 품질 자동 계산 ── */
function sqCalcScript(script, scenes) {
  if (!script) return sqUpdate('script', { score:0, hook:0, clarity:0, cta:0, risk:100, issues:['대본 없음'] });

  const hookPat   = /지금|당장|멈추|충격|비밀|모르면|후회|%|위험|경고|이거|알아야|중요/;
  const ctaPat    = /구독|좋아요|댓글|알림|팔로|눌러|부탁/;
  const riskPat   = /반드시\s*치료|보장됩니다|\d+배\s*수익|\d+일\s*만에\s*살/;
  const hardPat   = /절대적|반드시|100%|확실/;

  const first3    = script.slice(0, 150);
  const hook      = hookPat.test(first3) ? 88 : 45;
  const cta       = ctaPat.test(script) ? 85 : 30;
  const risk      = riskPat.test(script) ? 40 : hardPat.test(script) ? 70 : 95;
  const clarity   = script.length > 200 ? 75 : 50;
  const issues    = [];
  if (hook < 60)    issues.push('훅이 약해요 — 첫 문장 강화 필요');
  if (cta < 60)     issues.push('CTA 없음 — 구독/좋아요 유도 문구 추가');
  if (risk < 60)    issues.push('과장 표현 감지 — 수정 필요');
  if (!scenes?.length) issues.push('씬 분리 안 됨');

  return sqUpdate('script', { hook, clarity, cta, risk, issues });
}

/* ── 이미지 품질 자동 계산 ── */
function sqCalcImage(scenes) {
  if (!scenes?.length) return sqUpdate('image', { score:0, issues:['씬 없음'] });

  const hasImg     = scenes.filter(s => s.imageUrl || s.img).length;
  const sceneMatch = Math.round(hasImg / scenes.length * 100);
  const ratio      = 100; // 비율 체크는 실제 이미지 로드 시
  const consistency= hasImg >= 3 ? 70 : hasImg >= 1 ? 50 : 0;
  const issues     = [];
  if (sceneMatch < 60) issues.push(`이미지 ${scenes.length - hasImg}개 씬 미생성`);
  if (consistency < 60) issues.push('캐릭터 일관성 확인 필요');

  return sqUpdate('image', { sceneMatch, consistency, ratio, issues });
}

/* ── 영상 프롬프트 품질 ── */
function sqCalcVideoPrompt(videoPrompts) {
  if (!videoPrompts?.length) {
    return sqUpdate('videoPrompt', { score:0, issues:['영상 프롬프트 없음'] });
  }
  const sample = videoPrompts[0]?.prompt || '';
  const hasCamera = /zoom|pan|static|handheld|slowly/i.test(sample);
  const hasAction = /walking|sitting|looking|standing|moving/i.test(sample);
  const hasDuration= /\d+\s*seconds?/.test(sample);
  const hasRatio  = /9:16|16:9|vertical|horizontal/.test(sample);

  const camera      = hasCamera   ? 85 : 40;
  const actionDetail= hasAction   ? 80 : 35;
  const toolFit     = hasDuration && hasRatio ? 85 : 50;
  const issues      = [];
  if (!hasCamera)    issues.push('카메라 무빙 미설정');
  if (!hasAction)    issues.push('인물 행동 구체성 부족');
  if (!hasDuration)  issues.push('장면 길이 미지정');
  if (!hasRatio)     issues.push('화면 비율 미지정');

  return sqUpdate('videoPrompt', { camera, actionDetail, toolFit, issues });
}

/* ── 음성 품질 ── */
function sqCalcVoice(voice, scenes) {
  if (!voice) return sqUpdate('voice', { score:0, issues:['음성 설정 없음'] });

  const voiceScenes = voice.scenes || [];
  const doneCount   = voiceScenes.filter(s => s?.audioUrl || s?.base64).length;
  const totalCount  = scenes?.length || 1;
  const pronunciation = 75; // 실제 검수는 s2-voice-quality.js에서
  const emotion     = voice.speed ? (voice.speed >= 0.85 && voice.speed <= 1.2 ? 80 : 55) : 50;
  const speed       = voice.speed ? 80 : 50;
  const volume      = (voice.voiceVol >= 80 && voice.bgmVol <= 40) ? 85 : 65;
  const duration    = voiceScenes.reduce((a,s) => a + (s?.duration||0), 0);
  const issues      = [];
  if (doneCount < totalCount) issues.push(`음성 ${totalCount-doneCount}개 씬 미생성`);
  if (!voice.bgm || voice.bgm === 'none') issues.push('BGM 미설정');
  if (voice.bgmVol > 50) issues.push('BGM 볼륨이 너무 높음');

  return sqUpdate('voice', { pronunciation, emotion, speed, volume, duration, issues });
}

/* ── 편집 품질 ── */
function sqCalcEdit(edit, strategy) {
  if (!edit) return sqUpdate('edit', { score:50, issues:['편집 설정 없음'] });

  const captionReadability = edit.caption?.size === 'xl' ? 90 :
                             edit.caption?.size === 'lg' ? 80 : 65;
  const hookVisual   = strategy?.hookIdx !== null && strategy?.hookIdx !== undefined ? 85 : 55;
  const thumbnailCtr = edit.thumb?.A?.text ? 80 : 45;
  const pacing       = edit.compose?.template ? 75 : 55;
  const issues       = [];
  if (captionReadability < 70) issues.push('자막 크기 키우기 권장 (시니어)');
  if (hookVisual < 60)         issues.push('훅 개선안 미적용');
  if (thumbnailCtr < 60)       issues.push('썸네일 텍스트 없음');

  return sqUpdate('edit', { captionReadability, hookVisual, thumbnailCtr, pacing, issues });
}

/* ════════════════════════════════════════════════
   확정 게이트 UI
   ════════════════════════════════════════════════ */
function sqRenderGate(key, onConfirm, onNext) {
  const q     = sqGet(key);
  const score = q.score || 0;
  const info  = SQ_STEP_LABELS[key] || { label:key, ico:'📋' };

  const level = score >= 80 ? 'good' : score >= 60 ? 'warn' : 'bad';
  const msg   = score >= 80 ? '확정하고 다음 단계로 진행하세요'
              : score >= 60 ? '재생성을 추천하지만 진행도 가능해요'
              : '재생성이 필요해요';

  return `
  <div class="sq-gate sq-gate-${level}">
    <div class="sq-gate-hd">
      <div class="sq-gate-score-wrap">
        <div class="sq-gate-score sq-score-${level}">${score}</div>
        <div class="sq-gate-label">${info.ico} ${info.label} 품질</div>
      </div>
      <div class="sq-gate-bar-wrap">
        <div class="sq-gate-bar">
          <div class="sq-gate-fill sq-fill-${level}" style="width:${score}%"></div>
        </div>
        <div class="sq-gate-msg">${msg}</div>
      </div>
    </div>

    ${(q.issues||[]).length > 0 ? `
    <div class="sq-gate-issues">
      ${q.issues.map(i=>`<div class="sq-issue">⚠️ ${i}</div>`).join('')}
    </div>` : ''}

    <div class="sq-gate-btns">
      ${score >= 80 ? `
        <button class="sq-btn-confirm" onclick="${onConfirm}">
          ✅ 확정하고 다음 단계 →
        </button>
      ` : score >= 60 ? `
        <button class="sq-btn-regen" onclick="sqOpenRegen('${key}')">
          🔄 재생성 추천
        </button>
        <button class="sq-btn-next" onclick="${onNext}">
          그래도 진행 →
        </button>
      ` : `
        <button class="sq-btn-regen bad" onclick="sqOpenRegen('${key}')">
          ❌ 재생성 필요
        </button>
        <button class="sq-btn-skip" onclick="${onNext}">
          강제 진행 ⚠️
        </button>
      `}
    </div>

    ${q.confirmed ? '<div class="sq-confirmed">✅ 확정됨</div>' : ''}
  </div>`;
}

window.sqOpenRegen = function(key) {
  const stepMap = { script:1, image:2, videoPrompt:2, voice:3, edit:4 };
  const step    = stepMap[key] || 1;
  if (confirm(`${SQ_STEP_LABELS[key]?.label||key} 단계로 이동해서 재생성할까요?`)) {
    if (typeof studioGoto === 'function') studioGoto(step);
  }
};

window.sqConfirm = function(key, nextStep) {
  const q = sqGet(key);
  q.confirmed = true;
  sqSave();
  if (nextStep && typeof studioGoto === 'function') studioGoto(nextStep);
};

/* ════════════════════════════════════════════════
   통합 품질 대시보드
   ════════════════════════════════════════════════ */
function sqRenderDashboard(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const q      = sqGet();
  const keys   = ['script','image','videoPrompt','voice','edit'];
  const scores = keys.map(k => q[k]?.score || 0);
  const avg    = Math.round(scores.reduce((a,b)=>a+b,0) / scores.length);
  const level  = avg >= 80 ? 'good' : avg >= 60 ? 'warn' : 'bad';

  el.innerHTML = `
  <div class="sq-dashboard">
    <div class="sq-dash-hd">
      <div class="sq-dash-total sq-score-${level}">
        <div class="sq-dash-num">${avg}</div>
        <div class="sq-dash-unit">종합 품질</div>
      </div>
      <div class="sq-dash-progress">
        ${keys.map(k => {
          const info  = SQ_STEP_LABELS[k];
          const score = q[k]?.score || 0;
          const lv    = score >= 80 ? 'good' : score >= 60 ? 'warn' : 'bad';
          const conf  = q[k]?.confirmed;
          return `
          <div class="sq-dash-item">
            <div class="sq-dash-item-hd">
              <span>${info.ico} ${info.label}</span>
              <span class="sq-dash-item-score sq-score-${lv}">
                ${score}점 ${conf?'✅':''}
              </span>
            </div>
            <div class="sq-dash-bar">
              <div class="sq-dash-fill sq-fill-${lv}" style="width:${score}%"></div>
            </div>
            ${(q[k]?.issues||[]).length > 0 ? `
            <div class="sq-dash-issues">
              ${q[k].issues.slice(0,2).map(i=>`<span class="sq-dash-issue">⚠️ ${i}</span>`).join('')}
            </div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="sq-dash-actions">
      <button class="sq-btn-auto" onclick="sqAutoFix()">
        🔧 문제 항목 자동 개선
      </button>
      <button class="sq-btn-output" onclick="sqForceOutput()">
        ${avg >= 70 ? '✅ 출력하기' : '⚠️ 그래도 출력하기'}
      </button>
    </div>
  </div>`;

  sqInjectCSS();
}

window.sqAutoFix = function() {
  const q = sqGet();
  const fixes = [];
  if ((q.script?.score||0) < 80 && !q.script?.confirmed) {
    fixes.push('대본 재검토 필요');
  }
  if ((q.voice?.score||0) < 60) {
    fixes.push('음성 재생성 권장');
  }
  if (fixes.length === 0) {
    alert('✅ 자동 개선할 항목이 없어요!');
  } else {
    alert('개선이 필요한 항목:\n' + fixes.join('\n') + '\n\n각 단계로 이동해서 수정해주세요.');
  }
};

window.sqForceOutput = function() {
  if (typeof studioGoto === 'function') studioGoto(5);
};

/* ════════════════════════════════════════════════
   CSS
   ════════════════════════════════════════════════ */
function sqInjectCSS() {
  if (document.getElementById('sq-style')) return;
  const st = document.createElement('style');
  st.id = 'sq-style';
  st.textContent = `
/* 게이트 */
.sq-gate{border-radius:14px;padding:14px;margin:10px 0;border:2px solid}
.sq-gate-good{border-color:#22c55e;background:#f0fdf4}
.sq-gate-warn{border-color:#f59e0b;background:#fffbeb}
.sq-gate-bad{border-color:#ef4444;background:#fef2f2}
.sq-gate-hd{display:flex;gap:12px;align-items:center;margin-bottom:10px}
.sq-gate-score-wrap{text-align:center;flex-shrink:0}
.sq-gate-score{font-size:28px;font-weight:900;line-height:1}
.sq-gate-label{font-size:11px;color:#6b7280;margin-top:2px}
.sq-gate-bar-wrap{flex:1}
.sq-gate-bar{height:8px;background:#e5e7eb;border-radius:20px;overflow:hidden;margin-bottom:4px}
.sq-gate-fill{height:100%;border-radius:20px;transition:.4s}
.sq-gate-msg{font-size:12px;font-weight:600}
.sq-gate-issues{margin-bottom:10px;display:flex;flex-direction:column;gap:3px}
.sq-issue{font-size:11px;background:rgba(0,0,0,.06);border-radius:6px;padding:3px 8px}
.sq-gate-btns{display:flex;gap:6px}
.sq-confirmed{font-size:12px;font-weight:700;color:#16a34a;margin-top:6px}

/* 색상 */
.sq-score-good{color:#16a34a}
.sq-score-warn{color:#d97706}
.sq-score-bad{color:#dc2626}
.sq-fill-good{background:#22c55e}
.sq-fill-warn{background:#f59e0b}
.sq-fill-bad{background:#ef4444}

/* 버튼 */
.sq-btn-confirm{padding:8px 18px;border:none;border-radius:10px;
  background:#22c55e;color:#fff;font-weight:800;font-size:13px;cursor:pointer}
.sq-btn-regen{padding:8px 16px;border:none;border-radius:10px;
  background:#f59e0b;color:#fff;font-weight:800;font-size:12px;cursor:pointer}
.sq-btn-regen.bad{background:#ef4444}
.sq-btn-next{padding:8px 16px;border:1.5px solid #d1d5db;border-radius:10px;
  background:#fff;font-size:12px;font-weight:700;cursor:pointer}
.sq-btn-skip{padding:8px 14px;border:1.5px solid #ef4444;border-radius:10px;
  background:#fff;color:#ef4444;font-size:11px;font-weight:700;cursor:pointer}

/* 대시보드 */
.sq-dashboard{background:#fff;border:1.5px solid #f1dce7;border-radius:16px;padding:16px}
.sq-dash-hd{display:flex;gap:14px;margin-bottom:14px}
.sq-dash-total{text-align:center;flex-shrink:0;width:64px}
.sq-dash-num{font-size:26px;font-weight:900}
.sq-dash-unit{font-size:10px;color:#6b7280}
.sq-dash-progress{flex:1;display:flex;flex-direction:column;gap:8px}
.sq-dash-item{}
.sq-dash-item-hd{display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:3px}
.sq-dash-item-score{font-size:12px;font-weight:800}
.sq-dash-bar{height:6px;background:#f1dce7;border-radius:20px;overflow:hidden;margin-bottom:2px}
.sq-dash-fill{height:100%;border-radius:20px}
.sq-dash-issues{display:flex;gap:4px;flex-wrap:wrap}
.sq-dash-issue{font-size:10px;color:#d97706;background:#fffbeb;border-radius:4px;padding:2px 6px}
.sq-dash-actions{display:flex;gap:8px}
.sq-btn-auto{flex:1;padding:10px;border:1.5px solid #9181ff;border-radius:10px;
  background:#fff;color:#9181ff;font-weight:800;font-size:12px;cursor:pointer}
.sq-btn-output{flex:1;padding:10px;border:none;border-radius:10px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-weight:800;font-size:12px;cursor:pointer}
`;
  document.head.appendChild(st);
}

/* 전역 노출 */
window.sqInit         = sqInit;
window.sqGet          = sqGet;
window.sqUpdate       = sqUpdate;
window.sqCalcScript   = sqCalcScript;
window.sqCalcImage    = sqCalcImage;
window.sqCalcVideoPrompt = sqCalcVideoPrompt;
window.sqCalcVoice    = sqCalcVoice;
window.sqCalcEdit     = sqCalcEdit;
window.sqRenderGate   = sqRenderGate;
window.sqRenderDashboard = sqRenderDashboard;
