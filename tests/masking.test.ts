import { maskArguments, maskData, maskString } from '../src/';

describe('Test all possible masking', () => {
    it('should be able to deal with nullish values', () => {
        expect(maskData(null)).toBe(null);
        expect(maskString(null)).toBe(null);
        expect(maskArguments([null])).toEqual([null]);
        expect(maskArguments(null)).toBe(null);

        expect(maskData(undefined)).toBe(undefined);
        expect(maskString(undefined)).toBe(undefined);
        expect(maskArguments([undefined])).toEqual([undefined]);
        expect(maskArguments(undefined)).toBe(undefined);
    });

    it('should be able to handle empty strings', () => {
        expect(maskData('')).toBe('');
        expect(maskString('')).toBe('');
        expect(maskArguments([''])).toEqual(['']);
        expect(maskData({ emptyString: '' })).toEqual({ emptyString: '' });
        expect(maskData({ password: '' })).toEqual({ password: '' });
    });

    it('should mask a simple object', () => {
        const input = {
            password: 'testpassword'
        };
        expect(maskData(input)).toEqual({
            password: 'te********rd'
        });
    });

    it('should mask a simple object with different char', () => {
        const input = {
            password: 'testpassword'
        };
        expect(maskData(input, { maskingChar: '#' })).toEqual({
            password: 'te########rd'
        });
    });

    it('should mask a simple object with different char and mask-length', () => {
        const input = {
            password: 'testpassword'
        };
        expect(maskData(input, { maskingChar: '#', maskLength: 4 })).toEqual({
            password: 'test####word'
        });

        input.password = 'test';
        expect(maskData(input, { maskingChar: '#', maskLength: 4 })).toEqual({
            password: '####'
        });

        input.password = 'test1';
        expect(maskData(input, { maskingChar: '#', maskLength: 4 })).toEqual({
            password: '####1'
        });

    });

    it('should mask an arbitrary string with a custom char and a given maskLength', () => {
        const arbitraryString =
            'a weird guy once forgot to mask his super secret password o!kxXYkx2346#1.3! ... but we could help';
        const masked = maskString(arbitraryString, null, {}, { maskingChar: '.', maskLength: 6 });
        expect(masked).toBe(
            'a weird guy once forgot to mask his super secret password o!kxX......6#1.3! ... but we could help'
        );
    });

    it('should pertain immutability of the original simple object', () => {
        const input = {
            password: 'testpassword'
        };
        type Input = typeof input;
        const result = maskData(input);
        expect(result).not.toBe(input);
        expect((input as Input).password).toBe('testpassword');
    });

    it('should pertain immutability of the original complex object', () => {
        const input = {
            userData: {
                password: 'testpassword',
                credentials: {
                    email: 'john@doe.com'
                }
            }
        };
        type Input = typeof input;
        const result = maskData(input);
        expect(result).not.toBe(input);
        expect((result as Input).userData.credentials.email).toBe('jo********om');
        expect((input as Input).userData.credentials.email).toBe('john@doe.com');
    });

    it('should mutate the original object', () => {
        const input = {
            password: 'testpassword'
        };
        maskData(input, { immutable: false });
        expect((input as { password: string }).password).not.toBe('testpassword');
    });

    it('should passthrough a boolean', () => {
        expect(maskData(true)).toBe(true);
    });

    it('should not mask anything', () => {
        expect(maskString('Hello, World!')).toBe('Hello, World!');
    });

    it('should mask credit card data', () => {
        expect(
            maskString('another line with just a credit card: 1234 5678 9101 1121 and some arbitrary text behind it')
        ).toBe('another line with just a credit card: 12***************21 and some arbitrary text behind it');
    });

    it('should mask credit card data with dashes', () => {
        expect(
            maskString('another line with just a credit card: 1234-5678-9101-1121 and some arbitrary text behind it')
        ).toBe('another line with just a credit card: 12***************21 and some arbitrary text behind it');
    });

    it('should mask email data', () => {
        expect(maskString('another line with just an email: joe.doe@acme.com and some arbitrary text behind it')).toBe(
            'another line with just an email: jo************om and some arbitrary text behind it'
        );
    });

    it('should mask a password in an arbitrary text', () => {
        expect(
            maskString(
                'a dude once exposed his super secret A1vbcvc.De#3435?r password to the world but luckily we could help'
            )
        ).toBe(
            'a dude once exposed his super secret A1***********35?r password to the world but luckily we could help'
        );
    });

    it('should mask an IP address', () => {
        expect(maskString('my designated IP adr. is 192.168.2.104 and you will never find out')).toBe(
            'my designated IP adr. is 19*********04 and you will never find out'
        );
    });

    it('should mask an url', () => {
        expect(maskString('my designated url is https://www.acme.com and you will never find out')).toBe(
            'my designated url is ht****************om and you will never find out'
        );
    });

    it('should mask a social security number', () => {
        expect(maskString('my social security number is 123-45-6789 and you will never find out')).toBe(
            'my social security number is 12*******89 and you will never find out'
        );
    });

    it('should mask a UUID', () => {
        expect(
            maskString(
                'my super generic and random UUID 123e4567-e89b-12d3-a456-426614174000 is really something to be proud of'
            )
        ).toBe(
            'my super generic and random UUID 12********************************00 is really something to be proud of'
        );
    });

    it('should mask passwords, credit cards and social security numbers but nothing else', () => {
        const fullText = `I once entered my credit card number 1234-5678-9101-1121 and my password A1vbcvc.De#3435?r
        , my email john.doe@acme.com and my ssn 123-45-6789 on the website, a friend recommended ... it can be found under https://www.acme.com/scam`;
        const result = maskString(fullText, ['password', 'creditCard', 'ssn']);
        expect(result).toBe(
            `I once entered my credit card number 12***************21 and my password A1***********35?r
        , my email john.doe@acme.com and my ssn 12*******89 on the website, a friend recommended ... it can be found under https://www.acme.com/scam`
        );
    });

    it('should mask anything, it finds', () => {
        const fullText = `I once entered my credit card number 1234-5678-9101-1121 and my password A1vbcvc.De#3435?r
        and my email john.doe@acme.com on the website, a friend recommended ... it can be found under https://www.acme.com/scam?user=john.doe&password=A1vbcvc.De#3435?r`;
        const result = maskString(fullText);
        expect(result).toBe(
            `I once entered my credit card number 12***************21 and my password A1***********35?r
        and my email jo*************om on the website, a friend recommended ... it can be found under ht**************************************************************?r`
        );
    });

    it('should mask a password and email', () => {
        expect(
            maskString(
                'my login data is username: john.doe@acme.com and pass: A1vbcvc.De#3435?r ... that is risky to share'
            )
        ).toBe('my login data is username: jo*************om and pass: A1***********35?r ... that is risky to share');
    });

    it('should mask a password but not the email', () => {
        expect(
            maskString(
                'my login data is username: john.doe@acme.com and pass: A1vbcvc.De#3435?r ... that is risky to share',
                ['password']
            )
        ).toBe('my login data is username: john.doe@acme.com and pass: A1***********35?r ... that is risky to share');
    });

    it('should mask a password and the Credit Card but not the email', () => {
        expect(
            maskString(
                'for my purchase I used 9876-5432-1098-7654 and my login data is username: john.doe@acme.com and pass: A1vbcvc.De#3435?r ... that is risky to share',
                ['password', 'creditCard']
            )
        ).toBe(
            'for my purchase I used 98***************54 and my login data is username: john.doe@acme.com and pass: A1***********35?r ... that is risky to share'
        );
    });

    it('should mask custom tags in an object', () => {
        const data = {
            arbitraryKeyToMask: "OhMyGosh! It's masked",
            anotherSensitiveKey: 'No way, this is masked, too!',
            safeString: 'Hello, World!'
        };
        const customKeyCheck = (key: string) => ['arbitraryKeyToMask', 'anotherSensitiveKey'].includes(key);
        const maskedDataWithCustomCheck = maskData(data, { keyCheck: customKeyCheck, immutable: true });
        expect(maskedDataWithCustomCheck).toEqual({
            arbitraryKeyToMask: 'Oh*****************ed',
            anotherSensitiveKey: 'No************************o!',
            safeString: 'Hello, World!'
        });
    });

    it('should mask an array of strings', () => {
        const input = ['array', 'with', 'strings', { passwordField: 'HideMe' }];
        expect(maskArguments(input)).toEqual(['array', 'with', 'strings', { passwordField: 'Hi**Me' }]);
    });

    it('should mask a map of strings', () => {
        const map = new Map<string, unknown>();
        map.set('password', 'SuperSecret');
        map.set('nested', {
            cc: '9876-5432-1098-7654'
        });
        map.set('wild', ['This is not masked', { passwordField: 'blerch' }]);
        const result = maskData<Map<string, unknown>>(map);
        expect(result).not.toBe(map);
        expect(result.get('password')).toBe('Su*******et');
        expect(result.get('nested')).toEqual({
            cc: '98***************54'
        });
    });

    it('should mask an arbitrary object', () => {
        const obj = {
            password: 'SuperSecret',
            nested: {
                cc: '9876-5432-1098-7654',
                safeString: 'Hello, World!',
                recruiter_email: 'gustav.gans@entenhausen.de',
                deeper: {
                    password: 'Yf3Ujxxxy12oAY0l'
                }
            },
            wild: ['This is not masked', { passwordField: 'blerch' }]
        };
        expect(maskData(obj)).toEqual({
            password: 'Su*******et',
            nested: {
                cc: '98***************54',
                deeper: {
                    password: 'Yf************0l'
                },
                recruiter_email: 'gu**********************de',
                safeString: 'Hello, World!'
            },
            wild: ['This is not masked', { passwordField: 'bl**ch' }]
        });
    });

    it('masks sensitive content in a string with a custom regex', () => {
        // Define a custom regex that identifies a pattern "customSensitiveData: any-text-here"
        const customRegExp = { customPattern: /customSensitiveData:\s*(\S+)/gi };

        // Mock data that includes the pattern our custom regex should catch
        const stringWithCustomSensitive = `This is a string with customSensitiveData:verySensitive data which should be masked`;

        // Call maskData with the mockData and custom regex
        const result = maskString(stringWithCustomSensitive, undefined, customRegExp);

        // Assert that the returned value matches the expected result
        expect(result).toEqual('This is a string with cu*****************************ve data which should be masked');
    });

    it('masks sensitive data identified by a custom regular expression', () => {
        // Define a custom regex that identifies a pattern "customSensitiveData: any-text-here"
        const customRegExp = { customPattern: /customSensitiveData:\s*(\S+)/gi };

        // Mock data that includes the pattern our custom regex should catch
        const data = {
            id: 1,
            name: 'Test Name',
            customField: 'customSensitiveData: verySensitive'
        };

        const expectedResult = {
            ...data,
            customField: 'cu******************************ve'
        };

        // Call maskData with the mockData and custom regex
        const result = maskData(data, { customPatterns: customRegExp });

        // Assert that the returned value matches the expected result
        expect(result).toEqual(expectedResult);
    });
});
