(function (MBS, THREE) {
  var boxMesh = MBS.boxMesh;
  var cylinderMesh = MBS.cylinderMesh;
  var sphereMesh = MBS.sphereMesh;
  var standardMaterial = MBS.standardMaterial;

  function addTree(parent, x, z, scale) {
    scale = scale || 1;
    var tree = new THREE.Group();
    tree.position.set(x, 0, z);

    var trunk = cylinderMesh(0.22 * scale, 0.28 * scale, 1.4 * scale, 0x8d5a3a);
    trunk.position.y = 0.7 * scale;
    tree.add(trunk);

    var foliageColor = scale > 1.1 ? 0x4caf50 : 0x66bb6a;
    var crownA = sphereMesh(0.95 * scale, foliageColor);
    crownA.position.y = 1.85 * scale;
    tree.add(crownA);

    var crownB = sphereMesh(0.72 * scale, 0x81c784);
    crownB.position.set(0.45 * scale, 1.7 * scale, 0.1 * scale);
    tree.add(crownB);

    parent.add(tree);
    return tree;
  }

  function addCone(parent, x, z) {
    var cone = cylinderMesh(0.04, 0.28, 0.7, 0xff7043, {}, 12);
    cone.position.set(x, 0.35, z);
    parent.add(cone);

    var stripe = cylinderMesh(0.16, 0.2, 0.1, 0xfffde7, {}, 12);
    stripe.position.set(x, 0.42, z);
    parent.add(stripe);
  }

  function addCloud(parent, x, y, z, scale) {
    scale = scale || 1;
    var cloud = new THREE.Group();
    cloud.position.set(x, y, z);
    var puffs = [
      [0, 0, 0, 1],
      [1.1, 0.15, 0.2, 0.75],
      [-1.0, 0.1, -0.15, 0.7],
      [0.2, 0.35, -0.4, 0.55],
    ];
    puffs.forEach(function (puffData) {
      var puff = sphereMesh(0.9 * puffData[3] * scale, 0xffffff, { roughness: 1, metalness: 0 });
      puff.position.set(puffData[0] * scale, puffData[1] * scale, puffData[2] * scale);
      puff.castShadow = false;
      cloud.add(puff);
    });
    parent.add(cloud);
    return cloud;
  }

  function addTownHouse(parent, x, z, bodyColor, scale) {
    scale = scale || 1;
    var house = new THREE.Group();
    house.position.set(x, 0, z);
    house.rotation.y = Math.atan2(x, z) + Math.PI;
    var body = boxMesh(2.4 * scale, 2.4 * scale, 2.2 * scale, bodyColor);
    body.position.y = 1.2 * scale;
    house.add(body);
    var roof = boxMesh(2.8 * scale, 0.85 * scale, 2.5 * scale, 0xd32f2f);
    roof.position.y = 2.55 * scale;
    house.add(roof);
    var win = boxMesh(0.55 * scale, 0.5 * scale, 0.08 * scale, 0x81d4fa);
    win.position.set(-0.45 * scale, 1.35 * scale, 1.14 * scale);
    house.add(win);
    var winB = win.clone();
    winB.position.x = 0.5 * scale;
    house.add(winB);
    parent.add(house);
    return house;
  }

  function addFlower(parent, x, z, color, scale) {
    scale = scale || 1;
    var stem = cylinderMesh(0.028 * scale, 0.034 * scale, 0.32 * scale, 0x66bb6a, {}, 6);
    stem.position.set(x, 0.16 * scale, z);
    stem.castShadow = false;
    parent.add(stem);

    var petalA = sphereMesh(0.11 * scale, color);
    petalA.position.set(x, 0.34 * scale, z);
    petalA.scale.set(1.15, 0.42, 1.15);
    petalA.castShadow = false;
    parent.add(petalA);

    var petalB = sphereMesh(0.08 * scale, color);
    petalB.position.set(x + 0.07 * scale, 0.33 * scale, z + 0.04 * scale);
    petalB.scale.y = 0.4;
    petalB.castShadow = false;
    parent.add(petalB);

    var center = sphereMesh(0.045 * scale, 0xffeb3b);
    center.position.set(x, 0.36 * scale, z);
    center.castShadow = false;
    parent.add(center);
  }

  function addBush(parent, x, z, scale) {
    scale = scale || 1;
    var bush = sphereMesh(0.72 * scale, 0x43a047);
    bush.position.set(x, 0.32 * scale, z);
    bush.scale.y = 0.55;
    parent.add(bush);
  }

  function makeDoor() {
    var group = new THREE.Group();
    var panel = boxMesh(1.72, 2.65, 0.18, 0x8d6e63);
    group.add(panel);
    var inset = boxMesh(1.28, 0.52, 0.04, 0x6d4c41);
    inset.position.set(0, 0.62, 0.1);
    group.add(inset);
    var glass = boxMesh(0.58, 0.4, 0.05, 0x81d4fa, {
      roughness: 0.16,
      metalness: 0.18,
      transparent: true,
      opacity: 0.88,
    });
    glass.position.set(0, 0.62, 0.13);
    group.add(glass);
    var knob = sphereMesh(0.08, 0xffeb3b);
    knob.position.set(0.62, -0.72, 0.14);
    group.add(knob);
    return group;
  }

  function makeWindow() {
    var group = new THREE.Group();
    var glass = boxMesh(0.82, 0.7, 0.06, 0x4fc3f7, {
      roughness: 0.12,
      metalness: 0.18,
      transparent: true,
      opacity: 0.82,
    });
    group.add(glass);
    var frameT = boxMesh(0.96, 0.1, 0.12, 0xfffde7);
    frameT.position.y = 0.4;
    group.add(frameT);
    var frameB = boxMesh(0.96, 0.1, 0.12, 0xfffde7);
    frameB.position.y = -0.4;
    group.add(frameB);
    var frameL = boxMesh(0.1, 0.8, 0.12, 0xfffde7);
    frameL.position.x = -0.43;
    group.add(frameL);
    var frameR = boxMesh(0.1, 0.8, 0.12, 0xfffde7);
    frameR.position.x = 0.43;
    group.add(frameR);
    var crossH = boxMesh(0.82, 0.07, 0.08, 0xfffde7);
    group.add(crossH);
    var crossV = boxMesh(0.07, 0.7, 0.08, 0xfffde7);
    group.add(crossV);
    return group;
  }

  function makeRoofSlope(tilt) {
    var group = new THREE.Group();
    var slab = boxMesh(7.4, 0.28, 4.35, 0xc62828);
    slab.rotation.x = tilt;
    group.add(slab);
    var stripe = boxMesh(0.28, 0.18, 4.2, 0xb71c1c);
    stripe.rotation.x = tilt;
    stripe.position.set(0, 0.08, tilt > 0 ? -2.05 : 2.05);
    group.add(stripe);
    return group;
  }

  function makeRoofGable(color) {
    var shape = new THREE.Shape();
    shape.moveTo(-3.72, -0.58);
    shape.lineTo(3.72, -0.58);
    shape.lineTo(0, 1.08);
    shape.closePath();
    var mesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false }),
      standardMaterial(color || 0xb71c1c, { side: THREE.DoubleSide }),
    );
    if (!MBS.isMobile()) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
    return mesh;
  }

  function makeSandbox() {
    var group = new THREE.Group();
    var box = boxMesh(2.45, 0.28, 2.45, 0xd7a15a);
    box.position.y = 0.16;
    group.add(box);
    var sand = boxMesh(2.05, 0.16, 2.05, 0xf5d76e);
    sand.position.y = 0.3;
    group.add(sand);
    [[0, 1.22], [0, -1.22], [1.22, 0], [-1.22, 0]].forEach(function (spot, index) {
      var rim = boxMesh(index < 2 ? 2.55 : 0.16, 0.2, index < 2 ? 0.16 : 2.55, 0x8d6e63);
      rim.position.set(spot[0], 0.28, spot[1]);
      group.add(rim);
    });
    return group;
  }

  function makeSlide() {
    var group = new THREE.Group();
    var tower = boxMesh(1.15, 1.65, 1.15, 0x42a5f5);
    tower.position.y = 0.9;
    group.add(tower);
    var railL = boxMesh(0.1, 0.7, 0.1, 0xffee58);
    railL.position.set(-0.42, 1.85, 0);
    group.add(railL);
    var railR = railL.clone();
    railR.position.x = 0.42;
    group.add(railR);
    var chute = boxMesh(0.9, 0.12, 2.55, 0xffee58);
    chute.position.set(0, 0.82, 1.45);
    chute.rotation.x = 0.52;
    group.add(chute);
    return group;
  }

  function makeSwing() {
    var group = new THREE.Group();
    var postL = boxMesh(0.16, 2.15, 0.16, 0x8d6e63);
    postL.position.set(-0.95, 1.08, 0);
    group.add(postL);
    var postR = postL.clone();
    postR.position.x = 0.95;
    group.add(postR);
    var top = boxMesh(2.1, 0.14, 0.14, 0x8d6e63);
    top.position.y = 2.16;
    group.add(top);
    var ropeL = boxMesh(0.05, 1.18, 0.05, 0xffcc80);
    ropeL.position.set(-0.35, 1.42, 0);
    group.add(ropeL);
    var ropeR = ropeL.clone();
    ropeR.position.x = 0.35;
    group.add(ropeR);
    var seat = boxMesh(0.88, 0.1, 0.38, 0xef5350);
    seat.position.y = 0.82;
    group.add(seat);
    return group;
  }

  function makeBench() {
    var group = new THREE.Group();
    var seat = boxMesh(1.55, 0.12, 0.48, 0x8d6e63);
    seat.position.y = 0.52;
    group.add(seat);
    var back = boxMesh(1.55, 0.42, 0.1, 0xa1887f);
    back.position.set(0, 0.82, -0.22);
    group.add(back);
    var legL = boxMesh(0.12, 0.5, 0.12, 0x6d4c41);
    legL.position.set(-0.58, 0.25, 0);
    group.add(legL);
    var legR = legL.clone();
    legR.position.x = 0.58;
    group.add(legR);
    return group;
  }

  function makeLamp() {
    var group = new THREE.Group();
    var pole = cylinderMesh(0.06, 0.06, 2.05, 0x90a4ae, {}, 8);
    pole.position.y = 1.05;
    group.add(pole);
    var lamp = sphereMesh(0.22, 0xfff59d, { emissive: 0xffe082, emissiveIntensity: 0.45, roughness: 1 });
    lamp.position.y = 2.12;
    group.add(lamp);
    return group;
  }

  function ConstructionSite(scene) {
    this.scene = scene;
    this.bounds = 28;
    this.digTarget = new THREE.Vector3(0, 0, 0);
    this.digRadius = 4.4;
    this.pitLevel = 0;
    this.clouds = [];
    this.marker = null;
    this.pit = null;
    this.dirtPiles = [];
    this.dumpTarget = new THREE.Vector3(17, 0, 5);
    this.dumpRadius = 5.8;
    this.dumpMarker = null;
    this.dumpGlow = null;
    this.foundation = [];
    this.foundationLevel = 0;
    this.walls = [];
    this.wallLevel = 0;
    this.blockPile = [];
    this.houseParts = [];
    this.housePile = [];
    this.houseLevel = 0;
    this.houseKinds = ['door', 'window', 'window', 'window', 'roof'];
    this.houseColors = [0x8d6e63, 0x4fc3f7, 0x4fc3f7, 0x4fc3f7, 0xe53935];
    this.workTarget = new THREE.Vector3(0, 0, 0);
    this.workRadius = 6.4;
    this.roads = [];
    this.roadLevel = 0;
    this.roadSpots = [
      { x: 11.2, z: 8.4 },
      { x: 13.6, z: 8.4 },
      { x: 16.0, z: 8.4 },
      { x: 18.4, z: 8.4 },
    ];
    this.playItems = [];
    this.playLevel = 0;
    this.playSpots = [
      { x: -12.2, z: -15.2 },
      { x: -9.4, z: -17.4 },
      { x: -14.8, z: -17.2 },
    ];
    this.playPile = [];
    this.playColors = [0xf5d76e, 0x42a5f5, 0xef5350];
    this.playPileSpot = { x: -7.6, z: -13.4 };
    this.gravelTarget = new THREE.Vector3(8.2, 0, 11.6);
    this.gravelRadius = 5.6;
    this.gravelPiles = [];
    this.roadMounds = [];
    this.roadGravel = [];
    this.gradeLevel = 0;
    this.bridgeItems = [];
    this.bridgeLevel = 0;
    this.bridgeSpots = [
      { x: 20.4, z: 8.4 },
      { x: 21.6, z: 8.4 },
      { x: 22.8, z: 8.4 },
      { x: 24.0, z: 8.4 },
    ];
    this.bridgePileSpot = { x: 18.2, z: 12.4 };
    this.bridgePile = [];
    this.benches = [];
    this.benchLevel = 0;
    this.benchSpots = [
      { x: -9.2, z: -14.2 },
      { x: -15.0, z: -14.6 },
      { x: -11.4, z: -18.8 },
    ];
    this.parkTrees = [];
    this.treeLevel = 0;
    this.treeSpots = [
      { x: -16.6, z: -16.2 },
      { x: -8.2, z: -19.4 },
      { x: -14.8, z: -19.6 },
      { x: -10.6, z: -13.2 },
    ];
    this.lamps = [];
    this.lampLevel = 0;
    this.lampSpots = [
      { x: -8.6, z: -16.4 },
      { x: -15.6, z: -16.8 },
    ];

    this._createGround();
    this._createYard();
    this._createDecor();
    this._createHorizon();
    this._createPit();
    this._createFoundation();
    this._createWalls();
    this._createHouseParts();
    this._createDumpZone();
    this._createRoad();
    this._createBridge();
    this._createPlayground();
  }

  ConstructionSite.prototype.isInDigZone = function (x, z) {
    return Math.hypot(x - this.digTarget.x, z - this.digTarget.z) <= this.digRadius;
  };

  ConstructionSite.prototype.deepenPit = function () {
    this.pitLevel = Math.min(3, this.pitLevel + 1);
    this.pit.visible = true;
    var size = 1.4 + this.pitLevel * 0.45;
    this.pit.scale.set(size, 1, size);
    this.pit.position.y = -0.06 * this.pitLevel;

    var angle = (this.pitLevel / 3) * Math.PI * 1.4;
    var pile = sphereMesh(0.45 + this.pitLevel * 0.08, 0x8d6e4c);
    pile.scale.y = 0.55;
    pile.position.set(Math.cos(angle) * 2.1, 0.22, Math.sin(angle) * 2.1);
    this.scene.add(pile);
    this.dirtPiles.push(pile);
  }

  ConstructionSite.prototype.isInDumpZone = function (x, z) {
    return Math.hypot(x - this.dumpTarget.x, z - this.dumpTarget.z) <= this.dumpRadius;
  };

  ConstructionSite.prototype.takeDirtPile = function () {
    for (var i = 0; i < this.dirtPiles.length; i += 1) {
      if (this.dirtPiles[i].visible) {
        this.dirtPiles[i].visible = false;
        return true;
      }
    }
    return false;
  };

  ConstructionSite.prototype.placeDumpedDirt = function () {
    var pile = sphereMesh(1.05, 0x8d6e4c);
    pile.scale.y = 0.62;
    pile.position.set(this.dumpTarget.x, 0.38, this.dumpTarget.z);
    this.scene.add(pile);
    var pileB = sphereMesh(0.7, 0x7a5a3a);
    pileB.scale.y = 0.5;
    pileB.position.set(this.dumpTarget.x + 0.85, 0.26, this.dumpTarget.z + 0.35);
    this.scene.add(pileB);
  };

  ConstructionSite.prototype.showDumpMarker = function () {
    if (this.dumpMarker) {
      this.dumpMarker.visible = true;
    }
    if (this.dumpGlow) {
      this.dumpGlow.visible = true;
    }
  };

  ConstructionSite.prototype.setPourMode = function () {
    if (this.marker) {
      this.marker.material.color.setHex(0xb0bec5);
    }
    if (this.glow) {
      this.glow.material.color.setHex(0xeceff1);
    }
    if (this.dumpMarker) {
      this.dumpMarker.visible = false;
    }
    if (this.dumpGlow) {
      this.dumpGlow.visible = false;
    }
  };

  ConstructionSite.prototype.setWallMode = function () {
    if (this.marker) {
      this.marker.material.color.setHex(0xff7043);
    }
    if (this.glow) {
      this.glow.material.color.setHex(0xffcc80);
    }
    if (this.dumpMarker) {
      this.dumpMarker.visible = false;
    }
    if (this.dumpGlow) {
      this.dumpGlow.visible = false;
    }
  };

  ConstructionSite.prototype.setFinishMode = function () {
    if (this.marker) {
      this.marker.material.color.setHex(0xab47bc);
    }
    if (this.glow) {
      this.glow.material.color.setHex(0xe1bee7);
    }
    if (this.dumpMarker) {
      this.dumpMarker.visible = false;
    }
    if (this.dumpGlow) {
      this.dumpGlow.visible = false;
    }
    this.housePile.forEach(function (item) {
      item.visible = true;
    });
  };

  ConstructionSite.prototype.pourNextSection = function () {
    if (this.foundationLevel >= this.foundation.length) {
      return false;
    }
    var slab = this.foundation[this.foundationLevel];
    slab.visible = true;
    slab.scale.y = 0.15;
    this.foundationLevel += 1;
    return true;
  };

  ConstructionSite.prototype.placeNextWall = function () {
    if (this.wallLevel >= this.walls.length) {
      return false;
    }
    var wall = this.walls[this.wallLevel];
    wall.visible = true;
    wall.scale.y = 0.2;
    this.wallLevel += 1;
    return true;
  };

  ConstructionSite.prototype.nextHouseKind = function () {
    return this.houseKinds[this.houseLevel] || 'roof';
  };

  ConstructionSite.prototype.nextHouseColor = function () {
    return this.houseColors[this.houseLevel] || 0xe53935;
  };

  ConstructionSite.prototype.hideNextHousePart = function () {
    if (this.housePile[this.houseLevel]) {
      this.housePile[this.houseLevel].visible = false;
    }
  };

  ConstructionSite.prototype.placeNextHousePart = function () {
    if (this.houseLevel >= this.houseParts.length) {
      return false;
    }
    var part = this.houseParts[this.houseLevel];
    part.visible = true;
    var full = part.userData.fullScale || 1;
    part.scale.set(full, 0.2, full);
    if (this.housePile[this.houseLevel]) {
      this.housePile[this.houseLevel].visible = false;
    }
    this.houseLevel += 1;
    return true;
  };

  ConstructionSite.prototype.update = function (time) {
    if (this.marker) {
      var pulse = 1 + Math.sin(time * 2.4) * 0.07;
      this.marker.scale.set(pulse, pulse, pulse);
      this.marker.material.opacity = 0.75 + Math.sin(time * 2.4) * 0.2;
    }
    if (this.glow) {
      var glowPulse = 1 + Math.sin(time * 2.4) * 0.05;
      this.glow.scale.set(glowPulse, glowPulse, glowPulse);
    }
    if (this.dumpMarker && this.dumpMarker.visible) {
      var dumpPulse = 1 + Math.sin(time * 2.2) * 0.07;
      this.dumpMarker.scale.set(dumpPulse, dumpPulse, dumpPulse);
      this.dumpMarker.material.opacity = 0.75 + Math.sin(time * 2.2) * 0.2;
    }
    if (this.dumpGlow && this.dumpGlow.visible) {
      var dumpGlowPulse = 1 + Math.sin(time * 2.2) * 0.05;
      this.dumpGlow.scale.set(dumpGlowPulse, dumpGlowPulse, dumpGlowPulse);
    }

    this.clouds.forEach(function (cloud, index) {
      cloud.position.x += Math.sin(time * 0.12 + index) * 0.003;
    });

    this.blockPile.forEach(function (block) {
      if (!block.visible) {
        return;
      }
      var targetY = block.userData.targetY;
      if (typeof targetY === 'number') {
        block.position.y += (targetY - block.position.y) * 0.22;
      }
    });

    this.foundation.forEach(function (slab) {
      if (slab.visible && slab.scale.y < 1) {
        slab.scale.y = Math.min(1, slab.scale.y + 0.045);
      }
    });
    this.walls.forEach(function (wall) {
      if (wall.visible && wall.scale.y < 1) {
        wall.scale.y = Math.min(1, wall.scale.y + 0.06);
      }
    });
    this.houseParts.forEach(function (part) {
      var full = part.userData.fullScale || 1;
      if (part.visible && part.scale.y < full) {
        var next = Math.min(full, part.scale.y + 0.07);
        part.scale.set(full, next, full);
      }
    });
    this.roads.forEach(function (slab) {
      var full = slab.userData.fullScale || 1;
      if (slab.visible && slab.scale.y < full) {
        slab.scale.y = Math.min(full, slab.scale.y + 0.08);
      }
    });
    this.playItems.forEach(function (item) {
      var full = item.userData.fullScale || 1;
      if (item.visible && item.scale.y < full) {
        var next = Math.min(full, item.scale.y + 0.08);
        item.scale.set(full, next, full);
      }
    });
    this.bridgeItems.forEach(function (item) {
      var full = item.userData.fullScale || 1;
      if (item.visible && item.scale.y < full) {
        var next = Math.min(full, item.scale.y + 0.08);
        item.scale.set(full, next, full);
      }
    });
    this.benches.forEach(function (item) {
      var full = item.userData.fullScale || 1;
      if (item.visible && item.scale.y < full) {
        var next = Math.min(full, item.scale.y + 0.08);
        item.scale.set(full, next, full);
      }
    });
    this.parkTrees.forEach(function (item) {
      var full = item.userData.fullScale || 1;
      if (item.visible && item.scale.y < full) {
        var next = Math.min(full, item.scale.y + 0.08);
        item.scale.set(full, next, full);
      }
    });
    this.lamps.forEach(function (item) {
      var full = item.userData.fullScale || 1;
      if (item.visible && item.scale.y < full) {
        var next = Math.min(full, item.scale.y + 0.08);
        item.scale.set(full, next, full);
      }
    });
  };

  ConstructionSite.prototype._createGround = function () {
    var ground = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90),
      standardMaterial(0x7ec36a, { roughness: 0.95 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    var hills = [
      [-28, -18, 8],
      [30, -22, 9],
      [-24, 26, 7],
      [26, 24, 8.5],
    ];
    hills.forEach(function (hillData) {
      var hill = sphereMesh(hillData[2], 0x68b35c);
      hill.position.set(hillData[0], -hillData[2] * 0.45, hillData[1]);
      hill.castShadow = false;
      this.scene.add(hill);
    }, this);
  };

  ConstructionSite.prototype._createYard = function () {
    var pad = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.08, 16),
      standardMaterial(0xd7b07a, { roughness: 1 }),
    );
    pad.position.y = 0.04;
    pad.receiveShadow = true;
    this.scene.add(pad);

    var inner = new THREE.Mesh(
      new THREE.BoxGeometry(7.5, 0.09, 7.5),
      standardMaterial(0xc49a6c, { roughness: 1 }),
    );
    inner.position.y = 0.05;
    inner.receiveShadow = true;
    this.scene.add(inner);

    var outline = [
      [0, 3.9, 8.2, 0.18],
      [0, -3.9, 8.2, 0.18],
      [3.9, 0, 0.18, 8.2],
      [-3.9, 0, 0.18, 8.2],
    ];
    var scene = this.scene;
    outline.forEach(function (item) {
      var plank = boxMesh(item[2], 0.12, item[3], 0xfff8e1);
      plank.position.set(item[0], 0.12, item[1]);
      scene.add(plank);
    });

    var fenceSize = 8.6;
    for (var i = -2; i <= 2; i += 1) {
      this._addFencePost(i * 2.1, fenceSize);
      this._addFencePost(i * 2.1, -fenceSize);
      this._addFencePost(fenceSize, i * 2.1);
      this._addFencePost(-fenceSize, i * 2.1);
    }

    var railZ = boxMesh(16.8, 0.12, 0.12, 0xffcc80);
    railZ.position.set(0, 0.62, fenceSize);
    this.scene.add(railZ);
    var railZ2 = railZ.clone();
    railZ2.position.z = -fenceSize;
    this.scene.add(railZ2);
    var railX = boxMesh(0.12, 0.12, 16.8, 0xffcc80);
    railX.position.set(fenceSize, 0.62, 0);
    this.scene.add(railX);
    var railX2 = railX.clone();
    railX2.position.x = -fenceSize;
    this.scene.add(railX2);

    addCone(this.scene, 7.2, 7.2);
    addCone(this.scene, -7.2, 7.2);
    addCone(this.scene, 7.2, -7.2);
    addCone(this.scene, -7.2, -7.2);
  };

  ConstructionSite.prototype._addFencePost = function (x, z) {
    var post = boxMesh(0.18, 1.1, 0.18, 0xffb74d);
    post.position.set(x, 0.55, z);
    this.scene.add(post);
  };

  ConstructionSite.prototype._createDecor = function () {
    addTree(this.scene, -14, -10, 1.15);
    addTree(this.scene, -16, 6, 0.95);
    addTree(this.scene, 15, -8, 1.2);
    addTree(this.scene, 13, 11, 1);
    addTree(this.scene, -10, 16, 0.85);

    var flowerColors = [0xff80ab, 0xfff176, 0xce93d8, 0xff8a80, 0xffffff, 0x80d8ff];
    var yardFlowers = [
      [9.2, 12.4],
      [10.8, 10.1],
      [8.4, 8.6],
      [-9.5, 11.2],
      [-11.4, 8.8],
      [-8.2, 13.6],
      [12.6, -5.4],
      [14.2, -7.8],
      [11.1, -10.2],
      [-13.2, -5.6],
      [-11.6, -8.4],
      [-14.8, 2.2],
      [10.4, 3.5],
      [18.2, -6.4],
      [-17.4, -9.2],
      [7.6, 14.8],
      [-6.8, 14.2],
      [22.4, 12.6],
      [-19.2, 6.4],
      [4.8, 16.5],
      [-4.2, 17.2],
      [15.8, 12.4],
      [-15.6, 12.8],
      [20.2, -8.8],
    ];
    var self = this;
    var dumpX = this.dumpTarget.x;
    var dumpZ = this.dumpTarget.z;
    yardFlowers.forEach(function (spot, index) {
      if (Math.hypot(spot[0] - dumpX, spot[1] - dumpZ) < 7.4) {
        return;
      }
      addFlower(self.scene, spot[0], spot[1], flowerColors[index % flowerColors.length], 0.85 + (index % 4) * 0.12);
    });

    var sun = sphereMesh(2.4, 0xffe082, { emissive: 0xffcc66, emissiveIntensity: 0.65, roughness: 1 });
    sun.position.set(-22, 22, -18);
    sun.castShadow = false;
    this.scene.add(sun);

    this.clouds.push(
      addCloud(this.scene, -8, 16, -12, 1.3),
      addCloud(this.scene, 10, 17, -6, 1.1),
      addCloud(this.scene, 4, 15, 14, 0.9),
      addCloud(this.scene, -18, 18, 8, 1.4),
    );
  };

  ConstructionSite.prototype._createHorizon = function () {
    var mobile = MBS.isMobile();
    var houseCount = mobile ? 8 : 14;
    var treeCount = mobile ? 10 : 22;
    var bushCount = mobile ? 12 : 30;
    var flowerCount = mobile ? 16 : 42;
    var colors = [0xffcc80, 0x90caf9, 0xce93d8, 0xffab91, 0xa5d6a7, 0xfff59d];
    var i;
    for (i = 0; i < houseCount; i += 1) {
      var angle = (i / houseCount) * Math.PI * 2 + 0.18;
      var radius = 38 + (i % 3) * 2.5;
      addTownHouse(
        this.scene,
        Math.sin(angle) * radius,
        Math.cos(angle) * radius,
        colors[i % colors.length],
        1.05 + (i % 3) * 0.2,
      );
    }
    for (i = 0; i < treeCount; i += 1) {
      var treeAngle = (i / treeCount) * Math.PI * 2;
      addTree(this.scene, Math.sin(treeAngle) * 31.5, Math.cos(treeAngle) * 31.5, 0.85 + (i % 4) * 0.2);
    }
    for (i = 0; i < bushCount; i += 1) {
      var bushAngle = (i / bushCount) * Math.PI * 2;
      addBush(this.scene, Math.sin(bushAngle) * 28.6, Math.cos(bushAngle) * 28.6, 0.85 + (i % 3) * 0.22);
    }
    var flowerColors = [0xff80ab, 0xfff176, 0xce93d8, 0xff8a80, 0xffffff, 0x80d8ff, 0xffab91];
    for (i = 0; i < flowerCount; i += 1) {
      var flowerAngle = (i / flowerCount) * Math.PI * 2 + 0.07;
      var flowerRadius = 24.5 + (i % 5) * 1.15;
      addFlower(
        this.scene,
        Math.sin(flowerAngle) * flowerRadius,
        Math.cos(flowerAngle) * flowerRadius,
        flowerColors[i % flowerColors.length],
        0.8 + (i % 4) * 0.14,
      );
    }
  };

  ConstructionSite.prototype._createPit = function () {
    var glow = new THREE.Mesh(
      new THREE.CircleGeometry(2.7, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffee58,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(this.digTarget.x, 0.1, this.digTarget.z);
    this.scene.add(glow);
    this.glow = glow;

    this.marker = new THREE.Mesh(
      new THREE.RingGeometry(2.35, 3.05, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff6f00,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      }),
    );
    this.marker.rotation.x = -Math.PI / 2;
    this.marker.position.set(this.digTarget.x, 0.12, this.digTarget.z);
    this.scene.add(this.marker);

    this.pit = cylinderMesh(1, 1.15, 0.35, 0x6d4c41, { roughness: 1 }, 20);
    this.pit.position.copy(this.digTarget);
    this.pit.position.y = -0.05;
    this.pit.visible = false;
    this.scene.add(this.pit);
  };

  ConstructionSite.prototype._createFoundation = function () {
    var spots = [-2.15, 0, 2.15];
    var self = this;
    spots.forEach(function (x) {
      var slab = boxMesh(2.05, 0.42, 6.6, 0xb0b7bd);
      slab.position.set(x, 0.22, 0);
      slab.visible = false;
      slab.scale.y = 0.15;
      self.scene.add(slab);
      self.foundation.push(slab);
    });
  };

  ConstructionSite.prototype._createWalls = function () {
    var wallH = 2.65;
    var wallY = 0.43 + wallH / 2;
    var specs = [
      { w: 6.5, h: wallH, d: 0.42, x: 0, y: wallY, z: -3.35, color: 0xef5350 },
      { w: 0.42, h: wallH, d: 6.5, x: -3.35, y: wallY, z: 0, color: 0xffa726 },
      { w: 0.42, h: wallH, d: 6.5, x: 3.35, y: wallY, z: 0, color: 0xffee58 },
      { w: 2.35, h: wallH, d: 0.42, x: -2.05, y: wallY, z: 3.35, color: 0x66bb6a },
      { w: 2.35, h: wallH, d: 0.42, x: 2.05, y: wallY, z: 3.35, color: 0x42a5f5 },
    ];
    var self = this;
    specs.forEach(function (spec) {
      var wall = boxMesh(spec.w, spec.h, spec.d, spec.color);
      wall.position.set(spec.x, spec.y, spec.z);
      wall.visible = false;
      wall.scale.y = 0.2;
      self.scene.add(wall);
      self.walls.push(wall);
    });

    this.wallColors = [0xef5350, 0xffa726, 0xffee58, 0x66bb6a, 0x42a5f5];
    this.wallColors.forEach(function (color, index) {
      var block = boxMesh(0.85, 0.7, 0.85, color);
      var fromTop = self.wallColors.length - 1 - index;
      var y = 0.38 + fromTop * 0.72;
      block.position.set(6.4, y, -6.3);
      block.userData.targetY = y;
      self.scene.add(block);
      self.blockPile.push(block);
    });
  };

  ConstructionSite.prototype.nextWallColor = function () {
    var top = this._topBlock();
    return top ? top.material.color.getHex() : 0xff7043;
  };

  ConstructionSite.prototype._topBlock = function () {
    var top = null;
    var i;
    for (i = 0; i < this.blockPile.length; i += 1) {
      var block = this.blockPile[i];
      if (block.visible && (!top || block.position.y >= top.position.y)) {
        top = block;
      }
    }
    return top;
  };

  ConstructionSite.prototype.hideNextBlock = function () {
    var top = this._topBlock();
    if (!top) {
      return;
    }
    top.visible = false;
    this._restackBlocks();
  };

  ConstructionSite.prototype._restackBlocks = function () {
    var remaining = [];
    var i;
    for (i = 0; i < this.blockPile.length; i += 1) {
      if (this.blockPile[i].visible) {
        remaining.push(this.blockPile[i]);
      }
    }
    remaining.sort(function (a, b) {
      return a.position.y - b.position.y;
    });
    for (i = 0; i < remaining.length; i += 1) {
      var y = 0.38 + i * 0.72;
      remaining[i].userData.targetY = y;
      remaining[i].position.y = y;
    }
  };

  ConstructionSite.prototype._createHouseParts = function () {
    var door = makeDoor();
    door.position.set(0, 1.755, 3.42);
    door.visible = false;
    door.userData.fullScale = 1;
    door.scale.set(1, 0.2, 1);
    this.scene.add(door);
    this.houseParts.push(door);

    var windowL = makeWindow();
    windowL.position.set(-2.05, 2.22, 3.62);
    windowL.userData.fullScale = 1.15;
    windowL.scale.set(1.15, 0.2, 1.15);
    windowL.visible = false;
    this.scene.add(windowL);
    this.houseParts.push(windowL);

    var windowR = makeWindow();
    windowR.position.set(2.05, 2.22, 3.62);
    windowR.userData.fullScale = 1.15;
    windowR.scale.set(1.15, 0.2, 1.15);
    windowR.visible = false;
    this.scene.add(windowR);
    this.houseParts.push(windowR);

    var windowS = makeWindow();
    windowS.position.set(-3.62, 2.22, 0.2);
    windowS.rotation.y = Math.PI / 2;
    windowS.userData.fullScale = 1.15;
    windowS.scale.set(1.15, 0.2, 1.15);
    windowS.visible = false;
    this.scene.add(windowS);
    this.houseParts.push(windowS);

    var roof = new THREE.Group();
    roof.position.set(0, 3.58, 0);
    var roofBack = makeRoofSlope(-0.4);
    roofBack.position.set(0, 0, -1.9);
    roof.add(roofBack);
    var roofFront = makeRoofSlope(0.4);
    roofFront.position.set(0, 0, 1.9);
    roof.add(roofFront);
    var gableL = makeRoofGable(0xb71c1c);
    gableL.rotation.y = -Math.PI / 2;
    gableL.position.set(-3.58, 0, 0.09);
    roof.add(gableL);
    var gableR = makeRoofGable(0xc62828);
    gableR.rotation.y = Math.PI / 2;
    gableR.position.set(3.58, 0, -0.09);
    roof.add(gableR);
    var chimney = boxMesh(0.55, 0.85, 0.55, 0xbcaaa4);
    chimney.position.set(-1.8, 0.83, -0.15);
    roof.add(chimney);
    var chimneyTop = boxMesh(0.68, 0.14, 0.68, 0x8d6e63);
    chimneyTop.position.set(-1.8, 1.28, -0.15);
    roof.add(chimneyTop);
    roof.visible = false;
    roof.userData.fullScale = 1;
    roof.scale.set(1, 0.2, 1);
    this.scene.add(roof);
    this.houseParts.push(roof);

    var pileDoor = makeDoor();
    pileDoor.scale.set(0.42, 0.42, 0.42);
    pileDoor.position.set(6.5, 0.58, 4.85);
    pileDoor.visible = false;
    this.scene.add(pileDoor);
    this.housePile.push(pileDoor);

    var pileWinA = makeWindow();
    pileWinA.scale.set(0.7, 0.7, 0.7);
    pileWinA.position.set(5.95, 0.48, 5.85);
    pileWinA.visible = false;
    this.scene.add(pileWinA);
    this.housePile.push(pileWinA);

    var pileWinB = makeWindow();
    pileWinB.scale.set(0.7, 0.7, 0.7);
    pileWinB.position.set(6.75, 0.48, 5.85);
    pileWinB.visible = false;
    this.scene.add(pileWinB);
    this.housePile.push(pileWinB);

    var pileWinC = makeWindow();
    pileWinC.scale.set(0.7, 0.7, 0.7);
    pileWinC.position.set(7.55, 0.48, 5.85);
    pileWinC.visible = false;
    this.scene.add(pileWinC);
    this.housePile.push(pileWinC);

    var pileRoof = boxMesh(1.6, 0.22, 1.1, 0xe53935);
    pileRoof.position.set(6.7, 0.2, 6.7);
    pileRoof.rotation.y = 0.18;
    pileRoof.visible = false;
    this.scene.add(pileRoof);
    this.housePile.push(pileRoof);
  };

  ConstructionSite.prototype._createDumpZone = function () {
    var pad = new THREE.Mesh(
      new THREE.CircleGeometry(3.4, 28),
      standardMaterial(0xc49a6c, { roughness: 1 }),
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(this.dumpTarget.x, 0.06, this.dumpTarget.z);
    pad.receiveShadow = true;
    this.scene.add(pad);

    this.dumpGlow = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 32),
      new THREE.MeshBasicMaterial({
        color: 0x81d4fa,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    this.dumpGlow.rotation.x = -Math.PI / 2;
    this.dumpGlow.position.set(this.dumpTarget.x, 0.1, this.dumpTarget.z);
    this.dumpGlow.visible = false;
    this.scene.add(this.dumpGlow);

    this.dumpMarker = new THREE.Mesh(
      new THREE.RingGeometry(2.25, 2.95, 32),
      new THREE.MeshBasicMaterial({
        color: 0x0288d1,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
      }),
    );
    this.dumpMarker.rotation.x = -Math.PI / 2;
    this.dumpMarker.position.set(this.dumpTarget.x, 0.12, this.dumpTarget.z);
    this.dumpMarker.visible = false;
    this.scene.add(this.dumpMarker);
  };

  ConstructionSite.prototype.moveWorkMarker = function (x, z, color, glowColor) {
    this.workTarget.set(x, 0, z);
    if (this.marker) {
      this.marker.visible = true;
      this.marker.position.set(x, 0.12, z);
      this.marker.material.color.setHex(color || 0xff6f00);
    }
    if (this.glow) {
      this.glow.visible = true;
      this.glow.position.set(x, 0.1, z);
      this.glow.material.color.setHex(glowColor || 0xffee58);
    }
    if (this.dumpMarker) {
      this.dumpMarker.visible = false;
    }
    if (this.dumpGlow) {
      this.dumpGlow.visible = false;
    }
  };

  ConstructionSite.prototype.isInWorkZone = function (x, z) {
    return Math.hypot(x - this.workTarget.x, z - this.workTarget.z) <= this.workRadius;
  };

  ConstructionSite.prototype.setGradeMode = function () {
    this.gradeLevel = 0;
    this.roadMounds.forEach(function (mound) {
      mound.visible = true;
    });
    var spot = this.roadSpots[0];
    this.moveWorkMarker(spot.x, spot.z, 0xff6f00, 0xffee58);
  };

  ConstructionSite.prototype.clearNextMound = function () {
    if (this.gradeLevel >= this.roadMounds.length) {
      return false;
    }
    this.roadMounds[this.gradeLevel].visible = false;
    this.gradeLevel += 1;
    if (this.gradeLevel < this.roadSpots.length - 1) {
      var next = this.roadSpots[this.gradeLevel];
      this.moveWorkMarker(next.x, next.z, 0xff6f00, 0xffee58);
    }
    return true;
  };

  ConstructionSite.prototype.setGravelLoadMode = function () {
    this.gravelPiles.forEach(function (pile) {
      pile.visible = true;
    });
    this.moveWorkMarker(this.gravelTarget.x, this.gravelTarget.z, 0xffb300, 0xffe082);
  };

  ConstructionSite.prototype.isInGravelZone = function (x, z) {
    return Math.hypot(x - this.gravelTarget.x, z - this.gravelTarget.z) <= this.gravelRadius;
  };

  ConstructionSite.prototype.takeGravel = function () {
    for (var i = 0; i < this.gravelPiles.length; i += 1) {
      if (this.gravelPiles[i].visible) {
        this.gravelPiles[i].visible = false;
        return true;
      }
    }
    return false;
  };

  ConstructionSite.prototype.setGravelUnloadMode = function () {
    var spot = this.roadSpots[1] || this.roadSpots[0];
    this.moveWorkMarker(spot.x, spot.z, 0xff6f00, 0xffee58);
  };

  ConstructionSite.prototype.placeRoadGravel = function () {
    this.roadGravel.forEach(function (patch) {
      patch.visible = true;
    });
  };

  ConstructionSite.prototype.setRollMode = function () {
    this.roadLevel = 0;
    var spot = this.roadSpots[0];
    this.moveWorkMarker(spot.x, spot.z, 0x78909c, 0xcfd8dc);
  };

  ConstructionSite.prototype.placeNextRoad = function () {
    if (this.roadLevel >= this.roads.length) {
      return false;
    }
    var slab = this.roads[this.roadLevel];
    slab.visible = true;
    var full = slab.userData.fullScale || 1;
    slab.scale.set(full, 0.15, full);
    if (this.roadGravel[this.roadLevel]) {
      this.roadGravel[this.roadLevel].visible = false;
    }
    this.roadLevel += 1;
    if (this.roadLevel < this.roadSpots.length) {
      var next = this.roadSpots[this.roadLevel];
      this.moveWorkMarker(next.x, next.z, 0x78909c, 0xcfd8dc);
    }
    return true;
  };

  ConstructionSite.prototype.setBridgeMode = function () {
    this.bridgePile.forEach(function (item) {
      item.visible = true;
    });
    var spot = this.bridgeSpots[this.bridgeLevel] || this.bridgeSpots[0];
    this.moveWorkMarker(spot.x, spot.z, 0x29b6f6, 0xb3e5fc);
  };

  ConstructionSite.prototype.nextBridgeColor = function () {
    return 0x90a4ae;
  };

  ConstructionSite.prototype.currentBridgeSpot = function () {
    return this.bridgeSpots[this.bridgeLevel] || this.bridgeSpots[this.bridgeSpots.length - 1];
  };

  ConstructionSite.prototype.hideNextBridgePart = function () {
    if (this.bridgePile[this.bridgeLevel]) {
      this.bridgePile[this.bridgeLevel].visible = false;
    }
  };

  ConstructionSite.prototype.placeNextBridge = function () {
    if (this.bridgeLevel >= this.bridgeItems.length) {
      return false;
    }
    var item = this.bridgeItems[this.bridgeLevel];
    item.visible = true;
    var full = item.userData.fullScale || 1;
    item.scale.set(full, 0.2, full);
    if (this.bridgePile[this.bridgeLevel]) {
      this.bridgePile[this.bridgeLevel].visible = false;
    }
    this.bridgeLevel += 1;
    if (this.bridgeLevel < this.bridgeSpots.length) {
      var next = this.bridgeSpots[this.bridgeLevel];
      this.moveWorkMarker(next.x, next.z, 0x29b6f6, 0xb3e5fc);
    }
    return true;
  };

  ConstructionSite.prototype.setPlaygroundMode = function () {
    this.playPile.forEach(function (item) {
      item.visible = true;
    });
    var spot = this.playSpots[this.playLevel] || this.playSpots[0];
    this.moveWorkMarker(spot.x, spot.z, 0xab47bc, 0xe1bee7);
  };

  ConstructionSite.prototype.nextPlayColor = function () {
    return this.playColors[this.playLevel] || 0xff7043;
  };

  ConstructionSite.prototype.hideNextPlayPart = function () {
    if (this.playPile[this.playLevel]) {
      this.playPile[this.playLevel].visible = false;
    }
  };

  ConstructionSite.prototype.currentPlaySpot = function () {
    return this.playSpots[this.playLevel] || this.playSpots[this.playSpots.length - 1];
  };

  ConstructionSite.prototype.placeNextPlayItem = function () {
    if (this.playLevel >= this.playItems.length) {
      return false;
    }
    var item = this.playItems[this.playLevel];
    item.visible = true;
    var full = item.userData.fullScale || 1;
    item.scale.set(full, 0.2, full);
    if (this.playPile[this.playLevel]) {
      this.playPile[this.playLevel].visible = false;
    }
    this.playLevel += 1;
    if (this.playLevel < this.playSpots.length) {
      var next = this.playSpots[this.playLevel];
      this.moveWorkMarker(next.x, next.z, 0xab47bc, 0xe1bee7);
    }
    return true;
  };

  ConstructionSite.prototype.setBenchMode = function () {
    var spot = this.benchSpots[this.benchLevel] || this.benchSpots[0];
    this.moveWorkMarker(spot.x, spot.z, 0x8d6e63, 0xffcc80);
  };

  ConstructionSite.prototype.currentBenchSpot = function () {
    return this.benchSpots[this.benchLevel] || this.benchSpots[this.benchSpots.length - 1];
  };

  ConstructionSite.prototype.placeNextBench = function () {
    if (this.benchLevel >= this.benches.length) {
      return false;
    }
    var item = this.benches[this.benchLevel];
    item.visible = true;
    var full = item.userData.fullScale || 1;
    item.scale.set(full, 0.2, full);
    this.benchLevel += 1;
    if (this.benchLevel < this.benchSpots.length) {
      var next = this.benchSpots[this.benchLevel];
      this.moveWorkMarker(next.x, next.z, 0x8d6e63, 0xffcc80);
    }
    return true;
  };

  ConstructionSite.prototype.setTreeMode = function () {
    var spot = this.treeSpots[this.treeLevel] || this.treeSpots[0];
    this.moveWorkMarker(spot.x, spot.z, 0x66bb6a, 0xc8e6c9);
  };

  ConstructionSite.prototype.currentTreeSpot = function () {
    return this.treeSpots[this.treeLevel] || this.treeSpots[this.treeSpots.length - 1];
  };

  ConstructionSite.prototype.placeNextTree = function () {
    if (this.treeLevel >= this.parkTrees.length) {
      return false;
    }
    var item = this.parkTrees[this.treeLevel];
    item.visible = true;
    var full = item.userData.fullScale || 1;
    item.scale.set(full, 0.2, full);
    this.treeLevel += 1;
    if (this.treeLevel < this.treeSpots.length) {
      var next = this.treeSpots[this.treeLevel];
      this.moveWorkMarker(next.x, next.z, 0x66bb6a, 0xc8e6c9);
    }
    return true;
  };

  ConstructionSite.prototype.setLampMode = function () {
    var spot = this.lampSpots[this.lampLevel] || this.lampSpots[0];
    this.moveWorkMarker(spot.x, spot.z, 0xffee58, 0xfff9c4);
  };

  ConstructionSite.prototype.currentLampSpot = function () {
    return this.lampSpots[this.lampLevel] || this.lampSpots[this.lampSpots.length - 1];
  };

  ConstructionSite.prototype.placeNextLamp = function () {
    if (this.lampLevel >= this.lamps.length) {
      return false;
    }
    var item = this.lamps[this.lampLevel];
    item.visible = true;
    var full = item.userData.fullScale || 1;
    item.scale.set(full, 0.2, full);
    this.lampLevel += 1;
    if (this.lampLevel < this.lampSpots.length) {
      var next = this.lampSpots[this.lampLevel];
      this.moveWorkMarker(next.x, next.z, 0xffee58, 0xfff9c4);
    }
    return true;
  };

  ConstructionSite.prototype.setFreeMode = function () {
    if (this.marker) {
      this.marker.visible = false;
    }
    if (this.glow) {
      this.glow.visible = false;
    }
    if (this.dumpMarker) {
      this.dumpMarker.visible = false;
    }
    if (this.dumpGlow) {
      this.dumpGlow.visible = false;
    }
  };

  ConstructionSite.prototype._createRoad = function () {
    var self = this;
    this.roadSpots.forEach(function (spot, index) {
      if (index < 3) {
        var mound = sphereMesh(0.85, 0x8d6e4c);
        mound.scale.y = 0.55;
        mound.position.set(spot.x, 0.28, spot.z);
        mound.visible = false;
        self.scene.add(mound);
        self.roadMounds.push(mound);
      }

      var gravel = boxMesh(2.15, 0.1, 3.0, 0xbcaaa4);
      gravel.position.set(spot.x, 0.07, spot.z);
      gravel.visible = false;
      self.scene.add(gravel);
      self.roadGravel.push(gravel);

      var group = new THREE.Group();
      group.position.set(spot.x, 0, spot.z);
      group.visible = false;
      group.userData.fullScale = 1;
      group.scale.set(1, 0.15, 1);

      var slab = boxMesh(2.25, 0.16, 3.15, 0x607d8b);
      slab.position.y = 0.1;
      group.add(slab);

      var stripe = boxMesh(0.18, 0.05, 1.35, 0xffee58);
      stripe.position.y = 0.2;
      group.add(stripe);

      self.scene.add(group);
      self.roads.push(group);
    });

    var g;
    for (g = 0; g < 3; g += 1) {
      var pile = sphereMesh(0.55 + g * 0.08, 0xbcaaa4);
      pile.scale.y = 0.5;
      pile.position.set(this.gravelTarget.x + (g - 1) * 0.7, 0.26, this.gravelTarget.z);
      pile.visible = false;
      this.scene.add(pile);
      this.gravelPiles.push(pile);
    }
  };

  ConstructionSite.prototype._createBridge = function () {
    var water = boxMesh(5.2, 0.12, 3.6, 0x4fc3f7, {
      roughness: 0.18,
      metalness: 0.12,
      transparent: true,
      opacity: 0.82,
    });
    water.position.set(22.2, 0.04, 8.4);
    this.scene.add(water);

    var self = this;
    this.bridgeSpots.forEach(function (spot, index) {
      var block = boxMesh(1.15, 0.55, 2.85, index % 2 ? 0x90a4ae : 0xb0bec5);
      block.position.set(spot.x, 0.38, spot.z);
      block.visible = false;
      block.userData.fullScale = 1;
      block.scale.set(1, 0.2, 1);
      self.scene.add(block);
      self.bridgeItems.push(block);

      var pile = boxMesh(0.7, 0.5, 0.7, 0x90a4ae);
      pile.position.set(self.bridgePileSpot.x + index * 0.82, 0.3, self.bridgePileSpot.z);
      pile.visible = false;
      self.scene.add(pile);
      self.bridgePile.push(pile);
    });
  };

  ConstructionSite.prototype._createPlayground = function () {
    var pad = new THREE.Mesh(
      new THREE.CircleGeometry(5.4, 28),
      standardMaterial(0x81c784, { roughness: 1 }),
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(-12.2, 0.05, -16.2);
    pad.receiveShadow = true;
    this.scene.add(pad);

    var sandbox = makeSandbox();
    sandbox.position.set(this.playSpots[0].x, 0, this.playSpots[0].z);
    sandbox.visible = false;
    sandbox.userData.fullScale = 1;
    sandbox.scale.set(1, 0.2, 1);
    this.scene.add(sandbox);
    this.playItems.push(sandbox);

    var slide = makeSlide();
    slide.position.set(this.playSpots[1].x, 0, this.playSpots[1].z);
    slide.visible = false;
    slide.userData.fullScale = 1;
    slide.scale.set(1, 0.2, 1);
    this.scene.add(slide);
    this.playItems.push(slide);

    var swing = makeSwing();
    swing.position.set(this.playSpots[2].x, 0, this.playSpots[2].z);
    swing.visible = false;
    swing.userData.fullScale = 1;
    swing.scale.set(1, 0.2, 1);
    this.scene.add(swing);
    this.playItems.push(swing);

    var self = this;
    this.playColors.forEach(function (color, index) {
      var block = boxMesh(0.7, 0.55, 0.7, color);
      block.position.set(self.playPileSpot.x + index * 0.85, 0.32, self.playPileSpot.z);
      block.visible = false;
      self.scene.add(block);
      self.playPile.push(block);
    });

    this.benchSpots.forEach(function (spot) {
      var bench = makeBench();
      bench.position.set(spot.x, 0, spot.z);
      bench.visible = false;
      bench.userData.fullScale = 1;
      bench.scale.set(1, 0.2, 1);
      self.scene.add(bench);
      self.benches.push(bench);
    });

    this.treeSpots.forEach(function (spot) {
      var tree = addTree(self.scene, spot.x, spot.z, 0.9);
      tree.visible = false;
      tree.userData.fullScale = 1;
      tree.scale.set(1, 0.2, 1);
      self.parkTrees.push(tree);
    });

    this.lampSpots.forEach(function (spot) {
      var lamp = makeLamp();
      lamp.position.set(spot.x, 0, spot.z);
      lamp.visible = false;
      lamp.userData.fullScale = 1;
      lamp.scale.set(1, 0.2, 1);
      self.scene.add(lamp);
      self.lamps.push(lamp);
    });
  };

  MBS.ConstructionSite = ConstructionSite;
})(window.MBS = window.MBS || {}, window.THREE);
