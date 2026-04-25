/* ================================================
   modules/content-builder/cb-slots.js
   콘텐츠 빌더 — 탭5 (미디어 슬롯 채우기)
   * 실제 API 호출은 하지 않음. prompt 준비 / status:'ready' 처리까지만.
   ================================================ */
(function(){
  'use strict';
  const esc = (window.cbEsc) || function(s){ return String(s||''); };

  /* ── 슬롯 처리 방식 ── */
  const SLOT_MODES = {
    image: [
      { id:'ai',          label:'AI 이미지 생성', desc:'프롬프트 → 이미지' },
      { id:'prompt-only', label:'프롬프트만 추출', desc:'외부 도구용' },
      { id:'upload',      label:'직접 업로드',     desc:'파일 선택' },
      { id:'library',     label:'보관함에서 선택', desc:'기존 이미지' },
      { id:'stock',       label:'스톡 키워드',     desc:'Pixabay/Unsplash' },
      { id:'empty',       label:'비워두기',        desc:'나중에' },
    ],
    video: [
      { id:'invideo',     label:'InVideo 프롬프트',  desc:'외부 도구' },
      { id:'capcut',      label:'CapCut 편집 지시',  desc:'외부 도구' },
      { id:'prompt-only', label:'프롬프트만 추출',   desc:'외부 도구용' },
      { id:'upload',      label:'직접 업로드',       desc:'MP4 파일' },
      { id:'empty',       label:'비워두기',          desc:'나중에' },
    ],
    audio: [
      { id:'suno',        label:'Suno 음악 프롬프트', desc:'외부 도구' },
      { id:'tts',         label:'TTS 문장 준비',     desc:'음성 단계' },
      { id:'upload',      label:'직접 업로드',        desc:'MP3 파일' },
      { id:'empty',       label:'비워두기',           desc:'나중에' },
    ],
    icon:      [{ id:'pickset', label:'아이콘 세트 선택', desc:'lucide·heroicons' }, { id:'empty', label:'비워두기' }],
    thumbnail: [{ id:'ai', label:'AI 썸네일',  desc:'문구 + 배경' }, { id:'upload', label:'직접 업로드' }, { id:'empty', label:'비워두기' }],
    subtitle:  [{ id:'srt', label:'SRT 자동 생성', desc:'음성 단계 후' }, { id:'manual', label:'수동 입력' }, { id:'empty', label:'비워두기' }],
    chart:     [{ id:'data', label:'데이터 입력', desc:'테이블 → 차트' }, { id:'empty', label:'비워두기' }],
    table:     [{ id:'manual', label:'수동 입력' }, { id:'empty', label:'비워두기' }],
    button:    [{ id:'cta', label:'CTA 버튼' }, { id:'empty', label:'비워두기' }],
    qr:        [{ id:'auto', label:'URL → QR 자동', desc:'준비중' }, { id:'empty', label:'비워두기' }],
    document:  [{ id:'upload', label:'문서 첨부' }, { id:'empty', label:'비워두기' }],
  };

  /* ── 추천 처리 방식 (슬롯 type → 기본 mode) ── */
  function _defaultMode(type) {
    if (type === 'image')     return 'ai';
    if (type === 'video')     return 'invideo';
    if (type === 'audio')     return 'suno';
    if (type === 'thumbnail') return 'ai';
    if (type === 'subtitle')  return 'srt';
    return 'empty';
  }

  /* ── 슬롯 종류 → 추천 엔진 (group, taskType) 매핑 ── */
  const _SLOT_REC_MAP = {
    image:     { group:'image', taskType:'sceneBulk'      },
    thumbnail: { group:'image', taskType:'thumbnail'      },
    video:     { group:'video', taskType:'shortsAssembly' },
    audio:     { group:'voice', taskType:'seniorEmotionVoice' },
    music:     { group:'music', taskType:'songMaker'      },
  };

  /* 외부 호출용 후크 — cb-slots.js 의 슬롯 UI 가 추천을 표시할 때 사용
     window.cbSlotRecommend('image') → [{rank,providerId,label,reason,priceHint,scores,hasKey,...}, ...]
     아직 슬롯 UI 에 카드 그리드 통합 전이라 호출만 가능하도록 노출 (다음 PR 에서 UI 결합) */
  window.cbSlotRecommend = function(slotKind) {
    const m = _SLOT_REC_MAP[slotKind];
    if (!m || typeof window.getApiRecommendations !== 'function') return [];
    return window.getApiRecommendations(m.group, m.taskType);
  };
  window.cbSlotRecommendCardsHtml = function(slotKind) {
    const m = _SLOT_REC_MAP[slotKind];
    if (!m || typeof window.renderRecommendationCards !== 'function') return '';
    return window.renderRecommendationCards(m.group, m.taskType);
  };

  /* ════════════════════════════════════════════════
     탭5 — 미디어 슬롯
     ════════════════════════════════════════════════ */
  window.cbRenderTab5 = function(p) {
    p = p || window.contentBuilderProject || {};
    const slots = p.slots || [];

    if (slots.length === 0) {
      return ''
        + '<section class="cb-section">'
        +   '<div class="cb-section-title">🖼 5단계 — 미디어 슬롯</div>'
        +   '<div class="cb-empty">현재 템플릿에 미디어 슬롯이 없습니다. 블록 추가 후 이미지/영상 블록을 넣으면 슬롯이 생성됩니다.</div>'
        +   '<div class="cb-actions">'
        +     '<button class="cb-btn-secondary" onclick="cbGotoTab(\'t4\')">← 블록 구성으로</button>'
        +     '<button class="cb-btn-primary"   onclick="cbGotoTab(\'t6\')">다음: 스타일 →</button>'
        +     '<button class="cb-btn-secondary" onclick="cbAddSlotManual(\'image\')">+ 이미지 슬롯</button>'
        +     '<button class="cb-btn-secondary" onclick="cbAddSlotManual(\'video\')">+ 영상 슬롯</button>'
        +   '</div>'
        + '</section>';
    }

    return ''
      + '<section class="cb-section">'
      +   '<div class="cb-section-title">🖼 5단계 — 미디어 슬롯 채우기 (' + slots.length + '개)</div>'
      +   '<div class="cb-slot-list">'
      +     slots.map(function(s, i){ return _renderSlotCard(s, i); }).join('')
      +   '</div>'
      +   '<div class="cb-actions">'
      +     '<button class="cb-btn-secondary" onclick="cbGotoTab(\'t4\')">← 이전</button>'
      +     '<button class="cb-btn-secondary" onclick="cbAddSlotManual(\'image\')">+ 이미지 슬롯</button>'
      +     '<button class="cb-btn-secondary" onclick="cbAddSlotManual(\'video\')">+ 영상 슬롯</button>'
      +     '<button class="cb-btn-primary"   onclick="cbGotoTab(\'t6\')">다음: 스타일 →</button>'
      +   '</div>'
      + '</section>';
  };

  function _renderSlotCard(s, i) {
    const modes = SLOT_MODES[s.type] || SLOT_MODES.image;
    const blockLabel = _findBlockLabel(s.blockId);
    const memo = (s.aiMemo) || '';

    return ''
      + '<div class="cb-slot-card cb-slot-status-' + (s.status||'idle') + '">'
      +   '<div class="cb-slot-hd">'
      +     '<span class="cb-slot-tag">' + _typeLabel(s.type) + '</span>'
      +     '<span class="cb-slot-id">' + esc(s.id) + '</span>'
      +     (blockLabel ? '<span class="cb-slot-block">📦 ' + esc(blockLabel) + '</span>' : '')
      +     '<span class="cb-slot-status-text">' + _statusLabel(s.status) + '</span>'
      +   '</div>'
      +   '<div class="cb-slot-modes">'
      +     modes.map(function(m){
            return '<button type="button" class="cb-chip ' + (s.mode===m.id?'on':'') + '"' +
              ' onclick="cbSlotSetMode(' + i + ',\'' + m.id + '\')"' +
              ' title="' + esc(m.desc||'') + '">' + esc(m.label) + '</button>';
          }).join('')
      +   '</div>'
      +   _renderModeBody(s, i)
      +   (memo ? '<div class="cb-slot-memo">💡 AI 메모: ' + esc(memo) + '</div>' : '')
      + '</div>';
  }

  function _renderModeBody(s, i) {
    if (s.mode === 'upload') {
      return '<div class="cb-slot-body">'
        + '<input type="file" accept="' + (s.type==='video'?'video/*':s.type==='audio'?'audio/*':'image/*') + '"'
        + ' onchange="cbSlotUpload(' + i + ',this.files[0])">'
        + (s.asset ? '<div class="cb-slot-asset">✅ ' + esc(s.asset.name||'파일') + ' (' + Math.round((s.asset.size||0)/1024) + 'KB)</div>' : '')
        + '</div>';
    }
    if (s.mode === 'library' || s.mode === 'stock') {
      return '<div class="cb-slot-body">'
        + '<input type="text" class="cb-inp" placeholder="' + (s.mode==='library'?'보관함 검색어':'스톡 키워드 (예: cafe latte)') + '"'
        + ' value="' + esc(s.prompt||'') + '" oninput="cbSlotSetPrompt(' + i + ',this.value)">'
        + '<div class="cb-slot-hint">📌 실제 검색은 다음 PR에서 보관함/Pixabay 연동 예정</div>'
        + '</div>';
    }
    if (s.mode === 'empty') {
      return '<div class="cb-slot-body"><div class="cb-slot-hint">⏭ 이 슬롯은 비워두고 나중에 채웁니다.</div></div>';
    }
    /* ai / prompt-only / invideo / capcut / suno / tts 등 prompt 입력 */
    return '<div class="cb-slot-body">'
      + '<textarea class="cb-textarea" rows="2"'
      + ' placeholder="' + _promptPlaceholder(s) + '"'
      + ' oninput="cbSlotSetPrompt(' + i + ',this.value)">' + esc(s.prompt||'') + '</textarea>'
      + '<div class="cb-slot-actions">'
      +   '<button class="cb-btn-secondary" onclick="cbSlotMarkReady(' + i + ')">✓ 준비 완료로 표시</button>'
      +   '<button class="cb-btn-secondary" onclick="cbSlotCopyPrompt(' + i + ')">📋 프롬프트 복사</button>'
      + '</div>'
      + '</div>';
  }

  function _promptPlaceholder(s) {
    if (s.mode === 'ai')          return 'AI 이미지 프롬프트 (영어 권장)';
    if (s.mode === 'invideo')     return 'InVideo 영상 프롬프트';
    if (s.mode === 'capcut')      return 'CapCut 편집 지시 (예: 0~3초 줌인)';
    if (s.mode === 'suno')        return 'Suno 음악 프롬프트 (Style of Music)';
    if (s.mode === 'tts')         return 'TTS 문장 (1~2문장)';
    return '프롬프트 입력';
  }

  function _findBlockLabel(blockId) {
    const p = window.contentBuilderProject || {};
    const b = (p.blocks || []).find(function(x){ return x.id === blockId; });
    return b ? (b.label || b.type) : '';
  }
  function _typeLabel(t) {
    return ({ image:'🖼 이미지', video:'🎬 영상', audio:'🎵 오디오', icon:'⚡ 아이콘',
              thumbnail:'📌 썸네일', subtitle:'💬 자막', chart:'📊 차트',
              table:'🧮 표', button:'🔘 버튼', qr:'🔳 QR', document:'📄 문서' })[t] || t;
  }
  function _statusLabel(s) {
    return ({ idle:'대기', 'prompt-ready':'프롬프트 준비됨', ready:'완료', uploading:'업로드 중', failed:'실패' })[s] || s || '대기';
  }

  /* ── 핸들러 ── */
  window.cbSlotSetMode = function(i, mode) {
    const p = window.contentBuilderProject; if (!p || !p.slots[i]) return;
    p.slots[i].mode = mode;
    window.cbSave && window.cbSave();
    window.cbGotoTab('t5');
  };
  window.cbSlotSetPrompt = function(i, val) {
    const p = window.contentBuilderProject; if (!p || !p.slots[i]) return;
    p.slots[i].prompt = val;
    if (val) p.slots[i].status = 'prompt-ready';
    window.cbSave && window.cbSave();
  };
  window.cbSlotMarkReady = function(i) {
    const p = window.contentBuilderProject; if (!p || !p.slots[i]) return;
    p.slots[i].status = 'ready';
    window.cbSave && window.cbSave();
    window.cbGotoTab('t5');
  };
  window.cbSlotCopyPrompt = function(i) {
    const p = window.contentBuilderProject; if (!p || !p.slots[i]) return;
    const text = p.slots[i].prompt || '';
    if (!text) { alert('복사할 프롬프트가 없습니다.'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){ alert('📋 프롬프트가 복사됐습니다.'); });
    } else {
      const ta = document.createElement('textarea'); ta.value = text;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); alert('📋 복사됨'); } catch(_) { alert('복사 실패'); }
      document.body.removeChild(ta);
    }
  };
  window.cbSlotUpload = function(i, file) {
    const p = window.contentBuilderProject; if (!p || !p.slots[i] || !file) return;
    p.slots[i].asset  = { name: file.name, size: file.size, type: file.type };
    p.slots[i].status = 'ready';
    window.cbSave && window.cbSave();
    window.cbGotoTab('t5');
  };
  window.cbAddSlotManual = function(type) {
    const p = window.contentBuilderProject;
    if (!p) return;
    p.slots = p.slots || [];
    const id = type + '-' + (p.slots.filter(function(s){return s.type===type;}).length + 1);
    p.slots.push({
      id: id, blockId: '', type: type,
      mode: _defaultMode(type), prompt: '', status: 'idle', asset: null,
    });
    window.cbSave && window.cbSave();
    window.cbGotoTab('t5');
  };
})();
