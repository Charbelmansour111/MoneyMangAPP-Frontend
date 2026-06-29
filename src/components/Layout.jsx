import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BottomBar from './BottomBar';
import { getBudgets, getTransactions, getSavings } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [budgets, setBudgets]         = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [savings, setSavings]         = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    getBudgets().then(setBudgets).catch(() => {});
    getTransactions().then(setTransactions).catch(() => {});
    getSavings().then(setSavings).catch(() => {});
  }, []);

  const notifications = useNotifications(budgets, transactions, savings);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', marginLeft: sidebarOpen ? 240 : 0, transition: 'margin-left 0.3s ease' }}>
        <Navbar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          notifications={notifications}
        />
        <main style={{ flex: 1, padding: '1.5rem', paddingBottom: '5rem' }}>
          {children}
        </main>
      </div>

      <BottomBar />
    </div>
  );
}

export default Layout;