import React, { useState, useEffect, useRef } from 'react';
import { getBillHTML } from '../components/BillView';
import api from '../services/api';
import UptoNowBox from './UptoNowBox';
import LowStockAlert from './LowStockAlert';
import LoadingOverlay from '../components/LoadingOverlay';


const SellingScreen = ({ onEndDay }) => {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [todayBills, setTodayBills] = useState([]);
  const [showBills, setShowBills] = useState(false);
  const [currentSales, setCurrentSales] = useState({ total: 0, profit: 0 });
  const [cash, setCash] = useState('');
  const [change, setChange] = useState(0);

  // loading state: null = no overlay, string = show overlay with that message
  const [loadingMessage, setLoadingMessage] = useState(null);

  const searchTimeoutRef = useRef(null);
  const quantityInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const cashInputRef = useRef(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [productIndex, setProductIndex] = useState({});
  const [pageReady, setPageReady] = useState(false);

  // On mount: load products and day summary together, show overlay until both done
  useEffect(() => {
    const initialLoad = async () => {
      setLoadingMessage('Loading...');
      try {
        await Promise.all([loadProducts(), loadCurrentDaySummary()]);
      } finally {
        setLoadingMessage(null);
        setPageReady(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    };
    initialLoad();
  }, []);

  // Global keydown: Ctrl to print/save, Right Shift to focus cash
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.ctrlKey && !e.shiftKey && !e.altKey && cart.length > 0) {
        e.preventDefault();
        handlePrintSave();
      }
      // Right Shift focuses Cash input
      if (e.code === 'ShiftRight') {
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

  const loadCurrentDaySummary = async () => {
    try {
      const response = await api.getCurrentDaySummary();
      setCurrentSales({ total: response.data.totalSales, profit: response.data.totalProfit });
    } catch (error) {
      console.error('Error loading day summary:', error);
    }
  };

  const addByProductIdLocal = (value) => {
    const id = value.padStart(3, '0');
    const product = productIndex[id];
    if (!product) { alert('Product ID not found'); return; }
    addToCart(product);
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
      setCart([...cart, { ...product, quantity, customPrice: product.sellingPrice }]);
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

  const updateCustomPrice = (productId, priceStr) => {
    setCart(cart.map(item =>
      item.productId === productId ? { ...item, customPrice: priceStr } : item
    ));
  };

  const removeFromCart = (productId) => { setCart(cart.filter(item => item.productId !== productId)); };

  const getTotal = () => cart.reduce((sum, item) => {
    const price = parseFloat(item.customPrice);
    const effectivePrice = (!isNaN(price) && price > 0) ? price : item.sellingPrice;
    return sum + (effectivePrice * item.quantity);
  }, 0);

  const printBill = (bill) => {
    const printWindow = window.open('', '', 'width=400,height=600');
    printWindow.document.write(getBillHTML(bill));
    printWindow.document.close();
  };

  const validatePrices = () => {
    for (const item of cart) {
      const price = parseFloat(item.customPrice);
      if (isNaN(price) || price <= 0) {
        alert(`Invalid price for "${item.name}". Please enter a valid price.`);
        return false;
      }
      if (price < item.buyingPrice) {
        alert(`Price for "${item.name}" (Rs. ${price.toFixed(2)}) cannot be less than buying price (Rs. ${item.buyingPrice.toFixed(2)}).`);
        return false;
      }
    }
    return true;
  };

  const buildBillItems = () => cart.map(item => {
    const price = parseFloat(item.customPrice);
    return {
      productId: item.productId,
      quantity: item.quantity,
      customPrice: (!isNaN(price) && price > 0) ? price : item.sellingPrice
    };
  });

  // Shared save logic used by both save paths
  const saveBill = async (cashNum) => {
    const total = getTotal();
    const newChange = cashNum >= total ? cashNum - total : 0;
    setChange(newChange);
    const billData = {
      items: buildBillItems(),
      cash: cashNum,
      change: newChange
    };
    const response = await api.createBill(billData);
    return { response, newChange };
  };

  const handlePrintSave = async () => {
    if (cart.length === 0) { alert('Cart is empty!'); return; }
    if (!validatePrices()) return;

    const printConfirm = window.confirm('Do you want to print the bill?\n\nYes - Print and Save\nNo - Save Only');

    setLoadingMessage('Saving bill...');
    try {
      const cashNum = parseFloat(cash) || 0;
      const { response } = await saveBill(cashNum);
      if (printConfirm) printBill(response.data);
      alert('Bill saved successfully!');
      setCart([]); setCash(''); setChange(0);
      await loadCurrentDaySummary();
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving bill');
    } finally {
      setLoadingMessage(null);
    }
  };

  const handleCashEnterSave = async () => {
    if (cart.length === 0) return;
    if (!validatePrices()) return;

    const cashNum = parseFloat(cash) || 0;
    setLoadingMessage('Saving bill...');
    try {
      await saveBill(cashNum);
      alert('Bill saved successfully!');
      setCart([]); setCash(''); setChange(0);
      await loadCurrentDaySummary();
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving bill');
    } finally {
      setLoadingMessage(null);
    }
  };

  const handleCheckUpToNow = async () => {
    setLoadingMessage('Loading bills...');
    try {
      const response = await api.getTodayBills();
      setTodayBills(response.data);
      setShowBills(true);
    } catch {
      alert('Error loading bills');
    } finally {
      setLoadingMessage(null);
    }
  };

  const handleEndDay = async () => {
    const confirm = window.confirm('Are you sure you want to end the day?\nThis will create a daily summary and close today\'s sales.');
    if (!confirm) return;
    setLoadingMessage('Creating day-end summary...');
    try {
      const response = await api.getCurrentDaySummary();
      onEndDay({ date: response.data.date, items: response.data.items, totalIncome: response.data.totalSales, totalProfit: response.data.totalProfit, bills: response.data.bills });
    } catch (error) {
      setLoadingMessage(null);
      alert(error.response?.data?.message || 'Error ending day');
    }
  };

  return (
    <div>
      {loadingMessage && <LoadingOverlay message={loadingMessage} />}

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
                // Arrow navigation
                if (e.key === 'ArrowDown' && suggestions.length > 0) {
                  e.preventDefault();
                  setSelectedSuggestionIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                  );
                  return;
                }

                if (e.key === 'ArrowUp' && suggestions.length > 0) {
                  e.preventDefault();
                  setSelectedSuggestionIndex(prev =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                  );
                  return;
                }

                // ENTER key — IMMEDIATE ADD
                if (e.key === 'Enter') {
                  e.preventDefault();

                  // stop pending debounce search
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }

                  // 1. If product ID typed → add from local index (FAST)
                  if (/^\d{1,3}$/.test(searchQuery)) {
                    addByProductIdLocal(searchQuery);
                    return;
                  }

                  // 2. If suggestion selected → add it
                  if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
                    addToCart(suggestions[selectedSuggestionIndex]);
                    return;
                  }

                  // 3. Fallback → first suggestion
                  if (suggestions.length > 0) {
                    addToCart(suggestions[0]);
                  }
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
                        <p className="text-sm text-gray-500">ID: {item.productId} | Original: Rs. {item.sellingPrice.toFixed(2)}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} className="text-red-600 hover:text-red-800">✕</button>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      {/* Quantity input — Enter moves focus to price input */}
                      <input
                        id={`qty-${item.productId}`}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            document.getElementById(`price-${item.productId}`)?.focus();
                          }
                        }}
                        className="w-16 px-2 py-1 border rounded text-center"
                        min="1"
                        title="Quantity"
                      />
                      {/* Editable price input */}
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">Rs.</span>
                        <input
                          id={`price-${item.productId}`}
                          type="number"
                          value={item.customPrice}
                          onChange={(e) => updateCustomPrice(item.productId, e.target.value)}
                          onBlur={(e) => {
                            const price = parseFloat(e.target.value);
                            if (isNaN(price) || price <= 0) {
                              updateCustomPrice(item.productId, item.sellingPrice);
                            } else if (price < item.buyingPrice) {
                              alert(`Price cannot be less than buying price (Rs. ${item.buyingPrice.toFixed(2)})`);
                              updateCustomPrice(item.productId, item.buyingPrice);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              searchInputRef.current?.focus();
                            }
                          }}
                          className={`w-24 px-2 py-1 border rounded text-center font-semibold ${
                            parseFloat(item.customPrice) !== item.sellingPrice
                              ? 'border-orange-400 bg-orange-50 text-orange-700'
                              : 'border-gray-300'
                          }`}
                          min={item.buyingPrice}
                          step="0.01"
                          title="Selling Price (editable)"
                        />
                      </div>
                      {/* Line total uses customPrice */}
                      <p className="font-bold text-green-600 w-20 text-right">
                        Rs. {(() => { const p = parseFloat(item.customPrice); const ep = (!isNaN(p) && p > 0) ? p : item.sellingPrice; return (ep * item.quantity).toFixed(2); })()}
                      </p>
                    </div>
                    {/* Warning when price is modified */}
                    {!isNaN(parseFloat(item.customPrice)) && parseFloat(item.customPrice) !== item.sellingPrice && (
                      <p className="text-xs text-orange-600 mt-1">⚠ Price modified from original Rs. {item.sellingPrice.toFixed(2)}</p>
                    )}
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
                        await handleCashEnterSave();
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

      {/* low stock alert */}
      <div className="mb-6">
        <LowStockAlert />
      </div>

      <UptoNowBox show={showBills} bills={todayBills} onClose={() => setShowBills(false)} />
    </div>
  );
};

export default SellingScreen;