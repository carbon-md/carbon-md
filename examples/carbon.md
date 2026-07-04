---
carbon_md: "0.1"
policy:
  contribution_target: 1.10
  portfolio: removal-weighted
  monthly_budget_max: { amount: 25, currency: USD }
  approval_above: { amount: 10, currency: USD }
reporting:
  mode: local
  public_ledger: true
methodology: carbonmd-factors-2026-07
---

# Carbon Policy — cli-test

This project's agents measure their inference emissions and fund verified
carbon-removal contributions per the policy above.

- Estimates use versioned open factors (`carbonmd-factors-2026-07`) and are
  shown as ranges — they are estimates, not measurements.
- Contributions are aggregated monthly; orders above the approval
  threshold require human confirmation.
- This project does **not** claim carbon neutrality. It measures, reduces
  where it can, and contributes to verified carbon removal.

Managed with [carbon-md](https://github.com/carbon-md/carbon-md) — `npx carbon-md status`
