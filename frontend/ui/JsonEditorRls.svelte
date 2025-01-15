<script lang="ts">
  import { differenceDeep } from "./../../common/utilities/data";
  import { clone, equals } from "ramda";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  export let initialData: Record<string, any> | string = {};
  export let onSave: (changedFields: Record<string, any>) => void;

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
</script>

<div class="w-full space-y-4">
  {#each Object.entries($dataStore) as [key, value]}
    <div class="flex flex-col">
      <label class="text-sm font-medium text-gray-700 mb-1" for={key}>
        {key}
      </label>
      <input
        type="text"
        id={key}
        class="input"
        {value}
        on:input={(e) =>
          handleInputChange(
            key,
            //@ts-ignore
            e.target.value
          )}
      />
    </div>
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
