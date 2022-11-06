// 打包 package 目录下的所有包

import { execa } from "execa"; // 开启子进程进行打包

let target;
for (let i = 0; i < process.argv.length; i++) {
  let arg = process.argv[i];
  if (arg.indexOf("pkg=") === 0) {
    target = arg.slice(4);
  }
}

console.log(target);

// 对我们目标进行依次打包，并行
async function build(target) {
  if (target) {
    //   console.log(target);
    await execa("rollup", ["-cw", "--environment", `TARGET:${target}`], {
      stdio: "inherit",
    }); // stdio 当子进程打包时将信息同步给父进程
  }
}

build(target);
