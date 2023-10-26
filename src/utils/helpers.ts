export function hasCircularReference<T>(item: T): boolean {
    const seenObjects = new WeakSet<object>();

    function detect(obj: unknown): boolean {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }

        if (seenObjects.has(obj as object)) {
            return true;
        }

        seenObjects.add(obj as object);

        for (const key in obj as Record<PropertyKey, unknown>) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (detect((obj as Record<PropertyKey, unknown>)[key])) {
                    return true;
                }
            }
        }

        // No need to delete the object from seenObjects since it's now a WeakSet

        return false;
    }

    return detect(item);
}

export function deepClone<T>(obj: T, visited = new WeakMap()): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // Check for circular references
    if (visited.has(obj)) {
        return visited.get(obj);
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime()) as unknown as T;
    }

    if (Array.isArray(obj)) {
        const arrCopy: T[] = [];
        // Store reference to new array
        visited.set(obj, arrCopy);
        arrCopy.push(...obj.map(item => deepClone(item, visited)));
        return arrCopy as T;
    }

    if (obj instanceof Object) {
        // Get the prototype of the object
        const proto = Object.getPrototypeOf(obj);

        // Create a new object with the same prototype
        const objCopy: Record<string, unknown> = Object.create(proto);

        // Store reference to new object
        visited.set(obj, objCopy);

        // Iterate over all keys, including inherited ones
        const allKeys = [...Object.getOwnPropertyNames(obj), ...Object.getOwnPropertySymbols(obj)];
        allKeys.forEach(key => {
            const descriptor = Object.getOwnPropertyDescriptor(obj, key);
            if (descriptor && typeof descriptor.value === 'object' && descriptor.value !== null) {
                // If the value is an object, deep clone it
                descriptor.value = deepClone(descriptor.value, visited);
            }
            // Define the property on the new object
            Object.defineProperty(objCopy, key, descriptor);
        });

        return objCopy as T;
    }
}

export function isObject(item: unknown): item is Record<string, unknown> {
    return item && typeof item === 'object' && !Array.isArray(item);
}

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isNullish(value: unknown) {
    return value === undefined || value === null;
}
