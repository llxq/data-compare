export declare const isArray: <T = any>(value: unknown) => value is T[];
export declare const isObject: <T extends Obj<any>>(value: unknown) => value is T;
export declare const isUndefined: (value: unknown) => value is undefined;
