import {
  hasChanged,
  hasOwn,
  isArray,
  isInterger,
  isObject,
} from "@vue/shared/dist/shared.esm-bundler.js";
import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operators";
import { reactive, readonly } from "./reactive";

const reactiveGet = createGetter();
const shallowGet = createGetter(false, true);
const readonlyGet = createGetter(true);
const readonlyShallowGet = createGetter(true, true);

const reactiveSet = createSetter();
const shallowSet = createSetter(true);

const readonlySet = (target, key) => {
  console.warn(`set on key ${key} of ${JSON.stringify(target)} faild!`);
};

// Reflect MDN 需要研究一下，之后  Object 上的方法会迁移到 Reflect 上。
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver); // target[key]
    if (!isReadonly) {
      // 收集依赖，等会数据变化后更新对应的视图
      console.log(`收集${JSON.stringify(key)}属性依赖`);
      // 触发的是 effect 依赖，说白了就是收集了 effect 方法，看看都有哪些 effect 方法里调用了这个对象的这个属性，把它记到闭包变量里
      track(target, TrackOpTypes.GET, key);
    }
    if (shallow) {
      return res;
    }
    // 这是一个特殊场景，就是在数据的长度改变后要做出响应的话，需要提前记录都有哪些 effect 方法中调用了这个数组的 length 属性；
    isArray(res) && track(res, TrackOpTypes.GET, "length");

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    return res;
  };
}

function createSetter(shallow = false) {
  return function set(target, key, value, receiver) {
    const oldValue = target[key];

    // 如果是数组，返回，是不是正常范围的索引值，否则就看某个对象里是否有某个属性
    const hadKey =
      isArray(target) && isInterger(key)
        ? Number(key) < target.length
        : hasOwn(target, key);

    const result = Reflect.set(target, key, value, receiver); // target[key]=value
    let type;

    // 如果数组里的元素变多了，或对象中新设置了一个属性，就是新加的响应
    if (!hadKey) {
      // 新增
      type = TriggerOpTypes.ADD;
    } else if (hasChanged(oldValue, value)) {
      // 修改
      type = TriggerOpTypes.UPDATE;
    }
    trigger(target, type, key, value, oldValue);
    return result;
  };
}

export const mutableHandlers = {
  get: reactiveGet,
  set: reactiveSet,
}; // 可变化对象的处理器
export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet,
}; // 浅响应对象的处理器
export const readonlyHandlers = {
  get: readonlyGet,
  set: readonlySet,
}; // 只读对象的处理器
export const shallowReadonlyHandlers = {
  get: readonlyShallowGet,
  set: readonlySet,
}; // 浅只读对象的处理器
