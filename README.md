# Evint Leovonzko — Personal Portfolio

Personal portfolio and research showcase for [evintleovonzko.com](https://evintkoo.github.io). Built with vanilla HTML, CSS, and JavaScript — no build step, no framework.

---

## Structure

```
/
├── index.html              # Main landing page
├── assets/
│   ├── css/
│   │   ├── main-theme.css  # Design system, layout, components
│   │   ├── components.css  # Shared UI components
│   │   └── research.css    # Research section styles
│   └── js/
│       └── animations.js   # Scroll reveal, dark mode, interactions
├── projects/               # Individual project detail pages
└── research/               # Research paper and analysis pages
```

## Sections

**Projects** — Open-source tools and applications including Kolosal AI, PyTorch Inference Framework, SOM Plus Clustering, Chain Reaction Simulation, and others.

**Research & Analysis** — First-author papers and analyses in ML, computational biology, and quantitative finance. Topics include GRN link prediction, circular RNA classification, GDP trajectory clustering, and crypto/equity timing.

## Design

- **Fonts:** Instrument Serif (display), Plus Jakarta Sans (body), JetBrains Mono (mono)
- **Theme:** Warm neutral palette with pink and sage accent colours; full dark mode via `[data-theme="dark"]`
- **Responsive:** Breakpoints at 1023px, 767px, 639px, and 479px
- **Animations:** CSS scroll reveal driven by `data-reveal` attributes

## Local Development

No dependencies or build tooling required. Serve the root directory with any static file server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## License

Source code is MIT licensed. Written content and research are all rights reserved.
