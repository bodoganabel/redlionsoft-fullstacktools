import type { TFilterField } from "./filter.types";
/**
 * Recursively extracts all fields from a given object into an array of
 * TFilterField objects
 *
 * Example:
 *   const obj = {
 *     name: "John Doe",
 *     address: {
 *       street: "123 Main St"
 *     }
 *   };
 *   const fields = extractFields(obj);
 *   // fields is now an array containing:
 *   //   { value: "name", label: "Name" },
 *   //   { value: "address.street", label: "Address Street" }
 *
 * @param obj - the object from which to extract the fields
 * @param prefix - the prefix to add to each field name
 * @returns an array of TFilterField objects
 */

export type TransformContext = {
  fieldPath: string; // Full path of current field (e.g. "event.fields[0].answer")
  value: any; // Value of the current field
  parentObject: any; // Parent object containing the current field
  rootObject: any; // The root object being processed
  key: string; // Current field's key (e.g. "answer")
};

export type LabelTransformer = (context: TransformContext) => string | null; // null means use default

/**
 * Checks if a path matches any of the blacklist patterns
 * Supports:
 * - Simple glob patterns with * for any characters
 * - Exact matches with .$ suffix (blocks only the exact path, not children)
 * - Allow patterns with ! prefix
 */
function isPathBlacklisted(path: string, blacklist?: string[]): boolean {
  if (!blacklist?.length) return false;

  if (blacklist.includes(path)) return true;
  return false;
}

export function extractFields(
  obj: any,
  transformer?: LabelTransformer,
  blacklist?: string[],
  prefix = "",
  rootObject?: any
): TFilterField[] {
  // On first call, store the root object
  const root = rootObject ?? obj;

  return Object.entries(obj).reduce((acc: TFilterField[], [key, value]) => {
    const fieldPath = prefix ? `${prefix}.${key}` : key;

    const isBlacklisted = isPathBlacklisted(fieldPath, blacklist);

    // If not blacklisted, add the current field
    if (!isBlacklisted) {
      // Create transform context
      const context: TransformContext = {
        fieldPath,
        value,
        parentObject: obj,
        rootObject: root,
        key,
      };

      // Get custom label from transformer or use default
      const label = transformer ? transformer(context) ?? fieldPath : fieldPath;

      // Add the current field
      acc.push({ value: fieldPath, label });
    }

    // If it's an object (including arrays), recursively extract its fields
    if (value && typeof value === "object") {
      if (Array.isArray(value)) {
        // If it's an array and has items, extract fields from the first item
        if (value.length > 0) {
          acc.push(
            ...extractFields(
              value[0],
              transformer,
              blacklist,
              `${fieldPath}[0]`,
              root
            )
          );
        }
      } else {
        // Regular object
        acc.push(
          ...extractFields(value, transformer, blacklist, fieldPath, root)
        );
      }
    }

    return acc;
  }, []);
}
