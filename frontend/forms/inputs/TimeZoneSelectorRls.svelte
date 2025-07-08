<script lang="ts">
  import { getGmtOffsetFromTimezone } from '../../../common/utilities/time';
  import { timezoneStore, timeZones } from '../../functionality/timezone/timezone.store';
  import { onMount } from 'svelte';
  export let onTimezoneChange: (timezone: string) => void;
  export let timezoneText = 'Select your timezone';
  import { Autocomplete } from '@skeletonlabs/skeleton';
  import type { AutocompleteOption } from '@skeletonlabs/skeleton';

  const availableTimezones: AutocompleteOption[] = timeZones.map((tz) => ({
    label: `${tz.tz} (${tz.offset})`,
    value: tz.tz,
  }));
  let isFocused = false;
  let dropdownContainer: HTMLDivElement;
  let inputElement: HTMLInputElement;

  // Handle clicks outside the component
  function handleClickOutside(event: MouseEvent) {
    if (isFocused && dropdownContainer && !dropdownContainer.contains(event.target as Node)) {
      isFocused = false;
    }
  }

  onMount(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  });

  let existingTimezone = availableTimezones.find((tz) => tz.value === $timezoneStore);
  let timezoneValue: string =
    existingTimezone?.label || `${$timezoneStore} (${getGmtOffsetFromTimezone($timezoneStore)})`;
</script>

<div class="timezone-selector mt-4 w-full" bind:this={dropdownContainer}>
  <label for="timezone" class="font-bold">{timezoneText}</label>

  <input
    class="input max-w-xs"
    type="text"
    name="timezone"
    id="timezone"
    bind:this={inputElement}
    bind:value={timezoneValue}
    on:focus={() => (isFocused = true)}
  />

  {#if isFocused}
    <div class="mt-1 card w-full max-w-xs max-h-48 p-4 overflow-y-auto" tabindex="-1">
      <Autocomplete
        bind:input={timezoneValue}
        options={availableTimezones}
        on:selection={(e) => {
          //@ts-ignore
          timezoneValue = e.detail.label;
          //@ts-ignore
          timezoneStore.set(e.detail.value);
          //@ts-ignore
          onTimezoneChange(e.detail.value);
          isFocused = false;
          inputElement.blur();
        }}
      />
    </div>
  {/if}
  <!-- <select
    id="timezone"
    value={$timezoneStore}
    class="input select mt-2"
    on:change={async (e) => {
      timezoneStore.set(
        // @ts-ignore
        e.target.value
      );
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
  </select> -->
</div>
