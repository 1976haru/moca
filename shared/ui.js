/* shared/ui.js — index.html에서 분리된 공통 UI 유틸 */

/* ─── 9. 통합 토스트 시스템 ─── */
window.mocaToast = function(msg, type, opts){
  type = type || 'info';
  opts = opts || {};
  let host = document.getElementById('moca-toast-host');
  if(!host){
    host = document.createElement('div');
    host.id = 'moca-toast-host';
    host.className = 'moca-toast-host';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = 'moca-toast ' + type;
  const actHtml = opts.action ? '<button class="mt-act" data-action="1">' + opts.actionLabel + '</button>' : '';
  el.innerHTML = '<span>' + msg + '</span>' + actHtml + '<button class="mt-close" data-close="1">✕</button>';
  host.appendChild(el);
  const remove = () => { el.classList.add('fadeout'); setTimeout(()=>el.remove(), 220); };
  el.querySelector('[data-close]').addEventListener('click', remove);
  if(opts.action){
    el.querySelector('[data-action]').addEventListener('click', () => { try{opts.action();}catch(_){}; remove(); });
  }
  setTimeout(remove, opts.duration || (type==='err'?6000:2400));
  return { close: remove };
};

/* ─── API 키 누락 토스트 (alert 대체) ─── */
window.apiKeyMissingToast = function(providerName){
  var t = document.getElementById('api-miss-toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'api-miss-toast';
    t.style.cssText = 'position:fixed;right:16px;top:16px;z-index:9999;background:#2b2430;color:#fff;padding:12px 16px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.25);font-size:13px;font-weight:800;max-width:340px;opacity:0;transition:opacity .2s;display:flex;flex-direction:column;gap:8px';
    document.body.appendChild(t);
  }
  t.innerHTML = '<div style="font-weight:700">⚠️ ' + (providerName ? providerName + ' ' : '') + 'API 키가 없어요.</div><div style="font-size:12px;margin-top:4px;opacity:.85">설정에서 입력해주세요</div><button type="button" onclick="_goToSetting();" style="margin-top:8px;padding:7px 12px;background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;border:none;border-radius:999px;font-weight:900;font-size:12px;cursor:pointer">⚙️ 설정으로 이동</button>';

  t.style.opacity = '1';
  clearTimeout(window._apiMissTimer);
  window._apiMissTimer = setTimeout(function(){ t.style.opacity='0'; }, 4500);
};
