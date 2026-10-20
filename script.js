(function () {
  'use strict';
  /* Nav */
  var btn = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Close' : 'Menu';
    });
    nav.querySelectorAll('a').forEach(function (l) {
      l.addEventListener('click', function () { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.textContent = 'Menu'; });
    });
  }

  var REDUCED = false;
  try { REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { REDUCED = false; }
  var canvas = document.getElementById('story3d');
  var caption = document.getElementById('story-caption');
  var chapterEls = Array.prototype.slice.call(document.querySelectorAll('.story-chapter'));
  var CAPTION_DEFAULT = 'Drag to orbit \u00B7 Scroll builds the scene \u00B7 Click an item for one line.';
  var INFO = {
    darren: 'Darren \u2014 sets direction, scope, and what \u201Cgood\u201D looks like.',
    agent: 'Agent \u2014 real downloaded 3D model (CC0, Quaternius). Builds the first version from the brief.',
    voltworks: 'VoltWorks Power \u2014 power-system CAD that removes repetitive drafting.',
    patterns: 'AI Architecture Patterns \u2014 diagrams, tradeoffs, and judgment.',
    pylon: 'Pylon \u2014 lattice tower carrying the overhead line at safe height.',
    generator: 'Generator \u2014 real downloaded 3D model (CC0, Poly Haven). Power equipment, shown at true scale.',
    switchgear: 'Switchgear \u2014 breaker + protection. Green = closed, red = open.',
    bus: 'Bus line \u2014 the shared conductor everything connects to.',
    scale: 'Scale \u2014 figure 1.8 m, bar 1 m. 1 unit = 1 m.',
    brief: '01 Brief \u2014 Darren sets direction. No building without it.',
    generate: '02 Generate \u2014 agents build the first working version.',
    verify: '03 Verify \u2014 checked against explicit criteria.',
    fix: '04 Fix \u2014 fix, then re-verify until it meets the bar.'
  };

  function fitCanvas() {
    var w = canvas.clientWidth || 640;
    var aspect = 640 / 420;
    var h = Math.round(w / aspect);
    if (h < 240) h = 240;
    if (h > 440) h = 440;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    return { w: w, h: h, dpr: dpr };
  }

  function drawFallback(ch) {
    try {
      var ctx = canvas.getContext('2d');
      if (!ctx) return;
      var s = fitCanvas(), dpr = s.dpr, W = s.w, H = s.h;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#eef2ef'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1a1e23'; ctx.font = '600 13px system-ui, sans-serif'; ctx.textAlign = 'center';
      function node(x, y, r, label, fill) {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
        ctx.strokeStyle = '#1a1e23'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#1a1e23'; ctx.fillText(label, x, y + r + 16);
      }
      function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = '#0f6a5e'; ctx.lineWidth = 1.5; ctx.stroke(); }
      if (ch === 0) {
        var cx = W / 2, cy = H / 2;
        line(cx, cy, cx - 110, cy - 45); line(cx, cy, cx + 110, cy - 45);
        node(cx, cy, 26, 'Darren', '#1a1e23'); node(cx - 110, cy - 45, 16, 'VoltWorks', '#0f6a5e'); node(cx + 110, cy - 45, 16, 'Patterns', '#0f6a5e');
      } else if (ch === 1) {
        ctx.fillStyle = '#d9d2c0'; ctx.fillRect(0, H - 42, W, 42);
        node(W * 0.18, H - 90, 14, 'Pylon', '#faf7f1'); node(W * 0.48, H - 70, 22, 'Generator', '#0f6a5e'); node(W * 0.76, H - 80, 16, 'Switchgear', '#1a1e23');
        line(W * 0.18, H - 90, W * 0.48, H - 70); line(W * 0.48, H - 70, W * 0.76, H - 80);
      } else {
        var pts = [[W * 0.18, H * 0.5, 'Brief'], [W * 0.40, H * 0.28, 'Generate'], [W * 0.62, H * 0.5, 'Verify'], [W * 0.82, H * 0.72, 'Fix']];
        for (var i = 0; i < pts.length; i++) { var a = pts[i], b = pts[(i + 1) % pts.length]; line(a[0], a[1], b[0], b[1]); }
        pts.forEach(function (p) { node(p[0], p[1], 16, p[2], '#0f6a5e'); });
      }
      if (caption) caption.textContent = 'Static diagram shown.';
    } catch (e) { /* fallback must never break site */ }
  }

  var threePromise = null;
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threePromise) return threePromise;
    threePromise = new Promise(function (resolve, reject) {
      var urls = ['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'];
      function tryUrl(i) {
        if (i >= urls.length) { reject(new Error('Three.js failed')); return; }
        var s = document.createElement('script'); s.src = urls[i]; s.async = true;
        s.onload = function () { if (window.THREE) resolve(window.THREE); else tryUrl(i + 1); };
        s.onerror = function () { s.remove(); tryUrl(i + 1); };
        setTimeout(function () { if (!window.THREE && s.parentNode) { s.remove(); tryUrl(i + 1); } }, 8000);
        document.head.appendChild(s);
      }
      tryUrl(0);
    });
    return threePromise;
  }

  var gltfPromise = null;
  function loadGLTF() {
    if (window.THREE && window.THREE.GLTFLoader) return Promise.resolve(window.THREE.GLTFLoader);
    if (gltfPromise) return gltfPromise;
    gltfPromise = new Promise(function (resolve, reject) {
      var urls = ['https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js', 'https://unpkg.com/three@0.128.0/examples/js/loaders/GLTFLoader.js'];
      function tryUrl(i) {
        if (i >= urls.length) { reject(new Error('GLTFLoader failed')); return; }
        var s = document.createElement('script'); s.src = urls[i]; s.async = true;
        s.onload = function () { if (window.THREE && window.THREE.GLTFLoader) resolve(window.THREE.GLTFLoader); else tryUrl(i + 1); };
        s.onerror = function () { s.remove(); tryUrl(i + 1); };
        setTimeout(function () { if (!(window.THREE && window.THREE.GLTFLoader) && s.parentNode) { s.remove(); tryUrl(i + 1); } }, 8000);
        document.head.appendChild(s);
      }
      tryUrl(0);
    });
    return gltfPromise;
  }

  var roomEnvPromise = null;
  function loadRoomEnv() {
    if (window.THREE && window.THREE.RoomEnvironment) return Promise.resolve(window.THREE.RoomEnvironment);
    if (roomEnvPromise) return roomEnvPromise;
    roomEnvPromise = new Promise(function (resolve, reject) {
      var urls = ['https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/environments/RoomEnvironment.js', 'https://unpkg.com/three@0.128.0/examples/js/environments/RoomEnvironment.js'];
      function tryUrl(i) {
        if (i >= urls.length) { reject(new Error('RoomEnvironment failed')); return; }
        var s = document.createElement('script'); s.src = urls[i]; s.async = true;
        s.onload = function () { if (window.THREE && window.THREE.RoomEnvironment) resolve(window.THREE.RoomEnvironment); else tryUrl(i + 1); };
        s.onerror = function () { s.remove(); tryUrl(i + 1); };
        setTimeout(function () { if (!(window.THREE && window.THREE.RoomEnvironment) && s.parentNode) { s.remove(); tryUrl(i + 1); } }, 8000);
        document.head.appendChild(s);
      }
      tryUrl(0);
    });
    return roomEnvPromise;
  }

  /* Fit a loaded GLB into a placeholder group: base at group origin, itemId on every mesh for picking. */
  function placeModel(THREE, group, obj, targetH, targetW, itemId, allMeshes) {
    var box3 = new THREE.Box3().setFromObject(obj);
    var size = new THREE.Vector3(); box3.getSize(size);
    var center = new THREE.Vector3(); box3.getCenter(center);
    var s = Math.min(targetH / Math.max(0.001, size.y), targetW / Math.max(0.001, Math.max(size.x, size.z)));
    obj.scale.setScalar(s);
    obj.position.set(-center.x * s, -box3.min.y * s, -center.z * s);
    obj.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.userData.itemId = itemId; allMeshes.push(o); } });
    group.add(obj);
    return obj;
  }

  /* Load real CC0 GLB models. On ANY failure, show a clean message and keep
     the rest of the site working — NO placeholder blocks are shown as the scene. */
  function loadModels(THREE, built) {
    function failAgent() {
      built.agentFailed = true;
      if (built.agentGroup) built.agentGroup.visible = false;
      if (caption) caption.textContent = '3D robot model could not load — the rest of the site still works. Refresh to retry.';
    }
    function failGenerator() {
      built.generatorFailed = true;
      if (built.generatorGroup) built.generatorGroup.visible = false;
      if (caption) caption.textContent = '3D generator model could not load — the rest of the site still works. Refresh to retry.';
    }
    function failPylon() {
      built.pylonFailed = true;
      if (built.pylonGroup) built.pylonGroup.visible = false;
      if (caption) caption.textContent = '3D pylon model could not load — the rest of the site still works. Refresh to retry.';
    }
    loadGLTF().then(function (Loader) {
      var loader = new Loader();
      loader.load('models/robot-expressive.glb', function (gltf) {
        var obj = gltf.scene || gltf.scenes[0];
        placeModel(THREE, built.agentGroup, obj, 1.7, 1.0, 'agent', built.allMeshes);
        if (gltf.animations && gltf.animations.length) {
          var mx = new THREE.AnimationMixer(obj);
          var clip = gltf.animations.filter(function (c) { return /idle/i.test(c.name); })[0] || gltf.animations[0];
          mx.clipAction(clip).play();
          built.mixers.push(mx);
        }
      }, undefined, function () { failAgent(); });
      loader.load('models/portable-generator.glb', function (gltf) {
        var obj = gltf.scene || gltf.scenes[0];
        placeModel(THREE, built.generatorGroup, obj, 1.0, 1.4, 'generator', built.allMeshes);
      }, undefined, function () { failGenerator(); });
      loader.load('models/pylon.glb', function (gltf) {
        var obj = gltf.scene || gltf.scenes[0];
        placeModel(THREE, built.pylonGroup, obj, 3.2, 1.6, 'pylon', built.allMeshes);
      }, undefined, function () { failPylon(); });
    }).catch(function () { failAgent(); failGenerator(); failPylon(); });
  }

  function ease(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

  function buildScene(THREE) {
    var scene = new THREE.Scene(); scene.background = null;
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 1.9, 6.0); camera.lookAt(0, 0, 0);
    // Lighting: hemisphere + key (shadows) + warm fill + cool rim + IBL env (set in init via RoomEnvironment).
    scene.add(new THREE.HemisphereLight(0xfff8ec, 0x8a8a8a, 0.6));
    var key = new THREE.DirectionalLight(0xffffff, 1.25); key.position.set(4, 7, 5);
    key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4.5; key.shadow.camera.right = 4.5; key.shadow.camera.top = 4; key.shadow.camera.bottom = -3;
    key.shadow.camera.near = 1; key.shadow.camera.far = 20;
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
    key.shadow.camera.updateProjectionMatrix();
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xffe6c4, 0.5); fill.position.set(-5, 3, 3); scene.add(fill);
    var rim = new THREE.DirectionalLight(0xdfeeff, 0.6); rim.position.set(-2, 4, -5); scene.add(rim);

    function std(hex, o) {
      o = o || {};
      return new THREE.MeshStandardMaterial({ color: hex, roughness: o.rough !== undefined ? o.rough : 0.55, metalness: o.metal !== undefined ? o.metal : 0.15, emissive: new THREE.Color(o.emissive || 0x000000), emissiveIntensity: o.ei || 0 });
    }
    var M = {
      ink: std(0x1a1e23, { rough: 0.6 }), inkLight: std(0x2a2f34, { rough: 0.55 }),
      teal: std(0x0f6a5e, { rough: 0.42, metal: 0.25 }), tealDark: std(0x0b4f47, { rough: 0.45, metal: 0.25 }),
      steel: std(0x6b7280, { rough: 0.35, metal: 0.65 }), steelDark: std(0x374151, { rough: 0.4, metal: 0.6 }),
      ceramic: std(0xfaf7f1, { rough: 0.35 }), wood: std(0x8a5a2b, { rough: 0.7 }),
      gold: std(0xc98a2b, { rough: 0.45, metal: 0.3 }), amber: std(0xe8b93c, { rough: 0.4, metal: 0.2, emissive: 0x8a6a00, ei: 0.35 }),
      skin: std(0xd9a97a, { rough: 0.65 }), paper: std(0xf2eee5, { rough: 0.8 }),
      green: std(0x2fa36b, { rough: 0.4, emissive: 0x0a3d22, ei: 0.6 }), red: std(0xc0392b, { rough: 0.4, emissive: 0x4a0f0a, ei: 0.6 })
    };

    var root = new THREE.Group(); scene.add(root);
    var groups = { studio: new THREE.Group(), volt: new THREE.Group(), loop: new THREE.Group() };
    root.add(groups.studio); root.add(groups.volt); root.add(groups.loop);
    var allMeshes = [];
    var parts = []; // {obj, group, appear, baseY, baseScale}
    function reg(obj, group, appear, itemId) {
      obj.userData.itemId = itemId || null; obj.userData.appear = appear; obj.userData.baseY = obj.position.y;
      obj.castShadow = true; obj.receiveShadow = true;
      group.add(obj); allMeshes.push(obj); parts.push({ obj: obj, group: group, appear: appear });
      return obj;
    }
    function mesh(geo, mat, x, y, z, group, appear, itemId) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return reg(m, group, appear, itemId); }
    function box(w, h, d, mat, x, y, z, g, ap, id) { return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, g, ap, id); }
    function cyl(rt, rb, h, mat, x, y, z, g, ap, id, seg) { return mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), mat, x, y, z, g, ap, id); }
    function sph(r, mat, x, y, z, g, ap, id) { return mesh(new THREE.SphereGeometry(r, 24, 16), mat, x, y, z, g, ap, id); }
    function torus(r, t, mat, x, y, z, g, ap, id) { return mesh(new THREE.TorusGeometry(r, t, 12, 28), mat, x, y, z, g, ap, id); }
    function cone(r, h, mat, x, y, z, g, ap, id) { return mesh(new THREE.ConeGeometry(r, h, 20), mat, x, y, z, g, ap, id); }
    function line3(a, b, mat, g, ap) {
      var geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a[0], a[1], a[2]), new THREE.Vector3(b[0], b[1], b[2])]);
      var l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x9ab8b2, transparent: true, opacity: 0.6 }));
      l.position.set(0, 0, 0); g.add(l); parts.push({ obj: l, group: g, appear: ap }); return l;
    }
    function ground(g, hex) {
      var p = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshStandardMaterial({ color: hex, roughness: 1.0, metalness: 0 }));
      p.rotation.x = -Math.PI / 2; p.position.y = -1.0; p.receiveShadow = true; g.add(p);
      var grid = new THREE.GridHelper(13, 20, 0xd8d0bd, 0xe8e2d4); grid.position.y = -0.99; grid.material.transparent = true; grid.material.opacity = 0.25; g.add(grid);
    }
    ground(groups.studio, 0xe9e2d3); ground(groups.volt, 0xd9d2c0); ground(groups.loop, 0xe9e2d3);

    /* Studio — Darren + 1 real agent model + 2 flagship minis */
    var S = groups.studio;
    cyl(0.42, 0.46, 0.08, M.ink, 0, -0.98, 0, S, 0, 'darren', 28);
    cyl(0.20, 0.26, 0.95, M.ink, 0, -0.45, 0, S, 0, 'darren');
    sph(0.28, M.skin, 0, 0.28, 0, S, 0, 'darren');
    cyl(0.24, 0.26, 0.10, M.teal, 0, 0.50, 0, S, 0, 'darren');
    // Agent — real downloaded GLB (RobotExpressive, CC0). Placeholder group; model loads async.
    // Final: group at (1.75, -1.0, 0.35), base on ground y=-1.0, fitted to ≤1.7 m tall, ≤1.0 m wide.
    var agentGroup = new THREE.Group();
    agentGroup.position.set(1.75, -1.0, 0.35);
    agentGroup.userData.itemId = 'agent'; agentGroup.userData.appear = 0.15; agentGroup.userData.baseY = -1.0; agentGroup.userData.baseScale = 1;
    S.add(agentGroup);
    parts.push({ obj: agentGroup, group: S, appear: 0.15 });
    // Flagship minis
    box(0.9, 0.08, 0.6, M.paper, 2.8, -0.98, -1.0, S, 0.60, 'voltworks');
    cyl(0.05, 0.06, 0.9, M.steelDark, 2.5, -0.5, -1.0, S, 0.60, 'voltworks');
    box(0.5, 0.07, 0.07, M.steelDark, 2.5, -0.12, -1.0, S, 0.60, 'voltworks');
    box(0.55, 0.5, 0.4, M.teal, 3.0, -0.70, -1.0, S, 0.60, 'voltworks');
    box(0.08, 0.3, 0.4, M.tealDark, 3.3, -0.70, -1.0, S, 0.60, 'voltworks');
    line3([0, 0, 0], [2.8, -0.6, -1.0], null, S, 0.60);
    box(0.65, 0.06, 0.5, M.paper, -2.8, -0.70, -1.0, S, 0.75, 'patterns');
    box(0.65, 0.06, 0.5, M.teal, -2.8, -0.60, -1.0, S, 0.75, 'patterns');
    box(0.65, 0.06, 0.5, M.gold, -2.8, -0.50, -1.0, S, 0.75, 'patterns');
    box(0.9, 0.08, 0.6, M.paper, -2.8, -0.98, -1.0, S, 0.75, 'patterns');
    line3([0, 0, 0], [-2.8, -0.6, -1.0], null, S, 0.75);

    /* VoltWorks — pylon / generator / switchgear / bus / scale */
    var V = groups.volt;
    // Pylon — real downloaded GLB (lattice transmission tower, BSD-3-Clause).
    // Placeholder group; model loads async. Source is 21 m wide × 42 m tall;
    // fitted to ≤3.2 m tall × ≤1.6 m wide so it reads as a yard miniature.
    var pylonGroup = new THREE.Group();
    pylonGroup.position.set(-2.6, -1.0, 0);
    pylonGroup.userData.itemId = 'pylon'; pylonGroup.userData.appear = 0.05; pylonGroup.userData.baseY = -1.0; pylonGroup.userData.baseScale = 1;
    V.add(pylonGroup);
    parts.push({ obj: pylonGroup, group: V, appear: 0.05 });
    // Generator — real downloaded GLB (Poly Haven, CC0, full PBR). Placeholder group; model loads async.
    // Final: group at (-0.15, -1.0, 0.1), base on ground y=-1.0, fitted to ≤1.0 m tall, ≤1.4 m wide (≈0.99 m tall × 1.40 m wide given true 0.82 × 0.58 m bounds).
    var generatorGroup = new THREE.Group();
    generatorGroup.position.set(-0.15, -1.0, 0.1);
    generatorGroup.userData.itemId = 'generator'; generatorGroup.userData.appear = 0.30; generatorGroup.userData.baseY = -1.0; generatorGroup.userData.baseScale = 1;
    V.add(generatorGroup);
    parts.push({ obj: generatorGroup, group: V, appear: 0.30 });
    // Switchgear — 3 cubicles
    for (var ci = 0; ci < 3; ci++) {
      var cx = 1.55 + ci * 0.70;
      box(0.62, 1.25, 0.62, M.ink, cx, -0.35, 0, V, 0.55, 'switchgear');
      box(0.50, 1.05, 0.04, M.inkLight, cx, -0.35, 0.32, V, 0.55, 'switchgear');
      box(0.06, 0.22, 0.06, M.gold, cx + 0.16, -0.35, 0.36, V, 0.55, 'switchgear');
      sph(0.07, ci < 2 ? M.green : M.red, cx - 0.16, 0.22, 0.32, V, 0.55, 'switchgear');
      box(0.30, 0.08, 0.02, M.steel, cx, -0.75, 0.32, V, 0.55, 'switchgear');
    }
    // Bus — amber, emissive, with flow dots
    var busMat = M.amber;
    var busPts = [[-2.6, 1.5, 0], [-0.15, 0.35, 0.1], [2.25, 0.42, 0]];
    function busSeg(a, b) {
      var dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      var c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, len, 12), busMat);
      c.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
      c.castShadow = true; V.add(c); allMeshes.push(c);
      parts.push({ obj: c, group: V, appear: 0.75 });
      c.userData.itemId = 'bus';
      var up = new THREE.Vector3(0, 1, 0), dv = new THREE.Vector3(dx, dy, dz).normalize();
      c.quaternion.setFromUnitVectors(up, dv);
      return c;
    }
    busSeg(busPts[0], busPts[1]); busSeg(busPts[1], busPts[2]);
    var flowDots = [];
    for (var di = 0; di < 5; di++) { var d = sph(0.08, std(0xffd94d, { rough: 0.3, emissive: 0x8a6a00, ei: 0.8 }), 0, 0, 0, V, 0.85, 'bus'); d.castShadow = false; flowDots.push(d); }
    // Scale — 1.8 m person + 1 m bar. Moved to (3.35, z 1.05) to clear the last switchgear cubicle (x 2.95, z 0).
    sph(0.12, M.skin, 3.35, 0.95, 1.05, V, 0.85, 'scale');
    cyl(0.13, 0.15, 1.15, M.ink, 3.35, 0.25, 1.05, V, 0.85, 'scale');
    cyl(0.11, 0.13, 0.45, M.inkLight, 3.35, -0.72, 1.05, V, 0.85, 'scale');
    box(1.0, 0.06, 0.06, M.gold, 3.35, -0.97, 1.05, V, 0.85, 'scale');

    /* Loop — 4 stations + ring */
    var L = groups.loop;
    cyl(0.55, 0.60, 0.16, M.paper, 0, -0.98, 0, L, 0, null, 28);
    cyl(0.35, 0.35, 0.10, M.teal, 0, -0.86, 0, L, 0, null);
    var ring2 = torus(2.05, 0.045, M.amber, 0, -0.92, 0, L, 0.85, null); ring2.rotation.x = Math.PI / 2;
    var stations = [
      { id: 'brief', x: -2.05, z: 0, ap: 0.05 }, { id: 'generate', x: 0, z: 2.05, ap: 0.25 },
      { id: 'verify', x: 2.05, z: 0, ap: 0.45 }, { id: 'fix', x: 0, z: -2.05, ap: 0.65 }
    ];
    stations.forEach(function (st, idx) {
      cyl(0.58, 0.62, 0.09, M.paper, st.x, -0.98, st.z, L, st.ap, st.id, 28);
      if (st.id === 'brief') {
        box(0.52, 0.68, 0.06, M.ink, st.x, -0.35, st.z, L, st.ap, st.id);
        box(0.22, 0.08, 0.08, M.gold, st.x, 0.02, st.z, L, st.ap, st.id);
        for (var li = 0; li < 3; li++) box(0.34, 0.05, 0.02, M.ceramic, st.x, -0.18 - li * 0.14, st.z + 0.04, L, st.ap, st.id);
      } else if (st.id === 'generate') {
        var g1 = torus(0.26, 0.07, M.teal, st.x - 0.14, -0.45, st.z, L, st.ap, st.id); g1.rotation.x = Math.PI / 2;
        var g2 = torus(0.18, 0.06, M.gold, st.x + 0.22, -0.45, st.z, L, st.ap, st.id); g2.rotation.x = Math.PI / 2;
        cyl(0.08, 0.08, 0.12, M.ink, st.x - 0.14, -0.45, st.z, L, st.ap, st.id);
      } else if (st.id === 'verify') {
        var sh = sph(0.30, M.teal, st.x, -0.45, st.z, L, st.ap, st.id); sh.scale.set(1, 1.15, 0.45);
        var c1 = box(0.22, 0.07, 0.05, M.ceramic, st.x - 0.08, -0.50, st.z + 0.16, L, st.ap, st.id); c1.rotation.z = 0.7;
        var c2 = box(0.34, 0.07, 0.05, M.ceramic, st.x + 0.10, -0.44, st.z + 0.16, L, st.ap, st.id); c2.rotation.z = -0.7;
      } else {
        box(0.10, 0.55, 0.08, M.ink, st.x, -0.55, st.z, L, st.ap, st.id);
        torus(0.18, 0.07, M.teal, st.x, -0.18, st.z, L, st.ap, st.id);
        var arr = torus(0.38, 0.045, M.amber, st.x, -0.45, st.z, L, st.ap, st.id); arr.rotation.x = Math.PI / 2;
      }
      var nxt = stations[(idx + 1) % stations.length];
      var mx = (st.x + nxt.x) / 2, mz = (st.z + nxt.z) / 2;
      var ang = Math.atan2(nxt.z - st.z, nxt.x - st.x);
      var cm = cone(0.12, 0.32, M.amber, mx, -0.55, mz, L, st.ap, st.id);
      cm.rotation.z = -Math.PI / 2; cm.rotation.y = -ang;
      var lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(st.x, -0.95, st.z), new THREE.Vector3(nxt.x, -0.95, nxt.z)]);
      var ll = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0x0f6a5e, transparent: true, opacity: 0.45 }));
      L.add(ll); parts.push({ obj: ll, group: L, appear: st.ap });
    });

    return { scene: scene, camera: camera, root: root, groups: groups, parts: parts, allMeshes: allMeshes, flowDots: flowDots, busPts: busPts, agentGroup: agentGroup, generatorGroup: generatorGroup, pylonGroup: pylonGroup, mixers: [], agentFailed: false, generatorFailed: false, pylonFailed: false };
  }

  function init() {
    if (!canvas || canvas.dataset.init === '1') return;
    canvas.dataset.init = '1';
    var webglOK = true;
    try { var t = document.createElement('canvas'); webglOK = !!(t.getContext('webgl') || t.getContext('experimental-webgl')); } catch (e) { webglOK = false; }
    if (!webglOK) { drawFallback(0); return; }
    loadThree().then(function (THREE) {
      try {
        var built = buildScene(THREE);
        var size = fitCanvas(canvas);
        var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(size.w, size.h, false);
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.physicallyCorrectLights = true;
        // IBL: RoomEnvironment via PMREM — gives PBR materials real reflections. Lights above still carry the shadows.
        loadRoomEnv().then(function (RoomEnv) {
          try {
            var pmrem = new THREE.PMREMGenerator(renderer);
            var envScene = new RoomEnv();
            built.scene.environment = pmrem.fromScene(envScene, 0.04).texture;
            pmrem.dispose();
          } catch (e) { /* env is enhancement only; lights still light the scene */ }
        }).catch(function () { /* no env — lights still light the scene */ });
        built.camera.aspect = size.w / size.h; built.camera.updateProjectionMatrix();
        loadModels(THREE, built);

        var state = { rotX: 0.08, rotY: 0, dragging: false, lastX: 0, lastY: 0, moved: 0, dist: 5.8, targetDist: 5.8, cur: 0, target: 0, active: 0, local: 0 };
        var start = performance.now();
        var lastT = start;
        var CAMDIST = [6.0, 6.6, 6.2, 7.4];

        function setActive(ch) {
          state.active = ch;
          chapterEls.forEach(function (el) { el.classList.toggle('active', parseInt(el.getAttribute('data-chapter'), 10) === ch); });
        }
        function applyAssembly() {
          var active = state.active, local = state.local;
          var visibleGroup = active === 0 ? 'studio' : active === 1 ? 'volt' : 'loop';
          ['studio', 'volt', 'loop'].forEach(function (k) { built.groups[k].visible = (k === visibleGroup); });
          built.parts.forEach(function (p) {
            if (p.group !== built.groups[visibleGroup]) { p.obj.visible = false; return; }
            if ((p.obj === built.agentGroup && built.agentFailed) || (p.obj === built.generatorGroup && built.generatorFailed) || (p.obj === built.pylonGroup && built.pylonFailed)) { p.obj.visible = false; return; }
            var t = (local - p.appear) / Math.max(0.01, 1 - p.appear);
            var s = ease(t);
            p.obj.visible = s > 0.02;
            if (p.obj.isMesh || p.obj.isGroup) { var bs = p.obj.userData.baseScale || 1; p.obj.scale.setScalar(Math.max(0.02, bs * (0.6 + 0.4 * s))); p.obj.position.y = (p.obj.userData.baseY || 0) + (1 - s) * 0.25; }
          });
          // Flow dots only in Volt chapter, near end
          built.flowDots.forEach(function (dot) { dot.visible = (active === 1 && local > 0.85); });
        }
        function computeScroll() {
          var story = document.getElementById('story');
          if (!story) return { p: 0, active: 0, local: 0 };
          var rect = story.getBoundingClientRect();
          var vh = window.innerHeight || 800;
          var total = Math.max(1, (story.offsetHeight || 1) - vh * 0.6);
          var p = Math.min(1, Math.max(0, (0 - rect.top + vh * 0.3) / total));
          var active = Math.min(3, Math.floor(p * 4));
          var local = Math.min(1, Math.max(0, (p - active * 0.25) / 0.25));
          return { p: p, active: active, local: local };
        }
        var ticking = false;
        function onScroll() {
          if (ticking) return; ticking = true;
          requestAnimationFrame(function () { ticking = false; var c = computeScroll(); state.target = c.p; state.active = c.active; state.local = c.local; setActive(c.active); state.targetDist = CAMDIST[c.active]; });
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', function () { var s = fitCanvas(canvas); renderer.setSize(s.w, s.h, false); built.camera.aspect = s.w / s.h; built.camera.updateProjectionMatrix(); onScroll(); });

        var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
        function pick(cx, cy) {
          var r = canvas.getBoundingClientRect();
          ndc.x = ((cx - r.left) / r.width) * 2 - 1; ndc.y = -((cy - r.top) / r.height) * 2 + 1;
          ray.setFromCamera(ndc, built.camera);
          var hits = ray.intersectObjects(built.allMeshes, false);
          for (var i = 0; i < hits.length; i++) { var o = hits[i].object; if (o.visible && o.userData.itemId && INFO[o.userData.itemId]) { if (caption) caption.textContent = INFO[o.userData.itemId]; return; } }
          if (caption) caption.textContent = CAPTION_DEFAULT;
        }
        canvas.addEventListener('pointerdown', function (e) { state.dragging = true; state.moved = 0; state.lastX = e.clientX; state.lastY = e.clientY; if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (err) {} } });
        canvas.addEventListener('pointermove', function (e) {
          if (!state.dragging) return;
          var dx = e.clientX - state.lastX, dy = e.clientY - state.lastY;
          state.lastX = e.clientX; state.lastY = e.clientY; state.moved += Math.abs(dx) + Math.abs(dy);
          state.rotY += dx * 0.008; state.rotX = Math.max(-0.9, Math.min(0.9, state.rotX + dy * 0.006));
        });
        canvas.addEventListener('pointerup', function (e) { state.dragging = false; if (state.moved < 6) pick(e.clientX, e.clientY); });
        canvas.addEventListener('pointercancel', function () { state.dragging = false; });
        canvas.addEventListener('wheel', function (e) { e.preventDefault(); state.dist = Math.max(3.2, Math.min(8, state.dist + (e.deltaY > 0 ? 0.3 : -0.3))); state.targetDist = state.dist; }, { passive: false });
        canvas.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); state.rotY += 0.25; }
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); state.rotY -= 0.25; }
          else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (caption) caption.textContent = INFO.darren; }
        });

        if (REDUCED) { state.cur = 1; state.target = 1; state.active = 3; state.local = 1; setActive(3); state.targetDist = CAMDIST[3]; state.dist = CAMDIST[3]; applyAssembly(); }
        else { onScroll(); setTimeout(onScroll, 120); }

        function frame(now) {
          requestAnimationFrame(frame);
          if (!REDUCED) { state.cur += (state.target - state.cur) * 0.12; var p = state.cur; state.active = Math.min(3, Math.floor(p * 4)); state.local = Math.min(1, Math.max(0, (p - state.active * 0.25) / 0.25)); setActive(state.active); state.targetDist = CAMDIST[state.active]; applyAssembly(); }
          state.dist += (state.targetDist - state.dist) * 0.08;
          built.root.rotation.set(state.rotX, state.rotY, 0);
          built.camera.position.set(0, 1.9, state.dist); built.camera.lookAt(0, 0, 0);
          if (!REDUCED && built.mixers.length) { var dt = Math.min(0.05, (now - lastT) / 1000); built.mixers.forEach(function (mx) { mx.update(dt); }); }
          lastT = now;
          if (built.flowDots.length && state.active === 1 && state.local > 0.85) {
            var t = (((now - start) / 1000) * 0.25) % 1;
            built.flowDots.forEach(function (dot, di) {
              var tt = (t + di / built.flowDots.length) % 1;
              var seg = tt < 0.5 ? 0 : 1, lt = seg === 0 ? tt * 2 : (tt - 0.5) * 2;
              var a = built.busPts[seg], b = built.busPts[seg + 1];
              if (a && b) dot.position.set(a[0] + (b[0] - a[0]) * lt, a[1] + (b[1] - a[1]) * lt, a[2] + (b[2] - a[2]) * lt);
            });
          }
          renderer.render(built.scene, built.camera);
        }
        requestAnimationFrame(frame);
      } catch (err) { drawFallback(0); }
    }).catch(function () { drawFallback(0); });
  }

  function initAll() {
    if (!canvas) return;
    if (!('IntersectionObserver' in window)) { init(); return; }
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) { init(); io.disconnect(); } }); }, { rootMargin: '200px' });
    io.observe(canvas);
    setTimeout(function () { if (canvas.dataset.init !== '1') init(); }, 300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll); else initAll();
})();
