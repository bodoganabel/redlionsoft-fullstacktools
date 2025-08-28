import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { extractFocusedValidationErrors, formatFocusedValidationErrors, logFocusedValidationErrors } from './validation-error-formatter';

describe('Focused Validation Error Formatter', () => {
  it('should extract focused errors from nested object validation failures', () => {
    // Define a complex nested schema
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      details: z.object({
        email: z.string().email(),
        address: z.object({
          street: z.string(),
          city: z.string(),
          zipCode: z.string().regex(/^\d{5}$/)
        }),
        preferences: z.array(z.object({
          category: z.string(),
          value: z.boolean()
        }))
      })
    });

    // Create invalid input data
    const invalidData = {
      name: 123, // should be string
      age: "thirty", // should be number
      details: {
        email: "invalid-email", // should be valid email
        address: {
          street: "123 Main St",
          city: "", // should not be empty
          zipCode: "invalid" // should match regex
        },
        preferences: [
          {
            category: "notifications",
            value: "yes" // should be boolean
          }
        ]
      }
    };

    // Validate and get errors
    const result = schema.safeParse(invalidData);
    expect(result.success).toBe(false);

    if (!result.success) {
      const treeifiedError = result.error.format();
      const focusedErrors = extractFocusedValidationErrors(treeifiedError, invalidData);

      // Should extract all problematic fields
      expect(focusedErrors.length).toBeGreaterThan(0);

      // Check that we get the expected error paths
      const errorPaths = focusedErrors.map(err => err.path);
      expect(errorPaths).toContain('name');
      expect(errorPaths).toContain('age');
      expect(errorPaths).toContain('details.email');
      expect(errorPaths).toContain('details.address.city');
      expect(errorPaths).toContain('details.address.zipCode');
      expect(errorPaths).toContain('details.preferences.0.value');

      // Check that actual values are captured correctly
      const nameError = focusedErrors.find(err => err.path === 'name');
      expect(nameError?.actualValue).toBe(123);
      expect(nameError?.expectedType).toContain('string');

      const emailError = focusedErrors.find(err => err.path === 'details.email');
      expect(emailError?.actualValue).toBe('invalid-email');
      expect(emailError?.expectedType).toContain('string');
    }
  });

  it('should format focused errors into tree structure', () => {
    const focusedErrors = [
      {
        path: 'name',
        actualValue: 123,
        expectedType: 'string',
        message: 'Expected string, received number'
      },
      {
        path: 'details.email',
        actualValue: 'invalid-email',
        expectedType: 'valid email',
        message: 'Invalid email'
      }
    ];

    const formatted = formatFocusedValidationErrors({ errors: focusedErrors, origin: 'Test Validation', originalInput: {} });

    expect(formatted).toContain('❌ Test Validation Errors (2 issues)');
    expect(formatted).toContain('"name"');
    expect(formatted).toContain('"actualValue": 123');
    expect(formatted).toContain('"expectedType": "string"');
    expect(formatted).toContain('"details"');
    expect(formatted).toContain('"email"');
    expect(formatted).toContain('"actualValue": "invalid-email"');
    expect(formatted).toContain('"expectedType": "valid email"');
  });

  it('should handle array validation errors correctly', () => {
    const schema = z.object({
      items: z.array(z.object({
        id: z.number(),
        name: z.string()
      }))
    });

    const invalidData = {
      items: [
        { id: 1, name: "valid" },
        { id: "invalid", name: 123 } // both fields invalid
      ]
    };

    const result = schema.safeParse(invalidData);
    if (!result.success) {
      const treeifiedError = result.error.format();
      const focusedErrors = extractFocusedValidationErrors(treeifiedError, invalidData);

      const errorPaths = focusedErrors.map(err => err.path);
      expect(errorPaths).toContain('items.1.id');
      expect(errorPaths).toContain('items.1.name');

      const idError = focusedErrors.find(err => err.path === 'items.1.id');
      expect(idError?.actualValue).toBe('invalid');
    }
  });

  it('should handle empty validation errors gracefully', () => {
    const formatted = formatFocusedValidationErrors({ errors: [], origin: 'Test', originalInput: {}});
    expect(formatted).toBe('✅ Test: No validation errors');
  });
});
