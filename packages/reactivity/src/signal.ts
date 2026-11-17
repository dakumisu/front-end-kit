const list = new WeakMap<symbol, Signal<unknown>>();

const NOOP = () => {};
const DEFAULT_DATA = { type: 'trigger', data: null };
const DEFAULT_OPTS = { once: false, immediate: false, priority: 1 };
const PRIORITIES: Record<string, number> = { high: 2, normal: 1, low: 0 };

let uid = 0;
let w_uid = 0;

export type Priority = number | 'high' | 'normal' | 'low';

export interface WatchOptions {
    once?: boolean;
    immediate?: boolean;
    priority?: Priority;
}

export interface SignalEvent {
    type: string;
    data: unknown;
}

/** What a watcher receives. `P` is the signal event for `Signal`, the value for `Readable`. */
export type WatchCallback<P = SignalEvent> = (payload: P) => void;

// Method-derived type keeps `Readable<number>` assignable to `Readable<unknown>`
type StoredCallback = { bivarianceHack(payload: unknown): void }['bivarianceHack'];

interface Watcher {
    id: symbol;
    callback: StoredCallback;
    once: boolean;
    priority: number;
}

export class Signal<P = SignalEvent> {
    _isSignal: boolean;
    _watchers: Watcher[];
    _symbol: symbol;
    _isFrozen: boolean;
    _isHolding: boolean;
    _holdedEmits: unknown[];

    constructor() {
        this._isSignal = true;

        this._watchers = [];
        this._symbol = Symbol(this.constructor.name + uid++);
        this._isFrozen = false;
        this._isHolding = false;
        this._holdedEmits = [];

        list.set(this._symbol, this);
    }

    /* Private */

    _getPriority(p?: Priority): number {
        if (typeof p === 'string') {
            return PRIORITIES[p.toLowerCase()] ?? PRIORITIES.normal;
        }
        if (typeof p === 'number') {
            return p;
        }
        return PRIORITIES.normal;
    }

    _createWatcher(callback: WatchCallback<P>, opts: WatchOptions = {}): Watcher {
        const watcher: Watcher = {
            id: Symbol(String(w_uid++)),
            callback,
            once: !!opts.once,
            priority: this._getPriority(opts.priority),
        };
        this._watchers.push(watcher);
        return watcher;
    }

    _removeWatcher(id: symbol): void {
        const index = this._watchers.findIndex((w) => w.id === id);
        if (index > -1) {
            this._watchers.splice(index, 1);
        }
    }

    /* Public */

    watch(callback: WatchCallback<P> = NOOP, opts: WatchOptions = {}): () => void {
        opts = { ...DEFAULT_OPTS, ...opts };
        const watcher = this._createWatcher(callback, opts);
        this._watchers.sort((a, b) => b.priority - a.priority);
        if (opts.immediate) {
            this.emit();
        }
        return () => this._removeWatcher(watcher.id);
    }

    unwatch(callback: WatchCallback<P>): void {
        const index = this._watchers.findIndex((w) => w.callback === callback);
        if (index > -1) {
            this._watchers.splice(index, 1);
        }
    }

    unwatchAll(): void {
        this._watchers = [];
    }

    emit(payload: unknown = {}): void {
        if (this._isFrozen) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('signal is frozen', this);
            }
            return;
        }

        // Wrap raw payloads in an envelope. Treat as already-wrapped only when it's
        // an object carrying a `data` key — so falsy payloads (0/false/'') and
        // objects don't get double-wrapped.
        const isEnvelope = payload !== null && typeof payload === 'object' && 'data' in payload;
        const payloadType =
            typeof payload === 'object' && payload !== null && 'type' in payload
                ? payload.type
                : undefined;
        const raw: { type?: unknown; data?: unknown } = isEnvelope
            ? payload
            : { data: payload, type: payloadType ?? 'trigger' };
        if (raw.data === undefined) {
            raw.data = DEFAULT_DATA.data;
        }
        const data: SignalEvent = Object.assign({}, DEFAULT_DATA, raw);

        if (this._isHolding) {
            this._holdedEmits.push(data);
            return;
        }

        // Iterate over a copy: a `once` watcher (or a callback that unwatches)
        // mutates _watchers mid-dispatch and would otherwise shift indices / skip watchers.
        const watchers = [...this._watchers];
        for (let i = 0; i < watchers.length; i++) {
            const w = watchers[i];
            w.callback(data);
            if (w.once) {
                this._removeWatcher(w.id);
            }
        }
    }

    hold(): () => void {
        this._isHolding = true;
        return () => this.unhold();
    }

    unhold(emitHoldings = true): void {
        this._isHolding = false;

        if (emitHoldings) {
            for (let i = 0; i < this._holdedEmits.length; i++) {
                this.emit(this._holdedEmits[i]);
            }
            this._holdedEmits = [];
        }
    }

    freeze(): () => void {
        this._isFrozen = true;
        return () => this.unfreeze();
    }

    unfreeze(): void {
        this._isFrozen = false;
    }

    dispose(emitBeforeDispose = false): void {
        if (emitBeforeDispose) {
            this.emit({ type: 'dispose' });
        }
        this._watchers = [];
        list.delete(this._symbol);
    }
}

export const signal = (): Signal => new Signal();
export const s: () => Signal = signal;
