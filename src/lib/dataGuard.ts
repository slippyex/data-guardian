import { deepClone, isNullish, isObject, isString } from '../utils/helpers';

export type SensitiveContentKey = keyof typeof sensitiveContentRegExp;
type MaskingChar = 'X' | 'x' | '$' | '/' | '.' | '*' | '#' | '+' | '@' | '-' | '_' | ' ';

interface IMaskDataOptions {
    keyCheck: (key: string) => boolean;
    immutable: boolean;
    customPatterns: Record<string, RegExp>;
    maskingChar: MaskingChar;
    maskLength: number;
    types: SensitiveContentKey[];
    customSensitiveContentRegExp: Record<string, RegExp>;
    /**
     * When enabled, masks the sensitive content with a fixed number of characters,
     * irrespective of the original content's length. This prevents inferring the
     * length of the original content from the masked output.
     * Default is 'false', which means the mask will reflect the original content's length.
     */
    fixedMaskLength: boolean;
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
    email: /(?<=^|[\s'"-#+.><])[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    password: /\b(?=\S*\d)(?=\S*[A-Za-z])[\w!@#$%^&*()_+=\-,.]{6,}\b/gm,
    passwordInUri: /(?<=:\/\/[^:]+:)[^@]+?(?=@)/,
    passwordMention: /(?<=.*(password|passwd|pwd)(?:\s*:\s*|\s+))\S+/gi,
    uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi
} as const;

function maskSensitiveValue(value: string, options: Partial<IMaskDataOptions>): string {
    const skipMaskingPattern = /##([^#]*)##/g; // Pattern to match content that should not be masked
    const maskLength = options?.maskLength || value.length - 4;
    const maskingChar = options?.maskingChar || '*';
    // Skip masking if the entire value is wrapped in '##'
    if (skipMaskingPattern.test(value)) {
        return value;
    }

    if (options?.fixedMaskLength) {
        return maskingChar.repeat(16);
    }

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
    options?: Partial<IMaskDataOptions>
): string {
    const allPatterns = { ...defaultPatterns, ...customPatterns };
    const skipMaskingPattern = /##([^#]*)##/g; // Pattern to match content that should not be masked

    const applyPatternMasking = (currentValue: string, pattern: RegExp): string => {
        let result = '';
        let lastIndex = 0;

        // Process parts of the string outside '##' blocks
        currentValue.replace(skipMaskingPattern, (match, p1, offset) => {
            // Apply masking to the content before the '##' block
            const substring = currentValue.substring(lastIndex, offset);
            result += substring.replace(pattern, match => maskSensitiveValue(match, options));
            // Don't mask inside the '##' block
            result += match;
            lastIndex = offset + match.length;
            return match; // Necessary for the replace function, though it's not used here
        });

        // Apply masking to the content after the last '##' block
        const substring = currentValue.substring(lastIndex);
        result += substring.replace(pattern, match => maskSensitiveValue(match, options));

        pattern.lastIndex = 0; // Reset regex state for global patterns
        return result;
    };

    return Object.values(allPatterns).reduce(
        (maskedValue, pattern) => applyPatternMasking(maskedValue, pattern),
        originalValue
    );
}

function unmaskContent(value: string): { isUnmasked: boolean; content: string } {
    const unmaskPattern = /##(.*?)##/g;
    let isUnmasked = false;
    const content = value.replace(unmaskPattern, (match, capture) => {
        isUnmasked = true;
        return capture;
    });

    return { isUnmasked, content };
}

/**
 * Masks sensitive parts of a string based on predefined and custom patterns.
 *
 * @param {string} value - The string to mask.
 * @returns {string} The masked string.
 */
export function maskString(value: string): string;

/**
 * Masks sensitive parts of a string based on provided options.
 *
 * @param {string} value - The string to mask.
 * @param {Partial<IMaskDataOptions>} options - The options to customize the masking process.
 * @returns {string} The masked string.
 */
export function maskString(value: string, options: Partial<IMaskDataOptions>): string;

/**
 * Masks sensitive parts of a string based on specified types and optionally custom patterns and options.
 *
 * @param {string} value - The string to mask.
 * @param {SensitiveContentKey[]} types - The types of sensitive content to mask.
 * @param {Record<string, RegExp>} [customSensitiveContentRegExp] - Custom regular expressions for detecting sensitive content.
 * @param {Partial<IMaskDataOptions>} [options] - The options to customize the masking process.
 * @returns {string} The masked string.
 */
export function maskString(
    value: string,
    types: SensitiveContentKey[], // This remains non-optional
    customSensitiveContentRegExp?: Record<string, RegExp>,
    options?: Partial<IMaskDataOptions>
): string;

export function maskString(
    value: string,
    typesOrOptions?: SensitiveContentKey[] | Partial<IMaskDataOptions>, // This should be optional
    customSensitiveContentRegExp: Record<string, RegExp> = {},
    options?: Partial<IMaskDataOptions>
): string {
    if (!value || value.length === 0) return value;

    let types: SensitiveContentKey[] | undefined;
    if (typesOrOptions && !Array.isArray(typesOrOptions)) {
        // If typesOrOptions is not an array, it means it's the options parameter
        options = typesOrOptions;
    } else {
        types = typesOrOptions as SensitiveContentKey[];
    }

    if (!value || value.length === 0) return value;

    // Check if the content is marked to be unmasked
    const { isUnmasked, content } = unmaskContent(value);
    if (isUnmasked) {
        return content; // return content without '##' and without masking
    }

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

function maskMap<K, V>(item: Map<K, V>, options: Partial<IMaskDataOptions>): Map<K, V> {
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

function maskSet<T>(item: Set<T>, options: Partial<IMaskDataOptions>): Set<T> {
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

function maskError(item: Error, options: Partial<IMaskDataOptions>): Error {
    const maskedError = new Error(maskString(item.message, undefined, options.customPatterns, options));
    maskedError.stack = maskString(item.stack, undefined, options.customPatterns, options);
    return maskedError;
}

function maskObject<T>(item: T, options: Partial<IMaskDataOptions>): T {
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

function maskArray<T>(item: T[], options: Partial<IMaskDataOptions>): T[] {
    return item.map(i => maskData(i, options));
}

function performMasking<T>(key: string, value: unknown, options: Partial<IMaskDataOptions>): T {
    // Check if the content is marked to be unmasked and it's a string
    if (isString(value)) {
        const { isUnmasked, content } = unmaskContent(value);
        if (isUnmasked) {
            return content as T; // return content without '##' and without masking
        }
    }
    return (
        options.keyCheck(key)
            ? isString(value)
                ? maskSensitiveValue(value, options) // Pass maskLength here
                : maskData(value, options)
            : maskData(value, options)
    ) as T;
}


/**
 * Masks data based on the type and the provided masking options.
 * This function is recursively called for nested objects.
 *
 * @template T
 * @param {T} item - The original data to mask.
 * @param {Partial<IMaskDataOptions>} [options={}] - Optional masking options.
 * @returns {T} The masked data.
 */
export function maskData<T>(item: T, options: Partial<IMaskDataOptions> = {}): T {
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

/**
 * Masks arguments of a function call, based on the provided masking options.
 *
 * @template T
 * @param {unknown[]} args - The original arguments to mask.
 * @param {IMaskDataOptions} [options] - Optional masking options.
 * @returns {T[]} The masked arguments.
 */
export function maskArguments<T>(args: unknown[], options?: IMaskDataOptions): T[] {
    if (isNullish(args) || args.length === 0) return args as T[];
    return args.map(arg =>
        typeof arg !== 'object' && typeof arg !== 'string' ? arg : maskData<T>(arg as T, options)
    ) as T[];
}
