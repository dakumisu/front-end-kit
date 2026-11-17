# @dakumisu/utils

Small front-end utilities

```sh
pnpm add @dakumisu/utils
```

No root export. Import from a subpath:

| Import                         | Exports                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@dakumisu/utils/async`        | [`debounce`, `throttle`, `wait`, `nextFrame`, `rafSetInterval`, `deferredPromise`](https://github.com/dakumisu/toolkit-monorepo/tree/main/packages/utils/src/async)             |
| `@dakumisu/utils/async/queue`  | [`createQueue`, `createTask`, `deferredTask`](https://github.com/dakumisu/toolkit-monorepo/tree/main/packages/utils/src/async) (needs `@dakumisu/reactivity`)                   |
| `@dakumisu/utils/colors`       | [`lighten`, `normalizeColor`](https://github.com/dakumisu/toolkit-monorepo/tree/main/packages/utils/src/colors)                                                                 |
| `@dakumisu/utils/convert`      | [`float`, `nullFloat`, `integer`, `boolean`](https://github.com/dakumisu/toolkit-monorepo/tree/main/packages/utils/src/convert)                                                 |
| `@dakumisu/utils/distribution` | [`createRandom`, `distribute`](https://github.com/dakumisu/toolkit-monorepo/tree/main/packages/utils/src/distribution)                                                          |
| `@dakumisu/utils/dom`          | [`$html`, `$body`, `forceReflow`, `downloadBlob`, `onDOMReady`, `setViewportSize`](https://github.com/dakumisu/toolkit-monorepo/tree/main/packages/utils/src/dom) (client only) |
| `@dakumisu/utils/log`          | [`createLogger`, `domLog`](https://github.com/dakumisu/toolkit-monorepo/tree/main/packages/utils/src/log)                                                                       |
| `@dakumisu/utils/maths`        | [`clamp`, `lerp`, `damp`, `mapRange`, `mod`, `median` and more](https://github.com/dakumisu/toolkit-monorepo/tree/main/packages/utils/src/maths)                                |
| `@dakumisu/utils/object`       | [`dlv`, `dsv`, `ddv`](https://github.com/dakumisu/toolkit-monorepo/tree/main/packages/utils/src/object)                                                                         |
| `@dakumisu/utils/storage`      | [`useLocalStorage`, `useSessionStorage`, `useStorage`, `useStorageState`](https://github.com/dakumisu/toolkit-monorepo/tree/main/packages/utils/src/storage)                    |
| `@dakumisu/utils/string`       | [`slugify`, `camelToKebab`, `hash`, `createUUID` and more](https://github.com/dakumisu/toolkit-monorepo/tree/main/packages/utils/src/string)                                    |
