#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'site.config.json');
const outputPath = path.join(root, 'public', 'data', 'news.json');
const samplePath = path.join(root, 'public', 'data', 'sample-news.json');

const officialFeeds = [
  { name: 'Oracle Press Releases', url: 'https://www.oracle.com/corporate/press/rss/rss-pr.xml', sourceType: 'official' },
  { name: 'Oracle Blogs', url: 'https://blogs.oracle.com/rss', sourceType: 'official' },
  { name: 'Oracle Investor Relations News', url: 'https://investor.oracle.com/rss/pressrelease.aspx', sourceType: 'official' },
  { name: 'Oracle Critical Patch Updates', url: 'https://www.oracle.com/ocom/groups/public/%40otn/documents/webcontent/rss-otn-sec.xml', sourceType: 'official' },
  { name: 'Oracle Magazine', url: 'https://blogs.oracle.com/connect/rss', sourceType: 'official' },
  { name: 'Oracle University Podcast', url: 'https://feeds.libsyn.com/459162/rss', sourceType: 'podcast' },
  { name: 'Inside Java', url: 'https://feeds.libsyn.com/294923/rss', sourceType: 'podcast' },
  { name: 'Inside MySQL', url: 'https://feeds.libsyn.com/522558/rss', sourceType: 'podcast' },
  { name: 'Oracle Academy Tech Chat', url: 'https://feeds.libsyn.com/467046/rss', sourceType: 'podcast' },
  { name: "Duke's Corner", url: 'https://feeds.libsyn.com/313847/rss', sourceType: 'podcast' },
  { name: 'Perspectives on Health and Tech', url: 'https://feeds.libsyn.com/451620/rss', sourceType: 'podcast' }
];

const newsQueries = [
  'Oracle Cloud',
  'Oracle Cloud Infrastructure OCI',
  'Oracle multicloud',
  'Oracle AI Database',
  'Oracle Database',
  'Oracle Autonomous Database',
  'Oracle Exadata',
  'Oracle Database AWS',
  'Oracle Database Google Cloud',
  'Oracle Critical Patch Update',
  'Oracle security alert CVE',
  'Oracle Java JDK',
  'Oracle MySQL',
  'Oracle GraalVM',
  'Oracle NetSuite',
  'Oracle Fusion Cloud ERP',
  'Oracle HCM Cloud',
  'Oracle SCM Cloud',
  'Oracle Health Cerner',
  'Oracle certification',
  'Oracle University MyLearn',
  'ORCL earnings Oracle revenue',
  'Oracle partner ecosystem'
];

const topicRules = [
  ['Security', /critical patch|security|vulnerab|cve|patch update|breach|threat|zero[-\s]?day|risk/i],
  ['Training & Certification', /certification|training|university|mylearn|course|learning path|exam|badge|academy/i],
  ['AI & Database', /ai database|database@|database|exadata|autonomous database|sql|vector|multitenant|mysql heatwave/i],
  ['Oracle Cloud', /oracle cloud|oci|cloud infrastructure|multicloud|data center|datacenter|cloud region|iaas|paas|sovereign cloud/i],
  ['Java & MySQL', /java|mysql|jdk|openjdk|graalvm|developer|duke/i],
  ['Business & Earnings', /earnings|revenue|investor|stock|orcl|quarter|financial|acquisition|guidance|analyst/i],
  ['Applications & NetSuite', /fusion|netsuite|erp|hcm|scm|cx|health|cerner|application|customer experience|human capital/i]
];

function getEnv(name, fallback = '') {
  return process.env[name] || fallback;
}

async function loadConfig() {
  try {
    return JSON.parse(await readFile(configPath, 'utf8'));
  } catch {
    return { siteUrl: getEnv('SITE_URL', 'https://oracle-university.com'), brandName: 'Oracle University Daily' };
  }
}

function decodeHtml(input = '') {
  return String(input)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtml(input = '') {
  return decodeHtml(String(input).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function tagValue(block, tagName) {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, 'i');
  const match = block.match(re);
  return match ? decodeHtml(match[1]) : '';
}

function attrValue(block, tagName, attrName) {
  const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedAttr = attrName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<${escapedTag}[^>]*${escapedAttr}=["']([^"']+)["'][^>]*>`, 'i');
  const match = block.match(re);
  return match ? decodeHtml(match[1]) : '';
}

function atomLink(block) {
  const alternate = block.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["'][^>]*>/i);
  if (alternate) return decodeHtml(alternate[1]);
  return attrValue(block, 'link', 'href');
}

function parseFeed(xml, source) {
  const text = String(xml || '');
  const rssBlocks = [...text.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  const atomBlocks = [...text.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => m[0]);

  const rssItems = rssBlocks.map((block) => normalizeArticle({
    title: tagValue(block, 'title'),
    dek: stripHtml(tagValue(block, 'description') || tagValue(block, 'content:encoded') || tagValue(block, 'summary')),
    url: tagValue(block, 'link') || tagValue(block, 'guid'),
    source: source.name,
    sourceType: source.sourceType,
    image: attrValue(block, 'media:content', 'url') || attrValue(block, 'media:thumbnail', 'url') || attrValue(block, 'enclosure', 'url'),
    publishedAt: parseDate(tagValue(block, 'pubDate') || tagValue(block, 'published') || tagValue(block, 'dc:date'))
  }));

  const atomItems = atomBlocks.map((block) => normalizeArticle({
    title: tagValue(block, 'title'),
    dek: stripHtml(tagValue(block, 'summary') || tagValue(block, 'content')),
    url: atomLink(block) || tagValue(block, 'id'),
    source: source.name,
    sourceType: source.sourceType,
    image: attrValue(block, 'media:content', 'url') || attrValue(block, 'media:thumbnail', 'url'),
    publishedAt: parseDate(tagValue(block, 'published') || tagValue(block, 'updated'))
  }));

  return [...rssItems, ...atomItems].filter(Boolean);
}

function parseDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function slugify(input) {
  return String(input)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 88) || 'story';
}

function hash(input) {
  return createHash('sha256').update(String(input)).digest('hex').slice(0, 16);
}

function classifyTopic(title, dek = '') {
  const text = `${title} ${dek}`;
  const found = topicRules.find(([, re]) => re.test(text));
  return found ? found[0] : 'Oracle Ecosystem';
}

function extractTags(title, dek = '') {
  const text = `${title} ${dek}`;
  const candidates = [
    'Oracle Cloud', 'OCI', 'Oracle Cloud Infrastructure', 'Multicloud', 'Oracle Database', 'Oracle AI Database',
    'Autonomous Database', 'Exadata', 'Java', 'JDK', 'OpenJDK', 'GraalVM', 'MySQL', 'NetSuite', 'Fusion Cloud ERP',
    'HCM', 'SCM', 'CX', 'Oracle Health', 'Cerner', 'Critical Patch Update', 'CVE', 'Security', 'Certification',
    'Oracle University', 'MyLearn', 'ORCL', 'Earnings', 'AI', 'Partner', 'Database@AWS', 'Database@Google Cloud'
  ];
  const tags = candidates.filter((tag) => new RegExp(`\\b${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text));
  return [...new Set(tags)].slice(0, 6);
}

function scoreArticle(article) {
  const officialBoost = article.sourceType === 'official' ? 22 : article.sourceType === 'podcast' ? 12 : 0;
  const recencyHours = Math.max(1, (Date.now() - new Date(article.publishedAt).getTime()) / 36e5);
  const recencyScore = Math.max(0, 54 - Math.log2(recencyHours) * 8);
  const topicBoost = /critical patch|security|ai|database|oci|earnings|certification|mylearn/i.test(`${article.title} ${article.dek}`) ? 18 : 6;
  const sourceBoost = /oracle/i.test(article.source) ? 6 : 0;
  return Math.round(officialBoost + recencyScore + topicBoost + sourceBoost);
}

function normalizeUrl(url) {
  try {
    const u = new URL(String(url).trim());
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'mc_cid', 'mc_eid'].forEach((p) => u.searchParams.delete(p));
    u.hash = '';
    return u.toString();
  } catch {
    return String(url || '').trim();
  }
}

function getFirst(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function normalizeArticle(raw) {
  const title = stripHtml(raw.title || '');
  const url = normalizeUrl(getFirst(raw.url, raw.link, raw.original_url, raw.source_url, raw.article_url, raw.canonical_url));
  if (!title || !url || !/^https?:\/\//i.test(url)) return null;
  const dek = stripHtml(getFirst(raw.dek, raw.description, raw.summary, raw.subtitle, raw.content, raw.body, raw.snippet)).slice(0, 300);
  const sourceObject = raw.source && typeof raw.source === 'object' ? raw.source : null;
  const source = stripHtml(getFirst(raw.sourceName, raw.source_name, raw.source_id, sourceObject?.name, raw.publisher, raw.creator?.[0], raw.author, raw.source, 'External source'));
  const publishedAt = parseDate(raw.publishedAt || raw.pubDate || raw.pubDateTZ || raw.pubDateTime || raw.published_at || raw.published);
  const topic = raw.topic || classifyTopic(title, dek);
  const id = raw.id || raw.uuid || hash(`${url}|${title}`);
  const slug = `${slugify(title)}-${hash(id).slice(0, 6)}`;
  const tags = raw.tags || raw.keywords || raw.categories || extractTags(title, dek);
  const article = {
    id,
    slug,
    title,
    dek,
    url,
    source,
    sourceType: raw.sourceType || 'external',
    image: getFirst(raw.image, raw.image_url, raw.urlToImage, raw.thumbnail),
    publishedAt,
    topic,
    tags: Array.isArray(tags) ? [...new Set(tags.filter(Boolean).map(String))].slice(0, 6) : extractTags(title, dek),
    priority: 0
  };
  article.priority = raw.priority || scoreArticle(article);
  return article;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'user-agent': 'OracleUniversityDailyBot/2.0 (+https://oracle-university.com)',
        'accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, text/html;q=0.7, */*;q=0.6',
        ...(options.headers || {})
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url, options = {}, timeoutMs = 15000) {
  const text = await fetchWithTimeout(url, options, timeoutMs);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON from ${url}: ${error.message}`);
  }
}

function providerEnabled(provider, requested) {
  if (requested === 'auto') return true;
  return requested.split(',').map((p) => p.trim()).includes(provider);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOfficialRss() {
  if (getEnv('ENABLE_OFFICIAL_RSS', '1') === '0') return [];
  const all = [];
  for (const feed of officialFeeds) {
    try {
      const xml = await fetchWithTimeout(feed.url);
      const parsed = parseFeed(xml, feed);
      all.push(...parsed);
      console.log(`RSS OK: ${feed.name} (${parsed.length})`);
    } catch (error) {
      console.warn(`RSS skipped: ${feed.name}: ${error.message}`);
    }
  }
  return all;
}

async function fetchNewsData(apiKey) {
  if (!apiKey) return [];
  const items = [];
  for (const query of newsQueries) {
    const url = new URL('https://newsdata.io/api/1/latest');
    url.searchParams.set('apikey', apiKey);
    url.searchParams.set('language', 'en');
    url.searchParams.set('q', query);
    try {
      const json = await fetchJson(url.toString());
      const results = Array.isArray(json.results) ? json.results : [];
      for (const item of results) {
        const creators = Array.isArray(item.creator) ? item.creator.filter(Boolean) : [];
        items.push(normalizeArticle({
          title: item.title,
          dek: item.description || item.ai_summary || item.content,
          url: item.link,
          sourceName: item.source_name || item.source_id || creators[0] || 'External source',
          sourceType: 'external',
          image: item.image_url,
          publishedAt: item.pubDate,
          tags: item.keywords?.length ? item.keywords : extractTags(item.title || '', item.description || '')
        }));
      }
      console.log(`NewsData OK: ${query} (${results.length})`);
    } catch (error) {
      console.warn(`NewsData skipped: ${query}: ${error.message}`);
    }
  }
  return items.filter(Boolean);
}

async function fetchFreeNewsApi(apiKey) {
  if (!apiKey) return [];
  const items = [];
  const fetchDetails = getEnv('FREENEWSAPI_FETCH_DETAILS', '1') !== '0';
  for (const query of newsQueries) {
    const url = new URL('https://api.freenewsapi.io/v1/news');
    url.searchParams.set('language', 'en');
    url.searchParams.set('q', query);
    url.searchParams.set('order_by', 'recent');
    url.searchParams.set('offset', '0');
    try {
      const json = await fetchJson(url.toString(), { headers: { 'x-api-key': apiKey } });
      const results = Array.isArray(json.data) ? json.data.slice(0, 5) : [];
      for (const item of results) {
        let raw = item;
        if (fetchDetails && item.uuid) {
          await sleep(575);
          try {
            const detailUrl = new URL('https://api.freenewsapi.io/v1/details');
            detailUrl.searchParams.set('uuid', item.uuid);
            const detail = await fetchJson(detailUrl.toString(), { headers: { 'x-api-key': apiKey } });
            raw = { ...item, ...(detail.data || {}) };
          } catch (error) {
            console.warn(`FreeNewsAPI details skipped: ${item.uuid}: ${error.message}`);
          }
        }
        items.push(normalizeArticle({
          id: raw.uuid,
          title: raw.title,
          dek: raw.subtitle || raw.incipit || raw.description || raw.body,
          url: raw.url || raw.original_url || raw.source_url || raw.link,
          sourceName: raw.publisher?.name || raw.publisher || raw.source?.name || 'FreeNewsApi source',
          sourceType: 'external',
          image: raw.thumbnail || raw.image,
          publishedAt: raw.published_at,
          tags: Array.isArray(raw.topics) ? raw.topics : extractTags(raw.title || '', raw.subtitle || raw.body || '')
        }));
      }
      console.log(`FreeNewsAPI OK: ${query} (${results.length})`);
      await sleep(575);
    } catch (error) {
      console.warn(`FreeNewsAPI skipped: ${query}: ${error.message}`);
    }
  }
  return items.filter(Boolean);
}

async function fetchGNews(apiKey) {
  if (!apiKey) return [];
  const items = [];
  for (const query of newsQueries) {
    const url = new URL('https://gnews.io/api/v4/search');
    url.searchParams.set('q', query);
    url.searchParams.set('lang', 'en');
    url.searchParams.set('max', '10');
    url.searchParams.set('apikey', apiKey);
    try {
      const json = await fetchJson(url.toString());
      const results = Array.isArray(json.articles) ? json.articles : [];
      for (const item of results) {
        items.push(normalizeArticle({
          title: item.title,
          dek: item.description || item.content,
          url: item.url,
          sourceName: item.source?.name || 'GNews source',
          sourceType: 'external',
          image: item.image,
          publishedAt: item.publishedAt,
          tags: extractTags(item.title || '', item.description || '')
        }));
      }
      console.log(`GNews OK: ${query} (${results.length})`);
    } catch (error) {
      console.warn(`GNews skipped: ${query}: ${error.message}`);
    }
  }
  return items.filter(Boolean);
}

async function fetchNewsApi(apiKey) {
  if (!apiKey) return [];
  const items = [];
  for (const query of newsQueries) {
    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', query);
    url.searchParams.set('language', 'en');
    url.searchParams.set('sortBy', 'publishedAt');
    url.searchParams.set('pageSize', '10');
    url.searchParams.set('apiKey', apiKey);
    try {
      const json = await fetchJson(url.toString());
      const results = Array.isArray(json.articles) ? json.articles : [];
      for (const item of results) {
        items.push(normalizeArticle({
          title: item.title,
          dek: item.description || item.content,
          url: item.url,
          sourceName: item.source?.name || 'NewsAPI source',
          sourceType: 'external',
          image: item.urlToImage,
          publishedAt: item.publishedAt,
          tags: extractTags(item.title || '', item.description || '')
        }));
      }
      console.log(`NewsAPI OK: ${query} (${results.length})`);
    } catch (error) {
      console.warn(`NewsAPI skipped: ${query}: ${error.message}`);
    }
  }
  return items.filter(Boolean);
}

function titleKey(title) {
  return stripHtml(title).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').slice(0, 14).join(' ');
}

function dedupeAndSort(items, maxArticles) {
  const byUrl = new Map();
  const byTitle = new Map();
  for (const item of items.filter(Boolean)) {
    const urlKey = normalizeUrl(item.url).replace(/^https?:\/\/(www\.)?/i, '').toLowerCase();
    const tKey = titleKey(item.title);
    const existingUrl = byUrl.get(urlKey);
    const existingTitleKey = byTitle.get(tKey);
    const existing = existingUrl || (existingTitleKey ? byUrl.get(existingTitleKey) : null);
    if (!existing || item.priority > existing.priority || new Date(item.publishedAt) > new Date(existing.publishedAt)) {
      byUrl.set(urlKey, item);
      if (tKey) byTitle.set(tKey, urlKey);
    }
  }
  return [...byUrl.values()]
    .sort((a, b) => (b.priority - a.priority) || (new Date(b.publishedAt) - new Date(a.publishedAt)))
    .slice(0, maxArticles);
}

async function loadSample(provider = 'sample-fallback') {
  const sample = JSON.parse(await readFile(samplePath, 'utf8'));
  sample.generatedAt = new Date().toISOString();
  sample.provider = provider;
  return sample;
}

async function main() {
  const config = await loadConfig();
  const maxArticles = Number(getEnv('MAX_ARTICLES', '120')) || 120;
  const requestedProvider = getEnv('NEWS_PROVIDER', 'auto').toLowerCase();
  const sampleOnly = getEnv('SAMPLE_ONLY', '0') === '1' || process.argv.includes('--sample');

  if (sampleOnly) {
    const sample = await loadSample('sample-only');
    await writeFile(outputPath, `${JSON.stringify(sample, null, 2)}\n`);
    console.log(`Sample data refreshed at ${outputPath}`);
    return;
  }

  const collected = [];
  collected.push(...await fetchOfficialRss());

  if (providerEnabled('newsdata', requestedProvider)) collected.push(...await fetchNewsData(getEnv('NEWSDATA_API_KEY')));
  if (providerEnabled('freenewsapi', requestedProvider)) collected.push(...await fetchFreeNewsApi(getEnv('FREENEWSAPI_KEY')));
  if (providerEnabled('gnews', requestedProvider)) collected.push(...await fetchGNews(getEnv('GNEWS_API_KEY')));
  if (providerEnabled('newsapi', requestedProvider)) collected.push(...await fetchNewsApi(getEnv('NEWSAPI_KEY')));

  const items = dedupeAndSort(collected, maxArticles);

  if (!items.length) {
    console.warn('No live items fetched. Falling back to sample data and updating timestamp.');
    const sample = await loadSample('sample-fallback');
    await writeFile(outputPath, `${JSON.stringify(sample, null, 2)}\n`);
    return;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    provider: requestedProvider,
    site: {
      brandName: config.brandName,
      siteUrl: getEnv('SITE_URL', config.siteUrl)
    },
    items
  }, null, 2)}\n`);
  console.log(`Wrote ${items.length} articles to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
