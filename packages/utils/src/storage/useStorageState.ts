import { writable, type Writable } from '@dakumisu/reactivity';

import type { StorageOptions } from './useStorage.ts';

const p = JSON.parse;
const s = JSON.stringify;

const isAtom = <T>(v: Writable<T> | T): v is Writable<T> => {
    return (
        typeof Reflect.get(Object(v), 'watch') === 'function' &&
        typeof Reflect.get(Object(v), 'set') === 'function'
    );
};

// Create an writable signal that syncs with localStorage
// independently of the project storage (cf. useStorage)
export function useStorageState<T>(
    id: string,
    state: Writable<T> | T,
    storage?: Storage,
    options?: StorageOptions,
): Writable<T>;
export function useStorageState(
    id: string,
    state: unknown,
    storage: Storage = localStorage,
    { encode = s, decode = p }: StorageOptions = {},
): Writable {
    const key = `__storage_state:${id}`;

    const store = isAtom(state) ? state : writable(state);

    if (storage.getItem(key) === null) {
        storage.setItem(key, encode(store.value));
    }

    store.set(decode(storage.getItem(key) || 'null'));
    store.watch((value) => storage.setItem(key, encode(value)), { immediate: true });

    return store;
}
