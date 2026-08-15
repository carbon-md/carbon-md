import { CORS, fetchPassport, verifyPassport } from "../_lib/passport.js";

/**
 * GET /v1/badge?url=…  — a badge that re-verifies on every request.
 *
 * The point of a live badge: a tampered or lapsed passport flips its own
 * badge. A static image can drift from reality; this cannot.
 */

const INK = "#131414";
const COLOURS = {
  L2: "#2F5D3A", // moss — contribution verified
  L1: "#4a5c50", // muted green — measured only
  L0: "#8a5a00", // amber — declared / unverified
  invalid: "#9b2c2c",
  stale: "#8a5a00",
  error: "#71757C",
};

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function badge(label, value, accent) {
  const w = (s) => Math.round(6.2 * s.length + 12);
  const lw = w(label);
  const vw = w(value);
  const tw = lw + vw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="20" role="img" aria-label="${esc(label)}: ${esc(value)}">
<title>${esc(label)}: ${esc(value)}</title>
<rect width="${tw}" height="20" rx="3" fill="${INK}"/>
<rect x="${lw}" width="${vw}" height="20" rx="3" fill="${accent}"/>
<rect x="${lw}" width="8" height="20" fill="${accent}"/>
<g fill="#fff" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="11">
<text x="${lw / 2}" y="14" text-anchor="middle">${esc(label)}</text>
<text x="${lw + vw / 2}" y="14" text-anchor="middle">${esc(value)}</text>
</g></svg>`;
}

function svg(body, status, maxAge) {
  return new Response(body, {
    status: status || 200,
    headers: Object.assign(
      {
        "content-type": "image/svg+xml; charset=utf-8",
        // short cache: the badge must be able to change when the truth does
        "cache-control": "public, max-age=" + (maxAge || 300),
      },
      CORS
    ),
  });
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url = new URL(request.url);
  const target = url.searchParams.get("url");
  const label = url.searchParams.get("label") || "carbon.md";

  if (!target) return svg(badge(label, "no url", COLOURS.error), 400, 60);

  let result;
  try {
    const passport = await fetchPassport(target);
    if (!passport || !passport.carbon_passport) return svg(badge(label, "not a passport", COLOURS.error), 422, 60);
    result = await verifyPassport(passport, {});
  } catch {
    return svg(badge(label, "unreachable", COLOURS.error), 502, 60);
  }

  let value;
  let accent;
  if (result.verdict === "invalid") {
    value = "unverified";
    accent = COLOURS.invalid;
  } else if (result.verdict === "stale") {
    value = result.trust_level + " stale";
    accent = COLOURS.stale;
  } else {
    value = result.trust_level + " verified";
    accent = COLOURS[result.trust_level] || COLOURS.L0;
  }

  return svg(badge(label, value, accent));
}
