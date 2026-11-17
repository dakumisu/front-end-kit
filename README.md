# toolkit-monorepo

Personal front-end toolkit by dakumisu. Folders in `packages/` are published to public npm as `@dakumisu/<id>`. `apps/` holds local tools that are never published.

## Packages

| Package                                       | Description                                                                                                                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@dakumisu/reactivity`](packages/reactivity) | Small signal and store primitives: `signal`, `readable`, `writable`, `map`, `computed`, `watch`, `createHook`. One root export, no dependencies.                                  |
| [`@dakumisu/utils`](packages/utils)           | Small front-end utilities. Subpath imports only (`@dakumisu/utils/async`, `/maths`, `/dom`, ...), no root export. Depends on `@dakumisu/reactivity`, no third-party dependencies. |

Every package ships built ESM plus `.d.ts` and targets modern browsers (ES2022). All are MIT licensed and versioned independently with semver, starting at 0.x.

```sh
pnpm add @dakumisu/reactivity
```

```ts
import { writable } from '@dakumisu/reactivity';
import { clamp } from '@dakumisu/utils/maths';
```

## Development

Requirements:

- Node 24, set in `.nvmrc` and `engines`.
- pnpm 12, at the exact version in `packageManager`. Use Corepack or install a matching pnpm.

```sh
pnpm install
```

`pnpm install` also installs the git hooks, through the `prepare` script and simple-git-hooks.

| Command                             | What it does                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm dev`                          | Starts the playground                                                         |
| `pnpm build`                        | Runs tsdown in every package, then publint and arethetypeswrong on the result |
| `pnpm typecheck`                    | Typechecks every package and the root                                         |
| `pnpm lint` / `pnpm lint:fix`       | Runs oxlint, type-aware. Warnings fail                                        |
| `pnpm format` / `pnpm format:check` | Formats with oxfmt, or checks without writing                                 |
| `pnpm test`                         | Runs Vitest, one root config with one project per package                     |
| `pnpm new <id> "<description>"`     | Scaffolds a package                                                           |
| `pnpm changeset`                    | Records a change for the next release                                         |

In the repo, the `@dakumisu/source` export condition points `@dakumisu/*` imports at `src/`. The playground and Vitest read source with no build. Published tarballs hold `dist/` only.

Git hooks: `pre-commit` runs lint-staged (`oxlint --fix` and `oxfmt`), `commit-msg` runs commitlint, `pre-push` runs `pnpm typecheck`.

## Adding a package

```sh
pnpm new <id> "<description>"
pnpm install
```

[`packages/README.md`](packages/README.md) covers the layout and conventions. Exports are listed once, in the tsdown `entry`, and grouped packages use subpaths.

## Releasing

Releases use [Changesets](https://github.com/changesets/changesets). Run `pnpm changeset` with each change, then push to `main`.

[CI](.github/workflows/ci.yml) runs lint, format check, typecheck, tests and build on every push to `main` and every pull request. On `main`, the Changesets action opens a "Version packages" pull request. Merging it publishes to npm through trusted publishing (OIDC) with provenance, so the repo holds no npm token.

A new package's first publish is manual. Attach its trusted publisher on npmjs.com afterwards.

## License

MIT, see [`LICENSE`](LICENSE).
