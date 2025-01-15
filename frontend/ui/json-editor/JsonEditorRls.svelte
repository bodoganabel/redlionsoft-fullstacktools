<script lang="ts">
  import { differenceDeep } from "../../../common/utilities/data";
  import { clone, equals } from "ramda";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  export let initialData: Record<string, any> | string = {};
  export let onSave: (changedFields: Record<string, any>) => void;
  export let hiddenFields: string[] = [];
  export let disabledFields: string[] = [];
  export let fieldAliases: Record<string, string> = {};
  export let displayMode: "linear" | "tree" = "linear";
  export let fieldsPosition: "next-to-key" | "below-key" = "below-key";
  export let returns: "changed-fields-only" | "changed-object-full" =
    "changed-fields-only";

  let displayedFields: any;

  const dataStore = writable<Record<string, any>>({});
  let originalData: Record<string, any>;
  let hasChanges = false;

  onMount(() => {
    let parsedData;
    if (typeof initialData === "string") {
      try {
        parsedData = JSON.parse(initialData);
      } catch (e) {
        parsedData = {};
      }
    } else {
      parsedData = clone(initialData);
    }
    dataStore.set(parsedData);
    originalData = clone(parsedData);
  });

  function handleInputChange(path: string, value: string) {
    dataStore.update((data) => {
      const newData = clone(data);
      const parts = path.split(".").filter(Boolean);
      let current = newData;
      if (!parts.length) {
        return data;
      }
      // Navigate to the parent object
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i] as string;
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part] as Record<string, any>;
      }

      // Set the value on the last part
      const lastPart = parts[parts.length - 1] as any;
      current[lastPart] = value;

      return newData;
    });

    checkForChanges();
  }

  function checkForChanges() {
    hasChanges = !equals($dataStore, originalData);
  }

  function handleSave() {
    const changedFields = differenceDeep(originalData, $dataStore);

    const dataToReturn =
      returns === "changed-fields-only" ? changedFields : $dataStore;
    onSave(dataToReturn);

    originalData = clone($dataStore);
    hasChanges = false;
  }

  function handleReset() {
    dataStore.set(clone(originalData));
    hasChanges = false;
  }

  function isFieldHidden(path: string): boolean {
    return hiddenFields.some(
      (hiddenPath) => path === hiddenPath || path.startsWith(hiddenPath + ".")
    );
  }

  function isFieldDisabled(path: string): boolean {
    return disabledFields.some(
      (disabledPath) =>
        path === disabledPath || path.startsWith(disabledPath + ".")
    );
  }

  function getFieldAlias(path: string): string {
    const alias = fieldAliases[path];
    if (alias) return alias;

    // Return the full path if no alias is defined
    return path;
  }

  function renderField(key: string, value: any, path = ""): any {
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
                displayName: getFieldAlias(currentPath),
                value: "",
                disabled: true,
                isObject: true,
              },
            ]
          : [];

      const nestedFields = Object.entries(value).map(
        ([nestedKey, nestedValue]) =>
          renderField(nestedKey, nestedValue, currentPath)
      );

      const finalResult = [
        ...result,
        ...nestedFields.filter((field) => field !== null).flat(),
      ];
      return finalResult;
    }

    const result = [
      {
        path: currentPath,
        key,
        displayName: getFieldAlias(currentPath),
        value: value === null ? "" : String(value),
        disabled: isFieldDisabled(currentPath),
        isObject: false,
      },
    ];

    return result;
  }

  function getAllFields() {
    const fields = Object.entries($dataStore)
      .map(([key, value]) => renderField(key, value))
      .filter((field) => field !== null)
      .flat();
    return fields;
  }

  function getIndentationLevel(path: string): number {
    return path.split(".").length - 1;
  }

  function renderLinearMode() {
    const fields = getAllFields()
      .filter((field) => !field.isObject)
      .map((field) => ({
        ...field,
        indentLevel: 0,
      }));
    return fields;
  }

  function renderTreeMode() {
    const fields = getAllFields().map((field) => ({
      ...field,
      indentLevel: getIndentationLevel(field.path),
    }));
    return fields;
  }

  $: {
    if ($dataStore && Object.keys($dataStore).length > 0) {
      displayedFields =
        displayMode === "linear" ? renderLinearMode() : renderTreeMode();
    }
  }
</script>

<div class="w-full space-y-4">
  {#if $dataStore && Object.keys($dataStore).length > 0}
    {#each displayedFields || [] as field}
      <div
        class="flex space-x-1"
        class:flex-col={fieldsPosition === "below-key" || field.isObject}
        class:flex-row={fieldsPosition === "next-to-key" && !field.isObject}
        style="margin-left: {field.indentLevel * 20}px"
      >
        <label class="text-sm font-medium text-gray-700 mb-1" for={field.path}>
          {field.displayName}
        </label>
        {#if !field.isObject}
          <input
            type="text"
            id={field.path}
            class="input min-w-24"
            value={field.value}
            disabled={field.disabled}
            on:input={(e) =>
              handleInputChange(
                field.path,
                //@ts-ignore
                e.target.value
              )}
          />
        {/if}
      </div>
    {/each}
  {/if}

  {#if hasChanges}
    <div class="flex justify-end space-x-3 mt-4">
      <button class="variant-outline-primary" on:click={handleReset}>
        Reset
      </button>
      <button class="variant-filled-primary" on:click={handleSave}>
        Save Changes
      </button>
    </div>
  {/if}
</div>
