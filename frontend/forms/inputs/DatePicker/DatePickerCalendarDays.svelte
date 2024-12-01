<script lang="ts">
  import { DAY } from "../../../../common/constants/time";

  export let dates: (Date | null)[];
  export let selectedDate: Date;
  export let minDate: Date | undefined;
  export let onDateSelect: (date: Date) => void;

  function isSelectable(date: Date | null): boolean {
    if (!date) return false;
    return date && (!minDate || date.valueOf() >= minDate.valueOf() - DAY);
  }

  function isActive(date: Date | null): boolean {
    if (!date) return false;
    return date && selectedDate.toDateString() === date.toDateString();
  }
</script>

<div class="grid grid-cols-7 gap-1">
  {#each dates as date, index}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="p-1 text-center rounded cursor-pointer font-semibold"
      class:bg-gray-200={date}
      class:text-gray-400={!isSelectable(date)}
      class:bg-blue-500={isActive(date)}
      class:text-white={isActive(date)}
      on:click={() => date && isSelectable(date) && onDateSelect(date)}
    >
      {date ? date.getDate() : ""}
    </div>
  {/each}
</div>
