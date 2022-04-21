var CompareStatusEnum;
(function (CompareStatusEnum) {
    CompareStatusEnum["Create"] = "create";
    CompareStatusEnum["Delete"] = "delete";
    CompareStatusEnum["Update"] = "update";
    CompareStatusEnum["Change"] = "change";
    CompareStatusEnum["Conflict"] = "conflict";
    CompareStatusEnum["None"] = "none";
    CompareStatusEnum["VirtualCreate"] = "virtualCreate";
    CompareStatusEnum["VirtualDelete"] = "virtualDelete";
})(CompareStatusEnum || (CompareStatusEnum = {}));

const isArray = (value) => value instanceof Array || Array.isArray(value);
const isObject$1 = (value) => typeof value === 'object' && value !== null;
const isUndefined = (value) => typeof value === 'undefined';

/**
 * 同步遍历当前元素
 * @param source 需要遍历的元素
 * @param fn 遍历的同步回调 返回 true 可以停止遍历
 */
const each = (source, fn) => {
    if (isArray(source)) {
        for (let i = 0, length = source.length; i < length; i++) {
            if (fn(source[i], i, source) === true)
                return;
        }
    }
    else if (isObject$1(source)) {
        const keys = Object.keys(source);
        for (let i = 0, length = keys.length; i < length; i++) {
            const key = keys[i];
            if (Reflect.has(source, key) && key !== 'constructor') {
                if (fn(source[key], i, source) === true)
                    return;
            }
        }
    }
};
/**
 * 判断对象是否为空
 * @param value
 */
const isEmptyObj = (value) => !value || !Object.keys(value).length;

const updateStatus$2 = (key, value, status) => {
    if (!Reflect.has(status, 'attrStatus')) {
        Reflect.set(status, 'attrStatus', {});
    }
    // 添加状态
    Reflect.set(status.attrStatus, key, value);
};
/**
 * 根据属性状态修改status.type
 * @param status
 */
const updateStatusTypeByAttr = (status) => {
    let type = status.type;
    if (status.attrStatus) {
        // 如果全子节点状态一致，则是同种状态，如果状态不一致，那就是 update
        const keys = Object.keys(status.attrStatus);
        if (!keys.some(it => status.attrStatus[it] === status.attrStatus[0])) {
            type = CompareStatusEnum.Update;
        }
    }
    status.type = type;
    return status;
};
/**
 * 建立 key 于 索引的缓存
 * @param start
 * @param end
 * @param source
 */
const createIdxCache$1 = (start, end, source) => {
    const map = new Map();
    for (; start < end; ++start) {
        Reflect.has(source, start) && map.set(source[start], start);
    }
    return map;
};
/**
 * 获取两个值对比之后的状态
 * @param originKey
 * @param targetKey
 * @param origin
 * @param target
 * @param pathStacks
 */
const sameValue = (originKey, targetKey, origin, target, pathStacks = []) => {
    const originValue = Reflect.get(origin, originKey);
    const targetValue = Reflect.get(target, targetKey);
    if (originValue !== targetValue) {
        const status = {
            type: CompareStatusEnum.None,
            path: pathStacks.join('.'),
            oldValue: targetValue
        };
        if (typeof originValue === 'object' && typeof targetValue === 'object') {
            // 递归去比较子节点属性的状态
            const { attrStatus, type } = diffAttrUtil(originValue, targetValue, pathStacks.slice());
            if (attrStatus) {
                if (!Reflect.has(status, 'attrStatus')) {
                    Reflect.set(status, 'attrStatus', {});
                }
                Object.assign(status.attrStatus, attrStatus);
                if (isArray(originValue) && isArray(targetValue)) {
                    status.type = type;
                }
            }
            else {
                return undefined;
            }
        }
        else {
            status.type = CompareStatusEnum.Update;
        }
        return updateStatusTypeByAttr(status);
    }
};
/**
 * 对象的属性对比
 * @param origin
 * @param target
 * @param pathStacks
 */
const diffObjAttr = (origin, target, pathStacks = []) => {
    // Reflect.ownKeys 会拿到 get 属性的值
    const originKeys = Object.keys(origin);
    const targetKeys = Object.keys(target);
    const status = {
        type: CompareStatusEnum.None,
        path: pathStacks.join('.')
    };
    const getPath = (key) => pathStacks.concat([key]).join('.');
    if (!originKeys.length && !targetKeys.length) {
        return status;
    }
    else if (originKeys.length && !targetKeys.length) {
        // 都是新增
        status.type = CompareStatusEnum.Update;
        each(originKeys, item => updateStatus$2(item, {
            type: CompareStatusEnum.Create,
            path: getPath(item)
        }, status));
        return status;
    }
    else if (!originKeys.length && targetKeys.length) {
        // 都是删除
        status.type = CompareStatusEnum.Update;
        each(targetKeys, item => updateStatus$2(item, {
            type: CompareStatusEnum.Delete,
            path: getPath(item)
        }, status));
        return status;
    }
    const filterIdx = new Set();
    let startOriginKeyIdx = 0, startOriginKey = originKeys[0], endOriginKeyIdx = originKeys.length - 1, endOriginKey = originKeys[originKeys.length - 1];
    let startTargetKeyIdx = 0, startTargetKey = targetKeys[0], endTargetKeyIdx = targetKeys.length - 1, endTargetKey = targetKeys[targetKeys.length - 1];
    let cacheIdMap;
    /**
     * 比较两个key是否相等
     * @param originKey
     * @param targetKey
     */
    const sameKey = (originKey, targetKey) => originKey === targetKey;
    /**
     * 对比key，设置状态
     * @param originKey
     * @param targetKey
     */
    const compare = (originKey, targetKey) => {
        // 获取两个状态
        const _status = sameValue(originKey, targetKey, origin, target, pathStacks.concat([originKey]));
        _status && updateStatus$2(originKey, _status, status);
    };
    while (startOriginKeyIdx <= endOriginKeyIdx && startTargetKeyIdx <= endTargetKeyIdx) {
        // 说明当前是查找过后的。直接跳过
        if (filterIdx.has(startTargetKey)) {
            startTargetKey = targetKeys[++startTargetKeyIdx];
        }
        else if (filterIdx.has(endTargetKey)) {
            endTargetKey = targetKeys[--endTargetKeyIdx];
        }
        else if (sameKey(startOriginKey, startTargetKey)) {
            compare(startOriginKey, startTargetKey);
            startOriginKey = originKeys[++startOriginKeyIdx];
            startTargetKey = targetKeys[++startTargetKeyIdx];
        }
        else if (sameKey(endOriginKey, endTargetKey)) {
            compare(endOriginKey, endTargetKey);
            endOriginKey = originKeys[--endOriginKeyIdx];
            endTargetKey = targetKeys[--endTargetKeyIdx];
        }
        else if (sameKey(endOriginKey, startTargetKey)) {
            compare(endOriginKey, startTargetKey);
            endOriginKey = originKeys[--endOriginKeyIdx];
            startTargetKey = targetKeys[++startTargetKeyIdx];
        }
        else if (sameKey(startOriginKey, endTargetKey)) {
            compare(startOriginKey, endTargetKey);
            startOriginKey = originKeys[++startOriginKeyIdx];
            endTargetKey = targetKeys[--endTargetKeyIdx];
        }
        else {
            if (!cacheIdMap) {
                cacheIdMap = createIdxCache$1(startTargetKeyIdx, endTargetKeyIdx, targetKeys);
            }
            const findIdx = cacheIdMap.get(startOriginKey);
            // 表示找到了
            if (!isUndefined(findIdx)) {
                // 进行对比。如果对比结果没有，则代表只是换了位置并没有更新值
                compare(startOriginKey, targetKeys[findIdx]);
                // 添加过滤
                filterIdx.add(startOriginKey);
            }
            else {
                // 找不到表示为新增
                updateStatus$2(startOriginKey, { type: CompareStatusEnum.Create, path: getPath(startOriginKey) }, status);
            }
            startOriginKey = originKeys[++startOriginKeyIdx];
        }
    }
    // target 遍历完成了。剩下的都是新增的
    if (startOriginKeyIdx <= endOriginKeyIdx) {
        for (; startOriginKeyIdx <= endOriginKeyIdx; ++startOriginKeyIdx)
            !filterIdx.has(originKeys[startOriginKeyIdx]) && updateStatus$2(originKeys[startOriginKeyIdx], {
                type: CompareStatusEnum.Create,
                path: getPath(originKeys[startOriginKeyIdx])
            }, status);
    }
    // origin 遍历完成了。剩下的都是删除的
    if (startTargetKeyIdx <= endTargetKeyIdx) {
        for (; startTargetKeyIdx <= endTargetKeyIdx; ++startTargetKeyIdx)
            !filterIdx.has(targetKeys[startTargetKeyIdx]) && updateStatus$2(targetKeys[startTargetKeyIdx], {
                type: CompareStatusEnum.Delete,
                path: getPath(targetKeys[startTargetKeyIdx])
            }, status);
    }
    return updateStatusTypeByAttr(status);
};
/**
 * 数组的属性对比。数组的每一项使用 diffAttr 对比
 * @param origin
 * @param target
 * @param pathStacks
 */
const diffArrayAttr = (origin, target, pathStacks = []) => {
    const status = {
        type: CompareStatusEnum.None,
        path: pathStacks.join('.')
    };
    const getPath = (key) => pathStacks.concat([key.toString()]).join('.');
    if (!origin?.length && !target?.length) {
        return status;
    }
    else if (origin.length && !target?.length) {
        // 都是新增
        status.type = CompareStatusEnum.Update;
        each(origin, (item, index) => updateStatus$2(index, {
            type: CompareStatusEnum.Create,
            path: getPath(index)
        }, status));
        return status;
    }
    else if (!origin.length && target.length) {
        // 都是删除
        status.type = CompareStatusEnum.Update;
        each(target, (item, index) => updateStatus$2(index, {
            type: CompareStatusEnum.Delete,
            path: getPath(index)
        }, status));
        return status;
    }
    let startOriginIdx = 0, startOrigin = origin[0];
    const endOriginIdx = origin.length - 1;
    let startTargetIdx = 0, startTarget = target[0];
    const endTargetIdx = target.length - 1;
    while (startOriginIdx <= endOriginIdx && startTargetIdx <= endTargetIdx) {
        const currentStatus = diffAttrUtil(startOrigin, startTarget, pathStacks.slice().concat([`${startOriginIdx}`]));
        // 如果两个相同的话
        if (currentStatus.type === CompareStatusEnum.Update || currentStatus.attrStatus) {
            updateStatus$2(startTargetIdx, currentStatus, status);
        }
        startOrigin = origin[++startOriginIdx];
        startTarget = target[++startTargetIdx];
    }
    // target遍历完成，代表有新增的
    if (startOriginIdx <= endOriginIdx) {
        for (; startOriginIdx <= endOriginIdx; ++startOriginIdx)
            updateStatus$2(startOriginIdx, {
                type: CompareStatusEnum.Create,
                path: getPath(startOriginIdx)
            }, status);
    }
    // origin遍历完成，代表有删除的
    if (startTargetIdx <= endTargetIdx) {
        // 这里代表着是修改的
        for (; startTargetIdx <= endTargetIdx; ++startTargetIdx)
            updateStatus$2(startTargetIdx, {
                type: CompareStatusEnum.Delete,
                path: getPath(startTargetIdx)
            }, status);
    }
    return updateStatusTypeByAttr(status);
};
/**
 * 属性对比，因为需要获取更换位置状态，所以需要区分数组/对象的对比。。
 * @param origin new
 * @param target old
 * @param pathStacks
 */
const diffAttrUtil = (origin, target, pathStacks = []) => {
    if (typeof origin === 'object' && typeof target === 'object') {
        if (isArray(origin) && isArray(target)) {
            return diffArrayAttr(origin, target, pathStacks);
        }
        return diffObjAttr(origin, target, pathStacks);
    }
    else {
        // 删除
        if (!isUndefined(origin) && isUndefined(target)) {
            return {
                type: CompareStatusEnum.Delete
            };
        }
        else if (isUndefined(origin) && !isUndefined(target)) { // 新增
            return {
                type: CompareStatusEnum.Create
            };
        }
        return {
            type: origin === target ? CompareStatusEnum.None : CompareStatusEnum.Update
        };
    }
};

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * const object = { 'a': 1 }
 * const other = { 'a': 1 }
 *
 * eq(object, object)
 * // => true
 *
 * eq(object, other)
 * // => false
 *
 * eq('a', 'a')
 * // => true
 *
 * eq('a', Object('a'))
 * // => false
 *
 * eq(NaN, NaN)
 * // => true
 */
function eq (value, other) {
    return value === other || (value !== value && other !== other)
}

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf (array, key) {
    let { length } = array;
    while (length--) {
        if (eq(array[length][0], key)) {
            return length
        }
    }
    return -1
}

class ListCache {

    /**
   * Creates an list cache object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
    constructor (entries) {
        let index = -1;
        const length = entries == null ? 0 : entries.length;

        this.clear();
        while (++index < length) {
            const entry = entries[index];
            this.set(entry[0], entry[1]);
        }
    }

    /**
   * Removes all key-value entries from the list cache.
   *
   * @memberOf ListCache
   */
    clear () {
        this.__data__ = [];
        this.size = 0;
    }

    /**
   * Removes `key` and its value from the list cache.
   *
   * @memberOf ListCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
    delete (key) {
        const data = this.__data__;
        const index = assocIndexOf(data, key);

        if (index < 0) {
            return false
        }
        const lastIndex = data.length - 1;
        if (index == lastIndex) {
            data.pop();
        } else {
            data.splice(index, 1);
        }
        --this.size;
        return true
    }

    /**
   * Gets the list cache value for `key`.
   *
   * @memberOf ListCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
    get (key) {
        const data = this.__data__;
        const index = assocIndexOf(data, key);
        return index < 0 ? undefined : data[index][1]
    }

    /**
   * Checks if a list cache value for `key` exists.
   *
   * @memberOf ListCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
    has (key) {
        return assocIndexOf(this.__data__, key) > -1
    }

    /**
   * Sets the list cache `key` to `value`.
   *
   * @memberOf ListCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the list cache instance.
   */
    set (key, value) {
        const data = this.__data__;
        const index = assocIndexOf(data, key);

        if (index < 0) {
            ++this.size;
            data.push([key, value]);
        } else {
            data[index][1] = value;
        }
        return this
    }
}

/** Used to stand-in for `undefined` hash values. */
const HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

class Hash {

    /**
   * Creates a hash object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
    constructor (entries) {
        let index = -1;
        const length = entries == null ? 0 : entries.length;

        this.clear();
        while (++index < length) {
            const entry = entries[index];
            this.set(entry[0], entry[1]);
        }
    }

    /**
   * Removes all key-value entries from the hash.
   *
   * @memberOf Hash
   */
    clear () {
        this.__data__ = Object.create(null);
        this.size = 0;
    }

    /**
   * Removes `key` and its value from the hash.
   *
   * @memberOf Hash
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
    delete (key) {
        const result = this.has(key) && delete this.__data__[key];
        this.size -= result ? 1 : 0;
        return result
    }

    /**
   * Gets the hash value for `key`.
   *
   * @memberOf Hash
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
    get (key) {
        const data = this.__data__;
        const result = data[key];
        return result === HASH_UNDEFINED$1 ? undefined : result
    }

    /**
   * Checks if a hash value for `key` exists.
   *
   * @memberOf Hash
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
    has (key) {
        const data = this.__data__;
        return data[key] !== undefined
    }

    /**
   * Sets the hash `key` to `value`.
   *
   * @memberOf Hash
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the hash instance.
   */
    set (key, value) {
        const data = this.__data__;
        this.size += this.has(key) ? 0 : 1;
        data[key] = value === undefined ? HASH_UNDEFINED$1 : value;
        return this
    }
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData ({ __data__ }, key) {
    const data = __data__;
    return isKeyable(key)
        ? data[typeof key === 'string' ? 'string' : 'hash']
        : data.map
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable (value) {
    const type = typeof value;
    return (type === 'string' || type === 'number' || type === 'symbol' || type === 'boolean')
        ? (value !== '__proto__')
        : (value === null)
}

class MapCache {

    /**
   * Creates a map cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
    constructor (entries) {
        let index = -1;
        const length = entries == null ? 0 : entries.length;

        this.clear();
        while (++index < length) {
            const entry = entries[index];
            this.set(entry[0], entry[1]);
        }
    }

    /**
   * Removes all key-value entries from the map.
   *
   * @memberOf MapCache
   */
    clear () {
        this.size = 0;
        this.__data__ = {
            'hash': new Hash,
            'map': new Map,
            'string': new Hash
        };
    }

    /**
   * Removes `key` and its value from the map.
   *
   * @memberOf MapCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
    delete (key) {
        const result = getMapData(this, key)['delete'](key);
        this.size -= result ? 1 : 0;
        return result
    }

    /**
   * Gets the map value for `key`.
   *
   * @memberOf MapCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
    get (key) {
        return getMapData(this, key).get(key)
    }

    /**
   * Checks if a map value for `key` exists.
   *
   * @memberOf MapCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
    has (key) {
        return getMapData(this, key).has(key)
    }

    /**
   * Sets the map `key` to `value`.
   *
   * @memberOf MapCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the map cache instance.
   */
    set (key, value) {
        const data = getMapData(this, key);
        const size = data.size;

        data.set(key, value);
        this.size += data.size == size ? 0 : 1;
        return this
    }
}

/** Used as the size to enable large array optimizations. */
const LARGE_ARRAY_SIZE = 200;

class Stack {

    /**
     * Creates a stack cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    constructor (entries) {
        const data = this.__data__ = new ListCache(entries);
        this.size = data.size;
    }

    /**
     * Removes all key-value entries from the stack.
     *
     * @memberOf Stack
     */
    clear () {
        this.__data__ = new ListCache;
        this.size = 0;
    }

    /**
     * Removes `key` and its value from the stack.
     *
     * @memberOf Stack
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    delete (key) {
        const data = this.__data__;
        const result = data['delete'](key);

        this.size = data.size;
        return result
    }

    /**
     * Gets the stack value for `key`.
     *
     * @memberOf Stack
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    get (key) {
        return this.__data__.get(key)
    }

    /**
     * Checks if a stack value for `key` exists.
     *
     * @memberOf Stack
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    has (key) {
        return this.__data__.has(key)
    }

    /**
     * Sets the stack `key` to `value`.
     *
     * @memberOf Stack
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the stack cache instance.
     */
    set (key, value) {
        let data = this.__data__;
        if (data instanceof ListCache) {
            const pairs = data.__data__;
            if (pairs.length < LARGE_ARRAY_SIZE - 1) {
                pairs.push([key, value]);
                this.size = ++data.size;
                return this
            }
            data = this.__data__ = new MapCache(pairs);
        }
        data.set(key, value);
        this.size = data.size;
        return this
    }
}

/**
 * A specialized version of `forEach` for arrays.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach (array, iteratee) {
    let index = -1;
    const length = array.length;

    while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
            break
        }
    }
    return array
}

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue (object, key, value) {
    if (key == '__proto__') {
        Object.defineProperty(object, key, {
            'configurable': true,
            'enumerable': true,
            'value': value,
            'writable': true
        });
    } else {
        object[key] = value;
    }
}

/** Used to check objects for own properties. */
const hasOwnProperty$4 = Object.prototype.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue (object, key, value) {
    const objValue = object[key];

    if (!(hasOwnProperty$4.call(object, key) && eq(objValue, value))) {
        if (value !== 0 || (1 / value) === (1 / objValue)) {
            baseAssignValue(object, key, value);
        }
    } else if (value === undefined && !(key in object)) {
        baseAssignValue(object, key, value);
    }
}

/** Detect free variable `global` from Node.js. */
const freeGlobal = typeof global === 'object' && global !== null && global.Object === Object && global;

/* global globalThis, self */

/** Detect free variable `globalThis` */
const freeGlobalThis = typeof globalThis === 'object' && globalThis !== null && globalThis.Object == Object && globalThis;

/** Detect free variable `self`. */
const freeSelf = typeof self === 'object' && self !== null && self.Object === Object && self;

/** Used as a reference to the global object. */
const root = freeGlobalThis || freeGlobal || freeSelf || Function('return this')();

/** Detect free variable `exports`. */
const freeExports$2 = typeof exports === 'object' && exports !== null && !exports.nodeType && exports;

/** Detect free variable `module`. */
const freeModule$2 = freeExports$2 && typeof module === 'object' && module !== null && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
const moduleExports$2 = freeModule$2 && freeModule$2.exports === freeExports$2;

/** Built-in value references. */
const Buffer$1 = moduleExports$2 ? root.Buffer : undefined, allocUnsafe = Buffer$1 ? Buffer$1.allocUnsafe : undefined;

/**
 * Creates a clone of `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer (buffer, isDeep) {
    if (isDeep) {
        return buffer.slice()
    }
    const length = buffer.length;
    const result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

    buffer.copy(result);
    return result
}

/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray (source, array) {
    let index = -1;
    const length = source.length;

    array || (array = new Array(length));
    while (++index < length) {
        array[index] = source[index];
    }
    return array
}

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject (source, props, object, customizer) {
    const isNew = !object;
    object || (object = {});

    for (const key of props) {
        let newValue = customizer
            ? customizer(object[key], source[key], key, object, source)
            : undefined;

        if (newValue === undefined) {
            newValue = source[key];
        }
        if (isNew) {
            baseAssignValue(object, key, newValue);
        } else {
            assignValue(object, key, newValue);
        }
    }
    return object
}

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer (arrayBuffer) {
    const result = new arrayBuffer.constructor(arrayBuffer.byteLength);
    new Uint8Array(result).set(new Uint8Array(arrayBuffer));
    return result
}

/**
 * Creates a clone of `dataView`.
 *
 * @private
 * @param {Object} dataView The data view to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned data view.
 */
function cloneDataView (dataView, isDeep) {
    const buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
    return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength)
}

/** Used to match `RegExp` flags from their coerced string values. */
const reFlags = /\w*$/;

/**
 * Creates a clone of `regexp`.
 *
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp (regexp) {
    const result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
    result.lastIndex = regexp.lastIndex;
    return result
}

/** Used to convert symbols to primitives and strings. */
const symbolValueOf$1 = Symbol.prototype.valueOf;

/**
 * Creates a clone of the `symbol` object.
 *
 * @private
 * @param {Object} symbol The symbol object to clone.
 * @returns {Object} Returns the cloned symbol object.
 */
function cloneSymbol (symbol) {
    return Object(symbolValueOf$1.call(symbol))
}

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray (typedArray, isDeep) {
    const buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
    return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length)
}

/** Built-in value references. */
const propertyIsEnumerable = Object.prototype.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
const nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
function getSymbols (object) {
    if (object == null) {
        return []
    }
    object = Object(object);
    return nativeGetSymbols(object).filter((symbol) => propertyIsEnumerable.call(object, symbol))
}

/**
 * Copies own symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbols (source, object) {
    return copyObject(source, getSymbols(source), object)
}

/**
 * Creates an array of the own and inherited enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
function getSymbolsIn (object) {
    const result = [];
    while (object) {
        result.push(...getSymbols(object));
        object = Object.getPrototypeOf(Object(object));
    }
    return result
}

/**
 * Copies own and inherited symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbolsIn (source, object) {
    return copyObject(source, getSymbolsIn(source), object)
}

const toString = Object.prototype.toString;

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function getTag (value) {
    if (value == null) {
        return value === undefined ? '[object Undefined]' : '[object Null]'
    }
    return toString.call(value)
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * isObjectLike({})
 * // => true
 *
 * isObjectLike([1, 2, 3])
 * // => true
 *
 * isObjectLike(Function)
 * // => false
 *
 * isObjectLike(null)
 * // => false
 */
function isObjectLike (value) {
    return typeof value === 'object' && value !== null
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object, else `false`.
 * @example
 *
 * isArguments(function() { return arguments }())
 * // => true
 *
 * isArguments([1, 2, 3])
 * // => false
 */
function isArguments (value) {
    return isObjectLike(value) && getTag(value) == '[object Arguments]'
}

/** Detect free variable `exports`. */
const freeExports$1 = typeof exports === 'object' && exports !== null && !exports.nodeType && exports;

/** Detect free variable `module`. */
const freeModule$1 = freeExports$1 && typeof module === 'object' && module !== null && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
const moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;

/** Built-in value references. */
const Buffer = moduleExports$1 ? root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
const nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * isBuffer(new Buffer(2))
 * // => true
 *
 * isBuffer(new Uint8Array(2))
 * // => false
 */
const isBuffer = nativeIsBuffer || (() => false);

/** Used as references for various `Number` constants. */
const MAX_SAFE_INTEGER$1 = 9007199254740991;

/** Used to detect unsigned integer values. */
const reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex (value, length) {
    const type = typeof value;
    length = length == null ? MAX_SAFE_INTEGER$1 : length;

    return !!length &&
    (type === 'number' ||
      (type !== 'symbol' && reIsUint.test(value))) &&
        (value > -1 && value % 1 == 0 && value < length)
}

/* eslint-disable no-empty */

/** Detect free variable `exports`. */
const freeExports = typeof exports === 'object' && exports !== null && !exports.nodeType && exports;

/** Detect free variable `module`. */
const freeModule = freeExports && typeof module === 'object' && module !== null && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
const moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
const freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
const nodeTypes = ((() => {
    try {
    /* Detect public `util.types` helpers for Node.js v10+. */
    /* Node.js deprecation code: DEP0103. */
        const typesHelper = freeModule && freeModule.require && freeModule.require('util').types;
        return typesHelper
            ? typesHelper
        /* Legacy process.binding('util') for Node.js earlier than v10. */
            : freeProcess && freeProcess.binding && freeProcess.binding('util')
    } catch (e) {}
})());

/** Used to match `toStringTag` values of typed arrays. */
const reTypedTag = /^\[object (?:Float(?:32|64)|(?:Int|Uint)(?:8|16|32)|Uint8Clamped)Array\]$/;

/* Node.js helper references. */
const nodeIsTypedArray = nodeTypes && nodeTypes.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * isTypedArray(new Uint8Array)
 * // => true
 *
 * isTypedArray([])
 * // => false
 */
const isTypedArray = nodeIsTypedArray
    ? (value) => nodeIsTypedArray(value)
    : (value) => isObjectLike(value) && reTypedTag.test(getTag(value));

/** Used to check objects for own properties. */
const hasOwnProperty$3 = Object.prototype.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys (value, inherited) {
    const isArr = Array.isArray(value);
    const isArg = !isArr && isArguments(value);
    const isBuff = !isArr && !isArg && isBuffer(value);
    const isType = !isArr && !isArg && !isBuff && isTypedArray(value);
    const skipIndexes = isArr || isArg || isBuff || isType;
    const length = value.length;
    const result = new Array(skipIndexes ? length : 0);
    let index = skipIndexes ? -1 : length;
    while (++index < length) {
        result[index] = `${index}`;
    }
    for (const key in value) {
        if ((inherited || hasOwnProperty$3.call(value, key)) &&
        !(skipIndexes && (
        // Safari 9 has enumerable `arguments.length` in strict mode.
            (key === 'length' ||
           // Skip index properties.
           isIndex(key, length))
        ))) {
            result.push(key);
        }
    }
    return result
}

/** Used as references for various `Number` constants. */
const MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * isLength(3)
 * // => true
 *
 * isLength(Number.MIN_VALUE)
 * // => false
 *
 * isLength(Infinity)
 * // => false
 *
 * isLength('3')
 * // => false
 */
function isLength (value) {
    return typeof value === 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER
}

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * isArrayLike([1, 2, 3])
 * // => true
 *
 * isArrayLike(document.body.children)
 * // => true
 *
 * isArrayLike('abc')
 * // => true
 *
 * isArrayLike(Function)
 * // => false
 */
function isArrayLike (value) {
    return value != null && typeof value !== 'function' && isLength(value.length)
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @since 0.1.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @see values, valuesIn
 * @example
 *
 * function Foo() {
 *   this.a = 1
 *   this.b = 2
 * }
 *
 * Foo.prototype.c = 3
 *
 * keys(new Foo)
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * keys('hi')
 * // => ['0', '1']
 */
function keys (object) {
    return isArrayLike(object)
        ? arrayLikeKeys(object)
        : Object.keys(Object(object))
}

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys (object) {
    const result = keys(object);
    if (!Array.isArray(object)) {
        result.push(...getSymbols(object));
    }
    return result
}

/**
 * Creates an array of own and inherited enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeysIn (object) {
    const result = [];
    for (const key in object) {
        result.push(key);
    }
    if (!Array.isArray(object)) {
        result.push(...getSymbolsIn(object));
    }
    return result
}

/** Used for built-in method references. */
const objectProto = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype (value) {
    const Ctor = value && value.constructor;
    const proto = (typeof Ctor === 'function' && Ctor.prototype) || objectProto;

    return value === proto
}

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject (object) {
    return (typeof object.constructor === 'function' && !isPrototype(object))
        ? Object.create(Object.getPrototypeOf(object))
        : {}
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * isObject({})
 * // => true
 *
 * isObject([1, 2, 3])
 * // => true
 *
 * isObject(Function)
 * // => true
 *
 * isObject(null)
 * // => false
 */
function isObject (value) {
    const type = typeof value;
    return value != null && (type === 'object' || type === 'function')
}

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn (object) {
    const result = [];
    for (const key in object) {
        result.push(key);
    }
    return result
}

/** Used to compose bitmasks for cloning. */
const CLONE_DEEP_FLAG$1 = 1;
const CLONE_FLAT_FLAG = 2;
const CLONE_SYMBOLS_FLAG$1 = 4;

/** `Object#toString` result references. */
const argsTag$1 = '[object Arguments]';
const arrayTag$1 = '[object Array]';
const boolTag$1 = '[object Boolean]';
const dateTag$1 = '[object Date]';
const errorTag$1 = '[object Error]';
const mapTag$1 = '[object Map]';
const numberTag$1 = '[object Number]';
const objectTag$1 = '[object Object]';
const regexpTag$1 = '[object RegExp]';
const setTag$1 = '[object Set]';
const stringTag$1 = '[object String]';
const symbolTag$1 = '[object Symbol]';
const weakMapTag = '[object WeakMap]';

const arrayBufferTag$1 = '[object ArrayBuffer]';
const dataViewTag$1 = '[object DataView]';
const float32Tag = '[object Float32Array]';
const float64Tag = '[object Float64Array]';
const int8Tag = '[object Int8Array]';
const int16Tag = '[object Int16Array]';
const int32Tag = '[object Int32Array]';
const uint8Tag = '[object Uint8Array]';
const uint8ClampedTag = '[object Uint8ClampedArray]';
const uint16Tag = '[object Uint16Array]';
const uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `clone`. */
const cloneableTags = {};
cloneableTags[argsTag$1] = cloneableTags[arrayTag$1] =
    cloneableTags[arrayBufferTag$1] = cloneableTags[dataViewTag$1] =
    cloneableTags[boolTag$1] = cloneableTags[dateTag$1] =
    cloneableTags[float32Tag] = cloneableTags[float64Tag] =
    cloneableTags[int8Tag] = cloneableTags[int16Tag] =
    cloneableTags[int32Tag] = cloneableTags[mapTag$1] =
    cloneableTags[numberTag$1] = cloneableTags[objectTag$1] =
    cloneableTags[regexpTag$1] = cloneableTags[setTag$1] =
    cloneableTags[stringTag$1] = cloneableTags[symbolTag$1] =
    cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
    cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag$1] = cloneableTags[weakMapTag] = false;

/** Used to check objects for own properties. */
const hasOwnProperty$2 = Object.prototype.hasOwnProperty;

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag (object, tag, isDeep) {
    const Ctor = object.constructor;
    switch (tag) {
        case arrayBufferTag$1:
            return cloneArrayBuffer(object)

        case boolTag$1:
        case dateTag$1:
            return new Ctor(+object)

        case dataViewTag$1:
            return cloneDataView(object, isDeep)

        case float32Tag: case float64Tag:
        case int8Tag: case int16Tag: case int32Tag:
        case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
            return cloneTypedArray(object, isDeep)

        case mapTag$1:
            return new Ctor

        case numberTag$1:
        case stringTag$1:
            return new Ctor(object)

        case regexpTag$1:
            return cloneRegExp(object)

        case setTag$1:
            return new Ctor

        case symbolTag$1:
            return cloneSymbol(object)
    }
}

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray (array) {
    const { length } = array;
    const result = new array.constructor(length);

    // Add properties assigned by `RegExp#exec`.
    if (length && typeof array[0] === 'string' && hasOwnProperty$2.call(array, 'index')) {
        result.index = array.index;
        result.input = array.input;
    }
    return result
}

/**
 * The base implementation of `clone` and `cloneDeep` which tracks
 * traversed objects.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {number} bitmask The bitmask flags.
 *  1 - Deep clone
 *  2 - Flatten inherited properties
 *  4 - Clone symbols
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone (value, bitmask, customizer, key, object, stack) {
    let result;
    const isDeep = bitmask & CLONE_DEEP_FLAG$1;
    const isFlat = bitmask & CLONE_FLAT_FLAG;
    const isFull = bitmask & CLONE_SYMBOLS_FLAG$1;

    if (customizer) {
        result = object ? customizer(value, key, object, stack) : customizer(value);
    }
    if (result !== undefined) {
        return result
    }
    if (!isObject(value)) {
        return value
    }
    const isArr = Array.isArray(value);
    const tag = getTag(value);
    if (isArr) {
        result = initCloneArray(value);
        if (!isDeep) {
            return copyArray(value, result)
        }
    } else {
        const isFunc = typeof value === 'function';

        if (isBuffer(value)) {
            return cloneBuffer(value, isDeep)
        }
        if (tag == objectTag$1 || tag == argsTag$1 || (isFunc && !object)) {
            result = (isFlat || isFunc) ? {} : initCloneObject(value);
            if (!isDeep) {
                return isFlat
                    ? copySymbolsIn(value, copyObject(value, keysIn(value), result))
                    : copySymbols(value, Object.assign(result, value))
            }
        } else {
            if (isFunc || !cloneableTags[tag]) {
                return object ? value : {}
            }
            result = initCloneByTag(value, tag, isDeep);
        }
    }
    // Check for circular references and return its corresponding clone.
    stack || (stack = new Stack);
    const stacked = stack.get(value);
    if (stacked) {
        return stacked
    }
    stack.set(value, result);

    if (tag == mapTag$1) {
        value.forEach((subValue, key) => {
            result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
        });
        return result
    }

    if (tag == setTag$1) {
        value.forEach((subValue) => {
            result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
        });
        return result
    }

    if (isTypedArray(value)) {
        return result
    }

    const keysFunc = isFull
        ? (isFlat ? getAllKeysIn : getAllKeys)
        : (isFlat ? keysIn : keys);

    const props = isArr ? undefined : keysFunc(value);
    arrayEach(props || value, (subValue, key) => {
        if (props) {
            key = subValue;
            subValue = value[key];
        }
        // Recursively populate clone (susceptible to call stack limits).
        assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
    });
    return result
}

/** Used to stand-in for `undefined` hash values. */
const HASH_UNDEFINED = '__lodash_hash_undefined__';

class SetCache {

    /**
   * Creates an array cache object to store unique values.
   *
   * @private
   * @constructor
   * @param {Array} [values] The values to cache.
   */
    constructor (values) {
        let index = -1;
        const length = values == null ? 0 : values.length;

        this.__data__ = new MapCache;
        while (++index < length) {
            this.add(values[index]);
        }
    }

    /**
   * Adds `value` to the array cache.
   *
   * @memberOf SetCache
   * @alias push
   * @param {*} value The value to cache.
   * @returns {Object} Returns the cache instance.
   */
    add (value) {
        this.__data__.set(value, HASH_UNDEFINED);
        return this
    }

    /**
   * Checks if `value` is in the array cache.
   *
   * @memberOf SetCache
   * @param {*} value The value to search for.
   * @returns {boolean} Returns `true` if `value` is found, else `false`.
   */
    has (value) {
        return this.__data__.has(value)
    }
}

SetCache.prototype.push = SetCache.prototype.add;

/**
 * Checks if `predicate` returns truthy for **any** element of `array`.
 * Iteration is stopped once `predicate` returns truthy. The predicate is
 * invoked with three arguments: (value, index, array).
 *
 * @since 5.0.0
 * @category Array
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 * @example
 *
 * some([null, 0, 'yes', false], Boolean)
 * // => true
 */
function some (array, predicate) {
    let index = -1;
    const length = array == null ? 0 : array.length;

    while (++index < length) {
        if (predicate(array[index], index, array)) {
            return true
        }
    }
    return false
}

/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas (cache, key) {
    return cache.has(key)
}

/** Used to compose bitmasks for value comparisons. */
const COMPARE_PARTIAL_FLAG$3 = 1;
const COMPARE_UNORDERED_FLAG$1 = 2;

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays (array, other, bitmask, customizer, equalFunc, stack) {
    const isPartial = bitmask & COMPARE_PARTIAL_FLAG$3;
    const arrLength = array.length;
    const othLength = other.length;

    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false
    }
    // Assume cyclic values are equal.
    const stacked = stack.get(array);
    if (stacked && stack.get(other)) {
        return stacked == other
    }
    let index = -1;
    let result = true;
    const seen = (bitmask & COMPARE_UNORDERED_FLAG$1) ? new SetCache : undefined;

    stack.set(array, other);
    stack.set(other, array);

    // Ignore non-index properties.
    while (++index < arrLength) {
        let compared;
        const arrValue = array[index];
        const othValue = other[index];

        if (customizer) {
            compared = isPartial
                ? customizer(othValue, arrValue, index, other, array, stack)
                : customizer(arrValue, othValue, index, array, other, stack);
        }
        if (compared !== undefined) {
            if (compared) {
                continue
            }
            result = false;
            break
        }
        // Recursively compare arrays (susceptible to call stack limits).
        if (seen) {
            if (!some(other, (othValue, othIndex) => {
                if (!cacheHas(seen, othIndex) &&
          (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
                    return seen.push(othIndex)
                }
            })) {
                result = false;
                break
            }
        } else if (!(
            arrValue === othValue ||
            equalFunc(arrValue, othValue, bitmask, customizer, stack)
        )) {
            result = false;
            break
        }
    }
    stack['delete'](array);
    stack['delete'](other);
    return result
}

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray (map) {
    let index = -1;
    const result = new Array(map.size);

    map.forEach((value, key) => {
        result[++index] = [key, value];
    });
    return result
}

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray (set) {
    let index = -1;
    const result = new Array(set.size);

    set.forEach((value) => {
        result[++index] = value;
    });
    return result
}

/* eslint-disable no-case-declarations */

/** Used to compose bitmasks for value comparisons. */
const COMPARE_PARTIAL_FLAG$2 = 1;
const COMPARE_UNORDERED_FLAG = 2;

/** `Object#toString` result references. */
const boolTag = '[object Boolean]';
const dateTag = '[object Date]';
const errorTag = '[object Error]';
const mapTag = '[object Map]';
const numberTag = '[object Number]';
const regexpTag = '[object RegExp]';
const setTag = '[object Set]';
const stringTag = '[object String]';
const symbolTag = '[object Symbol]';

const arrayBufferTag = '[object ArrayBuffer]';
const dataViewTag = '[object DataView]';

/** Used to convert symbols to primitives and strings. */
const symbolValueOf = Symbol.prototype.valueOf;

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag (object, other, tag, bitmask, customizer, equalFunc, stack) {
    switch (tag) {
        case dataViewTag:
            if ((object.byteLength != other.byteLength) ||
          (object.byteOffset != other.byteOffset)) {
                return false
            }
            object = object.buffer;
            other = other.buffer;

        case arrayBufferTag:
            if ((object.byteLength != other.byteLength) ||
          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
                return false
            }
            return true

        case boolTag:
        case dateTag:
        case numberTag:
            // Coerce booleans to `1` or `0` and dates to milliseconds.
            // Invalid dates are coerced to `NaN`.
            return eq(+object, +other)

        case errorTag:
            return object.name == other.name && object.message == other.message

        case regexpTag:
        case stringTag:
            // Coerce regexes to strings and treat strings, primitives and objects,
            // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
            // for more details.
            return object == `${other}`

        case mapTag:
            let convert = mapToArray;

        case setTag:
            const isPartial = bitmask & COMPARE_PARTIAL_FLAG$2;
            convert || (convert = setToArray);

            if (object.size != other.size && !isPartial) {
                return false
            }
            // Assume cyclic values are equal.
            const stacked = stack.get(object);
            if (stacked) {
                return stacked == other
            }
            bitmask |= COMPARE_UNORDERED_FLAG;

            // Recursively compare objects (susceptible to call stack limits).
            stack.set(object, other);
            const result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
            stack['delete'](object);
            return result

        case symbolTag:
            if (symbolValueOf) {
                return symbolValueOf.call(object) == symbolValueOf.call(other)
            }
    }
    return false
}

/** Used to compose bitmasks for value comparisons. */
const COMPARE_PARTIAL_FLAG$1 = 1;

/** Used to check objects for own properties. */
const hasOwnProperty$1 = Object.prototype.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects (object, other, bitmask, customizer, equalFunc, stack) {
    const isPartial = bitmask & COMPARE_PARTIAL_FLAG$1;
    const objProps = getAllKeys(object);
    const objLength = objProps.length;
    const othProps = getAllKeys(other);
    const othLength = othProps.length;

    if (objLength != othLength && !isPartial) {
        return false
    }
    let key;
    let index = objLength;
    while (index--) {
        key = objProps[index];
        if (!(isPartial ? key in other : hasOwnProperty$1.call(other, key))) {
            return false
        }
    }
    // Assume cyclic values are equal.
    const stacked = stack.get(object);
    if (stacked && stack.get(other)) {
        return stacked == other
    }
    let result = true;
    stack.set(object, other);
    stack.set(other, object);

    let compared;
    let skipCtor = isPartial;
    while (++index < objLength) {
        key = objProps[index];
        const objValue = object[key];
        const othValue = other[key];

        if (customizer) {
            compared = isPartial
                ? customizer(othValue, objValue, key, other, object, stack)
                : customizer(objValue, othValue, key, object, other, stack);
        }
        // Recursively compare objects (susceptible to call stack limits).
        if (!(compared === undefined
            ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
            : compared
        )) {
            result = false;
            break
        }
        skipCtor || (skipCtor = key == 'constructor');
    }
    if (result && !skipCtor) {
        const objCtor = object.constructor;
        const othCtor = other.constructor;

        // Non `Object` object instances with different constructors are not equal.
        if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor === 'function' && objCtor instanceof objCtor &&
          typeof othCtor === 'function' && othCtor instanceof othCtor)) {
            result = false;
        }
    }
    stack['delete'](object);
    stack['delete'](other);
    return result
}

/** Used to compose bitmasks for value comparisons. */
const COMPARE_PARTIAL_FLAG = 1;

/** `Object#toString` result references. */
const argsTag = '[object Arguments]';
const arrayTag = '[object Array]';
const objectTag = '[object Object]';

/** Used to check objects for own properties. */
const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep (object, other, bitmask, customizer, equalFunc, stack) {
    let objIsArr = Array.isArray(object);
    const othIsArr = Array.isArray(other);
    let objTag = objIsArr ? arrayTag : getTag(object);
    let othTag = othIsArr ? arrayTag : getTag(other);

    objTag = objTag == argsTag ? objectTag : objTag;
    othTag = othTag == argsTag ? objectTag : othTag;

    let objIsObj = objTag == objectTag;
    const othIsObj = othTag == objectTag;
    const isSameTag = objTag == othTag;

    if (isSameTag && isBuffer(object)) {
        if (!isBuffer(other)) {
            return false
        }
        objIsArr = true;
        objIsObj = false;
    }
    if (isSameTag && !objIsObj) {
        stack || (stack = new Stack);
        return (objIsArr || isTypedArray(object))
            ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
            : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack)
    }
    if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
        const objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__');
        const othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

        if (objIsWrapped || othIsWrapped) {
            const objUnwrapped = objIsWrapped ? object.value() : object;
            const othUnwrapped = othIsWrapped ? other.value() : other;

            stack || (stack = new Stack);
            return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack)
        }
    }
    if (!isSameTag) {
        return false
    }
    stack || (stack = new Stack);
    return equalObjects(object, other, bitmask, customizer, equalFunc, stack)
}

/**
 * The base implementation of `isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual (value, other, bitmask, customizer, stack) {
    if (value === other) {
        return true
    }
    if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
        return value !== value && other !== other
    }
    return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack)
}

// XXX 这个文件夹下的代码都是从loadsh copy过来的
/** Used to compose bitmasks for cloning. */
const CLONE_DEEP_FLAG = 1;
const CLONE_SYMBOLS_FLAG = 4;
/**
 * This method is like `clone` except that it recursively clones `value`.
 * Object inheritance is preserved.
 *
 * @since 1.0.0
 * @category Lang
 * @param {*} value The value to recursively clone.
 * @returns {*} Returns the deep cloned value.
 * @see clone
 * @example
 *
 * const objects = [{ 'a': 1 }, { 'b': 2 }]
 *
 * const deep = cloneDeep(objects)
 * console.log(deep[0] === objects[0])
 * // => false
 */
const cloneDeep = (value) => {
    return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
};
/**
 * Performs a deep comparison between two values to determine if they are
 * equivalent.
 *
 * **Note:** This method supports comparing arrays, array buffers, booleans,
 * date objects, error objects, maps, numbers, `Object` objects, regexes,
 * sets, strings, symbols, and typed arrays. `Object` objects are compared
 * by their own, not inherited, enumerable properties. Functions and DOM
 * nodes are **not** supported.
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.isEqual(object, other);
 * // => true
 *
 * object === other;
 * // => false
 */
const isEqual = (value, other) => {
    return baseIsEqual(value, other);
};

const defaultConfig = {
    childrenKey: 'children',
    someKey: 'id',
    nameKey: 'name'
};
/**
 * 获取config
 */
const getConfig = () => defaultConfig;
const getSomeValue = (data) => Reflect.get(data.compareData, defaultConfig.someKey);
const getNameValue = (data) => Reflect.get(data, defaultConfig.nameKey);
/**
 * 修改默认config
 * @param config config
 */
const updateConfig$1 = (config) => {
    // nameKey 不能为id
    if (config.nameKey === 'id') {
        console.warn('nameKey can not be id');
        // 恢复为默认值
        config.nameKey = 'name';
    }
    Object.assign(defaultConfig, config);
};

const setChangeStatus = (source, changeInfo) => {
    source.changeInfo = changeInfo;
    // 如果状态为 None，则修改为 Change
    if (source.status.type === CompareStatusEnum.None) {
        source.status.type = CompareStatusEnum.Change;
    }
};
/**
 * 创建 id => index 缓存
 * @param start
 * @param end
 * @param source
 */
const createIdxCache = (start, end, source) => {
    const idMap = new Map();
    for (; start < end; ++start) {
        const id = getSomeValue(source[start]);
        if (!isUndefined(id))
            idMap.set(id, start);
    }
    return idMap;
};
/**
 * 通过对比数据的id对比是否相同节点，如果相同则进行进一步的对比
 * @param origin
 * @param target
 */
const sameNode$1 = (origin, target) => getSomeValue(origin) === getSomeValue(target);
/**
 * 创建被删除的节点
 * @param compareTree
 * @param parent
 */
const createDeleteNode = (compareTree, parent) => {
    const diffDeleteChildren = (compareTree, resultChildren = []) => {
        compareTree.children && each(compareTree.children, children => resultChildren.push(createDeleteNode(children, compareTree)));
        return resultChildren;
    };
    return createCompareNode({
        name: compareTree.name,
        icon: compareTree.icon,
        treeType: compareTree.treeType,
        // 为了避免影响到基础数据，这里直接深度克隆一份
        compareData: cloneDeep(compareTree.compareData),
        checkUnEnable: compareTree.checkUnEnable,
        status: {
            type: CompareStatusEnum.Delete
        },
        children: diffDeleteChildren(compareTree),
        // XXX 后续优化
        target: cloneDeep(compareTree.target)
    }, parent, true);
};
/**
 * 修改当前节点以及子节点状态
 * @param compareTree
 * @param statusType
 */
const updateStatus$1 = (compareTree, statusType) => {
    compareTree.status = {
        type: statusType
    };
    if (compareTree.children) {
        each(compareTree.children, children => updateStatus$1(children, statusType));
    }
    return compareTree;
};
/**
 * 根据子节点的状态获取当前节点的状态。需要处理当前节点的子节点的 changeInfo
 * @param compareTree
 * @param currentStatus
 * @param children
 */
const parseStatus$1 = (compareTree, currentStatus, children) => {
    if (children.length) {
        let isUpdate = false;
        const childrenChangeInfo = {};
        each(children, childrenItem => {
            const { status: { type }, changeInfo } = childrenItem;
            if (!isUpdate && type !== CompareStatusEnum.None) {
                isUpdate = true;
            }
            // 维护子节点跟换位置信息状态
            if (changeInfo) {
                // 收集子节点对应的信息
                Reflect.set(childrenChangeInfo, getSomeValue(childrenItem), changeInfo);
            }
        });
        // 如果状态不全等等于 None 就是 update
        if (isUpdate && currentStatus.type === CompareStatusEnum.None) {
            currentStatus.type = CompareStatusEnum.Update;
        }
        if (Reflect.ownKeys(childrenChangeInfo).length) {
            compareTree.childrenChangeInfo = childrenChangeInfo;
        }
    }
    compareTree.status = currentStatus;
};
/**
 * 使用diff算法对比两个节点。 XXX 注意这里直接是修改了 origin 源对象的
 * @param origin new
 * @param target old
 * @param parent origin 对象的 parent （new parent）
 */
const diffCompareTreeUtil = (origin, target, parent) => {
    // run cycle
    cycle.addCycle('beforeCompare', origin, target, parent);
    // 开始比较之前先校验
    if (!origin && !target || (!origin.length && !target.length)) {
        return [];
    }
    else if (origin.length && !target.length) {
        // 全部都是新增的
        each(origin, item => updateStatus$1(item, CompareStatusEnum.Create));
        cycle.addCycle('afterCompare', origin, target, parent);
        return origin;
    }
    else if (!origin.length && target.length) {
        const newOrigin = origin ? origin : [];
        // 全部都是删除的
        each(target, children => {
            newOrigin.push(createDeleteNode(children, parent));
        });
        cycle.addCycle('afterCompare', newOrigin, target, parent);
        return newOrigin;
    }
    // 因为target数据传递过来不能直接修改，所以增加过滤的id列表
    const filterIds = new Set();
    let startOriginIdx = 0, startOrigin = origin[0], endOriginIdx = origin.length - 1, endOrigin = origin[origin.length - 1];
    let startTargetIdx = 0, startTarget = target[0], endTargetIdx = target.length - 1, endTarget = target[target.length - 1];
    let cacheIdMap = undefined;
    while (startOriginIdx <= endOriginIdx && startTargetIdx <= endTargetIdx) {
        if (isUndefined(startOrigin)) {
            startOrigin = origin[++startOriginIdx];
        }
        else if (isUndefined(endOrigin)) {
            endOrigin = origin[--endOriginIdx];
        }
        else if (isUndefined(startTarget) || filterIds.has(getSomeValue(startTarget))) {
            startTarget = target[++startTargetIdx];
        }
        else if (isUndefined(endTarget) || filterIds.has(getSomeValue(endTarget))) {
            endTarget = target[--endTargetIdx];
        }
        else if (sameNode$1(startOrigin, startTarget)) {
            // 对比子节点
            const newChildren = diffCompareTreeUtil(startOrigin.children, startTarget.children, startOrigin);
            // 处理节点状态信息
            parseStatus$1(startOrigin, diffAttr(startOrigin.compareData, startTarget.compareData), newChildren);
            startOrigin = origin[++startOriginIdx];
            startTarget = target[++startTargetIdx];
        }
        else if (sameNode$1(endOrigin, endTarget)) {
            const newChildren = diffCompareTreeUtil(endOrigin.children, endTarget.children, endOrigin);
            parseStatus$1(endOrigin, diffAttr(endOrigin.compareData, endTarget.compareData), newChildren);
            endOrigin = origin[--endOriginIdx];
            endTarget = target[--endTargetIdx];
        }
        else if (sameNode$1(endOrigin, startTarget)) {
            const newChildren = diffCompareTreeUtil(endOrigin.children, startTarget.children, endOrigin);
            parseStatus$1(endOrigin, diffAttr(endOrigin.compareData, startTarget.compareData), newChildren);
            // 存储位置更换的信息
            setChangeStatus(endOrigin, { from: startTargetIdx, to: endOriginIdx });
            endOrigin = origin[--endOriginIdx];
            startTarget = target[++startTargetIdx];
        }
        else if (sameNode$1(startOrigin, endTarget)) {
            const newChildren = diffCompareTreeUtil(startOrigin.children, endTarget.children, startOrigin);
            parseStatus$1(startOrigin, diffAttr(startOrigin.compareData, endTarget.compareData), newChildren);
            setChangeStatus(endOrigin, { from: endTargetIdx, to: startOriginIdx });
            startOrigin = origin[++startOriginIdx];
            endTarget = target[--endTargetIdx];
        }
        else {
            if (!cacheIdMap?.size) {
                cacheIdMap = createIdxCache(startTargetIdx, endTargetIdx, target);
            }
            const findIdx = cacheIdMap.get(getSomeValue(startOrigin));
            if (!isUndefined(findIdx)) {
                const newChildren = diffCompareTreeUtil(startOrigin.children, target[findIdx].children, startOrigin);
                parseStatus$1(startOrigin, diffAttr(startOrigin.compareData, target[findIdx].compareData), newChildren);
                setChangeStatus(startOrigin, { from: findIdx, to: startOriginIdx });
                filterIds.add(getSomeValue(target[findIdx]));
            }
            else {
                // 设置状态表示为新增
                updateStatus$1(startOrigin, CompareStatusEnum.Create);
            }
            startOrigin = origin[++startOriginIdx];
        }
    }
    // target遍历完成，代表有新增的
    if (startOriginIdx <= endOriginIdx) {
        // 将状态修改为新增
        for (; startOriginIdx <= endOriginIdx; ++startOriginIdx)
            updateStatus$1(origin[startOriginIdx], CompareStatusEnum.Create);
    }
    // origin遍历完成，代表有删除的
    if (startTargetIdx <= endTargetIdx) {
        // 表示还有删除的
        for (; startTargetIdx <= endTargetIdx; startTargetIdx++) {
            const item = target[startTargetIdx];
            if (!filterIds.has(getSomeValue(item))) {
                origin.splice(startTargetIdx, 0, createDeleteNode(item, origin[0]?.parent));
            }
        }
    }
    cacheIdMap?.clear();
    cycle.addCycle('afterCompare', origin, target, parent);
    return origin;
};

class Cycle {
    uid = 0;
    quoteId = new Set();
    cycleStacks = new Map();
    cycleCallback = new Map();
    getCycleArgs(cycleType) {
        if (this.cycleStacks.has(cycleType)) {
            return this.cycleStacks.get(cycleType);
        }
        const stacks = [];
        this.cycleStacks.set(cycleType, stacks);
        return stacks;
    }
    runCallback = (callback, args, argsNum) => {
        if (!args)
            return;
        switch (argsNum) {
            case 1:
                callback(args[0]);
                break;
            case 2:
                callback(args[0], args[1]);
                break;
            case 3:
                callback(args[0], args[1], args[2]);
                break;
            case 4:
                callback(args[0], args[1], args[2], args[3]);
        }
    };
    addCycle(cycleType, ...args) {
        this.getCycleArgs(cycleType).push({
            uid: ++this.uid,
            args
        });
        // run cyce
        each(this.cycleCallback.get(cycleType) ?? [], item => {
            if (!this.quoteId.has(item.uid)) {
                this.quoteId.add(item.uid);
                item.callback(...args);
            }
        });
    }
    runCycle(cycleType, callback) {
        const item = { uid: ++this.uid, callback };
        if (this.cycleCallback.has(cycleType)) {
            this.cycleCallback.get(cycleType).push(item);
        }
        else {
            this.cycleCallback.set(cycleType, [item]);
        }
        const cycleArgs = this.getCycleArgs(cycleType);
        const argsList = [];
        cycleArgs.length && each(cycleArgs, cycleItem => {
            if (!this.quoteId.has(cycleItem.uid)) {
                this.quoteId.add(cycleItem.uid);
                argsList.push(cycleItem.args);
            }
        });
        return argsList;
    }
    /**
     * 创建节点之前调用
     * @param callback 回调
     */
    beforeCreateCompareNode(callback) {
        const [args] = this.runCycle('beforeCreateCompareNode', callback);
        this.runCallback(callback, args, 1);
    }
    /**
     * 比较之前调用
     * @param callback
     */
    beforeCompare(callback) {
        const [args] = this.runCycle('beforeCompare', callback);
        this.runCallback(callback, args, 3);
    }
    /**
     * 比较之后调用
     * @param callback
     * @returns
     */
    afterCompare(callback) {
        const [args] = this.runCycle('afterCompare', callback);
        this.runCallback(callback, args, 3);
    }
    /**
     * beforeDiffStatus
     * @param callback
     */
    beforeDiffStatus(callback) {
        const [args] = this.runCycle('beforeDiffStatus', callback);
        this.runCallback(callback, args, 4);
    }
    /**
     *
     * @param callback
     */
    afterDiffStatus(callback) {
        const [args] = this.runCycle('afterDiffStatus', callback);
        this.runCallback(callback, args, 4);
    }
    /**
     * afterCompareStatus
     * @param callback
     */
    afterCompareStatus(callback) {
        const [args] = this.runCycle('afterCompareStatus', callback);
        this.runCallback(callback, args, 2);
    }
    /**
     * beforeCloneCompareTree
     * @param callback
     */
    beforeCloneCompareTree(callback) {
        const [args] = this.runCycle('beforeCloneCompareTree', callback);
        this.runCallback(callback, args, 3);
    }
    /**
     * beforeParse
     * @param callback
     */
    beforeParse(callback) {
        const [args] = this.runCycle('beforeParse', callback);
        this.runCallback(callback, args, 2);
    }
    /**
     * afterParse
     * @param callback
     */
    afterParse(callback) {
        const [args] = this.runCycle('afterParse', callback);
        this.runCallback(callback, args, 3);
    }
}
var cycle$1 = new Cycle();

/**
 * 设置冲突
 * @param origin
 * @param target
 */
const setConflict = (origin, target) => {
    const oType = origin.type;
    const tType = target.type;
    if ((oType === tType && (oType === CompareStatusEnum.Update || oType === CompareStatusEnum.Create)) || oType !== tType) {
        // 修改状态
        origin.type = CompareStatusEnum.Conflict;
        target.type = CompareStatusEnum.Conflict;
    }
};
/**
 * 处理状态，根据属性维护当前状态
 * @param origin
 * @param target
 */
const updateStatus = (origin, target) => {
    if (origin.type === CompareStatusEnum.Create && target.type === CompareStatusEnum.Create) {
        setConflict(origin, target);
        return;
    }
    if (!origin?.attrStatus || !target?.attrStatus)
        return;
    const originKeys = Object.keys(origin.attrStatus ?? {});
    const targetKeys = Object.keys(target.attrStatus ?? {});
    setConflict(origin, target);
    let index = 0;
    while (index <= originKeys.length) {
        const key = originKeys[index];
        const originStatus = origin.attrStatus?.[key];
        const targetStatus = target.attrStatus?.[key];
        if (originStatus && targetStatus) {
            // 如果两边都是修改，或者两边状态不一致 则修改为 conflict
            setConflict(originStatus, targetStatus);
            // 如果有子节点，继续走
            if (!isEmptyObj(origin.attrStatus?.[key]?.attrStatus) && !isEmptyObj(target.attrStatus?.[key]?.attrStatus)) {
                updateStatus(origin.attrStatus[key], target.attrStatus[key]);
            }
        }
        index++;
    }
    // 修改当前状态。如果属性有一个是冲突，那么当前状态就是冲突
    if (originKeys.some(s => origin.attrStatus?.[s].type === CompareStatusEnum.Conflict)) {
        origin.type = CompareStatusEnum.Conflict;
    }
    if (targetKeys.some(s => target.attrStatus?.[s].type === CompareStatusEnum.Conflict)) {
        target.type = CompareStatusEnum.Conflict;
    }
};
/**
 * 处理两个树节点的状态。两边状态不一致，并且不等于 update（update 需要比较子节点是否有修改同一个属性），那么就是冲突，否则就不是冲突
 * 因为在 diffCompare 中，只要子节点有状态更改，那么父节点状态就会变为 update，所以需要在这恢复为 none
 * @param current
 * @param online
 */
const parseStatus = (current, online) => {
    const { status: { type }, changeInfo } = current;
    const { status: { type: onlineType }, changeInfo: onlineChangeInfo } = online;
    const sameType = type === onlineType && (type === CompareStatusEnum.None || type === CompareStatusEnum.Delete);
    // 两个change状态一致
    const sameChangeInfo = isEqual(changeInfo, onlineChangeInfo);
    // delete or none
    const hasDifference = sameType && (type === CompareStatusEnum.None || type === CompareStatusEnum.Delete) && sameChangeInfo;
    if (!hasDifference) {
        // 不一致的话，需要处理状态
        if (!sameType) {
            updateStatus(current.status, online.status);
        }
        if (!sameChangeInfo) {
            // 如果两边都交换了位置，那么当前状态则为冲突
            if (!isEmptyObj(changeInfo) && !isEmptyObj(onlineChangeInfo)) {
                current.status.type = CompareStatusEnum.Conflict;
                online.status.type = CompareStatusEnum.Conflict;
            }
        }
    }
    const isNoneUpdate = (source) => {
        return source.status.type === CompareStatusEnum.Update &&
            isEmptyObj(source.status.attrStatus) &&
            isEmptyObj(source.changeInfo);
    };
    // 如果两边没有更改，并且状态为 update 则恢复状态即可
    if (isNoneUpdate(current)) {
        current.status.type = CompareStatusEnum.None;
    }
    if (isNoneUpdate(online)) {
        online.status.type = CompareStatusEnum.None;
    }
    cycle$1.addCycle('afterCompareStatus', current, online);
    return hasDifference;
};
/**
 * clone 一份状态树
 * @param cloneTree
 * @param statusType
 * @param parent
 * @param isOnline 是不是克隆 online
 */
const cloneCompareTree = (cloneTree, statusType, parent, isOnline) => {
    const { someKey } = getConfig();
    cycle$1.addCycle('beforeCloneCompareTree', cloneTree, statusType, parent);
    const newTreeNode = createCompareNode({
        treeType: cloneTree.treeType,
        name: statusType === CompareStatusEnum.VirtualCreate ? '~' : cloneTree.compareData.name,
        compareData: {
            [someKey]: getSomeValue(cloneTree),
            name: statusType === CompareStatusEnum.VirtualCreate ? '~' : cloneTree.compareData.name
        },
        status: {
            type: statusType
        },
        parent,
        // XXX 后续优化
        target: cloneDeep(cloneTree.target),
        mappingId: cloneTree.id
    });
    newTreeNode.children = cloneTree.children.map(it => cloneCompareTree(it, statusType, newTreeNode, isOnline));
    // 修改映射id
    cloneTree.mappingId = newTreeNode.id;
    cycle$1.addCycle('afterCompareStatus', isOnline ? newTreeNode : cloneTree, isOnline ? cloneTree : newTreeNode);
    return newTreeNode;
};
/**
 * 对比两个节点是否为同一个节点
 * @param current
 * @param online
 */
const sameNode = (current, online) => {
    const { someKey } = getConfig();
    return Reflect.get(current.compareData, someKey) === Reflect.get(online.compareData, someKey);
};
/**
 * diff 对比当前两个状态树。处理冲突项，并且修正两个树结构使其结构一致
 * @param current 当前版本对比结果
 * @param online 线上版本对比结果
 * @param currentParent
 * @param onlineParent
 */
const diffStatusUtil = (current, online, currentParent, onlineParent) => {
    cycle$1.addCycle('beforeDiffStatus', current, online, currentParent, onlineParent);
    if (!current && !online || (!current.length && !online.length)) {
        return;
    }
    else if (current.length && !online.length) {
        // 将 current 克隆一份给 online，节点状态为虚拟新增
        return each(current, children => online.push(cloneCompareTree(children, CompareStatusEnum.VirtualCreate, onlineParent)));
    }
    else if (!current.length && online.length) {
        // 状态为虚拟新增
        return each(online, children => current.push(cloneCompareTree(children, CompareStatusEnum.VirtualCreate, currentParent, true)));
    }
    let cacheIdMap = undefined;
    /**
     * 对比两个状态是否一致。如果是相同的状态。并且没有移动状态，则表示当前两个节点都未更改，那么直接删除当前数据。否则的话对比状态
     * @param currentIdx
     * @param onlineIdx
     */
    const compareStatus = (currentIdx, onlineIdx) => {
        const currentItem = current[currentIdx];
        const onlineItem = online[onlineIdx];
        // 判断当前状态是否更改
        const hasDifference = parseStatus(currentItem, onlineItem);
        if (hasDifference) {
            // 如果相同，删除即可
            current.splice(currentIdx, 1);
            // 删除元素之后需要移动元素
            startCurrent = current[startCurrentIdx];
            endCurrent = current[--endCurrentIdx];
            online.splice(onlineIdx, 1);
            startOnline = online[startOnlineIdx];
            endOnline = online[--endOnlineIdx];
            // 删除之后需要重新维护 map 因为右侧在变
            cacheIdMap = createIdxCache(startOnlineIdx, endOnlineIdx, online);
        }
        else {
            // 维护相互的id
            currentItem.mappingId = onlineItem.id;
            onlineItem.mappingId = currentItem.id;
        }
        return hasDifference;
    };
    let startCurrentIdx = 0, startCurrent = current[0], endCurrentIdx = current.length - 1, endCurrent = current[current.length - 1];
    let startOnlineIdx = 0, startOnline = online[0], endOnlineIdx = online.length - 1, endOnline = online[online.length - 1];
    const filterIds = new Set();
    const getBeforeIndex = (index) => index === 0 ? index : index + 1;
    while (startCurrentIdx <= endCurrentIdx && startOnlineIdx <= endOnlineIdx) {
        if (isUndefined(current[startCurrentIdx])) {
            startCurrent = current[++startCurrentIdx];
        }
        else if (isUndefined(current[endCurrentIdx])) {
            endCurrent = current[--endCurrentIdx];
        }
        else if (filterIds.has(getSomeValue(startOnline)) || isUndefined(online[startOnlineIdx])) {
            startOnline = online[++startOnlineIdx];
        }
        else if (filterIds.has(getSomeValue(endOnline)) || isUndefined(online[endOnlineIdx])) {
            endOnline = online[--endOnlineIdx];
        }
        else if (sameNode(startCurrent, startOnline)) {
            if (!compareStatus(startCurrentIdx, startOnlineIdx)) {
                diffStatusUtil(startCurrent.children, startOnline.children, startCurrent, startOnline);
                startCurrent = current[++startCurrentIdx];
                startOnline = online[++startOnlineIdx];
            }
        }
        else if (sameNode(endCurrent, endOnline)) {
            if (!compareStatus(endCurrentIdx, endOnlineIdx)) {
                diffStatusUtil(endCurrent.children, endOnline.children, endCurrent, endOnline);
                endCurrent = current[--endCurrentIdx];
                endOnline = online[--endOnlineIdx];
            }
        }
        else if (sameNode(endCurrent, startOnline)) {
            if (!compareStatus(endCurrentIdx, startOnlineIdx)) {
                diffStatusUtil(endCurrent.children, startOnline.children, endCurrent, startOnline);
                endCurrent = current[--endCurrentIdx];
                startOnline = online[++startOnlineIdx];
            }
        }
        else if (sameNode(startCurrent, endOnline)) {
            if (!compareStatus(startCurrentIdx, endOnlineIdx)) {
                diffStatusUtil(startCurrent.children, endOnline.children, startCurrent, endOnline);
                startCurrent = current[++startCurrentIdx];
                endOnline = online[--endOnlineIdx];
            }
        }
        else {
            if (!cacheIdMap?.size) {
                cacheIdMap = createIdxCache(startOnlineIdx, endOnlineIdx, online);
            }
            const findIdx = cacheIdMap?.get(getSomeValue(startCurrent));
            if (!isUndefined(findIdx)) {
                // 说明是跟换了位置信息
                if (!compareStatus(startCurrentIdx, findIdx)) {
                    diffStatusUtil(startCurrent.children, online[findIdx].children, startCurrent, online[findIdx]);
                    startCurrent = current[++startCurrentIdx];
                    filterIds.add(getSomeValue(online[findIdx]));
                }
            }
            else {
                // 说明是新增的节点。需要给 online 增加一个节点到当前 startCurrent 后面，并且移动指针。
                const beforeIdx = getBeforeIndex(startCurrentIdx);
                online.splice(beforeIdx, 0, cloneCompareTree(startCurrent, CompareStatusEnum.VirtualCreate, onlineParent));
                // 增加过滤
                filterIds.add(getSomeValue(startCurrent));
                startCurrent = current[++startCurrentIdx];
                // 插入到开始节点前面，需要让开始节点/结束节点后移
                if (beforeIdx <= startOnlineIdx) {
                    startOnline = online[++startOnlineIdx];
                    endOnline = online[++endOnlineIdx];
                }
                else if (beforeIdx <= endOnlineIdx && beforeIdx >= startOnlineIdx) {
                    // 代表着插入到中间。只需要结束节点后移即可
                    endOnline = online[++endOnlineIdx];
                }
            }
        }
    }
    // current 处理完成了。online还未处理完成 online 还有新增
    if (startOnlineIdx <= endOnlineIdx) {
        for (; startOnlineIdx <= endOnlineIdx; ++startOnlineIdx) {
            const item = online[startOnlineIdx];
            if (!filterIds.has(getSomeValue(item))) {
                current.splice(startOnlineIdx, 0, cloneCompareTree(item, CompareStatusEnum.VirtualCreate, currentParent, true));
            }
        }
    }
    // online 处理完成。current还有新增
    if (startCurrentIdx <= endCurrentIdx) {
        for (; startCurrentIdx <= endCurrentIdx; ++startCurrentIdx)
            online.splice(startCurrentIdx, 0, cloneCompareTree(current[startCurrentIdx], CompareStatusEnum.VirtualCreate, onlineParent));
    }
    cacheIdMap?.clear();
    cycle$1.addCycle('afterDiffStatus', current, online, currentParent, onlineParent);
};

const getEmptyData = () => speedCreateCompareNode({ id: new Date().valueOf() });
const parseItem = (data, parent) => {
    if (!data)
        return getEmptyData();
    const { childrenKey } = getConfig();
    const keys = Object.keys(data);
    const newData = {};
    each(keys, key => {
        if (!Reflect.has(newData, key) && key !== childrenKey) {
            Reflect.set(newData, key, Reflect.get(data, key));
        }
    });
    return speedCreateCompareNode(newData, parent);
};
const parseChildren = (data, parent) => {
    const { childrenKey } = getConfig();
    const currentNode = parseItem(data, parent);
    if (Reflect.has(data, childrenKey)) {
        const childrenTarget = Reflect.get(data, childrenKey);
        if (childrenTarget) {
            if (isArray(childrenTarget)) {
                currentNode.children.concat(childrenTarget.map(m => parseChildren(m, currentNode)).filter(it => !!it));
            }
            else {
                parseChildren(childrenTarget, currentNode);
            }
        }
    }
    parent?.children.push(currentNode);
    return currentNode;
};
function parseUtil(data, parent) {
    if (isArray(data)) {
        const childrenNodes = data.map(m => parseChildren(m, parent));
        if (childrenNodes) {
            return childrenNodes;
        }
        return [getEmptyData()];
    }
    else {
        const parseData = parseChildren(data, parent);
        if (!parseData) {
            return getEmptyData();
        }
        return parseData;
    }
}

class DataCompare {
    static get instance() {
        if (!this.dataCompareInstance) {
            this.dataCompareInstance = new DataCompare();
        }
        return this.dataCompareInstance;
    }
    static dataCompareInstance;
    constructor() {
        this.cycle = new Cycle();
    }
    uid = 0;
    cycle;
    /**
     * 快速创建一个对比节点
     * @param data 原始数据
     * @param parent 父节点
     * @returns
     */
    speedCreateCompareNode(data, parent) {
        return this.createCompareNode({ compareData: data, target: data }, parent);
    }
    /**
     * 创建对比节点
     * @param data 原始数据
     * @param parent 父节点
     * @param isClone 是否为clone节点
     * @returns
     */
    createCompareNode(data, parent, isClone = false) {
        const target = data.target ?? data.compareData ?? undefined;
        const { nameKey } = getConfig();
        const newNode = {
            id: ++this.uid,
            [nameKey]: getNameValue(data) ?? getNameValue(data.compareData) ?? '未命名',
            // 将数据类型去除掉，因为需要去除其中的 get 不可枚举属性
            compareData: Object.assign({}, data.compareData),
            target,
            status: data.status ?? {
                // 默认状态为 none
                type: CompareStatusEnum.None
            },
            changeInfo: data.changeInfo ?? undefined,
            childrenChangeInfo: data.childrenChangeInfo ?? undefined,
            children: (data.children ?? []),
            parent: parent ?? data.parent,
            mappingId: data.mappingId
        };
        !isClone && this.cycle.addCycle('beforeCreateCompareNode', newNode);
        return newNode;
    }
    /**
     * 获取两个数据之前的差异和状态
     * @param origin 新的数据
     * @param target 原始数据
     * @param pathStacks 属性的路径
     * @returns 返回对比状态
     */
    diffAttr(origin, target, pathStacks = []) {
        return diffAttrUtil(origin, target, pathStacks);
    }
    diffCompareTree(origin, target, parent) {
        if (isArray(origin) && isArray(target)) {
            return diffCompareTreeUtil(origin, target, parent);
        }
        else {
            return diffCompareTreeUtil([origin], [target], parent);
        }
    }
    diffStatus(current, online, currentParent, onlineParent) {
        if (isArray(current) && isArray(online)) {
            diffStatusUtil(current, online, currentParent, onlineParent);
        }
        else {
            diffStatusUtil([current], [online], currentParent, onlineParent);
        }
    }
    /**
     * 快速对比三个对象之前的数据差异
     * @param current 当前版本
     * @param online 线上版本
     * @param base 基础版本
     */
    speedDiffStatus(current, online, base) {
        const currentTree = this.speedCreateCompareNode(current);
        const onlineTree = this.speedCreateCompareNode(online);
        const baseTree = this.speedCreateCompareNode(base);
        const cb = this.diffCompareTree(currentTree, baseTree);
        const ob = this.diffCompareTree(onlineTree, baseTree);
        diffStatusUtil(cb, ob);
        return {
            current: cb,
            online: ob
        };
    }
    parse(data, parent) {
        this.cycle.addCycle('beforeParse', data, parent);
        let newNode;
        // XXX 为了解决重载导致的编辑器报错
        if (isArray(data)) {
            newNode = parseUtil(data, parent);
        }
        else {
            newNode = parseUtil(data, parent);
        }
        this.cycle.addCycle('afterParse', data, newNode, parent);
        return newNode;
    }
}
const dataCompare = DataCompare.instance;

// methods
const createCompareNode = dataCompare.createCompareNode.bind(dataCompare);
const speedCreateCompareNode = dataCompare.speedCreateCompareNode.bind(dataCompare);
const diffCompareTree = dataCompare.diffCompareTree.bind(dataCompare);
const diffStatus = dataCompare.diffStatus.bind(dataCompare);
const speedDiffStatus = dataCompare.speedDiffStatus.bind(dataCompare);
const diffAttr = dataCompare.diffAttr.bind(dataCompare);
const parse = dataCompare.parse.bind(dataCompare);
// cycle
const cycle = dataCompare.cycle;
// config
const updateConfig = updateConfig$1;

export { createCompareNode, cycle, dataCompare as default, diffAttr, diffCompareTree, diffStatus, parse, speedCreateCompareNode, speedDiffStatus, updateConfig };
