import { extend } from "../shared/index";
class ReactiveEffect {
  private _fn: any;
  deps = [];
  active = true;
  onStop?: () => void;
  public scheduler: Function | undefined;
  // 公用的才能调用到，?代表可选的
  constructor(fn, scheduler?: Function) {
    // 在构造函数内部接收参数
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    activeEffect = this;
    return this._fn(); // 把函数return出去
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
}

const tragetMap = new Map();
// 收集依赖
export function track(target, key) {
  // target -> key -> dep  target对象->key:键名->dep:依赖

  let depsMap = tragetMap.get(target); // get方法，根据target取到key
  if (!depsMap) {
    // 初始化的问题
    depsMap = new Map();
    tragetMap.set(target, depsMap); // set方法，没找到key就存一个空Map对象
    // tragetMap->{{age:10} : new Set()} 现在没用update的时候用
  }

  let dep = depsMap.get(key); // 根据key取到dep(即依赖)
  if (!dep) {
    // 初始化的问题
    dep = new Set();
    depsMap.set(key, dep); // 如果没找到dep就存一个空Set对象
    // {age : new Set()}
  }

  if (!activeEffect) return;
  // set的add方法，类似push，添加到队尾。
  dep.add(activeEffect); // 这里是将this（或者说想要执行的方法），add进dep（依赖）中去
  // activeEffect == ReactiveEffect

  activeEffect.deps.push(dep);
}

// 触发依赖
export function trigger(target, key) {
  let depsMap = tragetMap.get(target); // 取出key
  let dep = depsMap.get(key); // 取出dep(依赖)

  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      // 把dep中的所有fn都执行一遍
      effect.run();
    }
  }
}

let activeEffect;
export function effect(fn, options: any = {}) {
  const scheduler = options.scheduler;
  // fn
  const _effect = new ReactiveEffect(fn, scheduler);

  extend(_effect, options);

  _effect.run(); // 立即执行fn的意思

  // bind() 方法创建一个新的函数，在 bind() 被调用时
  // 这个新函数的 this 被指定为 bind() 的第一个参数，而其余参数将作为新函数的参数，供调用时使用。
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}
