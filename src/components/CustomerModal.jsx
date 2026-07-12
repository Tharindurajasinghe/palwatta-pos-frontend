import React from 'react';

// Add / Edit customer form modal
const CustomerModal = ({ show, editMode, formData, setFormData, onSubmit, onClose, saving }) => {
  if (!show) return null;

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {editMode ? `Edit Customer - ${formData.customerId}` : '👥 Add New Customer'}
          </h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800 text-2xl">×</button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Customer Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Address Line 1</label>
            <input
              type="text"
              value={formData.addressLine1}
              onChange={(e) => set('addressLine1', e.target.value)}
              placeholder="e.g. Okkampitiya"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Address Line 2</label>
            <input
              type="text"
              value={formData.addressLine2}
              onChange={(e) => set('addressLine2', e.target.value)}
              placeholder="e.g. Gaminipura"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Telephone No * (unique)</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="07XXXXXXXX"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Credit Limit (Rs.) *</label>
            <input
              type="number"
              value={formData.creditLimit}
              onChange={(e) => set('creditLimit', e.target.value)}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Customer's total pending balance can never go above this amount.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400 font-semibold"
            >
              {saving ? 'Saving...' : (editMode ? 'Update Customer' : 'Add Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;