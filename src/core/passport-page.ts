import { formatG } from "./factors.js";
import type { Passport, TrustLevel } from "./passport.js";

/** Brand palette — same ink/paper/moss as the ledger page. */
const C = { ink: "#131414", paper: "#F4F0E6", moss: "#2F5D3A", grey: "#71757C", amber: "#8a5a00" };

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

const LEVEL_COPY: Record<TrustLevel, { label: string; note: string }> = {
  L0: { label: "declared", note: "A policy exists. Nothing is proven beyond that." },
  L1: { label: "measured", note: "Signature valid, usage recorded with uncertainty ranges, methodology pinned." },
  L2: { label: "contribution-verified", note: "Retirements resolve on-chain and satisfy the policy." },
  L3: { label: "certified", note: "Audited by carbon.md." },
};

/**
 * The public passport page: a claim a stranger can check, not a badge to admire.
 * Everything here is derived from the signed document itself — no server needed.
 */
export function passportHtml(p: Passport, level: TrustLevel, verifyUrl: string): string {
  const copy = LEVEL_COPY[level];
  const met = p.contribution.credited_tonnes >= p.contribution.target_tonnes && p.contribution.target_tonnes > 0;
  const pos = (p.policy.contribution_target * 100).toFixed(0);

  const anchors = p.contribution.anchors ?? [];
  const anchorRows = anchors.length
    ? anchors
        .map((a) => {
          const link = a.certificate_url
            ? `<a href="${esc(a.certificate_url)}">certificate →</a>`
            : a.tx_hash
              ? `<a href="https://basescan.org/tx/${esc(a.tx_hash)}">tx →</a>`
              : '<span class="dim">—</span>';
          const method = a.method && a.method !== "unspecified"
            ? `<span class="tag ${a.method === "removal" ? "ok" : "warn"}">${esc(a.method)}</span>`
            : `<span class="tag warn">unspecified</span>`;
          return `<tr><td>${esc(a.credit_class ?? a.project ?? a.rail)}</td><td>${method}</td><td class="n">${a.tonnes} tCO₂e</td><td>${link}</td></tr>`;
        })
        .join("")
    : `<tr><td colspan="4" class="dim">No retirements anchored yet — this passport claims measurement only.</td></tr>`;

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.subject.name)} — carbon.md passport</title>
<meta name="description" content="Verifiable carbon passport for ${esc(p.subject.name)}: measured emissions and the retirements that back the contribution claim.">
<style>
:root{--ink:${C.ink};--paper:${C.paper};--moss:${C.moss};--grey:${C.grey};--amber:${C.amber}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);
  font-family:ui-monospace,"JetBrains Mono","IBM Plex Mono",SFMono-Regular,Menlo,monospace;
  line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:820px;margin:0 auto;padding:48px 24px 80px}
.dashes{color:var(--moss);letter-spacing:.4em;font-size:14px}
h1{font-size:29px;font-weight:600;margin:.2em 0 .1em;letter-spacing:-.01em}
h1 .md{color:var(--moss)}
.tag{display:inline-block;font-size:11px;border:1px solid currentColor;border-radius:3px;padding:0 6px}
.tag.ok{color:var(--moss)} .tag.warn{color:var(--amber)}
.level{display:inline-flex;align-items:baseline;gap:8px;margin:14px 0 4px;padding:7px 14px;border-radius:5px;
  background:var(--ink);color:var(--paper)}
.level b{font-size:19px}
.level span{font-size:12px;opacity:.85}
.note{color:var(--grey);font-size:13px;margin:0 0 2em;max-width:62ch}
h2{font-size:12px;text-transform:uppercase;letter-spacing:.14em;color:var(--grey);
  border-bottom:1px solid var(--ink);padding-bottom:6px;margin:2.4em 0 1em}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
@media(max-width:620px){.grid{grid-template-columns:1fr}}
.big{font-size:25px;font-weight:600}
.range{color:var(--grey);font-size:13px}
table{width:100%;border-collapse:collapse;font-size:13.5px}
td{padding:7px 4px;border-bottom:1px solid rgba(19,20,20,.1);vertical-align:top}
.n{text-align:right;font-variant-numeric:tabular-nums}
.dim{color:var(--grey)}
a{color:var(--moss)}
.met{color:var(--moss);font-weight:600} .due{color:var(--amber);font-weight:600}
pre{background:rgba(19,20,20,.05);border:1px solid rgba(19,20,20,.12);border-radius:6px;
  padding:12px 14px;overflow-x:auto;font-size:12.5px;margin:.6em 0}
.foot{margin-top:3em;padding-top:1.2em;border-top:1px solid var(--ink);color:var(--grey);font-size:12.5px}
code{font-size:12.5px}
</style></head>
<body><div class="wrap">
<div class="dashes">— — —</div>
<h1>${esc(p.subject.name)} <span class="dim" style="font-weight:400">·</span> carbon<span class="md">.md</span> passport</h1>

<div class="level"><b>${level}</b> <span>${esc(copy.label)}</span></div>
<p class="note">${esc(copy.note)} This level is derived from evidence — re-check it yourself below rather than taking this page's word for it.</p>

<h2>Emissions estimated</h2>
<div class="grid">
<div><div class="dim">central</div><div class="big">${formatG(p.estimated_gco2e.central)}</div>
<div class="range">${formatG(p.estimated_gco2e.low)} – ${formatG(p.estimated_gco2e.high)}</div></div>
<div><div class="dim">activity</div><div class="big">${p.estimated_gco2e.calls.toLocaleString()} calls</div>
<div class="range">${p.estimated_gco2e.tokens.toLocaleString()} tokens · ${esc(p.period.from)} → ${esc(p.period.to)}</div></div>
</div>

<h2>Contribution position</h2>
<p>Target: <b>${pos}%</b> of estimated emissions → <b>${p.contribution.target_tonnes} tCO₂e</b><br>
Credited: <b>${p.contribution.credited_tonnes} tCO₂e</b> ${p.contribution.contributed_tonnes !== p.contribution.credited_tonnes ? `<span class="dim">(of ${p.contribution.contributed_tonnes} contributed — see policy)</span>` : ""} ·
${met ? '<span class="met">✔ target met</span>' : '<span class="due">outstanding</span>'}<br>
Policy: <code>${esc(p.policy.portfolio)}</code></p>

<h2>Retirements anchored</h2>
<table><tbody>${anchorRows}</tbody></table>

<h2>Verify this yourself</h2>
<p class="dim">Don't trust this page. The passport is signed; check it against its own identity:</p>
<pre>npx carbon-md verify ${esc(verifyUrl)}</pre>
<p class="dim">Works offline for the signature, the ranges and the freshness check; add nothing to also resolve the on-chain anchors.</p>

<p class="foot">
Identity <code>${esc(p.subject.id)}</code><br>
Methodology <code>${esc(p.methodology)}</code> · issued ${esc(p.issued_at.slice(0, 10))} · expires ${esc(p.expires_at.slice(0, 10))}.<br><br>
Emissions are <b>estimated, not measured</b> — cloud inference is a black box and ranges are wide by design.
This project does not claim carbon neutrality; it measures its agents' emissions and matches them
${pos}% with verified carbon credits. Data: <a href="./passport.json">passport.json</a> ·
built by <a href="https://github.com/carbon-md/carbon-md">carbon-md</a> ·
stewarded by <a href="https://agentic-realism.com">Agentic Realism</a>.
</p>
</div></body></html>`;
}
