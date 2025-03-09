<script lang="ts">
  import { DateTime } from "luxon";
  export let availableSlots: DateTime[];
  export let format = DateTime.TIME_24_SIMPLE;
  export let onSelect: (date: DateTime) => void = () => {};
  export let selectedDateTime: DateTime | null = null;
</script>

{#if !availableSlots || availableSlots.length === 0}
  <p>-</p>
{:else}
  {#each availableSlots as availableDateTime}
    <button
      class={selectedDateTime?.toISO() === availableDateTime.toISO() ? 'variant-filled-primary' : 'variant-outline-primary'}
      on:click={async () => {
        onSelect(availableDateTime);
      }}>{availableDateTime.toLocaleString(format)}</button
    >
  {/each}
{/if}
