# Roadmap

Milestones, in order. Decisions live in DECISIONS.md, granular open work in TODO.md.

## 0. Decisions ✅

Setup grill done 2026-11-16. Every choice in DECISIONS.md.

## 1. Scaffold

- Root: pnpm 12 workspace, catalogs, `tsconfig.base.json`, `.nvmrc`, `.editorconfig`.
- Quality: oxlint (type-aware) + oxfmt from astro-boilerplate, simple-git-hooks, lint-staged, commitlint, Vitest root config.
- `pnpm new <id>` script and package template.
- `apps/playground`: Astro, loads package source through the dev export condition.

Done when: lint, typecheck, test and build pass on an empty workspace, and `pnpm new` produces a package that passes them too.

## 2. `@dakumisu/reactivity`

- Port veer reactivity, add explicit types, unify `.ts` import specifiers.
- Fix the three bugs (writable double emit, computed leak, signal unwatch), one Vitest check each.
- README, playground page.

Done when: build emits correct `.d.ts`, publint/attw pass, packed tarball holds only `dist/`. This answers DECISIONS.md open questions 1-3.

## 3. `@dakumisu/utils`

- Boilerplate `async`, `dom`, `maths`, `string`.
- Expedia `colors`, `convert`, `distribution`, `object`, `log`, `storage`, `async/queue`, moved onto `@dakumisu/reactivity` and `requestAnimationFrame`.
- `process.env.NODE_ENV` in place of build globals, gold logger default, client bits stripped.
- README per subpath group, playground page.

Done when: same gates as milestone 2, no third-party dependency in `package.json`.

## 4. Release pipeline

- Changesets with GitHub changelog, CI workflow (lint, types, tests, build, publint/attw), release workflow with trusted publishing.
- First publish of both packages by hand at 0.1.0, then attach the trusted publisher on npmjs.com.

Done when: a changeset merged to main opens "Version packages", and merging that publishes with provenance.

## 5. Next content

Utils, plugins and tools you add after setup. Each new package goes through `pnpm new`, a playground page and a changeset.

## Later

- 1.0.0 per package once its API settles.
- Remaining known bugs from TODO.md.
- Reactivity interop with `subscribe`-style stores (DECISIONS.md open question 5).
