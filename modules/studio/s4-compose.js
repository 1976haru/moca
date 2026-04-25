/* ================================================
   modules/studio/s4-compose.js
   ④ 영상 구성·미리보기 — TAB 3 썸네일 / TAB 4 영상구성 / TAB 5 BGM
   (s4-edit.js 분리: _s4eT3Thumb / _s4eT4Compose / _s4eT5Audio /
    _s4eDownloadThumb / _s4eAutoThumbText / _s4eHookBoost)
   ================================================ */

/* ════════════════════════════════════════════════
   TAB 3 — 썸네일 텍스트 오버레이
   ════════════════════════════════════════════════ */
function _s4eT3Thumb(proj) {
  const th    = _s4Edit.thumb;
  const imgs  = (proj.scenes || []).map(s => s.imageUrl || s.img).filter(Boolean);
  const imgUrl= proj.thumbUrl || imgs[0] || '';
  const font  = S4_FONTS.find(f => f.id === (_s4Edit.caption.fontId)) || S4_FONTS[0];

  return `
  <div class="s4e-section">
    <div class="s4e-block">
      <div class="s4e-label">
        🖼 썸네일 텍스트 오버레이
        <span class="s4e-label-sub">이미지 생성은 STEP2에서 완료됨</span>
      </div>

      <!-- A/B/C 안 탭 -->
      <div class="s4e-ab-tabs">
        ${['A','B','C'].map(v=>`
          <button class="s4e-ab-tab ${_s4ThumbAlt===v?'on':''}"
            onclick="_s4ThumbAlt='${v}';_studioS4Edit('studioS4EditWrap')">${v}안</button>
        `).join('')}
      </div>

      <!-- 썸네일 미리보기 -->
      <div class="s4e-thumb-preview">
        ${imgUrl
          ? `<img src="${imgUrl}" class="s4e-thumb-img" alt="썸네일">`
          : `<div class="s4e-thumb-empty">🖼 썸네일 이미지 없음<br><small>STEP2 이미지 생성 후 표시</small></div>`}

        <!-- 텍스트 오버레이 -->
        ${th[_s4ThumbAlt]?.text ? `
          <div class="s4e-thumb-text
            ${th[_s4ThumbAlt].pos||'bottom'}
            ${th[_s4ThumbAlt].size||'lg'}"
            style="font-family:${font.css};
                   color:${th[_s4ThumbAlt].color||'#fff'};
                   ${th[_s4ThumbAlt].bg?'background:rgba(0,0,0,0.6);padding:6px 14px;border-radius:8px;':''}">
            ${th[_s4ThumbAlt].text}
          </div>` : ''}
      </div>

      <!-- 텍스트 입력 -->
      <div class="s4e-thumb-inputs">
        <input class="s4e-thumb-input"
          value="${th[_s4ThumbAlt]?.text||''}"
          placeholder="썸네일 텍스트 입력..."
          oninput="_s4Edit.thumb['${_s4ThumbAlt}'].text=this.value;_studioS4Edit('studioS4EditWrap')">

        <div class="s4e-thumb-controls">
          <div class="s4e-style-row">
            <span>크기</span>
            <div class="s4e-seg">
              ${[['md','보통'],['lg','크게'],['xl','최대']].map(([v,l])=>`
                <button class="s4e-seg-btn ${th[_s4ThumbAlt]?.size===v?'on':''}"
                  onclick="_s4Edit.thumb['${_s4ThumbAlt}'].size='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
              `).join('')}
            </div>
          </div>
          <div class="s4e-style-row">
            <span>위치</span>
            <div class="s4e-seg">
              ${[['top','상단'],['center','중앙'],['bottom','하단']].map(([v,l])=>`
                <button class="s4e-seg-btn ${th[_s4ThumbAlt]?.pos===v?'on':''}"
                  onclick="_s4Edit.thumb['${_s4ThumbAlt}'].pos='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
              `).join('')}
            </div>
          </div>
          <div class="s4e-style-row">
            <span>색상</span>
            <div class="s4e-seg">
              ${[['#ffffff','흰'],['#FFE033','노랑'],['#FF4444','빨강'],['#000000','검정']].map(([v,l])=>`
                <button class="s4e-seg-btn ${th[_s4ThumbAlt]?.color===v?'on':''}"
                  style="background:${v};color:${v==='#FFE033'||v==='#ffffff'?'#333':'#fff'}"
                  onclick="_s4Edit.thumb['${_s4ThumbAlt}'].color='${v}';_studioS4Edit('studioS4EditWrap')">${l}</button>
              `).join('')}
            </div>
          </div>
          <div class="s4e-style-row">
            <span>배경</span>
            <div class="s4e-seg">
              <button class="s4e-seg-btn ${th[_s4ThumbAlt]?.bg?'on':''}"
                onclick="_s4Edit.thumb['${_s4ThumbAlt}'].bg=true;_studioS4Edit('studioS4EditWrap')">반투명</button>
              <button class="s4e-seg-btn ${!th[_s4ThumbAlt]?.bg?'on':''}"
                onclick="_s4Edit.thumb['${_s4ThumbAlt}'].bg=false;_studioS4Edit('studioS4EditWrap')">없음</button>
            </div>
          </div>
        </div>
      </div>

      <!-- AI 제목 3안 자동 채우기 -->
      <button class="s4e-btn-outline" onclick="_s4eAutoThumbText(${JSON.stringify(proj).replace(/"/g,"'")})">
        ✨ AI 제목 3안 자동 입력
      </button>

      <!-- PNG 다운로드 -->
      <button class="s4e-btn-primary" onclick="_s4eDownloadThumb()">
        📥 PNG 다운로드
      </button>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   TAB 4 — 영상 구성
   ════════════════════════════════════════════════ */
function _s4eT4Compose() {
  const c = _s4Edit.compose;

  return `
  <div class="s4e-section">

    <!-- 템플릿 -->
    <div class="s4e-block">
      <div class="s4e-label">🎬 영상 템플릿</div>
      <div class="s4e-template-grid">
        ${S4_TEMPLATES.map(t=>`
          <button class="s4e-template-btn ${c.template===t.id?'on':''}"
            onclick="_s4Edit.compose.template='${t.id}';_studioS4Edit('studioS4EditWrap')">
            <div class="s4e-tpl-label">${t.label}</div>
            <div class="s4e-tpl-desc">${t.desc}</div>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- 전환 효과 -->
    <div class="s4e-block">
      <div class="s4e-label">✨ 씬 전환 효과</div>
      <div class="s4e-chip-row">
        ${S4_TRANSITIONS.map(t=>`
          <button class="s4e-chip ${c.transition===t.id?'on':''}"
            onclick="_s4Edit.compose.transition='${t.id}';">${t.label}</button>
        `).join('')}
      </div>
    </div>

    <!-- 이미지 모션 -->
    <div class="s4e-block">
      <div class="s4e-label">🎥 이미지 모션</div>
      <div class="s4e-chip-row">
        ${S4_MOTIONS.map(m=>`
          <button class="s4e-chip ${c.motion===m.id?'on':''}"
            onclick="_s4Edit.compose.motion='${m.id}';">${m.label}</button>
        `).join('')}
      </div>
    </div>

    <!-- 필터 -->
    <div class="s4e-block">
      <div class="s4e-label">🎨 필터 / 색보정</div>
      <div class="s4e-chip-row">
        ${S4_FILTERS.map(f=>`
          <button class="s4e-chip ${c.filter===f.id?'on':''}"
            onclick="_s4Edit.compose.filter='${f.id}';">${f.label}</button>
        `).join('')}
      </div>
    </div>

    <!-- 브랜딩 -->
    <div class="s4e-block">
      <div class="s4e-label">🏷 오프닝·클로징·브랜딩</div>
      <div class="s4e-brand-rows">
        <label class="s4e-auto-row">
          <input type="checkbox" ${c.openingAnim?'checked':''}
            onchange="_s4Edit.compose.openingAnim=this.checked">
          오프닝 애니메이션
        </label>
        <label class="s4e-auto-row">
          <input type="checkbox" ${c.closingAnim?'checked':''}
            onchange="_s4Edit.compose.closingAnim=this.checked">
          클로징 애니메이션 + CTA (구독·좋아요)
        </label>
        <label class="s4e-auto-row">
          <input type="checkbox" ${c.endCard?'checked':''}
            onchange="_s4Edit.compose.endCard=this.checked">
          엔딩 카드 (다음 영상 예고)
        </label>
      </div>
      <div class="s4e-brand-inputs">
        <div class="s4e-inp-row">
          <label>로고 URL</label>
          <input class="s4e-inp" value="${c.logoUrl||''}" placeholder="https://..."
            oninput="_s4Edit.compose.logoUrl=this.value">
        </div>
        <div class="s4e-inp-row">
          <label>워터마크</label>
          <input class="s4e-inp" value="${c.watermark||''}" placeholder="채널명 또는 @handle"
            oninput="_s4Edit.compose.watermark=this.value">
        </div>
        <div class="s4e-inp-row">
          <label>채널 컬러</label>
          <input type="color" value="${c.channelColor||'#ef6fab'}"
            oninput="_s4Edit.compose.channelColor=this.value">
        </div>
      </div>
    </div>

    <!-- 훅 자동 강화 -->
    <div class="s4e-block">
      <div class="s4e-label">⚡ 훅 자동 강화</div>
      <button class="s4e-btn-outline" onclick="_s4eHookBoost()">
        첫 씬 텍스트 크고 굵게 자동 적용 (3초 훅 최적화)
      </button>
    </div>
  </div>`;
}

/* ════════════════════════════════════════════════
   TAB 5 — BGM·음향 (설정값만 저장)
   ════════════════════════════════════════════════ */
function _s4eT5Audio() {
  const a = _s4Edit.audio;

  return `
  <div class="s4e-section">
    <div class="s4e-block">
      <div class="s4e-label">🎵 BGM 선택</div>
      <div class="s4e-bgm-list">
        ${S4_BGM_LIST.map(b=>`
          <label class="s4e-bgm-row ${a.bgm===b.id?'on':''}">
            <input type="radio" name="s4bgm" value="${b.id}"
              ${a.bgm===b.id?'checked':''}
              onchange="_s4Edit.audio.bgm='${b.id}'">
            <div>
              <div class="s4e-bgm-label">${b.label}</div>
              <div class="s4e-bgm-desc">${b.desc}</div>
            </div>
          </label>
        `).join('')}
      </div>
    </div>

    <div class="s4e-block">
      <div class="s4e-label">🔊 볼륨 설정</div>
      <div class="s4e-vol-rows">
        <div class="s4e-vol-row">
          <span>BGM 볼륨</span>
          <input type="range" min="0" max="100" value="${a.bgmVol}"
            oninput="_s4Edit.audio.bgmVol=this.value;
              document.getElementById('s4eBgmVol').textContent=this.value+'%'">
          <span id="s4eBgmVol">${a.bgmVol}%</span>
        </div>
        <div class="s4e-vol-row">
          <span>음성 볼륨</span>
          <input type="range" min="0" max="100" value="${a.voiceVol}"
            oninput="_s4Edit.audio.voiceVol=this.value;
              document.getElementById('s4eVoiceVol').textContent=this.value+'%'">
          <span id="s4eVoiceVol">${a.voiceVol}%</span>
        </div>
      </div>
    </div>

    <div class="s4e-block">
      <div class="s4e-label">🎚 효과음 스타일</div>
      <div class="s4e-seg">
        ${[['none','없음'],['calm','잔잔'],['impact','임팩트']].map(([v,l])=>`
          <button class="s4e-seg-btn ${a.sfx===v?'on':''}"
            onclick="_s4Edit.audio.sfx='${v}'">${l}</button>
        `).join('')}
      </div>
    </div>

    <div class="s4e-block">
      <div class="s4e-label">🔁 페이드 설정</div>
      <div class="s4e-auto-rows">
        <label class="s4e-auto-row">
          <input type="checkbox" ${a.fadeIn?'checked':''}
            onchange="_s4Edit.audio.fadeIn=this.checked">
          인트로 페이드 인
        </label>
        <label class="s4e-auto-row">
          <input type="checkbox" ${a.fadeOut?'checked':''}
            onchange="_s4Edit.audio.fadeOut=this.checked">
          아웃트로 페이드 아웃
        </label>
      </div>
    </div>

    <div class="s4e-audio-hint">
      💡 설정값은 <code>STUDIO.project.edit.audio</code>에 저장됩니다.<br>
      실제 오디오 믹싱은 렌더링 단계에서 Creatomate 또는 FFmpeg.wasm으로 처리됩니다.
    </div>
  </div>`;
}

/* ── 헬퍼 ── */
function _s4eDownloadThumb() {
  const canvas = document.createElement('canvas');
  canvas.width  = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  const th  = _s4Edit.thumb[_s4ThumbAlt];
  const font = S4_FONTS.find(f => f.id === _s4Edit.caption.fontId) || S4_FONTS[0];

  const proj   = (typeof STUDIO !== 'undefined' && STUDIO.project) || {};
  const imgs   = (proj.scenes || []).map(s => s.imageUrl || s.img).filter(Boolean);
  const imgUrl = proj.thumbUrl || imgs[0] || '';

  const draw = () => {
    if (th?.bg) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    }
    if (th?.text) {
      ctx.font = `bold ${th.size==='xl'?72:th.size==='lg'?56:40}px ${font.css}`;
      ctx.fillStyle = th.color || '#fff';
      ctx.textAlign = 'center';
      const y = th.pos==='top' ? 80 : th.pos==='center' ? canvas.height/2 : canvas.height - 40;
      ctx.fillText(th.text, canvas.width/2, y);
    }
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href    = url;
      a.download= `thumbnail_${_s4ThumbAlt}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  if (imgUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); draw(); };
    img.onerror = draw;
    img.src = imgUrl;
  } else {
    ctx.fillStyle = '#f1dce7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    draw();
  }
}

function _s4eAutoThumbText(proj) {
  const script = proj.scriptText || proj.script || '';
  const words  = script.slice(0, 100);
  _s4Edit.thumb.A.text = `이거 모르면 후회해요`;
  _s4Edit.thumb.B.text = words.slice(0, 20) + '...';
  _s4Edit.thumb.C.text = `${words.slice(0, 15)} 완벽 정리`;
  _studioS4Edit('studioS4EditWrap');
}

function _s4eHookBoost() {
  _s4Edit.caption.size = 'xl';
  _s4Edit.caption.position = 'center';
  _s4Edit.caption.color = '#FFE033';
  _s4Edit.caption.bg = true;
  _studioS4Edit('studioS4EditWrap');
  alert('⚡ 훅 강화 적용!\n첫 씬에 최대 크기·노란색·중앙 자막이 설정됐어요.');
}
