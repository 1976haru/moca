/* ================================================
   modules/agents/agent-final-check.js
   최종 누락 점검 에이전트
   * 대본 / 이미지·스톡·업로드 중 하나 / 음성 / 자막 / 썸네일 /
     제목 / 설명 / 해시태그 / export / project.json 포함 여부
   ================================================ */
(function(){
  'use strict';

  function _has(v) {
    if (v == null) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return Object.keys(v).length > 0;
    return !!v;
  }

  function _scenesHaveImage(scenes) {
    return (scenes || []).some(function(s){
      return s.imageUrl || s.img || s.image || s.thumbnailUrl ||
             (s.previewStatus === 'ready' && s.thumbnailUrl);
    });
  }
  function _scenesHaveVideo(scenes) {
    return (scenes || []).some(function(s){ return s.videoUrl || s.video; });
  }
  function _scenesHaveStock(scenes) {
    return (scenes || []).some(function(s){ return s.stockUrl || s.stock || s.bgImage; });
  }
  function _scenesHaveVoice(p) {
    var voice = (p && p.s2 && p.s2.voiceScenes) || (p && p.s2 && p.s2.scenes) || [];
    if (Array.isArray(voice) && voice.some(function(v){ return v && (v.audioUrl || v.audio); })) return true;
    /* fallback: scenes 안의 audio 필드 */
    var scenes = (p && p.s1 && p.s1.scenes) || (p && p.scenes) || [];
    return scenes.some(function(s){ return s.audioUrl || s.audio; });
  }
  function _hasCaption(p) {
    var ed = (p && p.s4 && p.s4.edit) || (p && p.s4 && p.s4.caption) || (p && p.s4) || {};
    if (ed && ed.caption) return true;
    var scenes = (p && p.s1 && p.s1.scenes) || (p && p.scenes) || [];
    return scenes.some(function(s){ return (s.captionKo || s.captionJa || s.caption || '').trim(); });
  }
  function _hasThumb(p) {
    return !!(p && (p.thumbnail || (p.s4 && (p.s4.thumb || p.s4.thumbnail)) ||
                    (p.s5 && p.s5.thumbnail)));
  }
  function _hasMeta(p, key) {
    var s5 = (p && p.s5) || {};
    var meta = s5.meta || s5.metadata || s5.publish || {};
    if (key === 'title') return _has(meta.title) || _has(p.title) || _has(p.topic);
    if (key === 'desc')  return _has(meta.description) || _has(meta.desc) || _has(p.description);
    if (key === 'tags')  return _has(meta.tags) || _has(meta.hashtags) || _has(p.hashtags);
    return false;
  }

  function run(project) {
    var p = project;
    var M = window.MocaAgents;
    var scenes = M._scenes(p);
    var issues = [], suggestions = [], nextActions = [];

    /* checklist 항목 — 각 항목은 가중치/단계가 다름 */
    var items = [
      { key:'script',  label:'대본',
        ok:  _has(M._scriptText(p)),    weight:18, step:1, msg:'대본이 없습니다. 1단계에서 생성하세요.' },
      { key:'scenes',  label:'씬 구성',
        ok:  scenes.length > 0,         weight:12, step:2, msg:'씬 데이터가 없습니다.' },
      { key:'media',   label:'이미지/스톡/영상 (최소 1)',
        ok:  _scenesHaveImage(scenes) || _scenesHaveStock(scenes) || _scenesHaveVideo(scenes),
        weight:15, step:2, msg:'이미지/스톡/영상 소스가 없습니다.' },
      { key:'voice',   label:'음성',
        ok:  _scenesHaveVoice(p),       weight:13, step:3, msg:'음성이 생성되지 않았습니다.' },
      { key:'caption', label:'자막',
        ok:  _hasCaption(p),            weight:10, step:4, msg:'자막이 설정되지 않았습니다.' },
      { key:'thumb',   label:'썸네일',
        ok:  _hasThumb(p),              weight:8,  step:4, msg:'썸네일이 없습니다.' },
      { key:'title',   label:'제목 메타',
        ok:  _hasMeta(p, 'title'),      weight:8,  step:5, msg:'영상 제목이 비어있습니다.' },
      { key:'desc',    label:'설명 메타',
        ok:  _hasMeta(p, 'desc'),       weight:6,  step:5, msg:'영상 설명이 비어있습니다.' },
      { key:'tags',    label:'해시태그',
        ok:  _hasMeta(p, 'tags'),       weight:5,  step:5, msg:'해시태그가 비어있습니다.' },
      { key:'export',  label:'export 가능',
        ok:  scenes.length > 0 && _has(M._scriptText(p)),
        weight:5, step:5, msg:'export 가 가능하려면 대본 + 씬이 필요합니다.' },
    ];

    /* 점수 계산 */
    var totalW = items.reduce(function(s, it){ return s + it.weight; }, 0);
    var got    = items.filter(function(it){ return it.ok; })
                      .reduce(function(s, it){ return s + it.weight; }, 0);
    var score  = Math.round((got / totalW) * 100);

    items.forEach(function(it){
      if (!it.ok) {
        issues.push({ code: ('MISSING_' + it.key.toUpperCase()), message: it.msg });
        nextActions.push({ label: it.label + ' 보충 → Step ' + it.step, step: it.step });
      }
    });

    /* project.json 포함성 */
    var jsonOk = _has(M._scriptText(p)) && scenes.length;
    if (!jsonOk) {
      issues.push({ code: 'NO_PROJECT_JSON', message: 'project.json 으로 export 하기에 데이터가 부족합니다 (대본+씬 필요).' });
    }

    /* 누락이 4개 이상이면 status danger */
    var missingN = items.filter(function(it){ return !it.ok; }).length;
    if (missingN === 0) suggestions.push('모든 출력 자산이 준비됐습니다. Step 5 → 출력 패키지 탭에서 export 하세요.');
    else if (missingN <= 2) suggestions.push('대부분 준비됐습니다. 누락된 ' + missingN + ' 개 항목만 보충하면 export 가능.');
    else suggestions.push(missingN + ' 개 항목이 누락 — 위 "다음 행동" 버튼으로 단계별 보충하세요.');

    var summary = (items.length - missingN) + ' / ' + items.length + ' 완료 · 점수 ' + score;

    return {
      score: score,
      status: M.classify(score),
      issues: issues,
      suggestions: suggestions,
      nextActions: nextActions,
      summary: summary,
    };
  }

  if (window.MocaAgents) {
    window.MocaAgents.register('final_check', '최종 누락 점검', run);
  }
})();
