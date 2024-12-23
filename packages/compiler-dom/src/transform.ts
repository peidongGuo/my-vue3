import { NodeTypes } from ".";
import {
  CREATE_TEXT,
  TO_DISPLAY_STRING,
  CREATE_VNODE,
  OPEN_BLOCK,
  CREATE_BLOCK,
  FRAGMENT,
} from "./helpers";
import { PatchFlags } from "./patchFlags";

/**
 * 转换 ast 树。
 * @description 为的是获得一个更容易生成代码的 ast 树。对动态节点做一些标记：指令、插槽、事件、属性... patchFlags
 * Block 是为了收集动态节点  dynamicChildren 将树的递归扳平成一个数组，这样比树型递归 diff 性能会更好。
 * createVnode 时，会判断这个节点为是动态的，就让外层的 Block 将其收集起来
 * @param root
 * @param nodeTransforms
 */
export function transform(root, nodeTransforms) {
  const context = createTransformContext(root, nodeTransforms);
  traverseNode(root, context);
  createRootCodegen(root, context);
  root.helpers = [...context.helpers]; // context 的属性
}

function isText(node) {
  return node.type === NodeTypes.INTERPOLATION || node.type == NodeTypes.TEXT;
}

/**
 * 转换元素
 * @param node
 * @param context
 * @returns
 */
function transformElement(node, context) {
  // 希望在整个树处理完毕后，再处理元素
  if (node.type != 1) {
    // 此节点是元素
    return;
  }
  console.log("处理元素节点");
  return () => {
    // 退出函数 洋葱模型
    // createVNode("h1",{},"hello world") 向 helper 中添加一个 createVNode
    const { tag, children } = node;
    console.log(tag);
    let vnodeTag = `'${tag}'`;
    let vnodeProps;
    let vnodePatchFlag;
    let vnodeChildren; // 处理好的儿子
    let patchFlag; // 用于标记这个标签是不是动态的
    if (children.length > 0) {
      if (children.length == 1) {
        const child = children[0];
        const type = child.type;
        const hasDynamicTextChild =
          type === NodeTypes.INTERPOLATION ||
          type === NodeTypes.COMPOUND_EXPRESSION;
        if (hasDynamicTextChild) {
          patchFlag |= PatchFlags.TEXT;
        }
        vnodeChildren = child;
      } else {
        vnodeChildren = children; // 多个儿子不用处理
      }
    }

    if (patchFlag !== 0) {
      vnodePatchFlag = patchFlag + "";
    }
    node.codegenNode = createVNodeCall(
      context,
      vnodeTag,
      vnodeProps,
      vnodeChildren,
      vnodePatchFlag
    );
  };
}

/**
 * 处理转换文本
 * @description 主要是合并 {{ name }} hello 这种简单的表达式，并且除掉无用空格、换行等；
 * @param node
 * @param context
 * @returns
 */
function transformText(node, context) {
  console.log("处理文本节点");
  // {{name}} hello => [children,children] =>createTextNode(name+"hello")

  if (node.type == NodeTypes.ROOT || node.type == NodeTypes.ELEMENT) {
    return () => {
      let hasText = false;
      let children = node.children;
      let container = null;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child)) {
          // hello {{name}} {{world}} hello
          hasText = true; // 当前元素确实有文本，我需要合并
          for (let j = i + 1; j < children.length; j++) {
            const nextChild = children[j];
            if (isText(nextChild)) {
              if (!container) {
                container = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  loc: child.loc,
                  children: [child],
                };
              }
              container.children.push(`+`, nextChild);
              children.splice(j, 1);
              j--;
            } else {
              container = null;
              break; // 遇到不是文本节点就要跳过去
            }
          }
        }
      }
      // 文本需要增加 createText 方法 helper 里增加
      if (!hasText || children.length === 1) {
        // 只有一个孩子
        return;
      }

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child) || child.type === NodeTypes.COMPOUND_EXPRESSION) {
          const callArgs = [];
          callArgs.push(child);
          if (child.type !== NodeTypes.TEXT) {
            callArgs.push(PatchFlags.TEXT + "");
          }

          children[i] = {
            type: NodeTypes.TEXT_CALL,
            content: child,
            loc: child.loc,
            codegenNode: createCallExpression(
              context.helper(CREATE_TEXT),
              callArgs
            ),
          };
        }
      }
    };
  }
}

/**
 * 支持转换的元素类型有哪些
 * @returns
 */
export function getBaseTransformPreset() {
  return [transformElement, transformText];
}

/**
 * 创建转换过程中的上下文
 * @param root
 * @param nodeTransforms
 * @returns
 */
function createTransformContext(root: any, nodeTransforms: any) {
  const context = {
    root,
    currentNode: root,
    nodeTransforms,
    helpers: new Set(),
    helper(name) {
      // 代码中用到了具体方法，需要调用此方法，将对应的名字加入到 helpers
      context.helpers.add(name);
      return name;
    },
  };
  return context;
}

/**
 * 开始深度遍历处理一个节点及其下面的孩子节点
 * @param node
 * @param context
 */
function traverseNode(node: any, context) {
  const { nodeTransforms } = context;
  context.currentNode = node;
  const exits = [];
  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context);
    if (onExit) {
      exits.push(onExit);
    }
  }
  switch (node.type) {
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
  }

  context.currentNode = node;
  let i = exits.length;
  while (i--) {
    exits[i]();
  }
}

/**
 * 遍历孩子节点
 * @param node
 * @param context
 */
function traverseChildren(node: any, context) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    traverseNode(child, context);
  }
}

function createCallExpression(callee, args: any[]) {
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    callee,
    arguments: args,
  };
}

function createVNodeCall(
  context: any,
  tag: string,
  props: any,
  children: any,
  patchFlag: any
): any {
  context.helper(CREATE_VNODE);
  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children,
    patchFlag,
  };
}

function createRootCodegen(root: any, context: any) {
  const { helper } = context;
  const children = root.children;

  helper(OPEN_BLOCK);
  helper(CREATE_BLOCK);

  if (children.length === 1) {
    const child = children[0]; // 直接以当前这个孩子作为根节点
    const codegen = child.codegenNode;
    codegen.isBlock = true; // 只有一个儿子，那么他就是 blocktree 的根节点
    root.codegenNode = codegen;
  } else if (children.length > 1) {
    root.codegenNode = createVNodeCall(
      context,
      helper(FRAGMENT),
      undefined,
      children,
      PatchFlags.STABLE_FRAGMENT
    );
    root.isBlock = true;
  }
}
