/**
 * Portfolio Application
 * Modern, clean, and performant
 */

class PortfolioApp {
  constructor() {
    this.state = {
      activeFilter: 'all'
    };
    
    this.init();
  }

  init() {
    // Only initialize if elements exist to avoid unnecessary processing
    this.setupProjectFilters();
    this.setupAnimations();
    this.setupTechStack();
    this.setupResearchPages();
    this.setupEnhancedInteractions();
  }

  /* ===================================
     THEME & NAVIGATION
     Note: Handled by main-theme.js for consistency
  =================================== */

  /* ===================================
     PROJECT FILTERING
  =================================== */
  setupProjectFilters() {
    const filterContainer = document.querySelector('.projects__filter');
    const projects = document.querySelectorAll('.project');

    if (!filterContainer || !projects.length) return;

    filterContainer.addEventListener('click', (e) => {
      const button = e.target.closest('.filter__btn');
      if (!button) return;

      const filter = button.dataset.filter;
      this.state.activeFilter = filter;

      // Update active button
      document.querySelectorAll('.filter__btn').forEach(btn => {
        btn.classList.toggle('filter__btn--active', btn === button);
      });

      // Filter projects - maintain animation state
      projects.forEach(project => {
        const category = project.dataset.category;
        const shouldShow = filter === 'all' || category === filter;
        
        if (shouldShow) {
          project.style.display = 'flex';
          // Keep the animated class if it was already added
          setTimeout(() => {
            project.classList.remove('hidden');
            if (!project.classList.contains('animated')) {
              project.classList.add('animated');
            }
          }, 10);
        } else {
          project.classList.add('hidden');
          setTimeout(() => project.style.display = 'none', 300);
        }
      });
    });
  }

  /* ===================================
     ANIMATIONS & OBSERVERS
  =================================== */
  setupAnimations() {
    const elements = document.querySelectorAll('.project, .tech-hex, .contact__link, .about__text');
    if (elements.length === 0) return;

    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -80px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => {
            // For project cards, add staggered animation
            if (entry.target.classList.contains('project')) {
              this.animateProjectEntry(entry.target);
            } else {
              // For other elements, just fade in
              entry.target.classList.add('fade-in');
            }
          });
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe animated elements
    elements.forEach(el => {
      observer.observe(el);
    });
  }

  /**
   * Animate project card entry with stagger effect
   */
  animateProjectEntry(projectCard) {
    const projects = Array.from(document.querySelectorAll('.project'));
    const index = projects.indexOf(projectCard);
    const delay = index * 100; // 100ms stagger between each card

    setTimeout(() => {
      projectCard.classList.add('animated');
    }, delay);
  }

  /* ===================================
     TECH STACK - HEXAGONAL GRID
  =================================== */
  setupTechStack() {
    const hexGrid = document.querySelector('.hex-grid');
    if (!hexGrid) return;

    const hexagons = hexGrid.querySelectorAll('.tech-hex');
    
    hexagons.forEach(hex => {
      hex.addEventListener('mouseenter', () => {
        hex.classList.add('active');
        this.highlightRelatedTech(hex);
      });

      hex.addEventListener('mouseleave', () => {
        hex.classList.remove('active');
        this.clearTechHighlights();
      });
    });
  }

  highlightRelatedTech(activeHex) {
    const category = activeHex.dataset.category;
    if (!category) return;

    document.querySelectorAll(`.tech-hex[data-category="${category}"]`).forEach(hex => {
      if (hex !== activeHex) {
        hex.classList.add('related');
      }
    });
  }

  clearTechHighlights() {
    document.querySelectorAll('.tech-hex').forEach(hex => {
      hex.classList.remove('related');
    });
  }

  /* ===================================
     RESEARCH PAGES
  =================================== */
  setupResearchPages() {
    const sidebar = document.querySelector('.research-sidebar');
    if (!sidebar) return;

    this.setupResearchNavigation();
    this.setupResearchProgress();
  }

  setupResearchNavigation() {
    const toggle = document.querySelector('.research-sidebar-toggle');
    const container = document.querySelector('.research-sidebar-container');
    
    if (!toggle || !container) return;

    toggle.addEventListener('click', () => {
      container.classList.toggle('show');
      document.body.classList.toggle('no-scroll');
    });

    // Close on outside click (mobile)
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024 && 
          container.classList.contains('show') &&
          !container.contains(e.target) &&
          !toggle.contains(e.target)) {
        container.classList.remove('show');
        document.body.classList.remove('no-scroll');
      }
    });
  }

  setupResearchProgress() {
    const sections = document.querySelectorAll('.research-section');
    const links = document.querySelectorAll('.research-sidebar__link');
    const hasSections = sections.length > 0;
    const hasSidebarLinks = links.length > 0;
    const supportsIntersectionObserver = 'IntersectionObserver' in window;

    if (!hasSections) return;

    if (!supportsIntersectionObserver) {
      sections.forEach(section => {
        section.style.opacity = '1';
        section.style.transform = 'none';
        section.style.transition = '';
      });
      this.setupReadingProgress();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const activeId = entry.target.id;

        if (hasSidebarLinks) {
          links.forEach(link => {
            const isActive = link.getAttribute('href') === `#${activeId}`;
            link.classList.toggle('active', isActive);

            // Mark as visited if scrolled past
            // Improved logic: if section is above viewport, it's visited
            if (!isActive && entry.boundingClientRect.top < 0) {
              link.classList.add('visited');
            }
          });
        }

        if (!entry.target.dataset.revealed) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          entry.target.dataset.revealed = 'true';
        }
      });
    }, {
      threshold: [0, 0.3, 0.5],
      rootMargin: '-80px 0px -30% 0px'
    });

    // Initialize sections with animation state
    sections.forEach(section => {
      section.style.opacity = '0';
      section.style.transform = 'translateY(20px)';
      section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      delete section.dataset.revealed;
      observer.observe(section);
    });

    // Add reading progress bar
    this.setupReadingProgress();

    // Add section progress tracking when observers are available
    this.trackSectionProgress();
  }

  /* ===================================
     READING PROGRESS BAR
  =================================== */
  setupReadingProgress() {
    // Create progress bar element
    let progressBar = document.querySelector('.reading-progress');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'reading-progress';
      document.body.appendChild(progressBar);
    }

    const updateProgress = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.pageYOffset;
      const progress = (scrolled / documentHeight) * 100;
      
      progressBar.style.width = `${Math.min(progress, 100)}%`;
    };

    // Update on scroll with throttling for performance
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Initial update
    updateProgress();
  }

  /* ===================================
     SECTION PROGRESS TRACKING
  =================================== */
  trackSectionProgress() {
    const sections = document.querySelectorAll('.research-section');
    const progressList = document.querySelector('.research-sidebar__list');
    
    if (!sections.length || !progressList) return;
    
    let visitedSections = new Set();
    
    const progressObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          visitedSections.add(entry.target.id);
          
          // Calculate progress (excluding introduction and references)
          const mainSections = Array.from(sections).filter(s => 
            !['introduction', 'references', 'conclusion'].includes(s.id)
          );
          const visitedMain = mainSections.filter(s => visitedSections.has(s.id));
          const progress = Math.min(visitedMain.length, 4); // Clamp to max 4 steps
          
          // Update progress attribute
          progressList.setAttribute('data-progress', progress);
        }
      });
    }, {
      threshold: 0.5
    });
    
    sections.forEach(section => progressObserver.observe(section));
  }

  /* ===================================
     ENHANCED INTERACTIONS
  =================================== */
  setupEnhancedInteractions() {
    // Add ripple effect to buttons
    this.addRippleEffect();
    
    // Enhance table interactions
    this.enhanceTableInteractions();
    
    // Add parallax effects
    this.addParallaxEffects();
    
    // Smooth reveal animations
    this.addRevealAnimations();
    
    // Scroll to top button
    this.addScrollToTop();
    
    // Reading time estimator
    this.addReadingTime();
  }

  addRippleEffect() {
    document.querySelectorAll('.btn, .btn-primary, .btn-secondary, .filter__btn').forEach(button => {
      button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  enhanceTableInteractions() {
    document.querySelectorAll('.performance-table tbody tr').forEach(row => {
      row.addEventListener('mouseenter', function() {
        this.style.transform = 'translateX(4px)';
      });
      
      row.addEventListener('mouseleave', function() {
        this.style.transform = '';
      });
    });
  }

  addParallaxEffects() {
    const heroSection = document.querySelector('.paper-hero');
    if (!heroSection) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.pageYOffset;
          const rate = scrolled * 0.3;
          
          if (heroSection.querySelector('::before')) {
            heroSection.style.transform = `translate3d(0, ${rate}px, 0)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  addRevealAnimations() {
    const revealElements = document.querySelectorAll('.method-card, .cluster-card, .insight-card, .abstract-item');
    if (!revealElements.length) return;

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.transition = '';
      });
      return;
    }

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const delayIndex = Number(entry.target.dataset.revealIndex) || 0;
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, delayIndex * 100);
        revealObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach((el, index) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      el.dataset.revealIndex = index;
      revealObserver.observe(el);
    });
  }

  addScrollToTop() {
    // Create scroll to top button
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

    // Show/hide based on scroll position
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.pageYOffset;
          scrollBtn.classList.toggle('visible', scrolled > 500);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  addReadingTime() {
    const content = document.querySelector('.research-content__inner');
    if (!content) return;

    const text = content.textContent;
    const wordCount = text.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words/min

    // Add reading time badge to paper hero
    const metaContent = document.querySelector('.paper-meta-content');
    if (metaContent && !document.querySelector('.reading-time')) {
      const badge = document.createElement('div');
      badge.className = 'reading-time';
      badge.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span>${readingTime} min read</span>
      `;
      metaContent.appendChild(badge);
    }
  }
}

/* ===================================
   UTILITIES
=================================== */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/* ===================================
   INITIALIZATION
=================================== */

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.portfolioApp = new PortfolioApp();
  
  // Fade in animation
  document.body.style.opacity = '0';
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity = '1';
  });
});

// Performance monitoring
if ('performance' in window && window.location.hostname === 'localhost') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        const metrics = {
          'DNS Lookup': Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
          'TCP Connection': Math.round(perfData.connectEnd - perfData.connectStart),
          'Request Time': Math.round(perfData.responseStart - perfData.requestStart),
          'Response Time': Math.round(perfData.responseEnd - perfData.responseStart),
          'DOM Processing': Math.round(perfData.domComplete - perfData.domLoading),
          'Total Load Time': Math.round(perfData.loadEventEnd - perfData.fetchStart)
        };
        console.log('⚡ Performance Metrics:', metrics);
      }
    }, 0);
  });
}

// Export for external use
window.PortfolioApp = PortfolioApp;
