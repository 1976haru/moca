/* ==================================================
   shorts-analytics.js
   Shorts analytics -- video/channel performance + AI pattern + strategy
   extracted from index.html by split_index.py
   ================================================== */

function anTabSet(t){ shState.data._anTab = t; renderStepContent(); }

function renderAnalyticsStep(){
  window._shInit = null;
  const tab = anTabGet();
  const tabsHtml =
    '<div class="sh-card-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px">' +
      ['video','channel','strategy'].map(t => {
        const lbl = {video:'📹 영상별 성과', channel:'📊 채널 종합', strategy:'🎯 다음 전략'}[t];
        return '<button class="' + (tab===t?'on':'') + '" style="' + (tab===t?'background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border-color:transparent':'') + '" onclick="anTabSet(\'' + t + '\')">' + lbl + '</button>';
      }).join('') +
    '</div>';
  const body = ({ video:_anT1Video, channel:_anT2Channel, strategy:_anT3Strategy }[tab] || _anT1Video)();
  return '<div class="sh-panel"><h4>📊 STEP 9 · 수익화 분석</h4><p class="muted" style="margin:0 0 12px">업로드한 영상의 성과 분석 · AI 기반 개선 제안</p>' + tabsHtml + body + _anFeedbackLoop() + '</div>';
}

function _anT1Video(){
  const list = JSON.parse(localStorage.getItem('sh_uploaded_list')||'[]');
  if(!list.length){
    return '<div style="padding:30px 20px;text-align:center;color:var(--sub);background:#fff;border-radius:12px">' +
      '<div style="font-size:32px">📹</div><p>아직 업로드한 영상이 없어요</p>' +
      '<button class="mz-btn pri" style="margin-top:8px" onclick="shState.step=8;renderStepper();renderStepContent()">Step8 에서 업로드하기</button>' +
    '</div>';
  }
  return list.map(v => {
    const data = JSON.parse(localStorage.getItem('sh_analytics_data')||'{}')[v.id] || {};
    const days = Math.floor((Date.now() - v.id) / (86400000)) + '일 전';
    return '<div style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:10px">' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
        '<b style="font-size:14px">' + (v.topic || v.titles?.kr || '(제목없음)') + '</b>' +
        '<span class="muted" style="font-size:11.5px">' + (v.platforms||[]).map(p => ({yt_kr:'🇰🇷',yt_jp:'🇯🇵',ig:'📸',tt:'🎵',nv:'📝'}[p])).filter(Boolean).join(' ') + ' · ' + days + ' 업로드</span>' +
        '<button class="mz-btn ghost" style="padding:5px 10px;font-size:11px;margin-left:auto" onclick="anToggleForm(' + v.id + ')">성과 입력하기 ▾</button>' +
      '</div>' +
      '<div id="an-form-' + v.id + '" style="display:none;margin-top:10px">' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px">' +
          '<div><label style="font-size:11px">조회수</label><input class="mz-in" type="number" id="an-' + v.id + '-views" value="' + (data.views||'') + '"></div>' +
          '<div><label style="font-size:11px">좋아요</label><input class="mz-in" type="number" id="an-' + v.id + '-likes" value="' + (data.likes||'') + '"></div>' +
          '<div><label style="font-size:11px">댓글</label><input class="mz-in" type="number" id="an-' + v.id + '-comments" value="' + (data.comments||'') + '"></div>' +
          '<div><label style="font-size:11px">CTR %</label><input class="mz-in" type="number" step="0.1" id="an-' + v.id + '-ctr" value="' + (data.ctr||'') + '"></div>' +
          '<div><label style="font-size:11px">평균 시청(초)</label><input class="mz-in" type="number" id="an-' + v.id + '-avgwatch" value="' + (data.avgwatch||'') + '"></div>' +
          '<div><label style="font-size:11px">총길이(초)</label><input class="mz-in" type="number" id="an-' + v.id + '-totalsec" value="' + (data.totalsec||60) + '"></div>' +
          '<div><label style="font-size:11px">구독자 변화</label><input class="mz-in" type="number" id="an-' + v.id + '-subs" value="' + (data.subs||'') + '"></div>' +
          '<div><label style="font-size:11px">수익 (₩)</label><input class="mz-in" type="number" id="an-' + v.id + '-revenue" value="' + (data.revenue||'') + '"></div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;margin-top:8px">' +
          '<button class="mz-btn" onclick="anSavePerf(' + v.id + ')">💾 저장</button>' +
          '<button class="mz-btn pri" onclick="anAnalyzeVideo(' + v.id + ')">🤖 AI 분석 요청</button>' +
        '</div>' +
        '<div id="an-result-' + v.id + '" style="margin-top:10px">' + (data.aiResult ? _anRenderScore(data) : '') + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}
function anToggleForm(id){ const f = document.getElementById('an-form-'+id); if(f) f.style.display = f.style.display==='none' ? 'block' : 'none'; }
function anSavePerf(id){
  const fields = ['views','likes','comments','ctr','avgwatch','totalsec','subs','revenue'];
  const data = JSON.parse(localStorage.getItem('sh_analytics_data')||'{}');
  data[id] = data[id] || {};
  fields.forEach(f => { const el = document.getElementById('an-'+id+'-'+f); if(el) data[id][f] = parseFloat(el.value) || 0; });
  localStorage.setItem('sh_analytics_data', JSON.stringify(data));
  window.mocaToast && window.mocaToast('💾 성과 저장', 'ok');
}
async function anAnalyzeVideo(id){
  anSavePerf(id);
  const data = JSON.parse(localStorage.getItem('sh_analytics_data')||'{}')[id] || {};
  const out = document.getElementById('an-result-'+id);
  out.innerHTML = '<p class="muted">⏳ AI 분석 중...</p>';
  try{
    await _syncAPIShorts();
    const sys = '유튜브 숏츠 성과 분석가. 아래 수치를 분석해 JSON만 출력:\n' +
      '{"totalScore":0~100, "scores":{"ctr":0~100,"completion":0~100,"like":0~100,"comment":0~100,"sub":0~100,"revenue":0~100}, ' +
      '"comments":{"ctr":"한줄 평가","completion":"...","like":"...","comment":"...","sub":"...","revenue":"..."}, ' +
      '"strong":["잘한 점 2~3개"], "weak":["개선점 2~3개"], "monetize":"수익 올리는 방법 2줄"}';
    const user = JSON.stringify(data) + '\n주제: ' + (shState.data.topic||'');
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens:1500 });
    const m = res.match(/\{[\s\S]*\}/); if(!m) throw new Error('파싱 실패');
    const obj = JSON.parse(m[0]);
    const all = JSON.parse(localStorage.getItem('sh_analytics_data')||'{}');
    all[id] = Object.assign(all[id]||{}, data, { aiResult: obj });
    localStorage.setItem('sh_analytics_data', JSON.stringify(all));
    out.innerHTML = _anRenderScore(all[id]);
  }catch(e){ out.innerHTML = '<p style="color:var(--err)">❌ ' + e.message + '</p>'; }
}
function _anRenderScore(data){
  if(!data.aiResult) return '';
  const r = data.aiResult;
  const items = [['ctr','CTR'],['completion','시청완료율'],['like','좋아요율'],['comment','댓글률'],['sub','구독전환율'],['revenue','수익효율']];
  const scoreColor = r.totalScore >= 80 ? '🟢' : r.totalScore >= 60 ? '🟡' : '🔴';
  const bar = (pct) => { pct = Math.max(0, Math.min(100, pct)); const filled = Math.round(pct/10); return '█'.repeat(filled) + '░'.repeat(10-filled); };
  return '<div style="background:#fff5fa;padding:12px;border-radius:10px;font-size:12.5px">' +
    '<div style="font-weight:900;margin-bottom:8px">종합 점수: <b style="font-size:18px">' + r.totalScore + '점</b> ' + scoreColor + '</div>' +
    '<div style="font-family:monospace;line-height:1.7">' +
      items.map(([k,l]) => {
        const s = r.scores?.[k] || 0;
        const c = r.comments?.[k] || '';
        return l.padEnd(7) + ' ' + bar(s) + ' <b>' + s + '점</b> → ' + c;
      }).join('<br>') +
    '</div>' +
    (r.strong ? '<div style="margin-top:10px"><b>✅ 잘한 것:</b><br>' + r.strong.map(x => '• ' + x).join('<br>') + '</div>' : '') +
    (r.weak ? '<div style="margin-top:8px"><b>💡 개선 제안:</b><br>' + r.weak.map(x => '⚠️ ' + x).join('<br>') + '</div>' : '') +
    (r.monetize ? '<div style="margin-top:8px;padding:8px;background:#fff;border-radius:6px"><b>💰 수익 올리기:</b><br>' + r.monetize + '<br><button class="mz-btn ghost" style="margin-top:4px;padding:4px 8px;font-size:10px" onclick="shState.step=3;renderStepper();renderStepContent()">🎬 롱폼 버전 만들기</button></div>' : '') +
  '</div>';
}

/* ───── TAB 2: 채널 종합 ───── */
function _anT2Channel(){
  const list = JSON.parse(localStorage.getItem('sh_uploaded_list')||'[]');
  const perf = JSON.parse(localStorage.getItem('sh_analytics_data')||'{}');
  const stats = JSON.parse(localStorage.getItem('sh_channel_stats')||'{"kr":{},"jp":{}}');

  const grouped = { kr:[], jp:[] };
  list.forEach(v => {
    if(v.platforms.includes('yt_kr')) grouped.kr.push(v);
    if(v.platforms.includes('yt_jp')) grouped.jp.push(v);
  });
  const agg = (arr) => {
    const valid = arr.map(v => perf[v.id]).filter(d => d && d.views);
    if(!valid.length) return { count:arr.length, views:0, ctr:0, comp:0, like:0, rev:0, subs:0 };
    const sum = k => valid.reduce((a,d) => a + (parseFloat(d[k])||0), 0);
    const avg = k => sum(k) / valid.length;
    return {
      count: arr.length,
      views: Math.round(avg('views')),
      ctr: (avg('ctr')||0).toFixed(1),
      comp: Math.round(valid.map(d => (d.avgwatch||0)/(d.totalsec||60)*100).reduce((a,b)=>a+b,0) / valid.length),
      like: (valid.map(d => (d.likes||0)/(d.views||1)*100).reduce((a,b)=>a+b,0) / valid.length).toFixed(1),
      rev: Math.round(sum('revenue')),
      subs: Math.round(sum('subs'))
    };
  };
  const kr = agg(grouped.kr), jp = agg(grouped.jp);

  return '<div style="display:flex;gap:4px;margin-bottom:10px">' +
    ['7','30','90','all'].map(d => '<button class="mz-btn ghost" style="padding:5px 10px;font-size:11px">' + (d==='all'?'전체':d+'일') + '</button>').join('') +
  '</div>' +
  '<div style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;font-family:monospace;font-size:12.5px;overflow-x:auto">' +
    '<table style="width:100%;border-collapse:collapse">' +
      '<tr style="border-bottom:1px solid var(--line)"><th style="text-align:left;padding:6px">항목</th><th style="padding:6px">🇰🇷 한국</th><th style="padding:6px">🇯🇵 일본</th></tr>' +
      [['업로드 영상', kr.count+'편', jp.count+'편'],
       ['평균 조회수', kr.views.toLocaleString(), jp.views.toLocaleString()],
       ['평균 CTR', kr.ctr+'%', jp.ctr+'%'],
       ['평균 시청완료율', kr.comp+'%', jp.comp+'%'],
       ['평균 좋아요율', kr.like+'%', jp.like+'%'],
       ['총 수익', '₩'+kr.rev.toLocaleString(), '¥'+jp.rev.toLocaleString()],
       ['구독자 증가', '+'+kr.subs+'명', '+'+jp.subs+'人']
      ].map(r => '<tr><td style="padding:6px;font-weight:800">' + r[0] + '</td><td style="text-align:center;padding:6px">' + r[1] + '</td><td style="text-align:center;padding:6px">' + r[2] + '</td></tr>').join('') +
    '</table>' +
  '</div>' +

  _anRecentTrendChart(grouped.kr.slice(0,5), perf, '🇰🇷') +

  '<div style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:10px">' +
    '<h5 style="margin:0 0 6px">✅ 잘 된 영상 공통점 · ⚠️ 안 된 공통점</h5>' +
    '<button class="mz-btn pri" onclick="anAiPattern()">🤖 AI 패턴 분석</button>' +
    '<div id="an-pattern-out" style="margin-top:8px;font-size:12.5px"></div>' +
  '</div>' +

  '<div style="background:#f0fbf5;border:1px solid #9ed99c;border-radius:12px;padding:12px;margin-top:10px">' +
    '<h5 style="margin:0 0 6px">💰 유튜브 파트너 프로그램 조건</h5>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">' +
      _anYppBlock('🇰🇷', stats.kr, 'kr') + _anYppBlock('🇯🇵', stats.jp, 'jp') +
    '</div>' +
  '</div>' +

  '<div style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:10px">' +
    '<h5 style="margin:0 0 8px">💵 월별 수익 추이 (수동 입력)</h5>' +
    '<div id="an-monthly" style="font-family:monospace;font-size:12.5px">' + _anMonthlyChart(stats) + '</div>' +
    '<button class="mz-btn ghost" style="padding:5px 10px;font-size:11px;margin-top:6px" onclick="anEditMonthly()">✏️ 월별 수익 입력</button>' +
  '</div>';
}

function _anRecentTrendChart(videos, perf, flag){
  if(!videos.length) return '';
  const max = Math.max(...videos.map(v => perf[v.id]?.views||0)) || 1;
  return '<div style="background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:10px;font-family:monospace;font-size:12.5px">' +
    '<b>' + flag + ' 최근 5편 조회수 추이</b><br>' +
    videos.map((v,i) => {
      const views = perf[v.id]?.views||0;
      const filled = Math.round((views/max)*10);
      const isMax = views === max && views > 0;
      return '영상' + (i+1) + '  ' + '█'.repeat(filled) + '░'.repeat(10-filled) + '  ' + views.toLocaleString() + (isMax?' ← 최고':'');
    }).join('<br>') +
  '</div>';
}

function _anYppBlock(flag, s, k){
  s = s || {};
  const subsPct = Math.min(100, Math.round((s.subs||0)/10));
  const hrsPct = Math.min(100, Math.round((s.hours||0)/40));
  return '<div>' +
    '<b>' + flag + '</b><br>' +
    '구독자 <input class="mz-in" type="number" value="' + (s.subs||0) + '" style="width:80px;padding:4px;font-size:11px" onchange="anSaveStats(\'' + k + '\',\'subs\',this.value)"> / 1,000명 ' + '█'.repeat(Math.round(subsPct/10)) + '░'.repeat(10-Math.round(subsPct/10)) + ' ' + subsPct + '%<br>' +
    '시청시간 <input class="mz-in" type="number" value="' + (s.hours||0) + '" style="width:80px;padding:4px;font-size:11px" onchange="anSaveStats(\'' + k + '\',\'hours\',this.value)"> / 4,000h ' + '█'.repeat(Math.round(hrsPct/10)) + '░'.repeat(10-Math.round(hrsPct/10)) + ' ' + hrsPct + '%' +
  '</div>';
}

function anSaveStats(k, field, v){
  const s = JSON.parse(localStorage.getItem('sh_channel_stats')||'{"kr":{},"jp":{}}');
  s[k] = s[k] || {}; s[k][field] = parseFloat(v) || 0;
  localStorage.setItem('sh_channel_stats', JSON.stringify(s));
}

function _anMonthlyChart(stats){
  const m = stats.monthly || {};
  const keys = Object.keys(m).sort().reverse().slice(0, 5);
  if(!keys.length) return '(월별 수익 데이터 없음)';
  return keys.map(k => {
    const v = m[k];
    return k.padEnd(10) + ' ₩' + (v.krw||0).toLocaleString().padStart(8) + ' + ¥' + (v.jpy||0).toLocaleString();
  }).join('<br>') +
  (keys.length >= 2 ? '<br><br>추세: 📈 성장 중' : '');
}

function anEditMonthly(){
  const ym = prompt('년월 (예: 2026-04):');
  if(!ym) return;
  const krw = parseInt(prompt('₩ 수익:')||'0', 10);
  const jpy = parseInt(prompt('¥ 수익:')||'0', 10);
  const s = JSON.parse(localStorage.getItem('sh_channel_stats')||'{"kr":{},"jp":{}}');
  s.monthly = s.monthly || {};
  s.monthly[ym] = { krw, jpy };
  localStorage.setItem('sh_channel_stats', JSON.stringify(s));
  renderStepContent();
}

async function anAiPattern(){
  const list = JSON.parse(localStorage.getItem('sh_uploaded_list')||'[]');
  const perf = JSON.parse(localStorage.getItem('sh_analytics_data')||'{}');
  const out = document.getElementById('an-pattern-out');
  if(list.length < 3){ out.innerHTML = '<span class="muted">최소 3편 이상 업로드 후 사용 가능</span>'; return; }
  out.innerHTML = '⏳ AI 분석 중...';
  try{
    await _syncAPIShorts();
    const rows = list.slice(0,20).map(v => ({ topic:v.topic, ...(perf[v.id]||{}) }));
    const sys = '성과 패턴 분석가. 잘된 영상(조회수 상위 30%) 공통점과 안된 영상(하위 30%) 공통점을 각각 3~4개씩 불릿으로 출력. 실용적이고 구체적으로.';
    const res = await APIAdapter.callWithFallback(sys, JSON.stringify(rows), { maxTokens:1000 });
    out.innerHTML = '<pre style="white-space:pre-wrap;margin:0;font-family:inherit">' + res + '</pre>';
  }catch(e){ out.innerHTML = '<span style="color:var(--err)">❌ ' + e.message + '</span>'; }
}

function _anT3Strategy(){
  const cached = JSON.parse(localStorage.getItem('sh_strategy_cache')||'null');
  return '<button class="mz-btn pri lg" onclick="anGenStrategy()" style="padding:14px 24px;font-size:14px">🤖 AI 전략 리포트 생성</button>' +
    (cached ? '<div style="margin-top:14px">' + _anRenderStrategy(cached) + '</div>' : '<p class="muted" style="margin-top:10px">버튼을 누르면 최근 성과·트렌드·업로드 이력을 종합 분석해 맞춤형 다음 달 전략을 생성합니다.</p>') +
    '<div id="an-strat-out" style="margin-top:10px"></div>';
}
async function anGenStrategy(){
  const out = document.getElementById('an-strat-out');
  out.innerHTML = '<p class="muted">⏳ AI 전략 생성 중...</p>';
  try{
    await _syncAPIShorts();
    const list = JSON.parse(localStorage.getItem('sh_uploaded_list')||'[]');
    const perf = JSON.parse(localStorage.getItem('sh_analytics_data')||'{}');
    const ch = shState.data.channel || {};
    const sys = '유튜브 채널 성장 전략가. 최근 20편 성과·채널 장르·트렌드를 종합해 JSON 출력:\n' +
      '{"weekPlan":[{"day":"월","lang":"ko|ja","genre":"...","reason":"..."}],' +
      '"topicRec":[{"title":"주제","predictViews":"X~Y","reason":"..."}], ' +
      '"growth":"2~3줄 성장 전략", "longform":"롱폼 전환 시점 조언", "calendar":[{"date":"1일(월)","task":"..."}]}';
    const user = '주제: ' + (shState.data.topic||'') + '\n장르: ' + (ch.genre||'') + '\n' +
      '최근 업로드: ' + JSON.stringify(list.slice(0,10).map(v => v.topic));
    const res = await APIAdapter.callWithFallback(sys, user, { maxTokens:2500 });
    const m = res.match(/\{[\s\S]*\}/); if(!m) throw new Error('파싱 실패');
    const obj = JSON.parse(m[0]);
    localStorage.setItem('sh_strategy_cache', JSON.stringify(obj));
    out.innerHTML = _anRenderStrategy(obj);
  }catch(e){ out.innerHTML = '<p style="color:var(--err)">❌ ' + e.message + '</p>'; }
}
function _anRenderStrategy(obj){
  let html = '';
  if(obj.weekPlan && obj.weekPlan.length){
    html += '<div style="background:#fff5fa;padding:12px;border-radius:10px;margin-bottom:10px">' +
      '<h5 style="margin:0 0 6px">📅 이번 주 업로드 계획</h5>' +
      obj.weekPlan.map(w => '<div style="font-size:12.5px;padding:3px 0">' +
        w.day + '요일 ' + (w.lang==='ja'?'🇯🇵':'🇰🇷') + ' <b>' + w.genre + '</b>' +
        (w.reason ? ' <span class="muted">- ' + w.reason + '</span>' : '') +
      '</div>').join('') + '</div>';
  }
  if(obj.topicRec && obj.topicRec.length){
    html += '<div style="background:#fff;border:1px solid var(--line);padding:12px;border-radius:10px;margin-bottom:10px">' +
      '<h5 style="margin:0 0 6px">🎯 다음 영상 주제 TOP 3</h5>' +
      obj.topicRec.slice(0,3).map((t,i) => '<div style="padding:8px 0;border-bottom:1px dashed var(--line)">' +
        ['🥇','🥈','🥉'][i] + ' <b>' + t.title + '</b>' +
        (t.predictViews ? '<br>예상 조회: <b style="color:var(--pink-deep)">' + t.predictViews + '</b>' : '') +
        (t.reason ? ' · ' + t.reason : '') +
        '<br><button class="mz-btn pri" style="padding:4px 10px;font-size:11px;margin-top:4px" onclick="shState.data.topic=\'' + String(t.title).replace(/\'/g,'') + '\';shState.step=3;renderStepper();renderStepContent()">이 주제로 바로 시작 →</button>' +
      '</div>').join('') + '</div>';
  }
  if(obj.growth){
    html += '<div style="background:#f7f4ff;padding:12px;border-radius:10px;margin-bottom:10px"><h5 style="margin:0 0 6px">💡 채널 성장 전략</h5><p style="margin:0;font-size:12.5px;line-height:1.7">' + obj.growth + '</p></div>';
  }
  if(obj.longform){
    html += '<div style="background:#fff7ee;padding:12px;border-radius:10px;margin-bottom:10px"><h5 style="margin:0 0 6px">🎬 롱폼 전환</h5><p style="margin:0;font-size:12.5px;line-height:1.7">' + obj.longform + '</p></div>';
  }
  if(obj.calendar && obj.calendar.length){
    html += '<div style="background:#fff;border:1px solid var(--line);padding:12px;border-radius:10px">' +
      '<h5 style="margin:0 0 6px">📆 이번 달 콘텐츠 캘린더</h5>' +
      '<div style="font-family:monospace;font-size:12px;line-height:1.7">' +
        obj.calendar.map(c => c.date + ' - ' + c.task).join('<br>') +
      '</div>' +
      '<button class="mz-btn pri" style="padding:6px 12px;font-size:11px;margin-top:6px" onclick="shState.step=10;renderStepper();renderStepContent()">이 계획으로 숏츠 일괄 제작 시작 →</button>' +
    '</div>';
  }
  return html;
}

/* ───── 피드백 루프 ───── */
function _anFeedbackLoop(){
  return '<div style="position:sticky;bottom:0;background:linear-gradient(135deg,#fff5fa,#f7f4ff);border:1px solid var(--pink);border-radius:12px;padding:10px 14px;margin-top:14px">' +
    '<b style="font-size:12.5px">수정하고 싶은 부분이 있나요?</b>' +
    '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">' +
      [[3,'✏ 대본'],[4,'🖼 스타일'],[6,'🎬 미디어'],[7,'✍ 최종'],[8,'📤 업로드정보']].map(([n,l]) =>
        '<button class="mz-btn ghost" style="padding:6px 10px;font-size:11.5px" onclick="shState.step=' + n + ';renderStepper();renderStepContent()">' + l + '</button>'
      ).join('') +
    '</div>' +
  '</div>';
}
