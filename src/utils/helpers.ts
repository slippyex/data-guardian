export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime()) as unknown as T;
    }

    if (obj instanceof Array) {
        const arrCopy: T[] = obj.map(item => deepClone(item));
        return arrCopy as T;
    }

    if (obj instanceof Object) {
        const objCopy: Partial<T> = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                objCopy[key] = deepClone((obj as T)[key]);
            }
        }
        return objCopy as T;
    }
    return obj;
}

export function isObject(item: unknown): item is Record<string, unknown> {
    return item && typeof item === 'object' && !Array.isArray(item);
}

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}
