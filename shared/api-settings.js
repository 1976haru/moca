/* ═══════════════════════════════════════════
   MOCA 통합 API 설정 v2
   카테고리별 분류 + 발급 안내
═══════════════════════════════════════════ */

var MOCA_APIS_V2 = {
  '대본 생성': [
    { id:'claude',    name:'Claude (Anthropic)', keyName:'uc_claude_key',
      desc:'대본 생성·AI 검수·번역 핵심 AI',
      placeholder:'sk-ant-api03-...',
      guide:'1. console.anthropic.com 접속\n2. 로그인 → API Keys\n3. Create Key 클릭\n4. 키 복사',
      url:'https://console.anthropic.com/',
      free:'$5 무료 크레딧 제공' },
    { id:'openai',    name:'OpenAI (GPT-4)',      keyName:'uc_openai_key',
      desc:'대본 보조·A/B 테스트·번역',
      placeholder:'sk-proj-...',
      guide:'1. platform.openai.com 접속\n2. API Keys → Create new secret key\n3. 키 복사',
      url:'https://platform.openai.com/api-keys',
      free:'$5 무료 크레딧 (신규)' },
    { id:'gemini',    name:'Google Gemini',       keyName:'uc_gemini_key',
      desc:'대본 보조·무료 사용 가능',
      placeholder:'AIzaSy...',
      guide:'1. aistudio.google.com 접속\n2. Get API Key 클릭\n3. 키 복사',
      url:'https://aistudio.google.com/apikey',
      free:'무료 티어 제공 (분당 60회)' },
    { id:'perplexity',name:'Perplexity',          keyName:'uc_perplexity_key',
      desc:'웹 검색 기반 사실 확인·뉴스/리서치',
      placeholder:'pplx-...',
      guide:'1. perplexity.ai/settings/api 접속\n2. API Key 발급',
      url:'https://www.perplexity.ai/settings/api',
      free:'유료 (월 $5~)' },
  ],
  '이미지 생성': [
    { id:'openai_img', name:'DALL-E 3 (OpenAI)',  keyName:'uc_openai_key',
      desc:'고품질 이미지 생성 (OpenAI 키 공유)',
      placeholder:'sk-proj-... (OpenAI 키와 동일)',
      guide:'OpenAI API 키와 동일하게 사용됩니다.',
      url:'https://platform.openai.com/api-keys',
      free:'이미지당 약 ₩40' },
    { id:'flux',      name:'Flux (Black Forest)', keyName:'uc_flux_key',
      desc:'시드 고정·캐릭터 일관성 최적',
      placeholder:'...',
      guide:'1. api.bfl.ml 접속\n2. 회원가입\n3. API Key 발급',
      url:'https://api.bfl.ml/',
      free:'이미지당 약 ₩15' },
    { id:'minimax',   name:'MiniMax',             keyName:'uc_minimax_key',
      desc:'영상용 이미지·한일 감성 특화',
      placeholder:'...',
      guide:'1. minimax.io 접속\n2. 회원가입\n3. API Key 발급',
      url:'https://www.minimax.io/',
      free:'이미지당 약 ₩10' },
    { id:'ideogram',  name:'Ideogram',            keyName:'uc_ideogram_key',
      desc:'썸네일 텍스트 삽입 특화',
      placeholder:'...',
      guide:'1. ideogram.ai 접속\n2. 회원가입 → API\n3. 키 발급',
      url:'https://ideogram.ai/api',
      free:'이미지당 약 ₩20' },
    { id:'sd',           name:'Stable Diffusion',     keyName:'uc_sd_key',
      desc:'저비용 대량·커스터마이즈',
      placeholder:'...',
      guide:'1. stability.ai 또는 RunPod 등 호스팅 사이트에서 발급',
      url:'https://platform.stability.ai/',
      free:'호스팅 별 다름' },
    { id:'gemini_imagen',name:'Gemini Imagen',         keyName:'uc_gemini_key',
      desc:'무료 한도·속도 (Gemini 키 공유)',
      placeholder:'AIzaSy... (Gemini 키와 동일)',
      guide:'Gemini API 키와 동일하게 사용됩니다.',
      url:'https://aistudio.google.com/apikey',
      free:'Gemini 무료 한도 내' },
  ],
  '스톡 이미지·영상': [
    { id:'pexels',    name:'Pexels',              keyName:'uc_pexels_key',
      desc:'무료 스톡 이미지·영상 (월 25,000회)',
      placeholder:'...',
      guide:'1. pexels.com/api 접속\n2. 이메일 가입\n3. API 키 즉시 발급',
      url:'https://www.pexels.com/api/',
      free:'무료·상업용 OK·월 25,000회' },
    { id:'pixabay',   name:'Pixabay',             keyName:'uc_pixabay_key',
      desc:'무료 스톡 이미지·영상 (무제한)',
      placeholder:'...',
      guide:'1. pixabay.com 가입\n2. pixabay.com/api/docs 접속\n3. 키 발급',
      url:'https://pixabay.com/api/docs/',
      free:'무료·상업용 OK·무제한' },
    { id:'unsplash',  name:'Unsplash',            keyName:'uc_unsplash_key',
      desc:'고품질 사진·감성',
      placeholder:'...',
      guide:'1. unsplash.com/oauth/applications 접속\n2. New Application\n3. Access Key 복사',
      url:'https://unsplash.com/developers',
      free:'시간당 50회 무료' },
  ],
  '음성 생성': [
    { id:'elevenlabs', name:'ElevenLabs',         keyName:'uc_eleven_key',
      desc:'감정 연기 최고·자연스러운 TTS',
      placeholder:'...hex...',
      guide:'1. elevenlabs.io 접속\n2. 회원가입\n3. Profile → API Key 복사',
      url:'https://elevenlabs.io/app/settings/api',
      free:'월 10,000자 무료' },
    { id:'clova',     name:'ClovaVoice (네이버)', keyName:'uc_clova_key',
      desc:'한국어 TTS 최적화·저렴',
      placeholder:'Client ID',
      guide:'1. developers.naver.com 접속\n2. 애플리케이션 등록\n3. CLOVA Voice 선택\n4. Client ID 복사',
      url:'https://developers.naver.com/apps/#/register',
      free:'월 1,000자 무료' },
    { id:'openai_tts', name:'OpenAI TTS',         keyName:'uc_openai_key',
      desc:'저렴·자연스러운 다국어 TTS (OpenAI 키 공유)',
      placeholder:'sk-proj-... (OpenAI 키와 동일)',
      guide:'OpenAI API 키와 동일하게 사용됩니다.',
      url:'https://platform.openai.com/api-keys',
      free:'1,000자당 약 ₩20' },
    { id:'voicevox',  name:'VoiceVox',            keyName:'',
      desc:'일본어 TTS 무료·로컬 설치',
      placeholder:'로컬 설치 필요 (API 키 없음)',
      guide:'1. voicevox.hiroshiba.jp 접속\n2. 다운로드 → 설치\n3. 실행 후 자동 연결',
      url:'https://voicevox.hiroshiba.jp/',
      free:'완전 무료' },
    { id:'nijivoice', name:'Nijivoice',           keyName:'uc_nijivoice_key',
      desc:'일본어 캐릭터 TTS·억양 자연스러움',
      placeholder:'...',
      guide:'1. nijivoice.com 가입\n2. API Key 발급',
      url:'https://app.nijivoice.com/',
      free:'유료 ($5~)' },
    { id:'google_tts',name:'Google TTS',          keyName:'uc_google_key',
      desc:'다국어 안정·무료 한도',
      placeholder:'AIzaSy...',
      guide:'1. console.cloud.google.com 접속\n2. Text-to-Speech API 활성화\n3. API 키 생성',
      url:'https://cloud.google.com/text-to-speech',
      free:'월 4M자 무료 (WaveNet 1M자)' },
    { id:'azure_tts', name:'Azure TTS',           keyName:'uc_azure_key',
      desc:'엔터프라이즈·다국어',
      placeholder:'subscription key',
      guide:'1. portal.azure.com 가입\n2. Speech 서비스 생성\n3. Key 복사',
      url:'https://portal.azure.com/',
      free:'월 50만자 무료' },
  ],
  '영상 편집·렌더링': [
    { id:'shotstack', name:'Shotstack',           keyName:'uc_shotstack_key',
      desc:'클라우드 영상 렌더링·자동 편집',
      placeholder:'...',
      guide:'1. shotstack.io 접속\n2. 회원가입\n3. API Key 복사',
      url:'https://shotstack.io/',
      free:'월 20회 무료 렌더링' },
    { id:'creatomate',name:'Creatomate',          keyName:'uc_creatomate_key',
      desc:'템플릿 기반 자동 영상 생성',
      placeholder:'...',
      guide:'1. creatomate.com 접속\n2. 회원가입\n3. API Key 복사',
      url:'https://creatomate.com/',
      free:'월 5회 무료' },
    { id:'heygen',    name:'HeyGen (AI 아바타)',   keyName:'uc_heygen_key',
      desc:'AI 아바타·립싱크 영상 생성',
      placeholder:'...',
      guide:'1. heygen.com 접속\n2. 회원가입\n3. API → Key 발급',
      url:'https://app.heygen.com/settings?nav=API',
      free:'월 1분 무료' },
    { id:'invideo',   name:'InVideo',             keyName:'',
      desc:'템플릿 영상·수동 연동 (외부 도구)',
      placeholder:'(API 없음 — 외부 사이트 사용)',
      guide:'invideo.io 접속하여 직접 사용',
      url:'https://invideo.io/',
      free:'무료 플랜 있음' },
    { id:'runway',    name:'Runway ML',           keyName:'uc_runway_key',
      desc:'시네마틱 영상·Gen-3·고품질 (고비용)',
      placeholder:'...',
      guide:'1. runwayml.com 가입\n2. API Key 발급',
      url:'https://runwayml.com/',
      free:'유료 (월 $12~)' },
    { id:'pika',      name:'Pika',                keyName:'uc_pika_key',
      desc:'이미지→영상·모션·애니',
      placeholder:'...',
      guide:'1. pika.art 가입\n2. API 신청',
      url:'https://pika.art/',
      free:'유료 ($10~)' },
    { id:'luma',      name:'Luma',                keyName:'uc_luma_key',
      desc:'자연 모션·루프 영상',
      placeholder:'...',
      guide:'1. lumalabs.ai 가입\n2. API Key 발급',
      url:'https://lumalabs.ai/',
      free:'유료' },
    { id:'minimax_video', name:'MiniMax Video',   keyName:'uc_minimax_key',
      desc:'아시아 인물·감성 영상',
      placeholder:'... (MiniMax 키 공유)',
      guide:'MiniMax API 키와 동일하게 사용됩니다.',
      url:'https://www.minimax.io/',
      free:'유료' },
  ],
  '음악·Suno': [
    { id:'suno',         name:'Suno',                  keyName:'uc_suno_key',
      desc:'프롬프트 기반 곡·가사 매칭',
      placeholder:'...',
      guide:'1. suno.ai 가입\n2. API/Pro 플랜 가입',
      url:'https://suno.ai/',
      free:'월 $10 (Pro)' },
    { id:'udio',         name:'Udio',                  keyName:'uc_udio_key',
      desc:'고품질 보컬·창작 음악',
      placeholder:'...',
      guide:'1. udio.com 가입\n2. 유료 플랜',
      url:'https://www.udio.com/',
      free:'유료' },
    { id:'free_bgm',     name:'무료 BGM',                keyName:'',
      desc:'YouTube Audio Library 등 무료 BGM 사용',
      placeholder:'(API 없음)',
      guide:'YouTube Studio > Audio Library 활용',
      url:'https://studio.youtube.com/',
      free:'무료' },
    { id:'suno_prompt',  name:'Suno 복사용 프롬프트',     keyName:'',
      desc:'가사·음원 프롬프트 생성 후 Suno에 복사',
      placeholder:'(API 없음 — 프롬프트만 생성)',
      guide:'프로젝트에서 가사·음원 프롬프트 생성 → Suno 사이트에 복사',
      url:'https://suno.ai/',
      free:'무료 (프롬프트만)' },
  ],
  '업로드·배포': [
    { id:'youtube',   name:'YouTube Data API',    keyName:'uc_youtube_key',
      desc:'유튜브 자동 업로드·제목·태그',
      placeholder:'AIzaSy...',
      guide:'1. console.cloud.google.com 접속\n2. 새 프로젝트 생성\n3. YouTube Data API v3 활성화\n4. 사용자 인증 정보 → API 키 생성',
      url:'https://console.cloud.google.com/',
      free:'무료 (할당량 있음)' },
    { id:'instagram', name:'Instagram Graph API', keyName:'uc_instagram_key',
      desc:'인스타그램 릴스 자동 업로드',
      placeholder:'EAAxxxx...',
      guide:'1. developers.facebook.com 접속\n2. 앱 생성\n3. Instagram Graph API 추가\n4. 액세스 토큰 발급',
      url:'https://developers.facebook.com/',
      free:'무료 (비즈니스 계정 필요)' },
    { id:'tiktok',    name:'TikTok API',          keyName:'uc_tiktok_key',
      desc:'틱톡 자동 업로드',
      placeholder:'...',
      guide:'1. developers.tiktok.com 접속\n2. 앱 등록\n3. Content Posting API 신청',
      url:'https://developers.tiktok.com/',
      free:'무료 (심사 필요)' },
    { id:'facebook',  name:'Facebook Pages',       keyName:'uc_facebook_key',
      desc:'페이지 자동 게시',
      placeholder:'EAA...',
      guide:'1. developers.facebook.com 접속\n2. 앱 생성\n3. Pages API 권한 승인',
      url:'https://developers.facebook.com/',
      free:'무료' },
    { id:'naver_blog',name:'Naver Blog',           keyName:'uc_naver_key',
      desc:'네이버 블로그 자동 게시',
      placeholder:'Client ID:Secret',
      guide:'1. developers.naver.com 가입\n2. 애플리케이션 등록\n3. 블로그 API 권한',
      url:'https://developers.naver.com/apps/',
      free:'무료' },
    { id:'threads',   name:'Threads',              keyName:'uc_threads_key',
      desc:'스레드 단문 게시',
      placeholder:'access token',
      guide:'1. Meta Developers 등록\n2. Threads API 신청',
      url:'https://developers.facebook.com/docs/threads',
      free:'무료' },
  ],
  '기타 (확장)': [
    { id:'notion',    name:'Notion API',          keyName:'uc_notion_key',
      desc:'콘텐츠 관리·일정 연동',
      placeholder:'secret_...',
      guide:'1. notion.so/my-integrations 접속\n2. New integration\n3. 토큰 복사',
      url:'https://www.notion.so/my-integrations',
      free:'무료' },
    { id:'airtable',  name:'Airtable',            keyName:'uc_airtable_key',
      desc:'콘텐츠 데이터베이스 관리',
      placeholder:'pat...',
      guide:'1. airtable.com/create/tokens 접속\n2. Create token\n3. 복사',
      url:'https://airtable.com/create/tokens',
      free:'무료 플랜 있음' },
    { id:'zapier',    name:'Zapier Webhook',       keyName:'uc_zapier_key',
      desc:'자동화 워크플로우 연동',
      placeholder:'https://hooks.zapier.com/...',
      guide:'1. zapier.com 접속\n2. Zap 생성\n3. Webhook URL 복사',
      url:'https://zapier.com/',
      free:'월 100회 무료' },
  ],
};

function renderApiSettings(){
  var ex = document.getElementById('api-settings-overlay');
  if(ex){ ex.remove(); return; }

  var catIcons = {
    '대본 생성':'📝','이미지 생성':'🎨','스톡 이미지·영상':'🖼','음성 생성':'🎙',
    '영상 편집·렌더링':'🎬','음악·Suno':'🎵','업로드·배포':'📤','기타 (확장)':'🔧'
  };

  /* 전체 설정 완료 개수 */
  var totalApis = 0, doneApis = 0;
  Object.values(MOCA_APIS_V2).forEach(function(apis){
    apis.forEach(function(a){
      totalApis++;
      if(!a.keyName || (localStorage.getItem(a.keyName)||'').length > 8) doneApis++;
    });
  });

  var html = '<div style="max-width:760px;margin:0 auto;padding:24px">' +

    /* 헤더 */
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
      '<h3 style="margin:0;font-size:18px;font-weight:900">⚙️ API 통합 설정</h3>' +
      '<div style="font-size:12px;color:var(--sub)">'+doneApis+' / '+totalApis+' 설정 완료</div>' +
    '</div>' +
    '<div style="font-size:12px;color:var(--sub);margin-bottom:16px">' +
      '한 번만 입력하면 모든 카테고리에서 자동 사용 · 입력 후에는 표시되지 않아요' +
    '</div>' +

    /* 진행 바 */
    '<div style="background:#eee;border-radius:999px;height:6px;margin-bottom:20px">' +
      '<div style="background:linear-gradient(135deg,var(--pink),var(--purple));height:100%;border-radius:999px;width:'+Math.round(doneApis/totalApis*100)+'%;transition:.5s"></div>' +
    '</div>';

  /* 추천 스택 프리셋 — 6개 패키지 한 번에 적용 */
  if (typeof window.MOCA_RECOMMENDED_STACKS !== 'undefined' && typeof window.applyStackPreset === 'function') {
    var stacks = window.MOCA_RECOMMENDED_STACKS;
    var appliedId = (window.STUDIO && window.STUDIO.project && window.STUDIO.project.appliedStackPreset) || '';
    var stackHtml = '';
    Object.keys(stacks).forEach(function(id){
      var s = stacks[id];
      var on = (appliedId === id);
      stackHtml += '<button class="moca-stack-card'+(on?' on':'')+'" onclick="ucApplyStack(\''+id+'\')">' +
        '<div class="moca-stack-card-hd">' +
          '<span class="moca-stack-card-label">'+s.label+'</span>' +
          (on ? '<span class="moca-stack-card-on">적용됨</span>' : '') +
        '</div>' +
        '<div class="moca-stack-card-desc">'+s.description+'</div>' +
      '</button>';
    });
    html += '<details open style="margin-bottom:14px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px">' +
      '<summary style="cursor:pointer;list-style:none;font-weight:900;font-size:14px;display:flex;align-items:center;gap:8px">' +
        '<span>📦 추천 스택 프리셋</span>' +
        '<span style="font-size:11px;font-weight:600;color:var(--sub);margin-left:auto">하나 선택 시 5개 단계 추천 자동 설정</span>' +
        '<span style="font-size:12px;color:var(--sub)">▾</span>' +
      '</summary>' +
      '<div class="moca-stack-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin-top:10px">' + stackHtml + '</div>' +
    '</details>';
  }

  /* 기본 선호 기준 — 추천 엔진이 사용 (각 단계에서 자동 적용) */
  if (typeof window.setUserPreferredMode === 'function') {
    var curPref = (typeof window.getUserPreferredMode === 'function')
      ? (window.getUserPreferredMode() || '') : '';
    var prefOpts = [
      { id:'budget',   ico:'💰', label:'가격 우선',  desc:'대량 생성·저비용 위주' },
      { id:'balanced', ico:'⚖️', label:'가성비',     desc:'품질·속도·비용 균형' },
      { id:'quality',  ico:'🎯', label:'품질 우선',  desc:'고품질·완성도 우선' },
      { id:'speed',    ico:'⚡', label:'속도 우선',  desc:'빠른 생성 우선' },
    ];
    html += '<div style="margin-bottom:14px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px">' +
      '<div style="font-weight:900;font-size:14px;margin-bottom:8px;display:flex;align-items:center;gap:8px">' +
        '<span>🎚 기본 선호 기준</span>' +
        '<span style="font-size:11px;font-weight:600;color:var(--sub);margin-left:auto">미선택 시 작업별 기본값 사용</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">' +
      prefOpts.map(function(o){
        var on = (curPref === o.id);
        return '<button onclick="ucSetPrefMode(\''+o.id+'\')" '+
          'style="border:1.5px solid '+(on?'var(--pink)':'var(--line)')+';'+
          'background:'+(on?'var(--pink-soft)':'#fff')+';border-radius:10px;padding:10px 8px;'+
          'cursor:pointer;font-family:inherit;text-align:center;transition:.12s">'+
          '<div style="font-size:18px;line-height:1">'+o.ico+'</div>'+
          '<div style="font-size:12px;font-weight:800;color:'+(on?'var(--pink)':'var(--text)')+';margin-top:4px">'+o.label+'</div>'+
          '<div style="font-size:10px;color:var(--sub);margin-top:2px;line-height:1.3">'+o.desc+'</div>'+
        '</button>';
      }).join('') +
      '</div>' +
      '<div style="font-size:11px;color:var(--sub);margin-top:8px;line-height:1.5;background:#f8f8f8;border-radius:8px;padding:8px 10px">'+
        '💡 API 추천은 각 작업 단계에서 자동으로 표시됩니다. 예: 이미지 단계에서는 가격 우선 이미지 API를 추천하고, 음성 단계에서는 장르와 언어에 맞는 TTS를 추천합니다.'+
      '</div>' +
    '</div>';
  }

  /* 카테고리별 렌더링 */
  Object.keys(MOCA_APIS_V2).forEach(function(cat){
    var apis = MOCA_APIS_V2[cat];
    var catDone = apis.filter(function(a){ return !a.keyName||(localStorage.getItem(a.keyName)||'').length>8; }).length;
    var icon = catIcons[cat] || '📌';

    html += '<details style="margin-bottom:10px" '+(catDone<apis.length?'open':'')+'>' +
      '<summary style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 16px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;font-weight:900;font-size:14px">'+
        '<span>'+icon+' '+cat+'</span>'+
        '<span style="margin-left:auto;font-size:11px;font-weight:700;color:'+(catDone===apis.length?'#27ae60':'var(--sub)')+'">'+
          catDone+'/'+apis.length+' 설정'+
        '</span>'+
        '<span style="font-size:12px;color:var(--sub)">▾</span>'+
      '</summary>' +
      '<div style="background:#fff;border:1px solid var(--line);border-top:none;border-radius:0 0 12px 12px;padding:12px">';

    apis.forEach(function(api){
      var hasKey = api.keyName && (localStorage.getItem(api.keyName)||'').length > 8;
      var noKey  = !api.keyName;

      html += '<div style="padding:12px 0;border-bottom:1px solid #f5f5f5">' +

        /* API 이름 + 상태 */
        '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px">' +
          '<div style="flex:1">' +
            '<div style="font-size:13px;font-weight:800">'+api.name+'</div>' +
            '<div style="font-size:11px;color:var(--sub);margin-top:2px">'+api.desc+'</div>' +
            '<div style="font-size:11px;color:#27ae60;margin-top:2px">'+api.free+'</div>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">' +
            '<span style="font-size:11px;font-weight:700;color:'+(hasKey||noKey?'#27ae60':'#e74c3c')+'">'+
              (noKey?'🆓 무료':hasKey?'✅ 설정됨':'❌ 미설정')+
            '</span>' +
            /* 발급 안내 버튼 */
            (api.url?
              '<button onclick="studioApiGuide(\''+api.id+'\')" '+
                'style="border:1.5px solid #4a90c4;background:#fff;color:#4a90c4;'+
                'border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700;cursor:pointer">'+
                '📋 발급 방법</button>'
            :'')+
          '</div>' +
        '</div>' +

        /* 키 입력 or 완료 표시 */
        (noKey ?
          '<div style="font-size:11px;color:var(--sub);background:#f8f8f8;border-radius:8px;padding:8px">'+api.placeholder+'</div>'
        : hasKey ?
          '<div style="display:flex;align-items:center;gap:8px;background:#effbf7;border-radius:8px;padding:8px 12px">' +
            '<span style="font-size:12px;color:#27ae60;font-weight:700">✅ API 키 등록됨</span>' +
            '<button onclick="ucClearApiKeyV2(\''+api.id+'\')" '+
              'style="margin-left:auto;border:none;background:#fee;color:#e74c3c;'+
              'border-radius:999px;padding:3px 10px;font-size:11px;cursor:pointer">삭제</button>' +
          '</div>'
        :
          '<div style="display:flex;gap:6px">' +
            '<input type="password" id="api-key-'+api.id+'" class="studio-in" '+
              'style="flex:1;font-size:12px" placeholder="'+api.placeholder+'">' +
            '<button onclick="ucSaveApiKeyV2(\''+api.id+'\')" '+
              'class="studio-btn pri" style="font-size:12px;white-space:nowrap">저장</button>' +
          '</div>'
        ) +
      '</div>';
    });

    html += '</div></details>';
  });

  html += '</div>';

  /* 모달 */
  var modal = document.createElement('div');
  modal.id = 'api-settings-overlay';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;'+
    'background:rgba(0,0,0,0.55);z-index:9999;overflow-y:auto;padding:20px;box-sizing:border-box';
  modal.innerHTML =
    '<div style="max-width:780px;margin:40px auto;background:#f8f8f8;border-radius:20px;position:relative">' +
    '<button onclick="document.getElementById(\'api-settings-overlay\').remove()" '+
      'style="position:sticky;top:0;float:right;border:none;background:#eee;'+
      'border-radius:999px;padding:8px 16px;cursor:pointer;font-weight:700;font-size:13px;'+
      'margin:16px 16px 0 0;z-index:1">닫기 ✕</button>' +
    html + '</div>';
  document.body.appendChild(modal);
}

function ucSaveApiKeyV2(apiId){
  var input = document.getElementById('api-key-'+apiId);
  if(!input || !input.value.trim()){ alert('키를 입력해주세요'); return; }
  /* MOCA_APIS_V2에서 keyName 찾기 */
  var api = null;
  Object.values(MOCA_APIS_V2).forEach(function(apis){
    apis.forEach(function(a){ if(a.id===apiId) api=a; });
  });
  if(!api || !api.keyName) return;
  localStorage.setItem(api.keyName, input.value.trim());
  if(typeof ucShowToast==='function') ucShowToast('✅ '+api.name+' 키 저장됨','success');
  /* 모달 새로고침 */
  document.getElementById('api-settings-overlay')?.remove();
  renderApiSettings();
}

function ucApplyStack(presetId){
  if(typeof window.applyStackPreset === 'function'){
    var ok = window.applyStackPreset(presetId);
    if(ok){
      document.getElementById('api-settings-overlay')?.remove();
      renderApiSettings();
    }
  }
}

/* 스택 프리셋 카드 CSS */
(function(){
  if (document.getElementById('moca-stack-style')) return;
  var st = document.createElement('style');
  st.id = 'moca-stack-style';
  st.textContent =
    '.moca-stack-card{text-align:left;background:#fafafe;border:1.5px solid var(--line);border-radius:12px;padding:10px 12px;cursor:pointer;font-family:inherit;transition:.12s}'+
    '.moca-stack-card:hover{border-color:#9181ff;background:#f5f0ff}'+
    '.moca-stack-card.on{border-color:#ef6fab;background:linear-gradient(135deg,#fff5fa,#f5f0ff)}'+
    '.moca-stack-card-hd{display:flex;align-items:center;gap:6px;margin-bottom:4px}'+
    '.moca-stack-card-label{font-size:13px;font-weight:900;color:#5b1a4a}'+
    '.moca-stack-card-on{margin-left:auto;font-size:10px;font-weight:800;background:#ef6fab;color:#fff;padding:2px 8px;border-radius:999px}'+
    '.moca-stack-card-desc{font-size:11.5px;color:#7b6080;line-height:1.4}'+
    '';
  document.head.appendChild(st);
})();

function ucSetPrefMode(mode){
  if(typeof window.setUserPreferredMode === 'function'){
    window.setUserPreferredMode(mode);
    if(typeof ucShowToast === 'function') ucShowToast('🎚 선호 기준 저장됨','success');
    document.getElementById('api-settings-overlay')?.remove();
    renderApiSettings();
  }
}

function ucClearApiKeyV2(apiId){
  var api = null;
  Object.values(MOCA_APIS_V2).forEach(function(apis){
    apis.forEach(function(a){ if(a.id===apiId) api=a; });
  });
  if(!api || !api.keyName) return;
  if(!confirm(api.name+' 키를 삭제할까요?')) return;
  localStorage.removeItem(api.keyName);
  if(typeof ucShowToast==='function') ucShowToast('🗑 '+api.name+' 키 삭제됨','success');
  document.getElementById('api-settings-overlay')?.remove();
  renderApiSettings();
}

function studioApiGuide(apiId){
  var api = null;
  Object.values(MOCA_APIS_V2).forEach(function(apis){
    apis.forEach(function(a){ if(a.id===apiId) api=a; });
  });
  if(!api) return;

  /* 발급 안내 팝업 */
  var ex = document.getElementById('api-guide-popup');
  if(ex) ex.remove();

  var popup = document.createElement('div');
  popup.id = 'api-guide-popup';
  popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);'+
    'background:#fff;border-radius:16px;padding:24px;z-index:10001;'+
    'box-shadow:0 8px 40px rgba(0,0,0,0.25);max-width:400px;width:90%;';

  popup.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">'+
      '<div style="font-size:15px;font-weight:900">📋 '+api.name+' 발급 방법</div>'+
      '<button onclick="document.getElementById(\'api-guide-popup\').remove()" '+
        'style="border:none;background:#eee;border-radius:999px;padding:4px 12px;cursor:pointer;font-weight:700">✕</button>'+
    '</div>'+
    '<div style="font-size:13px;color:var(--sub);margin-bottom:12px">'+api.desc+'</div>'+
    '<div style="background:#f8f8f8;border-radius:10px;padding:12px;font-size:13px;line-height:1.8;margin-bottom:14px;white-space:pre-line">'+api.guide+'</div>'+
    '<div style="font-size:12px;color:#27ae60;font-weight:700;margin-bottom:12px">💚 '+api.free+'</div>'+
    '<a href="'+api.url+'" target="_blank" '+
      'style="display:block;text-align:center;background:linear-gradient(135deg,var(--pink),var(--purple));'+
      'color:#fff;border-radius:12px;padding:12px;font-size:14px;font-weight:800;text-decoration:none">'+
      '🚀 지금 바로 발급받기 →'+
    '</a>';

  document.body.appendChild(popup);
}

/* 기존 ucGetApiKey 호환 유지 */
function ucGetApiKey(apiId){
  var api = null;
  if(typeof MOCA_APIS_V2 !== 'undefined'){
    Object.values(MOCA_APIS_V2).forEach(function(apis){
      apis.forEach(function(a){ if(a.id===apiId) api=a; });
    });
  }
  if(api && api.keyName) return localStorage.getItem(api.keyName)||'';
  /* 구버전 fallback */
  var legacyMap = {
    claude:'uc_claude_key', openai:'uc_openai_key', gemini:'uc_gemini_key',
    perplexity:'uc_perplexity_key',
    elevenlabs:'uc_eleven_key', clova:'uc_clova_key', nijivoice:'uc_nijivoice_key',
    google_tts:'uc_google_key', azure_tts:'uc_azure_key',
    pexels:'uc_pexels_key', pixabay:'uc_pixabay_key', unsplash:'uc_unsplash_key',
    flux:'uc_flux_key', ideogram:'uc_ideogram_key', minimax:'uc_minimax_key',
    sd:'uc_sd_key', gemini_imagen:'uc_gemini_key',
    runway:'uc_runway_key', pika:'uc_pika_key', luma:'uc_luma_key',
    minimax_video:'uc_minimax_key',
    suno:'uc_suno_key', udio:'uc_udio_key',
    facebook:'uc_facebook_key', naver_blog:'uc_naver_key', threads:'uc_threads_key',
  };
  var k = legacyMap[apiId];
  return k ? localStorage.getItem(k)||'' : '';
}

function ucApiKeyStatus(apiId){
  var key = ucGetApiKey(apiId);
  var api = null;
  if(typeof MOCA_APIS_V2 !== 'undefined'){
    Object.values(MOCA_APIS_V2).forEach(function(apis){
      apis.forEach(function(a){ if(a.id===apiId) api=a; });
    });
  }
  if(api && !api.keyName) return {ok:true, label:'🆓 무료'};
  if(!key) return {ok:false, label:'❌ 미설정'};
  if(key.length<8) return {ok:false, label:'⚠️ 짧음'};
  return {ok:true, label:'✅ 설정됨'};
}
