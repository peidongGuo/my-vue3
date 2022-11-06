import { isArray, isObject } from "@vue/shared";
import { createVNode, isVnode } from "./vnode";

export function h(type, propsOrChildren, children) {
  const l = arguments.length; // 儿子节点为要么是字符串，要么是个数组，针对的是 createVnode
  if (l == 2) {
    // 类型+属性、 类型+孩子
    // 如果是数组，就直接是孩子
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // 判断一下 propsOrChildren 是不是属性
      if (isVnode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      return createVNode(type, propsOrChildren);
    } else {
      // 如果第二个参数不是对象，那一定是孩子
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVnode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}
