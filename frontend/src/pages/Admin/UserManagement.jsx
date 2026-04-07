import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { Search, ShieldCheck, ShieldAlert, Lock, Unlock, Eye, X, Trash2, Filter, Edit2, Save, MoreHorizontal, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', role: '' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users', {
        params: { page, search, role: filterRole }
      });
      setUsers(res.users);
      setTotalPages(res.totalPages);
    } catch (err) {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      await api.put(`/admin/users/${user._id}/status`, { status: newStatus });
      toast.success(`${newStatus === 'LOCKED' ? 'Khoá' : 'Mở khoá'} thành công`);
      fetchUsers();
    } catch (err) {
      toast.error('Thao tác thất bại');
    }
  };

  const handleVerifyKYC = async (userId, status) => {
    try {
      const reason = status === 'VERIFIED' ? 'Hồ sơ hợp lệ' : 'Hồ sơ mờ hoặc không chính xác';
      await api.put(`/admin/users/${userId}/verify`, { status, reason });
      toast.success(status === 'VERIFIED' ? 'Đã duyệt KYC' : 'Đã từ chối KYC');
      fetchUsers();
    } catch (err) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setEditForm({ fullName: user.fullName, phone: user.phone || '', role: user.role });
    setIsEditing(false);
  };

  const handleUpdateUserInfo = async () => {
    try {
      setSaving(true);
      await api.put(`/admin/users/${selectedUser._id}`, editForm);
      toast.success('Cập nhật thành công');
      setIsEditing(false);
      fetchUsers();
      setSelectedUser({ ...selectedUser, ...editForm });
    } catch (err) {
      toast.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-container" style={{ animation: 'fadeIn 0.5s' }}>
      <div className="flex-between" style={{ marginBottom: '3rem' }}>
         <div>
            <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: '900' }}>Trung tâm Quản trị Người dùng</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Quản lý định danh, số dư và quyền hạn toàn hệ thống</p>
         </div>
         
         <div className="glass-card flex-center" style={{ padding: '0.6rem 1.2rem', minWidth: '350px', borderRadius: 'var(--border-radius-pill)' }}>
            <Search size={20} color="var(--text-muted)" />
            <input 
               type="text" 
               placeholder="Tìm theo tên hoặc email..." 
               value={search}
               onChange={(e) => { setSearch(e.target.value); setPage(1); }}
               style={{ background: 'transparent', border: 'none', color: 'white', padding: '0.5rem', width: '100%', outline: 'none' }}
            />
         </div>
      </div>

      {/* Unified Control Panel */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
         <div className="flex-center" style={{ gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Phân quyền:</span>
            <select className="form-input" style={{ width: '150px', marginBottom: 0 }} value={filterRole} onChange={e => {setFilterRole(e.target.value); setPage(1);}}>
               <option value="">Tất cả</option>
               <option value="USER">Người dùng</option>
               <option value="ADMIN">Quản trị viên</option>
            </select>
         </div>
         <div className="flex-center" style={{ gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tổng số người dùng: <b>{users.length}</b></span>
         </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
        <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <tr>
              <th style={{ padding: '1.5rem' }}>Người dùng</th>
              <th>Số dư ví</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '5rem', textAlign: 'center' }}><div className="flex-center" style={{ flexDirection: 'column', gap: '1rem' }}><div className="spinner"></div> Đang tải dữ liệu...</div></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Không tìm thấy người dùng nào</td></tr>
            ) : users.map(user => (
              <tr key={user._id} className="table-row-hover" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td style={{ padding: '1.2rem 1.5rem' }}>
                  <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: user.role === 'ADMIN' ? 'var(--accent-gradient)' : 'linear-gradient(135deg, #333, #111)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {user.fullName[0]}
                    </div>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '1rem' }}>{user.fullName}</p>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</span>
                    </div>
                  </div>
                </td>
                <td style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{user.walletBalance?.toLocaleString() || 0}đ</td>
                <td>
                   <span className="badge" style={{ background: user.role === 'ADMIN' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255,255,255,0.05)', color: user.role === 'ADMIN' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>{user.role}</span>
                </td>
                <td>
                  <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                     <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: user.status === 'ACTIVE' ? 'var(--success)' : 'var(--error)' }}></div>
                     <span style={{ fontSize: '0.9rem', color: user.status === 'ACTIVE' ? 'var(--text-primary)' : 'var(--error)' }}>{user.status === 'ACTIVE' ? 'Hoạt động' : 'Khoá'}</span>
                  </div>
                </td>
                <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                  <div className="flex-center" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button onClick={() => openUserModal(user)} className="btn" style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.05)', border: 'none' }} title="Chi tiết"><Eye size={18} /></button>
                    <button onClick={() => handleToggleStatus(user)} className="btn" style={{ padding: '0.4rem', background: user.status === 'ACTIVE' ? 'rgba(255, 140, 0, 0.1)' : 'rgba(0, 230, 118, 0.1)', color: user.status === 'ACTIVE' ? '#FF8C00' : 'var(--success)', border: 'none' }}>
                       {user.status === 'ACTIVE' ? <Lock size={18} /> : <Unlock size={18} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex-center" style={{ marginTop: '2.5rem', gap: '1rem' }}>
        <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trang trước</button>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Trang <b>{page}</b> / {totalPages}</span>
        <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Trang sau</button>
      </div>

      {/* User Modal Details */}
      <AnimatePresence>
        {selectedUser && (
          <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card" style={{ width: '650px', padding: '2.5rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedUser(null)}><X size={24} /></button>
              
              <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1.5rem', marginBottom: '2.5rem' }}>
                 <div style={{ width: '100px', height: '100px', borderRadius: '24px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: 'white', border: '3px solid rgba(255,255,255,0.1)' }}>{selectedUser.fullName[0]}</div>
                 <div style={{ flex: 1 }}>
                    {isEditing ? (
                       <input className="form-input" style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }} value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} />
                    ) : (
                       <h2 style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>{selectedUser.fullName}</h2>
                    )}
                    <p style={{ color: 'var(--text-secondary)' }}>ID: {selectedUser._id}</p>
                 </div>
                 {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="btn btn-secondary"><Edit2 size={16} /> Sửa</button>
                 ) : (
                    <button onClick={handleUpdateUserInfo} disabled={saving} className="btn btn-primary"><Save size={16} /> Lưu</button>
                 )}
              </div>

              <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
                 <div className="glass-card" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)' }}>
                    <p className="form-label" style={{ marginBottom: '0.5rem' }}>Số điện thoại</p>
                    {isEditing ? (
                       <input className="form-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                    ) : (
                       <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{selectedUser.phone || 'N/A'}</p>
                    )}
                 </div>
                 <div className="glass-card" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)' }}>
                    <p className="form-label" style={{ marginBottom: '0.5rem' }}>Số dư ví hiện tại</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{selectedUser.walletBalance?.toLocaleString() || 0} VNĐ</p>
                 </div>
                 <div className="glass-card" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)' }}>
                    <p className="form-label" style={{ marginBottom: '0.5rem' }}>Quyền hạn</p>
                    {isEditing ? (
                       <select className="form-input" value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                       </select>
                    ) : (
                       <span className="badge">{selectedUser.role}</span>
                    )}
                 </div>
                 <div className="glass-card" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)' }}>
                    <p className="form-label" style={{ marginBottom: '0.5rem' }}>Trạng thái xác minh</p>
                    <span className={`badge badge-${selectedUser.identity?.verifyStatus === 'VERIFIED' ? 'success' : 'pending'}`}>{selectedUser.identity?.verifyStatus || 'UNVERIFIED'}</span>
                 </div>
              </div>

              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={20} color="var(--accent-primary)" /> Tài liệu định danh</h3>
              <div className="grid-2" style={{ gap: '1.5rem' }}>
                 <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>CCCD / Hộ chiếu</p>
                    {selectedUser.identity?.cccdFront ? (
                       <img src={selectedUser.identity.cccdFront} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    ) : <div style={{ height: '180px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chưa tải lên</div>}
                 </div>
                 <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Giấy phép lái xe</p>
                    {selectedUser.identity?.drivingLicense ? (
                       <img src={selectedUser.identity.drivingLicense} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    ) : <div style={{ height: '180px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chưa tải lên</div>}
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
