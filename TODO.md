# TODO

## Setup

- Scaffold the monorepo per DECISIONS.md, then port `@dakumisu/utils` and `@dakumisu/reactivity`.
- First publish of each new package by hand, then attach the npm trusted publisher (GitHub Actions, `dakumisu/toolkit-monorepo`).
- `pnpm-workspace.yaml` `minimumReleaseAgeExclude`: pnpm wrote 40 lines for oxlint/oxfmt versions younger than its release-age gate. Fix: delete the block once those versions are older than the gate; `pnpm install` must still pass.
- `apps/playground` `.astro` files are not typechecked: `@astrojs/check` needs the TS JS API absent in TS 7. Fix: add `astro check` once it supports TS 7.

## Known bugs kept by the minimal port

Behavior unchanged on purpose (DECISIONS.md §5). Each line: the bug, then the proper fix.

- `reactivity/signal.ts`: `list` WeakMap is write-only dead code. Fix: remove it.
- `reactivity/readable.ts`: `watch` ignores `priority` (only `Signal.watch` sorts). Fix: sort in `Readable.watch` or drop the option from its type.
- `reactivity/computed.ts`: `set()` returns `console.error` instead of throwing. Fix: throw, or drop `set` from the type.
- `utils/async/queue.ts`: public API typo `weigth`. Fix: rename to `weight` in a minor bump (0.x).
- `utils/async/queue.ts`: `smoothProgress` watcher never removed. Fix: unwatch on complete or dispose.
- `utils/storage/useStorage.ts`: write errors are logged in dev and swallowed in prod. Fix: surface through an `onError` option.
- `utils/storage/*`: `isAtom`, `p`, `s` helpers duplicated in `useStorage.ts` and `useStorageState.ts`. Fix: share one module.
- `utils/colors`, `utils/log/logger.ts`: color parsing repeated three times. Fix: one parser in `colors`.
- `utils/log/domLogger.ts`: options parsing repeated in `domLog` and `createTypedLogMethod`. Fix: one helper.
- `utils/log/README.md`: stale claims (production logging, `ColorInput`, toast sizes, `log` background). Fix: rewrite against the code during the port.
- `utils/dom/README.md` (boilerplate): lists `elements.ts` / `download.ts`; real files are `nodes.ts` / `blob.ts`. Fix: correct during the port.
- `utils/dom/nodes.ts`, `dom/setViewportSize.ts`: read `document` / `CSS` at import, so client only and listed in `sideEffects`. Fix if SSR import is ever needed: make them lazy.
