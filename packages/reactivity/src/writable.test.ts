import { describe, expect, it, vi } from 'vitest';

import { writable } from './writable.ts';

describe('writable.set force', () => {
    it('emits once when forced to a new value', () => {
        const store = writable(1);
        const callback = vi.fn();
        store.watch(callback);
        store.set(2, true);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('emits once when forced to the same value', () => {
        const store = writable(1);
        const callback = vi.fn();
        store.watch(callback);
        store.set(1, true);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not emit for the same value without force', () => {
        const store = writable(1);
        const callback = vi.fn();
        store.watch(callback);
        store.set(1);
        expect(callback).toHaveBeenCalledTimes(0);
    });
});
