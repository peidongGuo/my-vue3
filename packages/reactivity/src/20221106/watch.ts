import { hasChanged, isArray, isFunction } from "@vue/shared";
import { effect } from "../effect";
import { toRef } from "../ref";

function doWatch(source, cb, options) {
  let prevValue, currentValue;

  const scheduler = () => {
    if (cb) {
      currentValue = runner();
      if (hasChanged(prevValue, currentValue)) {
        cb(currentValue, prevValue);
        prevValue = currentValue;
      }
    } else {
    }
  };

  const runner = effect(
    () => {
      source();
    },
    {
      lazy: true,
      scheduler,
    }
  );

  prevValue = runner();
  return prevValue.stop;
}

export function watch(source, cb, options) {
  return doWatch(source, cb, options);

  //   if (isReactive(sources)) {
  //     sources = ref(sources);
  //     prevValue = sources.value;
  //     effect(() => {
  //       currentValue = sources.value;
  //       callbacks(currentValue, prevValue);
  //       prevValue = currentValue;
  //     }, options);
  //   }

  //   if (isRef(sources)) {
  //     prevValue = sources.value;
  //     effect(() => {
  //       currentValue = sources.value;
  //       callbacks(currentValue, prevValue);
  //       prevValue = currentValue;
  //     }, options);
  //   }

  //   if (isFunction(prevValue)) {
  //     // ...
  //     prevValue = sources();
  //     effect(() => {
  //       currentValue = sources();
  //       callbacks(currentValue, prevValue);
  //       prevValue = currentValue;
  //     }, options);
  //   }

  //   if (isArray(prevValue)) {
  //     // ...
  //     prevValue = sources();
  //     effect(() => {
  //       currentValue = sources();
  //       callbacks(currentValue, prevValue);
  //       prevValue = currentValue;
  //     }, options);
  //   }
}

export function watchEffect(source, options) {
  return doWatch(source, null, options);
}
