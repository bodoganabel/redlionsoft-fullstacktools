<script lang="ts">
  import { writable } from "svelte/store";

  export let timeZones: { tz: string; offset: string }[] =
    getTimeZonesWithOffset();
  export let currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  export let selectedTimeZone = writable<string>(currentTimeZone);
  export let onChange = (newValue: string) => {};

  function getTimeZonesWithOffset() {
    return Intl.supportedValuesOf("timeZone").map((tz) => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "longOffset",
      });
      const parts = formatter.formatToParts(now);
      const offsetPart = parts.find((part) => part.type === "timeZoneName");
      const offset = offsetPart ? offsetPart.value : "GMT";
      return { tz, offset };
    });
  }

  // Detect user's current timezone if not provided
  $: if (!$selectedTimeZone) {
    selectedTimeZone.set(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }
</script>

<div class="timezone-selector mt-4 w-max">
  <label for="timezone" class="font-bold">Select your timezone:</label>
  <select
    id="timezone"
    bind:value={$selectedTimeZone}
    class="input select mt-2"
    on:change={() => onChange($selectedTimeZone)}
  >
    {#each timeZones as { tz, offset }}
      <option value={tz}>
        {tz} <span class="offset">({offset})</span>
      </option>
    {/each}
  </select>
  <p class="text-sm text-gray-500">Current timezone: {$selectedTimeZone}</p>
</div>

<style>
  /* Style the offset for readability */
  option .offset {
    font-weight: bold;
    color: gray;
  }
</style>
