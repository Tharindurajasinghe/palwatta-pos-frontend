import React, { useState, useEffect } from 'react';
import api from '../services/api';

const todayYMD = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const RecordPaymentModal = ({ show, customer, onClose, onSaved }) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayYMD());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (show) {
      setAmount('');
      setNote('');
      setPaymentDate(todayYMD());
    }
  }, [show]);

  if (!show || !customer) return null;

  const pending = customer.pendingBalance || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }
    if (amt > pending + 0.001) {
      alert(`Payment cannot be more than the pending balance (Rs. ${pending.toFixed(2)})`);
      return;
    }

    setSaving(true);
    try {
      await api.recordCustomerPayment(customer.customerId, {
        amount: amt,
        note,
        paymentDate
      });
      alert('Payment recorded successfully!');
      onSaved();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">💰 Record Payment — {customer.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-sm text-gray-600">Total Pending Balance</p>
            <p className="text-2xl font-bold text-red-600">Rs. {pending.toFixed(2)}</p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-semibold">Payment Amount (Rs.)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="0.01"
                step="0.01"
                autoFocus
                className="flex-1 px-4 py-2 border-2 border-green-500 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setAmount(pending.toFixed(2))}
                className="px-4 py-2 border rounded hover:bg-gray-100 font-semibold text-gray-700"
              >
                Pay Full
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-semibold">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Cash payment"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              max={todayYMD()}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded hover:bg-gray-100 font-semibold text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 font-semibold"
            >
              {saving ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentModal;