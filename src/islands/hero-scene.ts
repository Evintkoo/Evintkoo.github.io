// ─────────────────────────────────────────────
//  Hero Scene — Three.js
//  index.html: renders SITE_DATA as an organic,
//  drifting topic/article graph. Click expands to
//  a fullscreen explorer; click a node there to
//  open it. Every other page: original abstract
//  morphing wireframe blob, unchanged.
// ─────────────────────────────────────────────

// @ts-expect-error - imported directly from a CDN URL (no local types
// package); a faithful port of the legacy assets/js/hero-scene.js pattern
// (see final-review.md Minor #14), intentionally left unpinned/untyped.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';

// Fullscreen explorer label icons, keyed by the fixed topic taxonomy (mirrors
// src/pages/index.astro's `topics` list: ml/bio/fin/econ/infra/neuro). Leaves
// use their parent hub's icon so the whole topic group reads consistently —
// per live-preview QA feedback asking for icons on every graph label field.
const TOPIC_ICONS: Record<string, string> = {
  ml: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/></svg>',
  bio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2v6L4 20a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L15 8V2M9 15h6"/></svg>',
  fin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 17 9 11 13 15 21 6"/><polyline points="15 6 21 6 21 12"/></svg>',
  econ: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="12" width="4" height="8"/><rect x="10" y="7" width="4" height="13"/><rect x="17" y="3" width="4" height="17"/></svg>',
  infra: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="6" rx="1.5"/><rect x="2" y="15" width="20" height="6" rx="1.5"/><path d="M6 8v.01M6 18v.01"/></svg>',
  neuro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="6" r="1.6"/><circle cx="19" cy="6" r="1.6"/><circle cx="5" cy="18" r="1.6"/><circle cx="19" cy="18" r="1.6"/><path d="M12 9V6.5M12 15v2.5M9.7 10.3 6.3 7M14.3 10.3 17.7 7M9.7 13.7 6.3 17M14.3 13.7 17.7 17"/></svg>',
};

export interface GraphData {
  topics: Array<{ id: string; label: string }>;
  projects: Array<{ id: string; label: string; topic: string | null; href: string }>;
  research: Array<{ id: string; label: string; topic: string; href: string }>;
}

// Shared shape of a single graph node (project or research entry) once
// merged and filtered to only those with a topic — used by buildGraphData()
// below so TS can track it through .concat()/.filter()/.map() instead of
// widening to `never[]` under strict mode.
interface GraphItem {
  id: string;
  label: string;
  topic: string | null;
  href: string;
}

export function initHeroScene(canvas: HTMLCanvasElement, graphData?: GraphData): void {
  const isMobile = window.innerWidth < 768;
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGraphData = !!graphData;

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
  // Legacy site used a two-tone pink+purple accent pair here (0xf43f7a /
  // 0xe11d64 / 0xa78bfa / 0x7c3aed) that predates the "Technical Editorial"
  // single-blue-accent redesign (src/styles/tokens.css's --accent) — this
  // 3D scene was a faithful byte-for-byte port of the OLD palette and was
  // never updated when the new palette was defined, so it kept rendering in
  // the legacy pink/red tone everywhere .scene-bg is visible (every page).
  // Collapsed to the single accent token, same simplification already
  // applied to the mindmap/chart islands.
  function getThemeColors() {
    const dk = document.documentElement.getAttribute('data-theme') !== 'light';
    return {
      wire: dk ? 0x5b7fff : 0x2952e3,
      point: dk ? 0x5b7fff : 0x2952e3,
      glow: dk ? 0x5b7fff : 0x2952e3,
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
  function displace(x: number, y: number, z: number, t: number): number {
    let d = Math.sin(x * 1.2 + t * 0.6) * Math.cos(y * 1.3 + t * 0.4) * 0.35;
    d += Math.sin(y * 2.0 + t * 0.5 + 1.0) * Math.sin(z * 1.8 + t * 0.7) * 0.2;
    d += Math.cos(z * 3.0 + x * 2.5 + t * 0.9) * 0.1;
    d += Math.sin(t * 0.3) * 0.08;
    return d;
  }

  // ── Shared: ambient background particles ──
  function addAmbientParticles(spreadRadius: number) {
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

    const pData: { spd: number; ph: number; amp: number; bx: number; by: number; bz: number }[] = [];
    for (let i = 0; i < ambCount; i++) {
      pData.push({
        spd: 0.1 + Math.random() * 0.3, ph: Math.random() * Math.PI * 2, amp: 0.3 + Math.random() * 0.8,
        bx: ambArr[i * 3], by: ambArr[i * 3 + 1], bz: ambArr[i * 3 + 2],
      });
    }
    function update(time: number) {
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

  function easeOutQuart(t: number) { return 1 - Math.pow(1 - t, 4); }
  function easeInOutCubic(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // ── Shared animation state ──
  const clock = new THREE.Clock();
  let time = 0;
  let entrance = isReduced ? 1 : 0;
  const entrDur = 2.5;

  let scrollY = 0;
  window.addEventListener('scroll', function () { scrollY = window.pageYOffset; }, { passive: true });

  let isDragging = false;
  let dragOffX = 0, dragOffY = 0;

  let frameUpdate = function (dt: number, t: number) {};
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

  function hashStr(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h >>> 0;
  }
  function seededDir(id: string) {
    const h = hashStr(id);
    const a = Math.abs(Math.sin(h * 12.9898)) % 1;
    const b = Math.abs(Math.sin(h * 78.233)) % 1;
    const c = Math.abs(Math.sin(h * 37.719)) % 1;
    const v = new THREE.Vector3(a - 0.5, b - 0.5, c - 0.5);
    return v.lengthSq() > 1e-6 ? v.normalize() : new THREE.Vector3(1, 0, 0);
  }
  function seededScalar01(id: string) {
    return Math.abs(Math.sin(hashStr(id) * 53.171)) % 1;
  }
  function fibonacciSphere(n: number, r: number) {
    // THREE's types are unavailable (see the @ts-expect-error import note
    // above), so Vector3 instances are typed as `any` here — same
    // situation as buildGraphData()'s `data: any` below.
    const pts: any[] = [];
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
    const data: Partial<GraphData> = graphData || {};
    const topics = data.topics || [];
    const items: GraphItem[] = ([] as GraphItem[])
      .concat(data.projects || [], data.research || [])
      .filter(function (it): it is GraphItem { return !!it.topic; });

    const byTopic: Record<string, GraphItem[]> = {};
    items.forEach(function (it) { (byTopic[it.topic as string] = byTopic[it.topic as string] || []).push(it); });
    const activeTopics = topics.filter(function (t) { return byTopic[t.id] && byTopic[t.id].length; });

    const R_HUB = isMobile ? 2.0 : 2.5;
    const R_LEAF = R_HUB * 0.42;

    const hubPos = fibonacciSphere(activeTopics.length, R_HUB);
    const hubs = activeTopics.map(function (t, i) { return { id: t.id, label: t.label, base: hubPos[i] }; });
    const hubIndex: Record<string, number> = {};
    hubs.forEach(function (h, i) { hubIndex[h.id] = i; });

    const leaves = items.map(function (it) {
      const hub = hubs[hubIndex[it.topic as string]];
      const mag = R_LEAF * (0.65 + 0.35 * seededScalar01(it.id));
      const base = hub.base.clone().add(seededDir(it.id).multiplyScalar(mag));
      return { id: it.id, label: it.label, href: it.href, hubIdx: hubIndex[it.topic as string], base: base };
    });

    return { hubs: hubs, leaves: leaves, R_HUB: R_HUB };
  }

  function initGraphMode() {
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

    function updateNodePositions(t: number) {
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
        if (mode === 'expanded') {
          if (hoveredLeaf >= 0) {
            // Clicking directly on a leaf point navigates too, not just its
            // label — matches the mindmap's node dots being clickable
            // alongside their note cards.
            window.location.href = graph.leaves[hoveredLeaf].href;
          } else {
            // Clicking anywhere else in the expanded view (not on a node)
            // closes the explorer — the fullscreen canvas covers the whole
            // viewport, so this is the "click outside" a normal modal would
            // get for free.
            collapse();
          }
        } else if (window.pageYOffset < window.innerHeight * 0.9) {
          // Only treat a click as "open the explorer" while the hero is
          // still substantially in view — this canvas is a persistent
          // full-page background, and we don't want a stray click on
          // empty whitespace far down the page to pop the fullscreen graph.
          expand();
        }
      }
      pointerDown = false;
      isDragging = false;
      canvas.style.cursor = '';
    });

    // Non-null: Layout.astro always renders #heroGraphLabels/#heroGraphBackdrop/
    // #heroGraphBack unconditionally (see src/components/Layout.astro), so
    // these lookups can't actually fail at runtime.
    // The icon markup below (TOPIC_ICONS) is a fixed, trusted string this
    // file owns; node labels are content-derived (project/research titles),
    // so they're set via textContent on a separate span rather than
    // concatenated into innerHTML.
    function makeGraphLabel(className: string, topicId: string, label: string): HTMLDivElement {
      const el = document.createElement('div');
      el.className = className;
      if (TOPIC_ICONS[topicId]) el.innerHTML = TOPIC_ICONS[topicId];
      const span = document.createElement('span');
      span.textContent = label;
      el.appendChild(span);
      return el;
    }

    const labelsContainer = document.getElementById('heroGraphLabels')!;
    const hubLabelEls = graph.hubs.map(function (h) {
      const el = makeGraphLabel('hero-graph-label hero-graph-label--hub', h.id, h.label);
      labelsContainer.appendChild(el);
      return el;
    });
    const leafLabelEls = graph.leaves.map(function (l) {
      const hubId = graph.hubs[l.hubIdx] ? graph.hubs[l.hubIdx].id : '';
      const el = makeGraphLabel('hero-graph-label hero-graph-label--leaf', hubId, l.label);
      el.addEventListener('click', function () { window.location.href = l.href; });
      labelsContainer.appendChild(el);
      return el;
    });

    const scratchVec = new THREE.Vector3();
    const camSpaceVec = new THREE.Vector3();
    const centerCamSpace = new THREE.Vector3();
    const screenPos = { x: 0, y: 0, camZ: 0 };
    function projectToScreen(x: number, y: number, z: number, target: { x: number; y: number; camZ: number }) {
      scratchVec.set(x, y, z).applyMatrix4(group.matrixWorld);
      camSpaceVec.copy(scratchVec).applyMatrix4(camera.matrixWorldInverse);
      scratchVec.project(camera);
      target.x = (scratchVec.x * 0.5 + 0.5) * canvas.clientWidth;
      target.y = (-scratchVec.y * 0.5 + 0.5) * canvas.clientHeight;
      target.camZ = camSpaceVec.z;
    }

    // Rough monospace glyph-width estimate (JetBrains Mono) — cheap enough to
    // compute every frame without the layout-thrash cost of getBoundingClientRect
    // on every label. Only needs to be good enough for collision *culling*, not
    // pixel-perfect.
    function estimateLabelBox(text: string, fontSize: number) {
      return { w: text.length * fontSize * 0.62, h: fontSize + 3 };
    }
    interface PlacedBox { x: number; y: number; w: number; h: number }
    function overlaps(a: PlacedBox, b: PlacedBox, pad: number) {
      return Math.abs(a.x - b.x) * 2 < a.w + b.w + pad * 2
        && Math.abs(a.y - b.y) * 2 < a.h + b.h + pad * 2;
    }
    // Reused across frames to avoid an allocation per call.
    const placedBoxes: PlacedBox[] = [];
    const leafOrder: number[] = [];

    function updateLabels() {
      centerCamSpace.set(0, 0, 0).applyMatrix4(group.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
      const centerZ = centerCamSpace.z;
      placedBoxes.length = 0;

      // Hubs (only ~6, the topic taxonomy) always win the collision contest —
      // they're the structural anchors of the graph, so leaves yield to them,
      // never the other way round.
      for (let i = 0; i < hubCount; i++) {
        projectToScreen(hubPosAttr.array[i * 3], hubPosAttr.array[i * 3 + 1], hubPosAttr.array[i * 3 + 2], screenPos);
        const el = hubLabelEls[i];
        el.style.left = screenPos.x + 'px';
        el.style.top = screenPos.y + 'px';
        const visible = screenPos.camZ >= centerZ;
        el.classList.toggle('is-visible', visible);
        if (visible) {
          const box = estimateLabelBox(el.textContent || '', 13);
          placedBoxes.push({ x: screenPos.x, y: screenPos.y, w: box.w, h: box.h });
        }
      }

      // Leaves: project all of them first, then place nearest-to-camera first
      // (front labels win) with simple AABB collision culling against
      // everything already placed. A label that would overlap an already-
      // shown one fades out instead of rendering garbled text on top of it —
      // as the graph slowly rotates, different leaves cycle into view.
      leafOrder.length = 0;
      for (let i = 0; i < leafCount; i++) leafOrder.push(i);
      const leafScreens: { x: number; y: number; camZ: number; visible: boolean }[] = [];
      for (let i = 0; i < leafCount; i++) {
        projectToScreen(leafPosAttr.array[i * 3], leafPosAttr.array[i * 3 + 1], leafPosAttr.array[i * 3 + 2], screenPos);
        leafScreens.push({ x: screenPos.x, y: screenPos.y, camZ: screenPos.camZ, visible: screenPos.camZ >= centerZ });
      }
      leafOrder.sort(function (a, b) { return leafScreens[b].camZ - leafScreens[a].camZ; });

      const LEAF_PAD = 3;
      for (let k = 0; k < leafOrder.length; k++) {
        const i = leafOrder[k];
        const el = leafLabelEls[i];
        const s = leafScreens[i];
        el.style.left = s.x + 'px';
        el.style.top = s.y + 'px';
        if (!s.visible) { el.classList.remove('is-visible'); continue; }
        const box = estimateLabelBox(el.textContent || '', 11);
        const candidate = { x: s.x, y: s.y, w: box.w, h: box.h };
        let collides = false;
        for (let j = 0; j < placedBoxes.length; j++) {
          if (overlaps(candidate, placedBoxes[j], LEAF_PAD)) { collides = true; break; }
        }
        el.classList.toggle('is-visible', !collides);
        if (!collides) placedBoxes.push(candidate);
      }
    }

    function hideAllLabels() {
      hubLabelEls.concat(leafLabelEls).forEach(function (el) { el.classList.remove('is-visible'); });
    }

    const CAM_Z_EXPANDED = isMobile ? 14 : 11; // tune visually if graph edges clip off-screen
    const TWEEN_DUR = 0.7;
    const backdropEl = document.getElementById('heroGraphBackdrop')!;
    const backBtn = document.getElementById('heroGraphBack')!;

    let mode = 'collapsed'; // 'collapsed' | 'expanding' | 'expanded' | 'collapsing'
    let tweenT = 0;
    let orbitBaseRotY = 0;

    function expand() {
      if (mode !== 'collapsed') return;
      mode = 'expanding';
      tweenT = 0;
      canvas.classList.add('hero-graph--expanded');
      canvas.parentElement!.classList.add('hero-graph--expanded');
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

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mode === 'expanded') collapse();
    });

    // Zoom (camera dolly), matching PlanOut's own canvas — clamped so the
    // explorer can't be scrolled inside-out or off into the distance.
    // Scoped to expanded mode only: while collapsed this canvas is a
    // full-page ambient background sitting in normal page flow, so a wheel
    // event there has to stay a page scroll, not get hijacked into a zoom.
    const CAM_Z_MIN = CAM_Z_EXPANDED * 0.55;
    const CAM_Z_MAX = CAM_Z_EXPANDED * 1.7;
    canvas.addEventListener(
      'wheel',
      function (e) {
        if (mode !== 'expanded') return;
        e.preventDefault();
        camera.position.z = Math.min(CAM_Z_MAX, Math.max(CAM_Z_MIN, camera.position.z + e.deltaY * 0.01));
      },
      { passive: false },
    );

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

    function updateExpandTween(dt: number) {
      tweenT = Math.min(tweenT + dt / TWEEN_DUR, 1);
      const e = easeInOutCubic(tweenT);
      if (mode === 'expanding') {
        camera.position.z = CAM_Z_HERO + (CAM_Z_EXPANDED - CAM_Z_HERO) * e;
        group.position.x += (0 - group.position.x) * 0.15;
        group.position.y += (0 - group.position.y) * 0.15;
        if (tweenT >= 1) {
          mode = 'expanded';
          backBtn.classList.add('visible');
          backBtn.focus();
        }
      } else if (mode === 'collapsing') {
        camera.position.z = CAM_Z_EXPANDED + (CAM_Z_HERO - CAM_Z_EXPANDED) * e;
        if (tweenT >= 1) {
          mode = 'collapsed';
          canvas.classList.remove('hero-graph--expanded');
          canvas.parentElement!.classList.remove('hero-graph--expanded');
          backdropEl.classList.remove('active');
          document.body.classList.remove('no-scroll');
        }
      }
    }

    frameUpdate = function (dt, t) {
      canvas.style.pointerEvents = (mode === 'expanded' || mode === 'expanding' || mode === 'collapsing' || scrollY < window.innerHeight * 0.9) ? 'auto' : 'none';
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
}
