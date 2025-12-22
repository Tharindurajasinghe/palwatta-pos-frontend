import React from 'react';

const Navbar = ({ activeScreen, setActiveScreen, onLogout }) => {
  const navItems = [
    { id: 'selling', label: 'Start Today', icon: '🛒' },
    { id: 'store', label: 'Store', icon: '📦' },
    { id: 'summary', label: 'Summary', icon: '📊' },
    { id: 'checkbill', label: 'Check Bill', icon: '🧾' }
  ];

  return (
    <nav className="bg-green-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-2xl font-bold">Jagath Store</h1>
          
          <div className="flex space-x-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`px-4 py-2 rounded transition ${
                  activeScreen === item.id
                    ? 'bg-green-700'
                    : 'hover:bg-green-500'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;