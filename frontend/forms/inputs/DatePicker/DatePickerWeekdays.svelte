<script lang="ts">
  export let orderedWeekdays: string[];
</script>

<div class="grid grid-cols-7 gap-1 text-black text-sm">
  {#each orderedWeekdays as day}
    <div class="font-light text-center">{day.toUpperCase()}</div>
  {/each}
</div>
