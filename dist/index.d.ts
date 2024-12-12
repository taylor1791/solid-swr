import { b as Store, S as StoreItem } from './store-C2nP08AR.js';
export { O as OnTrimFn, c as SolidStore, a as StoreCache } from './store-C2nP08AR.js';
import { JSX, Accessor } from 'solid-js';

type FetcherOpts = {
    signal: AbortSignal;
};
type SwrOpts<D = unknown, E = unknown> = {
    store: Store;
    fetcher: (key: string, { signal }: FetcherOpts) => Promise<unknown>;
    /** gets direct store references (don't mutate) */
    onSuccess: (key: string, res: D) => void;
    /** gets direct store references (don't mutate) */
    onError: (key: string, err: E) => void;
    /** gets direct references to response (don't mutate) */
    onSuccessDeduped: (key: string, res: D) => void;
    /** gets direct reference to response (don't mutate) */
    onErrorDeduped: (key: string, err: E) => void;
};
/**
 * data will be reconcile'd or produce'd,
 * if `undefined` is passed, data is deleted
 * */
type Mutator<D> = D | ((draft: D | undefined) => void) | undefined;
declare const useSwrContext: () => SwrOpts<unknown, unknown>;
declare const SwrProvider: (props: {
    value: Partial<SwrOpts>;
    children: JSX.Element;
}) => JSX.Element;
declare function createRevalidator(opts?: SwrOpts): <D, E>(key: string) => Promise<D | undefined>;
declare function createMutator(opts?: SwrOpts): <D, E>(key: string, mutator: Mutator<D>) => void;
declare function useSwr<D, E>(key: Accessor<string | undefined>, local?: Partial<SwrOpts<D, E>>): {
    mutate: (payload: Mutator<D>) => void | undefined;
    revalidate: () => Promise<D | undefined> | undefined;
    v: () => StoreItem<D, E>;
};

export { type FetcherOpts, type Mutator, Store, StoreItem, type SwrOpts, SwrProvider, createMutator, createRevalidator, useSwr, useSwrContext };
