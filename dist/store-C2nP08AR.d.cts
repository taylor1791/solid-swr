type OnTrimFn = (key: string) => void;
type StoreCache = {
    /** item has been inserted into store */
    insert: (key: string, onTrim: OnTrimFn) => void;
    /** item has been looked up */
    lookup: (key: string, onTrim: OnTrimFn) => void;
};
type StoreItem<D = unknown, E = unknown> = {
    data: D | undefined;
    err: E | undefined;
    isLoading: boolean;
    /** touch this only if you know what you're doing, this controls deduplication */
    _isBusy: boolean;
    /** whether this item exists in store */
    _exists: boolean;
    /** used to call onSuccess for every hook */
    _onSuccess: number;
    /** used to call onError for every hook */
    _onError: number;
    /** how many hooks (useSwr from core) are attached to this item */
    _mountedCount: number;
};
type SolidStore = {
    [key: string]: StoreItem | undefined;
};
declare class Store {
    private cache;
    private store;
    private setStore;
    private boundDestroy;
    static defaultItem: StoreItem;
    constructor(cache?: StoreCache);
    keys(): string[];
    updateDataProduce<D>(key: string, producer: (data: D | undefined) => void): void;
    update<D, E>(key: string, partial: Partial<StoreItem<D, E>>): void;
    mount(key: string): void;
    unmount(key: string): void;
    lookupOrDef<D, E>(key?: string): StoreItem<D, E>;
    private lookup;
    private destroy;
    private makeExist;
}

export { type OnTrimFn as O, type StoreItem as S, type StoreCache as a, Store as b, type SolidStore as c };
