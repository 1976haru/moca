/* ================================================
   modules/content-builder/cb-recipes.js
   콘텐츠 빌더 — 탭1 (소스 가져오기) + 탭2 (AI 레시피 10개)
   ================================================ */
(function(){
  'use strict';
  const esc = (window.cbEsc) || function(s){ return String(s||''); };

  /* ── 레시피 10개 정의 ── */
  const CB_RECIPES = [
    { id:'shorts-package',  ico:'🎬', label:'숏츠/영상 콘텐츠 패키지',
      desc:'대본·씬 프롬프트·TTS·SRT·썸네일·해시태그',
      outputs:['숏츠 대본','씬별 이미지/영상 프롬프트','TTS 문장','자막 SRT','썸네일 문구','업로드 제목/해시태그'],
      slots:6, time:'15분', save:'70%' },
    { id:'profit-package',  ico:'💰', label:'수익형 콘텐츠 패키지',
      desc:'블로그·뉴스레터·상세페이지·SNS·CTA',
      outputs:['블로그 글 + 이미지','뉴스레터','상세페이지','SNS 카드뉴스','제휴/광고 CTA'],
      slots:5, time:'20분', save:'75%' },
    { id:'public-package',  ico:'🏛', label:'공공기관 안내 패키지',
      desc:'공지문·카드뉴스·포스터·FAQ',
      outputs:['공지문 요약','카드뉴스 6장','포스터/현수막','FAQ','민원 예상 답변'],
      slots:5, time:'18분', save:'70%' },
    { id:'smb-package',     ico:'🏪', label:'소상공인 홍보 패키지',
      desc:'상세페이지·메뉴판·SNS·포스터·리뷰 요청',
      outputs:['상세페이지','메뉴판/상품 소개','블로그 홍보글','인스타 카드뉴스','포스터','리뷰 요청 문구'],
      slots:6, time:'25분', save:'80%' },
    { id:'edu-package',     ico:'📚', label:'학습/교육 패키지',
      desc:'요약·카드뉴스·워크북·퀴즈·강의안',
      outputs:['학습 요약','카드뉴스','워크북','퀴즈','설명자료','강의안'],
      slots:6, time:'22분', save:'70%' },
    { id:'trans-package',   ico:'🌐', label:'번역/다국어 패키지',
      desc:'다국어 블로그·뉴스레터·카드뉴스·자막',
      outputs:['다국어 블로그','다국어 뉴스레터','다국어 카드뉴스','자막/스크립트'],
      slots:4, time:'15분', save:'60%' },
    { id:'psy-package',     ico:'🔮', label:'심리/운세/사주 패키지',
      desc:'카드뉴스·블로그·SNS·결과 해석지',
      outputs:['카드뉴스','블로그','SNS 콘텐츠','결과 해석지','공유용 이미지'],
      slots:5, time:'18분', save:'65%' },
    { id:'trend-package',   ico:'📈', label:'트렌드/벤치마킹 패키지',
      desc:'리포트·카드뉴스·비교표·체크리스트·기획안',
      outputs:['트렌드 리포트','카드뉴스','비교표','실행 체크리스트','유튜브 기획안'],
      slots:5, time:'20분', save:'75%' },
    { id:'music-package',   ico:'🎵', label:'음악/노래 콘텐츠 패키지',
      desc:'Suno 프롬프트·노래 소개·하이라이트·썸네일·카드뉴스',
      outputs:['Suno 복붙용 프롬프트','노래 소개 대본','숏츠 하이라이트','썸네일 문구','카드뉴스'],
      slots:5, time:'18분', save:'70%' },
    { id:'custom-package',  ico:'🎁', label:'커스텀 멀티패키지',
      desc:'원하는 결과물 직접 선택',
      outputs:['원하는 결과물 직접 선택'],
      slots:0, time:'?', save:'-' },
  ];

  /* 카테고리 → 추천 레시피 매핑 */
  const CB_CATEGORY_RECIPE_MAP = {
    profit:  ['profit-package',  'smb-package',     'shorts-package'],
    smb:     ['smb-package',     'profit-package',  'public-package'],
    public:  ['public-package',  'edu-package',     'profit-package'],
    edu:     ['edu-package',     'public-package',  'shorts-package'],
    trans:   ['trans-package',   'profit-package',  'edu-package'],
    psy:     ['psy-package',     'shorts-package',  'profit-package'],
    trend:   ['trend-package',   'profit-package',  'shorts-package'],
    script:  ['shorts-package',  'music-package',   'profit-package'],
    shorts:  ['shorts-package',  'music-package',   'profit-package'],
    music:   ['music-package',   'shorts-package',  'profit-package'],
    lyric:   ['music-package',   'shorts-package',  'profit-package'],
  };

  /* 키워드 → 레시피 라우팅 */
  const CB_KEYWORD_HINTS = [
    { rx:/카페|신메뉴|홍보|매장|상품/i,        rec:'smb-package' },
    { rx:/공지|지원사업|민원|공공|기관/i,       rec:'public-package' },
    { rx:/강의|학습|퀴즈|워크북|교육/i,         rec:'edu-package' },
    { rx:/노래|suno|엔카|트로트|음원/i,         rec:'music-package' },
    { rx:/숏츠|유튜브|쇼츠|shorts|tiktok/i,     rec:'shorts-package' },
    { rx:/번역|다국어|일본어|영어/i,            rec:'trans-package' },
    { rx:/사주|운세|심리|MBTI/i,                rec:'psy-package' },
    { rx:/트렌드|벤치마크|순위/i,               rec:'trend-package' },
  ];

  /* ── 빠른 재활용 모드 ── */
  const CB_QUICK_REUSE = [
    { id:'blog2card',    label:'블로그 글 → 카드뉴스',         template:'card-news' },
    { id:'blog2shorts',  label:'블로그 글 → 숏츠 대본',        template:'shorts-script' },
    { id:'notice2card',  label:'공지문 → 카드뉴스 6장',        template:'card-news-public' },
    { id:'news2sns',     label:'뉴스레터 → SNS 홍보 세트',     template:'sns-set' },
    { id:'detail2insta', label:'상세페이지 → 인스타 카드',     template:'card-news' },
    { id:'yt2blog',      label:'유튜브 대본 → 블로그',         template:'blog-image' },
  ];

  /* ════════════════════════════════════════════════
     탭1: 소스 가져오기
     ════════════════════════════════════════════════ */
  window.cbRenderTab1 = function(p) {
    p = p || window.contentBuilderProject || {};
    const recent = (window.cbCore && window.cbCore.cbListRecent && window.cbCore.cbListRecent()) || [];
    const draftPresent = !!(window.cbCore && window.cbCore.cbLoadDraft && window.cbCore.cbLoadDraft());

    return ''
      + '<section class="cb-section">'
      +   '<div class="cb-section-title">📥 1단계 — 어떤 콘텐츠를 만들고 싶나요?</div>'

      +   '<div class="cb-row">'
      +     '<label class="cb-label">목표 입력 (한 문장으로)</label>'
      +     '<textarea class="cb-textarea" id="cbGoal" rows="2"'
      +     ' placeholder="예) 신메뉴 딸기라떼를 블로그와 인스타에 올리고 싶어"'
      +     ' oninput="window.contentBuilderProject.goal=this.value;window.cbSave&&window.cbSave()">'
      +     esc(p.goal || '') + '</textarea>'
      +     '<div class="cb-goal-chips">'
      +       _goalSamples().map(function(g){
              return '<button type="button" class="cb-chip" onclick="cbSetGoal(\'' +
                g.replace(/\\/g,'\\\\').replace(/\'/g,"\\'") + '\')">' + esc(g) + '</button>';
            }).join('')
      +     '</div>'
      +   '</div>'

      +   '<div class="cb-row">'
      +     '<label class="cb-label">소스 텍스트 (직접 붙여넣기)</label>'
      +     '<textarea class="cb-textarea" id="cbSourceText" rows="6"'
      +     ' placeholder="다른 카테고리에서 만든 글·대본·기획서를 여기에 붙여넣으세요"'
      +     ' oninput="window.contentBuilderProject.sourceText=this.value;window.cbSave&&window.cbSave()">'
      +     esc(p.sourceText || '') + '</textarea>'
      +   '</div>'

      +   (draftPresent
            ? '<div class="cb-info">📂 다른 카테고리에서 보낸 소재가 있어 자동 적용됐어요. 다음 단계로 진행하세요.</div>'
            : '')

      +   '<div class="cb-actions">'
      +     '<button class="cb-btn-primary" onclick="cbGotoTab(\'t2\')">다음: AI 레시피 추천 →</button>'
      +     '<button class="cb-btn-secondary" onclick="cbResetProject()">새로 시작</button>'
      +   '</div>'
      + '</section>'

      + '<section class="cb-section">'
      +   '<div class="cb-section-title">⚡ 빠른 재활용 모드</div>'
      +   '<div class="cb-quick-grid">'
      +     CB_QUICK_REUSE.map(function(q){
            return '<button type="button" class="cb-quick-btn"' +
              ' onclick="cbStartQuickReuse(\'' + q.id + '\',\'' + q.template + '\')">' +
              esc(q.label) + '</button>';
          }).join('')
      +   '</div>'
      + '</section>'

      + '<section class="cb-section">'
      +   '<div class="cb-section-title">📂 최근 작업 ('
      +     recent.length + '건)'
      +     (recent.length ? ' <button class="cb-link-danger" onclick="cbDeleteAllRecent()">전체 삭제</button>' : '')
      +   '</div>'
      +   (recent.length === 0
            ? '<div class="cb-empty">아직 저장된 작업이 없어요</div>'
            : '<div class="cb-recent-list">'
              + recent.map(function(r){
                return '<div class="cb-recent-item">' +
                  '<div class="cb-recent-info" onclick="cbResumeProject(\'' + r.id + '\')">' +
                    '<div class="cb-recent-title">' + esc(r.title) + '</div>' +
                    '<div class="cb-recent-meta">' +
                      esc(r.template || r.recipe || '미지정') + ' · ' +
                      new Date(r.updatedAt || 0).toLocaleString('ko-KR') + ' · 블록 ' + (r.blocks||0) + '개' +
                    '</div>' +
                  '</div>' +
                  '<button class="cb-link-danger" onclick="cbDeleteRecent(\'' + r.id + '\')">🗑</button>' +
                '</div>';
              }).join('')
              + '</div>')
      + '</section>';
  };

  /* ════════════════════════════════════════════════
     탭2: AI 레시피 추천
     ════════════════════════════════════════════════ */
  window.cbRenderTab2 = function(p) {
    p = p || window.contentBuilderProject || {};
    const recommended = _recommend(p);

    return ''
      + '<section class="cb-section">'
      +   '<div class="cb-section-title">🍳 2단계 — 어떤 패키지로 만들까요? (10개 레시피)</div>'
      +   '<div class="cb-recipe-grid">'
      +     CB_RECIPES.map(function(r){
            const isRec = recommended.indexOf(r.id) >= 0;
            const isSel = p.recipe && p.recipe.id === r.id;
            return ''
              + '<div class="cb-recipe-card ' + (isSel?'on':'') + ' ' + (isRec?'rec':'') + '">'
              +   (isRec ? '<span class="cb-rec-badge">⭐ AI 추천</span>' : '')
              +   '<div class="cb-recipe-hd">'
              +     '<span class="cb-recipe-ico">' + r.ico + '</span>'
              +     '<span class="cb-recipe-label">' + esc(r.label) + '</span>'
              +   '</div>'
              +   '<div class="cb-recipe-desc">' + esc(r.desc) + '</div>'
              +   '<ul class="cb-recipe-outs">'
              +     r.outputs.slice(0,4).map(function(o){ return '<li>' + esc(o) + '</li>'; }).join('')
              +     (r.outputs.length > 4 ? '<li class="cb-more">+ ' + (r.outputs.length - 4) + '개</li>' : '')
              +   '</ul>'
              +   '<div class="cb-recipe-meta">'
              +     '<span>🖼 슬롯 ' + r.slots + '개</span>'
              +     '<span>⏱ ' + r.time + '</span>'
              +     '<span>💡 절감 ' + r.save + '</span>'
              +   '</div>'
              +   '<div class="cb-recipe-actions">'
              +     '<button class="cb-btn-primary" onclick="cbPickRecipe(\'' + r.id + '\')">'
              +       (isSel?'✅ 선택됨':'이 레시피로 시작') + '</button>'
              +     '<button class="cb-btn-secondary" onclick="cbPickRecipePartial(\'' + r.id + '\')">일부만 선택</button>'
              +   '</div>'
              + '</div>';
          }).join('')
      +   '</div>'
      +   '<div class="cb-actions">'
      +     '<button class="cb-btn-secondary" onclick="cbGotoTab(\'t1\')">← 이전</button>'
      +     '<button class="cb-btn-primary" onclick="cbGotoTab(\'t3\')">다음: 템플릿 선택 →</button>'
      +   '</div>'
      + '</section>';
  };

  function _recommend(p) {
    const out = [];
    const cat = (p.sourceCategory || '').toLowerCase();
    if (cat && CB_CATEGORY_RECIPE_MAP[cat]) {
      out.push.apply(out, CB_CATEGORY_RECIPE_MAP[cat]);
    }
    const goal = (p.goal || '') + ' ' + (p.sourceTitle || '');
    CB_KEYWORD_HINTS.forEach(function(h){
      if (h.rx.test(goal) && out.indexOf(h.rec) < 0) out.push(h.rec);
    });
    return out.slice(0, 3);
  }

  function _goalSamples() {
    return [
      '신메뉴 딸기라떼를 블로그와 인스타에 올리고 싶어',
      '청년 창업 지원사업 홍보 자료가 필요해',
      '60대 건강 정보를 카드뉴스와 뉴스레터로 만들고 싶어',
      '공공기관 안내문을 카드뉴스와 포스터로 바꾸고 싶어',
    ];
  }

  /* ── 핸들러 ── */
  window.cbSetGoal = function(text) {
    window.contentBuilderProject.goal = text;
    const el = document.getElementById('cbGoal'); if (el) el.value = text;
    window.cbSave && window.cbSave();
  };
  window.cbResetProject = function() {
    if (!confirm('현재 작업을 새로 시작할까요? (저장된 최근 작업은 유지됩니다)')) return;
    window.contentBuilderProject = window.cbNewProject();
    window.cbSave && window.cbSave();
    window.cbGotoTab('t1');
  };
  window.cbResumeProject = function(id) {
    const all = window.cbCore.cbListRecent();
    const found = all.find(function(x){ return x.id === id; });
    if (!found) return;
    /* 프로젝트 본체는 LS_PROJECT에 있으므로 직접 로드 시도 */
    const saved = window.cbCore.cbLoadProject(id);
    if (saved) {
      window.contentBuilderProject = saved;
      window.cbSave && window.cbSave();
      window.cbGotoTab(saved.currentTab || 't1');
    } else {
      alert('이 프로젝트의 상세 내용을 찾을 수 없습니다 (요약만 남아있음).');
    }
  };
  window.cbDeleteRecent = function(id) {
    if (!confirm('이 작업을 삭제할까요?')) return;
    window.cbCore.cbDeleteProject(id);
    window.cbGotoTab('t1');
  };
  window.cbDeleteAllRecent = function() {
    if (!confirm('모든 최근 작업을 삭제할까요?')) return;
    window.cbCore.cbDeleteAllRecent();
    window.cbGotoTab('t1');
  };
  window.cbPickRecipe = function(id) {
    const r = CB_RECIPES.find(function(x){ return x.id === id; });
    if (!r) return;
    window.contentBuilderProject.recipe = { id: r.id, label: r.label };
    window.cbSave && window.cbSave();
    window.cbGotoTab('t3');
  };
  window.cbPickRecipePartial = function(id) {
    const r = CB_RECIPES.find(function(x){ return x.id === id; });
    if (!r) return;
    window.contentBuilderProject.recipe = { id: r.id, label: r.label, partial: true };
    window.cbSave && window.cbSave();
    alert('이 레시피의 결과물 일부만 선택할 수 있습니다 — 다음 PR에서 세부 선택 UI 추가 예정.');
    window.cbGotoTab('t3');
  };
  window.cbStartQuickReuse = function(quickId, templateId) {
    const p = window.contentBuilderProject;
    if (!p) return;
    p.recipe = { id: 'quick-' + quickId, label: '빠른 재활용 — ' + quickId, partial: true };
    p.template = { id: templateId, label: templateId };
    window.cbSave && window.cbSave();
    window.cbGotoTab('t4');
  };

  /* 외부 노출 */
  window.cbCore = window.cbCore || {};
  window.cbCore.recipes  = CB_RECIPES;
  window.cbCore.categoryMap = CB_CATEGORY_RECIPE_MAP;
})();
