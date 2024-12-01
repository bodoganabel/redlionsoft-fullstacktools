import { get, writable } from "svelte/store";

export const timeZones: { tz: string; offset: string }[] =
  getTimeZonesWithOffset();
// Detect user's current timezone
const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const timezoneStore = (() => {
  const { subscribe, set } = writable<string>(currentTimeZone);

  return {
    subscribe,
    getTimezoneWithOffset: () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: get(timezoneStore),
        timeZoneName: "longOffset",
      });
      const parts = formatter.formatToParts(now);
      const offsetPart = parts.find((part) => part.type === "timeZoneName");
      const offset = offsetPart ? offsetPart.value : "GMT";
      return `${get(timezoneStore)} ${offset}`;
    },
    set,
  };
})();

function getTimeZonesWithOffset() {
  return Intl.supportedValuesOf("timeZone").map(formatTimezoneIncludeOffset);
}

function formatTimezoneIncludeOffset(tz: string) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "longOffset",
  });
  const parts = formatter.formatToParts(now);
  const offsetPart = parts.find((part) => part.type === "timeZoneName");
  const offset = offsetPart ? offsetPart.value : "GMT";
  return { tz, offset };
}
