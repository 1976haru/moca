/* ================================================
   modules/content-builder/cb-export-package.js
   콘텐츠 빌더 3/3 — 출력 패키지 (design.json / quality / HTML / PNG)
   * html2canvas 가 있으면 PNG, 없으면 안내
   * 외부 이미지 CORS 실패 시 사용자에게 명시
   ================================================ */
(function(){
  'use strict';

  function _selected(p) {
    p = p || (window.contentBuilderProject || {});
    return (p.designBoard && p.designBoard.selectedLayout)
        || ((p.designBoard && p.designBoard.layouts || []).find(function(x){ return x.id === (p.designBoard && p.designBoard.selectedLayoutId); }))
        || null;
  }

  /* render — 출력 패키지 패널 */
  window.cbRenderExportPanel = function(p) {
    p = p || (window.contentBuilderProject || {});
    var L = _selected(p);
    if (!L) return '<div class="cbex-empty">먼저 시안을 선택하세요.</div>';
    _injectCSS();

    var pkg = _buildPackageStruct(p, L);
    p.designBoard = p.designBoard || {};
    p.designBoard.exportPackage = pkg.summary;
    if (typeof window.cbSave === 'function') window.cbSave();

    var status = _detectExportRisk(L);
    var statusHtml = status.warn
      ? '<div class="cbex-warn">⚠️ ' + status.warn + '</div>'
      : '<div class="cbex-ok">✅ 다운로드 준비 완료</div>';

    return '<div class="cbex-wrap">' +
      '<div class="cbex-intro">📦 디자인을 외부에서 사용할 수 있도록 패키지로 다운로드합니다.</div>' +
      statusHtml +
      '<div class="cbex-grid">' +
        _exportItem('📄 design.json',         '디자인 시안 + variants + 색·타이포 토큰', 'cbExDownloadDesignJson()') +
        _exportItem('📊 quality-report.json', '7항목 점수 + 개선 전후 비교',              'cbExDownloadQualityJson()') +
        _exportItem('🖼 preview.html',        'HTML/CSS 단일 파일 미리보기',                'cbExDownloadHtmlPreview()') +
        _exportItem('🎨 PNG 이미지',          'html2canvas 시도 (실패 시 안내)',            'cbExDownloadPng()') +
        _exportItem('🗂 mediaSlots.json',     '연결한 이미지/로고/배경 슬롯 정보',          'cbExDownloadMediaSlots()') +
      '</div>' +
      '<div class="cbex-bundle-row">' +
        '<button class="cbex-btn-primary" onclick="cbExDownloadAll()">⚡ 전체 패키지 다운로드 (각 파일 순차)</button>' +
      '</div>' +
    '</div>';
  };

  function _exportItem(label, desc, click) {
    return '<div class="cbex-item">' +
      '<div class="cbex-item-hd">' + label + '</div>' +
      '<div class="cbex-item-desc">' + desc + '</div>' +
      '<button class="cbex-btn" onclick="' + click + '">다운로드</button>' +
    '</div>';
  }

  /* ── 패키지 구조 ── */
  function _buildPackageStruct(p, L) {
    var dec = p.decomposedCopy || {};
    var sc  = L.qualityScore || { items:{}, percent:0, grade:'' };
    var prev = (p.designBoard && p.designBoard._autofixPrev) || null;
    var pkg = {
      designJson: {
        purpose:           L.purposeId,
        purposeLabel:      ((window.cbGetPurposePreset && window.cbGetPurposePreset(L.purposeId))||{}).label || '',
        aspectRatio:       L.aspectRatio,
        layoutPreset:      L.layoutPreset,
        colorPreset:       L.colorPreset,
        typographyPreset:  L.typographyPreset,
        qualityRules:      L.qualityRules,
        safeArea:          L.safeArea,
        blocks:            L.blocks,
        variants:          L.variants,
        decomposedCopy:    dec,
        sourceExampleId:   L.sourceExampleId,
        sourceExampleName: L.sourceExampleName,
        generatedAt:       new Date().toISOString(),
      },
      qualityReport: {
        scoreNow:        sc,
        scoreBefore:     prev,
        improvedBy:      prev ? (sc.percent - prev.percent) : 0,
      },
      mediaSlots: (p.designBoard && p.designBoard.mediaSlots) || {},
      summary: {
        layoutId:   L.id,
        purpose:    L.purposeId,
        ratio:      L.aspectRatio,
        score:      sc.percent,
        grade:      sc.grade,
        slotsCount: Object.keys((p.designBoard && p.designBoard.mediaSlots) || {}).filter(function(k){ var s = p.designBoard.mediaSlots[k]; return s && s.url; }).length,
        updatedAt:  Date.now(),
      },
    };
    return pkg;
  }

  function _detectExportRisk(L) {
    var risks = [];
    var p = window.contentBuilderProject || {};
    var slots = (p.designBoard && p.designBoard.mediaSlots) || {};
    var hasExternalUrl = false;
    Object.keys(slots).forEach(function(k){
      var s = slots[k];
      if (s && s.url && /^https?:\/\//.test(s.url) && s.url.indexOf(location.origin) < 0) hasExternalUrl = true;
    });
    if (hasExternalUrl) risks.push('외부 이미지 URL — PNG 다운로드 시 CORS 로 실패할 수 있습니다 (data:URL 또는 업로드 권장).');
    return { warn: risks.join(' / ') };
  }

  /* ── 파일 다운로드 ── */
  function _download(filename, content, type) {
    try {
      var blob = (content instanceof Blob) ? content : new Blob([content], { type: type || 'application/octet-stream' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click();
      setTimeout(function(){ a.remove(); URL.revokeObjectURL(url); }, 200);
      try { console.log('[cb-export] downloaded:', filename); } catch(_) {}
    } catch (e) {
      alert('다운로드 실패: ' + e.message);
    }
  }
  window.cbExDownloadDesignJson = function() {
    var p = window.contentBuilderProject || {};
    var L = _selected(p); if (!L) return;
    var pkg = _buildPackageStruct(p, L);
    _download('design.json', JSON.stringify(pkg.designJson, null, 2), 'application/json');
  };
  window.cbExDownloadQualityJson = function() {
    var p = window.contentBuilderProject || {};
    var L = _selected(p); if (!L) return;
    var pkg = _buildPackageStruct(p, L);
    _download('quality-report.json', JSON.stringify(pkg.qualityReport, null, 2), 'application/json');
  };
  window.cbExDownloadMediaSlots = function() {
    var p = window.contentBuilderProject || {};
    _download('media-slots.json', JSON.stringify((p.designBoard && p.designBoard.mediaSlots) || {}, null, 2), 'application/json');
  };
  window.cbExDownloadHtmlPreview = function() {
    var p = window.contentBuilderProject || {};
    var L = _selected(p); if (!L) return;
    var html = _buildStandaloneHtml(p, L);
    _download('preview.html', html, 'text/html;charset=utf-8');
  };
  window.cbExDownloadPng = function() {
    var p = window.contentBuilderProject || {};
    var L = _selected(p); if (!L) return;
    var node = document.querySelector('.cbdb2-big-prev .cbpv-frame');
    if (!node) {
      alert('미리보기 노드를 찾을 수 없습니다. design-board 탭에서 시안을 선택한 뒤 다시 시도하세요.');
      return;
    }
    if (typeof window.html2canvas !== 'function') {
      alert('이미지 다운로드는 html2canvas 라이브러리가 필요합니다. 현재 미설치 상태입니다.\n\n대신 design.json + preview.html 을 다운로드하시면 외부에서 PNG 변환할 수 있습니다.');
      return;
    }
    try {
      window.html2canvas(node, { useCORS: true, backgroundColor: null }).then(function(canvas){
        canvas.toBlob(function(blob){
          if (!blob) { alert('PNG 변환 실패 — CORS 또는 브라우저 보안 문제일 수 있습니다.'); return; }
          _download('design-' + L.id + '.png', blob, 'image/png');
        });
      }).catch(function(err){
        alert('PNG 변환 실패: ' + (err && err.message || err) + '\n\n이미지 다운로드는 브라우저 보안/CORS 문제로 실패할 수 있습니다. design.json 과 HTML preview 를 사용해 외부에서 변환하세요.');
      });
    } catch (e) {
      alert('PNG 변환 중 오류: ' + e.message);
    }
  };
  window.cbExDownloadAll = function() {
    cbExDownloadDesignJson();
    setTimeout(cbExDownloadQualityJson, 200);
    setTimeout(cbExDownloadMediaSlots, 400);
    setTimeout(cbExDownloadHtmlPreview, 600);
    setTimeout(function(){
      if (typeof window.html2canvas === 'function') cbExDownloadPng();
      else if (typeof ucShowToast === 'function') ucShowToast('PNG 는 html2canvas 미로드 상태로 건너뜀', 'info');
    }, 800);
  };

  /* ── 단일 HTML preview 빌드 ── */
  function _buildStandaloneHtml(p, L) {
    var preview = (typeof window.cbRenderDesignPreview === 'function')
      ? window.cbRenderDesignPreview(L, { scale: 1.0 })
      : '<div>미리보기 모듈 미로드</div>';
    var purposeLabel = ((window.cbGetPurposePreset && window.cbGetPurposePreset(L.purposeId))||{}).label || L.purposeId;
    /* design-preview 의 CSS 를 inline 으로 복사 */
    var inlineCss = (document.getElementById('cb-design-preview-style') || {}).textContent || '';
    return '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">' +
      '<title>MOCA Design — ' + _esc(purposeLabel) + '</title>' +
      '<style>body{margin:0;background:#f4f4f7;font-family:sans-serif;padding:40px;display:flex;justify-content:center}' +
      '.wrap{max-width:560px;width:100%}h1{font-size:18px;color:#5b1a4a;margin:0 0 14px}.score{font-size:13px;color:#7b6080;margin-bottom:14px}' +
      inlineCss + '</style></head><body><div class="wrap">' +
      '<h1>MOCA Design — ' + _esc(purposeLabel) + ' (' + L.aspectRatio + ')</h1>' +
      '<div class="score">시안: ' + _esc(L.typeLabel) + ' · 품질: ' + ((L.qualityScore && L.qualityScore.percent) || '-') + '점</div>' +
      preview +
      '</div></body></html>';
  }

  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  function _injectCSS() {
    if (document.getElementById('cb-export-package-style')) return;
    var st = document.createElement('style');
    st.id = 'cb-export-package-style';
    st.textContent =
      '.cbex-wrap{padding:6px 4px;display:flex;flex-direction:column;gap:10px}'+
      '.cbex-intro{font-size:12px;color:#7b6080;background:#fafafe;border-radius:8px;padding:8px 12px}'+
      '.cbex-warn{font-size:12px;color:#a05a00;background:#fff7e6;border:1px solid #f4cda5;border-radius:8px;padding:8px 12px}'+
      '.cbex-ok{font-size:12px;color:#1a7a5a;background:#effbf7;border:1px solid #c5ecdb;border-radius:8px;padding:8px 12px}'+
      '.cbex-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}'+
      '.cbex-item{background:#fff;border:1.5px solid #ece6f5;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:6px}'+
      '.cbex-item-hd{font-size:13px;font-weight:900;color:#2b2430}'+
      '.cbex-item-desc{font-size:11.5px;color:#7b6080;flex:1;line-height:1.5}'+
      '.cbex-btn{border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:8px;padding:6px 12px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit}'+
      '.cbex-btn:hover{border-color:#9181ff;color:#9181ff}'+
      '.cbex-bundle-row{margin-top:6px}'+
      '.cbex-btn-primary{width:100%;border:none;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-radius:10px;padding:10px 14px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit}'+
      '.cbex-btn-primary:hover{opacity:.92}'+
      '.cbex-empty{padding:30px 20px;text-align:center;color:#999;background:#fafafe;border-radius:12px;font-size:12.5px}';
    document.head.appendChild(st);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _injectCSS);
  else _injectCSS();
})();
