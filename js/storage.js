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
    var progress = emptyProgress();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return progress;
      }
      var saved = JSON.parse(raw);
      if (typeof saved.soundVolume === 'number') {
        progress.soundVolume = saved.soundVolume;
      }
      progress.soundMuted = !!saved.soundMuted;
    } catch (error) {
      return emptyProgress();
    }
    return progress;
  }

  function saveProgress(progress) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          soundVolume: progress.soundVolume,
          soundMuted: !!progress.soundMuted,
        }),
      );
    } catch (error) {
      // localStorage может быть недоступен в приватном режиме
    }
  }

  MBS.loadProgress = loadProgress;
  MBS.saveProgress = saveProgress;
})(window.MBS = window.MBS || {});
