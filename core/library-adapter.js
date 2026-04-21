/* library-adapter.js
   엔진 페이지에서 보관함(내 보관함, index.html)에 결과를 자동저장하는 경량 어댑터.
   - localStorage 키는 허브와 공유: lib_history_v1, lib_trash_v1, lib_projects_v1
   - 사용: LibraryAdapter.save({text, category, lang, title, meta})
   - 토스트: LibraryAdapter.toast('메시지')
*/
(function(){
  var LS_HIST='lib_history_v1', LS_TRASH='lib_trash_v1';
  var LIMIT=20;
  function now(){ return Date.now(); }
  function uid(){ return 'r'+now().toString(36)+Math.random().toString(36).slice(2,6); }
  function read(k,d){ try{ return JSON.parse(localStorage.getItem(k)||JSON.stringify(d)); }catch(_){ return d; } }
  function write(k,v){
    try{ localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch(e){
      var h=read(LS_HIST,[]); if(h.length>5) localStorage.setItem(LS_HIST, JSON.stringify(h.slice(0,10)));
      localStorage.setItem(LS_TRASH, '[]');
      try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(_){ return false; }
    }
  }
  function titleFromText(t){
    if(!t) return '(제목 없음)';
    var first = String(t).split('\n').map(function(s){return s.trim();}).find(function(s){return s && s.length>2;}) || '';
    return (first.replace(/[#*>`_~\-=]+/g,'').trim().slice(0,60)) || '(제목 없음)';
  }

  var Adapter = {
    save: function(opts){
      opts = opts||{};
      var text = opts.text;
      if(!text || typeof text!=='string') return null;
      var list = read(LS_HIST, []);
      var item = {
        id: uid(),
        createdAt: now(),
        category: opts.category || 'other',
        lang: opts.lang || 'ko',
        title: opts.title || titleFromText(text),
        text: text,
        chars: text.length,
        favorite: false,
        projectId: opts.projectId || null,
        meta: opts.meta || {}
      };
      list.unshift(item);
      write(LS_HIST, list.slice(0, LIMIT));
      Adapter.toast('✅ 보관함에 자동저장 됐어요!');
      return item.id;
    },
    toast: function(msg){
      var el = document.getElementById('libAdapterToast');
      if(!el){
        el = document.createElement('div');
        el.id = 'libAdapterToast';
        el.style.cssText = 'position:fixed;right:20px;bottom:20px;padding:12px 18px;border-radius:14px;'+
          'background:linear-gradient(135deg,#ef6fab,#9181ff);color:#fff;font-weight:800;font-size:13px;'+
          'box-shadow:0 10px 26px rgba(126,87,110,.3);opacity:0;transform:translateY(10px);'+
          'transition:.25s;pointer-events:none;z-index:99999;font-family:Pretendard,Inter,"Noto Sans KR",sans-serif';
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.style.opacity = '1'; el.style.transform = 'translateY(0)';
      clearTimeout(Adapter._tt);
      Adapter._tt = setTimeout(function(){
        el.style.opacity = '0'; el.style.transform = 'translateY(10px)';
      }, 2400);
    },
    getReusePayload: function(){
      try{
        var raw = sessionStorage.getItem('lib_reuse_payload');
        if(!raw) return null;
        sessionStorage.removeItem('lib_reuse_payload');
        return JSON.parse(raw);
      }catch(_){ return null; }
    }
  };
  window.LibraryAdapter = Adapter;
})();
