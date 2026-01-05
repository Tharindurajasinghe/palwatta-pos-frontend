import React, { useState, useEffect, useRef } from 'react';
import { getBillHTML } from '../components/BillView';
import api from '../services/api';
import UptoNowBox from './UptoNowBox';

const SellingScreen = ({ onEndDay }) => {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [todayBills, setTodayBills] = useState([]);
  const [showBills, setShowBills] = useState(false);
  const [currentSales, setCurrentSales] = useState({ total: 0, profit: 0 });
  const [cash, setCash] = useState('');
  const [change, setChange] = useState(0);
  const searchTimeoutRef = useRef(null);
  const quantityInputRef = useRef(null);
  const searchInputRef = useRef(null); 
  const cashInputRef = useRef(null); 
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [productIndex, setProductIndex] = useState({});

  useEffect(() => { loadCurrentDaySummary(); }, []);

  // Load all products once
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.getProducts();
        const index = {};
        res.data.forEach(p => { index[p.productId] = p; });
        setProductIndex(index);
      } catch {
        alert('Products failed to load');
      }
    };
    loadProducts();
  }, []);

  // Global keydown: Ctrl to print/save, Right Shift to focus cash
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.ctrlKey && !e.shiftKey && !e.altKey && cart.length > 0) {
        e.preventDefault();
        handlePrintSave();
      }
      // Right Shift focuses Cash input
      if (e.code === 'ShiftRight'){
        e.preventDefault();
        cashInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [cart]);

  useEffect(() => {
    if (selectedSuggestionIndex >= 0) {
      const element = document.querySelector(`[data-suggestion-index="${selectedSuggestionIndex}"]`);
      element?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedSuggestionIndex]);

  // Live calculate change whenever cash or cart changes
  useEffect(() => {
    const cashNum = parseFloat(cash) || 0;
    const total = getTotal();
    setChange(cashNum >= total ? cashNum - total : 0);
  }, [cash, cart]);

  const addByProductIdLocal = (value) => {
    const id = value.padStart(3, '0');
    const product = productIndex[id];
    if (!product) { alert('Product ID not found'); return; }
    addToCart(product);
  };

  const loadCurrentDaySummary = async () => {
    try {
      const response = await api.getCurrentDaySummary();
      setCurrentSales({ total: response.data.totalSales, profit: response.data.totalProfit });
    } catch (error) {
      console.error('Error loading day summary:', error);
    }
  };

  const handleSearch = async (value) => {
    setSearchQuery(value);
    setSelectedSuggestionIndex(-1);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.trim() === '') { setSuggestions([]); return; }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        if (/^\d{1,3}$/.test(value)) {
          const response = await api.getProduct(value.padStart(3, '0'));
          if (response.data) { setSuggestions([response.data]); return; }
        }
        const response = await api.searchProducts(value);
        setSuggestions(response.data);
      } catch { setSuggestions([]); }
    }, 300);
  };

  const addToCart = (product, quantity = 1) => {
    const existing = cart.find(item => item.productId === product.productId);
    if (existing) {
      if (existing.quantity + quantity > product.stock) { alert(`Insufficient stock! Available: ${product.stock}`); return; }
      setCart(cart.map(item => item.productId === product.productId ? { ...item, quantity: item.quantity + quantity } : item));
    } else {
      if (quantity > product.stock) { alert(`Insufficient stock! Available: ${product.stock}`); return; }
      setCart([...cart, { ...product, quantity }]);
    }
    setSearchQuery(''); setSuggestions([]);
    setTimeout(() => {
      const qtyInput = document.getElementById(`qty-${product.productId}`);
      qtyInput?.focus(); qtyInput?.select();
    }, 100);
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) { setCart(cart.filter(item => item.productId !== productId)); return; }
    const product = cart.find(item => item.productId === productId);
    if (product && quantity > product.stock) { alert(`Insufficient stock! Available: ${product.stock}`); return; }
    setCart(cart.map(item => item.productId === productId ? { ...item, quantity } : item));
  };

  const removeFromCart = (productId) => { setCart(cart.filter(item => item.productId !== productId)); };
  const getTotal = () => cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);

  const printBill = (bill) => {
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(getBillHTML(bill));
    printWindow.document.close();
  };

  const handlePrintSave = async () => {
    if (cart.length === 0) { alert('Cart is empty!'); return; }
    const printConfirm = window.confirm('Do you want to print the bill?\n\nYes - Print and Save\nNo - Save Only');

    try {
      const billData = {
        items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
        cash: parseFloat(cash) || 0,
        change: change
      };
      const response = await api.createBill(billData);
      if (printConfirm) printBill(response.data);

      alert('Bill saved successfully!');
      setCart([]); setCash(''); setChange(0);
      loadCurrentDaySummary();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving bill');
    }
  };

  const handleCheckUpToNow = async () => {
    try { const response = await api.getTodayBills(); setTodayBills(response.data); setShowBills(true); }
    catch { alert('Error loading bills'); }
  };

  const handleEndDay = async () => {
    const confirm = window.confirm('Are you sure you want to end the day?\nThis will create a daily summary and close today\'s sales.');
    if (!confirm) return;
    try {
      const response = await api.getCurrentDaySummary();
      onEndDay({ date: response.data.date, items: response.data.items, totalIncome: response.data.totalSales, totalProfit: response.data.totalProfit, bills: response.data.bills });
    } catch { alert('Error ending day'); }
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
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (/^\d{1,3}$/.test(searchQuery)) { addByProductIdLocal(searchQuery); return; }
                  if (suggestions.length > 0) { const index = selectedSuggestionIndex >= 0 ? selectedSuggestionIndex : 0; addToCart(suggestions[index]); }
                }
              }}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((product, index) => (
                  <div
                    key={product.productId}
                    data-suggestion-index={index}
                    onClick={() => addToCart(product)}
                    className={`p-3 cursor-pointer border-b ${index === selectedSuggestionIndex ? 'bg-green-100' : 'hover:bg-gray-100'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-gray-600">ID: {product.productId} | Stock: {product.stock}</p>
                      </div>
                      <p className="font-bold text-green-600">Rs. {product.sellingPrice.toFixed(2)}</p>
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
          </div>

          <div className="flex gap-2">
            <button onClick={handleCheckUpToNow} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Check Up to Now Sell</button>
            <button onClick={handleEndDay} className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700">End Sell Today</button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Current Bill</h2>
            <p className="text-sm text-gray-600">{new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}</p>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><p>No items in cart</p></div>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.productId} className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-600">ID: {item.productId} | Rs. {item.sellingPrice.toFixed(2)} each</p>
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} className="text-red-600 hover:text-red-800">✕</button>
                    </div>
                    <div className="flex justify-between items-center">
                      <input
                        id={`qty-${item.productId}`}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchInputRef.current?.focus(); } }}
                        className="w-20 px-2 py-1 border rounded text-center"
                        min="1"
                      />
                      <p className="font-bold text-green-600">Rs. {(item.sellingPrice * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cash & Change Section */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold">Cash:</p>
                  <input
                    ref={cashInputRef}
                    type="number"
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                        onKeyDown={async (e) => {
                               if (e.key === 'Enter') {
                                 e.preventDefault();
                                // Make sure change is updated
                                const cashNum = parseFloat(cash) || 0;
                                const total = getTotal();
                                const newChange = cashNum >= total ? cashNum - total : 0;
                                setChange(newChange);

                               // Automatically save cash and change to backend
                              if (cart.length > 0) {
                                    try {
                                const billData = {
                              items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
                               cash: cashNum,
                              change: newChange
                              };
                             const response = await api.createBill(billData);
                             alert('Bill saved successfully!');
                             setCart([]);
                             setCash('');
                             setChange(0);
                             loadCurrentDaySummary();
                             } catch (err) {
                             alert(err.response?.data?.message || 'Error saving bill');
                             }
                           }
                          }
                       }}

                    className="w-32 px-2 py-1 border rounded text-right"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold text-blue-600">Change:</p>
                  <p className="text-lg font-bold text-blue-600">Rs. {change.toFixed(2)}</p>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <p className="text-xl font-bold">Total</p>
                  <p className="text-2xl font-bold text-green-600">Rs. {getTotal().toFixed(2)}</p>
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

      <UptoNowBox show={showBills} bills={todayBills} onClose={() => setShowBills(false)} />
    </div>
  );
};

export default SellingScreen;
