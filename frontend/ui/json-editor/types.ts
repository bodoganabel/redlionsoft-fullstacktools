export type JsonField = {
  path: string;
  key: string;
  displayName: string;
  value: string;
  disabled: boolean;
  isObject: boolean;
  indentLevel: number;
};

export type DisplayMode = "linear" | "tree";
export type FieldsPosition = "below-key" | "next-to-key";
export type ReturnsMode = "changed-fields-only" | "changed-object-full";
