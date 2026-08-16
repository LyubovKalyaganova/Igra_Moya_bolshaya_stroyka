(function (MBS) {
  function formatCount(current, target) {
    return current + ' / ' + target;
  }

  function nextCount(current, target) {
    return Math.min(target, current + 1);
  }

  MBS.formatCount = formatCount;
  MBS.nextCount = nextCount;
})(window.MBS = window.MBS || {});
