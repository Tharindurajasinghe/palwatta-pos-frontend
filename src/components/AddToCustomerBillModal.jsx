import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

// Opened from the cart area on the billing page
const AddToCustomerBillModal = ({ show, billTotal, onConfirm, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (show) {
      setQuery('');
      setResults([]);
      setSelected(null);
      loadInitial();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [show]);

  const loadInitial = async () => {
    try {
      const res = await api.searchCustomers('');
      setResults(res.data);
    } catch {
      setResults([]);
    }
  };

  const handleSearch = (value) => {
    setQuery(value);
    setSelected(null);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.searchCustomers(value);
        setResults(res.data);
      } catch {
        setResults([]);
      }
    }, 300);
  };

  const handleSelect = (customer) => {
    setSelected(customer);
    setQuery(customer.name);
    setResults([]);
  };

  const handleConfirm = async () => {
    if (!selected) {
      alert('Please select a customer');
      return;
    }
    setSaving(true);
    try {
      await onConfirm(selected);
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  const pending = selected ? selected.pendingBalance : 0;
  const limit = selected ? selected.creditLimit : 0;
  const balanceAfter = pending + billTotal;
  const overLimit = selected && balanceAfter > limit;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">👥 Add to Customer Bill</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">×</button>
        </div>

        <div className="p-6">
          {/* Bill amount */}
          <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
            <span className="text-gray-600">Bill Amount</span>
            <span className="text-2xl font-bold text-green-600">Rs. {billTotal.toFixed(2)}</span>
          </div>

          {/* Search */}
          <div className="mb-4 relative">
            <label className="block text-gray-700 mb-2 font-semibold">Search Customer</label>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, phone or ID..."
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            {results.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-52 overflow-y-auto">
                {results.map(c => (
                  <div
                    key={c.customerId}
                    onClick={() => handleSelect(c)}
                    className="p-3 cursor-pointer border-b hover:bg-green-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.customerId} · {c.phone}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        c.pendingBalance > 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        Due: Rs. {c.pendingBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected customer summary */}
          {selected && (
            <div className={`p-4 rounded-lg border mb-2 ${overLimit ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Customer</span>
                <span className="font-bold">{selected.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Current Pending</span>
                <span className="font-semibold text-red-600">Rs. {pending.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Credit Limit</span>
                <span className="font-semibold">Rs. {limit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">This Bill</span>
                <span className="font-semibold">Rs. {billTotal.toFixed(2)}</span>
              </div>
              <div className="border-t border-dashed mt-2 pt-2 flex justify-between">
                <span className="text-gray-700 font-semibold">Balance After Bill</span>
                <span className={`font-bold ${overLimit ? 'text-red-600' : 'text-green-600'}`}>
                  Rs. {balanceAfter.toFixed(2)}
                </span>
              </div>

              {overLimit && (
                <p className="text-sm text-red-700 font-semibold mt-3">
                  ⚠ Credit limit exceeded. This bill cannot be added to {selected.name}.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded hover:bg-gray-100 font-semibold text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected || overLimit || saving}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 font-semibold"
          >
            {saving ? 'Adding...' : '✅ Add to Customer Bill'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToCustomerBillModal;