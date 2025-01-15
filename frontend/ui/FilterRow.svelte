<script lang="ts">
  import { EFilterOperator, type IFilter } from "./filter.types";

  export let filter: IFilter;
  export let onUpdate: () => void;
  export let onRemove: () => void;

  const operators = [
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
</script>

<div class="flex items-center gap-2">
  <select
    bind:value={filter.field}
    on:change={onUpdate}
    class="input-small p-2 border border-slate-200 rounded-lg bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
  >
    <option value="">Any field</option>
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
    on:input={onUpdate}
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
