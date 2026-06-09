# Oracle University Daily — Flipboard-Inspired News Site Starter

This project is a production-oriented static starter for `https://oracle-university.com`. It creates a Flipboard-inspired daily magazine for Oracle ecosystem news without exposing API keys in the browser.

It is intentionally **inspired by magazine/card reading patterns**, not a verbatim Flipboard clone. Do not use Flipboard logos, brand assets, proprietary layouts, or copied interface text.

## What is included

- `oracle-university.com` configured as the production domain in `site.config.json`.
- Google Analytics 4 tag `G-4Q8L6503HZ` injected into every generated HTML page.
- Flipboard-inspired front page:
  - oversized editorial hero,
  - daily edition panel,
  - top story stack,
  - horizontal topic rail,
  - masonry/mosaic cards,
  - compact-list toggle,
  - topic shelves,
  - reader feature cards,
  - newsletter CTA placeholder.
- Better typography with more readable headline spacing, relaxed line-height, less aggressive negative letter-spacing, and improved mobile wrapping.
- Static SEO pages:
  - `/`
  - `/topics/`
  - `/topics/oracle-cloud/`
  - `/topics/ai-database/`
  - `/topics/security/`
  - `/topics/training-certification/`
  - `/topics/java-mysql/`
  - `/topics/applications-netsuite/`
  - `/topics/business-earnings/`
  - `/topics/oracle-ecosystem/`
  - `/stories/.../`
  - `/about/`
  - `/editorial-policy/`
  - `/sources/`
  - `/privacy/`
  - `/trademark-disclaimer/`
- Generated SEO files:
  - `/sitemap.xml`
  - `/feed.xml`
  - `/robots.txt`
  - canonical URLs
  - Open Graph metadata
  - `Article`, `CollectionPage`, `WebSite`, `WebPage`, and `BreadcrumbList` JSON-LD.
- Reader attraction features:
  - browser-local saved stories,
  - `/` keyboard shortcut for search,
  - topic filters,
  - compact list / mosaic view toggle,
  - reading progress bar,
  - native share / copy link button,
  - outbound source-click GA events,
  - newsletter-intent GA event.

## Important trademark and affiliation note

The project keeps the requested domain, but this is not legal advice. Before launch, have counsel review use of `oracle-university.com`, the publication name, disclaimers, and content presentation. Do not use Oracle logos, Oracle visual trade dress, or official-looking copy unless you have written permission.

The footer and `/trademark-disclaimer/` page include an independent-site disclaimer and Oracle trademark credit line.

## macOS Terminal quick start — Node only, no Python

Requirements:

- macOS Terminal
- Node.js 20 or newer
- npm, included with Node.js

Check your Node version:

```bash
node -v
npm -v
```

Unzip, open the project folder, build, and preview:

```bash
cd ~/Downloads
unzip oracle-university-daily-flipboard-v3-node-only.zip
cd oracle-university-flipboard-v3-node-only
npm run build
npm run dev
```

Open:

```text
http://127.0.0.1:8080
```

Stop the local server with:

```text
Control + C
```

If port 8080 is busy, run:

```bash
PORT=8081 npm run dev
```

This project does not need Python. The local preview server is `scripts/serve.mjs`, which uses Node's built-in HTTP module.

The project includes sample data so you can preview the complete UI immediately.

## Daily refresh with free APIs

The refresh script combines official RSS and optional free/freemium news APIs.

```bash
export SITE_URL="https://oracle-university.com"
export NEWS_PROVIDER="auto"
export MAX_ARTICLES="120"
export NEWSDATA_API_KEY="your_newsdata_key"
export FREENEWSAPI_KEY="your_freenewsapi_key"
export GNEWS_API_KEY="your_gnews_key"
export NEWSAPI_KEY="your_newsapi_key_for_development_only"

npm run refresh:build
```

`NEWS_PROVIDER=auto` uses every provider that has a key available, plus official RSS.

Supported values:

```text
auto
newsdata
freenewsapi
gnews
newsapi
newsdata,gnews
freenewsapi,gnews
```

Official RSS can be disabled with:

```bash
export ENABLE_OFFICIAL_RSS=0
```

Use sample mode with:

```bash
SAMPLE_ONLY=1 npm run refresh:build
```

## API sources configured

Official public feeds:

- Oracle Press Releases
- Oracle Blogs
- Oracle Investor Relations News
- Oracle Critical Patch Updates
- Oracle Magazine
- Oracle University Podcast
- Inside Java
- Inside MySQL
- Oracle Academy Tech Chat
- Duke's Corner
- Perspectives on Health and Tech

Optional APIs:

- NewsData.io latest endpoint
- FreeNewsApi.io `/v1/news` and optional `/v1/details`
- GNews `/api/v4/search`
- NewsAPI `/v2/everything` for development/testing depending on your plan terms

## GitHub Actions daily refresh

The included workflow runs daily at `20:30 UTC`, which is `02:00 IST` the next day.

Add these repository secrets:

```text
SITE_URL=https://oracle-university.com
NEWSDATA_API_KEY=...
FREENEWSAPI_KEY=...
GNEWS_API_KEY=...
NEWSAPI_KEY=...
```

Only add keys for providers you want to use. The script skips missing providers.

## Deployment

### Vercel

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Use GitHub Actions to refresh `public/data/news.json` and `dist/`; Vercel can redeploy on the committed update.

### Cloudflare Pages / Netlify

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

## Google Analytics

Your GA4 tag is injected from `scripts/build-site.mjs` inside the shared page shell. Every generated HTML page includes:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-4Q8L6503HZ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-4Q8L6503HZ');
</script>
```

The frontend also sends events for:

- site search
- topic filter
- saved story
- view change
- outbound original-source click
- share/copy action
- newsletter intent

## SEO implementation

Built-in SEO features:

- Static HTML for every story and topic.
- Descriptive URLs.
- One self-referencing canonical URL per page.
- XML sitemap generated on every build.
- RSS feed generated on every build.
- `robots.txt` with sitemap reference.
- `Article` schema on story pages.
- `CollectionPage` schema on home and topic pages.
- `BreadcrumbList` schema on story pages.
- Keyword clusters in visible page copy, topic pages, internal links, and tags.
- No `meta keywords` because modern Google Search does not use it.
- No full-article copying; story pages provide context and link to original sources.

Primary keyword clusters:

- Oracle news
- Oracle University news
- Oracle certification
- Oracle MyLearn
- Oracle Cloud news
- OCI updates
- Oracle Cloud Infrastructure
- Oracle Database news
- Oracle AI Database
- Oracle Autonomous Database
- Exadata
- Oracle Critical Patch Update
- Oracle security alerts
- Java news
- MySQL updates
- NetSuite news
- Oracle Fusion Cloud ERP
- Oracle HCM Cloud
- Oracle Health news
- ORCL earnings
- Oracle partner ecosystem

## File map

```text
.
├── README.md
├── package.json
├── site.config.json
├── vercel.json
├── .env.example
├── .github/workflows/daily-refresh.yml
├── public/
│   ├── data/
│   │   ├── news.json
│   │   └── sample-news.json
│   └── assets/
├── scripts/
│   ├── build-site.mjs
│   └── refresh-news.mjs
├── src/
│   ├── app.js
│   └── styles.css
└── dist/
```

## Production checklist

Before going live:

- Confirm DNS points `oracle-university.com` to your host.
- Add `SITE_URL=https://oracle-university.com` as a deployment/GitHub secret.
- Add only the API keys you plan to use.
- Run `npm run refresh:build`.
- Deploy `dist/`.
- Verify every page has the GA tag with Tag Assistant.
- Submit `/sitemap.xml` in Google Search Console.
- Test rich results for story pages.
- Run Lighthouse mobile performance/accessibility/SEO checks.
- Replace placeholder privacy language with a final privacy policy.
- Add a real monitored contact email.
- Get legal review for domain, brand, trademark disclaimer, and publisher/source usage.
