// src/utils.ts
import { onCleanup, onMount, untrack } from "solid-js";
function uFn(fn) {
  return (...params) => untrack(() => fn(...params));
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
  onMount(() => {
    window.addEventListener(type, cb);
    onCleanup(() => window.removeEventListener(type, cb));
  });
}

// src/store.ts
import { batch, untrack as untrack2 } from "solid-js";
import { createStore, produce, reconcile } from "solid-js/store";
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
    const [store, setStore] = createStore({});
    this.store = store;
    this.setStore = setStore;
  }
  keys() {
    return untrack2(() => Object.keys(this.store));
  }
  updateDataProduce(key, producer) {
    batch(() => {
      untrack2(() => this.makeExist(key));
      this.setStore(key, "data", produce(producer));
    });
  }
  update(key, partial) {
    const setData = "data" in partial;
    const data = partial.data;
    delete partial.data;
    batch(() => {
      untrack2(() => this.makeExist(key));
      this.setStore(key, partial);
      if (setData) {
        this.setStore(key, "data", reconcile(data));
      }
    });
  }
  mount(key) {
    const n = untrack2(() => this.lookupOrDef(key)._mountedCount + 1);
    this.update(key, { _mountedCount: n });
  }
  unmount(key) {
    const n = untrack2(() => this.lookupOrDef(key)._mountedCount - 1);
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
import {
  batch as batch2,
  createComponent,
  createContext,
  createEffect,
  getOwner,
  mergeProps,
  on,
  onCleanup as onCleanup2,
  untrack as untrack3,
  useContext
} from "solid-js";
var Context = createContext({
  store: new Store(),
  fetcher: () => Promise.reject(new Error("pass your own fetcher")),
  onSuccess: noop,
  onError: noop,
  onSuccessDeduped: noop,
  onErrorDeduped: noop
});
var useSwrContext = () => useContext(Context);
var SwrProvider = (props) => {
  const value = mergeProps(useSwrContext(), props.value);
  return createComponent(Context.Provider, {
    value,
    get children() {
      return props.children;
    }
  });
};
function createRevalidator(opts) {
  const ctx = opts || useSwrContext();
  return (key) => (
    // eslint-disable-next-line solid/reactivity
    untrack3(async () => {
      const item = ctx.store.lookupOrDef(key);
      if (item._isBusy) return;
      const controller = new AbortController();
      if (getOwner()) {
        onCleanup2(() => {
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
      batch2(() => {
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
  return (key, mutator) => untrack3(() => {
    if (mutator instanceof Function) {
      ctx.store.updateDataProduce(key, mutator);
    } else {
      ctx.store.update(key, { data: mutator });
    }
  });
}
function useSwr(key, local) {
  const ctx = mergeProps(useSwrContext(), local);
  const runWithKey = (fn) => runIfTruthy(key, fn);
  const revalidator = createRevalidator(ctx);
  const mutator = createMutator(ctx);
  const revalidate = () => runWithKey((k) => revalidator(k));
  const mutate = (payload) => runWithKey((k) => mutator(k, payload));
  createEffect(
    on(key, (k) => {
      if (!k) return;
      ctx.store.mount(k);
      onCleanup2(() => ctx.store.unmount(k));
      void revalidator(k);
    })
  );
  createEffect(
    on(
      () => ctx.store.lookupOrDef(key())._onSuccess,
      (count) => {
        if (count === 0) return;
        runWithKey((k) => {
          ctx.onSuccess(k, ctx.store.lookupOrDef(k).data);
        });
      }
    )
  );
  createEffect(
    on(
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

export {
  uFn,
  useWinEvent,
  Store,
  useSwrContext,
  SwrProvider,
  createRevalidator,
  createMutator,
  useSwr
};
