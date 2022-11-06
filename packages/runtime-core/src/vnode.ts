import { isArray, isObject, isString, ShapeFlags } from "@vue/shared";
export function isVnode(vnode) {
  return vnode._v_isVnode;
}
// h('div');  h方法和 createApp 类似
export const createVNode = (type, props, children = null) => {
  // 可以根据 type 来区分是组件还是普通的元素
  //根据 type 来区分是元素还是组件

  //给虚拟节点加一个类型
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;
  const vnode = {
    // 一个对象来描述对应的内容，虚拟节点有跨平台的能力
    _v_isVnode: true, // 这是个虚拟节点
    type,
    props,
    children,
    component: null,
    el: null, // 稍后将虚拟节点和真实节点对应起来
    key: props && props.key, // 用来做 diff 算法
    shapeFlag,
  };

  //
  normalizeChildren(vnode, children);

  return vnode;
};
function normalizeChildren(
  vnode: {
    // 一个对象来描述对应的内容，虚拟节点有跨平台的能力
    _v_isVnode: boolean; // 这是个虚拟节点
    type: any;
    props: any;
    component: null;
    children: any;
    el: any; // 稍后将虚拟节点和真实节点对应起来
    key: any; // 用来做 diff 算法
    shapeFlag: number | ShapeFlags;
  },
  children: any
) {
  let type = 0;
  if (children == null) {
    // 不对儿子进行处理
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else {
    type = ShapeFlags.TEXT_CHILDREN;
  }
  vnode.shapeFlag |= type;
}
export const TEXT = Symbol("Text");
export function normalizeVnode(element) {
  if (isObject(element)) {
    return element;
  }
  return createVNode(TEXT, null, String(element));
}
