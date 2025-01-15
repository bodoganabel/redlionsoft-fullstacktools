<script lang="ts">
  import { differenceDeep } from "./../../common/utilities/data";
  import { clone, equals } from "ramda";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  export let initialData: Record<string, any> | string = {};
  export let onSave: (changedFields: Record<string, any>) => void;
  export let hiddenFields: string[] = [];
  export let disabledFields: string[] = [];
  export let fieldAliases: Record<string, string> = {};

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
        console.error("Invalid JSON string provided");
      }
    } else {
      parsedData = clone(initialData);
    }
    console.log("Setting initial data:", parsedData);
    dataStore.set(parsedData);
    originalData = clone(parsedData);
  });

  function handleInputChange(path: string, value: string) {
    console.log("Updating path:", path, "with value:", value);

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

      console.log("Updated data:", newData);
      return newData;
    });

    checkForChanges();
  }

  function checkForChanges() {
    hasChanges = !equals($dataStore, originalData);
  }

  function handleSave() {
    const changedFields = differenceDeep(originalData, $dataStore);

    console.log("data, originalData:");
    console.log($dataStore, originalData);

    console.log("changedFields", changedFields);

    onSave(changedFields);
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
    console.log("Rendering field:", { currentPath, value });

    if (isFieldHidden(currentPath)) {
      console.log("Field is hidden:", currentPath);
      return null;
    }

    if (typeof value === "object" && value !== null) {
      if (Object.keys(value).length === 0) {
        return null; // Skip empty objects
      }
      console.log("Processing nested object:", currentPath);
      const nestedFields = Object.entries(value).map(
        ([nestedKey, nestedValue]) =>
          renderField(nestedKey, nestedValue, currentPath)
      );
      // Filter out null values and flatten nested arrays
      return nestedFields.filter((field) => field !== null).flat();
    }

    const result = {
      path: currentPath,
      key,
      displayName: getFieldAlias(currentPath),
      value: value === null ? "" : String(value),
      disabled: isFieldDisabled(currentPath),
    };
    console.log("Returning field:", result);
    return result;
  }

  function getAllFields() {
    console.log("Getting all fields from dataStore:", $dataStore);
    const fields = Object.entries($dataStore)
      .map(([key, value]) => renderField(key, value))
      .filter((field) => field !== null)
      .flat();
    console.log("All fields:", fields);
    return fields;
  }

  $: {
    console.log("DataStore updated:", $dataStore);
  }
</script>

<div class="w-full space-y-4">
  {#if $dataStore && Object.keys($dataStore).length > 0}
    {#each getAllFields() as field}
      <div class="flex flex-col">
        <label class="text-sm font-medium text-gray-700 mb-1" for={field.path}>
          {field.displayName}
        </label>
        <input
          type="text"
          id={field.path}
          class="input"
          value={field.value}
          disabled={field.disabled}
          on:input={(e) =>
            handleInputChange(
              field.path,
              //@ts-ignore
              e.target.value
            )}
        />
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
