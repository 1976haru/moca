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
    { id:'magiclight',name:'Magiclight',          keyName:'uc_magiclight_key',
      desc:'스토리/캐릭터/이미지→영상 (실험적 — 공식 API endpoint 입력 필요)',
      placeholder:'API Key',
      guide:'1. magiclight 가입\n2. dashboard 에서 API Key 발급\n3. Base URL 도 함께 입력 (공식 문서 확인 필요)',
      url:'https://magiclight.ai/',
      free:'credit 기반' },
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

  /* group 코드(스토어용) ↔ 카테고리 라벨 매핑 */
  var GROUP_BY_CAT = {
    '대본 생성':'script', '이미지 생성':'image', '스톡 이미지·영상':'stock',
    '음성 생성':'voice', '영상 편집·렌더링':'video', '음악·Suno':'music',
    '업로드·배포':'upload', '기타 (확장)':'other',
  };

  /* 활성 탭 — group 코드 또는 '__pref' (기본 선호 설정 탭) */
  var activeTab = window._mocaApiActiveTab || 'script';
  var validTabs = Object.values(GROUP_BY_CAT).concat(['__pref']);
  if (validTabs.indexOf(activeTab) < 0) activeTab = 'script';

  /* 전체 설정 완료 개수 */
  var totalApis = 0, doneApis = 0;
  Object.values(MOCA_APIS_V2).forEach(function(apis){
    apis.forEach(function(a){
      totalApis++;
      if(!a.keyName || _hasUnifiedKey(a)) doneApis++;
    });
  });

  var html = '<div style="max-width:820px;margin:0 auto;padding:24px">' +

    /* 헤더 */
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
      '<h3 style="margin:0;font-size:18px;font-weight:900">⚙️ API 통합 설정</h3>' +
      '<div style="font-size:12px;color:var(--sub)">'+doneApis+' / '+totalApis+' 설정 완료</div>' +
    '</div>' +
    '<div style="font-size:12px;color:var(--sub);margin-bottom:10px">' +
      '한 번만 입력하면 모든 단계에서 자동 사용 · 각 단계에는 키 입력칸이 없습니다.' +
    '</div>' +

    /* 보안 안내 */
    '<div style="font-size:11.5px;color:#7b4040;background:#fff1f1;border:1px solid #f4cdcd;border-radius:8px;padding:8px 12px;margin-bottom:14px;line-height:1.5">' +
      '🔒 현재 프로토타입에서는 API 키가 브라우저 localStorage에 저장됩니다. '+
      '실제 서비스 배포 시에는 서버 암호화 저장 방식으로 전환해야 합니다.' +
    '</div>' +

    /* 진행 바 */
    '<div style="background:#eee;border-radius:999px;height:6px;margin-bottom:14px">' +
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

  /* 탭 네비게이션 — 8 탭 (카테고리 7 + 기본 선호) */
  var tabNav = '<div class="moca-tab-nav">';
  Object.keys(MOCA_APIS_V2).forEach(function(cat){
    var g = GROUP_BY_CAT[cat] || cat;
    if (g === 'other') return; /* '기타 (확장)' 도 노출 */
    var icon = catIcons[cat] || '📌';
    var apis = MOCA_APIS_V2[cat];
    var catDone = apis.filter(function(a){ return !a.keyName || _hasUnifiedKey(a); }).length;
    var on = (activeTab === g);
    tabNav += '<button class="moca-tab-btn'+(on?' on':'')+'" onclick="ucSwitchTab(\''+g+'\')">'+
      '<span class="moca-tab-ico">'+icon+'</span>'+
      '<span class="moca-tab-lbl">'+cat+'</span>'+
      '<span class="moca-tab-cnt">'+catDone+'/'+apis.length+'</span>'+
    '</button>';
  });
  /* 기타 탭 */
  if (MOCA_APIS_V2['기타 (확장)']) {
    var otherApis = MOCA_APIS_V2['기타 (확장)'];
    var otherDone = otherApis.filter(function(a){ return !a.keyName || _hasUnifiedKey(a); }).length;
    var onOther = (activeTab === 'other');
    tabNav += '<button class="moca-tab-btn'+(onOther?' on':'')+'" onclick="ucSwitchTab(\'other\')">'+
      '<span class="moca-tab-ico">🔧</span>'+
      '<span class="moca-tab-lbl">기타</span>'+
      '<span class="moca-tab-cnt">'+otherDone+'/'+otherApis.length+'</span>'+
    '</button>';
  }
  /* 기본 선호 탭 */
  var onPref = (activeTab === '__pref');
  tabNav += '<button class="moca-tab-btn'+(onPref?' on':'')+'" onclick="ucSwitchTab(\'__pref\')">'+
    '<span class="moca-tab-ico">⚙️</span>'+
    '<span class="moca-tab-lbl">기본 선호</span>'+
  '</button>';
  tabNav += '</div>';
  html += tabNav;

  /* 활성 탭 패널 */
  if (activeTab === '__pref') {
    html += _mocaRenderPrefTab();
  } else {
    /* group → 카테고리 라벨 역매핑 */
    var activeCat = Object.keys(GROUP_BY_CAT).find(function(c){ return GROUP_BY_CAT[c] === activeTab; });
    if (activeCat && MOCA_APIS_V2[activeCat]) {
      html += _mocaRenderProviderTab(activeCat, MOCA_APIS_V2[activeCat], activeTab);
    }
  }

  html += '</div>';

  /* 모달 — drawer/하단버튼/글로벌바보다 위 */
  var modal = document.createElement('div');
  modal.id = 'api-settings-overlay';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;'+
    'background:rgba(0,0,0,0.55);z-index:20000;overflow-y:auto;padding:20px;box-sizing:border-box';
  modal.innerHTML =
    '<div id="api-settings-dialog" style="max-width:820px;margin:40px auto;background:#f8f8f8;border-radius:20px;position:relative">' +
    '<button onclick="ucCloseApiSettings()" '+
      'style="position:sticky;top:0;float:right;border:none;background:#eee;'+
      'border-radius:999px;padding:8px 16px;cursor:pointer;font-weight:700;font-size:13px;'+
      'margin:16px 16px 0 0;z-index:1">닫기 ✕</button>' +
    html + '</div>';
  /* 배경 클릭 닫기 */
  modal.addEventListener('click', function(e){
    if (e.target === modal) ucCloseApiSettings();
  });
  document.body.appendChild(modal);
  /* ESC 닫기 */
  document.addEventListener('keydown', _ucApiSettingsEsc);
  try { console.log('[api-settings] modal ready · tab:', activeTab); } catch(_) {}
}

function ucCloseApiSettings(){
  var ex = document.getElementById('api-settings-overlay');
  if (ex) ex.remove();
  document.removeEventListener('keydown', _ucApiSettingsEsc);
}
function _ucApiSettingsEsc(e){ if (e.key === 'Escape') ucCloseApiSettings(); }

/* ── 통합 store 키 보유 여부 (legacy + 신규 모두 검사) ── */
function _hasUnifiedKey(api){
  if (!api || !api.keyName) return false;
  /* 신규 store */
  if (typeof window.hasApiKey === 'function') {
    var grp = _findGroupByApiId(api.id);
    if (grp && window.hasApiKey(grp, api.id)) return true;
  }
  /* legacy fallback */
  try { return (localStorage.getItem(api.keyName)||'').length > 6; } catch(_) { return false; }
}

function _findGroupByApiId(apiId){
  var map = window.MOCA_API_LEGACY_MAP || {};
  var found = '';
  Object.keys(map).forEach(function(g){
    if (map[g] && map[g][apiId]) found = g;
  });
  return found;
}

/* ── 탭 전환 ── */
function ucSwitchTab(tabId){
  window._mocaApiActiveTab = tabId;
  document.getElementById('api-settings-overlay')?.remove();
  renderApiSettings();
}

/* ── provider 탭 패널 렌더 ── */
function _mocaRenderProviderTab(cat, apis, group) {
  var html = '<div class="moca-tab-panel">';
  apis.forEach(function(api){
    var hasKey = api.keyName && _hasUnifiedKey(api);
    var noKey  = !api.keyName;
    var existing = (typeof window.getApiProvider === 'function') ? window.getApiProvider(group, api.id) : null;
    var enabled  = existing && existing.enabled !== false;
    var baseUrl  = (existing && existing.baseUrl) || '';
    var modelVal = (existing && existing.model) || '';

    html += '<div class="moca-prov-card">' +
      '<div class="moca-prov-hd">' +
        '<div class="moca-prov-info">' +
          '<div class="moca-prov-name">' + api.name + '</div>' +
          '<div class="moca-prov-desc">' + api.desc + '</div>' +
          '<div class="moca-prov-free">'+ api.free + '</div>' +
        '</div>' +
        '<div class="moca-prov-side">' +
          '<span class="moca-prov-status moca-st-'+(noKey?'free':hasKey?'on':'off')+'">'+
            (noKey?'🆓 무료':hasKey?'✅ 저장됨':'⚠️ 키 없음')+
          '</span>' +
          (api.url ? '<button class="moca-prov-guide" onclick="studioApiGuide(\''+api.id+'\')">📋 발급 방법</button>' : '') +
        '</div>' +
      '</div>' +

      (noKey ?
        '<div class="moca-prov-nokey">'+api.placeholder+'</div>'
      :
        '<div class="moca-prov-form">' +
          '<label class="moca-prov-label">API Key</label>' +
          '<div class="moca-prov-row">' +
            '<input type="password" id="moca-key-'+api.id+'" class="moca-prov-input" '+
              'placeholder="'+api.placeholder+'" autocomplete="off" '+
              (hasKey ? 'value="'+_mask(_getCurrentKey(group, api.id))+'" ' : '') + '>' +
            '<button type="button" class="moca-prov-eye" onclick="ucToggleKeyVis(\''+api.id+'\')" title="보기/숨기기">👁</button>' +
          '</div>' +
          '<div class="moca-prov-row">' +
            '<label class="moca-prov-label" style="flex:1">Base URL <span style="color:#999;font-weight:400">(선택)</span></label>' +
          '</div>' +
          '<input type="text" id="moca-base-'+api.id+'" class="moca-prov-input" placeholder="기본값 사용 (비워두기)" value="'+_esc(baseUrl)+'">' +
          '<div class="moca-prov-row" style="margin-top:8px">' +
            '<label class="moca-prov-toggle">' +
              '<input type="checkbox" id="moca-en-'+api.id+'" '+(enabled?'checked':'')+'> 사용 활성화' +
            '</label>' +
            '<button class="moca-prov-save" onclick="ucSaveApiKeyV2(\''+api.id+'\')">💾 저장</button>' +
            (hasKey ? '<button class="moca-prov-del" onclick="ucClearApiKeyV2(\''+api.id+'\')">🗑 삭제</button>' : '') +
          '</div>' +
        '</div>'
      ) +
    '</div>';
  });
  html += '</div>';
  return html;
}

/* ── 기본 선호 탭 ── */
function _mocaRenderPrefTab() {
  var prefOpts = [
    { id:'budget',   ico:'💰', label:'가격 우선',  desc:'대량 생성·저비용 위주' },
    { id:'balanced', ico:'⚖️', label:'가성비',     desc:'품질·속도·비용 균형' },
    { id:'quality',  ico:'🎯', label:'품질 우선',  desc:'고품질·완성도 우선' },
    { id:'speed',    ico:'⚡', label:'속도 우선',  desc:'빠른 생성 우선' },
  ];
  var curPref = (typeof window.getUserPreferredMode === 'function') ? (window.getUserPreferredMode() || '') : '';
  var html = '<div class="moca-tab-panel">' +
    '<div class="moca-pref-section">' +
      '<div class="moca-pref-title">🎚 기본 선호 기준 — 추천 1~3순위 정렬에 반영</div>' +
      '<div class="moca-pref-grid">' +
      prefOpts.map(function(o){
        var on = (curPref === o.id);
        return '<button onclick="ucSetPrefMode(\''+o.id+'\')" class="moca-pref-btn'+(on?' on':'')+'">'+
          '<div class="moca-pref-ico">'+o.ico+'</div>'+
          '<div class="moca-pref-lbl">'+o.label+'</div>'+
          '<div class="moca-pref-d">'+o.desc+'</div>'+
        '</button>';
      }).join('') +
      '</div>' +
      '<div class="moca-pref-hint">💡 추천은 통합 설정에 길게 표시되지 않습니다. 각 작업 단계에서 1~3순위 카드로 보입니다.</div>' +
    '</div>' +
    /* 추천 스택 프리셋 — 기본 선호 탭 안으로 이동 */
    (typeof window.MOCA_RECOMMENDED_STACKS !== 'undefined' && typeof window.applyStackPreset === 'function'
      ? _mocaRenderStackPresets()
      : '') +
  '</div>';
  return html;
}

function _mocaRenderStackPresets() {
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
  return '<div class="moca-pref-section" style="margin-top:14px">' +
    '<div class="moca-pref-title">📦 추천 스택 프리셋 — 5개 단계 1순위 자동 채택</div>' +
    '<div class="moca-stack-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin-top:8px">' + stackHtml + '</div>' +
  '</div>';
}

function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function _mask(k){ if (!k) return ''; var s = String(k); return s.length <= 8 ? '••••' : s.slice(0,4) + '••••' + s.slice(-4); }
function _getCurrentKey(group, providerId){
  if (typeof window.mocaGetApiKey === 'function') return window.mocaGetApiKey(group, providerId);
  return '';
}

window.ucToggleKeyVis = function(apiId){
  var el = document.getElementById('moca-key-'+apiId);
  if (!el) return;
  el.type = (el.type === 'password') ? 'text' : 'password';
};

function ucSaveApiKeyV2(apiId){
  var input = document.getElementById('moca-key-'+apiId)
            || document.getElementById('api-key-'+apiId);
  if(!input || !input.value.trim()){ alert('키를 입력해주세요'); return; }
  var val = input.value.trim();
  /* 마스킹된 값(••••)이 그대로 들어오면 저장하지 않음 */
  if (/^[•]+$/.test(val) || val.indexOf('••••') >= 0) {
    alert('마스킹된 값은 저장되지 않습니다. 새 키를 직접 입력하세요.'); return;
  }
  var api = null;
  Object.values(MOCA_APIS_V2).forEach(function(apis){
    apis.forEach(function(a){ if(a.id===apiId) api=a; });
  });
  if(!api || !api.keyName) return;
  /* 1) legacy key — 호환 유지 */
  try { localStorage.setItem(api.keyName, val); } catch(_) {}
  /* 2) 통합 store */
  var grp = _findGroupByApiId(apiId);
  if (grp && typeof window.setApiProvider === 'function') {
    var base = (document.getElementById('moca-base-'+apiId)||{}).value || '';
    var en   = !!(document.getElementById('moca-en-'+apiId)||{}).checked;
    window.setApiProvider(grp, apiId, { apiKey: val, baseUrl: base, enabled: en !== false });
  }
  if(typeof ucShowToast==='function') ucShowToast('✅ '+api.name+' 키 저장됨','success');
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

/* 통합 설정 — 탭 + 카드 + 스택 프리셋 CSS */
(function(){
  if (document.getElementById('moca-api-settings-style')) return;
  var st = document.createElement('style');
  st.id = 'moca-api-settings-style';
  st.textContent =
    /* 탭 nav */
    '.moca-tab-nav{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:14px;padding:6px;background:#fff;border:1px solid var(--line);border-radius:12px;position:sticky;top:0;z-index:2}'+
    '.moca-tab-btn{display:flex;align-items:center;gap:5px;padding:8px 12px;border:1.5px solid transparent;background:transparent;color:#666;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:.12s;white-space:nowrap}'+
    '.moca-tab-btn:hover{background:#f5f0ff;color:#5a4a8a}'+
    '.moca-tab-btn.on{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent;box-shadow:0 2px 8px rgba(145,129,255,.25)}'+
    '.moca-tab-ico{font-size:14px}'+
    '.moca-tab-cnt{margin-left:4px;padding:1px 6px;background:rgba(255,255,255,.5);border-radius:8px;font-size:10px;font-weight:800}'+
    '.moca-tab-btn.on .moca-tab-cnt{background:rgba(255,255,255,.3)}'+
    /* provider 카드 */
    '.moca-tab-panel{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px}'+
    '.moca-prov-card{padding:14px 0;border-bottom:1px solid #f3eff8}'+
    '.moca-prov-card:last-child{border-bottom:none;padding-bottom:4px}'+
    '.moca-prov-hd{display:flex;align-items:flex-start;gap:12px;margin-bottom:10px}'+
    '.moca-prov-info{flex:1;min-width:0}'+
    '.moca-prov-name{font-size:13.5px;font-weight:900;color:#2b2430}'+
    '.moca-prov-desc{font-size:11.5px;color:#7b6080;margin-top:2px;line-height:1.4}'+
    '.moca-prov-free{font-size:11px;color:#1a7a5a;margin-top:3px}'+
    '.moca-prov-side{display:flex;flex-direction:column;align-items:flex-end;gap:4px}'+
    '.moca-prov-status{font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;white-space:nowrap}'+
    '.moca-st-on{background:#effbf7;color:#1a7a5a}.moca-st-off{background:#fff1f1;color:#c0392b}.moca-st-free{background:#eef5ff;color:#2b66c4}'+
    '.moca-prov-guide{border:1.5px solid #4a90c4;background:#fff;color:#4a90c4;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit}'+
    '.moca-prov-nokey{font-size:11px;color:#7b6080;background:#f8f5fc;border-radius:8px;padding:8px 10px}'+
    '.moca-prov-form{display:flex;flex-direction:column;gap:6px}'+
    '.moca-prov-label{font-size:11px;font-weight:800;color:#5b1a4a}'+
    '.moca-prov-row{display:flex;gap:6px;align-items:center}'+
    '.moca-prov-input{flex:1;border:1.5px solid var(--line);border-radius:8px;padding:7px 10px;font-size:12px;font-family:inherit;box-sizing:border-box;width:100%}'+
    '.moca-prov-input:focus{outline:none;border-color:#9181ff}'+
    '.moca-prov-eye{border:1.5px solid var(--line);background:#fff;border-radius:8px;padding:7px 10px;cursor:pointer;font-size:13px}'+
    '.moca-prov-toggle{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:#5a4a56;cursor:pointer;flex:1}'+
    '.moca-prov-toggle input{accent-color:#ef6fab}'+
    '.moca-prov-save{border:none;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit}'+
    '.moca-prov-del{border:1.5px solid #fee;background:#fff;color:#c0392b;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit}'+
    /* 기본 선호 패널 */
    '.moca-pref-section{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px}'+
    '.moca-pref-title{font-size:13px;font-weight:900;color:#5b1a4a;margin-bottom:8px}'+
    '.moca-pref-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}'+
    '@media(max-width:640px){.moca-pref-grid{grid-template-columns:repeat(2,1fr)}}'+
    '.moca-pref-btn{border:1.5px solid var(--line);background:#fff;border-radius:10px;padding:10px 8px;cursor:pointer;font-family:inherit;text-align:center;transition:.12s}'+
    '.moca-pref-btn.on{border-color:#ef6fab;background:linear-gradient(135deg,#fff5fa,#f5f0ff)}'+
    '.moca-pref-ico{font-size:18px;line-height:1}'+
    '.moca-pref-lbl{font-size:12px;font-weight:800;color:#2b2430;margin-top:4px}'+
    '.moca-pref-btn.on .moca-pref-lbl{color:#ef6fab}'+
    '.moca-pref-d{font-size:10px;color:#7b6080;margin-top:2px;line-height:1.3}'+
    '.moca-pref-hint{font-size:11px;color:#7b6080;margin-top:8px;line-height:1.5;background:#f8f5fc;border-radius:8px;padding:8px 10px}'+
    /* 스택 프리셋 카드 */
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
  /* legacy + 통합 store 모두 삭제 */
  try { localStorage.removeItem(api.keyName); } catch(_) {}
  var grp = _findGroupByApiId(apiId);
  if (grp && typeof window.deleteApiProvider === 'function') {
    window.deleteApiProvider(grp, apiId);
  }
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

/* ucGetApiKey — 통합 store 우선, legacy uc_*_key fallback
   1순위: moca_api_settings_v1[group][provider].apiKey  (api-settings-store.js)
   2순위: legacy uc_*_key (마이그레이션 안 된 경우)
   3순위: '' */
function ucGetApiKey(apiId){
  /* 1) 통합 store — LEGACY_MAP 에서 (group, provider) 역추적 */
  if (typeof window.MOCA_API_LEGACY_MAP !== 'undefined' && typeof window.getApiProvider === 'function') {
    var map = window.MOCA_API_LEGACY_MAP;
    var foundGroup = '', foundProv = '';
    Object.keys(map).forEach(function(g){
      if (map[g] && map[g][apiId]) { foundGroup = g; foundProv = apiId; }
    });
    if (foundGroup) {
      var p = window.getApiProvider(foundGroup, foundProv);
      if (p && p.apiKey && p.apiKey.length > 4) return p.apiKey;
    }
  }
  /* 2) MOCA_APIS_V2 의 keyName 으로 legacy 직접 조회 */
  var api = null;
  if(typeof MOCA_APIS_V2 !== 'undefined'){
    Object.values(MOCA_APIS_V2).forEach(function(apis){
      apis.forEach(function(a){ if(a.id===apiId) api=a; });
    });
  }
  if(api && api.keyName) return localStorage.getItem(api.keyName)||'';
  /* 3) 구버전 alias fallback (apiId가 MOCA_APIS_V2에 없는 케이스) */
  var legacyAlias = {
    claude:'uc_claude_key', openai:'uc_openai_key', gemini:'uc_gemini_key',
    perplexity:'uc_perplexity_key',
    elevenlabs:'uc_eleven_key', clova:'uc_clova_key', nijivoice:'uc_nijivoice_key',
    google_tts:'uc_google_key', azure_tts:'uc_azure_key',
    pexels:'uc_pexels_key', pixabay:'uc_pixabay_key', unsplash:'uc_unsplash_key',
    flux:'uc_flux_key', ideogram:'uc_ideogram_key', minimax:'uc_minimax_key',
    sd:'uc_sd_key', gemini_imagen:'uc_gemini_key',
    runway:'uc_runway_key', pika:'uc_pika_key', luma:'uc_luma_key',
    minimax_video:'uc_minimax_key',
    suno:'uc_suno_key', udio:'uc_udio_key', heygen:'uc_heygen_key',
    facebook:'uc_facebook_key', naver_blog:'uc_naver_key', threads:'uc_threads_key',
  };
  var k = legacyAlias[apiId];
  return k ? (localStorage.getItem(k)||'') : '';
}
window.ucGetApiKey = ucGetApiKey;

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
