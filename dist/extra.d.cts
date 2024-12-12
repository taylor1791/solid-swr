import * as solid_js from 'solid-js';
import { JSX, Accessor } from 'solid-js';
import { SwrOpts, Mutator } from './index.cjs';
import { S as StoreItem } from './store-C2nP08AR.cjs';

type Fallback = {
    [key: string]: unknown;
};
type SwrFullOpts = {
    keepPreviousData: boolean;
    revalidateOnFocus: boolean;
    revalidateOnOnline: boolean;
    fallback: Fallback;
    refreshInterval: number;
};
declare const useSwrFullContext: () => SwrFullOpts;
declare const SwrFullProvider: (props: {
    children: JSX.Element;
    value: Partial<SwrFullOpts>;
}) => JSX.Element;
type GetKey<D> = (index: number, prev: D | undefined) => string | undefined;
declare function useMatchRevalidate(opts?: SwrOpts): (filter: (key: string) => boolean) => void;
declare function useMatchMutate(opts?: SwrOpts): <D>(filter: (key: string) => boolean, payload: Mutator<D>) => void;
declare function useSwrInfinite<D, E>(getKey: GetKey<D>, local?: Partial<SwrOpts<D, E>>): {
    index: Accessor<number>;
    setIndex: solid_js.Setter<number>;
    isLoading: Accessor<boolean>;
    data: Accessor<Accessor<StoreItem<D, E>>[]>;
    err: Accessor<E | undefined>;
};
declare function useSwrFull<D, E>(key: Accessor<string | undefined>, _opts?: Partial<SwrFullOpts & SwrOpts<D, E>>): {
    hasFetched: Accessor<boolean>;
    v: Accessor<StoreItem<D, E>>;
    mutate: (payload: Mutator<D>) => void | undefined;
    revalidate: () => Promise<D | undefined> | undefined;
};

export { type Fallback, type GetKey, type SwrFullOpts, SwrFullProvider, useMatchMutate, useMatchRevalidate, useSwrFull, useSwrFullContext, useSwrInfinite };
