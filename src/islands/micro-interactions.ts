// ─────────────────────────────────────────────
//  Micro-interactions — the site's "personality" layer.
//  Ported from assets/js/main-theme.js's initScrollToTop /
//  initScrollReveal / initHeroParallax / initResearchEnhancements /
//  card-ripple handlers, none of which survived the rebrand (confirmed
//  absent from src/ during live-preview QA). The custom bear cursor
//  (initCustomCursor) was ported here too but later removed per live-
//  preview QA feedback.
//  Selectors are updated to the rebrand's actual class names (the legacy
//  selectors targeted classes that no longer exist); colors use the
//  single --accent token instead of legacy's --accent-warm, matching the
//  simplification already applied throughout src/islands/.
//  Wired up site-wide via Layout.astro, one shared init per page load.
// ─────────────────────────────────────────────

function initGlassLight(): void {
  const glassEls = document.querySelectorAll<HTMLElement>(
    '.project-featured, .cards__card, .research-grid a, .project-grid > li, .research-hero__snapshot',
  );
  glassEls.forEach((el) => {
    el.style.position = el.style.position || 'relative';
    el.style.overflow = el.style.overflow || 'hidden';
    const light = document.createElement('div');
    light.className = 'glass-light';
    el.appendChild(light);

    el.addEventListener('mouseenter', () => { light.style.opacity = '1'; });
    el.addEventListener('mouseleave', () => { light.style.opacity = '0'; });
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const alpha1 = isDark ? 0.14 : 0.1;
      const alpha2 = isDark ? 0.04 : 0.03;
      light.style.background = `radial-gradient(350px circle at ${x}px ${y}px, color-mix(in srgb, var(--accent) ${alpha1 * 100}%, transparent) 0%, color-mix(in srgb, var(--accent) ${alpha2 * 100}%, transparent) 40%, transparent 70%)`;
    });
  });
}

function initScrollToTop(): void {
  const btn = document.createElement('button');
  btn.className = 'scroll-to-top';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Scroll to top');
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"></polyline></svg>';
  document.body.appendChild(btn);
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  window.addEventListener(
    'scroll',
    () => { btn.classList.toggle('visible', window.pageYOffset > 500); },
    { passive: true },
  );
}

function initReadingProgress(): void {
  const bar = document.createElement('div');
  bar.className = 'reading-progress';
  document.body.appendChild(bar);

  function update(): void {
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (documentHeight <= 0) { bar.style.width = '0%'; return; }
    const progress = (window.scrollY / documentHeight) * 100;
    bar.style.width = Math.min(progress, 100) + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initScrollReveal(): void {
  const reveals = document.querySelectorAll('[data-reveal]');
  const staggers = document.querySelectorAll('[data-stagger]');
  if (!reveals.length && !staggers.length) return;

  if (!('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('revealed'));
    staggers.forEach((el) => el.classList.add('revealed'));
    return;
  }

  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
  );
  reveals.forEach((el) => revealObs.observe(el));

  const staggerObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const children = entry.target.children;
          for (let i = 0; i < children.length; i++) {
            (children[i] as HTMLElement).style.transitionDelay = i * 0.05 + 's';
          }
          entry.target.classList.add('revealed');
          staggerObs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
  );
  staggers.forEach((el) => staggerObs.observe(el));
}

function initHeroParallax(): void {
  // `.hero__content` (not `.hero` itself, which is a full-bleed section
  // with extra padding) — see the CSS comment on `.hero__content` in
  // src/pages/index.astro for why the transform must stay scoped this
  // tightly around the actual text/buttons.
  const hero = document.querySelector<HTMLElement>('.hero__content');
  if (!hero) return;
  window.addEventListener(
    'scroll',
    () => {
      const scrollY = window.pageYOffset;
      const heroH = window.innerHeight;
      if (scrollY < heroH) {
        const p = scrollY / heroH;
        const opacity = Math.max(1 - p * 1.6, 0);
        hero.style.opacity = String(opacity);
        hero.style.transform = 'translateY(' + scrollY * 0.12 + 'px)';
      }
    },
    { passive: true },
  );
}

function initPaperHeroParallax(): void {
  const paperHero = document.querySelector<HTMLElement>('.research-hero');
  if (!paperHero) return;
  window.addEventListener(
    'scroll',
    () => {
      const scrolled = window.pageYOffset || document.documentElement.scrollTop;
      if (scrolled < window.innerHeight) {
        paperHero.style.transform = 'translate3d(0, ' + scrolled * 0.15 + 'px, 0)';
      }
    },
    { passive: true },
  );
}

function initReadingTimeBadge(): void {
  const contentEl = document.querySelector('.research-content');
  const metaTarget = document.querySelector('.research-tags-row');
  if (!contentEl || !metaTarget || document.querySelector('.reading-time')) return;
  const words = (contentEl.textContent || '').trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  const badge = document.createElement('div');
  badge.className = 'reading-time';
  badge.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
  const label = document.createElement('span');
  label.textContent = mins + ' min read';
  badge.appendChild(label);
  metaTarget.appendChild(badge);
}

function initCardRipple(): void {
  const cards = document.querySelectorAll<HTMLElement>(
    '.project-featured, .cards__card, .research-grid a, .project-grid > li, .mindmap-note',
  );
  cards.forEach((card) => {
    card.style.position = card.style.position || 'relative';
    card.style.overflow = card.style.overflow || 'hidden';
    card.addEventListener('click', (e) => {
      const rect = card.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'card-ripple';
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
      ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
      card.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
}

export function initMicroInteractions(): void {
  initGlassLight();
  initScrollToTop();
  initReadingProgress();
  initScrollReveal();
  initHeroParallax();
  initPaperHeroParallax();
  initReadingTimeBadge();
  initCardRipple();
}
