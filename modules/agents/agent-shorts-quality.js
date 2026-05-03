/* ================================================
   modules/agents/agent-shorts-quality.js
   숏츠 품질 점검 에이전트
   * 대본 / 씬 수 / 훅 / CTA / 이미지·영상 prompt / 자막 길이 / 언어 일관성
   * 100점 만점 — 항목당 감점/가점, status 자동 분류
   ================================================ */
(function(){
  'use strict';

  var HOOK_PATTERNS = /[?!？！]|왜|어떻게|혹시|믿|놀라|충격|들어보|아세요|아십니까|どうして|なぜ|本当|信じ/;
  var CTA_PATTERNS  = /구독|좋아요|팔로우|채널|등록|フォロー|チャンネル|登録|subscribe|follow/i;
  var GENERIC_HINTS = [
    'scene', 'visual', 'cinematic', 'cool', 'beautiful', 'amazing', 'professional',
    '풍경', '인물', '장면', 'photo of', 'image of', '4k', 'hd',
  ];
  var MOTION_HINTS  = /motion|camera|zoom|pan|tilt|track|dolly|push|pull|orbit|truck|hand[- ]?held|slow|fast|smooth/i;
  var DUR_HINTS     = /\b\d+(?:\.\d+)?\s*(?:s|sec|seconds|secs|frame|fps)\b|\bclip\b/i;

  function _isGeneric(text) {
    var t = String(text || '').toLowerCase().trim();
    if (!t) return true;
    if (t.length < 30) return true;
    var hits = GENERIC_HINTS.filter(function(g){ return t.indexOf(g) >= 0; }).length;
    return hits >= 4 && t.length < 120;
  }

  function _hookOk(scenes) {
    var first = scenes[0];
    if (!first) return false;
    var t = String(first.narration || first.text || first.caption || '').trim();
    if (!t) return false;
    /* 첫 씬 길이 짧고 (~3초) hook 패턴 매칭 */
    return HOOK_PATTERNS.test(t) || t.length <= 30;
  }
  function _ctaOk(scenes) {
    if (!scenes.length) return false;
    var last = scenes[scenes.length - 1];
    var blob = String((last && (last.narration || last.text || last.caption)) || '');
    if (CTA_PATTERNS.test(blob)) return true;
    /* 마지막 2 씬 안에서 검색 */
    var tail = scenes.slice(-2).map(function(s){
      return (s.narration || '') + ' ' + (s.caption || '') + ' ' + (s.text || '');
    }).join(' ');
    return CTA_PATTERNS.test(tail);
  }

  function run(project) {
    var p = project;
    var M = window.MocaAgents;
    var scenes = M._scenes(p);
    var script = M._scriptText(p);
    var scriptJa = M._scriptJa(p);
    var lang = p.lang || (p.s1 && p.s1.lang) || (script && scriptJa ? 'both' : (scriptJa ? 'ja' : 'ko'));

    var issues = [], suggestions = [], nextActions = [];
    var score = 100;

    /* 1) 대본 존재 */
    if (!script || script.length < 50) {
      score -= 30;
      issues.push({ code: 'NO_SCRIPT', message: '대본이 없거나 너무 짧습니다 (50자 미만).' });
      nextActions.push({ label: 'Step 1 대본 생성으로 이동', step: 1 });
    }

    /* 2) 씬 수 */
    if (!scenes.length) {
      score -= 30;
      issues.push({ code: 'NO_SCENES', message: '씬 데이터가 없습니다.' });
      nextActions.push({ label: 'Step 2 씬 구성 확인', step: 2 });
    } else if (scenes.length < 3) {
      score -= 15;
      issues.push({ code: 'TOO_FEW_SCENES', message: '씬이 ' + scenes.length + '개로 너무 적습니다 (최소 3개 권장).' });
    } else if (scenes.length > 24) {
      score -= 10;
      issues.push({ code: 'TOO_MANY_SCENES', message: '씬이 ' + scenes.length + '개로 너무 많습니다 (60초 기준 8~18개 권장).' });
    }

    /* 3) 첫 3초 훅 */
    if (scenes.length && !_hookOk(scenes)) {
      score -= 10;
      issues.push({ code: 'WEAK_HOOK', message: '첫 씬에 강한 훅 (질문/감탄/충격/짧은 문장) 이 약합니다.' });
      suggestions.push('첫 씬을 30자 이내 짧은 질문/충격형 문장으로 바꿔보세요. (예: "이거 아시나요?")');
    }

    /* 4) CTA */
    if (scenes.length && !_ctaOk(scenes)) {
      score -= 10;
      issues.push({ code: 'NO_CTA', message: '마지막 부분에 CTA (구독/팔로우/채널 등) 가 보이지 않습니다.' });
      suggestions.push('마지막 씬에 "구독·좋아요" 또는 "다음 영상에서 만나요" 등 CTA 를 추가하세요.');
    }

    /* 5) 이미지 prompt 수 / 씬 수 일치 */
    var imgPrompts = (p.s3 && p.s3.imagePrompts) || [];
    var hasAnyImg = imgPrompts.filter(Boolean).length;
    if (scenes.length && hasAnyImg && hasAnyImg !== scenes.length) {
      score -= 10;
      issues.push({ code: 'IMG_COUNT_MISMATCH',
        message: '이미지 프롬프트 수 (' + hasAnyImg + ') 와 씬 수 (' + scenes.length + ') 가 다릅니다.' });
      nextActions.push({ label: 'Step 2 이미지·영상 프롬프트 재생성', step: 2 });
    }

    /* 6) 이미지 prompt generic 검출 */
    if (hasAnyImg) {
      var generic = imgPrompts.filter(_isGeneric).length;
      if (generic >= Math.ceil(hasAnyImg * 0.4)) {
        score -= 8;
        issues.push({ code: 'GENERIC_IMG', message: generic + '/' + hasAnyImg + ' 이미지 프롬프트가 generic 합니다 ("scene N", "cinematic" 등).' });
        suggestions.push('각 씬의 narration/visualDescription 에 따라 구체적 인물/장소/감정/조명 키워드를 추가하세요.');
      }
    }

    /* 7) 영상 prompt motion / camera / duration 키워드 */
    var vidPrompts = (p.s3 && p.s3.videoPrompts) || [];
    var hasAnyVid = vidPrompts.filter(Boolean).length;
    if (hasAnyVid) {
      var withMotion = vidPrompts.filter(function(v){ return MOTION_HINTS.test(String(v || '')); }).length;
      var withDur    = vidPrompts.filter(function(v){ return DUR_HINTS.test(String(v || '')); }).length;
      if (withMotion < hasAnyVid * 0.5) {
        score -= 5;
        issues.push({ code: 'NO_MOTION', message: '영상 프롬프트에 motion/camera 키워드가 부족합니다 (' + withMotion + '/' + hasAnyVid + ').' });
        suggestions.push('영상 프롬프트에 zoom/pan/dolly/handheld 등 카메라 움직임 키워드를 넣으세요.');
      }
      if (withDur < hasAnyVid * 0.5) {
        score -= 3;
        issues.push({ code: 'NO_DURATION', message: '영상 프롬프트에 클립 길이 (3~5s) 표기가 부족합니다 (' + withDur + '/' + hasAnyVid + ').' });
      }
    }

    /* 8) 자막 길이 */
    if (scenes.length) {
      var longCaps = scenes.filter(function(s){
        var c = String(s.caption || s.captionJa || s.captionKo || '');
        return c.length > 28;
      }).length;
      if (longCaps >= Math.ceil(scenes.length * 0.3)) {
        score -= 5;
        issues.push({ code: 'LONG_CAPTIONS',
          message: longCaps + '/' + scenes.length + ' 씬의 자막이 28자 초과 — 쇼츠는 1~2줄 (≤14자/줄) 권장.' });
        suggestions.push('자막을 한 호흡으로 읽히게 압축하세요. 핵심 단어만 강조 자막으로.');
      }
    }

    /* 9) 언어 일관성 */
    if (lang === 'both' || lang === 'ja') {
      var jaSceneN = scenes.filter(function(s){ return (s.captionJa || '').trim() || (s.captionBoth || '').trim(); }).length;
      if (scenes.length && jaSceneN < Math.ceil(scenes.length * 0.5)) {
        score -= 7;
        issues.push({ code: 'JA_MISSING',
          message: '일본어 출력 모드인데 일본어 자막이 ' + jaSceneN + '/' + scenes.length + ' 씬만 채워졌습니다.' });
        nextActions.push({ label: 'Step 1 일본어 자막 생성 / 영상 리믹스 스튜디오로 이동', step: 1 });
      }
    }

    /* score 음수 방지 */
    if (score < 0) score = 0;

    return {
      score: score,
      status: M.classify(score),
      issues: issues,
      suggestions: suggestions,
      nextActions: nextActions,
      summary: '씬 ' + scenes.length + ' / 이미지 ' + hasAnyImg + ' / 영상 ' + hasAnyVid + ' / 언어 ' + lang,
    };
  }

  if (window.MocaAgents) {
    window.MocaAgents.register('shorts_quality', '숏츠 품질 점검', run);
  }
})();
