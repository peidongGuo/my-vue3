import { effect } from "@vue/reactivity";
import { isObject, ShapeFlags } from "@vue/shared";
import { patchAttr } from "packages/runtime-dom/src/modules/attr";
import { createAppAPI } from "./apiCreateApp";
import { invokeArrayFns } from "./apiLifeCycle";
import { createComponentInstance, setupComponent } from "./component";
import { createVNode, TEXT, normalizeVnode } from "./vnode";

function getSequence(arr) {
  const len = arr.length;
  const p = arr.slice(0); // 里面内容无所谓，和原本的数组相同，用来存放索引
  const result = [0]; // 第一个数的索引
  let start, end, middle;
  for (let i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      let resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        p[i] = resultLastIndex; // 存放最后一个索引
        result.push(i); // 当前的值比上一个大，直接 push

        continue;
      }
      // 二分查找，找到比当前值大的那一个
      start = 0;
      end = result.length - 1;
      while (start < end) {
        // 相当代表是已经找到了
        middle = ((start + end) / 2) | 0;
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      // 找到要替换的位置
      if (arrI < arr[result[start]]) {
        if (start > 0) {
          p[i] = result[start - 1];
        }
        result[start] = i;
      }
    }
  }
  let len2 = result.length;
  let last = len2 - 1;
  while (len2 > 0) {
    // 根据前驱节点一个个向前查找
    result[len2] = last;
    last = p[last];
    len2--;
  }
  return result;
}

// 告诉 core 怎么渲染
export function createRender(renderOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    nextSibling: hostNextSibling,
  } = renderOptions;
  const processText = (n1, n2, container) => {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    }
  };

  function isSameVNodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }
  function unmount(n1) {
    // 如果是组件，调用的组件的生命周期等
    hostRemove(n1.el);
  }
  // anchor 为 null ，默认是 append
  function patch(n1: any, vnode: any, container: any, anchor: any = null) {
    // 针对不同类型，做初始化操作
    const { shapeFlag, type } = vnode;
    if (n1 && !isSameVNodeType(n1, vnode)) {
      // 把以前的删掉，换成 vnode
      anchor = hostNextSibling(n1);
      unmount(n1);
      n1 = null; //重新渲染 n2 对应的内容
    }

    switch (type) {
      case Text:
        processText(n1, vnode, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          console.log("元素");
          processElement(n1, vnode, container, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          console.log("组件");
          processComponent(n1, vnode, container);
        }
        break;
    }
    function processComponent(n1: null, vnode: any, container: any) {
      if (n1 == null) {
        //组件没有上一次的虚拟节点
        mountComponent(vnode, container);
      } else {
        // 组件更新流程
      }
    }
    function mountComponent(vnode: any, container: any) {
      // 组件的渲染流程，最核心的是拿到 setup 的返回值，获取 render 函数返回的结果来进行渲染
      // 1. 先有实例
      const instance = (vnode.component = createComponentInstance(vnode));
      // 2. 需要的数据挂载到实例上
      setupComponent(instance);
      // 3. 创建一个 effect，让render函数执行
      setupRenderEffect(instance, container);
      console.log(vnode, container);
    }
    function setupRenderEffect(instance, container) {
      // 需要创建一个effect,在 effect中调用 render 方法，这样可以在属性数据变化时，render 重新执行
      effect(
        function componentEffect() {
          // 每一个组件都有一个 effect ,vue3是组件级更新，数据更新会重新执行组件的 effect
          if (!instance.isMounted) {
            // 初次渲染
            let { bm, m } = instance;
            if (bm) {
              invokeArrayFns(bm);
            }

            let proxyToUse = instance.proxy;
            let subTree = (instance.subTree = instance.render.call(
              proxyToUse,
              proxyToUse
            ));
            // 用 render 的返回值继续渲染
            if (m) {
              invokeArrayFns(m);
            }

            patch(null, subTree, container);
            instance.isMounted = true;
          } else {
            // 数据更新，重新渲染
            let { bu, u } = instance;
            if (bu) {
              invokeArrayFns(bu);
            }

            const prevTree = instance.subTree;
            let proxyToUse = instance.proxy;
            const nextTree = instance.render.call(proxyToUse, proxyToUse);
            patch(prevTree, nextTree, container);

            if (u) {
              invokeArrayFns(u);
            }
          }
        },
        {
          scheduler: (effect) => {
            console.log(effect);
          },
        }
      );
    }
    // 生成元素组件
    function processElement(n1: null, vnode: any, container: any, anchor: any) {
      // 生成元素组件
      if (n1 == null) {
        // 元素初始化
        mountElement(vnode, container, anchor);
      } else {
        // 更新元素
        patchElement(n1, vnode, container, anchor);
      }
    }

    function patchProps(oldProps, newProps, el) {
      if (oldProps !== newProps) {
        for (let key in newProps) {
          const prev = oldProps[key];
          const next = newProps[key];
          if (prev !== next) {
            hostPatchProp(el, key, prev, next);
          }
        }
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
    function unmountChildren(children) {
      children.forEach((child) => {
        unmount(child);
      });
    }
    // 比较两个子元素数组
    function patchKeyedChildren(c1, c2, el) {
      // Vue3 对特殊情况进行优化
      let i = 0;
      let e1 = c1.length - 1;
      let e2 = c2.length - 1;

      // 类似双指针的做法，前后各自开始比对，需要全部比完
      // sync from start 从头开始一个个比，遇到不同的就停止了
      while (i <= e1 && i <= e2) {
        const n1 = c1[i];
        const n2 = c2[i];
        if (isSameVNodeType(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
        i++;
      }
      // sync from end 从尾部开始比对
      while (i <= e1 && i <= e2) {
        const n1 = c1[i];
        const n2 = c2[i];
        if (isSameVNodeType(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
        e1--;
        e2--;
      }

      // common sequence + mount
      // 比较后，有一方已经完全比对完成了
      // 如果完成后，i > e1 就是新增，插入的就是 e2 与 i 之间的就是要插入的
      if (i > e1) {
        if (i < e2) {
          const nextPos = e2 + 1;
          // 找一个参照物，如果下个元素存在就是插入到下个元素之前，如果没有，就直接 append
          let anchor = null;
          if (nextPos < c2.length - 1) {
            anchor = c2[nextPos].el;
          } else {
            anchor = null;
          }
          while (i <= e2) {
            patch(null, c2[i], el, anchor); // 只能向后追加

            i++;
          }
        }
      } else if (i > e2) {
        // common sequence + unmount
        // 老的多新的少
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      } else {
        // 乱序比较，需要尽可能复用，用新的元素做成一个映射表去老的里找，一样的就利用，不一样的要不插入，要不删除
        let s1 = i;
        let s2 = i;
        console.log(s1, s2);
        // vue3 用 c2 做映射表，vue2 用 c2 做映射表
        const keyToNewIndexMap = new Map();
        for (let i = 0; i < c2.length; i++) {
          const child = c2[i]; // child 是个 VNode
          keyToNewIndexMap.set(child.key, i);
        }
        const toBePatched = e2 - s2 + 1;
        console.log(toBePatched);
        const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

        // 去老的里面去找，看有没有复用的
        for (let i = s1; i < c1; i++) {
          const oldChildVNode = c1[i];
          let newIndex = keyToNewIndexMap.get(oldChildVNode.key);
          if (newIndex === undefined) {
            // 不在新的里面
            unmount(oldChildVNode);
          } else {
            // 新老的比对，
            newIndexToOldIndexMap[newIndex - s2] = i + 1;
            patch(oldChildVNode, c2[newIndex], el);
          }
        }
        let increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);
        let increaseingNewIndexSequenceLastIndex =
          increasingNewIndexSequence.length - 1; // 取出最后一个的索引
        for (let i = toBePatched - 1; i >= 0; i--) {
          let currentIndex = i + s2;
          let child = c2[currentIndex];
          const anchor =
            currentIndex + 1 < c2.length ? c2[currentIndex + 1].el : null;

          // 第一次插入 h 后，h 是一个虚拟节点，同时插入后，虚拟节点就会变成真实节点
          if (newIndexToOldIndexMap[i] == 0) {
            // 如果是 0 ，就没被 patch 过
            patch(null, child, el, anchor);
          } else {
            // [3,1,2,0]  [1,2]
            if (
              i !==
              increasingNewIndexSequence[increaseingNewIndexSequenceLastIndex]
            ) {
              // 这种操作需要将节点全部的移动一遍，我希望可以尽可能的减少移动
              hostInsert(child.el, el, anchor); // 操作当前的 d 以 d 的下一个节点为参照物
            } else {
              increaseingNewIndexSequenceLastIndex--; //跳过不需要移动的元素
            }
          }
        }
        // 最后就是移动节点，并且将新增的节点插入
        // 最长递增子序列
      }
    }
    function patchChildren(n1, n2, el) {
      const c1 = n1.children;
      const c2 = n2.children;

      //
      const prevShapeFlag = n1.shapeFlag;
      const shapeFlag = n2.shapeFlag; // 分别标识过儿子的状况

      if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 老的是 n 个孩子，但是新的是文本
        if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          unmountChildren(c1); // 如果 c1 中包含组件会调用组件的销毁方法
        }
        // 两个人都是文本情况
        if (c2 !== c1) {
          hostSetElementText(el, c2);
        }
      } else {
        // 现在是元素，上一次可能是文本或者数组
        if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 之前是数组，之前是数组
            // 两个数组的比对  -> diff 算法 TODO
            patchKeyedChildren(c1, c2, el);
          } else {
            // 当前不是数组，只有一个孩子
            unmountChildren(c1); // 删掉老的
          }
        } else {
          // 上一次是文本
          if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
            hostSetElementText(el, "");
          }
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(c2, el);
          }
        }
      }
    }

    function patchElement(n1, vnode, container) {
      // 元素是相同节点
      let el = (vnode.el = n1.el);

      // 更新属性 更新儿子
      const oldProps = n1.props || {};
      const newProps = vnode.props || {};

      patchProps(oldProps, newProps, el);
      patchChildren(n1, vnode, el);
    }
    function mountElement(vnode: any, container: any, anchor: any = null) {
      // 递归渲染
      const { props, shapeFlag, type, children } = vnode;

      let el = (vnode.el = hostCreateElement(type));

      if (props) {
        for (const key in props) {
          if (Object.prototype.hasOwnProperty.call(props, key)) {
            const element = props[key];

            hostPatchProp(el, key, null, element);
          }
        }
      }
      if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(el, children);
      } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(children, el);
      }
      hostInsert(el, container, anchor);
    }
    function mountChildren(children, el) {
      for (let i = 0; i < children.length; i++) {
        const element = children[i];
        let child = normalizeVnode(element);
        patch(null, child, el);
      }
    }

    //框架都是将组件转化成虚拟DOM，然后将虚拟DOM生成真实DOM挂载到真实页面上
    const render = (vnode, container) => {
      // core 的核心，根据不同的虚拟节点，创建对应的真实元素

      //默认调用 render，可能是初始化流程
      patch(null, vnode, container);
    };
    return createAppAPI(render);
  }
}
