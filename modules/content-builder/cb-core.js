/* ================================================
   modules/content-builder/cb-core.js
   콘텐츠 빌더 — 상태 / 저장 / draft / bridge / 공통 유틸
   ================================================ */
(function(){
  'use strict';

  const CB_LS_PROJECT  = 'moca_content_builder_project_v1';
  const CB_LS_RECENT   = 'moca_content_builder_recent_v1';
  const CB_LS_DRAFT    = 'moca_content_builder_draft_v1';
  const CB_LS_LIBRARY  = 'moca_content_builder_library_v1';

  /* ── 상태 ── */
  function cbNewProject() {
    return {
      id:          'cb_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6),
      createdAt:   Date.now(),
      updatedAt:   Date.now(),
      currentTab:  't1',
      goal:        '',
      sourceCategory: '',
      sourceText:  '',
      sourceTitle: '',
      draft:       null,        /* { title, summary, sections, cta, hashtags, imagePrompts, videoPrompts } */
      recipe:      null,        /* { id, label } */
      template:    null,        /* { id, label } */
      blocks:      [],          /* [{ id, type, content, status, slotIds }] */
      slots:       [],          /* [{ id, blockId, type, mode, prompt, status, asset }] */
      style: {
        tone:     '',
        audience: '',
        platform: '',
        imageStyle: '',
        language: 'ko',
        preset:   '',
      },
      brandkit:    null,
      quality:     { score:0, items:{}, issues:[] },
      output:      { copies:{}, exports:{} },
    };
  }

  function _readLS(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(_) { return fallback; }
  }
  function _writeLS(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); }
    catch(e) { console.warn('[cb] LS 저장 실패:', e); }
  }

  /* ── 글로벌 state ── */
  window.contentBuilderProject = window.contentBuilderProject || cbNewProject();

  /* ── 저장 / 불러오기 ── */
  function cbSave() {
    const p = window.contentBuilderProject;
    if (!p) return;
    p.updatedAt = Date.now();
    _writeLS(CB_LS_PROJECT, p);
    /* 최근 작업 목록 갱신 (요약만) */
    const list = _readLS(CB_LS_RECENT, []);
    const summary = {
      id:        p.id,
      title:     p.sourceTitle || p.goal || '(제목 없음)',
      template:  p.template?.label || '',
      recipe:    p.recipe?.label   || '',
      updatedAt: p.updatedAt,
      blocks:    (p.blocks||[]).length,
    };
    /* 빈 프로젝트 누적 방지 — goal/template/sourceText 모두 비면 저장 안 함 */
    if (!p.goal && !p.template && !p.sourceText) {
      _writeLS(CB_LS_RECENT, list);
      return;
    }
    const i = list.findIndex(function(x){ return x.id === p.id; });
    if (i >= 0) list[i] = summary; else list.unshift(summary);
    _writeLS(CB_LS_RECENT, list.slice(0, 30));
  }

  function cbLoadProject(id) {
    const p = _readLS(CB_LS_PROJECT, null);
    if (p && (!id || p.id === id)) return p;
    return null;
  }

  function cbListRecent() {
    return _readLS(CB_LS_RECENT, []);
  }

  function cbDeleteProject(id) {
    const list = cbListRecent().filter(function(x){ return x.id !== id; });
    _writeLS(CB_LS_RECENT, list);
    /* 현재 프로젝트가 그것이면 새로 시작 */
    const p = window.contentBuilderProject;
    if (p && p.id === id) {
      window.contentBuilderProject = cbNewProject();
      _writeLS(CB_LS_PROJECT, window.contentBuilderProject);
    }
  }
  function cbDeleteAllRecent() {
    _writeLS(CB_LS_RECENT, []);
  }

  /* ── draft 처리 (다른 카테고리 → 콘텐츠 빌더) ── */
  function cbLoadDraft() {
    return _readLS(CB_LS_DRAFT, null);
  }
  function cbApplyDraft(draft) {
    if (!draft) return false;
    const p = window.contentBuilderProject || cbNewProject();
    p.sourceCategory = draft.sourceCategory || '';
    p.sourceTitle    = draft.title          || '';
    p.sourceText     = draft.sourceText     || draft.script || '';
    p.draft = {
      title:        draft.title        || '',
      summary:      draft.summary      || '',
      sections:     draft.sections     || [],
      cta:          draft.cta          || '',
      hashtags:     draft.hashtags     || [],
      imagePrompts: draft.imagePrompts || [],
      videoPrompts: draft.videoPrompts || [],
    };
    p.goal = p.goal || (draft.title ? draft.title + ' 으로 콘텐츠 만들기' : '');
    window.contentBuilderProject = p;
    cbSave();
    return true;
  }
  function cbClearDraft() {
    try { localStorage.removeItem(CB_LS_DRAFT); } catch(_) {}
  }

  /* ── 다른 카테고리에서 호출 (showMediaBar/script/shorts 등) ── */
  /* sendToContentBuilder({ sourceCategory, title, sourceText, ... }) */
  function sendToContentBuilder(payload) {
    if (!payload) return;
    _writeLS(CB_LS_DRAFT, payload);
    const url = cbGetMediaBuilderUrl() + '?mode=builder';
    if (typeof window !== 'undefined' && window.location) {
      const yes = (typeof confirm === 'function')
        ? confirm('🎨 콘텐츠 빌더로 이동해서 이 소재로 패키지를 만들까요?')
        : true;
      if (yes) location.href = url;
    }
  }
  function openContentBuilder(query) {
    const url = cbGetMediaBuilderUrl() + '?mode=builder' + (query ? '&' + query : '');
    location.href = url;
  }

  /* ── 경로 보정 — 어떤 깊이의 페이지에서 호출되어도 engines/media/ 로 가도록 ── */
  function cbGetMediaBuilderUrl() {
    const path = (window.location && window.location.pathname) || '/';
    /* 우리는 모든 페이지가 항상 같은 sub-tree 라고 가정하지 않음 */
    /* 1) /index.html (루트) → engines/media/index.html */
    /* 2) /engines/<cat>/index.html → ../media/index.html */
    /* 3) /engines/media/index.html → ./index.html */
    if (/\/engines\/[^/]+\//.test(path)) {
      if (/\/engines\/media\//.test(path)) return 'index.html';
      return '../media/index.html';
    }
    return 'engines/media/index.html';
  }

  /* ── 기존 image 엔진 wrapper (보존용) ── */
  function openImageEngine(args) {
    if (typeof window.openImageEngine === 'function' && window.openImageEngine !== openImageEngine) {
      try { return window.openImageEngine(args); } catch(_) {}
    }
    /* fallback: 콘텐츠 빌더로 이동 */
    sendToContentBuilder(args || {});
  }
  function sendToImageEngine(args) {
    if (typeof window.sendToImageEngine === 'function' && window.sendToImageEngine !== sendToImageEngine) {
      try { return window.sendToImageEngine(args); } catch(_) {}
    }
    sendToContentBuilder(args || {});
  }

  /* ── 공통 유틸 ── */
  function cbEsc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  /* ── 품질 점수 계산 (cb-output.js 가 호출) ── */
  function cbCalcQuality(p) {
    p = p || window.contentBuilderProject || {};
    const items = {
      title:    0,
      body:     0,
      platform: 0,
      tone:     0,
      hashtags: 0,
      slots:    0,
      blocks:   0,
    };
    const issues = [];

    /* 제목 */
    if (p.sourceTitle && p.sourceTitle.length >= 6) items.title = 100;
    else if (p.sourceTitle) { items.title = 60; issues.push('제목이 너무 짧아요 (6자 이상 권장)'); }
    else { issues.push('제목이 없습니다'); }

    /* 본문 */
    const bodyLen = (p.sourceText || '').length
      + (p.blocks || []).reduce(function(a, b){ return a + (b && b.content ? String(b.content).length : 0); }, 0);
    if (bodyLen >= 200) items.body = 100;
    else if (bodyLen >= 80) { items.body = 70; issues.push('본문이 짧아요 (200자 이상 권장)'); }
    else { items.body = 30; issues.push('본문이 거의 없습니다'); }

    /* 플랫폼 */
    if (p.style && p.style.platform) items.platform = 100;
    else { items.platform = 0; issues.push('플랫폼을 선택하세요'); }

    /* 문체 */
    if (p.style && p.style.tone) items.tone = 100;
    else { items.tone = 0; issues.push('문체를 선택하세요'); }

    /* 해시태그 */
    const hash = (p.draft && p.draft.hashtags) || [];
    if (hash.length >= 3) items.hashtags = 100;
    else if (hash.length > 0) { items.hashtags = 60; issues.push('해시태그가 부족해요 (3개 이상 권장)'); }
    else { items.hashtags = 30; issues.push('해시태그가 없습니다'); }

    /* 미디어 슬롯 */
    const slots = p.slots || [];
    if (slots.length === 0) { items.slots = 60; }
    else {
      const ready = slots.filter(function(s){ return s && s.status === 'ready'; }).length;
      items.slots = Math.round(ready / slots.length * 100);
    }

    /* 블록 */
    if ((p.blocks || []).length >= 4) items.blocks = 100;
    else if ((p.blocks || []).length > 0) { items.blocks = 60; }
    else { items.blocks = 30; issues.push('블록이 없습니다 — 템플릿을 적용하세요'); }

    /* 종합 점수 */
    const keys = Object.keys(items);
    const sum = keys.reduce(function(a, k){ return a + items[k]; }, 0);
    const score = Math.round(sum / keys.length);
    return { score: score, items: items, issues: issues };
  }

  /* ── 자동 부팅: 저장된 프로젝트 복원 ── */
  function _autoLoadCurrent() {
    const saved = _readLS(CB_LS_PROJECT, null);
    if (saved && saved.id) {
      /* 호환: blocks/slots 누락 보정 */
      saved.blocks = saved.blocks || [];
      saved.slots  = saved.slots  || [];
      saved.style  = saved.style  || cbNewProject().style;
      saved.quality= saved.quality|| { score:0, items:{}, issues:[] };
      window.contentBuilderProject = saved;
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _autoLoadCurrent);
  } else {
    _autoLoadCurrent();
  }

  /* ── 공개 API ── */
  window.cbCore = {
    cbNewProject:      cbNewProject,
    cbSave:            cbSave,
    cbLoadProject:     cbLoadProject,
    cbListRecent:      cbListRecent,
    cbDeleteProject:   cbDeleteProject,
    cbDeleteAllRecent: cbDeleteAllRecent,
    cbLoadDraft:       cbLoadDraft,
    cbApplyDraft:      cbApplyDraft,
    cbClearDraft:      cbClearDraft,
    cbCalcQuality:     cbCalcQuality,
    cbEsc:             cbEsc,
    cbGetMediaBuilderUrl: cbGetMediaBuilderUrl,
    sendToContentBuilder: sendToContentBuilder,
    openContentBuilder:   openContentBuilder,
    LS: { project: CB_LS_PROJECT, recent: CB_LS_RECENT, draft: CB_LS_DRAFT, library: CB_LS_LIBRARY },
  };
  /* 전역 짧은 alias (다른 카테고리에서 호출하기 쉽게) */
  window.cbNewProject       = cbNewProject;
  window.cbSave             = cbSave;
  window.cbLoadDraft        = cbLoadDraft;
  window.cbApplyDraft       = cbApplyDraft;
  window.cbCalcQuality      = cbCalcQuality;
  window.cbEsc              = cbEsc;
  window.cbGetMediaBuilderUrl = cbGetMediaBuilderUrl;
  window.sendToContentBuilder = sendToContentBuilder;
  window.openContentBuilder   = openContentBuilder;
  /* image engine wrapper — 기존 함수가 있으면 위임, 없으면 콘텐츠 빌더 */
  if (typeof window.openImageEngine !== 'function') window.openImageEngine = openImageEngine;
  if (typeof window.sendToImageEngine !== 'function') window.sendToImageEngine = sendToImageEngine;
})();
