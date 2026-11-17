import { Writable } from './writable.ts';

export class MapStore<T extends object = Record<string, unknown>> extends Writable<T> {
    static isMap = true;

    // Mutate one key in place and notify. Watchers receive the whole object.
    // Snapshot previous before mutating so `.previous` holds the prior object.
    setKey<K extends keyof T>(key: K, value: T[K]): void {
        if (this._value[key] === value) {
            return;
        }
        this.previous = { ...this._value };
        this._value[key] = value;
        this.emit();
    }

    // Remove a key entirely (nanostores parity). Setting `undefined` via setKey
    // keeps the key; deleteKey drops it.
    deleteKey(key: keyof T): void {
        if (!(key in this._value)) {
            return;
        }
        this.previous = { ...this._value };
        Reflect.deleteProperty(this._value, key);
        this.emit();
    }
}

export const map = <T extends object = Record<string, unknown>>(value: T): MapStore<T> =>
    new MapStore<T>(value);
export const m: <T extends object = Record<string, unknown>>(value: T) => MapStore<T> = map;
