<script lang="ts">
  import IconRectangles from "./../icons/IconRectangles.svelte";
  import { createEventDispatcher } from "svelte";
  import { EFilterOperator, type IFilter, type TFilters } from "./filter.types";
  import { tooltip } from "../functionality/tooltip/tooltip.store";
  import TemplateList from "./TemplateList.svelte";

  export let activeFilters: TFilters = [
    { field: "", operator: EFilterOperator.contains, value: "" },
  ];
  export let templateListProps: any;

  const operators: Array<{ value: EFilterOperator; label: string }> = [
    { value: EFilterOperator.contains, label: "contains" },
    { value: EFilterOperator.is, label: "is" },
    { value: EFilterOperator.is_not, label: "is not" },
    { value: EFilterOperator.greater_than, label: "is greater than" },
    { value: EFilterOperator.less_than, label: "is less than" },
    { value: EFilterOperator.between, label: "is between" },
    { value: EFilterOperator.has_any_value, label: "has any value" },
  ];

  const fields = [
    { value: "order_number", label: "Order #" },
    { value: "date", label: "Date" },
    { value: "status", label: "Status" },
    { value: "email", label: "Email" },
    { value: "customer", label: "Customer" },
    { value: "purchased", label: "Purchased" },
    { value: "revenue", label: "Revenue" },
  ];

  const dispatch = createEventDispatcher();

  function addFilter() {
    activeFilters = [
      ...activeFilters,
      { field: "", operator: EFilterOperator.contains, value: "" },
    ];
  }

  function removeFilter(index: number) {
    if (activeFilters.length === 1) {
      activeFilters = [
        { field: "", operator: EFilterOperator.contains, value: "" },
      ];
    } else {
      activeFilters = activeFilters.filter((_, i) => i !== index);
    }
    dispatch("filterChange", { filters: activeFilters });
  }

  function updateFilter() {
    dispatch("filterChange", { filters: activeFilters });
  }

  function clearFilters() {
    activeFilters = [
      { field: "", operator: EFilterOperator.contains, value: "" },
    ];
    dispatch("filterChange", { filters: activeFilters });
  }

  $: showClearButton =
    activeFilters.length > 1 ||
    activeFilters.some((filter) => filter.field !== "" || filter.value !== "");
</script>

<div class="p-4 card shadow-md">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-left">Filter</h2>
    {#if showClearButton}
      <button
        on:click={clearFilters}
        class="px-3 py-1 text-sm text-slate-500 bg-slate-100 rounded hover:bg-slate-200 hover:text-slate-600"
      >
        Clear All
      </button>
    {/if}
  </div>
  <div class="flex flex-col gap-3">
    {#each activeFilters as filter, index}
      <div class="flex items-center gap-2">
        <select
          bind:value={filter.field}
          on:change={updateFilter}
          class="p-2 text-sm border border-slate-200 rounded-lg bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
        >
          <option value="">Any field</option>
          {#each fields as field}
            <option value={field.value}>{field.label}</option>
          {/each}
        </select>

        <select
          bind:value={filter.operator}
          on:change={updateFilter}
          class="p-2 text-sm border border-slate-200 rounded-lg bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
        >
          {#each operators as operator}
            <option value={operator.value}>{operator.label}</option>
          {/each}
        </select>

        <input
          type="text"
          bind:value={filter.value}
          on:input={updateFilter}
          placeholder="Enter value"
          class="input flex-1 p-2"
        />

        <button
          on:click={() => removeFilter(index)}
          class="px-2 py-1 text-base text-slate-500 bg-slate-100 rounded hover:bg-slate-200 hover:text-slate-600"
          aria-label="Remove filter"
        >
          ×
        </button>
      </div>
    {/each}
  </div>

  <div class="mt-4 flex justify-start items-center space-x-2">
    <button
      on:click={addFilter}
      class=" text-sm text-white variant-filled-secondary rounded-lg flex items-center gap-2"
    >
      + Add Filter
    </button>

    <button
      class=" btn-icon p-1 w-10 h-10 text-sm variant-filled-secondary rounded-lg flex items-center gap-2"
      on:click={(e) => {
        tooltip(e, TemplateList, templateListProps);
      }}
    >
      <IconRectangles />
    </button>
  </div>
</div>

<style>
</style>
