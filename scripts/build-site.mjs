#!/usr/bin/env node
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const dataPath = path.join(root, 'public', 'data', 'news.json');
const configPath = path.join(root, 'site.config.json');

const topicProfiles = {
  'Oracle Cloud': {
    slug: 'oracle-cloud',
    title: 'Oracle Cloud Infrastructure and OCI updates',
    dek: 'Daily OCI news for cloud architects, platform teams, FinOps leaders, and enterprise migration planners.',
    keywords: ['Oracle Cloud news', 'OCI updates', 'Oracle Cloud Infrastructure', 'Oracle multicloud', 'cloud regions']
  },
  'AI & Database': {
    slug: 'ai-database',
    title: 'Oracle Database, AI Database, Autonomous Database and Exadata',
    dek: 'Track database product updates, AI Database coverage, Exadata, Autonomous Database, SQL, vector search, and multicloud database services.',
    keywords: ['Oracle Database news', 'Oracle AI Database', 'Autonomous Database', 'Exadata', 'Database@AWS', 'Database@Google Cloud']
  },
  'Security': {
    slug: 'security',
    title: 'Oracle security alerts and Critical Patch Update watch',
    dek: 'A focused desk for Oracle Critical Patch Updates, CVEs, security alerts, vulnerability coverage, and operational patch planning.',
    keywords: ['Oracle Critical Patch Update', 'Oracle security alerts', 'Oracle CVE', 'DBA patching', 'security advisories']
  },
  'Training & Certification': {
    slug: 'training-certification',
    title: 'Oracle certification, MyLearn and training updates',
    dek: 'Follow learning paths, exam changes, Oracle Cloud certification coverage, MyLearn resources, and career-skilling signals.',
    keywords: ['Oracle certification', 'Oracle University', 'Oracle MyLearn', 'OCI certification', 'Oracle training']
  },
  'Java & MySQL': {
    slug: 'java-mysql',
    title: 'Java, MySQL, GraalVM and developer ecosystem',
    dek: 'Developer-focused coverage for Java, JDK, OpenJDK, MySQL, GraalVM, release notes, performance, and cloud-native runtime updates.',
    keywords: ['Java news', 'MySQL updates', 'GraalVM', 'JDK release notes', 'Oracle developer news']
  },
  'Business & Earnings': {
    slug: 'business-earnings',
    title: 'ORCL earnings, business, market and investor coverage',
    dek: 'Track Oracle earnings, cloud revenue signals, AI infrastructure demand, acquisition news, investor releases, and analyst coverage.',
    keywords: ['ORCL stock news', 'Oracle earnings', 'Oracle revenue', 'Oracle investor relations', 'AI infrastructure demand']
  },
  'Applications & NetSuite': {
    slug: 'applications-netsuite',
    title: 'Fusion Apps, NetSuite, Oracle Health and enterprise applications',
    dek: 'Enterprise application news for Fusion Cloud ERP, HCM, SCM, CX, NetSuite, Oracle Health, and industry-cloud developments.',
    keywords: ['NetSuite news', 'Oracle Fusion Cloud ERP', 'Oracle HCM Cloud', 'Oracle SCM Cloud', 'Oracle Health news']
  },
  'Oracle Ecosystem': {
    slug: 'oracle-ecosystem',
    title: 'Oracle ecosystem, partners and industry coverage',
    dek: 'Independent coverage of partners, integrations, customer stories, analyst commentary, migrations, and adjacent enterprise technology signals.',
    keywords: ['Oracle ecosystem news', 'Oracle partners', 'Oracle customer stories', 'Oracle integrations', 'enterprise technology news']
  }
};

const staticPages = [
  {
    path: '/about/',
    title: 'About Oracle University Daily',
    nav: 'About',
    description: 'About this independent daily Oracle ecosystem news magazine and how it turns public feeds into source-linked briefings.',
    eyebrow: 'About the publication',
    heading: 'A daily, source-linked magazine for the Oracle ecosystem.',
    body: `
      <p>Oracle University Daily is designed as a fast independent news-reading experience for people who follow Oracle Cloud Infrastructure, Oracle Database, AI Database, Java, MySQL, NetSuite, Fusion Apps, Oracle Health, security alerts, certification updates, and business news.</p>
      <p>The site is static-first: a scheduled job fetches public Oracle RSS feeds and optional external news APIs, deduplicates stories, assigns topics, creates a daily edition, and builds indexable HTML pages. The browser never receives your API keys.</p>
      <p>The publication is not operated by Oracle Corporation. Product names are used descriptively so readers can find relevant source-linked news.</p>`
  },
  {
    path: '/editorial-policy/',
    title: 'Editorial Policy',
    nav: 'Editorial Policy',
    description: 'Editorial policy for automated source collection, deduplication, human review, corrections, and source attribution.',
    eyebrow: 'Editorial standards',
    heading: 'Automation is used for collection; trust comes from sourcing and restraint.',
    body: `
      <p>Stories are selected from official feeds and optional external APIs using topic rules for Oracle Cloud, Database, AI, Java, MySQL, NetSuite, Fusion Apps, Oracle Health, security, certification, and business coverage.</p>
      <p>Brief pages do not republish full articles. They provide short context, topic tags, source transparency, and a prominent link to the original publisher.</p>
      <p>Corrections should be handled by updating the source record, removing inaccurate briefs, and documenting material changes on the affected page. Add a monitored contact address before launch.</p>`
  },
  {
    path: '/sources/',
    title: 'Sources and API Integration',
    nav: 'Sources',
    description: 'How the site integrates Oracle RSS, NewsData.io, FreeNewsApi.io, GNews, and NewsAPI for daily source-linked news refreshes.',
    eyebrow: 'Source architecture',
    heading: 'Official RSS first, free APIs second, static HTML always.',
    body: `
      <p>The refresh pipeline starts with official public Oracle RSS sources, including Oracle Press Releases, Oracle Blogs, Investor Relations News, Critical Patch Updates, Oracle Magazine, Oracle University Podcast, Inside Java, and Inside MySQL where available.</p>
      <p>Optional API enrichments can be enabled with environment secrets: NewsData.io, FreeNewsApi.io, GNews, and NewsAPI. The included script supports <code>NEWS_PROVIDER=auto</code>, which uses every configured provider with an available key.</p>
      <p>Every fetched item is normalized into the same schema: title, description, source, source type, published date, topic, tags, priority score, canonical source URL, and optional image.</p>`
  },
  {
    path: '/privacy/',
    title: 'Privacy Policy',
    nav: 'Privacy',
    description: 'Privacy policy starter for analytics, local saved stories, and future newsletter capture.',
    eyebrow: 'Privacy starter',
    heading: 'Analytics is enabled; API keys stay server-side.',
    body: `
      <p>This starter includes the Google tag for GA4 measurement on every generated page. Update this page with your legal business name, jurisdiction, cookie practices, consent mode, retention choices, and contact details before production launch.</p>
      <p>Saved stories are stored locally in the reader’s browser using localStorage. They are not sent to a server by this starter.</p>
      <p>Newsletter UI is included for conversion design, but no email is submitted until you connect a compliant email provider and update this policy.</p>`
  },
  {
    path: '/trademark-disclaimer/',
    title: 'Trademark Disclaimer',
    nav: 'Trademark',
    description: 'Trademark and affiliation disclaimer for independent Oracle ecosystem coverage.',
    eyebrow: 'Trademark notice',
    heading: 'Independent coverage, descriptive product references.',
    body: `
      <p>This website is an independent publication and is not affiliated with, sponsored by, endorsed by, or operated by Oracle Corporation.</p>
      <p>Oracle product and service names may appear in headlines, tags, and topic pages only to describe the subject of source-linked news coverage.</p>
      <p>Oracle, Java, MySQL, and NetSuite are registered trademarks of Oracle and/or its affiliates. Other names may be trademarks of their respective owners.</p>`
  }
];

function env(name, fallback = '') {
  return process.env[name] || fallback;
}

function siteUrl(config) {
  return env('SITE_URL', config.siteUrl || 'https://oracle-university.com').replace(/\/$/, '');
}

function escapeHtml(input = '') {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(input = '') {
  return escapeHtml(input).replace(/`/g, '&#96;');
}

function slugify(input) {
  return String(input)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'topic';
}

function topicSlug(topic) {
  return topicProfiles[topic]?.slug || slugify(topic);
}

function absolute(config, urlPath = '/') {
  if (/^https?:\/\//i.test(urlPath)) return urlPath;
  const cleanPath = urlPath.startsWith('/') ? urlPath : `/${urlPath}`;
  return `${siteUrl(config)}${cleanPath}`;
}

function formatDate(iso, timezone = 'Asia/Kolkata', options = {}) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: options.dateStyle || 'medium',
      timeStyle: options.timeStyle || 'short',
      timeZone: timezone
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function compactDate(iso, timezone = 'Asia/Kolkata') {
  try {
    return new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric', timeZone: timezone }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function readingTime(text) {
  const words = String(text || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function sourceDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function clampText(text = '', max = 168) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

function imageFor(article, index = 0) {
  if (article.image) return article.image;
  const themes = {
    'Oracle Cloud': 'cloud',
    'AI & Database': 'database',
    'Security': 'security',
    'Training & Certification': 'learning',
    'Java & MySQL': 'code',
    'Business & Earnings': 'markets',
    'Applications & NetSuite': 'apps',
    'Oracle Ecosystem': 'brief'
  };
  return `/assets/card-${themes[article.topic] || 'brief'}-${(index % 3) + 1}.svg`;
}

function topicLink(topic) {
  return `/topics/${topicSlug(topic)}/`;
}

function tagList(tags = [], limit = 5) {
  return tags.slice(0, limit).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
}

function topicKeywords(topic) {
  return topicProfiles[topic]?.keywords || [topic, 'Oracle news', 'enterprise technology'];
}

function officialBadge(sourceType = '') {
  const type = String(sourceType || '').toLowerCase();
  if (type === 'official') return '<span class="source-badge source-badge--official">Official source</span>';
  if (type === 'editorial') return '<span class="source-badge source-badge--editorial">Editorial</span>';
  if (type === 'podcast') return '<span class="source-badge source-badge--podcast">Podcast</span>';
  return '<span class="source-badge">External source</span>';
}

function cardClass(index) {
  if (index === 0) return 'story-card--lead';
  if ([5, 11, 17].includes(index)) return 'story-card--wide';
  if ([3, 8, 14].includes(index)) return 'story-card--tall';
  return '';
}

function card(article, index, timezone) {
  const image = imageFor(article, index);
  const heroLoading = index < 3 ? 'eager' : 'lazy';
  const searchTerms = [article.title, article.dek, article.source, article.topic, ...(article.tags || []), sourceDomain(article.url)]
    .join(' ')
    .toLowerCase();
  return `
    <article class="story-card ${cardClass(index)}" data-topic="${escapeAttr(article.topic)}" data-story-id="${escapeAttr(article.id)}" data-search="${escapeAttr(searchTerms)}">
      <a class="story-card__image" href="/stories/${escapeAttr(article.slug)}/" aria-label="Read brief: ${escapeAttr(article.title)}">
        <img src="${escapeAttr(image)}" alt="" loading="${heroLoading}">
        <span class="story-card__topic">${escapeHtml(article.topic)}</span>
      </a>
      <div class="story-card__body">
        <div class="story-card__meta">
          ${officialBadge(article.sourceType)}
          <span>${escapeHtml(article.source)}</span>
          <span>${compactDate(article.publishedAt, timezone)}</span>
        </div>
        <h2><a href="/stories/${escapeAttr(article.slug)}/">${escapeHtml(article.title)}</a></h2>
        <p>${escapeHtml(clampText(article.dek || 'Open the original source for the full story.', index === 0 ? 220 : 168))}</p>
        <div class="story-card__tags">${tagList(article.tags)}</div>
        <div class="story-card__actions">
          <a class="pill-link" href="/stories/${escapeAttr(article.slug)}/">Brief</a>
          <a class="pill-link ghost" href="${escapeAttr(article.url)}" target="_blank" rel="noopener noreferrer">Original</a>
          <button type="button" data-save="${escapeAttr(article.id)}" aria-label="Save this story">Save</button>
        </div>
      </div>
    </article>`;
}

function googleTag(config) {
  const id = config.analytics?.googleTagId || 'G-4Q8L6503HZ';
  if (!id) return '';
  return `
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${escapeAttr(id)}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', '${escapeAttr(id)}');
  </script>`;
}

function structuredScript(structuredData = []) {
  return structuredData.map((data) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`).join('\n  ');
}

function shell({ config, title, description, canonical, body, structuredData = [], extraClass = '', ogImage = '/assets/card-brief-1.svg', pageType = 'website' }) {
  const brand = config.brandName;
  const absCanonical = canonical.startsWith('http') ? canonical : absolute(config, canonical);
  const absImage = absolute(config, ogImage);
  return `<!doctype html>
<html lang="${escapeAttr(config.primaryLanguage || 'en')}">
<head>${googleTag(config)}
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${escapeAttr(absCanonical)}">
  <link rel="alternate" type="application/rss+xml" title="${escapeAttr(brand)} RSS" href="${escapeAttr(absolute(config, '/feed.xml'))}">
  <meta property="og:site_name" content="${escapeAttr(brand)}">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(description)}">
  <meta property="og:type" content="${escapeAttr(pageType)}">
  <meta property="og:url" content="${escapeAttr(absCanonical)}">
  <meta property="og:image" content="${escapeAttr(absImage)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#0d1321">
  <link rel="icon" href="/assets/logo.svg" type="image/svg+xml">
  <link rel="preload" href="/styles.css" as="style">
  <link rel="stylesheet" href="/styles.css">
  ${structuredScript(structuredData)}
</head>
<body class="${escapeAttr(extraClass)}">
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="reading-progress" aria-hidden="true"><span></span></div>
  <header class="site-header">
    <a class="brand" href="/" aria-label="${escapeAttr(brand)} home">
      <img src="/assets/logo.svg" alt="" width="44" height="44">
      <span><strong>${escapeHtml(brand)}</strong><small>${escapeHtml(config.tagline)}</small></span>
    </a>
    <nav class="top-nav" aria-label="Primary navigation">
      <a href="/">Today</a>
      <a href="/topics/">Topics</a>
      <a href="/topics/oracle-cloud/">Cloud</a>
      <a href="/topics/ai-database/">Database</a>
      <a href="/topics/training-certification/">Learning</a>
      <a href="/sources/">Sources</a>
    </nav>
  </header>
  <main id="main">${body}</main>
  <footer class="site-footer">
    <div>
      <strong>${escapeHtml(brand)}</strong>
      <p>${escapeHtml(config.disclaimer)}</p>
      <p>${escapeHtml(config.trademarkCredit)}</p>
    </div>
    <div class="footer-links">
      <a href="/about/">About</a>
      <a href="/editorial-policy/">Editorial</a>
      <a href="/privacy/">Privacy</a>
      <a href="/trademark-disclaimer/">Trademark</a>
      <a href="/sitemap.xml">Sitemap</a>
      <a href="/feed.xml">RSS</a>
    </div>
  </footer>
  <script src="/app.js" type="module"></script>
</body>
</html>`;
}

function getTopics(data) {
  return [...new Set(data.items.map((i) => i.topic))].sort((a, b) => {
    const order = ['Oracle Cloud', 'AI & Database', 'Security', 'Training & Certification', 'Java & MySQL', 'Applications & NetSuite', 'Business & Earnings', 'Oracle Ecosystem'];
    return (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b)) || a.localeCompare(b);
  });
}

function stats(data) {
  const official = data.items.filter((i) => i.sourceType === 'official').length;
  const external = data.items.length - official;
  const topics = getTopics(data).length;
  const sources = new Set(data.items.map((i) => i.source)).size;
  return { official, external, topics, sources };
}

function hero(config, data, topics, timezone) {
  const generated = formatDate(data.generatedAt, timezone);
  const s = stats(data);
  const top = data.items[0];
  return `
  <section class="hero-section">
    <div class="hero-copy">
      <p class="eyebrow">${escapeHtml(config.refreshLabel)} · Updated ${escapeHtml(generated)}</p>
      <h1>Oracle ecosystem news, flipped into a daily magazine.</h1>
      <p>${escapeHtml(config.description)}</p>
      <div class="hero-tools" role="search">
        <label class="search-box"><span>Search</span><input id="story-search" type="search" placeholder="Search OCI, Database, Java, NetSuite, certification…" autocomplete="off"></label>
        <button id="clear-filters" type="button">Clear</button>
        <button id="saved-filter" type="button" aria-pressed="false">Saved</button>
      </div>
      <div class="trust-strip" aria-label="Edition stats">
        <span><strong>${data.items.length}</strong> briefs</span>
        <span><strong>${s.official}</strong> official</span>
        <span><strong>${s.external}</strong> external/editorial</span>
        <span><strong>${s.sources}</strong> sources</span>
      </div>
    </div>
    <aside class="edition-card" aria-label="Daily edition summary">
      <span class="edition-card__label">Daily Edition</span>
      <strong>${new Date(data.generatedAt).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', timeZone: timezone })}</strong>
      <p>Lead story</p>
      <a class="edition-lead" href="/stories/${escapeAttr(top.slug)}/">${escapeHtml(top.title)}</a>
      <div class="edition-actions">
        <a href="#story-grid">Start reading</a>
        <a href="/feed.xml">RSS</a>
      </div>
    </aside>
  </section>
  <section class="topic-rail" aria-label="Topics">
    <button class="topic-chip is-active" data-topic-filter="all">All</button>
    ${topics.map((topic) => `<button class="topic-chip" data-topic-filter="${escapeAttr(topic)}">${escapeHtml(topic)}</button>`).join('')}
  </section>`;
}

function topStrip(data) {
  return `
  <section class="top-strip" aria-label="Top story stack">
    ${data.items.slice(0, 6).map((item, index) => `<a href="/stories/${escapeAttr(item.slug)}/"><span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.topic)}</small></a>`).join('')}
  </section>`;
}

function newsletterBlock(config) {
  return `
  <section class="newsletter-block" aria-label="Newsletter signup placeholder">
    <div>
      <p class="eyebrow">Reader retention</p>
      <h2>${escapeHtml(config.newsletter?.headline || 'Get the daily briefing')}</h2>
      <p>${escapeHtml(config.newsletter?.dek || 'Connect your email platform when you are ready.')}</p>
    </div>
    <form class="newsletter-form" data-newsletter>
      <label><span>Email</span><input type="email" placeholder="you@example.com" autocomplete="email"></label>
      <button type="submit">Notify me</button>
      <small hidden></small>
    </form>
  </section>`;
}

function topicShelves(data, topics, timezone) {
  return `
  <section class="topic-shelves" aria-label="Topic shelves">
    <div class="grid-heading"><h2>Topic shelves</h2><p>SEO-friendly topic clusters with internal links.</p></div>
    ${topics.map((topic) => {
      const items = data.items.filter((i) => i.topic === topic).slice(0, 3);
      const profile = topicProfiles[topic] || { title: topic, dek: `Latest ${topic} coverage.` };
      return `<section class="topic-shelf">
        <div class="topic-shelf__intro">
          <p class="topic-kicker">${escapeHtml(topic)}</p>
          <h3><a href="${topicLink(topic)}">${escapeHtml(profile.title)}</a></h3>
          <p>${escapeHtml(profile.dek)}</p>
        </div>
        <div class="topic-shelf__cards">
          ${items.map((item) => `<a href="/stories/${escapeAttr(item.slug)}/"><span>${escapeHtml(formatDate(item.publishedAt, timezone, { dateStyle: 'medium', timeStyle: undefined }))}</span>${escapeHtml(item.title)}</a>`).join('')}
        </div>
      </section>`;
    }).join('')}
  </section>`;
}

function readerFeatures() {
  return `
  <section class="reader-features" aria-label="Reader features">
    <article><span>01</span><h2>Flip-style scanning</h2><p>Large tiles, stacked headlines, visual topic shelves, and keyboard search make the page feel like a premium digital magazine.</p></article>
    <article><span>02</span><h2>Daily automation</h2><p>GitHub Actions refreshes the edition every day, then static HTML keeps performance and indexing clean.</p></article>
    <article><span>03</span><h2>Source transparency</h2><p>Each brief preserves the original source link, source type, publication time, tags, and topic context.</p></article>
    <article><span>04</span><h2>Reader attraction</h2><p>Saved stories, RSS, topic pages, newsletter CTA placeholder, and share actions support repeat visits.</p></article>
  </section>`;
}

function homePage(config, data) {
  const timezone = config.timezone || 'Asia/Kolkata';
  const topics = getTopics(data);
  const body = `
    ${hero(config, data, topics, timezone)}
    ${topStrip(data)}
    <section class="grid-heading"><div><p class="eyebrow">Today’s briefings</p><h2>Magazine grid</h2></div><p>Fast cards, original links, readable spacing, clean tags, and indexable story pages.</p></section>
    <div class="view-tools" aria-label="Layout tools"><button type="button" data-view="mosaic" class="is-active">Mosaic</button><button type="button" data-view="list">Compact list</button></div>
    <section id="story-grid" class="story-grid" aria-live="polite">
      ${data.items.map((item, index) => card(item, index, timezone)).join('\n')}
    </section>
    <p class="empty-state" hidden>No stories match your filter. Try “OCI”, “database”, “security”, “Java”, “NetSuite”, or “certification”.</p>
    ${newsletterBlock(config)}
    ${topicShelves(data, topics, timezone)}
    ${readerFeatures()}`;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: config.brandName,
      alternateName: config.shortName,
      url: absolute(config, '/'),
      description: config.description,
      inLanguage: config.primaryLanguage || 'en',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${absolute(config, '/')}?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${config.brandName} daily Oracle ecosystem briefing`,
      url: absolute(config, '/'),
      dateModified: data.generatedAt,
      isPartOf: { '@type': 'WebSite', name: config.brandName, url: absolute(config, '/') }
    }
  ];
  return shell({
    config,
    title: `${config.brandName} | Oracle ecosystem news, OCI, Database, Java, MySQL and certification updates`,
    description: config.description,
    canonical: absolute(config, '/'),
    body,
    structuredData,
    extraClass: 'home'
  });
}

function topicsIndexPage(config, data) {
  const topics = getTopics(data);
  const body = `
    <section class="page-hero compact">
      <p class="eyebrow">All desks</p>
      <h1>Oracle ecosystem topic pages</h1>
      <p>Each topic page is built as static HTML with descriptive URLs, source-linked briefs, internal links, and keyword-rich editorial context.</p>
    </section>
    <section class="topic-index-grid">
      ${topics.map((topic) => {
        const profile = topicProfiles[topic] || { title: topic, dek: `Latest ${topic} coverage.`, keywords: [topic] };
        const count = data.items.filter((i) => i.topic === topic).length;
        return `<a class="topic-index-card" href="${topicLink(topic)}"><span>${count} briefs</span><h2>${escapeHtml(profile.title)}</h2><p>${escapeHtml(profile.dek)}</p><div>${profile.keywords.map((k) => `<em>${escapeHtml(k)}</em>`).join('')}</div></a>`;
      }).join('')}
    </section>`;
  return shell({
    config,
    title: `Oracle news topics | ${config.brandName}`,
    description: 'Browse Oracle Cloud, Database, Security, Certification, Java, MySQL, NetSuite, Fusion Apps, Oracle Health, and ORCL business news topics.',
    canonical: absolute(config, '/topics/'),
    body,
    structuredData: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: `Oracle ecosystem topics | ${config.brandName}`, url: absolute(config, '/topics/') }],
    extraClass: 'topics-index-page'
  });
}

function topicPage(config, data, topic) {
  const timezone = config.timezone || 'Asia/Kolkata';
  const items = data.items.filter((i) => i.topic === topic);
  const profile = topicProfiles[topic] || { title: topic, dek: `Latest source-linked briefs related to ${topic}.`, keywords: [topic, 'Oracle news'] };
  const pathName = topicLink(topic);
  const body = `
    <section class="page-hero compact topic-hero">
      <p class="eyebrow">Topic desk</p>
      <h1>${escapeHtml(profile.title)}</h1>
      <p>${escapeHtml(profile.dek)} Source links are preserved for original reporting.</p>
      <div class="keyword-cloud" aria-label="Keyword cluster">${profile.keywords.map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join('')}</div>
    </section>
    <section class="story-grid topic-grid">
      ${items.map((item, index) => card(item, index, timezone)).join('\n')}
    </section>`;
  const structuredData = [{
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${profile.title} | ${config.brandName}`,
    url: absolute(config, pathName),
    description: profile.dek,
    dateModified: data.generatedAt
  }];
  return shell({
    config,
    title: `${profile.title} | ${config.brandName}`,
    description: `${profile.dek} Updated daily on ${config.brandName}.`,
    canonical: absolute(config, pathName),
    body,
    structuredData,
    extraClass: 'topic-page'
  });
}

function autoTakeaways(article) {
  const topic = article.topic;
  const base = {
    'Security': [
      'Prioritize whether the item affects internet-facing systems, databases, middleware, or identity infrastructure.',
      'Map the source item to your next patch window and document owners before remediation starts.',
      'Keep the original advisory link because patch details can change after publication.'
    ],
    'Oracle Cloud': [
      'Check whether the update changes region availability, networking, pricing, performance, or migration planning.',
      'Cloud architects should compare the source item with current OCI tenancy and workload requirements.',
      'Save the story if it affects data residency, multicloud architecture, or platform operations.'
    ],
    'AI & Database': [
      'Review impact on database architecture, AI workloads, vector search, autonomy, and multicloud deployment patterns.',
      'DBA teams should verify compatibility, licensing, and operational notes in the original source.',
      'Use tags to connect this brief with Exadata, Autonomous Database, AI Database, and SQL coverage.'
    ],
    'Training & Certification': [
      'Confirm exam objectives and learning paths from official Oracle learning pages before acting on a brief.',
      'Certification learners should track version changes, retirement notices, badges, and hands-on lab availability.',
      'Training content is best used as a navigation layer that points readers to the original source.'
    ],
    'Java & MySQL': [
      'Developers should compare the item with release notes, compatibility matrices, and dependency policies.',
      'Performance, security, and runtime packaging changes may affect CI/CD and production operations.',
      'Follow the original source for full code examples, changelogs, and support details.'
    ],
    'Applications & NetSuite': [
      'Application teams should watch for workflow, data model, integration, and rollout-readiness implications.',
      'Finance, HR, supply chain, CX, and healthcare leaders may need different follow-up actions from the same story.',
      'Use the original source link for screenshots, release notes, and configuration details.'
    ],
    'Business & Earnings': [
      'Separate market commentary from official financial releases and investor materials.',
      'Watch for cloud revenue, AI infrastructure, capex, guidance, and customer-demand signals.',
      'Readers making financial decisions should rely on primary filings and professional advice.'
    ]
  };
  return base[topic] || [
    'Use this brief as a quick orientation layer, then open the original source for the complete report.',
    'Tags and topic links help connect this story with related Oracle ecosystem coverage.',
    'Save the item if it affects your learning plan, architecture roadmap, or operational watchlist.'
  ];
}

function storyPage(config, data, article) {
  const timezone = config.timezone || 'Asia/Kolkata';
  const pathName = `/stories/${article.slug}/`;
  const related = data.items
    .filter((i) => i.id !== article.id && (i.topic === article.topic || (i.tags || []).some((tag) => (article.tags || []).includes(tag))))
    .slice(0, 4);
  const image = imageFor(article, 0);
  const profile = topicProfiles[article.topic] || { title: article.topic, dek: `Latest ${article.topic} coverage.`, keywords: topicKeywords(article.topic) };
  const takeaways = autoTakeaways(article);
  const body = `
    <article class="article-layout">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Today</a><span>/</span><a href="${topicLink(article.topic)}">${escapeHtml(article.topic)}</a><span>/</span><strong>Brief</strong></nav>
      <header class="article-header">
        <a class="topic-kicker" href="${topicLink(article.topic)}">${escapeHtml(article.topic)}</a>
        <h1>${escapeHtml(article.title)}</h1>
        <p>${escapeHtml(article.dek || 'This is a source-linked brief. Open the original article for full context.')}</p>
        <div class="article-meta">
          ${officialBadge(article.sourceType)}
          <span>${escapeHtml(article.source)}</span>
          <span>${formatDate(article.publishedAt, timezone)}</span>
          <span>${readingTime(article.dek)} min brief</span>
        </div>
      </header>
      <figure class="article-media"><img src="${escapeAttr(image)}" alt=""><figcaption>${escapeHtml(article.topic)} coverage from ${escapeHtml(article.source)}.</figcaption></figure>
      <section class="brief-box article-brief">
        <div>
          <p class="eyebrow">Brief summary</p>
          <h2>What this story is about</h2>
          <p>${escapeHtml(article.dek || 'Open the original source for the full article and complete context.')}</p>
          <div class="story-card__tags">${tagList(article.tags, 8)}</div>
        </div>
        <aside class="source-panel">
          <h3>Source transparency</h3>
          <dl>
            <div><dt>Publisher</dt><dd>${escapeHtml(article.source)}</dd></div>
            <div><dt>Domain</dt><dd>${escapeHtml(sourceDomain(article.url) || 'Original source')}</dd></div>
            <div><dt>Source type</dt><dd>${escapeHtml(article.sourceType || 'external')}</dd></div>
            <div><dt>Published</dt><dd>${escapeHtml(formatDate(article.publishedAt, timezone))}</dd></div>
          </dl>
        </aside>
      </section>
      <section class="brief-box">
        <p class="eyebrow">Why it matters</p>
        <h2>Reader takeaways</h2>
        <ul class="takeaway-list">${takeaways.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        <a class="primary-link" href="${escapeAttr(article.url)}" target="_blank" rel="noopener noreferrer">Read the original source</a>
        <button class="primary-link secondary" type="button" data-share-url="${escapeAttr(absolute(config, pathName))}" data-share-title="${escapeAttr(article.title)}">Share / copy link</button>
      </section>
      <section class="brief-box keyword-map">
        <p class="eyebrow">SEO context</p>
        <h2>Topic and keyword map</h2>
        <p>This brief is filed under <a href="${topicLink(article.topic)}">${escapeHtml(profile.title)}</a>.</p>
        <div class="keyword-cloud">${[...new Set([...(article.tags || []), ...profile.keywords])].slice(0, 12).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join('')}</div>
      </section>
      <section class="related-block">
        <h2>Related briefs</h2>
        <div class="related-grid">${related.map((item) => `<a href="/stories/${escapeAttr(item.slug)}/"><span>${escapeHtml(item.topic)}</span>${escapeHtml(item.title)}</a>`).join('')}</div>
      </section>
    </article>`;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.dek,
      image: absolute(config, image),
      datePublished: article.publishedAt,
      dateModified: data.generatedAt,
      author: { '@type': 'Organization', name: config.authorName || config.brandName },
      publisher: { '@type': 'Organization', name: config.brandName, url: absolute(config, '/') },
      mainEntityOfPage: absolute(config, pathName),
      isBasedOn: article.url,
      about: article.tags || [],
      articleSection: article.topic,
      inLanguage: config.primaryLanguage || 'en'
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Today', item: absolute(config, '/') },
        { '@type': 'ListItem', position: 2, name: article.topic, item: absolute(config, topicLink(article.topic)) },
        { '@type': 'ListItem', position: 3, name: article.title, item: absolute(config, pathName) }
      ]
    }
  ];
  return shell({
    config,
    title: `${article.title} | ${config.brandName}`,
    description: article.dek || `Independent brief from ${article.source}.`,
    canonical: absolute(config, pathName),
    body,
    structuredData,
    extraClass: 'story-page',
    ogImage: image,
    pageType: 'article'
  });
}

function staticInfoPage(config, page) {
  const body = `
    <section class="page-hero compact info-hero">
      <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
      <h1>${escapeHtml(page.heading)}</h1>
      <div class="info-copy">${page.body}</div>
    </section>`;
  return shell({
    config,
    title: `${page.title} | ${config.brandName}`,
    description: page.description,
    canonical: absolute(config, page.path),
    body,
    structuredData: [{ '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, url: absolute(config, page.path), description: page.description }],
    extraClass: 'info-page'
  });
}

function sitemap(config, data) {
  const topics = getTopics(data);
  const urls = [
    ['/', data.generatedAt],
    ['/topics/', data.generatedAt],
    ...staticPages.map((page) => [page.path, data.generatedAt]),
    ...topics.map((topic) => [topicLink(topic), data.generatedAt]),
    ...data.items.map((item) => [`/stories/${item.slug}/`, item.publishedAt])
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([loc, lastmod]) => `  <url><loc>${escapeHtml(absolute(config, loc))}</loc><lastmod>${new Date(lastmod).toISOString()}</lastmod></url>`).join('\n')}
</urlset>`;
}

function feed(config, data) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(config.brandName)}</title>
    <link>${escapeHtml(absolute(config, '/'))}</link>
    <atom:link href="${escapeHtml(absolute(config, '/feed.xml'))}" rel="self" type="application/rss+xml" />
    <description>${escapeHtml(config.description)}</description>
    <language>${escapeHtml(config.primaryLanguage || 'en')}</language>
    <lastBuildDate>${new Date(data.generatedAt).toUTCString()}</lastBuildDate>
    ${data.items.slice(0, 50).map((item) => `
    <item>
      <title>${escapeHtml(item.title)}</title>
      <link>${escapeHtml(absolute(config, `/stories/${item.slug}/`))}</link>
      <guid isPermaLink="true">${escapeHtml(absolute(config, `/stories/${item.slug}/`))}</guid>
      <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>
      <category>${escapeHtml(item.topic)}</category>
      <description>${escapeHtml(item.dek || '')}</description>
      <source url="${escapeHtml(item.url)}">${escapeHtml(item.source)}</source>
    </item>`).join('')}
  </channel>
</rss>`;
}

async function main() {
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const data = JSON.parse(await readFile(dataPath, 'utf8'));
  if (!Array.isArray(data.items)) throw new Error('public/data/news.json must contain an items array.');
  if (!data.items.length) throw new Error('public/data/news.json contains no items.');

  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  await mkdir(path.join(dist, 'assets'), { recursive: true });
  await mkdir(path.join(dist, 'data'), { recursive: true });

  await cp(path.join(root, 'public', 'assets'), path.join(dist, 'assets'), { recursive: true });
  await writeFile(path.join(dist, 'data', 'news.json'), `${JSON.stringify(data, null, 2)}\n`);
  await cp(path.join(root, 'src', 'styles.css'), path.join(dist, 'styles.css'));
  await cp(path.join(root, 'src', 'app.js'), path.join(dist, 'app.js'));

  await writeFile(path.join(dist, 'index.html'), homePage(config, data));

  await mkdir(path.join(dist, 'topics'), { recursive: true });
  await writeFile(path.join(dist, 'topics', 'index.html'), topicsIndexPage(config, data));

  const topics = getTopics(data);
  for (const topic of topics) {
    const dir = path.join(dist, 'topics', topicSlug(topic));
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), topicPage(config, data, topic));
  }

  for (const page of staticPages) {
    const dir = path.join(dist, page.path.replace(/^\//, ''));
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), staticInfoPage(config, page));
  }

  for (const article of data.items) {
    const dir = path.join(dist, 'stories', article.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), storyPage(config, data, article));
  }

  await writeFile(path.join(dist, 'sitemap.xml'), sitemap(config, data));
  await writeFile(path.join(dist, 'feed.xml'), feed(config, data));
  await writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nUser-agent: Googlebot\nAllow: /\n\nUser-agent: AdsBot-Google\nAllow: /\n\nSitemap: ${absolute(config, '/sitemap.xml')}\n`);

  console.log(`Built ${data.items.length} stories, ${topics.length} topic pages, ${staticPages.length + 2} static pages, sitemap, RSS, GA4 tag, and static assets in dist/.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
