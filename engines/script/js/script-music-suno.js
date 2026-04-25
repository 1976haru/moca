/* ================================================
   engines/script/js/script-music-suno.js
   가사/음원 — Suno 복붙용 패키지 결과 생성·렌더·복사
   * 호출자: script-music-tabs.js 의 "🎼 Suno 패키지 생성" 버튼
   * 결과 저장: window.SCRIPT_MUSIC_STATE.suno + localStorage 'moca_suno_package'
   ================================================ */
(function(){
  'use strict';

  /* ── Suno Style Prompt 자동 생성 (영어, 짧고 명확) ── */
  function buildStylePrompt(sub, opts) {
    const settings = (window._smGetSettings && window._smGetSettings()) || {};
    const lang = settings.channelLang || 'kojp';
    /* 서브탭별 기본 스타일 키워드 */
    const base = {
      orig:    'nostalgic Korean trot ballad',
      memory:  'warm vintage Korean ballad',
      story:   'emotional Korean storytelling ballad',
      enka:    'Japanese enka, Showa-era nostalgic',
      cover:   'acoustic emotional cover arrangement',
      variety: 'cheerful retro Korean pop',
    }[sub] || 'nostalgic ballad';

    const langKw = lang === 'ja' ? 'Japanese vocal'
                 : lang === 'ko' ? 'Korean vocal'
                 : 'Korean and Japanese bilingual vocal';
    const moodKw = (opts && opts.lyricVibe) || 'emotional warm nostalgic';
    const eraKw  = (opts && opts.era) ? (String(opts.era).indexOf('s') >= 0 ? 'retro ' + opts.era + ' mood' : 'retro mood') : 'retro mood';

    return base + ', ' + langKw + ', warm senior female vocal, '
         + moodKw + ', ' + eraKw + ', soft orchestration, slow tempo';
  }

  /* ── Vocal Direction (영어) ── */
  function buildVocalDirection() {
    return [
      'warm, mature female lead vocal (50s~60s persona)',
      'soft breathy tone in verses, fuller chest voice in choruses',
      'natural Korean/Japanese pronunciation, minimal vibrato in verses',
      'subtle vibrato and slight crying tone in emotional climax',
      'no auto-tune, no harsh consonants',
    ].join('\n');
  }

  /* ── Arrangement Direction (영어) ── */
  function buildArrangement() {
    return [
      'Start with soft piano and strings',
      'Add acoustic guitar in verse 2',
      'Gradually add drums in the chorus, soft brushes',
      'Keep tempo slow (BPM 70~85)',
      'Emphasize nostalgic melody and emotional pauses',
      'Bridge: drop drums, leave piano and vocal only',
      'Final chorus: full arrangement, gentle dynamics',
    ].join('\n');
  }

  /* ── Negative Prompt ── */
  function buildNegative() {
    return [
      'no rap', 'no EDM', 'no heavy metal', 'no aggressive drums',
      'no distorted vocal', 'no explicit lyrics',
      'no copyrighted lyrics', 'no artist imitation', 'no auto-tune robotic vocal',
    ].join(', ');
  }

  /* ── 30초 하이라이트 구조 ── */
  function buildShortsHighlight() {
    return [
      '0–3s : emotional hook line (single short sentence)',
      '3–12s : verse highlight (one impactful image or memory)',
      '12–24s : chorus climax (full vocal + main melody)',
      '24–30s : final emotional phrase + soft CTA',
    ].join('\n');
  }

  /* ── 제목 후보 ── */
  function buildTitleCandidates(sub, raw) {
    const head = (raw || '').split('\n').filter(function(l){ return l.trim(); })[0] || '';
    const stub = head.slice(0, 16);
    return [
      { type: 'Title KR', text: stub || '추억의 그날을 노래해' },
      { type: 'Title JP', text: '懐かしい あの日の歌' },
      { type: '감성형',   text: '눈물처럼 흘러간 노래 한 곡' },
      { type: '클릭형',   text: '60대가 들으면 무조건 우는 노래' },
    ];
  }

  /* ── 본문에서 가사 영역 추출 (KO/JA) ── */
  function extractLyricsParts(raw, lang) {
    const text = (raw || '').trim();
    if (!text) return { ko:'', ja:'' };
    if (lang === 'ko') return { ko: text, ja:'' };
    if (lang === 'ja') return { ko:'', ja: text };
    /* both */
    const parts = text.split(/={3,}\s*일본어\s*={3,}/i);
    return { ko: (parts[0]||'').trim(), ja: (parts[1]||'').trim() };
  }

  /* ── 가사 → Suno 마커 구조로 변환 ── */
  function toSunoLyrics(text) {
    if (!text) return '';
    /* 이미 [Verse]·[Chorus] 마커 있으면 그대로 */
    if (/\[(Intro|Verse|Chorus|Bridge|Outro)/i.test(text)) return text;
    /* 단락별로 구조 자동 부여 */
    const paragraphs = text.split(/\n\n+/).map(function(p){ return p.trim(); }).filter(Boolean);
    const labels = ['[Intro]', '[Verse 1]', '[Chorus]', '[Verse 2]', '[Chorus]', '[Bridge]', '[Final Chorus]', '[Outro]'];
    return paragraphs.map(function(p, i){
      return (labels[i] || ('[Section ' + (i+1) + ']')) + '\n' + p;
    }).join('\n\n');
  }

  /* ════════════════════════════════════════════════
     메인 — Suno 패키지 생성 (호출자: script-music-tabs.js)
     ════════════════════════════════════════════════ */
  window._smGenerateSunoPackage = async function(sub) {
    const wrap = document.getElementById('suno-pkg-' + sub);
    if (!wrap) return;
    if (!window.SCRIPT_MUSIC_PROMPTS) {
      wrap.innerHTML = '<div class="smt-suno-err">⚠️ script-music-prompts.js 가 로드되지 않았습니다.</div>';
      return;
    }
    wrap.innerHTML = '<div class="smt-suno-loading">⏳ Suno 패키지 생성 중...</div>';

    try {
      const opts  = window.SCRIPT_MUSIC_PROMPTS.collect(sub);
      const built = window.SCRIPT_MUSIC_PROMPTS.build(sub, opts);
      const settings = window._smGetSettings();
      const raw = await window.SCRIPT_MUSIC_PROMPTS.callAI(built.sys, built.user, 3000);

      /* 본문 분리 (KO/JA) */
      const parts = extractLyricsParts(raw, settings.channelLang);

      /* Suno 패키지 구성 */
      const pkg = {
        subTab:               sub,
        titleCandidates:      buildTitleCandidates(sub, parts.ko || parts.ja),
        stylePrompt:          buildStylePrompt(sub, opts),
        lyricsKo:             toSunoLyrics(parts.ko),
        lyricsJa:             toSunoLyrics(parts.ja),
        vocalDirection:       buildVocalDirection(),
        arrangementDirection: buildArrangement(),
        negativePrompt:       buildNegative(),
        shortsHighlight:      buildShortsHighlight(),
        rawScript:            raw,
        generatedAt:          Date.now(),
      };
      pkg.fullSunoPackage = _composeFullText(pkg);

      /* 상태 + localStorage 저장 */
      window.SCRIPT_MUSIC_STATE.suno = pkg;
      window.SCRIPT_MUSIC_STATE.rawScripts[sub] = raw;
      try {
        localStorage.setItem('moca_suno_package', JSON.stringify(pkg));
      } catch(e) { console.warn('[suno] localStorage 저장 실패:', e); }

      wrap.innerHTML = _renderPackage(pkg);
    } catch(err) {
      console.error('[suno] 생성 오류:', err);
      wrap.innerHTML = '<div class="smt-suno-err">⚠️ 생성 실패: ' + (err.message || err) + '</div>';
    }
  };

  /* ── 전체 패키지 텍스트 구성 ── */
  function _composeFullText(p) {
    const lines = [];
    lines.push('=== 곡 제목 후보 ===');
    p.titleCandidates.forEach(function(t){ lines.push('- ' + t.type + ': ' + t.text); });
    lines.push('');
    lines.push('=== Suno Style Prompt (Style of Music) ===');
    lines.push(p.stylePrompt);
    lines.push('');
    if (p.lyricsKo) {
      lines.push('=== Suno Lyrics (KR) ===');
      lines.push(p.lyricsKo);
      lines.push('');
    }
    if (p.lyricsJa) {
      lines.push('=== Suno Lyrics (JP) ===');
      lines.push(p.lyricsJa);
      lines.push('');
    }
    lines.push('=== Vocal Direction ===');
    lines.push(p.vocalDirection);
    lines.push('');
    lines.push('=== Arrangement Direction ===');
    lines.push(p.arrangementDirection);
    lines.push('');
    lines.push('=== Negative Prompt ===');
    lines.push(p.negativePrompt);
    lines.push('');
    lines.push('=== YouTube Shorts 30s Highlight Structure ===');
    lines.push(p.shortsHighlight);
    return lines.join('\n');
  }

  /* ── 카드 렌더 + 복사 버튼 ── */
  function _renderPackage(p) {
    function copyBtn(label, text) {
      const safe = (text||'').replace(/`/g, '\\`').replace(/'/g, "\\'");
      return '<button class="smt-copy-btn" onclick="window._smCopyText(`' + safe + '`,this)">📋 ' + label + ' 복사</button>';
    }
    function section(title, body, copyLabel) {
      return ''
        + '<div class="smt-suno-sec">'
        +   '<div class="smt-suno-sec-hd">' + title + (copyLabel ? copyBtn(copyLabel, body) : '') + '</div>'
        +   '<pre class="smt-suno-sec-body">' + _esc(body) + '</pre>'
        + '</div>';
    }

    return ''
      + '<div class="smt-suno-pkg">'
      +   '<div class="smt-suno-hd">'
      +     '<span>🎼 Suno 패키지 — ' + (window._smGetSubLabel(p.subTab) || '') + '</span>'
      +     copyBtn('전체 패키지', p.fullSunoPackage)
      +   '</div>'

      +   '<div class="smt-suno-titles">'
      +     '<div class="smt-suno-sec-hd">📌 곡 제목 후보</div>'
      +     p.titleCandidates.map(function(t){
            return '<div class="smt-title-row">' +
              '<span class="smt-title-tag">' + t.type + '</span>' +
              '<span class="smt-title-text">' + _esc(t.text) + '</span>' +
              copyBtn('제목', t.text) +
            '</div>';
          }).join('')
      +   '</div>'

      +   section('🎚 Suno Style Prompt (Style of Music 칸)', p.stylePrompt, 'Style')
      +   (p.lyricsKo ? section('📝 Suno Lyrics (한국어, [Verse]/[Chorus] 마커)', p.lyricsKo, 'Lyrics KR') : '')
      +   (p.lyricsJa ? section('📝 Suno Lyrics (日本語)', p.lyricsJa, 'Lyrics JP') : '')
      +   section('🎙 Vocal Direction', p.vocalDirection, 'Vocal')
      +   section('🎻 Arrangement Direction', p.arrangementDirection, 'Arrangement')
      +   section('🚫 Negative Prompt', p.negativePrompt, 'Negative')
      +   section('⚡ YouTube Shorts 30s 하이라이트 구조', p.shortsHighlight, 'Shorts')

      +   '<div class="smt-suno-foot">'
      +     '⚖️ 위 패키지는 <b>저작권 보호</b>를 위해 기존 가사 인용을 금지하며, '
      +     '분위기·시대·감성을 참고해 새로 작성된 창작 결과입니다. Suno에 그대로 붙여넣어 사용하세요.'
      +   '</div>'
      + '</div>';
  }

  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  /* ── 클립보드 복사 (label·text) ── */
  window._smCopyText = function(text, btn) {
    if (!text) { alert('복사할 내용이 없습니다.'); return; }
    function done() {
      const orig = btn.textContent;
      btn.textContent = '✅ 복사됨';
      setTimeout(function(){ btn.textContent = orig; }, 1500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function(){ _smFallbackCopy(text, done); });
    } else {
      _smFallbackCopy(text, done);
    }
  };
  function _smFallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); }
    catch(_) { alert('복사 실패. 수동으로 선택해서 복사해주세요.'); }
    document.body.removeChild(ta);
  }

  /* ── CSS ── */
  function _injectCSS() {
    if (document.getElementById('smt-suno-style')) return;
    const st = document.createElement('style');
    st.id = 'smt-suno-style';
    st.textContent = ''
      + '.smt-suno-pkg{margin-top:10px;background:#fff;border:2px solid #C020A0;border-radius:14px;overflow:hidden}'
      + '.smt-suno-hd{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;background:linear-gradient(135deg,#C020A0,#8030A0);color:#fff;font-size:13px;font-weight:800;flex-wrap:wrap}'
      + '.smt-suno-titles{padding:10px 14px;background:#fff0f8;border-bottom:1px solid #f0c8de}'
      + '.smt-title-row{display:flex;align-items:center;gap:8px;padding:5px 0;font-size:12px;flex-wrap:wrap}'
      + '.smt-title-tag{padding:2px 8px;background:#C020A0;color:#fff;border-radius:20px;font-size:10px;font-weight:800;flex-shrink:0}'
      + '.smt-title-text{flex:1;color:#2b2430;font-weight:700}'
      + '.smt-suno-sec{padding:10px 14px;border-bottom:1px solid #f8e0ec}'
      + '.smt-suno-sec:last-child{border-bottom:none}'
      + '.smt-suno-sec-hd{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;font-weight:800;color:#5b1a4a;margin-bottom:6px;flex-wrap:wrap}'
      + '.smt-suno-sec-body{margin:0;padding:10px;background:#fdf5fa;border:1px solid #f0c8de;border-radius:8px;font-size:11.5px;font-family:Consolas,Menlo,monospace;line-height:1.6;white-space:pre-wrap;word-break:break-word;max-height:280px;overflow:auto}'
      + '.smt-copy-btn{padding:4px 10px;border:1.5px solid #C020A0;border-radius:8px;background:#fff;color:#C020A0;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit;transition:.12s}'
      + '.smt-copy-btn:hover{background:#C020A0;color:#fff}'
      + '.smt-suno-foot{padding:10px 14px;background:#fff8ec;border-top:1px solid #f1e0c4;font-size:11px;color:#8B5020;line-height:1.5}'
      + '.smt-suno-foot b{color:#6b3f10}'
      + '.smt-suno-loading{padding:14px;text-align:center;font-size:12px;color:#7b7077}'
      + '.smt-suno-err{padding:12px;background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;color:#991b1b;font-size:12px}'
      ;
    document.head.appendChild(st);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _injectCSS);
  } else {
    _injectCSS();
  }
})();
