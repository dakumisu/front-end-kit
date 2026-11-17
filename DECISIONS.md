# Decisions

**Started:** 2026-11-16 · **Last revised:** 2026-11-16

Personal front-end toolkit: `packages/` published as `@dakumisu/{package_id}`, `apps/` for local tools. Lint follows `locomotivemtl/astro-boilerplate`, monorepo shape follows `locomotivemtl/canvas-manager`.

| How | Where |
| --- | --- |
| Package conventions | `packages/README.md` (with scaffold) |
| Each package | `packages/<id>/README.md` |
| Playground | `apps/playground/README.md` |

## 1. Distribution

- ✅ **Public npm under the `@dakumisu` scope.** Zero auth for consumers and teammates. npm user `dakumisu` owns the scope.
    - ❌ GitHub Packages: token and `.npmrc` in every consumer.
    - ❌ Git dependencies: no per-package versions.
    - ❌ Private npm scope: paid, token everywhere.
- ✅ **Every package ships built ESM + `.d.ts`.** Works in any consumer.
    - ❌ Raw `.ts` source (canvas-manager `utils` style): consumer must compile TS.
    - ❌ Mix per package: two templates to maintain.
- ✅ **Independent semver per package, starting at 0.1.0.** A package goes 1.0.0 when its API settles.
    - ❌ Fixed shared version: noisy no-op releases.
    - ❌ 1.0.0 from the start: majors pile up while APIs move.
- ✅ **MIT license.** Client and Locomotive projects can reuse freely.
    - ❌ UNLICENSED: blocks client reuse.

## 2. Repository and tooling

- ✅ **Public repo `dakumisu/toolkit-monorepo`** *(user, 2026-11-16: renamed from `front-end-kit`)*. Provenance needs a public repo.
    - ❌ Private repo: no npm provenance.
    - ❌ Under `locomotivemtl`: not personal.
- ✅ **pnpm 12 workspaces** (`packages/*`, `apps/*`), exact version in `packageManager`.
    - ❌ npm workspaces: weak filtering, hoisting hides missing deps.
    - ❌ pnpm 9/10: stale (canvas-manager pins 9.15.9).
- ✅ **pnpm catalogs hold shared versions.** Declare each version once.
    - ❌ Per-package versions: drift.
- ✅ **`pnpm -r` / `--filter` runs cross-package tasks.** No task runner.
    - ❌ Nx *(user)*: tried, dropped.
    - ❌ Turborepo: one more tool for a small repo.
- ✅ **tsdown builds packages.** Rolldown, fast `.d.ts` via oxc. Still 0.x, expect minor breaking bumps.
    - ❌ tsup: maintenance mode, slower dts.
    - ❌ Vite lib mode + tsc: dts needs a plugin.
- ✅ **TypeScript 7 with `isolatedDeclarations`.** Every export carries explicit types, so dts never needs the tsc JS API.
    - ❌ TS 7 without it: tsdown would need the tsc JS API, absent in TS 7.
    - ❌ TS 5.9: older line.
- ✅ **Packages target modern browsers** (ES2022+, DOM lib). SSR guards only where a package needs them.
    - ❌ Every package Node/SSR-safe: guards everywhere.
- ✅ **One root `tsconfig.base.json`** that packages extend.
    - ❌ Publishable `@dakumisu/tsconfig`: extra versioning; revisit if client projects need it.
- ✅ **Shared tooling lives in root devDependencies; `.nvmrc` 24 and `engines` on the root only.** Published browser packages carry no `engines`.

## 3. Quality

- ✅ **oxlint + oxfmt with astro-boilerplate's config.** 4 spaces, single quotes, print width 100. Boilerplate bits that don't apply here (layouts import group, Tailwind sorting) are dropped; `.astro` options stay for the playground.
    - ❌ ESLint + Prettier (canvas-manager): older stack, conflicting trailing-comma rules.
- ✅ **Type-aware oxlint** (tsgolint). Catches unawaited promises in published code.
    - ❌ Boilerplate rules only: misses async bugs.
- ✅ **Rule levels match the boilerplate; `--deny-warnings` in hooks and CI.** Nothing warned ships, config stays aligned.
    - ❌ Promote rules to error: config drifts from boilerplate.
- ✅ **One deviation: `no-underscore-dangle` allows `this._x`** (`allowAfterThis: true`) *(user)*. Ported reactivity and queue classes keep their `_private` members; 62 of the 67 warnings were `this._x`. The 5 storage locals lose their underscore.
    - ❌ Rename the members: changes names in the published `.d.ts`, bigger than a minimal port.
    - ❌ Rule off: most drift from the boilerplate.
- ✅ **simple-git-hooks: lint-staged on pre-commit, lenient commitlint on commit-msg, typecheck on pre-push.**
- ✅ **Vitest, one root config with projects; node env by default, happy-dom per file** *(user: Vitest over PHILOSOPHY's no-suite default, because this code is published)*.
    - ❌ `node --test`: no DOM.
    - ❌ Browser mode: heavy install, slow CI.

## 4. Package shape

- ✅ **Grouped packages with subpath exports.** Small utils share a package; plugins and tools get their own.
    - ❌ One package per util: many tiny releases.
    - ❌ Single kit package: breaks `@dakumisu/{id}` naming.
- ✅ **tsdown writes `exports` from its entry list.** Entries declared once.
    - ❌ Hand-written exports: two places to sync.
- ✅ **Grouped packages expose subpaths only, no root barrel.**
    - ❌ Barrel + subpaths: dev-server cost, relies on `sideEffects`.
- ✅ **A single-purpose package exposes one root export** *(user)*. `@dakumisu/reactivity` imports from `@dakumisu/reactivity`.
    - ❌ Subpath per file: verbose imports for 7 small, interlinked files.
- ✅ **Wrapped third-party libs are `peerDependencies`**, optional when only some subpaths need them.
    - ❌ `dependencies`: duplicate copies (two three.js).
    - ❌ Bundled in: bloat.
- ✅ **Internal `@dakumisu/*` deps are `dependencies` with `workspace:^`.** Changesets bumps dependents.
    - ❌ Peer: manual installs.
- ✅ **CSS ships as a separate export (`/style.css`, in `sideEffects`); shaders inline as strings.**
    - ❌ Runtime CSS injection: consumer can't control or purge it.
- ✅ **`pnpm new <id>` scaffolds a package** from a template folder. Small owned node script.
    - ❌ Plop / turbo gen: dependency.
- ✅ **Dev/prod checks use `process.env.NODE_ENV`.** The consumer's bundler replaces it and strips dev code. Typed with a small ambient declaration, not `@types/node`.
    - ❌ `import.meta.env.DEV`: Vite only.
    - ❌ `__IS_PROD__` / `__IS_DEV__` / `__TIMESTAMP__`: only Locomotive projects define them.

## 5. First packages

- ✅ **`@dakumisu/utils`: boilerplate `async`, `dom`, `maths`, `string` + expedia `colors`, `convert`, `distribution`, `object`, `storage`, `log`, `async/queue`.** Boilerplate copy (2026-11-16) wins where both exist *(user)*.
    - ❌ `seo.ts` *(user)*: tied to Astro and `astro-seo`.
    - ❌ `screen/*` *(user)*: `onLayoutResize` needed a project store.
    - ❌ Expedia-only `GOLDEN_ANGLE`, `EPSILON`, `roundedBoxDistance`, `toDash`, `--screen-*` vars *(user)*.
- ✅ **`@dakumisu/reactivity`: veer reactivity (signal, readable, writable, map, computed, watch, createHook).**
    - ❌ Merged into utils: `map`/`watch` name clashes, one version for all.
- ✅ **`@dakumisu/utils` has no third-party deps** *(user)*. `storage` and `queue` run on `@dakumisu/reactivity`; `queue` ticks on `requestAnimationFrame`.
    - ❌ nanostores *(user)*: replaced by own reactivity.
    - ❌ gsap ticker *(user)*.
- ✅ **storage adapts to reactivity's `watch`/`get`/`set`** *(user)*. `isAtom` checks `watch` + `set`; `subscribe(cb)` becomes `watch(cb, { immediate: true })`, which keeps nanostores' fire-on-subscribe behavior.
    - ❌ Add `subscribe` to reactivity: widens its API now; interop stays open question 5.
- ✅ **Port minimally: only edits the checks demand, client bits stripped, behavior unchanged.** Known bugs go to TODO.md.
    - ❌ Refactor during the port: bigger diff to review.
- ✅ **Exception: fix three reactivity bugs now**, each with a Vitest check: `writable.set(v, true)` double emit, `computed` never unwatching, `signal.unwatch` removing the wrong duplicate. utils now depends on them.
- ✅ **Logger default color is gold** *(user)*, overridable. Replaces Locomotive blue `#312dfb`.

## 6. Apps

- ✅ **One local Astro playground, one page per package, never deployed.** Same stack as client projects, catches SSR import issues.
    - ❌ Docs site: upkeep.
    - ❌ Vanilla Vite: no SSR check.
    - ❌ Vercel / GitHub Pages: hosting upkeep.
- ✅ **Playground and Vitest load package source through a custom export condition** (tsdown `devExports`). Instant HMR; `dist/` is checked by build and CI.
    - ❌ `dist` + `tsdown --watch`: slow loop.
    - ❌ Vite aliases: duplicate paths.

## 7. Release and CI

- ✅ **Changesets with `@changesets/changelog-github`; a GitHub Action opens "Version packages", merging it publishes.**
    - ❌ Local publish: npm credentials on the machine.
    - ❌ Manual bumps: error-prone across packages.
- ✅ **npm trusted publishing (OIDC) with provenance.** No `NPM_TOKEN`. A brand-new package's first publish is manual.
    - ❌ `NPM_TOKEN` secret: expires, rotation.
- ✅ **CI on push to main: oxlint + oxfmt check, typecheck + Vitest, build + publint/attw.**
    - ❌ Changeset-present check: noisy solo.
- ✅ **Push straight to main; main is not protected.**
    - ❌ PRs + protected main: slow solo.
- ✅ **No dependency bot; update by hand with `pnpm up`** *(user)*.
    - ❌ Renovate, Dependabot: bot PRs.

## Open questions

| # | Question | Blocks |
| --- | --- | --- |
| 1 | Do tsdown 0.23 + TS 7 emit correct `.d.ts` (including `#` subpath imports inside packages)? | Package build |
| 2 | Does `devExports` + `publishConfig` leave only `dist/` exports in the packed tarball? | First publish |
| 3 | Does oxlint-tsgolint run with TS 7? | Type-aware lint |
| 5 | Should reactivity eventually replace or wrap nanostores-style APIs (`subscribe`) for interop? | Nothing yet |
