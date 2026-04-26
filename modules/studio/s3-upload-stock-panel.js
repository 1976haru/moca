/* ================================================
   modules/studio/s3-upload-stock-panel.js
   숏츠 스튜디오 — 업로드·스톡 탭 컨테이너 (3 sub-tab)
   * 직접 업로드 / 스톡 검색 / 기존 재사용
   * s3-image.js 의 _s3SourceTab='upload' 일 때 호출
   ================================================ */
(function(){
  'use strict';

  /* sub-tab state */
  var SUB = 'upload'; // 'upload' | 'stock' | 'reuse'

  /* ── 메인 render — wrapId 의 div 채움 ── */
  window.s3RenderUploadStockPanel = function(wrapId) {
    var wrap = document.getElementById(wrapId || 'studioS3VideoWrap');
    if (!wrap) return;
    _injectCSS();

    var subBodyHtml = _renderSub();
    wrap.innerHTML =
      '<div class="s3us-wrap">' +
        '<div class="s3us-tabs">' +
          '<button class="s3us-tab' + (SUB==='upload'?' on':'') + '" onclick="s3UsSetSub(\'upload\')">📁 직접 업로드</button>' +
          '<button class="s3us-tab' + (SUB==='stock'?' on':'')  + '" onclick="s3UsSetSub(\'stock\')">🔍 스톡 검색</button>' +
          '<button class="s3us-tab' + (SUB==='reuse'?' on':'')  + '" onclick="s3UsSetSub(\'reuse\')">♻️ 기존 재사용</button>' +
        '</div>' +
        '<div class="s3us-body" id="s3us-body">' + subBodyHtml + '</div>' +
      '</div>';
  };

  window.s3UsSetSub = function(sub) {
    SUB = sub;
    var body = document.getElementById('s3us-body');
    if (body) body.innerHTML = _renderSub();
  };

  function _renderSub() {
    if (SUB === 'stock') {
      var stockHtml = (typeof window.cbRenderStockSearchPanel === 'function')
        ? window.cbRenderStockSearchPanel()
        : '<div class="s3us-empty">스톡 검색 모듈이 로드되지 않았습니다.</div>';
      return '<div id="s3ss-holder">' + stockHtml + '</div>';
    }
    if (SUB === 'reuse') {
      return _renderReuse();
    }
    /* upload (default) */
    return _renderUpload();
  }

  /* ── 직접 업로드 sub-tab ── */
  function _renderUpload() {
    var p = (window.STUDIO && window.STUDIO.project) || {};
    var scenes = (p.s3 && p.s3.scenes) || [];
    var sceneOpts = '<option value="">(자동 — 비어있는 첫 씬)</option>' +
      scenes.map(function(sc, i){
        return '<option value="'+i+'">씬 ' + (i+1) + (sc.label ? ' — ' + _esc(sc.label) : '') + '</option>';
      }).join('');
    return '<div class="s3us-up">' +
      '<div class="s3us-intro">📁 내 사진/영상을 업로드해서 씬에 직접 적용합니다. URL/CORS 문제 없는 가장 안전한 방법입니다.</div>' +
      '<div class="s3us-form">' +
        '<label class="s3us-label">대상 씬</label>' +
        '<select id="s3us-up-scene" class="s3us-select">' + sceneOpts + '</select>' +
      '</div>' +
      '<label class="s3us-up-drop">' +
        '<input type="file" accept="image/*,video/*" multiple style="display:none" onchange="s3UsHandleUpload(this)">' +
        '<div class="s3us-up-drop-inner">' +
          '<div style="font-size:42px">📁</div>' +
          '<div style="font-size:14px;font-weight:800;color:#5b1a4a;margin-top:8px">클릭하거나 파일을 선택해 업로드</div>' +
          '<div style="font-size:11px;color:#7b6080;margin-top:4px">이미지(JPG/PNG/WebP) 또는 영상(MP4) — 여러 개 동시 업로드 가능</div>' +
        '</div>' +
      '</label>' +
      '<div class="s3us-recent" id="s3us-recent">' + _renderRecentUploads() + '</div>' +
    '</div>';
  }

  function _renderRecentUploads() {
    var p = (window.STUDIO && window.STUDIO.project) || {};
    var s3 = p.s3 || {};
    var v3 = s3.imagesV3 || {};
    var uploads = [];
    Object.keys(v3).forEach(function(k){
      var slot = v3[k];
      ((slot && slot.candidates) || []).forEach(function(c){
        if (c.sourceType === 'upload') uploads.push({ sceneIdx: +k, candidate: c });
      });
    });
    if (!uploads.length) return '';
    return '<div class="s3us-recent-title">최근 업로드 (' + uploads.length + ')</div>' +
      '<div class="s3us-recent-grid">' +
        uploads.slice(-6).map(function(u){
          return '<div class="s3us-recent-card"><img src="'+_escAttr(u.candidate.url)+'" alt=""><div class="s3us-recent-meta">씬 ' + (u.sceneIdx+1) + '</div></div>';
        }).join('') +
      '</div>';
  }

  /* upload handler — adoptSceneImage */
  window.s3UsHandleUpload = function(input) {
    if (!input.files || !input.files.length) return;
    var sceneSelect = document.getElementById('s3us-up-scene');
    var rawIdx = sceneSelect ? sceneSelect.value : '';
    var manualIdx = rawIdx === '' ? null : parseInt(rawIdx, 10);
    var processed = 0;
    Array.from(input.files).forEach(function(file, i){
      var reader = new FileReader();
      reader.onload = function(e) {
        var url = e.target.result;
        var idx = manualIdx;
        if (idx === null || idx === undefined) {
          if (typeof window.getMissingImageSceneIndexes === 'function') {
            var missing = window.getMissingImageSceneIndexes();
            idx = missing[0];
          }
          if (idx === undefined) idx = i; /* fallback: 인덱스 순 */
        } else {
          idx = idx + i; /* 여러 개면 순차 적용 */
        }
        if (typeof window.adoptSceneImage === 'function') {
          window.adoptSceneImage(idx, {
            url: url, thumbUrl: url, previewUrl: url, fullUrl: url,
            provider: 'upload', type: file.type.indexOf('video') === 0 ? 'video' : 'image',
            credit: file.name,
          }, 'upload');
        }
        processed++;
        if (processed === input.files.length) {
          var body = document.getElementById('s3us-body');
          if (body) body.innerHTML = _renderUpload();
          if (typeof ucShowToast === 'function') ucShowToast('✅ ' + processed + '개 업로드 완료', 'success');
          if (typeof window.renderStudio === 'function') window.renderStudio();
        }
      };
      reader.readAsDataURL(file);
    });
  };

  /* ── 기존 재사용 sub-tab ── */
  function _renderReuse() {
    if (typeof window.cbGatherProjectImages !== 'function') {
      /* fallback — 이전 라이브러리 함수 호출 */
      var p = (window.STUDIO && window.STUDIO.project) || {};
      var s3 = p.s3 || {};
      var v3 = s3.imagesV3 || {};
      var allCandidates = [];
      Object.keys(v3).forEach(function(k){
        var slot = v3[k];
        ((slot && slot.candidates) || []).forEach(function(c){ allCandidates.push({ sceneIdx:+k, candidate:c }); });
      });
      if (!allCandidates.length) {
        return '<div class="s3us-empty">재사용할 이미지가 없습니다. 먼저 AI 생성 / 스톡 검색 / 직접 업로드로 이미지를 추가하세요.</div>';
      }
      return '<div class="s3us-intro">♻️ 이전에 사용한 이미지를 다른 씬에 다시 적용합니다.</div>' +
        '<div class="s3us-reuse-grid">' +
          allCandidates.map(function(u){
            return '<div class="s3us-reuse-card" onclick="s3UsReuseTo('+u.sceneIdx+',\''+_escAttr(u.candidate.id||u.candidate.url)+'\')">' +
              '<img src="'+_escAttr(u.candidate.thumbUrl || u.candidate.url)+'" alt=""><div class="s3us-reuse-meta">씬 ' + (u.sceneIdx+1) + ' · ' + _esc(u.candidate.sourceType||'') + '</div></div>';
          }).join('') +
        '</div>';
    }
    var imgs = window.cbGatherProjectImages();
    if (!imgs.length) {
      return '<div class="s3us-empty">재사용할 이미지가 없습니다.</div>';
    }
    return '<div class="s3us-intro">♻️ 프로젝트 안의 이미지를 가져옵니다 (숏츠/콘텐츠빌더/썸네일).</div>' +
      '<div class="s3us-reuse-grid">' +
        imgs.map(function(img, i){
          return '<div class="s3us-reuse-card" onclick="s3UsReuseImage('+i+')">' +
            '<img src="'+_escAttr(img.url)+'" alt=""><div class="s3us-reuse-meta">' + _esc(img.label||'이미지') + '</div></div>';
        }).join('') +
      '</div>';
  }

  window.s3UsReuseImage = function(imgIdx) {
    if (typeof window.cbGatherProjectImages !== 'function') return;
    var imgs = window.cbGatherProjectImages();
    var img = imgs[imgIdx];
    if (!img) return;
    /* 비어있는 첫 씬에 적용 */
    var idx = 0;
    if (typeof window.getMissingImageSceneIndexes === 'function') {
      var missing = window.getMissingImageSceneIndexes();
      if (missing.length) idx = missing[0];
    }
    if (typeof window.adoptSceneImage === 'function') {
      window.adoptSceneImage(idx, {
        url: img.url, thumbUrl: img.url, previewUrl: img.url, fullUrl: img.url,
        provider: img.source || 'project', type:'image', credit: img.label,
      }, 'reuse');
    }
    if (typeof ucShowToast === 'function') ucShowToast('✅ 씬 ' + (idx+1) + ' 에 재사용 적용', 'success');
    if (typeof window.renderStudio === 'function') window.renderStudio();
  };

  window.s3UsReuseTo = function(sceneIdx, candId) {
    /* 동일 V3 candidate 이라면 유지 */
    var p = (window.STUDIO && window.STUDIO.project) || {};
    var v3 = (p.s3 && p.s3.imagesV3) || {};
    /* 비어있는 다른 씬에 같은 candidate 복제 */
    var missing = (typeof window.getMissingImageSceneIndexes === 'function') ? window.getMissingImageSceneIndexes() : [];
    var targetIdx = missing[0];
    if (targetIdx === undefined || targetIdx === null) {
      var ans = prompt('적용할 씬 번호를 입력하세요 (1~):');
      targetIdx = ans ? parseInt(ans, 10) - 1 : null;
    }
    if (targetIdx === null || targetIdx === undefined || targetIdx < 0) return;
    var src = v3[sceneIdx];
    var c = src && src.candidates && src.candidates.find(function(x){ return x.id === candId; });
    if (!c) return;
    if (typeof window.adoptSceneImage === 'function') {
      window.adoptSceneImage(targetIdx, c, 'reuse');
    }
    if (typeof ucShowToast === 'function') ucShowToast('✅ 씬 ' + (targetIdx+1) + ' 에 재사용 적용', 'success');
    if (typeof window.renderStudio === 'function') window.renderStudio();
  };

  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function _escAttr(s){ return String(s == null ? '' : s).replace(/"/g,'&quot;').replace(/'/g, "\\'"); }

  function _injectCSS() {
    if (document.getElementById('s3-upload-stock-style')) return;
    var st = document.createElement('style');
    st.id = 's3-upload-stock-style';
    st.textContent =
      '.s3us-wrap{padding:12px}'+
      '.s3us-tabs{display:flex;gap:6px;margin-bottom:14px;padding:6px;background:#fafafe;border-radius:12px}'+
      '.s3us-tab{flex:1;border:1.5px solid transparent;background:transparent;color:#7b6080;border-radius:8px;padding:9px 14px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;transition:.12s}'+
      '.s3us-tab:hover{background:#f5f0ff;color:#9181ff}'+
      '.s3us-tab.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff}'+
      '.s3us-body{}'+
      '.s3us-empty{padding:40px 20px;text-align:center;color:#7b6080;background:#fafafe;border-radius:12px;font-size:13px;line-height:1.6}'+
      '.s3us-intro{font-size:12.5px;color:#7b6080;background:#fafafe;border-radius:8px;padding:8px 12px;margin-bottom:10px;line-height:1.5}'+
      '.s3us-form{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}'+
      '.s3us-label{font-size:11.5px;font-weight:800;color:#5b1a4a;min-width:80px}'+
      '.s3us-select{flex:1;min-width:160px;border:1.5px solid var(--line,#e9e4f3);border-radius:8px;padding:7px 10px;font-size:12px;font-family:inherit}'+
      '.s3us-up-drop{display:block;cursor:pointer;border:2px dashed #d4cdec;background:linear-gradient(135deg,#fafafe,#f5f0ff);border-radius:14px;padding:30px 20px;text-align:center;transition:.12s}'+
      '.s3us-up-drop:hover{border-color:#9181ff;background:linear-gradient(135deg,#f5f0ff,#fff5fa)}'+
      '.s3us-up-drop-inner{display:flex;flex-direction:column;align-items:center}'+
      '.s3us-recent{margin-top:14px}'+
      '.s3us-recent-title{font-size:12px;font-weight:800;color:#5b1a4a;margin-bottom:6px}'+
      '.s3us-recent-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px}'+
      '.s3us-recent-card{background:#fff;border:1px solid #ece6f5;border-radius:8px;overflow:hidden}'+
      '.s3us-recent-card img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}'+
      '.s3us-recent-meta{padding:4px 8px;font-size:10.5px;color:#5a4a56;font-weight:700;text-align:center}'+
      '.s3us-reuse-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}'+
      '.s3us-reuse-card{background:#fff;border:1.5px solid #ece6f5;border-radius:8px;overflow:hidden;cursor:pointer;transition:.12s}'+
      '.s3us-reuse-card:hover{border-color:#9181ff;transform:translateY(-1px)}'+
      '.s3us-reuse-card img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}'+
      '.s3us-reuse-meta{padding:5px 8px;font-size:10.5px;color:#5a4a56;font-weight:700;text-align:center}'+
      '';
    document.head.appendChild(st);
  }
})();
