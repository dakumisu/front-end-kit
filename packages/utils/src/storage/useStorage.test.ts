// @vitest-environment happy-dom
import { writable } from '@dakumisu/reactivity';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLocalStorage } from './useStorage.ts';
import { useStorageState } from './useStorageState.ts';

const readStored = (id: string): unknown => JSON.parse(localStorage.getItem(id) ?? 'null');

beforeEach(() => {
    localStorage.clear();
});

describe('useLocalStorage().sync', () => {
    it('writes a store change to localStorage', async () => {
        const state = useLocalStorage('t').sync('k', writable(1));
        state.set(2);

        await vi.waitFor(() => expect(readStored('__storage.t')).toEqual({ k: 2 }));
    });

    it('starts from the stored value', () => {
        localStorage.setItem('__storage.restore', JSON.stringify({ k: 7 }));
        const state = useLocalStorage('restore').sync('k', writable(1));

        expect(state.get()).toBe(7);
    });

    it('wraps a plain value in a store', async () => {
        const state = useLocalStorage('plain').sync('k', 5);
        state.set(6);

        await vi.waitFor(() => expect(readStored('__storage.plain')).toEqual({ k: 6 }));
    });

    it('stops writing for a store that was replaced by a second sync', async () => {
        const storage = useLocalStorage('resync');
        const first = storage.sync('k', writable(1));
        const second = storage.sync('k', writable(10));
        await vi.waitFor(() => expect(readStored('__storage.resync')).toEqual({ k: 10 }));

        second.set(11);
        first.set(99);

        await vi.waitFor(() => expect(readStored('__storage.resync')).toEqual({ k: 11 }));
    });
});

describe('useStorageState', () => {
    it('restores the stored value and writes changes back', () => {
        localStorage.setItem('__storage_state:s', JSON.stringify(3));
        const state = useStorageState('s', writable(0));

        expect(state.get()).toBe(3);
        state.set(4);
        expect(localStorage.getItem('__storage_state:s')).toBe('4');
    });
});
