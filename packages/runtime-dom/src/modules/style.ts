// 为什么 style 不能直接重新赋值，因为它初始赋值时是个对象？？
export const patchStyle = (el, prevValue, nextValue) => {
  const style = el.style;
  if (nextValue === null) {
    el.removeAttribute("style");
  }
  // 老的里新的有没有
  if (prevValue) {
    for (const key in prevValue) {
      if (Object.prototype.hasOwnProperty.call(prevValue, key)) {
        if (!nextValue[key]) {
          style[key] = "";
        }
      }
    }
  }

  //新的里面需要赋值到 style 上
  for (const key in nextValue) {
    if (Object.prototype.hasOwnProperty.call(nextValue, key)) {
      style[key] = nextValue[key];
    }
  }
};
