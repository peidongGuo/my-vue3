// runtime-dom 核心就是 提供 domAPI 方法了
// 操作节点、操作属性的更新

import { createRender } from "packages/runtime-core/src/render";
import { extend } from "@vue/shared";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";

// 节点操作就是增删改查
// 属性操作也是增删改查 （样式 类 事件 其他属性）

const renderOptions = extend({ patchProp }, nodeOps);

console.log(renderOptions);
// vue 中 runtime-core 提供了核心的方法，用来处理渲染的，它会使用 runtime-dom 中的api 进行渲染
export function createApp(rootComponent, rootProps = null) {
  const app: any = createRender(renderOptions).createApp(
    rootComponent,
    rootProps
  );
  let { mount } = app;
  app.mount = function (container) {
    // 清空容器的工作
    container = nodeOps.querySelector(container);
    container.innerHTML = "";

    // 将组件渲染成dom元素，进行挂载
    mount(container);
  };
  return app;
}
export * from "@vue/runtime-core";
export { renderOptions };
