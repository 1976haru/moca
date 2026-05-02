/* ================================================
   modules/studio/s1-youtube-remix-parser.js
   유튜브 레퍼런스 리믹스 — 자막/대본 파서
   * extractVideoId — youtube.com/watch / shorts / youtu.be 지원
   * parseTranscriptToScenes — timestamp / 빈줄 / 문장 단위 분해
   * 각 scene 에 role / shotType / captionLength / cutRhythm 휴리스틱 부여
   ================================================ */
(function(){
  'use strict';

  var ROLES = [
    { id:'hook',      label:'훅' },
    { id:'setup',     label:'상황 설명' },
    { id:'evidence',  label:'예시/증거' },
    { id:'reveal',    label:'반전/핵심' },
    { id:'cta',       label:'CTA' },
  ];
  var SHOT_TYPES = [
    { id:'person',    label:'인물' },
    { id:'character', label:'캐릭터' },
    { id:'product',   label:'제품' },
    { id:'caption',   label:'자막 중심' },
    { id:'archive',   label:'자료화면' },
    { id:'stock',     label:'스톡/배경' },
    { id:'animation', label:'애니메이션' },
  ];

  /* ── 영상 ID 추출 ── */
  function extractVideoId(url) {
    if (!url) return '';
    var s = String(url).trim();
    if (!s) return '';
    /* youtu.be/<id> */
    var m = s.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
    if (m) return m[1];
    /* youtube.com/shorts/<id> */
    m = s.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/);
    if (m) return m[1];
    /* youtube.com/watch?v=<id> */
    m = s.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
    if (m) return m[1];
    /* youtube.com/embed/<id> */
    m = s.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/);
    if (m) return m[1];
    /* 마지막 — 그냥 11자리 ID 만 있는 경우 */
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
    return '';
  }

  /* ── 시간 표기 파싱 ── */
  function _parseTimestamp(str) {
    if (!str) return null;
    var s = String(str).trim();
    /* 00:00:12.345 / 0:12 / 1:23:45 */
    var m = s.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:[.,](\d{1,3}))?$/);
    if (!m) return null;
    var h = m[3] ? parseInt(m[1], 10) : 0;
    var min = m[3] ? parseInt(m[2], 10) : parseInt(m[1], 10);
    var sec = m[3] ? parseInt(m[3], 10) : parseInt(m[2], 10);
    return (h * 3600 + min * 60 + sec) || 0;
  }
  function _formatTimestamp(secs) {
    if (secs == null || isNaN(secs)) return '';
    var s = Math.max(0, Math.round(secs));
    var m = Math.floor(s / 60);
    var ss = s % 60;
    return m + ':' + (ss < 10 ? '0' + ss : ss);
  }

  /* ── 자막/대본 → 씬 분해 ──
     입력 형식:
       1) "00:12 안녕하세요"  (시간 + 본문)
       2) "[00:12] 안녕하세요"
       3) "00:12 -> 00:18\n안녕하세요"  (SRT/VTT 류)
       4) 일반 문장 — 빈 줄 또는 마침표 기준 */
  function parseTranscriptToScenes(text, opts) {
    opts = opts || {};
    var src = String(text || '').replace(/\r\n?/g, '\n').trim();
    if (!src) return [];

    /* 1) timestamp 라인 우선 */
    var withTs = _tryTimestampSplit(src);
    if (withTs && withTs.length >= 2) return withTs.map(function(sc, i){ return _normalize(sc, i, withTs.length); });

    /* 2) 빈 줄 분리 */
    var blocks = src.split(/\n\s*\n+/).map(function(b){ return b.trim(); }).filter(Boolean);
    if (blocks.length >= 2 && blocks.length <= 24) {
      return blocks.map(function(b, i){
        return _normalize({ text: b, sceneIndex: i, sceneNumber: i + 1 }, i, blocks.length);
      });
    }

    /* 3) 문장 단위 — 4~6 씬 정도로 묶기 */
    var sentences = src.split(/(?<=[.!?。！？])\s+/).map(function(s){ return s.trim(); }).filter(Boolean);
    if (sentences.length === 0) {
      return [_normalize({ text: src, sceneIndex: 0, sceneNumber: 1 }, 0, 1)];
    }
    var target = Math.min(8, Math.max(3, Math.round(sentences.length / 2)));
    var perScene = Math.max(1, Math.ceil(sentences.length / target));
    var out = [];
    for (var i = 0; i < sentences.length; i += perScene) {
      var chunk = sentences.slice(i, i + perScene).join(' ');
      out.push(_normalize({ text: chunk, sceneIndex: out.length, sceneNumber: out.length + 1 }, out.length, target));
    }
    return out;
  }

  function _tryTimestampSplit(src) {
    var lines = src.split('\n');
    var rxLine = /^\[?(\d{1,2}:\d{1,2}(?::\d{1,2})?)\]?\s*(?:->|→|~|-)\s*\[?(\d{1,2}:\d{1,2}(?::\d{1,2})?)\]?\s*(.*)$/;
    var rxLead = /^\[?(\d{1,2}:\d{1,2}(?::\d{1,2})?)\]?\s+(.+)$/;

    var scenes = [];
    var current = null;
    var hasAny = false;
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i].trim();
      if (!ln) continue;
      var m = ln.match(rxLine);
      if (m) {
        hasAny = true;
        if (current) scenes.push(current);
        current = {
          startSec: _parseTimestamp(m[1]),
          endSec:   _parseTimestamp(m[2]),
          text:     (m[3] || '').trim(),
        };
        continue;
      }
      m = ln.match(rxLead);
      if (m) {
        hasAny = true;
        if (current) scenes.push(current);
        current = {
          startSec: _parseTimestamp(m[1]),
          endSec:   null,
          text:     (m[2] || '').trim(),
        };
        continue;
      }
      if (current) {
        current.text = (current.text + ' ' + ln).trim();
      }
    }
    if (current) scenes.push(current);
    if (!hasAny || !scenes.length) return null;
    /* end 추정 — 다음 씬 start 또는 +5초 */
    for (var j = 0; j < scenes.length; j++) {
      if (scenes[j].endSec == null) {
        scenes[j].endSec = j + 1 < scenes.length && scenes[j+1].startSec != null
          ? scenes[j+1].startSec : (scenes[j].startSec || 0) + 5;
      }
    }
    return scenes.map(function(sc, i){
      return { text: sc.text, startSec: sc.startSec, endSec: sc.endSec, sceneIndex: i, sceneNumber: i + 1 };
    });
  }

  /* ── 역할/샷타입 휴리스틱 ── */
  function _guessRole(text, idx, total) {
    var t = String(text || '').toLowerCase();
    if (idx === 0) return 'hook';
    if (idx === total - 1) {
      if (/구독|좋아요|팔로우|チャンネル|登録|フォロー/i.test(text)) return 'cta';
      return 'cta';
    }
    if (/그런데|그러나|반전|놀랍게|意外|でも|しかし/i.test(text)) return 'reveal';
    if (/예를 들면|예시|실제로|たとえば|実は/i.test(t)) return 'evidence';
    return idx === 1 ? 'setup' : 'evidence';
  }
  function _guessShot(text) {
    var t = String(text || '').toLowerCase();
    if (/사진|이미지|화면|캡션|자막|글자/.test(t)) return 'caption';
    if (/제품|상품|브랜드|로고/.test(t)) return 'product';
    if (/자료|뉴스|통계|차트|그래프/.test(t)) return 'archive';
    if (/배경|풍경|도시|하늘/.test(t)) return 'stock';
    if (/캐릭터|동물|애니/.test(t)) return 'character';
    if (/그/.test(t) && /씨|할머니|할아버지|선생|박사/.test(t)) return 'person';
    return 'person';
  }
  function _captionLength(text) {
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

  /* ── 씬 정규화 ── */
  function _normalize(raw, idx, total) {
    var text = String(raw.text || '').trim();
    var roleId = _guessRole(text, idx, total);
    var shotId = _guessShot(text);
    var startSec = raw.startSec != null ? raw.startSec : idx * 4;
    var endSec   = raw.endSec   != null ? raw.endSec   : startSec + 4;
    return {
      sceneIndex:    idx,
      sceneNumber:   idx + 1,
      startSec:      startSec,
      endSec:        endSec,
      timeRange:     _formatTimestamp(startSec) + '~' + _formatTimestamp(endSec),
      original:      text,
      originalCaption: text,
      role:          roleId,
      roleLabel:     (ROLES.find(function(r){ return r.id === roleId; }) || {}).label || '',
      shotType:      shotId,
      shotTypeLabel: (SHOT_TYPES.find(function(s){ return s.id === shotId; }) || {}).label || '',
      captionLength: _captionLength(text),
      cutRhythm:     _cutRhythm(text),
      keepNote:      '',
      avoidNote:     '',
      /* 각색본 — 비어있으면 Step 2 send 시 원본을 fallback */
      adaptedNarration: '',
      adaptedCaption:   '',
      captionKo:        '',
      captionJa:        '',
      captionBoth:      '',
      visualDescription:'',
      imagePrompt:      '',
      videoPrompt:      '',
    };
  }

  window.YT_REMIX_PARSER = {
    extractVideoId:        extractVideoId,
    parseTranscriptToScenes: parseTranscriptToScenes,
    formatTimestamp:       _formatTimestamp,
    ROLES:                 ROLES,
    SHOT_TYPES:            SHOT_TYPES,
  };
})();
