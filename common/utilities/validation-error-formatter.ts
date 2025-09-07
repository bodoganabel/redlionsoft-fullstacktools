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
        // Enhanced error message to include full path context
        let errorMessage = error;
        if (typeof error === 'string' && error.includes("can't access property")) {
          // Extract the property name from the error and add full path context
          const propertyMatch = error.match(/can't access property "([^"]+)"/);
          if (propertyMatch) {
            const missingProperty = propertyMatch[1] || '';
            const fullPath = currentPath ? `${currentPath}.${missingProperty}` : missingProperty;
            errorMessage = `required property missing`;
            // Update the path to include the missing property
            focusedErrors.push({
              path: fullPath,
              actualValue: undefined,
              expectedType: errorMessage,
            });
            return; // Skip the normal push below
          }
        }
        
        focusedErrors.push({
          path: currentPath || 'root',
          actualValue,
          expectedType: errorMessage,
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
  
  // Create a tree structure that mirrors the original object shape
  const errorTree: any = {};
  
  errors.forEach(error => {
    const pathParts = error.path.split('.');
    let current = errorTree;
    
    // Navigate to the correct nested position
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (part && !current[part]) {
        current[part] = {};
      }
      if (part) {
        current = current[part];
      }
    }
    
    // Set the error message at the final path
    const finalKey = pathParts[pathParts.length - 1];
    if (finalKey) {
      // Clean up the error message by removing "Invalid input: " prefix
      let cleanMessage = error.expectedType;
      if (cleanMessage.startsWith('Invalid input: ')) {
        cleanMessage = cleanMessage.replace('Invalid input: ', '');
      }
      if (cleanMessage.startsWith('Invalid option: ')) {
        cleanMessage = cleanMessage.replace('Invalid option: ', '');
      }
      current[finalKey] = cleanMessage;
    }
  });
  
  const stringifiedErrors = JSON.stringify(errorTree, null, 2);
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
): string {
  // Use Zod's format method to get structured error tree
  const treeifiedError = zodError.format ? zodError.format() : zodError;
  
  // Extract focused errors
  const focusedErrors = extractFocusedValidationErrors(treeifiedError, originalInput);

  console.log('🔥🔥🔥🔥🔥focusedErrors:');
  console.log(focusedErrors);
  
  // Format and log
  const formattedOutput = formatFocusedValidationErrors({errors:focusedErrors, origin, originalInput});
  console.log(formattedOutput);
  return formattedOutput;
}
