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
