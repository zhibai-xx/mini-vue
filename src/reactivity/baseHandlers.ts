import { track, trigger } from "./effect";
import { ReactiveFlags } from "./reactive";

const get = createGetter(); // 性能优化，只有在初始化的时候调用创造函数
const set = createSetter();
const readonlyGet = createGetter(true);

function createGetter(isReadonly = false) {
  // 搞一个高阶函数(返回一个函数),用于优化代码结构
  return function get(target, key) {
    // (target:目标对象, key:被获取的属性名)

    if (key == ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key == ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    // Reflect.get() 方法与从 对象 (target[propertyKey]) 中读取属性类似，
    // 但它是通过一个函数执行来操作的
    // var obj = { x: 1, y: 2 }; -> Reflect.get(obj, "x"); -> 1
    const res = Reflect.get(target, key); // { age: 10 } -> 10

    if (!isReadonly) {
      track(target, key); // 依赖收集
    }
    return res;
  };
}

function createSetter() {
  return function set(target, key, value) {
    // value 如果target对象中指定了getter，value则为getter调用时的this值

    const res = Reflect.set(target, key, value);
    trigger(target, key); // 触发依赖
    return res;
  };
}

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`key:${key} set失败,因为 target 是 readonly`, target);
    return true;
  },
};
