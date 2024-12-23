import { isObject } from "@vue/shared";
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReactiveHandlers,
  shallowReadonlyHandlers,
} from "./handlers";

// 优化：利用缓存，将已经 proxy 过的对象不要再次进行 proxy，直接返回上次的 proxy 对象就好
const reactiveObjectsWeakMap = new WeakMap();
const readonlyObjectsWeakMap = new WeakMap();

function createReactiveObject(target, handler, isReadOnly?) {
  // 如果代理对象不是一个对象，就直接返回本身
  if (!isObject(target)) {
    return target;
  }

  const weakMap = isReadOnly ? readonlyObjectsWeakMap : reactiveObjectsWeakMap;

  let proxyObject = weakMap.get(target);
  if (proxyObject) {
    return proxyObject;
  }
  proxyObject = new Proxy(target, handler);
  return proxyObject;
}

export const reactive = function (target) {
  return createReactiveObject(target, mutableHandlers);
};
export const shallowReactive = function (target) {
  return createReactiveObject(target, shallowReactiveHandlers);
};
export const readonly = function (target) {
  return createReactiveObject(target, readonlyHandlers, true);
};
export const shallowReadonly = function (target) {
  return createReactiveObject(target, shallowReadonlyHandlers, true);
};
