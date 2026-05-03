/* ================================================
   modules/studio/s1-youtube-import-pipeline.js
   유튜브 import 파이프라인 — URL · transcript · scene split · status · storage
   * 4단계 (1/4 link → 2/4 transcript → 3/4 scenes → 4/4 thumbs) 상태를 외부에 노출
   * 클라이언트 단독 동작 — 서버 엔드포인트(/api/youtube/...) 가 있으면 시도, 없으면 fallback
   * SRT / VTT / 시간 포함 plain / 시간 없는 plain 모두 정규화
   * scenes 는 사용자 명세 schema 그대로:
     { id, index, startSec, endSec, role, originalText, editedText, translatedJa,
       selected, thumbnailUrl, previewStatus, notes, sourceType: 'youtube_import' }
   * 조용한 실패 금지 — packet.errors[] / packet.warnings[] 로 모든 실패 노출
   ================================================ */
(function(){
  'use strict';

  /* ── 상태 단계 정의 ── */
  var STEPS = [
    { id:'url',        label:'1/4 링크 확인 중' },
    { id:'transcript', label:'2/4 자막 가져오는 중' },
    { id:'scenes',     label:'3/4 장면 분리 중' },
    { id:'thumbs',     label:'4/4 프레임 생성 중' },
  ];

  var ROLES = [
    { id:'hook',     label:'훅' },
    { id:'setup',    label:'상황 설명' },
    { id:'evidence', label:'예시/증거' },
    { id:'reveal',   label:'반전/핵심' },
    { id:'cta',      label:'CTA' },
  ];

  /* ════════════════════════════════════════════════
     1) URL 파싱
     ════════════════════════════════════════════════ */
  function extractVideoId(url) {
    if (!url) return '';
    var s = String(url).trim();
    if (!s) return '';
    var m;
    m = s.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);          if (m) return m[1];
    m = s.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/);if (m) return m[1];
    m = s.match(/[?&]v=([A-Za-z0-9_-]{6,})/);                if (m) return m[1];
    m = s.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/); if (m) return m[1];
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
    return '';
  }

  /* ── 메타 조회 — oEmbed 시도 (CORS 막힐 가능성 큼, 실패 시 빈 메타) ── */
  async function fetchMeta(videoId, url) {
    var meta = { videoId: videoId, title: '', channel: '', durationSec: 0,
      thumbnail: 'https://img.youtube.com/vi/'+videoId+'/hqdefault.jpg', author: '' };
    if (!videoId) return meta;
    /* 서버 엔드포인트 우선 시도 — 없으면 다음 방식 */
    try {
      var apiRes = await fetch('/api/youtube/meta?v='+encodeURIComponent(videoId));
      if (apiRes.ok) {
        var j = await apiRes.json();
        Object.assign(meta, j || {});
        return meta;
      }
    } catch(_) {}
    /* oEmbed (보통 CORS 차단되지만 일부 환경에서 동작) */
    try {
      var oeUrl = 'https://www.youtube.com/oembed?url='+encodeURIComponent(url||('https://www.youtube.com/watch?v='+videoId))+'&format=json';
      var r = await fetch(oeUrl);
      if (r.ok) {
        var d = await r.json();
        if (d.title) meta.title = d.title;
        if (d.author_name) { meta.channel = d.author_name; meta.author = d.author_name; }
        if (d.thumbnail_url) meta.thumbnail = d.thumbnail_url;
      }
    } catch(_) { /* CORS — 메타 없이 진행 */ }
    return meta;
  }

  /* ════════════════════════════════════════════════
     2) Transcript 정규화
        - SRT/VTT 자동 인식
        - 시간 포함 plain (00:12 텍스트)
        - 시간 없는 plain (문장 단위)
        return [{ startSec, endSec, text }]
     ════════════════════════════════════════════════ */
  function normalizeTranscript(input) {
    var src = String(input || '').replace(/\r\n?/g, '\n').trim();
    if (!src) return [];

    /* WEBVTT/SRT 헤더 인식 */
    var isVtt = /^WEBVTT/i.test(src);
    var isSrt = /^\d+\s*\n\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.]\d{3}/m.test(src);
    if (isVtt || isSrt) return _parseSrtVtt(src, isVtt);

    /* timestamp 라인 감지 (00:12 텍스트 / [00:12] 텍스트 / 00:12 -> 00:18) */
    var withTs = _parseTimestampLines(src);
    if (withTs && withTs.length >= 2) return withTs;

    /* 빈 줄 분리 → 블록 단위 */
    var blocks = src.split(/\n\s*\n+/).map(function(b){ return b.trim(); }).filter(Boolean);
    if (blocks.length >= 2 && blocks.length <= 30) {
      return blocks.map(function(b, i){
        return { startSec: i * 4, endSec: (i+1) * 4, text: b.replace(/\n+/g, ' ').trim() };
      });
    }

    /* 줄 단위 — 한 줄에 한 단어식이면 의미 단위로 묶기 */
    var lines = src.split('\n').map(function(l){ return l.trim(); }).filter(Boolean);
    var avgLen = lines.reduce(function(s,l){return s+l.length;},0) / Math.max(1, lines.length);
    if (avgLen < 6 && lines.length > 4) {
      /* 너무 짧은 토큰 — 4~6 개씩 묶음 */
      var per = 5;
      var merged = [];
      for (var i = 0; i < lines.length; i += per) {
        merged.push(lines.slice(i, i+per).join(' '));
      }
      return merged.map(function(t, i){
        return { startSec: i * 3, endSec: (i+1) * 3, text: t };
      });
    }

    /* 문장 분리 — 마침표/느낌표/물음표/일본어 마침표 */
    var sentences = src.split(/(?<=[.!?。！？])\s+/).map(function(s){ return s.trim(); }).filter(Boolean);
    if (!sentences.length) return [{ startSec: 0, endSec: 4, text: src }];
    return sentences.map(function(t, i){
      return { startSec: i * 3, endSec: (i+1) * 3, text: t };
    });
  }

  /* SRT/VTT 파서 */
  function _parseSrtVtt(src, isVtt) {
    var out = [];
    var rxTime = /(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/;
    var lines = src.split('\n');
    var i = 0;
    while (i < lines.length) {
      var line = lines[i].trim();
      var m = line.match(rxTime);
      if (m) {
        var start = _hmsToSec(m[1]);
        var end   = _hmsToSec(m[2]);
        var textBuf = [];
        i++;
        while (i < lines.length && lines[i].trim() !== '' && !rxTime.test(lines[i])) {
          textBuf.push(lines[i].replace(/<[^>]+>/g, '').trim());
          i++;
        }
        var text = textBuf.join(' ').replace(/\s+/g, ' ').trim();
        if (text) out.push({ startSec: start, endSec: end, text: text });
      } else {
        i++;
      }
    }
    /* dedupe — VTT 가 같은 자막을 여러번 cue 하기도 함 */
    var seen = Object.create(null);
    out = out.filter(function(c){
      var k = c.text.replace(/\s+/g,' ').toLowerCase();
      if (seen[k]) { seen[k].endSec = Math.max(seen[k].endSec, c.endSec); return false; }
      seen[k] = c; return true;
    });
    return out;
  }
  function _hmsToSec(hms) {
    var s = String(hms || '').replace(',', '.');
    var m = s.match(/(\d{1,2}):(\d{2}):(\d{2})(?:[.,](\d{1,3}))?/);
    if (m) return (+m[1])*3600 + (+m[2])*60 + (+m[3]) + ((+m[4]||0)/Math.pow(10, (m[4]||'').length));
    var n = s.match(/(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?/);
    if (n) return (+n[1])*60 + (+n[2]) + ((+n[3]||0)/Math.pow(10, (n[3]||'').length));
    return 0;
  }

  /* "00:12 텍스트" / "[00:12] 텍스트" / "00:12 - 00:18 텍스트" */
  function _parseTimestampLines(src) {
    var rxLine = /^\[?(\d{1,2}:\d{1,2}(?::\d{1,2})?)\]?\s*(?:->|→|~|-)\s*\[?(\d{1,2}:\d{1,2}(?::\d{1,2})?)\]?\s*(.*)$/;
    var rxLead = /^\[?(\d{1,2}:\d{1,2}(?::\d{1,2})?)\]?\s+(.+)$/;
    var lines = src.split('\n');
    var out = [];
    var current = null;
    var any = false;
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i].trim();
      if (!ln) continue;
      var m = ln.match(rxLine);
      if (m) {
        any = true;
        if (current) out.push(current);
        current = { startSec: _hmsToSec(m[1]), endSec: _hmsToSec(m[2]), text: (m[3]||'').trim() };
        continue;
      }
      m = ln.match(rxLead);
      if (m) {
        any = true;
        if (current) out.push(current);
        current = { startSec: _hmsToSec(m[1]), endSec: null, text: (m[2]||'').trim() };
        continue;
      }
      if (current) current.text = (current.text + ' ' + ln).trim();
    }
    if (current) out.push(current);
    if (!any || !out.length) return null;
    /* end 추정 */
    for (var j = 0; j < out.length; j++) {
      if (out[j].endSec == null) {
        out[j].endSec = (j + 1 < out.length && out[j+1].startSec != null)
          ? out[j+1].startSec : (out[j].startSec || 0) + 4;
      }
    }
    return out;
  }

  /* ════════════════════════════════════════════════
     3) Scene Split
        - cue 가 너무 많으면 병합 (목표: 5~18 scene)
        - cue 가 너무 적으면 더 잘게 split (긴 cue 분할)
        - 각 scene 에 role 추정
        - thumbnail URL 은 videoId 기반 (서버 keyframes 가 있으면 덮어씀)
     ════════════════════════════════════════════════ */
  function splitToScenes(transcript, opts) {
    opts = opts || {};
    var videoId = opts.videoId || '';
    if (!Array.isArray(transcript) || !transcript.length) return [];

    var totalDur = transcript[transcript.length-1].endSec || 60;
    var targetCount;
    if (totalDur <= 60)        targetCount = Math.min(18, Math.max(5, Math.round(totalDur / 4)));
    else if (totalDur <= 180)  targetCount = Math.min(20, Math.max(8, Math.round(totalDur / 9)));
    else                       targetCount = Math.min(24, Math.max(10, Math.round(totalDur / 15)));

    var cues = transcript.slice();
    /* 병합 단계 — cue 너무 많으면 순서대로 묶음 */
    while (cues.length > targetCount * 1.4) {
      var merged = [];
      for (var i = 0; i < cues.length; i += 2) {
        var a = cues[i], b = cues[i+1];
        if (b) {
          merged.push({ startSec: a.startSec, endSec: b.endSec, text: (a.text + ' ' + b.text).trim() });
        } else {
          merged.push(a);
        }
      }
      if (merged.length === cues.length) break;
      cues = merged;
    }
    /* split 단계 — cue 너무 적으면 긴 cue 를 문장 단위로 쪼갬 */
    if (cues.length < targetCount * 0.6) {
      var split = [];
      cues.forEach(function(c){
        var sentences = String(c.text || '').split(/(?<=[.!?。！？])\s+/).filter(Boolean);
        if (sentences.length <= 1) { split.push(c); return; }
        var per = (c.endSec - c.startSec) / sentences.length;
        sentences.forEach(function(s, j){
          split.push({
            startSec: c.startSec + j * per,
            endSec:   c.startSec + (j + 1) * per,
            text:     s.trim(),
          });
        });
      });
      if (split.length > cues.length) cues = split;
    }
    /* 너무 짧은 segment(< 1.5 s) 를 다음 cue 와 병합 — 단어 조각 합치기 */
    var glued = [];
    for (var k = 0; k < cues.length; k++) {
      var cur = cues[k];
      var dur = (cur.endSec || 0) - (cur.startSec || 0);
      if (dur < 1.5 && glued.length) {
        var prev = glued[glued.length - 1];
        prev.endSec = cur.endSec;
        prev.text = (prev.text + ' ' + cur.text).trim();
      } else {
        glued.push(Object.assign({}, cur));
      }
    }
    cues = glued;

    /* scene 객체 빌드 */
    var n = cues.length;
    return cues.map(function(c, i){
      var role = _guessRole(c.text, i, n);
      var midSec = Math.round(((c.startSec || 0) + (c.endSec || 0)) / 2);
      var thumb = videoId
        ? 'https://img.youtube.com/vi/'+videoId+'/hqdefault.jpg'  /* 동일 썸네일 — 클라이언트는 프레임 추출 불가 */
        : '';
      return {
        id:             'yt_scene_' + String(i+1).padStart(3, '0'),
        index:          i + 1,
        sceneIndex:     i,
        sceneNumber:    i + 1,
        startSec:       Math.max(0, Math.round(c.startSec || 0)),
        endSec:         Math.max((c.startSec || 0) + 1, Math.round(c.endSec || ((c.startSec||0)+4))),
        midSec:         midSec,
        role:           role,
        roleLabel:      _roleLabel(role),
        originalText:   String(c.text || '').trim(),
        original:       String(c.text || '').trim(),  /* 기존 remix 모듈 호환 */
        editedText:     '',
        translatedJa:   '',
        selected:       true,
        thumbnailUrl:   thumb,
        previewStatus:  thumb ? 'placeholder' : 'missing',  /* 'ready' 는 서버 추출 성공 시 */
        notes:          '',
        sourceType:     'youtube_import',
        timeRange:      _fmtSec(c.startSec) + '~' + _fmtSec(c.endSec),
        captionLength:  _capLen(c.text),
        cutRhythm:      _cutRhythm(c.text),
        shotType:       'caption', shotTypeLabel: '자막 중심',
        keepNote: '', avoidNote: '',
        captionKo: '', captionJa: '', captionBoth: '',
        adaptedNarration: '', adaptedCaption: '',
        visualDescription: '', imagePrompt: '', videoPrompt: '',
      };
    });
  }
  function _guessRole(text, idx, total) {
    var t = String(text || '');
    if (idx === 0) return 'hook';
    if (idx === total - 1) return 'cta';
    if (/구독|좋아요|팔로우|チャンネル|登録|フォロー|see you/i.test(t)) return 'cta';
    if (/그런데|그러나|반전|놀랍게|意外|でも|しかし|but|however/i.test(t)) return 'reveal';
    if (/예를 들면|예시|실제로|たとえば|実は|for example/i.test(t)) return 'evidence';
    if (idx === 1) return 'setup';
    return 'evidence';
  }
  function _roleLabel(id) {
    var r = ROLES.filter(function(x){ return x.id === id; })[0];
    return r ? r.label : id;
  }
  function _fmtSec(sec) {
    var s = Math.max(0, Math.round(sec || 0));
    var m = Math.floor(s/60); var ss = s%60;
    return m+':'+(ss<10?'0'+ss:ss);
  }
  function _capLen(text) {
    var len = String(text || '').length;
    if (len <= 14) return 'short';
    if (len <= 30) return 'medium';
    return 'long';
  }
  function _cutRhythm(text) {
    var len = String(text || '').length;
    if (len <= 18) return 'fast';
    if (len <= 40) return 'medium';
    return 'slow';
  }

  /* ════════════════════════════════════════════════
     4) Server-side transcript / keyframes (있으면 사용)
        둘 다 없으면 fallback — paste textarea / placeholder thumbnail
     ════════════════════════════════════════════════ */
  async function fetchServerTranscript(videoId) {
    try {
      var r = await fetch('/api/youtube/transcript?v='+encodeURIComponent(videoId));
      if (!r.ok) return null;
      var j = await r.json();
      if (Array.isArray(j)) return j;        /* 배열 직접 */
      if (j && Array.isArray(j.transcript)) return j.transcript;
      if (j && typeof j.text === 'string') return normalizeTranscript(j.text);
      return null;
    } catch(_) { return null; }
  }
  async function fetchServerKeyframes(videoId, scenes) {
    if (!Array.isArray(scenes) || !scenes.length) return false;
    try {
      var times = scenes.map(function(sc){ return sc.midSec || sc.startSec || 0; });
      var r = await fetch('/api/youtube/keyframes', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ videoId: videoId, times: times }),
      });
      if (!r.ok) return false;
      var j = await r.json();
      var urls = j && j.frames;
      if (!Array.isArray(urls)) return false;
      for (var i = 0; i < scenes.length; i++) {
        if (urls[i]) { scenes[i].thumbnailUrl = urls[i]; scenes[i].previewStatus = 'ready'; }
      }
      return true;
    } catch(_) { return false; }
  }
  /* timedtext (CORS 막힐 가능성 큼) */
  async function fetchTimedText(videoId) {
    var langs = ['ko', 'ja', 'en'];
    for (var i = 0; i < langs.length; i++) {
      try {
        var url = 'https://video.google.com/timedtext?lang='+langs[i]+'&v='+encodeURIComponent(videoId);
        var r = await fetch(url, { mode: 'cors' });
        if (!r.ok) continue;
        var xml = await r.text();
        if (xml && xml.indexOf('<text') >= 0) {
          var out = _parseTimedTextXml(xml);
          if (out && out.length) return out;
        }
      } catch(_) {}
    }
    return null;
  }
  function _parseTimedTextXml(xml) {
    var out = [];
    var rx = /<text\s+start="([\d.]+)"(?:\s+dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
    var m;
    while ((m = rx.exec(xml)) !== null) {
      var start = parseFloat(m[1]) || 0;
      var dur   = parseFloat(m[2]) || 4;
      var body = (m[3] || '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
                            .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/<[^>]+>/g,'').trim();
      if (body) out.push({ startSec: start, endSec: start + dur, text: body });
    }
    return out;
  }

  /* ════════════════════════════════════════════════
     5) Status manager
     ════════════════════════════════════════════════ */
  function _newStatus() {
    return { steps: STEPS.map(function(s){ return Object.assign({}, s, { state:'pending', detail:'' }); }),
             currentStep: 0, done: false };
  }
  function _setStep(status, idx, state, detail) {
    if (!status || !status.steps[idx]) return;
    status.steps[idx].state  = state || 'pending';
    status.steps[idx].detail = detail || '';
    status.currentStep = idx;
  }

  /* ════════════════════════════════════════════════
     6) Storage adapter
        Single source of truth: STUDIO.project.s1.youtubeImport
        + 호환을 위해 기존 remix 키도 동기화
     ════════════════════════════════════════════════ */
  function _proj() {
    var p = (window.STUDIO && window.STUDIO.project) || (window.STUDIO ? (window.STUDIO.project = {}) : null);
    if (!p) return null;
    p.s1 = p.s1 || {};
    p.s3 = p.s3 || {};
    return p;
  }
  function getYTImport() {
    var p = _proj();
    return (p && p.s1 && p.s1.youtubeImport) || null;
  }
  function setYTImport(packet) {
    var p = _proj(); if (!p) return false;
    p.s1.youtubeImport = packet || null;
    p.s1.mode = 'youtube_reference_adapt';
    /* 호환: 기존 remix UI 가 읽는 위치도 갱신 */
    p.s1.youtubeReference = p.s1.youtubeReference || {};
    if (packet) {
      p.s1.youtubeReference.url      = packet.url || '';
      p.s1.youtubeReference.videoId  = packet.videoId || '';
      p.s1.youtubeReference.title    = (packet.meta && packet.meta.title) || '';
      p.s1.youtubeReference.transcript = (packet.transcript || []).map(function(c){
        return _fmtSec(c.startSec)+' '+(c.text||'');
      }).join('\n');
      p.s1.youtubeReference.detectedScenes = (packet.scenes || []).slice();
      p.s1.youtubeReference.adaptationMode = packet.mode || p.s1.youtubeReference.adaptationMode || 'subtitle_only';
      p.s1.youtubeReference.updatedAt = Date.now();
    }
    /* YRX_STATE 도 동기화 (기존 보드 호환) */
    if (window.YRX_STATE && packet) {
      window.YRX_STATE.url           = packet.url || window.YRX_STATE.url;
      window.YRX_STATE.videoId       = packet.videoId || window.YRX_STATE.videoId;
      window.YRX_STATE.title         = (packet.meta && packet.meta.title) || window.YRX_STATE.title;
      window.YRX_STATE.transcript    = p.s1.youtubeReference.transcript;
      window.YRX_STATE.detectedScenes = packet.scenes || [];
      if (typeof window.YRX_STATE.activeSceneIdx !== 'number') window.YRX_STATE.activeSceneIdx = 0;
    }
    if (typeof window.studioSave === 'function') window.studioSave();
    return true;
  }
  function getYTScenes() {
    var pk = getYTImport();
    return (pk && pk.scenes) || [];
  }
  function saveYTScenes(scenes) {
    var pk = getYTImport();
    if (!pk) {
      pk = { ok: true, source: 'youtube', url: '', videoId: '',
        meta: {}, transcript: [], scenes: scenes, warnings: [], errors: [] };
    } else {
      pk.scenes = scenes;
    }
    setYTImport(pk);
    /* 기존 yrxPersistAdaptation 도 호출해서 Step 2 prompt 경로까지 갱신 */
    if (window.YRX_STATE) {
      window.YRX_STATE.adaptedScenes = scenes.map(function(sc, i){
        return Object.assign({}, sc, { sceneIndex: i, sceneNumber: i+1 });
      });
    }
    if (typeof window.yrxPersistAdaptation === 'function') {
      try { window.yrxPersistAdaptation(); } catch(e) {
        try { console.debug('[yt-import] persistAdaptation failed:', e && e.message); } catch(_){}
      }
    }
    return true;
  }
  /* 기존 legacy key 정리 — 한 곳만 source of truth 로 */
  function migrateLegacy() {
    try {
      var p = _proj(); if (!p) return;
      var legacy = p.s1 && p.s1.youtubeReference;
      if (!legacy || (p.s1.youtubeImport && p.s1.youtubeImport.scenes)) return;
      if (legacy.detectedScenes && legacy.detectedScenes.length) {
        /* 기존 remix scenes 를 import packet 으로 승격 */
        var pkt = {
          ok: true, source: 'youtube',
          url: legacy.url || '', videoId: legacy.videoId || '',
          meta: { title: legacy.title || '', channel: '', durationSec: 0,
            thumbnail: legacy.videoId ? 'https://img.youtube.com/vi/'+legacy.videoId+'/hqdefault.jpg' : '', author: '' },
          transcript: [],
          scenes: legacy.detectedScenes.slice(),
          mode: legacy.adaptationMode || 'subtitle_only',
          warnings: ['legacy-migrated'],
          errors: [],
        };
        p.s1.youtubeImport = pkt;
      }
    } catch(_) {}
  }

  /* ════════════════════════════════════════════════
     7) Pipeline runner
        모든 단계의 성공/실패를 packet 에 기록.
        조용한 실패 금지 — errors[]/warnings[] 채움.
     ════════════════════════════════════════════════ */
  async function runImport(opts, onStatus) {
    opts = opts || {};
    var status = _newStatus();
    function _emit() { if (typeof onStatus === 'function') { try { onStatus(status); } catch(_){} } }

    var url = String(opts.url || '').trim();
    var pasted = String(opts.transcript || '').trim();

    var packet = {
      ok: false, source: 'youtube',
      url: url, videoId: '', meta: {},
      transcript: [], scenes: [],
      mode: opts.mode || 'subtitle_only',
      warnings: [], errors: [],
    };

    /* [1/4] URL */
    _setStep(status, 0, 'running'); _emit();
    var vid = extractVideoId(url);
    if (!vid && !pasted) {
      _setStep(status, 0, 'error', 'URL 파싱 실패 + 자막 미입력');
      packet.errors.push({ step:'url', code:'no-video-id-no-paste',
        message:'유튜브 URL 또는 자막 텍스트가 필요합니다.' });
      packet.ok = false; status.done = true; _emit();
      return packet;
    }
    if (vid) {
      packet.videoId = vid;
      packet.url = url;
      packet.meta = await fetchMeta(vid, url);
      _setStep(status, 0, 'ok', '영상 ID: '+vid+(packet.meta.title?' · '+packet.meta.title:''));
    } else {
      _setStep(status, 0, 'warn', 'URL 없음 — 붙여넣은 자막으로만 진행');
      packet.warnings.push({ step:'url', code:'no-url',
        message:'영상 URL 없이 자막만으로 import — iframe 미리보기/타임라인 점프 비활성화' });
    }
    _emit();

    /* [2/4] Transcript */
    _setStep(status, 1, 'running'); _emit();
    var tx = null;
    var txSource = '';
    if (pasted) {
      tx = normalizeTranscript(pasted);
      txSource = 'paste';
    } else if (vid) {
      tx = await fetchServerTranscript(vid);
      if (tx && tx.length) txSource = 'server';
      else {
        tx = await fetchTimedText(vid);
        if (tx && tx.length) txSource = 'timedtext';
      }
    }
    if (!tx || !tx.length) {
      _setStep(status, 1, 'error', '자동 자막 가져오기 실패 — 자막을 붙여넣어 주세요');
      packet.errors.push({ step:'transcript', code:'no-transcript',
        message:'자동 자막 추출 실패 (서버 미설정 / CORS 차단). 유튜브 자막(CC) 또는 SRT/VTT 파일을 붙여넣어 주세요.' });
      packet.ok = false; status.done = true; _emit();
      return packet;
    }
    packet.transcript = tx;
    _setStep(status, 1, 'ok', txSource+' · '+tx.length+' 큐');
    _emit();

    /* [3/4] Scenes */
    _setStep(status, 2, 'running'); _emit();
    var scenes;
    try {
      scenes = splitToScenes(tx, { videoId: vid });
    } catch(e) {
      _setStep(status, 2, 'error', 'scene 분리 실패: '+(e&&e.message));
      packet.errors.push({ step:'scenes', code:'split-failed', message: e&&e.message || 'unknown' });
      packet.ok = false; status.done = true; _emit();
      return packet;
    }
    if (!scenes.length) {
      _setStep(status, 2, 'error', 'scenes.length = 0 — 자막이 너무 짧거나 비었습니다');
      packet.errors.push({ step:'scenes', code:'empty-scenes',
        message:'scene 데이터 생성 실패 — 자막이 너무 짧거나 비어있습니다.' });
      packet.ok = false; status.done = true; _emit();
      return packet;
    }
    packet.scenes = scenes;
    _setStep(status, 2, 'ok', scenes.length+' scene 생성 완료');
    _emit();

    /* [4/4] Keyframes (서버 있으면 시도, 없으면 placeholder) */
    _setStep(status, 3, 'running'); _emit();
    var serverFrames = false;
    if (vid) {
      try { serverFrames = await fetchServerKeyframes(vid, scenes); } catch(_) {}
    }
    var ready = scenes.filter(function(sc){ return sc.previewStatus === 'ready'; }).length;
    var placeholder = scenes.filter(function(sc){ return sc.previewStatus === 'placeholder'; }).length;
    var missing = scenes.filter(function(sc){ return sc.previewStatus === 'missing'; }).length;
    if (!serverFrames && !ready) {
      packet.warnings.push({ step:'keyframes', code:'placeholder-only',
        message:'프레임 추출 서버 없음 — 모든 씬에 영상 썸네일 placeholder 사용 (편집 가능, 다음 단계 진행 가능)' });
      _setStep(status, 3, 'warn', 'placeholder '+placeholder+' / 누락 '+missing+' (서버 미설정)');
    } else {
      _setStep(status, 3, 'ok', '완료 '+ready+' / placeholder '+placeholder+' / 누락 '+missing);
    }
    _emit();

    packet.ok = true;
    status.done = true;
    _emit();
    /* 저장 */
    setYTImport(packet);
    return packet;
  }

  /* ── public API ── */
  window.YT_IMPORT = {
    extractVideoId:    extractVideoId,
    normalizeTranscript: normalizeTranscript,
    splitToScenes:     splitToScenes,
    runImport:         runImport,
    fetchTimedText:    fetchTimedText,
    fetchMeta:         fetchMeta,
    /* storage */
    getImport:    getYTImport,
    setImport:    setYTImport,
    getScenes:    getYTScenes,
    saveScenes:   saveYTScenes,
    migrateLegacy: migrateLegacy,
    /* constants */
    STEPS: STEPS,
    ROLES: ROLES,
  };
})();
