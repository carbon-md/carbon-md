import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregate, creditedTonnes, methodOf, type ContributionEvent } from "../core/ledger.js";
import { classifyMethod } from "../rails/x402.js";

const contribution = (tonnes: number, method?: ContributionEvent["method"]): ContributionEvent => ({
  type: "contribution",
  ts: "2026-08-01T00:00:00Z",
  tonnes,
  cost: 1,
  currency: "USD",
  rail: "x402:klima",
  receipt: "https://example.test/receipt",
  ...(method ? { method } : {}),
});

test("classifyMethod: avoidance is tested first so 'avoided deforestation' is not a forestry removal", () => {
  assert.equal(classifyMethod({ carbonClassId: "0x1", name: "Avoided Deforestation" }), "avoidance");
  assert.equal(classifyMethod({ carbonClassId: "0x2", name: "REDD+ avoided emissions" }), "avoidance");
});

test("classifyMethod: durable removal classes are recognised", () => {
  assert.equal(classifyMethod({ carbonClassId: "0x3", name: "Biochar" }), "removal");
  assert.equal(classifyMethod({ carbonClassId: "0x4", name: "Ocean Alkalinity Enhancement" }), "removal");
});

test("classifyMethod: anything unrecognised stays unspecified, never guessed into removal", () => {
  assert.equal(classifyMethod({ carbonClassId: "0x5", name: "Some New Credit Type" }), "unspecified");
});

test("methodOf: pre-existing rows report unspecified rather than counting as removal", () => {
  assert.equal(methodOf(contribution(0.01)), "unspecified");
  assert.equal(methodOf(contribution(0.01, "removal")), "removal");
});

test("creditedTonnes: removal-only is discharged by removal alone", () => {
  const t = aggregate([
    contribution(0.004, "removal"),
    contribution(0.005, "avoidance"),
    contribution(0.003), // legacy row -> unspecified
  ]);

  // every purchase is still recorded and reported
  assert.equal(Number(t.contributedTonnes.toFixed(6)), 0.012);

  // ...but only removal settles a removal-only obligation
  assert.equal(Number(creditedTonnes(t, "removal-only").toFixed(6)), 0.004);

  // other portfolios credit every verified contribution
  assert.equal(Number(creditedTonnes(t, "removal-weighted").toFixed(6)), 0.012);
  assert.equal(Number(creditedTonnes(t, "balanced").toFixed(6)), 0.012);
});
