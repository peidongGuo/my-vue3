import { currentInstance, setCurrentInstance } from "./component";

const enum LifeCycleHooks {
  BEFORE_MOUNT = "bm",
  MOUNTED = "m",
  BEFORE_UPDATE = "bu",
  UPDATED = "u",
}

const injectHook = (type, hook, target) => {
  //
  if (!target) {
    return console.warn("钩子不能在组件外使用");
  } else {
    const hooks = target[type] || (target[type] = []);
    const wrap = () => {
      setCurrentInstance(target);
      hook.call(target);
      setCurrentInstance(null);
    };
    hooks.push(wrap);
  }
};

// target 用来表示他是哪个实例的钩子
const createHook =
  (lifeCycle) =>
  (hook, target = currentInstance) => {
    // 给当前实例增加对应的生命周期即可
    injectHook(lifeCycle, hook, target);
  };

export const invokeArrayFns = (fns) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i]();
  }
};

export const onBeforeMount = createHook(LifeCycleHooks.BEFORE_MOUNT);
export const onMounted = createHook(LifeCycleHooks.MOUNTED);
export const onBeforeUpdate = createHook(LifeCycleHooks.BEFORE_UPDATE);
export const onUpdated = createHook(LifeCycleHooks.UPDATED);

const onBeforeMount2 = (hook, target) => {
  let type = "bm";
  if (!target) {
    return console.warn("钩子不能在组件外使用");
  } else {
    const hooks = target[type] || (target[type] = []);
    const wrap = () => {
      setCurrentInstance(target);
      hook.call(target);
      setCurrentInstance(null);
    };
    hooks.push(wrap);
  }
};
