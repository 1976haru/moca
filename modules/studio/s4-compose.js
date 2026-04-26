/* ================================================
   modules/studio/s4-compose.js
   ④ 영상 구성·미리보기 — TAB 3 썸네일 / TAB 4 영상구성 / TAB 5 BGM
   (s4-edit.js 분리: _s4eT3Thumb / _s4eT4Compose / _s4eT5Audio /
    _s4eDownloadThumb / _s4eAutoThumbText / _s4eHookBoost)
   ================================================ */

/* ════════════════════════════════════════════════
   ⭐ imageTransform helper — 2단계 보드 → 4단계 프리뷰 비파괴 적용
   ════════════════════════════════════════════════ */
function s4NormalizeImageTransform(t) {
  t = t || {};
  return {
    fit:        t.fit || t.f || 'cover',
    scale:      Number.isFinite(+t.scale)   ? +t.scale   : 1,
    offsetX:    Number.isFinite(+t.offsetX) ? +t.offsetX : 0,
    offsetY:    Number.isFinite(+t.offsetY) ? +t.offsetY : 0,
    cropPreset: t.cropPreset || 'center',
  };
}
window.s4NormalizeImageTransform = s4NormalizeImageTransform;

/* sceneIndex(0-based) → 통합 우선순위로 transform 객체 반환 */
function s4GetSceneTransform(sceneIndex) {
  var proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  var s3 = proj.s3 || {};
  var ep = proj.editPlan || {};
  var v3slot = (s3.imagesV3 || {})[sceneIndex];
  var sel = null;
  if (v3slot && v3slot.candidates) {
    sel = v3slot.candidates.find(function(c){ return c.id === v3slot.selectedCandidateId; })
       || v3slot.candidates[0] || null;
  }
  /* 우선순위: selectedCandidate.transform > slot.transform > editPlan.scenes[i].imageTransform */
  if (sel && sel.transform)        return s4NormalizeImageTransform(sel.transform);
  if (v3slot && v3slot.transform)  return s4NormalizeImageTransform(v3slot.transform);
  if (ep.scenes && ep.scenes[sceneIndex] && ep.scenes[sceneIndex].imageTransform) {
    return s4NormalizeImageTransform(ep.scenes[sceneIndex].imageTransform);
  }
  return s4NormalizeImageTransform({});
}
window.s4GetSceneTransform = s4GetSceneTransform;

/* transform → CSS style 문자열 (object-fit + transform) */
function s4StyleForTransform(t) {
  var n = s4NormalizeImageTransform(t);
  var fit = (n.fit === 'cover' || n.fit === 'safe-fit') ? 'cover' : 'contain';
  var sx = Math.max(0.5, Math.min(2.5, n.scale));
  var ox = Math.max(-50, Math.min(50, n.offsetX));
  var oy = Math.max(-50, Math.min(50, n.offsetY));
  return 'object-fit:' + fit + ';' +
         'width:100%;height:100%;display:block;' +
         'transform:translate(' + ox + '%, ' + oy + '%) scale(' + sx + ');' +
         'transform-origin:center center;transition:transform .12s';
}
window.s4StyleForTransform = s4StyleForTransform;

/* aspectMode → CSS aspect-ratio 문자열 */
function s4AspectRatioCss(mode) {
  var proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  var m = mode || (proj.s3 && proj.s3.aspectMode) || 'shorts';
  if (m === 'longform' || m === 'thumbnail') return '16 / 9';
  if (m === 'cardnews')   return '1 / 1';
  if (m === 'cardnews45') return '4 / 5';
  return '9 / 16';
}
window.s4AspectRatioCss = s4AspectRatioCss;

/* safe area overlay HTML (s3.safeArea 가 있으면 그 값) */
function s4SafeAreaOverlayHtml(opts) {
  opts = opts || {};
  var proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  var sa = (proj.s3 && proj.s3.safeArea) || (proj.s4 && proj.s4.captionSafeArea) || null;
  if (!opts.show && !(sa && sa.show !== false)) {
    /* opts.show 가 명시되지 않았고 sa.show 가 false 면 안 보임. */
    if (opts.show === false) return '';
    if (sa && sa.show === false) return '';
  }
  var top = (sa && +sa.topPercent)    || 12;
  var bot = (sa && +sa.bottomPercent) || 22;
  return '<div class="s4-safe-overlay" aria-hidden="true">' +
    '<div class="s4-safe-band-top" style="height:' + top + '%"></div>' +
    '<div class="s4-safe-band-bot" style="height:' + bot + '%"></div>' +
  '</div>';
}
window.s4SafeAreaOverlayHtml = s4SafeAreaOverlayHtml;

/* ════════════════════════════════════════════════
   TAB 3 — 썸네일 텍스트 오버레이
   ════════════════════════════════════════════════ */
function _s4eT3Thumb(proj) {
  const th    = _s4Edit.thumb;
  const imgs  = (proj.scenes || []).map(s => s.imageUrl || s.img).filter(Boolean);
  const imgUrl= proj.thumbUrl || imgs[0] || '';
  const font  = S4_FONTS.find(f => f.id === (_s4Edit.caption.fontId)) || S4_FONTS[0];

  return `
  <div class="s4e-section">
    <div class="s4e-block">
      <div class="s4e-label">
        🖼 썸네일 텍스트 오버레이
        <span class="s4e-label-sub">이미지 생성은 STEP2에서 완료됨</span>
      </div>

      <!-- A/B/C 안 탭 -->
      <div class="s4e-ab-tabs">
        ${['A','B','C'].map(v=>`
          <button class="s4e-ab-tab ${_s4ThumbAlt===v?'on':''}"
            onclick="_s4ThumbAlt='${v}';_studioS4Edit('studioS4EditWrap')">${v}안</button>
        `).join('')}
      </div>

      <!-- 썸네일 미리보기 — 2단계 imageTransform 비파괴 적용 (aspect-ratio override) -->
      <div class="s4e-thumb-preview" style="aspect-ratio:${s4AspectRatioCss()};height:auto;max-height:480px">
        ${imgUrl
          ? `<img src="${imgUrl}" class="s4e-thumb-img" alt="썸네일" style="${s4StyleForTransform(s4GetSceneTransform(0))}">`
          : `<div class="s4e-thumb-empty">🖼 썸네일 이미지 없음<br><small>STEP2 이미지 생성 후 표시</small></div>`}

        ${imgUrl ? s4SafeAreaOverlayHtml() : ''}

        <!-- 텍스트 오버레이 -->
        ${th[_s4ThumbAlt]?.text ? `
          <div class="s4e-thumb-text
            ${th[_s4ThumbAlt].pos||'bottom'}
            ${th[_s4ThumbAlt].size||'lg'}"
            style="font-family:${font.css};
                   color:${th[_s4ThumbAlt].color||'#fff'};
                   ${th[_s4ThumbAlt].bg?'background:rgba(0,0,0,0.6);padding:6px 14px;border-radius:8px;':''}">
            ${th[_s4ThumbAlt].text}
          </div>` : ''}
      </div>

      <!-- 텍스트 입력 -->
      <div class="s4e-thumb-inputs">
        <input class="s4e-thumb-input"
          value="${th[_s4ThumbAlt]?.text||''}"
          placeholder="썸네일 텍스트 입력..."
          oninput="_s4Edit.thumb['${_s4ThumbAlt}'].text=this.value;_studioS4Edit('studioS4EditWrap')">

        <div class="s4e-thumb-controls">
          <div class="s4e-style-row">
            <span>크기</span>
            <div class="s4e-seg">
              ${[['md','보통'],['lg','크게'],['xl','최대']].map(([v,l])=>`
                <button class="s4e-seg-btn ${th[_s4ThumbAlt]?.size===v?'on':''}"
                  onclick="_s4Edit.thumb['${_s4ThumbAlt}'].size='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
              `).join('')}
            </div>
          </div>
          <div class="s4e-style-row">
            <span>위치</span>
            <div class="s4e-seg">
              ${[['top','상단'],['center','중앙'],['bottom','하단']].map(([v,l])=>`
                <button class="s4e-seg-btn ${th[_s4ThumbAlt]?.pos===v?'on':''}"
                  onclick="_s4Edit.thumb['${_s4ThumbAlt}'].pos='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
              `).join('')}
            </div>
          </div>
          <div class="s4e-style-row">
            <span>색상</span>
            <div class="s4e-seg">
              ${[['#ffffff','흰'],['#FFE033','노랑'],['#FF4444','빨강'],['#000000','검정']].map(([v,l])=>`
                <button class="s4e-seg-btn ${th[_s4ThumbAlt]?.color===v?'on':''}"
                  style="background:${v};color:${v==='#FFE033'||v==='#ffffff'?'#333':'#fff'}"
                  onclick="_s4Edit.thumb['${_s4ThumbAlt}'].color='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
              `).join('')}
            </div>
          </div>
          <div class="s4e-style-row">
            <span>배경</span>
            <div class="s4e-seg">
              <button class="s4e-seg-btn ${th[_s4ThumbAlt]?.bg?'on':''}"
                onclick="_s4Edit.thumb['${_s4ThumbAlt}'].bg=true;_studioS4Edit('studioS4EditWrap')">반투명</button>
              <button class="s4e-seg-btn ${!th[_s4ThumbAlt]?.bg?'on':''}"
                onclick="_s4Edit.thumb['${_s4ThumbAlt}'].bg=false;_studioS4Edit('studioS4EditWrap')">없음</button>
            </div>
          </div>
        </div>
      </div>

      <!-- AI 제목 3안 자동 채우기 -->
      <button class="s4e-btn-outline" onclick="_s4eAutoThumbText(${JSON.stringify(proj).replace(/"/g,"'")})">
        ✨ AI 제목 3안 자동 입력
      </button>

      <!-- PNG 다운로드 -->
      <button class="s4e-btn-primary" onclick="_s4eDownloadThumb()">
        📥 PNG 다운로드
      </button>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   ⭐ 씬별 미리보기 블록 — TAB 4 상단
   2단계 imagesV3.transform / editPlan.scenes[i].imageTransform 적용
   ════════════════════════════════════════════════ */
function _s4eScenePreviewBlock() {
  _s4eEnsurePreviewCSS();
  var proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  var s3 = proj.s3 || {};
  var ep = proj.editPlan || {};
  var scenes = (s3.scenes && s3.scenes.length)
    ? s3.scenes
    : (ep.scenes && ep.scenes.length ? ep.scenes : []);
  if (!scenes.length) {
    return '<div class="s4e-block">' +
      '<div class="s4e-label">🎞 씬별 미리보기</div>' +
      '<div class="s4e-no-scenes">아직 씬이 없습니다. STEP1 대본 → STEP2 이미지 후 표시됩니다.</div>' +
    '</div>';
  }
  var ratio = s4AspectRatioCss();
  var safeOn = !!_s4eSafeOverlayShow;
  var cards = scenes.map(function(_, idx){
    var slot = (s3.imagesV3 || {})[idx];
    var sel  = null;
    if (slot && slot.candidates) {
      sel = slot.candidates.find(function(c){ return c.id === slot.selectedCandidateId; })
         || slot.candidates[0] || null;
    }
    var url = (sel && sel.url) || (s3.images || [])[idx] || '';
    var skipped = !!(slot && slot.skipped);
    var tStyle = s4StyleForTransform(s4GetSceneTransform(idx));
    return '<div class="s4e-sp-card' + (skipped ? ' s4e-sp-skip' : '') + '">' +
      '<div class="s4e-sp-frame" style="aspect-ratio:' + ratio + '">' +
        (url
          ? '<img src="' + url + '" alt="씬 ' + (idx+1) + '" style="' + tStyle + '">'
          : '<div class="s4e-sp-empty"><span>씬 ' + (idx+1) + '</span><small>이미지 없음</small></div>') +
        (safeOn && url ? s4SafeAreaOverlayHtml({ show:true }) : '') +
      '</div>' +
      '<div class="s4e-sp-meta">씬 ' + (idx+1) + (skipped ? ' · 건너뜀' : '') + '</div>' +
    '</div>';
  }).join('');

  return '<div class="s4e-block">' +
    '<div class="s4e-label">🎞 씬별 미리보기 ' +
      '<span class="s4e-label-sub">2단계에서 조정한 크기·위치가 그대로 반영됩니다</span>' +
    '</div>' +
    '<div class="s4e-sp-toolbar">' +
      '<button class="s4e-sp-toggle' + (safeOn?' on':'') + '" onclick="_s4eToggleSafeOverlay()">'+
        (safeOn ? '✅ 자막 안전영역 표시' : '⬜ 자막 안전영역 숨김') +
      '</button>' +
      '<span class="s4e-sp-info">총 ' + scenes.length + '개 씬 · ' +
        (proj.s3 && proj.s3.aspectMode === 'longform' ? '롱폼 16:9' :
         proj.s3 && proj.s3.aspectMode === 'thumbnail' ? '썸네일 16:9' :
         proj.s3 && proj.s3.aspectMode === 'cardnews'  ? '카드뉴스 1:1' :
         proj.s3 && proj.s3.aspectMode === 'cardnews45'? '카드뉴스 4:5' : '숏츠 9:16') +
      '</span>' +
    '</div>' +
    '<div class="s4e-sp-grid">' + cards + '</div>' +
  '</div>';
}

/* safe overlay 표시 토글 — 모듈 변수 */
var _s4eSafeOverlayShow = true;
window._s4eToggleSafeOverlay = function() {
  _s4eSafeOverlayShow = !_s4eSafeOverlayShow;
  if (typeof _studioS4Edit === 'function') _studioS4Edit('studioS4EditWrap');
};

function _s4eEnsurePreviewCSS() {
  if (document.getElementById('s4e-preview-style')) return;
  var st = document.createElement('style');
  st.id = 's4e-preview-style';
  st.textContent =
    '.s4e-no-scenes{padding:16px;text-align:center;color:#999;background:#fafafe;border-radius:10px;font-size:12.5px}'+
    '.s4e-sp-toolbar{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}'+
    '.s4e-sp-toggle{border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;'+
      'border-radius:999px;padding:5px 12px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit}'+
    '.s4e-sp-toggle.on{border-color:#ef6fab;background:#fff5fa;color:#ef6fab}'+
    '.s4e-sp-info{font-size:11.5px;color:#7b6080;margin-left:auto}'+
    '.s4e-sp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}'+
    '@media(max-width:1366px){.s4e-sp-grid{grid-template-columns:repeat(3,1fr)}}'+
    '@media(max-width:900px){.s4e-sp-grid{grid-template-columns:repeat(2,1fr)}}'+
    '@media(max-width:520px){.s4e-sp-grid{grid-template-columns:1fr}}'+
    '.s4e-sp-card{display:flex;flex-direction:column;gap:4px}'+
    '.s4e-sp-card.s4e-sp-skip{opacity:.5}'+
    '.s4e-sp-frame{position:relative;width:100%;background:#1a1a2e;border-radius:12px;'+
      'overflow:hidden;border:1.5px solid #f1dce7}'+
    '.s4e-sp-empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;'+
      'justify-content:center;color:#bbb;text-align:center;gap:4px;font-size:11px}'+
    '.s4e-sp-empty span{font-size:13px;font-weight:800}'+
    '.s4e-sp-meta{font-size:11px;color:#7b6080;text-align:center;font-weight:700}'+
    /* safe overlay (s4SafeAreaOverlayHtml 가 만든 div 들) */
    '.s4-safe-overlay{position:absolute;inset:0;pointer-events:none}'+
    '.s4-safe-band-top,.s4-safe-band-bot{position:absolute;left:0;right:0;'+
      'background:rgba(255,107,160,.18);border:1px dashed rgba(255,107,160,.55)}'+
    '.s4-safe-band-top{top:0}.s4-safe-band-bot{bottom:0}';
  document.head.appendChild(st);
}

/* ════════════════════════════════════════════════
   TAB 4 — 영상 구성 (이슈 3·4·5 — 카드 그리드 통일 + STUDIO.project.s4 동기화)
   ════════════════════════════════════════════════ */
function _s4eT4Compose() {
  const c = _s4Edit.compose;
  /* 자동 처리 기본값 */
  if (!c.auto) c.auto = { autoSplit: true, highlight: true, safeArea: true };

  return `
  <div class="s4e-section">

    <!-- ⭐ 0. 씬별 미리보기 (2단계 imageTransform 비파괴 적용) -->
    ${_s4eScenePreviewBlock()}

    <!-- 1. 영상 템플릿 -->
    <div class="s4e-block">
      <div class="s4e-label">🎬 영상 템플릿</div>
      <div class="studio-option-grid">
        ${S4_TEMPLATES.map(t=>`
          <div class="studio-option-card ${c.template===t.id?'on':''}"
            onclick="_s4eSetCompose('template','${t.id}')">
            <div class="studio-option-title">${t.label}</div>
            <div class="studio-option-desc">${t.desc||''}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 2. 씬 전환 효과 -->
    <div class="s4e-block">
      <div class="s4e-label">✨ 씬 전환 효과</div>
      <div class="studio-option-grid studio-compact-grid">
        ${S4_TRANSITIONS.map(t=>`
          <div class="studio-option-card ${c.transition===t.id?'on':''}"
            onclick="_s4eSetCompose('transition','${t.id}')">
            <div class="studio-option-title">${t.label}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 3. 이미지 모션 -->
    <div class="s4e-block">
      <div class="s4e-label">🎥 이미지 모션</div>
      <div class="studio-option-grid studio-compact-grid">
        ${S4_MOTIONS.map(m=>`
          <div class="studio-option-card ${c.motion===m.id?'on':''}"
            onclick="_s4eSetCompose('motion','${m.id}')">
            <div class="studio-option-title">${m.label}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 4. 필터 / 색보정 -->
    <div class="s4e-block">
      <div class="s4e-label">🎨 필터 / 색보정</div>
      <div class="studio-option-grid studio-compact-grid">
        ${S4_FILTERS.map(f=>`
          <div class="studio-option-card ${c.filter===f.id?'on':''}"
            onclick="_s4eSetCompose('filter','${f.id}')">
            <div class="studio-option-title">${f.label}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 5. 오프닝·클로징·브랜딩 -->
    <div class="s4e-block">
      <div class="s4e-label">🏷 오프닝·클로징·브랜딩</div>
      <div class="studio-option-grid studio-compact-grid">
        <div class="studio-option-card ${c.openingAnim?'on':''}"
          onclick="_s4eToggleCompose('openingAnim')">
          <span class="studio-option-check">${c.openingAnim?'✓':''}</span>
          <div class="studio-option-title">오프닝 애니메이션</div>
        </div>
        <div class="studio-option-card ${c.closingAnim?'on':''}"
          onclick="_s4eToggleCompose('closingAnim')">
          <span class="studio-option-check">${c.closingAnim?'✓':''}</span>
          <div class="studio-option-title">클로징 + CTA</div>
          <div class="studio-option-desc">구독·좋아요</div>
        </div>
        <div class="studio-option-card ${c.endCard?'on':''}"
          onclick="_s4eToggleCompose('endCard')">
          <span class="studio-option-check">${c.endCard?'✓':''}</span>
          <div class="studio-option-title">엔딩 카드</div>
          <div class="studio-option-desc">다음 영상 예고</div>
        </div>
      </div>
      <div class="s4e-brand-inputs">
        <div class="s4e-inp-row">
          <label>로고 URL</label>
          <input class="s4e-inp" value="${c.logoUrl||''}" placeholder="https://..."
            oninput="_s4eSetCompose('logoUrl',this.value,true)">
        </div>
        <div class="s4e-inp-row">
          <label>워터마크</label>
          <input class="s4e-inp" value="${c.watermark||''}" placeholder="채널명 또는 @handle"
            oninput="_s4eSetCompose('watermark',this.value,true)">
        </div>
        <div class="s4e-inp-row">
          <label>채널 컬러</label>
          <input type="color" value="${c.channelColor||'#ef6fab'}"
            oninput="_s4eSetCompose('channelColor',this.value,true)">
        </div>
      </div>
    </div>

    <!-- 6. 자동 처리 -->
    <div class="s4e-block">
      <div class="s4e-label">⚙️ 자동 처리</div>
      <div class="studio-option-grid studio-compact-grid">
        <div class="studio-option-card ${c.auto.autoSplit?'on':''}"
          onclick="_s4eToggleAuto('autoSplit')">
          <span class="studio-option-check">${c.auto.autoSplit?'✓':''}</span>
          <div class="studio-option-title">20자 초과 자동 2줄</div>
        </div>
        <div class="studio-option-card ${c.auto.highlight?'on':''}"
          onclick="_s4eToggleAuto('highlight')">
          <span class="studio-option-check">${c.auto.highlight?'✓':''}</span>
          <div class="studio-option-title">강조 키워드 색상</div>
        </div>
        <div class="studio-option-card ${c.auto.safeArea?'on':''}"
          onclick="_s4eToggleAuto('safeArea')">
          <span class="studio-option-check">${c.auto.safeArea?'✓':''}</span>
          <div class="studio-option-title">안전구역 체크</div>
        </div>
      </div>
    </div>

    <!-- 훅 자동 강화 -->
    <div class="s4e-block">
      <div class="s4e-label">⚡ 훅 자동 강화</div>
      <button class="s4e-btn-outline" onclick="_s4eHookBoost()">
        첫 씬 텍스트 크고 굵게 자동 적용 (3초 훅 최적화)
      </button>
    </div>

    <!-- 현재 편집 설정 요약 (이슈 5) -->
    <div class="s4e-block">
      <div class="s4e-label">📋 현재 편집 설정 요약</div>
      ${_s4eRenderEditPlanSummary(c)}
    </div>
  </div>`;
}

/* ── 영상 구성 옵션 변경 (UI 갱신 + STUDIO.project.s4 + editPlan 동기화) ── */
window._s4eSetCompose = function(field, value, skipReRender) {
  if (!_s4Edit.compose) _s4Edit.compose = {};
  _s4Edit.compose[field] = value;
  _s4eSyncEditPlan();
  if (!skipReRender) _studioS4Edit('studioS4EditWrap');
};

window._s4eToggleCompose = function(field) {
  if (!_s4Edit.compose) _s4Edit.compose = {};
  _s4Edit.compose[field] = !_s4Edit.compose[field];
  _s4eSyncEditPlan();
  _studioS4Edit('studioS4EditWrap');
};

window._s4eToggleAuto = function(field) {
  if (!_s4Edit.compose) _s4Edit.compose = {};
  if (!_s4Edit.compose.auto) _s4Edit.compose.auto = {};
  _s4Edit.compose.auto[field] = !_s4Edit.compose.auto[field];
  _s4eSyncEditPlan();
  _studioS4Edit('studioS4EditWrap');
};

/* ── STUDIO.project.s4 + editPlan 동기화 (이슈 4·5) ── */
function _s4eSyncEditPlan() {
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  if (!proj) return;
  const c = _s4Edit.compose || {};
  const auto = c.auto || {};

  /* 평면 STUDIO.project.s4 */
  if (!proj.s4) proj.s4 = {};
  proj.s4.template     = c.template     || proj.s4.template     || '';
  proj.s4.transition   = c.transition   || proj.s4.transition   || '';
  proj.s4.imageMotion  = c.motion       || proj.s4.imageMotion  || '';
  proj.s4.filter       = c.filter       || proj.s4.filter       || '';
  proj.s4.opening      = !!c.openingAnim;
  proj.s4.closingCta   = !!c.closingAnim;
  proj.s4.endingCard   = !!c.endCard;
  proj.s4.logoUrl      = c.logoUrl      || '';
  proj.s4.watermark    = c.watermark    || '';
  proj.s4.brandColor   = c.channelColor || '';
  proj.s4.autoSplitSubtitle  = auto.autoSplit !== false;
  proj.s4.highlightKeywords  = auto.highlight !== false;
  proj.s4.safeAreaCheck      = auto.safeArea  !== false;

  /* 통합 editPlan (최종검수에서 project.json 에 들어감) */
  proj.editPlan = {
    template:    proj.s4.template,
    transition:  proj.s4.transition,
    imageMotion: proj.s4.imageMotion,
    filter:      proj.s4.filter,
    branding: {
      opening:    proj.s4.opening,
      closingCta: proj.s4.closingCta,
      endingCard: proj.s4.endingCard,
      logoUrl:    proj.s4.logoUrl,
      watermark:  proj.s4.watermark,
      brandColor: proj.s4.brandColor,
    },
    subtitleRules: {
      autoSplit:        proj.s4.autoSplitSubtitle,
      highlightKeywords:proj.s4.highlightKeywords,
      safeAreaCheck:    proj.s4.safeAreaCheck,
    },
    /* 2단계 보드에서 저장한 씬별 imageTransform + safeArea 동기화 (비파괴) */
    scenes:    _s4CollectSceneEditPlans(proj),
    safeArea:  (proj.s3 && proj.s3.safeArea) || null,
    aspectMode:(proj.s3 && proj.s3.aspectMode) || null,
  };

  if (typeof studioSave === 'function') studioSave();
}

/* ── s3.imagesV3 의 transform 을 editPlan.scenes 형식으로 복사 ── */
function _s4CollectSceneEditPlans(proj) {
  var s3 = proj.s3 || {};
  var v3 = s3.imagesV3 || {};
  var scenes = s3.scenes || [];
  var out = [];
  var n = Math.max(scenes.length, Object.keys(v3).length);
  for (var i = 0; i < n; i++) {
    var slot = v3[i] || {};
    var sel  = (slot.candidates || []).find(function(c){ return c.id === slot.selectedCandidateId; })
            || (slot.candidates && slot.candidates[0]) || null;
    out.push({
      sceneIndex: i,
      sceneRole:  (scenes[i] && scenes[i].role) || '',
      sceneTime:  (scenes[i] && scenes[i].time) || '',
      url:        sel ? sel.url : (s3.images || [])[i] || '',
      provider:   sel ? sel.provider : (s3.api || ''),
      aspectRatio:sel ? sel.aspectRatio : (s3.aspectRatio || ''),
      width:      sel ? sel.width : 0,
      height:     sel ? sel.height : 0,
      imageTransform: (sel && sel.transform) || (slot.transform) || null,
      skipped:    !!slot.skipped,
    });
  }
  return out;
}

/* ── 편집 설정 요약 (미리보기 — 이슈 5) ── */
function _s4eRenderEditPlanSummary(c) {
  const tpl  = (S4_TEMPLATES.find(t=>t.id===c.template)  ||{}).label || '미선택';
  const tr   = (S4_TRANSITIONS.find(t=>t.id===c.transition)||{}).label || '미선택';
  const mo   = (S4_MOTIONS.find(m=>m.id===c.motion)      ||{}).label || '미선택';
  const fl   = (S4_FILTERS.find(f=>f.id===c.filter)      ||{}).label || '미선택';
  const br   = [c.openingAnim?'오프닝':null, c.closingAnim?'클로징+CTA':null,
                c.endCard?'엔딩 카드':null].filter(Boolean).join(' · ') || '없음';
  return `
  <div class="s4e-summary">
    <div><b>템플릿:</b> ${tpl}</div>
    <div><b>전환:</b> ${tr}</div>
    <div><b>모션:</b> ${mo}</div>
    <div><b>필터:</b> ${fl}</div>
    <div><b>브랜딩:</b> ${br}</div>
    <div class="s4e-summary-hint">💡 이 설정은 <code>STUDIO.project.s4</code> + <code>editPlan</code>에 자동 저장됩니다.</div>
  </div>`;
}

/* ════════════════════════════════════════════════
   TAB 5 — BGM·음향 (설정값만 저장)
   ════════════════════════════════════════════════ */
function _s4eT5Audio() {
  const a = _s4Edit.audio;

  return `
  <div class="s4e-section">
    <div class="s4e-block">
      <div class="s4e-label">🎵 BGM 선택 (이슈 6 — 카드 그리드)</div>
      <div class="studio-option-grid">
        ${S4_BGM_LIST.map(b=>`
          <div class="studio-option-card ${a.bgm===b.id?'on':''}"
            onclick="_s4eSetBgm('${b.id}')">
            <div class="studio-option-title">${b.label}</div>
            <div class="studio-option-desc">${b.desc||''}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="s4e-block">
      <div class="s4e-label">🔊 볼륨 설정</div>
      <div class="s4e-vol-rows">
        <div class="s4e-vol-row">
          <span>BGM 볼륨</span>
          <input type="range" min="0" max="100" value="${a.bgmVol}"
            oninput="_s4Edit.audio.bgmVol=this.value;
              document.getElementById('s4eBgmVol').textContent=this.value+'%'">
          <span id="s4eBgmVol">${a.bgmVol}%</span>
        </div>
        <div class="s4e-vol-row">
          <span>음성 볼륨</span>
          <input type="range" min="0" max="100" value="${a.voiceVol}"
            oninput="_s4Edit.audio.voiceVol=this.value;
              document.getElementById('s4eVoiceVol').textContent=this.value+'%'">
          <span id="s4eVoiceVol">${a.voiceVol}%</span>
        </div>
      </div>
    </div>

    <div class="s4e-block">
      <div class="s4e-label">🎚 효과음 스타일</div>
      <div class="s4e-seg">
        ${[['none','없음'],['calm','잔잔'],['impact','임팩트']].map(([v,l])=>`
          <button class="s4e-seg-btn ${a.sfx===v?'on':''}"
            onclick="_s4Edit.audio.sfx='${v}'">${l}</button>
        `).join('')}
      </div>
    </div>

    <div class="s4e-block">
      <div class="s4e-label">🔁 페이드 설정</div>
      <div class="s4e-auto-rows">
        <label class="s4e-auto-row">
          <input type="checkbox" ${a.fadeIn?'checked':''}
            onchange="_s4Edit.audio.fadeIn=this.checked">
          인트로 페이드 인
        </label>
        <label class="s4e-auto-row">
          <input type="checkbox" ${a.fadeOut?'checked':''}
            onchange="_s4Edit.audio.fadeOut=this.checked">
          아웃트로 페이드 아웃
        </label>
      </div>
    </div>

    <div class="s4e-audio-hint">
      💡 설정값은 <code>STUDIO.project.edit.audio</code>에 저장됩니다.<br>
      실제 오디오 믹싱은 렌더링 단계에서 Creatomate 또는 FFmpeg.wasm으로 처리됩니다.
    </div>
  </div>`;
}

/* ── 헬퍼 ── */
function _s4eDownloadThumb() {
  const canvas = document.createElement('canvas');
  canvas.width  = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  const th  = _s4Edit.thumb[_s4ThumbAlt];
  const font = S4_FONTS.find(f => f.id === _s4Edit.caption.fontId) || S4_FONTS[0];

  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const imgs   = (proj.scenes || []).map(s => s.imageUrl || s.img).filter(Boolean);
  const imgUrl = proj.thumbUrl || imgs[0] || '';

  const draw = () => {
    if (th?.bg) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    }
    if (th?.text) {
      ctx.font = `bold ${th.size==='xl'?72:th.size==='lg'?56:40}px ${font.css}`;
      ctx.fillStyle = th.color || '#fff';
      ctx.textAlign = 'center';
      const y = th.pos==='top' ? 80 : th.pos==='center' ? canvas.height/2 : canvas.height - 40;
      ctx.fillText(th.text, canvas.width/2, y);
    }
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href    = url;
      a.download= `thumbnail_${_s4ThumbAlt}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  if (imgUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      /* 2단계 imageTransform 을 canvas drawImage 매트릭스로 반영 */
      const tf = s4GetSceneTransform(0);
      const cx = canvas.width / 2, cy = canvas.height / 2;
      ctx.save();
      ctx.translate(cx + (tf.offsetX/100) * canvas.width,
                    cy + (tf.offsetY/100) * canvas.height);
      ctx.scale(tf.scale, tf.scale);
      ctx.translate(-cx, -cy);
      /* fit:contain 이면 letterbox, cover 면 꽉 채우기 (기본은 cover) */
      if (tf.fit === 'contain') {
        const ir = img.width / img.height, cr = canvas.width / canvas.height;
        let dw = canvas.width, dh = canvas.height, dx = 0, dy = 0;
        if (ir > cr) { dh = canvas.width / ir; dy = (canvas.height - dh) / 2; }
        else         { dw = canvas.height * ir; dx = (canvas.width - dw) / 2; }
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, dx, dy, dw, dh);
      } else {
        /* cover/safe-fit: 꽉 채우기 */
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      ctx.restore();
      draw();
    };
    img.onerror = draw;
    img.src = imgUrl;
  } else {
    ctx.fillStyle = '#f1dce7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    draw();
  }
}

function _s4eAutoThumbText(proj) {
  const script = proj.scriptText || proj.script || '';
  const words  = script.slice(0, 100);
  _s4Edit.thumb.A.text = `이거 모르면 후회해요`;
  _s4Edit.thumb.B.text = words.slice(0, 20) + '...';
  _s4Edit.thumb.C.text = `${words.slice(0, 15)} 완벽 정리`;
  _studioS4Edit('studioS4EditWrap');
}

/* BGM 선택 — STUDIO.project.s4.bgm 동기화 (이슈 6) */
window._s4eSetBgm = function(id) {
  if (!_s4Edit.audio) _s4Edit.audio = {};
  _s4Edit.audio.bgm = id;
  const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  if (!proj.s4) proj.s4 = {};
  proj.s4.bgm = id;
  if (typeof studioSave === 'function') studioSave();
  _studioS4Edit('studioS4EditWrap');
};

function _s4eHookBoost() {
  _s4Edit.caption.size = 'xl';
  _s4Edit.caption.position = 'center';
  _s4Edit.caption.color = '#FFE033';
  _s4Edit.caption.bg = true;
  _studioS4Edit('studioS4EditWrap');
  alert('⚡ 훅 강화 적용!\n첫 씬에 최대 크기·노란색·중앙 자막이 설정됐어요.');
}
