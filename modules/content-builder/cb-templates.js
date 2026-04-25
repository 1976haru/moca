/* ================================================
   modules/content-builder/cb-templates.js
   콘텐츠 빌더 — 탭3 (템플릿 20개) + 탭4 (블록 구성 + 자동 배치)
   ================================================ */
(function(){
  'use strict';
  const esc = (window.cbEsc) || function(s){ return String(s||''); };

  /* ── 20개 템플릿 ── */
  const CB_TEMPLATES = [
    /* ✅ 풀 지원 (1~8) */
    { id:'detail-page',     ico:'🛒', label:'상세페이지',         desc:'제품/서비스 상세',    status:'full' },
    { id:'blog-image',      ico:'📝', label:'블로그 + 이미지',     desc:'네이버·티스토리·미디엄', status:'full' },
    { id:'card-news',       ico:'🃏', label:'카드뉴스',           desc:'인스타·페이스북',     status:'full' },
    { id:'newsletter',      ico:'📧', label:'뉴스레터',           desc:'이메일 구독자용',     status:'full' },
    { id:'sns-set',         ico:'📱', label:'SNS 홍보 세트',       desc:'IG·FB·카카오',       status:'full' },
    { id:'poster',          ico:'📰', label:'포스터/전단지',       desc:'인쇄용·PDF',         status:'full' },
    { id:'card-news-public',ico:'🏛', label:'공공기관 공지',       desc:'민원·고지문',         status:'full' },
    { id:'workbook',        ico:'📚', label:'교육자료/워크북',     desc:'학습·연습',          status:'full' },
    /* 🟡 기본 지원 (9~16) */
    { id:'landing',         ico:'🚀', label:'랜딩 소개형',         desc:'단일 페이지',         status:'basic' },
    { id:'product-intro',   ico:'📦', label:'제품 소개형',         desc:'스펙·사용법',         status:'basic' },
    { id:'compare-review',  ico:'⚖️', label:'비교/리뷰형',         desc:'A vs B',             status:'basic' },
    { id:'faq',             ico:'❓', label:'FAQ형',              desc:'질문·답변',           status:'basic' },
    { id:'multi-lang',      ico:'🌐', label:'다국어 콘텐츠',        desc:'한·일·영',           status:'basic' },
    { id:'music-intro',     ico:'🎵', label:'음악 소개 콘텐츠',     desc:'노래·가사·Suno',     status:'basic' },
    { id:'youtube-community',ico:'📺',label:'유튜브 커뮤니티 글',   desc:'커뮤니티 탭',         status:'basic' },
    { id:'public-faq',      ico:'🏛', label:'민원/FAQ 안내문',      desc:'공공 FAQ',           status:'basic' },
    /* 🚧 준비중 (17~20) */
    { id:'webtoon',         ico:'🎨', label:'웹툰 콘티',           desc:'4~6컷 콘티',         status:'wip' },
    { id:'ebook',           ico:'📖', label:'전자책 패키지',        desc:'EPUB 구조',          status:'wip' },
    { id:'lecture-ppt',     ico:'🎓', label:'강의자료 PPT',         desc:'슬라이드 패키지',     status:'wip' },
    { id:'collab-share',    ico:'🤝', label:'협업 공유 패키지',     desc:'팀 검토용',          status:'wip' },
  ];

  /* 기존 BLD_TYPES 매핑 (호환) */
  const TEMPLATE_MAP = {
    'blog-image':  'blog',
    'newsletter':  'newsletter',
    'sns-set':     'sns',
    'ebook':       'ebook',
    'landing':     'landing',
    'webtoon':     'webtoon',
  };

  /* 템플릿별 기본 블록 */
  const CB_DEFAULT_BLOCKS = {
    'detail-page': [
      { type:'title',    label:'제품 제목' },
      { type:'intro',    label:'한 줄 요약' },
      { type:'image',    label:'대표 이미지' },
      { type:'section',  label:'주요 특징' },
      { type:'section',  label:'사용법' },
      { type:'image',    label:'사용 장면' },
      { type:'section',  label:'스펙·재료' },
      { type:'cta',      label:'구매·문의 CTA' },
    ],
    'blog-image': [
      { type:'title',    label:'블로그 제목' },
      { type:'intro',    label:'도입부' },
      { type:'image',    label:'헤더 이미지' },
      { type:'section',  label:'본문 1' },
      { type:'image',    label:'본문 이미지' },
      { type:'section',  label:'본문 2' },
      { type:'cta',      label:'마무리 CTA' },
      { type:'hashtag',  label:'해시태그' },
    ],
    'card-news': [
      { type:'title',    label:'카드 1 — 표지' },
      { type:'section',  label:'카드 2 — 도입' },
      { type:'section',  label:'카드 3 — 핵심 1' },
      { type:'section',  label:'카드 4 — 핵심 2' },
      { type:'section',  label:'카드 5 — 핵심 3' },
      { type:'cta',      label:'카드 6 — 마무리·CTA' },
    ],
    'card-news-public': [
      { type:'title',    label:'카드 1 — 공지 제목' },
      { type:'section',  label:'카드 2 — 대상' },
      { type:'section',  label:'카드 3 — 일정' },
      { type:'section',  label:'카드 4 — 신청 방법' },
      { type:'section',  label:'카드 5 — 유의사항' },
      { type:'cta',      label:'카드 6 — 문의처' },
    ],
    'newsletter': [
      { type:'title',    label:'메일 제목' },
      { type:'intro',    label:'인사말' },
      { type:'section',  label:'주요 소식 1' },
      { type:'section',  label:'주요 소식 2' },
      { type:'cta',      label:'행동 유도 버튼' },
      { type:'section',  label:'마무리·서명' },
    ],
    'sns-set': [
      { type:'title',    label:'SNS 캡션' },
      { type:'image',    label:'대표 이미지' },
      { type:'hashtag',  label:'해시태그' },
      { type:'section',  label:'추가 멘트' },
    ],
    'poster': [
      { type:'title',    label:'포스터 헤드라인' },
      { type:'image',    label:'배경 이미지' },
      { type:'section',  label:'본문 메시지' },
      { type:'section',  label:'장소·시간' },
      { type:'cta',      label:'문의·QR' },
    ],
    'workbook': [
      { type:'title',    label:'워크북 제목' },
      { type:'intro',    label:'학습 목표' },
      { type:'section',  label:'개념 설명 1' },
      { type:'section',  label:'개념 설명 2' },
      { type:'section',  label:'연습 문제' },
      { type:'section',  label:'정답·해설' },
    ],
    'faq': [
      { type:'title',    label:'FAQ 주제' },
      { type:'section',  label:'Q1·A1' },
      { type:'section',  label:'Q2·A2' },
      { type:'section',  label:'Q3·A3' },
      { type:'cta',      label:'추가 문의 안내' },
    ],
    'public-faq': [
      { type:'title',    label:'민원 FAQ 제목' },
      { type:'section',  label:'Q1·A1' },
      { type:'section',  label:'Q2·A2' },
      { type:'section',  label:'Q3·A3' },
      { type:'section',  label:'관련 부서·연락처' },
    ],
    'youtube-community': [
      { type:'title',    label:'커뮤니티 헤드' },
      { type:'image',    label:'커뮤니티 이미지' },
      { type:'section',  label:'본문' },
      { type:'cta',      label:'반응 유도 (좋아요·댓글)' },
    ],
  };

  /* ════════════════════════════════════════════════
     탭3 — 템플릿 선택
     ════════════════════════════════════════════════ */
  window.cbRenderTab3 = function(p) {
    p = p || window.contentBuilderProject || {};
    const cur = (p.template && p.template.id) || '';

    return ''
      + '<section class="cb-section">'
      +   '<div class="cb-section-title">📄 3단계 — 템플릿 선택 (총 ' + CB_TEMPLATES.length + '개)</div>'
      +   '<div class="cb-template-grid">'
      +     CB_TEMPLATES.map(function(t){
            const isSel = cur === t.id;
            const tag = t.status === 'full' ? '✅ 풀 지원'
                      : t.status === 'basic' ? '🟡 기본 지원'
                      : '🚧 준비중';
            return ''
              + '<div class="cb-template-card ' + (isSel?'on':'') + ' cb-tpl-' + t.status + '"' +
                ' onclick="cbPickTemplate(\'' + t.id + '\')">'
              +   '<div class="cb-tpl-status">' + tag + '</div>'
              +   '<div class="cb-tpl-ico">' + t.ico + '</div>'
              +   '<div class="cb-tpl-label">' + esc(t.label) + '</div>'
              +   '<div class="cb-tpl-desc">' + esc(t.desc) + '</div>'
              + '</div>';
          }).join('')
      +   '</div>'
      +   '<div class="cb-actions">'
      +     '<button class="cb-btn-secondary" onclick="cbGotoTab(\'t2\')">← 이전</button>'
      +     '<button class="cb-btn-primary" onclick="cbGotoTab(\'t4\')">다음: 블록 구성 →</button>'
      +   '</div>'
      + '</section>';
  };

  /* ════════════════════════════════════════════════
     탭4 — 블록 구성
     ════════════════════════════════════════════════ */
  window.cbRenderTab4 = function(p) {
    p = p || window.contentBuilderProject || {};
    if (!p.template || !p.template.id) {
      return '<section class="cb-section"><div class="cb-empty">먼저 3단계에서 템플릿을 선택하세요.</div>'
        + '<div class="cb-actions"><button class="cb-btn-primary" onclick="cbGotoTab(\'t3\')">→ 템플릿 선택으로</button></div>'
        + '</section>';
    }
    /* 블록이 없으면 자동 배치 */
    if (!p.blocks || p.blocks.length === 0) {
      cbPopulateBlocksFromSource(p.template.id, p.sourceText, p.draft);
    }

    return ''
      + '<section class="cb-section">'
      +   '<div class="cb-section-title">🧱 4단계 — 블록 구성 (' + p.blocks.length + '개)</div>'
      +   '<div class="cb-blocks">'
      +     p.blocks.map(function(b, i){
            const slotChips = (b.slotIds||[]).map(function(sid){
              return '<span class="cb-slot-chip">🖼 ' + esc(sid) + '</span>';
            }).join('');
            return ''
              + '<div class="cb-block" data-bidx="' + i + '">'
              +   '<div class="cb-block-hd">'
              +     '<span class="cb-block-num">' + (i+1) + '</span>'
              +     '<span class="cb-block-type">' + _typeIco(b.type) + ' ' + esc(b.label||b.type) + '</span>'
              +     '<span class="cb-block-status cb-bstat-' + (b.status||'idle') + '">●</span>'
              +     '<span class="cb-block-actions">'
              +       '<button onclick="cbBlockMove(' + i + ',-1)" title="위로">▲</button>'
              +       '<button onclick="cbBlockMove(' + i + ',1)" title="아래로">▼</button>'
              +       '<button onclick="cbBlockDelete(' + i + ')" title="삭제">🗑</button>'
              +     '</span>'
              +   '</div>'
              +   '<textarea class="cb-block-body" rows="3" oninput="cbBlockEdit(' + i + ',this.value)">'
              +     esc(b.content || '')
              +   '</textarea>'
              +   (slotChips ? '<div class="cb-block-slots">' + slotChips + '</div>' : '')
              + '</div>';
          }).join('')
      +   '</div>'
      +   '<div class="cb-actions">'
      +     '<button class="cb-btn-secondary" onclick="cbBlockAdd()">+ 블록 추가</button>'
      +     '<button class="cb-btn-secondary" onclick="cbBlocksReset()">기본 블록 복원</button>'
      +     '<button class="cb-btn-primary"   onclick="cbGotoTab(\'t5\')">다음: 미디어 슬롯 →</button>'
      +   '</div>'
      + '</section>';
  };

  function _typeIco(t) {
    return ({ title:'📌', intro:'📝', section:'📄', image:'🖼', cta:'🎯', hashtag:'🏷' })[t] || '🧱';
  }

  /* ════════════════════════════════════════════════
     자동 블록 배치 (sourceText / draft → 블록)
     ════════════════════════════════════════════════ */
  function cbPopulateBlocksFromSource(templateId, sourceText, draft) {
    const p = window.contentBuilderProject;
    if (!p) return;
    p.template = p.template || { id: templateId, label: templateId };

    const baseDef = CB_DEFAULT_BLOCKS[templateId] || [
      { type:'title', label:'제목' },
      { type:'section', label:'본문' },
      { type:'cta', label:'CTA' },
    ];

    /* sourceText 분해 */
    const text = (sourceText || '').trim();
    const lines = text.split('\n').filter(function(l){ return l.trim(); });
    const firstLine = lines[0] || '';
    const paragraphs = text.split(/\n\n+/).map(function(s){ return s.trim(); }).filter(Boolean);

    /* draft 우선 → 빈 칸은 sourceText 로 보충 */
    draft = draft || {};
    const title    = draft.title   || firstLine.slice(0, 60);
    const summary  = draft.summary || (paragraphs[0] || '').slice(0, 200);
    const sections = (draft.sections && draft.sections.length) ? draft.sections : paragraphs.slice(1);
    const cta      = draft.cta     || '👉 더 알고 싶다면 댓글로 알려주세요!';
    const hashtags = (draft.hashtags && draft.hashtags.length) ? draft.hashtags : [];
    const imgPrompts = (draft.imagePrompts && draft.imagePrompts.length) ? draft.imagePrompts : [];
    const vidPrompts = (draft.videoPrompts && draft.videoPrompts.length) ? draft.videoPrompts : [];

    let imgIdx = 0, secIdx = 0;
    const blocks = baseDef.map(function(def, i){
      let content = '';
      if (def.type === 'title')    content = title;
      else if (def.type === 'intro') content = summary;
      else if (def.type === 'section') {
        content = sections[secIdx] || '';
        secIdx++;
      }
      else if (def.type === 'cta') content = cta;
      else if (def.type === 'hashtag') content = hashtags.length ? hashtags.map(function(h){ return '#'+h; }).join(' ') : '';
      else if (def.type === 'image') {
        content = imgPrompts[imgIdx] || '';
        imgIdx++;
      }
      return {
        id:      'b' + Date.now().toString(36) + '_' + i,
        type:    def.type,
        label:   def.label,
        content: content,
        status:  content ? 'filled' : 'idle',
        slotIds: def.type === 'image' ? ['img-' + (i+1)] : [],
      };
    });

    /* 미디어 슬롯도 함께 생성 */
    const slots = [];
    blocks.forEach(function(b, i){
      if (b.type === 'image') {
        slots.push({
          id:      'img-' + (i+1),
          blockId: b.id,
          type:    'image',
          mode:    'ai',  /* 'ai' | 'upload' | 'stock' | 'prompt-only' */
          prompt:  b.content || '',
          status:  b.content ? 'prompt-ready' : 'idle',
          asset:   null,
        });
      }
    });
    /* 영상 프롬프트가 있으면 영상 슬롯 추가 */
    vidPrompts.forEach(function(vp, i){
      slots.push({
        id:      'vid-' + (i+1),
        blockId: '',
        type:    'video',
        mode:    'invideo',
        prompt:  vp,
        status:  'prompt-ready',
        asset:   null,
      });
    });

    p.blocks = blocks;
    p.slots = slots;
    if (typeof window.cbSave === 'function') window.cbSave();
  }
  window.cbPopulateBlocksFromSource = cbPopulateBlocksFromSource;

  /* ── 블록 핸들러 ── */
  window.cbPickTemplate = function(id) {
    const t = CB_TEMPLATES.find(function(x){ return x.id === id; });
    if (!t) return;
    if (t.status === 'wip') {
      alert('이 템플릿은 준비중입니다. 다음 PR에서 활성화 예정.');
    }
    window.contentBuilderProject.template = { id: t.id, label: t.label };
    /* 템플릿 변경 시 블록 자동 재생성 */
    window.contentBuilderProject.blocks = [];
    window.contentBuilderProject.slots  = [];
    cbPopulateBlocksFromSource(t.id, window.contentBuilderProject.sourceText, window.contentBuilderProject.draft);
    window.cbSave && window.cbSave();
    window.cbGotoTab('t4');
  };
  window.cbBlockEdit = function(idx, val) {
    const p = window.contentBuilderProject;
    if (!p || !p.blocks[idx]) return;
    p.blocks[idx].content = val;
    p.blocks[idx].status  = val ? 'filled' : 'idle';
    window.cbSave && window.cbSave();
  };
  window.cbBlockAdd = function() {
    const p = window.contentBuilderProject;
    if (!p) return;
    p.blocks.push({
      id: 'b' + Date.now().toString(36),
      type: 'section', label: '추가 블록',
      content: '', status:'idle', slotIds:[],
    });
    window.cbSave && window.cbSave();
    window.cbGotoTab('t4');
  };
  window.cbBlockDelete = function(idx) {
    const p = window.contentBuilderProject;
    if (!p || !p.blocks[idx]) return;
    if (!confirm('이 블록을 삭제할까요?')) return;
    p.blocks.splice(idx, 1);
    window.cbSave && window.cbSave();
    window.cbGotoTab('t4');
  };
  window.cbBlockMove = function(idx, dir) {
    const p = window.contentBuilderProject;
    if (!p) return;
    const j = idx + dir;
    if (j < 0 || j >= p.blocks.length) return;
    const tmp = p.blocks[idx]; p.blocks[idx] = p.blocks[j]; p.blocks[j] = tmp;
    window.cbSave && window.cbSave();
    window.cbGotoTab('t4');
  };
  window.cbBlocksReset = function() {
    const p = window.contentBuilderProject;
    if (!p || !p.template) return;
    if (!confirm('현재 블록을 모두 삭제하고 기본 블록으로 복원할까요?')) return;
    p.blocks = []; p.slots = [];
    cbPopulateBlocksFromSource(p.template.id, p.sourceText, p.draft);
    window.cbGotoTab('t4');
  };

  /* 외부 노출 */
  window.cbCore = window.cbCore || {};
  window.cbCore.templates    = CB_TEMPLATES;
  window.cbCore.templateMap  = TEMPLATE_MAP;
  window.cbCore.defaultBlocks= CB_DEFAULT_BLOCKS;
})();
