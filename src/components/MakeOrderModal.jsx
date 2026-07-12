import React, { useState, useEffect, useRef } from 'react';

const todayYMD = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const MakeOrderModal = ({ show, orderTotal, onConfirm, onClose }) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    if (show) {
      setCustomerName('');
      setPhone('');
      setDeliveryDate('');
      setDeliveryTime('');
      setMessage('');
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [show]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) { alert('Please enter the customer name'); return; }
    if (!phone.trim())        { alert('Please enter the telephone number'); return; }
    if (!deliveryDate)        { alert('Please select a delivery date'); return; }

    setSaving(true);
    try {
      await onConfirm({
        customerName: customerName.trim(),
        phone: phone.trim(),
        deliveryDate,
        deliveryTime,
        message: message.trim()
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">📦 Make as Order</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-5 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex justify-between items-center">
            <span className="text-gray-600">Order Amount</span>
            <span className="text-2xl font-bold text-indigo-600">Rs. {orderTotal.toFixed(2)}</span>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-semibold">Customer Name *</label>
            <input
              ref={nameRef}
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-semibold">Telephone No *</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXXXXXXX"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Delivery Date *</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={todayYMD()}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">Delivery Time</label>
              <input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold">Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="3"
              placeholder="e.g. Deliver to the front gate"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 mb-4">
            ℹ️ No bill is created and stock is not reduced yet. Both happen when you complete the order in the Orders page.
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
              className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 font-semibold"
            >
              {saving ? 'Saving...' : '📦 Make as Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MakeOrderModal;