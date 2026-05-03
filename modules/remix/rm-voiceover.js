/* ================================================
   modules/remix/rm-voiceover.js
   영상 리믹스 스튜디오 — 음성 교체 payload 빌더
   * 원본 자막 / 수정 자막 / captionJa 를 기반으로 TTS 용 대본 생성
   * Step 3 (s2-voice) 가 그대로 읽을 수 있게 STUDIO.project 에도 저장
   * 실제 TTS 합성은 이 모듈에서 수행하지 않음 — 기존 음성 시스템에 위임
   ================================================ */
(function(){
  'use strict';

  function _toast(msg, kind){
    if (typeof window.ucShowToast === 'function') window.ucShowToast(msg, kind || 'info');
  }

  /* language: 'ko' | 'ja' | 'both'
     'ko' → editedCaption || originalCaption
     'ja' → captionJa || editedCaption || originalCaption
     'both' → 한일 동시 — 줄 바꿈으로 결합 */
  function _textForVoice(sc, lang) {
    var ko = sc.editedCaption || sc.originalCaption || '';
    var ja = sc.captionJa || '';
    if (lang === 'ja')   return ja || ko;
    if (lang === 'both') return [ko, ja].filter(Boolean).join('\n');
    return ko;
  }

  /* ── 음성 payload 생성 ── */
  function build(opts) {
    opts = opts || {};
    var lang = /^(ko|ja|both)$/.test(opts.language || '') ? opts.language : 'ja';
    var p = window.RM_CORE.project();
    var scenes = (p.scenes || []).filter(function(sc){
      if (sc.deleted) return false;
      if (opts.selectedOnly && sc.selected === false) return false;
      return true;
    });
    if (!scenes.length) {
      _toast('⚠️ 대상 씬이 없습니다.', 'warn');
      return null;
    }
    var payloadScenes = scenes.map(function(sc, k){
      return {
        sceneIndex:   k,
        sceneNumber:  k + 1,
        startSec:     sc.startSec || 0,
        endSec:       sc.endSec   || ((sc.startSec || 0) + 4),
        textForVoice: _textForVoice(sc, lang),
        captionKo:    sc.editedCaption || sc.originalCaption || '',
        captionJa:    sc.captionJa || '',
      };
    });
    var payload = { language: lang, scenes: payloadScenes, source: 'video_remix_studio' };
    /* rm-core 에 저장 */
    var pp = window.RM_CORE.project();
    pp.voicePayload = payload;
    window.RM_CORE.save();
    return payload;
  }

  /* ── Step 3 (s2-voice) 가 읽는 STUDIO.project 위치에 mirror ──
     기존 자동숏츠 음성 시스템이 그대로 사용. */
  function bridgeToShortsVoice(payload) {
    if (!payload || !payload.scenes || !payload.scenes.length) return false;
    var STUDIO = window.STUDIO;
    if (!STUDIO || !STUDIO.project) {
      if (typeof window.studioNewProjectObj === 'function') {
        try { window.STUDIO = { project: window.studioNewProjectObj() }; STUDIO = window.STUDIO; } catch(_){}
      }
      if (!STUDIO || !STUDIO.project) {
        _toast('❌ STUDIO.project 가 초기화되지 않았습니다.', 'error');
        return false;
      }
    }
    var proj = STUDIO.project;
    proj.s1 = proj.s1 || {};
    proj.s2 = proj.s2 || {};

    /* s1.scenes 매핑 — Step 2/3 가 1순위로 읽음 */
    var s1Scenes = payload.scenes.map(function(sc){
      return {
        sceneIndex:   sc.sceneIndex,
        sceneNumber:  sc.sceneNumber,
        role:         'conflict_or_core',
        narration:    sc.textForVoice,
        caption:      payload.language === 'ja' ? (sc.captionJa || sc.captionKo) : sc.captionKo,
        captionKo:    sc.captionKo,
        captionJa:    sc.captionJa,
        text:         sc.textForVoice,
        label:        '씬 ' + sc.sceneNumber,
        startSec:     sc.startSec,
        endSec:       sc.endSec,
        source:       'video_remix_studio',
        sourceType:   'video_remix_studio',
      };
    });
    proj.s1.scenes = s1Scenes;
    proj.scenes    = s1Scenes.slice();

    /* scriptText / s2 voice 진입점 */
    var koJoined = payload.scenes.map(function(s){ return s.captionKo; }).filter(Boolean).join('\n\n');
    var jaJoined = payload.scenes.map(function(s){ return s.captionJa; }).filter(Boolean).join('\n\n');
    proj.scriptText = koJoined || jaJoined;
    proj.s1.scriptKo = koJoined;
    proj.s1.scriptJa = jaJoined;
    proj.s2.scriptKo = koJoined;
    proj.s2.scriptJa = jaJoined;
    proj.s2.voiceSource = 'youtube_remix';
    proj.s2.voicePayload = payload;
    proj.s2.voiceLanguage = payload.language;

    if (typeof window.studioSave === 'function') window.studioSave();
    return true;
  }

  /* ── 한 번에 build + bridge ── */
  function buildAndBridge(opts) {
    var payload = build(opts);
    if (!payload) return null;
    var ok = bridgeToShortsVoice(payload);
    return ok ? payload : null;
  }

  window.RM_VOICE = {
    build:               build,
    bridgeToShortsVoice: bridgeToShortsVoice,
    buildAndBridge:      buildAndBridge,
  };
})();
