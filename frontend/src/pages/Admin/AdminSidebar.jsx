import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Users, Bike, Layers, 
  ShoppingCart, Tag, PieChart, LogOut, Hexagon, ShieldCheck, Wallet, User as UserIcon
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Người dùng', path: '/admin/users' },
  { icon: ShieldCheck, label: 'Duyệt KYC', path: '/admin/kyc' },
  { icon: Layers, label: 'Danh mục', path: '/admin/categories' },
  { icon: Bike, label: 'Đội xe', path: '/admin/vehicles' },
  { icon: ShoppingCart, label: 'Đơn hàng', path: '/admin/orders' },
  { icon: Wallet, label: 'Giao dịch', path: '/admin/transactions' },
  { icon: Tag, label: 'Săn cọc', path: '/admin/marketplace' },
  { icon: PieChart, label: 'Thống kê', path: '/admin/stats' },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <div className="glass-card" style={{ 
      width: '280px', 
      height: 'calc(100vh - 40px)', 
      margin: '20px', 
      position: 'fixed',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 1rem',
      zIndex: 100
    }}>
      <div className="flex-center" style={{ gap: '1rem', marginBottom: '3rem', justifyContent: 'flex-start', paddingLeft: '1rem' }}>
        <div style={{ padding: '8px', background: 'var(--accent-primary)', borderRadius: '12px' }}>
          <Hexagon color="white" fill="white" size={24} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }} className="text-gradient">Admin Panel</h2>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              style={{ textDecoration: 'none' }}
            >
              <motion.div
                whileHover={{ x: 10 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: 'var(--border-radius-sm)',
                  background: isActive ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  borderLeft: isActive ? '4px solid var(--accent-primary)' : '4px solid transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                <item.icon size={20} />
                <span style={{ fontWeight: isActive ? '600' : '400' }}>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <Link to="/profile" style={{ textDecoration: 'none', marginTop: 'auto', marginBottom: '0.5rem' }}>
        <div className="flex-center" style={{ 
          gap: '1rem', 
          padding: '1rem', 
          color: 'var(--text-primary)',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 'var(--border-radius-sm)',
          justifyContent: 'flex-start'
        }}>
          <UserIcon size={20} />
          <span>Hồ sơ cá nhân</span>
        </div>
      </Link>

      <Link to="/" style={{ textDecoration: 'none' }}>
        <div className="flex-center" style={{ 
          gap: '1rem', 
          padding: '1rem', 
          color: 'var(--error)',
          justifyContent: 'flex-start'
        }}>
          <LogOut size={20} />
          <span>Thoát Admin</span>
        </div>
      </Link>
    </div>
  );
}
