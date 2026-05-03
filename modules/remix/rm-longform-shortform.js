/* ================================================
   modules/remix/rm-longform-shortform.js
   롱폼 → 숏폼 추출 모드 UI + 액션
   * Scene 보드의 모드바에 추가될 5번째 모드
   * RM_CORE.project()._longform = { candidates:[], activeId, lastGen }
   * 후보 카드 그리드 + 개별 편집 + Step 2 송신
   ================================================ */
(function(){
  'use strict';

  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function _escAttr(s){ return String(s == null ? '' : s).replace(/"/g,'&quot;').replace(/'/g, "\\'"); }
  function _fmtSec(sec){ var s = Math.max(0, Math.round(+sec || 0)); var m = Math.floor(s/60); var ss = s%60;
    return m+':'+(ss<10?'0'+ss:ss); }
  function _setStatus(text, kind) {
    var p = window.RM_CORE && window.RM_CORE.project();
    if (!p) return;
    p._status = text ? { text: text, kind: kind || 'init' } : null;
    window.RM_CORE.save();
    _re();
  }
  function _re() {
    if (window.RM_BOARD && typeof window.RM_BOARD.render === 'function') window.RM_BOARD.render();
  }

  function _state(p) {
    if (!p._longform) p._longform = { candidates: [], activeId: '', lastGen: 0 };
    return p._longform;
  }

  /* ── 메인 패널 렌더 ── */
  window._rmRenderLongformPanel = function(p) {
    var lf = _state(p);
    var hasCues = (p.transcript && p.transcript.cues && p.transcript.cues.length) ||
                  (p.scenes && p.scenes.length);
    var cands = lf.candidates || [];

    return '<div class="rm-lf-wrap">' +
      '<div class="rm-lf-hd">' +
        '<div class="rm-lf-title">🎯 롱폼 → 숏폼 추출</div>' +
        '<div class="rm-lf-actions">' +
          '<button type="button" class="rm-tb-btn pri" '+(hasCues?'':'disabled')+
            ' onclick="rmLfGenerate(3)">상위 3개 후보 만들기</button>' +
          '<button type="button" class="rm-tb-btn" '+(hasCues?'':'disabled')+
            ' onclick="rmLfGenerate(5)">상위 5개 후보 만들기</button>' +
        '</div>' +
      '</div>' +
      '<div class="rm-lf-help">' +
        '긴 영상의 자막/대본에서 15~60초짜리 숏츠 후보를 자동으로 찾아 점수화합니다. ' +
        '먼저 자막/대본을 붙여넣고 "🪄 장면 분리" 를 눌러 cues 를 만들어 주세요.' +
      '</div>' +
      (cands.length
        ? _renderCandidateGrid(p, lf, cands)
        : (hasCues
            ? '<div class="rm-lf-empty">▶ "상위 N 개 후보 만들기" 를 누르면 자동으로 후보가 생성됩니다.</div>'
            : '<div class="rm-lf-empty">⚠️ cues 가 없습니다. 자막/대본을 먼저 붙여넣고 장면 분리를 실행하세요.</div>')) +
    '</div>';
  };

  function _renderCandidateGrid(p, lf, cands) {
    return '<div class="rm-lf-cards">' +
      cands.map(function(c){ return _renderCandidateCard(c, c.candidateId === lf.activeId); }).join('') +
    '</div>';
  }
  function _renderCandidateCard(c, active) {
    var statusCls = c.score >= 85 ? 'good' : c.score >= 70 ? 'ok' : c.score >= 60 ? 'warn' : 'bad';
    return '<div class="rm-lf-card '+statusCls+(active?' active':'')+'">' +
      '<div class="rm-lf-card-hd">' +
        '<span class="rm-lf-type">'+_esc(c.type || '하이라이트')+'</span>' +
        '<span class="rm-lf-score">'+c.score+'<small>/100</small></span>' +
        '<span class="rm-lf-label '+statusCls+'">'+_esc(c.label)+'</span>' +
      '</div>' +
      '<div class="rm-lf-time">' +
        '⏱ '+_esc(_fmtSec(c.startSec))+' ~ '+_esc(_fmtSec(c.endSec))+
        ' <small>('+c.durationSec+'s)</small>' +
      '</div>' +
      '<div class="rm-lf-title-cand">'+_esc(c.titleCandidate || '')+'</div>' +
      '<div class="rm-lf-section"><b>훅</b> '+_esc(c.hookText || '')+'</div>' +
      '<div class="rm-lf-section"><b>요약</b> '+_esc(c.summary || '')+'</div>' +
      (c.reason ? '<div class="rm-lf-reason">📝 '+_esc(c.reason)+'</div>' : '') +
      '<div class="rm-lf-card-actions">' +
        '<button class="rm-mini" onclick="rmLfPreview(\''+_escAttr(c.candidateId)+'\')">▶ 미리보기</button>' +
        '<button class="rm-mini" onclick="rmLfEdit(\''+_escAttr(c.candidateId)+'\')">✏️ 편집</button>' +
        '<button class="rm-mini" onclick="rmLfTranslateJa(\''+_escAttr(c.candidateId)+'\')">🇯🇵 일본어 자막</button>' +
        '<button class="rm-mini ok" onclick="rmLfSendToShorts(\''+_escAttr(c.candidateId)+'\')">→ 자동숏츠로 보내기</button>' +
      '</div>' +
      (active ? _renderEditPanel(c) : '') +
    '</div>';
  }

  function _renderEditPanel(c) {
    return '<div class="rm-lf-edit">' +
      '<label class="rm-lf-edit-label">제목 후보</label>' +
      '<input type="text" class="rm-edit-inp" value="'+_escAttr(c.titleCandidate||'')+'" ' +
        'oninput="rmLfEditField(\''+_escAttr(c.candidateId)+'\',\'titleCandidate\',this.value)">' +
      '<label class="rm-lf-edit-label">훅 문장</label>' +
      '<input type="text" class="rm-edit-inp" value="'+_escAttr(c.hookText||'')+'" ' +
        'oninput="rmLfEditField(\''+_escAttr(c.candidateId)+'\',\'hookText\',this.value)">' +
      '<label class="rm-lf-edit-label">시작 시간 (초)</label>' +
      '<input type="number" class="rm-edit-inp" value="'+(+c.startSec||0)+'" min="0" step="0.1" ' +
        'oninput="rmLfEditTime(\''+_escAttr(c.candidateId)+'\',\'startSec\',this.value)">' +
      '<label class="rm-lf-edit-label">끝 시간 (초)</label>' +
      '<input type="number" class="rm-edit-inp" value="'+(+c.endSec||0)+'" min="0" step="0.1" ' +
        'oninput="rmLfEditTime(\''+_escAttr(c.candidateId)+'\',\'endSec\',this.value)">' +
      '<label class="rm-lf-edit-label">자막 (전체)</label>' +
      '<textarea class="rm-ta" rows="3" ' +
        'oninput="rmLfEditField(\''+_escAttr(c.candidateId)+'\',\'transcript\',this.value)">' +
        _esc(c.transcript||'') + '</textarea>' +
      '<div class="rm-lf-edit-actions">' +
        '<button class="rm-mini" onclick="rmLfTone(\''+_escAttr(c.candidateId)+'\',\'shorter\')">⏬ 더 짧게</button>' +
        '<button class="rm-mini" onclick="rmLfTone(\''+_escAttr(c.candidateId)+'\',\'punchy\')">⚡ 더 자극적으로</button>' +
        '<button class="rm-mini" onclick="rmLfTone(\''+_escAttr(c.candidateId)+'\',\'info\')">💡 더 정보형으로</button>' +
        '<button class="rm-mini" onclick="rmLfTone(\''+_escAttr(c.candidateId)+'\',\'emotional\')">💝 더 감동적으로</button>' +
      '</div>' +
    '</div>';
  }

  /* ════════════════════════════════════════════════
     액션
     ════════════════════════════════════════════════ */
  window.rmLfGenerate = function(n) {
    var p = window.RM_CORE.project();
    var GEN = window.RM_LONGFORM_CAND;
    if (!GEN) { _setStatus('❌ RM_LONGFORM_CAND 미로드', 'err'); return; }

    /* 입력 — RM_CORE.scenes 를 cue 로 보거나, transcript.cues */
    var cuesIn = (p.transcript && p.transcript.cues && p.transcript.cues.length)
      ? p.transcript.cues
      : (p.scenes || []);
    if (!cuesIn.length) {
      _setStatus('⚠️ cues 가 없습니다. 자막을 붙여넣고 "🪄 장면 분리" 를 먼저 실행하세요.', 'warn');
      return;
    }
    _setStatus('🔄 후보 생성 중... (target ' + n + ' 개)', 'loading');
    var cands = GEN.generate(cuesIn, { count: n });
    var lf = _state(p);
    lf.candidates = cands;
    lf.activeId = '';
    lf.lastGen = Date.now();
    window.RM_CORE.save();
    if (!cands.length) _setStatus('⚠️ 후보 생성 결과가 비었습니다 (15~60s 윈도우 부족).', 'warn');
    else _setStatus('✅ ' + cands.length + ' 개 후보 생성 — 카드에서 선택하세요.', 'ok');
  };

  window.rmLfPreview = function(id) {
    var p = window.RM_CORE.project();
    var lf = _state(p);
    var c = (lf.candidates || []).find(function(x){ return x.candidateId === id; });
    if (!c) return;
    /* iframe / video seek */
    if (typeof window.rmJump === 'function') window.rmJump(c.startSec);
    /* active 설정 — 편집 패널 펼침 */
    lf.activeId = id;
    window.RM_CORE.save();
    _re();
  };
  window.rmLfEdit = function(id) {
    var p = window.RM_CORE.project();
    var lf = _state(p);
    lf.activeId = lf.activeId === id ? '' : id;
    window.RM_CORE.save();
    _re();
  };
  window.rmLfEditField = function(id, key, val) {
    var p = window.RM_CORE.project();
    var lf = _state(p);
    var c = (lf.candidates || []).find(function(x){ return x.candidateId === id; });
    if (!c) return;
    c[key] = val;
    window.RM_CORE.save();
    /* re-render 안 함 — input focus 유지 */
  };
  window.rmLfEditTime = function(id, key, val) {
    var v = parseFloat(val);
    if (!isFinite(v)) return;
    var p = window.RM_CORE.project();
    var lf = _state(p);
    var c = (lf.candidates || []).find(function(x){ return x.candidateId === id; });
    if (!c) return;
    c[key] = v;
    if (c.endSec > c.startSec) c.durationSec = Math.round(c.endSec - c.startSec);
    window.RM_CORE.save();
  };
  window.rmLfTone = async function(id, variant) {
    var p = window.RM_CORE.project();
    var lf = _state(p);
    var c = (lf.candidates || []).find(function(x){ return x.candidateId === id; });
    if (!c) return;
    var ad = window.YT_REMIX_ADAPTER;
    if (!ad || typeof ad.adaptSceneTone !== 'function') {
      _setStatus('❌ 톤 변형 어댑터 미로드', 'err'); return;
    }
    _setStatus('🔄 ' + variant + ' 톤으로 변환 중...', 'loading');
    try {
      var v = ({ shorter:'shorter', punchy:'comic', info:'natural', emotional:'emotional' })[variant] || 'natural';
      var seed = { adaptedNarration: c.transcript || c.summary, original: c.transcript || c.summary };
      var next = await ad.adaptSceneTone(seed, v, {});
      var newText = (next && next.adaptedNarration) || '';
      if (newText) {
        c.transcript = newText;
        c.summary = newText.slice(0, 100);
        window.RM_CORE.save();
        _setStatus('✅ ' + variant + ' 톤 적용 완료', 'ok');
      } else {
        _setStatus('⚠️ 변형 결과 없음', 'warn');
      }
    } catch (e) {
      _setStatus('❌ 변형 실패: ' + (e && e.message), 'err');
    }
  };
  window.rmLfTranslateJa = async function(id) {
    var p = window.RM_CORE.project();
    var lf = _state(p);
    var c = (lf.candidates || []).find(function(x){ return x.candidateId === id; });
    if (!c) return;
    var ad = window.YT_REMIX_ADAPTER;
    if (!ad || typeof ad.translateCaption !== 'function') {
      _setStatus('❌ 번역 어댑터 미로드', 'err'); return;
    }
    _setStatus('🔄 후보 자막 일본어 번역 중...', 'loading');
    var ok = 0, fail = 0;
    for (var i = 0; i < (c.scenes || []).length; i++) {
      var sc = c.scenes[i];
      var src = sc.originalCaption || sc.editedCaption || '';
      if (!src.trim()) continue;
      try {
        var ja = await ad.translateCaption(src, 'ja', { seniorTone: !!p.seniorTone });
        if (ja) { sc.captionJa = ja; ok++; } else fail++;
      } catch (_) { fail++; }
    }
    window.RM_CORE.save();
    _setStatus('✅ 번역 완료 — 성공 ' + ok + ' / 실패 ' + fail, ok ? 'ok' : 'warn');
  };
  window.rmLfSendToShorts = function(id) {
    var p = window.RM_CORE.project();
    var lf = _state(p);
    var c = (lf.candidates || []).find(function(x){ return x.candidateId === id; });
    if (!c) { _setStatus('⚠️ 후보가 없습니다.', 'warn'); return; }
    if (!window.RM_LONGFORM_EXPORT) {
      _setStatus('❌ RM_LONGFORM_EXPORT 미로드', 'err'); return;
    }
    var r = window.RM_LONGFORM_EXPORT.sendCandidate(c);
    if (r.ok) {
      _setStatus('✅ 핸드오프 완료 — Step 2 로 이동 가능', 'ok');
      /* 사용자가 명시적으로 이동 — 토스트만, 자동 이동 안 함 */
      setTimeout(function(){
        if (confirm('자동숏츠 Step 2 로 지금 이동할까요?')) {
          window.RM_LONGFORM_EXPORT.gotoShortsStep2();
        }
      }, 100);
    }
  };
})();
