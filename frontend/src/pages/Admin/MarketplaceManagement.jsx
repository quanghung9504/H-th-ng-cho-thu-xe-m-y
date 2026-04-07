import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Tag, Trash2, ShoppingCart, 
  ExternalLink, User, XCircle, Info, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function MarketplaceManagement() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  
  const [selectedListing, setSelectedListing] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/marketplace', {
        params: { status: filterStatus }
      });
      setListings(res.listings);
    } catch (err) {
      toast.error('Không thể tải danh sách bài đăng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [filterStatus]);

  const handleCancelListing = async () => {
    if (!cancelReason) return toast.error('Vui lòng nhập lý do gỡ bài');
    try {
      await api.put(`/admin/marketplace/${selectedListing._id}/cancel`, { reason: cancelReason });
      toast.success('Đã gỡ bài đăng và thông báo cho người bán');
      setSelectedListing(null);
      setCancelReason('');
      fetchListings();
    } catch (err) {
      toast.error('Thao tác thất bại');
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient">Quản lý sàn săn cọc</h1>
        <select 
          className="form-input" 
          style={{ width: '200px', marginBottom: 0 }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tất cả bài đăng</option>
          <option value="OPEN">Đang mở (OPEN)</option>
          <option value="SOLD">Đã khớp (SOLD)</option>
          <option value="CANCELLED">Đã huỷ (CANCELLED)</option>
        </select>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: '40vh' }}>Đang tải danh sách...</div>
      ) : (
        <div className="grid-3" style={{ gap: '1.5rem' }}>
          {listings.map(listing => (
            <motion.div 
              key={listing._id}
              className="glass-card"
              style={{ padding: '1.5rem', position: 'relative' }}
              whileHover={{ y: -5 }}
            >
              <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <span className={`badge badge-${listing.status === 'OPEN' ? 'success' : listing.status === 'SOLD' ? 'pending' : 'error'}`}>
                   {listing.status}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phí sàn: {listing.platformFee.toLocaleString()}đ</span>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                 <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Người đăng:</p>
                 <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <User size={16} color="var(--accent-primary)" />
                    <b>{listing.sellerId?.fullName}</b>
                 </div>
              </div>

              <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', marginBottom: '1.5rem' }}>
                 <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem' }}>Giá gốc đơn:</span>
                    <span style={{ fontWeight: '600' }}>{(listing.orderId?.totalAmount || 0).toLocaleString()}đ</span>
                 </div>
                 <div className="flex-between" style={{ color: 'var(--accent-primary)' }}>
                    <span>Giá chuyển nhượng:</span>
                    <span style={{ fontWeight: '800', fontSize: '1.2rem' }}>{(listing.sellingPrice || 0).toLocaleString()}đ</span>
                 </div>
              </div>

              <div className="flex-center" style={{ gap: '0.8rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedListing(listing)}>
                  <Info size={16} /> Chi tiết
                </button>
                {listing.status === 'OPEN' && (
                  <button className="btn" style={{ background: 'rgba(255, 82, 82, 0.1)', color: 'var(--error)', border: 'none', padding: '0.8rem' }} onClick={() => setSelectedListing(listing)}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {listings.length === 0 && (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
               Không có bài đăng nào phù hợp.
            </div>
          )}
        </div>
      )}

      {/* Action Modal */}
      <AnimatePresence>
        {selectedListing && (
          <div className="modal-overlay flex-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000 }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card" 
              style={{ width: '500px', padding: '2.5rem', position: 'relative' }}
            >
              <button 
                onClick={() => setSelectedListing(null)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'white' }}
              >
                <X size={24} />
              </button>

              <h2 className="text-gradient" style={{ marginBottom: '1.5rem' }}>Chi tiết tin đăng</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                 <div className="flex-between"><span>Mã đơn gốc:</span> <b>{selectedListing.orderId ? `#${selectedListing.orderId._id.slice(-8)}` : 'N/A'}</b></div>
                 <div className="flex-between"><span>Người sở hữu:</span> <b>{selectedListing.sellerId?.email}</b></div>
                 <div className="flex-between"><span>Ngày đăng bài:</span> <b>{new Date(selectedListing.createdAt).toLocaleDateString('vi-VN')}</b></div>
                 <div className="flex-between"><span>Mô tả:</span> <b>{selectedListing.description || 'N/A'}</b></div>
              </div>

              {selectedListing.status === 'OPEN' && (
                 <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--error)' }}>
                    <h4 style={{ marginBottom: '1.5rem', color: 'var(--error)' }}>Gỡ bài đăng vi phạm</h4>
                    <div style={{ marginBottom: '1.5rem' }}>
                       <textarea 
                         className="form-input" 
                         placeholder="Nhập lý do gỡ bài để thông báo cho người dùng..."
                         value={cancelReason}
                         onChange={(e) => setCancelReason(e.target.value)}
                         style={{ height: '100px' }}
                       />
                    </div>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', background: 'var(--error)' }}
                      onClick={handleCancelListing}
                    >
                      <XCircle size={20} /> Xác nhận gỡ bài
                    </button>
                 </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
