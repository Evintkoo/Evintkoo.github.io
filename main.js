// Modern Portfolio JavaScript - Simplified

class Portfolio {
  constructor() {
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupProjectFilter();
    this.setupAnimations();
    this.setupSmoothScrolling();
    this.setupTheme();
    this.setupResearchNavigation();
  }

  // Navigation functionality
  setupNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navList = document.querySelector('.nav__list');
    const navLinks = document.querySelectorAll('.nav__link');
    const body = document.body;

    // Mobile menu toggle
    if (navToggle) {
      navToggle.addEventListener('click', () => {
        const isActive = navList.classList.contains('active');
        
        navList.classList.toggle('active');
        navToggle.classList.toggle('active');
        body.classList.toggle('no-scroll', !isActive);
      });
    }

    // Close mobile menu when clicking links
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navList.classList.remove('active');
        navToggle.classList.remove('active');
        body.classList.remove('no-scroll');
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav') && navList.classList.contains('active')) {
        navList.classList.remove('active');
        navToggle.classList.remove('active');
        body.classList.remove('no-scroll');
      }
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navList.classList.contains('active')) {
        navList.classList.remove('active');
        navToggle.classList.remove('active');
        body.classList.remove('no-scroll');
      }
    });
  }

  // Project filtering
  setupProjectFilter() {
    console.log('Setting up project filter...');
    
    const filterButtons = document.querySelectorAll('.filter__btn');
    const projects = document.querySelectorAll('.project');

    console.log('Filter setup:', { filterButtons: filterButtons.length, projects: projects.length });

    if (!filterButtons.length || !projects.length) {
      console.warn('Filter buttons or projects not found');
      return;
    }

    // Simple event delegation approach
    const projectsFilter = document.querySelector('.projects__filter');
    if (projectsFilter) {
      projectsFilter.addEventListener('click', (e) => {
        const button = e.target.closest('.filter__btn');
        if (!button) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const filter = button.dataset.filter;
        console.log('Filter button clicked:', filter);

        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('filter__btn--active'));
        button.classList.add('filter__btn--active');

        // Filter projects
        let visibleCount = 0;
        projects.forEach(project => {
          const category = project.dataset.category;
          const shouldShow = filter === 'all' || category === filter;

          if (shouldShow) {
            visibleCount++;
            project.classList.remove('hidden');
            project.style.display = 'block';
          } else {
            project.classList.add('hidden');
            project.style.display = 'none';
          }
        });

        console.log(`Filtered by: ${filter}, Visible: ${visibleCount}/${projects.length}`);
      });
    }

    // Initialize - show all projects
    projects.forEach(project => {
      project.classList.remove('hidden');
      project.style.display = 'block';
    });

    console.log('Project filter setup complete');
  }

  // Animation setup
  setupAnimations() {
    // Intersection Observer for fade-in animations
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

    // Observe elements for animation
    const animatedElements = document.querySelectorAll(`
      .project,
      .skill,
      .contact__link,
      .about__text,
      .skills__category
    `);

    animatedElements.forEach(el => observer.observe(el));

    // Header scroll effect - removed to prevent theme conflicts
    // The header styling is handled by CSS variables and theme toggle
  }

  // Smooth scrolling for anchor links
  setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
          const headerHeight = document.querySelector('.header').offsetHeight;
          const targetPosition = target.offsetTop - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // Theme management - handled by theme-toggle.js
  setupTheme() {
    // Theme functionality is handled by the separate theme-toggle.js file
    // This prevents duplicate theme toggle buttons and conflicts
    console.log('Theme setup skipped - handled by theme-toggle.js');
  }

  // Research paper navigation
  setupResearchNavigation() {
    const sidebar = document.querySelector('.research-sidebar');
    const floatingSidebar = document.getElementById('floating-sidebar');
    const sidebarToggle = document.querySelector('.research-sidebar-toggle');
    const sidebarLinks = document.querySelectorAll('.research-sidebar__link');
    const sections = document.querySelectorAll('.research-section');
    const sidebarList = document.querySelector('.research-sidebar__list');
    const researchSections = document.querySelectorAll('#abstract, #introduction, #methodology, #clusters, #policy, #insights, #conclusion');

    // If not on research page, return early
    if (!sidebar && !floatingSidebar) return;

    // Setup floating sidebar behavior
    this.setupFloatingSidebar(floatingSidebar);

    // Mobile sidebar toggle
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        sidebar?.classList.toggle('active');
        document.body.classList.toggle('no-scroll', sidebar?.classList.contains('active'));
      });
    }

    // Close sidebar when clicking outside (mobile)
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024 && 
          sidebar?.classList.contains('active') && 
          !sidebar.contains(e.target) && 
          !sidebarToggle?.contains(e.target)) {
        sidebar.classList.remove('active');
        document.body.classList.remove('no-scroll');
      }
    });

    // Setup progress bar tracking
    this.setupProgressBar(sidebarList, researchSections);

    // Active section highlighting - synchronized with progress bar
    const observerOptions = {
      threshold: [0, 0.1, 0.25, 0.3, 0.5, 0.75, 1],
      rootMargin: '-60px 0px -40% 0px'
    };

    let activeSection = null;

    const sectionObserver = new IntersectionObserver((entries) => {
      const visibleSections = [];
      
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
          visibleSections.push({
            element: entry.target,
            ratio: entry.intersectionRatio,
            id: entry.target.id
          });
        }
      });

      // Sort by intersection ratio and find the most visible section
      visibleSections.sort((a, b) => b.ratio - a.ratio);
      
      if (visibleSections.length > 0) {
        const mostVisible = visibleSections[0];
        const activeId = mostVisible.id;
        
        // Only update if it's a different section
        if (activeSection !== activeId) {
          activeSection = activeId;
          
          console.log('Active section changed to:', activeId); // Debug log
          
          // Update sidebar links
          sidebarLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${activeId}`) {
              link.classList.add('active');
              console.log('Added active class to:', link.textContent.trim()); // Debug log
            }
          });

          // Update progress dots (if they exist)
          this.updateProgressDots(activeId);
        }
      }
    }, observerOptions);

    // Observe all research sections
    researchSections.forEach(section => {
      if (section) {
        sectionObserver.observe(section);
      }
    });

    // Handle sidebar link clicks
    sidebarLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').slice(1);
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
          const headerHeight = document.querySelector('.header').offsetHeight;
          const targetPosition = targetSection.offsetTop - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Close mobile sidebar after click
          if (window.innerWidth <= 1024) {
            sidebar?.classList.remove('active');
            document.body.classList.remove('no-scroll');
          }
        }
      });
    });

    // Handle window resize
    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth > 1024) {
        sidebar?.classList.remove('active');
        document.body.classList.remove('no-scroll');
      }
    }, 250));

    // Make progress dots clickable
    this.setupProgressDotNavigation();

    // Abstract section progress tracking
    this.setupAbstractProgress();
  }

  // Setup progress bar functionality
  setupProgressBar(sidebarList, sections) {
    if (!sidebarList || !sections.length) return;

    // Filter sections to only include research sections with IDs
    const researchSections = Array.from(sections).filter(section => {
      const id = section.id;
      return id && ['abstract', 'introduction', 'methodology', 'clusters', 'policy', 'insights', 'conclusion'].includes(id);
    });

    if (!researchSections.length) return;

    const sectionOrder = ['abstract', 'introduction', 'methodology', 'clusters', 'policy', 'insights', 'conclusion'];
    
    // Define the range for progress bar: from methodology (index 2) to insights (index 5)
    const progressStartIndex = 2; // methodology
    const progressEndIndex = 5;   // insights
    const progressSections = sectionOrder.slice(progressStartIndex, progressEndIndex + 1);
    
    const updateProgressBar = () => {
      const scrollTop = window.pageYOffset;
      const headerHeight = document.querySelector('.header')?.offsetHeight || 70;
      const viewportHeight = window.innerHeight;
      
      let currentSectionIndex = 0;
      let maxProgress = 0;
      
      // Calculate progress based on which sections are visible and how much
      for (let i = 0; i < researchSections.length; i++) {
        const section = researchSections[i];
        const sectionTop = section.offsetTop - headerHeight;
        const sectionBottom = sectionTop + section.offsetHeight;
        const sectionHeight = section.offsetHeight;
        
        // Check if section is in viewport
        if (scrollTop + viewportHeight > sectionTop && scrollTop < sectionBottom) {
          // Calculate how much of the section is visible
          const visibleTop = Math.max(scrollTop, sectionTop);
          const visibleBottom = Math.min(scrollTop + viewportHeight, sectionBottom);
          const visibleHeight = visibleBottom - visibleTop;
          const visibilityRatio = visibleHeight / Math.min(sectionHeight, viewportHeight);
          
          // If section is significantly visible (more than 30%), consider it active
          if (visibilityRatio > 0.3 || (scrollTop + viewportHeight * 0.3 >= sectionTop && scrollTop <= sectionTop + sectionHeight * 0.5)) {
            currentSectionIndex = i;
            
            // Calculate fine-grained progress within the section
            const sectionProgress = Math.max(0, Math.min(1, (scrollTop + viewportHeight * 0.3 - sectionTop) / (sectionHeight * 0.7)));
            maxProgress = i + sectionProgress;
          }
        }
        
        // If we've scrolled past the section completely
        if (scrollTop > sectionBottom - viewportHeight * 0.3) {
          currentSectionIndex = Math.min(i + 1, researchSections.length - 1);
          maxProgress = Math.min(i + 1, researchSections.length - 1);
        }
      }
      
      // Ensure we don't exceed the number of sections
      currentSectionIndex = Math.min(currentSectionIndex, researchSections.length - 1);
      maxProgress = Math.min(maxProgress, researchSections.length - 1);
      
      // Use the higher of currentSectionIndex or maxProgress for smoother progression
      const finalProgress = Math.max(currentSectionIndex, Math.floor(maxProgress));
      
      // Convert to progress bar range (methodology to insights only)
      let progressBarValue = 0;
      if (finalProgress >= progressStartIndex && finalProgress <= progressEndIndex) {
        // We're in the tracked range
        progressBarValue = finalProgress - progressStartIndex;
      } else if (finalProgress < progressStartIndex) {
        // Before methodology - no progress
        progressBarValue = 0;
      } else {
        // After insights - full progress (3 since we count from 0)
        progressBarValue = 3;
      }
      
      console.log('Progress Update:', {
        currentSectionIndex,
        maxProgress,
        finalProgress,
        progressBarValue,
        currentSection: researchSections[currentSectionIndex]?.id || 'none'
      }); // Debug log
      
      // Update progress bar with smooth transition
      const currentProgress = parseInt(sidebarList.getAttribute('data-progress') || '0');
      if (currentProgress !== progressBarValue) {
        sidebarList.classList.add('progress-updating');
        sidebarList.setAttribute('data-progress', progressBarValue.toString());
        console.log('Updated progress bar to:', progressBarValue); // Debug log
        
        // Remove updating class after animation
        setTimeout(() => {
          sidebarList.classList.remove('progress-updating');
        }, 800);
      }
    };

    // Throttled scroll listener for better performance
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgressBar();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', debounce(updateProgressBar, 100));
    updateProgressBar(); // Initial call
  }

  // Setup clickable progress dots
  setupProgressDotNavigation() {
    const progressDots = document.querySelectorAll('.sidebar-progress .progress-dot');
    const progressSections = ['methodology', 'clusters', 'policy', 'insights'];

    progressDots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        const targetId = progressSections[index];
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
          const headerHeight = document.querySelector('.header').offsetHeight;
          const targetPosition = targetSection.offsetTop - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });

      // Add hover effect
      dot.addEventListener('mouseenter', () => {
        dot.style.transform = 'scale(1.1)';
      });

      dot.addEventListener('mouseleave', () => {
        if (!dot.classList.contains('active')) {
          dot.style.transform = 'scale(1)';
        }
      });
    });
  }

  // Update progress dots based on current section
  updateProgressDots(activeId) {
    const progressDots = document.querySelectorAll('.sidebar-progress .progress-dot');
    if (!progressDots.length) return;

    // Define section order for progress bar (methodology to insights)
    const progressSections = ['methodology', 'clusters', 'policy', 'insights'];
    const activeIndex = progressSections.indexOf(activeId);

    if (activeIndex !== -1) {
      progressDots.forEach((dot, index) => {
        if (index <= activeIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });

      // Update progress fill
      const progressFill = document.querySelector('.sidebar-progress .progress-fill');
      if (progressFill) {
        const progressPercent = ((activeIndex + 1) / progressSections.length) * 100;
        progressFill.style.width = `${progressPercent}%`;
      }
    } else {
      // If not in progress range, show appropriate state
      const fullSectionOrder = ['abstract', 'introduction', 'methodology', 'clusters', 'policy', 'insights', 'conclusion'];
      const fullActiveIndex = fullSectionOrder.indexOf(activeId);
      
      if (fullActiveIndex < 2) {
        // Before methodology - no progress
        progressDots.forEach(dot => dot.classList.remove('active'));
        const progressFill = document.querySelector('.sidebar-progress .progress-fill');
        if (progressFill) progressFill.style.width = '0%';
      } else if (fullActiveIndex > 5) {
        // After insights - full progress
        progressDots.forEach(dot => dot.classList.add('active'));
        const progressFill = document.querySelector('.sidebar-progress .progress-fill');
        if (progressFill) progressFill.style.width = '100%';
      }
    }
  }

  // Floating sidebar behavior - Simplified for grid layout
  setupFloatingSidebar(floatingSidebar) {
    if (!floatingSidebar) return;

    const sidebarContainer = document.querySelector('.research-sidebar-container');
    const sidebarToggle = document.querySelector('.research-sidebar-toggle');
    
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        // On mobile, slide the sidebar container in/out
        if (window.innerWidth <= 1024) {
          const isVisible = sidebarContainer?.classList.contains('show');
          sidebarContainer?.classList.toggle('show', !isVisible);
          
          // Add body class to prevent scrolling when sidebar is open on mobile
          document.body.classList.toggle('no-scroll', !isVisible);
        }
      });
    }

    // Handle window resize to ensure proper sidebar behavior
    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth > 1024) {
        // On desktop, always show sidebar and remove mobile classes
        sidebarContainer?.classList.remove('show');
        document.body.classList.remove('no-scroll');
      } else {
        // On mobile, hide sidebar by default
        sidebarContainer?.classList.remove('show');
        document.body.classList.remove('no-scroll');
      }
    }, 100));

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024 && 
          sidebarContainer?.classList.contains('show') && 
          !sidebarContainer.contains(e.target) && 
          !sidebarToggle?.contains(e.target)) {
        sidebarContainer.classList.remove('show');
        document.body.classList.remove('no-scroll');
      }
    });

    // Add smooth scroll behavior when clicking sidebar links
    const sidebarLinks = floatingSidebar.querySelectorAll('.research-sidebar__link');
    sidebarLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').slice(1);
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
          const headerHeight = document.querySelector('.header').offsetHeight;
          const targetPosition = targetSection.offsetTop - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Close mobile sidebar after click
          if (window.innerWidth <= 1024) {
            sidebarContainer?.classList.remove('show');
            document.body.classList.remove('no-scroll');
          }
        }
      });
    });

    // Initial setup based on screen size
    if (window.innerWidth <= 1024) {
      sidebarContainer?.classList.remove('show');
    }
  }

  // Abstract section progress indicator
  setupAbstractProgress() {
    const abstractSection = document.getElementById('abstract');
    const progressFill = document.querySelector('.sidebar-progress .progress-fill');
    const progressDots = document.querySelectorAll('.sidebar-progress .progress-dot');
    
    if (!abstractSection || !progressFill || !progressDots.length) return;

    const abstractItems = abstractSection.querySelectorAll('.abstract-item');
    
    // Function to update progress based on scroll position
    const updateProgress = () => {
      const sectionRect = abstractSection.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const headerHeight = document.querySelector('.header').offsetHeight || 70;
      
      // Calculate how much of the section is visible
      const sectionTop = sectionRect.top - headerHeight;
      const sectionBottom = sectionRect.bottom - headerHeight;
      const sectionHeight = abstractSection.offsetHeight;
      
      // Progress calculation
      let progress = 0;
      
      if (sectionTop <= 0 && sectionBottom >= 0) {
        // Section is in view
        const visibleHeight = Math.min(windowHeight - headerHeight, sectionBottom) - Math.max(0, sectionTop);
        progress = Math.max(0, Math.min(1, (windowHeight - headerHeight - sectionTop) / sectionHeight));
      } else if (sectionBottom < 0) {
        // Section is fully scrolled past
        progress = 1;
      }
      
      // Update progress fill
      progressFill.style.width = `${progress * 100}%`;
      
      // Update dots based on abstract items visibility
      abstractItems.forEach((item, index) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.top + itemRect.height / 2;
        const viewportCenter = windowHeight / 2;
        
        if (index < progressDots.length) {
          if (itemCenter <= viewportCenter) {
            progressDots[index].classList.add('active');
          } else {
            progressDots[index].classList.remove('active');
          }
        }
      });
    };

    // Throttled scroll listener for better performance
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    updateProgress(); // Initial call
  }
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Performance optimizations
function preloadImages() {
  const images = ['images/logo-light.png', 'images/logo-dark.png'];
  images.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Initializing Portfolio');
  
  // Debug: Check if elements exist
  const filterButtons = document.querySelectorAll('.filter__btn');
  const projects = document.querySelectorAll('.project');
  console.log('Found elements:', {
    filterButtons: filterButtons.length,
    projects: projects.length,
    filterButtonsData: Array.from(filterButtons).map(btn => btn.dataset.filter)
  });
  
  new Portfolio();
  preloadImages();
  
  // Add loading animation
  document.body.style.opacity = '0';
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity = '1';
  });
  
  // Initialize animated buttons
  initAnimatedButtons();
});

// Animated Button Functionality
function initAnimatedButtons() {
  const animatedButtons = document.querySelectorAll('.animated-button');
  
  animatedButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Add success class
      this.classList.add('success');
      
      // Remove success class after 3 seconds
      setTimeout(() => {
        this.classList.remove('success');
      }, 3000);
    });
  });
}

// Error handling
window.addEventListener('error', (e) => {
  console.warn('Portfolio error:', e.message);
});

// Performance monitoring
if ('performance' in window) {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    console.log('Page load time:', perfData.loadEventEnd - perfData.navigationStart, 'ms');
  });
}

// Export for external use
window.Portfolio = Portfolio;
