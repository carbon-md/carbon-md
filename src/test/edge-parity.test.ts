import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createKey } from "../core/keys.js";
import { canonicalize, deriveTrustLevel, sign, verifySignature, type Passport } from "../core/passport.js";
// The edge runtime port: the hosted API must reach the same verdict as the CLI,
// or "verified" would quietly mean two different things. Loaded dynamically —
// it is plain JS for Cloudflare Workers and lives outside the TS rootDir.
// @ts-ignore — plain JS for Cloudflare Workers, no type declarations by design
const edge: any = await import("../../docs-site/functions/_lib/passport.js");
const edgeCanonicalize = edge.canonicalize;
const edgeDerive = edge.deriveTrustLevel;
const edgeVerify = edge.verifySignature;

const passport = (over: Partial<Passport> = {}): Passport => ({
  carbon_passport: "0.1",
  subject: { id: "did:key:zTest", name: "demo", kind: "project" },
  period: { from: "2026-08-01", to: "2026-08-31" },
  methodology: "carbonmd-factors-2026-08",
  policy: { contribution_target: 1.1, portfolio: "removal-weighted" },
  estimated_gco2e: { low: 93, central: 285, high: 930, calls: 2, tokens: 306000 },
  contribution: {
    target_tonnes: 0.0003,
    contributed_tonnes: 0.0005,
    credited_tonnes: 0.0005,
    met: true,
    anchors: [{ rail: "x402:klima", tx_hash: "0xabc", tonnes: 0.0005, method: "removal" }],
  },
  trust_level: "L2",
  issued_at: "2026-08-15T00:00:00Z",
  expires_at: "2099-01-01T00:00:00Z",
  issuer: "did:key:zTest",
  ...over,
});

test("edge port canonicalizes identically — signatures must agree byte for byte", () => {
  const p = passport();
  assert.equal(edgeCanonicalize(p), canonicalize(p));
  assert.equal(edgeCanonicalize({ b: 1, a: [2, { d: 3, c: 4 }] }), canonicalize({ b: 1, a: [2, { d: 3, c: 4 }] }));
});

test("edge port verifies the same signatures, and rejects the same tampering", async () => {
  const dir = mkdtempSync(join(tmpdir(), "carbon-md-parity-"));
  try {
    const key = createKey(dir);
    const signed = sign(passport({ subject: { id: key.did, name: "demo", kind: "project" } }), key);
    assert.equal((await edgeVerify(signed)).valid, verifySignature(signed).valid);
    assert.equal((await edgeVerify(signed)).valid, true);

    const tampered = { ...signed, contribution: { ...signed.contribution, credited_tonnes: 999 } };
    assert.equal((await edgeVerify(tampered)).valid, false);
    assert.equal(verifySignature(tampered as Passport).valid, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("edge port derives the same trust level, warnings included", () => {
  const cases: Array<[boolean, boolean]> = [
    [true, true],
    [true, false],
    [false, true],
  ];
  for (const [signatureValid, anchorsResolved] of cases) {
    const p = passport();
    assert.deepEqual(
      edgeDerive(p, { signatureValid, anchorsResolved }),
      deriveTrustLevel(p, { signatureValid, anchorsResolved }),
      `mismatch for sig=${signatureValid} anchors=${anchorsResolved}`
    );
  }

  // and on the case that actually matters: avoidance under a removal policy
  const avoidance = passport({
    contribution: {
      target_tonnes: 0.0003,
      contributed_tonnes: 0.0005,
      credited_tonnes: 0.0005,
      met: true,
      anchors: [{ rail: "x402:klima", tx_hash: "0xabc", tonnes: 0.0005, method: "avoidance" }],
    },
  });
  assert.deepEqual(
    edgeDerive(avoidance, { signatureValid: true, anchorsResolved: true }),
    deriveTrustLevel(avoidance, { signatureValid: true, anchorsResolved: true })
  );
});
