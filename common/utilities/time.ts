import { DateTime } from "luxon";

export function getGmtOffsetFromTimezone(timezone: string) {
    const dateTime = DateTime.now().setZone(timezone);
    // Format offset as GMT+n or GMT-n
    const offsetMinutes = dateTime.offset;
    const offsetHours = Math.abs(Math.floor(offsetMinutes / 60));
    const offsetSign = offsetMinutes >= 0 ? '+' : '-';
    const gmtOffset = `GMT${offsetSign}${offsetHours}`;

    return gmtOffset;
}
