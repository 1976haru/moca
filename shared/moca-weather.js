/* ================================================
   shared/moca-weather.js
   📅 날짜·요일·시간 chip (1분 갱신) + 🌤 날씨 chip (설정 모달)
   * 헤더 [data-moca-header-actions] 컨테이너에 자동 주입
   * 모바일에서 라벨 축약
   * 날씨 API key는 통합 설정에 위임 (코드에 하드코딩 금지)
   ================================================ */
(function(){
  'use strict';

  /* ── 날짜 포맷 ── */
  var WEEKDAYS_KR = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
  function _pad(n){ return n < 10 ? '0' + n : '' + n; }
  function formatMocaDateTime(d) {
    d = d || new Date();
    var y = d.getFullYear();
    var m = _pad(d.getMonth() + 1);
    var dd = _pad(d.getDate());
    var w = WEEKDAYS_KR[d.getDay()];
    var hh = _pad(d.getHours());
    var mm = _pad(d.getMinutes());
    return { full: y + '.' + m + '.' + dd + ' ' + w + ' ' + hh + ':' + mm,
             short: hh + ':' + mm,
             date: y + '.' + m + '.' + dd, weekday: w, time: hh + ':' + mm };
  }
  window.formatMocaDateTime = formatMocaDateTime;

  /* ── 날씨 설정 storage ── */
  var W_KEY = 'moca_weather_settings_v1';
  function loadWeather() {
    try { return Object.assign(_defaults(), JSON.parse(localStorage.getItem(W_KEY) || '{}')); }
    catch(_) { return _defaults(); }
  }
  function saveWeather(v) {
    try { localStorage.setItem(W_KEY, JSON.stringify(v)); return true; } catch(_) { return false; }
  }
  function _defaults() {
    return { enabled:true, city:'', country:'KR', provider:'openweather',
             useApiSettings:true, lastWeather:{ temp:null, condition:'', updatedAt:0 } };
  }
  window.mocaLoadWeatherSettings = loadWeather;
  window.mocaSaveWeatherSettings = saveWeather;

  /* ── chip 라벨 결정 ── */
  function _weatherChipLabel() {
    var w = loadWeather();
    if (!w.enabled) return '🌤 날씨 꺼짐';
    if (!w.city)    return '🌤 날씨 설정';
    /* 키 확인 — 통합 설정의 weather provider (없으면 안내) */
    var hasKey = false;
    if (typeof window.hasApiKey === 'function') {
      hasKey = window.hasApiKey('upload', w.provider);
    }
    if (!hasKey) return '🌤 ' + w.city + ' · 날씨 API 필요';
    if (w.lastWeather && w.lastWeather.temp != null) {
      return '🌤 ' + w.city + ' ' + w.lastWeather.temp + '℃ ' + (w.lastWeather.condition || '');
    }
    return '🌤 ' + w.city + ' · 불러오는 중';
  }

  /* ── 헤더 컨테이너 탐색 ── */
  function _findHeader() {
    return document.querySelector('[data-moca-header-actions]')
        || document.querySelector('.uch-icons')
        || document.querySelector('.topbar-actions')
        || null;
  }

  /* ── 날짜·시간 chip 주입 ── */
  function _ensureDateTimeChip() {
    if (document.querySelector('[data-moca-datetime-chip]')) { _updateDateTime(); return; }
    var c = _findHeader(); if (!c) return false;
    var span = document.createElement('span');
    span.setAttribute('data-moca-datetime-chip','1');
    span.className = 'moca-chip moca-chip-dt';
    span.title = '현재 날짜와 시간';
    span.innerHTML = '<span class="moca-chip-ico">📅</span><span class="moca-chip-label" data-dt-label></span>';
    c.appendChild(span);
    _updateDateTime();
    return true;
  }
  function _updateDateTime() {
    var labels = document.querySelectorAll('[data-moca-datetime-chip] [data-dt-label]');
    if (!labels.length) return;
    var dt = formatMocaDateTime();
    labels.forEach(function(el){
      el.setAttribute('data-full', dt.full);
      el.setAttribute('data-short', dt.short);
      el.textContent = dt.full; /* CSS가 모바일에서 short만 보이게 처리 */
    });
  }

  /* ── 날씨 chip 주입 ── */
  function _ensureWeatherChip() {
    if (document.querySelector('[data-moca-weather-chip]')) { _updateWeather(); return; }
    var c = _findHeader(); if (!c) return false;
    var btn = document.createElement('button');
    btn.setAttribute('data-moca-weather-chip','1');
    btn.className = 'moca-chip moca-chip-w';
    btn.type = 'button';
    btn.title = '날씨 설정';
    btn.onclick = function(){ window.mocaOpenWeatherSettings(); };
    btn.innerHTML = '<span data-w-label></span>';
    c.appendChild(btn);
    _updateWeather();
    return true;
  }
  function _updateWeather() {
    var els = document.querySelectorAll('[data-moca-weather-chip] [data-w-label]');
    if (!els.length) return;
    var label = _weatherChipLabel();
    els.forEach(function(el){ el.textContent = label; });
  }
  window.mocaRefreshWeatherChip = _updateWeather;

  /* ── 날씨 설정 모달 ── */
  window.mocaOpenWeatherSettings = function() {
    var ex = document.getElementById('moca-weather-modal');
    if (ex) ex.remove();
    var w = loadWeather();
    var modal = document.createElement('div');
    modal.id = 'moca-weather-modal';
    modal.className = 'moca-modal-back';
    modal.innerHTML =
      '<div class="moca-modal-card" onclick="event.stopPropagation()">' +
        '<button class="moca-modal-close" aria-label="닫기" onclick="document.getElementById(\'moca-weather-modal\').remove()">✕</button>' +
        '<h3 class="moca-modal-title">🌤 날씨 설정</h3>' +
        '<p class="moca-modal-sub">상단바에 표시할 날씨 정보를 설정합니다. 실제 API는 통합 API 설정에서 관리합니다.</p>' +
        '<div class="moca-modal-form">' +
          '<label class="moca-modal-row"><input type="checkbox" id="mw-enabled" '+(w.enabled?'checked':'')+'> <span>날씨 표시 활성화</span></label>' +
          '<label class="moca-modal-row"><span>지역명</span><input type="text" id="mw-city" value="'+(w.city||'').replace(/"/g,'&quot;')+'" placeholder="예: 화성, 서울, 도쿄"></label>' +
          '<label class="moca-modal-row"><span>국가</span><input type="text" id="mw-country" value="'+(w.country||'KR').replace(/"/g,'&quot;')+'" placeholder="KR / JP / US"></label>' +
          '<label class="moca-modal-row"><span>날씨 API</span>' +
            '<select id="mw-provider">' +
              '<option value="openweather" '+(w.provider==='openweather'?'selected':'')+'>OpenWeather</option>' +
              '<option value="weatherapi" '+(w.provider==='weatherapi'?'selected':'')+'>WeatherAPI</option>' +
              '<option value="tomorrowio" '+(w.provider==='tomorrowio'?'selected':'')+'>Tomorrow.io</option>' +
            '</select>' +
          '</label>' +
          '<div class="moca-modal-hint">💡 API 키는 <button type="button" class="moca-link" onclick="window.openApiSettingsModal && window.openApiSettingsModal(\'upload\');document.getElementById(\'moca-weather-modal\').remove()">통합 API 설정</button>에서 입력하세요.</div>' +
        '</div>' +
        '<div class="moca-modal-actions">' +
          '<button class="moca-btn-secondary" onclick="document.getElementById(\'moca-weather-modal\').remove()">취소</button>' +
          '<button class="moca-btn-primary" onclick="window.mocaSaveWeatherFromModal()">저장</button>' +
        '</div>' +
      '</div>';
    modal.addEventListener('click', function(e){ if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    document.addEventListener('keydown', _wEsc);
  };
  function _wEsc(e){ if (e.key === 'Escape') { var m = document.getElementById('moca-weather-modal'); if (m) m.remove(); document.removeEventListener('keydown', _wEsc); } }
  window.mocaSaveWeatherFromModal = function() {
    var w = loadWeather();
    w.enabled  = !!(document.getElementById('mw-enabled')||{}).checked;
    w.city     = (document.getElementById('mw-city')||{}).value || '';
    w.country  = (document.getElementById('mw-country')||{}).value || 'KR';
    w.provider = (document.getElementById('mw-provider')||{}).value || 'openweather';
    saveWeather(w);
    document.getElementById('moca-weather-modal')?.remove();
    _updateWeather();
    if (typeof ucShowToast === 'function') ucShowToast('🌤 날씨 설정 저장됨','success');
  };

  /* ── CSS ── */
  function _injectCSS() {
    if (document.getElementById('moca-weather-style')) return;
    var st = document.createElement('style');
    st.id = 'moca-weather-style';
    st.textContent =
      /* chip 공통 — 헤더 안 정적 배치 */
      '.moca-chip{display:inline-flex;align-items:center;gap:5px;height:34px;padding:0 12px;'+
        'border:1.5px solid var(--line,#e9e4f3);background:#fff;color:#5a4a56;border-radius:999px;'+
        'font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;transition:.12s}'+
      '.moca-chip:hover{border-color:#9181ff;color:#9181ff;background:#f5f0ff}'+
      '.moca-chip-dt{cursor:default;background:#fafafe}'+
      '.moca-chip-ico{font-size:14px}'+
      '@media(max-width:760px){'+
        '.moca-chip{padding:0 10px}'+
        '.moca-chip-dt [data-dt-label]{font-size:11px}'+
        '.moca-chip-w [data-w-label]::first-letter{}'+
        /* 모바일에서 datetime은 시간만 보이게 — JS에서 처리하지 않고 CSS로 텍스트 자르기 어려워서 JS에서 갱신 */
      '}'+
      /* 모달 공통 */
      '.moca-modal-back{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:20000;display:flex;align-items:center;justify-content:center;padding:20px}'+
      '.moca-modal-card{background:#fff;border-radius:18px;padding:24px;max-width:480px;width:100%;max-height:84vh;overflow-y:auto;position:relative;box-shadow:0 12px 40px rgba(0,0,0,.25);font-family:inherit}'+
      '.moca-modal-close{position:absolute;top:14px;right:14px;border:none;background:#eee;border-radius:999px;padding:6px 12px;font-weight:800;cursor:pointer}'+
      '.moca-modal-title{margin:0 0 6px;font-size:18px;font-weight:900;color:#2b2430}'+
      '.moca-modal-sub{margin:0 0 16px;font-size:12px;color:#7b6080;line-height:1.5}'+
      '.moca-modal-form{display:flex;flex-direction:column;gap:10px}'+
      '.moca-modal-row{display:flex;align-items:center;gap:10px;font-size:12.5px;font-weight:700;color:#3a3040}'+
      '.moca-modal-row input[type=text],.moca-modal-row select{flex:1;border:1.5px solid var(--line,#e9e4f3);border-radius:8px;padding:7px 10px;font-size:12.5px;font-family:inherit}'+
      '.moca-modal-row input[type=checkbox]{accent-color:#ef6fab}'+
      '.moca-modal-row span{min-width:80px}'+
      '.moca-modal-hint{font-size:11.5px;color:#7b6080;background:#f8f5fc;border-radius:8px;padding:8px 10px;line-height:1.5}'+
      '.moca-link{border:none;background:transparent;color:#9181ff;font-weight:800;cursor:pointer;text-decoration:underline;padding:0;font-family:inherit;font-size:inherit}'+
      '.moca-modal-actions{display:flex;gap:8px;margin-top:16px;justify-content:flex-end}'+
      '.moca-btn-primary{background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border:none;border-radius:999px;padding:8px 18px;font-size:12.5px;font-weight:800;cursor:pointer;font-family:inherit}'+
      '.moca-btn-secondary{background:#eee;color:#555;border:none;border-radius:999px;padding:8px 18px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit}';
    document.head.appendChild(st);
  }

  /* ── 모바일에서 datetime label 짧게 ── */
  function _adjustDateTimeMobile() {
    var els = document.querySelectorAll('[data-moca-datetime-chip] [data-dt-label]');
    if (!els.length) return;
    var isMobile = window.matchMedia && window.matchMedia('(max-width:760px)').matches;
    els.forEach(function(el){
      var full  = el.getAttribute('data-full');
      var short = el.getAttribute('data-short');
      if (full && short) el.textContent = isMobile ? short : full;
    });
  }

  /* ── 초기화 ── */
  function _init() {
    _injectCSS();
    /* 헤더가 아직 없을 수 있으니 약간 지연 + 재시도 */
    var tries = 0;
    function tryMount() {
      var ok = _ensureDateTimeChip() !== false;
      ok = _ensureWeatherChip() !== false && ok;
      _adjustDateTimeMobile();
      if (!ok && tries++ < 6) setTimeout(tryMount, 100);
    }
    tryMount();
    /* 1분마다 시간 갱신 */
    setInterval(function(){ _updateDateTime(); _adjustDateTimeMobile(); }, 60 * 1000);
    /* resize 시 모바일 ↔ 데스크톱 전환 */
    window.addEventListener('resize', _adjustDateTimeMobile);
    try { console.log('[topnav] datetime+weather chips ready'); } catch(_) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _init);
  else _init();
})();
