import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Navbar from './components/Navbar';
import SellingScreen from './components/SellingScreen';
import StoreManagement from './components/StoreManagement';
import Summary from './components/Summary';
import CheckBill from './components/CheckBill';
import DayEndSummary from './components/DayEndSummary';
import api from './services/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeScreen, setActiveScreen] = useState('selling');
  const [dayEndData, setDayEndData] = useState(null);
  const [pendingScreen, setPendingScreen] = useState(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('jagathStoreLoggedIn');
    if (loggedIn === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('jagathStoreLoggedIn', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('jagathStoreLoggedIn');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setActiveScreen('selling');
  };

  const handleEndDay = (data) => {
    setDayEndData(data);
    setActiveScreen('dayend');
  };

  // Called by Navbar on every nav click
  const handleScreenChange = (screen) => {
    if (screen === 'store' || screen === 'summary') {
      setPendingScreen(screen);
      setPassword('');
      setPasswordError('');
    } else {
      setActiveScreen(screen);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordLoading(true);
    try {
      const response = await api.verifyPagePassword({ password });
      if (response.data.success) {
        setActiveScreen(pendingScreen);
        setPendingScreen(null);
        setPassword('');
      }
    } catch {
      setPasswordError('Incorrect password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelPassword = () => {
    setPendingScreen(null);
    setPassword('');
    setPasswordError('');
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar
        activeScreen={activeScreen}
        setActiveScreen={handleScreenChange}
        onLogout={handleLogout}
      />
      <div className="container mx-auto px-4 py-6">
        {activeScreen === 'selling' && <SellingScreen onEndDay={handleEndDay} />}
        {activeScreen === 'store' && <StoreManagement />}
        {activeScreen === 'summary' && <Summary />}
        {activeScreen === 'checkbill' && <CheckBill />}
        {activeScreen === 'dayend' && <DayEndSummary data={dayEndData} onLogout={handleLogout} />}
      </div>

      {/* Password modal for Store and Summary */}
      {pendingScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Enter Password</h2>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 mb-2 text-gray-800"
              />
              {passwordError && (
                <p className="text-red-600 text-sm mb-2">{passwordError}</p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleCancelPassword}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {passwordLoading ? 'Checking...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
