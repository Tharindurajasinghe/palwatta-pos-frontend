import React, { useState } from 'react';
import api from '../services/api';
import MonthSummary from './MonthSummary';
import SummaryTable from './SummaryTable';

// ── Inline multi-date calendar ──────────────────────────────────────────────
const DAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const toYMD = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const todayDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const DateRangePicker = ({ selectedDates, onChange }) => {
  const now = todayDate();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const buildGrid = () => {
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const cellDate = new Date(viewYear, viewMonth, day);
    cellDate.setHours(0, 0, 0, 0);
    if (cellDate > now) return;
    const ymd = toYMD(cellDate);
    if (selectedDates.includes(ymd)) {
      onChange(selectedDates.filter(d => d !== ymd));
    } else {
      onChange([...selectedDates, ymd].sort());
    }
  };

  const todayYMD = toYMD(now);
  const grid = buildGrid();

  return (
    <div className="border rounded-lg p-3 bg-white shadow-sm w-72">
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
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {grid.map((day, i) => {
          if (!day) return <div key={i} />;
          const cellDate = new Date(viewYear, viewMonth, day);
          cellDate.setHours(0, 0, 0, 0);
          const ymd        = toYMD(cellDate);
          const isFuture   = cellDate > now;
          const isToday    = ymd === todayYMD;
          const isSelected = selectedDates.includes(ymd);
          return (
            <button
              key={i}
              type="button"
              disabled={isFuture}
              onClick={() => handleDayClick(day)}
              className={[
                'text-center text-sm py-1 rounded-full mx-auto w-8 h-8 flex items-center justify-center transition-colors',
                isFuture   ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer',
                isSelected ? 'bg-green-600 text-white font-semibold hover:bg-green-700' :
                isToday    ? 'border-2 border-green-500 text-green-700 hover:bg-green-50' :
                !isFuture  ? 'hover:bg-gray-100 text-gray-700' : ''
              ].join(' ')}
            >
              {day}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">Click dates to select / deselect</p>
    </div>
  );
};

// ── Merge multiple daily summaries into one ──────────────────────────────────
const mergeSummaries = (summaries) => {
  const itemsMap = new Map();
  let totalIncome = 0;
  let totalProfit = 0;
  for (const s of summaries) {
    totalIncome += s.totalIncome;
    totalProfit += s.totalProfit;
    for (const item of s.items) {
      if (itemsMap.has(item.productId)) {
        const ex = itemsMap.get(item.productId);
        ex.soldQuantity += item.soldQuantity;
        ex.totalIncome  += item.totalIncome;
        ex.profit       += item.profit;
      } else {
        itemsMap.set(item.productId, { ...item });
      }
    }
  }
  return { items: Array.from(itemsMap.values()), totalIncome, totalProfit };
};

// ── Main Summary component ────────────────────────────────────────────────────
const Summary = () => {
  const [viewType,             setViewType]             = useState('daily');
  const [selectedDates,        setSelectedDates]        = useState([]);
  const [mergedSummary,        setMergedSummary]        = useState(null);
  const [loading,              setLoading]              = useState(false);
  const [missedDates,          setMissedDates]          = useState([]);
  const [showOnlyProducts1To11, setShowOnlyProducts1To11] = useState(false); // ← existing feature kept

  const formatYMD = (ymd) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const handleRemoveDate = (ymd) => {
    const updated = selectedDates.filter(d => d !== ymd);
    setSelectedDates(updated);
    if (updated.length === 0) {
      setMergedSummary(null);
      setMissedDates([]);
    }
  };

  const handleViewSummary = async () => {
    if (selectedDates.length === 0) return;
    setLoading(true);
    setMergedSummary(null);
    setMissedDates([]);
    const found  = [];
    const missed = [];
    await Promise.all(
      selectedDates.map(async (date) => {
        try {
          const res = await api.getDailySummary(date);
          found.push(res.data);
        } catch {
          missed.push(date);
        }
      })
    );
    setMissedDates(missed);
    if (found.length > 0) setMergedSummary(mergeSummaries(found));
    setLoading(false);
  };

  // ── existing filter logic kept exactly as-is ──────────────────────────────
  const filteredItems =
    showOnlyProducts1To11 && mergedSummary
      ? mergedSummary.items.filter(
          (item) => item.productId >= 1 && item.productId <= 11
        )
      : mergedSummary?.items || [];

  const dateRangeLabel = () => {
    if (selectedDates.length === 0) return '';
    if (selectedDates.length === 1) return formatYMD(selectedDates[0]);
    return `${formatYMD(selectedDates[0])} — ${formatYMD(selectedDates[selectedDates.length - 1])}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Summary</h2>

      {/* Tab buttons — existing layout kept, toggle button kept in same row */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setViewType('daily')}
          className={`px-6 py-2 rounded font-semibold ${
            viewType === 'daily'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Daily Summary
        </button>
        <button
          onClick={() => setViewType('monthly')}
          className={`px-6 py-2 rounded font-semibold ${
            viewType === 'monthly'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Monthly Summary
        </button>

        {/* existing toggle button — kept exactly as-is */}
        <button
          onClick={() => setShowOnlyProducts1To11(!showOnlyProducts1To11)}
          className={`mb-4 px-4 py-2 rounded font-semibold ${
            showOnlyProducts1To11
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {showOnlyProducts1To11
            ? 'Show All Products'
            : 'Show Products ID 1-11 Only'}
        </button>
      </div>

      {viewType === 'daily' ? (
        <div>
          <div className="mb-6 flex gap-6 items-start">

            {/* Calendar */}
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Select Date(s):</label>
              <DateRangePicker
                selectedDates={selectedDates}
                onChange={setSelectedDates}
              />
            </div>

            {/* Selected dates list + View button */}
            <div className="flex-1">
              <label className="block text-gray-700 mb-2 font-semibold">
                Selected Dates {selectedDates.length > 0 && (
                  <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {selectedDates.length} {selectedDates.length === 1 ? 'day' : 'days'}
                  </span>
                )}
              </label>

              {selectedDates.length === 0 ? (
                <p className="text-sm text-gray-400 italic mt-2">No dates selected. Click dates on the calendar.</p>
              ) : (
                <div className="space-y-1 mb-4 max-h-48 overflow-y-auto">
                  {selectedDates.map(ymd => (
                    <div key={ymd}
                      className="flex items-center justify-between bg-gray-50 border px-3 py-1.5 rounded text-sm">
                      <span className="text-gray-700">{formatYMD(ymd)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDate(ymd)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedDates.length > 0 && (
                <button
                  onClick={handleViewSummary}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold disabled:bg-gray-400"
                >
                  {loading ? 'Loading...' : 'View Summary'}
                </button>
              )}
            </div>
          </div>

          {/* Dates with no summary found */}
          {missedDates.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              <span className="font-semibold">No summary found for: </span>
              {missedDates.map(d => formatYMD(d)).join(', ')}
              <span className="ml-1">(day must be ended to generate summary)</span>
            </div>
          )}

          {/* Summary results */}
          {mergedSummary && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4">
                {selectedDates.length === 1
                  ? `Daily Summary — ${dateRangeLabel()}`
                  : `Summary for ${selectedDates.length} days — ${dateRangeLabel()}`
                }
              </h3>

              {/* SummaryTable uses filteredItems — existing filter logic applies here */}
              <SummaryTable items={filteredItems} />

              {/* existing totals box — kept exactly as-is */}
              <div className="bg-green-50 p-6 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 mb-1">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">
                      Rs. {mergedSummary.totalIncome.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Total Profit</p>
                    <p className="text-2xl font-bold text-green-700">
                      Rs. {mergedSummary.totalProfit.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No results at all */}
          {!loading && !mergedSummary && selectedDates.length > 0 && missedDates.length > 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No summary available for the selected dates.</p>
              <p className="text-sm mt-2">Day must be ended to generate summary.</p>
            </div>
          )}

          {/* Initial empty state */}
          {!loading && !mergedSummary && selectedDates.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Select one or more dates from the calendar to view summary.</p>
            </div>
          )}

        </div>
      ) : (
        <div>
          {viewType === 'monthly' && <MonthSummary />}
        </div>
      )}
    </div>
  );
};

export default Summary;
