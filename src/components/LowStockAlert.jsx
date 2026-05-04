import React, { useState, useEffect } from 'react';
import api from '../services/api';

const LowStockAlert = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [allLowStockItems, setAllLowStockItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(''); // NEW
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterItems();
  }, [selectedCategory, selectedStatus, allLowStockItems]); // updated dep

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.getProducts(),
        api.getCategories()
      ]);
      const lowStock = productsRes.data.filter(product => product.stock <= 10);
      setAllLowStockItems(lowStock);
      setCategories(categoriesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading low stock items:', error);
      setLoading(false);
    }
  };

  // NEW: unified filter function replacing filterByCategory
  const filterItems = () => {
    let filtered = allLowStockItems;

    if (selectedCategory) {
      filtered = filtered.filter(item => item.categoryId === selectedCategory);
    }

    if (selectedStatus === 'out') {
      filtered = filtered.filter(item => item.stock === 0);
    } else if (selectedStatus === 'critical') {
      filtered = filtered.filter(item => item.stock > 0 && item.stock <= 5);
    } else if (selectedStatus === 'low') {
      filtered = filtered.filter(item => item.stock > 5 && item.stock <= 10);
    }

    setLowStockItems(filtered);
  };

  // NEW: toggle status - deselects if same button clicked again
  const handleStatusToggle = (status) => {
    setSelectedStatus(prev => prev === status ? '' : status);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.categoryId === categoryId);
    return category ? category.name : 'Unknown';
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">Loading stock alerts...</p>
      </div>
    );
  }

  if (allLowStockItems.length === 0) {
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

      {/* Category Filter */}
      <div className="mb-4">
        <label className="block text-gray-700 mb-2 font-semibold">Filter by Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-64 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Categories ({allLowStockItems.length})</option>
          {categories.map(cat => {
            const count = allLowStockItems.filter(item => item.categoryId === cat.categoryId).length;
            if (count === 0) return null;
            return (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.name} ({count})
              </option>
            );
          })}
        </select>
      </div>

      {/* NEW: Status Filter Buttons */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-gray-500">Filter by Status:</span>

        {/* Out of Stock */}
        <button
          onClick={() => handleStatusToggle('out')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 text-sm font-semibold transition-all duration-150 ${
            selectedStatus === 'out'
              ? 'border-red-500 bg-red-100 text-red-700'
              : 'border-gray-200 bg-gray-100 text-gray-500 hover:border-red-300 hover:text-red-500'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${
            selectedStatus === 'out'
              ? 'bg-red-500 border-red-500 shadow-[0_0_0_3px_#fee2e2]'
              : 'border-current'
          }`} />
          Out of Stock
        </button>

        {/* Critical */}
        <button
          onClick={() => handleStatusToggle('critical')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 text-sm font-semibold transition-all duration-150 ${
            selectedStatus === 'critical'
              ? 'border-yellow-400 bg-yellow-100 text-yellow-700'
              : 'border-gray-200 bg-gray-100 text-gray-500 hover:border-yellow-300 hover:text-yellow-600'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${
            selectedStatus === 'critical'
              ? 'bg-yellow-400 border-yellow-400 shadow-[0_0_0_3px_#fef9c3]'
              : 'border-current'
          }`} />
          Critical
        </button>

        {/* Low */}
        <button
          onClick={() => handleStatusToggle('low')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 text-sm font-semibold transition-all duration-150 ${
            selectedStatus === 'low'
              ? 'border-blue-500 bg-blue-100 text-blue-700'
              : 'border-gray-200 bg-gray-100 text-gray-500 hover:border-blue-300 hover:text-blue-500'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${
            selectedStatus === 'low'
              ? 'bg-blue-500 border-blue-500 shadow-[0_0_0_3px_#dbeafe]'
              : 'border-current'
          }`} />
          Low
        </button>
      </div>

      <div>
        <br/>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-orange-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Item ID</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Item Name</th>
              <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Available Quantity</th>
              <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {lowStockItems.length > 0 ? (
              lowStockItems.map(item => (
                <tr
                  key={item.productId}
                  className={`border-b hover:bg-gray-50 ${
                    item.stock === 0 ? 'bg-red-50' : item.stock <= 5 ? 'bg-orange-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono font-semibold">{item.productId}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {getCategoryName(item.categoryId)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${
                      item.stock === 0 ? 'text-red-600' :
                      item.stock <= 5 ? 'text-yellow-400' :
                      'text-blue-500'
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
                      <span className="bg-yellow-400 text-white px-2 py-1 rounded text-xs font-semibold">
                        CRITICAL
                      </span>
                    ) : (
                      <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        LOW
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  No items match the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200">
        <p className="text-sm text-orange-800">
          <span className="font-semibold">💡 Tip:</span> Please restock these items soon to avoid stockouts.
          {(selectedCategory || selectedStatus) && ` (Showing ${lowStockItems.length} of ${allLowStockItems.length} low stock items)`}
        </p>
      </div>
    </div>
  );
};

export default LowStockAlert;