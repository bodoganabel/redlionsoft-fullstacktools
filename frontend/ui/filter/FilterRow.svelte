<script lang="ts">
  import {
    type TFilterField,
    type TFilterOperator,
    type IFilter,
  } from "./filter.types";
  import { debounce } from "../../utils/debounce";
  import { onDestroy } from "svelte";

  export let filter: IFilter;
  export let onUpdate: () => void;
  export let onRemove: () => void;

  export let operators: TFilterOperator[];
  export let fields: TFilterField[];

  const debouncedUpdate = debounce(onUpdate, 500);

  console.log("filter.field:");
  console.log(filter.field);

  onDestroy(() => {
    debouncedUpdate.clear?.();
  });
</script>

<div class="flex items-center gap-2">
  <select
    bind:value={filter.field}
    on:change={onUpdate}
    class="input-small p-2 border border-slate-200 rounded-lg bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
  >
    <option value="*">Any field</option>
    {#each fields as field}
      <option value={field.value}>{field.label}</option>
    {/each}
  </select>

  <select
    bind:value={filter.operator}
    on:change={onUpdate}
    class="input-small p-2 border border-slate-200 rounded-lg bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
  >
    {#each operators as operator}
      <option value={operator.value}>{operator.label}</option>
    {/each}
  </select>

  <input
    type="text"
    bind:value={filter.value}
    on:input={debouncedUpdate}
    placeholder="Enter value"
    class="input input-small flex-1"
  />

  <button
    on:click={onRemove}
    class="px-2 py-1 text-base text-surface-500 bg-surface-100 rounded hover:bg-surface-200 hover:text-surface-600"
    aria-label="Remove filter"
  >
    ×
  </button>
</div>
