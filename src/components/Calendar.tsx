import React, { useReducer, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import arrowRightIcon from '../assets/arrow-right.svg';
import timeSvg from '../assets/time.svg';

type ViewState = 0 | 1 | 2 | 3 | 4;

interface SelectedDate {
  day: number;
  month: number;
  year: number;
  time?: string;
  startTime?: string;
  endTime?: string;
}

interface AvailableDaysData {
  year: number;
  month: string;
  availableDays: number[];
}

interface CalendarState {
  viewState: ViewState;
  currentMonth: number;
  currentYear: number;
  selectedDate: SelectedDate | null;
  selectedTime: string | null;
  timezone: string;
  formData: {
    summary: string;
    name: string;
    email: string;
    description: string;
    startTime: string;
    endTime: string;
    timezone: string;
  };
}

type CalendarAction =
  | { type: 'START_CALENDAR' }
  | { type: 'CLOSE_CALENDAR' }
  | { type: 'ANIMATION_COMPLETE' }
  | { type: 'SELECT_DAY'; day: number; month: number; year: number }
  | { type: 'SELECT_TIME'; time: string }
  | { type: 'TOGGLE_TIME_CLOSED' }
  | { type: 'CONFIRM_TIME'; baseTimezoneTime?: string }
  | { type: 'GO_BACK' }
  | { type: 'NAVIGATE_MONTH'; direction: 'prev' | 'next' }
  | { type: 'UPDATE_FORM'; field: string; value: string }
  | { type: 'UPDATE_TIMEZONE'; timezone: string };

// Format date to RFC3339 format with timezone offset
// Converts a Date object to RFC3339 format: "2026-01-10T11:00:00+02:00"
const formatDateToRFC3339 = (date: Date, timezone: string): string => {
  // Format date in target timezone using Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Get formatted parts
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const day = parts.find((p) => p.type === 'day')?.value || '';
  const hour = parts.find((p) => p.type === 'hour')?.value || '';
  const minute = parts.find((p) => p.type === 'minute')?.value || '';
  const second = parts.find((p) => p.type === 'second')?.value || '00';

  // Calculate timezone offset for the target timezone at this specific date/time
  // This accounts for DST (Daylight Saving Time) changes
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const offsetMs = tzDate.getTime() - utcDate.getTime();

  // Calculate offset hours and minutes
  const offsetTotalMinutes = Math.floor(offsetMs / (1000 * 60));
  const offsetHours = Math.floor(Math.abs(offsetTotalMinutes) / 60);
  const offsetMinutes = Math.abs(offsetTotalMinutes) % 60;
  const offsetSign = offsetTotalMinutes >= 0 ? '+' : '-';
  const offsetString = `${offsetSign}${offsetHours
    .toString()
    .padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${offsetString}`;
};

const initialState: CalendarState = {
  viewState: 0,
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  selectedDate: null,
  selectedTime: null,
  timezone: 'Africa/Cairo',
  formData: {
    name: 'Hazem Gad',
    email: 'hazemhgad22@gmail.com',
    summary: 'Web design consultation',
    description: 'Web design consultation',
    startTime: '',
    endTime: '',
    timezone: 'Africa/Cairo',
  },
};

const calendarReducer = (
  state: CalendarState,
  action: CalendarAction,
): CalendarState => {
  switch (action.type) {
    case 'START_CALENDAR':
      return { ...state, viewState: 1 };

    case 'CLOSE_CALENDAR':
      return {
        ...state,
        viewState: 0,
        selectedDate: null,
        selectedTime: null,
      };

    case 'ANIMATION_COMPLETE':
      return { ...state, viewState: 2 };

    case 'SELECT_DAY':
      return {
        ...state,
        viewState: 3,
        selectedDate: {
          day: action.day,
          month: action.month,
          year: action.year,
        },
      };

    case 'SELECT_TIME':
      return { ...state, selectedTime: action.time };

    case 'TOGGLE_TIME_CLOSED':
      return { ...state, selectedTime: null };

    case 'CONFIRM_TIME': {
      if (!state.selectedDate || !state.selectedTime) return state;

      // Use baseTimezoneTime if provided (converted from display timezone),
      // otherwise use selectedTime (assumes it's already in base timezone)
      const timeToUse = action.baseTimezoneTime || state.selectedTime;

      // Calculate end time (15 minutes later) using the base timezone time
      const [time, period] = timeToUse.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;
      const startDate = new Date(
        state.selectedDate.year,
        state.selectedDate.month,
        state.selectedDate.day,
        hour24,
        parseInt(minutes),
      );
      const endDate = new Date(startDate.getTime() + 15 * 60000);

      // Format dates to RFC3339 with timezone offset in BASE_TIMEZONE (Africa/Cairo)
      // Format: "2026-01-10T11:00:00+02:00"
      const BASE_TIMEZONE = 'Africa/Cairo';
      const startTimeRFC3339 = formatDateToRFC3339(startDate, BASE_TIMEZONE);
      const endTimeRFC3339 = formatDateToRFC3339(endDate, BASE_TIMEZONE);

      return {
        ...state,
        viewState: 4,
        selectedDate: {
          ...state.selectedDate,
          time: state.selectedTime,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
        formData: {
          ...state.formData,
          startTime: startTimeRFC3339, // RFC3339 format with timezone offset in BASE_TIMEZONE
          endTime: endTimeRFC3339, // RFC3339 format with timezone offset in BASE_TIMEZONE
          timezone: BASE_TIMEZONE, // Always use base timezone for final times
        },
      };
    }

    case 'GO_BACK':
      if (state.viewState === 3) {
        return { ...state, viewState: 2, selectedTime: null };
      } else if (state.viewState === 4) {
        return { ...state, viewState: 3 };
      }
      return state;

    case 'NAVIGATE_MONTH': {
      const now = new Date();
      const currentMonthIndex = now.getMonth();
      const currentYearValue = now.getFullYear();

      // Check if we're already at or before the current month
      const isAtOrBeforeCurrentMonth =
        state.currentYear < currentYearValue ||
        (state.currentYear === currentYearValue &&
          state.currentMonth <= currentMonthIndex);

      if (action.direction === 'prev') {
        // Prevent going to months before the current month
        if (isAtOrBeforeCurrentMonth) {
          return state; // Don't navigate if already at or before current month
        }

        let newMonth = state.currentMonth;
        let newYear = state.currentYear;

        if (newMonth === 0) {
          newMonth = 11;
          newYear -= 1;
        } else {
          newMonth -= 1;
        }

        // Double check the new month isn't before current month
        if (
          newYear < currentYearValue ||
          (newYear === currentYearValue && newMonth < currentMonthIndex)
        ) {
          return state; // Prevent navigation
        }

        return { ...state, currentMonth: newMonth, currentYear: newYear };
      } else {
        // Allow forward navigation
        let newMonth = state.currentMonth;
        let newYear = state.currentYear;

        if (newMonth === 11) {
          newMonth = 0;
          newYear += 1;
        } else {
          newMonth += 1;
        }

        return { ...state, currentMonth: newMonth, currentYear: newYear };
      }
    }

    case 'UPDATE_FORM':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value,
        },
      };

    case 'UPDATE_TIMEZONE':
      return {
        ...state,
        timezone: action.timezone,
        formData: {
          ...state.formData,
          timezone: action.timezone,
        },
      };

    default:
      return state;
  }
};

const Calendar = () => {
  const [state, dispatch] = useReducer(calendarReducer, initialState);

  const calendarRef = useRef<HTMLDivElement>(null);
  const startButtonRef = useRef<HTMLDivElement>(null);
  const timeButtonsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Available days data (will be replaced with API call later)
  const availableDaysData: AvailableDaysData[] = [
    { year: 2026, month: 'Jan', availableDays: [1, 2, 9, 12, 19, 21, 29] },
    { year: 2026, month: 'Feb', availableDays: [1, 2, 9, 12, 19, 21, 29] },
    { year: 2026, month: 'Mar', availableDays: [1, 2, 3, 13, 21, 29] },
  ];

  // Base timezone for available time slots (all times are based on this)
  const BASE_TIMEZONE = 'Africa/Cairo';

  // Configuration for available time slots (in BASE_TIMEZONE)
  const startTime = '11:00 AM'; // Start time in Africa/Cairo
  const endTime = '04:00 PM'; // End time in Africa/Cairo
  const intervalMinutes = 15; // Interval between slots

  // Generate time slots between start and end time in 15-minute intervals
  const generateTimeSlots = (
    start: string,
    end: string,
    interval: number,
  ): string[] => {
    const slots: string[] = [];

    // Parse start time
    const [startTimeStr, startPeriod] = start.split(' ');
    const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
    let startHour24 = startHours;
    if (startPeriod === 'PM' && startHour24 !== 12) startHour24 += 12;
    if (startPeriod === 'AM' && startHour24 === 12) startHour24 = 0;

    // Parse end time
    const [endTimeStr, endPeriod] = end.split(' ');
    const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
    let endHour24 = endHours;
    if (endPeriod === 'PM' && endHour24 !== 12) endHour24 += 12;
    if (endPeriod === 'AM' && endHour24 === 12) endHour24 = 0;

    // Convert to minutes for easier calculation
    const startTotalMinutes = startHour24 * 60 + startMinutes;
    const endTotalMinutes = endHour24 * 60 + endMinutes;

    // Generate slots
    for (
      let currentMinutes = startTotalMinutes;
      currentMinutes <= endTotalMinutes;
      currentMinutes += interval
    ) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;

      // Format as 12-hour time
      let hour12 = hours % 12;
      if (hour12 === 0) hour12 = 12; // 0 or 12 both become 12
      const period = hours >= 12 ? 'PM' : 'AM';
      const formattedTime = `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;

      slots.push(formattedTime);
    }

    return slots;
  };

  // Base available times in Africa/Cairo timezone (generated dynamically)
  const baseAvailableTimes = generateTimeSlots(
    startTime,
    endTime,
    intervalMinutes,
  );

  // Convert time from base timezone (Africa/Cairo) to target timezone (for display)
  const convertTimeToTimezone = (
    timeString: string,
    targetTimezone: string,
  ): string => {
    // If target is the same as base, return as is
    if (targetTimezone === BASE_TIMEZONE) {
      return timeString;
    }

    // Parse the time string (e.g., "09:00 AM")
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;

    // Get today's date in base timezone (Africa/Cairo)
    const now = new Date();
    const baseDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: BASE_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    const [baseYear, baseMonth, baseDay] = baseDateStr.split('-').map(Number);

    // Find the UTC timestamp that represents this time in base timezone (Cairo)
    // We'll search for the UTC time that formats to our target in Cairo
    const dateStr = `${baseYear}-${String(baseMonth).padStart(2, '0')}-${String(baseDay).padStart(2, '0')}T${String(hour24).padStart(2, '0')}:${minutes}:00`;

    // Start with a reasonable UTC guess (treating the date string as UTC)
    let utcTime = new Date(dateStr + 'Z').getTime();

    // Refine by checking what this UTC time represents in base timezone
    // and adjusting until we get the correct time
    for (let i = 0; i < 20; i++) {
      const testDate = new Date(utcTime);
      const baseFormatted = new Intl.DateTimeFormat('en-US', {
        timeZone: BASE_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(testDate);

      const [testH, testM] = baseFormatted.split(':').map(Number);
      const targetH = hour24;
      const targetM = parseInt(minutes);

      if (testH === targetH && testM === targetM) {
        break; // Found the correct UTC time
      }

      // Adjust UTC time based on the difference
      const diffHours = targetH - testH;
      const diffMinutes = targetM - testM;
      const diffMs = (diffHours * 60 + diffMinutes) * 60 * 1000;
      utcTime += diffMs;
    }

    // Now format this UTC time in the target timezone (for display)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return formatter.format(new Date(utcTime));
  };

  // Convert time from display timezone back to base timezone (Africa/Cairo)
  // This is used when user selects a time - we need to know what time it is in Cairo
  const convertTimeFromDisplayToBase = (
    timeString: string, // Time displayed in current timezone
    displayTimezone: string, // Current display timezone
    selectedDate: { year: number; month: number; day: number }, // Selected date
  ): string => {
    // If display timezone is already base timezone, return as is
    if (displayTimezone === BASE_TIMEZONE) {
      return timeString;
    }

    // Parse the displayed time string (e.g., "02:00 PM")
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;

    // Create a date object for the selected date at this time in the display timezone
    // We need to find what UTC time represents this time in the display timezone
    const dateStr = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}T${String(hour24).padStart(2, '0')}:${minutes}:00`;

    // Start with a reasonable UTC guess
    let utcTime = new Date(dateStr + 'Z').getTime();

    // Refine by checking what this UTC time represents in display timezone
    for (let i = 0; i < 20; i++) {
      const testDate = new Date(utcTime);
      const displayFormatted = new Intl.DateTimeFormat('en-US', {
        timeZone: displayTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(testDate);

      const [testH, testM] = displayFormatted.split(':').map(Number);
      const targetH = hour24;
      const targetM = parseInt(minutes);

      if (testH === targetH && testM === targetM) {
        break; // Found the correct UTC time
      }

      // Adjust UTC time based on the difference
      const diffHours = targetH - testH;
      const diffMinutes = targetM - testM;
      const diffMs = (diffHours * 60 + diffMinutes) * 60 * 1000;
      utcTime += diffMs;
    }

    // Now format this UTC time in the base timezone (Africa/Cairo)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: BASE_TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return formatter.format(new Date(utcTime));
  };

  // Get available times converted to current timezone
  const availableTimes = baseAvailableTimes.map((time) =>
    convertTimeToTimezone(time, state.timezone),
  );

  // Auto-complete animation state when calendar opens
  useEffect(() => {
    if (state.viewState === 1) {
      // Immediately move to state 2 (animation complete) since we're not animating
      dispatch({ type: 'ANIMATION_COMPLETE' });
    }
  }, [state.viewState]);

  // Prevent body scroll when calendar is open
  useEffect(() => {
    if (state.viewState !== 0) {
      // Calendar is open - lock body scroll
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.overflow = 'hidden';

      // Ensure calendar container can still receive scroll events
      if (calendarRef.current) {
        calendarRef.current.focus();
      }
    } else {
      // Calendar is closed - restore body scroll
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.overflow = '';

      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup: restore body when component unmounts
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, [state.viewState]);

  // Get days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Get month name
  const getMonthName = (month: number) => {
    const months = [
      'JANUARY',
      'FEBRUARY',
      'MARCH',
      'APRIL',
      'MAY',
      'JUNE',
      'JULY',
      'AUGUST',
      'SEPTEMBER',
      'OCTOBER',
      'NOVEMBER',
      'DECEMBER',
    ];
    return months[month];
  };

  // Get month abbreviation (for matching with availableDaysData)
  const getMonthAbbreviation = (month: number) => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months[month];
  };

  // Check if a day is in the available days list for a given month/year
  const isDayAvailable = (
    day: number,
    month: number,
    year: number,
  ): boolean => {
    const monthAbbr = getMonthAbbreviation(month);
    const monthData = availableDaysData.find(
      (data) => data.year === year && data.month === monthAbbr,
    );
    return monthData ? monthData.availableDays.includes(day) : false;
  };

  // Check if current month is within the allowed range (current month and next 2 months)
  const isMonthInAllowedRange = (month: number, year: number): boolean => {
    const now = new Date();
    const currentMonthIndex = now.getMonth();
    const currentYearValue = now.getFullYear();

    // Calculate months from current month
    const monthsFromCurrent =
      (year - currentYearValue) * 12 + (month - currentMonthIndex);

    // Allow current month (0) and next 2 months (1, 2)
    return monthsFromCurrent >= 0 && monthsFromCurrent <= 2;
  };

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(state.currentMonth, state.currentYear);
    const firstDay = getFirstDayOfMonth(state.currentMonth, state.currentYear);
    const days: (number | null)[] = [];

    // Add empty cells for days before month starts
    // JavaScript: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    // We want: 0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri
    // Conversion: (jsDay + 1) % 7
    const adjustedFirstDay = (firstDay + 1) % 7; // Saturday becomes 0
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // Check if previous month navigation is disabled (can't go before current month)
  const isPreviousMonthDisabled = () => {
    const now = new Date();
    const currentMonthIndex = now.getMonth();
    const currentYearValue = now.getFullYear();

    return (
      state.currentYear < currentYearValue ||
      (state.currentYear === currentYearValue &&
        state.currentMonth <= currentMonthIndex)
    );
  };

  // Check if next month navigation is disabled (can't go beyond current + 2 months)
  const isNextMonthDisabled = () => {
    // Calculate what the next month would be
    let nextMonth = state.currentMonth + 1;
    let nextYear = state.currentYear;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }

    // Check if next month would be beyond allowed range
    return !isMonthInAllowedRange(nextMonth, nextYear);
  };

  // Check if a day should be disabled
  const isDayDisabled = (day: number) => {
    const now = new Date();
    const currentMonthIndex = now.getMonth();
    const currentYearValue = now.getFullYear();
    const currentDay = now.getDate();

    // If month is beyond allowed range (current + next 2 months), disable all days
    if (!isMonthInAllowedRange(state.currentMonth, state.currentYear)) {
      return true;
    }

    // Check if day is in available days list - if not, disable it
    if (!isDayAvailable(day, state.currentMonth, state.currentYear)) {
      return true;
    }

    // For current month only: disable days before today OR within today + 3 days (including today)
    // This overrides the available days check
    if (
      state.currentYear === currentYearValue &&
      state.currentMonth === currentMonthIndex
    ) {
      // Disable if day is before today OR within today + 3 days (including today)
      if (day < currentDay || day <= currentDay + 3) {
        return true;
      }
    }

    return false;
  };

  // Navigate months
  const handlePreviousMonth = () => {
    if (!isPreviousMonthDisabled()) {
      dispatch({ type: 'NAVIGATE_MONTH', direction: 'prev' });
    }
  };

  const handleNextMonth = () => {
    if (!isNextMonthDisabled()) {
      dispatch({ type: 'NAVIGATE_MONTH', direction: 'next' });
    }
  };

  // Handle day selection
  const handleDayClick = (day: number) => {
    dispatch({
      type: 'SELECT_DAY',
      day,
      month: state.currentMonth,
      year: state.currentYear,
    });
  };

  // Handle time selection - only one NEXT button visible at a time
  const handleTimeClick = (time: string) => {
    // If clicking the same time, toggle it closed
    if (state.selectedTime === time) {
      const timeButtonRef = timeButtonsRef.current[time];
      if (timeButtonRef) {
        const timeButton = timeButtonRef.querySelector(
          '.time-button',
        ) as HTMLElement;
        const nextButton = timeButtonRef.querySelector(
          '.next-button',
        ) as HTMLElement;
        if (timeButton && nextButton) {
          gsap.to(timeButton, { width: '100%', duration: 0.3 });
          gsap.to(nextButton, {
            width: '0%',
            opacity: 0,
            paddingInline: '0px',
            duration: 0.3,
          });
        }
      }
      dispatch({ type: 'TOGGLE_TIME_CLOSED' });
      return;
    }

    // Close any previously opened time button
    if (state.selectedTime) {
      const prevTimeButtonRef = timeButtonsRef.current[state.selectedTime];
      if (prevTimeButtonRef) {
        const prevTimeButton = prevTimeButtonRef.querySelector(
          '.time-button',
        ) as HTMLElement;
        const prevNextButton = prevTimeButtonRef.querySelector(
          '.next-button',
        ) as HTMLElement;
        if (prevTimeButton && prevNextButton) {
          gsap.to(prevTimeButton, { width: '100%', duration: 0.3 });
          gsap.to(prevNextButton, {
            width: '0%',
            opacity: 0,
            paddingInline: '0px',
            duration: 0.3,
          });
        }
      }
    }

    // Open the new time button
    dispatch({ type: 'SELECT_TIME', time });
    const timeButtonRef = timeButtonsRef.current[time];
    if (timeButtonRef) {
      const timeButton = timeButtonRef.querySelector(
        '.time-button',
      ) as HTMLElement;
      const nextButton = timeButtonRef.querySelector(
        '.next-button',
      ) as HTMLElement;
      if (timeButton && nextButton) {
        gsap.to(timeButton, {
          width: '50%',
          duration: 0.3,
          ease: 'power2.out',
        });
        gsap.to(nextButton, {
          width: '50%',
          opacity: 1,
          paddingInline: '16px',
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    }
  };

  // Handle next button click (from time selection)
  const handleTimeNext = () => {
    if (state.selectedDate && state.selectedTime) {
      // Convert the selected time (displayed in current timezone) back to base timezone (Africa/Cairo)
      const baseTimezoneTime = convertTimeFromDisplayToBase(
        state.selectedTime,
        state.timezone,
        state.selectedDate,
      );

      // Dispatch with the base timezone time
      dispatch({ type: 'CONFIRM_TIME', baseTimezoneTime });
    }
  };

  // Format date for display
  const formatSelectedDateTime = () => {
    if (!state.selectedDate || !state.selectedTime) return '';

    const selectedDate = state.selectedDate; // Type narrowing
    const date = new Date(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day,
    );
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const monthNames = [
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

    // Convert time to 12-hour format with lowercase pm/am
    const [time, period] = state.selectedTime.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;

    // Calculate end time (15 minutes later)
    const startDate = new Date(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day,
      hour24,
      parseInt(minutes),
    );
    const endDate = new Date(startDate.getTime() + 15 * 60000);

    const startHour = startDate.getHours();
    const startMin = startDate.getMinutes();
    const endHour = endDate.getHours();
    const endMin = endDate.getMinutes();

    const startTime = `${startHour % 12 || 12}:${startMin.toString().padStart(2, '0')}${startHour >= 12 ? 'pm' : 'am'}`;
    const endTime = `${endHour % 12 || 12}:${endMin.toString().padStart(2, '0')}${endHour >= 12 ? 'pm' : 'am'}`;

    return `${startTime} - ${endTime}, ${dayNames[date.getDay()]}, ${monthNames[selectedDate.month]} ${selectedDate.day}, ${selectedDate.year}`;
  };

  // Handle back button
  const handleBack = () => {
    if (state.viewState === 3) {
      // Close any open time button
      if (state.selectedTime) {
        const timeButtonRef = timeButtonsRef.current[state.selectedTime];
        if (timeButtonRef) {
          const timeButton = timeButtonRef.querySelector(
            '.time-button',
          ) as HTMLElement;
          const nextButton = timeButtonRef.querySelector(
            '.next-button',
          ) as HTMLElement;
          if (timeButton && nextButton) {
            gsap.to(timeButton, { width: '100%', duration: 0.3 });
            gsap.to(nextButton, {
              width: '0%',
              opacity: 0,
              paddingInline: '0px',
              duration: 0.3,
            });
          }
        }
      }
    }
    dispatch({ type: 'GO_BACK' });
  };

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    dispatch({
      type: 'UPDATE_FORM',
      field: e.target.name,
      value: e.target.value,
    });
  };

  // Handle timezone change
  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'UPDATE_TIMEZONE', timezone: e.target.value });
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eventData = formatForGoogleCalendar();
    console.log('Google Calendar API Event Data:', eventData);
    console.log('Formatted JSON:', JSON.stringify(eventData, null, 2));
  };

  // Get timezone display name (using CSS uppercase)
  const getTimezoneDisplayName = (tz: string) => {
    // Convert "Africa/Cairo" to "Africa / Cairo" (CSS will uppercase)
    return tz.split('/').join(' / ');
  };

  // Simple globe SVG icon
  const GlobeIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );

  // Get current time in timezone
  const getCurrentTimeInTimezone = (tz: string) => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return formatter.format(now);
  };

  // Timezones list - Egypt, UAE, KSA only
  const timezones = [
    'Africa/Cairo', // Egypt
    'Asia/Dubai', // UAE (Emirates)
    'Asia/Riyadh', // KSA (Saudi Arabia)
  ];

  const calendarDays = generateCalendarGrid();
  const weekdays = ['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'];

  // Get title for current state
  const getTitle = () => {
    switch (state.viewState) {
      case 1:
      case 2:
        return 'SELECT A DAY';
      case 3:
        return 'SELECT A TIME';
      case 4:
        return 'CONFIRM';
      default:
        return '';
    }
  };

  /**
   * Transform formData to Google Calendar API format
   *
   * Google Calendar API Event Format:
   * {
   *   summary: string (REQUIRED) - Event title/name
   *   description: string (OPTIONAL) - Event description
   *   start: {
   *     dateTime: string (REQUIRED) - RFC3339 format: "2026-01-10T09:00:00+02:00"
   *     timeZone: string (REQUIRED) - IANA timezone: "Africa/Cairo"
   *   },
   *   end: {
   *     dateTime: string (REQUIRED) - RFC3339 format: "2026-01-10T09:15:00+02:00"
   *     timeZone: string (REQUIRED) - IANA timezone: "Africa/Cairo"
   *   },
   *   attendees: array (OPTIONAL) - Array of attendee objects
   *     [{
   *       email: string (REQUIRED) - Attendee email
   *       displayName: string (OPTIONAL) - Attendee name
   *     }]
   *   location: string (OPTIONAL) - Physical location
   *   reminders: object (OPTIONAL) - Reminder settings
   * }
   *
   * Field Mapping:
   * - formData.name → summary (REQUIRED)
   * - formData.description → description (OPTIONAL)
   * - formData.email → attendees[0].email (OPTIONAL, but recommended)
   * - formData.name → attendees[0].displayName (OPTIONAL)
   * - formData.startTime → start.dateTime (REQUIRED) - Must be RFC3339 format with timezone offset
   * - formData.endTime → end.dateTime (REQUIRED) - Must be RFC3339 format with timezone offset
   * - formData.timezone → start.timeZone & end.timeZone (REQUIRED) - IANA timezone string
   *
   * Example Output:
   * {
   *   "summary": "Hazem Gad",
   *   "description": "Web design consultation",
   *   "start": {
   *     "dateTime": "2026-01-10T11:00:00+02:00",
   *     "timeZone": "Africa/Cairo"
   *   },
   *   "end": {
   *     "dateTime": "2026-01-10T11:15:00+02:00",
   *     "timeZone": "Africa/Cairo"
   *   },
   *   "attendees": [
   *     {
   *       "email": "hazemhgad22@gmail.com",
   *       "displayName": "Hazem Gad"
   *     }
   *   ]
   * }
   *
   * Usage:
   * const eventData = formatForGoogleCalendar();
   * // Then send to Google Calendar API: POST https://www.googleapis.com/calendar/v3/calendars/primary/events
   */
  const formatForGoogleCalendar = () => {
    const { summary, name, email, description, startTime, endTime, timezone } =
      state.formData;

    // Build the Google Calendar API event object
    // startTime and endTime are already in RFC3339 format with timezone offset
    // Format: "2026-01-10T11:00:00+02:00"
    const googleCalendarEvent = {
      // REQUIRED: Event summary (title)
      summary: summary || 'Meeting', // Use summary from formData

      // OPTIONAL: Event description
      description: description || undefined, // Only include if not empty

      // REQUIRED: Start time
      start: {
        dateTime: startTime, // Already formatted as RFC3339: "2026-01-10T11:00:00+02:00"
        timeZone: timezone, // IANA timezone string (e.g., "Africa/Cairo")
      },

      // REQUIRED: End time
      end: {
        dateTime: endTime, // Already formatted as RFC3339: "2026-01-10T11:15:00+02:00"
        timeZone: timezone, // IANA timezone string (e.g., "Africa/Cairo")
      },

      // OPTIONAL: Attendees array (name and email are for the submitter/attendee)
      ...(email && {
        attendees: [
          {
            email: email, // REQUIRED if attendees array is present - submitter's email
            displayName: name || undefined, // OPTIONAL: Submitter's name
          },
        ],
      }),

      // OPTIONAL: Location (not in current formData, but can be added)
      // location: '',

      // OPTIONAL: Reminders (can customize or use defaults)
      // reminders: {
      //   useDefault: true, // Use calendar's default reminders
      // },
    };

    return googleCalendarEvent;
  };

  return (
    <div
      ref={calendarRef}
      className={`text-textPrimary pointer-events-auto absolute top-0 z-[99999] flex h-screen w-full flex-col bg-transparent transition-transform duration-800 outline-none ${
        state.viewState === 0
          ? 'translate-y-[calc(100%-77px)]'
          : 'translate-y-0 overflow-y-auto'
      }`}
      tabIndex={-1}
    >
      <div className="relative h-auto flex-1">
        <div
          className={`pointer-events-none absolute inset-0 z-0 bg-black ${
            state.viewState === 0
              ? 'opacity-0 transition-opacity duration-800'
              : 'opacity-100'
          }`}
        />

        {/* Start Now Button - Always visible */}
        <div
          ref={startButtonRef}
          className="relative z-10 flex h-[77px] items-center justify-center bg-transparent"
        >
          <button
            onClick={() => {
              if (state.viewState === 0) {
                dispatch({ type: 'START_CALENDAR' });
              } else {
                dispatch({ type: 'CLOSE_CALENDAR' });
              }
            }}
            className="font-grid rounded-full border border-white bg-gradient-to-br from-white via-gray-500 to-transparent px-4 py-2 text-2xl tracking-normal text-white uppercase transition-transform lg:px-8 lg:text-4xl"
          >
            {state.viewState === 0 ? 'Start Now' : 'Return to view'}
          </button>
        </div>

        {/* Header Container - Title and Back Button */}
        {(state.viewState === 1 ||
          state.viewState === 2 ||
          state.viewState === 3 ||
          state.viewState === 4) && (
          <div className="relative z-10 mx-auto mt-8 flex w-full max-w-lg items-center">
            {/* Back Button - Left */}
            {(state.viewState === 3 || state.viewState === 4) && (
              <button
                onClick={handleBack}
                className="absolute left-0 text-lg font-normal uppercase hover:underline"
              >
                &lt; BACK
              </button>
            )}
            {/* Title - Centered */}
            <AnimatePresence mode="wait">
              {(state.viewState === 1 || state.viewState === 2) && (
                <motion.h2
                  key="select-day-title"
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  transition={{
                    opacity: {
                      duration: 0.4,
                      delay: 0.4,
                      ease: 'easeInOut',
                    },
                  }}
                  className="mx-auto inline-block rounded-full bg-white px-3 py-1 text-xs font-bold text-black uppercase lg:text-sm"
                >
                  {getTitle()}
                </motion.h2>
              )}
              {(state.viewState === 3 || state.viewState === 4) && (
                <motion.h2
                  key="other-title"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mx-auto inline-block rounded-full bg-white px-3 py-1 text-sm font-bold text-black uppercase"
                >
                  {getTitle()}
                </motion.h2>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* State 2: Select Day */}
        {(state.viewState === 1 || state.viewState === 2) && (
          <div className="relative z-10 flex flex-1 flex-col p-6">
            {/* Month/Year Navigation */}
            <div className="font-grid mb-6 flex items-center justify-center gap-4">
              <motion.button
                initial={{ x: -100 }}
                animate={{ x: 0 }}
                transition={{
                  x: { duration: 0.4, delay: 0.4, ease: 'easeOut' },
                }}
                onClick={handlePreviousMonth}
                disabled={isPreviousMonthDisabled()}
                className="disabled:cursor-not-allowed disabled:opacity-30"
              >
                <img
                  src={arrowRightIcon}
                  alt="Previous"
                  className="h-4 w-4 rotate-180 lg:h-8 lg:w-8"
                />
              </motion.button>
              <motion.span
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  y: { duration: 0.4, delay: 0.4, ease: 'easeOut' },
                  opacity: { duration: 0.4, delay: 0.4 },
                }}
                className="text-xl font-bold lg:text-3xl"
              >
                {getMonthName(state.currentMonth)} {state.currentYear}
              </motion.span>
              <motion.button
                initial={{ x: 100 }}
                animate={{ x: 0 }}
                transition={{
                  x: { duration: 0.4, delay: 0.4, ease: 'easeOut' },
                }}
                onClick={handleNextMonth}
                disabled={isNextMonthDisabled()}
                className="disabled:cursor-not-allowed disabled:opacity-30"
              >
                <img
                  src={arrowRightIcon}
                  alt="Next"
                  className="h-4 w-4 lg:h-8 lg:w-8"
                />
              </motion.button>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto">
              <div className="mx-auto w-full max-w-lg">
                {/* Weekday Headers */}
                <div className="mb-6 grid grid-cols-7 gap-2 lg:gap-4">
                  {weekdays.map((day) => (
                    <motion.div
                      key={day}
                      initial={{ y: -20, opacity: 0, scale: 0.8 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{
                        y: {
                          duration: 0.4,
                          delay: 0.4,
                          ease: 'easeOut',
                        },
                        opacity: {
                          duration: 0.4,
                          delay: 0.4,
                        },
                        scale: {
                          duration: 0.4,
                          delay: 0.4,
                          ease: 'easeOut',
                        },
                      }}
                      className="rounded-xl text-center text-xs font-bold uppercase shadow-[inset_1px_0_0_0_rgba(255,255,255,0.1),inset_-1px_0_0_0_rgba(255,255,255,0.1),inset_0_4px_6px_rgba(255,255,255,0.6)] lg:text-sm"
                    >
                      {day}
                    </motion.div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-2 lg:gap-4">
                  {calendarDays.map((day, index) => {
                    const isDisabled = day !== null && isDayDisabled(day);
                    return (
                      <motion.button
                        key={index}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: day === null ? 0 : 1 }}
                        transition={{
                          scale: {
                            duration: 0.4,
                            delay: 0.4,
                            ease: 'easeOut',
                          },
                          opacity: {
                            duration: 0.4,
                            delay: 0.4,
                          },
                        }}
                        onClick={() =>
                          day !== null && !isDisabled && handleDayClick(day)
                        }
                        disabled={day === null || isDisabled}
                        className={`aspect-square rounded-xl text-center text-base font-bold lg:text-xl ${
                          day === null
                            ? 'cursor-default opacity-0'
                            : isDisabled
                              ? 'cursor-not-allowed bg-white text-black opacity-30 shadow-[inset_1px_0_0_rgba(0,0,0,0.1),inset_-1px_0_0_rgba(0,0,0,0.1),inset_0_4px_6px_rgba(0,0,0,0.6)]'
                              : 'bg-black text-white shadow-[inset_1px_0_0_rgba(255,255,255,0.1),inset_-1px_0_0_rgba(255,255,255,0.1),inset_0_4px_6px_rgba(255,255,255,0.6)]'
                        }`}
                      >
                        {day !== null ? day.toString().padStart(2, '0') : ''}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Timezone Selector */}
            <div className="mx-auto mt-2 flex w-fit items-center gap-2">
              <GlobeIcon />
              <div className="relative">
                <select
                  value={state.timezone}
                  onChange={handleTimezoneChange}
                  aria-label="Select timezone"
                  title="Select timezone"
                  className="bg-bgPrimary w-fit appearance-none rounded-md px-4 py-3 pr-12 text-white uppercase focus:outline-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='12' height='8' fill='white'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '12px 8px',
                  }}
                >
                  {timezones.map((tz) => (
                    <option
                      key={tz}
                      value={tz}
                      className="bg-bgPrimary uppercase"
                    >
                      {getTimezoneDisplayName(tz)} (
                      {getCurrentTimeInTimezone(tz)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* State 3: Select Time */}
        {state.viewState === 3 && (
          <div className="relative z-10 flex flex-col overflow-hidden p-6">
            {/* Time Buttons */}
            <div className="flex-1 overflow-auto">
              <div className="mx-auto max-w-lg space-y-3">
                {availableTimes.map((time, index) => (
                  <div
                    key={time}
                    ref={(el) => {
                      timeButtonsRef.current[time] = el;
                    }}
                    className="flex gap-2 overflow-hidden"
                  >
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.05 * index,
                        ease: 'easeOut',
                      }}
                      onClick={() => handleTimeClick(time)}
                      className="time-button w-full rounded-xl bg-[#333] px-4 py-3 text-center shadow-[inset_3px_0_0_rgba(255,255,255,0.04),inset_-3px_0_0_0px_rgba(255,255,255,0.04),inset_0_2px_4px_rgba(255,255,255,0.6)]"
                    >
                      {time}
                    </motion.button>
                    <button
                      onClick={handleTimeNext}
                      className="next-button w-0 overflow-hidden rounded-xl bg-white py-3 text-center font-bold text-black transition-opacity hover:bg-gray-200"
                    >
                      NEXT
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* State 4: Confirm */}
        {state.viewState === 4 && (
          <div className="relative z-10 mx-auto mt-[77px] flex w-full max-w-lg flex-col overflow-auto px-4 lg:px-0">
            {/* Info Section */}
            <div className="[&>img>path]:text-textPrimary mb-8 space-y-2">
              <p className="flex items-center gap-2 text-lg">
                <img
                  src={timeSvg}
                  alt="time"
                  className="stroke-textPrimary h-8 w-8"
                />
                15 min
              </p>
              <p className="flex items-center gap-2 text-sm opacity-100">
                <img src={timeSvg} alt="time" className="h-8 w-8" />
                Web conferencing details provided upon confirmation.
              </p>
              <p className="flex items-center gap-2 text-lg font-bold">
                <img src={timeSvg} alt="time" className="h-8 w-8" />
                {formatSelectedDateTime()}
              </p>
            </div>

            {/* Form */}
            <div className="mx-auto w-full max-w-lg space-y-6">
              <h3 className="text-xl font-bold uppercase">Enter details</h3>

              {/* Summary Input */}
              <div className="relative">
                <label
                  htmlFor="summary"
                  className="bg-bgPrimary absolute top-0 left-3 -translate-y-1/2 px-2 text-sm"
                >
                  summary
                </label>
                <input
                  type="text"
                  id="summary"
                  name="summary"
                  value={state.formData.summary}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-white bg-transparent px-4 py-3 text-white focus:ring-2 focus:ring-white focus:outline-none"
                  placeholder="Meeting title"
                />
              </div>

              {/* Name Input */}
              <div className="relative">
                <label
                  htmlFor="name"
                  className="bg-bgPrimary absolute top-0 left-3 -translate-y-1/2 px-2 text-sm"
                >
                  name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={state.formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-white bg-transparent px-4 py-3 text-white focus:ring-2 focus:ring-white focus:outline-none"
                  placeholder="Your name"
                />
              </div>

              {/* Email Input */}
              <div className="relative">
                <label
                  htmlFor="email"
                  className="bg-bgPrimary absolute top-0 left-3 -translate-y-1/2 px-2 text-sm"
                >
                  email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={state.formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-white bg-transparent px-4 py-3 text-white focus:ring-2 focus:ring-white focus:outline-none"
                />
              </div>

              {/* Description Input */}
              <div className="relative">
                <label
                  htmlFor="description"
                  className="bg-bgPrimary absolute top-0 left-3 -translate-y-1/2 px-2 text-sm"
                >
                  description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={state.formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-md border border-white bg-transparent px-4 py-3 text-white focus:ring-2 focus:ring-white focus:outline-none"
                />
              </div>

              {/* Start Time Input (Read-only, shows RFC3339 format with timezone) */}
              <div className="relative">
                <label
                  htmlFor="startTime"
                  className="bg-bgPrimary absolute top-0 left-3 -translate-y-1/2 px-2 text-sm"
                >
                  startTime
                </label>
                <input
                  type="text"
                  id="startTime"
                  name="startTime"
                  value={state.formData.startTime}
                  readOnly
                  className="w-full cursor-not-allowed rounded-md border border-white bg-transparent px-4 py-3 text-white opacity-70"
                  title="Start time in RFC3339 format with timezone offset"
                />
              </div>

              {/* End Time Input (Read-only, shows RFC3339 format with timezone) */}
              <div className="relative">
                <label
                  htmlFor="endTime"
                  className="bg-bgPrimary absolute top-0 left-3 -translate-y-1/2 px-2 text-sm"
                >
                  endTime
                </label>
                <input
                  type="text"
                  id="endTime"
                  name="endTime"
                  value={state.formData.endTime}
                  readOnly
                  className="w-full cursor-not-allowed rounded-md border border-white bg-transparent px-4 py-3 text-white opacity-70"
                  title="End time in RFC3339 format with timezone offset"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                onClick={handleSubmit}
                className="mt-8 w-full rounded-xl border border-white bg-white px-6 py-4 text-lg font-bold text-black uppercase transition-transform hover:scale-105 hover:bg-gray-100"
              >
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
