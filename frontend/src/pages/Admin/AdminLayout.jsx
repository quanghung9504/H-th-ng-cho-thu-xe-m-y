import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import NotificationDropdown from '../../components/NotificationDropdown';
import { Search, User } from 'lucide-react';

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <AdminSidebar />
      <div style={{ flex: 1, marginLeft: '320px', display: 'flex', flexDirection: 'column' }}>
        {/* Admin Top Header */}
        <header style={{ 
          height: '80px', background: 'white', borderBottom: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 3rem',
          position: 'sticky', top: 0, zIndex: 100
        }}>
          <div className="search-bar" style={{ position: 'relative', width: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm giao dịch, người dùng..." 
              style={{ 
                width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', background: 'var(--bg-primary)',
                border: 'none', borderRadius: 'var(--border-radius-pill)', fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <NotificationDropdown isAdmin={true} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>Admin Manager</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Super Administrator</p>
              </div>
              <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <User size={24} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main style={{ 
            padding: '2rem 3rem 5rem', 
            minHeight: 'calc(100vh - 80px)',
            background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
