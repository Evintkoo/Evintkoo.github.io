// Global function for opening mobile nav
function toggleMobileNav() {
  const nav = document.querySelector(".nav");
  const body = document.body;
  const navToggle = document.getElementById("nav-toggle");
  
  // Toggle the active class
  nav.classList.toggle("active");
  
  // Check if menu is now active
  const isActive = nav.classList.contains("active");

  // Toggle body class to prevent scrolling
  if (isActive) {
    body.classList.add("nav-open");
  } else {
    body.classList.remove("nav-open");
  }

  // Update aria-expanded for accessibility
  navToggle.setAttribute("aria-expanded", isActive.toString());
}

// Global function for closing mobile nav
function closeMobileNav() {
  const nav = document.querySelector(".nav");
  const body = document.body;
  const navToggle = document.getElementById("nav-toggle");
  
  // Remove active class
  nav.classList.remove("active");
  body.classList.remove("nav-open");
  
  // Update aria-expanded for accessibility
  navToggle.setAttribute("aria-expanded", "false");
}

// Smooth scrolling for anchor links
function smoothScrollToTarget(target) {
  const element = document.querySelector(target);
  if (element) {
    const headerHeight = document.querySelector('.header').offsetHeight;
    const elementPosition = element.offsetTop - headerHeight - 20;
    
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
  }
}

// Intersection Observer for animations
function createObserver() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);

  // Observe elements that should animate in
  const animatedElements = document.querySelectorAll(`
    .project-card, 
    .skill-category, 
    .contact__link,
    .cluster-card,
    .insight-card,
    .method-item,
    .policy-item,
    .highlight-box,
    .conclusion-highlight,
    .methodology-box,
    .policy-box,
    .abstract-item,
    .method-card,
    .research-highlight,
    .results-table,
    .reference-item,
    .appendix-section
  `);
  animatedElements.forEach(el => {
    observer.observe(el);
  });
}

// Header scroll effect
function handleHeaderScroll() {
  const header = document.querySelector('.header');
  const paperNav = document.querySelector('.paper-nav');
  let lastScrollY = window.scrollY;
  let headerHeight = header ? header.offsetHeight : 80;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Hide/show header on scroll
    let headerVisible = true;
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Scrolling down - hide header
      header.style.transform = 'translateY(-100%)';
      headerVisible = false;
    } else {
      // Scrolling up - show header
      header.style.transform = 'translateY(0)';
      headerVisible = true;
    }
    
    // Update paper navigation position based on header visibility
    if (paperNav) {
      if (headerVisible) {
        paperNav.style.top = `${headerHeight}px`;
      } else {
        paperNav.style.top = '0px';
      }
    }
    
    lastScrollY = currentScrollY;
  });
}

// Typing animation for hero section
function initTypingAnimation() {
  const subtitle = document.querySelector('.hero__subtitle');
  if (!subtitle) return;

  const text = "Data Scientist building practical machine learning solutions";
  const speed = 50;
  let index = 0;

  subtitle.textContent = '';

  function typeWriter() {
    if (index < text.length) {
      subtitle.textContent += text.charAt(index);
      index++;
      setTimeout(typeWriter, speed);
    }
  }

  // Start typing animation after a short delay
  setTimeout(typeWriter, 1000);
}

// Add CSS animations
function addAnimationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .nav-open {
      overflow: hidden;
    }

    .header {
      transition: transform 0.3s ease;
    }

    .header.scrolled {
      background-color: rgba(10, 10, 11, 0.98);
      backdrop-filter: blur(20px);
    }

    .project-card,
    .skill-category,
    .contact__link {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.6s ease;
    }

    .project-card.animate-in,
    .skill-category.animate-in,
    .contact__link.animate-in {
      opacity: 1;
      transform: translateY(0);
    }

    .hero__content {
      animation: fadeInUp 1s ease forwards;
    }

    .hero__visual {
      animation: fadeInUp 1s ease 0.3s forwards;
      opacity: 0;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .code-content {
      animation: typeCode 2s ease forwards;
    }

    @keyframes typeCode {
      from {
        opacity: 0.3;
      }
      to {
        opacity: 1;
      }
    }

    /* Stagger animation for skill tags */
    .skill-tag {
      animation: fadeIn 0.5s ease forwards;
      opacity: 0;
    }

    .skill-tag:nth-child(1) { animation-delay: 0.1s; }
    .skill-tag:nth-child(2) { animation-delay: 0.2s; }
    .skill-tag:nth-child(3) { animation-delay: 0.3s; }
    .skill-tag:nth-child(4) { animation-delay: 0.4s; }
    .skill-tag:nth-child(5) { animation-delay: 0.5s; }

    @keyframes fadeIn {
      to {
        opacity: 1;
      }
    }

    /* Scroll progress indicator */
    .scroll-progress {
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 3px;
      background: linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-secondary));
      z-index: 1001;
      transition: width 0.1s ease;
    }
  `;
  document.head.appendChild(style);
}

// Scroll progress indicator
function createScrollProgress() {
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', () => {
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (window.scrollY / windowHeight) * 100;
    progressBar.style.width = scrolled + '%';
  });
}

// Enhanced project card interactions
function enhanceProjectCards() {
  const projectCards = document.querySelectorAll('.project-card');
  
  projectCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) scale(1)';
    });
  });
}

// Loading animation
function initLoadingAnimation() {
  document.body.style.opacity = '0';
  
  window.addEventListener('load', () => {
    document.body.style.transition = 'opacity 0.5s ease';
    document.body.style.opacity = '1';
  });
}

// DOM Content Loaded event for additional functionality
document.addEventListener("DOMContentLoaded", function () {
  const nav = document.querySelector(".nav");
  const navToggle = document.getElementById("nav-toggle");
  const navList = document.getElementById("nav-list");
  const body = document.body;

  // Initialize all features
  addAnimationStyles();
  createObserver();
  handleHeaderScroll();
  createScrollProgress();
  enhanceProjectCards();
  initLoadingAnimation();
  initPaperNavigation();
  initPaperScrollTracking(); // Separate paper navigation tracking
  
  // Delay typing animation to let page load
  setTimeout(initTypingAnimation, 500);

  if (navList) {
    // Close menu when clicking nav links
    const navLinks = navList.querySelectorAll(".nav__link");
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute('href');
        
        // Close mobile menu
        nav.classList.remove("active");
        body.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
        
        // Handle navigation
        if (href.startsWith('index.html') || href === '#') {
          // External link or home - let default behavior handle it
          return;
        } else if (href.startsWith('#')) {
          // Internal anchor link - only prevent default if target exists
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            smoothScrollToTarget(href);
          } else {
            // Section doesn't exist on this page, redirect to home with hash
            window.location.href = `index.html${href}`;
          }
        }
      });
    });
  }

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (nav && nav.classList.contains("active")) {
      if (!nav.contains(e.target) && !navToggle.contains(e.target)) {
        nav.classList.remove("active");
        body.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    }
  });

  // Handle escape key to close menu
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav && nav.classList.contains("active")) {
      nav.classList.remove("active");
      body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  // Handle all anchor links for smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = this.getAttribute('href');
      const targetElement = document.querySelector(target);
      
      if (targetElement) {
        e.preventDefault();
        smoothScrollToTarget(target);
      } else {
        // Target doesn't exist on current page, redirect to home with hash
        e.preventDefault();
        window.location.href = `index.html${target}`;
      }
    });
  });

  // Add active state to navigation based on scroll position
  const sections = document.querySelectorAll('section[id]');
  const mainNavLinks = Array.from(document.querySelectorAll('.nav__link'));

  // Only initialize main nav scroll tracking if we're not on a research page
  const isResearchPage = document.querySelector('.paper-nav') !== null;
  
  if (!isResearchPage) {
    window.addEventListener('scroll', () => {
      let current = '';
      const scrollPosition = window.scrollY + 150;

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          current = section.getAttribute('id');
        }
      });

      mainNavLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    });
  }

  // Performance optimization: Throttle scroll events
  let ticking = false;
  
  function updateOnScroll() {
    // Any scroll-based updates go here
    ticking = false;
  }
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateOnScroll);
      ticking = true;
    }
  });
});

// Error handling for missing elements
window.addEventListener('error', (e) => {
  console.warn('Portfolio Error:', e.message);
});

// Preload critical resources
function preloadResources() {
  const criticalResources = [
    'images/logo.png'
  ];
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = resource;
    document.head.appendChild(link);
  });
}

// Initialize preloading
preloadResources();

// Theme switcher (for future enhancement)
function initThemeSystem() {
  // This can be expanded later for light/dark mode toggle
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  
  prefersDark.addEventListener('change', (e) => {
    // Handle system theme changes if needed
    console.log('System theme changed to:', e.matches ? 'dark' : 'light');
  });
}

// Call theme system initialization
initThemeSystem();

// Accessibility enhancements
function enhanceAccessibility() {
  // Add focus visible polyfill behavior
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });

  // Add skip to content link
  const skipLink = document.createElement('a');
  skipLink.href = '#main';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: var(--color-accent-primary);
    color: white;
    padding: 8px;
    text-decoration: none;
    border-radius: 4px;
    z-index: 1000;
    transition: top 0.3s;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
}

// Initialize accessibility enhancements
document.addEventListener('DOMContentLoaded', enhanceAccessibility);

// Performance monitoring
function initPerformanceMonitoring() {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('Page Load Performance:', {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          totalTime: perfData.loadEventEnd - perfData.navigationStart
        });
      }, 0);
    });
  }
}

// Initialize performance monitoring
initPerformanceMonitoring();

// Service Worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Uncomment when service worker is implemented
    // navigator.serviceWorker.register('/sw.js')
    //   .then(registration => console.log('SW registered'))
    //   .catch(error => console.log('SW registration failed'));
  });
}

// Export functions for potential module use
window.PortfolioJS = {
  toggleMobileNav,
  closeMobileNav,
  smoothScrollToTarget,
  createObserver,
  handleHeaderScroll,
  initTypingAnimation,
  enhanceProjectCards,
  preloadResources,
  enhanceAccessibility,
  initPaperNavigation,
  initPaperScrollTracking
};