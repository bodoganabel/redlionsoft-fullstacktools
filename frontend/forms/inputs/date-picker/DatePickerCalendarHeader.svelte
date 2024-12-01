<script lang="ts">
  import IconLeftChevron from "../../../icons/IconLeftChevron.svelte";
  import IconRightChevron from "../../../icons/IconRightChevron.svelte";

  export let monthNames: string[];
  export let currentMonth: number;
  export let currentYear: number;
  export let onPrevMonth: () => void;
  export let onNextMonth: () => void;
</script>

<div class="flex justify-center items-center mb-2 space-x-1">
  <button class="p-1 btn-icon text-xl w-6" on:click={onPrevMonth}
    ><IconLeftChevron /></button
  >
  <span class="font-medium">{monthNames[currentMonth]} {currentYear}</span>
  <button class="p-1 btn-icon text-xl w-6" on:click={onNextMonth}
    ><IconRightChevron /></button
  >
</div>
