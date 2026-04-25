/* ================================================
   modules/settings/api-recommendations.js
   콘텐츠 종류별 API 추천 엔진
   * 가격은 priceProfile 분리 — 절대값 하드코딩 금지
   * 모든 카테고리에서 공통 함수로 추천 결과 조회
   ================================================ */
(function(){
  'use strict';

  /* ════════════════════════════════════════════════
     1) 가격 프로파일 — 관리자가 수정 가능
        실제 금액 표시 금지. priceHint 라벨만 사용.
     ════════════════════════════════════════════════ */
  const MOCA_PRICE_PROFILE = {
    updatedAt: '2026-04-26',
    note: '초기값입니다. 실제 가격은 각 API 공식 가격표 기준으로 업데이트 필요합니다.',
    imagePriority: 'price-first',  /* 이미지 카테고리 기본 정렬 기준 */
    /* providerId → priceHint 라벨 */
    providers: {
      /* 대본 */
      openai:    { priceHint:'중간',   unit:'토큰',   notes:'안정적·구조화' },
      claude:    { priceHint:'중간',   unit:'토큰',   notes:'문체·감정 강점' },
      gemini:    { priceHint:'저비용', unit:'토큰',   notes:'대량 생성 적합' },
      /* 이미지 */
      dalle3:    { priceHint:'고비용', unit:'장',    notes:'고품질용' },
      dalle2:    { priceHint:'저비용', unit:'장',    notes:'대량 생성 적합' },
      flux:      { priceHint:'중간',   unit:'장',    notes:'시드 고정·일관성' },
      stable:    { priceHint:'저비용', unit:'장',    notes:'대량 생성 적합·커스터마이즈' },
      geminiImg: { priceHint:'저비용', unit:'장',    notes:'무료 한도 있음' },
      minimax:   { priceHint:'중간',   unit:'장',    notes:'영상 특화' },
      ideogram:  { priceHint:'중간',   unit:'장',    notes:'썸네일·텍스트 강점' },
      /* 영상 */
      runway:    { priceHint:'고비용', unit:'초',    notes:'시네마틱 품질' },
      pika:      { priceHint:'중간',   unit:'초',    notes:'밸런스' },
      luma:      { priceHint:'중간',   unit:'초',    notes:'자연 모션' },
      heygen:    { priceHint:'고비용', unit:'분',    notes:'아바타 영상' },
      invideo:   { priceHint:'저비용', unit:'분',    notes:'템플릿 영상' },
      /* 음성 */
      elevenlabs:{ priceHint:'고비용', unit:'문자',  notes:'감정·캐릭터 강점' },
      openaiTts: { priceHint:'저비용', unit:'문자',  notes:'대량·안정' },
      googleTts: { priceHint:'저비용', unit:'문자',  notes:'다국어 안정' },
      nijivoice: { priceHint:'중간',   unit:'문자',  notes:'일본어 캐릭터' },
      clova:     { priceHint:'저비용', unit:'문자',  notes:'한국어 자연스러움' },
      /* 음악 */
      suno:      { priceHint:'중간',   unit:'곡',    notes:'프롬프트 기반 곡' },
      udio:      { priceHint:'중간',   unit:'곡',    notes:'고품질 보컬' },
      /* 업로드 (직접 호출) */
      youtubeApi:{ priceHint:'무료',   unit:'호출',  notes:'OAuth 필요' },
      tiktokApi: { priceHint:'무료',   unit:'호출',  notes:'OAuth 필요' },
    },
  };

  /* ════════════════════════════════════════════════
     2) Provider Registry — 카테고리별 메타
     ════════════════════════════════════════════════ */
  const MOCA_PROVIDER_REGISTRY = {
    script: {
      openai: { label:'OpenAI (GPT)',  legacyKey:'uc_openai_key', strengths:['안정성','구조화'],     scores:{quality:9, speed:9, stability:9, cost:6} },
      claude: { label:'Claude',         legacyKey:'uc_claude_key', strengths:['감정','문체','롱폼'], scores:{quality:10,speed:7, stability:9, cost:6} },
      gemini: { label:'Gemini',         legacyKey:'uc_gemini_key', strengths:['저비용','다국어'],   scores:{quality:8, speed:9, stability:8, cost:9} },
    },
    image: {
      dalle3:    { label:'DALL-E 3',         legacyKey:'uc_openai_key',  strengths:['고품질','텍스트 이해'], scores:{quality:9, speed:7, stability:8, cost:3} },
      dalle2:    { label:'DALL-E 2',         legacyKey:'uc_openai_key',  strengths:['저비용'],              scores:{quality:6, speed:9, stability:7, cost:8} },
      flux:      { label:'Flux',             legacyKey:'uc_flux_key',    strengths:['시드 고정','감성'],     scores:{quality:9, speed:8, stability:8, cost:6} },
      stable:    { label:'Stable Diffusion', legacyKey:'uc_sd_key',      strengths:['저비용','커스터마이즈'],scores:{quality:7, speed:8, stability:7, cost:9} },
      geminiImg: { label:'Gemini Imagen',    legacyKey:'uc_gemini_key',  strengths:['무료/대량','속도'],    scores:{quality:7, speed:9, stability:7, cost:10} },
      minimax:   { label:'MiniMax',          legacyKey:'uc_minimax_key', strengths:['영상 특화'],            scores:{quality:7, speed:8, stability:7, cost:6} },
      ideogram:  { label:'Ideogram',         legacyKey:'uc_ideogram_key',strengths:['텍스트 표현','썸네일'], scores:{quality:8, speed:8, stability:8, cost:5} },
    },
    video: {
      runway:  { label:'Runway ML', legacyKey:'uc_runway_key',  strengths:['시네마틱','Gen-3'],     scores:{quality:10,speed:6, stability:8, cost:3} },
      pika:    { label:'Pika',      legacyKey:'uc_pika_key',    strengths:['모션','애니'],          scores:{quality:8, speed:8, stability:8, cost:6} },
      luma:    { label:'Luma',      legacyKey:'uc_luma_key',    strengths:['자연 모션','루프'],     scores:{quality:8, speed:7, stability:8, cost:6} },
      heygen:  { label:'HeyGen',    legacyKey:'uc_heygen_key',  strengths:['아바타','한일'],         scores:{quality:8, speed:7, stability:8, cost:3} },
      invideo: { label:'InVideo',   legacyKey:'',               strengths:['템플릿','수동연동'],     scores:{quality:6, speed:9, stability:8, cost:9} },
    },
    voice: {
      elevenlabs:{ label:'ElevenLabs', legacyKey:'uc_eleven_key',     strengths:['감정','한국어','캐릭터'], scores:{quality:10,speed:8, stability:9, cost:3} },
      openaiTts: { label:'OpenAI TTS', legacyKey:'uc_openai_key',     strengths:['저비용','명료','대량'],   scores:{quality:8, speed:9, stability:9, cost:9} },
      googleTts: { label:'Google TTS', legacyKey:'uc_google_key',     strengths:['다국어','무료한도'],      scores:{quality:7, speed:9, stability:9, cost:9} },
      nijivoice: { label:'Nijivoice',  legacyKey:'uc_nijivoice_key',  strengths:['일본어','캐릭터성'],      scores:{quality:9, speed:8, stability:8, cost:6} },
      clova:     { label:'Clova Voice',legacyKey:'uc_clova_key',      strengths:['한국어','시니어'],         scores:{quality:8, speed:9, stability:9, cost:8} },
    },
    music: {
      suno: { label:'Suno', legacyKey:'uc_suno_key', strengths:['프롬프트','가사 매칭'], scores:{quality:9, speed:8, stability:8, cost:7} },
      udio: { label:'Udio', legacyKey:'uc_udio_key', strengths:['고품질 보컬'],          scores:{quality:9, speed:7, stability:7, cost:6} },
    },
    upload: {
      youtubeApi: { label:'YouTube API',  legacyKey:'',                strengths:['OAuth','자동업로드'],  scores:{quality:9, speed:8, stability:9, cost:10} },
      tiktokApi:  { label:'TikTok API',   legacyKey:'',                strengths:['OAuth','자동업로드'],  scores:{quality:9, speed:8, stability:8, cost:10} },
    },
  };

  /* ════════════════════════════════════════════════
     3) Task별 추천 프리셋 — recommended 순서가 1~3 순위
     ════════════════════════════════════════════════ */
  const MOCA_TASK_RECOMMENDATIONS = {
    script: {
      shorts:           { label:'숏츠 대본',         priority:'hook_quality',     recommended:['openai','claude','gemini'],
                          reason:'짧은 훅·구조화·JSON 안정성이 중요' },
      emotionalShorts:  { label:'감동 숏츠',         priority:'emotion_quality',  recommended:['claude','openai','gemini'],
                          reason:'감정선과 문체가 중요' },
      blog:             { label:'블로그 글',         priority:'longform_quality', recommended:['claude','openai','gemini'],
                          reason:'긴 글 구성과 문체 유지가 중요' },
      newsletter:       { label:'뉴스레터',          priority:'tone_and_structure',recommended:['claude','openai','gemini'],
                          reason:'전달력 있는 톤과 구조가 중요' },
      translation:      { label:'번역/다국어',       priority:'multilingual',     recommended:['gemini','openai','claude'],
                          reason:'다국어 처리와 자연스러움' },
      publicReport:     { label:'공공기관/보고서',   priority:'formal_quality',   recommended:['claude','openai','gemini'],
                          reason:'격식체와 정확성' },
    },
    image: {
      scenes:    { label:'씬별 이미지 (대량 생성)', priority:'price_first',    recommended:['geminiImg','stable','flux'],
                   reason:'여러 장 생성에 비용 부담이 가장 낮은 조합' },
      thumbnail: { label:'썸네일',                  priority:'thumbnail',      recommended:['ideogram','dalle3','flux'],
                   reason:'썸네일 텍스트 가독성·CTR' },
      emotional: { label:'감동 장면',               priority:'quality_first',  recommended:['flux','dalle3','geminiImg'],
                   reason:'감성·인물 품질 우선' },
      info:      { label:'정보형/인포그래픽',       priority:'clarity',        recommended:['dalle3','ideogram','stable'],
                   reason:'명료한 디자인·텍스트 표현' },
    },
    video: {
      cinematic: { label:'시네마틱 영상',           priority:'quality_first',  recommended:['runway','pika','luma'],
                   reason:'시네마틱 품질 우선' },
      avatar:    { label:'아바타/말하는 사람',      priority:'avatar',         recommended:['heygen','runway','pika'],
                   reason:'립싱크·아바타' },
      template:  { label:'템플릿 빠른 영상',         priority:'speed_low_cost', recommended:['invideo','pika','luma'],
                   reason:'템플릿 기반 빠른 제작' },
    },
    voice: {
      seniorEmotion: { label:'시니어 감동 내레이션', priority:'emotion_quality',recommended:['elevenlabs','openaiTts','nijivoice'],
                       reason:'따뜻한 감정 표현이 중요' },
      information:   { label:'정보형 내레이션',     priority:'cost_stability', recommended:['openaiTts','elevenlabs','googleTts'],
                       reason:'명확한 발음과 대량 생성 비용' },
      japanese:      { label:'일본어 내레이션',     priority:'jp_quality',     recommended:['nijivoice','elevenlabs','openaiTts'],
                       reason:'일본어 억양·캐릭터성' },
      korean:        { label:'한국어 자연스러움',   priority:'kr_quality',     recommended:['clova','elevenlabs','openaiTts'],
                       reason:'한국어 발음 자연스러움' },
    },
    music: {
      song: { label:'노래/음원',     priority:'song_quality', recommended:['suno','udio'], reason:'가사·멜로디 매칭' },
      bgm:  { label:'배경음악(BGM)', priority:'bgm_balance',  recommended:['suno','udio'], reason:'장면 분위기 매칭' },
    },
    upload: {
      youtube: { label:'YouTube 업로드', priority:'oauth', recommended:['youtubeApi'], reason:'OAuth 자동 업로드' },
      tiktok:  { label:'TikTok 업로드',  priority:'oauth', recommended:['tiktokApi'],  reason:'OAuth 자동 업로드' },
    },
  };

  /* ════════════════════════════════════════════════
     3-1) Task 별칭 — 각 단계에서 자유로운 이름으로 호출 가능
     ════════════════════════════════════════════════ */
  const MOCA_TASK_ALIASES = {
    script: {
      shortsScript:    'shorts',
      emotionalScript: 'emotionalShorts',
      blogPost:        'blog',
      newsletterPost:  'newsletter',
      translate:       'translation',
      report:          'publicReport',
    },
    image: {
      sceneBulk:       'scenes',
      cardNews:        'scenes',
      thumbnail:       'thumbnail',
      emotionalScene:  'emotional',
      infoGraphic:     'info',
    },
    video: {
      shortsAssembly:  'cinematic',
      imageToVideo:    'cinematic',
      avatarVideo:     'avatar',
      templateVideo:   'template',
    },
    voice: {
      seniorEmotionVoice: 'seniorEmotion',
      infoVoice:          'information',
      japaneseVoice:      'japanese',
      koreanVoice:        'korean',
    },
    music: {
      songMaker:  'song',
      bgmMaker:   'bgm',
    },
    upload: {
      youtubeUpload: 'youtube',
      tiktokUpload:  'tiktok',
    },
  };

  /* ════════════════════════════════════════════════
     3-2) Task 별 기본 mode — 사용자 선호 기준이 없을 때 폴백
        이미지 sceneBulk/cardNews → budget (가격 우선)
        썸네일 → quality, 감동 장면 → balanced
     ════════════════════════════════════════════════ */
  const MOCA_TASK_DEFAULT_MODE = {
    image: {
      scenes:    'budget',     /* 씬별 대량 — 가격 우선 */
      cardNews:  'budget',
      thumbnail: 'quality',    /* 썸네일 — CTR/가독성 */
      emotional: 'balanced',
      info:      'balanced',
    },
    video: {
      cinematic: 'quality',
      avatar:    'quality',
      template:  'speed',
    },
    voice: {
      seniorEmotion: 'quality',
      information:   'budget',
      japanese:      'quality',
      korean:        'balanced',
    },
    script: {
      shorts:          'balanced',
      emotionalShorts: 'quality',
      blog:            'quality',
      newsletter:      'balanced',
      translation:     'budget',
      publicReport:    'quality',
    },
    music:  { song:'quality', bgm:'balanced' },
    upload: { youtube:'balanced', tiktok:'balanced' },
  };

  /* ════════════════════════════════════════════════
     3-3) 사용자 선호 기준 (통합 설정에서 저장)
        localStorage: moca_pref_mode = 'budget'|'balanced'|'quality'|'speed'
     ════════════════════════════════════════════════ */
  const PREF_MODE_KEY = 'moca_pref_mode';
  function getUserPreferredMode() {
    try { return localStorage.getItem(PREF_MODE_KEY) || ''; } catch(_) { return ''; }
  }
  function setUserPreferredMode(mode) {
    if (!MOCA_MODE_WEIGHTS[mode]) return false;
    try { localStorage.setItem(PREF_MODE_KEY, mode); return true; } catch(_) { return false; }
  }
  window.getUserPreferredMode = getUserPreferredMode;
  window.setUserPreferredMode = setUserPreferredMode;

  /* alias 해석 */
  function _resolveTaskKey(category, taskKey) {
    const aliases = MOCA_TASK_ALIASES[category] || {};
    return aliases[taskKey] || taskKey;
  }
  /* 기본 mode 결정: opts.mode > userPref > taskDefault > 'balanced' */
  function _resolveMode(category, taskKey, optsMode) {
    if (optsMode && MOCA_MODE_WEIGHTS[optsMode]) return optsMode;
    const userPref = getUserPreferredMode();
    if (userPref && MOCA_MODE_WEIGHTS[userPref]) return userPref;
    const td = (MOCA_TASK_DEFAULT_MODE[category] || {})[taskKey];
    if (td && MOCA_MODE_WEIGHTS[td]) return td;
    return 'balanced';
  }
  window._resolveMode = _resolveMode;

  /* ════════════════════════════════════════════════
     4) 모드(가중치) — budget/balanced/quality/speed
     ════════════════════════════════════════════════ */
  const MOCA_MODE_WEIGHTS = {
    budget:   { quality:1, speed:1, stability:1, cost:4 },
    balanced: { quality:2, speed:1, stability:2, cost:2 },
    quality:  { quality:4, speed:1, stability:1, cost:1 },
    speed:    { quality:1, speed:4, stability:1, cost:2 },
  };

  /* ════════════════════════════════════════════════
     5) 키 보유 여부 (legacy + 신규 통합 — s3-image-keys.js 와 호환)
     ════════════════════════════════════════════════ */
  function hasProviderKey(category, providerId) {
    /* 1) 신규 모달 헬퍼 (이미지) */
    if (category === 'image' && typeof window.s3HasImageApiKey === 'function') {
      const idMap = { dalle3:'dalle3', dalle2:'dalle2', flux:'flux', stable:'sd', geminiImg:'gemini', minimax:'minimax', ideogram:'ideogram' };
      if (idMap[providerId]) return !!window.s3HasImageApiKey(idMap[providerId]);
    }
    /* 2) legacy key 직접 확인 */
    const reg = (MOCA_PROVIDER_REGISTRY[category] || {})[providerId];
    if (!reg) return false;
    if (!reg.legacyKey) return false;
    try {
      const v = localStorage.getItem(reg.legacyKey);
      return !!(v && v.trim().length > 4);
    } catch(_) { return false; }
  }

  /* ════════════════════════════════════════════════
     6) 점수 계산
     ════════════════════════════════════════════════ */
  function getProviderScore(category, providerId, mode) {
    const reg = (MOCA_PROVIDER_REGISTRY[category] || {})[providerId];
    if (!reg) return 0;
    const w = MOCA_MODE_WEIGHTS[mode] || MOCA_MODE_WEIGHTS.balanced;
    const s = reg.scores || {};
    return ((s.quality||0)*w.quality + (s.speed||0)*w.speed +
            (s.stability||0)*w.stability + (s.cost||0)*w.cost);
  }
  window.getProviderScore = getProviderScore;

  /* ════════════════════════════════════════════════
     7) 추천 결과 조회 — 단일 함수
        getApiRecommendations('image', 'scenes') →
          [{ rank, providerId, label, reason, priceHint, scores, hasKey, strengths }, ...]
     ════════════════════════════════════════════════ */
  function getApiRecommendations(category, taskKey, opts) {
    opts = opts || {};
    const tasks = MOCA_TASK_RECOMMENDATIONS[category];
    if (!tasks) return [];
    const resolvedKey = _resolveTaskKey(category, taskKey);
    const task = tasks[resolvedKey] || tasks[Object.keys(tasks)[0]];
    if (!task) return [];
    const mode = _resolveMode(category, resolvedKey, opts.mode);

    const list = (task.recommended || []).map(function(pid, i){
      const reg   = (MOCA_PROVIDER_REGISTRY[category] || {})[pid] || {};
      const price = (MOCA_PRICE_PROFILE.providers[pid]) || {};
      return {
        rank:      i + 1,
        providerId:pid,
        label:     reg.label || pid,
        reason:    task.reason,
        priority:  task.priority,
        priceHint: price.priceHint || '?',
        priceUnit: price.unit      || '',
        priceNote: price.notes     || '',
        scores:    reg.scores      || {},
        strengths: reg.strengths   || [],
        hasKey:    hasProviderKey(category, pid),
        mode:      mode,
      };
    });

    /* opts.resort: true 일 때만 사용자 mode 기준으로 재정렬.
       기본은 큐레이션된 1~3순위를 보존 (가격 우선 등 task priority 가 이미 반영돼 있음). */
    if (opts.resort) {
      list.sort(function(a,b){
        return getProviderScore(category, b.providerId, mode)
             - getProviderScore(category, a.providerId, mode);
      });
      list.forEach(function(it, i){ it.rank = i + 1; });
    }
    return list;
  }
  window.getApiRecommendations = getApiRecommendations;

  /* 단순 ID 배열만 필요한 경우 */
  function getRecommendedProviders(category, taskKey) {
    return getApiRecommendations(category, taskKey).map(function(x){ return x.providerId; });
  }
  window.getRecommendedProviders = getRecommendedProviders;

  /* 단일 ID (1순위만) */
  function getRecommendedProvider(category, taskKey) {
    const r = getApiRecommendations(category, taskKey);
    return r.length ? r[0].providerId : '';
  }
  window.getRecommendedProvider = getRecommendedProvider;

  /* ════════════════════════════════════════════════
     8) 추천 카드 HTML 빌더 (각 카테고리에서 재사용)
        renderRecommendationCards('image', 'scenes', { onPick, openSettings })
     ════════════════════════════════════════════════ */
  function renderRecommendationCards(category, taskKey, opts) {
    opts = opts || {};
    const recs = getApiRecommendations(category, taskKey, { mode: opts.mode });
    if (!recs.length) return '';

    const taskMeta = (MOCA_TASK_RECOMMENDATIONS[category] || {})[taskKey] || {};
    const onPick   = opts.onPick   || ("apiRecommendPick('" + category + "','" + taskKey + "','PROVIDER')");
    const onOpen   = opts.openSettings || 'renderApiSettings()';

    return ''
      + '<div class="apirec-wrap">'
      +   '<div class="apirec-hd">'
      +     '<span class="apirec-title">⭐ AI 추천 — ' + (taskMeta.label || taskKey) + '</span>'
      +     '<span class="apirec-priority">기준: ' + _priorityLabel(taskMeta.priority) + '</span>'
      +   '</div>'
      +   '<div class="apirec-cards">'
      +     recs.map(function(r){
            const pickCall = onPick.replace('PROVIDER', r.providerId);
            return ''
              + '<div class="apirec-card apirec-rank-' + r.rank + (r.hasKey?' apirec-haskey':'') + '">'
              +   '<div class="apirec-rank-badge">' + r.rank + '순위</div>'
              +   '<div class="apirec-card-hd">'
              +     '<span class="apirec-card-label">' + _esc(r.label) + '</span>'
              +     '<span class="apirec-key-status apirec-key-' + (r.hasKey?'on':'off') + '">'
              +       (r.hasKey ? '✅ 키 저장됨' : '⚠️ 키 없음')
              +     '</span>'
              +   '</div>'
              +   '<div class="apirec-card-reason">' + _esc(r.reason) + '</div>'
              +   '<div class="apirec-card-meta">'
              +     '<span>💰 ' + _esc(r.priceHint) + '</span>'
              +     '<span>⚡ 속도 ' + (r.scores.speed || '-') + '</span>'
              +     '<span>🎯 품질 ' + (r.scores.quality || '-') + '</span>'
              +     '<span>🛡 안정 ' + (r.scores.stability || '-') + '</span>'
              +   '</div>'
              +   '<div class="apirec-card-actions">'
              +     '<button class="apirec-btn-pick" onclick="' + pickCall + '">' +
                    (r.hasKey ? '이 provider 선택' : '선택 (키 입력 필요)') + '</button>'
              +     (r.hasKey ? '' : '<button class="apirec-btn-set" onclick="' + onOpen + '">🔑 키 설정</button>')
              +   '</div>'
              + '</div>';
          }).join('')
      +   '</div>'
      + '</div>';
  }
  window.renderRecommendationCards = renderRecommendationCards;

  function _priorityLabel(p) {
    const map = {
      'price_first':       '가격 우선',
      'quality_first':     '품질 우선',
      'cost_stability':    '가성비',
      'speed_low_cost':    '속도·저비용',
      'thumbnail':         '썸네일 (CTR)',
      'emotion_quality':   '감정 품질',
      'hook_quality':      '훅 품질',
      'longform_quality':  '롱폼 품질',
      'tone_and_structure':'톤·구조',
      'multilingual':      '다국어',
      'formal_quality':    '격식·정확성',
      'jp_quality':        '일본어 품질',
      'kr_quality':        '한국어 품질',
      'clarity':           '명료성',
      'avatar':            '아바타',
      'song_quality':      '곡 품질',
      'bgm_balance':       'BGM 균형',
      'oauth':             'OAuth 인증',
    };
    return map[p] || p || '균형';
  }

  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  /* ════════════════════════════════════════════════
     9) 기본 선택 핸들러 (다른 카테고리에서 override 가능)
     ════════════════════════════════════════════════ */
  window.apiRecommendPick = function(category, taskKey, providerId) {
    /* 키가 없으면 통합 설정 모달 열기 */
    if (!hasProviderKey(category, providerId)) {
      const yes = confirm('이 provider 의 API 키가 없습니다. 통합 API 설정을 열까요?');
      if (yes && typeof window.renderApiSettings === 'function') {
        window.renderApiSettings();
      }
      return;
    }
    /* STUDIO.project 에 저장 (카테고리별 키) */
    const proj = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
    if (category === 'image') {
      proj.s3 = proj.s3 || {};
      proj.s3.imageProvider = providerId;
      proj.s3.recommendedImageProviders = getRecommendedProviders('image', taskKey);
    } else if (category === 'voice') {
      proj.s2 = proj.s2 || {};
      proj.s2.voiceProvider = providerId;
      proj.s2.recommendedVoiceProviders = getRecommendedProviders('voice', taskKey);
    } else if (category === 'script') {
      proj.s1 = proj.s1 || {};
      proj.s1.scriptProvider = providerId;
      proj.s1.recommendedScriptProviders = getRecommendedProviders('script', taskKey);
    }
    if (typeof studioSave === 'function') studioSave();
    if (typeof window.cbSave === 'function') window.cbSave();
    alert('✅ ' + (((MOCA_PROVIDER_REGISTRY[category]||{})[providerId])||{}).label + ' 선택됨');
  };

  /* ════════════════════════════════════════════════
     10) CSS
     ════════════════════════════════════════════════ */
  function _injectCSS() {
    if (document.getElementById('apirec-style')) return;
    const st = document.createElement('style');
    st.id = 'apirec-style';
    st.textContent = ''
      + '.apirec-wrap{margin:10px 0;padding:12px;background:linear-gradient(135deg,#fff5fa,#f5f0ff);'
      +   'border:1.5px solid #e8d9f5;border-radius:14px}'
      + '.apirec-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px}'
      + '.apirec-title{font-size:13px;font-weight:800;color:#5b1a4a}'
      + '.apirec-priority{font-size:11px;color:#7b4060;background:#fff;padding:2px 10px;border-radius:20px;font-weight:700}'
      + '.apirec-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}'
      + '@media(max-width:700px){.apirec-cards{grid-template-columns:1fr}}'
      + '.apirec-card{position:relative;background:#fff;border:1.5px solid #f1dce7;border-radius:11px;padding:10px 12px;transition:.12s}'
      + '.apirec-card:hover{border-color:#9181ff;transform:translateY(-1px)}'
      + '.apirec-card.apirec-rank-1{border-color:#ef6fab;background:linear-gradient(135deg,#fff,#fff1f8)}'
      + '.apirec-card.apirec-haskey{box-shadow:0 2px 8px rgba(34,197,94,.12)}'
      + '.apirec-rank-badge{position:absolute;top:-8px;left:10px;padding:2px 9px;border-radius:20px;'
      +   'font-size:10px;font-weight:800;background:#9181ff;color:#fff}'
      + '.apirec-card.apirec-rank-1 .apirec-rank-badge{background:#ef6fab}'
      + '.apirec-card-hd{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px;margin-top:4px}'
      + '.apirec-card-label{font-size:13px;font-weight:800;color:#2b2430}'
      + '.apirec-key-status{font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;white-space:nowrap}'
      + '.apirec-key-on{background:#effbf7;color:#1a7a5a}'
      + '.apirec-key-off{background:#fff1f1;color:#c0392b}'
      + '.apirec-card-reason{font-size:11px;color:#7b7077;line-height:1.4;margin-bottom:6px;min-height:30px}'
      + '.apirec-card-meta{display:flex;gap:6px;flex-wrap:wrap;font-size:10.5px;color:#5a4a56;margin-bottom:8px}'
      + '.apirec-card-meta span{background:#fbf7f9;padding:2px 7px;border-radius:6px;border:1px solid #f1dce7}'
      + '.apirec-card-actions{display:flex;gap:4px;flex-wrap:wrap}'
      + '.apirec-btn-pick{flex:1;padding:6px 10px;border:none;border-radius:8px;'
      +   'background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit}'
      + '.apirec-btn-pick:hover{opacity:.9}'
      + '.apirec-btn-set{padding:6px 10px;border:1.5px solid #9181ff;border-radius:8px;'
      +   'background:#fff;color:#9181ff;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit}'
      + '.apirec-btn-set:hover{background:#9181ff;color:#fff}'
      + '.apirec-section-title{font-size:12px;font-weight:800;color:#5b1a4a;margin:12px 0 6px}'
      ;
    document.head.appendChild(st);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _injectCSS);
  } else { _injectCSS(); }

  /* 외부 노출 */
  window.MOCA_PROVIDER_REGISTRY      = MOCA_PROVIDER_REGISTRY;
  window.MOCA_TASK_RECOMMENDATIONS   = MOCA_TASK_RECOMMENDATIONS;
  window.MOCA_PRICE_PROFILE          = MOCA_PRICE_PROFILE;
  window.MOCA_MODE_WEIGHTS           = MOCA_MODE_WEIGHTS;
  window.hasProviderKey              = hasProviderKey;
})();
