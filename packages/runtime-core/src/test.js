const arr = [2, 3, 1, 5, 6, 8, 7, 9, 4];

const p = arr.slice(0); // 里面内容无所谓，和原本的数组相同，用来存放索引
// 最终的结果放的是索引
function getSequence(arr) {
  const len = arr.length;
  const result = [0]; // 第一个数的索引
  const p = arr.slice(0); // 里面内容无所谓，和原本的数组相同，用来存放索引
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

getSequence(arr);

// 求当前列表中最大递增的个数 ：贪心 + 二分查找

// 在查找中如果当前的比最后的一个大，直接插入；
// 如果当前这个比最后一个小，采用二分查找的方式，找到已经排好的列表，找到比当前数大的那一项，将其替换掉
