import { reduce, has, assoc, isEmpty, equals, keys, is } from "ramda";

/**
 * Compares two objects deeply and returns a new object with the differences
 * if the property doesn't exist in the second object, it is added to the new object
 * if the property exists in both objects but the value is different, it is added to the new object
 * if the property exists in both objects and the value is the same, it is not added to the new object
 * @param objOriginal the first object to compare
 * @param objModified the second object to compare
 * @returns a new object with the differences
 */

export const differenceDeep: any = (objOriginal: any, objModified: any) => {
  return reduce(
    (acc: any, key: any) => {
      if (!has(key, objModified)) {
        // Key exists in A but not in B
        return assoc(key, objOriginal[key], acc);
      }

      const valueA = objOriginal[key];
      const valueB = objModified[key];

      if (is(Object, valueA) && is(Object, valueB)) {
        // Both are objects, compare recursively
        const diff = differenceDeep(valueA, valueB);
        return !isEmpty(diff) ? assoc(key, diff, acc) : acc;
      }

      if (!equals(valueA, valueB)) {
        // Values are different
        return assoc(key, valueB, acc);
      }

      return acc;
    },
    {},
    keys(objOriginal)
  );
};

const A = {
  foo: "something",
  deep: {
    inner1: {},
    inner2: {
      deepInner1: { value: "something", value2: "other" },
      deepInner2: 8,
    },
  },
};

const B = {
  foo: "something2",
  deep: {
    inner1: {},
    inner2: {
      deepInner1: { value: "something2", value2: "other" },
      deepInner2: 7,
      deepInner3: true,
    },
  },
};

const result = differenceDeep(A, B);
// console.log(result);


/**
 * Extracts the property access path from a function that accesses nested properties.
 * 
 * @example
 * // Returns: "details.selectedDateTime.date"
 * const path = pathFromNestedProperty((event) => event.details[0].selectedDateTime.date);
 * 
 * @remarks
 * IMPORTANT: This function returns ONLY the property path, NOT including the root object name.
 * Including root object names in a type-safe way is impossible in TypeScript/JavaScript.
 * If needed, manually add the root name, but this breaks type safety.
 * 
 * @param fn - A function that accesses nested properties of an object
 * @returns The dot-notation property path (WITHOUT the root object name, e.g. "details.0.selectedDateTime.date")
 */

export function pathFromNestedProperty<T>(fn: (obj: T) => any): string {
  const path: string[] = [];
  
  const proxy = new Proxy({}, {
    get(target: object, prop: string | symbol) {
      if (typeof prop === 'string') {
        path.push(prop);
      }
      return proxy;
    }
  });
  
  // Call the function with our proxy to capture the property access path
  fn(proxy as T);
  
  return path.join('.');
}


export function valueFromPath(obj: any, path: string): any {
    if (!path || path === '') {
        return obj;
    }
    return path.split('.').reduce((acc: any, prop: string) => acc[prop], obj);
}

/**
 * Recursively lists all object keys and nested keys from an object as dot-notation paths.
 * Returns an array of all property paths found at any depth in the object hierarchy,
 * including array indices.
 * 
 * @example
 * const obj = {
 *   name: "John",
 *   details: {
 *     age: 30,
 *     address: {
 *       city: "New York",
 *       country: "USA"
 *     }
 *   },
 *   layer1: [
 *     { prop: "something" },
 *     { prop: { key: "1", another: 4 } }
 *   ]
 * };
 * 
 * const allPaths = objectKeysRecursive(obj);
 * // Returns: ["name", "details", "details.age", "details.address", "details.address.city", 
 * //          "details.address.country", "layer1", "layer1.0.prop", "layer1.1.prop", 
 * //          "layer1.1.prop.key", "layer1.1.prop.another"]
 * 
 * @param obj - The object to extract paths from
 * @param currentPath - Internal parameter for building the current path (do not pass manually)
 * @param visited - Internal parameter to prevent infinite recursion (do not pass manually)
 * @returns Array of all dot-notation paths found in the object hierarchy
 */
export function objectKeysRecursive(obj: any, currentPath = '', visited = new WeakSet()): string[] {
    if (!obj || typeof obj !== 'object' || visited.has(obj)) {
        return [];
    }
    
    // Mark this object as visited to prevent infinite recursion
    visited.add(obj);
    
    const allPaths: string[] = [];
    
    // Handle arrays
    if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
            const indexPath = currentPath ? `${currentPath}.${index}` : `${index}`;
            
            if (item && typeof item === 'object') {
                allPaths.push(...objectKeysRecursive(item, indexPath, visited));
            }
        });
        return allPaths;
    }
    
    // Handle regular objects
    for (const key of Object.keys(obj)) {
        const keyPath = currentPath ? `${currentPath}.${key}` : key;
        allPaths.push(keyPath);
        
        const value = obj[key];
        if (value && typeof value === 'object') {
            allPaths.push(...objectKeysRecursive(value, keyPath, visited));
        }
    }
    
    return allPaths;
}