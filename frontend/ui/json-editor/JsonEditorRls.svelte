<script lang="ts">
  import { differenceDeep } from "./../../../common/utilities/data";
  import { clone, equals } from "ramda";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import JsonEditorField from "./JsonEditorField.svelte";
  import { renderField, getIndentationLevel } from "./field-utils";
  import type { DisplayMode, FieldsPosition, ReturnsMode } from "./types";

  export let initialData: Record<string, any> | string = {};
  export let onSave: (changedFields: Record<string, any>) => void;
  export let hiddenFields: string[] = [];
  export let disabledFields: string[] = [];
  export let fieldAliases: Record<string, string> = {};
  export let displayMode: DisplayMode = "linear";
  export let fieldsPosition: FieldsPosition = "below-key";
  export let returns: ReturnsMode = "changed-fields-only";

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

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i] as string;
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part] as Record<string, any>;
      }

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
    // First check if there's a direct alias for this path
    if (fieldAliases[path]) {
      return fieldAliases[path];
    }
    
    // For tree mode, also check if there's an alias for just the key name
    const key = path.split('.').pop() || '';
    if (fieldAliases[key]) {
      return fieldAliases[key];
    }
    
    return path;
  }

  function getAllFields() {
    const fields = Object.entries($dataStore)
      .map(([key, value]) =>
        renderField(
          key,
          value,
          "",
          displayMode,
          isFieldHidden,
          isFieldDisabled,
          getFieldAlias
        )
      )
      .filter((field) => field !== null)
      .flat();
    return fields;
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
      <JsonEditorField {field} {fieldsPosition} onChange={handleInputChange} />
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
