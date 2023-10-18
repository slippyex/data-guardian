# data-guardian 🔒
[![CircleCI](https://dl.circleci.com/status-badge/img/gh/slippyex/data-guardian/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/slippyex/data-guardian/tree/main)
![GitHub package.json version](https://img.shields.io/github/package-json/v/slippyex/data-guardian)
![NPM](https://img.shields.io/npm/l/data-guardian)

`data-guardian` is a nimble, zero-dependency and lightweight NPM package crafted for developers who prioritize data security and privacy. This handy utility enables you to mask sensitive strings and object properties, safeguarding critical data from prying eyes, especially in logs or UI displays. Notably, it maintains the immutability of your data by default, though this feature is optional and customizable based on your needs.

## ✨ Features

- 🔒 **String Masking**: Conceal parts of a string to hide sensitive data while keeping some characters visible for validation.
- 🕵️ **Object Masking**: Automatically masks properties identified as sensitive in objects.
- 📜 **Argument Masking**: Mask sensitive data in an array of arguments.
- 📝 **Custom Sensitive Data**: Define your own custom regular expressions to identify and mask sensitive data in strings.
- 🗃️ **Collection Masking**: Automatically mask sensitive data in Map, Set, and Error instances.
- 🔮 **Immutability (Optional)**: By default, it doesn't alter your original data structure unless configured to do so.
- 🖌️ **Custom Masking**: Define your custom logic to pinpoint which keys in objects should be masked.
- 📦 **Lightweight**: No dependencies, no bloat. `data-guardian` is a lightweight package that won't slow down your app.
- ⚙️ **Configurable**: Set the masking character to any commonly used character, and specify the length of the content to mask.
- 🕵️ **Fixed length masking**: Ability to mask a fixed length of characters in a string. This removes hints of actual length of the sensitive data.
- 📚 **Typescript Support**: `data-guardian` is written in TypeScript and comes with full type definitions.
- 📜 **Explicit exclusion for masking**: Explicitly exclude potential sensitive content in strings by wrapping the content with '##'
 

## 🚀 Getting Started

### Installation

```sh
npm install data-guardian
```

### Usage

Here's a quick peek at how `data-guardian` can be integrated into your JavaScript/TypeScript projects:

```javascript
const { maskData, maskString, maskArguments } = require('data-guardian');

// Masking a string
console.log(maskString('SensitiveData123!')); // Output: "Se************123!"

// Masking an arbitary string with sensitive data
console.log(maskString('a dude once exposed his super secret A1vbcvc.De#3435?r password to the world but luckily we could help')); 
// Output: "a dude once exposed his super secret A1***********35?r password to the world but luckily we could help"

// Masking object's properties
const user = { username: 'johndoe', password: 'SuperSecretPassword!' };
console.log(maskData(user)); 
// Output: { username: 'johndoe', password: 'Su***************d!' }

// Masking arguments list
console.log(maskArguments(['SensitiveArgument1', 'SensitiveArgument2'])); 
// Output: ["Se*****************1", "Se*****************2"]
```

## 📚 Defaults
By default, `data-guardian` masks the following data types in free-form strings and object properties:
* credit card numbers
* email addresses
* IPv4 addresses
* UUIDs
* phone numbers
* social security numbers
* URLs
* Passwords
* Custom sensitive data (see [Customization](#-customization))

## 🛡️ Immutability

By default, `data-guardian` preserves the immutability of your data, meaning your original input remains untouched. However, if you prefer to alter the original data, you can do so by setting the immutability option to `false`.

```javascript
const user = { password: 'SuperSecretPassword!' };
maskData(user, { immutable: false }); // This will mutate the `user` object
console.log(user); 
// Output: { password: 'Su***************d!' }
```

## ⚙️ Customization

With data-guardian, you're not limited to the predefined sensitive data types! You can extend its functionality by providing your own custom regular expressions for identifying and masking sensitive data in strings, or by providing a custom function to determine which keys to mask in objects:

```javascript
// Define a custom regex that identifies a pattern "customSensitiveData: any-text-here"
const customRegExp = { customPattern: /customSensitiveData:\s*(\S+)/gi };

const data = {
    id: 1,
    name: 'Test Name',
    customField: 'customSensitiveData: verySensitive'
};
console.log(maskData(data, { customSensitiveContentRegExp: customRegExp })); 
// Output: { id: 1, name: 'Test Name', customField: 'cu******************************ve' }

// Custom regular expressions for string masking
const customPatterns = {
    secretCode: /my-secret-code-\d{3}/gi, // matches 'my-secret-code-123', 'my-secret-code-456', etc.
};

console.log(maskString('Here is my-secret-code-123!', { customPatterns }));
// Output: "Here is my-*********-123!"

const customMaskingLogic = (key) => {
// add your custom logic here. Return true for keys you want to mask
return ['customSensitiveKey', 'anotherSensitiveKey'].includes(key);
};

const data = { customSensitiveKey: 'HideThis', anotherSensitiveKey: 'AndThis', normalKey: 'ButNotThis' };
console.log(maskData(data, { keyCheck: customMaskingLogic })); 
// Output: { customSensitiveKey: 'Hi******s', anotherSensitiveKey: 'An******s', normalKey: 'ButNotThis' }
```

## 🌟 Advanced Usage
Masking Data in a Map, Set, and Error Instances

`data-guardian` extends its masking capabilities to Map, Set, and Error instances as well. Below are examples illustrating how to mask sensitive data stored in these structures:

### Masking Data in a Map:

```javascript
const sensitiveMap = new Map();
sensitiveMap.set('username', 'johndoe');
sensitiveMap.set('password', 'SuperSecretPassword!');

const maskedMap = maskData(sensitiveMap);
console.log(Array.from(maskedMap.entries()));
// Output: [["username", "johndoe"], ["password", "Su***************d!"]]
```

### Masking Data in a Set:

```javascript
const sensitiveSet = new Set(['SensitiveData1', 'SensitiveData2']);
const maskedSet = maskData(sensitiveSet);
console.log(Array.from(maskedSet));
// Output: ["Se**************1", "Se**************2"]
```

### Masking Data in an Error:

```javascript
const sensitiveError = new Error('Sensitive message containing user password: SuperSecretPassword!');
const maskedError = maskData(sensitiveError);
console.log(maskedError.message);
// Output: "Sensitive message containing user password: Su***************d!"
```

Remember, when working with Maps, the immutable option is especially handy as it prevents the original Map from being altered, ensuring data integrity and consistency across your application.

### Custom Masking Configuration:
`data-guardian` allows for custom configuration through the `IMaskDataOptions` interface. You can specify a custom function to determine which keys to mask in objects, set a custom masking character, and define the length of characters to mask out among other options:

```javascript
const customMaskingConfig = {
    keyCheck: (key) => key.includes('Sensitive'),
    maskingChar: '#',
    maskLength: 10,
};

const data = {
    id: 1,
    SensitiveInfo: 'VerySensitiveData',
};

console.log(maskData(data, customMaskingConfig));
// Output: { id: 1, SensitiveInfo: 'Very##########Data' }
```

### Explicit exclusion for masking:
`data-guardian` allows for explicit bypassing masking of potential sensitive content in strings by wrapping the content with '##'

```javascript
const exampleString = 'SpanWidth01 is invalid!';
console.log(maskString(exampleString));
// Output: "Sp*******01 is invalid!"

const exampleNonMaskedString = '##SpanWidth01## is invalid!';
console.log(maskString(exampleNonMaskedString));
// Output: "SpanWidth01 is invalid!"

console.log(maskData({ username: 'johndoe', password: '##SuperSecretPassword!##' }));
// Output: { username: 'johndoe', password: 'SuperSecretPassword!' }

```

## 📜 API Reference

This section provides detailed information about the functions available in the Sensitive Content Masker library.

### `maskString(value: string, options?: Partial<IMaskOptions>): string`

Masks sensitive parts of a string based on the provided options.

#### Parameters

- `value` (string): The string containing potential sensitive content that needs to be masked.
- `options` (Object, optional): A set of configurations for the masking process. This includes:
    - `maskingChar` (string, default: '*'): The character used for masking sensitive content.
    - `maskLength` (number, default: consistent with the length of sensitive content): The number of characters to show in the mask. If `fixedMaskLength` is set to true, `maskLength` will determine the exact number of masking characters, regardless of the original content length.
    - `types` (Array<string>, optional): Predefined types of sensitive information to mask, such as 'creditCard', 'ssn', 'password', etc.
    - `fixedMaskLength` (boolean, default: false): Determines if the mask should display a fixed number of characters.
    - `customPatterns` (Object, optional): Custom regular expressions for identifying and masking additional types of sensitive content. The keys are custom names, and the values are the RegExp patterns.
    - `immutable` (boolean, default: false): If true, the function returns a new string with masked content, keeping the original string unaltered.
    - `keyCheck` (Function, not used here but applicable in `maskData`): A callback function used to check if an object's key should have its value masked.

#### Return value

- (string): The input string with sensitive content masked according to the specified options.

### `maskData<T>(data: T, options?: Partial<IMaskOptions>): T`

Recursively masks sensitive data in an object, array, or any other nested structure based on the provided options.

#### Parameters

- `data` (T): The data structure containing potential sensitive information. It could be an object, array, Map, Set, etc.
- `options` (Object, optional): A set of configurations for the masking process, similar to the `maskString` function. Additionally, it uses the `keyCheck` function to decide if an object's key should have its value masked, based on the key name.

#### Return value

- (T): A new data structure with the same type as the input, containing masked sensitive content. If `immutable` is false, it alters the original data; otherwise, it returns a new instance.

These functions are generic and designed to handle various types of data structures, ensuring sensitive information is adequately masked while retaining the original data format and type.

## ⚠️ Disclaimer

`data-guardian` is designed to provide an additional layer of security by masking strings and object properties that contain sensitive information. However, it is not a substitute for comprehensive security practices. Ensure you follow industry standards and regulations for data protection and privacy.

## 🎈 Contributing

If you have ideas on how to improve `data-guardian` or want to report a bug, please open an issue or submit a pull request. We appreciate your help and contributions!

## 📜 License

MIT

