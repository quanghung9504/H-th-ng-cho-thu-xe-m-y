import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  User as UserIcon, Shield, Lock, CreditCard, 
  CheckCircle2, AlertCircle, Camera, ChevronRight, 
  UserCheck, Smartphone, Mail, MapPin, Save, Send, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // KYC States
  const [kycFiles, setKycFiles] = useState({
    cccdFront: null,
    drivingLicense: null
  });
  const [kycPreviews, setKycPreviews] = useState({
    cccdFront: user?.identity?.cccdFront || null,
    drivingLicense: user?.identity?.drivingLicense || null
  });
  const [kycLoading, setKycLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || ''
      }));
      setAvatarPreview(user.avatar || null);
      setKycPreviews({
        cccdFront: user.identity?.cccdFront || null,
        drivingLicense: user.identity?.drivingLicense || null
      });
    }

    // Lắng nghe thông báo Real-time để cập nhật trạng thái KYC tự động
    const handleNotifUpdate = async (e) => {
      if (e.detail?.title?.includes('xác thực AI') || e.detail?.title?.includes('KYC')) {
         try {
           const res = await api.get('/users/profile');
           setUser(res.user);
         } catch (err) {
           console.error('Failed to sync profile after auto-KYC', err);
         }
      }
    };

    window.addEventListener('new-notif-received', handleNotifUpdate);
    return () => window.removeEventListener('new-notif-received', handleNotifUpdate);
  }, [user, setUser]);

  const handleKycFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setKycFiles(prev => ({ ...prev, [type]: file }));
      setKycPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
    }
  };

  const handleVerifyIdentity = async () => {
    if (!kycFiles.cccdFront || !kycFiles.drivingLicense) {
      return toast.error('Vui lòng chọn đầy đủ 2 ảnh!');
    }

    try {
      setKycLoading(true);
      const formDataKyc = new FormData();
      formDataKyc.append('cccdFront', kycFiles.cccdFront);
      formDataKyc.append('drivingLicense', kycFiles.drivingLicense);

      const res = await api.post('/users/verify-identity', formDataKyc);
      setUser(res.user);
      toast.success('Hồ sơ xác minh đã được gửi!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi hồ sơ thất bại');
    } finally {
      setKycLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
       setAvatarFile(file);
       setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async (type) => {
    try {
      setLoading(true);
      if (type === 'password' && formData.newPassword !== formData.confirmPassword) {
         return toast.error('Mật khẩu mới không khớp!');
      }
      
      const endpoint = type === 'password' ? '/users/change-password' : '/users/profile';
      
      let payload;
      if (type === 'info') {
         payload = new FormData();
         if (formData.fullName) payload.append('fullName', formData.fullName);
         if (formData.phone) payload.append('phone', formData.phone);
         if (avatarFile) payload.append('avatar', avatarFile);
      } else {
         payload = formData;
      }

      const res = await api.put(endpoint, payload);
      setUser(res.user);
      setAvatarFile(null);
      toast.success('Cập nhật thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const getKYCBadge = (status) => {
     const badges = {
        UNVERIFIED: { color: 'var(--danger)', label: 'Chưa xác thực', icon: <AlertCircle size={14}/> },
        PENDING: { color: 'var(--warning)', label: 'Chờ xét duyệt', icon: <Smartphone size={14}/> },
        VERIFIED: { color: 'var(--success)', label: 'Đã xác thực', icon: <CheckCircle2 size={14}/> },
        REJECTED: { color: 'var(--danger)', label: 'Đã bị từ chối', icon: <AlertCircle size={14}/> },
     };
     const s = badges[status] || badges.UNVERIFIED;
     return (
        <span className="badge" style={{ background: `rgba(${s.color === 'var(--success)' ? '0,230,118' : '255,23,68'}, 0.05)`, color: s.color, display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'fit-content' }}>
           {s.icon} {s.label}
        </span>
     );
  };

  return (
    <div className="container" style={{ paddingTop: '5rem', paddingBottom: '8rem' }}>
      <div className="grid-4" style={{ gap: '4rem', alignItems: 'start' }}>
        {/* Sidebar Nav */}
        <div style={{ gridColumn: 'span 1' }}>
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ padding: '2.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                 <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
                    <div style={{ width: '100px', height: '100px', background: 'var(--accent-gradient)', borderRadius: '50%', border: '4px solid var(--bg-secondary)', overflow: 'hidden' }} className="flex-center">
                       {avatarPreview && typeof avatarPreview === 'string' && !avatarPreview.includes('default-avatar') ? (
                          <img src={avatarPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" />
                       ) : (
                          <UserIcon size={48} color="white" />
                       )}
                    </div>
                    <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', padding: '0.4rem', borderRadius: '50%', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex' }}>
                       <Camera size={16} />
                       <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                    </label>
                 </div>
                 <h3 style={{ marginBottom: '0.4rem' }}>{user?.fullName}</h3>
                 <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Thành viên từ {new Date(user?.createdAt).getFullYear()}</p>
                 <div className="flex-center" style={{ marginTop: '1rem', justifyContent: 'center' }}>
                    {getKYCBadge(user?.identity?.verifyStatus)}
                 </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 {[
                   { id: 'info', icon: <UserIcon size={18}/>, label: 'Thông tin cá nhân' },
                   { id: 'kyc', icon: <UserCheck size={18}/>, label: 'Xác minh danh tính' },
                   { id: 'security', icon: <Lock size={18}/>, label: 'Bảo mật & Mật khẩu' },
                   { id: 'wallet', icon: <CreditCard size={18}/>, label: 'Ví & Thanh toán', link: '/wallet' }
                 ].map(t => (
                    t.link ? (
                       <Link key={t.id} to={t.link} style={{ textDecoration: 'none' }}>
                          <div className="flex-between" style={{ padding: '1rem 1.5rem', borderRadius: '14px', color: 'var(--text-secondary)', transition: '0.3s' }}>
                             <div className="flex-center" style={{ gap: '1rem' }}>{t.icon} {t.label}</div>
                             <ChevronRight size={16} />
                          </div>
                       </Link>
                    ) : (
                       <button 
                         key={t.id}
                         onClick={() => setActiveTab(t.id)}
                         className="flex-between" 
                         style={{ 
                            width: '100%', border: 'none', background: activeTab === t.id ? 'rgba(255,255,255,0.03)' : 'transparent', 
                            padding: '1rem 1.5rem', borderRadius: '14px', color: activeTab === t.id ? 'var(--accent-primary)' : 'var(--text-secondary)', 
                            cursor: 'pointer', transition: '0.3s' 
                         }}
                       >
                          <div className="flex-center" style={{ gap: '1rem' }}>{t.icon} {t.label}</div>
                          <ChevronRight size={16} style={{ opacity: activeTab === t.id ? 1 : 0 }} />
                       </button>
                    )
                 ))}
              </div>
           </motion.div>
        </div>

        {/* Main Content Pane */}
        <div style={{ gridColumn: 'span 3' }}>
           <AnimatePresence mode="wait">
              {activeTab === 'info' && (
                 <motion.div key="info" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="glass-card" style={{ padding: '4rem' }}>
                    <h2 style={{ marginBottom: '3rem' }}>Thông tin hồ sơ</h2>
                    <div className="grid-2" style={{ gap: '2rem' }}>
                       <div className="form-group">
                          <label className="form-label">Họ và tên</label>
                          <input type="text" className="form-input" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                       </div>
                       <div className="form-group">
                          <label className="form-label">Số điện thoại</label>
                          <input type="text" className="form-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                       </div>
                       <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label className="form-label">Địa chỉ Email</label>
                          <input type="email" className="form-input" value={formData.email} disabled style={{ opacity: 0.6 }} />
                       </div>
                    </div>
                    <button 
                      onClick={() => handleUpdate('info')} 
                      className="btn btn-primary" 
                      style={{ marginTop: '3rem', padding: '1.2rem 3rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }} 
                      disabled={loading}
                    >
                       <Save size={18} /> {loading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                    </button>
                 </motion.div>
              )}

              {activeTab === 'kyc' && (
                 <motion.div key="kyc" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="glass-card" style={{ padding: '4rem' }}>
                    <div className="flex-between" style={{ marginBottom: '3.5rem' }}>
                       <h2>Định danh <span className="text-gradient">KYC</span></h2>
                       {getKYCBadge(user?.identity?.verifyStatus)}
                    </div>
                    
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--glass-border)', marginBottom: '4rem' }}>
                       <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                          <Shield size={20} color="var(--accent-primary)" /> Bảo mật tuyệt đối
                       </h3>
                       <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.8' }}>
                          Dữ liệu của bạn được mã hóa và chỉ sử dụng cho mục đích xác thực thuê xe. 
                          Chúng tôi cam kết không chia sẻ thông tin cá nhân với bên thứ ba dưới bất kỳ hình thức nào.
                       </p>
                    </div>

                    <div className="grid-2" style={{ gap: '2.5rem' }}>
                       <div>
                          <p style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>1. Ảnh căn cước công dân (Mặt trước)</p>
                          <label style={{ 
                            height: '200px', border: '2px dashed var(--glass-border)', borderRadius: '20px', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            overflow: 'hidden', position: 'relative'
                          }}>
                             {kycPreviews.cccdFront ? (
                               <img src={kycPreviews.cccdFront} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                             ) : (
                               <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                  <Camera size={32} style={{ marginBottom: '0.8rem', opacity: 0.5 }} />
                                  <p style={{ fontSize: '0.8rem' }}>Tải lên ảnh mặt trước</p>
                               </div>
                             )}
                             <input type="file" accept="image/*" onChange={(e) => handleKycFileChange(e, 'cccdFront')} style={{ display: 'none' }} disabled={user?.identity?.verifyStatus === 'PENDING' || user?.identity?.verifyStatus === 'VERIFIED'} />
                          </label>
                       </div>
                       <div>
                          <p style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>2. Ảnh giấy phép lái xe (GPLX)</p>
                          <label style={{ 
                            height: '200px', border: '2px dashed var(--glass-border)', borderRadius: '20px', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            overflow: 'hidden', position: 'relative'
                          }}>
                             {kycPreviews.drivingLicense ? (
                               <img src={kycPreviews.drivingLicense} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                             ) : (
                               <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                  <Camera size={32} style={{ marginBottom: '0.8rem', opacity: 0.5 }} />
                                  <p style={{ fontSize: '0.8rem' }}>Tải lên ảnh bằng lái xe</p>
                               </div>
                             )}
                             <input type="file" accept="image/*" onChange={(e) => handleKycFileChange(e, 'drivingLicense')} style={{ display: 'none' }} disabled={user?.identity?.verifyStatus === 'PENDING' || user?.identity?.verifyStatus === 'VERIFIED'} />
                          </label>
                       </div>
                    </div>

                    <button 
                      onClick={handleVerifyIdentity}
                      className="btn btn-primary" 
                      style={{ marginTop: '4rem', padding: '1.2rem 3rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }} 
                      disabled={kycLoading || user?.identity?.verifyStatus === 'PENDING' || user?.identity?.verifyStatus === 'VERIFIED'}
                    >
                       {user?.identity?.verifyStatus === 'VERIFIED' ? <><CheckCircle2 size={18} /> Đã hoàn tất xác minh</> : 
                        user?.identity?.verifyStatus === 'PENDING' ? <><History size={18} /> Đang chờ xét duyệt</> :
                        <><Send size={18} /> {kycLoading ? 'Đang gửi...' : 'Gửi hồ sơ xét duyệt'}</>}
                    </button>
                 </motion.div>
              )}

              {activeTab === 'security' && (
                 <motion.div key="security" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="glass-card" style={{ padding: '4rem' }}>
                    <h2 style={{ marginBottom: '3.5rem' }}>Bảo vệ mật khẩu</h2>
                    <div style={{ maxWidth: '600px' }}>
                       <div className="form-group">
                          <label className="form-label">Mật khẩu hiện tại</label>
                          <input type="password" name="oldPassword" className="form-input" onChange={(e) => setFormData({...formData, oldPassword: e.target.value})} />
                       </div>
                       <div className="form-group">
                          <label className="form-label">Mật khẩu mới</label>
                          <input type="password" name="newPassword" className="form-input" onChange={(e) => setFormData({...formData, newPassword: e.target.value})} />
                       </div>
                       <div className="form-group">
                          <label className="form-label">Xác nhận mật khẩu mới</label>
                          <input type="password" name="confirmPassword" className="form-input" onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
                       </div>
                       
                       <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                          <Lock size={18} color="var(--warning)" style={{ flexShrink: 0 }} />
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
                       </div>

                       <button onClick={() => handleUpdate('password')} className="btn btn-primary" style={{ marginTop: '3.5rem', padding: '1.2rem 3.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }} disabled={loading}>
                          <Lock size={18} /> Cập nhật mật khẩu
                       </button>
                    </div>
                 </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
