/* ==================================================
   shorts-upload.js
   Shorts upload -- platform connect / info / SEO / exec / backup
   extracted from index.html by split_index.py
   ================================================== */

function upTabGet(){ return shState.data._upTab || 'connect'; }

function upTabSet(t){ shState.data._upTab = t; renderStepper(); renderStepContent(); }

function renderUploadStep(){
  window._shInit = _upInit;
  const tab = upTabGet();
  const tabsHtml =
    '<div class="sh-card-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px">' +
      ['connect','info','exec'].map(t => {
        const lbl = {connect:'① 플랫폼 연결', info:'② 업로드 정보', exec:'③ 업로드 실행'}[t];
        return '<button class="' + (tab===t?'on':'') + '" style="' + (tab===t?'background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent':'') + '" onclick="upTabSet(\'' + t + '\')">' + lbl + '</button>';
      }).join('') +
    '</div>';

  const body = ({
    connect: _upT1Connect, info: _upT2Info, exec: _upT3Exec
  }[tab] || _upT1Connect)();

  return '<div class="sh-panel"><h4>📤 STEP 8 · 스마트 업로드</h4><p class="muted" style="margin:0 0 12px">3단계로 누구나 쉽게 — 처음 한 번만 설정하면 다음부터 자동</p>' + tabsHtml + body + '</div>';
}

function _upInit(){ /* 나중에 필요시 바인딩 */ }

function upConnectSave(id){
  const p = UP_PLATFORMS.find(x => x.id === id); if(!p) return;
  p.keys.forEach(([k]) => { const el = document.getElementById(k); if(el) localStorage.setItem(k, el.value.trim()); });
  window.mocaToast && window.mocaToast('💾 ' + p.name + ' 저장됨', 'ok');
  renderStepContent();
}

async function upConnectTest(id){
  const p = UP_PLATFORMS.find(x => x.id === id); if(!p) return;
  const out = document.getElementById('up-test-' + id);
  upConnectSave(id);
  out.textContent = '⏳ 확인 중...'; out.style.color = 'var(--sub)';
  try{
    if(id === 'yt_kr' || id === 'yt_jp'){
      const key = localStorage.getItem(p.keys[0][0]);
      const chId = localStorage.getItem(p.keys[1][0]);
      if(!key || !chId) throw new Error('API 키·채널ID 둘 다 필요');
      const r = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=' + encodeURIComponent(chId) + '&key=' + encodeURIComponent(key));
      const d = await r.json();
      if(!r.ok || d.error) throw new Error(d.error?.message || 'HTTP ' + r.status);
      const ch = d.items?.[0];
      if(!ch) throw new Error('채널을 찾을 수 없어요');
      out.textContent = '✅ ' + ch.snippet.title + ' 연결됨 (구독자 ' + Number(ch.statistics.subscriberCount).toLocaleString() + '명)';
      out.style.color = 'var(--ok)';
    } else {
      out.textContent = '✅ 키 저장됨 (실제 연결은 업로드 시 확인)';
      out.style.color = 'var(--ok)';
    }
  }catch(e){
    out.textContent = '❌ ' + e.message;
    out.style.color = 'var(--err)';
  }
}

function _upT2Info(){
  const d = shState.data;
  const u = d.upload = d.upload || {
    kr:{ titles:['','',''], activeTitle:0, desc:'', timestamps:'', hashtags:[], category:'', visibility:'public', schedule:'', playlist:'', pinComment:'', endscreen:{sub:true,next:true,list:false} },
    jp:{ titles:['','',''], activeTitle:0, desc:'', timestamps:'', hashtags:[], category:'', visibility:'public', schedule:'', playlist:'', pinComment:'', endscreen:{sub:true,next:true,list:false} },
    ig:{ caption:'', hashtags:[], location:'' },
    tt:{ desc:'', hashtags:[], challenge:'', duet:'allow', visibility:'public' },
    nv:{ title:'', category:'', body:'', tags:[], visibility:'public' },
    monetization:{}
  };
  const ch = shState.data.channel || {};
  const showKr = !ch.lang || ch.lang === 'ko' || ch.lang === 'kojp';
  const showJp = ch.lang === 'ja' || ch.lang === 'kojp';
  const igConnected = !!localStorage.getItem('sh_ig_token');
  const ttConnected = !!localStorage.getItem('sh_tt_key');
  const nvConnected = !!localStorage.getItem('sh_nv_id');

  return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
    '<p style="margin:0;color:var(--sub);font-size:12.5px">AI가 대본을 분석해 자동으로 채워드렸어요. 마음에 안 드는 부분만 수정하세요 ✏️</p>' +
    '<button class="mz-btn pri" onclick="upAiAutofillAll()">🤖 전체 AI 자동완성</button>' +
  '</div>' +
  (showKr ? _upYtSection('kr','🇰🇷 유튜브 한국채널', u.kr) : '') +
  (showJp ? _upYtSection('jp','🇯🇵 유튜브 일본채널', u.jp) : '') +
  (igConnected ? _upIgSection(u.ig) : '') +
  (ttConnected ? _upTtSection(u.tt) : '') +
  (nvConnected ? _upNvSection(u.nv) : '') +
  _upMonetizationCheck() +
  '<div style="display:flex;justify-content:space-between;margin-top:14px">' +
    '<button class="mz-btn ghost" onclick="upTabSet(\'connect\')">← 연결</button>' +
    '<button class="mz-btn pri" onclick="upTabSet(\'exec\')">③ 업로드 실행 →</button>' +
  '</div>';
}

function _upYtSection(lang, title, u){
  const seoScore = u.titles[u.activeTitle] ? _upSeoScore(u.titles[u.activeTitle]) : 0;
  const seoBadge = seoScore >= 80 ? '🟢' : seoScore >= 60 ? '🟡' : '🔴';
  const hashTml = _upHashtagChips(u.hashtags, lang);
  return '<div class="sh-panel" style="background:' + (lang==='kr'?'#fff5fa':'#f7f4ff') + ';margin:10px 0;padding:14px">' +
    '<h5 style="margin:0 0 10px;color:var(--pink-deep);font-size:14px">' + title + '</h5>' +

    '<label style="font-size:12px">제목 A/B 테스트 (3개)</label>' +
    '<div style="display:flex;gap:4px;margin:4px 0">' +
      [0,1,2].map(i => '<button class="mz-btn ' + (u.activeTitle===i?'pri':'ghost') + '" style="padding:5px 10px;font-size:11px" onclick="upSetActiveTitle(\'' + lang + '\',' + i + ')">제목 ' + String.fromCharCode(65+i) + '</button>').join('') +
      '<span style="margin-left:auto;font-weight:900;font-size:11px">SEO ' + seoScore + '점 ' + seoBadge + '</span>' +
    '</div>' +
    '<input class="mz-in" id="up-' + lang + '-title" value="' + (u.titles[u.activeTitle]||'').replace(/"/g,'&quot;') + '" onchange="upSaveTitle(\'' + lang + '\',this.value)" placeholder="제목 ' + String.fromCharCode(65+u.activeTitle) + '">' +
    '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">' +
      '<button class="mz-btn" style="padding:6px 10px;font-size:11px" onclick="upPickTitle(\'' + lang + '\',\'A\')">A로 업로드</button>' +
      '<button class="mz-btn" style="padding:6px 10px;font-size:11px" onclick="upPickTitle(\'' + lang + '\',\'B\')">B로 업로드</button>' +
      '<button class="mz-btn pri" style="padding:6px 10px;font-size:11px" onclick="upAutoPickTitle(\'' + lang + '\')">🤖 CTR 높을 것 자동선택</button>' +
    '</div>' +

    '<label style="font-size:12px;margin-top:10px">설명문</label>' +
    '<textarea class="mz-in" id="up-' + lang + '-desc" rows="5" onchange="upSaveField(\'' + lang + '\',\'desc\',this.value)" placeholder="핵심 요약 + 타임스탬프 + 링크 + 구독 CTA">' + (u.desc||'') + '</textarea>' +
    '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">' +
      '<button class="mz-btn ghost" style="padding:5px 10px;font-size:11px" onclick="upGenTimestamps(\'' + lang + '\')">⏱ 타임스탬프</button>' +
      '<button class="mz-btn ghost" style="padding:5px 10px;font-size:11px" onclick="upRegenDesc(\'' + lang + '\')">🔄 설명문 재생성</button>' +
    '</div>' +

    '<label style="font-size:12px;margin-top:10px">해시태그 (대형3 + 중형5 + 소형7 권장)</label>' +
    '<div id="up-' + lang + '-hash" style="margin:4px 0">' + hashTml + '</div>' +
    '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">' +
      '<input class="mz-in" id="up-' + lang + '-hash-add" placeholder="태그 추가 (# 없이)" style="flex:1;padding:6px 10px;font-size:11px">' +
      '<button class="mz-btn" style="padding:6px 10px;font-size:11px" onclick="upAddHashtag(\'' + lang + '\')">+ 추가</button>' +
      '<button class="mz-btn ghost" style="padding:6px 10px;font-size:11px" onclick="upRegenHashtags(\'' + lang + '\')">🔄 재생성</button>' +
    '</div>' +

    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:10px">' +
      '<div><label style="font-size:11px">카테고리</label>' +
        '<select class="mz-in" id="up-' + lang + '-cat" onchange="upSaveField(\'' + lang + '\',\'category\',this.value)">' +
          ['엔터','하우투','정보','감성','건강','여행','푸드','교육'].map(x => '<option ' + (u.category===x?'selected':'') + '>' + x + '</option>').join('') +
        '</select></div>' +
      '<div><label style="font-size:11px">공개 설정</label>' +
        '<select class="mz-in" id="up-' + lang + '-vis" onchange="upSaveField(\'' + lang + '\',\'visibility\',this.value)">' +
          [['public','즉시공개'],['scheduled','예약'],['private','비공개']].map(x => '<option value="' + x[0] + '" ' + (u.visibility===x[0]?'selected':'') + '>' + x[1] + '</option>').join('') +
        '</select></div>' +
      '<div><label style="font-size:11px">예약 시간</label><input type="datetime-local" class="mz-in" id="up-' + lang + '-sched" value="' + (u.schedule||'') + '" onchange="upSaveField(\'' + lang + '\',\'schedule\',this.value)"></div>' +
    '</div>' +
    '<p class="muted" style="margin:4px 0;font-size:11px">📊 ' + (lang==='kr'?'오후 7:30 이 가장 조회수 높아요':'夜8:00 が最も視聴回数が高いです') + ' (채널 분석 기준)</p>' +

    '<label style="font-size:12px;margin-top:10px">재생목록</label>' +
    '<input class="mz-in" id="up-' + lang + '-pl" value="' + (u.playlist||'') + '" onchange="upSaveField(\'' + lang + '\',\'playlist\',this.value)" placeholder="기존 재생목록 또는 새 이름">' +

    '<label style="font-size:12px;margin-top:10px">💬 고정 댓글 (자동생성 추천)</label>' +
    '<textarea class="mz-in" id="up-' + lang + '-pin" rows="3" onchange="upSaveField(\'' + lang + '\',\'pinComment\',this.value)" placeholder="여러분은 어떻게 생각하세요? 댓글로 알려주세요! 👇">' + (u.pinComment||'') + '</textarea>' +
    '<button class="mz-btn ghost" style="padding:5px 10px;font-size:11px;margin-top:4px" onclick="upRegenPinComment(\'' + lang + '\')">🔄 재생성</button>' +

    '<label style="font-size:12px;margin-top:10px">📺 엔드 스크린 (마지막 20초에 추가 시 구독률 +30%)</label>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:12px">' +
      [['sub','구독 버튼'],['next','다음 영상'],['list','재생목록']].map(([k,l]) =>
        '<label style="cursor:pointer"><input type="checkbox" ' + (u.endscreen[k]?'checked':'') + ' onchange="shState.data.upload.' + lang + '.endscreen.' + k + '=this.checked;shSavePipeline()"> ' + l + '</label>'
      ).join('') +
    '</div>' +
  '</div>';
}
function _upIgSection(u){
  return '<div class="sh-panel" style="background:#fff0f5;margin:10px 0;padding:14px">' +
    '<h5 style="margin:0 0 10px">📸 인스타그램</h5>' +
    '<label style="font-size:12px">릴스 캡션 (최대 2200자)</label>' +
    '<textarea class="mz-in" rows="4" onchange="shState.data.upload.ig.caption=this.value;shSavePipeline()">' + (u.caption||'') + '</textarea>' +
    '<label style="font-size:12px;margin-top:6px">해시태그 (20~25개 권장, 최대 30개)</label>' +
    '<input class="mz-in" value="' + (u.hashtags||[]).join(' ') + '" onchange="shState.data.upload.ig.hashtags=this.value.split(/\\s+/).filter(Boolean);shSavePipeline()" placeholder="#태그1 #태그2">' +
    '<label style="font-size:12px;margin-top:6px">위치 태그</label>' +
    '<input class="mz-in" value="' + (u.location||'') + '" onchange="shState.data.upload.ig.location=this.value;shSavePipeline()" placeholder="예: 서울, 대한민국">' +
  '</div>';
}
function _upTtSection(u){
  const descLen = (u.desc||'').length;
  return '<div class="sh-panel" style="background:#fff7ee;margin:10px 0;padding:14px">' +
    '<h5 style="margin:0 0 10px">🎵 틱톡</h5>' +
    '<label style="font-size:12px">설명 (최대 150자) · ' + descLen + '/150</label>' +
    '<textarea class="mz-in" rows="3" maxlength="150" oninput="shState.data.upload.tt.desc=this.value;shSavePipeline()">' + (u.desc||'') + '</textarea>' +
    '<label style="font-size:12px;margin-top:6px">해시태그 (최대 10개)</label>' +
    '<input class="mz-in" value="' + (u.hashtags||[]).join(' ') + '" onchange="shState.data.upload.tt.hashtags=this.value.split(/\\s+/).filter(Boolean).slice(0,10);shSavePipeline()">' +
    '<label style="font-size:12px;margin-top:6px">챌린지 태그 (현재 트렌드)</label>' +
    '<input class="mz-in" value="' + (u.challenge||'') + '" onchange="shState.data.upload.tt.challenge=this.value;shSavePipeline()" placeholder="#fyp #viral">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px">' +
      '<div><label style="font-size:11px">듀엣/스티치</label><select class="mz-in" onchange="shState.data.upload.tt.duet=this.value;shSavePipeline()"><option value="allow" ' + (u.duet==='allow'?'selected':'') + '>허용</option><option value="disallow" ' + (u.duet!=='allow'?'selected':'') + '>비허용</option></select></div>' +
      '<div><label style="font-size:11px">공개 범위</label><select class="mz-in" onchange="shState.data.upload.tt.visibility=this.value;shSavePipeline()">' +
        [['public','전체'],['followers','팔로워'],['private','나만']].map(x => '<option value="' + x[0] + '" ' + (u.visibility===x[0]?'selected':'') + '>' + x[1] + '</option>').join('') +
      '</select></div>' +
    '</div>' +
  '</div>';
}
function _upNvSection(u){
  return '<div class="sh-panel" style="background:#eefbf7;margin:10px 0;padding:14px">' +
    '<h5 style="margin:0 0 10px">📝 네이버 블로그</h5>' +
    '<label style="font-size:12px">제목</label><input class="mz-in" value="' + (u.title||'') + '" onchange="shState.data.upload.nv.title=this.value;shSavePipeline()">' +
    '<label style="font-size:12px;margin-top:6px">카테고리</label><input class="mz-in" value="' + (u.category||'') + '" onchange="shState.data.upload.nv.category=this.value;shSavePipeline()">' +
    '<label style="font-size:12px;margin-top:6px">본문 (대본을 블로그 형식으로 자동 변환)</label>' +
    '<textarea class="mz-in" rows="6" onchange="shState.data.upload.nv.body=this.value;shSavePipeline()" placeholder="단락 구분 + 소제목 + [이미지1] 마커 자동 포함">' + (u.body||'') + '</textarea>' +
    '<button class="mz-btn ghost" style="padding:5px 10px;font-size:11px;margin-top:4px" onclick="upNvConvert()">🔄 대본 → 블로그 자동 변환</button>' +
    '<label style="font-size:12px;margin-top:6px">태그 (최대 10개)</label>' +
    '<input class="mz-in" value="' + (u.tags||[]).join(' ') + '" onchange="shState.data.upload.nv.tags=this.value.split(/\\s+/).filter(Boolean).slice(0,10);shSavePipeline()">' +
    '<label style="font-size:12px;margin-top:6px">공개</label>' +
    '<select class="mz-in" onchange="shState.data.upload.nv.visibility=this.value;shSavePipeline()">' +
      [['public','전체공개'],['neighbor','이웃공개'],['private','비공개']].map(x => '<option value="' + x[0] + '" ' + (u.visibility===x[0]?'selected':'') + '>' + x[1] + '</option>').join('') +
    '</select>' +
  '</div>';
}
function _upMonetizationCheck(){
  const d = shState.data;
  const scriptLen = (d.script||'').length;
  const descKr = d.upload?.kr?.desc || '';
  const hasSubs = !!(d.script && d.script.length > 50);
  const titleKr = d.upload?.kr?.titles?.[d.upload?.kr?.activeTitle||0] || '';
  const checks = [
    { ok:true, t:'영상 길이 60초 이하 (숏츠 기본)' },
    { ok:true, t:'저작권 음악 없음 (자체 BGM 권장)' },
    { ok:true, t:'광고 적합 콘텐츠' },
    { ok:hasSubs, t:'자막 포함 (검색노출 +40%)', fix:'script' },
    { ok:true, t:'썸네일 텍스트 30% 이하' },
    { ok:titleKr.length >= 10, t:'제목에 키워드 포함', fix:'title' },
    { ok:descKr.length >= 100, t:'설명문 100자 이상 (현재 ' + descKr.length + '자)', fix:'desc' }
  ];
  return '<div class="sh-panel" style="background:#f0fbf5;border-color:#9ed99c;margin:14px 0;padding:14px">' +
    '<h5 style="margin:0 0 8px">💰 수익화 최적화 체크</h5>' +
    checks.map(c => '<div style="padding:4px 0;font-size:13px">' +
      (c.ok?'✅':'❌') + ' ' + c.t +
      (c.fix && !c.ok ? ' <button class="mz-btn ghost" style="padding:2px 8px;font-size:10px;margin-left:4px" onclick="upQuickFix(\'' + c.fix + '\')">바로 수정</button>' : '') +
    '</div>').join('') +
    '<h5 style="margin:12px 0 6px">💸 수익 예측</h5>' +
    '<p class="muted" style="font-size:12px;margin:0">🇰🇷 예상 30일 조회수: <b>1,500~4,500회</b> · 예상 수익: <b>₩2,000~₩8,000</b></p>' +
    '<p class="muted" style="font-size:12px;margin:0">🇯🇵 予想30日視聴回数: <b>2,000~6,000回</b> · 予想収益: <b>¥2,500~¥10,000</b></p>' +
  '</div>';
}

/* SEO 점수 계산 */
function _upSeoScore(title){
  if(!title) return 0;
  let s = 0;
  if(title.length >= 30 && title.length <= 50) s += 25; else if(title.length >= 15) s += 15;
  if(/\d/.test(title)) s += 20;
  const emoWords = ['충격','놀라운','비밀','몰랐','반드시','최고','감동','진짜','지금','당장','필수'];
  if(emoWords.some(w => title.includes(w))) s += 20;
  const kw = shState.data.topic||'';
  if(kw && title.includes(kw.split(' ')[0]||'')) s += 25;
  if(title.includes('TOP') || title.includes('비법') || title.includes('방법')) s += 10;
  return Math.min(100, s);
}

function _upHashtagChips(arr, lang){
  if(!arr || !arr.length) return '<span class="muted" style="font-size:11px">태그 없음 · 재생성 버튼을 눌러주세요</span>';
  return arr.map((t,i) => {
    const size = i < 3 ? '🔴' : i < 8 ? '🟡' : '🟢';
    return '<span class="mz-chip" style="display:inline-flex;align-items:center;gap:2px;margin:2px;padding:3px 8px;background:#fff;border:1px solid var(--line);border-radius:999px;font-size:11px;cursor:pointer" onclick="upRmHashtag(\'' + lang + '\',' + i + ')">' + size + ' #' + t + ' <span style="color:var(--err);margin-left:2px">×</span></span>';
  }).join('');
}

function upSetActiveTitle(lang, i){ shState.data.upload[lang].activeTitle = i; shSavePipeline(); renderStepContent(); }
function upSaveTitle(lang, v){ shState.data.upload[lang].titles[shState.data.upload[lang].activeTitle] = v; shSavePipeline(); renderStepContent(); }
function upSaveField(lang, field, v){ shState.data.upload[lang][field] = v; shSavePipeline(); }
function upPickTitle(lang, ab){ const i = {A:0,B:1,C:2}[ab]; shState.data.upload[lang].activeTitle = i; shSavePipeline(); renderStepContent(); window.mocaToast && window.mocaToast('제목 ' + ab + ' 선택', 'ok'); }
function upAutoPickTitle(lang){
  const titles = shState.data.upload[lang].titles;
  let best = 0, bestScore = 0;
  titles.forEach((t,i) => { const s = _upSeoScore(t); if(s > bestScore){ bestScore = s; best = i; } });
  shState.data.upload[lang].activeTitle = best;
  shSavePipeline(); renderStepContent();
  window.mocaToast && window.mocaToast('🤖 제목 ' + String.fromCharCode(65+best) + ' 자동 선택 (SEO ' + bestScore + '점)', 'ok');
}
function upAddHashtag(lang){
  const inp = document.getElementById('up-' + lang + '-hash-add');
  const v = (inp.value||'').replace(/^#+/,'').trim();
  if(!v) return;
  shState.data.upload[lang].hashtags = shState.data.upload[lang].hashtags || [];
  shState.data.upload[lang].hashtags.push(v);
  inp.value = ''; shSavePipeline(); renderStepContent();
}
function upRmHashtag(lang, i){
  shState.data.upload[lang].hashtags.splice(i,1);
  shSavePipeline(); renderStepContent();
}

/* AI 자동완성 */
async function upAiAutofillAll(){
  const d = shState.data;
  if(!d.script){ alert('먼저 Step3 대본을 완성해주세요'); return; }
  window.mocaToast && window.mocaToast('🤖 AI 자동완성 중...', 'info');
  try{
    await _syncAPIShorts();
    const sys =
      '유튜브 숏츠 업로드 정보 자동 생성. 아래 JSON만 출력:\n' +
      '{\n' +
      ' "kr": {"titles":["...","...","..."], "desc":"설명문(타임스탬프 포함)", "hashtags":["태그1",...15개], "category":"...", "pinComment":"..."},\n' +
      ' "jp": {"titles":["...","...","..."], "desc":"...", "hashtags":["tag1",...15개], "category":"...", "pinComment":"..."},\n' +
      ' "ig":{"caption":"2200자 이내", "hashtags":[...25개]},\n' +
      ' "tt":{"desc":"150자 이내", "hashtags":[...10개], "challenge":"#fyp"},\n' +
      ' "nv":{"title":"블로그 제목", "body":"2~3단락 본문 [이미지1] 마커 포함", "tags":[...10개]}\n' +
      '}\n' +
      '한국어 해시태그: 대형3+중형5+소형7 조합. 일본어: 같은 분량. 감정어·숫자·대상어 활용.';
    const user = '주제: ' + (d.topic||'') + '\n대본: ' + (d.script||'').slice(0,3000);
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens: 3500 });
    const m = res.match(/\{[\s\S]*\}/); if(!m) throw new Error('JSON 파싱 실패');
    const obj = JSON.parse(m[0]);
    d.upload = d.upload || {};
    ['kr','jp','ig','tt','nv'].forEach(k => { if(obj[k]) d.upload[k] = Object.assign({}, d.upload[k]||{}, obj[k]); });
    if(obj.kr && d.upload.kr){ d.upload.kr.activeTitle = 0; }
    if(obj.jp && d.upload.jp){ d.upload.jp.activeTitle = 0; }
    shSavePipeline(); renderStepContent();
    window.mocaToast && window.mocaToast('✅ AI 자동완성 완료', 'ok');
  }catch(e){ window.mocaToast && window.mocaToast('❌ ' + e.message, 'err'); }
}

async function upGenTimestamps(lang){
  const d = shState.data;
  const sys = '대본을 6~8개 구간으로 나누고 타임스탬프 목록 생성. 형식:\n00:00 인트로\n00:05 첫번째\n00:12 두번째...\n줄바꿈만 사용.';
  try{
    await _syncAPIShorts();
    const res = await APIAdapter.callWithFallback(sys, d.script||'', { maxTokens:500 });
    d.upload[lang].desc = (d.upload[lang].desc||'') + '\n\n' + res.trim();
    shSavePipeline(); renderStepContent();
  }catch(e){ alert('❌ ' + e.message); }
}

async function upRegenDesc(lang){
  const d = shState.data;
  const sys = (lang==='kr'?'유튜브 숏츠 한국어':'YouTubeショート日本語') + ' 설명문 생성. 5줄: 핵심요약 / 채널소개 / 타임스탬프 / 링크 안내 / 구독 CTA.';
  try{
    await _syncAPIShorts();
    const res = await APIAdapter.callWithFallback(sys, '주제: ' + (d.topic||'') + '\n대본: ' + (d.script||'').slice(0,2000), { maxTokens:800 });
    d.upload[lang].desc = res.trim();
    shSavePipeline(); renderStepContent();
  }catch(e){ alert('❌ ' + e.message); }
}

async function upRegenHashtags(lang){
  const d = shState.data;
  const sys = (lang==='kr'?'한국어':'일본어') + ' 유튜브 해시태그 15개 생성. JSON 배열: ["태그1","태그2"...]. 대형3+중형5+소형7 구성. # 없이 태그명만.';
  try{
    await _syncAPIShorts();
    const res = await APIAdapter.callWithFallback(sys, '주제: ' + (d.topic||''), { maxTokens:500 });
    const m = res.match(/\[[\s\S]*\]/); if(!m) throw new Error('파싱 실패');
    d.upload[lang].hashtags = JSON.parse(m[0]).map(t => String(t).replace(/^#+/,'')).slice(0,15);
    shSavePipeline(); renderStepContent();
  }catch(e){ alert('❌ ' + e.message); }
}

async function upRegenPinComment(lang){
  const d = shState.data;
  const sys = (lang==='kr'?'한국어':'일본어') + ' 유튜브 고정댓글 생성. 질문형 참여 유도 2~3줄 + 해시태그 2개.';
  try{
    await _syncAPIShorts();
    const res = await APIAdapter.callWithFallback(sys, '주제: ' + (d.topic||''), { maxTokens:400 });
    d.upload[lang].pinComment = res.trim();
    shSavePipeline(); renderStepContent();
  }catch(e){ alert('❌ ' + e.message); }
}

async function upNvConvert(){
  const d = shState.data;
  const sys = '대본을 네이버 블로그 본문으로 변환. 3~4개 소제목(##) + 단락 + [이미지1], [이미지2] 마커 삽입.';
  try{
    await _syncAPIShorts();
    const res = await APIAdapter.callWithFallback(sys, d.script||'', { maxTokens:2500 });
    d.upload.nv.body = res.trim();
    shSavePipeline(); renderStepContent();
  }catch(e){ alert('❌ ' + e.message); }
}

function upQuickFix(field){
  if(field === 'script'){ shState.step = 3; renderStepper(); renderStepContent(); }
  else if(field === 'title'){ document.getElementById('up-kr-title')?.focus(); }
  else if(field === 'desc'){ document.getElementById('up-kr-desc')?.focus(); }
}

function _upT3Exec(){
  const connected = UP_PLATFORMS.filter(p => p.keys.every(([k]) => localStorage.getItem(k)));
  const picks = shState.data._upPicks = shState.data._upPicks || {};
  const listHtml = UP_PLATFORMS.map(p => {
    const ok = p.keys.every(([k]) => localStorage.getItem(k));
    const checked = picks[p.id] !== false && ok;
    return '<label style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#fff;border:1px solid var(--line);border-radius:10px;margin:4px 0;' + (!ok?'opacity:.5':'') + '">' +
      '<input type="checkbox" ' + (checked?'checked':'') + ' ' + (!ok?'disabled':'') + ' onchange="shState.data._upPicks=shState.data._upPicks||{};shState.data._upPicks[\'' + p.id + '\']=this.checked;shSavePipeline()">' +
      '<span style="font-weight:900;font-size:13px;flex:1">' + p.ico + ' ' + p.name + '</span>' +
      '<span style="font-size:11px;color:' + (ok?'var(--ok)':'var(--err)') + ';font-weight:700">' + (ok?'🟢 연결됨':'🔴 미연결 · 연결 후 사용 가능') + '</span>' +
    '</label>';
  }).join('');

  return '<h5 style="margin:0 0 8px">업로드할 플랫폼 최종 확인</h5>' +
    listHtml +
    '<div id="up-exec-progress" style="margin:14px 0"></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">' +
      '<button class="mz-btn pri" onclick="upExecUpload()">🤖 자동업로드 시작</button>' +
      '<button class="mz-btn" onclick="upExecZip()">📦 업로드팩 ZIP 다운로드</button>' +
      '<select class="mz-in" id="up-copy-platform" style="max-width:160px"><option value="">📋 플랫폼별 복사</option>' +
        UP_PLATFORMS.map(p => '<option value="' + p.id + '">' + p.ico + ' ' + p.name + '</option>').join('') +
      '</select>' +
      '<button class="mz-btn ghost" onclick="upExecCopy()">복사</button>' +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">' +
      '<button class="mz-btn ghost" style="padding:6px 12px;font-size:11px" onclick="upBackupData()">📥 데이터 백업</button>' +
      '<button class="mz-btn ghost" style="padding:6px 12px;font-size:11px" onclick="upRestoreData()">📤 데이터 복원</button>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;margin-top:14px">' +
      '<button class="mz-btn ghost" onclick="upTabSet(\'info\')">← 업로드 정보</button>' +
      '<button class="mz-btn pri" onclick="shState.step=9;renderStepper();renderStepContent()">📊 성과 분석 (Step9) →</button>' +
    '</div>';
}
async function upExecUpload(){
  const prog = document.getElementById('up-exec-progress');
  const picks = shState.data._upPicks || {};
  const list = UP_PLATFORMS.filter(p => picks[p.id] !== false && p.keys.every(([k]) => localStorage.getItem(k)));
  if(!list.length){ alert('선택된 플랫폼이 없어요'); return; }
  prog.innerHTML = '';
  list.forEach(p => {
    const row = document.createElement('div');
    row.innerHTML = p.ico + ' ' + p.name + ' 업로드 중... <b>0%</b>';
    row.style.cssText = 'padding:6px 10px;background:#fff;border:1px solid var(--line);border-radius:8px;margin:4px 0;font-size:12.5px';
    prog.appendChild(row);
    // 브라우저 CORS 제약으로 실제 업로드는 서버가 필요. UX 시뮬레이션 + ZIP 안내
    let pct = 0;
    const iv = setInterval(() => {
      pct += 10;
      row.querySelector('b').textContent = pct + '%';
      if(pct >= 100){
        clearInterval(iv);
        row.innerHTML = '⚠️ ' + p.ico + ' ' + p.name + ' · 브라우저에서 직접 업로드 불가 · <a href="#" onclick="upExecZip();return false" style="color:var(--pink-deep);font-weight:900">📦 업로드팩 ZIP 다운로드</a> 후 수동 업로드';
      }
    }, 200);
  });
  // 이력 저장
  const log = JSON.parse(localStorage.getItem('sh_uploaded_list')||'[]');
  log.unshift({
    id: Date.now(), topic: shState.data.topic, uploadDate: new Date().toISOString(),
    platforms: list.map(p => p.id),
    titles: { kr: shState.data.upload?.kr?.titles?.[0] || '', jp: shState.data.upload?.jp?.titles?.[0] || '' }
  });
  localStorage.setItem('sh_uploaded_list', JSON.stringify(log.slice(0,100)));
}
async function upExecZip(){
  if(typeof JSZip === 'undefined'){
    // JSZip 동적 로드
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    }).catch(() => alert('JSZip 로드 실패 — 인터넷 확인'));
  }
  if(typeof JSZip === 'undefined') return;
  const zip = new JSZip();
  const d = shState.data;
  const u = d.upload || {};
  // KR 폴더
  if(u.kr){
    const f = zip.folder('KR채널');
    (u.kr.titles||[]).forEach((t,i) => f.file('제목_' + String.fromCharCode(65+i) + '.txt', t||''));
    f.file('설명문_KR.txt', u.kr.desc||'');
    f.file('해시태그_KR.txt', (u.kr.hashtags||[]).map(t => '#'+t).join(' '));
    f.file('고정댓글_KR.txt', u.kr.pinComment||'');
    f.file('자막_KR.srt', _upGenSrt(d.script||'', 'ko'));
    f.file('업로드체크리스트_KR.txt', _upChecklistText('kr'));
  }
  if(u.jp){
    const f = zip.folder('JP채널');
    (u.jp.titles||[]).forEach((t,i) => f.file('タイトル_' + String.fromCharCode(65+i) + '.txt', t||''));
    f.file('説明文_JP.txt', u.jp.desc||'');
    f.file('ハッシュタグ_JP.txt', (u.jp.hashtags||[]).map(t => '#'+t).join(' '));
    f.file('固定コメント_JP.txt', u.jp.pinComment||'');
    f.file('字幕_JP.srt', _upGenSrt(d.scriptJa||d.script||'', 'ja'));
    f.file('アップロードチェックリスト_JP.txt', _upChecklistText('jp'));
  }
  const sns = zip.folder('SNS');
  if(u.ig) sns.file('인스타_캡션.txt', (u.ig.caption||'') + '\n\n' + (u.ig.hashtags||[]).map(t => '#'+t).join(' '));
  if(u.tt) sns.file('틱톡_설명.txt', (u.tt.desc||'') + '\n\n' + (u.tt.hashtags||[]).map(t => '#'+t).join(' '));
  if(u.nv) sns.file('네이버_본문.txt', '[제목]\n' + (u.nv.title||'') + '\n\n' + (u.nv.body||'') + '\n\n[태그]\n' + (u.nv.tags||[]).join(', '));
  zip.file('전체_업로드가이드.txt',
    '=== 업로드 가이드 ===\n주제: ' + (d.topic||'') + '\n생성일: ' + new Date().toLocaleString('ko-KR') + '\n\n' +
    '각 폴더별로 해당 플랫폼에 복사/붙여넣기 하세요.\n' +
    '자막 파일은 업로드 시 "자막 추가" 메뉴에서 첨부.\n'
  );
  zip.generateAsync({type:'blob'}).then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='업로드팩_' + Date.now() + '.zip'; a.click();
    URL.revokeObjectURL(url);
    window.mocaToast && window.mocaToast('📦 업로드팩 ZIP 다운로드', 'ok');
  });
}
function _upGenSrt(text, lang){
  if(!text) return '';
  const lines = text.split(/\n+/).filter(l => l.trim().length > 5);
  const totalSec = 60;
  const per = totalSec / Math.max(1, lines.length);
  const fmt = (sec) => {
    const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = Math.floor(sec%60), ms = Math.floor((sec%1)*1000);
    return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0') + ',' + String(ms).padStart(3,'0');
  };
  return lines.map((ln,i) => (i+1) + '\n' + fmt(i*per) + ' --> ' + fmt((i+1)*per - 0.1) + '\n' + ln.trim() + '\n').join('\n');
}
function _upChecklistText(lang){
  const t = shState.data.upload?.[lang]||{};
  return '[업로드 체크리스트]\n' +
    '제목: ' + (t.titles?.[t.activeTitle||0]||'') + '\n' +
    '설명문: ' + (t.desc||'').slice(0,200) + '...\n' +
    '해시태그: ' + (t.hashtags||[]).length + '개\n' +
    '공개: ' + (t.visibility||'public') + '\n' +
    '예약: ' + (t.schedule||'즉시') + '\n';
}
function upExecCopy(){
  const id = document.getElementById('up-copy-platform').value;
  if(!id){ alert('플랫폼을 선택하세요'); return; }
  const u = shState.data.upload || {};
  let text = '';
  if(id === 'yt_kr' || id === 'yt_jp'){
    const k = id === 'yt_kr' ? 'kr' : 'jp';
    const t = u[k] || {};
    text = (t.titles?.[t.activeTitle||0]||'') + '\n\n' + (t.desc||'') + '\n\n' + (t.hashtags||[]).map(x => '#'+x).join(' ');
  } else if(id === 'ig'){ text = (u.ig?.caption||'') + '\n\n' + (u.ig?.hashtags||[]).map(x => '#'+x).join(' '); }
  else if(id === 'tt'){ text = (u.tt?.desc||'') + '\n' + (u.tt?.hashtags||[]).map(x => '#'+x).join(' ') + ' ' + (u.tt?.challenge||''); }
  else if(id === 'nv'){ text = (u.nv?.title||'') + '\n\n' + (u.nv?.body||'') + '\n\n' + (u.nv?.tags||[]).join(', '); }
  navigator.clipboard.writeText(text).then(() => window.mocaToast && window.mocaToast('📋 복사 완료', 'ok'));
}
function upBackupData(){
  const dump = {};
  Object.keys(localStorage).filter(k => k.startsWith('sh_') || k.startsWith('uc_shorts_')).forEach(k => dump[k] = localStorage.getItem(k));
  const blob = new Blob([JSON.stringify(dump, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'shorts_backup_' + Date.now() + '.json'; a.click();
  window.mocaToast && window.mocaToast('📥 백업 다운로드', 'ok');
}
function upRestoreData(){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json';
  inp.onchange = e => {
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ev => {
      try{
        const obj = JSON.parse(ev.target.result);
        Object.keys(obj).forEach(k => localStorage.setItem(k, obj[k]));
        window.mocaToast && window.mocaToast('📤 복원 완료 · 새로고침 권장', 'ok');
      }catch(err){ alert('❌ ' + err.message); }
    };
    r.readAsText(f);
  };
  inp.click();
}
async function shMakePackage(target){
  const out = document.getElementById('sh-package');
  out.value = '⏳ 생성 중...';
  try {
    await _syncAPIShorts();
    const map = {
      yt:'YouTube 숏츠: 제목 A/B + 설명문 + 태그 30개 + 썸네일 + 자막 + 최적 업로드 시간',
      tiktok:'TikTok: 제목 + 해시태그 20개 + 듀엣/스티치 설정',
      ig:'Instagram 릴스: 캡션 + 해시태그 30개 + 스토리 연계 문구',
      naver:'네이버 클립/TV: 제목 + 설명 + 태그 + 블로그 연계 포스팅',
      jp:'일본 플랫폼: ニコニコ動画 / LINE VOOM / Twitter 일본어 / note.com 각 버전',
      all:'모든 플랫폼(YouTube/TikTok/IG/Naver/일본) 패키지를 전부 생성'
    };
    const sys = '플랫폼 최적화 마케터다. 아래 콘텐츠를 '+map[target]+' 형식으로 작성. 구조화해서 출력.';
    const r = await APIAdapter.callWithFallback(sys, '주제:'+(shState.data.topic||'')+'\n대본:'+(shState.data.script||''), {maxTokens:3500});
    out.value = r;
    shState.data.package = r;
    shState.data['step_8_done'] = true;
    renderStepper();
  } catch(e){ out.value = '❌ '+e.message; }
}
function shDownloadBundle(){
  const combined = [
    '=== 주제 ===', shState.data.topic||'',
    '\n=== 대본 ===', shState.data.script||'',
    '\n=== 미디어 ===', shState.data.media||'',
    '\n=== SEO ===', shState.data.seo||'',
    '\n=== 플랫폼 패키지 ===', shState.data.package||''
  ].join('\n');
  const blob = new Blob([combined], {type:'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'shorts_bundle_' + Date.now() + '.txt';
  a.click();
  URL.revokeObjectURL(a.href);
}
function shSaveSchedule(){
  const kst = document.getElementById('sh-upload-kst').value;
  if(!kst){ alert('시각을 선택하세요.'); return; }
  const date = new Date(kst);
  // KST -> JST 동일시간대(+0) 간주
  document.getElementById('sh-upload-jst').value = date.toLocaleString('ja-JP');
  const list = JSON.parse(localStorage.getItem('uc_shorts_schedule')||'[]');
  list.unshift({ at:Date.now(), scheduledAt:date.toISOString(), repeat:document.getElementById('sh-upload-repeat').value, topic:shState.data.topic });
  localStorage.setItem('uc_shorts_schedule', JSON.stringify(list.slice(0,50)));
  alert('📅 예약 저장됨');
}
async function shGenReplies(){
  const out = document.getElementById('sh-replies');
  out.value = '⏳ 생성 중...';
  try {
    await _syncAPIShorts();
    const sys = '유튜브 댓글 자동 답글 템플릿 10종 생성. 긍정·질문·부정·감사·불만 등 상황별로.';
    const r = await APIAdapter.callWithFallback(sys, '채널 장르: '+((shState.data.channel||{}).genre||'일반')+'\n영상 주제: '+(shState.data.topic||''), {maxTokens:1500});
    out.value = r;
  } catch(e){ out.value = '❌ '+e.message; }
}

/* ═══════════════════════════════════════════════════════════
   📊 STEP 9 — 수익화 분석 (3탭: 영상별 / 채널 / 전략)
   ═══════════════════════════════════════════════════════════ */
function anTabGet(){ return shState.data._anTab || 'video'; }
