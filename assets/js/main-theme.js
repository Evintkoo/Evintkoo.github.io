// Anthropic-inspired theme JavaScript

// Apply theme immediately to prevent flash
(function() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  const html = document.documentElement;
  html.setAttribute('data-theme', savedTheme);
  if (savedTheme === 'light') {
    html.classList.add('light');
  }
})();

(function() {
  'use strict';

  // Mobile Navigation Toggle
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navOverlay = document.getElementById('nav-overlay');
  
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
      navToggle.classList.toggle('active');
      
      // Toggle overlay
      if (navOverlay) {
        navOverlay.classList.toggle('active');
      }
      
      // Prevent body scroll
      document.body.classList.toggle('no-scroll');
    });
    
    // Close menu when clicking overlay
    if (navOverlay) {
      navOverlay.addEventListener('click', function(e) {
        e.stopPropagation();
        closeMenu();
      });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
        closeMenu();
      }
    });
    
    // Close menu when clicking nav links
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });
    
    function closeMenu() {
      navMenu.classList.remove('active');
      navToggle.classList.remove('active');
      if (navOverlay) {
        navOverlay.classList.remove('active');
      }
      document.body.classList.remove('no-scroll');
    }
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const navEl = document.querySelector('.nav');
          const navHeight = navEl ? navEl.offsetHeight : 0;
          const targetPosition = target.offsetTop - navHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // Dark Mode Toggle — animated sun ↔ moon
  const themeToggle  = document.getElementById('themeToggle');
  const themeStage   = document.getElementById('themeIconStage');
  const sunIcon      = document.getElementById('themeIconSun');
  const moonIcon     = document.getElementById('themeIconMoon');
  const html         = document.documentElement;

  // Check for saved theme preference or default to 'dark'
  const currentTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', currentTheme);

  // Backwards compatibility class
  if (currentTheme === 'light') {
    html.classList.add('light');
  } else {
    html.classList.remove('light');
  }

  // Set initial state with no animation
  setIconState(currentTheme, false);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const theme    = html.getAttribute('data-theme');
      const newTheme = theme === 'light' ? 'dark' : 'light';

      html.setAttribute('data-theme', newTheme);

      if (newTheme === 'light') {
        html.classList.add('light');
      } else {
        html.classList.remove('light');
      }

      localStorage.setItem('theme', newTheme);
      setIconState(newTheme, true);
    });
  }

  /**
   * Show the correct icon, optionally animating the transition.
   * @param {string}  theme    'dark' | 'light'
   * @param {boolean} animate  false on first load
   */
  function setIconState(theme, animate) {
    if (!sunIcon || !moonIcon) return;

    if (!animate) {
      // Instant — just show/hide without classes
      if (theme === 'dark') {
        sunIcon.classList.add('theme-icon--hidden');
        moonIcon.classList.remove('theme-icon--hidden');
      } else {
        moonIcon.classList.add('theme-icon--hidden');
        sunIcon.classList.remove('theme-icon--hidden');
      }
      return;
    }

    // Stage squish — satisfying click feedback
    if (themeStage) {
      themeStage.classList.remove('squishing');
      void themeStage.offsetWidth; // force reflow so animation restarts
      themeStage.classList.add('squishing');
      themeStage.addEventListener('animationend', function onSquish() {
        themeStage.classList.remove('squishing');
        themeStage.removeEventListener('animationend', onSquish);
      });
    }

    if (theme === 'dark') {
      // Sun exits — dizzy wobble-and-spiral
      animateOut(sunIcon, function () {
        sunIcon.classList.add('theme-icon--hidden');
      });
      // Moon enters — graceful arc
      moonIcon.classList.remove('theme-icon--hidden', 'theme-icon--exiting');
      animateIn(moonIcon);

    } else {
      // Moon exits — startled, swoops away
      animateOut(moonIcon, function () {
        moonIcon.classList.add('theme-icon--hidden');
      });
      // Sun enters — triumphant spring bounce
      sunIcon.classList.remove('theme-icon--hidden', 'theme-icon--exiting');
      animateIn(sunIcon);
    }
  }

  /** Trigger the CSS entering animation on an icon element. */
  function animateIn(el) {
    el.classList.remove('theme-icon--entering', 'theme-icon--exiting');
    void el.offsetWidth;
    el.classList.add('theme-icon--entering');
    el.addEventListener('animationend', function onIn() {
      el.classList.remove('theme-icon--entering');
      el.removeEventListener('animationend', onIn);
    });
  }

  /** Trigger the CSS exiting animation, then call done(). */
  function animateOut(el, done) {
    el.classList.remove('theme-icon--entering', 'theme-icon--exiting');
    void el.offsetWidth;
    el.classList.add('theme-icon--exiting');
    el.addEventListener('animationend', function onOut() {
      el.classList.remove('theme-icon--exiting');
      el.removeEventListener('animationend', onOut);
      done();
    });
  }
  

  // Shared scroll dispatcher — one rAF-throttled listener for all handlers
  const _scrollCbs = [];
  let _scrollTick = false;
  window.addEventListener('scroll', function() {
    if (!_scrollTick) {
      requestAnimationFrame(function() {
        _scrollCbs.forEach(function(fn) { fn(); });
        _scrollTick = false;
      });
      _scrollTick = true;
    }
  }, { passive: true });

  // Navbar background on scroll
  const nav = document.querySelector('.nav');

  function updateNavOnScroll() {
    if (!nav) return;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > 50) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  }

  _scrollCbs.push(updateNavOnScroll);

  // Intersection Observer for fade-in animations - optimized
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        requestAnimationFrame(() => {
          entry.target.classList.add('fade-in-up');
          entry.target.classList.add('visible');
        });
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe cards and sections - only if they exist
  const animatedElements = document.querySelectorAll('.card, .research-card, .timeline__item, .method-card, .abstract-item');
  if (animatedElements.length > 0) {
    animatedElements.forEach(el => {
      observer.observe(el);
    });
  }

  // External link icons
  document.querySelectorAll('a[target="_blank"]').forEach(link => {
    if (!link.querySelector('svg')) {
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });

  // Preload images - optimized lazy loading
  const images = document.querySelectorAll('img[data-src]');
  if (images.length > 0) {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            obs.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px'
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      images.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  }

  // Research Page Functionality
  function initResearchFeatures() {
    const rsb = document.getElementById('rsb');
    const sections = document.querySelectorAll('.research-section');

    // Only run on research pages
    if (!rsb && sections.length === 0) return;

    // ── Pull-tab drawer (mobile) ──
    const rsbTab = document.getElementById('rsbTab');
    const rsbOverlay = document.getElementById('rsbOverlay');

    function openDrawer() {
      if (rsb) rsb.classList.add('open');
      if (rsbOverlay) rsbOverlay.classList.add('visible');
      if (rsbTab) rsbTab.setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
      if (rsb) rsb.classList.remove('open');
      if (rsbOverlay) rsbOverlay.classList.remove('visible');
      if (rsbTab) rsbTab.setAttribute('aria-expanded', 'false');
    }

    if (rsbTab) {
      rsbTab.addEventListener('click', () => {
        if (rsb) rsb.classList.contains('open') ? closeDrawer() : openDrawer();
      });
    }

    if (rsbOverlay) {
      rsbOverlay.addEventListener('click', closeDrawer);
    }

    // Close drawer with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && rsb?.classList.contains('open')) closeDrawer();
    });

    // Close drawer when tapping a section link (mobile only)
    const rsbLinks = rsb ? Array.from(rsb.querySelectorAll('.rsb__link')) : [];
    rsbLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 1200) closeDrawer();
      });
    });

    // ── Reading Progress Bar ──
    let progressBar = document.querySelector('.reading-progress');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'reading-progress';
      document.body.appendChild(progressBar);
    }

    const updateProgress = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (documentHeight <= 0) return;
      const progress = (window.scrollY / documentHeight) * 100;
      progressBar.style.width = `${Math.min(progress, 100)}%`;
    };

    _scrollCbs.push(updateProgress);
    updateProgress();

    // ── Section tracking (active / visited) ──
    const visitedSections = new Set();
    const sectionIds = Array.from(sections).map(s => s.id).filter(Boolean);

    if ('IntersectionObserver' in window && sections.length > 0 && rsbLinks.length > 0) {
      // Track every section currently visible in the active zone.
      // The "active" section is always the first one in document order that is
      // visible — this correctly handles both tall sections and scroll-up.
      const visibleSections = new Set();

      const applyActive = () => {
        // First section in document order that is currently intersecting
        let activeId = null;
        for (const id of sectionIds) {
          if (visibleSections.has(id)) { activeId = id; break; }
        }
        if (!activeId) return;

        visitedSections.add(activeId);
        const activeIdx = sectionIds.indexOf(activeId);
        sectionIds.forEach((id, i) => {
          if (i < activeIdx) visitedSections.add(id);
        });

        rsbLinks.forEach(link => {
          const linkId = (link.getAttribute('href') || '').replace('#', '');
          const isActive = linkId === activeId;
          link.classList.toggle('active', isActive);
          link.classList.toggle('visited', !isActive && visitedSections.has(linkId));
          if (isActive) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            visibleSections.add(entry.target.id);
          } else {
            visibleSections.delete(entry.target.id);
          }
        });
        applyActive();
      }, {
        threshold: 0,
        // Active zone: below the nav (~80 px) down to 60% from the bottom.
        // A section stays active for the full time its heading is in the
        // upper 40 % of the viewport — even if it's very tall.
        rootMargin: '-80px 0px -60% 0px',
      });

      sections.forEach(s => { if (s.id) observer.observe(s); });
    }
  }

  // Scroll to Top Button
  function initScrollToTop() {
    let scrollBtn = document.querySelector('.scroll-to-top');
    if (!scrollBtn) {
      scrollBtn = document.createElement('button');
      scrollBtn.className = 'scroll-to-top';
      scrollBtn.setAttribute('aria-label', 'Scroll to top');
      scrollBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      `;
      document.body.appendChild(scrollBtn);
      
      scrollBtn.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }

    _scrollCbs.push(() => {
      scrollBtn.classList.toggle('visible', window.pageYOffset > 500);
    });
  }

  // ── Category Filter Dropdown (multi-select) ──
  function initCategoryFilter() {
    const toggle = document.getElementById('filterToggle');
    const menu = document.getElementById('filterMenu');
    const carousel = document.querySelector('.project-carousel');
    const filterLabel = document.getElementById('filterLabel');
    if (!toggle || !menu || !carousel || !filterLabel) return;

    const items = menu.querySelectorAll('.filter-dropdown__item');
    const cards = carousel.querySelectorAll('.project-card');
    let selected = new Set(); // empty = show all

    function updateLabel() {
      if (selected.size === 0) {
        filterLabel.textContent = '';
      } else {
        filterLabel.textContent = Array.from(selected).join(', ');
      }
    }

    function applyFilter() {
      cards.forEach((card) => {
        if (selected.size === 0 || selected.has(card.dataset.category)) {
          card.classList.remove('filter-hidden');
        } else {
          card.classList.add('filter-hidden');
        }
      });
      carousel.scrollLeft = 0;
      carousel.dispatchEvent(new Event('scroll'));
    }

    // Toggle dropdown
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });

    // Close on outside click
    document.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });

    menu.addEventListener('click', (e) => e.stopPropagation());

    // Item selection
    items.forEach((item) => {
      item.addEventListener('click', () => {
        const filter = item.dataset.filter;

        if (filter === 'all') {
          // Clear all selections
          selected.clear();
          items.forEach((i) => { i.classList.remove('active'); i.setAttribute('aria-selected', 'false'); });
        } else {
          // Toggle this category
          if (selected.has(filter)) {
            selected.delete(filter);
            item.classList.remove('active');
            item.setAttribute('aria-selected', 'false');
          } else {
            selected.add(filter);
            item.classList.add('active');
            item.setAttribute('aria-selected', 'true');
          }
        }

        updateLabel();
        applyFilter();
      });
    });

    updateLabel();
  }

  // Project Carousel (CSS scroll-snap + drag support)
  function initProjectCarousel() {
    const carousel = document.querySelector('.project-carousel');
    const prevBtn = document.querySelector('.carousel-btn--prev');
    const nextBtn = document.querySelector('.carousel-btn--next');

    if (!carousel || !prevBtn || !nextBtn) return;

    function getScrollAmount() {
      const card = carousel.querySelector('.project-card');
      if (!card) return 300;
      const gap = parseFloat(getComputedStyle(carousel).gap) || 24;
      return card.offsetWidth + gap;
    }

    // Button navigation
    prevBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      carousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
    });

    // Update button disabled state
    function updateButtons() {
      const { scrollLeft, scrollWidth, clientWidth } = carousel;
      prevBtn.disabled = scrollLeft <= 2;
      nextBtn.disabled = scrollLeft >= scrollWidth - clientWidth - 2;
    }

    carousel.addEventListener('scroll', updateButtons, { passive: true });
    updateButtons();

    // Drag to scroll (desktop)
    let isDown = false, startX = 0, scrollStart = 0;

    carousel.addEventListener('mousedown', (e) => {
      if (e.target.closest('a, button')) return;
      isDown = true;
      startX = e.pageX;
      scrollStart = carousel.scrollLeft;
      carousel.style.scrollSnapType = 'none';
    });

    window.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      carousel.style.scrollSnapType = '';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const dx = e.pageX - startX;
      carousel.scrollLeft = scrollStart - dx;
    });
  }

  // ── Scroll Reveal System ──
  // Triggers [data-reveal] and [data-stagger] as they enter viewport
  function initScrollReveal() {
    var reveals = document.querySelectorAll('[data-reveal]');
    var staggers = document.querySelectorAll('[data-stagger]');

    if (!('IntersectionObserver' in window)) {
      // Fallback: show everything
      reveals.forEach(function(el) { el.classList.add('revealed'); });
      staggers.forEach(function(el) { el.classList.add('revealed'); });
      return;
    }

    var revealObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    reveals.forEach(function(el) { revealObs.observe(el); });

    var staggerObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          // Set staggered delays on children
          var children = entry.target.children;
          for (var i = 0; i < children.length; i++) {
            children[i].style.transitionDelay = (i * 0.09) + 's';
          }
          entry.target.classList.add('revealed');
          staggerObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    staggers.forEach(function(el) { staggerObs.observe(el); });
  }

  // ── Card 3D Tilt — disabled for carousel (use CSS hover instead) ──
  function initCardTilt() {
    // Tilt removed — carousel cards use CSS-only hover effects
  }

  // ── Hero Parallax on Scroll ──
  // Scroll hint click — jump to first section below hero
  var scrollHintBtn = document.getElementById('scrollHint');
  if (scrollHintBtn) {
    scrollHintBtn.addEventListener('click', function() {
      var target = document.getElementById('projects');
      if (target) {
        var navHeight = document.querySelector('.nav')?.offsetHeight || 0;
        window.scrollTo({ top: target.offsetTop - navHeight, behavior: 'smooth' });
      }
    });
  }

  // Content fades/lifts as user scrolls past hero — smooth exit
  function initHeroParallax() {
    var content = document.querySelector('.hero__content');
    var scrollHint = document.querySelector('.hero__scroll-hint');
    if (!content) return;

    _scrollCbs.push(function() {
      var scrollY = window.pageYOffset;
      var heroH = window.innerHeight;
      if (scrollY < heroH) {
        var p = scrollY / heroH;
        var opacity = Math.max(1 - p * 1.6, 0);
        content.style.opacity = opacity;
        content.style.pointerEvents = opacity < 0.05 ? 'none' : '';
        content.style.transform = 'translateY(' + (scrollY * 0.12) + 'px)';
        if (scrollHint) {
          scrollHint.style.opacity = Math.max(1 - p * 4, 0);
        }
      }
    });
  }

  // Initialize new features
  initResearchFeatures();
  initScrollToTop();
  initCategoryFilter();
  initProjectCarousel();
  initScrollReveal();
  initCardTilt();
  initHeroParallax();

  // ── Custom Cursor ──
  (function initCustomCursor() {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring) return;
    // Skip on touch devices
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;

    let cx = -100, cy = -100; // cursor position
    let rx = -100, ry = -100; // ring position (trails)
    let prevRx = -100, prevRy = -100; // previous ring pos for velocity

    // Direction & tilt state
    let flipDir = 1;   // 1 = right, -1 = left
    let tiltAngle = 0; // smoothed tilt (deg)

    // Idle & wobble state
    let idleFrames = 0;
    let doingWobble = false;
    let wobbleT = 0;

    // Click squish state
    let clickSX = 1, clickSY = 1;
    let targetSX = 1, targetSY = 1;

    document.addEventListener('mousemove', (e) => {
      cx = e.clientX;
      cy = e.clientY;
      dot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    });

    document.addEventListener('mousedown', () => {
      targetSX = 1.35; targetSY = 0.65;                        // squish down
      setTimeout(() => { targetSX = 1.12; targetSY = 0.92; }, 130); // overshoot
      setTimeout(() => { targetSX = 1;    targetSY = 1;    }, 300); // settle
    });

    // Smooth ring follow with bear personality
    function followRing() {
      const dx = cx - rx;
      const dy = cy - ry;
      const dist = Math.abs(dx) + Math.abs(dy);

      // Snap when close enough to prevent sub-pixel drift
      if (dist < 0.5) {
        rx = cx; ry = cy;
      } else {
        rx += dx * 0.15;
        ry += dy * 0.15;
      }

      // Velocity: how far the ring moved this frame
      const vx = rx - prevRx;
      const vy = ry - prevRy;
      prevRx = rx;
      prevRy = ry;
      const speed = Math.sqrt(vx * vx + vy * vy);

      // Flip direction with hysteresis to prevent jitter
      if (vx > 0.4)       flipDir =  1;
      else if (vx < -0.4) flipDir = -1;

      // Tilt: bear leans toward direction of travel
      // atan2(vy, vx*flipDir) gives angle in bear-local space (always positive forward)
      const rawTilt = Math.atan2(vy, vx * flipDir) * (180 / Math.PI) * 0.45;
      const targetTilt = Math.max(-12, Math.min(12, rawTilt));
      tiltAngle += (targetTilt - tiltAngle) * 0.10;

      // Speed scale: slightly larger when moving fast
      const speedScale = 1 + Math.min(speed * 0.018, 0.12);

      // Idle detection
      if (speed < 0.3) {
        idleFrames++;
      } else {
        idleFrames = 0;
        if (doingWobble) { doingWobble = false; wobbleT = 0; }
      }

      // Idle bob: gentle up-down after ~600ms (36 frames at 60fps)
      const bobOffset = idleFrames > 36
        ? Math.sin(idleFrames * 0.07) * 4
        : 0;

      // Restless wobble: big shake after ~3s idle (180 frames)
      let wobbleAngle = 0;
      if (idleFrames > 180 && !doingWobble) {
        doingWobble = true;
        wobbleT = 0;
        idleFrames = 37; // reset past bob threshold so bob continues
      }
      if (doingWobble) {
        wobbleT++;
        wobbleAngle = Math.sin(wobbleT * 0.45) * 14 * Math.max(0, 1 - wobbleT / 45);
        if (wobbleT >= 50) { doingWobble = false; wobbleAngle = 0; }
      }

      // Click squish lerp
      clickSX += (targetSX - clickSX) * 0.22;
      clickSY += (targetSY - clickSY) * 0.22;

      // Compose all transforms
      const x = Math.round(rx * 10) / 10;
      const y = Math.round(ry * 10) / 10;
      ring.style.transform = [
        `translate(${x}px, ${y}px)`,
        `translate(-50%, -50%)`,
        `translateY(${bobOffset.toFixed(2)}px)`,
        `rotate(${(tiltAngle + wobbleAngle).toFixed(2)}deg)`,
        `scaleX(${(flipDir * clickSX).toFixed(3)})`,
        `scaleY(${clickSY.toFixed(3)})`,
        `scale(${speedScale.toFixed(3)})`,
      ].join(' ');

      requestAnimationFrame(followRing);
    }
    requestAnimationFrame(followRing);

    // Hover expansion on interactive elements
    const hoverTargets = 'a, button, input, textarea, select, [role="button"], .project-card, .experience-item, .tech-grid li';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets)) ring.classList.add('hovering');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) ring.classList.remove('hovering');
    });

    // Hide when cursor leaves window
    document.addEventListener('mouseleave', () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      dot.style.opacity = '1';
      ring.style.opacity = '0.5';
    });

    // ── Glass Light Tint ──
    const glassSelectors = '.experience-item, .about-grid, .cta, .project-card, .card, .method-card, .formula-box, .hypothesis-box';
    const glassEls = document.querySelectorAll(glassSelectors);

    glassEls.forEach((el) => {
      el.style.position = el.style.position || 'relative';
      const light = document.createElement('div');
      light.classList.add('glass-light');
      el.appendChild(light);

      el.addEventListener('mouseenter', () => { light.style.opacity = '1'; });
      el.addEventListener('mouseleave', () => { light.style.opacity = '0'; });
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        const alpha1 = isDark ? 0.14 : 0.10;
        const alpha2 = isDark ? 0.04 : 0.03;
        light.style.background = `radial-gradient(350px circle at ${x}px ${y}px, rgba(244,63,122,${alpha1}) 0%, rgba(244,63,122,${alpha2}) 40%, transparent 70%)`;
      });
    });
  })();

  // ── Card ripple on click ──
  const cardSelectors = '.project-card, .experience-item, .abstract-item, .method-content, .related-research-card, .proj-feature-card, .card, .paper-meta-snapshot, .meta-highlight, .meta-detail';
  document.querySelectorAll(cardSelectors).forEach((card) => {
    card.addEventListener('click', function(e) {
      // Don't add a second ripple if the click was on a link
      if (e.target.closest('a, button')) return;
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position:absolute;border-radius:50%;pointer-events:none;
        width:${size}px;height:${size}px;
        left:${e.clientX - rect.left - size / 2}px;
        top:${e.clientY - rect.top - size / 2}px;
        background:rgba(244,63,122,0.18);
        transform:scale(0);animation:card-ripple 600ms ease-out forwards;
      `;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  });

  // Inject ripple keyframe once
  if (!document.getElementById('card-ripple-style')) {
    const s = document.createElement('style');
    s.id = 'card-ripple-style';
    s.textContent = '@keyframes card-ripple{to{transform:scale(3);opacity:0}}';
    document.head.appendChild(s);
  }

  // Single-click → section on index, double-click → dedicated page
  (function () {
    var DELAY = 260;
    var inSubdir = /\/(research|projects)\//.test(window.location.pathname);
    var prefix = inSubdir ? '../' : '';

    var MAP = {
      'projects':     { sectionId: 'projects', page: 'projects.html' },
      'research':     { sectionId: 'research', page: 'research.html' },
      'about':        { sectionId: null,        page: 'about.html'    },
      'get in touch': { sectionId: 'contact',   page: null            },
    };

    document.querySelectorAll('a.nav__link').forEach(function (link) {
      var key = link.textContent.trim().toLowerCase();
      var m = MAP[key];
      if (!m) return;

      var timer = null;

      link.addEventListener('click', function (e) {
        e.preventDefault();
        if (timer) {
          clearTimeout(timer);
          timer = null;
          if (m.page) window.location.href = prefix + m.page;
        } else {
          timer = setTimeout(function () {
            timer = null;
            if (m.sectionId) {
              var el = document.getElementById(m.sectionId);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                window.location.href = prefix + 'index.html#' + m.sectionId;
              }
            } else if (m.page) {
              window.location.href = prefix + m.page;
            }
          }, DELAY);
        }
      });
    });
  })();

  // Nav logo name scramble on hover
  var logoTextEl = document.querySelector('.nav__logo-text');
  if (logoTextEl) {
    var originalName = logoTextEl.textContent;
    var scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var scrambleTimer = null;

    document.querySelector('.nav__logo').addEventListener('mouseenter', function () {
      if (scrambleTimer) return;
      var frame = 0;
      var stagger = 3;
      scrambleTimer = setInterval(function () {
        var out = '';
        for (var i = 0; i < originalName.length; i++) {
          if (originalName[i] === ' ') {
            out += ' ';
          } else if (i <= Math.floor(frame / stagger)) {
            out += originalName[i];
          } else {
            out += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          }
        }
        logoTextEl.textContent = out;
        frame++;
        if (frame > originalName.length * stagger) {
          clearInterval(scrambleTimer);
          scrambleTimer = null;
          logoTextEl.textContent = originalName;
        }
      }, 30);
    });
  }

  // Console message
  console.log('%cWelcome to Evint\'s Portfolio!', 'color: #f43f7a; font-size: 20px; font-weight: bold; font-family: "Instrument Serif", Georgia, serif;');

})();
