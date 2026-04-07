import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="glass-card" style={{ borderRadius: 0, marginTop: '8rem', padding: '5rem 0 2rem', borderTop: '1px solid var(--glass-border)', borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>
      <div className="container">
        <div className="grid-4" style={{ gap: '4rem', marginBottom: '4rem' }}>
          {/* Brand Info */}
          <div style={{ gridColumn: 'span 1' }}>
            <Link to="/" style={{ fontSize: '1.8rem', fontWeight: '900', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <span className="text-gradient">Ride</span>Freedom
            </Link>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '2rem' }}>
              Nền tảng thuê xe máy cao cấp hàng đầu Việt Nam. Mang lại sự tự do và trải nghiệm đỉnh cao trên mọi cung đường.
            </p>
            <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1.2rem' }}>
               <a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.3s' }}><Facebook size={20} /></a>
               <a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.3s' }}><Twitter size={20} /></a>
               <a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.3s' }}><Instagram size={20} /></a>
               <a href="#" style={{ color: 'var(--text-secondary)', transition: 'color 0.3s' }}><Youtube size={20} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>Dịch vụ</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><Link to="/fleet" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Thuê xe máy</Link></li>
              <li><Link to="/marketplace" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Săn cọc giá rẻ</Link></li>
              <li><Link to="/fleet?type=manual" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Xe côn tay</Link></li>
              <li><Link to="/fleet?type=automatic" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Xe tay ga</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>Ride Freedom</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><Link to="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Về chúng tôi</Link></li>
              <li><Link to="/policy" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Chính sách thuê xe</Link></li>
              <li><Link to="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Điều khoản dịch vụ</Link></li>
              <li><Link to="/contact" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>Liên hệ</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>Liên hệ</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <li style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                 <MapPin size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                 <span>123 Đường Neon, Quận 1, TP. Hồ Chí Minh</span>
              </li>
              <li style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                 <Phone size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                 <span>+84 900 123 456</span>
              </li>
              <li style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                 <Mail size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                 <span>support@ridefreedom.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', marginBottom: '2rem' }} />

        <div className="flex-between" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
           <p>© 2026 Ride Freedom. All rights reserved.</p>
           <div className="flex-center" style={{ gap: '2rem' }}>
              <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Chính sách định danh</a>
              <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Bảo mật dữ liệu</a>
           </div>
        </div>
      </div>
    </footer>
  );
}
