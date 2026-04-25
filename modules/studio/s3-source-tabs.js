/* ================================================
   modules/studio/s3-source-tabs.js
   ② 이미지·영상 소스 — 탭 라우팅 + 씬 매핑 패널

   기존 파일 변경 없이 탭만 씌움:
   TAB 1 🖼 이미지 생성  → s3-image.js (_studioS3)
   TAB 2 🎬 영상 프롬프트 → s3-video.js (_studioS3Video)
   TAB 3 📁 업로드·스톡  → s3-video.js TAB C + s3-stock.js + s3-reuse.js
   ================================================ */

/* ── 전역 상태 ── */
let _s3Tab = 'image'; // 'image' | 'video' | 'upload'

/* ════════════════════════════════════════════════
   메인 렌더
   ════════════════════════════════════════════════ */
function _studioS3Source(wrapId) {
  const wrap = document.getElementById(wrapId || 'studioS3SourceWrap');
  if (!wrap) return;

  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const scenes = proj.scenes || [];

  // sources 초기화
  if (!proj.sources) {
    proj.sources = {
      mode: 'image',
      images: [],
      videoPrompts: [],
      uploadedFiles: [],
      externalTool: { name: 'invideo', prompt: '', outputVideo: null },
    };
  }

  wrap.innerHTML = `
  <div class="s3src-wrap">

    <!-- 탭 헤더 -->
    <div class="s3src-tabs">
      <button class="s3src-tab ${_s3Tab==='image'?'on':''}"
        onclick="window._s3SrcSetTab('image','${wrapId||'studioS3SourceWrap'}')">
        🖼 이미지 생성
      </button>
      <button class="s3src-tab ${_s3Tab==='video'?'on':''}"
        onclick="window._s3SrcSetTab('video','${wrapId||'studioS3SourceWrap'}')">
        🎬 영상 프롬프트
      </button>
      <button class="s3src-tab ${_s3Tab==='upload'?'on':''}"
        onclick="window._s3SrcSetTab('upload','${wrapId||'studioS3SourceWrap'}')">
        📁 업로드·스톡
      </button>
    </div>

    <!-- 씬-소스 매핑 패널 -->
    ${scenes.length > 0 ? _s3RenderSceneMap(scenes, proj) : ''}

    <!-- 탭 콘텐츠 -->
    <div class="s3src-content" id="s3SrcContent">
      ${_s3RenderTabContent(wrapId)}
    </div>

    <!-- 하단 액션 -->
    <div class="s3src-footer">
      <button class="s3src-skip-btn"
        onclick="typeof studioGoto==='function'&&studioGoto(3)">
        건너뛰기 → 음성·BGM 먼저
      </button>
      <button class="s3src-next-btn"
        onclick="_s3SrcNext()">
        다음: 음성·BGM →
      </button>
    </div>

  </div>`;

  _s3SrcInjectCSS();

  // 탭 콘텐츠 렌더 (별도 함수 호출)
  _s3SrcRenderContent(wrapId);
}

/* ── 씬-소스 매핑 패널 ── */
function _s3RenderSceneMap(scenes, proj) {
  const hasAny = scenes.some(s => s.imageUrl || s.videoUrl);

  return `
  <div class="s3src-map">
    <div class="s3src-map-hd">
      📋 씬별 소스 현황
      ${hasAny
        ? `<span class="s3src-map-ok">✅ 일부 완료</span>`
        : `<span class="s3src-map-warn">⚠️ 소스 없음 — 건너뛰기 가능</span>`}
    </div>
    <div class="s3src-map-grid">
      ${scenes.map((s,i) => {
        const hasImg = !!(s.imageUrl || s.img);
        const hasVid = !!(s.videoUrl);
        const status = hasImg ? 'img' : hasVid ? 'vid' : 'none';
        return `
        <div class="s3src-map-item ${status}"
          title="씬${i+1}: ${s.label||s.desc||''}">
          <span class="s3src-map-num">${i+1}</span>
          <span class="s3src-map-ico">
            ${hasImg ? '🖼' : hasVid ? '🎬' : '⬜'}
          </span>
        </div>`;
      }).join('')}
    </div>
    ${!hasAny ? `
    <div class="s3src-map-hint">
      대본에서 씬이 추출됐어요. 이미지/영상을 생성하거나 건너뛸 수 있어요.
    </div>` : ''}
  </div>`;
}

/* ── 탭 콘텐츠 HTML ── */
function _s3RenderTabContent(wrapId) {
  if (_s3Tab === 'image') {
    return '<div id="studioS3ImageInner"></div>';
  }
  if (_s3Tab === 'video') {
    return '<div id="studioS3VideoWrap"></div>';
  }
  if (_s3Tab === 'upload') {
    return `
    <div class="s3src-upload-tabs">
      <button class="s3src-upload-tab on" onclick="_s3SrcSwitchUpload(this,'upload')">
        📁 직접 업로드
      </button>
      <button class="s3src-upload-tab" onclick="_s3SrcSwitchUpload(this,'stock')">
        🔍 스톡 검색
      </button>
      <button class="s3src-upload-tab" onclick="_s3SrcSwitchUpload(this,'reuse')">
        ♻️ 기존 재사용
      </button>
    </div>
    <div id="s3SrcUploadInner"></div>`;
  }
  return '';
}

/* ── 탭 콘텐츠 실제 렌더 ── */
function _s3SrcRenderContent(wrapId) {
  if (_s3Tab === 'image') {
    // 기존 s3-image.js — _studioS3() 는 HTML 문자열 반환, innerHTML 주입 + bind 호출
    const el = document.getElementById('studioS3ImageInner');
    if (el && typeof _studioS3 === 'function') {
      const html = _studioS3();
      if (html) el.innerHTML = html;
    } else if (el) {
      el.innerHTML = '<div class="s3src-loading">🖼 이미지 생성 로딩 중...</div>';
    }
    if (typeof _studioBindS3 === 'function') _studioBindS3();
    // 대본 → 이미지 프롬프트 자동 연동
    _s3SrcAutoPrompt();
  }

  if (_s3Tab === 'video') {
    const el = document.getElementById('studioS3VideoWrap');
    if (typeof _studioS3VideoTools === 'function' && el) {
      el.innerHTML = '<div id="studioS3VTWrap"></div>';
      _studioS3VideoTools('studioS3VTWrap');
    } else if (typeof _studioS3Video === 'function') {
      _studioS3Video('studioS3VideoWrap');
    } else if (el) {
      el.innerHTML = '<div class="s3src-loading">🎬 영상 프롬프트 로딩 중...</div>';
    }
  }

  if (_s3Tab === 'upload') {
    _s3SrcRenderUpload('upload');
  }
}

/* ── 업로드·스톡·재사용 렌더 ── */
function _s3SrcRenderUpload(subTab) {
  const inner = document.getElementById('s3SrcUploadInner');
  if (!inner) return;

  if (subTab === 'upload') {
    // s3-video.js의 TAB C 직접 업로드
    if (typeof _studioS3Video === 'function' && typeof _s3vSetTab === 'function') {
      inner.innerHTML = '<div id="s3VideoUploadWrap"></div>';
      _s3vSetTab('c', 's3VideoUploadWrap');
    } else {
      inner.innerHTML = _s3SrcBasicUploadUI();
    }
  }

  if (subTab === 'stock') {
    // 기존 s3-stock.js 호출
    if (typeof renderS3Stock === 'function') {
      inner.innerHTML = '<div id="s3StockInner"></div>';
      renderS3Stock('s3StockInner');
    } else if (typeof _studioS3Stock === 'function') {
      inner.innerHTML = '<div id="s3StockInner"></div>';
      _studioS3Stock('s3StockInner');
    } else {
      inner.innerHTML = '<div class="s3src-loading">🔍 스톡 검색 로딩 중...</div>';
    }
  }

  if (subTab === 'reuse') {
    // 기존 s3-reuse.js 호출
    if (typeof renderS3Reuse === 'function') {
      inner.innerHTML = '<div id="s3ReuseInner"></div>';
      renderS3Reuse('s3ReuseInner');
    } else if (typeof _studioS3Reuse === 'function') {
      inner.innerHTML = '<div id="s3ReuseInner"></div>';
      _studioS3Reuse('s3ReuseInner');
    } else {
      inner.innerHTML = '<div class="s3src-loading">♻️ 재사용 목록 로딩 중...</div>';
    }
  }
}

/* ── 기본 업로드 UI (fallback) ── */
function _s3SrcBasicUploadUI() {
  return `
  <div class="s3src-basic-upload">
    <div class="s3src-upload-cards">
      <div class="s3src-upload-card">
        <div class="s3src-upload-ico">🎬</div>
        <div class="s3src-upload-title">영상 파일 (MP4)</div>
        <input type="file" accept="video/*" multiple
          onchange="window._s3SrcHandleFiles(this.files,'video')">
      </div>
      <div class="s3src-upload-card">
        <div class="s3src-upload-ico">🖼</div>
        <div class="s3src-upload-title">이미지 파일</div>
        <input type="file" accept="image/*" multiple
          onchange="window._s3SrcHandleFiles(this.files,'image')">
      </div>
    </div>
    <div id="s3SrcFileList" class="s3src-file-list"></div>
  </div>`;
}

/* ── 대본 → 이미지 프롬프트 자동 연동 ── */
function _s3SrcAutoPrompt() {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const scenes = proj.scenes || [];
  if (!scenes.length) return;

  // 씬에 imagePrompt 없으면 대본 텍스트로 자동 생성
  scenes.forEach(s => {
    if (!s.imagePrompt && s.text) {
      s.imagePrompt = _s3SrcBuildPrompt(s, proj);
    }
  });
}

function _s3SrcBuildPrompt(scene, proj) {
  const lang  = proj.lang || 'ko';
  const style = proj.style || 'emotional';
  const styleMap = {
    emotional: 'warm and emotional atmosphere, soft lighting',
    info:      'clean informational style, bright lighting',
    humor:     'fun and playful style, vibrant colors',
    drama:     'dramatic cinematic style, contrast lighting',
    senior:    'warm natural light, comfortable atmosphere',
    knowledge: 'professional clean style, neutral background',
  };
  const atmos = styleMap[style] || styleMap.emotional;
  const nat   = lang === 'ja' ? 'Japanese' : 'Korean';
  const text  = (scene.text || scene.desc || '').slice(0, 80);

  return `${text}, ${nat} style, ${atmos}, 9:16 vertical, high quality photo`;
}

/* ════════════════════════════════════════════════
   이벤트 핸들러
   ════════════════════════════════════════════════ */
window._s3SrcSetTab = function(tab, wid) {
  _s3Tab = tab;

  // STUDIO.project.sources.mode 업데이트
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  if (proj.sources) {
    proj.sources.mode = tab === 'image' ? 'image'
      : tab === 'video' ? 'video_prompt' : 'upload';
  }

  _studioS3Source(wid);
};

window._s3SrcSwitchUpload = function(btn, subTab) {
  document.querySelectorAll('.s3src-upload-tab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  _s3SrcRenderUpload(subTab);
};

window._s3SrcHandleFiles = function(files, type) {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  if (!proj.sources) proj.sources = { uploadedFiles: [] };
  if (!proj.sources.uploadedFiles) proj.sources.uploadedFiles = [];

  Array.from(files).forEach(f => {
    const url = URL.createObjectURL(f);
    proj.sources.uploadedFiles.push({ name: f.name, type, url, file: f });
  });

  if (typeof studioSave === 'function') studioSave();

  // 파일 목록 업데이트
  const listEl = document.getElementById('s3SrcFileList');
  if (listEl) {
    listEl.innerHTML = proj.sources.uploadedFiles.map((f, i) => `
      <div class="s3src-file-item">
        <span>${f.type === 'video' ? '🎬' : '🖼'} ${f.name}</span>
        <button onclick="window._s3SrcRemoveFile(${i})" class="s3src-file-del">×</button>
      </div>
    `).join('');
  }
};

window._s3SrcRemoveFile = function(idx) {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  if (proj.sources?.uploadedFiles) {
    proj.sources.uploadedFiles.splice(idx, 1);
    if (typeof studioSave === 'function') studioSave();
    _s3SrcRenderUpload('upload');
  }
};

window._s3SrcNext = function() {
  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const scenes = proj.scenes || [];
  const src    = proj.sources || {};
  const mode   = src.mode || 'image';

  // 유효성 체크
  const hasImg = scenes.some(s => s.imageUrl || s.img);
  const hasVid = (src.videoPrompts || []).length > 0;
  const hasUpl = (src.uploadedFiles || []).length > 0;

  if (!hasImg && !hasVid && !hasUpl) {
    if (!confirm('소스가 없어요. 그냥 다음 단계로 진행할까요?\n(나중에 편집 단계에서 추가 가능)')) return;
  }

  if (typeof studioSave === 'function') studioSave();
  if (typeof studioGoto === 'function') studioGoto(3);
};

/* ── CSS ── */
function _s3SrcInjectCSS() {
  if (document.getElementById('s3src-style')) return;
  const st = document.createElement('style');
  st.id = 's3src-style';
  st.textContent = `
.s3src-wrap{display:flex;flex-direction:column;gap:0}

/* 탭 */
.s3src-tabs{display:flex;gap:4px;padding:12px 16px 0;background:#fff;
  border-bottom:1px solid #f1dce7;flex-wrap:wrap}
.s3src-tab{padding:10px 16px;border:none;border-bottom:2px solid transparent;
  background:none;font-size:13px;font-weight:700;color:#9b8a93;cursor:pointer;transition:.14s}
.s3src-tab.on{color:#ef6fab;border-bottom-color:#ef6fab}
.s3src-tab:hover:not(.on){color:#2b2430}

/* 씬 매핑 */
.s3src-map{padding:10px 16px;background:#f9f3fb;border-bottom:1px solid #f1dce7}
.s3src-map-hd{font-size:12px;font-weight:800;color:#2b2430;margin-bottom:8px;
  display:flex;align-items:center;gap:8px}
.s3src-map-ok{font-size:11px;color:#1a7a5a;font-weight:700}
.s3src-map-warn{font-size:11px;color:#9b8a93;font-weight:600}
.s3src-map-grid{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:4px}
.s3src-map-item{display:flex;flex-direction:column;align-items:center;gap:2px;
  padding:6px 8px;border-radius:8px;border:1.5px solid #f1dce7;background:#fff;
  min-width:36px;transition:.12s}
.s3src-map-item.img{border-color:#9181ff;background:#ede9ff}
.s3src-map-item.vid{border-color:#ef6fab;background:#fff1f8}
.s3src-map-item.none{opacity:.6}
.s3src-map-num{font-size:9px;color:#9b8a93;font-weight:700}
.s3src-map-ico{font-size:14px}
.s3src-map-hint{font-size:11px;color:#9b8a93;margin-top:4px}

/* 콘텐츠 */
.s3src-content{flex:1;padding:0}
.s3src-loading{text-align:center;padding:40px;color:#9b8a93;font-size:14px}

/* 업로드 서브탭 */
.s3src-upload-tabs{display:flex;gap:4px;padding:12px 16px 0;flex-wrap:wrap}
.s3src-upload-tab{padding:6px 14px;border:1.5px solid #f1dce7;border-radius:20px;
  background:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:.12s;color:#7b7077}
.s3src-upload-tab.on{background:#9181ff;color:#fff;border-color:#9181ff}

/* 업로드 카드 */
.s3src-basic-upload{padding:16px}
.s3src-upload-cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.s3src-upload-card{border:2px dashed #f1dce7;border-radius:14px;padding:24px;
  text-align:center;position:relative;cursor:pointer;transition:.12s}
.s3src-upload-card:hover{border-color:#ef6fab;background:#fff1f8}
.s3src-upload-card input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
.s3src-upload-ico{font-size:28px;margin-bottom:8px}
.s3src-upload-title{font-size:13px;font-weight:800}
.s3src-file-list{display:flex;flex-direction:column;gap:6px}
.s3src-file-item{display:flex;align-items:center;justify-content:space-between;
  padding:8px 12px;background:#f9f3fb;border-radius:10px;font-size:12px}
.s3src-file-del{background:none;border:none;color:#9b8a93;cursor:pointer;font-size:16px;
  padding:0 4px;transition:.12s}
.s3src-file-del:hover{color:#dc2626}

/* 하단 */
.s3src-footer{display:flex;gap:8px;padding:12px 16px;
  background:#fff;border-top:1px solid #f1dce7;position:sticky;bottom:0}
.s3src-skip-btn{padding:12px 16px;border:1.5px solid #f1dce7;border-radius:12px;
  background:#fff;font-size:12px;font-weight:700;cursor:pointer;color:#9b8a93;transition:.12s}
.s3src-skip-btn:hover{border-color:#9b8a93;color:#2b2430}
.s3src-next-btn{flex:1;padding:12px;border:none;border-radius:12px;
  background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;
  font-size:14px;font-weight:900;cursor:pointer;transition:.14s}
.s3src-next-btn:hover{opacity:.9;transform:translateY(-1px)}
`;
  document.head.appendChild(st);
}
