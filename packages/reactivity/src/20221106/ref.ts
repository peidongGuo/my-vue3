import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "../operators";
import { reactive } from "./reactive";

class RefImpl {
  _is_V_Ref: true;
  _value;
  constructor(value) {
    this._value = value;
  }

  get value() {
    track(this, "value", TrackOpTypes.GET);
    return this._value;
  }

  set value(newValue) {
    trigger(this, "value", TriggerOpTypes.UPDATE);
    this._value = newValue;
  }
}

export function ref(value) {
  return new RefImpl(value);
}

class ObjectRefImpl {
  constructor(public target, public key) {}

  get value() {
    return this.target[this.key];
  }

  set value(newValue) {
    this.target[this.key] = newValue;
  }
}

export function toRef(reactive, key) {
  return new ObjectRefImpl(reactive, key);
}

export function toRefs(reactive) {
  let result;
  for (const iterator of reactive) {
    result[iterator] = new ObjectRefImpl(reactive, iterator);
  }
  return result;
}

export function shallowRef(reactive) {}
