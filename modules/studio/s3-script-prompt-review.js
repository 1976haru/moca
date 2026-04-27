/* ================================================
   modules/studio/s3-script-prompt-review.js
   숏츠 스튜디오 — 카드형 대본/프롬프트 검토 패널
   * 장면별 카드: 대본 + 이미지 프롬프트 + 점수 + tone 버튼
   * 다른 자동숏츠 프로그램 기준 — 검토 → 수정 → 생성
   * s3-prompt-review.js (드로어 표 형식) 와 별개로 inline card-grid 제공
   ================================================ */
(function(){
  'use strict';

  /* drawer 표시 상태 */
  var OPEN = false;

  function _proj() { return (window.STUDIO && window.STUDIO.project) || {}; }
  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  /* ════════════════════════════════════════════════
     drawer open/close
     ════════════════════════════════════════════════ */
  window.s3OpenScriptReview = function() {
    OPEN = true;
    _renderDrawer();
  };
  window.s3CloseScriptReview = function() {
    OPEN = false;
    var d = document.getElementById('s3spr-drawer');
    if (d) d.remove();
    document.removeEventListener('keydown', _esc1);
  };
  function _esc1(e){ if (e.key === 'Escape') window.s3CloseScriptReview(); }

  function _renderDrawer() {
    var ex = document.getElementById('s3spr-drawer');
    if (ex) ex.remove();
    var d = document.createElement('div');
    d.id = 's3spr-drawer';
    d.className = 's3spr-back';
    d.innerHTML = '<div class="s3spr-panel" onclick="event.stopPropagation()">' +
      '<button class="s3spr-close" onclick="s3CloseScriptReview()">✕</button>' +
      '<div class="s3spr-inner">' + _renderInner() + '</div>' +
    '</div>';
    d.addEventListener('click', function(e){ if (e.target === d) window.s3CloseScriptReview(); });
    document.body.appendChild(d);
    document.addEventListener('keydown', _esc1);
    _injectCSS();
  }

  function _refresh() {
    var inner = document.querySelector('#s3spr-drawer .s3spr-inner');
    if (inner) inner.innerHTML = _renderInner();
  }
  window.s3ScriptReviewRefresh = _refresh;

  /* ════════════════════════════════════════════════
     본문 — 카드 grid
     ════════════════════════════════════════════════ */
  function _renderInner() {
    var p = _proj();
    var s3 = p.s3 || {};
    var s2 = p.s2 || {};
    var compiled = (typeof window.s3SCCompileAll === 'function') ? window.s3SCCompileAll(p) : null;
    if (!compiled || !compiled.compiled.length) {
      return '<h3>📝 대본·프롬프트 검토</h3>' +
        '<div class="s3spr-empty">대본 또는 씬 정보가 없습니다. 1단계 대본을 먼저 생성하세요.<br><br>' +
        '<button class="s3spr-btn-pri" onclick="cbGotoTab && cbGotoTab(\'t1\');s3CloseScriptReview()">1단계 대본으로 가기</button></div>';
    }

    /* 헤더 */
    var purposeLabel = compiled.compiled[0].intent.strategyLabel;
    var headHtml = '<div class="s3spr-hd">' +
      '<div>' +
        '<h3>📝 대본·프롬프트 검토</h3>' +
        '<p>장르: <b>' + _esc(purposeLabel) + '</b> · 씬 ' + compiled.count + '개 · 비율 ' + _esc(compiled.aspectMode) + '</p>' +
        '<p class="s3spr-hint">각 장면의 대본과 이미지 프롬프트를 확인·수정한 뒤 "✅ 적용 후 닫기" 를 누르세요. 보드의 ⚡ 전체 이미지 생성은 수정된 promptCompiled 를 사용합니다.</p>' +
      '</div>' +
      '<div class="s3spr-hd-actions">' +
        '<button class="s3spr-btn-pri" onclick="s3SprCompileAll()">🪄 전체 프롬프트 컴파일</button>' +
        '<button class="s3spr-btn" onclick="s3SprAugmentAll()">✨ 부족 자동 보강</button>' +
      '</div>' +
    '</div>';

    /* 대본 텍스트 분리 — 씬별 narration 추출 */
    var rawScript = (s2.scriptKo || s2.scriptJa) || p.scriptText || '';
    var sceneNarrations = _splitScriptToScenes(rawScript, compiled.scenes.length);

    /* 카드 grid */
    var cardsHtml = compiled.compiled.map(function(c, i){
      var sc = compiled.scenes[i] || { label:'씬'+(i+1), role:c.intent.role, time:'' };
      var roleRule = (window.S3SC_ROLE_RULES || {})[c.intent.role] || {};
      var roleLabel = roleRule.label || c.intent.role;
      var sclass = c.score.percent >= 80 ? 'good' : c.score.percent >= 60 ? 'mid' : 'low';
      var warns = c.score.warnings || [];
      var warnsHtml = warns.length
        ? '<ul class="s3spr-warns">' + warns.map(function(w){ return '<li>'+_esc(w)+'</li>'; }).join('') + '</ul>'
        : '<div class="s3spr-ok">✅ 큰 문제 없음</div>';

      /* 대본 — narration (씬별 분할 결과) 또는 sc.lines / sc.desc */
      var sceneNarr = sceneNarrations[i]
                   || (sc.lines && sc.lines.join(' '))
                   || sc.desc || sc.label || '';

      /* 프롬프트 — promptCompiled 우선, 없으면 c.prompt */
      var slot = (s3.imagesV3 || {})[i];
      var savedPrompt = (slot && slot.promptCompiled)
                     || (s3.imagePrompts || [])[i]
                     || c.prompt;

      return '<div class="s3spr-card" data-idx="' + i + '">' +
        '<div class="s3spr-card-hd">' +
          '<span class="s3spr-no">씬 ' + (i+1) + '</span>' +
          '<span class="s3spr-role">' + _esc(roleLabel) + '</span>' +
          '<span class="s3spr-time">' + _esc(sc.time || '') + '</span>' +
          '<span class="s3spr-score s3spr-' + sclass + '">' + c.score.percent + '점</span>' +
          (c.augmented ? '<span class="s3spr-aug">✨ 보강됨</span>' : '') +
        '</div>' +

        /* 대본 textarea */
        '<label class="s3spr-label">📜 대본</label>' +
        '<textarea class="s3spr-narr" data-idx="' + i + '" '+
          'oninput="s3SprUpdateNarration(' + i + ', this.value)" placeholder="이 장면의 대본">'+
          _esc(sceneNarr) +
        '</textarea>' +

        /* 이미지 프롬프트 textarea */
        '<label class="s3spr-label">🎨 이미지 프롬프트 (영문)</label>' +
        '<textarea class="s3spr-prompt" data-idx="' + i + '" '+
          'oninput="s3SprUpdatePrompt(' + i + ', this.value)" placeholder="image prompt">'+
          _esc(savedPrompt) +
        '</textarea>' +

        /* visual intent meta */
        '<div class="s3spr-meta">' +
          '<div><b>action</b>: ' + _esc(c.intent.action) + '</div>' +
          '<div><b>props</b>: ' + _esc((c.intent.props||[]).join(', ')) + '</div>' +
          '<div><b>location</b>: ' + _esc(c.intent.location) + '</div>' +
          '<div><b>framing</b>: ' + _esc(c.intent.framing) + '</div>' +
        '</div>' +

        warnsHtml +

        /* tone variants + 재생성 */
        '<div class="s3spr-tones">' +
          '<button class="s3spr-tone" onclick="s3SprTone(' + i + ', \'practical\')">실용적</button>' +
          '<button class="s3spr-tone" onclick="s3SprTone(' + i + ', \'emotional\')">감정적</button>' +
          '<button class="s3spr-tone" onclick="s3SprTone(' + i + ', \'informational\')">정보전달</button>' +
          '<button class="s3spr-tone" onclick="s3SprTone(' + i + ', \'comic\')">코믹</button>' +
          '<button class="s3spr-tone s3spr-regen" onclick="s3SprRegenScene(' + i + ')">🔁 재생성</button>' +
        '</div>' +
      '</div>';
    }).join('');

    /* 하단 적용 */
    var bottomHtml = '<div class="s3spr-foot">' +
      '<button class="s3spr-btn-pri" onclick="s3SprApplyAndClose()">✅ 적용 후 닫기</button>' +
      '<span class="s3spr-foot-hint">→ 보드의 ⚡ 전체 이미지 생성을 누르면 위에서 수정한 프롬프트가 사용됩니다.</span>' +
    '</div>';

    return headHtml + '<div class="s3spr-grid">' + cardsHtml + '</div>' + bottomHtml;
  }

  /* ════════════════════════════════════════════════
     대본 → 씬별 narration 분할 (heuristic)
     씬1, 씬2, 씬3 마커 우선 / 없으면 문단 분할 / 마지막엔 균등 분할
     ════════════════════════════════════════════════ */
  function _splitScriptToScenes(script, n) {
    if (!script || !n) return [];
    var raw = String(script);
    /* 1) 씬N 마커 패턴 */
    var marker = /(?:^|\n)\s*(?:씬|scene|SCENE|シーン)\s*\d+[:\s\]\)\.\-]*/g;
    var hits = [];
    var m;
    while ((m = marker.exec(raw)) !== null) hits.push(m.index);
    if (hits.length >= n) {
      var parts = [];
      for (var i = 0; i < n; i++) {
        var start = hits[i];
        var end = hits[i+1] != null ? hits[i+1] : raw.length;
        parts.push(raw.slice(start, end).replace(marker, '').trim());
      }
      return parts;
    }
    /* 2) 문단 분할 (\n\n) */
    var paras = raw.split(/\n\s*\n+/).map(function(s){ return s.trim(); }).filter(Boolean);
    if (paras.length >= n) {
      var parts2 = [];
      var per = Math.ceil(paras.length / n);
      for (var k = 0; k < n; k++) {
        parts2.push(paras.slice(k*per, (k+1)*per).join('\n').trim());
      }
      return parts2;
    }
    /* 3) 문장 단위 균등 분할 */
    var sentences = raw.split(/(?<=[.!?。])\s+/).filter(Boolean);
    if (sentences.length >= n) {
      var per2 = Math.ceil(sentences.length / n);
      var parts3 = [];
      for (var j = 0; j < n; j++) {
        parts3.push(sentences.slice(j*per2, (j+1)*per2).join(' ').trim());
      }
      return parts3;
    }
    /* fallback — 한 덩어리 + 빈 칸 */
    var arr = []; arr[0] = raw.trim();
    for (var f = 1; f < n; f++) arr[f] = '';
    return arr;
  }

  /* ════════════════════════════════════════════════
     액션
     ════════════════════════════════════════════════ */
  /* 대본 textarea 변경 — STUDIO.project.s3.scenes[i].lines 갱신 */
  window.s3SprUpdateNarration = function(idx, val) {
    var p = _proj();
    p.s3 = p.s3 || {};
    p.s3.scenes = p.s3.scenes || [];
    var sc = p.s3.scenes[idx] || { label:'씬'+(idx+1) };
    sc.lines = String(val||'').split(/\n+/).map(function(s){ return s.trim(); }).filter(Boolean);
    sc.desc = String(val||'').slice(0, 80);
    p.s3.scenes[idx] = sc;
    if (typeof window.studioSave === 'function') window.studioSave();
  };

  /* 프롬프트 textarea 변경 — V3 + legacy 동시 저장 */
  window.s3SprUpdatePrompt = function(idx, val) {
    var p = _proj();
    p.s3 = p.s3 || {};
    p.s3.imagePrompts = p.s3.imagePrompts || [];
    p.s3.prompts      = p.s3.prompts      || [];
    p.s3.imagePrompts[idx] = val;
    p.s3.prompts[idx]      = val;
    p.s3.imagesV3 = p.s3.imagesV3 || {};
    p.s3.imagesV3[idx] = p.s3.imagesV3[idx] || {};
    p.s3.imagesV3[idx].promptCompiled = val;
    /* 점수만 갱신 (uniqueness 위해 모든 prompts 전달) */
    if (typeof window.s3SCScorePrompt === 'function') {
      var slot = p.s3.imagesV3[idx];
      var intent = (p.s3.scenePrompts && p.s3.scenePrompts[idx] && p.s3.scenePrompts[idx].intent) || {};
      slot.promptScore = window.s3SCScorePrompt(val, intent, p.s3.imagePrompts);
    }
    if (typeof window.studioSave === 'function') window.studioSave();
  };

  /* 씬 재생성 — 새 compiler */
  window.s3SprRegenScene = function(idx) {
    var p = _proj();
    var s3 = p.s3 || {};
    var sc = (s3.scenes || [])[idx]; if (!sc) return;
    var script = (p.s2 && (p.s2.scriptKo || p.s2.scriptJa)) || '';
    var genre = (p.s1 && (p.s1.genre || p.s1.style)) || 'general-info';
    var c = window.s3SCCompilePrompt(sc, { genre: genre, scriptText: script });
    c.score = window.s3SCScorePrompt(c.prompt, c.intent, s3.imagePrompts);
    if (c.score.percent < 60) {
      c.prompt = window.s3SCAugment(c.prompt, c.intent);
      c.score = window.s3SCScorePrompt(c.prompt, c.intent, s3.imagePrompts);
    }
    s3.imagePrompts = s3.imagePrompts || []; s3.prompts = s3.prompts || [];
    s3.imagePrompts[idx] = c.prompt; s3.prompts[idx] = c.prompt;
    s3.scenePrompts = s3.scenePrompts || [];
    s3.scenePrompts[idx] = { prompt:c.prompt, negative:c.negative, intent:c.intent, score:c.score };
    s3.imagesV3 = s3.imagesV3 || {};
    s3.imagesV3[idx] = s3.imagesV3[idx] || {};
    s3.imagesV3[idx].promptCompiled = c.prompt;
    s3.imagesV3[idx].promptScore = c.score;
    if (typeof window.studioSave === 'function') window.studioSave();
    if (typeof ucShowToast === 'function') ucShowToast('🔁 씬' + (idx+1) + ' 재생성', 'success');
    _refresh();
  };

  /* tone variant */
  window.s3SprTone = function(idx, tone) {
    var p = _proj();
    var s3 = p.s3 || {};
    var current = (s3.imagePrompts || [])[idx]
               || (s3.imagesV3 && s3.imagesV3[idx] && s3.imagesV3[idx].promptCompiled)
               || '';
    if (!current) { window.s3SprRegenScene(idx); current = (s3.imagePrompts || [])[idx] || ''; }
    if (!current) return;
    var intent = (s3.scenePrompts && s3.scenePrompts[idx] && s3.scenePrompts[idx].intent) || {};
    var newP = window.s3SCToneVariant(current, intent, tone);
    s3.imagePrompts[idx] = newP; s3.prompts[idx] = newP;
    s3.imagesV3 = s3.imagesV3 || {}; s3.imagesV3[idx] = s3.imagesV3[idx] || {};
    s3.imagesV3[idx].promptCompiled = newP;
    if (s3.scenePrompts && s3.scenePrompts[idx]) {
      s3.scenePrompts[idx].prompt = newP;
      s3.scenePrompts[idx].score = window.s3SCScorePrompt(newP, intent, s3.imagePrompts);
    }
    if (typeof window.studioSave === 'function') window.studioSave();
    if (typeof ucShowToast === 'function') ucShowToast('🎚 씬' + (idx+1) + ' 톤: ' + tone, 'success');
    _refresh();
  };

  /* 전체 컴파일 — v4 우선, v4 없을 때만 legacy s3SC 사용.
     v4 가 있으면 generic fallback 'middle-aged adult ...' 같은 phrase 가
     절대 prompt 에 들어가지 않도록 v4 경로로만 라우팅. */
  window.s3SprCompileAll = function() {
    if (typeof window.compileImagePromptsV4All === 'function') {
      try {
        var rv = window.compileImagePromptsV4All();
        if (typeof window.s3ScoreAllAndStoreV4 === 'function') { try { window.s3ScoreAllAndStoreV4(); } catch(_){} }
        if (typeof ucShowToast === 'function') ucShowToast('🪄 v4 — ' + (rv && rv.count || 0) + '개 씬 프롬프트 컴파일', 'success');
        _refresh();
        return;
      } catch (e) { try { console.debug('[s3spr] v4 compile failed, falling back:', e && e.message); } catch(_){} }
    }
    if (typeof window.s3SCCompileAndApply === 'function') {
      var r = window.s3SCCompileAndApply({ rerender:false });
      if (typeof ucShowToast === 'function') ucShowToast('🪄 ' + r.count + '개 씬 프롬프트 컴파일 + STUDIO 적용', 'success');
    }
    _refresh();
  };

  /* 전체 보강 */
  window.s3SprAugmentAll = function() {
    var p = _proj();
    var sp = (p.s3 && p.s3.scenePrompts) || [];
    sp.forEach(function(item, i){
      if (item && item.score && item.score.percent < 80 && typeof window.s3SCAugment === 'function') {
        var newP = window.s3SCAugment(item.prompt, item.intent);
        item.prompt = newP;
        p.s3.imagePrompts[i] = newP;
        p.s3.prompts[i] = newP;
        if (p.s3.imagesV3 && p.s3.imagesV3[i]) p.s3.imagesV3[i].promptCompiled = newP;
        item.score = window.s3SCScorePrompt(newP, item.intent, p.s3.imagePrompts);
      }
    });
    if (typeof window.studioSave === 'function') window.studioSave();
    if (typeof ucShowToast === 'function') ucShowToast('✨ 부족 프롬프트 자동 보강 완료', 'success');
    _refresh();
  };

  window.s3SprApplyAndClose = function() {
    if (typeof window.studioSave === 'function') window.studioSave();
    if (typeof ucShowToast === 'function') ucShowToast('✅ 검토 결과 저장 — 보드에서 ⚡ 전체 이미지 생성 가능', 'success');
    window.s3CloseScriptReview();
    if (typeof window.renderStudio === 'function') window.renderStudio();
  };

  /* ════════════════════════════════════════════════
     보드 툴바에 "📝 대본·프롬프트 검토" 버튼 자동 추가
     ════════════════════════════════════════════════ */
  function _augmentBoardToolbar() {
    setTimeout(function(){
      var bulkRow = document.querySelector('.s3b-bulk-row');
      if (!bulkRow) return;
      if (bulkRow.querySelector('[data-s3spr-btn]')) return;
      var btn = document.createElement('button');
      btn.setAttribute('data-s3spr-btn','1');
      btn.className = 's3b-bulk-btn pri';
      btn.textContent = '📝 대본·프롬프트 검토';
      btn.onclick = function(){ window.s3OpenScriptReview(); };
      /* 가장 앞에 (가장 중요) */
      bulkRow.insertBefore(btn, bulkRow.firstChild);
    }, 50);
  }
  function _watchBoard() {
    if (typeof MutationObserver === 'undefined') return;
    var obs = new MutationObserver(function(){
      if (document.querySelector('.s3b-toolbar')) _augmentBoardToolbar();
    });
    obs.observe(document.body, { childList:true, subtree:true });
    _augmentBoardToolbar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _watchBoard);
  else _watchBoard();

  /* ════════════════════════════════════════════════
     CSS
     ════════════════════════════════════════════════ */
  function _injectCSS() {
    if (document.getElementById('s3-script-review-style')) return;
    var st = document.createElement('style');
    st.id = 's3-script-review-style';
    st.textContent =
      '.s3spr-back{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:20100;display:flex;align-items:center;justify-content:center;padding:20px}'+
      '.s3spr-panel{width:100%;max-width:1280px;height:90vh;background:#fff;border-radius:18px;overflow-y:auto;padding:24px;box-sizing:border-box;position:relative;font-family:inherit}'+
      '.s3spr-close{position:sticky;top:0;float:right;border:none;background:#eee;border-radius:999px;padding:6px 14px;cursor:pointer;font-weight:800;z-index:1}'+
      '.s3spr-hd{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}'+
      '.s3spr-hd h3{margin:0 0 4px;font-size:18px;font-weight:900;color:#2b2430}'+
      '.s3spr-hd p{margin:0;font-size:12.5px;color:#7b6080}'+
      '.s3spr-hint{font-size:11.5px !important;color:#9181ff !important}'+
      '.s3spr-hd-actions{display:flex;gap:6px;flex-wrap:wrap}'+
      '.s3spr-btn{border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit}'+
      '.s3spr-btn:hover{border-color:#9181ff;color:#9181ff}'+
      '.s3spr-btn-pri{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit}'+
      '.s3spr-btn-pri:hover{opacity:.92;color:#fff}'+
      '.s3spr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}'+
      '.s3spr-card{background:#fafafe;border:1.5px solid #ece6f5;border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:8px}'+
      '.s3spr-card-hd{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px}'+
      '.s3spr-no{font-weight:900;color:#2b2430;font-size:13px}'+
      '.s3spr-role{background:#f5f0ff;color:#5a4a8a;padding:2px 8px;border-radius:6px;font-weight:700;font-size:10.5px}'+
      '.s3spr-time{color:#7b6080;font-size:11px}'+
      '.s3spr-score{margin-left:auto;font-weight:900;padding:3px 10px;border-radius:999px;font-size:11px}'+
      '.s3spr-good{background:#effbf7;color:#1a7a5a}'+
      '.s3spr-mid{background:#eef5ff;color:#2b66c4}'+
      '.s3spr-low{background:#fff1f1;color:#c0392b}'+
      '.s3spr-aug{background:#fff5fa;color:#5b1a4a;padding:2px 7px;border-radius:6px;font-size:10px;font-weight:800}'+
      '.s3spr-label{font-size:11px;font-weight:800;color:#5b1a4a;margin-top:4px}'+
      '.s3spr-narr,.s3spr-prompt{width:100%;border:1.5px solid var(--line,#e9e4f3);border-radius:8px;padding:8px 10px;font-size:12px;font-family:inherit;resize:vertical;box-sizing:border-box;background:#fff;line-height:1.5}'+
      '.s3spr-narr{min-height:60px}'+
      '.s3spr-prompt{min-height:80px;color:#3a3040}'+
      '.s3spr-narr:focus,.s3spr-prompt:focus{outline:none;border-color:#9181ff}'+
      '.s3spr-meta{display:grid;grid-template-columns:1fr;gap:3px;font-size:11px;color:#5a4a56;background:#fff;border-radius:8px;padding:6px 10px}'+
      '.s3spr-meta b{color:#5b1a4a;font-weight:800;margin-right:4px}'+
      '.s3spr-warns{margin:0;padding-left:18px;font-size:11px;color:#a05a00;line-height:1.5}'+
      '.s3spr-ok{font-size:11px;color:#1a7a5a;font-weight:700;padding:4px 0}'+
      '.s3spr-tones{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}'+
      '.s3spr-tone{flex:1;min-width:60px;border:1px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:6px;padding:5px 8px;font-size:10.5px;font-weight:700;cursor:pointer;font-family:inherit}'+
      '.s3spr-tone:hover{border-color:#9181ff;color:#9181ff}'+
      '.s3spr-regen{background:#fff5fa;color:#c0397b;border-color:#f1c5dc;flex:1.3}'+
      '.s3spr-regen:hover{background:#ef6fab;color:#fff;border-color:#ef6fab}'+
      '.s3spr-foot{margin-top:18px;padding:14px;background:#fff5fa;border:1px solid #f1c5dc;border-radius:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}'+
      '.s3spr-foot-hint{font-size:11.5px;color:#5b1a4a}'+
      '.s3spr-empty{padding:50px 20px;text-align:center;color:#7b6080;background:#fafafe;border-radius:12px;font-size:13.5px;line-height:1.7}'+
      '@media(max-width:760px){.s3spr-grid{grid-template-columns:1fr}.s3spr-panel{padding:16px;border-radius:0;height:100vh}}';
    document.head.appendChild(st);
  }
})();
