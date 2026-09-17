import type { MindmapData } from './mindmap';

// @ts-expect-error Three.js is loaded from the same CDN as the site's other scene.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';

type OrbNode = { title: string; previewTitle: string; description?: string; href?: string; position: any; kind: 'root' | 'hub' | 'leaf' };

const LATIN_HUBS = [
  'Scientia Machinarum', 'Scientia Vitae', 'Ratio Pecuniae',
  'Oeconomia Rerum', 'Ars Instrumentorum', 'Scientia Mentis',
];
const LATIN_LEAVES = [
  'Nexus Latens', 'Forma Occulta', 'Ratio Incerta', 'Ordo Variabilis',
  'Signum Obscurum', 'Corpus Multiplex', 'Motus Perpetuus', 'Scientia Profunda',
  'Memoria Longa', 'Via Nova', 'Series Infinita', 'Figura Arcana',
  'Nexus Arcanus', 'Forma Nova', 'Ratio Certa', 'Ordo Novus',
  'Signum Latens', 'Corpus Novum', 'Motus Varius', 'Scientia Nova',
  'Memoria Occulta', 'Via Longa', 'Series Occulta', 'Figura Nova',
  'Nexus Multiplex', 'Forma Variabilis', 'Ratio Profunda', 'Ordo Arcanus',
  'Signum Novum', 'Corpus Latens', 'Motus Incertus', 'Via Obscura',
];

export function initHeroMindmapOrb(canvas: HTMLCanvasElement, data: MindmapData): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.innerWidth < 768;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !mobile, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(mobile ? 55 : 45, 1, 0.1, 100);
  camera.position.z = 7;
  const orb = new THREE.Group();
  const baseScale = mobile ? 0.48 : 0.7;
  orb.position.x = mobile ? 2.2 : 2.55;
  orb.scale.setScalar(reduced ? baseScale : 0.01);
  scene.add(orb);

  const nodes: OrbNode[] = [{ title: data.center, previewTitle: 'Nexus Rerum', description: data.centerDescription, position: new THREE.Vector3(), kind: 'root' }];
  const edges: Array<[number, number]> = [];
  const hrefIndex = new Map<string, number>();
  const branches = data.branches.filter((branch) => branch.nodes.length > 0);
  let leafSerial = 0;
  const golden = Math.PI * (3 - Math.sqrt(5));
  branches.forEach((branch, branchIndex) => {
    const y = 1 - (branchIndex + 0.5) * 2 / branches.length;
    const ring = Math.sqrt(1 - y * y);
    const theta = branchIndex * golden;
    const direction = new THREE.Vector3(Math.cos(theta) * ring, y, Math.sin(theta) * ring);
    const hubIndex = nodes.length;
    const hubPos = direction.clone().multiplyScalar(1.18);
    nodes.push({ title: branch.label, previewTitle: LATIN_HUBS[branchIndex % LATIN_HUBS.length], description: branch.description, position: hubPos, kind: 'hub' });
    edges.push([0, hubIndex]);
    const tangent = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
    if (tangent.lengthSq() < 0.01) tangent.set(1, 0, 0);
    const bitangent = new THREE.Vector3().crossVectors(direction, tangent).normalize();
    branch.nodes.forEach((leaf, leafIndex) => {
      const angle = leafIndex * golden;
      const spread = Math.sqrt((leafIndex + 0.5) / branch.nodes.length) * 0.85;
      const leafPos = direction.clone().multiplyScalar(2.02)
        .addScaledVector(tangent, Math.cos(angle) * spread)
        .addScaledVector(bitangent, Math.sin(angle) * spread);
      const index = nodes.length;
      nodes.push({ title: leaf.title, previewTitle: LATIN_LEAVES[leafSerial++ % LATIN_LEAVES.length], description: leaf.description, href: leaf.href, position: leafPos, kind: 'leaf' });
      if (leaf.href) hrefIndex.set(leaf.href, index);
      edges.push([hubIndex, index]);
    });
  });

  // Keep the same cross references that connect highlighted phrases in the
  // full canvas. Duplicate links in prose only create one visible edge.
  const seen = new Set(edges.map(([a, b]) => `${a}:${b}`));
  nodes.forEach((node, from) => {
    for (const match of (node.description ?? '').matchAll(/<inode\s+id="([^"]+)">/g)) {
      const to = hrefIndex.get(match[1]);
      if (to === undefined || to === from) continue;
      const key = `${Math.min(from, to)}:${Math.max(from, to)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([from, to]);
    }
  });

  const linePositions = new Float32Array(edges.length * 6);
  edges.forEach(([a, b], i) => {
    nodes[a].position.toArray(linePositions, i * 6);
    nodes[b].position.toArray(linePositions, i * 6 + 3);
  });
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.1, depthWrite: false });
  orb.add(new THREE.LineSegments(lineGeometry, lineMaterial));

  const shellMaterial = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.055, depthWrite: false });
  orb.add(new THREE.Mesh(new THREE.IcosahedronGeometry(2.9, 2), shellMaterial));
  const glowMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.02, side: THREE.BackSide, depthWrite: false });
  orb.add(new THREE.Mesh(new THREE.SphereGeometry(3.08, 24, 16), glowMaterial));

  const token = (name: string): string => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  function cardTexture(node: OrbNode): any {
    const surface = document.createElement('canvas');
    surface.width = 512;
    surface.height = node.kind === 'leaf' ? 112 : 132;
    const ctx = surface.getContext('2d')!;
    const accent = token('--accent');
    ctx.fillStyle = token('--paper-raised');
    ctx.strokeStyle = token('--border');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(3, 3, 506, surface.height - 6, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.fillRect(16, 16, 6, surface.height - 32);
    ctx.fillStyle = token('--ink');
    ctx.font = node.kind === 'leaf' ? '600 52px Caveat, cursive' : '600 60px Caveat, cursive';
    const max = node.kind === 'leaf' ? 20 : 18;
    const title = node.previewTitle.length > max ? `${node.previewTitle.slice(0, max - 1)}…` : node.previewTitle;
    ctx.fillText(title, 38, node.kind === 'leaf' ? 67 : 78, 445);
    const texture = new THREE.CanvasTexture(surface);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  const sprites = nodes.map((node) => {
    const material = new THREE.SpriteMaterial({ map: cardTexture(node), transparent: true, opacity: 0.28, depthWrite: false });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(node.position);
    const width = node.kind === 'root' ? 1.05 : node.kind === 'hub' ? 0.84 : 0.59;
    sprite.scale.set(width, width * (node.kind === 'leaf' ? 112 / 512 : 132 / 512), 1);
    orb.add(sprite);
    return sprite;
  });

  function applyTheme(): void {
    const accent = token('--accent');
    lineMaterial.color.set(accent);
    shellMaterial.color.set(accent);
    glowMaterial.color.set(accent);
    sprites.forEach((sprite, index) => {
      sprite.material.map.dispose();
      sprite.material.map = cardTexture(nodes[index]);
      sprite.material.needsUpdate = true;
    });
  }
  applyTheme();
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.fonts.load('600 60px Caveat').then(applyTheme).catch(() => {});

  let dragging = false;
  let moved = false;
  let downX = 0;
  let downY = 0;
  let dragOffX = 0;
  let dragOffY = 0;
  let startOffX = 0;
  let startOffY = 0;
  canvas.addEventListener('pointerdown', (event) => {
    if (window.scrollY > window.innerHeight * 0.9) return;
    dragging = true;
    moved = false;
    downX = event.clientX;
    downY = event.clientY;
    startOffX = dragOffX;
    startOffY = dragOffY;
  });
  window.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - downX;
    const dy = event.clientY - downY;
    if (Math.hypot(dx, dy) > 4) moved = true;
    if (!moved) return;
    dragOffX = startOffX + dx * 0.012;
    dragOffY = startOffY - dy * 0.012;
    canvas.style.cursor = 'grabbing';
  });
  window.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    canvas.style.cursor = '';
    if (!moved) document.dispatchEvent(new Event('hero-mindmap:open'));
  });

  function resize(): void {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  let entrance = reduced ? 1 : 0;
  function animate(): void {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    if (entrance < 1) {
      entrance = Math.min(1, entrance + dt / 2.5);
      orb.scale.setScalar(baseScale * (1 - Math.pow(1 - entrance, 4)));
    }
    if (!reduced) {
      orb.rotation.y += dt * 0.12;
      orb.rotation.x = Math.sin(clock.elapsedTime * 0.25) * 0.04;
      orb.rotation.z = Math.cos(clock.elapsedTime * 0.18) * 0.02;
    }
    const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    const progress = window.scrollY / maxScroll;
    const zigAmp = mobile ? 2 : 2.55;
    const targetX = dragOffX + (reduced ? (mobile ? 2.2 : 2.55) : Math.cos(progress * Math.PI * 2) * zigAmp);
    const targetY = dragOffY - (reduced ? 0 : progress * 1.2);
    orb.position.x += (targetX - orb.position.x) * (dragging ? 0.12 : 0.06);
    orb.position.y += (targetY - orb.position.y) * (dragging ? 0.12 : 0.06);
    if (!dragging) {
      dragOffX *= 0.97;
      dragOffY *= 0.97;
    }
    renderer.render(scene, camera);
    canvas.style.pointerEvents = window.scrollY < window.innerHeight * 0.9 ? 'auto' : 'none';
  }
  animate();
}
