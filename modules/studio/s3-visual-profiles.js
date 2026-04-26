/* ================================================
   modules/studio/s3-visual-profiles.js
   장르별 이미지/영상 visual profile (순수 데이터)
   * 9 장르: emotion / info / senior / comedy / tikitaka /
            shortDrama / music / smb / public
   * 장르 키는 STUDIO.project.style 또는 s1.style 의 값과 호환
   ================================================ */
(function(){
  'use strict';

  const PROFILES = {
    emotion: {
      label: '감동',
      imageStrategy: [
        'warm domestic scene', 'family photo or memento', 'parent waiting at home',
        'empty dining table set for one', 'old phone on a table', 'objects with memory',
        'window with golden light', 'restrained facial emotion'
      ],
      videoStrategy: [
        'slow push-in', 'close-up on hands or photo', 'subtle eye movement',
        'quiet pause', 'warm golden light', 'regret-to-comfort emotional transition'
      ],
      lighting: 'warm golden hour, soft window light',
      mood: 'nostalgic, restrained, warm',
      forbidden: ['exaggerated tears', 'melodramatic crying', 'horror or dark mood'],
      defaultStyle: 'realistic cinematic, documentary-style emotion',
    },
    info: {
      label: '정보',
      imageStrategy: [
        'clear single object', 'checklist-style composition', 'side-by-side comparison',
        'clean uncluttered background', 'easy visual metaphor', 'avoid heavy emotion'
      ],
      videoStrategy: [
        'clean transition', 'simple camera movement', 'object focus',
        'step-by-step visual cue', 'stable framing', 'readable composition'
      ],
      lighting: 'bright even studio light',
      mood: 'clear, trustworthy, neutral',
      forbidden: ['ambiguous emotional imagery', 'busy background', 'unrelated face close-up'],
      defaultStyle: 'clean tutorial style, commercial clarity',
    },
    senior: {
      label: '시니어',
      imageStrategy: [
        'respectful elderly Korean or Japanese person', 'warm interior',
        'large legible objects', 'familiar daily action',
        'comfort-and-solution focus over loneliness',
        'avoid exploitative aging imagery'
      ],
      videoStrategy: [
        'slow pacing', 'clear single subject', 'gentle movement',
        'readable composition', 'calm emotional rhythm', 'respectful tone'
      ],
      lighting: 'soft warm interior, large windows',
      mood: 'respectful, warm, gentle',
      forbidden: ['ageist imagery', 'frailty exaggeration', 'fear-mongering', 'excessive sadness'],
      defaultStyle: 'realistic warm cinematic, human dignity',
    },
    comedy: {
      label: '유머',
      imageStrategy: [
        'expressive face character', 'situational reversal',
        'awkward beat moment', 'side-by-side compared actions',
        'bright color palette', 'tasteful comedic staging'
      ],
      videoStrategy: [
        'quick reaction cut', 'small zoom-in', 'comic pause',
        'expression change', 'timing-based motion'
      ],
      lighting: 'bright cheerful daylight',
      mood: 'light, playful, witty',
      forbidden: ['offensive mockery', 'group stereotyping', 'over-reliance on memes'],
      defaultStyle: 'comedic short film style, expressive',
    },
    tikitaka: {
      label: '티키타카',
      imageStrategy: [
        'A vs B comparison composition', 'two characters or two choices',
        'left-right split layout', 'contrasting facial expressions',
        'leave space for speech bubble (do NOT render text)'
      ],
      videoStrategy: [
        'split-screen feel', 'alternating reaction', 'quick back-and-forth',
        'camera switches between A and B', 'contrast-driven pacing'
      ],
      lighting: 'balanced, equal light on both sides',
      mood: 'snappy, witty, contrast',
      forbidden: ['actual text rendered in image', 'one-sided composition', 'unclear comparison subject'],
      defaultStyle: 'realistic split-frame style, expressive',
    },
    shortDrama: {
      label: '숏드라마',
      imageStrategy: [
        'conflict situation', 'distance between characters',
        'door, hospital, dining table, phone, old photograph',
        'emotional close-up', 'cinematic lighting'
      ],
      videoStrategy: [
        'cinematic push-in', 'dramatic pause', 'over-the-shoulder shot',
        'reveal moment', 'emotional facial transition'
      ],
      lighting: 'cinematic key light, motivated practicals',
      mood: 'dramatic, emotional, layered',
      forbidden: ['over-the-top melodrama', 'violent imagery', 'sexual content'],
      defaultStyle: 'cinematic short film, film grain subtle',
    },
    music: {
      label: '가사/음원',
      imageStrategy: [
        'mood matching the lyrics', 'stage / vintage cassette / night street / nostalgic place',
        'vocalist emotion', 'album-cover-like staging',
        'NEVER render lyric text in the image'
      ],
      videoStrategy: [
        'slow lyrical motion', 'gentle camera drift', 'stage light',
        'emotional performance', 'rhythm-aware movement'
      ],
      lighting: 'stage spot, neon night, or moody window light',
      mood: 'lyrical, emotional, atmospheric',
      forbidden: ['imitating real singer', 'copying real album cover', 'embedding copyrighted lyrics'],
      defaultStyle: 'music video cinematic style',
    },
    smb: {
      label: '소상공인',
      imageStrategy: [
        'product or service clearly visible', 'small shop, customer, usage scene',
        'before / after comparison', 'trustworthy realistic photography',
        'local neighborhood feel'
      ],
      videoStrategy: [
        'product close-up', 'customer interaction', 'before/after reveal',
        'smooth promotional motion', 'clean commercial pacing'
      ],
      lighting: 'bright commercial light, clean white balance',
      mood: 'trustworthy, friendly, local',
      forbidden: ['exaggerated advertising claims', 'unrelated stock imagery', 'busy unreadable backgrounds'],
      defaultStyle: 'commercial photography, friendly local business',
    },
    public: {
      label: '공공기관',
      imageStrategy: [
        'citizen receiving guidance', 'application form, info desk, public building',
        'sense of order and clarity', 'calm color palette',
        'card-news / public-notice friendly composition'
      ],
      videoStrategy: [
        'calm informational pacing', 'clear process visualization',
        'document or desk focus', 'stable camera', 'public service tone'
      ],
      lighting: 'neutral office light, soft daylight',
      mood: 'calm, clear, trustworthy',
      forbidden: ['exaggerated emotion', 'political imagery', 'fear-mongering', 'ambiguous procedure imagery'],
      defaultStyle: 'public service documentary, clean editorial',
    },
  };

  /* ── 장르 별칭 → profile id ── */
  const ALIAS = {
    /* legacy s1 style 키 */
    emotional:    'emotion',
    info:         'info',
    knowledge:    'info',
    humor:        'comedy',
    drama:        'shortDrama',
    senior:       'senior',
    /* 신규 키 */
    emotion:      'emotion',
    comedy:       'comedy',
    tikitaka:     'tikitaka',
    shortDrama:   'shortDrama',
    music:        'music',
    smb:          'smb',
    public:       'public',
    publicReport: 'public',
    smallBiz:     'smb',
    lyrics:       'music',
  };

  function resolveProfileKey(styleKey) {
    if (!styleKey) return 'emotion';
    return ALIAS[styleKey] || (PROFILES[styleKey] ? styleKey : 'emotion');
  }

  function getVisualProfile(styleKey) {
    return PROFILES[resolveProfileKey(styleKey)];
  }

  function listGenreKeys() { return Object.keys(PROFILES); }

  /* ── 씬 역할별 hint 보강 — profile 위에 role 별 강세 ── */
  const ROLE_HINTS = {
    hook: {
      composition: 'strong attention-grabbing first frame, clear subject visible immediately',
      action:      'establish situation in one glance',
    },
    setup: {
      composition: 'medium shot, establishing context',
      action:      'introduce characters and place',
    },
    situation: {
      composition: 'medium wide, situational clarity',
      action:      'show the situation neutrally',
    },
    core: {
      composition: 'medium shot focused on core action',
      action:      'depict the central message visually',
    },
    core_cause: {
      composition: 'over-the-shoulder or two-shot to convey cause',
      action:      'show the cause behind the situation',
    },
    conflict_or_core: {
      composition: 'two-shot or close-up showing conflict',
      action:      'depict tension or core issue',
    },
    reveal_or_solution: {
      composition: 'reveal-frame composition, change in subject posture',
      action:      'show the solution or revelation moment',
    },
    reversal: {
      composition: 'composition that contrasts the previous frame',
      action:      'visual reversal or surprise',
    },
    conclusion: {
      composition: 'wider conclusive frame',
      action:      'wrap the story visually',
    },
    cta: {
      composition: 'action-oriented frame, hand or device visible',
      action:      'call-to-action: tap, save, share, comment, or call',
    },
  };

  function getRoleHint(role) {
    return ROLE_HINTS[role] || ROLE_HINTS.core;
  }

  /* 외부 노출 */
  window.S3_VISUAL_PROFILES   = PROFILES;
  window.S3_PROFILE_ALIAS     = ALIAS;
  window.s3GetVisualProfile   = getVisualProfile;
  window.s3ResolveProfileKey  = resolveProfileKey;
  window.s3ListGenreKeys      = listGenreKeys;
  window.s3GetRoleHint        = getRoleHint;
  window.S3_ROLE_HINTS        = ROLE_HINTS;
})();
