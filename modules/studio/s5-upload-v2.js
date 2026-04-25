/* ================================================
   modules/studio/s5-upload-v2.js
   STEP 5 — 최종검수·출력 (개선판)

   T1 프로젝트 검수   체크리스트 + 완성도
   T2 AI 검수·메타    리스크 + 제목/설명/태그/고정댓글
   T3 출력 패키지     JSZip 실제 ZIP 다운로드
   T4 성과 기록       수동 입력 + 히스토리

   기존 s5-upload.js 삭제 없음 — 개선판 추가
   ================================================ */

/* ── 공통 데이터 접근 헬퍼 ── */
function studioGet(key) {
  const p = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const map = {
    script:   () => p.scriptText || p.script || (p.s2 && p.s2.scriptKo) || '',
    scriptJa: () => p.scriptJa   || (p.s2 && p.s2.scriptJa) || '',
    topic:    () => p.topic || '',
    scenes:   () => p.scenes || (p.s3 && p.s3.scenes) ||
                    (p.sources && p.sources.images) || [],
    thumb:    () => p.thumbUrl || (p.s3 && p.s3.thumbUrl) ||
                    ((p.scenes||[])[0] && p.scenes[0].imageUrl) || '',
    voice:    () => p.voice || (p.s4) || {},
    edit:     () => p.edit || _s5ParseLocalEdit(),
    strategy: () => p.editStrategy || {},
    sources:  () => p.sources || {},
    meta:     () => p.metadata || {},
    lang:     () => p.lang || 'both',
    style:    () => p.style || 'emotional',
    channel:  () => p.channel || localStorage.getItem('studio_channel') || '',
  };
  return map[key] ? map[key]() : (p[key] ?? null);
}

function _s5ParseLocalEdit() {
  try { return JSON.parse(localStorage.getItem('moca_s4_edit') || '{}'); } catch { return {}; }
}

/* ── 리스크 패턴 ── */
const S5V_RISK_PATTERNS = [
  { pat: /반드시\s*(치료|완치|효과)/g,      label: '의료 과장',   level: 'error' },
  { pat: /\d+일\s*만에\s*(살|체중|몸무게)/g, label: '건강 과장',   level: 'error' },
  { pat: /보장(됩니다|해요)/g,              label: '금융 과장',   level: 'error' },
  { pat: /\d+배\s*수익/g,                  label: '투자 과장',   level: 'error' },
  { pat: /절대\s*(안전|무조건)/g,          label: '단정 표현',   level: 'warn'  },
  { pat: /(무료|공짜)\s*증정/g,            label: '광고 과장',   level: 'warn'  },
];

const S5V_PLATFORMS = [
  { id:'youtube',   label:'YouTube',   titleMax:100, descMax:5000, tagMax:30 },
  { id:'tiktok',    label:'TikTok',    titleMax:150, descMax:2200, tagMax:0  },
  { id:'instagram', label:'Instagram', titleMax:0,   descMax:2200, tagMax:30 },
];

const S5V_LS = 'moca_s5v_records';

/* ── 전역 상태 ── */
let _s5vTab     = 't1';
let _s5vPlatform= 'youtube';
let _s5vMeta    = null;
let _s5vZipping = false;

/* ════════════════════════════════════════════════
   메인 렌더
   ════════════════════════════════════════════════ */
function _studioS5Upload(wrapId) {
  const wrap = document.getElementById(wrapId || 'studioS5Wrap');
  if (!wrap) return;

  wrap.innerHTML = `
  <div class="s5v-wrap">
    <nav class="s5v-nav">
      ${[
        ['t1','📋 프로젝트 검수'],
        ['t2','🤖 AI 검수·메타'],
        ['t3','📦 출력 패키지'],
        ['t4','📊 성과 기록'],
      ].map(([id,label])=>`
        <button class="s5v-tab ${_s5vTab===id?'on':''}"
          onclick="_s5vSetTab('${id}','${wrapId||'studioS5Wrap'}')">
          ${label}
        </button>
      `).join('')}
    </nav>
    <div class="s5v-body">
      ${_s5vTab==='t1' ? _s5vT1() : ''}
      ${_s5vTab==='t2' ? _s5vT2() : ''}
      ${_s5vTab==='t3' ? _s5vT3() : ''}
      ${_s5vTab==='t4' ? _s5vT4() : ''}
    </div>
  </div>`;

  _s5vInjectCSS();
  _s5vRenderQualityDashboard();
  _s5vRenderUploadPlatforms();
}

/* studio-quality.js 통합 — placeholder가 있을 때만, 함수가 있을 때만 동작 */
function _s5vRenderQualityDashboard() {
  if (_s5vTab !== 't1') return;
  const el = document.getElementById('s5v-quality-dashboard');
  if (!el) return;
  if (typeof sqRenderDashboard !== 'function') return;
  try {
    const proj     = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
    const script   = studioGet('script');
    const scenes   = studioGet('scenes');
    const voice    = studioGet('voice');
    const edit     = studioGet('edit');
    const strategy = studioGet('strategy');
    const videoPrompts = proj.videoPrompts || [];
    if (typeof sqCalcScript      === 'function') sqCalcScript(script, scenes);
    if (typeof sqCalcImage       === 'function') sqCalcImage(scenes);
    if (typeof sqCalcVideoPrompt === 'function') sqCalcVideoPrompt(videoPrompts);
    if (typeof sqCalcVoice       === 'function') sqCalcVoice(voice, scenes);
    if (typeof sqCalcEdit        === 'function') sqCalcEdit(edit, strategy);
    sqRenderDashboard('s5v-quality-dashboard');
  } catch (_) { /* 조용히 skip */ }
}

/* ════════════════════════════════════════════════
   T1 — 프로젝트 검수
   ════════════════════════════════════════════════ */
function _s5vT1() {
  const script  = studioGet('script');
  const scriptJa= studioGet('scriptJa');
  const scenes  = studioGet('scenes');
  const voice   = studioGet('voice');
  const edit    = studioGet('edit');
  const thumb   = studioGet('thumb');
  const lang    = studioGet('lang');

  const hasScript   = script.length > 50;
  const hasScriptJa = scriptJa.length > 10;
  const hasScenes   = scenes.length > 0;
  const hasImage    = scenes.some(s => s.imageUrl || s.img);
  const hasVideo    = scenes.some(s => s.videoUrl) || !!(studioGet('sources').uploadedFiles||[]).length;
  const hasVoice    = !!(voice.scenes || []).some(s => s?.audioUrl);
  const hasCaption  = !!(edit.caption);
  const hasThumb    = !!thumb;
  const needJa      = lang === 'ja' || lang === 'both';

  const items = [
    { label:'대본 (한국어)', ok: hasScript,
      detail: hasScript ? `${Math.ceil(script.length/50)}씬 분량` : '없음',
      step: 1 },
    ...(needJa ? [{ label:'대본 (일본어)', ok: hasScriptJa,
      detail: hasScriptJa ? '있음' : '없음', step: 1 }] : []),
    { label:'씬 구성', ok: hasScenes,
      detail: hasScenes ? `${scenes.length}씬` : '없음', step: 2 },
    { label:'이미지/영상 소스', ok: hasImage || hasVideo,
      detail: hasImage ? `이미지 ${scenes.filter(s=>s.imageUrl||s.img).length}개`
              : hasVideo ? '영상 있음' : '없음', step: 2 },
    { label:'음성 생성', ok: hasVoice,
      detail: hasVoice ? `${(voice.scenes||[]).filter(s=>s?.audioUrl).length}씬 완료` : '미생성',
      step: 3 },
    { label:'자막 설정', ok: hasCaption,
      detail: hasCaption ? edit.caption.fontId || '설정됨' : '미설정', step: 4 },
    { label:'썸네일', ok: hasThumb,
      detail: hasThumb ? '있음' : '없음', step: 4 },
  ];

  const doneCount = items.filter(i=>i.ok).length;
  const pct       = Math.round(doneCount / items.length * 100);

  return `
  <div class="s5v-section">

    <!-- 통합 품질 대시보드 (studio-quality.js 가 있을 때만 채워짐) -->
    <div id="s5v-quality-dashboard" style="margin-bottom:14px"></div>

    <div class="s5v-completeness">
      <div class="s5v-comp-hd">
        <span>완성도</span>
        <span class="s5v-comp-pct ${pct>=80?'good':pct>=60?'warn':'bad'}">${pct}%</span>
      </div>
      <div class="s5v-comp-bar">
        <div class="s5v-comp-fill ${pct>=80?'good':pct>=60?'warn':'bad'}"
          style="width:${pct}%"></div>
      </div>
    </div>

    <div class="s5v-checklist">
      ${items.map(item=>`
        <div class="s5v-check-item ${item.ok?'ok':'miss'}">
          <span class="s5v-check-ico">${item.ok?'✅':'⚠️'}</span>
          <div class="s5v-check-info">
            <span class="s5v-check-label">${item.label}</span>
            <span class="s5v-check-detail">${item.detail}</span>
          </div>
          ${!item.ok ? `
          <button class="s5v-check-go"
            onclick="typeof studioGoto==='function'&&studioGoto(${item.step})">
            → 이동
          </button>` : ''}
        </div>
      `).join('')}
    </div>

    ${pct < 60 ? `
    <div class="s5v-warn-box">
      ⚠️ 완성도가 낮아요. 주요 항목을 먼저 채워주세요.
    </div>` : pct >= 80 ? `
    <div class="s5v-ok-box">
      ✅ 출력 준비 완료! 다음 탭에서 AI 검수 후 출력하세요.
    </div>` : `
    <div class="s5v-info-box">
      💡 일부 항목이 없어도 출력은 가능해요.
    </div>`}

    <button class="s5v-next-btn"
      onclick="_s5vSetTab('t2','${_s5vWrapId()}')">
      다음: AI 검수·메타데이터 →
    </button>
  </div>`;
}

/* ════════════════════════════════════════════════
   T2 — AI 검수·메타데이터
   ════════════════════════════════════════════════ */
function _s5vT2() {
  const script = studioGet('script');
  const topic  = studioGet('topic');
  const lang   = studioGet('lang');

  // 메타데이터 초기화
  if (!_s5vMeta) {
    _s5vMeta = _s5vGenMeta(script, topic, studioGet('style'));
  }

  // 리스크 검수
  const risks = S5V_RISK_PATTERNS.flatMap(r => {
    const matches = [...(script.matchAll(r.pat)||[])];
    return matches.length ? [{ label:r.label, level:r.level, sample:matches[0][0] }] : [];
  });
  const riskScore = Math.max(0, 100 - risks.filter(r=>r.level==='error').length*20
                                      - risks.filter(r=>r.level==='warn').length*10);

  return `
  <div class="s5v-section">

    <!-- 리스크 검수 -->
    <div class="s5v-meta-block">
      <div class="s5v-meta-label">
        🛡 콘텐츠 리스크 검수
        <span class="s5v-score ${riskScore>=80?'good':riskScore>=60?'warn':'bad'}">
          ${riskScore}점
        </span>
      </div>
      ${risks.length === 0
        ? '<div class="s5v-ok-row">✅ 위험 표현 없음</div>'
        : risks.map(r=>`
          <div class="s5v-risk-row ${r.level}">
            <span class="s5v-risk-badge ${r.level}">${r.level==='error'?'🔴':'🟡'} ${r.label}</span>
            <span class="s5v-risk-text">"${r.sample}"</span>
          </div>`).join('')}
    </div>

    <!-- 제목 3안 (이슈 7 — 카드형 + 글자수 + 선택 강조 + 복사) -->
    <div class="s5v-meta-block">
      <div class="s5v-meta-label">
        📌 제목 3안
        <button class="s5v-regen-btn" onclick="_s5vRegenMeta()">🔄 재생성</button>
      </div>
      <div class="s5v-title-list">
        ${(_s5vMeta.titles||[]).map((t,i)=>{
          const sel = _s5vMeta.selectedTitle===i;
          const len = (t||'').length;
          const lenWarn = len > 100;
          return `
          <label class="s5v-title-card ${sel?'selected':''}">
            <input type="radio" name="s5vtitle" value="${i}"
              ${sel?'checked':''}
              onchange="_s5vMeta.selectedTitle=${i};_studioS5Upload(_s5vWrapId())">
            <div class="s5v-title-card-body">
              <div class="s5v-title-card-hd">
                <span class="s5v-title-tag">안 ${i+1}${sel?' · 선택됨':''}</span>
                <span class="s5v-title-len ${lenWarn?'warn':''}">${len}자${lenWarn?' ⚠️':''}</span>
              </div>
              <div class="s5v-title-text">${t}</div>
              <button type="button" class="s5v-title-copy"
                onclick="event.preventDefault();_s5vCopy(this,'${_esc(t)}')">📋 복사</button>
            </div>
          </label>`;
        }).join('')}
      </div>
    </div>

    <!-- 설명문 -->
    <div class="s5v-meta-block">
      <div class="s5v-meta-label">
        📄 설명문
        <button class="s5v-mini-copy"
          onclick="_s5vCopy(this,'${_esc(_s5vMeta.desc||'')}')">복사</button>
      </div>
      <textarea class="s5v-desc-area" rows="4"
        oninput="_s5vMeta.desc=this.value">${_s5vMeta.desc||''}</textarea>
    </div>

    <!-- 해시태그 -->
    <div class="s5v-meta-block">
      <div class="s5v-meta-label">
        🏷 해시태그 (${(_s5vMeta.tags||[]).length}개)
        <button class="s5v-mini-copy"
          onclick="_s5vCopy(this,'${(_s5vMeta.tags||[]).map(t=>'#'+t).join(' ')}')">
          전체 복사
        </button>
      </div>
      <div class="s5v-tags">
        ${(_s5vMeta.tags||[]).map(t=>`<span class="s5v-tag">#${t}</span>`).join('')}
      </div>
    </div>

    <!-- 고정 댓글 -->
    <div class="s5v-meta-block">
      <div class="s5v-meta-label">
        📌 고정 댓글 초안
        <button class="s5v-mini-copy"
          onclick="_s5vCopy(this,'${_esc(_s5vMeta.pinComment||'')}')">복사</button>
      </div>
      <textarea class="s5v-desc-area" rows="3"
        oninput="_s5vMeta.pinComment=this.value">${_s5vMeta.pinComment||''}</textarea>
    </div>

    <!-- 플랫폼별 변환 -->
    <div class="s5v-meta-block">
      <div class="s5v-meta-label">🌐 플랫폼별 미리보기</div>
      <div class="s5v-plat-tabs">
        ${S5V_PLATFORMS.map(p=>`
          <button class="s5v-plat-tab ${_s5vPlatform===p.id?'on':''}"
            onclick="_s5vPlatform='${p.id}';_studioS5Upload('${_s5vWrapId()}')">
            ${p.label}
          </button>`).join('')}
      </div>
      ${_s5vPlatPreview()}
    </div>

    <button class="s5v-next-btn"
      onclick="_s5vSaveMeta();_s5vSetTab('t3','${_s5vWrapId()}')">
      다음: 출력 패키지 →
    </button>
  </div>`;
}

function _s5vPlatPreview() {
  const p     = S5V_PLATFORMS.find(x=>x.id===_s5vPlatform) || S5V_PLATFORMS[0];
  const sel   = _s5vMeta?.selectedTitle || 0;
  const title = (_s5vMeta?.titles?.[sel]||'').slice(0,p.titleMax||999);
  const desc  = (_s5vMeta?.desc||'').slice(0,p.descMax||999);
  const tags  = (_s5vMeta?.tags||[]).slice(0,p.tagMax||99).map(t=>'#'+t).join(' ');
  return `
  <div class="s5v-plat-preview">
    ${p.titleMax ? `
    <div class="s5v-plat-field">
      <div class="s5v-plat-flabel">제목 (${title.length}/${p.titleMax}자)</div>
      <div class="s5v-plat-fval">${title}</div>
      <button class="s5v-mini-copy" onclick="_s5vCopy(this,'${_esc(title)}')">복사</button>
    </div>` : ''}
    <div class="s5v-plat-field">
      <div class="s5v-plat-flabel">설명 (${desc.length}/${p.descMax}자)</div>
      <div class="s5v-plat-fval s5v-clamp">${desc}</div>
      <button class="s5v-mini-copy" onclick="_s5vCopy(this,'${_esc(desc)}')">복사</button>
    </div>
    <div class="s5v-plat-field">
      <div class="s5v-plat-flabel">해시태그</div>
      <div class="s5v-plat-fval">${tags}</div>
      <button class="s5v-mini-copy" onclick="_s5vCopy(this,'${_esc(tags)}')">복사</button>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   T3 — 출력 패키지 (JSZip)
   ════════════════════════════════════════════════ */
function _s5vT3() {
  const script   = studioGet('script');
  const scriptJa = studioGet('scriptJa');
  const scenes   = studioGet('scenes');
  const voice    = studioGet('voice');
  const thumb    = studioGet('thumb');
  const meta     = _s5vMeta || _s5vGenMeta(script, studioGet('topic'), studioGet('style'));

  const hasVoice  = (voice.scenes||[]).some(s=>s?.audioUrl);
  const hasThumb  = !!thumb;
  const hasVideo  = scenes.some(s=>s.videoUrl);

  const files = [
    { name:'project.json',     ok: true,      desc:'프로젝트 전체 데이터' },
    { name:'script_ko.txt',    ok: !!script,  desc:'한국어 대본' },
    { name:'script_ja.txt',    ok: !!scriptJa,desc:'일본어 대본' },
    { name:'metadata.json',    ok: true,       desc:'제목/설명/태그/고정댓글' },
    { name:'subtitle_ko.srt',  ok: scenes.length>0, desc:'한국어 자막' },
    { name:'subtitle_ja.srt',  ok: scenes.length>0 && !!scriptJa, desc:'일본어 자막' },
    { name:'upload_guide.txt', ok: true,       desc:'플랫폼별 업로드 가이드' },
    { name:'thumbnail.png',    ok: hasThumb,   desc:'썸네일 이미지', warn: !hasThumb },
    { name:'video.mp4',        ok: hasVideo,   desc:'완성 영상 (있는 경우)', warn: !hasVideo },
  ];

  return `
  <div class="s5v-section">
    <div class="s5v-package-list">
      ${files.map(f=>`
        <div class="s5v-pkg-item ${f.ok?'ok':f.warn?'warn':'miss'}">
          <span>${f.ok?'✅':f.warn?'⚠️':'❌'} ${f.name}</span>
          <span class="s5v-pkg-desc">${f.desc}</span>
        </div>
      `).join('')}
    </div>

    <!-- API 키 설정 -->
    <details class="s5v-api-detail">
      <summary>🔑 자동 업로드 API 설정 (선택)</summary>
      <div class="s5v-api-body">
        <div class="s5v-api-row">
          <label>YouTube Client ID</label>
          <input type="password" class="s5v-api-inp"
            value="${localStorage.getItem('s5_yt_client_id')||''}"
            oninput="localStorage.setItem('s5_yt_client_id',this.value)"
            placeholder="YouTube OAuth Client ID">
        </div>
        <div class="s5v-api-row">
          <label>TikTok App Key</label>
          <input type="password" class="s5v-api-inp"
            value="${localStorage.getItem('s5_tt_app_key')||''}"
            oninput="localStorage.setItem('s5_tt_app_key',this.value)"
            placeholder="TikTok App Key">
        </div>
        <div class="s5v-api-hint">
          🔒 API 키는 브라우저 로컬에만 저장됩니다.
        </div>
      </div>
    </details>

    <!-- 출력 버튼 -->
    <div class="s5v-output-btns">
      <button class="s5v-btn-primary ${_s5vZipping?'loading':''}"
        onclick="_s5vDownloadZip()"
        ${_s5vZipping?'disabled':''}>
        ${_s5vZipping?'⏳ 패키지 생성 중...':'📦 ZIP 패키지 다운로드'}
        <span>모든 파일을 한번에</span>
      </button>

      <div class="s5v-individual-btns">
        <button class="s5v-btn-outline" onclick="_s5vDl('script')">📝 대본 TXT</button>
        <button class="s5v-btn-outline" onclick="_s5vDl('meta')">📊 메타데이터 JSON</button>
        <button class="s5v-btn-outline" onclick="_s5vDl('srt')">📄 SRT 자막</button>
        <button class="s5v-btn-outline" onclick="_s5vDl('guide')">📋 업로드 가이드</button>
      </div>
    </div>

    <!-- 플랫폼 업로드 계획 (이슈 8 — s5-upload-platforms.js) -->
    <div id="s5UpPlatformsWrap"></div>
  </div>`;
}

/* ── T3 렌더 후 플랫폼 섹션 채우기 (s5-upload-platforms.js 가 로드된 경우) ── */
function _s5vRenderUploadPlatforms() {
  if (_s5vTab !== 't3') return;
  if (typeof _s5upRender !== 'function') return;
  const el = document.getElementById('s5UpPlatformsWrap');
  if (!el) return;
  _s5upRender('s5UpPlatformsWrap');
}

/* ════════════════════════════════════════════════
   T4 — 성과 기록 (기존 유지 + 개선)
   ════════════════════════════════════════════════ */
function _s5vT4() {
  const records = JSON.parse(localStorage.getItem(S5V_LS)||'[]');

  return `
  <div class="s5v-section">
    <div class="s5v-t4-grid">
      <div class="s5v-record-form">
        <div class="s5v-meta-label">📊 성과 입력</div>
        <div class="s5v-form-row">
          <label>업로드 날짜</label>
          <input type="date" id="s5vDate" value="${new Date().toISOString().slice(0,10)}">
        </div>
        <div class="s5v-form-row">
          <label>플랫폼</label>
          <select id="s5vPlat">
            ${S5V_PLATFORMS.map(p=>`<option value="${p.id}">${p.label}</option>`).join('')}
          </select>
        </div>
        <div class="s5v-form-2col">
          ${[
            ['s5vViews','조회수'],['s5vCtr','CTR(%)'],
            ['s5vRetention','시청지속(%)'],['s5vLikes','좋아요'],
            ['s5vComments','댓글'],['s5vSubs','구독증가'],
          ].map(([id,label])=>`
            <div class="s5v-form-row">
              <label>${label}</label>
              <input type="number" id="${id}" placeholder="0">
            </div>
          `).join('')}
        </div>
        <div class="s5v-form-row">
          <label>💬 댓글 메모</label>
          <textarea id="s5vMemo" rows="2" placeholder="주요 반응..."></textarea>
        </div>
        <div class="s5v-form-row">
          <label>💡 다음 주제 아이디어</label>
          <textarea id="s5vIdea" rows="2" placeholder="다음 영상 아이디어..."></textarea>
        </div>
        <button class="s5v-btn-primary" onclick="_s5vSaveRecord()">
          💾 성과 저장
        </button>
      </div>

      <div class="s5v-record-history">
        <div class="s5v-meta-label">📈 히스토리 (${records.length}건)</div>
        ${records.length===0
          ? '<div class="s5v-empty">아직 기록이 없어요</div>'
          : records.slice().reverse().slice(0,5).map(r=>`
            <div class="s5v-record-card">
              <div class="s5v-record-hd">
                <span>${r.plat||'YouTube'} · ${r.date||''}</span>
                <button onclick="_s5vDelRecord('${r.id}')">×</button>
              </div>
              <div class="s5v-record-stats">
                <span>👁 ${(r.views||0).toLocaleString()}</span>
                <span>CTR ${r.ctr||0}%</span>
                <span>지속 ${r.retention||0}%</span>
              </div>
              ${r.idea ? `
              <div class="s5v-record-idea">
                💡 ${r.idea}
                <button onclick="_s5vUseIdea('${_esc(r.idea)}')">→ 사용</button>
              </div>` : ''}
            </div>
          `).join('')}
      </div>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   메타데이터 생성
   ════════════════════════════════════════════════ */
function _s5vGenMeta(script, topic, style) {
  const styleMap = {
    emotional:'감동', info:'정보', humor:'유머',
    drama:'드라마', senior:'시니어', knowledge:'지식',
  };
  const sl = styleMap[style] || '정보';

  const titles = [
    `이거 모르면 후회해요 — ${(topic||'').slice(0,20)}`,
    `${(topic||'').slice(0,25)} 완벽 정리`,
    `${sl} 채널 추천 | ${(topic||'').slice(0,20)}`,
  ];

  const summary = (script||'').slice(0,200).replace(/\n/g,' ');
  const desc    = `${summary}...\n\n👍 도움이 됐다면 좋아요·구독 부탁드려요!\n💬 궁금한 점은 댓글로!\n\n#${sl} #시니어 #MOCA`;

  const tags = ['시니어','유튜브','숏츠','콘텐츠',sl,
    ...(topic||'').match(/[\uAC00-\uD7A3]{2,5}/g)||[]].filter(Boolean).slice(0,20);

  const pinComment = `📌 영상이 도움됐다면 댓글로 의견 남겨주세요!\n궁금한 점이나 다음 영상 주제도 알려주세요 👇`;

  return { titles, selectedTitle:0, desc, tags, pinComment };
}

/* ════════════════════════════════════════════════
   ZIP 다운로드 (JSZip CDN)
   ════════════════════════════════════════════════ */
async function _s5vDownloadZip() {
  _s5vZipping = true;
  _studioS5Upload(_s5vWrapId());

  try {
    // JSZip CDN 동적 로드
    if (typeof JSZip === 'undefined') {
      await new Promise((resolve, reject) => {
        const sc = document.createElement('script');
        sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        sc.onload  = resolve;
        sc.onerror = reject;
        document.head.appendChild(sc);
      });
    }

    const zip     = new JSZip();
    const proj    = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
    const script  = studioGet('script');
    const scriptJa= studioGet('scriptJa');
    const scenes  = studioGet('scenes');
    const meta    = _s5vMeta || _s5vGenMeta(script, studioGet('topic'), studioGet('style'));

    // project.json
    zip.file('project.json', JSON.stringify(proj, null, 2));

    // 대본
    if (script)   zip.file('script_ko.txt', script);
    if (scriptJa) zip.file('script_ja.txt', scriptJa);

    // metadata.json
    zip.file('metadata.json', JSON.stringify({
      titles:     meta.titles,
      selectedTitle: meta.selectedTitle,
      description: meta.desc,
      hashtags:   meta.tags,
      pinComment: meta.pinComment,
    }, null, 2));

    // SRT 자막
    if (scenes.length > 0) {
      zip.file('subtitle_ko.srt', _s5vGenSrt(scenes, 'ko'));
      if (scriptJa) zip.file('subtitle_ja.srt', _s5vGenSrt(scenes, 'ja'));
    }

    // 업로드 가이드
    zip.file('upload_guide.txt', _s5vGenGuide(meta));

    // 생성
    const blob = await zip.generateAsync({ type:'blob' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const title= (meta.titles?.[meta.selectedTitle]||'MOCA').slice(0,30);
    a.href     = url;
    a.download = `${title}_패키지.zip`;
    a.click();
    URL.revokeObjectURL(url);

    // 메타데이터 저장
    proj.metadata = meta;
    if (typeof studioSave === 'function') studioSave();

  } catch(e) {
    console.error('ZIP 생성 오류:', e);
    alert('ZIP 생성 중 오류가 발생했어요.\n개별 파일 다운로드를 이용해주세요.');
  }

  _s5vZipping = false;
  _studioS5Upload(_s5vWrapId());
}

/* ── 개별 다운로드 ── */
window._s5vDl = function(type) {
  const script  = studioGet('script');
  const scriptJa= studioGet('scriptJa');
  const scenes  = studioGet('scenes');
  const meta    = _s5vMeta || _s5vGenMeta(script, studioGet('topic'), studioGet('style'));
  const title   = (meta.titles?.[meta.selectedTitle||0]||'MOCA').slice(0,30);

  let content='', filename='', mime='text/plain;charset=utf-8';

  if (type==='script') {
    content  = `=== 한국어 대본 ===\n${script}\n\n=== 일본어 대본 ===\n${scriptJa}`;
    filename = `${title}_대본.txt`;
  }
  if (type==='meta') {
    content  = JSON.stringify({ titles:meta.titles, desc:meta.desc, tags:meta.tags, pinComment:meta.pinComment }, null, 2);
    filename = `${title}_메타데이터.json`;
    mime     = 'application/json';
  }
  if (type==='srt') {
    content  = `=== 한국어 자막 ===\n${_s5vGenSrt(scenes,'ko')}\n\n=== 일본어 자막 ===\n${_s5vGenSrt(scenes,'ja')}`;
    filename = `${title}_자막.srt`;
  }
  if (type==='guide') {
    content  = _s5vGenGuide(meta);
    filename = `${title}_업로드가이드.txt`;
  }

  const blob = new Blob([content], {type: mime});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
};

function _s5vGenSrt(scenes, lang) {
  const dur = 5;
  return scenes.map((s,i) => {
    const text = lang==='ja' ? (s.captionJa||s.caption||s.text||'') : (s.caption||s.text||'');
    return `${i+1}\n${_s5vSrtTime(i*dur)} --> ${_s5vSrtTime((i+1)*dur)}\n${text}\n`;
  }).join('\n');
}

function _s5vSrtTime(sec) {
  const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},000`;
}

function _s5vGenGuide(meta) {
  const title = meta.titles?.[meta.selectedTitle||0]||'';
  return `=== MOCA 업로드 가이드 ===

📺 YouTube 업로드:
1. youtube.com/upload 접속
2. 영상 파일 업로드
3. 제목: ${title}
4. 설명문 붙여넣기 (metadata.json 참고)
5. 태그 붙여넣기
6. 썸네일 업로드
7. 자막 > SRT 파일 업로드
8. 공개 설정 후 게시

🔴 TikTok 업로드:
1. tiktok.com/creator-center 접속
2. 영상 업로드
3. 캡션 붙여넣기 (해시태그 포함)
4. 게시

📌 고정 댓글:
${meta.pinComment||''}

Generated by MOCA`;
}

/* ════════════════════════════════════════════════
   이벤트 핸들러
   ════════════════════════════════════════════════ */
window._s5vSetTab = function(tab, wid) {
  _s5vTab = tab;
  _studioS5Upload(wid);
};

window._s5vCopy = function(btn, text) {
  navigator.clipboard.writeText((text||'').replace(/\\n/g,'\n')).then(()=>{
    const o=btn.textContent; btn.textContent='✅'; setTimeout(()=>btn.textContent=o,1500);
  });
};

window._s5vRegenMeta = function() {
  _s5vMeta = _s5vGenMeta(studioGet('script'), studioGet('topic'), studioGet('style'));
  _studioS5Upload(_s5vWrapId());
};

window._s5vSaveMeta = function() {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  proj.metadata = _s5vMeta;
  if (typeof studioSave === 'function') studioSave();
};

window._s5vSaveRecord = function() {
  const g = id => document.getElementById(id)?.value||'';
  const r = {
    id: Date.now().toString(), date:g('s5vDate'), plat:g('s5vPlat'),
    views:g('s5vViews'), ctr:g('s5vCtr'), retention:g('s5vRetention'),
    likes:g('s5vLikes'), comments:g('s5vComments'), subs:g('s5vSubs'),
    memo:g('s5vMemo'), idea:g('s5vIdea'),
  };
  const rs = JSON.parse(localStorage.getItem(S5V_LS)||'[]');
  rs.push(r);
  localStorage.setItem(S5V_LS, JSON.stringify(rs));
  _studioS5Upload(_s5vWrapId());
};

window._s5vDelRecord = function(id) {
  if (!confirm('삭제할까요?')) return;
  const rs = JSON.parse(localStorage.getItem(S5V_LS)||'[]').filter(r=>r.id!==id);
  localStorage.setItem(S5V_LS, JSON.stringify(rs));
  _studioS5Upload(_s5vWrapId());
};

window._s5vUseIdea = function(idea) {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  if (typeof studioNewProjectObj === 'function') {
    STUDIO.project = studioNewProjectObj();
    STUDIO.project.topic = idea;
  }
  if (typeof studioGoto === 'function') studioGoto(1);
};

function _s5vWrapId() {
  return document.querySelector('.s5v-wrap')?.parentElement?.id || 'studioS5Wrap';
}

function _esc(str) {
  return (str||'').replace(/'/g,"\\'").replace(/\n/g,'\\n');
}

/* ── CSS ── */
function _s5vInjectCSS() {
  if (document.getElementById('s5v-style')) return;
  const st = document.createElement('style');
  st.id = 's5v-style';
  st.textContent = `
.s5v-wrap{font-family:inherit}
.s5v-nav{display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap}
.s5v-tab{padding:8px 14px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:12px;font-weight:700;color:#7b7077;cursor:pointer;transition:.14s}
.s5v-tab.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.s5v-body{background:#fff;border-radius:16px;border:1px solid #f1dce7;padding:18px}
.s5v-section{}
.s5v-next-btn{width:100%;padding:13px;border:none;border-radius:13px;margin-top:14px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;font-weight:800;font-size:14px;cursor:pointer}

/* 완성도 */
.s5v-completeness{margin-bottom:14px}
.s5v-comp-hd{display:flex;justify-content:space-between;font-size:12px;
  font-weight:800;margin-bottom:6px}
.s5v-comp-pct{font-size:14px;font-weight:900}
.s5v-comp-pct.good{color:#16a34a} .s5v-comp-pct.warn{color:#d97706} .s5v-comp-pct.bad{color:#dc2626}
.s5v-comp-bar{height:8px;background:#f1dce7;border-radius:20px;overflow:hidden}
.s5v-comp-fill{height:100%;border-radius:20px;transition:.3s}
.s5v-comp-fill.good{background:#22c55e} .s5v-comp-fill.warn{background:#f59e0b} .s5v-comp-fill.bad{background:#ef4444}

/* 체크리스트 */
.s5v-checklist{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
.s5v-check-item{display:flex;align-items:center;gap:8px;padding:10px;
  border:1.5px solid #f1dce7;border-radius:10px;font-size:12px}
.s5v-check-item.ok{background:#f0fdf4} .s5v-check-item.miss{background:#fff8f0}
.s5v-check-ico{font-size:16px;flex-shrink:0}
.s5v-check-info{flex:1;display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px}
.s5v-check-label{font-weight:700}
.s5v-check-detail{color:#9b8a93;font-size:11px}
.s5v-check-go{padding:3px 10px;border:1.5px solid #9181ff;border-radius:20px;
  background:#fff;color:#9181ff;font-size:11px;font-weight:700;cursor:pointer}
.s5v-warn-box{background:#fff8f0;border-radius:10px;padding:10px;font-size:12px;color:#d97706}
.s5v-ok-box{background:#f0fdf4;border-radius:10px;padding:10px;font-size:12px;color:#16a34a}
.s5v-info-box{background:#f0f9ff;border-radius:10px;padding:10px;font-size:12px;color:#0369a1}

/* 메타데이터 */
.s5v-meta-block{margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #f8f0f5}
.s5v-meta-block:last-child{border-bottom:none}
.s5v-meta-label{font-size:12px;font-weight:800;color:#2b2430;margin-bottom:8px;
  display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.s5v-score{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:800}
.s5v-score.good{background:#effbf7;color:#1a7a5a}
.s5v-score.warn{background:#fffbe8;color:#8a6800}
.s5v-score.bad{background:#fff1f1;color:#c0392b}
.s5v-ok-row{font-size:12px;color:#1a7a5a;padding:6px}
.s5v-risk-row{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px}
.s5v-risk-badge{padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700}
.s5v-risk-badge.error{background:#fff1f1;color:#c0392b}
.s5v-risk-badge.warn{background:#fffbe8;color:#8a6800}
.s5v-risk-text{color:#9b8a93}
.s5v-regen-btn{padding:3px 10px;border:1.5px solid #9181ff;border-radius:20px;
  background:#fff;color:#9181ff;font-size:11px;cursor:pointer;font-weight:700}
/* 제목 3안 (이슈 7 — 카드형) */
.s5v-title-list{display:flex;flex-direction:column;gap:8px}
.s5v-title-card{position:relative;display:block;cursor:pointer;
  border:2px solid #f1dce7;border-radius:14px;padding:12px 14px;background:#fff;transition:.14s}
.s5v-title-card:hover{border-color:#9181ff;background:#fbf7ff}
.s5v-title-card.selected{border-color:#ef6fab;background:linear-gradient(135deg,#fff1f8,#f5f0ff);
  box-shadow:0 2px 10px rgba(239,111,171,.18)}
.s5v-title-card input[type="radio"]{position:absolute;top:10px;right:10px;
  width:14px;height:14px;margin:0;cursor:pointer;accent-color:#ef6fab}
.s5v-title-card-body{padding-right:24px}
.s5v-title-card-hd{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.s5v-title-tag{font-size:11px;font-weight:800;color:#ef6fab;background:#fff1f8;
  border-radius:20px;padding:2px 10px}
.s5v-title-card.selected .s5v-title-tag{background:#ef6fab;color:#fff}
.s5v-title-len{font-size:11px;color:#9b8a93;font-weight:700;margin-left:auto}
.s5v-title-len.warn{color:#dc2626}
.s5v-title-card .s5v-title-text{font-size:14px;font-weight:700;color:#2b2430;
  line-height:1.5;margin-bottom:8px;display:block}
.s5v-title-copy{padding:5px 12px;border:1.5px solid #9181ff;border-radius:8px;
  background:#fff;color:#9181ff;font-size:11px;font-weight:700;cursor:pointer;
  font-family:inherit;transition:.12s}
.s5v-title-copy:hover{background:#9181ff;color:#fff}
/* 기존 row 호환 (다른 위치에서 쓰이는 경우 대비) */
.s5v-title-row{display:flex;align-items:center;gap:8px;padding:8px;
  border:1.5px solid #f1dce7;border-radius:10px;margin-bottom:4px;cursor:pointer}
.s5v-title-row:has(input:checked){border-color:#ef6fab;background:#fff1f8}
.s5v-desc-area{width:100%;border:1.5px solid #f1dce7;border-radius:10px;
  padding:10px;font-size:12.5px;resize:vertical;outline:none;font-family:inherit;box-sizing:border-box}
.s5v-tags{display:flex;flex-wrap:wrap;gap:4px}
.s5v-tag{background:#fff1f8;color:#ef6fab;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700}
.s5v-mini-copy{padding:3px 10px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:11px;cursor:pointer;font-weight:700;flex-shrink:0}
.s5v-plat-tabs{display:flex;gap:4px;margin-bottom:8px}
.s5v-plat-tab{padding:5px 12px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:11px;font-weight:700;cursor:pointer;transition:.12s}
.s5v-plat-tab.on{background:#9181ff;color:#fff;border-color:#9181ff}
.s5v-plat-preview{background:#f9f3fb;border-radius:12px;padding:12px}
.s5v-plat-field{margin-bottom:8px}
.s5v-plat-flabel{font-size:11px;color:#9b8a93;margin-bottom:3px}
.s5v-plat-fval{font-size:12.5px;color:#2b2430;word-break:break-all;margin-bottom:4px}
.s5v-plat-fval.s5v-clamp{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

/* 패키지 */
.s5v-package-list{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.s5v-pkg-item{display:flex;justify-content:space-between;align-items:center;
  padding:8px 12px;border-radius:10px;font-size:12px;font-weight:600}
.s5v-pkg-item.ok{background:#f0fdf4;color:#16a34a}
.s5v-pkg-item.warn{background:#fff8f0;color:#d97706}
.s5v-pkg-item.miss{background:#fef2f2;color:#dc2626}
.s5v-pkg-desc{font-size:11px;opacity:.7}
.s5v-api-detail{border:1.5px solid #f1dce7;border-radius:12px;margin-bottom:14px}
.s5v-api-detail summary{padding:10px 14px;font-size:12px;font-weight:700;cursor:pointer}
.s5v-api-body{padding:10px 14px;border-top:1px solid #f1dce7}
.s5v-api-row{display:flex;flex-direction:column;gap:3px;margin-bottom:8px}
.s5v-api-row label{font-size:11px;font-weight:700;color:#7b7077}
.s5v-api-inp{border:1.5px solid #f1dce7;border-radius:8px;padding:6px 10px;font-size:12px}
.s5v-api-hint{font-size:11px;color:#9b8a93}
.s5v-output-btns{display:flex;flex-direction:column;gap:8px}
.s5v-btn-primary{padding:14px 16px;border:none;border-radius:13px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-weight:800;font-size:14px;cursor:pointer;text-align:left}
.s5v-btn-primary span{display:block;font-size:11px;opacity:.85;margin-top:2px;font-weight:400}
.s5v-btn-primary.loading{opacity:.6;cursor:not-allowed}
.s5v-individual-btns{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
.s5v-btn-outline{padding:10px;border:1.5px solid #f1dce7;border-radius:10px;
  background:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:.12s}
.s5v-btn-outline:hover{border-color:#9181ff;color:#9181ff}

/* 성과 */
.s5v-t4-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:600px){.s5v-t4-grid{grid-template-columns:1fr}}
.s5v-record-form{border:1.5px solid #f1dce7;border-radius:14px;padding:14px}
.s5v-form-row{margin-bottom:7px}
.s5v-form-row label{display:block;font-size:11px;font-weight:700;color:#7b7077;margin-bottom:3px}
.s5v-form-row input,.s5v-form-row select,.s5v-form-row textarea{
  width:100%;border:1.5px solid #f1dce7;border-radius:8px;padding:7px 10px;
  font-size:12.5px;font-family:inherit;box-sizing:border-box}
.s5v-form-2col{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.s5v-record-history{border:1.5px solid #f1dce7;border-radius:14px;padding:14px}
.s5v-empty{text-align:center;color:#9b8a93;font-size:13px;padding:20px}
.s5v-record-card{border:1.5px solid #f1dce7;border-radius:10px;padding:10px;margin-bottom:8px}
.s5v-record-hd{display:flex;justify-content:space-between;font-size:12px;
  font-weight:700;margin-bottom:6px}
.s5v-record-hd button{background:none;border:none;color:#9b8a93;cursor:pointer}
.s5v-record-stats{display:flex;gap:10px;font-size:11px;color:#3a3038;flex-wrap:wrap}
.s5v-record-idea{margin-top:6px;font-size:11px;color:#9b8a93;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.s5v-record-idea button{padding:2px 8px;border:1px solid #9181ff;border-radius:20px;
  background:#fff;color:#9181ff;font-size:10px;cursor:pointer}
`;
  document.head.appendChild(st);
}
