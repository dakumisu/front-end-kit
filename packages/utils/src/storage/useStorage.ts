import { writable, type Writable } from '@dakumisu/reactivity';

import { ddv, dlv, dsv } from '#object/index.ts';
import { hash } from '#string/hash.ts';

type Encode = (value: unknown) => string;
type Decode = (raw: string) => unknown;
type WriteCallback = (deadline: IdleDeadline | undefined) => void;

const list = new Map<string, StorageObject>();
const p: Decode = JSON.parse;
const s: Encode = JSON.stringify;

const isAtom = <T>(v: Writable<T> | T): v is Writable<T> => {
    return (
        typeof Reflect.get(Object(v), 'watch') === 'function' &&
        typeof Reflect.get(Object(v), 'set') === 'function'
    );
};

// No deadline means the `setTimeout` fallback, which has no time budget
const hasTime = (deadline: IdleDeadline | undefined): boolean =>
    !deadline || deadline.didTimeout || deadline.timeRemaining() > 0;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** `version` salts the production storage id: change it to start from empty storage. */
export interface StorageOptions {
    encode?: (value: unknown) => string;
    decode?: (raw: string) => unknown;
    version?: string;
}

export interface StorageObject {
    id: string;
    storage: Storage;
    datas: Record<string, unknown>;
    sync: <T>(key: string, state: Writable<T> | T, resetStorage?: boolean) => Writable<T>;
    get: <T = unknown>(key: string, def?: T) => T;
    set: (key: string, value: unknown) => void;
    remove: (key: string) => void;
    clear: () => void;
    folder: (subKey: string) => StorageObject;
}

type StorageFolder = StorageObject & { readonly subId: string };

function createStorage(
    id: string,
    storage: Storage = localStorage,
    encode: Encode = s,
    decode: Decode = p,
): StorageObject {
    // Map to keep track of watcher disposers for each key.
    // This allows us to unsubscribe when a key is re‑synced or when the storage
    // is disposed, preventing dangling listeners that could cause memory leaks.
    const unsubMap = new Map<string, () => void>();

    // ---------------------------------------------------------------------
    // Simple write‑queue to avoid concurrent writes to the underlying storage.
    // All mutating operations (set, remove, clear) are enqueued and executed
    // sequentially using requestIdleCallback. This prevents race conditions when
    // multiple parts of the app (or multiple tabs) try to write at the same time.
    // ---------------------------------------------------------------------
    const writeQueue: Array<() => void> = [];
    let processingQueue = false;
    // Without a timeout, a page busy every frame never idles, so writes wait until lost on unload.
    const WRITE_TIMEOUT_MS = 1000;

    // Use requestIdleCallback if available, otherwise fallback to setTimeout.
    const scheduleWrite = (cb: WriteCallback) => {
        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(cb, { timeout: WRITE_TIMEOUT_MS });
        } else {
            setTimeout(cb, 0);
        }
    };

    const enqueueWrite = (op: () => void) => {
        writeQueue.push(op);
        if (!processingQueue) {
            processingQueue = true;
            scheduleWrite(processWriteQueue);
        }
    };

    const processWriteQueue: WriteCallback = (deadline) => {
        while (writeQueue.length && hasTime(deadline)) {
            const op = writeQueue.shift();
            if (op) {
                op();
            }
        }
        if (writeQueue.length) {
            scheduleWrite(processWriteQueue);
        } else {
            processingQueue = false;
        }
    };

    // Initialise storage if missing
    if (storage.getItem(id) === null) {
        storage.setItem(id, encode({}));
    }

    const decoded = decode(storage.getItem(id) || '{}');
    const datas: Record<string, unknown> = isRecord(decoded) ? decoded : {};

    // ----- Helper functions -----
    function sync<T>(
        key: string,
        state: Writable<T> | T,
        resetStorage = process.env.NODE_ENV === 'production',
    ): Writable<T> {
        const store = isAtom(state) ? state : writable(state);

        if (resetStorage) {
            set(key, store.get());
        }

        const data = get(key, store.get());
        store.set(data);

        // If we already have a subscription for this key, unsubscribe first.
        const previousUnsub = unsubMap.get(key);
        if (previousUnsub) {
            previousUnsub();
        }

        const unsub = store.watch((value) => set(key, value), { immediate: true });
        unsubMap.set(key, unsub);
        return store;
    }

    function set(childId: string, data: unknown): void {
        enqueueWrite(() => {
            dsv(datas, childId, data);
            storage.setItem(id, encode(datas));
        });
    }

    function get<T = unknown>(childId: string, def?: T): T {
        return dlv<T>(datas, childId, def);
    }

    function remove(childId: string): void {
        enqueueWrite(() => {
            try {
                ddv(datas, childId);
                storage.setItem(id, encode(datas));
            } catch (e) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error(e);
                }
            }
        });
    }

    function clear(): void {
        enqueueWrite(() => {
            // Remove the stored item.
            storage.removeItem(id);
        });
        // Unsubscribe all listeners to avoid leaks.
        unsubMap.forEach((unsub) => unsub());
        unsubMap.clear();
    }

    // Return all the methods of this storage with the subKey as a prefix
    function folder(subKey: string): StorageFolder {
        subKey = subKey.toLowerCase();

        // Ensure the subKey exists
        if (!get(subKey)) {
            set(subKey, {});
        }

        return {
            get id() {
                return `${id}.${subKey}`;
            },
            get subId() {
                return subKey;
            },
            get storage() {
                return storage;
            },
            get datas() {
                return dlv<Record<string, unknown>>(datas, subKey, {});
            },
            sync: <T>(key: string, state: Writable<T> | T, resetStorage?: boolean) =>
                sync(`${subKey}.${key}`, state, resetStorage),
            get: <T = unknown>(key: string, def?: T) => get<T>(`${subKey}.${key}`, def),
            set: (key: string, value: unknown) => set(`${subKey}.${key}`, value),
            remove: (key: string) => remove(`${subKey}.${key}`),
            // Reset the sub‑folder to an empty object and clean up any listeners for that sub‑key
            clear: () => {
                // Unsubscribe any listeners that were created for keys belonging to this sub‑folder.
                const prefix = `${subKey}.`;
                for (const key of unsubMap.keys()) {
                    if (key === subKey || key.startsWith(prefix)) {
                        const unsub = unsubMap.get(key);
                        if (unsub) {
                            unsub();
                        }
                        unsubMap.delete(key);
                    }
                }
                // Reset the stored object for the sub‑folder.
                set(subKey, {});
            },
            folder: (key: string) => folder(`${subKey}.${key}`),
        };
    }

    // ----- Public storage object -----
    return {
        get id() {
            return id;
        },
        get storage() {
            return storage;
        },
        get datas() {
            return datas;
        },
        sync,
        get,
        set,
        remove,
        clear,
        folder,
    };
}

// Create a storage object
export function useStorage(
    id: string = 'dummy',
    storage: Storage = localStorage,
    { encode = s, decode = p, version = '' }: StorageOptions = {},
): StorageObject {
    // normalize id
    let key = id.toLowerCase();

    // Avoid leaking storage objects in production
    if (process.env.NODE_ENV === 'production') {
        key += hash(key + version);
    }

    // return storage if it exists
    const existing = list.get(key);
    if (existing && existing.storage === storage) {
        return existing;
    }

    // create storage if it doesn't exist
    const created = createStorage(`__storage.${key}`, storage, encode, decode);
    list.set(key, created);

    return created;
}

export function useLocalStorage(id: string, options: StorageOptions = {}): StorageObject {
    return useStorage(id, localStorage, options);
}

export function useSessionStorage(id: string, options: StorageOptions = {}): StorageObject {
    return useStorage(id, sessionStorage, options);
}
