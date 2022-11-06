import { isFunction, isObject, ShapeFlags } from "@vue/shared";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
  let instance = {
    vnode,
    props: {},
    attrs: {},
    slots: {},
    type: vnode.type,
    ctx: {},
    render: null,
    setupState: {}, // 如果 setup 返回一个对象，这个对象将作为 setupState
    isMounted: false, // 表示这个组件是否已经挂载
    // proxy:{}
  };
  instance.ctx = { _: instance };
  return instance;
}
export let currentInstance = null;
export let setCurrentInstance = (instance) => {
  currentInstance = instance;
};
export let getCurrentInstance = () => {
  // 在 setup 中获取当前实例
  return currentInstance;
};
export function setupComponent(instance) {
  const { children, props } = instance.vnode;
  // 根据 props 解析出 props 和 attrs，将其放到 instance 上
  instance.children = children; // 插槽解析
  instance.props = props; //initProps()

  // 需要先看下，当前组件是否有状态，函数组件

  let isStateful = instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
  if (isStateful) {
    // 表示现在是一个带状态的组件
    // 调用当前实例的 setup 方法，用 setup 方法返回值填充对应的 setupState 或 render 函数
    setupStateComponent(instance);
  }
}
function setupStateComponent(instance: any) {
  // TODO 代理
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
  // 2. 获取组件的类型，拿到组件的 setup方法
  let Component = instance.type;
  let { setup } = Component;
  if (setup) {
    currentInstance = instance;
    let setupContext = createSetupContext(instance);

    const setupResult = setup(instance.props, setupContext);
    currentInstance = null;
    handleSetupResult(instance, setupResult);
  } else {
    // 完成组件启动
    finishComponentSetup(instance);
  }

  Component.render();
}
function createSetupContext(instance: any) {
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: () => {},
    expose: () => {},
  };
}
function finishComponentSetup(instance: any) {
  let Component = instance.type;
  let { render } = Component;
  if (!render) {
    // 对 template 模板进行编译 ，产生 render 函数
    // instance.render = render; // 需要将生成的 render 放在实例上；
    if (!Component.render && Component.template) {
      // 编译将结果赋给 Component.render
    }
    instance.render = Component.render;
  }
  // 对 vue2.0 api 做了兼容
  // applyOptions
}
function handleSetupResult(instance, setupResult: any) {
  if (isFunction(setupResult)) {
    instance.render = setupResult;
  } else if (isObject(setupResult)) {
    instance.setupState = setupResult;
  }
  finishComponentSetup(instance);
}
