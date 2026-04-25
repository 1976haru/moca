/* ================================================
   modules/studio/s3-image-keys.js
   STEP 2 — 이미지 API 키 설정 모달 (이슈 1)
   * 7 provider 지원: DALL-E 3 / DALL-E 2 / Flux / Stable Diffusion /
                       Gemini Imagen / MiniMax / Ideogram
   * 저장: localStorage 'moca_image_api_keys_v1'
   * 호환: 기존 단일 키(uc_openai_key 등)도 저장하여 기존 코드 동작 보장
   ================================================ */
(function(){
  'use strict';

  const LS_NEW = 'moca_image_api_keys_v1';

  /* provider 정의 */
  const S3K_PROVIDERS = [
    { id:'dalle3',   label:'DALL-E 3',         note:'OpenAI · 고품질', legacyKey:'uc_openai_key' },
    { id:'dalle2',   label:'DALL-E 2',         note:'OpenAI · 저렴',   legacyKey:'uc_openai_key' },
    { id:'flux',     label:'Flux',             note:'시드 고정·일관성', legacyKey:'uc_flux_key' },
    { id:'sd',       label:'Stable Diffusion', note:'최저가',           legacyKey:'uc_sd_key' },
    { id:'gemini',   label:'Gemini Imagen',    note:'Google · 무료/Gemini 키', legacyKey:'uc_gemini_key' },
    { id:'minimax',  label:'MiniMax',          note:'영상 특화',         legacyKey:'uc_minimax_key' },
    { id:'ideogram', label:'Ideogram',         note:'텍스트 표현 강점',  legacyKey:'uc_ideogram_key' },
  ];

  /* ── 저장/로드 ── */
  function _readAll() {
    try { return JSON.parse(localStorage.getItem(LS_NEW) || '{}'); }
    catch(_) { return {}; }
  }
  function _writeAll(obj) {
    try { localStorage.setItem(LS_NEW, JSON.stringify(obj || {})); }
    catch(e) { console.warn('[s3-keys] save 실패:', e); }
  }

  /* 신규 저장 + 기존 단일 키도 동기화 (기존 이미지 생성 코드 호환) */
  function _saveOne(providerId, apiKey, baseUrl) {
    const all = _readAll();
    const provider = S3K_PROVIDERS.find(function(p){ return p.id === providerId; });
    if (!provider) return;
    if (apiKey) {
      all[providerId] = {
        apiKey:    apiKey,
        baseUrl:   baseUrl || '',
        updatedAt: Date.now(),
      };
      _writeAll(all);
      /* 기존 코드 호환 — uc_openai_key 등 단일 키 */
      try { localStorage.setItem(provider.legacyKey, apiKey); } catch(_) {}
    } else {
      delete all[providerId];
      _writeAll(all);
    }
  }

  function _deleteOne(providerId) {
    const all = _readAll();
    delete all[providerId];
    _writeAll(all);
    /* legacy key 도 비우기 */
    const provider = S3K_PROVIDERS.find(function(p){ return p.id === providerId; });
    if (provider) {
      try { localStorage.removeItem(provider.legacyKey); } catch(_) {}
    }
  }

  /* 키 보유 여부 (legacy key 또는 신규 저장 둘 다 체크) */
  function _hasKey(providerId) {
    const all = _readAll();
    if (all[providerId] && all[providerId].apiKey) return true;
    const provider = S3K_PROVIDERS.find(function(p){ return p.id === providerId; });
    if (provider) {
      try {
        const v = localStorage.getItem(provider.legacyKey);
        if (v && v.trim()) return true;
      } catch(_) {}
    }
    return false;
  }
  window.s3HasImageApiKey = _hasKey;

  /* 마스킹 (저장된 키를 input에 일부만 표시) */
  function _maskKey(key) {
    if (!key) return '';
    if (key.length <= 8) return '•'.repeat(key.length);
    return key.slice(0, 4) + '•'.repeat(Math.max(0, key.length - 8)) + key.slice(-4);
  }
  function _getStoredKey(providerId) {
    const all = _readAll();
    if (all[providerId] && all[providerId].apiKey) return all[providerId].apiKey;
    const provider = S3K_PROVIDERS.find(function(p){ return p.id === providerId; });
    if (provider) {
      try { return localStorage.getItem(provider.legacyKey) || ''; } catch(_) { return ''; }
    }
    return '';
  }

  /* ════════════════════════════════════════════════
     모달 렌더 (7 provider)
     ════════════════════════════════════════════════ */
  function s3OpenImageApiKeyModal() {
    /* 기존 모달 제거 */
    const existing = document.getElementById('s3kModal');
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.id = 's3kModal';
    wrap.className = 's3k-backdrop';
    wrap.innerHTML = ''
      + '<div class="s3k-dialog">'
      +   '<div class="s3k-hd">'
      +     '<h3>🔑 이미지 API 키 설정</h3>'
      +     '<button class="s3k-close" onclick="s3CloseImageApiKeyModal()" title="닫기">✕</button>'
      +   '</div>'
      +   '<div class="s3k-body">'
      +     S3K_PROVIDERS.map(_renderProviderRow).join('')
      +   '</div>'
      +   '<div class="s3k-foot">'
      +     '<div class="s3k-warn">'
      +       '🔒 현재 브라우저 localStorage에 저장됩니다. 실제 서비스 배포 시에는 서버 저장 방식으로 전환해야 합니다.'
      +     '</div>'
      +     '<div class="s3k-foot-btns">'
      +       '<button class="s3k-btn-secondary" onclick="s3CloseImageApiKeyModal()">닫기</button>'
      +     '</div>'
      +   '</div>'
      + '</div>';

    document.body.appendChild(wrap);
    _injectCSS();

    /* 배경 클릭 시 닫기 */
    wrap.addEventListener('click', function(e){
      if (e.target === wrap) s3CloseImageApiKeyModal();
    });
  }
  window.s3OpenImageApiKeyModal = s3OpenImageApiKeyModal;

  function _renderProviderRow(p) {
    const stored = _getStoredKey(p.id);
    const has = !!(stored && stored.trim());
    const all = _readAll();
    const baseUrl = (all[p.id] && all[p.id].baseUrl) || '';
    return ''
      + '<div class="s3k-row" data-pid="' + p.id + '">'
      +   '<div class="s3k-row-hd">'
      +     '<span class="s3k-row-label">' + p.label + '</span>'
      +     '<span class="s3k-row-note">' + p.note + '</span>'
      +     '<span class="s3k-status ' + (has?'on':'off') + '">' + (has ? '✅ 키 저장됨' : '키 필요') + '</span>'
      +   '</div>'
      +   '<div class="s3k-row-body">'
      +     '<input type="password" class="s3k-inp s3k-inp-key" placeholder="API Key 입력"'
      +           ' value="' + (has ? _maskKey(stored).replace(/"/g,'&quot;') : '') + '"'
      +           ' data-stored="' + (has?'1':'0') + '"'
      +           ' onfocus="this.dataset.stored===\'1\' && (this.value=\'\',this.dataset.stored=\'0\')">'
      +     '<input type="text"     class="s3k-inp s3k-inp-base" placeholder="Base URL (선택)" value="' + baseUrl.replace(/"/g,'&quot;') + '">'
      +     '<button class="s3k-btn-save" onclick="s3SaveImageApiKey(\'' + p.id + '\')">💾 저장</button>'
      +     '<button class="s3k-btn-delete" onclick="s3DeleteImageApiKey(\'' + p.id + '\')">🗑 삭제</button>'
      +     '<button class="s3k-btn-test" disabled title="다음 PR 예정">⏱ 연결 테스트 (준비중)</button>'
      +   '</div>'
      + '</div>';
  }

  /* ── 핸들러 ── */
  window.s3CloseImageApiKeyModal = function() {
    const m = document.getElementById('s3kModal');
    if (m) m.remove();
  };

  window.s3SaveImageApiKey = function(providerId) {
    const row = document.querySelector('.s3k-row[data-pid="' + providerId + '"]');
    if (!row) return;
    const keyInp = row.querySelector('.s3k-inp-key');
    const baseInp= row.querySelector('.s3k-inp-base');
    const newKey = (keyInp && keyInp.value || '').trim();
    const baseUrl= (baseInp && baseInp.value || '').trim();
    /* stored=1 (마스킹 상태) 이고 사용자가 안 건드렸으면 기존 키 유지 */
    if (keyInp && keyInp.dataset.stored === '1') {
      const stored = _getStoredKey(providerId);
      _saveOne(providerId, stored, baseUrl);
    } else {
      if (!newKey) { alert('API 키를 입력해주세요.'); return; }
      _saveOne(providerId, newKey, baseUrl);
    }
    /* 모달 재렌더 (상태 갱신) */
    s3OpenImageApiKeyModal();
    /* 이미지 페이지 재렌더 트리거 — STEP 2 화면 상태 표시 갱신 */
    if (typeof renderStudio === 'function') {
      try { renderStudio(); } catch(_) {}
    }
    /* 안전한 알림 (키 자체는 절대 출력하지 않음) */
    alert('💾 ' + (S3K_PROVIDERS.find(function(p){return p.id===providerId;})||{}).label + ' API 키가 저장됐습니다.');
  };

  window.s3DeleteImageApiKey = function(providerId) {
    if (!confirm('이 API 키를 삭제할까요?')) return;
    _deleteOne(providerId);
    s3OpenImageApiKeyModal();
    if (typeof renderStudio === 'function') {
      try { renderStudio(); } catch(_) {}
    }
  };

  /* 외부에서 모든 키 저장 호출 (사용자 노출 함수명) */
  window.s3SaveImageApiKeys = function(updates) {
    if (!updates || typeof updates !== 'object') return;
    Object.keys(updates).forEach(function(pid){
      const u = updates[pid] || {};
      _saveOne(pid, u.apiKey || '', u.baseUrl || '');
    });
  };

  /* ── CSS 주입 ── */
  function _injectCSS() {
    if (document.getElementById('s3k-style')) return;
    const st = document.createElement('style');
    st.id = 's3k-style';
    st.textContent = ''
      + '.s3k-backdrop{position:fixed;inset:0;background:rgba(30,18,30,.6);backdrop-filter:blur(3px);'
      +   'z-index:10500;display:flex;align-items:center;justify-content:center;padding:20px}'
      + '.s3k-dialog{background:#fff;border-radius:18px;max-width:680px;width:100%;max-height:88vh;'
      +   'display:flex;flex-direction:column;box-shadow:0 16px 48px rgba(30,18,30,.35);overflow:hidden}'
      + '.s3k-hd{padding:14px 18px;border-bottom:1px solid #f1dce7;display:flex;align-items:center;justify-content:space-between}'
      + '.s3k-hd h3{margin:0;font-size:16px;color:#2b2430}'
      + '.s3k-close{border:none;background:#f5f0ff;color:#5b4ecf;border-radius:50%;width:32px;height:32px;'
      +   'cursor:pointer;font-size:14px;font-weight:800}'
      + '.s3k-close:hover{background:#9181ff;color:#fff}'
      + '.s3k-body{padding:14px 18px;overflow:auto;display:flex;flex-direction:column;gap:10px}'
      + '.s3k-row{background:#fbf7f9;border:1.5px solid #f1dce7;border-radius:12px;padding:10px 12px}'
      + '.s3k-row-hd{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}'
      + '.s3k-row-label{font-size:13px;font-weight:800;color:#2b2430}'
      + '.s3k-row-note{font-size:11px;color:#9b8a93}'
      + '.s3k-status{margin-left:auto;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:800}'
      + '.s3k-status.on{background:#effbf7;color:#1a7a5a}'
      + '.s3k-status.off{background:#fff1f1;color:#c0392b}'
      + '.s3k-row-body{display:grid;grid-template-columns:1fr 1fr auto auto auto;gap:6px;align-items:center}'
      + '@media(max-width:600px){.s3k-row-body{grid-template-columns:1fr 1fr;}.s3k-btn-save,.s3k-btn-delete,.s3k-btn-test{grid-column:span 1}}'
      + '.s3k-inp{padding:7px 10px;border:1.5px solid #f1dce7;border-radius:8px;font-size:12px;'
      +   'font-family:Consolas,Menlo,monospace;outline:none;background:#fff;box-sizing:border-box;width:100%}'
      + '.s3k-inp:focus{border-color:#9181ff}'
      + '.s3k-btn-save,.s3k-btn-delete,.s3k-btn-test{padding:6px 10px;border-radius:8px;font-size:11px;'
      +   'font-weight:700;cursor:pointer;font-family:inherit;border:1.5px solid;transition:.12s;white-space:nowrap}'
      + '.s3k-btn-save{border-color:#9181ff;background:#9181ff;color:#fff}'
      + '.s3k-btn-save:hover{opacity:.9}'
      + '.s3k-btn-delete{border-color:#fca5a5;background:#fff;color:#dc2626}'
      + '.s3k-btn-delete:hover{background:#dc2626;color:#fff}'
      + '.s3k-btn-test{border-color:#e5e7eb;background:#f9f9f9;color:#9b8a93;cursor:not-allowed}'
      + '.s3k-foot{padding:12px 18px;border-top:1px solid #f1dce7;display:flex;flex-direction:column;gap:8px}'
      + '.s3k-warn{font-size:11px;color:#8B5020;background:#fff8ec;border:1px solid #f1e0c4;border-radius:8px;padding:8px 10px;line-height:1.5}'
      + '.s3k-foot-btns{display:flex;justify-content:flex-end}'
      + '.s3k-btn-secondary{padding:8px 16px;border:1.5px solid #f1dce7;border-radius:10px;'
      +   'background:#fff;font-size:12px;font-weight:700;cursor:pointer;color:#5a4a56;font-family:inherit}'
      ;
    document.head.appendChild(st);
  }

  /* 외부 노출 — providers 목록 */
  window.s3ImageApiKeyProviders = S3K_PROVIDERS;
})();
