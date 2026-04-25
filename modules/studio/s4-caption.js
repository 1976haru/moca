/* ================================================
   modules/studio/s4-caption.js
   ④ 영상 구성·미리보기 — TAB 2 자막·폰트
   (s4-edit.js 분리: S4_FONTS / _s4eT2Caption /
    _s4eFontSafeCheck / _s4eGenSrt / _s4eSrtTime)
   ================================================ */

/* ── 폰트 데이터 ── */
const S4_FONTS = [
  {
    id: 'noto_both',
    label: 'Noto Sans KR+JP',
    lang: 'both',
    css: '"Noto Sans KR","Noto Sans JP",sans-serif',
    google: 'Noto+Sans+KR:wght@400;700;900&family=Noto+Sans+JP:wght@400;700;900',
    preview_ko: '안녕하세요 / こんにちは',
    preview_ja: 'シニア情報 / 시니어 정보',
    desc: '한일 동시 채널 ✅ 필수 권장',
    recommended: true,
  },
  {
    id: 'noto_serif_both',
    label: 'Noto Serif KR+JP',
    lang: 'both',
    css: '"Noto Serif KR","Noto Serif JP",serif',
    google: 'Noto+Serif+KR:wght@400;700&family=Noto+Serif+JP:wght@400;700',
    preview_ko: '노후 준비 완벽 가이드',
    preview_ja: '老後の準備ガイド',
    desc: '다큐·정보형 고급감',
  },
  {
    id: 'pretendard',
    label: 'Pretendard',
    lang: 'ko',
    css: 'Pretendard,"Noto Sans KR",sans-serif',
    google: 'Noto+Sans+KR:wght@400;700;900',
    preview_ko: '이거 모르면 후회해요!',
    preview_ja: null,
    desc: '한국 채널 기본',
  },
  {
    id: 'nanumsquare',
    label: '나눔스퀘어',
    lang: 'ko',
    css: '"NanumSquare","Noto Sans KR",sans-serif',
    google: 'Nanum+Gothic:wght@700;800',
    preview_ko: '시니어 꿀팁 공개!',
    preview_ja: null,
    desc: '한국 훅·강조 문구',
  },
  {
    id: 'noto_jp',
    label: 'Noto Sans JP',
    lang: 'ja',
    css: '"Noto Sans JP","Hiragino Sans",sans-serif',
    google: 'Noto+Sans+JP:wght@400;700;900',
    preview_ko: null,
    preview_ja: '知らないと損する！',
    desc: '일본 채널 가장 안전',
  },
  {
    id: 'zen_maru',
    label: 'Zen Maru Gothic',
    lang: 'ja',
    css: '"Zen Maru Gothic","Noto Sans JP",sans-serif',
    google: 'Zen+Maru+Gothic:wght@400;700',
    preview_ko: null,
    preview_ja: 'やってみましょう！',
    desc: '일본 시니어 친근감',
  },
  {
    id: 'mplus',
    label: 'M PLUS Rounded',
    lang: 'ja',
    css: '"M PLUS Rounded 1c","Noto Sans JP",sans-serif',
    google: 'M+PLUS+Rounded+1c:wght@700;900',
    preview_ko: null,
    preview_ja: 'シニアの情報',
    desc: '일본 임팩트·훅',
  },
];

/* ════════════════════════════════════════════════
   TAB 2 — 자막·폰트
   ════════════════════════════════════════════════ */
function _s4eT2Caption(scenes, proj) {
  const cap    = _s4Edit.caption;
  const font   = S4_FONTS.find(f => f.id === cap.fontId) || S4_FONTS[0];
  const chLang = _s4Edit.channelLang || 'both';

  // 폰트 안전성 체크
  const srtText = scenes.map(s => s.caption || s.desc || '').join(' ');
  const fontCheck = _s4eFontSafeCheck(srtText, cap.fontId);

  return `
  <div class="s4e-section">

    <!-- 채널 언어 -->
    <div class="s4e-block">
      <div class="s4e-label">🌐 채널 언어</div>
      <div class="s4e-seg">
        ${[['ko','🇰🇷 한국어만'],['ja','🇯🇵 일본어만'],['both','🇰🇷🇯🇵 한일동시']].map(([v,l])=>`
          <button class="s4e-seg-btn ${chLang===v?'on':''}"
            onclick="_s4Edit.channelLang='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
        `).join('')}
      </div>
    </div>

    <!-- 폰트 선택 -->
    <div class="s4e-block">
      <div class="s4e-label">🔤 폰트 선택</div>

      ${!fontCheck.ok ? `
        <div class="s4e-font-warn">
          ⚠️ ${fontCheck.msg}
        </div>` : ''}

      <div class="s4e-font-list">
      ${S4_FONTS.filter(f =>
          chLang === 'both' ? true :
          f.lang === chLang || f.lang === 'both'
        ).map(f => `
        <label class="s4e-font-row ${cap.fontId===f.id?'on':''}">
          <input type="radio" name="s4font" value="${f.id}"
            ${cap.fontId===f.id?'checked':''}
            onchange="_s4Edit.caption.fontId='${f.id}';_studioS4Edit('studioS4EditWrap')">
          <div class="s4e-font-name">
            ${f.label}
            ${f.recommended?'<span class="s4e-badge-rec">✅ 권장</span>':''}
            ${f.lang==='both'?'<span class="s4e-badge-safe">한일 안전</span>':''}
          </div>
          <div class="s4e-font-preview" style="font-family:${f.css}">
            ${chLang==='ja' ? (f.preview_ja||f.preview_ko||'') :
              chLang==='ko' ? (f.preview_ko||'') :
              (f.preview_ko||'')+' / '+(f.preview_ja||'')}
          </div>
          <div class="s4e-font-desc">${f.desc}</div>
        </label>
      `).join('')}
      </div>
    </div>

    <!-- 자막 스타일 -->
    <div class="s4e-block">
      <div class="s4e-label">📐 자막 스타일</div>

      <div class="s4e-style-presets">
        ${[
          {id:'shorts', label:'📱 Shorts', pos:'bottom', size:'lg', color:'#fff', bg:true},
          {id:'reels',  label:'📸 Reels',  pos:'center', size:'xl', color:'#fff', bg:false},
          {id:'tiktok', label:'🔴 TikTok', pos:'top',    size:'lg', color:'#FFE033', bg:false},
        ].map(p=>`
          <button class="s4e-preset-btn"
            onclick="_s4eApplyPreset('${p.id}')">
            ${p.label}
          </button>
        `).join('')}
      </div>

      <div class="s4e-style-rows">
        <div class="s4e-style-row">
          <span>크기</span>
          <div class="s4e-seg">
            ${[['sm','작게'],['md','보통'],['lg','크게'],['xl','최대']].map(([v,l])=>`
              <button class="s4e-seg-btn ${cap.size===v?'on':''}"
                onclick="_s4Edit.caption.size='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
            `).join('')}
          </div>
        </div>
        <div class="s4e-style-row">
          <span>위치</span>
          <div class="s4e-seg">
            ${[['top','상단'],['center','중앙'],['bottom','하단']].map(([v,l])=>`
              <button class="s4e-seg-btn ${cap.position===v?'on':''}"
                onclick="_s4Edit.caption.position='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
            `).join('')}
          </div>
        </div>
        <div class="s4e-style-row">
          <span>색상</span>
          <div class="s4e-seg">
            ${[['#ffffff','흰색'],['#FFE033','노랑'],['#000000','검정']].map(([v,l])=>`
              <button class="s4e-seg-btn ${cap.color===v?'on':''}"
                style="${v==='#ffffff'?'background:#f0f0f0;':v==='#000000'?'background:#333;color:#fff;':''}"
                onclick="_s4Edit.caption.color='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
            `).join('')}
          </div>
        </div>
        <div class="s4e-style-row">
          <span>배경</span>
          <div class="s4e-seg">
            <button class="s4e-seg-btn ${cap.bg?'on':''}"
              onclick="_s4Edit.caption.bg=true;_studioS4Edit('studioS4EditWrap')">반투명</button>
            <button class="s4e-seg-btn ${!cap.bg?'on':''}"
              onclick="_s4Edit.caption.bg=false;_studioS4Edit('studioS4EditWrap')">없음</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 자동 처리 설정 -->
    <div class="s4e-block">
      <div class="s4e-label">⚙️ 자동 처리</div>
      <div class="s4e-auto-rows">
        ${[
          ['autoSplit','20자 초과 자동 2줄 분할'],
          ['autoEmphasis','강조 키워드 색상 표시'],
          ['safeZone','안전구역 체크 (Shorts/TikTok)'],
        ].map(([k,l])=>`
          <label class="s4e-auto-row">
            <input type="checkbox" ${_s4Edit.caption[k]?'checked':''}
              onchange="_s4Edit.caption['${k}']=this.checked">
            ${l}
          </label>
        `).join('')}
      </div>
    </div>

    <!-- SRT 생성 -->
    <div class="s4e-block">
      <div class="s4e-label">📄 SRT 자막 파일</div>
      <div class="s4e-srt-btns">
        <button class="s4e-btn-outline" onclick="_s4eGenSrt('ko')">
          🇰🇷 한국어 SRT 생성
        </button>
        ${chLang !== 'ko' ? `
        <button class="s4e-btn-outline" onclick="_s4eGenSrt('ja')">
          🇯🇵 일본어 SRT 생성
        </button>` : ''}
      </div>
      <div class="s4e-srt-preview" id="s4eSrtPreview"></div>
    </div>
  </div>`;
}

/* ── 헬퍼 ── */
function _s4eFontSafeCheck(text, fontId) {
  const font = S4_FONTS.find(f => f.id === fontId);
  if (!font) return { ok: true };
  const hasKo = /[가-힣]/.test(text);
  const hasJa = /[぀-ヿ一-龯]/.test(text);
  if (font.lang === 'ko' && hasJa)
    return { ok: false, msg: '한국 폰트에 일본어 감지 → Noto Sans KR+JP 권장' };
  if (font.lang === 'ja' && hasKo)
    return { ok: false, msg: '일본 폰트에 한글 감지 → Noto Sans KR+JP 권장' };
  return { ok: true };
}

function _s4eGenSrt(lang) {
  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const scenes = proj.scenes || [];
  const dur    = _s4eSceneDuration(proj);
  let srt = '';
  scenes.forEach((s, i) => {
    const start = i * dur;
    const end   = (i + 1) * dur;
    const text  = lang === 'ja'
      ? (s.captionJa || s.descJa || s.caption || s.desc || '')
      : (s.caption || s.desc || s.label || '');
    srt += `${i+1}\n`;
    srt += `${_s4eSrtTime(start)} --> ${_s4eSrtTime(end)}\n`;
    srt += `${text}\n\n`;
  });

  const el = document.getElementById('s4eSrtPreview');
  if (el) el.textContent = srt.slice(0, 300) + '...';

  const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `subtitle_${lang}.srt`;
  a.click();
  URL.revokeObjectURL(url);
}

function _s4eSrtTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},000`;
}
