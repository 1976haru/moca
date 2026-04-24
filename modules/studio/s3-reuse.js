/* modules/studio/s3-reuse.js -- 이미지 절약/재사용 시스템 */

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
