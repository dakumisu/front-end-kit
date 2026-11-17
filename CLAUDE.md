# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

pnpm 12 workspace (`packages/*`, `apps/*`) on Node 24. Packages publish to public npm as `@dakumisu/<id>`: `reactivity` and `utils` today, and `utils` depends on `reactivity` through `workspace:^`. `apps/playground` is a local Astro app and is never deployed. Shared dependency versions live in the `catalog:` block of `pnpm-workspace.yaml`, and the root and every package use `catalog:`. There is no task runner. Cross-package tasks use `pnpm -r` or `--filter`.

## Commands

```sh
pnpm build            # tsdown in every package (runs publint and attw too)
pnpm typecheck        # pnpm -r typecheck, then tsc --noEmit at the root
pnpm lint             # oxlint --deny-warnings: any warning fails
pnpm lint:fix
pnpm format           # oxfmt; format:check is the CI variant
pnpm test             # vitest run
pnpm dev              # playground dev server
pnpm new <id> "<description>"   # scaffold packages/<id> from templates/package, then pnpm install
pnpm changeset
```

Single tests:

```sh
pnpm test packages/reactivity/src/signal.test.ts
pnpm test --project reactivity
pnpm test packages/reactivity/src/signal.test.ts -t "<test name>"
```

Per package: `pnpm --filter @dakumisu/utils build`, `pnpm --filter playground build`. The playground static build doubles as an SSR import check. CI order: lint, format:check, typecheck, test, build.

## Architecture

- Source export condition: `@dakumisu/source` is declared once in `source-condition.ts`. `tsconfig.base.json` repeats it in `customConditions` because JSON cannot import it, so keep both in sync. Each package `exports` maps it to `src/*.ts`. Vitest (`vitest.config.ts`) and the playground (`astro.config.ts`) add it to Vite's resolve conditions, so they read source with no build. `publishConfig.exports` replaces `exports` at pack time, so tarballs point only at `dist/`.
- Exports are generated. tsdown writes `exports` and `publishConfig.exports` from the `entry` list in each package's `tsdown.config.ts`, through `devExports` in `tsdown.base.ts`. Never edit them by hand. Change `entry` and rebuild.
- Package shapes: a single-purpose package has one root export (`reactivity`). A grouped package has subpaths only and no root barrel: `src/<group>/index.ts` becomes `@dakumisu/<id>/<group>` (`utils`, plus the extra entry `src/async/queue.ts`).
- Build config is `tsdown.base.ts`: ESM only, browser platform, ES2022, `unbundle: true`. Unbundle gives one output file per source file, so `sideEffects` can name files. publint and attw (`esm-only` profile, level error) run as part of the build.
- `process.env.NODE_ENV` is defined to itself so the consumer's bundler strips dev code. It is typed by `types/process-env.d.ts`, not `@types/node`. Never use `import.meta.env` or `__IS_PROD__`.
- TypeScript 7 with `isolatedDeclarations`: every export needs an explicit type annotation (return types, exported consts), or dts generation fails.
- Imports: across folders use `#<folder>/<file>.ts` (the package `imports` field maps `#*` to `./src/*`). Inside a folder use `./<file>.ts`. Always keep the `.ts` extension.
- `sideEffects` is `false` by default. List the built `./dist/...` files that touch globals at import (see `packages/utils/package.json`). In playground `.astro` files, import client-only modules (anything touching `document`, `window`, `CSS`) inside a `<script>`, never in the frontmatter.
- Vitest: one root config, one project per folder in `packages/`, `node` environment by default. A test file opts into DOM with a first-line `// @vitest-environment happy-dom` comment.
- Third-party libs go in `peerDependencies`. CSS ships as a `/style.css` export listed in `sideEffects`, and shaders are inline strings. `packages/README.md` has the full conventions table.

## Lint and commits

- oxlint runs type-aware (tsgolint). Notable rules: `curly: all`, `no-underscore-dangle` allows `this._x` only (off in `*.test.ts`), `ban-ts-comment` bans `@ts-ignore`, disable comments must name their rules, `import/no-cycle`.
- oxfmt formats code and Markdown: 4 spaces, single quotes, width 100. It ignores `CHANGELOG.md`.
- Hooks (simple-git-hooks): pre-commit runs lint-staged (oxlint --fix, oxfmt), commit-msg runs commitlint, pre-push runs typecheck.
- commitlint is lenient. No Conventional Commits prefix. Subject of at least 2 words, no trailing period, at most 100 chars. Existing subjects are plain imperative sentences ("Add utils package").

## Releasing

Changesets. Every user-facing package change needs `pnpm changeset`. CI on `main` opens a "Version packages" PR. Merging it publishes through npm trusted publishing (OIDC, provenance). A new package's first publish is manual.

## Known gotcha

`.astro` files are not typechecked, because `@astrojs/check` does not run on TypeScript 7. The `apps/playground` typecheck covers `.ts` only.
