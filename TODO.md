# TODO

## Setup

- First publish of each new package by hand, then attach the npm trusted publisher (GitHub Actions, `dakumisu/toolkit-monorepo`).
- `pnpm-workspace.yaml` `minimumReleaseAgeExclude`: pnpm wrote 40 lines for oxlint/oxfmt versions younger than its release-age gate. Fix: delete the block once those versions are older than the gate; `pnpm install` must still pass.
- `apps/playground` `.astro` files are not typechecked: `@astrojs/check` needs the TS JS API absent in TS 7. Fix: add `astro check` once it supports TS 7.

## Known bugs kept by the minimal port

Behavior unchanged on purpose (DECISIONS.md §5). Each line: the bug, then the proper fix.

- `packages/reactivity/src/signal.ts`: `list` WeakMap is write-only dead code. Fix: remove it.
- `packages/reactivity/src/readable.ts`: `watch` ignores `priority` (only `Signal.watch` sorts). Fix: sort in `Readable.watch` or drop the option from its type.
- `packages/reactivity/src/computed.ts`: `set()` returns `console.error` instead of throwing. Fix: throw, or drop `set` from the type.
- `packages/utils/src/async/queue.ts`: public API typo `weigth`. Fix: rename to `weight` in a minor bump (0.x).
- `packages/utils/src/async/queue.ts`: `queue.task(fn)` with a function calls `fn` twice: once in `task()` (for the returned promise) and once in `start()` (`Task.load`). Fix: call it once in `Task.load` and return a promise that settles with the task.
- `packages/utils/src/async/queue.ts`: `smoothProgress` watcher never removed. Fix: unwatch on complete or dispose.
- `packages/utils/src/storage/useStorage.ts`: write errors are logged in dev and swallowed in prod. Fix: surface through an `onError` option.
- `packages/utils/src/storage/useStorage.ts`: only `remove` catches write errors. A throw inside `set`'s queued write (quota exceeded, for example) escapes the idle callback and leaves `processingQueue` at `true`, so no later write is ever scheduled. Fix: `try`/`finally` around each queued op, and surface errors through the `onError` option above.
- `packages/utils/src/storage/useStorage.ts`: `sync(key, state, true)` (the production default) does not reset. The queued `set` has not run when `get` reads, so a stored value still wins and the final stored value is unchanged. Fix: apply the value to `datas` synchronously in `set`, and queue only the browser write.
- `packages/utils/src/storage/*`: `isAtom`, `p`, `s` helpers duplicated in `useStorage.ts` and `useStorageState.ts`. Fix: share one module.
- `packages/utils/src/colors`, `packages/utils/src/log/logger.ts`: color parsing repeated three times. Fix: one parser in `colors`.
- `packages/utils/src/log/domLogger.ts`: options parsing repeated in `domLog` and `createTypedLogMethod`. Fix: one helper.
- `packages/utils/src/log/logger.ts`: `createLogger({ color: 'rgba(…)' })` in light mode builds an invalid background (`rgba(r, g, b, 0.5, 0.2)`): `normalizeColor` keeps the alpha inside `rgb(`, then `colorToBgColor` appends another. Fix: parse alpha once (same fix as the repeated color parsing above).
- `packages/utils/src/object/index.ts`: `dsv(obj, 'a.b', v)` returns the innermost object, but the root when `v` is `undefined`. Fix: always return the root, as the JSDoc says.
- `packages/utils/src/log/domLogger.ts`: the `domLog(args: unknown[], options?)` signature suggests the array is spread; it prints as one JSON array. Fix: spread it, or drop that signature.
- `packages/utils/src/convert/index.ts`: `nullFloat('')` returns `0`, not `null` (`float` guards this case). Fix: same empty-string guard.
- `packages/utils/src/colors/lighten.ts`: an `rgb` input gets a default alpha of `0.2`; an `rgba` input keeps its own. Fine for the logger, surprising in a general `lighten`. Fix: leave alpha alone in `lighten`; let the logger set it.
- `packages/utils/src/dom/nodes.ts`, `packages/utils/src/dom/setViewportSize.ts`: read `document` / `CSS` at import, so client only and listed in `sideEffects`. Fix if SSR import is ever needed: make them lazy.

## Shortcuts taken in the port

- `packages/reactivity/src/computed.ts`, `packages/reactivity/src/watcher.ts`: the tuple-typed overloads of `computed`, `watch` and `createScheduler` call the callback through `Reflect.apply`. A cast from `unknown[]` to the tuple trips `no-unsafe-type-assertion`, and the overloads need a `(values: never) => …` implementation signature. Ceiling: the values are untyped inside the implementation, so a wrong tuple type in an overload goes unnoticed. Fix: restructure the overloads, or allow the rule for these two files in an oxlint `overrides` entry.
- `packages/reactivity/src/computed.ts`: the first callback run moved before `super()` (replaces `super(null as T)`). Ceiling: differs only if the callback writes to one of its own stores on that first run. Fix: restore the post-construct `update()` if that case appears.
- `packages/utils/src/object/index.ts`: `dlv<T>` returns `T` through an overload whose implementation returns `unknown`. A cast to `T` trips `no-unsafe-type-assertion`. Ceiling: nothing checks that the value at the path has type `T`. Fix: a typed path API, or a caller-supplied guard.
- `packages/utils/src/storage/useStorageState.ts`: `useStorageState<T>` returns `Writable<T>` through an overload whose implementation works on `Writable`. Setting the decoded `unknown` into a `Writable<T>` needs a cast that trips `no-unsafe-type-assertion`. Ceiling: nothing checks that the stored value has type `T`. Fix: a caller-supplied guard or schema.
- `packages/utils/src/storage/useStorage.ts`: stored data that does not decode to an object starts the storage empty (the port cast it, which would have thrown on the first write). Ceiling: the bad stored value is overwritten on the next write. Fix: none needed; listed so the difference from the source is known.
- `packages/utils/src/storage/useStorage.ts`: `get(key)` with no default returns `undefined` where the source returned `null` (`def: any = null` became `def?: T`). `sync` always passes a default, so only direct `get` callers see it. Fix: default to `null` and type the no-default case as `T | null`.
- `packages/utils/src/log/domLogger.ts`: `toText` wraps `String()` to pass `no-base-to-string` on values that are not typed. Ceiling: it only hides the rule's warning; a plain object that JSON cannot print still logs `[object Object]`. Fix: format those values on purpose (for example name the type).
