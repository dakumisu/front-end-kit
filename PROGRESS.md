# Progress

## 2026-11-16: grill and decisions

45-question grill settled every setup choice (DECISIONS.md). Researched astro-boilerplate and canvas-manager, audited the three utils sources, renamed the GitHub repo to `dakumisu/toolkit-monorepo`. detail: 5020c24

## 2026-11-16: implementation plan

Done:
- Wrote `.claude/plans/toolkit-setup.md`: 22 tasks covering ROADMAP milestones 1-4. Open questions 1-3 are checked early: q3 in Task 2 (lint setup), q1-2 in Task 6 on a throwaway `scratch` package, before any port.
- Re-checked npm versions; all match the handoff. Added `oxlint-tsgolint` 7.0.2007, `happy-dom` 21.0.4, `publint` 0.3.25, `@arethetypeswrong/cli` 0.18.5, `@changesets/changelog-github` 1.0.1, `@types/node` 24.19.2 (root config files only).
- Ran the boilerplate oxlint config over the sources (read-only). Boilerplate utils are clean. Expedia and reactivity have 58 curly errors, 52 `no-explicit-any` and 67 `no-underscore-dangle` warnings, which `--deny-warnings` blocks.
- Three user calls recorded in DECISIONS.md: `no-underscore-dangle` allows `this._x`; reactivity has a single root export; storage adapts to `watch`/`get`/`set` (open question 4 closed).
- The local folder is now `toolkit-monorepo`, not `front-end-kit`.

Blocked: plan review.

Next:
- Review the plan, including the two items it flags for your OK: `pnpm format` / `oxlint --fix` rewriting ported files, and `@types/node` for root config files.
- Run it with `/execute-plan .claude/plans/toolkit-setup.md`.

## 2026-11-16: plan run (Tasks 1-21)

Done:
- Milestone 1: root workspace, type-aware oxlint + oxfmt, git hooks + commitlint, Vitest projects, tsdown base + template + `pnpm new`, Astro playground. Gate `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` exits 0.
- Open questions 1-3 answered yes and removed from DECISIONS.md: tsgolint 7.0.2007 runs on TS 7.0.2; tsdown rewrites `#*` to relative `.js` paths in `.js` and `.d.ts`; the packed tarball exports only `dist/`.
- Milestone 2: `@dakumisu/reactivity` ported, three bugs fixed with Vitest checks (fail before, pass after), README rewritten against the code, playground page.
- Milestone 3: `@dakumisu/utils` with 11 subpaths, no third-party deps; storage and `async/queue` run on reactivity, queue ticks on `requestAnimationFrame`. 24 tests pass. publint + attw clean for both packages; tarballs hold only `dist/`, `package.json`, `README.md`, `LICENSE`.
- Milestone 4 (code side): Changesets 3 config and scripts; `.github/workflows/ci.yml` with `check` and OIDC `release` jobs. `changeset publish` uses `pnpm publish` in a pnpm workspace (`@changesets/cli` `getPublishPlan.mjs:569-577`), so pnpm does the OIDC exchange and provenance.
- User calls: shell formatter/fixer may rewrite ported files; `@types/node` for root config only; oxfmt skips the root docs (it rewrites `*(user)*`); test files turn `no-underscore-dangle` off.
- Small calls are noted under each task in `.claude/plans/toolkit-setup.md` (`Call:` lines). Notable: attw `level: 'error'`; tsdown `define` keeps `process.env.NODE_ENV` in `dist`; template carries empty `exports` keys so a fresh package stays format-clean.
- TODO.md: 8 new bugs found in the sources (kept, minimal port) and 7 shortcuts with ceilings and fixes.

Blocked:
- Visual checks of the playground pages (index, reactivity, utils) need a browser session (rule 3).
- The previous entry above is not condensed: PROGRESS.md is uncommitted. Commit it, and the next session condenses both.

Next (Task 22, user steps; Claude runs none of them):
1. Commit and push milestones 1-4; check that CI `check` passes and `release` does nothing (no changesets).
2. On GitHub, under Settings › Actions › General, allow Actions to create pull requests.
3. Run `npm login`, then `pnpm build`, then `pnpm --filter @dakumisu/reactivity publish --access public`, then the same for `@dakumisu/utils` (reactivity first; utils depends on `^0.1.0`).
4. On npmjs.com, attach a trusted publisher to each package: GitHub Actions, `dakumisu/toolkit-monorepo`, workflow `ci.yml`. A new trusted-publisher config expires if no publish succeeds within 2 days, so do step 5 soon after.
5. Add a patch changeset (for example a reactivity README fix), then push. "Version packages" opens; merge it, and CI publishes 0.1.1 with provenance (npm page shows the provenance badge). Then remove the setup lines from TODO.md.
- `pnpm install` prints "Agent skills awaiting approval: tsdown" (pnpm 12). Nothing depends on it; approve or ignore with `pnpm approve`.
