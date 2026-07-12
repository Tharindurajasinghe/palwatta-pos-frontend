import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingOverlay from './LoadingOverlay';
import CustomerModal from './CustomerModal';
import RecordPaymentModal from './RecordPaymentModal';
import { getBillHTML } from './BillView';

const EMPTY_FORM = {
  customerId: '',
  name: '',
  addressLine1: '',
  addressLine2: '',
  phone: '',
  creditLimit: ''
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [detail, setDetail] = useState(null);      // selected customer + totalBills
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState('bills');

  const [loadingMessage, setLoadingMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoadingMessage('Loading...');
      try {
        await loadCustomers();
      } finally {
        setLoadingMessage(null);
      }
    };
    init();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await api.getCustomers();
      setCustomers(res.data);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const loadDetail = async (customerId) => {
    try {
      const [cRes, bRes, pRes] = await Promise.all([
        api.getCustomer(customerId),
        api.getCustomerBills(customerId),
        api.getCustomerPayments(customerId)
      ]);
      setDetail(cRes.data);
      setBills(bRes.data);
      setPayments(pRes.data);
    } catch (err) {
      alert('Error loading customer details');
    }
  };

  const handleSelect = async (customerId) => {
    setLoadingMessage('Loading customer...');
    try {
      await loadDetail(customerId);
      setTab('bills');
    } finally {
      setLoadingMessage(null);
    }
  };

  const handleAddClick = () => {
    setEditMode(false);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const handleEditClick = () => {
    if (!detail) return;
    setEditMode(true);
    setFormData({
      customerId: detail.customerId,
      name: detail.name,
      addressLine1: detail.addressLine1 || '',
      addressLine2: detail.addressLine2 || '',
      phone: detail.phone,
      creditLimit: detail.creditLimit
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editMode) {
        await api.updateCustomer(formData.customerId, {
          name: formData.name,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          phone: formData.phone,
          creditLimit: formData.creditLimit
        });
        alert('Customer updated successfully!');
        await loadCustomers();
        await loadDetail(formData.customerId);
      } else {
        const res = await api.addCustomer({
          name: formData.name,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          phone: formData.phone,
          creditLimit: formData.creditLimit
        });
        alert('Customer added successfully!');
        await loadCustomers();
        await loadDetail(res.data.customerId);
      }
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving customer');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!detail) return;
    const ok = window.confirm(`Are you sure you want to remove ${detail.name}?`);
    if (!ok) return;

    setLoadingMessage('Removing customer...');
    try {
      await api.deleteCustomer(detail.customerId);
      alert('Customer removed successfully');
      setDetail(null);
      setBills([]);
      setPayments([]);
      await loadCustomers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing customer');
    } finally {
      setLoadingMessage(null);
    }
  };

  const handlePaymentSaved = async () => {
    if (!detail) return;
    setLoadingMessage('Updating...');
    try {
      await loadCustomers();
      await loadDetail(detail.customerId);
      setTab('payments');
    } finally {
      setLoadingMessage(null);
    }
  };

  const viewBill = (bill) => {
    const w = window.open('', '', 'width=400,height=600');
    w.document.write(getBillHTML(bill));
    w.document.close();
  };

  const formatDateTime = (value, time) => {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    const str = d.toLocaleDateString('en-GB');
    return time ? `${str} | ${time}` : str;
  };

  const filtered = customers.filter(c => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.customerId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid grid-cols-4 gap-6 items-start">
      {loadingMessage && <LoadingOverlay message={loadingMessage} />}

      {/* LEFT — customer list */}
      <div className="col-span-1 bg-white p-5 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">👥 Customers</h2>
          <button
            onClick={handleAddClick}
            className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm font-semibold"
          >
            + Add Customer
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, phone or ID..."
          className="w-full px-4 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">No customers found</p>
          ) : (
            filtered.map(c => (
              <div
                key={c.customerId}
                onClick={() => handleSelect(c.customerId)}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  detail && detail.customerId === c.customerId
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center gap-2">
                  <div>
                    <p className="font-bold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.customerId} · {c.phone}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                    c.pendingBalance > 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    Due: Rs. {c.pendingBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT — customer detail */}
      <div className="col-span-3 bg-white p-6 rounded-lg shadow min-h-[70vh]">
        {!detail ? (
          <div className="text-center py-32 text-gray-400">
            <p>Select a customer to view details</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">{detail.name}</h2>
                <p className="text-sm text-gray-500">{detail.customerId} · {detail.phone}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEditClick}
                  className="px-4 py-2 border rounded hover:bg-gray-100 font-semibold text-gray-700"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={handleRemove}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 border rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Pending Balance</p>
                <p className="text-2xl font-bold text-red-600">Rs. {detail.pendingBalance.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 border rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Status</p>
                {detail.pendingBalance > 0 ? (
                  <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">Has Due</span>
                ) : (
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Settled</span>
                )}
              </div>
              <div className="bg-gray-50 border rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Credit Limit</p>
                <p className="text-2xl font-bold text-gray-800">Rs. {detail.creditLimit.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 border rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Total Bills</p>
                <p className="text-2xl font-bold text-gray-800">{detail.totalBills}</p>
              </div>
            </div>

            {/* Address */}
            {(detail.addressLine1 || detail.addressLine2) && (
              <p className="text-gray-600 mb-4">
                📍 {[detail.addressLine1, detail.addressLine2].filter(Boolean).join(' · ')}
              </p>
            )}

            {/* Record payment */}
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={detail.pendingBalance <= 0}
              className="mb-6 bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 font-semibold"
            >
              💰 Record Payment
            </button>

            {/* Tabs */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setTab('bills')}
                className={`px-5 py-2 rounded font-semibold ${
                  tab === 'bills' ? 'bg-green-600 text-white' : 'border text-gray-700 hover:bg-gray-100'
                }`}
              >
                Bill History
              </button>
              <button
                onClick={() => setTab('payments')}
                className={`px-5 py-2 rounded font-semibold ${
                  tab === 'payments' ? 'bg-green-600 text-white' : 'border text-gray-700 hover:bg-gray-100'
                }`}
              >
                Payment History
              </button>
            </div>

            {/* Bill history */}
            {tab === 'bills' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Bill No</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.length === 0 ? (
                      <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">No bills yet</td></tr>
                    ) : bills.map(bill => (
                      <tr key={bill.billId} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold">BILL-{bill.billId}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDateTime(bill.date, bill.time)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-700">
                          Rs. {bill.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          {bill.paymentStatus === 'pending' ? (
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                              Pending{bill.paidAmount > 0 ? ` (Rs. ${bill.paidAmount.toFixed(2)} paid)` : ''}
                            </span>
                          ) : (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Paid</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => viewBill(bill)} className="text-blue-600 hover:underline">
                            View Bill
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Payment history */}
            {tab === 'payments' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-left">Note</th>
                      <th className="px-4 py-3 text-left">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">No payments yet</td></tr>
                    ) : payments.map(p => (
                      <tr key={p._id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">{formatDateTime(p.paymentDate)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-600">
                          Rs. {p.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{p.note ? p.note : '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{p.recordedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <CustomerModal
        show={showForm}
        editMode={editMode}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onClose={() => setShowForm(false)}
        saving={saving}
      />

      <RecordPaymentModal
        show={showPaymentModal}
        customer={detail}
        onClose={() => setShowPaymentModal(false)}
        onSaved={handlePaymentSaved}
      />
    </div>
  );
};

export default Customers;