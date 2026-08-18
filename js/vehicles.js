(function (MBS, THREE) {
  var boxMesh = MBS.boxMesh;
  var cylinderMesh = MBS.cylinderMesh;
  var sphereMesh = MBS.sphereMesh;
  var lerpNumber = MBS.lerpNumber;
  var clamp = MBS.clamp;

  var IDLE_POSE = { boom: -0.62, arm: 1.12, bucket: 0.38 };

  var DIG_FRAMES = [
    { t: 0, boom: -0.62, arm: 1.12, bucket: 0.38 },
    { t: 0.22, boom: -0.15, arm: 0.72, bucket: 0.15 },
    { t: 0.42, boom: 0.28, arm: 0.82, bucket: 0.55 },
    { t: 0.58, boom: 0.38, arm: 0.95, bucket: 1.15 },
    { t: 0.78, boom: -0.72, arm: 0.88, bucket: 0.95 },
    { t: 1, boom: -0.62, arm: 1.12, bucket: 0.38 },
  ];

  function wrapAngle(value) {
    var a = value;
    while (a > Math.PI) {
      a -= Math.PI * 2;
    }
    while (a < -Math.PI) {
      a += Math.PI * 2;
    }
    return a;
  }

  function lerpAngle(from, to, t) {
    return from + wrapAngle(to - from) * t;
  }

  function applyCollisions(vehicle, obstacles) {
    if (!obstacles || !obstacles.length) {
      return;
    }
    var px = vehicle.group.position.x;
    var pz = vehicle.group.position.z;
    var r = vehicle.radius || 1.8;
    var pass;
    var i;
    for (pass = 0; pass < 2; pass += 1) {
    for (i = 0; i < obstacles.length; i += 1) {
      var obstacle = obstacles[i];
      var dx;
      var dz;
      var dist;
      if (obstacle.kind === 'box') {
        var cx = clamp(px, obstacle.minX, obstacle.maxX);
        var cz = clamp(pz, obstacle.minZ, obstacle.maxZ);
        dx = px - cx;
        dz = pz - cz;
        dist = Math.hypot(dx, dz);
        if (dist < 0.0001) {
          var left = px - obstacle.minX;
          var right = obstacle.maxX - px;
          var near = pz - obstacle.minZ;
          var far = obstacle.maxZ - pz;
          var smallest = Math.min(left, right, near, far);
          if (smallest === left) {
            px = obstacle.minX - r;
          } else if (smallest === right) {
            px = obstacle.maxX + r;
          } else if (smallest === near) {
            pz = obstacle.minZ - r;
          } else {
            pz = obstacle.maxZ + r;
          }
        } else if (dist < r) {
          px += (dx / dist) * (r - dist);
          pz += (dz / dist) * (r - dist);
        }
      } else {
        dx = px - obstacle.x;
        dz = pz - obstacle.z;
        var minDist = r + (obstacle.radius || 1.6);
        dist = Math.hypot(dx, dz) || 0.001;
        if (dist < minDist) {
          px += (dx / dist) * (minDist - dist);
          pz += (dz / dist) * (minDist - dist);
        }
      }
    }
    }
    vehicle.group.position.x = px;
    vehicle.group.position.z = pz;
  }

  function driveGroup(vehicle, input, bounds, dt, obstacles) {
    var turn = (input.left ? 1 : 0) - (input.right ? 1 : 0);
    vehicle.group.rotation.y += turn * vehicle.turnSpeed * dt;

    var target = 0;
    if (input.forward) {
      target = vehicle.speed;
    } else if (input.back) {
      target = -vehicle.reverseSpeed;
    }
    vehicle.velocity = lerpNumber(vehicle.velocity, target, 1 - Math.exp(-10 * dt));

    var yaw = vehicle.group.rotation.y;
    vehicle.group.position.x += Math.sin(yaw) * vehicle.velocity * dt;
    vehicle.group.position.z += Math.cos(yaw) * vehicle.velocity * dt;

    applyCollisions(vehicle, obstacles);
    vehicle.group.position.x = clamp(vehicle.group.position.x, -bounds, bounds);
    vehicle.group.position.z = clamp(vehicle.group.position.z, -bounds, bounds);
  }

  function addCabSides(parent, opts) {
    var glass = {
      roughness: 0.18,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
    };
    var x = opts.x;
    var z = opts.z;
    var yWin = opts.yWin;
    var yDoor = opts.yDoor;
    var winH = opts.winH || 0.42;
    var winD = opts.winD || 0.55;
    var doorH = opts.doorH || 0.72;
    var doorD = opts.doorD || 0.62;
    [-1, 1].forEach(function (side) {
      var sx = side * x;
      var windowPane = boxMesh(0.07, winH, winD, 0x81d4fa, glass);
      windowPane.position.set(sx, yWin, z);
      parent.add(windowPane);
      var door = boxMesh(0.08, doorH, doorD, opts.doorColor);
      door.position.set(sx, yDoor, z);
      parent.add(door);
      var handle = boxMesh(0.1, 0.07, 0.14, 0xffeb3b);
      handle.position.set(sx + side * 0.05, yDoor + 0.08, z + doorD * 0.2);
      parent.add(handle);
    });
  }

  function spinWheels(wheels, velocity, dt) {
    var spin = velocity * dt * 1.6;
    wheels.forEach(function (wheel) {
      wheel.rotation.x += spin;
    });
  }

  function poseAt(time) {
    var t = clamp(time, 0, 1);
    for (var i = 0; i < DIG_FRAMES.length - 1; i += 1) {
      var a = DIG_FRAMES[i];
      var b = DIG_FRAMES[i + 1];
      if (t >= a.t && t <= b.t) {
        var local = (t - a.t) / (b.t - a.t);
        return {
          boom: lerpNumber(a.boom, b.boom, local),
          arm: lerpNumber(a.arm, b.arm, local),
          bucket: lerpNumber(a.bucket, b.bucket, local),
          scooping: t >= 0.42 && t <= 0.62,
        };
      }
    }
    return { boom: IDLE_POSE.boom, arm: IDLE_POSE.arm, bucket: IDLE_POSE.bucket, scooping: false };
  }

  function Excavator(scene) {
    this.group = new THREE.Group();
    this.speed = 7.2;
    this.reverseSpeed = 4.4;
    this.turnSpeed = 2.1;
    this.radius = 2.15;
    this.velocity = 0;
    this.digging = false;
    this.digTime = 0;
    this.digDuration = 1.2;
    this.scoopedThisDig = false;
    this.onScoop = null;
    this.wheels = [];

    this._build();
    this._applyPose(IDLE_POSE);
    this.group.position.set(12.5, 0, 15.5);
    this.group.rotation.y = Math.atan2(-12.5, -15.5);
    scene.add(this.group);
  }

  Object.defineProperty(Excavator.prototype, 'position', {
    get: function () {
      return this.group.position;
    },
  });

  Object.defineProperty(Excavator.prototype, 'bucketWorldPosition', {
    get: function () {
      var point = new THREE.Vector3();
      this.bucketPivot.getWorldPosition(point);
      return point;
    },
  });

  Excavator.prototype.update = function (dt, input, bounds, obstacles) {
    if (!this.digging) {
      driveGroup(this, input, bounds, dt, obstacles);
    }
    spinWheels(this.wheels, this.velocity, dt);

    if (this.digging) {
      this.digTime += dt;
      var t = clamp(this.digTime / this.digDuration, 0, 1);
      var pose = poseAt(t);
      this._applyPose(pose);

      if (pose.scooping && !this.scoopedThisDig) {
        this.scoopedThisDig = true;
        this.bucketDirt.visible = true;
        if (this.onScoop) {
          this.onScoop();
        }
      }

      if (t >= 1) {
        this.digging = false;
        this.bucketDirt.visible = false;
        this._applyPose(IDLE_POSE);
      }
    }
  };

  Excavator.prototype.tryDig = function () {
    if (this.digging) {
      return false;
    }
    this.digging = true;
    this.digTime = 0;
    this.scoopedThisDig = false;
    this.velocity = 0;
    return true;
  };

  Excavator.prototype._applyPose = function (pose) {
    this.boomPivot.rotation.x = pose.boom;
    this.armPivot.rotation.x = pose.arm;
    this.bucketPivot.rotation.x = pose.bucket;
  };

  Excavator.prototype._build = function () {
    var yellow = 0xffc107;
    var darkYellow = 0xffb300;
    var orange = 0xff9800;
    var steel = 0x5d6d7e;
    var track = 0x424242;

    var trackL = boxMesh(0.62, 0.42, 3.5, track);
    trackL.position.set(-1.12, 0.28, 0.1);
    this.group.add(trackL);
    var trackR = boxMesh(0.62, 0.42, 3.5, track);
    trackR.position.set(1.12, 0.28, 0.1);
    this.group.add(trackR);

    var self = this;
    [-1.12, 1.12].forEach(function (x) {
      [-1.1, 0, 1.1].forEach(function (z) {
        var wheel = cylinderMesh(0.28, 0.28, 0.5, 0x212121, {}, 12);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.28, z);
        self.group.add(wheel);
        self.wheels.push(wheel);
      });
    });

    var chassis = boxMesh(1.85, 0.38, 2.6, 0x616161);
    chassis.position.set(0, 0.58, 0);
    this.group.add(chassis);

    var body = boxMesh(1.95, 1.05, 2.15, yellow);
    body.position.set(0, 1.18, -0.2);
    this.group.add(body);

    var stripe = boxMesh(2.02, 0.16, 2.22, orange);
    stripe.position.set(0, 1.18, -0.2);
    this.group.add(stripe);

    var cabin = boxMesh(1.25, 1.05, 1.2, darkYellow);
    cabin.position.set(0, 2.05, -0.55);
    this.group.add(cabin);

    var windowFront = boxMesh(1.05, 0.58, 0.08, 0x81d4fa, {
      roughness: 0.18,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
    });
    windowFront.position.set(0, 2.12, 0.08);
    this.group.add(windowFront);

    addCabSides(this.group, {
      x: 0.66,
      z: -0.55,
      yWin: 2.22,
      yDoor: 1.72,
      winH: 0.42,
      winD: 0.62,
      doorH: 0.7,
      doorD: 0.7,
      doorColor: orange,
    });

    var eyeL = sphereMesh(0.11, 0xffffff);
    eyeL.position.set(-0.22, 2.18, 0.14);
    this.group.add(eyeL);
    var eyeR = sphereMesh(0.11, 0xffffff);
    eyeR.position.set(0.22, 2.18, 0.14);
    this.group.add(eyeR);
    var pupilL = sphereMesh(0.05, 0x263238);
    pupilL.position.set(-0.22, 2.16, 0.22);
    this.group.add(pupilL);
    var pupilR = sphereMesh(0.05, 0x263238);
    pupilR.position.set(0.22, 2.16, 0.22);
    this.group.add(pupilR);

    var roof = boxMesh(1.35, 0.12, 1.3, orange);
    roof.position.set(0, 2.62, -0.55);
    this.group.add(roof);

    this.boomPivot = new THREE.Group();
    this.boomPivot.position.set(0, 1.45, 0.85);
    this.group.add(this.boomPivot);

    var boom = boxMesh(0.34, 0.34, 2.45, orange);
    boom.position.set(0, 0.08, 1.15);
    this.boomPivot.add(boom);

    var boomJoint = sphereMesh(0.28, steel);
    boomJoint.position.set(0, 0.08, 2.3);
    this.boomPivot.add(boomJoint);

    this.armPivot = new THREE.Group();
    this.armPivot.position.set(0, 0.08, 2.32);
    this.boomPivot.add(this.armPivot);

    var arm = boxMesh(0.28, 0.28, 1.75, darkYellow);
    arm.position.set(0, 0, 0.82);
    this.armPivot.add(arm);

    this.bucketPivot = new THREE.Group();
    this.bucketPivot.position.set(0, 0, 1.68);
    this.armPivot.add(this.bucketPivot);

    var bucket = boxMesh(0.95, 0.58, 0.72, steel);
    bucket.position.set(0, -0.12, 0.28);
    this.bucketPivot.add(bucket);

    var teeth = boxMesh(0.92, 0.1, 0.18, 0x90a4ae);
    teeth.position.set(0, -0.38, 0.52);
    this.bucketPivot.add(teeth);

    this.bucketDirt = sphereMesh(0.24, 0x8d6e4c);
    this.bucketDirt.position.set(0, -0.02, 0.18);
    this.bucketDirt.visible = false;
    this.bucketPivot.add(this.bucketDirt);
  };

  function DumpTruck(scene) {
    this.group = new THREE.Group();
    this.speed = 8.2;
    this.reverseSpeed = 4.6;
    this.turnSpeed = 2.05;
    this.radius = 2.35;
    this.velocity = 0;
    this.wheels = [];
    this.cargo = [];
    this.cargoCount = 0;
    this.busy = false;
    this.actionTime = 0;
    this.actionDuration = 0.75;
    this.mode = 'idle';
    this.onLoaded = null;
    this.onUnloaded = null;
    this.onPaved = null;

    this._build();
    this.group.position.set(10.4, 0, 0);
    this.group.rotation.y = -Math.PI / 2;
    scene.add(this.group);
  }

  Object.defineProperty(DumpTruck.prototype, 'position', {
    get: function () {
      return this.group.position;
    },
  });

  DumpTruck.prototype.update = function (dt, input, bounds, obstacles) {
    if (!this.busy) {
      driveGroup(this, input, bounds, dt, obstacles);
    }
    spinWheels(this.wheels, this.velocity, dt);

    if (!this.busy) {
      return;
    }

    this.actionTime += dt;
    var t = clamp(this.actionTime / this.actionDuration, 0, 1);

    if (this.mode === 'load' || this.mode === 'pave') {
      this.bedPivot.position.y = 1.18 + Math.sin(t * Math.PI) * 0.12;
      if (t >= 0.45 && this.mode === 'pave' && this.onPaved) {
        this.onPaved();
        this.onPaved = null;
      }
      if (t >= 1) {
        this.busy = false;
        this.mode = 'idle';
        this.bedPivot.position.y = 1.18;
      }
      return;
    }

    if (this.mode === 'unload') {
      var tilt = t < 0.45 ? (t / 0.45) * -0.85 : t < 0.7 ? -0.85 : ((1 - t) / 0.3) * -0.85;
      this.bedPivot.rotation.x = tilt;
      if (t >= 0.42 && this.cargoCount > 0) {
        this._hideCargo();
        if (this.onUnloaded) {
          this.onUnloaded();
          this.onUnloaded = null;
        }
      }
      if (t >= 1) {
        this.busy = false;
        this.mode = 'idle';
        this.bedPivot.rotation.x = 0;
      }
    }
  };

  DumpTruck.prototype.tryLoad = function () {
    if (this.busy || this.cargoCount >= 3) {
      return false;
    }
    this.busy = true;
    this.mode = 'load';
    this.actionTime = 0;
    this.actionDuration = 0.7;
    this.velocity = 0;
    this.cargoCount += 1;
    this.cargo[this.cargoCount - 1].visible = true;
    return true;
  };

  DumpTruck.prototype.tryUnload = function () {
    if (this.busy || this.cargoCount <= 0) {
      return false;
    }
    this.busy = true;
    this.mode = 'unload';
    this.actionTime = 0;
    this.actionDuration = 1.15;
    this.velocity = 0;
    return true;
  };

  DumpTruck.prototype.tryPave = function () {
    if (this.busy) {
      return false;
    }
    this.busy = true;
    this.mode = 'load';
    this.actionTime = 0;
    this.actionDuration = 0.55;
    this.velocity = 0;
    return true;
  };

  DumpTruck.prototype._hideCargo = function () {
    this.cargo.forEach(function (piece) {
      piece.visible = false;
    });
    this.cargoCount = 0;
  };

  DumpTruck.prototype._build = function () {
    var orange = 0xff6d00;
    var cabColor = 0xff8f00;
    var steel = 0x607d8b;
    var tire = 0x212121;

    var chassis = boxMesh(1.7, 0.32, 4.2, 0x546e7a);
    chassis.position.set(0, 0.62, -0.15);
    this.group.add(chassis);

    var self = this;
    [-0.95, 0.95].forEach(function (x) {
      [-1.35, 1.15].forEach(function (z) {
        var wheel = cylinderMesh(0.42, 0.42, 0.42, tire, {}, 12);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.42, z);
        self.group.add(wheel);
        self.wheels.push(wheel);
        var hub = cylinderMesh(0.16, 0.16, 0.44, 0xffd54f, {}, 10);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(x, 0.42, z);
        self.group.add(hub);
      });
    });

    var cab = boxMesh(1.7, 1.35, 1.45, cabColor);
    cab.position.set(0, 1.55, 1.35);
    this.group.add(cab);

    var roof = boxMesh(1.78, 0.12, 1.52, orange);
    roof.position.set(0, 2.28, 1.35);
    this.group.add(roof);

    var windowFront = boxMesh(1.35, 0.62, 0.08, 0x81d4fa, {
      roughness: 0.18,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
    });
    windowFront.position.set(0, 1.72, 2.1);
    this.group.add(windowFront);

    addCabSides(this.group, {
      x: 0.88,
      z: 1.35,
      yWin: 1.82,
      yDoor: 1.28,
      winH: 0.45,
      winD: 0.7,
      doorH: 0.78,
      doorD: 0.78,
      doorColor: 0xef6c00,
    });

    var eyeL = sphereMesh(0.12, 0xffffff);
    eyeL.position.set(-0.28, 1.72, 2.12);
    this.group.add(eyeL);
    var eyeR = sphereMesh(0.12, 0xffffff);
    eyeR.position.set(0.28, 1.72, 2.12);
    this.group.add(eyeR);
    var pupilL = sphereMesh(0.055, 0x263238);
    pupilL.position.set(-0.28, 1.7, 2.22);
    this.group.add(pupilL);
    var pupilR = sphereMesh(0.055, 0x263238);
    pupilR.position.set(0.28, 1.7, 2.22);
    this.group.add(pupilR);

    var bumper = boxMesh(1.78, 0.22, 0.28, 0xffd54f);
    bumper.position.set(0, 0.78, 2.15);
    this.group.add(bumper);

    this.bedPivot = new THREE.Group();
    this.bedPivot.position.set(0, 1.18, 0.35);
    this.group.add(this.bedPivot);

    var bed = boxMesh(1.85, 0.18, 2.7, 0xffcc80);
    bed.position.set(0, 0.08, -1.35);
    this.bedPivot.add(bed);

    var wallL = boxMesh(0.12, 0.7, 2.7, orange);
    wallL.position.set(-0.88, 0.45, -1.35);
    this.bedPivot.add(wallL);
    var wallR = boxMesh(0.12, 0.7, 2.7, orange);
    wallR.position.set(0.88, 0.45, -1.35);
    this.bedPivot.add(wallR);
    var wallFront = boxMesh(1.85, 0.7, 0.12, orange);
    wallFront.position.set(0, 0.45, 0);
    this.bedPivot.add(wallFront);
    var tail = boxMesh(1.7, 0.55, 0.1, steel);
    tail.position.set(0, 0.35, -2.68);
    this.bedPivot.add(tail);

    var cargoSpots = [
      [-0.35, 0.42, -0.9],
      [0.35, 0.42, -0.9],
      [0, 0.5, -1.7],
    ];
    cargoSpots.forEach(function (spot) {
      var dirt = sphereMesh(0.32, 0x8d6e4c);
      dirt.scale.y = 0.55;
      dirt.position.set(spot[0], spot[1], spot[2]);
      dirt.visible = false;
      self.bedPivot.add(dirt);
      self.cargo.push(dirt);
    });
  };

  function ConcreteMixer(scene) {
    this.group = new THREE.Group();
    this.speed = 7.4;
    this.reverseSpeed = 4.2;
    this.turnSpeed = 2.0;
    this.radius = 2.2;
    this.velocity = 0;
    this.wheels = [];
    this.busy = false;
    this.actionTime = 0;
    this.actionDuration = 1.05;
    this.mode = 'idle';
    this.onPoured = null;
    this.pouredThisAction = false;

    this._build();
    this.group.position.set(-10.5, 0, 0);
    this.group.rotation.y = Math.PI / 2;
    scene.add(this.group);
  }

  Object.defineProperty(ConcreteMixer.prototype, 'position', {
    get: function () {
      return this.group.position;
    },
  });

  ConcreteMixer.prototype.spinDrum = function (dt) {
    var speed = this.busy && this.mode === 'pour' ? 6.2 : 1.7;
    this.drum.rotation.y += dt * speed;
  };

  ConcreteMixer.prototype.update = function (dt, input, bounds, obstacles) {
    this.spinDrum(dt);
    if (!this.busy) {
      driveGroup(this, input, bounds, dt, obstacles);
    }
    spinWheels(this.wheels, this.velocity, dt);

    if (!this.busy) {
      this.chute.rotation.x = 0.25;
      return;
    }

    this.actionTime += dt;
    var t = clamp(this.actionTime / this.actionDuration, 0, 1);
    this.chute.rotation.x = 0.25 + Math.sin(Math.min(t, 1) * Math.PI) * 0.7;

    if (t >= 0.38 && !this.pouredThisAction) {
      this.pouredThisAction = true;
      this.splash.visible = true;
      if (this.onPoured) {
        this.onPoured();
      }
    }
    if (t >= 0.72) {
      this.splash.visible = false;
    }
    if (t >= 1) {
      this.busy = false;
      this.mode = 'idle';
      this.chute.rotation.x = 0.25;
      this.splash.visible = false;
    }
  };

  ConcreteMixer.prototype.tryPour = function () {
    if (this.busy) {
      return false;
    }
    this.busy = true;
    this.mode = 'pour';
    this.actionTime = 0;
    this.pouredThisAction = false;
    this.velocity = 0;
    return true;
  };

  ConcreteMixer.prototype._build = function () {
    var yellow = 0xffd54f;
    var orange = 0xff9800;
    var steel = 0x90a4ae;
    var tire = 0x212121;

    var chassis = boxMesh(1.65, 0.3, 3.8, 0x546e7a);
    chassis.position.set(0, 0.58, -0.1);
    this.group.add(chassis);

    var self = this;
    [-0.9, 0.9].forEach(function (x) {
      [-1.2, 1.05].forEach(function (z) {
        var wheel = cylinderMesh(0.4, 0.4, 0.4, tire, {}, 12);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.4, z);
        self.group.add(wheel);
        self.wheels.push(wheel);
      });
    });

    var cab = boxMesh(1.6, 1.25, 1.35, yellow);
    cab.position.set(0, 1.48, 1.25);
    this.group.add(cab);

    var roof = boxMesh(1.68, 0.12, 1.42, orange);
    roof.position.set(0, 2.16, 1.25);
    this.group.add(roof);

    var windowFront = boxMesh(1.28, 0.55, 0.08, 0x81d4fa, {
      roughness: 0.18,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
    });
    windowFront.position.set(0, 1.62, 1.95);
    this.group.add(windowFront);

    addCabSides(this.group, {
      x: 0.84,
      z: 1.25,
      yWin: 1.72,
      yDoor: 1.22,
      winH: 0.42,
      winD: 0.65,
      doorH: 0.72,
      doorD: 0.72,
      doorColor: 0xffb300,
    });

    var eyeL = sphereMesh(0.11, 0xffffff);
    eyeL.position.set(-0.26, 1.62, 1.98);
    this.group.add(eyeL);
    var eyeR = sphereMesh(0.11, 0xffffff);
    eyeR.position.set(0.26, 1.62, 1.98);
    this.group.add(eyeR);
    var pupilL = sphereMesh(0.05, 0x263238);
    pupilL.position.set(-0.26, 1.6, 2.07);
    this.group.add(pupilL);
    var pupilR = sphereMesh(0.05, 0x263238);
    pupilR.position.set(0.26, 1.6, 2.07);
    this.group.add(pupilR);

    var bumper = boxMesh(1.7, 0.2, 0.26, orange);
    bumper.position.set(0, 0.72, 2.0);
    this.group.add(bumper);

    this.drum = cylinderMesh(0.82, 0.72, 2.15, 0xcfd8dc, { metalness: 0.2, roughness: 0.35 }, 18);
    this.drum.rotation.x = Math.PI / 2;
    this.drum.position.set(0, 2.05, -0.55);
    this.group.add(this.drum);

    var band = cylinderMesh(0.86, 0.76, 0.18, orange, {}, 16);
    band.rotation.x = Math.PI / 2;
    band.position.set(0, 2.05, -0.55);
    this.group.add(band);

    var fin = boxMesh(0.12, 0.28, 1.6, 0xffb74d);
    fin.position.set(0.78, 2.05, -0.55);
    this.group.add(fin);

    this.chute = boxMesh(0.28, 0.12, 1.15, 0xffc107);
    this.chute.position.set(0, 1.35, -1.85);
    this.chute.rotation.x = 0.25;
    this.group.add(this.chute);

    this.splash = sphereMesh(0.22, 0xb0bec5);
    this.splash.scale.y = 0.4;
    this.splash.position.set(0, 0.55, -2.35);
    this.splash.visible = false;
    this.group.add(this.splash);
  };

  function Crane(scene) {
    this.group = new THREE.Group();
    this.speed = 6.4;
    this.reverseSpeed = 3.8;
    this.turnSpeed = 1.7;
    this.radius = 2.25;
    this.velocity = 0;
    this.wheels = [];
    this.busy = false;
    this.actionTime = 0;
    this.actionDuration = 1.85;
    this.mode = 'idle';
    this.onPlaced = null;
    this.onPicked = null;
    this.placedThisAction = false;
    this.pickedThisAction = false;
    this.pickX = 6.4;
    this.pickZ = -6.3;
    this.placeX = 0;
    this.placeZ = 0;
    this.pickYaw = 0;
    this.placeYaw = 0;

    this._build();
    this._applyIdle();
    this.group.position.set(0, 0, -11.2);
    this.group.rotation.y = 0;
    scene.add(this.group);
  }

  Object.defineProperty(Crane.prototype, 'position', {
    get: function () {
      return this.group.position;
    },
  });

  Crane.prototype._applyIdle = function () {
    this.boomPivot.rotation.x = -0.55;
    this.jibPivot.rotation.x = 0.35;
    this.hook.position.y = -0.15;
    this.turret.rotation.y = 0;
    this.carried.visible = false;
  };

  Crane.prototype.setCarriedPart = function (kind) {
    this.carriedBlock.visible = kind === 'block';
    this.carriedDoor.visible = kind === 'door';
    this.carriedWindow.visible = kind === 'window';
    this.carriedRoof.visible = kind === 'roof';
  };

  Crane.prototype.setCarriedColor = function (hex) {
    this.carriedBlock.material.color.setHex(hex);
  };

  Crane.prototype._yawToward = function (x, z) {
    var world = Math.atan2(x - this.group.position.x, z - this.group.position.z);
    return wrapAngle(world - this.group.rotation.y);
  };

  Crane.prototype.update = function (dt, input, bounds, obstacles) {
    if (!this.busy) {
      driveGroup(this, input, bounds, dt, obstacles);
    }
    spinWheels(this.wheels, this.velocity, dt);

    if (!this.busy) {
      return;
    }

    this.actionTime += dt;
    var t = clamp(this.actionTime / this.actionDuration, 0, 1);

    if (t < 0.18) {
      var turnPick = t / 0.18;
      this.turret.rotation.y = lerpAngle(0, this.pickYaw, turnPick);
      this.boomPivot.rotation.x = -0.55;
      this.jibPivot.rotation.x = 0.35;
      this.hook.position.y = -0.15;
    } else if (t < 0.36) {
      var down = (t - 0.18) / 0.18;
      this.turret.rotation.y = this.pickYaw;
      this.boomPivot.rotation.x = lerpNumber(-0.55, 0.18, down);
      this.jibPivot.rotation.x = lerpNumber(0.35, 0.92, down);
      this.hook.position.y = lerpNumber(-0.15, -1.2, down);
    } else if (t < 0.44) {
      this.turret.rotation.y = this.pickYaw;
      if (!this.pickedThisAction) {
        this.pickedThisAction = true;
        this.carried.visible = true;
        if (this.onPicked) {
          this.onPicked();
        }
      }
    } else if (t < 0.7) {
      var swing = (t - 0.44) / 0.26;
      this.turret.rotation.y = lerpAngle(this.pickYaw, this.placeYaw, swing);
      this.boomPivot.rotation.x = lerpNumber(0.18, -0.62, swing);
      this.jibPivot.rotation.x = lerpNumber(0.92, 0.28, swing);
      this.hook.position.y = lerpNumber(-1.2, -0.22, swing);
      this.carried.visible = true;
    } else if (t < 0.84) {
      var drop = (t - 0.7) / 0.14;
      this.turret.rotation.y = this.placeYaw;
      this.hook.position.y = lerpNumber(-0.22, -1.08, drop);
      if (drop > 0.4 && !this.placedThisAction) {
        this.placedThisAction = true;
        this.carried.visible = false;
        if (this.onPlaced) {
          this.onPlaced();
        }
      }
    } else {
      var back = (t - 0.84) / 0.16;
      this.turret.rotation.y = lerpAngle(this.placeYaw, 0, back);
      this.boomPivot.rotation.x = lerpNumber(-0.62, -0.55, back);
      this.jibPivot.rotation.x = lerpNumber(0.28, 0.35, back);
      this.hook.position.y = lerpNumber(-1.08, -0.15, back);
      this.carried.visible = false;
    }

    if (t >= 1) {
      this.busy = false;
      this.mode = 'idle';
      this._applyIdle();
    }
  };

  Crane.prototype.tryPlace = function () {
    if (this.busy) {
      return false;
    }
    this.busy = true;
    this.mode = 'place';
    this.actionTime = 0;
    this.placedThisAction = false;
    this.pickedThisAction = false;
    this.velocity = 0;
    this.pickYaw = this._yawToward(this.pickX, this.pickZ);
    this.placeYaw = this._yawToward(this.placeX, this.placeZ);
    return true;
  };

  Crane.prototype._build = function () {
    var yellow = 0xffc107;
    var red = 0xef5350;
    var steel = 0x78909c;
    var tire = 0x212121;

    var chassis = boxMesh(1.7, 0.32, 3.4, 0x546e7a);
    chassis.position.set(0, 0.55, 0);
    this.group.add(chassis);

    var self = this;
    [-0.92, 0.92].forEach(function (x) {
      [-1.05, 1.05].forEach(function (z) {
        var wheel = cylinderMesh(0.38, 0.38, 0.38, tire, {}, 12);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.38, z);
        self.group.add(wheel);
        self.wheels.push(wheel);
      });
    });

    var outriggerL = boxMesh(2.4, 0.12, 0.18, steel);
    outriggerL.position.set(0, 0.28, 0);
    this.group.add(outriggerL);

    this.turret = new THREE.Group();
    this.turret.position.set(0, 0.95, -0.15);
    this.group.add(this.turret);

    var cab = boxMesh(1.45, 1.15, 1.35, yellow);
    cab.position.set(0, 0.7, 0.15);
    this.turret.add(cab);

    var roof = boxMesh(1.52, 0.12, 1.42, red);
    roof.position.set(0, 1.32, 0.15);
    this.turret.add(roof);

    var windowFront = boxMesh(1.15, 0.5, 0.08, 0x81d4fa, {
      roughness: 0.18,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
    });
    windowFront.position.set(0, 0.82, 0.85);
    this.turret.add(windowFront);

    addCabSides(this.turret, {
      x: 0.76,
      z: 0.15,
      yWin: 0.88,
      yDoor: 0.42,
      winH: 0.38,
      winD: 0.7,
      doorH: 0.62,
      doorD: 0.72,
      doorColor: 0xffb300,
    });

    var eyeL = sphereMesh(0.1, 0xffffff);
    eyeL.position.set(-0.22, 0.82, 0.88);
    this.turret.add(eyeL);
    var eyeR = sphereMesh(0.1, 0xffffff);
    eyeR.position.set(0.22, 0.82, 0.88);
    this.turret.add(eyeR);
    var pupilL = sphereMesh(0.045, 0x263238);
    pupilL.position.set(-0.22, 0.8, 0.96);
    this.turret.add(pupilL);
    var pupilR = sphereMesh(0.045, 0x263238);
    pupilR.position.set(0.22, 0.8, 0.96);
    this.turret.add(pupilR);

    this.boomPivot = new THREE.Group();
    this.boomPivot.position.set(0, 1.15, 0.2);
    this.turret.add(this.boomPivot);

    var boom = boxMesh(0.32, 0.32, 3.4, red);
    boom.position.set(0, 0.08, 1.6);
    this.boomPivot.add(boom);
    var boomStripe = boxMesh(0.34, 0.12, 3.42, 0xfffde7);
    boomStripe.position.set(0, 0.08, 1.6);
    this.boomPivot.add(boomStripe);

    this.jibPivot = new THREE.Group();
    this.jibPivot.position.set(0, 0.08, 3.25);
    this.boomPivot.add(this.jibPivot);

    var jib = boxMesh(0.22, 0.22, 2.1, yellow);
    jib.position.set(0, 0, 0.95);
    this.jibPivot.add(jib);

    var cable = boxMesh(0.05, 1.4, 0.05, 0x455a64);
    cable.position.set(0, -0.7, 2.0);
    this.jibPivot.add(cable);

    this.hook = new THREE.Group();
    this.hook.position.set(0, -1.45, 2.0);
    this.jibPivot.add(this.hook);

    var hookBall = sphereMesh(0.14, steel);
    this.hook.add(hookBall);
    var hookTip = boxMesh(0.08, 0.22, 0.08, 0x37474f);
    hookTip.position.y = -0.18;
    this.hook.add(hookTip);

    this.carried = new THREE.Group();
    this.carried.position.y = -0.55;
    this.carried.visible = false;
    this.hook.add(this.carried);

    this.carriedBlock = boxMesh(0.7, 0.55, 0.7, 0xff7043);
    this.carried.add(this.carriedBlock);

    this.carriedDoor = boxMesh(0.38, 0.72, 0.12, 0x8d6e63);
    this.carriedDoor.visible = false;
    this.carried.add(this.carriedDoor);
    var carriedKnob = sphereMesh(0.05, 0xffeb3b);
    carriedKnob.position.set(0.14, -0.05, 0.08);
    this.carriedDoor.add(carriedKnob);

    this.carriedWindow = boxMesh(0.55, 0.42, 0.08, 0x4fc3f7, {
      roughness: 0.15,
      metalness: 0.15,
      transparent: true,
      opacity: 0.85,
    });
    this.carriedWindow.visible = false;
    this.carried.add(this.carriedWindow);
    var winFrame = boxMesh(0.62, 0.08, 0.1, 0xfffde7);
    winFrame.position.y = 0.22;
    this.carriedWindow.add(winFrame);

    this.carriedRoof = boxMesh(0.9, 0.12, 0.55, 0xe53935);
    this.carriedRoof.visible = false;
    this.carried.add(this.carriedRoof);
  };

  function Bulldozer(scene) {
    this.group = new THREE.Group();
    this.speed = 6.4;
    this.reverseSpeed = 4.2;
    this.turnSpeed = 1.85;
    this.radius = 2.25;
    this.velocity = 0;
    this.wheels = [];
    this.busy = false;
    this.actionTime = 0;
    this.actionDuration = 0.7;
    this.onPushed = null;

    this._build();
    this.group.position.set(20.5, 0, 16.5);
    this.group.rotation.y = Math.PI;
    scene.add(this.group);
  }

  Object.defineProperty(Bulldozer.prototype, 'position', {
    get: function () {
      return this.group.position;
    },
  });

  Bulldozer.prototype.update = function (dt, input, bounds, obstacles) {
    if (!this.busy) {
      driveGroup(this, input, bounds, dt, obstacles);
    }
    spinWheels(this.wheels, this.velocity, dt);
    if (!this.busy) {
      return;
    }
    this.actionTime += dt;
    var t = clamp(this.actionTime / this.actionDuration, 0, 1);
    this.blade.position.z = 2.05 + Math.sin(t * Math.PI) * 0.28;
    this.blade.position.y = 0.72 - Math.sin(t * Math.PI) * 0.16;
    if (t >= 0.45 && this.onPushed) {
      this.onPushed();
      this.onPushed = null;
    }
    if (t >= 1) {
      this.busy = false;
      this.blade.position.z = 2.05;
      this.blade.position.y = 0.72;
    }
  };

  Bulldozer.prototype.tryPush = function () {
    if (this.busy) {
      return false;
    }
    this.busy = true;
    this.actionTime = 0;
    this.velocity = 0;
    return true;
  };

  Bulldozer.prototype._build = function () {
    var yellow = 0xffc107;
    var cabColor = 0xffb300;
    var steel = 0x78909c;
    var tire = 0x212121;

    var chassis = boxMesh(1.85, 0.38, 3.15, 0x5d4037);
    chassis.position.set(0, 0.62, 0);
    this.group.add(chassis);

    var self = this;
    [-0.95, 0.95].forEach(function (x) {
      [-1.05, 0.85].forEach(function (z) {
        var wheel = cylinderMesh(0.42, 0.42, 0.46, tire, {}, 12);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.42, z);
        self.group.add(wheel);
        self.wheels.push(wheel);
      });
    });

    var body = boxMesh(1.7, 0.85, 2.2, yellow);
    body.position.set(0, 1.22, -0.15);
    this.group.add(body);

    var cab = boxMesh(1.45, 1.05, 1.2, cabColor);
    cab.position.set(0, 1.95, -0.35);
    this.group.add(cab);

    var roof = boxMesh(1.55, 0.12, 1.3, 0xff8f00);
    roof.position.set(0, 2.52, -0.35);
    this.group.add(roof);

    var windowFront = boxMesh(1.15, 0.48, 0.08, 0x81d4fa, {
      roughness: 0.18,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
    });
    windowFront.position.set(0, 2.05, 0.28);
    this.group.add(windowFront);

    addCabSides(this.group, {
      x: 0.76,
      z: -0.35,
      yWin: 2.08,
      yDoor: 1.62,
      winH: 0.38,
      winD: 0.62,
      doorH: 0.58,
      doorD: 0.7,
      doorColor: 0xffb300,
    });

    var eyeL = sphereMesh(0.1, 0xffffff);
    eyeL.position.set(-0.22, 2.08, 0.3);
    this.group.add(eyeL);
    var eyeR = sphereMesh(0.1, 0xffffff);
    eyeR.position.set(0.22, 2.08, 0.3);
    this.group.add(eyeR);
    var pupilL = sphereMesh(0.045, 0x263238);
    pupilL.position.set(-0.22, 2.06, 0.38);
    this.group.add(pupilL);
    var pupilR = sphereMesh(0.045, 0x263238);
    pupilR.position.set(0.22, 2.06, 0.38);
    this.group.add(pupilR);

    this.blade = new THREE.Group();
    this.blade.position.set(0, 0.72, 2.05);
    this.group.add(this.blade);
    var bladeFace = boxMesh(2.35, 0.95, 0.16, steel);
    this.blade.add(bladeFace);
    var bladeLip = boxMesh(2.4, 0.14, 0.28, 0x546e7a);
    bladeLip.position.y = -0.48;
    this.blade.add(bladeLip);
  };

  function RoadRoller(scene) {
    this.group = new THREE.Group();
    this.speed = 5.8;
    this.reverseSpeed = 3.8;
    this.turnSpeed = 1.7;
    this.radius = 2.2;
    this.velocity = 0;
    this.wheels = [];
    this.busy = false;
    this.actionTime = 0;
    this.actionDuration = 0.75;
    this.onRolled = null;

    this._build();
    this.group.position.set(22.8, 0, 13.2);
    this.group.rotation.y = Math.PI;
    scene.add(this.group);
  }

  Object.defineProperty(RoadRoller.prototype, 'position', {
    get: function () {
      return this.group.position;
    },
  });

  RoadRoller.prototype.update = function (dt, input, bounds, obstacles) {
    if (!this.busy) {
      driveGroup(this, input, bounds, dt, obstacles);
    }
    spinWheels(this.wheels, this.velocity, dt);
    if (this.drum) {
      this.drum.rotation.x += this.velocity * dt * 1.4;
    }
    if (!this.busy) {
      return;
    }
    this.actionTime += dt;
    var t = clamp(this.actionTime / this.actionDuration, 0, 1);
    this.drum.position.y = 0.62 + Math.sin(t * Math.PI) * 0.12;
    if (t >= 0.42 && this.onRolled) {
      this.onRolled();
      this.onRolled = null;
    }
    if (t >= 1) {
      this.busy = false;
      this.drum.position.y = 0.62;
    }
  };

  RoadRoller.prototype.tryRoll = function () {
    if (this.busy) {
      return false;
    }
    this.busy = true;
    this.actionTime = 0;
    this.velocity = 0;
    return true;
  };

  RoadRoller.prototype._build = function () {
    var yellow = 0xffee58;
    var cabColor = 0xffc107;
    var steel = 0x607d8b;
    var tire = 0x212121;

    var chassis = boxMesh(1.45, 0.28, 2.6, 0x546e7a);
    chassis.position.set(0, 0.78, -0.15);
    this.group.add(chassis);

    this.drum = cylinderMesh(0.62, 0.62, 1.85, steel, {}, 18);
    this.drum.rotation.z = Math.PI / 2;
    this.drum.position.set(0, 0.62, 1.35);
    this.group.add(this.drum);
    this.wheels.push(this.drum);

    var rear = cylinderMesh(0.48, 0.48, 0.42, tire, {}, 12);
    rear.rotation.z = Math.PI / 2;
    rear.position.set(-0.55, 0.48, -1.15);
    this.group.add(rear);
    this.wheels.push(rear);
    var rearR = rear.clone();
    rearR.position.x = 0.55;
    this.group.add(rearR);
    this.wheels.push(rearR);

    var cab = boxMesh(1.35, 1.15, 1.25, cabColor);
    cab.position.set(0, 1.55, -0.45);
    this.group.add(cab);

    var roof = boxMesh(1.42, 0.12, 1.32, yellow);
    roof.position.set(0, 2.18, -0.45);
    this.group.add(roof);

    var windowFront = boxMesh(1.05, 0.5, 0.08, 0x81d4fa, {
      roughness: 0.18,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
    });
    windowFront.position.set(0, 1.68, 0.2);
    this.group.add(windowFront);

    addCabSides(this.group, {
      x: 0.72,
      z: -0.45,
      yWin: 1.72,
      yDoor: 1.28,
      winH: 0.38,
      winD: 0.62,
      doorH: 0.58,
      doorD: 0.66,
      doorColor: 0xffb300,
    });

    var eyeL = sphereMesh(0.09, 0xffffff);
    eyeL.position.set(-0.2, 1.7, 0.22);
    this.group.add(eyeL);
    var eyeR = sphereMesh(0.09, 0xffffff);
    eyeR.position.set(0.2, 1.7, 0.22);
    this.group.add(eyeR);
    var pupilL = sphereMesh(0.04, 0x263238);
    pupilL.position.set(-0.2, 1.68, 0.3);
    this.group.add(pupilL);
    var pupilR = sphereMesh(0.04, 0x263238);
    pupilR.position.set(0.2, 1.68, 0.3);
    this.group.add(pupilR);
  };

  MBS.Excavator = Excavator;
  MBS.DumpTruck = DumpTruck;
  MBS.ConcreteMixer = ConcreteMixer;
  MBS.Crane = Crane;
  MBS.Bulldozer = Bulldozer;
  MBS.RoadRoller = RoadRoller;
})(window.MBS = window.MBS || {}, window.THREE);
