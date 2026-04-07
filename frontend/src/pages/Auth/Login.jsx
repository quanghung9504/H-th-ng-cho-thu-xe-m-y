import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <div className="container flex-center" style={{ flex: 1, padding: '2rem 0' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Chào mừng <span className="text-gradient">trở lại</span></h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Đăng nhập để tiếp tục thuê xe ngay!</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
            <Link to="/forgot-password" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', textDecoration: 'none' }}>Quên mật khẩu?</Link>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem' }}>
            Đăng nhập
          </button>

          <button type="button" className="btn btn-secondary" style={{ width: '100%', gap: '1rem' }}>
             Đăng nhập với Google
          </button>
        </form>

        <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Chưa có tài khoản? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 'bold' }}>Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
