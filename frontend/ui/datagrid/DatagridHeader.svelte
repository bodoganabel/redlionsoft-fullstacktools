<script lang="ts">
  import { columnWidthStyle } from "./data-grid.utilities";

  export let columns: any[] = [];
  export let noHeader = false;
  export let cellWidthInPixels: number;
</script>

<div
  class="datagrid-header px-2 py-1 w-full flex sticky top-0 border-b-slate-900 bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
>
  {#if !noHeader}
    {#each columns as column}
      <p
        class="cell p-2 font-bold border-transparent"
        style={columnWidthStyle(
          cellWidthInPixels,
          column.minWidth,
          column.maxWidth
        )}
      >
        <small>
          {column.title.toUpperCase()}
        </small>
      </p>
    {/each}
  {/if}
</div>
