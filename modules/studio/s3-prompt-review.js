/* ================================================
   modules/studio/s3-prompt-review.js
   숏츠 스튜디오 — 프롬프트 미리검토 패널 + 보드 통합 (1/2)
   * 씬별 테이블: 번호 / role / intent / action / props / location /
                  점수 / 경고
   * 액션: 전체 컴파일 / 자동 보강 / 씬별 재생성 / tone variants
   ================================================ */
(function(){
  'use strict';

  /* drawer 표시 상태 */
  var REVIEW_OPEN = false;

  /* ════════════════════════════════════════════════
     review drawer 열기/닫기
     ════════════════════════════════════════════════ */
  window.s3OpenPromptReview = function() {
    REVIEW_OPEN = true;
    _renderDrawer();
  };
  window.s3ClosePromptReview = function() {
    REVIEW_OPEN = false;
    var d = document.getElementById('s3pr-drawer');
    if (d) d.remove();
    document.removeEventListener('keydown', _esc);
  };
  function _esc(e){ if (e.key === 'Escape') window.s3ClosePromptReview(); }

  function _renderDrawer() {
    var ex = document.getElementById('s3pr-drawer');
    if (ex) ex.remove();
    var d = document.createElement('div');
    d.id = 's3pr-drawer';
    d.className = 's3pr-back';
    d.innerHTML = '<div class="s3pr-panel" onclick="event.stopPropagation()">' +
      '<button class="s3pr-close" onclick="s3ClosePromptReview()">✕</button>' +
      '<div class="s3pr-inner">' + _renderInner() + '</div>' +
    '</div>';
    d.addEventListener('click', function(e){ if (e.target === d) window.s3ClosePromptReview(); });
    document.body.appendChild(d);
    document.addEventListener('keydown', _esc);
    _injectCSS();
  }

  function _refresh() {
    var inner = document.querySelector('#s3pr-drawer .s3pr-inner');
    if (inner) inner.innerHTML = _renderInner();
  }
  window.s3PromptReviewRefresh = _refresh;

  /* ════════════════════════════════════════════════
     본문 — 씬별 행 + 액션
     ════════════════════════════════════════════════ */
  function _renderInner() {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s3 = proj.s3 || {};
    var compiled = (typeof window.s3SCCompileAll === 'function') ? window.s3SCCompileAll(proj) : null;
    if (!compiled || !compiled.compiled.length) {
      return '<h3>🔍 프롬프트 미리검토</h3>' +
        '<div class="s3pr-empty">대본 또는 씬 정보가 없습니다. 1단계 대본을 먼저 생성하세요.</div>';
    }

    var headHtml = '<div class="s3pr-hd">' +
      '<div>' +
        '<h3>🔍 프롬프트 미리검토</h3>' +
        '<p>장르: <b>' + _esc(compiled.compiled[0].intent.strategyLabel) + '</b> · 씬 ' + compiled.count + '개 · 비율 ' + _esc(compiled.aspectMode) + '</p>' +
      '</div>' +
      '<div class="s3pr-hd-actions">' +
        '<button class="s3pr-btn s3pr-btn-pri" onclick="s3PrCompileAll()">🪄 전체 프롬프트 컴파일</button>' +
        '<button class="s3pr-btn" onclick="s3PrAugmentAll()">✨ 부족한 프롬프트 자동 보강</button>' +
      '</div>' +
    '</div>';

    var rowsHtml = compiled.compiled.map(function(c, i){
      var sc = compiled.scenes[i] || { label:'씬'+(i+1), role:c.intent.role };
      var roleLabel = (window.S3SC_ROLE_RULES && window.S3SC_ROLE_RULES[c.intent.role] || {}).label || c.intent.role;
      var sclass = c.score.percent >= 80 ? 'good' : c.score.percent >= 60 ? 'mid' : 'low';
      var warnHtml = c.score.warnings.length
        ? c.score.warnings.map(function(w){ return '<li>' + _esc(w) + '</li>'; }).join('')
        : '<li class="s3pr-ok">✅ 큰 문제 없음</li>';
      return '<details class="s3pr-row" ' + (c.score.percent < 60 ? 'open' : '') + '>' +
        '<summary>' +
          '<span class="s3pr-row-no">씬 ' + (i+1) + '</span>' +
          '<span class="s3pr-row-role">' + _esc(roleLabel) + '</span>' +
          '<span class="s3pr-row-intent">' + _esc(c.intent.action) + '</span>' +
          '<span class="s3pr-row-score s3pr-' + sclass + '">' + c.score.percent + '점</span>' +
          (c.augmented ? '<span class="s3pr-aug">✨ 보강됨</span>' : '') +
        '</summary>' +
        '<div class="s3pr-row-body">' +
          '<div class="s3pr-meta">' +
            '<div><b>action</b>: ' + _esc(c.intent.action) + '</div>' +
            '<div><b>props</b>: ' + _esc((c.intent.props||[]).join(', ')) + '</div>' +
            '<div><b>location</b>: ' + _esc(c.intent.location) + '</div>' +
            '<div><b>emotion</b>: ' + _esc(c.intent.emotion) + '</div>' +
            '<div><b>framing</b>: ' + _esc(c.intent.framing) + '</div>' +
          '</div>' +
          '<div class="s3pr-prompt"><b>Prompt</b>: <code>' + _esc(c.prompt) + '</code></div>' +
          '<div class="s3pr-prompt"><b>Negative</b>: <code>' + _esc(c.negative) + '</code></div>' +
          '<ul class="s3pr-warns">' + warnHtml + '</ul>' +
          '<div class="s3pr-row-actions">' +
            '<button class="s3pr-btn-mini" onclick="s3PrRegen(' + i + ')">🔁 재생성</button>' +
            '<button class="s3pr-btn-mini" onclick="s3PrTone(' + i + ',\'practical\')">실용적</button>' +
            '<button class="s3pr-btn-mini" onclick="s3PrTone(' + i + ',\'emotional\')">감정적</button>' +
            '<button class="s3pr-btn-mini" onclick="s3PrTone(' + i + ',\'informational\')">정보전달</button>' +
            '<button class="s3pr-btn-mini" onclick="s3PrTone(' + i + ',\'comic\')">코믹</button>' +
            '<button class="s3pr-btn-mini" onclick="s3PrCopy(' + i + ')">📋 복사</button>' +
          '</div>' +
        '</div>' +
      '</details>';
    }).join('');

    /* 적용 액션 */
    var bottomHtml = '<div class="s3pr-foot">' +
      '<button class="s3pr-btn s3pr-btn-pri" onclick="s3PrApplyAll()">✅ 전체 STUDIO.project 에 적용</button>' +
      '<span class="s3pr-foot-hint">→ 적용 후 보드의 ⚡ 전체 이미지 생성 버튼을 누르면 컴파일된 프롬프트가 사용됩니다.</span>' +
    '</div>';

    return headHtml + '<div class="s3pr-rows">' + rowsHtml + '</div>' + bottomHtml;
  }

  /* ════════════════════════════════════════════════
     액션
     ════════════════════════════════════════════════ */
  window.s3PrCompileAll = function() {
    var r = (typeof window.s3SCCompileAndApply === 'function') ? window.s3SCCompileAndApply({ rerender:false }) : null;
    if (typeof ucShowToast === 'function') ucShowToast('🪄 ' + (r ? r.count : 0) + '개 씬 프롬프트 컴파일 + STUDIO 적용', 'success');
    _refresh();
  };
  window.s3PrAugmentAll = function() {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var sp = (proj.s3 && proj.s3.scenePrompts) || [];
    sp.forEach(function(item, i){
      if (item && item.score && item.score.percent < 80 && typeof window.s3SCAugment === 'function') {
        var newP = window.s3SCAugment(item.prompt, item.intent);
        item.prompt = newP;
        proj.s3.imagePrompts[i] = newP;
        proj.s3.prompts[i] = newP;
        if (proj.s3.imagesV3 && proj.s3.imagesV3[i]) proj.s3.imagesV3[i].promptCompiled = newP;
        item.score = window.s3SCScorePrompt(newP, item.intent, proj.s3.imagePrompts);
      }
    });
    if (typeof window.studioSave === 'function') window.studioSave();
    if (typeof ucShowToast === 'function') ucShowToast('✨ 부족 프롬프트 자동 보강 완료', 'success');
    _refresh();
  };
  window.s3PrRegen = function(idx) {
    /* 재생성 — extract 다시 + augment */
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s3 = proj.s3 || {};
    var scenes = s3.scenes || [];
    var sc = scenes[idx]; if (!sc) return;
    var script = (proj.s2 && (proj.s2.scriptKo || proj.s2.scriptJa)) || '';
    var genre = (proj.s1 && (proj.s1.genre || proj.s1.style)) || 'general-info';
    var c = window.s3SCCompilePrompt(sc, { genre: genre, scriptText: script });
    c.score = window.s3SCScorePrompt(c.prompt, c.intent, s3.imagePrompts);
    if (c.score.percent < 60) {
      c.prompt = window.s3SCAugment(c.prompt, c.intent);
      c.score = window.s3SCScorePrompt(c.prompt, c.intent, s3.imagePrompts);
    }
    s3.imagePrompts[idx] = c.prompt;
    s3.prompts[idx] = c.prompt;
    s3.scenePrompts = s3.scenePrompts || [];
    s3.scenePrompts[idx] = { prompt:c.prompt, negative:c.negative, intent:c.intent, score:c.score };
    s3.imagesV3 = s3.imagesV3 || {};
    s3.imagesV3[idx] = s3.imagesV3[idx] || {};
    s3.imagesV3[idx].promptCompiled = c.prompt;
    if (typeof window.studioSave === 'function') window.studioSave();
    if (typeof ucShowToast === 'function') ucShowToast('🔁 씬' + (idx+1) + ' 재생성', 'success');
    _refresh();
  };
  window.s3PrTone = function(idx, tone) {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var sp = (proj.s3 && proj.s3.scenePrompts) || [];
    var item = sp[idx];
    if (!item) { window.s3PrRegen(idx); item = sp[idx]; }
    if (!item) return;
    var newP = window.s3SCToneVariant(item.prompt, item.intent, tone);
    item.prompt = newP;
    proj.s3.imagePrompts[idx] = newP;
    proj.s3.prompts[idx] = newP;
    if (proj.s3.imagesV3 && proj.s3.imagesV3[idx]) proj.s3.imagesV3[idx].promptCompiled = newP;
    item.score = window.s3SCScorePrompt(newP, item.intent, proj.s3.imagePrompts);
    if (typeof window.studioSave === 'function') window.studioSave();
    if (typeof ucShowToast === 'function') ucShowToast('🎚 씬' + (idx+1) + ' 톤: ' + tone, 'success');
    _refresh();
  };
  window.s3PrCopy = function(idx) {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var p = (proj.s3 && proj.s3.imagePrompts && proj.s3.imagePrompts[idx]) || '';
    if (!p) return;
    try {
      navigator.clipboard.writeText(p).then(function(){
        if (typeof ucShowToast === 'function') ucShowToast('📋 복사됨', 'success');
      });
    } catch(_) {}
  };
  window.s3PrApplyAll = function() {
    if (typeof window.s3SCCompileAndApply === 'function') {
      window.s3SCCompileAndApply({ rerender:true });
    }
    if (typeof ucShowToast === 'function') ucShowToast('✅ 전체 STUDIO 적용 — 보드에서 ⚡ 전체 이미지 생성 가능', 'success');
    window.s3ClosePromptReview();
  };

  /* ════════════════════════════════════════════════
     보드 툴바에 "🔍 프롬프트 검토" 버튼 자동 추가
     ════════════════════════════════════════════════ */
  function _augmentBoardToolbar() {
    /* boardRender 후 호출 */
    setTimeout(function(){
      var bulkRow = document.querySelector('.s3b-bulk-row');
      if (!bulkRow) return;
      if (bulkRow.querySelector('[data-s3pr-btn]')) return;
      var btn = document.createElement('button');
      btn.setAttribute('data-s3pr-btn','1');
      btn.className = 's3b-bulk-btn';
      btn.textContent = '🔍 프롬프트 검토';
      btn.onclick = function(){ window.s3OpenPromptReview(); };
      bulkRow.appendChild(btn);
    }, 50);
  }
  /* renderStudio 가 호출될 때마다 보드 툴바 패치 — MutationObserver */
  function _watchBoard() {
    if (typeof MutationObserver === 'undefined') return;
    var obs = new MutationObserver(function(){
      if (document.querySelector('.s3b-toolbar')) _augmentBoardToolbar();
    });
    obs.observe(document.body, { childList:true, subtree:true });
    /* 초기 1회 */
    _augmentBoardToolbar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _watchBoard);
  else _watchBoard();

  /* ════════════════════════════════════════════════
     기존 버튼 연결 — 보드의 "🪄 전체 프롬프트 컴파일" / studioS3AutoPrompt
     를 새 compiler 우선 사용하도록 override (기존 함수는 fallback 으로 보존)
     ════════════════════════════════════════════════ */
  function _wireExistingButtons() {
    /* ⭐ v4 가드 — v4 컴파일러가 로드되어 있으면 legacy s3SC 가 'middle-aged
       adult ... meaningful object' 같은 generic fallback 으로 v4 wrapper 를
       덮는 것을 차단. v4 가 결과 만들 수 있으면 절대 legacy 경로로 가지 않음. */
    var v4Available = (typeof window.compileImagePromptsV4All === 'function')
                   || (typeof window.compileImagePromptV4 === 'function');
    if (v4Available) {
      try { console.debug('[s3-prompt-review] v4 detected — skip legacy s3SC override'); } catch(_){}
      /* s3SCCompileSceneByIdx 만 노출해서 외부에서 명시적으로 호출할 때만 동작.
         자동 wiring 은 안 함. */
      window.s3SCCompileSceneByIdx = function(idx) {
        var proj = (window.STUDIO && window.STUDIO.project) || {};
        var sc = (proj.s3 && proj.s3.scenes && proj.s3.scenes[idx]);
        if (!sc) return null;
        var script = (proj.s2 && (proj.s2.scriptKo || proj.s2.scriptJa)) || '';
        var genre = (proj.s1 && (proj.s1.genre || proj.s1.style)) || 'general-info';
        return window.s3SCCompilePrompt(sc, { genre: genre, scriptText: script });
      };
      return;
    }

    /* 1) 보드 툴바 "🪄 전체 프롬프트 컴파일" → window.s3PromptCompileAll */
    if (typeof window.s3SCCompileAndApply === 'function') {
      var legacyCompile = window.s3PromptCompileAll;
      window.s3PromptCompileAll = function() {
        try {
          var r = window.s3SCCompileAndApply({ rerender:true });
          if (typeof ucShowToast === 'function') {
            ucShowToast('🪄 새 compiler — ' + r.count + '개 씬 프롬프트 컴파일됨', 'success');
          }
        } catch (e) {
          /* 새 compiler 실패 시 기존 fallback */
          if (typeof legacyCompile === 'function') legacyCompile();
        }
      };
    }
    /* 2) 단일 씬 — studioS3AutoPrompt 는 AI 호출이라 그대로 둠 (네트워크 호출).
       단, AI 응답이 없을 경우 fallback 으로 새 compiler 의 단일 씬 결과 사용 가능
       하도록 window.s3SCCompileSceneByIdx 노출 */
    window.s3SCCompileSceneByIdx = function(idx) {
      var proj = (window.STUDIO && window.STUDIO.project) || {};
      var sc = (proj.s3 && proj.s3.scenes && proj.s3.scenes[idx]);
      if (!sc) return null;
      var script = (proj.s2 && (proj.s2.scriptKo || proj.s2.scriptJa)) || '';
      var genre = (proj.s1 && (proj.s1.genre || proj.s1.style)) || 'general-info';
      return window.s3SCCompilePrompt(sc, { genre: genre, scriptText: script });
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _wireExistingButtons);
  else setTimeout(_wireExistingButtons, 100);

  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  function _injectCSS() {
    if (document.getElementById('s3-prompt-review-style')) return;
    var st = document.createElement('style');
    st.id = 's3-prompt-review-style';
    st.textContent =
      '.s3pr-back{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:20100;display:flex;justify-content:flex-end}'+
      '.s3pr-panel{width:min(720px,100%);max-width:100%;height:100%;background:#fff;overflow-y:auto;padding:24px;box-sizing:border-box;position:relative;font-family:inherit}'+
      '.s3pr-close{position:sticky;top:0;float:right;border:none;background:#eee;border-radius:999px;padding:6px 14px;cursor:pointer;font-weight:800;z-index:1}'+
      '.s3pr-hd{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}'+
      '.s3pr-hd h3{margin:0 0 4px;font-size:17px;font-weight:900;color:#2b2430}'+
      '.s3pr-hd p{margin:0;font-size:12.5px;color:#7b6080}'+
      '.s3pr-hd-actions{display:flex;gap:6px;flex-wrap:wrap}'+
      '.s3pr-btn{border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit}'+
      '.s3pr-btn:hover{border-color:#9181ff;color:#9181ff}'+
      '.s3pr-btn-pri{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border:none}'+
      '.s3pr-btn-pri:hover{opacity:.92;color:#fff}'+
      '.s3pr-rows{display:flex;flex-direction:column;gap:8px}'+
      '.s3pr-row{background:#fafafe;border:1px solid #ece6f5;border-radius:10px;padding:10px 14px}'+
      '.s3pr-row summary{cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;font-size:12.5px;flex-wrap:wrap}'+
      '.s3pr-row-no{font-weight:900;color:#2b2430;min-width:48px}'+
      '.s3pr-row-role{background:#f5f0ff;color:#5a4a8a;padding:2px 8px;border-radius:6px;font-weight:700;font-size:11px}'+
      '.s3pr-row-intent{flex:1;color:#5a4a56;font-size:12px}'+
      '.s3pr-row-score{font-weight:900;padding:3px 10px;border-radius:999px;font-size:11px;margin-left:auto}'+
      '.s3pr-good{background:#effbf7;color:#1a7a5a}'+
      '.s3pr-mid{background:#eef5ff;color:#2b66c4}'+
      '.s3pr-low{background:#fff1f1;color:#c0392b}'+
      '.s3pr-aug{background:#fff5fa;color:#5b1a4a;padding:2px 8px;border-radius:6px;font-size:10.5px;font-weight:800}'+
      '.s3pr-row-body{margin-top:10px;border-top:1px dashed #e0d8ee;padding-top:10px;display:flex;flex-direction:column;gap:8px}'+
      '.s3pr-meta{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px;font-size:11.5px;color:#3a3040}'+
      '.s3pr-meta b{color:#5b1a4a}'+
      '.s3pr-prompt{font-size:11.5px;color:#3a3040;background:#fff;padding:8px 10px;border-radius:8px;line-height:1.5}'+
      '.s3pr-prompt code{font-family:inherit;color:#3a3040;word-break:break-word}'+
      '.s3pr-warns{margin:0;padding-left:18px;font-size:11.5px;color:#a05a00;line-height:1.6}'+
      '.s3pr-warns li.s3pr-ok{color:#1a7a5a;font-weight:700;list-style:none}'+
      '.s3pr-row-actions{display:flex;gap:4px;flex-wrap:wrap}'+
      '.s3pr-btn-mini{border:1px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit}'+
      '.s3pr-btn-mini:hover{border-color:#9181ff;color:#9181ff}'+
      '.s3pr-foot{margin-top:14px;padding:14px;background:#fff5fa;border:1px solid #f1c5dc;border-radius:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}'+
      '.s3pr-foot-hint{font-size:11.5px;color:#5b1a4a}'+
      '.s3pr-empty{padding:40px 20px;text-align:center;color:#999;background:#fafafe;border-radius:12px;font-size:13px}';
    document.head.appendChild(st);
  }
})();
