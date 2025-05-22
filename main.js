// Global function for opening mobile nav
function toggleMobileNav() {
  const nav = document.querySelector(".nav");
  const body = document.body;
  const navToggle = document.getElementById("nav-toggle");
  
  console.log("Toggle clicked!"); // Debug log
  
  // Toggle the active class
  nav.classList.toggle("active");
  
  // Check if menu is now active
  const isActive = nav.classList.contains("active");
  console.log("Menu is active:", isActive); // Debug log

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
  
  console.log("Close button clicked!"); // Debug log
  
  // Remove active class
  nav.classList.remove("active");
  body.classList.remove("nav-open");
  
  // Update aria-expanded for accessibility
  navToggle.setAttribute("aria-expanded", "false");
}

// DOM Content Loaded event for additional functionality
document.addEventListener("DOMContentLoaded", function () {
  const nav = document.querySelector(".nav");
  const navToggle = document.getElementById("nav-toggle");
  const navList = document.getElementById("nav-list");
  const navClose = document.getElementById("nav-close");
  const body = document.body;

  console.log("Nav elements found:", { nav, navToggle, navList, navClose }); // Debug log

  if (navList) {
    // Close menu when clicking nav links
    const navLinks = navList.querySelectorAll(".nav__link");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("active");
        body.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Close menu when clicking outside (but not on close button)
  document.addEventListener("click", (e) => {
    if (nav && nav.classList.contains("active")) {
      // Don't close if clicking on nav elements
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
});