import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Search, Filter, CheckCircle, Clock, 
  XCircle, RotateCcw, ChevronRight, Eye, X, Bike
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/orders', {
        params: { page, status: filterStatus }
      });
      setOrders(res.orders);
      setTotalPages(res.totalPages);
    } catch (err) {
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, filterStatus]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status });
      toast.success(`Đã chuyển trạng thái sang ${status}`);
      fetchOrders();
      if (selectedOrder) setSelectedOrder(null);
    } catch (err) {
      toast.error('Thao tác thất bại');
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason) return toast.error('Vui lòng nhập lý do huỷ');
    try {
      await api.put(`/admin/orders/${selectedOrder._id}/cancel`, { reason: cancelReason });
      toast.success('Đã huỷ đơn hàng và hoàn tiền (nếu có)');
      setSelectedOrder(null);
      setCancelReason('');
      fetchOrders();
    } catch (err) {
      toast.error('Thao tác thất bại');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="badge badge-pending">Chờ duyệt</span>;
      case 'CONFIRMED': return <span className="badge badge-success" style={{ background: 'rgba(0, 230, 118, 0.1)', color: 'var(--success)' }}>Đã duyệt</span>;
      case 'RENTING': return <span className="badge badge-warning">Đang thuê</span>;
      case 'COMPLETED': return <span className="badge badge-success">Hoàn tất</span>;
      case 'CANCELLED': return <span className="badge badge-error">Đã huỷ</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient">Quản lý đơn hàng</h1>
        <div className="flex-center" style={{ gap: '1rem' }}>
          <div className="flex-center" style={{ gap: '0.5rem' }}>
            <Filter size={18} color="var(--text-secondary)" />
            <span style={{ color: 'var(--text-secondary)' }}>Lọc:</span>
          </div>
          <select 
            className="form-input" 
            style={{ width: '200px', marginBottom: 0 }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="CONFIRMED">Đã duyệt</option>
            <option value="RENTING">Đang thuê</option>
            <option value="COMPLETED">Hoàn tất</option>
            <option value="CANCELLED">Đã huỷ</option>
          </select>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
        <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
            <tr>
              <th style={{ padding: '1.5rem' }}>Mã đơn / Ngày đặt</th>
              <th>Khách hàng</th>
              <th>Xe thuê</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center' }}>Đang tải đơn hàng...</td></tr>
            ) : orders.map(order => (
              <tr key={order._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1.5rem' }}>
                  <p style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>#{order.orderCode}</p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </td>
                <td>
                   <p style={{ fontWeight: '600' }}>{order.userId?.fullName}</p>
                   <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.userId?.phone}</span>
                </td>
                <td>
                   <p style={{ fontWeight: '600' }}>{order.vehicleId?.name}</p>
                   <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.vehicleId?.brand}</span>
                </td>
                <td>
                   <p style={{ fontWeight: '700' }}>{order.totalAmount.toLocaleString()}đ</p>
                   <span style={{ fontSize: '0.7rem', color: order.paymentStatus === 'PAID' ? 'var(--success)' : 'var(--error)' }}>
                      {order.paymentStatus === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                   </span>
                </td>
                <td>{getStatusBadge(order.status)}</td>
                <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setSelectedOrder(order)}>
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex-center" style={{ marginTop: '2rem', gap: '1rem' }}>
        <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trang trước</button>
        <span>Trang {page} / {totalPages}</span>
        <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Trang sau</button>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="modal-overlay flex-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000 }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card" 
              style={{ width: '700px', padding: '2.5rem', position: 'relative' }}
            >
              <button 
                onClick={() => setSelectedOrder(null)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'white' }}
              >
                <X size={24} />
              </button>

              <h2 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Chi tiết đơn hàng #{selectedOrder.orderCode}</h2>
              <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem', marginBottom: '2rem' }}>
                 {getStatusBadge(selectedOrder.status)}
                 <span style={{ color: 'var(--text-secondary)' }}>Phương thức: {selectedOrder.paymentMethod}</span>
              </div>

              <div className="grid-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
                 <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }}>Thông tin thuê</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                       <div className="flex-between"><span>Ngày bắt đầu:</span> <b>{new Date(selectedOrder.startDate).toLocaleDateString('vi-VN')}</b></div>
                       <div className="flex-between"><span>Ngày kết thúc:</span> <b>{new Date(selectedOrder.endDate).toLocaleDateString('vi-VN')}</b></div>
                       <div className="flex-between"><span>Số ngày:</span> <b>{selectedOrder.totalDays} ngày</b></div>
                       <div className="flex-between"><span>Tiền cọc xe:</span> <b>{selectedOrder.depositAmount.toLocaleString()}đ</b></div>
                    </div>
                 </div>
                 <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }}>Ghi chú</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{selectedOrder.note || 'Không có ghi chú nào.'}</p>
                 </div>
              </div>

              {/* Actions Section */}
              <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--glass-border)' }}>
                 <h4 style={{ marginBottom: '1.5rem' }}>Cập nhật đơn hàng</h4>
                 
                 {selectedOrder.status === 'PENDING' && (
                    <div className="flex-center" style={{ gap: '1rem' }}>
                       <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleUpdateStatus(selectedOrder._id, 'CONFIRMED')}>
                          <CheckCircle size={18} /> Phê duyệt đơn
                       </button>
                    </div>
                 )}

                 {selectedOrder.status === 'CONFIRMED' && (
                    <div className="flex-center" style={{ gap: '1rem' }}>
                       <button className="btn btn-primary" style={{ flex: 1, background: 'var(--warning)' }} onClick={() => handleUpdateStatus(selectedOrder._id, 'RENTING')}>
                          <Bike size={18} /> Bàn giao xe
                       </button>
                    </div>
                 )}

                 {selectedOrder.status === 'RENTING' && (
                    <div className="flex-center" style={{ gap: '1rem' }}>
                       <button className="btn btn-primary" style={{ flex: 1, background: 'var(--success)' }} onClick={() => handleUpdateStatus(selectedOrder._id, 'COMPLETED')}>
                          <CheckCircle size={18} /> Hoàn tất trả xe
                       </button>
                    </div>
                 )}

                 {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                       <label className="form-label">Huỷ đơn hàng (Hoàn tiền ví nếu đã thanh toán)</label>
                       <div className="flex-center" style={{ gap: '1rem' }}>
                          <input 
                            type="text" className="form-input" placeholder="Lý do huỷ..." 
                            style={{ marginBottom: 0 }} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                          />
                          <button className="btn btn-secondary" style={{ color: 'var(--error)' }} onClick={handleCancelOrder}>
                             <XCircle size={18} /> Huỷ đơn
                          </button>
                       </div>
                    </div>
                 )}

                 {(selectedOrder.status === 'COMPLETED' || selectedOrder.status === 'CANCELLED') && (
                    <div className="flex-center" style={{ gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                       <CheckCircle size={24} color="var(--success)" />
                       <p>Đơn hàng này đã kết thúc, không thể thay đổi thêm.</p>
                    </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
