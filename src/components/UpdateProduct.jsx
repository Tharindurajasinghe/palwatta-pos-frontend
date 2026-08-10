import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ExpireDatePicker from './ExpireDatePicker';

const UpdateProduct = ({ showUpdateModal, setShowUpdateModal, formData, setFormData, handleSubmitUpdate }) => {
  const [categories, setCategories] = useState([]);

  const loadCategories = async () => {
    try {
      const response = await api.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useEffect(() => {
    if (showUpdateModal) {
      loadCategories();
    }
  }, [showUpdateModal]);

  if (!showUpdateModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Update Product - ID: {formData.productId}</h2>
          <button
            onClick={() => setShowUpdateModal(false)}
            className="text-gray-600 hover:text-gray-800 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmitUpdate}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Category *</label>
            <select
              value={formData.categoryId || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">-- Select Category --</option>
              {categories.map(cat => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Barcode (optional)</label>
            <input
              type="text"
              value={formData.barcode || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
              placeholder="Scan or type barcode..."
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>


          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Available Stock *</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              min="0"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Buying Price (Rs.) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.buyingPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, buyingPrice: e.target.value }))}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              min="0"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Selling Price (Rs.) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.sellingPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              min="0"
              required
            />
          </div>

          {/* NEW: Whole Sale Price */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Whole Sale Price (Rs.) (optional)</label>
            <input
              type="number"
              step="0.01"
              value={formData.wholesalePrice || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, wholesalePrice: e.target.value }))}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be higher than the buying price. Leave blank if this product has no whole sale price.
            </p>
          </div>

          {/* ── Expire Dates ── */}
          <div className="mb-6">
            <ExpireDatePicker
              expireDates={formData.expireDates || []}
              onChange={(dates) => setFormData(prev => ({ ...prev, expireDates: dates }))}
            />
          </div>
          {/* NEW: last 5 stock updates */}
          {formData.stockHistory && formData.stockHistory.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-bold text-gray-700 mb-2">
                📋 Recent Stock Updates (last 5)
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {formData.stockHistory.map((h, i) => {
                  const up = h.change > 0;
                  const when = new Date(h.changedAt).toLocaleString('en-GB', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true
                  });
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs bg-gray-50 border rounded px-3 py-2"
                    >
                      <span className="text-gray-600">{when}</span>
                      <span className="text-gray-700">
                        {h.oldStock} → <span className="font-semibold">{h.newStock}</span>
                      </span>
                      <span className={`font-bold ${up ? 'text-green-600' : 'text-red-600'}`}>
                        {up ? '+' : ''}{h.change}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={() => setShowUpdateModal(false)}
              className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Update Product
            </button>
          </div>      
        </form>
      </div>
    </div>
  );
};

export default UpdateProduct;