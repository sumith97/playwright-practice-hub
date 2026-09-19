# Contributing

Thanks for wanting to improve the Playwright Practice Hub! This repo thrives on new challenges and bug reports from test automation engineers.

## Ways to contribute

- **Report a broken challenge** — if a challenge is unsolvable, misleading, or its reference test fails, that's a bug. Open a bug report.
- **Propose a new challenge** — missing a Playwright concept? Suggest it (or build it!).
- **Improve challenges** — better hints, clearer tasks, sharper traps.
- **Fix cross-engine issues** — Firefox/WebKit/Linux behaviors are always under-tested.

## Getting set up

```bash
git clone https://github.com/sumith97/playwright-practice-hub.git
cd playwright-practice-hub
npm install
npx playwright install
npm run dev        # app on :5173, API on :3001
npm run test:examples   # the reference suite must stay green
```

## Adding a new challenge

1. Create `apps/web/src/challenges/<track>/MyChallenge.tsx` following the existing pattern: a default-exported React playground component and an exported `meta` object (id, track, title, summary, concepts, task, hints, solution, example, path).
2. Register it in `apps/web/src/challenges/index.tsx`.
3. **Write the reference test** at the `example` path you declared (e.g. `examples/<track>/my-challenge.spec.ts`). A challenge without a green reference test will not be merged — the reference suite is what guarantees every challenge is solvable.
4. Verify: `npm run typecheck` and `npx playwright test examples/<track> --project=chromium`.
5. Add the challenge to `docs/challenge-catalog.md`.

## Ground rules

- Every challenge must be solvable with public, documented Playwright APIs (no exotic internals).
- Keep `data-testid` usage intentional: prefer role/label locators in solutions; use test ids only where no accessible name exists (that's part of the lesson).
- The reference suite runs in CI on Chromium, Firefox and WebKit — engine-specific behavior must be skipped explicitly *with a comment explaining why*.
- Never commit real credentials. Demo accounts in `examples/utils.ts` are intentional and fake.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
