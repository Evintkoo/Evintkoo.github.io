# Project Structure

**Last Updated:** October 20, 2025  
**Version:** 2.0.0

This document describes the directory structure and organization of the Evint Leovonzko portfolio website.

---

## 📁 Directory Overview

```
evint_portofolio.github.io/
├── 📄 index.html                   Main portfolio page
├── 📄 README.md                    Project documentation
├── 📄 robots.txt                   SEO configuration
├── 📄 .gitignore                   Git ignore rules
│
├── 📂 assets/                      Static assets
│   ├── 📂 css/                     Stylesheets
│   │   ├── main.css               Core portfolio styles (layout, typography, base)
│   │   ├── components.css         Reusable UI components (cards, buttons, forms)
│   │   ├── research.css           Research page specific styles
│   │   └── themes.css             Light/dark theme variations
│   │
│   ├── 📂 js/                      JavaScript files
│   │   ├── main.js                Core application logic & navigation
│   │   ├── animations.js          Animation handlers & scroll effects
│   │   └── research.js            Research page interactivity
│   │
│   └── 📂 images/                  Image assets
│       ├── 📂 logos/              Brand logos (light/dark variants)
│       ├── 📂 diagrams/           Research diagrams & flowcharts
│       └── 📂 icons/              UI icons (if any)
│
├── 📂 research/                    Research pages
│   ├── circular-rna.html          Circular RNA classification research
│   ├── p53-mutation.html          P-53 gene mutation analysis
│   ├── crypto-stock-timing.html   Cryptocurrency vs stock market timing
│   └── gdp-clustering.html        Global GDP clustering analysis
│
├── 📂 files/                       Downloadable documents
│   ├── A Comparative Study of Equity and Crypto Timing Around Recessions and Recoveries.pdf
│   └── gdp_analysis.pdf
│
└── 📂 docs/                        Documentation
    ├── CHANGELOG.md               Version history & changes
    ├── STRUCTURE.md              This file - project structure
    ├── DEPLOYMENT.md             Deployment guide
    └── 📂 archive/               Historical documentation
        ├── CIRCULAR_RNA_DESIGN_SUMMARY.md
        ├── METHODS_ANIMATION_FIXES.md
        ├── REDESIGN_COMPARISON.md
        ├── REDESIGN_SUMMARY.md
        ├── RESEARCH_PAGE_IMPROVEMENTS.md
        ├── SIDEBAR_IMPROVEMENTS.md
        ├── SIDEBAR_TABLE_FIXES.md
        └── UX_IMPROVEMENTS.md
```

---

## 📋 File Descriptions

### Root Level Files

#### `index.html`
- **Purpose:** Main portfolio landing page
- **Dependencies:** 
  - `assets/css/main.css`
  - `assets/css/components.css`
  - `assets/js/main.js`
- **Sections:**
  - Hero/Introduction
  - About Me & Tech Stack
  - Experience Timeline
  - Featured Projects
  - Contact

#### `README.md`
- **Purpose:** Project overview and setup instructions
- **Audience:** Developers and contributors
- **Contains:** Features, structure, deployment info

#### `robots.txt`
- **Purpose:** SEO configuration for search engines
- **Contains:** Crawling rules and sitemap location

---

### Assets Directory

#### CSS Files (`assets/css/`)

##### `main.css` (~2500 lines)
**Core Portfolio Styles**
- CSS variables and design tokens
- Reset and base styles
- Typography system
- Layout grid and containers
- Header and navigation
- Hero section
- Section templates
- Footer
- Responsive breakpoints

##### `components.css` (~800 lines)
**Reusable UI Components**
- Buttons and CTAs
- Cards (project, timeline, feature)
- Forms and inputs
- Badges and tags
- Tooltips and modals
- Tech stack hexagonal grid
- Timeline components
- Table styles

##### `research.css` (~1000 lines)
**Research Page Styles**
- Research layout (sidebar + content)
- Research navigation
- Paper header/hero
- Abstract and sections
- Method cards and timelines
- Results visualizations
- References and citations
- Mobile research layout

##### `themes.css` (~200 lines)
**Theme Variations**
- Light theme overrides
- Dark theme specifics
- Theme transitions
- Color scheme utilities

#### JavaScript Files (`assets/js/`)

##### `main.js` (~600 lines)
**Core Application Logic**
```javascript
class PortfolioApp {
  - Theme management (light/dark toggle)
  - Navigation (mobile menu, smooth scroll)
  - Project filtering
  - Tech stack interactions
  - General animations
  - Performance monitoring
}
```

##### `animations.js` (~400 lines)
**Animation Handlers**
- Scroll-triggered animations
- Intersection observers
- Parallax effects
- Fade-in effects
- Counter animations
- Progress bars
- Reveal animations

##### `research.js` (~300 lines)
**Research Page Interactivity**
- Sidebar navigation
- Reading progress tracking
- Section highlighting
- Neural network visualizations
- Interactive charts
- Citation popups
- Mobile sidebar toggle

#### Images Directory (`assets/images/`)

##### `logos/`
- `logo-light.png` - White logo for dark backgrounds
- `logo-dark.png` - Dark logo for light backgrounds

##### `diagrams/`
- `Model Architecture.png` - Neural network architecture diagrams
- `Overall Method Flowchart.png` - Research methodology flowcharts
- Other research-related images

---

### Research Directory (`research/`)

Each research page follows a consistent structure:

#### `circular-rna.html`
- **Topic:** Deep Learning for Circular RNA Classification
- **Published:** URNCST Journal, 2024
- **Highlights:** 75.11% accuracy, 10x faster inference

#### `p53-mutation.html`
- **Topic:** Cancer Mutation Analysis in P-53 Gene
- **Method:** Genetic algorithms in closed environment
- **Award:** Best Research Project, UBC 2023

#### `crypto-stock-timing.html`
- **Topic:** Equity vs Cryptocurrency Market Timing
- **Focus:** Lead-lag relationships around business cycles
- **Data:** Time series analysis with GARCH models

#### `gdp-clustering.html`
- **Topic:** Global GDP Growth Pattern Analysis
- **Method:** UMAP + Self-Organizing Maps
- **Dataset:** 190 countries, 45 years (1980-2024)

---

### Files Directory (`files/`)

Downloadable research papers and documentation:
- PDFs of published research
- Supplementary materials
- Data visualizations

---

### Docs Directory (`docs/`)

#### `CHANGELOG.md`
- Version history
- Feature additions
- Bug fixes
- Breaking changes

#### `STRUCTURE.md`
- This file
- Directory organization
- File descriptions
- Architecture decisions

#### `DEPLOYMENT.md`
- GitHub Pages setup
- Deployment workflow
- Custom domain configuration
- CI/CD pipeline

#### `archive/`
- Historical documentation
- Old design notes
- Previous improvement summaries
- Kept for reference

---

## 🎨 Design System

### Color Palette

```css
/* Dark Mode (Default) */
--bg-primary: #0A0A0A;
--bg-secondary: #141414;
--text-primary: #FFFFFF;
--text-secondary: #A1A1AA;
--accent-primary: #3B82F6;

/* Light Mode */
--bg-primary: #FFFFFF;
--bg-secondary: #FAFAFA;
--text-primary: #09090B;
--text-secondary: #52525B;
--accent-primary: #2563EB;
```

### Typography

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui;
--font-mono: 'SF Mono', 'Consolas', 'Monaco', monospace;

--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
--text-6xl: 3.75rem;   /* 60px */
```

### Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-24: 6rem;     /* 96px */
```

---

## 🔧 Architecture Decisions

### Why This Structure?

1. **Separation of Concerns**
   - Assets separated by type (CSS, JS, images)
   - Research pages in dedicated folder
   - Documentation centralized

2. **Scalability**
   - Easy to add new research pages
   - Components can be reused
   - Modular CSS/JS architecture

3. **Maintainability**
   - Clear file purposes
   - Logical grouping
   - Documented structure

4. **Performance**
   - Consolidated files reduce HTTP requests
   - Better caching strategy
   - Optimized asset loading

### CSS Architecture

**Methodology:** Component-based with BEM-inspired naming

```css
/* Block */
.project { }

/* Element */
.project__title { }
.project__description { }

/* Modifier */
.project--featured { }
.project__title--large { }
```

### JavaScript Architecture

**Pattern:** Class-based with modular methods

```javascript
// Core app
class PortfolioApp {
  constructor() { }
  init() { }
  setupNavigation() { }
  setupTheme() { }
}

// Specialized modules
class AnimationController { }
class ResearchPageController { }
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
@media (max-width: 768px) { }   /* Mobile */
@media (max-width: 1024px) { }  /* Tablet */
@media (max-width: 1280px) { }  /* Small desktop */
@media (min-width: 1281px) { }  /* Large desktop */
```

---

## 🚀 Adding New Content

### Adding a New Research Page

1. Create HTML file in `research/` folder
2. Use existing research page as template
3. Update `index.html` projects section
4. Add any images to `assets/images/diagrams/`
5. Include PDF in `files/` folder if applicable

### Adding New Components

1. Add styles to `assets/css/components.css`
2. Add JavaScript (if needed) to `assets/js/main.js`
3. Document in this file
4. Test responsiveness

### Updating Styles

- **Core layout:** `assets/css/main.css`
- **UI components:** `assets/css/components.css`
- **Research pages:** `assets/css/research.css`
- **Theme colors:** `assets/css/themes.css`

---

## 📊 Performance Considerations

### Asset Loading Strategy
1. Critical CSS inlined (if needed)
2. Main CSS loaded first
3. JavaScript loaded with `defer`
4. Images lazy-loaded where possible

### Optimization Checklist
- [x] CSS consolidated
- [x] JavaScript modular
- [x] Images organized
- [ ] Build process (future)
- [ ] Image optimization pipeline (future)
- [ ] Code minification (future)

---

## 🔍 Quick Reference

### Common Tasks

**Update theme colors:**
```css
/* Edit assets/css/themes.css */
:root {
  --accent-primary: #NEW_COLOR;
}
```

**Add new project:**
```html
<!-- Edit index.html, find projects__grid -->
<article class="project" data-category="research">
  <!-- Project card markup -->
</article>
```

**Modify navigation:**
```html
<!-- Edit index.html, find nav__list -->
<li><a href="#new-section" class="nav__link">New Section</a></li>
```

---

## 📝 Notes

- All paths use forward slashes (`/`) for cross-platform compatibility
- Images should be optimized before adding
- Follow existing naming conventions
- Test on multiple devices before deploying

---

**Version:** 2.0.0  
**Last Updated:** October 20, 2025  
**Maintainer:** Evint Leovonzko
