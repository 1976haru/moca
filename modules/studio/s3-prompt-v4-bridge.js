/* ================================================
   modules/studio/s3-prompt-v4-bridge.js
   ⭐ v4 UI bridge — 기존 버튼/drawer 가 v4 우선, v3.1 폴백
   * window.s3PromptCompileScene(idx, type) — v4 우선
   * window.s3PromptCompileAll() / studioS3AutoAllPrompts — v4 우선
   * drawer 의 품질 배지/액션 영역에 v4 점수 + 사유 + must-show 누락 + 강점 표시
   * legacy generic fallback builder 는 v4 가 결과를 만들면 사용 중지
   * 이 파일은 s3-prompt-ui-bridge.js / s3-image.js 다음에 로드되어야 함
   ================================================ */
(function(){
  'use strict';

  function _toast(msg, kind){
    if (typeof window.ucShowToast === 'function') {
      try { window.ucShowToast(msg, kind || 'info'); } catch(_){}
    }
  }
  function _esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }
  function _project(){ return (window.s3GetProjectSafe ? window.s3GetProjectSafe() : (window.STUDIO && window.STUDIO.project) || {}); }
  function _s3(){ return (window.s3GetS3Safe ? window.s3GetS3Safe() : (_project().s3 = _project().s3 || {})); }

  /* ════════════════════════════════════════════════
     1) 단일 씬 v4 컴파일러 entry — image / video
     ════════════════════════════════════════════════ */
  function compileSceneV4(sceneIdx, type){
    type = type || 'image';
    var project = _project();
    var s3 = _s3();
    var profile = (typeof window.analyzeProjectProfileV4 === 'function')
      ? window.analyzeProjectProfileV4(project) : null;
    var scenes = (typeof window.s3GetResolvedScenesSafe === 'function')
      ? window.s3GetResolvedScenesSafe() : [];
    var sc = scenes[sceneIdx];
    if (!sc) {
      _toast('⚠️ 씬을 찾지 못했습니다 (대본 단계로 돌아가세요)', 'warn');
      return null;
    }
    var intent = (typeof window.analyzeSceneIntentV4 === 'function')
      ? window.analyzeSceneIntentV4(sc, profile, sceneIdx, scenes.length) : null;

    if (type === 'video' && typeof window.compileVideoPromptV4 === 'function') {
      var vr = window.compileVideoPromptV4(sc, sceneIdx, project, { projectProfile: profile, sceneIntent: intent });
      if (!vr || !vr.prompt) return null;
      s3.videoPrompts = s3.videoPrompts || [];
      s3.videoPrompts[sceneIdx] = vr.prompt;
      s3.scenePrompts = s3.scenePrompts || [];
      s3.scenePrompts[sceneIdx] = Object.assign({}, s3.scenePrompts[sceneIdx] || {}, {
        videoPromptV4: vr.prompt, videoPrompt: vr.prompt, promptCompilerVersion:'v4'
      });
      s3.imagesV3 = s3.imagesV3 || {};
      s3.imagesV3[sceneIdx] = Object.assign({}, s3.imagesV3[sceneIdx] || {}, {
        videoPrompt: vr.prompt, videoPromptCompiled: vr.prompt
      });
      if (typeof window.studioSave === 'function') { try { window.studioSave(); } catch(_){} }
      return vr;
    }

    if (typeof window.compileImagePromptV4 !== 'function') return null;
    var ir = window.compileImagePromptV4(sc, sceneIdx, project, { projectProfile: profile, sceneIntent: intent });
    if (!ir || !ir.prompt) return null;
    s3.imagePrompts = s3.imagePrompts || [];
    s3.imagePrompts[sceneIdx] = ir.prompt;
    s3.prompts = s3.prompts || [];
    s3.prompts[sceneIdx] = ir.prompt;
    s3.scenePrompts = s3.scenePrompts || [];
    s3.scenePrompts[sceneIdx] = Object.assign({}, s3.scenePrompts[sceneIdx] || {}, {
      prompt: ir.prompt, promptCompiled: ir.prompt, intent: ir.intent,
      sceneIntentV4: ir.intent, imagePromptV4: ir.prompt, imagePrompt: ir.prompt,
      negative: ir.negative, promptCompilerVersion:'v4'
    });
    s3.imagesV3 = s3.imagesV3 || {};
    s3.imagesV3[sceneIdx] = Object.assign({}, s3.imagesV3[sceneIdx] || {}, {
      prompt: ir.prompt, promptCompiled: ir.prompt, negative: ir.negative,
      promptCompilerVersion:'v4'
    });
    if (typeof window.studioSave === 'function') { try { window.studioSave(); } catch(_){} }
    return ir;
  }

  /* ════════════════════════════════════════════════
     2) s3PromptCompileScene 오버라이드 — v4 우선, v3.1 폴백
     ════════════════════════════════════════════════ */
  var _legacyCompileScene = window.s3PromptCompileScene; /* v3.1 bridge 가 등록한 함수 */
  window.s3PromptCompileScene = function(sceneIdx, type){
    var v4 = compileSceneV4(sceneIdx, type);
    if (v4 && v4.prompt) return v4;
    if (typeof _legacyCompileScene === 'function') {
      try { return _legacyCompileScene(sceneIdx, type); } catch(_){}
    }
    return null;
  };

  /* ════════════════════════════════════════════════
     3) studioS3AutoPrompt / AutoAllPrompts — v4 일괄 compiler 우선
     ════════════════════════════════════════════════ */
  var _legacyAutoAll = (typeof window.studioS3AutoAllPrompts === 'function') ? window.studioS3AutoAllPrompts : null;
  window.studioS3AutoAllPrompts = async function(){
    if (typeof window.compileImagePromptsV4All === 'function') {
      try {
        var r = window.compileImagePromptsV4All();
        if (r && r.count) {
          if (typeof window.s3ScoreAllAndStoreV4 === 'function') {
            try { window.s3ScoreAllAndStoreV4(); } catch(_){}
          }
          _toast('✅ ' + r.count + '개 씬 v4 프롬프트 생성 완료', 'success');
          if (typeof window.renderStudio === 'function') {
            try { window.renderStudio(); } catch(_){}
          }
          return;
        }
      } catch(_){}
    }
    /* v4 실패 시 legacy (v3.1 / AI) 로 폴백 */
    if (_legacyAutoAll) return _legacyAutoAll();
  };

  /* ════════════════════════════════════════════════
     4) s3PromptCompileAll (보드 "전체 프롬프트 컴파일" 버튼) — v4 우선
     ════════════════════════════════════════════════ */
  var _legacyCompileAll = (typeof window.s3PromptCompileAll === 'function') ? window.s3PromptCompileAll : null;
  window.s3PromptCompileAll = async function(){
    var imageDone = false, videoDone = false;
    if (typeof window.compileImagePromptsV4All === 'function') {
      var ri = window.compileImagePromptsV4All(); imageDone = !!(ri && ri.count);
    }
    if (typeof window.compileVideoPromptsV4All === 'function') {
      var rv = window.compileVideoPromptsV4All(); videoDone = !!(rv && rv.count);
    }
    if (typeof window.s3ScoreAllAndStoreV4 === 'function') {
      try { window.s3ScoreAllAndStoreV4(); } catch(_){}
    }
    if (imageDone || videoDone) {
      _toast('✅ 전체 v4 프롬프트 컴파일 완료', 'success');
      if (typeof window.renderStudio === 'function') { try { window.renderStudio(); } catch(_){} }
      return;
    }
    if (_legacyCompileAll) return _legacyCompileAll();
    _toast('❌ 씬을 찾지 못했습니다 — 대본 단계 확인 필요', 'error');
  };

  /* ════════════════════════════════════════════════
     5) drawer 품질 배지 v4 inject — s3RefreshDetail 후 보강
     기존 v3.1 배지 옆에 v4 배지 추가 (기존 v3.1 배지는 유지).
     동일 render-tick 내 중복 호출 방지 (microtask flag).
     ════════════════════════════════════════════════ */
  var _origRefresh = window.s3RefreshDetail;
  var _v4InjectInProgress = false; /* 같은 호출 stack 안에서 재진입 차단 */
  window.s3RefreshDetail = function(sceneIdx){
    if (typeof _origRefresh === 'function') {
      try { _origRefresh(sceneIdx); } catch(_){}
    }
    if (_v4InjectInProgress) return;
    _v4InjectInProgress = true;
    try { _injectV4BadgeIntoDrawer(sceneIdx); }
    finally { _v4InjectInProgress = false; }
  };

  function _injectV4BadgeIntoDrawer(sceneIdx){
    if (typeof window.scorePromptQualityV4 !== 'function') return;
    var drawer = document.getElementById('s3-detail-drawer');
    if (!drawer) return;
    var inner = drawer.querySelector('.s3-detail-inner');
    if (!inner) return;
    /* 현재 drawer 가 의도한 sceneIdx 와 일치하는지 — 다른 씬 drawer 위에 inject 방지 */
    if (typeof window._s3OpenSceneIdx === 'number' && window._s3OpenSceneIdx !== sceneIdx) return;
    var s3 = _s3();
    var imgPrompt = (s3.imagePrompts || [])[sceneIdx] || '';
    var vidPrompt = (s3.videoPrompts || [])[sceneIdx] || '';
    var profile = (typeof window.analyzeProjectProfileV4 === 'function') ? window.analyzeProjectProfileV4(_project()) : {};
    var scenes = (typeof window.s3GetResolvedScenesSafe === 'function') ? window.s3GetResolvedScenesSafe() : [];
    var sc = scenes[sceneIdx];
    var intents = (typeof window.analyzeAllSceneIntentsV4 === 'function') ? window.analyzeAllSceneIntentsV4(profile) : [];
    var intent = intents[sceneIdx] || (typeof window.analyzeSceneIntentV4 === 'function'
      ? window.analyzeSceneIntentV4(sc, profile, sceneIdx, scenes.length) : null);
    var grammar = (typeof window.buildGenreVisualGrammarV4 === 'function')
      ? window.buildGenreVisualGrammarV4(profile, intent) : {};
    var providerId = (typeof window.getSelectedImageProviderId === 'function')
      ? window.getSelectedImageProviderId() : 'dalle3';

    var imgScore = imgPrompt ? window.scorePromptQualityV4({
      prompt: imgPrompt, type:'image', intent: intent, profile: profile, grammar: grammar,
      providerId: providerId, allPrompts: s3.imagePrompts
    }) : null;
    var vidScore = vidPrompt ? window.scorePromptQualityV4({
      prompt: vidPrompt, type:'video', intent: intent, profile: profile, grammar: grammar,
      providerId: providerId
    }) : null;
    var provWarn = (typeof window.s3GetProviderQualityWarningV4 === 'function')
      ? window.s3GetProviderQualityWarningV4(providerId, 'image') : null;

    /* 기존 v4 배지 모두 제거 후 재삽입 (querySelectorAll 로 누적된 중복 정리) */
    var prevs = inner.querySelectorAll('[data-v4-quality-badge]');
    for (var pi = 0; pi < prevs.length; pi++) prevs[pi].parentNode && prevs[pi].parentNode.removeChild(prevs[pi]);
    /* drawer 외부 (document level) 에 누락 inject 가 있을 가능성도 청소 */
    var strayPrev = drawer.querySelectorAll('[data-v4-quality-badge]');
    for (var si = 0; si < strayPrev.length; si++) {
      if (!inner.contains(strayPrev[si])) strayPrev[si].parentNode && strayPrev[si].parentNode.removeChild(strayPrev[si]);
    }

    var html = '<div data-v4-quality-badge class="s3v4-badge-block">';
    html += '<div class="s3v4-hdline">🆕 <b>v4 품질</b> — 결정적 컴파일러 + 180점 만점 평가 (150 통과)</div>';
    if (provWarn) {
      html += '<div class="s3v4-prov-warn">' +
        '<div class="s3v4-prov-warn-msg">⚠️ ' + _esc(provWarn.message) + '</div>' +
        (provWarn.recommend ? '<div class="s3v4-prov-warn-rec">추천: ' + provWarn.recommend.join(', ') + '</div>' : '') +
      '</div>';
    }
    if (intent) {
      html += _intentSummaryHtml(intent, profile);
    }
    if (imgScore) html += _v4BadgeHtml('이미지', imgScore, sceneIdx, 'image');
    if (vidScore) html += _v4BadgeHtml('영상',   vidScore, sceneIdx, 'video');
    html += '<div class="s3v4-actions">' +
      '<button class="s3v4-btn pri" onclick="window.s3PromptCompileScene(' + sceneIdx + ',\'image\');window.s3RefreshDetail(' + sceneIdx + ')">🪄 이 씬 v4 재생성</button>' +
      '<button class="s3v4-btn" onclick="window.s3PromptCompileScene(' + sceneIdx + ',\'video\');window.s3RefreshDetail(' + sceneIdx + ')">🎬 영상 v4 생성</button>' +
      '<button class="s3v4-btn" onclick="window.s3ScoreAllAndStoreV4&&window.s3ScoreAllAndStoreV4();window.s3RefreshDetail(' + sceneIdx + ')">📊 v4 점수 다시 검사</button>' +
    '</div>';
    html += '</div>';

    /* v3.1 배지 다음 또는 헤더 다음에 삽입 */
    var v31badge = inner.querySelector('[data-v31-quality-badge]');
    if (v31badge && v31badge.insertAdjacentHTML) v31badge.insertAdjacentHTML('afterend', html);
    else {
      var hd = inner.querySelector('.s3d-hd');
      if (hd && hd.insertAdjacentHTML) hd.insertAdjacentHTML('afterend', html);
      else inner.insertAdjacentHTML('afterbegin', html);
    }
  }

  function _intentSummaryHtml(intent, profile){
    var role = intent.role || '';
    var roleKo = ({hook:'훅', setup:'설명', conflict_or_core:'갈등/핵심', reveal_or_solution:'해결', cta:'CTA'})[role] || role;
    var subj = _esc(intent.subject || '');
    var obj  = (intent.mustShowObjects || []).slice(0, 3).map(_esc).join(', ');
    var act  = (intent.mustShowActions || []).slice(0, 2).map(_esc).join(', ');
    var emo  = (intent.mustShowEmotion || []).slice(0, 2).map(_esc).join(', ');
    var diff = (intent.differentiationHints || []).slice(0, 3).map(_esc).join(', ');
    var genre = _esc((profile && profile.genre) || '');
    var why  = _esc(intent.narrativeGoal || '');
    return '<div class="s3v4-intent">' +
      '<div class="s3v4-intent-hd">🧭 v4 의도 분석 — 왜 이 프롬프트가 생성되었는가</div>' +
      '<div class="s3v4-intent-row"><span class="s3v4-intent-k">role</span><span class="s3v4-intent-v">' + _esc(roleKo) + '</span></div>' +
      '<div class="s3v4-intent-row"><span class="s3v4-intent-k">장르</span><span class="s3v4-intent-v">' + genre + '</span></div>' +
      '<div class="s3v4-intent-row"><span class="s3v4-intent-k">subject</span><span class="s3v4-intent-v">' + subj + '</span></div>' +
      (obj  ? '<div class="s3v4-intent-row"><span class="s3v4-intent-k">must-show 사물</span><span class="s3v4-intent-v">' + obj + '</span></div>' : '') +
      (act  ? '<div class="s3v4-intent-row"><span class="s3v4-intent-k">행동</span><span class="s3v4-intent-v">' + act + '</span></div>' : '') +
      (emo  ? '<div class="s3v4-intent-row"><span class="s3v4-intent-k">감정</span><span class="s3v4-intent-v">' + emo + '</span></div>' : '') +
      (diff ? '<div class="s3v4-intent-row"><span class="s3v4-intent-k">차별 단서</span><span class="s3v4-intent-v">' + diff + '</span></div>' : '') +
      (why  ? '<div class="s3v4-intent-row"><span class="s3v4-intent-k">서사 목표</span><span class="s3v4-intent-v">' + why + '</span></div>' : '') +
    '</div>';
  }

  function _v4BadgeHtml(label, sc, sceneIdx, type){
    var t = sc.tier || { label:'', color:'#666', bg:'#eee' };
    var miss = (sc.issues || []).slice(0, 4).map(function(i){ return '<li>' + _esc(i) + '</li>'; }).join('');
    var good = (sc.strengths || []).slice(0, 3).map(function(i){ return '<li>' + _esc(i) + '</li>'; }).join('');
    var b = sc.breakdown || {};
    function _pair(k, item, m){
      if (!item) return '';
      return '<span class="s3v4-bd-pair">' + _esc(k) + ' <b>' + item.score + '</b>/' + (item.max || m) + '</span>';
    }
    var bdHtml =
      _pair('의도', b.intentFidelity, 40) +
      _pair('role', b.roleAccuracy, 20) +
      _pair('구체성', b.specificity, 25) +
      _pair('근거', b.evidenceCoverage, 20) +
      _pair('차별', b.differentiation, 20) +
      _pair('장르', b.genreFidelity, 20) +
      _pair(type === 'video' ? '영상문법' : '이미지문법', b.suitability, 15) +
      _pair('연속/제작', b.continuity, 20);
    return '<div class="s3v4-badge" style="border-color:' + t.color + ';background:' + t.bg + '">' +
      '<div class="s3v4-badge-hd">' +
        '<span class="s3v4-badge-label" style="color:' + t.color + '">' + _esc(label) + ' v4 점수</span>' +
        '<span class="s3v4-badge-score" style="background:' + t.color + '">' + sc.total + '/180</span>' +
        '<span class="s3v4-badge-tier" style="color:' + t.color + '">' + _esc(t.label) + (sc.pass ? ' · 통과' : '') + '</span>' +
      '</div>' +
      '<div class="s3v4-badge-bd">' + bdHtml + '</div>' +
      (miss ? '<div class="s3v4-badge-sec"><div class="s3v4-badge-sec-hd">개선 사유</div><ul class="s3v4-badge-issues">' + miss + '</ul></div>' : '') +
      (good ? '<div class="s3v4-badge-sec"><div class="s3v4-badge-sec-hd">강점</div><ul class="s3v4-badge-issues good">' + good + '</ul></div>' : '') +
    '</div>';
  }

  /* CSS */
  function _injectCSS(){
    if (document.getElementById('s3v4-style')) return;
    var st = document.createElement('style');
    st.id = 's3v4-style';
    st.textContent = ''
      + '.s3v4-badge-block{margin:12px 0;display:flex;flex-direction:column;gap:8px;border-top:1px dashed #ddc6d4;padding-top:10px}'
      + '.s3v4-hdline{font-size:12px;color:#5b1a4a;line-height:1.5}'
      + '.s3v4-prov-warn{background:#fff8ec;border:1px solid #f1d99c;border-radius:10px;padding:8px 10px}'
      + '.s3v4-prov-warn-msg{font-size:11.5px;color:#8B5020;font-weight:700;line-height:1.5}'
      + '.s3v4-prov-warn-rec{font-size:11px;color:#8B5020;margin-top:4px}'
      + '.s3v4-intent{background:#fbf7f9;border:1px solid #f1dce7;border-radius:10px;padding:8px 10px}'
      + '.s3v4-intent-hd{font-size:11.5px;font-weight:800;color:#5b1a4a;margin-bottom:4px}'
      + '.s3v4-intent-row{display:flex;gap:8px;font-size:11px;line-height:1.6}'
      + '.s3v4-intent-k{flex:0 0 80px;color:#9b8a93;font-weight:700}'
      + '.s3v4-intent-v{flex:1;color:#3a2a30}'
      + '.s3v4-badge{border:1.5px solid;border-radius:10px;padding:8px 10px}'
      + '.s3v4-badge-hd{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}'
      + '.s3v4-badge-label{font-size:11.5px;font-weight:800}'
      + '.s3v4-badge-score{color:#fff;border-radius:999px;padding:2px 9px;font-size:11.5px;font-weight:900}'
      + '.s3v4-badge-tier{font-size:11px;font-weight:700;margin-left:auto}'
      + '.s3v4-badge-bd{display:flex;flex-wrap:wrap;gap:6px 10px;font-size:10.5px;color:#5a4a56;margin-bottom:6px}'
      + '.s3v4-bd-pair{padding:1px 6px;background:#fff;border-radius:6px;border:1px solid #f1dce7}'
      + '.s3v4-bd-pair b{color:#3a2a30}'
      + '.s3v4-badge-sec{margin-top:4px}'
      + '.s3v4-badge-sec-hd{font-size:11px;font-weight:700;color:#5a4a56;margin-bottom:2px}'
      + '.s3v4-badge-issues{margin:0 0 0 16px;padding:0;font-size:11px;color:#5a4a56;line-height:1.5}'
      + '.s3v4-badge-issues.good{color:#1a7a5a}'
      + '.s3v4-actions{display:flex;gap:6px;flex-wrap:wrap}'
      + '.s3v4-btn{flex:1;min-width:130px;padding:7px 10px;border:1.5px solid var(--line);background:#fff;color:#5a4a56;border-radius:999px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit}'
      + '.s3v4-btn.pri{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border:none}'
      + '.s3v4-btn:hover{border-color:#9181ff;color:#9181ff}'
      + '.s3v4-btn.pri:hover{opacity:.92;color:#fff}'
      ;
    document.head.appendChild(st);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _injectCSS);
  else _injectCSS();
})();
