import { isObject } from "@vue/shared/dist/shared.esm-bundler.js";
import {
  mutableHandlers,
  shallowReactiveHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./handlers";

export function reactive(target) {
  return createReactiveObject(target, false, mutableHandlers);
}

export function shallowReactive(target) {
  return createReactiveObject(target, false, shallowReactiveHandlers);
}

export function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers);
}

export function shallowReadonly(target) {
  return createReactiveObject(target, true, shallowReadonlyHandlers);
}

// 柯里化  new Proxy() 最核心拦截 getter setter
const reactiveMap = new WeakMap(); // 会自动垃圾回收，不会千百万内存泄漏，存储的key只能是对象
const readonlyMap = new WeakMap();
export function createReactiveObject(
  target: any,
  isReadonly: boolean,
  handlers: any
) {
  // 如果 target 不是一个对象，就直接返回
  if (!isObject(target)) {
    return target;
  }
  // 做代理
  const proxyMap = isReadonly ? readonlyMap : reactiveMap;

  const existProxy = proxyMap.get(target);
  if (existProxy) {
    return existProxy;
  }

  const proxy = new Proxy(target, handlers);
  proxyMap.set(target, proxy);

  return proxy;
}
