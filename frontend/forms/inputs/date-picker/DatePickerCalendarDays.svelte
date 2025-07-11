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
      // Normalize the selected date to ensure consistent day representation
      const normalizedDate = DateTime.fromObject({
        year: date.year,
        month: date.month,
        day: date.day,
      }).setZone('utc',{keepLocalTime: true});

      onDateSelect(normalizedDate); // Use the normalized date
      await scale.set(1.05); // Scale up slightly
      await scale.set(1); // Shrink back to normal
      console.log('selected a normalizedDate:');
      console.log(normalizedDate, DateTime.fromISO(normalizedDate.toISO() as string, { setZone: true }).toISO());
    }
  }
</script>

<div class="grid grid-cols-7 gap-1">
  {#each dates as date, index}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <button
      class="day p-1 flex justify-center items-center aspect-square text-center rounded-lg cursor-pointer font-semibold scale-animation border-solid border-surface-800 transition-shadow"
      style:transform={`scale(${isActive(date) ? $scale : 1})`}
      class:border-2={date && date.hasSame(DateTime.now(), 'day')
        ? '1px solid currentColor'
        : undefined}
      class:variant-glass-surface={date !== null && !isActive(date) && isSelectable(date)}
      class:hover:shadow-sm={date !== null && !isActive(date) && isSelectable(date)}
      class:text-gray-400={!isSelectable(date)}
      class:bg-primary-500={isActive(date)}
      class:text-white={isActive(date)}
      on:click={() => date && handleClick(date)}
      class:underline={date && date.hasSame(DateTime.now(), 'day')}
    >
      {date ? date.day : ''}
    </button>
  {/each}
</div>

<style>
  .scale-animation {
    transform-origin: center;
    transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1); /* mimic cubicOut easing */
  }
</style>
