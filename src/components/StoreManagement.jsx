import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import AddProduct from './AddProduct';
import UpdateProduct from './UpdateProduct';

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


const StoreManagement = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [nextId, setNextId] = useState('');
  const searchTimeoutRef = useRef(null);

  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    stock: '',
    buyingPrice: '',
    sellingPrice: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.getProducts();
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim() === '') {
      setFilteredProducts(products);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(value.toLowerCase()) ||
        product.productId.includes(value)
      );
      setFilteredProducts(filtered);
    }, 300);
  };

  const handleAddProduct = async () => {
    try {
      const response = await api.getNextProductId();
      setNextId(response.data.productId);
      setFormData({
        productId: response.data.productId,
        name: '',
        stock: '',
        buyingPrice: '',
        sellingPrice: ''
      });
      setShowAddModal(true);
    } catch (error) {
      alert('Error getting next product ID');
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.stock || !formData.buyingPrice || !formData.sellingPrice) {
      alert('Please fill all fields');
      return;
    }

    try {
      await api.addProduct({
        productId: formData.productId,
        name: formData.name,
        stock: parseInt(formData.stock),
        buyingPrice: parseFloat(formData.buyingPrice),
        sellingPrice: parseFloat(formData.sellingPrice)
      });

      alert('Product added successfully!');
      setShowAddModal(false);
      loadProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding product');
    }
  };

  const handleUpdateClick = (product) => {
    setSelectedProduct(product);
    setFormData({
      productId: product.productId,
      name: product.name,
      stock: product.stock,
      buyingPrice: product.buyingPrice,
      sellingPrice: product.sellingPrice
    });
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();

    try {
      await api.updateProduct(formData.productId, {
        name: formData.name,
        stock: parseInt(formData.stock),
        buyingPrice: parseFloat(formData.buyingPrice),
        sellingPrice: parseFloat(formData.sellingPrice)
      });

      alert('Product updated successfully!');
      setShowUpdateModal(false);
      loadProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating product');
    }
  };

  const handleDelete = async (productId) => {
    const confirm = window.confirm('Are you sure you want to delete this product?');
    if (!confirm) return;

    try {
      await api.deleteProduct(productId);
      alert('Product deleted successfully!');
      loadProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting product');
    }
  };

 
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Store Management</h2>
        <button
          onClick={handleAddProduct}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-semibold"
        >
          + Add New Product
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search Item by ID or Name..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Item ID</th>
              <th className="px-4 py-3 text-left">Item Name</th>
              <th className="px-4 py-3 text-left">In Stock</th>
              <th className="px-4 py-3 text-left">Buying Price</th>
              <th className="px-4 py-3 text-left">Selling Price</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.productId} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">{product.productId}</td>
                <td className="px-4 py-3">{product.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded ${
                    product.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3">Rs. {product.buyingPrice.toFixed(2)}</td>
                <td className="px-4 py-3 font-semibold">Rs. {product.sellingPrice.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateClick(product)}
                      className="text-blue-600 hover:underline"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDelete(product.productId)}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No products found
          </div>
        )}
      </div>

      <AddProduct
         showAddModal={showAddModal}
         setShowAddModal={setShowAddModal}
         formData={formData}
         setFormData={setFormData}
         handleSubmitAdd={handleSubmitAdd}
      />

      <UpdateProduct
        showUpdateModal={showUpdateModal}
        setShowUpdateModal={setShowUpdateModal}
        formData={formData}
        setFormData={setFormData}
        handleSubmitUpdate={handleSubmitUpdate}
      />
      
    </div>
  );
};

export default StoreManagement;