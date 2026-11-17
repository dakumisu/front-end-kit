# Log utils

Two loggers for development: a console logger with a colored prefix, and a logger that shows messages on the page. Import them from the `./log` subpath:

```ts
import { createLogger, domLog } from '@dakumisu/utils/log';
```

| File           | Exports                  |
| -------------- | ------------------------ |
| `logger.ts`    | `createLogger`, `Logger` |
| `domLogger.ts` | `domLog`, `DomLog`       |

Neither file touches `document` or `window` when it loads, so the subpath is safe to import on the server. `domLog` needs `document` when you call it.

## Console logger

`createLogger(options?)` returns an object with the console methods `log`, `info`, `warn`, `error`, `debug`, `table`, `time`, `timeEnd`, `group`, `groupCollapsed`, `groupEnd` and `clear`. Each one is bound to the real console method, so devtools show your file as the call site, not the logger's.

```ts
const logger = createLogger({ id: 'APP' });

logger.log('Hello'); // APP Hello
logger.warn('Careful'); // APP Careful, with an orange left edge
```

| Option            | Default              | What it does                                                    |
| ----------------- | -------------------- | --------------------------------------------------------------- |
| `id`              | none                 | The prefix text. Without it, nothing is styled or prefixed.     |
| `color`           | gold `#c9a227`       | The prefix text color. A hex or `rgb()` string.                 |
| `backgroundColor` | `color` at 0.2 alpha | The prefix background. A `#rrggbb`, `rgb()` or `rgba()` string. |

Without an `id`, the methods are plain bound console methods and `color` and `backgroundColor` do nothing.

### Levels

Every method prints the same prefix. The level shows only as a 2px colored left edge on `info` (blue), `warn` (orange), `error` (red) and `debug` (gray). `log`, `table`, `time`, `timeEnd`, `group` and `groupCollapsed` have no edge. `time` and `timeEnd` add the word after the id: `APP • time`.

`table`, `time` and `timeEnd` print the prefix on its own line first, then make the real call. That prefix line shows the logger file as its call site.

### Colors

`color` accepts `#rrggbb`, `rrggbb`, `0xrrggbb` and `rgb(r, g, b)` (commas or spaces). `backgroundColor` is not normalized: use `#rrggbb`, `rgb()` or `rgba()` with the `#` or function form. A custom `backgroundColor` is opaque unless you pass `rgba()` with an alpha.

The device color scheme is read once, when you call `createLogger`. In dark mode the default color and your `color` are lightened so they stay readable.

### Production

When `process.env.NODE_ENV` is `'production'`, `createLogger` returns a logger whose methods do nothing. Your bundler replaces `process.env.NODE_ENV`, so it can drop the dead branch.

## DOM logger

`domLog` shows a message on the page, which helps on a phone with no devtools. It is not turned off in production.

```ts
domLog('Hello'); // gone after 5 seconds
domLog('Stays longer', { duration: 10000 });
domLog.info('Saved');
domLog.error('Request failed', { code: 500 });
```

- `domLog`, `domLog.info`, `domLog.warn`, `domLog.error` and `domLog.debug` take any number of values. Objects print as indented JSON.
- If the last value is an object with a `duration` key, it is read as options and not printed. `duration` is in milliseconds, 5000 by default.
- `info`, `warn`, `error` and `debug` add an icon before the message. `log` has none.

Messages stack in the top-left corner (`top: 20px`, `left: 20px`, 6px apart, at most 400px wide, `z-index: 99999`). They fade and slide in and out over 0.3s. The container ignores pointer events, but each message accepts them, so a long message can be scrolled. The container is removed when the last message goes.

| Type    | Text      | Background            |
| ------- | --------- | --------------------- |
| `log`   | `#ffffff` | black at 0.2 alpha    |
| `info`  | `#3399ff` | the text color at 0.2 |
| `warn`  | `#ffaa00` | the text color at 0.2 |
| `error` | `#ff3333` | the text color at 0.2 |
| `debug` | `#999999` | the text color at 0.2 |

Each message has a 1px border in the text color and a 6px radius.
