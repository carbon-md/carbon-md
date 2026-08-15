import { CORS, fetchPassport, json, verifyPassport } from "../_lib/passport.js";

/**
 * POST /v1/verify        body = a passport document
 * GET  /v1/verify?url=…  fetches the passport, then verifies it
 *
 * Read-only, unauthenticated, CORS-open: verification is the public good.
 * The answer is derived from the document itself, so this endpoint is a
 * convenience — never the authority. Anyone can run `carbon-md verify`
 * locally and get the same verdict.
 */
export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url = new URL(request.url);
  const offline = url.searchParams.get("offline") === "1" || url.searchParams.get("offline") === "true";

  let passport;
  try {
    if (request.method === "POST") {
      passport = await request.json();
    } else if (request.method === "GET") {
      const target = url.searchParams.get("url");
      if (!target) {
        return json(
          {
            error: "missing url",
            usage: {
              get: "/v1/verify?url=https://example.dev/passport.json",
              post: "POST /v1/verify with the passport document as the JSON body",
              options: { offline: "1 to skip the on-chain anchor check" },
            },
            docs: "https://docs.carbonmd.dev/cli/verify/",
          },
          400
        );
      }
      passport = await fetchPassport(target);
    } else {
      return json({ error: "method not allowed" }, 405);
    }
  } catch (e) {
    return json({ error: (e && e.message) || String(e) }, 400);
  }

  if (!passport || typeof passport !== "object" || !passport.carbon_passport) {
    return json({ error: "not a carbon.md passport document" }, 422);
  }

  const result = await verifyPassport(passport, { offline });

  // A verdict can change (anchors settle, passports expire), so keep it short-lived.
  return json(result, 200, { "cache-control": "public, max-age=300" });
}
