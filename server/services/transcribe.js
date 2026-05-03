/* ================================================
   server/services/transcribe.js
   MP4/오디오 → 자막 segments
   * OPENAI_API_KEY 가 있으면 Whisper 호출
   * 없으면 ffprobe 로 duration 만 읽어 stub 자막 생성 — 프론트 흐름 테스트 용
   ================================================ */
'use strict';

const fs   = require('fs');
const path = require('path');
const { execFile } = require('child_process');

let ffmpegStatic;
try { ffmpegStatic = require('ffmpeg-static'); } catch (_) { ffmpegStatic = null; }

let OpenAI;
try { OpenAI = require('openai').OpenAI || require('openai'); } catch (_) { OpenAI = null; }

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
      text:     '[stub] 씬 ' + (i + 1) + ' (자막 자동 추출 미설정 — OPENAI_API_KEY 를 설정하면 실제 음성 인식이 동작)',
    });
    i++;
  }
  return { language: 'stub', durationSec: Math.round(dur), segments: segs, source: 'stub' };
}

/* ── Whisper 호출 ── */
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
  };
}

async function run(filePath, opts) {
  if (process.env.OPENAI_API_KEY && OpenAI) {
    try { return await _whisperSegments(filePath, opts); }
    catch (e) {
      console.error('[transcribe] whisper failed, falling back to stub:', e && e.message);
      return await _stubSegments(filePath);
    }
  }
  return await _stubSegments(filePath);
}

module.exports = { run };
