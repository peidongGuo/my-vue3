import path, { format } from "path";
import json from "@rollup/plugin-json";
import ts from "rollup-plugin-typescript2";
import resolvePlugin from "@rollup/plugin-node-resolve";

const packagesDir = path.resolve(__dirname, "packages");
// 根据环境变量中的 target 属性，获取对应模块中的 package.json
const packageDir = path.resolve(packagesDir, process.env.TARGET);

const resolve = (p) => path.resolve(packageDir, p);

const pkg = require(resolve("package.json"));
// console.log(pkg);

const name = path.basename(packageDir); //取项目名为输出包名
// 对打包类型 先做一个映射表，根据你提供的 formats 来格式化需要打包的内容
const outputConfig = {
  "esm-bundler": {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: "es",
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: "cjs",
  },
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: "iife",
  },
};

const options = pkg.buildOptions; // 自己在 package.json 中定义的选项

function createConfig(format, output) {
  output.name = options.name;
  output.sourcemap = true;

  // 生成 rollup 配置对象
  return {
    input: resolve(`src/index.ts`),
    output,
    plugins: [
      json(),
      ts({
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
      }),
      resolvePlugin(),
    ],
  };
}

export default options.formats.map((format) => {
  return createConfig(format, outputConfig[format]);
});
