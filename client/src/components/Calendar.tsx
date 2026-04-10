import { useState, useEffect } from 'react';
import { Reservation } from '../types';
import { api } from '../services/api';

interface CalendarProps {
  vehicleId: number;
  reservations: Reservation[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export default function Calendar({ vehicleId, reservations, selectedDate, onSelectDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);

  useEffect(() => {
    loadUnavailableDates();
  }, [vehicleId]);

  const loadUnavailableDates = async () => {
    const dates = await api.vehicles.getUnavailable(vehicleId);
    setUnavailableDates(dates.map(d => d.date));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const formatDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const isDateUnavailable = (date: string) => {
    return unavailableDates.includes(date);
  };

  const hasApprovedReservation = (date: string) => {
    return reservations.some(r => r.date === date && r.status === 'approved');
  };

  const hasPendingReservation = (date: string) => {
    return reservations.some(r => r.date === date && r.status === 'pending');
  };

  const isToday = (day: number) => {
    const today = new Date();
    return formatDate(day) === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const isPastDate = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(formatDate(day));
    return checkDate < today;
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-lg font-semibold">
          {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
        </span>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startingDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = formatDate(day);
          const isPast = isPastDate(day);
          const isUnavailable = isDateUnavailable(date);
          const isApproved = hasApprovedReservation(date);
          const isPending = hasPendingReservation(date);
          const isSelected = date === selectedDate;
          const isTodayDate = isToday(day);

          let cellClass = 'aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all cursor-pointer relative';
          
          if (isPast) {
            cellClass += ' text-slate-300 cursor-not-allowed';
          } else if (isUnavailable) {
            cellClass += ' bg-slate-200 text-slate-400 cursor-not-allowed';
          } else if (isSelected) {
            cellClass += ' bg-primary-600 text-white';
          } else if (isTodayDate) {
            cellClass += ' bg-primary-100 text-primary-700 hover:bg-primary-200';
          } else {
            cellClass += ' hover:bg-slate-100 text-slate-700';
          }

          return (
            <div
              key={day}
              onClick={() => !isPast && !isUnavailable && onSelectDate(date)}
              className={cellClass}
            >
              {day}
              {!isPast && !isUnavailable && (
                <>
                  {isApproved && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-green-500 rounded-full" />
                  )}
                  {isPending && !isApproved && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-amber-500 rounded-full" />
                  )}
                </>
              )}
              {isUnavailable && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-slate-400 rounded-full" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-slate-500">已批准</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500"></div>
          <span className="text-slate-500">待审批</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-slate-300"></div>
          <span className="text-slate-500">不可用</span>
        </div>
      </div>
    </div>
  );
}
