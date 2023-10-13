import { deepClone, isNullish, isObject, isString } from '../utils/helpers';

type SensitiveContentKey = keyof typeof sensitiveContentRegExp;

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

export function maskString(
    value: string,
    types: SensitiveContentKey[] = Object.keys(sensitiveContentRegExp) as SensitiveContentKey[]
): string {
    if (!value) return value;
    let maskedValue = value;
    types.forEach(type => {
        const pattern = sensitiveContentRegExp[type];
        maskedValue = maskedValue.replace(pattern, match => maskSensitiveValue(match) as string);
        pattern.lastIndex = 0; // Reset regex state
    });
    return maskedValue;
}

export function maskData(item: unknown, keyCheck?: (key: string) => boolean, immutable = true): unknown {
    if (!keyCheck) {
        keyCheck = shouldMaskKey;
    }
    if (isString(item)) {
        return maskString(item);
    }

    if (isObject(item)) {
        // Clone the item if immutability is required
        const processedItem = immutable ? deepClone(item) : item;

        const assignMaskedValue = (obj: Record<string, unknown>, key: string, value: unknown) => {
            obj[key] = keyCheck(key)
                ? isString(value)
                    ? maskSensitiveValue(value)
                    : maskData(value, keyCheck, immutable)
                : maskData(value, keyCheck, immutable);
        };

        return Object.entries(processedItem).reduce(
            (acc, [key, value]) => {
                assignMaskedValue(acc, key, value);
                return acc;
            },
            immutable ? ({} as Record<string, unknown>) : processedItem
        );
    }

    if (Array.isArray(item)) {
        return item.map(i => maskData(i, keyCheck, immutable));
    }

    return item;
}

export function maskArguments(args: unknown[], keyCheck?: (key: string) => boolean, immutable = true): unknown[] {
    if (isNullish(args) || args.length === 0) return args;
    return args.map(arg =>
        typeof arg !== 'object' && typeof arg !== 'string' ? arg : maskData(arg, keyCheck, immutable)
    );
}
