# data-guardian-masker 🔒

`data-guardian-masker` is a nimble, zero-dependency and lightweight NPM package crafted for developers who prioritize data security and privacy. This handy utility enables you to mask sensitive strings and object properties, safeguarding critical data from prying eyes, especially in logs or UI displays. Notably, it maintains the immutability of your data by default, though this feature is optional and customizable based on your needs.

## ✨ Features

- 🔒 **String Masking**: Conceal parts of a string to hide sensitive data while keeping some characters visible for validation.
- 🕵️ **Object Masking**: Automatically masks properties identified as sensitive in objects.
- 🔮 **Immutability (Optional)**: By default, it doesn't alter your original data structure unless configured to do so.
- 🖌️ **Custom Masking**: Define your custom logic to pinpoint which keys in objects should be masked.
- 📦 **Lightweight**: No dependencies, no bloat. `data-guardian-masker` is a lightweight package that won't slow down your app.

## 🚀 Getting Started

### Installation

```sh
npm install data-guardian-masker
```

### Usage

Here's a quick peek at how `data-guardian-masker` can be integrated into your JavaScript/TypeScript projects:

```javascript
const { maskData, maskString, maskArguments } = require('data-guardian-masker');

// Masking a string
console.log(maskString('SensitiveData123!')); // Output: "Se************123!"

// Masking object's properties
const user = { username: 'johndoe', password: 'SuperSecretPassword!' };
console.log(maskData(user)); // Output: { username: 'johndoe', password: 'Su***************d!' }

// Masking arguments list
console.log(maskArguments(['SensitiveArgument1', 'SensitiveArgument2'])); // Output: ["Se*****************1", "Se*****************2"]
```

## 🛡️ Immutability

By default, `data-guardian-masker` preserves the immutability of your data, meaning your original input remains untouched. However, if you prefer to alter the original data, you can do so by setting the immutability option to `false`.

```javascript
const user = { password: 'SuperSecretPassword!' };
maskData(user, null, false); // This will mutate the `user` object
console.log(user); // Output: { password: 'Su***************d!' }
```

## ⚙️ Customization

You're not limited to the predefined sensitive data types! Extend the functionality by providing a custom function to determine which keys to mask:

```javascript
const customMaskingLogic = (key) => {
// add your custom logic here. Return true for keys you want to mask
return ['customSensitiveKey', 'anotherSensitiveKey'].includes(key);
};

const data = { customSensitiveKey: 'HideThis', anotherSensitiveKey: 'AndThis', normalKey: 'ButNotThis' };
console.log(maskData(data, customMaskingLogic)); // Output: { customSensitiveKey: 'Hi******s', anotherSensitiveKey: 'An******s', normalKey: 'ButNotThis' }
```

## ⚠️ Disclaimer

`data-guardian-masker` is designed to provide an additional layer of security by masking strings and object properties that contain sensitive information. However, it is not a substitute for comprehensive security practices. Ensure you follow industry standards and regulations for data protection and privacy.

## 🎈 Contributing

If you have ideas on how to improve `data-guardian-masker` or want to report a bug, please open an issue or submit a pull request. We appreciate your help and contributions!

## 📜 License

MIT

