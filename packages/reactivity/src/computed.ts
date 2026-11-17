import { Readable, type StoreValues } from './readable.ts';

const toggleWritable = (self: object, v: boolean): void => {
    Object.defineProperty(self, '_value', {
        writable: v,
        enumerable: false,
        configurable: true,
    });
};

export class Computed<T = unknown> extends Readable<T> {
    static isComputed = true;

    callback: (values: readonly unknown[]) => T;
    observers: readonly Readable[];
    _pending: boolean;

    constructor(
        observers: Readable | readonly Readable[],
        callback: (values: readonly unknown[]) => T,
    ) {
        const list = observers instanceof Readable ? [observers] : observers;
        super(callback(list.map((o) => o.value)));

        this.callback = callback;
        this.observers = list;
        this._pending = false;

        toggleWritable(this, false);

        for (let i = 0; i < this.observers.length; i++) {
            this.observers[i].watch(this.scheduleUpdate);
        }
    }

    set(): void {
        return console.error('Computed values are read-only');
    }

    scheduleUpdate = (): void => {
        if (this._pending) {
            return;
        }
        this._pending = true;

        queueMicrotask(this.flushUpdate);
    };

    flushUpdate = (): void => {
        this._pending = false;
        this.update();
    };

    update(): void {
        toggleWritable(this, true);
        this._value = this.callback(this.observers.map((o) => o.value));
        toggleWritable(this, false);
        this.emit();
    }

    dispose(emitBeforeDispose = false): void {
        for (let i = 0; i < this.observers.length; i++) {
            this.observers[i].unwatch(this.scheduleUpdate);
        }
        super.dispose(emitBeforeDispose);
    }
}

export function computed<V, T>(observer: Readable<V>, callback: (values: [V]) => T): Computed<T>;
export function computed<const S extends readonly Readable[], T>(
    observers: S,
    callback: (values: StoreValues<S>) => T,
): Computed<T>;
export function computed<T>(
    observers: Readable | readonly Readable[],
    callback: (values: never) => T,
): Computed<T> {
    // The overloads above type the values from the stores; Reflect.apply skips the `never` parameter
    return new Computed<T>(observers, (values) => Reflect.apply(callback, undefined, [values]));
}
export const c: typeof computed = computed;
