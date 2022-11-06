import fs from "fs";
console.log(
  fs.readdirSync("packages").filter((dir) => {
    let statData = fs.statSync(`packages/${dir}`);
    console.log(statData);
    return statData.isDirectory();
  })
);
