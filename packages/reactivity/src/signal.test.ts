import { describe, expect, it, vi } from 'vitest';

import { readable } from './readable.ts';
import { signal } from './signal.ts';

describe('signal unwatch with duplicate callbacks', () => {
    it('removes the watcher of the unwatch function that was called', () => {
        const source = signal();
        const callback = vi.fn();
        source.watch(callback, { priority: 'high' });
        const unwatchLow = source.watch(callback, { priority: 'low' });
        const highId = source._watchers[0].id;

        unwatchLow();

        expect(source._watchers.map((w) => w.id)).toEqual([highId]);
    });

    it('removes only itself when a once duplicate fires', () => {
        const source = signal();
        const callback = vi.fn();
        source.watch(callback, { priority: 'high' });
        source.watch(callback, { priority: 'low', once: true });
        const highId = source._watchers[0].id;

        source.emit();

        expect(callback).toHaveBeenCalledTimes(2);
        expect(source._watchers.map((w) => w.id)).toEqual([highId]);
    });

    it('keeps unwatch(callback) removing the first match', () => {
        const source = signal();
        const callback = vi.fn();
        source.watch(callback, { priority: 'high' });
        source.watch(callback, { priority: 'low' });
        const lowId = source._watchers[1].id;

        source.unwatch(callback);

        expect(source._watchers.map((w) => w.id)).toEqual([lowId]);
    });
});

describe('readable unwatch with duplicate callbacks', () => {
    it('removes the watcher of the unwatch function that was called', () => {
        const source = readable(1);
        const callback = vi.fn();
        source.watch(callback);
        const unwatchSecond = source.watch(callback);
        const firstId = source._watchers[0].id;

        unwatchSecond();

        expect(source._watchers.map((w) => w.id)).toEqual([firstId]);
    });

    it('removes only itself when a once duplicate fires', () => {
        const source = readable(1);
        const callback = vi.fn();
        source.watch(callback);
        source.watch(callback, { once: true });
        const firstId = source._watchers[0].id;

        source.emit();

        expect(callback).toHaveBeenCalledTimes(2);
        expect(source._watchers.map((w) => w.id)).toEqual([firstId]);
    });
});
