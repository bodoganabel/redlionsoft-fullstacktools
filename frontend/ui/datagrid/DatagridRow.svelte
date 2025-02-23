<script lang="ts">
  import { columnWidthStyle } from "./data-grid.utilities";
  import { EDataGridColumnTypes, type IColumnType } from "./data-grid.types";

  export let cells: IColumnType<any>[];
  export let cellWidthInPixels: number;
  export let row: any;
  export let isChanged: boolean;
  export let onClickRow: (() => void) | undefined = undefined;
  export let handleRowChange: (keyPath: string, value: string) => void;

  // Utility function to get a nested value
  function getNestedValue(obj: any, path: string): any {
    return path
      .split(".")
      .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  }

  function spreadProps(cell: any, row: any) {
    if (cell.componentPropsPopulator) {
      return { ...cell.componentPropsPopulator(row) };
    }
    return {};
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="datagrid-row flex w-full px-2 py-1 border-t border-gray-200 dark:border-gray-600 {isChanged
    ? 'bg-warning-600'
    : ''} {onClickRow ? 'cursor-pointer' : ''}"
  on:click={onClickRow}
>
  {#each cells as cell}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="cell p-1 items-center text-gray-800 dark:text-gray-200 text-sm"
      style={columnWidthStyle(cellWidthInPixels, cell.minWidth, cell.maxWidth)}
      on:click={() => {
        cell.onClick ? cell.onClick(row) : {};
      }}
    >
      {#if cell.type === EDataGridColumnTypes.TEXT}
        <p
          style={cell.style ? cell.style(getNestedValue(row, cell.key)) : ""}
          class={cell.class ? cell.class(getNestedValue(row, cell.key)) : ""}
        >
          {cell.transform
            ? cell.transform(getNestedValue(row, cell.key))
            : getNestedValue(row, cell.key)}
        </p>
      {:else if cell.type === EDataGridColumnTypes.INPUT}
        <input
          value={getNestedValue(row, cell.key)}
          class={cell.class
            ? cell.class(getNestedValue(row, cell.key))
            : "input"}
          on:input={(e) => handleRowChange(cell.key, e.currentTarget.value)}
        />
      {:else if cell.type === EDataGridColumnTypes.COMPONENT}
        <svelte:component this={cell.component} {...spreadProps(cell, row)} />
      {/if}
    </div>
  {/each}
</div>

<style>
  .cell {
    width: var(--cell-width);
  }
</style>
