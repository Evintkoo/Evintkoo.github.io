// Simplified Theme Toggle
class SimpleThemeToggle {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        this.applyTheme(this.theme);
        this.createToggleButton();
    }

    createToggleButton() {
        // Check if button already exists to prevent duplicates
        if (document.querySelector('.theme-toggle')) {
            console.log('Theme toggle already exists, skipping creation');
            return;
        }

        const header = document.querySelector('.header .container');
        if (!header) {
            console.warn('Header container not found');
            return;
        }

        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.setAttribute('aria-label', 'Toggle theme');
        themeToggle.innerHTML = `
            <svg class="theme-icon moon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Z"/>
            </svg>
            <svg class="theme-icon sun" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                <path d="M12,2A1,1,0,0,0,11,3V4a1,1,0,0,0,2,0V3A1,1,0,0,0,12,2ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM4,11H3a1,1,0,0,0,0,2H4a1,1,0,0,0,0-2ZM17.66,6.42,18.36,5.64a1,1,0,0,0-1.41-1.41L16.24,5.05a1,1,0,1,0,1.42,1.37ZM6.42,17.66,5.64,18.36a1,1,0,0,0,1.41,1.41l.71-.71a1,1,0,0,0-1.34-1.4ZM17.66,17.56l.71.71a1,1,0,0,0,1.41-1.41l-.71-.71a1,1,0,0,0-1.41,1.41ZM6.42,6.42a1,1,0,0,0-1.41-1.41L4.3,5.64A1,1,0,0,0,5.64,7.05ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
            </svg>
        `;

        // Add to nav area
        const nav = header.querySelector('.nav');
        if (nav) {
            nav.appendChild(themeToggle);
        } else {
            // Fallback: add directly to header container
            header.appendChild(themeToggle);
        }

        // Update icons based on current theme
        this.updateIcons(themeToggle);

        // Add click event
        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
            this.updateIcons(themeToggle);
        });

        this.toggleButton = themeToggle;
    }

    updateIcons(button) {
        const moonIcon = button.querySelector('.moon');
        const sunIcon = button.querySelector('.sun');
        
        if (this.theme === 'light') {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        } else {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        }
    }

    toggleTheme() {
        console.log('Theme toggle requested, current theme:', this.theme);
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        console.log('Switching to theme:', this.theme);
        this.applyTheme(this.theme);
        localStorage.setItem('theme', this.theme);
        console.log('Theme saved to localStorage:', this.theme);
    }

    applyTheme(theme) {
        console.log('Applying theme:', theme);
        const root = document.documentElement;
        const logo = document.querySelector('.logo__image');

        if (theme === 'light') {
            root.classList.add('light');
            if (logo) {
                logo.src = 'images/logo-dark.png';
                logo.alt = 'Evint Leovonzko - Dark Logo';
            }
        } else {
            root.classList.remove('light');
            if (logo) {
                logo.src = 'images/logo-light.png';
                logo.alt = 'Evint Leovonzko - Light Logo';
            }
        }

        this.theme = theme;
        console.log('Theme applied successfully:', theme);
    }

    getCurrentTheme() {
        return this.theme;
    }
}

// Initialize immediately for faster theme application
(function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    console.log('Applying saved theme immediately:', savedTheme);
    
    if (savedTheme === 'light') {
        document.documentElement.classList.add('light');
    } else {
        document.documentElement.classList.remove('light');
    }
})();

// Initialize theme toggle when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing theme toggle...');
    
    // Prevent multiple initializations
    if (window.themeToggle) {
        console.log('Theme toggle already initialized');
        return;
    }
    
    window.themeToggle = new SimpleThemeToggle();
    console.log('Theme toggle initialized successfully');
});

// Export for external use
window.SimpleThemeToggle = SimpleThemeToggle;
