import { hasChanged, isArray, isObject } from "@vue/shared";
import "@vue/shared/src/common.css";

import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operators";
import { reactive } from "./reactive";

// ref 与 reactive的区别： reactive 内部采用 proxy，ref中内部使用的是 defineProperty
export function ref(value) {
  // 将普通类型，变成一个对象
  return createRef(value);
}

export function shallowRef(value) {
  return createRef(value, true);
}

const convert = (val) => (isObject(val) ? reactive(val) : val);
//
class RefImpl {
  public __v_isRef = true; // 产生的实例是一个 ref;
  public _value;
  //   private value;
  constructor(public rawValue, public shallow) {
    this._value = shallow ? rawValue : convert(reactive(rawValue));
    this.__v_isRef = true;
  }
  // babel 转化时，会将 get/set 转成 defineProperties

  get value() {
    track(this, TrackOpTypes.GET, "value");
    return this._value;
  }

  set value(newValue) {
    if (hasChanged(newValue, this.rawValue)) {
      this.rawValue = newValue;
      this._value = this.shallow ? newValue : convert(newValue);
    }
    trigger(this, TriggerOpTypes.UPDATE, "value", newValue);
  }
}

function createRef(rawValue, isShallow = false) {
  return new RefImpl(rawValue, isShallow);
}

class ObjectRefImpl {
  public __v_isRef = true;

  constructor(public target, public key) {}
  get value() {
    return this.target[this.key];
  }
  set value(newValue) {
    this.target[this.key] = newValue;
  }
}
/**
 * 使用场景1：
 * const obj=reactive({name:"gpd",age:34})
 * const {name}=obj;
 * effect(()=>{
 *  console.log(name)  // 这个时候不起作用，它是单纯的字符串
 * })
 * obj.name="gpd22";
 *
 * 改成
 *
 * const ref1=toRef(obj,"name");
 * effect(()=>{
 *  console.log(ref1.value) // 一直是从 obj上取"name"属性
 * })
 */

export function toRef(target, key) {
  return new ObjectRefImpl(target, key);
}

export function toRefs(target, keys = Object.keys(target)) {
  let result: any = {};
  if (isArray(target)) {
    result = [];
    result.length = target.length;
  }
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    let ref = toRef(target, key);
    result[key] = ref;
  }

  return result;
}
