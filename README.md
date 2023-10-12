# Data-Guardian-Masker

`Data-Guardian-Masker` is a robust JavaScript utility crafted to secure sensitive strings and objects by masking confidential data within them. This library is indispensable in contexts where data privacy is paramount, such as logging, debugging, or displaying data that contains sensitive information.

## Key Features

- Comprehensive: Masks a wide array of sensitive data, including passwords, emails, credit card numbers, social security numbers, URLs, and IP addresses.
- Customizable: Allows for custom configurations to define data sensitivity, extending the flexibility of what can be considered sensitive.
- Deep Scanning: Efficiently handles different data structures like objects and arrays, providing thorough masking of nested sensitive data.
- Intelligent Masking: Ensures only string data is masked, leaving other data types untouched for structural integrity.

## Installation

`DataGuardian-Masker` is an ES module. Simply include it in your project by copying the source code into a `.js` or `.ts` file and import it as usual.

## Usage

### Masking Strings

```javascript
import { maskString } from './DataGuardian-Masker';

// Basic usage
const originalString = 'This string contains a credit card number: 1234 5678 9101 1121.';
const maskedString = maskString(originalString);
console.log(maskedString); // The credit card number will be masked

// Selective masking
const url = 'Visit my site at https://www.example.com.';
const maskedUrl = maskString(url, ['url']);
console.log(maskedUrl); // The URL will be masked
```

### Masking Complex Data Structures

```javascript
import { dataGuard } from './DataGuardian-Masker';

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

const maskedUser = dataGuard(userObject);
console.log(maskedUser); // All sensitive information will be masked
```

### Custom Sensitivity Definition

```javascript
const customSensitivityCheck = (key) => ['customSensitive', 'privateKey'].includes(key);
const customMaskedData = maskData(userObject, customSensitivityCheck);
console.log(customMaskedData); // Masking applied with custom sensitivity definitions
```

## Contributions

Contributions to enhance `DataGuardian-Masker` are warmly welcomed. Feel free to submit pull requests or open issues to discuss potential improvements. Please ensure your contributions are well-documented and tested, maintaining the library's integrity.

## License

`DataGuardian-Masker` is MIT licensed. Refer to the `LICENSE` file for detailed information.

## Disclaimer

While `DataGuardian-Masker` is designed to prevent unintentional exposure of sensitive data in various structures, it is not a substitute for comprehensive security measures. Always ensure sensitive data is handled with stringent security practices, including encryption and secure data storage/transmission.
