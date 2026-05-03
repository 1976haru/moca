/* ================================================
   modules/remix/rm-longform-score.js
   롱폼 → 숏폼 후보 점수 (0~100)
   7 가지 sub-score: 훅 강도 / 독립성 / 자막 가독성 / 정보 밀도 /
                     감정·반전 / 길이 적합성 / CTA 가능성
   외부 API 호출 없음 — 결정적 규칙 기반.
   ================================================ */
(function(){
  'use strict';

  /* ── 가중치 (총합 100) ── */
  var W = {
    hook:      22,  /* 훅 강도 */
    standalone:14,  /* 독립성 (다른 맥락 없이 이해 가능) */
    readable:  12,  /* 자막 가독성 (문장당 길이) */
    density:   16,  /* 정보 밀도 */
    emotion:   12,  /* 감정·반전 */
    duration:  12,  /* 길이 적합성 (15~60s) */
    cta:       12,  /* CTA 가능성 */
  };

  /* ── 한국어/일본어/영어 패턴 ── */
  var HOOK_PAT      = /[?!？！]|왜|어떻게|혹시|믿|놀라|충격|모르|아세요|아십|どうして|なぜ|本当|信じ|why|how|did you know/i;
  var REVEAL_PAT    = /그런데|그러나|반전|놀랍게|意外|しかし|でも|but|however|actually|in fact|surprisingly/i;
  var EMOTION_PAT   = /감동|눈물|사연|마음|울|嬉し|涙|悲|心|感動|emotional|tears|cry|heart/i;
  var INFO_PAT      = /알려|알아|팁|비결|방법|이유|첫째|둘째|셋째|첫\s*번째|두\s*번째|how to|tip|reason|because/i;
  var CTA_PAT       = /구독|좋아요|팔로우|채널|알림|チャンネル|登録|フォロー|subscribe|follow/i;
  var QUESTION_PAT  = /\?|？|까요|할까|있을까|있나|있을지/;
  var FILLER_PAT    = /음|어|에|그|아|네|예|뭐|에이|오|うん|ええ|あの|あ|um|uh|like|you know/g;

  /* ── 한 candidate 평가 ──
     candidate = { startSec, endSec, text, cues:[{startSec,endSec,text}] } */
  function evaluate(candidate) {
    var cues = candidate.cues || [];
    var text = candidate.text || cues.map(function(c){ return c.text; }).join(' ');
    var dur  = (candidate.endSec || 0) - (candidate.startSec || 0);
    var firstCue = cues[0] || { text: '' };
    var lastCue  = cues[cues.length - 1] || { text: '' };
    var firstText = String(firstCue.text || '');
    var lastText  = String(lastCue.text  || '');

    var sub = {};
    var reasons = [];

    /* 1) hook — 첫 1~2 cue 에 훅 패턴 */
    sub.hook = 0;
    var hookProbe = (firstText + ' ' + (cues[1] && cues[1].text || '')).slice(0, 80);
    if (HOOK_PAT.test(hookProbe))      { sub.hook += W.hook * 0.7; reasons.push('첫 줄에 훅 키워드'); }
    if (QUESTION_PAT.test(firstText))  { sub.hook += W.hook * 0.3; }
    if (firstText.length <= 30)        { sub.hook += W.hook * 0.2; }
    if (sub.hook > W.hook) sub.hook = W.hook;

    /* 2) standalone — 자체 완결성 (대명사/외부 참조 적게) */
    sub.standalone = W.standalone;
    var dangling = (text.match(/그것|그게|이게|저것|그|이|저\s+\w/g) || []).length;
    if (dangling > 4) sub.standalone -= 4;
    if (text.length < 50) sub.standalone -= 6;
    if (sub.standalone < 0) sub.standalone = 0;

    /* 3) readable — 문장당 평균 길이 */
    var sentences = text.split(/[.!?。！？]+/).filter(function(s){ return s.trim().length; });
    var avgLen = sentences.length ? text.length / sentences.length : 0;
    sub.readable = W.readable;
    if (avgLen > 60) sub.readable -= 4;
    if (avgLen > 90) sub.readable -= 4;
    if (avgLen < 10) sub.readable -= 4;
    if (sub.readable < 0) sub.readable = 0;

    /* 4) density — 정보 키워드 빈도 / filler 패널티 */
    sub.density = 0;
    var infoMatches = (text.match(INFO_PAT) || []).length;
    sub.density += Math.min(W.density * 0.7, infoMatches * 3);
    var fillers = (text.match(FILLER_PAT) || []).length;
    var fillerRatio = fillers / Math.max(1, sentences.length);
    if (fillerRatio < 0.3) sub.density += W.density * 0.3;
    if (sub.density > W.density) sub.density = W.density;

    /* 5) emotion — 감정/반전 키워드 */
    sub.emotion = 0;
    if (EMOTION_PAT.test(text)) { sub.emotion += W.emotion * 0.6; reasons.push('감정 키워드'); }
    if (REVEAL_PAT.test(text))  { sub.emotion += W.emotion * 0.5; reasons.push('반전 키워드'); }
    if (sub.emotion > W.emotion) sub.emotion = W.emotion;

    /* 6) duration — 15~60s 가 100, 외부면 감점 */
    sub.duration = 0;
    if (dur >= 15 && dur <= 60)        sub.duration = W.duration;
    else if (dur >= 10 && dur < 15)    sub.duration = W.duration * 0.6;
    else if (dur > 60 && dur <= 75)    sub.duration = W.duration * 0.7;
    else if (dur > 75 && dur <= 90)    sub.duration = W.duration * 0.4;
    else                                sub.duration = 0;

    /* 7) cta — 마지막 1~2 cue 에 CTA 패턴 또는 imperative */
    sub.cta = 0;
    var ctaProbe = lastText + ' ' + (cues[cues.length - 2] && cues[cues.length - 2].text || '');
    if (CTA_PAT.test(ctaProbe))     { sub.cta += W.cta * 0.7; reasons.push('CTA 가능'); }
    /* 명령형 어미 */
    if (/(세요|하세요|보세요|해보|してください|ください|see you|let me know|try)/i.test(ctaProbe)) {
      sub.cta += W.cta * 0.4;
    }
    if (sub.cta > W.cta) sub.cta = W.cta;

    /* 합산 */
    var total = Math.round(sub.hook + sub.standalone + sub.readable +
                           sub.density + sub.emotion + sub.duration + sub.cta);

    /* 유형 추정 */
    var type = _detectType(text);
    if (type) reasons.unshift(type + ' 형');

    /* 권장 라벨 */
    var label;
    if (total >= 85)      label = '강력 추천';
    else if (total >= 70) label = '사용 가능';
    else if (total >= 60) label = '수정 권장';
    else                  label = '비추천';

    return {
      score:    total,
      label:    label,
      type:     type || '하이라이트',
      sub:      sub,
      reasons:  reasons,
      durationSec: Math.round(dur),
    };
  }

  /* ── 후보 유형 분류 ── */
  function _detectType(text) {
    var t = String(text || '');
    if (EMOTION_PAT.test(t))                              return '감동';
    if (/하하|ㅋㅋ|웃|개그|코미디|笑|funny|haha|lol/i.test(t)) return '코믹';
    if (REVEAL_PAT.test(t) && /논란|사실|진실|debate/i.test(t)) return '논쟁';
    if (/첫째|둘째|셋째|단계|first.*second|step \d/i.test(t)) return '튜토리얼';
    if (INFO_PAT.test(t))                                  return '정보';
    if (HOOK_PAT.test(t))                                  return '하이라이트';
    return '';
  }

  window.RM_LONGFORM_SCORE = {
    evaluate:    evaluate,
    detectType:  _detectType,
    WEIGHTS:     W,
  };
})();
