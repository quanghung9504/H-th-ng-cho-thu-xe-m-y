import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Edit2, Trash2, X, Upload, Bike, Tag, EyeOff, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    categoryId: '',
    pricePerDay: '',
    licensePlate: '',
    status: 'AVAILABLE',
    specs: {
      engine: '',
      year: '',
      fuel: 'Gasoline'
    },
    images: [],
    imagePreviews: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, cRes] = await Promise.all([
        api.get('/fleet/vehicles'),
        api.get('/fleet/categories')
      ]);
      setVehicles(vRes.vehicles);
      setCategories(cRes.categories);
    } catch (err) {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.images.length > 5) {
      return toast.error('Tối đa 5 ảnh cho mỗi xe');
    }

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setFormData({ 
      ...formData, 
      images: [...formData.images, ...files], 
      imagePreviews: [...formData.imagePreviews, ...newPreviews] 
    });
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    const newPreviews = [...formData.imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setFormData({ ...formData, images: newImages, imagePreviews: newPreviews });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('brand', formData.brand);
    data.append('categoryId', formData.categoryId);
    data.append('pricePerDay', formData.pricePerDay);
    data.append('licensePlate', formData.licensePlate);
    data.append('status', formData.status);
    data.append('specs', JSON.stringify(formData.specs));
    
    formData.images.forEach(img => {
      data.append('images', img);
    });

    try {
      if (editingVehicle) {
        await api.put(`/fleet/vehicles/${editingVehicle._id}`, data);
        toast.success('Cập nhật xe thành công');
      } else {
        await api.post('/fleet/vehicles', data);
        toast.success('Thêm xe mới thành công');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá xe này sẽ ảnh hưởng đến lịch sử đơn hàng. Bạn chắc chắn?')) return;
    try {
      await api.delete(`/fleet/vehicles/${id}`);
      toast.success('Đã xoá xe');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xoá xe');
    }
  };

  const resetForm = () => {
    setEditingVehicle(null);
    setFormData({
      name: '', brand: '', categoryId: '', pricePerDay: '', licensePlate: '', status: 'AVAILABLE',
      specs: { engine: '', year: '', fuel: 'Gasoline' },
      images: [], imagePreviews: []
    });
  };

  const openModal = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        name: vehicle.name,
        brand: vehicle.brand,
        categoryId: vehicle.categoryId?._id || vehicle.categoryId,
        pricePerDay: vehicle.pricePerDay,
        licensePlate: vehicle.licensePlate || '',
        status: vehicle.status,
        specs: {
           engine: vehicle.specs?.engine || '',
           year: vehicle.specs?.year || '',
           fuel: vehicle.specs?.fuel || 'Gasoline'
        },
        images: [],
        imagePreviews: vehicle.images || []
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient">Quản lý đội xe</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={20} /> Thêm xe mới
        </button>
      </div>

      <div className="glass-card" style={{ padding: 0, overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
        <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
            <tr>
              <th style={{ padding: '1.5rem' }}>Xe & Hình ảnh</th>
              <th>Hãng / Loại</th>
              <th>Giá thuê</th>
              <th>Biển số</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center' }}>Đang tải đội xe...</td></tr>
            ) : vehicles.map(v => (
              <tr key={v._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                    <img 
                      src={v.images[0] || 'https://via.placeholder.com/60x40'} 
                      style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <div>
                      <p style={{ fontWeight: '600' }}>{v.name}</p>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {v._id.slice(-6)}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <p>{v.brand}</p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)' }}>{v.categoryId?.name}</span>
                </td>
                <td>{v.pricePerDay.toLocaleString()}đ</td>
                <td>{v.licensePlate || 'N/A'}</td>
                <td>
                  <span className={`badge badge-${v.status === 'AVAILABLE' ? 'success' : v.status === 'RENTING' ? 'warning' : 'error'}`}>
                    {v.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                  <div className="flex-center" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => openModal(v)}>
                      <Edit2 size={18} />
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem', color: 'var(--error)' }} onClick={() => handleDelete(v._id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay flex-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000 }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card" 
              style={{ width: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem' }}
            >
              <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <h2 className="text-gradient">{editingVehicle ? 'Cập nhật xe' : 'Thêm xe mới'}</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid-2" style={{ gap: '2rem' }}>
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Tên xe</label>
                    <input type="text" className="form-input" required 
                      value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label className="form-label">Hãng xe</label>
                      <input type="text" className="form-input" required 
                        value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} />
                    </div>
                    <div>
                      <label className="form-label">Danh mục</label>
                      <select className="form-input" required
                        value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})}>
                        <option value="">Chọn danh mục</option>
                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Giá thuê / ngày (VNĐ)</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" 
                        className="form-input" 
                        required 
                        placeholder="Ví dụ: 500000"
                        style={{ fontSize: '1.2rem', fontWeight: '700', padding: '1rem', color: 'var(--accent-primary)', border: '2px solid var(--glass-border)' }}
                        value={formData.pricePerDay} 
                        onChange={(e) => setFormData({...formData, pricePerDay: e.target.value})} 
                      />
                      <span style={{ position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--text-secondary)' }}>đ/ngày</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Biển số xe</label>
                    <input type="text" className="form-input" required 
                      value={formData.licensePlate} onChange={(e) => setFormData({...formData, licensePlate: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Trạng thái</label>
                    <select className="form-input" 
                      value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                      <option value="AVAILABLE">Sẵn sàng (Available)</option>
                      <option value="RENTING">Đang thuê (Renting)</option>
                      <option value="HIDDEN">Ẩn xe (Hidden)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h4 style={{ marginBottom: '1rem' }}>Thông số kỹ thuật</h4>
                  <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label className="form-label">Động cơ</label>
                      <input type="text" className="form-input" placeholder="Ví dụ: 155cc"
                        value={formData.specs.engine} onChange={(e) => setFormData({...formData, specs: {...formData.specs, engine: e.target.value}})} />
                    </div>
                    <div>
                      <label className="form-label">Năm sản xuất</label>
                      <input type="number" className="form-input" placeholder="Ví dụ: 2023"
                        value={formData.specs.year} onChange={(e) => setFormData({...formData, specs: {...formData.specs, year: e.target.value}})} />
                    </div>
                  </div>

                  <h4 style={{ marginBottom: '1rem' }}>Hình ảnh (Tối đa 5 ảnh)</h4>
                  <div className="grid-3" style={{ gap: '1rem', marginBottom: '1rem' }}>
                    {formData.imagePreviews.map((src, i) => (
                      <div key={i} style={{ position: 'relative', width: '100%', height: '80px' }}>
                        <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                        <button 
                          type="button"
                          onClick={() => removeImage(i)}
                          style={{ position: 'absolute', top: -5, right: -5, background: 'var(--error)', border: 'none', borderRadius: '50%', color: 'white', width: '20px', height: '20px' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {formData.imagePreviews.length < 5 && (
                      <div 
                        onClick={() => document.getElementById('vehicle-images').click()}
                        style={{ border: '2px dashed var(--glass-border)', borderRadius: '8px', cursor: 'pointer', height: '80px' }}
                        className="flex-center"
                      >
                        <Upload size={20} color="var(--text-secondary)" />
                        <input id="vehicle-images" type="file" hidden multiple accept="image/*" onChange={handleFileChange} />
                      </div>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>* Ảnh đầu tiên sẽ là ảnh đại diện chính của xe.</p>
                </div>

                <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                    {editingVehicle ? 'Lưu cập nhật' : 'Thêm xe vào hệ thống'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
