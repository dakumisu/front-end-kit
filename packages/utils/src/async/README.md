# Async utils

Small helpers to delay, wait and settle promises. Import them from the `./async` subpath:

```ts
import { debounce, wait, nextFrame } from '@dakumisu/utils/async';
```

| File                 | Exports                                  | Clock                    |
| -------------------- | ---------------------------------------- | ------------------------ |
| `debounce.ts`        | `debounce`, `throttle`, `Cancelable`     | `setTimeout`             |
| `timers.ts`          | `wait`, `nextMacrotask`, `nextMicrotask` | `setTimeout`, microtasks |
| `frames.ts`          | `nextFrame`, `rafWait`, `rafSetInterval` | `requestAnimationFrame`  |
| `deferredPromise.ts` | `deferredPromise`, `DeferredPromise`     | none                     |

`queue.ts` is not in this table because `./async` does not export it. It builds on `@dakumisu/reactivity`, so it has its own subpath, `@dakumisu/utils/async/queue`. See [Queue](#queue).

## Hidden tabs

Browsers slow `setTimeout` in background tabs to about once per second. `requestAnimationFrame` stops completely: everything in `frames.ts` pauses while the tab is hidden and resumes when the user returns.

## Debounce and throttle

| Function   | Runs `fn`                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------- |
| `debounce` | Once, `ms` after the last call, with the latest arguments                                     |
| `throttle` | Right away, then at most once every `ms`; calls inside the window collapse into one last call |

Both return the wrapped function with a `cancel()` that drops the pending call.

```ts
const onResize = debounce(() => updateLayout(), 200);
window.addEventListener('resize', () => onResize());

const onScroll = throttle((y: number) => updateProgress(y), 100);
onScroll.cancel();
```

## Timers

| Function               | Resolves                                                          |
| ---------------------- | ----------------------------------------------------------------- |
| `wait(ms)`             | After `ms` milliseconds                                           |
| `nextMacrotask(n = 1)` | After `n` `setTimeout(0)` tasks                                   |
| `nextMicrotask()`      | Once the current synchronous code ends, before any task or render |

Browsers raise `setTimeout(0)` to about 4ms after 5 chained timers, so `nextMacrotask(10)` takes longer than it looks.

## Frames

| Function                 | Does                                                                         |
| ------------------------ | ---------------------------------------------------------------------------- |
| `nextFrame()`            | Resolves after the next frame has painted (two `requestAnimationFrame`)      |
| `rafWait(ms)`            | Resolves on the first frame after `ms`; always waits at least one frame      |
| `rafSetInterval(cb, ms)` | Calls `cb` every `ms` on frames, first call after `ms`; returns `{ cancel }` |

`rafSetInterval` keeps the leftover time between calls, so a 20ms interval averages 20ms at 60Hz instead of rounding up to 33ms. `cb` receives `cancel`, so it can stop the loop itself.

```ts
el.classList.add('is-start');
await nextFrame();
el.classList.add('is-end'); // the transition plays from the start state

const interval = rafSetInterval((cancel) => {
    if (isDone()) cancel();
}, 100);
```

## Deferred promise

A promise whose `resolve` and `reject` live outside it, so other code can settle it. Same shape as `Promise.withResolvers()`, which needs Safari 17.4+.

```ts
const ready = deferredPromise<void>();
image.addEventListener('load', () => ready.resolve());
await ready.promise;
```

## Queue

A loading queue. It runs tasks in parallel, reports their progress as a store, and resolves once a smoothed progress bar has reached 100%. It lives in its own subpath because it needs `@dakumisu/reactivity` (the other async helpers need nothing):

```ts
import { createQueue } from '@dakumisu/utils/async/queue';

const queue = createQueue({ id: 'app' });
queue.task(fetch('/data.json'), { weigth: 2 });
queue.task(document.fonts.ready);

queue.smoothProgress.watch((value) => (bar.style.transform = `scaleX(${value})`));
await queue.start();
await queue.complete.promise; // after the bar has reached 100%
```

| Export                                   | What it is                                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `createQueue(options?)`, `Queue`         | The queue. `options.id` names it                                                                    |
| `createTask(promise?, options?)`, `Task` | One unit of work: a promise, or a function that returns one                                         |
| `deferredTask()`, `DeferredTask`         | A task you settle yourself with `resolve()` or `reject()`; add it to a queue later with `queue.add` |
| `SubTask`, `AddSubtask`                  | The type of one step inside a task, and the type of `task.subtask`                                  |

### Queue members

| Member                                                  | Does                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `task(promiseOrTask, options?)`                         | Adds a task and returns its promise. A task made earlier, such as a `deferredTask()`, gets `options` applied                                |
| `add(task)`                                             | Adds a `Task` as it is                                                                                                                      |
| `fakeTask(ms?, weigth?)`                                | Adds a task that settles after `ms` (default 500) and returns the queue, for chaining. Handy for demos                                      |
| `start()`                                               | Runs every task that is not done, in parallel. Rejects when one fails. A second call while loading does nothing                             |
| `progress`, `smoothProgress`                            | `Writable<number>` from 0 to 1. `progress` jumps as tasks finish. `smoothProgress` eases towards it                                         |
| `isComplete`, `isReallyComplete`                        | `Writable<boolean>`. `isReallyComplete` is true when the tasks are done. `isComplete` waits for `smoothProgress` to reach 1                 |
| `complete`                                              | A `deferredPromise` that resolves with the queue when `isComplete` turns true                                                               |
| `onStart`, `onProgress`, `onRealComplete`, `onComplete` | Register a callback. `onStart` callbacks are awaited one by one before any task runs. `onProgress` gets `(progress, queue, task, subtask?)` |

Each task counts for its `weigth`, which defaults to 1. A task with sub-steps reports partial progress: `task.subtask(id, promise, details?)` adds a step, and the task's share is the fraction of steps settled. The spelling `weigth` is the published option name.

### Frame loop

`start()` runs a `requestAnimationFrame` loop that eases `smoothProgress` towards `progress` with `damp`. The loop ends when `smoothProgress` reaches 1, or when a task fails. It gives `damp` the time since the last frame in milliseconds. With lag smoothing, a gap over 500ms (a tab that was asleep, a long frame) counts as 33ms, so the bar does not jump.

Browsers stop `requestAnimationFrame` in a hidden tab, so `isComplete` waits there until the user comes back (see [Hidden tabs](#hidden-tabs)). `isReallyComplete` does not wait.

Importing the file touches no DOM global. `start()` needs `requestAnimationFrame` and `performance`, so call it in client code.
