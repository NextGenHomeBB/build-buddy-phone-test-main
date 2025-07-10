import { useState, useMemo } from 'react';
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday } from 'date-fns';

export interface CalendarEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  type: 'phase' | 'project' | 'task';
  color?: string;
}

export function useCalendar(events: CalendarEvent[] = []) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'gantt'>('month');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);
      return date >= eventStart && date <= eventEnd;
    });
  };

  const calendarDays = useMemo(() => {
    return monthDays.map(day => ({
      date: day,
      isCurrentMonth: isSameMonth(day, currentDate),
      isToday: isToday(day),
      events: getEventsForDay(day),
      dayNumber: format(day, 'd'),
    }));
  }, [monthDays, currentDate, events]);

  return {
    currentDate,
    view,
    setView,
    calendarDays,
    monthStart,
    monthEnd,
    nextMonth,
    prevMonth,
    goToToday,
    getEventsForDay,
  };
}