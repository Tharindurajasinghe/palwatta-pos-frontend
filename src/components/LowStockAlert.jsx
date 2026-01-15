import React, { useState, useEffect } from 'react';
import api from '../services/api';

const LowStockAlert = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLowStockItems();
    // Refresh every 30 seconds
    const interval = setInterval(loadLowStockItems, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLowStockItems = async () => {
    try {
      const response = await api.getProducts();
      const lowStock = response.data.filter(product => product.stock <= 10);
      setLowStockItems(lowStock);
      setLoading(false);
    } catch (error) {
      console.error('Error loading low stock items:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">Loading stock alerts...</p>
      </div>
    );
  }

  if (lowStockItems.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">✅</span>
          <h2 className="text-xl font-bold text-green-600">Stock Levels Good</h2>
        </div>
        <p className="text-gray-600">All items have sufficient stock (above 10 units)</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚠️</span>
          <h2 className="text-xl font-bold text-orange-600">Low Stock Alert</h2>
        </div>
        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
          {lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-orange-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Item ID</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Item Name</th>
              <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Available Quantity</th>
              <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {lowStockItems.map(item => (
              <tr 
                key={item.productId} 
                className={`border-b hover:bg-gray-50 ${
                  item.stock === 0 ? 'bg-red-50' : item.stock <= 5 ? 'bg-orange-50' : ''
                }`}
              >
                <td className="px-4 py-3 font-mono font-semibold">{item.productId}</td>
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-bold ${
                    item.stock === 0 ? 'text-red-600' : 
                    item.stock <= 5 ? 'text-orange-600' : 
                    'text-yellow-600'
                  }`}>
                    {item.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {item.stock === 0 ? (
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      OUT OF STOCK
                    </span>
                  ) : item.stock <= 5 ? (
                    <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      CRITICAL
                    </span>
                  ) : (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      LOW
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200">
        <p className="text-sm text-orange-800">
          <span className="font-semibold">💡 Tip:</span> Please restock these items soon to avoid stockouts.
        </p>
      </div>
    </div>
  );
};

export default LowStockAlert;