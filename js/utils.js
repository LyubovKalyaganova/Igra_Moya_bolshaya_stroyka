(function (MBS, THREE) {
  function standardMaterial(color, extras) {
    extras = extras || {};
    return new THREE.MeshStandardMaterial(
      Object.assign(
        {
          color: color,
          roughness: 0.58,
          metalness: 0.06,
        },
        extras,
      ),
    );
  }

  function enableShadow(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function boxMesh(width, height, depth, color, extras) {
    return enableShadow(
      new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), standardMaterial(color, extras)),
    );
  }

  function cylinderMesh(radiusTop, radiusBottom, height, color, extras, segments) {
    return enableShadow(
      new THREE.Mesh(
        new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments || 16),
        standardMaterial(color, extras),
      ),
    );
  }

  function sphereMesh(radius, color, extras, segments) {
    segments = segments || 16;
    return enableShadow(
      new THREE.Mesh(
        new THREE.SphereGeometry(radius, segments, Math.max(10, Math.floor(segments * 0.75))),
        standardMaterial(color, extras),
      ),
    );
  }

  function lerpNumber(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distanceXZ(ax, az, bx, bz) {
    return Math.hypot(ax - bx, az - bz);
  }

  MBS.standardMaterial = standardMaterial;
  MBS.enableShadow = enableShadow;
  MBS.boxMesh = boxMesh;
  MBS.cylinderMesh = cylinderMesh;
  MBS.sphereMesh = sphereMesh;
  MBS.lerpNumber = lerpNumber;
  MBS.clamp = clamp;
  MBS.distanceXZ = distanceXZ;
})(window.MBS = window.MBS || {}, window.THREE);
