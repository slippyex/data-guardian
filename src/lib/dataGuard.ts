import { deepClone, isNullish, isObject, isString } from '../utils/helpers';

type SensitiveContentKey = keyof typeof sensitiveContentRegExp;
type MaskingChar = 'X' | 'x' | '$' | '/' | '.' | '*' | '#' | '+' | '@' | '-' | '_' | ' ';

interface IMaskDataOptions {
    keyCheck?: (key: string) => boolean;
    immutable?: boolean;
    customPatterns?: Record<string, RegExp>;
    maskingChar?: MaskingChar;
    maskLength?: number;
    types?: SensitiveContentKey[];
    customSensitiveContentRegExp?: Record<string, RegExp>;
}

const defaultSensitiveKeyFragments: Set<string> = new Set([
    'password',
    'pwd',
    'pass',
    'token',
    'secret',
    'key',
    'passphrase',
    'privateKey',
    'mail',
    'shared',
    'credential',
    'auth',
    'signature',
    'certificate',
    'crypt',
    'apikey',
    'security',
    'phone',
    'mobile'
]);

const sensitiveContentRegExp = {
    creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
    ssn: /\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b/g,
    url: /\b(?:https?|ftp):\/\/[a-z0-9-+&@#/%?=~_|!:,.;]*[a-z0-9-+&@#/%=~_|]\b/gi,
    ipv4: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    password: /(?=\S*\d)(?=\S*[A-Za-z])[\w!@#$%^&*()_+=\-,.]{6,}/gm,
    uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi
} as const;

function maskSensitiveValue(value: string, maskingChar: MaskingChar = '*', maskLength = value.length - 4): string {
    if (value.length <= 4 || maskLength >= value.length) {
        return maskingChar.repeat(value.length);
    }
    const visibleLength = (value.length - maskLength) / 2;
    return (
        value.substring(0, visibleLength) +
        maskingChar.repeat(maskLength) +
        value.substring(value.length - visibleLength)
    );
}

function shouldMaskKey(key: string): boolean {
    const lowerCaseKey = key.toLowerCase();
    for (const sensitiveKey of defaultSensitiveKeyFragments) {
        if (lowerCaseKey.includes(sensitiveKey)) {
            return true;
        }
    }
    return false;
}

function maskSensitiveContent(
    originalValue: string,
    defaultPatterns: typeof sensitiveContentRegExp,
    customPatterns: Record<string, RegExp> = {},
    options?: IMaskDataOptions
): string {
    const allPatterns = { ...defaultPatterns, ...customPatterns };

    const applyPatternMasking = (currentValue: string, pattern: RegExp): string => {
        if (pattern) {
            currentValue = currentValue.replace(
                pattern,
                match => maskSensitiveValue(match, options?.maskingChar, options?.maskLength) as string
            );
            pattern.lastIndex = 0; // Reset regex state for global patterns
        }
        return currentValue;
    };

    return Object.values(allPatterns).reduce(
        (maskedValue, pattern) => applyPatternMasking(maskedValue, pattern),
        originalValue
    );
}

export function maskString(
    value: string,
    types: SensitiveContentKey[] = Object.keys(sensitiveContentRegExp) as SensitiveContentKey[],
    customSensitiveContentRegExp: Record<string, RegExp> = {},
    options?: IMaskDataOptions
): string {
    if (!value || value.length === 0) return value;

    if (!types) types = Object.keys(sensitiveContentRegExp) as SensitiveContentKey[];
    if (!customSensitiveContentRegExp) customSensitiveContentRegExp = {};

    const applicablePatterns = types.reduce(
        (acc, type) => {
            if (type in sensitiveContentRegExp) {
                // check if 'type' is a valid key to satisfy TypeScript's safety checks
                acc[type] = sensitiveContentRegExp[type]; // TypeScript now knows 'type' is a valid key
            }
            return acc;
        },
        {} as Record<SensitiveContentKey, RegExp>
    ); // Also define the accumulator's type

    return maskSensitiveContent(value, applicablePatterns, customSensitiveContentRegExp, options);
}

function maskMap<K, V>(item: Map<K, V>, options: IMaskDataOptions): Map<K, V> {
    // Process Map items
    const processedMap = options.immutable ? new Map<K, V>() : item;

    item.forEach((value, key) => {
        if (typeof key === 'string') {
            processedMap.set(key, performMasking(key, value, options));
        } else {
            // If the key is not a string, we can't check it against sensitive content, but we still mask the value.
            processedMap.set(key, maskData(value, options));
        }
    });

    return processedMap;
}

function maskSet<T>(item: Set<T>, options: IMaskDataOptions): Set<T> {
    const processedSet = options.immutable ? new Set<T>() : item;

    const toAdd: T[] = [];
    const toRemove: T[] = [];

    item.forEach(value => {
        let maskedValue;
        if (typeof value === 'string') {
            // If the value is a string, perform masking
            maskedValue = maskString(value, undefined, options.customPatterns, options) as T;
        } else if (isObject(value) || Array.isArray(value) || value instanceof Map) {
            // If the value is an object, array, or map, recursively call maskData
            maskedValue = maskData(value, options);
        } else {
            // If the value is of any other type, just keep the original value
            maskedValue = value as T;
        }

        if (options.immutable) {
            // If immutability is required, add masked value to the new set
            processedSet.add(maskedValue as T);
        } else {
            // If immutability is not required, track the original and masked values for later update
            toAdd.push(maskedValue as T);
            toRemove.push(value as T);
        }
    });

    if (!options.immutable) {
        // Update the original set
        toRemove.forEach(value => item.delete(value));
        toAdd.forEach(value => item.add(value));
    }

    return processedSet;
}

function maskError(item: Error, options: IMaskDataOptions): Error {
    const maskedError = new Error(maskString(item.message, undefined, options.customPatterns, options));
    maskedError.stack = maskString(item.stack, undefined, options.customPatterns, options);
    return maskedError;
}

function maskObject<T>(item: T, options: IMaskDataOptions): T {
    // Clone the item if immutability is required
    const processedItem = options.immutable ? deepClone(item) : item;

    const assignMaskedValue = (obj: Record<string, unknown>, key: string, value: unknown) => {
        obj[key] = performMasking(key, value, options);
    };

    return Object.entries(processedItem).reduce(
        (acc, [key, value]) => {
            assignMaskedValue(acc as Record<string, T>, key, value);
            return acc;
        },
        options.immutable ? ({} as Record<string, unknown>) : processedItem
    ) as T;
}

function maskArray<T>(item: T[], options: IMaskDataOptions): T[] {
    return item.map(i => maskData(i, options));
}

function performMasking<T>(key: string, value: unknown, options: IMaskDataOptions): T {
    return (
        options.keyCheck(key)
            ? isString(value)
                ? maskSensitiveValue(value, options?.maskingChar, options?.maskLength) // Pass maskLength here
                : maskData(value, options)
            : maskData(value, options)
    ) as T;
}

export function maskData<T>(item: T, options: IMaskDataOptions = {}): T {
    const { keyCheck = shouldMaskKey, immutable = true } = options;

    if (isString(item)) {
        // Pass custom regex patterns to maskString
        return maskString(item, undefined, options.customPatterns, options) as T;
    }

    options.keyCheck = keyCheck;
    options.immutable = immutable;

    if (item instanceof Map) {
        return maskMap(item, options) as T;
    }

    if (item instanceof Set) {
        return maskSet(item, options) as T;
    }

    if (item instanceof Error) {
        return maskError(item, options) as T;
    }

    if (isObject(item)) {
        return maskObject<T>(item, options);
    }

    if (Array.isArray(item)) {
        return maskArray(item, options) as T;
    }

    return item as T;
}

export function maskArguments<T>(args: unknown[], options?: IMaskDataOptions): T[] {
    if (isNullish(args) || args.length === 0) return args as T[];
    return args.map(arg =>
        typeof arg !== 'object' && typeof arg !== 'string' ? arg : maskData<T>(arg as T, options)
    ) as T[];
}
