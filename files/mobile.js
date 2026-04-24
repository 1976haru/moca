<script>
/* ═══════════════════════════════════════════════
   💰 상단 비용 바 · ⚙️ 설정 모드 구현
   =============================================== */

/* ─── 잔액 확인 링크 ─── */
function openBalanceLinks(){
  const html = '🔗 각 서비스 콘솔에서 정확한 잔액을 확인할 수 있어요.\n\n' +
    '🟣 Claude:  console.anthropic.com\n' +
    '🟢 OpenAI:  platform.openai.com/usage\n' +
    '🔵 Gemini:  aistudio.google.com\n\n' +
    '지금 Claude 콘솔을 열까요?';
  if (confirm(html)) window.open('https://console.anthropic.com/', '_blank');
}

/* ─── API 키 누락 토스트 (alert 대체) ─── */
window.apiKeyMissingToast = function(providerName){
  var t = document.getElementById('api-miss-toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'api-miss-toast';
    t.style.cssText = 'position:fixed;right:16px;top:16px;z-index:9999;background:#2b2430;color:#fff;padding:12px 16px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.25);font-size:13px;font-weight:800;max-width:340px;opacity:0;transition:opacity .2s;display:flex;flex-direction:column;gap:8px';
    document.body.appendChild(t);
  }
  t.innerHTML = '⚠️ ' + (providerName ? providerName + ' ' : '') + 'API 키가 없어요.<br><span style="font-weight:600;font-size:12px;opacity:.85">설정에서 입력해주세요</span>' +
    '<button type="button" onclick="(function(){var tb=document.querySelector(\'.toptab[data-mode=\\\'setting\\\']\');if(tb){tb.click();}var el=document.getElementById(\'api-miss-toast\');if(el)el.style.opacity=\'0\';})()" style="padding:7px 12px;background:var(--grad-main);color:#fff;border:none;border-radius:999px;font-weight:900;font-size:12px;cursor:pointer">⚙️ 설정으로 이동</button>';
  t.style.opacity = '1';
  clearTimeout(window._apiMissTimer);
  window._apiMissTimer = setTimeout(function(){ t.style.opacity='0'; }, 4500);
};

/* ─── 비용 바 업데이트 ─── */
function updateCostBar(){
  if (typeof CostTracker === 'undefined') return;
  const s = CostTracker.getStatus();
  const bar = document.getElementById('costBar'); if (!bar) return;
  const today = document.getElementById('cb-today');
  const month = document.getElementById('cb-month');
  const pct   = document.getElementById('cb-pct');
  const aiDot = document.getElementById('cb-ai-dot');
  const aiName= document.getElementById('cb-ai-name');

  if (today) today.textContent = Math.round(s.todayKRW).toLocaleString() + '원';
  if (month) month.textContent = Math.round(s.monthKRW).toLocaleString() + '원';
  if (pct)   pct.textContent   = '(' + Math.round(s.usedPct) + '%)';

  // 상태 색상
  bar.classList.remove('warn','block');
  if (s.level === 'warn') bar.classList.add('warn');
  if (s.level === 'block') bar.classList.add('block');

  // 연결된 AI 표시
  const provider = localStorage.getItem('uc_ai_provider') || 'claude';
  const keys = {
    claude: localStorage.getItem('uc_claude_key'),
    openai: localStorage.getItem('uc_openai_key'),
    gemini: localStorage.getItem('uc_gemini_key')
  };
  const names = {claude:'🟣 Claude', openai:'🟢 OpenAI', gemini:'🔵 Gemini'};
  if (aiName && aiDot) {
    if (keys[provider]) { aiName.textContent = names[provider]+' 연결됨'; aiDot.textContent='🟢'; }
    else { aiName.textContent = (names[provider]||'AI')+' 미연결'; aiDot.textContent='🔴'; }
  }
}
if (typeof CostTracker !== 'undefined') {
  CostTracker.onUpdate(updateCostBar);
}
updateCostBar();

// 390px 모바일: 햄버거 버튼으로 사이드바 토글
(function setupMobileSidebarToggle(){
  if (document.querySelector('.mobile-sidebar-toggle')) return;
  var btn = document.createElement('button');
  btn.className = 'mobile-sidebar-toggle';
  btn.type = 'button';
  btn.textContent = '☰';
  btn.setAttribute('aria-label','메뉴 열기');
  btn.addEventListener('click', function(){ document.body.classList.toggle('sidebar-open'); });
  document.body.appendChild(btn);
  // 사이드바 항목 클릭 시 자동 닫힘
  document.addEventListener('click', function(e){
    if(!document.body.classList.contains('sidebar-open')) return;
    var sb = document.getElementById('sidebar');
    var toggle = document.querySelector('.mobile-sidebar-toggle');
    // 사이드바 바깥 클릭 시 닫힘 (토글 버튼 제외)
    if(sb && !sb.contains(e.target) && toggle && !toggle.contains(e.target)){
      document.body.classList.remove('sidebar-open');
    } else if(sb && sb.contains(e.target) && e.target.closest('button,a')){
      document.body.classList.remove('sidebar-open');
    }
  });
})();

/* ═══════════════════════════════════════════════════════════
   📱 모바일 하단 네비게이션 + 키보드 감지 + 스와이프 + 이미지 long-press
   ═══════════════════════════════════════════════════════════ */
(function setupMobileNav(){
  if(document.getElementById('mobileNav')) return;
  var nav = document.createElement('div');
  nav.id = 'mobileNav';
  nav.className = 'mobile-nav';
  nav.innerHTML =
    '<button data-nav="home"    class="on"><span class="ico">🏠</span><span class="lbl">홈</span></button>' +
    '<button data-nav="create"><span class="ico">✍️</span><span class="lbl">생성</span></button>' +
    '<button data-nav="library"><span class="ico">📁</span><span class="lbl">보관함</span></button>' +
    '<button data-nav="setting"><span class="ico">⚙️</span><span class="lbl">설정</span></button>';
  document.body.appendChild(nav);
  nav.querySelectorAll('button').forEach(function(btn){
    btn.addEventListener('click', function(){
      nav.querySelectorAll('button').forEach(function(x){ x.classList.remove('on'); });
      btn.classList.add('on');
      var tab = btn.getAttribute('data-nav');
      if(tab === 'home'){
        state.category = null; state.mode = 'normal';
        document.querySelectorAll('.toptab').forEach(function(t){ if(t.dataset.mode) t.classList.toggle('on', t.dataset.mode === 'normal'); });
        if(typeof renderAll === 'function') renderAll();
        document.getElementById('oneHub')?.scrollIntoView({behavior:'smooth', block:'start'});
      } else if(tab === 'create'){
        document.getElementById('one-input')?.focus();
        document.getElementById('oneHub')?.scrollIntoView({behavior:'smooth', block:'start'});
      } else if(tab === 'library'){
        state.category = 'library'; state.mode = 'normal';
        if(typeof renderAll === 'function') renderAll();
      } else if(tab === 'setting'){
        var t = document.querySelector('.toptab[data-mode="setting"]');
        if(t) t.click();
      }
    });
  });
})();

/* 키보드 열림/닫힘 감지 (모바일) — input/textarea focus 기준 */
(function keyboardDetect(){
  if(!('ontouchstart' in window)) return;
  var ifocus = function(){ document.body.classList.add('kb-open'); };
  var iblur  = function(){ document.body.classList.remove('kb-open'); };
  document.addEventListener('focusin',  function(e){ if(['INPUT','TEXTAREA'].includes(e.target.tagName)) ifocus(); });
  document.addEventListener('focusout', function(e){ if(['INPUT','TEXTAREA'].includes(e.target.tagName)) setTimeout(iblur, 150); });
})();

/* 스와이프 제스처 (결과 영역) — 좌우 스와이프로 이력 탐색 */
(function swipeResult(){
  var startX = 0, startY = 0, active = false;
  document.addEventListener('touchstart', function(e){
    var t = e.target.closest('.uni-result, .one-result, .uni-body');
    if(!t) return;
    active = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', function(e){
    if(!active) return;
    active = false;
    var dx = (e.changedTouches[0].clientX - startX);
    var dy = (e.changedTouches[0].clientY - startY);
    if(Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if(dx < 0){ if(typeof uniNavigate === 'function') uniNavigate(+1); } // 왼쪽 스와이프 → 다음
    else      { if(typeof uniNavigate === 'function') uniNavigate(-1); } // 오른쪽 스와이프 → 이전
  }, { passive: true });
})();
// 결과 히스토리 보관
window._uniHistory = [];
window._uniHistoryIdx = -1;
var _origShowUniRes = window.showUnifiedResult;
window.showUnifiedResult = function(opts){
  if(_origShowUniRes) _origShowUniRes(opts);
  try{
    window._uniHistory.push(opts);
    if(window._uniHistory.length > 20) window._uniHistory.shift();
    window._uniHistoryIdx = window._uniHistory.length - 1;
  }catch(_){}
};
function uniNavigate(delta){
  var h = window._uniHistory||[];
  if(!h.length) return;
  var next = Math.max(0, Math.min(h.length-1, window._uniHistoryIdx + delta));
  if(next === window._uniHistoryIdx) return;
  window._uniHistoryIdx = next;
  if(_origShowUniRes) _origShowUniRes(h[next]);
}

/* 이미지 long-press 저장 팝업 (모바일) */
(function imageLongPress(){
  var timer = null, target = null;
  document.addEventListener('touchstart', function(e){
    var img = e.target.closest('.uni-body img, .bld-block-img img, .bld-canvas img');
    if(!img) return;
    target = img;
    timer = setTimeout(function(){
      if(!target) return;
      if(confirm('🖼 이 이미지를 저장할까요?')){
        var a = document.createElement('a');
        a.href = target.src; a.download = 'image.png'; a.target = '_blank'; a.click();
      }
    }, 600);
  }, { passive: true });
  document.addEventListener('touchend', function(){ clearTimeout(timer); target = null; });
  document.addEventListener('touchmove', function(){ clearTimeout(timer); target = null; });
})();

/* ═══════════════════════════════════════════════════════════
   📦 공통 미디어 바 (모든 카테고리 결과 아래 자동 부착)
   ═══════════════════════════════════════════════════════════ */
function showMediaBar(anchorEl, getText, category){
  if(!anchorEl) return;
  // 이미 있으면 재사용
  let bar = anchorEl.parentElement?.querySelector(':scope > .media-bar') ||
            anchorEl.parentElement?.nextElementSibling?.matches?.('.media-bar') && anchorEl.parentElement.nextElementSibling;
  if(bar) return bar;
  bar = document.createElement('div');
  bar.className = 'media-bar';
  bar.style.cssText = 'margin-top:10px;padding:12px;background:linear-gradient(135deg,#fff5fa,#f7f4ff);border:1px solid var(--line-strong);border-radius:14px;font-size:13px';
  bar.innerHTML =
    '<div style="margin-bottom:10px">' +
      '<span style="font-size:13px;font-weight:900;color:#b14d82">📦 이 글에 추가할까요?</span>' +
      '<span style="font-size:11px;color:var(--sub);margin-left:8px">완성도를 높여요!</span>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">' +
      '<button onclick="_mediaBarAddImages(this,\'' + (category||'general') + '\')" style="padding:10px 6px;border:2px solid #f0c8de;border-radius:12px;background:#fff;font-weight:800;font-size:12px;cursor:pointer;color:#b14d82;line-height:1.4">' +
        '🖼 이미지 추가<br><span style="font-size:10px;font-weight:400;color:var(--sub)">AI 자동 생성</span>' +
      '</button>' +
      '<button onclick="_mediaBarToShorts(this,\'' + (category||'general') + '\')" style="padding:10px 6px;border:2px solid #d4b5f5;border-radius:12px;background:#fff;font-weight:800;font-size:12px;cursor:pointer;color:#6030C0;line-height:1.4">' +
        '🎬 영상으로<br><span style="font-size:10px;font-weight:400;color:var(--sub)">자동숏츠 연결</span>' +
      '</button>' +
      '<button onclick="_mediaBarAddImages(this,\'' + (category||'general') + '\')" style="padding:10px 6px;border:2px solid transparent;border-radius:12px;background:linear-gradient(135deg,#ef6fab,#9181ff);font-weight:800;font-size:12px;cursor:pointer;color:#fff;line-height:1.4">' +
        '🖼🎬 전부<br><span style="font-size:10px;font-weight:400;opacity:.85">완전 패키지</span>' +
      '</button>' +
    '</div>' +
    '<div class="media-bar-out" style="margin-top:12px"></div>';
  bar._getText = getText;
  bar._anchor = anchorEl;
  anchorEl.parentElement.insertBefore(bar, anchorEl.nextSibling);
  return bar;
}
function _mediaBarFindBar(btn){ return btn.closest('.media-bar'); }

async function _mediaBarAddImages(btn, category){
  const bar = _mediaBarFindBar(btn);
  const text = typeof bar._getText === 'function' ? bar._getText() : '';
  if(!text){ alert('본문이 비어있어요'); return; }
  const out = bar.querySelector('.media-bar-out');

  // 스타일 선택 UI (prompt 대신)
  const styles = [
    {v:'ghibli warm pastel soft lighting', l:'🌸 지브리', desc:'따뜻하고 감성적'},
    {v:'photorealistic high quality natural lighting', l:'📸 실사', desc:'사진처럼 리얼'},
    {v:'soft watercolor illustration gentle colors', l:'🎨 수채화', desc:'부드럽고 예술적'},
    {v:'clean flat design infographic minimal icons', l:'📊 인포그래픽', desc:'정보형 깔끔'},
    {v:'cute emoji style illustration bright colors', l:'😊 이모지카드', desc:'귀엽고 밝게'},
    {v:'minimal clean illustration simple modern', l:'🖼 미니멀', desc:'심플하게'},
  ];

  // 카테고리별 기본 스타일
  const defaultStyle = {
    public:'clean flat design infographic minimal icons',
    smb:'photorealistic high quality natural lighting',
    edu:'cute emoji style illustration bright colors',
    psy:'minimal clean illustration simple modern',
    translate:'minimal clean illustration simple modern',
  }[category] || 'ghibli warm pastel soft lighting';

  out.innerHTML =
    '<div style="padding:12px;background:#fff;border:1px solid var(--line);border-radius:12px">' +
    '<div style="font-size:12px;font-weight:900;color:#b14d82;margin-bottom:10px">🎨 이미지 스타일 선택</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px">' +
    styles.map(s =>
      '<button onclick="window._mbStyle='' + s.v + '';document.querySelectorAll('.mb-style-btn').forEach(b=>b.style.background='#fff');this.style.background='var(--pink-soft)';this.style.borderColor='var(--pink)'"' +
      ' class="mb-style-btn" style="padding:8px 4px;border:1px solid var(--line);border-radius:10px;background:' + (s.v===defaultStyle?'var(--pink-soft)':'#fff') + ';border-color:' + (s.v===defaultStyle?'var(--pink)':'var(--line)') + ';cursor:pointer;font-size:11px;font-weight:700">' +
      s.l + '<br><span style="font-weight:400;color:var(--sub);font-size:10px">' + s.desc + '</span></button>'
    ).join('') +
    '</div>' +
    '<div style="margin-bottom:10px">' +
    '<div style="font-size:12px;font-weight:900;color:#b14d82;margin-bottom:6px">🎬 영상 추가 (선택)</div>' +
    '<input id="mb-video-url" placeholder="유튜브 URL 또는 직접 찍은 영상 URL 입력 (선택)" style="width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font-size:12px;box-sizing:border-box">' +
    '<div style="font-size:10px;color:var(--sub);margin-top:3px">비워두면 이미지만 생성 · 유튜브 링크 입력시 영상 자동 embed</div>' +
    '</div>' +
    '<button onclick="_mbGenerate('' + category + '')" style="width:100%;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;font-weight:900;font-size:13px;cursor:pointer">✨ 이미지 생성 시작!</button>' +
    '</div>';

  window._mbStyle = defaultStyle;
}

async function _mbGenerate(category){
  const bar = document.querySelector('.media-bar');
  if(!bar) return;
  const text = typeof bar._getText === 'function' ? bar._getText() : '';
  const styleText = window._mbStyle || 'ghibli warm pastel';
  const videoUrl = (document.getElementById('mb-video-url')||{}).value || '';
  const out = bar.querySelector('.media-bar-out');

  out.innerHTML = '<div style="padding:12px;text-align:center;color:#b14d82;font-weight:800">⏳ 이미지 생성 중...<br><span style="font-size:11px;font-weight:400;color:var(--sub)">잠시만 기다려주세요 (약 20~40초)</span></div>';

  try{
    const imgs = await generateImagesForText(text, styleText, category, 3, (done,total) => {
      out.innerHTML = '<div style="padding:12px;text-align:center;color:#b14d82;font-weight:800">⏳ 이미지 ' + done + '/' + total + ' 생성 중...</div>';
    });

    // 유튜브 embed 처리
    let videoEmbed = '';
    if(videoUrl){
      const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if(ytMatch){
        videoEmbed = '<div style="margin:16px 0;border-radius:12px;overflow:hidden">' +
          '<iframe width="100%" height="315" src="https://www.youtube.com/embed/' + ytMatch[1] + '" frameborder="0" allowfullscreen style="display:block;border-radius:12px"></iframe>' +
          '</div>';
      } else {
        videoEmbed = '<div style="margin:16px 0;padding:12px;background:#f4eaff;border-radius:10px;font-size:12px">' +
          '📹 영상: <a href="' + videoUrl + '" target="_blank" style="color:#6030C0">' + videoUrl + '</a></div>';
      }
    }

    // 블로그 미리보기 생성
    const paragraphs = text.split(/
\s*
/).filter(p => p.trim().length > 10);
    let previewHtml = '<div style="font-family:'Noto Sans KR',sans-serif;line-height:1.8;max-width:680px;margin:0 auto">';

    // 제목
    const title = paragraphs[0] || '';
    previewHtml += '<h2 style="font-size:20px;font-weight:900;margin:0 0 16px;color:#1a1a2e">' + title.replace(/[#*]/g,'').trim() + '</h2>';

    // 헤더 이미지
    if(imgs[0] && imgs[0].url){
      previewHtml += '<img src="' + imgs[0].url + '" style="width:100%;border-radius:12px;margin-bottom:16px;max-height:320px;object-fit:cover">';
    } else if(imgs[0] && imgs[0].prompt){
      previewHtml += '<div style="padding:12px;background:#f4eaff;border-radius:10px;font-size:11px;color:#6030C0;margin-bottom:16px">🖼 이미지 프롬프트: ' + imgs[0].prompt.slice(0,100) + '</div>';
    }

    // 영상 embed (중간)
    if(videoEmbed) previewHtml += videoEmbed;

    // 본문 단락들
    paragraphs.slice(1).forEach((p, i) => {
      previewHtml += '<p style="margin:0 0 14px;font-size:15px;color:#2b2430">' + p.replace(/
/g,'<br>').trim() + '</p>';
      // 2번째 단락 뒤에 이미지 2
      if(i === 1 && imgs[1]){
        if(imgs[1].url) previewHtml += '<img src="' + imgs[1].url + '" style="width:100%;border-radius:12px;margin:12px 0;max-height:280px;object-fit:cover">';
      }
      // 4번째 단락 뒤에 이미지 3
      if(i === 3 && imgs[2]){
        if(imgs[2].url) previewHtml += '<img src="' + imgs[2].url + '" style="width:100%;border-radius:12px;margin:12px 0;max-height:280px;object-fit:cover">';
      }
    });

    previewHtml += '</div>';

    // 복사용 텍스트 (이미지 URL 포함)
    const copyText = text + (imgs.filter(i=>i.url).length ? '

[이미지]
' + imgs.filter(i=>i.url).map(i=>i.url).join('
') : '') + (videoUrl ? '

[영상] ' + videoUrl : '');

    out.innerHTML =
      '<div style="margin-bottom:12px">' +
        '<div style="font-size:12px;font-weight:900;color:#2f7a54;margin-bottom:8px">✅ 완성! 미리보기</div>' +
        '<div style="border:1px solid var(--line);border-radius:12px;padding:16px;background:#fff;max-height:500px;overflow-y:auto">' +
          previewHtml +
        '</div>' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
        '<button onclick="navigator.clipboard.writeText(document.querySelector('.media-bar ._copy-text')||'')" style="padding:8px 14px;border:1px solid var(--line);border-radius:999px;background:#fff;font-size:12px;font-weight:800;cursor:pointer">📋 글만 복사</button>' +
        (imgs.filter(i=>i.url).length ?
          '<button onclick="_mbCopyAll()" style="padding:8px 14px;border:none;border-radius:999px;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;font-size:12px;font-weight:800;cursor:pointer">📋 글+이미지 URL 복사</button>' : '') +
        '<button onclick="_mbCopyHtml()" style="padding:8px 14px;border:1px solid #d4b5f5;border-radius:999px;background:#fff;font-size:12px;font-weight:800;cursor:pointer;color:#6030C0">📋 HTML 복사</button>' +
        '<button onclick="if(typeof LibraryAdapter!=='undefined')LibraryAdapter.save({text:' + JSON.stringify(text).replace(/'/g,"\'") + ',category:'' + (category||'general') + ''})" style="padding:8px 14px;border:1px solid #c2e8d8;border-radius:999px;background:#eefbf7;font-size:12px;font-weight:800;cursor:pointer;color:#2f7a54">💾 보관함</button>' +
      '</div>' +
      '<div class="_copy-text" style="display:none">' + text + '</div>' +
      '<div class="_copy-html" style="display:none">' + previewHtml.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>';

    // 전역 저장
    window._mbLastText = text;
    window._mbLastHtml = previewHtml;
    window._mbLastImgs = imgs;
    window._mbLastVideo = videoUrl;

  }catch(e){
    out.innerHTML = '<div style="padding:10px;background:#fff0f0;border-radius:10px;color:#e53;font-size:12px">❌ ' + e.message + '<br><span style="font-size:11px;color:var(--sub)">OpenAI API 키가 설정에 있는지 확인해주세요</span></div>';
  }
}

function _mbCopyAll(){
  const text = window._mbLastText || '';
  const imgs = window._mbLastImgs || [];
  const video = window._mbLastVideo || '';
  const imgUrls = imgs.filter(i=>i.url).map((i,idx) => '[이미지' + (idx+1) + '] ' + i.url).join('
');
  const result = text + (imgUrls ? '

' + imgUrls : '') + (video ? '

[영상] ' + video : '');
  navigator.clipboard.writeText(result).then(() => alert('📋 글+이미지 URL 복사 완료!

네이버 블로그 에디터에 붙여넣으세요.'));
}

function _mbCopyHtml(){
  const html = window._mbLastHtml || '';
  navigator.clipboard.writeText(html).then(() => alert('📋 HTML 복사 완료!

HTML 에디터에 붙여넣으세요.'));
}
function _mediaBarToShorts(btn, category){
  const bar = _mediaBarFindBar(btn);
  const text = typeof bar._getText === 'function' ? bar._getText() : '';
  if(!text){ alert('본문이 비어있어요'); return; }
  const key = 'hub_scripts_v1';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  list.unshift({ source:category||'media-bar', lang:'ko', text, at:Date.now() });
  localStorage.setItem(key, JSON.stringify(list.slice(0,30)));
  if(confirm('🎬 자동숏츠 엔진으로 이동할까요?')){
    location.href = 'engines/shorts/index.html?topic=' + encodeURIComponent((text.split('\n')[0]||'').slice(0,60));
  }
}
async function _mediaBarFull(btn, category){
  await _mediaBarAddImages(btn, category);
  _mediaBarToShorts(btn, category);
}

// 주요 카테고리 output textarea 에 media bar 자동 부착
(function autoAttachMediaBar(){
  const targets = [
    ['mz-out',  'monetize'],   // 수익형/콘텐츠 빌더
    ['pb-out',  'public'],      // 공공기관
    ['ed-out',  'edu'],         // 학습
    ['tr-out',  'translate'],   // 번역
    ['sm-out',  'smb'],         // 소상공인
    ['ps-out',  'psy'],         // 심리
    ['ppt-out-ko','ppt']        // PPT
  ];
  // div 기반 출력 영역도 감시 (textContent 사용)
  const divTargets = [
    ['intentResult', 'general'],   // 빠른생성(Intent)
    ['one-result',   'general']    // 원스톱 허브 인라인
  ];
  setInterval(() => {
    targets.forEach(([id, cat]) => {
      const el = document.getElementById(id);
      if(!el) return;
      const hasContent = (el.value||'').trim().length > 30;
      const hasBar = el.parentElement?.querySelector(':scope > .media-bar') || el.nextElementSibling?.classList?.contains('media-bar');
      if(hasContent && !hasBar){
        showMediaBar(el, () => el.value, cat);
      } else if(!hasContent && hasBar){
        const bar = el.parentElement?.querySelector(':scope > .media-bar') || el.nextElementSibling;
        if(bar && bar.classList && bar.classList.contains('media-bar')) bar.remove();
      }
    });
    divTargets.forEach(([id, cat]) => {
      const el = document.getElementById(id);
      if(!el) return;
      const txt = (el.textContent || el.innerText || '').trim();
      const hasContent = txt.length > 30 && el.offsetParent !== null;  // 보일 때만
      const hasBar = el.parentElement?.querySelector(':scope > .media-bar') || el.nextElementSibling?.classList?.contains('media-bar');
      if(hasContent && !hasBar){
        showMediaBar(el, () => (el.textContent||el.innerText||'').trim(), cat);
      } else if(!hasContent && hasBar){
        const bar = el.parentElement?.querySelector(':scope > .media-bar') || el.nextElementSibling;
        if(bar && bar.classList && bar.classList.contains('media-bar')) bar.remove();
      }
    });
  }, 1500);
})();

/* ─── 전역 alias (스펙 호환) ─── */
window.showMediaComboBar = function(anchorEl, getText, category){ return showMediaBar(anchorEl, getText, category); };
window.mediaComboImage   = function(category){
  const btn = document.querySelector('.media-bar button[onclick*="AddImages"]'); if(btn) btn.click();
};
window.mediaComboVideo   = function(category){
  const btn = document.querySelector('.media-bar button[onclick*="ToShorts"]');  if(btn) btn.click();
};
window.mediaComboAll     = function(category){
  const btn = document.querySelector('.media-bar button[onclick*="Full"]');      if(btn) btn.click();
};

/* 공통 이미지 생성 (= generateContentImages 의 별칭 · 프롬프트가 이미 포함된 텍스트면 그대로, 없으면 섹션에서 추출) */
async function generateImagesForText(text, styleHint, category, count, onProgress){
  // [IMAGE: ...] 마커가 없으면 섹션(빈 줄 단위)에서 간단 프롬프트 자동 생성
  if(!/\[IMAGE:\s/.test(text||'')){
    const sections = String(text||'').split(/\n\s*\n/).filter(s => s.trim().length > 40).slice(0, count || 3);
    text = sections.map(s => s + '\n[IMAGE: ' + s.replace(/\n/g,' ').slice(0,120) + ']').join('\n\n');
  }
  return generateContentImages(text, styleHint, category, count, onProgress);
}

/* ═══════════════════════════════════════════════════════════
   🔍 유튜브 벤치마킹 (MOCA 완전판)
   탭: 영상분석 / 채널분석 / 콘텐츠갭 / 공식라이브러리
   ═══════════════════════════════════════════════════════════ */
const LS_BENCH_LIBRARY = 'uc_bench_library';

const BENCH = {
  tab: 'video',
  video: { url:'', script:'', title:'', views:'', subs:'', date:'', lang:'ko',
           analysis:null, titleAB:null, thumbAnalysis:null, commentAnalysis:null, myTopic:'' },
  channel: { url:'', result:null, items:{pattern:true,top:true,bottom:true,title:true,thumb:true,time:true} },
  gap:    { keywords:'', result:null },
};

function closeBench(){
  document.getElementById('benchDetail').classList.add('hide');
  document.querySelector('.hero').style.display = '';
  document.getElementById('grid').style.display = '';
}
function benchTab(t){
  BENCH.tab = t;
  document.querySelectorAll('.bench-tab').forEach(b => b.classList.toggle('on', b.getAttribute('data-t') === t));
  renderBenchHub();
}
function renderBenchHub(){
  const body = document.getElementById('bench-body');
  if(!body) return;
  const r = { video:_renderBenchVideo, channel:_renderBenchChannel, gap:_renderBenchGap, library:_renderBenchLibrary }[BENCH.tab] || _renderBenchVideo;
  body.innerHTML = r();
  if(BENCH.tab === 'video' && BENCH.video.analysis) _bindVideoResultEvents();
}

/* ─── TAB 1: 영상 분석 ─── */
function _renderBenchVideo(){
  const v = BENCH.video;
  const input =
    '<div class="bench-panel">' +
      '<h4>STEP 1 · 영상 정보 수집</h4>' +
      '<p class="hint">가장 정확한 방법은 <b>대본 붙여넣기</b> 입니다 (YouTube: ··· → 스크립트 열기 → 전체 복사)</p>' +

      '<h5>📋 대본 / 자막 (필수)</h5>' +
      '<textarea class="bench-input" id="bv-script" placeholder="유튜브 자막을 여기에 붙여넣어주세요.&#10;&#10;자막 가져오는 법: 영상 → ··· 더보기 → 스크립트 열기 → 전체 선택 → 복사 → 여기 붙여넣기">' + (v.script||'') + '</textarea>' +

      '<h5>🔗 URL (선택)</h5>' +
      '<input class="bench-small" id="bv-url" placeholder="https://youtube.com/watch?v=..." value="' + (v.url||'') + '">' +
      '<p class="hint" style="font-size:11px">URL 은 참고용 · 실제 분석은 위 대본으로 진행합니다 (브라우저 CORS 제약)</p>' +

      '<div class="bench-row" style="margin-top:10px">' +
        '<div><label>제목</label><input class="bench-small" id="bv-title" placeholder="원본 영상 제목" value="' + (v.title||'') + '"></div>' +
        '<div><label>채널 언어</label><select class="bench-small" id="bv-lang"><option value="ko" ' + (v.lang==='ko'?'selected':'') + '>🇰🇷 한국</option><option value="ja" ' + (v.lang==='ja'?'selected':'') + '>🇯🇵 일본</option></select></div>' +
      '</div>' +
      '<div class="bench-row">' +
        '<div><label>조회수</label><input class="bench-small" id="bv-views" placeholder="예: 1,200,000" value="' + (v.views||'') + '"></div>' +
        '<div><label>구독자</label><input class="bench-small" id="bv-subs" placeholder="예: 150,000" value="' + (v.subs||'') + '"></div>' +
      '</div>' +
      '<div class="bench-row">' +
        '<div><label>업로드</label><input class="bench-small" type="date" id="bv-date" value="' + (v.date||'') + '"></div>' +
        '<div style="display:flex;align-items:flex-end"><button class="vs-btn pri lg" style="width:100%" onclick="benchAnalyzeVideo()">🔍 전체 분석 시작</button></div>' +
      '</div>' +
    '</div>';

  if(!v.analysis) return input;

  // 분석 결과 렌더
  const a = v.analysis;
  const scoreBars = (frames) => (frames||[]).map(f =>
    '<div class="bench-bar"><span class="lbl">' + f.range + '</span><div class="bar"><b style="width:' + (f.score||0) + '%"></b></div><span class="val">' + (f.score||0) + '</span></div>'
  ).join('');
  const topSentences = (a.topSentences||[]).slice(0,5).map((s,i) =>
    '<div style="padding:10px;background:#fff;border:1px solid var(--line);border-radius:10px;margin:6px 0">' +
      '<b>' + (i+1) + '. "' + (s.text||'').replace(/"/g,'&quot;') + '"</b>' +
      '<div style="font-size:12px;color:var(--sub);margin-top:4px">패턴: ' + (s.pattern||'') + '</div>' +
    '</div>'
  ).join('');

  const result =
    '<div class="bench-panel">' +
      '<h4>STEP 2 · 대본 심층 분석 결과</h4>' +

      '<div class="bench-section">' +
        '<h5>🎯 훅 분석</h5>' +
        '<p><b>첫 문장:</b> "' + ((a.hook && a.hook.firstLine) || '') + '"</p>' +
        '<p><b>유형:</b> ' + ((a.hook && a.hook.type) || '—') + ' · <span class="bench-score ok">' + ((a.hook && a.hook.score) || 0) + '점</span></p>' +
        '<p style="font-size:12.5px;color:var(--sub);white-space:pre-wrap">' + ((a.hook && a.hook.whyWorks) || '') + '</p>' +
        (a.hook && a.hook.myVersion ? '<div style="margin-top:8px;padding:10px;background:#fff5fa;border-radius:10px"><b>내 채널 버전:</b> "' + a.hook.myVersion + '"</div>' : '') +
      '</div>' +

      '<div class="bench-section">' +
        '<h5>⏱ 첫 30초 프레임 분석</h5>' +
        scoreBars(a.frames) +
        (a.riskZone ? '<div style="margin-top:8px;padding:8px;background:#fff7ee;border-left:3px solid #d48a3a;border-radius:6px;font-size:12.5px">⚠️ <b>이탈 위험:</b> ' + a.riskZone + '</div>' : '') +
      '</div>' +

      '<div class="bench-section">' +
        '<h5>🧱 대본 구조 분석</h5>' +
        '<p><b>구조 유형:</b> ' + ((a.structure && a.structure.type) || '—') + ' · <span class="bench-score">' + ((a.structure && a.structure.score) || 0) + '점</span></p>' +
        '<pre style="font-size:12px;background:#fff;padding:10px;border-radius:8px;margin:0;white-space:pre-wrap">' + ((a.structure && a.structure.breakdown) || '') + '</pre>' +
      '</div>' +

      '<div class="bench-section">' +
        '<h5>💬 핵심 문장 TOP 5</h5>' +
        topSentences +
        (a.commonPattern ? '<div style="margin-top:8px;padding:10px;background:#fff5fa;border-radius:10px"><b>공통 패턴:</b> ' + a.commonPattern + '</div>' : '') +
      '</div>' +

      '<div class="bench-section">' +
        '<h5>🗣 언어 스타일</h5>' +
        '<pre style="font-size:12.5px;white-space:pre-wrap;margin:0">' + ((a.language && a.language.summary) || '') + '</pre>' +
      '</div>' +
    '</div>' +

    '<div class="bench-panel">' +
      '<h4>STEP 3 · 제목 공식 분석 + A/B</h4>' +
      '<p class="hint">주제 입력 시 같은 공식으로 5개 제목을 자동 생성합니다.</p>' +
      '<input class="bench-small" id="bv-mytopic" placeholder="내 주제 (예: 치매예방 운동 TOP3)" value="' + (v.myTopic||'') + '">' +
      '<button class="vs-btn pri" style="margin-top:8px" onclick="benchGenTitles()">🧪 제목 5개 + CTR 예측</button>' +
      (v.titleAB ? '<div style="margin-top:10px">' + (v.titleAB||[]).map((t,i) => '<div style="padding:8px 12px;background:#fff;border:1px solid var(--line);border-radius:10px;margin:4px 0;display:flex;justify-content:space-between;align-items:center;gap:8px"><span><b>' + String.fromCharCode(65+i) + '.</b> ' + t.title + '</span><span class="bench-score ' + (t.ctr>=8?'ok':t.ctr>=6?'':'warn') + '">CTR ' + t.ctr + '%</span></div>').join('') + '</div>' : '') +
    '</div>' +

    '<div class="bench-panel">' +
      '<h4>STEP 4 · 썸네일 분석</h4>' +
      '<p class="hint">썸네일 이미지를 붙여넣거나 URL 입력 · 없어도 텍스트 패턴 분석 가능</p>' +
      '<input class="bench-small" id="bv-thumb-url" placeholder="썸네일 이미지 URL (선택)">' +
      '<button class="vs-btn" style="margin-top:8px" onclick="benchAnalyzeThumb()">🖼 썸네일 패턴 분석</button>' +
      (v.thumbAnalysis ? '<div class="bench-section" style="margin-top:10px"><pre style="white-space:pre-wrap;margin:0;font-size:12.5px">' + v.thumbAnalysis + '</pre></div>' : '') +
      '<button class="vs-btn" style="margin-top:8px" onclick="benchGenThumb()">🎨 같은 공식으로 내 썸네일 생성</button>' +
    '</div>' +

    '<div class="bench-panel">' +
      '<h4>STEP 5 · 댓글 감성 분석</h4>' +
      '<textarea class="bench-input" id="bv-comments" placeholder="인기 댓글을 복사해서 붙여넣어주세요 (여러 개 가능)" style="min-height:90px"></textarea>' +
      '<button class="vs-btn" style="margin-top:8px" onclick="benchAnalyzeComments()">💬 댓글 분석</button>' +
      (v.commentAnalysis ? '<div class="bench-section" style="margin-top:10px"><pre style="white-space:pre-wrap;margin:0;font-size:12.5px">' + v.commentAnalysis + '</pre></div>' : '') +
    '</div>' +

    '<div class="bench-panel" style="background:linear-gradient(135deg,#fff5fa,#f7f4ff)">' +
      '<h4>STEP 6-7 · 원클릭 벤치마킹 대본 생성</h4>' +
      '<p class="hint">분석된 공식 (훅 패턴·구조·제목·CTA) 을 모두 적용해서 내 주제로 즉시 생성</p>' +
      '<input class="bench-small" id="bv-bench-topic" placeholder="내 주제 (예: 치매예방 운동 TOP3)">' +
      '<div class="bench-checklist" style="margin-top:8px">' +
        '<label><input type="checkbox" id="b-apply-hook" checked> 훅 패턴 적용</label>' +
        '<label><input type="checkbox" id="b-apply-struct" checked> 대본 구조 적용</label>' +
        '<label><input type="checkbox" id="b-apply-title" checked> 제목 공식 적용</label>' +
        '<label><input type="checkbox" id="b-apply-cta" checked> CTA 방식 적용</label>' +
        '<label><input type="checkbox" id="b-apply-senior" checked> 시니어 채널 커스터마이징</label>' +
        '<label><input type="checkbox" id="b-apply-bilingual"> 한국+일본 동시 생성</label>' +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
        '<button class="vs-btn pri lg" onclick="benchCreateFromFormula()">🚀 벤치마킹 대본 즉시 생성!</button>' +
        '<button class="vs-btn" onclick="benchSaveFormula()">💾 이 공식 라이브러리 저장</button>' +
      '</div>' +
      '<div id="bv-final-out" style="margin-top:12px"></div>' +
    '</div>';

  return input + result;
}

function _bindVideoResultEvents(){
  // 값 복원
  const v = BENCH.video;
  ['bv-title','bv-url','bv-views','bv-subs','bv-date'].forEach(id => {
    const el = document.getElementById(id); if(el) el.addEventListener('change', ()=>{ const k = id.slice(3); v[k] = el.value; });
  });
}

/* 메인 분석 AI 호출 */
async function benchAnalyzeVideo(){
  const v = BENCH.video;
  v.script = document.getElementById('bv-script').value.trim();
  v.url    = document.getElementById('bv-url').value.trim();
  v.title  = document.getElementById('bv-title').value.trim();
  v.views  = document.getElementById('bv-views').value.trim();
  v.subs   = document.getElementById('bv-subs').value.trim();
  v.date   = document.getElementById('bv-date').value;
  v.lang   = document.getElementById('bv-lang').value;
  if(!v.script){ alert('대본/자막을 붙여넣어주세요'); return; }
  try{
    const sys =
      '유튜브 영상 대본을 심층 분석한다. 반드시 아래 JSON 스키마만 출력:\n' +
      '{\n' +
      '  "hook": {"firstLine":"첫 문장","type":"훅 유형","score":0~100,"whyWorks":"3줄 이유","myVersion":"시니어 채널 변환 예시"},\n' +
      '  "frames": [{"range":"0~3초","score":0~100},{"range":"3~8초","score":0~100},{"range":"8~15초","score":0~100},{"range":"15~30초","score":0~100}],\n' +
      '  "riskZone": "가장 이탈 위험 구간과 이유 (1줄) 또는 null",\n' +
      '  "structure": {"type":"5단계 완결형 등","score":0~100,"breakdown":"0~5초: ...\\n5~15초: ..."},\n' +
      '  "topSentences": [{"text":"문장","pattern":"패턴 설명"}, ... 5개],\n' +
      '  "commonPattern": "공통 패턴 1줄",\n' +
      '  "language": {"summary":"평균 문장길이, 구어체 비율, 질문 횟수, 호칭, 이모지/감탄사 사용, 번역투 여부 등을 요약"}\n' +
      '}';
    const user = '제목: ' + v.title + '\n채널 언어: ' + v.lang + '\n\n=== 대본 ===\n' + v.script.slice(0,8000);
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens: 3500, featureId:'bench-video' });
    const m = res.match(/\{[\s\S]*\}/); if(!m) throw new Error('JSON 파싱 실패');
    v.analysis = JSON.parse(m[0]);
    renderBenchHub();
  }catch(e){ alert('❌ ' + e.message); }
}

async function benchGenTitles(){
  const v = BENCH.video;
  v.myTopic = document.getElementById('bv-mytopic').value.trim();
  if(!v.myTopic){ alert('내 주제를 입력해주세요'); return; }
  try{
    const sys = '원본 제목의 공식(파워워드·숫자·감정)을 분석해서 내 주제로 제목 5개 생성. JSON 배열: [{"title":"","ctr":숫자(예측 클릭률 %, 4~10)}]. 원본 공식을 유지하며 다양하게.';
    const user = '원본 제목: ' + v.title + '\n내 주제: ' + v.myTopic;
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens: 800 });
    const m = res.match(/\[[\s\S]*\]/); if(!m) throw new Error('JSON 파싱 실패');
    v.titleAB = JSON.parse(m[0]);
    renderBenchHub();
  }catch(e){ alert('❌ ' + e.message); }
}

async function benchAnalyzeThumb(){
  const v = BENCH.video;
  const url = document.getElementById('bv-thumb-url').value.trim();
  try{
    const sys = '유튜브 썸네일의 성공 공식을 분석하라. 색상 구성(메인 3색+%), 메인/서브 텍스트(크기·폰트 스타일·색상), 위치(좌상/중앙/우하 등), 이미지 요소(인물·배경·표정), 예상 클릭률(%)을 간결히 출력. 썸네일 URL 이 없으면 제목/주제 기반으로 일반 패턴 분석.';
    const user = '제목: ' + v.title + '\n썸네일 URL: ' + (url||'없음') + '\n채널 언어: ' + v.lang;
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens: 800 });
    v.thumbAnalysis = res.trim();
    renderBenchHub();
  }catch(e){ alert('❌ ' + e.message); }
}

async function benchGenThumb(){
  const v = BENCH.video;
  if(!v.analysis){ alert('먼저 영상 분석을 완료해주세요'); return; }
  const key = localStorage.getItem('uc_openai_key');
  if(!key){ alert('OpenAI 키가 필요해요 (DALL·E 3)'); return; }
  const title = v.myTopic || v.title;
  try{
    const prompt = 'YouTube thumbnail, 16:9, bold Korean text "' + title.replace(/"/g,'') + '", high contrast emotional face, dramatic lighting, red and yellow accents, readable text';
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
      body: JSON.stringify({ model:'dall-e-3', prompt, n:1, size:'1792x1024', response_format:'url' })
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error?.message || 'HTTP '+res.status);
    const imgUrl = data.data?.[0]?.url;
    const area = document.getElementById('bv-final-out') || document.getElementById('bench-body');
    const box = document.createElement('div');
    box.style.margin = '10px 0';
    box.innerHTML = '<p><b>🎨 벤치마킹 썸네일</b></p><img src="' + imgUrl + '" style="max-width:100%;border-radius:12px">';
    area.appendChild(box);
  }catch(e){ alert('❌ ' + e.message); }
}

async function benchAnalyzeComments(){
  const v = BENCH.video;
  const comments = document.getElementById('bv-comments').value.trim();
  if(!comments){ alert('댓글을 붙여넣어주세요'); return; }
  try{
    const sys = '유튜브 댓글을 분석하라. 출력:\n반응 분포 (감동/정보/공유/부정 %)\n핵심 키워드 TOP 5\n시청자가 진짜 원하는 것 3가지\n다음 영상 아이디어 3개';
    const res = await APIAdapter.callWithFallback(sys, comments.slice(0,4000), { maxTokens: 800 });
    v.commentAnalysis = res.trim();
    renderBenchHub();
  }catch(e){ alert('❌ ' + e.message); }
}

async function benchCreateFromFormula(){
  const v = BENCH.video;
  if(!v.analysis){ alert('먼저 영상 분석을 완료해주세요'); return; }
  const topic = document.getElementById('bv-bench-topic').value.trim() || v.myTopic;
  if(!topic){ alert('내 주제를 입력해주세요'); return; }
  const flags = {
    hook:   document.getElementById('b-apply-hook').checked,
    struct: document.getElementById('b-apply-struct').checked,
    title:  document.getElementById('b-apply-title').checked,
    cta:    document.getElementById('b-apply-cta').checked,
    senior: document.getElementById('b-apply-senior').checked,
    bilingual: document.getElementById('b-apply-bilingual').checked
  };
  try{
    const sys =
      '분석된 원본 영상의 공식을 적용해서 내 주제로 60초 유튜브 숏츠 대본을 작성.\n' +
      (flags.hook   ? '훅 패턴: ' + JSON.stringify(v.analysis.hook||{}) + '\n' : '') +
      (flags.struct ? '구조 적용: ' + JSON.stringify(v.analysis.structure||{}) + '\n' : '') +
      (flags.senior ? '시니어 채널 조정: 느린 편집속도(5초/씬), 큰 자막, 부드러운 충격 표현, 잔잔한 BGM 가정하여 나레이션 톤 반영.\n' : '') +
      (flags.cta    ? 'CTA: 댓글·공유 유도형 1문장으로 마무리.\n' : '') +
      '출력: 6~8씬 대본, 각 씬은 [0~5초] 형식으로 시작. 맨 위에 제목 1줄 포함.' +
      (flags.bilingual ? '\n한국어 버전 먼저, 이어서 === 日本語 === 구분선 후 일본어 버전.' : '');
    const user = '내 주제: ' + topic + '\n원본 영상 핵심문장 패턴: ' + (v.analysis.commonPattern||'');
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens: 3500, featureId:'bench-create' });
    const out = document.getElementById('bv-final-out');
    out.innerHTML = '<div class="bench-section"><h5>🚀 벤치마킹 대본</h5><pre style="white-space:pre-wrap;font-size:13px;margin:0">' + res + '</pre></div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' +
        '<button class="vs-btn" onclick="navigator.clipboard.writeText(' + JSON.stringify(res) + ');alert(\'📋 복사됨\')">📋 복사</button>' +
        '<button class="vs-btn pri" onclick="benchSendToShorts(' + JSON.stringify(topic) + ',' + JSON.stringify(res) + ')">🎬 자동숏츠로 보내기</button>' +
      '</div>';
    out.scrollIntoView({ behavior:'smooth', block:'center' });
  }catch(e){ alert('❌ ' + e.message); }
}
function benchSendToShorts(topic, script){
  const key = 'hub_scripts_v1';
  const list = JSON.parse(localStorage.getItem(key)||'[]');
  list.unshift({ source:'bench', lang:'ko', text:script, at:Date.now(), meta:{topic} });
  localStorage.setItem(key, JSON.stringify(list.slice(0,30)));
  if(confirm('🎬 자동숏츠 엔진으로 이동할까요?')) location.href='engines/shorts/index.html?topic=' + encodeURIComponent(topic);
}

function benchSaveFormula(){
  const v = BENCH.video;
  if(!v.analysis){ alert('먼저 분석을 완료해주세요'); return; }
  const name = prompt('공식 이름 (예: 감동형 성공 공식)') ;
  if(!name) return;
  const entry = {
    id: 'bf_' + Date.now().toString(36),
    name, savedAt: Date.now(),
    title: v.title, lang: v.lang, views: v.views,
    analysis: v.analysis, titleAB: v.titleAB, thumbAnalysis: v.thumbAnalysis, commentAnalysis: v.commentAnalysis
  };
  const list = JSON.parse(localStorage.getItem(LS_BENCH_LIBRARY)||'[]');
  list.unshift(entry);
  localStorage.setItem(LS_BENCH_LIBRARY, JSON.stringify(list.slice(0,50)));
  alert('💾 "' + name + '" 라이브러리에 저장됨');
}

/* ─── TAB 2: 채널 분석 ─── */
function _renderBenchChannel(){
  const c = BENCH.channel;
  return '<div class="bench-panel">' +
    '<h4>📺 채널 분석</h4>' +
    '<p class="hint">URL 로는 직접 접근 불가 (CORS). 분석 원하는 <b>채널 이름 + 특징</b> 을 간단히 적어주시면 AI 가 일반 패턴 분석을 해드려요.</p>' +
    '<input class="bench-small" id="bc-name" placeholder="채널명 (예: 시니어라이프 TV)" value="' + (c.url||'') + '">' +
    '<textarea class="bench-input" id="bc-desc" style="min-height:90px" placeholder="채널 설명 (장르·타겟·최근 영상 스타일 등을 3~5줄로)"></textarea>' +
    '<div class="bench-checklist">' +
      '<label><input type="checkbox" id="bc-pattern" checked> 업로드 패턴 분석</label>' +
      '<label><input type="checkbox" id="bc-top"     checked> 잘된 영상 TOP10 공통점</label>' +
      '<label><input type="checkbox" id="bc-bottom"  checked> 안된 영상 BOTTOM10 차이점</label>' +
      '<label><input type="checkbox" id="bc-title"   checked> 제목 공식 패턴</label>' +
      '<label><input type="checkbox" id="bc-thumb"   checked> 썸네일 스타일 변화</label>' +
      '<label><input type="checkbox" id="bc-time"    checked> 최적 업로드 시간</label>' +
    '</div>' +
    '<button class="vs-btn pri" style="margin-top:10px" onclick="benchAnalyzeChannel()">🔍 분석 시작</button>' +
    (c.result ? '<div class="bench-section" style="margin-top:12px"><pre style="white-space:pre-wrap;font-size:12.5px;margin:0">' + c.result + '</pre></div>' : '') +
  '</div>';
}
async function benchAnalyzeChannel(){
  const c = BENCH.channel;
  const name = document.getElementById('bc-name').value.trim();
  const desc = document.getElementById('bc-desc').value.trim();
  if(!name || !desc){ alert('채널명과 설명을 입력해주세요'); return; }
  const items = ['pattern','top','bottom','title','thumb','time'].filter(k => document.getElementById('bc-' + k).checked);
  c.url = name;
  try{
    const sys =
      '유튜브 채널 벤치마킹 분석. 아래 항목별로 실전 팁을 구체 수치와 함께 출력:\n' +
      (items.includes('pattern') ? '[업로드 패턴] 주기·최적 시간·평균 길이\n' : '') +
      (items.includes('top')     ? '[TOP10 공통점] ✅ 제목·썸네일·훅·길이 패턴\n' : '') +
      (items.includes('bottom')  ? '[BOTTOM10 차이점] ❌ 어떤 패턴이 실패하는지\n' : '') +
      (items.includes('title')   ? '[제목 공식] 숫자·파워워드·패턴 등\n' : '') +
      (items.includes('thumb')   ? '[썸네일 스타일] 색상·레이아웃·변화\n' : '') +
      (items.includes('time')    ? '[최적 업로드 시간] 요일·시간\n' : '') +
      '[내 채널 적용 순위] 큰 영향 순 3가지\n' +
      '모든 설명 3~5줄로 간결히.';
    const res = await APIAdapter.callWithFallback(sys, '채널: ' + name + '\n특징:\n' + desc, { maxTokens: 1800, featureId:'bench-channel' });
    c.result = res.trim();
    renderBenchHub();
  }catch(e){ alert('❌ ' + e.message); }
}

/* ─── TAB 3: 콘텐츠 갭 ─── */
function _renderBenchGap(){
  const g = BENCH.gap;
  return '<div class="bench-panel">' +
    '<h4>🗺 콘텐츠 갭 분석</h4>' +
    '<p class="hint">내 채널 키워드를 입력하면, 포화/기회 주제를 구분해서 추천합니다.</p>' +
    '<input class="bench-small" id="bg-kw" placeholder="예: 시니어, 건강, 치매, 노후, 일본" value="' + (g.keywords||'') + '">' +
    '<button class="vs-btn pri" style="margin-top:10px" onclick="benchAnalyzeGap()">🔍 갭 분석 시작</button>' +
    (g.result ? '<div style="margin-top:12px">' +
      (g.result.red||[]).map(t => '<div class="bench-topic-card red"><span>🔴 <b>' + t.topic + '</b> <small style="color:var(--sub)">· ' + (t.reason||'경쟁 과다') + '</small></span></div>').join('') +
      (g.result.green||[]).map(t => '<div class="bench-topic-card green"><span>🟢 <b>' + t.topic + '</b> <small style="color:var(--sub)">· ' + (t.reason||'블루오션') + '</small></span><button class="vs-btn" onclick="benchGapToScript(' + JSON.stringify(t.topic) + ')">🚀 이 주제로 대본</button></div>').join('') +
      (g.result.ja_green && g.result.ja_green.length ? '<h5 style="margin-top:12px">🇯🇵 일본 채널 갭</h5>' + g.result.ja_green.map(t => '<div class="bench-topic-card green"><span>🟢 <b>' + t.topic + '</b> <small style="color:var(--sub)">· ' + (t.reason||'') + '</small></span><button class="vs-btn" onclick="benchGapToScript(' + JSON.stringify(t.topic) + ')">🚀 대본</button></div>').join('') : '') +
    '</div>' : '') +
  '</div>';
}
async function benchAnalyzeGap(){
  const g = BENCH.gap;
  g.keywords = document.getElementById('bg-kw').value.trim();
  if(!g.keywords){ alert('키워드를 입력해주세요'); return; }
  try{
    const sys =
      '콘텐츠 갭 분석. 내 채널 키워드를 기반으로:\n' +
      '- 포화 주제 (경쟁 과다, 진입 어려움) 3~4개\n' +
      '- 기회 주제 (블루오션, 선점 가능) 4~6개\n' +
      '- 일본 채널 기회 주제 2~3개 (昭和の思い出/孫との時間 같은 일본 특화)\n' +
      '반드시 JSON: {"red":[{"topic":"","reason":""}], "green":[{"topic":"","reason":""}], "ja_green":[{"topic":"","reason":""}]}';
    const res = await APIAdapter.callWithFallback(sys, '내 키워드: ' + g.keywords, { maxTokens: 1500 });
    const m = res.match(/\{[\s\S]*\}/); if(!m) throw new Error('JSON 파싱 실패');
    g.result = JSON.parse(m[0]);
    renderBenchHub();
  }catch(e){ alert('❌ ' + e.message); }
}
function benchGapToScript(topic){
  const el = document.getElementById('one-input');
  if(el){ el.value = topic + ' 유튜브 숏츠 대본'; el.scrollIntoView({behavior:'smooth'}); }
  location.hash = '#oneHub';
}

/* ─── TAB 4: 내 공식 라이브러리 ─── */
function _renderBenchLibrary(){
  const list = JSON.parse(localStorage.getItem(LS_BENCH_LIBRARY)||'[]');
  if(!list.length){
    return '<div class="bench-panel">' +
      '<h4>📚 내 공식 라이브러리</h4>' +
      '<p class="hint" style="padding:20px;text-align:center">아직 저장된 공식이 없어요.<br>[📹 영상 분석] 에서 분석 후 "💾 이 공식 라이브러리 저장" 을 누르세요.</p>' +
    '</div>';
  }
  return '<div class="bench-panel">' +
    '<h4>📚 내 공식 라이브러리 <span style="font-weight:400;font-size:12px;color:var(--sub)">· 총 ' + list.length + '개</span></h4>' +
    list.map(f => '<div class="bench-lib-card">' +
      '<div class="hdr"><b>' + (f.name||'무제') + '</b><span class="bench-score">' + (f.lang==='ja'?'🇯🇵':'🇰🇷') + ' ' + (f.views||'?') + ' 조회</span></div>' +
      '<div style="font-size:12px;color:var(--sub);margin-bottom:6px">원본: ' + (f.title||'') + ' · ' + new Date(f.savedAt).toLocaleDateString('ko-KR') + '</div>' +
      '<div style="font-size:12.5px;line-height:1.7;margin:6px 0">' +
        '훅: ' + ((f.analysis?.hook?.type)||'?') + ' · ' +
        '구조: ' + ((f.analysis?.structure?.type)||'?') + ' · ' +
        '점수: ' + ((f.analysis?.structure?.score)||0) + '/100' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
        '<button class="vs-btn pri" onclick="benchApplyFormula(' + JSON.stringify(f.id) + ')">🚀 이 공식으로 즉시 생성</button>' +
        '<button class="vs-btn" onclick="benchLoadFormula(' + JSON.stringify(f.id) + ')">📹 상세 보기</button>' +
        '<button class="vs-btn ghost" onclick="benchDeleteFormula(' + JSON.stringify(f.id) + ')" style="color:var(--err)">🗑</button>' +
      '</div>' +
    '</div>').join('') +

    '<div class="bench-panel" style="background:linear-gradient(135deg,#fff5fa,#f7f4ff);margin-top:16px;padding:14px">' +
      '<h4>✅ 즉시 실행 체크리스트</h4>' +
      '<p class="hint" style="font-size:12px">라이브러리에 저장된 공식 기반 추천 체크리스트</p>' +
      '<div class="bench-checklist">' +
        '<h5 style="margin:6px 0">오늘 당장</h5>' +
        '<label><input type="checkbox"> 다음 영상 제목에 숫자 추가</label>' +
        '<label><input type="checkbox"> 첫 문장을 질문형으로 변경</label>' +
        '<label><input type="checkbox"> 썸네일에 6글자 텍스트 추가</label>' +
        '<h5 style="margin:10px 0 6px">이번 주</h5>' +
        '<label><input type="checkbox"> 영상 길이 55~60초로 맞추기</label>' +
        '<label><input type="checkbox"> 감동 씬 BGM 볼륨 20% 로 조정</label>' +
        '<label><input type="checkbox"> CTA 를 댓글 유도형으로 변경</label>' +
        '<h5 style="margin:10px 0 6px">이번 달</h5>' +
        '<label><input type="checkbox"> 콘텐츠 갭 주제 3개 기획</label>' +
        '<label><input type="checkbox"> 시리즈물 1개 시작</label>' +
        '<label><input type="checkbox"> 업로드 시간 최적화 테스트</label>' +
      '</div>' +
    '</div>' +
  '</div>';
}
function benchLoadFormula(id){
  const list = JSON.parse(localStorage.getItem(LS_BENCH_LIBRARY)||'[]');
  const f = list.find(x => x.id === id); if(!f) return;
  BENCH.video = Object.assign({}, BENCH.video, {
    title: f.title, lang: f.lang, analysis: f.analysis,
    titleAB: f.titleAB, thumbAnalysis: f.thumbAnalysis, commentAnalysis: f.commentAnalysis,
    script: BENCH.video.script || '(라이브러리에서 로드)'
  });
  benchTab('video');
}
function benchApplyFormula(id){
  benchLoadFormula(id);
  const topic = prompt('이 공식으로 어떤 주제를 만들까요?');
  if(!topic) return;
  BENCH.video.myTopic = topic;
  setTimeout(() => {
    const el = document.getElementById('bv-bench-topic');
    if(el){ el.value = topic; benchCreateFromFormula(); }
  }, 100);
}
function benchDeleteFormula(id){
  if(!confirm('이 공식을 삭제할까요?')) return;
  const list = JSON.parse(localStorage.getItem(LS_BENCH_LIBRARY)||'[]').filter(x => x.id !== id);
  localStorage.setItem(LS_BENCH_LIBRARY, JSON.stringify(list));
  renderBenchHub();
}

/* ═══════════════════════════════════════════════════════════
   👤 사용자 프로필 시스템
   - 최대 10개 프로필, 독립 localStorage
   - 상단 우측 배지 + 전환 모달 + 설정 탭 섹션
   - AI 호출 시 프로필 정보 자동 주입
   ═══════════════════════════════════════════════════════════ */
const LS_PROFILES    = 'uc_profiles';         // 프로필 목록
const LS_PROFILE_ACT = 'uc_profile_active';   // 활성 프로필 ID
const DEFAULT_EMOJIS = ['👴','👩','🧒','👧','👦','👵','🧑','🐰','☕','🌸'];

function profileList(){
  try{ const l = JSON.parse(localStorage.getItem(LS_PROFILES)||'[]'); return Array.isArray(l) ? l : []; }catch(_){ return []; }
}
function profileGet(id){ return profileList().find(p => p.id === id) || null; }
function profileActive(){
  const aid = localStorage.getItem(LS_PROFILE_ACT);
  const list = profileList();
  if(aid){ const found = list.find(p => p.id === aid); if(found) return found; }
  return list[0] || null;
}
function profileSave(profile){
  const list = profileList();
  const i = list.findIndex(p => p.id === profile.id);
  if(i >= 0) list[i] = profile; else list.push(profile);
  if(list.length > 10) list.length = 10;
  localStorage.setItem(LS_PROFILES, JSON.stringify(list));
}
function profileDelete(id){
  const list = profileList().filter(p => p.id !== id);
  localStorage.setItem(LS_PROFILES, JSON.stringify(list));
  if(localStorage.getItem(LS_PROFILE_ACT) === id) localStorage.removeItem(LS_PROFILE_ACT);
  _renderProfileBadge();
}
function profileActivate(id){
  localStorage.setItem(LS_PROFILE_ACT, id);
  _renderProfileBadge();
  document.getElementById('profileModal')?.classList.remove('on');
  // 애니메이션 (배경 잠깐 깜빡)
  document.body.style.transition = 'filter .3s ease';
  document.body.style.filter = 'brightness(1.05)';
  setTimeout(()=>{ document.body.style.filter=''; setTimeout(()=>{document.body.style.transition='';}, 400); }, 120);
}
function profileCreate(defaults){
  const id = 'pf_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6);
  const p = Object.assign({
    id, name:'새 프로필', emoji:'🧑', ageGroup:'adult', role:'other',
    language:'ko', tone:'friendly', channelName:'', target:'general',
    categories:[], styleAnalysis:null, createdAt: Date.now()
  }, defaults||{});
  profileSave(p);
  return p;
}

/* ─── 상단 배지 + 전환 모달 ─── */
function _renderProfileBadge(){
  let b = document.getElementById('profileBadge');
  const p = profileActive();
  if(!p){
    if(b) b.remove();
    return;
  }
  if(!b){
    b = document.createElement('button');
    b.id = 'profileBadge';
    b.className = 'profile-badge';
    b.type = 'button';
    b.addEventListener('click', profileOpenSwitcher);
    document.body.appendChild(b);
  }
  b.innerHTML = '<span class="emoji">' + (p.emoji||'🧑') + '</span><span class="name">' + (p.name||'프로필') + '</span>';
}
function profileOpenSwitcher(){
  let m = document.getElementById('profileModal');
  if(!m){
    m = document.createElement('div');
    m.id = 'profileModal';
    m.className = 'profile-modal';
    m.addEventListener('click', function(e){ if(e.target === m) m.classList.remove('on'); });
    document.body.appendChild(m);
  }
  const active = profileActive();
  const list = profileList();
  m.innerHTML =
    '<div class="profile-modal-body">' +
      '<h3>👤 누가 사용하나요?</h3>' +
      '<p class="sub">프로필을 바꾸면 모든 기록·스타일이 그 사람 것으로 전환돼요</p>' +
      '<div class="profile-grid">' +
        list.map(p => '<div class="profile-card' + (active && p.id===active.id ? ' on':'') + '" onclick="profileActivate(\'' + p.id + '\')">' +
          '<div class="emoji">' + (p.emoji||'🧑') + '</div>' +
          '<div class="name">' + p.name + '</div>' +
          (active && p.id===active.id ? '<div class="chk">사용중 ✓</div>' : '') +
        '</div>').join('') +
        '<div class="profile-card add" onclick="profileQuickAdd()">' +
          '<div class="emoji">➕</div><div class="name">새 프로필 추가</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;justify-content:flex-end">' +
        '<button class="mz-btn ghost" onclick="document.getElementById(\'profileModal\').classList.remove(\'on\')">닫기</button>' +
        '<button class="mz-btn" onclick="document.getElementById(\'profileModal\').classList.remove(\'on\');var t=document.querySelector(\'.toptab[data-mode=setting]\');if(t)t.click();setTimeout(function(){setOpen(\'profile\');}, 100)">⚙️ 상세 설정</button>' +
      '</div>' +
    '</div>';
  m.classList.add('on');
}
function profileQuickAdd(){
  const name = prompt('프로필 이름:'); if(!name) return;
  const p = profileCreate({ name });
  profileActivate(p.id);
  profileOpenSwitcher();
}

/* ─── 설정 탭: 나의 프로필 섹션 ─── */
function renderSetProfile(){
  const list = profileList();
  const active = profileActive();
  const editId = window._editingProfile || (active && active.id);
  const p = list.find(x => x.id === editId) || list[0] || { id:'', name:'', emoji:'🧑', ageGroup:'adult', role:'other', language:'ko', tone:'friendly', channelName:'', target:'general', categories:[], styleAnalysis:null };

  const emojiPicker = DEFAULT_EMOJIS.map(e =>
    '<button class="set-pill' + (p.emoji === e ? ' on':'') + '" onclick="document.getElementById(\'pf-emoji\').value=\'' + e + '\';document.querySelectorAll(\'#pf-emoji-row .set-pill\').forEach(x=>x.classList.remove(\'on\'));this.classList.add(\'on\')">' + e + '</button>'
  ).join('');

  return '<div class="set-panel">' +
    '<h3>👤 나의 프로필</h3>' +
    '<p class="hint">여러 사람이 같은 컴퓨터를 써도 각자 기록이 분리돼요. 최대 10개까지.</p>' +

    '<div class="profile-grid" style="margin:12px 0 14px">' +
      list.map(x => '<div class="profile-card' + (x.id===editId?' on':'') + '" onclick="window._editingProfile=\'' + x.id + '\';renderSetSection(\'profile\')">' +
        '<div class="emoji">' + (x.emoji||'🧑') + '</div>' +
        '<div class="name">' + x.name + '</div>' +
        (active && x.id===active.id ? '<div class="chk">사용중 ✓</div>' : '') +
      '</div>').join('') +
      '<div class="profile-card add" onclick="profileNewAndEdit()"><div class="emoji">➕</div><div class="name">새 프로필</div></div>' +
    '</div>' +

    (p.id ? (
      '<div class="set-budget-box">' +
        '<h4>✏️ 프로필 상세 설정</h4>' +
        '<div class="set-row">' +
          '<div><label>이름 / 별명</label><input class="set-in" id="pf-name" value="' + (p.name||'') + '"></div>' +
          '<div><label>이모지</label><input class="set-in" id="pf-emoji" value="' + (p.emoji||'🧑') + '" maxlength="2"></div>' +
          '<div><label style="opacity:.7">빠른 이모지 선택</label><div class="set-pill-row" id="pf-emoji-row" style="margin:0">' + emojiPicker + '</div></div>' +
        '</div>' +
        '<label>나이대</label>' +
        '<div class="set-pill-row" id="pf-age">' +
          ['child','youth','adult','senior'].map(v => '<button class="set-pill' + (p.ageGroup===v?' on':'') + '" onclick="_pfPick(\'pf-age\',\'ageGroup\',\'' + v + '\',this)">' +
            {child:'🌱 어린이', youth:'🌿 청소년', adult:'🌳 성인', senior:'🍂 시니어'}[v] +
          '</button>').join('') +
        '</div>' +
        '<label>역할</label>' +
        '<div class="set-pill-row" id="pf-role">' +
          ['youtuber','smb','public','student','parent','other'].map(v => '<button class="set-pill' + (p.role===v?' on':'') + '" onclick="_pfPick(\'pf-role\',\'role\',\'' + v + '\',this)">' +
            {youtuber:'📺 유튜버', smb:'🏪 소상공인', public:'🏛️ 공무원', student:'📚 학생', parent:'👨‍👩‍👧 학부모', other:'기타'}[v] +
          '</button>').join('') +
        '</div>' +
        '<label>기본 언어</label>' +
        '<div class="set-pill-row" id="pf-lang">' +
          ['ko','ja','both'].map(v => '<button class="set-pill' + (p.language===v?' on':'') + '" onclick="_pfPick(\'pf-lang\',\'language\',\'' + v + '\',this)">' +
            {ko:'🇰🇷 한국어', ja:'🇯🇵 일본어', both:'동시'}[v] +
          '</button>').join('') +
        '</div>' +
        '<label>말투 스타일</label>' +
        '<div class="set-pill-row" id="pf-tone">' +
          ['friendly','expert','emotional','formal'].map(v => '<button class="set-pill' + (p.tone===v?' on':'') + '" onclick="_pfPick(\'pf-tone\',\'tone\',\'' + v + '\',this)">' +
            {friendly:'친근하게', expert:'전문적으로', emotional:'감성적으로', formal:'격식체'}[v] +
          '</button>').join('') +
        '</div>' +

        (p.role === 'youtuber' ? (
          '<h4 style="margin-top:12px">📺 채널 설정 (유튜버)</h4>' +
          '<div class="set-row">' +
            '<div><label>채널명</label><input class="set-in" id="pf-channelName" value="' + (p.channelName||'') + '"></div>' +
            '<div><label>타겟 시청자</label><select class="set-in" id="pf-target">' +
              [['senior','시니어'],['general','일반'],['kids','어린이']].map(v => '<option value="' + v[0] + '" ' + (p.target===v[0]?'selected':'') + '>' + v[1] + '</option>').join('') +
            '</select></div>' +
          '</div>' +
          '<label>주요 카테고리 (복수 선택)</label>' +
          '<div class="set-pill-row" id="pf-cats">' +
            ['health','info','emotion','comedy','music'].map(v => '<button class="set-pill' + ((p.categories||[]).includes(v)?' on':'') + '" onclick="_pfToggleCat(\'' + v + '\',this)">' +
              {health:'건강', info:'정보', emotion:'감동', comedy:'유머', music:'음악'}[v] +
            '</button>').join('') +
          '</div>'
        ) : '') +

        '<div class="set-row" style="margin-top:14px">' +
          '<div><button class="set-btn" onclick="pfSave()">💾 저장</button></div>' +
          '<div><button class="set-btn" onclick="profileActivate(\'' + p.id + '\')">✅ 이 프로필로 전환</button></div>' +
          '<div><button class="set-btn ghost" onclick="pfDelete(\'' + p.id + '\')" style="color:var(--err)">🗑 삭제</button></div>' +
        '</div>' +
      '</div>' +

      _renderStyleLearning(p)
    ) : '<p class="hint" style="padding:16px;text-align:center">프로필이 없어요. "➕ 새 프로필" 을 눌러 만들어보세요.</p>') +
  '</div>';
}

function _renderStyleLearning(p){
  const st = p.styleAnalysis;
  return '<div class="set-budget-box" style="margin-top:14px;background:linear-gradient(135deg,#fff5fa,#f7f4ff)">' +
    '<h4>🧠 내 글쓰기 스타일 학습</h4>' +
    '<p class="hint" style="font-size:12px">선택사항. 내가 쓴 글을 붙여넣으면 AI 가 분석해서 내 말투로 써요.</p>' +
    '<label>내가 쓴 글 샘플 1</label>' +
    '<textarea class="set-in" id="pf-style-1" style="min-height:90px" placeholder="여기에 내가 쓴 글을 붙여넣으세요 (블로그·카톡·편지 등 아무거나)">' + (st?.sample1||'') + '</textarea>' +
    '<label style="margin-top:6px">샘플 2 (선택)</label>' +
    '<textarea class="set-in" id="pf-style-2" style="min-height:70px" placeholder="(선택) 두 번째 샘플">' + (st?.sample2||'') + '</textarea>' +
    '<button class="set-btn" style="margin-top:8px" onclick="pfAnalyzeStyle(\'' + p.id + '\')">🧠 내 스타일 분석하기</button>' +
    (st && st.summary ? (
      '<div class="set-budget-box" style="background:#fff;margin-top:10px;padding:12px">' +
        '<b>📊 분석 결과</b>' +
        '<div style="font-size:13px;line-height:1.7;margin-top:6px;white-space:pre-wrap">' + st.summary + '</div>' +
        '<div class="hint" style="font-size:11px;margin-top:6px">' + new Date(st.at||Date.now()).toLocaleString('ko-KR') + ' 분석</div>' +
      '</div>'
    ) : '') +
  '</div>';
}

function _pfPick(rowId, key, v, btn){
  document.querySelectorAll('#' + rowId + ' .set-pill').forEach(x => x.classList.remove('on'));
  btn.classList.add('on');
  window._pfPendingField = window._pfPendingField || {};
  window._pfPendingField[key] = v;
}
function _pfToggleCat(v, btn){
  btn.classList.toggle('on');
  const sel = Array.from(document.querySelectorAll('#pf-cats .set-pill.on')).map(x => x.textContent.trim());
  const map = {'건강':'health','정보':'info','감동':'emotion','유머':'comedy','음악':'music'};
  window._pfPendingField = window._pfPendingField || {};
  window._pfPendingField.categories = sel.map(x => map[x] || x);
}
function profileNewAndEdit(){
  const p = profileCreate({});
  window._editingProfile = p.id;
  renderSetSection('profile');
}
function pfSave(){
  const id = window._editingProfile;
  const cur = profileGet(id); if(!cur) return;
  const pending = window._pfPendingField || {};
  const p = Object.assign({}, cur, {
    name:   document.getElementById('pf-name').value.trim() || cur.name,
    emoji:  document.getElementById('pf-emoji').value.trim() || cur.emoji,
    channelName: document.getElementById('pf-channelName')?.value || cur.channelName,
    target: document.getElementById('pf-target')?.value || cur.target
  }, pending);
  profileSave(p);
  window._pfPendingField = {};
  _renderProfileBadge();
  alert('💾 저장됨');
  renderSetSection('profile');
}
function pfDelete(id){
  if(profileList().length <= 1){ alert('최소 1개 프로필은 남겨두세요'); return; }
  if(!confirm('이 프로필과 모든 기록을 삭제할까요?')) return;
  profileDelete(id);
  window._editingProfile = null;
  renderSetSection('profile');
}
async function pfAnalyzeStyle(id){
  const s1 = document.getElementById('pf-style-1').value.trim();
  const s2 = document.getElementById('pf-style-2').value.trim();
  if(!s1){ alert('최소 1개 샘플을 붙여넣어주세요'); return; }
  try{
    const sys =
      '아래 샘플에서 작성자의 글쓰기 스타일을 분석하라.\n' +
      '출력 형식(한국어, 5~6줄):\n' +
      '문장 길이: (짧은편/보통/긴편, 평균 글자수)\n' +
      '감정 온도: ★(1~5)\n' +
      '자주 쓰는 표현: "~", "~"\n' +
      '특징: (이모지/어미/문체 등 3가지)\n' +
      '다음 글을 이 스타일로 써야 하는 지침 2줄';
    const user = '=== 샘플 1 ===\n' + s1 + (s2 ? '\n\n=== 샘플 2 ===\n' + s2 : '');
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens: 800, featureId: 'style-analyze' });
    const cur = profileGet(id); if(!cur) return;
    cur.styleAnalysis = { sample1: s1, sample2: s2, summary: res.trim(), at: Date.now() };
    profileSave(cur);
    alert('🧠 분석 완료!');
    renderSetSection('profile');
  }catch(e){ alert('❌ ' + e.message); }
}

/* ─── AI 프롬프트 자동 주입 ─── */
function buildProfileSystemPrefix(){
  const p = profileActive();
  if(!p || !p.name) return '';
  const roleMap = {youtuber:'유튜버', smb:'소상공인', public:'공무원', student:'학생', parent:'학부모', other:'일반'};
  const ageMap  = {child:'어린이', youth:'청소년', adult:'성인', senior:'시니어'};
  const toneMap = {friendly:'따뜻하고 친근하게', expert:'전문적으로', emotional:'감성적으로', formal:'격식체로'};
  let out = '[사용자 정보]\n';
  out += '이름/별명: ' + p.name + '\n';
  out += '나이대: ' + (ageMap[p.ageGroup]||'성인') + '\n';
  out += '역할: ' + (roleMap[p.role]||'일반') + '\n';
  out += '기본 언어: ' + (p.language === 'ja' ? '일본어' : p.language === 'both' ? '한국어+일본어' : '한국어') + '\n';
  out += '선호 말투: ' + (toneMap[p.tone]||'친근하게') + '\n';
  if(p.channelName) out += '채널: ' + p.channelName + ' (타겟: ' + (p.target||'general') + ')\n';
  if(p.categories && p.categories.length) out += '주요 관심: ' + p.categories.join(', ') + '\n';
  if(p.styleAnalysis && p.styleAnalysis.summary){
    out += '학습된 작성자 스타일:\n' + p.styleAnalysis.summary + '\n';
  }
  out += '→ 이 사람의 스타일/의도/언어에 맞게 작성.\n\n';
  return out;
}

// APIAdapter 호출 래핑 — callWithFallback 과 callAI 모두에 프로필 정보 자동 prepend
(function hookProfileInjection(){
  if (typeof APIAdapter === 'undefined') return;
  if (APIAdapter._profileHooked) return;
  APIAdapter._profileHooked = true;
  ['callWithFallback','callAI'].forEach(fnName => {
    const orig = APIAdapter[fnName];
    if(typeof orig !== 'function') return;
    APIAdapter[fnName] = async function(system, user, opts){
      opts = opts || {};
      if(opts.skipProfile !== true){
        const prefix = buildProfileSystemPrefix();
        if(prefix) system = prefix + (system||'');
      }
      return orig.call(this, system, user, opts);
    };
  });
})();

// 초기 마운트
document.addEventListener('DOMContentLoaded', function(){
  if(!profileList().length){
    profileCreate({ name:'기본', emoji:'☕', ageGroup:'adult', role:'other', language:'ko', tone:'friendly' });
  }
  _renderProfileBadge();
});
if(document.readyState !== 'loading'){
  if(!profileList().length) profileCreate({ name:'기본', emoji:'☕', ageGroup:'adult', role:'other', language:'ko', tone:'friendly' });
  _renderProfileBadge();
}

// APIAdapter.callAI / callWithFallback 양쪽에 자동 비용 기록 + 예산 가드 후킹
(function hookAPIAdapter(){
  if (typeof APIAdapter === 'undefined' || typeof CostTracker === 'undefined') return;
  if (APIAdapter._costHooked) return;
  APIAdapter._costHooked = true;

  const wrap = (fnName) => {
    const orig = APIAdapter[fnName];
    if (typeof orig !== 'function') return;
    APIAdapter[fnName] = async function(system, user, opts){
      if (!CostTracker.canGenerate()) {
        const s = CostTracker.getStatus();
        throw new Error('이번달 예산 ' + CostTracker.getBudget().blockAt + '% 에 도달했어요. 설정에서 예산을 늘리거나 월말까지 기다려주세요. (사용률 ' + Math.round(s.usedPct) + '%)');
      }
      const result = await orig.call(this, system, user, opts);
      try {
        const provider = (opts && opts.provider) || APIAdapter.getProvider();
        const model = (opts && opts.model) ||
          (provider==='claude'  ? 'claude-sonnet-4-5' :
           provider==='openai'  ? (localStorage.getItem('uc_openai_model')||'gpt-4o') :
           provider==='gemini'  ? (localStorage.getItem('uc_gemini_model')||'gemini-2.0-flash') :
           provider==='minimax' ? (localStorage.getItem('uc_minimax_model')||'abab6.5s-chat') : 'claude-sonnet-4-5');
        CostTracker.record({
          model, inputText: (system||'') + '\n' + (user||''), outputText: result,
          featureId: opts && opts.featureId
        });
      } catch(e) { console.warn('[cost-tracker] record failed:', e); }
      return result;
    };
  };
  // callWithFallback 만 래핑하면 내부 callAI 는 원본 그대로 호출되어야 함 (이중 기록 방지).
  // 대신 callAI 는 "예산 가드만" 유지하고 기록은 각 호출 성공 지점에서 한다.
  wrap('callAI');
  wrap('callWithFallback');
})();

/* ─── ⚙️ 설정 모드 ─── */
const SET_HUB = [
  {id:'profile',ico:'👤',  title:'나의 프로필', desc:'여러 명이 따로 사용'},
  {id:'ai',     ico:'🔑',  title:'AI 연결',     desc:'AI 키를 넣어요'},
  {id:'cost',   ico:'💰',  title:'비용 관리',   desc:'얼마 썼는지 봐요'},
  {id:'theme',  ico:'🎨',  title:'꾸미기',      desc:'화면 색깔 바꿔요'},
  {id:'write',  ico:'✍️',  title:'글쓰기',      desc:'기본값 설정해요'},
  {id:'lock',   ico:'🔒',  title:'보안',        desc:'어린이 보호 설정'},
  {id:'stats',  ico:'📊',  title:'현황',        desc:'내 통계 봐요'}
];
let setActive = null;

function renderSettings(){
  const stage = document.getElementById('settingStage') || createSettingStage();
  stage.innerHTML = `
    <div class="set-top">
      <h2>⚙️ 설정 — 내 마음대로 꾸며요!</h2>
      <p>어려운 말 없이 쉽게 알려드려요. 아래 6개 카드 중 하나를 눌러주세요 ✨</p>
    </div>
    <div class="set-hub">${SET_HUB.map(c => `
      <button class="set-hub-card ${setActive===c.id?'on':''}" onclick="setOpen('${c.id}')">
        <span class="ico">${c.ico}</span>
        <strong>${c.title}</strong>
        <span>${c.desc}</span>
      </button>`).join('')}
    </div>
    <div id="set-content"></div>
    <!-- 의도반영: 프로필 & 스타일 관리 (조용히) -->
    <div style="margin-top:18px;padding:14px 18px;background:#fff;border:1px solid var(--line);border-radius:18px">
      <div id="intentMgrRoot"></div>
    </div>
  `;
  setTimeout(()=>{ if(window.IntentSystem) window.IntentSystem.renderProfileManager('intentMgrRoot'); }, 20);
  if (setActive) renderSetSection(setActive);
}
function createSettingStage(){
  const stage = document.createElement('div');
  stage.id = 'settingStage';
  stage.className = 'set-stage hide';
  document.querySelector('main.card .main').appendChild(stage);
  return stage;
}
function setOpen(id){ setActive = id; renderSettings(); }

function renderSetSection(id){
  const c = document.getElementById('set-content');
  c.innerHTML = ({
    profile: renderSetProfile,
    ai: renderSetAi, cost: renderSetCost, theme: renderSetTheme,
    write: renderSetWrite, lock: renderSetLock, stats: renderSetStats
  }[id] || (()=>''))();
  if (typeof window._setInit === 'function') { window._setInit(); window._setInit = null; }
  if (id === 'ai' && typeof _bindFallbackDnD === 'function') setTimeout(_bindFallbackDnD, 10);
}

/* ─── 섹션 1: 🔑 AI 연결 ─── */
function renderSetAi(){
  const keys = {
    claude:  localStorage.getItem('uc_claude_key')||'',
    openai:  localStorage.getItem('uc_openai_key')||'',
    gemini:  localStorage.getItem('uc_gemini_key')||'',
    minimax: localStorage.getItem('uc_minimax_key')||''
  };
  const models = {
    claude:  ['claude-sonnet-4-5','claude-haiku-4-5-20251001'],
    openai:  ['gpt-4o','gpt-4o-mini'],
    gemini:  ['gemini-2.0-flash','gemini-2.5-pro-exp-03-25'],
    minimax: ['abab6.5s-chat','abab6.5-chat']
  };
  const cur = {
    claude:  'claude-sonnet-4-5',
    openai:  localStorage.getItem('uc_openai_model')||'gpt-4o',
    gemini:  localStorage.getItem('uc_gemini_model')||'gemini-2.0-flash',
    minimax: localStorage.getItem('uc_minimax_model')||'abab6.5s-chat'
  };
  const card = (p, cls, title, tip, costHint, urlLabel, url) => {
    const on = !!keys[p];
    return `<div class="set-key-card ${cls}">
      <div class="khead"><strong>${title}</strong>
        <span class="set-status ${on?'on':'off'}">${on?'🟢 연결됨':'🔴 연결 안됨'}</span>
      </div>
      <p class="hint" style="margin:0 0 8px">${tip}</p>
      <div class="set-row">
        <div style="grid-column:1/3">
          <label>API 키</label>
          <input class="set-in" id="sk-${p}" type="password" placeholder="${p==='claude'?'sk-ant-api03-...':'sk-...'}" value="${keys[p]}">
        </div>
        <div>
          <label>모델</label>
          <select class="set-in" id="sm-${p}">${models[p].map(m=>`<option value="${m}" ${m===cur[p]?'selected':''}>${m}</option>`).join('')}</select>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
        <button class="set-btn" onclick="saveProvKey('${p}')">💾 저장</button>
        <button class="set-btn ghost" onclick="toggleKeyVis('sk-${p}')">👁️ 보기/숨기기</button>
        <a class="set-linkbtn" href="${url}" target="_blank" style="margin-left:auto">${urlLabel} ↗</a>
      </div>
      <p class="hint" style="margin:8px 0 0;font-size:11px">💰 ${costHint}</p>
    </div>`;
  };
  return `<div class="set-panel">
    <h3>🔑 AI 연결 설정</h3>
    <p class="hint">💡 "AI를 쓰려면 열쇠(키)가 필요해요. 게임 계정처럼 딱 한 번만 넣으면 계속 쓸 수 있어요!"</p>
    ${card('claude','claude','🟣 Claude (글쓰기 최고!)','한국어 글쓰기 품질 1위. 긴 문서·감성적 글에 강해요.','글 1개 = 약 15~50원','콘솔에서 잔액 확인','https://console.anthropic.com/')}
    ${card('openai','openai','🟢 OpenAI (다방면 최고!)','이미지·음성도 함께 써요. DALL-E와 키 공유 가능.','글 1개 = 약 5~20원 (mini) / 20~60원 (4o)','OpenAI에서 잔액 확인','https://platform.openai.com/usage')}
    ${card('gemini','gemini','🔵 Gemini (검색·정보 최고!)','무료 할당량이 넉넉해요. 가장 저렴!','글 1개 = 약 1~5원','Google에서 잔액 확인','https://aistudio.google.com/')}
    ${card('minimax','minimax','🔴 MiniMax (중국어·다국어 특화)','중국어/한·중·일 번역과 표현에 강해요. 긴 문서도 잘 처리해요.','글 1개 = 약 3~10원','MiniMax에서 키 받기','https://www.minimaxi.com/platform')}

    <details class="gd-fold">
      <summary>🎙 음성·🖼 이미지·🎬 영상·🎵 음악 키 (고급)</summary>
      <div style="padding:10px 0">
        <div class="set-row"><div style="grid-column:1/4"><label>🎙 ElevenLabs</label><input class="set-in" type="password" id="sk-11l" placeholder="sk_..." value="${localStorage.getItem('uc_elevenlabs_key')||''}"><button class="set-btn" onclick="saveMiscKey('11l','uc_elevenlabs_key')" style="margin-top:6px">저장</button><p class="hint" style="margin:6px 0 0;font-size:11px">💡 ElevenLabs에서 일본어 지원 음성을 선택하세요 (예: Yuki, Aria 등)</p></div></div>
        <div class="set-row"><div style="grid-column:1/4"><label>🎬 InVideo</label><input class="set-in" type="password" id="sk-iv" placeholder="..." value="${localStorage.getItem('uc_invideo_key')||''}"><button class="set-btn" onclick="saveMiscKey('iv','uc_invideo_key')" style="margin-top:6px">저장</button></div></div>
        <div class="set-row"><div style="grid-column:1/4"><label>🎵 Suno</label><input class="set-in" type="password" id="sk-suno" placeholder="..." value="${localStorage.getItem('uc_suno_key')||''}"><button class="set-btn" onclick="saveMiscKey('suno','uc_suno_key')" style="margin-top:6px">저장</button></div></div>
        <p class="hint">🖼 DALL·E는 OpenAI 키를 자동으로 씁니다 (위에서 저장한 키 사용)</p>
      </div>
    </details>

    <div class="set-budget-box" style="margin-top:12px">
      <h4>💡 키가 없어요!</h4>
      <p class="hint" style="margin:4px 0 10px">아직 키가 없어도 괜찮아요. 아래 버튼을 눌러서 무료로 받아요!</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <a class="set-linkbtn" href="https://aistudio.google.com/app/apikey" target="_blank">🔵 Gemini 키 받기 (무료!) ⭐</a>
        <a class="set-linkbtn" href="https://console.anthropic.com/" target="_blank">🟣 Claude 키 받기</a>
        <a class="set-linkbtn" href="https://platform.openai.com/api-keys" target="_blank">🟢 OpenAI 키 받기</a>
      </div>
    </div>

    ${renderAiStatusDashboard()}
    ${renderFallbackOrder()}
    ${renderFeatureMatrix()}
  </div>`;
}

/* ─── 🤖 AI 상태 대시보드 ─── */
function renderAiStatusDashboard(){
  const providers = [
    {id:'claude',  label:'🟣 Claude',   url:'https://console.anthropic.com/'},
    {id:'openai',  label:'🟢 ChatGPT',  url:'https://platform.openai.com/api-keys'},
    {id:'gemini',  label:'🔵 Gemini',   url:'https://aistudio.google.com/app/apikey'},
    {id:'minimax', label:'🔴 MiniMax',  url:'https://www.minimaxi.com/platform'}
  ];
  const rows = providers.map(p => {
    const hasKey = !!localStorage.getItem('uc_' + p.id + '_key');
    const st = (typeof APIAdapter !== 'undefined' && APIAdapter.getConnectionStatus) ? APIAdapter.getConnectionStatus(p.id) : null;
    const dot = !hasKey ? '🔴' : (st && st.state === 'error' ? '🔴' : (st && st.state === 'ok' ? '🟢' : '🟡'));
    const stText = !hasKey ? '🔴 키 없음' : (st && st.state === 'error' ? '🔴 오류 (' + ((st.info && st.info.kind) || '알 수 없음') + ')' : (st && st.state === 'ok' ? '🟢 연결됨 (정상)' : '🟡 키 있음 · 확인 전'));
    const lastErr = (st && st.state === 'error' && st.info && st.info.message) ? ('마지막 오류: ' + st.info.message.slice(0,80)) : '마지막 오류: 없음';
    return '<div class="ai-status-row" style="padding:10px 12px;background:#fff;border:1px solid var(--line);border-radius:12px;margin-bottom:8px;display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center">' +
      '<div><b>' + p.label + '</b> <span style="margin-left:8px;font-size:13px">' + stText + '</span>' +
      '<div class="hint" style="margin-top:2px;font-size:11px">' + lastErr + '</div></div>' +
      (hasKey
        ? '<button class="set-btn" onclick="testAiConnection(\'' + p.id + '\',this)">🔌 연결 테스트</button>'
        : '<a class="set-linkbtn" href="' + p.url + '" target="_blank">지금 키 받기</a>'
      ) +
    '</div>';
  }).join('');
  return '<div class="set-budget-box" style="margin-top:14px"><h4>🤖 AI 연결 상태</h4>' +
    '<p class="hint" style="margin:4px 0 10px">실시간 연결 확인 · 실패한 AI는 자동으로 다음 AI로 넘어가요.</p>' +
    rows +
  '</div>';
}
async function testAiConnection(provider, btn){
  if (typeof APIAdapter === 'undefined') { alert('api-adapter.js 미로드'); return; }
  const orig = btn.textContent;
  btn.disabled = true; btn.textContent = '⏳ 테스트 중...';
  try{
    const r = await APIAdapter.testConnection(provider);
    if(r.ok) alert('🟢 정상 작동합니다!\n\n응답: ' + (r.response||''));
    else {
      const msgMap = { auth:'🔴 API 키가 틀렸거나 만료됐어요', credit:'🔴 크레딧이 부족해요', rate:'🔴 잠시 후 다시 시도해주세요', server:'🔴 서버에 문제가 있어요', network:'🔴 연결할 수 없어요' };
      alert(msgMap[r.kind] || ('🔴 ' + r.message));
    }
  }catch(e){ alert('❌ ' + e.message); }
  finally{ btn.disabled = false; btn.textContent = orig; renderSetSection('ai'); }
}

/* ─── ⚙️ 자동 전환 (폴백) 우선순위 ─── */
function renderFallbackOrder(){
  if (typeof APIAdapter === 'undefined') return '';
  const order = APIAdapter.getFallbackOrder();
  const enabled = APIAdapter.isFallbackEnabled();
  const labelOf = id => ({claude:'🟣 Claude', openai:'🟢 ChatGPT', gemini:'🔵 Gemini', minimax:'🔴 MiniMax'}[id] || id);
  return '<div class="set-budget-box" style="margin-top:14px;background:linear-gradient(135deg,#f7f4ff,#eff6ff);border-color:#bcd7f0">' +
    '<h4>⚙️ 자동 전환 설정</h4>' +
    '<label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;padding:6px 0;cursor:pointer">' +
      '<input type="checkbox" id="fallback-enabled" ' + (enabled?'checked':'') + ' onchange="APIAdapter.setFallbackEnabled(this.checked);renderSetSection(\'ai\')"> ' +
      '오류 시 자동으로 다른 AI 사용' +
    '</label>' +
    '<p class="hint" style="margin:4px 0 10px">예: Claude 크레딧 부족 → OpenAI 로 즉시 전환 · 토스트 알림 표시</p>' +
    '<div id="fallback-list" style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:6px">' +
      order.map((id, i) => '<div class="fallback-row" draggable="true" data-id="' + id + '" style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:#fff;border:1px solid transparent;border-radius:8px;cursor:grab;user-select:none">' +
        '<span style="font-size:12px;color:var(--sub);width:36px">' + (i+1) + '순위</span>' +
        '<span style="flex:1;font-weight:900">' + labelOf(id) + '</span>' +
        '<span style="color:var(--muted);font-size:14px">☰</span>' +
      '</div>').join('') +
    '</div>' +
    '<p class="hint" style="margin:8px 0 0;font-size:11px">↑↓ 드래그로 순서 변경 · 저장은 자동</p>' +
  '</div>';
}

// DnD 바인딩 (렌더 후 DOM 준비 시점에 실행)
function _bindFallbackDnD(){
  const list = document.getElementById('fallback-list'); if(!list) return;
  let dragId = null;
  list.querySelectorAll('.fallback-row').forEach(row => {
    row.addEventListener('dragstart', e => { dragId = row.getAttribute('data-id'); row.style.opacity = '0.5'; });
    row.addEventListener('dragend',   e => { row.style.opacity = '1'; });
    row.addEventListener('dragover',  e => { e.preventDefault(); row.style.borderColor = 'var(--pink)'; });
    row.addEventListener('dragleave', e => { row.style.borderColor = 'transparent'; });
    row.addEventListener('drop', e => {
      e.preventDefault();
      row.style.borderColor = 'transparent';
      const overId = row.getAttribute('data-id');
      if(!dragId || dragId === overId) return;
      const cur = APIAdapter.getFallbackOrder();
      const from = cur.indexOf(dragId), to = cur.indexOf(overId);
      if(from < 0 || to < 0) return;
      cur.splice(to, 0, cur.splice(from, 1)[0]);
      APIAdapter.setFallbackOrder(cur);
      renderSetSection('ai');
    });
  });
}
// renderSetSection 후크: 폴백 섹션이 있으면 DnD 바인딩
const _origRenderSetSection = typeof renderSetSection === 'function' ? renderSetSection : null;

/* ─── 🤖 기능별 최적 AI 조합 (AI 연결 섹션 내부) ─── */
const FEATURE_MATRIX_TEXT = [
  {id:'script',          icon:'✍️', label:'대본/글쓰기'},
  {id:'official',        icon:'📋', label:'공공기관 문서'},
  {id:'small_business',  icon:'🏪', label:'소상공인'},
  {id:'translate_ko_ja', icon:'🌏', label:'한→일 번역'},
  {id:'translate_ko_en', icon:'🌏', label:'한→영 번역'},
  {id:'learning',        icon:'📚', label:'학습/교육'},
  {id:'kids',            icon:'🎮', label:'어린이 모드'},
  {id:'psychology',      icon:'🔮', label:'심리/운세'},
  {id:'auto_shorts',     icon:'⚡', label:'자동숏츠'},
  {id:'summary',         icon:'📝', label:'요약/정리'}
];
const FEATURE_MATRIX_IMAGE = [
  {id:'ghibli',       icon:'🎨', label:'지브리/애니'},
  {id:'realistic',    icon:'🎨', label:'실사/사진'},
  {id:'thumbnail',    icon:'🖼', label:'썸네일'},
  {id:'countryballs', icon:'🌍', label:'Countryballs'}
];
const FEATURE_MATRIX_TTS = [
  {id:'ko_emotional', icon:'🎙', label:'한국어 감동'},
  {id:'ko_general',   icon:'🎙', label:'한국어 일반'},
  {id:'ja_general',   icon:'🎙', label:'일본어'},
  {id:'tiki_taka_a',  icon:'🎙', label:'티키타카A'},
  {id:'tiki_taka_b',  icon:'🎙', label:'티키타카B'},
  {id:'kids',         icon:'🎙', label:'어린이'}
];

const TEXT_PROVIDER_CHOICES = [
  {provider:'claude', model:'claude-sonnet-4-5',         label:'🟣 Claude Sonnet'},
  {provider:'claude', model:'claude-haiku-4-5-20251001', label:'🟣 Claude Haiku'},
  {provider:'openai', model:'gpt-4o',                    label:'🟢 GPT-4o'},
  {provider:'openai', model:'gpt-4o-mini',               label:'🟢 GPT-4o-mini'},
  {provider:'gemini', model:'gemini-2.0-flash',          label:'🔵 Gemini Flash'}
];
const IMAGE_PROVIDER_CHOICES = [
  {provider:'ideogram', model:'ideogram-v2', label:'Ideogram'},
  {provider:'dalle3',   model:'dall-e-3',    label:'DALL-E 3'},
  {provider:'stability',model:'stable-image-core', label:'Stability'}
];
const TTS_PROVIDER_CHOICES = [
  {provider:'elevenlabs', voice:'Rachel',  label:'ElevenLabs Rachel'},
  {provider:'elevenlabs', voice:'Domi',    label:'ElevenLabs Domi'},
  {provider:'openai',     voice:'nova',    label:'OpenAI Nova'},
  {provider:'openai',     voice:'shimmer', label:'OpenAI Shimmer'},
  {provider:'nijivoice',  voice:'default', label:'Nijivoice'}
];

function _featureSignature(cfg){
  if(!cfg) return '';
  if(cfg.model) return cfg.provider + '|' + cfg.model;
  if(cfg.voice) return cfg.provider + '|' + cfg.voice;
  return cfg.provider || '';
}

function _featureRow(category, item, choices){
  const PC = (typeof ProviderConfig !== 'undefined') ? ProviderConfig : null;
  const cfg = PC ? PC.getFeatureDefault(category, item.id) : null;
  const sig = _featureSignature(cfg);
  const curLabel = (cfg && cfg.label) || '—';
  const reason   = (cfg && cfg.reason) || '';
  const opts = choices.map(c => {
    const csig = _featureSignature(c);
    return `<option value='${csig}' ${csig===sig?'selected':''}>${c.label}</option>`;
  }).join('');
  return `<tr>
    <td>${item.icon} ${item.label}</td>
    <td><b>${curLabel}</b></td>
    <td class="hint">${reason}</td>
    <td><select class="set-in feat-sel" data-cat="${category}" data-id="${item.id}">${opts}</select></td>
  </tr>`;
}

function renderFeatureMatrix(){
  const textRows  = FEATURE_MATRIX_TEXT.map(x => _featureRow('text',  x, TEXT_PROVIDER_CHOICES)).join('');
  const imageRows = FEATURE_MATRIX_IMAGE.map(x => _featureRow('image', x, IMAGE_PROVIDER_CHOICES)).join('');
  const ttsRows   = FEATURE_MATRIX_TTS.map(x => _featureRow('tts',   x, TTS_PROVIDER_CHOICES)).join('');
  return `<div class="set-budget-box" style="margin-top:16px;background:linear-gradient(135deg,#fff5fa,#eef6ff);border-color:#e0c5d8">
    <h4 style="margin:0">🤖 기능별 최적 AI 조합</h4>
    <p class="hint" style="margin:4px 0 10px">전문가가 설정한 최적 조합이에요. 바꾸고 싶으면 언제든지 변경 가능!</p>

    <table class="set-table" style="font-size:13px">
      <tr><th>기능</th><th>기본 AI</th><th>이유</th><th>변경</th></tr>
      ${textRows}
      <tr><td colspan="4" style="background:#f6eff7;font-weight:600">🎨 이미지</td></tr>
      ${imageRows}
      <tr><td colspan="4" style="background:#f6eff7;font-weight:600">🎙 음성</td></tr>
      ${ttsRows}
    </table>

    <div class="set-budget-box" style="margin-top:12px;background:#fff;border-color:#eadff1">
      <h4 style="margin:0 0 6px">💡 이 설정의 의미</h4>
      <ul style="margin:0;padding-left:18px;font-size:12px;line-height:1.8">
        <li><b>Claude</b> = 한국어/일본어 글쓰기 최강</li>
        <li><b>GPT-4o</b> = 영어 번역 최강</li>
        <li><b>Gemini</b> = 빠르고 저렴한 요약</li>
        <li><b>Ideogram</b> = 텍스트 포함 이미지 무료</li>
        <li><b>DALL-E 3</b> = 실사/캐릭터 품질 최강</li>
        <li><b>ElevenLabs</b> = 감성 목소리 최강</li>
        <li><b>Nijivoice</b> = 일본어 목소리 최강</li>
      </ul>
    </div>

    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
      <button class="set-btn" onclick="saveFeatureMatrix()">✅ 이 설정으로 저장</button>
      <button class="set-btn ghost" onclick="resetFeatureMatrix()">↩️ 전문가 추천으로 되돌리기</button>
    </div>
  </div>`;
}

function saveFeatureMatrix(){
  if (typeof ProviderConfig === 'undefined') { alert('providers.js 미로드'); return; }
  const CHOICE_BANK = { text:TEXT_PROVIDER_CHOICES, image:IMAGE_PROVIDER_CHOICES, tts:TTS_PROVIDER_CHOICES };
  const nodes = document.querySelectorAll('.feat-sel');
  let missing = [];
  nodes.forEach(sel => {
    const cat = sel.getAttribute('data-cat');
    const id  = sel.getAttribute('data-id');
    const sig = sel.value;
    const pick = (CHOICE_BANK[cat]||[]).find(c => _featureSignature(c) === sig);
    if(!pick) return;
    const base = ProviderConfig.getFeatureDefault(cat, id) || {};
    const merged = Object.assign({}, base, pick);
    ProviderConfig.setFeatureDefault(cat, id, merged);
    // API 키 미연결 체크 (텍스트만)
    if (cat === 'text' && typeof APIAdapter !== 'undefined' && !APIAdapter.hasApiKey(pick.provider)) {
      if (!missing.includes(pick.provider)) missing.push(pick.provider);
    }
  });
  if (missing.length) {
    const labels = missing.map(p => ({claude:'Claude',openai:'ChatGPT',gemini:'Gemini'}[p]||p)).join(', ');
    if (confirm('💾 저장 완료!\n\n🔑 [' + labels + '] 키가 아직 없어요. 지금 입력할까요?')) {
      document.querySelector('#sk-' + missing[0])?.focus();
      return;
    }
  } else {
    alert('✅ 기능별 AI 조합이 저장됐어요!');
  }
  renderSetSection('ai');
}

function resetFeatureMatrix(){
  if (typeof ProviderConfig === 'undefined') return;
  if (!confirm('모든 기능을 전문가 추천 기본값으로 되돌릴까요?')) return;
  ['text','image','tts'].forEach(cat => ProviderConfig.clearFeatureDefault(cat));
  alert('↩️ 전문가 추천으로 돌렸어요.');
  renderSetSection('ai');
}
function saveProvKey(p){
  const key = document.getElementById('sk-'+p).value.trim();
  const model = document.getElementById('sm-'+p).value;
  localStorage.setItem('uc_'+p+'_key', key);
  if (p === 'openai')  localStorage.setItem('uc_openai_model', model);
  if (p === 'gemini')  localStorage.setItem('uc_gemini_model', model);
  if (p === 'minimax') localStorage.setItem('uc_minimax_model', model);
  if (typeof APIAdapter !== 'undefined' && APIAdapter.setApiKey) {
    try { APIAdapter.setApiKey(p, key); } catch(_) { /* minimax may not be in STORAGE_KEYS yet */ }
  }
  alert('💾 '+p+' 키 저장됨');
  updateCostBar();
}
function saveMiscKey(id, key){ localStorage.setItem(key, document.getElementById('sk-'+id).value.trim()); alert('💾 저장됨'); }
function toggleKeyVis(id){ const el = document.getElementById(id); el.type = el.type === 'password' ? 'text' : 'password'; }

/* ─── 섹션 2: 💰 비용 관리 ─── */
function renderSetCost(){
  const s = CostTracker.getStatus();
  const t = CostTracker.getToday();
  const m = CostTracker.getMonth();
  const b = CostTracker.getBudget();
  const fx = CostTracker.getFxRate();
  const lvl = s.level;
  return `<div class="set-panel">
    <h3>💰 실시간 비용 관리</h3>
    <p class="hint">💡 "얼마나 쓰고 있는지 한눈에 봐요"</p>

    <div class="set-budget-box">
      <h4>☀️ 오늘 사용한 비용</h4>
      <ul style="font-size:13px;list-style:none;padding:0;margin:8px 0">
        <li>🟣 Claude: 약 ${Math.round(t.byProvider?.claude||0).toLocaleString()}원</li>
        <li>🟢 OpenAI: 약 ${Math.round(t.byProvider?.openai||0).toLocaleString()}원</li>
        <li>🔵 Gemini: 약 ${Math.round(t.byProvider?.gemini||0).toLocaleString()}원</li>
      </ul>
      <hr style="border:none;border-top:1px dashed #e8a6c6;margin:8px 0">
      <strong style="font-size:16px">합계: 약 ${Math.round(s.todayKRW).toLocaleString()}원</strong>
    </div>

    <div class="set-budget-box" style="background:linear-gradient(135deg,#eff6ff,#fff5fa);border-color:#bcd7f0">
      <h4>📅 이번달 사용 현황</h4>
      <p>사용: 약 <b>${Math.round(s.monthKRW).toLocaleString()}원</b> <span class="pill">${Math.round(s.usedPct)}%</span></p>
      <p>예산: ${b.monthly.toLocaleString()}원</p>
      <div class="set-progress ${lvl==='warn'?'warn':lvl==='block'?'block':''}"><div style="width:${Math.min(100,s.usedPct)}%"></div></div>
      <p>남은 예산: 약 ${Math.round(s.remaining).toLocaleString()}원</p>
      <p>이 속도면 이번달 예상: <b>약 ${Math.round(s.projected).toLocaleString()}원</b></p>
    </div>

    <h4>📊 예산 설정</h4>
    <div class="set-row">
      <div><label>이번달 예산 (원)</label><input class="set-in" type="number" id="set-bud-m" value="${b.monthly}"></div>
      <div><label>⚠️ 경고 시점 (%)</label><input class="set-in" type="number" id="set-bud-w" value="${b.warnAt}"></div>
      <div><label>🚫 차단 시점 (%)</label><input class="set-in" type="number" id="set-bud-b" value="${b.blockAt}"></div>
    </div>
    <button class="set-btn" onclick="saveBudget()">💾 예산 저장</button>

    <h4>💳 잔액 확인하기</h4>
    <p class="hint">정확한 잔액은 각 사이트에서 확인해주세요.</p>
    <a class="set-linkbtn" href="https://console.anthropic.com/" target="_blank">🟣 Claude 잔액 확인 → console.anthropic.com</a>
    <a class="set-linkbtn" href="https://platform.openai.com/usage" target="_blank">🟢 OpenAI 잔액 확인 → platform.openai.com/usage</a>
    <a class="set-linkbtn" href="https://aistudio.google.com/" target="_blank">🔵 Gemini 잔액 확인 → aistudio.google.com</a>

    <h4>📋 모델별 비용 비교표</h4>
    <table class="set-table">
      <tr><th>모델</th><th>품질</th><th>속도</th><th>글 1개 비용</th></tr>
      <tr><td>🟣 Claude Sonnet</td><td>⭐⭐⭐</td><td>보통</td><td>약 15~50원</td></tr>
      <tr><td>🟣 Claude Haiku</td><td>⭐⭐</td><td>빠름</td><td>약 2~8원</td></tr>
      <tr><td>🟢 GPT-4o</td><td>⭐⭐⭐</td><td>보통</td><td>약 20~60원</td></tr>
      <tr><td>🟢 GPT-4o-mini</td><td>⭐⭐</td><td>빠름</td><td>약 1~5원</td></tr>
      <tr><td>🔵 Gemini Flash</td><td>⭐⭐</td><td>아주 빠름</td><td>약 1~3원</td></tr>
    </table>

    <h4>⚡ 절약 모드</h4>
    <div class="set-pill-row">
      <button class="set-pill ${localStorage.getItem('uc_thrift')==='off'||!localStorage.getItem('uc_thrift')?'on':''}" onclick="setThrift('off')">⭕ 끄기 (설정한 모델 그대로)</button>
      <button class="set-pill ${localStorage.getItem('uc_thrift')==='on'?'on':''}" onclick="setThrift('on')">✅ 켜기 (자동으로 저렴한 모델 선택)</button>
    </div>

    <h4>💱 환율 설정</h4>
    <div class="set-row">
      <div><label>1달러 = ? 원</label><input class="set-in" type="number" id="set-fx" value="${fx}"></div>
      <div style="display:flex;align-items:flex-end"><button class="set-btn" onclick="saveFx()">💾 환율 저장</button></div>
      <div><label style="opacity:.6">마지막 업데이트</label><input class="set-in" value="${new Date().toLocaleDateString('ko-KR')}" readonly></div>
    </div>

    <h4>🤖 기능별 AI 선택</h4>
    <p class="hint">전문가 추천 조합은 <b>설정 → 🔑 AI 연결</b> 탭의 "기능별 최적 AI 조합" 표에서 관리해요.</p>
    <button class="set-btn" onclick="setOpen('ai')">🔑 AI 연결 탭으로 이동</button>
  </div>`;
}
function featureModelRow(id, label, def){
  const cur = localStorage.getItem('uc_fmodel_'+id) || def;
  return `<div class="set-row" style="grid-template-columns:1fr 2fr">
    <label style="padding-top:10px">${label}</label>
    <select class="set-in" onchange="localStorage.setItem('uc_fmodel_${id}',this.value)">
      <option value="claude" ${cur==='claude'?'selected':''}>🟣 Claude</option>
      <option value="openai" ${cur==='openai'?'selected':''}>🟢 OpenAI</option>
      <option value="gemini" ${cur==='gemini'?'selected':''}>🔵 Gemini</option>
    </select>
  </div>`;
}
function saveBudget(){
  CostTracker.setBudget(
    parseFloat(document.getElementById('set-bud-m').value),
    parseFloat(document.getElementById('set-bud-w').value),
    parseFloat(document.getElementById('set-bud-b').value)
  );
  alert('💾 예산 저장됨'); renderSetSection('cost');
}
function saveFx(){
  CostTracker.setFxRate(parseFloat(document.getElementById('set-fx').value)||1350);
  alert('💾 환율 저장됨'); renderSetSection('cost');
}
function setThrift(v){ localStorage.setItem('uc_thrift', v); renderSetSection('cost'); }
function recommendModels(){
  localStorage.setItem('uc_fmodel_script','claude');
  localStorage.setItem('uc_fmodel_translate','openai');
  localStorage.setItem('uc_fmodel_summary','gemini');
  localStorage.setItem('uc_fmodel_public','claude');
  localStorage.setItem('uc_fmodel_image','openai');
  alert('✨ 추천 설정 적용됨'); renderSetSection('cost');
}

/* ─── 섹션 3: 🎨 꾸미기 ─── */
function renderSetTheme(){
  const t = localStorage.getItem('uc_theme')||'light';
  const col = localStorage.getItem('uc_color')||'pink';
  const fs  = localStorage.getItem('uc_fontsize')||'mid';
  const mp  = localStorage.getItem('uc_menupos')||'left';
  return `<div class="set-panel">
    <h3>🎨 화면 꾸미기</h3>
    <p class="hint">내 마음대로 꾸며봐요!</p>

    <h4>☀️ 테마</h4>
    <div class="set-pill-row">
      <button class="set-pill ${t==='light'?'on':''}" onclick="setTheme('light')">☀️ 밝게</button>
      <button class="set-pill ${t==='dark'?'on':''}" onclick="setTheme('dark')">🌙 어둡게</button>
      <button class="set-pill ${t==='auto'?'on':''}" onclick="setTheme('auto')">🔄 자동</button>
    </div>

    <h4>🌈 색깔</h4>
    <div class="set-pill-row">
      <button class="set-pill ${col==='pink'?'on':''}" onclick="setColor('pink')">💜 핑크-보라</button>
      <button class="set-pill ${col==='blue'?'on':''}" onclick="setColor('blue')">💙 파랑</button>
      <button class="set-pill ${col==='orange'?'on':''}" onclick="setColor('orange')">🧡 주황</button>
      <button class="set-pill ${col==='mono'?'on':''}" onclick="setColor('mono')">🖤 흑백</button>
    </div>

    <h4>🔤 글자 크기</h4>
    <div class="set-pill-row">
      <button class="set-pill ${fs==='sm'?'on':''}" onclick="setFontSize('sm')">작게</button>
      <button class="set-pill ${fs==='mid'?'on':''}" onclick="setFontSize('mid')">보통</button>
      <button class="set-pill ${fs==='lg'?'on':''}" onclick="setFontSize('lg')">크게</button>
      <button class="set-pill ${fs==='xl'?'on':''}" onclick="setFontSize('xl')">아주 크게</button>
    </div>
    <p style="padding:12px;background:#fff5fa;border-radius:12px;margin-top:6px;font-size:${fs==='sm'?'11':fs==='lg'?'18':fs==='xl'?'22':'14'}px;font-weight:800">미리보기: "이 크기예요!"</p>

    <h4>📍 메뉴 위치</h4>
    <div class="set-pill-row">
      <button class="set-pill ${mp==='left'?'on':''}" onclick="setMenuPos('left')">◀️ 왼쪽</button>
      <button class="set-pill ${mp==='right'?'on':''}" onclick="setMenuPos('right')">오른쪽 ▶️</button>
    </div>

    <h4>✨ 특별</h4>
    <label class="set-check"><input type="checkbox" id="chk-noanim" ${localStorage.getItem('uc_noanim')==='1'?'checked':''} onchange="localStorage.setItem('uc_noanim',this.checked?'1':'0')">움직이는 효과 끄기 (배터리 절약)</label>
    <label class="set-check"><input type="checkbox" id="chk-hc" ${localStorage.getItem('uc_highcontrast')==='1'?'checked':''} onchange="localStorage.setItem('uc_highcontrast',this.checked?'1':'0')">눈 편한 모드 (고대비)</label>

    <h4 style="margin-top:20px">🌐 언어 설정</h4>
    <p class="hint">화면 언어</p>
    <div class="set-pill-row">
      <button class="set-pill on">🇰🇷 한국어</button>
      <button class="set-pill" onclick="alert('준비중 🚧')">🇯🇵 日本語 🚧</button>
      <button class="set-pill" onclick="alert('준비중 🚧')">🇺🇸 English 🚧</button>
    </div>

    <p class="hint" style="margin-top:10px">만들어지는 글</p>
    <select class="set-in" onchange="localStorage.setItem('uc_gen_lang',this.value)">
      <option value="ko" ${(localStorage.getItem('uc_gen_lang')||'kojp')==='ko'?'selected':''}>한국어만</option>
      <option value="jp" ${localStorage.getItem('uc_gen_lang')==='jp'?'selected':''}>일본어만</option>
      <option value="kojp" ${(localStorage.getItem('uc_gen_lang')||'kojp')==='kojp'?'selected':''}>한국어+일본어 동시</option>
      <option value="all" ${localStorage.getItem('uc_gen_lang')==='all'?'selected':''}>한·일·영 동시</option>
    </select>

    <p class="hint" style="margin-top:10px">말투</p>
    <div class="set-row">
      <div><label>한국어</label><select class="set-in" onchange="localStorage.setItem('uc_ko_speech',this.value)"><option value="formal" ${(localStorage.getItem('uc_ko_speech')||'formal')==='formal'?'selected':''}>존댓말</option><option value="casual" ${localStorage.getItem('uc_ko_speech')==='casual'?'selected':''}>반말</option></select></div>
      <div><label>일본어</label><select class="set-in" onchange="localStorage.setItem('uc_jp_speech',this.value)"><option value="keitai" ${(localStorage.getItem('uc_jp_speech')||'keitai')==='keitai'?'selected':''}>정중체</option><option value="jotai" ${localStorage.getItem('uc_jp_speech')==='jotai'?'selected':''}>보통체</option></select></div>
      <div><label>날짜 형식</label><select class="set-in" onchange="localStorage.setItem('uc_date_fmt',this.value)">
        <option value="ko" ${(localStorage.getItem('uc_date_fmt')||'ko')==='ko'?'selected':''}>2025년 4월 20일</option>
        <option value="jp" ${localStorage.getItem('uc_date_fmt')==='jp'?'selected':''}>2025年4月20日</option>
        <option value="en" ${localStorage.getItem('uc_date_fmt')==='en'?'selected':''}>April 20, 2025</option>
      </select></div>
    </div>
  </div>`;
}
function setTheme(v){ localStorage.setItem('uc_theme',v); document.body.dataset.theme=v; renderSetSection('theme'); }
function setColor(v){ localStorage.setItem('uc_color',v); renderSetSection('theme'); }
function setFontSize(v){ localStorage.setItem('uc_fontsize',v); renderSetSection('theme'); }
function setMenuPos(v){ localStorage.setItem('uc_menupos',v); renderSetSection('theme'); }

/* ─── 섹션 4: ✍️ 글쓰기 기본값 ─── */
function renderSetWrite(){
  const tone = localStorage.getItem('uc_def_tone')||'pro';
  const len  = localStorage.getItem('uc_def_len')||'mid';
  return `<div class="set-panel">
    <h3>✍️ 글쓰기 기본값</h3>
    <p class="hint">💡 "한 번 설정하면 매번 자동으로 적용돼요!"</p>

    <h4>🎭 기본 말투</h4>
    <div class="set-pill-row">
      <button class="set-pill ${tone==='friendly'?'on':''}" onclick="setDefTone('friendly')">😊 친근하게</button>
      <button class="set-pill ${tone==='pro'?'on':''}" onclick="setDefTone('pro')">💼 전문적으로</button>
      <button class="set-pill ${tone==='emo'?'on':''}" onclick="setDefTone('emo')">🌸 감성적으로</button>
      <button class="set-pill ${tone==='fun'?'on':''}" onclick="setDefTone('fun')">😄 재미있게</button>
    </div>

    <h4>📏 기본 길이</h4>
    <div class="set-pill-row">
      <button class="set-pill ${len==='short'?'on':''}" onclick="setDefLen('short')">짧게</button>
      <button class="set-pill ${len==='mid'?'on':''}" onclick="setDefLen('mid')">중간</button>
      <button class="set-pill ${len==='long'?'on':''}" onclick="setDefLen('long')">길게</button>
    </div>

    <h4>✅ 항상 포함할 것</h4>
    <label class="set-check"><input type="checkbox" onchange="localStorage.setItem('uc_inc_hash',this.checked?'1':'0')" ${localStorage.getItem('uc_inc_hash')==='1'?'checked':''}>#️⃣ 해시태그</label>
    <label class="set-check"><input type="checkbox" onchange="localStorage.setItem('uc_inc_emoji',this.checked?'1':'0')" ${localStorage.getItem('uc_inc_emoji')==='1'?'checked':''}>😊 이모지</label>
    <label class="set-check"><input type="checkbox" onchange="localStorage.setItem('uc_inc_en',this.checked?'1':'0')" ${localStorage.getItem('uc_inc_en')==='1'?'checked':''}>🇺🇸 영어 번역</label>
    <label class="set-check"><input type="checkbox" onchange="localStorage.setItem('uc_inc_br',this.checked?'1':'0')" ${localStorage.getItem('uc_inc_br')!=='0'?'checked':''}>↵ 줄바꿈</label>

    <h4>🚫 절대 쓰면 안 되는 단어</h4>
    <input class="set-in" id="set-banned" placeholder="쉼표로 구분. 예: 경쟁사이름, 민감한단어" value="${localStorage.getItem('uc_banned_words')||''}">
    <button class="set-btn" onclick="localStorage.setItem('uc_banned_words',document.getElementById('set-banned').value);alert('💾 저장됨')" style="margin-top:6px">💾 저장</button>
  </div>`;
}
function setDefTone(v){ localStorage.setItem('uc_def_tone',v); renderSetSection('write'); }
function setDefLen(v){ localStorage.setItem('uc_def_len',v); renderSetSection('write'); }

/* ─── 섹션 5: 🔒 보안 & 어린이 보호 ─── */
function renderSetLock(){
  const al = localStorage.getItem('uc_autolock')||'10';
  const kt = localStorage.getItem('uc_kids_timelimit')||'2h';
  const hist = localStorage.getItem('uc_hist_retention')||'month';
  return `<div class="set-panel">
    <h3>🔒 보안 & 어린이 보호</h3>
    <p class="hint">💡 "내 정보를 안전하게 지켜요"</p>

    <h4>🔐 내 정보 보호</h4>
    <label class="set-check"><input type="checkbox" onchange="if(this.checked){const p=prompt('비밀번호 4자리:');if(p&&p.length===4)localStorage.setItem('uc_app_lock',p);}else localStorage.removeItem('uc_app_lock')" ${localStorage.getItem('uc_app_lock')?'checked':''}>앱 잠금 비밀번호 사용</label>
    <label>자동 잠금</label>
    <div class="set-pill-row">
      <button class="set-pill ${al==='off'?'on':''}" onclick="localStorage.setItem('uc_autolock','off');renderSetSection('lock')">안 함</button>
      <button class="set-pill ${al==='10'?'on':''}" onclick="localStorage.setItem('uc_autolock','10');renderSetSection('lock')">10분 후</button>
      <button class="set-pill ${al==='30'?'on':''}" onclick="localStorage.setItem('uc_autolock','30');renderSetSection('lock')">30분 후</button>
    </div>
    <label class="set-check"><input type="checkbox" onchange="localStorage.setItem('uc_hide_key',this.checked?'1':'0')" ${localStorage.getItem('uc_hide_key')!=='0'?'checked':''}>🔐 API 키 별표로 숨기기</label>

    <h4>🧒 어린이 보호 설정</h4>
    <button class="set-btn" onclick="kParentMode()">🔒 어린이 모드 비밀번호 설정</button>
    <p class="hint" style="margin-top:10px">하루 사용 시간</p>
    <div class="set-pill-row">
      <button class="set-pill ${kt==='30m'?'on':''}" onclick="localStorage.setItem('uc_kids_timelimit','30m');renderSetSection('lock')">30분</button>
      <button class="set-pill ${kt==='1h'?'on':''}" onclick="localStorage.setItem('uc_kids_timelimit','1h');renderSetSection('lock')">1시간</button>
      <button class="set-pill ${kt==='2h'?'on':''}" onclick="localStorage.setItem('uc_kids_timelimit','2h');renderSetSection('lock')">2시간</button>
      <button class="set-pill ${kt==='off'?'on':''}" onclick="localStorage.setItem('uc_kids_timelimit','off');renderSetSection('lock')">제한 없음</button>
    </div>
    <p class="hint" style="margin-top:10px">허용 카테고리</p>
    ${['edu','kids','psy','smb','monetize','public','trans','shorts'].map(c=>{
      const cur = localStorage.getItem('uc_allow_'+c)!=='0';
      const label = {edu:'📚 학습/교육',kids:'🌈 어린이 모드',psy:'🔮 심리/운세 (숨기기)',smb:'🏪 소상공인',monetize:'💰 수익형',public:'🏛️ 공공기관',trans:'🌐 번역',shorts:'📱 자동숏츠'}[c];
      return `<label class="set-check"><input type="checkbox" ${cur?'checked':''} onchange="localStorage.setItem('uc_allow_${c}',this.checked?'1':'0')">${label}</label>`;
    }).join('')}

    <h4 style="margin-top:20px">💾 저장 & 백업</h4>
    <p class="hint">기록 보관 기간</p>
    <div class="set-pill-row">
      <button class="set-pill ${hist==='7d'?'on':''}" onclick="localStorage.setItem('uc_hist_retention','7d');renderSetSection('lock')">7일</button>
      <button class="set-pill ${hist==='month'?'on':''}" onclick="localStorage.setItem('uc_hist_retention','month');renderSetSection('lock')">한 달</button>
      <button class="set-pill ${hist==='3m'?'on':''}" onclick="localStorage.setItem('uc_hist_retention','3m');renderSetSection('lock')">3달</button>
      <button class="set-pill ${hist==='forever'?'on':''}" onclick="localStorage.setItem('uc_hist_retention','forever');renderSetSection('lock')">영원히</button>
    </div>
    <p class="hint" style="margin-top:10px">localStorage 용량</p>
    <div class="set-progress"><div id="set-storage-bar" style="width:0%"></div></div>
    <p class="hint" id="set-storage-text">계산 중...</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
      <button class="set-btn" onclick="exportSettings()">📥 내 설정 저장하기</button>
      <button class="set-btn ghost" onclick="importSettings()">📤 저장한 설정 불러오기</button>
    </div>

    <h4 style="margin-top:20px">⚠️ 초기화</h4>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button class="set-btn ghost" onclick="if(confirm('설정만 초기화할까요?')){Object.keys(localStorage).filter(k=>k.startsWith('uc_')&&!k.startsWith('uc_kids_')).forEach(k=>localStorage.removeItem(k));alert('✅ 초기화 완료');location.reload();}">설정만 초기화</button>
      <button class="set-btn danger" onclick="if(confirm('⚠️ 전체 데이터를 지울까요? 되돌릴 수 없어요!')){localStorage.clear();alert('✅ 전체 초기화');location.reload();}">전체 초기화</button>
    </div>
  </div>`;
}
function exportSettings(){
  const data = {};
  Object.keys(localStorage).filter(k=>k.startsWith('uc_')||k.startsWith('cost_')).forEach(k=>data[k]=localStorage.getItem(k));
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'uc_settings_'+Date.now()+'.json'; a.click();
  URL.revokeObjectURL(a.href);
}
function importSettings(){
  const f = document.createElement('input'); f.type = 'file'; f.accept = '.json';
  f.onchange = e => {
    const r = new FileReader();
    r.onload = () => {
      try{
        const data = JSON.parse(r.result);
        Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
        alert('✅ 불러오기 완료'); location.reload();
      }catch(err){ alert('❌ 파일 오류: '+err.message); }
    };
    r.readAsText(e.target.files[0]);
  };
  f.click();
}

/* ─── 섹션 6: 📊 현황 ─── */
function renderSetStats(){
  const m = CostTracker.getMonth();
  const features = m.byFeature||{};
  const sorted = Object.entries(features).sort((a,b)=>b[1].count-a[1].count);
  const medals = ['🥇','🥈','🥉'];
  const savedMinutes = (m.count||0) * 30;
  const savedMoney   = (m.count||0) * 50000;

  return `<div class="set-panel">
    <h3>📊 내 사용 통계</h3>
    <p class="hint">💡 "이번달 얼마나 썼고, 얼마나 절약했는지 봐요!"</p>

    <div class="set-budget-box">
      <h4>✨ 이번달 만든 것들</h4>
      <p style="font-size:16px;line-height:2">
        총 생성: <b>${m.count||0}개</b><br>
        💰 AI 비용: 약 <b>${Math.round(m.total).toLocaleString()}원</b>
      </p>
    </div>

    <h4>🏆 가장 많이 쓴 기능 TOP 3</h4>
    ${sorted.slice(0,3).map(([id, v], i) => `<p style="font-size:14px;padding:8px 12px;background:#fff5fa;border-radius:10px;margin:4px 0">${medals[i]} ${id}: ${v.count}회 (약 ${Math.round(v.krw).toLocaleString()}원)</p>`).join('') || '<p class="hint">아직 사용 기록이 없어요. 한번 써보세요! ✨</p>'}

    <h4>💎 절약 현황</h4>
    <div class="set-budget-box" style="background:linear-gradient(135deg,#effbf7,#fff7ee);border-color:#c8ebd9">
      <p style="font-size:15px;line-height:2">
        ⏰ 이번달 절약한 시간: 약 <b>${Math.floor(savedMinutes/60)}시간 ${savedMinutes%60}분</b><br>
        💰 이번달 절약한 비용: 약 <b>${savedMoney.toLocaleString()}원</b>
        <small style="display:block;color:var(--sub);font-size:11px;margin-top:6px">※ 평균 1개당 30분 · 전문가 5만원 기준 추정</small>
      </p>
    </div>

    <h4 style="margin-top:20px">📱 앱 정보</h4>
    <div class="set-key-card">
      <p><b>현재 버전:</b> v1.0.0</p>
      <p><b>내 플랜:</b> 🌟 소상공인 패키지 이용중 (예시)</p>
      <p><b>만료일:</b> 30일 후 (예시)</p>
      <button class="set-btn" style="margin-top:6px">다른 패키지로 바꾸기</button>
    </div>

    <h4>🆕 새로운 기능</h4>
    <p>🆕 감동스토리 롱폼 추가됨</p>
    <p>🆕 자동숏츠 8단계 파이프라인</p>
    <p>🆕 어린이 모드 (무지개 UI + 뱃지)</p>

    <h4>🔜 다음에 추가될 기능</h4>
    <p>🔜 유튜브 자동 업로드</p>
    <p>🔜 이미지 직접 생성</p>
    <p>🔜 모바일 앱 출시</p>

    <h4>💬 도움 & 지원</h4>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
      <button class="set-btn ghost" onclick="alert('💬 support@example.com')">💬 채팅 문의</button>
      <button class="set-btn ghost" onclick="alert('📧 support@example.com')">📧 이메일</button>
      <button class="set-btn ghost" onclick="alert('📹 youtube.com')">📹 유튜브 강의</button>
      <button class="set-btn ghost" onclick="alert('💡 새 기능 제안 감사해요!')">💡 기능 제안</button>
      <button class="set-btn ghost" onclick="alert('🐛 버그 신고 감사해요!')">🐛 버그 신고</button>
      <button class="set-btn ghost" onclick="alert('⭐ 후기 감사해요!')">⭐ 후기</button>
    </div>
  </div>`;
}

/* ─── setting 모드: renderGrid에서 토글 ─── */
(function hookSettingMode(){
  const origRender = window.renderGrid;
  window.renderGrid = function(){
    const stage = document.getElementById('settingStage');
    if (state.mode === 'setting') {
      ['monetizeDetail','publicDetail','eduDetail','transDetail','smbDetail','psyDetail','shortsDetail','kidsDetail','kidsStage','guideStage','libraryDetail','trendDetail','abDetail','shareDetail','aboutStage','qnaStage','intentStage'].forEach(id=>document.getElementById(id)?.classList.add('hide'));
      document.body.classList.remove('kids-mode');
      const hero = document.querySelector('.hero'); if (hero) hero.style.display='none';
      const grid = document.getElementById('grid'); if (grid) grid.style.display='none';
      const s = stage || createSettingStage();
      s.classList.remove('hide');
      renderSettings();
      return;
    } else if (stage) {
      stage.classList.add('hide');
    }
    origRender();
  };
})();

// 초기 비용 바 갱신
setTimeout(updateCostBar, 200);

/* ═══════════════════════════════════════════════
   📁 내 보관함 — LibraryStore + UI
   =============================================== */
(function(){
  const LS_HIST = 'lib_history_v1';
  const LS_FAV  = 'lib_favorites_v1';
  const LS_PROJ = 'lib_projects_v1';
  const LS_TRASH= 'lib_trash_v1';
  const HIST_LIMIT = 20;
  const TRASH_DAYS = 7;

  function now(){ return Date.now(); }
  function uid(){ return 'r'+now().toString(36)+Math.random().toString(36).slice(2,6); }
  function read(k, d){ try{ return JSON.parse(localStorage.getItem(k)||JSON.stringify(d)); }catch(_){ return d; } }
  function write(k, v){
    try{ localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch(e){ pruneForSpace(); try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(_){ return false; } }
  }
  function pruneForSpace(){
    const hist = read(LS_HIST, []);
    if(hist.length > 5){ write(LS_HIST, hist.slice(0, 10)); }
    write(LS_TRASH, []);
  }

  function titleFromText(t){
    if(!t) return '(제목 없음)';
    const first = String(t).split('\n').map(s=>s.trim()).find(s=>s && s.length>2) || '';
    return (first.replace(/[#*>`_~\-=]+/g,'').trim().slice(0,60)) || '(제목 없음)';
  }
  function sweepTrash(){
    const cutoff = now() - TRASH_DAYS*24*3600*1000;
    const t = read(LS_TRASH, []).filter(x => (x.trashedAt||now()) >= cutoff);
    write(LS_TRASH, t);
  }

  const Library = {
    saveResult({text, category, lang, title, projectId, meta}={}){
      if(!text || typeof text !== 'string') return null;
      const list = read(LS_HIST, []);
      const item = {
        id: uid(),
        createdAt: now(),
        category: category || 'other',
        lang: lang || 'ko',
        title: title || titleFromText(text),
        text: text,
        chars: text.length,
        favorite: false,
        projectId: projectId || null,
        meta: meta || {}
      };
      list.unshift(item);
      const trimmed = list.slice(0, HIST_LIMIT);
      write(LS_HIST, trimmed);
      showToast('✅ 보관함에 자동저장 됐어요!');
      return item.id;
    },
    getAll(){ return read(LS_HIST, []); },
    getFavorites(){ return read(LS_HIST, []).filter(x=>x.favorite); },
    getProjects(){ return read(LS_PROJ, []); },
    getTrash(){ sweepTrash(); return read(LS_TRASH, []); },
    toggleFavorite(id){
      const list = read(LS_HIST, []);
      const i = list.findIndex(x=>x.id===id); if(i<0) return;
      list[i].favorite = !list[i].favorite;
      write(LS_HIST, list);
    },
    moveToTrash(id){
      const list = read(LS_HIST, []);
      const i = list.findIndex(x=>x.id===id); if(i<0) return;
      const [it] = list.splice(i,1);
      it.trashedAt = now();
      const trash = read(LS_TRASH, []); trash.unshift(it);
      write(LS_HIST, list); write(LS_TRASH, trash);
    },
    restore(id){
      const trash = read(LS_TRASH, []);
      const i = trash.findIndex(x=>x.id===id); if(i<0) return;
      const [it] = trash.splice(i,1); delete it.trashedAt;
      const list = read(LS_HIST, []); list.unshift(it);
      write(LS_TRASH, trash); write(LS_HIST, list.slice(0, HIST_LIMIT));
    },
    deleteForever(id){
      write(LS_TRASH, read(LS_TRASH, []).filter(x=>x.id!==id));
    },
    assignProject(id, projectId){
      const list = read(LS_HIST, []);
      const i = list.findIndex(x=>x.id===id); if(i<0) return;
      list[i].projectId = projectId || null;
      write(LS_HIST, list);
      const projs = read(LS_PROJ, []);
      projs.forEach(p => {
        p.itemIds = (p.itemIds||[]).filter(x=>x!==id);
        if(p.id === projectId) p.itemIds.push(id);
        p.updatedAt = now();
      });
      write(LS_PROJ, projs);
    },
    createProject({name, kind, emoji, color, memo}){
      const projs = read(LS_PROJ, []);
      const p = { id:'p'+uid(), name:name||'새 프로젝트', kind:kind||'kr',
                  emoji:emoji||'📂', color:color||'pink', memo:memo||'',
                  createdAt:now(), updatedAt:now(), itemIds:[] };
      projs.unshift(p); write(LS_PROJ, projs); return p;
    },
    updateProject(id, patch){
      const projs = read(LS_PROJ, []);
      const i = projs.findIndex(x=>x.id===id); if(i<0) return;
      Object.assign(projs[i], patch, {updatedAt:now()});
      write(LS_PROJ, projs);
    },
    deleteProject(id){
      write(LS_PROJ, read(LS_PROJ, []).filter(x=>x.id!==id));
      const list = read(LS_HIST, []).map(x=> x.projectId===id ? Object.assign(x,{projectId:null}) : x);
      write(LS_HIST, list);
    },
    clearAll(){ write(LS_HIST, []); write(LS_FAV, []); },
    clearTrash(){ write(LS_TRASH, []); },
    exportAll(){
      return { version:1, exportedAt:now(),
               history: read(LS_HIST, []),
               favorites: read(LS_FAV, []),
               projects: read(LS_PROJ, []),
               trash: read(LS_TRASH, []) };
    },
    importAll(data, {merge=true}={}){
      if(!data || typeof data!=='object') throw new Error('잘못된 파일 형식');
      if(merge){
        const cur = read(LS_HIST, []); const inc = data.history||[];
        const ids = new Set(cur.map(x=>x.id));
        const merged = cur.concat(inc.filter(x=>!ids.has(x.id))).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
        write(LS_HIST, merged.slice(0, HIST_LIMIT));
        const p1 = read(LS_PROJ, []); const p2 = data.projects||[];
        const pids = new Set(p1.map(x=>x.id));
        write(LS_PROJ, p1.concat(p2.filter(x=>!pids.has(x.id))));
      } else {
        write(LS_HIST, (data.history||[]).slice(0, HIST_LIMIT));
        write(LS_PROJ, data.projects||[]);
        write(LS_TRASH, data.trash||[]);
      }
    },
    usage(){
      let used = 0;
      try{ for(const k in localStorage){ if(Object.prototype.hasOwnProperty.call(localStorage,k)){ used += (k.length + (localStorage.getItem(k)||'').length); } } }catch(_){}
      const quota = 5 * 1024 * 1024;
      return { used, quota, pct: Math.min(100, Math.round(used/quota*100)) };
    }
  };
  window.Library = Library;

  /* ─ Toast ─ */
  let toastTimer;
  function showToast(msg){
    let el = document.getElementById('libToast');
    if(!el){ el=document.createElement('div'); el.id='libToast'; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>el.classList.remove('on'), 2400);
  }
  window.libToast = showToast;

  /* ─ UI state ─ */
  const ui = { tab:'recent', cat:'all', time:'all', projectOpenId:null, newProjEmo:'🇰🇷', newProjColor:'pink' };

  function fmtDate(ts){
    const d = new Date(ts); const p = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${d.getHours()<12?'오전':'오후'} ${p(((d.getHours()+11)%12)+1)}:${p(d.getMinutes())}`;
  }
  function estMinutes(chars){ return Math.max(1, Math.round(chars/320)); }
  function langLabel(l){ return l==='jp'?'🇯🇵 일본어': l==='kojp'?'🇰🇷 한국어 + 🇯🇵 일본어': l==='en'?'🇺🇸 영어':'🇰🇷 한국어'; }
  function catLabel(c){
    const m={script:'📋 대본생성기',trans:'🌐 번역',blog:'📝 블로그',public:'🏛 공공기관',smb:'🏪 소상공인',
            edu:'📚 학습',psy:'🔮 심리운세',shorts:'📱 자동숏츠',media:'🎬 미디어',music:'🎵 음악',other:'✨ 기타'};
    return m[c] || m.other;
  }
  function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  /* ─ Renderers ─ */
  window.renderLibrary = function(){
    renderStats();
    renderUsage();
    renderActiveTab();
  };

  function renderStats(){
    const box = document.getElementById('libStats'); if(!box) return;
    const n = Library.getAll().length;
    const f = Library.getFavorites().length;
    const p = Library.getProjects().length;
    box.innerHTML = `
      <div class="lib-stat"><div class="icon">📋</div><div class="num">${n}</div><div class="lbl">총 결과물</div></div>
      <div class="lib-stat"><div class="icon">⭐</div><div class="num">${f}</div><div class="lbl">즐겨찾기</div></div>
      <div class="lib-stat"><div class="icon">📂</div><div class="num">${p}</div><div class="lbl">프로젝트</div></div>`;
  }
  function renderUsage(){
    const box = document.getElementById('libUsage'); if(!box) return;
    const u = Library.usage();
    const usedMB = (u.used/1024/1024).toFixed(2);
    const quotaMB = (u.quota/1024/1024).toFixed(0);
    box.innerHTML = `
      <div style="font-size:12px;font-weight:800;color:#5a4a56">용량 사용: ${u.pct}%</div>
      <div class="bar"><i style="width:${u.pct}%"></i></div>
      <div class="meta"><span>${usedMB}MB / ${quotaMB}MB</span>
        <span>${u.pct>=80?'⚠ 용량이 부족하면 오래된 것부터 삭제돼요':'넉넉해요 👍'}</span></div>`;
  }

  window.libSwitch = function(tab, btn){
    ui.tab = tab;
    document.querySelectorAll('#libTabs .lib-tab').forEach(b=>b.classList.remove('on'));
    if(btn) btn.classList.add('on');
    ['recent','favorite','project','trash'].forEach(k=>{
      const p = document.getElementById('libPanel-'+k); if(p) p.style.display = (k===tab?'block':'none');
    });
    renderActiveTab();
  };

  function renderActiveTab(){
    if(ui.tab==='recent')   renderRecent();
    else if(ui.tab==='favorite') renderFavorites();
    else if(ui.tab==='project')  renderProjects();
    else if(ui.tab==='trash')    renderTrash();
  }

  window.libSetCatFilter = function(cat, btn){
    ui.cat = cat;
    document.querySelectorAll('#libFilters .lib-fil[data-cat]').forEach(b=>b.classList.remove('on'));
    if(btn) btn.classList.add('on');
    renderRecent();
  };
  window.libSetTimeFilter = function(t, btn){
    ui.time = (ui.time===t ? 'all' : t);
    document.querySelectorAll('#libFilters .lib-fil[data-time]').forEach(b=>b.classList.remove('on'));
    if(ui.time!=='all' && btn) btn.classList.add('on');
    renderRecent();
  };

  function applyFilters(list){
    const q = (document.getElementById('libSearch')?.value || '').trim().toLowerCase();
    const t0 = now();
    const DAY = 24*3600*1000;
    return list.filter(x => {
      if(ui.cat!=='all' && x.category !== ui.cat) return false;
      if(ui.time==='today' && (t0 - x.createdAt) > DAY) return false;
      if(ui.time==='week'  && (t0 - x.createdAt) > 7*DAY) return false;
      if(ui.time==='month' && (t0 - x.createdAt) > 31*DAY) return false;
      if(q){
        const blob = ((x.title||'')+' '+(x.text||'')).toLowerCase();
        if(!blob.includes(q)) return false;
      }
      return true;
    });
  }

  function sortList(list){
    const s = document.getElementById('libSort')?.value || 'new';
    const copy = list.slice();
    if(s==='new') copy.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    else if(s==='old') copy.sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
    else if(s==='fav') copy.sort((a,b)=> (b.favorite?1:0)-(a.favorite?1:0) || (b.createdAt||0)-(a.createdAt||0));
    return copy;
  }

  function cardHtml(x, opts={}){
    const proj = Library.getProjects().find(p=>p.id===x.projectId);
    const prev = (x.text||'').replace(/\n+/g,' ').slice(0,120);
    const chips = [
      x.favorite ? '<span class="chip star">⭐ 즐겨찾기</span>' : '',
      `<span class="chip cat">${catLabel(x.category)}</span>`,
      proj ? `<span class="chip proj">${escapeHtml(proj.emoji)} ${escapeHtml(proj.name)}</span>` : ''
    ].join('');
    const acts = opts.trash ? `
        <button class="lib-btn ok"   onclick="libRestore('${x.id}')">♻ 복구</button>
        <button class="lib-btn warn" onclick="libDeleteForever('${x.id}')">🗑 완전삭제</button>` : `
        <button class="lib-btn" onclick="libView('${x.id}')">전체보기</button>
        <button class="lib-btn" onclick="libCopy('${x.id}')">복사</button>
        <button class="lib-btn gold" onclick="libToggleFav('${x.id}')">${x.favorite?'⭐ 해제':'⭐ 즐겨찾기'}</button>
        <button class="lib-btn" onclick="libAssign('${x.id}')">📂 프로젝트에 저장</button>
        <button class="lib-btn pri"  onclick="libReuse('${x.id}')">✏️ 이 설정으로 다시 만들기</button>
        <button class="lib-btn ok"   onclick="libSendShorts('${x.id}')">⚡ 숏츠로</button>
        <button class="lib-btn ok"   onclick="libSendMedia('${x.id}')">🎬 미디어로</button>
        <button class="lib-btn warn" onclick="libDelete('${x.id}')">🗑</button>`;
    return `<div class="lib-card" data-id="${x.id}">
      <div class="row1">${chips}</div>
      <h4>${escapeHtml(x.title||'(제목 없음)')}</h4>
      <div class="meta">${langLabel(x.lang)} · 📏 ${(x.chars||0).toLocaleString()}자 · ⏱ 약 ${estMinutes(x.chars||0)}분 · 📅 ${fmtDate(x.createdAt||0)}${opts.trash?' · 삭제일: '+fmtDate(x.trashedAt||0):''}</div>
      <div class="prev">${escapeHtml(prev)}${(x.text||'').length>120?'…':''}</div>
      <div class="acts">${acts}</div>
    </div>`;
  }

  function renderRecent(){
    const box = document.getElementById('libRecentCards'); if(!box) return;
    const list = sortList(applyFilters(Library.getAll()));
    if(!list.length){ box.innerHTML = `<div class="lib-empty">아직 저장된 결과가 없어요.<br>대본/번역/블로그 등에서 콘텐츠를 만들면 여기에 자동으로 쌓여요!</div>`; return; }
    box.innerHTML = list.map(x=>cardHtml(x)).join('');
  }
  window.libRenderRecent = renderRecent;

  function renderFavorites(){
    const box = document.getElementById('libFavCards'); if(!box) return;
    const list = Library.getFavorites();
    if(!list.length){ box.innerHTML = `<div class="lib-empty">아직 즐겨찾기가 없어요!<br>결과 카드의 ⭐ 버튼을 눌러보세요</div>`; return; }
    box.innerHTML = list.map(x=>cardHtml(x)).join('');
  }

  function renderTrash(){
    const box = document.getElementById('libTrashCards'); if(!box) return;
    const list = Library.getTrash();
    if(!list.length){ box.innerHTML = `<div class="lib-empty">휴지통이 비어있어요.</div>`; return; }
    box.innerHTML = list.map(x=>cardHtml(x,{trash:true})).join('');
  }

  function renderProjects(){
    const box = document.getElementById('libProjList'); if(!box) return;
    const projs = Library.getProjects();
    const openBox = document.getElementById('libProjOpen');
    if(ui.projectOpenId){
      const p = projs.find(x=>x.id===ui.projectOpenId);
      if(p){
        const items = Library.getAll().filter(x=>x.projectId===p.id);
        openBox.style.display='block';
        openBox.innerHTML = `
          <div class="lib-head" style="margin-bottom:10px">
            <div><h2>${escapeHtml(p.emoji)} ${escapeHtml(p.name)}</h2>
              <p>저장된 결과 ${items.length}개 · ${p.memo?escapeHtml(p.memo):'메모 없음'}</p></div>
            <div class="hd-actions"><button class="lib-btn" onclick="libCloseProject()">← 돌아가기</button></div>
          </div>
          <div class="lib-cards">${items.length? items.map(x=>cardHtml(x)).join('') : `<div class="lib-empty">이 프로젝트에 저장된 결과가 없어요.</div>`}</div>`;
      }
    } else {
      openBox.style.display='none';
    }
    if(!projs.length){
      box.innerHTML = `<div class="lib-empty">아직 프로젝트가 없어요.<br>아래 [+ 새 프로젝트 만들기] 버튼으로 시작해보세요!</div>`;
      return;
    }
    box.innerHTML = projs.map(p=>{
      const count = Library.getAll().filter(x=>x.projectId===p.id).length;
      return `<div class="lib-proj-card c-${p.color||'pink'}">
        <div class="emo">${escapeHtml(p.emoji||'📂')}</div>
        <div class="info">
          <strong>${escapeHtml(p.name)}</strong>
          <span>저장된 결과: ${count}개 · 마지막 작업: ${fmtDate(p.updatedAt||p.createdAt||0)}</span>
        </div>
        <div class="ops">
          <button class="lib-btn pri" onclick="libOpenProject('${p.id}')">열기</button>
          <button class="lib-btn"     onclick="libRenameProject('${p.id}')">수정</button>
          <button class="lib-btn warn" onclick="libDeleteProject('${p.id}')">🗑</button>
        </div>
      </div>`;
    }).join('');
  }
  window.libOpenProject = function(id){ ui.projectOpenId = id; renderProjects(); };
  window.libCloseProject = function(){ ui.projectOpenId = null; renderProjects(); };
  window.libRenameProject = function(id){
    const projs = Library.getProjects(); const p = projs.find(x=>x.id===id); if(!p) return;
    const name = prompt('새 프로젝트 이름', p.name); if(name===null) return;
    const memo = prompt('메모 (선택)', p.memo||''); if(memo===null) return;
    Library.updateProject(id, {name:name.trim()||p.name, memo});
    renderProjects(); renderStats();
  };
  window.libDeleteProject = function(id){
    if(!confirm('이 프로젝트를 삭제할까요?\n(안에 있던 결과는 보관함에 그대로 남아요)')) return;
    Library.deleteProject(id);
    if(ui.projectOpenId===id) ui.projectOpenId=null;
    renderProjects(); renderStats();
  };

  /* ─ New project form ─ */
  window.libToggleNewProj = function(){
    const el = document.getElementById('libNewProj');
    if(!el) return;
    el.style.display = (el.style.display==='none'||!el.style.display)?'block':'none';
  };
  document.addEventListener('click', function(e){
    const b = e.target.closest('#npEmoPick button, #npColorPick button');
    if(!b) return;
    const parent = b.parentElement;
    parent.querySelectorAll('button').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    if(parent.id==='npEmoPick') ui.newProjEmo = b.dataset.e;
    if(parent.id==='npColorPick') ui.newProjColor = b.dataset.c;
  });
  window.libCreateProject = function(){
    const name = (document.getElementById('npName')?.value||'').trim();
    if(!name){ alert('프로젝트 이름을 입력해주세요.'); return; }
    const kind = document.getElementById('npKind')?.value || 'kr';
    const memo = document.getElementById('npMemo')?.value || '';
    Library.createProject({name, kind, emoji:ui.newProjEmo, color:ui.newProjColor, memo});
    document.getElementById('npName').value=''; document.getElementById('npMemo').value='';
    document.getElementById('libNewProj').style.display='none';
    renderProjects(); renderStats();
    showToast('📂 새 프로젝트를 만들었어요!');
  };

  /* ─ Card actions ─ */
  function findItem(id){
    return Library.getAll().find(x=>x.id===id) || Library.getTrash().find(x=>x.id===id);
  }
  window.libView = function(id){
    const x = findItem(id); if(!x) return;
    const w = window.open('', '_blank', 'width=720,height=800');
    if(!w){ alert(x.text); return; }
    const safe = escapeHtml(x.text);
    w.document.write(`<!doctype html><meta charset="utf-8"><title>${escapeHtml(x.title||'결과')}</title>
      <body style="font-family:Pretendard,sans-serif;padding:20px;line-height:1.9;max-width:780px;margin:0 auto"><h2>${escapeHtml(x.title||'')}</h2>
      <pre style="white-space:pre-wrap;background:#fff9fc;border:1px solid #f1dce7;border-radius:12px;padding:16px">${safe}</pre></body>`);
    w.document.close();
  };
  window.libCopy = function(id){
    const x = findItem(id); if(!x) return;
    navigator.clipboard.writeText(x.text).then(()=>showToast('📋 복사됐어요!'), ()=>alert(x.text));
  };
  window.libToggleFav = function(id){ Library.toggleFavorite(id); renderActiveTab(); renderStats(); };
  window.libDelete = function(id){
    if(!confirm('이 결과를 휴지통으로 보낼까요?')) return;
    Library.moveToTrash(id); renderActiveTab(); renderStats();
    showToast('🗑 휴지통으로 옮겼어요 (7일 안에 복구 가능)');
  };
  window.libRestore = function(id){ Library.restore(id); renderActiveTab(); renderStats(); };
  window.libDeleteForever = function(id){
    if(!confirm('완전히 삭제할까요? (복구 불가)')) return;
    Library.deleteForever(id); renderActiveTab(); renderStats();
  };
  window.libAssign = function(id){
    const projs = Library.getProjects();
    if(!projs.length){ alert('먼저 프로젝트를 만들어주세요.\n[프로젝트] 탭에서 생성할 수 있어요.'); return; }
    const opts = projs.map((p,i)=>`${i+1}. ${p.emoji} ${p.name}`).join('\n');
    const ans = prompt('저장할 프로젝트 번호를 입력하세요:\n0 = 프로젝트 해제\n\n'+opts, '1');
    if(ans===null) return;
    const n = parseInt(ans, 10);
    if(n===0){ Library.assignProject(id, null); }
    else if(n>=1 && n<=projs.length){ Library.assignProject(id, projs[n-1].id); }
    else return;
    renderActiveTab(); renderStats();
    showToast('📂 프로젝트에 저장됐어요!');
  };
  window.libReuse = function(id){
    const x = findItem(id); if(!x) return;
    const tab = (x.meta && x.meta.scriptTab) || 'gen';
    try{
      const q = new URLSearchParams({tab, reuse:id}).toString();
      const map = {script:'engines/script/index.html', media:'engines/media/index.html', shorts:'engines/shorts/index.html'};
      const base = map[x.category] || 'engines/script/index.html';
      sessionStorage.setItem('lib_reuse_payload', JSON.stringify(x));
      location.href = base + '?' + q;
    }catch(e){ alert('다시 만들기 이동 실패: '+e.message); }
  };
  window.libSendShorts = function(id){
    const x = findItem(id); if(!x) return;
    const list = JSON.parse(localStorage.getItem('hub_scripts_v1')||'[]');
    list.unshift({source:'library', lang:x.lang||'ko', text:x.text, at:now(), meta:x.meta||{}});
    localStorage.setItem('hub_scripts_v1', JSON.stringify(list.slice(0,30)));
    if(confirm('⚡ 자동숏츠 엔진으로 이동할까요?')) location.href='engines/shorts/index.html';
  };
  window.libSendMedia = function(id){
    const x = findItem(id); if(!x) return;
    const list = JSON.parse(localStorage.getItem('hub_scripts_v1')||'[]');
    list.unshift({source:'library', lang:x.lang||'ko', text:x.text, at:now(), meta:x.meta||{}});
    localStorage.setItem('hub_scripts_v1', JSON.stringify(list.slice(0,30)));
    if(confirm('🎬 미디어 엔진으로 이동할까요?')) location.href='engines/media/index.html';
  };

  window.libClearAll = function(){
    if(!confirm('최근 결과를 모두 삭제할까요?\n(휴지통 경유 없이 바로 삭제됩니다)')) return;
    if(!confirm('정말 삭제할까요? 복구할 수 없어요.')) return;
    Library.clearAll(); renderActiveTab(); renderStats();
  };
  window.libTrashClear = function(){
    if(!confirm('휴지통을 비울까요? (복구 불가)')) return;
    Library.clearTrash(); renderActiveTab(); renderStats();
  };

  /* ─ Export / Import ─ */
  window.libExportAll = function(){
    const data = Library.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date(); const p=n=>String(n).padStart(2,'0');
    a.href = url; a.download = `보관함_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 500);
    showToast('💾 전체 내보내기 완료!');
  };
  window.libImportFile = function(e){
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const rd = new FileReader();
    rd.onload = ()=>{
      try{
        const data = JSON.parse(rd.result);
        Library.importAll(data, {merge:true});
        renderLibrary(); renderActiveTab();
        showToast('📥 불러오기 완료!');
      }catch(err){ alert('불러오기 실패: '+err.message); }
      finally{ e.target.value=''; }
    };
    rd.readAsText(f);
  };

  /* ─ Session reuse payload pickup (sibling engines can read sessionStorage) ─ */
  window.addEventListener('storage', ()=>{ if(ui.tab) renderActiveTab(); });

  sweepTrash();
})();

/* ═══════════════════════════════════════════════
   🔥 트렌드 분석 센터
   =============================================== */
(function(){
  const LS_FAV_CH = 'trend_fav_channels_v1';

  /* ─ 샘플 트렌드 데이터 (API 연동 전 기본값) ─ */
  const TREND_DATA = {
    kr: {
      all: [
        {k:'치매 예방 음식',     trend:'🔥 급상승 중',           cat:'시니어/건강', delta:'+180%'},
        {k:'노후 준비 방법',     trend:'📈 지난주 대비 +230%',   cat:'시니어/건강', delta:'+230%'},
        {k:'70대 건강 루틴',     trend:'📈 꾸준한 상승',         cat:'시니어/건강', delta:'+95%'},
        {k:'할머니 레시피',      trend:'🆕 신규 급상승',         cat:'감동',       delta:'+320%'},
        {k:'추억의 옛날 노래',   trend:'📈 시니어 최상위',       cat:'음악',       delta:'+140%'},
        {k:'은퇴 후 후회',       trend:'🔥 공감 폭발',           cat:'지식',       delta:'+210%'},
        {k:'60세 이후 운동법',   trend:'📈 꾸준한 인기',         cat:'시니어/건강', delta:'+85%'},
        {k:'부모님이 몰래 하는 일',trend:'🔥 감동 킬러',         cat:'감동',       delta:'+260%'},
        {k:'옛날 드라마 명장면',  trend:'📈 추억 소환',           cat:'감동',       delta:'+110%'},
        {k:'일본 여행 시니어',    trend:'🆕 새로운 흐름',         cat:'지식',       delta:'+175%'}
      ],
      cats:[{id:'all',label:'전체'},{id:'시니어/건강',label:'시니어/건강'},{id:'감동',label:'감동'},{id:'지식',label:'지식'},{id:'음악',label:'음악'},{id:'코믹',label:'코믹'}]
    },
    jp: {
      all: [
        {k:'老後の生活費',        trend:'🔥 急上昇中',             cat:'シニア/健康', delta:'+200%'},
        {k:'昭和の名曲',          trend:'📈 懐かしさ爆発',         cat:'音楽/演歌',   delta:'+160%'},
        {k:'認知症予防レシピ',    trend:'🔥 健康最前線',           cat:'シニア/健康', delta:'+145%'},
        {k:'高齢者の一日',        trend:'📈 共感急増',             cat:'感動',       delta:'+130%'},
        {k:'母の手紙',            trend:'🆕 涙腺崩壊',             cat:'感動',       delta:'+280%'},
        {k:'70代の運動習慣',      trend:'📈 実用最上位',           cat:'シニア/健康', delta:'+90%'},
        {k:'懐かしい昭和ドラマ',  trend:'📈 思い出の定番',         cat:'エンタメ',   delta:'+120%'},
        {k:'年金だけで暮らす',    trend:'🔥 リアル情報',           cat:'シニア/健康', delta:'+240%'},
        {k:'定年後の趣味',        trend:'📈 セカンドライフ',       cat:'エンタメ',   delta:'+100%'},
        {k:'日本の古い歌 名曲',   trend:'🆕 昭和ブーム',           cat:'音楽/演歌',   delta:'+155%'}
      ],
      cats:[{id:'all',label:'全体'},{id:'シニア/健康',label:'シニア/健康'},{id:'感動',label:'感動'},{id:'エンタメ',label:'エンタメ'},{id:'音楽/演歌',label:'音楽/演歌'}]
    },
    global: {
      all: [
        {k:'Senior fitness tips',     trend:'🔥 Fast rising',   cat:'health',   delta:'+210%'},
        {k:'Grandma recipes',         trend:'📈 Consistent',    cat:'cooking',  delta:'+140%'},
        {k:'Retirement lifestyle',    trend:'🔥 Trending',      cat:'lifestyle',delta:'+185%'},
        {k:'Memory care exercises',   trend:'🆕 New wave',      cat:'health',   delta:'+320%'},
        {k:'Old Japanese music',      trend:'📈 Nostalgia hit', cat:'music',    delta:'+120%'},
        {k:'Korean drama classics',   trend:'🔥 Rewatched',     cat:'entertainment',delta:'+250%'},
        {k:'Asian senior travel',     trend:'📈 Rising niche',  cat:'travel',   delta:'+95%'},
        {k:'Anti-aging foods',        trend:'🔥 Top topic',     cat:'health',   delta:'+170%'},
        {k:'Traditional remedies',    trend:'📈 Growing',       cat:'health',   delta:'+110%'},
        {k:'Family stories compilation',trend:'🆕 Emerging',    cat:'emotional',delta:'+290%'}
      ],
      cats:[{id:'all',label:'All'},{id:'health',label:'Health'},{id:'music',label:'Music'},{id:'entertainment',label:'Entertainment'},{id:'emotional',label:'Emotional'},{id:'lifestyle',label:'Lifestyle'}]
    },
    senior: {
      all: [
        {k:'치매 예방 3가지 습관',   trend:'🔥 급상승',        cat:'건강',    delta:'+250%'},
        {k:'할머니가 알려주는 지혜', trend:'📈 감동 최고조',    cat:'감동',    delta:'+180%'},
        {k:'부모님과의 추억',        trend:'🔥 눈물버튼',      cat:'가족',    delta:'+310%'},
        {k:'노후 생활비 절약',       trend:'📈 실용 정보',     cat:'노후',    delta:'+200%'},
        {k:'老後の楽しみ方',         trend:'📈 일본 시니어',   cat:'노후',    delta:'+165%'},
        {k:'昭和の思い出',           trend:'🔥 일본 추억',     cat:'추억',    delta:'+220%'},
        {k:'건강한 70대의 하루',     trend:'📈 루틴 최고',     cat:'건강',    delta:'+130%'},
        {k:'한일 시니어 비교',       trend:'🆕 틈새 시장',     cat:'가족',    delta:'+275%'},
        {k:'추억의 엔카 명곡',       trend:'📈 음악 감동',     cat:'추억',    delta:'+145%'},
        {k:'50세 이후 후회하는 것',  trend:'🔥 공감 폭발',     cat:'노후',    delta:'+240%'}
      ],
      cats:[{id:'all',label:'전체'},{id:'건강',label:'건강'},{id:'추억',label:'추억'},{id:'가족',label:'가족'},{id:'노후',label:'노후'}]
    }
  };

  /* ─ 월별 캘린더 데이터 ─ */
  const CAL = [
    {m:1,  ko:'신년·새해 다짐·건강검진·초심',            jp:'お正月・初詣・初日の出・書き初め'},
    {m:2,  ko:'설날·명절·밸런타인·겨울 건강',            jp:'節分・バレンタイン・梅まつり'},
    {m:3,  ko:'봄·건강관리·새학기·환절기',               jp:'ひな祭り・卒業式・春の訪れ'},
    {m:4,  ko:'벚꽃·봄나들이·건강식품·새출발',           jp:'花見・新年度・桜・入学式'},
    {m:5,  ko:'어버이날·가정의달·운동·부모님 감동',      jp:'こどもの日・母の日・GW旅行'},
    {m:6,  ko:'여름 준비·건강음료·장마 대비·여행',       jp:'梅雨・父の日・紫陽花'},
    {m:7,  ko:'휴가·더위 극복·시원한 음식·여름보양',     jp:'七夕・海の日・夏祭り・花火'},
    {m:8,  ko:'광복절·추억·역사 이야기·여름 끝자락',     jp:'お盆・終戦記念日・夏休みの思い出'},
    {m:9,  ko:'추석·명절 음식·가족 이야기·가을 건강',    jp:'敬老の日・お月見・秋分の日'},
    {m:10, ko:'가을·단풍·건강검진·운동',                 jp:'紅葉狩り・体育の日・食欲の秋'},
    {m:11, ko:'김장·겨울 준비·따뜻한 음식·가족',         jp:'七五三・勤労感謝の日・紅葉終盤'},
    {m:12, ko:'연말·크리스마스·한해 정리·신년 계획',     jp:'クリスマス・年末・大掃除・忘年会'}
  ];

  /* ─ UI 상태 ─ */
  const ui = { kwTab:'kr', catFil:'all', genre:'senior-emotion', target:'kr-senior' };

  function escapeHtml(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function esc(s){ return escapeHtml(s); }

  /* ─ API 호출 준비 ─ */
  function ensureAdapter(){
    if(typeof APIAdapter === 'undefined') return null;
    try{
      if(typeof AI_PROVIDER !== 'undefined') APIAdapter.setProvider(AI_PROVIDER);
      const ck=localStorage.getItem('uc_claude_key'); if(ck) APIAdapter.setApiKey('claude',ck);
      const ok=localStorage.getItem('uc_openai_key'); if(ok) APIAdapter.setApiKey('openai',ok);
      const gk=localStorage.getItem('uc_gemini_key'); if(gk) APIAdapter.setApiKey('gemini',gk);
    }catch(_){}
    return APIAdapter;
  }
  async function callAI(sys, user, opts){
    const A = ensureAdapter();
    if(!A) throw new Error('core/api-adapter.js 로드 필요');
    return A.callAI(sys, user, Object.assign({maxTokens:2400}, opts||{}));
  }

  /* ─ 렌더: 진입점 ─ */
  window.renderTrendHub = function(){
    renderKwTab();
    renderCalendar();
    renderFavChannels();
  };

  /* ─ 섹션1: 키워드 탭 ─ */
  window.trSwitchKw = function(tab, btn){
    ui.kwTab = tab; ui.catFil = 'all';
    document.querySelectorAll('#trKwTabs .tr-tab').forEach(b=>b.classList.remove('on'));
    if(btn) btn.classList.add('on');
    renderKwTab();
  };
  function renderKwTab(){
    const data = TREND_DATA[ui.kwTab]; if(!data) return;
    const fils = document.getElementById('trCatFils');
    if(fils){
      fils.innerHTML = data.cats.map(c =>
        `<button class="tr-cat-fil ${ui.catFil===c.id?'on':''}" onclick="trSetCat('${c.id}',this)">${esc(c.label)}</button>`
      ).join('');
    }
    const grid = document.getElementById('trKwGrid'); if(!grid) return;
    const list = data.all.filter(x => ui.catFil==='all' || x.cat===ui.catFil);
    grid.innerHTML = list.map((x,i)=>{
      const hot = (x.trend||'').indexOf('🔥')>=0;
      const langHint = ui.kwTab==='jp' ? '(일본어)' : ui.kwTab==='global' ? '(영어)' : '';
      return `<div class="tr-kw">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="rank">#${i+1}</span>
          <div style="flex:1;min-width:0">
            <div class="kw">${esc(x.k)} <span style="font-size:10px;color:var(--sub);font-weight:600">${langHint}</span></div>
            <div class="trend ${hot?'hot':''}">${esc(x.trend)} · ${esc(x.delta||'')}</div>
          </div>
        </div>
        <div class="meta">카테고리: ${esc(x.cat)}</div>
        <div class="acts">
          <button class="pri" onclick='trSendToScript(${JSON.stringify(x.k)})'>🎬 대본 만들기</button>
          <button class="ok" onclick='trSendToShorts(${JSON.stringify(x.k)})'>⚡ 숏츠 만들기</button>
          <button onclick='trSendToMedia(${JSON.stringify(x.k)})'>🎵 미디어</button>
          <button onclick='trCopyText(${JSON.stringify(x.k)})'>📋 복사</button>
        </div>
      </div>`;
    }).join('');
  }
  window.trSetCat = function(id, btn){
    ui.catFil = id;
    document.querySelectorAll('#trCatFils .tr-cat-fil').forEach(b=>b.classList.remove('on'));
    if(btn) btn.classList.add('on');
    renderKwTab();
  };

  /* ─ 엔진 연동 ─ */
  function pushScriptPayload(topic, extra){
    const list = JSON.parse(localStorage.getItem('hub_scripts_v1')||'[]');
    list.unshift({source:'trend', lang:'ko', text:'', topic, at:Date.now(), meta:Object.assign({trend:true}, extra||{})});
    localStorage.setItem('hub_scripts_v1', JSON.stringify(list.slice(0,30)));
    sessionStorage.setItem('trend_topic', topic);
  }
  window.trSendToScript = function(topic){
    pushScriptPayload(topic);
    if(confirm('🎬 이 주제로 대본을 만들어볼까요?\n\n→ '+topic)) location.href='engines/script/index.html?tab=gen&topic='+encodeURIComponent(topic);
  };
  window.trSendToShorts = function(topic){
    pushScriptPayload(topic, {shorts:true});
    if(confirm('⚡ 이 주제로 숏츠를 만들어볼까요?\n\n→ '+topic)) location.href='engines/shorts/index.html?topic='+encodeURIComponent(topic);
  };
  window.trSendToMedia = function(topic){
    pushScriptPayload(topic, {media:true});
    if(confirm('🎵 미디어 엔진으로 이동할까요?')) location.href='engines/media/index.html?topic='+encodeURIComponent(topic);
  };
  window.trCopyText = function(t){
    navigator.clipboard.writeText(t).then(()=>{
      if(typeof libToast==='function') libToast('📋 복사됐어요!'); else alert('복사됨');
    });
  };

  /* ─ 섹션2: URL 분석 ─ */
  window.trAnalyzeUrl = async function(){
    const url = (document.getElementById('trUrlInput').value||'').trim();
    if(!url){ alert('유튜브 URL을 입력해주세요.'); return; }
    const box = document.getElementById('trUrlResult');
    box.textContent = '⏳ AI가 영상 제목·키워드·잘된 이유를 분석 중...';
    try{
      const sys = `당신은 유튜브 콘텐츠 전략가입니다. 주어진 URL만 보고 추정되는 영상을 분석하세요 (실제 메타데이터 조회 없이 제목·패턴 추론). 반드시 다음 섹션을 포함:
1) 📊 영상 분석 결과 (추정 제목, 예상 조회수 수준: 높음/중간/낮음)
2) 잘된 이유 (3~5개, ✅로 시작)
3) 핵심 키워드 (3~6개) — [키워드] 형식
4) 비슷한 주제로 만들 대본 제안 3개
시니어(한국/일본) 채널 맥락을 염두에 두고 한국어로 답변.`;
      const r = await callAI(sys, `URL: ${url}`, {maxTokens:1800, featureId:'trend-url'});
      const html = r.replace(/\[([^\]]+)\]/g, (m,w)=>`<span class="kw-chip">${esc(w)}</span>`);
      box.innerHTML = html + `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
        <button class="tr-kw" style="padding:8px 12px;cursor:pointer;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:999px;font-size:12px;font-weight:800" onclick='trSendToScript("URL 분석 주제: ${esc(url)}")'>🎬 대본 만들기</button>
        <button class="tr-kw" style="padding:8px 12px;cursor:pointer;background:var(--green);border:1px solid #c2e8d8;color:#2f7a54;border-radius:999px;font-size:12px;font-weight:800" onclick='trSendToShorts("URL 분석 주제: ${esc(url)}")'>⚡ 숏츠 만들기</button>
      </div>`;
    }catch(e){ box.textContent = '❌ '+e.message; }
  };

  /* ─ 섹션3: 채널 분석 + 즐겨찾기 ─ */
  window.trAnalyzeChannel = async function(){
    const url = (document.getElementById('trChUrl').value||'').trim();
    if(!url){ alert('채널 URL을 입력해주세요.'); return; }
    const box = document.getElementById('trChResult');
    box.textContent = '⏳ 채널 특성·업로드 패턴·차별화 전략 분석 중...';
    try{
      const sys = `당신은 유튜브 채널 그로스 전략가입니다. 주어진 채널 URL을 바탕으로 추정되는 특성을 분석하고 다음 섹션을 모두 포함:
1) 📊 채널 분석 결과 (추정)
2) ✅ 인기 비결 5개 (업로드 주기/시간/주력 콘텐츠/썸네일 스타일/영상 길이)
3) 인기 영상 TOP5 키워드 — [키워드] 형식
4) 차별화 전략 제안 3~4개 (이 채널이 안 다루는 주제)
5) 추천 영상 주제 3개
한국 시니어 / 일본 시니어 채널 컨텍스트. 한국어로 답변.`;
      const r = await callAI(sys, `채널 URL: ${url}`, {maxTokens:2200, featureId:'trend-channel'});
      const html = r.replace(/\[([^\]]+)\]/g, (m,w)=>`<span class="kw-chip">${esc(w)}</span>`);
      box.innerHTML = html;
    }catch(e){ box.textContent = '❌ '+e.message; }
  };
  window.trSaveFavChannel = function(){
    const url = (document.getElementById('trChUrl').value||'').trim();
    if(!url){ alert('채널 URL을 입력한 뒤 눌러주세요.'); return; }
    const list = JSON.parse(localStorage.getItem(LS_FAV_CH)||'[]');
    if(list.find(x=>x.url===url)){ alert('이미 등록된 채널이에요.'); return; }
    if(list.length>=5){ alert('즐겨찾기는 최대 5개까지 가능해요.\n기존 채널을 삭제하고 추가해주세요.'); return; }
    const name = prompt('이 채널 별명 (예: 시니어 감동 채널 A)', '')||url.slice(0,30);
    list.unshift({url, name, at:Date.now()});
    localStorage.setItem(LS_FAV_CH, JSON.stringify(list));
    renderFavChannels();
    if(typeof libToast==='function') libToast('⭐ 즐겨찾기에 추가했어요!');
  };
  function renderFavChannels(){
    const box = document.getElementById('trFavList'); if(!box) return;
    const list = JSON.parse(localStorage.getItem(LS_FAV_CH)||'[]');
    if(!list.length){
      box.innerHTML = `<div style="padding:12px 14px;background:var(--pink-soft);border:1px dashed #f0c8de;border-radius:12px;font-size:11px;color:#7b4060">⭐ 아직 즐겨찾기 채널이 없어요. 채널을 분석한 뒤 [⭐ 즐겨찾기] 버튼을 눌러보세요.</div>`;
      return;
    }
    box.innerHTML = list.map((x,i)=>`<div class="tr-fav">
      <div class="info"><strong>${esc(x.name)}</strong><span>${esc(x.url)}</span></div>
      <div class="ops">
        <button onclick='trLoadFavChannel(${i})'>불러오기</button>
        <button onclick='trDeleteFavChannel(${i})' style="color:#b04040">🗑</button>
      </div>
    </div>`).join('');
  }
  window.trLoadFavChannel = function(i){
    const list = JSON.parse(localStorage.getItem(LS_FAV_CH)||'[]');
    if(!list[i]) return;
    document.getElementById('trChUrl').value = list[i].url;
    window.scrollTo({top:document.getElementById('trChUrl').getBoundingClientRect().top+window.scrollY-100, behavior:'smooth'});
  };
  window.trDeleteFavChannel = function(i){
    if(!confirm('이 즐겨찾기를 삭제할까요?')) return;
    const list = JSON.parse(localStorage.getItem(LS_FAV_CH)||'[]');
    list.splice(i,1);
    localStorage.setItem(LS_FAV_CH, JSON.stringify(list));
    renderFavChannels();
  };

  /* ─ 섹션4: 내 채널 키워드 전략 ─ */
  document.addEventListener('click', function(e){
    const g = e.target.closest('#trMyGenre button');
    if(g){
      g.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
      g.classList.add('on'); ui.genre = g.dataset.g;
    }
    const t = e.target.closest('#trMyTarget button');
    if(t){
      t.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
      t.classList.add('on'); ui.target = t.dataset.t;
    }
  });
  window.trStrategyMe = async function(){
    const kw = (document.getElementById('trMyKeywords').value||'').trim();
    const box = document.getElementById('trMyResult');
    box.textContent = '⏳ 맞춤 키워드 전략 분석 중...';
    const genreLabel = {'senior-emotion':'시니어 감동','comic':'코믹','knowledge':'지식','music':'음악'}[ui.genre]||ui.genre;
    const targetLabel = {'kr-senior':'한국 시니어','jp-senior':'일본 시니어','all':'전체'}[ui.target]||ui.target;
    try{
      const sys = `당신은 한국·일본 시니어 유튜브 채널 전문 SEO/키워드 전략가입니다. 채널 장르·타깃·현재 키워드를 바탕으로 다음을 한국어로 출력:
1) 🎯 내 채널 맞춤 키워드 전략
2) 지금 당장 써야 할 키워드 3~5개 (각 키워드: 경쟁 강도·조회수 잠재력 코멘트)
3) 일본 채널 추가 키워드 3개 (일본어 원문 + 한글 뜻)
4) 피해야 할 키워드 2~3개 (❌, 이유 포함)
5) 추천 영상 주제 5개 — 번호 매김, 마지막에 [대본만들기] 태그로 연결 암시`;
      const user = `채널 장르: ${genreLabel}\n타깃: ${targetLabel}\n현재 주력 키워드: ${kw||'(미입력)'}`;
      const r = await callAI(sys, user, {maxTokens:2200, featureId:'trend-my'});
      const html = r.replace(/\[([^\]]+)\]/g, (m,w)=>`<span class="kw-chip">${esc(w)}</span>`);
      box.innerHTML = html + `<div style="margin-top:10px"><button style="padding:9px 14px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:999px;font-size:12px;font-weight:800;cursor:pointer" onclick='trSendToScript("내 채널 추천 주제")'>🎬 1번 주제로 대본 만들기</button></div>`;
    }catch(e){ box.textContent = '❌ '+e.message; }
  };

  /* ─ 섹션5: 제목 분석기 ─ */
  window.trAnalyzeTitle = async function(){
    const title = (document.getElementById('trTitleInput').value||'').trim();
    if(!title){ alert('분석할 제목을 입력해주세요.'); return; }
    const box = document.getElementById('trTitleResult');
    box.textContent = '⏳ 제목 클릭률·개선안 분석 중...';
    try{
      const sys = `당신은 유튜브 썸네일·제목 클릭률(CTR) 전문가입니다. 주어진 한국어 제목을 분석하고 다음을 모두 포함해 한국어로 답변:
1) 📊 제목 분석 결과
2) 클릭률 예상 (★5개 만점, ex ★★★☆☆ 보통)
3) 개선 포인트 (✅ 잘한 점 2~3개, ⚠️ 아쉬운 점 2~3개)
4) 개선된 제목 추천 3개 (숫자/궁금증/구체성 활용)
5) 일본어 제목 자동 생성 3개 (시니어 공감 톤)
6) 마지막 줄에 "[이 제목으로 대본 만들기]" 제안`;
      const r = await callAI(sys, `제목: ${title}`, {maxTokens:1800, featureId:'trend-title'});
      box.innerHTML = r + `<div style="margin-top:10px"><button style="padding:9px 14px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:999px;font-size:12px;font-weight:800;cursor:pointer" onclick='trSendToScript(${JSON.stringify(title)})'>🎬 이 제목으로 대본 만들기</button></div>`;
    }catch(e){ box.textContent = '❌ '+e.message; }
  };

  /* ─ 섹션6: 캘린더 ─ */
  function renderCalendar(){
    const box = document.getElementById('trCalendar'); if(!box) return;
    const hl  = document.getElementById('trCalHighlight');
    const now = new Date();
    const curM = now.getMonth()+1;
    const nextM = (curM%12)+1;
    const cur = CAL.find(x=>x.m===curM);
    const nxt = CAL.find(x=>x.m===nextM);
    if(hl && cur && nxt){
      hl.innerHTML = `<h5>🗓 이번달(${curM}월) 추천 주제 · 다음달(${nextM}월) 미리 준비</h5>
        <p><b>이번달:</b> 🇰🇷 ${esc(cur.ko)} / 🇯🇵 ${esc(cur.jp)}</p>
        <p><b>다음달:</b> 🇰🇷 ${esc(nxt.ko)} / 🇯🇵 ${esc(nxt.jp)}</p>
        <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
          <button style="padding:8px 12px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;border:none;border-radius:999px;font-size:12px;font-weight:800;cursor:pointer" onclick='trSendToScript(${JSON.stringify(cur.ko.split(/[·,、]/)[0])})'>🎬 이달의 추천 주제로 대본 만들기</button>
          <button style="padding:8px 12px;background:var(--green);border:1px solid #c2e8d8;color:#2f7a54;border-radius:999px;font-size:12px;font-weight:800;cursor:pointer" onclick='trSendToShorts(${JSON.stringify(cur.ko.split(/[·,、]/)[0])})'>⚡ 숏츠 만들기</button>
        </div>`;
    }
    box.innerHTML = CAL.map(x=>`<div class="tr-cal-cell ${x.m===curM?'now':''}">
      <h5>${x.m}月 ${x.m===curM?'· 지금!':''}</h5>
      <div class="ko">🇰🇷 ${esc(x.ko)}</div>
      <div class="jp">🇯🇵 ${esc(x.jp)}</div>
    </div>`).join('');
  }

})();
console.log('✅ 🔥 트렌드 분석 센터 로드 완료');

/* ═══════════════════════════════════════════════
   🎉 온보딩 · 오늘의 추천 · 샘플 미리보기 · 도움말 FAB · 준비 현황
   =============================================== */
(function(){
  const LS_DONE = 'onboarding_done';
  const LS_USER = 'user_type';
  const LS_DATE = 'onboarding_date';
  const KEY_NAMES = ['uc_claude_key','uc_openai_key','uc_gemini_key'];

  function hasKey(){ return KEY_NAMES.some(k=>{ const v=localStorage.getItem(k); return v && v.trim().length>0; }); }
  function getUserType(){ return localStorage.getItem(LS_USER) || 'youtuber'; }
  function setUserType(t){ localStorage.setItem(LS_USER, t); }
  function markDone(){
    localStorage.setItem(LS_DONE, '1');
    localStorage.setItem(LS_DATE, new Date().toISOString());
  }

  /* ─ 월별 추천 주제 (유저 타입별) ─ */
  const SEASONAL = {
    1: {season:'신년·새해 다짐·건강검진', soon:'구정 준비'},
    2: {season:'설날·명절·밸런타인',     soon:'봄 맞이'},
    3: {season:'봄·건강관리·새학기',     soon:'벚꽃·어린이날 준비'},
    4: {season:'봄·어린이날 준비·건강검진', soon:'어버이날 콘텐츠'},
    5: {season:'어버이날·가정의달·스승의날', soon:'6월 여름 준비'},
    6: {season:'여름 준비·건강음료·장마', soon:'7월 휴가 시즌'},
    7: {season:'휴가·더위 극복·시원한 음식', soon:'8월 광복절'},
    8: {season:'광복절·추억·역사', soon:'9월 추석 준비'},
    9: {season:'추석·명절 음식·가족', soon:'10월 가을 콘텐츠'},
    10:{season:'가을·단풍·건강검진', soon:'11월 김장 시즌'},
    11:{season:'김장·겨울 준비·따뜻한 음식', soon:'12월 연말 콘텐츠'},
    12:{season:'연말·크리스마스·한해 정리', soon:'1월 신년 다짐'}
  };
  const TOPICS_BY_USER = {
    youtuber: [
      {flag:'🇰🇷', topic:'치매 예방 음식 TOP5',      note:'🔥 급상승 중! 지금 만들면 좋아요'},
      {flag:'🇯🇵', topic:'老後の健康習慣',          note:'일본 시니어 채널 인기 주제'}
    ],
    smb: [
      {flag:'📱', topic:'이달의 신메뉴 인스타 소개', note:'🔥 고객 반응 높은 포맷'},
      {flag:'🎁', topic:'단골 고객 감사 이벤트 안내', note:'리텐션 UP'}
    ],
    public: [
      {flag:'📰', topic:'시즌 보도자료 (환절기 건강수칙)', note:'배포 최적 시점'},
      {flag:'📋', topic:'민원 안내문 예시',          note:'공문 톤으로 자동 생성'}
    ],
    student: [
      {flag:'📚', topic:'오늘의 독서 감상문 주제',   note:'학년별 맞춤'},
      {flag:'✏️', topic:'시사 이슈 에세이 주제',     note:'학교 숙제용'}
    ],
    worker: [
      {flag:'💼', topic:'주간 업무보고 템플릿',      note:'30분 → 3분'},
      {flag:'📧', topic:'거래처 감사 메일',          note:'톤 자동 조정'}
    ],
    curious: [
      {flag:'🎮', topic:'지금 가장 인기있는 숏츠 주제', note:'카테고리별 TOP'},
      {flag:'🌏', topic:'한일 시니어 트렌드 비교',   note:'비교 콘텐츠 핫함'}
    ]
  };
  const SAMPLES = {
    script: {
      title:'📺 숏츠 대본 샘플',
      ko:'"안녕하세요! 오늘은 깜짝 놀랄 사실을 알려드릴게요. 치매를 예방하는 음식이 있다는 거 알고 계셨나요? 지금부터 그 다섯 가지를 천천히 소개해드릴 테니 끝까지 함께 봐주세요..."',
      jp:'"こんにちは！今日は驚きの事実をお伝えします。認知症を防ぐ食べ物があるのをご存知ですか？これから5つを、ゆっくりご紹介します..."',
      go:'script'
    },
    blog: {
      title:'📝 블로그 포스팅 샘플',
      ko:'"50대가 되면서 가장 자주 느끼는 변화는 무엇일까요? 오늘은 갱년기 극복을 도와주는 일상 습관 3가지를 정리해드립니다. 직접 해본 결과부터 솔직하게..."',
      jp:null, go:'monetize'
    },
    doc: {
      title:'📋 보도자료 샘플',
      ko:'"○○시는 시민 건강 증진을 위해 오는 5월 1일부터 만 60세 이상 시민을 대상으로 무료 건강검진을 실시한다고 20일 밝혔다..."',
      jp:null, go:'public'
    },
    trans: {
      title:'🌐 번역 샘플',
      ko:'"바쁘신 와중에 도와주셔서 감사드립니다. 덕분에 일정에 맞게 잘 마무리할 수 있었습니다."',
      jp:'"お忙しい中、ご協力ありがとうございました。おかげさまで予定通り無事に完了できました。"',
      go:'trans'
    },
    smb: {
      title:'📱 인스타그램 게시물 샘플',
      ko:'"오늘의 특별메뉴 🌟 신선한 제철 재료로 만든 한정 런치세트! 점심 피크 전에 꼭 들러주세요 #오늘의메뉴 #수제 #동네맛집"',
      jp:null, go:'smb'
    }
  };

  /* ─ 오버레이 DOM 주입 ─ */
  const overlay = document.createElement('div');
  overlay.id = 'obOverlay';
  overlay.innerHTML = `
    <div class="ob-modal" role="dialog" aria-modal="true">
      <div class="ob-head">
        <div class="ob-prog" id="obProg"></div>
        <button class="ob-close" onclick="window.obClose()" aria-label="닫기">✕</button>
      </div>
      <div class="ob-body" id="obBody"></div>
      <div class="ob-foot" id="obFoot"></div>
    </div>`;
  document.body.appendChild(overlay);

  /* ─ FAB + 팝업 ─ */
  const fab = document.createElement('button');
  fab.id='helpFab'; fab.innerHTML='❓'; fab.title='도움말';
  fab.onclick = ()=> document.getElementById('helpPop').classList.toggle('on');
  document.body.appendChild(fab);

  const pop = document.createElement('div');
  pop.id = 'helpPop';
  pop.innerHTML = `
    <h4>무엇을 도와드릴까요?
      <button class="x" onclick="document.getElementById('helpPop').classList.remove('on')" aria-label="닫기">✕</button>
    </h4>
    <div class="row">
      <button onclick="window.obRestart()">🚀 온보딩 다시 보기</button>
      <button onclick="window.obGoGuide()">📖 가이드 탭</button>
      <button onclick="window.obGoSettings()">🔑 API 키 설정</button>
      <button onclick="document.getElementById('helpFaq').scrollIntoView({behavior:'smooth'})">💬 자주 묻는 질문</button>
    </div>
    <div class="faq" id="helpFaq">
      <div class="q">Q. API 키가 없어요</div>
      <div>→ <a href="https://console.anthropic.com/" target="_blank" rel="noopener">Claude</a> 또는 <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">OpenAI</a>에서 무료로 발급받으세요.</div>
      <div class="q">Q. 결과가 안 나와요</div>
      <div>→ 먼저 ⚙️ 설정 모드에서 API 키를 입력해주세요.</div>
      <div class="q">Q. 일본어도 나오나요?</div>
      <div>→ 네! 가사/음원·대본 생성 시 한·일 동시 버전을 만들 수 있어요.</div>
    </div>`;
  document.body.appendChild(pop);

  /* ─ 오버레이 상태 ─ */
  const state = { step:0, userType:null };
  const TOTAL_STEPS = 5;

  const USERS = [
    {id:'youtuber', ico:'📺', name:'유튜버/크리에이터', desc:'숏츠·롱폼·채널 운영'},
    {id:'smb',      ico:'🏪', name:'소상공인/자영업자', desc:'SNS·메뉴판·홍보'},
    {id:'public',   ico:'🏛️', name:'공무원/공공기관',   desc:'보고서·공문·보도자료'},
    {id:'student',  ico:'📚', name:'학생/학부모',        desc:'숙제·교육·워크북'},
    {id:'worker',   ico:'💼', name:'직장인/프리랜서',    desc:'보고서·이메일·번역'},
    {id:'curious',  ico:'🎮', name:'그냥 궁금해서',      desc:'여러 기능 둘러보기'}
  ];
  const FIRST_STEPS = {
    youtuber: {ico:'🎬', title:'숏츠 대본 만들기',
      steps:['왼쪽에서 "대본 생성기" 클릭','"일반 대본" 선택','주제 입력','생성 버튼 클릭!'], time:'2분', cost:'약 15원',
      finalBtn:'🎬 첫 대본 만들러 가기!', goHref:'engines/script/index.html?tab=gen'},
    smb: {ico:'📱', title:'인스타그램 게시물 만들기',
      steps:['왼쪽에서 "소상공인 패키지" 클릭','"SNS 운영" 선택','가게 정보 입력','생성 버튼 클릭!'], time:'2분', cost:'약 10원',
      finalBtn:'📱 첫 SNS 게시물 만들기!', setCategory:'smb'},
    public: {ico:'📋', title:'보도자료 만들기',
      steps:['왼쪽에서 "공공기관 패키지" 클릭','"보도/홍보" 선택','내용 입력','생성 버튼 클릭!'], time:'3분', cost:'약 20원',
      finalBtn:'📋 첫 보도자료 만들기!', setCategory:'public'},
    student: {ico:'📚', title:'숙제 도움받기',
      steps:['왼쪽에서 "학습/교육" 클릭','원하는 과목·형식 선택','주제 입력','생성 버튼 클릭!'], time:'3분', cost:'약 15원',
      finalBtn:'📚 첫 숙제 도움받기!', setCategory:'edu'},
    worker: {ico:'💼', title:'업무 이메일·번역 만들기',
      steps:['왼쪽에서 "번역/통역" 또는 "수익형" 선택','세부 유형 선택','내용 입력','생성 버튼 클릭!'], time:'2분', cost:'약 10원',
      finalBtn:'💼 첫 업무 결과 만들기!', setCategory:'trans'},
    curious: {ico:'🌟', title:'이것저것 둘러보기',
      steps:['사이드바의 각 카테고리를 하나씩 눌러보세요','마음에 드는 카드를 클릭','가이드 모드로 사용법 확인','원하는 기능으로 시작!'], time:'—', cost:'—',
      finalBtn:'🌟 메인으로 시작하기!', setCategory:'script'}
  };

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function render(){
    const body = document.getElementById('obBody');
    const foot = document.getElementById('obFoot');
    const prog = document.getElementById('obProg');
    prog.innerHTML = '';
    for(let i=0;i<TOTAL_STEPS;i++){
      const d = document.createElement('div');
      d.className = 'dot' + (i<=state.step?' on':'');
      prog.appendChild(d);
    }

    if(state.step===0){
      body.innerHTML = `
        <h2>🎉 환영해요!</h2>
        <p class="sub">통합 콘텐츠 생성기에 오신 걸 환영해요!<br><b>5분이면 첫 번째 결과를 만들 수 있어요</b></p>
        <div class="ob-info-card">
          <h4>💡 준비된 기능</h4>
          <p>유튜브 대본 · 블로그 · 보도자료 · 번역 · 소상공인 SNS · 학습자료 · 트렌드 분석까지 한 곳에서!</p>
        </div>`;
      foot.innerHTML = `
        <button class="ob-btn ghost" onclick="window.obSkip()">나중에 볼게요 (건너뛰기)</button>
        <button class="ob-btn pri" onclick="window.obNext()">지금 바로 시작하기 →</button>`;
    }
    else if(state.step===1){
      body.innerHTML = `
        <h2>어떤 분이신가요?</h2>
        <p class="sub">딱 맞게 안내해드려요!</p>
        <div class="ob-usergrid">
          ${USERS.map(u=>`<button class="ob-usercard ${state.userType===u.id?'on':''}" data-u="${u.id}" onclick="window.obPickUser('${u.id}')">
            <span class="ico">${u.ico}</span>
            <strong>${esc(u.name)}</strong>
            <span>${esc(u.desc)}</span>
          </button>`).join('')}
        </div>`;
      foot.innerHTML = `
        <button class="ob-btn" onclick="window.obPrev()">← 이전</button>
        <button class="ob-btn pri" onclick="window.obNext()" ${state.userType?'':'disabled style="opacity:.5;cursor:not-allowed"'}>다음 →</button>`;
    }
    else if(state.step===2){
      const fs = FIRST_STEPS[state.userType] || FIRST_STEPS.youtuber;
      body.innerHTML = `
        <h2>첫 번째로 이걸 해보세요!</h2>
        <p class="sub">당신에게 꼭 맞는 빠른 시작 안내예요</p>
        <div class="ob-step-card">
          <h4>${fs.ico} ${esc(fs.title)}</h4>
          <ol>${fs.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>
          <div class="meta"><span>⏱ 예상 시간: ${esc(fs.time)}</span><span>💰 예상 비용: ${esc(fs.cost)}</span></div>
        </div>`;
      foot.innerHTML = `
        <button class="ob-btn" onclick="window.obPrev()">← 이전</button>
        <button class="ob-btn pri" onclick="window.obNext()">다음 →</button>`;
    }
    else if(state.step===3){
      body.innerHTML = `
        <h2>🔑 AI를 쓰려면 키가 필요해요</h2>
        <p class="sub">딱 한 번만 넣으면 끝이에요!</p>
        <div class="ob-info-card">
          <h4>API 키가 뭐예요?</h4>
          <p>도서관 회원증 같은 거예요. 회원증이 있어야 책을 빌리듯, 키가 있어야 AI를 쓸 수 있어요.</p>
        </div>
        <div style="font-size:13px;font-weight:800;color:#5a4a56;margin:14px 0 6px">지금 키가 있나요?</div>
        <div class="ob-key-row">
          <button class="ob-btn pri" onclick="window.obGoSettings()">✅ 네! 키 입력하러 가기</button>
        </div>
        <div style="font-size:12px;color:var(--sub);margin:8px 0 4px">❌ 아직 없어요 — 무료 발급:</div>
        <div class="ob-key-row">
          <button class="ob-btn" onclick="window.open('https://console.anthropic.com/','_blank')">Claude 키 받기 →</button>
          <button class="ob-btn" onclick="window.open('https://platform.openai.com/api-keys','_blank')">OpenAI 키 받기 →</button>
        </div>
        <div style="font-size:11px;color:var(--sub);margin-top:8px">⏩ 지금은 샘플만 보고 싶다면 그냥 "다음"을 눌러주세요.</div>`;
      foot.innerHTML = `
        <button class="ob-btn" onclick="window.obPrev()">← 이전</button>
        <button class="ob-btn pri" onclick="window.obNext()">다음 →</button>`;
    }
    else if(state.step===4){
      const fs = FIRST_STEPS[state.userType] || FIRST_STEPS.youtuber;
      body.innerHTML = `
        <div class="ob-finale">
          <div class="emo">🎉</div>
          <h2 style="text-align:center">모든 준비가 됐어요!</h2>
          <p class="sub" style="text-align:center">지금 바로 첫 번째 결과를 만들어봐요!</p>
        </div>
        <button class="ob-btn pri" onclick="window.obFinish()" style="width:100%;padding:16px;font-size:15px">${esc(fs.finalBtn)}</button>
        <p class="sub" style="text-align:center;margin-top:14px;font-size:11px">언제든지 우측 하단 ❓ 버튼 또는 가이드 탭에서 다시 볼 수 있어요</p>`;
      foot.innerHTML = `
        <button class="ob-btn" onclick="window.obPrev()">← 이전</button>
        <button class="ob-btn ok" onclick="window.obFinish()">완료!</button>`;
    }
  }

  /* ─ 공개 API ─ */
  window.obOpen = function(){ state.step=0; state.userType = getUserType(); overlay.classList.add('on'); render(); };
  window.obClose = function(){ overlay.classList.remove('on'); };
  window.obSkip = function(){ markDone(); overlay.classList.remove('on'); refreshMainWidgets(); };
  window.obPrev = function(){ if(state.step>0){ state.step--; render(); } };
  window.obNext = function(){
    if(state.step===1 && !state.userType){ alert('직업을 하나 선택해주세요!'); return; }
    if(state.step < TOTAL_STEPS-1){ state.step++; render(); }
  };
  window.obPickUser = function(id){ state.userType = id; setUserType(id); render(); };
  window.obGoSettings = function(){
    const t = document.querySelector('.toptab[data-mode="setting"]');
    if(t){ t.click(); overlay.classList.remove('on'); document.getElementById('helpPop').classList.remove('on'); }
    else apiKeyMissingToast();
  };
  window.obGoGuide = function(){
    const t = document.querySelector('.toptab[data-mode="guide"]');
    if(t){ t.click(); document.getElementById('helpPop').classList.remove('on'); }
  };
  window.obRestart = function(){
    document.getElementById('helpPop').classList.remove('on');
    window.obOpen();
  };
  window.obFinish = function(){
    markDone();
    const fs = FIRST_STEPS[state.userType||'youtuber'];
    overlay.classList.remove('on');
    refreshMainWidgets();
    if(fs && fs.goHref){ location.href = fs.goHref; return; }
    if(fs && fs.setCategory && typeof window.__hubGoCategory==='function'){
      try{ window.__hubGoCategory(fs.setCategory); window.scrollTo({top:0,behavior:'smooth'}); }catch(_){}
    }
  };

  /* ─ 메인 위젯 렌더 ─ */
  function refreshMainWidgets(){
    renderSetupPanel();
    renderTopicsWidget();
    renderSampleWidget();
  }

  function renderSetupPanel(){
    const box = document.getElementById('hpSetup'); if(!box) return;
    if(hasKey()){
      box.className = 'hp-setup done';
      box.innerHTML = `<div style="font-size:14px;font-weight:800;color:#2f7a54;text-align:center">🎉 모든 준비 완료! 바로 시작하세요!</div>`;
      box.style.display = 'block';
      setTimeout(()=>{ box.style.display='none'; }, 4000);
    } else {
      box.className = 'hp-setup';
      box.innerHTML = `
        <h3>🔧 시작 준비 현황</h3>
        <div class="step"><span class="s-ico">✅</span><strong>1단계: 프로그램 열기</strong><span class="s-sta">완료!</span></div>
        <div class="step"><span class="s-ico">❌</span><strong>2단계: API 키 입력</strong><button onclick="window.obGoSettings()">설정하기</button></div>
        <div class="step"><span class="s-ico">⬜</span><strong>3단계: 첫 결과 만들기</strong><span class="s-sta">대기중...</span></div>
        <div class="msg">API 키만 넣으면 바로 시작할 수 있어요!</div>`;
      box.style.display = 'block';
    }
  }

  function renderTopicsWidget(){
    const box = document.getElementById('hpTopics'); if(!box) return;
    const m = (new Date()).getMonth()+1;
    const s = SEASONAL[m] || {season:'시즌 주제',soon:'다음달 준비'};
    // 컴팩트 한 줄 형식 — 한국/일본 주제 1개씩 + 이번주 시즌
    const kr = {flag:'🇰🇷', topic:'치매 예방 음식 TOP5'};
    const jp = {flag:'🇯🇵', topic:'老後の健康習慣'};
    box.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <strong style="font-size:13px;color:#b14d82">✨ 오늘의 추천 주제</strong>
        <a class="more" style="margin:0 0 0 auto" onclick='window.obGoTrend()'>더 많은 주제 →</a>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;background:#fff9fc;border:1px solid #f1dce7;border-radius:10px;margin-bottom:6px">
        <span style="font-size:13px;font-weight:800">${kr.flag} ${esc(kr.topic)}</span>
        <button style="margin-left:auto;padding:5px 11px;border:none;border-radius:999px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;font-size:11px;font-weight:800;cursor:pointer" onclick='window.obGoScriptWith(${JSON.stringify(kr.topic)})'>대본 만들기</button>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;background:#fff9fc;border:1px solid #f1dce7;border-radius:10px;margin-bottom:6px">
        <span style="font-size:13px;font-weight:800">${jp.flag} ${esc(jp.topic)}</span>
        <button style="margin-left:auto;padding:5px 11px;border:none;border-radius:999px;background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;font-size:11px;font-weight:800;cursor:pointer" onclick='window.obGoScriptWith(${JSON.stringify(jp.topic)})'>대본 만들기</button>
      </div>
      <div style="font-size:11px;color:#8B5020;padding:6px 12px;background:#fff7ee;border:1px solid #f0d6a0;border-radius:10px">📅 이번주: ${esc(s.season)}</div>`;
  }

  function renderSampleWidget(){
    const box = document.getElementById('hpSample'); if(!box) return;
    const order = ['script','blog','doc','trans','smb'];
    const labels = {script:'대본', blog:'블로그', doc:'공문서', trans:'번역', smb:'소상공인'};
    let cur = localStorage.getItem('hp_sample_tab') || 'script';
    if(!SAMPLES[cur]) cur = 'script';
    const s = SAMPLES[cur];
    box.innerHTML = `
      <h3>👀 이런 결과가 나와요! (샘플)</h3>
      <p class="sub">유형별로 실제 생성 결과 예시를 미리 볼 수 있어요</p>
      <div class="tabs">
        ${order.map(k=>`<button class="${k===cur?'on':''}" onclick='window.obPickSample(${JSON.stringify(k)})'>${esc(labels[k])}</button>`).join('')}
      </div>
      <div class="preview">
        <h4>${esc(s.title)}</h4>
        <div class="bi">🇰🇷 한국어:</div>
        <blockquote>${esc(s.ko)}</blockquote>
        ${s.jp?`<div class="bi">🇯🇵 일본어:</div><blockquote>${esc(s.jp)}</blockquote>`:''}
        <div class="ok-line">✅ 실제로 이런 결과가 나와요!</div>
        <button class="try" onclick='window.obTrySample(${JSON.stringify(cur)})'>나도 만들어보기 →</button>
      </div>`;
  }
  window.obPickSample = function(k){ localStorage.setItem('hp_sample_tab', k); renderSampleWidget(); };
  window.obTrySample = function(k){
    const s = SAMPLES[k]; if(!s) return;
    if(s.go==='script'){ location.href='engines/script/index.html?tab=gen'; return; }
    if(typeof window.__hubGoCategory==='function'){
      try{ window.__hubGoCategory(s.go); window.scrollTo({top:0,behavior:'smooth'}); }catch(_){}
    }
  };
  window.obGoScriptWith = function(topic){ location.href='engines/script/index.html?tab=gen&topic='+encodeURIComponent(topic); };
  window.obCopyTopic = function(topic){ navigator.clipboard.writeText(topic).then(()=>{ if(typeof libToast==='function') libToast('📋 복사됐어요!'); }); };
  window.obGoTrend = function(){
    if(typeof window.__hubGoCategory==='function'){
      try{ window.__hubGoCategory('trend'); window.scrollTo({top:0,behavior:'smooth'}); }catch(_){}
    }
  };

  /* ─ 첫 실행 자동 시작 ─ */
  function boot(){
    refreshMainWidgets();
    if(!localStorage.getItem(LS_DONE)){
      setTimeout(()=>{ window.obOpen(); }, 400);
    }
    // 키 입력 감지: storage 이벤트 (다른 탭) + 주기적 재체크
    window.addEventListener('storage', refreshMainWidgets);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  console.log('✅ 🎉 온보딩·오늘의 추천·샘플·도움말 로드 완료');
})();

/* ═══════════════════════════════════════════════
   ⚖️ A/B 비교 센터
   =============================================== */
(function(){
  const LS_LOG = 'ab_test_log_v1';
  const STYLE_LABEL = {emotion:'감동형', info:'정보형', story:'스토리형', quiz:'퀴즈형', custom:'직접입력'};
  const CHANNEL_LABEL = {'senior-emotion':'시니어감동','comic':'코믹','knowledge':'지식','custom':'직접입력'};
  const TONE_LABEL = {friendly:'친근하게', emotional:'감동적으로', professional:'전문적으로', humor:'유머러스하게'};
  const LANG_LABEL = {ko:'한국어', jp:'일본어', kojp:'한국어+일본어'};
  const LANG_INSTR = {
    ko:'[언어] 반드시 한국어로만 작성.',
    jp:'[言語] 必ず日本語のみで作成。',
    kojp:'[언어] 한국어 먼저, 빈 줄 뒤 일본어 버전 순서로 작성.'
  };
  const STYLE_SYS = {
    emotion: '감동형 시니어 대본 작가. 공감·눈물 포인트·따뜻한 마무리. 개인 경험 에피소드 포함.',
    info:    '정보형 대본 작가. 사실·근거·수치 활용. 명확한 단계별 설명, 전문성 유지하되 쉬운 단어.',
    story:   '스토리형 대본 작가. 기승전결 서사 구조, 구체적 인물·상황 묘사.',
    quiz:    '퀴즈형 대본 작가. 문제 제기→힌트→정답 공개 구조, 궁금증 자극.',
    custom:  '{custom}'
  };
  const TONE_SYS = {
    friendly:'친근한 구어체. 반말/존댓말 섞어 편안하게, 시청자를 친구처럼.',
    emotional:'감정이 풍부한 서정적 톤. 향수·공감·따뜻함.',
    professional:'전문가 톤. 객관적 근거 제시, 정중한 존댓말, 명료한 구조.',
    humor:'유머러스한 톤. 과장·반전·재치 있는 비유. 웃음 포인트 중간중간.'
  };

  const ui = { tab:'script',
    scriptStyleA:'emotion', scriptStyleB:'info', scriptLang:'ko', scriptLen:'60', scriptCh:'senior-emotion',
    toneA:'emotional', toneB:'professional' };

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function by(id){ return document.getElementById(id); }
  function read(k,d){ try{ return JSON.parse(localStorage.getItem(k)||JSON.stringify(d)); }catch(_){ return d; } }
  function write(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(_){ return false; } }

  function ensureAdapter(){
    if(typeof APIAdapter === 'undefined') return null;
    try{
      if(typeof AI_PROVIDER !== 'undefined') APIAdapter.setProvider(AI_PROVIDER);
      const ck=localStorage.getItem('uc_claude_key'); if(ck) APIAdapter.setApiKey('claude',ck);
      const ok=localStorage.getItem('uc_openai_key'); if(ok) APIAdapter.setApiKey('openai',ok);
      const gk=localStorage.getItem('uc_gemini_key'); if(gk) APIAdapter.setApiKey('gemini',gk);
    }catch(_){}
    return APIAdapter;
  }
  async function callAI(sys, user, opts){
    const A = ensureAdapter();
    if(!A) throw new Error('core/api-adapter.js 로드 필요');
    return A.callAI(sys, user, Object.assign({maxTokens:2000}, opts||{}));
  }

  /* ─ 탭 전환 / 옵션 버튼 ─ */
  window.abSwitch = function(tab, btn){
    ui.tab = tab;
    document.querySelectorAll('#abTabs button').forEach(b=>b.classList.remove('on'));
    if(btn) btn.classList.add('on');
    ['script','title','thumb','lang','tone','log'].forEach(k=>{
      const p = by('abPanel-'+k); if(p) p.style.display = (k===tab?'block':'none');
    });
    if(tab==='log') renderLog();
  };

  document.addEventListener('click', function(e){
    const b = e.target.closest('#ab-script-styleA button, #ab-script-styleB button, #ab-script-lang button, #ab-script-len button, #ab-script-channel button, #ab-tone-A button, #ab-tone-B button');
    if(!b) return;
    b.parentElement.querySelectorAll('button').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    const parentId = b.parentElement.id;
    if(parentId==='ab-script-styleA'){ ui.scriptStyleA = b.dataset.s; toggleCustom('ab-script-styleA-custom', b.dataset.s==='custom'); }
    if(parentId==='ab-script-styleB'){ ui.scriptStyleB = b.dataset.s; toggleCustom('ab-script-styleB-custom', b.dataset.s==='custom'); }
    if(parentId==='ab-script-lang') ui.scriptLang = b.dataset.l;
    if(parentId==='ab-script-len')  ui.scriptLen  = b.dataset.t;
    if(parentId==='ab-script-channel'){ ui.scriptCh = b.dataset.c; toggleCustom('ab-script-channel-custom', b.dataset.c==='custom'); }
    if(parentId==='ab-tone-A') ui.toneA = b.dataset.t;
    if(parentId==='ab-tone-B') ui.toneB = b.dataset.t;
  });
  function toggleCustom(id, show){ const el=by(id); if(el) el.style.display = show?'block':'none'; }

  /* ─ 렌더 진입점 ─ */
  window.renderAB = function(){ renderLog(); };

  /* ─ 섹션2: 대본 A/B ─ */
  window.abRunScript = async function(){
    const topic = (by('ab-script-topic').value||'').trim();
    if(!topic){ alert('주제를 입력해주세요.'); return; }
    const out = by('ab-script-out');
    const styleA = ui.scriptStyleA==='custom' ? (by('ab-script-styleA-custom').value||'직접입력') : STYLE_LABEL[ui.scriptStyleA];
    const styleB = ui.scriptStyleB==='custom' ? (by('ab-script-styleB-custom').value||'직접입력') : STYLE_LABEL[ui.scriptStyleB];
    const channel = ui.scriptCh==='custom' ? (by('ab-script-channel-custom').value||'직접입력') : CHANNEL_LABEL[ui.scriptCh];
    const sysA = (STYLE_SYS[ui.scriptStyleA]||STYLE_SYS.emotion).replace('{custom}', styleA);
    const sysB = (STYLE_SYS[ui.scriptStyleB]||STYLE_SYS.info).replace('{custom}', styleB);
    const lenInst = `길이 약 ${ui.scriptLen}초 분량 (1초=약 4자 기준).`;
    const chInst = `채널 컨셉: ${channel}. 시니어 친화 톤 유지.`;
    const langInst = LANG_INSTR[ui.scriptLang] || LANG_INSTR.ko;
    const userMsg = `주제: ${topic}\n${lenInst}\n${chInst}\n${langInst}`;

    out.innerHTML = `<div class="ab-split">
      <div class="ab-col A"><h4><span class="ver">A</span> ${esc(styleA)} 스타일</h4><div class="style-chip">⏳ 생성 중...</div></div>
      <div class="ab-col B"><h4><span class="ver">B</span> ${esc(styleB)} 스타일</h4><div class="style-chip">⏳ 생성 중...</div></div>
    </div>`;
    try{
      const [rA, rB] = await Promise.all([
        callAI(sysA+'\n'+langInst, userMsg, {maxTokens:2200, featureId:'ab-script-A'}).catch(e=>'❌ '+e.message),
        callAI(sysB+'\n'+langInst, userMsg, {maxTokens:2200, featureId:'ab-script-B'}).catch(e=>'❌ '+e.message)
      ]);
      renderScriptResults(topic, rA, rB, styleA, styleB);
      // AI 추천
      renderRecommendation(topic, rA, rB, styleA, styleB);
    }catch(e){ out.innerHTML = '<div class="ab-reco">❌ '+esc(e.message)+'</div>'; }
  };
  function scoreOf(text){
    const len = (text||'').length;
    // 간단 휴리스틱 점수
    let pts = 2;
    if(len>400) pts++;
    if(/[?!]/.test(text)) pts++;
    if(/[0-9]+/.test(text)) pts++;
    if(/(안녕|여러분|오늘|함께)/.test(text)) pts++;
    return Math.min(5, pts);
  }
  function stars(n){ return '★'.repeat(n) + '☆'.repeat(5-n); }
  function renderScriptResults(topic, rA, rB, sA, sB){
    const sc = {A:scoreOf(rA), B:scoreOf(rB)};
    const lenA = rA.length, lenB = rB.length;
    const minA = Math.max(1, Math.round(lenA/320));
    const minB = Math.max(1, Math.round(lenB/320));
    const forecastA = sc.A>=4?'높음 📈': sc.A>=3?'보통 📊':'낮음 📉';
    const forecastB = sc.B>=4?'높음 📈': sc.B>=3?'보통 📊':'낮음 📉';
    const metaJson = JSON.stringify({mode:'script',topic,styleA:sA,styleB:sB});
    by('ab-script-out').innerHTML = `
      <div class="ab-split" id="abScriptSplit">
        <div class="ab-col A" data-ab="A">
          <h4><span class="ver">A</span> ${esc(sA)}</h4>
          <div class="meta-row"><span>📏 ${lenA.toLocaleString()}자</span><span>⏱ 약 ${minA}분</span></div>
          <div class="score">AI 점수: ${stars(sc.A)} · 예상 시청 완료율: ${forecastA}</div>
          <pre class="out">${esc(rA)}</pre>
          <div class="acts">
            <button onclick="abCopy('A')">📋 복사</button>
            <button class="pick" onclick="abPick('A', ${esc(JSON.stringify(topic)).replace(/"/g,'&quot;')})">✅ A 선택!</button>
            <button onclick="abSaveToLib('A')">📁 보관함</button>
          </div>
        </div>
        <div class="ab-col B" data-ab="B">
          <h4><span class="ver">B</span> ${esc(sB)}</h4>
          <div class="meta-row"><span>📏 ${lenB.toLocaleString()}자</span><span>⏱ 약 ${minB}분</span></div>
          <div class="score">AI 점수: ${stars(sc.B)} · 예상 시청 완료율: ${forecastB}</div>
          <pre class="out">${esc(rB)}</pre>
          <div class="acts">
            <button onclick="abCopy('B')">📋 복사</button>
            <button class="pick" onclick="abPick('B', ${esc(JSON.stringify(topic)).replace(/"/g,'&quot;')})">✅ B 선택!</button>
            <button onclick="abSaveToLib('B')">📁 보관함</button>
          </div>
        </div>
      </div>
      <div id="ab-reco"></div>`;
    // 데이터 캐시
    window.__abCache = {A:{text:rA, style:sA, topic}, B:{text:rB, style:sB, topic}, meta:metaJson};
  }
  async function renderRecommendation(topic, rA, rB, sA, sB){
    const reco = by('ab-reco'); if(!reco) return;
    reco.innerHTML = `<div class="ab-reco"><div class="title">🤖 AI 추천 분석 중...</div></div>`;
    try{
      const sys = `당신은 유튜브 콘텐츠 전략가입니다. 두 버전의 대본을 비교하여 다음 형식으로 한국어로 답변:
🤖 AI 추천: [A버전 or B버전]이 더 좋아요!

이유:
✅ (이유 1)
✅ (이유 2)
✅ (이유 3)

[반대 버전]이 더 좋은 경우:
→ (상황 1)
→ (상황 2)`;
      const r = await callAI(sys, `주제: ${topic}\n\n[A버전 - ${sA}]\n${rA.slice(0,1200)}\n\n[B버전 - ${sB}]\n${rB.slice(0,1200)}`,
        {maxTokens:800, featureId:'ab-reco'});
      reco.innerHTML = `<div class="ab-reco"><div class="title">🤖 AI 추천</div>${esc(r)}</div>`;
    }catch(e){ reco.innerHTML = `<div class="ab-reco">❌ AI 추천 실패: ${esc(e.message)}</div>`; }
  }
  window.abCopy = function(ver){
    const d = (window.__abCache||{})[ver]; if(!d) return;
    navigator.clipboard.writeText(d.text).then(()=>{ if(typeof libToast==='function') libToast('📋 '+ver+' 버전 복사됨!'); });
  };
  window.abPick = function(ver, topic){
    const d = (window.__abCache||{})[ver]; if(!d) return;
    document.querySelectorAll('#abScriptSplit .ab-col').forEach(c=>c.classList.remove('sel'));
    const el = document.querySelector(`#abScriptSplit .ab-col[data-ab="${ver}"]`);
    if(el) el.classList.add('sel');
    if(typeof libToast==='function') libToast('✅ '+ver+' 버전 선택!');
    abSaveToLib(ver);
  };
  window.abSaveToLib = function(ver){
    const d = (window.__abCache||{})[ver]; if(!d) return;
    if(typeof window.Library !== 'undefined' && typeof window.Library.saveResult === 'function'){
      window.Library.saveResult({text:d.text, category:'script', lang:ui.scriptLang, title:`[A/B ${ver}] ${d.style} · ${d.topic}`,
        meta:{ab:true, ver, style:d.style}});
    } else {
      alert('보관함 모듈이 없어요. index.html에서 실행해주세요.');
    }
  };

  /* ─ 섹션3: 제목 A/B ─ */
  window.abRunTitles = async function(){
    const topic = (by('ab-title-topic').value||'').trim();
    if(!topic){ alert('주제를 입력해주세요.'); return; }
    const withJp = by('ab-title-jp').checked;
    const out = by('ab-title-out');
    out.innerHTML = `<div class="ab-reco">⏳ 제목 5개 생성 중...</div>`;
    try{
      const sys = `당신은 유튜브 제목 전문가입니다. 주제 기반으로 클릭률(CTR) 높은 한국어 제목 5개를 아래 JSON으로만 답변:
[
 {"title":"...", "stars":5, "reason":"숫자 활용 + 궁금증 유발"${withJp?', "jp":"認知症予防の食べ物TOP5"':''}},
 ...5개...
]
stars는 1~5 정수. reason은 한 문장.`;
      const r = await callAI(sys, `주제: ${topic}`, {maxTokens:1800, featureId:'ab-titles'});
      let arr;
      try{ arr = JSON.parse((r.match(/\[[\s\S]*\]/)||[r])[0]); }catch(_){ arr = null; }
      if(!Array.isArray(arr) || !arr.length){
        out.innerHTML = `<div class="ab-reco">⚠️ 형식 파싱 실패. 응답 원문:<br><br>${esc(r)}</div>`;
        return;
      }
      out.innerHTML = `<div class="ab-titles">` + arr.slice(0,5).map((t,i)=>{
        const s = Math.max(1, Math.min(5, Number(t.stars)||3));
        return `<div class="ab-title-card">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="num">${i+1}</span><span class="stars">${stars(s)}</span>
          </div>
          <div class="tit">${esc(t.title||'')}</div>
          ${t.jp?`<div class="tit" style="font-size:13px;color:#8B5020">🇯🇵 ${esc(t.jp)}</div>`:''}
          <div class="reason">이유: ${esc(t.reason||'')}</div>
          <div class="acts">
            <button class="pri" onclick='abPickTitle(${JSON.stringify(t.title||"")})'>✅ 이 제목 선택</button>
            <button onclick='abCopyText(${JSON.stringify(t.title||"")})'>📋 복사</button>
            ${t.jp?`<button onclick='abCopyText(${JSON.stringify(t.jp)})'>📋 JP 복사</button>`:''}
          </div>
        </div>`;
      }).join('') + `</div>`;
    }catch(e){ out.innerHTML = `<div class="ab-reco">❌ ${esc(e.message)}</div>`; }
  };
  window.abCopyText = function(t){ navigator.clipboard.writeText(t).then(()=>{ if(typeof libToast==='function') libToast('📋 복사됨!'); }); };
  window.abPickTitle = function(t){
    if(typeof window.Library !== 'undefined' && typeof window.Library.saveResult === 'function'){
      window.Library.saveResult({text:t, category:'other', lang:'ko', title:'[A/B 선택 제목] '+t.slice(0,40), meta:{ab:true, type:'title'}});
    }
    if(typeof libToast==='function') libToast('✅ 제목 저장됨! 보관함에서 확인하세요.');
  };

  /* ─ 섹션3b: 썸네일 문구 A/B ─ */
  window.abRunThumbs = async function(){
    const topic = (by('ab-thumb-topic').value||'').trim();
    if(!topic){ alert('영상 주제를 입력해주세요.'); return; }
    const dirA = (by('ab-thumb-A').value||'').trim() || '강렬·경고형';
    const dirB = (by('ab-thumb-B').value||'').trim() || '숫자·친근형';
    const out = by('ab-thumb-out');
    out.innerHTML = `<div class="ab-split">
      <div class="ab-col A"><h4><span class="ver">A</span> ${esc(dirA)}</h4><div class="style-chip">⏳</div></div>
      <div class="ab-col B"><h4><span class="ver">B</span> ${esc(dirB)}</h4><div class="style-chip">⏳</div></div>
    </div>`;
    try{
      const sys = `당신은 유튜브 썸네일 카피 전문가입니다. 주어진 방향에 맞춰 CTR 높은 한국어 썸네일 문구 3개를 짧게(각 10~18자) 줄바꿈으로 제안하세요. 숫자·대비·감정 활용.`;
      const [rA, rB] = await Promise.all([
        callAI(sys, `주제: ${topic}\n방향: ${dirA}`, {maxTokens:500, featureId:'ab-thumb-A'}).catch(e=>'❌ '+e.message),
        callAI(sys, `주제: ${topic}\n방향: ${dirB}`, {maxTokens:500, featureId:'ab-thumb-B'}).catch(e=>'❌ '+e.message)
      ]);
      out.innerHTML = `<div class="ab-split">
        <div class="ab-col A">
          <h4><span class="ver">A</span> ${esc(dirA)}</h4>
          <pre class="out">${esc(rA)}</pre>
          <div class="acts"><button onclick='abCopyText(${JSON.stringify(rA)})'>📋 복사</button></div>
        </div>
        <div class="ab-col B">
          <h4><span class="ver">B</span> ${esc(dirB)}</h4>
          <pre class="out">${esc(rB)}</pre>
          <div class="acts"><button onclick='abCopyText(${JSON.stringify(rB)})'>📋 복사</button></div>
        </div>
      </div>`;
    }catch(e){ out.innerHTML = `<div class="ab-reco">❌ ${esc(e.message)}</div>`; }
  };

  /* ─ 섹션4: 한·일 비교 ─ */
  window.abRunLang = async function(){
    const src = (by('ab-lang-input').value||'').trim();
    if(!src){ alert('한국어 대본 또는 주제를 입력해주세요.'); return; }
    const out = by('ab-lang-out');
    out.innerHTML = `<div class="ab-split">
      <div class="ab-col A"><h4><span class="ver">KO</span> 🇰🇷 한국어</h4><div class="style-chip">⏳</div></div>
      <div class="ab-col B"><h4><span class="ver">JP</span> 🇯🇵 일본어</h4><div class="style-chip">⏳</div></div>
    </div>`;
    try{
      const sysK = '시니어 친화 한국어 대본 작가. 따뜻하고 쉬운 단어, 천천히 설명하는 구조.';
      const sysJ = '日本のシニア向け台本作家。敬体(です・ます), 季節感, 共感を大切に、やさしい言葉で丁寧に。';
      const [rK, rJ] = await Promise.all([
        callAI(sysK, src, {maxTokens:1600, featureId:'ab-lang-ko'}).catch(e=>'❌ '+e.message),
        callAI(sysJ, src, {maxTokens:1600, featureId:'ab-lang-jp'}).catch(e=>'❌ '+e.message)
      ]);
      out.innerHTML = `<div class="ab-split">
        <div class="ab-col A">
          <h4><span class="ver">KO</span> 🇰🇷 한국어</h4>
          <pre class="out" id="ab-lang-ko-out" contenteditable="true">${esc(rK)}</pre>
          <div class="acts"><button onclick='abCopyFromEl("ab-lang-ko-out")'>📋 복사</button><button onclick="abSaveLang('ko')">📁 보관함</button></div>
        </div>
        <div class="ab-col B">
          <h4><span class="ver">JP</span> 🇯🇵 일본어</h4>
          <pre class="out" id="ab-lang-jp-out" contenteditable="true">${esc(rJ)}</pre>
          <div class="acts"><button onclick='abCopyFromEl("ab-lang-jp-out")'>📋 복사</button><button onclick="abSaveLang('jp')">📁 보관함</button></div>
        </div>
      </div>
      <button class="ab-go" style="margin-top:10px" onclick="abCheckTrans()">🔍 번역이 자연스러운지 확인</button>
      <div id="ab-lang-check"></div>`;
      window.__abCache = {ko:rK, jp:rJ};
    }catch(e){ out.innerHTML = `<div class="ab-reco">❌ ${esc(e.message)}</div>`; }
  };
  window.abCopyFromEl = function(id){
    const el = document.getElementById(id); if(!el) return;
    navigator.clipboard.writeText(el.innerText).then(()=>{ if(typeof libToast==='function') libToast('📋 복사됨!'); });
  };
  window.abSaveLang = function(lang){
    const el = document.getElementById(lang==='ko'?'ab-lang-ko-out':'ab-lang-jp-out');
    if(!el) return;
    if(typeof window.Library !== 'undefined'){
      window.Library.saveResult({text:el.innerText, category:'trans', lang, title:`[한·일 비교 ${lang.toUpperCase()}] `+el.innerText.slice(0,30), meta:{ab:true, type:'lang'}});
    }
  };
  window.abCheckTrans = async function(){
    const ko = (by('ab-lang-ko-out')||{}).innerText;
    const jp = (by('ab-lang-jp-out')||{}).innerText;
    const box = by('ab-lang-check');
    if(!box) return;
    box.innerHTML = `<div class="ab-trans-issue">⏳ 번역 자연스러움 체크 중...</div>`;
    try{
      const sys = '당신은 한일 번역 감수자입니다. 두 버전을 비교해 어색한 표현이 있는지 한국어로 간단히 지적하고 개선 제안을 해주세요.';
      const r = await callAI(sys, `[한국어]\n${ko}\n\n[日本語]\n${jp}`, {maxTokens:900, featureId:'ab-trans-check'});
      box.innerHTML = `<div class="ab-trans-issue">🔍 번역 체크 결과\n\n${esc(r)}</div>`;
    }catch(e){ box.innerHTML = `<div class="ab-trans-issue">❌ ${esc(e.message)}</div>`; }
  };

  /* ─ 섹션5: 말투 A/B ─ */
  window.abRunTone = async function(){
    const topic = (by('ab-tone-topic').value||'').trim();
    if(!topic){ alert('주제를 입력해주세요.'); return; }
    const tA = ui.toneA, tB = ui.toneB;
    if(tA===tB){ alert('A와 B는 다른 말투를 선택해주세요.'); return; }
    const out = by('ab-tone-out');
    out.innerHTML = `<div class="ab-split">
      <div class="ab-col A"><h4><span class="ver">A</span> ${esc(TONE_LABEL[tA])}</h4><div class="style-chip">⏳</div></div>
      <div class="ab-col B"><h4><span class="ver">B</span> ${esc(TONE_LABEL[tB])}</h4><div class="style-chip">⏳</div></div>
    </div>`;
    try{
      const [rA, rB] = await Promise.all([
        callAI(TONE_SYS[tA]+'\n[언어] 반드시 한국어.', `주제: ${topic}\n분량: 약 400~600자.`, {maxTokens:1200, featureId:'ab-tone-A'}).catch(e=>'❌ '+e.message),
        callAI(TONE_SYS[tB]+'\n[언어] 반드시 한국어.', `주제: ${topic}\n분량: 약 400~600자.`, {maxTokens:1200, featureId:'ab-tone-B'}).catch(e=>'❌ '+e.message)
      ]);
      out.innerHTML = `<div class="ab-split">
        <div class="ab-col A">
          <h4><span class="ver">A</span> ${esc(TONE_LABEL[tA])}</h4>
          <pre class="out">${esc(rA)}</pre>
          <div class="acts">
            <button onclick='abCopyText(${JSON.stringify(rA)})'>📋 복사</button>
            <button class="pick" onclick='abSaveTone(${JSON.stringify(rA)}, ${JSON.stringify(TONE_LABEL[tA])})'>✅ A 선택</button>
          </div>
        </div>
        <div class="ab-col B">
          <h4><span class="ver">B</span> ${esc(TONE_LABEL[tB])}</h4>
          <pre class="out">${esc(rB)}</pre>
          <div class="acts">
            <button onclick='abCopyText(${JSON.stringify(rB)})'>📋 복사</button>
            <button class="pick" onclick='abSaveTone(${JSON.stringify(rB)}, ${JSON.stringify(TONE_LABEL[tB])})'>✅ B 선택</button>
          </div>
        </div>
      </div>`;
    }catch(e){ out.innerHTML = `<div class="ab-reco">❌ ${esc(e.message)}</div>`; }
  };
  window.abSaveTone = function(text, tone){
    if(typeof window.Library !== 'undefined'){
      window.Library.saveResult({text, category:'script', lang:'ko', title:`[말투 A/B] ${tone}`, meta:{ab:true, type:'tone', tone}});
    }
    if(typeof libToast==='function') libToast('✅ 선택됨! 보관함에 저장.');
  };

  /* ─ 섹션6: 테스트 기록 ─ */
  window.abAddLog = function(){
    const topic = prompt('테스트 주제 (예: 치매 예방 음식)'); if(!topic) return;
    const styleA = prompt('A버전 스타일 (예: 감동형)', '감동형'); if(styleA===null) return;
    const styleB = prompt('B버전 스타일 (예: 정보형)', '정보형'); if(styleB===null) return;
    const viewA = parseInt(prompt('A버전 조회수 (숫자만)','0'),10)||0;
    const viewB = parseInt(prompt('B버전 조회수 (숫자만)','0'),10)||0;
    const list = read(LS_LOG, []);
    list.unshift({id:'l'+Date.now(), topic, styleA, styleB, viewA, viewB, at:Date.now(),
      winner: viewA===viewB ? null : (viewA>viewB ? 'A':'B')});
    write(LS_LOG, list);
    renderLog();
    if(typeof libToast==='function') libToast('📊 기록 저장됨!');
  };
  window.abDeleteLog = function(id){
    if(!confirm('이 기록을 삭제할까요?')) return;
    write(LS_LOG, read(LS_LOG, []).filter(x=>x.id!==id));
    renderLog();
  };
  window.abExportLog = function(){
    const list = read(LS_LOG, []);
    if(!list.length){ alert('내보낼 기록이 없어요.'); return; }
    const blob = new Blob([JSON.stringify({version:1,exportedAt:Date.now(),log:list}, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const d=new Date(); const p=n=>String(n).padStart(2,'0');
    a.download = `AB_테스트_기록_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 500);
  };
  function fmtD(ts){ const d=new Date(ts); return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`; }
  function renderLog(){
    const list = read(LS_LOG, []);
    const box = by('ab-log-list'); const sbox = by('ab-log-stats');
    if(!box) return;
    if(!list.length){
      box.innerHTML = `<div class="ab-reco" style="background:#fff9fc;border-color:#f1dce7;color:#7b4060"><div class="title">📊 아직 기록이 없어요</div>[+ 테스트 결과 기록하기] 버튼으로 A/B 테스트 결과를 적어두면 내 채널 승률 통계가 만들어져요.</div>`;
      if(sbox) sbox.innerHTML = '';
      return;
    }
    box.innerHTML = list.map(x=>`<div class="ab-log-card">
      <h5>📊 ${esc(x.topic)}</h5>
      <div class="row"><span>${fmtD(x.at)}</span><button style="padding:4px 10px;border:1px solid #f0b8b8;background:#fff5f5;color:#b04040;border-radius:999px;font-size:10px;font-weight:800;cursor:pointer" onclick="abDeleteLog('${x.id}')">🗑</button></div>
      <div class="row"><span>A버전 (${esc(x.styleA)})</span><span>조회수 ${x.viewA.toLocaleString()}</span></div>
      <div class="row"><span>B버전 (${esc(x.styleB)})</span><span>조회수 ${x.viewB.toLocaleString()}</span></div>
      ${x.winner?`<div class="win">🏆 승자: ${x.winner}버전 (${esc(x.winner==='A'?x.styleA:x.styleB)})</div>`:'<div class="win" style="background:#eee;color:#5a5a5a">무승부</div>'}
    </div>`).join('');

    // 스타일별 승률 집계
    const wins = {};
    list.forEach(x=>{
      if(!x.winner) return;
      const winStyle = x.winner==='A'?x.styleA:x.styleB;
      const loseStyle = x.winner==='A'?x.styleB:x.styleA;
      wins[winStyle] = wins[winStyle] || {w:0,l:0};
      wins[loseStyle] = wins[loseStyle] || {w:0,l:0};
      wins[winStyle].w++; wins[loseStyle].l++;
    });
    const ranks = Object.keys(wins).map(k=>{
      const t = wins[k].w + wins[k].l;
      return {style:k, rate: t? Math.round(wins[k].w/t*100) : 0, n:t};
    }).sort((a,b)=>b.rate-a.rate);
    if(ranks.length && sbox){
      const medals = ['🥇','🥈','🥉'];
      sbox.innerHTML = `<div class="ab-stats">
        <h4>📈 내 채널에서 잘되는 스타일</h4>
        ${ranks.slice(0,5).map((r,i)=>`<div class="line"><span>${medals[i]||'•'} ${esc(r.style)}</span><span>승률 ${r.rate}% (${r.n}회)</span></div>`).join('')}
        <div class="ai-hint">🤖 AI 학습 결과: "${esc(ranks[0].style)}이(가) 당신 채널과 가장 잘 맞아요!"</div>
      </div>`;
    } else if(sbox){ sbox.innerHTML = ''; }
  }

  console.log('✅ ⚖️ A/B 비교 센터 로드 완료');
})();

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

/* ═══════════════════════════════════════════════
   ☕ MOCA 소개 탭 + 💬 Q&A 탭
   =============================================== */
(function(){
  /* ─ 소개 탭 핸들러 ─ */
  window.moStart = function(){
    // 일반 모드로 돌아가 대본 생성기 카테고리로
    const normalTab = document.querySelector('.toptab[data-mode="normal"]');
    if(normalTab){ normalTab.click(); }
    if(typeof window.__hubGoCategory==='function'){ window.__hubGoCategory('script'); }
    window.scrollTo({top:0, behavior:'smooth'});
  };
  window.moScrollTo = function(id){
    const el = document.getElementById(id);
    if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  };
  window.moContact = function(){
    alert('📧 이메일 문의\n\nsupport@moca.example 로 보내주세요!\n(단체 라이선스·공공기관 도입·추천인 혜택 문의 환영)\n\n보통 24시간 이내에 답변드립니다.');
  };

  /* ─ Q&A 데이터 ─ */
  const QNA = [
    // 시작하기
    {c:'start', q:'MOCA가 뭔가요?', a:`MOCA는 "Make One Click All"의 줄임말이에요.
글 쓸 일이 생길 때마다 여기저기 사이트를 돌아다니던 불편함을 없애고 블로그, 대본, 번역, 보고서, SNS 등 어떤 글이든 한 곳에서 해결하는 프로그램이에요.
마치 마법처럼요! ✨`},
    {c:'start', q:'어떤 글을 쓸 수 있나요?', a:`정말 어떤 글이든 다 돼요!
유튜브 대본, 블로그, SNS 게시물, 공문서, 보고서, 번역, 숙제, 편지, 웹툰 대본, 소설, 광고 카피...
글과 관련된 건 전부 MOCA 하나로 해결해요.`},
    {c:'start', q:'코딩을 몰라도 쓸 수 있나요?', a:`네! 전혀 몰라도 돼요.
클릭하고 글자 입력하면 끝이에요. 초등학생도 쓸 수 있어요! 🎮`},
    {c:'start', q:'API 키가 뭔가요? 어렵지 않나요?', a:`API 키는 도서관 회원증 같은 거예요.
딱 한 번만 만들면 돼요. 만드는 방법은 📖 가이드 탭에서 쉽게 알려드려요.
5분이면 완성! ⏱`},
    {c:'start', q:'처음에 뭐부터 해야 하나요?', a:`이 순서대로 따라하세요:
1. ⚙️ 설정 탭 → API 키 입력
2. 왼쪽 카테고리 중 원하는 것 클릭
3. 주제 입력
4. 생성 버튼 클릭!

끝이에요! 😊`},

    // 비용/결제
    {c:'cost', q:'얼마나 드나요?', a:`두 가지 비용이 있어요.
1) MOCA 이용료: 월 9,900원~29,900원
2) AI 사용료: 글 1개당 약 10원~50원

합쳐도 월 1~3만원이면 충분해요!`},
    {c:'cost', q:'무료로 써볼 수 있나요?', a:`API 키만 있으면 MOCA는 무료로 써볼 수 있어요.
API 키도 처음엔 무료 크레딧이 있어요!`},
    {c:'cost', q:'API 비용이 걱정돼요', a:`걱정 마세요!
글 1개 = 약 10원~50원이에요.
하루 10개 만들어도 월 3,000원~15,000원이에요.
카페 아메리카노 3잔 가격이에요! ☕`},
    {c:'cost', q:'어떻게 결제하나요?', a:`AI 회사(Anthropic/OpenAI)에 직접 충전하면 돼요.
신용카드로 5달러(약 7,000원)부터 충전 가능해요.`},

    // 기능
    {c:'feat', q:'정말 어떤 글이든 다 되나요?', a:`네! 블로그, 유튜브 대본, 번역, 보고서, SNS, 공문서, 숙제, 편지, 웹툰 대본, 광고 카피...
글과 관련된 건 전부 MOCA 하나로 해결해요. 여기저기 돌아다닐 필요 없어요!`},
    {c:'feat', q:'일본어도 나오나요?', a:`네! 한국어와 일본어가 동시에 나와요.
따로 번역 안 해도 돼요. 한 번에 두 채널 운영 가능해요! 🇰🇷🇯🇵`},
    {c:'feat', q:'어떤 AI를 사용하나요?', a:`Claude(Anthropic), GPT(OpenAI), Gemini(Google) 세 가지를 쓸 수 있어요.
⚙️ 설정 탭에서 원하는 것으로 바꿀 수 있어요!`},
    {c:'feat', q:'유튜브 자동 업로드도 되나요?', a:`현재는 업로드용 텍스트(제목/설명/태그)를 자동으로 만들어줘요.
복사해서 붙여넣기 하면 돼요. 자동 업로드는 추후 업데이트 예정이에요!`},
    {c:'feat', q:'저장은 어떻게 되나요?', a:`만든 결과물이 자동으로 📁 보관함에 저장돼요.
최근 20개까지 보관해요. 즐겨찾기와 프로젝트별 관리도 가능해요! 📁`},
    {c:'feat', q:'몇 개까지 만들 수 있나요?', a:`무제한이에요!
API 크레딧이 있는 한 계속 만들 수 있어요.`},
    {c:'feat', q:'스마트폰에서도 되나요?', a:`네! 모바일에서도 잘 돼요.
화면이 자동으로 스마트폰 크기에 맞게 바뀌어요! 📱`},

    // 오류해결
    {c:'fix', q:'결과가 안 나와요', a:`이렇게 확인해보세요:
1) ⚙️ 설정 탭에서 API 키 입력됐는지 확인
2) API 크레딧 있는지 확인
3) 인터넷 연결 확인

그래도 안 되면 페이지 새로고침(F5) 해보세요!`},
    {c:'fix', q:'일본어가 이상해요', a:`Claude 모델을 선택하면 일본어 품질이 좋아져요.
⚙️ 설정 탭에서 Claude로 바꿔보세요!`},
    {c:'fix', q:'화면이 깨져 보여요', a:`브라우저를 Chrome으로 써보세요.
또는 페이지를 새로고침(F5) 해보세요!`},
    {c:'fix', q:'저장이 안 돼요', a:`시크릿 모드에서는 저장이 안 될 수 있어요.
일반 모드로 사용해주세요!`},

    // 판매/활용
    {c:'biz', q:'MOCA로 만든 글을 판매해도 되나요?', a:`네! MOCA로 만든 결과물의 저작권은 사용자(여러분)에게 있어요.
블로그/유튜브/SNS 수익화 모두 가능해요!`},
    {c:'biz', q:'크몽에서 대행 서비스로 팔 수 있나요?', a:`네! MOCA를 활용해서 크몽에서 대행 서비스를 판매할 수 있어요.
📖 가이드 탭에서 크몽 판매 방법을 알려드려요!`},
    {c:'biz', q:'공공기관/회사에서 단체로 쓸 수 있나요?', a:`네! 단체 라이선스 문의는 아래 [📧 이메일 문의] 버튼을 눌러주세요.`},
    {c:'biz', q:'다른 사람에게 MOCA를 소개하면 혜택이 있나요?', a:`추후 추천인 혜택 프로그램을 운영할 예정이에요.
업데이트 소식을 기다려주세요!`}
  ];
  const QNA_CAT = {start:'시작하기', cost:'비용/결제', feat:'기능', fix:'오류해결', biz:'판매/활용'};
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  const qaState = { filter:'all', query:'' };
  window.renderQnA = function(){ drawQnA(); };

  function filteredQna(){
    const q = qaState.query.trim().toLowerCase();
    return QNA.filter(x => {
      if(qaState.filter !== 'all' && x.c !== qaState.filter) return false;
      if(!q) return true;
      return (x.q.toLowerCase().includes(q) || x.a.toLowerCase().includes(q));
    });
  }
  function drawQnA(){
    const list = document.getElementById('qa-list');
    const nomatch = document.getElementById('qa-nomatch');
    if(!list) return;
    const items = filteredQna();
    if(!items.length){
      list.innerHTML = '';
      if(nomatch) nomatch.style.display = 'block';
      return;
    }
    if(nomatch) nomatch.style.display = 'none';
    list.innerHTML = items.map((x,i)=>`<div class="qa-item" data-idx="${i}">
      <div class="qa-q" onclick="qaToggle(this)">
        <span class="cat">${esc(QNA_CAT[x.c]||'기타')}</span>
        <span class="txt">Q. ${esc(x.q)}</span>
        <span class="chev">▾</span>
      </div>
      <div class="qa-a"><div class="qa-a-inner">${esc(x.a)}</div></div>
    </div>`).join('');
  }
  window.qaToggle = function(q){ q.parentElement.classList.toggle('open'); };
  window.qaSearch = function(v){ qaState.query = v||''; drawQnA(); };
  window.qaFilter = function(f, btn){
    qaState.filter = f;
    document.querySelectorAll('#qa-fils .qa-fil').forEach(b=>b.classList.remove('on'));
    if(btn) btn.classList.add('on');
    drawQnA();
  };

  console.log('✅ ☕ MOCA 소개 + 💬 Q&A 로드 완료');
})();

/* ═══════════════════════════════════════════════
   ✨ 빠른 생성 (Intent Stage)
   =============================================== */
(function(){
  const SAMPLES = [
    {k:'감사 편지', text:'엄마한테 감사 편지'},
    {k:'SNS 게시물', text:'카페 인스타 게시물'},
    {k:'유튜브 대본', text:'치매 예방하는 음식 TOP5 유튜브 대본'},
    {k:'보고서',     text:'법원 결정전조사 보고서'},
    {k:'블로그',     text:'50대 갱년기 극복 경험담 블로그 포스팅'},
    {k:'축사',       text:'친구 결혼식 축사'},
    {k:'숙제',       text:'초등학생 독후감 숙제'},
    {k:'번역',       text:'이 글을 일본어로 번역해줘:\n바쁘신 중에 도와주셔서 감사합니다.'}
  ];

  const st = { lastInput:'', lastResult:'', resultLang:'ko' };

  function by(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function estMinutes(len){ return Math.max(1, Math.round(len/320)); }

  window.intentInitStage = function(){
    // 샘플 카드 채우기 (한번만)
    const box = by('intentSampleBox');
    if(box && !box.dataset.ready){
      box.innerHTML = SAMPLES.map(s=>`<button onclick='intentPickSample(${JSON.stringify(s.text)})' style="padding:10px;border:1px solid var(--line);background:#fff;border-radius:12px;font-size:11px;font-weight:800;color:#5a4a56;cursor:pointer;text-align:left">${esc(s.k)}</button>`).join('');
      box.dataset.ready = '1';
    }
  };

  window.intentPickSample = function(text){
    const ta = by('intentInput');
    if(ta){ ta.value = text; ta.focus(); }
    const box = by('intentSampleBox'); if(box) box.style.display = 'none';
  };

  window.intentRun = async function(){
    const ta = by('intentInput');
    const text = (ta && ta.value || '').trim();
    if(!text){ alert('어떤 글을 쓸지 편하게 입력해주세요!'); return; }
    st.lastInput = text;
    const btn = by('intentGoBtn'); const status = by('intentStatus');
    btn.disabled = true; btn.textContent = '⏳ 생성 중...';
    status.textContent = '사용자 입력을 분석해 최적 프롬프트로 생성하고 있어요...';
    try{
      const r = await window.IntentSystem.runIntent(text, {maxTokens:2400, featureId:'intent-gen'});
      st.lastResult = r;
      showResult(r);
      status.textContent = '';
    }catch(e){
      status.textContent = '❌ '+e.message;
    }finally{
      btn.disabled = false; btn.textContent = '☕ 생성하기';
    }
  };

  function showResult(r){
    const box = by('intentResultBox');
    const out = by('intentResult');
    const meta= by('intentResultMeta');
    if(!box || !out) return;
    out.textContent = r;
    const ctx = (window.IntentSystem.detectContext(st.lastInput)||[]).map(x=>x.tag).slice(0,4).join(' · ') || '자동 감지';
    meta.textContent = `📏 ${r.length.toLocaleString()}자 · ⏱ 약 ${estMinutes(r.length)}분 · 🧭 ${ctx}`;
    box.style.display = 'block';
    box.scrollIntoView({behavior:'smooth', block:'start'});
  }

  window.intentRefine = async function(kind){
    if(!st.lastResult){ alert('먼저 결과를 생성해주세요.'); return; }
    if(kind==='custom'){
      const rb = by('intentRefineBox');
      if(rb){ rb.style.display='block'; by('intentRefineInput').focus(); }
      return;
    }
    const map = {
      rewrite:'같은 주제/맥락으로 완전히 다시 써주세요. 표현·예시·구조를 달리 하되 목적은 동일하게.',
      shorter:'기존 결과를 절반 정도 길이로 압축해주세요. 핵심만 남기고 군더더기는 제거.',
      longer: '기존 결과를 1.5~2배로 더 풍성하게 확장해주세요. 구체 예시·배경 설명 추가.'
    };
    const lenHint = kind==='shorter' ? '원본의 50% 길이' : kind==='longer' ? '원본의 150~200% 길이' : '';
    await runRefine(map[kind], lenHint);
  };

  window.intentApplyRefine = async function(){
    const v = (by('intentRefineInput').value||'').trim();
    if(!v){ alert('어떻게 바꿀지 적어주세요!'); return; }
    by('intentRefineBox').style.display = 'none';
    await runRefine(v, '');
  };

  async function runRefine(instruction, lenHint){
    const status = by('intentStatus');
    status.textContent = '⏳ 수정 요청을 반영해 다시 쓰고 있어요...';
    try{
      const r = await window.IntentSystem.runIntent(st.lastInput, {
        baseText: st.lastResult,
        refineInstruction: instruction,
        lengthHint: lenHint,
        maxTokens:2400, featureId:'intent-refine'
      });
      st.lastResult = r;
      showResult(r);
      status.textContent = '';
    }catch(e){ status.textContent = '❌ '+e.message; }
  }

  window.intentCopy = function(){
    if(!st.lastResult) return;
    navigator.clipboard.writeText(st.lastResult).then(()=>{ if(typeof libToast==='function') libToast('📋 복사됨!'); });
  };
  window.intentSaveToLib = function(){
    if(!st.lastResult) return;
    if(typeof window.Library !== 'undefined'){
      const p = window.IntentSystem.getActiveProfile();
      const ctx = (window.IntentSystem.detectContext(st.lastInput)||[]).map(x=>x.tag);
      const cat = ctx.includes('script')?'script': ctx.includes('blog')?'blog': ctx.includes('public')?'public': ctx.includes('smb')?'smb': ctx.includes('edu')?'edu': ctx.includes('translate')?'trans':'other';
      const lang = ctx.includes('lang-jp')?'jp': ctx.includes('lang-kojp')?'kojp':'ko';
      window.Library.saveResult({
        text: st.lastResult,
        category: cat,
        lang,
        title: '[빠른생성] ' + (st.lastInput.split('\n')[0].slice(0,40)),
        meta: {intent:true, profile:p.id, context:ctx}
      });
    }
  };

  // 프로필 변경 시 결과 화면 메타 갱신
  window.addEventListener('intent:profile-change', ()=>{
    if(st.lastResult){
      const meta = by('intentResultMeta'); if(!meta) return;
      const ctx = (window.IntentSystem.detectContext(st.lastInput)||[]).map(x=>x.tag).slice(0,4).join(' · ') || '자동 감지';
      meta.textContent = `📏 ${st.lastResult.length.toLocaleString()}자 · ⏱ 약 ${estMinutes(st.lastResult.length)}분 · 🧭 ${ctx} · 👤 ${(window.IntentSystem.getActiveProfile()||{}).name||''}`;
    }
  });

  console.log('✅ ✨ 빠른 생성 (Intent) 로드 완료');
})();

<script>
(function(){
  var isOpen = localStorage.getItem('tp_float_open') !== '0';

  window.tpFloatToggle = function(){
    isOpen = !isOpen;
    localStorage.setItem('tp_float_open', isOpen ? '1' : '0');
    var b = document.getElementById('tp-float-body');
    var t = document.getElementById('tp-float-toggle');
    if(isOpen){ b.classList.remove('tp-hide'); t.textContent='🔥 오늘의 추천 주제'; }
    else { b.classList.add('tp-hide'); t.textContent='🔥'; }
  };

  window.tpFloatMake = function(lang){
    var text = lang === 'kr'
      ? document.getElementById('tp-float-kr').textContent
      : document.getElementById('tp-float-jp').textContent;
    if(typeof __hubGoCategory === 'function') __hubGoCategory('script');
    setTimeout(function(){
      var el = document.getElementById('one-input')
        || document.getElementById('topic')
        || document.querySelector('[placeholder*="주제"]');
      if(el){ el.value = text; el.focus(); }
    }, 350);
  };

  var d = new Date();
  var de = document.getElementById('tp-float-date');
  if(de) de.textContent = (d.getMonth()+1) + '월 ' + d.getDate() + '일';

  var sm = {
    1:'새해·건강검진·겨울건강', 2:'설날·부모님건강·면역력',
    3:'봄맞이·건강검진 준비', 4:'봄·어린이날 준비·건강검진',
    5:'어버이날·가정의달·효도', 6:'초여름·더위 대비·건강',
    7:'여름건강·무더위 극복', 8:'휴가·노후 여행·건강',
    9:'가을건강·추석·부모님', 10:'단풍·노후준비·건강검진',
    11:'김장·겨울준비·면역력', 12:'연말·한해마무리·건강'
  };
  var se = document.getElementById('tp-float-season');
  if(se && sm[d.getMonth()+1]) se.textContent = '이번주: ' + sm[d.getMonth()+1];

  if(!isOpen){
    var b = document.getElementById('tp-float-body');
    var t = document.getElementById('tp-float-toggle');
    if(b) b.classList.add('tp-hide');
    if(t) t.textContent = '🔥';
  }
})();
