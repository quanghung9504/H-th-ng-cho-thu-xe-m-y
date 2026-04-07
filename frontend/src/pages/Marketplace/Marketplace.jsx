import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  ShoppingCart, Percent, TrendingDown, Eye, 
  Trash2, Package, Tag, Clock, ChevronRight, Info, History, User as UserIcon, Phone, MapPin,
  Star, X, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const SkeletonListing = () => (
   <div className="glass-card" style={{ padding: '0', height: '480px' }}>
      <div className="skeleton" style={{ width: '100%', height: '220px' }}></div>
      <div style={{ padding: '2rem' }}>
         <div className="skeleton" style={{ width: '120px', height: '25px', marginBottom: '1.5rem' }}></div>
         <div className="skeleton" style={{ width: '80%', height: '30px', marginBottom: '1.5rem' }}></div>
         <div className="skeleton" style={{ width: '100%', height: '80px', borderRadius: '12px', marginBottom: '2rem' }}></div>
         <div className="grid-2" style={{ gap: '1rem' }}>
            <div className="skeleton" style={{ height: '45px' }}></div>
            <div className="skeleton" style={{ height: '45px' }}></div>
         </div>
      </div>
   </div>
);

const ListingDetailModal = ({ listing, onClose, onBuy, getBikeImage }) => {
   const { user } = useAuth();
   if (!listing) return null;
   const { vehicleId: v, sellerId: s, orderId: o } = listing;

   const renderStars = (rating) => {
      return (
         <div className="flex-center" style={{ gap: '2px', justifyContent: 'flex-start' }}>
            {[1, 2, 3, 4, 5].map((star) => (
               <Star 
                  key={star} 
                  size={14} 
                  fill={star <= Math.round(rating) ? "var(--accent-primary)" : "none"} 
                  color={star <= Math.round(rating) ? "var(--accent-primary)" : "var(--text-muted)"} 
               />
            ))}
            <span style={{ marginLeft: '8px', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{rating}</span>
         </div>
      );
   };

   return (
      <motion.div 
         initial={{ opacity: 0 }} 
         animate={{ opacity: 1 }} 
         exit={{ opacity: 0 }}
         className="modal-overlay"
         onClick={onClose}
         style={{ zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      >
         <motion.div 
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            className="glass-card"
            onClick={e => e.stopPropagation()}
            style={{ width: '90%', maxWidth: '1000px', padding: '0', overflow: 'hidden', border: '1px solid var(--glass-border)' }}
         >
            <button className="btn-close" onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, background: 'rgba(255,255,255,0.1)', border: 'none', padding: '10px', borderRadius: '50%' }}>
               <X size={20} />
            </button>

            <div className="flex" style={{ flexWrap: 'wrap' }}>
               {/* Left Side: Vehicle Info */}
               <div style={{ flex: '1 1 500px', padding: '3rem', borderRight: '1px solid var(--glass-border)' }}>
                  <div style={{ position: 'relative', height: '350px', borderRadius: '24px', overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                     <img src={getBikeImage(v)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', padding: '0.8rem 1.5rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Biển kiểm soát</p>
                        <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{v?.licensePlate}</p>
                     </div>
                  </div>

                  <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{v?.name}</h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>{v?.description || 'Dòng xe cao cấp với hiệu năng vượt trội, mang lại trải nghiệm lái tuyệt vời trên mọi cung đường.'}</p>

                  <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
                     <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '16px' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Thương hiệu</p>
                        <p style={{ fontWeight: 'bold' }}>{v?.brand}</p>
                     </div>
                     <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '16px' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Năm sản xuất</p>
                        <p style={{ fontWeight: 'bold' }}>{v?.year}</p>
                     </div>
                  </div>

                  <div style={{ background: 'var(--accent-gradient)', padding: '1.5rem', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                        <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Giá cọc gốc</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{listing.originalDeposit.toLocaleString()}đ</p>
                     </div>
                     <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.2)' }}></div>
                     <div>
                        <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Giá mua lại</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{listing.sellingPrice.toLocaleString()}đ</p>
                     </div>
                  </div>
               </div>

               {/* Right Side: Seller Info */}
               <div style={{ flex: '1 1 350px', padding: '3rem', background: 'rgba(0, 240, 255, 0.02)' }}>
                  <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                     <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.5rem' }}>
                        <img 
                           src={s?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop'} 
                           style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--accent-primary)', boxShadow: '0 0 30px rgba(0, 240, 255, 0.2)' }} 
                        />
                        {s?.identity?.verifyStatus === 'VERIFIED' && (
                           <div style={{ position: 'absolute', bottom: '5px', right: '5px', background: 'var(--accent-primary)', color: 'black', padding: '5px', borderRadius: '50%', border: '3px solid #0a0a0a' }}>
                              <ShieldCheck size={18} strokeWidth={3} />
                           </div>
                        )}
                     </div>
                     <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{s?.fullName}</h3>
                     <div className="flex-center" style={{ marginBottom: '1rem' }}>
                        {renderStars(s?.sellerRating || 5.0)}
                     </div>
                     <span className="badge" style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-primary)', padding: '0.5rem 1.25rem', fontSize: '0.75rem' }}>
                        {s?.totalSales || 0} Giao dịch thành công
                     </span>
                  </div>

                  <div style={{ gap: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                     <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Thông tin liên hệ</p>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', marginBottom: '0.8rem' }}>
                           <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Số điện thoại</p>
                           <p style={{ fontWeight: 'bold' }}>{s?.phone || '09x.xxx.xxxx'}</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                           <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Email</p>
                           <p style={{ fontWeight: 'bold' }}>{s?.email}</p>
                        </div>
                     </div>

                     <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Lịch trình thuê</p>
                        <div style={{ background: 'rgba(0, 240, 255, 0.05)', padding: '1.2rem', borderRadius: '16px', border: '1px solid rgba(0, 240, 255, 0.1)' }}>
                           <div className="flex-between" style={{ marginBottom: '0.8rem' }}>
                              <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Bắt đầu:</span>
                              <span style={{ fontWeight: 'bold' }}>{new Date(o?.startDate).toLocaleDateString('vi-VN')}</span>
                           </div>
                           <div className="flex-between" style={{ marginBottom: '0.8rem' }}>
                              <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Kết thúc:</span>
                              <span style={{ fontWeight: 'bold' }}>{new Date(o?.endDate).toLocaleDateString('vi-VN')}</span>
                           </div>
                           <div className="flex-between" style={{ borderTop: '1px solid rgba(0, 240, 255, 0.1)', paddingTop: '0.8rem' }}>
                              <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Tổng cộng:</span>
                              <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{o?.totalDays} Ngày</span>
                           </div>
                        </div>
                     </div>

                     <button 
                        onClick={() => {
                           onBuy(listing._id, listing.sellingPrice);
                           onClose();
                        }} 
                        disabled={s?._id === user?.id}
                        className="btn btn-primary" 
                        style={{ 
                            width: '100%', padding: '1.5rem', fontSize: '1.1rem', borderRadius: '16px',
                            background: s?._id === user?.id ? '#475569' : 'var(--accent-gradient)',
                            cursor: s?._id === user?.id ? 'not-allowed' : 'pointer'
                        }}
                     >
                        {s?._id === user?.id ? 'Suất cọc của bạn' : 'Mua ngay suất cọc này'}
                     </button>
                     <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                        Giao dịch được bảo vệ và xử lý tức thì qua ví điện tử.
                     </p>
                  </div>
               </div>
            </div>
         </motion.div>
      </motion.div>
   );
};

export default function Marketplace() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transactions/marketplace');
      
      if (user) {
         setListings(res.listings.filter(l => l.sellerId?._id !== user.id));
         setMyListings(res.listings.filter(l => l.sellerId?._id === user.id));
      } else {
         setListings(res.listings);
      }
    } catch (err) {
      toast.error('Không thể tải dữ liệu thị trường');
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  const handleBuy = async (id, price) => {
    if (user && user.walletBalance < price) {
       return toast.error('Số dư ví không đủ, vui lòng nạp thêm tiền!');
    }

    if (window.confirm('Xác nhận mua lại suất cọc này? Tiền sẽ được trừ trực tiếp từ ví của bạn.')) {
      try {
        await api.post(`/transactions/marketplace/${id}/buy`);
        toast.success('Mua thành công! Kiểm tra đơn hàng trong Profile của bạn.');
        fetchData();
        const userRes = await api.get('/users/profile');
        setUser(userRes.user);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Giao dịch thất bại');
      }
    }
  };

  const handleCancelListing = async (id) => {
     if (window.confirm('CẢNH BÁO: Khi gỡ bài đăng, bạn sẽ bị phạt mất 100% tiền cọc ban đầu của đơn hàng này. Bạn có chắc chắn?')) {
        try {
           await api.delete(`/transactions/marketplace/${id}`);
           toast.success('Đã gỡ bài đăng. Hình phạt tiền cọc đã được áp dụng.');
           fetchData();
           const userRes = await api.get('/users/profile');
           setUser(userRes.user);
        } catch (err) {
           toast.error(err.response?.data?.message || 'Gỡ bài thất bại');
        }
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
      <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
        <motion.div initial={{ opacity: 0, y: -25 }} animate={{ opacity: 1, y: 0 }}>
           <h1 className="text-gradient" style={{ fontSize: '4.5rem', fontWeight: '900', letterSpacing: '-3px' }}>Chợ Săn Cọc</h1>
           <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '800px', margin: '1.5rem auto' }}>
              Cơ hội sở hữu những cung đường dang dở. Tiết kiệm tới <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>40%</span> giá trị cọc gốc.
           </p>
        </motion.div>
      </div>

      <div className="flex-center" style={{ gap: '0.5rem', marginBottom: '5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '32px', width: 'fit-content', margin: '0 auto 5rem' }}>
          <button 
            className={`btn ${activeTab === 'browse' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.8rem 3rem', border: 'none', backgroundColor: activeTab === 'browse' ? 'var(--accent-primary)' : 'rgba(0,0,0,0)' }}
            onClick={() => setActiveTab('browse')}
          >
             Chợ săn cọc
          </button>
          {user && (
            <button 
               className={`btn ${activeTab === 'my' ? 'btn-primary' : 'btn-secondary'}`}
               style={{ padding: '0.8rem 3rem', border: 'none', backgroundColor: activeTab === 'my' ? 'var(--accent-primary)' : 'rgba(0,0,0,0)' }}
               onClick={() => setActiveTab('my')}
            >
               Bài đăng của tôi
            </button>
          )}
      </div>

      <AnimatePresence mode="wait">
         {loading ? (
            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid-3">
               {[1,2,3].map(i => <SkeletonListing key={i} />)}
            </motion.div>
         ) : (
            <motion.div 
               key={activeTab} 
               initial={{ opacity: 0, x: 20 }} 
               animate={{ opacity: 1, x: 0 }} 
               exit={{ opacity: 0, x: -20 }}
               className="grid-3" 
               style={{ gap: '3rem' }}
            >
               {activeTab === 'browse' ? (
                  listings.length === 0 ? (
                     <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '10rem 0' }}>
                        <History size={64} color="var(--text-muted)" style={{ marginBottom: '2rem' }} />
                        <h3>Chợ đang vắng khách</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Hiện chưa có suất cọc nào được rao bán. Hãy quay lại sau nhé!</p>
                     </div>
                  ) : (
                     listings.map(l => (
                        <motion.div 
                          key={l._id} 
                          className="glass-card" 
                          style={{ padding: '0', overflow: 'hidden', borderBottom: '4px solid var(--accent-primary)' }}
                          whileHover={{ y: -15, boxShadow: '0 30px 60px rgba(0, 240, 255, 0.15)' }}
                        >
                           <div style={{ position: 'relative', height: '240px' }}>
                              <img src={getBikeImage(l.vehicleId)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', top: 20, left: 20, background: 'linear-gradient(135deg, #ff4d00, #ff9d00)', padding: '0.6rem 1.2rem', borderRadius: '30px', fontWeight: '900', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 5px 15px rgba(255, 77, 0, 0.4)' }}>
                                 <Percent size={14} /> GIẢM 40%
                              </div>
                           </div>
                           
                           <div style={{ padding: '2rem' }}>
                              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                 <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>ID: {l.orderId?.orderCode || 'ORD-XYZ'}</span>
                                 <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{l.vehicleId?.brand}</span>
                              </div>
                              <h3 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{l.vehicleId?.name}</h3>
                              
                              <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                 <span>BKS: {l.vehicleId?.licensePlate}</span>
                                 <span>•</span>
                                 <span>Đời {l.vehicleId?.year}</span>
                                 <span>•</span>
                                 <span>{l.vehicleId?.pricePerDay?.toLocaleString() || 200000}đ/ngày</span>
                              </div>

                              <div style={{ background: 'rgba(0, 240, 255, 0.03)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(0, 240, 255, 0.1)' }}>
                                 <div className="flex-center" style={{ gap: '1rem', justifyContent: 'flex-start' }}>
                                    <img src={l.sellerId?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop'} alt="Seller" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--glass-border)' }} />
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                       <div className="flex-center" style={{ gap: '6px', justifyContent: 'flex-start' }}>
                                          <p style={{ fontWeight: 'bold', fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{l.sellerId?.fullName}</p>
                                          {l.sellerId?.identity?.verifyStatus === 'VERIFIED' && <ShieldCheck size={14} color="var(--accent-primary)" fill="var(--accent-primary)" stroke="black" />}
                                       </div>
                                       <div className="flex-center" style={{ gap: '4px', justifyContent: 'flex-start' }}>
                                          <Star size={10} fill="var(--accent-primary)" color="var(--accent-primary)" />
                                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.sellerId?.sellerRating || 5.0}</span>
                                       </div>
                                    </div>
                                    <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', color: 'var(--accent-primary)', opacity: 0.8 }}>
                                       <UserIcon size={16} />
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="flex-center" style={{ gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '16px', marginBottom: '2rem' }}>
                                 <div style={{ flex: 1, textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Lịch thuê</p>
                                    <p style={{ fontWeight: '800', fontSize: '0.95rem', marginTop: '0.3rem' }}>{new Date(l.orderId?.startDate).toLocaleDateString('vi-VN')}</p>
                                 </div>
                                 <div style={{ width: '1px', height: '30px', background: 'var(--glass-border)' }}></div>
                                 <div style={{ flex: 1, textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Số ngày</p>
                                    <p style={{ fontWeight: '800', fontSize: '0.95rem', marginTop: '0.3rem' }}>{l.orderId?.totalDays || 1} Ngày</p>
                                 </div>
                              </div>

                              <div style={{ background: 'rgba(0, 240, 255, 0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(0, 240, 255, 0.1)', marginBottom: '2rem' }}>
                                 <div className="flex-between">
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Giá cọc gốc:</span>
                                    <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>{l.originalDeposit.toLocaleString()}đ</span>
                                 </div>
                                 <div className="flex-between" style={{ marginTop: '0.8rem' }}>
                                    <span style={{ fontWeight: 'bold' }}>Giá mua lại:</span>
                                    <span style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--accent-primary)', textShadow: '0 0 20px rgba(0, 240, 255, 0.3)' }}>{l.sellingPrice.toLocaleString()}đ</span>
                                 </div>
                              </div>

                              <div className="grid-2" style={{ gap: '1rem' }}>
                                 <button onClick={() => setSelectedListing(l)} className="btn btn-secondary" style={{ padding: '1rem' }}>
                                    <Eye size={18} /> Chi tiết
                                 </button>
                                 {l.sellerId?._id === user?.id ? (
                                    <button disabled className="btn btn-secondary" style={{ padding: '1rem', background: '#334155', color: 'white', opacity: 0.8, cursor: 'not-allowed' }}>
                                       Của bạn
                                    </button>
                                 ) : (
                                    <button onClick={() => handleBuy(l._id, l.sellingPrice)} className="btn btn-primary" style={{ padding: '1rem' }}>
                                       Mua ngay
                                    </button>
                                 )}
                              </div>
                           </div>
                        </motion.div>
                     ))
                  )
               ) : (
                  myListings.length === 0 ? (
                     <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '10rem 0' }}>
                        <Package size={64} color="var(--text-muted)" style={{ marginBottom: '2rem' }} />
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Bạn chưa đăng rao bán suất cọc nào.</p>
                        <Link to="/my-orders" className="btn btn-primary" style={{ marginTop: '2rem' }}>Đăng bán ngay</Link>
                     </div>
                  ) : (
                     myListings.map(l => (
                        <motion.div key={l._id} className="glass-card" style={{ padding: '2.5rem', background: 'rgba(255, 23, 102, 0.02)', border: '1px solid rgba(255, 23, 102, 0.1)' }}>
                           <div className="flex-between" style={{ marginBottom: '2rem' }}>
                              <img src={getBikeImage(l.vehicleId)} style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover' }} />
                              <div style={{ textAlign: 'right' }}>
                                 <span className="badge" style={{ background: 'var(--danger)', color: 'white' }}>ĐANG RAO BÁN</span>
                                 <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}><Clock size={12} /> {new Date(l.expiredAt).toLocaleDateString('vi-VN')}</p>
                              </div>
                           </div>
                           
                           <h3 style={{ marginBottom: '2rem' }}>{l.vehicleId?.name}</h3>
                           
                           <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2.5rem' }}>
                              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                 <span style={{ color: 'var(--text-secondary)' }}>Giá đăng bán:</span>
                                 <span style={{ fontWeight: '900', color: 'var(--accent-primary)', fontSize: '1.4rem' }}>{l.sellingPrice.toLocaleString()}đ</span>
                              </div>
                              <div style={{ padding: '0.8rem', background: 'rgba(255, 82, 82, 0.05)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--danger)', display: 'flex', gap: '0.5rem' }}>
                                 <Info size={14} style={{ flexShrink: 0 }} />
                                 <span>Gỡ bài đồng nghĩa với việc bạn chấp nhận mất {l.originalDeposit.toLocaleString()}đ tiền cọc.</span>
                              </div>
                           </div>

                           <button 
                             className="btn btn-secondary" 
                             style={{ width: '100%', color: 'var(--danger)', borderColor: 'rgba(255, 23, 102, 0.2)', padding: '1.2rem' }}
                             onClick={() => handleCancelListing(l._id)}
                           >
                              <Trash2 size={18} /> Gỡ bài đăng & Chấp nhận phạt
                           </button>
                        </motion.div>
                     ))
                  )
               )}
            </motion.div>
         )}
      </AnimatePresence>

      <AnimatePresence>
         {selectedListing && (
            <ListingDetailModal 
               listing={selectedListing} 
               onClose={() => setSelectedListing(null)} 
               onBuy={handleBuy}
               getBikeImage={getBikeImage}
            />
         )}
      </AnimatePresence>
    </div>
  );
}
