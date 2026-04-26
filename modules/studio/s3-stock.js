/* modules/studio/s3-stock.js -- 스톡 영상/이미지 검색 시스템 */

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
  /* 통합 store(stock 그룹) 우선, legacy uc_*_key fallback */
  var key = '';
  if (typeof window.getApiProvider === 'function') {
    var prov = window.getApiProvider('stock', api);
    if (prov && prov.apiKey) key = prov.apiKey;
  }
  if (!key) {
    var keyName = STOCK_APIS.find(function(a){ return a.id===api; })?.keyName || 'uc_pexels_key';
    key = localStorage.getItem(keyName) || '';
  }
  try { console.log('[api] stock provider:', api, key ? 'ready' : 'missing'); } catch(_) {}
  var out    = document.getElementById('s3-stock-results');

  if(!query){ alert('검색어를 입력해주세요'); return; }
  if(!key){
    if (confirm(api+' API 키가 없습니다. 통합 API 설정(스톡 탭)을 열까요?')) {
      if (typeof window.openApiSettingsModal === 'function') window.openApiSettingsModal('stock');
    }
    return;
  }
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
