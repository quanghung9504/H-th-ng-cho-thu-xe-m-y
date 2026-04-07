import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Package, Calendar, TrendingDown, 
  Trash2, ChevronRight, Clock, CheckCircle2, AlertCircle, ShoppingBag, Plus, User as UserIcon, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import ReviewModal from '../../components/ReviewModal';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewedOrderIds, setReviewedOrderIds] = useState(new Set());

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transactions/orders/my');
      setOrders(res.orders);
      
      // Load review status for all completed orders
      const completedOrders = (res.orders || []).filter(o => o.status === 'COMPLETED');
      if (completedOrders.length > 0) {
        try {
          const reviewRes = await api.get('/reviews/my-reviews');
          const reviewedIds = new Set((reviewRes.reviews || []).map(r => r.orderId?.toString()));
          setReviewedOrderIds(reviewedIds);
        } catch (e) {}
      }
    } catch (err) {
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('CẢNH BÁO: Huỷ đơn PENDING sẽ khiến bạn mất 100% tiền cọc. Bạn có chắc chắn muốn huỷ?')) {
      try {
        await api.delete(`/transactions/orders/${id}`);
        toast.success('Đã huỷ đơn hàng. Hệ thống đã xử lý phạt cọc theo chính sách.');
        fetchOrders();
      } catch (err) {
        toast.error('Huỷ đơn thất bại');
      }
    }
  };

  const handleListForSale = async (orderId) => {
    if (window.confirm('Xác nhận đăng rao bán suất cọc này lên Marketplace? Sau khi đăng, đơn hàng của bạn sẽ tạm thời bị khoá để chờ người mua.')) {
      try {
        await api.post('/transactions/marketplace', { orderId });
        toast.success('Đã đăng rao bán suất cọc thành công!');
        fetchOrders();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Không thể đăng bán');
      }
    }
  };

  const getStatusBadge = (status) => {
    const sMap = {
      PENDING: { color: 'var(--warning)', label: 'CHỜ DUYỆT', icon: <Clock size={14}/> },
      CONFIRMED: { color: 'var(--pending)', label: 'ĐÃ XÁC NHẬN', icon: <CheckCircle2 size={14}/> },
      RENTING: { color: 'var(--accent-primary)', label: 'ĐANG THUÊ', icon: <TrendingDown size={14}/> },
      COMPLETED: { color: 'var(--success)', label: 'HOÀN THÀNH', icon: <CheckCircle2 size={14}/> },
      CANCELLED: { color: 'var(--danger)', label: 'ĐÃ HUỶ', icon: <AlertCircle size={14}/> },
      LISTED_FOR_SALE: { color: '#FF8C00', label: 'ĐANG RAO BÁN', icon: <ShoppingBag size={14}/> }
    };
    const s = sMap[status] || sMap.PENDING;
    return (
      <span className="badge" style={{ background: 'rgba(255,255,255,0.02)', color: s.color, border: `1px solid ${s.color}`, display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        {s.icon} {s.label}
      </span>
    );
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
       <div className="flex-between" style={{ marginBottom: '5rem' }}>
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
             <h1 className="text-gradient" style={{ fontSize: '3.5rem', fontWeight: '900', letterSpacing: '-2px' }}>Hành trình của tôi</h1>
             <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Quản lý và theo dõi lịch sử thuê xe cá nhân</p>
          </motion.div>
          <div className="glass-card flex-center" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--border-radius-pill)', gap: '1rem' }}>
             <div className="flex-center" style={{ gap: '0.5rem', paddingRight: '1rem', borderRight: '1px solid var(--glass-border)' }}>
               <span style={{ color: 'var(--text-secondary)' }}>Tổng đơn: </span>
               <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{orders.length}</span>
             </div>
             <Link to="/fleet" className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
               <Plus size={16}/> Thuê tiếp
             </Link>
             <Link to="/profile" className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
               <UserIcon size={16}/> Hồ sơ
             </Link>
          </div>
       </div>

       <AnimatePresence mode="wait">
          {loading ? (
             <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid-2">
                {[1,2,3,4].map(i => <div key={i} className="glass-card skeleton" style={{ height: '350px' }}></div>)}
             </motion.div>
          ) : orders.length === 0 ? (
             <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card flex-center" style={{ height: '400px', flexDirection: 'column' }}>
                <Package size={64} style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
                <h3>Bạn chưa có chuyến đi nào</h3>
                <Link to="/fleet" className="btn btn-primary" style={{ marginTop: '2rem' }}>Khám phá đội xe ngay</Link>
             </motion.div>
          ) : (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {orders.map((o, idx) => {
                  const alreadyReviewed = reviewedOrderIds.has(o._id?.toString());
                  return (
                    <motion.div 
                      key={o._id} 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="glass-card" 
                      style={{ padding: '0', overflow: 'hidden', borderLeft: `6px solid ${idx % 2 === 0 ? 'var(--accent-primary)' : 'var(--accent-secondary)'}` }}
                    >
                       <div className="grid-4" style={{ gridTemplateColumns: '1.2fr 2fr 1.5fr 1fr', gap: 0 }}>
                          {/* Part 1: Vehicle Image */}
                          <div style={{ height: '100%', overflow: 'hidden' }}>
                             <img src={getBikeImage(o.vehicleId)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>

                          {/* Part 2: Order Info */}
                          <div style={{ padding: '2.5rem' }}>
                             <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.8rem', marginBottom: '1rem' }}>
                                {getStatusBadge(o.status)}
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>#{o.orderCode}</span>
                             </div>
                             <h3 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>{o.vehicleId?.name}</h3>
                             
                             <div className="grid-2" style={{ gap: '2rem' }}>
                                <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                                   <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}><Calendar size={18} color="var(--accent-primary)" /></div>
                                   <div>
                                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nhận xe</p>
                                      <p style={{ fontWeight: 'bold' }}>{new Date(o.startDate).toLocaleDateString('vi-VN')}</p>
                                   </div>
                                </div>
                                <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                                   <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}><Calendar size={18} color="var(--accent-secondary)" /></div>
                                   <div>
                                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Trả xe</p>
                                      <p style={{ fontWeight: 'bold' }}>{new Date(o.endDate).toLocaleDateString('vi-VN')}</p>
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* Part 3: Financials */}
                          <div style={{ padding: '2.5rem', background: 'rgba(255,255,255,0.015)', borderLeft: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                             <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tổng thanh toán</p>
                             <p style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--accent-primary)' }}>{o.totalAmount.toLocaleString()}đ</p>
                             <p style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: '0.5rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <CheckCircle2 size={14} /> {o.paymentMethod} {o.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                             </p>
                          </div>

                          {/* Part 4: Actions */}
                          <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', justifyContent: 'center' }}>
                             {o.status === 'PENDING' && (
                                <button onClick={() => handleCancel(o._id)} className="btn btn-secondary" style={{ width: '100%', color: 'var(--danger)', borderColor: 'rgba(255, 23, 68, 0.2)' }}>
                                   <Trash2 size={18} /> Huỷ đơn
                                </button>
                             )}
                             
                             {(o.status === 'PENDING' || o.status === 'CONFIRMED') && (
                                <button onClick={() => handleListForSale(o._id)} className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #FF8C00, #FFA500)', boxShadow: '0 5px 15px rgba(255, 140, 0, 0.3)' }}>
                                   <TrendingDown size={18} /> Rao bán cọc
                                </button>
                             )}

                             {/* Nút đánh giá - chỉ hiện khi COMPLETED và chưa đánh giá */}
                             {o.status === 'COMPLETED' && !alreadyReviewed && (
                                <button 
                                  onClick={() => { setSelectedOrder(o); setShowReview(true); }}
                                  className="btn btn-primary" 
                                  style={{ width: '100%', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                                >
                                   <Star size={18} /> Đánh giá xe
                                </button>
                             )}

                             {o.status === 'COMPLETED' && alreadyReviewed && (
                                <div style={{ 
                                  padding: '0.7rem 1rem', borderRadius: '12px',
                                  background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
                                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                                  fontSize: '0.85rem', color: '#f59e0b', fontWeight: '600'
                                }}>
                                  <Star size={16} fill="#f59e0b" /> Đã đánh giá
                                </div>
                             )}
                          </div>
                       </div>
                    </motion.div>
                  );
                })}
             </motion.div>
          )}
       </AnimatePresence>

       {showReview && selectedOrder && (
          <ReviewModal
            isOpen={showReview}
            order={selectedOrder}
            onClose={() => { setShowReview(false); setSelectedOrder(null); }}
            onReviewSuccess={(orderId) => {
              setReviewedOrderIds(prev => new Set([...prev, orderId]));
              fetchOrders();
            }}
          />
       )}
    </div>
  );
}
