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
      const isActive = navMenu.classList.contains('active');
      
      // Toggle menu
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
      navOverlay.addEventListener('click', function() {
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
          const navHeight = document.querySelector('.nav').offsetHeight;
          const targetPosition = target.offsetTop - navHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // Dark Mode Toggle
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const logoImg = document.querySelector('.nav__logo-img');
  const html = document.documentElement;
  
  // Check for saved theme preference or default to 'dark' mode
  const currentTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', currentTheme);
  
  // Also update the root class for backwards compatibility with main.css
  if (currentTheme === 'light') {
    html.classList.add('light');
  } else {
    html.classList.remove('light');
  }
  
  updateThemeIcon(currentTheme);
  updateLogo(currentTheme);
  
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const theme = html.getAttribute('data-theme');
      const newTheme = theme === 'light' ? 'dark' : 'light';
      
      html.setAttribute('data-theme', newTheme);
      
      // Also update the root class for backwards compatibility with main.css
      if (newTheme === 'light') {
        html.classList.add('light');
      } else {
        html.classList.remove('light');
      }
      
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
      updateLogo(newTheme);
    });
  }
  
  function updateThemeIcon(theme) {
    if (!themeIcon) return;
    
    if (theme === 'dark') {
      // Moon icon
      themeIcon.innerHTML = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      `;
    } else {
      // Sun icon
      themeIcon.innerHTML = `
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      `;
    }
  }
  
  function updateLogo(theme) {
    if (!logoImg) return;
    
    // Determine if we're in a subdirectory (research pages)
    const isSubdirectory = window.location.pathname.includes('/research/');
    const pathPrefix = isSubdirectory ? '../' : '';
    
    // Dark theme shows light logo, light theme shows dark logo
    if (theme === 'dark') {
      logoImg.src = pathPrefix + 'assets/images/logos/logo-light.png';
    } else {
      logoImg.src = pathPrefix + 'assets/images/logos/logo-dark.png';
    }
  }

  // Navbar background on scroll - optimized with throttling
  const nav = document.querySelector('.nav');
  let lastScrollTop = 0;
  let scrollTicking = false;

  function updateNavOnScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const theme = html.getAttribute('data-theme') || 'dark';
    
    if (scrollTop > 50) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
    
    lastScrollTop = scrollTop;
    scrollTicking = false;
  }

  window.addEventListener('scroll', function() {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateNavOnScroll);
      scrollTicking = true;
    }
  }, { passive: true });

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
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
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
    const sidebar = document.querySelector('.research-sidebar');
    const sections = document.querySelectorAll('.research-section');
    
    // Only run if we're on a research page
    if (!sidebar && sections.length === 0) return;

    // Sidebar Toggle
    const toggle = document.querySelector('.research-sidebar-toggle');
    const container = document.querySelector('.research-sidebar-container');
    
    if (toggle && container) {
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

    // Reading Progress Bar
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
    updateProgress();

    // Section Tracking for Sidebar
    const links = document.querySelectorAll('.research-sidebar__link');
    const progressList = document.querySelector('.research-sidebar__list');
    const visitedSections = new Set();
    
    if ('IntersectionObserver' in window && sections.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const activeId = entry.target.id;
            visitedSections.add(activeId);
            
            // Update active link
            if (links.length > 0) {
              links.forEach(link => {
                const isActive = link.getAttribute('href') === `#${activeId}`;
                link.classList.toggle('active', isActive);
                
                // Mark as visited if we've scrolled past it
                if (!isActive && entry.boundingClientRect.top < 0) {
                  link.classList.add('visited');
                }
              });
            }

            // Update progress attribute
            if (progressList) {
               const mainSections = Array.from(sections).filter(s => 
                 !['introduction', 'references', 'conclusion'].includes(s.id)
               );
               const visitedMain = mainSections.filter(s => visitedSections.has(s.id));
               // Clamp to max 4 steps as per CSS design
               const progress = Math.min(visitedMain.length, 4);
               progressList.setAttribute('data-progress', progress);
            }
          }
        });
      }, {
        threshold: 0.2,
        rootMargin: '-20% 0px -50% 0px'
      });

      sections.forEach(section => observer.observe(section));
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

  // Project Slider Functionality (Infinite Loop)
  function initProjectSlider() {
    const track = document.querySelector('.project-slider__track');
    const prevBtn = document.querySelector('.slider-btn--prev');
    const nextBtn = document.querySelector('.slider-btn--next');
    
    if (!track || !prevBtn || !nextBtn) return;

    // Clone items for infinite loop
    const originalCards = Array.from(track.querySelectorAll('.slider-card'));
    const cloneCount = 3; // Max visible cards
    
    // Clone start and end
    const startClones = originalCards.slice(0, cloneCount).map(card => {
      const clone = card.cloneNode(true);
      clone.classList.add('slider-clone');
      return clone;
    });
    
    const endClones = originalCards.slice(-cloneCount).map(card => {
      const clone = card.cloneNode(true);
      clone.classList.add('slider-clone');
      return clone;
    });

    // Append/Prepend clones
    startClones.forEach(clone => track.appendChild(clone));
    endClones.reverse().forEach(clone => track.insertBefore(clone, track.firstChild));

    let currentIndex = cloneCount; // Start at first real item
    let cardWidth = 0;
    let visibleCards = 1;
    let isTransitioning = false;

    function updateSliderDimensions() {
      const cards = track.querySelectorAll('.slider-card');
      const containerWidth = track.parentElement.offsetWidth;
      const cardMarginRight = parseFloat(window.getComputedStyle(track).gap) || 24;
      
      if (window.innerWidth >= 1024) {
        visibleCards = 3;
      } else if (window.innerWidth >= 640) {
        visibleCards = 2;
      } else {
        visibleCards = 1;
      }

      cardWidth = (containerWidth - (cardMarginRight * (visibleCards - 1))) / visibleCards;
      
      // Update position without transition
      updateSliderPosition(false);
    }

    function updateSliderPosition(enableTransition = true) {
      const cardMarginRight = parseFloat(window.getComputedStyle(track).gap) || 24;
      const moveAmount = (cardWidth + cardMarginRight) * currentIndex;
      
      if (enableTransition) {
        track.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      } else {
        track.style.transition = 'none';
      }
      
      track.style.transform = `translateX(-${moveAmount}px)`;
    }

    function handleTransitionEnd() {
      isTransitioning = false;
      const totalRealCards = originalCards.length;
      
      // If we reached the appended clones (end), jump to real start
      if (currentIndex >= totalRealCards + cloneCount) {
        currentIndex = cloneCount;
        updateSliderPosition(false);
      }
      
      // If we reached the prepended clones (start), jump to real end
      if (currentIndex < cloneCount) {
        currentIndex = totalRealCards + cloneCount - 1; // Last real item index? No, wait.
        // Indices: 0,1,2 (clones) | 3,4,5... (real)
        // If we are at index 2 (last clone), we want to go to last real item.
        // Last real item index is: cloneCount + totalRealCards - 1.
        // Wait, if we are at index < cloneCount, we are in prepended clones.
        // Example: cloneCount=3. Real=8. Total=14.
        // Indices: 0,1,2 (end clones) | 3..10 (real) | 11,12,13 (start clones)
        // If current is 2 (clone of last real), jump to 10 (last real).
        // Formula: currentIndex + totalRealCards
        currentIndex += totalRealCards;
        updateSliderPosition(false);
      }
    }

    track.addEventListener('transitionend', handleTransitionEnd);

    prevBtn.addEventListener('click', () => {
      if (isTransitioning) return;
      isTransitioning = true;
      currentIndex--;
      updateSliderPosition(true);
    });

    nextBtn.addEventListener('click', () => {
      if (isTransitioning) return;
      isTransitioning = true;
      currentIndex++;
      updateSliderPosition(true);
    });

    // Initial setup
    updateSliderDimensions();

    // Update on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateSliderDimensions, 100);
    });
  }

  // Initialize new features
  initResearchFeatures();
  initScrollToTop();
  initProjectSlider();

  // Console message
  console.log('%cWelcome to Evint\'s Portfolio!', 'color: #212529; font-size: 24px; font-weight: bold;');
  console.log('%cInterested in the code? Check out the repository!', 'color: #495057; font-size: 14px;');

})();
