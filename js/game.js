(function (MBS, THREE) {
  function Game(root) {
    this.root = root;
    this.canvas = root.querySelector('#game');
    this.playing = false;
    this.paused = false;
    this.clock = new THREE.Clock();
    this.zoom = 1;
    this.camYaw = 0;
    this.camPitch = 0.28;
    this.camDistance = 18;
    this._lookPointers = {};
    this._lookDragging = false;
    this._lookLastX = 0;
    this._lookLastY = 0;
    this._pinchStartDist = 0;
    this._pinchStartZoom = 1;
    this._cameraFocus = 'vehicle';
    this.lookTarget = new THREE.Vector3();
    this.progress = MBS.loadProgress();
    this.pendingPhase = null;
    this.idleInput = { forward: false, back: false, left: false, right: false };

    this.ui = new MBS.GameUI(root);
    this.input = new MBS.PlayerInput();
    this.tasks = new MBS.TaskManager();
    this.rewards = new MBS.Rewards(this.progress.stars);
    this.audio = new MBS.GameAudio(this.progress);
    this.ui.audio = this.audio;
    this.idleTime = 0;
    this.wasNearAction = false;
    this.mathIndex = 0;

    this._createRenderer();
    this._createScene();
    this._createCamera();
    this._createLights();

    this.site = new MBS.ConstructionSite(this.scene);
    this.excavator = new MBS.Excavator(this.scene);
    this.dumpTruck = new MBS.DumpTruck(this.scene);
    this.mixer = new MBS.ConcreteMixer(this.scene);
    this.crane = new MBS.Crane(this.scene);
    this.bulldozer = new MBS.Bulldozer(this.scene);
    this.roller = new MBS.RoadRoller(this.scene);
    this.activeVehicle = this.excavator;
    this.mathFromMenu = false;
    this.mathResumePhase = null;
    this.mathResumeHint = null;

    var self = this;
    this.excavator.onScoop = function () {
      self._handleScoop();
    };

    this.ui.setHint('Нажми ИГРАТЬ');
    this.ui.setStars(this.rewards.stars);
    this.ui.refreshSoundButtons();
    this.audio.onChange = function (state) {
      self.progress.soundVolume = state.volume;
      self.progress.soundMuted = state.muted;
      MBS.saveProgress(self.progress);
    };
    this._bindUI();
    this._bindResize();
    this._bindZoom();
    this._bindLook();
  }

  Game.prototype.start = function () {
    var self = this;
    this.clock.start();
    this.renderer.setAnimationLoop(function () {
      self._loop();
    });
  };

  Game.prototype._createRenderer = function () {
    var mobile = typeof MBS.isMobile === 'function' ? MBS.isMobile() : false;
    var options = {
      canvas: this.canvas,
      antialias: !mobile,
      alpha: false,
      powerPreference: mobile ? 'low-power' : 'high-performance',
      failIfMajorPerformanceCaveat: false,
    };
    try {
      this.renderer = new THREE.WebGLRenderer(options);
    } catch (err) {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: false,
        alpha: false,
      });
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.15 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.shadowMap.enabled = !mobile;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.SRGBColorSpace) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    if (mobile) {
      this.renderer.toneMapping = THREE.NoToneMapping;
      this.renderer.shadowMap.enabled = false;
    } else {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.08;
    }
  };

  Game.prototype._createScene = function () {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8fd6f2);
    this.scene.fog = new THREE.Fog(0x8fd6f2, 48, 105);
  };

  Game.prototype._createCamera = function () {
    this.camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 200);
    this.camera.position.set(8, 6, 16);
    this.lookTarget.set(0, 1.2, 0);
    this.camera.lookAt(this.lookTarget);
    this._applyViewSize();
  };

  Game.prototype._createLights = function () {
    var hemi = new THREE.HemisphereLight(0xb8ecff, 0x8d6a46, 0.9);
    this.scene.add(hemi);

    var sun = new THREE.DirectionalLight(0xfff3d0, 1.35);
    sun.position.set(22, 32, 14);
    sun.castShadow = !MBS.isMobile();
    sun.shadow.mapSize.set(MBS.isMobile() ? 512 : 2048, MBS.isMobile() ? 512 : 2048);
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -32;
    sun.shadow.camera.right = 32;
    sun.shadow.camera.top = 32;
    sun.shadow.camera.bottom = -32;
    sun.shadow.bias = -0.0008;
    this.scene.add(sun);

    var fill = new THREE.DirectionalLight(0xc5e8ff, 0.25);
    fill.position.set(-18, 12, -10);
    this.scene.add(fill);
  };

  Game.prototype._bindUI = function () {
    var self = this;
    this.ui.bind();
    this.input.attach();

    this.ui.onPlay = function () {
      self.mathFromMenu = false;
      self.playing = true;
      self.paused = false;
      if (self.tasks.phase === 'math') {
        self.tasks.phase = 'dig';
        self.tasks.hint = self.tasks.level.hintTask;
      }
      self.audio.ensure();
      self.idleTime = 0;
      self.ui.setHint(self.tasks.level.hintTask);
      self.ui.speak(self.tasks.level.voiceStart);
    };

    this.ui.onMathPlay = function () {
      self.mathFromMenu = true;
      self.mathResumePhase = null;
      self.mathResumeHint = null;
      self.playing = true;
      self.audio.ensure();
      self._beginMathPhase();
    };

    this.ui.onHudMath = function () {
      if (!self.playing || self.paused || self.tasks.phase === 'math') {
        return;
      }
      self.mathFromMenu = false;
      self.mathResumePhase = self.tasks.phase;
      self.mathResumeHint = self.tasks.hint;
      self.audio.ensure();
      self._beginMathPhase();
    };

    this.ui.onNext = function () {
      self.paused = false;
      self.input.reset();
      if (self.pendingPhase === 'load') {
        self._beginLoadPhase();
      } else if (self.pendingPhase === 'pour') {
        self._beginPourPhase();
      } else if (self.pendingPhase === 'walls') {
        self._beginWallsPhase();
      } else if (self.pendingPhase === 'finish') {
        self._beginFinishPhase();
      } else if (self.pendingPhase === 'grade') {
        self._beginGradePhase();
      } else if (self.pendingPhase === 'gravel') {
        self._beginGravelPhase();
      } else if (self.pendingPhase === 'roll') {
        self._beginRollPhase();
      } else if (self.pendingPhase === 'bridge') {
        self._beginBridgePhase();
      } else if (self.pendingPhase === 'play') {
        self._beginPlayPhase();
      } else if (self.pendingPhase === 'benches') {
        self._beginBenchPhase();
      } else if (self.pendingPhase === 'trees') {
        self._beginTreePhase();
      } else if (self.pendingPhase === 'lamps') {
        self._beginLampPhase();
      } else if (self.pendingPhase === 'free') {
        self._beginFreeRoam();
      } else if (self.pendingPhase === 'resume') {
        self._resumeAfterMath();
      } else if (self.pendingPhase === 'menu') {
        self._returnToMenu();
      }
      self.idleTime = 0;
      self.pendingPhase = null;
    };

    this.ui.onMoveChange = function (direction, isDown) {
      self.input.setMove(direction, isDown);
    };
    this.ui.onDigPress = function () {
      self.input.pressDig();
    };
    this.ui.onDigRelease = function () {
      self.input.releaseDig();
    };
    this.ui.onVehiclePick = function (name) {
      self._setActiveVehicle(name);
    };
    this.ui.onMathAnswer = function (value, question, button) {
      self._handleMathAnswer(value, question, button);
    };
    this.ui.onPlayPick = function (track) {
      self._pickPlayTrack(track);
    };
  };

  Game.prototype._viewSize = function () {
    var view = window.visualViewport;
    if (view && view.width && view.height) {
      return { width: Math.round(view.width), height: Math.round(view.height) };
    }
    return { width: window.innerWidth, height: window.innerHeight };
  };

  Game.prototype._applyViewSize = function () {
    var size = this._viewSize();
    var width = Math.max(1, size.width);
    var height = Math.max(1, size.height);
    this.camera.aspect = width / height;
    this.camera.fov = width < height ? 54 : 48;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
  };

  Game.prototype._bindResize = function () {
    var self = this;
    var onResize = function () {
      self._applyViewSize();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', function () {
      window.setTimeout(onResize, 120);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize);
    }
  };

  Game.prototype._bindZoom = function () {
    var self = this;
    this.canvas.addEventListener(
      'wheel',
      function (event) {
        event.preventDefault();
        self.zoom = MBS.clamp(self.zoom + event.deltaY * 0.0012, 0.62, 1.7);
      },
      { passive: false },
    );
  };

  Game.prototype._bindLook = function () {
    var self = this;

    function isLookTarget(el) {
      if (!el || !el.closest) {
        return true;
      }
      if (el.closest('button')) {
        return false;
      }
      if (el.closest('#controls') || el.closest('#vehicle-bar') || el.closest('#sound-controls')) {
        return false;
      }
      if (el.closest('#start-screen') && !self.startHidden()) {
        return false;
      }
      if (el.closest('#reward-screen.is-visible')) {
        return false;
      }
      if (el.closest('#math-screen.is-visible')) {
        return false;
      }
      return true;
    }

    function startLook(x, y) {
      self._lookDragging = true;
      self._lookLastX = x;
      self._lookLastY = y;
      self.canvas.classList.add('is-looking');
    }

    function moveLook(x, y) {
      if (!self._lookDragging) {
        return;
      }
      var dx = x - self._lookLastX;
      var dy = y - self._lookLastY;
      self._lookLastX = x;
      self._lookLastY = y;
      self.camYaw -= dx * 0.006;
      self.camPitch = MBS.clamp(self.camPitch + dy * 0.0048, 0.06, 1.12);
    }

    function endLook() {
      self._lookDragging = false;
      self.canvas.classList.remove('is-looking');
    }

    window.addEventListener('mousedown', function (event) {
      if (event.button !== 0 || !isLookTarget(event.target)) {
        return;
      }
      event.preventDefault();
      startLook(event.clientX, event.clientY);
    });
    window.addEventListener('mousemove', function (event) {
      moveLook(event.clientX, event.clientY);
    });
    window.addEventListener('mouseup', endLook);

    window.addEventListener(
      'touchstart',
      function (event) {
        if (!isLookTarget(event.target) || event.touches.length !== 1) {
          if (event.touches.length === 2) {
            self._lookDragging = false;
            var a = event.touches[0];
            var b = event.touches[1];
            self._pinchStartDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            self._pinchStartZoom = self.zoom;
          }
          return;
        }
        startLook(event.touches[0].clientX, event.touches[0].clientY);
      },
      { passive: true },
    );
    window.addEventListener(
      'touchmove',
      function (event) {
        if (event.touches.length >= 2) {
          var a = event.touches[0];
          var b = event.touches[1];
          var dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
          if (self._pinchStartDist > 8 && dist > 8) {
            self.zoom = MBS.clamp(self._pinchStartZoom * (self._pinchStartDist / dist), 0.62, 1.7);
          }
          return;
        }
        if (event.touches.length === 1) {
          moveLook(event.touches[0].clientX, event.touches[0].clientY);
        }
      },
      { passive: true },
    );
    window.addEventListener('touchend', function (event) {
      if (event.touches.length === 0) {
        endLook();
      }
    });
  };

  Game.prototype.startHidden = function () {
    return this.ui.startScreen.classList.contains('is-hidden');
  };

  Game.prototype._loop = function () {
    var dt = Math.min(this.clock.getDelta(), 0.05);
    var time = this.clock.elapsedTime;

    if (this.playing && !this.paused) {
      if (this.input.consumeDigPress()) {
        this._tryAction();
      }
      this.activeVehicle.update(dt, this.input, this.site.bounds, this._obstaclesFor(this.activeVehicle));
      this._updateCoach(dt);
    } else {
      if (this.excavator.digging) {
        this.excavator.update(dt, this.idleInput, this.site.bounds, this._obstaclesFor(this.excavator));
      }
      if (this.dumpTruck.busy) {
        this.dumpTruck.update(dt, this.idleInput, this.site.bounds, this._obstaclesFor(this.dumpTruck));
      }
      if (this.mixer.busy) {
        this.mixer.update(dt, this.idleInput, this.site.bounds, this._obstaclesFor(this.mixer));
      }
      if (this.crane.busy) {
        this.crane.update(dt, this.idleInput, this.site.bounds, this._obstaclesFor(this.crane));
      }
      if (this.bulldozer.busy) {
        this.bulldozer.update(dt, this.idleInput, this.site.bounds, this._obstaclesFor(this.bulldozer));
      }
      if (this.roller.busy) {
        this.roller.update(dt, this.idleInput, this.site.bounds, this._obstaclesFor(this.roller));
      }
    }

    if (
      !(this.playing && !this.paused && this.activeVehicle === this.mixer) &&
      !this.mixer.busy
    ) {
      this.mixer.spinDrum(dt);
    }

    this.site.update(time);
    this._updateCamera(dt);
    this._updateActionButton();
    this._updateAudio(dt);
    this.renderer.render(this.scene, this.camera);
  };

  Game.prototype._tryAction = function () {
    var phase = this.tasks.phase;
    if (phase === 'dig') {
      this._tryDig();
    } else if (phase === 'load') {
      this._tryLoad();
    } else if (phase === 'unload') {
      this._tryUnload();
    } else if (phase === 'pour') {
      this._tryPour();
    } else if (phase === 'walls') {
      this._tryPlaceWall();
    } else if (phase === 'finish') {
      this._tryPlaceHousePart();
    } else if (phase === 'grade') {
      this._tryGrade();
    } else if (phase === 'gravelLoad') {
      this._tryGravelLoad();
    } else if (phase === 'gravelUnload') {
      this._tryGravelUnload();
    } else if (phase === 'roll') {
      this._tryRoll();
    } else if (phase === 'bridge') {
      this._tryPlaceBridge();
    } else if (phase === 'play') {
      this._tryPlacePlay();
    } else if (phase === 'benches') {
      this._tryPlaceBench();
    } else if (phase === 'trees') {
      this._tryPlaceTree();
    } else if (phase === 'lamps') {
      this._tryPlaceLamp();
    } else if (phase === 'free') {
      this.audio.play('horn');
      this.ui.speak('Бип-бип!', { throttleMs: 1800 });
      this.idleTime = 0;
    }
  };

  Game.prototype._tryDig = function () {
    var started = this.excavator.tryDig();
    if (!started) {
      return;
    }

    if (!this._isNearDigZone() && this.tasks.phase === 'dig') {
      this.ui.setHint(this.tasks.level.hintCloser);
      this.ui.speak(this.tasks.level.hintCloser, { throttleMs: 4500 });
    }
    if (started) {
      this.audio.play('dig');
      this.idleTime = 0;
    }
  };

  Game.prototype._handleScoop = function () {
    if (!this._isNearDigZone() || this.tasks.phase !== 'dig') {
      return;
    }

    var result = this.tasks.registerSuccessfulDig();
    if (!result.counted) {
      return;
    }

    this.site.deepenPit();
    this.ui.showCount(result.count);
    this.ui.setHint(this.tasks.hint);
    this.ui.speakCount(result.count);
    if (result.completed) {
      this._completeTask(1, this.tasks.level.rewardDigTitle, this.tasks.level.rewardDigText, 'load');
    }
  };

  Game.prototype._tryLoad = function () {
    if (!this._isNearDigZone()) {
      this.ui.setHint(this.tasks.level.hintLoadCloser);
      this.ui.speak(this.tasks.level.hintLoadCloser, { throttleMs: 4500 });
      return;
    }

    if (!this.dumpTruck.tryLoad()) {
      return;
    }

    this.audio.play('load');
    this.idleTime = 0;

    this.site.takeDirtPile();
    var result = this.tasks.registerSuccessfulLoad();
    if (!result.counted) {
      return;
    }

    this.ui.showCount(result.count);
    this.ui.setHint(this.tasks.hint);
    this.ui.speakCount(result.count);
    if (result.completed) {
      this.ui.speak(this.tasks.level.voiceHaul, { queue: true });
      this.site.showDumpMarker();
      this.ui.setAction('⬇️', 'ВЫГРУЗИТЬ');
      this.wasNearAction = false;
    }
  };

  Game.prototype._tryUnload = function () {
    if (!this._isNearDumpZone()) {
      this.ui.setHint(this.tasks.level.hintUnloadCloser);
      this.ui.speak(this.tasks.level.hintUnloadCloser, { throttleMs: 4500 });
      return;
    }

    var self = this;
    this.dumpTruck.onUnloaded = function () {
      self._handleUnload();
    };
    if (this.dumpTruck.tryUnload()) {
      this.audio.play('unload');
      this.idleTime = 0;
    }
  };

  Game.prototype._handleUnload = function () {
    var result = this.tasks.registerSuccessfulUnload();
    if (!result.counted) {
      return;
    }

    this.site.placeDumpedDirt();
    this.ui.setHint(this.tasks.hint);
    this._completeTask(2, this.tasks.level.rewardHaulTitle, this.tasks.level.rewardHaulText, 'pour');
  };

  Game.prototype._completeTask = function (levelId, title, text, nextPhase, rewardKind) {
    this.paused = true;
    this.input.reset();
    this.pendingPhase = nextPhase;

    var self = this;
    window.setTimeout(function () {
      self.rewards.addStar();
      self.ui.setStars(self.rewards.stars);
      self.progress.stars = self.rewards.stars;
      var levels = self.progress.completedLevels || [];
      if (levels.indexOf(levelId) === -1) {
        levels.push(levelId);
      }
      self.progress.completedLevels = levels;
      MBS.saveProgress(self.progress);
      self.ui.showReward(self.rewards.stars, title, text, rewardKind);
    }, 1200);
  };

  Game.prototype._beginLoadPhase = function () {
    this.excavator.group.position.set(-6.8, 0, 6.2);
    this.excavator.group.rotation.y = 0.4;
    this.activeVehicle = this.dumpTruck;
    this.tasks.startLoadPhase();
    this.wasNearAction = false;
    this.idleTime = 0;
    this.ui.setAction('📦', 'ЗАГРУЗИТЬ');
    this.ui.setHint(this.tasks.level.hintLoad);
    this.ui.speak(this.tasks.level.voiceLoad);
  };

  Game.prototype._beginPourPhase = function () {
    this.dumpTruck.group.position.set(16.5, 0, 9);
    this.dumpTruck.group.rotation.y = 0.4;
    this.excavator.group.position.set(-7.2, 0, 7.4);
    this.activeVehicle = this.mixer;
    this.tasks.startPourPhase();
    this.wasNearAction = false;
    this.idleTime = 0;
    this.site.setPourMode();
    this.ui.setAction('💧', 'ЗАЛИТЬ');
    this.ui.setHint(this.tasks.level.hintPour);
    this.ui.speak(this.tasks.level.voicePour);
  };

  Game.prototype._tryPour = function () {
    if (!this._isNearDigZone()) {
      this.ui.setHint(this.tasks.level.hintPourCloser);
      this.ui.speak(this.tasks.level.hintPourCloser, { throttleMs: 4500 });
      return;
    }

    var self = this;
    if (!this.mixer.tryPour()) {
      return;
    }
    this.audio.play('pour');
    this.idleTime = 0;
    this.mixer.onPoured = function () {
      self._handlePour();
    };
  };

  Game.prototype._handlePour = function () {
    var result = this.tasks.registerSuccessfulPour();
    if (!result.counted) {
      return;
    }

    this.site.pourNextSection();
    this.ui.showCount(result.count);
    this.ui.setHint(this.tasks.hint);
    this.ui.speakCount(result.count);
    if (result.completed) {
      this._completeTask(3, this.tasks.level.rewardPourTitle, this.tasks.level.rewardPourText, 'walls');
    }
  };

  Game.prototype._beginWallsPhase = function () {
    this.mixer.group.position.set(-16.5, 0, 8.5);
    this.mixer.group.rotation.y = 0.5;
    this.dumpTruck.group.position.set(16.5, 0, 9);
    this.excavator.group.position.set(-7.2, 0, 7.4);
    this.activeVehicle = this.crane;
    this.tasks.startWallsPhase();
    this.wasNearAction = false;
    this.idleTime = 0;
    this.site.setWallMode();
    this._focusOnHouse();
    this.ui.setAction('🧱', 'УСТАНОВИТЬ');
    this.ui.setHint(this.tasks.level.hintWalls);
    this.ui.speak(this.tasks.level.voiceWalls);
  };

  Game.prototype._tryPlaceWall = function () {
    if (!this._isNearDigZone()) {
      this.ui.setHint(this.tasks.level.hintWallsCloser);
      this.ui.speak(this.tasks.level.hintWallsCloser, { throttleMs: 4500 });
      return;
    }

    this.crane.setCarriedPart('block');
    this.crane.setCarriedColor(this.site.nextWallColor());
    this.crane.pickX = 6.4;
    this.crane.pickZ = -6.3;
    this.crane.placeX = 0;
    this.crane.placeZ = 0;

    if (!this.crane.tryPlace()) {
      return;
    }

    this.audio.play('crane');
    this.idleTime = 0;
    var self = this;
    this.crane.onPicked = function () {
      self.site.hideNextBlock();
    };
    this.crane.onPlaced = function () {
      self._handleWall();
    };
  };

  Game.prototype._handleWall = function () {
    var result = this.tasks.registerSuccessfulWall();
    if (!result.counted) {
      return;
    }

    this.site.placeNextWall();
    this.ui.showCount(result.count);
    this.ui.setHint(this.tasks.hint);
    this.ui.speakCount(result.count);
    if (result.completed) {
      this._completeTask(4, this.tasks.level.rewardWallsTitle, this.tasks.level.rewardWallsText, 'finish');
    }
  };

  Game.prototype._beginFinishPhase = function () {
    this.activeVehicle = this.crane;
    this.crane.group.position.set(0, 0, 7.6);
    this.crane.group.rotation.y = Math.PI;
    this.tasks.startFinishPhase();
    this.wasNearAction = false;
    this.idleTime = 0;
    this.site.setFinishMode();
    this._focusOnHouse();
    this.ui.setAction('🏠', 'ПОСТАВИТЬ');
    this.ui.setHint(this.tasks.level.hintFinish);
    this.ui.speak(this.tasks.level.voiceFinish);
  };

  Game.prototype._tryPlaceHousePart = function () {
    if (!this._isNearDigZone()) {
      this.ui.setHint(this.tasks.level.hintFinishCloser);
      this.ui.speak(this.tasks.level.hintFinishCloser, { throttleMs: 4500 });
      return;
    }

    this.crane.setCarriedPart(this.site.nextHouseKind());
    this.crane.setCarriedColor(this.site.nextHouseColor());
    this.crane.pickX = 6.6;
    this.crane.pickZ = 5.8;
    this.crane.placeX = 0;
    this.crane.placeZ = 0;

    if (!this.crane.tryPlace()) {
      return;
    }

    this.audio.play('crane');
    this.idleTime = 0;
    var self = this;
    this.crane.onPicked = function () {
      self.site.hideNextHousePart();
    };
    this.crane.onPlaced = function () {
      self._handleHousePart();
    };
  };

  Game.prototype._handleHousePart = function () {
    var result = this.tasks.registerSuccessfulFinish();
    if (!result.counted) {
      return;
    }

    this.site.placeNextHousePart();
    this.ui.showCount(result.count);
    this.ui.setHint(this.tasks.hint);
    this.ui.speakCount(result.count);
    if (result.completed) {
      this._completeTask(5, this.tasks.level.rewardFinishTitle, this.tasks.level.rewardFinishText, 'grade');
    }
  };

  Game.prototype._parkIdleMachines = function () {
    this.excavator.group.position.set(-7.2, 0, 7.4);
    this.mixer.group.position.set(-16.5, 0, 8.5);
  };

  Game.prototype._beginGradePhase = function () {
    this._cameraFocus = 'vehicle';
    this.camPitch = 0.24;
    this._parkIdleMachines();
    this.crane.group.position.set(0, 0, -11.2);
    this.dumpTruck.group.position.set(16.5, 0, 12);
    this.roller.group.position.set(22.8, 0, 13.2);
    this.bulldozer.group.position.set(9.6, 0, 11.4);
    this.bulldozer.group.rotation.y = -Math.PI / 2;
    this.activeVehicle = this.bulldozer;
    this.tasks.startGradePhase();
    this.wasNearAction = false;
    this.idleTime = 0;
    this.site.setGradeMode();
    this.ui.setAction('🚧', 'ТОЛКАТЬ');
    this.ui.setHint(this.tasks.level.hintGrade);
    this.ui.speak(this.tasks.level.voiceGrade);
  };

  Game.prototype._tryGrade = function () {
    if (!this._isNearWorkZone()) {
      this.ui.setHint(this.tasks.level.hintGradeCloser);
      this.ui.speak(this.tasks.level.hintGradeCloser, { throttleMs: 4500 });
      return;
    }
    var self = this;
    this.bulldozer.onPushed = function () {
      self._handleGrade();
    };
    if (!this.bulldozer.tryPush()) {
      return;
    }
    this.audio.play('dig');
    this.idleTime = 0;
  };

  Game.prototype._handleGrade = function () {
    var result = this.tasks.registerSuccessfulGrade();
    if (!result.counted) {
      return;
    }
    this.site.clearNextMound();
    this.ui.showCount(result.count);
    this.ui.setHint(this.tasks.hint);
    this.ui.speakCount(result.count);
    if (result.completed) {
      this._completeTask(6, this.tasks.level.rewardGradeTitle, this.tasks.level.rewardGradeText, 'gravel');
    }
  };

  Game.prototype._beginGravelPhase = function () {
    this._cameraFocus = 'vehicle';
    this.camPitch = 0.24;
    this._parkIdleMachines();
    this.bulldozer.group.position.set(20.5, 0, 16.5);
    this.dumpTruck.group.position.set(6.4, 0, 14.2);
    this.dumpTruck.group.rotation.y = Math.PI;
    this.activeVehicle = this.dumpTruck;
    this.tasks.startGravelLoadPhase();
    this.wasNearAction = false;
    this.idleTime = 0;
    this.site.setGravelLoadMode();
    this.ui.setAction('📦', 'ЗАГРУЗИТЬ');
    this.ui.setHint(this.tasks.level.hintGravel);
    this.ui.speak(this.tasks.level.voiceGravel);
  };

  Game.prototype._tryGravelLoad = function () {
    if (!this.site.isInGravelZone(this.dumpTruck.position.x, this.dumpTruck.position.z)) {
      this.ui.setHint(this.tasks.level.hintGravelCloser);
      this.ui.speak(this.tasks.level.hintGravelCloser, { throttleMs: 4500 });
      return;
    }
    if (!this.dumpTruck.tryLoad()) {
      return;
    }
    this.audio.play('load');
    this.idleTime = 0;
    this.site.takeGravel();
    var result = this.tasks.registerSuccessfulGravelLoad();
    if (!result.counted) {
      return;
    }
    this.ui.showCount(result.count);
    this.ui.setHint(this.tasks.hint);
    this.ui.speakCount(result.count);
    if (result.completed) {
      this.ui.speak(this.tasks.level.voiceGravelHaul, { queue: true });
      this.site.setGravelUnloadMode();
      this.ui.setAction('⬇️', 'ВЫГРУЗИТЬ');
      this.wasNearAction = false;
    }
  };

  Game.prototype._tryGravelUnload = function () {
    if (!this._isNearWorkZone()) {
      this.ui.setHint(this.tasks.level.hintGravelUnloadCloser);
      this.ui.speak(this.tasks.level.hintGravelUnloadCloser, { throttleMs: 4500 });
      return;
    }
    var self = this;
    this.dumpTruck.onUnloaded = function () {
      self._handleGravelUnload();
    };
    if (this.dumpTruck.tryUnload()) {
      this.audio.play('unload');
      this.idleTime = 0;
    }
  };

  Game.prototype._handleGravelUnload = function () {
    var result = this.tasks.registerSuccessfulGravelUnload();
    if (!result.counted) {
      return;
    }
    this.site.placeRoadGravel();
    this.ui.setHint(this.tasks.hint);
    this._completeTask(7, this.tasks.level.rewardGravelTitle, this.tasks.level.rewardGravelText, 'roll');
  };

  Game.prototype._beginRollPhase = function () {
    this._cameraFocus = 'vehicle';
    this.camPitch = 0.24;
    this._parkIdleMachines();
    this.dumpTruck.group.position.set(16.5, 0, 12);
    this.roller.group.position.set(9.6, 0, 11.2);
    this.roller.group.rotation.y = -Math.PI / 2;
    this.activeVehicle = this.roller;
    this.tasks.startRollPhase();
    this.wasNearAction = false;
    this.idleTime = 0;
    this.site.setRollMode();
    this.ui.setAction('🛞', 'КАТИТЬ');
    this.ui.setHint(this.tasks.level.hintRoll);
    this.ui.speak(this.tasks.level.voiceRoll);
  };

  Game.prototype._tryRoll = function () {
    if (!this._isNearWorkZone()) {
      this.ui.setHint(this.tasks.level.hintRollCloser);
      this.ui.speak(this.tasks.level.hintRollCloser, { throttleMs: 4500 });
      return;
    }
    var self = this;
    this.roller.onRolled = function () {
      self._handleRoll();
    };
    if (!this.roller.tryRoll()) {
      return;
    }
    this.audio.play('unload');
    this.idleTime = 0;
  };

  Game.prototype._handleRoll = function () {
    var result = this.tasks.registerSuccessfulRoll();
    if (!result.counted) {
      return;
    }
    this.site.placeNextRoad();
    this.ui.showCount(result.count);
    this.ui.setHint(this.tasks.hint);
    this.ui.speakCount(result.count);
    if (result.completed) {
      this._completeTask(8, this.tasks.level.rewardRollTitle, this.tasks.level.rewardRollText, 'bridge');
    }
  };

  Game.prototype._beginBridgePhase = function () {
    this._cameraFocus = 'vehicle';
    this.camPitch = 0.24;
    this._parkIdleMachines();
    this.roller.group.position.set(22.8, 0, 13.2);
    this.crane.group.position.set(18.4, 0, 10.8);
    this.crane.group.rotation.y = -Math.PI / 2;
    this.activeVehicle = this.crane;
    this.tasks.startBridgePhase();
    this.wasNearAction = false;
    this.idleTime = 0;
    this.site.setBridgeMode();
    this.ui.setAction('🌉', 'УСТАНОВИТЬ');
    this.ui.setHint(this.tasks.level.hintBridge);
    this.ui.speak(this.tasks.level.voiceBridge);
  };

  Game.prototype._tryPlaceBridge = function () {
    if (!this._isNearWorkZone()) {
      this.ui.setHint(this.tasks.level.hintBridgeCloser);
      this.ui.speak(this.tasks.level.hintBridgeCloser, { throttleMs: 4500 });
      return;
    }
    var pile = this.site.bridgePileSpot;
    var spot = this.site.currentBridgeSpot();
    this.crane.setCarriedPart('block');
    this.crane.setCarriedColor(this.site.nextBridgeColor());
    this.crane.pickX = pile.x;
    this.crane.pickZ = pile.z;
    this.crane.placeX = spot.x;
    this.crane.placeZ = spot.z;
    if (!this.crane.tryPlace()) {
      return;
    }
    this.audio.play('crane');
    this.idleTime = 0;
    var self = this;
    this.crane.onPicked = function () {
      self.site.hideNextBridgePart();
    };
    this.crane.onPlaced = function () {
      self._handleBridge();
    };
  };

  Game.prototype._handleBridge = function () {
    var result = this.tasks.registerSuccessfulBridge();
    if (!result.counted) {
      return;
    }
    this.site.placeNextBridge();
    this.ui.showCount(result.count);
    this.ui.setHint(this.tasks.hint);
    this.ui.speakCount(result.count);
    if (result.completed) {
      this._completeTask(9, this.tasks.level.rewardBridgeTitle, this.tasks.level.rewardBridgeText, 'play');
    }
  };

  Game.prototype._beginPlayPhase = function () {
    this._cameraFocus = 'vehicle';
    this.camPitch = 0.24;
    this._parkIdleMachines();
    this.dumpTruck.group.position.set(16.5, 0, 9);
    this.crane.group.position.set(-10.2, 0, -12.4);
    this.crane.group.rotation.y = Math.PI;
    this.activeVehicle = this.crane;
    this.tasks.startPlayPhase();
    this.wasNearAction = false;
    this.idleTime = 0;
    this.site.setPlaygroundMode();
    this.ui.setAction('🎠', 'УСТАНОВИТЬ');
    this.ui.setHint(this.tasks.level.hintPlay);
    this.ui.speak(this.tasks.level.voicePlayground);
  };

  Game.prototype._tryPlacePlay = function () {
    if (!this._isNearWorkZone()) {
      this.ui.setHint(this.tasks.level.hintPlayCloser);
      this.ui.speak(this.tasks.level.hintPlayCloser, { throttleMs: 4500 });
      return;
    }
    var pile = this.site.playPileSpot;
    var spot = this.site.currentPlaySpot();
    this.crane.setCarriedPart('block');
    this.crane.setCarriedColor(this.site.nextPlayColor());
    this.crane.pickX = pile.x;
    this.crane.pickZ = pile.z;
    this.crane.placeX = spot.x;
    this.crane.placeZ = spot.z;
    if (!this.crane.tryPlace()) {
      return;
    }
    this.audio.play('crane');
    this.idleTime = 0;
    var self = this;
    this.crane.onPicked = function () {
      self.site.hideNextPlayPart();
    };
    this.crane.onPlaced = function () {
      self._handlePlay();
    };
  };

  Game.prototype._handlePlay = function () {
    var result = this.tasks.registerSuccessfulPlay();
    if (!result.counted) {
      return;
    }
    this.site.placeNextPlayItem();
    this.ui.showCount(result.count);
    this.ui.setHint(this.tasks.hint);
    this.ui.speakCount(result.count);
    if (result.completed) {
      this._completeTask(10, this.tasks.level.rewardPlayTitle, this.tasks.level.rewardPlayText, 'benches');
    }
  };

  Game.prototype._beginBenchPhase = function () {
    this._cameraFocus = 'vehicle';
    this.activeVehicle = this.crane;
    this.tasks.startBenchPhase();
    this.wasNearAction = false;
    this.idleTime = 0;
    this.site.setBenchMode();
    this.ui.setAction('🪑', 'УСТАНОВИТЬ');
    this.ui.setHint(this.tasks.level.hintBenches);
    this.ui.speak(this.tasks.level.voiceBenches);
  };

  Game.prototype._tryPlaceBench = function () {
    if (!this._isNearWorkZone()) {
      this.ui.setHint(this.tasks.level.hintBenchesCloser);
      this.ui.speak(this.tasks.level.hintBenchesCloser, { throttleMs: 4500 });
      return;
    }
    var spot = this.site.currentBenchSpot();
    this.crane.setCarriedPart('block');
    this.crane.setCarriedColor(0x8d6e63);
    this.crane.pickX = this.site.playPileSpot.x;
    this.crane.pickZ = this.site.playPileSpot.z;
    this.crane.placeX = spot.x;
    this.crane.placeZ = spot.z;
    if (!this.crane.tryPlace()) {
      return;
    }
    this.audio.play('crane');
    this.idleTime = 0;
    var self = this;
    this.crane.onPlaced = function () {
      self._handleBench();
    };
  };

  Game.prototype._handleBench = function () {
    var result = this.tasks.registerSuccessfulBench();
    if (!result.counted) {
      return;
    }
    this.site.placeNextBench();
    this.ui.showCount(result.count);
    this.ui.setHint(this.tasks.hint);
    this.ui.speakCount(result.count);
    if (result.completed) {
      this._completeTask(11, this.tasks.level.rewardBenchesTitle, this.tasks.level.rewardBenchesText, 'trees');
    }
  };

  Game.prototype._beginTreePhase = function () {
    this._cameraFocus = 'vehicle';
    this.activeVehicle = this.crane;
    this.tasks.startTreePhase();
    this.wasNearAction = false;
    this.idleTime = 0;
    this.site.setTreeMode();
    this.ui.setAction('🌳', 'ПОСАДИТЬ');
    this.ui.setHint(this.tasks.level.hintTrees);
    this.ui.speak(this.tasks.level.voiceTrees);
  };

  Game.prototype._tryPlaceTree = function () {
    if (!this._isNearWorkZone()) {
      this.ui.setHint(this.tasks.level.hintTreesCloser);
      this.ui.speak(this.tasks.level.hintTreesCloser, { throttleMs: 4500 });
      return;
    }
    var spot = this.site.currentTreeSpot();
    this.crane.setCarriedPart('block');
    this.crane.setCarriedColor(0x66bb6a);
    this.crane.pickX = this.site.playPileSpot.x;
    this.crane.pickZ = this.site.playPileSpot.z;
    this.crane.placeX = spot.x;
    this.crane.placeZ = spot.z;
    if (!this.crane.tryPlace()) {
      return;
    }
    this.audio.play('crane');
    this.idleTime = 0;
    var self = this;
    this.crane.onPlaced = function () {
      self._handleTree();
    };
  };

  Game.prototype._handleTree = function () {
    var result = this.tasks.registerSuccessfulTree();
    if (!result.counted) {
      return;
    }
    this.site.placeNextTree();
    this.ui.showCount(result.count);
    this.ui.setHint(this.tasks.hint);
    this.ui.speakCount(result.count);
    if (result.completed) {
      this._completeTask(12, this.tasks.level.rewardTreesTitle, this.tasks.level.rewardTreesText, 'lamps');
    }
  };

  Game.prototype._beginLampPhase = function () {
    this._cameraFocus = 'vehicle';
    this.activeVehicle = this.crane;
    this.tasks.startLampPhase();
    this.wasNearAction = false;
    this.idleTime = 0;
    this.site.setLampMode();
    this.ui.setAction('💡', 'УСТАНОВИТЬ');
    this.ui.setHint(this.tasks.level.hintLamps);
    this.ui.speak(this.tasks.level.voiceLamps);
  };

  Game.prototype._tryPlaceLamp = function () {
    if (!this._isNearWorkZone()) {
      this.ui.setHint(this.tasks.level.hintLampsCloser);
      this.ui.speak(this.tasks.level.hintLampsCloser, { throttleMs: 4500 });
      return;
    }
    var spot = this.site.currentLampSpot();
    this.crane.setCarriedPart('block');
    this.crane.setCarriedColor(0xffee58);
    this.crane.pickX = this.site.playPileSpot.x;
    this.crane.pickZ = this.site.playPileSpot.z;
    this.crane.placeX = spot.x;
    this.crane.placeZ = spot.z;
    if (!this.crane.tryPlace()) {
      return;
    }
    this.audio.play('crane');
    this.idleTime = 0;
    var self = this;
    this.crane.onPlaced = function () {
      self._handleLamp();
    };
  };

  Game.prototype._handleLamp = function () {
    var result = this.tasks.registerSuccessfulLamp();
    if (!result.counted) {
      return;
    }
    this.site.placeNextLamp();
    this.ui.showCount(result.count);
    this.ui.setHint(this.tasks.hint);
    this.ui.speakCount(result.count);
    if (result.completed) {
      this._completeTask(
        13,
        this.tasks.level.rewardCityTitle,
        this.tasks.level.rewardCityText,
        'free',
        'trophy',
      );
    }
  };

  Game.prototype._beginMathPhase = function () {
    this.paused = true;
    this.input.reset();
    this._cameraFocus = 'vehicle';
    this.mathIndex = 0;
    this.playTrack = 'hub';
    this.playDone = { count: false, puzzle: false, shadow: false };
    this.tasks.startMathPhase();
    this.ui.setHint(this.tasks.level.hintMath);
    this.ui.speak('А теперь давай поиграем!');
    this.ui.showPlayHub(this.playDone);
  };

  Game.prototype._pickPlayTrack = function (track) {
    this.playTrack = track;
    this.mathIndex = 0;
    this.idleTime = 0;
    if (track === 'puzzle') {
      this.ui.showMath(MBS.PLAY_PUZZLE, 0, 1);
      return;
    }
    if (track === 'shadow') {
      this.ui.showMath(MBS.PLAY_SHADOW, 0, 1);
      return;
    }
    this._showCurrentMath();
  };

  Game.prototype._showCurrentMath = function () {
    var questions = MBS.PLAY_COUNT || MBS.MATH_QUESTIONS || [];
    var question = questions[this.mathIndex];
    if (!question) {
      this._markPlayDone('count');
      return;
    }
    this.ui.showMath(question, this.mathIndex, questions.length);
  };

  Game.prototype._markPlayDone = function (track) {
    if (!this.playDone) {
      this.playDone = { count: false, puzzle: false, shadow: false };
    }
    this.playDone[track] = true;
    if (this.playDone.count && this.playDone.puzzle && this.playDone.shadow) {
      this._finishMath();
      return;
    }
    this.playTrack = 'hub';
    this.ui.speak('Выбери ещё игру.');
    this.ui.showPlayHub(this.playDone);
  };

  Game.prototype._handleMathAnswer = function (value, question, button) {
    if (value !== question.answer) {
      this.ui.markMathWrong();
      return;
    }
    this.ui.markMathRight(button);
    this.idleTime = 0;
    if (question.speakNumber && typeof question.answer === 'number') {
      this.ui.showCount(question.answer);
      this.ui.speakCount(question.answer);
    } else {
      this.ui.speak('Молодец!');
    }
    var self = this;
    window.setTimeout(function () {
      if (self.playTrack === 'puzzle') {
        self._markPlayDone('puzzle');
        return;
      }
      if (self.playTrack === 'shadow') {
        self._markPlayDone('shadow');
        return;
      }
      self.mathIndex += 1;
      if (self.mathIndex >= (MBS.PLAY_COUNT || MBS.MATH_QUESTIONS || []).length) {
        self._markPlayDone('count');
      } else {
        self._showCurrentMath();
      }
    }, 900);
  };

  Game.prototype._finishMath = function () {
    this.ui.hideMath();
    var nextPhase = 'free';
    if (this.mathFromMenu) {
      nextPhase = 'menu';
    } else if (this.mathResumePhase) {
      nextPhase = 'resume';
    }
    this._completeTask(20, this.tasks.level.rewardMathTitle, this.tasks.level.rewardMathText, nextPhase);
  };

  Game.prototype._resumeAfterMath = function () {
    this.paused = false;
    if (this.mathResumePhase) {
      this.tasks.phase = this.mathResumePhase;
      this.tasks.hint = this.mathResumeHint || this.tasks.hint;
      this.ui.setHint(this.tasks.hint);
    }
    this.mathResumePhase = null;
    this.mathResumeHint = null;
    this.ui.showHudMath();
  };

  Game.prototype._returnToMenu = function () {
    this.playing = false;
    this.paused = false;
    this.mathFromMenu = false;
    this.ui.hideMath();
    this.ui.showStart();
    this.ui.setHint('Нажми ИГРАТЬ');
  };

  Game.prototype._isNearDigZone = function () {
    var pos = this.activeVehicle.position;
    if (this.activeVehicle === this.excavator) {
      var bucket = this.excavator.bucketWorldPosition;
      return (
        this.site.isInDigZone(pos.x, pos.z) ||
        MBS.distanceXZ(bucket.x, bucket.z, this.site.digTarget.x, this.site.digTarget.z) < this.site.digRadius
      );
    }
    return MBS.distanceXZ(pos.x, pos.z, this.site.digTarget.x, this.site.digTarget.z) < 8.2;
  };

  Game.prototype._isNearDumpZone = function () {
    var pos = this.dumpTruck.position;
    return this.site.isInDumpZone(pos.x, pos.z);
  };

  Game.prototype._isNearWorkZone = function () {
    var pos = this.activeVehicle.position;
    return this.site.isInWorkZone(pos.x, pos.z);
  };

  Game.prototype._obstaclesFor = function (mover) {
    var obstacles = [];
    var vehicles = [
      this.excavator,
      this.dumpTruck,
      this.mixer,
      this.crane,
      this.bulldozer,
      this.roller,
    ];
    var i;
    for (i = 0; i < vehicles.length; i += 1) {
      var other = vehicles[i];
      if (other === mover) {
        continue;
      }
      obstacles.push({
        kind: 'circle',
        x: other.group.position.x,
        z: other.group.position.z,
        radius: other.radius || 1.8,
      });
    }
    if (this.site.wallLevel > 0 || this.site.houseLevel > 0) {
      obstacles.push({
        kind: 'box',
        minX: -3.85,
        maxX: 3.85,
        minZ: -3.85,
        maxZ: 3.85,
      });
    }
    return obstacles;
  };

  Game.prototype._updateActionButton = function () {
    var ready = false;
    var phase = this.tasks.phase;
    if (phase === 'dig' || phase === 'load' || phase === 'pour' || phase === 'walls' || phase === 'finish') {
      ready = this._isNearDigZone();
    } else if (phase === 'unload') {
      ready = this._isNearDumpZone();
    } else if (phase === 'gravelLoad') {
      ready = this.site.isInGravelZone(this.dumpTruck.position.x, this.dumpTruck.position.z);
    } else if (
      phase === 'grade' ||
      phase === 'gravelUnload' ||
      phase === 'roll' ||
      phase === 'bridge' ||
      phase === 'play' ||
      phase === 'benches' ||
      phase === 'trees' ||
      phase === 'lamps'
    ) {
      ready = this._isNearWorkZone();
    } else if (phase === 'free') {
      ready = true;
    }
    this.ui.setNearDigZone(ready);
    if (ready && !this.wasNearAction && this.playing && !this.paused) {
      var readyVoice = this._readyVoice();
      if (readyVoice) {
        this.audio.play('ready');
        this.ui.speak(readyVoice, { throttleMs: 6000 });
      }
    }
    this.wasNearAction = ready;
  };

  Game.prototype._readyVoice = function () {
    var level = this.tasks.level;
    var phase = this.tasks.phase;
    if (phase === 'dig') {
      return level.voiceReadyDig;
    }
    if (phase === 'load') {
      return level.voiceReadyLoad;
    }
    if (phase === 'unload') {
      return level.voiceReadyUnload;
    }
    if (phase === 'pour') {
      return level.voiceReadyPour;
    }
    if (phase === 'walls') {
      return level.voiceReadyWalls;
    }
    if (phase === 'finish') {
      return level.voiceReadyFinish;
    }
    if (phase === 'grade') {
      return level.voiceReadyGrade;
    }
    if (phase === 'gravelLoad') {
      return level.voiceReadyGravel;
    }
    if (phase === 'gravelUnload') {
      return level.voiceReadyGravelUnload;
    }
    if (phase === 'roll') {
      return level.voiceReadyRoll;
    }
    if (phase === 'bridge') {
      return level.voiceReadyBridge;
    }
    if (phase === 'play') {
      return level.voiceReadyPlay;
    }
    if (phase === 'benches') {
      return level.voiceReadyBenches;
    }
    if (phase === 'trees') {
      return level.voiceReadyTrees;
    }
    if (phase === 'lamps') {
      return level.voiceReadyLamps;
    }
    return '';
  };

  Game.prototype._coachVoice = function () {
    var level = this.tasks.level;
    var phase = this.tasks.phase;
    var ready = this.wasNearAction;
    if (phase === 'dig') {
      return ready ? level.voiceReadyDig : level.voiceCoachDig;
    }
    if (phase === 'load') {
      return ready ? level.voiceReadyLoad : level.voiceCoachLoad;
    }
    if (phase === 'unload') {
      return ready ? level.voiceReadyUnload : level.voiceCoachUnload;
    }
    if (phase === 'pour') {
      return ready ? level.voiceReadyPour : level.voiceCoachPour;
    }
    if (phase === 'walls') {
      return ready ? level.voiceReadyWalls : level.voiceCoachWalls;
    }
    if (phase === 'finish') {
      return ready ? level.voiceReadyFinish : level.voiceCoachFinish;
    }
    if (phase === 'grade') {
      return ready ? level.voiceReadyGrade : level.voiceCoachGrade;
    }
    if (phase === 'gravelLoad') {
      return ready ? level.voiceReadyGravel : level.voiceCoachGravel;
    }
    if (phase === 'gravelUnload') {
      return ready ? level.voiceReadyGravelUnload : level.voiceCoachGravelUnload;
    }
    if (phase === 'roll') {
      return ready ? level.voiceReadyRoll : level.voiceCoachRoll;
    }
    if (phase === 'bridge') {
      return ready ? level.voiceReadyBridge : level.voiceCoachBridge;
    }
    if (phase === 'play') {
      return ready ? level.voiceReadyPlay : level.voiceCoachPlay;
    }
    if (phase === 'benches') {
      return ready ? level.voiceReadyBenches : level.voiceCoachBenches;
    }
    if (phase === 'trees') {
      return ready ? level.voiceReadyTrees : level.voiceCoachTrees;
    }
    if (phase === 'lamps') {
      return ready ? level.voiceReadyLamps : level.voiceCoachLamps;
    }
    if (phase === 'math') {
      return level.voiceMath;
    }
    if (phase === 'free' || phase === 'done') {
      return level.voiceFree;
    }
    return level.hintTask;
  };

  Game.prototype._updateCoach = function (dt) {
    var moving = this.input.forward || this.input.back || this.input.left || this.input.right;
    var busy =
      this.excavator.digging ||
      this.dumpTruck.busy ||
      this.mixer.busy ||
      this.crane.busy ||
      this.bulldozer.busy ||
      this.roller.busy;
    if (moving || busy) {
      this.idleTime = 0;
      return;
    }
    this.idleTime += dt;
    if (this.tasks.phase === 'math') {
      return;
    }
    if (this.idleTime < 12) {
      return;
    }
    this.idleTime = 0;
    this.ui.speak(this._coachVoice(), { priority: 'low' });
  };

  Game.prototype._updateAudio = function (dt) {
    var vehicle = this.activeVehicle;
    var speed = vehicle && vehicle.velocity ? Math.abs(vehicle.velocity) : 0;
    var power = Math.min(1, speed / 7.2);
    var kind = 'excavator';
    if (vehicle === this.dumpTruck) {
      kind = 'dumpTruck';
    } else if (vehicle === this.mixer) {
      kind = 'mixer';
    } else if (vehicle === this.crane) {
      kind = 'crane';
    } else if (vehicle === this.bulldozer) {
      kind = 'bulldozer';
    } else if (vehicle === this.roller) {
      kind = 'roller';
    }
    var busy =
      (vehicle === this.excavator && vehicle.digging) ||
      (vehicle === this.dumpTruck && vehicle.busy) ||
      (vehicle === this.mixer && vehicle.busy) ||
      (vehicle === this.crane && vehicle.busy) ||
      (vehicle === this.bulldozer && vehicle.busy) ||
      (vehicle === this.roller && vehicle.busy);
    if (this.paused && !busy) {
      power = 0;
    }
    this.audio.update(dt, power, kind, busy);
  };

  Game.prototype._focusOnHouse = function () {
    this._cameraFocus = 'house';
    this.camYaw = 0.9;
    this.camPitch = 0.22;
    this.zoom = 0.92;
  };

  Game.prototype._beginFreeRoam = function () {
    this._cameraFocus = 'vehicle';
    this.camPitch = 0.24;
    this.tasks.startFreePhase();
    this.site.setFreeMode();
    this.ui.setHint(this.tasks.level.hintFree);
    this.ui.speak(this.tasks.level.voiceFree);
    this.ui.setAction('📯', 'СИГНАЛ');
    this.ui.setNearDigZone(true);
    this.ui.showVehicleBar('crane');
  };

  Game.prototype._setActiveVehicle = function (name) {
    if (name === 'excavator') {
      this.activeVehicle = this.excavator;
    } else if (name === 'dumpTruck') {
      this.activeVehicle = this.dumpTruck;
    } else if (name === 'mixer') {
      this.activeVehicle = this.mixer;
    } else if (name === 'crane') {
      this.activeVehicle = this.crane;
    } else if (name === 'bulldozer') {
      this.activeVehicle = this.bulldozer;
    } else if (name === 'roller') {
      this.activeVehicle = this.roller;
    }
    this.ui.setVehicleActive(name);
    this.idleTime = 0;
  };

  Game.prototype._updateCamera = function (dt) {
    var vehicle = this.activeVehicle;
    var focus = new THREE.Vector3();
    if (this._cameraFocus === 'house') {
      focus.set(0, 1.85, 1.6);
    } else {
      focus.copy(vehicle.position);
      focus.y += 1.35;
    }
    var yaw = (this._cameraFocus === 'house' ? 0 : vehicle.group.rotation.y) + this.camYaw;
    var dist = this.camDistance * this.zoom;
    var offset = new THREE.Vector3(0, Math.sin(this.camPitch) * dist, -Math.cos(this.camPitch) * dist);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    var desired = focus.clone().add(offset);
    var follow = 1 - Math.exp(-3.4 * dt);
    this.camera.position.lerp(desired, follow);
    this.lookTarget.lerp(focus, 1 - Math.exp(-4.4 * dt));
    this.camera.lookAt(this.lookTarget);
  };

  MBS.Game = Game;
})(window.MBS = window.MBS || {}, window.THREE);
