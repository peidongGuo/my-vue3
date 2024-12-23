import { isFunction, isObject } from "@vue/shared";
import { setTextRange } from "typescript";
import { effect } from "./effect";

class ComputedRefImpl {
  private _value;
  private _effect;
  private _dirty;
  constructor(public getter, public setter) {
    this._effect = effect(() => getter, {
      lazy: true,
      schduler: () => {
        if (!this._dirty) {
          this._dirty = true;
        }
      },
    });
  }

  get value() {
    if (this._dirty) {
      this._value = this._effect();
      this._dirty = false;
    }
    return this._value;
  }

  set value(newValue) {
    this.setter(newValue);
  }
}

export function computed(getterOrOptions) {
  let getter, setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
  }
  if (isObject(getterOrOptions)) {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}
