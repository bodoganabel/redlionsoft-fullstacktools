<script lang="ts">
  import { differenceDeep } from "./../../common/utilities/data";
  import { clone, equals } from "ramda";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  export let initialData: Record<string, any> | string = {};
  export let onSave: (changedFields: Record<string, any>) => void;
  export let hiddenFields: string[] = [];
  export let disabledFields: string[] = [];

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
    dataStore.set(parsedData);
    originalData = clone(parsedData);
  });

  function handleInputChange(key: string, value: string) {
    console.log("key, value:", key, value);
    dataStore.update((data) => ({ ...data, [key]: value }));
    console.log("$dataStore:");
    console.log($dataStore);
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
    return hiddenFields.some(hiddenPath => 
      path === hiddenPath || path.startsWith(hiddenPath + '.'));
  }

  function isFieldDisabled(path: string): boolean {
    return disabledFields.some(disabledPath => 
      path === disabledPath || path.startsWith(disabledPath + '.'));
  }

  function renderField(key: string, value: any, path = '') {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (isFieldHidden(currentPath)) {
      return null;
    }

    if (typeof value === 'object' && value !== null) {
      return Object.entries(value).map(([nestedKey, nestedValue]) => 
        renderField(nestedKey, nestedValue, currentPath));
    }

    return {
      path: currentPath,
      key,
      value: String(value),
      disabled: isFieldDisabled(currentPath)
    };
  }
</script>

<div class="w-full space-y-4">
  {#each Object.entries($dataStore) as [key, value]}
    {@const fields = renderField(key, value)}
    {#if Array.isArray(fields)}
      {#each fields as field}
        {#if field}
          <div class="flex flex-col">
            <label class="text-sm font-medium text-gray-700 mb-1" for={field.path}>
              {field.key}
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
        {/if}
      {/each}
    {:else if fields}
      <div class="flex flex-col">
        <label class="text-sm font-medium text-gray-700 mb-1" for={fields.path}>
          {fields.key}
        </label>
        <input
          type="text"
          id={fields.path}
          class="input"
          value={fields.value}
          disabled={fields.disabled}
          on:input={(e) =>
            handleInputChange(
              fields.path,
              //@ts-ignore
              e.target.value
            )}
        />
      </div>
    {/if}
  {/each}

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
