export const isArray = <T = any>(value: unknown): value is Array<T> => value instanceof Array || Array.isArray(value)

export const isObject = <T extends Obj>(value: unknown): value is T => typeof value === 'object' && value !== null

export const isUndefined = (value: unknown): value is undefined => typeof value === 'undefined'
