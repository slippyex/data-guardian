type SensitiveContentKey = keyof typeof sensitiveContentRegExp;

const sensitiveKeys: Set<string> = new Set(['password', 'pwd', 'pass', 'token', 'secret', 'key', 'passphrase', 'privateKey', 'mail']);

const sensitiveContentRegExp = {
    creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
    ssn: /\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b/g,
    url: /\b(?:https?|ftp):\/\/[a-z0-9-+&@#/%?=~_|!:,.;]*[a-z0-9-+&@#/%=~_|]\b/gi,
    ipv4: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    password: /(?=\S*\d)(?=\S*[A-Za-z])[\w!@#$%^&*()_+=\-,.]{6,}/gm,
    uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi
} as const;

function isObject(item: unknown): item is Record<string, unknown> {
    return item && typeof item === 'object' && !Array.isArray(item);
}

function isString(value: unknown): value is string {
    return typeof value === 'string';
}

function maskSensitiveValue(value: string): string {
    return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
}

export function maskString(
    value: string,
    types: SensitiveContentKey[] = Object.keys(sensitiveContentRegExp) as SensitiveContentKey[]
): string {
    let maskedValue = value;
    types.forEach(type => {
        const pattern = sensitiveContentRegExp[type];
        maskedValue = maskedValue.replace(pattern, match => maskSensitiveValue(match) as string);
        pattern.lastIndex = 0; // Reset regex state
    });
    return maskedValue;
}

export function maskData(
    item: unknown,
    keyCheck: (key: string) => boolean = key =>
        Array.from(sensitiveKeys).some(sensitiveKey => key.toLowerCase().includes(sensitiveKey))
): unknown {
    if (isString(item)) {
        return maskString(item);
    }

    if (isObject(item)) {
        return Object.entries(item).reduce((acc, [key, value]) => {
            return {
                ...acc,
                [key]: keyCheck(key) ? maskSensitiveValue(value as string) : maskData(value, keyCheck)
            };
        }, {});
    }

    if (Array.isArray(item)) {
        return item.map(i => {
            if (isObject(i)) {
                return Object.entries(i).reduce((acc, [key, value]) => {
                    return {
                        ...acc,
                        [key]: keyCheck(key) ? maskSensitiveValue(value as string) : maskData(value, keyCheck)
                    };
                }, {});
            }
            return maskData(i, keyCheck);
        });
    }

    return item;
}

export function maskArguments(args: unknown[]): unknown[] {
    return args.map(arg => maskData(arg));
}
