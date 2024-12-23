import { NodeTypes } from ".";

/**
 * 将模板转成 AST 树  https://astexplorer.net/  vue
 * @param content
 */
export function baseParse(content: any) {
  const context = createParserContext(content);
  return createRoot(parseChildren(context), getSelection(context, 0));
}

/**
 * 标识节点的信息，如行、列、源码；并且在解析完一个节点将节点对应的源码进行删除
 * @param content
 */
function createParserContext(content: any) {
  return {
    line: 1,
    column: 1,
    offset: 0,
    source: content, // 会不停的移除上个解析节点的源码，直到为空，代表解析完毕了
    originalSource: content, // 这个值是不会变的，记录的是传入的源码
  };
}

/**
 * 解析每个节点
 * @param context
 */
function parseChildren(context) {
  const nodes = [];
  while (!isEnd(context)) {
    const s = context.source;
    let node;
    if (s[0] === "<") {
      // 标签
      node = parseElement(context);
    } else if (s.startsWith("{{")) {
      // 表达式
      node = parseInterpolation(context);
    } else {
      // 其它为 文本
      node = parseText(context);
    }
    nodes.push(node);
  }

  nodes.forEach((node, index) => {
    if (node.type === NodeTypes.TEXT) {
      if (/^ \t\r\n/.test(node.content)) {
        nodes[index] = null;
      } else {
        node.content = node.content.replace(/[ \t\r\n]+/g, " ");
      }
    }
  });

  return nodes.filter(Boolean);
}

/**
 * 判断源码是否为空，为空是结束，有个特殊情况是标签元素结束时的符号 "</"
 * @param context
 * @returns
 */
function isEnd(context: any) {
  const source = context.source;
  if (source.startsWith("</")) {
    return true;
  }
  return !source;
}

/**
 * 解析标签元素
 * @param context
 * @returns
 */
function parseElement(context): any {
  let element = parseTag(context);

  const children = parseChildren(context);

  if (context.source.startsWith("</")) {
    parseTag(context);
  }
  element.children = children;
  element.loc = getSelection(context, element.loc);
  return element;
}

/**
 * 解析表达式
 * @param context
 */
function parseInterpolation(context): any {
  const start = getCursor(context);
  const closeIndex = context.source.indexOf("}}", "{{");
  advanceBy(context, 2);
  const innerStart = getCursor(context);

  const innerEnd = getCursor(context);
  const rawContentLength = closeIndex - 2;
  const preTrimContent = parseTextData(context, rawContentLength);
  const content = preTrimContent.trim();
  const startOffset = preTrimContent.indexOf(content);
  if (startOffset > 0) {
    // 有前面空格， {{ name }}
    advancePositionWithMutation(innerStart, preTrimContent, startOffset);
  }
  // 再去更新 innerEnd
  const endOffset = content.length + startOffset;
  advancePositionWithMutation(innerEnd, preTrimContent, endOffset);
  advanceBy(context, 2);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      loc: getSelection(context, innerStart, innerEnd),
      content,
    },
    loc: getSelection(context, start),
  };
}

function parseText(context): any {
  const endTokens = ["<", "{{"];
  let endIndex = context.source.length;

  for (let i = 0; i < endTokens.length; i++) {
    const endToken = endTokens[i];
    const endTokenIndex = context.source.indexOf(endToken, 1);
    if (endTokenIndex !== -1 && endTokenIndex < endIndex) {
      endIndex = endTokenIndex;
    }
  }
  // 有了文本的结束位置后，就可以更新行列信息
  let start = getCursor(context);
  const content = parseTextData(context, endIndex);
  let loc = getSelection(context, start);
  return { loc, type: NodeTypes.TEXT, content };
}

/**
 * 获取上下文现在的各种位置坐标
 * @param context
 * @returns
 */
function getCursor(context) {
  let { line, column, offset } = context;
  return { line, column, offset };
}

/**
 * 获取位置信息
 * @param context
 * @param start
 * @returns
 */
function getSelection(context, start, end?) {
  end = end || getCursor(context);
  let source = context.originalSource.slice(start.offset, end.offset);
  return { start, end, source };
}

/**
 * 获取文本节点的源码
 * @param context
 * @param endIndex
 * @returns
 */
function parseTextData(context, endIndex) {
  const rawText = context.source.slice(0, endIndex);
  advanceBy(context, endIndex);
  return rawText;
}

/**
 * 删除上个节点的源码
 * @param context
 * @param endIndex
 */
function advanceBy(context: any, endIndex: any) {
  advancePositionWithMutation(context, context.source, endIndex);
  context.source = context.source.slice(endIndex);
}

/**
 * 处理前进行数
 * @param context
 * @param s
 * @param endIndex
 */
function advancePositionWithMutation(context: any, s: any, endIndex: any) {
  let linesCount = context.line;
  let linePosition = -1;
  for (let i = 0; i < endIndex; i++) {
    if (s.charCodeAt(i) === 10) {
      linesCount++;
      linePosition = i;
    }
  }
  context.offset += endIndex; // 上个节点的偏移量加上这个节点的长度
  context.line = linesCount; // 上个节点的行数，加上这个节点的行数
  context.column =
    linePosition === -1
      ? context.column + endIndex
      : endIndex - linePosition - 1;
}

/**
 * 转译元素标签名
 * @param context
 * @returns
 */
function parseTag(context): any {
  const start = getCursor(context);
  // 最基本的元字符
  const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source);
  const tag = match[1];
  advanceBy(context, match[0].length);
  advanceSpaces(context);

  const isSelfClosing = context.source.startsWith("/>");
  advanceBy(context, isSelfClosing ? 2 : 1);
  return {
    type: NodeTypes.ELEMENT,
    tag,
    isSelfClosing,
    loc: getSelection(context, start),
  };
}

/**
 * 前进标签的空格
 * @param context
 */
function advanceSpaces(context) {
  const match = /^[ \t\r\n]+/.exec(context.source);
  if (match) {
    advanceBy(context, match[0].length);
  }
}

/**
 * 编译根元素
 * @param children
 * @param loc
 * @returns
 */
function createRoot(children, loc) {
  return {
    type: NodeTypes.ROOT,
    children,
    loc,
  };
}
