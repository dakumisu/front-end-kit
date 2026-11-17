import { describe, expect, it, vi } from 'vitest';

import { computed } from './computed.ts';
import { writable } from './writable.ts';

describe('computed.dispose', () => {
    it('unwatches every source and stops recomputing', async () => {
        const a = writable(1);
        const b = writable(2);
        const before = [a._watchers.length, b._watchers.length];
        const compute = vi.fn(([x, y]: readonly [number, number]) => x + y);
        const sum = computed([a, b], compute);
        const onChange = vi.fn();
        sum.watch(onChange);

        expect(a._watchers.length).toBe(before[0] + 1);
        expect(b._watchers.length).toBe(before[1] + 1);

        sum.dispose();
        expect(a._watchers.length).toBe(before[0]);
        expect(b._watchers.length).toBe(before[1]);

        const calls = compute.mock.calls.length;
        a.set(10);
        await Promise.resolve();
        expect(compute.mock.calls.length).toBe(calls);
        expect(onChange).not.toHaveBeenCalled();
    });
});
