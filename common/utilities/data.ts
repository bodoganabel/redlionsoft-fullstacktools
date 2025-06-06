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
console.log(result);


/* Expects an object like event.details.selectedDateTime.date in a form of a function:

(event) => event.details.selectedDateTime.date

and dynamically returns the full path of the nested properties as string:

"event.details.selectedDateTime.date"

The only reason it requires a function instead of just the plain object is to be able to detect the name of the object using proxy - which is not working on object properties (they are passed by value).
*/

export function getPathOfNestedObjectProperty(fn: any): string {
  // Extract the parameter name from the function string representation
  const fnStr = fn.toString();
  const paramMatch = fnStr.match(/^\s*\(?\s*([^)=\s]+)/);
  const rootName = paramMatch ? paramMatch[1] : '';

  const path: string[] = [];

  if (rootName !== '') { path.push(rootName) };
  const proxy = new Proxy({}, {
    get(target: object, prop: string) {
      path.push(prop);
      return proxy;
    }
  });
  fn(proxy);

  return path.join('.');
}
