import { deepClone } from '../src/utils/helpers';

describe('deepClone tests', () => {
    // Clones an object with nested properties
    it('should clone an object with nested properties', () => {
        const obj = {
            name: 'John',
            age: 30,
            address: {
                street: '123 Main St',
                city: 'New York',
                state: 'NY'
            }
        };

        const clonedObj = deepClone(obj);

        expect(clonedObj).toEqual(obj);
        expect(clonedObj).not.toBe(obj);
        expect(clonedObj.address).toEqual(obj.address);
        expect(clonedObj.address).not.toBe(obj.address);
    });

    // Clones an array with nested objects
    it('should clone an array with nested objects', () => {
        const arr = [
            { name: 'John', age: 30 },
            { name: 'Jane', age: 25 },
            { name: 'Bob', age: 40 }
        ];

        const clonedArr = deepClone(arr);

        expect(clonedArr).toEqual(arr);
        expect(clonedArr).not.toBe(arr);
        expect(clonedArr[0]).toEqual(arr[0]);
        expect(clonedArr[0]).not.toBe(arr[0]);
    });

    // Clones a Date object
    it('should clone a Date object', () => {
        const date = new Date();
        const clonedDate = deepClone(date);

        expect(clonedDate).toEqual(date);
        expect(clonedDate).not.toBe(date);
    });

    // Clones an empty object
    it('should clone an empty object', () => {
        const obj = {};
        const clonedObj = deepClone(obj);

        expect(clonedObj).toEqual(obj);
        expect(clonedObj).not.toBe(obj);
    });

    // Clones an empty array
    it('should clone an empty array', () => {
        const arr: unknown[] = [];
        const clonedArr = deepClone(arr);

        expect(clonedArr).toEqual(arr);
        expect(clonedArr).not.toBe(arr);
    });

    // Clones a null value
    it('should clone a null value', () => {
        const value: unknown = null;
        const clonedValue = deepClone(value);
        expect(clonedValue).toBe(null);
    });

    it('should clone an object with non-enumerable properties', () => {
        const obj: { name: string; age: number; address?: string } = {
            name: 'John',
            age: 30
        };
        Object.defineProperty(obj, 'address', {
            value: {
                street: '123 Main St',
                city: 'New York',
                state: 'NY'
            },
            enumerable: false
        });

        const clonedObj = deepClone(obj);

        expect(clonedObj).toEqual(obj);
        expect(clonedObj).not.toBe(obj);
        expect(clonedObj.address).toEqual(obj.address);
        expect(clonedObj.address).not.toBe(obj.address);
    });

    it('should clone an object with inherited properties', () => {
        class Person {
            name: string;
            age: number;

            constructor(name: string, age: number) {
                this.name = name;
                this.age = age;
            }
        }

        class Employee extends Person {
            position: string;

            constructor(name: string, age: number, position: string) {
                super(name, age);
                this.position = position;
            }
        }

        const obj = new Employee('John', 30, 'Manager');

        const clonedObj = deepClone(obj);

        expect(clonedObj).toEqual(obj);
        expect(clonedObj).not.toBe(obj);
        expect(clonedObj instanceof Employee).toBe(true);
        expect(clonedObj instanceof Person).toBe(true);
    });

    it('should clone an object with circular dependencies', () => {
        // Create an object with a circular dependency
        const obj: Record<string, unknown> = {
            name: 'John'
        };
        obj.circularRef = obj;

        // Clone the object
        const clonedObj = deepClone(obj);

        // Test the cloned object
        expect(clonedObj).toEqual(obj);
        expect(clonedObj).not.toBe(obj);
        expect(clonedObj.circularRef).toEqual(clonedObj);
        expect(clonedObj.circularRef).not.toBe(obj);
    });
});
