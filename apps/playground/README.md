# Playground

Local Astro app, never deployed. One page per package, to try it in a real page and to catch SSR import breaks.

## Run

```sh
pnpm dev                          # from the repo root
pnpm --filter playground build    # static build, also checks SSR imports
pnpm --filter playground typecheck
```

Imports of `@dakumisu/*` resolve to package `src/` through the `@dakumisu/source` export condition (`astro.config.ts`), so edits show up with no package build.

## Add a package page

1. Add the package to `package.json`: `"@dakumisu/<id>": "workspace:^"`, then `pnpm install`.
2. Create `src/pages/<id>.astro` with the `Base` layout.

`src/pages/index.astro` lists every page in that folder, so there is no link to add.

## Client-only code

Import client-only utils (anything touching `document`, `window`, `CSS`) in a `<script>` tag, never in the frontmatter. Frontmatter runs in Node at build, so `astro build` fails on an import that breaks under SSR, which is the check this app exists for.

```astro
<script>
    import { thing } from '@dakumisu/<id>';
</script>
```

## Typecheck

`typecheck` checks the `.ts` files only. The `.astro` files are not typechecked yet: `@astrojs/check` does not run on TypeScript 7.
