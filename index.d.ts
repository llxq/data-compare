declare type UndefinedAble<T> = undefined | T

declare type Obj<T = any> = {
    [key in string | number]: T
}
