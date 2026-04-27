/* ================================================
   modules/studio/s3-prompt-v4-genre-grammar.js
   ⭐ v4 — 장르별 visual grammar adapter
   * window.buildGenreVisualGrammarV4(projectProfile, sceneIntent)
       → {
           cameraGrammar, lightingGrammar, composition,
           propsEmphasis, expressionRange, framingRules,
           motionRules, styleHints, forbiddenPatterns,
           providerHints, negativeAdditions
         }
   * 9개 장르 어댑터:
       info / emotional / comic / wisdom / tikitaka /
       senior_info / animal_anime / real_korea / real_japan / news
   * sceneIntent 의 role 에 따라 framing rule 가산.
   ================================================ */
(function(){
  'use strict';

  var GENRE_RULES = {
    info: {
      cameraGrammar:     'medium and close-up shots, generous insert shots of the object',
      lightingGrammar:   'clean even daylight, slightly cool, no heavy mood',
      composition:       'subject left or right of center with clear negative space for the prop',
      propsEmphasis:     'emphasize props, hands and exact action — clarity over emotion',
      expressionRange:   'attentive, mildly curious, never theatrical',
      framingRules:      'one main subject + one main prop in frame; avoid crowd shots',
      motionRules:       'small purposeful motion, never decorative',
      styleHints:        ['clean instructional documentary photography'],
      forbiddenPatterns: [/dramatic chiaroscuro/i, /surreal metaphor/i],
      providerHints:     { dalle3:'photo-realistic instructional', flux:'sharp instructional realism', ideogram:'iconic infographic' },
      negativeAdditions: ['avoid abstract emotional metaphor without props', 'avoid decorative bokeh distractions']
    },
    emotional: {
      cameraGrammar:     'medium close-ups, slight handheld; eye-line and hand emphasis',
      lightingGrammar:   'warm soft natural light when justified by setting',
      composition:       'two-shot or over-shoulder when relationship matters; touch points visible',
      propsEmphasis:     'props anchor the memory (photograph, letter, cup) when script supports',
      expressionRange:   'restrained authentic emotion, no theatrical grief',
      framingRules:      'show distance between people; eye direction is intentional',
      motionRules:       'slow micro-movements (breath, blink, hand reach)',
      styleHints:        ['warm natural cinematic photography'],
      forbiddenPatterns: [/cold sterile lighting/i, /office-style framing/i],
      providerHints:     { dalle3:'cinematic warm portrait', flux:'film-still warm tone' },
      negativeAdditions: ['no exaggerated grief', 'no melodramatic crying close-up']
    },
    comic: {
      cameraGrammar:     'medium shots with clean negative space for the gag; insert reaction close-ups',
      lightingGrammar:   'bright even light, slightly higher key',
      composition:       'asymmetric framing, props arranged for visual punchline',
      propsEmphasis:     'prop is part of the joke; visible and clearly readable',
      expressionRange:   'expressive but believable; raised eyebrows, dropped jaw, side-eye',
      framingRules:      'start in neutral pose, payoff with a comedic reaction or contrast',
      motionRules:       'beats: setup pose → payoff motion → reaction',
      styleHints:        ['expressive natural photography with light comedic timing'],
      forbiddenPatterns: [/somber/i, /grief/i, /tragic/i],
      providerHints:     { dalle3:'expressive comedy still', flux:'sitcom-style still' },
      negativeAdditions: ['no overly serious dramatic lighting', 'no melodramatic poses']
    },
    wisdom: {
      cameraGrammar:     'minimal still life or single-subject medium shot, lots of negative space',
      lightingGrammar:   'natural side light with one accent — never stagey',
      composition:       'iconic single object or single-subject silhouette; rule of thirds',
      propsEmphasis:     'one symbolic prop carries the line; nothing competes',
      expressionRange:   'calm, contemplative, eyes lowered or focused softly',
      framingRules:      'one strong metaphor, no busy environment',
      motionRules:       'almost still; one slow gesture if motion is needed',
      styleHints:        ['minimal symbolic still life with negative space'],
      forbiddenPatterns: [/crowd/i, /busy market/i, /chaos/i],
      providerHints:     { ideogram:'iconic symbolic with crisp shapes', dalle3:'cinematic minimal still' },
      negativeAdditions: ['no busy crowded composition', 'no literal quote card or rendered text']
    },
    tikitaka: {
      cameraGrammar:     'over-shoulder and reverse shots, split framing, quick alternation',
      lightingGrammar:   'lively even light, slightly warm',
      composition:       'two subjects clearly separated; A on one side, B on the other',
      propsEmphasis:     'each side may hold its own emblematic object',
      expressionRange:   'reaction-driven; surprise, smug, defensive, agreeing',
      framingRules:      'always show both subjects or signal alternation; no monolog framing',
      motionRules:       'rhythmic gesture exchange between A and B',
      styleHints:        ['lively documentary-style photography with two subjects'],
      forbiddenPatterns: [/single subject only/i, /monolog/i],
      providerHints:     { dalle3:'two-subject conversation realism' },
      negativeAdditions: ['no single-subject portrait', 'no empty opposing side']
    },
    senior_info: {
      cameraGrammar:     'medium shots favoring senior body language and props; insert close-ups for clarity',
      lightingGrammar:   'warm cinematic daylight, soft realism',
      composition:       'subject anchored in domestic setting; one prop drives the scene',
      propsEmphasis:     'lifestyle props (cup, scale, prescription, photo, phone) grounded in script',
      expressionRange:   'authentic senior expression — gentle concern, soft contentment, mild discomfort',
      framingRules:      'never overly fashionable styling; realistic age-appropriate body and clothing',
      motionRules:       'careful, deliberate movement; protect joints in stairs/scale shots',
      styleHints:        ['warm natural cinematic photography of a senior lifestyle scene'],
      forbiddenPatterns: [/fashion editorial/i, /youth-coded/i],
      providerHints:     { dalle3:'cinematic senior lifestyle realism', flux:'senior film-still realism' },
      negativeAdditions: ['no overly young face', 'no fashion-editorial styling', 'no plastic CGI sheen']
    },
    animal_anime: {
      cameraGrammar:     'medium with playful angles; ground-level for small species',
      lightingGrammar:   'bright friendly light, slight saturation lift',
      composition:       'character clearly read from far; one supporting prop or environment cue',
      propsEmphasis:     'optional small accessory; main read is the animal\'s posture',
      expressionRange:   'cartoon-style emotional clarity — happy, surprised, curious',
      framingRules:      'no realistic human protagonist; species body proportions consistent',
      motionRules:       'soft bounce, head-tilt, paw or tail gesture; species-specific behavior',
      styleHints:        ['friendly 2D-style animal animation, soft outlines'],
      forbiddenPatterns: [/realistic human face/i, /photographic skin texture/i],
      providerHints:     { ideogram:'cartoon animal with crisp outline', dalle3:'storybook animal illustration' },
      negativeAdditions: ['no realistic human protagonist', 'no photo-real skin texture']
    },
    real_korea: {
      cameraGrammar:     'medium shots with a sense of place; props and signage are subtle Korean cues',
      lightingGrammar:   'soft daylight, natural Korean apartment / street tones',
      composition:       'authentic Korean lifestyle composition — apartment, hanok, neighborhood market',
      propsEmphasis:     'Korean lifestyle props (banchan, kimchi crock, korean home shoes off etiquette)',
      expressionRange:   'natural Korean expressiveness, neither stoic nor theatrical',
      framingRules:      'Korean ethnicity body language and setting consistent',
      motionRules:       'natural movement, no exaggerated gestures',
      styleHints:        ['authentic Korean lifestyle realism, soft natural daylight'],
      forbiddenPatterns: [/japanese signage/i, /tatami/i],
      providerHints:     { dalle3:'Korean lifestyle realism' },
      negativeAdditions: ['no Western-only interior cues', 'no obviously Japanese signage']
    },
    real_japan: {
      cameraGrammar:     'medium shots with Japanese spatial composition; thoughtful negative space',
      lightingGrammar:   'soft cool daylight, Japanese home interior tonality',
      composition:       'authentic Japanese lifestyle composition — tatami, shoji, narrow alley',
      propsEmphasis:     'Japanese lifestyle props (yunomi, bento, futon) when grounded in script',
      expressionRange:   'reserved, polite expression with subtle warmth',
      framingRules:      'Japanese ethnicity body language and setting consistent',
      motionRules:       'unhurried, deliberate movement',
      styleHints:        ['authentic Japanese lifestyle realism, soft natural daylight'],
      forbiddenPatterns: [/hanbok/i, /korean signage/i],
      providerHints:     { dalle3:'Japanese lifestyle realism' },
      negativeAdditions: ['no obviously Korean signage', 'no hanbok wardrobe']
    },
    news: {
      cameraGrammar:     'medium shots with serious anchor framing; insert evidence shots',
      lightingGrammar:   'neutral newsroom-style, slightly cool, never moody',
      composition:       'clean composition; subject framed center or left with information area',
      propsEmphasis:     'evidence or document props; clear and readable',
      expressionRange:   'composed, serious, authoritative without being stern',
      framingRules:      'no decorative bokeh; everything reads quickly',
      motionRules:       'minimal movement, attention-driven gesture',
      styleHints:        ['clean editorial documentary photography'],
      forbiddenPatterns: [/dreamy/i, /surreal/i],
      providerHints:     { dalle3:'editorial documentary realism' },
      negativeAdditions: ['no dreamy soft-focus', 'no surreal metaphor']
    },
  };

  /* role 별 강화 규칙 */
  var ROLE_RULES = {
    hook: {
      framingRules:    'unusual framing or strong tension; one focal element wins the eye in 1 second',
      motionRules:     'attention shift; the eye lands on the focal point immediately',
    },
    setup: {
      framingRules:    'establishing read — relationship, place, time legible at a glance',
      motionRules:     'natural breathing, small establishing gesture',
    },
    conflict_or_core: {
      framingRules:    'must-show evidence is the dominant element; no decorative bokeh',
      motionRules:     'the action that demonstrates the problem or core info is happening now',
    },
    reveal_or_solution: {
      framingRules:    'composition resolves outward; eye-line opens or hands extend toward the answer',
      motionRules:     'resolving action body language is unmistakable',
    },
    cta: {
      framingRules:    'hand or product framed for action; subject not blocking the action surface',
      motionRules:     'gesture of offer / extension toward the viewer or action surface',
    },
  };

  function buildGenreVisualGrammarV4(projectProfile, sceneIntent){
    var genre = (projectProfile && projectProfile.genre) || 'info';
    var rules = GENRE_RULES[genre] || GENRE_RULES.info;
    var role  = (sceneIntent && sceneIntent.role) || 'conflict_or_core';
    var roleRules = ROLE_RULES[role] || ROLE_RULES.conflict_or_core;

    /* lighting 우선순위: 사용자 s3.lighting > genre default */
    var lighting = (projectProfile && projectProfile.lighting) ? (projectProfile.lighting + ' lighting') : rules.lightingGrammar;

    /* art style 우선순위: 사용자 s3.artStyle > genre styleHints */
    var styleHints = rules.styleHints.slice();
    if (projectProfile && projectProfile.artStyle && !/ghibli|pixar|disney/i.test(projectProfile.artStyle)) {
      styleHints.unshift(projectProfile.artStyle + ' style');
    }

    /* visualWorldType 추가 보강 — 동물/3D/이모지/실사일본·한국 */
    if (projectProfile && projectProfile.visualWorldType === 'animal_character') {
      styleHints.unshift('friendly 2D-style animal animation');
    } else if (projectProfile && projectProfile.visualWorldType === '3d_character') {
      styleHints.unshift('stylized 3D character render with soft shading');
    } else if (projectProfile && projectProfile.visualWorldType === 'emoji') {
      styleHints.unshift('iconic flat-vector illustration');
    } else if (projectProfile && projectProfile.visualWorldType === 'animation_japan') {
      styleHints.unshift('hand-drawn Japanese animation style');
    } else if (projectProfile && projectProfile.visualWorldType === 'animation_general') {
      styleHints.unshift('clean modern animation style');
    } else if (projectProfile && projectProfile.visualWorldType === 'real_japan') {
      styleHints.unshift('authentic Japanese photographic realism');
    } else if (projectProfile && projectProfile.visualWorldType === 'real_korea') {
      styleHints.unshift('authentic Korean photographic realism');
    }

    return {
      genre:             genre,
      role:              role,
      cameraGrammar:     rules.cameraGrammar,
      lightingGrammar:   lighting,
      composition:       rules.composition,
      propsEmphasis:     rules.propsEmphasis,
      expressionRange:   rules.expressionRange,
      framingRules:      roleRules.framingRules + '; ' + rules.framingRules,
      motionRules:       roleRules.motionRules + '; ' + rules.motionRules,
      styleHints:        styleHints,
      forbiddenPatterns: rules.forbiddenPatterns || [],
      providerHints:     rules.providerHints || {},
      negativeAdditions: rules.negativeAdditions || [],
      version:           'v4'
    };
  }
  window.buildGenreVisualGrammarV4 = buildGenreVisualGrammarV4;
})();
