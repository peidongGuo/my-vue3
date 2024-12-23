let queue = [];

/**
 *
 * @param job setupEffect
 */
export function queueJob(job) {
  // 这个地方进行的去重，将多次修改引起的 effect 进行去重，只更新一次就好！
  if (!queue.includes(job)) {
    queue.push(job);
    queueFlush();
  }
}

let isFlushPending = false;

function queueFlush() {
  if (!isFlushPending) {
    isFlushPending = true;
    // 在同步执行代码中已经完成所有修改事件，然后再一起执行 job
    Promise.resolve().then(flushJobs);
  }
}

function flushJobs() {
  isFlushPending = false;
  // 清空时，我们需要根据调用的顺序依次刷新，保证先刷新父在刷新子
  queue.sort((a, b) => a.id - b.id);

  for (let i = 0; i < queue.length; i++) {
    const job = queue[i];
    job();
  }
  queue.length = 0;
}
