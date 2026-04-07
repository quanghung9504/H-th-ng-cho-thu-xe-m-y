import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null,
    imagePreview: ''
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fleet/categories');
      setCategories(res.categories);
    } catch (err) {
      toast.error('Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ 
        ...formData, 
        image: file, 
        imagePreview: URL.createObjectURL(file) 
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    if (formData.image) data.append('image', formData.image);

    try {
      if (editingCategory) {
        await api.put(`/fleet/categories/${editingCategory._id}`, data);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await api.post('/fleet/categories', data);
        toast.success('Thêm danh mục mới thành công');
      }
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', image: null, imagePreview: '' });
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá danh mục này?')) return;
    try {
      await api.delete(`/fleet/categories/${id}`);
      toast.success('Đã xoá danh mục');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xoá danh mục');
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        image: null,
        imagePreview: category.image
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', image: null, imagePreview: '' });
    }
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-gradient">Quản lý danh mục</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={20} /> Thêm danh mục
        </button>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: '40vh' }}>Đang tải danh mục...</div>
      ) : (
        <div className="grid-3" style={{ gap: '1.5rem' }}>
          {categories.map(cat => (
            <motion.div 
              key={cat._id}
              className="glass-card"
              style={{ padding: '1.5rem', position: 'relative' }}
              whileHover={{ y: -5 }}
            >
              <div className="flex-center" style={{ 
                width: '100%', 
                height: '150px', 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: 'var(--border-radius-sm)',
                marginBottom: '1.5rem',
                overflow: 'hidden'
              }}>
                <img 
                  src={cat.image || 'https://via.placeholder.com/200x150?text=Icon'} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  alt={cat.name}
                />
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>{cat.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', height: '40px', overflow: 'hidden' }}>
                {cat.description}
              </p>
              
              <div className="flex-center" style={{ gap: '1rem', marginTop: '1.5rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => openModal(cat)}>
                  <Edit2 size={16} /> Sửa
                </button>
                <button className="btn btn-secondary" style={{ flex: 1, color: 'var(--error)' }} onClick={() => handleDelete(cat._id)}>
                  <Trash2 size={16} /> Xoá
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay flex-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000 }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card" 
              style={{ width: '500px', padding: '2rem' }}
            >
              <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <h2 className="text-gradient">
                  {editingCategory ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}
                </h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'white' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Tên danh mục</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Mô tả</label>
                  <textarea 
                    className="form-input" 
                    style={{ height: '100px' }}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label className="form-label">Ảnh minh hoạ</label>
                  <div 
                    onClick={() => document.getElementById('cat-image').click()}
                    style={{ 
                      width: '100%', 
                      height: '150px', 
                      borderRadius: 'var(--border-radius-sm)', 
                      border: '2px dashed var(--glass-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {formData.imagePreview ? (
                      <img src={formData.imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <>
                        <Upload size={32} color="var(--text-secondary)" />
                        <span style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Chọn ảnh để upload</span>
                      </>
                    )}
                    <input id="cat-image" type="file" hidden accept="image/*" onChange={handleFileChange} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  {editingCategory ? 'Lưu thay đổi' : 'Thêm ngay'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
