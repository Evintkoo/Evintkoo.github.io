document.addEventListener("DOMContentLoaded", () => {
    // Hamburger menu toggle
    const toggleButton = document.querySelector('.nav__toggle');
    const navList = document.querySelector('.nav__list');
  
    toggleButton.addEventListener('click', () => {
      toggleButton.classList.toggle('nav__toggle--active');
      navList.classList.toggle('nav__list--open');
    });
  
    // Smooth scrolling for anchor links
    const links = document.querySelectorAll('a[href^="#"]');
  
    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").slice(1);
        const targetElement = document.getElementById(targetId);
  
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop,
            behavior: "smooth",
          });
        }
  
        // Close the menu if open (for mobile navigation)
        if (navList.classList.contains('nav__list--open')) {
          toggleButton.classList.remove('nav__toggle--active');
          navList.classList.remove('nav__list--open');
        }
      });
    });
  });
  