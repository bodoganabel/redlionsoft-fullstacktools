import type { DisplayMode } from "./types";

export function getIndentationLevel(path: string): number {
  return path.split(".").length - 1;
}

export function getDisplayName(
  key: string,
  path: string,
  displayMode: DisplayMode,
  getFieldAlias: (path: string) => string
): string {
  if (displayMode === "tree") {
    // In tree mode, use the key or its alias if defined
    return getFieldAlias(key) || key;
  }
  // In linear mode, use the full path or its alias
  return getFieldAlias(path) || path;
}

export function renderField(
  key: string,
  value: any,
  path: string,
  displayMode: DisplayMode,
  isFieldHidden: (path: string) => boolean,
  isFieldDisabled: (path: string) => boolean,
  getFieldAlias: (path: string) => string
): any {
  const currentPath = path ? `${path}.${key}` : key;

  if (isFieldHidden(currentPath)) {
    return null;
  }

  if (typeof value === "object" && value !== null) {
    if (Object.keys(value).length === 0) {
      return null;
    }

    const result =
      displayMode === "tree"
        ? [
            {
              path: currentPath,
              key,
              displayName: getDisplayName(key, currentPath, displayMode, getFieldAlias),
              value: "",
              disabled: true,
              isObject: true,
            },
          ]
        : [];

    const nestedFields = Object.entries(value).map(([nestedKey, nestedValue]) =>
      renderField(
        nestedKey,
        nestedValue,
        currentPath,
        displayMode,
        isFieldHidden,
        isFieldDisabled,
        getFieldAlias
      )
    );

    return [...result, ...nestedFields.filter((field) => field !== null).flat()];
  }

  return [
    {
      path: currentPath,
      key,
      displayName: getDisplayName(key, currentPath, displayMode, getFieldAlias),
      value: value === null ? "" : String(value),
      disabled: isFieldDisabled(currentPath),
      isObject: false,
    },
  ];
}
