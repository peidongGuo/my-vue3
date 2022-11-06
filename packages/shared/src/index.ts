import { ShapeFlags } from "./shapeFlags";

const isObject = (value) => typeof value === "object" && value !== null;
export { isObject };

export const isArray = Array.isArray;
export const isInterger = (key) => parseInt(key) + "" === key + "";
export const isNumber = (value) => typeof value === "number";
export const isString = (value) => typeof value === "string";
export const isFunction = (fn) => typeof fn === "function";
export const hasOwn = (target, key) =>
  Object.prototype.hasOwnProperty.call(target, key);

export const hasChanged = (oldValue, newValue) => oldValue !== newValue;
export const extend = (target, source) => Object.assign({ ...target }, source);
export { ShapeFlags };
