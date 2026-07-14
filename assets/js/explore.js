// ─────────────────────────────────────────────
//  EXPLORE — unified search + tag filter
//  Indexes the existing homepage cards in place
//  (no rewrite), so it stays in sync with curated copy.
//  Owns research pagination so filtering + paging
//  never conflict.
// ─────────────────────────────────────────────

(function () {
  var RESEARCH_PER_PAGE = 6;

  var bar = document.getElementById('explore');
  if (!bar) return;

  var input = document.getElementById('exploreInput');
  var clearBtn = document.getElementById('exploreClear');
  var tagsWrap = document.getElementById('exploreTags');
  var countEl = document.getElementById('exploreCount');
  var emptyEl = document.getElementById('exploreEmpty');

  var projectCards = Array.prototype.slice.call(document.querySelectorAll('#projects .project-card'));
  var researchRows = Array.prototype.slice.call(document.querySelectorAll('[data-research-item]'));
  var researchPagination = document.getElementById('researchPagination');

  var query = '';
  var activeTag = null;       // lowercased
  var researchPage = 0;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function textOf(el) { return (el.textContent || '').toLowerCase(); }

  function tagsOfProject(card) {
    var out = [];
    card.querySelectorAll('.tech-tag').forEach(function (a) {
      var t = (a.textContent || '').trim();
      if (t) out.push(t);
    });
    return out;
  }

  function tagsOfResearch(row) {
    var kw = row.querySelector('.research-row__keywords');
    if (!kw) return [];
    return (kw.textContent || '').split(',').map(function (s) {
      return s.trim();
    }).filter(Boolean);
  }

  // per-item records
  var projectItems = projectCards.map(function (card) {
    return { el: card, text: textOf(card), tags: tagsOfProject(card) };
  });
  var researchItems = researchRows.map(function (row) {
    return { el: row, text: textOf(row), tags: tagsOfResearch(row) };
  });

  // ── tag index (original case for display, lowercased for matching) ──
  function buildTagIndex() {
    var map = {};
    function add(orig) {
      if (!orig) return;
      var k = orig.toLowerCase();
      if (!map[k]) map[k] = { tag: orig, n: 0 };
      map[k].n++;
    }
    projectItems.forEach(function (it) { it.tags.forEach(add); });
    researchItems.forEach(function (it) { it.tags.forEach(add); });
    return Object.keys(map)
      .map(function (k) { return map[k]; })
      .filter(function (x) { return x.n >= 2; })
      .sort(function (a, b) { return b.n - a.n; });
  }

  function renderTags() {
    var tags = buildTagIndex().slice(0, 14);
    if (!tagsWrap) return;
    tagsWrap.innerHTML = tags.map(function (x) {
      var cls = (activeTag && activeTag === x.tag.toLowerCase()) ? 'explore__chip is-active' : 'explore__chip';
      return '<button class="' + cls + '" data-tag="' + escapeHtml(x.tag.toLowerCase()) + '" type="button">' + escapeHtml(x.tag) + '</button>';
    }).join('');
  }

  // ── matching ──
  function match(rec) {
    if (query && rec.text.indexOf(query) === -1) return false;
    if (activeTag && !rec.tags.some(function (t) { return t.toLowerCase() === activeTag; })) return false;
    return true;
  }

  function applyProjects() {
    projectItems.forEach(function (it) {
      it.el.classList.toggle('is-hidden', !match(it));
    });
  }

  function applyResearch() {
    var filtering = !!(query || activeTag);

    if (filtering) {
      researchItems.forEach(function (it) { it.el.classList.toggle('is-hidden', !match(it)); });
      if (researchPagination) researchPagination.classList.add('is-hidden');
      return;
    }

    // no filter → paginate
    researchItems.forEach(function (it) { it.el.classList.remove('is-hidden'); });
    var totalPages = Math.max(1, Math.ceil(researchItems.length / RESEARCH_PER_PAGE));
    if (researchPage > totalPages - 1) researchPage = totalPages - 1;
    if (researchPage < 0) researchPage = 0;
    var start = researchPage * RESEARCH_PER_PAGE;
    researchItems.forEach(function (it, i) {
      it.el.classList.toggle('is-hidden', i < start || i >= start + RESEARCH_PER_PAGE);
    });
    if (researchPagination) researchPagination.classList.remove('is-hidden');
    updatePaginationUI(totalPages);
  }

  function updatePaginationUI(totalPages) {
    var prev = document.getElementById('researchPrev');
    var next = document.getElementById('researchNext');
    var ind = document.getElementById('researchPageIndicator');
    if (prev) prev.disabled = researchPage === 0;
    if (next) next.disabled = researchPage >= totalPages - 1;
    if (ind) ind.textContent = (researchPage + 1) + ' / ' + totalPages;
  }

  function scrollResearch() {
    var r = document.getElementById('research');
    if (r) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function bindPagination() {
    var prev = document.getElementById('researchPrev');
    var next = document.getElementById('researchNext');
    if (prev) prev.addEventListener('click', function () { if (researchPage > 0) { researchPage--; applyResearch(); scrollResearch(); } });
    if (next) next.addEventListener('click', function () { researchPage++; applyResearch(); scrollResearch(); });
  }

  function updateCount() {
    var p = projectItems.filter(match).length;
    var r = researchItems.filter(match).length;
    if (countEl) countEl.textContent = p + ' project' + (p === 1 ? '' : 's') + ' \u00b7 ' + r + ' paper' + (r === 1 ? '' : 's');
    if (emptyEl) emptyEl.classList.toggle('is-hidden', (p + r) > 0);
  }

  function apply() {
    applyProjects();
    applyResearch();
    updateCount();
    if (clearBtn) clearBtn.hidden = !query;
  }

  // ── events ──
  if (input) {
    input.addEventListener('input', function () {
      query = input.value.trim().toLowerCase();
      apply();
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (input) input.value = '';
      query = '';
      activeTag = null;
      renderTags();
      apply();
      if (input) input.focus();
    });
  }
  if (tagsWrap) {
    tagsWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.explore__chip');
      if (!btn) return;
      var t = btn.getAttribute('data-tag');
      activeTag = (activeTag === t) ? null : t;
      renderTags();
      apply();
    });
  }

  // init
  renderTags();
  bindPagination();
  apply();
})();
