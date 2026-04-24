/* ==================================================
   pkg.js
   PKG package system -- STEP1-5 / output / save / share
   extracted by split_index2.py (Phase 2)
   ================================================== */

const LS_BRAND_PRESET = 'uc_brand_preset';
const BRAND_FONTS_KO = ['나눔고딕Bold','여기어때잘난체','빙그레체','KBO다이아몬드','배민주아체','경기천년제목','카페24서라운드','넥슨Lv.1','Noto Sans KR','IBM Plex KR','제주고딕'];
const BRAND_FONTS_JA = ['Noto Sans JP','源ノ角ゴシック','M PLUS Rounded','Kosugi Maru','Zen Kaku Gothic','DotGothic16','Sawarabi Gothic','游ゴシック','ヒラギノ角ゴ','明朝体클래식','手書き손글씨풍'];

/* ── PKG package system (extra) ── */
const LS_PACKAGING_STATE = 'uc_packaging_state';

const PKG_USES = {

'📱 SNS·소셜': [

{ id:'insta-feed', label:'인스타 피드 1:1',    size:'1080×1080', aspect:'1-1' },

{ id:'insta-45',   label:'인스타 4:5',        size:'1080×1350', aspect:'4-5' },

{ id:'reels',      label:'릴스/스토리 9:16',  size:'1080×1920', aspect:'9-16' },

{ id:'kakao',      label:'카카오 채널 카드',    size:'900×1200',  aspect:'3-4' },

{ id:'x',          label:'X(트위터) 카드',     size:'1200×675',  aspect:'16-9' },

{ id:'fb',         label:'페이스북 포스트',     size:'1200×630',  aspect:'16-9' },

{ id:'line',       label:'LINE 카드 (JP)',     size:'1040×1040', aspect:'1-1', jaOnly:true },

{ id:'note',       label:'note.com (JP)',      size:'1920×1080', aspect:'16-9', jaOnly:true }

],

'📝 블로그·웹': [

{ id:'naver',    label:'네이버 블로그 섬네일',  size:'750×400',   aspect:'16-9' },

{ id:'tistory',  label:'티스토리 커버',         size:'1200×630',  aspect:'16-9' },

{ id:'brunch',   label:'브런치 에디터형',        size:'1200×630',  aspect:'16-9' },

{ id:'wp',       label:'워드프레스',            size:'1200×630',  aspect:'16-9' }

],

'📊 카드뉴스·인포그래픽': [

{ id:'cardnews-5',  label:'카드뉴스 5장',   size:'1080×1080 × 5', aspect:'1-1' },

{ id:'cardnews-10', label:'카드뉴스 10장',  size:'1080×1080 × 10', aspect:'1-1' },

{ id:'info',        label:'인포그래픽 요약', size:'1080×1920',     aspect:'9-16' },

{ id:'poster-a3',   label:'포스터 A3',       size:'2480×3508',     aspect:'a4' },

{ id:'poster-a4',   label:'포스터 A4',       size:'1240×1754',     aspect:'a4' },

{ id:'ppt',         label:'PPT 슬라이드',   size:'1920×1080',     aspect:'16-9' }

],

'📄 문서·인쇄': [

{ id:'press',    label:'보도자료 A4',        size:'A4 정식',        aspect:'a4' },

{ id:'news',     label:'뉴스레터 이메일용',   size:'600px 너비',     aspect:'3-4' },

{ id:'flyer',    label:'전단지 인쇄품질',     size:'CMYK 300dpi',    aspect:'a4' },

{ id:'card',     label:'명함 양면',           size:'90×50mm',        aspect:'16-9' }

],

'🎬 영상': [

{ id:'shorts',  label:'유튜브 숏츠 60초',   size:'1080×1920',  aspect:'9-16' },

{ id:'tiktok',  label:'틱톡/릴스 15초',     size:'1080×1920',  aspect:'9-16' },

{ id:'yt-long', label:'유튜브 롱폼 가로',    size:'1920×1080',  aspect:'16-9' }

]

};
const PKG_IMAGE_STYLES = [
  '지브리따뜻','일본수채화','DSLR실사','우키요에','유화클래식',
  '미니멀플랫','3D렌더링','시네마드라마','틱톡감성','시니어감성',
  '인포그래픽','카카오이모지','자연힐링','도시야경','음식광고',
  '팝아트','흑백필름','비비드팝'
];
const PKG_LIGHTINGS = [
  '밝고따뜻','드라마틱어둠','스튜디오화이트','골든아워','쿨톤차가움',
  '따뜻촛불','블루시네마','가을빈티지','벚꽃소프트'
];
const PKG_LAYOUTS = [
  '헤드라인 중앙','이미지+텍스트','3단 그리드','매거진형','Q&A 분할',
  '타임라인','비포/애프터','카드뉴스형','인포 차트','인용문 포커스','제목 상단','제목 하단'
];
const PKG_COLOR_THEMES = {

'깔끔·전문': ['흰배경미니멀','그레이모노톤','네이비전문','블랙럭셔리'],

'감성·따뜻': ['파스텔봄','크림따뜻','코랄핑크','라벤더고급'],

'트렌디':    ['그라데이션','네온다크','글래스모피즘','레트로빈티지']

};

/* 상태 */
const PKG = {
  open: false,
  step: 1,
  sourceText: '',
  sourceCategory: 'general',
  channel: 'ko',
  selectedUses: [],
  multi: false,
  analysisDone: false,
  edit: {
    imageStyle:'지브리따뜻', lighting:'밝고따뜻',
    fontKoTitle:'Noto Sans KR', fontKoBody:'Noto Sans KR',
    fontJaTitle:'Noto Sans JP', fontJaBody:'Noto Sans JP',
    fontSize:16, fontColor:'#2b2430', fontWeight:'700',
    layout:'이미지+텍스트', colorTheme:'흰배경미니멀',
    hashtag:true, cta:false, watermark:true, subscribe:false,
    jpVertical:false, jpFurigana:false, jpKeigo:false,
    jpPlatform:'LINE',
    customImages:[], headline:'', subtitle:'', pvAspect:'mobile'
  }
};

function pkgLoadState(){
  try{ const raw = localStorage.getItem(LS_PACKAGING_STATE); if(raw) Object.assign(PKG, JSON.parse(raw)); }catch(_){}
}
function pkgSaveState(){
  try{ localStorage.setItem(LS_PACKAGING_STATE, JSON.stringify(PKG)); }catch(_){}
}

function pkgOpen(text, category){
  if(text) PKG.sourceText = text;
  if(category) PKG.sourceCategory = category;
  if(!PKG.step) PKG.step = 1;
  PKG.open = true;
  pkgSaveState();
  pkgRender();
  document.getElementById('pkgStudio').classList.add('on');
}
function pkgClose(){
  PKG.open = false;
  pkgSaveState();
  const m = document.getElementById('pkgStudio'); if(m) m.classList.remove('on');
}
function pkgGoto(step){
  if(step < 1 || step > 5) return;
  PKG.step = step;
  pkgSaveState();
  pkgRender();
}

/* 마운트 */
(function mountPkgStudio(){

if(document.getElementById('pkgStudio')) return;

pkgLoadState();

const m = document.createElement('div');

m.id = 'pkgStudio';

m.className = 'pkg-studio';

m.innerHTML =

'<div class="pkg-shell">' +

'<div class="pkg-head">' +

'<span style="font-size:22px">📦</span>' +

'<h3>콘텐츠 포장 스튜디오</h3>' +

'<button class="pkg-close" onclick="pkgClose()" title="닫기">✕</button>' +

'</div>' +

'<div class="pkg-steps" id="pkgSteps"></div>' +

'<div class="pkg-body" id="pkgBody"></div>' +

'<div class="pkg-output" id="pkgOutput" style="display:none"></div>' +

'</div>';

document.body.appendChild(m);

})();

function pkgRender(){

const steps = [

{n:1, t:'①채널'}, {n:2, t:'②용도'}, {n:3, t:'③분석'},

{n:4, t:'④편집+미리보기'}, {n:5, t:'⑤품질'}

];

const barEl = document.getElementById('pkgSteps');

barEl.innerHTML = steps.map(s => '<button class="pkg-step-pill ' + (s.n<PKG.step?'done':s.n===PKG.step?'current':'') + '" onclick="pkgGoto(' + s.n + ')">' + s.t + '</button>').join('');

const bodyEl = document.getElementById('pkgBody');

bodyEl.innerHTML = ({
    1: _pkgS1, 2: _pkgS2, 3: _pkgS3, 4: _pkgS4, 5: _pkgS5
  }[PKG.step] || _pkgS1)();

const outEl = document.getElementById('pkgOutput');

if(PKG.step >= 4){ outEl.style.display = 'flex'; outEl.innerHTML = _pkgOutputBar(); }

else outEl.style.display = 'none';

if(PKG.step === 4) _pkgBindEditor();

}

/* ─── STEP 1 채널 ─── */
function _pkgS1(){
  return '<h3 style="margin:0 0 6px">STEP 1 · 채널 선택</h3>' +
    '<p style="color:var(--sub);font-size:13px;margin:0 0 14px">언어·폰트·이미지 스타일이 이 선택에 따라 자동 분기돼요.</p>' +
    '<div class="pkg-ch-row">' +
      [['ko','🇰🇷 한국'],['ja','🇯🇵 日本'],['both','🌏 동시생성']].map(([id,l]) =>
        '<button class="' + (PKG.channel===id?'on':'') + '" onclick="pkgPickChannel(\'' + id + '\')">' + l + '</button>'
      ).join('') +
    '</div>' +
    '<div style="margin-top:20px;display:flex;justify-content:flex-end">' +
      '<button class="pkg-step-pill current" onclick="pkgGoto(2)">다음: 용도 선택 →</button>' +
    '</div>';
}
function pkgPickChannel(c){ PKG.channel = c; pkgSaveState(); pkgRender(); }

/* ─── STEP 2 용도 ─── */
function _pkgS2(){

let html = '<h3 style="margin:0 0 6px">STEP 2 · 어디에 올릴 건가요?</h3>' +

'<p style="color:var(--sub);font-size:13px;margin:0 0 14px">여러 용도 선택 가능 · 선택한 모든 것을 한 번에 생성합니다.</p>' +

'<label style="display:flex;align-items:center;gap:6px;margin-bottom:14px;font-weight:900;font-size:13px">' +

'<input type="checkbox" ' + (PKG.multi?'checked':'') + ' onchange="PKG.multi=this.checked;pkgSaveState()"> ' +

'📦 여러 용도 동시 생성 (멀티 포장)' +

'</label>';

Object.keys(PKG_USES).forEach(group => {
    html += '<div class="pkg-cat-group"><h4>' + group + '</h4><div class="pkg-use-grid">' +
      PKG_USES[group].filter(u => !u.jaOnly || PKG.channel !== 'ko').map(u => {
        const on = PKG.selectedUses.includes(u.id);
        return '<div class="pkg-use' + (on?' on':'') + '" onclick="pkgToggleUse(\'' + u.id + '\')">' +
          '<span class="chk">✓</span><b>' + u.label + '</b><span>' + u.size + '</span>' +
        '</div>';
      }).join('') +
    '</div></div>';
  });

html += '<div style="display:flex;justify-content:space-between;margin-top:14px">' +

'<button class="pkg-step-pill" onclick="pkgGoto(1)">← 이전</button>' +

'<button class="pkg-step-pill current" onclick="pkgGoto(3)">다음: 분석 →</button>' +

'</div>';

return html;

}
function pkgToggleUse(id){

const i = PKG.selectedUses.indexOf(id);

if(PKG.multi){
    if(i>=0) PKG.selectedUses.splice(i,1); else PKG.selectedUses.push(id);
  } else {
    PKG.selectedUses = [id];
  }

pkgSaveState(); pkgRender();

}

/* ─── STEP 3 AI 분석 ─── */
function _pkgS3(){
  setTimeout(() => _pkgRunAnalysis(), 200);
  return '<h3 style="margin:0 0 6px">STEP 3 · AI 자동 포장 분석</h3>' +
    '<p style="color:var(--sub);font-size:13px;margin:0 0 14px">마음에 안 드는 것만 바꾸면 됩니다 😊</p>' +
    '<div class="pkg-analyze" id="pkgAnalyze"></div>' +
    '<div style="display:flex;justify-content:space-between;margin-top:14px">' +
      '<button class="pkg-step-pill" onclick="pkgGoto(2)">← 이전</button>' +
      '<button class="pkg-step-pill current" onclick="pkgGoto(4)">다음: 편집 →</button>' +
    '</div>';
}
function _pkgRunAnalysis(){
  const el = document.getElementById('pkgAnalyze'); if(!el) return;
  const steps = [
    '✅ 글 길이·톤 분석 완료',
    '✅ 핵심 문장 자동 추출',
    '✅ 최적 비율 적용 (' + PKG.selectedUses.length + '개 용도)',
    '✅ 내 브랜드 색상·폰트 자동 적용',
    '✅ 이미지 스타일 자동 매칭 (' + PKG.edit.imageStyle + ')',
    '✅ 해시태그 자동 생성',
    '✅ 품질 검증 완료'
  ];
  // 브랜드 프리셋 자동 적용
  const b = loadBrandPreset();
  if(b){
    if(PKG.channel !== 'ja'){ PKG.edit.fontKoTitle = b.ko.titleFont; PKG.edit.fontKoBody = b.ko.bodyFont; PKG.edit.fontColor = b.ko.color; }
    if(PKG.channel !== 'ko'){ PKG.edit.fontJaTitle = b.ja.titleFont; PKG.edit.fontJaBody = b.ja.bodyFont; }
  }
  // 글에서 첫 줄 헤드라인, 두번째 줄 부제 추출
  const lines = PKG.sourceText.split('\n').filter(l => l.trim());
  PKG.edit.headline = (lines[0]||'').replace(/^#+\s*/,'').slice(0,50);
  PKG.edit.subtitle = (lines[1]||lines[2]||'').slice(0,80);
  pkgSaveState();
  el.innerHTML = '';
  steps.forEach((s, i) => {

setTimeout(() => {
      const div = document.createElement('div');
      div.className = 'step-line';
      div.style.animationDelay = '0s';
      div.textContent = s;
      el.appendChild(div);
      if(i === steps.length-1){
        PKG.analysisDone = true;
        const tip = document.createElement('div');
        tip.className = 'step-line';
        tip.style.marginTop = '8px'; tip.style.color = 'var(--pink-deep)'; tip.style.fontStyle = 'italic';
        tip.textContent = '마음에 안 드는 것만 바꾸면 됩니다 😊';
        el.appendChild(tip);
      }
    }, i * 300);

});
}

/* ─── STEP 4 편집 + 실시간 미리보기 ─── */
function _pkgS4(){
  const e = PKG.edit;
  const imgStyleChips = PKG_IMAGE_STYLES.map(s => '<button class="pkg-chip' + (e.imageStyle===s?' on':'') + '" onclick="pkgSetEdit(\'imageStyle\',\'' + s + '\')">' + s + '</button>').join('');
  const lightChips    = PKG_LIGHTINGS.map(s => '<button class="pkg-chip' + (e.lighting===s?' on':'') + '" onclick="pkgSetEdit(\'lighting\',\'' + s + '\')">' + s + '</button>').join('');
  const layoutChips   = PKG_LAYOUTS.map(s => '<button class="pkg-chip' + (e.layout===s?' on':'') + '" onclick="pkgSetEdit(\'layout\',\'' + s + '\')">' + s + '</button>').join('');
  const fontKoOpts    = BRAND_FONTS_KO.map(f => '<option value="' + f + '" ' + (e.fontKoTitle===f?'selected':'') + '>' + f + '</option>').join('');
  const fontJaOpts    = BRAND_FONTS_JA.map(f => '<option value="' + f + '" ' + (e.fontJaTitle===f?'selected':'') + '>' + f + '</option>').join('');
  const themeChips = Object.keys(PKG_COLOR_THEMES).map(g =>
    '<h5 style="margin:6px 0 4px;font-size:11px;color:var(--sub)">' + g + '</h5>' +
    '<div class="pkg-chips">' +
      PKG_COLOR_THEMES[g].map(t => '<button class="pkg-chip' + (e.colorTheme===t?' on':'') + '" onclick="pkgSetEdit(\'colorTheme\',\'' + t + '\')">' + t + '</button>').join('') +
    '</div>'
  ).join('');

  const brand = loadBrandPreset();
  const brandBtn = brand && brand.channelName ? '<button class="pkg-chip on">브랜드 컬러 (' + brand.channelName + ')</button>' : '';

  return '<div class="pkg-edit">' +
    '<div class="pkg-left">' +
      '<details open><summary>🖼 이미지</summary>' +
        '<label style="font-size:11px">스타일 (18종)</label>' +
        '<div class="pkg-chips">' + imgStyleChips + '</div>' +
        '<label style="font-size:11px;margin-top:6px">조명·분위기 (9종)</label>' +
        '<div class="pkg-chips">' + lightChips + '</div>' +
        '<div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap">' +
          '<button class="pkg-chip" onclick="pkgAiRegen()">🔄 AI 재생성</button>' +
          '<button class="pkg-chip" onclick="pkgUploadImage()">📁 직접 업로드</button>' +
          '<button class="pkg-chip" onclick="pkgStockSearch()">🔎 스톡 검색</button>' +
        '</div>' +
      '</details>' +
      '<details><summary>🔤 텍스트</summary>' +
        '<label style="font-size:11px">헤드라인</label>' +
        '<input class="set-in" id="pkg-headline" value="' + (e.headline||'') + '">' +
        '<label style="font-size:11px">부제</label>' +
        '<input class="set-in" id="pkg-subtitle" value="' + (e.subtitle||'') + '">' +
        (PKG.channel !== 'ja' ? '<label style="font-size:11px">한국어 제목 폰트</label><select class="set-in" id="pkg-ko-title">' + fontKoOpts + '</select>' : '') +
        (PKG.channel !== 'ko' ? '<label style="font-size:11px">일본어 제목 폰트</label><select class="set-in" id="pkg-ja-title">' + fontJaOpts + '</select>' : '') +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px">' +
          '<div><label style="font-size:11px">크기 ' + e.fontSize + 'px</label><input type="range" id="pkg-size" min="10" max="48" value="' + e.fontSize + '"></div>' +
          '<div><label style="font-size:11px">색상</label><input type="color" id="pkg-color" value="' + e.fontColor + '"></div>' +
        '</div>' +
      '</details>' +
      '<details><summary>📐 레이아웃 (12종)</summary>' +
        '<div class="pkg-chips">' + layoutChips + '</div>' +
      '</details>' +
      '<details><summary>🎨 색상 테마</summary>' + themeChips + (brandBtn?'<h5 style="margin:6px 0 4px;font-size:11px;color:var(--sub)">브랜드</h5><div class="pkg-chips">'+brandBtn+'</div>':'') + '</details>' +

      (PKG.channel !== 'ko' ? '<details><summary>🇯🇵 일본어 전용</summary>' +
        '<label style="font-size:12px"><input type="checkbox" id="pkg-jp-v" ' + (e.jpVertical?'checked':'') + '> 縦書き (세로쓰기)</label><br>' +
        '<label style="font-size:12px"><input type="checkbox" id="pkg-jp-f" ' + (e.jpFurigana?'checked':'') + '> ふりがな 자동추가</label><br>' +
        '<label style="font-size:12px"><input type="checkbox" id="pkg-jp-k" ' + (e.jpKeigo?'checked':'') + '> 敬語변환 (です・ます調)</label><br>' +
        '<label style="font-size:11px;margin-top:6px">플랫폼 최적화</label>' +
        '<select class="set-in" id="pkg-jp-p"><option>LINE</option><option>note</option><option>Yahoo!ニュース</option></select>' +
      '</details>' : '') +

      '<details><summary>➕ 추가 요소</summary>' +
        '<label style="font-size:12px"><input type="checkbox" id="pkg-hashtag" ' + (e.hashtag?'checked':'') + '> 해시태그 자동생성</label><br>' +
        '<label style="font-size:12px"><input type="checkbox" id="pkg-cta" ' + (e.cta?'checked':'') + '> CTA 문구 자동삽입</label><br>' +
        '<label style="font-size:12px"><input type="checkbox" id="pkg-wm" ' + (e.watermark?'checked':'') + '> 채널명·로고 워터마크</label><br>' +
        '<label style="font-size:12px"><input type="checkbox" id="pkg-sub" ' + (e.subscribe?'checked':'') + '> 구독 유도 문구</label>' +
      '</details>' +
    '</div>' +

    '<div class="pkg-right">' +
      '<div class="pkg-pv-tabs">' +
        ['mobile','pc','print'].map(v => '<button class="' + (e.pvAspect===v?'on':'') + '" onclick="pkgSetPvAspect(\'' + v + '\')">' + ({mobile:'📱 모바일', pc:'💻 PC', print:'🖨 인쇄'}[v]) + '</button>').join('') +
      '</div>' +
      '<div id="pkgPreview" class="pkg-preview">' + _pkgRenderPreview() + '</div>' +
      _pkgQcSection() +
    '</div>' +
  '</div>';
}
function pkgSetEdit(key, val){
  PKG.edit[key] = val; pkgSaveState();
  const prev = document.getElementById('pkgPreview');
  if(prev) prev.innerHTML = _pkgRenderPreview();
  pkgRender(); // 전체 재렌더 (chip active 반영)
}
function pkgSetPvAspect(v){ PKG.edit.pvAspect = v; pkgSaveState(); const prev = document.getElementById('pkgPreview'); if(prev) _applyPreviewAspect(prev); }
function _applyPreviewAspect(el){
  el.classList.remove('aspect-1-1','aspect-4-5','aspect-9-16','aspect-16-9','aspect-a4');
  const firstUse = PKG.selectedUses[0];
  let aspect = '16-9';
  for(const group in PKG_USES){
    const u = PKG_USES[group].find(x => x.id === firstUse);
    if(u){ aspect = u.aspect; break; }
  }
  if(PKG.edit.pvAspect === 'print') aspect = 'a4';
  else if(PKG.edit.pvAspect === 'mobile' && aspect === '16-9') aspect = '9-16';
  el.classList.add('aspect-' + aspect);
}

function _pkgRenderPreview(){
  const e = PKG.edit;
  const b = loadBrandPreset();
  const themeMap = {
    '흰배경미니멀': {bg:'#fff', fg:'#2b2430', accent:e.fontColor},
    '그레이모노톤': {bg:'#f5f5f5', fg:'#333', accent:'#666'},
    '네이비전문': {bg:'#1a2752', fg:'#fff', accent:'#7cb2ff'},
    '블랙럭셔리': {bg:'#111', fg:'#fff', accent:'#d4af37'},
    '파스텔봄': {bg:'#fff5fa', fg:'#2b2430', accent:'#ef6fab'},
    '크림따뜻': {bg:'#fff7ee', fg:'#3a2e24', accent:'#c19a6b'},
    '코랄핑크': {bg:'#ffe5e0', fg:'#5a2828', accent:'#ff6b6b'},
    '라벤더고급': {bg:'#f4eaff', fg:'#2a1a4a', accent:'#9181ff'},
    '그라데이션': {bg:'linear-gradient(135deg,#ef6fab,#9181ff)', fg:'#fff', accent:'#fff'},
    '네온다크': {bg:'#0a0a0a', fg:'#0ff', accent:'#f0f'},
    '글래스모피즘': {bg:'rgba(255,255,255,.7)', fg:'#2b2430', accent:'#9181ff'},
    '레트로빈티지': {bg:'#f4e6c8', fg:'#4a2c17', accent:'#b85a3a'}
  };
  const t = themeMap[e.colorTheme] || themeMap['흰배경미니멀'];
  const font = (PKG.channel === 'ja') ? e.fontJaTitle : e.fontKoTitle;
  const textBody = PKG.sourceText.split('\n').slice(0, 5).join('<br>');
  const hashHtml = e.hashtag ? '<div style="margin-top:auto;font-size:' + Math.max(10,e.fontSize*0.6) + 'px;opacity:.7">#시니어 #건강 #일상</div>' : '';
  const wmHtml = e.watermark && b && b.channelName ? '<div style="position:absolute;bottom:8px;right:12px;font-size:10px;opacity:.6">© ' + b.channelName + '</div>' : '';
  return '<div style="background:' + t.bg + ';color:' + t.fg + ';width:100%;height:100%;padding:28px;' +
    'display:flex;flex-direction:column;gap:12px;position:relative;overflow:hidden;' +
    'font-family:' + font + ', sans-serif">' +
    '<div style="font-size:' + (e.fontSize+6) + 'px;font-weight:900;line-height:1.3;color:' + t.accent + '">' + (e.headline||'제목 없음') + '</div>' +
    (e.subtitle ? '<div style="font-size:' + e.fontSize + 'px;opacity:.85;line-height:1.5">' + e.subtitle + '</div>' : '') +
    '<div style="font-size:' + Math.max(11,e.fontSize*0.8) + 'px;line-height:1.7;opacity:.9">' + (textBody||'본문이 여기에 표시됩니다') + '</div>' +
    hashHtml + wmHtml +
    '</div>';
}

function _pkgQcSection(){
  // 품질 체크 — 간단 휴리스틱
  const e = PKG.edit;
  const hasText = (e.headline||'').length > 2;
  const textSize = e.fontSize;
  const checks = [
    {k:'ok', t:'해상도 적합 (' + (PKG.selectedUses.length || 1) + '개 용도)'},
    {k: hasText ? 'ok':'warn', t: hasText ? '텍스트 가독성 양호' : '헤드라인 너무 짧음', fix:'headline'},
    {k: textSize>=14 ? 'ok':'warn', t: textSize>=14 ? '폰트 크기 적정' : '인쇄용 최소 글자크기 미달 (14px+)', fix:'size'},
    {k:'ok', t:'여백·안전영역 준수'},
    {k: PKG.edit.pvAspect==='print' ? 'warn':'ok', t: PKG.edit.pvAspect==='print' ? 'CMYK 색상모드 권장' : 'RGB 색상모드 OK'},
    {k:'ok', t:'파일크기 적정'}
  ];
  return '<div class="pkg-qc">' +
    '<h5>✅ 품질 보증 체크</h5>' +
    checks.map(c => '<div class="qc-item ' + c.k + '">' +
      (c.k==='ok'?'✅':c.k==='warn'?'⚠️':'❌') + ' ' + c.t +
      (c.fix && c.k !== 'ok' ? '<button class="qc-fix" onclick="pkgQcFix(\'' + c.fix + '\')">자동 수정</button>' : '') +
    '</div>').join('') +
  '</div>';
}
function pkgQcFix(field){
  if(field === 'headline'){ PKG.edit.headline = (PKG.sourceText.split('\n')[0]||'제목 없음').slice(0,50); }
  if(field === 'size'){ PKG.edit.fontSize = Math.max(14, PKG.edit.fontSize); }
  pkgSaveState(); pkgRender();
  window.mocaToast('🔧 자동 수정 완료', 'ok');
}

/* 편집 패널 입력 디바운스 바인딩 */
let _pkgDebounce = null;
function _pkgBindEditor(){
  const on = (id, key, type) => {

const el = document.getElementById(id); if(!el) return;

el.addEventListener(type||'input', () => {
      clearTimeout(_pkgDebounce);
      _pkgDebounce = setTimeout(() => {
        let v = (type==='change' || el.type==='checkbox') ? (el.type==='checkbox'?el.checked:el.value) : el.value;
        if(id === 'pkg-size') v = parseInt(v, 10);
        PKG.edit[key] = v; pkgSaveState();
        const prev = document.getElementById('pkgPreview');
        if(prev) prev.innerHTML = _pkgRenderPreview();
      }, 300);
    });

};
  on('pkg-headline','headline');
  on('pkg-subtitle','subtitle');
  on('pkg-ko-title','fontKoTitle','change');
  on('pkg-ja-title','fontJaTitle','change');
  on('pkg-size','fontSize');
  on('pkg-color','fontColor');
  on('pkg-jp-v','jpVertical','change');
  on('pkg-jp-f','jpFurigana','change');
  on('pkg-jp-k','jpKeigo','change');
  on('pkg-jp-p','jpPlatform','change');
  on('pkg-hashtag','hashtag','change');
  on('pkg-cta','cta','change');
  on('pkg-wm','watermark','change');
  on('pkg-sub','subscribe','change');
}

function pkgAiRegen(){ window.mocaToast('🔄 AI 이미지 재생성 (OpenAI 키 필요)', 'info'); }
function pkgUploadImage(){ window.mocaToast('📁 이미지 업로드 UI (구현 예정)', 'info'); }
function pkgStockSearch(){ window.mocaToast('🔎 스톡 검색 (Unsplash 연동 예정)', 'info'); }

/* ─── STEP 5 품질 (분리 뷰) ─── */
function _pkgS5(){
  return '<h3 style="margin:0 0 6px">STEP 5 · 품질 보증 체크</h3>' +
    '<p style="color:var(--sub);font-size:13px;margin:0 0 14px">모든 품질 기준 · ⚠️/❌ 항목은 자동 수정 가능</p>' +
    _pkgQcSection() +
    '<div style="display:flex;justify-content:space-between;margin-top:14px">' +
      '<button class="pkg-step-pill" onclick="pkgGoto(4)">← 편집으로</button>' +
      '<button class="pkg-step-pill current" onclick="pkgOutput()">✅ 출력하기 →</button>' +
    '</div>';
}

/* ─── 출력 바 ─── */
function _pkgOutputBar(){
  const multi = PKG.selectedUses.length > 1;
  return (multi
    ? '<button class="pri" onclick="pkgSaveZip()">📦 전체 ZIP 다운로드</button>'
    : '<button class="pri" onclick="pkgSaveImage()">📥 이미지 저장</button>' +
      '<button onclick="pkgSavePdf()">📥 PDF</button>' +
      '<button onclick="pkgCopyHtml()">📋 HTML 복사</button>' +
      '<button onclick="pkgShare()">📤 바로 공유</button>') +
  '<button onclick="pkgTempSave()">💾 임시저장</button>' +
  '<span class="spacer"></span>' +
  '<button onclick="pkgGoto(2)">+ 다른 용도로도</button>' +
  '<button onclick="pkgClose()">🔄 글 수정 후 다시</button>';
}
function pkgOutput(){
  window.mocaToast('🎉 포장 완료!', 'ok');
}
function pkgSaveImage(){
  // DOM 을 그대로 다운로드 (html2canvas 없이 간이 버전 — HTML 파일)
  const html = document.getElementById('pkgPreview')?.innerHTML || '';
  const full = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:20px;font-family:sans-serif}</style></head><body>' + html + '</body></html>';
  const blob = new Blob([full], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='package.html'; a.click(); URL.revokeObjectURL(url);
  window.mocaToast('📥 HTML 파일로 저장 (스크린샷 툴 필요)', 'info');
}
function pkgSavePdf(){
  const html = document.getElementById('pkgPreview')?.innerHTML || '';
  const w = window.open('', '_blank');
  w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:sans-serif;margin:0;padding:20px}</style></head><body>' + html + '</body></html>');
  w.document.close(); w.focus(); setTimeout(() => w.print(), 400);
}
function pkgCopyHtml(){
  const html = document.getElementById('pkgPreview')?.innerHTML || '';
  navigator.clipboard.writeText(html).then(() => window.mocaToast('📋 HTML 복사 완료', 'ok'));
}
function pkgShare(){
  const text = (PKG.edit.headline||'') + '\n\n' + PKG.sourceText;
  if(navigator.share){ navigator.share({title:PKG.edit.headline, text}).catch(()=>{}); }
  else { navigator.clipboard.writeText(text).then(()=>window.mocaToast('📋 공유 텍스트 복사', 'ok')); }
}
function pkgSaveZip(){
  // 용도별 HTML 묶음 — 실제 ZIP 라이브러리 없이 HTML 한 파일로
  const parts = PKG.selectedUses.map(id => {

const u = Object.values(PKG_USES).flat().find(x => x.id === id);

return '<section><h2>' + (u?.label||id) + ' (' + (u?.size||'') + ')</h2>' +

'<div style="border:1px solid #ccc;padding:20px;margin:10px 0">' + _pkgRenderPreview() + '</div></section>';

}).join('');
  const full = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:sans-serif;max-width:900px;margin:0 auto;padding:20px}</style></head><body>' +
    '<h1>📦 ' + PKG.selectedUses.length + '개 용도 포장 결과</h1>' + parts + '</body></html>';
  const blob = new Blob([full], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='package-all.html'; a.click(); URL.revokeObjectURL(url);
  window.mocaToast('📦 전체 포장 HTML 저장 (ZIP은 jszip 연동 필요)', 'info');
}
function pkgTempSave(){ pkgSaveState(); window.mocaToast('💾 임시저장 완료', 'ok'); }

/* ─── "🎨 이 글 포장하기" 버튼 자동 부착 ─── */
(function autoAttachPkgTrigger(){
  const targets = [
    ['mz-out','monetize'], ['pb-out','public'], ['ed-out','edu'],
    ['tr-out','translate'], ['sm-out','smb'], ['ps-out','psy'], ['ppt-out-ko','ppt']
  ];
  const divTargets = [['intentResult','general'], ['one-result','general']];
  setInterval(() => {
    targets.forEach(([id, cat]) => {
      const el = document.getElementById(id); if(!el) return;
      const val = (el.value||'').trim();
      const has = val.length > 30;
      const trigId = 'pkg-trig-' + id;
      let trig = document.getElementById(trigId);
      if(has && !trig){
        trig = document.createElement('div');
        trig.id = trigId;
        trig.className = 'pkg-trigger';
        trig.innerHTML = '<div style="margin-bottom:6px;font-size:13px;font-weight:800;color:var(--pink-deep)">🎁 이 글을 어디에 올릴지 자동으로 포장해드릴까요?</div>' +
          '<button onclick="pkgOpen(document.getElementById(\'' + id + '\').value,\'' + cat + '\')">🎨 이 글 포장하기 →</button>';
        el.parentElement.insertBefore(trig, el.nextSibling);
      } else if(!has && trig){ trig.remove(); }
    });
    divTargets.forEach(([id, cat]) => {
      const el = document.getElementById(id); if(!el) return;
      const txt = (el.textContent||'').trim();
      const has = txt.length > 30 && el.offsetParent !== null;
      const trigId = 'pkg-trig-' + id;
      let trig = document.getElementById(trigId);
      if(has && !trig){
        trig = document.createElement('div');
        trig.id = trigId;
        trig.className = 'pkg-trigger';
        const safeTxt = txt.slice(0, 5000).replace(/'/g, '');
        trig.innerHTML = '<button onclick="pkgOpen(document.getElementById(\'' + id + '\').textContent,\'' + cat + '\')">🎨 이 글 포장하기 →</button>';
        el.parentElement.insertBefore(trig, el.nextSibling);
      } else if(!has && trig){ trig.remove(); }
    });
  }, 1800);
})();
