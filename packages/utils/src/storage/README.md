# Storage utils

Keep a store in `localStorage` or `sessionStorage`. Stores come from `@dakumisu/reactivity`, which `@dakumisu/utils` installs for you. Import from the `./storage` subpath:

```ts
import { writable } from '@dakumisu/reactivity';
import { useLocalStorage } from '@dakumisu/utils/storage';

const volume = useLocalStorage('settings').sync('volume', writable(0.5));
volume.set(0.8); // saved to localStorage a moment later
// On the next visit, `volume.get()` starts at 0.8.
```

| File                 | Exports                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `useStorage.ts`      | `useStorage`, `useLocalStorage`, `useSessionStorage`, `StorageObject`, `StorageOptions` |
| `useStorageState.ts` | `useStorageState`                                                                       |

Nothing here reads `localStorage` or `sessionStorage` when the file loads, so the subpath is safe to import on the server. Call the functions in client code only.

## Storage object

`useLocalStorage(id, options?)` and `useSessionStorage(id, options?)` return a `StorageObject`. `useStorage(id, storage, options?)` does the same for any `Storage`. Calling it again with the same id and storage returns the same object. The id is lowercased.

All the data of one id lives in a single browser key, `__storage.<id>`, as one JSON object.

| Member                     | Does                                                          |
| -------------------------- | ------------------------------------------------------------- |
| `sync(key, state, reset?)` | Ties a store to `key` and returns the store                   |
| `get(key, def?)`           | Reads `key`, or `def` when it is missing                      |
| `set(key, value)`          | Writes `key`                                                  |
| `remove(key)`              | Deletes `key`                                                 |
| `clear()`                  | Deletes the whole stored item and stops every `sync`          |
| `folder(subKey)`           | Returns a `StorageObject` whose keys all start with `subKey.` |
| `id`, `storage`, `datas`   | The browser key, the `Storage` in use, and the in-memory data |

Keys can be dotted paths. `set('player.volume', 1)` stores `{ "player": { "volume": 1 } }`.

### `sync`

`sync(key, state)` takes a `Writable` or a plain value, which it wraps in a new `Writable`. It returns the store.

1. The stored value for `key` replaces the store's value, when there is one.
2. Every later change of the store is saved.

Syncing the same key again stops the earlier store from saving.

The third argument, `reset`, defaults to `true` when `process.env.NODE_ENV` is `'production'`. It queues a save of the store's current value before the stored value is read. The read comes first in practice, because the save is still in the queue, so a stored value still wins and `reset` changes nothing.

### Writes

`set`, `remove` and `clear` do not write right away. They join a queue that runs on `requestIdleCallback` (at most 1 second late), or on `setTimeout` where that does not exist. Order is kept. A write still queued when the page closes is lost.

`get` and `datas` read an in-memory copy that the queue updates. Right after `set`, `get` still returns the old value until the queued write has run.

`remove` logs a failed write with `console.error` in development and ignores it in production.

### Folders

```ts
const storage = useLocalStorage('game');
const audio = storage.folder('audio');
audio.sync('volume', writable(1)); // stored as `audio.volume`
audio.clear(); // resets `audio` to {} and stops its syncs
```

Folders nest: `audio.folder('music')` uses the prefix `audio.music.`.

## Options

| Option    | Default          | What it does                                                                    |
| --------- | ---------------- | ------------------------------------------------------------------------------- |
| `encode`  | `JSON.stringify` | Turns the data object into the string stored in the browser                     |
| `decode`  | `JSON.parse`     | Turns that string back into the data object                                     |
| `version` | `''`             | In production, mixed into the stored id. Change it to start from empty storage. |

`version` only matters in production. There the browser key is `__storage.<id><hash of id and version>`, so a new version no longer finds the old data, and the object cache keys on the same value.

`encode` and `decode` are read once, when the storage object is first made for an id. The data read from the browser must decode to an object, or the storage starts empty.

## `useStorageState`

A single store saved on its own, apart from any `StorageObject`.

```ts
import { useStorageState } from '@dakumisu/utils/storage';

const theme = useStorageState('theme', 'light'); // a Writable<string>
theme.set('dark'); // saved at once
```

`useStorageState(id, state, storage?, options?)` takes a `Writable` or a plain value. It stores under `__storage_state:<id>`, restores the stored value when there is one, and saves every change straight away, with no queue. It ignores `version`.

## Reactivity

A store counts as one when it has `watch` and `set` functions. `@dakumisu/reactivity`'s `writable` does. `sync` saves with `watch(callback, { immediate: true })`: it writes the current value at once, then on every change. Call the function that `watch` returns to stop; `sync` does that for you when the same key is synced again or `clear()` runs.
