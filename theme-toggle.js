// Theme Toggle Functionality
class ThemeToggle {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        // Apply saved theme on load
        this.applyTheme(this.theme);
        
        // Create and inject theme toggle button
        this.createToggleButton();
        
        // Add event listeners
        this.addEventListeners();
        
        // Set initial logo based on theme
        this.updateLogo(this.theme);
    }

    createToggleButton() {
        const toggleWrapper = document.createElement('div');
        toggleWrapper.className = 'theme-toggle-wrapper';
        
        const toggleButton = document.createElement('button');
        toggleButton.className = `theme-toggle ${this.theme === 'light' ? 'light' : ''}`;
        toggleButton.setAttribute('aria-label', 'Toggle dark/light mode');
        toggleButton.innerHTML = `
            <svg class="theme-icon moon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
            </svg>
            <svg class="theme-icon sun" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
            </svg>
        `;
        
        toggleWrapper.appendChild(toggleButton);
        
        // Insert the toggle button into the header
        const headerContainer = document.querySelector('.header__container');
        if (headerContainer) {
            // Check if nav section already exists
            let navSection = headerContainer.querySelector('.header__nav-section');
            
            if (!navSection) {
                // Create nav section if it doesn't exist
                navSection = document.createElement('div');
                navSection.className = 'header__nav-section';
                
                // Move existing nav into the nav section
                const existingNav = headerContainer.querySelector('.nav');
                if (existingNav) {
                    navSection.appendChild(existingNav);
                }
                
                headerContainer.appendChild(navSection);
            }
            
            // Check if theme toggle already exists to avoid duplicates
            if (!navSection.querySelector('.theme-toggle-wrapper')) {
                navSection.appendChild(toggleWrapper);
            }
        }
        
        // Also add the theme toggle to mobile nav list for mobile accessibility
        this.addMobileThemeToggle();
        
        this.toggleButton = toggleButton;
    }

    addMobileThemeToggle() {
        const navList = document.querySelector('.nav__list');
        if (navList && !navList.querySelector('.theme-toggle-mobile')) {
            const mobileToggleWrapper = document.createElement('li');
            mobileToggleWrapper.className = 'theme-toggle-mobile';
            
            const mobileToggleButton = document.createElement('button');
            mobileToggleButton.className = `theme-toggle theme-toggle--mobile ${this.theme === 'light' ? 'light' : ''}`;
            mobileToggleButton.setAttribute('aria-label', 'Toggle dark/light mode');
            mobileToggleButton.innerHTML = `
                <svg class="theme-icon moon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
                </svg>
                <svg class="theme-icon sun" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
                </svg>
                <span class="theme-toggle__text">Toggle Theme</span>
            `;
            
            mobileToggleWrapper.appendChild(mobileToggleButton);
            navList.appendChild(mobileToggleWrapper);
            
            // Add event listener for mobile toggle
            mobileToggleButton.addEventListener('click', () => {
                this.toggleTheme();
                // Close mobile menu after theme toggle for better UX
                setTimeout(() => {
                    this.closeMobileNav();
                }, 150);
            });
            
            this.mobileToggleButton = mobileToggleButton;
        }
    }

    closeMobileNav() {
        const nav = document.querySelector('.nav');
        const body = document.body;
        const navToggle = document.getElementById('nav-toggle');
        
        if (nav) {
            nav.classList.remove('active');
        }
        if (body) {
            body.classList.remove('nav-open');
        }
        if (navToggle) {
            navToggle.setAttribute('aria-expanded', 'false');
        }
    }

    addEventListeners() {
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener((e) => {
            if (!localStorage.getItem('theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });

        // Listen for window resize to handle responsive behavior
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    toggleTheme() {
        // Add transition class before changing theme
        document.documentElement.classList.add('theme-transitioning');
        
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.theme);
        localStorage.setItem('theme', this.theme);
        
        // Remove transition class after transition completes
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
            this.forceStyleUpdate();
        }, 350);
    }

    applyTheme(theme) {
        const root = document.documentElement;
        const toggleButton = this.toggleButton;
        const mobileToggleButton = this.mobileToggleButton;
        
        if (theme === 'light') {
            root.classList.add('light');
            if (toggleButton) {
                toggleButton.classList.add('light');
            }
            if (mobileToggleButton) {
                mobileToggleButton.classList.add('light');
            }
        } else {
            root.classList.remove('light');
            if (toggleButton) {
                toggleButton.classList.remove('light');
            }
            if (mobileToggleButton) {
                mobileToggleButton.classList.remove('light');
            }
        }
        
        this.theme = theme;
        
        // Update logo based on theme
        this.updateLogo(theme);
        
        // Ensure body scrolling is enabled (safeguard against stuck scroll prevention)
        const nav = document.querySelector('.nav');
        if (nav && !nav.classList.contains('active')) {
            document.body.classList.remove('nav-open');
        }
        
        // Force update of header and navigation elements
        this.forceStyleUpdate();
    }

    updateLogo(theme) {
        const logoImages = document.querySelectorAll('.logo__image');
        const faviconLink = document.querySelector('link[rel="icon"]');
        const appleIconLink = document.querySelector('link[rel="apple-touch-icon"]');
        
        logoImages.forEach(logo => {
            // Add smooth transition effect
            logo.style.opacity = '0.7';
            
            setTimeout(() => {
                if (theme === 'light') {
                    // Use dark logo on light background
                    logo.src = 'images/logo-dark.png';
                    logo.alt = 'Evint Leovonzko - Dark Logo';
                } else {
                    // Use light logo on dark background
                    logo.src = 'images/logo-light.png';
                    logo.alt = 'Evint Leovonzko - Light Logo';
                }
                
                // Restore opacity after image loads
                logo.onload = () => {
                    logo.style.opacity = '1';
                };
            }, 75);
        });
        
        // Update favicon and apple touch icon
        if (faviconLink) {
            faviconLink.href = theme === 'light' ? 'images/logo-dark.png' : 'images/logo-light.png';
        }
        
        if (appleIconLink) {
            appleIconLink.href = theme === 'light' ? 'images/logo-dark.png' : 'images/logo-light.png';
        }
    }

    forceStyleUpdate() {
        // Force recalculation of header background
        const header = document.querySelector('.header');
        if (header) {
            const computedStyle = window.getComputedStyle(header);
            const currentBg = computedStyle.backgroundColor;
            header.style.backgroundColor = 'transparent';
            // Force reflow
            header.offsetHeight;
            header.style.backgroundColor = '';
        }
        
        // Force recalculation of paper navigation background
        const paperNavs = document.querySelectorAll('.paper-nav');
        paperNavs.forEach(nav => {
            const computedStyle = window.getComputedStyle(nav);
            const currentBg = computedStyle.backgroundColor;
            nav.style.backgroundColor = 'transparent';
            // Force reflow
            nav.offsetHeight;
            nav.style.backgroundColor = '';
        });
    }

    // Get current theme
    getCurrentTheme() {
        return this.theme;
    }

    handleResize() {
        // Close mobile nav if window is resized to desktop size
        if (window.innerWidth > 768) {
            this.closeMobileNav();
        }
    }
}

// Initialize theme toggle when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = new ThemeToggle();
    
    // Make it globally accessible if needed
    window.themeToggle = themeToggle;
});

// Handle theme for pages that load before DOMContentLoaded
(function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light');
    }
    
    // Set initial logo based on saved theme
    document.addEventListener('DOMContentLoaded', () => {
        const theme = savedTheme || 'dark';
        const logoImages = document.querySelectorAll('.logo__image');
        const faviconLink = document.querySelector('link[rel="icon"]');
        const appleIconLink = document.querySelector('link[rel="apple-touch-icon"]');
        
        logoImages.forEach(logo => {
            // Set initial logo without transition for faster loading
            if (theme === 'light') {
                logo.src = 'images/logo-dark.png';
                logo.alt = 'Evint Leovonzko - Dark Logo';
            } else {
                logo.src = 'images/logo-light.png';
                logo.alt = 'Evint Leovonzko - Light Logo';
            }
        });
        
        // Update favicon and apple touch icon
        if (faviconLink) {
            faviconLink.href = theme === 'light' ? 'images/logo-dark.png' : 'images/logo-light.png';
        }
        
        if (appleIconLink) {
            appleIconLink.href = theme === 'light' ? 'images/logo-dark.png' : 'images/logo-light.png';
        }
    });
})();
