declare type Callback<T extends Obj> = (item: T extends (infer U)[] ? U : T[Extract<keyof T, string>], index: number, source?: T) => any;
/**
 * 同步遍历当前元素
 * @param source 需要遍历的元素
 * @param fn 遍历的同步回调 返回 true 可以停止遍历
 */
export declare const each: <T extends Obj<any>>(source: T, fn: Callback<T>) => void;
/**
 * 判断对象是否为空
 * @param value
 */
export declare const isEmptyObj: <T extends Record<string | number, unknown>>(value?: T | undefined) => boolean;
export {};
