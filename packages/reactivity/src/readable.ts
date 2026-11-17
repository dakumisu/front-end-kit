import { Signal, type WatchOptions } from './signal.ts';

export type StoreValues<S extends readonly Readable[]> = {
    [K in keyof S]: S[K] extends Readable<infer V> ? V : never;
};

export class Readable<T = unknown> extends Signal<T> {
    static isReadable = true;

    protected _value!: T;
    readonly value!: T;

    constructor(value: T) {
        super();

        // Define private backing property
        Object.defineProperty(this, '_value', {
            value: value,
            writable: false,
            enumerable: false,
            configurable: true,
        });

        // Define public 'value' property as read-only
        Object.defineProperty(this, 'value', {
            get: () => this.get(),
            enumerable: true,
            configurable: true,
        });
    }

    get(): T {
        return this._value;
    }

    watch(callback: (value: T) => void, opts: WatchOptions = {}): () => void {
        const watcher = this._createWatcher(callback, opts);
        if (opts.immediate) {
            callback(this.value);
        }
        return () => this._removeWatcher(watcher.id);
    }

    emit(): void {
        if (this._isFrozen) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('signal is frozen', this);
            }
            return;
        }

        if (this._watchers.length === 0) {
            return;
        }

        if (this._isHolding) {
            this._holdedEmits.push(this.value);
            return;
        }

        const watchers = [...this._watchers];
        for (let i = 0; i < watchers.length; i++) {
            const w = watchers[i];
            w.callback(this.value);
            if (w.once) {
                this._removeWatcher(w.id);
            }
        }
    }

    dispose(emitBeforeDispose = false): void {
        if (emitBeforeDispose) {
            this.emit();
        }
        super.dispose(false);
    }
}

export const readable = <T = unknown>(value: T): Readable<T> => new Readable<T>(value);
export const r: <T = unknown>(value: T) => Readable<T> = readable;
