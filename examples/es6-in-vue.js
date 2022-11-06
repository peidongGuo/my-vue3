let s1 = Symbol("gpd");
let s2 = Symbol("gpd");
let s3 = Symbol.for("gpd2");
let s4 = Symbol.for("gpd2");
console.log(s3 === s4); // true
console.log(s1 === s2); // false

let obj2 = {
  [Symbol.toStringTag]: "jw",
};
console.log(Object.prototype.toString.call(obj2)); // [object jw]

let obj = {
  name: "gpd",
  age: 30,
  [s1]: "ok",
};

let obj3 = {
  [Symbol.toPrimitive](value) {
    return value;
  },
};

console.log(obj3 + 1); // default1

let obj4 = {
  [Symbol.hasInstance](value) {
    return "name" in value;
  },
};

console.log({ name: "gpd4" } instanceof obj4); // true

console.log(obj); // {name:'gpd',age:30,[Symbol(gpd)]:'ok'}

// reflect
console.log(Object.keys(obj)); // ['name','age]

console.log(Reflect.ownKeys(obj)); // ['name','age',Symbol(gpd)]

const fn = (a, b) => {
  console.log("fn", a, b);
};
fn.apply = function () {
  console.log("apply");
};

fn.apply(); // apply
Function.prototype.apply.call(fn, null, [1, 2]); // fn.call(null,1,2)
Reflect.apply(fn, null, [1, 2]); // fn.call(null,1,2)
fn.call(null, 1, 2); // fn 1 2

// weakmap 的key必须是对象，弱引用
class MyTest {}
let my = new MyTest();
let map = new WeakMap();
map.set(my, 1);
my = null;
console.log(map);
setTimeout(() => {
  console.log(map);
}, map);

/**
 * 深拷贝
 * @param {*} obj  被拷贝的对象
 * @param {*} hash  已经被拷贝的对象集合，这里用来避免对象循环拷贝导致堆栈溢出
 * @returns
 */
function deepClone(obj, hash = new WeakMap()) {
  if (obj == null) return obj;
  if (obj instanceof RegExp) return new RegExp(obj);
  if (obj instanceof Date) return new Date(obj);
  if (typeof obj !== "object") return obj;

  if (hash.has(obj)) return hash.get(obj);
  const copy = new obj.constructor();
  hash.set(obj, copy);
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      copy[key] = deepClone(obj[key], hash);
    }
  }
  return copy;
}

const obja = { name: "gpd" };
const objb = { age: 31 };
objb.a = obja;
obja.b = objb;
console.log(deepClone(objb));

// reduce 前提是数组不能为空，如果只有一个，就直接返回第一个值，不会进行遍历
let r = [1].reduce(function (previousValue, currentValue, currentIndex, array) {
  console.log(previousValue, currentValue);
  return previousValue + currentValue;
});
console.log(r);

// 这种情况也是直接返回第一个值
let r3 = [].reduce(function (previousValue, currentValue, currentIndex, array) {
  console.log(previousValue, currentValue);
  return previousValue + currentValue;
}, 1);
console.log(r3);

// 这种情况才会进行正常的循环
let r2 = [1, 2, 3, 4, 5].reduce(function (
  previousValue,
  currentValue,
  currentIndex,
  array
) {
  console.log(previousValue, currentValue);
  return previousValue + currentValue;
});
console.log(r2);

// 经典剥洋葱法
const compose = (...fns) =>
  fns.reduce(
    (a, b) =>
      (...args) =>
        a(b(...args))
  );

// addPrefix(leg(sum(...args)))

const sum = (a, b) => a + b;
const leg = (str) => str.length;
const addPrefix = (str) => "$" + str;

const final = compose(addPrefix, leg, sum);
console.log(final);
console.log(final("1", "2"));
