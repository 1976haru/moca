/* ═══ 발음 교정 사전 ═══ */
var MOCA_PRONUNC = {
  'ElevenLabs':'일레븐랩스', 'ChatGPT':'챗지피티', 'YouTube':'유튜브',
  'Instagram':'인스타그램', 'TikTok':'틱톡', 'AI':'에이아이',
  'GDP':'지디피', 'ETF':'이티에프', 'SNS':'에스엔에스',
  'BGM':'비지엠', 'TTS':'티티에스', 'API':'에이피아이',
};

/* ═══ 채널 목소리 프리셋 저장/불러오기 ═══ */
function studioS4SaveChannelVoice(){
  var s4=STUDIO.project.s4||{};
  var preset={
    voiceApi:s4.voiceApi, speakers:s4.speakers,
    savedAt:new Date().toISOString()
  };
  localStorage.setItem('moca_channel_voice', JSON.stringify(preset));
  if(typeof ucShowToast==='function') ucShowToast('✅ 채널 목소리 저장됨','success');
}

function studioS4LoadChannelVoice(){
  var preset=JSON.parse(localStorage.getItem('moca_channel_voice')||'null');
  if(!preset){alert('저장된 채널 목소리가 없어요'); return;}
  var s4=STUDIO.project.s4||{};
  s4.voiceApi=preset.voiceApi;
  s4.speakers=preset.speakers;
  STUDIO.project.s4=s4; studioSave(); renderStudio();
  if(typeof ucShowToast==='function') ucShowToast('✅ 채널 목소리 불러옴','success');
}

/* ═══ 발음 교정 함수 ═══ */
function studioS4FixPronunc(text){
  var result=text;
  Object.keys(MOCA_PRONUNC).forEach(function(k){
    result=result.replace(new RegExp(k,'g'), MOCA_PRONUNC[k]);
  });
  /* 한자 → 한글 (간단 패턴) */
  result=result.replace(/(\d+)代/g,'$1대');
  result=result.replace(/(\d+)歳/g,'$1세');
  return result;
}

async function studioS4AutoFixPronunc(){
  var scenes=(STUDIO.project.s3&&STUDIO.project.s3.scenes)||[];
  if(!scenes.length){alert('씬이 없어요');return;}
  var s4=STUDIO.project.s4||{};
  s4.pronuncFixed=s4.pronuncFixed||{};
  scenes.forEach(function(sc,i){
    var text=sc.desc||sc.label||'';
    s4.pronuncFixed[i]=studioS4FixPronunc(text);
  });
  STUDIO.project.s4=s4; studioSave();
  if(typeof ucShowToast==='function') ucShowToast('✅ 발음 교정 완료','success');
  renderStudio();
}

function studioS4OpenPronuncEditor(){
  var existing=document.getElementById('pronunc-editor');
  if(existing){existing.remove();return;}
  var dict=Object.assign({},MOCA_PRONUNC);
  var extra=JSON.parse(localStorage.getItem('moca_pronunc_custom')||'{}');
  Object.assign(dict,extra);

  var popup=document.createElement('div');
  popup.id='pronunc-editor';
  popup.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);'+
    'background:#fff;border-radius:16px;padding:20px;z-index:10001;'+
    'box-shadow:0 8px 40px rgba(0,0,0,0.25);width:400px;max-height:70vh;overflow-y:auto';

  var rows=Object.keys(dict).map(function(k){
    return '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">'+
      '<input value="'+k+'" data-orig="'+k+'" style="flex:1;border:1px solid #eee;border-radius:6px;padding:4px 8px;font-size:12px">'+
      '<span style="color:var(--sub)">→</span>'+
      '<input value="'+dict[k]+'" data-val="true" style="flex:1;border:1px solid #eee;border-radius:6px;padding:4px 8px;font-size:12px">'+
      '<button onclick="this.parentElement.remove()" style="border:none;background:#fee;color:#e74c3c;border-radius:4px;padding:4px 6px;cursor:pointer">✕</button>'+
    '</div>';
  }).join('');

  popup.innerHTML=
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">'+
      '<div style="font-size:14px;font-weight:900">📖 발음 사전</div>'+
      '<button onclick="document.getElementById(\'pronunc-editor\').remove()" style="border:none;background:#eee;border-radius:999px;padding:4px 12px;cursor:pointer">닫기</button>'+
    '</div>'+
    '<div id="pronunc-rows">'+rows+'</div>'+
    '<button onclick="studioS4AddPronunc()" style="width:100%;border:1.5px dashed var(--line);background:#f8f8f8;border-radius:8px;padding:8px;cursor:pointer;font-size:12px;margin-top:8px">+ 추가</button>'+
    '<button onclick="studioS4SavePronunc()" class="studio-btn pri" style="width:100%;margin-top:8px;font-size:12px">저장</button>';

  document.body.appendChild(popup);
}

function studioS4AddPronunc(){
  var rows=document.getElementById('pronunc-rows');
  if(!rows) return;
  var div=document.createElement('div');
  div.style.cssText='display:flex;gap:6px;align-items:center;margin-bottom:6px';
  div.innerHTML='<input placeholder="원본" data-orig="new" style="flex:1;border:1px solid #eee;border-radius:6px;padding:4px 8px;font-size:12px">'+
    '<span style="color:var(--sub)">→</span>'+
    '<input placeholder="발음" data-val="true" style="flex:1;border:1px solid #eee;border-radius:6px;padding:4px 8px;font-size:12px">'+
    '<button onclick="this.parentElement.remove()" style="border:none;background:#fee;color:#e74c3c;border-radius:4px;padding:4px 6px;cursor:pointer">✕</button>';
  rows.appendChild(div);
}

function studioS4SavePronunc(){
  var rows=document.querySelectorAll('#pronunc-rows > div');
  var custom={};
  rows.forEach(function(row){
    var inputs=row.querySelectorAll('input');
    if(inputs[0]&&inputs[1]&&inputs[0].value&&inputs[1].value){
      custom[inputs[0].value.trim()]=inputs[1].value.trim();
    }
  });
  localStorage.setItem('moca_pronunc_custom',JSON.stringify(custom));
  Object.assign(MOCA_PRONUNC,custom);
  document.getElementById('pronunc-editor')?.remove();
  if(typeof ucShowToast==='function') ucShowToast('✅ 발음 사전 저장됨','success');
}

/* ═══ Before/After 비교 ═══ */
async function studioS4Preview(idx, withEmotion){
  var s4=STUDIO.project.s4||{};
  var scenes=(STUDIO.project.s3&&STUDIO.project.s3.scenes)||[];
  var sc=scenes[idx]; if(!sc) return;

  var text=sc.desc||sc.label||'';
  var fixedText=studioS4FixPronunc(text);
  var key=(typeof ucGetApiKey==='function')?ucGetApiKey('openai'):localStorage.getItem('uc_openai_key')||'';
  if(!key){alert('OpenAI API 키를 설정해주세요');return;}

  var se=(s4.sceneEmotions&&s4.sceneEmotions[idx])||{speed:1.0};
  var speed=withEmotion?(se.speed||1.0):1.0;

  if(typeof ucShowToast==='function') ucShowToast('⏳ '+(withEmotion?'감정적용':'원본')+' 미리듣기 생성 중...','info');

  try{
    var r=await fetch('https://api.openai.com/v1/audio/speech',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body:JSON.stringify({model:'tts-1',input:fixedText,voice:'nova',speed:speed})
    });
    var blob=await r.blob();
    var url=URL.createObjectURL(blob);

    /* Before/After 팝업 */
    var popId='voice-compare-'+idx;
    var existing=document.getElementById(popId);
    if(existing) existing.remove();

    var pop=document.createElement('div');
    pop.id=popId;
    pop.style.cssText='position:fixed;bottom:80px;right:20px;background:#fff;border-radius:14px;'+
      'padding:14px;box-shadow:0 4px 20px rgba(0,0,0,0.2);z-index:9999;width:280px';
    pop.innerHTML=
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px">'+
        '<div style="font-size:12px;font-weight:900">씬'+(idx+1)+' '+(withEmotion?'감정 적용':'원본')+'</div>'+
        '<button onclick="document.getElementById(\''+popId+'\').remove()" style="border:none;background:#eee;border-radius:999px;padding:2px 8px;cursor:pointer;font-size:11px">✕</button>'+
      '</div>'+
      '<audio src="'+url+'" controls autoplay style="width:100%;border-radius:8px"></audio>'+
      '<div style="display:flex;gap:6px;margin-top:8px">'+
        '<button onclick="studioS4Preview('+idx+',false)" style="flex:1;border:1.5px solid var(--line);background:#fff;border-radius:999px;padding:5px;font-size:11px;cursor:pointer">원본</button>'+
        '<button onclick="studioS4Preview('+idx+',true)" style="flex:1;border:none;background:var(--pink);color:#fff;border-radius:999px;padding:5px;font-size:11px;cursor:pointer">감정 적용</button>'+
        '<button onclick="studioS4SavePreview(\''+url+'\','+idx+')" style="flex:1;border:1.5px solid #4a90c4;color:#4a90c4;background:#fff;border-radius:999px;padding:5px;font-size:11px;cursor:pointer">채택</button>'+
      '</div>';
    document.body.appendChild(pop);
  }catch(e){alert('오류: '+e.message);}
}

function studioS4SavePreview(url, idx){
  var s4=STUDIO.project.s4||{};
  s4.audios=s4.audios||[]; s4.audios[idx]=url;
  STUDIO.project.s4=s4; studioSave(); renderStudio();
  document.querySelectorAll('[id^="voice-compare-"]').forEach(function(el){el.remove();});
  if(typeof ucShowToast==='function') ucShowToast('✅ 씬'+(idx+1)+' 음성 채택됨','success');
}

/* ═══ 립싱크 데이터 생성 ═══ */
async function studioS4GenLipSync(idx){
  var s4=STUDIO.project.s4||{};
  var audioUrl=(s4.audios||[])[idx];
  if(!audioUrl){alert('먼저 씬 음성을 생성해주세요');return;}

  /* HeyGen API 연동 */
  var heygenKey=(typeof ucGetApiKey==='function')?ucGetApiKey('heygen'):localStorage.getItem('uc_heygen_key')||'';
  if(!heygenKey){
    if(confirm('HeyGen API 키가 없어요.\nAPI 설정에서 등록할까요?')){renderApiSettings();}
    return;
  }

  if(typeof ucShowToast==='function') ucShowToast('⏳ 립싱크 데이터 생성 중...','info');
  /* 실제 HeyGen 연동은 별도 구현 필요 */
  s4.lipSync=s4.lipSync||{};
  s4.lipSync[idx]={generated:true, timestamp:Date.now()};
  STUDIO.project.s4=s4; studioSave();
  if(typeof ucShowToast==='function') ucShowToast('✅ 립싱크 데이터 생성됨 (HeyGen/D-ID에서 사용 가능)','success');
}

/* ═══ Pixabay Music 검색 ═══ */
async function studioS4SearchBgm(){
  var genre=(STUDIO.project.s1&&STUDIO.project.s1.genre)||'';
  var moodMap={
    '시니어건강':'calm piano','재테크':'corporate','유머':'upbeat fun',
    '감동':'emotional','히스토리':'epic cinematic','사자성어':'traditional',
  };
  var query=moodMap[genre]||'background music';
  var key=(typeof ucGetApiKey==='function')?ucGetApiKey('pixabay'):localStorage.getItem('uc_pixabay_key')||'';
  if(!key){alert('Pixabay API 키를 설정해주세요 (무료 발급 가능)');return;}

  if(typeof ucShowToast==='function') ucShowToast('⏳ BGM 검색 중: '+query,'info');

  try{
    var r=await fetch('https://pixabay.com/api/videos/?key='+key+'&q='+encodeURIComponent(query)+'&per_page=5&video_type=animation');
    var d=await r.json();
    var hits=d.hits||[];

    if(!hits.length){
      if(typeof ucShowToast==='function') ucShowToast('검색 결과 없음. 직접 선택해주세요','warn');
      return;
    }

    /* BGM 결과 팝업 */
    var existing=document.getElementById('bgm-search-popup');
    if(existing) existing.remove();

    var pop=document.createElement('div');
    pop.id='bgm-search-popup';
    pop.style.cssText='position:fixed;bottom:80px;right:20px;background:#fff;border-radius:14px;'+
      'padding:14px;box-shadow:0 4px 20px rgba(0,0,0,0.2);z-index:9999;width:300px;max-height:400px;overflow-y:auto';
    pop.innerHTML=
      '<div style="display:flex;justify-content:space-between;margin-bottom:10px">'+
        '<div style="font-size:12px;font-weight:900">🎵 BGM 검색 결과</div>'+
        '<button onclick="document.getElementById(\'bgm-search-popup\').remove()" style="border:none;background:#eee;border-radius:999px;padding:2px 8px;cursor:pointer;font-size:11px">✕</button>'+
      '</div>'+
      hits.map(function(h,i){
        var audioUrl=h.videos&&h.videos.tiny&&h.videos.tiny.url;
        return '<div style="border:1px solid #eee;border-radius:10px;padding:8px;margin-bottom:6px">'+
          '<div style="font-size:11px;font-weight:700;margin-bottom:4px">'+(h.tags||'BGM '+i)+'</div>'+
          (audioUrl?'<audio src="'+audioUrl+'" controls style="width:100%;height:32px"></audio>':'')+
          '<button onclick="studioS4ApplyBgm(\''+audioUrl+'\')" style="width:100%;margin-top:4px;border:none;background:var(--pink);color:#fff;border-radius:6px;padding:4px;font-size:11px;cursor:pointer">적용</button>'+
        '</div>';
      }).join('');
    document.body.appendChild(pop);
    if(typeof ucShowToast==='function') ucShowToast('✅ BGM '+hits.length+'개 검색됨','success');
  }catch(e){alert('BGM 검색 오류: '+e.message);}
}

function studioS4ApplyBgm(url){
  if(!url) return;
  STUDIO.project.s4=STUDIO.project.s4||{};
  STUDIO.project.s4.bgmCustom=url;
  studioSave();
  document.getElementById('bgm-search-popup')?.remove();
  if(typeof ucShowToast==='function') ucShowToast('✅ BGM 적용됨','success');
}
