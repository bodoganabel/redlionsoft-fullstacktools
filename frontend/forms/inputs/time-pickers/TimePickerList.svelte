<script lang="ts">
  import { DateTime } from 'luxon';
  export let availableSlots: DateTime[];
  export let format = DateTime.TIME_24_SIMPLE;
  export let onSelect: (date: DateTime) => void = () => {};
  export let selectedDateTime: DateTime | null = null;
  export let onConfirmSelection: (date: DateTime) => void = () => {};
  export let timezone: string;
  export let confirmText: string = "OK";

  let selectedIndex = -1;
</script>

{#if !availableSlots || availableSlots.length === 0}
  <p>-</p>
{:else}
  {#each availableSlots as availableDateTime, index}
    <div class="w-full flex justify-center items-center" class:gap-2={selectedIndex === index}>
      <button
        class={`${selectedIndex === index ? 'variant-glass-primary' : 'variant-outline-primary'} flex-1`}
        on:click={async () => {
          onSelect(availableDateTime);
          selectedIndex = index;
        }}>{availableDateTime.setZone(timezone).toFormat('HH:mm'/* format */)}</button
      >
      {#if selectedIndex === index}
        <button
          class="variant-filled-primary"
          on:click={async () => {
            onConfirmSelection(availableDateTime);
            selectedIndex = index;
          }}>{confirmText}</button
        >
      {/if}
    </div>
  {/each}
{/if}
