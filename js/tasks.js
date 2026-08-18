(function (MBS) {
  function TaskManager() {
    this.level = MBS.getLevel(1);
    this.phase = 'dig';
    this.digCount = 0;
    this.loadCount = 0;
    this.pourCount = 0;
    this.wallCount = 0;
    this.finishCount = 0;
    this.gradeCount = 0;
    this.gravelCount = 0;
    this.rollCount = 0;
    this.bridgeCount = 0;
    this.playCount = 0;
    this.benchCount = 0;
    this.treeCount = 0;
    this.lampCount = 0;
    this.unloaded = false;
    this.gravelUnloaded = false;
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

  TaskManager.prototype._countStep = function (phase, key, target, hintCount, hintDone) {
    if (this.phase !== phase || this[key] >= target) {
      return { counted: false, completed: this[key] >= target, count: this[key] };
    }
    this[key] = MBS.nextCount(this[key], target);
    var completed = this[key] >= target;
    this.hint = completed ? hintDone : hintCount(this[key], target);
    return { counted: true, completed: completed, count: this[key] };
  };

  TaskManager.prototype.startGradePhase = function () {
    this.phase = 'grade';
    this.hint = this.level.hintGrade;
  };

  TaskManager.prototype.registerSuccessfulGrade = function () {
    return this._countStep(
      'grade',
      'gradeCount',
      this.level.gradeTarget || 3,
      this.level.hintGradeCount,
      this.level.hintGradeDone,
    );
  };

  TaskManager.prototype.startGravelLoadPhase = function () {
    this.phase = 'gravelLoad';
    this.hint = this.level.hintGravel;
  };

  TaskManager.prototype.registerSuccessfulGravelLoad = function () {
    var result = this._countStep(
      'gravelLoad',
      'gravelCount',
      this.level.gravelTarget || 3,
      this.level.hintGravelCount,
      this.level.hintGravelHaul,
    );
    if (result.counted && result.completed) {
      this.phase = 'gravelUnload';
      this.hint = this.level.hintGravelHaul;
    }
    return result;
  };

  TaskManager.prototype.registerSuccessfulGravelUnload = function () {
    if (this.phase !== 'gravelUnload' || this.gravelUnloaded) {
      return { counted: false, completed: this.gravelUnloaded };
    }
    this.gravelUnloaded = true;
    this.hint = this.level.hintGravelUnloadDone;
    return { counted: true, completed: true };
  };

  TaskManager.prototype.startRollPhase = function () {
    this.phase = 'roll';
    this.hint = this.level.hintRoll;
  };

  TaskManager.prototype.registerSuccessfulRoll = function () {
    return this._countStep(
      'roll',
      'rollCount',
      this.level.rollTarget || 4,
      this.level.hintRollCount,
      this.level.hintRollDone,
    );
  };

  TaskManager.prototype.startBridgePhase = function () {
    this.phase = 'bridge';
    this.hint = this.level.hintBridge;
  };

  TaskManager.prototype.registerSuccessfulBridge = function () {
    return this._countStep(
      'bridge',
      'bridgeCount',
      this.level.bridgeTarget || 4,
      this.level.hintBridgeCount,
      this.level.hintBridgeDone,
    );
  };

  TaskManager.prototype.startPlayPhase = function () {
    this.phase = 'play';
    this.hint = this.level.hintPlay;
  };

  TaskManager.prototype.registerSuccessfulPlay = function () {
    return this._countStep(
      'play',
      'playCount',
      this.level.playTarget || 3,
      this.level.hintPlayCount,
      this.level.hintPlayDone,
    );
  };

  TaskManager.prototype.startBenchPhase = function () {
    this.phase = 'benches';
    this.hint = this.level.hintBenches;
  };

  TaskManager.prototype.registerSuccessfulBench = function () {
    return this._countStep(
      'benches',
      'benchCount',
      this.level.benchTarget || 3,
      this.level.hintBenchesCount,
      this.level.hintBenchesDone,
    );
  };

  TaskManager.prototype.startTreePhase = function () {
    this.phase = 'trees';
    this.hint = this.level.hintTrees;
  };

  TaskManager.prototype.registerSuccessfulTree = function () {
    return this._countStep(
      'trees',
      'treeCount',
      this.level.treeTarget || 4,
      this.level.hintTreesCount,
      this.level.hintTreesDone,
    );
  };

  TaskManager.prototype.startLampPhase = function () {
    this.phase = 'lamps';
    this.hint = this.level.hintLamps;
  };

  TaskManager.prototype.registerSuccessfulLamp = function () {
    return this._countStep(
      'lamps',
      'lampCount',
      this.level.lampTarget || 2,
      this.level.hintLampsCount,
      this.level.hintLampsDone,
    );
  };

  TaskManager.prototype.startMathPhase = function () {
    this.phase = 'math';
    this.hint = this.level.hintMath;
  };

  TaskManager.prototype.startFreePhase = function () {
    this.phase = 'free';
    this.hint = this.level.hintFree;
  };

  MBS.TaskManager = TaskManager;
})(window.MBS = window.MBS || {});
