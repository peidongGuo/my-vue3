// 打包 package 目录下的所有包

import fs from "fs";
import { execa } from "execa"; // 开启子进程进行打包

const targets = fs.readdirSync("packages").filter((file) => {
  if (!fs.statSync(`packages/${file}`).isDirectory()) {
    return false;
  }
  return true;
});

// 对我们目标进行依次打包，并行

async function build(target) {
  //   console.log(target);
  await execa("rollup", ["-cw", "--environment", `TARGET:${target}`], {
    stdio: "inherit",
  }); // stdio 当子进程打包时将信息同步给父进程
}

function runParallel(targets, iteratorFn) {
  const res = [];
  for (const item of targets) {
    const p = iteratorFn(item);
    res.push(p);
  }
  return Promise.all(res);
}

runParallel(targets, build);
