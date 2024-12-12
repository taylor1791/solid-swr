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

// src/cache.ts
var cache_exports = {};
__export(cache_exports, {
  LRU: () => LRU,
  createCache: () => createCache
});
module.exports = __toCommonJS(cache_exports);

// src/lru.ts
var LRU = class {
  lookup;
  reverseLookup;
  capacity;
  length;
  head;
  tail;
  constructor(capacity = 500) {
    this.capacity = capacity;
    this.lookup = /* @__PURE__ */ new Map();
    this.reverseLookup = /* @__PURE__ */ new Map();
    this.length = 0;
    this.head = void 0;
    this.tail = void 0;
  }
  /** if the value is an object this returns a direct reference */
  get(key) {
    const node = this.lookup.get(key);
    if (!node) return void 0;
    this.detach(node);
    this.prepend(node);
    return node.value;
  }
  set(key, value, onTrim) {
    let node = this.lookup.get(key);
    if (!node) {
      node = { value };
      this.length++;
      this.prepend(node);
      this.trimCache(onTrim);
      this.lookup.set(key, node);
      this.reverseLookup.set(node, key);
    } else {
      this.detach(node);
      this.prepend(node);
      node.value = value;
    }
  }
  keys() {
    return Array.from(this.lookup.keys());
  }
  trimCache(onTrim) {
    if (this.length <= this.capacity) return;
    const tail = this.tail;
    this.detach(tail);
    const key = this.reverseLookup.get(tail);
    this.lookup.delete(key);
    this.reverseLookup.delete(tail);
    onTrim?.(key);
  }
  detach(node) {
    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }
    if (this.head === node) {
      this.head = this.head.next;
    }
    if (this.tail === node) {
      this.tail = this.tail.prev;
    }
    node.next = void 0;
    node.prev = void 0;
  }
  prepend(node) {
    if (!this.head) {
      this.head = node;
      this.tail = node;
      return;
    }
    node.next = this.head;
    this.head.prev = node;
    this.head = node;
  }
};

// src/cache.ts
var createCache = (lru) => ({
  lookup: (key) => !!lru.get(key),
  insert: (key, onTrim) => lru.set(key, true, onTrim)
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LRU,
  createCache
});
