(function (MBS) {
  function Rewards(savedStars) {
    this.stars = savedStars || 0;
  }

  Rewards.prototype.addStar = function () {
    this.stars += 1;
    return this.stars;
  };

  MBS.Rewards = Rewards;
})(window.MBS = window.MBS || {});
