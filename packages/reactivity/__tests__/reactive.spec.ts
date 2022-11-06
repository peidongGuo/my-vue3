import { reactive } from "../src";

describe("reactivity/reactive", () => {
  test("Object", () => {
    const original = { foo: 1 };
    // get
    expect(original.foo).toBe(1);
  });
});
