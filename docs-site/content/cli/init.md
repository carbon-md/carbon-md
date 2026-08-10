# carbon-md init

Sets up carbon accounting in the current directory.

```bash
npx carbon-md init
```

## What it does

1. **Detects your stack** — Claude Code, LiteLLM/OpenRouter configs, LangGraph projects — to suggest the right capture path.
2. **Writes `carbon.md`** at the current directory root, with a starter policy (110% contribution, removal-weighted, $25/month cap, $10 approval threshold).
3. **Creates `.carbon-md/`** — the local store — and adds it to `.gitignore`.

Nothing is uploaded. No account is created.

## Output

```
✔ Wrote carbon.md
✔ Created .carbon-md/ (gitignored)

  Policy    110% contribution · removal-weighted
  Budget    max $25/month · confirm above $10

  Next:  npx carbon-md sync claude-code
         npx carbon-md status
```

## After running

Edit `carbon.md` to match your intent — see [the file reference](/spec/) for every field. Then wire capture: [Capture recipes](/guides/capture/).

## Notes

- **Safe to re-run?** `init` refuses to overwrite an existing `carbon.md`. Delete or edit the file instead.
- **Where should it live?** At the root of the thing you're accounting for: a repo root for a project, or an agent's home directory (e.g. `~/.hermes/`) for a persistent agent.
- **Monorepos.** One `carbon.md` per accounting unit. Commands search upward from the working directory for the nearest policy file.
