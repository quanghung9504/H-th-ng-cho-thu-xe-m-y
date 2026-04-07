import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  Star, Calendar, ShieldCheck, Zap, Fuel, Activity, 
  ChevronRight, Info, CheckCircle2, MapPin, Share2, 
  Heart, Image as ImageIcon, MessageCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [booking, setBooking] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vRes, rRes] = await Promise.all([
          api.get(`/fleet/vehicles/${id}`),
          api.get(`/reviews/vehicle/${id}`)
        ]);
        setVehicle(vRes.vehicle);
        setReviews(rRes.reviews);
      } catch (err) {
        toast.error('Không thể tải thông tin xe');
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    };
    fetchData();
  }, [id]);

  const calculateDays = () => {
    if (!booking.startDate || !booking.endDate) return 0;
    return Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)) || 1;
  };

  const calculateTotal = () => {
    if (!booking.startDate || !booking.endDate) return 0;
    const days = calculateDays();
    const rentalFee = days * vehicle.pricePerDay;
    const depositAmount = vehicle.depositAmount || 0;
    return rentalFee + depositAmount;
  };

  const handleBookingRedirect = () => {
    if (!user) return navigate('/login');
    if (user.role !== 'ADMIN' && user.identity?.verifyStatus !== 'VERIFIED') {
        return toast.error('Vui lòng hoàn tất xác minh CCCD trong mục Profile để đặt xe!');
    }
    if (!booking.startDate || !booking.endDate) {
        return toast.error('Vui lòng chọn ngày thuê xe!');
    }
    navigate('/booking-confirm', { state: { vehicle, booking, total: calculateTotal() } });
  };

  const getBikeImage = (v) => {
    if (v.images?.[0] && !v.images[0].includes('placeholder')) return v.images[0];
    if (v.brand === 'Honda' && v.name.includes('Vision')) return 'honda_vision_elegant_white_1775322698498.png';
    if (v.brand === 'Honda' && v.name.includes('SH')) return 'featured_sh_mode_luxury_1775322188322.png';
    if (v.brand === 'Yamaha' && v.name.includes('Exciter')) return 'yamaha_exciter_premium_1775322605719.png';
    if (v.brand === 'Ducati' || v.name.includes('Panigale')) return 'ducati_panigale_red_glory_1775322630660.png';
    return 'hero_motorbike_neon_1775322140611.png';
 };

  if (loading) return <div className="flex-center" style={{ height: '100vh' }}><div className="loader"></div></div>;
  if (!vehicle) return <div className="container" style={{ paddingTop: '10rem', textAlign: 'center' }}><h2>Xe không tồn tại</h2></div>;

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Cinematic Header Section */}
      <section style={{ position: 'relative', height: '70vh', overflow: 'hidden' }}>
         <div style={{ 
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
            backgroundImage: `url(${getBikeImage(vehicle)})`, 
            backgroundSize: 'cover', backgroundPosition: 'center', 
            filter: 'blur(30px) brightness(0.4)', zIndex: 0 
         }} />
         
         <div className="container" style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', alignItems: 'center', gap: '4rem', paddingTop: '2rem' }}>
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} 
               animate={{ opacity: 1, scale: 1 }} 
               style={{ flex: 1.2, height: '80%', display: 'flex', alignItems: 'center' }}
            >
               <img 
                 src={getBikeImage(vehicle)} 
                 style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '32px', filter: 'drop-shadow(0 0 50px rgba(0,0,0,0.5))' }} 
               />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }} 
              animate={{ opacity: 1, x: 0 }} 
              style={{ flex: 0.8 }}
            >
               <span className="badge" style={{ background: 'var(--accent-gradient)', color: 'white', marginBottom: '1.5rem' }}>#{vehicle.brand || 'Premium'}</span>
               <h1 style={{ fontSize: '4.5rem', fontWeight: '900', marginBottom: '1rem', letterSpacing: '-2px' }}>{vehicle.name}</h1>
               
               <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '2rem', marginBottom: '2.5rem' }}>
                  <div className="flex-center" style={{ gap: '0.6rem' }}>
                     <Star size={24} color="#FFD700" fill="#FFD700" />
                     <span style={{ fontSize: '1.8rem', fontWeight: '800' }}>{vehicle.avgRating || 5.0}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                     <p style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Biển số</p>
                     <p style={{ fontWeight: '900', color: 'var(--text-primary)', fontSize: '1.2rem' }}>{vehicle.licensePlate}</p>
                  </div>
               </div>
               
               <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '1rem' }}><Share2 size={20} /></button>
                  <button className="btn btn-secondary" style={{ padding: '1rem' }}><Heart size={20} /></button>
                  <button className="btn btn-secondary" style={{ padding: '1rem 2rem', gap: '0.5rem' }}><ImageIcon size={20} /> Xem 12 ảnh</button>
               </div>
            </motion.div>
         </div>
      </section>

      {/* Main Content Area */}
      <section className="container" style={{ padding: '6rem 0', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '5rem' }}>
         <div style={{ gridColumn: 'span 1' }}>
            {/* Engineering Specs */}
            <h2 style={{ marginBottom: '3rem' }}>Thông số kỹ thuật <span className="text-gradient">Elite</span></h2>
            <div className="grid-3" style={{ gap: '2rem', marginBottom: '5rem' }}>
               <div className="glass-card" style={{ padding: '1.8rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                  <Zap color="var(--accent-primary)" style={{ marginBottom: '1.2rem' }} size={32} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Phân khối</p>
                  <p style={{ fontWeight: '900', fontSize: '1.4rem' }}>{vehicle.specs?.engine || '125cc'}</p>
               </div>
               <div className="glass-card" style={{ padding: '1.8rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                  <Activity color="var(--success)" style={{ marginBottom: '1.2rem' }} size={32} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Hộp số</p>
                  <p style={{ fontWeight: '900', fontSize: '1.4rem' }}>{vehicle.specs?.transmission || 'Tự động'}</p>
               </div>
               <div className="glass-card" style={{ padding: '1.8rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                  <Fuel color="var(--warning)" style={{ marginBottom: '1.2rem' }} size={32} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Tiêu thụ</p>
                  <p style={{ fontWeight: '900', fontSize: '1.4rem' }}>2.1L / 100km</p>
               </div>
            </div>

            {/* Description */}
            <h2 style={{ marginBottom: '1.5rem' }}>Mô tả trải nghiệm</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '2', marginBottom: '5rem' }}>
               {vehicle.description} Xe được bảo dưỡng định kỳ và kiểm tra kỹ thuật trước mỗi chuyến đi. 
               Hệ thống an toàn ABS tích hợp, lốp không săm cao cấp mang lại sự an tâm tuyệt đối khi cầm lái.
            </p>

            {/* Reviews System */}
            <div className="flex-between" style={{ marginBottom: '3rem' }}>
               <h2>Cộng đồng Ride Freedom <span className="text-gradient">({reviews.length})</span></h2>
               <div className="flex-center" style={{ gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <MessageCircle size={18} /> <span>Xem tất cả</span>
               </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
               {reviews.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>Chưa có đánh giá nào cho xe này. Hãy là người đầu tiên trải nghiệm!</p>
               ) : (
                  reviews.map((r, i) => (
                     <div key={i} className="glass-card" style={{ padding: '2rem', background: 'rgba(255,255,255,0.01)' }}>
                        <div className="flex-between" style={{ marginBottom: '1rem' }}>
                           <div className="flex-center" style={{ gap: '1rem' }}>
                              <div style={{ width: '45px', height: '45px', background: 'var(--accent-gradient)', borderRadius: '50%', color: 'white' }} className="flex-center">
                                 {r.userId?.fullName?.charAt(0) || 'U'}
                              </div>
                              <div>
                                 <p style={{ fontWeight: 'bold' }}>{r.userId?.fullName || 'Khách hàng Ride'}</p>
                                 <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.3rem' }}>
                                    {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= r.rating ? "#FFD700" : "none"} color={s <= r.rating ? "#FFD700" : "var(--text-muted)"} />)}
                                 </div>
                              </div>
                           </div>
                           <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)' }}>{r.comment}</p>
                     </div>
                  ))
               )}
            </div>
         </div>

         {/* Booking Panel */}
         <div style={{ gridColumn: 'span 1' }}>
            <motion.div 
               whileHover={{ boxShadow: '0 0 50px rgba(0, 240, 255, 0.15)' }}
               className="glass-card" 
               style={{ position: 'sticky', top: '120px', padding: '3rem', border: '1px solid rgba(0, 240, 255, 0.2)', background: 'rgba(255,255,255,0.02)' }}
            >
               <h3 style={{ marginBottom: '2.5rem', fontSize: '1.8rem' }}>Chọn lịch trình</h3>
               
               <div style={{ marginBottom: '2.5rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <Calendar size={18} color="var(--accent-primary)" /> Ngày nhận & trả xe
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                     <input type="date" className="form-input" value={booking.startDate} onChange={(e) => setBooking({...booking, startDate: e.target.value})} />
                     <input type="date" className="form-input" value={booking.endDate} onChange={(e) => setBooking({...booking, endDate: e.target.value})} />
                  </div>
               </div>

               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '20px', marginBottom: '3rem', border: '1px solid var(--glass-border)' }}>
                  <div className="flex-between" style={{ marginBottom: '1.2rem' }}>
                     <span style={{ color: 'var(--text-secondary)' }}>Đơn giá thuê</span>
                     <span style={{ fontWeight: 'bold' }}>{vehicle.pricePerDay.toLocaleString()}đ / ngày</span>
                  </div>
                  <div className="flex-between" style={{ marginBottom: '1.2rem' }}>
                     <span style={{ color: 'var(--text-secondary)' }}>Số ngày thuê</span>
                     <span style={{ fontWeight: 'bold' }}>{calculateDays()} ngày</span>
                  </div>
                  <div className="flex-between" style={{ marginBottom: '1.2rem' }}>
                     <span style={{ color: 'var(--text-secondary)' }}>Tiền thuê xe</span>
                     <span style={{ fontWeight: 'bold' }}>{(calculateDays() * vehicle.pricePerDay).toLocaleString()}đ</span>
                  </div>
                  <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                     <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                       <ShieldCheck size={14} color="var(--success)" />
                       Tiền cọc <small style={{ fontSize: '0.7rem', color: 'var(--success)' }}>(hoàn lại khi trả xe)</small>
                     </span>
                     <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>+{(vehicle.depositAmount || 0).toLocaleString()}đ</span>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1.5rem 0' }} />
                  <div className="flex-between">
                     <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '1.1rem' }}>TỔNG THANH TOÁN (VÍ)</span>
                     <span style={{ fontWeight: '900', fontSize: '2.5rem', color: 'var(--accent-primary)' }}>{calculateTotal().toLocaleString()}đ</span>
                  </div>
                  {vehicle.depositAmount > 0 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'right' }}>
                      Trong đó {(vehicle.depositAmount).toLocaleString()}đ sẽ được hoàn lại sau khi trả xe
                    </p>
                  )}
               </div>

               <button 
                 onClick={handleBookingRedirect}
                 className="btn btn-primary" 
                 style={{ width: '100%', padding: '1.4rem', fontSize: '1.1rem', borderRadius: '18px' }}
               >
                  Tiến hành Đặt đơn <ChevronRight size={22} />
               </button>

               <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--success)', fontSize: '0.9rem' }}>
                     <ShieldCheck size={20} /> <span>Bảo hiểm chuyến đi RideCare tích hợp</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--accent-primary)', fontSize: '0.9rem' }}>
                     <CheckCircle2 size={20} /> <span>Hỗ trợ kỹ thuật 24/7 toàn quốc</span>
                  </div>
               </div>
            </motion.div>
         </div>
      </section>
    </div>
  );
}
