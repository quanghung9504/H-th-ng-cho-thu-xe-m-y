import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Mật khẩu xác nhận không khớp');
    }

    try {
      setLoading(true);
      await api.put(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      toast.success('Đổi mật khẩu thành công!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '80vh', padding: '2rem' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card" 
        style={{ width: '100%', maxWidth: '450px', padding: '3rem' }}
      >
        {success ? (
          <div className="text-center">
            <div className="flex-center" style={{ marginBottom: '1.5rem' }}>
              <CheckCircle size={64} color="var(--success)" />
            </div>
            <h2 className="text-gradient">Thành công!</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
              Mật khẩu của bạn đã được cập nhật. Hệ thống sẽ tự động chuyển hướng về trang đăng nhập sau vài giây.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ width: '100%' }}>
              Đăng nhập ngay
            </button>
          </div>
        ) : (
          <>
            <div className="text-center" style={{ marginBottom: '2.5rem' }}>
              <h2 className="text-gradient">Đặt lại mật khẩu</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Vui lòng nhập mật khẩu mới cho tài khoản của bạn</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Mật khẩu mới</label>
                <div className="glass-card flex-center" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)' }}>
                  <Lock size={18} color="var(--text-secondary)" />
                  <input 
                    type="password" 
                    className="form-input" 
                    style={{ border: 'none', marginBottom: 0 }}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <label className="form-label">Xác nhận mật khẩu mới</label>
                <div className="glass-card flex-center" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)' }}>
                  <Lock size={18} color="var(--text-secondary)" />
                  <input 
                    type="password" 
                    className="form-input" 
                    style={{ border: 'none', marginBottom: 0 }}
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
                {loading ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
              </button>
            </form>
          </>
        )}

        <button 
          className="flex-center" 
          style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-secondary)', marginTop: '2rem', gap: '0.5rem' }}
          onClick={() => navigate('/login')}
        >
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </button>
      </motion.div>
    </div>
  );
}
