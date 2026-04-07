import { useState } from 'react';
import api from '../../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [step, setStep] = useState(1); // 1: Form, 2: OTP
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      toast.success('OTP đã gửi về email!');
      setStep(2);
    } catch (err) {
      toast.error(err);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/verify-otp', { email: formData.email, otp });
      toast.success('Xác minh thành công! Đã tạo tài khoản.', { duration: 4000 });
      // Wait a bit so the user can see the message
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <div className="container flex-center" style={{ flex: 1, padding: '2rem 0' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px' }}>
        {step === 1 ? (
          <>
            <h2 style={{ marginBottom: '0.5rem' }}>Bắt đầu <span className="text-gradient">hành trình</span></h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Tạo tài khoản mới để trải nghiệm dịch vụ.</p>

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input 
                  className="form-input" 
                  value={formData.fullName} 
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input 
                  className="form-input" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Tiếp tục</button>
            </form>
          </>
        ) : (
          <>
            <h2 style={{ marginBottom: '0.5rem' }}>Xác minh <span className="text-gradient">Email</span></h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Nhập mã OTP 6 số đã gửi tới {formData.email}</p>

            <form onSubmit={handleVerify}>
              <div className="form-group">
                <input 
                  className="form-input" 
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }}
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>Xác minh</button>
              <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setStep(1)}>Quay lại</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
