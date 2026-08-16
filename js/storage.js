(function (MBS) {
  var STORAGE_KEY = 'my-big-construction-progress';

  function emptyProgress() {
    return {
      stars: 0,
      completedLevels: [],
      digsOnLevel1: 0,
      soundVolume: 0.8,
      soundMuted: false,
    };
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return emptyProgress();
      }
      return Object.assign(emptyProgress(), JSON.parse(raw));
    } catch (error) {
      return emptyProgress();
    }
  }

  function saveProgress(progress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      // localStorage может быть недоступен в приватном режиме
    }
  }

  MBS.loadProgress = loadProgress;
  MBS.saveProgress = saveProgress;
})(window.MBS = window.MBS || {});
