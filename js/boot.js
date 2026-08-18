(function () {
  var CACHE = 'play5';
  var FILES = [
    'js/vendor/three.min.js',
    'js/utils.js?v=' + CACHE,
    'js/math.js?v=' + CACHE,
    'js/levels.js?v=' + CACHE,
    'js/storage.js?v=' + CACHE,
    'js/rewards.js?v=' + CACHE,
    'js/tasks.js?v=' + CACHE,
    'js/player.js?v=' + CACHE,
    'js/audio.js?v=' + CACHE,
    'js/ui.js?v=' + CACHE,
    'js/world.js?v=' + CACHE,
    'js/vehicles.js?v=' + CACHE,
    'js/game.js?v=' + CACHE,
    'js/main.js?v=' + CACHE,
  ];
  var THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js';

  function showBootError() {
    var box = document.getElementById('boot-error');
    if (box) {
      box.hidden = false;
    }
  }

  function loadScript(src, ok, fail) {
    var el = document.createElement('script');
    el.src = src;
    el.async = false;
    el.onload = ok;
    el.onerror = fail;
    document.body.appendChild(el);
  }

  function loadAt(index) {
    if (index >= FILES.length) {
      return;
    }
    loadScript(
      FILES[index],
      function () {
        loadAt(index + 1);
      },
      function () {
        if (index === 0 && !window.THREE) {
          loadScript(
            THREE_CDN,
            function () {
              loadAt(1);
            },
            showBootError,
          );
          return;
        }
        showBootError();
      },
    );
  }

  function start() {
    window.setTimeout(function () {
      loadAt(0);
    }, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
