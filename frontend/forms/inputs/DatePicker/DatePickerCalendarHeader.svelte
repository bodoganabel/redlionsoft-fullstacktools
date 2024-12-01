<script lang="ts">
  export let monthNames: string[];
  export let currentMonth: number;
  export let currentYear: number;
  export let onPrevMonth: () => void;
  export let onNextMonth: () => void;
</script>

<div class="flex justify-between items-center mb-2 text-black">
  <button class="text-xl" on:click={onPrevMonth}>&lt;</button>
  <span class="font-bold">{monthNames[currentMonth]} {currentYear}</span>
  <button class="text-xl" on:click={onNextMonth}>&gt;</button>
</div>
