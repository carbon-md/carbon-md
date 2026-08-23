import test from "node:test";
import assert from "node:assert/strict";

import { classify, estimateGco2e, FACTORS_VERSION } from "../core/factors.js";

test("factors version is stamped 2026-08", () => {
  assert.equal(FACTORS_VERSION, "carbonmd-factors-2026-08");
});

test("frontier flagships", () => {
  for (const m of [
    "gpt-5.5",
    "gpt-5.6-sol",
    "o3",
    "o4",
    "claude-opus-5",
    "claude-fable-5",
    "claude-mythos-1",
    "gemini-3.1-pro-preview",
  ]) {
    const r = classify(m);
    assert.equal(r.cls, "frontier", `${m} should be frontier`);
    assert.equal(r.guessed, false, `${m} should not be guessed`);
  }
});

test("gpt-5.4 full tier is frontier, mini is small", () => {
  assert.equal(classify("gpt-5.4").cls, "frontier");
  assert.equal(classify("gpt-5.4-mini").cls, "small");
});

test("small tiers", () => {
  for (const m of [
    "gpt-5.6-luna",
    "gpt-5-luna",
    "gpt-5.4-mini",
    "gpt-5-nano",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.1-flash-lite",
    "deepseek-v4-flash",
    "claude-haiku-4",
    "gemma-4-9b",
    "phi-5-mini",
    "nvidia/nemotron-3.5-lightning",
    "liquid/lfm-2.5-2.6b",
    "stepfun/step-3.7-flash",
    "deepseek/deepseek-v4-flash-vision-exp",
    "tencent/hy-mt2-1.8b",
    "tencent/hy-mt2-7b",
    "tencent/hy-mt2-30b-a3b",
  ]) {
    const r = classify(m);
    assert.equal(r.cls, "small", `${m} should be small`);
    assert.equal(r.guessed, false, `${m} should not be guessed`);
  }
});

test("grok-composer-2.5-fast is small (2026-08 steer decision)", () => {
  // Deliberate: composer+fast cheap tier overrides the has("grok") -> large
  // rule. Documented in docs-site/content/models.md.
  const r = classify("grok-composer-2.5-fast");
  assert.equal(r.cls, "small");
  assert.equal(r.guessed, false);
});

test("large workhorses", () => {
  for (const m of [
    "gpt-5.6-terra",
    "gpt-4o",
    "claude-sonnet-5",
    "grok-4.3",
    "grok-4.6",
    "grok-build-0.1",
    "grok-4",
    "kimi-k2.6",
    "kimi-k2.7-code",
    "kimi-k3",
    "kimi-for-coding",
    "deepseek-v4-pro",
    "deepseek/deepseek-v4-pro",
    "qwen/qwen3.7-max",
    "qwen/qwen3.8-max",
    "qwen/qwen3.8-2.4t-a95b",
    "qwen/qwen3.8-27b",
    "deepseek/deepseek-v4-pro-0813",
    "bytedance-seed/seed-2-1-turbo",
    "bytedance-seed/seed-2.0-code",
    "sakana/sakana-namazu",
    "qwen3-max",
    "z-ai/glm-5.2",
    "z-ai/glm-5.3",
    "glm-5",
    "meta/muse-spark-1.2-contributor",
    "mistral-large-3",
    "command-a",
    "llama-3.1-405b",
    "deepseek-r1",
  ]) {
    const r = classify(m);
    assert.equal(r.cls, "large", `${m} should be large`);
    assert.equal(r.guessed, false, `${m} should not be guessed`);
  }
});

test("unknown models fall to medium + guessed", () => {
  const r = classify("some-random-model-9000");
  assert.equal(r.cls, "medium");
  assert.equal(r.guessed, true);
  const ox = classify("stealth/ox-alpha");
  assert.equal(ox.cls, "medium");
  assert.equal(ox.guessed, true);
});

test("small params markers (1b..14b) win first", () => {
  // smallB is checked in the small block, before family rules like qwen.
  assert.equal(classify("qwen3-8b").cls, "small");
  assert.equal(classify("llama-3.2-3b").cls, "small");
  assert.equal(classify("liquid/lfm-2.5-2.6b").cls, "small");
  assert.equal(classify("some-70b-model").cls, "medium"); // 70b is out of the small band
  assert.equal(classify("bytedance-seed/seed-2.0-lite").cls, "small");
  assert.equal(classify("bytedance-seed/seed-2.0-mini").cls, "small");
});

test("estimate factors follow the class", () => {
  const small = estimateGco2e("gpt-5.6-luna", 0, 1000);
  const frontier = estimateGco2e("gpt-5.6-sol", 0, 1000);
  assert.ok(small.central < frontier.central);
  assert.equal(small.cls, "small");
  assert.equal(frontier.cls, "frontier");
});
