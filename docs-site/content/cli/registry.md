# carbon-md registry

Maintains the signed certification registry. **This is the issuer's command** — you need the issuer key to write, and only carbon.md holds it. Everyone else uses `registry verify` to read.

```bash
npx carbon-md registry <init|list|add|revoke|sign|verify>
```

See [Certification & the registry](/certification/) for what L3 means and why the registry is shaped this way.

## verify

The one subcommand anyone can usefully run:

```bash
npx carbon-md registry verify https://docs.carbonmd.dev/.well-known/carbon-md/registry.json
npx carbon-md registry verify --subject did:key:z6Mk…   # and check one subject
```

Exits non-zero if the signature fails or the registry has expired, so it works as a CI gate.

## init

```bash
npx carbon-md registry init
```

Creates the issuer key at `~/.carbon-md/registry-key.json` (mode `0600`) and writes an empty, signed registry.

The key lives **outside any project directory** on purpose: it signs statements about other people, so it must never be something a repository can accidentally carry. Losing it means every certification has to be re-issued under a new identity — and the DID pinned in the CLI has to change with it. Back it up privately.

## add

```bash
npx carbon-md registry add \
  --subject did:key:z6Mk… \
  --name "hermes" \
  --tier maker \
  --valid-until 2027-08-15 \
  --certificate-url https://carbonmd.dev/certified/hermes
```

| Flag | Meaning |
|---|---|
| `--subject` | **required** — the subject's `did:key`, exactly as it appears in their passport |
| `--name` | **required** — human-readable name for the public listing |
| `--tier` | `maker` \| `product` \| `enterprise` (default `maker`) |
| `--valid-until` | `YYYY-MM-DD`, default one year out |
| `--methodology` | factor version the review covered |
| `--certificate-url` | the public certificate |
| `--note` | scope note recorded with the entry |

Refuses to certify a subject that already has an active entry — revoke first.

## revoke

```bash
npx carbon-md registry revoke --subject did:key:z6Mk… --reason "prohibited neutrality claim"
```

Marks the entry revoked and re-signs. The row is kept, not deleted.

**Revocation is not live until you deploy.** Until the new file is served, verifiers still fetch the old one, and the edge caches it for 5 minutes on top of that.

## sign

```bash
npx carbon-md registry sign
```

Re-signs and re-dates, extending validity by another 30 days. Run it before each deploy — a registry that expires in production stops granting L3 to everyone at once, silently and correctly.

## list

Prints the local registry with signature status and every entry.

## How writes work

Every write re-signs and re-dates the whole document. There is no way to edit a row and leave the proof intact — the signature covers the full contents, which is what makes appending an entry after signing detectable.

## Options

| Flag | Meaning |
|---|---|
| `--file <path>` | work on a registry other than `docs-site/static/.well-known/carbon-md/registry.json` |
| `--issuer <did>` | (verify only) check against a different issuer — for testing a self-hosted registry |

`CARBON_MD_ISSUER_KEY` overrides the key path.

## Related

- [Certification & the registry](/certification/) — the model
- [verify](/cli/verify/) — the consumer side
