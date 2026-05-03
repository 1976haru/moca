/* ================================================
   server/services/youtubePublicTranscript.js
   영상 리믹스 스튜디오 — 공개 자막 보조 추출 (실험 기능)

   * 영상 파일/오디오 다운로드 금지 — 자막 텍스트만 처리.
   * captions.download (OAuth) 와는 완전히 분리된 fallback 경로.
   * 실패 가능성을 전제로 명확한 error code 반환.
   * 추출 시도 순서:
       1) watch 페이지 HTML → ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks
       2) timedtext endpoint 직접 시도 (ko/Korean/ja/Japanese/en/English)
       3) 선택된 track 의 baseUrl 을 fetch → XML/SRV3 parse → segments
   ================================================ */
'use strict';

const TIMEDTEXT_BASE = 'https://www.youtube.com/api/timedtext';
const WATCH_BASE     = 'https://www.youtube.com/watch';

const LANG_PRIORITY = ['ko', 'ja', 'en'];
const LANG_ALIASES  = {
  ko:       ['ko', 'Korean'],
  Korean:   ['ko', 'Korean'],
  ja:       ['ja', 'Japanese'],
  Japanese: ['ja', 'Japanese'],
  en:       ['en', 'English'],
  English:  ['en', 'English'],
};

/* ── HTML/XML entity decode ── */
function _decodeEntities(s) {
  return String(s == null ? '' : s)
    .replace(/&#(\d+);/g,        (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi,(_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/* ── 텍스트 정리 — 줄바꿈/중복공백/태그 제거 ── */
function _cleanText(raw) {
  return _decodeEntities(String(raw || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\r\n?|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

function _err(code, message, extra) {
  return Object.assign({ ok: false, error: code, message: message }, extra || {});
}
function _ok(obj) { return Object.assign({ ok: true }, obj || {}); }

/* ── XML/timedtext parser ──
     <transcript><text start="0" dur="3.4">...</text>...</transcript> */
function _parseTimedTextXml(xml) {
  const out = [];
  if (!xml || typeof xml !== 'string') return out;
  const rx = /<text\s+([^>]*?)>([\s\S]*?)<\/text>/g;
  let m;
  while ((m = rx.exec(xml)) !== null) {
    const attrs = m[1] || '';
    const startMatch = attrs.match(/\bstart="([\d.]+)"/);
    const durMatch   = attrs.match(/\bdur="([\d.]+)"/);
    const start = startMatch ? parseFloat(startMatch[1]) : 0;
    const dur   = durMatch   ? parseFloat(durMatch[1])   : 0;
    const text  = _cleanText(m[2] || '');
    if (!text) continue;
    const end = dur > 0 ? start + dur : start + 4;
    out.push({ startSec: start, endSec: end, text });
  }
  /* end 가 없는 경우(또는 0) — 다음 segment start 로 보정 */
  for (let i = 0; i < out.length - 1; i++) {
    if (!out[i].endSec || out[i].endSec <= out[i].startSec) {
      out[i].endSec = out[i + 1].startSec;
    }
  }
  return out;
}

/* ── SRV3 (JSON-ish) format parser fallback ──
     일부 timedtext URL 은 fmt=srv3 / fmt=json3 응답을 지원.
     본 함수는 최소한의 events[] 배열을 처리. */
function _parseJson3(text) {
  let j;
  try { j = JSON.parse(text); } catch (_) { return []; }
  const events = (j && j.events) || [];
  const out = [];
  for (const ev of events) {
    if (!ev || !ev.segs) continue;
    const startMs = ev.tStartMs || 0;
    const durMs   = ev.dDurationMs || 0;
    const text = _cleanText((ev.segs || []).map(s => s.utf8 || '').join(''));
    if (!text) continue;
    out.push({
      startSec: startMs / 1000,
      endSec:   (startMs + (durMs || 4000)) / 1000,
      text,
    });
  }
  return out;
}

/* ── User-Agent (watch page 가 봇 차단을 줄이기 위해) ── */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
           '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function _fetchText(url, opts) {
  opts = opts || {};
  let r;
  try {
    r = await fetch(url, {
      method: 'GET',
      headers: Object.assign({
        'User-Agent':       UA,
        'Accept-Language':  'en-US,en;q=0.9,ko;q=0.8,ja;q=0.7',
      }, opts.headers || {}),
      redirect: 'follow',
    });
  } catch (e) {
    return { ok: false, status: 0, error: 'NETWORK_FAIL', message: e && e.message || 'fetch failed' };
  }
  if (!r.ok) {
    return { ok: false, status: r.status, error: r.status === 404 ? 'VIDEO_NOT_FOUND' : 'CAPTION_FETCH_BLOCKED', message: 'HTTP ' + r.status };
  }
  let body;
  try { body = await r.text(); } catch (e) { return { ok: false, status: r.status, error: 'NETWORK_FAIL', message: e.message }; }
  return { ok: true, status: r.status, body };
}

/* ── ytInitialPlayerResponse 추출 (watch page HTML) ── */
function _extractPlayerResponse(html) {
  if (!html) return null;
  /* var ytInitialPlayerResponse = {...}; */
  const m = html.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]+?})\s*;\s*(?:var|<\/script>|window\[)/) ||
            html.match(/"playerResponse"\s*:\s*"([^"]+)"/);
  if (!m) return null;
  try {
    if (m[1].startsWith('{')) return JSON.parse(m[1]);
    /* embedded JSON string — unescape */
    const unesc = m[1].replace(/\\u0026/g, '&').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    return JSON.parse(unesc);
  } catch (_) {
    /* try a more lenient slice */
    try {
      const start = html.indexOf('ytInitialPlayerResponse');
      if (start < 0) return null;
      const eq = html.indexOf('{', start);
      if (eq < 0) return null;
      let depth = 0;
      for (let i = eq; i < Math.min(html.length, eq + 2_000_000); i++) {
        const c = html[i];
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) {
          const slice = html.slice(eq, i + 1);
          return JSON.parse(slice);
        } }
      }
    } catch (_) {}
    return null;
  }
}

/* ── 우선순위 기반 track 선택 ── */
function _pickTrack(tracks, preferred) {
  if (!Array.isArray(tracks) || !tracks.length) return null;
  const order = [];
  if (preferred) {
    const aliases = LANG_ALIASES[preferred] || [preferred];
    aliases.forEach(a => { if (!order.includes(a)) order.push(a); });
  }
  LANG_PRIORITY.forEach(code => {
    (LANG_ALIASES[code] || [code]).forEach(a => { if (!order.includes(a)) order.push(a); });
  });

  for (const code of order) {
    const lc = String(code).toLowerCase();
    const found = tracks.find(t => {
      const langCode = String(t.languageCode || '').toLowerCase();
      const name     = (t.name && (t.name.simpleText || t.name.runs && t.name.runs[0] && t.name.runs[0].text)) || '';
      return langCode === lc ||
             langCode.startsWith(lc + '-') ||
             String(name).toLowerCase() === lc;
    });
    if (found) return found;
  }
  /* 1순위 후보 없으면 첫 번째 — manual track 우선 (kind 없는 것) */
  const manual = tracks.find(t => !t.kind || t.kind !== 'asr');
  return manual || tracks[0];
}

/* ── 1순위: timedtext endpoint 직접 시도 ── */
async function _tryDirectTimedText(videoId) {
  for (const lang of LANG_PRIORITY) {
    const url = TIMEDTEXT_BASE + '?lang=' + encodeURIComponent(lang) + '&v=' + encodeURIComponent(videoId);
    const r = await _fetchText(url);
    if (!r.ok) continue;
    if (!r.body || r.body.indexOf('<text') < 0) continue;
    const segs = _parseTimedTextXml(r.body);
    if (segs.length) {
      return { ok: true, language: lang, isAutoGenerated: false, segments: segs, rawFormat: 'timedtext' };
    }
  }
  return null;
}

/* ── 2순위: watch 페이지 → captionTracks ── */
async function _tryWatchPageTracks(videoId, opts) {
  const watchUrl = WATCH_BASE + '?v=' + encodeURIComponent(videoId) + '&hl=en';
  const r = await _fetchText(watchUrl);
  if (!r.ok) return r;
  const pr = _extractPlayerResponse(r.body);
  if (!pr) return _err('PARSE_FAILED', 'ytInitialPlayerResponse 를 찾지 못했습니다.');
  /* 비공개·삭제 영상 — playabilityStatus.status 가 ERROR / UNPLAYABLE 등 */
  const ps = pr.playabilityStatus || {};
  if (ps.status && ps.status !== 'OK' && ps.status !== 'LOGIN_REQUIRED') {
    if (ps.status === 'ERROR') {
      return _err('VIDEO_NOT_FOUND', '영상을 찾을 수 없습니다 (' + (ps.reason || ps.status) + ')');
    }
    return _err('POLICY_RESTRICTED', '재생 제한 영상입니다 (' + (ps.reason || ps.status) + ')');
  }
  const tl = pr.captions && pr.captions.playerCaptionsTracklistRenderer;
  const tracks = (tl && tl.captionTracks) || [];
  if (!tracks.length) {
    return _err('NO_PUBLIC_CAPTIONS', '이 영상에서 공개 자막을 찾지 못했습니다.');
  }
  const pick = _pickTrack(tracks, opts && opts.language);
  if (!pick || !pick.baseUrl) {
    return _err('CAPTION_TRACK_NOT_FOUND', '사용할 수 있는 자막 트랙이 없습니다.');
  }

  /* baseUrl 호출 — 기본은 XML, fmt=json3 도 시도 */
  const xmlRes = await _fetchText(pick.baseUrl);
  let segments = [];
  if (xmlRes.ok && xmlRes.body) segments = _parseTimedTextXml(xmlRes.body);

  if (!segments.length) {
    /* json3 시도 */
    const j3Url = pick.baseUrl + (pick.baseUrl.indexOf('?') >= 0 ? '&' : '?') + 'fmt=json3';
    const jr = await _fetchText(j3Url);
    if (jr.ok && jr.body) segments = _parseJson3(jr.body);
  }
  if (!segments.length) {
    return _err('PARSE_FAILED', '자막 트랙을 받았지만 파싱에 실패했습니다.');
  }

  return _ok({
    language:        pick.languageCode || (pick.name && pick.name.simpleText) || '',
    isAutoGenerated: pick.kind === 'asr',
    segments:        segments,
    rawFormat:       'timedtext',
  });
}

/* ── 메인 ── */
async function getPublicTranscript(videoId, opts) {
  if (!videoId || !/^[A-Za-z0-9_-]{6,}$/.test(videoId)) {
    return _err('INVALID_URL', '유효한 videoId 가 필요합니다.');
  }
  opts = opts || {};

  /* 1) watch 페이지에서 captionTracks 먼저 시도 (정확도 높음) */
  const a = await _tryWatchPageTracks(videoId, opts);
  if (a && a.ok) {
    return _ok({
      source:          'youtube_public_caption',
      videoId:         videoId,
      language:        a.language,
      isAutoGenerated: a.isAutoGenerated,
      segments:        a.segments,
      rawFormat:       a.rawFormat,
    });
  }

  /* 2) watch 페이지가 막혔다면 timedtext 직접 시도 (실패 가능성 큼) */
  if (!a || a.error === 'NO_PUBLIC_CAPTIONS' || a.error === 'PARSE_FAILED' ||
      a.error === 'CAPTION_FETCH_BLOCKED' || a.error === 'NETWORK_FAIL') {
    const b = await _tryDirectTimedText(videoId);
    if (b && b.ok) {
      return _ok({
        source:          'youtube_public_caption',
        videoId:         videoId,
        language:        b.language,
        isAutoGenerated: b.isAutoGenerated,
        segments:        b.segments,
        rawFormat:       b.rawFormat,
      });
    }
  }

  /* 모두 실패 — a 의 가장 구체적인 에러를 반환 */
  if (a && !a.ok) return a;
  return _err('NO_PUBLIC_CAPTIONS', '이 영상에서 공개 자막을 찾지 못했습니다.');
}

module.exports = {
  getPublicTranscript,
  _parseTimedTextXml,  /* 테스트용 노출 */
  _parseJson3,
  _decodeEntities,
};
