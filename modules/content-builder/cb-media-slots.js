/* ================================================
   modules/content-builder/cb-media-slots.js
   콘텐츠 빌더 3/3 — 미디어 슬롯 (mainImage/background/logo/icon/pattern)
   * 직접 업로드 / URL / 프로젝트에서 가져오기 / 비우기
   * mediaSlots → designBoard.mediaSlots 동기화
   * localStorage:moca_content_builder_media_slots_v1
   ================================================ */
(function(){
  'use strict';

  const SLOT_DEF = [
    { key:'mainImage',       label:'메인 이미지',  icon:'🖼', desc:'핵심 이미지 또는 상품/인물' },
    { key:'backgroundImage', label:'배경 이미지',  icon:'🌄', desc:'전체 배경' },
    { key:'logo',            label:'로고',          icon:'🏷', desc:'채널/브랜드 로고' },
    { key:'icon',            label:'아이콘',        icon:'✨', desc:'보조 아이콘' },
    { key:'pattern',         label:'패턴',          icon:'🎀', desc:'장식 패턴' },
  ];
  window.CB_MEDIA_SLOT_DEF = SLOT_DEF;

  function _getSlots(p) {
    p = p || (window.contentBuilderProject || {});
    p.designBoard = p.designBoard || {};
    p.designBoard.mediaSlots = p.designBoard.mediaSlots || {};
    SLOT_DEF.forEach(function(d){
      p.designBoard.mediaSlots[d.key] = p.designBoard.mediaSlots[d.key] || {
        mode:'', url:'', source:'', visible:true,
        fit:'cover', scale:1, offsetX:0, offsetY:0, opacity:1,
      };
    });
    return p.designBoard.mediaSlots;
  }
  window.cbGetMediaSlots = _getSlots;

  function _saveSlots() {
    var p = window.contentBuilderProject || {};
    if (typeof window.cbSave === 'function') window.cbSave();
    try { localStorage.setItem('moca_content_builder_media_slots_v1', JSON.stringify((p.designBoard||{}).mediaSlots || {})); } catch(_) {}
  }

  /* ── render — sub-panel 으로 design-board 에서 호출 ── */
  window.cbRenderMediaSlotsPanel = function(p) {
    p = p || (window.contentBuilderProject || {});
    var slots = _getSlots(p);
    _injectCSS();

    var cardsHtml = SLOT_DEF.map(function(d){
      var s = slots[d.key] || {};
      var hasUrl = !!s.url;
      var preview = hasUrl
        ? '<img class="cbms-preview-img" src="'+_escAttr(s.url)+'" alt="" onerror="this.style.display=\'none\'">'
        : '<div class="cbms-preview-empty">'+ d.icon +'<br><span>비어 있음</span></div>';
      return '<div class="cbms-card'+(hasUrl?' filled':'')+'">' +
        '<div class="cbms-hd">' +
          '<div class="cbms-name">'+ d.icon +' '+ d.label +
            (hasUrl ? ' <span class="cbms-on">연결됨</span>' : ' <span class="cbms-off">없음</span>') +
          '</div>' +
          '<div class="cbms-desc">'+ d.desc +'</div>' +
        '</div>' +
        '<div class="cbms-prev">' + preview + '</div>' +
        '<div class="cbms-actions">' +
          '<label class="cbms-btn-up"><input type="file" accept="image/*" style="display:none" onchange="cbMsHandleUpload(\''+d.key+'\', this)">📁 업로드</label>' +
          '<button class="cbms-btn"  onclick="cbMsPromptUrl(\''+d.key+'\')">🔗 URL 입력</button>' +
          '<button class="cbms-btn"  onclick="cbMsImportProject(\''+d.key+'\')">📦 프로젝트에서</button>' +
          (hasUrl ? '<button class="cbms-btn cbms-del" onclick="cbMsClear(\''+d.key+'\')">🗑 비우기</button>' : '') +
        '</div>' +
        (hasUrl ? '<div class="cbms-fit-row">' +
          '<span>fit</span>' +
          ['cover','contain','fill'].map(function(f){
            var on = (s.fit === f);
            return '<button class="cbms-fit'+(on?' on':'')+'" onclick="cbMsSetFit(\''+d.key+'\',\''+f+'\')">'+f+'</button>';
          }).join('') +
          '<span class="cbms-op">opacity</span>' +
          '<input type="range" min="0" max="1" step="0.05" value="'+s.opacity+'" oninput="cbMsSetOpacity(\''+d.key+'\',this.value)">' +
          '<span class="cbms-op-num">'+(Math.round(s.opacity*100))+'%</span>' +
        '</div>' : '') +
      '</div>';
    }).join('');

    return '<div class="cbms-wrap">' +
      '<div class="cbms-intro">📷 디자인 시안의 슬롯에 실제 이미지를 연결합니다. 비파괴 — 원본 layoutSpec 은 그대로 유지됩니다.</div>' +
      '<div class="cbms-grid">' + cardsHtml + '</div>' +
      '<div class="cbms-import-hint">💡 "프로젝트에서" — 숏츠 스튜디오의 STUDIO.project.s3.imagesV3 / s3.images / thumbnail 에서 자동으로 후보를 가져옵니다.</div>' +
    '</div>';
  };

  /* ── 액션 ── */
  window.cbMsHandleUpload = function(slotKey, inp) {
    if (!inp.files || !inp.files[0]) return;
    var file = inp.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
      _setSlot(slotKey, { mode:'upload', url:e.target.result, source:file.name });
      _refresh();
    };
    reader.readAsDataURL(file);
  };
  window.cbMsPromptUrl = function(slotKey) {
    var url = prompt('이미지 URL을 입력하세요 (https://... 또는 data:image/...)');
    if (!url) return;
    _setSlot(slotKey, { mode:'url', url:url.trim(), source:'외부 URL' });
    _refresh();
  };
  window.cbMsImportProject = function(slotKey) {
    var candidates = _gatherProjectImages();
    if (!candidates.length) {
      alert('가져올 수 있는 프로젝트 이미지가 없습니다. (STUDIO.project.s3 또는 contentBuilder.assets 비어 있음)');
      return;
    }
    /* 간단한 picker 모달 */
    var ex = document.getElementById('cbms-picker'); if (ex) ex.remove();
    var modal = document.createElement('div');
    modal.id = 'cbms-picker';
    modal.className = 'cbms-modal-back';
    modal.innerHTML =
      '<div class="cbms-modal-card" onclick="event.stopPropagation()">' +
        '<button class="cbms-modal-close" onclick="document.getElementById(\'cbms-picker\').remove()">✕</button>' +
        '<h3 class="cbms-modal-title">📦 프로젝트 이미지 가져오기 (' + candidates.length + ')</h3>' +
        '<div class="cbms-modal-grid">' +
          candidates.map(function(c, i){
            return '<div class="cbms-pick-card" onclick="cbMsPickProject(\''+slotKey+'\',\''+_escAttr(c.url)+'\',\''+_escAttr(c.source)+'\')">' +
              '<img src="'+_escAttr(c.url)+'" alt="" onerror="this.style.display=\'none\'">' +
              '<div class="cbms-pick-meta">'+_esc(c.label)+'</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    modal.addEventListener('click', function(e){ if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  };
  window.cbMsPickProject = function(slotKey, url, source) {
    _setSlot(slotKey, { mode:'project', url:url, source:source });
    var ex = document.getElementById('cbms-picker'); if (ex) ex.remove();
    _refresh();
  };
  window.cbMsClear = function(slotKey) {
    if (!confirm('이 슬롯을 비울까요?')) return;
    _setSlot(slotKey, { mode:'', url:'', source:'' });
    _refresh();
  };
  window.cbMsSetFit = function(slotKey, fit) { _setSlot(slotKey, { fit: fit }); _refresh(); };
  window.cbMsSetOpacity = function(slotKey, v) { _setSlot(slotKey, { opacity: +v || 1 }); _refresh(); };

  /* 프로젝트 이미지 후보 수집 */
  function _gatherProjectImages() {
    var out = [];
    var seen = {};
    function _push(url, label, source) {
      if (!url || seen[url]) return;
      seen[url] = true;
      out.push({ url:url, label:label||'이미지', source:source||'project' });
    }
    /* contentBuilder.assets */
    var p = window.contentBuilderProject || {};
    (p.assets || []).forEach(function(a, i){ if (a && a.url) _push(a.url, a.name||('asset '+(i+1)), 'cb.assets'); });
    /* designBoard.assets */
    ((p.designBoard && p.designBoard.assets) || []).forEach(function(a, i){ if (a && a.url) _push(a.url, a.name||('design '+(i+1)), 'design.assets'); });
    /* STUDIO.project.s3 */
    if (window.STUDIO && window.STUDIO.project) {
      var s3 = window.STUDIO.project.s3 || {};
      var v3 = s3.imagesV3 || {};
      Object.keys(v3).forEach(function(k){
        var slot = v3[k];
        ((slot && slot.candidates) || []).forEach(function(c, ci){
          if (c && c.url) _push(c.url, '씬 ' + (+k + 1) + (slot.candidates.length > 1 ? ' #' + (ci+1) : ''), 'studio.s3.imagesV3');
        });
      });
      (s3.images || []).forEach(function(u, i){ if (u) _push(u, '씬 ' + (i+1) + ' (legacy)', 'studio.s3.images'); });
      if (window.STUDIO.project.thumbnail) _push(window.STUDIO.project.thumbnail, '썸네일', 'studio.thumbnail');
      if (window.STUDIO.project.thumbUrl)  _push(window.STUDIO.project.thumbUrl,  '썸네일', 'studio.thumbUrl');
    }
    return out;
  }
  window.cbGatherProjectImages = _gatherProjectImages;

  function _setSlot(slotKey, partial) {
    var p = window.contentBuilderProject = window.contentBuilderProject || {};
    var slots = _getSlots(p);
    slots[slotKey] = Object.assign({}, slots[slotKey] || {}, partial || {});
    _saveSlots();
  }
  function _refresh() {
    if (typeof window.cbDb2RerenderRight === 'function') window.cbDb2RerenderRight();
    else if (typeof window.cbGotoTab === 'function') window.cbGotoTab('design-board');
  }

  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function _escAttr(s){ return String(s == null ? '' : s).replace(/"/g,'&quot;').replace(/'/g, "\\'"); }

  function _injectCSS() {
    if (document.getElementById('cb-media-slots-style')) return;
    var st = document.createElement('style');
    st.id = 'cb-media-slots-style';
    st.textContent =
      '.cbms-wrap{padding:6px 4px}'+
      '.cbms-intro{font-size:12.5px;color:#7b6080;background:#fafafe;border-radius:8px;padding:8px 12px;margin-bottom:14px}'+
      '.cbms-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}'+
      '.cbms-card{background:#fff;border:1.5px solid #ece6f5;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:8px}'+
      '.cbms-card.filled{border-color:#9181ff}'+
      '.cbms-hd{}'+
      '.cbms-name{font-size:13px;font-weight:900;color:#2b2430;display:flex;align-items:center;gap:6px}'+
      '.cbms-on{background:#27ae60;color:#fff;padding:1px 7px;border-radius:999px;font-size:10px;font-weight:800}'+
      '.cbms-off{background:#eee;color:#777;padding:1px 7px;border-radius:999px;font-size:10px;font-weight:800}'+
      '.cbms-desc{font-size:11px;color:#7b6080}'+
      '.cbms-prev{aspect-ratio:16/9;background:#fafafe;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#999;font-size:11px;text-align:center}'+
      '.cbms-preview-img{width:100%;height:100%;object-fit:cover;display:block}'+
      '.cbms-preview-empty{font-size:24px;color:#bbb}'+
      '.cbms-preview-empty span{font-size:11px;display:block;margin-top:4px}'+
      '.cbms-actions{display:flex;gap:4px;flex-wrap:wrap}'+
      '.cbms-btn,.cbms-btn-up{flex:1;min-width:80px;border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:8px;padding:6px 8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;text-align:center;display:inline-block}'+
      '.cbms-btn:hover,.cbms-btn-up:hover{border-color:#9181ff;color:#9181ff}'+
      '.cbms-del{border-color:#fee;color:#c0392b}'+
      '.cbms-del:hover{background:#fee;border-color:#c0392b;color:#c0392b}'+
      '.cbms-fit-row{display:flex;gap:4px;align-items:center;flex-wrap:wrap;font-size:11px;color:#7b6080;background:#fafafe;border-radius:6px;padding:5px 8px}'+
      '.cbms-fit{border:1px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:6px;padding:3px 8px;font-size:10.5px;font-weight:700;cursor:pointer;font-family:inherit}'+
      '.cbms-fit.on{background:#9181ff;color:#fff;border-color:#9181ff}'+
      '.cbms-op{margin-left:6px}'+
      '.cbms-op-num{font-weight:700;color:#9181ff;min-width:36px;text-align:right}'+
      '.cbms-import-hint{margin-top:14px;font-size:11.5px;color:#7b6080;background:#f5f0ff;padding:8px 12px;border-radius:8px;line-height:1.6}'+
      '.cbms-modal-back{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:20000;display:flex;align-items:center;justify-content:center;padding:20px}'+
      '.cbms-modal-card{background:#fff;border-radius:18px;padding:24px;max-width:720px;width:100%;max-height:84vh;overflow-y:auto;position:relative;box-shadow:0 12px 40px rgba(0,0,0,.25)}'+
      '.cbms-modal-close{position:absolute;top:14px;right:14px;border:none;background:#eee;border-radius:999px;padding:6px 12px;font-weight:800;cursor:pointer}'+
      '.cbms-modal-title{margin:0 0 14px;font-size:16px;font-weight:900;color:#2b2430}'+
      '.cbms-modal-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}'+
      '.cbms-pick-card{cursor:pointer;border:2px solid #ece6f5;border-radius:8px;overflow:hidden;background:#fff;transition:.12s}'+
      '.cbms-pick-card:hover{border-color:#9181ff;transform:translateY(-1px)}'+
      '.cbms-pick-card img{width:100%;aspect-ratio:9/16;object-fit:cover;display:block;background:#fafafe}'+
      '.cbms-pick-meta{padding:5px 8px;font-size:10.5px;color:#5a4a56;font-weight:700;text-align:center}';
    document.head.appendChild(st);
  }
})();
