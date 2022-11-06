export const nodeOps = {
  // createElement，不同的平台创建元素方式不同
  // 元素
  createElement: (tagName) => document.createElement(tagName),
  remove: (child) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
  insert: (child, parent, anchor = null) => {
    parent.insertBefore(child, anchor);
  },
  querySelector: (selector) => document.querySelector(selector),
  setElementText: (element, text) => (element.textContent = text),
  // 文本操作
  createText: (text) => document.createTextNode(text),
  setText: (node, text) => (node.nodeValue = text),
  nextSibling: (node) => node.nextSibling,
};
