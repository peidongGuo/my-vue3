import { NodeTypes } from ".";
import { helperNameMap, OPEN_BLOCK } from "./helpers";

/**
 * 生成最终的代码
 * @param ast
 * @returns
 */
export function generate(ast) {
  const context = createCodegenContext(ast);
  const { push, newLine, indent, deindent } = context;
  push(`const _Vue=vue`);
  newLine();
  push(`return function render(_ctx){`);
  indent();
  push(`with (_ctx){}`);
  indent();
  push(
    `const {${ast.helpers.map((s) => `${helperNameMap[s]}`).join(",")}}  = _Vue`
  );
  newLine();
  push(`return `);
  genNode(ast, context);
  deindent();
  push(`}`);
  deindent();
  push(`}`);
  return context.code;
}

/**
 * 创建生成代码过程中的上下文
 * @param ast
 * @returns
 */
function createCodegenContext(ast: {
  type: NodeTypes;
  children: any;
  loc: any;
}) {
  const newLine = (n) => {
    context.push("\n" + "  ".repeat(n));
  };
  const context = {
    code: ``,
    helper(key) {
      return `${helperNameMap[key]}`;
    },
    push(c) {
      context.code += c;
    },
    indentLevel: 0,
    newLine() {
      // 换行
      newLine(context.indentLevel);
    },
    indent() {
      // 缩进
      newLine(++context.indentLevel);
    },
    deindent() {
      newLine(--context.indentLevel);
    },
  };
  return context;
}

/**
 * 生成节点代码
 * @param node
 * @param context
 */
function genNode(
  node: any,
  context: {
    code: string;
    push(c: any): void;
    indentLevel: number;
    newLine(): void;
    indent(): void;
    deindent(): void;
  }
) {
  switch (node.type) {
    case NodeTypes.ELEMENT:
      break;
    case NodeTypes.TEXT:
      break;
    case NodeTypes.INTERPOLATION:
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      break;
    case NodeTypes.ROOT:
    case NodeTypes.VNODE_CALL:
      genVNodeCall(node, context);
      break;
    case NodeTypes.JS_CALL_EXPRESSION:
      break;
    case NodeTypes.TEXT_CALL:
      break;
  }
}

/**
 * 生成虚拟节点的代码
 * @param node
 * @param context
 */
function genVNodeCall(node: any, context) {
  const { push, helper } = context;
  const { tag, children, props, patchFlag, isBlock } = node;
  if (isBlock) {
    push(`(${context.helper(OPEN_BLOCK)}()`);
  }
}
