/* ==================================================
   builder.js  (~535 lines)
   openBuilder / canvas / blocks / props / SEO / A/B
   src: L126-660
   split_all.py
   ================================================== */

function openBuilder(card){
  BLD.type = card.bldId || 'blog';
  const meta = BLD_TYPES[BLD.type];
  document.getElementById('bld-ico').textContent   = meta.ico;
  document.getElementById('bld-title').textContent = meta.title;
  document.getElementById('bld-desc').textContent  = meta.desc;

  // 브랜드킷 UI 프리필 — 현재 BLD.language 에 맞는 채널 브랜드킷 로드
  const bkCh = (BLD.language === 'ja') ? 'ja' : 'ko';
  const bk = loadBrandkit(bkCh);
  document.getElementById('bk-channel').value = bkCh;
  document.getElementById('bk-name').value    = bk.name || '';
  document.getElementById('bk-color').value   = bk.color || '#FF6B9D';
  document.getElementById('bk-font').value    = bk.font || 'pretendard';
  document.getElementById('bk-logo').value    = bk.logo || '';
  _updateBrandkitSummary();

  // 패널 전환
  ['blog','newsletter','webtoon','sns','ebook','landing'].forEach(k => {
    const el = document.getElementById('bld-' + k);
    if(el) el.style.display = (k === BLD.type ? '' : 'none');
  });

  // 블로그 템플릿 렌더
  if(BLD.type === 'blog') _renderTemplates();
  _bldBindPickers();

  // 뷰 전환
  document.querySelector('.hero').style.display = 'none';
  document.getElementById('grid').style.display = 'none';
  document.getElementById('publicDetail')?.classList.add('hide');
  document.getElementById('monetizeDetail').classList.remove('hide');
  document.getElementById('mz-out').value = '';
  document.getElementById('mz-status').textContent = '';
}
function closeBuilder(){
  document.getElementById('monetizeDetail').classList.add('hide');
  document.querySelector('.hero').style.display = '';
  document.getElementById('grid').style.display = '';
}
// 레거시 이름 호환
function closeMonetize(){ closeBuilder(); }

function _renderTemplates(){
  const wrap = document.getElementById('bld-tpl-grid');
  if(!wrap) return;
  wrap.innerHTML = BLOG_TEMPLATES.map(t =>
    '<div class="bld-tpl' + (t.id === BLD.template ? ' on' : '') + '" data-v="' + t.id + '">' +
      '<div class="ico">' + t.ico + '</div>' +
      '<div class="t">' + t.t + '</div>' +
      '<div class="s">' + t.s + '</div>' +
    '</div>'
  ).join('');
  wrap.querySelectorAll('.bld-tpl').forEach(el => {
    el.addEventListener('click', () => {
      wrap.querySelectorAll('.bld-tpl').forEach(x => x.classList.remove('on'));
      el.classList.add('on');
      BLD.template = el.getAttribute('data-v');
    });
  });
}

function _bldBindPickers(){
  const bind = (rowId, key, multi) => {
    const row = document.getElementById(rowId);
    if(!row || row.dataset.bound) return;
    row.dataset.bound = '1';
    row.querySelectorAll('[data-v]').forEach(el => {
      el.addEventListener('click', () => {
        if(!multi) row.querySelectorAll('[data-v]').forEach(x => x.classList.remove('on'));
        el.classList.toggle('on');
        if(!multi) BLD[key] = el.getAttribute('data-v');
      });
    });
  };
  bind('bld-lang',     'language');
  bind('bld-tone',     'tone');
  bind('bld-length',   'length');
  bind('bld-imgstyle', 'imgStyle');
  bind('bld-color',    'colorTheme');
  bind('bld-anim',     'animation');
  bind('mon-pos',      'moneyPos');
  // 캔버스 사이즈
  const sizeRow = document.querySelector('.bld-size-row');
  if(sizeRow && !sizeRow.dataset.bound){
    sizeRow.dataset.bound = '1';
    sizeRow.querySelectorAll('[data-size]').forEach(el => {
      el.addEventListener('click', () => {
        sizeRow.querySelectorAll('[data-size]').forEach(x => x.classList.remove('on'));
        el.classList.add('on');
        BLD.canvasSize = el.getAttribute('data-size');
        const canvas = document.getElementById('bld-canvas');
        if(canvas){
          canvas.classList.remove('size-blog','size-insta','size-story','size-kakao');
          canvas.classList.add('size-' + BLD.canvasSize);
        }
      });
    });
  }
}

/* ─── 블록 ID / 푸시 ─── */
function _blockId(){ return 'b_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6); }
function _pushUndo(){
  BLD.undoStack.push(JSON.parse(JSON.stringify(BLD.blocks)));
  if(BLD.undoStack.length > 30) BLD.undoStack.shift();
  BLD.redoStack = [];
}
function bldUndo(){ if(!BLD.undoStack.length) return; BLD.redoStack.push(JSON.parse(JSON.stringify(BLD.blocks))); BLD.blocks = BLD.undoStack.pop(); _renderCanvas(); }
function bldRedo(){ if(!BLD.redoStack.length) return; BLD.undoStack.push(JSON.parse(JSON.stringify(BLD.blocks))); BLD.blocks = BLD.redoStack.pop(); _renderCanvas(); }

/* ─── 블로그 AI 생성 + 이미지 자동 생성 (초심자 모드) ─── */
async function bldGenerateBlogFull(){
  await bldGenerateBlog();
  // 이미지 프롬프트가 생성된 블록들에 대해 자동 이미지 생성 시도
  const imgBlocks = (BLD.blocks||[]).filter(b => b.type === 'image' && !b.url);
  if(imgBlocks.length && localStorage.getItem('uc_openai_key')){
    document.getElementById('mz-status').textContent = '🖼 이미지 ' + imgBlocks.length + '장 생성 중...';
    for(const b of imgBlocks){
      try{ await bldGenSingleImage(b.id); }catch(_){}
    }
    document.getElementById('mz-status').textContent = '✅ 글+이미지 완성';
  }
}

/* ─── 블로그 AI 생성 (기본) ─── */
async function bldGenerateBlog(){
  const topic = document.getElementById('bld-topic').value.trim();
  if(!topic){ alert('주제를 입력해주세요'); return; }
  BLD.topic = topic;
  const btn = document.getElementById('bld-gen');
  btn.disabled = true; btn.textContent = '⏳ 생성 중...';
  try{
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
    {const v=localStorage.getItem('uc_openai_key'); if(v) APIAdapter.setApiKey('openai',v);}
    {const v=localStorage.getItem('uc_gemini_key'); if(v) APIAdapter.setApiKey('gemini',v);}

    const tpl = BLOG_TEMPLATES.find(x => x.id === BLD.template);
    const toneLabel = {emotional:'감성적', info:'정보형', expert:'전문적'}[BLD.tone];
    const lenTarget = {short:1200, mid:2200, long:3500}[BLD.length];
    const wantKo = BLD.language !== 'ja';
    const wantJa = BLD.language === 'ja' || BLD.language === 'both';

    const sys =
      '너는 한국 블로그(네이버·브런치·티스토리) 전문 작가다.\n' +
      '템플릿: ' + tpl.t + ' (' + tpl.s + ')\n' +
      '톤: ' + toneLabel + ' · 목표 글자수: ' + lenTarget + '자 ±20%\n' +
      '블록 단위 JSON 배열로만 출력(다른 말 금지).\n' +
      '사용 가능 type: "heading"(H1/H2/H3), "paragraph", "image"(prompt 포함), "quote", "divider", "checklist"(items 배열)\n' +
      '구성: H1 제목 1개 → 리드 문단 → 섹션 (H2 + 문단 1~2개 + 이미지 프롬프트) 반복 → 마무리 문단\n' +
      '최소 3개의 섹션 · 이미지 블록 2~4개 · 강조 키워드는 텍스트 안에 ** **로 감싸 표시.\n' +
      '출력 예시: [{"type":"heading","level":1,"text":"..."},{"type":"paragraph","text":"..."},{"type":"image","prompt":"..."},{"type":"heading","level":2,"text":"..."},...]';
    const user = '주제: ' + topic + (wantJa ? '\n※ text 필드에 한국어/일본어 둘 다 제공: {"text_ko":"...","text_ja":"..."}' : '');

    const text = await APIAdapter.callWithFallback(sys, user, { maxTokens: 4500 });
    const m = text.match(/\[[\s\S]*\]/);
    if(!m) throw new Error('AI 응답 파싱 실패');
    const arr = JSON.parse(m[0]);

    _pushUndo();
    BLD.blocks = arr.map(b => {
      const id = _blockId();
      if(b.type === 'heading') return { id, type:'heading', level:b.level||2, text:b.text||b.text_ko||'' };
      if(b.type === 'paragraph') return { id, type:'paragraph', text:b.text||b.text_ko||'' };
      if(b.type === 'image') return { id, type:'image', prompt:b.prompt||'', url:'' };
      if(b.type === 'quote') return { id, type:'quote', text:b.text||b.text_ko||'' };
      if(b.type === 'divider') return { id, type:'divider' };
      if(b.type === 'checklist') return { id, type:'checklist', items:(b.items||[]).map(x => ({ text:x, done:false })) };
      if(b.type === 'table') return { id, type:'table', rows:b.rows||[['제목','내용']] };
      if(b.type === 'button') return { id, type:'button', text:b.text||'클릭', url:b.url||'#' };
      return { id, type:'paragraph', text:String(b.text||'') };
    });
    _renderCanvas();
    _computeSeoScore();
    document.getElementById('mz-out').value = _blocksToPlain(BLD.blocks);
    document.getElementById('mz-status').textContent = '✅ ' + BLD.blocks.length + '개 블록 생성';
  }catch(e){
    document.getElementById('mz-status').textContent = '❌ ' + e.message;
    alert('❌ ' + e.message);
  }finally{
    btn.disabled = false; btn.textContent = '☕ 글 자동생성';
  }
}

/* ─── 캔버스 렌더 ─── */
function _renderCanvas(){
  const c = document.getElementById('bld-canvas');
  if(!c) return;
  if(!BLD.blocks.length){ c.innerHTML = '<div class="bld-empty">주제를 입력하고 "☕ 글 자동생성"을 눌러주세요</div>'; return; }
  const fxReveal = document.getElementById('bld-fx-reveal')?.checked;
  const fxProgress = document.getElementById('bld-fx-progress')?.checked;
  const fxToc = document.getElementById('bld-fx-toc')?.checked;
  let html = '';
  if(fxProgress) html += '<div class="bld-read-progress"><b id="bld-progress-b"></b></div>';
  if(fxToc){
    const toc = BLD.blocks.filter(b => b.type === 'heading' && b.level >= 2);
    if(toc.length){
      html += '<div class="bld-toc"><h5>📑 목차</h5><ul>' +
        toc.map(t => '<li onclick="document.getElementById(\'' + t.id + '\').scrollIntoView({behavior:\'smooth\'})">' + (t.text||'').replace(/</g,'&lt;') + '</li>').join('') +
        '</ul></div>';
    }
  }
  BLD.blocks.forEach(b => {
    const sel = (b.id === BLD.selectedBlockId) ? ' sel' : '';
    const anim = (fxReveal ? ' style="animation:fadeInUp .5s ease"' : '');
    html += '<div class="bld-block bld-block-' + b.type + sel + '" id="' + b.id + '" onclick="bldSelectBlock(\'' + b.id + '\',event)"' + anim + '>';
    html += '<div class="bld-acts">' +
      '<button onclick="bldRegenBlock(\'' + b.id + '\',event)" title="AI 재생성">🔄</button>' +
      '<button onclick="bldDeleteBlock(\'' + b.id + '\',event)" title="삭제">🗑</button>' +
    '</div>';
    html += _renderBlockBody(b);
    html += '</div>';
  });
  c.innerHTML = html;
}
function _renderBlockBody(b){
  const txt = (s) => _highlightStar(String(s||'').replace(/</g,'&lt;'));
  switch(b.type){
    case 'heading': return '<h' + (b.level||2) + ' contenteditable="true" oninput="bldEditBlock(\'' + b.id + '\',this.innerText)">' + txt(b.text) + '</h' + (b.level||2) + '>';
    case 'paragraph': return '<p contenteditable="true" oninput="bldEditBlock(\'' + b.id + '\',this.innerText)">' + txt(b.text) + '</p>';
    case 'image':
      if(b.url) return '<img src="' + b.url + '" alt="' + (b.prompt||'이미지').replace(/"/g,'&quot;') + '">';
      return '<div style="padding:40px 20px;background:#fff5fa;border:2px dashed var(--line);border-radius:10px;text-align:center;color:var(--sub);font-size:12px">🖼 <b>이미지</b><br>프롬프트: ' + (b.prompt||'').slice(0,80) + '<br><button onclick="bldGenSingleImage(\'' + b.id + '\',event)" style="margin-top:8px;padding:6px 14px;border-radius:8px;border:1px solid var(--pink);background:#fff;cursor:pointer">🎨 이 이미지 생성</button></div>';
    case 'quote': return '<blockquote contenteditable="true" oninput="bldEditBlock(\'' + b.id + '\',this.innerText)">' + txt(b.text) + '</blockquote>';
    case 'divider': return '<hr class="bld-block-divider">';
    case 'checklist': return '<ul>' + (b.items||[]).map((it,i) => '<li' + (it.done?' class="done"':'') + ' onclick="bldToggleCheck(\'' + b.id + '\',' + i + ',event)">' + txt(it.text) + '</li>').join('') + '</ul>';
    case 'table':
      return '<table>' + (b.rows||[]).map((row,i) => '<tr>' + row.map(cell => i===0 ? '<th>' + txt(cell) + '</th>' : '<td>' + txt(cell) + '</td>').join('') + '</tr>').join('') + '</table>';
    case 'button': return '<a href="' + (b.url||'#') + '" target="_blank" contenteditable="true">' + txt(b.text) + '</a>';
  }
  return '';
}
function _highlightStar(s){ return s.replace(/\*\*(.+?)\*\*/g, '<span class="bld-hl">$1</span>'); }
function bldSelectBlock(id, ev){ if(ev) ev.stopPropagation(); BLD.selectedBlockId = id; _renderCanvas(); _renderPropsPanel(); }
function bldEditBlock(id, text){
  const b = BLD.blocks.find(x => x.id === id);
  if(!b) return;
  if(b.type === 'heading' || b.type === 'paragraph' || b.type === 'quote' || b.type === 'button') b.text = text;
  document.getElementById('mz-out').value = _blocksToPlain(BLD.blocks);
  _computeSeoScore();
}
function bldDeleteBlock(id, ev){
  ev && ev.stopPropagation();
  _pushUndo();
  BLD.blocks = BLD.blocks.filter(x => x.id !== id);
  _renderCanvas();
}
async function bldRegenBlock(id, ev){
  ev && ev.stopPropagation();
  const b = BLD.blocks.find(x => x.id === id);
  if(!b) return;
  try{
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
    const sys = '주어진 문장을 동일한 역할(같은 블록 유형)로 자연스럽게 다시 작성. 한 문장 또는 짧은 단락으로만 출력.';
    const user = '원본: ' + (b.text||b.prompt||'');
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens: 800 });
    _pushUndo();
    if(b.type === 'image') b.prompt = res.trim().slice(0,300);
    else b.text = res.trim();
    _renderCanvas();
  }catch(e){ alert('❌ ' + e.message); }
}
function bldToggleCheck(id, i, ev){
  ev && ev.stopPropagation();
  const b = BLD.blocks.find(x => x.id === id);
  if(b && b.items[i]) b.items[i].done = !b.items[i].done;
  _renderCanvas();
}

/* ─── 블록 추가 / 이미지 생성 ─── */
function bldAddBlock(type){
  _pushUndo();
  const id = _blockId();
  const stub = {
    text:     { id, type:'paragraph', text:'새 문단' },
    image:    { id, type:'image', prompt:'새 이미지 설명', url:'' },
    divider:  { id, type:'divider' },
    button:   { id, type:'button', text:'클릭', url:'#' },
    table:    { id, type:'table', rows:[['열1','열2'],['데이터1','데이터2']] },
    quote:    { id, type:'quote', text:'인용구' },
    checklist:{ id, type:'checklist', items:[{text:'항목1', done:false},{text:'항목2', done:false}] }
  }[type];
  if(stub) BLD.blocks.push(stub);
  _renderCanvas();
}
async function bldGenerateImages(){
  const imgBlocks = BLD.blocks.filter(b => b.type === 'image' && !b.url);
  if(!imgBlocks.length){ alert('생성할 이미지 블록이 없어요 (블로그 본문 먼저 생성)'); return; }
  const key = localStorage.getItem('uc_openai_key');
  if(!key){ alert('OpenAI 키가 필요합니다 (설정 탭에서 저장)'); return; }
  document.getElementById('mz-status').textContent = '🎨 ' + imgBlocks.length + '개 이미지 생성 중...';
  for(let i=0; i<imgBlocks.length; i++){
    try{ await bldGenSingleImage(imgBlocks[i].id); }catch(_){}
  }
  document.getElementById('mz-status').textContent = '✅ 이미지 생성 완료';
}
async function bldGenSingleImage(id, ev){
  ev && ev.stopPropagation();
  const b = BLD.blocks.find(x => x.id === id);
  if(!b) return;
  const key = localStorage.getItem('uc_openai_key');
  if(!key){ alert('OpenAI 키가 필요합니다'); return; }
  try{
    const stylePrefix = {
      ghibli:'in Studio Ghibli animation style, pastel colors,',
      realistic:'photorealistic, high detail,',
      watercolor:'soft watercolor illustration,',
      info:'clean infographic with icons and charts,',
      emoji:'cute emoji-style illustration,',
      minimal:'minimalist flat vector art,',
      pop:'pop art style, vibrant colors,',
      vintage:'vintage retro illustration,'
    }[BLD.imgStyle] || '';
    const fullPrompt = stylePrefix + ' ' + (b.prompt||BLD.topic);
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body: JSON.stringify({ model:'dall-e-3', prompt: fullPrompt, n:1, size:'1024x1024', response_format:'url' })
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error?.message || 'HTTP '+res.status);
    b.url = data.data?.[0]?.url || '';
    _renderCanvas();
  }catch(e){ alert('❌ ' + e.message); }
}

/* ─── 디바이스 프리뷰 ─── */
function bldSetDevice(d){
  BLD.device = d;
  document.getElementById('bld-dev-m')?.classList.toggle('on', d === 'mobile');
  document.getElementById('bld-dev-d')?.classList.toggle('on', d === 'desktop');
  const c = document.getElementById('bld-canvas');
  if(c) c.classList.toggle('mobile', d === 'mobile');
}

/* ─── 오른쪽 탭 ─── */
function bldRightTab(t){
  document.querySelectorAll('.bld-right-tabs button').forEach(b => b.classList.toggle('on', b.getAttribute('data-t') === t));
  ['props','seo','ab','money'].forEach(k => {
    const el = document.getElementById('bld-tab-' + k);
    if(el) el.classList.toggle('on', k === t);
  });
  if(t === 'seo') _computeSeoScore();
}

/* ─── 속성 패널 ─── */
function _renderPropsPanel(){
  const body = document.getElementById('bld-props-body');
  if(!body) return;
  const b = BLD.blocks.find(x => x.id === BLD.selectedBlockId);
  if(!b){ body.innerHTML = '<p class="hint" style="opacity:.7">(선택된 요소 없음)</p>'; return; }
  if(b.type === 'heading' || b.type === 'paragraph' || b.type === 'quote'){
    body.innerHTML =
      '<p class="hint">' + b.type + (b.level?' H'+b.level:'') + ' 선택됨</p>' +
      '<label>정렬</label><div class="bld-pill-row">' +
        '<button class="bld-pill on" onclick="_propAlign(\'left\')">좌</button>' +
        '<button class="bld-pill" onclick="_propAlign(\'center\')">중</button>' +
        '<button class="bld-pill" onclick="_propAlign(\'right\')">우</button>' +
      '</div>' +
      '<button class="mz-btn" style="width:100%;margin-top:8px" onclick="bldRegenBlock(\'' + b.id + '\')">🔄 AI 재생성</button>';
  } else if(b.type === 'image'){
    body.innerHTML =
      '<p class="hint">이미지 블록</p>' +
      '<label>프롬프트</label><textarea class="mz-in" style="min-height:70px" onchange="(BLD.blocks.find(x=>x.id===\'' + b.id + '\')||{}).prompt=this.value">' + (b.prompt||'') + '</textarea>' +
      '<button class="mz-btn pri" style="width:100%;margin-top:8px" onclick="bldGenSingleImage(\'' + b.id + '\')">🎨 AI로 재생성</button>' +
      '<label style="margin-top:6px">효과</label>' +
      '<select class="mz-in" onchange="document.getElementById(\'' + b.id + '\').querySelector(\'img\').style.borderRadius=({none:0,round:12,pill:999}[this.value]||0)+\'px\'">' +
      '<option value="none">없음</option><option value="round" selected>둥글게</option><option value="pill">완전 둥글게</option></select>';
  } else {
    body.innerHTML = '<p class="hint">' + b.type + ' 블록 선택됨</p>';
  }
}
function _propAlign(v){
  const b = BLD.blocks.find(x => x.id === BLD.selectedBlockId);
  if(!b) return;
  const el = document.getElementById(b.id);
  if(el) el.style.textAlign = v;
}

/* ─── SEO 점수 ─── */
function _computeSeoScore(){
  const checks = [];
  const blocks = BLD.blocks;
  const h1 = blocks.find(b => b.type === 'heading' && b.level === 1);
  const topic = BLD.topic || (h1?.text || '');
  const totalChars = blocks.reduce((a,b) => a + (b.text?.length || 0), 0);
  const imgCount = blocks.filter(b => b.type === 'image').length;

  function ck(ok, warn, label){ checks.push({ ok, warn, label }); }
  ck(!!h1, false, '제목(H1) 있음');
  ck(h1 && topic && h1.text && h1.text.includes((topic.split(' ')[0]||'').slice(0,5)), false, '제목에 키워드 포함');
  const metaDesc = document.getElementById('seo-desc')?.value || '';
  ck(metaDesc.length >= 80, metaDesc.length > 0, '메타 설명 80자 이상');
  ck(imgCount >= 2, imgCount >= 1, '이미지 ' + imgCount + '개 (권장 2+)');
  ck(totalChars >= 1500, totalChars >= 800, '본문 ' + totalChars + '자 (권장 1,500+)');
  const h2Count = blocks.filter(b => b.type === 'heading' && b.level === 2).length;
  ck(h2Count >= 3, h2Count >= 2, 'H2 소제목 ' + h2Count + '개 (권장 3+)');
  // 네이버 특화
  if(document.getElementById('seo-naver-2000')?.checked) ck(totalChars >= 2000, false, '네이버: 2,000자 이상');
  if(document.getElementById('seo-naver-img3')?.checked) ck(imgCount >= 3, imgCount >= 1, '네이버: 이미지 3장+');

  const okCount = checks.filter(c => c.ok).length;
  const score = Math.round((okCount / checks.length) * 100);
  BLD.seoScore = score;

  const scoreEl = document.getElementById('seo-score'); if(scoreEl) scoreEl.textContent = score;
  const list = document.getElementById('seo-checklist');
  if(list){
    list.innerHTML = checks.map(c =>
      '<li class="' + (c.ok ? 'ok' : (c.warn ? 'warn' : 'fail')) + '">' + c.label + '</li>'
    ).join('');
  }
  // 자동 메타 채우기
  const seoTitle = document.getElementById('seo-title');
  if(seoTitle && !seoTitle.value && h1) seoTitle.value = h1.text;
  const seoDesc = document.getElementById('seo-desc');
  if(seoDesc && !seoDesc.value){
    const firstPara = blocks.find(b => b.type === 'paragraph');
    if(firstPara) seoDesc.value = String(firstPara.text||'').slice(0,150);
  }
}
async function bldSeoAutoFix(){
  try{
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    const plain = _blocksToPlain(BLD.blocks);
    const sys = 'SEO 점수가 90+ 되도록 개선안을 JSON으로 출력: {"title":"메타 제목","description":"메타 설명(150~160자)","keywords":"키워드, 쉼표, 구분"}';
    const res = await APIAdapter.callWithFallback(sys, '주제: ' + BLD.topic + '\n본문 요약:\n' + plain.slice(0,1500), { maxTokens:800 });
    const m = res.match(/\{[\s\S]*\}/); if(!m) throw new Error('파싱 실패');
    const obj = JSON.parse(m[0]);
    document.getElementById('seo-title').value = obj.title || '';
    document.getElementById('seo-desc').value  = obj.description || '';
    document.getElementById('seo-kw').value    = obj.keywords || '';
    _computeSeoScore();
    alert('🔧 SEO 최적화 완료 · 점수: ' + BLD.seoScore);
  }catch(e){ alert('❌ ' + e.message); }
}

/* ─── A/B ─── */
function bldAbSave(){
  BLD.ab = {
    titleA: document.getElementById('ab-title-a').value,
    titleB: document.getElementById('ab-title-b').value,
    imgA:   document.getElementById('ab-img-a').value,
    imgB:   document.getElementById('ab-img-b').value,
    saved: true
  };
  const key = 'uc_bld_ab';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  list.unshift({ at: Date.now(), topic: BLD.topic, ab: BLD.ab });
  localStorage.setItem(key, JSON.stringify(list.slice(0,30)));
  alert('✅ 두 버전 동시 저장 · 나중에 성과 탭에서 비교');
}

/* ─── 수익화 CTA ─── */
async function bldMonCtaGen(){
  try{
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    const types = ['mon-kmong','mon-class','mon-sub','mon-kakao'].filter(id => document.getElementById(id)?.checked).join(', ');
    const sys = '수익화 CTA 한 줄 문구 생성. 자연스럽고 설득력 있게. 과장 없이. 100자 이내.';
    const user = '콘텐츠 주제: ' + BLD.topic + '\nCTA 유형: ' + (types || '일반');
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens:300 });
    document.getElementById('mon-cta-text').value = res.trim();
  }catch(e){ alert('❌ ' + e.message); }
}
function bldMonInsert(){
  const url = document.getElementById('mon-url').value.trim() || '#';
  const text = document.getElementById('mon-cta-text').value.trim();
  if(!text){ alert('CTA 문구를 먼저 작성/생성해주세요'); return; }
  const pos = BLD.moneyPos || '70';
  const ctaBlock = { id: _blockId(), type:'button', text, url };
  _pushUndo();
  if(pos === 'top') BLD.blocks.unshift(ctaBlock);
  else if(pos === 'bottom') BLD.blocks.push(ctaBlock);
  else {
    const at = Math.max(1, Math.floor(BLD.blocks.length * 0.7));
    BLD.blocks.splice(at, 0, ctaBlock);
  }
  _renderCanvas();
  alert('📌 ' + (pos==='70'?'70% 지점':pos==='top'?'상단':'하단') + '에 CTA 삽입');
}

/* ─── 블록 → HTML/Plain 변환 ─── */
function _blocksToHtml(opts){
  opts = opts || {};
  const ch = (BLD.language === 'ja') ? 'ja' : 'ko';
  const bk = loadBrandkit(ch);
  const brandColor = bk.color || '#FF6B9D';
  return BLD.blocks.map(b => {
    switch(b.type){
      case 'heading': return '<h' + (b.level||2) + ' style="color:' + brandColor + ';margin:20px 0 12px">' + (b.text||'').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>') + '</h' + (b.level||2) + '>';
      case 'paragraph': return '<p style="line-height:1.9;margin:0 0 14px">' + (b.text||'').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>') + '</p>';
      case 'image': return b.url ? '<p><img src="' + b.url + '" alt="' + (b.prompt||'이미지').replace(/"/g,'&quot;') + '" style="max-width:100%;border-radius:8px"></p>' : '<p><em>[이미지: ' + (b.prompt||'') + ']</em></p>';
      case 'quote': return '<blockquote style="border-left:4px solid ' + brandColor + ';padding:12px 16px;background:#fff5fa;margin:14px 0">' + (b.text||'') + '</blockquote>';
      case 'divider': return '<hr style="border:none;border-top:2px solid #eee;margin:24px 0">';
      case 'checklist': return '<ul>' + (b.items||[]).map(it => '<li>' + (it.done?'☑':'☐') + ' ' + it.text + '</li>').join('') + '</ul>';
      case 'table': return '<table style="width:100%;border-collapse:collapse">' + (b.rows||[]).map((r,i) => '<tr>' + r.map(c => i===0 ? '<th style="border:1px solid #eee;padding:8px;background:#fff5fa">'+c+'</th>' : '<td style="border:1px solid #eee;padding:8px">'+c+'</td>').join('') + '</tr>').join('') + '</table>';
      case 'button': return '<p style="text-align:center;margin:18px 0"><a href="' + (b.url||'#') + '" style="display:inline-block;padding:12px 24px;background:' + brandColor + ';color:#fff;border-radius:999px;text-decoration:none;font-weight:700">' + (b.text||'') + '</a></p>';
    }
    return '';
  }).join('\n');
}
function _blocksToPlain(blocks){
  return blocks.map(b => {
    switch(b.type){
      case 'heading': return '\n' + '#'.repeat(b.level||2) + ' ' + (b.text||'') + '\n';
      case 'paragraph': return (b.text||'').replace(/\*\*(.+?)\*\*/g,'$1') + '\n';
      case 'image': return '[이미지: ' + (b.prompt||'') + ']';
      case 'quote': return '> ' + (b.text||'');
      case 'divider': return '\n---\n';
      case 'checklist': return (b.items||[]).map(it => (it.done?'[x] ':'[ ] ') + it.text).join('\n');
      case 'button': return '[버튼: ' + (b.text||'') + ' → ' + (b.url||'') + ']';
    }
    return '';
  }).join('\n');
}

/* ─── Export ─── */
function bldExport(format){
  const html = _blocksToHtml();
  const plain = _blocksToPlain(BLD.blocks);
  let toCopy = html;
  let msg = '';
  if(format === 'naver'){ msg = '📝 네이버 블로그 에디터에 붙여넣으세요'; }
  else if(format === 'brunch'){ msg = '✍️ 브런치 에디터(마크다운)에 붙여넣으세요'; toCopy = plain; }
  else if(format === 'tistory'){ msg = '📄 티스토리 HTML 모드에 붙여넣으세요'; }
  else if(format === 'stibee'){ msg = '📋 스티비 HTML 에디터에 붙여넣으세요'; }
  else if(format === 'mailchimp'){ msg = '📋 Mailchimp Code view 에 붙여넣으세요'; }
  else if(format === 'beehiiv'){ msg = '📋 Beehiiv 에디터에 붙여넣으세요'; }
  else if(format === 'html'){ msg = '📋 HTML 복사됨'; }
  navigator.clipboard.writeText(toCopy).then(() => {
    alert(msg + '\n\n(' + toCopy.length + '자 클립보드 복사됨)');
  });
}


