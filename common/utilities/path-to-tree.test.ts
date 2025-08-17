import { describe, it, expect } from 'vitest';
import { transformErrorsToTree } from './path-to-tree';
import type { FocusedValidationError } from './validation-error-formatter';

describe('Path to Tree Transformation', () => {
    it('should transform flat error paths to nested tree structure', () => {
        const errors: FocusedValidationError[] = [
            {
                path: 'name',
                actualValue: 123,
                expectedType: 'string',

            },
            {
                path: 'details.email',
                actualValue: 'invalid-email',
                expectedType: 'valid email',

            },
            {
                path: 'details.address.city',
                actualValue: '',
                expectedType: 'non-empty string',

            },
            {
                path: 'items.0.id',
                actualValue: 'invalid',
                expectedType: 'number',

            }
        ];

        const tree = transformErrorsToTree(errors);

        // Check root level property
        expect(tree.name).toEqual({
            actualValue: 123,
            expectedType: 'string',

        });

        // Check nested property
        expect(tree.details.email).toEqual({
            actualValue: 'invalid-email',
            expectedType: 'valid email',

        });

        // Check deeply nested property
        expect(tree.details.address.city).toEqual({
            actualValue: '',
            expectedType: 'non-empty string',

        });

        // Check array index path
        expect(tree.items['0'].id).toEqual({
            actualValue: 'invalid',
            expectedType: 'number',

        });
    });

    it('should handle root path correctly', () => {
        const errors: FocusedValidationError[] = [
            {
                path: 'root',
                actualValue: null,
                expectedType: 'object',

            }
        ];

        const tree = transformErrorsToTree(errors);

        // Root errors should be at the top level
        expect(tree).toEqual({
            actualValue: null,
            expectedType: 'object',

        });
    });

    it('should handle empty errors array', () => {
        const errors: FocusedValidationError[] = [];
        const tree = transformErrorsToTree(errors);
        expect(tree).toEqual({});
    });
});
