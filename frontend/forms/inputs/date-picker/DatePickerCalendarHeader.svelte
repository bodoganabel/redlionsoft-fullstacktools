<script lang="ts">
  import IconLeftChevron from '../../../icons/IconLeftChevron.svelte';
  import IconRightChevron from '../../../icons/IconRightChevron.svelte';
  import { DateTime } from 'luxon';

  export let monthNames: string[];
  export let currentMonth: number;
  export let currentYear: number;
  export let onPrevMonth: () => void;
  export let onNextMonth: () => void;
  export let minDate: DateTime | undefined = undefined;
  export let maxDate: DateTime | undefined = undefined;

  // Calculate if previous month button should be disabled
  $: isPrevMonthDisabled =
    minDate !== undefined &&
    ((currentYear === minDate.year && currentMonth <= minDate.month - 1) ||
      currentYear < minDate.year);

  // Calculate if next month button should be disabled
  $: isNextMonthDisabled =
    maxDate !== undefined &&
    ((currentYear === maxDate.year && currentMonth >= maxDate.month - 1) ||
      currentYear > maxDate.year);
</script>

<div class="flex justify-center items-center mb-2 gap-3">
  <button
    class="p-1 btn-icon text-xl size-8 {isPrevMonthDisabled
      ? 'variant-primary-surface-400 cursor-not-allowed'
      : 'variant-glass-primary'}"
    on:click={onPrevMonth}
    disabled={isPrevMonthDisabled}
    aria-disabled={isPrevMonthDisabled}><IconLeftChevron /></button
  >
  <span class="font-medium text-lg">{monthNames[currentMonth]} {currentYear}</span>
  <button
    class="p-1 btn-icon text-xl size-8 {isNextMonthDisabled
      ? 'variant-primary-surface-400 cursor-not-allowed'
      : 'variant-glass-primary'}"
    on:click={onNextMonth}
    disabled={isNextMonthDisabled}
    aria-disabled={isNextMonthDisabled}><IconRightChevron /></button
  >
</div>
