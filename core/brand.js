/* ==================================================
   brand.js
   brand preset -- load/save/render/upload/form/reset
   extracted by split_index2.py (Phase 2)
   ================================================== */

function loadBrandPreset(){
  try{ const raw = localStorage.getItem(LS_BRAND_PRESET); if(raw) return JSON.parse(raw); }catch(_){}
  return {

channelName:'', logo:'',

ko: { color:'#FF6B9D', titleFont:'Noto Sans KR', bodyFont:'Noto Sans KR', style:'따뜻하고 친근하게' },

ja: { color:'#6A98E8', titleFont:'Noto Sans JP', bodyFont:'Noto Sans JP', style:'丁寧で親しみやすい' }

};
}
function saveBrandPreset(p){
  localStorage.setItem(LS_BRAND_PRESET, JSON.stringify(p));
  window.mocaToast('✅ 브랜드 저장됨 — 이후 포장에 자동 적용', 'ok');
}

/* ── settings tab: brand preset UI ── */
function renderSetBrand(){
  const b = loadBrandPreset();
  const fontOpts = (arr, cur) => arr.map(f => '<option value="' + f + '" ' + (f===cur?'selected':'') + '>' + f + '</option>').join('');
  return '<div class="set-panel">' +
    '<h3>🎨 내 채널 브랜드</h3>' +
    '<p class="hint">최초 1회 설정하면 이후 포장 스튜디오에서 자동 적용됩니다.</p>' +

    '<div class="set-row" style="align-items:flex-start">' +
      '<div style="grid-column:1/3"><label>채널명</label><input class="set-in" id="brand-name" value="' + (b.channelName||'') + '" placeholder="예: 시니어라이프 TV"></div>' +
      '<div>' +
        '<label>로고</label>' +
        '<div style="display:flex;gap:8px;align-items:center">' +
          '<div class="brand-logo-preview" id="brand-logo-preview">' + (b.logo ? '<img src="' + b.logo + '">' : '🖼') + '</div>' +
          '<input type="file" accept="image/*" id="brand-logo-file" style="display:none" onchange="brandUploadLogo(this)">' +
          '<button class="set-btn ghost" onclick="document.getElementById(\'brand-logo-file\').click()">업로드</button>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<h4 style="margin-top:16px">🇰🇷 한국 채널</h4>' +
    '<div class="set-row">' +
      '<div><label>대표 색상</label><input class="set-in" type="color" id="brand-ko-color" value="' + b.ko.color + '"></div>' +
      '<div><label>제목 폰트</label><select class="set-in" id="brand-ko-title">' + fontOpts(BRAND_FONTS_KO, b.ko.titleFont) + '</select></div>' +
      '<div><label>본문 폰트</label><select class="set-in" id="brand-ko-body">' + fontOpts(BRAND_FONTS_KO, b.ko.bodyFont) + '</select></div>' +
    '</div>' +
    '<label style="margin-top:6px">스타일 키워드</label>' +
    '<input class="set-in" id="brand-ko-style" value="' + b.ko.style + '" placeholder="예: 따뜻하고 친근하게 / 전문적으로 / 감성적으로">' +

    '<h4 style="margin-top:16px">🇯🇵 일본 채널</h4>' +
    '<div class="set-row">' +
      '<div><label>代表色</label><input class="set-in" type="color" id="brand-ja-color" value="' + b.ja.color + '"></div>' +
      '<div><label>見出しフォント</label><select class="set-in" id="brand-ja-title">' + fontOpts(BRAND_FONTS_JA, b.ja.titleFont) + '</select></div>' +
      '<div><label>本文フォント</label><select class="set-in" id="brand-ja-body">' + fontOpts(BRAND_FONTS_JA, b.ja.bodyFont) + '</select></div>' +
    '</div>' +
    '<label style="margin-top:6px">スタイルキーワード</label>' +
    '<input class="set-in" id="brand-ja-style" value="' + b.ja.style + '" placeholder="例: 丁寧で親しみやすい / プロフェッショナル">' +

    '<div class="set-row" style="margin-top:18px">' +
      '<div><button class="set-btn" onclick="brandSaveForm()">💾 브랜드 저장</button></div>' +
      '<div><button class="set-btn ghost" onclick="brandResetForm()">↩ 초기화</button></div>' +
    '</div>' +
  '</div>';
}
function brandUploadLogo(input){
  const f = input.files[0]; if(!f) return;
  if(f.size > 500*1024){ alert('로고는 500KB 이하로 업로드해주세요'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('brand-logo-preview');
    if(prev) prev.innerHTML = '<img src="' + e.target.result + '">';
    window._brandLogoTemp = e.target.result;
  };
  reader.readAsDataURL(f);
}
function brandSaveForm(){
  const p = {
    channelName: document.getElementById('brand-name').value.trim(),
    logo: window._brandLogoTemp || loadBrandPreset().logo,
    ko: {
      color: document.getElementById('brand-ko-color').value,
      titleFont: document.getElementById('brand-ko-title').value,
      bodyFont: document.getElementById('brand-ko-body').value,
      style: document.getElementById('brand-ko-style').value
    },
    ja: {
      color: document.getElementById('brand-ja-color').value,
      titleFont: document.getElementById('brand-ja-title').value,
      bodyFont: document.getElementById('brand-ja-body').value,
      style: document.getElementById('brand-ja-style').value
    }
  };
  saveBrandPreset(p);
  window._brandLogoTemp = null;
}
function brandResetForm(){
  if(!confirm('브랜드 설정을 초기화할까요?')) return;
  localStorage.removeItem(LS_BRAND_PRESET);
  if(typeof renderSetSection === 'function') renderSetSection('brand');
  window.mocaToast('↩ 브랜드 초기화됨', 'info');
}
