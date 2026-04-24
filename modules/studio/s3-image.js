/* ================================================
   s3-image.js
   STEP3 image / art-style / scene-gen / stock-search / image-reuse
   modules/studio/ -- split_studio2.py
   ================================================ */

/* ═════════════ STEP 3 이미지 ═════════════ */
function _studioS3(){
  const p  = STUDIO.project;
  const s3 = p.s3 || {};
  const s2 = p.s2 || {};
  const script = s2.scriptKo || s2.scriptJa || p.script || '';
  const scenes = s3.scenes || _studioS3ParseScenes(script);
  if(!s3.scenes){ s3.scenes = scenes; STUDIO.project.s3 = s3; }

  const api      = s3.api      || 'dalle3';
  const genMode  = s3.genMode  || 'balance';
  const sceneCount = scenes.length || 5;
  const costMap  = { dalle3:40, dalle2:8, flux:15, sd:3, gemini:0, minimax:10, ideogram:20 };
  const perScene = { save:1, balance:2, full:4, bg:1 }[genMode] || 2;
  const totalCost = (sceneCount * perScene + 3) * (costMap[api] || 40);

  const apiList = [
    { id:'dalle3',   name:'DALL-E 3',     price:'₩40/장', badge:'고품질'   },
    { id:'dalle2',   name:'DALL-E 2',     price:'₩8/장',  badge:'저렴'     },
    { id:'flux',     name:'Flux',         price:'₩15/장', badge:'시드고정' },
    { id:'sd',       name:'Stable Diff',  price:'₩3/장',  badge:'최저가'   },
    { id:'gemini',   name:'Gemini Imagen',price:'무료',   badge:'Gemini키' },
    { id:'minimax',  name:'MiniMax',      price:'₩10/장', badge:'영상특화' },
    { id:'ideogram', name:'Ideogram',     price:'₩20/장', badge:'텍스트↑'  },
  ];

  const artStyles = [
    ['ghibli','🌿 지브리'],['dslr','📷 실사'],['watercolor','🎨 수채화'],
    ['3dcg','💠 3D CG'],['anime','✨ 애니'],['webtoon','📱 웹툰'],
    ['popart','🎭 팝아트'],['minimal','⬜ 미니멀'],['vintage','📽 빈티지'],
    ['noir','🎞 노와르'],['pastel','🌸 파스텔'],['oilpaint','🖌 유화'],
    ['infographic','📊 인포'],['emoji','😊 이모지'],['sketch','✏️ 스케치'],
    ['ukiyo','🗻 우키요에'],
  ];
  const lighting = [
    'soft natural','dramatic','cinematic','warm golden',
    'cool blue','neon','fog/mist','backlit silhouette','studio portrait'
  ];
  const charPresets = [
    {id:'none',     label:'없음(배경중심)'},
    {id:'senior_f', label:'👵 시니어여성'},
    {id:'senior_m', label:'👴 시니어남성'},
    {id:'mid_f',    label:'👩 중년여성'},
    {id:'mid_m',    label:'👨 중년남성'},
    {id:'young',    label:'🧑 청년'},
    {id:'custom',   label:'✏️ 직접입력'},
  ];
  const genModes = [
    {id:'save',    label:'💰 절약형',   desc:'씬별 1장+썸네일1', est:(sceneCount+1)*(costMap[api]||40)},
    {id:'balance', label:'⚖️ 균형형',   desc:'씬별 2장+썸네일3', est:(sceneCount*2+3)*(costMap[api]||40)},
    {id:'full',    label:'🎨 풀옵션',   desc:'씬별 4장+썸네일5', est:(sceneCount*4+5)*(costMap[api]||40)},
    {id:'bg',      label:'🔄 배경교체', desc:'캐릭터1장+배경교체',est:(1+sceneCount)*(costMap[api]||40)},
  ];

  const keyMap   = {dalle3:'uc_openai_key',dalle2:'uc_openai_key',flux:'uc_flux_key',sd:'uc_sd_key',gemini:'uc_gemini_key',minimax:'uc_minimax_key',ideogram:'uc_ideogram_key'};
  const savedKey = localStorage.getItem(keyMap[api]||'uc_openai_key') || '';

  const apiHtml = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">' +
    apiList.map(function(a){
      var on = api===a.id;
      return '<button onclick="studioS3SetApi(\''+a.id+'\')" style="border:2px solid '+(on?'var(--pink)':'var(--line)')+';background:'+(on?'var(--pink-soft)':'#fff')+';border-radius:12px;padding:8px 12px;cursor:pointer;font-family:inherit;min-width:100px;transition:.15s;">' +
        '<div style="font-size:12px;font-weight:800;color:'+(on?'var(--pink)':'var(--text)')+'">'+a.name+'</div>' +
        '<div style="font-size:11px;color:var(--sub)">'+a.price+'</div>' +
        '<span style="font-size:10px;background:'+(on?'var(--pink)':'#eee')+';color:'+(on?'#fff':'#666')+';border-radius:999px;padding:1px 6px">'+a.badge+'</span>' +
      '</button>';
    }).join('') + '</div>';

  var reuseBarHtml = studioS3ReuseBar();
  var stockBarHtml = studioS3StockBar();

  const scenesHtml = scenes.map(function(sc, idx){
    var img     = (s3.images  || [])[idx];
    var adopted = (s3.adopted || [])[idx];
    return '<div style="background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:10px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
        '<div style="font-size:13px;font-weight:800">씬 '+(idx+1)+' — '+sc.label+'</div>' +
        '<div style="font-size:11px;color:var(--sub)">'+sc.time+'</div>' +
      '</div>' +
      '<textarea id="s3-prompt-'+idx+'" style="width:100%;border:1.5px solid var(--line);border-radius:8px;padding:8px;font-size:11px;resize:vertical;min-height:48px;font-family:inherit" placeholder="AI 프롬프트 (영어 자동생성 → 수정 가능)">'+(s3.prompts&&s3.prompts[idx]?s3.prompts[idx]:sc.prompt||'')+'</textarea>' +
      '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">' +
        '<button onclick="studioS3GenScene('+idx+')" class="studio-btn ghost" style="font-size:12px">🎨 AI생성</button>' +
        '<button onclick="studioS3RegenScene('+idx+')" class="studio-btn ghost" style="font-size:12px">🔄 재생성</button>' +
        '<button onclick="studioS3AutoPrompt('+idx+')" class="studio-btn ghost" style="font-size:12px">🤖 프롬프트 AI생성</button>' +
        '<label style="cursor:pointer"><span class="studio-btn ghost" style="font-size:12px;padding:6px 12px">📁 내 사진 사용</span><input type="file" accept="image/*" style="display:none" onchange="studioS3UploadScene('+idx+', this)"></label>' +
      '</div>' +
      (img ?
        '<div style="margin-top:10px">' +
          '<img src="'+img+'" style="width:100%;max-height:180px;object-fit:cover;border-radius:10px;border:1px solid var(--line)">' +
          '<div style="display:flex;gap:6px;margin-top:6px">' +
            '<button onclick="studioS3Adopt('+idx+',true)" style="flex:1;border:none;border-radius:999px;padding:7px;font-size:12px;font-weight:800;cursor:pointer;background:'+(adopted?'#27ae60':'#eee')+';color:'+(adopted?'#fff':'#666')+'">'+(adopted?'✅ 채택됨':'✅ 채택')+'</button>' +
            '<button onclick="studioS3Adopt('+idx+',false)" style="flex:1;border:none;border-radius:999px;padding:7px;font-size:12px;font-weight:800;cursor:pointer;background:#eee;color:#666">⬜ 건너뜀</button>' +
            '<button onclick="studioS3SaveLib('+idx+')" style="flex:1;border:none;border-radius:999px;padding:7px;font-size:12px;font-weight:800;cursor:pointer;background:#eee;color:#666">📁 라이브러리</button>' +
          '</div>' +
        '</div>'
      : '<div style="margin-top:8px;background:#f8f8f8;border-radius:10px;height:80px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#bbb">이미지 생성 전</div>') +
    '</div>';
  }).join('');

  return '<div class="studio-panel">' +

    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">' +
      '<div><h4 style="margin:0 0 2px">② 이미지 생성</h4><div style="font-size:12px;color:var(--sub)">씬별 이미지 + 썸네일 · 내 사진 업로드 가능</div></div>' +
      '<div style="text-align:right"><div style="font-size:11px;color:var(--sub)">예상비용</div><div style="font-size:20px;font-weight:900;color:var(--pink)">₩'+totalCost+'</div></div>' +
    '</div>' +

    '<div class="studio-section"><div class="studio-label">🤖 A. 이미지 API 선택</div>' +
    apiHtml +
    (function(){var keyStatus=(typeof ucApiKeyStatus==='function')?ucApiKeyStatus(api):{ok:false,label:'확인불가'};return '<div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding:8px 12px;background:#f8f8f8;border-radius:8px">' +'<span style="font-size:12px;font-weight:700;color:'+(keyStatus.ok?'#27ae60':'#e74c3c')+'">'+keyStatus.label+'</span>' +'<span style="font-size:12px;color:var(--sub)">'+api+' API 키</span>' +'<button onclick="renderApiSettings()" style="margin-left:auto;border:none;background:var(--pink);color:#fff;border-radius:999px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer">⚙️ 키 설정</button>' +'</div></div>';})() +

    '<div class="studio-section"><div class="studio-label">🎨 B. 화풍 선택</div>' +
    '<div class="studio-chips" id="s3-art">' +
    artStyles.map(function(a){ return '<button class="studio-chip'+(s3.artStyle===a[0]?' on':'')+'" onclick="studioS3Art(\''+a[0]+'\',this)">'+a[1]+'</button>'; }).join('') +
    '</div><div class="studio-label" style="margin-top:10px">💡 조명·분위기</div>' +
    '<div class="studio-chips" id="s3-light">' +
    lighting.map(function(l){ return '<button class="studio-chip'+(s3.lighting===l?' on':'')+'" onclick="studioS3Light(\''+l+'\',this)">'+l+'</button>'; }).join('') +
    '</div><div class="studio-label" style="margin-top:10px">🌏 채널 감성</div>' +
    '<div style="display:flex;gap:8px">' +
    ['🇰🇷 한국','🇯🇵 일본','🌐 중립'].map(function(c,i){ var v=['ko','ja','neutral'][i]; return '<button class="studio-chip'+(s3.channelStyle===v?' on':'')+'" onclick="studioS3Style(\''+v+'\',this)">'+c+'</button>'; }).join('') +
    '</div></div>' +

    '<div class="studio-section"><div class="studio-label">👤 C. 캐릭터 일관성</div>' +
    '<div class="studio-chips">' +
    charPresets.map(function(c){ return '<button class="studio-chip'+(s3.charPreset===c.id?' on':'')+'" onclick="studioS3Char(\''+c.id+'\',this)">'+c.label+'</button>'; }).join('') +
    '</div>' +
    (s3.charPreset==='custom'?'<textarea id="s3-char-custom" class="studio-in" style="margin-top:8px;min-height:44px" placeholder="예: 60대 한국 여성, 흰머리, 안경">'+(s3.charCustom||'')+'</textarea>':'') +
    '<div style="display:flex;align-items:center;gap:10px;margin-top:10px">' +
    '<label style="font-size:13px;font-weight:700">🔒 시드 고정</label>' +
    '<input type="checkbox" '+(s3.seedFixed?'checked':'')+' onchange="studioS3SeedToggle(this.checked)" style="width:16px;height:16px;accent-color:var(--pink)">' +
    '<span style="font-size:11px;color:var(--sub)">Flux·SD에서 동작</span></div></div>' +

    '<div class="studio-section"><div class="studio-label">⚡ D. 생성 방식</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
    genModes.map(function(m){ var on=genMode===m.id; return '<button onclick="studioS3Mode(\''+m.id+'\')" style="border:2px solid '+(on?'var(--pink)':'var(--line)')+';background:'+(on?'var(--pink-soft)':'#fff')+';border-radius:12px;padding:10px 14px;cursor:pointer;font-family:inherit;text-align:left;transition:.15s"><div style="font-size:13px;font-weight:800;color:'+(on?'var(--pink)':'var(--text)')+'">'+m.label+'</div><div style="font-size:11px;color:var(--sub)">'+m.desc+'</div><div style="font-size:12px;font-weight:700;color:'+(on?'var(--pink)':'var(--sub)')+'">~₩'+m.est+'</div></button>'; }).join('') +
    '</div></div>' +

    '<div class="studio-section">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
    '<div class="studio-label" style="margin:0">🖼 E. 씬별 이미지 생성</div>' +
    '<div style="display:flex;gap:6px">' +
    '<button onclick="studioS3GenAll()" class="studio-btn pri" style="font-size:12px">⚡ 전체 AI생성</button>' +
    '<label style="cursor:pointer"><span class="studio-btn ghost" style="font-size:12px;padding:8px 12px">📂 내 사진 일괄업로드</span><input type="file" accept="image/*" multiple style="display:none" onchange="studioS3UploadBatch(this)"></label>' +
    '</div></div>' +
    '<div style="font-size:11px;color:var(--sub);margin-bottom:10px">💡 내 사진을 씬 순서대로 선택하면 자동 배정 · 비용 ₩0</div>' +
    reuseBarHtml + stockBarHtml + scenesHtml + '</div>' +

    '<div class="studio-section"><div class="studio-label">🖼 F. 썸네일 생성</div>' +
    '<input id="s3-thumb-title" class="studio-in" placeholder="썸네일 제목" value="'+(s3.thumbTitle||'')+'" style="margin-bottom:8px">' +
    '<div class="studio-chips" style="margin-bottom:10px">' +
    ['충격형','감성형','정보형','호기심형','숫자형'].map(function(t){ return '<button class="studio-chip'+(s3.thumbStyle===t?' on':'')+'" onclick="studioS3ThumbStyle(\''+t+'\',this)">'+t+'</button>'; }).join('') +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
    ['A','B','C'].map(function(v){ var img=s3['thumb'+v]; return '<div style="flex:1"><button onclick="studioS3GenThumb(\''+v+'\')" style="width:100%;border:1.5px dashed var(--line);background:#f8f8f8;border-radius:10px;padding:12px;cursor:pointer;font-size:12px;font-weight:700;color:var(--sub)">'+(img?'<img src="'+img+'" style="width:100%;border-radius:8px">':'🖼 썸네일 '+v+'안')+'</button></div>'; }).join('') +
    '</div>' +
    '<label style="cursor:pointer;display:inline-block;margin-top:8px"><span class="studio-btn ghost" style="font-size:12px">📁 내 사진으로 썸네일</span><input type="file" accept="image/*" style="display:none" onchange="studioS3UploadThumb(this)"></label></div>' +

    '<div class="studio-section"><div class="studio-label">📁 G. 이미지 라이브러리</div>' +
    '<div style="font-size:12px;color:var(--sub);margin-bottom:8px">저장한 이미지 재사용 → 비용 절감</div>' +
    '<button onclick="studioS3OpenLib()" class="studio-btn ghost" style="font-size:12px">📂 라이브러리 열기</button></div>' +

    '<div class="studio-actions" style="justify-content:space-between;margin-top:14px">' +
    '<button class="studio-btn ghost" onclick="studioGoto(1)">← 대본</button>' +
    '<button class="studio-btn pri" onclick="studioS3Next()">다음: 음성·BGM →</button>' +
    '</div>' +
  '</div>';
}

function _studioS3ParseScenes(script){
  var defaults = [
    {label:'훅 장면',   time:'0~3초',   desc:'시청자 시선 잡기', prompt:''},
    {label:'설명 장면', time:'3~20초',  desc:'핵심 내용 소개',   prompt:''},
    {label:'핵심 장면', time:'20~45초', desc:'중요 정보 전달',   prompt:''},
    {label:'강조 장면', time:'45~55초', desc:'포인트 강조',       prompt:''},
    {label:'CTA 장면',  time:'55~60초', desc:'구독·댓글 유도',   prompt:''},
  ];
  if(!script || script.length < 50) return defaults;
  var lines = script.split('\n').filter(function(l){ return l.trim(); });
  var scenePattern = /^[【\[]?씬\s*(\d+)[】\]]?|^SCENE\s*(\d+)/i;
  var sceneLines = [];
  var cur = null;
  lines.forEach(function(line){
    var m = line.match(scenePattern);
    if(m){
      if(cur) sceneLines.push(cur);
      cur = {label:'씬'+(m[1]||m[2]), lines:[], time:'', desc:'', prompt:''};
    } else if(cur){
      cur.lines.push(line);
    }
  });
  if(cur) sceneLines.push(cur);
  if(sceneLines.length >= 3){
    return sceneLines.slice(0,7).map(function(s,i){
      var times = ['0~3초','3~15초','15~35초','35~50초','50~58초','58~60초'];
      s.desc = s.lines.slice(0,2).join(' ').slice(0,60);
      s.time = times[i] || '';
      return s;
    });
  }
  var paras = [];
  var buf = [];
  lines.forEach(function(line){
    if(line.trim() === '' && buf.length){
      paras.push(buf.join(' '));
      buf = [];
    } else {
      buf.push(line.trim());
    }
  });
  if(buf.length) paras.push(buf.join(' '));
  if(paras.length >= 3){
    var count = paras.length >= 5 ? 5 : paras.length;
    var chunk = Math.ceil(paras.length / count);
    var sceneLabels = ['훅 장면','설명 장면','핵심 장면','강조 장면','CTA 장면'];
    var sceneTimes  = ['0~3초','3~20초','20~45초','45~55초','55~60초'];
    var result = [];
    for(var i=0; i<count; i++){
      var group = paras.slice(i*chunk, (i+1)*chunk);
      result.push({
        label: sceneLabels[i] || ('씬'+(i+1)),
        time:  sceneTimes[i]  || '',
        desc:  group[0] ? group[0].slice(0,60) : '',
        prompt: '',
        lines: group
      });
    }
    return result;
  }
  return defaults;
}

function _studioBindS3(){}

function studioS3SetApi(api){
  STUDIO.project.s3 = STUDIO.project.s3 || {};
  STUDIO.project.s3.api = api;
  studioSave(); renderStudio();
}

function studioS3Art(id, btn){
  STUDIO.project.s3 = STUDIO.project.s3 || {};
  STUDIO.project.s3.artStyle = id;
  document.querySelectorAll('#s3-art .studio-chip').forEach(function(b){ b.classList.remove('on'); });
  if(btn) btn.classList.add('on');
  studioSave();
}

function studioS3Light(val, btn){
  STUDIO.project.s3 = STUDIO.project.s3 || {};
  STUDIO.project.s3.lighting = val;
  document.querySelectorAll('#s3-light .studio-chip').forEach(function(b){ b.classList.remove('on'); });
  if(btn) btn.classList.add('on');
  studioSave();
}

function studioS3Style(val, btn){
  STUDIO.project.s3 = STUDIO.project.s3 || {};
  STUDIO.project.s3.channelStyle = val;
  studioSave(); renderStudio();
}

function studioS3Char(id, btn){
  STUDIO.project.s3 = STUDIO.project.s3 || {};
  STUDIO.project.s3.charPreset = id;
  studioSave(); renderStudio();
}

function studioS3SeedToggle(val){
  STUDIO.project.s3 = STUDIO.project.s3 || {};
  STUDIO.project.s3.seedFixed = val;
  studioSave();
}

function studioS3Mode(mode){
  STUDIO.project.s3 = STUDIO.project.s3 || {};
  STUDIO.project.s3.genMode = mode;
  studioSave(); renderStudio();
}

function studioS3SaveKey(){
  var key = document.getElementById('s3-api-key')?.value || '';
  var api = STUDIO.project.s3?.api || 'dalle3';
  var keyMap = {dalle3:'uc_openai_key',dalle2:'uc_openai_key',flux:'uc_flux_key',sd:'uc_sd_key',gemini:'uc_gemini_key',minimax:'uc_minimax_key',ideogram:'uc_ideogram_key'};
  localStorage.setItem(keyMap[api]||'uc_openai_key', key);
  if(typeof ucShowToast==='function') ucShowToast('✅ API 키 저장됨','success');
  else if(typeof window.mocaToast==='function') window.mocaToast('✅ API 키 저장됨','ok');
}

async function studioS3AutoPrompt(idx){
  var s3 = STUDIO.project.s3 || {};
  var scenes = s3.scenes || [];
  var sc = scenes[idx]; if(!sc) return;
  var script = STUDIO.project.s2?.scriptKo || STUDIO.project.s2?.scriptJa || '';
  var sys = 'Stable Diffusion image prompt expert. Answer in English only.';
  var user = 'Scene: '+sc.label+' ('+sc.time+')\nScript: '+script.slice(0,200)+'\nArt style: '+(s3.artStyle||'ghibli')+'\nWrite image prompt in 50 words or less.';
  try {
    var res = await APIAdapter.callWithFallback(sys, user, {maxTokens:150});
    s3.prompts = s3.prompts || [];
    s3.prompts[idx] = res.trim();
    STUDIO.project.s3 = s3; studioSave();
    var el = document.getElementById('s3-prompt-'+idx);
    if(el) el.value = res.trim();
    if(typeof ucShowToast==='function') ucShowToast('✅ 프롬프트 생성됨','success');
  } catch(e){ alert('오류: '+e.message); }
}

async function studioS3AutoAllPrompts(){
  var scenes = STUDIO.project.s3?.scenes || _studioS3ParseScenes('');
  for(var i=0;i<scenes.length;i++){
    await studioS3AutoPrompt(i);
    await new Promise(function(r){ setTimeout(r,500); });
  }
}

async function studioS3GenScene(idx){
  var s3 = STUDIO.project.s3 || {};
  var api = s3.api || 'dalle3';
  var prompt = (document.getElementById('s3-prompt-'+idx)?.value || '').trim();
  if(!prompt){ alert('프롬프트를 입력하거나 🤖 AI생성 버튼을 누르세요'); return; }
  var fullPrompt = prompt + (s3.artStyle?', '+s3.artStyle+' style':'') + (s3.lighting?', '+s3.lighting+' lighting':'') + ', high quality';
  try {
    if(api==='dalle3'||api==='dalle2'){
      var key = (typeof ucGetApiKey==='function') ? ucGetApiKey('openai') : localStorage.getItem('uc_openai_key')||'';
      if(!key){ alert('OpenAI API 키를 입력해주세요'); return; }
      if(typeof ucShowToast==='function') ucShowToast('⏳ 이미지 생성 중...','info');
      var r = await fetch('https://api.openai.com/v1/images/generations',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
        body:JSON.stringify({model:api==='dalle3'?'dall-e-3':'dall-e-2',prompt:fullPrompt,n:1,size:'1024x1024'})
      });
      var d = await r.json();
      var url = d?.data?.[0]?.url;
      if(!url) throw new Error(JSON.stringify(d));
      s3.images = s3.images||[]; s3.images[idx] = url;
      STUDIO.project.s3 = s3; studioSave(); renderStudio();
      if(typeof ucShowToast==='function') ucShowToast('✅ 이미지 생성 완료','success');
    } else {
      if(typeof ucShowToast==='function') ucShowToast('⏳ '+api+' 연동 준비 중...','info');
    }
  } catch(e){ alert('이미지 생성 오류: '+e.message); }
}

function studioS3RegenScene(idx){
  var s3 = STUDIO.project.s3||{};
  s3.images = s3.images||[]; s3.images[idx] = null;
  STUDIO.project.s3 = s3; studioSave();
  studioS3GenScene(idx);
}

async function studioS3GenAll(){
  var scenes = STUDIO.project.s3?.scenes || _studioS3ParseScenes('');
  for(var i=0;i<scenes.length;i++){
    await studioS3GenScene(i);
    await new Promise(function(r){ setTimeout(r,1000); });
  }
}

function studioS3UploadScene(idx, input){
  var file = input.files[0]; if(!file) return;
  var reader = new FileReader();
  reader.onload = function(e){
    var s3 = STUDIO.project.s3||{};
    s3.images = s3.images||[]; s3.images[idx] = e.target.result;
    s3.adopted = s3.adopted||[]; s3.adopted[idx] = true;
    STUDIO.project.s3 = s3; studioSave(); renderStudio();
    if(typeof ucShowToast==='function') ucShowToast('✅ 씬'+(idx+1)+' 사진 업로드 완료','success');
  };
  reader.readAsDataURL(file);
}

function studioS3UploadBatch(input){
  var files = Array.from(input.files); if(!files.length) return;
  var s3 = STUDIO.project.s3||{};
  s3.images = s3.images||[]; s3.adopted = s3.adopted||[];
  var scenes = s3.scenes || _studioS3ParseScenes('');
  var total = Math.min(files.length, scenes.length);
  var done = 0;
  files.slice(0,total).forEach(function(file,idx){
    var reader = new FileReader();
    reader.onload = function(e){
      s3.images[idx] = e.target.result;
      s3.adopted[idx] = true;
      done++;
      if(done===total){
        STUDIO.project.s3 = s3; studioSave(); renderStudio();
        var msg = '✅ '+total+'장 업로드 완료';
        if(files.length>scenes.length) msg += ' (초과 '+(files.length-scenes.length)+'장 무시)';
        if(files.length<scenes.length) msg += ' · 나머지 '+(scenes.length-files.length)+'씬은 AI 생성하세요';
        if(typeof ucShowToast==='function') ucShowToast(msg,'success');
      }
    };
    reader.readAsDataURL(file);
  });
}

function studioS3UploadThumb(input){
  var file = input.files[0]; if(!file) return;
  var reader = new FileReader();
  reader.onload = function(e){
    var s3 = STUDIO.project.s3||{};
    s3.thumbA = e.target.result;
    STUDIO.project.s3 = s3; studioSave(); renderStudio();
    if(typeof ucShowToast==='function') ucShowToast('✅ 썸네일 업로드 완료','success');
  };
  reader.readAsDataURL(file);
}

function studioS3Adopt(idx, val){
  var s3 = STUDIO.project.s3||{};
  s3.adopted = s3.adopted||[]; s3.adopted[idx] = val;
  STUDIO.project.s3 = s3; studioSave(); renderStudio();
}

function studioS3SaveLib(idx){
  var s3 = STUDIO.project.s3||{};
  var img = (s3.images||[])[idx];
  if(!img){ alert('먼저 이미지를 생성해주세요'); return; }
  var lib = JSON.parse(localStorage.getItem('uc_img_library')||'[]');
  lib.push({url:img, savedAt:new Date().toISOString(), style:s3.artStyle});
  localStorage.setItem('uc_img_library', JSON.stringify(lib.slice(-50)));
  if(typeof ucShowToast==='function') ucShowToast('📁 라이브러리에 저장됨','success');
}

function studioS3OpenLib(){
  var lib = JSON.parse(localStorage.getItem('uc_img_library')||'[]');
  var overlay = document.createElement('div');
  overlay.id = 'img-lib-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
  var box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:20px;width:100%;max-width:700px;max-height:80vh;overflow-y:auto;padding:20px';
  var header = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px"><div style="font-size:16px;font-weight:900">📁 이미지 라이브러리</div><button onclick="document.getElementById(\'img-lib-overlay\').remove()" style="border:none;background:#eee;border-radius:999px;padding:6px 14px;cursor:pointer;font-weight:700">닫기</button></div>';
  var content = '';
  if(!lib.length){
    content = '<div style="text-align:center;padding:40px;color:#bbb"><div style="font-size:40px;margin-bottom:10px">📭</div><div style="font-size:14px;font-weight:700">저장된 이미지가 없어요</div><div style="font-size:12px;margin-top:6px">씬 이미지 생성 후 📁 버튼을 눌러 저장하세요</div></div>';
  } else {
    content = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">' +
      lib.map(function(item, idx){
        var date = item.savedAt ? new Date(item.savedAt).toLocaleDateString('ko-KR') : '';
        return '<div style="border:1px solid #eee;border-radius:12px;overflow:hidden">' +
          '<img src="'+item.url+'" style="width:100%;height:120px;object-fit:cover;display:block">' +
          '<div style="padding:8px">' +
            '<div style="font-size:11px;color:#999;margin-bottom:6px">'+date+(item.style?' · '+item.style:'')+'</div>' +
            '<div style="display:flex;gap:4px">' +
              '<button onclick="studioS3LibUse('+idx+')" style="flex:1;border:none;background:var(--pink);color:#fff;border-radius:999px;padding:5px;font-size:11px;font-weight:700;cursor:pointer">씬에 사용</button>' +
              '<button onclick="studioS3LibDelete('+idx+')" style="border:none;background:#eee;border-radius:999px;padding:5px 8px;font-size:11px;cursor:pointer">🗑</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
  }
  box.innerHTML = header + content;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

async function studioS3ExtractScenes(){
  var p = STUDIO.project;
  var s3 = p.s3 || {};
  var script = (p.s2 && (p.s2.scriptKo || p.s2.scriptJa)) || p.script || '';
  if(!script || script.length < 100){
    s3.scenes = _studioS3ParseScenes(script);
    STUDIO.project.s3 = s3; studioSave(); return;
  }
  if(s3.scenes && s3.scenes.length && s3.scenesFromScript === script.slice(0,100)) return;
  var sys = '유튜브 숏츠 대본 분석 전문가. JSON만 출력. 설명 없음.';
  var user = '아래 대본을 3~6개 씬으로 분석해서 JSON 배열로 반환해줘.\n형식: [{"label":"씬 이름","time":"시간대","desc":"씬 내용 한 줄 설명","prompt":""}]\n시간대 예시: 0~3초, 3~20초\n대본:\n' + script.slice(0,2000);
  try {
    var res = await APIAdapter.callWithFallback(sys, user, {maxTokens:800});
    var m = res.match(/\[[\s\S]*\]/);
    if(m){
      var arr = JSON.parse(m[0]);
      if(arr && arr.length >= 2){
        s3.scenes = arr;
        s3.scenesFromScript = script.slice(0,100);
        STUDIO.project.s3 = s3; studioSave(); renderStudio();
        if(typeof ucShowToast==='function') ucShowToast('✅ 씬 '+arr.length+'개 자동 추출 완료','success');
        return;
      }
    }
  } catch(e){ console.warn('씬 AI 추출 실패:', e.message); }
  s3.scenes = _studioS3ParseScenes(script);
  STUDIO.project.s3 = s3; studioSave();
}

function studioS3LibUse(idx){
  var lib = JSON.parse(localStorage.getItem('uc_img_library')||'[]');
  var item = lib[idx]; if(!item) return;
  var s3 = STUDIO.project.s3 || {};
  s3.images = s3.images || [];
  var emptyIdx = s3.images.findIndex(function(img){ return !img; });
  if(emptyIdx === -1) emptyIdx = 0;
  s3.images[emptyIdx] = item.url;
  s3.adopted = s3.adopted || [];
  s3.adopted[emptyIdx] = true;
  STUDIO.project.s3 = s3; studioSave();
  document.getElementById('img-lib-overlay')?.remove();
  renderStudio();
  if(typeof ucShowToast==='function') ucShowToast('✅ 씬'+(emptyIdx+1)+'에 적용됐어요','success');
}

function studioS3LibDelete(idx){
  var lib = JSON.parse(localStorage.getItem('uc_img_library')||'[]');
  lib.splice(idx, 1);
  localStorage.setItem('uc_img_library', JSON.stringify(lib));
  document.getElementById('img-lib-overlay')?.remove();
  studioS3OpenLib();
}

function studioS3ThumbStyle(val, btn){
  STUDIO.project.s3 = STUDIO.project.s3||{};
  STUDIO.project.s3.thumbStyle = val;
  studioSave();
}

async function studioS3GenThumb(variant){
  var s3 = STUDIO.project.s3||{};
  var title = document.getElementById('s3-thumb-title')?.value||'';
  var key = (typeof ucGetApiKey==='function') ? ucGetApiKey('openai') : localStorage.getItem('uc_openai_key')||'';
  if(!key){ alert('OpenAI API 키를 입력해주세요'); return; }
  if(!title){ alert('썸네일 제목을 입력해주세요'); return; }
  if(typeof ucShowToast==='function') ucShowToast('⏳ 썸네일 '+variant+'안 생성 중...','info');
  try {
    var styleMap = {충격형:'shocking dramatic',감성형:'emotional warm',정보형:'informative clean',호기심형:'mysterious curious',숫자형:'bold numbers'};
    var prm = 'YouTube thumbnail, bold text "'+title+'", '+(styleMap[s3.thumbStyle]||'')+(s3.artStyle?', '+s3.artStyle+' style':'')+', 16:9, high quality';
    var r = await fetch('https://api.openai.com/v1/images/generations',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body:JSON.stringify({model:'dall-e-3',prompt:prm,n:1,size:'1792x1024'})
    });
    var d = await r.json();
    var url = d?.data?.[0]?.url;
    if(!url) throw new Error(JSON.stringify(d));
    s3['thumb'+variant] = url;
    STUDIO.project.s3 = s3; studioSave(); renderStudio();
    if(typeof ucShowToast==='function') ucShowToast('✅ 썸네일 '+variant+'안 완료','success');
  } catch(e){ alert('썸네일 생성 오류: '+e.message); }
}

function studioS3Next(){
  var s3 = STUDIO.project.s3||{};
  var hasImg = (s3.images||[]).some(function(i){ return !!i; });
  if(!hasImg && !confirm('이미지 없이 다음 단계로 진행할까요?')) return;
  STUDIO.project.step = 3;
  studioSave(); renderStudio();
  window.scrollTo({top:0,behavior:'smooth'});
}

/* 하위 호환 */
async function studioS3GenScenes(){ studioS3GenAll(); }
async function studioS3GenThumbs(){ studioS3GenThumb('A'); }
function studioS3Regen(i){ studioS3RegenScene(i); }


/* ── 이미지 절약 시스템 ── */

/* 비율 설정 UI를 _studioS3() 함수의 E섹션 상단에 추가할 HTML 반환 */
function studioS3ReuseBar(){
  var s3 = STUDIO.project.s3 || {};
  var scenes = s3.scenes || [];
  var total = scenes.length;
  if(total <= 3) return ''; /* 씬이 적으면 표시 안 함 */

  var ratio  = s3.imageRatio  || 100; /* 생성할 이미지 비율 % */
  var reuseMode = s3.reuseMode || 'block'; /* block/cycle/random */
  var genCount = Math.max(1, Math.round(total * ratio / 100));

  return '<div style="background:#fff9fc;border:1.5px solid var(--pink);border-radius:14px;padding:14px;margin-bottom:14px">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
      '<div style="font-size:13px;font-weight:900">💡 이미지 절약 설정</div>' +
      '<div style="font-size:12px;color:var(--pink);font-weight:800">씬 '+total+'개 중 '+genCount+'장만 생성</div>' +
    '</div>' +

    /* 슬라이더 */
    '<div style="margin-bottom:10px">' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--sub);margin-bottom:4px">' +
        '<span>최소 ('+Math.ceil(total*0.2)+'장)</span>' +
        '<span style="font-weight:800;color:var(--pink)">'+ratio+'% = '+genCount+'장 생성</span>' +
        '<span>전체 ('+total+'장)</span>' +
      '</div>' +
      '<input type="range" min="10" max="100" step="5" value="'+ratio+'" '+
        'oninput="studioS3SetRatio(this.value)" '+
        'style="width:100%;accent-color:var(--pink)">' +
    '</div>' +

    /* 재사용 방식 */
    '<div style="font-size:12px;font-weight:700;color:var(--sub);margin-bottom:6px">재사용 방식</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      [
        {id:'block',  label:'📦 구간',  desc:'씬1~3→이미지1, 씬4~6→이미지2'},
        {id:'cycle',  label:'🔄 순환',  desc:'1→2→...→'+genCount+'→1→2...'},
        {id:'similar',label:'🧠 유사도',desc:'비슷한 내용끼리 같은 이미지'},
        {id:'random', label:'🎲 랜덤',  desc:'무작위 배정'},
      ].map(function(m){
        var on = reuseMode === m.id;
        return '<button onclick="studioS3SetReuseMode(\''+m.id+'\')" '+
          'title="'+m.desc+'" '+
          'style="border:2px solid '+(on?'var(--pink)':'var(--line)')+';'+
          'background:'+(on?'var(--pink-soft)':'#fff')+';'+
          'border-radius:999px;padding:6px 12px;cursor:pointer;'+
          'font-size:12px;font-weight:700;color:'+(on?'var(--pink)':'var(--sub)')+'">'+
          m.label+'</button>';
      }).join('') +
    '</div>' +

    /* 미리보기 */
    '<div style="margin-top:10px;font-size:11px;color:var(--sub);background:#f8f8f8;border-radius:8px;padding:8px">' +
      '📋 배정 미리보기: '+studioS3ReusePreview(total, genCount, reuseMode) +
    '</div>' +
  '</div>';
}

/* 재사용 배정 미리보기 텍스트 */
function studioS3ReusePreview(total, genCount, mode){
  if(mode === 'block'){
    var blockSize = Math.ceil(total / genCount);
    return '씬 '+blockSize+'개마다 이미지 1장 공유 (총 '+genCount+'장 생성)';
  }
  if(mode === 'cycle'){
    return '씬1→이미지1, 씬2→이미지2 ... 씬'+(genCount+1)+'→이미지1 (반복)';
  }
  if(mode === 'similar'){
    return 'AI가 씬 내용 분석 → 유사한 씬끼리 같은 이미지 배정';
  }
  return '무작위 배정 ('+genCount+'장 이미지로 '+total+'씬 커버)';
}

/* 비율 설정 */
function studioS3SetRatio(val){
  var s3 = STUDIO.project.s3 || {};
  s3.imageRatio = parseInt(val);
  STUDIO.project.s3 = s3;
  studioSave();
  /* 슬라이더만 업데이트 (전체 재렌더 없이) */
  var total = (s3.scenes||[]).length;
  var genCount = Math.max(1, Math.round(total * s3.imageRatio / 100));
  var preview = document.querySelector('[data-reuse-preview]');
  if(preview) preview.textContent = studioS3ReusePreview(total, genCount, s3.reuseMode||'block');
  /* 비율 표시 업데이트 */
  var label = document.querySelector('[data-ratio-label]');
  if(label) label.textContent = val+'% = '+genCount+'장 생성';
}

/* 재사용 방식 설정 */
function studioS3SetReuseMode(mode){
  var s3 = STUDIO.project.s3 || {};
  s3.reuseMode = mode;
  STUDIO.project.s3 = s3;
  studioSave();
  renderStudio();
}

/* 이미지 배정 실행 — 생성된 이미지를 전체 씬에 배정 */
function studioS3ApplyReuse(){
  var s3 = STUDIO.project.s3 || {};
  var scenes = s3.scenes || [];
  var images = (s3.images || []).filter(function(img){ return !!img; });
  if(!images.length){ alert('먼저 이미지를 생성해주세요'); return; }

  var total    = scenes.length;
  var genCount = images.length;
  var mode     = s3.reuseMode || 'block';
  var assigned = new Array(total).fill(null);

  /* 생성된 이미지는 원래 위치에 먼저 배정 */
  images.forEach(function(img, i){ assigned[i] = img; });

  if(mode === 'block'){
    var blockSize = Math.ceil(total / genCount);
    for(var i=0; i<total; i++){
      if(!assigned[i]){
        var srcIdx = Math.floor(i / blockSize);
        assigned[i] = images[Math.min(srcIdx, genCount-1)];
      }
    }
  } else if(mode === 'cycle'){
    for(var i=0; i<total; i++){
      if(!assigned[i]) assigned[i] = images[i % genCount];
    }
  } else if(mode === 'random'){
    for(var i=0; i<total; i++){
      if(!assigned[i]) assigned[i] = images[Math.floor(Math.random()*genCount)];
    }
  } else if(mode === 'similar'){
    /* 유사도는 AI 분석 필요 → 일단 block으로 폴백 */
    var blockSize2 = Math.ceil(total / genCount);
    for(var i=0; i<total; i++){
      if(!assigned[i]){
        var srcIdx2 = Math.floor(i / blockSize2);
        assigned[i] = images[Math.min(srcIdx2, genCount-1)];
      }
    }
    studioS3ApplyReuseSimilar(); /* 비동기로 AI 재배정 */
  }

  s3.finalImages = assigned;
  STUDIO.project.s3 = s3;
  studioSave();
  renderStudio();
  if(typeof ucShowToast==='function') ucShowToast('✅ '+genCount+'장으로 '+total+'씬 배정 완료','success');
}

/* 유사도 기반 재배정 (AI) */
async function studioS3ApplyReuseSimilar(){
  var s3 = STUDIO.project.s3 || {};
  var scenes = s3.scenes || [];
  var images = (s3.images||[]).filter(function(img){ return !!img; });
  if(!images.length || !scenes.length) return;

  var sys = '유튜브 영상 씬 분석가. JSON만 출력.';
  var user = '아래 씬 목록을 '+images.length+'개 그룹으로 나눠줘.\n'+
    '형식: {"groups":[[씬인덱스,...],[씬인덱스,...]]}\n'+
    '씬 목록:\n'+
    scenes.map(function(s,i){ return i+': '+s.label+' - '+s.desc; }).join('\n');

  try {
    var res = await APIAdapter.callWithFallback(sys, user, {maxTokens:500});
    var m = res.match(/\{[\s\S]*\}/);
    if(m){
      var obj = JSON.parse(m[0]);
      var groups = obj.groups || [];
      var assigned = new Array(scenes.length).fill(null);
      groups.forEach(function(group, imgIdx){
        var img = images[imgIdx];
        if(!img) return;
        group.forEach(function(sceneIdx){
          if(sceneIdx >= 0 && sceneIdx < scenes.length) assigned[sceneIdx] = img;
        });
      });
      s3.finalImages = assigned;
      STUDIO.project.s3 = s3; studioSave(); renderStudio();
      if(typeof ucShowToast==='function') ucShowToast('✅ AI 유사도 배정 완료','success');
    }
  } catch(e){ console.warn('유사도 배정 실패:', e.message); }
}

/* ── 스톡 영상/이미지 검색 시스템 ── */

/* 무료 스톡 API 목록 */
var STOCK_APIS = [
  { id:'pexels',    name:'Pexels',    type:'both',  free:true,  url:'https://api.pexels.com/v1/',          keyName:'uc_pexels_key',    badge:'무료·상업OK' },
  { id:'pixabay',   name:'Pixabay',   type:'both',  free:true,  url:'https://pixabay.com/api/',            keyName:'uc_pixabay_key',   badge:'무료·상업OK' },
  { id:'unsplash',  name:'Unsplash',  type:'image', free:true,  url:'https://api.unsplash.com/',           keyName:'uc_unsplash_key',  badge:'이미지전용'  },
  { id:'coverr',    name:'Coverr',    type:'video', free:true,  url:'https://coverr.co/api/v2/',           keyName:'uc_coverr_key',    badge:'영상전용'    },
  { id:'videvo',    name:'Videvo',    type:'video', free:false, url:'https://www.videvo.net/api/',         keyName:'uc_videvo_key',    badge:'일부유료'    },
];

/* 스톡 검색 UI */
function studioS3StockBar(){
  var s3 = STUDIO.project.s3 || {};
  var stockApi = s3.stockApi || 'pexels';
  var stockType = s3.stockType || 'both';

  return '<div style="background:#f0f7ff;border:1.5px solid #90c8f0;border-radius:14px;padding:14px;margin-bottom:14px">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
      '<div style="font-size:13px;font-weight:900">🎬 스톡 이미지·영상 검색</div>' +
      '<div style="font-size:11px;color:#4a90c4;font-weight:700">무료 상업용 가능</div>' +
    '</div>' +

    /* API 선택 */
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' +
    STOCK_APIS.map(function(a){
      var on = stockApi === a.id;
      var typeIcon = a.type==='both'?'📷🎬':a.type==='image'?'📷':'🎬';
      return '<button onclick="studioS3SetStockApi(\''+a.id+'\')" style="'+
        'border:2px solid '+(on?'#4a90c4':'#cce0f0')+';'+
        'background:'+(on?'#e8f4ff':'#fff')+';'+
        'border-radius:10px;padding:7px 11px;cursor:pointer;font-family:inherit;'+
        'transition:.15s;text-align:left;">' +
        '<div style="font-size:12px;font-weight:800;color:'+(on?'#2271b1':'var(--text)')+'">'+typeIcon+' '+a.name+'</div>'+
        '<div style="font-size:10px;color:'+(a.free?'#27ae60':'#e67e22')+'">'+a.badge+'</div>'+
      '</button>';
    }).join('') +
    '</div>' +

    /* API 키 상태 + 설정 버튼 */
    (function(){var stKeyStatus=(typeof ucApiKeyStatus==='function')?ucApiKeyStatus(stockApi):{ok:false,label:'확인불가'};return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:8px 12px;background:#f8f8f8;border-radius:8px">' +'<span style="font-size:12px;font-weight:700;color:'+(stKeyStatus.ok?'#27ae60':'#e74c3c')+'">'+stKeyStatus.label+'</span>' +'<span style="font-size:12px;color:var(--sub)">'+stockApi+' API 키</span>' +'<button onclick="renderApiSettings()" style="margin-left:auto;border:none;background:var(--pink);color:#fff;border-radius:999px;padding:5px 12px;font-size:11px;font-weight:700;cursor:pointer">⚙️ 키 설정</button>' +'</div>';})() +

    /* 검색창 */
    '<div style="display:flex;gap:6px;margin-bottom:8px">' +
      '<input id="s3-stock-query" class="studio-in" style="flex:1;font-size:12px" '+
        'placeholder="검색어 입력 (한국어 OK → 자동 번역)">' +
      '<select id="s3-stock-type" onchange="studioS3SetStockType(this.value)" '+
        'style="border:1.5px solid var(--line);border-radius:8px;padding:6px;font-size:12px">' +
        '<option value="image" '+(stockType==='image'?'selected':'')+'>이미지</option>' +
        '<option value="video" '+(stockType==='video'?'selected':'')+'>영상</option>' +
        '<option value="both"  '+(stockType==='both'?'selected':'')+'>전부</option>' +
      '</select>' +
      '<button onclick="studioS3StockSearch()" class="studio-btn pri" style="font-size:12px;white-space:nowrap">🔍 검색</button>' +
    '</div>' +

    /* 검색 결과 */
    '<div id="s3-stock-results" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:300px;overflow-y:auto"></div>' +
  '</div>';
}

/* API 무료 발급 URL */
function studioS3StockSignupUrl(api){
  var urls = {
    pexels:   'https://www.pexels.com/api/',
    pixabay:  'https://pixabay.com/api/docs/',
    unsplash: 'https://unsplash.com/developers',
    coverr:   'https://coverr.co/developers',
    videvo:   'https://www.videvo.net/api/',
  };
  return urls[api] || '#';
}

/* 스톡 API 선택 */
function studioS3SetStockApi(api){
  var s3 = STUDIO.project.s3 || {};
  s3.stockApi = api;
  STUDIO.project.s3 = s3;
  studioSave(); renderStudio();
}

/* 스톡 타입 선택 */
function studioS3SetStockType(type){
  var s3 = STUDIO.project.s3 || {};
  s3.stockType = type;
  STUDIO.project.s3 = s3;
  studioSave();
}

/* 스톡 API 키 저장 */
function studioS3SaveStockKey(){
  var key = document.getElementById('s3-stock-key')?.value || '';
  var s3 = STUDIO.project.s3 || {};
  var api = s3.stockApi || 'pexels';
  var keyName = STOCK_APIS.find(function(a){ return a.id===api; })?.keyName || 'uc_pexels_key';
  localStorage.setItem(keyName, key);
  if(typeof ucShowToast==='function') ucShowToast('✅ '+api+' 키 저장됨','success');
}

/* 스톡 검색 실행 */
async function studioS3StockSearch(){
  var query  = document.getElementById('s3-stock-query')?.value || '';
  var type   = document.getElementById('s3-stock-type')?.value || 'image';
  var s3     = STUDIO.project.s3 || {};
  var api    = s3.stockApi || 'pexels';
  var keyName = STOCK_APIS.find(function(a){ return a.id===api; })?.keyName || 'uc_pexels_key';
  var key    = localStorage.getItem(keyName) || '';
  var out    = document.getElementById('s3-stock-results');

  if(!query){ alert('검색어를 입력해주세요'); return; }
  if(!key){   alert(api+' API 키를 입력해주세요 (무료 발급 버튼 클릭)'); return; }
  if(!out) return;

  /* 한국어 → 영어 번역 */
  var engQuery = query;
  try {
    var transRes = await APIAdapter.callWithFallback(
      'Translate Korean to English. Output English only, no explanation.',
      query, {maxTokens:50}
    );
    if(transRes && transRes.trim()) engQuery = transRes.trim();
  } catch(e){ /* 번역 실패 시 원문 사용 */ }

  out.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#4a90c4;font-size:12px">🔍 검색 중...</div>';

  try {
    var results = [];

    if(api === 'pexels'){
      if(type === 'video' || type === 'both'){
        var r = await fetch('https://api.pexels.com/videos/search?query='+encodeURIComponent(engQuery)+'&per_page=9', {
          headers:{'Authorization': key}
        });
        var d = await r.json();
        (d.videos||[]).forEach(function(v){
          results.push({
            type: 'video',
            thumb: v.image,
            url: v.video_files?.[0]?.link || '',
            credit: v.user?.name || 'Pexels',
            creditUrl: v.url || '#',
          });
        });
      }
      if(type === 'image' || type === 'both'){
        var r2 = await fetch('https://api.pexels.com/v1/search?query='+encodeURIComponent(engQuery)+'&per_page=9', {
          headers:{'Authorization': key}
        });
        var d2 = await r2.json();
        (d2.photos||[]).forEach(function(p){
          results.push({
            type: 'image',
            thumb: p.src?.medium || '',
            url:   p.src?.large  || '',
            credit: p.photographer || 'Pexels',
            creditUrl: p.photographer_url || '#',
          });
        });
      }
    }

    else if(api === 'pixabay'){
      var pType = type==='video'?'&video_type=film':'';
      var pApi  = type==='video'?'https://pixabay.com/api/videos/':'https://pixabay.com/api/';
      var r3 = await fetch(pApi+'?key='+key+'&q='+encodeURIComponent(engQuery)+'&per_page=12&safesearch=true'+pType);
      var d3 = await r3.json();
      (d3.hits||[]).forEach(function(h){
        results.push({
          type: type==='video'?'video':'image',
          thumb: type==='video'?(h.videos?.tiny?.thumbnail||''):(h.previewURL||''),
          url:   type==='video'?(h.videos?.medium?.url||''):(h.largeImageURL||''),
          credit: h.user || 'Pixabay',
          creditUrl: h.pageURL || '#',
        });
      });
    }

    else if(api === 'unsplash'){
      var r4 = await fetch('https://api.unsplash.com/search/photos?query='+encodeURIComponent(engQuery)+'&per_page=12&client_id='+key);
      var d4 = await r4.json();
      (d4.results||[]).forEach(function(p){
        results.push({
          type: 'image',
          thumb: p.urls?.small || '',
          url:   p.urls?.regular || '',
          credit: p.user?.name || 'Unsplash',
          creditUrl: p.user?.links?.html || '#',
        });
      });
    }

    if(!results.length){
      out.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#bbb;font-size:12px">검색 결과가 없어요. 다른 검색어를 시도해보세요.</div>';
      return;
    }

    out.innerHTML = results.slice(0,12).map(function(item, idx){
      var typeIcon = item.type==='video'?'🎬':'📷';
      return '<div style="border:1px solid #dde8f0;border-radius:10px;overflow:hidden;cursor:pointer;position:relative" '+
        'onclick="studioS3StockUse('+idx+')" data-idx="'+idx+'">' +
        (item.type==='video'
          ? '<div style="background:#000;height:90px;display:flex;align-items:center;justify-content:center;position:relative">'+
              (item.thumb?'<img src="'+item.thumb+'" style="width:100%;height:90px;object-fit:cover;opacity:0.7">':'')+
              '<span style="position:absolute;font-size:24px">▶</span></div>'
          : '<img src="'+item.thumb+'" style="width:100%;height:90px;object-fit:cover;display:block">') +
        '<div style="padding:5px 6px;background:#fff">' +
          '<div style="font-size:10px;color:#4a90c4;font-weight:700">'+typeIcon+' '+item.credit+'</div>' +
          '<button onclick="event.stopPropagation();studioS3StockApply('+idx+',null)" style="'+
            'width:100%;margin-top:4px;border:none;background:#4a90c4;color:#fff;'+
            'border-radius:6px;padding:4px;font-size:10px;font-weight:700;cursor:pointer">'+
            '씬에 적용</button>' +
        '</div>' +
      '</div>';
    }).join('');

    /* 결과 저장 */
    s3._stockResults = results;
    STUDIO.project.s3 = s3;

    if(typeof ucShowToast==='function') ucShowToast('✅ '+results.length+'개 결과 (번역: "'+engQuery+'")','success');

  } catch(e){
    out.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:red;font-size:12px">❌ 오류: '+e.message+'</div>';
  }
}

/* 스톡 결과 씬에 적용 */
function studioS3StockApply(resultIdx, sceneIdx){
  var s3 = STUDIO.project.s3 || {};
  var results = s3._stockResults || [];
  var item = results[resultIdx];
  if(!item){ alert('검색 결과를 먼저 불러와주세요'); return; }

  s3.images = s3.images || [];
  s3.adopted = s3.adopted || [];

  /* sceneIdx가 null이면 빈 씬에 자동 배정 */
  var idx = sceneIdx;
  if(idx === null || idx === undefined){
    idx = s3.images.findIndex(function(img){ return !img; });
    if(idx === -1) idx = 0;
  }

  s3.images[idx] = item.type==='video' ? item.thumb : item.url;
  s3.stockVideos = s3.stockVideos || [];
  if(item.type === 'video') s3.stockVideos[idx] = item.url;
  s3.adopted[idx] = true;

  /* 출처 저장 (저작권 표시용) */
  s3.credits = s3.credits || [];
  s3.credits[idx] = { name: item.credit, url: item.creditUrl, type: item.type };

  STUDIO.project.s3 = s3;
  studioSave();
  renderStudio();
  if(typeof ucShowToast==='function') ucShowToast('✅ 씬'+(idx+1)+'에 '+item.type+' 적용됨 · 출처: '+item.credit,'success');
}

/* 스톡 결과 팝업에서 씬 선택 */
function studioS3StockUse(resultIdx){
  var s3 = STUDIO.project.s3 || {};
  var scenes = s3.scenes || [];
  if(!scenes.length){ studioS3StockApply(resultIdx, null); return; }

  /* 씬 선택 팝업 */
  var existing = document.getElementById('stock-scene-picker');
  if(existing) existing.remove();

  var picker = document.createElement('div');
  picker.id = 'stock-scene-picker';
  picker.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);'+
    'background:#fff;border-radius:16px;padding:20px;z-index:10000;'+
    'box-shadow:0 8px 40px rgba(0,0,0,0.2);max-height:60vh;overflow-y:auto;min-width:280px';

  picker.innerHTML = '<div style="font-size:14px;font-weight:900;margin-bottom:12px">어느 씬에 적용할까요?</div>'+
    '<div style="display:flex;flex-direction:column;gap:6px">' +
    scenes.map(function(sc,i){
      return '<button onclick="studioS3StockApply('+resultIdx+','+i+');document.getElementById(\'stock-scene-picker\').remove()" '+
        'style="border:1.5px solid #dde8f0;background:#fff;border-radius:8px;padding:8px 12px;'+
        'cursor:pointer;text-align:left;font-size:12px;font-weight:700">' +
        '씬'+(i+1)+' — '+sc.label+'</button>';
    }).join('') +
    '<button onclick="document.getElementById(\'stock-scene-picker\').remove()" '+
      'style="border:none;background:#eee;border-radius:8px;padding:8px;cursor:pointer;font-size:12px;margin-top:4px">취소</button>' +
    '</div>';

  document.body.appendChild(picker);
}


