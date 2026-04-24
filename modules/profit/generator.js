/* ==================================================
   generator.js  (~265 lines)
   export / save / schedule / generators / compat
   src: L661-925
   split_all.py
   ================================================== */

/* ─── 재활용 (1개 → 6개 플랫폼) ─── */
async function bldRecycle(target){
  if(!BLD.blocks.length){ alert('먼저 블로그를 생성해주세요'); return; }
  const source = _blocksToPlain(BLD.blocks);
  try{
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    const map = {
      newsletter: '뉴스레터 이메일 HTML 형식. 헤더 + 본문 3섹션 + 구독/CTA. 제목(subject)과 본문(body) JSON 출력: {"subject":"","body_html":""}',
      sns:        '인스타그램 카드뉴스 10장. 각 카드 120자 이내. JSON 배열: [{"slide":1,"title":"","text":""}, ... 10개]',
      webtoon:    '5칸 웹툰 구조. JSON 배열: [{"panel":1,"scene":"씬 설명","dialogue":"대사","sfx":"효과음"}, ... 5개]',
      shorts:     '60초 유튜브 숏츠 대본. 씬 6개. JSON 배열: [{"scene":1,"duration":10,"narration":"","visual":""}, ... 6개]',
      ebook:      'PDF 전자책용 구조. 표지 + 목차 + 3챕터. JSON: {"cover":"","toc":[],"chapters":[{"title":"","body":""}, ...]}',
      ja:         '일본어 버전 번역. 원본 구조 유지. 자연스러운 경어체. JSON 배열 블록 형식.'
    };
    const sys = map[target];
    if(!sys) return;
    const res = await APIAdapter.callWithFallback(sys, '원본 블로그:\n' + source.slice(0,4000), { maxTokens:4000 });
    // 보관함에 저장
    const key = 'uc_bld_recycled';
    const list = JSON.parse(localStorage.getItem(key)||'[]');
    list.unshift({ at: Date.now(), source_topic: BLD.topic, target, result: res });
    localStorage.setItem(key, JSON.stringify(list.slice(0,50)));
    // 타겟별 후속 동작
    if(target === 'shorts'){
      // 미디어 엔진으로 자동 전송
      const mkey = 'hub_scripts_v1';
      const mlist = JSON.parse(localStorage.getItem(mkey)||'[]');
      mlist.unshift({ source:'builder', lang:'ko', text: res, at: Date.now(), meta:{ topic: BLD.topic } });
      localStorage.setItem(mkey, JSON.stringify(mlist.slice(0,30)));
      if(confirm('📺 영상 대본 변환 완료 · 자동숏츠 엔진으로 이동할까요?')){
        location.href = 'engines/shorts/index.html?topic=' + encodeURIComponent(BLD.topic);
        return;
      }
    }
    navigator.clipboard.writeText(res);
    alert('✅ ' + target + ' 변환 완료 · 클립보드 복사 + 보관함 저장');
    document.getElementById('mz-out').value = res;
  }catch(e){ alert('❌ ' + e.message); }
}

/* ─── 저장/다운로드 ─── */
function bldSaveHtml(){
  const bk = loadBrandkit();
  const full = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' +
    (document.getElementById('seo-title')?.value || BLD.topic || '콘텐츠') + '</title>' +
    '<meta name="description" content="' + (document.getElementById('seo-desc')?.value||'') + '">' +
    '<style>body{font-family:Pretendard,sans-serif;max-width:700px;margin:0 auto;padding:32px 20px;line-height:1.8;color:#2b2430}</style>' +
    '</head><body>' + _blocksToHtml() + '</body></html>';
  const blob = new Blob([full], { type:'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = (BLD.topic || 'content') + '.html';
  a.click();
  URL.revokeObjectURL(url);
}
function bldSavePdf(){
  // window.print 다이얼로그 — 사용자가 "PDF로 저장" 선택
  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Pretendard,sans-serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8}</style></head><body>' + _blocksToHtml() + '</body></html>';
  const w = window.open('', '_blank');
  w.document.write(html); w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}
function bldSaveImage(){
  alert('🖼 이미지 저장: html2canvas 라이브러리 필요. 당분간 PDF 저장 후 스크린샷을 이용해주세요.');
}
function bldSaveLibrary(){
  const plain = _blocksToPlain(BLD.blocks);
  if(typeof window.Library !== 'undefined' && typeof window.Library.saveResult === 'function'){
    try{
      window.Library.saveResult({
        category:'monetize', source:'builder',
        title: '[' + BLD_TYPES[BLD.type].title + '] ' + (BLD.topic||'(제목없음)'),
        body: plain,
        meta: { type: BLD.type, template: BLD.template, seoScore: BLD.seoScore, brandkit: loadBrandkit() }
      });
      document.getElementById('mz-status').textContent = '💾 보관함 저장 완료';
      return;
    }catch(_){}
  }
  const key = 'uc_builder_saved';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  list.unshift({ at: Date.now(), type: BLD.type, topic: BLD.topic, blocks: BLD.blocks, seoScore: BLD.seoScore });
  localStorage.setItem(key, JSON.stringify(list.slice(0,50)));
  document.getElementById('mz-status').textContent = '💾 localStorage 저장 완료';
}
function bldSchedule(){
  const dt = document.getElementById('bld-schedule-dt').value;
  if(!dt){ alert('날짜/시간을 설정해주세요'); return; }
  const when = new Date(dt).getTime();
  const now = Date.now();
  const delta = when - now;
  if(delta <= 0){ alert('미래 시점으로 설정해주세요'); return; }
  if(delta > 2147483647){ alert('너무 먼 미래에요 (최대 24일)'); return; }
  setTimeout(() => {
    if('Notification' in window && Notification.permission === 'granted'){
      new Notification('📅 예약 발행 시간', { body: (BLD.topic||'콘텐츠') + ' 발행할 시간이에요' });
    } else alert('📅 예약한 시간이 되었습니다: ' + (BLD.topic||'콘텐츠'));
  }, delta);
  if('Notification' in window && Notification.permission === 'default'){ Notification.requestPermission(); }
  alert('📅 ' + new Date(when).toLocaleString('ko-KR') + ' 에 알림을 예약했습니다 (탭을 열어두세요)');
}

/* ─── 성과 기록 & AI 분석 ─── */
function bldPerfRecord(){
  const perf = {
    views:  parseInt(document.getElementById('perf-views').value||'0',10),
    time:   parseInt(document.getElementById('perf-time').value||'0',10),
    ctr:    parseFloat(document.getElementById('perf-ctr').value||'0'),
    share:  parseInt(document.getElementById('perf-share').value||'0',10)
  };
  const key = 'uc_bld_perf';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  list.unshift({
    at: Date.now(), topic: BLD.topic, type: BLD.type, template: BLD.template,
    imgStyle: BLD.imgStyle, tone: BLD.tone, seoScore: BLD.seoScore, perf
  });
  localStorage.setItem(key, JSON.stringify(list.slice(0,200)));
  document.getElementById('perf-result').innerHTML = '<div style="padding:10px;background:#eafbe8;border-radius:10px;color:#2f7a30;font-size:13px;font-weight:800">📈 성과 기록됨 · 기록 누적 ' + list.length + '건</div>';
}
async function bldPerfAnalyze(){
  const key = 'uc_bld_perf';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  if(list.length < 3){ alert('최소 3건 이상 성과 기록이 필요해요'); return; }
  try{
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    const sys = '콘텐츠 성과 데이터를 분석해서 잘된 패턴을 찾아 한국어로 3줄 이내로 요약. 다음 콘텐츠 추천 설정 1문장 포함.';
    const res = await APIAdapter.callWithFallback(sys, JSON.stringify(list.slice(0,30)), { maxTokens:800 });
    document.getElementById('perf-result').innerHTML =
      '<div style="padding:12px;background:#fff5fa;border:1px solid var(--line-strong);border-radius:10px;font-size:13px;line-height:1.7">🤖 <b>AI 분석</b><br>' +
      res.replace(/\n/g,'<br>') + '</div>';
  }catch(e){ alert('❌ ' + e.message); }
}

/* ═══════════════════════════════════════════════════════════
   다른 5개 빌더 (뉴스레터·웹툰·SNS·전자책·랜딩)
   AI 생성 → 해당 캔버스에 HTML 미리보기
   ═══════════════════════════════════════════════════════════ */
async function _bldGenGeneric(canvasId, sys, user, renderer){
  const status = document.getElementById('mz-status');
  status.textContent = '⏳ 생성 중...';
  try{
    if (typeof APIAdapter === 'undefined') throw new Error('api-adapter.js 미로드');
    {const v=localStorage.getItem('uc_claude_key'); if(v) APIAdapter.setApiKey('claude',v);}
    {const v=localStorage.getItem('uc_openai_key'); if(v) APIAdapter.setApiKey('openai',v);}
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens: 4500 });
    const html = renderer(res);
    document.getElementById(canvasId).innerHTML = html;
    document.getElementById('mz-out').value = res;
    status.textContent = '✅ 생성 완료';
  }catch(e){ status.textContent = '❌ ' + e.message; alert('❌ ' + e.message); }
}
function _safeJsonBlock(s){ const m = s.match(/\{[\s\S]*\}|\[[\s\S]*\]/); if(!m) return null; try{ return JSON.parse(m[0]); }catch(_){ return null; } }

async function bldGenerateNewsletter(){
  const topic = document.getElementById('nl-topic').value.trim();
  const tpl = document.getElementById('nl-tpl').value;
  const seg = document.getElementById('nl-segment').value;
  if(!topic){ alert('주제를 입력해주세요'); return; }
  BLD.topic = topic;
  const sys = '뉴스레터 HTML 작성. 템플릿 스타일: ' + tpl + ' / 세그먼트: ' + seg + ' / JSON 출력: {"subject":"제목","body":"<div>...</div>"}. body 는 인라인 style 사용한 이메일 호환 HTML.';
  await _bldGenGeneric('nl-canvas', sys, '주제: ' + topic, (res) => {
    const j = _safeJsonBlock(res);
    if(!j) return '<div class="bld-empty">생성 실패: ' + res.slice(0,200) + '</div>';
    return '<p><b>📧 Subject:</b> ' + (j.subject||'') + '</p>' + (j.body||'');
  });
}
async function bldGenerateWebtoon(){
  const topic = document.getElementById('wt-topic').value.trim();
  const c1 = document.getElementById('wt-char1').value.trim();
  const c2 = document.getElementById('wt-char2').value.trim();
  if(!topic){ alert('주제를 입력해주세요'); return; }
  BLD.topic = topic;
  const sys = '5칸 웹툰 구조 JSON 배열: [{"panel":1~5,"scene":"씬 묘사","dialogue":"대사","sfx":"효과음"}]';
  const user = '주제: ' + topic + '\n캐릭터1: ' + c1 + '\n캐릭터2: ' + c2;
  await _bldGenGeneric('wt-canvas', sys, user, (res) => {
    const arr = _safeJsonBlock(res);
    if(!Array.isArray(arr)) return '<div class="bld-empty">생성 실패</div>';
    return arr.map(p => '<div style="padding:14px;margin:10px 0;border:2px solid var(--line);border-radius:12px;background:#fff"><b>🎨 칸 ' + p.panel + '</b><p style="font-size:12px;color:var(--sub);margin:6px 0">씬: ' + p.scene + '</p><p style="font-size:13px;margin:6px 0"><b>💬</b> ' + (p.dialogue||'') + '</p>' + (p.sfx ? '<p style="font-size:11px;color:var(--warn)">🔊 ' + p.sfx + '</p>' : '') + '</div>').join('');
  });
}
async function bldGenerateSns(){
  const topic = document.getElementById('sns-topic').value.trim();
  const count = parseInt(document.getElementById('sns-count').value,10);
  if(!topic){ alert('주제를 입력해주세요'); return; }
  BLD.topic = topic;
  const sys = count + '장 인스타 카드뉴스 JSON 배열: [{"slide":1,"title":"","text":"120자 이내"}]';
  await _bldGenGeneric('sns-canvas', sys, '주제: ' + topic, (res) => {
    const arr = _safeJsonBlock(res);
    if(!Array.isArray(arr)) return '<div class="bld-empty">생성 실패</div>';
    return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px">' +
      arr.map(s => '<div style="aspect-ratio:1;padding:14px;background:linear-gradient(135deg,#fff5fa,#f7f4ff);border-radius:14px;border:1px solid var(--line);display:flex;flex-direction:column;gap:6px"><b style="font-size:11px;color:var(--pink-deep)">SLIDE ' + s.slide + '</b><div style="font-size:14px;font-weight:900">' + (s.title||'') + '</div><div style="font-size:11.5px;line-height:1.5">' + (s.text||'') + '</div></div>').join('') +
    '</div>';
  });
}
async function bldGenerateEbook(){
  const title = document.getElementById('eb-title').value.trim();
  const ch = parseInt(document.getElementById('eb-chapters').value,10);
  const plat = document.getElementById('eb-platform').value;
  if(!title){ alert('책 제목을 입력해주세요'); return; }
  BLD.topic = title;
  const sys = '전자책 ' + ch + '챕터 구조 JSON: {"cover":"표지 카피","toc":["1장..","2장.."],"chapters":[{"title":"","summary":"","body":"600~800자"}]}. 플랫폼 최적화: ' + plat;
  await _bldGenGeneric('eb-canvas', sys, '책 제목: ' + title, (res) => {
    const j = _safeJsonBlock(res);
    if(!j) return '<div class="bld-empty">생성 실패</div>';
    let html = '<div style="background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;padding:40px 20px;border-radius:14px;text-align:center;margin-bottom:14px"><h2 style="margin:0">📚 ' + title + '</h2><p style="margin:8px 0 0">' + (j.cover||'') + '</p></div>';
    html += '<div style="padding:14px;background:#fff5fa;border-radius:12px;margin-bottom:14px"><b>📑 목차</b><ol>' + (j.toc||[]).map(t => '<li>' + t + '</li>').join('') + '</ol></div>';
    html += (j.chapters||[]).map((c,i) => '<div style="padding:16px;border:1px solid var(--line);border-radius:12px;margin:10px 0"><h3 style="margin:0 0 6px;color:var(--pink-deep)">' + (i+1) + '장. ' + c.title + '</h3><p style="font-size:12px;color:var(--sub);margin:0 0 10px">' + (c.summary||'') + '</p><p style="line-height:1.8">' + (c.body||'').replace(/\n/g,'<br>') + '</p></div>').join('');
    return html;
  });
}
async function bldGenerateLanding(){
  const name = document.getElementById('lp-name').value.trim();
  const tag = document.getElementById('lp-tagline').value.trim();
  const cta = document.getElementById('lp-cta').value.trim();
  const url = document.getElementById('lp-url').value.trim() || '#';
  const sec = parseInt(document.getElementById('lp-sections').value,10);
  if(!name){ alert('서비스명을 입력해주세요'); return; }
  BLD.topic = name;
  const sys = '링크인바이오 랜딩페이지 ' + sec + '섹션 JSON 배열: [{"section":"헤더|소개|서비스|후기|CTA","title":"","content":"","icon":"이모지"}]';
  await _bldGenGeneric('lp-canvas', sys, '서비스: ' + name + '\n태그라인: ' + tag + '\nCTA: ' + cta, (res) => {
    const arr = _safeJsonBlock(res);
    if(!Array.isArray(arr)) return '<div class="bld-empty">생성 실패</div>';
    const bk = loadBrandkit();
    return '<div style="max-width:420px;margin:0 auto;background:#fff">' +
      '<div style="padding:40px 20px;background:linear-gradient(135deg,' + (bk.color||'#FF6B9D') + ',#9181ff);color:#fff;text-align:center"><h1 style="margin:0;font-size:24px">' + name + '</h1><p style="margin:8px 0 16px">' + tag + '</p><a href="' + url + '" style="display:inline-block;padding:12px 24px;background:#fff;color:' + (bk.color||'#FF6B9D') + ';border-radius:999px;font-weight:900;text-decoration:none">' + cta + '</a></div>' +
      arr.map((s,i) => '<section style="padding:28px 20px;text-align:center;border-bottom:1px solid #f3e4ee"><div style="font-size:36px">' + (s.icon||'✨') + '</div><h2 style="margin:8px 0;font-size:18px">' + (s.title||'') + '</h2><p style="color:var(--sub);line-height:1.7">' + (s.content||'') + '</p></section>').join('') +
    '</div>';
  });
}

/* ═══════════════════════════════════════════════════════════
   호환 shim — 외부에서 참조하는 함수들 (보관함 전송 등)
   ═══════════════════════════════════════════════════════════ */
function mzCopy(){
  const t = document.getElementById('mz-out').value;
  if (!t) { alert('복사할 내용이 없습니다.'); return; }
  navigator.clipboard.writeText(t).then(() => {
    document.getElementById('mz-status').textContent = '📋 클립보드에 복사되었습니다.';
  });
}
function mzSave(){ bldSaveLibrary(); }
function mzSendToMedia(){
  const t = document.getElementById('mz-out').value;
  if (!t) { alert('먼저 콘텐츠를 생성해주세요.'); return; }
  const key = 'hub_scripts_v1';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  list.unshift({ source:'builder', lang:'ko', text:t, at:Date.now(), meta:{ type: BLD.type, topic: BLD.topic } });
  localStorage.setItem(key, JSON.stringify(list.slice(0,30)));
  if (confirm('🎬 미디어 엔진으로 전송했습니다.\n\n지금 미디어 엔진으로 이동할까요?')) {
    location.href = 'engines/media/index.html?tab=oneclick';
  }
}
// 레거시 이름 (다른 코드가 참조)
function generateMonetize(){ bldGenerateBlog(); }
function openMonetize(card){ openBuilder(card); }

// fadeInUp keyframes 등록
(function(){
  if(document.getElementById('bld-kfs')) return;
  const st = document.createElement('style');
  st.id = 'bld-kfs';
  st.textContent = '@keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}';
  document.head.appendChild(st);
})();


