/* ================================================
   modules/studio/s4-magiclight-panel.js
   Step 4 — Magiclight 영상 생성 패널

   * 외부에서 호출: window.s4mlRenderPanel(hostId)
   * 모드: story_to_video / scene_text_to_video / image_to_video
   * 씬별 카드: 상태 / payload preview / 생성 / 결과 / 채택 / 다시 생성
   * 순차 생성 (병렬 X) — credit 낭비 방지
   ================================================ */
(function(){
  'use strict';

  var S4ML_MODES = [
    { id:'scene_text_to_video', label:'씬별 텍스트→영상', desc:'기존 음성/자막/편집 흐름과 가장 호환 (추천)' },
    { id:'image_to_video',      label:'씬별 이미지→영상', desc:'Step 2에서 채택한 이미지를 움직이는 영상으로' },
    { id:'story_to_video',      label:'전체 영상 (스토리)', desc:'대본 전체를 한 번에 — credit 많이 사용' },
  ];

  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  function _toast(msg, kind) {
    if (typeof window.ucShowToast === 'function') window.ucShowToast(msg, kind || 'info');
    else try { console.debug('[s4ml]', msg); } catch(_) {}
  }

  /* 키 + endpoint 상태 점검 */
  function _statusBadge() {
    var hasFn = typeof window.getMagiclightProviderConfig === 'function';
    if (!hasFn) return { kind:'err', text:'⚠️ adapter 미로드' };
    var cfg = window.getMagiclightProviderConfig();
    if (!cfg.apiKey) return { kind:'warn', text:'⚠️ API 키 없음 — 통합 API 설정에서 등록' };
    if (typeof window._magiclightEndpointsConfigured === 'function' && !window._magiclightEndpointsConfigured(cfg)) {
      return { kind:'warn', text:'⚠️ Magiclight API endpoint 미설정 — payload preview 만 가능 (공식 문서 확인 후 입력)' };
    }
    return { kind:'ok', text:'✅ 키 + endpoint 준비됨' };
  }

  /* ════════════════════════════════════════════════
     메인 렌더
     ════════════════════════════════════════════════ */
  window.s4mlRenderPanel = function(hostId) {
    _injectCSS();
    var host = document.getElementById(hostId || 's4-magiclight-host');
    if (!host) {
      try { console.debug('[s4ml] host not found:', hostId); } catch(_) {}
      return;
    }
    var ml = (typeof window.mljEnsureRoot === 'function') ? window.mljEnsureRoot() : null;
    if (!ml) { host.innerHTML = '<div class="s4ml-warn">⚠️ s4-magiclight-jobs.js 미로드</div>'; return; }

    var status = _statusBadge();
    var scenes = (typeof window.resolveStudioScenes === 'function') ? window.resolveStudioScenes()
               : (((window.STUDIO && window.STUDIO.project && window.STUDIO.project.scenes) || []));
    var sumCredits = (typeof window.mljSumCredits === 'function') ? window.mljSumCredits() : null;

    var modeBtns = S4ML_MODES.map(function(m){
      var on = ml.selectedMode === m.id;
      return '<button type="button" class="s4ml-mode-btn '+(on?'on':'')+'" '+
        'onclick="s4mlSetMode(\''+m.id+'\')" title="'+_esc(m.desc)+'">'+_esc(m.label)+'</button>';
    }).join('');

    var bodyHtml = '';
    if (ml.selectedMode === 'story_to_video') {
      bodyHtml = _renderStoryBody(ml, scenes);
    } else {
      bodyHtml = _renderSceneJobsBody(ml, scenes);
    }

    host.innerHTML =
      '<div class="s4ml-wrap">' +
        '<div class="s4ml-hd">'+
          '<div class="s4ml-title">🎬 Magiclight 영상 생성 <span class="s4ml-badge">실험적</span></div>'+
          '<div class="s4ml-status '+status.kind+'">'+_esc(status.text)+'</div>'+
        '</div>'+
        '<div class="s4ml-mode-row">'+modeBtns+'</div>'+
        '<div class="s4ml-mode-desc">'+_esc((S4ML_MODES.find(function(m){return m.id===ml.selectedMode;})||{}).desc||'')+'</div>'+
        '<div class="s4ml-cost">💵 ' + (sumCredits != null ? '사용된 credit: '+sumCredits : '비용 정보: 공식 API 응답 확인 시 표시') + '</div>'+
        bodyHtml +
        _renderProviderActions() +
      '</div>';
  };

  function _renderProviderActions() {
    return '<div class="s4ml-actions">'+
      '<button type="button" class="s4ml-btn" onclick="s4mlOpenSettings()">🔑 통합 API 설정</button>'+
      '<button type="button" class="s4ml-btn" onclick="s4mlTestConnection()">🔌 연결 테스트</button>'+
    '</div>';
  }

  /* ── story 모드 ── */
  function _renderStoryBody(ml, scenes) {
    var story = ml.storyJob || {};
    var payload = (typeof window.buildMagiclightPayloadFromProject === 'function')
                ? window.buildMagiclightPayloadFromProject('story_to_video') : null;
    return '<div class="s4ml-section">'+
      '<div class="s4ml-section-hd">📖 전체 영상 (스토리)</div>'+
      '<div class="s4ml-info">씬 '+scenes.length+'개를 한 번에 영상으로 생성합니다.</div>'+
      '<div class="s4ml-actions">'+
        '<button type="button" class="s4ml-btn" onclick="s4mlPreviewPayload(\'story_to_video\', null)">📋 payload 미리보기</button>'+
        '<button type="button" class="s4ml-btn pri" onclick="s4mlGenerateStory()">▶ 전체 영상 생성</button>'+
      '</div>'+
      (story.status ? '<div class="s4ml-job">상태: '+_esc(story.status)+(story.error?(' / 오류: '+_esc(story.error)):'')+'</div>' : '')+
      (story.result && story.result.videoUrl ? _renderResultCard(-1, story) : '')+
    '</div>';
  }

  /* ── 씬별 모드 ── */
  function _renderSceneJobsBody(ml, scenes) {
    if (!scenes.length) {
      return '<div class="s4ml-warn">⚠️ 씬이 없습니다. Step 1 대본 또는 Step 2 프롬프트 컴파일을 먼저 실행해주세요.</div>';
    }
    var cards = scenes.map(function(sc, i){
      var job = (typeof window.mljGetJob === 'function') ? window.mljGetJob(i) : null;
      var status = job ? job.status : 'idle';
      var statusClass = ({ succeeded:'ok', running:'loading', queued:'loading', failed:'err', cancelled:'warn' }[status]) || 'idle';
      var modeLabel = ml.selectedMode === 'image_to_video' ? '🖼→🎬' : '📝→🎬';
      return '<div class="s4ml-scene-card">'+
        '<div class="s4ml-scene-hd">'+
          '<span class="s4ml-scene-no">씬 '+(sc.sceneNumber || (i+1))+'</span>'+
          '<span class="s4ml-scene-role">'+_esc(sc.role || sc.roleLabel || '')+'</span>'+
          '<span class="s4ml-scene-mode">'+modeLabel+'</span>'+
          '<span class="s4ml-scene-status '+statusClass+'">'+_esc(_statusLabel(status))+'</span>'+
        '</div>'+
        '<div class="s4ml-scene-narr">'+_esc((sc.narration || sc.visualDescription || '').slice(0, 80))+'</div>'+
        (job && job.error ? '<div class="s4ml-scene-error">❌ '+_esc(job.error)+'</div>' : '')+
        (job && job.result && job.result.videoUrl ? _renderResultCard(i, job) : '')+
        '<div class="s4ml-scene-actions">'+
          '<button type="button" class="s4ml-btn xs" onclick="s4mlPreviewPayload(\''+ml.selectedMode+'\','+i+')">📋 payload</button>'+
          '<button type="button" class="s4ml-btn xs pri" onclick="s4mlGenerateScene('+i+')">'+(job && job.status==='succeeded'?'🔄 다시':'▶ 이 씬 생성')+'</button>'+
          (job && job.result && job.result.videoUrl ? '<button type="button" class="s4ml-btn xs" onclick="s4mlAdoptScene('+i+')">✅ 채택</button>' : '')+
          (job ? '<button type="button" class="s4ml-btn xs ghost" onclick="s4mlClearScene('+i+')">🗑 삭제</button>' : '')+
        '</div>'+
      '</div>';
    }).join('');
    return '<div class="s4ml-section">'+
      '<div class="s4ml-section-hd">🎞 씬별 작업</div>'+
      '<div class="s4ml-actions">'+
        '<button type="button" class="s4ml-btn pri" onclick="s4mlGenerateAllSequential()">⚡ 전체 씬 순차 생성</button>'+
        '<button type="button" class="s4ml-btn" onclick="s4mlRefreshAll()">🔄 상태 새로고침</button>'+
      '</div>'+
      '<div class="s4ml-scenes">'+cards+'</div>'+
    '</div>';
  }

  function _renderResultCard(sceneIndex, job) {
    var r = job.result || {};
    var label = sceneIndex < 0 ? '전체 영상' : ('씬 '+(sceneIndex+1));
    return '<div class="s4ml-result">'+
      '<video src="'+_esc(r.videoUrl)+'" controls preload="none" '+(r.thumbUrl?'poster="'+_esc(r.thumbUrl)+'"':'')+'></video>'+
      '<div class="s4ml-result-meta">'+_esc(label)+' · '+(r.durationSec||0)+'s · '+(r.width||0)+'×'+(r.height||0)+
        (r.creditsUsed != null ? ' · credit '+r.creditsUsed : '')+'</div>'+
    '</div>';
  }

  function _statusLabel(s) {
    return ({ idle:'⬜ 미생성', queued:'⏳ 대기', running:'⏳ 생성중', succeeded:'✅ 완료', failed:'❌ 실패', cancelled:'⊘ 취소' })[s] || s;
  }

  /* ════════════════════════════════════════════════
     액션
     ════════════════════════════════════════════════ */
  window.s4mlSetMode = function(mode) {
    if (typeof window.mljSetMode === 'function') window.mljSetMode(mode);
    s4mlRenderPanel();
  };

  window.s4mlOpenSettings = function() {
    if (typeof window.openApiSettingsModal === 'function') window.openApiSettingsModal('video');
    else if (typeof window.renderApiSettings === 'function') { window._mocaApiActiveTab = 'video'; window.renderApiSettings(); }
  };

  window.s4mlTestConnection = async function() {
    if (typeof window.testMagiclightConnection !== 'function') { _toast('⚠️ adapter 미로드', 'warn'); return; }
    _toast('🔌 연결 테스트 중...', 'info');
    var res = await window.testMagiclightConnection();
    if (res.ok) _toast('✅ 연결 OK (HTTP '+res.status+')', 'success');
    else _toast('⚠️ '+(res.reason||'테스트 실패'), 'warn');
  };

  window.s4mlPreviewPayload = function(mode, sceneIndex) {
    if (typeof window.buildMagiclightPayloadFromProject !== 'function') { _toast('⚠️ adapter 미로드', 'warn'); return; }
    var p = window.buildMagiclightPayloadFromProject(mode, sceneIndex);
    if (!p) { _toast('⚠️ payload 를 만들 수 없습니다 (씬/대본 데이터 부족)', 'warn'); return; }
    _openPayloadModal(mode, sceneIndex, p);
  };

  function _openPayloadModal(mode, sceneIndex, payload) {
    var existing = document.getElementById('s4ml-payload-modal');
    if (existing) existing.remove();
    var jsonStr = JSON.stringify(payload, null, 2);
    var label = sceneIndex == null || sceneIndex < 0 ? '전체' : ('씬 '+(sceneIndex+1));
    var div = document.createElement('div');
    div.id = 's4ml-payload-modal';
    div.innerHTML =
      '<div class="s4ml-modal-bd" onclick="(function(e){if(e.target.classList.contains(\'s4ml-modal-bd\'))s4mlCloseModal();})(event)">'+
        '<div class="s4ml-modal">'+
          '<div class="s4ml-modal-hd">📋 '+label+' payload ('+mode+')'+
            '<button type="button" class="s4ml-modal-x" onclick="s4mlCloseModal()">✕</button>'+
          '</div>'+
          '<pre class="s4ml-modal-body">'+_esc(jsonStr)+'</pre>'+
          '<div class="s4ml-modal-actions">'+
            '<button type="button" class="s4ml-btn" onclick="navigator.clipboard.writeText('+JSON.stringify(jsonStr)+');window.ucShowToast&&window.ucShowToast(\'✅ JSON 복사\',\'success\')">📋 JSON 복사</button>'+
            '<button type="button" class="s4ml-btn" onclick="s4mlCloseModal()">닫기</button>'+
          '</div>'+
        '</div>'+
      '</div>';
    document.body.appendChild(div);
  }
  window.s4mlCloseModal = function() {
    var el = document.getElementById('s4ml-payload-modal'); if (el) el.remove();
  };

  /* ── 생성 (씬별) ── */
  window.s4mlGenerateScene = async function(sceneIndex) {
    if (typeof window.createMagiclightJob !== 'function' || typeof window.buildMagiclightPayloadFromProject !== 'function') {
      _toast('⚠️ adapter 미로드', 'warn'); return;
    }
    var ml = window.mljEnsureRoot();
    var mode = (ml.selectedMode === 'story_to_video') ? 'scene_text_to_video' : ml.selectedMode;
    var payload = window.buildMagiclightPayloadFromProject(mode, sceneIndex);
    if (!payload) { _toast('⚠️ payload 부족 — 씬 데이터를 확인해주세요', 'warn'); return; }
    if (mode === 'image_to_video' && !payload.imageUrl) {
      _toast('⚠️ 채택된 이미지가 없습니다 — Step 2 에서 먼저 이미지를 채택해주세요', 'warn'); return;
    }
    if (!confirm('씬 '+(sceneIndex+1)+' 영상 생성 요청 — Magiclight credit 이 사용될 수 있습니다. 계속할까요?')) return;
    window.mljUpsertJob(sceneIndex, { mode: mode, status: 'queued', requestPayload: payload, error: '' });
    s4mlRenderPanel();
    var res = await window.createMagiclightJob(payload);
    if (!res.ok) {
      window.mljUpsertJob(sceneIndex, { status: res.dryRun ? 'idle' : 'failed', error: res.reason || '' });
      _toast(res.dryRun ? ('ℹ️ '+res.reason) : ('❌ '+res.reason), res.dryRun?'info':'error');
      s4mlRenderPanel();
      return;
    }
    window.mljUpsertJob(sceneIndex, { status: 'running', jobId: res.jobId });
    s4mlRenderPanel();
    var poll = await window.pollMagiclightJob(res.jobId, { maxAttempts: 60, intervalMs: 4000 });
    if (poll.ok && poll.normalized) {
      window.mljUpsertJob(sceneIndex, { status: poll.normalized.status, result: poll.normalized, resultRaw: poll.raw });
      _toast(poll.normalized.status === 'succeeded' ? ('✅ 씬 '+(sceneIndex+1)+' 영상 완료') : ('⚠️ 씬 '+(sceneIndex+1)+' 상태: '+poll.normalized.status), poll.normalized.status==='succeeded'?'success':'warn');
    } else {
      window.mljUpsertJob(sceneIndex, { status: 'failed', error: poll.reason || 'unknown' });
      _toast('❌ '+(poll.reason || 'polling 실패'), 'error');
    }
    s4mlRenderPanel();
  };

  window.s4mlGenerateStory = async function() {
    if (typeof window.createMagiclightJob !== 'function') { _toast('⚠️ adapter 미로드', 'warn'); return; }
    var payload = window.buildMagiclightPayloadFromProject('story_to_video');
    if (!payload) { _toast('⚠️ payload 부족 — 대본을 확인해주세요', 'warn'); return; }
    if (!confirm('전체 스토리 영상 생성 — credit 많이 사용됩니다. 계속할까요?')) return;
    var ml = window.mljEnsureRoot();
    ml.storyJob = { status:'queued', requestPayload: payload, error:'', result:{} };
    if (typeof window.studioSave === 'function') window.studioSave();
    s4mlRenderPanel();
    var res = await window.createMagiclightJob(payload);
    if (!res.ok) {
      ml.storyJob.status = res.dryRun ? 'idle' : 'failed'; ml.storyJob.error = res.reason || '';
      _toast(res.dryRun ? ('ℹ️ '+res.reason) : ('❌ '+res.reason), res.dryRun?'info':'error');
      s4mlRenderPanel(); return;
    }
    ml.storyJob.jobId = res.jobId; ml.storyJob.status = 'running';
    s4mlRenderPanel();
    var poll = await window.pollMagiclightJob(res.jobId, { maxAttempts: 90, intervalMs: 6000 });
    if (poll.ok && poll.normalized) {
      ml.storyJob.status = poll.normalized.status;
      ml.storyJob.result = poll.normalized;
      _toast(poll.normalized.status === 'succeeded' ? '✅ 전체 영상 완료' : ('⚠️ 상태: '+poll.normalized.status));
    } else {
      ml.storyJob.status = 'failed'; ml.storyJob.error = poll.reason || 'unknown';
      _toast('❌ '+(poll.reason || 'polling 실패'), 'error');
    }
    if (typeof window.studioSave === 'function') window.studioSave();
    s4mlRenderPanel();
  };

  window.s4mlGenerateAllSequential = async function() {
    var scenes = (typeof window.resolveStudioScenes === 'function') ? window.resolveStudioScenes() : [];
    if (!scenes.length) { _toast('⚠️ 씬 없음', 'warn'); return; }
    if (!confirm(scenes.length+'개 씬을 순차 생성합니다. 실패한 씬은 나중에 다시 생성할 수 있습니다. 계속할까요?')) return;
    for (var i = 0; i < scenes.length; i++) {
      await window.s4mlGenerateScene(i);
    }
  };

  window.s4mlRefreshAll = async function() {
    var ml = window.mljEnsureRoot();
    var pending = ml.jobs.filter(function(j){ return j.status === 'running' || j.status === 'queued'; });
    if (!pending.length) { _toast('진행 중인 작업이 없습니다.', 'info'); return; }
    for (var i = 0; i < pending.length; i++) {
      var j = pending[i];
      if (!j.jobId) continue;
      var res = await window.getMagiclightJobResult(j.jobId);
      if (res.ok && res.normalized) {
        window.mljUpsertJob(j.sceneIndex, { status: res.normalized.status, result: res.normalized, resultRaw: res.raw });
      }
    }
    s4mlRenderPanel();
  };

  window.s4mlAdoptScene = function(sceneIndex) {
    if (typeof window.mljAdoptResult !== 'function') { _toast('⚠️ jobs 모듈 미로드', 'warn'); return; }
    var ok = window.mljAdoptResult(sceneIndex);
    if (ok) _toast('✅ 씬 '+(sceneIndex+1)+' 영상 채택 — 편집 단계 videoSource 로 연결됨', 'success');
    else _toast('⚠️ 채택할 결과가 없습니다', 'warn');
    s4mlRenderPanel();
  };

  window.s4mlClearScene = function(sceneIndex) {
    if (!confirm('씬 '+(sceneIndex+1)+' 작업을 삭제할까요?')) return;
    if (typeof window.mljClearJob === 'function') window.mljClearJob(sceneIndex);
    s4mlRenderPanel();
  };

  /* ── CSS ── */
  function _injectCSS() {
    if (document.getElementById('s4ml-style')) return;
    var st = document.createElement('style');
    st.id = 's4ml-style';
    st.textContent = ''+
'.s4ml-wrap{display:flex;flex-direction:column;gap:10px;padding:12px;background:#fafafe;border-radius:14px;border:1.5px solid #ece6f5}'+
'.s4ml-hd{display:flex;align-items:center;gap:10px;flex-wrap:wrap}'+
'.s4ml-title{font-size:14px;font-weight:900;color:#5b1a4a;flex:1}'+
'.s4ml-badge{font-size:10px;padding:2px 8px;background:#fef3c7;color:#92400e;border-radius:20px;font-weight:700}'+
'.s4ml-status{font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px}'+
'.s4ml-status.ok{background:#dcfce7;color:#166534}'+
'.s4ml-status.warn{background:#fef3c7;color:#92400e}'+
'.s4ml-status.err{background:#fee2e2;color:#991b1b}'+
'.s4ml-status.idle{background:#f6eef3;color:#7b7077}'+
'.s4ml-mode-row{display:flex;gap:6px;flex-wrap:wrap}'+
'.s4ml-mode-btn{padding:7px 14px;border:1.5px solid #f1dce7;background:#fff;border-radius:10px;font-size:11.5px;font-weight:800;color:#5a4a56;cursor:pointer;font-family:inherit}'+
'.s4ml-mode-btn:hover{border-color:#9181ff;color:#9181ff}'+
'.s4ml-mode-btn.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent}'+
'.s4ml-mode-desc{font-size:11px;color:#7b6080;background:#fff;padding:6px 10px;border-radius:8px;border:1px solid #f1dce7}'+
'.s4ml-cost{font-size:10.5px;color:#92400e;background:#fef9e7;padding:5px 10px;border-radius:8px;font-weight:700}'+
'.s4ml-section{background:#fff;border:1.5px solid #f1dce7;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:8px}'+
'.s4ml-section-hd{font-size:12px;font-weight:800;color:#5b1a4a}'+
'.s4ml-info{font-size:11px;color:#7b6080}'+
'.s4ml-warn{padding:10px 12px;background:#fef3c7;color:#92400e;border:1px solid #fcd34d;border-radius:10px;font-size:11.5px;font-weight:700}'+
'.s4ml-actions{display:flex;gap:6px;flex-wrap:wrap}'+
'.s4ml-btn{padding:6px 12px;border:1.5px solid #f1dce7;background:#fff;color:#5a4a56;border-radius:8px;font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit}'+
'.s4ml-btn:hover:not(:disabled){border-color:#9181ff;color:#9181ff}'+
'.s4ml-btn.pri{border:none;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff}'+
'.s4ml-btn.pri:hover{opacity:.92;color:#fff}'+
'.s4ml-btn.xs{padding:4px 10px;font-size:10.5px}'+
'.s4ml-btn.ghost{background:transparent;border-color:transparent;color:#9b8a93}'+
'.s4ml-scenes{display:flex;flex-direction:column;gap:6px}'+
'.s4ml-scene-card{border:1.5px solid #f1dce7;border-radius:10px;padding:8px 10px;background:#fafafe;display:flex;flex-direction:column;gap:6px}'+
'.s4ml-scene-hd{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'+
'.s4ml-scene-no{font-weight:800;color:#2b2430}'+
'.s4ml-scene-role{padding:2px 7px;background:#f5f0ff;color:#5a4a8a;border-radius:6px;font-size:10px;font-weight:700}'+
'.s4ml-scene-mode{font-size:10px;color:#9b8a93}'+
'.s4ml-scene-status{margin-left:auto;font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:20px}'+
'.s4ml-scene-status.ok{background:#dcfce7;color:#166534}'+
'.s4ml-scene-status.loading{background:#eef5ff;color:#2b66c4}'+
'.s4ml-scene-status.err{background:#fee2e2;color:#991b1b}'+
'.s4ml-scene-status.warn{background:#fef3c7;color:#92400e}'+
'.s4ml-scene-status.idle{background:#f6eef3;color:#7b7077}'+
'.s4ml-scene-narr{font-size:11px;color:#5a4a56;line-height:1.4}'+
'.s4ml-scene-error{font-size:10.5px;color:#991b1b;background:#fee2e2;padding:4px 8px;border-radius:6px}'+
'.s4ml-scene-actions{display:flex;gap:4px;flex-wrap:wrap}'+
'.s4ml-result{display:flex;flex-direction:column;gap:4px}'+
'.s4ml-result video{width:100%;max-width:320px;border-radius:8px;background:#0e0e1a}'+
'.s4ml-result-meta{font-size:10.5px;color:#7b6080}'+
'.s4ml-job{font-size:11px;color:#5a4a56;background:#f6eef3;padding:5px 10px;border-radius:6px}'+
/* modal */
'.s4ml-modal-bd{position:fixed;inset:0;background:rgba(20,15,30,.72);z-index:9998;display:flex;align-items:center;justify-content:center;padding:18px}'+
'.s4ml-modal{background:#fff;border-radius:14px;max-width:760px;width:100%;max-height:82vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.4)}'+
'.s4ml-modal-hd{padding:10px 14px;border-bottom:1px solid #f1dce7;font-weight:800;color:#5b1a4a;display:flex;align-items:center;gap:8px}'+
'.s4ml-modal-x{margin-left:auto;border:none;background:transparent;font-size:18px;cursor:pointer;color:#5a4a56}'+
'.s4ml-modal-body{padding:12px 14px;font-family:monospace;font-size:11px;background:#fafafe;overflow:auto;max-height:52vh;white-space:pre-wrap;word-break:break-word;margin:0}'+
'.s4ml-modal-actions{padding:10px 14px;display:flex;gap:6px;justify-content:flex-end;border-top:1px solid #f1dce7}'+
'';
    document.head.appendChild(st);
  }
})();
