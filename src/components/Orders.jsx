import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingOverlay from './LoadingOverlay';
import { getOrderHTML } from './OrderView';
import { getBillHTML } from './BillView';
import { daysUntil, orderColor } from './OrderAlert';

const STYLES = {
  red:    'border-l-4 border-red-500 bg-red-50',
  yellow: 'border-l-4 border-yellow-400 bg-yellow-50',
  green:  'border-l-4 border-green-500 bg-green-50'
};

const BADGES = {
  red:    'bg-red-600 text-white',
  yellow: 'bg-yellow-400 text-white',
  green:  'bg-green-600 text-white'
};

const labelFor = (ymd) => {
  const d = daysUntil(ymd);
  if (d < 0)   return `${Math.abs(d)} day(s) OVERDUE`;
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

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('pending');
  const [loadingMessage, setLoadingMessage] = useState(null);

  useEffect(() => {
    const init = async () => {
      setLoadingMessage('Loading orders...');
      try {
        await loadOrders();
      } finally {
        setLoadingMessage(null);
      }
    };
    init();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await api.getOrders();
      setOrders(res.data);
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const printOrder = (order) => {
    const w = window.open('', '', 'width=400,height=600');
    w.document.write(getOrderHTML(order));
    w.document.close();
  };

  const handleComplete = async (order) => {
    const ok = window.confirm(
      `Complete order ${order.orderId} for ${order.customerName}?\n\n` +
      `This will create a bill (Rs. ${order.totalAmount.toFixed(2)}) and reduce the stock.`
    );
    if (!ok) return;

    const cashInput = window.prompt(
      `Cash received (Rs.)\n\nOrder total: Rs. ${order.totalAmount.toFixed(2)}\nLeave as is for exact payment.`,
      order.totalAmount.toFixed(2)
    );
    if (cashInput === null) return;   // cancelled

    const cash = parseFloat(cashInput);
    if (isNaN(cash) || cash < order.totalAmount) {
      alert(`Cash must be at least Rs. ${order.totalAmount.toFixed(2)}`);
      return;
    }

    setLoadingMessage('Completing order...');
    try {
      const res = await api.completeOrder(order.orderId, { cash });
      const bill = res.data.bill;

      alert(
        `Order completed!\n\nBill #${bill.billId} created.\n` +
        `Cash: Rs. ${bill.cash.toFixed(2)}\nChange: Rs. ${bill.change.toFixed(2)}`
      );

      const printConfirm = window.confirm('Do you want to print the bill?');
      if (printConfirm) {
        const w = window.open('', '', 'width=400,height=600');
        w.document.write(getBillHTML(bill));
        w.document.close();
      }

      await loadOrders();
      setTab('completed');
    } catch (err) {
      alert(err.response?.data?.message || 'Error completing order');
    } finally {
      setLoadingMessage(null);
    }
  };

  const handleRemove = async (order) => {
    const ok = window.confirm(`Are you sure you want to remove order ${order.orderId}?`);
    if (!ok) return;

    setLoadingMessage('Removing order...');
    try {
      await api.deleteOrder(order.orderId);
      alert('Order removed successfully');
      await loadOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing order');
    } finally {
      setLoadingMessage(null);
    }
  };

  const pending   = orders.filter(o => o.status === 'pending');
  const completed = orders.filter(o => o.status === 'completed');
  const list      = tab === 'pending' ? pending : completed;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {loadingMessage && <LoadingOverlay message={loadingMessage} />}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📦 Orders</h2>
        <p className="text-sm text-gray-500">
          Completed orders are removed automatically 1 day after completion.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setTab('pending')}
          className={`px-6 py-2 rounded font-semibold ${
            tab === 'pending' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pending ({pending.length})
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`px-6 py-2 rounded font-semibold ${
            tab === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Completed ({completed.length})
        </button>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>{tab === 'pending' ? 'No pending orders' : 'No completed orders'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(order => {
            const color = orderColor(order.deliveryDate);
            const isPending = order.status === 'pending';
            return (
              <div
                key={order.orderId}
                className={`rounded-lg p-5 ${isPending ? STYLES[color] : 'border-l-4 border-gray-300 bg-gray-50'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-gray-700">{order.orderId}</span>
                      {isPending ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${BADGES[color]}`}>
                          {labelFor(order.deliveryDate)}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-600 text-white">
                          COMPLETED · Bill #{order.billId}
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-bold">{order.customerName}</p>
                    <p className="text-sm text-gray-600">📞 {order.phone}</p>
                    <p className="text-sm text-gray-600">
                      🚚 {formatYMD(order.deliveryDate)}
                      {order.deliveryTime && ` at ${order.deliveryTime}`}
                    </p>
                    {order.message && (
                      <p className="text-sm text-gray-600 mt-1">📝 {order.message}</p>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    Rs. {order.totalAmount.toFixed(2)}
                  </p>
                </div>

                {/* Items */}
                <div className="bg-white rounded border mb-3">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Item</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-2">
                            {item.name}
                            <span className="text-xs text-gray-500"> ({item.productId})</span>
                          </td>
                          <td className="px-3 py-2 text-center">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">Rs. {item.price.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-semibold">Rs. {item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => printOrder(order)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold"
                  >
                    🖨 Print Order
                  </button>

                  {isPending && (
                    <button
                      onClick={() => handleComplete(order)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
                    >
                      ✅ Complete Order
                    </button>
                  )}

                  <button
                    onClick={() => handleRemove(order)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;