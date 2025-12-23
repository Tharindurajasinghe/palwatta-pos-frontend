import React, { useState, useEffect, useRef } from 'react';
import { getBillHTML } from '../components/BillView';
import api from '../services/api';

const SellingScreen = ({ onEndDay }) => {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [todayBills, setTodayBills] = useState([]);
  const [showBills, setShowBills] = useState(false);
  const [currentSales, setCurrentSales] = useState({ total: 0, profit: 0 });
  const searchTimeoutRef = useRef(null);
  const quantityInputRef = useRef(null);  // ← ADD THIS
  const searchInputRef = useRef(null); 

  useEffect(() => {
    loadCurrentDaySummary();
  }, []);

  useEffect(() => {
  const handleGlobalKeyDown = (e) => {
    // Ctrl key to save/print bill
    if (e.ctrlKey && !e.shiftKey && !e.altKey && cart.length > 0) {
      e.preventDefault();
      handlePrintSave();
    }
  };

  window.addEventListener('keydown', handleGlobalKeyDown);
  
  return () => {
    window.removeEventListener('keydown', handleGlobalKeyDown);
  };
}, [cart]);

  const loadCurrentDaySummary = async () => {
    try {
        console.log('Loading current day summary...');
      const response = await api.getCurrentDaySummary();
       console.log('Response:', response.data);
      setCurrentSales({
        total: response.data.totalSales,
        profit: response.data.totalProfit
      });
    } catch (error) {
      console.error('Error loading day summary:', error);
    }
  };

  const handleSearch = async (value) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        if (/^\d{1,3}$/.test(value)) {
          const response = await api.getProduct(value.padStart(3, '0'));
          if (response.data) {
            setSuggestions([response.data]);
            return;
          }
        }
        
        const response = await api.searchProducts(value);
        setSuggestions(response.data);
      } catch (error) {
        setSuggestions([]);
      }
    }, 300);
  };

  const addToCart = (product, quantity = 1) => {
    const existing = cart.find(item => item.productId === product.productId);
    
    if (existing) {
      if (existing.quantity + quantity > product.stock) {
        alert(`Insufficient stock! Available: ${product.stock}`);
        return;
      }
      setCart(cart.map(item =>
        item.productId === product.productId
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      if (quantity > product.stock) {
        alert(`Insufficient stock! Available: ${product.stock}`);
        return;
      }
      setCart([...cart, { ...product, quantity }]);
    }
    
    setSearchQuery('');
    setSuggestions([]);

    setTimeout(() => {
    const qtyInput = document.getElementById(`qty-${product.productId}`);
    if (qtyInput) {
      qtyInput.focus();
      qtyInput.select();  // Also select the text so user can type immediately
    }
  }, 100);
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
      return;
    }

    const product = cart.find(item => item.productId === productId);
    if (product && quantity > product.stock) {
      alert(`Insufficient stock! Available: ${product.stock}`);
      return;
    }

    setCart(cart.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  };

  const printBill = (bill) => {
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(getBillHTML(bill));
    printWindow.document.close();
  };

  const handlePrintSave = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const printConfirm = window.confirm(
      'Do you want to print the bill?\n\nYes - Print and Save\nNo - Save Only'
    );

    try {
      const billData = {
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      const response = await api.createBill(billData);
      
      if (printConfirm) {
        printBill(response.data);
      }

      alert('Bill saved successfully!');
      setCart([]);
      loadCurrentDaySummary();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving bill');
    }
  };

  const handleCheckUpToNow = async () => {
    try {
      const response = await api.getTodayBills();
      setTodayBills(response.data);
      setShowBills(true);
    } catch (error) {
      alert('Error loading bills');
    }
  };

  const handleEndDay = async () => {
    const confirm = window.confirm(
      'Are you sure you want to end the day?\nThis will create a daily summary and close today\'s sales.'
    );
    
    if (!confirm) return;

    try {
      const response = await api.endDay();
      onEndDay(response.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Error ending day');
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Add Items to Bill</h2>
          
          <div className="relative mb-4">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by Product ID or Name..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => {  
                    if (e.key === 'Enter' && suggestions.length > 0) {
                    e.preventDefault();
                    addToCart(suggestions[0]);
                    quantityInputRef.current?.focus();
                     }
                  }}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map(product => (
                  <div
                    key={product.productId}
                    onClick={() => addToCart(product)}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          ID: {product.productId} | Stock: {product.stock}
                        </p>
                      </div>
                      <p className="font-bold text-green-600">
                        Rs. {product.sellingPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4 p-4 bg-blue-50 rounded">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Up to Now Sell:</span>
              <span className="text-blue-600 font-bold">Rs. {currentSales.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Profit:</span>
              <span className="text-green-600 font-bold">Rs. {currentSales.profit.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCheckUpToNow}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Check Up to Now Sell
            </button>
            <button
              onClick={handleEndDay}
              className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
            >
              End Sell Today
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Current Bill</h2>
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}
            </p>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No items in cart</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.productId} className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          ID: {item.productId} | Rs. {item.sellingPrice.toFixed(2)} each
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <input
                        id={`qty-${item.productId}`}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                        onKeyDown={(e) => {  // ← ADD THIS ENTIRE BLOCK
                                if (e.key === 'Enter') {
                                e.preventDefault();
                                searchInputRef.current?.focus();
                               }
                         }}
                        className="w-20 px-2 py-1 border rounded text-center"
                        min="1"
                      />
                      <p className="font-bold text-green-600">
                        Rs. {(item.sellingPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xl font-bold">Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    Rs. {getTotal().toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={handlePrintSave}
                  className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 font-semibold"
                >
                  Print Bill / Save Bill
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showBills && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Today's Bills</h2>
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Bill ID</th>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {todayBills.map(bill => (
                  <tr key={bill.billId} className="border-b">
                    <td className="px-4 py-2">{bill.billId}</td>
                    <td className="px-4 py-2">{bill.time}</td>
                    <td className="px-4 py-2 text-right font-semibold">
                      Rs. {bill.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => setShowBills(false)}
              className="mt-4 w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellingScreen;