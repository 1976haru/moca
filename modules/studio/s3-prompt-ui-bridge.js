/* ================================================
   modules/studio/s3-prompt-ui-bridge.js
   ⭐ 기존 버튼을 v3.1 compiler 로 연결하는 bridge
   * studioS3AutoPrompt / studioS3AutoAllPrompts override
       → 1순위: compileImagePromptV31 (deterministic)
       → 2순위: 기존 AI 호출 fallback (legacy 함수 호출 — 토스트 안내)
   * window.s3PromptCompileAll → 전체 v3.1 컴파일 + 영상 프롬프트도 v3.1
   * window.s3PromptCompileScene(sceneIdx, type) → 단일 씬 v3.1
   * drawer 가 새로 그려질 때마다 품질 배지 inject
   * provider 경고 패널 inject
   * 이 파일은 s3-image.js / s3-image-board.js 다음에 로드되어야 함
   ================================================ */
(function(){
  'use strict';

  function _toast(msg, kind){
    if (typeof window.ucShowToast === 'function') {
      try { window.ucShowToast(msg, kind || 'info'); } catch(_){}
    }
  }
  function _project(){ return (window.s3GetProjectSafe ? window.s3GetProjectSafe() : (window.STUDIO && window.STUDIO.project) || {}); }
  function _s3(){ return (window.s3GetS3Safe ? window.s3GetS3Safe() : (_project().s3 = _project().s3 || {})); }

  /* ════════════════════════════════════════════════
     1) v3.1 단일 씬 — image / video
     ════════════════════════════════════════════════ */
  function compileSceneV31(sceneIdx, type){
    type = type || 'image';
    if (typeof window.compileImagePromptV31 !== 'function') return null;
    var scenes = (typeof window.s3GetResolvedScenesSafe === 'function')
      ? window.s3GetResolvedScenesSafe() : [];
    var sc = scenes[sceneIdx];
    if (!sc) {
      _toast('⚠️ 씬을 찾지 못했습니다 (대본 단계로 돌아가세요)', 'warn');
      return null;
    }
    var project = _project();
    var s3 = _s3();
    if (type === 'video' && typeof window.compileVideoPromptV31 === 'function') {
      var vr = window.compileVideoPromptV31(sc, sceneIdx, project);
      if (!vr || !vr.prompt) return null;
      s3.videoPrompts = s3.videoPrompts || [];
      s3.videoPrompts[sceneIdx] = vr.prompt;
      s3.scenePrompts = s3.scenePrompts || [];
      s3.scenePrompts[sceneIdx] = Object.assign({}, s3.scenePrompts[sceneIdx] || {}, {
        videoPromptV31: vr.prompt, videoPrompt: vr.prompt, promptCompilerVersion: 'v3.1'
      });
      s3.imagesV3 = s3.imagesV3 || {};
      s3.imagesV3[sceneIdx] = Object.assign({}, s3.imagesV3[sceneIdx] || {}, {
        videoPrompt: vr.prompt, videoPromptCompiled: vr.prompt
      });
      if (typeof window.studioSave === 'function') { try { window.studioSave(); } catch(_){} }
      return vr;
    }
    /* image */
    var ir = window.compileImagePromptV31(sc, sceneIdx, project);
    if (!ir || !ir.prompt) return null;
    s3.imagePrompts = s3.imagePrompts || [];
    s3.imagePrompts[sceneIdx] = ir.prompt;
    s3.prompts = s3.prompts || [];
    s3.prompts[sceneIdx] = ir.prompt;
    s3.scenePrompts = s3.scenePrompts || [];
    s3.scenePrompts[sceneIdx] = Object.assign({}, s3.scenePrompts[sceneIdx] || {}, {
      prompt: ir.prompt, promptCompiled: ir.prompt, intent: ir.intent,
      visualIntentV31: ir.intent, imagePromptV31: ir.prompt, imagePrompt: ir.prompt,
      negative: ir.negative, promptCompilerVersion: 'v3.1'
    });
    s3.imagesV3 = s3.imagesV3 || {};
    s3.imagesV3[sceneIdx] = Object.assign({}, s3.imagesV3[sceneIdx] || {}, {
      prompt: ir.prompt, promptCompiled: ir.prompt, negative: ir.negative,
      promptCompilerVersion: 'v3.1'
    });
    if (typeof window.studioSave === 'function') { try { window.studioSave(); } catch(_){} }
    return ir;
  }
  window.s3PromptCompileScene = compileSceneV31;

  /* ════════════════════════════════════════════════
     2) 기존 buttom override — studioS3AutoPrompt
     ════════════════════════════════════════════════ */
  var _legacyAutoPrompt = (typeof window.studioS3AutoPrompt === 'function') ? window.studioS3AutoPrompt : null;

  window.studioS3AutoPrompt = async function(idx){
    var r = compileSceneV31(idx, 'image');
    if (r && r.prompt) {
      var a = document.getElementById('s3-prompt-'+idx);     if (a) a.value = r.prompt;
      var b = document.getElementById('s3d-prompt-'+idx);    if (b) b.value = r.prompt;
      _toast('✅ 씬 ' + (idx+1) + ' v3.1 프롬프트 생성됨', 'success');
      if (typeof window.s3RefreshDetail === 'function' && window._s3OpenSceneIdx === idx) {
        try { window.s3RefreshDetail(idx); } catch(_){}
      }
      return r.prompt;
    }
    /* fallback — legacy AI 호출 */
    if (_legacyAutoPrompt) {
      _toast('⚠️ v3.1 컴파일 실패 — legacy AI 호출로 폴백합니다', 'warn');
      return _legacyAutoPrompt(idx);
    }
    _toast('❌ 프롬프트를 생성할 수 없습니다 — 씬 정보를 확인하세요', 'error');
  };

  /* studioS3AutoAllPrompts — v3.1 일괄 */
  var _legacyAutoAll = (typeof window.studioS3AutoAllPrompts === 'function') ? window.studioS3AutoAllPrompts : null;
  window.studioS3AutoAllPrompts = async function(){
    if (typeof window.compileImagePromptsV31All !== 'function') {
      if (_legacyAutoAll) return _legacyAutoAll();
      return;
    }
    var r = window.compileImagePromptsV31All();
    if (!r || !r.count) {
      _toast('❌ 씬을 찾지 못해 프롬프트를 생성하지 못했습니다', 'error');
      if (_legacyAutoAll) return _legacyAutoAll();
      return;
    }
    /* 점수 계산 */
    if (typeof window.s3ScoreAllAndStoreV31 === 'function') {
      try { window.s3ScoreAllAndStoreV31(); } catch(_){}
    }
    _toast('✅ ' + r.count + '개 씬 v3.1 프롬프트 생성 완료', 'success');
    if (typeof window.renderStudio === 'function') {
      try { window.renderStudio(); } catch(_){}
    }
  };

  /* s3PromptCompileAll — board 의 "전체 프롬프트 컴파일" 버튼이 호출 */
  window.s3PromptCompileAll = async function(){
    var imageDone = false, videoDone = false;
    if (typeof window.compileImagePromptsV31All === 'function') {
      var ri = window.compileImagePromptsV31All(); imageDone = !!(ri && ri.count);
    }
    if (typeof window.compileVideoPromptsV31All === 'function') {
      var rv = window.compileVideoPromptsV31All(); videoDone = !!(rv && rv.count);
    }
    if (typeof window.s3ScoreAllAndStoreV31 === 'function') {
      try { window.s3ScoreAllAndStoreV31(); } catch(_){}
    }
    if (imageDone || videoDone) {
      _toast('✅ 전체 v3.1 프롬프트 컴파일 완료', 'success');
      if (typeof window.renderStudio === 'function') { try { window.renderStudio(); } catch(_){} }
    } else {
      _toast('❌ 씬을 찾지 못했습니다 — 대본 단계 확인 필요', 'error');
    }
  };

  /* ════════════════════════════════════════════════
     3) drawer 품질 배지 inject — s3RefreshDetail 후 보강
     ════════════════════════════════════════════════ */
  var _origRefresh = window.s3RefreshDetail;
  window.s3RefreshDetail = function(sceneIdx){
    if (typeof _origRefresh === 'function') {
      try { _origRefresh(sceneIdx); } catch(_){}
    }
    _injectQualityBadgeIntoDrawer(sceneIdx);
  };

  function _injectQualityBadgeIntoDrawer(sceneIdx){
    if (typeof window.s3ScorePromptQualityV31 !== 'function') return;
    var drawer = document.getElementById('s3-detail-drawer');
    if (!drawer) return;
    var inner = drawer.querySelector('.s3-detail-inner');
    if (!inner) return;
    var s3 = _s3();
    var imgPrompt = (s3.imagePrompts || [])[sceneIdx] || '';
    var vidPrompt = (s3.videoPrompts || [])[sceneIdx] || '';
    var scenes = (typeof window.s3GetResolvedScenesSafe === 'function')
      ? window.s3GetResolvedScenesSafe() : [];
    var scene = scenes[sceneIdx] || {};
    var intent = (typeof window.s3ParseSceneVisualIntentV31 === 'function')
      ? window.s3ParseSceneVisualIntentV31(scene, sceneIdx, _project()) : null;
    var providerId = (typeof window.getSelectedImageProviderId === 'function')
      ? window.getSelectedImageProviderId() : (s3.api || 'dalle3');

    var imgScore = imgPrompt ? window.s3ScorePromptQualityV31(imgPrompt, scene, 'image', intent, providerId) : null;
    var vidScore = vidPrompt ? window.s3ScorePromptQualityV31(vidPrompt, scene, 'video', intent, providerId) : null;
    var provWarn = (typeof window.s3GetProviderQualityWarningV31 === 'function')
      ? window.s3GetProviderQualityWarningV31(providerId, 'image') : null;

    /* 기존 배지가 있으면 제거 */
    var prev = inner.querySelector('[data-v31-quality-badge]');
    if (prev) prev.remove();

    var html = '<div data-v31-quality-badge class="s3v31-badge-block">';
    if (provWarn) {
      html += '<div class="s3v31-prov-warn">' +
        '<div class="s3v31-prov-warn-msg">⚠️ ' + _esc(provWarn.message) + '</div>' +
        (provWarn.recommend ? '<div class="s3v31-prov-warn-rec">추천: ' + provWarn.recommend.join(', ') + '</div>' : '') +
        '</div>';
    }
    if (imgScore) {
      html += _badgeHtml('이미지', imgScore, sceneIdx, 'image');
    }
    if (vidScore) {
      html += _badgeHtml('영상', vidScore, sceneIdx, 'video');
    }
    html += '<div class="s3v31-actions">' +
      '<button class="s3v31-btn pri" onclick="window.s3PromptCompileScene(' + sceneIdx + ',\'image\');window.s3RefreshDetail(' + sceneIdx + ')">🪄 이 씬 v3.1 재생성</button>' +
      '<button class="s3v31-btn" onclick="window.s3PromptCompileScene(' + sceneIdx + ',\'video\');window.s3RefreshDetail(' + sceneIdx + ')">🎬 영상 v3.1 생성</button>' +
      '<button class="s3v31-btn" onclick="window.s3ScoreAllAndStoreV31&&window.s3ScoreAllAndStoreV31();window.s3RefreshDetail(' + sceneIdx + ')">📊 점수 다시 검사</button>' +
      '</div>';
    html += '</div>';

    /* 헤더 다음에 삽입 */
    var hd = inner.querySelector('.s3d-hd');
    if (hd && hd.insertAdjacentHTML) hd.insertAdjacentHTML('afterend', html);
    else inner.insertAdjacentHTML('afterbegin', html);
  }

  function _badgeHtml(label, sc, sceneIdx, type){
    var t = sc.tier || { label:'', color:'#666', bg:'#eee' };
    var issues = (sc.issues || []).slice(0, 3).map(function(i){ return '<li>' + _esc(i) + '</li>'; }).join('');
    return '<div class="s3v31-badge" style="border-color:' + t.color + ';background:' + t.bg + '">' +
      '<div class="s3v31-badge-hd">' +
        '<span class="s3v31-badge-label" style="color:' + t.color + '">' + _esc(label) + ' v3.1 점수</span>' +
        '<span class="s3v31-badge-score" style="background:' + t.color + '">' + sc.score + '</span>' +
        '<span class="s3v31-badge-tier" style="color:' + t.color + '">' + _esc(t.label) + '</span>' +
      '</div>' +
      (issues ? '<ul class="s3v31-badge-issues">' + issues + '</ul>' : '<div class="s3v31-badge-ok">충족</div>') +
    '</div>';
  }

  function _esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  /* CSS */
  function _injectCSS(){
    if (document.getElementById('s3v31-style')) return;
    var st = document.createElement('style');
    st.id = 's3v31-style';
    st.textContent = ''
      + '.s3v31-badge-block{margin:0 0 12px;display:flex;flex-direction:column;gap:8px}'
      + '.s3v31-badge{border:1.5px solid;border-radius:10px;padding:8px 10px}'
      + '.s3v31-badge-hd{display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap}'
      + '.s3v31-badge-label{font-size:11.5px;font-weight:800}'
      + '.s3v31-badge-score{color:#fff;border-radius:999px;padding:2px 9px;font-size:11.5px;font-weight:900}'
      + '.s3v31-badge-tier{font-size:11px;font-weight:700;margin-left:auto}'
      + '.s3v31-badge-issues{margin:4px 0 0 16px;padding:0;font-size:11px;color:#5a4a56;line-height:1.5}'
      + '.s3v31-badge-ok{font-size:11px;color:#1a7a5a;font-weight:700}'
      + '.s3v31-prov-warn{background:#fff8ec;border:1px solid #f1d99c;border-radius:10px;padding:8px 10px}'
      + '.s3v31-prov-warn-msg{font-size:11.5px;color:#8B5020;font-weight:700;line-height:1.5}'
      + '.s3v31-prov-warn-rec{font-size:11px;color:#8B5020;margin-top:4px}'
      + '.s3v31-actions{display:flex;gap:6px;flex-wrap:wrap}'
      + '.s3v31-btn{flex:1;min-width:110px;padding:7px 10px;border:1.5px solid var(--line);background:#fff;color:#5a4a56;border-radius:999px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit}'
      + '.s3v31-btn.pri{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border:none}'
      + '.s3v31-btn:hover{border-color:#9181ff;color:#9181ff}'
      + '.s3v31-btn.pri:hover{opacity:.92;color:#fff}'
      ;
    document.head.appendChild(st);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _injectCSS);
  else _injectCSS();
})();
