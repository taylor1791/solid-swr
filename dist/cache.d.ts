import { a as StoreCache } from './store-C2nP08AR.js';

type OnTrim<K> = (key: K) => void;
declare class LRU<K, V> {
    private lookup;
    private reverseLookup;
    private capacity;
    private length;
    private head?;
    private tail?;
    constructor(capacity?: number);
    /** if the value is an object this returns a direct reference */
    get(key: K): V | undefined;
    set(key: K, value: V, onTrim?: OnTrim<K>): void;
    keys(): K[];
    private trimCache;
    private detach;
    private prepend;
}

declare const createCache: (lru: LRU<string, boolean>) => StoreCache;

export { LRU, createCache };
