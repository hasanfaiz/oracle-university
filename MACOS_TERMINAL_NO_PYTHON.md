# macOS Terminal setup — no Python

This project runs with Node.js and npm only. It does not require Python.

## 1. Install Node.js

Use one of these methods:

### Option A: Official Node.js installer

Download and install the macOS `.pkg` from the official Node.js website, then reopen Terminal.

### Option B: Homebrew

```bash
brew install node
```

## 2. Confirm Node and npm

```bash
node -v
npm -v
```

Use Node.js 20 or newer.

## 3. Unzip and open project

Assuming the ZIP is in Downloads:

```bash
cd ~/Downloads
unzip oracle-university-daily-flipboard-v3-node-only.zip
cd oracle-university-flipboard-v3-node-only
```

## 4. Build static pages

```bash
npm run build
```

## 5. Preview locally

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:8080
```

Stop the server:

```text
Control + C
```

## 6. Refresh news with APIs

Paste only the API keys you actually have:

```bash
export SITE_URL="https://oracle-university.com"
export NEWS_PROVIDER="auto"
export MAX_ARTICLES="120"
export NEWSDATA_API_KEY="your_newsdata_key"
export FREENEWSAPI_KEY="your_freenewsapi_key"
export GNEWS_API_KEY="your_gnews_key"

npm run refresh:build
npm run dev
```

For sample-only preview:

```bash
SAMPLE_ONLY=1 npm run refresh:build
npm run dev
```

## 7. Deploy files

Upload the `dist/` folder to your hosting provider, or connect the project to Vercel, Netlify, Cloudflare Pages, or GitHub Pages.

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```
