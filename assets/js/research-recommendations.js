(function () {
  const PAPERS = [
    {
      slug: 'keynesian-abm-fiscal',
      title: 'Fiscal Stabilisers, Minsky Dynamics, and Distributional Outcomes in a Keynesian ABM',
      subtitle: 'Computational Economics · Agent-Based Modelling',
      desc: 'Daily-frequency, 10,000-agent closed-economy ABM reproducing four stylised macroeconomic facts. Novel result: ZLB binds in 93.7% of simulation periods, mirroring post-1998 Japan and post-2013 Euro-area.',
      tags: ['economics', 'abm', 'macroeconomics', 'monte-carlo', 'rust', 'simulation'],
      url: '../research/keynesian-abm-fiscal.html',
    },
    {
      slug: 'keynesian-abm-coordination',
      title: 'Individual Optimality and Collective Failure in a Keynesian Agent-Based Model',
      subtitle: 'Computational Economics · Coordination Failure',
      desc: 'Grid search identifies survival-maximising strategies for households, firms, and banks. The all-best economy produces GDP growth −65% and firm bankruptcies 17× higher.',
      tags: ['economics', 'abm', 'macroeconomics', 'coordination', 'grid-search', 'simulation'],
      url: '../research/keynesian-abm-coordination.html',
    },
    {
      slug: 'som-tsk',
      title: 'SOM-TSK: Topology-Seeded Clustering Framework',
      subtitle: 'Machine Learning · Clustering',
      desc: 'A clustering framework exploiting SOM topology to seed deterministic K-means — 6 wins, 0 losses vs KMeans++ across 24 benchmark datasets.',
      tags: ['ml', 'clustering', 'som', 'kmeans', 'rust', 'unsupervised'],
      url: '../research/som-tsk.html',
    },
    {
      slug: 'grasp',
      title: 'GRASP: Graph-Routed Adaptive Spectral Partitioning',
      subtitle: 'Machine Learning · Clustering',
      desc: 'Autonomous topology-aware clustering pipeline: GNG topology → normalised spectral gap → oracle routing to 6 specialist algorithms. Parameter-free, processes 50K points in 140ms.',
      tags: ['ml', 'clustering', 'spectral', 'graph', 'gng', 'unsupervised'],
      url: '../research/grasp.html',
    },
    {
      slug: 'grn-dual-vs-cross-encoder',
      title: 'Dual-Encoder vs Cross-Encoder for GRN Link Prediction',
      subtitle: 'Computational Biology · IEEE TNNLS',
      desc: 'Parameter-matched comparison of dual-encoder and cross-encoder architectures across four imbalance regimes — submitted to IEEE TNNLS.',
      tags: ['biology', 'grn', 'deep-learning', 'neural-architecture', 'scrnaseq', 'ieee'],
      url: '../research/grn-dual-vs-cross-encoder.html',
    },
    {
      slug: 'grn-modular-vs-monolithic',
      title: 'Modular vs Monolithic Architectures for GRN Edge Prediction',
      subtitle: 'Computational Biology · Research',
      desc: 'Diagnosed three critical gradient failures in two-tower GRN models — cross-encoder achieves AUROC 0.904 vs 0.810 with far greater imbalance robustness.',
      tags: ['biology', 'grn', 'deep-learning', 'neural-architecture', 'scrnaseq', 'gradient'],
      url: '../research/grn-modular-vs-monolithic.html',
    },
    {
      slug: 'grn-two-tower',
      title: 'Two-Tower Hybrid Embedding Networks for GRN Inference',
      subtitle: 'Computational Biology · scRNA-seq',
      desc: 'Pure-Rust two-tower MLP learning entity embeddings and cell-type expression profiles to predict TF–gene interactions — 83.06% ensemble accuracy, CPU-trainable.',
      tags: ['biology', 'grn', 'deep-learning', 'rust', 'scrnaseq', 'embedding'],
      url: '../research/grn-two-tower.html',
    },
    {
      slug: 'circular-rna',
      title: 'Deep Learning for Circular RNA Classification',
      subtitle: 'Computational Biology · Published',
      desc: 'Published ANN pipeline classifying circRNA–disease associations with Gaussian blur preprocessing — 75% accuracy at 0.14ms per prediction.',
      tags: ['biology', 'deep-learning', 'rna', 'ann', 'classification', 'published'],
      url: '../research/circular-rna.html',
    },
    {
      slug: 'functional-group-analysis',
      title: 'Functional Group Analysis of Drug-Like Chemical Space',
      subtitle: 'Cheminformatics · Research',
      desc: 'GAT-VGAE + SOM pipeline analysing 249,455 ZINC15 molecules with counterfactual QED decomposition — mapping functional group enrichment across drug-like chemical space.',
      tags: ['cheminformatics', 'graph-neural-network', 'som', 'molecules', 'drug-discovery', 'ml'],
      url: '../research/functional-group-analysis.html',
    },
    {
      slug: 'global-gdp-patterns',
      title: 'Clustering Global GDP Trajectories (1980–2024)',
      subtitle: 'Economics · Analysis',
      desc: 'Unsupervised clustering of 190 countries over 45 years reveals four distinct economic paths — from stagnation to exponential growth.',
      tags: ['economics', 'clustering', 'gdp', 'som', 'umap', 'unsupervised'],
      url: '../research/global-gdp-patterns.html',
    },
    {
      slug: 'crypto-stock-timing',
      title: 'Leading or Lagging? Equity and Crypto Timing Around Recessions',
      subtitle: 'Finance · Analysis',
      desc: 'Cross-correlation and Granger causality analysis across five business cycles — do crypto markets lead or lag equities around recessions?',
      tags: ['finance', 'crypto', 'equity', 'time-series', 'granger', 'recession'],
      url: '../research/crypto-stock-timing.html',
    },
    {
      slug: 'bitcoin-portfolio-allocation',
      title: 'Bitcoin Portfolio Allocation Analysis',
      subtitle: 'Finance · Analysis',
      desc: 'Optimal BTC sizing via Risk-Budget Framework. Component Risk Contribution analysis across five portfolio profiles finds 10–12% is the evidence-based ceiling.',
      tags: ['finance', 'bitcoin', 'portfolio', 'risk', 'optimization'],
      url: '../research/bitcoin-portfolio-allocation.html',
    },
    {
      slug: 'p53-mutation',
      title: 'Cancer Leading Mutation DNA of P-53 Gene',
      subtitle: 'Computational Biology · Research',
      desc: 'Analysis of P53 mutation patterns and their role as cancer-leading mutations — exploring the relationship between DNA mutations and cancer development.',
      tags: ['biology', 'cancer', 'dna', 'mutation', 'genomics'],
      url: '../research/p53-mutation.html',
    },
  ];

  function currentSlug() {
    const match = window.location.pathname.match(/research\/([^/]+)\.html/);
    return match ? match[1] : null;
  }

  function tagOverlap(a, b) {
    return a.tags.filter(t => b.tags.includes(t)).length;
  }

  function getRecommendations(slug, count) {
    const current = PAPERS.find(p => p.slug === slug);
    const pool = PAPERS.filter(p => p.slug !== slug);
    if (!current) return pool.slice(0, count);
    return pool
      .map(p => ({ paper: p, score: tagOverlap(current, p) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(r => r.paper);
  }

  function el(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function text(tag, className, content) {
    const node = el(tag, className);
    node.textContent = content;
    return node;
  }

  function renderCard(paper) {
    const a = el('a', 'card');
    a.href = paper.url;

    const content = el('div', 'card__content');
    content.appendChild(text('div', 'card__label', paper.subtitle));
    content.appendChild(text('h3', 'card__title', paper.title));
    content.appendChild(text('p', 'card__description', paper.desc));

    const tagsEl = el('div', 'card__tags');
    paper.tags.slice(0, 3).forEach(t => tagsEl.appendChild(text('span', 'card__tag', t)));
    content.appendChild(tagsEl);

    const link = el('span', 'card__link');
    link.textContent = 'Read Paper ';
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrow.setAttribute('width', '14');
    arrow.setAttribute('height', '14');
    arrow.setAttribute('viewBox', '0 0 24 24');
    arrow.setAttribute('fill', 'none');
    arrow.setAttribute('stroke', 'currentColor');
    arrow.setAttribute('stroke-width', '2');
    arrow.setAttribute('aria-hidden', 'true');
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', 'M5 12h14M12 5l7 7-7 7');
    arrow.appendChild(pathEl);
    link.appendChild(arrow);
    content.appendChild(link);

    a.appendChild(content);
    return a;
  }

  function init() {
    const container = document.getElementById('smart-recommendations');
    if (!container) return;

    const slug = currentSlug();
    const recs = getRecommendations(slug, 3);

    if (recs.length === 0) {
      const section = container.closest('section');
      if (section) section.remove();
      return;
    }

    recs.forEach(paper => container.appendChild(renderCard(paper)));

    requestAnimationFrame(() => {
      container.querySelectorAll('.card').forEach(card => card.classList.add('visible'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
