// 1. 给元素缓存一个绑定事件的列表
// 2. 如果缓存中没有缓存过，而且 value 有值，需要绑定方法，并且缓存起来
// 3. 以前绑定过需要删除掉，删除缓存
// 4. 如果前后都有，直接改变 invoker 中 value 属性指向最新的事件即可
export const patchEvent = (el, key, value) => {
  // 对函数进行缓存，之后可以进行移除等操作；机制类似于vue 指令，删除和添加；
  const invokers = el._vei || (el._vei = {});

  const exists = invokers[key];
  if (value && exists) {
    // 需要绑定事件，而且事件已经存在的情况
    exists.value = value;
  } else {
    const eventName = key.slice(2).toLowerCase();
    if (value) {
      // 调用绑定事件，以前没有绑定过
      let invoker = (invokers[key] = createInvoker(value));
      el.addEventListener(eventName, invoker);
    } else {
      // 以前绑定了，当时没有 value 需要移除
      el.removeEventListener(eventName, exists);
      invokers[key] = undefined;
    }
  }
};

function createInvoker(value) {
  const invoker = (e) => {
    invoker.value(e);
  };
  invoker.value = value; // 为了方便改值
  return invoker;
}
