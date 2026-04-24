/* modules/media.js — index.html에서 분리된 공통 미디어 바 모듈
   자기완결 (외부 의존 없음, DOM API만 사용)
*/

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
    {v:'photorealistic high quality natural lighting', l:'📸 실사', desc:'사진처럼 리얼'},
    {v:'soft watercolor illustration gentle colors', l:'🎨 수채화', desc:'부드럽고 예술적'},
    {v:'clean flat design infographic minimal icons', l:'📊 인포그래픽', desc:'정보형 깔끔'},
    {v:'cute emoji style illustration bright colors', l:'😊 이모지카드', desc:'귀엽고 밝게'},
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
      '<button onclick="window._mbStyle=\'' + s.v + '\';document.querySelectorAll(\'.mb-style-btn\').forEach(b=>b.style.background=\'#fff\');this.style.background=\'var(--pink-soft)\';this.style.borderColor=\'var(--pink)\'"' +
      ' class="mb-style-btn" style="padding:8px 4px;border:1px solid var(--line);border-radius:10px;background:' + (s.v===defaultStyle?'var(--pink-soft)':'#fff') + ';border-color:' + (s.v===defaultStyle?'var(--pink)':'var(--line)') + ';cursor:pointer;font-size:11px;font-weight:700">' +
      s.l + '<br><span style="font-weight:400;color:var(--sub);font-size:10px">' + s.desc + '</span></button>'
    ).join('') +
    '</div>' +
    '<div style="margin-bottom:10px">' +
    '<div style="font-size:12px;font-weight:900;color:#b14d82;margin-bottom:6px">🎬 영상 추가 (선택)</div>' +
    '<input id="mb-video-url" placeholder="유튜브 URL 또는 직접 찍은 영상 URL 입력 (선택)" style="width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font-size:12px;box-sizing:border-box">' +
    '<div style="font-size:10px;color:var(--sub);margin-top:3px">비워두면 이미지만 생성 · 유튜브 링크 입력시 영상 자동 embed</div>' +
    '</div>' +
    '<button onclick="_mbGenerate(\'' + category + '\')" style="width:100%;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;font-weight:900;font-size:13px;cursor:pointer">✨ 이미지 생성 시작!</button>' +
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
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 10);


    let previewHtml = '<div style="font-family:\'Noto Sans KR\',sans-serif;line-height:1.8;max-width:680px;margin:0 auto">';

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
      previewHtml += '<p style="margin:0 0 14px;font-size:15px;color:#2b2430">' + p.replace(/\n/g,'<br>').trim() + '</p>';


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
    const copyText = text + (imgs.filter(i=>i.url).length ? '\n\n[이미지]' + imgs.filter(i=>i.url).map(i=>i.url).join('\n') : '') + (videoUrl ? '\n\n[영상] ' + videoUrl : '');







    out.innerHTML =
      '<div style="margin-bottom:12px">' +
        '<div style="font-size:12px;font-weight:900;color:#2f7a54;margin-bottom:8px">✅ 완성! 미리보기</div>' +
        '<div style="border:1px solid var(--line);border-radius:12px;padding:16px;background:#fff;max-height:500px;overflow-y:auto">' +
          previewHtml +
        '</div>' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
        '<button onclick="navigator.clipboard.writeText(document.querySelector(\'.media-bar ._copy-text\')||\'\')" style="padding:8px 14px;border:1px solid var(--line);border-radius:999px;background:#fff;font-size:12px;font-weight:800;cursor:pointer">📋 글만 복사</button>' +
        (imgs.filter(i=>i.url).length ?
          '<button onclick="_mbCopyAll()" style="padding:8px 14px;border:none;border-radius:999px;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;font-size:12px;font-weight:800;cursor:pointer">📋 글+이미지 URL 복사</button>' : '') +
        '<button onclick="_mbCopyHtml()" style="padding:8px 14px;border:1px solid #d4b5f5;border-radius:999px;background:#fff;font-size:12px;font-weight:800;cursor:pointer;color:#6030C0">📋 HTML 복사</button>' +
        '<button onclick="_mbSaveToLibrary(this)" style="padding:8px 14px;border:1px solid #c2e8d8;border-radius:999px;background:#eefbf7;font-size:12px;font-weight:800;cursor:pointer;color:#2f7a54">💾 보관함</button>' +
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
  const imgUrls = imgs.filter(i=>i.url).map((i,idx) => '[이미지' + (idx+1) + '] ' + i.url).join('\n');

  const result = text + (imgUrls ? '\n\n' + imgUrls : '') + (video ? '\n\n[영상] ' + video : '');




  navigator.clipboard.writeText(result).then(() => alert('📋 글+이미지 URL 복사 완료!\n\n네이버 블로그 에디터에 붙여넣으세요.'));
}



function _mbCopyHtml(){
  const html = window._mbLastHtml || '';
  navigator.clipboard.writeText(html).then(() => alert('📋 HTML 복사 완료!\n\n에디터의 HTML 모드에 붙여넣으세요.'));
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
