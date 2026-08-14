# carbon-md export

Builds the public artifacts: a ledger page, a README badge, and the machine-readable dump.

```bash
npx carbon-md export [--out <dir>]
```

Default output directory is `public/`.

## What it writes

| File | Purpose |
|---|---|
| `index.html` | self-contained ledger page (no JS, no external assets) |
| `badge.svg` | static badge for your README |
| `ledger.json` | the verifiable data dump |

```
✔ Exported public ledger to /path/public
  index.html · badge.svg · ledger.json

Publish it:
  Cloudflare Pages:  wrangler pages deploy public --project-name carbon-md-ledger
  GitHub Pages:      commit the folder and enable Pages
  Badge in README:   ![carbon.md](https://YOUR-LEDGER-URL/badge.svg)
```

## The page

Shows emissions this month and all time (with ranges), contribution position against policy, a breakdown by model and by source, and every contribution with a link to its receipt. It states plainly that emissions are **estimated, not measured**, names the methodology version, and makes no neutrality claim. See [Claims & compliance](/guides/claims/).

## `ledger.json`

The machine-readable summary — the thing a third party can check:

```jsonc
{
  "project": "my-project",
  "generated_at": "2026-08-01 09:12 UTC",
  "methodology": "carbonmd-factors-2026-08",
  "policy": { "contribution_target": 1.1, "portfolio": "removal-weighted", … },
  "totals": {
    "estimated_gco2e": { "low": 810, "central": 1510, "high": 2900, "calls": 128, "tokens": 873412 },
    "contributed_tonnes": 0.005,
    "target_tonnes": 0.0017,
    "met": true
  },
  "contributions": [ … ],
  "events_count": 412
}
```

> This file is the seed of the forthcoming **Carbon Passport** — the same summary, signed and anchored to on-chain receipts, so a stranger can verify it programmatically. See [What's coming](/roadmap/).

## Badge

```markdown
![carbon.md](https://your-ledger-url/badge.svg)
```

The badge reflects reality: `X matched ✔` once the policy target is met, otherwise `X tracked`.

## Notes

- **Regenerate after every contribution** — the page is a static snapshot.
- If `reporting.public_ledger` is `false` in your policy, `export` warns before you publish.
- Everything is self-contained: no analytics, no fonts, no third-party requests.

See [Publish your ledger](/guides/publish-ledger/) for hosting.
