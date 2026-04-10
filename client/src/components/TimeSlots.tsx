import { useMemo } from 'react';
import { Reservation } from '../types';

interface TimeSlotsProps {
  reservations: Reservation[];
  selectedStart: string;
  selectedEnd: string;
  onSelectTime: (time: string) => void;
}

export default function TimeSlots({ reservations, selectedStart, selectedEnd, onSelectTime }: TimeSlotsProps) {
  const timeSlots = useMemo(() => {
    const slots: { time: string; display: string }[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const display = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        slots.push({ time, display });
      }
    }
    return slots;
  }, []);

  const getSlotStatus = (time: string): 'available' | 'booked' | 'selected' | 'in-range' | 'disabled' | 'before-start' => {
    const slotMinutes = timeToMinutes(time);
    
    const activeReservations = reservations.filter(r => r.status !== 'rejected');
    
    for (const r of activeReservations) {
      const startMinutes = timeToMinutes(r.start_time);
      const endMinutes = timeToMinutes(r.end_time);
      
      if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
        return 'booked';
      }
    }

    if (selectedStart && selectedEnd) {
      const startMinutes = timeToMinutes(selectedStart);
      const endMinutes = timeToMinutes(selectedEnd);
      
      if (slotMinutes === startMinutes) {
        return 'selected';
      }
      if (slotMinutes === endMinutes) {
        return 'selected';
      }
      if (slotMinutes > startMinutes && slotMinutes < endMinutes) {
        return 'in-range';
      }
      if (slotMinutes < startMinutes) {
        return 'before-start';
      }
    } else if (selectedStart) {
      const startMinutes = timeToMinutes(selectedStart);
      if (slotMinutes === startMinutes) {
        return 'selected';
      }
      if (slotMinutes < startMinutes) {
        return 'before-start';
      }
    }

    return 'available';
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getSlotClass = (status: string) => {
    const baseClass = 'px-3 py-2 text-sm font-medium rounded transition-all text-center';
    
    switch (status) {
      case 'booked':
        return `${baseClass} bg-slate-200 text-slate-500 cursor-not-allowed line-through`;
      case 'selected':
        return `${baseClass} bg-primary-600 text-white cursor-pointer`;
      case 'in-range':
        return `${baseClass} bg-primary-100 text-primary-700 cursor-pointer`;
      case 'disabled':
        return `${baseClass} bg-slate-100 text-slate-300 cursor-not-allowed`;
      case 'before-start':
        return `${baseClass} bg-slate-200 text-slate-400 cursor-not-allowed`;
      default:
        return `${baseClass} bg-white border border-slate-200 text-slate-700 hover:bg-primary-50 hover:border-primary-300 cursor-pointer`;
    }
  };

  const handleClick = (time: string, status: string) => {
    if (status === 'booked' || status === 'disabled' || status === 'before-start') return;
    onSelectTime(time);
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-2">
        {timeSlots.map(({ time, display }) => {
          const status = getSlotStatus(time);
          return (
            <div
              key={time}
              onClick={() => handleClick(time, status)}
              className={getSlotClass(status)}
            >
              {display}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-600">
          <span className="font-medium">提示：</span>
          点击选择开始时间，再次点击选择结束时间（结束时间必须在开始时间之后）
        </p>
        {selectedStart && (
          <p className="text-sm text-primary-600 mt-1">
            已选择：{selectedStart} {selectedEnd ? `- ${selectedEnd}` : '(请选择结束时间)'}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-white border border-slate-200"></div>
          <span className="text-slate-500">可选</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary-600"></div>
          <span className="text-slate-500">已选</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary-100"></div>
          <span className="text-slate-500">区间</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-slate-200"></div>
          <span className="text-slate-500">已预约/不可选</span>
        </div>
      </div>
    </div>
  );
}
