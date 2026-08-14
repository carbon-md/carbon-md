# carbon-md factors

Prints the active factor table — what the estimates are actually built on.

```bash
npx carbon-md factors
```

## Output

```
carbonmd-factors-2026-08
gCO2e per 1k output tokens · input weighted 0.2x

  class      low    central   high
  frontier   1.5      4.5     15
  large      0.8      2.5      8
  medium     0.2      0.8      2.5
  small      0.03     0.15     0.6

  Derived from EcoLogits methodology + public provider disclosures,
  ~400 gCO2e/kWh world-average grid. Estimates, not measurements.
```

Model → class examples (living catalog): see [Model catalog](/models/).

## Why this is a command

Because the numbers should be inspectable without reading source code. If someone challenges a figure on your ledger, this is the answer — the version, the bands, and the derivation, on demand.

## Using it to audit your own ledger

Every ledger event stamps the factors version it was computed with. Compare:

```bash
npx carbon-md factors
grep -o '"factors":"[^"]*"' .carbon-md/ledger.jsonl | sort | uniq -c
```

If you see more than one version, your ledger spans a methodology revision — expected over time, and precisely why the stamp exists. Old events are never retroactively recomputed.

## Related

- [Methodology & factors](/methodology/) — the full derivation, token rules, and limitations
- [Contributing factors](https://github.com/carbon-md/carbon-md) — new models and better sources are welcome
