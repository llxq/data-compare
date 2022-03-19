import { isArray, isObject } from './index'

type Callback<T extends Obj> = (item: T extends (infer U)[] ? U : T[Extract<keyof T, string>], index: number, source?: T) => any

/**
 * 同步遍历当前元素
 * @param source 需要遍历的元素
 * @param fn 遍历的同步回调 返回 true 可以停止遍历
 */
export const each = <T extends Obj>(source: T, fn: Callback<T>): void => {
    if (isArray(source)) {
        for (let i = 0, length = source.length; i < length; i++) {
            if (fn(source[i], i, source) === true) return
        }
    } else if (isObject(source)) {
        const keys: string[] = Object.keys(source)
        for (let i = 0, length = keys.length; i < length; i++) {
            const key = keys[i]
            if (Reflect.has(source, key) && key !== 'constructor') {
                if (fn(source[key], i, source) === true) return
            }
        }
    }
}

/**
 * 判断对象是否为空
 * @param value
 */
export const isEmptyObj = <T extends Record<string | number, unknown>> (value?: T): boolean => !value || !Object.keys(value).length
