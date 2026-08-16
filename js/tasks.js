(function (MBS) {
  function TaskManager() {
    this.level = MBS.getLevel(1);
    this.phase = 'dig';
    this.digCount = 0;
    this.loadCount = 0;
    this.pourCount = 0;
    this.wallCount = 0;
    this.finishCount = 0;
    this.unloaded = false;
    this.hint = this.level.hintTask;
  }

  TaskManager.prototype.registerSuccessfulDig = function () {
    if (this.phase !== 'dig' || this.digCount >= this.level.digTarget) {
      return { counted: false, completed: this.digCount >= this.level.digTarget, count: this.digCount };
    }

    this.digCount = MBS.nextCount(this.digCount, this.level.digTarget);
    var completed = this.digCount >= this.level.digTarget;
    this.hint = completed
      ? this.level.hintDone
      : this.level.hintCount(this.digCount, this.level.digTarget);

    return {
      counted: true,
      completed: completed,
      count: this.digCount,
    };
  };

  TaskManager.prototype.startLoadPhase = function () {
    this.phase = 'load';
    this.hint = this.level.hintLoad;
  };

  TaskManager.prototype.registerSuccessfulLoad = function () {
    if (this.phase !== 'load' || this.loadCount >= this.level.loadTarget) {
      return { counted: false, completed: this.loadCount >= this.level.loadTarget, count: this.loadCount };
    }

    this.loadCount = MBS.nextCount(this.loadCount, this.level.loadTarget);
    var completed = this.loadCount >= this.level.loadTarget;
    if (completed) {
      this.phase = 'unload';
      this.hint = this.level.hintHaul;
    } else {
      this.hint = this.level.hintLoadCount(this.loadCount, this.level.loadTarget);
    }

    return {
      counted: true,
      completed: completed,
      count: this.loadCount,
    };
  };

  TaskManager.prototype.registerSuccessfulUnload = function () {
    if (this.phase !== 'unload' || this.unloaded) {
      return { counted: false, completed: this.unloaded };
    }

    this.unloaded = true;
    this.hint = this.level.hintUnloadDone;
    return { counted: true, completed: true };
  };

  TaskManager.prototype.startPourPhase = function () {
    this.phase = 'pour';
    this.hint = this.level.hintPour;
  };

  TaskManager.prototype.registerSuccessfulPour = function () {
    var target = this.level.pourTarget || 3;
    if (this.phase !== 'pour' || this.pourCount >= target) {
      return { counted: false, completed: this.pourCount >= target, count: this.pourCount };
    }

    this.pourCount = MBS.nextCount(this.pourCount, target);
    var completed = this.pourCount >= target;
    this.hint = completed
      ? this.level.hintPourDone
      : this.level.hintPourCount(this.pourCount, target);

    return {
      counted: true,
      completed: completed,
      count: this.pourCount,
    };
  };

  TaskManager.prototype.startWallsPhase = function () {
    this.phase = 'walls';
    this.hint = this.level.hintWalls;
  };

  TaskManager.prototype.registerSuccessfulWall = function () {
    var target = this.level.wallTarget || 5;
    if (this.phase !== 'walls' || this.wallCount >= target) {
      return { counted: false, completed: this.wallCount >= target, count: this.wallCount };
    }

    this.wallCount = MBS.nextCount(this.wallCount, target);
    var completed = this.wallCount >= target;
    this.hint = completed
      ? this.level.hintWallsDone
      : this.level.hintWallsCount(this.wallCount, target);

    return {
      counted: true,
      completed: completed,
      count: this.wallCount,
    };
  };

  TaskManager.prototype.startFinishPhase = function () {
    this.phase = 'finish';
    this.hint = this.level.hintFinish;
  };

  TaskManager.prototype.registerSuccessfulFinish = function () {
    var target = this.level.finishTarget || 5;
    if (this.phase !== 'finish' || this.finishCount >= target) {
      return { counted: false, completed: this.finishCount >= target, count: this.finishCount };
    }

    this.finishCount = MBS.nextCount(this.finishCount, target);
    var completed = this.finishCount >= target;
    this.hint = completed
      ? this.level.hintFinishDone
      : this.level.hintFinishCount(this.finishCount, target);

    if (completed) {
      this.phase = 'done';
    }

    return {
      counted: true,
      completed: completed,
      count: this.finishCount,
    };
  };

  MBS.TaskManager = TaskManager;
})(window.MBS = window.MBS || {});
