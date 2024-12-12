"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extra.ts
var extra_exports = {};
__export(extra_exports, {
  SwrFullProvider: () => SwrFullProvider,
  useMatchMutate: () => useMatchMutate,
  useMatchRevalidate: () => useMatchRevalidate,
  useSwrFull: () => useSwrFull,
  useSwrFullContext: () => useSwrFullContext,
  useSwrInfinite: () => useSwrInfinite
});
module.exports = __toCommonJS(extra_exports);
var import_solid_js4 = require("solid-js");

// src/core.ts
var import_solid_js3 = require("solid-js");

// src/store.ts
var import_solid_js2 = require("solid-js");
var import_store = require("solid-js/store");

// src/utils.ts
var import_solid_js = require("solid-js");
function uFn(fn) {
  return (...params) => (0, import_solid_js.untrack)(() => fn(...params));
}
function runIfTruthy(acc, run) {
  const x = acc();
  if (!x) return;
  return run(x);
}
function noop() {
}
async function tryCatch(fn) {
  try {
    return [void 0, await fn()];
  } catch (err) {
    return [err];
  }
}
function useWinEvent(type, cb) {
  (0, import_solid_js.onMount)(() => {
    window.addEventListener(type, cb);
    (0, import_solid_js.onCleanup)(() => window.removeEventListener(type, cb));
  });
}

// src/store.ts
var defaultCache = {
  insert: noop,
  lookup: noop
};
var Store = class _Store {
  cache;
  store;
  setStore;
  boundDestroy;
  static defaultItem = {
    _mountedCount: 0,
    _exists: false,
    _isBusy: false,
    _onSuccess: 0,
    _onError: 0,
    isLoading: false,
    err: void 0,
    data: void 0
  };
  constructor(cache) {
    this.boundDestroy = this.destroy.bind(this);
    this.cache = defaultCache;
    if (cache) this.cache = cache;
    const [store, setStore] = (0, import_store.createStore)({});
    this.store = store;
    this.setStore = setStore;
  }
  keys() {
    return (0, import_solid_js2.untrack)(() => Object.keys(this.store));
  }
  updateDataProduce(key, producer) {
    (0, import_solid_js2.batch)(() => {
      (0, import_solid_js2.untrack)(() => this.makeExist(key));
      this.setStore(key, "data", (0, import_store.produce)(producer));
    });
  }
  update(key, partial) {
    const setData = "data" in partial;
    const data = partial.data;
    delete partial.data;
    (0, import_solid_js2.batch)(() => {
      (0, import_solid_js2.untrack)(() => this.makeExist(key));
      this.setStore(key, partial);
      if (setData) {
        this.setStore(key, "data", (0, import_store.reconcile)(data));
      }
    });
  }
  mount(key) {
    const n = (0, import_solid_js2.untrack)(() => this.lookupOrDef(key)._mountedCount + 1);
    this.update(key, { _mountedCount: n });
  }
  unmount(key) {
    const n = (0, import_solid_js2.untrack)(() => this.lookupOrDef(key)._mountedCount - 1);
    this.update(key, { _mountedCount: Math.max(n, 0) });
  }
  lookupOrDef(key) {
    const def = _Store.defaultItem;
    if (!key) return def;
    const already = this.lookup(key);
    return already || def;
  }
  lookup(key) {
    this.cache.lookup(key, this.boundDestroy);
    return this.store[key];
  }
  destroy(key) {
    this.setStore(key, void 0);
  }
  makeExist(key) {
    if (this.lookup(key)) return;
    this.cache.insert(key, this.boundDestroy);
    this.setStore(key, { ..._Store.defaultItem, _exists: true });
  }
};

// src/core.ts
var Context = (0, import_solid_js3.createContext)({
  store: new Store(),
  fetcher: () => Promise.reject(new Error("pass your own fetcher")),
  onSuccess: noop,
  onError: noop,
  onSuccessDeduped: noop,
  onErrorDeduped: noop
});
var useSwrContext = () => (0, import_solid_js3.useContext)(Context);
function createRevalidator(opts) {
  const ctx = opts || useSwrContext();
  return (key) => (
    // eslint-disable-next-line solid/reactivity
    (0, import_solid_js3.untrack)(async () => {
      const item = ctx.store.lookupOrDef(key);
      if (item._isBusy) return;
      const controller = new AbortController();
      if ((0, import_solid_js3.getOwner)()) {
        (0, import_solid_js3.onCleanup)(() => {
          ctx.store.update(key, { _isBusy: false });
          controller.abort();
        });
      }
      ctx.store.update(key, {
        err: void 0,
        _isBusy: true,
        isLoading: true
      });
      const [err, res] = await tryCatch(
        // eslint-disable-next-line solid/reactivity
        () => ctx.fetcher(key, { signal: controller.signal })
      );
      if (controller.signal.aborted && err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      (0, import_solid_js3.batch)(() => {
        ctx.store.update(key, { _isBusy: false, isLoading: false });
        const item2 = ctx.store.lookupOrDef(key);
        if (err) {
          ctx.store.update(key, { err, _onError: item2._onError + 1 });
          ctx.onErrorDeduped(key, err);
        } else {
          ctx.store.update(key, {
            data: res,
            _onSuccess: item2._onSuccess + 1
          });
          ctx.onSuccessDeduped(key, res);
        }
      });
      return res;
    })
  );
}
function createMutator(opts) {
  const ctx = opts || useSwrContext();
  return (key, mutator) => (0, import_solid_js3.untrack)(() => {
    if (mutator instanceof Function) {
      ctx.store.updateDataProduce(key, mutator);
    } else {
      ctx.store.update(key, { data: mutator });
    }
  });
}
function useSwr(key, local) {
  const ctx = (0, import_solid_js3.mergeProps)(useSwrContext(), local);
  const runWithKey = (fn) => runIfTruthy(key, fn);
  const revalidator = createRevalidator(ctx);
  const mutator = createMutator(ctx);
  const revalidate = () => runWithKey((k) => revalidator(k));
  const mutate = (payload) => runWithKey((k) => mutator(k, payload));
  (0, import_solid_js3.createEffect)(
    (0, import_solid_js3.on)(key, (k) => {
      if (!k) return;
      ctx.store.mount(k);
      (0, import_solid_js3.onCleanup)(() => ctx.store.unmount(k));
      void revalidator(k);
    })
  );
  (0, import_solid_js3.createEffect)(
    (0, import_solid_js3.on)(
      () => ctx.store.lookupOrDef(key())._onSuccess,
      (count) => {
        if (count === 0) return;
        runWithKey((k) => {
          ctx.onSuccess(k, ctx.store.lookupOrDef(k).data);
        });
      }
    )
  );
  (0, import_solid_js3.createEffect)(
    (0, import_solid_js3.on)(
      () => ctx.store.lookupOrDef(key())._onError,
      (count) => {
        if (count === 0) return;
        runWithKey((k) => {
          ctx.onError(k, ctx.store.lookupOrDef(k).err);
        });
      }
    )
  );
  return {
    mutate,
    revalidate,
    v: () => ctx.store.lookupOrDef(key())
  };
}

// src/extra.ts
var Context2 = (0, import_solid_js4.createContext)({
  keepPreviousData: false,
  revalidateOnFocus: true,
  revalidateOnOnline: true,
  fallback: {},
  refreshInterval: 0
});
var useSwrFullContext = () => (0, import_solid_js4.useContext)(Context2);
var SwrFullProvider = (props) => {
  const value = (0, import_solid_js4.mergeProps)(useSwrFullContext(), props.value);
  return (0, import_solid_js4.createComponent)(Context2.Provider, {
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
    (0, import_solid_js4.batch)(() => {
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
    (0, import_solid_js4.batch)(() => {
      const keys = ctx.store.keys().filter(filter);
      for (const key of keys) {
        mutator(key, payload);
      }
    });
  };
  return uFn(mutate);
}
function useSwrInfinite(getKey, local) {
  const [data, setData] = (0, import_solid_js4.createSignal)([]);
  const [err, setErr] = (0, import_solid_js4.createSignal)();
  const [isLoading, setIsLoading] = (0, import_solid_js4.createSignal)(false);
  const [index, setIndex] = (0, import_solid_js4.createSignal)(0);
  const ctx = (0, import_solid_js4.mergeProps)(useSwrContext(), local);
  (0, import_solid_js4.createEffect)(
    (0, import_solid_js4.on)(index, (index2) => {
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
  const ctx = (0, import_solid_js4.mergeProps)(useSwrContext(), useSwrFullContext(), _opts);
  const [lazyKey, setLazyKey] = (0, import_solid_js4.createSignal)("");
  const core = useSwr(key, ctx);
  const [hasFetched, setHasFetched] = (0, import_solid_js4.createSignal)(false);
  setHasFetched((0, import_solid_js4.untrack)(() => !!core.v().data));
  (0, import_solid_js4.createEffect)(() => {
    if (ctx.refreshInterval <= 0) return;
    const interval = setInterval(core.revalidate, ctx.refreshInterval);
    (0, import_solid_js4.onCleanup)(() => clearInterval(interval));
  });
  (0, import_solid_js4.createEffect)(() => {
    if (!ctx.revalidateOnFocus) return;
    useWinEvent("focus", core.revalidate);
  });
  (0, import_solid_js4.createEffect)(() => {
    if (!ctx.revalidateOnOnline) return;
    useWinEvent("online", core.revalidate);
  });
  (0, import_solid_js4.createEffect)(() => {
    if (core.v().data || core.v().err) setHasFetched(true);
  });
  (0, import_solid_js4.createEffect)(() => {
    const k = key();
    if (ctx.keepPreviousData && core.v().data && k) setLazyKey(k);
  });
  const v = (0, import_solid_js4.createMemo)(() => {
    const item = ctx.store.lookupOrDef(key());
    const lazy = ctx.store.lookupOrDef(lazyKey());
    const keepPrev = ctx.keepPreviousData;
    return (0, import_solid_js4.untrack)(() => {
      let data = item.data;
      if (keepPrev && lazy.data) data = lazy.data;
      const fallback = key() ? ctx.fallback[key()] : void 0;
      return (0, import_solid_js4.mergeProps)(item, { data: data || fallback });
    });
  });
  return {
    ...core,
    hasFetched,
    v
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SwrFullProvider,
  useMatchMutate,
  useMatchRevalidate,
  useSwrFull,
  useSwrFullContext,
  useSwrInfinite
});
