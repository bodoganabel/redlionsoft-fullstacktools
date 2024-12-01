<script lang="ts">
  import { DAY } from "../../../../common/constants/time";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";

  export let dates: (Date | null)[];
  export let selectedDate: Date;
  export let minDate: Date | undefined;
  export let onDateSelect: (date: Date) => void;

  const scale = tweened(1, { duration: 200, easing: cubicOut });

  function isSelectable(date: Date | null): boolean {
    if (!date) return false;
    return date && (!minDate || date.valueOf() >= minDate.valueOf() - DAY);
  }

  function isActive(date: Date | null): boolean {
    if (!date) return false;
    return date && selectedDate.toDateString() === date.toDateString();
  }

  async function handleClick(date: Date) {
    if (date && isSelectable(date)) {
      onDateSelect(date); // Trigger the callback after the animation
      await scale.set(1.05); // Scale up slightly
      await scale.set(1); // Shrink back to normal
    }
  }
</script>

<div class="grid grid-cols-7 gap-1">
  {#each dates as date, index}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="day p-1 flex justify-center items-center aspect-square text-center rounded-lg cursor-pointer font-semibold scale-animation"
      style:transform={`scale(${isActive(date) ? $scale : 1})`}
      class:bg-gray-200={date !== null && !isActive(date) && isSelectable(date)}
      class:dark:bg-gray-800={date !== null &&
        !isActive(date) &&
        isSelectable(date)}
      class:text-gray-400={!isSelectable(date)}
      class:bg-blue-500={isActive(date)}
      class:text-white={isActive(date)}
      on:click={() => date && handleClick(date)}
    >
      {date ? date.getDate() : ""}
    </div>
  {/each}
</div>

<style>
  .scale-animation {
    transform-origin: center;
    transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1); /* mimic cubicOut easing */
  }
</style>
