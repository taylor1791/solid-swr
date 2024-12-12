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

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Store: () => Store,
  SwrProvider: () => SwrProvider,
  createMutator: () => createMutator,
  createRevalidator: () => createRevalidator,
  useSwr: () => useSwr,
  useSwrContext: () => useSwrContext
});
module.exports = __toCommonJS(src_exports);

// src/core.ts
var import_solid_js3 = require("solid-js");

// src/store.ts
var import_solid_js2 = require("solid-js");
var import_store = require("solid-js/store");

// src/utils.ts
var import_solid_js = require("solid-js");
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
var SwrProvider = (props) => {
  const value = (0, import_solid_js3.mergeProps)(useSwrContext(), props.value);
  return (0, import_solid_js3.createComponent)(Context.Provider, {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Store,
  SwrProvider,
  createMutator,
  createRevalidator,
  useSwr,
  useSwrContext
});
