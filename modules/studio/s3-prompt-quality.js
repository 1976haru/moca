/* ================================================
   modules/studio/s3-prompt-quality.js
   이미지/영상 프롬프트 품질 점수 + 개선 + UI HUD
   * 0~100 점수, 항목별 체크
   * 부족 항목 표시 + "프롬프트 개선" 버튼
   * 씬간 유사도 경고
   ================================================ */
(function(){
  'use strict';

  /* ── 이미지 프롬프트 평가 항목 ── */
  const IMG_CHECKS = [
    { key:'subject',     re:/\[subject\]|\bperson|child|parent|elderly|business|citizen|character|character|actor/i, label:'인물', weight:12 },
    { key:'location',    re:/\[location\]|\binterior|home|office|street|park|shop|stage|hospital|cafe|desk|night|window/i, label:'장소', weight:12 },
    { key:'action',      re:/\[action\]|\b(holding|reaching|looking|waiting|listening|speaking|sitting|standing|reading|tapping|walking|engaging)/i, label:'행동', weight:12 },
    { key:'emotion',     re:/\[emotion\]|\b(regret|gratitude|loneliness|warmth|reflective|content|concerned|surprised|calm|expressive)/i, label:'감정', weight:10 },
    { key:'keyObject',   re:/\[key object\]|photograph|phone|letter|wallet|meal|medication|form|product|microphone|object/i, label:'핵심 소품', weight:10 },
    { key:'composition', re:/\[composition\]|close-?up|medium shot|wide|over-?the-?shoulder|two-?shot|split|portrait composition/i, label:'구도', weight:10 },
    { key:'lighting',    re:/\[lighting\]|golden|natural|studio|warm|soft|neon|window|key light|stage/i, label:'조명', weight:8 },
    { key:'style',       re:/\[style\]|cinematic|realistic|documentary|commercial|tutorial|editorial|music video/i, label:'스타일', weight:10 },
    { key:'vertical',    re:/9:16|vertical|portrait composition|full vertical frame/i, label:'9:16 세로', weight:10 },
    { key:'noText',      re:/no text overlay|no subtitles|no watermark/i, label:'노 텍스트', weight:6 },
  ];
  /* ── 영상 프롬프트 평가 항목 ── */
  const VID_CHECKS = [
    { key:'duration',    re:/\[duration\]|second|sec\b/i, label:'길이', weight:10 },
    { key:'opening',     re:/\[opening frame\]|opens with|first frame/i, label:'오프닝 프레임', weight:10 },
    { key:'subjectMv',   re:/\[subject movement\]|enters|reaches|turns|shifts|looks up|fills the frame/i, label:'피사체 움직임', weight:12 },
    { key:'cameraMv',    re:/\[camera movement\]|push-?in|pull-?back|pan|tilt|drift|handheld|static|slow|gentle/i, label:'카메라 움직임', weight:14 },
    { key:'emoTrans',    re:/\[emotional transition\]|→|to\b|softens|evolves|tension|relief|surprise|understanding/i, label:'감정 변화', weight:12 },
    { key:'focus',       re:/\[focus shift\]|face → |hand|device|wide.*close|close.*wide/i, label:'초점 이동', weight:10 },
    { key:'pacing',      re:/\[pacing\]|slow|quick|calm|steady|rhythm|measured/i, label:'페이싱', weight:8 },
    { key:'style',       re:/\[style\]|cinematic|realistic|documentary|commercial|tutorial/i, label:'스타일', weight:8 },
    { key:'format',      re:/\[format\]|vertical 9:16|9:16 vertical/i, label:'9:16 세로', weight:10 },
    { key:'noText',      re:/no text overlay|no subtitles|no watermark|no logo/i, label:'노 텍스트', weight:6 },
  ];

  function _scoreWith(checks, prompt) {
    var p = String(prompt || '');
    var totalWeight = 0, gained = 0, missing = [];
    checks.forEach(function(c){
      totalWeight += c.weight;
      if (c.re.test(p)) gained += c.weight;
      else missing.push({ key:c.key, label:c.label, weight:c.weight });
    });
    var score = totalWeight ? Math.round((gained / totalWeight) * 100) : 0;
    return { score: score, missing: missing, gainedWeight: gained, totalWeight: totalWeight };
  }
  function scoreImagePrompt(p) { return _scoreWith(IMG_CHECKS, p); }
  function scoreVideoPrompt(p) { return _scoreWith(VID_CHECKS, p); }
  window.s3ScoreImagePrompt = scoreImagePrompt;
  window.s3ScoreVideoPrompt = scoreVideoPrompt;

  function tier(score) {
    if (score >= 85) return { tier:'good',   label:'좋음',       color:'#1a7a5a', bg:'#effbf7' };
    if (score >= 75) return { tier:'usable', label:'사용 가능',  color:'#2b66c4', bg:'#eef5ff' };
    if (score >= 60) return { tier:'improve',label:'개선 권장',  color:'#a05a00', bg:'#fff7e6' };
    return                { tier:'redo',    label:'재생성 권장', color:'#c0392b', bg:'#fff1f1' };
  }
  window.s3PromptTier = tier;

  /* ── 씬간 유사도 (자카드) — 0~1, 0.6 이상이면 경고 ── */
  function _tokenize(s) {
    return String(s||'').toLowerCase().replace(/\[[^\]]*\]/g,' ').split(/[^a-z가-힣0-9]+/).filter(function(t){ return t.length >= 3; });
  }
  function _jaccard(a, b) {
    var sa = new Set(a), sb = new Set(b);
    var inter = 0;
    sa.forEach(function(t){ if (sb.has(t)) inter++; });
    var uni = sa.size + sb.size - inter;
    return uni ? inter / uni : 0;
  }
  function pairwiseSimilarityWarn(prompts) {
    if (!Array.isArray(prompts) || prompts.length < 2) return { high: false, max: 0 };
    var toks = prompts.map(_tokenize);
    var max = 0;
    for (var i = 0; i < toks.length; i++) {
      for (var j = i+1; j < toks.length; j++) {
        var s = _jaccard(toks[i], toks[j]);
        if (s > max) max = s;
      }
    }
    return { high: max >= 0.6, max: Math.round(max * 100) / 100 };
  }
  window.s3PairwiseSimilarityWarn = pairwiseSimilarityWarn;

  /* ── 프롬프트 자동 개선 — 부족 항목을 보강 ── */
  function improveImagePrompt(prompt, ctx) {
    ctx = ctx || {};
    var ev = scoreImagePrompt(prompt);
    if (!ev.missing.length) return prompt;
    var add = [];
    ev.missing.forEach(function(m){
      switch(m.key) {
        case 'subject':     add.push('[Subject] a person reflecting on the moment'); break;
        case 'location':    add.push('[Location] soft natural setting'); break;
        case 'action':      add.push('[Action] engaging with the key object thoughtfully'); break;
        case 'emotion':     add.push('[Emotion] reflective, restrained'); break;
        case 'keyObject':   add.push('[Key Object] a meaningful everyday object'); break;
        case 'composition': add.push('[Composition] medium shot, portrait composition'); break;
        case 'lighting':    add.push('[Lighting] soft natural light, warm mood'); break;
        case 'style':       add.push('[Style] realistic cinematic'); break;
        case 'vertical':    add.push('9:16 vertical, portrait composition, full vertical frame'); break;
        case 'noText':      add.push('no text overlay, no subtitles, no watermark'); break;
      }
    });
    return String(prompt || '').trim() + (add.length ? '\n' + add.join('\n') : '');
  }
  function improveVideoPrompt(prompt, ctx) {
    ctx = ctx || {};
    var ev = scoreVideoPrompt(prompt);
    if (!ev.missing.length) return prompt;
    var add = [];
    ev.missing.forEach(function(m){
      switch(m.key) {
        case 'duration':  add.push('[Duration] ~6 seconds'); break;
        case 'opening':   add.push('[Opening frame] opens with the subject in the location, key object visible'); break;
        case 'subjectMv': add.push('[Subject movement] subject performs the action subtly'); break;
        case 'cameraMv':  add.push('[Camera movement] slow push-in'); break;
        case 'emoTrans':  add.push('[Emotional transition] curiosity → emotional pull'); break;
        case 'focus':     add.push('[Focus shift] face → key object'); break;
        case 'pacing':    add.push('[Pacing] measured'); break;
        case 'style':     add.push('[Style] realistic cinematic'); break;
        case 'format':    add.push('[Format] vertical 9:16'); break;
        case 'noText':    add.push('[Negative] no text overlay, no subtitles burned in, no watermark, no logo'); break;
      }
    });
    return String(prompt || '').trim() + (add.length ? '\n' + add.join('\n') : '');
  }
  window.s3ImproveImagePrompt = improveImagePrompt;
  window.s3ImproveVideoPrompt = improveVideoPrompt;

  /* ════════════════════════════════════════════════
     UI HUD — 씬 카드 안에서 호출
       window.s3PromptHudHtml(idx) → 점수 칩 + 부족 항목 + 액션 버튼 HTML
     ════════════════════════════════════════════════ */
  function s3PromptHudHtml(idx) {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s3 = proj.s3 || {};
    var imgP = (s3.imagePrompts && s3.imagePrompts[idx]) || (s3.prompts && s3.prompts[idx]) || '';
    var vidP = (s3.videoPrompts && s3.videoPrompts[idx]) || '';

    var imgEv = imgP ? scoreImagePrompt(imgP) : null;
    var vidEv = vidP ? scoreVideoPrompt(vidP) : null;

    function _pill(ev, kind, label) {
      if (!ev) {
        return '<button class="s3-hud-pill s3-hud-empty" onclick="s3PromptCompileScene('+idx+',\''+kind+'\')">'+
               '🪄 '+label+' 생성</button>';
      }
      var t = tier(ev.score);
      var miss = ev.missing.map(function(m){ return m.label; }).join(', ') || '없음';
      return '<div class="s3-hud-card" style="background:'+t.bg+';border-color:'+t.color+'33">' +
        '<div class="s3-hud-row">' +
          '<span class="s3-hud-score" style="color:'+t.color+'">'+ev.score+'점</span>' +
          '<span class="s3-hud-tier" style="color:'+t.color+'">'+label+' · '+t.label+'</span>' +
          '<button class="s3-hud-mini" onclick="s3PromptCopy('+idx+',\''+kind+'\')" title="복사">📋</button>' +
          (ev.score < 85 ? '<button class="s3-hud-mini" onclick="s3PromptImprove('+idx+',\''+kind+'\')" title="개선">✨</button>' : '') +
          '<button class="s3-hud-mini" onclick="s3PromptCompileScene('+idx+',\''+kind+'\')" title="재생성">🔄</button>' +
        '</div>' +
        (ev.missing.length ?
          '<div class="s3-hud-miss">부족: '+miss+'</div>' : '') +
      '</div>';
    }

    return '<div class="s3-hud-wrap">' +
      _pill(imgEv, 'image', '이미지 프롬프트') +
      _pill(vidEv, 'video', '영상 프롬프트') +
      '<div class="s3-hud-actions">' +
        '<button class="s3-hud-act" onclick="s3PromptOpenVideoTab('+idx+')">🎬 영상 프롬프트 탭으로</button>' +
        '<button class="s3-hud-act" onclick="s3PromptCompileAll()">🪄 전체 씬 자동 컴파일</button>' +
      '</div>' +
    '</div>';
  }
  window.s3PromptHudHtml = s3PromptHudHtml;

  /* ── 씬 단일 컴파일 ── */
  window.s3PromptCompileScene = function(idx, kind) {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s3 = proj.s3 || {};
    var s1 = proj.s1 || {};
    if (typeof window.s3CompileAllForProject !== 'function') return;
    var all = window.s3CompileAllForProject({});
    if (kind === 'image' || !kind) {
      s3.imagePrompts = (s3.imagePrompts && s3.imagePrompts.length === all.count) ? s3.imagePrompts : all.imagePrompts.slice();
      s3.imagePrompts[idx] = all.imagePrompts[idx] || s3.imagePrompts[idx] || '';
      s3.prompts = s3.imagePrompts.slice();
    }
    if (kind === 'video' || !kind) {
      s3.videoPrompts = (s3.videoPrompts && s3.videoPrompts.length === all.count) ? s3.videoPrompts : all.videoPrompts.slice();
      s3.videoPrompts[idx] = all.videoPrompts[idx] || s3.videoPrompts[idx] || '';
    }
    s1.sceneCount = all.sceneCount;
    s1.imagePromptMode = all.mode;
    if (typeof window.studioSave === 'function') window.studioSave();
    if (typeof window.renderStudio === 'function') window.renderStudio();
  };

  /* ── 전체 컴파일 ── */
  window.s3PromptCompileAll = function() {
    if (typeof window.s3CompileAllForProject !== 'function') { alert('컴파일러가 로드되지 않았습니다.'); return; }
    if (typeof window.s3ApplyCompiledToProject !== 'function') return;
    var compiled = window.s3CompileAllForProject({});
    var sim = pairwiseSimilarityWarn(compiled.imagePrompts);
    window.s3ApplyCompiledToProject(compiled, { rerender: true });
    var msg = '✅ ' + compiled.count + '개 씬에 대해 이미지·영상 프롬프트를 생성했습니다.\n\n' +
              '모드: ' + compiled.mode + ' / 장르: ' + compiled.genre + '\n' +
              '씬 수: ' + compiled.sceneCount;
    if (sim.high) msg += '\n\n⚠️ 씬간 유사도 ' + Math.round(sim.max*100) + '% — 차별성을 보강하세요.';
    if (typeof ucShowToast === 'function') ucShowToast(msg, sim.high ? 'warning' : 'success');
    else alert(msg);
  };

  /* ── 복사 ── */
  window.s3PromptCopy = function(idx, kind) {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s3 = proj.s3 || {};
    var p = (kind === 'video' ? (s3.videoPrompts||[])[idx] : (s3.imagePrompts||s3.prompts||[])[idx]) || '';
    if (!p) return;
    try {
      navigator.clipboard.writeText(p).then(function(){
        if (typeof ucShowToast === 'function') ucShowToast('📋 복사됨', 'success');
      });
    } catch(_) {
      var ta = document.createElement('textarea');
      ta.value = p; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
  };

  /* ── 개선 ── */
  window.s3PromptImprove = function(idx, kind) {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s3 = proj.s3 || {};
    if (kind === 'video') {
      s3.videoPrompts = s3.videoPrompts || [];
      s3.videoPrompts[idx] = improveVideoPrompt(s3.videoPrompts[idx] || '');
    } else {
      s3.imagePrompts = s3.imagePrompts || s3.prompts || [];
      s3.imagePrompts[idx] = improveImagePrompt(s3.imagePrompts[idx] || (s3.prompts||[])[idx] || '');
      s3.prompts = s3.imagePrompts.slice();
    }
    if (typeof window.studioSave === 'function') window.studioSave();
    if (typeof window.renderStudio === 'function') window.renderStudio();
  };

  /* ── 영상 프롬프트 탭으로 보내기 (s3-source-tabs.js 연동) ── */
  window.s3PromptOpenVideoTab = function(idx) {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s3 = proj.s3 || {};
    var p = (s3.videoPrompts||[])[idx] || '';
    if (!p && typeof window.s3CompileAllForProject === 'function') {
      var all = window.s3CompileAllForProject({});
      s3.videoPrompts = all.videoPrompts.slice();
      p = s3.videoPrompts[idx] || '';
      if (typeof window.studioSave === 'function') window.studioSave();
    }
    /* 영상 탭으로 전환 — s3-source-tabs.js 의 _s3SetSourceTab 활용 */
    if (typeof window._s3SetSourceTab === 'function') {
      window._s3SetSourceTab('video');
      setTimeout(function(){
        if (typeof ucShowToast === 'function') ucShowToast('🎬 영상 프롬프트 탭으로 이동 — 씬 ' + (idx+1) + ' 프롬프트 사용 가능', 'success');
      }, 200);
    } else {
      alert('영상 프롬프트:\n\n' + p);
    }
  };

  /* ── 차별성 경고 (전역) ── */
  window.s3PromptDiversityCheck = function() {
    var proj = (window.STUDIO && window.STUDIO.project) || {};
    var s3 = proj.s3 || {};
    var sim = pairwiseSimilarityWarn(s3.imagePrompts || s3.prompts || []);
    return sim;
  };

  /* ════════════════════════════════════════════════
     CSS — HUD 스타일
     ════════════════════════════════════════════════ */
  function _injectHudCSS() {
    if (document.getElementById('s3-hud-style')) return;
    var st = document.createElement('style');
    st.id = 's3-hud-style';
    st.textContent =
      '.s3-hud-wrap{margin-top:8px;display:flex;flex-direction:column;gap:6px}' +
      '.s3-hud-card{border:1px solid;border-radius:10px;padding:8px 10px}' +
      '.s3-hud-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}' +
      '.s3-hud-score{font-size:14px;font-weight:900;min-width:42px}' +
      '.s3-hud-tier{font-size:12px;font-weight:800}' +
      '.s3-hud-mini{margin-left:auto;border:none;background:transparent;cursor:pointer;font-size:14px;padding:2px 6px;border-radius:6px}' +
      '.s3-hud-mini:hover{background:rgba(0,0,0,.06)}' +
      '.s3-hud-row .s3-hud-mini + .s3-hud-mini{margin-left:0}' +
      '.s3-hud-miss{margin-top:4px;font-size:11px;color:#7b4040;line-height:1.4}' +
      '.s3-hud-empty{border:1.5px dashed #d4d0e2;background:#fff;color:#7b6f88;border-radius:10px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer;text-align:left}' +
      '.s3-hud-empty:hover{border-color:#9181ff;color:#9181ff}' +
      '.s3-hud-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:2px}' +
      '.s3-hud-act{flex:1;min-width:140px;padding:6px 12px;border:1.5px solid var(--line);background:#fff;border-radius:999px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit;color:#5b1a4a}' +
      '.s3-hud-act:hover{background:linear-gradient(135deg,#fff5fa,#f5f0ff);border-color:#9181ff}' +
      '';
    document.head.appendChild(st);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _injectHudCSS);
  else _injectHudCSS();
})();
