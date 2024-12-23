import { reactive, ref } from "../src/20221106";
import { effect } from "../src/20221106";

describe("reactivity/reactive", () => {
  test("Object", () => {
    const original = { foo: 1 };
    const observed = reactive(original);
    expect(observed).not.toBe(original);
    // expect(isReactive(observed)).toBe(true);
    // expect(isReactive(original)).toBe(false);
    // get
    expect(observed.foo).toBe(1);
    // has
    expect("foo" in observed).toBe(true);
    // ownKeys
    expect(Object.keys(observed)).toEqual(["foo"]);
  });
  test("effect", () => {
    const original = { foo: 1 };
    const observed = reactive(original);
    let count = 0;
    effect(() => {
      count++;
      console.log(observed.foo);
    });
    observed.foo = 2;
    expect(observed.foo).toEqual(2);
    expect(count).toEqual(2);
  });
  test("ref", () => {
    const original = 1;
    const observed = ref(original);
    let count = 0;
    effect(() => {
      count++;
      console.log(observed.value);
    });
    observed.value = 2;
    expect(original).toEqual(1);
    expect(observed.value).toEqual(2);
    expect(count).toEqual(2);
  });
});
