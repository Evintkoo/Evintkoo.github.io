// ─────────────────────────────────────────────
//  Hero Scene — Three.js
//  index.html: renders SITE_DATA as an organic,
//  drifting topic/article graph. Click expands to
//  a fullscreen explorer; click a node there to
//  open it. Every other page: original abstract
//  morphing wireframe blob, unchanged.
// ─────────────────────────────────────────────

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';

(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const isMobile = window.innerWidth < 768;
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGraphData = !!(window.SITE_DATA && (window.SITE_DATA.projects || window.SITE_DATA.research));

  // ── Renderer ──
  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: !isMobile, powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function getSize() {
    return { w: canvas.clientWidth || window.innerWidth, h: canvas.clientHeight || window.innerHeight };
  }
  const sz = getSize();
  renderer.setSize(sz.w, sz.h, false);

  // ── Scene & Camera ──
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(isMobile ? 55 : 45, sz.w / sz.h, 0.1, 100);
  const CAM_Z_HERO = isMobile ? 7 : 5.5;
  camera.position.z = CAM_Z_HERO;

  // ── Theme Colors ──
  function getThemeColors() {
    const dk = document.documentElement.getAttribute('data-theme') !== 'light';
    return {
      wire: dk ? 0xf43f7a : 0xe11d64,
      point: dk ? 0xa78bfa : 0x7c3aed,
      glow: dk ? 0xf43f7a : 0xe11d64,
      wireAlpha: dk ? 0.15 : 0.18,
      pointAlpha: dk ? 0.50 : 0.55,
      pointSz: dk ? 2.5 : 2.2,
      ambAlpha: dk ? 0.18 : 0.22,
      glowAlpha: dk ? 0.03 : 0.04,
      blending: dk ? THREE.AdditiveBlending : THREE.NormalBlending,
    };
  }
  let tc = getThemeColors();

  // ── Group ──
  const group = new THREE.Group();
  const baseX = isMobile ? 1 : 4;
  const baseY = 0;
  group.position.set(baseX, baseY, 0);
  group.scale.setScalar(isReduced ? 1 : 0.01);
  scene.add(group);

  // ── Shared: organic displacement noise ──
  function displace(x, y, z, t) {
    let d = Math.sin(x * 1.2 + t * 0.6) * Math.cos(y * 1.3 + t * 0.4) * 0.35;
    d += Math.sin(y * 2.0 + t * 0.5 + 1.0) * Math.sin(z * 1.8 + t * 0.7) * 0.2;
    d += Math.cos(z * 3.0 + x * 2.5 + t * 0.9) * 0.1;
    d += Math.sin(t * 0.3) * 0.08;
    return d;
  }

  // ── Shared: ambient background particles ──
  function addAmbientParticles(spreadRadius) {
    const ambCount = isMobile ? 60 : 160;
    const ambGeo = new THREE.BufferGeometry();
    const ambArr = new Float32Array(ambCount * 3);
    const spread = spreadRadius * 3;
    for (let i = 0; i < ambCount; i++) {
      ambArr[i * 3] = (Math.random() - 0.5) * spread * 2;
      ambArr[i * 3 + 1] = (Math.random() - 0.5) * spread * 2;
      ambArr[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    ambGeo.setAttribute('position', new THREE.BufferAttribute(ambArr, 3));
    const ambMat = new THREE.PointsMaterial({
      color: tc.wire, size: 1.5, transparent: true, opacity: tc.ambAlpha,
      blending: tc.blending, depthWrite: false, sizeAttenuation: false,
    });
    const points = new THREE.Points(ambGeo, ambMat);
    group.add(points);

    const pData = [];
    for (let i = 0; i < ambCount; i++) {
      pData.push({
        spd: 0.1 + Math.random() * 0.3, ph: Math.random() * Math.PI * 2, amp: 0.3 + Math.random() * 0.8,
        bx: ambArr[i * 3], by: ambArr[i * 3 + 1], bz: ambArr[i * 3 + 2],
      });
    }
    function update(time) {
      const aPos = ambGeo.attributes.position;
      for (let i = 0; i < ambCount; i++) {
        const p = pData[i], ix = i * 3;
        aPos.array[ix] = p.bx + Math.sin(time * p.spd + p.ph) * p.amp;
        aPos.array[ix + 1] = p.by + Math.cos(time * p.spd * 0.7 + p.ph) * p.amp;
        aPos.array[ix + 2] = p.bz + Math.sin(time * p.spd * 0.5 + p.ph) * p.amp * 0.5;
      }
      aPos.needsUpdate = true;
    }
    return { mat: ambMat, update: update };
  }

  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // ── Shared animation state ──
  const clock = new THREE.Clock();
  let time = 0;
  let entrance = isReduced ? 1 : 0;
  const entrDur = 2.5;

  let scrollY = 0;
  window.addEventListener('scroll', function () { scrollY = window.pageYOffset; }, { passive: true });

  let isDragging = false;
  let dragOffX = 0, dragOffY = 0;

  let frameUpdate = function () {};
  let onThemeChange = function () {};

  // ── Mode dispatch ──
  if (hasGraphData) {
    initGraphMode();
  } else {
    initLegacyBlob();
  }

  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    time += dt;
    if (entrance < 1) {
      entrance = Math.min(entrance + dt / entrDur, 1);
      group.scale.setScalar(easeOutQuart(entrance));
    }
    frameUpdate(dt, time);
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', function () {
    const s = getSize();
    if (s.w === 0 || s.h === 0) return;
    camera.aspect = s.w / s.h;
    camera.updateProjectionMatrix();
    renderer.setSize(s.w, s.h, false);
  });

  new MutationObserver(function () { tc = getThemeColors(); onThemeChange(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ═══════════════════════════════════════════
  //  LEGACY MODE — original icosahedron blob
  //  (unchanged from the pre-graph implementation;
  //  runs on every page except index.html)
  // ═══════════════════════════════════════════
  function initLegacyBlob() {
    const detail = isMobile ? 2 : 4;
    const radius = isMobile ? 2.0 : 2.5;
    const geometry = new THREE.IcosahedronGeometry(radius, detail);
    const origPos = new Float32Array(geometry.attributes.position.array);
    const vertCount = geometry.attributes.position.count;
    const origNormals = new Float32Array(vertCount * 3);
    for (let i = 0; i < vertCount; i++) {
      const ix = i * 3;
      const ox = origPos[ix], oy = origPos[ix + 1], oz = origPos[ix + 2];
      const invLen = 1 / Math.sqrt(ox * ox + oy * oy + oz * oz);
      origNormals[ix] = ox * invLen;
      origNormals[ix + 1] = oy * invLen;
      origNormals[ix + 2] = oz * invLen;
    }

    const wireMat = new THREE.MeshBasicMaterial({ color: tc.wire, wireframe: true, transparent: true, opacity: tc.wireAlpha });
    group.add(new THREE.Mesh(geometry, wireMat));

    const ptsMat = new THREE.PointsMaterial({
      color: tc.point, size: tc.pointSz, transparent: true, opacity: tc.pointAlpha,
      blending: tc.blending, depthWrite: false, sizeAttenuation: false,
    });
    group.add(new THREE.Points(geometry, ptsMat));

    const glowGeo = new THREE.SphereGeometry(radius * 1.15, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: tc.glow, transparent: true, opacity: tc.glowAlpha, side: THREE.BackSide });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    group.add(glowMesh);

    const amb = addAmbientParticles(radius);

    let dragStartX = 0, dragStartY = 0, dragBaseX = 0, dragBaseY = 0;
    canvas.addEventListener('mousedown', function (e) {
      isDragging = true; dragStartX = e.clientX; dragStartY = e.clientY;
      dragBaseX = dragOffX; dragBaseY = dragOffY; canvas.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', function (e) {
      if (isDragging) {
        dragOffX = dragBaseX + (e.clientX - dragStartX) * 0.012;
        dragOffY = dragBaseY + (e.clientY - dragStartY) * -0.012;
      }
    });
    window.addEventListener('mouseup', function () { isDragging = false; canvas.style.cursor = ''; });
    canvas.addEventListener('touchstart', function (e) {
      isDragging = true; dragStartX = e.touches[0].clientX; dragStartY = e.touches[0].clientY;
      dragBaseX = dragOffX; dragBaseY = dragOffY;
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (isDragging) {
        dragOffX = dragBaseX + (e.touches[0].clientX - dragStartX) * 0.012;
        dragOffY = dragBaseY + (e.touches[0].clientY - dragStartY) * -0.012;
      }
    }, { passive: true });
    window.addEventListener('touchend', function () { isDragging = false; });

    frameUpdate = function (dt, t) {
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const ix = i * 3;
        const ox = origPos[ix], oy = origPos[ix + 1], oz = origPos[ix + 2];
        const d = displace(ox, oy, oz, t);
        pos.array[ix] = ox + origNormals[ix] * d;
        pos.array[ix + 1] = oy + origNormals[ix + 1] * d;
        pos.array[ix + 2] = oz + origNormals[ix + 2] * d;
      }
      pos.needsUpdate = true;

      glowMesh.scale.setScalar(1.15 + Math.sin(t * 0.3) * 0.05);
      group.rotation.y += 0.002;
      group.rotation.x = Math.sin(t * 0.25) * 0.04;
      group.rotation.z = Math.cos(t * 0.18) * 0.02;

      const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
      const scrollProgress = scrollY / maxScroll;
      const zigAmp = isMobile ? 2.0 : 4.5;
      const scrollX = Math.cos(scrollProgress * Math.PI * 2) * zigAmp;
      const scrollOffY = -(scrollProgress) * 1.2;
      const targetX = dragOffX + scrollX;
      const targetY = baseY + dragOffY + scrollOffY;

      if (isDragging) {
        group.position.x += (targetX - group.position.x) * 0.12;
        group.position.y += (targetY - group.position.y) * 0.12;
      } else {
        dragOffX *= 0.97; dragOffY *= 0.97;
        if (Math.abs(dragOffX) < 0.001) dragOffX = 0;
        if (Math.abs(dragOffY) < 0.001) dragOffY = 0;
        group.position.x += (targetX - group.position.x) * 0.06;
        group.position.y += (targetY - group.position.y) * 0.06;
      }
      amb.update(t);
    };

    onThemeChange = function () {
      wireMat.color.setHex(tc.wire); wireMat.opacity = tc.wireAlpha;
      ptsMat.color.setHex(tc.point); ptsMat.opacity = tc.pointAlpha; ptsMat.size = tc.pointSz;
      glowMat.color.setHex(tc.glow); glowMat.opacity = tc.glowAlpha;
      amb.mat.color.setHex(tc.wire); amb.mat.opacity = tc.ambAlpha;
    };
  }

  // ═══════════════════════════════════════════
  //  GRAPH MODE — data-driven topic/article graph
  //  (index.html only)
  // ═══════════════════════════════════════════

  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h >>> 0;
  }
  function seededDir(id) {
    const h = hashStr(id);
    const a = Math.abs(Math.sin(h * 12.9898)) % 1;
    const b = Math.abs(Math.sin(h * 78.233)) % 1;
    const c = Math.abs(Math.sin(h * 37.719)) % 1;
    const v = new THREE.Vector3(a - 0.5, b - 0.5, c - 0.5);
    return v.lengthSq() > 1e-6 ? v.normalize() : new THREE.Vector3(1, 0, 0);
  }
  function seededScalar01(id) {
    return Math.abs(Math.sin(hashStr(id) * 53.171)) % 1;
  }
  function fibonacciSphere(n, r) {
    const pts = [];
    if (n <= 0) return pts;
    if (n === 1) { pts.push(new THREE.Vector3(r, 0, 0)); return pts; }
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      pts.push(new THREE.Vector3(Math.cos(theta) * rad * r, y * r, Math.sin(theta) * rad * r));
    }
    return pts;
  }

  function buildGraphData() {
    const data = window.SITE_DATA || {};
    const topics = data.topics || [];
    const items = [].concat(data.projects || [], data.research || []).filter(function (it) { return it.topic; });

    const byTopic = {};
    items.forEach(function (it) { (byTopic[it.topic] = byTopic[it.topic] || []).push(it); });
    const activeTopics = topics.filter(function (t) { return byTopic[t.id] && byTopic[t.id].length; });

    const R_HUB = isMobile ? 2.0 : 2.5;
    const R_LEAF = R_HUB * 0.42;

    const hubPos = fibonacciSphere(activeTopics.length, R_HUB);
    const hubs = activeTopics.map(function (t, i) { return { id: t.id, label: t.label, base: hubPos[i] }; });
    const hubIndex = {};
    hubs.forEach(function (h, i) { hubIndex[h.id] = i; });

    const leaves = items.map(function (it) {
      const hub = hubs[hubIndex[it.topic]];
      const mag = R_LEAF * (0.65 + 0.35 * seededScalar01(it.id));
      const base = hub.base.clone().add(seededDir(it.id).multiplyScalar(mag));
      return { id: it.id, label: it.label, href: it.href, hubIdx: hubIndex[it.topic], base: base };
    });

    return { hubs: hubs, leaves: leaves, R_HUB: R_HUB };
  }

  function initGraphMode() {
    canvas.style.pointerEvents = 'auto'; // enable interaction (only ever runs on index.html)

    const graph = buildGraphData();
    const hubCount = graph.hubs.length;
    const leafCount = graph.leaves.length;

    const hubGeo = new THREE.BufferGeometry();
    const hubPosAttr = new THREE.BufferAttribute(new Float32Array(Math.max(hubCount, 1) * 3), 3);
    hubGeo.setAttribute('position', hubPosAttr);

    const leafGeo = new THREE.BufferGeometry();
    const leafPosAttr = new THREE.BufferAttribute(new Float32Array(Math.max(leafCount, 1) * 3), 3);
    leafGeo.setAttribute('position', leafPosAttr);

    const edgeGeo = new THREE.BufferGeometry();
    const edgePosAttr = new THREE.BufferAttribute(new Float32Array(Math.max(leafCount, 1) * 2 * 3), 3);
    edgeGeo.setAttribute('position', edgePosAttr);

    const hubJitterDir = graph.hubs.map(function (h) { return seededDir(h.id + ':jit'); });
    const leafJitterDir = graph.leaves.map(function (l) { return seededDir(l.id + ':jit'); });
    const JITTER_AMT = isReduced ? 0 : 0.18;

    function updateNodePositions(t) {
      for (let i = 0; i < hubCount; i++) {
        const b = graph.hubs[i].base;
        const d = JITTER_AMT ? displace(b.x, b.y, b.z, t) * JITTER_AMT : 0;
        const dir = hubJitterDir[i];
        hubPosAttr.array[i * 3] = b.x + dir.x * d;
        hubPosAttr.array[i * 3 + 1] = b.y + dir.y * d;
        hubPosAttr.array[i * 3 + 2] = b.z + dir.z * d;
      }
      hubPosAttr.needsUpdate = true;

      for (let i = 0; i < leafCount; i++) {
        const b = graph.leaves[i].base;
        const d = JITTER_AMT ? displace(b.x, b.y, b.z, t + 10) * JITTER_AMT : 0;
        const dir = leafJitterDir[i];
        leafPosAttr.array[i * 3] = b.x + dir.x * d;
        leafPosAttr.array[i * 3 + 1] = b.y + dir.y * d;
        leafPosAttr.array[i * 3 + 2] = b.z + dir.z * d;
      }
      leafPosAttr.needsUpdate = true;

      for (let i = 0; i < leafCount; i++) {
        const leaf = graph.leaves[i];
        const h3 = leaf.hubIdx * 3;
        edgePosAttr.array[i * 6] = hubPosAttr.array[h3];
        edgePosAttr.array[i * 6 + 1] = hubPosAttr.array[h3 + 1];
        edgePosAttr.array[i * 6 + 2] = hubPosAttr.array[h3 + 2];
        edgePosAttr.array[i * 6 + 3] = leafPosAttr.array[i * 3];
        edgePosAttr.array[i * 6 + 4] = leafPosAttr.array[i * 3 + 1];
        edgePosAttr.array[i * 6 + 5] = leafPosAttr.array[i * 3 + 2];
      }
      edgePosAttr.needsUpdate = true;
    }
    updateNodePositions(0);

    const hubMat = new THREE.PointsMaterial({
      color: tc.point, size: tc.pointSz * 2.2, transparent: true, opacity: tc.pointAlpha,
      blending: tc.blending, depthWrite: false, sizeAttenuation: false,
    });
    const leafMat = new THREE.PointsMaterial({
      color: tc.point, size: tc.pointSz, transparent: true, opacity: tc.pointAlpha * 0.8,
      blending: tc.blending, depthWrite: false, sizeAttenuation: false,
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: tc.wire, transparent: true, opacity: tc.wireAlpha });

    const hubPoints = new THREE.Points(hubGeo, hubMat);
    const leafPoints = new THREE.Points(leafGeo, leafMat);
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    group.add(edgeLines, hubPoints, leafPoints);

    const glowGeo = new THREE.SphereGeometry(graph.R_HUB * 1.3, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: tc.glow, transparent: true, opacity: tc.glowAlpha, side: THREE.BackSide });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    group.add(glowMesh);

    const amb = addAmbientParticles(graph.R_HUB);

    // Click (expand) vs. drag (nudge) via a single pointer flow.
    // Movement under CLICK_MOVE_THRESHOLD px counts as a click.
    const CLICK_MOVE_THRESHOLD = 4;
    let pointerDown = false;
    let pointerMoved = false;
    let downX = 0, downY = 0, dragBaseX = 0, dragBaseY = 0;

    canvas.addEventListener('pointerdown', function (e) {
      pointerDown = true;
      pointerMoved = false;
      downX = e.clientX; downY = e.clientY;
      dragBaseX = dragOffX; dragBaseY = dragOffY;
      orbitBaseRotY = group.rotation.y;
    });

    window.addEventListener('pointermove', function (e) {
      if (!pointerDown) return;
      const dx = e.clientX - downX, dy = e.clientY - downY;
      if (!pointerMoved && Math.hypot(dx, dy) > CLICK_MOVE_THRESHOLD) {
        pointerMoved = true;
        isDragging = true;
        canvas.style.cursor = 'grabbing';
      }
      if (isDragging) {
        if (mode === 'expanded') {
          group.rotation.y = orbitBaseRotY + dx * 0.006;
        } else {
          dragOffX = dragBaseX + dx * 0.012;
          dragOffY = dragBaseY + dy * -0.012;
        }
      }
    });

    window.addEventListener('pointerup', function () {
      if (pointerDown && !pointerMoved) {
        // Only treat a click as "open the explorer" while the hero is
        // still substantially in view — this canvas is a persistent
        // full-page background, and we don't want a stray click on
        // empty whitespace far down the page to pop the fullscreen graph.
        if (window.pageYOffset < window.innerHeight * 0.9) {
          expand();
        }
      }
      pointerDown = false;
      isDragging = false;
      canvas.style.cursor = '';
    });

    const labelsContainer = document.getElementById('heroGraphLabels');
    const hubLabelEls = graph.hubs.map(function (h) {
      const el = document.createElement('div');
      el.className = 'hero-graph-label hero-graph-label--hub';
      el.textContent = h.label;
      labelsContainer.appendChild(el);
      return el;
    });
    const leafLabelEls = graph.leaves.map(function (l) {
      const el = document.createElement('div');
      el.className = 'hero-graph-label hero-graph-label--leaf';
      el.textContent = l.label;
      el.addEventListener('click', function () { window.location.href = l.href; });
      labelsContainer.appendChild(el);
      return el;
    });

    const scratchVec = new THREE.Vector3();
    const camSpaceVec = new THREE.Vector3();
    const centerCamSpace = new THREE.Vector3();
    const screenPos = { x: 0, y: 0, camZ: 0 };
    function projectToScreen(x, y, z, target) {
      scratchVec.set(x, y, z).applyMatrix4(group.matrixWorld);
      camSpaceVec.copy(scratchVec).applyMatrix4(camera.matrixWorldInverse);
      scratchVec.project(camera);
      target.x = (scratchVec.x * 0.5 + 0.5) * canvas.clientWidth;
      target.y = (-scratchVec.y * 0.5 + 0.5) * canvas.clientHeight;
      target.camZ = camSpaceVec.z;
    }

    function updateLabels() {
      centerCamSpace.set(0, 0, 0).applyMatrix4(group.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
      const centerZ = centerCamSpace.z;
      for (let i = 0; i < hubCount; i++) {
        projectToScreen(hubPosAttr.array[i * 3], hubPosAttr.array[i * 3 + 1], hubPosAttr.array[i * 3 + 2], screenPos);
        const el = hubLabelEls[i];
        el.style.left = screenPos.x + 'px';
        el.style.top = screenPos.y + 'px';
        el.classList.toggle('is-visible', screenPos.camZ >= centerZ);
      }
      for (let i = 0; i < leafCount; i++) {
        projectToScreen(leafPosAttr.array[i * 3], leafPosAttr.array[i * 3 + 1], leafPosAttr.array[i * 3 + 2], screenPos);
        const el = leafLabelEls[i];
        el.style.left = screenPos.x + 'px';
        el.style.top = screenPos.y + 'px';
        el.classList.toggle('is-visible', screenPos.camZ >= centerZ);
      }
    }

    function hideAllLabels() {
      hubLabelEls.concat(leafLabelEls).forEach(function (el) { el.classList.remove('is-visible'); });
    }

    const CAM_Z_EXPANDED = isMobile ? 14 : 11; // tune visually if graph edges clip off-screen
    const TWEEN_DUR = 0.7;
    const backdropEl = document.getElementById('heroGraphBackdrop');
    const backBtn = document.getElementById('heroGraphBack');

    let mode = 'collapsed'; // 'collapsed' | 'expanding' | 'expanded' | 'collapsing'
    let tweenT = 0;
    let orbitBaseRotY = 0;

    function expand() {
      if (mode !== 'collapsed') return;
      mode = 'expanding';
      tweenT = 0;
      canvas.classList.add('hero-graph--expanded');
      canvas.parentElement.classList.add('hero-graph--expanded');
      backdropEl.classList.add('active');
      document.body.classList.add('no-scroll');
    }

    function collapse() {
      if (mode !== 'expanded') return;
      mode = 'collapsing';
      tweenT = 0;
      backBtn.classList.remove('visible');
      hideAllLabels();
    }

    backBtn.addEventListener('click', collapse);

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.12;
    const pointerNDC = new THREE.Vector2();
    let hoveredLeaf = -1;

    window.addEventListener('pointermove', function (e) {
      if (mode !== 'expanded' || isDragging) {
        if (hoveredLeaf >= 0) {
          leafLabelEls[hoveredLeaf].classList.remove('is-hovered');
          hoveredLeaf = -1;
          canvas.style.cursor = '';
        }
        return;
      }
      const rect = canvas.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);
      const hits = raycaster.intersectObject(leafPoints);
      const idx = hits.length ? hits[0].index : -1;
      if (idx !== hoveredLeaf) {
        if (hoveredLeaf >= 0) leafLabelEls[hoveredLeaf].classList.remove('is-hovered');
        hoveredLeaf = idx;
        if (hoveredLeaf >= 0) {
          leafLabelEls[hoveredLeaf].classList.add('is-hovered');
          canvas.style.cursor = 'pointer';
        } else {
          canvas.style.cursor = '';
        }
      }
    });

    function updateExpandTween(dt) {
      tweenT = Math.min(tweenT + dt / TWEEN_DUR, 1);
      const e = easeInOutCubic(tweenT);
      if (mode === 'expanding') {
        camera.position.z = CAM_Z_HERO + (CAM_Z_EXPANDED - CAM_Z_HERO) * e;
        group.position.x += (0 - group.position.x) * 0.15;
        group.position.y += (0 - group.position.y) * 0.15;
        if (tweenT >= 1) {
          mode = 'expanded';
          backBtn.classList.add('visible');
        }
      } else if (mode === 'collapsing') {
        camera.position.z = CAM_Z_EXPANDED + (CAM_Z_HERO - CAM_Z_EXPANDED) * e;
        if (tweenT >= 1) {
          mode = 'collapsed';
          canvas.classList.remove('hero-graph--expanded');
          canvas.parentElement.classList.remove('hero-graph--expanded');
          backdropEl.classList.remove('active');
          document.body.classList.remove('no-scroll');
        }
      }
    }

    frameUpdate = function (dt, t) {
      updateNodePositions(t);
      glowMesh.scale.setScalar(1.15 + Math.sin(t * 0.3) * 0.05);

      if (mode === 'expanding' || mode === 'collapsing') {
        updateExpandTween(dt);
      } else if (mode === 'expanded') {
        if (!isDragging) group.rotation.y += 0.0008;
        updateLabels();
      } else {
        // collapsed
        if (!isReduced) {
          group.rotation.y += 0.002;
          group.rotation.x = Math.sin(t * 0.25) * 0.04;
          group.rotation.z = Math.cos(t * 0.18) * 0.02;
        }

        let targetX = dragOffX;
        let targetY = baseY + dragOffY;
        if (!isReduced) {
          const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
          const scrollProgress = scrollY / maxScroll;
          const zigAmp = isMobile ? 2.0 : 4.5;
          targetX += Math.cos(scrollProgress * Math.PI * 2) * zigAmp;
          targetY += -(scrollProgress) * 1.2;
        }

        if (isDragging) {
          group.position.x += (targetX - group.position.x) * 0.12;
          group.position.y += (targetY - group.position.y) * 0.12;
        } else {
          dragOffX *= 0.97; dragOffY *= 0.97;
          if (Math.abs(dragOffX) < 0.001) dragOffX = 0;
          if (Math.abs(dragOffY) < 0.001) dragOffY = 0;
          group.position.x += (targetX - group.position.x) * 0.06;
          group.position.y += (targetY - group.position.y) * 0.06;
        }
      }
      amb.update(t);
    };

    onThemeChange = function () {
      hubMat.color.setHex(tc.point); hubMat.opacity = tc.pointAlpha;
      leafMat.color.setHex(tc.point); leafMat.opacity = tc.pointAlpha * 0.8;
      edgeMat.color.setHex(tc.wire); edgeMat.opacity = tc.wireAlpha;
      glowMat.color.setHex(tc.glow); glowMat.opacity = tc.glowAlpha;
      amb.mat.color.setHex(tc.wire); amb.mat.opacity = tc.ambAlpha;
    };
  }
})();
