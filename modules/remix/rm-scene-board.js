/* ================================================
   modules/remix/rm-scene-board.js
   영상 리믹스 스튜디오 — Scene 보드 진입점 (얇은 wrapper)

   * 1000+ 줄 분리 후 wrapper 역할만 담당.
     - rm-scene-board-render.js  (window._rmBoardRender)
     - rm-scene-board-actions.js (window.rm* 핸들러 + window._rmMaybeAutoParse)
   * 이 파일은 RM_BOARD = { render } 공개 API 만 정의.
   * engines/remix/index.html 가 다음 순서로 로드:
       1) rm-scene-board-render.js
       2) rm-scene-board-actions.js
       3) rm-scene-board.js (이 파일)
   ================================================ */
(function(){
  'use strict';

  function render(rootId) {
    if (typeof window._rmBoardRender !== 'function') {
      var root = document.getElementById(rootId || 'rm-root');
      if (root) {
        root.innerHTML = '<div style="padding:24px;background:#fee2e2;color:#991b1b;border-radius:10px">' +
          '<b>⚠️ rm-scene-board-render.js 미로드</b><br>script 태그 순서를 확인하세요.</div>';
      }
      return;
    }
    return window._rmBoardRender(rootId);
  }

  window.RM_BOARD = { render: render };
})();
