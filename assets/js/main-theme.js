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
    
    // Dark theme shows light logo, light theme shows dark logo
    if (theme === 'dark') {
      logoImg.src = 'assets/images/logos/logo-light.png';
    } else {
      logoImg.src = 'assets/images/logos/logo-dark.png';
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
        });
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe cards and sections - only if they exist
  const animatedElements = document.querySelectorAll('.card, .research-card, .timeline__item');
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

  // Console message
    // Research sidebar functionality
  const researchSidebarToggle = document.getElementById('research-sidebar-toggle');
  const floatingSidebar = document.getElementById('floating-sidebar');
  
  if (researchSidebarToggle && floatingSidebar) {
    researchSidebarToggle.addEventListener('click', function() {
      floatingSidebar.classList.toggle('active');
      researchSidebarToggle.classList.toggle('active');
    });
    
    // Close sidebar when clicking outside
    document.addEventListener('click', function(event) {
      if (!researchSidebarToggle.contains(event.target) && !floatingSidebar.contains(event.target)) {
        floatingSidebar.classList.remove('active');
        researchSidebarToggle.classList.remove('active');
      }
    });
  }
  
  // Research section navigation - optimized with throttling
  const researchLinks = document.querySelectorAll('.research-sidebar__link');
  const researchSections = document.querySelectorAll('.research-section');
  
  if (researchLinks.length > 0 && researchSections.length > 0) {
    let researchScrollTicking = false;
    
    function updateResearchNav() {
      let current = '';
      researchSections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= (sectionTop - 200)) {
          current = section.getAttribute('id');
        }
      });
      
      researchLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
      
      researchScrollTicking = false;
    }
    
    // Update active link on scroll - throttled
    window.addEventListener('scroll', function() {
      if (!researchScrollTicking) {
        window.requestAnimationFrame(updateResearchNav);
        researchScrollTicking = true;
      }
    }, { passive: true });
  }
  
  // Mobile-specific fixes for research section
  function handleMobileResearchInteractions() {
    // Fix for research section highlighting on mobile
    const researchSection = document.getElementById('research');
    if (researchSection) {
      // Add touch event handlers for proper mobile highlighting
      researchSection.addEventListener('touchstart', function() {
        this.classList.add('highlighted');
      });
      
      researchSection.addEventListener('touchend', function() {
        // Keep highlighted state briefly for visual feedback
        setTimeout(() => {
          this.classList.remove('highlighted');
        }, 150);
      });
    }
    
    // Ensure card links work properly on mobile
    const cardLinks = document.querySelectorAll('.card__link');
    cardLinks.forEach(link => {
      // Add proper touch handling for card links
      link.addEventListener('touchstart', function(e) {
        this.style.transform = 'translateX(2px)';
        const svg = this.querySelector('svg');
        if (svg) {
          svg.style.transform = 'translateX(4px)';
        }
      });
      
      link.addEventListener('touchend', function(e) {
        this.style.transform = '';
        const svg = this.querySelector('svg');
        if (svg) {
          svg.style.transform = '';
        }
      });
    });
    
    // Fix for tag interactions on mobile
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
      tag.addEventListener('touchstart', function(e) {
        this.style.backgroundColor = 'var(--accent-primary)';
        this.style.color = 'var(--bg-primary)';
        this.style.transform = 'scale(0.95)';
      });
      
      tag.addEventListener('touchend', function(e) {
        setTimeout(() => {
          this.style.backgroundColor = '';
          this.style.color = '';
          this.style.transform = '';
        }, 150);
      });
    });
  }
  
  // Initialize mobile fixes
  if (window.innerWidth <= 767) {
    handleMobileResearchInteractions();
  }
  
  // Re-initialize on window resize
  window.addEventListener('resize', function() {
    if (window.innerWidth <= 767) {
      handleMobileResearchInteractions();
    }
  });

  // Console message
  console.log('%cWelcome to Evint\'s Portfolio!', 'color: #212529; font-size: 24px; font-weight: bold;');
  console.log('%cInterested in the code? Check out the repository!', 'color: #495057; font-size: 14px;');

})();
