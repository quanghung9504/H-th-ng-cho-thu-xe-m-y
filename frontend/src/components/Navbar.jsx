import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Wallet, ShoppingBag, LayoutDashboard, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="glass-card" style={{ 
       position: 'sticky', top: 0, zIndex: 1000, 
       borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none',
       padding: '1rem 0', backdropFilter: 'blur(20px)', background: 'rgba(255, 255, 255, 0.8)'
    }}>
      <div className="container flex-between">
        <Link to="/" style={{ fontSize: '1.8rem', fontWeight: '900', textDecoration: 'none', color: 'var(--text-primary)', letterSpacing: '-1.5px' }}>
          <span className="text-gradient">Ride</span>Freedom
        </Link>

        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
          <Link 
            to="/" 
            style={{ 
              color: isActive('/') ? 'var(--accent-primary)' : 'var(--text-secondary)', 
              textDecoration: 'none', fontWeight: '600', transition: 'all 0.3s' 
            }}
          >
            Trang chủ
          </Link>
          <Link 
            to="/fleet" 
            style={{ 
              color: isActive('/fleet') ? 'var(--accent-primary)' : 'var(--text-secondary)', 
              textDecoration: 'none', fontWeight: '600', transition: 'all 0.3s' 
            }}
          >
            Thuê xe
          </Link>
          <Link 
            to="/marketplace" 
            style={{ 
              color: isActive('/marketplace') ? 'var(--accent-primary)' : 'var(--text-secondary)', 
              textDecoration: 'none', fontWeight: '600', transition: 'all 0.3s' 
            }}
          >
            Săn Cọc
          </Link>
          
          {user ? (
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginLeft: '1rem', paddingLeft: '1.5rem', borderLeft: '1px solid var(--glass-border)' }}>
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                  <LayoutDashboard size={16} /> Admin
                </Link>
              )}
              
              <Link to="/wallet" className="flex-center" style={{ gap: '0.6rem', textDecoration: 'none', color: 'white', background: 'var(--accent-primary)', padding: '0.5rem 1.2rem', borderRadius: 'var(--border-radius-pill)', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
                <Wallet size={18} /> {(user?.walletBalance ?? 0).toLocaleString()}đ
              </Link>

              <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                <NotificationDropdown />
                <Link to="/profile" title="Hồ sơ" style={{ color: isActive('/profile') ? 'var(--accent-primary)' : 'var(--text-primary)', transition: '0.3s' }}><UserIcon size={22} /></Link>
                <Link to="/my-orders" title="Đơn hàng" style={{ color: isActive('/my-orders') ? 'var(--accent-primary)' : 'var(--text-primary)', transition: '0.3s' }}><ShoppingBag size={22} /></Link>
                <button 
                  onClick={handleLogout} 
                  title="Đăng xuất"
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.7, transition: '0.3s' }}
                  onMouseEnter={(e) => e.target.style.opacity = 1}
                  onMouseLeave={(e) => e.target.style.opacity = 0.7}
                >
                  <LogOut size={22} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', marginLeft: '1rem' }}>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.6rem 1.5rem' }}>Đăng nhập</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Đăng ký</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
