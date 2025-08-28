import { map, filter, pipe, toPairs, fromPairs } from "ramda";
import { valueFromPath, objectKeysRecursive } from "./data";
import { transformErrorsToTree } from "./path-to-tree";

/**
 * Represents a focused validation error with only essential information
 */
export interface FocusedValidationError {
  /** The dot-notation path to the problematic property */
  path: string;
  /** The actual value that failed validation */
  actualValue: any;
  /** The expected type or constraint that was violated */
  expectedType: string;
  /** The validation error message */
}

/**
 * Extracts focused validation errors from a Zod treeified error object.
 * Returns only the problematic key-value pairs with their position, current value, and expected type.
 * 
 * @param treeifiedError - The treeified error object from zod
 * @param originalInput - The original input object that failed validation
 * @returns Array of focused validation errors
 */
export function extractFocusedValidationErrors(
  treeifiedError: any,
  originalInput: any
): FocusedValidationError[] {
  const focusedErrors: FocusedValidationError[] = [];
  
  // Recursively traverse the treeified error to find leaf errors
  function traverseErrorTree(errorNode: any, currentPath: string = ''): void {
    if (!errorNode || typeof errorNode !== 'object') {
      return;
    }
    
    // If this node has _errors array, it's a leaf error node
    if (Array.isArray(errorNode._errors) && errorNode._errors.length > 0) {
      const actualValue = currentPath ? valueFromPath(originalInput, currentPath) : originalInput;
      
      errorNode._errors.forEach((error: any) => {
        focusedErrors.push({
          path: currentPath || 'root',
          actualValue,
          expectedType: error,
        });
      });
    }
    
    // Recursively traverse child nodes
    Object.keys(errorNode).forEach(key => {
      if (key !== '_errors') {
        const childPath = currentPath ? `${currentPath}.${key}` : key;
        traverseErrorTree(errorNode[key], childPath);
      }
    });
  }
  
  traverseErrorTree(treeifiedError);
  return focusedErrors;
}


/**
 * Formats focused validation errors into a tree-like JSON structure
 */
export function formatFocusedValidationErrors(
  {errors,origin, originalInput}:{errors: FocusedValidationError[],
  origin: string,
  originalInput: any}
): string {
  if (errors.length === 0) {
    return `✅ ${origin}: No validation errors`;
  }
  
  const header = `❌ ${origin} Errors (${errors.length} issue${errors.length > 1 ? 's' : ''}):`;
  const errorTree = transformErrorsToTree(errors);
  
  const stringifiedErrors = 
    `${header}\n${JSON.stringify(errorTree, null, 2)}\n OriginalInput: ${JSON.stringify(originalInput)}`;
  console.error(stringifiedErrors);
  return stringifiedErrors;
}

/**
 * Formats a value for display in error messages
 */
function formatValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object') {
    try {
      const str = JSON.stringify(value);
      return str.length > 50 ? `${str.substring(0, 47)}...` : str;
    } catch {
      return '[object]';
    }
  }
  return String(value);
}

/**
 * Main function to process Zod validation errors and log focused errors
 */
export function logFocusedValidationErrors(
  {zodError, origin, originalInput}: {zodError: any, // Accept any ZodError-like object to handle different zod versions
  originalInput: any,
  origin: string},
): void {
  // Use Zod's format method to get structured error tree
  const treeifiedError = zodError.format ? zodError.format() : zodError;
  
  // Extract focused errors
  const focusedErrors = extractFocusedValidationErrors(treeifiedError, originalInput);
  
  // Format and log
  const formattedOutput = formatFocusedValidationErrors({errors:focusedErrors, origin, originalInput});
  console.log(formattedOutput);
}
