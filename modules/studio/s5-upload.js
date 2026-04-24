/* ================================================
   modules/studio/s5-upload.js
   최종검수·출력 단계 (STEP 5)
   - T1: AI 검수 (콘텐츠 리스크 + 성과 품질 2종)
   - T2: 메타데이터 자동 생성
   - T3: 출력 패키지 (파일 업로드 모드 / 프로젝트 모드)
   - T4: 성과 수동 기록
   ================================================ */

/* ── 상수 ── */
const S5_RISK_PATTERNS = [
  { pattern: /반드시\s*(치료|완치|효과)/g,     label: '의료 과장',   level: 'error' },
  { pattern: /\d+일\s*만에\s*(살|몸무게|체중)/g, label: '건강 과장',   level: 'error' },
  { pattern: /보장(됩니다|해요|해드려요)/g,      label: '금융 과장',   level: 'error' },
  { pattern: /\d+배\s*수익/g,                   label: '투자 과장',   level: 'error' },
  { pattern: /절대\s*(안전|무조건)/g,           label: '단정 표현',   level: 'warn'  },
  { pattern: /(무료|공짜)\s*증정/g,             label: '광고 과장',   level: 'warn'  },
  { pattern: /긴급|지금\s*당장\s*하지\s*않으면/g, label: '공포 마케팅', level: 'warn'  },
];

const S5_PERFORMANCE_CHECKS = [
  { id: 'hook',    label: '훅 (첫 3초)',        tip: '첫 문장이 질문·충격·공감 중 하나여야 함' },
  { id: 'cta',     label: 'CTA 포함',           tip: '"구독·좋아요·댓글" 유도 문구 필요' },
  { id: 'comment', label: '댓글 유도',          tip: '"여러분은 어떻게 생각하세요?" 같은 문구' },
  { id: 'keyword', label: '검색 키워드',        tip: '제목·설명에 핵심 키워드 포함 여부' },
  { id: 'length',  label: '영상 길이 적정성',   tip: '쇼츠 60초 이하 / 롱폼 8분+ 권장' },
];

const S5_PLATFORMS = [
  { id: 'youtube',   label: 'YouTube',    icon: '📺', titleMax: 100, descMax: 5000, tagMax: 500  },
  { id: 'tiktok',    label: 'TikTok',     icon: '🔴', titleMax: 150, descMax: 2200, tagMax: 0    },
  { id: 'instagram', label: 'Instagram',  icon: '📸', titleMax: 0,   descMax: 2200, tagMax: 30   },
  { id: 'facebook',  label: 'Facebook',   icon: '🔵', titleMax: 255, descMax: 63206,tagMax: 0    },
];

const S5_LS = 'moca_s5_records';

/* ── 전역 상태 ── */
let _s5Mode      = 'project'; // 'project' | 'file'
let _s5Tab       = 't1';
let _s5Platform  = 'youtube';
let _s5Files     = { video: null, srt: null, thumb: null };
let _s5Meta      = { titles: [], desc: '', tags: [], srt: '', chapters: [] };
let _s5ApiKeys   = {};

/* ════════════════════════════════════════════════
   메인 렌더 함수
   ════════════════════════════════════════════════ */
function _studioS6(wrapId) {
  const wrap = document.getElementById(wrapId || 'studioS5Wrap');
  if (!wrap) return;

  // STUDIO.project에서 데이터 로드
  const proj  = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const script = proj.scriptText || proj.script || '';
  const scenes = proj.scenes || [];

  // API 키 로드
  _s5ApiKeys = {
    youtube:  localStorage.getItem('s5_yt_client_id')  || '',
    tiktok:   localStorage.getItem('s5_tt_app_key')    || '',
  };

  wrap.innerHTML = `
  <div class="s5-wrap">
    <!-- 탭 네비 -->
    <nav class="s5-nav">
      ${['t1:🔍 AI 검수','t2:📝 메타데이터','t3:📦 출력 패키지','t4:📊 성과 기록'].map(t => {
        const [id, label] = t.split(':');
        return `<button class="s5-tab ${_s5Tab===id?'on':''}"
          onclick="_s5SetTab('${id}','${wrapId||'studioS5Wrap'}')">${label}</button>`;
      }).join('')}
    </nav>

    <!-- 탭 콘텐츠 -->
    <div class="s5-body">
      ${_s5Tab === 't1' ? _s5RenderT1(script, scenes) : ''}
      ${_s5Tab === 't2' ? _s5RenderT2(script, scenes, proj) : ''}
      ${_s5Tab === 't3' ? _s5RenderT3(proj) : ''}
      ${_s5Tab === 't4' ? _s5RenderT4() : ''}
    </div>
  </div>`;

  _s5InjectCSS();
}

/* ════════════════════════════════════════════════
   T1 — AI 검수
   ════════════════════════════════════════════════ */
function _s5RenderT1(script, scenes) {
  // 콘텐츠 리스크 검수
  const risks = [];
  S5_RISK_PATTERNS.forEach(({ pattern, label, level }) => {
    const matches = [...(script.matchAll(pattern) || [])];
    if (matches.length) risks.push({ label, level, count: matches.length,
      sample: matches[0][0] });
  });

  // 성과 품질 검수
  const perfResults = S5_PERFORMANCE_CHECKS.map(c => {
    let pass = false;
    if (c.id === 'hook') {
      const first = script.slice(0, 200);
      pass = /[?？]|놀라|충격|비밀|몰랐|이거|반드시/.test(first);
    } else if (c.id === 'cta') {
      pass = /구독|좋아요|댓글|알림|팔로/.test(script);
    } else if (c.id === 'comment') {
      pass = /어떻게\s*생각|댓글|의견|경험/.test(script);
    } else if (c.id === 'keyword') {
      pass = script.length > 100;
    } else if (c.id === 'length') {
      pass = scenes.length >= 3;
    }
    return { ...c, pass };
  });

  const riskScore  = Math.max(0, 100 - risks.filter(r=>r.level==='error').length*20
                                       - risks.filter(r=>r.level==='warn').length*10);
  const perfScore  = Math.round(perfResults.filter(r=>r.pass).length / perfResults.length * 100);

  return `
  <div class="s5-section">
    <div class="s5-check-grid">

      <!-- 콘텐츠 리스크 -->
      <div class="s5-check-card">
        <div class="s5-check-hd">
          <span>🛡 콘텐츠 리스크 검수</span>
          <span class="s5-score ${riskScore>=80?'good':riskScore>=60?'warn':'bad'}">
            ${riskScore}점
          </span>
        </div>
        <div class="s5-check-desc">저작권·과장표현·광고부적합·정책 위반 체크</div>

        ${risks.length === 0
          ? `<div class="s5-ok-row">✅ 위험 표현 없음</div>`
          : risks.map(r => `
            <div class="s5-risk-row ${r.level}">
              <span class="s5-risk-badge ${r.level}">${r.level==='error'?'🔴':'🟡'} ${r.label}</span>
              <span class="s5-risk-sample">"${r.sample}" (${r.count}건)</span>
            </div>`).join('')
        }

        ${risks.filter(r=>r.level==='error').length > 0
          ? `<button class="s5-btn-fix" onclick="_s5GoStep(1)">
              ✏️ 대본으로 돌아가 수정</button>`
          : ''}
      </div>

      <!-- 성과 품질 -->
      <div class="s5-check-card">
        <div class="s5-check-hd">
          <span>📈 성과 품질 검수</span>
          <span class="s5-score ${perfScore>=80?'good':perfScore>=60?'warn':'bad'}">
            ${perfScore}점
          </span>
        </div>
        <div class="s5-check-desc">훅·CTA·댓글유도·키워드·길이 체크</div>

        ${perfResults.map(r => `
          <div class="s5-perf-row">
            <span class="s5-perf-icon">${r.pass ? '✅' : '⚠️'}</span>
            <div>
              <div class="s5-perf-label">${r.label}</div>
              ${!r.pass ? `<div class="s5-perf-tip">${r.tip}</div>` : ''}
            </div>
          </div>`).join('')}
      </div>
    </div>

    <!-- 전체 판정 -->
    <div class="s5-verdict ${riskScore>=80&&perfScore>=60?'pass':'warn'}">
      ${riskScore>=80&&perfScore>=60
        ? '✅ 검수 통과 — 출력 패키지로 이동하세요'
        : '⚠️ 일부 항목 개선 후 출력을 권장합니다'}
      <button class="s5-tab-next" onclick="_s5SetTab('t2','studioS5Wrap')">
        다음: 메타데이터 →
      </button>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   T2 — 메타데이터 자동 생성
   ════════════════════════════════════════════════ */
function _s5RenderT2(script, scenes, proj) {
  const titleA = _s5Title(script, 'hook');
  const titleB = _s5Title(script, 'info');
  const titleC = _s5Title(script, 'secret');
  const tags   = _s5Tags(script, proj);
  const desc   = _s5Desc(script, proj);
  const chapters = _s5Chapters(scenes);

  // 캐시
  if (!_s5Meta.titles.length) {
    _s5Meta = { titles: [titleA, titleB, titleC], desc, tags, chapters };
  }

  return `
  <div class="s5-section">

    <!-- 제목 3안 -->
    <div class="s5-meta-block">
      <div class="s5-meta-label">📌 제목 (AI 3안 — 선택)</div>
      ${[titleA,titleB,titleC].map((t,i) => `
        <label class="s5-title-row">
          <input type="radio" name="s5title" value="${i}"
            ${i===0?'checked':''} onchange="_s5Meta.selectedTitle=${i}">
          <span class="s5-title-text">${t}</span>
        </label>`).join('')}
      <div class="s5-char-hint">YouTube 100자 / TikTok 150자 기준</div>
    </div>

    <!-- 설명문 -->
    <div class="s5-meta-block">
      <div class="s5-meta-label">📄 설명문
        <button class="s5-mini-copy" onclick="_s5Copy(this,'${_esc(desc)}')">복사</button>
      </div>
      <textarea class="s5-desc-area" rows="5"
        oninput="_s5Meta.desc=this.value">${desc}</textarea>
    </div>

    <!-- 해시태그 -->
    <div class="s5-meta-block">
      <div class="s5-meta-label">🏷 해시태그 (${tags.length}개)</div>
      <div class="s5-tags">
        ${tags.map(t=>`<span class="s5-tag">#${t}</span>`).join('')}
      </div>
      <button class="s5-mini-copy"
        onclick="_s5Copy(this,'${tags.map(t=>'#'+t).join(' ')}')">전체 복사</button>
    </div>

    <!-- 챕터 (롱폼) -->
    ${chapters.length >= 3 ? `
    <div class="s5-meta-block">
      <div class="s5-meta-label">⏱ 챕터 마커 (롱폼 자동 생성)
        <button class="s5-mini-copy"
          onclick="_s5Copy(this,'${_esc(chapters.map(c=>c.text).join('\n'))}')">복사</button>
      </div>
      <div class="s5-chapters">
        ${chapters.map(c=>`<div class="s5-chapter-row">${c.text}</div>`).join('')}
      </div>
    </div>` : ''}

    <!-- 플랫폼별 변환 -->
    <div class="s5-meta-block">
      <div class="s5-meta-label">🌐 플랫폼별 변환</div>
      <div class="s5-plat-tabs">
        ${S5_PLATFORMS.map(p=>`
          <button class="s5-plat-tab ${_s5Platform===p.id?'on':''}"
            onclick="_s5SetPlatform('${p.id}','studioS5Wrap')">
            ${p.icon} ${p.label}
          </button>`).join('')}
      </div>
      ${_s5PlatformPreview()}
    </div>

    <button class="s5-tab-next" onclick="_s5SetTab('t3','studioS5Wrap')">
      다음: 출력 패키지 →
    </button>
  </div>`;
}

function _s5PlatformPreview() {
  const p    = S5_PLATFORMS.find(x => x.id === _s5Platform);
  const sel  = _s5Meta.selectedTitle || 0;
  const title= (_s5Meta.titles[sel] || '').slice(0, p.titleMax || 9999);
  const desc = _s5Meta.desc.slice(0, p.descMax || 9999);
  const tags = p.id === 'instagram'
    ? _s5Meta.tags.slice(0, 30).map(t=>'#'+t).join(' ')
    : _s5Meta.tags.map(t=>'#'+t).join(' ');

  return `
  <div class="s5-plat-preview">
    ${p.titleMax ? `
      <div class="s5-plat-field">
        <div class="s5-plat-field-label">제목 (${title.length}/${p.titleMax}자)</div>
        <div class="s5-plat-field-val">${title}</div>
        <button class="s5-mini-copy" onclick="_s5Copy(this,'${_esc(title)}')">복사</button>
      </div>` : ''}
    <div class="s5-plat-field">
      <div class="s5-plat-field-label">설명 (${desc.length}/${p.descMax}자)</div>
      <div class="s5-plat-field-val s5-clamp">${desc}</div>
      <button class="s5-mini-copy" onclick="_s5Copy(this,'${_esc(desc)}')">복사</button>
    </div>
    <div class="s5-plat-field">
      <div class="s5-plat-field-label">해시태그</div>
      <div class="s5-plat-field-val s5-clamp">${tags}</div>
      <button class="s5-mini-copy" onclick="_s5Copy(this,'${_esc(tags)}')">복사</button>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   T3 — 출력 패키지
   ════════════════════════════════════════════════ */
function _s5RenderT3(proj) {
  return `
  <div class="s5-section">

    <!-- 입력 모드 선택 -->
    <div class="s5-mode-row">
      <button class="s5-mode-btn ${_s5Mode==='project'?'on':''}"
        onclick="_s5SetMode('project','studioS5Wrap')">
        🗂 프로젝트 모드
        <span>이전 단계 데이터 사용</span>
      </button>
      <button class="s5-mode-btn ${_s5Mode==='file'?'on':''}"
        onclick="_s5SetMode('file','studioS5Wrap')">
        📁 파일 직접 업로드
        <span>MP4·SRT·썸네일 수동 선택</span>
      </button>
    </div>

    <!-- 파일 상태 -->
    <div class="s5-files-block">
      ${_s5Mode === 'project'
        ? _s5ProjectFiles(proj)
        : _s5FileUploadUI()}
    </div>

    <!-- API 키 설정 -->
    <details class="s5-api-detail">
      <summary class="s5-api-summary">🔑 업로드 API 설정 (선택)</summary>
      <div class="s5-api-body">
        <div class="s5-api-row">
          <label>YouTube Client ID</label>
          <input type="password" class="s5-api-input"
            value="${_s5ApiKeys.youtube}"
            onchange="localStorage.setItem('s5_yt_client_id',this.value);_s5ApiKeys.youtube=this.value"
            placeholder="YouTube OAuth Client ID">
          <label>YouTube Client Secret</label>
          <input type="password" class="s5-api-input"
            value="${localStorage.getItem('s5_yt_secret')||''}"
            onchange="localStorage.setItem('s5_yt_secret',this.value)"
            placeholder="Client Secret">
        </div>
        <div class="s5-api-row">
          <label>TikTok App Key</label>
          <input type="password" class="s5-api-input"
            value="${_s5ApiKeys.tiktok}"
            onchange="localStorage.setItem('s5_tt_app_key',this.value);_s5ApiKeys.tiktok=this.value"
            placeholder="TikTok App Key">
          <label>TikTok App Secret</label>
          <input type="password" class="s5-api-input"
            value="${localStorage.getItem('s5_tt_secret')||''}"
            onchange="localStorage.setItem('s5_tt_secret',this.value)"
            placeholder="App Secret">
        </div>
        <div class="s5-api-hint">
          🔒 키는 브라우저 로컬 스토리지에만 저장되며 외부 전송되지 않습니다
        </div>
      </div>
    </details>

    <!-- 출력 버튼 -->
    <div class="s5-output-btns">
      <button class="s5-btn-primary" onclick="_s5DownloadZip()">
        📦 업로드 패키지 ZIP 다운로드
        <span>영상 + 썸네일 + SRT + 메타데이터</span>
      </button>

      <button class="s5-btn-guide" onclick="_s5ShowGuide('youtube')">
        📺 YouTube 업로드 가이드
        <span>단계별 업로드 방법 보기</span>
      </button>

      <button class="s5-btn-guide" onclick="_s5ShowGuide('tiktok')">
        🔴 TikTok 업로드 가이드
        <span>단계별 업로드 방법 보기</span>
      </button>

      ${_s5ApiKeys.youtube
        ? `<button class="s5-btn-auto" onclick="_s5YoutubeUpload()">
            ⚡ YouTube 자동 업로드
            <span>API 연결됨 — 바로 업로드</span>
           </button>`
        : `<div class="s5-auto-locked">
            ⚡ 자동 업로드는 API 키 설정 후 이용 가능합니다
           </div>`}
    </div>
  </div>`;
}

function _s5ProjectFiles(proj) {
  const hasScript = !!(proj.scriptText || proj.script);
  const hasScenes = (proj.scenes||[]).length > 0;
  const hasVoice  = !!(proj.voiceGenerated || proj.audioUrl);
  const hasImage  = !!(proj.imageGenerated || (proj.scenes||[]).some(s=>s.imageUrl));

  return `
  <div class="s5-proj-files">
    <div class="s5-file-row ${hasScript?'ok':'miss'}">
      ${hasScript?'✅':'⚠️'} 대본 텍스트 ${hasScript?'준비됨':'없음'}
    </div>
    <div class="s5-file-row ${hasScenes?'ok':'miss'}">
      ${hasScenes?'✅':'⚠️'} 씬 구성 (${(proj.scenes||[]).length}씬) ${hasScenes?'준비됨':'없음'}
    </div>
    <div class="s5-file-row ${hasVoice?'ok':'miss'}">
      ${hasVoice?'✅':'⚠️'} 음성 파일 ${hasVoice?'준비됨':'미생성 — STEP3 먼저'}
    </div>
    <div class="s5-file-row ${hasImage?'ok':'miss'}">
      ${hasImage?'✅':'⚠️'} 이미지 ${hasImage?'준비됨':'미생성 — STEP2 먼저'}
    </div>
    <div class="s5-file-row ok">✅ 메타데이터 — T2에서 생성됨</div>
  </div>`;
}

function _s5FileUploadUI() {
  return `
  <div class="s5-upload-ui">
    <div class="s5-upload-row">
      <label class="s5-upload-label">🎬 영상 파일 (MP4)</label>
      <input type="file" accept="video/mp4,video/*"
        onchange="_s5Files.video=this.files[0];_s5UpdateFileStatus(this,'video-status')">
      <span id="video-status" class="s5-file-status">
        ${_s5Files.video ? '✅ '+_s5Files.video.name : '미선택'}
      </span>
    </div>
    <div class="s5-upload-row">
      <label class="s5-upload-label">🖼 썸네일 (JPG/PNG)</label>
      <input type="file" accept="image/*"
        onchange="_s5Files.thumb=this.files[0];_s5UpdateFileStatus(this,'thumb-status')">
      <span id="thumb-status" class="s5-file-status">
        ${_s5Files.thumb ? '✅ '+_s5Files.thumb.name : '미선택'}
      </span>
    </div>
    <div class="s5-upload-row">
      <label class="s5-upload-label">📝 자막 (SRT — 선택)</label>
      <input type="file" accept=".srt,.vtt"
        onchange="_s5Files.srt=this.files[0];_s5UpdateFileStatus(this,'srt-status')">
      <span id="srt-status" class="s5-file-status">
        ${_s5Files.srt ? '✅ '+_s5Files.srt.name : '미선택 (선택사항)'}
      </span>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   T4 — 성과 수동 기록
   ════════════════════════════════════════════════ */
function _s5RenderT4() {
  const records = JSON.parse(localStorage.getItem(S5_LS) || '[]');

  return `
  <div class="s5-section">
    <div class="s5-t4-grid">

      <!-- 새 성과 입력 -->
      <div class="s5-record-form">
        <div class="s5-meta-label">📊 성과 기록 입력</div>

        <div class="s5-form-row">
          <label>업로드 날짜</label>
          <input type="date" id="s5RecDate"
            value="${new Date().toISOString().slice(0,10)}">
        </div>
        <div class="s5-form-row">
          <label>플랫폼</label>
          <select id="s5RecPlat">
            ${S5_PLATFORMS.map(p=>`<option value="${p.id}">${p.icon} ${p.label}</option>`).join('')}
          </select>
        </div>

        <div class="s5-form-2col">
          <div class="s5-form-row">
            <label>조회수</label>
            <input type="number" id="s5RecViews" placeholder="0">
          </div>
          <div class="s5-form-row">
            <label>CTR (%)</label>
            <input type="number" id="s5RecCtr" placeholder="0.0" step="0.1">
          </div>
          <div class="s5-form-row">
            <label>시청지속률 (%)</label>
            <input type="number" id="s5RecRetention" placeholder="0">
          </div>
          <div class="s5-form-row">
            <label>좋아요</label>
            <input type="number" id="s5RecLikes" placeholder="0">
          </div>
          <div class="s5-form-row">
            <label>댓글 수</label>
            <input type="number" id="s5RecComments" placeholder="0">
          </div>
          <div class="s5-form-row">
            <label>구독 증가</label>
            <input type="number" id="s5RecSubs" placeholder="0">
          </div>
        </div>

        <div class="s5-form-row">
          <label>💬 댓글 메모 (주요 반응)</label>
          <textarea id="s5RecCommentMemo" rows="3"
            placeholder="주요 댓글 내용, 시청자 반응 기록..."></textarea>
        </div>
        <div class="s5-form-row">
          <label>💡 다음 영상 아이디어</label>
          <textarea id="s5RecNextIdea" rows="2"
            placeholder="댓글에서 나온 주제, 시청자 요청..."></textarea>
        </div>

        <button class="s5-btn-primary" onclick="_s5SaveRecord()">
          💾 성과 저장
        </button>
      </div>

      <!-- 히스토리 -->
      <div class="s5-record-history">
        <div class="s5-meta-label">📈 성과 히스토리 (${records.length}건)</div>
        ${records.length === 0
          ? `<div class="s5-empty">아직 기록이 없어요.<br>첫 영상 성과를 입력해보세요!</div>`
          : records.slice().reverse().map(r => `
            <div class="s5-record-card">
              <div class="s5-record-hd">
                <span>${S5_PLATFORMS.find(p=>p.id===r.plat)?.icon||'📺'} ${r.date}</span>
                <button class="s5-record-del"
                  onclick="_s5DelRecord('${r.id}')">×</button>
              </div>
              <div class="s5-record-stats">
                <span>👁 ${(r.views||0).toLocaleString()}</span>
                <span>CTR ${r.ctr||0}%</span>
                <span>지속 ${r.retention||0}%</span>
                <span>❤️ ${(r.likes||0).toLocaleString()}</span>
              </div>
              ${r.nextIdea ? `
                <div class="s5-record-idea">
                  💡 ${r.nextIdea}
                  <button onclick="_s5UseIdea('${_esc(r.nextIdea)}')">
                    → 대본에 사용
                  </button>
                </div>` : ''}
            </div>`).join('')}

        ${records.length > 0 ? `
          <div class="s5-record-avg">
            <div class="s5-meta-label">📊 평균 성과</div>
            ${_s5CalcAvg(records)}
          </div>` : ''}
      </div>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   헬퍼 함수들
   ════════════════════════════════════════════════ */
function _s5Title(script, type) {
  const words = (script || '').slice(0, 300);
  if (type === 'hook')   return `이거 모르면 후회해요 — ${words.slice(0,20)}`;
  if (type === 'info')   return `${words.slice(0,25)} 완벽 정리`;
  if (type === 'secret') return `${words.slice(0,20)}의 비밀 공개`;
  return words.slice(0, 40);
}

function _s5Tags(script, proj) {
  const genre  = proj?.genre || '';
  const base   = ['시니어', '일본어', '콘텐츠', '유튜브', '숏츠'];
  const from   = (script || '').match(/[\uAC00-\uD7A3]{2,6}/g) || [];
  const unique = [...new Set([...base, genre, ...from.slice(0,15)])].filter(Boolean);
  return unique.slice(0, 20);
}

function _s5Desc(script, proj) {
  const summary = (script || '').slice(0, 200).replace(/\n/g,' ');
  return `${summary}...\n\n👍 도움이 됐다면 좋아요·구독 부탁드려요!\n💬 궁금한 점은 댓글로 남겨주세요.\n\n#MOCA #콘텐츠생성`;
}

function _s5Chapters(scenes) {
  if (!scenes || scenes.length < 3) return [];
  return scenes.map((s, i) => ({
    text: `${_s5FormatTime(i * 60)} ${s.label || s.desc || `씬 ${i+1}`}`
  }));
}

function _s5FormatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2,'0');
  const s = (sec % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

function _s5CalcAvg(records) {
  const n = records.length;
  const avg = k => Math.round(records.reduce((a,r)=>a+(+r[k]||0),0)/n);
  return `
  <div class="s5-avg-row">
    <span>평균 조회수 <b>${avg('views').toLocaleString()}</b></span>
    <span>평균 CTR <b>${avg('ctr')}%</b></span>
    <span>평균 시청지속 <b>${avg('retention')}%</b></span>
  </div>`;
}

function _esc(str) {
  return (str||'').replace(/'/g,"\\'").replace(/\n/g,'\\n');
}

/* ── 이벤트 핸들러 ── */
window._s5SetTab = function(tab, wid) {
  _s5Tab = tab;
  _studioS6(wid);
};

window._s5SetMode = function(mode, wid) {
  _s5Mode = mode;
  _studioS6(wid);
};

window._s5SetPlatform = function(plat, wid) {
  _s5Platform = plat;
  _studioS6(wid);
};

window._s5Copy = function(btn, text) {
  navigator.clipboard.writeText(text.replace(/\\n/g,'\n')).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✅ 복사됨';
    setTimeout(() => { btn.textContent = orig; }, 1500);
  });
};

window._s5UpdateFileStatus = function(input, statusId) {
  const el = document.getElementById(statusId);
  if (el && input.files[0]) el.textContent = '✅ ' + input.files[0].name;
};

window._s5GoStep = function(step) {
  if (typeof studioGoto === 'function') studioGoto(step);
};

window._s5DownloadZip = function() {
  const meta = _s5Meta;
  const sel  = meta.selectedTitle || 0;
  const title= meta.titles[sel] || '영상';
  const txt  = [
    `제목: ${title}`,
    ``,
    `설명:`,
    meta.desc,
    ``,
    `해시태그:`,
    meta.tags.map(t=>'#'+t).join(' '),
    ``,
    `챕터:`,
    meta.chapters.map(c=>c.text).join('\n'),
  ].join('\n');

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${title.slice(0,30)}_메타데이터.txt`;
  a.click();
  URL.revokeObjectURL(url);

  alert('📦 메타데이터 파일이 다운로드됐어요!\n영상·썸네일·SRT 파일과 함께 패키징하세요.');
};

window._s5ShowGuide = function(platform) {
  const guides = {
    youtube: `📺 YouTube 업로드 가이드\n\n1. youtube.com/upload 접속\n2. 영상 파일 드래그 업로드\n3. 제목·설명 붙여넣기 (T2 복사 버튼 활용)\n4. 썸네일 업로드\n5. 자막 > SRT 파일 업로드\n6. 공개 설정 후 게시`,
    tiktok:  `🔴 TikTok 업로드 가이드\n\n1. tiktok.com/creator-center 접속\n2. 영상 업로드\n3. 캡션 (해시태그 포함) 붙여넣기\n4. 커버 이미지 설정\n5. 게시`,
  };
  alert(guides[platform] || '가이드 준비 중');
};

window._s5YoutubeUpload = function() {
  alert('YouTube 자동 업로드 기능은 OAuth 연결 후 사용 가능합니다.\nAPI 키를 먼저 설정해주세요.');
};

window._s5SaveRecord = function() {
  const get = id => document.getElementById(id)?.value || '';
  const record = {
    id:        Date.now().toString(),
    date:      get('s5RecDate'),
    plat:      get('s5RecPlat'),
    views:     get('s5RecViews'),
    ctr:       get('s5RecCtr'),
    retention: get('s5RecRetention'),
    likes:     get('s5RecLikes'),
    comments:  get('s5RecComments'),
    subs:      get('s5RecSubs'),
    commentMemo: get('s5RecCommentMemo'),
    nextIdea:  get('s5RecNextIdea'),
  };
  const records = JSON.parse(localStorage.getItem(S5_LS)||'[]');
  records.push(record);
  localStorage.setItem(S5_LS, JSON.stringify(records));
  _studioS6('studioS5Wrap');
};

window._s5DelRecord = function(id) {
  if (!confirm('이 기록을 삭제할까요?')) return;
  const records = JSON.parse(localStorage.getItem(S5_LS)||'[]')
    .filter(r => r.id !== id);
  localStorage.setItem(S5_LS, JSON.stringify(records));
  _studioS6('studioS5Wrap');
};

window._s5UseIdea = function(idea) {
  if (typeof studioGoto === 'function') {
    studioGoto(1);
    setTimeout(() => {
      const el = document.querySelector('#studio-topic,#sc-topic,[name="topic"]');
      if (el) { el.value = idea; el.dispatchEvent(new Event('input')); }
    }, 500);
  }
};

/* ════════════════════════════════════════════════
   CSS 주입
   ════════════════════════════════════════════════ */
function _s5InjectCSS() {
  if (document.getElementById('s5-style')) return;
  const st = document.createElement('style');
  st.id = 's5-style';
  st.textContent = `
/* s5 wrap */
.s5-wrap{font-family:inherit}
.s5-nav{display:flex;gap:4px;margin-bottom:14px;flex-wrap:wrap}
.s5-tab{padding:8px 16px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:12px;font-weight:700;color:#7b7077;cursor:pointer;transition:.14s}
.s5-tab.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.s5-body{background:#fff;border-radius:16px;border:1px solid #f1dce7;padding:18px}
.s5-section{}
.s5-tab-next{margin-top:16px;width:100%;padding:12px;border:none;border-radius:12px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;font-weight:800;
  font-size:14px;cursor:pointer}

/* 검수 */
.s5-check-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
@media(max-width:600px){.s5-check-grid{grid-template-columns:1fr}}
.s5-check-card{border:1.5px solid #f1dce7;border-radius:14px;padding:14px;background:#fbf7f9}
.s5-check-hd{display:flex;justify-content:space-between;align-items:center;
  font-weight:800;font-size:13px;margin-bottom:4px}
.s5-check-desc{font-size:11px;color:#9b8a93;margin-bottom:10px}
.s5-score{padding:3px 10px;border-radius:20px;font-size:12px;font-weight:800}
.s5-score.good{background:#effbf7;color:#1a7a5a}
.s5-score.warn{background:#fffbe8;color:#8a6800}
.s5-score.bad{background:#fff1f1;color:#c0392b}
.s5-ok-row{font-size:12px;color:#1a7a5a;padding:6px 0}
.s5-risk-row{display:flex;align-items:center;gap:8px;padding:6px 0;
  border-bottom:1px solid #f1dce7;font-size:12px}
.s5-risk-badge{padding:2px 8px;border-radius:20px;font-weight:700;font-size:11px;white-space:nowrap}
.s5-risk-badge.error{background:#fff1f1;color:#c0392b}
.s5-risk-badge.warn{background:#fffbe8;color:#8a6800}
.s5-risk-sample{color:#9b8a93;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.s5-btn-fix{margin-top:10px;width:100%;padding:8px;border:1.5px solid #ef6fab;
  border-radius:10px;background:#fff;color:#ef6fab;font-weight:700;font-size:12px;cursor:pointer}
.s5-perf-row{display:flex;align-items:flex-start;gap:8px;padding:6px 0;
  border-bottom:1px solid #f1dce7;font-size:12px}
.s5-perf-icon{font-size:14px;flex-shrink:0}
.s5-perf-label{font-weight:700}
.s5-perf-tip{color:#9b8a93;font-size:11px;margin-top:2px}
.s5-verdict{padding:12px 16px;border-radius:12px;margin-top:12px;
  display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:13px}
.s5-verdict.pass{background:#effbf7;color:#1a7a5a}
.s5-verdict.warn{background:#fffbe8;color:#8a6800}

/* 메타데이터 */
.s5-meta-block{margin-bottom:14px}
.s5-meta-label{font-size:12px;font-weight:800;color:#2b2430;margin-bottom:6px;
  display:flex;align-items:center;gap:8px}
.s5-title-row{display:flex;align-items:center;gap:8px;padding:8px;
  border:1.5px solid #f1dce7;border-radius:10px;margin-bottom:4px;cursor:pointer;font-size:13px}
.s5-title-row:has(input:checked){border-color:#ef6fab;background:#fff1f8}
.s5-title-text{flex:1}
.s5-char-hint{font-size:11px;color:#9b8a93;margin-top:4px}
.s5-desc-area{width:100%;border:1.5px solid #f1dce7;border-radius:10px;
  padding:10px;font-size:12.5px;resize:vertical;outline:none}
.s5-desc-area:focus{border-color:#ef6fab}
.s5-tags{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px}
.s5-tag{background:#fff1f8;color:#ef6fab;border-radius:20px;
  padding:3px 10px;font-size:11px;font-weight:700}
.s5-mini-copy{padding:3px 10px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:11px;cursor:pointer;font-weight:700;transition:.12s}
.s5-mini-copy:hover{border-color:#ef6fab;color:#ef6fab}
.s5-chapters{font-size:12px;color:#3a3038;line-height:1.8}
.s5-chapter-row{padding:2px 0}
.s5-plat-tabs{display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap}
.s5-plat-tab{padding:6px 14px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:12px;font-weight:700;color:#7b7077;cursor:pointer;transition:.12s}
.s5-plat-tab.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}
.s5-plat-preview{background:#f9f3fb;border-radius:12px;padding:12px}
.s5-plat-field{margin-bottom:10px}
.s5-plat-field-label{font-size:11px;color:#9b8a93;margin-bottom:3px}
.s5-plat-field-val{font-size:12.5px;color:#2b2430;word-break:break-all}
.s5-plat-field-val.s5-clamp{display:-webkit-box;-webkit-line-clamp:3;
  -webkit-box-orient:vertical;overflow:hidden}

/* 출력 패키지 */
.s5-mode-row{display:flex;gap:8px;margin-bottom:14px}
.s5-mode-btn{flex:1;padding:12px;border:2px solid #f1dce7;border-radius:14px;
  background:#fff;cursor:pointer;font-weight:800;font-size:13px;text-align:center;transition:.14s}
.s5-mode-btn span{display:block;font-size:11px;font-weight:400;color:#9b8a93;margin-top:2px}
.s5-mode-btn.on{border-color:#9181ff;background:#ede9ff;color:#5b4ecf}
.s5-files-block{margin-bottom:14px}
.s5-proj-files{display:flex;flex-direction:column;gap:6px}
.s5-file-row{padding:8px 12px;border-radius:10px;font-size:13px;font-weight:600}
.s5-file-row.ok{background:#effbf7;color:#1a7a5a}
.s5-file-row.miss{background:#fff8f0;color:#c0692b}
.s5-upload-ui{display:flex;flex-direction:column;gap:10px}
.s5-upload-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.s5-upload-label{font-size:12px;font-weight:700;min-width:140px}
.s5-file-status{font-size:11px;color:#9b8a93}
.s5-api-detail{border:1.5px solid #f1dce7;border-radius:12px;margin-bottom:14px}
.s5-api-summary{padding:12px 16px;font-weight:800;font-size:13px;cursor:pointer;list-style:none}
.s5-api-body{padding:12px 16px;border-top:1px solid #f1dce7}
.s5-api-row{display:grid;grid-template-columns:auto 1fr;gap:6px 10px;
  align-items:center;margin-bottom:8px}
.s5-api-input{border:1.5px solid #f1dce7;border-radius:8px;padding:6px 10px;
  font-size:12px;width:100%;outline:none}
.s5-api-input:focus{border-color:#9181ff}
.s5-api-hint{font-size:11px;color:#9b8a93;margin-top:6px}
.s5-output-btns{display:flex;flex-direction:column;gap:8px}
.s5-btn-primary{padding:16px;border:none;border-radius:14px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-weight:800;font-size:15px;cursor:pointer;text-align:left}
.s5-btn-primary span{display:block;font-size:11px;font-weight:400;opacity:.85;margin-top:2px}
.s5-btn-guide{padding:12px 16px;border:2px solid #f1dce7;border-radius:12px;
  background:#fff;font-weight:700;font-size:13px;cursor:pointer;text-align:left;transition:.14s}
.s5-btn-guide:hover{border-color:#9181ff;background:#ede9ff}
.s5-btn-guide span{display:block;font-size:11px;color:#9b8a93;margin-top:2px}
.s5-btn-auto{padding:12px 16px;border:2px solid #ef6fab;border-radius:12px;
  background:#fff1f8;color:#ef6fab;font-weight:700;font-size:13px;cursor:pointer;text-align:left}
.s5-btn-auto span{display:block;font-size:11px;margin-top:2px}
.s5-auto-locked{padding:12px 16px;border:2px dashed #f1dce7;border-radius:12px;
  color:#9b8a93;font-size:12px}

/* 성과 기록 */
.s5-t4-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:700px){.s5-t4-grid{grid-template-columns:1fr}}
.s5-record-form{border:1.5px solid #f1dce7;border-radius:14px;padding:14px;background:#fbf7f9}
.s5-form-row{margin-bottom:8px}
.s5-form-row label{display:block;font-size:11px;font-weight:700;color:#7b7077;margin-bottom:3px}
.s5-form-row input,.s5-form-row select,.s5-form-row textarea{
  width:100%;border:1.5px solid #f1dce7;border-radius:8px;padding:7px 10px;
  font-size:12.5px;outline:none;font-family:inherit}
.s5-form-row input:focus,.s5-form-row select:focus,.s5-form-row textarea:focus{
  border-color:#9181ff}
.s5-form-2col{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.s5-record-history{border:1.5px solid #f1dce7;border-radius:14px;padding:14px}
.s5-empty{text-align:center;color:#9b8a93;font-size:13px;padding:24px 0}
.s5-record-card{border:1.5px solid #f1dce7;border-radius:10px;padding:10px;margin-bottom:8px}
.s5-record-hd{display:flex;justify-content:space-between;font-size:12px;
  font-weight:700;margin-bottom:6px}
.s5-record-del{background:none;border:none;color:#9b8a93;cursor:pointer;font-size:14px}
.s5-record-stats{display:flex;gap:10px;font-size:12px;color:#3a3038;flex-wrap:wrap}
.s5-record-idea{margin-top:6px;font-size:11.5px;color:#9b8a93;
  display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.s5-record-idea button{padding:2px 8px;border:1px solid #9181ff;border-radius:20px;
  background:#fff;color:#9181ff;font-size:11px;cursor:pointer}
.s5-record-avg{margin-top:12px;padding-top:12px;border-top:1px solid #f1dce7}
.s5-avg-row{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:#3a3038;margin-top:6px}
`;
  document.head.appendChild(st);
}
