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
    { id:'pexels',    name:'Pexels (스톡)',        keyName:'uc_pexels_key',
      desc:'무료 스톡 이미지·영상 검색',
      placeholder:'...',
      guide:'1. pexels.com/api 접속\n2. 이메일 가입\n3. API 키 즉시 발급',
      url:'https://www.pexels.com/api/',
      free:'무료·상업용 OK·월 25,000회' },
    { id:'pixabay',   name:'Pixabay (스톡)',       keyName:'uc_pixabay_key',
      desc:'무료 스톡 이미지·영상 검색',
      placeholder:'...',
      guide:'1. pixabay.com 가입\n2. pixabay.com/api/docs 접속\n3. 키 발급',
      url:'https://pixabay.com/api/docs/',
      free:'무료·상업용 OK·무제한' },
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
    '대본 생성':'📝','이미지 생성':'🖼','음성 생성':'🎙',
    '영상 편집·렌더링':'🎬','업로드·배포':'📤','기타 (확장)':'🔧'
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
    elevenlabs:'uc_eleven_key', clova:'uc_clova_key',
    pexels:'uc_pexels_key', pixabay:'uc_pixabay_key',
    flux:'uc_flux_key', ideogram:'uc_ideogram_key', minimax:'uc_minimax_key',
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
