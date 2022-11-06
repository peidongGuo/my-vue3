import { isArray, isInterger } from "@vue/shared/dist/shared.esm-bundler.js";
import { TrackOpTypes, TriggerOpTypes } from "./operators";

export function effect(fn, options: any = {}) {
  const effect = createReactiveEffect(fn, options);

  if (!options.lazy) {
    effect();
  }

  return effect;
}

let uid = 0;
let activeEffect; // 当前的 effect
const effectStack = [];
function createReactiveEffect(fn: any, options: any) {
  const effect = function reactiveEffect() {
    if (!effectStack.includes(effect)) {
      try {
        effectStack.push(effect);
        activeEffect = effect;
        return fn();
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };
  effect.id = uid++; // 制作一个effect标识，用于区分 effect
  effect._isEffect = true; //用于标识这个是响应式 effect
  effect.raw = fn; // 保留原函数
  effect.options = options; // 保存 effct 上的配置

  return effect;
}

// weakMap target=>  name=>set
const targetMap = new WeakMap();
export function track(target: any, type: TrackOpTypes, key: any) {
  if (type === TrackOpTypes.GET) {
    if (activeEffect === undefined) {
      return;
    }

    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }
    let depMap = depsMap.get(key);
    if (!depMap) {
      depsMap.set(key, (depMap = new Set()));
    }
    if (!depMap.has(activeEffect)) depMap.add(activeEffect);
  }
}

/**
 * 设置值时做的触发
 * @param target
 * @param type
 * @param key
 * @param newValue
 * @param oldValue
 * @returns
 */
export function trigger(
  target: any,
  type: TriggerOpTypes,
  key: any,
  newValue?,
  oldValue?
) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const effects = new Set();
  function addEffect(key) {
    let depMap = depsMap.get(key);
    if (depMap) {
      for (const effect of depMap) {
        effects.add(effect);
      }
    }
  }

  // 场景一：对象属性修改,数组索引值修改
  addEffect(key);

  // 场景二：数组长度修改  长度会有问题， 长度1 转 长度3，或者长度3 转 长度1这种场景是没有考虑到的。
  if (isArray(target) && type === TriggerOpTypes.ADD && isInterger(key)) {
    addEffect("length");
  }

  // if (key === "length" && isArray(target)) {
  //   depsMap.forEach((dep, key) => {
  //     if (key === "length" || key > newValue) {
  //       addEffect(dep);
  //     }
  //   });
  // } else {
  //   if (key !== undefined) {
  //     addEffect(depsMap.get(key));
  //   }
  //   switch (type) {
  //     case TriggerOpTypes.ADD:
  //       if (isArray(target) && isInterger(key)) {
  //         addEffect(depsMap.get("length"));
  //       }
  //       break;
  //   }
  // }

  effects.forEach((effect: any) => {
    if (effect.options.scheduler) {
      effect.options.scheduler(effect);
    } else {
      effect();
    }
  });
}
