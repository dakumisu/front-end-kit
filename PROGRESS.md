# Progress

## 2026-11-16: grill and decisions

45-question grill settled every setup choice (DECISIONS.md). Researched astro-boilerplate and canvas-manager, audited the three utils sources, renamed the GitHub repo to `dakumisu/toolkit-monorepo`. detail: 5020c24

## 2026-11-16: implementation plan

Wrote `.claude/plans/toolkit-setup.md`: 22 tasks for ROADMAP milestones 1-4. Re-checked npm versions and added the tooling deps. Dry-ran the boilerplate oxlint config over the sources. Three user calls went to DECISIONS.md: `no-underscore-dangle` allows `this._x`, reactivity has a single root export, storage adapts to `watch`/`get`/`set`. detail: ecac8a4

## 2026-11-16: plan run (Tasks 1-21)

Built milestones 1-3 and milestone 4's code: workspace and tooling, `pnpm new`, Astro playground, `@dakumisu/reactivity` (three bugs fixed), `@dakumisu/utils` (11 subpaths), Changesets and CI with an OIDC release job. Gate exits 0 with 24 tests; publint and attw clean. User calls sit in DECISIONS.md §3, small calls as `Call:` lines in the plan, 8 source bugs and 7 shortcuts in TODO.md. detail: 6728bf3

## 2026-11-16: handoff follow-up

Done:
- Condensed the two entries above; their full logs live in the commits named on each `detail:` line.
- Playground check in the built-in browser (`pnpm dev`, user OK): index, reactivity and utils render with no console errors. Utils initial outputs are right (mapRange 50 gives 180.0, slugify, lighten); the storage counter survives a reload; the queue reaches `complete`. Not checked: reactivity's Increment button (the pane closed first). The queue took about 20 s for 3 s of fake tasks while the pane was hidden, most likely because `requestAnimationFrame` is throttled there; unconfirmed.
- User call: plans stay out of git (DECISIONS.md §2).
- Added `.claude/launch.json` (git-ignored) so the built-in browser can start the playground.

Blocked: Task 22 (user steps below).

Next (Task 22, user steps; Claude runs none of them):
1. Commit and push milestones 1-4; check that CI `check` passes. Done: `check` passed; `release` failed with npm 404 (run 44006109096). That is expected: with no changesets, `changeset publish` tries every version missing from npm, and OIDC can't do a first publish. Re-run after step 3 went green: "No unpublished projects to publish."
2. On GitHub, under Settings › Actions › General, allow Actions to create pull requests.
3. Done 2026-11-16: both 0.1.0 published, public. The account's 2FA is a passkey, which `pnpm publish` can't satisfy (403); the path that worked is `pnpm --filter <pkg> pack --pack-destination /tmp` (rewrites `workspace:` and `catalog:`), then `npm publish /tmp/<tarball> --access public` (browser passkey prompt). Never `npm publish` from the package folder.
4. Done 2026-11-16: trusted publisher on both packages (GitHub Actions, `dakumisu/toolkit-monorepo`, `ci.yml`, no environment, "Allow npm publish" on, dist-tag off). It expires if no publish succeeds within 2 days, so do step 5 by 2026-11-18.
5. Add a patch changeset (for example a reactivity README fix), then push. "Version packages" opens; merge it, and CI publishes 0.1.1 with provenance (npm page shows the provenance badge). Then remove the setup lines from TODO.md.
- `pnpm install` prints "Agent skills awaiting approval: tsdown" (pnpm 12). Nothing depends on it; approve or ignore with `pnpm approve`.
