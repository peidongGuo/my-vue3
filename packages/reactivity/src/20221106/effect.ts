const effectStack = [];
let activeEffect;
let uuid = 0;

const effectsWeakMap = new WeakMap();

export function effect(fn, options?) {
  let effectObject: any = function () {
    try {
      effectStack.push(effectObject);
      activeEffect = effectObject;
      fn();
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1];
    }
  };
  effectObject.stop = () => {
    // 从 effect 执行栈中将其移除
    // effectObject.remove(effectObject);
    // 从 effectsWeakMap 中将和它有关系的 target、key 进行移除
    // effectsWeakMap.clearUp(effectObject);
  };
  effectObject.id = uuid++;
  effectObject.raw = fn;
  effectObject.options = options;

  effectObject();

  return effectObject;
}

export function track(target, key, type) {
  let targetMap = effectsWeakMap.get(target);
  if (!targetMap) {
    targetMap = new Map();
    effectsWeakMap.set(target, targetMap);
  }
  let keyEffects = targetMap.get(key);
  if (keyEffects) {
    keyEffects.push(activeEffect);
  } else {
    keyEffects = [activeEffect];
  }
  targetMap.set(key, keyEffects);
}

export function trigger(target, key, type) {
  let targetMap = effectsWeakMap.get(target);
  if (!targetMap) {
    return;
  }
  let keyEffects = targetMap.get(key);
  if (!keyEffects) {
    return;
  }
  keyEffects.forEach((effect) => {
    effect();
  });
}
