# @dakumisu/reactivity

Small signal and store primitives

```sh
pnpm add @dakumisu/reactivity
```

| Import                 | Exports                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `@dakumisu/reactivity` | `signal`, `readable`, `writable`, `map`, `computed`, `watch`, `createScheduler`, `createHook` |

No dependencies. Each factory has a one-letter alias: `s` for `signal`, `r` for `readable`, `w` for `writable`, `m` for `map`, `c` for `computed`. The classes (`Signal`, `Readable`, `Writable`, `MapStore`, `Computed`) are exported too.

```ts
import { signal, writable, computed, watch, createHook } from '@dakumisu/reactivity';
```

## `Signal`

Fire-and-forget notifications. No stored value.

```ts
const s = signal();
const off = s.watch((e) => console.log(e.data));
s.emit('hello'); // { type: 'trigger', data: 'hello' }
off(); // stop listening
```

- `watch(cb, { once?, immediate?, priority? })` returns an unwatch function. It removes only the watcher it created, even if the same callback is watched twice. `priority` is `'high' | 'normal' | 'low'` or a number. Higher runs first.
- `immediate` emits once right away. Every watcher on the signal receives that emit, not only the new one.
- `emit(data?)`. With no argument, `data` is `{}`.
- `unwatch(cb)` removes the first watcher with that callback. `unwatchAll()` removes all.
- `hold()` buffers emits until `unhold()`. `freeze()` drops them until `unfreeze()`. Both return the undo function.
- `dispose()` clears all watchers.

## `Readable` / `Writable`

A value that notifies on change. `Readable` is read-only. `Writable` adds a setter.

```ts
const count = writable(0);
count.watch((v) => console.log(v), { immediate: true }); // runs now with 0
count.value = 1; // notifies
count.set(1); // no-op, same value
count.set(1, true); // force one notify
count.previous; // value before the current one, null until the first change
```

- Watchers receive the raw value, not an event object.
- `.set()` and the `value` setter skip `===` duplicates.
- `priority` has no effect here. Watchers run in the order they were added.

## `map`

A `Writable` holding an object (class `MapStore`). `setKey` mutates one key in place and notifies. Watchers receive the whole object.

```ts
const $pos = map({ x: 0, y: 0 });
$pos.watch((v) => console.log(v.x, v.y));
$pos.setKey('x', 10); // notifies, mutates in place
$pos.set({ x: 1, y: 2 }); // replaces the whole object
$pos.deleteKey('x'); // removes the key
$pos.previous; // shallow copy of the object before the last setKey or deleteKey
```

The object reference stays the same across `setKey`. After `set()`, `previous` is the old object itself, not a copy.

## `computed`

A read-only value derived from one or more stores. It runs the callback once at creation. After a source changes, it recomputes in a microtask. Several changes in the same tick give one recompute.

```ts
const w = writable(2);
const h = writable(3);
const area = computed([w, h], ([w, h]) => w * h); // area.value is 6
area.watch((v) => console.log(v)); // runs after w or h changes, not now
area.dispose(); // stops listening to w and h
```

Pass a single store or a tuple. The callback always gets a tuple, typed from the stores and in their order. A single store gives a one-element tuple: `computed(w, ([w]) => w * 2)`.

## `watch`

Watch several stores at once. The callback runs once per tick, in a microtask, with all current values as a tuple (a one-element tuple for a single store). It does not run at start unless you pass `{ immediate: true }`.

```ts
const stop = watch([w, h], ([w, h]) => layout(w, h));
stop(); // stops watching every store
```

`createScheduler(callback, stores)` is the batching part on its own. It returns a function. Call it as often as you like, and the callback runs once per microtask.

## `createHook`

Typed events built on `Signal`. Fires on every `emit`, even with the same payload reference. Good for per-frame hooks.

```ts
const onFrame = createHook<{ dt: number }>();
onFrame.listen((p) => update(p.dt)); // future emits only
onFrame.subscribe((p) => update(p.dt)); // also replays the last payload now
onFrame.emit({ dt: 16 });
```

`listen` and `subscribe` return an unsubscribe function. A listener that throws is logged with `console.error` and does not stop the others.

## Types

`Signal<P>`, `SignalEvent` (`{ type: string; data: unknown }`), `StoreValues<S>`, `Priority`, `WatchOptions`, `WatchCallback<P>`, `Hook<T>`.
