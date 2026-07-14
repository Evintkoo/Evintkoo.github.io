// ─────────────────────────────────────────────
//  SITE_DATA — single source of truth
//  Projects + research metadata, topic taxonomy.
//  Feeds the homepage topic graph (mindmap.js) and
//  future phases (embedded viz, playground).
// ─────────────────────────────────────────────

(function () {
  var TOPICS = [
    { id: 'ml',    label: 'ML',        name: 'Machine Learning' },
    { id: 'bio',   label: 'Biology',   name: 'Computational Biology' },
    { id: 'fin',   label: 'Finance',   name: 'Quantitative Finance' },
    { id: 'econ',  label: 'Economics', name: 'Economics' },
    { id: 'infra', label: 'AI Infra',  name: 'AI Infrastructure' },
    { id: 'neuro', label: 'Neuro',     name: 'Neuroscience' },
  ];

  var projects = [
    { id: 'kolosal-ai',      type: 'project', topic: 'infra', label: 'Kolosal AI',     title: 'Kolosal AI',                              href: 'https://kolosal.ai/', featured: true, tags: ['Python', 'PyTorch', 'FastAPI', 'Docker', 'CUDA'] },
    { id: 'torch-inference', type: 'project', topic: 'infra', label: 'Torch Inference',title: 'PyTorch Inference Framework',             href: 'projects/torch-inference.html',          repo: 'KolosalAI/torch-inference',     tags: ['PyTorch', 'TensorRT', 'FastAPI', 'Docker'] },
    { id: 'kolosal-automl',  type: 'project', topic: 'infra', label: 'AutoML',         title: 'Kolosal AutoML Platform',                 href: 'projects/kolosal-automl.html',           repo: 'KolosalAI/kolosal_automl',      tags: ['Gradio', 'MLflow', 'Optuna', 'FastAPI'] },
    { id: 'som-plus',        type: 'project', topic: 'ml',    label: 'SOM Plus',       title: 'SOM Plus Clustering',                     href: 'projects/som-plus.html',                 repo: 'Evintkoo/SOM_plus_clustering',  tags: ['Python', 'NumPy', 'SciPy', 'scikit-learn'] },
    { id: 'apt-fitness',     type: 'project', topic: null,    label: 'APT Fitness',    title: 'APT Fitness Assistant',                   href: 'projects/apt-fitness.html',              repo: 'Evintkoo/APT-Fitness-Assistant',tags: ['Python', 'MediaPipe', 'Streamlit', 'OpenCV'] },
    { id: 'chain-reaction',  type: 'project', topic: null,    label: 'Chain Reaction', title: 'Chain Reaction Simulation',               href: 'projects/chain-reaction-simulation.html',repo: 'Evintkoo/chain_reaction_simulation', tags: ['Rust', 'wgpu', 'GPU', 'Nuclear Physics'] },
    { id: 'faction',         type: 'project', topic: 'fin',   label: 'Faction',        title: 'Faction: Stock Analysis App',             href: 'projects/faction-app.html',              repo: 'Evintkoo/FactionApp',           tags: ['Tauri', 'Rust', 'React', 'LLM'] },
    { id: 'rebirth',         type: 'project', topic: null,    label: 'Rebirth',        title: 'Rebirth Educational Platform',            href: 'projects/rebirth.html',                                                                                tags: ['Education', 'Community'] },
    { id: 'psychidn',        type: 'project', topic: null,    label: 'PsychIDN',       title: 'PsychIDN Community',                      href: 'projects/psychidn.html',                                                                               tags: ['Psychology', 'Mental Health', 'Community'] },
    { id: 'tribe',           type: 'project', topic: 'neuro', label: 'TRIBE v2',       title: 'TRIBE v2: Neural Prediction Workstation', href: 'projects/tribe-playground.html',          repo: 'Evintkoo/tribe-playground',     tags: ['Rust', 'Three.js', 'LLaMA', 'CLIP'] },
    { id: 'orderflow-rs',    type: 'project', topic: 'fin',   label: 'orderflow-rs',   title: 'orderflow-rs',                            href: 'projects/orderflow-rs.html',             repo: 'Evintkoo/orderflow-rs',         tags: ['Rust', 'LOB', 'OFI', 'Backtesting'] }
  ];

  var research = [
    { id: 'keynesian-fiscal',     type: 'research', topic: 'econ', label: 'Keynesian Fiscal',  title: 'Fiscal Stabilisers, Minsky Dynamics, and Distributional Outcomes in a Keynesian ABM', href: 'research/keynesian-abm-fiscal.html',         tags: ['Keynesian ABM', 'Monte Carlo', 'Rust'] },
    { id: 'keynesian-coordination',type: 'research', topic: 'econ', label: 'Keynesian Coord.', title: 'Individual Optimality and Collective Failure in a Keynesian Agent-Based Model',      href: 'research/keynesian-abm-coordination.html',   tags: ['Coordination Failure', 'Grid Search', 'Keynesian ABM'] },
    { id: 'som-tsk',              type: 'research', topic: 'ml',   label: 'SOM-TSK',           title: 'SOM-TSK: Topology-Seeded Clustering Framework',                                        href: 'research/som-tsk.html',                      tags: ['Self-Organizing Maps', 'K-means', 'Rust'] },
    { id: 'grasp',                type: 'research', topic: 'ml',   label: 'GRASP',             title: 'GRASP: Graph-Routed Adaptive Spectral Partitioning',                                   href: 'research/grasp.html',                        tags: ['Spectral Clustering', 'GNG', 'Parameter-Free'] },
    { id: 'grn-dual-vs-cross',    type: 'research', topic: 'bio',  label: 'GRN Dual×Cross',    title: 'Dual-Encoder vs Cross-Encoder for GRN Links',                                          href: 'research/grn-dual-vs-cross-encoder.html',    tags: ['Deep Learning', 'GRN Inference', 'IEEE TNNLS'] },
    { id: 'grn-modular',          type: 'research', topic: 'bio',  label: 'GRN Modular',       title: 'Modular vs Monolithic GRN Architectures',                                               href: 'research/grn-modular-vs-monolithic.html',    tags: ['Cross-Encoder', 'AUROC', 'GRN Inference'] },
    { id: 'grn-two-tower',        type: 'research', topic: 'bio',  label: 'GRN Two-Tower',     title: 'Two-Tower Networks for GRN Inference',                                                  href: 'research/grn-two-tower.html',                tags: ['Two-Tower MLP', 'scRNA-seq', 'Rust'] },
    { id: 'circular-rna',         type: 'research', topic: 'bio',  label: 'Circular RNA',      title: 'Deep Learning for Circular RNA',                                                        href: 'research/circular-rna.html',                 tags: ['circRNA', 'ANN', 'Disease Classification'] },
    { id: 'functional-group',     type: 'research', topic: 'ml',   label: 'Functional Groups', title: 'Functional Group Analysis',                                                              href: 'research/functional-group-analysis.html',    tags: ['GAT-VGAE', 'SOM', 'Drug-Likeness'] },
    { id: 'global-gdp',           type: 'research', topic: 'econ', label: 'GDP Paths',         title: 'GDP Trajectory Clustering',                                                             href: 'research/global-gdp-patterns.html',          tags: ['Unsupervised Clustering', 'Macroeconomics', 'K-Means'] },
    { id: 'crypto-timing',        type: 'research', topic: 'fin',  label: 'Crypto Timing',     title: 'Crypto vs Stock Timing',                                                                href: 'research/crypto-stock-timing.html',          tags: ['Bitcoin', 'Cross-Correlation', 'Granger Causality'] },
    { id: 'bitcoin-portfolio',    type: 'research', topic: 'fin',  label: 'BTC Allocation',    title: 'Bitcoin Portfolio Allocation',                                                          href: 'research/bitcoin-portfolio-allocation.html', tags: ['Risk Budgeting', 'BTC Sizing', 'Portfolio Optimization'] },
    { id: 'neuron-activation',    type: 'research', topic: 'neuro',label: 'Brain & Internet',  title: 'What Does the Internet Do to the Brain?',                                               href: 'research/neuron-activation-analysis.html',   tags: ['fMRI Encoding', 'Cortical Mapping', 'TRIBE v2'] },
    { id: 'p53-mutation',         type: 'research', topic: 'bio',  label: 'P-53 Gene',         title: 'Cancer Leading Mutation DNA of P-53 Gene',                                              href: 'research/p53-mutation.html',                 tags: ['P-53', 'Genetic Algorithms', 'Cancer Genomics'] }
  ];

  // ── Derive the topic graph for mindmap.js ──
  function buildMindmap() {
    var byTopic = {};
    TOPICS.forEach(function (t) { byTopic[t.id] = []; });
    projects.concat(research).forEach(function (it) {
      if (it.topic && byTopic[it.topic]) byTopic[it.topic].push(it.label);
    });
    var branches = TOPICS
      .map(function (t) { return { label: t.label, nodes: byTopic[t.id] }; })
      .filter(function (b) { return b.nodes.length > 0; });
    return { center: 'Build & Research', branches: branches };
  }

  window.SITE_DATA = { topics: TOPICS, projects: projects, research: research };
  window.MINDMAP_DATA = buildMindmap();
})();
