import { Signal } from './signal.ts';

export interface Hook<T = void> {
    listen(cb: (payload: T) => void): () => void;
    subscribe(cb: (payload: T) => void): () => void;
    emit(payload: T): void;
}

// Isolate listener errors so one throwing cb can't abort an emit (and the frame).
function run<T>(cb: (p: T) => void, payload: T): void {
    try {
        cb(payload);
    } catch (err) {
        console.error('[hook] listener threw:', err);
    }
}

export function createHook<T = void>(): Hook<T> {
    const signal = new Signal<{ type: string; data: { v: T } }>();
    let hasLast = false;
    let last: T;

    // Each user cb becomes a Signal watcher that unboxes the payload and runs it
    // error-isolated. Signal.watch returns the matching unwatch fn.
    function add(cb: (p: T) => void): () => void {
        return signal.watch((env) => run(cb, env.data.v));
    }

    return {
        listen: add,
        subscribe(cb) {
            if (hasLast) {
                run(cb, last);
            }
            return add(cb);
        },
        emit(payload) {
            last = payload;
            hasLast = true;
            // Box as { v } so the payload survives Signal's { type, data } envelope
            // intact for ANY T — void/undefined included, and objects that carry
            // their own `.data` key. Signal.emit already snapshots its watcher list,
            // so a cb that (un)subscribes mid-emit can't skip the next listener.
            signal.emit({ type: 'hook', data: { v: payload } });
        },
    };
}
