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

  /* ── 자동숏츠로 보내기 ──
     YT_BRIDGE.bridgeToStep2 가 s1.scenes / project.scenes / s3.scenePrompts 등
     모든 경로를 작성하고 verifyBridge 로 검증함. */
  function sendToShorts(opts) {
    opts = opts || {};
    if (!window.YT_BRIDGE || typeof window.YT_BRIDGE.bridgeToStep2 !== 'function') {
      _toast('❌ YT_BRIDGE 미로드 — 자동숏츠로 보낼 수 없습니다.', 'error');
      return { ok: false, errors: [{ code: 'no-bridge', message: 'YT_BRIDGE not loaded' }] };
    }
    var p = window.RM_CORE.project();
    var scenes = (p.scenes || []).filter(function(sc){
      if (sc.deleted) return false;
      if (opts.selectedOnly && sc.selected === false) return false;
      return true;
    });
    if (!scenes.length) {
      _toast('⚠️ 보낼 씬이 없습니다 — 선택 또는 생성해 주세요.', 'warn');
      return { ok: false, errors: [{ code: 'empty', message: 'no scenes' }] };
    }
    /* rm schema → bridge 가 받아주는 schema 로 매핑 */
    var mapped = scenes.map(function(sc, i){
      return Object.assign({}, sc, {
        sceneIndex:    i,
        sceneNumber:   i + 1,
        originalText:  sc.originalCaption || '',
        editedText:    sc.editedCaption || '',
        translatedJa:  sc.captionJa || '',
        captionKo:     sc.editedCaption || sc.originalCaption || '',
        captionJa:     sc.captionJa || '',
        captionBoth:   sc.captionBoth || '',
        adaptedNarration: sc.editedCaption || sc.captionJa || sc.originalCaption || '',
        adaptedCaption:   sc.captionJa || sc.editedCaption || sc.originalCaption || '',
        visualDescription: sc.visualDescription || '',
        thumbnailUrl:  sc.thumbnailUrl || '',
        previewStatus: sc.previewStatus || 'placeholder',
        sourceType:    'video_remix_studio',
      });
    });
    var result = window.YT_BRIDGE.bridgeToStep2(mapped);
    var pp = window.RM_CORE.project();
    pp.lastExport = { at: Date.now(), result: result, mode: p.mode };
    window.RM_CORE.save();
    if (result.ok) {
      _toast('✅ 자동숏츠로 전달 — 씬 ' + result.written.scenes + '개', 'success');
    } else {
      _toast('❌ 전달 실패 — 패널 메시지를 확인하세요.', 'error');
    }
    return result;
  }

  /* ── 자동숏츠 페이지로 이동 ── */
  function gotoShortsStep2() {
    /* engines/remix/index.html 에서 호출 — 자동숏츠 페이지 step 2 로 이동 */
    var url = '../../engines/shorts/index.html?step=2';
    /* 같은 origin 이므로 location.assign — STUDIO.project 는 localStorage 에 살아 있음 */
    window.location.assign(url);
  }
  function gotoShortsStep3() {
    var url = '../../engines/shorts/index.html?step=3';
    window.location.assign(url);
  }

  window.RM_EXPORT = {
    downloadSrt:     downloadSrt,
    downloadTxt:     downloadTxt,
    downloadJson:    downloadJson,
    sendToShorts:    sendToShorts,
    gotoShortsStep2: gotoShortsStep2,
    gotoShortsStep3: gotoShortsStep3,
  };
})();
