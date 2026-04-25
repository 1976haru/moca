/* ================================================
   modules/content-builder/cb-output.js
   콘텐츠 빌더 — 탭6 (스타일) + 탭7 (미리보기·검수) + 탭8 (출력)
   ================================================ */
(function(){
  'use strict';
  const esc = (window.cbEsc) || function(s){ return String(s||''); };

  const CB_TONES = [
    { id:'casual',     label:'친근한 반말체' },
    { id:'formal',     label:'공식 존댓말' },
    { id:'emotional',  label:'감성 문체' },
    { id:'expert',     label:'전문가 문체' },
    { id:'senior',     label:'시니어 친화형' },
    { id:'young',      label:'젊은 세대형' },
    { id:'jp-soft',    label:'일본향 부드러운 문체' },
    { id:'public-kr',  label:'공공기관 공식 문체' },
  ];
  const CB_AUDIENCES = [
    { id:'general', label:'일반 소비자' },
    { id:'b2b',     label:'B2B 담당자' },
    { id:'senior',  label:'시니어' },
    { id:'10-20',   label:'10~20대' },
    { id:'family',  label:'부모/가족' },
    { id:'global',  label:'해외 고객' },
    { id:'civic',   label:'공공기관 민원인' },
    { id:'smb',     label:'소상공인 고객' },
  ];
  const CB_PLATFORMS = [
    { id:'naver',     label:'네이버 블로그' },
    { id:'instagram', label:'인스타그램' },
    { id:'kakao',     label:'카카오 채널' },
    { id:'gov',       label:'공공기관 홈페이지' },
    { id:'email',     label:'이메일 뉴스레터' },
    { id:'youtube-c', label:'유튜브 커뮤니티' },
    { id:'detail',    label:'상세페이지' },
    { id:'print',     label:'인쇄물' },
  ];
  const CB_IMG_STYLES = [
    { id:'photo',      label:'사실적 사진' },
    { id:'illust',     label:'일러스트' },
    { id:'minimal',    label:'미니멀' },
    { id:'film',       label:'감성 필름' },
    { id:'info',       label:'인포그래픽' },
    { id:'3d',         label:'3D 렌더링' },
    { id:'public',     label:'공공기관 안내형' },
    { id:'senior',     label:'시니어 친화형' },
  ];
  const CB_PRESETS = [
    { id:'smb-friendly',  label:'소상공인 친근형',  apply:{ tone:'casual',    audience:'smb',     platform:'instagram', imageStyle:'photo' } },
    { id:'gov-formal',    label:'공공기관 공식형',  apply:{ tone:'public-kr', audience:'civic',   platform:'gov',       imageStyle:'public' } },
    { id:'creator-emo',   label:'크리에이터 감성형',apply:{ tone:'emotional', audience:'10-20',   platform:'instagram', imageStyle:'film' } },
    { id:'senior-warm',   label:'시니어 친화형',    apply:{ tone:'senior',    audience:'senior',  platform:'kakao',     imageStyle:'senior' } },
    { id:'jp-soft',       label:'일본 감성형',      apply:{ tone:'jp-soft',   audience:'global',  platform:'instagram', imageStyle:'film' } },
    { id:'expert-trust',  label:'전문가 신뢰형',    apply:{ tone:'expert',    audience:'b2b',     platform:'naver',     imageStyle:'minimal' } },
  ];

  /* ════════════════════════════════════════════════
     탭6 — 스타일/브랜드
     ════════════════════════════════════════════════ */
  window.cbRenderTab6 = function(p) {
    p = p || window.contentBuilderProject || {};
    const s = p.style = p.style || {};

    function chips(label, options, key) {
      return ''
        + '<div class="cb-row">'
        +   '<label class="cb-label">' + esc(label) + '</label>'
        +   '<div class="cb-chips">'
        +     options.map(function(o){
              return '<button type="button" class="cb-chip ' + (s[key]===o.id?'on':'') + '"' +
                ' onclick="cbStyleSet(\'' + key + '\',\'' + o.id + '\')">' + esc(o.label) + '</button>';
            }).join('')
        +   '</div>'
        + '</div>';
    }

    return ''
      + '<section class="cb-section">'
      +   '<div class="cb-section-title">🎨 6단계 — 스타일 / 브랜드</div>'

      +   '<div class="cb-row">'
      +     '<label class="cb-label">⭐ 빠른 프리셋</label>'
      +     '<div class="cb-chips">'
      +       CB_PRESETS.map(function(pr){
              return '<button type="button" class="cb-chip cb-preset ' + (s.preset===pr.id?'on':'') + '"' +
                ' onclick="cbStyleApplyPreset(\'' + pr.id + '\')">' + esc(pr.label) + '</button>';
            }).join('')
      +     '</div>'
      +   '</div>'

      +   chips('문체', CB_TONES, 'tone')
      +   chips('대상 독자', CB_AUDIENCES, 'audience')
      +   chips('플랫폼', CB_PLATFORMS, 'platform')
      +   chips('이미지 스타일', CB_IMG_STYLES, 'imageStyle')

      +   '<div class="cb-row">'
      +     '<label class="cb-label">언어</label>'
      +     '<div class="cb-chips">'
      +       [['ko','🇰🇷 한국어'],['ja','🇯🇵 일본어'],['kojp','🇰🇷🇯🇵 한일']].map(function(o){
              return '<button type="button" class="cb-chip ' + (s.language===o[0]?'on':'') + '"' +
                ' onclick="cbStyleSet(\'language\',\'' + o[0] + '\')">' + o[1] + '</button>';
            }).join('')
      +     '</div>'
      +   '</div>'

      +   _renderBrandkitStatus(p)

      +   '<div class="cb-actions">'
      +     '<button class="cb-btn-secondary" onclick="cbGotoTab(\'t5\')">← 이전</button>'
      +     '<button class="cb-btn-primary"   onclick="cbGotoTab(\'t7\')">다음: 미리보기 →</button>'
      +   '</div>'
      + '</section>';
  };

  function _renderBrandkitStatus(p) {
    const hasFn = (typeof window.loadBrandkit === 'function');
    let kit = null;
    if (hasFn) { try { kit = window.loadBrandkit(); } catch(_) {} }
    if (!kit) {
      return '<div class="cb-info">🏷 브랜드킷이 없습니다. 기존 <code>loadBrandkit()</code> 함수가 있으면 자동 로드되며, 없으면 다음 PR에서 추가됩니다.</div>';
    }
    return '<div class="cb-info">✅ 브랜드킷 로드됨: ' + esc(kit.name || '기본 브랜드') +
           (kit.color ? ' · 색상 <span style="background:'+esc(kit.color)+';padding:1px 8px;border-radius:6px;color:#fff">'+esc(kit.color)+'</span>' : '') +
           '</div>';
  }

  /* ════════════════════════════════════════════════
     탭7 — 미리보기·품질검수
     ════════════════════════════════════════════════ */
  window.cbRenderTab7 = function(p) {
    p = p || window.contentBuilderProject || {};
    const q = (window.cbCalcQuality && window.cbCalcQuality(p)) || { score:0, items:{}, issues:[] };

    return ''
      + '<section class="cb-section">'
      +   '<div class="cb-section-title">👁 7단계 — 미리보기 · 품질검수</div>'

      +   '<div class="cb-quality-panel cb-q-' + _qClass(q.score) + '">'
      +     '<div class="cb-q-hd">종합 품질 <b>' + q.score + '</b> / 100</div>'
      +     '<div class="cb-q-bar"><div class="cb-q-fill" style="width:' + q.score + '%"></div></div>'
      +     '<div class="cb-q-items">'
      +       Object.keys(q.items).map(function(k){
              return '<div class="cb-q-item"><span>' + esc(_itemLabel(k)) + '</span><b>' + q.items[k] + '</b></div>';
            }).join('')
      +     '</div>'
      +     (q.issues.length ?
            '<div class="cb-q-issues">' +
              q.issues.map(function(it){ return '<div>⚠️ ' + esc(it) + '</div>'; }).join('') +
            '</div>' : '<div class="cb-q-ok">✅ 큰 문제는 보이지 않아요</div>')
      +     '<div class="cb-q-guide">'
      +       (q.score >= 80 ? '✅ 80점 이상 — 바로 사용 가능'
                : q.score >= 70 ? '🟡 70~79점 — 일부 수정 권장'
                : '🔴 69점 이하 — 보완 필요')
      +     '</div>'
      +   '</div>'

      +   '<div class="cb-row">'
      +     '<label class="cb-label">미리보기 모드</label>'
      +     '<div class="cb-chips">'
      +       [['mobile','📱 모바일'],['desktop','💻 데스크톱'],['email','📧 메일'],['sns','📱 SNS'],['cards','🃏 카드'],['print','🖨 인쇄']].map(function(o){
              const isOn = (p._previewMode||'mobile') === o[0];
              return '<button type="button" class="cb-chip ' + (isOn?'on':'') + '"' +
                ' onclick="cbSetPreviewMode(\'' + o[0] + '\')">' + o[1] + '</button>';
            }).join('')
      +     '</div>'
      +   '</div>'

      +   '<div class="cb-preview-frame cb-preview-' + (p._previewMode||'mobile') + '">'
      +     _renderPreview(p)
      +   '</div>'

      +   '<div class="cb-actions">'
      +     '<button class="cb-btn-secondary" onclick="cbGotoTab(\'t6\')">← 이전</button>'
      +     '<button class="cb-btn-primary"   onclick="cbGotoTab(\'t8\')">다음: 출력 →</button>'
      +   '</div>'
      + '</section>';
  };

  function _qClass(s) { return s>=80?'good':s>=70?'mid':'low'; }
  function _itemLabel(k) {
    return ({ title:'제목', body:'본문', platform:'플랫폼', tone:'문체', hashtags:'해시태그', slots:'미디어 슬롯', blocks:'블록' })[k] || k;
  }

  function _renderPreview(p) {
    const blocks = p.blocks || [];
    if (!blocks.length) return '<div class="cb-empty">미리볼 블록이 없어요. 4단계에서 블록을 만드세요.</div>';
    return blocks.map(function(b){
      if (b.type === 'title')   return '<h2 class="cbp-title">' + esc(b.content || b.label) + '</h2>';
      if (b.type === 'intro')   return '<p class="cbp-intro">' + esc(b.content) + '</p>';
      if (b.type === 'image')   return '<div class="cbp-image">🖼 ' + (b.content ? esc(b.content.slice(0,80)) : '이미지 슬롯 #' + (b.slotIds||[''])[0]) + '</div>';
      if (b.type === 'cta')     return '<div class="cbp-cta">🎯 ' + esc(b.content) + '</div>';
      if (b.type === 'hashtag') return '<div class="cbp-hash">' + esc(b.content) + '</div>';
      return '<p class="cbp-section">' + esc(b.content) + '</p>';
    }).join('');
  }

  /* ════════════════════════════════════════════════
     탭8 — 출력 / 패키지
     ════════════════════════════════════════════════ */
  window.cbRenderTab8 = function(p) {
    p = p || window.contentBuilderProject || {};

    return ''
      + '<section class="cb-section">'
      +   '<div class="cb-section-title">📦 8단계 — 출력 / 패키지</div>'

      +   '<div class="cb-export-grid">'
      +     _btn('📋 전체 복사',     'cbExportCopy(\'all\')',  'cb-export-btn')
      +     _btn('🌐 HTML 복사',     'cbExportCopy(\'html\')', 'cb-export-btn')
      +     _btn('📝 Markdown 복사', 'cbExportCopy(\'md\')',   'cb-export-btn')
      +     _btn('🎨 이미지 프롬프트 복사', 'cbExportCopy(\'imgPrompts\')', 'cb-export-btn')
      +     _btn('🎬 영상 프롬프트 복사',   'cbExportCopy(\'vidPrompts\')', 'cb-export-btn')
      +     _btn('📱 SNS 캡션 복사',  'cbExportCopy(\'sns\')',   'cb-export-btn')
      +     _btn('🏷 해시태그 복사',  'cbExportCopy(\'hash\')',  'cb-export-btn')
      +   '</div>'

      +   '<div class="cb-section-title" style="margin-top:14px">🔗 외부툴 핸드오프</div>'
      +   '<div class="cb-export-grid">'
      +     _btn('🎨 Canva용 문구',     'cbHandoff(\'canva\')',   'cb-export-btn')
      +     _btn('🎬 InVideo 프롬프트', 'cbHandoff(\'invideo\')', 'cb-export-btn')
      +     _btn('✂️ CapCut 편집 지시', 'cbHandoff(\'capcut\')',  'cb-export-btn')
      +     _btn('🎵 Suno 음악 프롬프트','cbHandoff(\'suno\')',   'cb-export-btn')
      +     _btn('🖼 이미지 생성 프롬프트','cbHandoff(\'image\')', 'cb-export-btn')
      +   '</div>'

      +   '<div class="cb-section-title" style="margin-top:14px">💾 보관 / 패키지</div>'
      +   '<div class="cb-export-grid">'
      +     _btn('💾 보관함에 저장', 'cbSaveToLibrary()',   'cb-export-btn')
      +     _btn('📥 JSON 다운로드', 'cbDownloadJSON()',    'cb-export-btn')
      +     '<button class="cb-export-btn cb-disabled" disabled title="다음 PR 예정">📦 ZIP 패키지 (준비중)</button>'
      +   '</div>'

      +   '<div class="cb-actions">'
      +     '<button class="cb-btn-secondary" onclick="cbGotoTab(\'t7\')">← 이전</button>'
      +     '<button class="cb-btn-primary"   onclick="cbResetProject()">+ 새 프로젝트 시작</button>'
      +   '</div>'
      + '</section>';
  };

  function _btn(label, onclick, cls) {
    return '<button class="' + cls + '" onclick="' + onclick + '">' + label + '</button>';
  }

  /* ── 핸들러 ── */
  window.cbStyleSet = function(key, val) {
    const p = window.contentBuilderProject;
    if (!p) return;
    p.style = p.style || {};
    p.style[key] = val;
    p.style.preset = '';  /* 수동 변경 시 프리셋 해제 */
    window.cbSave && window.cbSave();
    window.cbGotoTab('t6');
  };
  window.cbStyleApplyPreset = function(id) {
    const p = window.contentBuilderProject;
    const pr = CB_PRESETS.find(function(x){ return x.id === id; });
    if (!p || !pr) return;
    p.style = Object.assign({}, p.style || {}, pr.apply, { preset: id });
    window.cbSave && window.cbSave();
    window.cbGotoTab('t6');
  };
  window.cbSetPreviewMode = function(mode) {
    const p = window.contentBuilderProject; if (!p) return;
    p._previewMode = mode;
    window.cbSave && window.cbSave();
    window.cbGotoTab('t7');
  };

  /* ── 출력 핸들러 ── */
  function _composeAll(p) {
    const blocks = p.blocks || [];
    return blocks.map(function(b){
      if (b.type === 'image')   return '[이미지: ' + (b.content || '슬롯') + ']';
      if (b.type === 'hashtag') return b.content || '';
      return b.content || '';
    }).filter(Boolean).join('\n\n');
  }
  function _composeHtml(p) {
    const blocks = p.blocks || [];
    return '<article>' + blocks.map(function(b){
      if (b.type === 'title')   return '<h2>' + esc(b.content || b.label) + '</h2>';
      if (b.type === 'intro')   return '<p><em>' + esc(b.content) + '</em></p>';
      if (b.type === 'image')   return '<div class="image-slot">' + esc(b.content || '[이미지]') + '</div>';
      if (b.type === 'cta')     return '<p><strong>' + esc(b.content) + '</strong></p>';
      if (b.type === 'hashtag') return '<p>' + esc(b.content) + '</p>';
      return '<p>' + esc(b.content) + '</p>';
    }).join('') + '</article>';
  }
  function _composeMd(p) {
    const blocks = p.blocks || [];
    return blocks.map(function(b){
      if (b.type === 'title')   return '## ' + (b.content || b.label);
      if (b.type === 'image')   return '![이미지](' + (b.content || '슬롯') + ')';
      if (b.type === 'cta')     return '**' + (b.content || '') + '**';
      return b.content || '';
    }).filter(Boolean).join('\n\n');
  }

  window.cbExportCopy = function(kind) {
    const p = window.contentBuilderProject || {};
    let text = '';
    if (kind === 'all')  text = _composeAll(p);
    else if (kind === 'html') text = _composeHtml(p);
    else if (kind === 'md')   text = _composeMd(p);
    else if (kind === 'imgPrompts') text = (p.slots||[]).filter(function(s){return s.type==='image';}).map(function(s){return '- '+(s.prompt||'');}).join('\n');
    else if (kind === 'vidPrompts') text = (p.slots||[]).filter(function(s){return s.type==='video';}).map(function(s){return '- '+(s.prompt||'');}).join('\n');
    else if (kind === 'sns')  text = (p.blocks||[]).filter(function(b){return b.type==='intro'||b.type==='cta';}).map(function(b){return b.content;}).join('\n');
    else if (kind === 'hash') text = (p.blocks||[]).filter(function(b){return b.type==='hashtag';}).map(function(b){return b.content;}).join(' ');
    if (!text) { alert('복사할 내용이 없습니다.'); return; }
    _clipboard(text);
  };

  window.cbHandoff = function(tool) {
    const p = window.contentBuilderProject || {};
    const slots = p.slots || [];
    const headers = {
      canva:   '=== Canva 카드 헤드라인 ===',
      invideo: '=== InVideo 영상 프롬프트 ===',
      capcut:  '=== CapCut 편집 지시 ===',
      suno:    '=== Suno 음악 프롬프트 ===',
      image:   '=== 이미지 생성 프롬프트 ===',
    };
    let lines = [headers[tool] || '=== Handoff ===', ''];
    if (tool === 'canva') {
      lines.push((p.blocks||[]).filter(function(b){return b.type==='title';}).map(function(b){return '- '+b.content;}).join('\n'));
    } else if (tool === 'invideo' || tool === 'capcut') {
      lines.push(slots.filter(function(s){return s.type==='video';}).map(function(s){return '- '+(s.prompt||'');}).join('\n'));
    } else if (tool === 'suno') {
      lines.push(slots.filter(function(s){return s.type==='audio';}).map(function(s){return '- '+(s.prompt||'');}).join('\n'));
    } else if (tool === 'image') {
      lines.push(slots.filter(function(s){return s.type==='image';}).map(function(s){return '- '+(s.prompt||'');}).join('\n'));
    }
    _clipboard(lines.join('\n'));
  };

  window.cbSaveToLibrary = function() {
    const p = window.contentBuilderProject;
    if (!p) return;
    const key = 'moca_content_builder_library_v1';
    let lib = [];
    try { lib = JSON.parse(localStorage.getItem(key) || '[]'); } catch(_) {}
    lib.unshift({
      id: p.id, savedAt: Date.now(),
      title: p.sourceTitle || p.goal || '(제목 없음)',
      template: p.template?.label || '', recipe: p.recipe?.label || '',
      blocksCount: (p.blocks||[]).length,
    });
    localStorage.setItem(key, JSON.stringify(lib.slice(0, 50)));
    alert('💾 보관함에 저장됐습니다 (' + lib.length + '개)');
  };
  window.cbDownloadJSON = function() {
    const p = window.contentBuilderProject; if (!p) return;
    const blob = new Blob([JSON.stringify(p, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = (p.sourceTitle || 'content-builder') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  function _clipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){ alert('📋 복사됐습니다.'); }).catch(function(){ _fallback(text); });
    } else { _fallback(text); }
  }
  function _fallback(text) {
    const ta = document.createElement('textarea'); ta.value = text;
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); alert('📋 복사됨'); } catch(_) { alert('복사 실패'); }
    document.body.removeChild(ta);
  }
})();
