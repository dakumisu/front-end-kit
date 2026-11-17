import { Readable } from './readable.ts';

export class Writable<T = unknown> extends Readable<T> {
    static isWritable = true;

    declare value: T;
    previous: T | null;

    constructor(value: T) {
        super(value);

        // Define private backing property
        Object.defineProperty(this, '_value', {
            value: value,
            writable: true,
            enumerable: false,
            configurable: true,
        });

        // Define 'value' property with getter and setter
        Object.defineProperty(this, 'value', {
            get: () => this.get(),
            set: (next: T) => {
                if (this._value === next) {
                    return;
                }
                this.previous = this._value;
                this._value = next;
                this.emit();
            },
            enumerable: true,
            configurable: true,
        });

        this.previous = null;
    }

    set(value: T, force = false): void {
        if (this._value === value) {
            if (force) {
                this.emit();
            }
            return;
        }
        this.value = value;
    }
}

export const writable = <T = unknown>(value: T): Writable<T> => new Writable<T>(value);
export const w: <T = unknown>(value: T) => Writable<T> = writable;
