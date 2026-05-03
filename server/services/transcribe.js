/* ================================================
   server/services/transcribe.js
   MP4/오디오 → 자막 segments

   * provider 분기:
       - 'whisper' (기본): OPENAI_API_KEY 사용 → Whisper API
       - 'daglo':           DAGLO_API_KEY 사용 → Daglo STT API
       - 'auto':            daglo → whisper → stub 순으로 fallback
       - 미설정/실패 시:    ffprobe 로 duration 만 읽어 stub 자막 (프론트 흐름 테스트)
   * 키는 서버 환경변수에만 존재 — 프론트에는 노출되지 않음.
   * 입력 파일은 호출자(routes/remix.js)가 multer 임시 디렉토리에 저장 후 처리 끝나면 삭제.
   ================================================ */
'use strict';

const fs   = require('fs');
const path = require('path');
const { execFile } = require('child_process');

let ffmpegStatic;
try { ffmpegStatic = require('ffmpeg-static'); } catch (_) { ffmpegStatic = null; }

let OpenAI;
try { OpenAI = require('openai').OpenAI || require('openai'); } catch (_) { OpenAI = null; }

const DAGLO_BASE_DEFAULT = 'https://apis.daglo.ai';

/* ── ffprobe 로 길이만 ── */
function _ffprobeDuration(filePath) {
  return new Promise((resolve) => {
    if (!ffmpegStatic) return resolve(0);
    /* ffmpeg-static 의 ffmpeg 경로에서 ffprobe 가 같은 디렉토리에 있을 거라 가정 */
    const ffprobe = ffmpegStatic.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
    execFile(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath],
      { timeout: 15000 },
      (err, stdout) => {
        if (err) return resolve(0);
        const sec = parseFloat(String(stdout || '').trim());
        resolve(isFinite(sec) ? sec : 0);
      });
  });
}

/* ── stub transcript: duration 을 5초씩 나눠서 placeholder 자막 ── */
async function _stubSegments(filePath) {
  const dur = await _ffprobeDuration(filePath) || 60;
  const segs = [];
  let i = 0;
  for (let t = 0; t < dur; t += 5) {
    segs.push({
      startSec: t,
      endSec:   Math.min(dur, t + 5),
      text:     '[stub] 씬 ' + (i + 1) + ' (자막 자동 추출 미설정 — STT API 키를 환경변수에 설정하세요: OPENAI_API_KEY 또는 DAGLO_API_KEY)',
    });
    i++;
  }
  return { language: 'stub', durationSec: Math.round(dur), segments: segs, source: 'stub', provider: 'stub' };
}

/* ── Whisper (OpenAI) 호출 ── */
async function _whisperSegments(filePath, opts) {
  if (!OpenAI) {
    const e = new Error('openai 모듈 미설치 — npm install 을 실행하세요.');
    e.code = 'NO_OPENAI_LIB';
    throw e;
  }
  if (!process.env.OPENAI_API_KEY) {
    const e = new Error('OPENAI_API_KEY 미설정');
    e.code = 'NO_OPENAI_KEY';
    throw e;
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const stream = fs.createReadStream(filePath);
  const params = {
    file: stream,
    model: 'whisper-1',
    response_format: 'verbose_json',
  };
  if (opts && opts.language) params.language = opts.language;
  const r = await client.audio.transcriptions.create(params);
  /* verbose_json 은 segments 를 포함 */
  const segs = (r.segments || []).map(s => ({
    startSec: +s.start || 0,
    endSec:   +s.end   || 0,
    text:     String(s.text || '').trim(),
  })).filter(s => s.text);
  return {
    language: r.language || (opts && opts.language) || 'auto',
    durationSec: Math.round(r.duration || 0),
    segments: segs,
    source: 'whisper',
    provider: 'whisper',
  };
}

/* ── Daglo STT 호출 ──
     공식 한국어 STT 서비스 (https://daglo.ai). 동기 transcribe 엔드포인트는
     없을 수 있어 비동기 작업 + polling 패턴이 일반적. 본 어댑터는 단순화된 형태로
     multipart 업로드 후 즉시 segments 를 받는다고 가정. 실제 응답 형식이 다르면
     DAGLO_API_BASE / DAGLO_API_PATH 환경변수로 endpoint 경로를 조정하고 응답
     매핑은 이 함수에서 변경해 주세요.
     필수 환경변수:
       DAGLO_API_KEY       — Bearer 토큰
       DAGLO_API_BASE      — (선택) 기본 https://apis.daglo.ai
       DAGLO_API_PATH      — (선택) 기본 /transcribe
       DAGLO_API_FIELD     — (선택) multipart 파일 필드명 — 기본 'file'
*/
async function _dagloSegments(filePath, opts) {
  if (!process.env.DAGLO_API_KEY) {
    const e = new Error('DAGLO_API_KEY 미설정');
    e.code = 'NO_DAGLO_KEY';
    throw e;
  }
  const base  = (process.env.DAGLO_API_BASE  || DAGLO_BASE_DEFAULT).replace(/\/$/, '');
  const ep    = process.env.DAGLO_API_PATH   || '/transcribe';
  const field = process.env.DAGLO_API_FIELD  || 'file';

  /* node 18+ 의 글로벌 fetch / FormData / Blob 사용 */
  if (typeof fetch !== 'function' || typeof FormData !== 'function' || typeof Blob !== 'function') {
    const e = new Error('Node 18+ 의 fetch/FormData/Blob 이 필요합니다.');
    e.code = 'NO_NATIVE_FETCH';
    throw e;
  }

  const buf = fs.readFileSync(filePath);
  const fd = new FormData();
  fd.append(field, new Blob([buf]), path.basename(filePath));
  if (opts && opts.language) fd.append('language', opts.language);

  let r;
  try {
    r = await fetch(base + ep, {
      method:  'POST',
      headers: { 'Authorization': 'Bearer ' + process.env.DAGLO_API_KEY },
      body:    fd,
    });
  } catch (e) {
    const err = new Error('Daglo 네트워크 오류: ' + (e && e.message || ''));
    err.code = 'DAGLO_NETWORK_FAIL';
    throw err;
  }

  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    const err = new Error('Daglo HTTP ' + r.status + (txt ? (' — ' + txt.slice(0, 200)) : ''));
    err.code = (r.status === 401 || r.status === 403) ? 'DAGLO_AUTH_FAIL' : 'DAGLO_HTTP_FAIL';
    throw err;
  }

  let body;
  try { body = await r.json(); }
  catch (_) {
    const err = new Error('Daglo 응답 JSON 파싱 실패');
    err.code = 'DAGLO_PARSE_FAIL';
    throw err;
  }

  /* 다양한 응답 schema 를 segments 로 변환 시도:
     1) { segments: [{ start, end, text }] }
     2) { result: { segments: [...] } } 또는 { result: { transcript: [...] } }
     3) { transcript: [...] } 또는 { utterances: [...] }
     4) 단일 텍스트 — segments 없이 전체 텍스트만 → 5초 단위로 쪼갬 */
  function _normalizeOne(seg) {
    return {
      startSec: +(seg.start || seg.startSec || seg.startTime || seg.tStart || 0) || 0,
      endSec:   +(seg.end   || seg.endSec   || seg.endTime   || seg.tEnd   || 0) || 0,
      text:     String(seg.text || seg.transcript || seg.content || '').trim(),
    };
  }
  let raw = [];
  if (Array.isArray(body.segments)) raw = body.segments;
  else if (body.result && Array.isArray(body.result.segments)) raw = body.result.segments;
  else if (body.result && Array.isArray(body.result.transcript)) raw = body.result.transcript;
  else if (Array.isArray(body.transcript)) raw = body.transcript;
  else if (Array.isArray(body.utterances)) raw = body.utterances;

  let segs = raw.map(_normalizeOne).filter(s => s.text);

  if (!segs.length && typeof body.text === 'string' && body.text.trim()) {
    /* segments 가 없는 경우 — 전체 텍스트를 균등 분할 */
    const dur = await _ffprobeDuration(filePath) || 60;
    const sentences = body.text.split(/(?<=[.!?。、！？])\s+/).map(s => s.trim()).filter(Boolean);
    const step = sentences.length > 0 ? dur / sentences.length : 5;
    segs = sentences.map((t, i) => ({
      startSec: +(i * step).toFixed(2),
      endSec:   +Math.min(dur, (i + 1) * step).toFixed(2),
      text:     t,
    }));
  }

  /* end 가 0/누락이면 다음 segment start 로 보정, 마지막은 +4초 */
  for (let i = 0; i < segs.length; i++) {
    if (!segs[i].endSec || segs[i].endSec <= segs[i].startSec) {
      segs[i].endSec = (i + 1 < segs.length ? segs[i + 1].startSec : segs[i].startSec + 4);
    }
  }

  return {
    language: (opts && opts.language) || body.language || 'ko',
    durationSec: Math.round(body.durationSec || body.duration || 0),
    segments: segs,
    source: 'daglo',
    provider: 'daglo',
  };
}

/* ── public entrypoint ──
     opts: { language, provider }
       provider: 'auto' (기본) | 'whisper' | 'daglo'
*/
async function run(filePath, opts) {
  opts = opts || {};
  const requested = String(opts.provider || 'auto').toLowerCase();

  /* 명시적으로 daglo 요청 */
  if (requested === 'daglo') {
    if (process.env.DAGLO_API_KEY) {
      try { return await _dagloSegments(filePath, opts); }
      catch (e) {
        console.error('[transcribe] daglo failed:', e && e.message);
        /* 명시 요청은 자동 폴백 안 함 — 상위에 에러 전달 */
        throw e;
      }
    } else {
      const e = new Error('DAGLO_API_KEY 미설정');
      e.code = 'NO_DAGLO_KEY';
      throw e;
    }
  }

  /* 명시적으로 whisper 요청 */
  if (requested === 'whisper') {
    if (process.env.OPENAI_API_KEY && OpenAI) {
      try { return await _whisperSegments(filePath, opts); }
      catch (e) {
        console.error('[transcribe] whisper failed:', e && e.message);
        throw e;
      }
    } else {
      const e = new Error('OPENAI_API_KEY 미설정 또는 openai 모듈 미설치');
      e.code = 'NO_OPENAI_KEY';
      throw e;
    }
  }

  /* auto: daglo → whisper → stub 순서 */
  if (process.env.DAGLO_API_KEY) {
    try { return await _dagloSegments(filePath, opts); }
    catch (e) {
      console.error('[transcribe] daglo failed, trying whisper:', e && e.message);
    }
  }
  if (process.env.OPENAI_API_KEY && OpenAI) {
    try { return await _whisperSegments(filePath, opts); }
    catch (e) {
      console.error('[transcribe] whisper failed, falling back to stub:', e && e.message);
    }
  }
  return await _stubSegments(filePath);
}

module.exports = { run };
