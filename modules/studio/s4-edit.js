/* ================================================
   s4-edit.js
   STEP5 edit / STEP6 subtitle+font
   modules/studio/ -- split_studio2.py
   ================================================ */

/* ═════════════ STEP 5 편집 ═════════════ */
function _studioS5(){
  const p = STUDIO.project.s5;
  return '<div class="studio-panel">' +
    '<h4>⑤ 영상 조립·편집</h4>' +
    '<label class="studio-label">영상 템플릿 (10종)</label>' +
    '<div class="studio-chips">' +
      STUDIO_TEMPLATES.map(t => '<button class="studio-chip' + (p.template===t?' on':'') + '" onclick="studioS5Temp(\'' + t + '\',this)">' + t + '</button>').join('') +
    '</div>' +
    '<label class="studio-label">씬 전환 효과 (복수 선택)</label>' +
    '<div class="studio-chips">' +
      STUDIO_TRANSITIONS.map(t => {
        const on = (p.transitions||[]).includes(t);
        return '<button class="studio-chip' + (on?' on':'') + '" onclick="studioS5Trans(\'' + t + '\',this)">' + t + '</button>';
      }).join('') +
    '</div>' +
    '<label class="studio-label">이미지 모션</label>' +
    '<div class="studio-chips">' +
      [['kenburns','켄번스'],['pan','패닝'],['shake','흔들림'],['zoom','줌인/아웃'],['none','없음']].map(([v,l]) =>
        '<button class="studio-chip' + (p.motion===v?' on':'') + '" onclick="studioS5Motion(\'' + v + '\',this)">' + l + '</button>'
      ).join('') +
    '</div>' +
    '<label class="studio-label">필터 / 색보정 (12종)</label>' +
    '<div class="studio-chips">' +
      STUDIO_FILTERS.map(f => '<button class="studio-chip' + (p.filter===f?' on':'') + '" onclick="studioS5Filter(\'' + f + '\',this)">' + f + '</button>').join('') +
    '</div>' +
    '<label class="studio-label">오프닝 · 클로징 · 브랜딩</label>' +
    '<div class="studio-row">' +
      '<div><label><input type="checkbox" ' + (p.opening?'checked':'') + ' onchange="STUDIO.project.s5.opening=this.checked;studioSave()"> 오프닝 애니메이션</label></div>' +
      '<div><label><input type="checkbox" ' + (p.closing?'checked':'') + ' onchange="STUDIO.project.s5.closing=this.checked;studioSave()"> 클로징 애니메이션</label></div>' +
      '<div><label>로고 URL</label><input class="studio-in" value="' + (p.branding.logo||'') + '" onchange="STUDIO.project.s5.branding.logo=this.value;studioSave()"></div>' +
      '<div><label>워터마크</label><input class="studio-in" value="' + (p.branding.watermark||'') + '" onchange="STUDIO.project.s5.branding.watermark=this.value;studioSave()"></div>' +
      '<div><label>채널 컬러</label><input type="color" class="studio-in" value="' + (p.branding.color||'#ef6fab') + '" onchange="STUDIO.project.s5.branding.color=this.value;studioSave()"></div>' +
    '</div>' +
    '<label class="studio-label">특수 효과</label>' +
    '<div class="studio-chips">' +
      [['particle','파티클'],['hand','손글씨'],['counter','숫자 카운터'],['glitch','글리치'],['light','빛번짐']].map(([v,l]) => {
        const on = (p.effects||[]).includes(v);
        return '<button class="studio-chip' + (on?' on':'') + '" onclick="studioS5Effect(\'' + v + '\',this)">' + l + '</button>';
      }).join('') +
    '</div>' +
    '<div class="studio-actions" style="justify-content:space-between">' +
      '<button class="studio-btn ghost" onclick="studioGoto(3)">← 이전</button>' +
      '<button class="studio-btn pri" onclick="studioGoto(5)">다음: 자막 →</button>' +
    '</div>' +
  '</div>';
}
function _studioBindS5(){}
function studioS5Temp(t, btn){ STUDIO.project.s5.template=t; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }
function studioS5Trans(t, btn){
  const arr = STUDIO.project.s5.transitions = STUDIO.project.s5.transitions || [];
  const i = arr.indexOf(t); if(i>=0) arr.splice(i,1); else arr.push(t);
  btn.classList.toggle('on'); studioSave();
}
function studioS5Motion(v, btn){ STUDIO.project.s5.motion=v; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }
function studioS5Filter(f, btn){ STUDIO.project.s5.filter=f; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }
function studioS5Effect(v, btn){
  const arr = STUDIO.project.s5.effects = STUDIO.project.s5.effects || [];
  const i = arr.indexOf(v); if(i>=0) arr.splice(i,1); else arr.push(v);
  btn.classList.toggle('on'); studioSave();
}

/* ═════════════ STEP 6 자막·폰트 ═════════════ */
function _studioS6(){
  const p = STUDIO.project.s6;
  const ch = STUDIO.project.channel;
  return '<div class="studio-panel">' +
    '<h4>⑥ 자막 · 폰트 · 애니메이션</h4>' +

    (ch!=='ja' ? '<label class="studio-label">🇰🇷 한국어 폰트 (12종)</label>' +
      '<div class="studio-chips">' +
        STUDIO_FONTS_KO.map(f => '<button class="studio-chip' + (p.fontKo===f?' on':'') + '" onclick="studioS6FontKo(\'' + f + '\',this)">' + f + '</button>').join('') +
      '</div>' : '') +

    (ch!=='ko' ? '<label class="studio-label">🇯🇵 일본어 폰트 (12종)</label>' +
      '<div class="studio-chips">' +
        STUDIO_FONTS_JA.map(f => '<button class="studio-chip' + (p.fontJa===f?' on':'') + '" onclick="studioS6FontJa(\'' + f + '\',this)">' + f + '</button>').join('') +
      '</div>' : '') +

    (ch!=='ko' ? '<div class="studio-panel" style="background:#f7f4ff;margin-top:10px">' +
      '<h4 style="margin:0 0 6px">🇯🇵 일본어 전용</h4>' +
      '<label><input type="checkbox" ' + (p.jpVertical?'checked':'') + ' onchange="STUDIO.project.s6.jpVertical=this.checked;studioSave()"> 縦書き (세로쓰기)</label><br>' +
      '<label><input type="checkbox" ' + (p.jpFurigana?'checked':'') + ' onchange="STUDIO.project.s6.jpFurigana=this.checked;studioSave()"> ふりがな 자동 추가</label><br>' +
      '<label><input type="checkbox" ' + (p.jpKeigo?'checked':'') + ' onchange="STUDIO.project.s6.jpKeigo=this.checked;studioSave()"> 敬語 변환</label>' +
    '</div>' : '') +

    '<label class="studio-label">자막 레이아웃 (6종)</label>' +
    '<div class="studio-chips">' +
      [['bottom','하단 기본'],['top','상단'],['center','중앙'],['left','좌측'],['right','우측'],['karaoke','가라오케']].map(([v,l]) =>
        '<button class="studio-chip' + (p.subtitleLayout===v?' on':'') + '" onclick="studioS6Layout(\'' + v + '\',this)">' + l + '</button>'
      ).join('') +
    '</div>' +

    '<label style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:13px;cursor:pointer"><input type="checkbox" ' + (p.keywordHighlight?'checked':'') + ' onchange="STUDIO.project.s6.keywordHighlight=this.checked;studioSave()"> 키워드 자동 강조</label>' +

    '<label class="studio-label">자막 애니메이션 (10종)</label>' +
    '<div class="studio-chips">' +
      ['popup','fade','slide','typewriter','bounce','zoom','flash','wipe','scale','glitch'].map(a =>
        '<button class="studio-chip' + (p.animation===a?' on':'') + '" onclick="studioS6Anim(\'' + a + '\',this)">' + a + '</button>'
      ).join('') +
    '</div>' +

    '<p class="sub" style="margin-top:8px">✅ 음성 타이밍 자동 동기화 · 대본 분석 기반</p>' +

    '<div class="studio-actions" style="justify-content:space-between">' +
      '<button class="studio-btn ghost" onclick="studioGoto(4)">← 이전</button>' +
      '<button class="studio-btn pri" onclick="studioGoto(6)">다음: 최종 검수 →</button>' +
    '</div>' +
  '</div>';
}
function _studioBindS6(){}
function studioS6FontKo(f, btn){ STUDIO.project.s6.fontKo=f; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }
function studioS6FontJa(f, btn){ STUDIO.project.s6.fontJa=f; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }
function studioS6Layout(v, btn){ STUDIO.project.s6.subtitleLayout=v; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }
function studioS6Anim(a, btn){ STUDIO.project.s6.animation=a; btn.parentElement.querySelectorAll('.studio-chip').forEach(x=>x.classList.remove('on')); btn.classList.add('on'); studioSave(); }


