import { test } from "node:test";
import assert from "node:assert/strict";
import { retirementEvent } from "../commands/contribute.js";
import { anchorFrom } from "../commands/passport.js";

test("an x402 retirement keeps its transaction hash, so the passport anchor can be resolved", () => {
  const event = retirementEvent({
    tonnes: 0.02,
    cost: 2.6,
    certificateUrls: ["https://example.test/retirements/1"],
    txHash: "0xabc",
    creditClass: "Biochar",
    method: "removal",
  });
  assert.equal(event.tx_hash, "0xabc");
  assert.equal(event.receipt, "https://example.test/retirements/1");

  const anchor = anchorFrom(event);
  assert.equal(anchor.tx_hash, "0xabc");
  assert.equal(anchor.chain_id, 8453);
  assert.equal(anchor.method, "removal");
  assert.equal(anchor.certificate_url, "https://example.test/retirements/1");
});

test("without a certificate yet, the receipt falls back to the transaction on Basescan", () => {
  const event = retirementEvent({
    tonnes: 0.02,
    cost: 2.6,
    certificateUrls: [],
    txHash: "0xdef",
    creditClass: "Biochar",
    method: "removal",
  });
  assert.equal(event.receipt, "https://basescan.org/tx/0xdef");
});

test("a retirement without a hash records no tx_hash field rather than an empty one", () => {
  const event = retirementEvent({
    tonnes: 0.02,
    cost: 2.6,
    certificateUrls: ["https://example.test/retirements/2"],
    creditClass: "Biochar",
    method: "removal",
  });
  assert.equal("tx_hash" in event, false);
});
