import React from 'react';

const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-2xl"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const AddProduct = ({
  showAddModal,
  setShowAddModal,
  formData,
  setFormData,
  handleSubmitAdd
}) => {
  return (
    <Modal
      show={showAddModal}
      onClose={() => setShowAddModal(false)}
      title="Add New Product"
    >
      <form onSubmit={handleSubmitAdd}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Product ID</label>
          <input
            type="text"
            value={formData.productId}
            readOnly
            className="w-full px-4 py-2 border rounded bg-gray-100"
          />
          <p className="text-sm text-gray-600 mt-1">
            Auto-generated (001-999)
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Product Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData(prev => ({ ...prev, name: e.target.value }))
            }
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Available Stock *</label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) =>
              setFormData(prev => ({ ...prev, stock: e.target.value }))
            }
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
            onChange={(e) =>
              setFormData(prev => ({ ...prev, buyingPrice: e.target.value }))
            }
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            min="0"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Selling Price (Rs.) *</label>
          <input
            type="number"
            step="0.01"
            value={formData.sellingPrice}
            onChange={(e) =>
              setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))
            }
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            min="0"
            required
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(false)}
            className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Add Product
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProduct;
