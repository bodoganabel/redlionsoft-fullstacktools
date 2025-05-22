<script lang="ts">
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { DateTime } from 'luxon';

  export let dates: (DateTime | null)[];
  export let selectedDate: DateTime;
  export let minDate: DateTime | undefined;
  export let maxDate: DateTime | undefined;
  export let enabledDates: DateTime[] | null = null;
  export let onDateSelect: (date: DateTime) => void;

  const scale = tweened(1, { duration: 200, easing: cubicOut });

  function isSelectable(date: DateTime | null): boolean {
    if (!date) return false;

    // Check minDate constraint
    if (minDate !== undefined && date < minDate.startOf('day')) {
      return false;
    }

    // Check maxDate constraint
    if (maxDate !== undefined && date > maxDate.endOf('day')) {
      return false;
    }

    // If enabledDates is null, all dates are enabled
    if (enabledDates === null) return true;

    // Check if the date is in enabledDates
    return enabledDates.some((enabledDate) => enabledDate.hasSame(date, 'day'));
  }

  function isActive(date: DateTime | null): boolean {
    if (!date) return false;
    return selectedDate.hasSame(date, 'day');
  }

  async function handleClick(date: DateTime) {
    if (isSelectable(date)) {
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
      class="day p-1 flex justify-center items-center aspect-square text-center rounded-lg cursor-pointer font-semibold scale-animation border-solid border-surface-800"
      style:transform={`scale(${isActive(date) ? $scale : 1})`}
      class:border-2={date && date.hasSame(DateTime.now(), 'day')
        ? '1px solid currentColor'
        : undefined}
      class:bg-gray-200={date !== null && !isActive(date) && isSelectable(date)}
      class:dark:bg-gray-800={date !== null && !isActive(date) && isSelectable(date)}
      class:text-gray-400={!isSelectable(date)}
      class:bg-primary-500={isActive(date)}
      class:text-white={isActive(date)}
      on:click={() => date && handleClick(date)}
      class:underline={date && date.hasSame(DateTime.now(), 'day')}
    >
      {date ? date.day : ''}
    </div>
  {/each}
</div>

<style>
  .scale-animation {
    transform-origin: center;
    transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1); /* mimic cubicOut easing */
  }
</style>
