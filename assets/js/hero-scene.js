// ─────────────────────────────────────────────
//  Morphing Organic Blob — Three.js
//  Abstract wireframe icosahedron with organic
//  vertex displacement, vertex particles, and
//  ambient floating particles. Rose/violet.
// ─────────────────────────────────────────────

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';

(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const isMobile = window.innerWidth < 768;
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Renderer ──
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !isMobile,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function getSize() {
    return {
      w: canvas.clientWidth || window.innerWidth,
      h: canvas.clientHeight || window.innerHeight,
    };
  }

  const sz = getSize();
  renderer.setSize(sz.w, sz.h, false);

  // ── Scene & Camera ──
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    isMobile ? 55 : 45, sz.w / sz.h, 0.1, 100
  );
  camera.position.z = isMobile ? 7 : 5.5;

  // ── Theme Colors ──
  function getThemeColors() {
    const dk = document.documentElement.getAttribute('data-theme') !== 'light';
    return {
      wire:       dk ? 0xf43f7a : 0xe11d64,
      point:      dk ? 0xa78bfa : 0x7c3aed,
      glow:       dk ? 0xf43f7a : 0xe11d64,
      wireAlpha:  dk ? 0.15 : 0.18,
      pointAlpha: dk ? 0.50 : 0.55,
      pointSz:    dk ? 2.5  : 2.2,
      ambAlpha:   dk ? 0.18 : 0.22,
      glowAlpha:  dk ? 0.03 : 0.04,
      blending:   dk ? THREE.AdditiveBlending : THREE.NormalBlending,
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

  // ── Morphing Blob ──
  const detail = isMobile ? 2 : 4;
  const radius = isMobile ? 2.0 : 2.5;
  const geometry = new THREE.IcosahedronGeometry(radius, detail);
  const origPos = new Float32Array(geometry.attributes.position.array);

  // Precompute vertex normals once — avoids Math.sqrt in the animation loop
  const vertCount = geometry.attributes.position.count;
  const origNormals = new Float32Array(vertCount * 3);
  for (let i = 0; i < vertCount; i++) {
    const ix = i * 3;
    const ox = origPos[ix], oy = origPos[ix + 1], oz = origPos[ix + 2];
    const invLen = 1 / Math.sqrt(ox * ox + oy * oy + oz * oz);
    origNormals[ix]     = ox * invLen;
    origNormals[ix + 1] = oy * invLen;
    origNormals[ix + 2] = oz * invLen;
  }

  // Wireframe
  const wireMat = new THREE.MeshBasicMaterial({
    color: tc.wire,
    wireframe: true,
    transparent: true,
    opacity: tc.wireAlpha,
  });
  group.add(new THREE.Mesh(geometry, wireMat));

  // Vertex points
  const ptsMat = new THREE.PointsMaterial({
    color: tc.point,
    size: tc.pointSz,
    transparent: true,
    opacity: tc.pointAlpha,
    blending: tc.blending,
    depthWrite: false,
    sizeAttenuation: false,
  });
  group.add(new THREE.Points(geometry, ptsMat));

  // Soft backface glow
  const glowGeo = new THREE.SphereGeometry(radius * 1.15, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: tc.glow,
    transparent: true,
    opacity: tc.glowAlpha,
    side: THREE.BackSide,
  });
  const glowMesh = new THREE.Mesh(glowGeo, glowMat);
  group.add(glowMesh);

  // ── Ambient Particles ──
  const ambCount = isMobile ? 60 : 160;
  const ambGeo = new THREE.BufferGeometry();
  const ambArr = new Float32Array(ambCount * 3);
  const spread = radius * 3;

  for (let i = 0; i < ambCount; i++) {
    ambArr[i * 3]     = (Math.random() - 0.5) * spread * 2;
    ambArr[i * 3 + 1] = (Math.random() - 0.5) * spread * 2;
    ambArr[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  ambGeo.setAttribute('position', new THREE.BufferAttribute(ambArr, 3));

  const ambMat = new THREE.PointsMaterial({
    color: tc.wire,
    size: 1.5,
    transparent: true,
    opacity: tc.ambAlpha,
    blending: tc.blending,
    depthWrite: false,
    sizeAttenuation: false,
  });
  group.add(new THREE.Points(ambGeo, ambMat));

  // Particle animation data
  const pData = [];
  for (let i = 0; i < ambCount; i++) {
    pData.push({
      spd: 0.1 + Math.random() * 0.3,
      ph:  Math.random() * Math.PI * 2,
      amp: 0.3 + Math.random() * 0.8,
      bx:  ambArr[i * 3],
      by:  ambArr[i * 3 + 1],
      bz:  ambArr[i * 3 + 2],
    });
  }

  // ── Displacement (layered sine waves ≈ organic noise) ──
  function displace(x, y, z, t) {
    let d  = Math.sin(x * 1.2 + t * 0.6) * Math.cos(y * 1.3 + t * 0.4) * 0.35;
    d += Math.sin(y * 2.0 + t * 0.5 + 1.0) * Math.sin(z * 1.8 + t * 0.7) * 0.2;
    d += Math.cos(z * 3.0 + x * 2.5 + t * 0.9) * 0.1;
    d += Math.sin(t * 0.3) * 0.08;
    return d;
  }

  // ── Mouse Interaction (drag to move, springs back) ──
  let isDragging = false;
  let dragOffX = 0, dragOffY = 0;
  let dragStartX = 0, dragStartY = 0;
  let dragBaseX = 0, dragBaseY = 0;

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragBaseX = dragOffX;
    dragBaseY = dragOffY;
    canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      dragOffX = dragBaseX + (e.clientX - dragStartX) * 0.012;
      dragOffY = dragBaseY + (e.clientY - dragStartY) * -0.012;
    }
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = '';
  });

  // Touch support
  canvas.addEventListener('touchstart', (e) => {
    isDragging = true;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    dragBaseX = dragOffX;
    dragBaseY = dragOffY;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (isDragging) {
      dragOffX = dragBaseX + (e.touches[0].clientX - dragStartX) * 0.012;
      dragOffY = dragBaseY + (e.touches[0].clientY - dragStartY) * -0.012;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => { isDragging = false; });

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.pageYOffset; }, { passive: true });

  // ── Animation ──
  const clock = new THREE.Clock();
  let time = 0;
  let entrance = isReduced ? 1 : 0;
  const entrDur = 2.5;

  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    time += dt;

    // Entrance scale
    if (entrance < 1) {
      entrance = Math.min(entrance + dt / entrDur, 1);
      group.scale.setScalar(easeOutQuart(entrance));
    }

    // Vertex displacement (normals precomputed — no sqrt here)
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      const ox = origPos[ix], oy = origPos[ix + 1], oz = origPos[ix + 2];
      const d = displace(ox, oy, oz, time);
      pos.array[ix]     = ox + origNormals[ix]     * d;
      pos.array[ix + 1] = oy + origNormals[ix + 1] * d;
      pos.array[ix + 2] = oz + origNormals[ix + 2] * d;
    }
    pos.needsUpdate = true;

    // Glow breathing
    glowMesh.scale.setScalar(1.15 + Math.sin(time * 0.3) * 0.05);

    // Rotation — gentle auto-rotation
    group.rotation.y += 0.002;
    group.rotation.x  = Math.sin(time * 0.25) * 0.04;
    group.rotation.z  = Math.cos(time * 0.18) * 0.02;

    // Scroll-driven zig-zag: maps full page scroll to one complete cycle
    // cos(0)=1 → starts right; cos(π)=-1 → reaches left; cos(2π)=1 → back right
    const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    const scrollProgress = scrollY / maxScroll;
    const zigAmp = isMobile ? 2.0 : 4.5;
    const scrollX = Math.cos(scrollProgress * Math.PI * 2) * zigAmp;
    const scrollOffY = -(scrollProgress) * 1.2;

    // Position: full-screen zig-zag + drag offset
    const targetX = dragOffX + scrollX;
    const targetY = baseY + dragOffY + scrollOffY;

    if (isDragging) {
      group.position.x += (targetX - group.position.x) * 0.12;
      group.position.y += (targetY - group.position.y) * 0.12;
    } else {
      // Spring back when not dragging
      dragOffX *= 0.97;
      dragOffY *= 0.97;
      if (Math.abs(dragOffX) < 0.001) dragOffX = 0;
      if (Math.abs(dragOffY) < 0.001) dragOffY = 0;
      group.position.x += (targetX - group.position.x) * 0.06;
      group.position.y += (targetY - group.position.y) * 0.06;
    }

    // Ambient particles
    const aPos = ambGeo.attributes.position;
    for (let i = 0; i < ambCount; i++) {
      const p = pData[i], ix = i * 3;
      aPos.array[ix]     = p.bx + Math.sin(time * p.spd + p.ph) * p.amp;
      aPos.array[ix + 1] = p.by + Math.cos(time * p.spd * 0.7 + p.ph) * p.amp;
      aPos.array[ix + 2] = p.bz + Math.sin(time * p.spd * 0.5 + p.ph) * p.amp * 0.5;
    }
    aPos.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate();

  // ── Resize ──
  window.addEventListener('resize', () => {
    const s = getSize();
    if (s.w === 0 || s.h === 0) return;
    camera.aspect = s.w / s.h;
    camera.updateProjectionMatrix();
    renderer.setSize(s.w, s.h, false);
  });

  // ── Theme Observer ──
  function updateTheme() {
    tc = getThemeColors();
    wireMat.color.setHex(tc.wire);    wireMat.opacity = tc.wireAlpha;
    ptsMat.color.setHex(tc.point);   ptsMat.opacity  = tc.pointAlpha; ptsMat.size = tc.pointSz;
    glowMat.color.setHex(tc.glow);   glowMat.opacity = tc.glowAlpha;
    ambMat.color.setHex(tc.wire);    ambMat.opacity  = tc.ambAlpha;
  }

  new MutationObserver(updateTheme).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme'],
  });
})();
