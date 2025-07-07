<script lang="ts">
    import { timezoneStore, timeZones } from '../../functionality/timezone/timezone.store';
    export let onTimezoneChange: (timezone: string) => void;
    export let timezoneText = "Select your timezone"
</script>

<div class="timezone-selector mt-4 w-full">
  <label for="timezone" class="font-bold">{timezoneText}</label>
  <select
    id="timezone"
    value={$timezoneStore}
    class="input select mt-2"
    on:change={async (e) => {
      timezoneStore.set(
        // @ts-ignore
        e.target.value
      )
      onTimezoneChange(
        // @ts-ignore
        e.target.value
      );
    }}
  >
    {#each timeZones as { tz, offset }}
      <option value={tz}>
        {tz} <span class="offset">({offset})</span>
      </option>
    {/each}
  </select>
</div>

<style>
  /* Style the offset for readability */
  option .offset {
    font-weight: bold;
    color: gray;
  }
</style>
