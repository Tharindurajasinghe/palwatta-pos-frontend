import React, { useState } from 'react';

// Reusable expire date picker — calendar icon triggers inline calendar
// Props:
//   expireDates: string[]  — array of 'YYYY-MM-DD' strings (already filtered, no past dates)
//   onChange: (dates: string[]) => void  — called whenever dates change

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const today = () => {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d;
};

const toYMD = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDisplay = (ymd) => {
  // parse as local date to avoid UTC shift
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ExpireDatePicker = ({ expireDates = [], onChange }) => {
  const now = today();
  const [showCal, setShowCal] = useState(false);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  // Filter out any already-passed dates on render
  const validDates = expireDates.filter(ymd => {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d) >= now;
  });

  // Build calendar grid for current viewYear/viewMonth
  const buildGrid = () => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const cellDate = new Date(viewYear, viewMonth, day);
    cellDate.setHours(0,0,0,0);
    if (cellDate < now) return; // past — ignore
    const ymd = toYMD(cellDate);
    let updated;
    if (validDates.includes(ymd)) {
      updated = validDates.filter(d => d !== ymd); // deselect
    } else {
      updated = [...validDates, ymd].sort();        // select
    }
    onChange(updated);
  };

  const handleRemove = (ymd) => {
    onChange(validDates.filter(d => d !== ymd));
  };

  const grid = buildGrid();
  const todayYMD = toYMD(now);

  return (
    <div>
      {/* Label row with calendar icon */}
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-gray-700">Expire Dates</label>
        <button
          type="button"
          title="Open calendar"
          onClick={() => setShowCal(p => !p)}
          className="text-gray-500 hover:text-green-600 transition-colors"
        >
          {/* Calendar SVG icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </button>
      </div>

      {/* Inline calendar */}
      {showCal && (
        <div className="border rounded-lg p-3 mb-3 bg-white shadow-md w-full">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth}
              className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600 font-bold text-lg leading-none">
              ‹
            </button>
            <span className="font-semibold text-gray-700 text-sm">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth}
              className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600 font-bold text-lg leading-none">
              ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {grid.map((day, i) => {
              if (!day) return <div key={i} />;
              const cellDate = new Date(viewYear, viewMonth, day);
              cellDate.setHours(0,0,0,0);
              const ymd = toYMD(cellDate);
              const isPast = cellDate < now;
              const isToday = ymd === todayYMD;
              const isSelected = validDates.includes(ymd);

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleDayClick(day)}
                  className={[
                    'text-center text-sm py-1 rounded-full mx-auto w-8 h-8 flex items-center justify-center transition-colors',
                    isPast ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer',
                    isSelected ? 'bg-green-600 text-white font-semibold hover:bg-green-700' :
                    isToday   ? 'border-2 border-green-500 text-green-700 hover:bg-green-50' :
                    !isPast   ? 'hover:bg-gray-100 text-gray-700' : ''
                  ].join(' ')}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 mt-2 text-center">
            Click dates to select / deselect. Multiple dates allowed.
          </p>
        </div>
      )}

      {/* Selected dates list */}
      {validDates.length > 0 ? (
        <div className="space-y-1">
          {validDates.map(ymd => (
            <div key={ymd}
              className="flex items-center justify-between bg-gray-50 border px-3 py-1.5 rounded text-sm">
              <span className="text-gray-700">{formatDisplay(ymd)}</span>
              <button
                type="button"
                onClick={() => handleRemove(ymd)}
                className="text-red-400 hover:text-red-600 text-lg leading-none ml-2"
                title="Remove this date"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">No expire dates added.</p>
      )}
    </div>
  );
};

export default ExpireDatePicker;