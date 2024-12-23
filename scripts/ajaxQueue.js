/**
 * 请求队列，最多同时存在 limitMax 个请求。开启后，每个请求链，上一个有返回结果后，再从队列中拿出来一个继续执行。
 * @param {*} requestPipe
 * @param {*} limitMax
 * @returns
 */
export async function qpsLimit(requestPipe, limitMax) {
  const result = [];
  const promiseQueues = [];
  // 根据并发量开启多个链条
  for (let i = 0; i < limitMax; i++) {
    let promiseQueue = runRequest();
    promiseQueues.push(promiseQueue);
  }

  async function runRequest() {
    let request = requestPipe.shift();
    if (request) {
      try {
        let data = await request();
        if (data) {
          result = result.concat(data);
        }
      } catch (e) {
        console.log(e);
      } finally {
        // 状态更新完后再执行下一个 request
        await runRequest();
      }
    }
  }
  await Promise.all(promiseQueues);
  return result;
}
