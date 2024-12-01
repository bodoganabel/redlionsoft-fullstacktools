<script lang="ts">
  import {
    timezoneStore,
    timeZones,
  } from "./../../functionality/timezone/timezone.store";
</script>

<div class="timezone-selector mt-4 w-max">
  <label for="timezone" class="font-bold">Select your timezone:</label>
  <select
    id="timezone"
    value={$timezoneStore}
    class="input select mt-2"
    on:change={(e) =>
      timezoneStore.set(
        // @ts-ignore
        e.target.value
      )}
  >
    {#each timeZones as { tz, offset }}
      <option value={tz}>
        {tz} <span class="offset">({offset})</span>
      </option>
    {/each}
  </select>
  <p class="text-sm text-gray-500">Current timezone: {$timezoneStore}</p>
</div>

<style>
  /* Style the offset for readability */
  option .offset {
    font-weight: bold;
    color: gray;
  }
</style>
