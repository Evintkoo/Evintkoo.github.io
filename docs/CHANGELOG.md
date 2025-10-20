# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-10-20

### 🎉 Major Restructure

Complete reorganization of the portfolio website for better maintainability, performance, and scalability.

### Added
- **New directory structure** with organized folders for assets, research, and documentation
- **Comprehensive documentation** including RESTRUCTURE_PLAN.md, STRUCTURE.md, and this CHANGELOG
- **assets/** folder structure separating CSS, JavaScript, and images
- **research/** folder for all research page HTML files
- **docs/** folder consolidating all documentation
- Better file naming conventions for research pages

### Changed
- **Consolidated CSS files** from 5 to 4 organized files
  - Created `assets/css/main.css` (core portfolio styles)
  - Created `assets/css/components.css` (reusable UI components)
  - Created `assets/css/research.css` (research page styles)
  - Created `assets/css/themes.css` (theme variations)
- **Consolidated JavaScript files** from 9 to 3 organized files
  - Created `assets/js/main.js` (core application logic)
  - Created `assets/js/animations.js` (animation handlers)
  - Created `assets/js/research.js` (research-specific functionality)
- **Renamed research pages** for clarity:
  - `research1.html` → `research/circular-rna.html`
  - `research2.html` → `research/p53-mutation.html`
  - `cryptovsstock.html` → `research/crypto-stock-timing.html`
  - `gdp_analysis.html` → `research/gdp-clustering.html`
- **Reorganized images** into logical subdirectories:
  - Logos moved to `assets/images/logos/`
  - Diagrams moved to `assets/images/diagrams/`

### Removed
- `index-youtube.html` (unused experimental page)
- Redundant CSS files (consolidated)
- Redundant JavaScript files (merged)
- Scattered documentation files from root (moved to docs/archive)

### Fixed
- Improved file organization for better maintainability
- Reduced HTTP requests through file consolidation
- Better code organization with clear separation of concerns
- Improved loading performance with optimized asset structure

## [1.5.0] - 2024-12-15

### Added
- Research page improvements with enhanced sidebar navigation
- Interactive animations for research papers
- Improved table styling and interactions
- Reading progress indicators
- Scroll-to-top functionality

### Changed
- Updated design system with refined color palette
- Improved responsive design for mobile devices
- Enhanced project cards with better hover effects
- Optimized performance with lazy loading

## [1.4.0] - 2024-11-20

### Added
- P-53 gene mutation analysis research page
- Circular RNA classification research page
- Interactive tech stack hexagonal grid
- Project filtering system

### Changed
- Redesigned hero section
- Updated typography and spacing
- Improved navigation system

## [1.3.0] - 2024-10-15

### Added
- GDP clustering analysis page
- Cryptocurrency vs stock market timing analysis
- Timeline component for experience section
- Smooth scroll animations

## [1.2.0] - 2024-09-10

### Added
- Dark/light theme toggle
- Mobile-responsive navigation
- Project showcase section
- Contact section with social links

## [1.1.0] - 2024-08-05

### Added
- About section with technology stack
- Experience timeline
- Responsive layout system

## [1.0.0] - 2024-07-01

### Added
- Initial portfolio website launch
- Hero section
- Basic navigation
- Project grid layout
- Footer with copyright

---

## Upcoming Features

### Planned for v2.1.0
- [ ] Build process with Webpack/Vite
- [ ] Image optimization pipeline
- [ ] Better SEO optimization
- [ ] Analytics integration
- [ ] Performance monitoring

### Future Considerations
- Static site generator (Astro/11ty)
- Blog section
- Interactive data visualizations
- Multi-language support
- Accessibility improvements

---

**Note:** This project follows semantic versioning. Major version changes indicate breaking changes to file structure or APIs, minor versions add new features, and patches are for bug fixes.
