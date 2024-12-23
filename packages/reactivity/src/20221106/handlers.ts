import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "../operators";
import { isArray, isObject } from "@vue/shared";
import { reactive, readonly } from "../reactive";

function createSetter(isShallow?, isReadOnly?) {
  return function setter(target, key, newValue) {
    if (isReadOnly) {
      console.warn("对象只能读不能修改！");
      return;
    }
    target[key] = newValue;
    trigger(target, key, TriggerOpTypes.UPDATE);
    return target[key];
  };
}

function createGetter(isShallow?, isReadOnly?) {
  return function getter(target, key, receiver) {
    // let keyValue = target[key];
    let keyValue = Reflect.get(target, key, receiver);

    if (!isReadOnly) {
      track(target, key, TrackOpTypes.GET);
    }

    if (isShallow) {
      return keyValue;
    }

    isArray(keyValue) && track(target[key], "length", TrackOpTypes.GET);

    // 如果 keyValue 还是一个对象的话，如果是深层响应，就需要将 keyValue 也代理一下。
    if (isObject(keyValue)) {
      return isReadOnly ? readonly(keyValue) : reactive(keyValue);
    }

    return keyValue;
  };
}

export const mutableHandlers = {
  get: createGetter(),
  set: createSetter(),
};
export const shallowReactiveHandlers = {
  get: createGetter(true),
  set: createSetter(true),
};
export const readonlyHandlers = {
  get: createGetter(false, true),
  set: createSetter(false, true),
};
export const shallowReadonlyHandlers = {
  get: createGetter(true, true),
  set: createSetter(true, true),
};
