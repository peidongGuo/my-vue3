import { isFunction } from "@vue/shared/dist/shared.esm-bundler.js";
import { track, effect } from "./effect";

class ComputedRefImpl {
  public _dirty = true; // 默认取值时不要用缓存
  public _value;
  public effect;
  constructor(getter, public setter) {
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        if (!this._dirty) {
          this._dirty = true;
        }
      },
    });
  }

  get value() {
    if (this._dirty) {
      this._value = this.effect();
      this._dirty = false;
    }
    return this._value;
  }

  set value(newValue) {
    this.setter(newValue);
  }
}

export function computed(getterOrOptions) {
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {
      console.warn("");
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter);
}
