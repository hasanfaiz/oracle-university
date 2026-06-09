const search = document.querySelector('#story-search');
const cards = [...document.querySelectorAll('.story-card')];
const chips = [...document.querySelectorAll('[data-topic-filter]')];
const clear = document.querySelector('#clear-filters');
const empty = document.querySelector('.empty-state');
const savedFilter = document.querySelector('#saved-filter');
const storyGrid = document.querySelector('#story-grid');
const viewButtons = [...document.querySelectorAll('[data-view]')];
const progressBar = document.querySelector('.reading-progress span');

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be blocked. The UI still works for the current page view.
  }
}

function track(eventName, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

const saved = new Set(readJson('savedStories', []));
let activeTopic = 'all';
let savedOnly = false;

function applySavedState() {
  document.querySelectorAll('[data-save]').forEach((button) => {
    const id = button.getAttribute('data-save');
    button.classList.toggle('is-saved', saved.has(id));
    button.textContent = saved.has(id) ? 'Saved' : 'Save';
  });
}

function filterCards() {
  const query = (search?.value || '').trim().toLowerCase();
  let visible = 0;
  cards.forEach((card) => {
    const matchesTopic = activeTopic === 'all' || card.dataset.topic === activeTopic;
    const matchesQuery = !query || (card.dataset.search || '').includes(query);
    const matchesSaved = !savedOnly || saved.has(card.dataset.storyId);
    const show = matchesTopic && matchesQuery && matchesSaved;
    card.hidden = !show;
    if (show) visible += 1;
  });
  if (empty) empty.hidden = visible !== 0;
}

function setInitialSearchFromUrl() {
  if (!search) return;
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) search.value = q;
}

function updateUrlSearch() {
  if (!search) return;
  const q = search.value.trim();
  const url = new URL(window.location.href);
  if (q) url.searchParams.set('q', q);
  else url.searchParams.delete('q');
  window.history.replaceState({}, '', url);
}

let searchTimer;
search?.addEventListener('input', () => {
  filterCards();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    updateUrlSearch();
    if (search.value.trim()) track('site_search', { search_term: search.value.trim() });
  }, 250);
});

clear?.addEventListener('click', () => {
  if (search) search.value = '';
  activeTopic = 'all';
  savedOnly = false;
  savedFilter?.setAttribute('aria-pressed', 'false');
  chips.forEach((chip) => chip.classList.toggle('is-active', chip.dataset.topicFilter === 'all'));
  updateUrlSearch();
  filterCards();
});

savedFilter?.addEventListener('click', () => {
  savedOnly = !savedOnly;
  savedFilter.setAttribute('aria-pressed', String(savedOnly));
  savedFilter.classList.toggle('is-active', savedOnly);
  filterCards();
  track('saved_filter_toggle', { enabled: savedOnly });
});

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    activeTopic = chip.dataset.topicFilter || 'all';
    chips.forEach((item) => item.classList.toggle('is-active', item === chip));
    filterCards();
    track('topic_filter', { topic: activeTopic });
  });
});

document.addEventListener('click', async (event) => {
  const saveButton = event.target.closest('[data-save]');
  if (saveButton) {
    const id = saveButton.getAttribute('data-save');
    if (saved.has(id)) saved.delete(id);
    else saved.add(id);
    writeJson('savedStories', [...saved]);
    applySavedState();
    filterCards();
    track('save_story', { story_id: id, saved: saved.has(id) });
    return;
  }

  const shareButton = event.target.closest('[data-share-url]');
  if (shareButton) {
    const url = shareButton.getAttribute('data-share-url');
    const title = shareButton.getAttribute('data-share-title') || document.title;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else await navigator.clipboard.writeText(url);
      shareButton.textContent = navigator.share ? 'Shared' : 'Copied';
      track('share_story', { method: navigator.share ? 'native' : 'clipboard' });
      setTimeout(() => { shareButton.textContent = 'Share / copy link'; }, 1800);
    } catch {
      shareButton.textContent = 'Copy failed';
      setTimeout(() => { shareButton.textContent = 'Share / copy link'; }, 1800);
    }
  }
});

viewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const view = button.dataset.view || 'mosaic';
    viewButtons.forEach((item) => item.classList.toggle('is-active', item === button));
    storyGrid?.classList.toggle('is-list', view === 'list');
    writeJson('preferredView', view);
    track('view_change', { view });
  });
});

function restorePreferredView() {
  const view = readJson('preferredView', 'mosaic');
  const button = viewButtons.find((item) => item.dataset.view === view);
  if (button) button.click();
}

function updateProgress() {
  if (!progressBar) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
}

window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress);

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && search && document.activeElement !== search) {
    event.preventDefault();
    search.focus();
  }
  if (event.key === 'Escape' && search) {
    search.value = '';
    updateUrlSearch();
    filterCards();
  }
});

document.querySelectorAll('a[target="_blank"]').forEach((link) => {
  link.addEventListener('click', () => track('outbound_source_click', { url: link.href }));
});

document.querySelector('[data-newsletter]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const input = form.querySelector('input[type="email"]');
  const note = form.querySelector('small');
  if (note) {
    note.hidden = false;
    note.textContent = input?.value ? 'Signup UI captured locally for now. Connect an email provider before production.' : 'Enter an email address when your email provider is connected.';
  }
  track('newsletter_intent');
});

setInitialSearchFromUrl();
applySavedState();
restorePreferredView();
filterCards();
updateProgress();
