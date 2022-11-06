import { createApp } from "@vue/runtime-dom";
import { createVNode } from "./vnode";

export function createAppAPI(render) {
  return {
    createApp: (rootComponent, rootProps) => {
      //告诉他那个组件那个属性来创建的应用
      const app = {
        _props: rootProps,
        _component: rootComponent,
        _container: null,
        mount(container) {
          //挂载的目的地
          // let vnode = {};
          // render(vnode, container);
          // 1. 根据组件创建虚拟节点
          // 2.将虚拟节点和容器获取到后调用 render 方法进行渲染
          // 创造虚拟节点
          const vnode = createVNode(rootComponent, rootProps);
          // 调用 render 方法
          render(vnode, container);
          app._container = container;
        },
      };
      return app;
    },
  };
}
