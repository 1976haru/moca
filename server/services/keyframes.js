/* ================================================
   server/services/keyframes.js
   ffmpeg 으로 scene midSec 시점 프레임 추출
   ================================================ */
'use strict';

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

let ffmpegStatic;
try { ffmpegStatic = require('ffmpeg-static'); } catch (_) { ffmpegStatic = null; }

function _ffmpegBin() {
  return ffmpegStatic || 'ffmpeg';
}

function _runFfmpeg(args, timeoutMs) {
  return new Promise((resolve, reject) => {
    execFile(_ffmpegBin(), args, { timeout: timeoutMs || 20000 }, (err, _stdout, stderr) => {
      if (err) {
        const e = new Error(stderr ? String(stderr).slice(-400) : err.message);
        e.code = 'FFMPEG_FAIL';
        return reject(e);
      }
      resolve();
    });
  });
}

/* scenes: [{ sceneIndex, startSec, endSec }]
   opts: { framesDir, baseUrl } */
async function extract(videoPath, scenes, opts) {
  if (!ffmpegStatic) {
    const e = new Error('ffmpeg-static 미설치 — server/ 에서 npm install 을 실행하세요.');
    e.code = 'FFMPEG_FAIL';
    throw e;
  }
  const framesDir = opts.framesDir;
  const baseUrl   = (opts.baseUrl || '').replace(/\/$/, '');
  try { fs.mkdirSync(framesDir, { recursive: true }); } catch (_) {}

  const session = crypto.randomBytes(6).toString('hex');
  const out = [];
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    const startSec = Math.max(0, +sc.startSec || 0);
    const endSec   = Math.max(startSec, +sc.endSec || (startSec + 4));
    const midSec   = (startSec + endSec) / 2;
    const fname    = 'frame_' + session + '_' + String(sc.sceneIndex != null ? sc.sceneIndex : i).padStart(3, '0') + '.jpg';
    const fpath    = path.join(framesDir, fname);
    try {
      await _runFfmpeg([
        '-ss', String(midSec), '-i', videoPath,
        '-frames:v', '1', '-q:v', '4', '-vf', 'scale=480:-1',
        '-y', fpath,
      ]);
      out.push({
        sceneIndex: sc.sceneIndex != null ? sc.sceneIndex : i,
        startSec:   startSec,
        endSec:     endSec,
        imageUrl:   baseUrl + '/static/frames/' + fname,
      });
    } catch (e) {
      out.push({
        sceneIndex: sc.sceneIndex != null ? sc.sceneIndex : i,
        startSec:   startSec,
        endSec:     endSec,
        imageUrl:   '',
        error:      e.message,
      });
    }
  }
  return out;
}

module.exports = { extract };
