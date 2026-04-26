/* ================================================
   modules/studio/s3-video-reference-style.js
   Step 2 영상 — 스타일별 어휘 블록 (실사/애니/동물/3D/아바타/없음)

   * 컴파일러가 referenceAnalysis + scene + style 을 합쳐 풍부한
     영상 프롬프트를 만들 때 사용하는 스타일 어휘 사전.
   * 각 스타일은 subject / motion / expression / camera / background /
     polish / safety 7 영역의 영문 표현을 가진다.
   ================================================ */
(function(){
  'use strict';

  var V_REF_STYLE = {
    realperson: {
      label:'실사 인물',
      subject:    'a real Korean person',
      motionVerbs:['walking', 'reaching out', 'gesturing', 'turning to camera', 'leaning forward'],
      expression: 'natural facial expression, subtle eye movement, micro-expression shifts',
      camera:     'cinematic handheld with gentle motion, shallow depth of field',
      background: 'realistic environment, naturally lit space, real props in soft focus',
      polish:     'photorealistic, cinematic color grading, natural skin tones, 4K detail',
    },
    animation: {
      label:'애니메이션',
      subject:    'a friendly 2D animated character',
      motionVerbs:['bouncing', 'waving', 'dashing', 'spinning', 'jumping'],
      expression: 'exaggerated cartoon expressions, eyes widening for emphasis, mouth animations',
      camera:     'energetic camera movement, quick zoom for impact, frame shake on punchlines',
      background: 'flat colorful animated background, simple shapes, cel-shaded scenery',
      polish:     'flat 2d animation style, vibrant pop colors, smooth in-between frames',
    },
    animal: {
      label:'동물 캐릭터',
      subject:    'a cute anthropomorphic animal character',
      motionVerbs:['hopping', 'tilting head', 'wiggling ears', 'pawing the air', 'rolling around'],
      expression: 'big expressive eyes, tilted head reactions, exaggerated cute reactions',
      camera:     'close-up on the cute animal, gentle bob, cut to wide for context',
      background: 'whimsical illustrated background, soft pastel colors, simple props',
      polish:     'cute animal illustration, rounded shapes, playful color palette',
    },
    character3d: {
      label:'3D 캐릭터',
      subject:    'a stylized 3D character',
      motionVerbs:['stepping forward', 'gesturing widely', 'jumping up', 'sliding sideways', 'crouching'],
      expression: 'expressive 3D facial rig, exaggerated mouth shapes, dynamic eye highlights',
      camera:     'dynamic 3D camera move, dolly-in on key beats, slight tilt for energy',
      background: '3D rendered scene with depth, subtle ambient lighting, soft shadows',
      polish:     '3D Pixar-style rendering, soft global illumination, stylized realism',
    },
    avatar: {
      label:'아바타',
      subject:    'a stylized avatar speaker',
      motionVerbs:['gesturing while speaking', 'nodding', 'pointing for emphasis', 'looking at viewer'],
      expression: 'natural lip-sync, friendly speaker expressions, subtle blinks',
      camera:     'fixed medium shot, occasional gentle zoom for emphasis',
      background: 'clean studio background, soft gradient, presenter-friendly framing',
      polish:     'avatar style, clean rendering, professional presenter look',
    },
    none: {
      label:'없음 (배경/오브젝트)',
      subject:    'a still or B-roll scene',
      motionVerbs:['slow drift', 'gentle pan', 'subtle parallax', 'particle drift'],
      expression: '',
      camera:     'subtle camera drift, no character close-up',
      background: 'environment-focused composition, props as the subject',
      polish:     'cinematic B-roll quality, balanced exposure',
    },
  };
  window.V_REF_STYLE = V_REF_STYLE;

  /* helper — pick deterministic but varied verb per scene index */
  window._vrsPickVerb = function(styleId, sceneIndex) {
    var def = V_REF_STYLE[styleId] || V_REF_STYLE.none;
    var verbs = def.motionVerbs || ['moving'];
    var i = (sceneIndex|0) % verbs.length;
    return verbs[i];
  };
})();
