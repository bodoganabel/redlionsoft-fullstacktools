import { DateTime } from "luxon";

export const filterMagicWords = [
  {
    label: 'Today',
    value: '{today}',
    meaning: ()=> DateTime.now().setZone('utc').toISO(),
  },
];