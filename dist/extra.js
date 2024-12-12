import {
  createMutator,
  createRevalidator,
  uFn,
  useSwr,
  useSwrContext,
  useWinEvent
} from "./chunk-DZDTB73T.js";

// src/extra.ts
import {
  batch,
  createComponent,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  untrack,
  useContext
} from "solid-js";
var Context = createContext({
  keepPreviousData: false,
  revalidateOnFocus: true,
  revalidateOnOnline: true,
  fallback: {},
  refreshInterval: 0
});
var useSwrFullContext = () => useContext(Context);
var SwrFullProvider = (props) => {
  const value = mergeProps(useSwrFullContext(), props.value);
  return createComponent(Context.Provider, {
    value,
    get children() {
      return props.children;
    }
  });
};
function useMatchRevalidate(opts) {
  const ctx = opts || useSwrContext();
  const revalidator = createRevalidator(ctx);
  const revalidate = (filter) => {
    batch(() => {
      const keys = ctx.store.keys().filter(filter).filter((x) => ctx.store.lookupOrDef(x)._mountedCount > 0);
      for (const key of keys) {
        void revalidator(key);
      }
    });
  };
  return uFn(revalidate);
}
function useMatchMutate(opts) {
  const ctx = opts || useSwrContext();
  const mutator = createMutator(ctx);
  const mutate = (filter, payload) => {
    batch(() => {
      const keys = ctx.store.keys().filter(filter);
      for (const key of keys) {
        mutator(key, payload);
      }
    });
  };
  return uFn(mutate);
}
function useSwrInfinite(getKey, local) {
  const [data, setData] = createSignal([]);
  const [err, setErr] = createSignal();
  const [isLoading, setIsLoading] = createSignal(false);
  const [index, setIndex] = createSignal(0);
  const ctx = mergeProps(useSwrContext(), local);
  createEffect(
    on(index, (index2) => {
      const key = getKey(index2, data().at(-1)?.().data);
      if (!key) return;
      setIsLoading(true);
      setErr(void 0);
      useSwr(() => key, {
        ...local,
        onSuccess: () => {
          setIsLoading(false);
          setData((prev) => {
            prev = [...prev];
            prev[index2] = () => ctx.store.lookupOrDef(key);
            return prev;
          });
        },
        onError: (_, err2) => {
          setIsLoading(false);
          setErr(() => err2);
        }
      });
    })
  );
  return {
    index,
    setIndex,
    isLoading,
    data,
    err
  };
}
function useSwrFull(key, _opts) {
  const ctx = mergeProps(useSwrContext(), useSwrFullContext(), _opts);
  const [lazyKey, setLazyKey] = createSignal("");
  const core = useSwr(key, ctx);
  const [hasFetched, setHasFetched] = createSignal(false);
  setHasFetched(untrack(() => !!core.v().data));
  createEffect(() => {
    if (ctx.refreshInterval <= 0) return;
    const interval = setInterval(core.revalidate, ctx.refreshInterval);
    onCleanup(() => clearInterval(interval));
  });
  createEffect(() => {
    if (!ctx.revalidateOnFocus) return;
    useWinEvent("focus", core.revalidate);
  });
  createEffect(() => {
    if (!ctx.revalidateOnOnline) return;
    useWinEvent("online", core.revalidate);
  });
  createEffect(() => {
    if (core.v().data || core.v().err) setHasFetched(true);
  });
  createEffect(() => {
    const k = key();
    if (ctx.keepPreviousData && core.v().data && k) setLazyKey(k);
  });
  const v = createMemo(() => {
    const item = ctx.store.lookupOrDef(key());
    const lazy = ctx.store.lookupOrDef(lazyKey());
    const keepPrev = ctx.keepPreviousData;
    return untrack(() => {
      let data = item.data;
      if (keepPrev && lazy.data) data = lazy.data;
      const fallback = key() ? ctx.fallback[key()] : void 0;
      return mergeProps(item, { data: data || fallback });
    });
  });
  return {
    ...core,
    hasFetched,
    v
  };
}
export {
  SwrFullProvider,
  useMatchMutate,
  useMatchRevalidate,
  useSwrFull,
  useSwrFullContext,
  useSwrInfinite
};
