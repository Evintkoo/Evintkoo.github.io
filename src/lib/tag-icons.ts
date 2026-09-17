// Category-mapped chip icons (per user request during live preview QA):
// tags/tech/skill pills are free-text (150+ distinct values site-wide) with
// no natural 1:1 icon per value, so each chip is classified into one of a
// small set of categories by keyword match and rendered with that
// category's icon rather than a bespoke icon per tag.

export type TagCategory = 'role' | 'language' | 'finance' | 'science' | 'ai' | 'infra' | 'meta' | 'framework';

const ICONS: Record<TagCategory, string> = {
  role: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15 9 22 9.3 16.5 14 18.2 21 12 17.2 5.8 21 7.5 14 2 9.3 9 9"/></svg>',
  language: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  finance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 17 9 11 13 15 21 6"/><polyline points="15 6 21 6 21 12"/></svg>',
  science: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2v6L4 20a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L15 8V2M9 15h6"/></svg>',
  ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/></svg>',
  infra: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="6" rx="1.5"/><rect x="2" y="15" width="20" height="6" rx="1.5"/><path d="M6 8v.01M6 18v.01"/></svg>',
  meta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 12.6 12.4 20.8a2 2 0 0 1-2.8 0l-7.4-7.4a2 2 0 0 1 0-2.8L10.4 2.4A2 2 0 0 1 11.8 2H19a2 2 0 0 1 2 2v7.2a2 2 0 0 1-.4 1.4Z"/><circle cx="15.5" cy="7.5" r="1.5"/></svg>',
  framework: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l9 4.9v10.2L12 22l-9-4.9V6.9z"/><path d="M12 22V12M21 6.9L12 12 3 6.9"/></svg>',
};

const RULES: [TagCategory, RegExp][] = [
  ['role', /^(featured|co-founder|founder)$/i],
  ['meta', /^(open source|community|education|published|award|analysis)$/i],
  [
    'finance',
    /(bitcoin|\bbtc\b|finance|portfolio|risk budgeting|lob reconstruction|ofi features|backtest|macroeconomics|keynesian|coordination failure|gradient failure|equilibrium|cross-correlation|granger|survivability|monte carlo|quantitative|fiscal policy|zero lower bound|minsky)/i,
  ],
  [
    'science',
    /(physics|neuroscience|genomics|\brna\b|drug|disease|cortical|fmri|gene regulatory|\bgrn\b|genetic algorithm|two-tower|cross-encoder|clustering|\bsom\b|self-organi[sz]ing|growing neural gas|\bgng\b|\bann\b|auroc|spearman|biology|p-53|mental health|k-means|k-mer|neural architecture|pruning|gradient stability|global workspace|calinski|unsupervised|gaussian blur|zinc15|nyström|oracle routing|counterfactual|agent-based)/i,
  ],
  ['ai', /(^ai$|machine learning|deep learning|automl|computer vision|grid search|parameter-free|mlops)/i],
  ['infra', /(docker|\baws\b|infrastructure|parquet|arrow|criterion|benchmarks|cloud)/i],
  ['language', /^(python|rust(\s*\/\s*burn)?|typescript|javascript|c\+\+|java|go|html\s*\/\s*css\s*\/\s*js)$/i],
];

export function getTagCategory(tag: string): TagCategory {
  const trimmed = tag.trim();
  for (const [category, pattern] of RULES) {
    if (pattern.test(trimmed)) return category;
  }
  return 'framework';
}

export function getTagIconSvg(tag: string): string {
  return ICONS[getTagCategory(tag)];
}
