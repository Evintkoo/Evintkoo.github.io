/**
 * Portfolio Application
 * Modern, clean, and performant
 */

class PortfolioApp {
  constructor() {
    this.state = {
      theme: localStorage.getItem('theme') || 'dark',
      activeFilter: 'all',
      mobileMenuOpen: false
    };
    
    this.init();
  }

  init() {
    this.applyTheme(this.state.theme);
    this.setupNavigation();
    this.setupThemeToggle();
    this.setupProjectFilters();
    this.setupAnimations();
    this.setupTechStack();
    this.setupResearchPages();
    this.setupEnhancedInteractions();
  }

  /* ===================================
     THEME MANAGEMENT
  =================================== */
  applyTheme(theme) {
    const root = document.documentElement;
    const logo = document.querySelector('.logo__image');

    if (theme === 'light') {
      root.classList.add('light');
      if (logo) logo.src = 'images/logo-dark.png';
    } else {
      root.classList.remove('light');
      if (logo) logo.src = 'images/logo-light.png';
    }

    this.state.theme = theme;
    localStorage.setItem('theme', theme);
  }

  setupThemeToggle() {
    // Prevent duplicate buttons
    if (document.querySelector('.theme-toggle')) return;

    const nav = document.querySelector('.nav');
    if (!nav) return;

    const button = this.createThemeButton();
    nav.appendChild(button);

    button.addEventListener('click', () => {
      this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme(this.state.theme);
      this.updateThemeIcon(button);
    });

    this.updateThemeIcon(button);
  }

  createThemeButton() {
    const button = document.createElement('button');
    button.className = 'theme-toggle';
    button.setAttribute('aria-label', 'Toggle theme');
    button.innerHTML = `
      <svg class="theme-icon moon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Z"/>
      </svg>
      <svg class="theme-icon sun" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
        <path d="M12,2A1,1,0,0,0,11,3V4a1,1,0,0,0,2,0V3A1,1,0,0,0,12,2ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM4,11H3a1,1,0,0,0,0,2H4a1,1,0,0,0,0-2ZM17.66,6.42,18.36,5.64a1,1,0,0,0-1.41-1.41L16.24,5.05a1,1,0,1,0,1.42,1.37ZM6.42,17.66,5.64,18.36a1,1,0,0,0,1.41,1.41l.71-.71a1,1,0,0,0-1.34-1.4ZM17.66,17.56l.71.71a1,1,0,0,0,1.41-1.41l-.71-.71a1,1,0,0,0-1.41,1.41ZM6.42,6.42a1,1,0,0,0-1.41-1.41L4.3,5.64A1,1,0,0,0,5.64,7.05ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
      </svg>
    `;
    return button;
  }

  updateThemeIcon(button) {
    const moon = button.querySelector('.moon');
    const sun = button.querySelector('.sun');
    
    if (this.state.theme === 'light') {
      moon.style.display = 'none';
      sun.style.display = 'block';
    } else {
      moon.style.display = 'block';
      sun.style.display = 'none';
    }
  }

  /* ===================================
     NAVIGATION
  =================================== */
  setupNavigation() {
    const toggle = document.getElementById('nav-toggle');
    const navList = document.querySelector('.nav__list');
    const overlay = document.getElementById('nav-overlay');
    const links = document.querySelectorAll('.nav__link');

    if (!toggle || !navList) return;

    // Mobile menu toggle
    toggle.addEventListener('click', () => {
      this.state.mobileMenuOpen = !this.state.mobileMenuOpen;
      navList.classList.toggle('active', this.state.mobileMenuOpen);
      overlay?.classList.toggle('active', this.state.mobileMenuOpen);
      toggle.classList.toggle('active', this.state.mobileMenuOpen);
      document.body.classList.toggle('no-scroll', this.state.mobileMenuOpen);
      
      toggle.setAttribute('aria-expanded', this.state.mobileMenuOpen);
    });

    // Close menu on link click
    links.forEach(link => {
      link.addEventListener('click', () => {
        if (this.state.mobileMenuOpen) {
          this.closeMobileMenu(toggle, navList, overlay);
        }
      });
    });

    // Close on overlay click
    overlay?.addEventListener('click', () => {
      this.closeMobileMenu(toggle, navList, overlay);
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.mobileMenuOpen) {
        this.closeMobileMenu(toggle, navList, overlay);
      }
    });

    // Smooth scrolling for anchor links
    this.setupSmoothScroll();
  }

  closeMobileMenu(toggle, navList, overlay) {
    this.state.mobileMenuOpen = false;
    navList.classList.remove('active');
    overlay?.classList.remove('active');
    toggle.classList.remove('active');
    document.body.classList.remove('no-scroll');
    toggle.setAttribute('aria-expanded', 'false');
  }

  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
          const headerHeight = document.querySelector('.header')?.offsetHeight || 72;
          const targetPosition = target.offsetTop - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

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

      // Filter projects
      projects.forEach(project => {
        const category = project.dataset.category;
        const shouldShow = filter === 'all' || category === filter;
        
        if (shouldShow) {
          project.style.display = 'flex';
          setTimeout(() => project.classList.remove('hidden'), 10);
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
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe animated elements
    document.querySelectorAll('.project, .tech-hex, .contact__link, .about__text').forEach(el => {
      observer.observe(el);
    });
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
            if (!isActive && entry.target.getBoundingClientRect().top < 0) {
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

    // Update on scroll with debouncing for performance
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    });

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
          const progress = Math.min(visitedMain.length, mainSections.length);
          
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
    });
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
    });
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

// Apply theme immediately (before DOM load)
(function() {
  const theme = localStorage.getItem('theme') || 'dark';
  if (theme === 'light') {
    document.documentElement.classList.add('light');
  }
})();

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
if ('performance' in window) {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    console.log(`⚡ Page loaded in ${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`);
  });
}

// Export for external use
window.PortfolioApp = PortfolioApp;
