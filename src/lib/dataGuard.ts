import { deepClone, isNullish, isObject, isString } from '../utils/helpers';

type SensitiveContentKey = keyof typeof sensitiveContentRegExp;

interface IMaskDataOptions {
    keyCheck?: (key: string) => boolean;
    immutable?: boolean;
    customPatterns?: Record<string, RegExp>;
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

function maskSensitiveValue(value: string): string {
    if (value.length <= 4) {
        return '*'.repeat(value.length);
    }
    return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
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
    customPatterns?: Record<string, RegExp>
): string {
    const allPatterns = { ...defaultPatterns, ...customPatterns };

    const applyPatternMasking = (currentValue: string, pattern: RegExp): string => {
        if (pattern) {
            currentValue = currentValue.replace(pattern, match => maskSensitiveValue(match) as string);
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
    customSensitiveContentRegExp?: Record<string, RegExp>
): string {
    if (!value || value.length === 0) return value;

    const applicablePatterns = types.reduce((acc, type) => {
        if (type in sensitiveContentRegExp) {
            // check if 'type' is a valid key to satisfy TypeScript's safety checks
            acc[type] = sensitiveContentRegExp[type]; // TypeScript now knows 'type' is a valid key
        }
        return acc;
    }, {} as Record<SensitiveContentKey, RegExp>); // Also define the accumulator's type

    return maskSensitiveContent(value, applicablePatterns, customSensitiveContentRegExp);
}

export function maskData<T>(item: T, options: IMaskDataOptions = {}): T {
    const { keyCheck = shouldMaskKey, immutable = true } = options;

    if (isString(item)) {
        // Pass custom regex patterns to maskString
        return maskString(item, undefined, options.customPatterns) as T;
    }

    options.keyCheck = keyCheck;
    options.immutable = immutable;

    if (item instanceof Map) {
        // Process Map items
        const processedMap = options.immutable ? new Map<string, T>() : item;

        item.forEach((value, key) => {
            if (typeof key === 'string') {
                const maskedValue = options.keyCheck(key)
                    ? isString(value)
                        ? maskSensitiveValue(value)
                        : maskData(value, options)
                    : maskData(value, options);

                processedMap.set(key, maskedValue);
            } else {
                // If the key is not a string, we can't check it against sensitive content, but we still mask the value.
                processedMap.set(key, maskData(value, options));
            }
        });

        return processedMap as T;
    }

    if (isObject(item)) {
        // Clone the item if immutability is required
        const processedItem = options.immutable ? deepClone(item) : item;

        const assignMaskedValue = (obj: Record<string, unknown>, key: string, value: unknown) => {
            obj[key] = options.keyCheck(key)
                ? isString(value)
                    ? maskSensitiveValue(value)
                    : maskData(value, options)
                : maskData(value, options);
        };

        return Object.entries(processedItem).reduce(
            (acc, [key, value]) => {
                assignMaskedValue(acc, key, value);
                return acc;
            },
            options.immutable ? ({} as Record<string, unknown>) : processedItem
        ) as T;
    }

    if (Array.isArray(item)) {
        return item.map(i => maskData(i, options)) as T;
    }

    return item as T;
}

export function maskArguments<T>(args: unknown[], options?: IMaskDataOptions): T[] {
    if (isNullish(args) || args.length === 0) return args as T[];
    return args.map(arg =>
        typeof arg !== 'object' && typeof arg !== 'string' ? arg : maskData<T>(arg as T, options)
    ) as T[];
}
