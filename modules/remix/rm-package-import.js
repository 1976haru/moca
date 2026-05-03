/* ================================================
   modules/remix/rm-package-import.js
   영상 리믹스 스튜디오 — 로컬 헬퍼 패키지 import
   * remix_project.json — 사용자 명세 schema
   * remix_package.zip — JSZip 가 있으면 처리, 없으면 안내
   * transcript.srt / transcript.txt — 자막 직접 import
   * import 결과는 RM_CORE.setScenes / setSource 로 영상 리믹스 보드에 그대로 노출
   ================================================ */
(function(){
  'use strict';

  var SCHEMA_VERSION = 1;

  function _toast(msg, kind){
    if (typeof window.ucShowToast === 'function') window.ucShowToast(msg, kind || 'info');
  }
  function _readText(file) {
    return new Promise(function(resolve, reject){
      var fr = new FileReader();
      fr.onload  = function(){ resolve(String(fr.result || '')); };
      fr.onerror = function(){ reject(new Error('파일 읽기 실패')); };
      fr.readAsText(file, 'utf-8');
    });
  }
  function _readArrayBuffer(file) {
    return new Promise(function(resolve, reject){
      var fr = new FileReader();
      fr.onload  = function(){ resolve(fr.result); };
      fr.onerror = function(){ reject(new Error('파일 읽기 실패')); };
      fr.readAsArrayBuffer(file);
    });
  }

  /* ── remix_project.json schema 검증 ── */
  function validateProject(j) {
    if (!j || typeof j !== 'object') return { ok: false, error: 'NOT_OBJECT', message: 'JSON 객체가 아닙니다.' };
    if (!Array.isArray(j.scenes))    return { ok: false, error: 'NO_SCENES', message: 'scenes 배열이 없습니다.' };
    if (!j.scenes.length)            return { ok: false, error: 'EMPTY_SCENES', message: 'scenes 배열이 비어있습니다.' };
    var bad = j.scenes.findIndex(function(s){
      return !s || typeof s !== 'object' ||
             typeof s.startSec !== 'number' || typeof s.endSec !== 'number' ||
             typeof s.originalCaption !== 'string';
    });
    if (bad >= 0) return { ok: false, error: 'INVALID_SCENE',
      message: 'scenes[' + bad + '] 형식이 잘못됐습니다 (startSec/endSec/originalCaption 필수).' };
    return { ok: true };
  }

  /* ── remix scene → rm-core scene ── */
  function _toRmScene(s, i) {
    var thumb = s.frameUrl || s.thumbnailUrl || '';
    var orig = String(s.originalCaption || '').trim();
    return {
      id:               'rm_' + String(i + 1).padStart(3, '0'),
      sceneIndex:       i,
      sceneNumber:      i + 1,
      startSec:         +s.startSec || 0,
      endSec:           +s.endSec   || ((+s.startSec || 0) + 4),
      timeRange:        _fmtSec(s.startSec) + '~' + _fmtSec(s.endSec),
      originalCaption:  orig,
      editedCaption:    String(s.editedCaption || ''),
      captionKo:        orig,
      captionJa:        String(s.captionJa || ''),
      captionBoth:      '',
      narration:        orig,
      selected:         s.selected !== false,
      deleted:          !!s.deleted,
      thumbnailUrl:     thumb,
      frameUrl:         thumb,
      previewStatus:    thumb ? 'ready' : 'missing',
      role:             s.role || '',
      roleLabel:        s.roleLabel || '',
      notes:            String(s.notes || ''),
      visualDescription:String(s.visualDescription || ''),
      source:           'package_import',
      sourceType:       'video_remix_studio',
    };
  }
  function _fmtSec(sec) {
    var s = Math.max(0, Math.round(+sec || 0));
    var m = Math.floor(s/60); var ss = s%60;
    return m+':'+(ss<10?'0'+ss:ss);
  }

  /* ── meta → RM_CORE.source ── */
  function _applyMeta(j) {
    var src = j.source === 'youtube' ? 'youtube' : (j.source === 'upload' ? 'upload' : '');
    var thumb = '';
    if (j.thumbnailUrl) thumb = j.thumbnailUrl;
    else if (j.videoId) thumb = 'https://img.youtube.com/vi/' + j.videoId + '/hqdefault.jpg';
    window.RM_CORE.setSource({
      type:        src || 'youtube',
      videoId:     j.videoId || '',
      youtubeUrl:  j.videoId ? ('https://youtu.be/' + j.videoId) : (j.url || ''),
      title:       j.title || '',
      durationSec: +j.durationSec || 0,
      fileName:    '',
      fileBlobUrl: '',
    });
  }

  /* ── apply: 검증된 packet → scenes 보드 ── */
  function applyPacket(packet) {
    if (!packet || !Array.isArray(packet.scenes)) {
      return { ok: false, error: 'INVALID_PACKET' };
    }
    _applyMeta(packet);
    var scenes = packet.scenes.map(_toRmScene);
    window.RM_CORE.setScenes(scenes);
    /* transcript raw 도 업데이트 — 사용자가 paste textarea 에서 다시 편집 가능 */
    var raw = scenes.map(function(s){
      return _fmtSec(s.startSec) + ' ' + s.originalCaption;
    }).join('\n');
    window.RM_CORE.setTranscriptRaw(raw, 'imported');
    window.RM_CORE.setStage('scenes');
    var p = window.RM_CORE.project();
    p._active = 0;
    window.RM_CORE.save();
    return { ok: true, sceneCount: scenes.length, hasFrames: scenes.filter(function(s){return s.thumbnailUrl;}).length };
  }

  /* ── JSON 파일 import ── */
  async function importJson(file) {
    if (!file) return { ok: false, error: 'NO_FILE', message: '파일이 없습니다.' };
    try {
      var text = await _readText(file);
      var j;
      try { j = JSON.parse(text); }
      catch (e) {
        return { ok: false, error: 'JSON_PARSE_FAIL', message: 'JSON 파싱 실패: ' + e.message };
      }
      var v = validateProject(j);
      if (!v.ok) return v;
      var r = applyPacket(j);
      if (!r.ok) return r;
      _toast('✅ 패키지 ' + r.sceneCount + ' 씬 import (프레임 ' + r.hasFrames + ')', 'success');
      return Object.assign({ ok: true, source: 'json', fileName: file.name }, r);
    } catch (e) {
      return { ok: false, error: 'READ_FAIL', message: '파일 읽기 실패: ' + (e && e.message || e) };
    }
  }

  /* ── ZIP 파일 import ── */
  async function importZip(file) {
    if (!file) return { ok: false, error: 'NO_FILE', message: '파일이 없습니다.' };
    if (typeof window.JSZip === 'undefined') {
      return { ok: false, error: 'NO_JSZIP',
        message: 'ZIP 지원은 후속 단계입니다. 현재는 remix_project.json 또는 SRT/TXT 직접 import 를 사용하세요. ' +
                 '(JSZip 라이브러리를 페이지에 추가하면 활성됩니다)' };
    }
    try {
      var ab = await _readArrayBuffer(file);
      var zip = await window.JSZip.loadAsync(ab);
      /* remix_project.json 또는 project.json 찾기 */
      var jsonEntry = zip.file('remix_project.json') || zip.file('project.json');
      if (!jsonEntry) {
        return { ok: false, error: 'NO_PROJECT_JSON',
          message: 'ZIP 안에 remix_project.json 또는 project.json 이 없습니다.' };
      }
      var jsonText = await jsonEntry.async('text');
      var j;
      try { j = JSON.parse(jsonText); }
      catch (e) {
        return { ok: false, error: 'JSON_PARSE_FAIL', message: 'JSON 파싱 실패: ' + e.message };
      }
      var v = validateProject(j);
      if (!v.ok) return v;
      /* 프레임 — frames/scene_001.jpg 패턴이 있으면 dataURL 로 변환 */
      var framesDir = 'frames/';
      for (var i = 0; i < j.scenes.length; i++) {
        var sc = j.scenes[i];
        if (sc.frameUrl || sc.thumbnailUrl) continue;
        var name = framesDir + 'scene_' + String(i+1).padStart(3, '0') + '.jpg';
        var entry = zip.file(name) || zip.file(framesDir + 'scene_' + (i+1) + '.jpg');
        if (entry) {
          try {
            var blob = await entry.async('blob');
            var url = URL.createObjectURL(blob);
            sc.frameUrl = url;
          } catch(_) {}
        }
      }
      var r = applyPacket(j);
      if (!r.ok) return r;
      _toast('✅ ZIP 패키지 ' + r.sceneCount + ' 씬 import', 'success');
      return Object.assign({ ok: true, source: 'zip', fileName: file.name }, r);
    } catch (e) {
      return { ok: false, error: 'ZIP_FAIL', message: 'ZIP 처리 실패: ' + (e && e.message || e) };
    }
  }

  /* ── SRT/VTT/TXT direct import ── */
  async function importCaptionFile(file) {
    if (!file) return { ok: false, error: 'NO_FILE' };
    if (!window.RM_PARSER || typeof window.RM_PARSER.parseAndSplit !== 'function') {
      return { ok: false, error: 'NO_PARSER', message: 'RM_PARSER 모듈 미로드' };
    }
    try {
      var text = await _readText(file);
      if (!text.trim()) return { ok: false, error: 'EMPTY_FILE', message: '파일이 비어있습니다.' };
      var format = /^WEBVTT/i.test(text) ? 'vtt' : (/-->/.test(text) ? 'srt' : 'plain');
      window.RM_CORE.setTranscriptRaw(text, format);
      var r = window.RM_PARSER.parseAndSplit(text, {});
      if (!r.scenes.length) {
        return { ok: false, error: 'EMPTY_PARSE', message: '자막 파싱 결과 scene 이 0 개입니다.' };
      }
      window.RM_CORE.setScenes(r.scenes);
      window.RM_CORE.setStage('scenes');
      var p = window.RM_CORE.project();
      p._active = 0;
      window.RM_CORE.save();
      _toast('✅ ' + format.toUpperCase() + ' 자막 → ' + r.scenes.length + ' 씬', 'success');
      return { ok: true, source: format, fileName: file.name, sceneCount: r.scenes.length, hasFrames: 0 };
    } catch (e) {
      return { ok: false, error: 'READ_FAIL', message: e && e.message || 'unknown' };
    }
  }

  /* ── 파일 확장자에 따라 자동 라우팅 ── */
  async function importAuto(file) {
    if (!file) return { ok: false, error: 'NO_FILE' };
    var ext = String(file.name || '').toLowerCase().split('.').pop();
    if (ext === 'json') return await importJson(file);
    if (ext === 'zip')  return await importZip(file);
    if (ext === 'srt' || ext === 'vtt' || ext === 'txt') return await importCaptionFile(file);
    return { ok: false, error: 'UNKNOWN_EXT',
      message: '지원하지 않는 확장자: .' + ext + ' (지원: .json / .zip / .srt / .vtt / .txt)' };
  }

  window.RM_PACKAGE = {
    SCHEMA_VERSION:    SCHEMA_VERSION,
    validateProject:   validateProject,
    applyPacket:       applyPacket,
    importJson:        importJson,
    importZip:         importZip,
    importCaptionFile: importCaptionFile,
    importAuto:        importAuto,
  };
})();
