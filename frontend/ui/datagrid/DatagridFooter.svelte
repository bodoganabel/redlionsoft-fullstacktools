<script lang="ts">
  export let pagination: boolean;
  export let data: any[];
  export let currentPage = 1;
  export let itemsPerPage = 1;

  $: totalPages = Math.ceil(data.length / itemsPerPage);
  $: {
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
  }

  const MAX_PAGES_TO_DISPLAY = 5;

  function getPagesToDisplay(current: number, total: number): number[] {
    if (total <= MAX_PAGES_TO_DISPLAY)
      return Array.from({ length: total }, (_, i) => i + 1);

    let start = current - Math.floor(MAX_PAGES_TO_DISPLAY / 2);
    let end = current + Math.floor(MAX_PAGES_TO_DISPLAY / 2);

    if (start <= 1) {
      start = 1;
      end = start + MAX_PAGES_TO_DISPLAY - 1;
    } else if (end >= total) {
      end = total;
      start = total - MAX_PAGES_TO_DISPLAY + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => i + start);
  }

  $: pagesToDisplay = getPagesToDisplay(currentPage, totalPages);

  const gotoPage = (pageNumber: number) => {
    if (pageNumber < 1) pageNumber = 1;
    if (pageNumber > totalPages) pageNumber = totalPages;
    currentPage = pageNumber;
  };
</script>

<div class="datagrid-footer w-full justify-center items-center gap-3">
  {#if pagination && totalPages > 1}
    <!-- Desktop/Tablet Pagination -->

    <div class="hidden md:flex justify-center space-x-2 p-10">
      <button
        class="variant-outline-primary"
        on:click={() => gotoPage(1)}
        disabled={currentPage === 1}>First</button
      >
      <button
        class="variant-outline-primary"
        on:click={() => gotoPage(currentPage - 1)}
        disabled={currentPage === 1}>&lt; Prev</button
      >

      {#if pagesToDisplay[0] > 1}
        <span>...</span>
      {/if}

      {#each pagesToDisplay as page}
        <button
          class="variant-outline-primary {currentPage === page
            ? 'variant-filled-primary'
            : 'variant-outline-primary'}"
          on:click={() => gotoPage(page)}>{page}</button
        >
      {/each}

      {#if pagesToDisplay[pagesToDisplay.length - 1] < totalPages}
        <span>...</span>
      {/if}

      <button
        class="variant-outline-primary"
        on:click={() => gotoPage(currentPage + 1)}
        disabled={currentPage === totalPages}>Next &gt;</button
      >
      <button
        class="variant-outline-primary"
        on:click={() => gotoPage(totalPages)}
        disabled={currentPage === totalPages}>Last</button
      >
    </div>

    <!-- Mobile Pagination -->

    <div class="datagrid-footer flex md:hidden flex-col items-center gap-2">
      <!-- 1st row: Up and First buttons -->
      <div class="pagination-row flex justify-center gap-2">
        <!-- Previous -->
        <button
          class="variant-outline-primary"
          on:click={() => gotoPage(currentPage - 1)}
          disabled={currentPage === 1}>&uarr;</button
        >
        <!-- First -->
        <button
          class="variant-outline-primary"
          on:click={() => gotoPage(1)}
          disabled={currentPage === 1}>&#8657;</button
        >
      </div>

      <!-- 2nd row: Current page input -->
      <div class="pagination-row flex justify-center items-center gap-2">
        <p>Page:</p>
        <input
          type="number"
          min="1"
          max={totalPages}
          bind:value={currentPage}
          class="w-20 input text-center border rounded"
        />
      </div>

      <!-- 3rd row: Down and Last buttons -->
      <div class="pagination-row flex justify-center gap-2">
        <!-- Next -->
        <button
          class="variant-outline-primary"
          on:click={() => gotoPage(currentPage + 1)}
          disabled={currentPage === totalPages}>&darr;</button
        >
        <!-- Last -->
        <button
          class="variant-outline-primary"
          on:click={() => gotoPage(totalPages)}
          disabled={currentPage === totalPages}>&#8659;</button
        >
      </div>
    </div>
  {/if}
</div>

<style>
  /* ... [any required styles] ... */
</style>
