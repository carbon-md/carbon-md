> **Traduction FR en cours.** Version anglaise ci-dessous — [EN](/guides/publish-ledger/).

# Publish your ledger

`export` produces a self-contained static folder. Host it anywhere — the point is that a stranger can check your claim without trusting you.

```bash
npx carbon-md export
```

## Cloudflare Pages

```bash
npx wrangler pages deploy public --project-name my-carbon-ledger
```

Attach a custom domain in the Pages project settings. If you use a subdomain like `carbon.example.com`, add a **CNAME** record pointing at `<project>.pages.dev` (proxied).

## GitHub Pages

Commit the output folder and enable Pages on that directory:

```bash
npx carbon-md export --out docs
git add docs && git commit -m "Publish carbon ledger" && git push
# then: Settings → Pages → Deploy from branch → /docs
```

## Vercel / Netlify / any static host

Point the host at the output directory. There is no build step, no framework, and no runtime — just HTML, an SVG, and a JSON file.

## The badge

```markdown
![carbon.md](https://your-ledger-url/badge.svg)
```

Link it to the ledger page so the badge is a door, not a decoration:

```markdown
[![carbon.md](https://your-ledger-url/badge.svg)](https://your-ledger-url/)
```

## Keeping it fresh

The page is a snapshot. Regenerate after syncing usage or recording a contribution — a stale ledger is worse than none, because it silently overstates how current your proof is.

```bash
npx carbon-md sync claude-code && npx carbon-md export
```

Automate it alongside your capture cron:

```bash
0 3 * * * cd /path/to/project && npx carbon-md sync claude-code && npx carbon-md export && npx wrangler pages deploy public --project-name my-carbon-ledger
```

## Before you publish

- Check `reporting.public_ledger: true` in your policy — `export` warns otherwise.
- Confirm nothing sensitive is in your project name or source labels (they appear on the page).
- Read the generated copy once. It should say *measured and contributed*, never *neutral*. See [Claims & compliance](/guides/claims/).
