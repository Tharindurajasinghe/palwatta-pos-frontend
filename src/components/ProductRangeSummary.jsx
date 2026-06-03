import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PRODUCT_RANGE_START = '001';
const PRODUCT_RANGE_END   = '011';

const ProductRangeSummary = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summaryItems, setSummaryItems] = useState([]);
  const [summaryDate, setSummaryDate] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSummary();
  }, [selectedDate]);

  const loadSummary = async () => {
    setLoading(true);
    setNotFound(false);
    setSummaryItems([]);
    setSummaryDate(null);
    try {
      const response = await api.getDailySummary(selectedDate);
      const data = response.data;

      // Filter only product IDs 001–011
      const filtered = (data.items || [])
        .filter(item => {
          const id = item.productId;
          return id >= PRODUCT_RANGE_START && id <= PRODUCT_RANGE_END;
        })
        .sort((a, b) => a.productId.localeCompare(b.productId));

      setSummaryItems(filtered);
      setSummaryDate(data.date);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const totalSoldQuantity = summaryItems.reduce((sum, item) => sum + item.soldQuantity, 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Product Summary (001 – 011)</h2>

      {/* Date picker */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-2 font-semibold">Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          <p>Loading...</p>
        </div>
      )}

      {/* No summary for date */}
      {!loading && notFound && (
        <div className="text-center py-12 text-gray-500">
          <p>No summary available for this date.</p>
          <p className="text-sm mt-2">Day must be ended to generate a summary.</p>
        </div>
      )}

      {/* Summary found but no items in range */}
      {!loading && !notFound && summaryItems.length === 0 && summaryDate && (
        <div className="text-center py-12 text-gray-500">
          <p>No sales found for products 001–011 on this date.</p>
        </div>
      )}

      {/* Table */}
      {!loading && summaryItems.length > 0 && (
        <>
          <h3 className="text-lg font-bold mb-4">
            Daily Summary — {new Date(summaryDate).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'long', year: 'numeric'
            })}
          </h3>

          <div className="overflow-x-auto mb-6">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Item ID</th>
                  <th className="px-4 py-2 text-left">Item Name</th>
                  <th className="px-4 py-2 text-right">Sold Quantity</th>
                </tr>
              </thead>
              <tbody>
                {summaryItems.map(item => (
                  <tr key={item.productId} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono font-semibold">{item.productId}</td>
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2 text-right font-semibold">{item.soldQuantity}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td className="px-4 py-2 font-bold" colSpan={2}>Total</td>
                  <td className="px-4 py-2 text-right font-bold">{totalSoldQuantity}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductRangeSummary;