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

export function extractFields(obj: any, prefix = ""): TFilterField[] {
  return Object.entries(obj).reduce((acc: TFilterField[], [key, value]) => {
    const fieldPath = prefix ? `${prefix}.${key}` : key;
    const label = key
      .split(/(?=[A-Z])|_/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return [...acc, ...extractFields(value, fieldPath)];
    }

    return [...acc, { value: fieldPath, label }];
  }, []);
}
