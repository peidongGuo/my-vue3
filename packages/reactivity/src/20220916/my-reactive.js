// 1. 先写 reactive 主流程
// effect 比较关心下面几种，当然，如果数组结构是 Set  或 Map 时机制应该也是一样的；
// 1. 对象中的属性值变化；
// 2. 对象中新添属性值变化；
// 3. 对象中删除属性值变化；
// 4. 数组中某个索引下的属性值变化；
// 5. 数组中长度变化，由长变短；
// 6. 数组中长度变化，由短变长；

function reactive(obj) {
  return new Proxy(obj, {
    get(obj, key, receiver) {
      // 在获取对象时，去获取 effect 中的 fn 方法
      trackEffectFns(obj, key);
      if (Array.isArray(obj)) {
        trackEffectFns(obj, "length");
      }
      return typeof obj[key] === "object" ? reactive(obj[key]) : obj[key];
    },
    set(obj, key, newValue, receiver) {
      obj[key] = newValue;
      if (Array.isArray(obj) && key > obj.length) {
        triggerEffectFns(obj, "length");
      }
      triggerEffectFns(obj, key);
    },
  });
}

console.log(reactive({ name: "gpd" }));

let activeEffect; // 当前的 effect
let effectStack = []; // effect 执行栈，为了消灭嵌套使用 effect(()=>{effect(()=>{})}) 的情况
let depsMap = new Map(); // 对象属性依赖数据 {target: depMap}  depMap{target[key]:new Set()}

function trackEffectFns(target, key) {
  // 找一下这个对象属性原来有没有已经收集依赖数据，没有就创建一个，有就是添
  let targetDepMap = depsMap.get(target) ?? new Map();
  let targetKeyDep = targetDepMap.get(key) ?? new Set();
  targetKeyDep.add(effectStack[effectStack.length - 1] ?? null);
  targetDepMap.set(key, targetKeyDep);
  depsMap.set(target, targetDepMap);
}

function triggerEffectFns(target, key) {
  let targetDepMap = depsMap.get(target) ?? new Map();
  let targetKeyDep = targetDepMap.get(key) ?? new Set();
  targetKeyDep.forEach((effect) => {
    effect?.()?.raw();
  });
}

function effect(fn) {
  let effect = function () {
    effect.raw = fn;
    return effect;
  };
  effectStack.push(effect);
  fn();
  effectStack.pop();
  return effect;
}

class RefObj {
  value;
  constructor(val) {
    this.value = val;
  }
  get value() {
    trackEffectFns(this, "value");
    return this.value;
  }

  set value(newVal) {
    this.value = newVal;
    triggerEffectFns(this, "value");
  }
}

function ref(val) {
  // return new RefObj(val);
  let obj = {};
  let value = val;
  Object.defineProperty(obj, "value", {
    get() {
      trackEffectFns(obj, "value");
      return value;
    },
    set(newVal) {
      value = newVal;
      triggerEffectFns(obj, "value");
    },
  });
  return obj;
}

function toRef(reactiveObj, key) {
  let obj = {};

  Object.defineProperty(obj, "value", {
    get() {
      return reactiveObj[key];
    },
    set(newVal) {
      reactiveObj[key] = newVal;
    },
  });
  return obj;
}

function toRefs(reactiveObj) {
  let obj = {};
  for (const key in reactiveObj) {
    obj[key] = toRef(reactiveObj, key);
  }
  return obj;
}

class ComputedRefTemp {
  _value;
  _isDirty;
  _effect;
  constructor(getter, setter) {
    this._effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        this._isDirty = false;
      },
    });
    this._isDirty = true;
  }
  get value() {
    if (this._isDirty) {
      this._value = this._effect().raw();
    }
    return this._value;
  }
  set value(newValue) {
    this._value = newValue;
  }
}

function computed(getter) {
  return new ComputedRefTemp(getter);
}

let object1 = reactive({ name: "gpd1", age: 30 });
let counter1 = 0;

let array1 = reactive([1, 2, 3]);
let counter2 = 0;

// Test 1. 对象中的属性值变化
effect(() => {
  console.log(`Test1 effect中的方法执行 ${++counter1} 次！`);
  console.log(object1.name);
  console.log(object1.age);
});
object1.name = "gpd2";
object1.name = "gpd3";

// Test 2. 对象中的属性添加 观察 effect 中的函数是否执行，因为没有这个属性，所以它不会执行！
object1.male = true;

// Test 3. 对象中的属性被删除 观察 effect 中的函数是否执行，一般不关心这个操作，会忽略掉！
delete object1.age;

// Test 4. 数组中某一个索引的值被修改
effect(() => {
  console.log(`Test2 effect中的方法执行 ${++counter2} 次！`);
  console.log(array1[2]);
  console.log(array1);
});

// Test 5. 数组中长度变化，由长变短
// array1.length = 2;
array1[2] = 10;
// array1.splice(1, 1);

// Test 6. 数组中长度变化，由短变长
// array1.push(5);
array1.length = 1;
array1[100] = 100;
array1.length = 10;

// Test 7. 一个普通值也可以触发响应式
let tmpVal = ref(1);

effect(() => {
  console.log(tmpVal.value);
  console.log(tmpVal);
});

tmpVal.value = 123;

// Test 8. 一个响应式对象的属性转成 ref

let reactiveObj1 = reactive({ name: "gpd" });
let name1 = toRef(reactiveObj1, "name");
effect(() => {
  console.log("Test 8", name1.value);
});
name1.value = "gpd2";

// Test 9. 一个响应式对象转成一个任何一个属性都可以响应的对象
let reactiveObj2 = reactive({ name2: "gpd", age2: "34" });
let { name2, age2 } = toRefs(reactiveObj2);
effect(() => {
  console.log("Test 9", name2.value);
  console.log("Test 9", age2.value);
});
name2.value = "gpd2";
age2.value = "35";

// Test10. computed
let comOriValue = ref(1);
let comValue = computed(() => {
  return comOriValue.value + 1;
});
console.log(comValue.value);
console.log(comValue.value);
comOriValue.value = 2;
console.log(comValue.value);
