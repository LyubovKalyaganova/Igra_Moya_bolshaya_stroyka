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
    var panel = boxMesh(1.42, 1.58, 0.16, 0x8d6e63);
    group.add(panel);
    var inset = boxMesh(1.18, 0.42, 0.04, 0x6d4c41);
    inset.position.set(0, 0.28, 0.09);
    group.add(inset);
    var glass = boxMesh(0.52, 0.32, 0.05, 0x81d4fa, {
      roughness: 0.16,
      metalness: 0.18,
      transparent: true,
      opacity: 0.88,
    });
    glass.position.set(0, 0.28, 0.12);
    group.add(glass);
    var knob = sphereMesh(0.08, 0xffeb3b);
    knob.position.set(0.52, -0.12, 0.14);
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

    this._createGround();
    this._createYard();
    this._createDecor();
    this._createHorizon();
    this._createPit();
    this._createFoundation();
    this._createWalls();
    this._createHouseParts();
    this._createDumpZone();
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
    var colors = [0xffcc80, 0x90caf9, 0xce93d8, 0xffab91, 0xa5d6a7, 0xfff59d];
    var i;
    for (i = 0; i < 14; i += 1) {
      var angle = (i / 14) * Math.PI * 2 + 0.18;
      var radius = 38 + (i % 3) * 2.5;
      addTownHouse(
        this.scene,
        Math.sin(angle) * radius,
        Math.cos(angle) * radius,
        colors[i % colors.length],
        1.05 + (i % 3) * 0.2,
      );
    }
    for (i = 0; i < 22; i += 1) {
      var treeAngle = (i / 22) * Math.PI * 2;
      addTree(this.scene, Math.sin(treeAngle) * 31.5, Math.cos(treeAngle) * 31.5, 0.85 + (i % 4) * 0.2);
    }
    for (i = 0; i < 30; i += 1) {
      var bushAngle = (i / 30) * Math.PI * 2;
      addBush(this.scene, Math.sin(bushAngle) * 28.6, Math.cos(bushAngle) * 28.6, 0.85 + (i % 3) * 0.22);
    }
    var flowerColors = [0xff80ab, 0xfff176, 0xce93d8, 0xff8a80, 0xffffff, 0x80d8ff, 0xffab91];
    for (i = 0; i < 42; i += 1) {
      var flowerAngle = (i / 42) * Math.PI * 2 + 0.07;
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
    door.position.set(0, 1.22, 3.42);
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
    pileDoor.scale.set(0.55, 0.55, 0.55);
    pileDoor.position.set(6.5, 0.55, 4.85);
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

  MBS.ConstructionSite = ConstructionSite;
})(window.MBS = window.MBS || {}, window.THREE);
