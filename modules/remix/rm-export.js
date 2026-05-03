/* ================================================
   modules/remix/rm-export.js
   영상 리믹스 스튜디오 — 출력 (SRT / TXT / JSON / 자동숏츠)
   * 일본어 SRT, 한국어 SRT, 한일 TXT, 일본어 TXT, 한국어 TXT, JSON
   * 자동숏츠 보내기 — YT_BRIDGE.bridgeToStep2 재사용 + sourceType 명시
   ================================================ */
(function(){
  'use strict';

  function _toast(msg, kind){
    if (typeof window.ucShowToast === 'function') window.ucShowToast(msg, kind || 'info');
  }
  function _pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
  function _toSrtTime(sec) {
    var s = Math.max(0, +sec || 0);
    var h = Math.floor(s/3600); s -= h*3600;
    var m = Math.floor(s/60);   s -= m*60;
    var ss = Math.floor(s);
    var ms = Math.round((s - ss) * 1000);
    return _pad(h,2)+':'+_pad(m,2)+':'+_pad(ss,2)+','+_pad(ms,3);
  }
  function _download(name, content, mime) {
    var blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ try { URL.revokeObjectURL(url); document.body.removeChild(a); } catch(_){} }, 0);
  }
  function _baseName() {
    var p = window.RM_CORE.project();
    var t = (p.source && (p.source.title || p.source.videoId || p.source.fileName)) || 'remix';
    return String(t).replace(/[^A-Za-z0-9_\-가-힣]/g, '_').slice(0, 60) || 'remix';
  }

  /* lang: 'ko' | 'ja' | 'both' */
  function _captionFor(sc, lang) {
    var ko = sc.editedCaption || sc.originalCaption || '';
    var ja = sc.captionJa || '';
    if (lang === 'ja')   return ja;
    if (lang === 'both') return [ko, ja].filter(Boolean).join('\n');
    return ko;
  }

  /* ── 출력 대상 (활성 + 선택된 씬) ── */
  function _exportable(opts) {
    opts = opts || {};
    var p = window.RM_CORE.project();
    return (p.scenes || []).filter(function(sc){
      if (sc.deleted) return false;
      if (opts.selectedOnly && sc.selected === false) return false;
      return true;
    });
  }

  function downloadSrt(lang, opts) {
    lang = /^(ko|ja|both)$/.test(lang || '') ? lang : 'ja';
    var rows = _exportable(opts).map(function(sc){
      return { startSec: sc.startSec || 0, endSec: sc.endSec || ((sc.startSec||0)+4),
               text: _captionFor(sc, lang) };
    }).filter(function(r){ return r.text; });
    if (!rows.length) { _toast('⚠️ 출력할 자막이 없습니다.', 'warn'); return false; }
    var srt = rows.map(function(r, i){
      return (i+1) + '\n' + _toSrtTime(r.startSec) + ' --> ' + _toSrtTime(r.endSec) + '\n' + r.text + '\n';
    }).join('\n');
    var name = 'remix-' + lang + '-' + _baseName() + '.srt';
    _download(name, srt, 'text/plain;charset=utf-8');
    _toast('💾 ' + name + ' 다운로드 (' + rows.length + ' 큐)', 'success');
    return true;
  }
  function downloadTxt(lang, opts) {
    lang = /^(ko|ja|both)$/.test(lang || '') ? lang : 'ja';
    var rows = _exportable(opts).map(function(sc){ return _captionFor(sc, lang); }).filter(Boolean);
    if (!rows.length) { _toast('⚠️ 출력할 자막이 없습니다.', 'warn'); return false; }
    var text = rows.join(lang === 'both' ? '\n\n' : '\n');
    var name = 'remix-' + lang + '-' + _baseName() + '.txt';
    _download(name, text, 'text/plain;charset=utf-8');
    _toast('💾 ' + name + ' 다운로드', 'success');
    return true;
  }
  function downloadJson() {
    var p = window.RM_CORE.project();
    var dump = JSON.stringify(p, null, 2);
    var name = 'remix-project-' + _baseName() + '.json';
    _download(name, dump, 'application/json;charset=utf-8');
    _toast('💾 ' + name + ' 다운로드', 'success');
    return true;
  }

  /* ── pre-flight 검증 — UI 가 보내기 직전 호출 ──
     scenes 0 / 자막 모두 비어있음 → errors 채워 차단 사유 반환 */
  function preflight(opts) {
    opts = opts || {};
    var p = window.RM_CORE.project();
    var rawScenes = p.scenes || [];
    var scenes = rawScenes.filter(function(sc){
      if (sc.deleted) return false;
      if (opts.selectedOnly && sc.selected === false) return false;
      return true;
    });
    var errors = [], warnings = [];
    if (!rawScenes.length) {
      errors.push({ code:'no-scenes',
        message:'장면이 없습니다. 자막/대본을 붙여넣고 "장면 분리" 를 누르세요.' });
    } else if (!scenes.length) {
      errors.push({ code:'all-filtered',
        message:'활성 씬이 0 개입니다. 삭제된 씬을 복구하거나 선택을 켜세요.' });
    }
    var withCaption = scenes.filter(function(sc){
      var t = (sc.editedCaption || sc.originalCaption || sc.captionJa || '').trim();
      return t.length > 0;
    });
    if (scenes.length && !withCaption.length) {
      errors.push({ code:'empty-captions',
        message:'씬은 있지만 자막이 모두 비어있습니다. 자막을 붙여넣거나 일본어 자막을 먼저 생성하세요.' });
    }
    var emptyCount = scenes.length - withCaption.length;
    if (emptyCount > 0 && withCaption.length > 0) {
      warnings.push({ code:'some-empty',
        message: emptyCount + ' 개 씬에 자막이 없습니다 — Step 2 에서 빈 자막으로 표시됩니다.' });
    }
    var jaCount = scenes.filter(function(sc){ return (sc.captionJa||'').trim(); }).length;
    var counts = { total: rawScenes.length, active: scenes.length,
                   withCaption: withCaption.length, empty: emptyCount, ja: jaCount };
    if (errors.length) return { ok:false, scenes:scenes, errors:errors, warnings:warnings, counts:counts };
    return { ok:true, scenes:scenes, errors:[], warnings:warnings, counts:counts,
             payload:_buildHandoffPayload(scenes, p) };
  }

  /* ── handoff payload — 다른 페이지(자동숏츠) 가 진입 시 읽음 ── */
  function _buildHandoffPayload(scenes, p) {
    var mappedScenes = scenes.map(function(sc, i){
      var narr = sc.editedCaption || sc.captionJa || sc.originalCaption || '';
      var cap  = sc.captionJa || sc.editedCaption || sc.originalCaption || '';
      return {
        sceneIndex:        i,
        sceneNumber:       i + 1,
        startSec:          sc.startSec || 0,
        endSec:            sc.endSec   || ((sc.startSec || 0) + 4),
        originalCaption:   sc.originalCaption || '',
        editedCaption:     sc.editedCaption   || '',
        captionKo:         sc.editedCaption || sc.originalCaption || '',
        captionJa:         sc.captionJa || '',
        captionBoth:       sc.captionBoth || '',
        narration:         narr,
        caption:           cap,
        role:              sc.role || '',
        roleLabel:         sc.roleLabel || '',
        visualDescription: sc.visualDescription || '',
        imagePrompt:       sc.imagePrompt || '',
        videoPrompt:       sc.videoPrompt || '',
        thumbnailUrl:      sc.thumbnailUrl || '',
        previewStatus:     sc.previewStatus || 'placeholder',
        notes:             sc.notes || '',
        source:            sc.source || 'manual_caption',
        sourceType:        'video_remix_studio',
      };
    });
    return {
      version: 1,
      sentAt:  Date.now(),
      remixSource: {
        url:        (p.source && p.source.youtubeUrl)   || '',
        videoId:    (p.source && p.source.videoId)      || '',
        title:      (p.source && p.source.title)        || '',
        type:       (p.source && p.source.type)         || '',
        fileName:   (p.source && p.source.fileName)     || '',
        durationSec:(p.source && p.source.durationSec)  || 0,
      },
      mode:        p.mode || 'subtitle_only',
      captionLang: p.captionLang || 'ja',
      sceneCount:  mappedScenes.length,
      scenes:      mappedScenes,
    };
  }

  /* ── 자동숏츠로 보내기 ──
     1) preflight — captions 없으면 차단
     2) localStorage handoff key 에 payload 저장 (engines/shorts/ 가 진입 시 읽음)
     3) 같은 페이지 STUDIO 가 살아있으면 즉시 YT_BRIDGE 도 호출 (검증/v4 컴파일)
     4) 결과 반환 — UI 는 검증 패널 + 이동 버튼 표시 */
  var HANDOFF_KEY = 'moca_remix_to_shorts_v1';
  function sendToShorts(opts) {
    opts = opts || {};
    var pf = preflight(opts);
    var p  = window.RM_CORE.project();
    if (!pf.ok) {
      var pp = window.RM_CORE.project();
      pp.lastExport = { at: Date.now(), result: pf, mode: p.mode };
      window.RM_CORE.save();
      _toast('❌ 전달 차단 — ' + (pf.errors[0] && pf.errors[0].message || '검증 실패'), 'error');
      return Object.assign({}, pf, { written: { scenes: 0, prompts: 0 } });
    }
    /* (1) 핸드오프 저장 — 다른 페이지가 읽음 */
    try {
      localStorage.setItem(HANDOFF_KEY, JSON.stringify(pf.payload));
    } catch(e) {
      _toast('❌ 핸드오프 저장 실패 (저장공간 가득): ' + (e && e.message), 'error');
      return { ok:false, scenes: pf.scenes,
        errors:[{code:'localstorage-fail', message: e && e.message}],
        warnings: pf.warnings, counts: pf.counts, written: { scenes: 0, prompts: 0 } };
    }
    /* (2) 같은 페이지 내 STUDIO 가 있으면 즉시 bridge — v4 컴파일러 트리거 */
    var bridgeResult = null;
    if (window.YT_BRIDGE && typeof window.YT_BRIDGE.bridgeToStep2 === 'function' &&
        window.STUDIO && window.STUDIO.project) {
      try { bridgeResult = window.YT_BRIDGE.bridgeToStep2(pf.payload.scenes); } catch(_) {}
    }
    var pp2 = window.RM_CORE.project();
    var written = (bridgeResult && bridgeResult.ok)
      ? bridgeResult.written
      : { scenes: pf.scenes.length, prompts: pf.scenes.length };
    pp2.lastExport = { at: Date.now(),
      result: { ok:true, written: written, errors:[], warnings: pf.warnings },
      mode: p.mode, counts: pf.counts,
      payloadSize: JSON.stringify(pf.payload).length };
    window.RM_CORE.save();
    _toast('✅ 핸드오프 준비 완료 — ' + pf.scenes.length + ' 씬 (자동숏츠 Step 2 로 이동 가능)', 'success');
    return { ok: true, scenes: pf.scenes, errors: [], warnings: pf.warnings,
             counts: pf.counts, written: written, payload: pf.payload };
  }

  /* ── 자동숏츠 페이지로 이동 (반드시 sendToShorts 후 호출) ── */
  function gotoShortsStep2() {
    var url = '../../engines/shorts/index.html?step=2&source=remix';
    window.location.assign(url);
  }
  function gotoShortsStep3() {
    var url = '../../engines/shorts/index.html?step=3&source=remix';
    window.location.assign(url);
  }

  window.RM_EXPORT = {
    preflight:       preflight,
    downloadSrt:     downloadSrt,
    downloadTxt:     downloadTxt,
    downloadJson:    downloadJson,
    sendToShorts:    sendToShorts,
    gotoShortsStep2: gotoShortsStep2,
    gotoShortsStep3: gotoShortsStep3,
    HANDOFF_KEY:     HANDOFF_KEY,
  };
})();
