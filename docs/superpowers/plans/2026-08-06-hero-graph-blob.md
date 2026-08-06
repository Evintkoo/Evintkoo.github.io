# Data-Driven Hero Graph Blob Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage's abstract icosahedron hero blob with a 3D node-link graph of the site's actual topics/projects/research (built from `window.SITE_DATA`), that expands to a fullscreen, clickable graph explorer on click.

**Architecture:** `assets/js/hero-scene.js` gets one new code path, `initGraphMode()`, that runs only when `window.SITE_DATA` is present (index.html). Everywhere else it falls back unchanged to the existing `initLegacyBlob()` icosahedron. Both share renderer/camera/theme/ambient-particle setup extracted to the top of the file. The graph mode builds hub (topic) + leaf (article) nodes from `SITE_DATA`, jitters them organically each frame, and on click tweens the camera into a fullscreen labeled/clickable explorer with a back button.

**Tech Stack:** Vanilla JS (ES module), Three.js r162 (existing CDN import), no build step, no test framework — this is a static site (`python3 -m http.server 8080` for local verification).

## Global Constraints

- **Homepage only.** `hero-scene.js` must render the graph on `index.html` only. Every other page (loads `hero-scene.js` but not `data.js`) must render the original icosahedron blob with **identical** appearance/behavior to today — verify this explicitly after every task.
- **Node navigation:** same-tab (`window.location.href = item.href`).
- **Expanded view:** full takeover overlay (fixed, fills viewport, `no-scroll` on body), not a dimmed modal.
- **Labels:** always visible in expanded view (not hover-only); hub labels bold/larger, leaf labels smaller.
- **Expand trigger:** click (not drag) anywhere on the canvas, only while the hero is substantially in view (see Task 3 — clicking the blob far down the page must not pop the fullscreen graph).
- **Click vs. drag:** pointer movement under 4px counts as a click; anything more is the existing drag-to-nudge.
- Spec reference: `docs/superpowers/specs/2026-08-06-hero-graph-blob-design.md`

---

### Task 1: Graph data model + static graph rendering (replaces the icosahedron on index.html only)

**Files:**
- Modify: `assets/js/hero-scene.js` (full rewrite — see below)

**Interfaces:**
- Produces (used by later tasks): `hasGraphData` (bool), `initGraphMode()`, `initLegacyBlob()`, `buildGraphData()` returning `{ hubs: [{id,label,base:THREE.Vector3}], leaves: [{id,label,href,hubIdx,base:THREE.Vector3}], R_HUB:number }`, shared `displace(x,y,z,t)`, `addAmbientParticles(spreadRadius) -> {mat, update(t)}`, `easeOutQuart`, `easeInOutCubic`, module-scope `frameUpdate`/`onThemeChange`/`onResize` function slots wired into a single shared `animate()` loop, shared `group`, `camera`, `tc` (theme colors), `dragOffX`/`dragOffY`/`isDragging` state.

This task is a full rewrite of `assets/js/hero-scene.js`. The legacy icosahedron code is lifted out of the module body into `initLegacyBlob()` with **zero logic changes** (same numbers, same formulas) so non-homepage pages are pixel/behavior identical to today. `initGraphMode()` is new: it reads `window.SITE_DATA`, groups projects+research by topic (only topics with ≥1 item, only items with a non-null `topic`), lays hubs out on a Fibonacci sphere and leaves in a small deterministic cluster around their hub, and renders them as two `THREE.Points` + one `THREE.LineSegments` (no per-frame jitter yet — that's Task 2).

- [ ] **Step 1: Rewrite `assets/js/hero-scene.js`**

```js
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

    function writeStaticPositions() {
      for (let i = 0; i < hubCount; i++) {
        hubPosAttr.array[i * 3] = graph.hubs[i].base.x;
        hubPosAttr.array[i * 3 + 1] = graph.hubs[i].base.y;
        hubPosAttr.array[i * 3 + 2] = graph.hubs[i].base.z;
      }
      hubPosAttr.needsUpdate = true;
      for (let i = 0; i < leafCount; i++) {
        leafPosAttr.array[i * 3] = graph.leaves[i].base.x;
        leafPosAttr.array[i * 3 + 1] = graph.leaves[i].base.y;
        leafPosAttr.array[i * 3 + 2] = graph.leaves[i].base.z;
      }
      leafPosAttr.needsUpdate = true;
      for (let i = 0; i < leafCount; i++) {
        const leaf = graph.leaves[i];
        const hub = graph.hubs[leaf.hubIdx];
        edgePosAttr.array[i * 6] = hub.base.x; edgePosAttr.array[i * 6 + 1] = hub.base.y; edgePosAttr.array[i * 6 + 2] = hub.base.z;
        edgePosAttr.array[i * 6 + 3] = leaf.base.x; edgePosAttr.array[i * 6 + 4] = leaf.base.y; edgePosAttr.array[i * 6 + 5] = leaf.base.z;
      }
      edgePosAttr.needsUpdate = true;
    }
    writeStaticPositions();

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

    // Temporary simple drag-to-nudge — replaced with click/drag/expand
    // pointer logic in Task 3.
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
      hubMat.color.setHex(tc.point); hubMat.opacity = tc.pointAlpha;
      leafMat.color.setHex(tc.point); leafMat.opacity = tc.pointAlpha * 0.8;
      edgeMat.color.setHex(tc.wire); edgeMat.opacity = tc.wireAlpha;
      glowMat.color.setHex(tc.glow); glowMat.opacity = tc.glowAlpha;
      amb.mat.color.setHex(tc.wire); amb.mat.opacity = tc.ambAlpha;
    };
  }
})();
```

- [ ] **Step 2: Verify graph data shape in the browser console**

Run: `python3 -m http.server 8080` from the repo root, then open `http://localhost:8080/` in a browser and open devtools.

In the console, run:
```js
document.querySelectorAll('#heroCanvas').length // expect 1
```
Temporarily add `window.__debugGraph = buildGraphData();` is not accessible (function is module-scoped) — instead verify visually: the hero should now show a cluster-of-clusters point-and-line shape (not a faceted icosahedron wireframe) rotating slowly, roughly 6 denser clumps of points connected by thin lines back toward each clump's center, with the same rose/violet coloring and ambient floating background particles as before.

Expected: no console errors; blob renders as a data-shaped graph, not the old icosahedron.

- [ ] **Step 3: Verify non-homepage pages are unchanged**

Open `http://localhost:8080/about.html` (or any `research/*.html` / `projects/*.html` page). Confirm the background blob still renders as the original faceted, morphing icosahedron wireframe — identical to before this change (compare against `git show HEAD:assets/js/hero-scene.js` behavior if unsure). No console errors.

- [ ] **Step 4: Commit**

```bash
git add assets/js/hero-scene.js
git commit -m "$(cat <<'EOF'
feat: render hero blob as a data-driven topic/article graph

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Organic per-node jitter + reduced-motion gating

**Files:**
- Modify: `assets/js/hero-scene.js` (inside `initGraphMode()`)

**Interfaces:**
- Consumes: `graph.hubs[i].base`, `graph.leaves[i].base`, `hubPosAttr`/`leafPosAttr`/`edgePosAttr`, `displace(x,y,z,t)`, `seededDir(id)`, `isReduced` — all from Task 1.
- Produces: `updateNodePositions(t)`, replacing the one-time `writeStaticPositions()` call site inside `frameUpdate`.

- [ ] **Step 1: Replace the static position writer with a per-frame jittered one**

In `initGraphMode()`, find:

```js
    writeStaticPositions();
```

Replace it with:

```js
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
```

- [ ] **Step 2: Call the updater every frame and gate rotation/scroll-zigzag on reduced motion**

In the same function, find the start of `frameUpdate = function (dt, t) {` inside `initGraphMode()` and replace its body with:

```js
    frameUpdate = function (dt, t) {
      updateNodePositions(t);
      glowMesh.scale.setScalar(1.15 + Math.sin(t * 0.3) * 0.05);

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
      amb.update(t);
    };
```

- [ ] **Step 3: Verify in the browser**

Reload `http://localhost:8080/`. Confirm the graph now visibly breathes/drifts (nodes wobble slightly, edges follow), rotation and scroll-driven zig-zag still work, dragging still nudges the whole graph. In devtools, toggle `prefers-reduced-motion: reduce` (Rendering tab → Emulate CSS media feature) and confirm the graph goes static (no jitter/rotation/zig-zag) but is still visible and draggable. Re-check `about.html` is still unaffected.

- [ ] **Step 4: Commit**

```bash
git add assets/js/hero-scene.js
git commit -m "$(cat <<'EOF'
feat: add organic jitter to hero graph nodes, gate motion on reduced-motion

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Click-vs-drag disambiguation (pointer events), stub `expand()`

**Files:**
- Modify: `assets/js/hero-scene.js` (inside `initGraphMode()`)

**Interfaces:**
- Consumes: `isDragging`, `dragOffX`/`dragOffY` (Task 1).
- Produces: `expand()` (stub — real implementation in Task 4), unified `pointerdown`/`pointermove`/`pointerup` handling on `canvas`/`window` replacing the temporary mouse/touch handlers from Task 1.

- [ ] **Step 1: Replace the temporary drag handlers with pointer-based click/drag detection**

In `initGraphMode()`, find the block starting with:

```js
    // Temporary simple drag-to-nudge — replaced with click/drag/expand
    // pointer logic in Task 3.
    let dragStartX = 0, dragStartY = 0, dragBaseX = 0, dragBaseY = 0;
    canvas.addEventListener('mousedown', function (e) {
```

and ending with:

```js
    window.addEventListener('touchend', function () { isDragging = false; });
```

Replace that entire block with:

```js
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
        dragOffX = dragBaseX + dx * 0.012;
        dragOffY = dragBaseY + dy * -0.012;
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

    function expand() {
      console.log('[hero-graph] expand (stub — implemented in Task 4)');
    }
```

- [ ] **Step 2: Verify in the browser**

Reload `http://localhost:8080/`. Drag the graph — it should still nudge and spring back exactly as before. Click it without moving the pointer (mousedown+mouseup in place) near the top of the page — devtools console should log `[hero-graph] expand (stub — implemented in Task 4)`. Scroll down past one viewport height and click the graph again where it's visible — it should NOT log (click is outside the hero-view guard). Test on a touch device or devtools device-toolbar touch emulation: a tap should also log once, a tap-and-drag should not. Re-check `about.html` (legacy mode, untouched) still drags with the original mouse handlers.

- [ ] **Step 3: Commit**

```bash
git add assets/js/hero-scene.js
git commit -m "$(cat <<'EOF'
feat: disambiguate click vs drag on hero graph via pointer events

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Expand/collapse fullscreen overlay with camera tween and back button

**Files:**
- Modify: `index.html` (markup near `#heroCanvas`)
- Modify: `assets/css/main-theme.css` (new overlay/back-button styles)
- Modify: `assets/js/hero-scene.js` (real `expand()`/`collapse()`, `mode` state, orbit-drag)

**Interfaces:**
- Consumes: `expand()` call site (Task 3), `canvas`, `group`, `camera`, `CAM_Z_HERO`, `easeInOutCubic` (Task 1).
- Produces: `mode` (`'collapsed' | 'expanding' | 'expanded' | 'collapsing'`), `backdropEl`, `backBtn`, `CAM_Z_EXPANDED`, real `expand()`/`collapse()`. Later tasks (5, 6) branch on `mode === 'expanded'`.

- [ ] **Step 1: Add back-button and backdrop markup to `index.html`**

Find:

```html
    <!-- Persistent 3D Background -->
    <div class="scene-bg" aria-hidden="true">
        <canvas id="heroCanvas"></canvas>
    </div>
```

Replace with:

```html
    <!-- Persistent 3D Background -->
    <div class="scene-bg" aria-hidden="true">
        <canvas id="heroCanvas"></canvas>
    </div>
    <div id="heroGraphBackdrop" class="hero-graph-backdrop" aria-hidden="true"></div>
    <button type="button" id="heroGraphBack" class="hero-graph-back" aria-label="Back to homepage">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
    </button>
    <div id="heroGraphLabels" class="hero-graph-labels" aria-hidden="true"></div>
```

- [ ] **Step 2: Add overlay/back-button/label CSS to `assets/css/main-theme.css`**

Append at the end of the file:

```css
/* ================================
   HERO GRAPH — EXPANDED OVERLAY
================================ */

#heroCanvas.hero-graph--expanded {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.hero-graph-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.55);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-base);
}

.hero-graph-backdrop.active {
  opacity: 1;
}

.hero-graph-back {
  position: fixed;
  top: var(--space-8);
  left: var(--space-8);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1002;
  opacity: 0;
  transform: translateX(-8px);
  pointer-events: none;
  transition: opacity var(--transition-base), transform var(--transition-base), background-color var(--transition-base), color var(--transition-base);
}

.hero-graph-back.visible {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.hero-graph-back:hover {
  background: var(--accent-warm);
  color: #fff;
  border-color: var(--accent-warm);
}

.hero-graph-back svg {
  width: 20px;
  height: 20px;
}

.hero-graph-labels {
  position: fixed;
  inset: 0;
  z-index: 1001;
  pointer-events: none;
}

.hero-graph-label {
  position: absolute;
  transform: translate(-50%, -50%);
  font-family: var(--font-mono);
  white-space: nowrap;
  color: var(--text-secondary);
  opacity: 0;
  transition: opacity 0.2s ease, color 0.15s ease;
}

.hero-graph-label.is-visible {
  opacity: 1;
}

.hero-graph-label--hub {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary);
}

.hero-graph-label--leaf {
  font-size: 11px;
  pointer-events: auto;
  cursor: pointer;
}

.hero-graph-label--leaf:hover,
.hero-graph-label--leaf.is-hovered {
  color: var(--accent-warm);
}
```

- [ ] **Step 3: Implement real `expand()`/`collapse()` with a camera tween and orbit-drag**

In `assets/js/hero-scene.js`, inside `initGraphMode()`, find:

```js
    function expand() {
      console.log('[hero-graph] expand (stub — implemented in Task 4)');
    }
```

Replace with:

```js
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
      backdropEl.classList.add('active');
      document.body.classList.add('no-scroll');
    }

    function collapse() {
      if (mode !== 'expanded') return;
      mode = 'collapsing';
      tweenT = 0;
      backBtn.classList.remove('visible');
    }

    backBtn.addEventListener('click', collapse);

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
          backdropEl.classList.remove('active');
          document.body.classList.remove('no-scroll');
        }
      }
    }
```

Next, inside the same `pointermove` handler added in Task 3, change how drag deltas apply so that in expanded mode a drag orbits the graph (Y-axis only) instead of nudging its position. Find:

```js
      if (isDragging) {
        dragOffX = dragBaseX + dx * 0.012;
        dragOffY = dragBaseY + dy * -0.012;
      }
    });
```

Replace with:

```js
      if (isDragging) {
        if (mode === 'expanded') {
          group.rotation.y = orbitBaseRotY + dx * 0.006;
        } else {
          dragOffX = dragBaseX + dx * 0.012;
          dragOffY = dragBaseY + dy * -0.012;
        }
      }
    });
```

And in the `pointerdown` handler, capture the orbit base rotation. Find:

```js
    canvas.addEventListener('pointerdown', function (e) {
      pointerDown = true;
      pointerMoved = false;
      downX = e.clientX; downY = e.clientY;
      dragBaseX = dragOffX; dragBaseY = dragOffY;
    });
```

Replace with:

```js
    canvas.addEventListener('pointerdown', function (e) {
      pointerDown = true;
      pointerMoved = false;
      downX = e.clientX; downY = e.clientY;
      dragBaseX = dragOffX; dragBaseY = dragOffY;
      orbitBaseRotY = group.rotation.y;
    });
```

Finally, wire the tween and expanded-mode auto-rotation into `frameUpdate`. Find the top of the `frameUpdate` function body (starts with `updateNodePositions(t);`) and replace the whole function with:

```js
    frameUpdate = function (dt, t) {
      updateNodePositions(t);
      glowMesh.scale.setScalar(1.15 + Math.sin(t * 0.3) * 0.05);

      if (mode === 'expanding' || mode === 'collapsing') {
        updateExpandTween(dt);
      } else if (mode === 'expanded') {
        if (!isDragging) group.rotation.y += 0.0008;
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
```

- [ ] **Step 4: Verify in the browser**

Reload `http://localhost:8080/`. Click the graph near the top of the page: the camera should smoothly pull back over ~0.7s, the graph should center itself, a dimmed/blurred backdrop should fade in behind it, and a circular back button should fade in at the top-left. Page scroll should be locked (try scrolling — it shouldn't move). Drag left/right while expanded — the graph should orbit (rotate) instead of translate. Click the back button — everything should smoothly reverse: backdrop fades, camera returns, back button hides, scroll unlocks. Confirm `about.html` is unaffected (no back button/backdrop elements exist there since that markup was only added to `index.html`).

- [ ] **Step 5: Commit**

```bash
git add index.html assets/css/main-theme.css assets/js/hero-scene.js
git commit -m "$(cat <<'EOF'
feat: expand hero graph to a fullscreen explorer on click

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Node labels in the expanded view

**Files:**
- Modify: `assets/js/hero-scene.js` (inside `initGraphMode()`)

**Interfaces:**
- Consumes: `mode`, `hubPosAttr`/`leafPosAttr`, `graph.hubs`/`graph.leaves` (`.label`, `.href`), `group`, `camera`, `#heroGraphLabels` container (Task 4 markup), `.hero-graph-label(--hub|--leaf)` / `.is-visible` CSS (Task 4).
- Produces: `hubLabelEls`, `leafLabelEls`, `updateLabels()`, `hideAllLabels()`.

- [ ] **Step 1: Create label elements and a projection helper**

In `initGraphMode()`, find:

```js
    const CAM_Z_EXPANDED = isMobile ? 14 : 11; // tune visually if graph edges clip off-screen
```

and insert immediately **before** it:

```js
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
    const screenPos = { x: 0, y: 0, behind: false };
    function projectToScreen(x, y, z, target) {
      scratchVec.set(x, y, z).applyMatrix4(group.matrixWorld);
      scratchVec.project(camera);
      target.x = (scratchVec.x * 0.5 + 0.5) * canvas.clientWidth;
      target.y = (-scratchVec.y * 0.5 + 0.5) * canvas.clientHeight;
      target.behind = scratchVec.z > 1;
    }

    function updateLabels() {
      for (let i = 0; i < hubCount; i++) {
        projectToScreen(hubPosAttr.array[i * 3], hubPosAttr.array[i * 3 + 1], hubPosAttr.array[i * 3 + 2], screenPos);
        const el = hubLabelEls[i];
        el.style.left = screenPos.x + 'px';
        el.style.top = screenPos.y + 'px';
        el.classList.toggle('is-visible', !screenPos.behind);
      }
      for (let i = 0; i < leafCount; i++) {
        projectToScreen(leafPosAttr.array[i * 3], leafPosAttr.array[i * 3 + 1], leafPosAttr.array[i * 3 + 2], screenPos);
        const el = leafLabelEls[i];
        el.style.left = screenPos.x + 'px';
        el.style.top = screenPos.y + 'px';
        el.classList.toggle('is-visible', !screenPos.behind);
      }
    }

    function hideAllLabels() {
      hubLabelEls.concat(leafLabelEls).forEach(function (el) { el.classList.remove('is-visible'); });
    }
```

- [ ] **Step 2: Update labels each frame while expanded, hide them on collapse**

In `frameUpdate`, find:

```js
      } else if (mode === 'expanded') {
        if (!isDragging) group.rotation.y += 0.0008;
      } else {
```

Replace with:

```js
      } else if (mode === 'expanded') {
        if (!isDragging) group.rotation.y += 0.0008;
        updateLabels();
      } else {
```

In `collapse()`, find:

```js
    function collapse() {
      if (mode !== 'expanded') return;
      mode = 'collapsing';
      tweenT = 0;
      backBtn.classList.remove('visible');
    }
```

Replace with:

```js
    function collapse() {
      if (mode !== 'expanded') return;
      mode = 'collapsing';
      tweenT = 0;
      backBtn.classList.remove('visible');
      hideAllLabels();
    }
```

- [ ] **Step 3: Verify in the browser**

Reload `http://localhost:8080/` and click the graph to expand. Once the tween finishes, every hub should show its bold topic label (ML, Biology, Finance, Economics, AI Infra, Neuro) and every leaf should show its smaller article/project label, all tracking the graph as it auto-rotates or as you drag-orbit it. Labels on the far side of the graph (facing away from camera) should stay hidden. Collapse via the back button — labels should disappear immediately, before the camera tween finishes.

- [ ] **Step 4: Commit**

```bash
git add assets/js/hero-scene.js
git commit -m "$(cat <<'EOF'
feat: show node labels in the expanded hero graph view

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Hover highlight + click-to-navigate on leaf nodes

**Files:**
- Modify: `assets/js/hero-scene.js` (inside `initGraphMode()`)

**Interfaces:**
- Consumes: `mode`, `leafPoints`, `leafLabelEls` (Task 5), `canvas`.
- Produces: raycasting hover state (`hoveredLeaf`), `.is-hovered` toggling, `pointer` cursor on hover.

Navigation itself is already wired via each leaf label's `click` listener (Task 5) — that alone covers both desktop clicks and mobile taps. This task only adds the raycasting hover feedback (desktop enhancement: highlighting the exact 3D point, not just its text label, and showing a pointer cursor before the click).

- [ ] **Step 1: Add raycasting hover to the leaf points**

In `initGraphMode()`, find:

```js
    backBtn.addEventListener('click', collapse);
```

and insert immediately **after** it:

```js
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
```

- [ ] **Step 2: Verify in the browser**

Reload `http://localhost:8080/`, expand the graph, and move the mouse over a leaf node's dot (not just its text label) — its label should turn the accent color (matching the `.is-hovered`/`:hover` style already defined in Task 4's CSS) and the cursor should become a pointer. Move away — it should revert. Click a leaf's label — it should navigate (same tab) to that project/research page. Test at least one node from each topic cluster to confirm the `href` resolves correctly (e.g. a research item goes to `research/....html`, a project item to `projects/....html` or its external `href`).

- [ ] **Step 3: Commit**

```bash
git add assets/js/hero-scene.js
git commit -m "$(cat <<'EOF'
feat: hover-highlight leaf nodes in the expanded hero graph

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Mobile tuning + full regression pass

**Files:**
- Modify: `assets/css/main-theme.css` (mobile label sizing)
- No JS changes expected unless verification surfaces a bug — if so, fix inline and note it in the commit message.

**Interfaces:** None new — this task is tuning + verification against the full spec checklist (`docs/superpowers/specs/2026-08-06-hero-graph-blob-design.md` §8).

- [ ] **Step 1: Add a mobile breakpoint for smaller labels**

In `assets/css/main-theme.css`, find the `.hero-graph-labels` / `.hero-graph-label*` rules added in Task 4 and append after them:

```css
@media (max-width: 767px) {
  .hero-graph-label--hub {
    font-size: 11px;
  }
  .hero-graph-label--leaf {
    font-size: 9px;
  }
}
```

- [ ] **Step 2: Run the full manual verification checklist**

With `python3 -m http.server 8080` running, in a desktop browser and using devtools' device toolbar for a mobile viewport (e.g. 390×844):

1. Light theme and dark theme (toggle via the site's theme switch) — graph colors swap correctly in both collapsed and expanded states.
2. Desktop: drag-to-nudge works without triggering expand; a clean click expands.
3. Mobile viewport: tap expands; tap-to-navigate works on a leaf label in the expanded view.
4. Scroll zig-zag is smooth in the collapsed state; scrolling is locked while expanded.
5. Expand/collapse animation runs smoothly both directions; back button appears/disappears correctly.
6. Click at least 3 leaf nodes across different topics in the expanded view and confirm each navigates to the correct page (`window.location.href` matches the `href` in `assets/js/data.js`).
7. `prefers-reduced-motion: reduce` (devtools Rendering tab): graph renders static (no jitter/rotation/zig-zag) in the collapsed state; expand/collapse still functions.
8. Add a temporary test entry to `SITE_DATA.projects` in `assets/js/data.js` (e.g. `{ id: 'tmp-test', type: 'project', topic: 'ml', label: 'Test Node', title: 'Test', href: '#' }`), reload, confirm it appears in the graph as a new leaf under the ML hub, then **revert this temporary edit** (do not commit it).
9. Revisit `about.html` and one `research/*.html` page — confirm the icosahedron blob is still exactly the pre-existing behavior (no graph, no click-to-expand, no console errors).
10. Check devtools console for errors across all of the above.

Fix anything broken inline before proceeding.

- [ ] **Step 3: Commit**

```bash
git add assets/css/main-theme.css
git commit -m "$(cat <<'EOF'
style: tune hero graph labels for mobile viewports

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

If Step 2 required additional fixes to `assets/js/hero-scene.js` or other files, stage and commit those separately with a message describing what was fixed.
