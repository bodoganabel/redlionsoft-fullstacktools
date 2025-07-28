import { describe, it, expect } from 'vitest';
import { pathFromNestedProperty, valueFromPath } from './data';

// Note: pathFromNestedProperty returns only property paths WITHOUT root object names.
// Including root names in a type-safe way is impossible in TypeScript/JavaScript.

type TRandomUserMocktype = {
    name: string;
    address: {
        city: string;
    };
    profile: {
        contacts: {
            email: string;
        }[];
    };
    addresses: {
        city: string;
        arrayWithinArray: { key: string }[];
    }[];
}

const randomUserMock: TRandomUserMocktype = {
    name: 'John Doe',
    address: {
        city: 'New York',
    },
    profile: {
        contacts: [{
            email: 'john.doe@example.com',
        }, {
            email: 'jane.doe@example.com',
        }, {
            email: 'doe.john@example.com',
        }],
    },
    addresses: [{
        city: 'New York',
        arrayWithinArray: [{ key: 'New York' }],
    }]
}


type TSubmissionServerMocktype = {
    event: {
        mandatoryFields: {
            emailAnswer: string;
        };
    };
}

describe('pathFromNestedProperty & valueFromPath', () => {
    it('should return empty string when no nesting (root object)', () => {
        const path = pathFromNestedProperty((randomUserMock: TRandomUserMocktype) => randomUserMock);
        expect(path).toBe('');
        const value = valueFromPath(randomUserMock, path);
        expect(value).toBe(randomUserMock);
    });

    it('should return single level property path', () => {
        const path = pathFromNestedProperty((randomUserMock: TRandomUserMocktype) => randomUserMock.name);
        expect(path).toBe('name');
        const value = valueFromPath(randomUserMock, path);
        expect(value).toBe(randomUserMock.name);
    });

    it('should return multi-level property path', () => {
        const path = pathFromNestedProperty((randomUserMock: TRandomUserMocktype) => randomUserMock.address.city);
        expect(path).toBe('address.city');
        const value = valueFromPath(randomUserMock, path);
        expect(value).toBe(randomUserMock.address.city);
    });
    

    it('should handle array within array nested properties', () => {
        const path = pathFromNestedProperty((randomUserMock: TRandomUserMocktype) => randomUserMock.addresses[0]?.arrayWithinArray[0]?.key);
        expect(path).toBe('addresses.0.arrayWithinArray.0.key');
        const value = valueFromPath(randomUserMock, path);
        expect(value).toBe(randomUserMock.addresses[0]?.arrayWithinArray[0]?.key);
    });
});
