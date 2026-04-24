/* ==================================================
   share.js  -- 공유 센터 + 공유 버튼 + 프린트/PDF
   ================================================== */

/* ═══════════════════════════════════════════════
   📤 공유 센터 + 공유 버튼 + 프린트/PDF
   =============================================== */
(function(){
  const LS_TMPL_KA = 'share_tmpl_kakao_v1';
  const LS_TMPL_LI = 'share_tmpl_line_v1';
  const DEFAULT_KAKAO = '안녕하세요!\n오늘 생성한 대본 공유드려요 😊\n\n📌 제목: {제목}\n📅 날짜: {날짜}\n📂 카테고리: {카테고리}\n\n내용:\n{내용200}\n\n...전체 내용은 첨부 파일 확인해주세요!';
  const DEFAULT_LINE  = 'お疲れ様です！\n本日作成した台本を共有します 😊\n\nタイトル: {제목}\n日付: {날짜}\n\n{내용200}';

  const CAT_LABEL = {script:'대본', media:'미디어', shorts:'숏츠', music:'음악', trans:'번역',
                     blog:'블로그', public:'공공기관', smb:'소상공인', edu:'학습', psy:'심리운세', other:'기타'};

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function by(id){ return document.getElementById(id); }
  function getLib(){
    try{ return JSON.parse(localStorage.getItem('lib_history_v1')||'[]'); }catch(_){ return []; }
  }
  function getItem(id){ return getLib().find(x=>x.id===id) || null; }
  function fmtD(ts){
    const d = new Date(ts); const p=n=>String(n).padStart(2,'0');
    return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())}`;
  }
  function fmtFilename(title){
    const t = (title||'결과').replace(/[\\\/:*?"<>|]/g,'_').slice(0,40);
    const d = new Date(); const p=n=>String(n).padStart(2,'0');
    return `${t}_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}`;
  }
  function toast(msg){
    if(typeof libToast==='function'){ libToast(msg); return; }
    alert(msg);
  }

  /* ─ 치환 ─ */
  function applyTemplate(tpl, item){
    const cat = CAT_LABEL[item.category]||'기타';
    const body = (item.text||'').replace(/\n{3,}/g,'\n\n');
    const b200 = body.length>200 ? body.slice(0,200)+'...' : body;
    return tpl
      .replace(/\{제목\}/g, item.title||'(제목 없음)')
      .replace(/\{날짜\}/g, fmtD(item.createdAt||Date.now()))
      .replace(/\{카테고리\}/g, cat)
      .replace(/\{내용200\}/g, b200)
      .replace(/\{내용\}/g, body);
  }

  /* ─ 공유 액션 핸들러 (단일 아이템 기준) ─ */
  async function doShare(kind, item){
    if(!item){ alert('공유할 결과가 없어요.'); return; }
    if(kind==='copy'){
      await navigator.clipboard.writeText(item.text);
      toast('📋 복사됐어요!');
      return;
    }
    if(kind==='save' || kind==='library'){
      // 이미 보관함에 있으면 그대로, 없으면 saveResult
      if(typeof window.Library !== 'undefined'){
        const exist = getItem(item.id);
        if(!exist){ window.Library.saveResult({text:item.text, title:item.title, category:item.category, lang:item.lang, meta:item.meta||{}}); }
        else { toast('✅ 보관함에 저장됐어요!'); }
      }
      return;
    }
    if(kind==='txt'){
      downloadTxt(item);
      return;
    }
    if(kind==='print' || kind==='pdf'){
      preparePrintArea(item);
      setTimeout(()=>window.print(), 80);
      return;
    }
    if(kind==='link'){
      const tpl = localStorage.getItem(LS_TMPL_KA) || DEFAULT_KAKAO;
      const text = applyTemplate(tpl, item);
      await navigator.clipboard.writeText(text);
      toast('🔗 공유용 텍스트 복사됐어요!');
      return;
    }
    if(kind==='x' || kind==='twitter'){
      const body = (item.text||'').replace(/\s+/g,' ').slice(0,220);
      const msg = `${item.title||''}\n${body}${(item.text||'').length>220?'...':''}`;
      const url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(msg);
      window.open(url, '_blank', 'width=600,height=560');
      return;
    }
    if(kind==='line'){
      const tpl = localStorage.getItem(LS_TMPL_LI) || DEFAULT_LINE;
      const text = applyTemplate(tpl, item);
      // LINE social plugin share URL
      await navigator.clipboard.writeText(text).catch(()=>{});
      const url = 'https://social-plugins.line.me/lineit/share?text=' + encodeURIComponent(text);
      window.open(url, '_blank', 'width=600,height=560');
      toast('📱 라인 공유 창이 열렸어요 (내용은 클립보드에도 복사됨)');
      return;
    }
    if(kind==='kakao'){
      const tpl = localStorage.getItem(LS_TMPL_KA) || DEFAULT_KAKAO;
      const text = applyTemplate(tpl, item);
      // 카카오 SDK 미설치 환경 — 복사 후 앱 열기 시도 + 안내
      try{ await navigator.clipboard.writeText(text); }catch(_){}
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if(isMobile){
        toast('💬 내용이 복사됐어요! 카카오톡 앱을 열고 붙여넣기 하세요.');
        // 모바일에서 kakao 앱 열기 시도 (kakaolink 스킴은 앱별로 다름 → 안내만)
      } else {
        alert('💬 내용이 클립보드에 복사됐어요!\n\n카카오톡 데스크톱 앱(또는 모바일)에서 원하는 대화방을 열어 붙여넣기 하세요.');
      }
      return;
    }
  }

  function downloadTxt(item){
    const blob = new Blob([buildTxtPayload(item)], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fmtFilename(item.title||'결과')+'.txt';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 500);
    toast('📝 TXT 파일 저장됨!');
  }
  function buildTxtPayload(item){
    const cat = CAT_LABEL[item.category]||'기타';
    const d = fmtD(item.createdAt||Date.now());
    return `[${item.title||'(제목 없음)'}]\n카테고리: ${cat} · 언어: ${item.lang||'ko'} · 날짜: ${d}\n────────────────────────\n\n${item.text||''}\n\n\n— 통합콘텐츠 생성기`;
  }

  /* ─ 프린트 영역 구성 ─ */
  function preparePrintArea(itemOrItems){
    const box = by('printArea'); if(!box) return;
    const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
    const titleOv = (by('sh-pdf-title')||{}).value || '';
    const incDate = !by('sh-pdf-date') || by('sh-pdf-date').checked;
    const incCat  = !by('sh-pdf-cat')  || by('sh-pdf-cat').checked;
    const incLogo = by('sh-pdf-logo')  && by('sh-pdf-logo').checked;
    const incPage = !by('sh-pdf-page') || by('sh-pdf-page').checked;
    const layout  = (document.querySelector('input[name="shLayout"]:checked')||{}).value || 'plain';
    const d = new Date();
    const header = `<div class="print-page">
      ${incLogo?`<div style="font-weight:900;color:#ef6fab;margin-bottom:6px">🎨 통합콘텐츠 생성기</div>`:''}
      <h1 style="${layout==='color'?'background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;padding:12px 16px;border-radius:10px;border:none':''}">${esc(titleOv || (items.length>1 ? '통합콘텐츠 생성 결과 모음' : (items[0].title||'결과')))}</h1>
      <div class="meta">
        ${incDate?`생성일: ${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} · `:''}
        총 ${items.length}건${incCat?` · 카테고리: ${items.map(x=>CAT_LABEL[x.category]||'기타').filter((v,i,a)=>a.indexOf(v)===i).join(', ')}`:''}
      </div>`;
    const sections = items.map((it,i)=>`<div class="sect">
      <h2 style="font-size:16px;margin:0 0 4px">${i+1}. ${esc(it.title||'(제목 없음)')}</h2>
      <div class="meta">${incCat?(CAT_LABEL[it.category]||'기타')+' · ':''}${fmtD(it.createdAt||Date.now())} · ${it.lang||'ko'}</div>
      <pre>${esc(it.text||'')}</pre>
    </div>`).join('');
    const footer = `<footer>${incPage?'— ':''}생성: 통합콘텐츠 생성기</footer></div>`;
    box.innerHTML = header + sections + footer;
  }

  /* ─ 렌더: 공유센터 ─ */
  window.renderShareHub = function(){
    populateQuickPick();
    renderBulkList();
    loadTemplates();
  };

  function populateQuickPick(){
    const el = by('sh-quick-pick'); if(!el) return;
    const list = getLib();
    if(!list.length){
      el.innerHTML = '<option value="">(보관함이 비어있어요 — 먼저 결과를 생성해주세요)</option>';
      return;
    }
    el.innerHTML = list.map(x=>`<option value="${esc(x.id)}">${fmtD(x.createdAt)} · ${esc((CAT_LABEL[x.category]||'기타'))} · ${esc((x.title||'').slice(0,50))}</option>`).join('');
  }
  window.shShare = async function(kind){
    const id = (by('sh-quick-pick')||{}).value;
    const item = getItem(id);
    if(!item){ alert('먼저 보관함에서 결과를 선택해주세요.'); return; }
    await doShare(kind, item);
  };

  /* ─ 묶음 내보내기 ─ */
  function renderBulkList(){
    const box = by('sh-bulk-list'); if(!box) return;
    const list = getLib();
    if(!list.length){
      box.innerHTML = '<div style="padding:10px;color:var(--sub);font-size:12px">보관함이 비어있어요.</div>';
      return;
    }
    box.innerHTML = list.map(x=>`<label class="sh-bulk-item">
      <input type="checkbox" class="sh-bulk-cb" value="${esc(x.id)}" onchange="shUpdateBulkCount()">
      <strong>${esc((x.title||'').slice(0,60))}</strong>
      <span>${esc(CAT_LABEL[x.category]||'기타')} · ${fmtD(x.createdAt)}</span>
    </label>`).join('');
    shUpdateBulkCount();
  }
  document.addEventListener('change', function(e){
    if(e.target && e.target.name==='shFmt'){
      document.querySelectorAll('.sh-fmt label').forEach(l=>l.classList.remove('on'));
      e.target.parentElement.classList.add('on');
    }
    if(e.target && e.target.name==='shLayout'){
      // shLayout는 sh-section 안에 있는 sh-fmt 중 두번째 블록
      e.target.closest('.sh-fmt').querySelectorAll('label').forEach(l=>l.classList.remove('on'));
      e.target.parentElement.classList.add('on');
    }
  });
  window.shUpdateBulkCount = function(){
    const n = document.querySelectorAll('.sh-bulk-cb:checked').length;
    const el = by('sh-bulk-count'); if(el) el.textContent = `선택한 것: ${n}개`;
  };
  window.shBulkExport = function(){
    const ids = Array.from(document.querySelectorAll('.sh-bulk-cb:checked')).map(x=>x.value);
    if(!ids.length){ alert('하나 이상 선택해주세요.'); return; }
    const items = ids.map(getItem).filter(Boolean);
    const fmt = (document.querySelector('input[name="shFmt"]:checked')||{}).value || 'pdf-one';
    if(fmt==='pdf-one'){
      preparePrintArea(items);
      setTimeout(()=>window.print(), 80);
    } else if(fmt==='txt-each'){
      items.forEach(it => downloadTxt(it));
    } else if(fmt==='txt-one'){
      const body = items.map((it,i)=>`━━━ ${i+1}. ${it.title||'(제목 없음)'} ━━━\n${buildTxtPayload(it)}`).join('\n\n\n');
      const blob = new Blob([body], {type:'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fmtFilename('통합_묶음')+'.txt';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 500);
      toast('📦 묶음 TXT 저장됨!');
    }
  };

  /* ─ PDF 미리보기 ─ */
  window.shPdfPreview = function(){
    const id = (by('sh-quick-pick')||{}).value;
    const item = getItem(id);
    if(!item){ alert('먼저 섹션1에서 결과를 선택해주세요.'); return; }
    preparePrintArea(item);
    const w = window.open('', '_blank', 'width=800,height=900');
    if(!w){ alert('팝업 차단을 해제해주세요.'); return; }
    const html = by('printArea').innerHTML;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>PDF 미리보기</title>
      <style>
        body{font-family:Pretendard,Inter,'Noto Sans KR',sans-serif;padding:0;margin:0;background:#f5f5f5}
        .print-page{background:#fff;max-width:780px;margin:20px auto;padding:32px 36px;box-shadow:0 8px 26px rgba(0,0,0,.08);border-radius:4px}
        .print-page h1{font-size:22px;margin:0 0 6px;border-bottom:2px solid #ef6fab;padding-bottom:6px}
        .print-page h2{font-size:16px;margin:0 0 4px}
        .print-page .meta{font-size:11px;color:#666;margin-bottom:18px}
        .print-page pre{white-space:pre-wrap;font-size:13px;line-height:1.85;font-family:inherit;margin:0}
        .print-page .sect{margin-top:22px;padding-top:14px;border-top:1px dashed #ccc}
        .print-page footer{margin-top:24px;padding-top:8px;border-top:1px solid #ddd;font-size:10px;color:#999;text-align:right}
      </style></head><body>${html}
      <div style="text-align:center;padding:14px">
        <button onclick="window.print()" style="padding:10px 22px;border:none;border-radius:999px;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;font-weight:800;cursor:pointer">🖨 인쇄 / PDF로 저장</button>
      </div></body></html>`);
    w.document.close();
  };

  /* ─ 템플릿 ─ */
  function loadTemplates(){
    const ka = by('sh-tmpl-kakao'); const li = by('sh-tmpl-line');
    if(ka) ka.value = localStorage.getItem(LS_TMPL_KA) || DEFAULT_KAKAO;
    if(li) li.value = localStorage.getItem(LS_TMPL_LI) || DEFAULT_LINE;
  }
  window.shSaveTemplate = function(k){
    const key = (k==='line')? LS_TMPL_LI : LS_TMPL_KA;
    const el = by(k==='line'?'sh-tmpl-line':'sh-tmpl-kakao');
    if(!el) return;
    localStorage.setItem(key, el.value);
    toast('💾 템플릿 저장됨!');
  };
  window.shResetTemplate = function(k){
    const el = by(k==='line'?'sh-tmpl-line':'sh-tmpl-kakao');
    if(!el) return;
    el.value = (k==='line')? DEFAULT_LINE : DEFAULT_KAKAO;
    localStorage.removeItem(k==='line'? LS_TMPL_LI : LS_TMPL_KA);
    toast('기본값으로 복원됨');
  };
  window.shUseTemplate = async function(k){
    const id = (by('sh-quick-pick')||{}).value;
    const item = getItem(id);
    if(!item){ alert('먼저 섹션1에서 공유할 결과를 선택해주세요.'); return; }
    const tpl = (by(k==='line'?'sh-tmpl-line':'sh-tmpl-kakao')||{}).value;
    const text = applyTemplate(tpl, item);
    await navigator.clipboard.writeText(text).catch(()=>{});
    if(k==='line'){
      const url = 'https://social-plugins.line.me/lineit/share?text=' + encodeURIComponent(text);
      window.open(url, '_blank', 'width=600,height=560');
      toast('📱 라인 창이 열렸고 내용도 복사됐어요!');
    } else {
      toast('💬 템플릿 내용이 복사됐어요! 카카오톡에 붙여넣기 하세요.');
    }
  };

  /* ─ 공유 버튼 바를 라이브러리 카드에 부착 ─ */
  function buildShareBarHtml(id){
    return `<div class="share-bar" data-share-for="${esc(id)}">
      <div class="title">📤 공유하기</div>
      <div class="row">
        <button onclick="Share.fromCard('${esc(id)}','copy')">📋 복사</button>
        <button onclick="Share.fromCard('${esc(id)}','save')">💾 저장</button>
        <button onclick="Share.fromCard('${esc(id)}','print')">🖨 인쇄</button>
      </div>
      <div class="row">
        <button class="ka" onclick="Share.fromCard('${esc(id)}','kakao')">💬 카톡</button>
        <button class="li" onclick="Share.fromCard('${esc(id)}','line')">📱 라인</button>
        <button class="x"  onclick="Share.fromCard('${esc(id)}','x')">🐦 X</button>
      </div>
      <div class="row">
        <button class="pdf" onclick="Share.fromCard('${esc(id)}','pdf')">📄 PDF</button>
        <button onclick="Share.fromCard('${esc(id)}','txt')">📝 TXT</button>
        <button onclick="Share.fromCard('${esc(id)}','link')">🔗 링크</button>
      </div>
    </div>`;
  }
  function attachShareBars(root){
    if(!root) root = document;
    root.querySelectorAll('.lib-card[data-id]').forEach(card => {
      if(card.querySelector('.share-bar')) return;
      const id = card.dataset.id; if(!id) return;
      const wrap = document.createElement('div');
      wrap.innerHTML = buildShareBarHtml(id);
      card.appendChild(wrap.firstChild);
    });
  }
  // 라이브러리 카드 컨테이너 MutationObserver
  function installObservers(){
    ['libRecentCards','libFavCards','libTrashCards','libProjOpen'].forEach(id=>{
      const el = document.getElementById(id);
      if(!el) return;
      const mo = new MutationObserver(()=>attachShareBars(el));
      mo.observe(el, {childList:true, subtree:true});
      attachShareBars(el);
    });
  }

  /* ─ 플로팅 공유 FAB ─ */
  const fab = document.createElement('button');
  fab.id='shareFab'; fab.innerHTML='📤'; fab.title='빠른 공유';
  fab.onclick = function(){
    if(typeof window.__hubGoCategory==='function'){
      window.__hubGoCategory('share'); window.scrollTo({top:0,behavior:'smooth'});
    }
  };
  document.body.appendChild(fab);
  function toggleFab(){
    const show = getLib().length > 0;
    fab.classList.toggle('on', show);
  }
  window.addEventListener('storage', toggleFab);

  /* ─ 공개 API ─ */
  window.Share = {
    doShare,
    fromCard: function(id, kind){ const it = getItem(id); if(!it){ alert('결과를 찾을 수 없어요'); return; } return doShare(kind, it); },
    openCenter: function(){ if(typeof window.__hubGoCategory==='function') window.__hubGoCategory('share'); }
  };

  function boot(){
    installObservers();
    toggleFab();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  console.log('✅ 📤 공유센터 + 공유 버튼 로드 완료');
})();
