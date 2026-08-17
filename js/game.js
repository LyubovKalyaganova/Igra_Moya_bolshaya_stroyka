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

    this._createRenderer();
    this._createScene();
    this._createCamera();
    this._createLights();

    this.site = new MBS.ConstructionSite(this.scene);
    this.excavator = new MBS.Excavator(this.scene);
    this.dumpTruck = new MBS.DumpTruck(this.scene);
    this.mixer = new MBS.ConcreteMixer(this.scene);
    this.crane = new MBS.Crane(this.scene);
    this.activeVehicle = this.excavator;

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
      self.playing = true;
      self.audio.ensure();
      self.idleTime = 0;
      self.ui.setHint(self.tasks.level.hintTask);
      self.ui.speak(self.tasks.level.voiceStart);
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
      } else if (self.pendingPhase === 'free') {
        self._beginFreeRoam();
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

  Game.prototype._completeTask = function (levelId, title, text, nextPhase) {
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
      self.ui.showReward(self.rewards.stars, title, text);
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
      this._completeTask(5, this.tasks.level.rewardFinishTitle, this.tasks.level.rewardFinishText, 'free');
    }
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

  Game.prototype._obstaclesFor = function (mover) {
    var obstacles = [];
    var vehicles = [this.excavator, this.dumpTruck, this.mixer, this.crane];
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
    if (phase === 'free' || phase === 'done') {
      return level.voiceFree;
    }
    return level.hintTask;
  };

  Game.prototype._updateCoach = function (dt) {
    var moving = this.input.forward || this.input.back || this.input.left || this.input.right;
    var busy =
      this.excavator.digging || this.dumpTruck.busy || this.mixer.busy || this.crane.busy;
    if (moving || busy) {
      this.idleTime = 0;
      return;
    }
    this.idleTime += dt;
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
    }
    var busy =
      (vehicle === this.excavator && vehicle.digging) ||
      (vehicle === this.dumpTruck && vehicle.busy) ||
      (vehicle === this.mixer && vehicle.busy) ||
      (vehicle === this.crane && vehicle.busy);
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
    this.ui.setHint(this.tasks.level.hintFree);
    this.ui.speak(this.tasks.level.voiceFree);
    this.ui.setAction('👋', 'ПРИВЕТ');
    this.ui.showVehicleBar('crane');
  };

  Game.prototype._setActiveVehicle = function (name) {
    if (name === 'excavator') {
      this.activeVehicle = this.excavator;
    } else if (name === 'dumpTruck') {
      this.activeVehicle = this.dumpTruck;
    } else if (name === 'mixer') {
      this.activeVehicle = this.mixer;
    } else {
      this.activeVehicle = this.crane;
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
    var offset = new THREE.Vector3(0, Math.sin(this.camPitch) * dist, Math.cos(this.camPitch) * dist);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    var desired = focus.clone().add(offset);
    var follow = 1 - Math.exp(-3.4 * dt);
    this.camera.position.lerp(desired, follow);
    this.lookTarget.lerp(focus, 1 - Math.exp(-4.4 * dt));
    this.camera.lookAt(this.lookTarget);
  };

  MBS.Game = Game;
})(window.MBS = window.MBS || {}, window.THREE);
