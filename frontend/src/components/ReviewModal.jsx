import { useState } from 'react';
import { Star, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ReviewModal({ isOpen, onClose, order, onReviewSuccess }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return toast.error('Vui lòng nhập nhận xét của bạn');

    try {
      setLoading(true);
      await api.post('/reviews', {
        orderId: order._id,
        vehicleId: order.vehicleId._id,
        rating,
        comment
      });
      toast.success('Cảm ơn bạn đã đánh giá!');
      onReviewSuccess(order._id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay flex-center" style={{ zIndex: 1000 }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-card" 
            style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', position: 'relative' }}
          >
            <button 
              onClick={onClose} 
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
               <X size={24} />
            </button>

            <div className="text-center" style={{ marginBottom: '2rem' }}>
               <h2 className="text-gradient">Đánh giá chuyến đi</h2>
               <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Trải nghiệm của bạn về chiếc {order.vehicleId?.name} thế nào?</p>
            </div>

            <form onSubmit={handleSubmit}>
               {/* Star Rating */}
               <div className="flex-center" style={{ gap: '0.8rem', marginBottom: '2.5rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                     <button
                        key={star}
                        type="button"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none' }}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                     >
                        <Star 
                           size={42} 
                           fill={(hover || rating) >= star ? "#FFD700" : "none"} 
                           color={(hover || rating) >= star ? "#FFD700" : "var(--text-secondary)"} 
                           style={{ transition: 'all 0.2s' }}
                        />
                     </button>
                  ))}
               </div>

               <div style={{ marginBottom: '2rem' }}>
                  <label className="form-label flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                     <MessageSquare size={16} /> Nhận xét chi tiết
                  </label>
                  <textarea 
                     className="form-input" 
                     placeholder="Chia sẻ trải nghiệm thực tế của bạn..."
                     style={{ height: '120px', padding: '1rem' }}
                     value={comment}
                     onChange={(e) => setComment(e.target.value)}
                     required
                  />
               </div>

               <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                  disabled={loading}
               >
                  {loading ? 'Đang gửi...' : 'Hoàn tất đánh giá'}
               </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
