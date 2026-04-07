import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CreditCard, Wallet, Smartphone, ShieldCheck, 
  ChevronRight, Calendar, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function BookingConfirm() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { vehicle, booking } = state || {};
  const rentalTotal = (state?.booking?.days || 1) * (vehicle?.pricePerDay || 0);
  const depositAmount = vehicle?.depositAmount || 0;
  const total = rentalTotal + depositAmount;

  if (!vehicle) return <div className="container" style={{ paddingTop: '10rem' }}><h2>Dữ liệu không hợp lệ</h2></div>;
  if (authLoading) return <div className="container" style={{ paddingTop: '10rem' }}><h2>Đang tải thông tin...</h2></div>;
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleConfirm = async (method) => {
    if (method === 'WALLET' && user.walletBalance < total) {
       return toast.error('Số dư ví không đủ để thanh toán (Tiền thuê + Cọc)!');
    }

    try {
      await api.post('/orders', {
        vehicleId: vehicle._id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        paymentMethod: method
      });
      toast.success('Đặt xe thành công! Đơn hàng đang chờ duyệt.');
      refreshUser(); // Cập nhật số dư ví trong context ngay lập tức
      navigate('/my-orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const getBikeImage = (v) => {
    if (!v) return 'hero_motorbike_neon_1775322140611.png';
    if (v.images?.[0] && !v.images[0].includes('placeholder')) return v.images[0];
    if (v.name?.includes('Vision')) return 'honda_vision_elegant_white_1775322698498.png';
    if (v.name?.includes('SH')) return 'featured_sh_mode_luxury_1775322188322.png';
    if (v.name?.includes('Exciter')) return 'yamaha_exciter_premium_1775322605719.png';
    if (v.name?.includes('Panigale')) return 'ducati_panigale_red_glory_1775322630660.png';
    return 'hero_motorbike_neon_1775322140611.png';
  };

  return (
    <div className="container" style={{ paddingTop: '5rem', paddingBottom: '8rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-gradient" style={{ fontSize: '3.5rem', fontWeight: '900' }}>Xác nhận đặt đơn</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '1.2rem' }}>Kiểm tra kỹ thông tin hành trình của bạn</p>
         </motion.div>
      </div>

      <div className="grid-2" style={{ gap: '4rem', alignItems: 'start' }}>
        {/* Left: Summary */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ padding: '3.5rem' }}>
           <div className="flex-center" style={{ gap: '2rem', marginBottom: '3.5rem', justifyContent: 'flex-start' }}>
              <img src={getBikeImage(vehicle)} style={{ width: '120px', height: '120px', borderRadius: '16px', objectFit: 'cover' }} />
              <div>
                 <h3>{vehicle.name}</h3>
                 <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem' }}>{vehicle.brand} • {vehicle.licensePlate}</p>
                 <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.4rem', marginTop: '0.8rem', color: 'var(--accent-primary)' }}>
                    <ShieldCheck size={16} /> <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Gói bảo hiểm RideFreedom Standard</span>
                 </div>
              </div>
           </div>

           <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                 <div>
                    <label className="form-label" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Calendar size={14}/> Nhận xe</label>
                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginTop: '0.5rem' }}>{new Date(booking.startDate).toLocaleDateString('vi-VN')}</p>
                 </div>
                 <div>
                    <label className="form-label" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Calendar size={14}/> Trả xe</label>
                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginTop: '0.5rem' }}>{new Date(booking.endDate).toLocaleDateString('vi-VN')}</p>
                 </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                 <div className="flex-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Tiền thuê xe ({state?.booking?.days || 1} ngày)</span>
                    <span style={{ fontWeight: 'bold' }}>{rentalTotal?.toLocaleString()} VNĐ</span>
                 </div>
                 <div className="flex-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Tiền cọc (Hoàn lại khi trả xe)</span>
                    <span style={{ fontWeight: 'bold' }}>{depositAmount?.toLocaleString()} VNĐ</span>
                 </div>
                 <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />
                 <div className="flex-between">
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '1.2rem' }}>TỔNG THANH TOÁN (VÍ)</span>
                    <span style={{ fontWeight: '900', fontSize: '2.5rem', color: 'var(--accent-primary)' }}>{total?.toLocaleString()} VNĐ</span>
                 </div>
              </div>
           </div>
        </motion.div>

        {/* Right: Payment Methods */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="glass-card" style={{ padding: '3.5rem' }}>
           <h3 style={{ marginBottom: '2.5rem' }}>Phương thức thanh toán</h3>
           
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <motion.div 
                 whileHover={{ border: '1px solid var(--accent-primary)', backgroundColor: 'rgba(0, 240, 255, 0.1)' }}
                 onClick={() => user.walletBalance >= total ? handleConfirm('WALLET') : navigate('/wallet')}
                 className="flex-between"
                 style={{ 
                    padding: '2rem', border: '2px solid' + (user.walletBalance < total ? ' #ef4444' : ' var(--glass-border)'), 
                    borderRadius: '24px', cursor: 'pointer', transition: 'all 0.3s',
                    background: user.walletBalance < total ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.02)'
                 }}
              >
                 <div className="flex-center" style={{ gap: '1.5rem' }}>
                    <div style={{ width: '60px', height: '60px', background: user.walletBalance < total ? '#ef4444' : 'var(--accent-gradient)', borderRadius: '16px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} className="flex-center">
                       <Wallet color="white" size={28} />
                    </div>
                    <div>
                       <p style={{ fontWeight: '900', fontSize: '1.2rem', color: '#1e293b' }}>Ví Ride Freedom</p>
                       <p style={{ fontSize: '0.9rem', color: user.walletBalance < total ? '#ef4444' : 'var(--text-muted)', fontWeight: '500' }}>
                          {user.walletBalance < total ? 'Số dư không đủ (' + user.walletBalance.toLocaleString() + 'đ)' : 'Thanh toán an toàn - Xử lý ngay'}
                       </p>
                    </div>
                 </div>
                 {user.walletBalance < total ? (
                    <button className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem', borderRadius: '12px' }}>Nạp ngay</button>
                 ) : (
                    <div style={{ background: '#f1f5f9', padding: '0.8rem', borderRadius: '50%' }}>
                       <ChevronRight size={24} color="#64748b" />
                    </div>
                 )}
              </motion.div>
           </div>

           {user.walletBalance < total && (
              <div style={{ marginTop: '2rem', padding: '1.2rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '16px', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                 <AlertCircle size={20} color="#ef4444" />
                 <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: '500' }}>
                    Bạn cần nạp thêm ít nhất <strong>{(total - user.walletBalance).toLocaleString()}đ</strong> để thanh toán qua Ví.
                 </p>
              </div>
           )}

           <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--glass-border)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                 Bằng việc xác nhận thanh toán, bạn đồng ý với <span style={{ color: 'var(--accent-primary)' }}>Chính sách thuê xe</span> của Ride Freedom.
              </p>
           </div>
        </motion.div>
      </div>
    </div>
  );
}
