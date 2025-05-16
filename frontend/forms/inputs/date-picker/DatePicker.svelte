<script lang="ts">
  import { DateTime } from 'luxon';
  import DatePickerCalendarDays from './DatePickerCalendarDays.svelte';
  import DatePickerCalendarHeader from './DatePickerCalendarHeader.svelte';
  import DatePickerWeekdays from './DatePickerWeekdays.svelte';

  // Default weekdays starting with Monday through Sunday
  // This maintains the European/ISO standard where Monday is the first day of the week
  export let weekdaysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  export let monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  export let initialDate: DateTime = DateTime.now();
  export let selectedDate: DateTime = initialDate;
  export let enabledDates: DateTime[] | null = null; // If null, all dates are enabled

  export let onSelect: (date: DateTime) => void = () => {};
  export let minDate: DateTime | undefined = undefined;
  export let onMonthChange: (firstDayOfTheMonth: DateTime) => void;

  let currentMonth = selectedDate.month - 1; // Luxon's months are 1-based
  let currentYear = selectedDate.year;
  let dates: (DateTime | null)[] = [];

  // On enabledDates change, update the calendar
  $: {
    enabledDates = enabledDates;
    updateCalendar();
  }

  $: if (selectedDate) updateCalendar();
  // For Monday start (startDayOfWeek=1), this correctly puts Mon first
  $: orderedWeekdays = weekdaysShort;

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
    onMonthChange(previousMonth);
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
    onMonthChange(nextMonth);
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
    // Calculate day offset based on Luxon weekday (1=Monday, 7=Sunday)
    // Since we're using Monday as first day, we can use weekday-1 directly
    // This gives us 0 for Monday, 1 for Tuesday, etc.
    const firstDayOfWeek = firstDayOfMonth.weekday - 1;

    const totalDays = firstDayOfWeek + daysInMonth;
    const daysToAdd = (7 - (totalDays % 7)) % 7;

    dates = [
      ...Array(firstDayOfWeek).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => firstDayOfMonth.plus({ days: i })),
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
    bind:enabledDates
  />
</div>
