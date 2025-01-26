<script lang="ts">
  import { DateTime } from "luxon";
  import DatePickerCalendarDays from "./DatePickerCalendarDays.svelte";
  import DatePickerCalendarFooter from "./DatePickerCalendarFooter.svelte";
  import DatePickerCalendarHeader from "./DatePickerCalendarHeader.svelte";
  import DatePickerWeekdays from "./DatePickerWeekdays.svelte";

  export let startDayOfWeek = 1; // 0 = Sunday, 1 = Monday, etc.
  export let weekdaysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  export let monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  export let initialDate: DateTime = DateTime.now();
  export let selectedDate: DateTime = initialDate;
  export let onSelect: (date: DateTime) => void = () => {};
  export let minDate: DateTime | undefined = undefined;

  export let todayButtonText = "Today";
  export let tomorrowButtonText = "Tomorrow";
  export let resetButtonText = "Reset";

  let currentMonth = selectedDate.month - 1; // Luxon's months are 1-based
  let currentYear = selectedDate.year;
  let dates: (DateTime | null)[] = [];

  $: if (selectedDate) updateCalendar();
  $: orderedWeekdays = [
    ...weekdaysShort.slice(startDayOfWeek),
    ...weekdaysShort.slice(0, startDayOfWeek),
  ];

  function onDateSelected(newDate: DateTime) {
    selectedDate = newDate;
    onSelect(selectedDate);
    updateCalendar();
  }

  function setToToday() {
    onDateSelected(DateTime.now());
  }

  function setToTomorrow() {
    onDateSelected(DateTime.now().plus({ days: 1 }));
  }

  function setToCurrentOrMinimal() {
    onDateSelected(minDate === undefined ? DateTime.now() : minDate);
  }

  function prevMonth() {
    const previousMonth = DateTime.fromObject({
      year: currentYear,
      month: currentMonth + 1, // 1-based month
      day: 1,
    }).minus({ months: 1 });
    currentMonth = previousMonth.month - 1;
    currentYear = previousMonth.year;
    updateCalendar();
  }

  function nextMonth() {
    const nextMonth = DateTime.fromObject({
      year: currentYear,
      month: currentMonth + 1, // 1-based month
      day: 1,
    }).plus({ months: 1 });
    currentMonth = nextMonth.month - 1;
    currentYear = nextMonth.year;
    updateCalendar();
  }

  function updateCalendar() {
    const firstDayOfMonth = DateTime.fromObject({
      year: currentYear,
      month: currentMonth + 1, // Luxon's months are 1-based
      day: 1,
    });
    const daysInMonth = firstDayOfMonth.daysInMonth;
    if (daysInMonth === undefined) return;
    const firstDayOfWeek = (firstDayOfMonth.weekday - startDayOfWeek + 7) % 7;

    const totalDays = firstDayOfWeek + daysInMonth;
    const daysToAdd = (7 - (totalDays % 7)) % 7;

    dates = [
      ...Array(firstDayOfWeek).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) =>
        firstDayOfMonth.plus({ days: i })
      ),
      ...Array(daysToAdd).fill(null),
    ];
  }
</script>

<div class="date-picker">
  <DatePickerCalendarHeader
    {monthNames}
    {currentMonth}
    {currentYear}
    onPrevMonth={prevMonth}
    onNextMonth={nextMonth}
  />

  <DatePickerWeekdays {orderedWeekdays} />

  <DatePickerCalendarDays
    {dates}
    {selectedDate}
    {minDate}
    onDateSelect={onDateSelected}
  />
</div>
