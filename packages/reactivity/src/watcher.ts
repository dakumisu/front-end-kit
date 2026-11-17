import { Readable, type StoreValues } from './readable.ts';
import type { WatchOptions } from './signal.ts';

export function createScheduler<const S extends readonly Readable[]>(
    callback: (values: StoreValues<S>) => void,
    observables: S,
): () => void;
export function createScheduler(
    callback: (values: never) => void,
    observables: readonly Readable[],
): () => void {
    let pending = false;

    const flush = (): void => {
        pending = false;
        const observablesValues = observables.map((o) => o.value);
        // The overloads above type the values from the stores; Reflect.apply skips the `never` parameter
        Reflect.apply(callback, undefined, [observablesValues]);
    };

    return () => {
        if (pending) {
            return;
        }
        pending = true;
        queueMicrotask(flush);
    };
}

export function watch<V>(
    observables: Readable<V>,
    callback: (values: [V]) => void,
    opts?: WatchOptions,
): () => void;
export function watch<const S extends readonly Readable[]>(
    observables: S,
    callback: (values: StoreValues<S>) => void,
    opts?: WatchOptions,
): () => void;
export function watch(
    observables: Readable | readonly Readable[],
    callback: (values: never) => void,
    opts: WatchOptions = {},
): () => void {
    const list = observables instanceof Readable ? [observables] : observables;

    const scheduleCallback = createScheduler(
        (values) => Reflect.apply(callback, undefined, [values]),
        list,
    );
    const watchers = list.map((o) => o.watch(scheduleCallback, opts));

    return () => watchers.forEach((unwatch) => unwatch());
}
