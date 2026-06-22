import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BottomBar from './BottomBar';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        marginLeft: sidebarOpen ? 240 : 0,
        transition: 'margin-left 0.3s ease',
      }}>
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main style={{
          flex: 1,
          padding: '1.5rem',
          paddingBottom: '5rem',
        }}>
          {children}
        </main>
      </div>

      <BottomBar />
    </div>
  );
}

export default Layout;