import { assocPath } from "ramda";
import type { FocusedValidationError } from "./validation-error-formatter";

/**
 * Transforms an array of focused validation errors with dot-notation paths 
 * into a tree-like nested object structure using Ramda's assocPath.
 * 
 * @param errors - Array of focused validation errors with dot-notation paths
 * @returns Nested object representing the error tree structure
 * 
 * @example
 * // Input: [{ path: "user.name", actualValue: 123, expectedType: "string", message: "..." }]
 * // Output: { user: { name: { actualValue: 123, expectedType: "string", message: "..." } } }
 */
export function transformErrorsToTree(errors: FocusedValidationError[]): Record<string, any> {
  return errors.reduce((tree, error) => {
    const pathSegments = error.path === 'root' ? [] : error.path.split('.');
    const errorInfo = {
      actualValue: error.actualValue,
      expectedType: error.expectedType,
    };
    
    return assocPath(pathSegments, errorInfo, tree);
  }, {} as Record<string, any>);
}
