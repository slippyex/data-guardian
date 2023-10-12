# Data-Guardian-Masker

`Data-Guardian-Masker` is a robust JavaScript utility with zero-dependency crafted to secure sensitive strings and objects by masking confidential data within them. This library is indispensable in contexts where data privacy is paramount, such as logging, debugging, or displaying data that contains sensitive information.

## Key Features

- Comprehensive: Masks a wide array of sensitive data, including passwords, emails, credit card numbers, social security numbers, URLs, and IP addresses.
- Customizable: Allows for custom configurations to define data sensitivity, extending the flexibility of what can be considered sensitive.
- Deep Scanning: Efficiently handles different data structures like objects and arrays, providing thorough masking of nested sensitive data.
- Intelligent Masking: Ensures only string data is masked, leaving other data types untouched for structural integrity.
- zero-dependency: No external libraries required. Small footprint and easy to integrate into any project.
- immutable: Does not mutate the original data structure. Returns a new object with masked data.
- TypeScript Support: Written in TypeScript with full type definitions.

## Installation

`Data-Guardian-Masker` is an ES module. Simply include it in your project by copying the source code into a `.js` or `.ts` file and import it as usual.

## Usage

### Masking Strings

```javascript
import { maskString } from 'data-guardian-masker';

// Basic usage
const originalString = 'This string contains a credit card number: 1234 5678 9101 1121.';
const maskedString = maskString(originalString);
console.log(maskedString); // The credit card number will be masked

// Selective masking
const url = 'Visit my site at https://www.example.com. It is a great site! And here is my mail: john.doe@acme.com';
const maskedUrl = maskString(url, ['url']);
console.log(maskedUrl); // The URL will be masked but the email will still be clear-text
```

### Masking Complex Data Structures

```javascript
import { dataGuard } from 'data-guardian-masker';

const userObject = {
  username: 'realUser',
  password: 'verySecretPassword!',
  personalDetails: {
    email: 'private@email.com',
    ssn: '111-22-3333',
  },
  paymentMethods: [
    '1234 5678 9101 1121',
    '4321 8765 1098 7654'
  ]
};

const maskedUser = maskData(userObject);
console.log(maskedUser); // All sensitive information will be masked
```

### Custom Sensitivity Definition

```javascript
const customSensitivityCheck = (key) => ['customSensitive', 'privateKey'].includes(key);
const customMaskedData = maskData(userObject, customSensitivityCheck);
console.log(customMaskedData); // Masking applied with custom sensitivity definitions
```

## Contributions

Contributions to enhance `Data-Guardian-Masker` are warmly welcomed. Feel free to submit pull requests or open issues to discuss potential improvements. Please ensure your contributions are well-documented and tested, maintaining the library's integrity.

## License

`Data-Guardian-Masker` is MIT licensed. Refer to the `LICENSE` file for detailed information.

## Disclaimer

While `Data-Guardian-Masker` is designed to prevent unintentional exposure of sensitive data in various structures, it is not a substitute for comprehensive security measures. Always ensure sensitive data is handled with stringent security practices, including encryption and secure data storage/transmission.
