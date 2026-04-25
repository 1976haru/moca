/* ================================================
   s3-image.js
   STEP3 image / art-style / scene-gen / stock-search / image-reuse
   modules/studio/ -- split_studio2.py
   + 소스 탭(이미지/영상프롬프트/직접업로드) 라우팅
   ================================================ */

/* ── 소스 탭 상태 ── */
let _s3SourceTab = 'image'; // 'image' | 'video' | 'upload'

/* ═════════════ STEP 3 이미지·영상 소스 ═════════════ */
function _studioS3(){
  const p  = STUDIO.project;
  const s3 = p.s3 || {};
  const s2 = p.s2 || {};
  const script = s2.scriptKo || s2.scriptJa || p.script || '';
  const scenes = s3.scenes || _studioS3ParseScenes(script);
  if(!s3.scenes){ s3.scenes = scenes; STUDIO.project.s3 = s3; }

  /* 소스 탭 헤더 (이미지/영상프롬프트/직접업로드) */
  const tabsHtml =
    '<div class="s3-source-tabs">' +
      '<button class="s3-src-tab' + (_s3SourceTab==='image'?' on':'') + '" onclick="window._s3SetSourceTab(\'image\')">🖼 이미지 생성</button>' +
      '<button class="s3-src-tab' + (_s3SourceTab==='video'?' on':'') + '" onclick="window._s3SetSourceTab(\'video\')">🎬 영상 프롬프트</button>' +
      '<button class="s3-src-tab' + (_s3SourceTab==='upload'?' on':'') + '" onclick="window._s3SetSourceTab(\'upload\')">📁 직접 업로드</button>' +
    '</div>';

  /* 비-image 모드: s3-video.js 가 _studioBindS3 에서 wrap 채움 */
  if(_s3SourceTab !== 'image'){
    return '<div class="studio-panel">' + tabsHtml + '<div id="studioS3VideoWrap"></div></div>';
  }

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

  return '<div class="studio-panel">' + tabsHtml +

    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">' +
      '<div><h4 style="margin:0 0 2px">② 이미지·영상 소스</h4><div style="font-size:12px;color:var(--sub)">씬별 이미지 + 썸네일 · 내 사진 업로드 가능</div></div>' +
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

function _studioBindS3(){
  _s3InjectSourceTabCSS();
  if(_s3SourceTab !== 'image' && typeof _studioS3Video === 'function'){
    _studioS3Video('studioS3VideoWrap');
    if(_s3SourceTab === 'upload' && typeof _s3vSetTab === 'function'){
      _s3vSetTab('c', 'studioS3VideoWrap');
    }
  }
}

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

  /* IntentSystem 의도 반영 (있을 때만, 실패해도 기존 동작 유지) */
  if (typeof IntentSystem !== 'undefined' && IntentSystem.buildSystemPrompt) {
    try {
      var intentCtx = IntentSystem.buildSystemPrompt(
        (sc.label||'') + ' ' + script.slice(0,100),
        { lengthHint: '50 words or less in English' }
      );
      if (intentCtx && typeof intentCtx === 'string') {
        sys = intentCtx + '\n\n' + sys;
      }
    } catch(_) { /* fallback: sys 변경 없음 */ }
  }

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
  var src = STUDIO.project.sources||{};
  var mode = src.mode || 'image';
  if(mode === 'video_prompt' && !(src.videoPrompts||[]).length){
    if(!confirm('영상 프롬프트가 없어요. 그냥 넘어갈까요?')) return;
  } else if(mode === 'upload' && !(src.uploadedFiles||[]).length){
    if(!confirm('업로드된 파일이 없어요. 그냥 넘어갈까요?')) return;
  } else if(mode === 'image'){
    var hasImg = (s3.images||[]).some(function(i){ return !!i; });
    if(!hasImg && !confirm('이미지 없이 다음 단계로 진행할까요?')) return;
  }
  STUDIO.project.step = 3;
  studioSave(); renderStudio();
  window.scrollTo({top:0,behavior:'smooth'});
}

/* 하위 호환 */
async function studioS3GenScenes(){ studioS3GenAll(); }
async function studioS3GenThumbs(){ studioS3GenThumb('A'); }
function studioS3Regen(i){ studioS3RegenScene(i); }

/* ── 소스 탭 전환 ── */
window._s3SetSourceTab = function(tab){
  _s3SourceTab = tab;
  if(typeof STUDIO !== 'undefined' && STUDIO.project){
    if(!STUDIO.project.sources){
      STUDIO.project.sources = { mode:'image', images:[], videoPrompts:[], uploadedFiles:[],
        externalTool:{ name:'invideo', prompt:'', outputVideo:null } };
    }
    STUDIO.project.sources.mode =
      tab === 'image' ? 'image' : tab === 'video' ? 'video_prompt' : 'upload';
    if(typeof studioSave === 'function') studioSave();
  }
  if(typeof renderStudio === 'function') renderStudio();
};

function _s3InjectSourceTabCSS(){
  if(document.getElementById('s3-src-tab-style')) return;
  const st = document.createElement('style');
  st.id = 's3-src-tab-style';
  st.textContent = `
.s3-source-tabs{display:flex;gap:6px;margin-bottom:14px}
.s3-src-tab{flex:1;padding:10px;border:2px solid var(--line);border-radius:12px;
  background:#fff;font-size:13px;font-weight:800;color:var(--sub);cursor:pointer;transition:.14s}
.s3-src-tab:hover{border-color:var(--pink)}
.s3-src-tab.on{background:linear-gradient(135deg,#ef6fab,#9181ff);
  color:#fff;border-color:transparent}
`;
  document.head.appendChild(st);
}


