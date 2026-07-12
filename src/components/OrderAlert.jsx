import React, { useState, useEffect } from 'react';
import api from '../services/api';

// Days from today until the delivery date (0 = today, 1 = tomorrow, negative = overdue)
export const daysUntil = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

// RED    → today / tomorrow / overdue   (<= 1 day)
// YELLOW → within 3 days                (2 – 3 days)
// GREEN  → 4 days or more
export const orderColor = (ymd) => {
  const d = daysUntil(ymd);
  if (d <= 1) return 'red';
  if (d <= 3) return 'yellow';
  return 'green';
};

const STYLES = {
  red:    { row: 'bg-red-50',    badge: 'bg-red-600 text-white',      text: 'text-red-700' },
  yellow: { row: 'bg-yellow-50', badge: 'bg-yellow-400 text-white',   text: 'text-yellow-700' },
  green:  { row: 'bg-green-50',  badge: 'bg-green-600 text-white',    text: 'text-green-700' }
};

const labelFor = (ymd) => {
  const d = daysUntil(ymd);
  if (d < 0)  return `${Math.abs(d)} day(s) OVERDUE`;
  if (d === 0) return 'TODAY';
  if (d === 1) return 'TOMORROW';
  return `IN ${d} DAYS`;
};

const formatYMD = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

const OrderAlert = ({ refreshKey }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 60000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  const loadOrders = async () => {
    try {
      const res = await api.getPendingOrders();
      // sort by delivery date (soonest first)
      const sorted = [...res.data].sort((a, b) => {
        if (a.deliveryDate !== b.deliveryDate) return a.deliveryDate.localeCompare(b.deliveryDate);
        return (a.deliveryTime || '').localeCompare(b.deliveryTime || '');
      });
      setOrders(sorted);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-500">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📦</span>
          <h2 className="text-xl font-bold text-green-600">No Pending Orders</h2>
        </div>
        <p className="text-gray-600 text-sm">All orders are completed.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📦</span>
          <h2 className="text-xl font-bold text-indigo-600">Order Alerts</h2>
        </div>
        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-left">Deliver</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const color = orderColor(order.deliveryDate);
              const s = STYLES[color];
              return (
                <tr key={order.orderId} className={`border-b ${s.row}`}>
                  <td className="px-3 py-2 font-mono font-semibold">{order.orderId}</td>
                  <td className="px-3 py-2">
                    <p className="font-semibold">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.phone}</p>
                  </td>
                  <td className={`px-3 py-2 font-semibold ${s.text}`}>
                    {formatYMD(order.deliveryDate)}
                    {order.deliveryTime && <span className="block text-xs">{order.deliveryTime}</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    Rs. {order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${s.badge}`}>
                      {labelFor(order.deliveryDate)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-indigo-50 rounded border border-indigo-200 text-xs text-indigo-800">
        🔴 Today / Tomorrow &nbsp;·&nbsp; 🟡 Within 3 days &nbsp;·&nbsp; 🟢 4+ days away
      </div>
    </div>
  );
};

export default OrderAlert;