/* ================================================
   engines/script/js/script-music-prompts.js
   가사/음원 — 서브탭별 실제 생성 프롬프트 빌드
   * 한국어 / 일본어 / 한일 동시 분기
   * 저작권 보호 문구 항상 포함
   * 기존 core/api-adapter.js (APIAdapter.callWithFallback) 사용
   ================================================ */
(function(){
  'use strict';

  const COPYRIGHT_RULES = [
    'do not copy existing lyrics',
    'do not quote copyrighted lyrics',
    'do not imitate a specific living artist',
    'create original lyrics inspired by the selected era and mood',
    'use only newly written lyrics',
  ];

  /* ── 언어 지시 ── */
  function langInstruction(lang) {
    if (lang === 'ko')   return '반드시 한국어로만 작성. 일본어·영어 표현 금지.';
    if (lang === 'ja')   return '必ず日本語のみで作成。韓国語·英語の表現は禁止。';
    return '한국어 대본을 먼저 작성한 후, 빈 줄을 띄우고 정확히 "=== 일본어 ===" 구분자를 출력하고, 그 아래에 일본어 번역본을 작성하세요.';
  }

  /* ── 시니어 옵션 → 지시 문장 ── */
  function seniorInstruction(opts) {
    if (!opts) return '';
    const lines = ['', '[시니어 친화 옵션]'];
    if (opts.easyWords)    lines.push('- 어려운 단어 금지, 누구나 이해할 수 있는 쉬운 단어만 사용');
    if (opts.slowExplain)  lines.push('- 한 문장은 짧게, 천천히 설명하는 호흡');
    if (opts.memoryHook)   lines.push('- 추억을 자극하는 표현·과거 회상 멘트 자연스럽게 포함');
    if (opts.warmTone)     lines.push('- 따뜻하고 다정한 말투');
    if (opts.largeCaption) lines.push('- 자막을 크게 보여줄 수 있도록 핵심 문장은 14자 이내');
    return lines.join('\n');
  }

  function copyrightInstruction() {
    return [
      '',
      '[저작권 보호 — 절대 위반 금지]',
      ...COPYRIGHT_RULES.map(function(r){ return '- ' + r; }),
    ].join('\n');
  }

  function durationLabel(d) {
    return d === '60s' ? '60초 분량 (숏츠)' : d === '10min' ? '10분 이상 (롱폼)' : '5분 분량';
  }

  /* ════════════════════════════════════════════════
     서브탭별 프롬프트 빌더
     ════════════════════════════════════════════════ */
  function buildPrompt(sub, opts) {
    const settings = (window._smGetSettings && window._smGetSettings()) || {};
    const lang     = settings.channelLang || 'kojp';
    const dur      = durationLabel(settings.duration || '5min');
    const senior   = seniorInstruction(settings.seniorOptions);
    const copy     = copyrightInstruction();
    const langInst = langInstruction(lang);

    /* 서브탭별 분기 */
    if (sub === 'memory')  return _promptMemory(opts, dur, senior, copy, langInst);
    if (sub === 'story')   return _promptStory(opts, dur, senior, copy, langInst);
    if (sub === 'enka')    return _promptEnka(opts, dur, senior, copy, langInst);
    if (sub === 'cover')   return _promptCover(opts, dur, senior, copy, langInst);
    if (sub === 'variety') return _promptVariety(opts, dur, senior, copy, langInst);
    return _promptOriginalLyric(opts, dur, senior, copy, langInst); /* orig */
  }

  /* ── 1) 추억 노래 대본 ── */
  function _promptMemory(o, dur, senior, copy, langInst) {
    const lines = [
      '당신은 한국·일본 시니어 채널 전문 음악 콘텐츠 작가입니다.',
      '아래 조건으로 ' + dur + ' 추억 노래 대본을 작성하세요.',
      '구조: 오프닝 훅 → 시대 배경 설명 → 노래 소개 및 감동 포인트 → 시청자 공감 멘트 → 마무리 CTA',
      '',
      '[조건]',
      '- 한국 시대: ' + (o.koEra || '미지정'),
      '- 일본 시대: ' + (o.jaEra || '미지정'),
      '- 콘텐츠 유형: ' + (o.contentType || '그 시절 명곡 소개'),
      '- 특정 노래명: ' + (o.songTitle || '(자유)'),
      senior, copy, '', langInst,
    ];
    return { sys: lines.join('\n'), user: '추억 노래 대본을 작성해주세요.' };
  }

  /* ── 2) 노래 스토리 ── */
  function _promptStory(o, dur, senior, copy, langInst) {
    const lines = [
      '당신은 노래 뒤의 사연을 감동적으로 풀어내는 스토리텔러입니다.',
      '구조: 노래 탄생 배경 → 감동 포인트 → 시청자 공감 유도 멘트 → 따뜻한 마무리.',
      '',
      '[조건]',
      '- 노래명: ' + (o.songTitle || '미입력'),
      '- 스토리 유형: ' + (o.storyType || '탄생 비화'),
      '- 분량: ' + dur,
      senior, copy, '', langInst,
    ];
    return { sys: lines.join('\n'), user: '노래 스토리 대본을 작성해주세요.' };
  }

  /* ── 3) 엔카·J-POP ── */
  function _promptEnka(o, dur, senior, copy, langInst) {
    const lines = [
      '엔카·일본 가요 전문 대본 작가.',
      '일본 경어체(です·ます体), 望郷·離別 테마, 계절·자연 묘사 풍부.',
      '구조: 오프닝 → 가수·시대 배경 → 노래 소개 → 감동 포인트 → 시청자 공감 멘트 → 마무리.',
      '',
      '[조건]',
      '- 카테고리: ' + (o.enkaCategory || '엔카 명곡'),
      '- 노래·가수명: ' + (o.songTitle || '(자유)'),
      '- 콘텐츠 유형: ' + (o.contentType || '노래 소개 대본'),
      '- 분량: ' + dur,
      senior, copy, '', langInst,
    ];
    return { sys: lines.join('\n'), user: '엔카·J-POP 콘텐츠 대본을 작성해주세요.' };
  }

  /* ── 4) 커버곡 소개 ── */
  function _promptCover(o, dur, senior, copy, langInst) {
    const lines = [
      '커버곡 소개 대본 작가. 반응형 훅("이거 보고 눈물났어요" 등)으로 시작.',
      '구조: 반응형 훅 → 커버 소개 → 감동 포인트 → 원곡 비교 멘트 → 시청자 반응 유도.',
      '',
      '[조건]',
      '- 원곡명: ' + (o.songTitle || '미입력'),
      '- 커버 특징: ' + (o.coverDetail || '미입력'),
      '- 커버 유형: ' + (o.coverType || '시니어 커버'),
      '- 분량: ' + dur,
      senior, copy, '', langInst,
    ];
    return { sys: lines.join('\n'), user: '커버곡 소개 대본을 작성해주세요.' };
  }

  /* ── 5) 음악 예능 ── */
  function _promptVariety(o, dur, senior, copy, langInst) {
    const lines = [
      '음악 예능형 대본 작가. 시청자 참여 유도 + 궁금증 유발 + 반전 요소.',
      '구조: 도입부 → 문제·소개 → 정답·랭킹 공개 → 반응 유도 → 마무리 CTA.',
      '',
      '[조건]',
      '- 포맷: ' + (o.varietyFormat || '음악 퀴즈쇼'),
      '- 주제: ' + (o.songTitle || '자유'),
      '- 분량: ' + dur,
      senior, copy, '', langInst,
    ];
    return { sys: lines.join('\n'), user: '음악 예능 대본을 작성해주세요.' };
  }

  /* ── 6) 기존 가사 생성 (창작 가사 + Suno 친화) ── */
  function _promptOriginalLyric(o, dur, senior, copy, langInst) {
    const lines = [
      '당신은 시니어 채널을 위한 창작 가사 작사가입니다.',
      '제공된 분위기·시대·감성을 참고하되, 기존 노래의 가사를 절대 인용·모방하지 마세요.',
      '구조: [Intro] [Verse 1] [Chorus] [Verse 2] [Chorus] [Bridge] [Final Chorus] [Outro] 와 같이 Suno에서 바로 사용 가능한 마커를 포함.',
      '',
      '[조건]',
      '- 음악 장르: ' + (o.musicGenre || '트로트 발라드'),
      '- 향수 강도: ' + (o.nostalgia != null ? o.nostalgia : 4) + '/5',
      '- 향수 시대: ' + (o.era || '1970년대'),
      '- 가사 감성: ' + (o.lyricVibe || '향수+위로+희망'),
      '- 추가 지시: ' + (o.extraInstr || '없음'),
      '- 음원 길이: ' + (o.songLen || '5min'),
      senior, copy, '', langInst,
    ];
    return { sys: lines.join('\n'), user: '시니어 채널용 창작 가사를 작성해주세요.' };
  }

  /* ════════════════════════════════════════════════
     기존 ls-* 패널의 select/input 에서 옵션 수집
     ════════════════════════════════════════════════ */
  function collectOpts(sub) {
    function v(id) { const el = document.getElementById(id); return el ? (el.value || '').trim() : ''; }
    if (sub === 'memory') {
      return {
        koEra:       v('mem-kr-era'),
        jaEra:       v('mem-jp-era'),
        contentType: v('mem-type'),
        songTitle:   v('mem-song'),
      };
    }
    if (sub === 'story') {
      return {
        songTitle: v('str-song'),
        storyType: v('str-type'),
        artist:    v('str-artist'),
      };
    }
    if (sub === 'enka') {
      return {
        enkaCategory: v('enk-cat'),
        contentType:  v('enk-type'),
        songTitle:    v('enk-target'),
      };
    }
    if (sub === 'cover') {
      return {
        songTitle:   v('cov-song'),
        coverDetail: v('cov-detail'),
        coverType:   v('cov-type'),
      };
    }
    if (sub === 'variety') {
      return {
        varietyFormat: v('var-fmt'),
        songTitle:     v('var-topic'),
      };
    }
    /* orig */
    return {
      musicGenre: v('l-music-genre'),
      nostalgia:  v('l-nostalgia-sl'),
      era:        v('l-era'),
      songLen:    v('l-song-len'),
      lyricVibe:  v('l-lyric-vibe'),
      extraInstr: v('l-extra-instr'),
    };
  }

  /* ════════════════════════════════════════════════
     AI 호출 (기존 APIAdapter 또는 callAPI 사용)
     ════════════════════════════════════════════════ */
  async function callAI(sys, user, maxTokens) {
    if (typeof APIAdapter !== 'undefined' && APIAdapter.callWithFallback) {
      return await APIAdapter.callWithFallback(sys, user, { maxTokens: maxTokens || 2400, featureId: 'script-music' });
    }
    if (typeof callAPI === 'function') {
      const key = (typeof getApiKey === 'function') ? getApiKey() : (localStorage.getItem('uc_claude_key') || '');
      return await callAPI(key, sys, user, maxTokens || 2400);
    }
    throw new Error('AI 호출 함수(APIAdapter.callWithFallback 또는 callAPI)가 없습니다.');
  }

  /* ── 공개 API ── */
  window.SCRIPT_MUSIC_PROMPTS = {
    build:      buildPrompt,
    collect:    collectOpts,
    callAI:     callAI,
    copyright:  copyrightInstruction,
    seniorInst: seniorInstruction,
    langInst:   langInstruction,
    duration:   durationLabel,
  };
})();
