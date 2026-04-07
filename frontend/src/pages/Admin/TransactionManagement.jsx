import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Search, Filter, CheckCircle, XCircle, 
  ArrowUpRight, ArrowDownLeft, Wallet, 
  History, User, Calendar, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function TransactionManagement() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL | PENDING | SUCCESS | FAILED
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transactions/wallet/all');
      setTransactions(res.transactions);
    } catch (err) {
      toast.error('Không thể tải danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Xác nhận đã chuyển khoản thành công cho khách hàng?')) return;
    try {
      await api.put(`/transactions/wallet/approve-withdraw/${id}`);
      toast.success('Đã phê duyệt rút tiền thành công');
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Lý do từ chối (Tiền sẽ được hoàn lại ví khách):');
    if (reason === null) return;
    try {
      await api.put(`/transactions/wallet/reject-withdraw/${id}`, { reason });
      toast.success('Đã từ chối và hoàn tiền thành công');
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = filter === 'ALL' || t.status === filter;
    const matchesSearch = 
      t.userId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t._id.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'SUCCESS': return '#00e676';
      case 'PENDING': return '#ffb300';
      case 'FAILED': return '#ff5252';
      default: return 'var(--text-secondary)';
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'DEPOSIT': return <ArrowDownLeft size={18} color="#00e676" />;
      case 'WITHDRAW': return <ArrowUpRight size={18} color="#ff5252" />;
      case 'PAY': return <ExternalLink size={18} color="#7000ff" />;
      case 'REFUND': return <History size={18} color="#00f0ff" />;
      case 'RECEIVE': return <CheckCircle size={18} color="#00e676" />;
      default: return <Wallet size={18} />;
    }
  };

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="flex-between" style={{ marginBottom: '3rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: '900' }}>Quản lý Giao dịch</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Theo dõi dòng tiền & phê duyệt các yêu cầu rút tiền.</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid-4" style={{ gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Chờ duyệt rút tiền</p>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#ffb300' }}>
            {transactions.filter(t => t.type === 'WITHDRAW' && t.status === 'PENDING').length}
          </h2>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Tổng nạp (Thành công)</p>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#00e676' }}>
            {transactions.filter(t => t.type === 'DEPOSIT' && t.status === 'SUCCESS').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}đ
          </h2>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Tổng rút (Đã duyệt)</p>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#ff5252' }}>
            {transactions.filter(t => t.type === 'WITHDRAW' && t.status === 'SUCCESS').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}đ
          </h2>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Số dư toàn hệ thống</p>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--accent-primary)' }}>
            {(transactions.filter(t => t.type === 'DEPOSIT' && t.status === 'SUCCESS').reduce((acc, curr) => acc + curr.amount, 0) - 
              transactions.filter(t => t.type === 'WITHDRAW' && t.status === 'SUCCESS').reduce((acc, curr) => acc + curr.amount, 0)).toLocaleString()}đ
          </h2>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
          <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Tìm theo tên khách, email, mã GD..." 
            style={{ paddingLeft: '45px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex-center" style={{ gap: '10px' }}>
          <Filter size={18} color="var(--text-muted)" />
          {['ALL', 'PENDING', 'SUCCESS', 'FAILED'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              {f === 'ALL' ? 'Tất cả' : f === 'PENDING' ? 'Chờ duyệt' : f === 'SUCCESS' ? 'Hoàn tất' : 'Đã huỷ'}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '1.5rem' }}>Giao dịch</th>
              <th style={{ padding: '1.5rem' }}>Khách hàng</th>
              <th style={{ padding: '1.5rem' }}>Số tiền</th>
              <th style={{ padding: '1.5rem' }}>Ngày tạo</th>
              <th style={{ padding: '1.5rem' }}>Trạng thái</th>
              <th style={{ padding: '1.5rem' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode='popLayout'>
              {filteredTransactions.map((t) => (
                <motion.tr 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key={t._id} 
                  style={{ borderBottom: '1px solid var(--glass-border)' }}
                >
                  <td style={{ padding: '1.5rem' }}>
                    <div className="flex-center" style={{ gap: '1rem', justifyContent: 'flex-start' }}>
                      <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }} className="flex-center">
                        {getIcon(t.type)}
                      </div>
                      <div>
                        <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>{t.description}</p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {t._id.slice(-8).toUpperCase()}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 'bold' }} className="flex-center">
                        {t.userId?.fullName?.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{t.userId?.fullName}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.userId?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.5rem' }}>
                    <strong style={{ fontSize: '1.1rem', color: ['DEPOSIT', 'REFUND', 'RECEIVE'].includes(t.type) ? '#00e676' : '#ff5252' }}>
                      {['DEPOSIT', 'REFUND', 'RECEIVE'].includes(t.type) ? '+' : '-'}{t.amount.toLocaleString()}đ
                    </strong>
                  </td>
                  <td style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <Calendar size={14} />
                      {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td style={{ padding: '1.5rem' }}>
                    <span 
                      className={`badge badge-${t.status === 'SUCCESS' ? 'success' : t.status === 'PENDING' ? 'warning' : 'error'}`}
                      style={{ fontSize: '0.7rem' }}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td style={{ padding: '1.5rem' }}>
                    {t.type === 'WITHDRAW' && t.status === 'PENDING' ? (
                      <div className="flex-center" style={{ gap: '10px' }}>
                        <button 
                          onClick={() => handleApprove(t._id)}
                          className="btn btn-primary" 
                          style={{ padding: '0.5rem', background: '#00e676' }}
                          title="Duyệt rút tiền"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button 
                          onClick={() => handleReject(t._id)}
                          className="btn btn-primary" 
                          style={{ padding: '0.5rem', background: '#ff5252' }}
                          title="Từ chối"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    ) : (
                      <button 
                         className="btn btn-secondary" 
                         style={{ padding: '0.5rem' }}
                         onClick={() => setSelectedTx(t)}
                      >
                         Chi tiết
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {filteredTransactions.length === 0 && !loading && (
          <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <History size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
            <p>Không tìm thấy giao dịch nào phù hợp.</p>
          </div>
        )}
      </div>

      {/* Modal chi tiết giao dịch */}
      <AnimatePresence>
        {selectedTx && (
          <div className="flex-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, backdropFilter: 'blur(10px)' }}>
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="glass-card" 
               style={{ width: '90%', maxWidth: '500px', padding: '3rem' }}
             >
                <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <History color="var(--accent-primary)" /> Chi tiết Giao dịch
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   <div className="flex-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Mã giao dịch</span>
                      <strong>#{selectedTx._id}</strong>
                   </div>
                   <div className="flex-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Khách hàng</span>
                      <strong>{selectedTx.userId?.fullName}</strong>
                   </div>
                   <div className="flex-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Loại</span>
                      <strong style={{ color: getStatusColor(selectedTx.status) }}>{selectedTx.type}</strong>
                   </div>
                   <div className="flex-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Số tiền</span>
                      <strong style={{ fontSize: '1.5rem' }}>{selectedTx.amount.toLocaleString()}đ</strong>
                   </div>
                   <div className="flex-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Số dư trước GD</span>
                      <span>{selectedTx.balanceBefore.toLocaleString()}đ</span>
                   </div>
                   <div className="flex-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Số dư sau GD</span>
                      <span>{selectedTx.balanceAfter.toLocaleString()}đ</span>
                   </div>
                   <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Nhiệm vụ/Mô tả:</p>
                      <p style={{ fontWeight: '600' }}>{selectedTx.description}</p>
                   </div>
                </div>

                <button onClick={() => setSelectedTx(null)} className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }}>Đóng</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
