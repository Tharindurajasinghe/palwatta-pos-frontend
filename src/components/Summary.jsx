import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Summary = () => {
  const [viewType, setViewType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [dailySummary, setDailySummary] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [monthlySummaries, setMonthlySummaries] = useState([]);

  useEffect(() => {
    loadMonthlySummaries();
  }, []);

  useEffect(() => {
    if (viewType === 'daily') {
      loadDailySummary();
    }
  }, [selectedDate, viewType]);

  useEffect(() => {
    if (viewType === 'monthly' && selectedMonth) {
      loadMonthlySummary();
    }
  }, [selectedMonth, viewType]);

  const loadDailySummary = async () => {
    try {
      const response = await api.getDailySummary(selectedDate);
      setDailySummary(response.data);
    } catch (error) {
      setDailySummary(null);
    }
  };

  const loadMonthlySummary = async () => {
    try {
      const response = await api.getMonthlySummary(selectedMonth);
      setMonthlySummary(response.data);
    } catch (error) {
      setMonthlySummary(null);
    }
  };

  const loadMonthlySummaries = async () => {
    try {
      const response = await api.getAllMonthlySummaries();
      setMonthlySummaries(response.data);
    } catch (error) {
      console.error('Error loading monthly summaries:', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Summary</h2>

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
      </div>

      {viewType === 'daily' ? (
        <div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">View Summary Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {dailySummary ? (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-4">
                  Daily Summary - {new Date(dailySummary.date).toLocaleDateString()}
                </h3>
                
                <div className="overflow-x-auto mb-6">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Item ID</th>
                        <th className="px-4 py-2 text-left">Item Name</th>
                        <th className="px-4 py-2 text-right">Sold Quantity</th>
                        <th className="px-4 py-2 text-right">Total Income</th>
                        <th className="px-4 py-2 text-right">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailySummary.items.map(item => (
                        <tr key={item.productId} className="border-b">
                          <td className="px-4 py-2">{item.productId}</td>
                          <td className="px-4 py-2">{item.name}</td>
                          <td className="px-4 py-2 text-right">{item.soldQuantity}</td>
                          <td className="px-4 py-2 text-right">Rs. {item.totalIncome.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-green-600 font-semibold">
                            Rs. {item.profit.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 mb-1">Total Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        Rs. {dailySummary.totalIncome.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Total Profit</p>
                      <p className="text-2xl font-bold text-green-700">
                        Rs. {dailySummary.totalProfit.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No summary available for this date</p>
              <p className="text-sm mt-2">Day must be ended to generate summary</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">Select Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Select Month --</option>
              {monthlySummaries.map(summary => (
                <option key={summary.month} value={summary.month}>
                  {summary.monthName}
                </option>
              ))}
            </select>
          </div>

          {monthlySummary ? (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2">{monthlySummary.monthName}</h3>
                <p className="text-sm text-gray-600">
                  Period: {monthlySummary.startDate} to {monthlySummary.endDate} 
                  ({monthlySummary.daysIncluded} days)
                </p>
              </div>

              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Item ID</th>
                      <th className="px-4 py-2 text-left">Item Name</th>
                      <th className="px-4 py-2 text-right">Total Sold</th>
                      <th className="px-4 py-2 text-right">Total Income</th>
                      <th className="px-4 py-2 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySummary.items.map(item => (
                      <tr key={item.productId} className="border-b">
                        <td className="px-4 py-2">{item.productId}</td>
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2 text-right">{item.soldQuantity}</td>
                        <td className="px-4 py-2 text-right">Rs. {item.totalIncome.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-green-600 font-semibold">
                          Rs. {item.profit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 mb-1">Total Income</p>
                    <p className="text-2xl font-bold text-blue-600">
                      Rs. {monthlySummary.totalIncome.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Total Profit</p>
                    <p className="text-2xl font-bold text-blue-700">
                      Rs. {monthlySummary.totalProfit.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {selectedMonth ? 
                <p>No summary available for this month</p> :
                <p>Please select a month to view summary</p>
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Summary;
