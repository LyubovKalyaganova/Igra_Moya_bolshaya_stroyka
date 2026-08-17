(function (MBS) {
  function showBootError() {
    var box = document.getElementById('boot-error');
    if (box) {
      box.hidden = false;
    }
  }

  try {
    if (!window.THREE) {
      throw new Error('no-three');
    }
    var root = document.getElementById('app');
    var game = new MBS.Game(root);
    MBS.game = game;
    game.start();
  } catch (err) {
    showBootError();
  }
})(window.MBS);
