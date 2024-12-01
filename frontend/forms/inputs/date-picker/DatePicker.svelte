<script lang="ts">
  import DatePickerCalendarDays from "./DatePickerCalendarDays.svelte";
  import DatePickerCalendarFooter from "./DatePickerCalendarFooter.svelte";
  import DatePickerCalendarHeader from "./DatePickerCalendarHeader.svelte";
  import DatePickerWeekdays from "./DatePickerWeekdays.svelte";

  export let startDayOfWeek = 1; // 0 = Sunday, 1 = Monday, etc.
  export let weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

  export let initialDate = new Date();
  let selectedDate: Date = new Date(initialDate);
  export let onSelect: (date: Date) => void = () => {};
  export let minDate: Date | undefined = undefined;

  let currentMonth = selectedDate.getMonth();
  let currentYear = selectedDate.getFullYear();
  let dates: (Date | null)[] = [];

  $: if (selectedDate) updateCalendar();
  $: orderedWeekdays = [
    ...weekdays.slice(startDayOfWeek),
    ...weekdays.slice(0, startDayOfWeek),
  ];

  function onDateSelected(newDate: Date) {
    selectedDate = new Date(newDate);
    onSelect(selectedDate);
    updateCalendar();
  }

  function setToToday() {
    onDateSelected(new Date());
  }

  function setToTomorrow() {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    onDateSelected(currentDate);
  }

  function setToCurrentOrMinimal() {
    onDateSelected(minDate ?? new Date());
  }

  function prevMonth() {
    currentMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    currentYear += currentMonth === 11 ? -1 : 0;
    updateCalendar();
  }

  function nextMonth() {
    currentMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    currentYear += currentMonth === 0 ? 1 : 0;
    updateCalendar();
  }

  function updateCalendar() {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth =
      (new Date(currentYear, currentMonth, 1).getDay() - startDayOfWeek + 7) %
      7;

    const totalDays = firstDayOfMonth + daysInMonth;
    const daysToAdd = (7 - (totalDays % 7)) % 7;

    dates = [
      ...Array(firstDayOfMonth).fill(null),
      ...Array.from(
        { length: daysInMonth },
        (_, i) => new Date(currentYear, currentMonth, i + 1)
      ),
      ...Array(daysToAdd).fill(null),
    ];
  }
</script>

<div class="p-4 mt-2 date-picker">
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

  <DatePickerCalendarFooter
    onSetToToday={setToToday}
    onSetToTomorrow={setToTomorrow}
    onReset={setToCurrentOrMinimal}
  />
</div>
