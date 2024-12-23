import { generate } from "./generate";
import { baseParse } from "./parse";
import { getBaseTransformPreset, transform } from "./transform";

export const enum NodeTypes {
  ROOT,
  ELEMENT,
  TEXT,
  SIMPLE_EXPRESSION = 4,
  INTERPOLATION = 5,
  COMPOUND_EXPRESSION = 8,
  TEXT_CALL = 12,
  VNODE_CALL = 13,
  JS_CALL_EXPRESSION = 17,
}

export const baseCompile = (template) => {
  const ast = baseParse(template);

  const nodeTransforms = getBaseTransformPreset();
  transform(ast, nodeTransforms);

  const code = generate(ast);

  console.log(code);
};
