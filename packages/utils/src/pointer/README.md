# Pointer utils

A pointer that moves on its own, for demos and idle states. Import it from the `./pointer` subpath. Client only: it needs `requestAnimationFrame` and a size source. It builds on `@dakumisu/reactivity`.

```ts
import { createFakePointer } from '@dakumisu/utils/pointer';
```

| File             | Exports                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| `fakePointer.ts` | `createFakePointer`, `FakePointer`, `FakePointerOptions`, `FakePointerSettings`, `FakePointerState`, `Size`, `Vec2` |

## Options

A number applies to both axes. Pass `{ x, y }` to split them.

| Option       | Default                      | Meaning                                                  |
| ------------ | ---------------------------- | -------------------------------------------------------- |
| `speed`      | `0.5`                        | Time multiplier                                          |
| `scale`      | `0.75`                       | Noise amplitude                                          |
| `offset`     | `0`                          | Shift from the center, normalized in [-0.5, 0.5]         |
| `range`      | `0.75`                       | Share of the container the pointer can cover, 1 is all   |
| `seed`       | random in [0, 100), per axis | Picks the path. The default is drawn for each pointer    |
| `size`       | none                         | Fixed container size in px. No tracking                  |
| `target`     | none                         | Element whose content box is the container               |
| `autoUpdate` | `true`                       | Run on `requestAnimationFrame`. Off: call `update(time)` |

## Size source

The pointer picks one source when it is created:

1. `size`: fixed.
2. `target`: a `ResizeObserver` on the element. It reports after the first frame, so the size is 0 until then. A zero size gives position 0 and normalized 0.5 on that axis.
3. The window: `innerWidth` and `innerHeight`, read on `start` and on each `resize`.

`start` attaches the source and `stop` detaches it. `setSize` writes the size, and a tracked source overwrites it on its next report.

## State and control

`$pointer` holds `x` and `y` in px, and `normalizedX` and `normalizedY` in [0, 1]. A watcher runs once per update, and it gets the same object each time.

- `start` and `stop` run and pause the movement. The pointer starts right away.
- `reset` stops and centers the pointer.
- `isActive` tells whether it runs.
- `set` changes the options in `FakePointerSettings`. Keys you leave out keep their value.
- `update(time)` moves one step. `time` is in ms, like a `requestAnimationFrame` timestamp. It does nothing while stopped.

```ts
const pointer = createFakePointer({ target: document.querySelector('#box')!, speed: 0.3 });

const stop = pointer.$pointer.watch(({ x, y }) => {
    dot.style.transform = `translate(${x}px, ${y}px)`;
});

pointer.set({ range: 0.5 });
pointer.stop();
stop();
```
