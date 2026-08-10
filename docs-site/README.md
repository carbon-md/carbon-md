# docs.carbonmd.dev

Source for the carbon.md documentation site. Zero-dependency static generator — builds anywhere, offline.

```bash
node build.mjs                 # → dist/
npx wrangler pages deploy dist --project-name carbonmd-docs
```

## Layout

| Path | Purpose |
|---|---|
| `nav.json` | sidebar structure + page registry (add pages here) |
| `content/` | the docs, in Markdown |
| `build.mjs` | the generator (markdown subset + layout) |
| `style.css` | design system — matches carbonmd.dev (dark, `#0A0C0B` / `#4ADE80`) |
| `dist/` | build output (gitignored) |

## Adding a page

1. `content/<section>/<page>.md`
2. register it in `nav.json`
3. `node build.mjs`

Nav, prev/next, sitemap and the on-page TOC update automatically.

## Convention

**A feature is not done until it's documented.** See [content/docs-conventions.md](content/docs-conventions.md) for what each kind of change must document.

## Deploy notes

- Cloudflare Pages project: `carbonmd-docs` → attach `docs.carbonmd.dev` (CNAME `docs` → `carbonmd-docs.pages.dev`, proxied).
- The build copies `../repo/agent.txt` to `/agent`, `/agent.txt` and `/.well-known/carbon-md/agent.txt`, and writes `_headers` so they're served as `text/plain`.
