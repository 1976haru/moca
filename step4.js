/* ═══════════════════════════════════════
   MOCA 통합 API 설정 시스템
   index.html 마지막 </script> 앞에 추가
═══════════════════════════════════════ */

var MOCA_APIS = [
  { id:'claude',     name:'Claude (Anthropic)',   keyName:'uc_claude_key',   group:'AI',    placeholder:'sk-ant-...',          url:'https://console.anthropic.com/' },
  { id:'openai',     name:'OpenAI (GPT/DALL-E)',  keyName:'uc_openai_key',   group:'AI',    placeholder:'sk-...',              url:'https://platform.openai.com/api-keys' },
  { id:'gemini',     name:'Google Gemini',        keyName:'uc_gemini_key',   group:'AI',    placeholder:'AIza...',             url:'https://aistudio.google.com/apikey' },
  { id:'elevenlabs', name:'ElevenLabs',           keyName:'uc_eleven_key',   group:'음성',  placeholder:'...hex...',           url:'https://elevenlabs.io/app/settings/api' },
  { id:'clova',      name:'ClovaVoice (네이버)',   keyName:'uc_clova_key',    group:'음성',  placeholder:'Client ID',           url:'https://developers.naver.com/' },
  { id:'voicevox',   name:'VoiceVox (무료)',       keyName:'',                group:'음성',  placeholder:'로컬 설치 필요',       url:'https://voicevox.hiroshiba.jp/' },
  { id:'pexels',     name:'Pexels',               keyName:'uc_pexels_key',   group:'이미지',placeholder:'...',                 url:'https://www.pexels.com/api/' },
  { id:'pixabay',    name:'Pixabay',              keyName:'uc_pixabay_key',  group:'이미지',placeholder:'...',                 url:'https://pixabay.com/api/docs/' },
  { id:'unsplash',   name:'Unsplash',             keyName:'uc_unsplash_key', group:'이미지',placeholder:'...',                 url:'https://unsplash.com/developers' },
  { id:'flux',       name:'Flux',                 keyName:'uc_flux_key',     group:'이미지',placeholder:'...',                 url:'https://api.bfl.ml/' },
  { id:'ideogram',   name:'Ideogram',             keyName:'uc_ideogram_key', group:'이미지',placeholder:'...',                 url:'https://ideogram.ai/api' },
  { id:'minimax',    name:'MiniMax',              keyName:'uc_minimax_key',  group:'이미지',placeholder:'...',                 url:'https://www.minimax.io/' },
];

function ucGetApiKey(apiId){
  var api = MOCA_APIS.find(function(a){ return a.id===apiId; });
  if(!api || !api.keyName) return '';
  return localStorage.getItem(api.keyName) || '';
}

function ucSetApiKey(apiId, key){
  var api = MOCA_APIS.find(function(a){ return a.id===apiId; });
  if(!api || !api.keyName) return;
  localStorage.setItem(api.keyName, key);
}

function ucApiKeyStatus(apiId){
  var api = MOCA_APIS.find(function(a){ return a.id===apiId; });
  if(!api) return { ok:false, label:'❌ 미지원' };
  if(!api.keyName) return { ok:true, label:'🆓 무료' };
  var key = localStorage.getItem(api.keyName) || '';
  if(!key) return { ok:false, label:'❌ 미설정' };
  if(key.length < 8) return { ok:false, label:'⚠️ 짧음' };
  return { ok:true, label:'✅ 설정됨' };
}

function renderApiSettings(){
  var existing = document.getElementById('api-settings-overlay');
  if(existing){ existing.remove(); return; }

  var groups = ['AI','음성','이미지'];
  var html = '<div style="max-width:700px;margin:0 auto;padding:24px">' +
    '<h3 style="margin:0 0 6px;font-size:18px;font-weight:900">⚙️ API 통합 설정</h3>' +
    '<div style="font-size:13px;color:var(--sub);margin-bottom:20px">'+
      '한 번만 입력하면 대본·이미지·음성·번역 등 모든 카테고리에서 자동 사용됩니다.'+
    '</div>';

  groups.forEach(function(group){
    var apis = MOCA_APIS.filter(function(a){ return a.group===group; });
    var groupIcon = {AI:'🤖 AI 모델',음성:'🎙 음성 API',이미지:'🖼 이미지 API'}[group];
    html += '<div style="background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:12px">' +
      '<div style="font-size:14px;font-weight:900;margin-bottom:14px">'+groupIcon+'</div>';

    apis.forEach(function(api){
      var status = ucApiKeyStatus(api.id);
      var key = api.keyName ? (localStorage.getItem(api.keyName)||'') : '';
      html += '<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f5f5f5">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
          '<div style="font-size:13px;font-weight:800">'+api.name+'</div>' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<span style="font-size:11px;color:'+(status.ok?'#27ae60':'#e74c3c')+';font-weight:700">'+status.label+'</span>' +
            (api.url?'<a href="'+api.url+'" target="_blank" style="font-size:11px;color:#4a90c4;text-decoration:none;font-weight:700;white-space:nowrap">무료 발급 →</a>':'') +
          '</div>' +
        '</div>';

      if(api.keyName){
        html += '<div style="display:flex;gap:6px">' +
          '<input type="password" id="api-key-'+api.id+'" class="studio-in" style="flex:1;font-size:12px" ' +
          'placeholder="'+api.placeholder+'" value="'+key+'">' +
          '<button onclick="ucSaveApiKey(\''+api.id+'\')" class="studio-btn ghost" style="font-size:12px;white-space:nowrap">저장</button>' +
          (key?'<button onclick="ucClearApiKey(\''+api.id+'\')" style="border:none;background:#fee;color:#e74c3c;border-radius:8px;padding:0 10px;cursor:pointer;font-size:12px;white-space:nowrap">삭제</button>':'') +
        '</div>';
      } else {
        html += '<div style="font-size:12px;color:var(--sub);padding:8px;background:#f8f8f8;border-radius:8px">'+api.placeholder+'</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  });
  html += '</div>';

  var modal = document.createElement('div');
  modal.id = 'api-settings-overlay';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;'+
    'background:rgba(0,0,0,0.55);z-index:9999;overflow-y:auto;padding:20px;box-sizing:border-box';
  modal.innerHTML =
    '<div style="max-width:720px;margin:40px auto;background:#f8f8f8;border-radius:20px;position:relative">' +
    '<button onclick="document.getElementById(\'api-settings-overlay\').remove()" '+
      'style="position:absolute;top:16px;right:16px;border:none;background:#eee;'+
      'border-radius:999px;padding:6px 16px;cursor:pointer;font-weight:700;font-size:13px">닫기 ✕</button>' +
    html + '</div>';
  document.body.appendChild(modal);
}

function ucSaveApiKey(apiId){
  var input = document.getElementById('api-key-'+apiId);
  if(!input) return;
  ucSetApiKey(apiId, input.value.trim());
  if(typeof ucShowToast==='function') ucShowToast('✅ '+apiId+' 키 저장됨','success');
  else if(typeof window.mocaToast==='function') window.mocaToast('✅ '+apiId+' 키 저장됨','ok');
  /* 상태 뱃지 갱신 */
  var existing = document.getElementById('api-settings-overlay');
  if(existing){ existing.remove(); renderApiSettings(); }
}

function ucClearApiKey(apiId){
  var api = MOCA_APIS.find(function(a){ return a.id===apiId; });
  if(api && api.keyName) localStorage.removeItem(api.keyName);
  if(typeof ucShowToast==='function') ucShowToast('🗑 '+apiId+' 키 삭제됨','success');
  var existing = document.getElementById('api-settings-overlay');
  if(existing){ existing.remove(); renderApiSettings(); }
}
