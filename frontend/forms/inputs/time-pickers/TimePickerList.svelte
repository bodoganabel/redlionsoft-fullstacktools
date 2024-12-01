<script lang="ts">
  import { DateTime } from "luxon";
  export let availableDateTimes: DateTime[];
  export let format = DateTime.TIME_24_SIMPLE;
  export let onSelect: (date: DateTime) => void = () => {};
</script>

{#each availableDateTimes as availableDateTime}
  <button
    class="variant-outline-primary"
    on:click={async () => {
      onSelect(availableDateTime);
    }}>{availableDateTime.toLocaleString(format)}</button
  >
{/each}
