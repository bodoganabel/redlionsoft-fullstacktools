<script lang="ts">
  import IconLeftChevron from '../../../icons/IconLeftChevron.svelte';
  import IconRightChevron from '../../../icons/IconRightChevron.svelte';

  export let monthNames: string[];
  export let currentMonth: number;
  export let currentYear: number;
  export let onPrevMonth: () => void;
  export let onNextMonth: () => void;
</script>

<div class="flex justify-center items-center mb-2 gap-3">
  <button class="p-1 btn-icon variant-filled-primary text-xl size-8" on:click={onPrevMonth}
    ><IconLeftChevron /></button
  >
  <span class="font-medium text-lg">{monthNames[currentMonth]} {currentYear}</span>
  <button class="p-1 btn-icon variant-filled-primary text-xl size-8" on:click={onNextMonth}
    ><IconRightChevron /></button
  >
</div>
