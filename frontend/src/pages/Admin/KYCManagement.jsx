import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, ShieldCheck, ShieldAlert, Eye, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function KYCManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchKYC = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users', {
        params: { page, search }
      });
      setUsers(res.users);
      setTotalPages(res.totalPages);
    } catch (err) {
      toast.error('Không thể tải danh sách hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYC();
  }, [page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchKYC();
  };

  const handleVerifyIdentity = async (status) => {
    const finalReason = status === 'REJECTED' ? (rejectReason || selectedUser?.identity?.rejectReason) : '';
    if (status === 'REJECTED' && !finalReason?.trim()) {
       toast.error('Vui lòng nhập hoặc giữ lại lý do từ chối');
       return;
    }
    try {
      await api.put(`/admin/users/${selectedUser._id}/verify`, { 
        status, 
        reason: finalReason
      });
      toast.success(status === 'VERIFIED' ? 'Đã duyệt định danh' : 'Đã từ chối hồ sơ');
      setSelectedUser(null);
      setRejectReason('');
      fetchKYC();
    } catch (err) {
      toast.error('Thao tác duyệt thất bại');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s' }}>
      <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
        <div>
           <h1 className="text-gradient">Quản Lý KYC</h1>
           <p style={{ color: 'var(--text-secondary)' }}>Tiếp nhận và xác thực hồ sơ khách hàng (AI & Thủ công)</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Tổng số hồ sơ: <b style={{ color: 'white' }}>{users.length}</b>
          </div>

          <form className="flex-center" style={{ gap: '1rem' }} onSubmit={handleSearch}>
            <div className="glass-card flex-center" style={{ padding: '0.5rem 1rem', width: '300px' }}>
              <Search size={18} color="var(--text-secondary)" />
              <input 
                type="text" 
                placeholder="Tìm tên hoặc email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', padding: '0.5rem', width: '100%', outline: 'none' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Tìm</button>
          </form>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
        <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
            <tr>
              <th style={{ padding: '1.5rem' }}>Người dùng</th>
              <th>Ngày cập nhật</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'center' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center' }}>Đang tải hàng đợi...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Không tìm thấy hồ sơ nào.</td></tr>
            ) : users.map(user => (
              <tr key={user._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1.5rem' }}>
                  <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {user.fullName[0]}
                    </div>
                    <div>
                      <p style={{ fontWeight: '600' }}>{user.fullName}</p>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ color: 'var(--text-secondary)' }}>
                     {new Date(user.updatedAt).toLocaleDateString()}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${user.identity?.verifyStatus?.toLowerCase()}`}>
                    {user.identity?.verifyStatus === 'PENDING' ? 'Chờ duyệt' : 
                     user.identity?.verifyStatus === 'VERIFIED' ? 'Đã duyệt' : 'Bị từ chối'}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.5rem 1.5rem', margin: '0 auto' }}
                    onClick={() => {
                      setSelectedUser(user);
                      setRejectReason(user.identity?.rejectReason || '');
                    }}
                  >
                    <Eye size={16} style={{ marginRight: '0.5rem' }} /> Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex-center" style={{ marginTop: '2rem', gap: '1rem' }}>
        <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trang trước</button>
        <span>Trang {page} / {totalPages}</span>
        <button className="btn btn-secondary" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>Trang sau</button>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <div className="modal-overlay flex-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000 }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card" 
              style={{ width: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}
            >
              <button 
                onClick={() => setSelectedUser(null)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>

              <h2 className="text-gradient">Hồ sơ định danh</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Duyệt ảnh CCCD và Giấy phép lái xe của {selectedUser.fullName}</p>

              <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div>
                  <p className="form-label">Căn cước công dân (Mặt trước)</p>
                  <img src={selectedUser.identity?.cccdFront || 'https://via.placeholder.com/400x250?text=Chua+co+anh'} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--glass-border)' }} alt="CCCD Front" />
                </div>
                <div>
                  <p className="form-label">Giấy phép lái xe (GPLX)</p>
                  <img src={selectedUser.identity?.drivingLicense || 'https://via.placeholder.com/400x250?text=Chua+co+anh'} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--glass-border)' }} alt="Driving License" />
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--accent-primary)' }}>
                 <p className="form-label">Quyết định phê duyệt</p>
                 <div style={{ marginBottom: '1.5rem' }}>
                    <textarea 
                      className="form-input" 
                      placeholder="Ghi chú lý do từ chối (Chỉ cần thiết nếu từ chối)..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      style={{ height: '100px' }}
                    />
                 </div>
                 <div className="flex-center" style={{ gap: '1.5rem' }}>
                    <button className="btn btn-primary" style={{ width: '200px' }} onClick={() => handleVerifyIdentity('VERIFIED')}>
                      <ShieldCheck size={20} /> Phê duyệt hợp lệ
                    </button>
                    <button className="btn btn-secondary" style={{ width: '200px' }} onClick={() => handleVerifyIdentity('REJECTED')}>
                      <ShieldAlert size={20} /> Từ chối hồ sơ
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
