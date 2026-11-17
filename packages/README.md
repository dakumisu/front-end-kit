# Packages

Each folder is one npm package, published as `@dakumisu/<id>`. Create one with:

```sh
pnpm new <id> "<description>"
pnpm install
```

The script copies `templates/package/`, fills `{{id}}` and `{{description}}`, and refuses an id that already exists or is not lowercase kebab-case.

## Layout

| Path               | Role                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| `package.json`     | Name, version, `imports`, `sideEffects`. tsdown writes `exports`       |
| `tsdown.config.ts` | Spreads `baseConfig` from `tsdown.base.ts` and lists the `entry` files |
| `tsconfig.json`    | Extends `tsconfig.base.json`, includes `src` and the root `types/`     |
| `src/`             | Source. Each entry file becomes one export                             |
| `README.md`        | Install line and an `Import / Exports` table                           |

## Conventions

| Topic            | Rule                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| Exports          | Listed once, in `entry`. tsdown writes `exports` and `publishConfig.exports`. Never edit them by hand      |
| Single package   | One root export: `import { x } from '@dakumisu/<id>'`                                                      |
| Grouped package  | Subpaths only, no root barrel: `src/<group>/index.ts` gives `@dakumisu/<id>/<group>`                       |
| Imports          | Across folders `#<folder>/<file>.ts`, inside one folder `./<file>.ts`. Always end in `.ts`                 |
| Dev and prod     | Check `process.env.NODE_ENV`. The consumer's bundler replaces it. Never `__IS_PROD__` or `import.meta.env` |
| Third-party libs | `peerDependencies`, marked optional in `peerDependenciesMeta` when only some subpaths need them            |
| Internal deps    | `dependencies` with `"@dakumisu/<other>": "workspace:^"`                                                   |
| CSS              | Ships as its own export, `@dakumisu/<id>/style.css`, and is listed in `sideEffects`                        |
| Shaders          | Inline strings, no separate file                                                                           |
| `sideEffects`    | `false` by default. Name the built files (`./dist/...`) that run code or touch globals at import           |

## Dev and build

`pnpm build` runs tsdown in every package. tsdown also runs publint and arethetypeswrong on the result.

In the repo, the `@dakumisu/source` export condition points imports at `src/`, so the playground and Vitest read source with no build. `pnpm pack` and `pnpm publish` ship `dist/` only.
