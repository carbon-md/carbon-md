# Docs conventions

How these docs are built and extended. **Every feature ships with its documentation** — that is the rule this page exists to enforce.

## Where things live

```
docs-site/
├── nav.json          # sidebar structure + page registry  ← add pages here
├── nav-fr.json       # the same, for French — register in BOTH
├── build.mjs         # zero-dependency static generator
├── style.css         # the whole design system
├── content/          # the docs, in Markdown
│   ├── index.md
│   ├── cli/<command>.md
│   └── guides/<topic>.md
├── content-fr/       # the French translations, mirroring content/
├── functions/        # Cloudflare Pages Functions: locale middleware + /v1 API
├── static/           # copied verbatim into dist/ (e.g. examples/passport.json)
└── dist/             # build output (gitignored) — dist/fr/ is the French site
```

## Build

```bash
node build.mjs              # → dist/ (EN) and dist/fr/ (FR)
node build.mjs --locale fr  # French only
node build.mjs --out public # custom output
```

A bare `node build.mjs` builds **both** locales. Naming `--locale` or `--out` builds only what you named — and because the EN pass spares `dist/fr` rather than deleting it, an EN-only build leaves French silently frozen instead of failing.

No dependencies, no install, no network. It builds on a laptop, in CI, or from an agent on a VPS with no npm access. The Markdown subset is deliberate: headings, lists, tables, fenced code, blockquotes, links, emphasis, rules.

## Deploy

```bash
npx wrangler pages deploy dist --project-name carbonmd-docs
```

Then attach `docs.carbonmd.dev` to the Pages project and add a **CNAME** record `docs → carbonmd-docs.pages.dev` (proxied).

The build also emits the agent install contract at `/agent`, `/agent.txt`, and `/.well-known/carbon-md/agent.txt` (copied from `repo/agent.txt`), plus `robots.txt` and `sitemap.xml`.

## Adding a page

1. Write `content/<section>/<page>.md` **and** `content-fr/<section>/<page>.md`.
2. Register it in `nav.json` **and** `nav-fr.json` under the right section:

```json
{ "file": "cli/passport.md", "slug": "cli/passport", "title": "passport" }
```

3. Rebuild. Navigation, previous/next links, the sitemap, and the on-page table of contents all update themselves.

## The rule: a feature is not done until it's documented

When a feature lands, the same change adds:

| Feature type | Documentation required |
|---|---|
| **New CLI command** | a page in `content/cli/`, plus a row in the [CLI overview](/cli/) table |
| **New capture source** | a section in [Capture recipes](/guides/capture/) + a row in its compatibility table |
| **New spec field** | a subsection in [The carbon.md file](/spec/) |
| **New rail or money path** | a section in [Retirements & receipts](/guides/retirements/) + the safety model |
| **Factor table revision** | a version bump in [Methodology](/methodology/), old events keep their stamp |
| **New hosted endpoint** | a section in [Attestation API](/api/), with its error codes |
| **Anything user-visible** | remove it from [What's coming](/roadmap/) once shipped |
| **Every one of the above** | the French page, in the same change — see below |

## Both languages, or neither

A page that exists only in English is a page French readers cannot use; a French page that lags is worse, because it looks current and isn't. So a change lands in `content/` and `content-fr/` together, registered in both nav files.

Translate prose and table headers. Leave commands, flags, JSON, YAML and CLI output exactly as they are — a reader retypes those. Internal links get the `/fr` prefix. Terms of art the ecosystem uses in English (`removal`, `avoidance`, x402, rail) stay English; use *registre*, *retrait*, *ancres*, *fourchettes* for the rest.

If a translation genuinely cannot be finished in the same change, that is worth saying out loud on the page rather than shipping English under a banner and forgetting it.

## House style

- **Show the command, then the output.** Real output, not idealised.
- **State limitations plainly.** What isn't counted, what's guessed, what's assumed. Credibility is the product.
- **Ranges, always.** Never present a single-point emission figure as fact.
- **Contribution language only.** Never "neutral" or "positive" — see [Claims & compliance](/guides/claims/).
- **Mark unshipped work `(planned)`** and link to [What's coming](/roadmap/). Never document something as if it exists.
- **Link sideways.** Every page ends with related pages; a reader should never hit a dead end.
- **Second person, present tense, short sentences.** Explain the *why* once, then get out of the way.

## Versioning

The docs track the shipped CLI. When behaviour changes:

- update the page in the same change as the code,
- if the change is breaking, say so explicitly on the page,
- factor-table revisions get a new version string — never a silent edit.

## Contributing

Docs live in the same repository as the code: [github.com/carbon-md/carbon-md](https://github.com/carbon-md/carbon-md). Corrections are as welcome as features — especially anywhere the docs overstate what the tool actually does.
