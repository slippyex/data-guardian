type UnknownArray = unknown[];

const sensitiveKeys = ['password', 'pwd', 'pass', 'token', 'secret', 'key', 'passphrase', 'privateKey', 'mail'];

const sensitiveContentRegExp: Record<string, RegExp> = {
    creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
    ssn: /\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b/g,
    url: /\b(?:https?|ftp):\/\/[a-z0-9-+&@#/%?=~_|!:,.;]*[a-z0-9-+&@#/%=~_|]\b/gi,
    ipv4: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    password: /(?=\S*\d)(?=\S*[A-Za-z])[\w!@#$%^&*()_+=\-,.]{6,}/gm
};

function isObject(item: unknown): item is Record<string, unknown> {
    return item && typeof item === 'object' && !Array.isArray(item);
}

function maskSensitiveValue(value: unknown): unknown {
    if (typeof value === 'string') {
        if (value.length <= 4) {
            return value;
        }
        return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
    }
    return value; // Non-string values remain unchanged
}

export function maskString(value: string, types: string[] = Object.keys(sensitiveContentRegExp)): string {
    types.forEach(type => {
        const pattern = sensitiveContentRegExp[type];
        value = value.replace(pattern, match => maskSensitiveValue(match) as string);
        pattern.lastIndex = 0; // Reset regex state
    });
    return value;
}

export function maskSensitiveData(
    item: unknown,
    keyCheck: (key: string) => boolean = key =>
        sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey))
): unknown {
    if (typeof item === 'string') {
        return maskString(item);
    }

    if (isObject(item)) {
        return Object.entries(item).reduce((acc, [key, value]) => {
            acc[key] = keyCheck(key) ? maskSensitiveValue(value) : maskSensitiveData(value, keyCheck);
            return acc;
        }, {} as Record<string, unknown>);
    }

    if (Array.isArray(item)) {
        return item.map(i => maskSensitiveData(i, keyCheck));
    }

    return item;
}

export function maskArguments(args: UnknownArray): UnknownArray {
    return args.map(arg => maskSensitiveData(arg));
}
