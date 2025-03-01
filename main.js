// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const navToggle = document.querySelector('.nav__toggle');
  const navList = document.querySelector('.nav__list');
  const header = document.querySelector('.header');
  const navLinks = document.querySelectorAll('.nav__link');
  
  // Toggle mobile navigation menu
  navToggle.addEventListener('click', () => {
    navList.classList.toggle('nav__list--active');
    navToggle.classList.toggle('nav__toggle--active');
    document.body.classList.toggle('nav-open');
  });
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    const isNavOpen = navList.classList.contains('nav__list--active');
    const clickedInsideNav = navList.contains(e.target);
    const clickedOnToggle = navToggle.contains(e.target);
    
    if (isNavOpen && !clickedInsideNav && !clickedOnToggle) {
      navList.classList.remove('nav__list--active');
      navToggle.classList.remove('nav__toggle--active');
      document.body.classList.remove('nav-open');
    }
  });
  
  // Smooth scrolling for navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Close mobile menu if open
      navList.classList.remove('nav__list--active');
      navToggle.classList.remove('nav__toggle--active');
      document.body.classList.remove('nav-open');
      
      // Get the target section
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      // Calculate scroll position (accounting for fixed header)
      const headerHeight = header.offsetHeight;
      const targetPosition = targetSection.offsetTop - headerHeight;
      
      // Smooth scroll to target
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  });
  
  // Add header shadow on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
  });
  
  // Project card hover effects
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.classList.add('project-card--active');
    });
    
    card.addEventListener('mouseleave', () => {
      card.classList.remove('project-card--active');
    });
  });
  
  // Reveal sections on scroll
  const revealSections = () => {
    const sections = document.querySelectorAll('.section');
    
    sections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      
      if (sectionTop < windowHeight * 0.75) {
        section.classList.add('section--visible');
      }
    });
  };
  
  // Initial check for visible sections
  revealSections();
  
  // Check for visible sections on scroll
  window.addEventListener('scroll', revealSections);
});
