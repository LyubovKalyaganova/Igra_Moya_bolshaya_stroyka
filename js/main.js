(function (MBS) {
  var root = document.getElementById('app');
  var game = new MBS.Game(root);
  MBS.game = game;
  game.start();
})(window.MBS);
