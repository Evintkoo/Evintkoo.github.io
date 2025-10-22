/**
 * Portfolio Animations and Interactions
 * Consolidated animation scripts for all pages
 */

// Main Portfolio Animations
const PortfolioAnimations = (function() {
  'use strict';

  /**
   * Initialize main portfolio animations
   */
  function initPortfolioAnimations() {
    setupTechTagAnimations();
    setupProjectAnimations();
    setupScrollAnimations();
  }

  /**
   * Tech Tag Animation - Adds SVG border animation to project tech tags
   */
  function setupTechTagAnimations() {
    // Function to create SVG element for border animation
    function createAnimatedBorderSVG() {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      
      // Set SVG attributes
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('preserveAspectRatio', 'none');
      
      // Set rectangle attributes for border animation
      rect.setAttribute('x', '1');
      rect.setAttribute('y', '1');
      rect.setAttribute('width', '98');
      rect.setAttribute('height', '98');
      rect.setAttribute('rx', '6'); // Rounded corners to match border-radius
      
      svg.appendChild(rect);
      return svg;
    }
    
    // Add animated border to all project tech tags
    const techTags = document.querySelectorAll('.project__tech-tag');
    techTags.forEach(tag => {
      const svg = createAnimatedBorderSVG();
      tag.appendChild(svg);
    });
    
    // Add animated border to all project tech spans
    const techSpans = document.querySelectorAll('.project__tech span');
    techSpans.forEach(span => {
      const svg = createAnimatedBorderSVG();
      span.appendChild(svg);
    });
  }

  /**
   * Setup project card animations
   */
  function setupProjectAnimations() {
    const projects = document.querySelectorAll('.project');
    
    projects.forEach(project => {
      // Add ripple effect on click
      project.addEventListener('click', addRippleEffect);
      
      // Stagger animation on scroll - only once
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const projectsArray = Array.from(projects);
            const index = projectsArray.indexOf(entry.target);
            
            // Add staggered animation with delay
            setTimeout(() => {
              entry.target.classList.add('animated');
            }, index * 100);
            
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      
      observer.observe(project);
    });
  }

  /**
   * Add ripple effect to elements
   */
  function addRippleEffect(e) {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    target.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * Setup scroll-triggered animations
   */
  function setupScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const animation = entry.target.dataset.animate;
          entry.target.classList.add(`animate-${animation}`);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(el => observer.observe(el));
  }

  return {
    init: initPortfolioAnimations
  };
})();

// Research Page Animations
const ResearchAnimations = (function() {
  'use strict';

  /**
   * Initialize research page animations
   */
  function initResearchAnimations() {
    setupSectionObserver();
    setupSmoothScroll();
  }

  /**
   * Section Observer for Sidebar - Clean navigation
   */
  function setupSectionObserver() {
    const sections = document.querySelectorAll('.research-section[id]');
    const sidebarLinks = document.querySelectorAll('.research-sidebar__link');
    
    if (!sections.length || !sidebarLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
          const activeId = entry.target.id;
          
          sidebarLinks.forEach(link => {
            const isActive = link.getAttribute('href') === `#${activeId}`;
            link.classList.toggle('active', isActive);
            
            // Update progress states
            if (isActive) {
              const index = Array.from(sidebarLinks).indexOf(link);
              updateProgressState(index);
            }
          });
        }
      });
    }, {
      threshold: [0, 0.3, 0.5],
      rootMargin: '-100px 0px -30% 0px'
    });

    sections.forEach(section => observer.observe(section));
  }

  /**
   * Update sidebar progress state
   */
  function updateProgressState(activeIndex) {
    const list = document.querySelector('.research-sidebar__list');
    if (!list) return;

    const links = list.querySelectorAll('.research-sidebar__link');
    
    // Mark all previous items as completed
    links.forEach((link, index) => {
      if (index < activeIndex) {
        link.classList.add('completed');
        link.classList.remove('visited');
      } else if (index === activeIndex) {
        link.classList.add('visited');
        link.classList.remove('completed');
      } else {
        link.classList.remove('completed', 'visited');
      }
    });

    // Update progress bar
    list.setAttribute('data-progress', activeIndex);
  }

  /**
   * Smooth Scroll to Section
   */
  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#!') return;
        
        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        
        const headerHeight = document.querySelector('.header')?.offsetHeight || 72;
        const targetPosition = target.offsetTop - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Update URL without jumping
        if (history.pushState) {
          history.pushState(null, null, href);
        }
      });
    });
  }

  return {
    init: initResearchAnimations
  };
})();

// Circular RNA Research Animations
const CircRNAAnimations = (function() {
  'use strict';

  function initCircRNAAnimations() {
    createRNAStructures();
    setupMolecularNavigation();
    setupNeuralNetwork();
    setupCircularMetrics();
    setupPerformanceCharts();
    setupMetricBarVisuals();
    setupGradientDefinitions();
    setupMobileSidebarToggle();
  }

  /**
   * Create animated RNA structures in hero section
   */
  function createRNAStructures() {
    const hero = document.querySelector('.circrna-hero');
    if (!hero) return;

    const structures = [
      { class: 'rna-structure--large', delay: 0 },
      { class: 'rna-structure--medium', delay: 2 },
      { class: 'rna-structure--small', delay: 4 }
    ];

    structures.forEach(({ class: className, delay }) => {
      const structure = document.createElement('div');
      structure.className = `rna-structure ${className}`;
      hero.appendChild(structure);
    });
  }

  /**
   * Setup molecular navigation sidebar
   */
  function setupMolecularNavigation() {
    const sidebar = document.querySelector('.molecular-sidebar');
    if (!sidebar) return;

    const sections = document.querySelectorAll('.research-section[id]');
    if (!sections.length) return;

    const nav = document.createElement('nav');
    nav.className = 'molecular-nav';

    sections.forEach((section, index) => {
      const link = document.createElement('a');
      link.className = 'molecular-link';
      link.href = `#${section.id}`;
      const sectionTitle = section.querySelector('h2, h1')?.textContent || section.id;
      link.setAttribute('data-section', sectionTitle);
      
      const orbitalGlow = document.createElement('div');
      orbitalGlow.className = 'orbital-glow';

      const label = document.createElement('span');
      label.className = 'molecular-label';
      label.textContent = sectionTitle;
      
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('fill', 'currentColor');
      icon.setAttribute('width', '22');
      icon.setAttribute('height', '22');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '12');
      circle.setAttribute('cy', '12');
      circle.setAttribute('r', '8');
      icon.appendChild(circle);
      
      const bond = index < sections.length - 1 ? '<div class="molecular-bond"></div>' : '';

      icon.classList.add('molecular-icon');

      link.appendChild(orbitalGlow);
      link.appendChild(icon);
      link.appendChild(label);
      if (bond) {
        link.insertAdjacentHTML('beforeend', bond);
      }
      
      link.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToSection(section.id);
        updateActiveLink(link);
      });

      nav.appendChild(link);
    });

    sidebar.appendChild(nav);
    setupMolecularObserver(nav, sections);
  }

  function setupMolecularObserver(nav, sections) {
    const observer = new IntersectionObserver((entries) => {
      const visibleEntries = entries.filter(entry => entry.isIntersecting);
      if (!visibleEntries.length) return;

      const primaryEntry = visibleEntries.reduce((closest, entry) => {
        const currentDistance = Math.abs(entry.boundingClientRect.top + entry.boundingClientRect.height * 0.25);
        if (!closest) return entry;
        const closestDistance = Math.abs(closest.boundingClientRect.top + closest.boundingClientRect.height * 0.25);
        return currentDistance < closestDistance ? entry : closest;
      }, null);

      if (!primaryEntry) return;

      const index = Array.from(sections).indexOf(primaryEntry.target);
      if (index === -1) return;

      const molecularLink = nav.children[index];
      if (molecularLink) {
        updateActiveLink(molecularLink);
      }
    }, {
      threshold: [0, 0.15, 0.3, 0.5],
      rootMargin: '-45% 0px -45% 0px'
    });

    sections.forEach(section => observer.observe(section));
    
    setTimeout(() => setInitialActiveState(nav), 100);
  }

  /**
   * Create neural network visualization
   */
  function setupNeuralNetwork() {
    const container = document.querySelector('.neural-network');
    if (!container) return;

    const layers = document.createElement('div');
    layers.className = 'network-layers';

    const layerConfig = [
      { name: 'Input (256)', nodes: 16, className: 'input-layer' },
      { name: 'Hidden 1', nodes: 8, className: 'hidden-layer' },
      { name: 'Hidden 2', nodes: 6, className: 'hidden-layer' },
      { name: 'Hidden 3', nodes: 6, className: 'hidden-layer' },
      { name: 'Hidden 4', nodes: 8, className: 'hidden-layer' },
      { name: 'Hidden 5', nodes: 6, className: 'hidden-layer' },
      { name: 'Output (2)', nodes: 2, className: 'output-layer' }
    ];

    layerConfig.forEach((config, layerIndex) => {
      const layer = document.createElement('div');
      layer.className = `network-layer ${config.className}`;
      layer.innerHTML = `<div class="layer-label">${config.name}</div>`;

      const nodeGroup = document.createElement('div');
      nodeGroup.className = 'layer-nodes';

      for (let i = 0; i < config.nodes; i++) {
        const node = document.createElement('div');
        node.className = 'network-node';
        nodeGroup.appendChild(node);
      }

      layer.appendChild(nodeGroup);
      layers.appendChild(layer);
    });

    container.appendChild(layers);
    setTimeout(() => addNeuralConnections(layers), 1000);
  }

  function addNeuralConnections(container) {
    const layers = container.querySelectorAll('.network-layer');
    
    layers.forEach((layer, layerIndex) => {
      if (layerIndex < layers.length - 1) {
        const nodes = layer.querySelectorAll('.network-node');
        nodes.forEach((node, nodeIndex) => {
          const connection = document.createElement('div');
          connection.className = 'network-connection';
          connection.style.width = '80px';
          connection.style.left = '40px';
          connection.style.top = '50%';
          node.appendChild(connection);
        });
      }
    });
  }

  /**
   * Setup circular progress metrics
   */
  function setupCircularMetrics() {
    const container = document.querySelector('.circular-metrics');
    if (!container) return;

    const metrics = [
      { label: 'Accuracy', value: 0.7511, color: '#3B82F6' },
      { label: 'Precision', value: 0.7982, color: '#10B981' },
      { label: 'F1-Score', value: 0.7637, color: '#8B5CF6' },
      { label: 'Efficiency', value: 0.95, color: '#F59E0B' }
    ];

    metrics.forEach(metric => {
      const circle = createCircularProgress(metric);
      container.appendChild(circle);
    });
  }

  function createCircularProgress({ label, value, color }) {
    const container = document.createElement('div');
    container.className = 'metric-circle';

    const circumference = 2 * Math.PI * 70;
    const offset = circumference * (1 - value);

    container.innerHTML = `
      <svg viewBox="0 0 160 160">
        <defs>
          <linearGradient id="gradient-${label}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color}"/>
            <stop offset="100%" style="stop-color:${adjustBrightness(color, 20)}"/>
          </linearGradient>
        </defs>
        <circle class="circle-bg" cx="80" cy="80" r="70"/>
        <circle class="circle-progress" cx="80" cy="80" r="70" 
                stroke="url(#gradient-${label})"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"/>
      </svg>
      <div class="metric-content">
        <span class="metric-value">${(value * 100).toFixed(1)}%</span>
        <span class="metric-label">${label}</span>
      </div>
    `;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const circle = entry.target.querySelector('.circle-progress');
          circle.style.strokeDashoffset = offset;
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(container);
    return container;
  }

  /**
   * Setup performance charts
   */
  function setupPerformanceCharts() {
    const container = document.querySelector('.performance-chart');
    if (!container) return;

    const performanceData = [
      { label: 'Our Algorithm', value: 0.7511 },
      { label: 'SVM', value: 0.7328 },
      { label: 'Random Forest', value: 0.7186 },
      { label: 'DeepCirCode', value: 0.8129 },
      { label: 'Att-CNN', value: 0.7264 }
    ];

    const barsContainer = document.createElement('div');
    barsContainer.className = 'performance-bars';

    performanceData.forEach((item, index) => {
      const bar = document.createElement('div');
      bar.className = 'performance-item';
      bar.innerHTML = `
        <div class="performance-label">${item.label}</div>
        <div class="performance-bar">
          <div class="performance-fill" style="width: ${item.value * 100}%;"></div>
        </div>
        <div class="performance-value">${(item.value * 100).toFixed(1)}%</div>
      `;
      barsContainer.appendChild(bar);
    });

    container.appendChild(barsContainer);
  }

  function setupMetricBarVisuals() {
    const bars = document.querySelectorAll('.metric-bar[data-fill]');
    if (!bars.length) return;

    const supportsIntersection = 'IntersectionObserver' in window;

    bars.forEach(bar => {
      const targetFill = Math.max(0, Math.min(parseFloat(bar.dataset.fill) || 0, 100));
      const targetColor = bar.dataset.color;

      if (targetColor) {
        bar.style.setProperty('--metric-color', targetColor);
      }

      const applyFill = () => {
        bar.style.setProperty('--metric-fill', `${targetFill}%`);
      };

      if (supportsIntersection) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              applyFill();
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.4 });

        bar.style.setProperty('--metric-fill', '0%');
        observer.observe(bar);
      } else {
        applyFill();
      }
    });
  }

  function setupGradientDefinitions() {
    const defs = document.createElement('div');
    defs.className = 'gradient-defs';
    defs.innerHTML = `
      <svg>
        <defs>
          <linearGradient id="helix-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3B82F6"/>
            <stop offset="100%" style="stop-color:#10B981"/>
          </linearGradient>
          <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#8B5CF6"/>
            <stop offset="100%" style="stop-color:#EC4899"/>
          </linearGradient>
        </defs>
      </svg>
    `;
    document.body.appendChild(defs);
  }

  function setupMobileSidebarToggle() {
    const toggle = document.getElementById('research-sidebar-toggle');
    const sidebar = document.getElementById('floating-sidebar');
    
    if (!toggle || !sidebar) return;
    
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      toggle.classList.toggle('active');
    });
    
    sidebar.addEventListener('click', (e) => {
      if (e.target.matches('a[href^="#"]')) {
        sidebar.classList.remove('active');
        toggle.classList.remove('active');
      }
    });
    
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('active');
        toggle.classList.remove('active');
      }
    });
  }

  // Utility functions
  function scrollToSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (!target) return;

    const headerHeight = document.querySelector('.header')?.offsetHeight || 72;
    const targetPosition = target.offsetTop - headerHeight - 20;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }

  function updateActiveLink(activeLink) {
    const links = document.querySelectorAll('.molecular-link');
    links.forEach(link => link.classList.remove('active'));
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  function setInitialActiveState(nav) {
    const links = nav.querySelectorAll('.molecular-link');
    if (links.length > 0) {
      const hash = window.location.hash;
      if (hash) {
        const targetLink = document.querySelector(`.molecular-link[href="${hash}"]`);
        if (targetLink) {
          updateActiveLink(targetLink);
          return;
        }
      }
      updateActiveLink(links[0]);
    }
  }

  function adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  return {
    init: initCircRNAAnimations
  };
})();

// P53 Mutation Research Animations
const P53Animations = (function() {
  'use strict';

  function initP53Animations() {
    createHelixBackground();
    setupMolecularNavigation();
    setupHeroCounters();
    setupMetricHighlights();
  }

  function createHelixBackground() {
    const hero = document.querySelector('.p53-hero');
    if (!hero) return;

    const helix = document.createElement('div');
    helix.className = 'dna-helix';

    for (let i = 0; i < 3; i += 1) {
      const strand = document.createElement('div');
      strand.className = 'dna-helix__strand';
      strand.style.left = i === 0 ? '6%' : i === 1 ? 'auto' : '42%';
      helix.appendChild(strand);
    }

    hero.appendChild(helix);
  }

  function setupMolecularNavigation() {
    const container = document.getElementById('molecular-sidebar');
    if (!container) return;

    const sections = Array.from(document.querySelectorAll('.research-section[id]'));
    if (!sections.length) return;

    const nav = document.createElement('nav');
    nav.className = 'molecular-nav';

    sections.forEach((section, index) => {
      const link = document.createElement('a');
      link.className = 'molecular-link';
      link.href = `#${section.id}`;

      const orbital = document.createElement('div');
      orbital.className = 'orbital-glow';

      const icon = createMolecularIcon();
      const label = document.createElement('span');
      label.className = 'molecular-label';
      label.textContent = getSectionTitle(section);

      link.appendChild(orbital);
      link.appendChild(icon);
      link.appendChild(label);

      if (index < sections.length - 1) {
        const bond = document.createElement('span');
        bond.className = 'molecular-bond';
        link.appendChild(bond);
      }

      link.addEventListener('click', () => updateMolecularLinks(link));
      nav.appendChild(link);
    });

    container.appendChild(nav);
    setupP53Observer(nav, sections);
  }

  function setupP53Observer(nav, sections) {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries
        .filter(item => item.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!entry) return;

      const index = sections.indexOf(entry.target);
      if (index === -1) return;

      const activeLink = nav.children[index];
      updateMolecularLinks(activeLink);

      const fallbackNav = document.querySelector('.research-sidebar__nav');
      if (fallbackNav) {
        const fallbackLinks = fallbackNav.querySelectorAll('.research-sidebar__link');
        fallbackLinks.forEach(link => link.classList.remove('active'));
        if (fallbackLinks[index]) {
          fallbackLinks[index].classList.add('active');
        }
      }
    }, {
      threshold: [0.2, 0.4],
      rootMargin: '-40% 0px -40% 0px'
    });

    sections.forEach(section => observer.observe(section));
    updateMolecularLinks(nav.children[0]);
  }

  function createMolecularIcon() {
    const wrapper = document.createElement('span');
    wrapper.className = 'molecular-icon';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');

    const pathA = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathA.setAttribute('d', 'M7 3c3 2 7 2 10 0');
    const pathB = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathB.setAttribute('d', 'M7 21c3-2 7-2 10 0');
    const pathC = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathC.setAttribute('d', 'M4 7c4 2 12 2 16 0');
    const pathD = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathD.setAttribute('d', 'M4 17c4-2 12-2 16 0');

    svg.append(pathA, pathB, pathC, pathD);
    wrapper.appendChild(svg);

    return wrapper;
  }

  function getSectionTitle(section) {
    const heading = section.querySelector('.section-title, .research-section__title, h2');
    return heading ? heading.textContent.trim() : section.id;
  }

  function updateMolecularLinks(activeLink) {
    if (!activeLink) return;

    const links = activeLink.parentElement?.querySelectorAll('.molecular-link');
    if (!links) return;

    links.forEach(link => link.classList.toggle('active', link === activeLink));
  }

  function setupHeroCounters() {
    const counters = document.querySelectorAll('[data-count-to]');
    if (!counters.length) return;

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (element) => {
      const endValue = Number(element.dataset.countTo) || 0;
      const decimals = Number(element.dataset.decimals) || 0;
      const prefix = element.dataset.prefix || '';
      const suffix = element.dataset.suffix || '';
      const duration = Number(element.dataset.duration) || 1200;
      const startTime = performance.now();

      const step = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const eased = easeOut(progress);
        const value = (endValue * eased).toFixed(decimals);
        element.textContent = `${prefix}${formatNumber(value)}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach(counter => observer.observe(counter));
  }

  function setupMetricHighlights() {
    const metrics = document.querySelectorAll('.result-metric');
    if (!metrics.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const metric = entry.target;
        metric.classList.add('is-visible');

        const bar = metric.querySelector('.metric-bar');
        if (bar && bar.dataset.fill) {
          bar.style.setProperty('--metric-fill', `${Math.min(100, Math.max(0, Number(bar.dataset.fill)))}%`);
        }

        observer.unobserve(metric);
      });
    }, { threshold: 0.4, rootMargin: '0px 0px -10% 0px' });

    metrics.forEach(metric => {
      const bar = metric.querySelector('.metric-bar');
      if (bar) {
        bar.style.setProperty('--metric-fill', '0%');
      }
      observer.observe(metric);
    });
  }

  function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return value;
    }

    if (number >= 1000) {
      return number.toLocaleString();
    }

    return number.toString();
  }

  return {
    init: initP53Animations
  };
})();

// Auto-initialization based on page type
document.addEventListener('DOMContentLoaded', function() {
  // Initialize portfolio animations on main page
  if (document.querySelector('.portfolio-main')) {
    PortfolioAnimations.init();
  }
  
  // Initialize research animations on research pages
  if (document.querySelector('.research-page')) {
    ResearchAnimations.init();
    
    // Initialize specific research theme animations
    if (document.querySelector('.circrna-hero')) {
      CircRNAAnimations.init();
    }
    
    if (document.querySelector('.p53-hero')) {
      P53Animations.init();
    }
  }
});

// Export for manual initialization if needed
window.PortfolioAnimations = PortfolioAnimations;
window.ResearchAnimations = ResearchAnimations;
window.CircRNAAnimations = CircRNAAnimations;
window.P53Animations = P53Animations;