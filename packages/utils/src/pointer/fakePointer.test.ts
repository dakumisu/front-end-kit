// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createRandom } from '#distribution/index.ts';

import { createFakePointer, type FakePointer, type FakePointerOptions } from './fakePointer.ts';

// Each pointer builds its noise from Math.random, so a fresh stub per create gives equal noise
const create = (options: FakePointerOptions = {}): FakePointer => {
    vi.spyOn(Math, 'random').mockImplementation(createRandom(1));
    return createFakePointer({ size: { width: 200, height: 100 }, autoUpdate: false, ...options });
};

describe('createFakePointer', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('set keeps the settings it was not given', () => {
        const a = create({ seed: 1, scale: 0.2, speed: 1 });
        const b = create({ seed: 1, scale: 0.2 });
        b.set({ speed: 1 });

        a.update(1000);
        b.update(1000);

        expect(b.$pointer.value).toEqual(a.$pointer.value);
    });

    it('notifies once per update', () => {
        const pointer = create();
        let count = 0;
        pointer.$pointer.watch(() => count++);

        pointer.update(1000);

        expect(count).toBe(1);
    });

    it('gives a centered, finite state at zero size', () => {
        const pointer = create({ size: { width: 0, height: 0 } });

        pointer.update(1000);

        expect(pointer.$pointer.value).toEqual({ x: 0, y: 0, normalizedX: 0.5, normalizedY: 0.5 });
    });
});
